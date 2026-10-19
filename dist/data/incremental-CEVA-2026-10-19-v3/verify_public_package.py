"""Read-only verification of the CEVA V3 public-safe distribution; standard library only."""
import hashlib,json,pathlib,csv
p=pathlib.Path(__file__).resolve().parent
manifest=json.loads((p/'packaging-manifest-v3.json').read_text())
checks=[]
def check(label,value):
 checks.append({'check':label,'pass':bool(value)})
 if not value:raise AssertionError(label)
for entry in manifest['files']:
 f=p/entry['path'];check('Package SHA-256 '+entry['path'],f.exists() and hashlib.sha256(f.read_bytes()).hexdigest()==entry['sha256'])
original=json.loads((p/'original-manifest-v3.json').read_text())
for name in ['dcf-inputs-v3.json','dcf-output-v3.json','history-v3.json','forecast-v3.csv','sensitivity-v3.json','verification-v3.json','replay_dcf_v3.py']:
 check('Frozen reviewed source '+name,hashlib.sha256((p/name).read_bytes()).hexdigest()==original[name])
source=json.loads((p/'dcf-inputs-v3.json').read_text());out=json.loads((p/'dcf-output-v3.json').read_text());hist=json.loads((p/'history-normalized-v3.json').read_text())
check('Ten annual history observations',[x['fiscalYear'] for x in hist]==list(range(2016,2026)))
for row in hist:
 y=row['fiscalYear'];s=row['sourceRow']
 check(str(y)+' exact source history retained',row['revenue']==s['revenue'] and row['canonicalOperatingEBIT']==s['operating_income'])
 check(str(y)+' consolidated PPE-only measure',row['reportedOrDerivedFCF']==s['cfo_total_less_ppe_capex'])
 if 2021<=y<=2023:
  check(str(y)+' no fabricated continuing PPE',row['propertyCapexContinuing'] is None)
  check(str(y)+' correct continuing PPE bounds',row['continuingCfoLessPpeLowerBound']==s['continuing_cfo_less_ppe_capex_lower_bound'] and row['continuingCfoLessPpeUpperBound']==s['continuing_cfo_less_ppe_capex_upper_bound'])
check('27 guidance facts',len(json.loads((p/'guidance-vs-actual-v2.json').read_text()))==27)
check('80 reviewed sensitivity rows',len(json.loads((p/'sensitivity-v3.json').read_text()))==80)
check('All V3 author checks passed',json.loads((p/'verification-v3.json').read_text())['all_passed'])
check('All final independent checks passed',all(x['pass'] for x in json.loads((p/'independent-review/v3-review-results.json').read_text())['checks']))
check('Correct June capital and October information',source['valuation_date']=='2026-06-30' and source['cutoff']=='2026-10-19')
check('Legal shares and award reserve',source['capital']['common_shares']==28.137917 and source['capital']['rsu_psu_unvested']==1.845728)
for name,o in out.items():
 check(name+' terminal revenue floor applied',abs(o['terminal_cash_tax']-max(0,o['terminal_ebit']*.2,o['terminal_revenue']*.03))<1e-10)
 check(name+' source current publication gate closed',o['publication_eligible'] is False)
for field in ['currentValuationEligible','currentPriceTargetEligible','historicalBacktestEligible','rankingEligible','upsideEligible','expectedReturnEligible','recommendationEligible']:
 check(field+' closed',manifest[field] is False)
for f in p.rglob('*'):
 if f.is_file():check('No raw corporate document '+f.name,not f.name.endswith(('.pdf','.htm','.txt')))
print(json.dumps({'all_passed':True,'assertions':len(checks),'scope':'Package integrity and explicit data-scope invariants; not issuer audit or browser adapter certification','checks':checks},indent=2))
