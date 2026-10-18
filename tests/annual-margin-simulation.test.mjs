import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchDraftFor,calculateResearchOperating} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {annualMarginPathIssues,annualMarginStartingPoint} from '../dist/annual-margin-path.js';
import {MARGIN_PATH_VERSION,marginAtYear} from '../dist/margin-path.js';
import {researchStressDraft,simulateResearch,simulateResearchAsync,simulationResearchDefaults,RESEARCH_SIMULATION_DRIVER_KEYS} from '../dist/research-simulation.js';
const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const company=ticker=>companies.find(c=>c.ticker===ticker);
const config=(shift=0)=>({...simulationResearchDefaults(),trials:5,drivers:{marginShift:{type:'fixed',value:shift}}});
function pathDraft(ticker,horizon){
 const c=company(ticker),base=researchDraftFor(c),d=horizon?deriveAnnualGrowthHorizon(base,c,{growthMaturityYear:horizon}):base;
 d.marginPath={enabled:true,version:MARGIN_PATH_VERSION,startMargin:.12,interimMargin:.32,interimYear:3,declineStartYear:6,terminalMargin:.18,terminalYear:10,startingMarginSource:annualMarginStartingPoint(d)};
 d.terminal.margin=.18;d.marginPath.generatedMargins=d.annual.map(r=>marginAtYear(d.marginPath,r.year));
 d.annual.forEach((r,i)=>{r.margin=d.marginPath.generatedMargins[i];});
 d.annual[1].margin=.245;d.marginPath.manualOverrides={'2':.245};
 return d;
}
for(const horizon of [undefined,10,15,20])test(`annual margin MC: ${horizon||'legacy horizon'} anchors start and shifts future targets while preserving manual offsets and dates`,()=>{
 const d=pathDraft('GOOG',horizon),before=structuredClone(d),zero=researchStressDraft(d);
 assert.deepEqual(zero,d);assert.deepEqual(annualMarginPathIssues(d),[]);
 const s=researchStressDraft(d,{marginShift:.025});
 assert.equal(s.marginPath.startMargin,d.marginPath.startMargin);
 for(const key of ['interimMargin','terminalMargin'])assert.equal(s.marginPath[key],d.marginPath[key]+.025);
 for(const key of ['interimYear','declineStartYear','terminalYear'])assert.equal(s.marginPath[key],d.marginPath[key]);
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-14,`${a} != ${b}`);
 // Independent affine-shape oracle: only future targets move, so the shift
 // ramps from zero to the full stress at the interim year, then stays full.
 d.annual.forEach((r,i)=>{const delta=.025*Math.min(1,r.year/d.marginPath.interimYear);near(s.annual[i].margin,r.margin+delta);near(s.marginPath.generatedMargins[i],d.marginPath.generatedMargins[i]+delta);near(s.annual[i].margin-s.marginPath.generatedMargins[i],r.margin-d.marginPath.generatedMargins[i]);});
 near(s.marginPath.manualOverrides['2'],.245+.025*2/3);
 assert.equal(s.marginPath.simulationMarginShift,.025);assert.deepEqual(s.marginPath.startingMarginSource,d.marginPath.startingMarginSource);
 assert.deepEqual(annualMarginPathIssues(s),[]);assert.deepEqual(d,before);
 assert.equal(simulateResearch(d,config()).median,calculateResearchOperating(d).enterprise);
 const r=simulateResearch(d,config(.025));assert.equal(r.accepted,5);assert.equal(r.median,calculateResearchOperating(s).enterprise);assert.match(r.method.margin,/Anchored-start margin sensitivity/);
});
test('annual margin MC: seeded async runs and serialized trial replays preserve target metadata',async()=>{
 const d=pathDraft('MSFT',20),c={...config(),trials:23,seed:'margin-path-replay',drivers:{marginShift:{type:'uniform',low:-.04,high:.06},growthPremium:{type:'triangular',low:-.01,mode:0,high:.02}}};
 const r=simulateResearch(d,c);assert.deepEqual(r,await simulateResearchAsync(d,c,{chunkSize:4,yieldControl:async()=>{}}));
 const exported=JSON.parse(JSON.stringify({draft:d,...r}));
 for(const scenario of exported.scenarios){const stresses=Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,scenario[k]])),replay=researchStressDraft(exported.draft,stresses,exported.config.capitalPolicy);assert.deepEqual(annualMarginPathIssues(replay),[]);assert.equal(calculateResearchOperating(replay).enterprise,scenario.enterprise);}
});
test('annual margin MC: invalid shifted targets and margins are excluded without clipping',()=>{
 const d=pathDraft('AAPL',15);d.marginPath.startMargin=.99;
 const shifted=researchStressDraft(d,{marginShift:.02});assert.equal(shifted.marginPath.startMargin,.99);assert.deepEqual(annualMarginPathIssues(shifted),[]);
 d.marginPath.interimMargin=.99;assert.throws(()=>researchStressDraft(d,{marginShift:.02}),/interimMargin/);
 const r=simulateResearch(d,config(.02));assert.equal(r.accepted,0);assert.equal(r.excluded,5);
 const wide=simulateResearch(pathDraft('GOOG',15),config(1));assert.equal(wide.accepted,0);assert.equal(wide.excluded,5);
});
test('annual margin MC: absent and explicitly disabled paths preserve legacy and derived scenarios exactly',()=>{
 for(const horizon of [undefined,10,15,20]){
  const base=researchDraftFor(company('GOOG')),d=horizon?deriveAnnualGrowthHorizon(base,company('GOOG'),{growthMaturityYear:horizon}):base;
  const disabled=structuredClone(d);disabled.marginPath={enabled:false};const a=simulateResearch(d,config(.02)),b=simulateResearch(disabled,config(.02));
  assert.deepEqual(a.scenarios,b.scenarios);assert.deepEqual(a.method,b.method);assert.deepEqual(a.samples,b.samples);assert.equal(a.method.margin,undefined);
  assert.deepEqual(researchStressDraft(disabled,{marginShift:.02}).marginPath,{enabled:false});
 }
});
