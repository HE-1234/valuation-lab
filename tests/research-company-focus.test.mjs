// Shipped handlers in a minimal DOM; no native select-popup or AT behavior claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
import {RESEARCH_STORAGE_PREFIX,researchDraftFor} from '../dist/research-model.js';
import selectedGoogleCase from '../dist/goog-selected-scenario-data.js';

const key=ticker=>RESEARCH_STORAGE_PREFIX+ticker;
const withoutSaveTime=draft=>{const copy=structuredClone(draft);delete copy.updatedAt;return copy;};
function recordFocus(h,run){
 const prototype=Object.getPrototypeOf(h.root),original=prototype.focus,calls=[];
 prototype.focus=function(options){calls.push({node:this,options});return original.call(this,options);};
 try{run();}finally{prototype.focus=original;}
 return calls;
}
function selectAndCheckFocus(h,ticker){
 const previous=h.get('#research-company');previous.focus();
 const calls=recordFocus(h,()=>h.select(ticker)),current=h.get('#research-company');
 assert.notEqual(current,previous,'selection rebuilds the selector');
 assert.equal(previous.isConnected,false);
 assert.equal(h.focus(),current,ticker+': retain the same logical control');
 assert.ok(current.isConnected);
 assert.equal(calls.length,1,'no intermediate focus jump');
 assert.equal(calls[0].node,current);assert.deepEqual(calls[0].options,{preventScroll:true});
 assert.equal(current.value,ticker);assert.equal(h.getState().company.ticker,ticker);
 assert.ok(h.root.querySelectorAll('label').some(label=>label.getAttribute('for')==='research-company'));
}

test('research company focus: every reviewed company retains the initiating selector on repeated changes',async()=>{
 const h=await startResearchWorkspace(),tickers=h.library.companies.map(c=>c.ticker);
 assert.equal(h.focus(),null,'mount does not force initial focus');
 for(const ticker of [...tickers,...tickers.toReversed()]){
  selectAndCheckFocus(h,ticker);
  const company=h.getState().company,draft=h.getState().draft;
  assert.deepEqual(draft.annual,ticker==='GOOG'?selectedGoogleCase.draft.annual:researchDraftFor(company).annual);
  assert.equal(h.getState().identityError,null);assert.ok(h.get('.research-big-value'));
 }
});

test('research company focus: unreadable and unsupported saved drafts keep their exact bytes and a usable selector',async()=>{
 const invalid=researchDraftFor(bundledResearch().companies.find(c=>c.ticker==='AAPL'));invalid.annual[0].revenue=null;
 for(const raw of ['{not valid JSON','42','null','[1,2,3]',JSON.stringify({...invalid,caseId:'different-case'}),JSON.stringify(invalid)]){
  const h=await startResearchWorkspace({storage:new Map([[key('AAPL'),raw]])});
  selectAndCheckFocus(h,'MSFT');selectAndCheckFocus(h,'AAPL');
  assert.ok(h.getState().identityError);assert.equal(h.get('.research-big-value'),null);
  assert.equal(h.storage.get(key('AAPL')),raw,'focus repair must not rewrite recovery data');
  h.action('export');assert.equal(h.storage.get(key('AAPL')),raw);assert.equal(h.downloads.length,1);
  h.action('load');assert.equal(h.getState().identityError,null);h.action('undo');
  assert.ok(h.getState().identityError);assert.equal(h.storage.get(key('AAPL')),raw);
  selectAndCheckFocus(h,'AAPL');assert.equal(h.storage.get(key('AAPL')),raw);
 }
});

test('research company focus: edited assumptions, explicit blanks, notes, and Undo survive switching and reload',async()=>{
 const h=await startResearchWorkspace();
 h.input(h.field('annual','revenue',0),'567890');h.input(h.field('terminal','margin'),'33');
 h.input(h.field('bridge','additionalClaimAllowance'),'4321');h.input('#research-notes','Keep my thesis');
 h.change('#research-timing-mode','as-of-scenario');h.input(h.field('timing','stubFCFF'),'100');
 h.input('#research-stub-reason','Explicit elapsed FCFF estimate');
 const prior=withoutSaveTime(h.getState().draft);
 h.action('load');const loaded=withoutSaveTime(h.getState().draft);
 selectAndCheckFocus(h,'LITE');h.input(h.field('bridge','convertiblePremiumClaim'),'');h.input('#research-notes','Keep this claim unknown');
 const lite=withoutSaveTime(h.getState().draft);
 selectAndCheckFocus(h,'AAPL');assert.deepEqual(withoutSaveTime(h.getState().draft),loaded);
 h.action('undo');assert.deepEqual(withoutSaveTime(h.getState().draft),prior);
 selectAndCheckFocus(h,'LITE');assert.deepEqual(withoutSaveTime(h.getState().draft),lite);assert.equal(h.get('.research-equity-value'),null);
 const again=await startResearchWorkspace({storage:h.storage});assert.equal(again.focus(),null);assert.deepEqual(withoutSaveTime(again.getState().draft),lite);
 selectAndCheckFocus(again,'AAPL');assert.deepEqual(withoutSaveTime(again.getState().draft),prior);
});

test('research company focus: live edits and non-selector renders never acquire new selector focus',async()=>{
 const h=await startResearchWorkspace(),field=h.field('annual','revenue',0),input=h.get(field);input.focus();
 const editCalls=recordFocus(h,()=>{h.input(field,'');h.input(field,'567890');});
 assert.equal(editCalls.length,0);assert.equal(h.focus(),input);assert.equal(h.get(field),input);
 const notes=h.get('#research-notes');notes.focus();
 assert.equal(recordFocus(h,()=>h.input('#research-notes','Do not move focus')).length,0);assert.equal(h.focus(),notes);
 for(const action of ['load','undo','normalize','undo'])assert.equal(recordFocus(h,()=>h.action(action)).length,0,action);
 assert.equal(recordFocus(h,()=>h.choose('GOOG')).length,0,'programmatic choose does not force focus');
 assert.equal(recordFocus(h,()=>h.get('[data-research-company="MSFT"]').click()).length,0,'overview retains its existing navigation behavior');
});

test('research company focus: storage failures keep the selector and session-only draft usable',async()=>{
 const h=await startResearchWorkspace({storageBlocked:true});h.input(h.field('annual','revenue',0),'567890');
 selectAndCheckFocus(h,'TSM');selectAndCheckFocus(h,'AAOI');selectAndCheckFocus(h,'AAPL');
 assert.equal(h.getState().draft.annual[0].revenue,567890);assert.equal(h.storage.size,0);
 assert.match(h.get('#research-save-state').textContent,/Storage unavailable.*export before leaving/);
 h.action('export');assert.equal(h.downloads[0].value.draft.annual[0].revenue,567890);
});
