import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {incrementalResearchDraft,incrementalAlternative,INCREMENTAL_RESEARCH_PATHS} from '../dist/incremental-research.js';
import {calculateResearchOperating,researchDraftIssues,restoreResearchDraft,terminalNormalizedDraft,researchSensitivity} from '../dist/research-model.js';
import {calculateResearchBridge,researchBridgeSensitivity} from '../dist/research-claims.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {fixture} from './v7-simulation-harness.mjs';
import {annualLabel,localizeAnnualPresentation} from '../dist/annual-localization.js';
import {setLocale} from '../dist/i18n.js';
import {incrementalEvidenceHTML} from '../dist/incremental-research-view.js';
import {researchEditorHTML,researchResultsHTML} from '../dist/research-view.js';
import {deriveAnnualGrowthHorizon,extendAnnualForMargin} from '../dist/annual-growth-horizon.js';
import {KEYS_MESSAGES} from '../dist/keys-messages.js';
import {KEYS_ERROR_PAIRS} from '../dist/keys-error-pairs.js';
import {translateSimulationError} from '../dist/simulation-error-i18n.js';
const r=incrementalRecord('KEYS');
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const draft=()=>incrementalResearchDraft({ticker:'KEYS',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-10),`${a} != ${b}`);
const start=storage=>startResearchWorkspace({storage:storage??new Map(),catalogBundle:catalog,incrementalBundle:incrementalPackages});
function localize(w){const proto=Object.getPrototypeOf(w.root),query=proto.querySelectorAll;proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(x=>query.call(this,x.trim())))];};proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};localizeAnnualPresentation(w.root);}

test('KEYS registry dispatch preserves exact dated shares, named cases and fixed manual replay',()=>{
 assert.ok(INCREMENTAL_RESEARCH_PATHS.includes('./data/incremental-KEYS-2026-10-19-v1/cases.json'));
 for(const scenario of [{name:null},...r.alternatives]){
  const d=scenario.name?incrementalAlternative(draft(),scenario.name).draft:draft(),o=calculateResearchOperating(d),b=calculateResearchBridge(d,o.enterprise);
  assert.deepEqual(researchDraftIssues(d),[]);assert.equal(d.discountOrigin,'2026-07-31');assert.equal(d.informationAsOf,'2026-10-19');near(b.basicShares,170.244745);assert.equal(b.shareReferenceDate,'2026-08-27');
  for(const key of ['priceComparisonEligible','asKnownBacktestEligible','currentValuationEligible','rankingEligible'])assert.equal(b[key],false,key);
  const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(sim.accepted,3);for(const x of sim.perShare.draws)near(x,b.perShare);assert.ok(sim.scenarios.every(x=>x.annualFunding.length===10));
  const sensitivity=researchSensitivity(d);near(sensitivity.base,o.enterprise);near(sensitivity.rates.find(x=>x.waccShift===0).enterprise,o.enterprise);
  assert.throws(()=>terminalNormalizedDraft(d),/KEYS/);assert.throws(()=>deriveAnnualGrowthHorizon(d,r.annualCase,{growthMaturityYear:15}),/KEYS/);assert.throws(()=>extendAnnualForMargin(d,r.annualCase,15),/KEYS/);
  if((scenario.annualCase??r.annualCase).sourceScenario==='bear')assert.ok(o.terminal.operatingFloor>o.terminal.roicFloor);
 }
});
test('KEYS bilingual notes, complete errors, rolling labels and accounting-break history are authored',()=>{
 try{setLocale('zh-Hans');for(const p of Object.values(r.prose))assert.equal(annualLabel(p.en),p['zh-Hans']);for(const pair of [...Object.values(KEYS_MESSAGES),...KEYS_ERROR_PAIRS]){assert.ok(pair[1],pair[0]);assert.match(annualLabel(pair[0]),/[\u3400-\u9fff]/,pair[0]);assert.equal(translateSimulationError(pair[0]),pair[1]);}
  for(const h of r.history){assert.ok(h.basisLabel);assert.equal(annualLabel(h.basisLabel),h.basisLabelZh);}
  assert.equal(annualLabel(r.annualCase.anchor.period),r.annualCase.anchor.periodZh);assert.match(annualLabel(r.bridge.shareBasis),/[\u3400-\u9fff]/);
  for(let y=2027;y<=2036;y++)assert.equal(annualLabel(`12M Jul ${y}`),`截至 ${y} 年七月的十二个月`);
  const editor=researchEditorHTML(r.annualCase,draft());assert.match(editor,/截至 2027 年七月/);assert.doesNotMatch(editor,/id="research-timing-mode"/);
 }finally{setLocale('en');}
 const html=incrementalEvidenceHTML(r.annualCase,'history');assert.match(html,/2016/);assert.match(html,/ASC|pension|Pension|comparab|Comparab/);
});
test('KEYS annual funding and terminal operating floors are visible; normalization controls are absent',()=>{
 const d=draft(),html=researchResultsHTML(r.annualCase,d);
 assert.match(html,/keys-funding-diagnostics/);assert.match(html,/KEYS annual capital floors and treasury/);assert.match(html,/Phased ROIC/);assert.match(html,/12M Jul 2027/);assert.match(html,/170,244,745/);assert.match(html,/27-day mismatch/);assert.match(html,/revolver|Revolver/);
 assert.doesNotMatch(html,/data-research-action="normalize"|Three-year capital normalization v1/);
 const adapter=annualResearchSimulationAdapter(d);assert.equal(adapter.fixedNote,KEYS_MESSAGES.terminal[0]);assert.match(adapter.relationshipsMarkup(d.researchSimulationConfig),/max\(NOPAT/);
});
test('KEYS bridge sensitivities recompute operating funding and retain invalid examples visibly',()=>{
 const d=draft(),rows=researchBridgeSensitivity(d,calculateResearchOperating(d).enterprise);assert.ok(rows.length>=r.bridge.options.length);assert.ok(rows.every(row=>Number.isFinite(row.parameterValue)));assert.ok(rows.some(row=>row.status==='invalid'));assert.ok(rows.filter(row=>row.status==='invalid').every(row=>typeof row.error==='string'&&row.error.length>0));
});
test('KEYS workspace adds one ready company, clears stale values, restores Undo and exports dated gates',async()=>{
 const storage=new Map(),w=await start(storage);try{
  assert.equal(w.root.querySelectorAll('[data-research-company]').length,30);w.choose('KEYS');assert.equal(w.getState().readiness,'ready');assert.ok(w.get('#research-results').querySelector('.research-big-value'));assert.match(w.get('.incremental-keys-claim-limits').textContent,/170,244,745/);
  assert.equal(w.get('#research-timing-mode'),null);assert.equal(w.get('#annual-growth-horizon'),null);assert.equal(w.get('[data-research-action="normalize"]'),null);
  w.input('#research-notes','KEYS retained notes');const key=r.bridge.options[0].key,selector=w.field('bridge',key),value=w.getState().draft.bridgeInputs[key];w.input(selector,'');assert.equal(w.get('#research-results').querySelector('.research-big-value'),null);w.input(selector,String(value*(r.bridge.options[0].scale||1)));assert.ok(w.get('#research-results').querySelector('.research-big-value'));
  const before=structuredClone(w.getState().draft);w.get(`[data-incremental-scenario="${r.alternatives[0].name}"]`).click();w.action('undo');assert.deepEqual(w.getState().draft,before);
  w.action('export');assert.equal(w.downloads[0].value.equityBridge.priceComparisonEligible,false);assert.equal(w.downloads[0].value.equityBridge.shareReferenceDate,'2026-08-27');assert.equal(w.downloads[0].value.draft.notes,'KEYS retained notes');
  w.choose('ARM');assert.equal(w.getState().readiness,'ready');w.choose('KEYS');assert.equal(w.getState().draft.notes,'KEYS retained notes');
 }finally{w.destroy();}
 const again=await start(storage);try{again.choose('KEYS');assert.equal(again.getState().identityError,null);assert.equal(again.getState().draft.notes,'KEYS retained notes');}finally{again.destroy();}
});
test('KEYS compact display preserves exact focus values and locale switches never mutate the draft',async()=>{
 const w=await start();localize(w);try{w.choose('KEYS');const before=structuredClone(w.getState().draft),input=w.get('#annual-year-growth');assert.ok(input);const exact=input.dataset.raw;assert.ok(exact);assert.ok(!/\.\d{3}/.test(input.value));input.onfocus?.({target:input});assert.equal(Number(input.value),Number(exact));input.onblur?.({target:input});assert.deepEqual(w.getState().draft,before);
  setLocale('zh-Hans');assert.match(w.get('#research-results').textContent,/普通股|条件/);assert.match(w.get('.toolbar-period').textContent,/截至 2026 年七月/);assert.deepEqual(w.getState().draft,before);setLocale('en');assert.deepEqual(w.getState().draft,before);
 }finally{setLocale('en');w.destroy();}
});
test('KEYS simulation starts and resets only on manual action',()=>{
 const d=draft();d.researchSimulationConfig.trials=3;const h=fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:'KEYS',currency:'USD',periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});
 try{h.runTimers();assert.equal(h.get('#mc-chart'),null);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-reset-distributions').click();h.runTimers();assert.equal(h.get('#mc-chart'),null);}finally{h.cleanup();}
});
test('KEYS malformed annual inputs explicitly suppress all headlines without altering saved drafts',()=>{
 for(const field of ['revenue','margin','taxRate','reinvestment','wacc']){const d=draft();d.annual[0][field]=null;const before=structuredClone(d);assert.throws(()=>calculateResearchOperating(d),e=>e.enterprise===null&&e.equity===null&&e.perShare===null);assert.deepEqual(d,before);}
 const d=draft();d.bridgeInputs.minimumOperatingCash=null;const recovered=restoreResearchDraft(d,r.annualCase);assert.deepEqual(recovered.draft,d);assert.throws(()=>calculateResearchOperating(d));
});
