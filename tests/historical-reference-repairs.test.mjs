import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const baselineText=path=>execFileSync('git',['show','e427d6b:'+path],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
import {normalizeCompany,valueCompany,defaults,eligibleSnapshots} from '../dist/engine.js';
import {repairHistoricalAnnualReferences as repair} from '../dist/historical-reference-repairs.js';
const root=new URL('..',import.meta.url).pathname;
const raw=JSON.parse(fs.readFileSync(root+'dist/data/companies.json'));
const normalize=t=>normalizeCompany(raw.companies.find(x=>x.ticker===t));
for(const [ticker,field,value] of [['AMZN','availableFrom','2026-02-06T00:00:00Z'],['COHR','ebit',897.861],['FN','debt',0]]){
 test(`${ticker}: repair exact reference, calculate, preserve raw and eligibility`,()=>{
  const before=normalize(ticker),bytes=JSON.stringify(before),out=repair(before),s=out.snapshots[0];
  assert.equal(s[field],value);assert.equal(JSON.stringify(before),bytes);assert.equal(s.raw,before.snapshots[0].raw);
  assert.equal(s.backtestEligible,false);assert.equal(eligibleSnapshots([s],'2026-10-19').length,0);
  const r=valueCompany({...s,provisionalBridge:true},defaults);assert.ok(Number.isFinite(r.enterprise));assert.ok(Number.isFinite(r.perShare));assert.ok(s.referenceRepair.disclosure.includes('reference')||s.referenceRepair.disclosure.includes('source-derived'));
  assert.deepEqual(repair(out),out,'idempotent overlay');
 });
 test(`${ticker}: do not overwrite edited fields, wrong sources, periods or eligible cases`,()=>{
  for(const change of [{sourceUrl:'https://example.com/'},{periodEnd:'2020-01-01'},{backtestEligible:true},{snapshotMode:'annual'}, {[field]:field==='availableFrom'?'2026-02-07T00:00:00Z':123}]){
   const c=normalize(ticker);Object.assign(c.snapshots[0],change);assert.deepEqual(repair(c),c);
  }
  const c=normalize(ticker);c.snapshots[0].raw={...c.snapshots[0].raw,accession:'different'};assert.deepEqual(repair(c),c);
 });
}
test('all unrelated and frozen historical snapshots are identical',()=>{
 for(const c of raw.companies){if(['AMZN','COHR','FN'].includes(c.ticker))continue;const n=normalizeCompany(c);assert.deepEqual(repair(n),n);}
});
test('COHR overlay matches reviewed same-accession derived subtotal and keeps classification',()=>{
 const u=JSON.parse(fs.readFileSync(root+'dist/data/current-universe.json'));
 const source=u.companies.find(c=>c.ticker==='COHR').snapshots.find(s=>s.id==='COHR-CURRENT-2026-06-30');
 const s=repair(normalize('COHR')).snapshots[0];assert.ok(Math.abs(s.ebit-source.facts.operatingIncome)<1e-9);assert.equal(s.sourceUrl,source.sourceUrl);assert.match(s.referenceRepair.disclosure,/not a separately reported/);
});
test('FN zero is explicitly source reviewed, never generic null coercion',()=>{
 const b=JSON.parse(fs.readFileSync(root+'dist/data/incremental-FN-2026-10-18-v1/cases.json'));
 const h=b.companies[0].history.find(r=>r.fiscal_end==='2026-06-26');
 for(const k of ['debt_current','debt_noncurrent']){assert.equal(h.values[k],0);assert.match(h.provenance[k].method,/manual statement audit/);assert.equal(h.provenance[k].source_url,repair(normalize('FN')).snapshots[0].sourceUrl);}
});
test('app exact reversal reproduces canonical bytes, and only shipped fetch is patched',()=>{
 const original=baselineText('dist/app.js');const modified=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const reversed=modified.replace("${selected.referenceRepair?' '+appMark(selected.referenceRepair.disclosure):''}",'').replace("import {repairHistoricalAnnualReferences} from './historical-reference-repairs.js';\n",'').replace('const normalized=repairHistoricalAnnualReferences(normalizeCompany(c));companies.push(normalized)','const normalized=normalizeCompany(c);companies.push(normalized)');
 assert.equal(reversed.replace("table(['Reported revenue',selected.referenceRepair?.field==='ebit'?'Derived operating subtotal':'Reported EBIT','Cash / securities'","table(['Reported revenue','Reported EBIT','Cash / securities'"),original);assert.equal((modified.match(/repairHistoricalAnnualReferences\(normalizeCompany\(c\)\)/g)||[]).length,1);
});


test('all added disclosures and labels have Chinese catalogs and locale changes preserve economics',async()=>{
 const en=(await import('../dist/locales/historical-app.en.js')).default;
 const zh=(await import('../dist/locales/historical-app.zh-Hans.js')).default;
 const {registerCatalog,setLocale,t}=await import('../dist/i18n.js');
 registerCatalog('repair-test',{en,'zh-Hans':zh});
 const texts=['Derived operating subtotal',...['AMZN','COHR','FN'].map(x=>repair(normalize(x)).snapshots[0].referenceRepair.disclosure)];
 const originals=['AMZN','COHR','FN'].map(x=>repair(normalize(x)));const before=JSON.stringify(originals);
 try{for(const text of texts){const key=Object.keys(en).find(k=>en[k]===text);assert.ok(key);assert.match(zh[key],/[\u3400-\u9fff]/);setLocale('zh-Hans');assert.equal(t('repair-test.'+key),zh[key]);setLocale('en');assert.equal(t('repair-test.'+key),text);}assert.equal(JSON.stringify(originals),before);}finally{setLocale('en');}
});
test('locales preserve every original key and only add four reviewed entries each',async()=>{
 for(const lang of ['en','zh-Hans']){const prior=(await import('data:text/javascript;base64,'+Buffer.from(baselineText('dist/locales/historical-app.'+lang+'.js')).toString('base64'))).default;const now=(await import('../dist/locales/historical-app.'+lang+'.js')).default;for(const key of Object.keys(prior))assert.equal(now[key],prior[key]);assert.equal(Object.keys(now).length,Object.keys(prior).length+4);}
});
