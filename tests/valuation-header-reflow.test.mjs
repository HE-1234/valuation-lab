// Source/minimal-DOM checks, supplemented by static layout approximations.
// These are not native zoom, browser interaction or accessibility-tree tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {calculateCurrent} from '../dist/current-model.js';
const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
const rules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^}]+)\}/g)];
function declarations(selector){const out={};for(const m of rules)if(m[1].split(',').some(s=>s.trim()===selector))for(const p of m[2].split(';')){const i=p.indexOf(':');if(i>0)out[p.slice(0,i).trim()]=p.slice(i+1).trim();}return out;}
const format=(v,d)=>v.toLocaleString('en-US',{maximumFractionDigits:d});

test('valuation header: outer summaries wrap and units form a complete inline group',()=>{
 assert.equal(declarations('.live-value')['flex-wrap'],'wrap');
 assert.equal(declarations('.live-value>div')['min-width'],'0');
 assert.equal(declarations('.live-value>div')['max-width'],'100%');
 assert.equal(declarations('.live-value>div:first-child').flex,'1 1 auto');
 assert.equal(declarations('.valuation-number').display,'block');
 assert.equal(declarations('.valuation-number>span').display,'inline-block');
 assert.equal(declarations('.valuation-number>span')['vertical-align'],'middle');
 assert.equal(declarations('.live-value-meta')['margin-left'],'auto');
 for(const selector of ['.live-value','.live-value>div','.valuation-number','.valuation-number>span']){
  const d=declarations(selector);assert.notEqual(d['white-space'],'nowrap');assert.notEqual(d.overflow,'hidden');assert.notEqual(d['text-overflow'],'ellipsis');assert.equal(d.height,undefined);
 }
 assert.equal(declarations('.valuation-number')['font-variant-numeric'],'tabular-nums');
 assert.equal(declarations('.valuation-number')['line-height'],'1.15');
});

test('valuation header: every supported company and baseline keeps exact amount, unit and operating summary',async()=>{
 const h=await startStudio();let supported=0,withheld=0;
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  for(const snapshot of company.snapshots){
   h.change('#current-snapshot',snapshot.id);const header=h.get('.live-value');
   if(!header){assert.ok(h.get('.valuation-unavailable'));withheld++;continue;}
   const mount=h.mounts.at(-1),v=calculateCurrent(mount.snapshot,mount.draft),number=h.get('.valuation-number'),unit=number.querySelector('span'),meta=h.get('.live-value-meta');
   assert.equal(number._text,format(v.perShare,2));
   assert.equal(unit.textContent,`${mount.snapshot.currency}/ share`);assert.equal(unit.querySelector('small').textContent,'/ share');
   assert.equal(meta.querySelector('b').textContent,`${format(v.enterprise/1000,1)}bn`);
   assert.match(meta.textContent,/10-year FCFF.*operating value/);
   assert.ok(h.get('.valuation-source-context'));supported++;
  }
 }
 assert.equal(supported,19);assert.equal(withheld,16);
});

test('valuation header: live edits, category navigation, invalid recovery and saved drafts remain stable',async()=>{
 const h=await startStudio();
 for(const ticker of ['AAPL','AAOI','GOOG']){
  h.change('#current-company',ticker);const input=h.get('#g-growth'),source=h.get('.valuation-source-context');input.focus();
  h.input('#g-growth','12');h.flush();assert.equal(h.get('#g-growth'),input);assert.equal(h.focus(),input);assert.equal(h.get('.valuation-source-context'),source);
  const text=h.get('.live-value').textContent,mounts=h.mounts.length;
  h.step(3);h.step(2);assert.equal(h.get('.live-value').textContent,text);assert.equal(h.mounts.length,mounts);
  h.input('#g-growth','');assert.equal(h.get('.live-value'),null);assert.ok(h.get('.valuation-unavailable'));
  h.input('#g-growth','14');h.flush();assert.ok(h.get('.live-value'));assert.equal(h.get('.valuation-unavailable'),null);assert.equal(h.state(ticker).assumptions.growth,.14);
 }
 const restored=await startStudio({storage:h.storage});assert.equal(restored.state('GOOG').assumptions.growth,.14);assert.equal(restored.get('.valuation-number').textContent,h.get('.valuation-number').textContent);
});

test('valuation header: unchanged six-theme palette and headline text retain contrast',()=>{
 const themeCSS=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const rgb=h=>h.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16));
 const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 for(const theme of ['forest','slate','midnight','sand','plum','ocean']){
  const t={};for(const m of themeCSS.matchAll(/([^{}]+)\{([^}]+)\}/g))if(m[1].trim()===':root'||m[1].trim()===`[data-theme="${theme}"]`)for(const v of m[2].matchAll(/--([a-z-]+):(#[0-9a-f]{6})/g))t[v[1]]=v[2];
  const stage=rgb(t.stage),text=rgb(t['stage-text']);
  for(const opacity of [1,.7,.6])assert.ok(contrast(text.map((v,i)=>v*opacity+stage[i]*(1-opacity)),stage)>=4.5,`${theme}: ${opacity}`);
 }
 for(const selector of ['.live-value','.live-value>div','.valuation-number','.valuation-number>span','.live-value-meta'])assert.equal(declarations(selector).color,undefined);
});
