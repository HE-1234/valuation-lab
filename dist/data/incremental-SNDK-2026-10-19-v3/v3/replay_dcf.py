"""v3 conditional research only. USD millions. Finite/domain gates, tax reserves,
terminal physical/JV floor and null-safe funding/market output. Originals untouched.
"""
import json,csv,math,copy
from pathlib import Path
P=Path(__file__).parent
A=json.loads((P/'model-inputs.json').read_text())
def num(x,name,lo=None,hi=None,strictlo=False):
 if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x):raise ValueError(name+' must be finite numeric')
 if lo is not None and (x<lo or (strictlo and x==lo)):raise ValueError(name+' below permitted bound')
 if hi is not None and x>hi:raise ValueError(name+' above permitted bound')
 return x
def validate(a,s):
 num(a['base_revenue'],'base revenue',0,strictlo=True)
 b=a['capital_bridge'];num(b['diluted_share_proxy'],'shares',0,strictlo=True)
 for k in ['cash','refundable_customer_deposits_reserve','minimum_operating_cash_assumption','marketable_securities','financial_debt','additional_claim_reserve_assumption','opening_current_tax_payable','opening_noncurrent_tax_payable','opening_wdc_indemnification','incremental_uncertain_tax_claim_assumption','incremental_unpaid_legal_assumption']:num(b[k],k,0)
 num(b['marketable_securities_haircut_assumption'],'security haircut',0,1)
 for k in ['bit_growth','asp_growth','ebit_margin_after_sbc']:
  if not isinstance(s[k],list) or len(s[k])!=10:raise ValueError(k+' requires exactly ten annual values')
  for v in s[k]:num(v,k,-1,3,strictlo=k!='ebit_margin_after_sbc')
  if k=='ebit_margin_after_sbc' and any(v>1 for v in s[k]):raise ValueError('EBIT margin exceeds 100%')
 for k in ['tax_rate','own_capex_ratio','net_jv_funding_ratio','own_da_ratio','incremental_working_capital_ratio','terminal_net_physical_jv_funding_floor']:num(s[k],k,0,1)
 num(s['wacc'],'WACC',0,1,True);num(s['terminal_growth'],'terminal growth',0,.10)
 num(s['terminal_roic'],'terminal ROIC',0,1,True);num(s['terminal_ebit_margin'],'terminal EBIT margin',0,1,True)
 num(s['additional_jv_guarantee_call_assumption'],'incremental guarantee call',0)
 if s['wacc']<=s['terminal_growth']:raise ValueError('WACC must exceed terminal growth')
 if s['terminal_growth']>=s['terminal_roic']:raise ValueError('terminal g/ROIC must be below one')
 if s['own_da_ratio']>s['own_capex_ratio']:raise ValueError('own depreciation cannot exceed own capex in this simplified model')
 if s['distribution_policy'] not in ['retain_all','distribute_positive']:raise ValueError('unknown distribution policy')
def finite_tree(x):
 if isinstance(x,float) and not math.isfinite(x):raise ValueError('nonfinite model output')
 if isinstance(x,dict):
  for v in x.values():finite_tree(v)
 if isinstance(x,list):
  for v in x:finite_tree(v)
def market_gate(quote=None,a=None):
 a=A if a is None else a
 if not isinstance(quote,dict):return {'status':'BLOCKED','reason':'missing quote','upside':None,'ranking_value':None}
 try:num(quote.get('price'),'quote price',0,strictlo=True)
 except ValueError as e:return {'status':'BLOCKED','reason':str(e),'upside':None,'ranking_value':None}
 if not quote.get('source_url') or not quote.get('as_of'):return {'status':'BLOCKED','reason':'quote date/source missing','upside':None,'ranking_value':None}
 # No comparison is authorized for this mixed-date financial anchor, even with a good quote.
 return {'status':'BLOCKED','reason':'mixed-date financial anchor; current bridge and grant-level denominator unavailable','upside':None,'ranking_value':None}
def model(s,a=None,wacc=None,g=None):
 a=copy.deepcopy(A if a is None else a);s=copy.deepcopy(s)
 try:
  if wacc is not None:s['wacc']=wacc
  if g is not None:s['terminal_growth']=g
  validate(a,s);w=s['wacc'];g=s['terminal_growth'];b=a['capital_bridge']
  opening_reserves=sum(b[k] for k in ['refundable_customer_deposits_reserve','minimum_operating_cash_assumption','opening_current_tax_payable','opening_noncurrent_tax_payable','opening_wdc_indemnification','incremental_uncertain_tax_claim_assumption','incremental_unpaid_legal_assumption','additional_claim_reserve_assumption'])
  # Do not floor negative opening surplus away: a reserve shortfall is a funding gap.
  opening_surplus=b['cash']-opening_reserves
  cashpool=opening_surplus-s['additional_jv_guarantee_call_assumption'];gap=max(0,-cashpool)
  rev=a['base_revenue'];pv=0;rows=[]
  for i in range(10):
   r=rev*(1+s['bit_growth'][i])*(1+s['asp_growth'][i]);ebit=r*s['ebit_margin_after_sbc'][i];tax=max(0,ebit)*s['tax_rate'];nopat=ebit-tax
   own=r*s['own_capex_ratio'];jv=r*s['net_jv_funding_ratio'];da=r*s['own_da_ratio'];wc=max(0,r-rev)*s['incremental_working_capital_ratio'];reinv=own+jv-da+wc;fcff=nopat-reinv;disc=fcff/(1+w)**(i+1);pv+=disc
   cashpool+=fcff if s['distribution_policy']=='retain_all' else min(0,fcff);gap=max(gap,-cashpool)
   rows.append(dict(fiscal_year=2027+i,revenue=r,ebit=ebit,tax=tax,nopat=nopat,own_capex=own,jv_net_funding=jv,own_da=da,delta_nwc=wc,net_reinvestment=reinv,fcff=fcff,pv_fcff=disc,funding_cash_pool_before_financing=cashpool,peak_funding_gap=max(0,gap)))
   rev=r
  tr=rev*(1+g);tn=tr*s['terminal_ebit_margin']*(1-s['tax_rate'])
  roic_reinv=tn*g/s['terminal_roic']
  physical_floor=tr*s['terminal_net_physical_jv_funding_floor']
  twc=(tr-rev)*s['incremental_working_capital_ratio'];treinv=max(roic_reinv,physical_floor+twc)
  if tn<=treinv:raise ValueError('terminal funding floor consumes NOPAT; no positive sustainable terminal FCFF')
  tf=tn-treinv;pvt=tf/(w-g)/(1+w)**10;ev=pv+pvt
  securities=b['marketable_securities']*(1-b['marketable_securities_haircut_assumption'])
  eq=ev+opening_surplus+securities-b['financial_debt']-s['additional_jv_guarantee_call_assumption']
  funded=gap<=1e-8;common=(max(0,eq) if funded else None)
  result=dict(status='VALID_CONDITIONAL_RESEARCH' if funded else 'FUNDING_GAP_COMMON_VALUE_WITHHELD',scenario=s['name'],diluted_share_proxy_m=b['diluted_share_proxy'],label=a['valuation_label'],historical_backtest_eligible=False,current_valuation_eligible=False,operating_value=ev,operating_value_status='CONTINGENT_ON_UNMODELED_FUNDING' if not funded else 'CONDITIONAL_OPERATING_DIAGNOSTIC',pv_explicit=pv,pv_terminal=pvt,terminal_share=pvt/ev if ev else None,opening_reserved_cash=opening_reserves,opening_surplus=opening_surplus,nonoperating_securities_value=securities,economic_equity_diagnostic=eq,conditional_common_equity=common,conditional_value_per_proxy_share=None if common is None else common/b['diluted_share_proxy'],conditional_value_per_158m_share=None if common is None else common/158,peak_unfunded_gap=max(0,gap),financing_solution=None,limited_liability_floor_applied=eq<0,terminal_reinvestment=treinv,terminal_roic_based_reinvestment=roic_reinv,terminal_physical_jv_floor=physical_floor,terminal_delta_wc=twc,terminal_fcff=tf,terminal_net_reinvestment_ratio=treinv/tr,terminal_implied_reinvestment_roic=tn*g/treinv if treinv else None,market_comparison=market_gate(a.get('market_quote'),a),rows=rows)
  finite_tree(result);return result
 except (ValueError,TypeError,KeyError,OverflowError,ZeroDivisionError) as e:
  return {'status':'INVALID_MODEL','reason':str(e),'operating_value':None,'conditional_common_equity':None,'conditional_value_per_proxy_share':None,'market_comparison':{'upside':None,'ranking_value':None}}
if __name__=='__main__':
 out=[model(s) for s in A['scenarios']];(P/'model-output.json').write_text(json.dumps(out,indent=2,allow_nan=False))
 sens=[]
 for s in A['scenarios']:
  for w in [.09,.11,.12,.13,.14]:
   for g in [.02,.025,.03,.04]:
    o=model(s,wacc=w,g=g);sens.append({'wacc':w,'terminal_growth':g,**{k:v for k,v in o.items() if k!='rows'}})
 (P/'sensitivity.json').write_text(json.dumps(sens,indent=2,allow_nan=False))
 funding=[]
 for s in A['scenarios']:
  c=copy.deepcopy(s);c['distribution_policy']='distribute_positive';funding.append(model(c))
 (P/'distribution-funding-stress.json').write_text(json.dumps(funding,indent=2,allow_nan=False))
 bridge=[]
 for tax in [0,259]:
  for legal in [0,93]:
   for jv in [0,923]:
    for s in A['scenarios']:
     a=copy.deepcopy(A);a['capital_bridge']['incremental_uncertain_tax_claim_assumption']=tax;a['capital_bridge']['incremental_unpaid_legal_assumption']=legal;c=copy.deepcopy(s);c['additional_jv_guarantee_call_assumption']=jv;o=model(c,a)
     bridge.append({'additional_utb':tax,'additional_legal':legal,'additional_jv_guarantee':jv,**{k:v for k,v in o.items() if k!='rows'}})
 (P/'claim-sensitivities.json').write_text(json.dumps(bridge,indent=2,allow_nan=False))
 with (P/'forecast.csv').open('w') as f:
  writer=csv.DictWriter(f,fieldnames=['scenario']+list(out[0]['rows'][0]));writer.writeheader()
  for o in out:
   for r in o['rows']:writer.writerow({'scenario':o['scenario'],**r})
 print(json.dumps([{k:v for k,v in o.items() if k!='rows'} for o in out],indent=2,allow_nan=False))
