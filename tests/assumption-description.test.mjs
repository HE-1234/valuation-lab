// Source and minimal-DOM relationships, not a real accessibility-tree or speech test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';

const fields=[
 [2,'growth','Percent. ','%',100,-30,100,.5],
 [3,'targetMargin','Percent. ','%',100,0,70,.5],
 [3,'tax','Percent. ','%',100,0,60,.5],
 [4,'salesCapital','Times. ','×',1,.1,15,.1],
 [5,'wacc','Percent. ','%',100,1,30,.25],
 [5,'terminalGrowth','Percent. ','%',100,0,5,.25],
 [5,'terminalROIC','Percent. ','%',100,1,50,.5],
 [6,'otherAssets',null,'m',1,0,100000,100],
 [6,'otherClaims',null,'m',1,0,100000,100]
];

test('assumption descriptions: both native controls reference explicit units and the same helper for all baselines',async()=>{
 const h=await startStudio();let pairs=0;const currencies=new Set();
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  for(const snapshot of company.snapshots){
   h.change('#current-snapshot',snapshot.id);currencies.add(snapshot.currency);
   for(const [step,key,description,unit,scale,min,max,increment] of fields){
    h.step(step);const number=h.get('#g-'+key),slider=h.get(`[data-slider="${key}"]`),hint=h.get('#g-hint-'+key);
    const prefix=hint.querySelector('.sr-only');
    assert.equal(prefix.textContent,description||`${snapshot.currency} millions. `);
    assert.equal(h.app.querySelectorAll('#g-hint-'+key).length,1);
    assert.equal(number.getAttribute('type'),'number');assert.equal(number.getAttribute('inputmode'),'decimal');
    assert.equal(slider.getAttribute('type'),'range');assert.ok(slider.getAttribute('aria-label'));
    assert.equal(number.parent.querySelector('span').textContent,unit);
    assert.ok(hint._text.trim(),'Existing visible helper stays present');
    for(const control of [number,slider]){
     assert.equal(control.getAttribute('aria-describedby'),'g-hint-'+key);
     assert.equal(Number(control.dataset.scale),scale);assert.equal(Number(control.getAttribute('min')),min);
     assert.equal(Number(control.getAttribute('max')),max);assert.equal(Number(control.getAttribute('step')),increment);
     assert.equal(control.getAttribute('role'),null);assert.equal(control.getAttribute('aria-valuetext'),null);
    }
    assert.equal(number.getAttribute('aria-label'),null,'The existing visible label still names the number field');
    assert.ok(number.parent.parent.parent.querySelector(`[data-history="${key}"]`));pairs++;
   }
  }
 }
 assert.equal(pairs,315);assert.deepEqual([...currencies].sort(),['TWD','USD']);
});

test('assumption descriptions: typing, sliders, validation recovery and reload preserve nodes, focus, units and saved edits',async()=>{
 const h=await startStudio();
 for(const ticker of ['AAPL','AAOI','GOOG']){
  h.change('#current-company',ticker);h.step(2);
  const number=h.get('#g-growth'),slider=h.get('[data-slider="growth"]'),hint=h.get('#g-hint-growth');
  number.focus();h.input('#g-growth','12.5');h.flush();
  assert.equal(h.get('#g-growth'),number);assert.equal(h.focus(),number);assert.equal(h.get('#g-hint-growth'),hint);assert.equal(slider.value,'12.5');
  slider.focus();h.input('[data-slider="growth"]','13');h.flush();
  assert.equal(h.get('[data-slider="growth"]'),slider);assert.equal(h.focus(),slider);assert.equal(number.value,'13');
  h.input('#g-growth','');assert.ok(h.get('.valuation-unavailable'));assert.equal(h.get('#g-hint-growth'),hint);
  h.input('#g-growth','14');h.flush();assert.equal(h.get('.valuation-unavailable'),null);assert.equal(h.state(ticker).assumptions.growth,.14);
  const result=h.get('#guided-results').innerHTML,mounts=h.mounts.length;
  h.step(4);h.step(6);h.step(2);assert.equal(h.get('#guided-results').innerHTML,result);assert.equal(h.mounts.length,mounts);
  assert.equal(h.get('#g-hint-growth').querySelector('.sr-only').textContent,'Percent. ');
 }
 const restored=await startStudio({storage:h.storage});
 assert.equal(restored.state('GOOG').assumptions.growth,.14);
 assert.equal(restored.get('#g-growth').value,'14');
 assert.equal(restored.get('[data-slider="growth"]').getAttribute('aria-describedby'),'g-hint-growth');
});

test('assumption descriptions: currency context follows the selected baseline, without changing withholding',async()=>{
 const h=await startStudio();
 for(const ticker of ['TSM','NBIS','AAOI','GOOG','AAPL']){
  h.change('#current-company',ticker);h.step(6);
  const raw=h.library.companies.find(c=>c.ticker===ticker).snapshots.find(s=>s.id===h.get('#current-snapshot').value);
  for(const key of ['otherAssets','otherClaims'])assert.equal(h.get('#g-hint-'+key).querySelector('.sr-only').textContent,`${raw.currency} millions. `);
  if(['TSM','NBIS'].includes(ticker))assert.ok(h.get('.valuation-unavailable'));
  else assert.equal(h.get('.valuation-unavailable'),null);
 }
});

test('assumption descriptions: the unit prefix reuses the noninteractive visually-hidden text treatment',async()=>{
 const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
 const rule=css.match(/\.sr-only\{([^}]+)\}/)[1];
 assert.match(rule,/position:absolute/);assert.match(rule,/width:1px;height:1px/);assert.match(rule,/clip:rect\(0,0,0,0\)/);
 assert.doesNotMatch(rule,/display:none|visibility:hidden/);
 const h=await startStudio();
 for(const [step,key] of fields){
  h.step(step);const hint=h.get('#g-hint-'+key),prefix=hint.querySelector('.sr-only');
  assert.equal(prefix.tag,'span');
  for(const node of [hint,prefix])for(const attr of ['tabindex','aria-hidden','role','aria-live'])assert.equal(node.getAttribute(attr),null);
 }
});
