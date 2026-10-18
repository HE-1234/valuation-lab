import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualCapitalDiagnostics} from '../dist/annual-capital-diagnostics.js';
import {annualCapitalDiagnosticsHTML} from '../dist/research-view.js';
import {researchDraftFor,calculateResearchOperating} from '../dist/research-model.js';

const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const fixture=()=>({anchor:{revenue:100},annual:[{year:1,revenue:120,margin:.2,taxRate:.25,reinvestment:10},{year:2,revenue:150,margin:.3,taxRate:.2,reinvestment:5}],terminal:{roic:.15}});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12,`${actual} != ${expected}`);

test('annual diagnostic uses same-year incremental sales and direct net investment, never revenue / a capital stock',()=>{
 const d=fixture(),before=structuredClone(d),first=annualCapitalDiagnostics(d),second=annualCapitalDiagnostics(d,1);
 assert.equal(first.deltaRevenue,20);assert.equal(first.effectiveMarginalSalesCapital,2);close(first.marginalAfterTaxReturnProxy,.3);
 assert.equal(second.deltaRevenue,30);assert.equal(second.effectiveMarginalSalesCapital,6);close(second.marginalAfterTaxReturnProxy,1.44);
 assert.equal(first.actualROIC,null);assert.equal(first.terminalROIC,.15);assert.deepEqual(d,before);
});

test('annual diagnostic rejects zero, negative or unknown growth/investment without manufacturing a ratio',()=>{
 for(const revenue of [100,90,0,-20,null,undefined,NaN,Infinity,'120']){
  const d=fixture();d.annual[0].revenue=revenue;const x=annualCapitalDiagnostics(d);
  assert.equal(x.effectiveMarginalSalesCapital,null);assert.equal(x.marginalAfterTaxReturnProxy,null);assert.ok(x.ratioReason);
 }
 for(const investment of [0,-10,null,undefined,NaN,Infinity,'10']){
  const d=fixture();d.annual[0].reinvestment=investment;const x=annualCapitalDiagnostics(d);
  assert.equal(x.effectiveMarginalSalesCapital,null);assert.equal(x.marginalAfterTaxReturnProxy,null);assert.ok(x.ratioReason);
 }
 const falling=fixture();falling.annual[0].revenue=90;falling.annual[0].reinvestment=-5;
 assert.equal(annualCapitalDiagnostics(falling).effectiveMarginalSalesCapital,null,'two negatives cannot become a useful positive ratio');
});

test('annual diagnostic requires the real preceding-year base and does not substitute the source anchor',()=>{
 const d=fixture();d.annual[0].revenue=null;
 assert.equal(annualCapitalDiagnostics(d,1).deltaRevenue,null);assert.equal(annualCapitalDiagnostics(d,1).effectiveMarginalSalesCapital,null);
 for(const index of [-1,1.5,5])assert.equal(annualCapitalDiagnostics(d,index).effectiveMarginalSalesCapital,null);
 assert.equal(annualCapitalDiagnostics(null).effectiveMarginalSalesCapital,null);
});

test('losses and invalid margin/tax inputs withhold only the return proxy; explicit zero margin remains zero',()=>{
 for(const [field,values]of [['margin',[-.2,null,undefined,NaN,Infinity,1.1]],['taxRate',[-.1,null,undefined,NaN,Infinity,.61]]])for(const value of values){
  const d=fixture();d.annual[0][field]=value;const x=annualCapitalDiagnostics(d);
  assert.equal(x.effectiveMarginalSalesCapital,2);assert.equal(x.marginalAfterTaxReturnProxy,null);assert.ok(x.proxyReason);
 }
 const d=fixture();d.annual[0].margin=0;assert.equal(annualCapitalDiagnostics(d).marginalAfterTaxReturnProxy,0);
 d.annual[0].margin=.2;d.annual[0].taxRate=0;assert.equal(annualCapitalDiagnostics(d).marginalAfterTaxReturnProxy,.4);
});

test('annual diagnostic refuses nonfinite and underflow ratios instead of Infinity or a false zero',()=>{
 const d=fixture();d.annual[0].reinvestment=Number.MIN_VALUE;
 assert.equal(annualCapitalDiagnostics(d).effectiveMarginalSalesCapital,null);
 d.anchor.revenue=Number.MIN_VALUE;d.annual[0].revenue=Number.MIN_VALUE*2;d.annual[0].reinvestment=Number.MAX_VALUE;
 assert.equal(annualCapitalDiagnostics(d).effectiveMarginalSalesCapital,null);
});

for(const c of cases)test(`${c.ticker}: diagnostics keep original annual economics and sources intact; actual ROIC stays unavailable`,()=>{
 const d=researchDraftFor(c),before=structuredClone(d),source=structuredClone(c),value=calculateResearchOperating(d).enterprise;
 for(let index=0;index<d.annual.length;index++){
  const x=annualCapitalDiagnostics(d,index),html=annualCapitalDiagnosticsHTML(c,d,index);
  assert.equal(x.actualROIC,null);assert.match(x.actualROICReason,/No verified starting invested-capital base/);
  assert.match(html,/not actual ROIC/);assert.match(html,/separate mature-return assumption/);assert.match(html,/buildouts/);
  assert.match(html,/reviewed annual inputs/);assert.match(html,new RegExp(`evidence-${c.ticker}.html#selected-case`));
 }
 assert.deepEqual(d,before);assert.deepEqual(c,source);assert.equal(calculateResearchOperating(d).enterprise,value);
});

test('unsourced capital-like fields do not silently enable actual ROIC',()=>{
 const d=fixture();d.anchor.investedCapital=50;d.startingInvestedCapital=50;d.actualROIC=.99;
 assert.equal(annualCapitalDiagnostics(d).actualROIC,null);
});

test('diagnostic display retains very small and very large positive values without rounding to a false zero or overflowing a percentage',()=>{
 const c=cases[0],d=researchDraftFor(c);d.annual[0].reinvestment=1e20;
 let html=annualCapitalDiagnosticsHTML(c,d);
 assert.match(html,/data-annual-capital-diagnostic="ratio">[\d.]+E-\d+×/);
 assert.match(html,/data-annual-capital-diagnostic="proxy">[\d.]+E-\d+%/);
 d.anchor.revenue=1;d.annual[0].revenue=2;d.annual[0].reinvestment=1e-308;d.annual[0].margin=.5;d.annual[0].taxRate=0;
 html=annualCapitalDiagnosticsHTML(c,d);assert.match(html,/data-annual-capital-diagnostic="proxy">5E309%/);assert.doesNotMatch(html,/Infinity|Not computed%/);
});
