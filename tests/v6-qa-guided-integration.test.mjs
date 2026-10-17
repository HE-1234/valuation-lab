// Migrated integration contract: v7 removes the v6 acknowledgement gates.
// Runs real workspace handlers in a synthetic DOM, not a browser rendering proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';

test('v7 guided integration: first load mounts a valid simulation before any category click',async()=>{
 const h=await startStudio();assert.equal(h.mounts.length,1);assert.equal(h.mounts[0].ticker,'AAPL');assert.equal(h.mounts[0].draft.modelReviewed,false);assert.equal(h.mounts[0].draft.bridgeReviewed,false);assert.match(h.get('#guided-results').innerHTML,/PROVISIONAL BASE CASE/);
 for(let n=0;n<8;n++){h.step(n);assert.equal(h.get('#g-model-review'),null);assert.equal(h.get('#g-bridge-review'),null);assert.equal(h.get('#guided-back'),null);assert.equal(h.get('#guided-continue'),null);}
});
test('v7 guided integration: category exploration preserves mounted chart; edits and company changes release old mounts',async()=>{
 const h=await startStudio(),first=h.mounts[0];h.step(3);assert.equal(first.released,false);assert.equal(h.mounts.length,1);
 h.input('#g-tax','30');assert.equal(h.timers.size,1);h.flush();assert.equal(first.released,true);const second=h.mounts.at(-1);assert.equal(second.draft.assumptions.tax,.3);
 h.input('#quote-price','100');h.flush();assert.equal(second.released,true);const third=h.mounts.at(-1);
 h.change('#current-company','MSFT');assert.equal(third.released,true);assert.equal(h.mounts.at(-1).ticker,'MSFT');assert.equal(h.mounts.filter(x=>!x.released).length,1);
});
test('v7 guided integration: specialist company cannot mount a generic per-share simulation',async()=>{
 for(const ticker of ['NBIS','TSM']){const h=await startStudio(),first=h.mounts.at(-1);h.change('#current-company',ticker);assert.equal(first.released,true);assert.equal(h.mounts.filter(x=>!x.released).length,0);assert.match(h.get('#guided-results').innerHTML,/withheld/i);for(let n=0;n<8;n++)h.step(n);h.flush();assert.equal(h.mounts.filter(x=>!x.released).length,0);}
});
