import test from 'node:test';
import assert from 'node:assert/strict';
import {guideFixture} from './simulation-guide-dom-harness.mjs';
import {setLocale} from '../dist/i18n.js';
const summary=accepted=>({p10:80,p50:100,p90:120,accepted});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} vs ${b}`);

test('precision denominator is actual accepted count, with conservative projected counts',()=>{
 const h=guideFixture();try{
  const f=h.guideAPI.samplingPrecision,all=f(summary(5000),5000,5000),rejected=f(summary(100),5000,5000);
  close(rejected.median/all.median,Math.sqrt(50));close(rejected.edge/all.edge,Math.sqrt(50));
  close(rejected.median,1.96*1.2533*((120-80)/2.5631)/Math.sqrt(100));assert.equal(rejected.accepted,100);
  assert.equal(f(summary(101),400,5000).accepted,1262);assert.equal(f(summary(100),5000,1000),null);assert.equal(f(summary(100),5000,10000).accepted,200);
 }finally{h.cleanup();}
});

test('precision withholds low, missing, inconsistent and collapsed accepted samples',()=>{
 const h=guideFixture();try{
  const f=h.guideAPI.samplingPrecision;
  for(const accepted of [undefined,null,0,1,99,100.5,NaN,Infinity,5001])assert.equal(f(summary(accepted),5000,5000),null,String(accepted));
  for(const sum of [{...summary(5000),p10:NaN},{...summary(5000),p50:121},{...summary(5000),p90:79},{...summary(5000),p10:100,p90:100},{...summary(5000),p10:-1e308,p90:1e308},{...summary(5000),p10:1e16,p50:1e16,p90:1e16+2}])assert.equal(f(sum,5000,5000),null);
  for(const n of [0,-1,undefined,Infinity,100.5])assert.equal(f(summary(100),n,5000),null);
  for(const count of [0,-1,undefined,NaN,100.5])assert.equal(f(summary(100),5000,count),null);
 }finally{h.cleanup();}
});

for(const locale of ['en','zh-Hans'])test(`precision ${locale} labels approximations, actual/projection counts, and withheld rows`,()=>{
 const h=guideFixture();try{
  setLocale(locale);const render=accepted=>{const node=h.document.createElement('div');node.innerHTML=h.guideAPI.samplingGuide({config:{trials:5000,seed:'qa'},latest:summary(accepted)}).map(x=>x[1]).join('');return node;};
  const low=render(99);assert.equal(low.querySelector('.rx-mcg-prec'),null);assert.doesNotMatch(low.textContent,/median ±|中位数 ±/);assert.match(low.textContent,locale==='en'?/at least 100 accepted/:/至少 100 个/);
  const n=render(100);assert.match(n.textContent,locale==='en'?/not validated 95% intervals/:/未经验证为 95% 置信区间/);assert.match(n.textContent,locale==='en'?/100 accepted of 5,000 attempted/:/尝试 5,000 个情景，接受 100 个/);
  assert.match(n.querySelector('.rx-mcg-prec li.is-yours').textContent,locale==='en'?/100 accepted/:/已接受 100 个/);assert.doesNotMatch(n.querySelector('.rx-mcg-prec li.is-yours').textContent,/projected|预计/);
  assert.match(n.textContent,locale==='en'?/200 accepted \(projected\)/:/预计接受 200 个/);assert.match(n.querySelector('.rx-mcg-prec li').textContent,locale==='en'?/Estimate withheld/:/暂不提供精度估计/);
 }finally{setLocale('en');h.cleanup();}
});

test('actual engine exclusions feed accepted-only sampling precision without mutating settings',async()=>{
 const h=guideFixture({research:true,ticker:'UMC',configMutate:c=>{c.trials=1200;(c.jointAnnual?.drivers||c.drivers).waccShift={type:'uniform',low:-.15,high:.15};}});
 try{
  const initial=structuredClone(h.draft.researchSimulationConfig);h.get('#mc-tab-sampling').click();await h.flush();h.get('#mc-run').click();await h.flush();
  const run=h.runs.find(r=>r.config.trials===1200);assert.ok(run?.result);assert.ok(run.result.excluded>0);assert.ok(run.result.accepted>=100&&run.result.accepted<1200);assert.equal(h.root.mcState.latest.accepted,run.result.accepted);
  const precision=h.guideAPI.samplingPrecision(h.root.mcState.latest,1200,1200);assert.equal(precision.accepted,run.result.accepted);assert.ok(precision.median>0);
  const guide=h.root.querySelector('.rx-mcg');assert.match(guide.textContent,new RegExp(`${run.result.accepted.toLocaleString('en-US')} accepted of 1,200 attempted`));assert.deepEqual(h.draft.researchSimulationConfig,initial);assert.equal(h.get('#mc-export').disabled,false);
 }finally{h.cleanup();}
});

for(const locale of ['en','zh-Hans'])test(`positive sampling error below display resolution remains explicit in ${locale}`,()=>{
 const h=guideFixture();try{
  setLocale(locale);const node=h.document.createElement('div');node.innerHTML=h.guideAPI.samplingGuide({config:{trials:5000,seed:'tiny'},latest:{p10:100,p50:100.00005,p90:100.0001,accepted:5000}}).map(x=>x[1]).join('');
  assert.match(node.textContent,/±<0\.01/);assert.doesNotMatch(node.textContent,/±0(?:\.0+)?(?:\b|%)/);assert.match(node.textContent,/<0\.01%/);
 }finally{setLocale('en');h.cleanup();}
});
