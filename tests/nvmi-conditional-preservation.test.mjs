import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {reverseNvmiConditional} from './nvmi-conditional-preservation.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/nvmi-conditional-v65.json',import.meta.url)));
test('conditional tool reverses narrowly to exact V64 bytes and rejects unreviewed changes',()=>{
 assert.equal(fixture.baseline,'a903e389a820b9ccbb8ee8b26fc7fb485d162a18');
 assert.deepEqual(Object.keys(fixture.files),['dist/research-model.js','dist/research-simulation-view.js','dist/research-view.js']);
 for(const path of Object.keys(fixture.files)){
  const actual=fs.readFileSync(new URL('../'+path,import.meta.url));
  assert.deepEqual(reverseNvmiConditional(path,actual),execFileSync('git',['show',fixture.baseline+':'+path],{cwd:new URL('..',import.meta.url)}));
  assert.throws(()=>reverseNvmiConditional(path,Buffer.concat([actual,Buffer.from('\n/* unreviewed */')])),/exact reviewed conditional-tool bytes/);
 }
});
