"""Offline, standard-library annual FCFF replay. All money USD million; no market price target input."""
import argparse,csv,json,math,pathlib
P=pathlib.Path(__file__).resolve().parent
SEGMENTS=('mobility','delivery','freight')
ARRAYS=tuple(f'{s}_{k}' for s in SEGMENTS for k in ('growth','revenue_ratio'))+('ebit_bookings_margin','da_revenue_ratio','gross_reinvestment_revenue_ratio')
CLAIMS=('existing_option_value_reserve','debt_total_value','finance_lease_claim','nonredeemable_nci_claim','redeemable_nci_claim','legacy_legal_regulatory_tax_claim','income_other_tax_claim','additional_mixed_and_derivative_claim','investment_and_vehicle_commitment_net_cost_reserve','additional_other_claim')
def number(v,name,lo=None,hi=None):
 if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v):raise ValueError(f'{name}: finite number required')
 if lo is not None and v<lo:raise ValueError(f'{name}: below {lo}')
 if hi is not None and v>hi:raise ValueError(f'{name}: above {hi}')
 return v

def validate(inputs):
 if inputs['valuation_anchor']!='2026-06-30' or inputs['forecast_periods']!=10:raise ValueError('This engine requires frozen June anchor and ten full annual buckets')
 for k,v in inputs['anchors'].items():number(v,'anchor.'+k,0)
 if inputs['anchors']['unrestricted_cash_and_short_investments']!=5391:raise ValueError('June unrestricted liquidity is a frozen reported anchor, not an editable scenario input')
 for name,c in inputs['cases'].items():
  number(c['wacc'],name+'.wacc',.01,.5);number(c['terminal_growth'],name+'.g',0,.08)
  if c['wacc']<=c['terminal_growth']:raise ValueError('WACC must exceed g')
  number(c['terminal_roic'],name+'.terminal_roic',.01,1)
  if c['terminal_roic']<=c['terminal_growth']:raise ValueError('Terminal ROIC must exceed growth')
  number(c['cash_tax_rate'],name+'.cash_tax_rate',.15,.5)
  number(c['incremental_noninsurance_nwc_revenue_ratio'],name+'.nwc',0,1)
  number(c['insurance_reserve_to_mobility_bookings'],name+'.insurance',.01,.5)
  number(c['collateral_to_insurance_reserve'],name+'.collateral',.8,1.5)
  for field in ARRAYS:
   x=c[field]
   if not isinstance(x,list) or len(x)!=10:raise ValueError(field+': ten annual inputs required')
   for v in x:number(v,name+'.'+field,-.8 if field.endswith('growth') else 0,1.5 if field.endswith('revenue_ratio') else .8)
 return inputs

def compute_case(inputs,c):
 a=inputs['anchors'];prev={s:a[s+'_bookings'] for s in SEGMENTS};prev_rev=a['revenue'];prev_res=a['insurance_reserves'];prev_col=a['restricted_pool_proxy'];rows=[]
 for i in range(10):
  b={s:prev[s]*(1+c[s+'_growth'][i]) for s in SEGMENTS};r={s:b[s]*c[s+'_revenue_ratio'][i] for s in SEGMENTS};gb=sum(b.values());rev=sum(r.values());ebit=gb*c['ebit_bookings_margin'][i];tax=max(ebit,0)*c['cash_tax_rate'];nopat=ebit-tax;da=rev*c['da_revenue_ratio'][i];capex=rev*c['gross_reinvestment_revenue_ratio'][i];nwc=(rev-prev_rev)*c['incremental_noninsurance_nwc_revenue_ratio'];res=b['mobility']*c['insurance_reserve_to_mobility_bookings'];col=res*c['collateral_to_insurance_reserve'];dr=res-prev_res;dc=col-prev_col;netreinvestment=capex-da+nwc+dc-dr;fcff=nopat-netreinvestment;discount=(1+c['wacc'])**(i+1)
  row={'year_index':i+1,'period_start':f'{2026+i}-07-01','period_end':f'{2027+i}-06-30',**{s+'_bookings':b[s] for s in SEGMENTS},**{s+'_revenue':r[s] for s in SEGMENTS},'gross_bookings':gb,'revenue':rev,'gaap_ebit_after_sbc':ebit,'cash_operating_tax':tax,'nopat':nopat,'operating_da_addback':da,'gross_operating_asset_reinvestment':capex,'delta_noninsurance_nwc':nwc,'insurance_reserve_end':res,'required_restricted_pool_end':col,'delta_insurance_reserve':dr,'delta_restricted_pool':dc,'net_reinvestment':netreinvestment,'fcff':fcff,'discount_exponent_years':i+1,'discount_factor':1/discount,'pv_fcff':fcff/discount,'ebit_revenue_margin':ebit/rev,'ebit_bookings_margin':ebit/gb}
  rows.append(row);prev=b;prev_rev=rev;prev_res=res;prev_col=col
 last=rows[-1];g=c['terminal_growth'];rev=last['revenue']*(1+g);gb=last['gross_bookings']*(1+g);ebit=gb*c['ebit_bookings_margin'][-1];tax=max(ebit,0)*c['cash_tax_rate'];nopat=ebit-tax;da=rev*c['da_revenue_ratio'][-1];capex=rev*c['gross_reinvestment_revenue_ratio'][-1];nwc=(rev-last['revenue'])*c['incremental_noninsurance_nwc_revenue_ratio'];dr=last['insurance_reserve_end']*g;dc=last['required_restricted_pool_end']*g;ordinary=capex-da+nwc+dc-dr;floor=nopat*g/c['terminal_roic'];net=max(ordinary,floor);topup=net-ordinary;fcff=nopat-net;tv=fcff/(c['wacc']-g);pv=tv/(1+c['wacc'])**10;explicit=sum(r['pv_fcff'] for r in rows);ev=explicit+pv
 return {'valuation_anchor':inputs['valuation_anchor'],'information_cutoff':inputs['information_cutoff'],'unit':'USD million','annual_forecast':rows,'terminal':{'period_start':'2036-07-01','period_end':'2037-06-30','revenue':rev,'gross_bookings':gb,'gaap_ebit_after_sbc':ebit,'cash_operating_tax':tax,'nopat':nopat,'operating_da_addback':da,'gross_operating_asset_reinvestment':capex,'delta_noninsurance_nwc':nwc,'delta_insurance_reserve':dr,'delta_restricted_pool':dc,'ordinary_net_reinvestment':ordinary,'roic_growth_reinvestment_floor':floor,'additional_reinvestment_topup':topup,'net_reinvestment':net,'fcff':fcff,'terminal_value_at_2036_06_30':tv,'pv_terminal_value':pv},'explicit_pv_fcff':explicit,'operating_enterprise_value':ev,'terminal_pv_fraction_of_ev':pv/ev if ev else None,'terminal_g':g,'wacc':c['wacc'],'current_target_price':None,'current_verified_equity_ready':False,'cash_funding_certification':False,'cash_funding_note':'FCFF is not cash available after contractual debt repayment, investment/acquisition commitments or claim settlements. Equity allocation is a valuation, not financing adequacy certification.'}

def allocate(result,policy):
 required=('assumption_basis','common_shares','existing_earned_award_incremental_shares','cash_operating_reserve','investment_asset_value')+CLAIMS
 missing=[k for k in required if policy.get(k) is None]
 if policy.get('valuation_anchor')!='2026-06-30':raise ValueError('June allocation requires June policy')
 if not policy.get('acknowledge_no_overlap_and_scope'):missing.append('acknowledge_no_overlap_and_scope')
 if missing:return {'status':'incomplete_policy','missing':missing,'conditional_june_allocation_per_share':None,'current_target_price':None}
 if not isinstance(policy['assumption_basis'],str) or len(policy['assumption_basis'].strip())<20:raise ValueError('Substantive assumption basis required')
 for k in required:
  if k!='assumption_basis':number(policy[k],k,1 if k=='common_shares' else 0)
 if policy['cash_operating_reserve']>5391:raise ValueError('Operating reserve cannot exceed available June cash; model separate funding if greater')
 if policy['common_shares']==2039994000 and not policy.get('use_reported_june_shares_rounded_to_thousand'):raise ValueError('Acknowledge June reported share precision')
 if policy['common_shares']!=int(policy['common_shares']):raise ValueError('Whole share count required')
 equity=result['operating_enterprise_value']+5391-policy['cash_operating_reserve']+policy['investment_asset_value']-sum(policy[k] for k in CLAIMS)
 units=policy['common_shares']+policy['existing_earned_award_incremental_shares'];ok=equity>0 and result['terminal']['fcff']>0
 return {'status':'conditional_illustrative_allocation' if ok else 'suppressed_nonpositive_economics','valuation_anchor':'2026-06-30','policy_name':policy['policy_name'],'assumption_basis':policy['assumption_basis'],'operating_enterprise_value':result['operating_enterprise_value'],'unrestricted_liquidity':5391,'operating_cash_reserved':policy['cash_operating_reserve'],'investment_asset_value':policy['investment_asset_value'],'included_careem_investment_value':policy.get('included_careem_investment_value'),'claim_deductions':{k:policy[k] for k in CLAIMS},'total_claim_deductions':sum(policy[k] for k in CLAIMS),'conditional_common_equity_value':equity,'assumed_share_denominator':units,'share_precision_note':'June observed shares rounded to thousand; outstanding awards/claims are chosen assumptions, not diluted EPS weighted-average shares','conditional_june_allocation_per_share':equity*1e6/units if ok else None,'terminal_pv_fraction_of_ev':result['terminal_pv_fraction_of_ev'],'current_target_price':None,'current_verified_equity_ready':False}

def run(inputs,policy):
 validate(inputs);out={'ticker':'UBER','information_cutoff':inputs['information_cutoff'],'valuation_anchor':inputs['valuation_anchor'],'model_scope':'June operating perimeter; post-June capitalization deliberately separate','resolved_inputs':inputs,'resolved_equity_policy':policy,'cases':{}}
 for name,c in inputs['cases'].items():
  result=compute_case(inputs,c);result['allocation']=allocate(result,policy);out['cases'][name]=result
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--inputs',default='dcf-inputs-v2.json');ap.add_argument('--policy',default='equity-policy-template-v2.json');ap.add_argument('--output',default='dcf-output-v2.json');args=ap.parse_args()
 target=P/args.output
 if target.parent!=P or not target.name.endswith('output-v2.json'):raise ValueError('Output must be local *output-v2.json; no input overwrite')
 data=run(json.loads((P/args.inputs).read_text()),json.loads((P/args.policy).read_text()));target.write_text(json.dumps(data,indent=2)+'\n')
 if args.output=='dcf-output-v2.json':
  rows=[{'scenario':k,**r} for k,v in data['cases'].items() for r in v['annual_forecast']]
  with (P/'forecast-v2.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
 for name,r in data['cases'].items():print(name,'EV',round(r['operating_enterprise_value'],2),'terminal%',round(r['terminal_pv_fraction_of_ev']*100,2),'conditionalJune',r['allocation']['conditional_june_allocation_per_share'])
if __name__=='__main__':main()
