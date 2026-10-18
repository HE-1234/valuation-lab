import {assertFreshJointDefaults,preJointAnnualDefaults} from './joint-default-contract.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {reverseReferencePolicyHooks} from './reference-policy-preservation.mjs';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {incrementalResearchDraft,incrementalAlternative} from '../dist/incremental-research.js';
import {researchDraftFor,calculateResearchOperating,restoreResearchDraft} from '../dist/research-model.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {studioResearchDraft} from '../dist/studio-research-presets.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {simulationResearchDefaults,simulateResearch,simulateResearchAsync,researchAnnualPathContext,validateResearchSimulationConfig} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {REFERENCE_DEFAULT_TICKERS,researchReferenceState} from '../dist/research-reference-defaults.js';
import {referenceStatusMessage} from '../dist/research-reference-status.js';
import {fixture} from './v7-simulation-harness.mjs';
import {startResearchWorkspace,minimalDocument} from './research-workspace-harness.mjs';
import {setLocale,t,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const previous=read('./fixtures/reference-defaults-v52.json'),catalog=read('../dist/data/atlas-company-catalog-v1.json');
const create=ticker=>{const r=incrementalRecord(ticker);return incrementalResearchDraft({ticker,presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});};
const oldConfig=d=>({...structuredClone(previous.incrementalDefaults[d.ticker]),annualTerminal:structuredClone(simulationResearchDefaults(d).annualTerminal)});
const sourceState=d=>structuredClone(Object.fromEntries(['anchor','annual','terminal','openingStub','fixedCapitalFunding','annualFundingPolicy','operatingCashFunding','bridgeInputs','incrementalResearch'].map(k=>[k,d[k]])));
const start=extra=>startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalPackages,...extra});
const state=(d,c)=>researchReferenceState(c,researchAnnualPathContext(d));

test('all V52 shipped files retain exact bytes outside the locked application/presentation hooks',()=>{
 const cwd=new URL('..',import.meta.url),baseline=previous.baseline,paths=execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');
 assert.ok(paths.length>150);
 for(const path of paths)assert.deepEqual(reverseReferencePolicyHooks(path,fs.readFileSync(new URL('../'+path,import.meta.url))),execFileSync('git',['show',baseline+':'+path],{cwd,maxBuffer:20e6}),path);
});

test('reference policy changes only seven fresh uncertainty configs; all fresh counts use the approved 5000 policy',()=>{
 const originals=read('../dist/data/renewed-research-2026-10-17/cases.json').companies,bundle=read('../dist/data/studio-research-presets-2026-10-17-v1.json');
 assert.equal(originals.length,14);assert.equal(bundle.presets.length,14);
 for(const c of originals){const d=researchDraftFor(c);assert.deepEqual(preJointAnnualDefaults(simulationResearchDefaults(d)),{...previous.originalDefaults[c.ticker],trials:5000});assert.equal(annualResearchSimulationAdapter(d).referenceStatusMessage,undefined);}
 for(const p of bundle.presets)assert.deepEqual(preJointAnnualDefaults(annualResearchSimulationAdapter(studioResearchDraft(p,bundle)).defaults()),{...previous.studioDefaults[p.ticker],trials:5000});
 for(const ticker of REFERENCE_DEFAULT_TICKERS.filter(ticker=>Object.hasOwn(previous.incrementalDefaults,ticker))){const d=create(ticker),cfg=simulationResearchDefaults(d),before=oldConfig(d);assert.deepEqual(cfg.annualPath,{fixedYears:[],innovationSD:0,persistence:0});for(const spec of Object.values(cfg.annualMetrics))assert.deepEqual(spec,{fixedYears:[],innovationSD:0,persistence:0});const approved=structuredClone(before);approved.trials=5000;approved.annualPath={fixedYears:[],innovationSD:0,persistence:0};for(const key of Object.keys(approved.annualMetrics))approved.annualMetrics[key]={fixedYears:[],innovationSD:0,persistence:0};assert.deepEqual(preJointAnnualDefaults(cfg),approved);assert.deepEqual(d.researchSimulationConfig,cfg);assert.deepEqual(annualResearchSimulationAdapter(d).defaults(),cfg);}
});

for(const ticker of REFERENCE_DEFAULT_TICKERS.filter(ticker=>Object.hasOwn(previous.incrementalDefaults,ticker)))test(`${ticker} empty selections reproduce each named case and 10/15/20-year horizon exactly`,async()=>{
 const r=incrementalRecord(ticker),base=create(ticker),variants=[base,...r.alternatives.map(a=>incrementalAlternative(base,a.name).draft)];
 for(const source of variants)for(const horizon of [10,15,20]){
  const d=horizon===10?source:deriveAnnualGrowthHorizon(source,r.annualCase,{growthMaturityYear:horizon}),before=sourceState(d),config={...simulationResearchDefaults(d),trials:3,seed:'reference-equivalence'},old={...oldConfig(d),trials:3,seed:config.seed};
  const fresh=simulateResearch(d,config),prior=simulateResearch(d,old);assert.equal(fresh.accepted,3);assert.equal(fresh.excluded,0);assert.equal(fresh.enterprise.median,calculateResearchOperating(d).enterprise);
  for(const key of ['enterprise','equity','perShare','baseline','timing','scenarios','bridgeCoverage'])assert.deepEqual(fresh[key],prior[key],ticker+' '+horizon+' '+key);
  assert.deepEqual(await simulateResearchAsync(d,config,{chunkSize:2,yieldControl:async()=>{}}),fresh);assert.deepEqual(sourceState(d),before);assert.deepEqual(fresh.method.openingStub,d.openingStub);
  assert.equal(fresh.config.method,'joint-annual-path');assertFreshJointDefaults(fresh.config);assert.deepEqual(fresh.config.jointAnnual.annualPath.fixedYears,[]);assert.equal(fresh.annualPaths.terminalYear,researchAnnualPathContext(d).terminalYear);for(const trial of fresh.scenarios)assert.deepEqual(trial.growthPath,researchAnnualPathContext(d).baseline);
 }
});

for(const ticker of REFERENCE_DEFAULT_TICKERS.filter(ticker=>Object.hasOwn(previous.incrementalDefaults,ticker)))test(`${ticker} old saved anchors, settings, notes and edits survive restore and explicit Use research/Undo`,async()=>{
 const d=create(ticker);d.researchSimulationConfig=oldConfig(d);d.researchSimulationConfig.seed='saved-中文-'+ticker;d.researchSimulationConfig.trials=7;d.researchSimulationConfig.binCount=19;d.researchSimulationConfig.annualPath.fixedYears=[1,3,5];d.researchSimulationConfig.annualPath.innovationSD=.012;d.researchSimulationConfig.annualPath.persistence=.45;d.researchSimulationConfig.annualMetrics.margin.fixedYears=[2,4];d.researchSimulationConfig.annualMetrics.margin.innovationSD=.002;d.notes='Keep my evidence and anchors '+ticker;d.annual[1].reinvestment+=1;
 const c=incrementalRecord(ticker).annualCase,key=researchStorageKey(c),storage=new Map([[key,JSON.stringify(d)]]);assert.deepEqual(restoreResearchDraft(d,c).draft,d);let w=await start({storage});
 try{w.choose(ticker);assert.deepEqual(w.getState().draft,d);assert.deepEqual(annualResearchSimulationAdapter(w.getState().draft).savedConfig,d.researchSimulationConfig);w.action('use-research');assert.deepEqual(w.getState().draft.researchSimulationConfig,simulationResearchDefaults(create(ticker)));assert.equal(w.getState().draft.notes,d.notes);w.action('use-research');}finally{w.destroy();}
 w=await start({storage});try{w.choose(ticker);w.action('undo');assert.deepEqual(w.getState().draft,d);assert.deepEqual(JSON.parse(storage.get(key)),d);w.action('export');assert.deepEqual(w.downloads[0].value.draft,d);}finally{w.destroy();}
 w=await start({storage});try{w.choose(ticker);assert.deepEqual(w.getState().draft,d);}finally{w.destroy();}
});

for(const method of ['annual-path','joint-annual-path'])test(`${method} reference state follows only active widths, conditioning, terminal variation and scalar method`,()=>{
 const d=create('KLAC'),c={...simulationResearchDefaults(d),method},active=config=>method==='joint-annual-path'?config.jointAnnual:config;
 assert.deepEqual(state(d,c),{annual:true,stochastic:false,userFixed:false});
 for(const metric of ['growth','margin','taxRate','wacc','investmentFactor']){const x=structuredClone(c),view=active(x),s=metric==='growth'?view.annualPath:view.annualMetrics[metric];s.innovationSD=.01;assert.equal(state(d,x).stochastic,true,metric);s.fixedYears=d.annual.map(r=>r.year);assert.equal(state(d,x).stochastic,false,metric+' exact years');assert.equal(state(d,x).userFixed,true);}
 for(const key of ['growth','taxRate','roic']){const x=structuredClone(c),view=active(x);view.annualTerminal[key]={type:'uniform',low:view.annualTerminal[key].value-.001,high:view.annualTerminal[key].value+.001};assert.equal(state(d,x).stochastic,true,key);x.method='legacy';assert.equal(state(d,x).stochastic,false,key+' inactive scalar');}
 for(const key of ['growthPremium','marginShift','investmentMultiplier','waccShift']){const x=structuredClone(c),spec={type:'uniform',low:key==='investmentMultiplier'?.9:-.01,high:key==='investmentMultiplier'?1.1:.01};active(x).drivers[key]=spec;assert.equal(state(d,x).stochastic,['marginShift','waccShift'].includes(key),key+' annual');x.method='legacy';if(method==='joint-annual-path')assert.equal(state(d,x).stochastic,false,key+' dormant joint setting');x.drivers[key]=structuredClone(spec);assert.equal(state(d,x).stochastic,true,key+' scalar');}
 const scalar=structuredClone(c);scalar.method='legacy';scalar.annualPath.innovationSD=.2;scalar.annualMetrics.margin.innovationSD=.1;assert.equal(state(d,scalar).stochastic,false);delete scalar.method;assert.equal(referenceStatusMessage(scalar,researchAnnualPathContext(d),validateResearchSimulationConfig).params.scope,t('annualReference.scalar'));
 const invalid={...c,seed:''};assert.equal(referenceStatusMessage(invalid,researchAnnualPathContext(d),validateResearchSimulationConfig).params.width,t('annualReference.invalid'));
 const beyond=structuredClone(c);active(beyond).annualPath.fixedYears=[30];assert.equal(referenceStatusMessage(beyond,researchAnnualPathContext(d),validateResearchSimulationConfig).params.width,t('annualReference.invalid'));
 const derived=deriveAnnualGrowthHorizon(d,incrementalRecord('KLAC').annualCase,{growthMaturityYear:10}),conflict={...simulationResearchDefaults(derived),method};active(conflict).annualPath.fixedYears=[10];active(conflict).annualTerminal.growth={type:'uniform',low:.02,high:.04};assert.equal(referenceStatusMessage(conflict,researchAnnualPathContext(derived),validateResearchSimulationConfig).params.width,t('annualReference.invalid'));
 for(const draft of [d,derived]){const direct={...simulationResearchDefaults(draft),method},view=active(direct);view.annualMetrics.reinvestment=view.annualMetrics.investmentFactor;delete view.annualMetrics.investmentFactor;if(method==='joint-annual-path'){delete view.loadings.investmentFactor;view.loadings.reinvestment=0;}direct.capitalPolicy=draft===d?'revenue-scaled':'fixed-schedule';assert.equal(annualResearchSimulationAdapter(draft).referenceStatusMessage(direct).params.width,t('annualReference.invalid'));}
 const unsupported={...simulationResearchDefaults(d),method};unsupported.capitalPolicy=derived.capitalPolicy;assert.equal(annualResearchSimulationAdapter(d).referenceStatusMessage(unsupported).params.width,t('annualReference.invalid'));
});

test('joint reference status validates correlated paths and noisy targets without activating dormant settings',()=>{
 const d=create('KLAC'),context=researchAnnualPathContext(d),c=simulationResearchDefaults(d),status=config=>referenceStatusMessage(config,context,validateResearchSimulationConfig).params;
 c.annualPath.innovationSD=.2;c.annualMetrics.margin.innovationSD=.1;c.drivers.marginShift={type:'uniform',low:-.01,high:.01};
 assert.deepEqual(state(d,c),{annual:true,stochastic:false,userFixed:false});assert.equal(status(c).width,t('annualReference.zero'));
 c.jointAnnual.loadings.growth=.6;c.jointAnnual.loadings.margin=.7;
 assert.equal(status(c).width,t('annualReference.zero'),'loadings alone do not create innovation variance');
 c.jointAnnual.annualPath.innovationSD=.01;c.jointAnnual.annualMetrics.margin.innovationSD=.01;
 c.jointAnnual.observations=[{metric:'margin',year:4,value:d.annual[3].margin+.005,errorSD:.01}];
 assert.equal(status(c).width,t('annualReference.variable'));assert.equal(status(c).scope,t('annualReference.noAnchors'));
 for(const change of [x=>x.jointAnnual.loadings.growth=1.01,x=>x.jointAnnual.observations[0].errorSD=-1,x=>x.jointAnnual.observations[0].year=31,x=>{x.jointAnnual.annualMetrics.margin.innovationSD=0;x.jointAnnual.observations[0].errorSD=0;}]){const invalid=structuredClone(c);change(invalid);assert.equal(status(invalid).width,t('annualReference.invalid'));}
});

function simulationFixture(ticker='SNPS',config){const d=create(ticker);d.researchSimulationConfig=config||{...simulationResearchDefaults(d),trials:4};const adapter=annualResearchSimulationAdapter(d),run=adapter.simulate,calls=[];adapter.simulate=(c,input)=>{calls.push(structuredClone(c));return run(c,input);};const changes=[];return {...fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker,currency:d.currency,periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter,onConfigChange:c=>changes.push(c)}),calls,changes};}
test('reference status stays in normal setup flow outside the positioned output/idle banner',()=>{
 const h=simulationFixture('KLAC');try{const doc=minimalDocument();doc.root.innerHTML=h.root.innerHTML;const status=doc.root.querySelector('#research-mc-reference-status'),setup=doc.root.querySelector('.mc-setup'),stage=doc.root.querySelector('.mc-output-stage');assert.equal(status.parentElement,setup);assert.equal(setup.children[0],status);assert.equal(stage.contains(status),false);assert.equal(status.getAttribute('aria-live'),'polite');assert.equal(h.calls.length,0);}finally{h.cleanup();}
});
test('bilingual live status preserves input focus, manual Run, stale results, method switches and uncertainty-reset Undo',async()=>{
 setLocale('en');clearTranslationDiagnostics();const h=simulationFixture();try{
  const status=()=>h.get('#mc-reference-status').textContent;
  assert.match(status(),/Uncalibrated zero-width.*not a confidence range.*No user-fixed/s);assert.match(status(),/fixed opening stubs and obligations are separate/);assert.match(status(),/persistence 0 is inactive/);assert.equal(h.get('#mc-annual-fixed-1').getAttribute('aria-pressed'),'false');assert.equal(h.get('#mc-metric-margin-fixed-1').getAttribute('aria-pressed'),'false');assert.equal(h.calls.length,0);
  const input=h.get('#mc-annual-innovation-sd');input.focus();input.value='1';input.oninput();assert.match(status(),/User-defined uncertainty/);assert.equal(h.doc.activeElement,input);assert.equal(h.get('#mc-annual-innovation-sd'),input);h.get('#mc-annual-fixed-1').click();assert.match(status(),/Selected forecast years/);assert.equal(h.calls.length,0);
  h.get('#mc-run').click();assert.equal(h.calls.length,1);h.get('#mc-export').click();const exported=JSON.parse(await h.exports[0].text());assert.deepEqual(exported.method.openingStub,h.draft.openingStub);assert.equal(exported.config.method,'joint-annual-path');assert.equal(exported.config.jointAnnual.annualPath.innovationSD,.01);assert.deepEqual(exported.config.jointAnnual.annualPath.fixedYears,[1]);assert.deepEqual(exported.config.annualPath,simulationResearchDefaults(h.draft).annualPath);
  input.value='2';input.oninput();assert.equal(h.calls.length,1);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'stale');assert.equal(h.get('#mc-export').disabled,true);
  const selected=structuredClone(h.changes.at(-1));h.get('#mc-growth-method').value='legacy';h.get('#mc-growth-method').onchange();assert.match(status(),/zero-width.*Scalar method:.*inactive/s);assert.doesNotMatch(status(),/User-defined uncertainty/);assert.equal(h.get('#mc-annual-innovation-sd').value,'0');assert.deepEqual(h.changes.at(-1).jointAnnual,selected.jointAnnual);
  setLocale('zh-Hans');assert.match(status(),/未经校准的零宽度.*不是置信区间.*标量模式.*不启用/s);setLocale('en');h.get('#mc-growth-method').value='joint-annual-path';h.get('#mc-growth-method').onchange();assert.match(status(),/User-defined uncertainty/);assert.deepEqual(h.changes.at(-1).jointAnnual,selected.jointAnnual);
  h.get('#mc-reset-distributions').click();assert.match(status(),/No user-fixed/);assert.equal(h.get('#mc-annual-innovation-sd').value,'0');h.get('#mc-undo-reset').click();assert.equal(h.get('#mc-annual-innovation-sd').value,'2');assert.equal(h.get('#mc-annual-fixed-1').getAttribute('aria-pressed'),'true');assert.match(status(),/User-defined uncertainty/);assert.equal(h.calls.length,1);
  h.get('#mc-annual-innovation-sd').value='';h.get('#mc-annual-innovation-sd').oninput();assert.match(status(),/settings are invalid/);assert.equal(h.get('#mc-run').disabled,true);setLocale('zh-Hans');assert.match(status(),/设置无效/);setLocale('en');assert.deepEqual(getMissingTranslations(),[]);
 }finally{setLocale('en');h.cleanup();}
});

test('saved scalar mode and saved anchors are presented without silently replacing them or auto-running',()=>{
 const d=create('CDNS'),c=oldConfig(d);c.method='legacy';c.annualPath.innovationSD=.07;c.seed='keep-scalar';c.trials=7;const before=structuredClone(c),h=simulationFixture('CDNS',c);try{assert.deepEqual(c,before);assert.equal(h.changes.length,0);assert.equal(h.calls.length,0);assert.match(h.get('#mc-reference-status').textContent,/zero-width.*Scalar method/s);assert.equal(h.get('#mc-annual-fixed-1').getAttribute('aria-pressed'),'true');h.get('#mc-growth-method').value='annual-path';h.get('#mc-growth-method').onchange();assert.equal(h.changes.at(-1).seed,'keep-scalar');assert.deepEqual(h.changes.at(-1).annualPath,before.annualPath);assert.match(h.get('#mc-reference-status').textContent,/User-defined uncertainty.*Selected forecast years/s);}finally{h.cleanup();}
});
