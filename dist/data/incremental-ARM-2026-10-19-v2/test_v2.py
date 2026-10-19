import copy,json,pathlib,math
from replay_dcf import calculate
p=pathlib.Path(__file__).parent;d=json.load(open(p/'dcf-inputs-v2.json'));old=json.load(open(p/'dcf-output-v1.json'));checks=[]
def ck(name,b):
 assert b,name
 checks.append(name)
def reject(name,c):
 try:calculate(d,c)
 except (ValueError,TypeError):checks.append('rejected '+name)
 else:raise AssertionError('accepted '+name)
for name,c in d['cases'].items():
 o=calculate(d,c);ck(name+' baseline preserved',o['value_per_ads']==old[name]['value_per_ads'])
 for r in o['rows']:
  ck(name+str(r['fiscal_year'])+' floor',r['net_capex']+1e-9>=r['net_capex_floor'])
  ck(name+str(r['fiscal_year'])+' FCFF',abs(r['nopat']-r['reinvestment']-r['fcff'])<1e-8)
  ck(name+str(r['fiscal_year'])+' cash',r['cash_end']>=r['cash_floor']-1e-8)
 ck(name+' terminal floor',o['terminal_net_capex']>=o['terminal_net_capex_floor']-1e-8)
 ck(name+' reinvestment consistency',math.isclose(o['terminal_reinvestment']/o['terminal_nopat'],c['terminal_growth']/c['terminal_roic']))
for key,value in [('wacc',None),('wacc','0.1'),('wacc',float('nan')),('wacc',float('inf')),('tax_rate',True),('wacc',.03),('terminal_roic',.03),('royalty_growth',[.1]),('net_capex_floor_total',0),('net_capex_floor_ip',-.01),('net_capex_floor_silicon',float('nan')),('equity_issuance_fee',1),('cash_floor_ratio',-.1),('terminal_roic',.30)]:
 c=copy.deepcopy(d['cases']['base']);c[key]=value;reject(str(key)+str(value),c)
c=copy.deepcopy(d['cases']['base']);c['silicon_revenue'][-2]=0;c['silicon_marginal_nwc']=0;reject('zero-to-positive terminal silicon even zeroNWC',c)
c=copy.deepcopy(d['cases']['base']);c['silicon_revenue']=[0]*10;o=calculate(d,c);ck('allzero silicon accepted',o['rows'][-1]['silicon']==0)
# Zero terminal growth cannot sustain a positive minimum net-investment floor.
c=copy.deepcopy(d['cases']['base']);c['terminal_growth']=0;c['royalty_growth'][-1]=0;c['license_growth'][-1]=0;c['silicon_revenue'][-1]=c['silicon_revenue'][-2];reject('zero growth conflicts positive net floor',c)
sens=[]
for w in [.08,.09,.10,.11,.12]:
 for g in [.02,.03,.04]:
  c=copy.deepcopy(d['cases']['base']);c.update(wacc=w,terminal_growth=g);c['royalty_growth'][-1]=g;c['license_growth'][-1]=g;c['silicon_revenue'][-1]=c['silicon_revenue'][-2]*(1+g)
  try:
   o=calculate(d,c);sens.append(dict(wacc=w,g=g,status='valid',value_per_ads=o['value_per_ads']))
  except ValueError as e:sens.append(dict(wacc=w,g=g,status='invalid_assumptions',value_per_ads=None,reason=str(e)))
ck('allfive2percentcells rejected',sum(r['g']==.02 and r['status']=='invalid_assumptions' for r in sens)==5)
shocks=[]
for name,change in [('sbc_margin_cost_5pp',-.05),('sbc_margin_cost_10pp',-.10),('sbc_margin_relief_5pp',.05)]:
 c=copy.deepcopy(d['cases']['base']);c['ip_ebit_margin']=[m+change for m in c['ip_ebit_margin']];c['silicon_ebit_margin']=[m+change for m in c['silicon_ebit_margin']]
 try:o=calculate(d,c);shocks.append(dict(name=name,status='valid',value_per_ads=o['value_per_ads']))
 except ValueError as e:shocks.append(dict(name=name,status='invalid_assumptions',value_per_ads=None,reason=str(e)))
c=copy.deepcopy(d['cases']['bear']);c['ip_ebit_margin']=[-.35]*4+c['ip_ebit_margin'][4:];c['funding_debt_capacity_multiple']=0;o=calculate(d,c);ck('funding stress raises equity',sum(r['new_equity_gross'] for r in o['rows'])>0);ck('funded headline suppressed',o['value_per_ads'] is None)
json.dump(dict(status='passed',checks=len(checks),details=checks),open(p/'validation-v2.json','w'),indent=2)
json.dump(dict(wacc_growth=sens,sbc_economic_margin=shocks,funding_stress=o,warning='Invalid cells are incompatible assumption combinations; no value is produced and capital is not clipped to fake ROIC consistency.'),open(p/'sensitivities-v2.json','w'),indent=2,allow_nan=False)
print(len(checks),'checks passed')
