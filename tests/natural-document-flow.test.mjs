// Source/cascade declarations and synthetic DOM contracts. These do not establish
// browser scroll geometry, painted animation, native focus, or assistive technology.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareFlowTables,growTextarea,mountDocumentFlow} from '../dist/document-flow.js';
import {startResearchWorkspace,minimalDocument} from './research-workspace-harness.mjs';
import {startStudio} from './v7-runtime-harness.mjs';
const read=name=>fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');

test('natural flow: no shipped application stylesheet declares a subsection scroller or hides its scrollbar',()=>{
 for(const name of ['style.css','studio.css','workspace.css','research.css','screen-workspace.css','simulation.css','learn.css']){
  const css=read(name);
  assert.doesNotMatch(css,/overflow(?:-[xy])?\s*:\s*(?:auto|scroll)|scrollbar-width\s*:\s*none|::-webkit-scrollbar|scrollbar-gutter\s*:\s*stable/,name);
  assert.doesNotMatch(css,/body\s*\{[^}]*overflow(?:-[xy])?\s*:\s*(?:clip|hidden)/,name);
 }
});
test('natural flow: desktop, short-window, narrow and mobile rules retain content in the document',()=>{
 const css=read('screen-workspace.css');
 assert.doesNotMatch(css,/(?:[;{])height:calc\(100dvh|(?:[;{])max-height:(?:60|80|110|115|160|170|190|210|570|600|620|700|750|850)px/);
 assert.match(css,/\.screen-workspace\{height:auto;min-height:0/);
 assert.match(css,/\.workspace-summary,\.annual-workspace \.workspace-summary\{height:auto;min-height:0;max-height:none;overflow:visible/);
 assert.match(css,/@media\(max-width:1050px\),\(max-height:620px\)/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.page \.research-schedule>\.research-table-scroll\{overflow:visible;max-height:none/);
 assert.match(css,/\.contextual-evidence-panel,\.annual-workspace \.contextual-evidence-panel\{position:static/);
 assert.match(css,/\.screen-workspace\[data-evidence-open=true\] \.workspace-main\{grid-template-columns:minmax\(0,1fr\) var\(--workspace-editor\)/);
});
test('natural flow: table enhancement preserves native rows, headers, exact values and input identity',()=>{
 const document=minimalDocument(),root=document.root;
 root.innerHTML='<table><caption>Annual path</caption><thead><tr><th scope="col">Year</th><th scope="col">Revenue</th><th scope="col">Tax rate</th></tr></thead><tbody><tr><th scope="row">Year 1</th><td><input value="12.123456789"></td><td>21%</td></tr></tbody></table>';
 const table=root.querySelector('table'),input=root.querySelector('input'),row=root.querySelector('tbody').children[0],headers=[...table.querySelectorAll('th')];
 input.focus();prepareFlowTables(root);prepareFlowTables(root);
 assert.equal(root.querySelector('table'),table);assert.equal(root.querySelector('input'),input);assert.equal(input.value,'12.123456789');assert.equal(document.activeElement,input);
 assert.equal(table.getAttribute('role'),'table');assert.equal(row.getAttribute('role'),'row');assert.deepEqual([...table.querySelectorAll('th')],headers);
 assert.equal(headers[0].getAttribute('role'),'columnheader');assert.equal(headers.at(-1).getAttribute('role'),'rowheader');assert.equal(headers.at(-1).getAttribute('scope'),'row');
 assert.deepEqual(row.querySelectorAll('td').map(cell=>cell.getAttribute('data-column-label')),['Revenue','Tax rate']);assert.equal(table.className,'flow-table');
});
test('natural flow: actual annual schedule and evidence have labels without replacing any exact editor',async()=>{
 const h=await startResearchWorkspace();
 const inputs=[...h.root.querySelectorAll('[data-research-input="annual"]')],schedule=h.get('#annual-schedule-view');
 assert.ok(schedule.querySelector('table').className.includes('flow-table'));
 for(const cell of schedule.querySelectorAll('td'))assert.ok(cell.getAttribute('data-column-label'));
 h.get('[data-annual-view="schedule"]').click();h.get('[data-annual-view="result"]').click();h.get('[data-annual-evidence="calculations"]').click();
 assert.equal(h.get('#annual-evidence-host').parentElement,h.get('.workspace-main'));assert.equal(h.get('.screen-workspace').dataset.evidenceOpen,'true');
 for(const cell of h.get('.contextual-evidence-content').querySelectorAll('td'))assert.ok(cell.getAttribute('data-column-label'));
 h.get('.contextual-evidence-close').click();assert.equal(h.get('.screen-workspace').dataset.evidenceOpen,'false');assert.deepEqual(h.root.querySelectorAll('[data-research-input="annual"]'),inputs);h.destroy();
});
test('natural flow: Guided evidence occupies the document grid and exact inputs survive repeated open and close',async()=>{
 const h=await startStudio(),input=h.get('#g-growth'),host=h.get('.workspace-evidence-host');
 assert.equal(host.parentElement,h.get('.workspace-main'));
 for(let i=0;i<3;i++){h.get('[data-evidence="why-growth"]').click();assert.equal(h.get('.screen-workspace').dataset.evidenceOpen,'true');h.get('.contextual-evidence-close').click();assert.equal(h.get('#g-growth'),input);assert.equal(h.get('.workspace-editor').inert,false);}
});
test('natural flow: mobile row groups and evidence rows use the same labeled cells and retain readable input width',()=>{
 const css=read('screen-workspace.css');assert.match(css,/@media\(max-width:1000px\)\{\.page table.flow-table/);
 assert.match(css,/content:attr\(data-column-label\)/);assert.match(css,/\.contextual-evidence-content table.flow-table tbody>tr\{display:grid/);
 assert.match(css,/\.page table input,\.page \.research-table input\{width:100%;min-width:0;max-width:100%/);
 assert.doesNotMatch(css,/\.flow-table[^{}]*\{[^}]*overflow(?:-[xy])?:(?:auto|scroll|hidden)/);
});
test('natural flow: growing a notes textarea does not replace or rewrite its text',()=>{
 const field={tagName:'TEXTAREA',style:{height:'40px'},scrollHeight:240,value:'Exact unfinished note'};growTextarea(field);assert.equal(field.style.height,'242px');assert.equal(field.value,'Exact unfinished note');
 field.scrollHeight=500;growTextarea(field);assert.equal(field.style.height,'502px');assert.doesNotThrow(()=>growTextarea(null));
});
test('natural flow: the document observer handles dynamic tables and releases its input listener',()=>{
 const document=minimalDocument();document.root.innerHTML='<main><textarea>Notes</textarea></main>';const main=document.root.querySelector('main'),observers=[];
 document.defaultView={MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(root,options){this.root=root;this.options=options;}disconnect(){this.disconnected=true;}}};
 const release=mountDocumentFlow(document);assert.equal(observers[0].root,main);assert.deepEqual(observers[0].options,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','data-mobile-view','data-view']});
 main.innerHTML='<table><thead><tr><th>Year</th><th>Value</th></tr></thead><tbody><tr><th scope="row">1</th><td>12</td></tr></tbody></table>';observers[0].callback();assert.equal(main.querySelector('td').getAttribute('data-column-label'),'Value');
 release();assert.equal(observers[0].disconnected,true);assert.equal(main.events.get('input').size,0);
});

test('natural flow: saved notes expand when revealed, focused or resized without altering text',()=>{
 const document=minimalDocument();document.root.innerHTML='<main><section hidden><textarea>Saved long reasoning</textarea></section></main>';
 const main=document.root.querySelector('main'),section=main.querySelector('section'),field=main.querySelector('textarea'),events=new Map(),observers=[];
 field.style={};field.scrollHeight=0;
 document.defaultView={addEventListener:(name,handler)=>events.set(name,handler),removeEventListener:name=>events.delete(name),MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}}};
 const release=mountDocumentFlow(document);assert.equal(field.style.height,'auto');
 section.hidden=false;field.scrollHeight=300;observers[0].callback([{type:'attributes',target:section,attributeName:'hidden'}]);assert.equal(field.style.height,'302px');
 field.scrollHeight=400;main.dispatch('focusin',{target:field});assert.equal(field.style.height,'402px');
 field.scrollHeight=500;events.get('resize')();assert.equal(field.style.height,'502px');assert.equal(field.value,'Saved long reasoning');
 release();assert.equal(events.has('resize'),false);assert.equal(main.events.get('focusin').size,0);
});
