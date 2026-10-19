import test from 'node:test';
import assert from 'node:assert/strict';
import {startStrictSimulationWorkspace as startStrict} from './umc-strict-dom-harness.mjs';
import {mountResearchWorkspace} from '../dist/research-view.js';
const fileFetch=async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../dist/'+path.replace(/^\.\//,''),import.meta.url)))});
const startStrictSimulationWorkspace=options=>startStrict({fetcher:fileFetch,catalogBundle:undefined,incrementalBundle:undefined,...options,workspaceMount:(root,options)=>mountResearchWorkspace(root,{...options,catalogBundle:undefined})});

test('MCD Monte Carlo mounts real parsed HTML without inventing a capital-policy field',async()=>{
 const h=await startStrictSimulationWorkspace();
 try{
  h.choose('MCD');
  assert.equal(h.getState().draft.ticker,'MCD','The real fetched MCD record is selected');
  assert.ok(h.mc('#mc-capital-policy')===null);
  const selected=h.root.querySelectorAll('#research-mc-run, #research-mc-run, #research-mc-capital-policy');assert.equal(selected.length,1,'Selector lists deduplicate real nodes and never invent absent controls');assert.ok(selected[0]===h.mc('#mc-run'));
  assert.deepEqual(h.mountErrors.map(({ticker,error})=>[ticker,error.message]),[]);
  h.get('[data-annual-view="simulation"]').click();
  assert.ok(h.visible(h.mc('#mc-run')),'The actual generated Run button is visible in the selected simulation panel');
  assert.equal(typeof h.mc('#mc-run').onclick,'function');
  assert.equal(h.runs.length,0);
 }finally{h.cleanup();}
});

import {incrementalRecord} from '../dist/incremental-registry.js';
import {incrementalResearchDraft} from '../dist/incremental-research.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {RESEARCH_STORAGE_PREFIX,calculateResearchOperating} from '../dist/research-model.js';
import {simulateResearch,researchStressDraft,researchAnnualPathContext} from '../dist/research-simulation.js';
import {scaleOperatingInvestment} from '../dist/fixed-capital-funding.js';
import {mcdContext} from '../dist/mcd-research-model.js';
import fs from 'node:fs';
import {setLocale,t} from '../dist/i18n.js';
import {MCD_MESSAGES} from '../dist/mcd-messages.js';

const record=incrementalRecord('MCD'),storageKey=researchStorageKey(record.annualCase);
const fresh=()=>incrementalResearchDraft({ticker:'MCD',presetId:record.identity.version,incrementalResearch:record.identity,annualCase:record.annualCase});
const savedDraft=(mutate=()=>{})=>{const draft=fresh();draft.researchSimulationConfig.trials=7;mutate(draft);return new Map([[storageKey,JSON.stringify(draft)],[RESEARCH_STORAGE_PREFIX+'selection','MCD']]);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const edit=(h,id,value,event='input')=>{const node=h.mc(id);assert.ok(node,`Missing real control ${id}`);assert.equal(typeof node['on'+event],'function',`${id} is bound`);node.value=String(value);node.dispatch(event);return node;};
const openSimulation=h=>{h.get('[data-annual-view="simulation"]').click();assert.ok(h.visible(h.mc('#mc-run')));};
const assertMounted=h=>{assert.equal(h.getState().draft.ticker,'MCD','The real fetched MCD record is selected');assert.deepEqual(h.mountErrors.map(({ticker,error})=>[ticker,error.message]),[]);assert.ok(h.mc('#mc-capital-policy')===null);assert.ok(h.mc('#mc-run'));assert.equal(typeof h.mc('#mc-run').onclick,'function');};
const assertEVOnly=(h,run)=>{
 const r=run.result;assert.ok(r,'The real engine returned a result');assert.equal(h.mc('#mc-output').getAttribute('data-result-state'),'current',h.mc('#mc-error').textContent);assert.ok(h.mc('#mc-chart'));
 assert.equal(r.current_target,null);assert.equal(r.current_upside,null);assert.equal(r.funding_certified,false);
 assert.equal(r.enterprise.accepted,run.config.trials);assert.equal(r.equity.accepted,0);assert.equal(r.perShare.accepted,0);assert.equal(r.bridgeCoverage.complete,false);
 const options=h.mc('#mc-value-basis').querySelectorAll('option');assert.deepEqual(options.map(option=>option.value),['enterprise']);assert.equal(h.mc('#mc-value-basis').value,'enterprise');
 for(const scenario of r.scenarios){assert.equal(scenario.perShare,null);assert.equal(scenario.equity,null);assert.equal(scenario.rawPerShare,null);assert.equal(scenario.bridgeStatus,'operating-only');}
 assert.deepEqual(simulateResearch(run.draft,run.config),r,'Visible Run uses the source annual sampler without a replacement financial engine');
};
function sourceReplay(run,scenario){
 const baseline=researchAnnualPathContext(run.draft).baseline;
 const growth=scenario.growthPath.every((g,i)=>g===baseline[i])?undefined:scenario.growthPath;
 const draft=researchStressDraft(run.draft,{},run.config.capitalPolicy,growth);
 for(const [key,values]of Object.entries(scenario.metricPaths))draft.annual.forEach((row,i)=>{
  if(key==='investmentFactor')row.reinvestment=scaleOperatingInvestment(draft,row,values[i]);else row[key]=values[i];
 });
 draft.terminal=structuredClone(scenario.terminal);
 return mcdContext(draft).operating.core_operating_ev;
}

for(const locale of ['en','zh-Hans'])for(const policy of [null,0])test(`MCD ${locale}, policy ${policy??'none'}: actual manual Run remains EV-only and source-engine reproducible`,async()=>{
 setLocale(locale);const h=await startStrictSimulationWorkspace({storage:savedDraft()});
 try{
  assertMounted(h);assert.equal(h.getState().draft.mcdPolicy,null);assert.equal(h.runs.length,0);
  if(policy!==null){h.get('[data-annual-editor="claims"]').click();h.get(`[data-mcd-example="${policy}"]`).click();}
  assertMounted(h);openSimulation(h);
  assert.equal(h.mc('#mc-run').getAttribute('data-i18n'),'simulationManual.run');assert.equal(h.mc('#mc-run').textContent,t('simulationManual.run'));assert.equal(t('simulationManual.run'),locale==='en'?'Run simulation':'运行模拟');assert.ok(h.get('#research-simulation-root').textContent.includes(MCD_MESSAGES.uncertainty[locale==='en'?0:1]));assert.equal(h.mc('#mc-export').disabled,true);
  const selectedPolicy=structuredClone(h.getState().draft.mcdPolicy),capitalPolicy=h.getState().draft.researchSimulationConfig.capitalPolicy;
  h.mc('#mc-tab-sampling').click();const seed=h.mc('#mc-seed');seed.focus();edit(h,'#mc-seed',`strict-${locale}-${policy}`);
  assert.ok(h.document.activeElement===seed,'Edited seed retains focus');assert.ok(h.mc('#mc-seed')===seed,'Edited seed node is stable');assert.equal(h.runs.length,0);
  assert.equal(h.getState().draft.researchSimulationConfig.capitalPolicy,capitalPolicy);
  h.mc('#mc-run').click();assert.equal(h.runs.length,1);assertEVOnly(h,h.runs[0]);
  for(const scenario of h.runs[0].result.scenarios)near(scenario.enterprise,calculateResearchOperating(h.runs[0].draft).enterprise);
  assert.deepEqual(h.getState().draft.mcdPolicy,selectedPolicy);
  h.mc('#mc-tab-growthPremium').click();edit(h,'#mc-annual-innovation-sd','0.1');
  assert.equal(h.runs.length,1);assert.equal(h.mc('#mc-output').getAttribute('data-result-state'),'stale');assert.equal(h.mc('#mc-export').disabled,true);
  h.mc('#mc-run').click();assert.equal(h.runs.length,2);assertEVOnly(h,h.runs[1]);
  assert.ok(new Set(h.runs[1].result.scenarios.map(row=>row.enterprise)).size>1);
  for(const scenario of h.runs[1].result.scenarios)near(scenario.enterprise,sourceReplay(h.runs[1],scenario));
  h.mc('#mc-export').click();assert.equal(h.exports.length,1);const exported=JSON.parse(await h.exports[0].text());
  assert.equal(exported.current_target,null);assert.equal(exported.perShare.accepted,0);assert.equal(exported.config.seed,`strict-${locale}-${policy}`);assert.deepEqual(exported.draft.mcdPolicy,selectedPolicy);
 }finally{h.cleanup();setLocale('en');}
});

test('MCD strict DOM reset, Undo, close/reopen and company switch retain authored settings without sampling',async()=>{
 const storage=savedDraft();let h=await startStrictSimulationWorkspace({storage});
 try{
  h.get('[data-mcd-example="2"]').click();openSimulation(h);h.mc('#mc-tab-sampling').click();edit(h,'#mc-seed','strict-lifecycle');
  h.mc('#mc-tab-growthPremium').click();edit(h,'#mc-annual-innovation-sd','0.2');
  const original=h.getState().draft,config=structuredClone(original.researchSimulationConfig),policy=structuredClone(original.mcdPolicy);
  h.mc('#mc-run').click();assert.equal(h.runs.length,1);assertEVOnly(h,h.runs[0]);
  h.mc('#mc-reset-distributions').click();assertMounted(h);assert.equal(h.getState().draft.researchSimulationConfig,null);assert.equal(h.mc('#mc-trials').value,'5000');assert.equal(h.mc('#mc-seed').value,'annual-research');assert.equal(h.mc('#mc-annual-innovation-sd').value,'0');assert.equal(h.runs.length,1);assert.equal(h.mc('#mc-export').disabled,true);assert.deepEqual(h.getState().draft.mcdPolicy,policy);
  h.mc('#mc-undo-reset').click();assertMounted(h);assert.deepEqual(h.getState().draft.researchSimulationConfig,config);assert.equal(h.mc('#mc-seed').value,'strict-lifecycle');assert.equal(h.runs.length,1);
  h.get('[data-annual-view="result"]').click();assert.equal(h.visible(h.mc('#mc-run')),false);openSimulation(h);assert.equal(h.runs.length,1);
  const oldRun=h.mc('#mc-run');h.choose('AAPL');assert.equal(oldRun.isConnected,false);oldRun.click();assert.equal(h.runs.length,1,'Detached destroyed Run cannot launch work');
  h.choose('MCD');assertMounted(h);openSimulation(h);assert.deepEqual(h.getState().draft.researchSimulationConfig,config);assert.deepEqual(h.getState().draft.mcdPolicy,policy);assert.equal(h.runs.length,1);assert.equal(h.mc('#mc-export').disabled,true);
  h.cleanup();h=await startStrictSimulationWorkspace({storage});assertMounted(h);openSimulation(h);assert.equal(h.runs.length,0);assert.deepEqual(h.getState().draft.researchSimulationConfig,config);assert.deepEqual(h.getState().draft.mcdPolicy,policy);assert.equal(h.mc('#mc-export').disabled,true);
  h.mc('#mc-run').click();assert.equal(h.runs.length,1);assertEVOnly(h,h.runs[0]);
 }finally{h.cleanup();}
});

test('MCD hidden capital policy retains an explicitly saved supported value through edits, reset and Undo',async()=>{
 const h=await startStrictSimulationWorkspace({storage:savedDraft(d=>{d.researchSimulationConfig.capitalPolicy='revenue-scaled';})});
 try{
  assertMounted(h);openSimulation(h);edit(h,'#mc-seed','retained-capital-policy');assert.equal(h.getState().draft.researchSimulationConfig.capitalPolicy,'revenue-scaled');
  h.mc('#mc-run').click();assertEVOnly(h,h.runs[0]);assert.equal(h.runs[0].config.capitalPolicy,'revenue-scaled');
  h.mc('#mc-reset-distributions').click();h.mc('#mc-undo-reset').click();assert.equal(h.getState().draft.researchSimulationConfig.capitalPolicy,'revenue-scaled');assert.equal(h.runs.length,1);
 }finally{h.cleanup();}
});

for(const bad of [{seed:''},[],true,'invalid',{...fresh().researchSimulationConfig,capitalPolicy:'unsupported'}])test(`MCD malformed saved settings ${JSON.stringify(bad).slice(0,65)} are retained and cannot run until reset`,async()=>{
 const storage=savedDraft(d=>{d.researchSimulationConfig=structuredClone(bad);}),raw=storage.get(storageKey),h=await startStrictSimulationWorkspace({storage});
 try{
  assertMounted(h);openSimulation(h);assert.equal(storage.get(storageKey),raw);assert.deepEqual(h.getState().draft.researchSimulationConfig,bad);assert.equal(h.mc('#mc-run').disabled,true);assert.equal(h.mc('#mc-export').disabled,true);h.mc('#mc-run').click();assert.equal(h.runs.length,0);assert.ok(h.mc('#mc-chart')===null,'No chart is rendered');
  h.mc('#mc-reset-distributions').click();assertMounted(h);assert.equal(h.mc('#mc-run').disabled,false);assert.equal(h.runs.length,0);
  h.mc('#mc-undo-reset').click();assertMounted(h);assert.deepEqual(h.getState().draft.researchSimulationConfig,bad);assert.equal(h.mc('#mc-run').disabled,true);assert.equal(h.runs.length,0);
  h.choose('AAPL');h.choose('MCD');assertMounted(h);assert.deepEqual(h.getState().draft.researchSimulationConfig,bad);assert.equal(h.mc('#mc-run').disabled,true);assert.equal(h.mc('#mc-export').disabled,true);
 }finally{h.cleanup();}
});

for(const bad of [{},[],42,{...record.policyExamples[2].policy,minimum_operating_cash:null}])test(`MCD malformed saved policy ${JSON.stringify(bad).slice(0,50)} withholds every valuation and retains bytes`,async()=>{
 const storage=savedDraft(d=>{d.mcdPolicy=structuredClone(bad);}),raw=storage.get(storageKey),h=await startStrictSimulationWorkspace({storage});
 try{
  assertMounted(h);openSimulation(h);assert.equal(storage.get(storageKey),raw);assert.ok(h.get('.research-big-value')===null,'Invalid policy withholds the annual value');assert.notEqual(h.mc('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.mc('#mc-export').disabled,true);if(h.mc('#mc-chart'))assert.equal(h.mc('#mc-output').inert,true,'A retained presentation is inaccessible and explicitly stale');
  h.mc('#mc-run').click();assert.notEqual(h.mc('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.mc('#mc-export').disabled,true);assert.ok(h.mc('#mc-chart')===null,'No chart is rendered');assert.ok(h.runs.every(run=>!run.result));assert.equal(storage.get(storageKey),raw);
  h.choose('AAPL');h.choose('MCD');assert.equal(storage.get(storageKey),raw);assert.deepEqual(h.getState().draft.mcdPolicy,bad);
  h.get('[data-mcd-example="2"]').click();assertMounted(h);assert.deepEqual(h.getState().draft.mcdPolicy,record.policyExamples[2].policy);h.action('undo-edit');assert.deepEqual(h.getState().draft.mcdPolicy,bad);assert.equal(storage.get(storageKey),raw);assert.equal(h.mc('#mc-export').disabled,true);
 }finally{h.cleanup();}
});

const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
for(const locale of ['en','zh-Hans'])test(`MCD ${locale} actual async Run cancels obsolete work after edits, reset, policy changes, switch and destroy`,async()=>{
 setLocale(locale);
 try{for(const action of ['cancel','edit','reset','policy','switch','destroy']){
  const releases=[],h=await startStrictSimulationWorkspace({storage:savedDraft(),synchronous:false,yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
  try{
   assertMounted(h);openSimulation(h);h.mc('#mc-run').click();assert.equal(h.runs.length,1);assert.equal(h.mc('#mc-output').getAttribute('data-result-state'),'pending');assert.equal(h.mc('#mc-run').disabled,true);assert.equal(releases.length,1);h.mc('#mc-run').click();assert.equal(h.runs.length,1,'Busy Run is guarded');
   const obsolete=h.mc('#mc-output'),release=releases.shift();
   if(action==='cancel'){h.mc('#mc-cancel').focus();h.mc('#mc-cancel').click();assert.ok(h.document.activeElement===h.mc('#mc-run'),'Cancel restores focus to real Run');}
   if(action==='edit')edit(h,'#mc-seed','async-edited');
   if(action==='reset'){h.mc('#mc-reset-distributions').click();h.mc('#mc-undo-reset').click();}
   if(action==='policy')h.get('[data-mcd-example="2"]').click();
   if(action==='switch')h.choose('AAPL');
   if(action==='destroy')h.destroy();
   assert.equal(h.runs[0].signal.aborted,true,action);release();await settle();assert.notEqual(obsolete.getAttribute('data-result-state'),'current',action);assert.equal(h.exports.length,0);
   if(action==='destroy'){assert.equal(h.root.children.length,0);continue;}
   if(action==='switch')h.choose('MCD');assertMounted(h);openSimulation(h);assert.notEqual(h.mc('#mc-output').getAttribute('data-result-state'),'current',action);assert.equal(h.mc('#mc-export').disabled,true,action);
   h.mc('#mc-run').click();assert.equal(releases.length,1);releases.shift()();await settle();assert.equal(h.runs.length,2);assertEVOnly(h,h.runs[1]);assert.equal(h.mc('#mc-export').disabled,false);
  }finally{h.cleanup();}
 }}finally{setLocale('en');}
});
