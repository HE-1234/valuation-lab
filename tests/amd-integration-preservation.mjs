import {reverseUserUiIntegration} from './user-ui-integration-preservation.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/amd-integration-v69.json',import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
export function reverseAmdIntegration(path,bytes){
 bytes=reverseUserUiIntegration(path,bytes);
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 let text=bytes.toString();for(const f of approved.fragments){assert.equal(text.split(f.after).length-1,1,path+' unique AMD integration fragment');text=text.replace(f.after,f.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' exact V68 bytes');return Buffer.from(text);
}
