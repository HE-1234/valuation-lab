import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/user-ui-integration-v70.json',import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
export function reverseUserUiIntegration(path,bytes){
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' exact reviewed user UI integration bytes');
 const before=Buffer.from(approved.beforeText);
 assert.equal(sha(before),approved.beforeSHA256,path+' exact V69 bytes');
 return before;
}
