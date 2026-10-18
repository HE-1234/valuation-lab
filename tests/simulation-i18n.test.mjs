// Localization tests use the same deterministic synthetic controller harness.
// Browser layout, selection and native pointer behavior require browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './v7-simulation-harness.mjs';
import {setLocale,localizeMarkedNodes,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
import {simulationDefaults} from '../dist/simulation.js';
import {simulationErrorDescriptor,translateSimulationError} from '../dist/simulation-error-i18n.js';
import simEn from '../dist/locales/simulation.en.js';
import simZh from '../dist/locales/simulation.zh-Hant.js';
import distEn from '../dist/locales/distribution.en.js';
import distZh from '../dist/locales/distribution.zh-Hant.js';
import errEn from '../dist/locales/simulation-errors.en.js';
import errZh from '../dist/locales/simulation-errors.zh-Hant.js';
function enhance(h){
 const proto=Object.getPrototypeOf(h.root),old=proto.querySelectorAll;
 proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>old.call(this,part)))];};
 proto.hasAttribute=function(name){return Object.hasOwn(this.attrs,name);};
 proto.removeAttribute=function(name){delete this.attrs[name];};
 proto.matches=function(selector){return selector.split(',').some(part=>/^\[([^\]]+)\]$/.test(part)&&this.hasAttribute(part.slice(1,-1)));};
 localizeMarkedNodes(h.root);
}
test('simulation/distribution/error catalogs have identical keys and named parameter sets',()=>{
 for(const [en,zh] of [[simEn,simZh],[distEn,distZh],[errEn,errZh]]){
  assert.deepEqual(Object.keys(en),Object.keys(zh));
  for(const [key,value]of Object.entries(en))assert.deepEqual([...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),[...zh[key].matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),key);
 }
});
test('locale switches preserve simulation controls, selected tab, numeric exports, and reset Undo',async()=>{
 setLocale('en');clearTranslationDiagnostics();
 const config={...simulationDefaults(),trials:37,seed:'literal {seed} 使用者'};
 const changes=[],h=fixture({ticker:'LOCALE-STATE',reduced:true,autoplay:false,simulationConfig:config,onConfigChange:c=>changes.push(c)});
 try{
  enhance(h);const seed=h.get('#mc-seed'),growth=h.get('#mc-growth-mode'),chart=h.get('#mc-chart');
  h.get('#mc-tab-sampling').click();h.get('#mc-export').click();const before=JSON.parse(await h.exports.at(-1).text());
  const originalStatus=h.get('#mc-settings-status').textContent;const animations=h.animations.length;
  setLocale('zh-Hant');
  assert.match(h.get('#mc-title').textContent,/最新計算範圍/);
  assert.match(h.get('#mc-settings-status').textContent,/草稿/);
  assert.equal(h.get('#mc-seed'),seed);assert.equal(seed.value,config.seed);assert.equal(h.get('#mc-growth-mode'),growth);assert.equal(h.get('#mc-chart'),chart);
  assert.equal(h.get('#mc-panel-sampling').hidden,false);assert.equal(h.animations.length,animations);assert.equal(changes.length,0);
  h.get('#mc-export').click();assert.deepEqual(JSON.parse(await h.exports.at(-1).text()),before);
  setLocale('en');assert.equal(h.get('#mc-settings-status').textContent,originalStatus);
  h.get('#mc-reset-distributions').click();setLocale('zh-Hant');h.get('#mc-undo-reset').click();assert.deepEqual(changes.at(-1),config);assert.equal(h.get('#mc-seed').value,config.seed);
  assert.deepEqual(getMissingTranslations(),[]);
 }finally{setLocale('en');h.cleanup();}
});
test('switching during an unfinished simulation neither cancels nor restarts its run',async()=>{
 setLocale('en');const releases=[],h=fixture({ticker:'LOCALE-PENDING',autoplay:false,synchronous:false,simulationConfig:{...simulationDefaults(),trials:37,seed:'pending'},yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{
  enhance(h);const seed=h.get('#mc-seed'),count=releases.length;setLocale('zh-Hant');
  assert.equal(h.get('#mc-seed'),seed);assert.equal(releases.length,count);assert.equal(h.get('#mc-export').disabled,true);
  assert.match(h.get('#mc-run-progress').textContent,/正在更新|正在計算/);
  for(let n=0;n<100&&!h.get('#mc-chart');n++){releases.shift()?.();await Promise.resolve();await Promise.resolve();}
  assert.ok(h.get('#mc-chart'));assert.equal(h.get('#mc-export').disabled,false);
  h.get('#mc-export').click();const output=JSON.parse(await h.exports.at(-1).text());assert.equal(output.config.seed,'pending');assert.equal(output.attempts,37);
 }finally{setLocale('en');h.cleanup();}
});
test('validation error translations preserve driver identifiers and constraints',()=>{
 const input='growth: require low ≤ mode ≤ high.';assert.equal(simulationErrorDescriptor(input).key,'simulation-errors.triangle');setLocale('zh-Hant');assert.match(translateSimulationError(input),/growth.*下界.*眾數.*上界/);assert.match(translateSimulationError('growth: normal SD must be strictly positive; use Fixed for zero uncertainty.'),/標準差.*大於零/);assert.equal(translateSimulationError('User-authored note unchanged'),'User-authored note unchanged');setLocale('en');assert.equal(translateSimulationError(input),input);
});
