import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {reverseEvidenceStickyHeader} from './evidence-sticky-header-preservation.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/evidence-sticky-header-v63.json',import.meta.url)));
test('sticky evidence header: exact V62 reversal and unrelated mutation rejection',()=>{
 assert.equal(fixture.baselineCommit,'6ce752167aef8805a84a6452e3600531aed1bafe');
 assert.deepEqual(Object.keys(fixture.files),['dist/contextual-evidence.js']);
 for(const path of Object.keys(fixture.files)){
  const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));
  assert.deepEqual(reverseEvidenceStickyHeader(path,bytes),execFileSync('git',['show',fixture.baselineCommit+':'+path],{cwd:new URL('..',import.meta.url)}));
  assert.throws(()=>reverseEvidenceStickyHeader(path,Buffer.concat([bytes,Buffer.from('\n/* unreviewed */')])),/reviewed sticky evidence header bytes/);
 }
});
