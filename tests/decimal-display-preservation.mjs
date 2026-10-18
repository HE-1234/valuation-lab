import {reverseEvidenceHeaderVisibility} from './evidence-header-visibility-preservation.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/decimal-display-v61.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Reverse only the reviewed numeric-presentation fragments, before every older
// pin. No source/model bytes or historical baseline hashes are refreshed.
export function reverseDecimalDisplay(path,bytes){
 bytes=reverseEvidenceHeaderVisibility(path,bytes);
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' reviewed documentation bytes / numeric presentation bytes');
 let text=bytes.toString();
 for(const part of approved.fragments){assert.equal(text.split(part.after).length-1,1,path+' exact numeric presentation fragment');text=text.replace(part.after,part.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' exact V60 bytes');
 return Buffer.from(text);
}
