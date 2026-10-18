"""Internal arithmetic checks, labeled sensitivities and conditional treasury screens."""
import csv, json, copy, hashlib
import treasury_v2 as treasury
from pathlib import Path
import valuation_v2 as v
P=Path(__file__).resolve().parent
checks=[]
def check(name,cond,details=None):
 checks.append({'test':name,'passed':bool(cond),'details':details})
 if not cond:raise AssertionError(name)
def close(a,b):return abs(a-b)<1e-7*max(1,abs(a),abs(b))
models={s:v.model(s) for s in v.SCENARIOS}
for s,d in models.items():
 rows=d['rows'];t=d['terminal']
 check(s+':forecast length/stub',len(rows)==16 and rows[0]['duration_years']==.5 and rows[-1]['years_after_origin']==15.5)
 check(s+':no fabricated price',d['per_share_value'] is None and d['current_date_value'] is None)
 for r in rows:
  label=f"{s}:FY{r['fiscal_year']}"
  check(label+':revenue mix',close(r['revenue'],r['data_center_revenue']+r['communications_other_revenue']))
  check(label+':R&D capitalization cash invariance',close(r['fcff'],r['rd_capitalized_nopat']-r['total_reinvestment_including_rd']))
  check(label+':expense tax and FCFF identity',close(r['fcff'],r['expensed_rd_nopat']-r['nonresearch_reinvestment']))
  check(label+':funded capital components',close(r['nonresearch_reinvestment'],r['delta_operating_nwc']+r['delta_operating_cash']+r['net_other_operating_investment']))
  check(label+':capacity explicit',close(r['operating_nwc_end'],r['other_operating_nwc_end']+r['capacity_prepayments_end']))
  check(label+':gross investment nonnegative',r['gross_other_operating_investment']>=0 and r['net_other_operating_investment']>=-1e-8)
  check(label+':no artificial NWC release',r['delta_operating_nwc']>=0)
 check(s+':stable return reinvestment',close(t['total_reinvestment'],t['economic_nopat']*t['growth']/t['incremental_economic_roic']))
 check(s+':terminal FCFF seam',close(t['fcff'],rows[-1]['fcff']*(1+t['growth'])))
 check(s+':terminal research seam',close(t['net_research_investment'],rows[-1]['net_research_investment']*(1+t['growth'])))
 check(s+':enterprise valuation sum',close(d['enterprise_operating_value'],sum(r['pv_fcff'] for r in rows)+t['present_value']))
 higher=v.model(s,future_grants_delta=.02)
 check(s+':higher SBC lowers EV',higher['enterprise_operating_value']<d['enterprise_operating_value'])
 for a,b in zip(rows,higher['rows']):
  check(f"{s}:FY{a['fiscal_year']}:SBC sensitivity keeps cash cost fixed",all(close(a[k],b[k]) for k in ['revenue','cash_rd','cash_sga','gross_margin_before_equity_grant_cost']))
# Synthetic-only option tests, never actual MRVL price.
a=v.allocate_claims(1000,100,0,0,[])
check('synthetic:no-option 10',close(a['conditional_share_value'],10))
a=v.allocate_claims(1000,100,10,0,[])
check('synthetic:zero-price award',close(a['conditional_share_value'],1000/110))
a=v.allocate_claims(1000,100,0,0,[{'count':10,'strike':20,'years':5,'volatility':.5}])
check('synthetic:OTM option has time value',a['option_claims'][0]['value']>0 and a['conditional_share_value']<10)
check('synthetic:claim pool conservation',abs(a['reconciliation_error'])<1e-8)
check('synthetic:zero-term call',close(v.black_scholes_call(20,10,0,.5),10))
h=json.loads((P/'history-10fy-v2.json').read_text())
check('history:ten years',len(h['rows'])==10 and [r['fiscal_year'] for r in h['rows']]==list(range(2017,2027)))
for r in h['rows']:
 for k in ['revenue','ebit','net_income','rd','cfo','capex','da_ex_acquired_intangibles','acquired_intangible_amortization_cf_line','sbc']:
  check(f"history:FY{r['fiscal_year']}:{k}",r['values'][k] is not None and bool(r['provenance'].get(k)))
c=json.loads((P/'capital-claims-v2.json').read_text())['model_elections']
check('bridge:no cash/debt/claim double count',close(c['known_bridge_adjustment_before_equity_awards_and_warrants'], c['surplus_cash']+c['forward_separate_asset']-c['face_debt_deduction']-c['earnout_fair_value_deduction']-c['license_financing_deduction']-c['restructuring_deduction']-c['opening_tax_payables_deduction']))
n=c['known_nwc_components'];check('identified NWC sum',close(c['identified_operating_nwc'],n['ar']+n['inventory']+n['long_term_ship_debit_prepays']+n['capacity_prepays']-n['ap_ex_restructuring']-n['variable_consideration_liability']-n['employee_accrual']))

# Audit corrections and unchanged original economic forecasts.
with (P/'guidance-vs-actual-expanded-v2.csv').open() as f:guidance=list(csv.DictReader(f))
q=next(r for r in guidance if r['period']=='Q1 FY2025')
check('C1:statement-table Q1FY25 actual',close(float(q['revenue_actual_m']),1160.9))
check('C1:correct beat dollars',close(float(q['revenue_beat_m']),10.9))
check('C1:correct beat percentage',close(float(q['revenue_beat_pct']),10.9/1150*100))
claimdata=json.loads((P/'capital-claims-v2.json').read_text())
period=claimdata['share_and_claim_facts']['august_18_google_warrant']['measuring_period']
check('C3:exact Google measuring period',period['start']=='2026-08-01' and period['end']=='2033-01-29')
div=claimdata['model_elections']['later_dividend']
check('C2:separate dividend dates',[div[k] for k in ['declaration_date','record_date','payment_date']]==['2026-09-25','2026-10-09','2026-10-29'])
known_v1_evs={'downside':30440.712799770992,'base':100409.3580476609,'management_delivery':211790.16678180182}
for s,m in models.items():check(s+':default operating EV preserved',close(m['enterprise_operating_value'],known_v1_evs[s]))
# Different investment/rate questions must have different labels.
sensitivity=[]
sens_specs=[
 ('base assumptions',{}),
 ('future grants +2pp',{'future_grants_delta':.02}),
 ('future grants -2pp',{'future_grants_delta':-.02}),
 ('non-SBC cash costs +2pp',{'cash_cost_delta':.02}),
 ('capital efficiency -25%',{'sales_to_capital_multiplier':.75}),
 ('H2 capacity allocation/floor: net deposits1000, residual other investment may fall',{'h2_capacity_net_investment':1000}),
 ('H2 capacity allocation/floor: net deposits200, residual other investment may rise',{'h2_capacity_net_investment':200}),
 ('H2 additional capacity400 with H2 other investment fixed; later floors may adjust',{'additional_h2_capacity_stress':400}),
 ('Coupled WACC+1pp and terminal ROIC10%',{'start_wacc':v.START_WACC+.01,'terminal_wacc':.10}),
 ('Coupled WACC-1pp and terminal ROIC8%',{'start_wacc':v.START_WACC-.01,'terminal_wacc':.08}),
 ('Pure WACC+1pp with terminal ROIC fixed9%',{'start_wacc':v.START_WACC+.01,'terminal_wacc':.10,'terminal_roic':.09}),
 ('Pure WACC-1pp with terminal ROIC fixed9%',{'start_wacc':v.START_WACC-.01,'terminal_wacc':.08,'terminal_roic':.09}),
 ('terminal incremental ROIC12%, WACC unchanged',{'terminal_roic':.12})]
for s in v.SCENARIOS:
 for name,params in sens_specs:
  d=v.model(s,**params)
  sensitivity.append({'scenario':s,'change':name,'parameters':params,'operating_EV_m':d['enterprise_operating_value'],'change_from_case_m':d['enterprise_operating_value']-models[s]['enterprise_operating_value'],'terminal_ROIC':d['terminal']['incremental_economic_roic'],'terminal_WACC':d['terminal']['wacc'],'h2_nonresearch_investment':d['rows'][0]['nonresearch_reinvestment'],'h2_other_net_investment':d['rows'][0]['net_other_operating_investment'],'per_share':None})
  if 'Pure WACC' in name:
   for x,y in zip(d['rows'],models[s]['rows']):check(f"{s}:{name}:FY{x['fiscal_year']}:FCFF fixed",close(x['fcff'],y['fcff']))
   check(s+':'+name+':terminal FCFF fixed',close(d['terminal']['fcff'],models[s]['terminal']['fcff']))
  if 'additional capacity400' in name:
   x=d['rows'][0];y=models[s]['rows'][0]
   check(s+':additional H2 deposits fully funded in investment',close(x['nonresearch_reinvestment']-y['nonresearch_reinvestment'],400))
   check(s+':additional H2 deposits do not crowd out H2 other capital',close(x['net_other_operating_investment'],y['net_other_operating_investment']))
   check(s+':additional H2 capacity reduces H2 FCFF400',close(x['fcff']-y['fcff'],-400))
 original=copy.deepcopy(v.SCENARIOS[s]);v.SCENARIOS[s]['future_grants_ratio']=[.10]*5;v.SCENARIOS[s]['terminal_future_grants']=.10
 d=v.model(s)
 sensitivity.append({'scenario':s,'change':'grant charge held at10% all forecast years','parameters':{'all_future_grant_ratios':.10},'operating_EV_m':d['enterprise_operating_value'],'change_from_case_m':d['enterprise_operating_value']-models[s]['enterprise_operating_value'],'terminal_ROIC':d['terminal']['incremental_economic_roic'],'terminal_WACC':d['terminal']['wacc'],'h2_nonresearch_investment':d['rows'][0]['nonresearch_reinvestment'],'h2_other_net_investment':d['rows'][0]['net_other_operating_investment'],'per_share':None})
 v.SCENARIOS[s]=original
# Actual cash must reconcile without treating noncash SBC as cash income.
hist=json.loads((P/'historical-cash-reconciliation-v2.json').read_text())
check('actual:investing cash total',close(sum(hist['investing_lines'].values()),hist['investing_total']))
check('actual:financing cash total',close(sum(hist['financing_lines'].values()),hist['financing_total']))
check('actual:cash change',close(hist['cfo']+hist['investing_total']+hist['financing_total'],hist['net_change_cash']))
check('actual:closing cash',close(hist['opening_cash']+hist['net_change_cash'],hist['closing_cash']))
check('actual:quarter withholding sum',close(sum(hist['quarterly_employee_withholding'].values()),365.2))
check('actual:classification adjusted cash subtotal',close(hist['cfo']-282.4-5-56.6-365.2+57.5-107.7-400,84.9))
check('cash reserve:opening earmarks',close(treasury.ORIGIN_CASH-treasury.OPERATING_RESERVE-sum(treasury.OPENING_CASH_EARMARKS.values()),1992.))
check('debt:face inventory',close(sum(b['face'] for b in treasury.BONDS),4999.9))
check('dividend:stale-inventory proxy',close(treasury.DIVIDEND_PROXY,53.92227678))
funding=treasury.run_all();funding_summary=[]
for s,cases in funding.items():
 for case,d in cases.items():
  label=s+':'+case;rs=d['rows']
  check(label+':monthly window',len(rs)==186 and rs[0]['month']=='2026-08' and rs[-1]['month']=='2042-01')
  check(label+':actual funding gate retained',d['actual_liquidity_adequacy'] is None and d['covenant_compliance_forecast'] is None)
  check(label+':all legacy cash scheduled',close(sum(r['legacy_award_withholding_cash_assumption'] for r in rs),sum(treasury.LEGACY_ANNUAL_CASH.values())*d['legacy_cash_multiplier']))
  check(label+':declared dividend scheduled once',close(sum(r['declared_dividend_cash_proxy'] for r in rs),53.92227678) and sum(r['declared_dividend_cash_proxy']>0 for r in rs)==1)
  check(label+':forward payment explicit',close(sum(r['forward_cash_outflow_assumption'] for r in rs),d['forward_outflow_assumption']))
  if d['principal_policy']=='cash_repay':
   check(label+':existing principal paid once',close(sum(r['bond_principal_due'] for r in rs),4999.9))
   totals={fy:sum(r['bond_principal_due'] for r in rs if r['fiscal_year']==fy) for fy in range(2027,2043)}
   expected={2029:1249.9,2030:500.,2031:500.,2032:750.,2034:500.,2036:500.,2037:1000.}
   for fy,x in totals.items():check(label+f':FY{fy}:principal fiscal bucket',close(x,expected.get(fy,0.)))
  for i,r in enumerate(rs):
   k=label+':'+r['month']
   uses=sum(r[x] for x in ['nonresearch_investment_cash','legacy_award_withholding_cash_assumption','new_award_withholding_cash_assumption','declared_dividend_cash_proxy','forward_cash_outflow_assumption','bond_coupon_cash','bond_principal_due','hypothetical_refinancing_fee','revolver_interest_cash','commitment_fee_cash','revolver_mandatory_repayment','revolver_voluntary_repayment'])
   check(k+':cash identity',close(r['closing_surplus_cash'],r['opening_surplus_cash']+r['cash_operating_nopat_proxy']-uses+r['hypothetical_refinancing_proceeds']+r['conditional_revolver_draw']))
   check(k+':revolver identity',close(r['closing_revolver'],r['opening_revolver']+r['conditional_revolver_draw']-r['revolver_mandatory_repayment']-r['revolver_voluntary_repayment']))
   check(k+':commitment fee accrued and settled',close(r['closing_commitment_fee_accrual'],r['opening_commitment_fee_accrual']+r['new_commitment_fee_accrual']-r['commitment_fee_cash']))
   if int(r['month'][5:]) not in (3,6,9,12):check(k+':commitment fee quarterly cash dates',r['commitment_fee_cash']==0)
   check(k+':economic-to-cash compensation',close(r['cash_operating_nopat_proxy'],r['economic_nopat']+r['economic_newgrant_addback']-r['reversal_of_unproven_grant_tax_deduction']))
   check(k+':borrowing within nominal limit',r['closing_revolver']>=-1e-8 and r['opening_revolver']+r['conditional_revolver_draw']<=1500+1e-8)
   if i:check(k+':cash continuity',close(r['opening_surplus_cash'],rs[i-1]['closing_surplus_cash']))
   if r['month']>='2030-06':check(k+':no perpetual revolver',r['conditional_revolver_draw']==0 and r['closing_revolver']==0 and not r['facility_available_by_date'])
   if r['month']>'2030-06':check(k+':no post-expiry revolver fee',r['commitment_fee_cash']==0 and r['revolver_interest_cash']==0)
   if not d['conditional_revolver_enabled']:check(k+':no unapproved assumed credit',r['conditional_revolver_draw']==0)
   if d['principal_policy']=='refinance_all':
    check(k+':refinance proceeds match due',close(r['hypothetical_refinancing_proceeds'],r['bond_principal_due']))
    check(k+':refinance fees funded',close(r['hypothetical_refinancing_fee'],r['bond_principal_due']*.005))
   else:check(k+':cash repayment no hidden rollover',r['hypothetical_refinancing_proceeds']==0 and r['hypothetical_refinancing_fee']==0)
   if d['compensation_policy']=='cash_replacement':check(k+':cash new-compensation not charged twice',r['economic_newgrant_addback']==0 and r['new_award_withholding_cash_assumption']==0)
   else:
    check(k+':new award tax benefit reversed',r['reversal_of_unproven_grant_tax_deduction']>0)
    cohorts=sum(rs[i-lag]['economic_newgrant_addback']*.25 for lag in [12,24,36,48] if i>=lag)*d['new_award_settlement_value_multiplier']
    check(k+':new award cohort withholding',close(r['new_award_withholding_cash_assumption'],cohorts*d['new_award_withholding_rate_assumption']))
  gap=max(0.,-min([1992.]+[r['surplus_before_positive_month_nopat'] for r in rs]))
  check(label+':reported gap follows cash path',close(gap,d['additional_financing_needed_under_assumptions']))
  for fy in range(2027,2043):
   actual_investment=sum(r['nonresearch_investment_cash'] for r in rs if r['fiscal_year']==fy)
   reference=v.model(s,additional_h2_capacity_stress=d['additional_h2_capacity_stress'])['rows'][fy-2027]['nonresearch_reinvestment']
   check(label+f':FY{fy}:all economic investment retained',close(actual_investment,reference))
  funding_summary.append({'scenario':s,'cash_policy':case,'minimum_month_end_surplus_m':d['minimum_month_end_surplus'],'pre_financing_cash_gap_m':d['additional_financing_needed_under_assumptions'],'peak_conditional_revolver_m':d['peak_conditional_revolver'],'actual_liquidity_adequacy':None})
# Preservation checks run when original files are present; standalone ZIP reports their absence honestly.
root=P.parent;preservation={'checked':False,'reason':'Original sibling v1/audit archives are not present in this standalone distribution.'}
if (root/'v2-original-v1-hashes.json').exists():
 hashes=json.loads((root/'v2-original-v1-hashes.json').read_text())
 for name,want in hashes.items():check('preserve-v1:'+name,hashlib.sha256((root/name).read_bytes()).hexdigest()==want)
 check('preserve-v1:ZIP',hashlib.sha256((root/'MRVL-public-research-v1.zip').read_bytes()).hexdigest()=='6dc5506b01a52a7043c25fe94e656fb28daab2c1e3e42e135dff04cd7358010d')
 old_sources=json.loads((root/'public-safe-v1/source-ledger-v1.json').read_text())['sources']
 new_sources=json.loads((P/'source-ledger-v2.json').read_text())['sources']
 check('preserve-v1:source records',new_sources[:len(old_sources)]==old_sources)
 old_models=json.loads((root/'public-safe-v1/forecast-scenarios-v1.json').read_text())
 for s,d in models.items():
  for x,y in zip(d['rows'],old_models[s]['rows']):
   check(f"preserve-v1:{s}:FY{x['fiscal_year']}:all original row fields",all(x[k]==val for k,val in y.items()))
 preservation={'checked':True,'original_public_file_hashes_unchanged':len(hashes),'original_zip_unchanged':True,'original_source_records_unchanged':len(old_sources),'default_original_model_row_values_unchanged':True}
for fn,data in [('forecast-scenarios-v2.json',models),('sensitivities-v2.json',sensitivity),('conditional-funding-v2.json',funding)]:
 (P/fn).write_text(json.dumps(data,indent=2)+'\n')
with (P/'forecast-scenarios-v2.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['scenario']+list(models['base']['rows'][0]));w.writeheader()
 for s,d in models.items():
  for row in d['rows']:w.writerow({'scenario':s,**row})
with (P/'funding-summary-v2.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(funding_summary[0]));w.writeheader();w.writerows(funding_summary)
(P/'validation-v2.json').write_text(json.dumps({'status':'PASS','passed':len(checks),'failed':0,'note':'Internal reproducibility and arithmetic checks only; v2 independent research review pending. Unresolved fact gates are not marked as passed facts.','preservation':preservation,'checks':checks},indent=2)+'\n')
print(json.dumps({'passed':len(checks),'failed':0,'preservation':preservation,'funding_summary':funding_summary,'base_sensitivities':[r for r in sensitivity if r['scenario']=='base']},indent=2))
