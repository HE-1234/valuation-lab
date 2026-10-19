import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {incrementalResearchDraft,incrementalAlternative} from '../dist/incremental-research.js';
import {calculateResearchOperating,researchDraftIssues,restoreResearchDraft,exportResearchCase} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {fixture} from './v7-simulation-harness.mjs';
import {annualLabel} from '../dist/annual-localization.js';
import {setLocale} from '../dist/i18n.js';
import {incrementalEvidenceHTML} from '../dist/incremental-research-view.js';
const r=incrementalRecord('ARM');
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const draft=()=>incrementalResearchDraft({ticker:'ARM',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-10),`${a} != ${b}`);
test('ARM named baselines, exact dated ADS basis and fixed manual trials',()=>{
 const expected={bear:8.475119054202718,base:25.463301826575428,bull:62.42269730253599};
 for(const c of [{name:null,annualCase:r.annualCase},...r.alternatives]){
 const d=c.name?incrementalAlternative(draft(),c.name).draft:draft(),o=calculateResearchOperating(d),b=calculateResearchBridge(d,o.enterprise);
 assert.deepEqual(researchDraftIssues(d),[]);near(b.rawPerShare,expected[c.annualCase.sourceScenario]);near(b.allocationShares,1064.055252);
 assert.equal(b.priceComparisonEligible,false);assert.equal(b.asKnownBacktestEligible,false);
 const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(sim.accepted,3);for(const x of sim.perShare.draws)near(x,b.perShare);
 assert.ok(sim.scenarios.every(x=>x.annualFunding.length===10));
 }
});
test('ARM finite controls, domain and unknown financing rejection',()=>{
 for(const f of r.bridge.options)for(const bad of [null,NaN,Infinity,-Infinity,'0',true,f.min-1,f.max+1]){const d=draft();d.bridgeInputs[f.key]=bad;assert.throws(()=>calculateResearchOperating(d),undefined,f.key+String(bad));}
 for(const k of ['debt','borrowings','currentQuote','newFinancing']){const d=draft();d[k]=1;assert.throws(()=>calculateResearchOperating(d));}
 const d=draft();d.timing.mode='as-of-scenario';assert.throws(()=>calculateResearchOperating(d));
});
test('ARM edited annual investment cannot silently erase analyst floor or terminal convergence',()=>{
 const d=draft();d.annual[0].reinvestment=0;assert.throws(()=>calculateResearchOperating(d));
 const e=draft();e.annual[9].reinvestment*=.99;assert.throws(()=>calculateResearchOperating(e));
 const f=draft();f.annual[8].revenue*=.8;assert.throws(()=>calculateResearchOperating(f));
});
test('ARM bilingual complete provenance and history labels',()=>{
 assert.equal(r.history.length,10);assert.equal(r.guidanceComparisons.length,9);
 try{setLocale('zh-Hans');for(const p of Object.values(r.prose))assert.equal(annualLabel(p.en),p['zh-Hans']);for(const h of r.history){assert.ok(h.basisLabel);assert.equal(annualLabel(h.basisLabel),h.basisLabelZh);}}finally{setLocale('en');}
 const html=incrementalEvidenceHTML(r.annualCase,'history');assert.match(html,/2017/);assert.match(html,/legacy|Legacy|noncomparable|Noncomparable/);
});
test('ARM simulation starts and resets manually only',()=>{const d=draft();d.researchSimulationConfig.trials=3;const h=fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:'ARM',currency:'USD',periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});try{assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);}finally{h.cleanup();}});
test('ARM workspace clears stale values, preserves save and Undo, exports dated gates',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{w.choose('ARM');assert.equal(w.getState().draft.ticker,'ARM');assert.match(w.get('#research-results').textContent,/25\.46/);w.input('#research-notes','ARM conditional');const key=r.bridge.options[0].key,control=w.field('bridge',key);w.input(control,'');assert.doesNotMatch(w.get('#research-results').textContent,/25\.46/);w.input(control,String(r.bridge.options[0].default*(r.bridge.options[0].scale||1)));assert.match(w.get('#research-results').textContent,/25\.46/);assert.equal(w.get('#research-timing-mode'),null);assert.equal(w.get('#annual-growth-horizon'),null);w.get(`[data-incremental-scenario="${r.alternatives[0].name}"]`).click();w.action('undo');assert.equal(w.getState().draft.notes,'ARM conditional');w.action('export');assert.equal(w.downloads[0].value.equityBridge.priceComparisonEligible,false);}finally{w.destroy();}
 const again=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{again.choose('ARM');assert.equal(again.getState().identityError,null);assert.equal(again.getState().draft.notes,'ARM conditional');}finally{again.destroy();}
});
test('ARM generic validation failures explicitly withhold every headline and preserve supplied draft',()=>{
 for(const field of ['revenue','margin','taxRate','reinvestment','wacc']){const d=draft();d.annual[0][field]=null;const saved=structuredClone(d);assert.throws(()=>calculateResearchOperating(d),e=>e.enterprise===null&&e.equity===null&&e.perShare===null&&e.value_per_ads===null);assert.deepEqual(d,saved);}
});
