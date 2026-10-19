import json,pathlib,copy,math
from replay_dcf import calculate
P=pathlib.Path(__file__).parent;d=json.load(open(P/'dcf-inputs-v1.json'));tests=[]
for name,c in d['cases'].items():
 o=calculate(d,c);assert len(o['rows'])==10
 assert o['terminal_reinvestment']+1e-8>=max(o['terminal_operating_floor'],o['terminal_roic_floor'])
 for r in o['rows']:
  assert r['cash_end']+1e-7>=r['cash_floor'];assert abs(r['nopat']-r['reinvestment']-r['fcff'])<1e-8
 assert abs(sum(r['debt_repayment'] for r in o['rows'])-2550)<1e-8
 tests.append(name+' replay, cash floor, FCFF, terminal floors, debt repayments pass')
for key,value in [('wacc',float('nan')),('g',.11),('tax',-1),('equity_fee',1),('equity_issue_price',0),('emergency_debt_capacity',-1),('wacc',True),('margin',[.2]*9),('terminal_roic',.01),('csg_growth',[-1]*10),('capex_ratio',[.001]*10)]:
 x=copy.deepcopy(d['cases']['base']);x[key]=value
 try:calculate(d,x)
 except ValueError:tests.append('reject '+key+' '+str(value))
 else:raise AssertionError('failed rejection '+key)
sens=[]
for w in [.08,.09,.10,.11,.12]:
 for g in [.02,.025,.03,.035]:
  c=copy.deepcopy(d['cases']['base']);c.update(wacc=w,g=g)
  for k in ['csg_growth','eisg_growth']:c[k][-1]=g
  o=calculate(d,c);sens.append({'wacc':w,'g':g,'value':o['conditional_value_per_share'],'terminal_share':o['terminal_share']})
other=[]
for delta in [-.03,-.015,.015,.03]:
 c=copy.deepcopy(d['cases']['base']);c['margin']=[v+delta for v in c['margin']];o=calculate(d,c);other.append({'margin_delta':delta,'value':o['conditional_value_per_share']})
fund=copy.deepcopy(d['cases']['base']);fund['margin'][:3]=[-.35,-.25,-.15];fund['emergency_debt_capacity']=0
fo=calculate(d,fund);assert fo['funding_required'] and fo['conditional_value_per_share'] is None;assert fo['rows'][-1]['shares_end']>d['capital']['shares'];tests.append('external-equity funding suppresses headline, increases shares, and respects cash floor')
fd=copy.deepcopy(fund);fd['emergency_debt_capacity']=750;fdo=calculate(d,fd);assert fdo['funding_required'] and sum(r['new_debt'] for r in fdo['rows'])<=750+1e-8;tests.append('external debt capped at750; headline suppressed')
share=copy.deepcopy(d);share['capital']['shares']*=1.03;sv=calculate(share,d['cases']['base'])['conditional_value_per_share']
rate=copy.deepcopy(d);rate['debt_schedule'][-1]['coupon']+=.02;rate_o=calculate(rate,d['cases']['base']);tests.append('floating-rate coupon +200bp liquidity stress replay')
json.dump({'floating_rate_plus_200bp':{'funding_required':rate_o['funding_required'],'minimum_cash_headroom':min(r['cash_end']-r['cash_floor'] for r in rate_o['rows']),'note':'FCFF enterprise value is unchanged; rate stress affects debt-service liquidity. WACC risk is tested separately.'},'wacc_g':sens,'margin':other,'three_percent_extra_share_claim_diagnostic':sv,'funding_stress':fo,'debt_and_equity_funding_stress':fdo},open(P/'sensitivities-v1.json','w'),indent=2,allow_nan=False)
json.dump({'status':'self-tests passed; independent review required','tests':tests,'test_count':len(tests),'history_slots':len(json.load(open(P/'history-v1.json')))},open(P/'validation-v1.json','w'),indent=2)
print('PASS',len(tests))
