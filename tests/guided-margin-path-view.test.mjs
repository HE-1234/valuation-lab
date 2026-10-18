import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';
test('Guided phases keep scalar terminal source, precision, actual peak chart, and full prior-draft Undo',async()=>{
 const h=await startStudio();h.step(3);const before=h.state();h.change('#guided-margin-mode','phased');assert.equal(h.state().marginPath.enabled,true);assert.equal(h.focus(),h.get('#guided-margin-mode'));
 h.get('#undo-input').click();assert.deepEqual(h.state(),before);
 h.change('#guided-margin-mode','phased');h.input('#guided-margin-interimMargin','45.123456789');assert.equal(h.state().marginPath.interimMargin,45.123456789/100);assert.equal(h.state().marginPath.terminalMargin,undefined);
 assert.match(h.get('#guided-margin-chart').textContent,/45.12%/);h.input('#g-targetMargin','20.123456789');assert.equal(h.state().assumptions.targetMargin,20.123456789/100);assert.match(h.get('#guided-margin-chart').textContent,/20.12%/);
 const active=h.state();h.change('#guided-margin-mode','existing');assert.equal(h.state().marginPath.enabled,false);assert.equal(h.state().assumptions.targetMargin,active.assumptions.targetMargin);assert.equal(h.state().marginPath.interimMargin,active.marginPath.interimMargin);h.get('#undo-input').click();assert.deepEqual(h.state(),active);
});
test('Guided phase timing edits keep input mounted and growth-independent terminal date',async()=>{
 const h=await startStudio();h.step(3);h.change('#guided-margin-mode','phased');const el=h.get('#guided-margin-terminalYear');el.focus();h.input('#guided-margin-terminalYear','18');assert.equal(h.get('#guided-margin-terminalYear'),el);assert.equal(h.focus(),el);assert.equal(h.state().marginPath.terminalYear,18);
 h.step(2);h.change('#growth-path-mode','maintain5');h.change('#growth-maturity','20');assert.equal(h.state().marginPath.terminalYear,18);h.step(3);assert.match(h.get('#guided-margin-chart').textContent,/Year 20/);
});
