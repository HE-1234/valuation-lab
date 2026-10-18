import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateResearch,simulationResearchDefaults} from '../dist/research-simulation.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {marginPhaseControlsHTML,marginPathChartHTML} from '../dist/margin-path-view.js';
const unstamped=d=>{const x=structuredClone(d);delete x.updatedAt;return x;};
test('annual margin UI enables without checkbox, retains disabled explicit rows, and full Undo restores prior draft',async()=>{
 const h=await startResearchWorkspace();h.input('#research-notes','Exact prior notes');const prior=h.getState().draft;
 assert.equal(h.get('#annual-margin-mode').value,'existing');h.change('#annual-margin-mode','phased');let d=h.getState().draft;
 assert.equal(d.marginPath.enabled,true);assert.equal(h.focus(),h.get('#annual-margin-mode'));assert.equal(h.root.querySelectorAll('[data-margin-prefix="annual"]').length,5);
 h.change('#annual-margin-interimMargin','42.123456789');d=h.getState().draft;assert.equal(d.marginPath.interimMargin,42.123456789/100);
 const active=structuredClone(d);h.change('#annual-margin-mode','existing');assert.equal(h.getState().draft.marginPath.enabled,false);assert.deepEqual(h.getState().draft.annual,active.annual);assert.match(h.get('#research-action-status').textContent,/keeps the current explicit rows/);
 h.action('undo-edit');assert.deepEqual(h.getState().draft,active);
 const fresh=await startResearchWorkspace();const initial=fresh.getState().draft;fresh.change('#annual-margin-mode','phased');fresh.action('undo-edit');assert.deepEqual(fresh.getState().draft,initial);
 assert.equal(prior.notes,'Exact prior notes');
});
test('annual direct terminal-margin edit reapplies the enabled path, manual row edits are flagged, and precision survives reload',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-margin-mode','phased');h.input(h.field('terminal','margin'),'17.123456789');let d=h.getState().draft;
 assert.equal(d.marginPath.terminalMargin,17.123456789/100);assert.equal(d.annual.at(-1).margin,d.terminal.margin);
 h.input('[data-year-field="margin"]','22.987654321');d=h.getState().draft;assert.equal(d.annual[0].margin,22.987654321/100);assert.match(h.get('#annual-margin-overrides').textContent,/overrides in years 1/);
 const restored=await startResearchWorkspace({storage:h.storage});assert.deepEqual(unstamped(restored.getState().draft),unstamped(d));assert.match(restored.get('#annual-margin-overrides').textContent,/overrides in years 1/);
});
test('annual invalid phase ordering retains model and correction applies, horizon keeps independent calendar',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-margin-mode','phased');h.change('#annual-margin-interimMargin','45');const prior=h.getState().draft;
 h.change('#annual-margin-declineStartYear','1');assert.equal(h.getState().draft.marginPath.declineStartYear,1);assert.deepEqual(h.getState().draft.annual,prior.annual);assert.match(h.get('#research-action-status').textContent,/before the interim/);h.change('#annual-margin-declineStartYear',String(prior.marginPath.declineStartYear));
 h.change('#annual-margin-terminalYear','18');assert.equal(h.getState().draft.annual.length,18);h.change('#annual-growth-horizon','20');const d=h.getState().draft;assert.equal(d.marginPath.terminalYear,18);assert.equal(d.annual[17].margin,d.terminal.margin);assert.equal(d.annual[19].margin,d.terminal.margin);
});
test('phase view labels mode semantics and full curve includes an interim peak even with same endpoints',()=>{
 const p={enabled:true,interimMargin:.4,interimYear:3,declineStartYear:5,terminalYear:10};
 const html=marginPhaseControlsHTML('guided',p,{terminalMargin:.2,terminalInput:false});assert.match(html,/Simple transition/);assert.equal((html.match(/data-margin-control=/g)||[]).length,4);assert.doesNotMatch(html,/checkbox/);
 const chart=marginPathChartHTML([{year:0,margin:.2},{year:3,margin:.4},{year:5,margin:.4},{year:10,margin:.2}]);assert.match(chart,/Year 3: 40%/);assert.match(chart,/Year 10: 20%/);assert.match(chart,/Actual modeled EBIT/);
});

test('annual invalid authored phases withhold valuation/export/simulation, survive reload, repair and exact Undo',async()=>{
 for(const [field,value,repair] of [['interimMargin','','41.123456789'],['declineStartYear','1','7'],['interimMargin','oops','42'],['terminalMargin','','20']]){
  const h=await startResearchWorkspace();h.change('#annual-margin-mode','phased');const before=h.getState().draft,selector='#annual-margin-'+field,el=h.get(selector);el.focus();h.input(selector,value);
  assert.equal(h.get(selector),el);assert.equal(el.value,value);assert.deepEqual(h.getState().draft.annual,before.annual);assert.match(h.get('#research-results').textContent,/withheld|unavailable|valid|correct/i);assert.doesNotMatch(h.get('#research-results').textContent,/PROVISIONAL BASE CASE/);
  assert.throws(()=>simulateResearch(h.getState().draft,simulationResearchDefaults()),/interimMargin|terminalMargin|decline|finite/);
  h.action('export');const exported=h.downloads.at(-1).value;assert.equal(exported.operating,undefined);assert.match(exported.error,/no valuation/);
  const restored=await startResearchWorkspace({storage:h.storage});assert.equal(restored.getState().identityError,null);assert.equal(restored.get(selector).value,value);restored.input(selector,repair);assert.equal(restored.getState().draft.marginPath[field],Number(repair)/(['interimMargin','terminalMargin'].includes(field)?100:1));assert.equal(restored.getState().draft.marginPath.inputText,undefined);restored.action('export');assert.ok(restored.downloads.at(-1).value.operating);
  h.action('undo-edit');assert.deepEqual(h.getState().draft,before);
 }
});
test('phase repair marker does not bypass source identity validation on reload',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-margin-mode','phased');h.input('#annual-margin-interimMargin','');const d=h.getState().draft;d.anchor.revenue+=1;
 const key=[...h.storage.keys()].find(key=>{try{const saved=JSON.parse(h.storage.get(key));return saved.caseId===d.caseId&&saved.marginPath?.inputText;}catch{return false;}});assert.ok(key);h.storage.set(key,JSON.stringify(d));
 const restored=await startResearchWorkspace({storage:h.storage});assert.match(restored.getState().identityError,/incompatible identity/);assert.equal(restored.get('#annual-margin-interimMargin'),null);
});
