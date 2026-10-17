import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';
import {draftFor} from '../dist/current-model.js';
import {simulationDefaults} from '../dist/simulation.js';

test('base-case view: fresh companies load distinct researched inputs and nearby reasoning',async()=>{
 const h=await startStudio();const aapl=h.state().assumptions;assert.equal(h.state().assumptionProvenance.kind,'researched-base-case');assert.match(h.get('#base-case-state').textContent,/Researched base case/);assert.ok(h.get('.driver-rationale'));assert.match(h.get('.driver-rationale').textContent,/judgment|Research/i);
 h.change('#current-company','MSFT');assert.notDeepEqual(h.state('MSFT').assumptions,aapl);assert.equal(Number(h.get('#g-growth').value),h.baseCases.companies.MSFT.assumptions.growth*100);assert.match(h.get('#base-case-panel').textContent,/Reported reference points|Claims and model limits/);
});
test('base-case view: unmarked saved drafts stay untouched and visible load has a true undo',async()=>{
 const initial=await startStudio(),c=initial.library.companies.find(c=>c.ticker==='AAPL'),raw=c.snapshots.find(s=>s.id===c.currentSnapshotId),legacy=draftFor(c,raw);delete legacy.assumptionProvenance;legacy.assumptions.growth=.23;legacy.notes={growth:'Keep this thesis'};legacy.quote={...legacy.quote,price:123,date:'2026-10-16',currency:'USD',sourceUrl:'https://example.com/source',shareBasis:raw.shareBasis};legacy.step=2;
 const key=`valuation-lab-guided-v5:AAPL:${raw.id}`,storage=new Map([[key,JSON.stringify(legacy)]]),h=await startStudio({storage});
 assert.equal(h.state().assumptions.growth,.23);assert.match(h.get('#base-case-state').textContent,/Saved inputs kept/);assert.equal(h.get('#load-base-case').parent.tag,'div');assert.notEqual(h.get('#load-base-case').parent.attrs.id,'base-case-panel');
 h.get('#load-base-case').click();assert.equal(h.state().assumptions.growth,h.baseCases.companies.AAPL.assumptions.growth);assert.equal(h.state().notes.growth,'Keep this thesis');assert.equal(h.state().quote.price,123);assert.ok(h.get('#undo-base-case'));
 h.get('#undo-base-case').click();assert.equal(h.state().assumptions.growth,.23);assert.deepEqual(h.state().notes,legacy.notes);assert.deepEqual(h.state().quote,legacy.quote);assert.equal(h.get('#undo-base-case'),null);
});
test('base-case view: changing an input marks authorship without replacing the active control',async()=>{
 const h=await startStudio(),input=h.get('#g-growth');h.input('#g-growth','19');assert.equal(h.get('#g-growth'),input);assert.equal(h.state().assumptionProvenance.userEdited,true);assert.match(h.get('#base-case-state').textContent,/Your edits/);h.step(3);h.step(2);assert.equal(h.get('#g-growth').value,'19');
});
test('base-case view: custom simulation configurations are stored, restored and preserved by case load',async()=>{
 const h=await startStudio(),config=simulationDefaults(h.state().assumptions);config.drivers.growth={type:'uniform',low:.02,high:.14};h.mounts.at(-1).options.onConfigChange(config);assert.equal(h.state().simulationConfig.drivers.growth.type,'uniform');assert.ok(h.state().assumptionProvenance.editedKeys.includes('simulationConfig'));h.get('#load-base-case').click();assert.deepEqual(h.state().simulationConfig,config);
 const restored=await startStudio({storage:h.storage});assert.deepEqual(restored.state().simulationConfig,config);assert.deepEqual(restored.mounts.at(-1).draft.simulationConfig,config);
});
test('base-case view: missing research does not relabel saved researched inputs as generic',async()=>{
 const h=await startStudio(),before=h.state().assumptions,restored=await startStudio({storage:h.storage,baseCasesMissing:true});assert.deepEqual(restored.state().assumptions,before);assert.match(restored.get('.base-case-fallback').textContent,/Saved inputs retained/);assert.doesNotMatch(restored.get('.base-case-fallback').textContent,/Generic fallback/);assert.equal(restored.get('#load-base-case'),null);
});
test('base-case view: starting EBIT normalization and specialist cash-burn cautions are visible outside disclosures',async()=>{
 const h=await startStudio();h.change('#current-company','MU');const banner=h.get('.applied-normalization');assert.ok(banner);assert.match(banner.textContent,/35%|35/);assert.notEqual(banner.parent.tag,'details');assert.ok(h.state('MU').normalizationDelta<0);
 for(const ticker of ['AAOI','NBIS']){h.change('#current-company',ticker);const warning=h.get('.base-case-warning');assert.ok(warning,ticker);assert.match(warning.textContent,ticker==='AAOI'?/5 of 10/:/9 of 10/);assert.notEqual(warning.parent.tag,'details');if(ticker==='NBIS')assert.match(h.get('#guided-results').textContent,/withheld/i);else{assert.match(h.get('#guided-results').textContent,/limited-liability floor|equity floor/i);assert.match(h.get('#guided-results').textContent,/Raw common equity/);assert.equal(h.mounts.at(-1).ticker,'AAOI');}assert.match(h.get('#base-case-panel').textContent,/funding|financing|linear/i);}
});
test('base-case view: high-growth case remains coherent with the editable slider domain',async()=>{
 const h=await startStudio();h.change('#current-company','NBIS');assert.equal(Number(h.get('#g-growth').value),85);assert.ok(Number(h.get('[data-slider="growth"]').getAttribute('max'))>=85);assert.equal(h.get('[data-slider="growth"]').value,'85');
});
test('base-case view: rationale prose is a full-width sibling below its label/value heading',async()=>{
 const h=await startStudio(),row=h.get('.base-case-driver');assert.ok(row);assert.equal(row.tag,'article');const p=row.querySelector('p'),top=row.querySelector('.base-case-driver-top');assert.equal(p.parent,row);assert.equal(top.parent,row);assert.ok(top.querySelector('strong'));assert.notEqual(p.parent,top);assert.ok(row.querySelector('.base-case-current'));
});
