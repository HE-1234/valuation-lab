import json,math,pathlib,csv
P=pathlib.Path(__file__).parent
def num(v,lo,hi,label):
 if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or not lo<=v<=hi:raise ValueError('Invalid '+label)
def finite(x):
 if isinstance(x,float) and not math.isfinite(x):raise ValueError('Nonfinite')
 if isinstance(x,dict):
  for v in x.values():finite(v)
 if isinstance(x,list):
  for v in x:finite(v)
def calculate(d,c):
 finite(d);finite(c);b=d['capital'];n=10
 for k,v in b.items():num(v,.000001 if k=='shares' else 0,1e8,k)
 for k,v in d['revenue'].items():num(v,.000001,1e8,k)
 for k in ['csg_growth','eisg_growth','margin','capex_ratio','depreciation_ratio','acquisition_reinvestment_ratio']:
  if not isinstance(c[k],list) or len(c[k])!=n:raise ValueError('Ten values required: '+k)
  for v in c[k]:num(v,-.95 if 'growth' in k else -1 if k=='margin' else 0,2 if 'growth' in k else 1,k)
 for k in ['marginal_nwc','cash_floor_ratio','tax','equity_fee']:num(c[k],0,.95,k)
 for k in ['wacc','terminal_roic']:num(c[k],.001,.5,k)
 num(c['g'],0,.06,'g');num(c['emergency_debt_capacity'],0,1e7,'capacity');num(c['emergency_interest'],0,.5,'interest');num(c['equity_issue_price'],.001,1e6,'equityprice')
 g=c['g'];w=c['wacc']
 if w<=g or c['terminal_roic']<=g:raise ValueError('WACC/ROIC must exceed g')
 if any(abs(c[k][-1]-g)>1e-10 for k in ['csg_growth','eisg_growth']):raise ValueError('Growth must converge')
 if any(a<z for a,z in zip(c['capex_ratio'],c['depreciation_ratio'])):raise ValueError('Gross capex cannot be below depreciation in this maintenance model')
 for s in d['debt_schedule']:
  num(s['principal'],0,1e7,'principal');num(s['coupon'],0,.5,'coupon');num(s['year'],1,10,'maturityyear')
  if int(s['year'])!=s['year']:raise ValueError('Maturity year integer')
 if abs(sum(s['principal'] for s in d['debt_schedule'])-b['debt_face'])>1e-8:raise ValueError('Debt schedule mismatch')
 r=d['revenue']['csg'];e=d['revenue']['eisg'];cash=b['unrestricted_cash']-b['pension_reserve']-b['other_claim_reserve'];floor=b['minimum_operating_cash'];shares=b['shares'];newdebt=0;pv=fees_pv=0;rows=[]
 for i in range(n):
  oldrev=r+e;r*=1+c['csg_growth'][i];e*=1+c['eisg_growth'][i];rev=r+e;ebit=rev*c['margin'][i];tax=max(ebit,0)*c['tax'];nopat=ebit-tax
  capex=rev*c['capex_ratio'][i];da=rev*c['depreciation_ratio'][i];ma=rev*c['acquisition_reinvestment_ratio'][i];dnwc=(rev-oldrev)*c['marginal_nwc'];newfloor=rev*c['cash_floor_ratio'];dcash=newfloor-floor;floor=newfloor
  raw_reinvestment=capex-da+ma+dnwc+dcash
  # Approach sustainable reinvestment gradually; never override maintenance/NWC/cash requirements downward.
  roic_floor=max(0,nopat)*g/c['terminal_roic']*max(0,(i-6)/3)
  reinvest=max(raw_reinvestment,roic_floor);extra=reinvest-raw_reinvestment;fcff=nopat-reinvest;disc=(1+w)**(i+1);pv+=fcff/disc
  interest=sum(s['principal']*s['coupon'] for s in d['debt_schedule'] if s['year']>=i+1)+newdebt*c['emergency_interest']
  # Full-year coupon in maturity year conservatively overstates liquidity cost; actual semiannual timing omitted.
  debt_repayment=sum(s['principal'] for s in d['debt_schedule'] if s['year']==i+1)
  cash_pre=cash+fcff+dcash-interest*(1-c['tax'] if ebit>interest else 1)-debt_repayment
  debt_raise=equity_raise=fee=0
  if cash_pre<floor:
   need=floor-cash_pre;debt_raise=min(need,max(0,c['emergency_debt_capacity']-newdebt));newdebt+=debt_raise;need-=debt_raise
   if need>0:equity_raise=need/(1-c['equity_fee']);fee=equity_raise*c['equity_fee'];shares+=equity_raise/c['equity_issue_price']
  cash=cash_pre+debt_raise+equity_raise-fee;fees_pv+=fee/disc
  rows.append(dict(year=i+1,period_end=f'{2026+i+1}-07-31',csg_revenue=r,eisg_revenue=e,revenue=rev,ebit=ebit,nopat=nopat,gross_capex=capex,depreciation=da,acquisition_reinvestment=ma,delta_nwc=dnwc,delta_operating_cash=dcash,roic_topup=extra,reinvestment=reinvest,fcff=fcff,pv_fcff=fcff/disc,interest=interest,debt_repayment=debt_repayment,cash_floor=floor,cash_end=cash,new_debt=debt_raise,new_equity_gross=equity_raise,issuance_fee=fee,shares_end=shares))
 last=rows[-1];tr=last['revenue']*(1+g);tn=tr*c['margin'][-1]*(1-c['tax'])
 if tn<=0:raise ValueError('Positive terminal earnings required')
 operating_floor=tr*(c['capex_ratio'][-1]-c['depreciation_ratio'][-1]+c['acquisition_reinvestment_ratio'][-1])+(tr-last['revenue'])*(c['marginal_nwc']+c['cash_floor_ratio'])
 terminal_reinvestment=max(tn*g/c['terminal_roic'],operating_floor)
 if terminal_reinvestment>=tn:raise ValueError('Terminal reinvestment consumes all earnings')
 tf=tn-terminal_reinvestment;tv=tf/(w-g);pvtv=tv/(1+w)**n;ev=pv+pvtv
 bridge=b['unrestricted_cash']-b['debt_face']-b['pension_reserve']-b['other_claim_reserve']-b['minimum_operating_cash']+b['long_term_investments_included'];equity=ev+bridge-fees_pv
 funded=any(z['new_debt']>1e-8 or z['new_equity_gross']>1e-8 for z in rows)
 out={'enterprise_value':ev,'equity_value':equity,'capital_bridge':bridge,'explicit_pv':pv,'terminal_pv':pvtv,'terminal_share':pvtv/ev if ev>0 else None,'terminal_nopat':tn,'terminal_reinvestment':terminal_reinvestment,'terminal_operating_floor':operating_floor,'terminal_roic_floor':tn*g/c['terminal_roic'],'terminal_fcff':tf,'funding_required':funded,'conditional_value_per_share':None if funded or equity<=0 else equity/b['shares'],'funding_dilution_diagnostic_only':max(0,equity)/shares,'rows':rows};finite(out);return out
def main():
 d=json.load(open(P/'dcf-inputs-v1.json'));o={k:calculate(d,c) for k,c in d['cases'].items()};json.dump(o,open(P/'dcf-output-v1.json','w'),indent=2,allow_nan=False)
 rr=[dict(case=k,**r) for k,v in o.items() for r in v['rows']]
 with open(P/'forecast-v1.csv','w') as f:w=csv.DictWriter(f,fieldnames=rr[0]);w.writeheader();w.writerows(rr)
 print({k:{a:b for a,b in v.items() if a!='rows'} for k,v in o.items()})
if __name__=='__main__':main()
