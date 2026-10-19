import {startStudio} from './v7-runtime-harness.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startResearchWorkspace,minimalDocument} from './research-workspace-harness.mjs';
import {incrementalPackages} from '../dist/incremental-registry.js';
import {getAnalystAllocationDefinition} from '../dist/analyst-conditional-allocation.js';
import {analystAllocationResult} from '../dist/analyst-allocation-view.js';
import {calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {setLocale} from '../dist/i18n.js';
import {guidedAnnualAvailabilityHTML,bindGuidedAnnualAvailability} from '../dist/guided-annual-availability.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const options={catalogBundle:catalog,incrementalBundle:incrementalPackages};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('all five show immediate CTA; opening changes no operating input or original gate',async()=>{
 const w=await startResearchWorkspace(options);try{for(const ticker of ['ONTO','CAMT','MRVL','AMD','NBIS']){
  w.choose(ticker);const before=w.getState().draft,ev=calculateResearchOperating(before);assert.ok(w.get('[data-research-action="open-analyst-allocation"]'));assert.equal(analystAllocationResult(before),null);
  w.action('open-analyst-allocation');const after=w.getState().draft;assert.equal(after.analystConditionalAllocation.enabled,true);assert.deepEqual(calculateResearchOperating(after),ev);assert.equal(w.get('#annual-editor-panel-claims').hidden,false);assert.equal(w.get('.screen-workspace').dataset.mobileView,'inputs');assert.ok(w.get('[data-analyst-input]'));assert.equal(w.get('[type="checkbox"]'),null);
  const timing=researchTimingResult(after);assert.equal(calculateResearchBridge(after,timing.enterprise,{calculationDate:timing.date}).perShare,null);assert.equal(analystAllocationResult(after).status,'incomplete');
 }}finally{w.destroy();}
});
test('illustrations, full precision, input undo, export, restore and stale clearing',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({...options,storage});try{
  w.choose('ONTO');w.action('open-analyst-allocation');w.get('[data-analyst-action="illustration"]').click();const initial=analystAllocationResult(w.getState().draft);assert.ok(initial.perShare>0);assert.match(w.get('#research-results').textContent,/116.66/);
  const input=w.get('[data-analyst-input="cappedCall"]');input.focus();w.input('[data-analyst-input="cappedCall"]','88.95123456789');input.onblur?.();input.focus();input.onfocus?.();assert.equal(input.value,'88.95123456789');near(w.getState().draft.analystConditionalAllocation.inputs.cappedCall,88.95123456789);
  w.input('[data-analyst-input="cappedCall"]','90');input.onblur?.();w.action('undo-edit');near(w.getState().draft.analystConditionalAllocation.inputs.cappedCall,88.95123456789);
  w.input('[data-analyst-input="residualClaims"]','0');assert.equal(w.getState().draft.analystConditionalAllocation.inputs.residualClaims,0);assert.ok(analystAllocationResult(w.getState().draft).perShare>0);
  w.input('[data-analyst-input="residualClaims"]','');assert.equal(w.getState().draft.analystConditionalAllocation.inputs.residualClaims,null);assert.equal(analystAllocationResult(w.getState().draft).perShare,null);assert.doesNotMatch(w.get('#analyst-allocation-output').textContent,/116.66/);
  w.get('[data-analyst-action="illustration"]').click();w.input('[data-analyst-note]','A dated scenario, not current.');w.action('export');const output=w.downloads.at(-1).value;assert.equal(output.equityBridge.perShare,null);assert.ok(output.analystConditionalAllocation.perShare>0);assert.equal(output.analystConditionalAllocationDraft.note,'A dated scenario, not current.');
  w.action('load');assert.equal(w.getState().draft.analystConditionalAllocation.note,'A dated scenario, not current.');
 }finally{w.destroy();}
 const again=await startResearchWorkspace({...options,storage});try{again.choose('ONTO');assert.ok(analystAllocationResult(again.getState().draft).perShare>0);again.get('[data-analyst-action="off"]').click();assert.equal(analystAllocationResult(again.getState().draft),null);again.get('[data-analyst-action="enable"]').click();assert.ok(analystAllocationResult(again.getState().draft).perShare>0);again.get('[data-analyst-action="reset"]').click();assert.equal(analystAllocationResult(again.getState().draft).status,'incomplete');}finally{again.destroy();}
});
test('locale switch keeps exact inputs and changes company control labels',async()=>{
 const w=await startResearchWorkspace(options);try{w.choose('CAMT');w.action('open-analyst-allocation');w.get('[data-analyst-action="illustration"]').click();const before=w.getState().draft;setLocale('zh-Hans');assert.match(w.get('#analyst-allocation-tool').textContent,/显式条件价值分配/);assert.match(w.get('#analyst-allocation-tool').textContent,/旧债剩余结算/);assert.deepEqual(w.getState().draft,before);assert.doesNotMatch(w.get('#analyst-allocation-tool').textContent,/confirmation|checkbox/);setLocale('en');assert.match(w.get('#analyst-allocation-tool').textContent,/Remaining 2026-note/);}finally{setLocale('en');w.destroy();}
});
test('NVMI visible CTA selects existing calculator and promotes dated result',async()=>{
 const w=await startResearchWorkspace(options);try{w.choose('NVMI');w.action('open-analyst-allocation');assert.equal(w.getState().draft.nvmiConditional.mode,'conditional');assert.match(w.get('#research-results').textContent,/154.27/);assert.equal(w.get('#annual-editor-panel-claims').hidden,false);w.action('undo-edit');assert.equal(w.getState().draft.nvmiConditional,undefined);}finally{w.destroy();}
});
test('Guided NBIS/TSM links navigate exact annual company without replacing either draft',async()=>{
 const w=await startResearchWorkspace(options);try{w.choose('TSM');w.input('[data-research-text="notes"]','Keep this Annual note');w.choose('AAPL');w.openCompany('TSM');assert.equal(w.getState().company.ticker,'TSM');assert.equal(w.getState().draft.notes,'Keep this Annual note');assert.deepEqual(w.navigations,['renewed']);}finally{w.destroy();}
 const doc=minimalDocument(),root=doc.root;root.innerHTML=guidedAnnualAvailabilityHTML('NBIS');let chosen;bindGuidedAnnualAvailability(root,'NBIS',{open:t=>chosen=t});root.querySelector('button').click();assert.equal(chosen,'NBIS');assert.equal(guidedAnnualAvailabilityHTML('AAPL'),'');assert.equal(guidedAnnualAvailabilityHTML('AMD'),'');
});

test('actual Guided withheld CTA calls matching Annual without modifying saved Guided inputs',async()=>{
 const opened=[],h=await startStudio({annualWorkspace:{openCompany:ticker=>opened.push(ticker)}});
 for(const ticker of ['NBIS','TSM']){h.change('#current-company',ticker);const before=JSON.stringify(h.state(ticker));const button=h.get('[data-guided-open-annual]');assert.ok(button);button.click();assert.equal(opened.at(-1),ticker);assert.equal(JSON.stringify(h.state(ticker)),before);}
});
