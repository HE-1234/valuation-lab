import test from 'node:test';
import assert from 'node:assert/strict';
import {guideFixture} from './simulation-guide-dom-harness.mjs';
import {setLocale} from '../dist/i18n.js';
import {mountSimulation} from '../dist/simulation-view.js';

for(const research of [false,true])test(`Guide uses parsed ${research?'UMC research':'generic'} simulation controls and real engine previews`,async()=>{
 const h=guideFixture({research,ticker:research?'UMC':'GUIDE-BASE'});
 try{
  await h.flush();assert.ok(h.root.querySelector('.rx-mcg'));assert.equal(h.root.getAttribute('data-rx-mcv'),'guide');assert.equal(h.get('#mc-trials').value,'5000');assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-export').disabled,true);
  for(const [tab]of h.root.mcState.tabs){h.get('#mc-tab-'+tab).click();await h.flush();assert.equal(h.root.mcState.activeTab,tab);assert.equal(h.get('#mc-panel-'+tab).hidden,false);assert.equal(h.root.getAttribute('data-rx-mcv'),tab==='sampling'?'range':'guide');if(tab!=='sampling'){assert.equal(h.root.querySelector('.rx-mcg').hidden,false);assert.doesNotMatch(h.root.querySelector('.rx-mcg').textContent,/cannot be simulated|Simulating this tab/);}}
  assert.equal(h.root.querySelectorAll('.rx-mcg').length,1);assert.equal(h.root.querySelectorAll('.rx-mc-right').length,1);assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-trials').value,'5000');assert.ok([...h.guideAPI.cache.values()].every(r=>!r.error));
 }finally{h.cleanup();}
});

test('UMC source Run 5000 remains manual, EV-only and independent of guide previews',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',asyncRun:true});
 try{
  h.get('#mc-tab-growthPremium').click();await h.flush();const draft=structuredClone(h.draft),before=h.runs.length;assert.ok(before>0);assert.ok(h.runs.every(r=>r.config.trials===400));assert.equal(h.get('#mc-capital-policy'),null);
  h.get('#mc-run').click();assert.equal(h.events.filter(e=>e.reason==='run').at(-1).state.running,true,'Run state must publish after controller exists');await h.flush();
  const runs=h.runs.filter(r=>r.config.trials===5000);assert.equal(runs.length,1);const result=runs[0].result;assert.equal(result.accepted,5000);assert.equal(result.current_target,null);assert.equal(result.perShare.accepted,0);assert.equal(result.operating_assets_only,true);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.root.getAttribute('data-rx-mcv'),'range');assert.deepEqual(h.draft,draft);assert.equal(h.get('#mc-trials').value,'5000');
  h.get('#mc-export').click();const exported=JSON.parse(await h.exports[0].text());assert.equal(exported.accepted,5000);assert.equal(exported.current_target,null);assert.equal(exported.perShare.accepted,0);
 }finally{h.cleanup();}
});

for(const phone of [false,true])test(`Guide repeated tabs, locale, reset/Undo and ${phone?'phone':'desktop'} placement retain nodes and settings`,async()=>{
 const h=guideFixture({research:true,ticker:'UMC',phone,reduced:true});
 try{
  await h.flush();for(const locale of ['zh-Hans','en','zh-Hans','en']){setLocale(locale);await h.flush();for(const tab of ['marginShift','waccShift','growthPremium','sampling','growthPremium']){h.get('#mc-tab-'+tab).click();await h.flush();}assert.equal(h.root.querySelectorAll('.rx-mcg').length,1);assert.equal(h.root.querySelectorAll('.rx-mc-right').length,phone?0:1);assert.match(h.root.querySelector('.rx-mcg').textContent,locale==='en'?/How bumpy/:/成长/);}
  const input=h.get('#mc-seed');input.focus();input.value='guide-retain';input.dispatch('input');await h.flush();assert.equal(h.document.activeElement,input);assert.equal(h.get('#mc-seed'),input);assert.equal(h.get('#mc-seed').value,'guide-retain');h.get('#mc-reset-distributions').click();await h.flush();h.get('#mc-undo-reset').click();await h.flush();assert.equal(h.get('#mc-seed').value,'guide-retain');assert.equal(h.root.querySelectorAll('.rx-mcg').length,1);assert.equal(h.animations.length,0);
 }finally{setLocale('en');h.cleanup();}
});

test('Guide reads enterprise ranks and latest range in matching units',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',configMutate:c=>{c.trials=7;}});
 try{
  h.get('#mc-tab-growthPremium').click();await h.flush();
  const r={accepted:3,basis:'enterprise',samples:[100,200,300],quantiles:{p10:100,p50:200,p90:300},baseline:{enterprise:200},scenarios:[{enterprise:100,perShare:1},{enterprise:200,perShare:2},{enterprise:300,perShare:3}]};
  assert.deepEqual(Array.from(h.guideAPI.summarise(r).paths,p=>p.rank),[0,.5,1]);
  h.get('#mc-run').click();await h.flush();const run=h.runs.find(r=>r.config.trials===7);assert.equal(h.root.mcState.latest.p50,run.result.enterprise.median);
 }finally{h.cleanup();}
});

test('Guide reduced-motion view switch, hidden/reopen and destroy cancel stale work',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',reduced:true});
 try{
  h.get('#mc-tab-growthPremium').click();await h.flush();const original=h.get('#mc-seed'),config=structuredClone(h.draft.researchSimulationConfig);
  h.root.querySelector('.rx-mcg-switch').click();assert.equal(h.root.getAttribute('data-rx-mcv'),'range');assert.equal(h.root.querySelector('.mc-heading').lastScroll.behavior,'auto');h.root.querySelector('.rx-mcg-back').click();assert.equal(h.root.getAttribute('data-rx-mcv'),'guide');
  for(let i=0;i<3;i++){h.root.hidden=true;h.scan();await h.flush();h.root.hidden=false;h.scan();await h.flush();assert.equal(h.get('#mc-seed'),original);assert.equal(h.root.querySelectorAll('.rx-mcg').length,1);}
  assert.deepEqual(h.draft.researchSimulationConfig,config);original.value='dispose-inflight';original.dispatch('input');h.destroy();await h.flush();assert.equal(h.root.mcState,undefined);assert.equal(h.guideAPI.queue.length,0);assert.equal(h.guideAPI.busy,null);assert.notEqual(h.get('#mc-output').getAttribute('data-result-state'),'current');
 }finally{h.cleanup();}
});

test('Guide invalid settings are withheld, Cancel clears running state and controls remain usable',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',asyncRun:true});
 try{
  h.get('#mc-tab-growthPremium').click();await h.flush();const input=h.get('#mc-seed');input.value='';input.dispatch('input');await h.flush();assert.equal(h.root.mcState.valid,false);assert.equal(h.root.querySelector('.rx-mcg').hidden,true);assert.equal(h.get('#mc-run').disabled,true);h.get('#mc-tab-marginShift').click();await h.flush();assert.equal(h.root.mcState.valid,false,'Switching tabs must retain invalid input state');assert.equal(h.root.querySelector('.rx-mcg').hidden,true);
  input.value='cancel-state';input.dispatch('input');await h.flush();h.get('#mc-run').click();assert.equal(h.root.mcState.running,true);h.get('#mc-cancel').click();await h.flush();assert.equal(h.root.mcState.running,false);assert.equal(h.get('#mc-run').disabled,false);assert.equal(h.get('#mc-export').disabled,true);
 }finally{h.cleanup();}
});

test('Phone Run takes priority over queued guide work and previews resume after completion',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',phone:true,asyncRun:true,configMutate:c=>{c.trials=7;}});
 try{
  h.get('#mc-tab-growthPremium').click();await h.step();h.get('#mc-run').click();await h.flush();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.root.mcState.running,false);assert.ok(h.runs.some(r=>r.config.trials===7&&r.result?.accepted===7));assert.equal(h.guideAPI.busy,null);assert.equal(h.guideAPI.queue.length,0);assert.doesNotMatch(h.root.querySelector('.rx-mcg').textContent,/Simulating this tab/);
  h.destroy.pending();assert.equal(h.root.mcState.valid,false);assert.equal(h.root.mcState.latest,null);h.get('#mc-tab-marginShift').click();await h.flush();assert.equal(h.root.mcState.valid,false);assert.equal(h.root.querySelector('.rx-mcg').hidden,true);
 }finally{h.cleanup();}
});

test('A hidden in-flight preview repaints from completed cache when the same view reopens',async()=>{
 const h=guideFixture({research:true,ticker:'UMC'});
 try{
  h.get('#mc-tab-growthPremium').click();await h.step();assert.ok(h.guideAPI.busy);h.root.hidden=true;await h.flush();assert.ok(h.guideAPI.cache.size>0);h.root.hidden=false;h.scan();await h.flush();assert.doesNotMatch(h.root.querySelector('.rx-mcg').textContent,/Simulating this tab/);assert.equal(h.root.querySelectorAll('.rx-mcg').length,1);
 }finally{h.cleanup();}
});

test('Invalid guided model followed by destroy exposes the withheld message and hides its old guide',async()=>{
 const h=guideFixture({ticker:'GUIDE-INVALID-DESTROY'});
 try{
  await h.flush();const guide=h.root.querySelector('.rx-mcg');assert.equal(guide.hidden,false);h.destroy.withhold('Invalid model input');h.destroy();await h.flush();assert.equal(guide.hidden,true);assert.equal(h.root.getAttribute('data-rx-mcv'),'range');assert.equal(h.root.mcState,undefined);assert.equal(h.root.querySelector('.rx-mcg-back'),null);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'unavailable');assert.match(h.get('#mc-output').textContent,/Simulation withheld/);
 }finally{h.cleanup();}
});


test('A same-root fresh mount initializes its active settings guide after destruction',async()=>{
 const h=guideFixture({ticker:'GUIDE-SAME-ROOT'});let next;
 try{
  await h.flush();assert.equal(h.root.getAttribute('data-rx-mcv'),'guide');h.destroy();next=mountSimulation(h.root,h.snapshot,h.draft,{synchronous:true,autoplay:false});await h.flush();assert.equal(h.root.getAttribute('data-rx-mcv'),'guide');assert.equal(h.root.querySelector('.rx-mcg').hidden,false);assert.equal(h.root.querySelectorAll('.rx-mcg').length,1);
 }finally{next?.();h.cleanup();}
});
