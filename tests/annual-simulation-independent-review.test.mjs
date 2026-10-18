// Independent integration review. Synthetic DOM only; no browser-paint claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {minimalDocument,bundledResearch} from './research-workspace-harness.mjs';
import {fixture} from './v7-simulation-harness.mjs';
import {researchDraftFor,RESEARCH_STORAGE_PREFIX} from '../dist/research-model.js';
import {mountResearchWorkspace} from '../dist/research-view.js';
import {annualResearchSimulationAdapter,mountAnnualResearchSimulation} from '../dist/research-simulation-view.js';
import {simulateResearch,simulationResearchDefaults} from '../dist/research-simulation.js';

const library=bundledResearch(),company=ticker=>library.companies.find(c=>c.ticker===ticker);
const close=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=Math.max(1,Math.abs(expected))*3e-12,`${label}: ${actual} != ${expected}`);
const smallConfig=()=>({...simulationResearchDefaults(),method:'legacy',trials:7,seed:'independent-integration'});

// Expected values use source fields and explicit arithmetic, never the production
// DCF, path-transform or timing helper. Both timing branches are covered.
test('independent annual review: nonzero stress and as-of timing reconcile for every source case',()=>{
 const stress={growthPremium:.013,marginShift:-.007,investmentMultiplier:1.17,waccShift:.004};
 for(const c of library.companies)for(const capitalPolicy of ['fixed-schedule','revenue-scaled']){
  const d=researchDraftFor(c),stub=-321.25,stubRate=.117;
  d.timing={mode:'as-of-scenario',asOf:'2026-10-17',stubFCFF:stub,stubDiscountRate:stubRate,reason:'Independent explicit partial-year cash-flow scenario'};
  let sourcePrior=c.anchor.revenue,trialPrior=sourcePrior,discount=1,forecast=0;
  for(let i=0;i<c.annual.length;i++){
   const row=c.annual[i],premium=stress.growthPremium*(c.annual.length-1-i)/(c.annual.length-1);
   const revenue=trialPrior*(row.revenue/sourcePrior+premium);
   const ebit=revenue*(row.operatingMargin+stress.marginShift);
   const investment=row.reinvestment*stress.investmentMultiplier*(capitalPolicy==='revenue-scaled'?revenue/row.revenue:1);
   discount*=1+row.wacc+stress.waccShift;
   forecast+=(ebit-Math.max(0,ebit)*row.taxRate-investment)/discount;
   sourcePrior=row.revenue;trialPrior=revenue;
  }
  const t=c.terminal,nopat=trialPrior*(1+t.growth)*(t.operatingMargin+stress.marginShift)*(1-t.taxRate);
  const terminal=nopat*(1-t.growth/t.ROIC)/(t.wacc+stress.waccShift-t.growth)/discount;
  const origin=forecast+terminal,elapsed=(Date.parse(d.timing.asOf)-Date.parse(d.discountOrigin))/(365.25*86400000);
  const expected=elapsed<0?(origin+stub)/(1+stubRate)**(-elapsed):(origin-stub/(1+c.annual[0].wacc+stress.waccShift))*(1+c.annual[0].wacc+stress.waccShift)**elapsed;
  const config={...smallConfig(),capitalPolicy,drivers:Object.fromEntries(Object.entries(stress).map(([k,value])=>[k,{type:'fixed',value}]))};
  const actual=simulateResearch(d,config);
  close(actual.median,expected,c.ticker+' '+capitalPolicy+' as-of');
  close(actual.scenarios[0].originEnterprise,origin,c.ticker+' origin');
  close(actual.scenarios[0].forecastPV,forecast,c.ticker+' forecast');
  close(actual.scenarios[0].terminalPV,terminal,c.ticker+' terminal');
  assert.equal(actual.timing.date,'2026-10-17');
  assert.equal(actual.accepted,7);
  if(['AAOI','NBIS'].includes(c.ticker))assert.equal(actual.bridgeCoverage.complete,false,c.ticker+' remains blocked');
 }
});

test('independent annual review: malformed falsy saved configs fail closed and remain recoverable',()=>{
 for(const config of [false,0,'']){
  const draft=researchDraftFor(company('AAPL'));draft.researchSimulationConfig=config;
  const h=fixture({reduced:true,autoplay:false,draftOverride:draft,snapshotOverride:{ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId}},adapter:annualResearchSimulationAdapter(draft)});
  try{
   assert.equal(h.get('#mc-chart'),null,JSON.stringify(config)+' must not silently become defaults');
   assert.match(h.get('#mc-error').textContent,/Saved uncertainty settings are invalid/);
   assert.equal(draft.researchSimulationConfig,config);
  }finally{h.cleanup();}
 }
});

async function integratedWorkspace(storage){
 const document=minimalDocument(),root=document.root,proto=Object.getPrototypeOf(root);
 proto.replaceChildren=function(){this.innerHTML='';};
 document.documentElement={dataset:{theme:'forest'}};
 const saved=Object.fromEntries(['document','matchMedia'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 globalThis.document=document;globalThis.matchMedia=()=>({matches:true});
 const workspace=await mountResearchWorkspace(root,{
  fetcher:async()=>({ok:true,json:async()=>structuredClone(library)}),
  storage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
  simulationMount:(target,options)=>mountAnnualResearchSimulation(target,{...options,synchronous:true,autoplay:false})
 });
 const get=selector=>root.querySelector(selector);
 return {...workspace,get,storage,input(selector,value){const el=get(selector);assert.ok(el,selector);el.value=String(value);el.oninput?.({target:el});},change(selector,value){const el=get(selector);assert.ok(el,selector);el.value=String(value);el.onchange?.({target:el});},action(name){get(`[data-research-action="${name}"]`).click();},cleanup(){workspace.destroy();for(const [key,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}};
}

test('independent annual review: actual workspace and simulator preserve per-company edits across Load, Undo, reset and reload',async()=>{
 const storage=new Map();
 for(const ticker of ['AAPL','MU']){const d=researchDraftFor(company(ticker));d.researchSimulationConfig=smallConfig();storage.set(RESEARCH_STORAGE_PREFIX+ticker,JSON.stringify(d));}
 let h=await integratedWorkspace(storage);
 try{
  h.get('#research-mc-run').click();assert.ok(h.get('#research-mc-chart'));
  h.input('#research-mc-growthPremium-value','1.5');
  h.change('#research-mc-capital-policy','revenue-scaled');
  assert.equal(h.getState().draft.researchSimulationConfig.drivers.growthPremium.value,.015);
  const before=structuredClone(h.getState().draft.researchSimulationConfig);
  h.input('[data-research-input="annual"][data-field="revenue"][data-index="0"]','567890');
  h.get('#research-mc-run').click();assert.ok(h.get('#research-mc-chart'));assert.deepEqual(h.getState().draft.researchSimulationConfig,before);
  h.action('load');assert.deepEqual(h.getState().draft.researchSimulationConfig,before);
  h.action('undo');assert.equal(h.getState().draft.annual[0].revenue,567890);assert.deepEqual(h.getState().draft.researchSimulationConfig,before);
  h.choose('MU');h.input('#research-mc-investmentMultiplier-value','1.25');
  h.choose('AAPL');assert.equal(h.get('#research-mc-growthPremium-value').value,'1.5');assert.equal(h.get('#research-mc-capital-policy').value,'revenue-scaled');
  h.get('#research-mc-reset-distributions').click();assert.equal(h.getState().draft.researchSimulationConfig,null);assert.equal(h.get('#research-mc-growthPremium-value').value,'0');
  h.get('#research-mc-undo-reset').click();assert.deepEqual(h.getState().draft.researchSimulationConfig,before);assert.equal(h.get('#research-mc-growthPremium-value').value,'1.5');
  assert.deepEqual(JSON.parse(storage.get(RESEARCH_STORAGE_PREFIX+'AAPL')).researchSimulationConfig,before);
  h.choose('MU');assert.equal(h.get('#research-mc-investmentMultiplier-value').value,'1.25');
 }finally{h.cleanup();}
 h=await integratedWorkspace(storage);
 try{
  assert.equal(h.getState().company.ticker,'MU');assert.equal(h.get('#research-mc-investmentMultiplier-value').value,'1.25');
  h.choose('AAPL');assert.equal(h.getState().draft.researchSimulationConfig.drivers.growthPremium.value,.015);assert.equal(h.get('#research-mc-growthPremium-value').value,'1.5');assert.equal(h.get('#research-mc-capital-policy').value,'revenue-scaled');h.get('#research-mc-run').click();assert.ok(h.get('#research-mc-chart'));
 }finally{h.cleanup();}
});

test('independent annual review: actual reset Undo preserves invalid saved values through reload',async()=>{
 for(const config of [false,0,'',{trials:0,unrecognized:'retain this metadata'}]){
  const d=researchDraftFor(company('AAPL'));d.researchSimulationConfig=structuredClone(config);
  const storage=new Map([[RESEARCH_STORAGE_PREFIX+'AAPL',JSON.stringify(d)]]);
  let h=await integratedWorkspace(storage);
  try{
   assert.equal(h.get('#research-mc-chart'),null);
   h.get('#research-mc-reset-distributions').click();h.get('#research-mc-run').click();assert.ok(h.get('#research-mc-chart'));assert.equal(h.getState().draft.researchSimulationConfig,null);
   h.get('#research-mc-undo-reset').click();assert.equal(h.get('#research-mc-chart'),null);assert.deepEqual(h.getState().draft.researchSimulationConfig,config);
  }finally{h.cleanup();}
  h=await integratedWorkspace(storage);
  try{assert.equal(h.get('#research-mc-chart'),null);assert.deepEqual(h.getState().draft.researchSimulationConfig,config);assert.match(h.get('#research-mc-error').textContent,/Saved uncertainty settings are invalid/);}
  finally{h.cleanup();}
 }
});

test('independent annual review: claim edits immediately withhold and restore the actual common-share chart option',async()=>{
 const d=researchDraftFor(company('LITE'));d.bridgeInputs.convertiblePremiumClaim=null;d.researchSimulationConfig=smallConfig();
 const storage=new Map([[RESEARCH_STORAGE_PREFIX+'LITE',JSON.stringify(d)],[RESEARCH_STORAGE_PREFIX+'selection','LITE']]);
 const h=await integratedWorkspace(storage);
 try{
  h.get('#research-mc-run').click();assert.ok(h.get('#research-mc-chart'));assert.equal(h.get('#research-mc-value-basis').querySelector('[value="perShare"]'),null);
  h.input('[data-research-input="bridge"][data-field="convertiblePremiumClaim"]','0');
  h.get('#research-mc-run').click();assert.ok(h.get('#research-mc-value-basis').querySelector('[value="perShare"]'));
  h.change('#research-mc-value-basis','perShare');assert.match(h.get('#research-mc-output').innerHTML,/PER COMMON SHARE/);
  h.input('[data-research-input="bridge"][data-field="convertiblePremiumClaim"]','');
  h.get('#research-mc-run').click();assert.equal(h.get('#research-mc-value-basis').querySelector('[value="perShare"]'),null);assert.match(h.get('#research-mc-output').innerHTML,/OPERATING EV/);
 }finally{h.cleanup();}
});
