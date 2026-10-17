// Independent v7 model and migration checks. No browser-rendering claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentSnapshot,draftFor,safeDraft,currentIssues,calculateCurrent,quoteComparison,freezeCurrent} from '../dist/current-model.js';
import {simulateCurrent} from '../dist/simulation.js';
const universe=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));
const company=universe.companies.find(c=>c.ticker==='AAPL');
const raw=company.snapshots.find(s=>s.id===company.currentSnapshotId);
const snapshot=currentSnapshot(company,raw);
const fresh=()=>({...draftFor(company,raw),cutoff:universe.asOf});
const priced=()=>({...fresh(),quote:{price:150,date:'2026-10-16',currency:snapshot.currency,sourceUrl:'https://example.com/quote',shareBasis:snapshot.shareBasis}});

test('v7 QA: fresh and migrated unreviewed drafts calculate identically without inventing assent',()=>{
 const d=fresh();assert.equal(d.modelReviewed,false);assert.equal(d.bridgeReviewed,false);assert.deepEqual(currentIssues(snapshot,d),[]);
 const v=calculateCurrent(snapshot,d);const migrated=safeDraft({...d,step:0,reviewed:[],modelReviewed:false,bridgeReviewed:false},company,raw);
 assert.deepEqual(calculateCurrent(snapshot,migrated),v);
 const frozen=freezeCurrent(snapshot,d);assert.equal(frozen.draft.modelReviewed,false);assert.equal(frozen.draft.bridgeReviewed,false);
 assert.equal(frozen.snapshot.raw.id,raw.id);
});
test('v7 QA: old quote-confirmation boolean alone cannot authorize price comparison',()=>{
 const d=priced(),value=calculateCurrent(snapshot,d);
 assert.equal(quoteComparison(snapshot,d,value).status,'ready');
 for(const q of [{...d.quote,shareBasis:''},{...d.quote,shareBasis:undefined},{...d.quote,shareBasis:'ADR of another company'}]){
  const migrated=safeDraft({...d,quote:{...q,basisConfirmed:true}},company,raw);
  assert.equal(quoteComparison(snapshot,migrated,value).status,'blocked');
  assert.equal(simulateCurrent(snapshot,migrated,{trials:3}).quote.status,'blocked');
 }
 assert.equal(quoteComparison(snapshot,{...d,quote:{...d.quote,basisConfirmed:false}},value).status,'ready','real share identity must govern, not a legacy acknowledgement');
});
test('v7 QA: malformed new share-basis fields are discarded by restoration',()=>{
 for(const shareBasis of [null,42,{},[],true]){
  const d=safeDraft({...priced(),quote:{...priced().quote,shareBasis}},company,raw);
  assert.equal(d.quote.shareBasis,'');assert.equal(quoteComparison(snapshot,d,calculateCurrent(snapshot,d)).status,'blocked');
 }
});
test('v7 QA: removing acknowledgements never removes economic, source, date or model failures',()=>{
 const d=fresh();
 for(const patch of [{snapshotMode:'latest-quarter'},{shares:0},{shares:null},{cash:null},{debt:null},{revenue:null},{ebit:null},{shareBasis:''},{currency:''},{modelType:'bank-equity'},{sector:'Insurance'},{ticker:'TSM'},{ticker:'NBIS'},{raw:{fatalBlockers:['Unverified financing perimeter']}}]){
  for(const flags of [{modelReviewed:false,bridgeReviewed:false},{modelReviewed:true,bridgeReviewed:true}])assert.throws(()=>calculateCurrent({...snapshot,...patch},{...d,...flags}),undefined,JSON.stringify(patch));
 }
 assert.throws(()=>calculateCurrent(snapshot,{...d,cutoff:'2020-01-01'}),/not available/);
 assert.throws(()=>calculateCurrent(snapshot,{...d,normalizationDelta:100}),/Explain and source/);
});
test('v7 QA: all fourteen current selections retain source gates while reviewed special claims support AAOI and GOOG',()=>{
 assert.equal(universe.companies.length,14);let ready=0;
 for(const c of universe.companies){const r=c.snapshots.find(s=>s.id===c.currentSnapshotId),s=currentSnapshot(c,r),d={...draftFor(c,r),cutoff:universe.asOf};
  const issues=currentIssues(s,d);
  if(['TSM','NBIS'].includes(c.ticker)){assert.ok(issues.some(x=>/withheld|mapping|perimeter|financing/i.test(x)));assert.throws(()=>calculateCurrent(s,d));}
  else{assert.deepEqual(issues,[],c.ticker);assert.ok(Number.isFinite(calculateCurrent(s,d).perShare),c.ticker);ready++;}
 }
 assert.equal(ready,12);
});
// v8 adds distribution families. Numerical legacy-triangular equivalence is now
// protected by tests/v8-qa-simulation-oracle.test.mjs instead of whole-file bytes.
