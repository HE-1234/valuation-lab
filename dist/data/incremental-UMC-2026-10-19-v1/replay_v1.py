"""Dated UMC operating-assets scenarios, standard-library standalone replay."""
import pathlib,json,math
P=pathlib.Path(__file__).parent

def validate(x,p):
 assert x['selected_policy'] is None and x['current_target'] is None
 assert x['common_outstanding_million']==(x['issued_common_shares_exact']-x['treasury_shares_exact'])/1e6
 assert p['bank_principal_timing'] in ['all_upfront','current_upfront_remaining_year2'] and 0<=p['authorized_2026_award_issuance_fraction']<=1
 assert x['ordinary_per_ads']==5 and x['twd_per_usd_spot']>0 and x['fx_date']==x['balance_date']
 assert p['nonoperating_equity_value_assigned']==0 and p['circular_crossholding_share_reduction']==0,'This engine admits only the explicit portfolio-exclusion scenario; adding portfolio value requires a new reviewed circular-ownership/tax allocation.'
 assert 0<=p['time_deposit_recovery_fraction']<=1 and 1<=p['time_deposit_funding_release_year']<=10
 for k in ['lease_cash_by_year','financial_cash_interest_by_year','supplemental_operating_cash_by_year']:
  assert len(p[k])==10 and all(math.isfinite(v) and v>=0 for v in p[k])
 for k in ['required_operating_cash','minority_claim_reserved','supplemental_senior_cash_claim','unissued_award_claim_reserved']:assert math.isfinite(p[k]) and p[k]>=0

def domestic_schedule(d):
 out=[0]*10
 for r in d['domestic_bond_principal_schedule']:
  y,m=map(int,r['maturity_month'].split('-'));i=y-2027+(m>6)
  assert 0<=i<10;out[i]+=r['principal']/1000
 assert abs(sum(out)-39100)<1e-8
 return out

def replay(x,p,d):
 validate(x,p);out={};principal=domestic_schedule(d)
 known_claims=sum(x[k] for k in ['guarantee_deposits_reserved','dividend_payable_reserved','current_tax_reserved','contract_liabilities_reserved','refund_liabilities_reserved','legacy_pension_provision_claims_reserved'])
 analyst_claims=p['minority_claim_reserved']+p['supplemental_senior_cash_claim']+p['unissued_award_claim_reserved']
 investment_recovery=x['time_deposits_current']*p['time_deposit_recovery_fraction']
 equity_bridge=x['cash']+investment_recovery-x['financial_debt']-known_claims-analyst_claims-p['required_operating_cash']
 bank_reserve=x['bank_debt_total'] if p['bank_principal_timing']=='all_upfront' else x['bank_current_principal'];bank_payments=[0]*10
 if p['bank_principal_timing']=='current_upfront_remaining_year2':bank_payments[1]=x['bank_noncurrent_principal']
 assert abs(bank_reserve+sum(bank_payments)-x['bank_debt_total'])<1e-8
 denominator=x['common_outstanding_million']+x['authorized_2026_award_shares_million']*p['authorized_2026_award_issuance_fraction']
 initial=x['cash']-known_claims-analyst_claims-p['required_operating_cash']-bank_reserve-x['novatek_redemption_reserved']
 for name,s in x['scenarios'].items():
  w=s['wacc'];g=s['terminal_growth'];tax=s['tax_rate'];assert w>g>=0 and x['terminal_incremental_roic']>g and 0<=tax<1
  assert len(s['growth'])==9 and all(len(s[k])==10 for k in ['ebit_margin','cash_capex','da_nonlease'])
  assert all(math.isfinite(v) for k in ['growth','ebit_margin','cash_capex','da_nonlease'] for v in s[k])
  assert all(v>=0 for k in ['cash_capex','da_nonlease'] for v in s[k]);assert s['revenue_first']>0 and all(v>-1 for v in s['growth'])
  rev=x['initial_revenue_anchor'];cash=initial;minimum=initial;pv=0;rows=[]
  for i in range(10):
   previous=rev;rev=s['revenue_first'] if i==0 else rev*(1+s['growth'][i-1]);ebit_before_lease=rev*s['ebit_margin'][i];ebit=ebit_before_lease-p['lease_cash_by_year'][i];cash_tax=max(ebit,0)*tax;dwc=(rev-previous)*x['incremental_working_capital_ratio']
   fcff=ebit-cash_tax+s['da_nonlease'][i]-s['cash_capex'][i]-dwc-p['supplemental_operating_cash_by_year'][i]
   release=investment_recovery if i+1==p['time_deposit_funding_release_year'] else 0
   cash+=fcff+release-principal[i]-bank_payments[i]-p['financial_cash_interest_by_year'][i];minimum=min(minimum,cash);v=fcff/(1+w)**(i+1);pv+=v
   rows.append({'year':i+1,'period_end':f'{2027+i}-06-30','revenue':rev,'pre_lease_ebit':ebit_before_lease,'ebit_after_cash_lease':ebit,'cash_tax':cash_tax,'da_excluding_rou':s['da_nonlease'][i],'all_in_cash_capex':s['cash_capex'][i],'total_lease_cash':p['lease_cash_by_year'][i],'change_working_capital':dwc,'incremental_operating_cash_obligations':p['supplemental_operating_cash_by_year'][i],'fcff':fcff,'pv_fcff':v,'time_deposit_cash_conversion':release,'domestic_bond_principal':principal[i],'bank_principal_payment':bank_payments[i],'financial_debt_cash_interest_excluding_leases':p['financial_cash_interest_by_year'][i],'ending_available_liquidity':cash})
  nopat=(rev*s['ebit_margin'][-1]-p['lease_cash_by_year'][-1])*(1+g)*(1-tax);roic_cap=nopat*(1-g/x['terminal_incremental_roic']);runrate_cap=rows[-1]['fcff']*(1+g);tfcf=min(roic_cap,runrate_cap);tv=tfcf/(w-g);pvtv=tv/(1+w)**10;ev=pv+pvtv;equity=ev+equity_bridge;ordinary=max(0,equity/denominator);ads=ordinary*x['ordinary_per_ads']/x['twd_per_usd_spot'];funded=minimum>=0 and equity>0
  out[name]={'enterprise_value_twd_m':ev,'equity_bridge_twd_m':equity_bridge,'equity_value_twd_m':equity,'excluded_nonoperating_equity_value_assigned':0,'ordinary_share_denominator_m':denominator,'issued_less_treasury_m':x['common_outstanding_million'],'authorized_award_new_shares_m':denominator-x['common_outstanding_million'],'current_target':None,'unfunded_mathematical_twd_per_ordinary':ordinary,'unfunded_mathematical_usd_per_ads':ads,'conditional_twd_per_ordinary':ordinary if funded else None,'conditional_usd_per_ads':ads if funded else None,'status':'DATED_CONDITIONAL_ANNUAL_FUNDING_PASS' if funded else 'WITHHELD_UNFUNDED_OR_NONPOSITIVE_EQUITY','terminal':{'nopat':nopat,'roic_limited_fcff':roic_cap,'runrate_limited_fcff':runrate_cap,'fcff':tfcf,'value':tv,'pv':pvtv,'ev_fraction':pvtv/ev if ev else None,'reinvestment':nopat-tfcf},'funding':{'initial_available_liquidity':initial,'minimum_available_liquidity':minimum,'gap':max(0,-minimum),'known_claims_reserved':known_claims,'analyst_claims_reserved':analyst_claims,'bank_principal_reserved':bank_reserve,'novatek_redemption_reserved':x['novatek_redemption_reserved'],'time_deposits_not_available_at_inception':investment_recovery,'new_financing':0,'new_subsidies':0,'portfolio_sales':0,'timing_warning':'Annual buckets; not proof of daily or jurisdiction-specific liquidity. Reservedclaims are paid from segregatedreserve, not doublecharged in FCFF.'},'rows':rows}
 return {'ticker':'UMC','label':x['study_type'],'balance_date':x['balance_date'],'research_cutoff':x['research_cutoff'],'fx_date':x['fx_date'],'twd_per_usd':x['twd_per_usd_spot'],'ordinary_per_ads':5,'selected_policy':None,'selection_required':True,'current_target':None,'policy':p,'scenarios':out}

if __name__=='__main__':
 x=json.loads((P/'dcf-inputs-v1.json').read_text());pol=json.loads((P/'analyst-policy-examples-v1.json').read_text())['policies'];d=json.loads((P/'capital-claims/funding-inputs-v1.json').read_text());out={'selected_policy':None,'current_target':None,'examples':[replay(x,p,d) for p in pol]};(P/'dcf-output-v1.json').write_text(json.dumps(out,indent=2,allow_nan=False))
 for e in out['examples']:print(e['policy']['policy_id'],[(n,round(r['enterprise_value_twd_m']),r['conditional_usd_per_ads'],round(r['funding']['minimum_available_liquidity'])) for n,r in e['scenarios'].items()])
