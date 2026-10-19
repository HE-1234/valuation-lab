import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualFieldIssue} from '../dist/research-view.js';
import {setLocale} from '../dist/i18n.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
const cell=(group,key)=>`[data-research-input="${group}"][data-field="${key}"]`;
const invalid=el=>el.getAttribute('aria-invalid');

test('field errors: repeated terminal invalid repair preserves input, focus, authored text and precision',async()=>{
 const h=await startResearchWorkspace(),selector=cell('terminal','taxRate'),el=h.get(selector);el.focus();
 for(const raw of ['', 'oops', '-1','61']){
  h.input(selector,raw);assert.equal(invalid(el),'true');assert.equal(el.value,raw);assert.equal(h.focus(),el);assert.equal(h.get(selector),el);
  assert.match(el.getAttribute('aria-describedby'),/annual-field-error-terminal-taxRate/);
  h.input(selector,'21.123456789');assert.equal(invalid(el),'false');assert.equal(el.getAttribute('aria-describedby'),null);assert.equal(h.getState().draft.terminal.taxRate,21.123456789/100);
 }
 el.dispatch('blur');assert.equal(el.value,'21.12');el.dispatch('focus');assert.equal(el.value,'21.123456789');
 assert.equal(h.get('#annual-field-error-terminal-taxRate').hidden,true);
});

test('field errors: terminal relationships associate both participants without blaming tax or margin',async()=>{
 const h=await startResearchWorkspace();h.input(cell('terminal','wacc'),'1');
 for(const key of ['growth','wacc']){const el=h.get(cell('terminal',key));assert.equal(invalid(el),'true');assert.equal(el.getAttribute('data-annual-error-kind'),'relationship');}
 for(const key of ['margin','taxRate','roic'])assert.equal(invalid(h.get(cell('terminal',key))),'false');
 h.input(cell('terminal','wacc'),'12');h.input(cell('terminal','roic'),'1');assert.equal(invalid(h.get(cell('terminal','roic'))),'true');
 h.input(cell('terminal','roic'),'15');for(const key of ['growth','wacc','roic'])assert.equal(invalid(h.get(cell('terminal',key))),'false');
});

test('field errors: bridge bounds retain described-by hints and permit documented unknowns',async()=>{
 const h=await startResearchWorkspace({presetsMissing:true});const selector=cell('bridge','assetValueFactor'),el=h.get(selector);assert.ok(el);
 el.setAttribute('aria-describedby','existing-hint another-hint');el.focus();
 h.input(selector,'101');assert.equal(invalid(el),'true');assert.equal(el.getAttribute('aria-describedby'),'existing-hint another-hint annual-field-error-bridge-assetValueFactor');
 h.input(selector,'50');assert.equal(invalid(el),'false');assert.equal(el.getAttribute('aria-describedby'),'existing-hint another-hint');assert.equal(h.focus(),el);
 assert.equal(annualFieldIssue({bridgeInputs:{x:null}},'bridge','x',{default:null,min:0}),null);
 assert.equal(annualFieldIssue({incrementalResearch:{},bridgeInputs:{x:null}},'bridge','x',{default:0,min:0}),null);
 assert.equal(annualFieldIssue({bridgeInputs:{x:-1}},'bridge','x',{default:0,min:0}).kind,'local');
});

test('field errors: timing optional origin blanks, active required fields and fixed-model limitations stay distinct',async()=>{
 const h=await startResearchWorkspace({presetsMissing:true});const stub=cell('timing','stubFCFF');
 assert.equal(invalid(h.get(stub)),'false');h.change('#research-timing-mode','as-of-scenario');assert.equal(invalid(h.get(stub)),'true');assert.equal(invalid(h.get('#research-stub-reason')),'true');
 h.input(stub,'0');h.input('#research-stub-reason','Explicit zero scenario');assert.equal(invalid(h.get(stub)),'false');assert.equal(invalid(h.get('#research-stub-reason')),'false');
 h.input('#research-asof','2020-01-01');assert.equal(invalid(h.get('#research-asof')),'true');h.input('#research-asof','2026-10-17');assert.equal(invalid(h.get('#research-asof')),'false');
 h.change('#research-timing-mode','origin');h.input(stub,'');assert.equal(invalid(h.get(stub)),'false');
 for(const ticker of ['AMD','MRVL','SNPS','CRDO','SNDK','ARM']){const d={ticker,timing:{mode:'as-of-scenario',stubFCFF:null,reason:''}};assert.equal(annualFieldIssue(d,'timing','stubFCFF'),null,ticker);assert.equal(annualFieldIssue(d,'timing','reason'),null,ticker);}
});

test('field errors: local feedback is bilingual, in-place and does not alter draft or editor navigation',async()=>{
 const h=await startResearchWorkspace();h.input(cell('terminal','growth'),'6');const el=h.get(cell('terminal','growth')),before=structuredClone(h.getState().draft);el.focus();
 const tab=h.get('[data-annual-editor="terminal"]');assert.ok(tab);tab.click();
 try{setLocale('zh-Hans');assert.match(h.get('#annual-field-error-terminal-growth').textContent,/稳定增长率/);assert.deepEqual(h.getState().draft,before);assert.equal(h.get(cell('terminal','growth')),el);setLocale('en');assert.match(h.get('#annual-field-error-terminal-growth').textContent,/0% to 5%/);}finally{setLocale('en');}
 h.input(cell('terminal','growth'),'2');assert.equal(invalid(el),'false');
});

test('field errors: invalid saved draft retains recovery gate and does not silently normalize authored assumptions',async()=>{
 const h=await startResearchWorkspace();h.input(cell('terminal','taxRate'),'61');const before=h.getState().draft;
 const restored=await startResearchWorkspace({storage:h.storage});assert.ok(restored.getState().identityError);assert.equal(restored.getState().draft.terminal.taxRate,.61);assert.deepEqual(restored.getState().draft,before);assert.equal(restored.get(cell('terminal','taxRate')),null);
});

test('field errors: visual contract uses readable text plus border, no alert or focus stealing',()=>{
 const source=fs.readFileSync(new URL('../dist/research-view.js',import.meta.url),'utf8'),start=source.indexOf('function syncAnnualFieldIssues'),end=source.indexOf('function startingComparison',start),sync=source.slice(start,end);
 assert.doesNotMatch(sync,/\.focus\(|role.*alert|aria-live|innerHTML|\.value\s*=/);
 const css=fs.readFileSync(new URL('../dist/workspace.css',import.meta.url),'utf8');assert.match(css,/annual-field-error\{display:block;color:var\(--ink\)/);assert.match(css,/data-annual-error-kind\]\{border-color:var\(--error\);border-style:dashed/);
});

test('field errors: editor keyboard navigation and Undo retain recoverable field state',async()=>{
 const h=await startResearchWorkspace(),original=h.getState().draft.terminal.taxRate;
 const terminalTab=h.get('[data-annual-editor="terminal"]');terminalTab.click();
 h.input(cell('terminal','taxRate'),'75');terminalTab.dispatch('keydown',{key:'ArrowRight'});
 const claimsTab=h.get('[data-annual-editor="claims"]');assert.equal(h.focus(),claimsTab);assert.equal(claimsTab.getAttribute('aria-selected'),'true');
 terminalTab.click();assert.equal(invalid(h.get(cell('terminal','taxRate'))),'true');h.action('undo-edit');
 assert.equal(h.getState().draft.terminal.taxRate,original);assert.equal(invalid(h.get(cell('terminal','taxRate'))),'false');
});

test('field errors: company funding or terminal convergence failures do not mark individually valid cells',()=>{
 const d={ticker:'ARM',terminal:{growth:.03,margin:.4,taxRate:.2,wacc:.09,roic:.2},bridgeInputs:{cash:0},timing:{mode:'origin',stubFCFF:null,reason:'',asOf:'2026-10-19'}};
 for(const key of Object.keys(d.terminal))assert.equal(annualFieldIssue(d,'terminal',key),null);
 assert.equal(annualFieldIssue(d,'bridge','cash',{default:0,min:0}),null);
 for(const key of ['stubFCFF','reason','asOf'])assert.equal(annualFieldIssue(d,'timing',key),null);
});
