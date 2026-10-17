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
 const code=`import importlib.util,pathlib,sys\nsys.argv=['scripts/build-company-history.py']\nspec=importlib.util.spec_from_file_location('history','scripts/build-company-history.py')\nm=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\nexists=pathlib.Path.exists\npathlib.Path.exists=lambda p: False if p.name=='aaoi-history-debt-review.json' else exists(p)\nc=m.build_company('AAOI')\nfor r in c['annual']:\n if r['period']>='FY2019':\n  assert r['facts']['mappedDebt']['value'] is None\n  assert r['facts']['bookCapitalProxy']['value'] is None\n  assert r['metrics']['bookSalesCapitalProxy']['value'] is None\n  assert r['metrics']['incrementalBookSalesCapitalProxy']['value'] is None\n  assert 'convertible' in r['facts']['mappedDebt']['reason']\nprint('review missing: capital proxies withheld')`;
 assert.match(execFileSync('python3',['-c',code],{cwd:new URL('..',import.meta.url),encoding:'utf8'}),/capital proxies withheld/);
});
