// Native handlers plus synthetic adapters. Native pointer capture and AT speech require browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {URL} from 'node:url';
import {minimalDocument} from './report-ui-repair-dom.mjs';
import {phaseAPI} from './report-ui-repair-phases.mjs';
import {companyPickerHTML,bindCompanyPicker} from '../dist/company-catalog-view.js';
import {t} from '../dist/i18n.js';
import {fixture as simulationFixture} from './v7-simulation-harness.mjs';
const source=()=>fs.readFileSync(new URL('../dist/skins/report-ux.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
function base(){
 const document=minimalDocument(),root=document.root,frames=[];
 document.body=root;document.documentElement={dataset:{skin:'report'}};
 document.createRange=()=>({});document.hidden=false;document.getElementById=id=>root.querySelector('#'+id);
 const proto=Object.getPrototypeOf(root),queryAll=proto.querySelectorAll;
 proto.querySelectorAll=function(s){s=s.replace(':not(.error)','');return s.startsWith(':scope > ')?this.children.filter(n=>queryAll.call(this,s.slice(9)).includes(n)):queryAll.call(this,s);};
 Object.defineProperty(proto,'classList',{configurable:true,get(){const node=this;return {contains:x=>node.className.split(/\s+/).includes(x),add(...xs){node.className=[...new Set([...node.className.split(/\s+/).filter(Boolean),...xs])].join(' ')},remove(...xs){node.className=node.className.split(/\s+/).filter(x=>!xs.includes(x)).join(' ')},toggle(x,force){const on=force??!this.contains(x);on?this.add(x):this.remove(x);return on;}};}});
 Object.defineProperty(proto,'options',{get(){return this.children.filter(x=>x.tag==='option');}});
 Object.defineProperty(proto,'selectedOptions',{get(){return this.options.filter(x=>x.value===this.value);}});
 Object.defineProperty(proto,'childElementCount',{get(){return this.children.length;}});
 proto.append=function(...nodes){for(const n of nodes)this.appendChild(n);};
 proto.after=function(n){this.parent.insertBefore(n,this.nextSibling);};
 proto.dispatchEvent=function(e){this.dispatch(e.type);return true;};
 const context={document,matchMedia:()=>({matches:true,addEventListener(){}}),MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}unobserve(){}},IntersectionObserver:class{observe(){}unobserve(){}},requestAnimationFrame:f=>frames.push(f),performance:{now:()=>1},Event,CSS:{escape:x=>x},onLocaleChange(){},getLocale:()=> 'en',t,setTimeout,clearTimeout,queueMicrotask};
 vm.runInNewContext(source()+'\nglobalThis.api={enhanceCatalog,scanSimulation};',context);
 frames.length=0;
 return {document,root,api:context.api,flush(){const pending=frames.splice(0);for(const f of pending)f();}};
}
function catalog({rebuild=false}={}){
 const h=base(),entries=[['AAPL','Apple'],['MSFT','Microsoft'],['NVDA','Nvidia']].map(([id,company])=>({id,ticker:id,company,readiness:'ready'}));let selected='MSFT';
 function render(){h.root.innerHTML=companyPickerHTML(entries,selected);bindCompanyPicker(h.root,entries,selected,v=>{selected=v;if(rebuild)render();});}
 render();h.api.enhanceCatalog(h.root.querySelector('.catalog-picker'));
 return {...h,get selected(){return selected;},input:()=>h.root.querySelector('#catalog-search'),list:()=>h.root.querySelector('.rx-results'),open(){const i=this.input();i.focus();i.dispatch('focus');},key(key){this.input().dispatch('keydown',{key});}};
}
for(const rebuild of [false,true])test(`catalog live keyboard rows and visible focus survive Escape/ArrowDown/Enter (rebuild=${rebuild})`,()=>{
 const h=catalog({rebuild});h.open();h.key('Escape');h.key('ArrowDown');
 const active=h.list().querySelectorAll('[role="option"]').filter(x=>x.classList.contains('is-active'));
 assert.equal(active.length,1);assert.equal(active[0].dataset.value,'NVDA');assert.equal(h.input().getAttribute('aria-activedescendant'),active[0].id);
 h.key('Enter');assert.equal(h.selected,'NVDA');assert.equal(h.document.activeElement,h.input());assert.equal(h.list().hidden,true);h.flush();assert.equal(h.document.activeElement,h.input());assert.equal(h.input().getAttribute('aria-expanded'),'false');
});
test('catalog focus restoration does not steal a later keyboard move',()=>{
 const h=catalog({rebuild:true});h.open();h.key('ArrowDown');h.key('Enter');const later=h.document.createElement('button');h.root.append(later);later.focus();h.flush();assert.equal(h.document.activeElement,later);
});
test('catalog combobox owns the live listbox and clipped native select is out of tab/AT navigation',()=>{
 const h=catalog(),select=h.root.querySelector('#research-company');assert.equal(select.getAttribute('tabindex'),'-1');assert.equal(select.getAttribute('aria-hidden'),'true');assert.equal(h.input().getAttribute('aria-controls'),h.list().id);assert.equal(h.input().getAttribute('aria-owns'),null);
});
test('phase pointer gesture continues across repeated native horizon rebuilds on stable capture',()=>{
 const h=phaseAPI({type:'margin',values:[3,6,10],rebuild:'always'}),old=h.state,track=old.el.querySelector('.rx-ph-track');
 track.listeners.pointerdown({target:old.handles[2],button:0,pointerId:4,clientX:231,preventDefault(){}});
 h.documentEvents.get('pointermove')({pointerId:4,clientX:254});let fresh=h.api.timelines.get(h.current);
 assert.notEqual(fresh,old);assert.equal(h.current.fields[2].value,'11');assert.ok(fresh.drag);assert.equal(fresh.span,old.span);assert.equal(fresh.drag.capture,h.document.documentElement);
 h.documentEvents.get('pointermove')({pointerId:4,clientX:277});fresh=h.api.timelines.get(h.current);assert.equal(h.current.fields[2].value,'12');assert.ok(fresh.drag);assert.equal(h.document.activeElement,fresh.handles[2]);
 h.documentEvents.get('pointermove')({pointerId:5,clientX:299});assert.equal(h.current.fields[2].value,'12');
 h.documentEvents.get('pointerup')({pointerId:4});assert.equal(fresh.drag,null);assert.deepEqual(h.captureEvents,[['capture',4],['release',4]]);assert.equal(fresh.span,15);
});
test('phase bubbling move is applied once; cancel and lost capture close the gesture',()=>{
 for(const ending of ['pointercancel','lostpointercapture']){
  const h=phaseAPI({type:'margin'}),track=h.state.el.querySelector('.rx-ph-track');track.listeners.pointerdown({target:h.state.handles[2],button:0,pointerId:1,clientX:231,preventDefault(){}});
  const move={pointerId:1,clientX:254};track.listeners.pointermove(move);h.documentEvents.get('pointermove')(move);assert.equal(h.events.length,2);
  h.documentEvents.get(ending)({pointerId:1,target:h.document.documentElement});assert.equal(h.state.drag,null);assert.equal(h.captureEvents.at(-1)[0],'release');
 }
});
test('phase controls mirror disabled, read-only and invalid source semantics without stale values',()=>{
 const h=phaseAPI();h.current.fields[1].disabled=true;h.current.fields[2].readOnly=true;h.api.paint(h.current);
 assert.equal(h.state.handles[1].disabled,true);assert.equal(h.state.handles[1].tabIndex,-1);assert.equal(h.state.handles[1].getAttribute('aria-disabled'),'true');assert.equal(h.state.handles[2].getAttribute('aria-readonly'),'true');assert.equal(h.state.handles[2].tabIndex,-1);
 h.key(1,'ArrowRight');h.key(2,'ArrowRight');assert.equal(h.events.length,0);
 h.current.fields[0].value='';h.api.paint(h.current);for(const handle of h.state.handles){assert.equal(handle.disabled,true);assert.equal(handle.getAttribute('aria-invalid'),'true');assert.equal(handle.getAttribute('aria-valuenow'),null);assert.equal(handle.getAttribute('aria-valuetext'),null);}
 h.current.fields[0].value='3';h.api.paint(h.current);assert.equal(h.state.handles[0].disabled,false);assert.equal(h.state.handles[0].tabIndex,0);assert.equal(h.state.handles[0].getAttribute('aria-valuenow'),'3');assert.equal(h.state.handles[0].getAttribute('aria-invalid'),'false');
});
test('idle Run CTA is exposed to AT and transfers focus before the native output is replaced',()=>{
 const native=simulationFixture({ticker:'REPAIRED-CTA',runOnMount:false,reduced:true,autoplay:false});try{
  const h=base();h.root.innerHTML='<section class="simulation-lab"><button class="mc-run-button">Run simulation</button><div class="mc-output">'+native.get('#mc-output').innerHTML+'</div></section>';
  const run=h.root.querySelector('.mc-run-button'),output=h.root.querySelector('.mc-output');let calls=0;
  run.onclick=()=>{calls++;assert.equal(h.document.activeElement,run);native.get('#mc-run').click();output.innerHTML=native.get('#mc-output').innerHTML;};h.api.scanSimulation();const cta=h.root.querySelector('.rx-run-cta');assert.ok(cta);assert.notEqual(cta.parentElement.getAttribute('aria-hidden'),'true');cta.focus();cta.click();assert.equal(calls,1);assert.equal(cta.isConnected,false);assert.equal(h.document.activeElement,run);assert.equal(native.get('#mc-output').getAttribute('data-result-state'),'current');
 }finally{native.cleanup();}
});
test('async CTA activation leaves focus on available Cancel while Run is disabled',()=>{
 const h=base();h.root.innerHTML='<section class="simulation-lab"><button class="mc-run-button">Run simulation</button><button id="mc-cancel" hidden>Cancel</button><div class="mc-output"><div class="mc-empty-state" aria-hidden="true"></div></div></section>';
 // Minimal selector fixture deliberately maps this one suffix selector.
 const lab=h.root.querySelector('.simulation-lab'),query=lab.querySelector.bind(lab);lab.querySelector=s=>s==='[id$="mc-cancel"]'?query('#mc-cancel'):query(s);
 const run=query('.mc-run-button'),cancel=query('#mc-cancel');let calls=0;run.onclick=()=>{calls++;run.disabled=true;cancel.hidden=false;query('.mc-output').innerHTML='pending';};h.api.scanSimulation();const cta=query('.rx-run-cta');cta.focus();cta.click();assert.equal(calls,1);assert.equal(h.document.activeElement,cancel);
});
