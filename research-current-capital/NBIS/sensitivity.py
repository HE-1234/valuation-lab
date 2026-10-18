"""Read-only frozen-case audit. USD million. All alternatives analyst sensitivities, not guidance."""
import json
from pathlib import Path
p=Path(__file__).parent
c=json.loads((p/'cases-snapshot.json').read_text())
w=.155;t=.25;base=c['valuation']['operatingEnterpriseValueAtForecastOrigin']
rows=c['annual']
def capital_efficiency(discount, advance_link=0):
    # Identical physical assets, commissioning, billable capacity and EBITDA; only purchase-price
    # discount on 2027-29 spend. Half-year depreciation convention; five-year life; no salvage.
    # Deliberately a one-off price sensitivity: later replacement quantities/prices unchanged.
    # Procurement price advantage is NOT established and all initial spend treated as hardware.
    savings={y:20000*discount for y in [2027,2028,2029]}
    out=[];pv=0; prior_gap=0
    for a in rows:
        y=int(a['period']); cap=savings.get(y,0)
        da=sum(s/5*(.5 if y in [v,v+5] else 1 if v<y<v+5 else 0) for v,s in savings.items())
        # Advance balances lose linked gross receipts until2029, recover to identical2034 endpoint.
        gap=-advance_link*sum(s for v,s in savings.items() if v<=y) if y<=2029 else -advance_link*sum(savings.values())*max(0,(2034-y)/5)
        adv_delta=gap-prior_gap;prior_gap=gap
        # Lower DA raises EBIT by da; DA addback falls da. net FCFF: cap-tax*da+advance movement.
        delta=cap-t*da+adv_delta; pv+=delta/a['discountFactor']
        out.append({'year':y,'saved_cash_capex':cap,'lower_DA':da,'higher_EBIT':da,'advance_balance_gap':gap,'delta_FCFF':delta})
    return {'discount':discount,'advance_link':advance_link,'delta_EV':pv,'EV':base+pv,'annual':out}
def margin_change(delta):
    # Fixed owned-asset capital/DA; operating cash cost improvement, not a DA accounting change.
    pv=sum(a['revenue']*delta*(1-t)/a['discountFactor'] for a in rows)
    term=c['terminal']; pv+=term['revenue']*delta*(1-t)*(1-term['growth']/term['ROIC'])/(w-term['growth'])/term['discountFactor']
    return {'margin_change':delta,'EV':base+pv,'delta_EV':pv}
# Revenue-weighted implied adjusted EBITDA is only EBIT+DA+assumed3%SBC, excludes other adjustments.
audit=[{'year':a['period'],'revenue':a['revenue'],'implied_adj_EBITDA_margin_at_3pct_SBC':a['operatingMargin']+a['capitalComponents']['depreciationAmortization']/a['revenue']+.03} for a in rows]
r={'base_EV':base,'annual_margin_audit':audit,'capital_price_sensitivity':[capital_efficiency(d,k) for k in [0,.35] for d in [.1,.2,.25]],'operating_cost_sensitivity':[margin_change(d) for d in [-.05,.05]],'capital_price_breakeven_discount':{str(k):-base/capital_efficiency(1,k)['delta_EV'] for k in [0,.35]},'sustained_margin_breakeven_change':-base/margin_change(1)['delta_EV']}
(p/'sensitivity.json').write_text(json.dumps(r,indent=2))
print(json.dumps({k:v for k,v in r.items() if k not in ['capital_price_sensitivity','annual_margin_audit']},indent=2))
for x in r['capital_price_sensitivity']: print(x['discount'],x['advance_link'],x['EV'])
print(audit[:3])
