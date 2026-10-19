import json,math,pathlib,csv
P=pathlib.Path(__file__).parent

def finite_tree(x,path='root',allow_bool=False):
 if isinstance(x,bool):
  if allow_bool:return
  raise ValueError('Boolean forbidden '+path)
 if isinstance(x,(int,float)) and not math.isfinite(x):raise ValueError('Nonfinite '+path)
 if isinstance(x,dict):
  for k,v in x.items():finite_tree(v,path+'.'+k,allow_bool)
 if isinstance(x,list):
  for i,v in enumerate(x):finite_tree(v,path+f'[{i}]',allow_bool)
def num(x,lo,hi,label):
 if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or not lo<=x<=hi:raise ValueError('Invalid '+label)
def calculate(d,c):
 finite_tree(d);finite_tree(c);b=d['capital'];n=10
 for k in ['cash_short_investments','finance_lease','eda_obligations','acquisition_reserve','minimum_operating_cash','unquoted_equity_included']:num(b[k],0,1e7,k)
 num(b['ordinary_shares'],.001,1e7,'shares');num(b['ads_per_ordinary'],.001,10000,'ADS ratio')
 for k in ['royalty','license','silicon']:num(d['revenue'][k],0,1e7,k)
 for k in ['royalty_growth','license_growth','silicon_revenue','ip_ebit_margin','silicon_ebit_margin','net_capex_ratio']:
  if not isinstance(c[k],list) or len(c[k])!=n:raise ValueError('Require10 annual values '+k)
  lo,hi=(-.95,2) if 'growth' in k else (-1,1) if 'margin' in k else (0,1e7) if k=='silicon_revenue' else (0,1)
  for v in c[k]:num(v,lo,hi,k)
 for k in ['net_capex_floor_total','net_capex_floor_ip','net_capex_floor_silicon','ip_marginal_nwc','silicon_marginal_nwc','tax_rate','cash_floor_ratio','equity_issuance_fee']:num(c[k],0,.95,k)
 num(c['wacc'],.01,.5,'WACC');num(c['terminal_growth'],0,.06,'g');num(c['terminal_roic'],.01,.7,'ROIC');num(c['funding_interest_rate'],0,.5,'interest');num(c['funding_debt_capacity_multiple'],0,10,'debtcapacity');num(c['emergency_equity_price_per_ads'],.01,100000,'issueprice')
 for key in ['net_capex_floor_total','net_capex_floor_ip','net_capex_floor_silicon']:
  if c[key]<=0:raise ValueError('Positive physical-floor assumption required '+key)
 g=c['terminal_growth'];w=c['wacc'];roic=c['terminal_roic']
 if w<=g or roic<=g:raise ValueError('WACC and ROIC must exceed g')
 if abs(c['royalty_growth'][-1]-g)>1e-10 or abs(c['license_growth'][-1]-g)>1e-10:raise ValueError('Final IP growth must converge to g')
 expected_silicon=c['silicon_revenue'][-2]*(1+g)
 if not math.isclose(c['silicon_revenue'][-1],expected_silicon,rel_tol=1e-10,abs_tol=1e-10):raise ValueError('Final silicon revenue must equal prior revenue times1+g, including zero-base paths')
 r=d['revenue']['royalty'];l=d['revenue']['license'];s=d['revenue']['silicon'];cash=b['cash_short_investments']-b['finance_lease']-b['eda_obligations']-b['acquisition_reserve'];debt=0;shares=b['ordinary_shares'];rows=[];pv=0;pv_funding_fees=0;previous_cash_floor=b['minimum_operating_cash']
 for i in range(n):
  pr,pl,ps=r,l,s;r*=1+c['royalty_growth'][i];l*=1+c['license_growth'][i];s=c['silicon_revenue'][i];rev=r+l+s
  ebit=(r+l)*c['ip_ebit_margin'][i]+s*c['silicon_ebit_margin'][i];tax=max(0,ebit)*c['tax_rate'];nopat=ebit-tax
  dnwc=((r+l)-(pr+pl))*c['ip_marginal_nwc']+(s-ps)*c['silicon_marginal_nwc'];netcapex=rev*c['net_capex_ratio'][i]
  floor=rev*c['cash_floor_ratio'];delta_operating_cash=floor-previous_cash_floor;previous_cash_floor=floor;dnwc+=delta_operating_cash
  # Smooth final three years to sustainable capital needs. Final-year investment matches g/ROIC.
  target=nopat*g/roic-dnwc
  if i>=7:
   if target<0:raise ValueError('Terminal reinvestment incompatible with NWC')
   blend=(i-6)/3;netcapex=netcapex*(1-blend)+target*blend
  physical_floor=max(rev*c['net_capex_floor_total'],(r+l)*c['net_capex_floor_ip']+s*c['net_capex_floor_silicon'])
  if netcapex+1e-9<physical_floor:raise ValueError(f'Net-capex physical-floor incompatibility in FY{2027+i}: residual{netcapex} below floor{physical_floor}; revise growth, ROIC or explicit floor assumptions')
  reinvest=netcapex+dnwc;fcff=nopat-reinvest;disc=(1+w)**(i+1);pv+=fcff/disc
  interest=debt*c['funding_interest_rate'];after_interest=interest*(1-c['tax_rate']) if ebit>interest else interest
  cash_pre=cash+fcff+delta_operating_cash-after_interest;debt_raise=equity_raise=issue_fee=0
  if cash_pre<floor:
   need=floor-cash_pre;headroom=max(0,c['funding_debt_capacity_multiple']*max(ebit,0)-debt);debt_raise=min(need,headroom);debt+=debt_raise;need-=debt_raise
   if need>0:
    equity_raise=need/(1-c['equity_issuance_fee']);issue_fee=equity_raise-need;shares+=equity_raise/c['emergency_equity_price_per_ads']/b['ads_per_ordinary']
   cash=cash_pre+debt_raise+equity_raise-issue_fee
  else:cash=cash_pre
  pv_funding_fees+=issue_fee/disc
  rows.append(dict(fiscal_year=2027+i,royalty=r,license=l,silicon=s,revenue=rev,ebit=ebit,ebit_margin=ebit/rev,tax=tax,nopat=nopat,net_capex=netcapex,net_capex_floor=physical_floor,delta_nwc=dnwc,delta_operating_cash=delta_operating_cash,reinvestment=reinvest,fcff=fcff,discount_factor=disc,pv_fcff=fcff/disc,cash_floor=floor,cash_end=cash,new_debt=debt_raise,debt_end=debt,new_equity_gross=equity_raise,issue_fee=issue_fee,interest=interest,shares_end=shares))
 last=rows[-1];terminal_nopat=last['nopat']*(1+g)
 if terminal_nopat<=0:raise ValueError('Positive terminal NOPAT required')
 terminal_reinvestment=terminal_nopat*g/roic
 terminal_delta_nwc=((r+l)*c['ip_marginal_nwc']+s*c['silicon_marginal_nwc']+last['revenue']*c['cash_floor_ratio'])*g
 terminal_net_capex=terminal_reinvestment-terminal_delta_nwc
 terminal_floor=max(last['revenue']*(1+g)*c['net_capex_floor_total'],((r+l)*c['net_capex_floor_ip']+s*c['net_capex_floor_silicon'])*(1+g))
 if terminal_net_capex+1e-9<terminal_floor:raise ValueError('Terminal physical floor incompatible with g/ROIC')
 terminal_fcff=terminal_nopat-terminal_reinvestment;tv=terminal_fcff/(w-g);pvtv=tv/(1+w)**n;ev=pv+pvtv
 bridge=b['cash_short_investments']-b['finance_lease']-b['eda_obligations']-b['acquisition_reserve']-b['minimum_operating_cash']+b['unquoted_equity_included'];equity=ev+bridge-pv_funding_fees
 # Future debt raised is not double-subtracted from today's EV. Its cash funds deficits already charged in FCFF.
 # Baseline per-share output is suppressed if external funding is required; a separate dilution diagnostic is provided.
 funded=any(z['new_debt']>0 or z['new_equity_gross']>0 for z in rows)
 out=dict(enterprise_value=ev,explicit_pv=pv,terminal_pv=pvtv,terminal_share=pvtv/ev,bridge=bridge,equity_value=equity,value_per_ads=None if funded else equity/(b['ordinary_shares']*b['ads_per_ordinary']),funding_required=funded,funding_dilution_diagnostic=equity/(shares*b['ads_per_ordinary']),funding_diagnostic_warning='Share-count denominator illustration only; not financing-adjusted fair value and not a target when funded',terminal_nopat=terminal_nopat,terminal_net_capex=terminal_net_capex,terminal_net_capex_floor=terminal_floor,terminal_reinvestment=terminal_reinvestment,terminal_fcff=terminal_fcff,terminal_roic=roic,terminal_growth=g,terminal_reinvestment_rate=g/roic,rows=rows)
 finite_tree(out,allow_bool=True);return out

def main():
 d=json.load(open(P/'dcf-inputs-v2.json'));out={k:calculate(d,c) for k,c in d['cases'].items()};json.dump(out,open(P/'dcf-output-v2.json','w'),indent=2,allow_nan=False)
 rows=[dict(case=k,**r) for k,o in out.items() for r in o['rows']]
 with open(P/'forecast-v2.csv','w') as f:wri=csv.DictWriter(f,fieldnames=rows[0].keys());wri.writeheader();wri.writerows(rows)
 print(json.dumps({k:{x:v for x,v in o.items() if x!='rows'} for k,o in out.items()},indent=2))
if __name__=='__main__':main()
