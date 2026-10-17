// UI markup/runtime contracts only; document-renderer previews supplement these.
// Neither is a substitute for native-browser or accessibility-tree testing.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
const amountKeys=['otherAssets','otherClaims'];

test('equity amounts: only the two million-unit drivers receive the wider layout, for every company',async()=>{
 const h=await startStudio();
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);h.step(6);
  const cards=h.app.querySelectorAll('.driver-card--amount');assert.equal(cards.length,2,company.ticker);
  for(const key of amountKeys){
   const input=h.get('#g-'+key),card=input.parent.parent.parent;
   assert.ok(cards.includes(card));assert.equal(input.getAttribute('type'),'number');assert.equal(input.getAttribute('inputmode'),'decimal');
   assert.equal(input.dataset.scale,'1');assert.equal(input.getAttribute('max'),'100000');assert.equal(input.getAttribute('step'),'100');
   assert.equal(input.parent.querySelector('span').textContent,'m');
   assert.equal(card.querySelector('label').getAttribute('for'),'g-'+key);
   assert.equal(input.getAttribute('aria-describedby'),'g-hint-'+key);
   assert.ok(card.querySelector(`[data-history="${key}"]`),'history remains adjacent');
  }
  for(const step of [2,3,4,5]){h.step(step);assert.equal(h.get('#editor-group-'+step).querySelectorAll('.driver-card--amount').length,0);assert.equal(h.get('#editor-group-6').hidden,true);}
 }
});

test('equity amounts: six-digit and decimal entries update directly, synchronize sliders and survive reload',async()=>{
 const h=await startStudio();h.step(6);
 const input=h.get('#g-otherAssets'),before=h.get('#guided-results').innerHTML;
 input.focus();h.input('#g-otherAssets','100000');assert.notEqual(h.get('#guided-results').innerHTML,before);h.input('#g-otherClaims','99999.99');h.flush();
 assert.equal(h.get('#g-otherAssets'),input);assert.equal(h.focus(),input);
 assert.equal(h.state().assumptions.otherAssets,100000);assert.equal(h.state().assumptions.otherClaims,99999.99);
 assert.equal(h.get('[data-slider="otherAssets"]').value,'100000');assert.equal(h.get('[data-slider="otherClaims"]').value,'99999.99');
 assert.doesNotMatch(h.get('#guided-results').textContent,/Value withheld/);
 const reloaded=await startStudio({storage:h.storage});
 assert.equal(reloaded.state().step,6);assert.equal(reloaded.get('#g-otherAssets').value,'100000');assert.equal(reloaded.get('#g-otherClaims').value,'99999.99');
 reloaded.input('[data-slider="otherAssets"]','12300');assert.equal(reloaded.get('#g-otherAssets').value,'12300');
 assert.equal(reloaded.state().assumptions.otherAssets,12300);
});

test('equity amounts: invalid values still withhold the result and recover without replacement or confirmation',async()=>{
 const h=await startStudio();h.step(6);const input=h.get('#g-otherClaims');
 for(const value of ['', '-1']){
  h.input('#g-otherClaims',value);assert.equal(h.get('#g-otherClaims'),input);
  assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.equal(h.get('#simulation-lab').innerHTML,'');
  h.input('#g-otherClaims','100000');h.flush();assert.equal(h.get('#g-otherClaims'),input);assert.doesNotMatch(h.get('#guided-results').textContent,/Value withheld/);
 }
 for(const ticker of ['AAOI','GOOG']){h.change('#current-company',ticker);h.step(6);h.input('#g-otherAssets','100000');h.flush();assert.ok(h.get('.claims-result-note'));assert.doesNotMatch(h.get('#guided-results').textContent,/Value withheld/);}
});

test('equity amounts: content-sized inputs wrap in the existing six-theme system without affecting other drivers',()=>{
 const rule=selector=>css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]+)\\}'))?.[1];
 assert.match(rule('.driver-card--amount .driver-top'),/flex-wrap:wrap/);
 assert.match(rule('.driver-card--amount .driver-top>label'),/flex:1 1 10rem;min-width:0/);
 assert.match(rule('.driver-card--amount .driver-number'),/max-width:100%/);
 assert.match(rule('.driver-card--amount .driver-number input'),/width:10ch;max-width:100%;min-width:0/);
 assert.match(rule('.driver-card--amount .driver-number>span'),/flex:none/);
 // The rules are outside every media query, come after the previous narrow-width
 // maximums, and add no colors, font-size override or input/event behavior.
 const change=css.slice(css.indexOf('/* Equity amounts need room'));
 assert.doesNotMatch(change,/@media|color:|font-size:|overflow:hidden|display:none|!important/);
 assert.ok(css.indexOf('/* Equity amounts need room')>css.indexOf('max-width:75px'));
 assert.equal((change.match(/\.driver-card--amount/g)||[]).length,5);
});
