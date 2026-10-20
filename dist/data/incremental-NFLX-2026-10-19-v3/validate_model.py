"""Author checks. Independent arithmetic, source-table matches, selected boundary and economics probes."""
import json,pathlib,math,copy,datetime,subprocess,sys
import replay_dcf as m
R=pathlib.Path(__file__).resolve().parent
checks=[]
def check(name,cond,detail=None):
 checks.append({'name':name,'pass':bool(cond),'detail':detail})
def near(a,b):return abs(a-b)<=max(1e-7,abs(b)*1e-10)
d=m.load('dcf-inputs-v3.json');out=m.load('dcf-output-v3.json');cap=m.load('capital-claims-v3.json');pol=m.load('illustrative-equity-policy-v3.json');hist=m.load('history-v3.json')['annual_periods']
check('Ten complete fiscal years', [r['fiscal_year'] for r in hist]==list(range(2016,2026)))
primary=m.load('history-primary-table-checks-v3.json');check('Seventy primary-table matches',len(primary)==70 and all(x['match'] for x in primary))
for row in hist:
 y=row['fiscal_year'];check(f'{y} cash-content identity',near(row['content_cash_payments_derived'],-row['content_additions_signed']-row['content_liabilities_change_signed']))
 check(f'{y} CFO less PPE identity',near(row['cfo_less_ppe_purchases'],row['cfo']-row['ppe_purchases']))
 check(f'{y} shares distinct concepts',row['common_shares_actual_split_adjusted_m']!=row['eps_weighted_diluted_shares_split_adjusted_m'])
check('Earlier current debt null retained',all(hist[i]['debt_current_carrying'] is None for i in range(3)))
check('June cash bridge excludes restricted cash',near(cap['reported']['cash']+cap['reported']['short_term_investments'],9127.910))
check('June debt carrying identity',near(cap['reported']['debt_current_carrying']+cap['reported']['debt_noncurrent_carrying'],cap['reported']['debt_total_carrying']))
check('June actual shares exact count',near(cap['reported']['actual_common_shares_m']*1e6,4163939676))
for name,c in d['cases'].items():
 r=out['cases'][name];a=d['common']['actual_h1_2026'];f=c['full_year_2026_assumptions'];h=c['h2_2026_assumptions'];pv=0
 for idx,got in enumerate(r['forecast']):
  y=2026+idx
  if idx==0:
   rev=f['revenue']-a['revenue'];ebit=f['revenue']*f['ebit_margin']-a['ebit'];tax=h['cash_tax_rate'];am=f['content_amortization']-a['content_amortization'];cash=f['content_amortization']*f['cash_content_to_amortization']-9911.018;da=f['noncontent_da']-a['noncontent_da'];ppe=f['ppe_capex']-a['ppe_purchases'];wc=h['noncontent_nwc_investment']
  else:
   q=c['annual_assumptions'][idx-1];old=f['revenue'] if idx==1 else rev;rev=old*(1+q['revenue_growth']);ebit=rev*q['ebit_margin'];tax=q['cash_tax_rate'];am=rev*q['content_amortization_pct_revenue'];cash=am*q['cash_content_to_amortization'];da=rev*q['noncontent_da_pct_revenue'];ppe=rev*q['ppe_capex_pct_revenue'];wc=(rev-old)*q['incremental_noncontent_nwc_pct_delta_revenue']
  fc=ebit*(1-tax)+am-cash+da-ppe-wc;t=(datetime.date(y,12,31)-datetime.date(2026,6,30)).days/365.25;pv+=fc/(1+c['wacc'])**t
  check(f'{name} {y} independent FCFF and date',near(fc,got['fcff']) and near(t,got['discount_time_years']))
 tr=c['terminal'];g=c['terminal_growth'];rv=rev*(1+g);np=rv*tr['ebit_margin']*(1-tr['cash_tax_rate']);component=rv*tr['content_amortization_pct_revenue']*(tr['cash_content_to_amortization']-1)+rv*(tr['ppe_capex_pct_revenue']-tr['noncontent_da_pct_revenue'])+(rv-rev)*tr['incremental_noncontent_nwc_pct_delta_revenue'];re=max(component,np*g/c['terminal_incremental_roic']);tf=np-re;tp=tf/(c['wacc']-g)/(1+c['wacc'])**t
 check(f'{name} independent terminal & EV',near(tf,r['terminal']['fcff']) and near(tp,r['terminal_pv']) and near(pv+tp,r['operating_ev']))
 check(f'{name} terminal dependence',near(tp/(pv+tp),r['terminal_ev_fraction']))
 check(f'{name} terminal reinvestment floors retained',r['terminal']['selected_net_reinvestment']>=r['terminal']['component_net_reinvestment'] and r['terminal']['selected_net_reinvestment']>=r['terminal']['roic_required_net_reinvestment'])
 check(f'{name} no default allocation',out['allocations'][name]['conditional_june_allocation_per_share'] is None)
 ex=m.allocate(r,pol,cap);p=ex['conditional_june_allocation_per_share'];check(f'{name} conditional option allocation identity',p is not None and near(ex['equity_before_existing_award_claims'],ex['ordinary_and_rsu_units_m']*p+ex['option_value_proxy']))
 check(f'{name} option time value retained',ex['per_option_value_proxy']>=max(p-cap['reported']['option_weighted_strike_usd'],0))
 check(f'{name} funding proxy minimum',all(z['reserve_shortfall']==0 for z in ex['funding_stress']))
 check(f'{name} current outputs withheld',ex['current_target'] is None and r['current_target'] is None and ex['current_upside'] is None)
# Null and invalid probes correspond to concrete economic/data errors, not a broad random test count.
probes=[('WACC equal growth',lambda x:x['cases']['base'].update(wacc=.025)),('negative tax',lambda x:x['cases']['base']['terminal'].update(cash_tax_rate=-.1)),('NaN growth',lambda x:x['cases']['base']['annual_assumptions'][0].update(revenue_growth=float('nan'))),('null capex',lambda x:x['cases']['base']['terminal'].update(ppe_capex_pct_revenue=None)),('boolean WACC',lambda x:x['cases']['base'].update(wacc=True)),('wrong source share/date perimeter',lambda x:x['common'].update(capital_anchor='2026-10-19')),('modified source H1 actual',lambda x:x['common']['actual_h1_2026'].update(ebit=1)),('missing annual year',lambda x:x['cases']['base']['annual_assumptions'].pop()),('cash content missing maintenance',lambda x:x['cases']['base']['terminal'].update(cash_content_to_amortization=.8)),('inconsistent FY/H1 revenue',lambda x:x['cases']['base']['full_year_2026_assumptions'].update(revenue=20000))]
for name,change in probes:
 x=copy.deepcopy(d);change(x)
 try:m.validate_model(x);ok=False
 except (ValueError,KeyError,TypeError):ok=True
 check('Reject '+name,ok)
x=copy.deepcopy(pol);del x['accept_existing_award_and_future_sbc_nonoverlap'];z=m.allocate(out['cases']['base'],x,cap);check('Deleted policy acknowledgment stays incomplete',z['conditional_june_allocation_per_share'] is None)
x=copy.deepcopy(pol);x['debt_value']=0
try:m.allocate(out['cases']['base'],x,cap);ok=False
except ValueError:ok=True
check('Reject known debt silently erased',ok)
# Claims cash and valuation reserves cannot be freely decoupled.
x=copy.deepcopy(pol);x['income_tax_claim_reserve']=0
try:m.allocate(out['cases']['base'],x,cap);ok=False
except ValueError:ok=True
check('Reject below-PV claim reserve',ok)
x=copy.deepcopy(pol);x['as_of']='2026-10-19'
try:m.allocate(out['cases']['base'],x,cap);ok=False
except ValueError:ok=True
check('Reject redating dated allocation',ok)
x=copy.deepcopy(pol);x['other_claim_reserve']=100000;x['separate_claim_cash_by_year']['2026']+=100000
z=m.allocate(out['cases']['base'],x,cap);check('Funding failure suppresses allocation',z['conditional_june_allocation_per_share'] is None)
rf=m.load('capital-rollforward-template-v3.json');check('Missing capital roll-forward remains unknown',m.rollforward(rf,cap)['projected_capital'] is None)
rf=m.load('illustrative-financing-rollforward-policy-v3.json');z=m.rollforward(rf,cap);check('July debt and cash paired',near(z['projected_capital']['net_debt_face']-(14372-9127.910),11.45))
# Monotonic economics tests and standalone sensitivity exports.
base=out['cases']['base'];stresses=[]
for name,change in [
 ('Content cash ratio +0.10',lambda x:[q.update(cash_content_to_amortization=q['cash_content_to_amortization']+.10) for q in x['cases']['base']['annual_assumptions']+[x['cases']['base']['terminal']]]),
 ('Operating margin -3 percentage points',lambda x:[q.update(ebit_margin=q['ebit_margin']-.03) for q in x['cases']['base']['annual_assumptions']+[x['cases']['base']['terminal']]]),
 ('Cash tax +5 percentage points',lambda x:[q.update(cash_tax_rate=q['cash_tax_rate']+.05) for q in x['cases']['base']['annual_assumptions']+[x['cases']['base']['terminal']]])]:
 x=copy.deepcopy(d);change(x);m.validate_model(x);v=m.run_case(x,'base');al=m.allocate(v,pol,cap);check(name+' lowers EV',v['operating_ev']<base['operating_ev']);stresses.append({'stress':name,'resolved_assumptions':x['cases']['base'],'operating_ev':v['operating_ev'],'ev_change':v['operating_ev']-base['operating_ev'],'conditional_june_allocation_per_share':al['conditional_june_allocation_per_share'],'terminal_ev_fraction':v['terminal_ev_fraction']})
check('Black-Scholes simple zero spot',m.bs_call(0,39.21,4.5,.35,.04)==0)
check('Three positive but uncertain cases',all(v['operating_ev']>0 and v['terminal']['fcff']>0 for v in out['cases'].values()))
# Targeted repairs from independent v1 review, tested on editable and direct-call boundaries.
check('Paid Brazil amount sourced and no stale reserve field',cap['reported']['brazil_prior_period_non_income_tax_paid_h1']==729 and 'brazil_deposit_or_claim_reserve' not in pol)
check('Example Brazil zero is additional exposure only',pol['additional_brazil_claim_excluding_paid_729']==0)
check('Claim reserve excludes paid Brazil and includes financing derivatives',near(m.allocate(base,pol,cap)['separate_claim_reserve'],566+250+13.574+100) and near(pol['separate_claim_cash_by_year']['2026'],929.574))
check('Financing net interest claim identity',near(cap['reported']['interest_rate_derivative_liabilities_noncurrent']-cap['reported']['interest_rate_derivative_assets_current']-cap['reported']['interest_rate_derivative_assets_noncurrent'],13.574))
check('Unidentified financing FX fair value stays null in source facts',cap['reported']['financing_fx_net_fair_value_separately_disclosed'] is None)
x=copy.deepcopy(d);cc=x['cases']['base'];cc['full_year_2026_assumptions'].update(content_amortization=10000,cash_content_to_amortization=1)
for q in cc['annual_assumptions']+[cc['terminal']]:q.update(content_amortization_pct_revenue=.001,cash_content_to_amortization=1)
try:m.validate_model(x);ok=False
except ValueError:ok=True
check('Reject independent low-content counterexample',ok)
low=m.run_case(x,'base');al=m.allocate(low,pol,cap)
check('Direct allocation also withholds low-content counterexample',al['status']=='withheld_content_commitment_coverage' and al['conditional_june_allocation_per_share'] is None)
check('Counterexample hard upper bound independently reproduced',near(al['content_commitment_coverage']['hard_upper_bound_including_all_fy2027_cash'],145.814))
cc['h1_2027_fraction_of_annual_content_cash']=1
try:m.validate_model(x);ok=False
except ValueError:ok=True
check('Frontloading cannot rescue impossible annual cash',ok)
# Construct exact aggregate coverage using the actual first-half timing input.
x=copy.deepcopy(d);r=m.run_case(x,'base');h2=r['forecast'][0]['content_cash_payments'];fy27=r['forecast'][1]['content_cash_payments'];fraction=(11939.734-h2)/fy27
x['cases']['base']['h1_2027_fraction_of_annual_content_cash']=fraction;m.validate_model(x);z=m.allocate(m.run_case(x,'base'),pol,cap)
check('Exact disclosed obligation boundary passes necessary gate',z['content_commitment_coverage']['passed'] and near(z['content_commitment_coverage']['assumed_next12m_cash'],11939.734))
x['cases']['base']['h1_2027_fraction_of_annual_content_cash']=fraction-.01/fy27
try:m.validate_model(x);ok=False
except ValueError:ok=True
check('Below disclosed obligation boundary rejected',ok)
z=m.allocate(m.run_case(x,'base'),pol,cap);check('Below boundary direct allocation withheld',z['conditional_june_allocation_per_share'] is None)
for value in [None,True,-.01,1.01,float('nan')]:
 x=copy.deepcopy(d);x['cases']['base']['h1_2027_fraction_of_annual_content_cash']=value
 try:m.validate_model(x);ok=False
 except (ValueError,TypeError):ok=True
 check('Reject invalid content payment fraction '+str(value),ok)
for key,value in [('financing_interest_rate_derivative_reserve',0),('debt_value',14309.306),('debt_valuation_basis','carrying_including_hedge_adjustment')]:
 x=copy.deepcopy(pol);x[key]=value
 try:m.allocate(base,x,cap);ok=False
 except ValueError:ok=True
 check('Reject unmatched financing policy '+key,ok)
x=copy.deepcopy(pol);x['separate_claim_cash_by_year']['2026']=0
try:m.allocate(base,x,cap);ok=False
except ValueError:ok=True
check('Financing closeout must have paired H2 cash use',ok)
for key in ['additional_brazil_claim_excluding_paid_729','financing_fx_derivative_net_claim_reserve','existing_unvested_award_expense_in_ebit_by_year']:
 x=copy.deepcopy(pol);x[key]=None;z=m.allocate(base,x,cap)
 check('Missing required repair policy withholds '+key,z['conditional_june_allocation_per_share'] is None)
for name,core in out['cases'].items():
 z=m.allocate(core,pol,cap);expected_pv=sum(pol['existing_unvested_award_expense_in_ebit_by_year'][str(q['year'])]*(1-q['cash_tax_rate'])/(1+d['cases'][name]['wacc'])**q['discount_time_years'] for q in core['forecast'])
 check(name+' existing award expense PV independently matched',near(z['existing_award_expense_aftertax_pv'],expected_pv) and near(z['allocation_adjusted_operating_ev'],core['operating_ev']+expected_pv))
 cash=9127.910
 for row in z['funding_stress']:cash+=row['core_fcff']+row['aftertax_existing_award_expense_removed']-row['assumed_interest_cash_after_tax']-row['principal_paid']-row['separate_claim_cash']
 check(name+' funding includes only explicit expense adjustment',near(cash,z['funding_stress'][-1]['annual_cash_capacity_proxy']))
 check(name+' no perpetual existing-award expense addback',z['existing_award_expense_adjustments'][-1]['aftertax_existing_award_expense_removed']==0 and core['terminal']==out['cases'][name]['terminal'])
x=copy.deepcopy(pol);x['existing_unvested_award_expense_in_ebit_by_year']['2027']=None
try:m.allocate(base,x,cap);ok=False
except ValueError:ok=True
check('Null existing-award expense never silently zero',ok)
# F5: joint budget, source-context, recognition-window and retained-cost envelopes.
def allocation_rejects(policy,core=base):
 try:m.allocate(core,policy,cap);return False
 except (ValueError,KeyError,TypeError):return True
for label,value in [('exceeds all costs',1000000),('fits total but exceeds residual',10000),('erases all residual',8690.226)]:
 x=copy.deepcopy(pol);x['existing_unvested_award_expense_in_ebit_by_year']['2026']=value
 check('Reject reviewer counterexample '+label,allocation_rejects(x))
 # Updating the selected budget cannot bypass the separate source-context boundary.
 x['existing_award_remaining_expense_assumption']=sum(x['existing_unvested_award_expense_in_ebit_by_year'].values())
 check('Reject counterexample with enlarged budget '+label,allocation_rejects(x))
x=copy.deepcopy(pol);x['existing_unvested_award_expense_in_ebit_by_year']['2035']=25;x['existing_award_remaining_expense_assumption']=85
check('Reject reviewer 2035 existing-award expense',allocation_rejects(x))
check('Named schedule exactly uses selected budget',sum(pol['existing_unvested_award_expense_in_ebit_by_year'].values())==pol['existing_award_remaining_expense_assumption']==60)
for delta in [-.000001,.000001]:
 x=copy.deepcopy(pol);x['existing_unvested_award_expense_in_ebit_by_year']['2026']+=delta
 check('Reject unreconciled budget delta '+str(delta),allocation_rejects(x))
reference=47+1.245383*82.91
for delta in [0,.000001]:
 x=copy.deepcopy(pol);x['existing_award_remaining_expense_assumption']=reference+delta;x['existing_unvested_award_expense_in_ebit_by_year']={str(y):reference+delta if y==2026 else 0 for y in range(2026,2036)}
 check('Source-context envelope boundary '+str(delta),allocation_rejects(x) if delta else m.allocate(base,x,cap)['status']=='conditional_illustration')
# Budget, expense, and residual cash-cost capacity must hold together, not one scalar in isolation.
r=base['forecast'][0];residual=r['revenue']-r['ebit']-r['content_amortization']-r['noncontent_da'];retained_comp=r['revenue']*pol['retained_future_grant_cash_compensation_pct_revenue_by_year']['2026'];exact_other=(residual-retained_comp-25)/r['revenue']
for delta in [-.000001,0,.000001]:
 x=copy.deepcopy(pol);x['retained_other_cash_operating_cost_pct_revenue_by_year']['2026']=exact_other;x['existing_unvested_award_expense_in_ebit_by_year']['2026']=25+delta;x['existing_award_remaining_expense_assumption']=60+delta
 if delta>0:check('Reject expense just above residual after retained costs',allocation_rejects(x))
 else:
  z=m.allocate(base,x,cap);first=z['existing_award_expense_envelope']['period_envelopes'][0]
  check('Cost-envelope boundary '+str(delta),z['status']=='conditional_illustration' and near(first['unallocated_cost_headroom'],-delta))
x=copy.deepcopy(pol);x['existing_award_latest_recognition_date']='2029-06-30';x['existing_unvested_award_expense_in_ebit_by_year']={str(y):60 if y==2029 else 0 for y in range(2026,2036)}
z=m.allocate(base,x,cap);check('Maximum supported horizon allows only its partial last year',z['status']=='conditional_illustration' and z['existing_award_expense_envelope']['period_envelopes'][3]['latest_assumed_recognition_date']=='2029-06-30')
x['existing_unvested_award_expense_in_ebit_by_year']['2029']=0;x['existing_unvested_award_expense_in_ebit_by_year']['2030']=60
check('Expense after maximum recognition year rejected',allocation_rejects(x))
x=copy.deepcopy(pol);x['existing_unvested_award_expense_in_ebit_by_year']['2028']=0;x['existing_unvested_award_expense_in_ebit_by_year']['2029']=10
check('Expense after selected recognition horizon rejected',allocation_rejects(x))
for value in ['2029-07-01','2035-12-31','2026-06-30','not-a-date',True]:
 x=copy.deepcopy(pol);x['existing_award_latest_recognition_date']=value
 check('Reject invalid award horizon '+str(value),allocation_rejects(x))
for key in ['existing_award_remaining_expense_assumption','existing_award_latest_recognition_date','retained_future_grant_cash_compensation_pct_revenue_by_year','retained_other_cash_operating_cost_pct_revenue_by_year']:
 x=copy.deepcopy(pol);x[key]=None;z=m.allocate(base,x,cap)
 check('Missing F5 field withholds '+key,z['conditional_june_allocation_per_share'] is None)
for key in ['accept_existing_award_no_unmodeled_positive_cost_additions','accept_source_context_compensation_floor_convention']:
 x=copy.deepcopy(pol);x[key]=False;check('Absent convention acknowledgment withholds '+key,m.allocate(base,x,cap)['conditional_june_allocation_per_share'] is None)
x=copy.deepcopy(pol);x['existing_award_remaining_expense_assumption']=0;x['existing_unvested_award_expense_in_ebit_by_year']={str(y):0 for y in range(2026,2036)}
z=m.allocate(base,x,cap);check('Deliberately zero remaining expense gives no addback',z['status']=='conditional_illustration' and z['existing_award_expense_aftertax_pv']==0 and z['allocation_adjusted_operating_ev']==base['operating_ev'])
for value in [-1,float('nan'),float('inf'),True]:
 x=copy.deepcopy(pol);x['existing_award_remaining_expense_assumption']=value
 check('Reject invalid remaining expense assumption '+str(value),allocation_rejects(x))
comp_reference=368.449/45183.036
x=copy.deepcopy(pol);x['retained_future_grant_cash_compensation_pct_revenue_by_year']['2026']=comp_reference
check('Source-context forward-compensation floor exact boundary',m.allocate(base,x,cap)['status']=='conditional_illustration')
x['retained_future_grant_cash_compensation_pct_revenue_by_year']['2026']=comp_reference-1e-10
check('Reject below supported compensation floor',allocation_rejects(x))
for key in ['retained_future_grant_cash_compensation_pct_revenue_by_year','retained_other_cash_operating_cost_pct_revenue_by_year']:
 for value in [0,-.01,None,float('nan'),float('inf'),True]:
  x=copy.deepcopy(pol);x[key]['2026']=value
  check('Reject invalid retained-cost entry '+key+' '+str(value),allocation_rejects(x))
 x=copy.deepcopy(pol);del x[key]['2036'];check('Missing terminal retained cost rejected '+key,allocation_rejects(x))
x=copy.deepcopy(pol);x['retained_other_cash_operating_cost_pct_revenue_by_year']['2026']=1
check('Retained costs cannot exceed residual envelope',allocation_rejects(x))
x=copy.deepcopy(d);x['cases']['base']['annual_assumptions'][0]['ebit_margin']=.7
try:m.validate_model(x);ok=False
except ValueError:ok=True
check('Core rejects explicit amortization greater than all costs',ok)
check('Direct allocation rejects impossible component costs',allocation_rejects(pol,m.run_case(x,'base')))
for name,core in out['cases'].items():
 z=m.allocate(core,pol,cap);env=z['existing_award_expense_envelope'];check(name+' all periods retain compensation and other costs',all(q['future_grant_cash_compensation_retained']>0 and q['other_cash_operating_cost_retained']>0 and q['unallocated_cost_headroom']>=0 for q in env['period_envelopes']))
 check(name+' retained cost floors do not double subtract FCFF',near(z['allocation_adjusted_operating_ev'],core['operating_ev']+z['existing_award_expense_aftertax_pv']))
m.dump('stress-output-v3.json',{'label':'Analyst sensitivity, June anchor only','common':d['common'],'baseline':d['cases']['base'],'equity_policy':pol,'stresses':stresses})
result={'status':'pass' if all(c['pass'] for c in checks) else 'FAIL','author_check_count':len(checks),'failed':[c for c in checks if not c['pass']],'checks':checks,'independent_review':'pending; these are author tests, not independent review'};m.dump('model-validation-v3.json',result);print(result['status'],len(checks),'checks',result['failed'])
if result['failed']:sys.exit(1)
