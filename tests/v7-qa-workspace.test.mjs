import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';

test('v7 QA: every editable driver includes adjacent company evidence and sources',async()=>{
 const h=await startStudio();const groups={2:['growth'],3:['targetMargin','tax'],4:['salesCapital'],5:['wacc','terminalGrowth','terminalROIC'],6:['otherAssets','otherClaims']};
 for(const [step,keys]of Object.entries(groups)){h.step(Number(step));for(const key of keys){assert.ok(h.get('#g-'+key),key);const panel=h.get(`[data-history="${key}"]`);assert.ok(panel,key+' has no inline evidence');assert.ok(panel.querySelector('a'),key+' has no source link');}}
 h.step(1);assert.ok(h.get('[data-history="normalizationDelta"]'));
});
test('v7 QA: equity context, dated risk components and missing periods actually render beside inputs',async()=>{
 const h=await startStudio();h.step(6);assert.match(h.get('[data-history="otherAssets"]').textContent,/Cash|cash/);assert.match(h.get('[data-history="otherAssets"]').textContent,/FY202/);assert.match(h.get('[data-history="otherClaims"]').textContent,/Mapped debt|debt proxy/);
 h.step(5);assert.match(h.get('[data-history="wacc"]').textContent,/2026|2025/);assert.match(h.get('[data-history="wacc"]').textContent,/%/);
 h.change('#current-company','AAOI');h.step(3);const tax=h.get('[data-history="tax"]').textContent;assert.match(tax,/FY2021/);assert.match(tax,/Unavailable/i);const range=h.get('[data-history="tax"]').querySelector('.history-range');assert.ok(range);assert.match(range.textContent,/12\.5%/);assert.doesNotMatch(range.textContent,/\b0%/);
});
test('v7 QA: invalid assumptions synchronously withhold base value, chart and prior quote gap',async()=>{
 const h=await startStudio();h.input('#quote-price','150');h.input('#quote-date','2026-10-16');h.input('#quote-currency','USD');h.input('#quote-source','https://example.com/quote');h.change('#quote-share-basis',h.mounts[0].snapshot.shareBasis);h.flush();assert.match(h.get('#quote-comparison').textContent,/value-to-price gap/);
 const prior=h.mounts.at(-1);h.step(5);h.input('#g-wacc','1');assert.match(h.get('#guided-results').innerHTML,/withheld/i);assert.equal(prior.released,true);assert.equal(h.get('#simulation-lab').innerHTML,'');assert.doesNotMatch(h.get('#quote-comparison').textContent,/value-to-price gap/);h.flush();assert.equal(h.mounts.filter(m=>!m.released).length,0);
});
test('v7 QA: result caveats stay reachable and explicit provisional status is visible without assent',async()=>{
 const h=await startStudio();assert.ok(h.get('.model-caveats'));assert.match(h.app.textContent,/provisional/i);const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');assert.doesNotMatch(css,/\.value-column\s*>\s*\.model-caveats\s*\{\s*display\s*:\s*none/);
 for(let i=0;i<8;i++){h.step(i);assert.equal(h.app.querySelectorAll('[type="checkbox"]').length,0);}
});
test('v7 QA: absent optional history never prevents valuation or invents historical values',async()=>{
 const h=await startStudio({historyMissing:true});assert.match(h.get('#guided-results').innerHTML,/PROVISIONAL BASE CASE/);assert.equal(h.mounts.length,1);const e=h.get('[data-history="growth"]');assert.ok(e);assert.match(e.textContent,/unavailable|No sourced/i);assert.doesNotMatch(e.textContent,/Observed range/);
});
test('v7 QA: rapid valid edits debounce to the latest current-source simulation; switching cancels pending work',async()=>{
 const h=await startStudio();h.input('#g-growth','12');h.input('#g-growth','15');h.input('#g-growth','18');assert.equal(h.timers.size,1);h.flush();assert.equal(h.mounts.at(-1).draft.assumptions.growth,.18);
 h.input('#g-growth','19');h.change('#current-company','MSFT');h.flush();assert.equal(h.mounts.filter(m=>!m.released).length,1);assert.equal(h.mounts.at(-1).ticker,'MSFT');assert.equal(h.mounts.at(-1).draft.assumptions.growth,h.baseCases.companies.MSFT.assumptions.growth);
});
