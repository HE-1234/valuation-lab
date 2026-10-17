// Minimal-DOM and style contracts. These are not a browser or accessibility oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';

const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
const themeCSS=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const categories=[[2,'Growth'],[3,'Profitability'],[4,'Investment'],[5,'Risk'],[6,'Equity'],[1,'Story'],[0,'Sources'],[7,'Details']];
function checkSelection(h,id){
 const tabs=h.get('.assumption-tabs').querySelectorAll('button');
 assert.deepEqual(tabs.map(b=>[Number(b.dataset.step),b.textContent]),categories);
 assert.equal(tabs.filter(b=>b.getAttribute('aria-selected')==='true').length,1);
 assert.equal(tabs.filter(b=>b.getAttribute('tabindex')==='0').length,1);
 for(const b of tabs){
  const active=Number(b.dataset.step)===id;
  assert.equal(b.getAttribute('role'),'tab');
  assert.equal(b.getAttribute('aria-controls'),'assumption-editor');
  assert.equal(b.getAttribute('aria-selected'),String(active));
  assert.equal(b.getAttribute('tabindex'),active?'0':'-1');
 }
 assert.equal(h.get('#assumption-editor').getAttribute('aria-labelledby'),'group-'+id);
 assert.equal(h.get('#assumption-editor').getAttribute('data-group'),String(id));
}

test('assumption navigation: all eight categories remain direct, named tabs for every company',async()=>{
 const h=await startStudio();
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  const list=h.get('.assumption-tabs'),chart=h.get('#simulation-lab'),mounts=h.mounts.length;
  assert.equal(list.getAttribute('role'),'tablist');
  assert.equal(list.getAttribute('aria-label'),'Assumption categories');
  for(const [id] of categories){h.step(id);checkSelection(h,id);assert.equal(h.get('.assumption-tabs'),list);assert.equal(h.get('#simulation-lab'),chart);}
  assert.equal(h.mounts.length,mounts,'Category selection does not restart the distribution');
  assert.equal(h.app.querySelectorAll('[type="checkbox"]').length,0);
 }
});

test('assumption navigation: arrow, Home and End keys retain the existing focus order and wrap',async()=>{
 const h=await startStudio();const list=h.get('.assumption-tabs'),mounts=h.mounts.length;
 for(const [key,id] of [['ArrowLeft',7],['ArrowRight',2],['End',7],['Home',2],['ArrowRight',3],['ArrowRight',4]]){
  let prevented=false;
  list.querySelectorAll('button').find(b=>b.getAttribute('aria-selected')==='true').onkeydown({key,preventDefault(){prevented=true}});
  assert.equal(prevented,true);checkSelection(h,id);assert.equal(h.focus(),h.get('#group-'+id));
 }
 let prevented=false;
 h.get('#group-4').onkeydown({key:'Tab',preventDefault(){prevented=true}});
 assert.equal(prevented,false);checkSelection(h,4);assert.equal(h.mounts.length,mounts);
});

test('assumption navigation: selected category and edited inputs survive company switching and restoration',async()=>{
 const h=await startStudio();h.input('#g-growth','12');h.flush();h.step(6);h.input('#g-otherAssets','130');h.flush();
 const before=h.state();checkSelection(h,6);
 h.change('#current-company','MSFT');h.step(5);h.change('#current-company','AAPL');
 checkSelection(h,6);assert.deepEqual(h.state().assumptions,before.assumptions);
 const restored=await startStudio({storage:h.storage});checkSelection(restored,6);assert.deepEqual(restored.state().assumptions,before.assumptions);
});

test('assumption navigation: wrapping controls have stable touch targets and unclipped focus at narrow widths',()=>{
 const group=css.match(/\.assumption-tabs\{([^}]+)\}/)[1];
 const button=css.match(/\.assumption-tabs button\{([^}]+)\}/)[1];
 const selected=css.match(/\.assumption-tabs button\[aria-selected=true\]\{([^}]+)\}/)[1];
 const focus=css.match(/\.assumption-tabs button:focus-visible\{([^}]+)\}/)[1];
 assert.match(group,/flex-wrap:wrap/);assert.match(group,/overflow:visible/);assert.match(group,/gap:6px/);
 assert.match(button,/flex:1 1 20%/);assert.match(button,/min-width:7em/);assert.match(button,/min-height:44px/);assert.match(button,/white-space:normal/);
 assert.match(selected,/border-color:var\(--accent\)/);assert.match(selected,/font-weight:600/);
 assert.match(focus,/outline:3px solid var\(--focus\)/);assert.match(focus,/outline-offset:2px/);
 const tabRules=[...css.matchAll(/\.assumption-tabs[^{}]*\{([^}]+)\}/g)].map(m=>m[1]).join(';');
 assert.doesNotMatch(tabRules,/overflow(?:-x)?:auto|overflow(?:-x)?:hidden|scrollbar-width:none|mask-image:|display:none|flex:[^;]*!important/);
 assert.match(css,/@media\(max-width:780px\)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*?\.assumption-tabs button\{flex-basis:7em\}/);
});

function luminance(hex){return hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('assumption navigation: labels, active border and focus have checked contrast in all six themes',()=>{
 for(const theme of ['forest','slate','midnight','sand','plum','ocean']){
  const tokens={};for(const m of themeCSS.matchAll(/([^{}]+)\{([^}]+)\}/g))if(m[1].split(',').some(s=>s.trim()===':root'||s.trim()===`[data-theme="${theme}"]`))for(const t of m[2].matchAll(/--([a-z-]+):(#[0-9a-f]{6})/g))tokens[t[1]]=t[2];
  for(const [fg,bg] of [['muted','soft'],['ink','surface']])assert.ok(contrast(tokens[fg],tokens[bg])>=4.5,`${theme}: ${fg}/${bg}`);
  for(const [fg,bg] of [['accent','surface'],['accent','soft'],['focus','soft'],['focus','surface']])assert.ok(contrast(tokens[fg],tokens[bg])>=3,`${theme}: ${fg}/${bg}`);
 }
});
