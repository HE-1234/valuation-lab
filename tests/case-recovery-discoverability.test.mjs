// Synthetic-DOM recovery and presentation checks; not browser geometry or AT certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {incrementalPackages} from '../dist/incremental-registry.js';
import {setLocale,clearTranslationDiagnostics,getMissingTranslations} from '../dist/i18n.js';
import {localizeAnnualPresentation} from '../dist/annual-localization.js';

const menu=h=>h.get('.research-action-menu');
const summary=h=>menu(h).querySelector('summary');
const edit=h=>h.get('[data-research-action="undo-edit"]');
const undo=h=>h.get('[data-research-action="undo"]');
const catalogBundle=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const enhanceDOM=root=>{
 const proto=Object.getPrototypeOf(root),query=proto.querySelectorAll;
 proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part.trim())))];};
 proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};
};

test('case recovery: field edits alone do not advertise full-case Undo',async()=>{
 const h=await startResearchWorkspace();try{
  assert.equal(summary(h).textContent,'Case actions');assert.equal(menu(h).open,false);assert.equal(undo(h).disabled,true);assert.equal(edit(h).disabled,true);
  h.input('[data-year-field="revenue"]','612345.678901');
  assert.equal(edit(h).disabled,false);assert.equal(undo(h).disabled,true);assert.equal(summary(h).textContent,'Case actions');
  h.action('undo-edit');assert.equal(summary(h).textContent,'Case actions');assert.equal(edit(h).disabled,true);
 }finally{h.destroy();}
});

test('case recovery: research loading exposes available full-case Undo while retaining exact prior draft',async()=>{
 const h=await startResearchWorkspace();try{
  h.input('[data-year-field="revenue"]','612345.678901');h.input('#research-notes','Keep my dated evidence and original reasoning.');
  const prior=h.getState().draft;h.action('use-research');
  assert.equal(summary(h).textContent,'Case actions · Undo available');assert.equal(menu(h).open,false);assert.equal(undo(h).disabled,false);assert.equal(edit(h).disabled,true);
  h.action('use-research');assert.equal(summary(h).textContent,'Case actions · Undo available');
  h.input('[data-year-field="margin"]','31.23456789');assert.equal(edit(h).disabled,false);assert.equal(undo(h).disabled,false);
  h.action('undo-edit');assert.equal(summary(h).textContent,'Case actions · Undo available');assert.equal(edit(h).disabled,true);
  h.action('undo');assert.deepEqual(h.getState().draft,prior);assert.equal(summary(h).textContent,'Case actions');assert.equal(undo(h).disabled,true);
 }finally{h.destroy();}
});

test('case recovery: availability follows persisted and per-company history without leaking to other companies',async()=>{
 const storage=new Map();let h=await startResearchWorkspace({storage});let prior;
 try{h.input('[data-year-field="revenue"]','612345.678901');prior=h.getState().draft;h.action('use-research');}finally{h.destroy();}
 h=await startResearchWorkspace({storage});try{
  assert.equal(summary(h).textContent,'Case actions · Undo available');assert.equal(undo(h).disabled,false);
  h.select('MU');assert.equal(summary(h).textContent,'Case actions');assert.equal(undo(h).disabled,true);
  h.select('AAPL');assert.equal(summary(h).textContent,'Case actions · Undo available');h.action('undo');assert.deepEqual(h.getState().draft,prior);assert.equal(summary(h).textContent,'Case actions');
 }finally{h.destroy();}
});

test('case recovery: operating-only reload uses the same visible recovery cue and restores the entire draft',async()=>{
 const h=await startResearchWorkspace();try{
  h.input('[data-year-field="revenue"]','612345.678901');h.input('#research-notes','Operating-only reload must preserve this.');const prior=h.getState().draft;
  h.action('load');assert.equal(summary(h).textContent,'Case actions · Undo available');assert.equal(edit(h).disabled,true);assert.equal(h.getState().draft.notes,prior.notes);
  h.action('undo');assert.deepEqual(h.getState().draft,prior);assert.equal(summary(h).textContent,'Case actions');
 }finally{h.destroy();}
});

test('case recovery: named incremental scenarios expose the cue without changing full-case recovery',async()=>{
 const h=await startResearchWorkspace({catalogBundle,incrementalBundle:incrementalPackages});try{
  for(const ticker of ['KLAC','AMAT','LRCX','ASML','FN','CDNS','SNPS']){
   h.choose(ticker);const prior=h.getState().draft,button=h.get('[data-research-action="incremental-alternative"]')||h.get('[data-research-action="incremental-downside"]');assert.ok(button,ticker);
   button.click();assert.equal(summary(h).textContent,'Case actions · Undo available',ticker);assert.equal(edit(h).disabled,true);assert.equal(undo(h).disabled,false);
   h.action('undo');assert.deepEqual(h.getState().draft,prior,ticker);assert.equal(summary(h).textContent,'Case actions');
  }
 }finally{h.destroy();}
});

test('case recovery: live bilingual wording preserves disclosure, input nodes, focus, exact draft and writes',async()=>{
 setLocale('en');clearTranslationDiagnostics();const h=await startResearchWorkspace();try{
  enhanceDOM(h.root);h.input('[data-year-field="revenue"]','612345.678901');h.action('use-research');localizeAnnualPresentation(h.root);
  const node=summary(h),disclosure=menu(h),controls=h.root.querySelectorAll('input'),before=h.getState(),writes=h.writes.length,renders=h.root.innerHTMLWrites;
  disclosure.open=true;node.focus();setLocale('zh-Hans');
  assert.equal(node.textContent,'案例操作 · 可复原');assert.equal(undo(h).textContent,'复原上次案例变更');assert.equal(edit(h).disabled,true);
  assert.strictEqual(summary(h),node);assert.strictEqual(menu(h),disclosure);assert.equal(disclosure.open,true);assert.strictEqual(h.focus(),node);assert.deepEqual(h.root.querySelectorAll('input'),controls);assert.deepEqual(h.getState(),before);assert.equal(h.writes.length,writes);assert.equal(h.root.innerHTMLWrites,renders);
  setLocale('en');assert.equal(node.textContent,'Case actions · Undo available');h.action('undo');setLocale('zh-Hans');assert.equal(summary(h).textContent,'案例操作');assert.equal(undo(h).disabled,true);
  assert.deepEqual(getMissingTranslations().filter(x=>x.key.startsWith('annual.')),[]);
 }finally{setLocale('en');h.destroy();}
});

test('case recovery: every V53 shipped byte is unchanged after reversing four wording substitutions and exact evidence/simulation-focus hooks',()=>{
 const cwd=new URL('..',import.meta.url),baseline='b687a7f',hooks=JSON.parse(fs.readFileSync(new URL('./fixtures/reference-defaults-reviewed-hooks.json',import.meta.url))).files;
 const files=execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');let count=0;
 for(const path of files){let actual=fs.readFileSync(new URL('../'+path,import.meta.url));const approved=(hooks[path]||[]).filter(h=>['case-recovery-discoverability','evidence-focus-recovery','simulation-focus-continuity','simulation-replay-focus','learn-question-visibility'].includes(h.change));
  if(approved.length){let source=actual.toString();for(const h of approved){assert.equal(source.split(h.reviewedAdditiveLine).length-1,1,path);source=source.replace(h.reviewedAdditiveLine,h.originalLine);if(h.change==='case-recovery-discoverability')count++;}actual=Buffer.from(source);}
  assert.deepEqual(actual,execFileSync('git',['show',baseline+':'+path],{cwd,maxBuffer:20e6}),path);
 }
 assert.equal(count,4);assert.ok(files.length>150);
});
