// Minimal DOM state/handler coverage; browser layout is verified separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
const withoutStamp=d=>{const x=structuredClone(d);delete x.updatedAt;return x;};

test('year-by-year horizon: direct selection derives and retains all rows, source timing, full Undo and exact saved state',async()=>{
 const h=await startResearchWorkspace();h.select('MSFT');h.input('#research-notes','Keep my thesis');const before=h.getState().draft;
 assert.equal(h.get('#annual-growth-horizon').value,'current');
 h.change('#annual-growth-horizon','10');const d=h.getState().draft;
 assert.equal(d.schemaVersion,2);assert.equal(d.derivedForecast.growthMaturityYear,10);assert.equal(d.annual.length,Math.max(before.annual.length,10));assert.equal(d.notes,'Keep my thesis');assert.equal(h.focus(),h.get('#annual-growth-horizon'));
 assert.match(h.get('#annual-growth-horizon-help').textContent,/Source forecast: 15 years · Full calculation: 15 years/);assert.match(h.get('#annual-growth-horizon-help').textContent,/15 rows to retain longer margin and capital commitments/);
 assert.match(h.get('#annual-scenario-state').textContent,/Derived analyst scenario/);assert.equal(h.get('#annual-edit-year').children.length,15);assert.ok(h.get('#annual-marginal-sales-capital'));
 const restored=await startResearchWorkspace({storage:h.storage});assert.deepEqual(withoutStamp(restored.getState().draft),withoutStamp(d));restored.action('undo');assert.deepEqual(withoutStamp(restored.getState().draft),withoutStamp(before));
});

test('year-by-year horizon: 20-year draft survives company switching, exact annual edits, research reset and full Undo',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-growth-horizon','20');h.change('#annual-edit-year','19');h.input('[data-year-field="revenue"]','900123.4567890123');const derived=h.getState().draft;
 assert.equal(derived.annual.length,20);assert.equal(derived.annual[19].revenue,900123.4567890123);assert.match(h.get('#annual-input-origin').textContent,/Derived analyst extension/);
 h.select('MSFT');h.select('AAPL');assert.deepEqual(withoutStamp(h.getState().draft),withoutStamp(derived));
 h.action('use-research');assert.equal(h.getState().draft.schemaVersion,1);assert.equal(h.get('#annual-growth-horizon').value,'current');h.action('undo');assert.deepEqual(withoutStamp(h.getState().draft),withoutStamp(derived));
});

test('year-by-year horizon: capital sensitivity is editable, invalid changes retain the prior case',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-growth-horizon','15');const prior=h.getState().draft;
 h.change('#annual-marginal-sales-capital','0');assert.deepEqual(h.getState().draft,prior);assert.equal(h.get('#annual-marginal-sales-capital').getAttribute('aria-invalid'),'true');
 h.change('#annual-marginal-sales-capital','2.123456789');assert.equal(h.getState().draft.derivedForecast.marginalSalesCapital,2.123456789);assert.equal(h.focus(),h.get('#annual-marginal-sales-capital'));h.action('undo');assert.deepEqual(withoutStamp(h.getState().draft),withoutStamp(prior));
});

test('year-by-year horizon: invalid existing inputs block derivation without losing the draft',async()=>{
 const h=await startResearchWorkspace();h.input('[data-year-field="revenue"]','');const before=h.getState().draft;h.change('#annual-growth-horizon','20');assert.deepEqual(h.getState().draft,before);assert.equal(h.get('#annual-growth-horizon').value,'current');assert.match(h.get('#research-action-status').textContent,/Complete valid annual/);
});

test('year-by-year horizon: shortening clamps the selected year only to the retained full calculation length',async()=>{
 const h=await startResearchWorkspace();h.select('MSFT');h.change('#annual-growth-horizon','20');h.change('#annual-edit-year','19');h.change('#annual-growth-horizon','10');
 assert.equal(h.get('#annual-edit-year').value,'14');assert.equal(h.get('#annual-edit-year').children.length,15);assert.equal(h.root.querySelectorAll('[data-research-input="annual"]').length,15*5);
 assert.match(h.get('#annual-path-result').textContent,/Selected revenue-growth horizon: 10 years. The full 15-year calculation/);
 assert.match(h.get('#annual-capital-assumption').textContent,/analyst sensitivity/);
});

test('year-by-year horizon: primary Undo edit enables for horizon and capital changes and restores the entire prior draft',async()=>{
 const h=await startResearchWorkspace();h.input('#research-notes','Keep this full draft');const before=h.getState().draft;
 h.change('#annual-growth-horizon','20');assert.equal(h.get('[data-research-action="undo-edit"]').disabled,false);h.action('undo-edit');assert.deepEqual(h.getState().draft,before);
 h.change('#annual-growth-horizon','15');const derived=h.getState().draft;h.change('#annual-marginal-sales-capital','2.31415926535');assert.equal(h.get('[data-research-action="undo-edit"]').disabled,false);h.action('undo-edit');assert.deepEqual(h.getState().draft,derived);
});

test('year-by-year horizon: manual revenue and terminal changes do not claim the selected endpoint is still achieved',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-growth-horizon','20');h.change('#annual-edit-year','19');h.input('[data-year-field="revenue"]','900123.4567890123');h.input(h.field('terminal','growth'),'3');
 assert.match(h.get('#annual-growth-horizon-help').textContent,/Selected growth horizon: 20 years/);assert.match(h.get('#annual-path-result').textContent,/Manual annual or terminal edits may change the actual growth endpoint/);
 assert.doesNotMatch(h.get('#annual-path-result').textContent,/growth stabilizes in year/);
});
