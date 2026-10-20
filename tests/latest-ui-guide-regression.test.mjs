import test from 'node:test';
import assert from 'node:assert/strict';
import {guideFixture} from './simulation-guide-dom-harness.mjs';
import {setLocale} from '../dist/i18n.js';
const linked=h=>h.root.querySelector('.rx-mcg li.is-linked')?.dataset.k;
const pointer=(h,type,target,relatedTarget=null)=>h.document.dispatch(type,{target,relatedTarget});

test('newer keyboard focus supersedes a pending or settled setting hover',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',finePointer:true});
 try{
  h.get('#mc-tab-growthPremium').click();await h.flush();
  const sd=h.get('#mc-annual-innovation-sd'),rho=h.get('#mc-annual-persistence');assert.ok(sd&&rho);
  pointer(h,'pointerover',sd);await h.flush();assert.equal(linked(h),'sd');
  rho.focus();assert.equal(linked(h),'rho');await h.flush();assert.equal(linked(h),'rho');
  pointer(h,'pointerover',sd);rho.focus();h.document.dispatch('focusin',{target:rho});await h.flush();assert.equal(linked(h),'rho');
 }finally{h.cleanup();}
});

test('guide Edit opens closed terminal settings before focusing their real control',async()=>{
 const h=guideFixture();
 try{
  h.get('#mc-tab-taxTerminal').click();await h.flush();
  const field=h.get('#mc-terminal-growth-type'),section=field?.closest('details');assert.ok(field&&section);section.open=false;
  const edit=h.root.querySelector('.rx-mcg [data-edit="terminal-growth-type"]');assert.ok(edit);edit.click();
  assert.equal(section.open,true);assert.equal(h.document.activeElement,field);assert.equal(field.checkVisibility(),true);assert.equal(field.lastScroll.behavior,'auto');
 }finally{h.cleanup();}
});

test('guide hover resets on guide entry, root exit and destruction before same-root remount',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',finePointer:true});
 try{
  h.get('#mc-tab-growthPremium').click();await h.flush();const sd=h.get('#mc-annual-innovation-sd');
  pointer(h,'pointerover',sd);await h.flush();assert.equal(linked(h),'sd');
  pointer(h,'pointerover',h.root.querySelector('.rx-mcg'));await h.flush();assert.equal(linked(h),undefined);
  pointer(h,'pointerover',sd);await h.flush();pointer(h,'pointerout',sd,h.document.root);await h.flush();assert.equal(linked(h),undefined);
  pointer(h,'pointerover',sd);h.destroy();await h.flush();assert.equal(h.root.mcState,undefined);assert.equal(h.guideAPI.busy,null);
 }finally{h.cleanup();}
});

for(const phone of [false,true])test(`new Sampling guide ${phone?'phone':'desktop'} follows current, edited, invalid, rerun and canceled state across both languages`,async()=>{
 const h=guideFixture({research:true,ticker:'UMC',phone,asyncRun:true,configMutate:c=>{c.trials=37;}});
 try{
  h.get('#mc-tab-sampling').click();await h.flush();let guide=h.root.querySelector('.rx-mcg');assert.equal(guide.hidden,false);assert.match(guide.textContent,/400-scenario preview/);assert.equal(h.root.mcState.latest,null);assert.equal(h.get('#mc-export').disabled,true);
  assert.ok(guide.querySelectorAll('details').every(d=>!d.open),'New sections start folded');
  const original=structuredClone(h.draft.researchSimulationConfig);h.get('#mc-run').click();await h.flush();assert.ok(h.root.mcState.latest);assert.match(guide.textContent,/your last run/);assert.equal(h.get('#mc-export').disabled,false);
  h.get('#mc-seed').value='changed-guide-seed';h.get('#mc-seed').dispatch('input');await h.flush();assert.equal(h.root.mcState.latest,null);assert.match(guide.textContent,/400-scenario preview/);assert.doesNotMatch(guide.textContent,/your last run/);assert.equal(h.get('#mc-export').disabled,true);
  for(const locale of ['zh-Hans','en']){setLocale(locale);await h.flush();guide=h.root.querySelector('.rx-mcg');assert.match(guide.textContent,locale==='en'?/How many scenarios are enough/:/需要多少个情景才够/);assert.doesNotMatch(guide.textContent,locale==='en'?/需要多少个情景才够/:/How many scenarios are enough/);}
  h.get('#mc-seed').value='';h.get('#mc-seed').dispatch('input');await h.flush();assert.equal(guide.hidden,true);assert.equal(h.root.mcState.valid,false);
  h.get('#mc-seed').value='rerun';h.get('#mc-seed').dispatch('input');await h.flush();h.get('#mc-run').click();h.get('#mc-cancel').click();await h.flush();assert.equal(h.root.mcState.latest,null);assert.equal(h.root.mcState.running,false);assert.equal(h.get('#mc-export').disabled,true);
  h.get('#mc-run').click();await h.flush();assert.ok(h.root.mcState.latest);assert.match(guide.textContent,/your last run/);
  for(let i=0;i<3;i++){h.root.hidden=true;h.scan();await h.flush();h.root.hidden=false;h.scan();await h.flush();assert.equal(h.root.querySelectorAll('.rx-mcg').length,1);assert.equal(h.root.querySelector('.rx-mcg').hidden,false);assert.match(h.root.querySelector('.rx-mcg').textContent,/your last run/);}
  assert.equal(h.draft.researchSimulationConfig.trials,original.trials);assert.deepEqual(h.draft.researchSimulationConfig.drivers,original.drivers);
 }finally{setLocale('en');h.cleanup();}
});
