import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderApprovedEvidence} from '../dist/approved-charts.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
import {nativeShareBasisVerified,currentSnapshot,draftFor,currentIssues,quoteComparison} from '../dist/current-model.js';
const universe=JSON.parse(readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));

test('Guided offers the newest annual and later TTM, never YTD or duplicate accounting bases',()=>{
 for(const c of universe.companies){
  const bases=guidedBasesFor(c);
  assert.ok(bases.length>=1&&bases.length<=2,c.ticker);
  assert.equal(bases[0].snapshotMode,'annual-reference',c.ticker);
  assert.equal(bases[0].periodEnd,c.snapshots.filter(s=>s.snapshotMode==='annual-reference').map(s=>s.periodEnd).sort().at(-1));
  if(bases.length===2){assert.equal(bases[1].snapshotMode,'ttm');assert.ok(bases[1].periodEnd>bases[0].periodEnd);}
 }
 const tsm=guidedBasesFor(universe.companies.find(c=>c.ticker==='TSM'));
 assert.ok(tsm.every(s=>!s.id.endsWith('-TIFRS')));
 for(const t of ['MSFT','COHR','LITE','MU'])assert.equal(guidedBasesFor(universe.companies.find(c=>c.ticker===t)).length,1,t);
});

test('Native TWD share evidence never accepts a weighted average or unmatched denominator',()=>{
 const c=universe.companies.find(c=>c.ticker==='TSM'),raw=guidedBasesFor(c)[0];
 const snapshot=currentSnapshot(c,raw);
 assert.equal(nativeShareBasisVerified(snapshot),true);
 const wrong=structuredClone(snapshot);
 wrong.raw.nativeShareBasisEvidence.denominatorType='weighted average diluted EPS shares';
 assert.equal(nativeShareBasisVerified(wrong),false);
 const mismatch=structuredClone(snapshot);mismatch.shares+=1;
 assert.equal(nativeShareBasisVerified(mismatch),false);
 const draft=draftFor(c,raw);
 assert.ok(!currentIssues(snapshot,draft).some(s=>/FX and ADR|Per-ADR/.test(s)));
 draft.quote={price:100,date:'2026-10-21',currency:'USD',sourceUrl:'https://example.com/quote',shareBasis:snapshot.shareBasis};
 assert.equal(quoteComparison(snapshot,draft,{perShare:100}).status,'blocked');
});

test('An explicitly unknown refreshed balance cannot fall back to an older numeric alias',()=>{
 const snapshot=currentSnapshot({ticker:'TEST',name:'Test'}, {debt:null,cash:null,shares:null,facts:{debt:100,totalDebt:100,cash:20,shares:10}});
 assert.equal(snapshot.debt,null);assert.equal(snapshot.cash,null);assert.equal(snapshot.shares,null);
});

test('Unavailable history shows its source reason ahead of generic range exclusion',()=>{
 const html=renderApprovedEvidence({series:[{period:'FY2025',periodEnd:'2025-12-31',value:null,rangeEligible:false,detail:'Required finance-lease balance is undisclosed.'}],unit:'multiple',title:'Capital',kind:'proxy'});
 assert.match(html,/Required finance-lease balance is undisclosed/);
 assert.doesNotMatch(html,/<li>Excluded from the descriptive range/);
});

test('Case bridge evidence belongs to its own selected period, never the other base',()=>{
 const cases=JSON.parse(readFileSync(new URL('../dist/data/company-base-cases.json',import.meta.url)));
 const snapshots=new Map(universe.companies.flatMap(c=>c.snapshots.map(s=>[s.id,s])));
 for(const company of Object.values(cases.companies))for(const c of [company,...Object.values(company.bySnapshot||{})]){
  for(const [field,evidence]of Object.entries(c.bridgeEvidence||{}))if(evidence.periodEnd)assert.equal(evidence.periodEnd,snapshots.get(c.snapshotId).periodEnd,c.snapshotId+' '+field);
 }
});
