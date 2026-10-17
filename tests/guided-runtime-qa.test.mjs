// Actual current-workspace handlers in a minimal DOM. Not browser rendering or native input QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';

test('guided runtime QA: all eight categories render while live value remains available',async()=>{
 const h=await startStudio();assert.ok(h.get('#g-growth'));assert.equal(h.state().step,2);assert.match(h.get('#guided-results').innerHTML,/PROVISIONAL BASE CASE/);
 h.step(1);h.input('#note-today','Original business story');h.step(2);h.input('#g-growth','17');h.step(1);
 assert.equal(h.state().assumptions.growth,.17);assert.equal(h.state().notes.today,'Original business story');
 for(let i=0;i<8;i++){h.step(i);assert.ok(h.get('#guided-step-title-'+i));assert.equal(h.state().step,i);assert.equal(h.get('#editor-group-'+i).hidden,false);assert.match(h.get('#guided-results').innerHTML,/PROVISIONAL BASE CASE/);}
});
test('guided runtime QA: calculations need no assent and company switches retain separate drafts',async()=>{
 const h=await startStudio();assert.equal(h.state().modelReviewed,false);assert.equal(h.state().bridgeReviewed,false);assert.ok(h.mounts.length);
 h.input('#g-growth','17');h.change('#current-company','MSFT');assert.equal(h.state('MSFT').assumptions.growth,h.baseCases.companies.MSFT.assumptions.growth);assert.match(h.get('#guided-results').innerHTML,/PROVISIONAL BASE CASE/);
 h.change('#current-company','AAPL');assert.equal(h.state().assumptions.growth,.17);assert.equal(h.state().modelReviewed,false);assert.equal(h.state().bridgeReviewed,false);assert.match(h.get('#guided-results').innerHTML,/PROVISIONAL BASE CASE/);
});
test('guided runtime QA: malformed selection and draft storage cannot prevent startup',async()=>{
 const initial=await startStudio(),draftKey='valuation-lab-guided-v5:AAPL:'+initial.state().snapshotId;
 for(const value of ['{','null','42','[]','"wrong"']){const h=await startStudio({storage:new Map([['valuation-lab-guided-selection',value],[draftKey,value]])});assert.ok(h.get('#g-growth'),value);assert.equal(h.state().step,2);}
});
test('guided runtime QA: disabled storage retains a usable live draft and honest export warning',async()=>{
 const h=await startStudio({storageBlocked:true});assert.ok(h.get('#g-growth'));assert.match(h.get('#guided-save-state').textContent,/Storage unavailable/);
 h.input('#g-growth','15');h.step(3);h.step(2);assert.equal(h.get('#g-growth').value,'15');
});
test('guided runtime QA: complete WACC worksheet applies automatically, incomplete edits retain scalar',async()=>{
 const h=await startStudio();h.step(5);const vals={riskFree:'4',beta:'1.2',equityPremium:'5',countryPremium:'1',costOfDebt:'6',debtWeight:'30',tax:'25'};
 for(const [k,v]of Object.entries(vals))h.input('#wacc-'+k,v);
 assert.equal(h.state().waccWorksheet.beta,1.2);assert.equal(h.state().assumptions.beta,undefined);assert.equal(h.get('#apply-wacc'),null);assert.ok(Math.abs(h.state().assumptions.wacc-.0905)<1e-12);
 h.input('#wacc-beta','');assert.ok(Math.abs(h.state().assumptions.wacc-.0905)<1e-12);assert.match(h.get('#wacc-output').textContent,/Complete/);
 h.input('#g-wacc','12');assert.equal(h.state().assumptions.wacc,.12);
});
test('guided runtime QA: category tabs expose current state and keyboard navigation',async()=>{
 const h=await startStudio();for(let step=0;step<8;step++){h.step(step);assert.equal(h.get('#group-'+step).getAttribute('aria-selected'),'true');assert.equal(h.get('#group-'+step).getAttribute('tabindex'),'0');assert.equal(h.get('#assumption-editor').getAttribute('aria-labelledby'),'group-'+step);}
 let prevented=0;h.get('#group-7').onkeydown({key:'Home',preventDefault(){prevented++}});assert.equal(h.state().step,2);assert.equal(h.focus(),h.get('#group-2'));h.get('#group-2').onkeydown({key:'ArrowRight',preventDefault(){prevented++}});assert.equal(h.state().step,3);assert.equal(prevented,2);
});
test('guided runtime QA: session draft survives company switching with browser storage disabled',async()=>{
 const h=await startStudio({storageBlocked:true});h.input('#g-growth','17');h.change('#current-company','MSFT');h.change('#current-company','AAPL');assert.equal(h.get('#g-growth').value,'17');
});
