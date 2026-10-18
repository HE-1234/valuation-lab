import test from 'node:test';
import assert from 'node:assert/strict';
import {distributionForType,renderDistributionEditor,renderDistributionPreview} from '../dist/distribution-view.js';
import {fixture} from './v7-simulation-harness.mjs';
const defaults={type:'triangular',low:.03,mode:.08,high:.13};
test('distribution view: all four types render only relevant editable parameters',()=>{
 const specs=[{type:'fixed',value:.08},{type:'triangular',low:.03,mode:.08,high:.13},{type:'uniform',low:.03,high:.13},{type:'normal',low:.03,mean:.08,sd:.015,high:.13}];
 for(const s of specs){const html=renderDistributionEditor('growth','Growth',100,'%',s);assert.match(html.replace(/<\/?span\b[^>]*>/g,''),/Distribution<select/);for(const k of Object.keys(s).filter(k=>k!=='type'))assert.match(html,new RegExp('id="mc-growth-'+k+'"'));assert.doesNotMatch(html,/NaN|undefined/);assert.match(html,/aria-describedby="mc-shape-note-growth"/);if(s.type==='normal'){assert.match(html.replace(/<\/?span\b[^>]*>/g,''),/Underlying standard deviation · percentage points/);assert.match(html,/before truncation/);assert.match(html,/value="1.5"/);}}
});
test('distribution view: changing family preserves common bounds and uses an explicit center',()=>{
 const n=distributionForType(defaults,'normal',defaults);assert.deepEqual(n,{type:'normal',low:.03,mean:.08,sd:(.13-.03)/6,high:.13});assert.deepEqual(distributionForType(n,'fixed',defaults),{type:'fixed',value:.08});assert.deepEqual(distributionForType(n,'uniform',defaults),{type:'uniform',low:.03,high:.13});const fromFixed=distributionForType({type:'fixed',value:.08},'triangular',defaults);assert.equal(fromFixed.mode,.08);assert.ok(fromFixed.low<fromFixed.high);
});
test('distribution view: invalid shape preview never draws a misleading graphic',()=>{
 const html=renderDistributionPreview({type:'normal',low:.03,high:.13,mean:.08,sd:0},100,'%');assert.match(html,/Shape unavailable/);assert.doesNotMatch(html,/<svg/);
});
test('distribution view: family switch and parameter edits save shapes until Run',()=>{
 const changes=[],h=fixture({ticker:'V8-FAMILIES',reduced:true,onConfigChange:c=>changes.push(c)});try{
  for(const type of ['uniform','normal','fixed','triangular']){h.get('#mc-growth-type').value=type;h.get('#mc-growth-type').onchange();assert.ok(h.get('#mc-chart'),type);assert.equal(changes.at(-1).method,'joint-annual-path');assert.equal(changes.at(-1).jointAnnual.drivers.growth.type,type);assert.equal(changes.at(-1).drivers.growth.type,'triangular');assert.equal(h.get('#mc-error').textContent,'');}
  h.get('#mc-growth-type').value='normal';h.get('#mc-growth-type').onchange();const input=h.get('#mc-growth-sd');input.value='2';input.oninput();assert.equal(h.get('#mc-growth-sd'),input);assert.equal(changes.at(-1).jointAnnual.drivers.growth.sd,.02);assert.match(h.get('#mc-shape-growth').innerHTML,/Relative density/);assert.ok(h.get('#mc-run'));assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'stale');
 }finally{h.cleanup()}
});
test('distribution view: invalid normal settings clear all prior output and recover in place',()=>{
 const h=fixture({ticker:'V8-NORMAL-ERROR',reduced:true});try{h.get('#mc-growth-type').value='normal';h.get('#mc-growth-type').onchange();h.get('#mc-growth-sd').value='0';h.get('#mc-growth-sd').oninput();assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-median'),null);assert.match(h.get('#mc-error').textContent,/positive|greater|>\s*0/i);assert.match(h.get('#mc-shape-growth').innerHTML,/Shape unavailable/);h.get('#mc-export').click();assert.equal(h.exports.length,0);h.get('#mc-growth-sd').value='2';h.get('#mc-growth-sd').oninput();h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));assert.equal(h.get('#mc-error').textContent,'');}finally{h.cleanup()}
});
test('distribution view: custom shapes survive base assumption edits for the same session source',()=>{
 const a=fixture({ticker:'V8-SAME-SOURCE',reduced:true});try{a.get('#mc-growth-type').value='uniform';a.get('#mc-growth-type').onchange();a.get('#mc-growth-low').value='4';a.get('#mc-growth-low').oninput();}finally{a.cleanup()}
 const b=fixture({ticker:'V8-SAME-SOURCE',reduced:true,assumptions:{growth:.2}});try{assert.equal(b.get('#mc-growth-type').value,'uniform');assert.equal(b.get('#mc-growth-low').value,'4');b.get('#mc-reset-distributions').click();assert.equal(b.get('#mc-growth-type').value,'triangular');assert.equal(b.get('#mc-growth-mode').value,'20');}finally{b.cleanup()}
});
test('distribution view: explicit persisted null clears session overlays and reset notifies the owner',()=>{
 const a=fixture({ticker:'V8-PERSIST-NULL',reduced:true});try{a.get('#mc-growth-type').value='fixed';a.get('#mc-growth-type').onchange();}finally{a.cleanup()}
 const changes=[],b=fixture({ticker:'V8-PERSIST-NULL',reduced:true,simulationConfig:null,onConfigChange:c=>changes.push(c)});try{assert.equal(b.get('#mc-growth-type').value,'triangular');b.get('#mc-reset-distributions').click();assert.equal(changes.at(-1),null);}finally{b.cleanup()}
});
test('distribution view: restored four-family config is visible and export preserves exact settings',async()=>{
 const config={trials:500,seed:'four-families',binCount:20,dependence:'independent',drivers:{growth:{type:'normal',low:.03,mean:.08,sd:.02,high:.13},targetMargin:{type:'uniform',low:.1,high:.2},salesCapital:{type:'fixed',value:2},wacc:{type:'triangular',low:.08,mode:.1,high:.12}}};
 const h=fixture({ticker:'V8-RESTORE-SHAPES',reduced:true,simulationConfig:config});try{assert.equal(h.get('#mc-growth-type').value,'normal');assert.equal(h.get('#mc-targetMargin-type').value,'uniform');assert.equal(h.get('#mc-salesCapital-type').value,'fixed');assert.equal(h.get('#mc-growth-mean').value,'8');h.get('#mc-export').click();const out=JSON.parse(await h.exports[0].text());assert.equal(out.config.drivers.growth.type,'normal');assert.equal(out.config.drivers.growth.sd,.02);assert.equal(out.config.seed,'four-families');}finally{h.cleanup()}
});
test('distribution view: corrupted persisted settings withhold instead of crashing or silently calculating defaults',()=>{
 const h=fixture({ticker:'V8-CORRUPT-SAVED',reduced:true,simulationConfig:{drivers:{growth:{type:'normal',sd:0}}}});try{assert.equal(h.get('#mc-chart'),null);assert.match(h.get('#mc-error').textContent,/Saved uncertainty settings are invalid/);assert.ok(h.get('#mc-reset-distributions'));h.get('#mc-reset-distributions').click();h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));assert.equal(h.get('#mc-error').textContent,'');}finally{h.cleanup()}
});
test('distribution view: draft-owned restoration does not revive a stale session overlay after undo',()=>{
 const a=fixture({ticker:'V8-OWNER-UNDO',reduced:true});try{a.get('#mc-growth-type').value='fixed';a.get('#mc-growth-type').onchange();}finally{a.cleanup()}
 const b=fixture({ticker:'V8-OWNER-UNDO',reduced:true,onConfigChange:()=>{}});try{assert.equal(b.get('#mc-growth-type').value,'triangular');assert.match(b.get('#mc-settings-status').textContent||b.root.innerHTML,/Starting ranges/);}finally{b.cleanup()}
});
