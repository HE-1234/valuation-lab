// Parsed-workspace copy contracts; this is not native browser layout evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {incrementalRecord} from '../dist/incremental-registry.js';
import {mountResearchWorkspace} from '../dist/research-view.js';
import {calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {annualLabel} from '../dist/annual-localization.js';
import {setLocale} from '../dist/i18n.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';

const root=new URL('../dist/',import.meta.url);
const fetcher=async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL(path.replace(/^\.\//,''),root)))});
const start=(extra={})=>startResearchWorkspace({fetcher,...extra,workspaceMount:(root,options)=>mountResearchWorkspace(root,{...options,catalogBundle:undefined})});
const incomplete='Common-share output is withheld until the dated funding and ownership bridge is complete.';

for(const locale of ['en','zh-Hans'])test(`company copy ${locale}: UBER toolbar identifies derived TTM without relabeling other anchors`,async()=>{
 setLocale(locale);const h=await start();
 try{
  for(const [ticker,label]of [['UBER','Source-derived TTM'],['AMD','Source-derived TTM'],['ONTO','Rolling reported-period reference'],['NFLX','Reported fiscal year']]){
   h.choose(ticker);const toolbar=h.get('.toolbar-period'),record=incrementalRecord(ticker);
   assert.equal(toolbar.querySelector('small').textContent,annualLabel(label),ticker);
   assert.equal(toolbar.querySelector('b').getAttribute('title'),record.annualCase.anchor.period,ticker+' retained period');
   assert.deepEqual(h.getState().draft.anchor,record.annualCase.anchor,ticker+' immutable source anchor');
  }
  h.choose('UBER');assert.equal(h.getState().draft.anchor.kind,'source_derived_ttm');
  assert.equal(h.getState().draft.anchor.revenue,55227);assert.equal(h.getState().draft.discountOrigin,'2026-06-30');
  assert.doesNotMatch(h.get('.toolbar-period').querySelector('small').textContent,/Reported fiscal year|已公布会计年度/);
 }finally{h.destroy();setLocale('en');}
});

for(const locale of ['en','zh-Hans'])test(`company copy ${locale}: NFLX summary scope appears once across selected, incomplete and cleared policies`,async()=>{
 setLocale(locale);const storage=new Map();let h=await start({storage});
 try{
  h.choose('NFLX');const record=incrementalRecord('NFLX'),openingEV=calculateResearchOperating(h.getState().draft).enterprise;
  const verify=(state,ready)=>{
   const summary=h.get('#research-results'),paragraphs=summary.querySelectorAll('p.annual-summary-caveat').filter(p=>p.parentElement===summary),scope=record.prose.scope[locale];
   assert.equal(paragraphs.filter(p=>p.textContent===scope).length,1,state+' full dated scope exactly once');
   assert.equal(paragraphs.length,ready?1:2,state+' distinct incomplete warning retained');
   assert.equal(paragraphs.filter(p=>p.textContent===annualLabel(incomplete)).length,ready?0:1,state+' incomplete wording');
   const draft=h.getState().draft,op=calculateResearchOperating(draft),timing=researchTimingResult(draft,op),bridge=calculateResearchBridge(draft,timing.enterprise,{calculationDate:timing.date});
   assert.equal(op.enterprise,openingEV,state+' unchanged operating value');
   assert.equal(Number.isFinite(bridge.rawPerShare),ready,state+' allocation readiness');
   assert.equal(bridge.current_target,null,state+' no current target');
   assert.equal(bridge.priceComparisonEligible,false,state+' no price comparison');
   assert.deepEqual(draft.anchor,record.annualCase.anchor,state+' retained FY2025 anchor');
   for(const key of ['claims','awards','tax','financing'])assert.ok(summary.textContent.includes(record.prose[key][locale]),state+' detailed '+key+' caveat');
  };
  verify('initial',false);
  h.get('[data-nflx-example]').click();verify('selected',true);
  h.input('[data-nflx-policy="operating_cash_reserve"]','');verify('incomplete selected policy',false);
  h.get('[data-nflx-example]').click();verify('selected again',true);
  h.get('[data-nflx-empty]').click();verify('empty policy',false);
  h.get('[data-nflx-example]').click();h.get('[data-nflx-clear]').click();verify('cleared',false);
  h.get('[data-nflx-example]').click();h.choose('AAPL');h.choose('NFLX');verify('company return',true);
  h.destroy();h=await start({storage});h.choose('NFLX');verify('saved selected reload',true);
 }finally{h.destroy();setLocale('en');}
});
