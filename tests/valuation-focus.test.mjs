// Surface-scoped CSS/color and minimal-DOM contracts, not native keyboard or AT tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './v7-simulation-harness.mjs';
import {startStudio} from './v7-runtime-harness.mjs';
const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
const rules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^}]+)\}/g)];
function declarations(selector){const out={};for(const m of rules)if(m[1].split(',').some(s=>s.trim()===selector))for(const p of m[2].split(';')){const i=p.indexOf(':');if(i>0)out[p.slice(0,i).trim()]=p.slice(i+1).trim();}return out;}
const rgb=h=>h.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16));
const blend=(a,b,o)=>a.map((v,i)=>v*o+b[i]*(1-o));
const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const themes=['forest','slate','midnight','sand','plum','ocean'];

test('valuation focus: only the dark panel overrides the shared focus color, keeping outline geometry',()=>{
 assert.equal(declarations('.value-column')['--focus'],'var(--signal)');
 assert.equal(declarations('.value-column').background,'var(--stage)');
 for(const tag of ['button','a','input','select','textarea','summary']){
  const focus=declarations(tag+':focus-visible');
  assert.equal(focus.outline,'3px solid var(--focus)');assert.equal(focus['outline-offset'],'4px');
 }
 assert.equal(declarations('.mc-chart:focus-visible').outline,'2px solid var(--signal)');
 assert.equal(declarations('.mc-chart:focus-visible')['outline-offset'],'3px');
 assert.equal(declarations('.value-column .result-context a:focus-visible')['outline-color'],'var(--signal)');
 assert.equal(declarations('.assumption-tabs button:focus-visible').outline,'3px solid var(--focus)');
 for(const [selector] of rules.filter(m=>/--focus:var\(--signal\)/.test(m[2])).map(m=>[m[1].trim()]))assert.equal(selector,'.value-column');
});

test('valuation focus: all six palettes retain contrast, including dimmed explanatory links',()=>{
 const opacities=[1,Number(declarations('.value-column .mc-quote-note').opacity),Number(declarations('.value-column .mc-bottom').opacity)*Number(declarations('.value-column details p').opacity)];
 assert.deepEqual(opacities,[1,.65,.52]);
 for(const theme of themes){
  const t={...declarations(':root'),...declarations(`[data-theme="${theme}"]`)},stage=rgb(t['--stage']),signal=rgb(t['--signal']);
  assert.ok(contrast(signal,stage)>=8.6,theme+' full-strength focus');
  for(const opacity of opacities)assert.ok(contrast(blend(signal,stage,opacity),stage)>=3,theme+' composited focus at '+opacity);
  const hover=blend([255,255,255],stage,8/255);assert.ok(contrast(signal,hover)>=3,theme+' hovered statistic');
 }
});

test('valuation focus: simulation controls keep their existing keyboard targets and editing behavior',()=>{
 const h=fixture({ticker:'FOCUS-QA'});
 try{
  for(const id of ['#mc-play','#mc-skip','#mc-scrubber','#mc-median','#mc-market','#mc-growth-type','#mc-growth-low','#mc-growth-mode','#mc-growth-high'])assert.ok(h.get(id),id);
  assert.equal(h.get('#mc-chart').getAttribute('tabindex'),'0');
  assert.equal(h.get('#mc-scrubber').getAttribute('type'),'range');
  h.get('#mc-skip').click();
  const settings=['low','mode','high'].map(part=>h.get('#mc-growth-'+part).value),heights=h.bars().map(b=>b.getAttribute('height')),chart=h.get('#mc-chart');
  h.get('#mc-play').click();h.get('#mc-play').click();h.get('#mc-skip').click();
  assert.deepEqual(['low','mode','high'].map(part=>h.get('#mc-growth-'+part).value),settings);assert.deepEqual(h.bars().map(b=>b.getAttribute('height')),heights);assert.equal(h.get('#mc-chart'),chart);
  const select=h.get('#mc-growth-type');select.value='normal';select.onchange();
  for(const part of ['low','mean','sd','high'])assert.ok(h.get('#mc-growth-'+part));
  const next=h.get('#mc-growth-type');next.value='fixed';next.onchange();assert.ok(h.get('#mc-growth-value'));
 }finally{h.cleanup();}
});

test('valuation focus: result-source links and direct assumption editing survive invalid recovery and reload',async()=>{
 const h=await startStudio();
 for(const ticker of ['AAPL','AAOI','GOOG']){
  h.change('#current-company',ticker);
  const source=h.get('.valuation-source-context'),input=h.get('#g-growth');input.focus();
  h.input('#g-growth','12');h.flush();assert.equal(h.get('#g-growth'),input);assert.equal(h.focus(),input);assert.equal(h.get('.valuation-source-context'),source);
  h.input('#g-growth','');assert.ok(h.get('.valuation-unavailable'));
  h.input('#g-growth','14');h.flush();assert.equal(h.get('.valuation-unavailable'),null);assert.equal(h.get('#g-growth'),input);
  assert.equal(h.state(ticker).assumptions.growth,.14);
 }
 const restored=await startStudio({storage:h.storage});assert.equal(restored.state('GOOG').assumptions.growth,.14);
});
