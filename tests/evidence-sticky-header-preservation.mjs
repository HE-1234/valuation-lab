import {reverseNvmiIntegration} from './nvmi-integration-preservation.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/evidence-sticky-header-v63.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reverseEvidenceStickyHeader(path,bytes){
 bytes=reverseNvmiIntegration(path,bytes);
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' reviewed evidence header visibility bytes / reviewed sticky evidence header bytes');
 let text=bytes.toString();
 for(const fragment of approved.fragments){assert.equal(text.split(fragment.after).length-1,1,path+' unique sticky header fragment');text=text.replace(fragment.after,fragment.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' exact V62 evidence bytes');
 return Buffer.from(text);
}
