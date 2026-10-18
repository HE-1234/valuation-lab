import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/joint-integration-v60.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Exact reviewed joint integration and bounded accessibility repair layer.
// Every prior UI, help, financial-source and methodology pin remains unchanged.
export function reverseJointIntegration(path,bytes){
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' reviewed documentation bytes / joint integration bytes');
 let text=bytes.toString();
 for(const part of approved.fragments){assert.equal(text.split(part.after).length-1,1,path+' exact joint integration fragment');text=text.replace(part.after,part.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' original post-UI bytes');
 return Buffer.from(text);
}
