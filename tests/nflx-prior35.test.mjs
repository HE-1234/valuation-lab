import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {captureNflxBaselineSnapshot} from './nflx-prior35-snapshot.mjs';
import {NFLX_BASE_COMMIT} from './nflx-integration-preservation.mjs';
test('NFLX preserves all 35 MCD/Uber-baseline companies, exact edited/restored/seeded results and locale identities',async()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/nflx-prior35-mcd-uber-v85.json',import.meta.url));assert.equal(NFLX_BASE_COMMIT,'28b4ee8560425337c92e75e2a053264ced7e2c43');assert.equal(createHash('sha256').update(bytes).digest('hex'),'f0f50f1c6eaa430d3abda8b59ef0bd050674c1be438d645536610d101466fa22','Captured from clean exact MCD/Uber commit snapshot, not the NFLX candidate');
 const before=JSON.parse(bytes);assert.equal(before.order.length,35);assert.equal(Object.keys(before.companies).length,35);assert.ok(!before.order.includes('NFLX'));
 const now=await captureNflxBaselineSnapshot(fileURLToPath(new URL('..',import.meta.url)),before.order);assert.deepEqual(now.order,before.order);assert.deepEqual(now.companies,before.companies);
 for(const kind of ['localeKeys','translatedKeys'])for(const[k,v]of Object.entries(before[kind]))assert.equal(now[kind][k],v,kind+' '+k);
});
