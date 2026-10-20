import {applyTsmReceiptCorrection} from '../dist/tsm-receipt-correction.js';
import {assertFreshJointDefaults} from './joint-default-contract.mjs';
import {currentResearchDraft} from '../dist/current-research-defaults.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
import {startStudio} from './v7-runtime-harness.mjs';
import {RESEARCH_STORAGE_PREFIX,researchDraftFor,calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {researchBridgeDefinition} from '../dist/research-claims.js';
import {simulateResearch,simulationResearchDefaults} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {STUDIO_PRESETS_VERSION,validateStudioPresets,studioResearchDraft,researchPresetStatus} from '../dist/studio-research-presets.js';

const readBundle=()=>JSON.parse(fs.readFileSync(new URL('../dist/data/studio-research-presets-2026-10-17-v1.json',import.meta.url),'utf8'));
const key=ticker=>RESEARCH_STORAGE_PREFIX+ticker;
const withoutTime=d=>{const copy=structuredClone(d);delete copy.updatedAt;return copy;};

test('complete presets: all fourteen validate against unchanged full annual source cases',()=>{
 const bundle=readBundle(),library=bundledResearch();assert.equal(bundle.presets.length,14);
 assert.deepEqual(validateStudioPresets(bundle,library),bundle);
 for(const preset of bundle.presets){
  const d=studioResearchDraft(preset,bundle),source=researchDraftFor(library.companies.find(c=>c.ticker===preset.ticker));
  assert.deepEqual(d.annual,source.annual,preset.ticker);assert.deepEqual(d.terminal,source.terminal,preset.ticker);
  assert.equal(d.forecastHorizonYears,source.forecastHorizonYears);assert.equal(d.researchPreset.version,STUDIO_PRESETS_VERSION);
  for(const option of researchBridgeDefinition(preset.ticker).optionDefinitions)assert.ok(Object.hasOwn(d.bridgeInputs,option.key),preset.ticker+' '+option.key);
  assert.ok(preset.rationale.growthDuration);assert.ok(preset.parameterRationale);assert.ok(preset.simulationRationale);
  assert.equal(preset.simulationConfig.dependence,'independent');assert.equal(preset.simulationConfig.trials,4000);
 }
});

test('complete presets: malformed, duplicate and silently changed operating paths fail closed',()=>{
 const library=bundledResearch();
 for(const mutate of [b=>b.presets.pop(),b=>b.presets[1]=b.presets[0],b=>b.presets[0].annualCase.annual[0].revenue++,b=>b.presets[0].simulationConfig.dependence='calibrated',b=>b.presets[0].annualCase.anchor.provenance.primarySourceUrl='https://example.com/wrong-source',b=>b.presets[0].annualCase.currency='TWD',b=>b.presets[0].annualCase.forecastHorizonYears=20,b=>b.presets[0].timingDefaults.asOf='2026-10-18',b=>b.presets[0].annualCase.valuationTiming.discountOrigin='2026-01-01',b=>b.presets[0].asOf='2026-10-18',b=>b.presets[0].presetId='another-preset']){
  const bundle=readBundle();mutate(bundle);assert.throws(()=>validateStudioPresets(bundle,library));
 }
});

test('complete presets: fresh defaults, company switches and reload retain full preset and simulation settings',async()=>{
 const h=await startResearchWorkspace();
 for(const preset of readBundle().presets){
  h.select(preset.ticker);const d=h.getState().draft;
  assert.deepEqual(withoutTime(d),withoutTime(applyTsmReceiptCorrection(currentResearchDraft(preset,readBundle()))),preset.ticker);
  assert.match(h.get('#research-preset-state').textContent,/Complete research preset/);
  assert.ok(h.get('[data-research-action="use-research"]'));
 }
 const again=await startResearchWorkspace({storage:h.storage});assert.deepEqual(withoutTime(again.getState().draft),withoutTime(h.getState().draft));
});

test('complete presets: existing annual drafts are never upgraded silently',async()=>{
 const c=bundledResearch().companies.find(c=>c.ticker==='MSFT'),d=researchDraftFor(c);
 d.annual[0].revenue=333333;d.bridgeInputs={additionalClaimAllowance:17};d.researchSimulationConfig=simulationResearchDefaults();d.researchSimulationConfig.seed='my-old-seed';d.customEvidence={retained:true};
 const h=await startResearchWorkspace({storage:new Map([[key('MSFT'),JSON.stringify(d)],[key('selection'),'MSFT']])});
 assert.deepEqual(withoutTime(h.getState().draft),withoutTime(d));assert.match(h.get('#research-preset-state').textContent,/Saved annual inputs retained/);
 h.select('AAPL');h.select('MSFT');assert.deepEqual(withoutTime(h.getState().draft),withoutTime(d));
});

test('complete presets: one explicit load replaces every valuation setting and Undo restores exact draft after reload',async()=>{
 const h=await startResearchWorkspace();h.select('LITE');
 h.input(h.field('annual','revenue',0),'7777');h.input(h.field('terminal','margin'),'31');h.input(h.field('bridge','convertiblePremiumClaim'),'4000');h.input('#research-notes','Keep this note');
 h.change('#research-timing-mode','as-of-scenario');h.input(h.field('timing','stubFCFF'),'100');h.input('#research-stub-reason','My stub');
 const before=h.getState().draft;
 h.useResearch('LITE',{originPage:'current'});const selected=readBundle().presets.find(p=>p.ticker==='LITE'),loaded=h.getState().draft;
 assert.deepEqual(loaded.annual,studioResearchDraft(selected,readBundle()).annual);assert.deepEqual(loaded.bridgeInputs,selected.bridgeInputs);assertFreshJointDefaults(loaded.researchSimulationConfig);assert.deepEqual(loaded.researchSimulationConfig.drivers,selected.simulationConfig.drivers);assert.equal(loaded.timing.mode,'origin');assert.equal(loaded.notes,'Keep this note');assert.equal(loaded.bridgeInputs.convertiblePremiumClaim,6052.9);
 const again=await startResearchWorkspace({storage:h.storage});again.action('undo');assert.deepEqual(again.getState().draft,before);assert.deepEqual(again.saved(),before);assert.equal(again.navigations.at(-1),'current');
 const third=await startResearchWorkspace({storage:again.storage});assert.equal(third.get('[data-research-action="undo"]').disabled,true);
});

test('complete presets: duplicate Use research clicks preserve the meaningful pre-load Undo',async()=>{
 const h=await startResearchWorkspace();h.input(h.field('annual','revenue',0),'987654');const before=h.getState().draft;
 h.action('use-research');h.action('use-research');h.action('undo');assert.deepEqual(h.getState().draft,before);
});

test('complete presets: cross-company loads isolate drafts, undo history and legacy namespaces',async()=>{
 const legacy=[['valuation-lab-guided-v5:MSFT:source','{"my":"draft"}'],['valuation-lab-cases','[{"frozen":true}]']];
 const h=await startResearchWorkspace({storage:new Map(legacy)});h.input(h.field('annual','revenue',0),'612345');const aapl=h.getState().draft;
 h.useResearch('MSFT',{originPage:'current'});h.select('AAPL');assert.deepEqual(withoutTime(h.getState().draft),withoutTime(aapl));h.select('MSFT');h.action('undo');
 for(const [k,value] of legacy)assert.equal(h.storage.get(k),value);
});

test('complete presets: malformed saved bytes remain recoverable through load, reload and full Undo',async()=>{
 for(const raw of ['{invalid old draft','null','42',JSON.stringify({ticker:'AAPL',notes:'valuable incompatible draft'})]){
  const h=await startResearchWorkspace({storage:new Map([[key('AAPL'),raw]])});assert.ok(h.getState().identityError);
  h.action('use-research');assert.equal(h.getState().identityError,null);
  const again=await startResearchWorkspace({storage:h.storage});again.action('undo');assert.equal(again.storage.get(key('AAPL')),raw);assert.ok(again.getState().identityError);
 }
});

test('complete presets: blocked storage keeps full load and Undo within this session',async()=>{
 const h=await startResearchWorkspace({storageBlocked:true});h.input(h.field('annual','revenue',0),'567891');const before=h.getState().draft;
 h.action('use-research');h.select('GOOG');h.select('AAPL');h.action('undo');assert.deepEqual(h.getState().draft,before);assert.equal(h.storage.size,0);assert.match(h.get('#research-save-state').textContent,/Storage unavailable/);
});

test('complete presets: an incompatible saved horizon remains intact and full Undo restores every annual row',async()=>{
 const source=bundledResearch().companies.find(c=>c.ticker==='MSFT'),draft=researchDraftFor(source);
 draft.forecastHorizonYears=20;while(draft.annual.length<20)draft.annual.push({...draft.annual.at(-1),year:draft.annual.length+1,period:'My extra explicit year'});
 draft.researchSimulationConfig={...simulationResearchDefaults(),seed:'twenty-year-saved-case'};
 const raw=JSON.stringify(draft,null,2),h=await startResearchWorkspace({storage:new Map([[key('MSFT'),raw],[key('selection'),'MSFT']])});
 assert.ok(h.getState().identityError);h.action('use-research');assert.equal(h.getState().draft.forecastHorizonYears,15);
 const again=await startResearchWorkspace({storage:h.storage});again.action('undo');assert.equal(again.storage.get(key('MSFT')),raw);assert.equal(again.getState().draft.annual.length,20);assert.equal(again.getState().draft.researchSimulationConfig.seed,'twenty-year-saved-case');
});

test('complete presets: absent preset data is disclosed and saved operating work remains usable',async()=>{
 const h=await startResearchWorkspace({presetsMissing:true});assert.ok(h.get('.research-big-value'));assert.match(h.get('#research-preset-context').textContent,/Complete preset unavailable/);assert.equal(h.get('[data-research-action="use-research"]'),null);assert.throws(()=>h.useResearch('AAPL'));
});

test('complete presets: Guided explicitly loads selected complete Annual case without changing Guided inputs',async()=>{
 const calls=[],h=await startStudio({annualWorkspace:{useResearch:(...args)=>calls.push(args)}});h.change('#current-company','GOOG');h.input('#g-growth','23');const before=h.state('GOOG');
 h.get('#use-research').click();assert.deepEqual(calls,[['GOOG',{originPage:'current'}]]);assert.deepEqual(h.state('GOOG'),before);
 assert.match(h.get('.guided-research-preset').textContent,/opens Year-by-year/);assert.match(h.get('#load-base-case').textContent,/earlier Guided inputs/);
});

test('complete presets: real Guided-to-Annual handoff and Undo preserve both models across company selection',async()=>{
 const storage=new Map(),annual=await startResearchWorkspace({storage});annual.select('GOOG');annual.input(annual.field('annual','revenue',0),'712345');const oldAnnual=annual.getState().draft;annual.select('AAPL');
 const guided=await startStudio({storage,annualWorkspace:{useResearch:annual.useResearch}});guided.change('#current-company','GOOG');guided.input('#g-growth','22');const oldGuided=structuredClone(guided.state('GOOG'));
 guided.get('#use-research').click();assert.equal(annual.getState().company.ticker,'GOOG');assert.equal(annual.getState().draft.forecastHorizonYears,20);assert.equal(annual.navigations.at(-1),'renewed');assert.deepEqual(guided.state('GOOG'),oldGuided);
 annual.action('undo');assert.deepEqual(withoutTime(annual.getState().draft),withoutTime(oldAnnual));assert.equal(annual.navigations.at(-1),'current');assert.deepEqual(guided.state('GOOG'),oldGuided);
});

test('complete presets: all fourteen deterministic baselines match Monte Carlo, signed values and bridge gates remain',()=>{
 for(const preset of readBundle().presets){
  const draft=studioResearchDraft(preset,readBundle()),operating=calculateResearchOperating(draft),expected=researchTimingResult(draft,operating).enterprise;
  const fixed=simulateResearch(draft,{...simulationResearchDefaults(),method:'legacy',trials:2});assert.equal(fixed.baseline.enterprise,expected);assert.equal(fixed.draws[0],expected,preset.ticker);
  const sampled=simulateResearch(draft,{...draft.researchSimulationConfig,trials:64});assert.equal(sampled.baseline.enterprise,expected,preset.ticker);assert.equal(sampled.attempts,64);assert.equal(sampled.accepted+sampled.excluded,64);assert.ok(sampled.accepted>0,preset.ticker);
  assert.doesNotMatch(sampled.warnings.join(' '),/All four inputs start Fixed/);
  if(preset.ticker==='NBIS')assert.equal(sampled.bridgeCoverage.eligible,0,'unresolved claims remain a pre-debt diagnostic');
  if(preset.ticker==='AAOI')assert.equal(sampled.bridgeCoverage.complete,true,'explicit option-inclusive capital scenario is repriced in every accepted trial');
  if(preset.ticker==='TSM')assert.match(sampled.units.perShare,/TWD.*ordinary/);
  if(expected<0)assert.ok(fixed.draws[0]<0,'signed negative EV preserved');
 }
});

test('complete presets: MC reset uses versioned research distributions and leaves legacy Fixed reset alone',()=>{
 const bundle=readBundle(),preset=bundle.presets[0],d=studioResearchDraft(preset,bundle),adapter=annualResearchSimulationAdapter(d);
 assertFreshJointDefaults(adapter.defaults());assert.deepEqual(adapter.defaults().drivers,preset.simulationConfig.drivers);assert.match(adapter.defaultNote,/Research preset/);
 const copy=adapter.defaults();copy.seed='changed';assert.notEqual(adapter.defaults().seed,'changed');
 const legacy=researchDraftFor(preset.annualCase);assert.deepEqual(annualResearchSimulationAdapter(legacy).defaults(),simulationResearchDefaults(legacy));
});

test('complete presets: edit state and export show selected values, provenance and rationale',async()=>{
 const h=await startResearchWorkspace();h.input(h.field('terminal','wacc'),'12');assert.match(h.get('#research-preset-state').textContent,/Your changes/);
 assert.match(h.get('#research-preset-context').textContent,/Revenue-growth duration/);assert.match(h.get('#research-preset-context').textContent,/Margin and investment retain their separate/);assert.match(h.get('#research-preset-context').textContent,/seed/);
 h.action('export');const exported=h.downloads[0].value;assert.equal(exported.draft.terminal.wacc,.12);assert.equal(exported.draft.researchPreset.version,STUDIO_PRESETS_VERSION);assert.ok(exported.draft.researchPreset.parameterRationale);
 assert.match(researchPresetStatus(exported.draft,readBundle()),/Your changes/);
});

test('mode strip: outer full-width blue border is removed and compact label spacing is explicit',()=>{
 const css=fs.readFileSync(new URL('../dist/workspace.css',import.meta.url),'utf8');
 assert.match(css,/\.workspace-modebar\{[^}]*border:0/);assert.match(css,/\.mode-navigation\{[^}]*width:fit-content[^}]*padding:6px[^}]*border:0/);assert.match(css,/\.mode-navigation>span\{[^}]*padding:0 14px 0 10px/);
 assert.match(css,/@media\(max-width:650px\)\{\.mode-navigation\{width:100%/);
});
