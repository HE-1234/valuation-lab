// Runtime and markup contracts; this fixture is not a browser/layout/AT oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {calculateCurrent,currentSnapshot} from '../dist/current-model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function current(h,ticker='AMZN'){const c=h.library.companies.find(c=>c.ticker===ticker),d=h.state(ticker),r=c.snapshots.find(r=>r.id===d.snapshotId);return calculateCurrent(currentSnapshot(c,r),d)}
async function savedV1(years=15){const h=await startStudio();h.change('#current-company','AMZN');h.change('#growth-path-mode','annual5');h.change('#growth-maturity',String(years));h.input('#g-growth','14');for(let y=2;y<=5;y++)h.input('#growth-year-'+y,'14.5');const d=h.state('AMZN');d.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode:'annual',explicitYears:5,subsequentGrowth:[.145,.145,.145,.145]};h.storage.set(`valuation-lab-guided-v5:AMZN:${d.snapshotId}`,JSON.stringify(d));return startStudio({storage:h.storage})}
const timings=p=>({margin:p.marginMaturityYears,hold:p.capitalHoldYears,capital:p.capitalMaturityYears});

test('growth clarity: all five annual inputs are one ordered group, with one Year 1 source of truth and adjacent history',async()=>{
 const h=await savedV1(20),group=h.get('.annual-growth-group'),ids=group.querySelectorAll('input').map(el=>el.getAttribute('id'));
 assert.deepEqual(ids,['g-growth','growth-year-2','growth-year-3','growth-year-4','growth-year-5']);
 assert.equal(h.app.querySelectorAll('#g-growth').length,1);assert.equal(h.get('[data-slider="growth"]'),null);
 assert.equal(h.get('#g-growth').value,'14');for(let y=2;y<=5;y++)assert.equal(h.get('#growth-year-'+y).value,'14.5');
 assert.ok(h.get('.annual-growth-evidence').querySelector('[data-history="growth"]'));
 assert.ok(h.get('#assumption-editor').descendants().indexOf(h.get('#growth-year-5'))<h.get('#assumption-editor').descendants().indexOf(h.get('[data-history="growth"]')));
 const allIds=h.app.descendants().map(e=>e.getAttribute('id')).filter(Boolean);assert.equal(new Set(allIds).size,allIds.length);
 for(const id of ids){const el=h.get('#'+id);assert.ok(h.app.querySelectorAll('label').some(l=>l.getAttribute('for')===id));assert.ok(h.get('#'+el.getAttribute('aria-describedby')))}
});

test('growth clarity: three plain-language patterns and one original-model option separate duration from pattern',async()=>{
 const h=await startStudio();h.change('#growth-path-mode','annual5');const options=h.get('#growth-path-mode').querySelectorAll('option');
 assert.equal(options.length,4);assert.deepEqual(options.map(x=>x.textContent),['Fade from year 1','Hold the same growth','Set each year’s growth','Original model · 10 years']);
 assert.equal(h.get('#growth-explicit-years').value,'5');assert.deepEqual(h.get('#growth-explicit-years').querySelectorAll('option').map(x=>x.value),['3','5']);
 assert.doesNotMatch(h.get('#growth-path-mode').textContent,/Legacy|Flexible|annual[35]/);
 assert.ok(h.app.querySelectorAll('label').some(l=>l.getAttribute('for')==='growth-maturity'&&l.textContent==='Growth reaches stable rate in year'));
});

test('growth clarity: changing explicit period preserves capital timing and returns focus to the period control',async()=>{
 const h=await savedV1(15);h.change('#growth-explicit-years','3');const d=h.state('AMZN');
 assert.equal(d.operatingProfile.schemaVersion,2);assert.equal(d.operatingProfile.explicitYears,3);assert.deepEqual(timings(d.operatingProfile),{margin:15,hold:5,capital:15});
 assert.equal(h.get('#growth-path-mode').value,'annual3');assert.equal(h.focus(),h.get('#growth-explicit-years'));assert.equal(h.app.querySelectorAll('[data-annual-growth]').length,2);
 h.change('#growth-path-mode','maintain3');assert.deepEqual(timings(h.state('AMZN').operatingProfile),{margin:15,hold:5,capital:15});
 h.change('#growth-path-mode','immediate');assert.deepEqual(timings(h.state('AMZN').operatingProfile),{margin:15,hold:5,capital:15});assert.equal(h.get('#growth-explicit-years'),null);
});

test('growth clarity: saved v1 reload remains exact until an explicit edit',async()=>{
 const h=await savedV1(15);assert.equal(h.state('AMZN').operatingProfile.schemaVersion,1);near(current(h).perShare,72.70133835258687);
 const again=await startStudio({storage:h.storage});assert.deepEqual(again.state('AMZN').operatingProfile,h.state('AMZN').operatingProfile);near(current(again).perShare,current(h).perShare);
});

test('growth clarity: first 15-to-20 growth edit captures old timing before changing duration and Undo restores v1',async()=>{
 const h=await savedV1(15),before=h.state('AMZN').operatingProfile,value=current(h).perShare;
 h.change('#growth-maturity','20');assert.deepEqual(timings(h.state('AMZN').operatingProfile),{margin:15,hold:5,capital:15});near(current(h).perShare,74.91804270654117);
 h.get('#undo-growth-path').click();assert.deepEqual(h.state('AMZN').operatingProfile,before);assert.equal(h.state('AMZN').assumptions.years,15);near(current(h).perShare,value);
});

test('growth clarity: annual edit migrates at the existing horizon, retains the live input and fails closed while empty',async()=>{
 const h=await savedV1(20),input=h.get('#growth-year-3');input.focus();const value=current(h).perShare;
 h.input('#growth-year-3','14.5');assert.equal(h.state('AMZN').operatingProfile.schemaVersion,2);assert.deepEqual(timings(h.state('AMZN').operatingProfile),{margin:20,hold:5,capital:20});near(current(h).perShare,value);assert.equal(h.get('#growth-year-3'),input);assert.equal(h.focus(),input);
 h.input('#growth-year-3','');h.flush();assert.ok(h.get('.valuation-unavailable'));assert.equal(h.get('#simulation-lab').innerHTML,'');
 h.input('#growth-year-3','14.5');h.flush();near(current(h).perShare,value);assert.equal(h.get('.valuation-unavailable'),null);
});

test('growth clarity: Year 1 edit migrates without creating a second control or losing focus',async()=>{
 const h=await savedV1(15),input=h.get('#g-growth');input.focus();h.input('#g-growth','14');near(current(h).perShare,72.70133835258687);assert.equal(h.state('AMZN').operatingProfile.schemaVersion,2);assert.equal(h.get('#g-growth'),input);assert.equal(h.focus(),input);
 h.input('#g-growth','');assert.ok(h.get('.valuation-unavailable'));h.input('#g-growth','14');assert.equal(h.get('.valuation-unavailable'),null);
});

test('growth clarity: duration Undo preserves later annual edits and later independent timing edits',async()=>{
 const h=await savedV1(15);h.change('#growth-maturity','20');h.input('#growth-year-2','16');h.get('#undo-growth-path').click();assert.equal(h.state('AMZN').operatingProfile.schemaVersion,1);assert.equal(h.state('AMZN').operatingProfile.subsequentGrowth[0],.16);assert.equal(h.state('AMZN').assumptions.years,15);
 h.change('#growth-maturity','20');h.step(3);h.input('#timing-marginMaturityYears','12');h.step(2);h.get('#undo-growth-path').click();assert.equal(h.state('AMZN').assumptions.years,15);assert.equal(h.state('AMZN').operatingProfile.marginMaturityYears,12);assert.equal(h.state('AMZN').operatingProfile.schemaVersion,2);
});

test('growth clarity: growth shorter than profitability uses the full forecast but growth-scale reports its own endpoint',async()=>{
 const h=await savedV1(20);h.change('#growth-maturity','10');assert.equal(current(h).rows.length,20);assert.match(h.get('#guided-results').textContent,/20-year FCFF/);assert.match(h.get('#guided-results').textContent,/Growth reaches its stable rate in year 10; margin matures in year 20; capital efficiency matures in year 20/);assert.match(h.get('#growth-scale').textContent,/In year 10/);
 const revenue=current(h).rows[9].revenue.toLocaleString('en-US',{maximumFractionDigits:0});assert.ok(h.get('#growth-scale').textContent.includes(revenue));
 h.step(7);assert.match(h.get('#forecast-detail').textContent,/cash-flow forecast covers 20 years/);
});

test('growth clarity: independent timing fields update live, preserve focus, validate empty and ill-ordered anchors',async()=>{
 const h=await savedV1(15);h.step(3);const margin=h.get('#timing-marginMaturityYears');margin.focus();h.input('#timing-marginMaturityYears','10');assert.equal(h.focus(),margin);assert.equal(h.get('#timing-marginMaturityYears'),margin);assert.equal(h.state('AMZN').operatingProfile.marginMaturityYears,10);
 for(const value of ['',0,31,2.5]){h.input('#timing-marginMaturityYears',value);assert.ok(h.get('.valuation-unavailable'));h.input('#timing-marginMaturityYears',10);assert.equal(h.get('.valuation-unavailable'),null)}
 h.step(4);h.input('#timing-capitalHoldYears','0');h.input('#timing-capitalMaturityYears','10');assert.equal(h.state('AMZN').operatingProfile.capitalHoldYears,0);
 h.input('#timing-capitalHoldYears','10');assert.ok(h.get('.valuation-unavailable'));h.input('#timing-capitalHoldYears','0');assert.equal(h.get('.valuation-unavailable'),null);
 h.step(2);assert.match(h.get('#growth-path-help').textContent,/Margin matures in year 10; capital efficiency in year 10/);
});

test('growth clarity: 15-to-20-to-15 round trip and company/reload restoration preserve independent settings',async()=>{
 const h=await savedV1(15);h.input('#growth-year-2','14.5');const p=h.state('AMZN').operatingProfile,value=current(h).perShare;
 h.change('#growth-maturity','20');h.change('#growth-maturity','15');near(current(h).perShare,value);assert.deepEqual(h.state('AMZN').operatingProfile,p);
 h.change('#current-company','MSFT');h.change('#current-company','AMZN');assert.deepEqual(h.state('AMZN').operatingProfile,p);near(current(h).perShare,value);
 const restored=await startStudio({storage:h.storage});assert.deepEqual(restored.state('AMZN').operatingProfile,p);near(current(restored).perShare,value);
});

test('growth clarity: research load/Undo and frozen export retain both growth endpoint and full forecast',async()=>{
 const h=await savedV1(20);h.change('#growth-maturity','10');const prior=h.state('AMZN');h.get('#load-base-case').click();h.get('#undo-base-case').click();assert.deepEqual(h.state('AMZN').operatingProfile,prior.operatingProfile);assert.equal(h.state('AMZN').assumptions.years,10);
 h.step(7);h.get('#freeze-current').click();const out=JSON.parse(await h.downloads.at(-1).text());assert.equal(out.draft.assumptions.years,10);assert.equal(out.result.rows.length,20);assert.equal(out.result.operatingProfile.forecastYears,20);assert.equal(out.result.operatingProfile.marginMaturityYears,20);assert.deepEqual(out.draft.operatingProfile,prior.operatingProfile);
});

test('growth clarity: controls use theme tokens, fit mobile grid tracks and introduce no confirmation checkbox',()=>{
 const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8'),source=fs.readFileSync(new URL('../dist/guided.js',import.meta.url),'utf8');
 for(const cls of ['annual-growth-group','operating-timing-controls'])assert.match(css,new RegExp('\\.'+cls+'\\{[^}]*min-width:0'));
 assert.match(css,/\.operating-timing-inputs\{[^}]*minmax\(0,1fr\)/);assert.match(css,/@media\(max-width:480px\)\{[^\n]*\.operating-timing-inputs\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.operating-timing-controls\{[^}]*var\(--line\)[^}]*var\(--soft\)/);assert.doesNotMatch(source,/id="(?:growth|timing)[^"]*"[^>]*type="checkbox"/);
});
