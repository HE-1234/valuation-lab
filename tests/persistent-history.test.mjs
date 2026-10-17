// Actual shipped handlers in a synthetic DOM. Native layout/focus/AT remain unverified.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {assumptionEvidence} from '../dist/assumption-history.js';
import {currentSnapshot} from '../dist/current-model.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const history=JSON.parse(read('../dist/data/company-history.json'));
const refs=JSON.parse(read('../dist/data/current-market-references.json'));
const selected=h=>h.get('#approved-evidence').getAttribute('data-field');
const panel=h=>h.get('#approved-evidence');
const clickHistory=(h,key)=>h.get(`[data-evidence="history-${key}"]`).click();
const escape=h=>h.document.dispatchEvent({type:'keydown',key:'Escape',preventDefault(){}});

test('persistent history: Risk opens with real dated WACC components rather than an empty history summary',async()=>{
 const h=await startStudio();h.step(5);
 assert.equal(selected(h),'wacc');assert.equal(h.get('#guided-pane-inputs').hidden,false);
 assert.equal(panel(h).querySelectorAll('.history-components').length,1);
 const data=assumptionEvidence(history,'AAPL','wacc',{marketReferences:refs,cutoff:h.state().cutoff});
 assert.equal(data.series.length,0);assert.ok(data.components.length>0);
 for(const row of data.components){assert.ok(panel(h).textContent.includes(row.date));assert.ok(panel(h).innerHTML.includes(row.sourceUrl.replaceAll('&','&amp;')));}
 assert.match(panel(h).textContent,/not a reported historical company metric/);
 assert.equal(h.get('.workspace-editor').inert,false);assert.equal(h.get('.contextual-evidence-panel').hidden,true);
});

test('persistent history: every company and assumption group retains all available sourced rows/context',async()=>{
 const h=await startStudio(),defaults={0:'bridge',1:'normalizationDelta',2:'growth',3:'targetMargin',4:'salesCapital',5:'wacc',6:'otherClaims'};
 for(const c of h.library.companies){
  h.change('#current-company',c.ticker);
  for(const [step,field]of Object.entries(defaults)){
   h.step(+step);assert.equal(selected(h),field,c.ticker+' '+step);
   const draft=h.state(c.ticker),raw=c.snapshots.find(r=>r.id===draft.snapshotId),e=assumptionEvidence(history,c.ticker,field,{snapshot:currentSnapshot(c,raw),marketReferences:refs,cutoff:draft.cutoff});
   const rows=e.series.length+e.contextSeries.reduce((n,g)=>n+g.series.length,0);
   assert.equal(panel(h).querySelectorAll('.approved-history-row').length,rows,c.ticker+' '+field);
   assert.ok(panel(h).querySelector('[data-approved-history]'));assert.equal(h.get('.workspace-editor').inert,false);
  }
 }
});

test('persistent history: one-click WACC, stable growth, ROIC switches keep live inputs mounted and editable',async()=>{
 const h=await startStudio();h.step(5);const inputs=['wacc','terminalGrowth','terminalROIC'].map(k=>h.get('#g-'+k));
 for(const [field,value]of [['terminalROIC','24'],['wacc','11'],['terminalGrowth','3'],['terminalROIC','22']]){
  const button=h.get(`[data-evidence="history-${field}"]`);button.focus();button.click();
  assert.equal(selected(h),field);assert.equal(h.focus(),button);assert.equal(h.get('.contextual-evidence-panel').hidden,true);
  const input=h.get('#g-'+field);input.focus();h.input('#g-'+field,value);h.flush();
  assert.equal(selected(h),field);assert.equal(h.focus(),input);assert.equal(h.state().assumptions[field],+value/100);
  assert.match(panel(h).textContent,field==='terminalROIC'?/Historical average-return proxy/:field==='wacc'?/Your WACC: 11%/:/Your stable growth: 3%/);
  for(const node of inputs)assert.equal(h.get('#'+node.id),node);
 }
});

test('persistent history: keyboard focus follows tax and sliders, retaining selected field across render-result updates',async()=>{
 const h=await startStudio();h.step(3);const tax=h.get('#g-tax');tax.focus();assert.equal(selected(h),'tax');
 const list=panel(h).querySelector('.approved-history-list'),comparison=panel(h).querySelector('[data-approved-comparison]');
 h.input('#g-tax','27');assert.equal(selected(h),'tax');assert.equal(h.focus(),tax);assert.equal(panel(h).querySelector('.approved-history-list'),list);assert.equal(panel(h).querySelector('[data-approved-comparison]'),comparison);
 const text=comparison.textContent;h.input('#g-tax','28');assert.notEqual(comparison.textContent,text);assert.equal(h.focus(),tax);
 h.input('#g-tax','');assert.equal(selected(h),'tax');assert.equal(panel(h).querySelector('.approved-history-list'),list);assert.match(comparison.textContent,/incomplete/);
 h.input('#g-tax','27');const range=h.get('[data-slider="targetMargin"]');range.focus();assert.equal(selected(h),'targetMargin');h.input('[data-slider="targetMargin"]','31');assert.equal(h.focus(),range);
});

test('persistent history: full sources stay open during same-field edits and another assumption selects its history without Close',async()=>{
 const h=await startStudio();h.step(5);clickHistory(h,'terminalROIC');
 const source=h.get('[data-evidence-source="history-terminalROIC"]'),home=source.parentNode,button=h.get('[data-approved-history="terminalROIC"]');button.click();
 assert.equal(source.parentNode,h.get('.contextual-evidence-content'));assert.equal(h.get('.workspace-editor').inert,false);assert.equal(source.querySelector('.history-method').open,true);
 const input=h.get('#g-terminalROIC');input.focus();h.input('#g-terminalROIC','26');
 assert.equal(h.get('.contextual-evidence-panel').hidden,false);assert.equal(h.focus(),input);assert.equal(selected(h),'terminalROIC');assert.match(source.querySelector('[data-live-evidence-comparison]').textContent,/Historical average-return proxy/);
 h.get('#g-wacc').focus();assert.equal(selected(h),'wacc');assert.equal(h.get('.contextual-evidence-panel').hidden,true);assert.equal(source.parentNode,home);assert.equal(h.focus(),h.get('#g-wacc'));
});

test('persistent history: Why panels switch repeatedly with inputs accessible and Escape restores the latest invoker',async()=>{
 const h=await startStudio();h.step(5);
 for(const field of ['wacc','terminalGrowth','terminalROIC']){const b=h.get(`[data-evidence="why-${field}"]`);b.focus();b.click();assert.equal(h.get('.contextual-evidence-panel').hidden,false);assert.equal(h.get('.workspace-editor').inert,false);assert.equal(h.focus(),b);assert.equal(selected(h),field);}
 const last=h.get('[data-evidence="why-terminalROIC"]');escape(h);assert.equal(h.focus(),last);assert.equal(h.get('.contextual-evidence-panel').hidden,true);assert.equal(selected(h),'terminalROIC');
});

test('persistent history: selected context is remembered per group and normal tab/refresh actions never move focus',async()=>{
 const h=await startStudio();h.step(3);h.get('#g-tax').focus();h.step(5);clickHistory(h,'terminalROIC');h.step(3);assert.equal(selected(h),'tax');
 const tab=h.get('#group-3');tab.focus();tab.onkeydown({key:'ArrowRight',preventDefault(){}});assert.equal(h.focus(),h.get('#group-4'));assert.equal(selected(h),'salesCapital');
 h.step(5);assert.equal(selected(h),'terminalROIC');h.get('#guided-view-simulation').click();h.get('#guided-view-inputs').click();assert.equal(selected(h),'terminalROIC');
 const input=h.get('#g-terminalROIC');input.focus();for(const value of ['21','23','25'])h.input('#g-terminalROIC',value);h.flush();assert.equal(selected(h),'terminalROIC');assert.equal(h.focus(),input);
});

test('persistent history: changing company, source and cutoff replaces dated evidence without stale nodes or lost drafts',async()=>{
 const h=await startStudio();h.step(5);clickHistory(h,'terminalROIC');h.input('#g-terminalROIC','24');const old=panel(h).querySelector('.approved-history-row');
 h.change('#current-company','MSFT');h.step(5);assert.equal(selected(h),'wacc');assert.equal(old.isConnected,false);h.change('#current-company','AAPL');h.step(5);assert.equal(selected(h),'terminalROIC');assert.equal(h.get('#g-terminalROIC').value,'24');
 h.step(0);const identity=panel(h).getAttribute('data-identity');h.change('#g-cutoff','2020-01-01');assert.notEqual(panel(h).getAttribute('data-identity'),identity);h.step(5);assert.equal(selected(h),'terminalROIC');assert.match(panel(h).textContent,/Unavailable/);clickHistory(h,'wacc');assert.equal(panel(h).querySelector('.history-components'),null);
 const c=h.library.companies.find(c=>c.ticker==='AAPL'),alternate=c.snapshots.find(s=>s.id!==h.state().snapshotId);
 if(alternate){h.change('#current-snapshot',alternate.id);assert.match(panel(h).getAttribute('data-identity'),new RegExp(alternate.id));assert.equal(h.get('.contextual-evidence-panel').hidden,true);}
 const ids=h.app.descendants().map(n=>n.id).filter(Boolean);assert.equal(ids.length,new Set(ids).size);
});

test('persistent history: missing evidence stays explicit and no input/history node is cloned during repeated navigation',async()=>{
 const h=await startStudio({historyMissing:true}),input=h.get('#g-growth');
 for(let i=0;i<4;i++){clickHistory(h,'growth');h.step(5);clickHistory(h,'terminalROIC');h.step(2);assert.equal(h.get('#g-growth'),input);}
 assert.match(panel(h).textContent,/No sourced evidence/);assert.equal(panel(h).querySelectorAll('.approved-history-row').length,0);
 assert.equal(h.app.querySelectorAll('#approved-evidence').length,1);assert.equal(h.app.querySelectorAll('#guided-evidence').length,1);
});


test('persistent history: the selected ten-year record is open while related comparisons remain accessible on demand',async()=>{
 const h=await startStudio();h.step(5);clickHistory(h,'terminalROIC');
 const host=panel(h),related=host.querySelector('.approved-related-history'),primary=host.querySelector('.approved-history-list');
 assert.ok(related);assert.equal(related.open,false);assert.equal(related.getAttribute('open'),null);assert.match(related.querySelector('summary').textContent,/Related historical comparisons/);
 assert.equal(primary.querySelectorAll('.approved-history-row').length,10);assert.equal(related.contains(primary),false);
 assert.equal(related.querySelectorAll('.approved-history-row').length,20);assert.match(related.textContent,/Reported operating margin/);assert.match(related.textContent,/Sales \/ book-capital proxy/);
 related.open=true;const input=h.get('#g-terminalROIC');input.focus();h.input('#g-terminalROIC','25');assert.equal(host.querySelector('.approved-related-history'),related);assert.equal(related.open,true);assert.equal(h.focus(),input);
 clickHistory(h,'terminalGrowth');assert.equal(panel(h).querySelector('.approved-related-history'),null);assert.equal(panel(h).querySelector('.approved-history-list').querySelectorAll('.approved-history-row').length,10);assert.match(panel(h).textContent,/Annual revenue growth, not perpetual growth/);
 clickHistory(h,'wacc');assert.ok(panel(h).querySelector('.history-components'));assert.equal(panel(h).querySelector('.approved-related-history'),null);
});
