// A pinned pre-v7 numerical oracle: narrow provisional-bridge gate changes may
// not alter historical arithmetic, eligibility, locks or price outcomes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as before from './fixtures/engine-v6-baseline.mjs';
import * as after from '../dist/engine.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data/companies.json',import.meta.url)));
const snapshots=data.companies.flatMap(c=>before.normalizeCompany(c).snapshots);
const capture=fn=>{try{return {result:fn()}}catch(error){return {error:error.message}}};

test('v7 QA: pre-redesign engine oracle is byte-pinned and every original source normalizes identically',()=>{
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./fixtures/engine-v6-baseline.mjs',import.meta.url))).digest('hex'),'204f6e64ed22a46a2192ddcfde9b275d3af5090e0d3a9bf10034c6a527fb6a48');
 for(const c of data.companies)assert.deepEqual(after.normalizeCompany(c),before.normalizeCompany(c),c.ticker);
});
test('v7 QA: every historical/annual snapshot retains exact ten-year rows, terminal value and claim arithmetic',()=>{
 const variants=[before.defaults,{...before.defaults,growth:0,targetMargin:.15,tax:0,terminalGrowth:0,otherAssets:50,otherClaims:20},{...before.defaults,growth:-.3,targetMargin:0,salesCapital:1,wacc:.12,terminalGrowth:0},{...before.defaults,years:3,yearlyOverrides:[{growth:.1,margin:-.1,taxRate:.25,salesCapital:2,wacc:.08},{growth:.2,margin:.1,taxRate:.2,salesCapital:3,wacc:.1},{growth:.05,margin:.2,taxRate:.3,salesCapital:1.5,wacc:.11}]}];
 let checked=0;
 for(const snapshot of snapshots)for(const assumptions of variants){const s={...snapshot,bridgeReviewed:true};assert.deepEqual(capture(()=>after.valueCompany(s,assumptions)),capture(()=>before.valueCompany(s,assumptions)),`${s.ticker} ${s.periodEnd}`);checked++;}
 assert.equal(checked,56);
});
test('v7 QA: all five frozen research cases retain exact prior mathematical results',()=>{
 for(const file of ['MSFT-FY2019-frozen-v1.json','NVDA-FY2021-frozen.json','NVDA-FY2022-frozen.json','NVDA-FY2023-frozen.json','NVDA-FY2024-frozen.json']){
  const frozen=JSON.parse(fs.readFileSync(new URL('../dist/data/research-versions/'+file,import.meta.url)));
  const snapshot=frozen.snapshot||snapshots.find(s=>s.raw.id===frozen.snapshotId);
  const assumptions=frozen.case?.assumptions||frozen.assumptions;
  assert.ok(snapshot,file);assert.deepEqual(after.valueCompany(snapshot,assumptions),before.valueCompany(snapshot,assumptions),file);
 }
});
test('v7 QA: original date eligibility and validation are unaffected by provisional presentation',()=>{
 for(const snapshot of snapshots){assert.deepEqual(after.validateSnapshot(snapshot),before.validateSnapshot(snapshot));for(const cutoff of ['2010-01-01','2020-01-01','2024-03-01','2026-10-17','2030-01-01'])assert.deepEqual(after.eligibleSnapshots([snapshot],cutoff),before.eligibleSnapshots([snapshot],cutoff),snapshot.ticker+' '+cutoff);}
});
test('v7 QA: the only engine source change is the explicit provisional-bridge context',()=>{
 const old=fs.readFileSync(new URL('./fixtures/engine-v6-baseline.mjs',import.meta.url),'utf8'),now=fs.readFileSync(new URL('../dist/engine.js',import.meta.url),'utf8');assert.equal(now.replace('&&!s.provisionalBridge',''),old);
 const snapshot=snapshots.find(s=>s.snapshotMode==='annual-reference'&&before.validateSnapshot(s).length===0);
 assert.throws(()=>after.valueCompany(snapshot,after.defaults),/bridge/i);const provisional={...snapshot,provisionalBridge:true};assert.equal(provisional.bridgeReviewed,undefined);assert.deepEqual(after.valueCompany(provisional,after.defaults),before.valueCompany({...snapshot,bridgeReviewed:true},before.defaults));assert.throws(()=>after.valueCompany({...provisional,debt:null},after.defaults),/finite number/);
});
