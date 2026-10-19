import copy,json
from replay_dcf import A,model,P
out=[]
for s in A['scenarios']:
 for floor in [.03,.05,.07,.08,.10,.11,.12,.14]:
  c=copy.deepcopy(s);c['terminal_net_physical_jv_funding_floor']=floor;o=model(c)
  out.append({'scenario':s['name'],'terminal_physical_jv_floor_assumption':floor,'interpretation':'Sensitivity only; values below final explicit net physical funding require a separately justified efficiency transition',**{k:v for k,v in o.items() if k!='rows'}})
(P/'terminal-funding-sensitivity.json').write_text(json.dumps(out,indent=2,allow_nan=False))
