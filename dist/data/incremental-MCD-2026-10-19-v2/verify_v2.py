#!/usr/bin/env python3
"""Focused author checks. No network; no writes unless --write-report. Independent review remains separate."""
import json,pathlib,math,copy,importlib.util,csv,sys,hashlib
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('mcd_v2_checked_engine',P/'replay_dcf_v2.py');engine=importlib.util.module_from_spec(spec);spec.loader.exec_module(engine)
checks=[]
def ck(name,truth):
 checks.append({'name':name,'pass':bool(truth)})
 if not truth:raise AssertionError(name)
def near(a,b,tol=1e-7):return abs(a-b)<=tol*max(1,abs(a),abs(b))
def bad(name,fn):
 try:fn()
 except (ValueError,KeyError,TypeError):ck(name,True);return
 ck(name,False)
d=json.loads((P/'dcf-inputs-v2.json').read_text());h=json.loads((P/'history-v2.json').read_text());out=json.loads((P/'dcf-output-v2.json').read_text());pr=json.loads((P/'history-field-provenance-v2.json').read_text());half=json.loads((P/'latest-half-v2.json').read_text())
ck('exactly ten consecutive fiscal years',[r['fiscal_year'] for r in h['rows']]==list(range(2016,2026)))
core=['revenue','franchise_revenue','company_restaurant_sales','rent_revenue','royalty_revenue','initial_franchise_fee_revenue','ebit_gaap','net_income','pretax_income','income_tax_expense','cfo','cash_capex','consolidated_da_cash_flow','sbc','basic_weighted_average_shares','diluted_weighted_average_shares','total_restaurants','franchised_restaurants','company_restaurants']
for r in h['rows']:
 y=r['fiscal_year']
 for k in core:ck(f'{y} present finite {k}',r[k] is not None and math.isfinite(r[k]))
 ck(f'{y} revenue reconciliation',abs(r['revenue']-r['franchise_revenue']-r['company_restaurant_sales']-(r['other_revenue'] if r['other_revenue'] is not None else 0))<=1.1)
 ck(f'{y} rent royalty fees reconcile',abs(r['franchise_revenue']-r['rent_revenue']-r['royalty_revenue']-r['initial_franchise_fee_revenue'])<=1.1)
 ck(f'{y} net income reconciliation',abs(r['pretax_income']-r['income_tax_expense']-r['net_income'])<=1.1)
 ck(f'{y} diluted EPS and million-share normalization',abs(r['net_income']/r['diluted_weighted_average_shares']-r['diluted_eps'])<.011)
 ck(f'{y} basic EPS and million-share normalization',abs(r['net_income']/r['basic_weighted_average_shares']-r['basic_eps'])<.011)
 ck(f'{y} restaurants reconcile',r['company_restaurants']+r['franchised_restaurants']==r['total_restaurants'])
 ck(f'{y} ownership cohorts reconcile',r['conventional_franchise_restaurants']+r['developmental_licensed_restaurants']+r['affiliate_restaurants']==r['franchised_restaurants'])
 ck(f'{y} franchise sales cohorts reconcile',abs(r['conventional_franchisee_sales']+r['developmental_licensee_sales']+r['affiliate_restaurant_sales']-r['franchisee_sales_not_reported_revenue'])<=1)
 ck(f'{y} system sales excludes fee double count',near(r['systemwide_sales_derived'],r['franchisee_sales_not_reported_revenue']+r['company_restaurant_sales']))
 ck(f'{y} CFO-capex distinct from FCFF',near(r['cfo_less_cash_capex'],r['cfo']-r['cash_capex']))
 for k in core:
  ck(f'{y} primary provenance {k}',any(f['field']==k and f['end']==r['period_end'] and f['value']==r[k] and f['url'].startswith('https://www.sec.gov/') for f in pr['facts']))
ck('2016 and2017 missing other revenue remain null',h['rows'][0]['other_revenue'] is None and h['rows'][1]['other_revenue'] is None)
ck('2025 total DA is2199 not457',h['rows'][-1]['consolidated_da_cash_flow']==2199 and h['rows'][-1]['sga_only_da_not_total']==457)
ck('June exact cover shares matched to date',half['common_shares_exact'][0]['value']==707641531 and half['common_shares_exact'][0]['end']=='2026-06-30')
ck('June total versus primary affiliate income separated',half['values']['equity_method_income']==122 and half['values']['primary_equity_method_investments_income']==98)
ck('June finance lease split stays missing',half['values']['finance_lease_current'] is None and half['values']['finance_lease_noncurrent'] is None)
fresh=engine.run(d)
ck('output replay equality',fresh==out)
for sn,r in fresh['results'].items():
 c=d['scenarios'][sn];rows=r['rows'];ck(sn+' correct periods',[x['cashflow_period'] for x in rows]==['2026-H2']+[str(y) for y in range(2027,2037)])
 ck(sn+' default per share withheld',r['dated_per_share_allocation'] is None and r['current_target'] is None and r['current_upside'] is None)
 ck(sn+' EV decomposition',near(r['core_operating_ev'],r['explicit_period_pv']+r['terminal_pv']))
 ck(sn+' terminal fraction',near(r['terminal_ev_fraction'],r['terminal_pv']/r['core_operating_ev']))
 ck(sn+' terminal reinvestment',near(r['terminal_reinvestment'],r['terminal_nopat']*c['terminal_g']/c['terminal_roic']))
 ck(sn+' terminal PV timing',near(r['terminal_pv'],r['terminal_fcff']/(c['wacc']-c['terminal_g'])/(1+c['wacc'])**10.5))
 for x in rows:
  name=f"{sn} {x['cashflow_period']} "
  ck(name+'revenue components',near(x['full_year_reported_revenue_proxy'],x['franchise_revenue']+x['company_revenue']+x['other_revenue']))
  ck(name+'system sales not corporate revenue',near(x['systemwide_sales'],x['franchisee_sales']+x['company_revenue']))
  ck(name+'rent relief once',near(x['rent_revenue_after_relief'],x['gross_rent_revenue']-x['next_rent_relief']))
  ck(name+'FCFF identity',near(x['fcff'],x['nopat']+x['consolidated_da']-x['cash_capex']-x['new_finance_lease_assets_as_economic_capex']-x['change_in_nwc']))
  ck(name+'discount exponent',near(x['pv_fcff'],x['fcff']/(1+c['wacc'])**x['discount_years_from_2026_06_30']))
  ck(name+'positive cashflows',x['fcff']>0)
  ck(name+'no units double count',x['weighted_unit_sales_contribution']<=c['restaurant_count_growth'][x['fiscal_year']-2026])
 ck(sn+' H2 capex subtracts observed H1',near(rows[0]['cash_capex'],c['cash_capex_baseline'][0]+c['next_capital_support'][0]-1516))
 ck(sn+' H2 DA subtracts observed H1',near(rows[0]['consolidated_da'],c['da'][0]-1131))
# Crucial support non-overlap: removing support raises FCFF only by tax-adjusted rent relief + capital support.
c=copy.deepcopy(d['scenarios']['base']);no=copy.deepcopy(c);no['next_rent_relief']=[0]*11;no['next_capital_support']=[0]*11;a=engine.case(d,'base',c);b=engine.case(d,'base',no);delta_pv=0
for ar,br in zip(a['rows'],b['rows']):
 i=ar['fiscal_year']-2026;expected=c['next_rent_relief'][i]*(1-c['cash_tax_rate'][i])+c['next_capital_support'][i]
 ck(str(i)+' NEXT FCFF single charge',near(br['fcff']-ar['fcff'],expected))
 ck(str(i)+' NEXT does not create NWC credit',near(ar['change_in_nwc'],br['change_in_nwc']))
 ck(str(i)+' margin derived after rent relief',near(ar['full_year_core_margin'],ar['full_year_core_ebit']/ar['full_year_reported_revenue_proxy']))
 delta_pv+=expected*ar['discount_factor']
ck('NEXT not also charged to terminal after finite expiry',near(a['terminal_pv'],b['terminal_pv']))
ck('NEXT operating EV difference equals one PV of support',near(b['core_operating_ev']-a['core_operating_ev'],delta_pv))
ck('base2030 support sum5000',near(sum(c['next_rent_relief'][:5])+sum(c['next_capital_support'][:5]),5000))
ck('base2036 support sum8500',near(sum(c['next_rent_relief'])+sum(c['next_capital_support']),8500))
ck('base2030 margin not forced to management target',a['rows'][4]['full_year_core_margin']<.50)
# Directional checks.
for key,delta,expectup in [('wacc',.01,False),('terminal_roic',.03,True),('royalty_rate_shift',.0025,True),('rent_rate_shift',-.0025,False)]:
 cc=copy.deepcopy(c);cc[key]+=delta;v=engine.case(d,'base',cc)['core_operating_ev'];ck(key+' direction',(v>a['core_operating_ev'])==expectup)
# Guard probes.
for name,edit in [('nan WACC',lambda x:x['scenarios']['base'].__setitem__('wacc',float('nan'))),('inf growth',lambda x:x['scenarios']['base']['comp_growth'].__setitem__(0,float('inf'))),('bool WACC',lambda x:x['scenarios']['base'].__setitem__('wacc',True)),('g equals WACC',lambda x:x['scenarios']['base'].__setitem__('terminal_g',.08)),('g equals ROIC',lambda x:x['scenarios']['base'].__setitem__('terminal_roic',.025)),('negative capex',lambda x:x['scenarios']['base']['cash_capex_baseline'].__setitem__(1,-1)),('capex belowH1',lambda x:x['scenarios']['base']['cash_capex_baseline'].__setitem__(0,1)),('DA belowH1',lambda x:x['scenarios']['base']['da'].__setitem__(0,1)),('short annual path',lambda x:x['scenarios']['base'].__setitem__('comp_growth',[0])),('negative NWC ratio',lambda x:x['scenarios']['base'].__setitem__('incremental_nwc_ratio',-.1)),('future date mismatch',lambda x:x.__setitem__('valuation_anchor','2026-10-19')),('zero exact shares',lambda x:x['capital_known_june'].__setitem__('common_shares_exact',0)),('noninteger exact shares',lambda x:x['capital_known_june'].__setitem__('common_shares_exact',707641531.5))]:
 dd=copy.deepcopy(d);edit(dd);bad(name,lambda:engine.run(dd))
# The full-year restructuring path cannot undo an already observed H1 charge implicitly.
for scenario in d['scenarios']:
 for amount in [0,d['observed_h1_2026']['restructuring_expense']-.01]:
  dd=copy.deepcopy(d);dd['scenarios'][scenario]['restructuring_expense'][0]=amount
  bad(scenario+' restructuring below observed H1 rejected '+str(amount),lambda:engine.run(dd))
 dd=copy.deepcopy(d);dd['scenarios'][scenario]['restructuring_expense'][0]=d['observed_h1_2026']['restructuring_expense']
 ck(scenario+' restructuring equal to H1 allowed',engine.validate(dd))
 lower=engine.run(dd)['results'][scenario]['rows'][0]
 dd['scenarios'][scenario]['restructuring_expense'][0]+=1
 upper=engine.run(dd)['results'][scenario]['rows'][0]
 ck(scenario+' incremental H2 restructuring EBIT identity',near(lower['period_core_ebit']-upper['period_core_ebit'],1))
 ck(scenario+' incremental H2 restructuring FCFF tax identity',near(lower['fcff']-upper['fcff'],1-dd['scenarios'][scenario]['cash_tax_rate'][0]))
examples=json.loads((P/'allocation-illustrations-v2.json').read_text())
for policy_name,policy in examples['policies'].items():
 for field,amount in policy['basis_amounts_USDm'].items():
  ck(policy_name+' structured basis matches '+field,policy[field]==amount)
 if policy_name!='central':
  for field,label in [('finance_lease_claim','Finance lease claim assumed'),('affiliate_equity_value','Affiliate equity assumed'),('other_nonoperating_assets','Other nonoperating assets assumed'),('minimum_operating_cash','Minimum operating cash assumed'),('existing_award_incremental_claim','Existing-award incremental claim assumed'),('other_noncommon_claims','Other noncommon claims assumed')]:
   ck(policy_name+' prose basis matches '+field,f"{label} {policy[field]:g}" in policy['basis'])
p=json.loads((P/'allocation-policy-illustration-v2.json').read_text());template=json.loads((P/'allocation-policy-template-v2.json').read_text());bad('null capital template rejected',lambda:engine.run(d,template))
for field in ['finance_lease_claim','affiliate_equity_value','other_nonoperating_assets','minimum_operating_cash','existing_award_incremental_claim','other_noncommon_claims']:
 pp=copy.deepcopy(p);pp[field]=None;bad('missing policy '+field,lambda:engine.run(d,pp));pp[field]=-1;bad('negative policy '+field,lambda:engine.run(d,pp))
for field in ['dated_june_only','nonoverlap_confirmed','incremental_award_claim_excludes_future_sbc_cash_replacement','lease_policy_confirmed','affiliate_value_excludes_royalty_rights','capital_scope_reviewed','assumption_not_current_target']:
 pp=copy.deepcopy(p);pp[field]=False;bad('unacknowledged '+field,lambda:engine.run(d,pp))
allocated=engine.run(d,p)
for sn,r in allocated['results'].items():
 eq=r['core_operating_ev']+822-p['minimum_operating_cash']+p['affiliate_equity_value']+p['other_nonoperating_assets']-39863-p['finance_lease_claim']-p['existing_award_incremental_claim']-p['other_noncommon_claims']
 ck(sn+' conditional bridge identity',near(eq,r['conditional_june_equity_value']))
 ck(sn+' exact common denominator',near(r['dated_per_share_allocation'],eq/707.641531))
 ck(sn+' conditional still no current target',r['current_target'] is None and r['current_upside'] is None)
pp=copy.deepcopy(p);pp['other_noncommon_claims']=1e6;ck('negative equity allocation suppressed',engine.run(d,pp)['results']['base']['dated_per_share_allocation'] is None)
pp=copy.deepcopy(p);pp['minimum_operating_cash']=1500;rr=engine.run(d,pp)['results']['base'];ck('cash reserve shortfall not clipped',near(rr['conditional_june_equity_value'],allocated['results']['base']['conditional_june_equity_value']-700))
with (P/'forecast-v2.csv').open() as f:ck('forecast CSV33rows',len(list(csv.DictReader(f)))==33)
ck('bear base bull operating order',fresh['results']['bear']['core_operating_ev']<fresh['results']['base']['core_operating_ev']<fresh['results']['bull']['core_operating_ev'])
claims=json.loads((P/'capital-claims-scope-v2.json').read_text())
for row in claims['observed_distribution_funding_context']['periods']:
 name=row['period']
 ck(name+' CFO less capex identity',near(row['cfo_less_capex'],row['cfo']-row['cash_capex']))
 ck(name+' distributions identity',near(row['total_distributions'],row['cash_dividends']+row['cash_buybacks']))
 ck(name+' residual before other flows identity',near(row['residual_before_other_flows'],row['cfo_less_capex']-row['total_distributions']))
report={'status':'PASS','author_checks':len(checks),'external_review':'V1 independent source/arithmetic review complete; V2 corrections awaiting targeted independent recheck','cutoff':'2026-10-19','scope':'MCD focused history/model/claim guards only. No integration or current-target approval.','checks':checks}
if '--write-report' in sys.argv:(P/'verification-v2.json').write_text(json.dumps(report,indent=2)+'\n')
# Manifest integrity is checked after core tests and is not included in the frozen author report.
if (P/'manifest-v2.json').exists():
 manifest=json.loads((P/'manifest-v2.json').read_text())
 for n,sha in manifest.items():
  if hashlib.sha256((P/n).read_bytes()).hexdigest()!=sha:raise AssertionError('Frozen manifest mismatch: '+n)
 print('Manifest integrity: '+str(len(manifest))+' files verified')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},indent=2))
