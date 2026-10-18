import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchDraftFor,calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon,DERIVED_CAPITAL_POLICY} from '../dist/annual-growth-horizon.js';
import {researchStressDraft,simulateResearch,simulateResearchAsync,simulationResearchDefaults,RESEARCH_SIMULATION_DRIVER_KEYS} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {studioResearchDraft} from '../dist/studio-research-presets.js';
import {fixture} from './v7-simulation-harness.mjs';
const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const presets=JSON.parse(fs.readFileSync(new URL('../dist/data/studio-research-presets-2026-10-17-v1.json',import.meta.url)));
const company=ticker=>companies.find(c=>c.ticker===ticker);
const draft=(ticker,horizon=15)=>deriveAnnualGrowthHorizon(researchDraftFor(company(ticker)),company(ticker),{growthMaturityYear:horizon});
const config=(stress={},extra={})=>({...simulationResearchDefaults(),method:'legacy',trials:7,...extra,drivers:Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,{type:'fixed',value:{growthPremium:0,marginShift:0,investmentMultiplier:1,waccShift:0,...stress}[k]}]))});
const close=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*2e-12,`${a} != ${b}`);

for(const c of companies)for(const horizon of [10,15,20])test(`derived simulation: ${c.ticker} / ${horizon} zero stress exactly retains edited deterministic economics`,()=>{
 const d=draft(c.ticker,horizon);d.annual[0].reinvestment=-123.4567;d.annual.at(-1).reinvestment+=73.123;
 const before=structuredClone(d),p=researchStressDraft(d),r=simulateResearch(d,config());
 assert.deepEqual(p.annual,d.annual);assert.deepEqual(d,before);
 assert.equal(r.median,researchTimingResult(d,calculateResearchOperating(d)).enterprise);
 assert.equal(r.config.capitalPolicy,DERIVED_CAPITAL_POLICY);assert.equal(r.method.capitalPolicy,DERIVED_CAPITAL_POLICY);
 assert.match(r.method.capitalDescription,/Committed-spending-floor-plus-growth/);
 assert.equal(r.method.capitalResponseBaseline,'Current edited annual schedule');
});

test('derived simulation: independently reconciles capital response, multiplier order and falling-revenue floors for every horizon',()=>{
 for(const horizon of [10,15,20])for(const premium of [.03,-.03]){
  const d=draft('GOOG',horizon);d.annual[1].reinvestment=-200;
  const p=researchStressDraft(d,{growthPremium:premium,investmentMultiplier:1.17},'fixed-schedule');
  let previous=d.anchor.revenue,basePrevious=d.anchor.revenue;
  for(let i=0;i<p.annual.length;i++){
   const b=d.annual[i],r=p.annual[i],delta=r.revenue-previous,baseDelta=b.revenue-basePrevious,scale=Math.max(1,r.revenue/b.revenue);
   const expected=(Math.min(b.reinvestment,0)+Math.max(b.reinvestment,0)*scale+Math.max(0,delta-Math.max(0,baseDelta)*scale)/d.derivedForecast.marginalSalesCapital)*1.17;
   close(r.reinvestment,expected);previous=r.revenue;basePrevious=b.revenue;
  }
  if(premium>0)assert.ok(p.annual.some((r,i)=>r.reinvestment>d.annual[i].reinvestment*1.17));
  else for(let i=0;i<p.annual.length;i++)assert.ok(p.annual[i].reinvestment>=d.annual[i].reinvestment*1.17-1e-8);
  assert.deepEqual(p.annual,researchStressDraft(d,{growthPremium:premium,investmentMultiplier:1.17},'revenue-scaled').annual);
 }
});

test('derived simulation: seeded async/export/replay retains effective policy and exact vectors across all horizons',async()=>{
 for(const horizon of [10,15,20]){
  const d=draft('MSFT',horizon),c=config({}, {trials:35,seed:'derived-replay'});
  c.drivers.growthPremium={type:'uniform',low:-.025,high:.04};c.drivers.investmentMultiplier={type:'triangular',low:.8,mode:1,high:1.3};
  const a=simulateResearch(d,c),b=await simulateResearchAsync(d,c,{chunkSize:3,yieldControl:async()=>{}});
  assert.deepEqual(a,b);assert.deepEqual(a,simulateResearch(d,c));assert.notDeepEqual(a.draws,simulateResearch(d,{...c,seed:'other'}).draws);
  const exported=JSON.parse(JSON.stringify({draft:d,...a}));assert.equal(exported.config.capitalPolicy,DERIVED_CAPITAL_POLICY);
  assert.deepEqual(simulateResearch(exported.draft,exported.config),a);
  for(const scenario of exported.scenarios){
   const stresses=Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,scenario[k]]));
   assert.equal(calculateResearchOperating(researchStressDraft(exported.draft,stresses,exported.config.capitalPolicy)).enterprise,scenario.enterprise);
  }
 }
});

test('derived simulation: signed negative outcomes, invalid draws, invalid baseline and unresolved bridges stay gated',()=>{
 const d=draft('TSLA',20),negative=simulateResearch(d,config({investmentMultiplier:100}));
 assert.ok(negative.samples.every(v=>v<0));assert.ok(negative.perShare.samples.every(v=>v<0));assert.equal(negative.zeroEquityCount,7);
 for(const [stress,reason] of [[{growthPremium:-2},'annual-constraints'],[{investmentMultiplier:1e308},'nonfinite-valuation'],[{waccShift:-1},'terminal-constraints']]){
  const r=simulateResearch(d,config(stress));assert.equal(r.accepted,0);assert.equal(r.exclusions[reason],7);
 }
 const malformed=structuredClone(d);malformed.derivedForecast.marginalSalesCapital=0;assert.throws(()=>simulateResearch(malformed,config()),/capital/);
 for(const ticker of ['AAOI','NBIS'])assert.equal(simulateResearch(draft(ticker),config()).bridgeCoverage.complete,false);
});

test('derived simulation: current AAOI claims reprice per scenario; NBIS stays unresolved at every horizon',()=>{
 for(const ticker of ['AAOI','NBIS'])for(const horizon of [10,15,20]){
  const original=studioResearchDraft(presets.presets.find(p=>p.ticker===ticker),presets),d=deriveAnnualGrowthHorizon(original,company(ticker),{growthMaturityYear:horizon});
  const c=config({}, {trials:10});c.drivers.growthPremium={type:'uniform',low:-.01,high:.02};
  const r=simulateResearch(d,c);
  assert.deepEqual(d.currentCapitalScenario,original.currentCapitalScenario);
  if(ticker==='AAOI'){assert.equal(r.bridgeCoverage.complete,true);assert.ok(new Set(r.scenarios.map(s=>s.claims.warrantClaim)).size>1);assert.match(r.method.bridge,/repriced per trial/);}
  else{assert.equal(r.bridgeCoverage.complete,false);assert.equal(r.perShare.accepted,0);}
 }
});

test('derived simulation UI: effective response is explicit and cannot select fixed-dollar free growth',()=>{
 const d=draft('GOOG',20);d.researchSimulationConfig=config();
 const adapter=annualResearchSimulationAdapter(d),markup=adapter.relationshipsMarkup(d.researchSimulationConfig);
 assert.match(markup,/Committed spending floor plus growth/);assert.match(markup,/disabled/);assert.doesNotMatch(markup,/Keep reviewed absolute investment/);
 assert.equal(adapter.validate(d.researchSimulationConfig).capitalPolicy,DERIVED_CAPITAL_POLICY);
 assert.throws(()=>adapter.validate(false),/object/);
 const h=fixture({reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:d.ticker,currency:d.currency,periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter});
 try{assert.ok(h.get('#mc-chart'));assert.match(h.get('#mc-summary-content').innerHTML,/Committed-spending-floor-plus-growth/);}finally{h.cleanup();}
});

test('derived simulation UI: pending and invalid edits withhold exports, superseded run cannot publish, completed export replays',async()=>{
 const d=draft('AAPL',15);d.researchSimulationConfig=config();
 const releases=[],h=fixture({reduced:true,autoplay:false,synchronous:false,yieldControl:()=>new Promise(resolve=>releases.push(resolve)),draftOverride:d,snapshotOverride:{ticker:d.ticker,currency:d.currency,periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});
 const ticks=async()=>{await Promise.resolve();await Promise.resolve();};
 const drain=async()=>{for(let i=0;i<50;i++){if(releases.length)releases.shift()();await ticks();if(!h.get('#mc-export').disabled)break;}};
 try{
  assert.equal(h.get('#mc-export').disabled,true);
  h.get('#mc-seed').value='superseded';h.get('#mc-seed').oninput();h.runTimers();
  h.get('#mc-seed').value='current-derived';h.get('#mc-seed').oninput();h.runTimers();
  await drain();assert.equal(h.get('#mc-export').disabled,false);
  h.get('#mc-export').click();const exported=JSON.parse(await h.exports[0].text());
  assert.equal(exported.config.seed,'current-derived');assert.equal(exported.config.capitalPolicy,DERIVED_CAPITAL_POLICY);assert.equal(exported.draft.schemaVersion,2);
  assert.deepEqual(exported.scenarios,simulateResearch(exported.draft,exported.config).scenarios);
  h.get('#mc-growthPremium-value').value='';h.get('#mc-growthPremium-value').oninput();
  assert.equal(h.get('#mc-export').disabled,true);assert.match(h.get('#mc-error').textContent,/finite|number|required/i);
  const count=h.exports.length;h.get('#mc-export').click();assert.equal(h.exports.length,count);
 }finally{h.cleanup();}
});
