import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchDraftFor,calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
const c=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies[0];
test('annual numerical boundary: finite but overflowing edits fail closed instead of exposing nonfinite values',()=>{
 for(const mutate of [d=>{d.annual[0].revenue=1.7e308;d.annual[0].margin=1;d.annual[0].reinvestment=-1.7e308},d=>{d.annual.at(-1).revenue=1.79e308;d.terminal.growth=.05},d=>{d.anchor.revenue=Number.MIN_VALUE}]){
  const d=researchDraftFor(c);mutate(d);assert.throws(()=>calculateResearchOperating(d),/finite numerical range/);
 }
});

test('annual timing boundary: overflow with an explicit finite stub withholds only the as-of scenario',()=>{
 const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
 for(const ticker of ['AAPL','AAOI']){
  const d=researchDraftFor(cases.find(x=>x.ticker===ticker));d.timing.mode='as-of-scenario';d.timing.reason='Deliberately extreme numerical test';d.timing.stubFCFF=ticker==='AAPL'?-1.7e308:1.7e308;
  const result=researchTimingResult(d,{enterprise:1.7e308});assert.equal(result.status,'incomplete');assert.equal(result.enterprise,null);assert.match(result.message,/finite numerical range/);assert.ok(Number.isFinite(calculateResearchOperating(d).enterprise),'original operating value stays computable');
 }
});
