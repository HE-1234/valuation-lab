import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';
import {currentSnapshot,calculateCurrent} from '../dist/current-model.js';

const hook=h=>JSON.parse(h.get('#guided-results').getAttribute('data-sensitivity'));
test('Guided sensitivity withholds stale values for invalid inputs and restores after repair',async()=>{
 const h=await startStudio();assert.ok(hook(h).rows.length);
 for(const [selector,invalid,repair] of [['#g-growth','','10'],['#g-wacc','1','9'],['#g-terminalGrowth','6','2']]){
  h.input(selector,invalid);h.flush();
  assert.equal(hook(h),null);assert.equal(JSON.parse(h.get('#guided-results').getAttribute('data-bridge')),null);
  assert.match(h.get('#guided-results').textContent,/Value withheld/);
  h.input(selector,repair);h.flush();assert.ok(hook(h).rows.length);
 }
});
test('Guided sensitivity uses the current model and claims-adjusted per-share endpoints',async()=>{
 const h=await startStudio();
 for(const ticker of ['AAPL','AAOI','COHR']){
  h.change('#current-company',ticker);h.flush();
  const d=h.state(ticker),c=h.library.companies.find(x=>x.ticker===ticker),raw=c.snapshots.find(x=>x.id===d.snapshotId),s=currentSnapshot(c,raw),data=hook(h);
  const clean=x=>Number.isFinite(x)?Number(x.toPrecision(8)):null;
  assert.equal(data.base,clean(calculateCurrent(s,d).perShare));
  for(const row of data.rows)for(const sign of [-1,1]){
   const a={...d.assumptions,[row.key]:row.relative?d.assumptions[row.key]*(1+sign*row.step):d.assumptions[row.key]+sign*row.step};
   let expected=null;try{expected=clean(calculateCurrent(s,{...d,assumptions:a}).perShare)}catch{}
   assert.equal(row[sign<0?'low':'high'],expected,`${ticker} ${row.key} ${sign}`);
  }
 }
});
test('Guided sensitivity respects authored annual growth and independent capital modes',async()=>{
 const h=await startStudio();
 for(const mode of ['immediate','maintain3','maintain5','annual3','annual5','legacy']){
  h.change('#growth-path-mode',mode);h.flush();
  assert.ok(hook(h)?.rows.some(r=>r.key==='growth'),mode);
 }
 h.change('#growth-path-mode','annual5');h.input('#growth-year-3','');h.flush();assert.equal(hook(h),null);
 h.input('#growth-year-3','10');h.flush();assert.ok(hook(h).rows.length);
 h.step(4);h.change('#guided-capital-mode','phased');h.flush();assert.ok(hook(h).rows.some(r=>r.key==='salesCapital'));
 h.input('#guided-capital-laterSalesCapital','');h.flush();assert.equal(hook(h),null);
 h.input('#guided-capital-laterSalesCapital','4');h.flush();assert.ok(hook(h).rows.length);
 h.change('#guided-capital-mode','existing');h.flush();assert.ok(hook(h).rows.length);
});
test('Guided Story impact states maximum movement, not symmetric valuation changes',async()=>{
 const fs=await import('node:fs');const source=fs.readFileSync(new URL('../dist/skins/report-journey.js',import.meta.url),'utf8');
 assert.ok(source.includes("moves: '{d} → value changes by up to {pct}'"));
 assert.ok(source.includes("moves: '{d} → 价值最多变动 {pct}'"));
 assert.ok(!source.includes("moves: '{d} → value ±{pct}'"));
 const h=await startStudio(),d=hook(h),r=d.rows.find(r=>r.key==='growth');
 assert.notEqual(Math.round((d.base-r.low)*100),Math.round((r.high-d.base)*100),'The real endpoints are asymmetric.');
});
test('Guided Story reduced-motion rule targets its pseudo-element outside :is()',async()=>{
 const fs=await import('node:fs');const css=fs.readFileSync(new URL('../dist/skins/report.css',import.meta.url),'utf8');
 assert.match(css,/@media \(prefers-reduced-motion: reduce\) \{ & body \.rx-tn-plot > i, & body \.rx-story-impact::before \{ transition: none !important; \} \}/);
 assert.doesNotMatch(css,/:is\([^)]*\.rx-story-impact::before/);
});

test('Risk reality-check denominator is explicitly operating enterprise value in both languages',()=>{
 const src=fs.readFileSync(new URL('../dist/skins/report-journey.js',import.meta.url),'utf8');
 assert.match(src,/checkRisk: '\{pct\} of operating value/);
 assert.match(src,/checkRisk: '营业价值中有 \{pct\}/);
 assert.match(src,/b\.terminalPV \/ b\.enterprise/);
});
