import {displayNumber,precisionInputAttributes,bindPrecisionInputs} from '../dist/number-display.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as i18n from '../dist/i18n.js';
import appEnglish from '../dist/locales/historical-app.en.js';
import appChinese from '../dist/locales/historical-app.zh-Hans.js';
import {defaults,valueCompany,eligibleSnapshots} from '../dist/engine.js';
import {minimalDocument} from './research-workspace-harness.mjs';
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
test('Historical app catalogs have complete key and parameter parity',()=>{
 assert.deepEqual(Object.keys(appEnglish).sort(),Object.keys(appChinese).sort());
 for(const key of Object.keys(appEnglish))assert.deepEqual([...appEnglish[key].matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),[...appChinese[key].matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),key);
});
test('Historical app explicit localization changes presentation without recalculation or input replacement',()=>{
 i18n.setLocale('en');const document=minimalDocument();document.root.innerHTML=html;
 Object.defineProperty(Object.getPrototypeOf(document.root),'classList',{get(){const node=this;return {contains:name=>node.className.split(/\s+/).includes(name),add(name){node.className=[...new Set([...node.className.split(/\s+/),name])].join(' ');},remove(name){node.className=node.className.split(/\s+/).filter(x=>x!==name).join(' ');},toggle(name,force){if(force)this.add(name);else this.remove(name);}};}});
 const prototype=Object.getPrototypeOf(document.root),queryAll=prototype.querySelectorAll;
 prototype.hasAttribute=function(name){return this.getAttribute(name)!==null;};
 prototype.querySelectorAll=function(selector){return selector.includes(',')?[...new Set(selector.split(',').flatMap(part=>queryAll.call(this,part)))]:queryAll.call(this,selector);};
 let calculations=0,unsubscribe;
 const prefix=source.slice(0,source.indexOf("import {createThemeTransition}")).replace(/^import .*;\n/gm,'');
 const appBody=source.slice(source.indexOf('const n='),source.indexOf('const questions='));
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const harness=new Function('document','registerCatalog','t','localizedText','localizeMarkedNodes','onLocaleChange','appEnglish','appChinese','defaults','valueCompany','eligibleSnapshots','formatTimestamp','localStorage','esc','displayNumber','precisionInputAttributes','bindPrecisionInputs',
  `${prefix}\nconst $=s=>document.querySelector(s);${appBody}\nreturn {setupFields,render,renderPicker,chooseCompany,state:()=>JSON.stringify({a,selected,saved,activeCase,pathEditNotice}),chart};`)(document,i18n.registerCatalog,i18n.t,i18n.localizedText,i18n.localizeMarkedNodes,callback=>{unsubscribe=i18n.onLocaleChange(callback);return unsubscribe;},appEnglish,appChinese,defaults,(...args)=>{calculations++;return valueCompany(...args);},eligibleSnapshots,s=>s,{getItem:()=>null},esc,displayNumber,precisionInputAttributes,bindPrecisionInputs);
 harness.setupFields();harness.renderPicker();harness.render();
 const input=document.querySelector('#a-growth');input.focus();input.value='3.7';
 const state=harness.state(),count=calculations,chart=document.querySelector('#chart svg'),before=document.querySelector('#valuation-result').textContent;
 i18n.setLocale('zh-Hans');
 assert.equal(harness.state(),state);assert.equal(calculations,count);assert.equal(document.querySelector('#a-growth'),input);assert.equal(input.value,'3.7');assert.equal(document.activeElement,input);assert.equal(document.querySelector('#chart svg'),chart);
 assert.match(document.querySelector('#valuation-result').textContent,/内在价值/);assert.match(document.querySelector('#chart-desc').textContent,/现金流/);
 assert.match(document.querySelector('label[for="a-growth"]').textContent,/营收/);
 i18n.setLocale('en');assert.equal(document.querySelector('#valuation-result').textContent,before);assert.equal(calculations,count);unsubscribe();
});
