import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults,valueCompany} from '../dist/engine.js';
import {currentSnapshot,draftFor,safeDraft,currentIssues,calculateCurrent,freezeCurrent,researchCaseFor,loadResearchedBaseCase,markDraftEdited,fetchBaseCases,currentClaimsEvidence} from '../dist/current-model.js';
import {isUntouchedGenericDraft,BASE_CASE_PATH} from '../dist/base-cases.js';
import {simulateCurrent,simulationDefaults} from '../dist/simulation.js';
const universe=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));
const company=universe.companies.find(c=>c.ticker==='AAPL'),raw=company.snapshots.find(s=>s.id===company.currentSnapshotId),snapshot=currentSnapshot(company,raw);
const assumptions={...defaults,growth:.06,targetMargin:.3,tax:.24,salesCapital:3,wacc:.095,terminalGrowth:.02,terminalROIC:.14};
const baseCases={schemaVersion:1,version:'test-v1',asOf:'2026-10-17',sources:{filing:{title:'Source filing',url:raw.sourceUrl,publishedAt:raw.filingDate}},companies:{AAPL:{ticker:'AAPL',snapshotId:raw.id,asOf:'2026-10-17',summary:'A dated researched teaching case.',assumptions,rationale:Object.fromEntries(Object.keys(defaults).map(k=>[k,`Explicit judgment for ${k}.`])),sourceIds:['filing']}}};
const copy=x=>structuredClone(x);
const fresh=()=>draftFor(company,raw,{baseCases});

test('base cases: fresh exact baseline loads researched numbers and honest version, without user assent',()=>{
 const d=fresh();assert.deepEqual(d.assumptions,assumptions);assert.equal(d.assumptionProvenance.kind,'researched-base-case');assert.equal(d.assumptionProvenance.version,'test-v1');assert.equal(d.assumptionProvenance.sourcePath,BASE_CASE_PATH);assert.deepEqual(d.assumptionProvenance.rationale,baseCases.companies.AAPL.rationale);assert.equal(d.assumptionProvenance.sources[0].url,raw.sourceUrl);assert.deepEqual(d.reviewed,[]);assert.equal(d.modelReviewed,false);assert.equal(d.bridgeReviewed,false);
 const frozen=freezeCurrent(snapshot,d);assert.deepEqual(frozen.draft.assumptionProvenance,d.assumptionProvenance);assert.deepEqual(frozen.draft.assumptions,assumptions);
 assert.deepEqual(calculateCurrent(snapshot,d),valueCompany({...snapshot,provisionalBridge:true},assumptions));
});
test('base cases: imported replacements retain saved work without claiming the bundled research applies',()=>{
 const saved=fresh();saved.notes.growth='Prior thesis';const imported={...company,researchImported:true};
 const restored=safeDraft(saved,imported,raw,{baseCases});assert.deepEqual(restored.assumptions,saved.assumptions);assert.deepEqual(restored.notes,saved.notes);assert.equal(restored.assumptionProvenance.kind,'user-draft');assert.throws(()=>loadResearchedBaseCase(restored,imported,raw,baseCases),/unavailable/);
});
test('base cases: each lookup and draft gets an independent copy',()=>{
 const original=JSON.stringify(baseCases),a=researchCaseFor(baseCases,company,raw),d=fresh();a.assumptions.growth=.99;d.assumptions.targetMargin=.01;assert.equal(JSON.stringify(baseCases),original);assert.equal(fresh().assumptions.targetMargin,.3);
});
test('base cases: missing, mismatched, imported, malformed, unsourced or future evidence falls back honestly',()=>{
 const invalid=[null,{}, {...baseCases,schemaVersion:2}];
 for(const mutate of [c=>c.snapshotId='another-baseline',c=>c.assumptions.years=20,c=>c.assumptions.growth=NaN,c=>c.assumptions.wacc=c.assumptions.terminalGrowth,c=>c.rationale.growth='',c=>c.sourceIds=['missing'],c=>c.normalization={normalizationDelta:50},c=>c.asOf='2026-01-01']){const lib=copy(baseCases);mutate(lib.companies.AAPL);invalid.push(lib);}
 const badSource=copy(baseCases);badSource.sources.filing.publishedAt='2027-01-01';invalid.push(badSource);
 for(const lib of invalid){assert.equal(researchCaseFor(lib,company,raw),null);const d=draftFor(company,raw,{baseCases:lib});assert.deepEqual(d.assumptions,defaults);assert.equal(d.assumptionProvenance.kind,'generic-default');}
 for(const [c,r]of [[{...company,researchImported:true},raw],[company,{...raw,researchImported:true}],[company,{...raw,id:'AAPL-OTHER'}]]){assert.equal(researchCaseFor(baseCases,c,r),null);assert.equal(draftFor(c,r,{baseCases}).assumptionProvenance.kind,'generic-default');}
});
test('base cases: unmarked legacy drafts are preserved even when their numbers match generic defaults',()=>{
 const old=draftFor(company,raw);delete old.assumptionProvenance;old.updatedAt='2026-10-17T00:00:00Z';
 const restored=safeDraft(old,company,raw,{baseCases});assert.deepEqual(restored.assumptions,defaults);assert.equal(restored.assumptionProvenance.kind,'user-draft');assert.ok(researchCaseFor(baseCases,company,raw));
 const partial={...old,assumptions:{growth:.11},notes:{growth:'Keep my work'}};const p=safeDraft(partial,company,raw,{baseCases});assert.equal(p.assumptions.growth,.11);assert.equal(p.assumptions.targetMargin,defaults.targetMargin);assert.deepEqual(p.notes,partial.notes);
});
test('base cases: only recorded untouched generic fallback drafts auto-upgrade when research arrives',()=>{
 const old=draftFor(company,raw);assert.ok(isUntouchedGenericDraft(old,company,raw));old.step=7;old.updatedAt='2026-10-17T01:00:00Z';
 const d=safeDraft(old,company,raw,{baseCases});assert.deepEqual(d.assumptions,assumptions);assert.equal(d.step,7);assert.equal(d.assumptionProvenance.selection,'untouched-upgrade');
 const mutations=[d=>d.assumptions.growth=.12,d=>d.notes.growth='My note',d=>d.quote.price=100,d=>d.waccWorksheet.beta=1.1,d=>d.normalizationDelta=100,d=>d.adjustmentReason='My reason',d=>d.reviewed.push(2),d=>d.modelReviewed=true,d=>d.cutoff='2026-10-16',d=>d.simulationConfig=simulationDefaults(defaults),d=>d.customAnalysis={memo:'keep'},d=>markDraftEdited(d,'growth'),d=>{d.notes.bad=42;}];
 for(const mutate of mutations){const changed=draftFor(company,raw);mutate(changed);assert.equal(isUntouchedGenericDraft(changed,company,raw),false);const kept=safeDraft(changed,company,raw,{baseCases});assert.notEqual(kept.assumptionProvenance.kind,'researched-base-case');assert.equal(kept.assumptions.growth,changed.assumptions.growth);}
});
test('base cases: reloading or new research revisions never silently replace a saved researched case',()=>{
 const d=fresh();d.assumptions.growth=.123;d.notes.growth='My custom thesis';markDraftEdited(d,'growth');
 const v2=copy(baseCases);v2.version='test-v2';v2.companies.AAPL.assumptions.growth=.5;
 const kept=safeDraft(d,company,raw,{baseCases:v2});assert.equal(kept.assumptions.growth,.123);assert.equal(kept.assumptionProvenance.version,'test-v1');assert.deepEqual(kept.assumptionProvenance.rationale,d.assumptionProvenance.rationale);assert.deepEqual(kept.assumptionProvenance.sources,d.assumptionProvenance.sources);assert.equal(kept.assumptionProvenance.userEdited,true);assert.deepEqual(kept.notes,d.notes);
 assert.deepEqual(safeDraft(fresh(),company,raw,{baseCases:v2}).assumptions,assumptions);
 // Even without the UI marker, a changed scalar is recognized during restore.
 const unmarked=fresh();unmarked.assumptions.growth=.22;assert.equal(safeDraft(unmarked,company,raw,{baseCases}).assumptionProvenance.userEdited,true);
});
test('base cases: explicit Load is pure, preserves notes, quotes and custom uncertainty, and can be undone exactly',()=>{
 const before=draftFor(company,raw);before.assumptions.growth=.21;before.notes={growth:'Do not lose this'};before.quote={price:200,date:'2026-10-16',currency:'USD',sourceUrl:'https://example.com',basisConfirmed:false,shareBasis:snapshot.shareBasis};before.waccWorksheet.beta=1.8;before.simulationConfig=simulationDefaults(before.assumptions);before.simulationConfig.drivers.growth={type:'fixed',value:.21};markDraftEdited(before,'growth');
 const undo=copy(before),loaded=loadResearchedBaseCase(before,company,raw,baseCases);assert.deepEqual(before,undo);assert.deepEqual(loaded.assumptions,assumptions);for(const k of ['notes','quote','waccWorksheet','simulationConfig','cutoff','reviewed','bridgeReviewed','modelReviewed'])assert.deepEqual(loaded[k],before[k],k);assert.equal(loaded.assumptionProvenance.selection,'explicit-load');loaded.notes.growth='new';assert.equal(before.notes.growth,'Do not lose this');assert.deepEqual(safeDraft(undo,company,raw,{baseCases}).assumptions,undo.assumptions);
});
test('base cases: sourced EBIT normalization is loaded and persists; scalar model math is unchanged',()=>{
 const lib=copy(baseCases);lib.companies.AAPL.normalization={normalizationDelta:-1000,adjustmentReason:'Analyst through-cycle adjustment, not a reported fact.',adjustmentSource:raw.sourceUrl};
 const d=draftFor(company,raw,{baseCases:lib});assert.equal(d.normalizationDelta,-1000);assert.equal(d.adjustmentSource,raw.sourceUrl);assert.deepEqual(calculateCurrent(snapshot,d),valueCompany({...snapshot,ebit:snapshot.ebit-1000,provisionalBridge:true},assumptions));assert.equal(safeDraft(d,company,raw,{baseCases:lib}).normalizationDelta,-1000);
 const loaded=loadResearchedBaseCase(d,company,raw,baseCases);assert.equal(loaded.normalizationDelta,0);assert.equal(loaded.adjustmentReason,'');assert.equal(loaded.adjustmentSource,'');
});
test('base cases: later research cannot be loaded into or used before its research date',()=>{
 const d=fresh();d.cutoff='2026-10-16';assert.throws(()=>loadResearchedBaseCase(d,company,raw,baseCases),/information through/);assert.ok(currentIssues(snapshot,d).some(x=>/after the valuation date/.test(x)));assert.throws(()=>calculateCurrent(snapshot,d),/after the valuation date/);
});
test('base cases: missing or delayed optional JSON returns a generic-compatible null',async()=>{
 assert.equal(await fetchBaseCases({fetcher:async()=>({ok:false})}),null);
 assert.equal(await fetchBaseCases({fetcher:async()=>{throw Error('offline')}}),null);
 assert.equal(await fetchBaseCases({fetcher:async()=>({ok:true,json:async()=>{throw Error('bad JSON')}})}),null);
 assert.equal(await fetchBaseCases({fetcher:async()=>new Promise(()=>{}),timeoutMs:5}),null);
 const got=await fetchBaseCases({fetcher:async path=>{assert.equal(path,BASE_CASE_PATH);return {ok:true,json:async()=>baseCases}}});assert.deepEqual(got,baseCases);
});
test('current claims: confirmed convertible/preferred omissions gate only exact affected baselines',()=>{
 const affected=new Set(['AAOI-CURRENT-2025-12-31','AAOI-CURRENT-2026-06-30','AAOI-TTM-2026-06-30','GOOG-CURRENT-2026-06-30','GOOG-TTM-2026-06-30']);
 for(const c of universe.companies.filter(c=>['AAOI','GOOG'].includes(c.ticker)))for(const r of c.snapshots){const s=currentSnapshot(c,r),d=draftFor(c,r),issues=currentClaimsEvidence(s);assert.equal(issues.length,affected.has(r.id)?1:0,r.id);if(!affected.has(r.id)){assert.doesNotThrow(()=>calculateCurrent(s,d));continue;}assert.match(issues[0].sourceUrl,/sec\.gov\/Archives/);assert.ok(issues[0].amount>0);assert.ok(currentIssues(s,d).some(x=>/claims bridge/.test(x)));for(const flags of [{},{bridgeReviewed:true,modelReviewed:true,reviewed:[0,1,2,3,4,5,6,7]}]){const edited={...d,...flags,assumptions:{...d.assumptions,otherClaims:issues[0].amount}};assert.throws(()=>calculateCurrent(s,edited),/claims bridge/);assert.throws(()=>simulateCurrent(s,edited,{trials:3}),/claims bridge/);}}
 const goog=universe.companies.find(c=>c.ticker==='GOOG'),annual=goog.snapshots.find(r=>r.id==='GOOG-CURRENT-2025-12-31');assert.deepEqual(currentClaimsEvidence(currentSnapshot(goog,annual)),[]);
});

test('base cases: all fourteen shipped cases load only their exact current baseline with distinct assumptions',()=>{
 const shipped=JSON.parse(fs.readFileSync(new URL('../dist/data/company-base-cases.json',import.meta.url))),signatures=new Set(),before=JSON.stringify(universe);
 assert.equal(Object.keys(shipped.companies).length,14);let supported=0;
 for(const c of universe.companies){const r=c.snapshots.find(x=>x.id===c.currentSnapshotId),b=researchCaseFor(shipped,c,r);assert.ok(b,c.ticker+' case rejected');const d=draftFor(c,r,{baseCases:shipped});assert.equal(d.assumptionProvenance.kind,'researched-base-case',c.ticker);assert.equal(d.assumptionProvenance.version,shipped.version);assert.deepEqual(d.assumptions,b.assumptions);assert.equal(d.normalizationDelta,b.normalization.normalizationDelta);assert.equal(d.modelReviewed,false);assert.equal(d.bridgeReviewed,false);signatures.add(JSON.stringify(d.assumptions));const s=currentSnapshot(c,r);if(currentIssues(s,d).length)assert.ok(['GOOG','AAOI','NBIS','TSM'].includes(c.ticker));else{supported++;assert.ok(Number.isFinite(calculateCurrent(s,d).perShare));assert.ok(simulateCurrent(s,d,{trials:10,seed:'shipped-case-check'}).accepted>0,c.ticker);}for(const alternate of c.snapshots.filter(x=>x.id!==r.id))assert.equal(researchCaseFor(shipped,c,alternate),null,c.ticker+' research leaked to another baseline');}
 assert.equal(signatures.size,14);assert.equal(supported,10);assert.equal(JSON.stringify(universe),before);
});
