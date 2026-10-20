// Focused guide/choice adapter regression. Uses the shipped report UX choice builder.
// Strict focus eligibility here detects hidden-target mistakes; native keyboard
// focus, browser disclosure timing, CSS layout, and AT still need browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {guideFixture} from './simulation-guide-dom-harness.mjs';
import {getLocale,t} from '../dist/i18n.js';

function choices(h) {
 const {document}=h, p=Object.getPrototypeOf(h.root), focus=p.focus;
 Object.defineProperties(p, {
  options:{get(){return this.children.filter(n=>n.tagName==='OPTION');}},
  labels:{get(){return document.querySelectorAll(`label[for="${this.id}"]`);}},
  nextElementSibling:{get(){return this.nextSibling;}}
 });
 p.focus=function(options){
  if(!this.checkVisibility()||this.disabled||this.closest('[inert]'))return;
  if(!this.matches('input, select, textarea, button, summary, a[href], [tabindex]'))return;
  focus.call(this,options);
 };
 document.createRange=()=>({selectNodeContents(){},getBoundingClientRect:()=>({width:0})});
 const Observer=class{observe(){}unobserve(){}disconnect(){}};
 const context={document,getLocale,t,onLocaleChange(){},
  matchMedia:()=>({matches:true,addEventListener(){}}),
  MutationObserver:Observer,ResizeObserver:Observer,IntersectionObserver:Observer,
  // Unrelated UX scans/animations are outside this focused adapter test.
  requestAnimationFrame(){},setTimeout(){},clearTimeout(){},queueMicrotask,performance,Event,CSS:{escape:x=>x}
 };
 const source=fs.readFileSync(new URL('../dist/skins/report-ux.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
 vm.runInNewContext(source+'\nglobalThis.choiceAPI={buildChoice,syncChoice};',context);
 return context.choiceAPI;
}
function reveal(node){for(let n=node.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;}

for(const phone of [false,true])test(`Edit opens UMC terminal disclosure and focuses shipped checked radio (${phone?'phone':'desktop'})`,async()=>{
 const h=guideFixture({research:true,ticker:'UMC',phone});
 try{
  h.get('#mc-tab-taxTerminal').click();await h.flush();
  const api=choices(h),field=h.get('#mc-terminal-growth-type'),section=field.closest('details');
  const group=api.buildChoice(field),chosen=group.querySelector('[aria-checked="true"]');
  const edit=h.root.querySelector('.rx-mcg [data-edit="terminal-growth-type"]');
  reveal(edit);section.open=false;edit.focus();
  assert.equal(h.document.activeElement,edit);
  chosen.focus();assert.equal(h.document.activeElement,edit,'Hidden choice must not accept focus in this fixture');
  const before=structuredClone(h.root.mcState.config),eventCount=h.events.length;
  edit.click();
  assert.equal(section.open,true);
  assert.equal(chosen.checkVisibility(),true);
  assert.equal(h.document.activeElement,chosen);
  assert.equal(chosen.getAttribute('role'),'radio');
  assert.equal(chosen.tabIndex,0);
  assert.equal(field.getAttribute('aria-hidden'),'true');
  assert.equal(field.tabIndex,-1);
  assert.equal(chosen.lastScroll.behavior,'auto');
  assert.deepEqual(h.root.mcState.config,before);
  assert.equal(h.events.length,eventCount,'Navigation must not emit a simulation state change');
  await h.flush();assert.equal(h.document.activeElement,chosen,'Focus must persist after the guide settles');
 }finally{h.cleanup();}
});

for(const phone of [false,true])test(`Legacy terminal guide keeps context without an unavailable Edit (${phone?'phone':'desktop'})`,async()=>{
 const h=guideFixture({research:true,ticker:'UMC',phone});
 try{
  h.get('#mc-tab-growthPremium').click();await h.flush();
  h.get('#mc-growth-method').value='legacy';h.get('#mc-growth-method').dispatch('change');await h.flush();
  h.get('#mc-tab-taxTerminal').click();await h.flush();
  assert.equal(h.root.mcState.config.method,'legacy');
  assert.equal(h.get('#mc-metric-panel-terminal').hidden,true);
  const before=structuredClone(h.root.mcState.config),eventCount=h.events.length;
  for(const key of ['growth','taxRate','roic']){
   const row=h.root.querySelector(`.rx-mcg [data-f="terminal-${key}-type"]`);
   assert.ok(row,'Terminal explanation is retained');
   assert.ok(row.textContent.length>0);
   assert.equal(row.querySelector('[data-edit]'),null,'Hidden terminal setting must not offer Edit');
  }
  h.guideAPI.paint(h.root);
  assert.deepEqual(h.root.mcState.config,before);assert.equal(h.events.length,eventCount);
  h.get('#mc-tab-growthPremium').click();
  h.get('#mc-growth-method').value='joint-annual-path';h.get('#mc-growth-method').dispatch('change');await h.flush();
  h.get('#mc-tab-taxTerminal').click();await h.flush();
  assert.equal(h.get('#mc-metric-panel-terminal').hidden,false);
  const field=h.get('#mc-terminal-growth-type');assert.equal(field.closest('details').open,false);
  assert.ok(h.root.querySelector('.rx-mcg [data-edit="terminal-growth-type"]'),'Closed but available setting keeps Edit');
 }finally{h.cleanup();}
});

async function terminalFixture(){
 const h=guideFixture({research:true,ticker:'UMC'});
 h.get('#mc-tab-taxTerminal').click();await h.flush();
 const api=choices(h),field=h.get('#mc-terminal-growth-type'),section=field.closest('details');
 const group=api.buildChoice(field),chosen=group.querySelector('[aria-checked="true"]');
 const edit=h.root.querySelector('.rx-mcg [data-edit="terminal-growth-type"]');
 reveal(edit);section.open=false;edit.focus();
 return {...h,field,section,group,chosen,edit};
}


const revealClass='rx-mcg-edit-reveal';
function pseudoHiddenFixture(h){
 let hidden=true,reads=0,attempts=0;
 const focus=h.chosen.focus.bind(h.chosen),atFocus=[];
 Object.defineProperty(h.section,'offsetHeight',{get(){
  reads++;
  if(this.open&&this.classList.contains(revealClass))hidden=false;
  return hidden?30:300;
 }});
 h.chosen.focus=options=>{
  attempts++;atFocus.push({hidden,temporary:h.section.classList.contains(revealClass),open:h.section.open});
  if(!hidden)focus(options);
 };
 return {get hidden(){return hidden;},get reads(){return reads;},get attempts(){return attempts;},atFocus};
}

test('Edit-only reveal overrides shipped pseudo content visibility without changing manual animation',()=>{
 const css=fs.readFileSync(new URL('../dist/skins/report.css',import.meta.url),'utf8');
 const rule=css.match(/& body \.mc-setup details\.rx-mcg-edit-reveal\[open\]::details-content\s*\{([^}]+)\}/);
 assert.ok(rule,'Override is restricted to an open target disclosure carrying the temporary Edit class');
 for(const declaration of ['transition: none !important','height: auto !important','content-visibility: visible !important'])assert.ok(rule[1].includes(declaration));
 assert.equal((css.match(/rx-mcg-edit-reveal/g)||[]).length,1);
 const base=fs.readFileSync(new URL('../dist/skins/skin-base.css',import.meta.url),'utf8');
 assert.match(base,/details::details-content\s*\{[^}]*transition:\s*height 340ms var\(--sk-ease\), content-visibility 340ms allow-discrete/s);
 const guide=fs.readFileSync(new URL('../dist/skins/report-mc-guide.js',import.meta.url),'utf8');
 const edit=guide.slice(guide.indexOf('function editField('),guide.indexOf('let repaintQueued'));
 assert.doesNotMatch(edit,/requestAnimationFrame|setTimeout|Promise|getAnimations/,'No deferred focus work remains');
 assert.match(edit,/finally\s*\{[^}]*classList\.remove/s);
});

test('closed Edit makes pseudo-hidden content ready before focusing the shipped checked control',async()=>{
 const h=await terminalFixture();
 try{
  const pseudo=pseudoHiddenFixture(h),before=structuredClone(h.root.mcState.config),eventCount=h.events.length;
  h.edit.click();
  assert.equal(h.section.open,true);assert.equal(pseudo.reads,1);assert.equal(pseudo.hidden,false);
  assert.equal(pseudo.attempts,1);assert.equal(h.document.activeElement,h.chosen);
  assert.deepEqual(pseudo.atFocus,[{hidden:false,temporary:true,open:true}]);
  assert.equal(h.section.classList.contains(revealClass),false,'Scoped override is cleaned after focus');
  assert.deepEqual(h.root.mcState.config,before);assert.equal(h.events.length,eventCount);
  await h.flush();assert.equal(pseudo.attempts,1,'No later focus attempt is scheduled');
 }finally{h.cleanup();}
});

test('already-open Edit leaves disclosure transition styling untouched',async()=>{
 const h=await terminalFixture();
 try{
  h.section.open=true;let reads=0,attempts=0;const focus=h.chosen.focus.bind(h.chosen);
  Object.defineProperty(h.section,'offsetHeight',{get(){reads++;return 300;}});
  h.chosen.focus=options=>{attempts++;assert.equal(h.section.classList.contains(revealClass),false);focus(options);};
  h.edit.click();assert.equal(h.document.activeElement,h.chosen);assert.equal(reads,0);assert.equal(attempts,1);
  await h.flush();assert.equal(attempts,1);
 }finally{h.cleanup();}
});

test('nested closed target disclosures reveal outermost first and leave open ancestors untouched',async()=>{
 const h=await terminalFixture();
 try{
  const outer=h.document.createElement('details'),existing=h.document.createElement('details');
  outer.innerHTML='<summary>Outer disclosure</summary>';existing.innerHTML='<summary>Already open</summary>';existing.open=true;
  h.section.parentElement.insertBefore(existing,h.section);existing.append(outer);outer.append(h.section);
  const order=[];for(const d of [outer,h.section])Object.defineProperty(d,'offsetHeight',{get(){
   assert.equal(outer.open,true);assert.equal(h.section.open,true);
   assert.equal(outer.classList.contains(revealClass),true);assert.equal(h.section.classList.contains(revealClass),true);
   assert.equal(existing.classList.contains(revealClass),false);order.push(d);return 300;
  }});
  h.edit.click();assert.deepEqual(order,[outer,h.section]);assert.equal(h.document.activeElement,h.chosen);
  for(const d of [outer,h.section,existing]){assert.equal(d.open,true);assert.equal(d.classList.contains(revealClass),false);}
 }finally{h.cleanup();}
});

for(const failure of ['layout','focus'])test(`Edit removes its temporary class if ${failure} throws`,async()=>{
 const h=await terminalFixture();
 try{
  if(failure==='layout')Object.defineProperty(h.section,'offsetHeight',{get(){throw Error('forced layout failure');}});
  else h.chosen.focus=()=>{throw Error('forced focus failure');};
  assert.throws(()=>h.edit.click(),new RegExp(`forced ${failure} failure`));
  assert.equal(h.section.classList.contains(revealClass),false);
  assert.equal(h.section.open,true);
 }finally{h.cleanup();}
});

test('repeated Edit navigation cleans up before later normal manual toggles',async()=>{
 const h=await terminalFixture();
 try{
  let open=h.section.open,manualOpens=0,reads=0;
  Object.defineProperty(h.section,'open',{get:()=>open,set(value){open=value;if(value&&!h.section.classList.contains(revealClass))manualOpens++;}});
  Object.defineProperty(h.section,'offsetHeight',{get(){reads++;assert.equal(h.section.classList.contains(revealClass),true);return 300;}});
  for(let i=0;i<2;i++){
   h.section.open=false;h.edit.focus();h.edit.click();
   assert.equal(h.document.activeElement,h.chosen);assert.equal(h.section.classList.contains(revealClass),false);
  }
  assert.equal(reads,2);assert.equal(manualOpens,0);
  h.section.open=false;h.section.open=true;assert.equal(manualOpens,1);
  assert.equal(h.section.classList.contains(revealClass),false,'Manual reopening has the normal skin transition');
 }finally{h.cleanup();}
});

test('synchronous Edit cannot steal a later focus move',async()=>{
 const h=await terminalFixture();
 try{
  h.edit.click();assert.equal(h.document.activeElement,h.chosen);
  const later=h.get('#mc-tab-growthPremium');later.focus();await h.flush();
  assert.equal(h.document.activeElement,later);
 }finally{h.cleanup();}
});

test('a stale Edit link does not reveal a now-hidden mode panel',async()=>{
 const h=await terminalFixture();
 try{
  h.get('#mc-metric-panel-terminal').hidden=true;h.edit.click();
  assert.equal(h.section.open,false);assert.equal(h.section.classList.contains(revealClass),false);
  assert.equal(h.document.activeElement,h.edit);
 }finally{h.cleanup();}
});
