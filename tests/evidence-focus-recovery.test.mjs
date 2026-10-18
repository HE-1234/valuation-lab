// Shipped handlers and source preservation, not native-browser/AT certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {minimalDocument,startResearchWorkspace} from './research-workspace-harness.mjs';
import {createContextualEvidencePanel} from '../dist/contextual-evidence.js';
import {incrementalPackages} from '../dist/incremental-registry.js';
const catalogBundle=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const hiddenAncestor=node=>{for(let el=node;el;el=el.parentElement)if(el.hidden)return true;return false;};
function fixture(){
 const document=minimalDocument(),root=document.root;
 root.innerHTML='<div id="old-group"><button id="trigger">History</button></div><button id="selected-group">Terminal</button><input id="live-input"><div id="evidence-host"></div><article id="source">Dated source</article>';
 const get=selector=>root.querySelector(selector),fallback=get('#selected-group'),trigger=get('#trigger');let calls=0;
 const panel=createContextualEvidencePanel({host:get('#evidence-host'),getFocusFallback:()=>{calls++;return [trigger,fallback];},onClose:()=>{fallback.hidden=false;}});
 trigger.focus();panel.open({invoker:trigger,nodes:[get('#source')]});
 return {document,root,get,panel,fallback,trigger,calls:()=>calls};
}
for(const [name,disable]of [
 ['hidden ancestor',h=>h.get('#old-group').hidden=true],
 ['removed',h=>h.trigger.remove()],
 ['disabled',h=>h.trigger.disabled=true],
 ['aria-disabled',h=>h.trigger.setAttribute('aria-disabled','true')],
 ['inert ancestor',h=>h.get('#old-group').setAttribute('inert','')],
 ['disabled fieldset semantics',h=>h.trigger.matches=selector=>selector===':disabled'],
 ['CSS display/closed-details geometry',h=>h.trigger.getClientRects=()=>[]],
 ['CSS visibility',h=>h.document.defaultView={getComputedStyle:node=>({visibility:node===h.trigger?'hidden':'visible'})}]
])test('evidence focus recovery: '+name+' invoker returns to a usable logical fallback after closing',()=>{
 const h=fixture();try{
  disable(h);h.fallback.hidden=true; // onClose restores the workspace before resolution.
  h.panel.close();assert.equal(h.document.activeElement,h.fallback);assert.equal(h.calls(),1);
  assert.deepEqual(h.fallback.focusOptions,{preventScroll:true});assert.equal(h.panel.isOpen,false);assert.equal(hiddenAncestor(h.document.activeElement),false);
 }finally{h.panel.destroy();}
});
test('evidence focus recovery: visible original invoker retains priority over fallback',()=>{
 const h=fixture();try{h.panel.close();assert.equal(h.document.activeElement,h.trigger);assert.equal(h.calls(),0);}finally{h.panel.destroy();}
});
test('evidence focus recovery: Escape from a newer visible input retains it when the original invoker is hidden',()=>{
 const h=fixture();try{h.get('#old-group').hidden=true;const input=h.get('#live-input');input.focus();h.document.dispatch('keydown',{key:'Escape'});assert.equal(h.document.activeElement,input);assert.equal(h.calls(),0);}finally{h.panel.destroy();}
});
test('evidence focus recovery: passive close and teardown never acquire fallback focus',()=>{
 for(const action of ['passive','destroy']){const h=fixture();h.get('#old-group').hidden=true;const current=h.document.activeElement;if(action==='passive')h.panel.close({restoreFocus:false,restorePosition:false});else h.panel.destroy();assert.equal(h.document.activeElement,current);assert.equal(h.calls(),0);h.panel.destroy();}
});
test('evidence focus recovery: unavailable fallback is ignored rather than focused',()=>{
 const h=fixture();try{h.trigger.remove();h.fallback.disabled=true;const current=h.document.activeElement;h.panel.close();assert.equal(h.document.activeElement,current);assert.equal(h.calls(),1);}finally{h.panel.destroy();}
});
test('annual evidence focus recovery: Close and Escape return to the selected group across all 21 cases',async()=>{
 const h=await startResearchWorkspace({catalogBundle,incrementalBundle:incrementalPackages});let flows=0;
 try{
  for(const ticker of [...h.library.companies.map(c=>c.ticker),'KLAC','AMAT','LRCX','ASML','FN','CDNS','SNPS'])for(const dismiss of ['close','escape']){
   h.choose(ticker);h.get('[data-annual-editor="annual"]').click();
   const before=h.getState(),writes=h.writes.length,renders=h.root.innerHTMLWrites,inputs=h.root.querySelectorAll('[data-research-input]');
   const trigger=h.get('[data-annual-evidence="history"][data-evidence-field="growth"]');trigger.focus();trigger.click();
   h.get('[data-annual-editor="annual"]').onkeydown({key:'ArrowRight',preventDefault(){}});
   const selected=h.get('[data-annual-editor="terminal"]');assert.equal(h.focus(),selected);assert.equal(hiddenAncestor(trigger),true);
   const close=h.get('.contextual-evidence-close');close.focus();if(dismiss==='close')close.click();else h.document.dispatch('keydown',{key:'Escape'});
   assert.equal(h.focus(),selected,ticker+' '+dismiss);assert.equal(hiddenAncestor(selected),false);assert.equal(h.get('#annual-contextual-evidence').hidden,true);assert.deepEqual(selected.focusOptions,{preventScroll:true});
   assert.deepEqual(h.getState(),before);assert.equal(h.writes.length,writes);assert.equal(h.root.innerHTMLWrites,renders);assert.deepEqual(h.root.querySelectorAll('[data-research-input]'),inputs);flows++;
  }
  assert.equal(flows,42);
 }finally{h.destroy();}
});
test('annual evidence focus recovery: a hidden or disabled selected group falls back to the current central view',async()=>{
 const h=await startResearchWorkspace();try{
  const trigger=h.get('[data-annual-evidence="profitability"]');trigger.click();h.get('[data-annual-editor="terminal"]').click();
  h.get('[data-annual-editor="terminal"]').disabled=true;h.get('.contextual-evidence-close').focus();h.get('.contextual-evidence-close').click();
  assert.equal(h.focus(),h.get('[data-annual-view="result"]'));assert.equal(hiddenAncestor(h.focus()),false);
 }finally{h.destroy();}
});
test('evidence focus preservation: every V54 shipped byte is unchanged after seven exact evidence-focus substitutions and exact simulation-focus hooks',()=>{
 const cwd=new URL('..',import.meta.url),baseline='b61154d932479546dfa4fe0aa42d567a6f8e4f74',hooks=JSON.parse(fs.readFileSync(new URL('./fixtures/reference-defaults-reviewed-hooks.json',import.meta.url))).files;
 const paths=execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');let count=0;
 for(const path of paths){let bytes=fs.readFileSync(new URL('../'+path,import.meta.url));const replacements=(hooks[path]||[]).filter(h=>['evidence-focus-recovery','simulation-focus-continuity'].includes(h.change));if(replacements.length){let source=bytes.toString();for(const replacement of replacements){assert.equal(source.split(replacement.reviewedAdditiveLine).length-1,1,path);source=source.replace(replacement.reviewedAdditiveLine,replacement.originalLine);if(replacement.change==='evidence-focus-recovery')count++;}bytes=Buffer.from(source);}assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+path],{cwd,maxBuffer:20e6}),path);}
 assert.equal(count,7);assert.ok(paths.length>150);
});
test('evidence focus recovery: browser body/html focus after a removed outside input recovers logically',()=>{
 for(const property of ['body','documentElement']){const h=fixture();try{
  h.trigger.remove();const outside=h.get('#live-input');outside.focus();outside.remove();
  // Model the browser default activeElement after the focused input is removed.
  const defaultElement=h.document.createElement(property==='body'?'body':'html');h.root.appendChild(defaultElement);h.document[property]=defaultElement;defaultElement.focus();
  h.document.dispatch('keydown',{key:'Escape'});assert.equal(h.document.activeElement,h.fallback);assert.equal(h.calls(),1);
 }finally{h.panel.destroy();}}
});
