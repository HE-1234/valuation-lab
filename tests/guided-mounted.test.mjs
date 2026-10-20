import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {mountReviewedGuided,REVIEW_STEPS} from '../dist/guided-reviewed.js';
import {incrementalPackages,incrementalRecords} from '../dist/incremental-registry.js';
import {calculateResearchOperating} from '../dist/research-model.js';
const catalogBundle=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const visible=node=>!!node&&!node.hidden&&(!node.parentElement||visible(node.parentElement));
async function mounted(){
 const storage=new Map(),annual=await startResearchWorkspace({storage,catalogBundle,incrementalBundle:incrementalPackages});
 const legacy=await startStudio({storage,annualWorkspace:annual.root});
 const document=annual.document,body=document.createElement('body'),page=document.createElement('section'),home=document.createElement('section');
 document.root=body;document.body=body;body.dataset.workspacePage='current';page.id='current';home.id='renewed';
 body.append(page,home);page.appendChild(legacy.app);home.appendChild(annual.root);annual.root.id='renewed-research-app';annual.root.workspace=annual;
 const controller=mountReviewedGuided({document,window:legacy.window,storage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 assert.ok(controller,'real presentation must mount');
 const activate=pageName=>{body.dataset.workspacePage=pageName;legacy.window.dispatchEvent(new legacy.CustomEvent('valuation:page-activate',{detail:{page:pageName}}));};
 return {annual,legacy,document,controller,activate,close(){controller.destroy();annual.destroy();},get:s=>document.querySelector(s)};
}
test('supported legacy harness dispatches real ready/render events and preserves listener semantics',async()=>{
 const h=await startStudio();assert.ok(h.get('#current-company'));
 let render=0;const listener=()=>render++;h.window.addEventListener('valuation:guided-render',listener,{once:true});
 h.app.chooseCompany('MSFT');h.app.chooseCompany('AAPL');assert.equal(render,1);
 const event=new h.CustomEvent('cancelable',{detail:{company:'AAPL'},cancelable:true});
 h.window.addEventListener('cancelable',e=>e.preventDefault());assert.equal(h.window.dispatchEvent(event),false);assert.equal(event.detail.company,'AAPL');
});
test('actual JSON import updates directory and survives Year-by-year to Guided without falling back',async()=>{
 const h=await mounted();h.controller.choose('AAPL');
 const imported=structuredClone(h.legacy.library.companies.find(c=>c.ticker==='AAPL'));imported.ticker='QAIMPORT';imported.name='Distinct imported company';
 const file=h.get('#current-import-file');assert.ok(file,'actual import control');file.files=[{size:10000,text:async()=>JSON.stringify(imported)}];await file.onchange({target:file});assert.match(h.get('#current-import-status').textContent,/Imported on this device/);
 assert.equal(h.get('#current-company').value,'QAIMPORT');assert.equal(h.controller.getSelection(),'QAIMPORT');assert.equal(h.get('#guided-company-directory').value,'QAIMPORT');
 assert.match(h.get('#guided-company-directory').textContent,/Distinct imported company/);
 h.activate('renewed');h.activate('current');
 assert.equal(h.controller.getSelection(),'QAIMPORT');assert.equal(h.get('#current-company').value,'QAIMPORT');assert.equal(h.legacy.app.hidden,false);assert.equal(h.get('#guided-reviewed-host').hidden,true);
 h.controller.choose('UBER');h.controller.choose('QAIMPORT');assert.equal(h.get('#current-company').value,'QAIMPORT');h.close();
});
test('import replacing a reviewed ticker uses the imported Guided company, not annual assumptions',async()=>{
 const h=await mounted();const imported=structuredClone(h.legacy.library.companies[0]);imported.ticker='UBER';imported.name='User imported Uber';
 const file=h.get('#current-import-file');file.files=[{size:10000,text:async()=>JSON.stringify(imported)}];await file.onchange({target:file});assert.match(h.get('#current-import-status').textContent,/Imported on this device/);
 h.controller.choose('UBER');assert.equal(h.get('#guided-company-directory').value,'UBER');assert.equal(h.legacy.app.hidden,false);assert.equal(h.get('#guided-reviewed-host').hidden,true);h.close();
});
test('NVMI conditional action moves the mounted Guided presentation to visible Equity before focus',async()=>{
 const h=await mounted();h.controller.choose('NVMI');assert.equal(h.annual.root.dataset.guidedStep,'story');
 h.annual.action('open-analyst-allocation');
 assert.equal(h.annual.root.dataset.guidedStep,'equity');assert.ok(visible(h.get('#annual-editor-panel-claims')));assert.ok(visible(h.annual.focus()));assert.equal(h.annual.focus().tag,'input');
 h.annual.action('undo-edit');h.close();
});
test('Review forecast explicitly selects mobile results and focuses the visible results tab',async()=>{
 const h=await mounted();h.controller.choose('NFLX');h.get('#guided-reviewed-equity').click();
 assert.equal(h.annual.get('.screen-workspace').dataset.mobileView,'inputs');h.get('[data-review-next]').click();
 assert.equal(h.annual.get('.screen-workspace').dataset.mobileView,'result');assert.equal(h.annual.focus().id,'annual-view-result');assert.ok(visible(h.get('#annual-path-result')));h.close();
});
test('every reviewed model mounts all six real steps without changing financial inputs',async()=>{
 const h=await mounted();
 for(const r of incrementalRecords){
  h.controller.choose(r.identity.ticker);const before=h.annual.getState().draft,ev=calculateResearchOperating(before).enterprise,writes=h.annual.writes.length;
  for(const step of REVIEW_STEPS){h.get('#guided-reviewed-'+step.id).click();assert.equal(h.annual.root.dataset.guidedStep,step.id);assert.ok(visible(h.get('#annual-editor-panel-'+step.panels[0])));}
  assert.deepEqual(h.annual.getState().draft,before);assert.equal(calculateResearchOperating(h.annual.getState().draft).enterprise,ev);assert.equal(h.annual.writes.length,writes);
 }
 h.close();
});
