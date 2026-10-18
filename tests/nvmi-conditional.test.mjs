import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allocateNvmiCommon,nvmiCall,NVMI_CLAIM_DEFAULTS,NVMI_CLAIM_FACTS,nvmiStrip} from '../dist/nvmi-conditional-allocation.js';
import {nvmiConditionalEditorHTML,nvmiConditionalResult} from '../dist/nvmi-conditional-view.js';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {incrementalResearchDraft} from '../dist/incremental-research.js';
import {calculateResearchOperating} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {setLocale} from '../dist/i18n.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
const record=incrementalRecord('NVMI'),src=JSON.parse(fs.readFileSync(new URL('../dist/'+record.identity.sourcePath.slice(2),import.meta.url))),catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const draft=()=>incrementalResearchDraft({ticker:'NVMI',presetId:record.identity.version,incrementalResearch:record.identity,annualCase:record.annualCase});
const ev=src.operating_scenarios.base.calculated.operating_EV,near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('independently audited roots and fixed-market reference reproduce without changing EV',()=>{
 for(const [name,value]of Object.entries({downcycle:92.02544128433925,base:154.26720189007807,upside:221.65450824080278})){
 const x=allocateNvmiCommon(src.operating_scenarios[name].calculated.operating_EV);near(x.perShare,value);near(x.commonEquity+x.rsuClaim+x.optionClaim+x.convertClaim-x.hedgeAsset,x.assets);}
 near(allocateNvmiCommon(ev,{},'market').perShare,147.3318272728);near(allocateNvmiCommon(ev,{},'conditional','face').perShare,149.35466,1e-5);near(allocateNvmiCommon(ev,{haircut:1}).perShare,153.60207,1e-5);near(allocateNvmiCommon(ev,{mismatch:25}).perShare,153.51304,1e-5);
});
test('domain validation, zero volatility, large roots and no-positive-common branch',()=>{
 for(const p of [{volatility:NaN},{volatility:Infinity},{volatility:-1},{haircut:-.1},{haircut:1.1},{rsuMultiplier:-1},{residual:null},{rate:null},{mismatch:-1},{dividend:-1}])assert.throws(()=>allocateNvmiCommon(ev,p));
 assert.throws(()=>allocateNvmiCommon(Infinity));assert.throws(()=>allocateNvmiCommon(ev,{rate:-1e6}));
 near(nvmiCall(100,110,2,.03,0),Math.max(100-110*Math.exp(-.06),0));assert.ok(Number.isFinite(allocateNvmiCommon(ev,{volatility:0}).perShare));
 assert.ok(allocateNvmiCommon(1e8).perShare>1000);const x=allocateNvmiCommon(-2000);assert.equal(x.status,'no-positive-common');assert.equal(x.perShare,null);assert.ok(x.shortfall>0);
 const f=NVMI_CLAIM_FACTS,p=NVMI_CLAIM_DEFAULTS,r=allocateNvmiCommon(ev);near(r.convertClaim-r.hedgeAsset,r.bondValue+f.underlying*nvmiStrip(r.perShare,f.cap,p));
});
test('optional state leaves main bridge, operating funding floor and MC equity gates intact',()=>{
 const d=draft(),before=calculateResearchOperating(d);d.nvmiConditional={mode:'conditional',inputs:{}};near(nvmiConditionalResult(d).perShare,154.26720189007807);assert.deepEqual(calculateResearchOperating(d),before);assert.equal(calculateResearchBridge(d,before.enterprise).perShare,null);
 const mc=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(mc.perShare.draws.length,0);assert.equal(mc.bridgeCoverage.eligible,0);
 d.timing.mode='as-of-scenario';assert.throws(()=>nvmiConditionalResult(d),/date/);
});
test('bilingual optional controls contain limitations and direct precision inputs',()=>{
 const d=draft();assert.match(nvmiConditionalEditorHTML(d),/Operating EV only/);assert.doesNotMatch(nvmiConditionalEditorHTML(d),/data-nvmi-input/);d.nvmiConditional={mode:'conditional',inputs:{}};
 try{setLocale('en');const en=nvmiConditionalEditorHTML(d);assert.match(en,/No-early-event/);assert.match(en,/no common-share Monte Carlo/);assert.match(en,/value="50.08"/);assert.match(en,/not confidence intervals/);assert.doesNotMatch(en,/checkbox/);setLocale('zh-Hans');const zh=nvmiConditionalEditorHTML(d);assert.match(zh,/无提前事件/);assert.match(zh,/固定市场债权参考/);}finally{setLocale('en');}
});
test('workspace optional modes, direct edits, reset, persistence, export and operating edits',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{
 w.choose('NVMI');for(const mode of ['conditional','market','off','conditional']){const button=w.get(`[data-nvmi-mode="${mode}"]`);button.focus();button.click();assert.equal(w.get(`[data-nvmi-mode="${mode}"]`).ownerDocument.activeElement,w.get(`[data-nvmi-mode="${mode}"]`));}const resetButton=w.get('[data-nvmi-reset]');resetButton.focus();resetButton.click();assert.equal(w.get('[data-nvmi-reset]').ownerDocument.activeElement,w.get('[data-nvmi-reset]'));assert.match(w.get('#nvmi-conditional-output').textContent,/154.27/);
 const vol=w.get('[data-nvmi-input="volatility"]');vol.focus();w.input('[data-nvmi-input="volatility"]','60');vol.onblur?.();vol.focus();w.input('[data-nvmi-input="volatility"]','70');vol.onblur?.();w.action('undo-edit');near(w.getState().draft.nvmiConditional.inputs.volatility,.6);w.get('[data-nvmi-reset]').click();
 w.input('[data-nvmi-input="haircut"]','100');near(w.getState().draft.nvmiConditional.inputs.haircut,1);assert.match(w.get('#nvmi-conditional-output').textContent,/153.6/);
 w.input('[data-nvmi-input="volatility"]','');assert.match(w.get('#nvmi-conditional-output').textContent,/finite/);assert.equal(calculateResearchBridge(w.getState().draft,ev).perShare,null);
 w.get('[data-nvmi-reset]').click();w.get('[data-nvmi-mode="market"]').click();assert.match(w.get('#nvmi-conditional-output').textContent,/147.33/);w.action('export');near(w.downloads.at(-1).value.nvmiConditionalAllocation.perShare,147.3318272728);assert.equal(w.downloads.at(-1).value.equityBridge.perShare,null);
 }finally{w.destroy();}
 const again=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{again.choose('NVMI');assert.equal(again.getState().draft.nvmiConditional.mode,'market');assert.match(again.get('#nvmi-conditional-output').textContent,/147.33/);again.get('[data-nvmi-mode="off"]').click();assert.equal(again.get('#nvmi-conditional-output'),null);}finally{again.destroy();}
});
