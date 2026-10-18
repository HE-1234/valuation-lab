import {reverseJointIntegration} from './joint-integration-preservation.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/report-ui-merge-v59.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Exact approved UI/application-policy reversal, before prior documentation and
// source pins. Frozen source/data bytes have no exceptions in this fixture.
export function reverseReportUIMerge(path,bytes){
 bytes=reverseJointIntegration(path,bytes);
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' reviewed documentation bytes / UI integration bytes');
 let text=bytes.toString();
 for(const part of approved.fragments){assert.equal(text.split(part.after).length-1,1,path+' exact UI integration fragment');text=text.replace(part.after,part.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' original pre-UI bytes');
 return Buffer.from(text);
}
