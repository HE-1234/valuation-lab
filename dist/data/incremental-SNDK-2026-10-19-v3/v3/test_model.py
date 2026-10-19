import copy,json,math
from replay_dcf import A,model,market_gate,P
checks=[]
def check(name,condition):
 assert condition,name
 checks.append({'test':name,'result':'PASS'})
for s in A['scenarios']:
 o=model(s);check(s['name']+' valid',o['status']=='VALID_CONDITIONAL_RESEARCH')
 for row in o['rows']:check(s['name']+' FCFF '+str(row['fiscal_year']),math.isclose(row['fcff'],row['ebit']-row['tax']-row['own_capex']-row['jv_net_funding']+row['own_da']-row['delta_nwc'],abs_tol=1e-7))
 check('terminal floor '+s['name'],o['terminal_reinvestment']>=o['terminal_physical_jv_floor']+o['terminal_delta_wc']-1e-8)
 final=o['rows'][-1];check('terminal funding continuity '+s['name'],abs(o['terminal_net_reinvestment_ratio']-final['net_reinvestment']/final['revenue'])<.002)
 check('cash reserve '+s['name'],o['opening_surplus']==590)
 check('current/historical gate '+s['name'],not o['current_valuation_eligible'] and not o['historical_backtest_eligible'])
 check('WACC monotonic '+s['name'],model(s,wacc=s['wacc']+.01)['operating_value']<o['operating_value'])
for field,value in [('wacc',float('nan')),('wacc',float('inf')),('wacc',-.1),('wacc',.01),('terminal_roic',-1),('terminal_roic',0),('terminal_roic',.01),('tax_rate',1.1),('own_capex_ratio',-.1),('net_jv_funding_ratio',-.1),('terminal_net_physical_jv_funding_floor',float('nan')),('terminal_ebit_margin',1.1),('distribution_policy','other'),('bit_growth',[.1]*9),('asp_growth',[-1]*10),('bit_growth',[-1.1]*10),('ebit_margin_after_sbc',[float('nan')]*10),('ebit_margin_after_sbc',[1.1]*10),('additional_jv_guarantee_call_assumption',float('inf'))]:
 s=copy.deepcopy(A['scenarios'][0]);s[field]=value;o=model(s);check('invalid '+field+' '+str(value),o['status']=='INVALID_MODEL' and o['conditional_value_per_proxy_share'] is None)
for field,value in [('diluted_share_proxy',0),('diluted_share_proxy',-1),('diluted_share_proxy',float('nan')),('cash',float('inf')),('opening_current_tax_payable',-1),('marketable_securities_haircut_assumption',1.1),('opening_noncurrent_tax_payable',float('nan'))]:
 a=copy.deepcopy(A);a['capital_bridge'][field]=value;o=model(a['scenarios'][0],a);check('invalid bridge '+field+' '+str(value),o['status']=='INVALID_MODEL')
a=copy.deepcopy(A);a['base_revenue']=0;check('invalid base revenue',model(a['scenarios'][0],a)['status']=='INVALID_MODEL')
s=copy.deepcopy(A['scenarios'][2]);s['distribution_policy']='distribute_positive';o=model(s);check('funding gap null output',o['peak_unfunded_gap']>0 and o['conditional_common_equity'] is None and o['conditional_value_per_proxy_share'] is None)
a=copy.deepcopy(A);a['capital_bridge']['financial_debt']=1e6;o=model(a['scenarios'][0],a);check('negative equity limited liability',o['economic_equity_diagnostic']<0 and o['conditional_common_equity']==0 and o['limited_liability_floor_applied'])
for q in [None,{'price':0},{'price':-1},{'price':float('nan')},{'price':1},{'price':100,'as_of':'2026-09-25','source_url':'https://robinhood.com/us/en/stocks/SNDK/'},{'price':100,'as_of':'2026-10-19','source_url':'https://example.com/quote'}]:
 o=market_gate(q);check('quote gate '+str(q),o['status']=='BLOCKED' and o['upside'] is None and o['ranking_value'] is None)
(P/'test-results.json').write_text(json.dumps({'status':'PASS_AUTHOR_TESTS_NOT_INDEPENDENT_AUDIT','count':len(checks),'checks':checks},indent=2));print(len(checks),'PASS')
