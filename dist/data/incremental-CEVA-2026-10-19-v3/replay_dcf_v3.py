import json,pathlib,csv
p=pathlib.Path(__file__).parent;inp=json.load(open(p/'dcf-inputs-v3.json'));c=inp['capital'];a=inp['common_assumptions'];H=inp['observed_H1_2026'];out={};rows=[]
def run(case,wacc=None,g=None,cash_haircut=0,award_mult=1):
 wacc=wacc or case['wacc'];g=case['g'] if g is None else g;assert wacc>g
 L=case['license2026'];R=case['royalty2026'];prev=109.598;pv=0;cash=c['liquid_assets'];mincash=cash;flows=[]
 for i,y in enumerate(range(2026,2036)):
  if i:L*=1+case['license_growth'][i-1];R*=1+case['royalty_growth'][i-1]
  fullrev=L+R;margin=case['margin2026']+(case['terminal_margin']-case['margin2026'])*i/9;ebit=fullrev*margin
  rev=fullrev if i else fullrev-H['revenue'];ebit=ebit if i else ebit-H['ebit'];frac=.5 if i==0 else 1
  old_award_addback=c['existing_award_unrecognized_expense']*(1/3 if i==0 else 2/3 if i==1 else 0)
  economic_ebit=ebit+old_award_addback
  tax=max(0,economic_ebit*a['cash_tax_rate_on_positive_ebit'],rev*a['minimum_cash_tax_revenue_rate']);da=rev*.03;capex=rev*.035;wc=(fullrev-prev)*.18*(.5 if i==0 else 1)
  fcf=economic_ebit-tax+da-capex-wc;t=i+.5;pv+=fcf/(1+wacc)**t;cash+=fcf;mincash=min(mincash,cash)
  flows.append(dict(year=y,period='H2' if i==0 else 'FY',license=L-(H['licensing'] if i==0 else 0),royalty=R-(H['royalty'] if i==0 else 0),revenue=rev,gaap_ebit=ebit,old_award_addback=old_award_addback,economic_ebit=economic_ebit,tax=tax,da=da,capex=capex,delta_wc=wc,fcff=fcf,discount_years=t,funding_capacity_proxy=cash));prev=fullrev
 rev=prev*(1+g);terminal_ebit=rev*case['terminal_margin'];terminal_tax=max(0,terminal_ebit*a['cash_tax_rate_on_positive_ebit'],rev*a['minimum_cash_tax_revenue_rate']);nopat=terminal_ebit-terminal_tax;terminal_reinvestment=nopat*g/a['terminal_incremental_roic'];terminal_fcf=nopat-terminal_reinvestment;tv=terminal_fcf/(wacc-g);pvtv=tv/(1+wacc)**9.5;ev=pv+pvtv
 excess=c['liquid_assets']-c['minimum_operating_cash']-cash_haircut;bridge=excess-c['severance_net']-c['other_noncurrent_accruals'];equity=ev+bridge;shares=c['common_shares']+award_mult*c['rsu_psu_unvested'];value=equity/shares
 if value>c['option_exercise_price']:value=(equity+c['option_shares']*c['option_exercise_price'])/(shares+c['option_shares'])
 funding=max(0,c['minimum_operating_cash']-mincash);res=dict(enterprise_value=ev,equity_value_before_option_cash=equity,conditional_value_per_share=value,pv_explicit=pv,pv_terminal=pvtv,terminal_share_of_ev=pvtv/ev if ev else None,terminal_revenue=rev,terminal_ebit=terminal_ebit,terminal_cash_tax=terminal_tax,terminal_nopat=nopat,terminal_fcf=terminal_fcf,terminal_reinvestment=terminal_reinvestment,minimum_funding_capacity_proxy=mincash,unfunded_gap=funding,publication_eligible=False)
 return res,flows
for name,case in inp['cases'].items():
 res,flows=run(case);out[name]=res;rows += [dict(case=name,**r) for r in flows]
(p/'dcf-output-v3.json').write_text(json.dumps(out,indent=2))
with open(p/'forecast-v3.csv','w') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
sens=[]
for name,case in inp['cases'].items():
 for w in [.09,.10,.11,.12,.13,.15]:
  for g in [.01,.02,.025,.03]:sens.append(dict(case=name,wacc=w,g=g,**run(case,w,g)[0]))
for h in [12.27,24.54]:sens.append(dict(foreign_liquidity_haircut=h,**run(inp['cases']['base'],cash_haircut=h)[0]))
for name,case in inp['cases'].items():
 for mult in [1.25,1.5]:sens.append(dict(case=name,award_claim_multiplier=mult,**run(case,award_mult=mult)[0]))
(p/'sensitivity-v3.json').write_text(json.dumps(sens,indent=2));print(json.dumps(out,indent=2))
