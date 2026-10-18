import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {simulationDefaults,simulateCurrent,simulateCurrentAsync,validateSimulationConfig,currentAnnualPathContext} from '../dist/simulation.js';
import {simulationResearchDefaults,simulateResearch,simulateResearchAsync,validateResearchSimulationConfig,researchAnnualPathContext} from '../dist/research-simulation.js';
import {studioResearchDraft} from '../dist/studio-research-presets.js';
import {researchDraftFor,restoreResearchDraft,calculateResearchOperating} from '../dist/research-model.js';
import {incrementalRecord} from '../dist/incremental-registry.js';
import {incrementalResearchDraft} from '../dist/incremental-research.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {isJoint,jointEffectiveConfig,prepareJointSimulation,createJointState} from '../dist/joint-simulation-config.js';
import {fixture} from './v7-simulation-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {setLocale,t,getMissingTranslations,clearTranslationDiagnostics,localizeMarkedNodes} from '../dist/i18n.js';
import {renderJointMetric} from '../dist/joint-simulation-view.js';
import {minimalDocument} from './research-workspace-harness.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const bundle=read('../dist/data/studio-research-presets-2026-10-17-v1.json'),golden=read('./fixtures/joint-old-methods-v60.json');
const selectResult=r=>({draws:r.draws,scenarios:r.scenarios,accepted:r.accepted,exclusions:r.exclusions});
const make=ticker=>studioResearchDraft(bundle.presets.find(p=>p.ticker===ticker),bundle);
const zero=c=>{c=structuredClone(c);const j=c.jointAnnual;j.annualPath.innovationSD=0;for(const s of Object.values(j.annualMetrics||{}))s.innovationSD=0;return c;};
const small=c=>({...c,trials:6,seed:'joint-integration-test'});
for(const row of golden.research)test(`old ${row.config.method} ${row.ticker} draws and complete scenarios remain exact`,()=>assert.deepEqual(selectResult(simulateResearch(make(row.ticker),row.config)),row.expected));
for(const row of golden.guided)test(`old Guided ${row.config.method} remains exact`,()=>assert.deepEqual(selectResult(simulateCurrent(row.snapshot,row.draft,row.config)),row.expected));

test('fresh original presets retain priors and 5000 attempts in separate joint state; saved configs stay unchanged',()=>{
 for(const p of bundle.presets){const d=studioResearchDraft(p,bundle),c=d.researchSimulationConfig;assert.equal(c.method,'joint-annual-path');assert.equal(c.trials,5000);assert.deepEqual(c.jointAnnual.drivers,p.simulationConfig.drivers);assert.equal(c.jointAnnual.annualPath.innovationSD,.03);assert.deepEqual(c.jointAnnual.annualPath.fixedYears,[1,2,3]);assert.ok(Object.values(c.jointAnnual.loadings).every(v=>v===0));assert.equal(c.jointAnnual.terminalMode,'scenario-baseline');const old=structuredClone(golden.research.find(x=>x.ticker===p.ticker).config);d.researchSimulationConfig=old;assert.deepEqual(restoreResearchDraft(d,p.annualCase).draft.researchSimulationConfig,old);}
 assert.equal(validateSimulationConfig({}).method,'legacy');assert.equal(validateResearchSimulationConfig({}).method,'legacy');
});
for(const ticker of ['KLAC','AMAT','LRCX','ASML','FN','CDNS','SNPS'])test(`${ticker} joint reference preserves zero width, funding, stubs and async equivalence`,async()=>{
 const r=incrementalRecord(ticker),d=incrementalResearchDraft({ticker,presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
 for(const h of [10,15,20]){const draft=h===10?d:deriveAnnualGrowthHorizon(d,r.annualCase,{growthMaturityYear:h}),config=small(simulationResearchDefaults(draft)),before=structuredClone(draft),result=simulateResearch(draft,config);assert.equal(result.accepted,6);assert.equal(result.median,calculateResearchOperating(draft).enterprise);assert.equal(result.jointAnnual.terminalMode,'scenario-baseline');assert.equal(config.jointAnnual.annualPath.innovationSD,0);assert.deepEqual(config.jointAnnual.annualPath.fixedYears,[]);assert.deepEqual(result.method.openingStub,draft.openingStub);assert.deepEqual(await simulateResearchAsync(draft,config,{chunkSize:2,yieldControl:async()=>{}}),result);assert.deepEqual(draft,before);}
});
test('nonzero joint innovations and noisy cross-metric targets flow through both async runners',async()=>{
 const source=golden.guided[0],config=small(simulationDefaults(source.draft.assumptions)),j=config.jointAnnual;j.annualPath.fixedYears=[];j.annualMetrics.margin.fixedYears=[];j.annualMetrics.margin.innovationSD=.02;j.loadings.growth=.7;j.loadings.margin=.6;j.observations=[{metric:'margin',year:4,value:.3,errorSD:.01}];const r=simulateCurrent(source.snapshot,source.draft,config);assert.equal(r.accepted,6);assert.equal(r.dependence.id,'joint-annual-innovations');assert.deepEqual(await simulateCurrentAsync(source.snapshot,source.draft,config,{chunkSize:2,yieldControl:async()=>{}}),r);assert.equal(r.jointAnnual.observations.filter(o=>o.kind==='noisy-observation').length,1);
 const d=make('AAPL'),a=small(d.researchSimulationConfig);a.jointAnnual.annualMetrics.margin.innovationSD=.01;a.jointAnnual.loadings.margin=.7;a.jointAnnual.loadings.growth=.8;a.jointAnnual.observations=[{metric:'margin',year:5,value:d.annual[4].margin+.005,errorSD:.01}];const annual=simulateResearch(d,a);assert.equal(annual.accepted,6);assert.deepEqual(await simulateResearchAsync(d,a,{chunkSize:1,yieldControl:async()=>{}}),annual);assert.ok(annual.scenarios.every(s=>s.growthPath.length===d.annual.length&&s.metricPaths.margin.length===d.annual.length));
});
test('joint validation rejects conflicting anchors and unsupported state without changing it',()=>{
 const d=make('AAPL'),c=small(d.researchSimulationConfig),original=structuredClone(c);c.jointAnnual.observations=[{metric:'growth',year:1,value:.99,errorSD:0}];assert.throws(()=>simulateResearch(d,c),/Conflicting exact/);assert.equal(c.jointAnnual.observations[0].value,.99);const bad=structuredClone(original);bad.jointAnnual.version=999;assert.throws(()=>validateResearchSimulationConfig(bad),/version/);assert.equal(bad.jointAnnual.version,999);
});
test('joint UI keeps manual Run, method-specific state, target edits, focus, reset Undo and bilingual controls',()=>{
 const changes=[],h=fixture({ticker:'JOINT-UI-ROUNDTRIP',runOnMount:false,synchronous:true,onConfigChange:c=>changes.push(structuredClone(c))});clearTranslationDiagnostics();
 try{assert.equal(h.get('#mc-growth-method').value,'joint-annual-path');assert.equal(h.get('#mc-chart'),null);const sd=h.get('#mc-annual-innovation-sd');sd.focus();sd.value='4.2';sd.oninput();assert.equal(h.get('#mc-annual-innovation-sd'),sd);assert.equal(h.doc.activeElement,sd);assert.equal(changes.at(-1).jointAnnual.annualPath.innovationSD,.042);assert.equal(changes.at(-1).annualPath.innovationSD,.03);h.get('#mc-joint-growth-loading').value='.7';h.get('#mc-joint-growth-loading').oninput();h.get('#mc-joint-growth-add').click();let target=h.get('#mc-joint-target-0-sd');target.value='2';target.focus();target.oninput();assert.equal(h.doc.activeElement,target);assert.equal(changes.at(-1).jointAnnual.observations[0].errorSD,.02);assert.equal(h.get('#mc-chart'),null);const joint=structuredClone(changes.at(-1).jointAnnual);
 h.get('#mc-growth-method').value='annual-path';h.get('#mc-growth-method').onchange();assert.equal(h.get('#mc-annual-innovation-sd').value,'3');h.get('#mc-annual-innovation-sd').value='6';h.get('#mc-annual-innovation-sd').oninput();h.get('#mc-growth-method').value='joint-annual-path';h.get('#mc-growth-method').onchange();assert.equal(h.get('#mc-annual-innovation-sd').value,'4.2');assert.deepEqual(changes.at(-1).jointAnnual,joint);assert.equal(changes.at(-1).annualPath.innovationSD,.06);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-joint-growth-loading').value='.5';h.get('#mc-joint-growth-loading').oninput();assert.equal(h.get('#mc-export').disabled,true);const before=structuredClone(changes.at(-1));h.get('#mc-reset-distributions').click();h.get('#mc-undo-reset').click();assert.deepEqual(changes.at(-1),before);
 setLocale('zh-Hans');assert.equal(t('jointAnnual.method'),'联合年度路径');assert.match(renderJointMetric(changes.at(-1),currentAnnualPathContext(h.snapshot,h.draft),'growth'),/添加年份目标/);h.get('#mc-joint-growth-loading').value='2';h.get('#mc-joint-growth-loading').oninput();assert.equal(h.get('#mc-run').disabled,true);assert.match(h.get('#mc-error').textContent,/载荷/);setLocale('en');assert.match(h.get('#mc-error').textContent,/loadings/);assert.deepEqual(getMissingTranslations(),[]);
 }finally{setLocale('en');h.cleanup();}
});

test('exact targets keep full authored precision across unrelated edits, method switches and Run',async()=>{
 const record=incrementalRecord('ASML'),d=incrementalResearchDraft({ticker:'ASML',presetId:record.identity.version,incrementalResearch:record.identity,annualCase:record.annualCase});d.researchSimulationConfig=small(d.researchSimulationConfig);
 const changes=[],h=fixture({ticker:'ASML-JOINT-EXACT',draftOverride:d,adapter:annualResearchSimulationAdapter(d),runOnMount:false,synchronous:true,onConfigChange:c=>changes.push(structuredClone(c))});
 try{const exact=researchAnnualPathContext(d).baseline[3];h.get('#mc-joint-growth-add').click();h.get('#mc-joint-growth-loading').value='.5';h.get('#mc-joint-growth-loading').oninput();assert.equal(changes.at(-1).jointAnnual.observations[0].value,exact);assert.equal(h.get('#mc-run').disabled,false);h.get('#mc-growth-method').value='annual-path';h.get('#mc-growth-method').onchange();h.get('#mc-growth-method').value='joint-annual-path';h.get('#mc-growth-method').onchange();h.get('#mc-run').click();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');h.get('#mc-export').click();const output=JSON.parse(await h.exports[0].text());assert.equal(output.config.jointAnnual.observations[0].value,exact);assert.equal(output.jointAnnual.terminalMode,'scenario-baseline');assert.ok(output.scenarios.every(s=>s.growthPath[3]===exact));}finally{h.cleanup();}
});
test('app rejects unsupported terminal mode and endpoint support conflicts before starting trials',()=>{
 const d=deriveAnnualGrowthHorizon(make('AAPL'),bundle.presets.find(p=>p.ticker==='AAPL').annualCase,{growthMaturityYear:15}),c=small(simulationResearchDefaults(d));c.jointAnnual.annualTerminal.growth={type:'uniform',low:.02,high:.04};c.jointAnnual.observations=[{metric:'growth',year:15,value:researchAnnualPathContext(d).baseline[14],errorSD:0}];assert.throws(()=>prepareJointSimulation(researchAnnualPathContext(d),c),/Conflicting exact/);assert.throws(()=>simulateResearch(d,c),/Conflicting exact/);c.jointAnnual.terminalMode='conditional-prior';assert.throws(()=>validateResearchSimulationConfig(c),/scenario-baseline terminal mixtures only/);
});
test('imported direct investment primitive retains operating-only terminal, visible editor and fixed policy',()=>{
 const d=make('AAPL'),c=small(simulationResearchDefaults(d)),spec={innovationSD:0,persistence:.6,fixedYears:[]};c.jointAnnual.annualMetrics={reinvestment:spec};c.jointAnnual.loadings={growth:0,reinvestment:0};d.researchSimulationConfig=c;
 const changes=[],h=fixture({ticker:'AAPL-JOINT-DIRECT',draftOverride:d,adapter:annualResearchSimulationAdapter(d),runOnMount:false,synchronous:true,onConfigChange:c=>changes.push(structuredClone(c))});
 try{assert.ok(h.get('#mc-metric-reinvestment-sd'));assert.equal(h.get('#mc-metric-investmentFactor-sd'),null);assert.equal(h.get('#mc-driver-investmentMultiplier').disabled,true);h.get('#mc-joint-reinvestment-loading').value='.2';h.get('#mc-joint-reinvestment-loading').oninput();assert.deepEqual(Object.keys(changes.at(-1).jointAnnual.annualMetrics),['reinvestment']);h.get('#mc-run').click();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');const bad=structuredClone(c);bad.capitalPolicy='revenue-scaled';assert.throws(()=>simulateResearch(d,bad),/fixed-schedule policy/);h.get('#mc-capital-policy').value='revenue-scaled';h.get('#mc-capital-policy').onchange();assert.equal(h.get('#mc-run').disabled,true);assert.match(h.get('#mc-error').textContent,/fixed-schedule policy/);}finally{h.cleanup();}
});

test('joint async completion restores focused Cancel to Run without stealing newer input focus',async()=>{
 for(const moveFocus of [false,true]){
  const d=make('AAPL');d.researchSimulationConfig=small(d.researchSimulationConfig);const adapter=annualResearchSimulationAdapter(d),run=adapter.simulate;let resolve;
  adapter.simulateAsync=(config,_options,draft)=>new Promise(done=>{resolve=()=>done(run(config,draft));});
  const h=fixture({ticker:'JOINT-ASYNC-FOCUS-'+moveFocus,draftOverride:d,adapter,runOnMount:false,synchronous:false});
  try{h.get('#mc-run').click();h.get('#mc-cancel').focus();if(moveFocus)h.get('#mc-seed').focus();resolve();for(let i=0;i<8;i++)await Promise.resolve();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.doc.activeElement,h.get(moveFocus?'#mc-seed':'#mc-run'));assert.equal(h.get('#mc-cancel').hidden,true);}finally{h.cleanup();}
 }
});

test('joint async failure exposes the error without leaving focus on a disabled or hidden button',async()=>{
 for(const moveFocus of [false,true]){
  const d=make('AAPL');d.researchSimulationConfig=small(d.researchSimulationConfig);const adapter=annualResearchSimulationAdapter(d);let reject;
  adapter.simulateAsync=()=>new Promise((_resolve,fail)=>{reject=fail;});
  const h=fixture({ticker:'JOINT-ASYNC-FAIL-'+moveFocus,draftOverride:d,adapter,runOnMount:false,synchronous:false});
  try{h.get('#mc-run').click();h.get('#mc-cancel').focus();if(moveFocus)h.get('#mc-seed').focus();reject(Error('A target is too far from its baseline relative to uncertainty.'));for(let i=0;i<8;i++)await Promise.resolve();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'unavailable');assert.equal(h.doc.activeElement,h.get(moveFocus?'#mc-seed':'#mc-error'));if(!moveFocus)assert.equal(h.get('#mc-error').getAttribute('tabindex'),'-1');}finally{h.cleanup();}
 }
});
