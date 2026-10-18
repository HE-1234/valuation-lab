import {reverseEvidenceStickyHeader} from './evidence-sticky-header-preservation.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/evidence-header-visibility-v62.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Reverse only the exact reviewed revealHeader function before all prior pins.
// Whole-file hashes reject unrelated edits even outside the reviewed function.
export function reverseEvidenceHeaderVisibility(path,bytes){
 bytes=reverseEvidenceStickyHeader(path,bytes);
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' reviewed evidence header visibility bytes');
 const text=bytes.toString();assert.equal(text.split(approved.after).length-1,1,path+' unique evidence header function');
 const original=text.replace(approved.after,approved.before);
 assert.equal(sha(original),approved.beforeSHA256,path+' exact V61 evidence bytes');
 return Buffer.from(original);
}
