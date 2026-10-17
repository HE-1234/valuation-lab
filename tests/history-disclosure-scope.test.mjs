// Source/minimal-DOM contracts, not a native-browser or accessibility-tree test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');

// Match only the simple combinators used by these disclosure rules. This is a
// scoped selector regression check, not a general-purpose CSS cascade emulator.
function compound(el,selector){
 if(!el)return false;
 const type=selector.match(/^[a-z]+/)?.[0];
 return (!type||el.tag===type)&&[...selector.matchAll(/\.([\w-]+)/g)].every(m=>(el.attrs.class||'').split(/\s+/).includes(m[1]))&&(!selector.includes('[open]')||'open' in el.attrs);
}
function matches(el,selector){
 const parts=selector.trim().replace(/\s*>\s*/g,' > ').split(/\s+/);
 function at(node,i){
  if(!compound(node,parts[i]))return false;
  if(i===0)return true;
  if(parts[i-1]==='>')return at(node.parent,i-2);
  for(let p=node.parent;p;p=p.parent)if(at(p,i-1))return true;
  return false;
 }
 return at(el,parts.length-1);
}
const markerRules=[...css.matchAll(/([^{}]+)::after\{([^}]+)\}/g)].filter(m=>m[1].trim().startsWith('.assumption-editor')&&/content:/.test(m[2])).map((m,i)=>({selector:m[1].trim(),value:m[2].match(/content:'([^']*)'/)[1],specificity:(m[1].match(/\.|\[/g)||[]).length*100+(m[1].match(/(?:^|[ >])(?:details|summary)(?=[\s[>]|$)/g)||[]).length,index:i}));
function marker(summary){return markerRules.filter(r=>matches(summary,r.selector)).sort((a,b)=>a.specificity-b.specificity||a.index-b.index).at(-1)?.value;}
const hiddenRules=[...css.matchAll(/([^{}]+)\{([^}]+)\}/g)].filter(m=>m[1].trim().startsWith('.assumption-editor')&&/display:none(?:;|$)/.test(m[2])&&m[1].includes('summary')).map(m=>m[1].trim());
function nested(h){return h.app.querySelectorAll('.history-method').flatMap(parent=>parent.querySelectorAll('.history-years').map(child=>({parent,child,summary:child.children[0]})));}

test('history disclosure: a parent open state does not change a closed child marker',async()=>{
 const h=await startStudio();h.step(4);
 const items=nested(h);assert.ok(items.length>=2);
 for(const {parent,child,summary} of items){
  assert.equal(marker(summary),'+');
  parent.setAttribute('open','');assert.equal(marker(summary),'+');
  child.setAttribute('open','');assert.equal(marker(summary),'−');
  delete parent.attrs.open;assert.equal(marker(summary),'−','Closing the parent does not reset the child state');
  parent.setAttribute('open','');assert.equal(marker(summary),'−','Reopening the parent retains the expanded child');
  delete child.attrs.open;assert.equal(marker(summary),'+');
  delete parent.attrs.open;assert.equal(marker(summary),'+');
 }
});

test('history disclosure: parent marker decoration never hides nested labels or counts',async()=>{
 const h=await startStudio();
 for(const {parent,summary} of nested(h)){
  parent.setAttribute('open','');
  assert.equal(hiddenRules.some(s=>matches(parent.children[0].children[0],s)),true,'The parent decorative arrow stays hidden');
  for(const span of summary.children){assert.ok(span.textContent);assert.equal(hiddenRules.some(s=>matches(span,s)),false,span.textContent);}
 }
 assert.match(css,/\.assumption-editor \.history-method>summary>span\{display:none\}/);
 assert.doesNotMatch(css,/\.assumption-editor details\[open\]\s+summary::after/);
});

test('history disclosure: every company keeps independent, labeled native annual controls beside inputs',async()=>{
 const h=await startStudio();let checked=0;
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  for(const step of [2,3,4,5,6]){
   h.step(step);
   for(const {parent,child,summary} of nested(h)){
    checked++;assert.equal(child.tag,'details');assert.equal(summary.tag,'summary');
    assert.match(summary.textContent,/All \d+ annual observations\d+ available/);
    assert.equal(summary.onclick,undefined);assert.equal(summary.getAttribute('role'),null);assert.equal(summary.getAttribute('aria-expanded'),null);
    assert.ok(child.querySelector('table'));assert.ok(child.querySelector('caption'));assert.ok(child.querySelectorAll('tr').length>=2);
    parent.setAttribute('open','');assert.equal(marker(summary),'+');
    for(const span of summary.children)assert.equal(hiddenRules.some(s=>matches(span,s)),false,company.ticker);
    child.setAttribute('open','');assert.equal(marker(summary),'−');
   }
  }
 }
 assert.equal(checked,196);
});

test('history disclosure: nested disclosure state does not replace inputs or disturb saved edits',async()=>{
 const h=await startStudio();h.input('#g-growth','12');h.flush();
 const input=h.get('#g-growth'),before=h.state(),mounts=h.mounts.length;
 input.focus();
 for(const {parent,child,summary} of nested(h))for(let i=0;i<3;i++){
  parent.setAttribute('open','');child.setAttribute('open','');assert.equal(marker(summary),'−');
  delete child.attrs.open;assert.equal(marker(summary),'+');delete parent.attrs.open;
 }
 assert.equal(h.get('#g-growth'),input);assert.equal(h.focus(),input);assert.deepEqual(h.state(),before);assert.equal(h.mounts.length,mounts);
 h.input('#g-growth','');assert.ok(h.get('.valuation-unavailable'));
 h.input('#g-growth','14');h.flush();assert.equal(h.get('.valuation-unavailable'),null);assert.equal(h.get('#g-growth'),input);
 h.step(4);h.step(2);assert.equal(h.state().assumptions.growth,.14);
 const restored=await startStudio({storage:h.storage});assert.equal(restored.state().assumptions.growth,.14);
});

test('history disclosure: restored labels and indicators use readable existing colors in all six themes',()=>{
 const themeCSS=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const lum=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 for(const theme of ['forest','slate','midnight','sand','plum','ocean']){
  const tokens={};for(const m of themeCSS.matchAll(/([^{}]+)\{([^}]+)\}/g))if(m[1].split(',').some(s=>s.trim()===':root'||s.trim()===`[data-theme="${theme}"]`))for(const t of m[2].matchAll(/--([a-z-]+):(#[0-9a-f]{6})/g))tokens[t[1]]=t[2];
  assert.ok(contrast(tokens.muted,tokens.soft)>=4.5,theme+' label/count');
  assert.ok(contrast(tokens.accent,tokens.soft)>=3,theme+' indicator');
 }
 assert.match(css,/\.assumption-editor \.history-years>summary\{[^}]*min-height:44px/);
 assert.match(css,/\.assumption-editor \.history-years>summary\{[^}]*flex-wrap:wrap/);
 assert.match(css,/\.assumption-editor \.history-years>summary>span:first-child\{[^}]*flex:1 1 10em/);
 assert.match(css,/\.assumption-editor \.history-years>summary::after\{[^}]*color:var\(--accent\)/);
});
