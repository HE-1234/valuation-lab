import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/simulation-methodology-v58.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Only exact reviewed documentation fragments can be reversed. Hashes reject
// additional changes to these pages/catalogs; every other file passes unchanged.
export function reverseMethodologyDocumentation(path,bytes){
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' reviewed documentation bytes');
 let text=bytes.toString();
 for(const part of approved.fragments){assert.equal(text.split(part.after).length-1,1,path+' exact documentation fragment');text=text.replace(part.after,part.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' original documentation bytes');
 return Buffer.from(text);
}
