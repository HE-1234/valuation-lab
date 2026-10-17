// Minimal DOM handler coverage; not browser, touch or screen-reader verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {calculateCurrent,currentSnapshot} from '../dist/current-model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const source=fs.readFileSync(new URL('../dist/guided.js',import.meta.url),'utf8');

test('flexible view: fresh research stays legacy and all supported horizons are explicit controls',async()=>{
 const h=await startStudio();assert.equal(h.get('#growth-path-mode').value,'legacy');assert.equal(h.state().assumptions.years,10);assert.ok(h.get('#growth-maturity').getAttribute('disabled')!==null);
 const original=h.get('#guided-results').innerHTML,a=structuredClone(h.state().assumptions);h.change('#growth-path-mode','maintain3');assert.deepEqual(h.state().assumptions,a);assert.equal(h.get('#growth-maturity').getAttribute('disabled'),null);assert.match(h.get('#growth-path-help').textContent,/3 explicit growth years, then 7 fade years/);
 h.change('#growth-maturity','15');assert.equal(h.state().assumptions.years,15);assert.match(h.get('#guided-results').textContent,/15-year FCFF/);assert.match(h.get('#growth-path-help').textContent,/then 12 fade years/);assert.equal(h.focus(),h.get('#growth-maturity'));
 h.change('#growth-maturity','20');assert.match(h.get('#growth-scale').textContent,/In year 20/);assert.match(h.get('#growth-scale').textContent,/Forecast net reinvestment totals/);assert.match(h.get('#growth-scale').textContent,/Mature marginal ROIC/);assert.match(h.get('#growth-scale').textContent,/Same scalar inputs with the legacy 10-year path/);
 h.change('#growth-path-mode','legacy');assert.equal(h.get('#guided-results').innerHTML,original);assert.deepEqual(h.state().assumptions,a);
});

test('flexible view: explicit annual inputs preserve focus, enforce bounds, clear stale outputs and persist',async()=>{
 const h=await startStudio();h.change('#growth-path-mode','annual5');assert.equal(h.app.querySelectorAll('[data-annual-growth]').length,4);h.change('#growth-maturity','20');
 const input=h.get('#growth-year-3');input.focus();h.input('#growth-year-3','22.5');h.flush();assert.equal(h.get('#growth-year-3'),input);assert.equal(h.focus(),input);assert.equal(h.state().operatingProfile.subsequentGrowth[1],.225);assert.ok(h.get('[data-history="growth"]'));
 for(const v of ['', '201','-51']){h.input('#growth-year-3',v);h.flush();assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.equal(h.get('#simulation-lab').innerHTML,'');assert.match(h.get('#growth-scale').textContent,/unavailable/);h.input('#growth-year-3','22.5');h.flush();assert.ok(!h.get('.valuation-unavailable'));}
 const restored=await startStudio({storage:h.storage});assert.equal(restored.get('#growth-year-3').value,'22.5');assert.equal(restored.state().assumptions.years,20);assert.equal(restored.get('#growth-path-mode').value,'annual5');
 const p=structuredClone(restored.state().operatingProfile);restored.change('#growth-maturity','15');assert.deepEqual(restored.state().operatingProfile,p);restored.change('#current-company','MSFT');restored.change('#current-company','AAPL');assert.equal(restored.state().assumptions.years,15);assert.deepEqual(restored.state().operatingProfile,p);
});

test('flexible view: path Undo restores only path and maturity, keeping subsequent independent edits',async()=>{
 const h=await startStudio();h.change('#growth-path-mode','maintain5');h.input('#g-growth','23');h.step(1);h.input('#note-today','Keep this story');h.step(2);h.get('#undo-growth-path').click();assert.equal(h.state().operatingProfile,undefined);assert.equal(h.state().assumptions.growth,.23);assert.equal(h.state().notes.today,'Keep this story');
 h.change('#growth-path-mode','annual3');const profile=structuredClone(h.state().operatingProfile);h.change('#growth-maturity','20');h.input('#growth-year-2','31');h.get('#undo-growth-path').click();assert.equal(h.state().assumptions.years,10);assert.deepEqual(h.state().operatingProfile,{...profile,subsequentGrowth:[.31,...profile.subsequentGrowth.slice(1)]});
});

test('flexible view: AAOI staged profile stays exact until a deliberate flexible selection',async()=>{
 const h=await startStudio();h.change('#current-company','AAOI');const original=h.get('#guided-results').innerHTML,initial=structuredClone(h.state('AAOI').assumptions);assert.equal(h.get('#growth-path-mode').value,'staged');assert.match(h.get('.operating-profile-panel').textContent,/fixed at 10 years/);
 h.change('#operating-profile','flexible-growth-v1');assert.equal(h.state('AAOI').operatingProfile.id,'flexible-growth-v1');assert.deepEqual(h.state('AAOI').assumptions,initial);h.change('#growth-maturity','20');assert.match(h.get('#guided-results').textContent,/20-year FCFF/);
 h.change('#operating-profile','aaoi-capacity-ramp-v1');assert.equal(h.state('AAOI').assumptions.years,10);assert.equal(h.get('#guided-results').innerHTML,original);
});

test('flexible view: selecting research restores its original profile and Undo load restores flexible draft',async()=>{
 const h=await startStudio();h.change('#growth-path-mode','annual5');h.change('#growth-maturity','20');h.input('#growth-year-5','11');const prior=h.state();h.get('#load-base-case').click();assert.equal(h.state().operatingProfile,undefined);assert.equal(h.state().assumptions.years,10);h.get('#undo-base-case').click();assert.deepEqual(h.state().operatingProfile,prior.operatingProfile);assert.deepEqual(h.state().assumptions,prior.assumptions);
});

test('flexible view: annual path details, stress shifts, export and six-theme controls have explicit semantics',async()=>{
 const h=await startStudio();h.change('#growth-path-mode','annual3');h.input('#growth-year-2','20');h.input('#growth-year-3','15');h.change('#growth-maturity','15');h.step(7);assert.match(h.get('#forecast-detail').textContent,/Flexible annual path/);assert.match(h.get('#forecast-detail').textContent,/Capital intensity in year 15/);assert.match(h.get('#forecast-detail').textContent,/No annual independent draws or clipping/);assert.ok(h.get('#forecast-detail').querySelectorAll('table').every(t=>!!t.querySelector('caption')));
 h.get('#freeze-current').click();const saved=JSON.parse(await h.downloads.at(-1).text());assert.equal(saved.result.rows.length,15);assert.equal(saved.result.operatingProfile.annualPath.length,15);assert.deepEqual(saved.draft.operatingProfile,h.state().operatingProfile);
 const c=h.library.companies.find(c=>c.ticker==='AAPL'),r=c.snapshots.find(r=>r.id===h.state().snapshotId),v=calculateCurrent(currentSnapshot(c,r),h.state());near(saved.result.perShare,v.perShare);
 h.step(2);for(const id of ['growth-path-mode','growth-maturity','growth-year-2','growth-year-3']){const el=h.get('#'+id);assert.ok(h.app.querySelectorAll('label').some(l=>l.getAttribute('for')===id));assert.ok(h.get('#'+el.getAttribute('aria-describedby')));}
 const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');assert.match(css,/\.growth-path-controls select\{[^}]*min-height:46px[^}]*font-size:16px/);assert.match(css,/\.annual-growth-inputs\{[^}]*minmax\(0,1fr\)/);assert.match(css,/@media\(max-width:480px\)\{\.growth-path-selects\{grid-template-columns:minmax\(0,1fr\)/);assert.doesNotMatch(source,/id="growth[^" ]*"[^>]*type="checkbox"/);
});
