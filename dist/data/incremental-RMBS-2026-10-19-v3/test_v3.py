import pathlib,json,copy,math
from replay_v3 import calculate,main
P=pathlib.Path(__file__).parent;x=json.loads((P/'dcf-inputs-v3.json').read_text());pol=json.loads((P/'analyst-policy-examples-v3.json').read_text());checks=[]
def ck(n,b):
 assert b,n
 checks.append(n)
ck('No default policy selected',x['selected_award_policy'] is None)
ck('No selection gates conditional price',calculate(x,x['scenarios']['base'],None)['conditional_share_value'] is None)
for a in pol:
 for name,s in x['scenarios'].items():
  p=a['selection'];r=calculate(x,s,p);prefix=a['policy_id']+'/'+name
  ck(prefix+' funded',r['external_funding_required']==0)
  ck(prefix+' current target null',r['current_price_target'] is None)
  ck(prefix+' capital allocation identity',abs(r['allocation_residual'])<1e-8)
  ck(prefix+' new grants not negative',min(t['remaining_new_grant_cash_equivalent_cost'] for t in r['rows'])>=0)
  ck(prefix+' June bridge excludes past settlement',abs(r['initial_liquidity_after_reserves']-708.465)<1e-8)
  ck(prefix+' cash resource continuity',all(abs(row['closing_cash_after_reserves']-(row['opening_cash_after_reserves']-row['legacy_withholding_cash']+row['fcff_after_legacy_adjustment']))<1e-8 for row in r['rows']))
  ck(prefix+' gross taxes not corporate-tax discounted',all(abs(row['reported_award_withholding_cash']-r['reported_awards_selected_units']*p['vesting_weights'][i]*p['withholding_fraction']*row['conditional_settlement_price'])<1e-8 for i,row in enumerate(r['rows'])))
base=copy.deepcopy(pol[0]['selection']);s=x['scenarios']['base'];r=calculate(x,s,base)
for h in [0,.2,1]:
 q=copy.deepcopy(base);q['withholding_fraction']=h;rr=calculate(x,s,q);ck('withholding split price invariant '+str(h),abs(rr['conditional_share_value']-r['conditional_share_value'])<1e-10)
q=copy.deepcopy(base);q['residual_legacy_share_equivalents_m']=2;ck('extra claims lower price',calculate(x,s,q)['conditional_share_value']<r['conditional_share_value'])
q=copy.deepcopy(base);q['marketable_securities_liquidity_haircut']=1;rr=calculate(x,s,q);ck('cash-only funded gate',rr['conditional_share_value'] is None and rr['external_funding_required']>0)
q=copy.deepcopy(base);q['residual_legacy_share_equivalents_m']=10000;q['residual_claim_cash_fraction']=1;q['vesting_weights']=[1]+[0]*9;rr=calculate(x,s,q);ck('unfunded cash-claim stress blocked',rr['conditional_share_value'] is None and rr['external_funding_required']>0)
for name,mut in [('missing required choice',lambda q:q.pop('withholding_fraction')),('expense exceeds baseline allowance',lambda q:q.update(baseline_total_sbc_pct_revenue=.001)),('bad weights',lambda q:q.update(vesting_weights=[0]*10)),('overlap exceeds reported',lambda q:q.update(reported_units_already_in_common_m=10))]:
 q=copy.deepcopy(base);mut(q)
 try:calculate(x,s,q);ok=False
 except ValueError:ok=True
 ck(name+' rejected',ok)
for name,mut in [('short horizon drops settlement',lambda z:z.update(years=5)),('nonfinite discount',lambda z:z.update(wacc=float('inf')))]:
 z=copy.deepcopy(s);mut(z)
 try:calculate(x,z,base);ok=False
 except ValueError:ok=True
 ck(name+' rejected',ok)
badx=copy.deepcopy(x);badx['cash_only']+=1
try:calculate(badx,s,base);ok=False
except ValueError:ok=True
ck('inconsistent cash source bridge rejected',ok)
main();(P/'validation-v3.json').write_text(json.dumps({'status':'PASS','checks':checks,'count':len(checks)},indent=2));print(len(checks),'checks passed')
