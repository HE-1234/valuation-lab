import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const svcoFixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/svco-research-only-v75.json',import.meta.url)));
export const svcoSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reverseSVCOResearch(path,bytes){
 const f=svcoFixture().files[path];if(!f)return bytes;
 assert.equal(svcoSHA(bytes),f.afterSHA256,path+' exact reviewed SVCO research-only bytes');
 let text=bytes.toString();for(const span of [...f.spans].reverse()){assert.equal(text.slice(span.offset,span.offset+span.after.length),span.after);text=text.slice(0,span.offset)+span.before+text.slice(span.offset+span.after.length);}
 assert.equal(svcoSHA(text),f.beforeSHA256,path+' exact V75 baseline');return Buffer.from(text);
}
