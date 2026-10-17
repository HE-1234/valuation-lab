// Actual handler/focus-target contracts in the minimal DOM fixture.
// These checks do not emulate native select popups, browser focus fallback or AT speech.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';

const categories=[2,3,4,5,6,1,0,7];
const scalarInputs=draft=>{const {years,...scalars}=draft.assumptions;return scalars};

test('growth path focus: AAOI Operating path retains its own attached control in all eight categories',async()=>{
 for(const step of categories){
  const h=await startStudio();h.change('#current-company','AAOI');h.step(step);
  for(const target of ['flexible-growth-v1','linear-v1','aaoi-capacity-ramp-v1']){
   const trigger=h.get('#operating-profile'),before=structuredClone(h.state('AAOI'));
   trigger.focus();
   const focusCalls=[],prototype=Object.getPrototypeOf(trigger),focus=prototype.focus;
   prototype.focus=function(options){focusCalls.push({node:this,options});return focus.call(this,options)};
   h.change('#operating-profile',target);prototype.focus=focus;
   const current=h.get('#operating-profile'),draft=h.state('AAOI');
   assert.notEqual(current,trigger,'render replaces the initiating node');
   assert.ok(h.focus()===current,`category ${step}, ${target}: focus follows the same logical control`);
   assert.equal(focusCalls.length,1,'restore once without an intermediate focus jump');
   assert.ok(focusCalls[0].node===current);assert.deepEqual(focusCalls[0].options,{preventScroll:true});
   assert.ok(h.app.descendants().includes(h.focus()),'focused node remains attached');
   assert.equal(current.value,target);assert.equal(draft.step,step);
   assert.deepEqual(scalarInputs(draft),scalarInputs(before));
   assert.deepEqual(draft.notes,before.notes);assert.deepEqual(draft.claims,before.claims);
   assert.deepEqual(draft.simulationConfig,before.simulationConfig);
   assert.equal(draft.operatingProfile.id,target);assert.equal(draft.assumptions.years,10);
   assert.ok(h.app.querySelectorAll('label').some(l=>l.getAttribute('for')==='operating-profile'));
  }
 }
});

test('growth path focus: the category selector retains itself for every company and supported pattern',async()=>{
 const h=await startStudio();
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);h.step(2);
  const modes=['immediate','maintain3','maintain5','annual3','annual5','legacy',...(company.ticker==='AAOI'?['staged']:[])];
  for(const mode of modes){
   const trigger=h.get('#growth-path-mode'),before=structuredClone(h.state(company.ticker));
   trigger.focus();h.change('#growth-path-mode',mode);
   assert.ok(h.focus()===h.get('#growth-path-mode'),`${company.ticker}, ${mode}`);
   assert.ok(h.app.descendants().includes(h.focus()));
   assert.equal(h.get('#growth-path-mode').value,mode);assert.equal(h.state(company.ticker).step,2);
   assert.deepEqual(scalarInputs(h.state(company.ticker)),scalarInputs(before));
   assert.deepEqual(h.state(company.ticker).notes,before.notes);
  }
 }
});

test('growth path focus: global selection keeps later annual edits, maturity Undo and saved restoration usable',async()=>{
 const h=await startStudio();h.change('#current-company','AAOI');h.step(3);
 h.get('#operating-profile').focus();h.change('#operating-profile','flexible-growth-v1');
 assert.ok(h.focus()===h.get('#operating-profile'));h.step(2);
 h.change('#growth-path-mode','annual3');h.change('#growth-maturity','20');
 assert.equal(h.focus(),h.get('#growth-maturity'));
 const input=h.get('#growth-year-2');input.focus();h.input('#growth-year-2','31');h.flush();
 assert.equal(h.focus(),input);assert.equal(h.get('#growth-year-2'),input);
 h.get('#undo-growth-path').click();assert.equal(h.state('AAOI').assumptions.years,10);
 assert.equal(h.state('AAOI').operatingProfile.subsequentGrowth[0],.31);
 assert.equal(h.focus(),h.get('#growth-path-mode'));
 h.get('#growth-year-2').focus();h.input('#growth-year-2','');h.flush();
 assert.ok(h.get('.valuation-unavailable'));assert.equal(h.get('#simulation-lab').innerHTML,'');
 h.input('#growth-year-2','31');h.flush();assert.equal(h.get('.valuation-unavailable'),null);
 const restored=await startStudio({storage:h.storage});
 assert.equal(restored.get('#growth-path-mode').value,'annual3');
 assert.equal(restored.get('#growth-year-2').value,'31');
 assert.equal(restored.state('AAOI').assumptions.years,10);
});
