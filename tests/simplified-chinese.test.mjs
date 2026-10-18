import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {supportedLocales,getLocale,setLocale,t} from '../dist/i18n.js';
import {mountLocaleControl} from '../dist/i18n-control.js';
const locales=new URL('../dist/locales/',import.meta.url);
const nonHan=text=>text.replace(/\p{Script=Han}/gu,'');
const readCatalog=async name=>name.endsWith('.json')?JSON.parse(fs.readFileSync(new URL(name,locales),'utf8')):(await import(new URL(name,locales))).default;
test('every retained Traditional catalog has full Simplified coverage and identical numbers, symbols, English and parameters',async()=>{
 const sources=fs.readdirSync(locales).filter(name=>name.includes('.zh-Hant.'));
 assert.equal(sources.length,11);
 let count=0;
 for(const name of sources){
  const original=await readCatalog(name),simplified=await readCatalog(name.replace('zh-Hant','zh-Hans'));
  assert.deepEqual(Object.keys(simplified),Object.keys(original),name);
  for(const [key,value]of Object.entries(original)){
   assert.equal(nonHan(simplified[key]),nonHan(value),`${name}:${key}`);
   assert.doesNotMatch(simplified[key],/蒙地卡罗|机率|变数/);
   count++;
  }
 }
 assert.ok(count>10000);
});
test('reviewed financial and statistical phrases use Simplified Chinese',async()=>{
 const annual=await readCatalog('annual.zh-Hans.js'),simulation=await readCatalog('simulation.zh-Hans.js');
 assert.equal(annual['copy.1148c513ae98'],'蒙特卡罗模拟设定与依据');
 assert.match(annual['copy.db24f9913803'],/并非经校准的概率/);
 assert.equal(simulation.t8,'变量关系');
 assert.equal(simulation.t0,'营收成长率');
 assert.equal(simulation.t3,'资本成本');
 const guided=await readCatalog('guided.zh-Hans.js');assert.equal(guided.message016,'成熟期营业利润率');
 assert.equal(guided.message023,'其他索偿权');
 assert.equal(annual['copy.3c455789ecb4'],'股权分配明细与权益索偿权');
});
test('English default, saved Simplified preference and legacy migration touch only the locale key',async()=>{
 const savedDocument=globalThis.document,savedStorage=globalThis.localStorage;
 try{
  for(const stored of [null,'en','zh-Hans','zh-Hant','invalid']){
   const writes=[],financialState='{"seed":42,"growth":0.123,"notes":"繁體 user note"}';
   globalThis.document={documentElement:{lang:''}};
   globalThis.localStorage={getItem:key=>key==='valuation-lab-locale'?stored:financialState,setItem:(...args)=>writes.push(args)};
   const isolated=await import(`../dist/i18n.js?simplified-migration=${stored}`);
   const expected=stored==='zh-Hant'||stored==='zh-Hans'?'zh-Hans':'en';
   assert.equal(isolated.getLocale(),expected);assert.equal(globalThis.document.documentElement.lang,expected);
   assert.deepEqual(writes,stored==='zh-Hant'?[['valuation-lab-locale','zh-Hans']]:[]);
   assert.equal(globalThis.localStorage.getItem('financial-state'),financialState);
  }
  globalThis.localStorage={getItem:()=> 'zh-Hant',setItem:()=>{throw Error('Storage unavailable');}};
  assert.equal((await import('../dist/i18n.js?simplified-write-failure')).getLocale(),'zh-Hans');
  globalThis.localStorage={getItem:()=>{throw Error('Storage unavailable');}};
  assert.equal((await import('../dist/i18n.js?simplified-read-failure')).getLocale(),'en');
 }finally{
  if(savedDocument===undefined)delete globalThis.document;else globalThis.document=savedDocument;
  if(savedStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=savedStorage;
 }
});
test('corner control announces Simplified Chinese and round trips without replacing state or focus',()=>{
 assert.deepEqual(supportedLocales,['en','zh-Hans']);setLocale('en');
 let button;const attrs={},state={value:'0.123',seed:42,note:'User 原文'},before=JSON.stringify(state);
 const document={body:{append:n=>button=n},getElementById:()=>button,querySelectorAll:()=>[],createElement:()=>({dataset:{},setAttribute:(k,v)=>attrs[k]=v})};
 const control=mountLocaleControl(document);control.focused=true;
 assert.equal(control.textContent,'中文');assert.equal(attrs.lang,'zh-Hans');assert.equal(attrs['aria-label'],'Switch to Simplified Chinese');
 for(let i=0;i<20;i++){control.onclick();assert.equal(button,control);assert.equal(control.focused,true);assert.equal(JSON.stringify(state),before);}
 control.onclick();assert.equal(getLocale(),'zh-Hans');assert.equal(control.textContent,'EN');assert.equal(t('shell.locale.english'),'切换为英文');setLocale('en');
});
