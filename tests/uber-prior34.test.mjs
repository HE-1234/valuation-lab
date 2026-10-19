import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {captureUberBaselineSnapshot} from './uber-prior34-snapshot.mjs';
import {UBER_BASE_COMMIT} from './uber-integration-preservation.mjs';
test('UBER preserves all 34 MCD-baseline companies, exact edited/restored/seeded results and locale identities',async()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/uber-prior34-mcd-v85.json',import.meta.url));assert.equal(UBER_BASE_COMMIT,'e9b647c9bf5f5f7b57cae21e1cda10aa5428d3d1');assert.equal(createHash('sha256').update(bytes).digest('hex'),'2382972e9885d295d1fb86f80f8b04d9cbbf95be609dbfe24c549091265a6daa','Captured from clean exact MCD commit archive, not the UBER candidate');
 const before=JSON.parse(bytes);assert.equal(before.order.length,34);assert.equal(Object.keys(before.companies).length,34);assert.ok(!before.order.includes('UBER'));
 const now=await captureUberBaselineSnapshot(fileURLToPath(new URL('..',import.meta.url)),before.order);assert.deepEqual(now.order,before.order);assert.deepEqual(now.companies,before.companies);
 for(const kind of ['localeKeys','translatedKeys'])for(const[k,v]of Object.entries(before[kind]))assert.equal(now[kind][k],v,kind+' '+k);
});
