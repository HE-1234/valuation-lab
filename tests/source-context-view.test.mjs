// Minimal DOM and CSS contracts; static previews supplement these checks.
// These tests do not establish native-browser layout or accessibility conformance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
const themeCSS=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const modeFor=s=>s.snapshotMode==='ttm'?'Derived TTM':s.snapshotMode==='annual-reference'?'Reported FY':'Evidence only';

test('source context: every company/baseline exposes the full period and original filing before valuation and simulation',async()=>{
 const h=await startStudio();
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  for(const snapshot of company.snapshots){
   h.change('#current-snapshot',snapshot.id);
   const context=h.get('.valuation-source-context'),value=h.get('#guided-results'),simulation=h.get('#simulation-lab');
   assert.ok(context,company.ticker+' source context');
   assert.equal(context.getAttribute('role'),'group');
   assert.equal(context.getAttribute('aria-label'),'Financial period and original filing');
   assert.equal(context.querySelector('span').textContent,`${modeFor(snapshot)} · ${snapshot.periodEnd||'unknown period'}`);
   const link=context.querySelector('a');
   assert.equal(link.getAttribute('href'),/^https?:\/\//.test(snapshot.sourceUrl||'')?snapshot.sourceUrl:'#');
   assert.equal(link.getAttribute('aria-label'),`Original filing for ${company.ticker} · ${modeFor(snapshot)} · ${snapshot.periodEnd||'unknown period'}`);
   assert.equal(link.getAttribute('rel'),'noopener');
   assert.equal(context.parent,value.parent);
   const children=value.parent.children;
   assert.ok(children.indexOf(context)<children.indexOf(value));
   assert.ok(children.indexOf(value)<children.indexOf(simulation));
   assert.ok(children.indexOf(simulation)<children.indexOf(h.get('.result-context')));
   assert.match(h.get('.result-context').textContent,/Provisional claims.*illustrative assumptions.*Limits/);
   assert.doesNotMatch(h.get('.result-context').textContent,/Derived TTM|Reported FY/);
  }
 }
});

test('source context: input edits and invalid-model recovery keep the dated source stable without weakening gates',async()=>{
 const h=await startStudio();
 const context=h.get('.valuation-source-context'),link=context.querySelector('a').getAttribute('href');
 h.input('#g-growth','12');h.flush();assert.equal(h.get('.valuation-source-context'),context);
 h.input('#g-growth','');assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.equal(h.get('.valuation-source-context'),context);assert.equal(h.get('#simulation-lab').innerHTML,'');
 h.input('#g-growth','10');h.flush();assert.equal(h.get('.valuation-source-context'),context);assert.equal(context.querySelector('a').getAttribute('href'),link);
 h.get('#model-limits-link').click();assert.equal(h.get('#model-limits').open,true);
 for(const ticker of ['TSM','NBIS']){h.change('#current-company',ticker);assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.ok(h.get('.valuation-source-context'));assert.equal(h.get('#simulation-lab').innerHTML,'');}
});

test('source context: AAOI and Alphabet keep the financial period separate from their capital-reference note',async()=>{
 const h=await startStudio();
 for(const ticker of ['AAOI','GOOG']){
  h.change('#current-company',ticker);const context=h.get('.valuation-source-context');
  assert.match(context.textContent,/Derived TTM · 2026-06-30/);
  assert.match(h.get('.claims-result-note').textContent,/2026-06-30 capital reference/);
  assert.doesNotMatch(context.textContent,/capital reference|pro forma/);
 }
 h.change('#current-company','AAOI');h.step(6);h.change('#claim-capitalBasis','known-transactions');
 assert.match(h.get('.claims-result-note').textContent,/Known-transaction pro forma/);
 assert.match(h.get('.valuation-source-context').textContent,/Derived TTM · 2026-06-30/);
});

test('source context: narrow 320/390px style contract wraps full text and keeps a named source link target',()=>{
 const row=css.match(/\.valuation-source-context\{([^}]+)\}/)[1],label=css.match(/\.valuation-source-context>span\{([^}]+)\}/)[1],link=css.match(/\.valuation-source-context>a\{([^}]+)\}/)[1];
 // One unqualified rule applies at both narrow widths; no breakpoint can hide or truncate it.
 assert.equal((css.match(/\.valuation-source-context\{/g)||[]).length,1);
 for(const width of [320,390]){
  assert.match(row,/flex-wrap:wrap/,`${width}px wrapping`);assert.match(row,/min-width:0/);assert.match(row,/font-size:12px/);
  assert.match(label,/flex:1 1 180px/);assert.match(label,/white-space:normal/);assert.match(label,/overflow-wrap:anywhere/);
  assert.match(link,/min-height:28px/);assert.match(link,/color:var\(--signal\)/);
  assert.doesNotMatch(row+label,/overflow:hidden|text-overflow:ellipsis|display:none/);
 }
});

function luminance(hex){return hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('source context: both source text and filing link have at least 4.5:1 contrast in every theme',()=>{
 for(const theme of ['forest','slate','midnight','sand','plum','ocean']){
  const tokens={};for(const m of themeCSS.matchAll(/([^{}]+)\{([^}]+)\}/g))if(m[1].trim()===':root'||m[1].trim()===`[data-theme="${theme}"]`)for(const t of m[2].matchAll(/--([a-z-]+):(#[0-9a-f]{6})/g))tokens[t[1]]=t[2];
  for(const fg of ['stage-text','signal'])assert.ok(contrast(tokens[fg],tokens.stage)>=4.5,`${theme}: ${fg}`);
 }
});
