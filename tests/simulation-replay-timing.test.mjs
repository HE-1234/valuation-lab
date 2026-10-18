// Synthetic WAAPI clock: checks scheduling and lifecycle, not native browser paint.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './v7-simulation-harness.mjs';
import {simulationDefaults,simulateCurrent} from '../dist/simulation.js';
import {researchDraftFor} from '../dist/research-model.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {simulationResearchDefaults} from '../dist/research-simulation.js';

const heights=h=>h.bars().map(b=>Number(b.getAttribute('height')));
const timing=animations=>animations.map(a=>[a.options.duration,a.options.delay]);
function advance(h,milliseconds){
 for(const animation of h.animations){
  if(animation.state!=='running')continue;
  animation.elapsed=(animation.elapsed||0)+milliseconds;
  if(animation.elapsed>=animation.options.delay+animation.options.duration){
   animation.state='finished';
   animation.onfinish?.();
  }
 }
}

for(const [label,options,expectedCount] of [
 ['desktop',{},112],
 ['phone',{mobile:true},64],
 ['dense histogram',{mobile:true,simulationConfig:{...simulationDefaults(),trials:1000,binCount:200}},null],
])test(`replay timing: ${label} builds gradually and finishes exactly at six seconds`,()=>{
 const h=fixture({ticker:'REPLAY-TIMING-'+label,autoplay:false,...options});
 try{
  const full=heights(h),summary=h.get('#mc-summary-content').innerHTML;
  assert.equal(h.animations.length,0,'Calculation already presents the complete chart without waiting for replay.');
  h.get('#mc-play').click();
  if(expectedCount!==null)assert.equal(h.animations.length,expectedCount);
  else assert.ok(h.animations.length>=64&&h.animations.length<=200);
  assert.equal(Math.min(...h.animations.map(a=>a.options.delay)),0);
  assert.ok(h.animations.every(a=>a.options.duration===2200));
  assert.equal(Math.max(...h.animations.map(a=>a.options.delay+a.options.duration)),6000);
  advance(h,2199);assert.ok(heights(h).every(n=>n===0));
  advance(h,801);assert.ok(heights(h).some(n=>n>0));assert.ok(heights(h).some((n,i)=>n<full[i]));
  assert.equal(h.get('#mc-summary-content').innerHTML,summary,'Full-run statistics never animate or change.');
  advance(h,2999);assert.ok(heights(h).some((n,i)=>n<full[i]));
  advance(h,1);assert.deepEqual(heights(h),full);
  assert.equal(h.get('#mc-animation-status').textContent,'Full distribution');
  assert.equal(h.get('#mc-particles').children.length,0);assert.equal(h.get('#mc-skip').hidden,true);
 }finally{h.cleanup()}
});

test('replay timing: pause preserves elapsed time and partial bins; resume uses the remaining time',()=>{
 const h=fixture({ticker:'REPLAY-TIMING-PAUSE',autoplay:false});
 try{
  const full=heights(h);h.get('#mc-play').click();advance(h,3000);
  const partial=heights(h),elapsed=h.animations.map(a=>a.elapsed);
  h.get('#mc-play').click();assert.match(h.get('#mc-play').textContent,/Resume replay/);
  advance(h,60000);assert.deepEqual(heights(h),partial);assert.deepEqual(h.animations.map(a=>a.elapsed),elapsed);
  h.get('#mc-play').click();assert.match(h.get('#mc-play').textContent,/Pause replay/);
  advance(h,2999);assert.ok(heights(h).some((n,i)=>n<full[i]));
  advance(h,1);assert.deepEqual(heights(h),full);
 }finally{h.cleanup()}
});

for(const interruption of ['skip','reduced motion','destroy'])test(`replay timing: ${interruption} restores exact bins and invalidates delayed arrivals`,()=>{
 const h=fixture({ticker:'REPLAY-TIMING-CANCEL-'+interruption,autoplay:false});
 try{
  const full=heights(h);h.get('#mc-play').click();advance(h,3000);
  const pending=h.animations.filter(a=>a.state==='running'),staleCallbacks=pending.map(a=>a.onfinish);
  assert.ok(pending.length>0);
  if(interruption==='skip')h.get('#mc-skip').click();
  else if(interruption==='destroy')h.destroy();
  else {h.motion.matches=true;h.motion.dispatch('change');assert.equal(h.get('#mc-play').disabled,true);}
  assert.deepEqual(heights(h),full);assert.equal(h.get('#mc-particles').children.length,0);
  assert.ok(pending.every(a=>a.state==='canceled'&&a.onfinish===null));
  advance(h,60000);for(const callback of staleCallbacks)callback();
  assert.deepEqual(heights(h),full,'Already queued completion callbacks cannot repaint a canceled replay.');
 }finally{h.cleanup()}
});

test('replay timing: repeated replays preserve schedule, seed, samples and exact full histogram',async()=>{
 const h=fixture({ticker:'REPLAY-TIMING-REPEAT',autoplay:false,simulationConfig:{...simulationDefaults(),trials:137,seed:'unchanged-replay-seed'}});
 try{
  const full=heights(h);h.get('#mc-export').click();const before=JSON.parse(await h.exports[0].text());
  h.get('#mc-play').click();const schedule=timing(h.animations),staleCallback=h.animations.at(-1).onfinish;
  advance(h,3000);h.get('#mc-skip').click();h.get('#mc-play').click();
  assert.deepEqual(timing(h.animations.slice(schedule.length)),schedule);
  staleCallback();assert.ok(heights(h).every(n=>n===0),'The previous replay cannot add an arrival to the new replay.');
  advance(h,6000);assert.deepEqual(heights(h),full);
  h.get('#mc-export').click();const after=JSON.parse(await h.exports[1].text());
  for(const key of ['config','samples','histogram','quantiles','attempts','accepted','excluded'])assert.deepEqual(after[key],before[key]);
  assert.deepEqual(after.samples,simulateCurrent(h.snapshot,h.draft,before.config).samples);
 }finally{h.cleanup()}
});

test('replay timing: reduced motion starts with the exact static chart and schedules no playback',()=>{
 const h=fixture({ticker:'REPLAY-TIMING-REDUCED',reduced:true});
 try{
  const full=heights(h);assert.ok(full.some(n=>n>0));assert.equal(h.animations.length,0);
  assert.equal(h.get('#mc-play').disabled,true);h.get('#mc-play').click();
  advance(h,60000);assert.equal(h.animations.length,0);assert.deepEqual(heights(h),full);
 }finally{h.cleanup()}
});

test('replay timing: annual-path single-bin replay shares the six-second schedule',()=>{
 const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url)));
 const draft=researchDraftFor(cases.companies.find(c=>c.ticker==='AAPL'));
 draft.researchSimulationConfig={...simulationResearchDefaults(draft),method:'legacy',trials:20};
 const h=fixture({autoplay:false,draftOverride:draft,snapshotOverride:{ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId}},adapter:annualResearchSimulationAdapter(draft)});
 try{
  const full=heights(h);assert.equal(full.length,1);h.get('#mc-play').click();
  assert.equal(Math.max(...h.animations.map(a=>a.options.duration+a.options.delay)),6000);
  advance(h,3000);assert.ok(heights(h)[0]>0&&heights(h)[0]<full[0]);
  advance(h,3000);assert.deepEqual(heights(h),full);
 }finally{h.cleanup()}
});
