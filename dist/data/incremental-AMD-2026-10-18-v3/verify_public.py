"""Verify portable derived bundle, not its economic assumptions."""
from pathlib import Path
import json,math,hashlib
P=Path(__file__).resolve().parent
j=lambda n:json.loads((P/n).read_text())
f=j('forecast-scenarios.json');c=j('conditional-capital-pools.json');d=j('debt-financing-bridge.json');n=0
for name,x in f['cases'].items():
 ev=math.fsum(r['fcff_before_customer_warrant_claims']/(1+x['assumptions']['wacc'])**r['discount_time_years'] for r in x['rows'])+x['terminal']['pv_terminal_value'];partner=math.fsum(r['pv_partner_net_funding'] for r in x['rows']);pool=ev-partner+math.fsum(c[name]['components'].values())
 assert abs(ev-x['results']['operating_ev_before_customer_equity_rebates_and_partner_asset_flows'])<1e-6;n+=1
 assert abs(pool-c[name]['conditional_residual_pool_after_selected_espp_before_other_legacy_employee_and_customer_claims'])<1e-6;n+=1
 assert c[name]['unqualified_common_equity'] is None;n+=1
assert sum(t['principal'] for t in d['august_offering']['tranches'])==4750;n+=1
assert sum(t['principal']*t['coupon'] for t in d['august_offering']['tranches'])==240;n+=1
assert d['financing_only_if_all_proceeds_retained_and_maturity_paid']['change_cash_minus_senior_principal']==-24;n+=1
r=j('management-guidance-credibility.json')['quarter_observations']
for x in r:assert abs(x['actual_revenue']/x['revenue_midpoint']-1-x['reported_error_recomputed'])<1e-12;n+=1
if (P/'manifest.json').exists():
 for x in j('manifest.json')['files']:
  b=(P/x['name']).read_bytes();assert hashlib.sha256(b).hexdigest()==x['sha256'];assert len(b)==x['bytes'];n+=2
print(f'{n} portable assertions passed; economic validation is separate.')
