// Independent facts confirmed against same-period original issuer 10-K / 10-Q.
// Amounts below are book carrying values, not asserted market values of claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,currentIssues,calculateCurrent,currentClaimsEvidence} from '../dist/current-model.js';
import {simulateCurrent} from '../dist/simulation.js';
const universe=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));
const verified=[
 {ticker:'AAOI',id:'AAOI-CURRENT-2025-12-31',period:'2025-12-31',filed:'2026-02-26',amount:129.829,source:'https://www.sec.gov/Archives/edgar/data/1158114/000143774926005875/aaoi20251231_10k.htm'},
 {ticker:'AAOI',id:'AAOI-CURRENT-2026-06-30',period:'2026-06-30',filed:'2026-08-06',amount:129.142,source:'https://www.sec.gov/Archives/edgar/data/1158114/000143774926026278/aaoi20260630_10q.htm'},
 {ticker:'AAOI',id:'AAOI-TTM-2026-06-30',period:'2026-06-30',filed:'2026-08-06',amount:129.142,source:'https://www.sec.gov/Archives/edgar/data/1158114/000143774926026278/aaoi20260630_10q.htm'},
 {ticker:'GOOG',id:'GOOG-CURRENT-2026-06-30',period:'2026-06-30',filed:'2026-07-23',amount:18023,source:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm'},
 {ticker:'GOOG',id:'GOOG-TTM-2026-06-30',period:'2026-06-30',filed:'2026-07-23',amount:18023,source:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm'}
];
test('v8 QA: verified debt / preferred omissions retain dated evidence and require a genuine explicit claims model',()=>{
 for(const v of verified){
  const c=universe.companies.find(c=>c.ticker===v.ticker),raw=c.snapshots.find(r=>r.id===v.id),s=currentSnapshot(c,raw),d={...draftFor(c,raw),cutoff:universe.asOf},e=currentClaimsEvidence(s);
  assert.equal(e.length,1);assert.equal(e[0].amount,v.amount);assert.equal(e[0].currency,'USD');assert.equal(e[0].periodEnd,v.period);assert.equal(e[0].filedAt,v.filed);assert.equal(e[0].sourceUrl,v.source);
  const missing={...d,claims:undefined};
  assert.ok(currentIssues(s,missing).some(x=>/claims|convertible|preferred/i.test(x)));assert.throws(()=>calculateCurrent(s,missing),/claims|convertible|preferred/i);assert.throws(()=>simulateCurrent(s,missing,{trials:2}),/claims|convertible|preferred/i);
  for(const flags of [{bridgeReviewed:true,modelReviewed:true},{assumptions:{...d.assumptions,otherClaims:v.amount}}]){const acknowledged={...missing,...flags};assert.throws(()=>calculateCurrent(s,acknowledged),/claims|convertible|preferred/i);assert.throws(()=>simulateCurrent(s,acknowledged,{trials:2}),/claims|convertible|preferred/i);}
  if(raw.snapshotMode==='latest-quarter'){assert.throws(()=>calculateCurrent(s,d),/Interim/);continue;}
  assert.deepEqual(currentIssues(s,d),[]);assert.ok(Number.isFinite(calculateCurrent(s,d).perShare));assert.equal(simulateCurrent(s,d,{trials:2}).accepted,2);
 }
});
test('v8 QA: current bridge gates do not retroactively withhold Alphabet before preferred issuance or mutate source bytes',()=>{
 const before=JSON.stringify(universe),c=universe.companies.find(c=>c.ticker==='GOOG'),raw=c.snapshots.find(r=>r.id==='GOOG-CURRENT-2025-12-31'),s=currentSnapshot(c,raw),d={...draftFor(c,raw),cutoff:universe.asOf};
 assert.deepEqual(currentClaimsEvidence(s),[]);assert.deepEqual(currentIssues(s,d),[]);assert.ok(Number.isFinite(calculateCurrent(s,d).perShare));
 for(const c of universe.companies)for(const r of c.snapshots)currentClaimsEvidence(currentSnapshot(c,r));assert.equal(JSON.stringify(universe),before);
 const current=c.snapshots.find(r=>r.id===c.currentSnapshotId);assert.equal(current.facts.preferredEquity,null,'raw source remains a preserved prior capture, with an explicit source-reviewed bridge overlay');
});
