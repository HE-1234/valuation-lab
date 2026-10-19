// Shipped handlers under a synthetic DOM; not native keyboard/browser proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {setLocale} from '../dist/i18n.js';
import {annualLabel,annualSetText} from '../dist/annual-localization.js';
const field='#annual-marginal-sales-capital';
const error='Enter a positive marginal sales / capital assumption; the previous case is retained.';
function edit(h,text){h.input(field,text);h.change(field,text);}
for(const locale of ['en','zh-Hans']){
 test(`capital recovery (${locale}): repeated invalid-to-same repairs preserve exact state, export, Undo and simulation`,async()=>{
  setLocale(locale);let mounts=0,cleanups=0;
  const h=await startResearchWorkspace({simulationMount(){mounts++;return ()=>cleanups++;}});
  try{
   const original=h.getState().draft;h.change('#annual-growth-horizon','15');
   const prior=h.getState().draft,exact=String(prior.derivedForecast.marginalSalesCapital),control=h.get(field),status=h.get('#research-action-status');
   assert.equal(exact,'0.7621951219512196');
   h.action('export');const exported=h.downloads.at(-1).value;
   const writes=h.writes.length,saved=[...h.storage],renders=h.root.innerHTMLWrites,mounted=mounts,cleaned=cleanups;
   for(const invalid of ['0','-1','','nonsense','0']){
    control.focus();control.onfocus();edit(h,invalid);
    assert.equal(control.getAttribute('aria-invalid'),'true');assert.equal(status.textContent,annualLabel(error));
    assert.equal(control.value,invalid);assert.deepEqual(h.getState().draft,prior);
    edit(h,exact);
    assert.notEqual(control.getAttribute('aria-invalid'),'true');assert.equal(status.textContent,'');
    assert.strictEqual(h.get(field),control);assert.strictEqual(h.focus(),control);assert.equal(control.value,exact);
    for(let i=0;i<2;i++){control.onblur();assert.equal(control.value,'0.76');control.onfocus();assert.equal(control.value,exact);}
    assert.deepEqual(h.getState().draft,prior);assert.deepEqual([...h.storage],saved);assert.equal(h.writes.length,writes);
    assert.equal(h.root.innerHTMLWrites,renders);assert.equal(mounts,mounted);assert.equal(cleanups,cleaned);
   }
   // A subsequent language switch must not revive a disposed correction binding.
   setLocale(locale==='en'?'zh-Hans':'en');assert.equal(status.textContent,'');setLocale(locale);
   h.action('export');const repairedExport=h.downloads.at(-1).value;
   // Export invocation has its own wall-clock stamp; model timestamps stay exact.
   delete exported.exportedAt;delete repairedExport.exportedAt;assert.deepEqual(repairedExport,exported);
   h.action('undo-edit');assert.deepEqual(h.getState().draft,original);
  }finally{h.destroy();setLocale('en');}
 });
 test(`capital recovery (${locale}): preserve unrelated status and accept a different valid ratio`,async()=>{
  setLocale(locale);const h=await startResearchWorkspace();
  try{
   h.change('#annual-growth-horizon','15');const prior=h.getState().draft,exact=String(prior.derivedForecast.marginalSalesCapital);
   edit(h,'0');const status=h.get('#research-action-status');annualSetText(status,'Unrelated status stays visible');
   edit(h,exact);assert.equal(status.textContent,'Unrelated status stays visible');assert.notEqual(h.get(field).getAttribute('aria-invalid'),'true');
   edit(h,'-2');edit(h,'2.123456789012345');
   assert.equal(h.getState().draft.derivedForecast.marginalSalesCapital,2.123456789012345);
   assert.notEqual(h.get(field).getAttribute('aria-invalid'),'true');assert.notEqual(h.get('#research-action-status').textContent,annualLabel(error));
   assert.strictEqual(h.focus(),h.get(field));h.action('undo-edit');assert.deepEqual(h.getState().draft,prior);
  }finally{h.destroy();setLocale('en');}
 });
}
