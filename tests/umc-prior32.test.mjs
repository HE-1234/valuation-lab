import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {captureV81Snapshot} from './umc-v81-snapshot.mjs';
test('UMC addition preserves all 32 V81 defaults, edits, restores, seeded trials, bilingual output and existing locale keys',async()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/umc-prior32-v81.json',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'f52742474baab8a8cf2700c1f2fab64960a67664772f116d3bd5bffcd9930da4','Immutable fixture was captured from clean cf3641e V81, never regenerated from the integrated tree');
 const old=JSON.parse(bytes),now=await captureV81Snapshot(fileURLToPath(new URL('..',import.meta.url)),old.order);
 assert.equal(old.order.length,32);assert.equal(Object.keys(old.companies).length,32);assert.ok(!old.order.includes('UMC'));
 assert.deepEqual(now.order,old.order);assert.deepEqual(now.companies,old.companies);
 for(const kind of ['localeKeys','translatedKeys'])for(const [k,v]of Object.entries(old[kind]))assert.equal(now[kind][k],v,kind+' '+k);
});
