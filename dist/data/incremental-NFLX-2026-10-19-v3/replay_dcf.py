"""Dated NFLX scenario model. Python standard library only. No quote, network or publish action."""
import json,math,csv,pathlib,datetime,copy,argparse
ROOT=pathlib.Path(__file__).resolve().parent

def load(name):return json.loads((ROOT/name).read_text())
def dump(name,obj):(ROOT/name).write_text(json.dumps(obj,indent=2,allow_nan=False)+'\n')
def require(ok,msg):
 if not ok:raise ValueError(msg)
def num(v,name,lo=None,hi=None):
 require(type(v) in (int,float) and math.isfinite(v),name+' must be finite numeric, never null/bool')
 if lo is not None:require(v>=lo,name+' below bound')
 if hi is not None:require(v<=hi,name+' above bound')
 return float(v)
def validate_model(d):
 require(d['common']['capital_anchor']=='2026-06-30' and d['common']['discount_anchor']=='2026-06-30','This engine is June-anchored only')
 require(d['common']['information_cutoff']=='2026-10-19','Information cutoff must remain Oct 19')
 expected={'revenue':24809.695,'ebit':8149.607,'content_amortization':8529.209,'noncontent_da':199.105,'ppe_purchases':414.774}
 require(d['common']['actual_h1_2026']==expected,'H1 actuals are pinned source facts, not forecast inputs')
 require(d['common']['actual_h1_2026_cash_content']==9911.018,'H1 content cash is a pinned source fact')
 for name,c in d['cases'].items():
  w=num(c['wacc'],'wacc',.001,.5);g=num(c['terminal_growth'],'g',0,.08);rr=num(c['terminal_incremental_roic'],'ROIC',.001,1)
  require(w>g,'WACC must exceed terminal growth');require(rr>g,'ROIC must exceed growth')
  require([r['year'] for r in c['annual_assumptions']]==list(range(2027,2036)),'Need explicit annual assumptions 2027-2035')
  for key,v in c['full_year_2026_assumptions'].items():num(v,'FY2026 '+key,0)
  f=c['full_year_2026_assumptions'];a=d['common']['actual_h1_2026']
  num(f['ebit_margin'],'FY margin',0,.8);num(f['cash_content_to_amortization'],'FY cash ratio',1,3)
  for key in ['revenue','content_amortization','noncontent_da','ppe_capex']:
   ak='ppe_purchases' if key=='ppe_capex' else key
   require(f[key]>a[ak],f'FY2026 {key} must exceed H1 reported amount')
  require(f['revenue']*f['ebit_margin']>a['ebit'],'H2 EBIT must be positive in this policy')
  require(f['content_amortization']*f['cash_content_to_amortization']>d['common']['actual_h1_2026_cash_content'],'H2 cash content must be positive')
  num(c['h2_2026_assumptions']['cash_tax_rate'],'H2 tax',0,.6);num(c['h2_2026_assumptions']['noncontent_nwc_investment'],'H2 NWC',0)
  for r in c['annual_assumptions']+[c['terminal']]:
   for k in ['ebit_margin','cash_tax_rate','content_amortization_pct_revenue','noncontent_da_pct_revenue','ppe_capex_pct_revenue','incremental_noncontent_nwc_pct_delta_revenue']:num(r[k],k,0,.8)
   num(r['cash_content_to_amortization'],'content cash ratio',1,3)
   if 'revenue_growth' in r:num(r['revenue_growth'],'growth',0,1)
  fraction=num(c['h1_2027_fraction_of_annual_content_cash'],'2027 first-half content cash fraction',0,1)
  h2=f['content_amortization']*f['cash_content_to_amortization']-d['common']['actual_h1_2026_cash_content']
  first=c['annual_assumptions'][0];fy27=f['revenue']*(1+first['revenue_growth'])*first['content_amortization_pct_revenue']*first['cash_content_to_amortization']
  require(h2+fy27+1e-8>=11939.734,'Content commitments impossible even with all FY2027 cash frontloaded')
  require(h2+fraction*fy27+1e-8>=11939.734,'Assumed next-12-month content cash does not cover disclosed commitments; revise spending or explicit timing fraction')
  core=run_case(d,name)
  for row in core['forecast']+[core['terminal']]:
   require(row['revenue']-row['ebit']+1e-8>=row['content_amortization']+row['noncontent_da'],'Explicit content amortization and noncontent D&A exceed total operating costs')

def discount_time(year):return (datetime.date(year,12,31)-datetime.date(2026,6,30)).days/365.25

def run_case(data,name):
 c=data['cases'][name];a=data['common']['actual_h1_2026'];f=c['full_year_2026_assumptions'];h=c['h2_2026_assumptions'];rows=[]
 for year in range(2026,2036):
  if year==2026:
   rev=f['revenue']-a['revenue'];ebit=f['revenue']*f['ebit_margin']-a['ebit'];taxrate=h['cash_tax_rate'];amort=f['content_amortization']-a['content_amortization'];cashcontent=f['content_amortization']*f['cash_content_to_amortization']-data['common']['actual_h1_2026_cash_content'];da=f['noncontent_da']-a['noncontent_da'];capex=f['ppe_capex']-a['ppe_purchases'];nwc=h['noncontent_nwc_investment'];start='2026-07-01'
  else:
   r=c['annual_assumptions'][year-2027];prev=f['revenue'] if year==2027 else rows[-1]['revenue'];rev=prev*(1+r['revenue_growth']);ebit=rev*r['ebit_margin'];taxrate=r['cash_tax_rate'];amort=rev*r['content_amortization_pct_revenue'];cashcontent=amort*r['cash_content_to_amortization'];da=rev*r['noncontent_da_pct_revenue'];capex=rev*r['ppe_capex_pct_revenue'];nwc=(rev-prev)*r['incremental_noncontent_nwc_pct_delta_revenue'];start=f'{year}-01-01'
  tax=max(0,ebit)*taxrate;nopat=ebit-tax;netcontent=cashcontent-amort;reinvest=netcontent+capex-da+nwc;fcff=nopat-reinvest;t=discount_time(year);pv=fcff/(1+c['wacc'])**t
  rows.append({'case':name,'year':year,'period_start':start,'period_end':f'{year}-12-31','discount_time_years':t,'revenue':rev,'ebit':ebit,'ebit_margin':ebit/rev,'cash_tax_rate':taxrate,'cash_taxes':tax,'nopat':nopat,'content_amortization':amort,'content_cash_payments':cashcontent,'cash_content_to_amortization':cashcontent/amort,'net_content_investment':netcontent,'noncontent_da':da,'ppe_capex':capex,'noncontent_nwc_investment':nwc,'net_reinvestment':reinvest,'fcff':fcff,'pv_fcff':pv})
 t=c['terminal'];g=c['terminal_growth'];last=rows[-1];rev=last['revenue']*(1+g);ebit=rev*t['ebit_margin'];tax=max(0,ebit)*t['cash_tax_rate'];nopat=ebit-tax;amort=rev*t['content_amortization_pct_revenue'];cashcontent=amort*t['cash_content_to_amortization'];da=rev*t['noncontent_da_pct_revenue'];capex=rev*t['ppe_capex_pct_revenue'];nwc=(rev-last['revenue'])*t['incremental_noncontent_nwc_pct_delta_revenue'];component=cashcontent-amort+capex-da+nwc;roic=nopat*g/c['terminal_incremental_roic'];reinvest=max(component,roic);fcff=nopat-reinvest;tv=fcff/(c['wacc']-g);tpv=tv/(1+c['wacc'])**discount_time(2035);explicit=sum(r['pv_fcff'] for r in rows);ev=explicit+tpv
 terminal={'year':2036,'revenue':rev,'ebit':ebit,'cash_tax_rate':t['cash_tax_rate'],'cash_taxes':tax,'nopat':nopat,'content_amortization':amort,'content_cash_payments':cashcontent,'noncontent_da':da,'ppe_capex':capex,'noncontent_nwc_investment':nwc,'component_net_reinvestment':component,'roic_required_net_reinvestment':roic,'selected_net_reinvestment':reinvest,'reinvestment_binding_rule':'roic_floor' if roic>=component else 'component_cash_investment','fcff':fcff,'undiscounted_terminal_value':tv,'terminal_pv':tpv}
 return {'case':name,'valuation_label':'Conditional June 30, 2026 operating EV; October 19 information; not ex-ante June and not current target','capital_anchor':'2026-06-30','information_cutoff':'2026-10-19','resolved_assumptions':copy.deepcopy(c),'resolved_common':copy.deepcopy(data['common']),'forecast':rows,'terminal':terminal,'explicit_pv':explicit,'terminal_pv':tpv,'operating_ev':ev,'terminal_ev_fraction':tpv/ev if ev else None,'current_target':None,'current_upside':None,'next_12m_content_cash_coverage_proxy':rows[0]['content_cash_payments']+c['h1_2027_fraction_of_annual_content_cash']*rows[1]['content_cash_payments'],'content_obligations_next12m':11939.734,'content_coverage_limitation':'Explicit 2027 first-half fraction is an assumption. Validation and allocation both gate aggregate next-12-month capacity against known commitments; passing is necessary, not proof of title-specific or intrayear matching.'}

def content_commitment_coverage(core):
 # Necessary capacity check, not proof that specific titles or intrayear dates match.
 require([r['year'] for r in core['forecast'][:2]]==[2026,2027],'Need H2 2026 and FY2027 for commitment coverage')
 h2=num(core['forecast'][0]['content_cash_payments'],'H2 content cash',0)
 fy27=num(core['forecast'][1]['content_cash_payments'],'FY2027 content cash',0)
 fraction=num(core['resolved_assumptions']['h1_2027_fraction_of_annual_content_cash'],'2027 first-half content cash fraction',0,1)
 cash=h2+fraction*fy27;due=11939.734
 return {'disclosed_next12m_obligations':due,'h2_2026_cash':h2,'fy2027_cash':fy27,'assumed_h1_2027_fraction':fraction,'assumed_next12m_cash':cash,'hard_upper_bound_including_all_fy2027_cash':h2+fy27,'assumed_coverage_surplus':cash-due,'passed':cash+1e-8>=due,'source_url':'https://www.sec.gov/Archives/edgar/data/1065280/000106528026000212/nflx-20260630.htm','limitation':'Necessary aggregate capacity only. Explicit first-half payment fraction is an analyst timing assumption. Passing does not prove title-specific, gross-versus-net incentive timing, intrayear liquidity, or coverage of subsequently signed commitments. No waiver of disclosed obligations is implemented.'}

def bs_call(s,k,years,vol,rf):
 if s<=0:return 0.0
 d1=(math.log(s/k)+(rf+.5*vol*vol)*years)/(vol*math.sqrt(years));d2=d1-vol*math.sqrt(years)
 N=lambda x:.5*(1+math.erf(x/math.sqrt(2)))
 return s*N(d1)-k*math.exp(-rf*years)*N(d2)

def existing_award_expense_envelope(core,policy,capital):
 # This is a restricted analytical convention, not an exact grant-level appraisal.
 c=capital['reported'];years={str(y) for y in range(2026,2036)};cost_years={str(y) for y in range(2026,2037)}
 schedule=policy['existing_unvested_award_expense_in_ebit_by_year']
 require(type(schedule) is dict and set(schedule)==years,'Need each existing-award expense year, including deliberately zero years')
 for year,value in schedule.items():num(value,'existing award expense '+year,0)
 total=num(policy['existing_award_remaining_expense_assumption'],'remaining existing-award expense assumption',0)
 require(abs(sum(schedule.values())-total)<=1e-8,'Existing-award expense schedule must exactly reconcile to the selected total remaining-expense assumption')
 pinned={'fy2025_unrecognized_rsu_psu_compensation_cost':47,'h1_2026_rsu_psu_granted_units_m':1.245383,'h1_2026_rsu_psu_weighted_grant_date_fair_value':82.91,'fy2025_stock_compensation_cost':368.449,'fy2025_revenue_for_compensation_reference':45183.036}
 require(all(c[k]==v for k,v in pinned.items()),'Pinned award source-context facts cannot be altered')
 reference=47+1.245383*82.91
 require(total<=reference+1e-8,'Selected existing-award expense exceeds the supported no-positive-additions source-context envelope; a new supported reconciliation is required')
 horizon_text=policy['existing_award_latest_recognition_date'];require(type(horizon_text) is str,'Existing-award recognition horizon must be an ISO date')
 try:horizon=datetime.date.fromisoformat(horizon_text)
 except ValueError:raise ValueError('Existing-award recognition horizon must be an ISO date')
 require(horizon.isoformat()==horizon_text and datetime.date(2026,6,30)<horizon<=datetime.date(2029,6,30),'Existing June awards must recognize by the supported maximum three-year remaining window ending June 30, 2029')
 for year,value in schedule.items():require(value==0 or datetime.date(int(year),1,1)<=horizon,'Existing-award expense scheduled beyond selected remaining recognition horizon')
 future=policy['retained_future_grant_cash_compensation_pct_revenue_by_year'];other=policy['retained_other_cash_operating_cost_pct_revenue_by_year']
 require(type(future) is dict and set(future)==cost_years and type(other) is dict and set(other)==cost_years,'Retained cash costs need explicit H2 2026, 2027-2035 and terminal 2036 entries')
 compensation_reference=368.449/45183.036;rows=[]
 for r in core['forecast']+[core['terminal']]:
  year=str(r['year']);future_ratio=num(future[year],'future-grant cash compensation fraction '+year,0,1);other_ratio=num(other[year],'other cash operating cost fraction '+year,0,1)
  require(future_ratio>=compensation_reference,'Restricted convention retains future-grant compensation at least FY2025 total SBC/revenue; a lower-cost thesis needs a new supported convention')
  require(other_ratio>0,'Other cash operating costs must be explicitly retained, never zero')
  total_cost=r['revenue']-r['ebit'];da=r['content_amortization']+r['noncontent_da'];residual=total_cost-da;future_cash=r['revenue']*future_ratio;other_cash=r['revenue']*other_ratio;available=residual-future_cash-other_cash;expense=0 if r['year']==2036 else schedule[year]
  require(available+1e-8>=0,'Retained amortization, D&A, compensation and other cash costs exceed the forecast cost envelope')
  require(expense<=available+1e-8,'Existing-award expense exceeds residual cost envelope after explicit amortization, D&A and retained cash costs')
  rows.append({'year':r['year'],'total_operating_cost_before_adjustment':total_cost,'content_amortization_retained':r['content_amortization'],'noncontent_da_retained':r['noncontent_da'],'residual_before_retained_cash_costs':residual,'future_grant_cash_compensation_retained':future_cash,'other_cash_operating_cost_retained':other_cash,'maximum_existing_award_expense_within_costs':available,'existing_award_expense_removed':expense,'unallocated_cost_headroom':available-expense,'latest_assumed_recognition_date':min(horizon,datetime.date(r['year'],12,31)).isoformat() if expense else None})
 return {'selected_total_remaining_expense':total,'scheduled_total':sum(schedule.values()),'source_context_reference_envelope':reference,'source_context_basis':'FY2025 rounded $47m unrecognized cost plus H1 2026 granted units 1.245383m times rounded weighted grant-date value $82.91. All H1 grants included even though some relate to prior-period PSU settlement. No reduction for H1 recognition or forfeiture is estimated. This is deliberately an analytical admission envelope only under the explicit no-unmodeled-positive-additions assumption, not exact June unrecognized expense, legal maximum or complete modification reconciliation. A larger amount or different award horizon requires a new supported implementation.','latest_recognition_date':horizon_text,'maximum_supported_recognition_date':'2029-06-30','future_grant_compensation_reference_floor_pct_revenue':compensation_reference,'floor_basis':'Restricted forward-cost convention assumes future-grant cash replacement intensity does not fall below FY2025 total SBC/revenue. This is an assumption anchored in reported history, not reported future expense; it excludes the separately removed existing-award expense.','period_envelopes':rows,'timing_note':'Any nonzero expense in the horizon year is assumed recognized by the stated horizon date. Annual PV and funding still book its adjustment at that year end, a conservative aggregation rather than exact recognition timing. Retained costs are embedded in EBIT and are not deducted a second time.'}

def allocate(core,policy,capital):
 numeric_keys=['operating_cash_reserve','debt_value','option_volatility','option_remaining_years','option_risk_free_rate','rsu_psu_units_multiplier','income_tax_claim_reserve','additional_brazil_claim_excluding_paid_729','other_claim_reserve','financing_interest_rate_derivative_reserve','financing_fx_derivative_net_claim_reserve','existing_award_remaining_expense_assumption']
 keys=numeric_keys+['separate_claim_cash_by_year','debt_valuation_basis','existing_unvested_award_expense_in_ebit_by_year','existing_award_latest_recognition_date','retained_future_grant_cash_compensation_pct_revenue_by_year','retained_other_cash_operating_cost_pct_revenue_by_year']
 acks=['accept_cash_fungibility_assumption','accept_operating_lease_and_content_treatment','accept_operating_hedges_embedded_no_separate_asset','accept_existing_award_and_future_sbc_nonoverlap','accept_annual_funding_proxy_not_bank_cash','accept_financing_hedges_separate_and_assumed_closeout','accept_existing_award_no_unmodeled_positive_cost_additions','accept_source_context_compensation_floor_convention']
 missing=[k for k in keys if policy.get(k) is None]+[k for k in acks if policy.get(k) is not True]
 require(policy.get('as_of')=='2026-06-30','Allocation policy must retain June date')
 coverage=content_commitment_coverage(core)
 base={'resolved_operating_assumptions':copy.deepcopy(core['resolved_assumptions']),'resolved_common':copy.deepcopy(core['resolved_common']),'policy':copy.deepcopy(policy),'capital_anchor':'2026-06-30','current_target':None,'current_upside':None,'missing_policy_fields':missing,'conditional_june_allocation_per_share':None,'content_commitment_coverage':coverage}
 if not coverage['passed']:return {**base,'status':'withheld_content_commitment_coverage'}
 if missing:return {**base,'status':'withheld_incomplete_policy'}
 for k in numeric_keys:num(policy[k],k,0)
 num(policy['option_volatility'],'option volatility',.01,2);num(policy['option_remaining_years'],'option life',.01,10);num(policy['option_risk_free_rate'],'option riskfree',0,.2);num(policy['rsu_psu_units_multiplier'],'award multiplier',1,10)
 c=capital['reported'];debt_principal_pv_floor=sum(v/(1+core['resolved_assumptions']['wacc'])**discount_time(y) for y,v in {2026:1000,2027:1486,2028:3500,2029:4329,2030:2257,2034:1000,2054:800}.items())
 require(policy['debt_valuation_basis']=='face_principal_excluding_financing_derivatives','Only the separately matched June face-principal convention is implemented')
 require(policy['debt_value']==14372 and c['debt_face_rounded']==14372,'Face-principal convention requires pinned June $14,372m, not carrying or standalone market debt value')
 require(c['brazil_prior_period_non_income_tax_paid_h1']==729,'Paid Brazil source fact cannot be changed')
 require(c['interest_rate_financing_derivative_net_liability']==13.574 and policy['financing_interest_rate_derivative_reserve']==13.574,'June interest-rate net derivative claim must be retained separately from face principal')
 opening_cash=c['cash']+c['short_term_investments'];require(policy['operating_cash_reserve']<=opening_cash,'Operating cash reserve exceeds available June cash')
 claim_keys=['income_tax_claim_reserve','additional_brazil_claim_excluding_paid_729','other_claim_reserve','financing_interest_rate_derivative_reserve','financing_fx_derivative_net_claim_reserve']
 claim=sum(policy[k] for k in claim_keys);cashschedule=policy['separate_claim_cash_by_year'];years={str(y) for y in range(2026,2036)}
 require(set(cashschedule)==years,'Need every claim settlement year, including deliberately zero years')
 for k,v in cashschedule.items():num(v,'claim settlement '+k,0)
 # Financing closeout is a required paired cash use, not an arbitrary permanent reserve.
 financing_claim=policy['financing_interest_rate_derivative_reserve']+policy['financing_fx_derivative_net_claim_reserve']
 require(cashschedule['2026']+1e-8>=financing_claim,'Assumed July 1 financing-hedge closeout must be paid within H2 cash schedule')
 claimpv=sum(v/(1+core['resolved_assumptions']['wacc'])**discount_time(int(y)) for y,v in cashschedule.items());require(claim+1e-8>=claimpv,'Claim reserve cannot be below PV of specified cash settlement')
 expense_envelope=existing_award_expense_envelope(core,policy,capital)
 existing_expense=policy['existing_unvested_award_expense_in_ebit_by_year']
 adjustment_rows=[{'year':r['year'],'pretax_existing_award_expense_removed':existing_expense[str(r['year'])],'aftertax_existing_award_expense_removed':existing_expense[str(r['year'])]*(1-r['cash_tax_rate']),'pv_aftertax_expense_removed':existing_expense[str(r['year'])]*(1-r['cash_tax_rate'])/(1+core['resolved_assumptions']['wacc'])**r['discount_time_years']} for r in core['forecast']]
 existing_expense_pv=sum(r['pv_aftertax_expense_removed'] for r in adjustment_rows);adjusted_ev=core['operating_ev']+existing_expense_pv
 other_equity=adjusted_ev+opening_cash-policy['operating_cash_reserve']-policy['debt_value']-claim;units=c['actual_common_shares_m']+c['rsu_psu_rollforward_units_m']*policy['rsu_psu_units_multiplier'];opts=c['option_shares_m'];strike=c['option_weighted_strike_usd'];lo=0;hi=max(0,other_equity/units)
 for _ in range(180):
  mid=(lo+hi)/2;v=units*mid+opts*bs_call(mid,strike,policy['option_remaining_years'],policy['option_volatility'],policy['option_risk_free_rate'])
  if v>other_equity:hi=mid
  else:lo=mid
 price=(lo+hi)/2;option_claim=opts*bs_call(price,strike,policy['option_remaining_years'],policy['option_volatility'],policy['option_risk_free_rate']);funding=[];cash=opening_cash;debtface=c['debt_face_rounded'];maturity={2026:1000,2027:1486,2028:3500,2029:4329,2030:2257,2031:0,2032:0,2033:0,2034:1000,2035:0}
 for r,adjustment in zip(core['forecast'],adjustment_rows):
  yr=r['year'];principal=maturity[yr];period_fraction=discount_time(2026) if yr==2026 else (datetime.date(yr,12,31)-datetime.date(yr-1,12,31)).days/365.25
  interest=(debtface-principal*.5)*.049*period_fraction;aftertax=interest*(1-r['cash_tax_rate']);addback=adjustment['aftertax_existing_award_expense_removed'];cash+=r['fcff']+addback-aftertax-principal-cashschedule[str(yr)];debtface-=principal
  funding.append({'year':yr,'core_fcff':r['fcff'],'aftertax_existing_award_expense_removed':addback,'allocation_adjusted_fcff':r['fcff']+addback,'assumed_interest_cash_after_tax':aftertax,'principal_paid':principal,'separate_claim_cash':cashschedule[str(yr)],'annual_cash_capacity_proxy':cash,'reserve_shortfall':max(0,policy['operating_cash_reserve']-cash),'remaining_debt_face':debtface})
 funded=all(r['reserve_shortfall']==0 for r in funding);allowed=funded and other_equity>0 and adjusted_ev>0 and core['terminal']['fcff']>0
 return {**base,'status':'conditional_illustration' if allowed else 'withheld_funding_or_value_gate','conditional_june_allocation_per_share':price if allowed else None,'operating_ev':core['operating_ev'],'existing_award_expense_envelope':expense_envelope,'existing_award_expense_adjustments':adjustment_rows,'existing_award_expense_aftertax_pv':existing_expense_pv,'allocation_adjusted_operating_ev':adjusted_ev,'cash_and_investments':opening_cash,'cash_reserve_not_distributed':policy['operating_cash_reserve'],'debt_value_selected':policy['debt_value'],'debt_principal_pv_consistency_floor':debt_principal_pv_floor,'separate_claim_reserve':claim,'separate_claim_reserve_breakdown':{k:policy[k] for k in claim_keys},'separate_claim_cash_pv':claimpv,'equity_before_existing_award_claims':other_equity,'rsu_psu_units_m_selected':units-c['actual_common_shares_m'],'ordinary_and_rsu_units_m':units,'option_value_proxy':option_claim,'per_option_value_proxy':option_claim/opts,'option_allocation_residual':other_equity-price*units-option_claim,'funding_stress':funding,'funding_proxy_note':'Annual capacity scenario, not actual cash forecast: retains adjusted FCFF, no buybacks/dividends/M&A/refinancing, June-FX face maturities. Financing hedges hypothetically close out July 1 and cash settles in H2 at the separately stated amounts; subsequent unhedged 4.9% interest and constant June FX are assumptions. Taxes use assumed operating rate. No option exercise proceeds; existing awards are noncash claims, not paid again. No second settlement of $729m Brazil cash already paid in H1. Intrayear dates and actual hedge closeout values are not verified.','sbc_nonoverlap_note':'Remove only the explicitly scheduled remaining expense for existing unvested June awards from assumed EBIT after tax, then allocate those awards separately. Future-grant cash replacement excludes that removed existing-award expense and remains a cost. All June options are vested. No broad SBC addback, no terminal addback and no separately assumed excess tax benefit. Schedule is an analyst assumption, not verified June grant-level expense, and must exactly reconcile to its explicit total, fit the supported recognition horizon, remain inside the no-positive-additions source-context envelope, and preserve explicit forward compensation and other cash costs. Cost floors are embedded in EBIT and never charged twice.','approximation_warning':'Weighted-strike/life Black-Scholes option proxy is not exact employee-option or grant-level fair value. Aggregate PSU multiplier is not a legal maximum. Face principal plus separate financing-hedge reserves is a conditional claim convention, not a complete market-value appraisal. Financing FX reserve, additional Brazil exposure, remaining existing-award expense, other claims and cash fungibility require explicit assumptions.'}

def rollforward(template,capital):
 p=template['user_assumptions_required'];missing=[k for k,v in p.items() if v is None];out={'status':'withheld_incomplete_policy' if missing else 'conditional_capital_ledger_only','missing_fields':missing,'current_target':None,'current_upside':None,'known_event':template['known_event'],'projected_capital':None}
 if missing:return out
 for k,v in p.items():num(v,k,None if k in ['other_net_equity_cash','other_net_cash_change_including_fx_and_investments','other_debt_face_fx_change','operating_cash_flow_since_anchor'] else 0)
 c=capital['reported'];e=template['known_event'];cash=c['cash']+c['short_term_investments']+e['cash_proceeds_before_other_issuer_expenses']-p['other_issuer_expenses']+p['operating_cash_flow_since_anchor']-p['ppe_cash_spend_since_anchor']-p['acquisition_cash_spend_since_anchor']-p['buyback_cash_since_anchor']+p['other_debt_net_cash_proceeds']-p['debt_repayment_cash_total']+p['option_exercise_cash']+p['other_net_equity_cash']+p['other_net_cash_change_including_fx_and_investments'];debt=c['debt_face_rounded']+e['debt_face_added']+p['other_debt_added']-p['debt_principal_repaid']+p['other_debt_face_fx_change'];shares=c['actual_common_shares_m']-p['buyback_shares_m_since_anchor']+p['option_shares_issued_m']+p['other_shares_issued_m'];require(shares>0 and cash>=0 and debt>=0,'Invalid rolled capital amounts')
 require(p['debt_repayment_cash_total']>=p['debt_principal_repaid'],'Debt cash repayment must cover principal; separate coupons/fees included in total')
 out['projected_capital']={'cash_and_short_investments':cash,'debt_face':debt,'net_debt_face':debt-cash,'common_shares_m':shares,'option_shares_m':p['current_option_shares_m'],'rsu_psu_units_m':p['current_rsu_psu_units_m']};out['assumptions']=copy.deepcopy(p);return out

def main():
 p=argparse.ArgumentParser();p.add_argument('--inputs',default='dcf-inputs-v3.json');p.add_argument('--policy',default='equity-policy-template-v3.json');p.add_argument('--output',default='dcf-output-v3.json');args=p.parse_args();require(args.output.endswith('-output-v3.json'),'Output must end -output-v3.json');require('/' not in args.output,'Output stays within bundle');require(args.output not in [args.inputs,args.policy],'Cannot overwrite inputs')
 d=load(args.inputs);validate_model(d);cap=load('capital-claims-v3.json');policy=load(args.policy);results={k:run_case(d,k) for k in d['cases']};alloc={k:allocate(v,policy,cap) for k,v in results.items()};dump(args.output,{'unit':'USD millions except per-share amounts in USD','cases':results,'allocations':alloc,'rollforward':rollforward(load('capital-rollforward-template-v3.json'),cap)})
 if args.output=='dcf-output-v3.json':
  rs=[r for v in results.values() for r in v['forecast']]
  with (ROOT/'forecast-v3.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=list(rs[0]));w.writeheader();w.writerows(rs)
  eg=load('illustrative-equity-policy-v3.json');dump('illustrative-allocation-output-v3.json',{k:allocate(v,eg,cap) for k,v in results.items()})
  sens=[]
  for w in [.07,.08,.09,.10,.11,.12]:
   for g in [.015,.02,.025,.03,.035]:
    dd=copy.deepcopy(d);dd['cases']['base']['wacc']=w;dd['cases']['base']['terminal_growth']=g;validate_model(dd);r=run_case(dd,'base');al=allocate(r,eg,cap);sens.append({'wacc':w,'g':g,'operating_ev':r['operating_ev'],'terminal_ev_fraction':r['terminal_ev_fraction'],'conditional_june_illustrative_allocation':al['conditional_june_allocation_per_share']})
  dump('sensitivity-v3.json',{'capital_anchor':'2026-06-30','information_cutoff':'2026-10-19','common':d['common'],'base_case':d['cases']['base'],'illustrative_policy':eg,'rows':sens})
  rf=load('capital-rollforward-template-v3.json');rf['user_assumptions_required']={k:0 for k in rf['user_assumptions_required']};rf['user_assumptions_required']['current_option_shares_m']=cap['reported']['option_shares_m'];rf['user_assumptions_required']['current_rsu_psu_units_m']=cap['reported']['rsu_psu_rollforward_units_m'];rf['illustration_label']='Known financing event only. All other movements explicitly assumed zero for arithmetic demonstration; never current verified capital.';dump('illustrative-financing-rollforward-policy-v3.json',rf);rr=rollforward(rf,cap);rr['illustration_label']=rf['illustration_label'];dump('illustrative-financing-rollforward-output-v3.json',rr)
 for k,r in results.items():print(k,'EV_m',round(r['operating_ev'],3),'terminal_pct',round(r['terminal_ev_fraction']*100,2),'allocation',alloc[k]['conditional_june_allocation_per_share'])
if __name__=='__main__':main()
