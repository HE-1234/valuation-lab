import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentResearchDraft,terminalReviewedResearchDraft,loadCurrentResearchPreset,currentResearchPresetStatus} from '../dist/current-research-defaults.js';
import review from '../dist/terminal-growth-review-data.js';
import {studioResearchDraft,validateStudioPresets} from '../dist/studio-research-presets.js';
import {restoreResearchDraft,calculateResearchOperating,researchTimingResult,researchDraftIssues,RESEARCH_STORAGE_PREFIX} from '../dist/research-model.js';
import {simulateResearch,simulationResearchDefaults} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
const bytes=fs.readFileSync(new URL('../dist/data/studio-research-presets-2026-10-17-v1.json',import.meta.url));
const bundle=()=>JSON.parse(bytes),c=ticker=>bundledResearch().companies.find(c=>c.ticker===ticker);
const draft=ticker=>{const b=bundle();return currentResearchDraft(b.presets.find(p=>p.ticker===ticker),b);};
const terminalDraft=ticker=>{const b=bundle();return terminalReviewedResearchDraft(b.presets.find(p=>p.ticker===ticker),b);};
const withoutTime=d=>{const a=structuredClone(d);delete a.updatedAt;return a;};
test('review is additive, public-only and names the exact unchanged source',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),review.sourceSHA256);
 assert.deepEqual(JSON.parse(fs.readFileSync(new URL('../dist/data/terminal-growth-review-2026-10-18-v1.json',import.meta.url))),review);
 assert.doesNotMatch(JSON.stringify(review),/\/workspace\/|\/home\/|file:\/\//);
 assert.equal(review.recommendations.length,14);assert.equal(new Set(review.recommendations.map(r=>r.ticker)).size,14);
 validateStudioPresets(bundle(),bundledResearch());
 for(const r of review.recommendations){assert.ok(r.reason&&r.reasonZhHans&&r.companySourceURLs.length);assert.ok(r.recommendedTerminalGrowth<r.resolvedRiskFreeReference.rate);assert.ok(r.nominal);}
});
test('only three terminal growth assumptions change; all annual, capital, claim and timing fields remain exact',()=>{
 const b=bundle();
 for(const p of b.presets){const old=studioResearchDraft(p,b),d=terminalReviewedResearchDraft(p,b),changed=['GOOG','MSFT','AMZN'].includes(p.ticker);
  for(const key of ['annual','timing','bridgeInputs','bridgeReviewVersion','currentCapitalScenario','currentCapitalProvenance','anchor','discountOrigin','informationAsOf','caseId','forecastHorizonYears','capitalPolicy'])assert.deepEqual(d[key],old[key],p.ticker+':'+key);
  assert.deepEqual(d.terminal,{...old.terminal,growth:changed?.03:old.terminal.growth});
  assert.deepEqual(d.researchSimulationConfig,{...old.researchSimulationConfig,annualTerminal:{...old.researchSimulationConfig.annualTerminal,growth:{type:'fixed',value:d.terminal.growth}}});
  if(!changed)assert.deepEqual(calculateResearchOperating(d),calculateResearchOperating(old),p.ticker);
  assert.equal(restoreResearchDraft(d,c(p.ticker)).error,null);
  assert.equal(d.researchPreset.defaultSimulationConfig.annualTerminal.growth.value,d.terminal.growth);
  if(p.ticker!=='GOOG')assert.equal(currentResearchPresetStatus(d,b),'Complete research preset · annual model');
 }
});
test('reviewed restore rejects forged review/source identity while retaining exact saved data',()=>{
 for(const mutate of [d=>d.terminalGrowthReview.sourceSHA256='wrong',d=>d.terminalGrowthReview.version='future',d=>d.terminalGrowthReview.asOf='2026-10-19',d=>d.terminalGrowthReview.reviewedGrowth=.04,d=>d.terminalGrowthReview.currency='TWD',d=>d.terminalGrowthReview.sourcePresetId='other',d=>d.researchPreset.presetId='other',d=>d.caseId='other',d=>d.currency='TWD',d=>d.discountOrigin='2026-10-18',d=>d.forecastHorizonYears=10]){
  const d=draft('GOOG');mutate(d);const restored=restoreResearchDraft(d,c('GOOG'));assert.ok(restored.error);assert.deepEqual(restored.draft,d);
 }
 const edited=draft('GOOG');edited.terminal.growth=.035;assert.equal(restoreResearchDraft(edited,c('GOOG')).error,null);
 assert.throws(()=>currentResearchDraft({...bundle().presets.find(p=>p.ticker==='GOOG'),presetId:'forged'},bundle()));
});
test('funded terminal formula and guardrails remain active, with unchanged dated GOOG baseline',()=>{
 const d=terminalDraft('GOOG'),o=calculateResearchOperating(d),t=researchTimingResult(d,o);
 assert.equal(o.terminal.reinvestment,o.terminal.nopat*.03/d.terminal.roic);
 assert.equal(o.terminal.fcff,o.terminal.nopat-o.terminal.reinvestment);
 assert.equal(o.terminal.value,o.terminal.fcff/(d.terminal.wacc-.03));
 assert.ok(Math.abs(o.rows.at(-1).growth-.025)<1e-8);assert.ok(o.warnings.some(x=>/growth endpoint/.test(x)));
 assert.equal(t.date,'2026-06-30');assert.ok(Math.abs(calculateResearchBridge(d,t.enterprise,{...d.bridgeInputs,calculationDate:t.date}).perShare-214.86084474340134)<1e-9);
 for(const mutate of [x=>x.terminal.growth=x.terminal.wacc,x=>x.terminal.roic=0,x=>x.terminal.growth=NaN,x=>x.terminal.growth=.051]){const bad=structuredClone(d);mutate(bad);assert.ok(researchDraftIssues(bad).length);assert.throws(()=>calculateResearchOperating(bad));}
});
test('fixed Monte Carlo parity and reset use the reviewed terminal value for all fourteen',()=>{
 for(const p of bundle().presets){const d=draft(p.ticker),config=simulationResearchDefaults(d);config.trials=2;config.annualPath.innovationSD=0;
  const expected=researchTimingResult(d,calculateResearchOperating(d)).enterprise,s=simulateResearch(d,config);
  assert.equal(s.baseline.enterprise,expected);assert.equal(s.draws[0],expected,p.ticker);assert.equal(s.draws[1],expected,p.ticker);
  const defaults=annualResearchSimulationAdapter(d).defaults();assert.equal(defaults.annualTerminal.growth.value,d.terminal.growth);
 }
});
test('saved old presets and edits remain exact; explicit research applies review and Undo survives reload',async()=>{
 const b=bundle(),p=b.presets.find(p=>p.ticker==='GOOG'),old=studioResearchDraft(p,b);old.terminal.growth=.027;old.annual[0].revenue+=123;old.notes='Keep my note';
 const raw=JSON.stringify(old),key=RESEARCH_STORAGE_PREFIX+'GOOG',storage=new Map([[key,raw],[RESEARCH_STORAGE_PREFIX+'selection','GOOG']]);
 const h=await startResearchWorkspace({storage});assert.deepEqual(h.getState().draft,old);assert.equal(storage.get(key),raw);
 h.action('use-research');assert.equal(h.getState().draft.terminal.growth,.03);assert.equal(h.getState().draft.notes,old.notes);assert.ok(h.getState().draft.terminalGrowthReview);
 const again=await startResearchWorkspace({storage});assert.equal(again.getState().identityError,null);again.action('undo');assert.deepEqual(again.getState().draft,old);
 const loaded=loadCurrentResearchPreset(old,p,b);assert.deepEqual(loaded.undo,old);assert.equal(loaded.draft.terminal.growth,.03);
});
test('fresh UI cases select current wrapper and export separate dated review provenance',async()=>{
 const h=await startResearchWorkspace();
 for(const p of bundle().presets){h.select(p.ticker);assert.deepEqual(withoutTime(h.getState().draft),withoutTime(draft(p.ticker)));}
 h.select('GOOG');h.action('export');assert.equal(h.downloads[0].value.draft.terminalGrowthReview.asOf,'2026-10-18');assert.equal(h.downloads[0].value.draft.informationAsOf,'2026-10-17');
 assert.match(h.get('#research-preset-context').textContent,/Terminal-growth review/);assert.match(h.get('#research-preset-context').textContent,/final explicit growth remains 2.5%/);
 assert.doesNotMatch(h.get('#research-preset-context').textContent,/four-factor model deliberately does not represent/);
});

test('selected GOOG is the exact audited operating case, terminal-funded at 3%, with explicit baseline comparison and Undo',async()=>{
 const asset=JSON.parse(fs.readFileSync(new URL('../dist/data/goog-selected-case-2026-10-18-v1.json',import.meta.url))),d=draft('GOOG');
 for(const key of ['annual','derivedForecast','anchor','bridgeInputs','timing','capitalPolicy','forecastHorizonYears'])assert.deepEqual(d[key],asset.draft[key],key);
 assert.deepEqual(d.terminal,{...asset.draft.terminal,growth:.03});assert.equal(d.selectedResearchScenario.classification,'Selected Google case');
 const operating=calculateResearchOperating(d),timing=researchTimingResult(d,operating),bridge=calculateResearchBridge(d,timing.enterprise,{...d.bridgeInputs,calculationDate:timing.date});
 assert.ok(Math.abs(bridge.perShare-306.61690714794605)<1e-9);assert.equal(timing.date,'2026-06-30');assert.equal(d.annual.length,20);assert.equal(d.annual[4].margin,.35);
 assert.equal(restoreResearchDraft(d,c('GOOG')).error,null);
 const h=await startResearchWorkspace();h.select('GOOG');const before=h.getState().draft;
 assert.match(h.get('#annual-scenario-state').textContent,/Selected Google case/);assert.doesNotMatch(h.get('#research-preset-context').textContent,/bullish/i);
 h.action('terminal-comparison');assert.equal(h.getState().draft.annual.length,15);assert.equal(h.getState().draft.terminal.growth,.03);assert.equal(h.getState().draft.selectedResearchScenario,undefined);
 const again=await startResearchWorkspace({storage:h.storage});again.action('undo');assert.deepEqual(again.getState().draft,before);
 again.action('load');assert.equal(again.getState().draft.terminal.growth,.025);assert.equal(again.getState().draft.annual.length,15);
 again.action('use-research');assert.equal(again.getState().draft.annual.length,20);assert.equal(again.getState().draft.terminal.growth,.03);
});

test('current review and selected scenario have authored Simplified Chinese without changing economics',async()=>{
 const {setLocale}=await import('../dist/i18n.js');
 try{setLocale('zh-Hans');const h=await startResearchWorkspace();h.select('GOOG');const before=h.getState().draft;
  assert.match(h.get('#annual-scenario-state').textContent,/已选 Google 情景/);assert.match(h.get('#research-preset-context').textContent,/终值增长率复核/);assert.match(h.get('#research-preset-context').textContent,/前三年收入增长率/);
  assert.match(h.get('[data-research-action="terminal-comparison"]').textContent,/比较仅调整终值/);
  setLocale('en');assert.deepEqual(h.getState().draft,before);
 }finally{setLocale('en');}
});
