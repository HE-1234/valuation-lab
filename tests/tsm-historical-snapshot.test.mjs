import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {historicalTsmSnapshotStorage} from './tsm-historical-snapshot.mjs';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {withTsmDatedConversion} from '../dist/tsm-dated-conversion.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {TSM_RECEIPT_REVIEW} from '../dist/tsm-receipt-correction.js';
const root=fileURLToPath(new URL('..',import.meta.url)),key='valuation-lab-annual-research-v1:TSM';
const withoutStamp=d=>{const x=structuredClone(d);delete x.updatedAt;return x;};
const bridge=d=>{const o=calculateResearchOperating(d),t=researchTimingResult(d,o);return withTsmDatedConversion(d,calculateResearchBridge(d,t.enterprise,{...d.bridgeInputs,calculationDate:t.date}));};
test('historical TSM setup adds only the exact frozen saved draft and never overwrites supplied cases',async()=>{
 const original=new Map([['unrelated','exact bytes']]),storage=await historicalTsmSnapshotStorage(root,original);
 assert.deepEqual([...original],[['unrelated','exact bytes']]);assert.equal(storage.size,2);assert.equal(storage.get('unrelated'),'exact bytes');
 await assert.rejects(()=>historicalTsmSnapshotStorage(root,storage),/must not overwrite/);
 const saved=JSON.parse(storage.get(key)),w=await startResearchWorkspace({storage});w.choose('TSM');assert.deepEqual(w.getState().draft,saved);w.destroy();
});
test('fresh TSM differs from the historical contract only by the reviewed receipt amount and provenance',async()=>{
 const storage=await historicalTsmSnapshotStorage(root),old=JSON.parse(storage.get(key)),w=await startResearchWorkspace();w.choose('TSM');const current=w.getState().draft;
 assert.deepEqual(withoutStamp(current),withoutStamp({...old,bridgeInputs:{...old.bridgeInputs,customerReceiptClaim:189858.2},tsmReceiptReview:structuredClone(TSM_RECEIPT_REVIEW)}));
 assert.deepEqual(calculateResearchOperating(current),calculateResearchOperating(old));
 const before=bridge(old),after=bridge(current);
 assert.equal(before.perShare,1903.480375477332);assert.equal(after.perShare,1907.3845710657938);assert.equal(after.datedADSConversion.perADS,299.1506541822136);
 assert.equal(after.operatingEV,before.operatingEV);assert.equal(after.allocationShares,before.allocationShares);assert.equal(after.rows.find(x=>x.id==='customerReceiptClaim').amount,189858.2);
 for(const [seed,trials,lowSD] of [['V71-preservation-TSM',9,true],['V72-preservation-TSM',9,true],['V73-KEYS-preservation-TSM',9,true],['V79-preservation-TSM',3,false]]){
  const config={...structuredClone(old.researchSimulationConfig),seed,trials};if(lowSD)config.jointAnnual.annualPath.innovationSD=.005;
  const a=simulateResearch(old,config),b=simulateResearch(current,config);assert.deepEqual(b.draws,a.draws);assert.deepEqual(b.exclusions,a.exclusions);assert.equal(b.accepted,a.accepted);
  for(let i=0;i<a.scenarios.length;i++){
   const x=a.scenarios[i],y=b.scenarios[i],omit=v=>{const c=structuredClone(v);for(const k of ['equity','perShare','rawPerShare','claims'])delete c[k];return c;};
   assert.deepEqual(omit(y),omit(x));assert.equal(y.claims.claimTotal,1302190.2);assert.equal(y.claims.assetTotal,x.claims.assetTotal);assert.equal(y.claims.allocationShares,x.claims.allocationShares);assert.equal(y.claims.warrantClaim,x.claims.warrantClaim);
   assert.equal(y.equity,y.enterprise+y.claims.assetTotal-y.claims.claimTotal);assert.equal(y.perShare,y.equity/y.claims.allocationShares);assert.equal(y.rawPerShare,y.perShare);
  }
 }
 w.destroy();
});
test('snapshot reconciliation changes only explicit TSM setup; all eight historical assertions remain exact',()=>{
 const git=p=>execFileSync('git',['show','281aecb598ca2153836b10dbc78b6b10765e0e25:'+p],{cwd:root,encoding:'utf8',maxBuffer:8e6});
 for(const name of ['arm-integration-preservation','keys-integration-preservation','sndk-integration-preservation','ceva-rmbs-prior30','umc-prior32','mcd-prior33','uber-prior34','nflx-prior35']){
  const p='tests/'+name+'.test.mjs';assert.equal(fs.readFileSync(root+p,'utf8'),git(p),p);
 }
 for(const name of ['arm-integration-preservation.mjs','keys-integration-preservation.mjs','sndk-integration-preservation.mjs','ceva-v79-snapshot.mjs','umc-v81-snapshot.mjs']){
  const p='tests/'+name,s=fs.readFileSync(root+p,'utf8').replace("import {historicalTsmSnapshotStorage} from './tsm-historical-snapshot.mjs';\n",'').replace('const storage=await historicalTsmSnapshotStorage(root);','const storage=new Map();').replace('startResearchWorkspace({storage:await historicalTsmSnapshotStorage(root),catalogBundle:','startResearchWorkspace({catalogBundle:');assert.equal(s,git(p),p+' no other snapshot logic changed');
 }
});
