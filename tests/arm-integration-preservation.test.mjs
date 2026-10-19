import {simulationUiFixture} from './claude-simulation-ui-preservation.mjs';
import {umcFixture} from './umc-integration-preservation.mjs';
import {cevaDeliveryFixture} from './ceva-delivery-preservation.mjs';
import {cevaRmbsFixture} from './ceva-rmbs-integration-preservation.mjs';
import {allocationRepairFixture,reverseCompanyAllocationRepair} from './company-allocation-repair-preservation.mjs';
import {fixture as keysFixture,reverseKeysIntegration} from './keys-integration-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {reverseArmIntegration,captureResearchSnapshot,fixture,sha} from './arm-integration-preservation.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const BASELINE='508c24877a26987b905fee55ad45ac764b83c184';
const GOLDEN_SHA256='aa75ddae44dcc2c10c37ae73f81fc0637123bdb0b386e86fea9cfac795f01b49';

test('ARM exact reviewed insertion-only hooks reverse all 603 V72 production files and reject extra mutations',()=>{
 const f=fixture();
 assert.equal(f.baselineCommit,BASELINE);
 assert.equal(f.baselineTrackedCount,1140);
 assert.equal(Object.keys(f.baselineProduction).length,603);
 assert.equal(f.outputGoldensSHA256,GOLDEN_SHA256);
 assert.equal(sha(read('tests/fixtures/arm-v72-output-goldens.json')),GOLDEN_SHA256);
 for(const[p,h]of Object.entries(f.baselineProduction))assert.equal(sha(reverseArmIntegration(p,read(p))),h,p);
 for(const[p,h]of Object.entries(f.files)){
  assert.ok(h.insertions.length,p+' insertion-only review');
  assert.equal(sha(reverseArmIntegration(p,read(p))),h.beforeSHA256,p);
  assert.ok(h.insertions.every((x,i,a)=>typeof x.text==='string'&&x.text.length&&Number.isSafeInteger(x.offset)&&x.offset>=0&&(!i||x.offset>=a[i-1].offset+a[i-1].text.length)),p+' nonoverlapping insertion spans');
  assert.throws(()=>reverseArmIntegration(p,Buffer.concat([read(p),Buffer.from('\n/* unauthorized */')])),/exact reviewed ARM integration bytes/);
 }
});

test('ARM additions retain exact reviewed hashes with no unrelated production files or raw source filings',()=>{
 const f=fixture();assert.ok(Object.keys(f.additions).length>=5);
 const root=fileURLToPath(new URL('..',import.meta.url));
 const actual=fs.readdirSync(new URL('../dist/',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(root,join(e.parentPath,e.name))).sort();
 assert.deepEqual(actual,[...Object.keys(simulationUiFixture().additions),...Object.keys(umcFixture().additions),...Object.keys(cevaDeliveryFixture().additions),...Object.keys(cevaRmbsFixture().additions),...Object.keys(allocationRepairFixture().additions),...Object.keys(f.baselineProduction),...Object.keys(f.additions),...Object.keys(keysFixture().additions)].sort(),'No unreviewed production files or raw-source additions');
 for(const[p,h]of Object.entries(f.additions)){
  assert.equal(sha(reverseKeysIntegration(p,read(p))),h,p);
  assert.match(p,/^dist\/(?:arm-|data\/incremental-ARM-2026-10-19-v2\/)/);
  assert.doesNotMatch(p,/\/raw\/|\/transcripts\//);
 }
});

test('ARM preserves all 28 V72 defaults, edits, seeded trials, restored outputs, ordering and bilingual locale keys',async()=>{
 const old=JSON.parse(read('tests/fixtures/arm-v72-output-goldens.json'));
 const actual=await captureResearchSnapshot(fileURLToPath(new URL('..',import.meta.url)));
 assert.deepEqual(actual.currentOrder,[...actual.order,'CEVA','RMBS','UMC'],'The complete current company order admits only the three explicitly reviewed later companies');
 assert.equal(old.order.length,28);assert.equal(actual.order.length,30);
 assert.deepEqual(actual.order,[...old.order,'ARM','KEYS']);
 assert.deepEqual(Object.keys(old.companies),old.order);
 assert.deepEqual(actual.companies,old.companies,'all old 28 default/edited/seeded/restored values and bilingual result rendering, including SNDK');
 for(const kind of ['localeKeys','translatedKeys'])for(const[k,v]of Object.entries(old[kind]))assert.equal(actual[kind][k],v,kind+' '+k);
 for(const locale of ['en','zh-Hans'])for(const[k,v]of Object.entries(old.locales[locale]))assert.deepEqual(actual.locales[locale][k],v,locale+' '+k);
});
