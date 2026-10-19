import {originalResearchBytes} from './research-presentation-original.mjs';
// Independent capital arithmetic and state-preservation checks. The expected
// claim amounts below are from the targeted June filing review, not model rows.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {researchBridgeDefinition,calculateResearchBridge,researchBridgeSensitivity} from '../dist/research-claims.js';
import {researchDraftFor,restoreResearchDraft,loadAnnualResearchCase,calculateResearchOperating,RESEARCH_STORAGE_PREFIX} from '../dist/research-model.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const json=p=>JSON.parse(read(p));
const cases=json('dist/data/renewed-research-2026-10-17/cases.json').companies;
const c=cases.find(x=>x.ticker==='LITE');
const review=json('dist/data/renewed-reviews-2026-10-17/LITE-dated-bridge-v2.json');
const key=RESEARCH_STORAGE_PREFIX+'LITE';
const near=(a,b,message='')=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<Math.max(1,Math.abs(b))*2e-12,`${message}: ${a} != ${b}`);
const sha=x=>createHash('sha256').update(x).digest('hex');
const oldDraft=inputs=>{const d=researchDraftFor(c);delete d.bridgeReviewVersion;d.bridgeInputs=inputs;d.annual[0].reinvestment+=123;d.notes='Keep my analysis';d.userEdited=true;d.researchSimulationConfig={trials:3,seed:'keep-settings'};return d;};
const withoutTime=d=>{const x=structuredClone(d);delete x.updatedAt;return x;};

test('LITE review: immutable original source bundle remains byte-identical',()=>{
 for(const [file,hash] of Object.entries(review.frozenOriginals))assert.equal(sha(originalResearchBytes('dist/data/renewed-research-2026-10-17/'+file,read('dist/data/renewed-research-2026-10-17/'+file))),hash,file);
 const files=fs.readdirSync(new URL('../dist/data/renewed-research-2026-10-17/',import.meta.url)).sort();
 const original=files.map(f=>[f,sha(originalResearchBytes('dist/data/renewed-research-2026-10-17/'+f,read('dist/data/renewed-research-2026-10-17/'+f)))]);
 assert.equal(sha(JSON.stringify(original)),'b899a72e342e572b0cdd542054a51db2714266ea0a85b53989b2b8bfc6c2b6c5');
 assert.equal(review.correction.incrementalJuneClaimFromRequests,null);assert.equal(review.correction.requestDifferenceIsVerifiedJuneClaim,false);
 assert.equal(review.reportedFacts.cumulativeConversionRequestsThrough20260814,757.8);assert.equal(review.reportedFacts.conversionPrincipalAlreadyCashSettledFY2026,519.4);
});

test('LITE review: independent per-series arithmetic replaces notes with fair value exactly once',()=>{
 const principal=[54.8,179.6,54.9,1265].reduce((a,b)=>a+b,0),notes=[447.2,1108.7,640.2,5411.1].reduce((a,b)=>a+b,0);
 near(principal,1554.3);near(notes,7607.2);near(notes-principal,6052.9);
 const d=researchDraftFor(c),before=JSON.stringify(d),ev=calculateResearchOperating(d).enterprise;
 near(ev,17004.83707529623);
 const r=calculateResearchBridge(d,ev,d.bridgeInputs),expected=ev+2043.5+694.9+200-notes-92.8;
 near(r.equity,expected);near(r.rawPerShare,expected/(88.6+2.9));near(r.rawPerShare,133.80586967536865);
 near(r.claimTotal,notes+92.8);near(r.assetTotal,2043.5+694.9+200);assert.equal(r.allocationShares,91.5);
 assert.equal(r.rows.filter(x=>x.id==='cappedCallAssetValue').length,1);assert.equal(r.rows.filter(x=>x.kind==='shares').length,1);
 assert.ok(!r.rows.some(x=>['noteConversionShares','coupon','preferredLiquidation'].includes(x.id)));
 assert.ok(!r.rows.some(x=>[757.8,519.4,238.4,2000,102,1544.6].includes(x.amount)));
 assert.equal(JSON.stringify(d),before);assert.equal(r.claimCompleteness,'partial');assert.equal(r.currentCapitalVerified,false);assert.equal(r.priceComparisonEligible,false);
 assert.equal(r.claimValuationMethod,'fixed-june-market-claims');assert.equal(r.claimRepricedPerTrial,false);assert.match(r.allocationLabel,/hybrid/);
 assert.match(r.warnings.join(' '),/self-consistent intrinsic option valuation/);assert.match(r.warnings.join(' '),/Employee.*incomplete/);
});

test('LITE review: explicit dated sensitivities preserve signed arithmetic and source classifications',()=>{
 for(const ev of [-1000000,0,10000])for(const adjustment of [0,600,6052.9,10000])for(const calls of [0,75,200]){
  const r=calculateResearchBridge(c,ev,{convertiblePremiumClaim:adjustment,cappedCallAssetValue:calls});
  near(r.equity,ev+2738.4+calls-1647.1-adjustment);near(r.rawPerShare,(ev+2738.4+calls-1647.1-adjustment)/91.5);
  assert.equal(r.flooredPerShare,Math.max(0,r.rawPerShare));assert.equal(r.rows.find(x=>x.id==='convertiblePremiumClaim').sourceAmount,6052.9);
  assert.equal(r.rows.find(x=>x.id==='cappedCallAssetValue').sourceAmount,200);
  if(adjustment===0){assert.match(r.allocationLabel,/principal-only/);assert.match(r.warnings[0],/Principal-only/);}
 }
 const variants=researchBridgeSensitivity(c,10000),base=variants[0];
 const noCalls=variants.find(x=>x.changes.cappedCallAssetValue===0&&!Object.hasOwn(x.changes,'convertiblePremiumClaim'));
 const principal=variants.find(x=>x.changes.convertiblePremiumClaim===0);
 near(base.equity-noCalls.equity,200);near(principal.equity,10000+2738.4-1647.1);
 assert.equal(principal.changes.cappedCallAssetValue,0);assert.match(principal.classification,/no probability/);
});

test('LITE review: explicit null is unknown; malformed inputs cannot become source values or zero',()=>{
 const unknown=calculateResearchBridge(c,10000,{convertiblePremiumClaim:null});assert.equal(unknown.status,'operating-only');assert.equal(unknown.perShare,null);assert.match(unknown.requiredInputs.join(' '),/unknown/);
 for(const field of ['convertiblePremiumClaim','cappedCallAssetValue'])for(const bad of [undefined,'6052.9',NaN,Infinity,-1,{},[]])assert.throws(()=>calculateResearchBridge(c,10000,{[field]:bad}));
 assert.throws(()=>calculateResearchBridge(c,10000,{cappedCallAssetValue:null}));
 const dated=calculateResearchBridge(c,10000,{calculationDate:'2026-10-17'});assert.equal(dated.basisMismatch,true);assert.equal(dated.capitalReferenceDate,'2026-06-27');assert.equal(dated.priceComparisonEligible,false);assert.match(dated.warnings.join(' '),/No current cash\/debt\/share roll-forward/);
});

test('LITE migration: fresh defaults are explicit, old implicit unknown and entered amounts preserve prior economics',()=>{
 const fresh=researchDraftFor(c);assert.deepEqual(fresh.bridgeInputs,{convertiblePremiumClaim:6052.9,cappedCallAssetValue:200});assert.equal(fresh.bridgeReviewVersion,'2026-10-17-lite-v2');
 for(const inputs of [{},{convertiblePremiumClaim:null},{convertiblePremiumClaim:0},{convertiblePremiumClaim:600},{convertiblePremiumClaim:600,cappedCallAssetValue:77,additionalClaimAllowance:123}]){
  const old=oldDraft(inputs),before=structuredClone(old),restored=restoreResearchDraft(old,c);
  assert.equal(restored.error,null);assert.deepEqual(old,before);assert.equal(restored.draft.bridgeReviewVersion,'legacy-preserved-v1');
  for(const [field,value] of Object.entries(inputs))assert.equal(restored.draft.bridgeInputs[field],value);
  assert.equal(restored.draft.bridgeInputs.convertiblePremiumClaim,inputs.convertiblePremiumClaim??null);
  assert.equal(restored.draft.bridgeInputs.cappedCallAssetValue,inputs.cappedCallAssetValue??0);
  assert.deepEqual(restored.draft.annual,old.annual);assert.equal(restored.draft.notes,old.notes);assert.deepEqual(restored.draft.researchSimulationConfig,old.researchSimulationConfig);
  const r=calculateResearchBridge(restored.draft,10000,restored.draft.bridgeInputs);
  if(inputs.convertiblePremiumClaim==null)assert.equal(r.status,'operating-only');
  else near(r.equity,10000+2738.4+(inputs.cappedCallAssetValue??0)-1647.1-inputs.convertiblePremiumClaim-(inputs.additionalClaimAllowance??0));
  assert.deepEqual(restoreResearchDraft(restored.draft,c).draft,restored.draft,'migration is idempotent');
  const load=loadAnnualResearchCase(restored.draft,c);assert.deepEqual(load.draft.bridgeInputs,restored.draft.bridgeInputs);assert.equal(load.draft.bridgeReviewVersion,'legacy-preserved-v1');
 }
});

test('LITE migration: malformed saved structures are retained exactly and never migrated',async()=>{
 for(const inputs of [null,false,0,'oops',[]]){
  const old=oldDraft(inputs),raw=JSON.stringify(old),restored=restoreResearchDraft(old,c);assert.ok(restored.error);assert.deepEqual(restored.draft,old);
  const storage=new Map([[key,raw],[RESEARCH_STORAGE_PREFIX+'selection','LITE']]),h=await startResearchWorkspace({storage});
  assert.ok(h.getState().identityError);assert.equal(storage.get(key),raw);assert.equal(h.get('.research-equity-value'),null);
  h.action('export');assert.deepEqual(h.downloads[0].value.retainedDraft,old);assert.equal(storage.get(key),raw);
 }
 const unsupported=researchDraftFor(c);unsupported.bridgeReviewVersion='unknown-v99';assert.ok(restoreResearchDraft(unsupported,c).error);assert.deepEqual(restoreResearchDraft(unsupported,c).draft,unsupported);
});

test('LITE workspace: reviewed claim load, repeated load, Undo, switches, reload and export preserve saved work',async()=>{
 const old=oldDraft({convertiblePremiumClaim:null,additionalClaimAllowance:123,additionalDilutionShares:1}),storage=new Map([[key,JSON.stringify(old)],[RESEARCH_STORAGE_PREFIX+'selection','LITE']]);
 const h=await startResearchWorkspace({storage}),before=structuredClone(h.getState().draft);
 assert.equal(h.get('.research-equity-value'),null);assert.match(h.get('#research-editor').textContent,/older saved draft/);
 h.action('load-bridge');let next=h.getState().draft;
 assert.equal(next.bridgeInputs.convertiblePremiumClaim,6052.9);assert.equal(next.bridgeInputs.cappedCallAssetValue,200);assert.equal(next.bridgeInputs.additionalClaimAllowance,123);assert.equal(next.bridgeInputs.additionalDilutionShares,1);
 assert.deepEqual(next.annual,before.annual);assert.deepEqual(next.timing,before.timing);assert.equal(next.notes,before.notes);assert.deepEqual(next.researchSimulationConfig,before.researchSimulationConfig);assert.ok(h.get('.research-equity-value'));
 h.action('export');const exported=h.downloads[0].value;assert.equal(exported.equityBridge.modelId,'LITE-2026-10-17-lite-v2');assert.equal(exported.equityBridge.claimRepricedPerTrial,false);assert.equal(exported.equityBridge.inputs.cappedCallAssetValue,200);
 h.action('undo');assert.deepEqual(h.getState().draft,before);assert.equal(h.get('.research-equity-value'),null);
 h.action('load-bridge');const first=structuredClone(h.getState().draft);h.action('load-bridge');h.action('undo');assert.deepEqual(h.getState().draft,first);
 h.select('AAPL');h.select('LITE');assert.deepEqual(withoutTime(h.getState().draft),withoutTime(first));
 const again=await startResearchWorkspace({storage});assert.deepEqual(withoutTime(again.getState().draft),withoutTime(first));
 again.input(again.field('bridge','convertiblePremiumClaim'),'0');assert.match(again.get('#research-results').textContent,/principal-only/);
 again.action('load');assert.equal(again.getState().draft.bridgeInputs.convertiblePremiumClaim,0,'loading original operating case retains user claim edits');
});

test('LITE simulation: every fixed and varied trial uses the identical dated claim arithmetic',()=>{
 const d=researchDraftFor(c),fixed=simulateResearch(d,{trials:3});assert.equal(fixed.bridgeCoverage.complete,true);near(fixed.perShare.median,133.80586967536865);
 for(const bridgeInputs of [d.bridgeInputs,{convertiblePremiumClaim:321,cappedCallAssetValue:75,additionalClaimAllowance:21,additionalDilutionShares:2}]){
  const run=simulateResearch({...d,bridgeInputs},{trials:29,seed:'lite-independent',drivers:{marginShift:{type:'uniform',low:-.1,high:.1},waccShift:{type:'uniform',low:-.01,high:.02}}});
  for(const trial of run.scenarios){
   const expected=trial.enterprise+2738.4+bridgeInputs.cappedCallAssetValue-1647.1-bridgeInputs.convertiblePremiumClaim-(bridgeInputs.additionalClaimAllowance??0),shares=91.5+(bridgeInputs.additionalDilutionShares??0);
   near(trial.equity,expected);near(trial.rawPerShare,expected/shares);near(trial.claims.assetTotal,2738.4+bridgeInputs.cappedCallAssetValue);
  }
  assert.match(run.warnings.join(' '),/fixed June proxies/);assert.equal(run.quote.status,'blocked');
 }
 const unknown=simulateResearch({...d,bridgeInputs:{convertiblePremiumClaim:null,cappedCallAssetValue:0}},{trials:3});assert.equal(unknown.accepted,3);assert.equal(unknown.bridgeCoverage.complete,false);assert.equal(unknown.perShare.median,null);
});

test('LITE scope: all 13 other renewed company definitions, bridges and sensitivities are exact V22 outputs',()=>{
 const goldens=json('tests/fixtures/renewed-nonlite-v22-goldens.json');assert.equal(Object.keys(goldens.companies).length,13);
 for(const c of cases.filter(x=>x.ticker!=='LITE')){
  const payload=[researchBridgeDefinition(c.ticker),calculateResearchBridge(c,123456),calculateResearchBridge(c,-1000000,{calculationDate:'2026-10-17',additionalClaimAllowance:123,additionalDilutionShares:1}),researchBridgeSensitivity(c,123456)];
  assert.equal(sha(JSON.stringify(payload)),goldens.companies[c.ticker],c.ticker);
 }
 for(const ticker of ['AAOI','NBIS'])assert.equal(calculateResearchBridge(cases.find(x=>x.ticker===ticker),10000).status,'operating-only');
});

test('LITE migration: explicit operating-case recovery preserves implicit old claims even when annual data were malformed',async()=>{
 for(const inputs of [{},{convertiblePremiumClaim:null},{convertiblePremiumClaim:0}]){
  const d=oldDraft(inputs);d.annual[0].revenue=null;
  const raw=JSON.stringify(d),storage=new Map([[key,raw],[RESEARCH_STORAGE_PREFIX+'selection','LITE']]),h=await startResearchWorkspace({storage});
  assert.equal(storage.get(key),raw);assert.ok(h.getState().identityError);
  h.action('load');assert.equal(h.getState().draft.bridgeReviewVersion,'legacy-preserved-v1');
  assert.equal(h.getState().draft.bridgeInputs.convertiblePremiumClaim,inputs.convertiblePremiumClaim??null);assert.equal(h.getState().draft.bridgeInputs.cappedCallAssetValue,0);
  if(inputs.convertiblePremiumClaim==null)assert.equal(h.get('.research-equity-value'),null);
  h.action('undo');assert.deepEqual(h.getState().draft,d);assert.equal(storage.get(key),raw);
 }
});

test('LITE chart: fixed June financing and incomplete employee claims are visible beside chart controls',()=>{
 const d=researchDraftFor(c),adapter=annualResearchSimulationAdapter(d),r=simulateResearch(d,{trials:2});
 const html=adapter.outputMarkup(r);assert.match(html,/June-dated hybrid/);assert.match(html,/stay fixed in every trial/);assert.match(html,/Employee claims remain incomplete/);assert.match(html,/not a current October share-price/);
 assert.ok(!html.includes('<details>'),'the claim warning is not hidden in a disclosure');
});
