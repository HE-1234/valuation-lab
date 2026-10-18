import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reverseReportUIMerge} from './report-ui-merge-preservation.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/simulation-help-navigation-v59.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Exact copy-only reversal before all older release/source preservation checks.
// A reviewed hash and unique fragments reject every additional change.
export function reverseSimulationHelpNavigation(path,bytes){
 bytes=reverseReportUIMerge(path,bytes);
 const approved=fixture.files[path];if(!approved)return bytes;
 assert.equal(sha(bytes),approved.afterSHA256,path+' reviewed documentation bytes (help navigation)');
 let text=bytes.toString();
 for(const part of approved.fragments){assert.equal(text.split(part.after).length-1,1,path+' exact help navigation fragment');text=text.replace(part.after,part.before);}
 assert.equal(sha(text),approved.beforeSHA256,path+' original help navigation bytes');
 return Buffer.from(text);
}
