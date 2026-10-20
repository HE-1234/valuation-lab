import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {mountReviewedGuided,REVIEW_STEPS} from '../dist/guided-reviewed.js';
import {incrementalPackages} from '../dist/incremental-registry.js';
import {calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {withTsmDatedConversion} from '../dist/tsm-dated-conversion.js';
import {setLocale} from '../dist/i18n.js';
import {TSM_RECEIPT_REVIEW,applyTsmReceiptCorrection} from '../dist/tsm-receipt-correction.js';
import {RESEARCH_STORAGE_PREFIX} from '../dist/research-model.js';
import {currentResearchDraft} from '../dist/current-research-defaults.js';
const catalogBundle=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
async function mounted(){
 const storage=new Map(),annual=await startResearchWorkspace({storage,catalogBundle,incrementalBundle:incrementalPackages});
 const legacy=await startStudio({storage,annualWorkspace:annual.root});
 const document=annual.document,body=document.createElement('body'),page=document.createElement('section'),home=document.createElement('section');
 document.root=body;document.body=body;body.dataset.workspacePage='current';page.id='current';home.id='renewed';
 body.append(page,home);page.appendChild(legacy.app);home.appendChild(annual.root);annual.root.id='renewed-research-app';annual.root.workspace=annual;
 const controller=mountReviewedGuided({document,window:legacy.window,storage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 const activate=pageName=>{body.dataset.workspacePage=pageName;legacy.window.dispatchEvent(new legacy.CustomEvent('valuation:page-activate',{detail:{page:pageName}}));};
 return {annual,legacy,document,controller,activate,close(){controller.destroy();annual.destroy();},get:s=>document.querySelector(s)};
}
test('case actions update common selection for annual and original companies across repeated view switches',async()=>{
 const h=await mounted();
 for(const ticker of ['NFLX','AAPL']){
  h.controller.choose('UBER');h.get('[data-review-step="equity"]').click();h.annual.choose(ticker);
  assert.equal(h.controller.getSelection(),ticker);assert.equal(h.get('#guided-company-directory').value,ticker);
  for(let i=0;i<3;i++){h.activate('renewed');h.activate('current');assert.equal(h.controller.getSelection(),ticker);}
  if(ticker==='AAPL')assert.equal(h.get('#current-company').value,ticker);
  else {assert.equal(h.annual.getState().company.ticker,ticker);assert.equal(h.annual.root.getAttribute('data-guided-step'),'story');assert.equal(h.get('[data-review-step="story"]').getAttribute('aria-selected'),'true');}
 }
 h.close();
});
test('TSM fresh default corrects the FY2025 source column; operating inputs and archived preset remain exact',async()=>{
 const bundle=JSON.parse(fs.readFileSync(new URL('../dist/data/studio-research-presets-2026-10-17-v1.json',import.meta.url))),preset=bundle.presets.find(p=>p.ticker==='TSM');
 assert.equal(preset.bridgeInputs.customerReceiptClaim,291101.8);
 const source=currentResearchDraft(preset,bundle),w=await startResearchWorkspace();w.choose('TSM');const d=w.getState().draft;
 assert.equal(d.bridgeInputs.customerReceiptClaim,189858.2);assert.deepEqual(d.tsmReceiptReview,TSM_RECEIPT_REVIEW);
 assert.deepEqual(d.annual,source.annual);assert.deepEqual(d.terminal,source.terminal);assert.deepEqual(d.timing,source.timing);
 const timing=researchTimingResult(d,calculateResearchOperating(d));
 const bridge=calculateResearchBridge(d,timing.enterprise,{...d.bridgeInputs,calculationDate:timing.date});
 const oldBridge=calculateResearchBridge(source,timing.enterprise,{...source.bridgeInputs,calculationDate:timing.date});
 assert.ok(Math.abs(bridge.equity-oldBridge.equity-101243.6)<1e-6);
 const row=bridge.rows.find(r=>r.id==='customerReceiptClaim');assert.equal(row.amount,189858.2);assert.equal(row.referenceDate,'2025-12-31');assert.equal(row.sourceUrl,TSM_RECEIPT_REVIEW.sourceUrl);
 assert.match(w.root.textContent,/189,858.2/);assert.match(w.root.textContent,/FY2024/);setLocale('zh-Hans');assert.match(w.get('[data-tsm-receipt-review]').textContent,/来源更正/);setLocale('en');assert.ok(!bridge.warnings.some(x=>x.includes('291,101.8 are explicit FY2025')));
 w.action('load');assert.deepEqual(w.getState().draft.tsmReceiptReview,TSM_RECEIPT_REVIEW);assert.equal(w.getState().draft.bridgeInputs.customerReceiptClaim,189858.2);
 w.destroy();
});
test('TSM saved defaults and custom inputs survive reopen; explicit reload corrects and Undo restores exactly',async()=>{
 const bundle=JSON.parse(fs.readFileSync(new URL('../dist/data/studio-research-presets-2026-10-17-v1.json',import.meta.url))),preset=bundle.presets.find(p=>p.ticker==='TSM');
 for(const amount of [291101.8,123456.789]){
  const saved=currentResearchDraft(preset,bundle);saved.bridgeInputs.customerReceiptClaim=amount;saved.notes='Retain my reasoning';
  const storage=new Map([[RESEARCH_STORAGE_PREFIX+'TSM',JSON.stringify(saved)],[RESEARCH_STORAGE_PREFIX+'preset-undo:TSM',JSON.stringify({schemaVersion:1,ticker:'TSM',draft:saved,raw:null,error:null,navigation:null})]]),w=await startResearchWorkspace({storage});w.choose('TSM');
  assert.deepEqual(w.getState().draft,saved);assert.equal(w.get('[data-research-action="undo"]').disabled,false);assert.match(w.root.textContent,/Your saved amount is retained/);
  w.useResearch('TSM');assert.equal(w.getState().draft.bridgeInputs.customerReceiptClaim,189858.2);assert.equal(w.getState().draft.notes,saved.notes);
  w.action('undo');assert.deepEqual(w.getState().draft,saved);w.destroy();
 }
 const bad=applyTsmReceiptCorrection(currentResearchDraft(preset,bundle));bad.tsmReceiptReview.amount=1;
 assert.throws(()=>calculateResearchBridge(bad,1,{...bad.bridgeInputs,calculationDate:'2026-09-30'}),/incompatible identity/);
});
test('allocation prompt disappears only after a valid explicit policy and returns on Undo',async()=>{
 const h=await mounted();
 for(const ticker of ['UBER','MCD','NFLX']){
  h.controller.choose(ticker);assert.ok(h.get('.guided-allocation-prompt'));
  h.annual.get(ticker==='MCD'?'[data-mcd-example="0"]':`[data-${ticker.toLowerCase()}-example]`).click();
  assert.equal(h.get('.guided-allocation-prompt'),null,ticker);
  h.annual.action('undo-edit');assert.ok(h.get('.guided-allocation-prompt'));
 }
 h.close();
});

test('allocation banner updates after an individual policy input becomes incomplete and after Undo',async()=>{
 const h=await mounted();h.controller.choose('UBER');h.annual.get('[data-uber-example]').click();assert.equal(h.get('.guided-allocation-prompt'),null);
 const input=h.annual.get('[data-uber-policy]');input.onfocus();input.value='';input.oninput();assert.ok(h.get('.guided-allocation-prompt'));
 h.annual.action('undo-edit');assert.equal(h.get('.guided-allocation-prompt'),null);h.close();
});

test('TSM missing preset package uses the corrected fresh fallback and retains saved custom fallback drafts',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({presetsMissing:true,storage});w.choose('TSM');const d=w.getState().draft;
 assert.equal(d.researchPreset,undefined);assert.equal(d.bridgeInputs.customerReceiptClaim,189858.2);assert.deepEqual(d.tsmReceiptReview,TSM_RECEIPT_REVIEW);
 const timing=researchTimingResult(d,calculateResearchOperating(d)),b=calculateResearchBridge(d,timing.enterprise,{...d.bridgeInputs,calculationDate:timing.date});
 assert.equal(b.rows.find(x=>x.id==='customerReceiptClaim').amount,189858.2);assert.ok(Number.isFinite(b.perShare));assert.equal(Number(w.get('[data-research-input="bridge"][data-field="customerReceiptClaim"]').value.replace(/,/g,'')),189858.2);
 const saved=structuredClone(d);delete saved.tsmReceiptReview;saved.bridgeInputs.customerReceiptClaim=123456.789;storage.set(RESEARCH_STORAGE_PREFIX+'TSM',JSON.stringify(saved));w.destroy();
 const again=await startResearchWorkspace({presetsMissing:true,storage});again.choose('TSM');assert.deepEqual(again.getState().draft,saved);again.destroy();
});
test('complete nonpositive allocations explain withholding without requesting a missing policy',async()=>{
 const h=await mounted();
 for(const [ticker,key]of [['UBER','additional_other_claim'],['MCD','other_noncommon_claims']]){
  h.controller.choose(ticker);h.annual.get(ticker==='MCD'?'[data-mcd-example="0"]':'[data-uber-example]').click();
  const input=h.annual.get(`[data-${ticker.toLowerCase()}-policy="${key}"]`);input.onfocus();input.value='1000000000';input.oninput();
  assert.equal(h.get('.guided-allocation-prompt'),null);assert.match(h.get('.guided-allocation-status').textContent,/assumptions are complete/);
  const d=h.annual.getState().draft,t=researchTimingResult(d,calculateResearchOperating(d)),b=calculateResearchBridge(d,t.enterprise,{...d.bridgeInputs,calculationDate:t.date});assert.equal(b.perShare,null);
  setLocale('zh-Hans');assert.match(h.get('.guided-allocation-status').textContent,/假设完整/);setLocale('en');
  h.annual.action('undo-edit');assert.equal(h.get('.guided-allocation-status'),null);assert.equal(h.get('.guided-allocation-prompt'),null);
 }
 h.close();
});
