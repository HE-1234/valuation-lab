import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createThemeTransition} from '../dist/theme-transition.js';
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};}
function fixture({supported=true,reduced=false,throws=false}={}) {
 const attrs=new Set(),events={},winEvents={},timers=new Map(),calls=[],runs=[];
 const media={matches:reduced,addEventListener(_,fn){this.changed=fn}};
 const root={dataset:{theme:'slate'},setAttribute:k=>attrs.add(k),removeAttribute:k=>attrs.delete(k)};
 const doc={documentElement:root,hidden:false,addEventListener:(n,f)=>events[n]=f};
 if(supported)doc.startViewTransition=callback=>{
  if(throws)throw Error('Other transition');
  const ready=deferred(),finished=deferred(),updated=deferred();
  const run={callback,ready,finished,updated,skips:0,commit(){callback();updated.resolve()},skipTransition(){this.skips++;ready.reject(Error('Skipped'));finished.resolve()}};
  runs.push(run);return {ready:ready.promise,finished:finished.promise,updateCallbackDone:updated.promise,skipTransition:()=>run.skipTransition()};
 };
 const win={matchMedia:()=>media,addEventListener:(n,f)=>winEvents[n]=f,setTimeout:f=>{const id=Symbol();timers.set(id,f);return id},clearTimeout:id=>timers.delete(id)};
 const controller=createThemeTransition((t,p)=>{calls.push([t,p]);root.dataset.theme=t},doc,win);
 return {controller,doc,root,media,events,winEvents,timers,calls,runs,active:()=>attrs.has('data-theme-sweep')};
}
test('theme sweep: six choices commit once, keep exact theme identity and clean up',async()=>{
 for(const theme of ['forest','slate','midnight','sand','plum','ocean']){
  const h=fixture();h.root.dataset.theme='other';h.controller.select(theme);assert.equal(h.calls.length,0);assert.ok(h.active());
  h.runs[0].commit();h.runs[0].ready.resolve();await tick();assert.deepEqual(h.calls,[[theme,true]]);
  h.runs[0].finished.resolve();await tick();assert.equal(h.root.dataset.theme,theme);assert.equal(h.active(),false);assert.equal(h.timers.size,0);
 }
});
test('theme sweep: rapid pre-capture choices ignore all stale callbacks and completion',async()=>{
 const h=fixture();h.controller.select('forest');const old=h.runs[0];h.controller.select('midnight');
 old.commit();await tick();assert.equal(h.calls.length,0);assert.ok(h.active());assert.equal(old.skips,1);
 h.runs[1].commit();assert.deepEqual(h.calls,[['midnight',true]]);
 h.runs[1].finished.resolve();await tick();assert.equal(h.active(),false);
});
test('theme sweep: rapid in-flight choices do not queue or let old completion clear current sweep',async()=>{
 const h=fixture();for(const theme of ['forest','sand','plum','ocean']){h.controller.select(theme);h.runs.at(-1).commit();}
 await tick();assert.ok(h.active());assert.equal(h.root.dataset.theme,'ocean');assert.equal(h.timers.size,1);
 h.runs.at(-1).finished.resolve();await tick();assert.equal(h.active(),false);assert.equal(h.timers.size,0);
});
test('theme sweep: unsupported API, reduced motion, unchanged theme and API failure apply immediately',()=>{
 for(const options of [{supported:false},{reduced:true},{throws:true}]){
  const h=fixture(options);h.controller.select('forest');assert.deepEqual(h.calls,[['forest',true]]);assert.equal(h.active(),false);assert.equal(h.timers.size,0);
 }
 const h=fixture();h.controller.select('slate');assert.equal(h.runs.length,0);assert.deepEqual(h.calls,[['slate',true]]);
});
test('theme sweep: cross-tab immediate change supersedes pending local intent without persistence',async()=>{
 const h=fixture();h.controller.select('forest');h.controller.select('plum',false,false);h.runs[0].commit();await tick();
 assert.deepEqual(h.calls,[['plum',false]]);assert.equal(h.active(),false);
});
test('theme sweep: lifecycle interruptions settle pending intent and leave no effect or timer',async()=>{
 for(const interrupt of [h=>{h.doc.hidden=true;h.events.visibilitychange()},h=>h.winEvents.resize(),h=>h.winEvents.pagehide(),h=>{h.media.matches=true;h.media.changed()},h=>h.controller.finish(),h=>[...h.timers.values()][0]()]){
  const h=fixture();h.controller.select('midnight');interrupt(h);h.runs[0].commit();await tick();
  assert.deepEqual(h.calls,[['midnight',true]]);assert.equal(h.active(),false);assert.equal(h.timers.size,0);
 }
});
test('theme sweep: capture failure settles theme with consumed rejection',async()=>{
 const h=fixture();h.controller.select('ocean');h.runs[0].ready.reject(Error('Overlapping transition'));await tick();
 assert.deepEqual(h.calls,[['ocean',true]]);assert.equal(h.active(),false);h.runs[0].commit();assert.equal(h.calls.length,1);
});
test('theme sweep: style is a 600ms horizontal reveal without palette/layout/focus mutations',()=>{
 const css=fs.readFileSync(new URL('../dist/theme-transition.css',import.meta.url),'utf8');
 assert.match(css,/600ms/);assert.match(css,/inset\(0 100% 0 0\)/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/pointer-events: none/);
 assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|--(?:paper|surface|accent):|position:\s*fixed/);
 const js=fs.readFileSync(new URL('../dist/theme-transition.js',import.meta.url),'utf8');assert.doesNotMatch(js,/\.focus\(|cloneNode|innerHTML|scrollTo|localStorage/);
 const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');assert.match(app,/b\.onclick=\(\)=>themeTransition.select\(b.dataset.themeChoice,true\)/);
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(html,/href="theme-transition.css"/);
});
