// Minimal DOM interaction checks, not native browser/layout/accessibility QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';
import {currentSnapshot,calculateCurrent,currentEconomicShareBasis} from '../dist/current-model.js';
const snapshotFor=(h,ticker)=>{const company=h.library.companies.find(c=>c.ticker===ticker),raw=company.snapshots.find(r=>r.id===h.state(ticker).snapshotId);return currentSnapshot(company,raw);};

test('special claims UI: both companies calculate immediately and expose a complete claims bridge without acknowledgement controls',async()=>{
 const h=await startStudio();
 for(const ticker of ['AAOI','GOOG']){h.change('#current-company',ticker);assert.doesNotMatch(h.get('#guided-results').textContent,/Value withheld/);assert.ok(h.get('.claims-result-note'));assert.equal(h.mounts.at(-1).ticker,ticker);assert.ok(h.mounts.at(-1).draft.claims);h.step(6);assert.ok(h.get('.claims-panel'));assert.match(h.get('#claims-calculation').textContent,/Enterprise to common equity/);assert.match(h.get('#claims-calculation').textContent,/Claims-only sensitivities/);assert.equal(h.get('#bridge-reviewed'),null);assert.match(h.get('.claims-panel').textContent,/Do not enter.*again/);}
});

test('special claims UI: numeric claim edits preserve the active control and use the edited bridge in simulation',async()=>{
 const h=await startStudio();h.change('#current-company','AAOI');h.step(6);const input=h.get('#claim-noteFairValue'),before=h.mounts.at(-1);h.input('#claim-noteFairValue','500');assert.equal(h.get('#claim-noteFairValue'),input);assert.equal(h.state('AAOI').claims.noteFairValue,500);assert.ok(h.state('AAOI').assumptionProvenance.editedKeys.includes('claims:noteFairValue'));h.flush();assert.equal(before.released,true);assert.equal(h.mounts.at(-1).draft.claims.noteFairValue,500);assert.match(h.get('#claims-calculation').textContent,/500/);
 h.change('#claim-method','if-converted');h.flush();assert.equal(h.mounts.at(-1).draft.claims.method,'if-converted');assert.match(h.get('#claims-calculation').textContent,/Immediate-conversion common shares/);assert.doesNotMatch(h.get('#claims-calculation').textContent,/Convertible fair-value claim/);
});

test('special claims UI: invalid claim edits clear the stale value, chart and bridge and recover without an Apply step',async()=>{
 const h=await startStudio();h.change('#current-company','GOOG');h.step(6);const active=h.mounts.at(-1);h.input('#claim-dividendDiscountRate','');assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.equal(h.get('#simulation-lab').innerHTML,'');assert.equal(active.released,true);assert.match(h.get('#claims-calculation').textContent,/Correct the claims inputs/);
 const restored=await startStudio({storage:h.storage});restored.change('#current-company','GOOG');assert.match(restored.get('#guided-results').textContent,/Value withheld/);restored.step(6);assert.equal(restored.get('#claim-dividendDiscountRate').value,'');restored.input('#claim-dividendDiscountRate','6.25');restored.flush();assert.doesNotMatch(restored.get('#guided-results').textContent,/Value withheld/);assert.equal(restored.state('GOOG').claims.dividendDiscountRate,.0625);assert.equal(restored.mounts.at(-1).ticker,'GOOG');
});

test('special claims UI: switching the AAOI capital basis refreshes the quote basis and invalidates the old comparison',async()=>{
 const h=await startStudio();h.change('#current-company','AAOI');h.step(6);const snapshot=snapshotFor(h,'AAOI'),oldBasis=currentEconomicShareBasis(snapshot,h.state('AAOI'));
 h.input('#quote-price','100');h.input('#quote-date','2026-10-16');h.input('#quote-currency','USD');h.input('#quote-source','https://example.com/synthetic-quote');h.change('#quote-share-basis',oldBasis);assert.match(h.get('#quote-comparison').textContent,/value-to-price gap/);
 h.change('#claim-capitalBasis','known-transactions');const basis=currentEconomicShareBasis(snapshot,h.state('AAOI'));assert.notEqual(basis,oldBasis);assert.match(h.get('#quote-comparison').textContent,/withheld/);
 assert.ok(h.get('#quote-share-basis').querySelectorAll('option').some(o=>o.value===basis),'new capital reference must be available in the quote selector without leaving the screen');h.change('#quote-share-basis',basis);assert.match(h.get('#quote-comparison').textContent,/value-to-price gap/);assert.match(h.get('#guided-results').textContent,/pro forma.*incomplete cash bridge/i);
});

test('special claims UI: claims persist independently by company and financial baseline and reset only when requested',async()=>{
 const h=await startStudio();h.change('#current-company','AAOI');h.step(6);h.input('#claim-noteFairValue','512');h.change('#current-snapshot','AAOI-CURRENT-2025-12-31');h.step(6);assert.equal(Number(h.get('#claim-noteFairValue').value),145.23);assert.equal(h.state('AAOI').claims.noteFairValue,145.231);h.get('#claim-noteFairValue').onfocus();assert.equal(h.get('#claim-noteFairValue').value,'145.231');h.input('#claim-noteFairValue','180');
 h.change('#current-company','GOOG');h.step(6);h.change('#claim-conversionCase','minimum');h.change('#current-company','AAOI');h.change('#current-snapshot','AAOI-TTM-2026-06-30');h.step(6);assert.equal(Number(h.get('#claim-noteFairValue').value),512);h.get('#reset-claims').click();assert.equal(Number(h.get('#claim-noteFairValue').value),445.1);
 const restored=await startStudio({storage:h.storage});restored.change('#current-company','AAOI');restored.change('#current-snapshot','AAOI-CURRENT-2025-12-31');restored.step(6);assert.equal(Number(restored.get('#claim-noteFairValue').value),180);restored.change('#current-company','GOOG');restored.step(6);assert.equal(restored.get('#claim-conversionCase').value,'minimum');
});

test('special claims UI: operating research reload and Undo retain separately edited claims and quote',async()=>{
 const h=await startStudio();h.change('#current-company','GOOG');h.step(6);h.input('#claim-noncontrollingClaim','9000');h.change('#claim-conversionCase','minimum');h.input('#quote-price','123');const claims=structuredClone(h.state('GOOG').claims),quote=structuredClone(h.state('GOOG').quote);
 h.step(2);h.input('#g-growth','21');h.get('#load-base-case').click();assert.deepEqual(h.state('GOOG').claims,claims);assert.deepEqual(h.state('GOOG').quote,quote);h.get('#undo-base-case').click();assert.equal(h.state('GOOG').assumptions.growth,.21);assert.deepEqual(h.state('GOOG').claims,claims);assert.deepEqual(h.state('GOOG').quote,quote);
});

test('special claims UI: AAOI visible zero is explained with raw negative economics and a funding deficit',async()=>{
 const h=await startStudio();h.change('#current-company','AAOI');assert.match(h.get('#guided-results').textContent,/limited-liability floor/);assert.match(h.get('#guided-results').textContent,/Raw common equity/);assert.match(h.get('#guided-results').textContent,/not evidence.*worthless/);h.step(7);const funding=h.get('.funding-diagnostic');assert.ok(funding);assert.match(funding.textContent,/5 of 10/);assert.match(funding.textContent,/before financing.*coupons/);assert.match(funding.textContent,/does not forecast issuance, default, recovery/);
 const s=snapshotFor(h,'AAOI'),v=calculateCurrent(s,h.state('AAOI'));let total=0,trough=0;for(const r of v.rows){total+=r.fcff;trough=Math.min(trough,total);}assert.ok(-trough>v.claimsBridge.cash,'funding stress must not imply June cash is sufficient');
});

test('special operating UI: staged and legacy selection changes the same deterministic and simulation path and persists explicitly',async()=>{
 const h=await startStudio();h.change('#current-company','AAOI');const scalars=structuredClone(h.state('AAOI').assumptions),claims=structuredClone(h.state('AAOI').claims);assert.equal(h.get('#operating-profile').value,'aaoi-capacity-ramp-v1');h.step(7);assert.match(h.get('.funding-diagnostic').textContent,/5 of 10/);
 h.change('#operating-profile','linear-v1');h.flush();assert.deepEqual(h.state('AAOI').assumptions,scalars);assert.deepEqual(h.state('AAOI').claims,claims);assert.match(h.get('.funding-diagnostic').textContent,/9 of 10/);assert.equal(h.mounts.at(-1).draft.operatingProfile.id,'linear-v1');
 const restored=await startStudio({storage:h.storage});restored.change('#current-company','AAOI');assert.equal(restored.get('#operating-profile').value,'linear-v1');restored.step(7);assert.match(restored.get('.funding-diagnostic').textContent,/9 of 10/);
 restored.get('#load-base-case').click();assert.equal(restored.get('#operating-profile').value,'aaoi-capacity-ramp-v1');assert.match(restored.get('.funding-diagnostic').textContent,/5 of 10/);assert.deepEqual(restored.state('AAOI').claims,claims);restored.get('#undo-base-case').click();assert.equal(restored.get('#operating-profile').value,'linear-v1');assert.match(restored.get('.funding-diagnostic').textContent,/9 of 10/);
});
