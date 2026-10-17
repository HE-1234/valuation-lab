// Scoped CSS/composited-color and minimal-DOM contracts, not browser or WCAG certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';

const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
const rules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^}]+)\}/g)];
function declarations(selector){
 const out={};
 for(const match of rules)if(match[1].split(',').some(s=>s.trim()===selector))
  for(const declaration of match[2].split(';')){const i=declaration.indexOf(':');if(i>0)out[declaration.slice(0,i).trim()]=declaration.slice(i+1).trim();}
 return out;
}
function tokens(theme){return {...declarations(':root'),...declarations(`[data-theme="${theme}"]`)};}
const rgb=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16));
const blend=(foreground,background,opacity)=>foreground.map((v,i)=>v*opacity+background[i]*(1-opacity));
const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

test('model-limit reminder: actual foreground roles and ancestor opacity retain contrast in all six themes',()=>{
 const panel=declarations('.value-column'),row=declarations('.value-column .result-context'),span=declarations('.result-context span:last-child');
 const link=declarations('.result-context span:last-child a'),focus=declarations('.value-column .result-context a:focus-visible');
 assert.equal(panel.background,'var(--stage)');assert.equal(row.color,'var(--stage-text)');assert.equal(link.color,'var(--signal)');
 assert.equal(focus['outline-color'],'var(--signal)');
 // Opacity is applied to the entire descendant group, including its link and focus outline.
 const opacity=[panel,row,span,declarations('.result-context a')].reduce((product,style)=>product*Number(style.opacity??1),1);
 assert.equal(opacity,1);
 for(const theme of ['forest','slate','midnight','sand','plum','ocean']){
  const t=tokens(theme),background=rgb(t['--stage']);
  for(const role of ['--stage-text','--signal'])assert.ok(contrast(blend(rgb(t[role]),background,opacity),background)>=4.5,`${theme}: composited ${role}`);
  assert.ok(contrast(blend(rgb(t['--signal']),background,opacity),background)>=3,`${theme}: focus outline`);
 }
});

test('model-limit reminder: focus changes only the dark-stage link color and retains outline geometry and wrapping',()=>{
 const focus=declarations('.value-column .result-context a:focus-visible');
 assert.deepEqual(focus,{'outline-color':'var(--signal)'});
 const general=declarations('a:focus-visible');assert.equal(general.outline,'3px solid var(--focus)');assert.equal(general['outline-offset'],'4px');
 const row=declarations('.value-column .result-context'),span=declarations('.result-context span:last-child');
 assert.equal(row['flex-wrap'],'wrap');assert.equal(span['flex-basis'],'100%');
 assert.equal(span.opacity,'1');assert.notEqual(row.overflow,'hidden');
});

test('model-limit reminder: all company baselines keep the same caveat and functioning limits disclosure',async()=>{
 const h=await startStudio();
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  for(const snapshot of company.snapshots){
   h.change('#current-snapshot',snapshot.id);
   const reminder=h.get('.result-context'),link=h.get('#model-limits-link'),limits=h.get('#model-limits');
   assert.match(reminder.textContent,/Provisional claims · illustrative assumptions.*Model limits/);
   assert.equal(link.getAttribute('data-evidence'),'limits');assert.equal(link.parent,reminder);
   const state=JSON.stringify([...h.storage]),mounts=h.mounts.length;
   link.click();assert.equal(limits.open,true);limits.open=false;link.click();assert.equal(limits.open,true);
   assert.equal(JSON.stringify([...h.storage]),state);assert.equal(h.mounts.length,mounts);
  }
 }
});

test('model-limit reminder: live edits and invalid-result recovery preserve context without introducing a gate',async()=>{
 const h=await startStudio(),reminder=h.get('.result-context'),link=h.get('#model-limits-link');
 h.input('#g-growth','12');h.flush();assert.equal(h.get('.result-context'),reminder);
 h.input('#g-growth','');assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.equal(h.get('.result-context'),reminder);
 link.click();assert.equal(h.get('#model-limits').open,true);assert.match(h.get('#guided-results').textContent,/Value withheld/);
 h.input('#g-growth','10');h.flush();assert.equal(h.get('#model-limits-link'),link);assert.doesNotMatch(h.get('#guided-results').textContent,/Value withheld/);
 assert.equal(h.app.querySelectorAll('[type="checkbox"]').length,0);
 const restored=await startStudio({storage:h.storage});assert.deepEqual(restored.state().assumptions,h.state().assumptions);
 for(const ticker of ['TSM','NBIS']){h.change('#current-company',ticker);h.get('#model-limits-link').click();assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.equal(h.get('#simulation-lab').innerHTML,'');}
});
