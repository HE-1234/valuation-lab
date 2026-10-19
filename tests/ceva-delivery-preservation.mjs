// Exact one-path CEVA fetch-delivery repair. Apply before the combined
// CEVA/RMBS integration reversal. Frozen source cases remain unchanged.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const CEVA_DELIVERY_BASE_COMMIT='d31694146f49f35f9dc4f14c8754fd4f033cf073';
export const CEVA_DELIVERY_MODIFIED_PATH='dist/incremental-research.js';
export const CEVA_DELIVERY_ADDED_PATH='dist/data/incremental-CEVA-2026-10-19-v3/reviewed-package.json';
export const cevaDeliverySHA=bytes=>createHash('sha256').update(bytes).digest('hex');
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const hash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const productionPath=x=>typeof x==='string'&&x.startsWith('dist/')&&!x.includes('\\')&&!x.includes('\0')&&x.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
const REVIEWED_ERROR=' exact reviewed CEVA delivery fix bytes; exact reviewed CEVA/RMBS integration bytes; exact reviewed company allocation repair bytes; exact reviewed reality-check fix bytes; exact reviewed Claude UI merge bytes; exact reviewed KEYS integration bytes; exact reviewed annual field errors bytes; exact reviewed ARM integration bytes; exact reviewed SNDK integration bytes; exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes';
export function validateCevaDeliveryFixture(fixture){
 assert.ok(exact(fixture,['baseCommit','files','additions']),'CEVA delivery fixture requires only baseCommit, files and additions');
 assert.equal(fixture.baseCommit,CEVA_DELIVERY_BASE_COMMIT,'CEVA delivery fixture must pin the exact V80 commit');
 assert.ok(exact(fixture.files,[CEVA_DELIVERY_MODIFIED_PATH]),'CEVA delivery fixture permits only the exact incremental-research.js modification');
 assert.ok(exact(fixture.additions,[CEVA_DELIVERY_ADDED_PATH]),'CEVA delivery fixture permits only the exact reviewed-package.json addition');
 for(const [path,item]of Object.entries(fixture.files)){
  assert.ok(productionPath(path),path+' must be an exact normalized dist path');
  assert.ok(exact(item,['beforeText','beforeSHA256','afterSHA256']),path+' requires only beforeText and exact before/after hashes');
  assert.ok(typeof item.beforeText==='string'&&hash(item.beforeSHA256)&&hash(item.afterSHA256),path+' requires finite text and SHA256 values');
  assert.equal(cevaDeliverySHA(Buffer.from(item.beforeText,'utf8')),item.beforeSHA256,path+' exact V80 original bytes');
  assert.notEqual(item.beforeSHA256,item.afterSHA256,path+' must be an actual modification, not an allowlist');
  assert.ok(!own(fixture.additions,path),path+' cannot be both modified and added');
 }
 for(const [path,sha]of Object.entries(fixture.additions)){assert.ok(productionPath(path),path+' must be an exact normalized dist path');assert.ok(hash(sha),path+' requires one exact added-file SHA256');}
 return fixture;
}
let cachedFixture;
export function cevaDeliveryFixture(){
 if(!cachedFixture){const value=validateCevaDeliveryFixture(JSON.parse(fs.readFileSync(new URL('./fixtures/ceva-delivery-v80.json',import.meta.url),'utf8')));for(const item of Object.values(value.files))Object.freeze(item);Object.freeze(value.files);Object.freeze(value.additions);cachedFixture=Object.freeze(value);}
 return cachedFixture;
}
export function reverseCevaDelivery(path,bytes){
 const fixture=cevaDeliveryFixture();
 if(own(fixture.files,path)){
  const f=fixture.files[path];assert.equal(cevaDeliverySHA(bytes),f.afterSHA256,path+REVIEWED_ERROR);
  const before=Buffer.from(f.beforeText,'utf8');assert.equal(cevaDeliverySHA(before),f.beforeSHA256,path+' exact V80 original bytes');return before;
 }
 if(own(fixture.additions,path))assert.equal(cevaDeliverySHA(bytes),fixture.additions[path],path+REVIEWED_ERROR+'; exact reviewed CEVA delivery addition bytes; exact reviewed CEVA/RMBS addition bytes');
 // Unchanged paths continue through older preservation layers. The companion
 // whole-tree test proves these bytes still equal the pinned V80 tree.
 return bytes;
}
