import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,safeDraft,freezeCurrent,operatingAssumptions,independentGrowthProfile,resolvedMarginPath,currentIssues,loadResearchedBaseCase,valueCurrentWithClaims} from '../dist/current-model.js';
import {isUntouchedGenericDraft} from '../dist/base-cases.js';
import {simulateCurrent} from '../dist/simulation.js';
const universe=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));
const research=JSON.parse(fs.readFileSync(new URL('../dist/data/company-base-cases.json',import.meta.url)));
function context(ticker='AMZN'){
 const company=universe.companies.find(c=>c.ticker===ticker),raw=company.snapshots.find(s=>s.id===company.currentSnapshotId),snapshot=currentSnapshot(company,raw),draft=draftFor(company,raw,{baseCases:research});
 draft.cutoff=universe.asOf;return {company,raw,snapshot,draft};
}
function path(draft,extra={}){draft.marginPath={enabled:true,interimMargin:.3,interimYear:3,declineStartYear:7,terminalYear:18,...extra};draft.assumptions.targetMargin=.16;return draft;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Guided margin: all 14 absent and disabled cases retain exact economics, errors and simulations',()=>{
 for(const company of universe.companies){const {snapshot,draft}=context(company.ticker),disabled={...structuredClone(draft),marginPath:{enabled:false}};
  if(currentIssues(snapshot,draft).length){assert.deepEqual(currentIssues(snapshot,disabled),currentIssues(snapshot,draft));continue;}
  assert.deepEqual(calculateCurrent(snapshot,disabled),calculateCurrent(snapshot,draft));
  assert.deepEqual(simulateCurrent(snapshot,disabled,{trials:7,seed:'margin-disabled'}),simulateCurrent(snapshot,draft,{trials:7,seed:'margin-disabled'}));
 }
});
test('Guided margin: independent piecewise curve, normalization and cash-flow arithmetic',()=>{
 const {snapshot:s,draft:d}=context();path(d);d.normalizationDelta=20;d.adjustmentReason='Test normalization';d.adjustmentSource=s.sourceUrl;
 const a=d.assumptions,start=(s.ebit+20)/s.revenue,v=calculateCurrent(s,d);assert.equal(v.rows.length,18);
 let previous=s.revenue,pv=0;
 for(let year=1;year<=18;year++){
  const growth=a.growth+(a.terminalGrowth-a.growth)*Math.min(year-1,9)/9;
  const margin=year<=3?start+(.3-start)*year/3:year<=7?.3:.3+(.16-.3)*(year-7)/11;
  const revenue=previous*(1+growth),ebit=revenue*margin,nopat=ebit-Math.max(0,ebit)*a.tax,reinvestment=Math.max(0,(revenue-previous)/a.salesCapital),fcff=nopat-reinvestment;
  for(const [key,value]of Object.entries({growth,margin,revenue,ebit,nopat,reinvestment,fcff}))near(v.rows[year-1][key],value);
  pv+=fcff/(1+a.wacc)**year;previous=revenue;
 }
 near(v.forecastPV,pv);near(v.terminalNopat,previous*(1+a.terminalGrowth)*.16*(1-a.tax));
 d.normalizationDelta=40;near(calculateCurrent(s,d).rows[0].margin,(s.ebit+40)/s.revenue+(.3-(s.ebit+40)/s.revenue)/3);
});
test('Guided margin: v2 growth and capital dates remain fixed and old margin date no longer extends forecast',()=>{
 const {snapshot:s,draft:d}=context();d.operatingProfile=independentGrowthProfile(d,{mode:'annual',explicitYears:3,subsequentGrowth:[.25,.15]});d.operatingProfile.marginMaturityYears=30;d.assumptions.years=15;
 const before=operatingAssumptions(s,d,d.assumptions);path(d);const enabled=operatingAssumptions(s,d,d.assumptions);
 assert.equal(enabled.years,18);assert.equal(d.operatingProfile.capitalMaturityYears,10);assert.equal(d.operatingProfile.capitalHoldYears,3);
 // Match identical terminal-margin assumptions for capital comparison.
 const plain={...structuredClone(d)};delete plain.marginPath;const same=operatingAssumptions(s,plain,plain.assumptions);
 for(let i=0;i<18;i++)for(const k of ['growth','salesCapital','taxRate','wacc'])assert.equal(enabled.yearlyOverrides[i][k],same.yearlyOverrides[i][k]);
 assert.equal(before.years,30);assert.equal(calculateCurrent(s,d).operatingProfile.forecastYears,18);
});
test('Guided margin: shared sampled shift moves both future anchors, rejects infeasible shifts without clipping',()=>{
 const {snapshot:s,draft:d}=context();path(d,{interimMargin:.95});
 const a={...d.assumptions,targetMargin:.18},p=resolvedMarginPath(s,d,a);near(p.interimMargin,.97);assert.equal(p.terminalMargin,.18);assert.equal(p.startMargin,s.ebit/s.revenue);
 assert.throws(()=>operatingAssumptions(s,d,{...a,targetMargin:.3}),/interimMargin/);
 const config={trials:40,seed:'margin-rejection',drivers:{targetMargin:{type:'uniform',low:.1,high:.4}}};const first=simulateCurrent(s,d,config);assert.deepEqual(simulateCurrent(s,d,config),first);assert.ok(first.accepted>0&&first.accepted<40);
 for(const row of first.scenarios){const a={...d.assumptions,...Object.fromEntries(['growth','targetMargin','salesCapital','wacc'].map(k=>[k,row[k]]))};const dd={...d,assumptions:a,marginPath:{...d.marginPath,interimMargin:d.marginPath.interimMargin+a.targetMargin-d.assumptions.targetMargin}};near(row.perShare,calculateCurrent(s,dd).perShare);}
});
test('Guided margin: restore and freeze preserve authored curve, reject malformed fields without fallback',()=>{
 const {company,raw,snapshot:s,draft:d}=context();path(d);const restored=safeDraft(structuredClone(d),company,raw,{baseCases:research});assert.deepEqual(restored.marginPath,d.marginPath);assert.deepEqual(calculateCurrent(s,restored),calculateCurrent(s,d));assert.deepEqual(freezeCurrent(s,restored).draft.marginPath,d.marginPath);restored.marginPath.interimYear=9;assert.equal(d.marginPath.interimYear,3);
 for(const invalid of [null,{},'path',{...d.marginPath,interimYear:null},{...d.marginPath,terminalYear:6},{...d.marginPath,enabled:'true'},{...d.marginPath,startMargin:.5}]){const bad={...d,marginPath:invalid};assert.throws(()=>calculateCurrent(s,bad));assert.throws(()=>calculateCurrent(s,safeDraft(structuredClone(bad),company,raw,{baseCases:research})));}
 for(const key of ['targetMargin','growth','years']){const bad=structuredClone(d);bad.assumptions[key]=null;assert.throws(()=>calculateCurrent(s,safeDraft(bad,company,raw)));}
});
test('Guided margin: AAOI and GOOG retain snapshot claims and staged capital calendar',()=>{
 for(const ticker of ['AAOI','GOOG']){const {snapshot:s,draft:d}=context(ticker),claims=structuredClone(d.claims);path(d);const before=structuredClone(d);const v=calculateCurrent(s,d);assert.deepEqual(d,before);assert.deepEqual(d.claims,claims);assert.ok(v.claimsBridge);assert.equal(v.rows.length,18);const baseline={...structuredClone(d)};delete baseline.marginPath;const old=operatingAssumptions(s,baseline,baseline.assumptions),now=operatingAssumptions(s,d,d.assumptions);if(old.yearlyOverrides)for(let i=0;i<10;i++)for(const k of ['growth','salesCapital'])assert.equal(now.yearlyOverrides[i][k],old.yearlyOverrides[i][k]);}
});
test('Guided margin: all legacy, v1 and v2 growth modes hold terminal margin through longer growth or capital calendars',()=>{
 for(const schemaVersion of [1,2])for(const mode of ['immediate','maintain','annual']){
  const {snapshot:s,draft:d}=context();d.assumptions.years=20;d.operatingProfile={id:'flexible-growth-v1',schemaVersion,mode,explicitYears:mode==='immediate'?0:3,subsequentGrowth:mode==='annual'?[.2,.15]:[]};
  if(schemaVersion===2)Object.assign(d.operatingProfile,{marginMaturityYears:10,capitalMaturityYears:25,capitalHoldYears:3});
  path(d,{interimYear:2,declineStartYear:5,terminalYear:8});const a=operatingAssumptions(s,d,d.assumptions);assert.equal(a.years,schemaVersion===2?25:20);
  for(let i=7;i<a.years;i++)assert.equal(a.yearlyOverrides[i].margin,.16);
  const plain=structuredClone(d);delete plain.marginPath;const b=operatingAssumptions(s,plain,plain.assumptions);
  for(let i=0;i<a.years;i++)for(const key of ['growth','salesCapital'])assert.equal(a.yearlyOverrides[i][key],b.yearlyOverrides[i][key]);
 }
});

test('Guided margin: authored phase edits stay dirty, research reload clears them, disabling retains current scalars',()=>{
 const {company,raw,snapshot:s,draft:d}=context();path(d);const before=structuredClone(d),restored=safeDraft(d,company,raw,{baseCases:research});assert.equal(restored.assumptionProvenance.userEdited,true);
 const generic=draftFor(company,raw);generic.marginPath={enabled:false};assert.equal(isUntouchedGenericDraft(generic,company,raw),false);
 const loaded=loadResearchedBaseCase(d,company,raw,research);assert.equal(loaded.marginPath,undefined);assert.deepEqual(d,before);assert.deepEqual(calculateCurrent(s,loaded),calculateCurrent(s,context().draft));
 const disabled=structuredClone(d);disabled.marginPath.enabled=false;const simple=structuredClone(disabled);delete simple.marginPath;
 assert.deepEqual(disabled.assumptions,d.assumptions);assert.deepEqual(calculateCurrent(s,disabled),calculateCurrent(s,simple));assert.equal(disabled.marginPath.interimMargin,.3);
});
test('Guided margin: simulations disclose parallel anchor stress and nonfinite values fail closed',()=>{
 const {snapshot:s,draft:d}=context();path(d);const sim=simulateCurrent(s,d,{trials:2});assert.ok(sim.warnings.some(w=>/terminal-margin draw shifts interim and terminal/.test(w)));
 d.assumptions.salesCapital=1e-308;assert.throws(()=>calculateCurrent(s,d),/nonfinite/);assert.throws(()=>simulateCurrent(s,d,{trials:2}),/nonfinite/);assert.throws(()=>freezeCurrent(s,d),/nonfinite/);
});

test('Guided margin: active explanations replace underlying margin convergence and staged sampling descriptions',()=>{
 for(const ticker of ['AAOI','AMZN']){const {snapshot:s,draft:d}=context(ticker);path(d);const v=calculateCurrent(s,d),sim=simulateCurrent(s,d,{trials:2});assert.match(v.operatingProfile.note,/interim target/);assert.match(v.operatingProfile.note,/Growth and capital efficiency keep their existing calendars/);assert.doesNotMatch(v.operatingProfile.note,/Margin converges|profitability reached during/);assert.ok(sim.warnings.some(w=>/interim target/.test(w)));assert.ok(!sim.warnings.some(w=>/AAOI uses the documented staged capacity profile/.test(w)));}
});

test('Guided margin: sampled effective metadata matches interim, first and terminal rows',()=>{
 const {snapshot:s,draft:d}=context();path(d);const before=structuredClone(d),a={...d.assumptions,targetMargin:.21};const v=valueCurrentWithClaims(s,d,a),p=v.operatingProfile.marginPath;
 near(p.interimMargin,.35);near(p.terminalMargin,.21);near(p.startMargin,s.ebit/s.revenue);
 near(v.rows[0].margin,p.startMargin+(.35-p.startMargin)/3);near(v.rows[2].margin,.35);near(v.rows.at(-1).margin,.21);near(v.terminalNopat,v.rows.at(-1).revenue*(1+a.terminalGrowth)*p.terminalMargin*(1-a.tax));
 assert.deepEqual(d,before);assert.equal(v.assumptions.targetMargin,.21);
});
