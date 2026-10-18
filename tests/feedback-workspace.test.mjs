// Shipped code, finite synthetic DOM. No claim of native browser/AT behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {formatMoneyMillions,formatTimestamp,compactAnnualPeriod,parseDisplayedNumber,comparisonText} from '../dist/display-format.js';
import {mountWorkspaceNavigation,workspacePages} from '../dist/workspace-navigation.js';
import {startResearchWorkspace,minimalDocument,bundledResearch} from './research-workspace-harness.mjs';
import {researchDraftFor,calculateResearchOperating,RESEARCH_STORAGE_PREFIX} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {startStudio} from './v7-runtime-harness.mjs';
import {calculateCurrent} from '../dist/current-model.js';
const read=name=>fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const withoutTime=d=>{const copy=structuredClone(d);delete copy.updatedAt;return copy;};
function navigationFixture(hash=''){
 const document=minimalDocument();document.root.innerHTML=read('index.html');document.getElementById=id=>document.querySelector('#'+id);
 Object.defineProperty(Object.getPrototypeOf(document.root),'classList',{get(){const el=this;return {contains:name=>(el.attrs.class||'').split(/\s+/).includes(name),toggle(name,yes){const names=new Set((el.attrs.class||'').split(/\s+/).filter(Boolean));if(yes)names.add(name);else names.delete(name);el.attrs.class=[...names].join(' ');}};}});
 const events=[],listeners=new Map(),enters=[],location={hash},entries=[hash];let index=0;
 const window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),dispatchEvent:event=>events.push(event),scrollTo(){throw Error('Navigation must not force scroll');}};
 const history={pushState(_s,_t,hash){entries.splice(++index);entries.push(hash);location.hash=hash;},back(){if(index){location.hash=entries[--index];listeners.get('popstate')?.();}},forward(){if(index+1<entries.length){location.hash=entries[++index];listeners.get('popstate')?.();}}};
 const nav=mountWorkspaceNavigation({document,window,history,location,enter:el=>enters.push(el.id)});
 return {document,window,history,location,events,listeners,enters,nav,get:s=>document.querySelector(s)};
}
test('feedback navigation: three primary destinations keep six distinct route IDs and model modes',()=>{
 const h=navigationFixture();assert.deepEqual(h.document.querySelectorAll('[data-primary]').map(x=>x.textContent),['Studio','Research','Learn']);
 assert.deepEqual(Object.keys(workspacePages).sort(),['current','data','history','learn','renewed','workbench']);
 assert.equal(h.nav.getPage(),'renewed');assert.equal(h.get('#breadcrumb').textContent,'Studio / Year-by-year');
 for(const page of Object.keys(workspacePages)){
  h.nav.show(page);assert.equal(h.nav.getPage(),page);const visible=h.document.querySelectorAll('.page').filter(x=>!x.classList.contains('hidden'));assert.deepEqual(visible.map(x=>x.id),[page]);
  assert.equal(h.get(`[data-tab="${page}"]`).getAttribute('aria-current'),'page');
  assert.equal(h.get(`[data-primary="${workspacePages[page].section}"]`).getAttribute('aria-current'),'page');
 }
 h.nav.show('current');h.get('[data-primary="research"]').click();h.nav.show('data');h.get('[data-primary="studio"]').click();assert.equal(h.nav.getPage(),'current');h.get('[data-primary="research"]').click();assert.equal(h.nav.getPage(),'data');
});
test('feedback navigation: Back to empty initial hash returns to annual mode; Forward and deep links work',()=>{
 const h=navigationFixture();h.get('[data-tab="current"]').click();assert.equal(h.location.hash,'#current');h.history.back();assert.equal(h.location.hash,'');assert.equal(h.nav.getPage(),'renewed');h.history.forward();assert.equal(h.nav.getPage(),'current');
 const deep=navigationFixture('#workbench');assert.equal(deep.nav.getPage(),'workbench');assert.deepEqual(deep.enters,[]);deep.location.hash='#forecast-details';deep.listeners.get('hashchange')();assert.equal(deep.nav.getPage(),'workbench');
 deep.get('[data-page-link="renewed"]').click();assert.equal(deep.nav.getPage(),'renewed');deep.nav.destroy();assert.equal(deep.listeners.size,0);
});
test('feedback display: compact money keeps currency, negative sign and raw values separate',()=>{
 assert.equal(formatMoneyMillions(2142560,'USD'),'$2.14T');assert.equal(formatMoneyMillions(-2142560,'USD'),'−$2.14T');assert.equal(formatMoneyMillions(5000,'TWD'),'NT$5B');assert.equal(formatMoneyMillions(0,'USD'),'$0M');assert.equal(formatMoneyMillions(null),'Not computed');
 assert.equal(formatTimestamp('2021-03-01T14:30:00Z'),'Mar 1, 2021 · 14:30 UTC');assert.equal(formatTimestamp('2026-06-27'),'Jun 27, 2026');assert.equal(formatTimestamp('unknown'),'unknown');
 assert.equal(comparisonText(149.97,100,{unit:' USD / share'}),'+49.97 USD / share · +50% from starting case');assert.ok(!comparisonText(-50,-100,{money:true}).includes('%'));
});
test('feedback display: annual period labels respect actual calendars and preserve unknown precision',()=>{
 const cases=bundledResearch().companies;
 for(const c of cases)for(const r of c.annual){const before=JSON.stringify(r),label=compactAnnualPeriod(r);assert.ok(label);assert.equal(JSON.stringify(r),before);assert.doesNotMatch(label,/plus \d+ years/);}
 const nv=cases.find(c=>c.ticker==='NVDA');assert.equal(compactAnnualPeriod(nv.annual[0]),'Jul 2027');assert.equal(compactAnnualPeriod(nv.annual[1]),'Jul 2028');assert.match(nv.annual[0].period,/not fiscal/);
 assert.equal(compactAnnualPeriod(cases.find(c=>c.ticker==='MU').annual[0]),'FY2027');assert.equal(compactAnnualPeriod(cases.find(c=>c.ticker==='AAOI').annual[0]),'2027');
});
test('feedback annual: reading and focusing every cell does not round or save any financial input',async()=>{
 const h=await startResearchWorkspace();let cells=0;
 for(const c of h.library.companies){h.choose(c.ticker);const before=JSON.stringify(h.getState().draft),writes=h.writes.length;
  for(const el of h.root.querySelectorAll('[data-research-input="annual"]')){const r=h.getState().draft.annual[+el.dataset.index],exact=r[el.dataset.field]*Number(el.dataset.scale);el.onfocus();assert.equal(el.value,String(exact));el.onblur();el.onfocus();assert.equal(el.value,String(exact));cells++;}
  assert.equal(JSON.stringify(h.getState().draft),before,c.ticker);assert.equal(h.writes.length,writes,c.ticker+' focus/blur must never save');
 }
 // The explicitly selected GOOG case adds five annual rows, each with five inputs.
 assert.equal(cells,800+5*5);
});
test('feedback annual: grouped display, full precision edits, invalid text, blanks and recovery remain distinct',async()=>{
 const h=await startResearchWorkspace(),selector=h.field('annual','revenue',0),el=h.get(selector);
 h.input(selector,'508,837.0712345678');assert.equal(h.getState().draft.annual[0].revenue,508837.0712345678);el.onblur();assert.equal(el.value,'508,837.1');el.onfocus();assert.equal(el.value,'508837.0712345678');
 h.input(selector,'1,2');assert.ok(Number.isNaN(h.getState().draft.annual[0].revenue));assert.equal(el.getAttribute('aria-invalid'),'true');el.onblur();el.onfocus();assert.equal(el.value,'1,2');assert.equal(h.get('.research-big-value'),null);
 h.input(selector,'');assert.equal(h.getState().draft.annual[0].revenue,null);assert.equal(el.getAttribute('aria-invalid'),'true');
 h.input(selector,'508837.0712345678');assert.equal(h.getState().draft.annual[0].revenue,508837.0712345678);assert.equal(el.getAttribute('aria-invalid'),'false');assert.ok(h.get('.research-big-value'));h.action('export');assert.equal(h.downloads[0].value.draft.annual[0].revenue,508837.0712345678);
 assert.equal(parseDisplayedNumber('1,000,000.25'),1000000.25);assert.ok(Number.isNaN(parseDisplayedNumber('1,00.25')));assert.equal(parseDisplayedNumber('-1e3'),-1000);assert.equal(parseDisplayedNumber(''),null);
});
test('feedback annual: true starting-case deltas follow edits, reloads, Undo and company identity',async()=>{
 const h=await startResearchWorkspace(),initial=structuredClone(h.getState().draft),start=calculateResearchOperating(initial).enterprise;
 h.input(h.field('annual','margin',0),'40');const now=calculateResearchOperating(h.getState().draft).enterprise;
 assert.equal(h.get('[data-value-change="operating"]').textContent,comparisonText(now,start,{money:true,currency:'USD'}));
 h.select('MSFT');h.select('AAPL');assert.equal(h.get('[data-value-change="operating"]').textContent,comparisonText(now,start,{money:true,currency:'USD'}));
 h.action('load');assert.match(h.get('[data-value-change="operating"]').textContent,/\$0M/);h.action('undo');assert.equal(calculateResearchOperating(h.getState().draft).enterprise,now);
 const reload=await startResearchWorkspace({storage:h.storage});assert.match(reload.get('[data-value-change="operating"]').textContent,/\$0M/);assert.deepEqual(withoutTime(reload.getState().draft),withoutTime(h.getState().draft));
 h.change('#research-timing-mode','as-of-scenario');assert.match(h.get('.comparison-unavailable').textContent,/different valuation dates/);
});
test('feedback annual: signed negative operating EV and native TWD share labels survive formatting',async()=>{
 const h=await startResearchWorkspace();h.input(h.field('annual','reinvestment',0),'100000000');assert.ok(calculateResearchOperating(h.getState().draft).enterprise<0);assert.match(h.get('.research-big-value').textContent,/^−\$/);assert.match(h.get('#research-results').textContent,/Negative operating value is preserved/);
 h.select('TSM');assert.match(h.get('.research-big-value').textContent,/^NT\$/);assert.match(h.get('.research-equity-value').textContent,/TWD.*ordinary share/);assert.match(h.get('#research-editor').textContent,/TWD millions/);
});
test('feedback annual: summary precedes full-width editor and uncertainty; all year semantics remain',async()=>{
 const h=await startResearchWorkspace(),html=h.root.innerHTML;assert.ok(html.indexOf('id="research-results"')<html.indexOf('id="research-editor"'));assert.ok(html.indexOf('id="research-editor"')<html.indexOf('id="research-analysis"'));
 assert.ok(h.get('.research-schedule'));assert.equal(h.root.querySelectorAll('[data-research-input="annual"]').length,50);assert.ok(h.get('.period-convention'));assert.match(h.get('.period-convention').textContent,/Rolling annual periods/);assert.ok(h.get('.annual-anchor'));assert.equal(h.get('.research-date-line').querySelector('time').getAttribute('datetime'),'2026-06-27');
 const css=read('workspace.css');assert.match(css,/#research-editor>\.research-schedule\{grid-column:1\/-1/);assert.match(css,/th:first-child\{[^}]*position:static;left:auto/);assert.match(css,/--type-body:1rem/);assert.match(css,/--type-support:\.875rem/);assert.match(css,/max-inline-size:var\(--reading-measure\)/);
});
test('feedback guided: numerical change comes from opening model and never writes comparison into drafts',async()=>{
 const h=await startStudio(),initial=structuredClone(h.state());const mounted=h.mounts.at(-1),base=calculateCurrent(mounted.snapshot,initial).perShare;
 h.step(3);h.input('#g-targetMargin','40');const now=calculateCurrent(mounted.snapshot,h.state()).perShare,delta=now-base;
 const node=h.get('[data-value-change="guided"]');assert.ok(node);assert.ok(node.textContent.includes(Math.abs(delta).toLocaleString('en-US',{maximumFractionDigits:2})));assert.match(node.textContent,/from starting case/);assert.match(h.get('.comparison-basis').textContent,/Mature EBIT margin/);
 assert.equal(h.state().openingValues,undefined);assert.equal(h.state().comparison,undefined);h.change('#current-company','MSFT');h.change('#current-company','AAPL');assert.equal(h.get('[data-value-change="guided"]').textContent,node.textContent);
});

test('feedback reading: result disclosures use dark-surface text and Learn has a bounded reading measure',()=>{
 const css=read('workspace.css'),learn=read('learn.css');assert.match(css,/\.research-value \.exact-value>summary\{color:var\(--stage-text\)\}/);assert.match(css,/\.research-value \.exact-value>summary::marker\{color:var\(--signal\)\}/);assert.match(css,/--reading-measure:70ch/);assert.match(learn,/\.learn-feedback p,\.learn-exercise p,\.learn-session-note\{max-inline-size:70ch\}/);
 const doc=minimalDocument();doc.root.innerHTML=read('index.html');for(const node of doc.querySelectorAll('[aria-controls]'))for(const id of node.getAttribute('aria-controls').split(' '))assert.ok(doc.querySelector('#'+id),id);
});
