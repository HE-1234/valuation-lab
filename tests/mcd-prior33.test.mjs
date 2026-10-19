import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {captureMcdBaselineSnapshot} from './mcd-prior33-snapshot.mjs';
import {MCD_BASE_COMMIT} from './mcd-integration-preservation.mjs';
test('MCD preserves all 33 final-UI-baseline companies, exact edited/restored/seeded results and locale identities',async()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/mcd-prior33-final-ui.json',import.meta.url));assert.equal(MCD_BASE_COMMIT,'623c06999d68a162202db636dc230dc88dc68866');assert.equal(createHash('sha256').update(bytes).digest('hex'),'3db482b9f3e4e3d80e8465be95842cada5684c35421654f63a3c6beb521fc74f','Captured from clean exact V85 archive, not the MCD candidate');
 const before=JSON.parse(bytes);assert.equal(before.order.length,33);assert.equal(Object.keys(before.companies).length,33);assert.ok(!before.order.includes('MCD'));
 const now=await captureMcdBaselineSnapshot(fileURLToPath(new URL('..',import.meta.url)),before.order);assert.deepEqual(now.order,before.order);assert.deepEqual(now.companies,before.companies);
 for(const kind of ['localeKeys','translatedKeys'])for(const[k,v]of Object.entries(before[kind]))assert.equal(now[kind][k],v,kind+' '+k);
});
