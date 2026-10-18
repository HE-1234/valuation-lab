import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/camt-integration-v67.json',import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
export function reverseCamtIntegration(path,bytes){
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 let text=bytes.toString();for(const fragment of approved.fragments){assert.equal(text.split(fragment.after).length-1,1,path+' unique CAMT integration fragment');text=text.replace(fragment.after,fragment.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' exact pre-CAMT preserved bytes');return Buffer.from(text);
}
