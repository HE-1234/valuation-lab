import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const fieldErrorFixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/annual-field-errors-v73.json',import.meta.url)));
export const fieldErrorSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reverseAnnualFieldErrors(path,bytes){
 const approved=fieldErrorFixture().files[path];if(!approved)return bytes;
 assert.equal(fieldErrorSHA(bytes),approved.afterSHA256,path+' exact reviewed annual field errors bytes; exact reviewed ARM integration bytes; exact reviewed SNDK integration bytes; exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 let text=bytes.toString();
 for(const span of [...approved.insertions].reverse()){assert.equal(text.slice(span.offset,span.offset+span.text.length),span.text,path+' exact field feedback insertion');text=text.slice(0,span.offset)+text.slice(span.offset+span.text.length);}
 assert.equal(fieldErrorSHA(text),approved.beforeSHA256,path+' exact V73 bytes');return Buffer.from(text);
}
