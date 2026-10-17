// Synthetic DOM / scheduler / WAAPI coverage. These checks do not prove browser layout or frame rate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './v7-simulation-harness.mjs';
import {simulationDefaults,simulateCurrent} from '../dist/simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {researchDraftFor} from '../dist/research-model.js';
import {simulationResearchDefaults,simulateResearch} from '../dist/research-simulation.js';
const ticks=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const heights=h=>h.bars().map(b=>Number(b.getAttribute('height')));
async function drain(h,releases){for(let n=0;n<1000;n++){if(releases.length)releases.shift()();await ticks();if(h.get('#mc-output').getAttribute('aria-busy')!=='true')return;}assert.fail('simulation did not settle');}
const config=seed=>({...simulationDefaults(),trials:37,seed});

test('valid edits retain the exact completed graphic, disable stale interactions and replace only after completion',async()=>{
 const releases=[],h=fixture({ticker:'STABLE-EDIT',autoplay:false,synchronous:false,simulationConfig:config('before'),yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{
  await drain(h,releases);const oldChart=h.get('#mc-chart'),oldHeights=heights(h),height=h.get('#mc-output').style.minHeight;
  h.get('#mc-seed').value='after';h.get('#mc-seed').oninput();
  assert.equal(h.get('#mc-chart'),oldChart);assert.deepEqual(heights(h),oldHeights);assert.equal(h.get('#mc-output').style.minHeight,height);
  assert.equal(h.get('#mc-output').getAttribute('aria-busy'),'true');assert.equal(h.get('#mc-output').getAttribute('aria-hidden'),'true');assert.equal(h.get('#mc-output').inert,true);
  assert.match(h.get('#mc-run-progress').textContent,/Previous completed distribution.*does not reflect the current inputs/);
  assert.equal(h.get('#mc-chart').getAttribute('tabindex'),'-1');assert.equal(h.get('#mc-play').disabled,true);assert.equal(h.get('#mc-scrubber').disabled,true);assert.equal(h.get('#mc-summary-content').innerHTML,'');
  h.get('#mc-export').click();assert.equal(h.exports.length,0);h.runTimers();await drain(h,releases);
  assert.notEqual(h.get('#mc-chart'),oldChart);assert.equal(h.get('#mc-output').inert,false);assert.equal(h.get('#mc-run-progress').hidden,true);assert.equal(h.get('#mc-export').disabled,false);
  h.get('#mc-export').click();const saved=JSON.parse(await h.exports[0].text());assert.equal(saved.config.seed,'after');assert.deepEqual(saved.samples,simulateCurrent(h.snapshot,h.draft,saved.config).samples);
 }finally{h.cleanup()}
});

test('a same-case remount retains the previous completed view while a different source cannot inherit it',async()=>{
 let h=fixture({ticker:'STABLE-REMOUNT',rawId:'same-source',autoplay:false,simulationConfig:config('remount')});let before;
 try{before=heights(h);}finally{h.cleanup()}
 const releases=[];h=fixture({ticker:'STABLE-REMOUNT',rawId:'same-source',autoplay:false,synchronous:false,assumptions:{targetMargin:.36},simulationConfig:config('changed'),yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{
  assert.deepEqual(heights(h),before);assert.equal(h.get('#mc-output').inert,true);assert.equal(h.get('#mc-export').disabled,true);assert.match(h.get('#mc-run-progress').textContent,/Previous/);
  await drain(h,releases);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.notDeepEqual(heights(h),before);
 }finally{h.cleanup()}
 h=fixture({ticker:'STABLE-REMOUNT',rawId:'different-source',autoplay:false,synchronous:false,simulationConfig:config('new-source'),yieldControl:()=>new Promise(()=>{})});
 try{assert.equal(h.get('#mc-chart'),null);assert.match(h.get('#mc-output').innerHTML,/mc-chart-placeholder/);}finally{h.cleanup()}
});

test('invalid edits cancel pending work, remove stale values and retain the reserved output height',async()=>{
 const releases=[],h=fixture({ticker:'STABLE-INVALID',autoplay:false,synchronous:false,simulationConfig:config('valid'),yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{
  await drain(h,releases);const height=h.get('#mc-output').style.minHeight;h.get('#mc-seed').value='pending';h.get('#mc-seed').oninput();h.runTimers();
  h.get('#mc-growth-low').value='90';h.get('#mc-growth-low').oninput();assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-output').style.minHeight,height);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'unavailable');assert.equal(h.get('#mc-run-progress').hidden,true);assert.match(h.get('#mc-error').textContent,/low.*mode.*high/);
  for(const release of releases.splice(0))release();await ticks();assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-export').disabled,true);h.get('#mc-export').click();assert.equal(h.exports.length,0);
 }finally{h.cleanup()}
});

test('all-excluded results preserve dimensions and accounting while withholding chart, percentiles and export',async()=>{
 const releases=[],h=fixture({ticker:'STABLE-EMPTY',autoplay:false,synchronous:false,simulationConfig:config('empty'),yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{
  await drain(h,releases);const height=h.get('#mc-output').style.minHeight;
  for(const part of ['low','mode','high'])h.get('#mc-wacc-'+part).value='1';h.get('#mc-wacc-high').oninput();assert.ok(h.get('#mc-chart'));assert.equal(h.get('#mc-output').inert,true);h.runTimers();await drain(h,releases);
  assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-output').style.minHeight,height);assert.equal(h.get('#mc-summary-content').innerHTML,'');assert.match(h.get('#mc-audit').textContent,/37 attempted · 37 excluded/);assert.equal(h.get('#mc-export').disabled,true);h.get('#mc-export').click();assert.equal(h.exports.length,0);
 }finally{h.cleanup()}
});

test('cancelled particle callbacks cannot change a pending view or a later completed result',()=>{
 const h=fixture({ticker:'STABLE-CALLBACK',autoplay:false,simulationConfig:config('callback')});
 try{
  const full=heights(h);h.get('#mc-play').click();const oldCallbacks=h.animations.map(a=>a.onfinish).filter(Boolean);assert.ok(oldCallbacks.length>0);h.destroy.pending();
  for(const callback of oldCallbacks)callback();assert.deepEqual(heights(h),full);assert.equal(h.get('#mc-output').inert,true);assert.match(h.get('#mc-animation-status').textContent,/Previous/);
  h.get('#mc-seed').value='new-value';h.get('#mc-seed').oninput();const current=heights(h);for(const callback of oldCallbacks)callback();assert.deepEqual(heights(h),current);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');
  h.destroy();for(const callback of oldCallbacks)callback();assert.deepEqual(heights(h),current);
 }finally{h.cleanup()}
});

test('default completed chart and explicit replay retain full exact bins, with brief chart/tab motion and immediate reduced motion',()=>{
 const h=fixture({ticker:'STABLE-DEFAULT',autoplay:null,simulationConfig:config('default')});
 try{
  const full=heights(h);assert.equal(h.animations.length,0);assert.match(h.get('#mc-output').innerHTML,/>Replay simulation<\/button>/);assert.ok(full.some(n=>n>0));
  h.get('#mc-tab-sampling').click();assert.equal(h.animations.at(-1).options.duration,240);h.get('#mc-seed').value='new';h.get('#mc-seed').oninput();const changed=heights(h);assert.ok(h.animations.some(a=>a.options.duration===460));
  h.get('#mc-play').click();assert.match(h.get('#mc-play').textContent,/Pause replay/);h.get('#mc-play').click();assert.match(h.get('#mc-play').textContent,/Resume replay/);h.get('#mc-play').click();h.get('#mc-skip').click();assert.deepEqual(heights(h),changed);
  h.motion.matches=true;h.motion.dispatch('change');const count=h.animations.length;h.get('#mc-tab-growth').click();h.get('#mc-seed').value='reduced';h.get('#mc-seed').oninput();assert.equal(h.animations.length,count);assert.equal(h.get('#mc-play').disabled,true);assert.ok(heights(h).some(n=>n>0));
 }finally{h.cleanup()}
});

const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const annualDraft=()=>{const d=researchDraftFor(companies.find(c=>c.ticker==='AAPL'));d.researchSimulationConfig={...simulationResearchDefaults(),trials:20,seed:'stable-annual'};return d;};
function annual(d,opts={}){return fixture({autoplay:false,draftOverride:d,snapshotOverride:{ticker:d.ticker,currency:d.currency,periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d),...opts});}

test('annual remount keeps exact prior basis visibly stale, then reproduces the edited Fixed case',async()=>{
 const d=annualDraft();let h=annual(d),old;
 try{h.get('#mc-value-basis').value='perShare';h.get('#mc-value-basis').onchange();old=h.get('#mc-output').innerHTML;assert.match(old,/PER COMMON SHARE/);}finally{h.cleanup()}
 d.annual[0].margin+=.01;const releases=[];h=annual(d,{synchronous:false,yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{
  assert.equal(h.get('#mc-output').innerHTML,old);assert.equal(h.get('#mc-output').inert,true);assert.equal(h.get('#mc-value-basis').disabled,true);assert.match(h.get('#mc-run-progress').textContent,/Previous/);
  await drain(h,releases);assert.equal(h.get('#mc-value-basis').value,'perShare');assert.equal(h.bars().length,1);assert.equal(Number(h.get('#mc-chart').getAttribute('aria-valuenow')),simulateResearch(d,d.researchSimulationConfig).perShare.median);
  assert.ok(Object.values(d.researchSimulationConfig.drivers).every(driver=>driver.type==='fixed'));
 }finally{h.cleanup()}
});

test('failed async annual replacement hides cached values and preserves output geometry',async()=>{
 const d=annualDraft();let h=annual(d);try{assert.ok(h.get('#mc-chart'));}finally{h.cleanup()}
 const adapter=annualResearchSimulationAdapter(d);adapter.simulateAsync=async()=>{throw Error('Synthetic unavailable computation');};h=annual(d,{synchronous:false,adapter});
 try{const height=h.get('#mc-output').style.minHeight;assert.ok(h.get('#mc-chart'));await ticks();assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-output').style.minHeight,height);assert.match(h.get('#mc-error').textContent,/Synthetic unavailable/);assert.equal(h.get('#mc-export').disabled,true);}finally{h.cleanup()}
});

test('transition geometry is used only for matching histogram bounds and basis; fresh axes use an exact-mark fade',()=>{
 const h=fixture({ticker:'STABLE-TRANSITION',autoplay:false,simulationConfig:config('bounds')});
 try{h.get('#mc-growth-high').value='25';h.get('#mc-growth-high').oninput();const changes=h.animations.filter(a=>a.options.duration===460);assert.ok(changes.length);assert.ok(changes.every(a=>a.frames[0].transform==='scaleY(1)'));}finally{h.cleanup()}
});

test('pending charts remain explicitly previous through visibility and reduced-motion changes',()=>{
 const h=fixture({ticker:'STABLE-LIFECYCLE-STATUS',autoplay:false,simulationConfig:config('visibility')});
 try{
  h.destroy.pending();h.doc.hidden=true;h.doc.dispatch('visibilitychange');assert.match(h.get('#mc-animation-status').textContent,/Previous completed/);assert.match(h.get('#mc-run-progress').textContent,/current inputs/);
  h.motion.matches=true;h.motion.dispatch('change');h.motion.matches=false;h.motion.dispatch('change');assert.equal(h.get('#mc-play').disabled,true);assert.equal(h.get('#mc-output').inert,true);assert.equal(h.get('#mc-export').disabled,true);
 }finally{h.cleanup()}
});

test('chart labels keep physical text size on resize and label observers disconnect on destroy',()=>{
 const h=fixture({ticker:'STABLE-TEXT-SIZE',autoplay:false,simulationConfig:config('labels')});
 try{
  const chart=h.get('#mc-chart');assert.equal(chart.style['--mc-label-scale'],'1');chart.getBoundingClientRect=()=>({left:0,width:320,height:140});h.windowEvents.dispatch('resize');assert.equal(chart.style['--mc-label-scale'],'3');
  assert.match(h.get('#mc-output').innerHTML,/class="mc-chart-caption">Share of accepted scenarios/);assert.match(h.get('#mc-output').innerHTML,/class="mc-axis-title">USD PER ECONOMIC SHARE/);
  assert.equal(h.resizeObservers.length,1);assert.equal(h.resizeObservers[0].targets.at(-1),chart);h.destroy();assert.equal(h.resizeObservers[0].disconnected,true);
 }finally{h.cleanup()}
});

test('an active run that reports cancellation leaves an honest non-busy, non-exportable state',async()=>{
 const d=annualDraft(),adapter=annualResearchSimulationAdapter(d);adapter.simulateAsync=async()=>{const e=Error('cancelled');e.name='AbortError';throw e;};const h=annual(d,{synchronous:false,adapter});
 try{await ticks();assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-output').getAttribute('aria-busy'),'false');assert.equal(h.get('#mc-export').disabled,true);assert.match(h.get('#mc-output').innerHTML,/Simulation cancelled/);}finally{h.cleanup()}
});

test('a result export preserves the exact run inputs even if a caller mutates its draft during a yield',async()=>{
 const releases=[],h=fixture({ticker:'STABLE-INPUT-SNAPSHOT',autoplay:false,synchronous:false,simulationConfig:config('snapshot'),yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{const input=structuredClone(h.draft),source=structuredClone(h.snapshot);h.draft.assumptions.targetMargin=.9;h.snapshot.cash=999999;await drain(h,releases);h.get('#mc-export').click();const saved=JSON.parse(await h.exports[0].text());assert.deepEqual(saved.draft,input);assert.deepEqual(saved.snapshot,JSON.parse(JSON.stringify(source)));assert.deepEqual(saved.samples,simulateCurrent(saved.snapshot,saved.draft,saved.config).samples);}finally{h.cleanup()}
});

test('duplicate teardown and queued viewport observations cannot touch a replacement view',()=>{
 const h=fixture({ticker:'STABLE-TEARDOWN',autoplay:false,simulationConfig:config('teardown')});
 try{const observer=h.observers[0];h.destroy();h.get('#mc-animation-status').textContent='Replacement view';h.destroy();observer.fn([{isIntersecting:false,intersectionRatio:0}]);assert.equal(h.get('#mc-animation-status').textContent,'Replacement view');}finally{h.cleanup()}
});
