"""CRDO v3 conditional FCFF model. Standard library; frozen inputs only.
Funding-required inputs return null valuation, never an unfinanced price.
Dates and bridge flows have one canonical configuration each.
"""
import json,math,pathlib,csv,copy,datetime
from validation import validate
P=pathlib.Path(__file__).parent
M=json.load(open(P/'dcf-inputs-v3.json'))
def call(s,k,t,r,v):
 n=lambda z:.5*(1+math.erf(z/math.sqrt(2)))
 d1=(math.log(s/k)+(r+.5*v*v)*t)/(v*math.sqrt(t));d2=d1-v*math.sqrt(t)
 return s*n(d1)-k*math.exp(-r*t)*n(d2)
def bridge(m,cur):
 dates=m['dates'];parse=datetime.date.fromisoformat;balance=parse(dates['balance_date']);end=parse(dates['first_forecast_end']);asof=parse(dates['current_date']) if cur else balance
 days=(end-balance).days;elapsed=(asof-balance).days
 if not (days>0 and 0<=elapsed<days):raise ValueError('Valuation date must lie within the remaining fiscal stub.')
 if parse(dates['report_information_cutoff'])<balance:raise ValueError('Report cutoff cannot precede balance date.')
 if cur and parse(dates['current_information_cutoff'])<asof:raise ValueError('Current information cutoff cannot precede valuation date.')
 b=m['october_bridge'];keys=['operating_cash_after_ordinary_working_capital','capital_expenditures','capacity_deposits_paid','rsu_withholding_cash','net_rsu_shares_issued']
 if any(b[k]<0 for k in keys) or b['rsu_settlement_price']<=0:raise ValueError('Bridge flows must be nonnegative and settlement price positive.')
 withheld=b['rsu_withholding_cash']/b['rsu_settlement_price'] if cur else 0
 net=b['net_rsu_shares_issued'] if cur else 0;gross=net+withheld
 if gross>m['rsus']:raise ValueError('Gross RSU settlements exceed reported RSU pool; additional grants require explicit modeling.')
 cash_delta=(b['operating_cash_after_ordinary_working_capital']-b['capital_expenditures']-b['capacity_deposits_paid']-b['rsu_withholding_cash']) if cur else 0
 return dict(balance_date=str(balance),valuation_date=str(asof),stub_days=days,elapsed_days=elapsed,remaining_days=days-elapsed,year_fraction_denominator=dates['day_count_denominator'],cash_increase=cash_delta,cash=m['cash_and_investments']+cash_delta,net_rsu_shares_issued=net,withheld_rsu_shares=withheld,gross_rsus_settled=gross,ordinary_shares=m['ordinary_shares']+net,remaining_rsus=m['rsus']-gross,capacity_deposits_paid=b['capacity_deposits_paid'] if cur else 0,settlement_price=b['rsu_settlement_price'] if cur else None)
def _calc(name,mode='current',overrides=None,inputs=None):
 m=copy.deepcopy(M if inputs is None else inputs)
 if name not in m.get('scenarios',{}):raise ValueError('Unknown scenario')
 s=m['scenarios'][name];s.update(overrides or {});validate(m);cur=mode=='current'
 if mode not in ['current','report_snapshot']:raise ValueError('Unknown mode')
 br=bridge(m,cur);macro=m['macro'];rf=macro['rf_current' if cur else 'rf_report'];erp=macro['erp_current' if cur else 'erp_report'];prev=m['base_fy2026_revenue'];rows=[];df=1;ev=0
 for k in ['revenue','pre_new_grant_operating_margin','new_grant_sbc_margin','sales_to_capital','tax_rate','capacity_deposit_recovery']:
  if len(s[k])!=10:raise ValueError('Ten annual assumptions required: '+k)
 if any(v<=0 for v in s['sales_to_capital']):raise ValueError('Sales/capital must be positive.')
 if s['capacity_deposit_outflow']<br['capacity_deposits_paid']:raise ValueError('Paid deposits exceed total post-balance commitment.')
 if m['funding']['minimum_cash_floor']<0 or not m['funding']['reserve_existing_debt_like_claims']:raise ValueError('Nonnegative cash floor and reservation of existing debt-like claims are mandatory.')
 claims_cash=m['technology_license_debt']+m['cash_contingent_consideration'];reserve=claims_cash if m['funding']['reserve_existing_debt_like_claims'] else 0
 liquidity=br['cash']-reserve;floor=m['funding']['minimum_cash_floor'];liquidity_tests=[dict(point='opening_after_claim_reserve',cash=liquidity,minimum=floor)]
 for i,rev in enumerate(s['revenue']):
  fy=2027+i;beta=macro['beta_start'] if i<5 else macro['beta_start']+(macro['beta_terminal']-macro['beta_start'])*(i-4)/5
  wacc=rf+beta*erp+s.get('wacc_shift',0);margin=s['pre_new_grant_operating_margin'][i]-s['new_grant_sbc_margin'][i];nopat=rev*margin*(1-s['tax_rate'][i]);reinvest=(rev-prev)/s['sales_to_capital'][i];deposit=s['capacity_deposit_outflow']-br['capacity_deposits_paid'] if i==0 else 0;recovery=s['capacity_deposit_recovery'][i]
  fraction=(rev-m['q1fy2027_actual_revenue'])/rev if i==0 else 1
  remfrac=br['remaining_days']/br['stub_days'] if i==0 else 1
  fcf=(nopat-reinvest)*fraction*remfrac-deposit+recovery
  duration=br['remaining_days']/br['year_fraction_denominator'] if i==0 else 1;df*=(1+wacc)**duration
  if i==0:liquidity_tests.append(dict(point='first_stub_deposit_before_operating_receipts',cash=liquidity-deposit,minimum=floor))
  liquidity+=fcf;liquidity_tests.append(dict(point=f'FY{fy}_end',cash=liquidity,minimum=floor))
  pv=fcf/df;ev+=pv;rows.append(dict(fiscal_year=fy,revenue=rev,growth=rev/prev-1,pre_new_grant_operating_margin=s['pre_new_grant_operating_margin'][i],new_grant_sbc_margin=s['new_grant_sbc_margin'][i],operating_margin=margin,tax_rate=s['tax_rate'][i],nopat=nopat,sales_to_capital=s['sales_to_capital'][i],annual_reinvestment=reinvest,remaining_operating_fraction=fraction*remfrac,capacity_deposit=deposit,capacity_recovery=recovery,fcff=fcf,wacc=wacc,discount_factor=df,pv_fcff=pv,liquidity_after_reserved_claims=liquidity));prev=rev
 metadata=dict(scenario=name,mode=mode,valuation_date=br['valuation_date'],information_cutoff=m['dates']['current_information_cutoff' if cur else 'report_information_cutoff'],bridge=br,liquidity_tests=liquidity_tests,funding_scope=m['funding']['scope'],minimum_modeled_liquidity=min(t['cash'] for t in liquidity_tests),rows=rows)
 deficits=[dict(**t,shortfall=t['minimum']-t['cash']) for t in liquidity_tests if t['cash']<t['minimum']]
 if deficits:
  return dict(**metadata,status='unsupported_funding_gap',reason='Scenario needs financing beyond model scope. No equity or enterprise valuation is released. Revise assumptions or implement authorized financing and dilution mechanics.',funding_gaps=deficits,enterprise_value=None,value_per_common_share=None,common_equity_value=None)
 g=s['terminal_growth'];tw=rf+macro['beta_terminal']*erp+s.get('wacc_shift',0)
 if tw<=g or s['terminal_roic']<=0:raise ValueError('Terminal WACC must exceed growth and ROIC must be positive.')
 tn=prev*(1+g)*margin*(1-s['tax_rate'][-1]);tri=tn*g/s['terminal_roic'];tv=(tn-tri)/(tw-g);pvterm=tv/df;ev+=pvterm
 cash=br['cash'];pool=ev+cash-claims_cash;common=br['ordinary_shares'];rsu=br['remaining_rsus']*s['rsu_vesting_probability'];psu=m['psus']*s['psu_vesting_probability'];earn=m['earnout_max_shares']*s['earnout_probability'];restricted=m['exchangeable_subsidiary_restricted_shares']*m['october_bridge']['restricted_share_vesting_probability'];term=m['option_term']-br['elapsed_days']/br['year_fraction_denominator']
 if pool<=0:return dict(**metadata,status='unsupported_nonpositive_equity_pool',enterprise_value=None,value_per_common_share=None,common_equity_value=None)
 lo,hi=0.000001,max(pool/common,1)
 for _ in range(150):
  mid=(lo+hi)/2;total=(common+rsu+psu+earn+restricted)*mid+m['options']*call(mid,m['option_strike'],term,rf,s.get('volatility',m['option_volatility']))
  if total>pool:hi=mid
  else:lo=mid
 value=(lo+hi)/2;claims=(rsu+psu+earn+restricted)*value+m['options']*call(value,m['option_strike'],term,rf,s.get('volatility',m['option_volatility']))
 result=dict(**metadata,status='supported_conditional_at_annual_resolution',enterprise_value=ev,cash=cash,equity_pool_before_awards=pool,existing_claims_value=claims,common_equity_value=pool-claims,common_shares=common,value_per_common_share=value,pv_terminal=pvterm,terminal_share_of_ev=pvterm/ev,terminal_reinvestment_rate=g/s['terminal_roic'],terminal_roic=s['terminal_roic'],terminal_wacc=tw,terminal_growth=g,expected_rsu_shares=rsu,expected_psu_shares=psu,expected_earnout_shares=earn,remaining_option_term=term)
 assert abs((pool-claims)/common-value)<1e-8
 return result
def calc(name,mode='current',overrides=None,inputs=None):
 """Invalid/unsupported configurations raise ValueError without returning a price."""
 try:
  result=_calc(name,mode,overrides,inputs)
  def finite_output(x,path='result'):
   if isinstance(x,dict):
    for k,v in x.items():finite_output(v,path+'.'+k)
   elif isinstance(x,list):
    for i,v in enumerate(x):finite_output(v,f'{path}[{i}]')
   elif type(x) in (float,int) and not math.isfinite(x):raise ValueError(path+': non-finite derived output; no valuation released')
  finite_output(result)
  return result
 except (ArithmeticError,AssertionError) as exc:
  raise ValueError('Numerical domain or allocation failure; no valuation released') from exc

if __name__=='__main__':
 out=[calc(n,mode) for mode in ['report_snapshot','current'] for n in M['scenarios']];(P/'dcf-output-v3.json').write_text(json.dumps(out,indent=2,allow_nan=False))
 rows=[dict(scenario=x['scenario'],mode=x['mode'],**r) for x in out for r in x['rows']]
 with open(P/'forecast-v3.csv','w') as f:c=csv.DictWriter(f,fieldnames=list(rows[0]));c.writeheader();c.writerows(rows)
 print([(r['mode'],r['scenario'],r['status'],r['value_per_common_share']) for r in out])
