// A pinned pre-v8 oracle protects numerical triangular behavior while permitting
// new distribution types and metadata. These are synthetic execution checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as legacy from './fixtures/simulation-v7-baseline.mjs';
import * as current from '../dist/simulation.js';
import {currentSnapshot,draftFor,currentIssues} from '../dist/current-model.js';
const universe=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));
const resultFields=['status','samples','rawSamples','draws','quantiles','histogram','attempts','accepted','excluded','exclusions','zeroEquityCount','mean','median','min','max'];
test('v8 QA: legacy triangular simulation fixture is byte-pinned',()=>{
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./fixtures/simulation-v7-baseline.mjs',import.meta.url))).digest('hex'),'3cfe3724ba60041e58c3dbc8a00993fb10bf1684aa4348b02ccf05b1be04ea63');
});
test('v8 QA: untyped legacy triangular configurations retain every seeded draw and DCF result',()=>{
 let cases=0;
 for(const c of universe.companies){
  const raw=c.snapshots.find(s=>s.id===c.currentSnapshotId),s=currentSnapshot(c,raw),d={...draftFor(c,raw),cutoff:universe.asOf};if(currentIssues(s,d).length)continue;
  for(const dependence of ['independent','operating-linked'])for(const variant of ['normal','invalid-wacc','zero-equity']){
   const config={...legacy.simulationDefaults(d.assumptions),trials:257,seed:'v8-legacy-'+c.ticker,dependence};
   if(variant==='invalid-wacc')config.drivers.wacc={low:.005,mode:d.assumptions.terminalGrowth,high:.05};
   const snapshot=variant==='zero-equity'?{...s,debt:1e12}:s,before=legacy.simulateCurrent(snapshot,d,config),after=current.simulateCurrent(snapshot,d,config);
   for(const key of resultFields)assert.deepEqual(after[key],before[key],`${c.ticker} ${dependence} ${variant} ${key}`);cases++;
  }
 }
 assert.equal(cases,60);
});
test('v8 QA: triangular inverse-CDF and seeded random primitives remain unchanged',()=>{
 for(const range of [{low:-.4,mode:.1,high:.9},{low:0,mode:0,high:1},{low:0,mode:1,high:1},{low:.2,mode:.2,high:.2}])for(const u of [0,1e-12,.01,.25,.5,.99,1-1e-12,1])assert.equal(current.triangularQuantile(u,range),legacy.triangularQuantile(u,range));
 for(const seed of ['valuation-lab',123,'v8-QA']){const before=legacy.createSeededRandom(seed),after=current.createSeededRandom(seed);for(let i=0;i<100;i++)assert.equal(after(),before());}
});
