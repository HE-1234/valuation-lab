import copy,json,math
from replay_dcf import A,model,P
checks=[];out=[]
prior=json.loads((P.parent/'v2/model-output.json').read_text())
for i,s in enumerate(A['scenarios']):
 baseline=model(s)
 for key in ['operating_value','economic_equity_diagnostic','conditional_common_equity','conditional_value_per_proxy_share','opening_surplus','peak_unfunded_gap']:
  assert baseline[key]==prior[i][key],(s['name'],key)
  checks.append(s['name']+' zero reserve preserves '+key)
 for claim in [0,589.999,590,590.001,1000]:
  a=copy.deepcopy(A);a['capital_bridge']['additional_claim_reserve_assumption']=claim;o=model(s,a)
  assert math.isclose(o['opening_surplus'],590-claim,abs_tol=1e-8)
  assert math.isclose(o['economic_equity_diagnostic'],baseline['economic_equity_diagnostic']-claim,abs_tol=1e-7)
  if claim>590:
   assert math.isclose(o['peak_unfunded_gap'],claim-590,abs_tol=1e-8)
   assert o['status']=='FUNDING_GAP_COMMON_VALUE_WITHHELD'
   assert o['conditional_common_equity'] is None and o['conditional_value_per_proxy_share'] is None and o['conditional_value_per_158m_share'] is None
   assert o['operating_value_status']=='CONTINGENT_ON_UNMODELED_FUNDING'
  else:
   assert o['peak_unfunded_gap']==0 and o['status']=='VALID_CONDITIONAL_RESEARCH'
  checks.append(s['name']+' claim '+str(claim)+' reserve, no double deduction, funding boundary, price null gate')
  out.append({'additional_claim_reserve_assumption':claim,**{k:v for k,v in o.items() if k!='rows'}})
(P/'generic-claim-funding-sensitivity.json').write_text(json.dumps(out,indent=2,allow_nan=False))
(P/'claim-funding-test-results.json').write_text(json.dumps({'status':'PASS_AUTHOR_TESTS_NOT_INDEPENDENT','count':len(checks),'checks':checks},indent=2))
print(len(checks),'additional tests PASS')
