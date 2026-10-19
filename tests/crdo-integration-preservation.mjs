import {reverseSndkIntegration} from './sndk-integration-preservation.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/crdo-integration-v71.json',import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
export function reverseCrdoIntegration(path,bytes){
 bytes=reverseSndkIntegration(path,bytes);
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 const before=Buffer.from(approved.beforeText);assert.equal(sha(before),approved.beforeSHA256,path+' exact V70 preserved bytes');return before;
}
