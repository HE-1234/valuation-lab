import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {reverseEvidenceHeaderVisibility} from './evidence-header-visibility-preservation.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/evidence-header-visibility-v62.json',import.meta.url)));
test('evidence header visibility: one function reverses to exact V61; unrelated changes are rejected',()=>{
 assert.equal(fixture.baselineCommit,'84bd72ab467eefcda0793c30f51041bc88ad10bd');
 assert.deepEqual(Object.keys(fixture.files),['dist/contextual-evidence.js']);
 for(const path of Object.keys(fixture.files)){
  const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));
  assert.deepEqual(reverseEvidenceHeaderVisibility(path,bytes),execFileSync('git',['show',fixture.baselineCommit+':'+path],{cwd:new URL('..',import.meta.url)}));
  assert.throws(()=>reverseEvidenceHeaderVisibility(path,Buffer.concat([bytes,Buffer.from('\n/* unreviewed */')])),/reviewed evidence header visibility bytes/);
 }
 const unchanged=Buffer.from('unchanged source data');assert.equal(reverseEvidenceHeaderVisibility('dist/data/example.json',unchanged),unchanged);
});
