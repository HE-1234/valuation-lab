import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {reverseSndkIntegration,captureResearchSnapshot,fixture,sha} from './sndk-integration-preservation.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));

test('SNDK exact reviewed insertion-only hooks reverse every V71 production byte and reject extra mutations',()=>{
 const f=fixture();
 assert.equal(f.baselineCommit,'751b64c1260b05a80253baa89cbc67ee5d532113');
 assert.equal(f.baselineTrackedCount,1079);
 assert.equal(Object.keys(f.baselineProduction).length,550);
 for(const[p,h]of Object.entries(f.baselineProduction))assert.equal(sha(reverseSndkIntegration(p,read(p))),h,p);
 for(const[p,h]of Object.entries(f.files)){
  assert.ok(h.insertions.length,p+' insertion-only review');
  assert.equal(sha(reverseSndkIntegration(p,read(p))),h.beforeSHA256,p);
  assert.throws(()=>reverseSndkIntegration(p,Buffer.concat([read(p),Buffer.from('\n/* unauthorized */')])),/exact reviewed SNDK integration bytes/);
 }
});

test('SNDK additions retain exact reviewed hashes and exclude raw source filings',()=>{
 const f=fixture();assert.ok(Object.keys(f.additions).length>=5);
 const root=fileURLToPath(new URL('..',import.meta.url));
 const actual=fs.readdirSync(new URL('../dist/',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(root,join(e.parentPath,e.name))).sort();
 assert.deepEqual(actual,[...Object.keys(f.baselineProduction),...Object.keys(f.additions)].sort(),'No unreviewed production files or raw-source additions');
 for(const[p,h]of Object.entries(f.additions)){assert.equal(sha(read(p)),h,p);assert.doesNotMatch(p,/\/raw\/|\/transcripts\//);}
});

test('SNDK preserves all 27 original defaults, edits, seeded trials, restored outputs, ordering and locale keys',async()=>{
 const old=JSON.parse(read('tests/fixtures/sndk-v71-output-goldens.json'));
 const actual=await captureResearchSnapshot(fileURLToPath(new URL('..',import.meta.url)));
 assert.equal(old.order.length,27);assert.equal(actual.order.length,28);
 assert.deepEqual(actual.order,[...old.order,'SNDK']);
 assert.deepEqual(actual.companies,old.companies,'all old 27 default/edited/seeded/restored values and bilingual result rendering');
 for(const kind of ['localeKeys','translatedKeys'])for(const[k,v]of Object.entries(old[kind]))assert.equal(actual[kind][k],v,kind+' '+k);
 for(const locale of ['en','zh-Hans'])for(const[k,v]of Object.entries(old.locales[locale]))assert.deepEqual(actual.locales[locale][k],v,locale+' '+k);
});
