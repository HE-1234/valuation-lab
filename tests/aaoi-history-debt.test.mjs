import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const data=JSON.parse(readFileSync(new URL('../dist/data/company-history.json',import.meta.url)));
const review=JSON.parse(readFileSync(new URL('../scripts/aaoi-history-debt-review.json',import.meta.url)));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('AAOI historical bank debt includes separately reviewed convertible notes from FY2019',()=>{
 const expected={FY2019:126.964,FY2020:130.023,FY2021:133.369,FY2022:136.580,FY2023:99.716,FY2024:161.179,FY2025:163.804};
 for(const r of data.companies.AAOI.annual.filter(r=>r.period>='FY2019')){const f=r.facts,e=review.periods[r.periodEnd];near(f.mappedDebt.value,expected[r.period]);assert.equal(f.mappedDebt.mappingReview.reviewed,true);assert.deepEqual(f.mappedDebt.components,e.components);near(f.mappedDebt.value,e.components.reduce((sum,k)=>sum+f[k].value,0));assert.ok(f.convertibleSeniorNotesNoncurrent.value>0);assert.match(f.convertibleSeniorNotesNoncurrent.tag,/ConvertibleLongTermNotesPayable/);near(f.bookCapitalProxy.value,f.bookEquity.value+expected[r.period]-f.cashAndEquivalents.value);near(r.metrics.bookSalesCapitalProxy.value,f.revenue.value/f.bookCapitalProxy.value);assert.equal(r.metrics.bookROICProxy.value,null);}
 const r=data.companies.AAOI.annual.find(r=>r.period==='FY2023');near(r.facts.convertibleDebtCurrent.value,.286);assert.ok(r.facts.mappedDebt.components.includes('convertibleDebtCurrent'));assert.ok(!r.facts.mappedDebt.components.includes('longTermDebtTotal'));
});
test('AAOI note/table review preserves exact primary evidence and its small FY2024 rounding distinction',()=>{
 assert.equal(review.sources.length,6);for(const s of review.sources){assert.match(s.sourceUrl,/^https:\/\/www.sec.gov\/Archives\//);assert.match(s.sha256,/^[0-9a-f]{64}$/);assert.equal(s.originalDocumentVerified,true);assert.ok(s.debtTableRows.some(row=>row[0]==='Convertible senior notes'));}
 const r=data.companies.AAOI.annual.find(r=>r.period==='FY2024');near(r.facts.longTermDebtCurrent.value,22.369);near(r.facts.longTermDebtNoncurrent.value,4.313);assert.match(r.facts.mappedDebt.note,/0\.001m/);assert.equal(data.companies.AAOI.annual.find(r=>r.period==='FY2018').facts.convertibleSeniorNotesNoncurrent.value,0);
});
test('AAOI builder withholds capital proxies when its debt review is unavailable',()=>{
 const code=`import importlib.util,pathlib,sys,json,tempfile
from urllib.parse import urlparse
sys.argv=['scripts/build-company-history.py']
spec=importlib.util.spec_from_file_location('history','scripts/build-company-history.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
# Portable test fixture reconstructed only from existing published raw facts.
# This does not fabricate or overwrite production SEC cache or historical data.
published=json.load(open('dist/data/company-history.json'))['companies']['AAOI']
rows=([published['baseObservation']] if published.get('baseObservation') else [])+published['annual']
facts={}; docs={}
for row in rows:
 for f in row['facts'].values():
  if f.get('rawValue') is None or not f.get('tag','').startswith('us-gaap:'): continue
  tag=f['tag'].split(':',1)[1]; unit='shares' if 'Shares' in tag else 'USD'
  r={'val':f['rawValue'],'end':f['periodEnd'],'filed':f['filedAt'],'accn':f['accession'],'form':'10-K'}
  if f.get('periodStart'): r['start']=f['periodStart']
  facts.setdefault(tag,{'units':{}})['units'].setdefault(unit,[]).append(r)
  docs[f['accession']]=urlparse(f['sourceUrl']).path.split('/')[-1]
with tempfile.TemporaryDirectory() as folder:
 m.P=pathlib.Path(folder)
 (m.P/'AAOI-facts.json').write_text(json.dumps({'cik':1158114,'entityName':published['name'],'facts':{'us-gaap':facts}}))
 (m.P/'AAOI-submissions.json').write_text(json.dumps({'filings':{'recent':{'accessionNumber':list(docs),'primaryDocument':list(docs.values()),'form':['10-K']*len(docs)}}}))
 (m.P/'AAOI-retrieval.json').write_text(json.dumps([{'url':published['sourceEndpoint'],'retrievedAt':published['retrievedAt']}]))
 # Positive control: fixture must reproduce every reviewed debt subtotal first.
 c=m.build_company('AAOI')
 assert len(c['annual'])==10
 expected={r['period']:r for r in published['annual']}
 checked=0
 for r in c['annual']:
  if r['period']>='FY2019':
   assert abs(r['facts']['mappedDebt']['value']-expected[r['period']]['facts']['mappedDebt']['value'])<1e-8
   checked+=1
 assert checked==7
 exists=pathlib.Path.exists
 pathlib.Path.exists=lambda p: False if p.name=='aaoi-history-debt-review.json' else exists(p)
 c=m.build_company('AAOI')
 withheld=0
 for r in c['annual']:
  if r['period']>='FY2019':
   assert r['facts']['mappedDebt']['value'] is None
   assert r['facts']['bookCapitalProxy']['value'] is None
   assert r['metrics']['bookSalesCapitalProxy']['value'] is None
   assert r['metrics']['incrementalBookSalesCapitalProxy']['value'] is None
   assert 'convertible' in r['facts']['mappedDebt']['reason']
   withheld+=1
 assert withheld==checked==7
print('review missing: capital proxies withheld')`;
 assert.match(execFileSync('python3',['-c',code],{cwd:new URL('..',import.meta.url),encoding:'utf8'}),/capital proxies withheld/);
});
