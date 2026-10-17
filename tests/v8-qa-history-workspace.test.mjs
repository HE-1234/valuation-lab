// Minimal DOM assertions do not establish native browser layout or touch behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {renderHistorySeries} from '../dist/history-view.js';
import {assumptionEvidence} from '../dist/assumption-history.js';
const history=JSON.parse(fs.readFileSync(new URL('../dist/data/company-history.json',import.meta.url)));
test('v8 QA: all ten exact annual rows use a two-column disclosure instead of ten compressed phone columns',async()=>{
 const h=await startStudio();h.step(2);const panel=h.get('[data-history="growth"]'),series=panel.querySelector('.history-series'),years=series.querySelector('.history-years');
 assert.equal(series.getAttribute('data-observations'),'10');assert.ok(years);assert.equal(years.tag,'details');assert.match(years.querySelector('summary').textContent,/All 10 annual observations/);
 const table=years.querySelector('table');assert.equal(table.querySelector('thead').querySelectorAll('th').length,2);assert.equal(table.querySelector('tbody').querySelectorAll('[scope="row"]').length,10);assert.equal(panel.querySelectorAll('.history-point').length,0);
 for(const row of history.companies.AAPL.annual){assert.ok(years.textContent.includes(row.period));assert.ok(years.textContent.includes(row.periodEnd));}
 const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');assert.match(css,/\.assumption-history \.history-series\{[^}]*display:block[^}]*overflow:visible/);assert.match(css,/\.history-years table\{[^}]*width:100%[^}]*table-layout:fixed/);
});
test('v8 QA: coverage shortfalls and business-perimeter cautions stay visible above annual disclosures',async()=>{
 const h=await startStudio();
 for(const ticker of ['NBIS','COHR','LITE','AVGO']){h.change('#current-company',ticker);h.step(2);const panel=h.get('[data-history="growth"]'),coverage=panel.querySelector('.history-coverage');assert.ok(coverage,ticker);assert.equal(coverage.parent,panel,ticker+' caution buried inside details');assert.match(coverage.textContent,ticker==='NBIS'?/three|3 reported/:ticker==='COHR'?/II-VI|acquisition/:/acquisition/i);}
});
test('v8 QA: evidence navigation leaves the live simulation mounted; rapid edits update only the latest draft',async()=>{
 const h=await startStudio(),initial=h.mounts.at(-1);h.step(3);h.step(4);h.step(5);h.step(2);assert.equal(initial.released,false);assert.equal(h.mounts.length,1);
 const input=h.get('#g-growth');h.input('#g-growth','17');h.input('#g-growth','18');assert.equal(h.get('#g-growth'),input);assert.equal(h.timers.size,1);h.flush();assert.equal(h.mounts.at(-1).draft.assumptions.growth,.18);assert.equal(h.mounts.filter(m=>!m.released).length,1);
 h.step(5);h.input('#g-wacc','1');assert.match(h.get('#guided-results').innerHTML,/withheld/i);assert.equal(h.get('#simulation-lab').innerHTML,'');
});
test('v8 QA: unavailable and outlier values remain exact in the full annual evidence table',()=>{
 const tax=assumptionEvidence(history,'AAOI','tax'),html=renderHistorySeries(tax.series,tax.unit,tax.title);assert.match(html,/FY2016/);assert.match(html,/-48\.7%/);assert.match(html,/FY2017/);assert.match(html,/12\.5%/);assert.match(html,/FY2025/);assert.match(html,/Unavailable/);assert.match(html,/Pretax income is zero or negative/);assert.match(html,/2 available/);
 const cohr=assumptionEvidence(history,'COHR','growth'),cohrHtml=renderHistorySeries(cohr.series,cohr.unit,cohr.title);assert.match(cohrHtml,/legacy II-VI/i);assert.match(cohrHtml,/excluded from the summary range/i);assert.match(cohrHtml,/Gaps \/ basis changes/);
});
