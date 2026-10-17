// Executes actual lifecycle handlers against a synthetic DOM/WAAPI. Native iOS
// painting, touch, viewport layout and OS reduced-motion integration are unverified.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './v7-simulation-harness.mjs';

const exactHeights=h=>h.bars().map(b=>Number(b.getAttribute('height')));
test('v7 QA: initial playback observes the graphic, waits for a meaningful visible fraction and runs once',()=>{
 const h=fixture({ticker:'V7-VIEWPORT',autoIntersect:false,mobile:true});try{
  const o=h.observers[0];assert.equal(o.options.threshold,.35);assert.equal(o.targets.at(-1),h.get('#mc-chart'));assert.notEqual(o.targets.at(-1),h.root);
  o.fn([{isIntersecting:true,intersectionRatio:.01}]);assert.equal(h.animations.length,0,'initial one-percent overlap must not consume the visible replay');
  o.fn([{isIntersecting:true,intersectionRatio:.4}]);assert.equal(h.animations.length,64);assert.equal(Math.max(...h.animations.map(a=>a.options.duration+a.options.delay)),6000);
  o.fn([{isIntersecting:false,intersectionRatio:0}]);assert.ok(h.animations.every(a=>a.state==='canceled'));o.fn([{isIntersecting:true,intersectionRatio:1}]);assert.equal(h.animations.length,64);
 }finally{h.cleanup()}
});
test('v7 QA: initial hidden document does not consume playback and visible return starts it',()=>{
 const h=fixture({ticker:'V7-HIDDEN',hidden:true,autoIntersect:false});try{
  h.observers[0].fn([{isIntersecting:true,intersectionRatio:1}]);assert.equal(h.animations.length,0);h.doc.hidden=false;h.doc.dispatch('visibilitychange');assert.equal(h.animations.length,112);
 }finally{h.cleanup()}
});
test('v7 QA: missing animation support retains exact nonzero full bins and usable inspection',()=>{
 const h=fixture({ticker:'V7-NO-WAAPI',hasAnimationAPI:false});try{
  assert.equal(h.animations.length,0);assert.ok(exactHeights(h).some(x=>x>0));assert.equal(h.get('#mc-particles').children.length,0);assert.match(h.get('#mc-animation-status').textContent,/Full distribution/);h.get('#mc-chart').onkeydown({key:'End',preventDefault(){}});assert.equal(h.get('#mc-chart').getAttribute('aria-valuenow'),h.get('#mc-chart').getAttribute('aria-valuemax'));
 }finally{h.cleanup()}
});
test('v7 QA: assumption edits use bounded chart feedback without replaying representative particles',()=>{
 const h=fixture({ticker:'V7-EDIT-MOTION',animateChange:true});try{
  assert.equal(h.animations.length,exactHeights(h).filter(v=>v>0).length);assert.ok(h.animations.every(a=>a.options.duration<=400));assert.equal(h.get('#mc-particles').children.length,0);assert.ok(exactHeights(h).some(x=>x>0));
  h.motion.matches=true;h.motion.dispatch('change');assert.ok(h.animations.every(a=>a.state==='canceled'));assert.match(h.get('#mc-play').textContent,/Reduced motion/);
 }finally{h.cleanup()}
});
test('v7 QA: simulation ranges recalculate without an apply button and invalid ranges remove every old result',()=>{
 const h=fixture({ticker:'V7-RANGE-AUTO',reduced:true});try{
  assert.equal(h.get('#mc-run'),null);assert.ok(h.get('#mc-median'));h.get('#mc-growth-low').value='90';h.get('#mc-growth-low').oninput();
  assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-median'),null);assert.equal(h.get('#mc-market'),null);assert.equal(h.get('#mc-summary-content').innerHTML,'');assert.match(h.get('#mc-error').textContent,/low.*mode.*high/);h.get('#mc-export').click();assert.equal(h.exports.length,0);
  h.get('#mc-growth-low').value='1';h.get('#mc-growth-low').oninput();assert.ok(h.get('#mc-chart'));assert.ok(h.get('#mc-median'));assert.equal(h.get('#mc-error').textContent,'');
 }finally{h.cleanup()}
});
test('v7 QA: zero accepted scenarios remove old summary tables and preserve complete exclusion accounting',()=>{
 const h=fixture({ticker:'V7-NO-ACCEPTED',reduced:true});try{
  for(const p of ['low','mode','high'])h.get('#mc-wacc-'+p).value='1';h.get('#mc-wacc-high').oninput();assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-median'),null);assert.equal(h.get('#mc-summary-content').innerHTML,'');assert.match(h.get('#mc-audit').textContent,/4,000 attempted · 4,000 excluded/);
 }finally{h.cleanup()}
});
test('v7 QA: chart replacement rebinds viewport observation to the new visible graphic',()=>{
 const h=fixture({ticker:'V7-REOBSERVE',reduced:true});try{const old=h.get('#mc-chart'),o=h.observers[0];h.doc.documentElement.dataset.theme='ocean';h.windowEvents.dispatch('valuation:theme-change');assert.notEqual(h.get('#mc-chart'),old);assert.equal(o.targets.at(-1),h.get('#mc-chart'));assert.match(h.get('#mc-output').innerHTML,/#afe6e5/);}finally{h.cleanup()}
});
