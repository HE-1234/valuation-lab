import test from 'node:test';
import assert from 'node:assert/strict';
import {enterPanel,updateFeedback,cancelMotion} from '../dist/motion.js';
function fixture(){
 const events=new Map(),docEvents=new Map(),mediaEvents=new Map(),animations=[];
 const media={matches:false,addEventListener:(n,f)=>mediaEvents.set(n,f)};
 const view={matchMedia:()=>media,addEventListener:(n,f)=>events.set(n,f)};
 const doc={hidden:false,defaultView:view,addEventListener:(n,f)=>docEvents.set(n,f)};
 const scope={contains:n=>n.parentElement===scope};
 const make=()=>({ownerDocument:doc,parentElement:scope,animate(frames,options){const a={frames,options,canceled:false,cancel(){this.canceled=true}};animations.push(a);return a;}});
 return {media,view,doc,scope,make,animations,events,docEvents,mediaEvents};
}
test('Independent: actual motion has noticeable finite translation, synchronous final state, optional API',()=>{
 const h=fixture(),n=h.make(),a=enterPanel(n);assert.ok(a.frames[0].transform!==a.frames[1].transform);assert.ok(a.options.duration>=220&&a.options.duration<=400);assert.equal(a.options.fill,'none');assert.equal(a.frames.at(-1).opacity,1);assert.equal(a.frames.at(-1).transform,'translateY(0)');assert.equal(enterPanel(null),null);assert.equal(enterPanel({ownerDocument:h.doc}),null);cancelMotion();
});
test('Independent: repeated panel actions cancel siblings and stale completions cannot untrack current animation',()=>{
 const h=fixture(),a=enterPanel(h.make()),stale=a.onfinish,b=enterPanel(h.make());assert.equal(a.canceled,true);assert.equal(a.onfinish,null);stale();const c=enterPanel(h.make());assert.equal(b.canceled,true);assert.equal(c.canceled,false);cancelMotion();assert.equal(c.canceled,true);
});
test('Independent: current reduced-motion preference cancels before returning and preference-change interrupts',()=>{
 const h=fixture(),n=h.make(),a=enterPanel(n);h.media.matches=true;assert.equal(enterPanel(n),null);assert.equal(a.canceled,true);assert.equal(h.animations.length,1);h.media.matches=false;const b=updateFeedback(n);h.media.matches=true;h.mediaEvents.get('change')();assert.equal(b.canceled,true);cancelMotion();
});
test('Independent: route departure and backgrounding cancel active result animations',()=>{
 const h=fixture(),n=h.make(),a=enterPanel(n);h.events.get('valuation:tab-change')();assert.equal(a.canceled,true);const b=updateFeedback(n);h.doc.hidden=true;h.docEvents.get('visibilitychange')();assert.equal(b.canceled,true);cancelMotion();
});
test('Independent: unrelated sibling scope stays active, nested cancellation is bounded',()=>{
 const h=fixture(),n=h.make(),a=updateFeedback(n),other={ownerDocument:h.doc,animate:n.animate},b=updateFeedback(other);cancelMotion(h.scope);assert.equal(a.canceled,true);assert.equal(b.canceled,false);cancelMotion();assert.equal(b.canceled,true);
});

import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {startStudio} from './v7-runtime-harness.mjs';
function animateWorkspace(h){
 const animations=[],events=new Map(),media={matches:false,addEventListener:(name,fn)=>events.set(name,fn)};
 h.document.defaultView={matchMedia:()=>media,addEventListener(){}};
 const proto=Object.getPrototypeOf(h.root||h.app);
 proto.animate=function(frames,options){const animation={node:this,frames,options,canceled:false,cancel(){this.canceled=true;this.oncancel?.();}};animations.push(animation);return animation;};
 let scrolls=0;proto.scrollIntoView=()=>scrolls++;
 return {animations,media,events,scrolls:()=>scrolls};
}
test('actual Annual handlers: view and input-group changes visibly animate once and interrupt departed panels',async()=>{
 const h=await startResearchWorkspace(),m=animateWorkspace(h);
 h.get('[data-annual-view="simulation"]').click();assert.equal(m.animations.length,1);assert.equal(m.animations[0].node,h.get('#annual-simulation-view'));
 h.get('[data-annual-view="simulation"]').click();assert.equal(m.animations.length,1);
 h.get('[data-annual-view="result"]').click();assert.equal(m.animations[0].canceled,true);assert.equal(m.animations.at(-1).options.duration,240);
 h.get('[data-annual-editor="terminal"]').click();const a=m.animations.at(-1);assert.equal(a.node,h.get('#annual-editor-panel-terminal'));h.get('[data-annual-editor="notes"]').click();assert.equal(a.canceled,true);
 const count=m.animations.length;h.get('[data-annual-editor="notes"]').click();assert.equal(m.animations.length,count);assert.equal(m.scrolls(),0);h.destroy();assert.ok(m.animations.every(a=>a.canceled));
});
test('actual Annual typing: immediate values, persistent focused inputs and bounded result-only feedback',async()=>{
 const h=await startResearchWorkspace(),m=animateWorkspace(h),field=h.get('[data-year-field="revenue"]');field.focus();
 h.input('[data-year-field="revenue"]','500000.123456');const first=[...m.animations];assert.equal(first.length,2);assert.equal(h.getState().draft.annual[0].revenue,500000.123456);
 h.input('[data-year-field="revenue"]','510000.987654');assert.ok(first.every(a=>a.canceled));assert.equal(m.animations.length,4);assert.equal(h.focus(),field);assert.equal(h.get('[data-year-field="revenue"]'),field);assert.equal(field.value,'510000.987654');
 assert.ok(m.animations.every(a=>a.options.duration===280&&a.frames[0].transform==='translateY(4px)'));assert.equal(m.scrolls(),0);
 m.media.matches=true;m.events.get('change')();assert.ok(m.animations.every(a=>a.canceled));const count=m.animations.length;h.input('[data-year-field="revenue"]','520000');assert.equal(m.animations.length,count);assert.equal(h.getState().draft.annual[0].revenue,520000);h.destroy();
});
test('actual Guided handlers: 6px group navigation and 4px result feedback do not replace editors or force scrolling',async()=>{
 const h=await startStudio({motion:true}),m=animateWorkspace(h),field=h.get('#g-growth');
 h.step(3);assert.equal(m.animations.at(-1).node,h.get('#editor-group-3'));assert.equal(m.animations.at(-1).frames[0].transform,'translateY(6px)');
 const count=m.animations.length;h.step(3);assert.equal(m.animations.length,count);h.step(2);field.focus();h.input('#g-growth','12');
 assert.equal(h.get('#g-growth'),field);assert.equal(h.focus(),field);assert.equal(h.state().assumptions.growth,.12);assert.ok(m.animations.slice(-2).every(a=>a.frames[0].transform==='translateY(4px)'));assert.equal(m.scrolls(),0);
 const previous=m.animations.slice(-2);h.input('#g-growth','13');assert.ok(previous.every(a=>a.canceled));h.get('#guided-view-simulation').click();assert.equal(m.animations.at(-1).node,h.get('#guided-pane-simulation'));cancelMotion();
});
