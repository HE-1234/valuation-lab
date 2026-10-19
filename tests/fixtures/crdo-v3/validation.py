"""Fail-closed schema/domain validation for the CRDO v3 zero-borrowing model.
ValueError means no valuation is available. All financial scalars must be finite
real numbers (booleans/strings are not numeric inputs). Unknown keys are rejected.
"""
import math, datetime, json, pathlib
TEMPLATE=json.load(open(pathlib.Path(__file__).with_name('input-schema-template.json')))
SCENARIO_OPTIONAL={'wacc_shift':0.0,'volatility':0.7862}
def number(x,path,lo=None,hi=None,positive=False):
 if type(x) not in (int,float) or not math.isfinite(x):raise ValueError(f'{path}: finite real number required')
 if positive and x<=0 or lo is not None and x<lo or hi is not None and x>hi:raise ValueError(f'{path}: outside supported domain')
 return x
def shape(x,t,path='inputs'):
 if isinstance(t,dict):
  if not isinstance(x,dict):raise ValueError(f'{path}: object required')
  optional=SCENARIO_OPTIONAL if path.startswith('inputs.scenarios.') else {}
  unknown=set(x)-set(t)-set(optional);missing=set(t)-set(x)
  if unknown or missing:raise ValueError(f'{path}: unknown keys {sorted(unknown)}; missing keys {sorted(missing)}')
  for k,v in x.items():shape(v,t[k] if k in t else optional[k],path+'.'+k)
 elif isinstance(t,list):
  if not isinstance(x,list) or len(x)!=len(t):raise ValueError(f'{path}: {len(t)} entries required')
  for i,v in enumerate(x):shape(v,t[i],f'{path}[{i}]')
 elif type(t) is bool:
  if type(x) is not bool:raise ValueError(f'{path}: boolean required')
 elif type(t) in (int,float):number(x,path)
 elif not isinstance(x,str):raise ValueError(f'{path}: string required')
def validate(m):
 shape(m,TEMPLATE)
 for k in ['base_fy2026_revenue','q1fy2027_actual_revenue','ttm_revenue','ordinary_shares','option_strike','option_term','option_volatility','acquisition_reference_stock_price']:number(m[k],k,positive=True)
 for k in ['cash_and_investments','technology_license_debt','cash_contingent_consideration','rsus','psus','special_ceo_psus','options','exchangeable_subsidiary_restricted_shares','earnout_max_shares','earnout_accounting_equity_fair_value','interest_bearing_debt','ttm_sbc']:number(m[k],k,lo=0)
 if m['special_ceo_psus']>m['psus']:raise ValueError('special_ceo_psus exceeds included total PSU pool')
 if m['interest_bearing_debt']!=0 or m['macro']['debt_weight']!=0:raise ValueError('unsupported_borrowing: funded debt and debt weight must be zero; debt issuance, repayment, interest and dilution are not modeled')
 f=m['funding'];number(f['minimum_cash_floor'],'funding.minimum_cash_floor',lo=0)
 if f['mode']!='reject_if_funding_required' or f['reserve_existing_debt_like_claims'] is not True:raise ValueError('Unsupported funding policy: mandatory claim reserve and reject-if-funding-required mode')
 dates=m['dates'];parsed={}
 for k,v in dates.items():
  if k!='day_count_denominator':
   try:parsed[k]=datetime.date.fromisoformat(v)
   except (ValueError,TypeError):raise ValueError('Invalid ISO date: '+k)
 denom=number(dates['day_count_denominator'],'day_count_denominator',positive=True)
 if not parsed['balance_date']<=parsed['current_date']<parsed['first_forecast_end']:raise ValueError('Current date outside forecast stub')
 if parsed['report_information_cutoff']<parsed['balance_date'] or parsed['current_information_cutoff']<parsed['current_date']:raise ValueError('Information cutoff precedes relevant balance/valuation date')
 elapsed=(parsed['current_date']-parsed['balance_date']).days/denom
 if m['option_term']<=elapsed:raise ValueError('Option term must remain positive; expired-option settlement is not modeled')
 b=m['october_bridge']
 for k in ['operating_cash_after_ordinary_working_capital','capital_expenditures','capacity_deposits_paid','rsu_withholding_cash','net_rsu_shares_issued']:number(b[k],'october_bridge.'+k,lo=0)
 number(b['rsu_settlement_price'],'rsu_settlement_price',positive=True);number(b['restricted_share_vesting_probability'],'restricted_share_vesting_probability',lo=0,hi=1)
 if b['net_rsu_shares_issued']+b['rsu_withholding_cash']/b['rsu_settlement_price']>m['rsus']:raise ValueError('Gross RSU settlement exceeds reported pool')
 macro=m['macro']
 for k in ['rf_report','rf_current']:number(macro[k],k,lo=0,hi=1)
 for k in ['erp_report','erp_current']:number(macro[k],k,lo=0,hi=1)
 for k in ['beta_start','beta_terminal']:number(macro[k],k,lo=0)
 for name,s in m['scenarios'].items():
  p='scenarios.'+name+'.'
  for k in ['rsu_vesting_probability','psu_vesting_probability','earnout_probability']:number(s[k],p+k,lo=0,hi=1)
  for k in ['revenue','sales_to_capital']:
   for v in s[k]:number(v,p+k,positive=True)
  if s['revenue'][0]<=m['q1fy2027_actual_revenue']:raise ValueError(p+'FY2027 revenue must exceed actual Q1')
  for k in ['tax_rate','new_grant_sbc_margin']:
   for v in s[k]:number(v,p+k,lo=0,hi=1)
  for v in s['pre_new_grant_operating_margin']:number(v,p+'pre_new_grant_operating_margin',lo=-1,hi=1)
  number(s['capacity_deposit_outflow'],p+'capacity_deposit_outflow',lo=0)
  for v in s['capacity_deposit_recovery']:number(v,p+'capacity_deposit_recovery',lo=0)
  if sum(s['capacity_deposit_recovery'])>s['capacity_deposit_outflow']+1e-9:raise ValueError(p+'Deposit recovery exceeds modeled commitment')
  if b['capacity_deposits_paid']>s['capacity_deposit_outflow']:raise ValueError(p+'Paid deposits exceed modeled commitment')
  g=number(s['terminal_growth'],p+'terminal_growth',lo=0);roic=number(s['terminal_roic'],p+'terminal_roic',positive=True)
  if g>roic:raise ValueError(p+'Terminal reinvestment rate exceeds 100%; unsupported terminal economics')
  if 'volatility' in s:number(s['volatility'],p+'volatility',positive=True)
  shift=s.get('wacc_shift',0)
  for suffix in ['report','current']:
   for beta in [macro['beta_start'],macro['beta_terminal']]:
    w=macro['rf_'+suffix]+beta*macro['erp_'+suffix]+shift
    number(w,p+'derived_wacc',positive=True)
   if macro['rf_'+suffix]+macro['beta_terminal']*macro['erp_'+suffix]+shift<=g:raise ValueError(p+'Terminal WACC must exceed growth')
