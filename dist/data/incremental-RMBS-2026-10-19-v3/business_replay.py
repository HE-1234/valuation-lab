import json,pathlib,csv,copy
P=pathlib.Path(__file__).parent

def run(x,s):
 if not 0 <= s['terminal_growth'] < s['wacc']: raise ValueError('Require 0 <= terminal growth < WACC')
 if s['incremental_roic'] <= 0 or s['years'] < 2 or not 0 <= s['tax_rate'] < 1: raise ValueError('Invalid ROIC, years, or tax rate')
 seg=x['initial_segments'].copy();prev=sum(seg.values());cash=x['cash_and_securities']-x['operating_cash_reserve']-x['eda_debt_like_claim']-x['other_claim_reserve'];rows=[];pv=0;cum=0;mincum=0
 for i in range(1,s['years']+1):
  a=(i-1)/(s['years']-1)
  for k in seg:seg[k]*=1+s['growth_start'][k]*(1-a)+s['growth_end'][k]*a
  rev=sum(seg.values());margin=s['margin_start']*(1-a)+s['margin_end']*a;nopat=rev*margin*(1-s['tax_rate']);delta=rev-prev
  # Economic reinvestment includes both operating capital floor and growth at assumed marginal ROIC.
  growth_need=max(0,delta*margin*(1-s['tax_rate'])/s['incremental_roic'])
  floor=rev*s['net_reinvestment_floor_pct_revenue']+max(0,delta)*s['growth_working_capital_pct']
  reinvest=max(growth_need,floor);fcf=nopat-reinvest;cum+=fcf;mincum=min(mincum,cum);discount=(1+s['wacc'])**i;pv+=fcf/discount
  rows.append({'year':i,'period_end':f'{2026+i}-06-30',**seg,'revenue':rev,'ebit_margin':margin,'nopat':nopat,'growth_reinvestment':growth_need,'reinvestment_floor':floor,'net_reinvestment':reinvest,'fcff':fcf,'discount_factor':discount,'present_value':fcf/discount});prev=rev
 g=s['terminal_growth'];tr=rev*(1+g);tn=tr*s['margin_end']*(1-s['tax_rate']);tri=max(tn*g/s['incremental_roic'],tr*s['net_reinvestment_floor_pct_revenue']+rev*g*s['growth_working_capital_pct']);tfcf=tn-tri;tv=tfcf/(s['wacc']-g);pvt=tv/(1+s['wacc'])**s['years'];ev=pv+pvt;eq=ev+cash;funding=max(0,-(cash+mincum))
 return {'enterprise_value':ev,'equity_before_award_claims':eq,'net_cash_bridge':cash,'common_share_cash_replacement_proxy':None if funding else eq/x['initial_common_shares'],'disclosed_nonvested_units_denominator_sensitivity':None if funding else eq/(x['initial_common_shares']+x['legacy_nonvested_awards']),'terminal_pv_fraction':pvt/ev,'terminal_fcff':tfcf,'terminal_reinvestment':tri,'external_funding_required':funding,'current_price_target':None,'rows':rows}
if __name__=='__main__':
 x=json.loads((P/'dcf-inputs-v1.json').read_text());o={k:run(x,s) for k,s in x['scenarios'].items()};(P/'dcf-output-v1.json').write_text(json.dumps(o,indent=2))
 with (P/'forecast-v1.csv').open('w') as f:
  w=csv.DictWriter(f,fieldnames=['scenario']+list(o['base']['rows'][0]));w.writeheader()
  for k,v in o.items():w.writerows([{'scenario':k,**r} for r in v['rows']])
 print(json.dumps({k:{a:b for a,b in v.items() if a!='rows'} for k,v in o.items()},indent=2))
