import {allocationRepairFixture,reverseCompanyAllocationRepair} from './company-allocation-repair-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative,join} from 'node:path';
import {reverseKeysIntegration,captureResearchSnapshot,fixture,sha} from './keys-integration-preservation.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
test('KEYS exact insertion reversal preserves all approved prior production and six themes',()=>{
 const f=fixture();assert.equal(f.baselineCommit,'c111ab35851fc2e89271b3312e42dd28ddae4a9c');
 for(const[p,h]of Object.entries(f.baselineProduction))assert.equal(sha(reverseKeysIntegration(p,read(p))),h,p);
 for(const[p,h]of Object.entries(f.files)){assert.ok(h.insertions.length);assert.throws(()=>reverseKeysIntegration(p,Buffer.concat([read(p),Buffer.from('\n/* unauthorized */')])),/exact reviewed KEYS/);}
 assert.equal(sha(read('tests/fixtures/keys-v74-output-goldens.json')),f.outputGoldensSHA256);
});
test('KEYS package contains only reviewed additive production and no raw corporate originals',()=>{
 const f=fixture(),root=fileURLToPath(new URL('..',import.meta.url));
 const actual=fs.readdirSync(new URL('../dist/',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(root,join(e.parentPath,e.name))).sort();
 assert.deepEqual(actual,[...Object.keys(allocationRepairFixture().additions),...Object.keys(f.baselineProduction),...Object.keys(f.additions)].sort());
 for(const[p,h]of Object.entries(f.additions)){assert.equal(sha(read(p)),h,p);assert.match(p,/^dist\/(?:keys-|data\/incremental-KEYS-)/);assert.doesNotMatch(p,/\/raw\/|\/transcripts\/|keys-20\d{6}\.htm/);}
});
test('KEYS preserves all 29 earlier defaults, edits, seeded trials, restores, bilingual output and ordering',async()=>{
 const old=JSON.parse(read('tests/fixtures/keys-v74-output-goldens.json'));
 const actual=await captureResearchSnapshot(fileURLToPath(new URL('..',import.meta.url)));
 assert.equal(old.order.length,29);assert.deepEqual(actual.order,[...old.order,'KEYS']);assert.deepEqual(actual.companies,old.companies);
 for(const kind of ['localeKeys','translatedKeys'])for(const[k,v]of Object.entries(old[kind]))assert.equal(actual[kind][k],v,kind+' '+k);
 for(const locale of ['en','zh-Hans'])for(const[k,v]of Object.entries(old.locales[locale]))assert.deepEqual(actual.locales[locale][k],v,locale+' '+k);
});
