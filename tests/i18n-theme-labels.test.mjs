import test from 'node:test';
import assert from 'node:assert/strict';
import {mountThemeLabels} from '../dist/i18n-bootstrap.js';
import {setLocale} from '../dist/i18n.js';
test('theme display names follow locale and theme events without changing stable keys',()=>{
 setLocale('en');const keys=['forest','slate','midnight','sand','plum','ocean'];
 const leaf=()=>({nodeType:1,children:[],textContent:'',tagName:'SPAN'});
 const buttons=keys.map(key=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},dataset:{themeChoice:key},label:leaf(),querySelectorAll(){return [leaf(),this.label];}}));
 const current=leaf(),doc={documentElement:{dataset:{theme:'slate'}},querySelectorAll:()=>buttons,querySelector:()=>current};
 const events=new Map(),win={addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
 const off=mountThemeLabels(doc,win);assert.equal(current.textContent,'Cobalt Ledger');
 setLocale('zh-Hans');assert.equal(current.textContent,'钴蓝帐册');assert.deepEqual(buttons.map(b=>b.label.textContent),['冰川','钴蓝帐册','夜色版','石墨','茄紫','松绿']);
 doc.documentElement.dataset.theme='midnight';current.textContent='Night Edition';events.get('valuation:theme-change')();assert.equal(current.textContent,'夜色版');
 assert.equal(buttons[2].attrs['aria-label'],'夜色版');assert.deepEqual(buttons.map(b=>b.dataset.themeChoice),keys);setLocale('en');assert.equal(current.textContent,'Night Edition');off();assert.equal(events.size,0);
});
