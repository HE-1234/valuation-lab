// Synthetic DOM and WAAPI fixture. This runs the actual UI event handlers but
// does not verify browser layout, accessibility tree, native touch, or paint.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './v7-simulation-harness.mjs';
import {simulateCurrent} from '../dist/simulation.js';

test('v6 QA: actual simulation-view handlers inspect median, sourced quote, arrows, bounds and slider',()=>{
 const h=fixture({reduced:true,quote:{price:10000,date:'2026-10-16',currency:'USD',sourceUrl:'https://example.com/quote',shareBasis:'same common share basis'}});
 try{
  const chart=h.get('#mc-chart');assert.equal(chart.getAttribute('role'),'slider');assert.equal(chart.getAttribute('tabindex'),'0');assert.match(h.get('#mc-inspector').innerHTML,/median/i);
  h.get('#mc-market').click();assert.match(h.get('#mc-inspector').innerHTML,/10,000/);assert.match(chart.getAttribute('aria-valuetext'),/10,000/);assert.match(h.get('#mc-summary-content').innerHTML,/pinned to the nearest chart edge/);
  let prevented=0;const key=key=>chart.onkeydown({key,preventDefault(){prevented++}});key('Home');assert.equal(Number(chart.getAttribute('aria-valuenow')),Number(chart.getAttribute('aria-valuemin')));key('End');assert.equal(Number(chart.getAttribute('aria-valuenow')),Number(chart.getAttribute('aria-valuemax')));key('ArrowLeft');assert.ok(Number(chart.getAttribute('aria-valuenow'))<Number(chart.getAttribute('aria-valuemax')));assert.equal(prevented,3);
  h.get('#mc-scrubber').oninput({target:{value:'0'}});assert.equal(Number(chart.getAttribute('aria-valuenow')),Number(chart.getAttribute('aria-valuemin')));
  h.get('#mc-median').click();assert.match(h.get('#mc-inspector').innerHTML,/median/i);h.get('#mc-market').onpointerenter();assert.match(h.get('#mc-inspector').innerHTML,/10,000/);h.get('#mc-median').onfocus();assert.match(h.get('#mc-inspector').innerHTML,/median/i);h.get('#mc-market').onfocus();assert.match(h.get('#mc-inspector').innerHTML,/10,000/);h.get('#mc-median').onpointerenter();assert.match(h.get('#mc-inspector').innerHTML,/median/i);assert.equal(h.animations.length,0);assert.match(h.get('#mc-play').textContent,/Reduced motion/);assert.match(h.get('#mc-scrubber').getAttribute('aria-valuetext'),/USD per share; .*% of simulated values at or below/);assert.equal(h.get('#mc-scrubber').getAttribute('aria-label'),'Explore simulated value');
 }finally{h.cleanup()}
});
test('v6 QA: touch uses pointer capture, cancellation releases it and non-dragging touch move does not inspect',()=>{
 const h=fixture({reduced:true,ticker:'TOUCHQA'});try{const chart=h.get('#mc-chart');chart.onpointerdown({pointerType:'touch',pointerId:4,clientX:700});assert.ok(chart.captured.has(4));const before=chart.getAttribute('aria-valuenow');chart.onpointermove({pointerType:'touch',pointerId:4,clientX:500});assert.notEqual(chart.getAttribute('aria-valuenow'),before);chart.onpointercancel({pointerType:'touch',pointerId:4});assert.equal(chart.captured.size,0);const after=chart.getAttribute('aria-valuenow');chart.onpointermove({pointerType:'touch',pointerId:4,clientX:300});assert.equal(chart.getAttribute('aria-valuenow'),after)}finally{h.cleanup()}
});
test('v6 QA: bounded particles pause/resume, tab/visibility cleanup and destroy remove listeners',()=>{
 const h=fixture({ticker:'ANIMQA'});try{
  assert.equal(h.animations.length,112);assert.ok(h.animations.every(a=>a.options.duration+a.options.delay<=6000));const play=h.get('#mc-play');play.click();assert.ok(h.animations.every(a=>a.state==='paused'));play.click();assert.ok(h.animations.every(a=>a.state==='running'));
  h.windowEvents.dispatch('valuation:tab-change',{detail:'history'});assert.ok(h.animations.every(a=>a.state==='canceled'));assert.equal(h.get('#mc-particles').children.length,0);
  play.click();assert.equal(h.animations.length,224);h.doc.hidden=true;h.doc.dispatch('visibilitychange');assert.ok(h.animations.every(a=>a.state==='canceled'));
  h.destroy();assert.ok(h.observers.every(o=>o.disconnected));assert.ok([...h.windowEvents.listeners.values(),...h.motion.listeners.values(),...h.doc.listeners.values()].every(s=>s.size===0));
 }finally{h.cleanup()}
});
test('v6 QA: mobile limits particles and changing reduced-motion preference cancels the active flow',()=>{
 const h=fixture({mobile:true,ticker:'MOBILEQA'});try{assert.equal(h.animations.length,64);h.motion.matches=true;h.motion.dispatch('change');assert.ok(h.animations.every(a=>a.state==='canceled'));assert.equal(h.get('#mc-particles').children.length,0)}finally{h.cleanup()}
});
test('v6 QA: valid all-excluded settings remove chart and expose attempted/excluded accounting',()=>{
 const h=fixture({reduced:true,ticker:'EMPTYQA'});try{for(const p of ['low','mode','high'])h.get('#mc-wacc-'+p).value='1';h.get('#mc-growth-low').oninput();h.get('#mc-run').click();assert.equal(h.get('#mc-chart'),null);assert.match(h.get('#mc-output').innerHTML,/No valid scenarios/);assert.match(h.get('#mc-audit').textContent,/5,000 attempted · 5,000 excluded/);assert.match(h.get('#mc-audit').textContent,/terminal-constraints: 5000/)}finally{h.cleanup()}
});
test('v6 QA: all-zero equity distribution remains inspectable without claiming ECDF at median is 50%',()=>{
 const h=fixture({reduced:true,ticker:'ZEROQA',debt:1e9});try{assert.match(h.get('#mc-audit').textContent,/5,000 zero-equity/);assert.match(h.get('#mc-inspector').innerHTML,/100% of simulated values at or below/);assert.equal(Number(h.get('#mc-chart').getAttribute('aria-valuenow')),0)}finally{h.cleanup()}
});
test('v6 QA: keyboard cannot overshoot chart bounds in visible value or ARIA text',()=>{
 const h=fixture({reduced:true,ticker:'BOUNDQA'});try{const chart=h.get('#mc-chart'),key=key=>chart.onkeydown({key,preventDefault(){}});key('End');const max=h.get('#mc-inspector').innerHTML,maxaria=chart.getAttribute('aria-valuetext');key('ArrowRight');assert.equal(h.get('#mc-inspector').innerHTML,max);assert.equal(chart.getAttribute('aria-valuetext'),maxaria);key('Home');const min=h.get('#mc-inspector').innerHTML;key('ArrowLeft');assert.equal(h.get('#mc-inspector').innerHTML,min)}finally{h.cleanup()}
});
test('v6 QA: invalid rerun withholds previous chart and prevents exporting stale results',()=>{
 const h=fixture({ticker:'INVALIDVIEWQA'});try{h.get('#mc-growth-low').value='90';h.get('#mc-growth-low').oninput();assert.match(h.get('#mc-output').innerHTML,/Simulation withheld/);assert.equal(h.get('#mc-chart'),null);assert.match(h.get('#mc-error').textContent,/low.*mode.*high/);assert.ok(h.animations.every(a=>a.state==='canceled'));h.get('#mc-export').click();assert.equal(h.exports.length,0)}finally{h.cleanup()}
});
test('v6 QA: simulation export contains source identity and independently reruns identical samples',async()=>{
 const h=fixture({reduced:true,ticker:'EXPORTQA'});try{h.get('#mc-export').click();assert.equal(h.exports.length,1);const exported=JSON.parse(await h.exports[0].text());assert.equal(exported.snapshotId,h.snapshot.raw.id);assert.deepEqual(exported.snapshot,JSON.parse(JSON.stringify(h.snapshot)));assert.deepEqual(exported.draft,h.draft);const rerun=simulateCurrent(exported.snapshot,exported.draft,exported.config);assert.deepEqual(rerun.samples,exported.samples);assert.deepEqual(rerun.exclusions,exported.exclusions)}finally{h.cleanup()}
});
test('v6 QA: simulation ranges are separated by source snapshot identity and restored within a session',()=>{
 let h=fixture({reduced:true,ticker:'IDENTITYQA',rawId:'SOURCE-ONE'});try{h.get('#mc-growth-low').value='1';h.get('#mc-growth-mode').value='2';h.get('#mc-growth-high').value='3';h.get('#mc-growth-low').oninput();assert.equal(h.get('#mc-error').textContent,'')}finally{h.cleanup()}
 h=fixture({reduced:true,ticker:'IDENTITYQA',rawId:'SOURCE-TWO'});try{assert.equal(h.get('#mc-growth-low').value,'3');assert.equal(h.get('#mc-growth-mode').value,'8')}finally{h.cleanup()}
 h=fixture({reduced:true,ticker:'IDENTITYQA',rawId:'SOURCE-ONE'});try{assert.equal(h.get('#mc-growth-low').value,'1');assert.equal(h.get('#mc-growth-mode').value,'2')}finally{h.cleanup()}
});
test('v6 QA: particles wait for visibility, clean up offscreen and do not repeatedly autoplay',()=>{
 const h=fixture({ticker:'OFFSCREENQA',autoIntersect:false});try{assert.equal(h.animations.length,0);h.observers[0].fn([{isIntersecting:true,intersectionRatio:1}]);assert.equal(h.animations.length,112);h.observers[0].fn([{isIntersecting:false}]);assert.ok(h.animations.every(a=>a.state==='canceled'));h.observers[0].fn([{isIntersecting:true,intersectionRatio:1}]);assert.equal(h.animations.length,112)}finally{h.cleanup()}
});
test('v6 QA: falling arrivals build bin heights and completion restores exactly every accepted-count bin',()=>{
 const h=fixture({ticker:'BUILDQA',autoIntersect:false});try{
  const heights=()=>h.bars().map(b=>Number(b.getAttribute('height'))),full=heights();assert.equal(full.length,36);assert.ok(full.some(x=>x>0));const expected=simulateCurrent(h.snapshot,h.draft).histogram,max=Math.max(...expected.map(b=>b.count));assert.deepEqual(full,expected.map(b=>b.count/max*250));
  h.observers[0].fn([{isIntersecting:true,intersectionRatio:1}]);assert.ok(heights().every(x=>x===0));assert.match(h.get('#mc-animation-status').textContent,/Replay building.*statistics show full run/);
  for(const a of h.animations.slice(0,30)){a.state='finished';a.onfinish()}
  const partial=heights();assert.ok(partial.some(x=>x>0));assert.ok(partial.some((x,i)=>x<full[i]));assert.ok(partial.every((x,i)=>x<=full[i]+1e-10));
  h.get('#mc-play').click();assert.ok(h.animations.slice(30).every(a=>a.state==='paused'));assert.deepEqual(heights(),partial);h.get('#mc-play').click();assert.ok(h.animations.slice(30).every(a=>a.state==='running'));
  for(const a of h.animations.slice(30)){a.state='finished';a.onfinish()}
  assert.deepEqual(heights(),full);assert.equal(h.get('#mc-animation-status').textContent,'Full distribution');assert.match(h.get('#mc-summary-content').innerHTML,/Histogram · all accepted scenarios/);assert.match(h.get('#mc-audit').textContent,/histogram and percentiles use every accepted scenario/);assert.equal(h.get('#mc-particles').children.length,0);assert.equal(h.get('#mc-play').getAttribute('aria-pressed'),'false');
 }finally{h.cleanup()}
});
test('v6 QA: all interruptions immediately restore exact full bins while theme changes refresh literal SVG colors',()=>{
 const h=fixture({ticker:'RESTOREQA',autoIntersect:false});try{
  const heights=()=>h.bars().map(b=>Number(b.getAttribute('height'))),full=heights();h.observers[0].fn([{isIntersecting:true,intersectionRatio:1}]);h.motion.matches=true;h.motion.dispatch('change');assert.deepEqual(heights(),full);
  h.motion.matches=false;h.motion.dispatch('change');h.get('#mc-play').click();assert.ok(heights().every(v=>v===0));h.windowEvents.dispatch('valuation:tab-change',{detail:'history'});assert.deepEqual(heights(),full);
  h.get('#mc-play').click();h.doc.hidden=true;h.doc.dispatch('visibilitychange');assert.deepEqual(heights(),full);h.doc.hidden=false;
  h.get('#mc-play').click();h.doc.documentElement.dataset.theme='midnight';h.windowEvents.dispatch('valuation:theme-change');assert.deepEqual(heights(),full);assert.match(h.get('#mc-output').innerHTML,/stop-color="#8dcdbb"/);assert.match(h.get('#mc-output').innerHTML,/style="fill:#e9f1ec"/);
  h.get('#mc-play').click();h.destroy();assert.deepEqual(heights(),full);
 }finally{h.cleanup()}
});
test('v6 QA: explicit skip immediately displays full exact bins and ends the replay',()=>{
 const h=fixture({ticker:'SKIPQA',autoIntersect:false});try{
  const heights=()=>h.bars().map(b=>Number(b.getAttribute('height'))),full=heights();assert.equal(h.get('#mc-skip').hidden,true);h.observers[0].fn([{isIntersecting:true,intersectionRatio:1}]);assert.equal(h.get('#mc-skip').hidden,false);assert.ok(heights().every(x=>x===0));h.get('#mc-skip').click();assert.deepEqual(heights(),full);assert.ok(h.animations.every(a=>a.state==='canceled'));assert.equal(h.get('#mc-skip').hidden,true);assert.equal(h.get('#mc-particles').children.length,0);assert.match(h.get('#mc-animation-status').textContent,/Full distribution/);
 }finally{h.cleanup()}
});
