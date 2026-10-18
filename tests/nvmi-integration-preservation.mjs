import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/nvmi-integration-v64.json',import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
export function reverseNvmiIntegration(path,bytes){
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' exact isolated NVMI integration bytes');
 let text=bytes.toString();for(const fragment of approved.fragments){assert.equal(text.split(fragment.after).length-1,1,path+' unique NVMI integration fragment');text=text.replace(fragment.after,fragment.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' exact V63 preserved bytes');return Buffer.from(text);
}
