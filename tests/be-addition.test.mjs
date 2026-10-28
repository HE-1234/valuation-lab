import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsDefinition,claimsSensitivity} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
import {valueResolvedClaims,resolvedDefaults} from '../dist/resolved-claims.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('different-strike convertible holders select independently against a closed-form common-equity oracle',()=>{
 const notes=[{name:'Low strike',principal:100,carrying:98,conversionShares:10},{name:'High strike',principal:100,carrying:97,conversionShares:1},{name:'Middle strike',principal:150,carrying:149,conversionShares:5}];
 const def={id:'independent-series',commonShares:100,employeeAwardShares:0,fixedClaims:0,optionTranches:[],convertibleScenarios:notes,cautions:[],sources:[]};
 for(const enterprise of [-100,100,500,2000,5000,20000]){
  const debt=344,v=valueResolvedClaims({enterprise,assumptions:{otherAssets:0,otherClaims:0}},{cash:0,debt},{claims:resolvedDefaults(def)},def);
  const candidates=[];
  for(const low of [false,true])for(const high of [false,true])for(const mid of [false,true]){
   const choices=[low,high,mid],remaining=notes.reduce((n,x,i)=>n+(choices[i]?0:x.principal),0),shares=100+notes.reduce((n,x,i)=>n+(choices[i]?x.conversionShares:0),0);
   candidates.push(Math.max(0,(enterprise-remaining)/shares));
  }
  near(v.perShare,Math.min(...candidates));
  if(enterprise===2000){assert.equal(v.claimsBridge.conversionChoice,'mixed');assert.deepEqual(v.claimsBridge.conversionDecisions.map(x=>x.converted),[true,false,false]);near(v.perShare,1750/110);}
 }
});
test('BE uses the fully filed Q3 TTM and ten real annual history rows',()=>{
 const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json'),source=read('../scripts/guided-filing-data/BE.json'),h=read('../dist/data/company-history.json').companies.BE;
 const c=u.companies.find(c=>c.ticker==='BE');assert.equal(u.companies.filter(c=>c.ticker==='BE').length,1);assert.equal(guidedBasesFor(c).length,2);
 assert.equal(h.annual.length,10);assert.equal(h.annual[0].period,'FY2016');assert.equal(h.annual.at(-1).period,'FY2025');
 for(const raw of guidedBasesFor(c)){
  const s=currentSnapshot(c,raw),d=draftFor(c,raw,{baseCases:cases});d.cutoff='2026-10-23';
  assert.equal(d.assumptionProvenance.kind,'researched-base-case');assert.ok(Number.isFinite(calculateCurrent(s,d).perShare));assert.ok(claimsSensitivity(s,d).every(x=>Number.isFinite(x.perShare)));
  if(raw.snapshotMode==='ttm'){assert.equal(raw.periodEnd,'2026-09-30');assert.equal(raw.filedAt,'2026-10-22');assert.equal(raw.provisionalEarningsRelease,undefined);const f=source.snapshots.ttm.ttmComponents;near(s.revenue,f.annualRevenue+f.ytdRevenue-f.priorYtdRevenue);near(s.ebit,f.annualOperatingIncome+f.ytdOperatingIncome-f.priorYtdOperatingIncome);}
 }
});
test('BE separates converted notes and the settled Oracle warrant from outstanding securities',()=>{
 const u=read('../dist/data/current-universe.json'),c=u.companies.find(c=>c.ticker==='BE');
 const a=claimsDefinition(currentSnapshot(c,guidedBasesFor(c)[0])),q=claimsDefinition(currentSnapshot(c,guidedBasesFor(c)[1]));
 assert.equal(a.convertibleScenarios.length,3);assert.equal(q.convertibleScenarios.length,2);
 assert.ok(a.optionTranches.some(x=>x.strike===113.28));assert.ok(!q.optionTranches.some(x=>x.strike===113.28));
 assert.ok(!q.convertibleScenarios.some(x=>/2028/.test(x.name)));
 near(q.cappedCalls.reduce((n,x)=>n+x.shares*(x.cap-x.strike),0),255.31175588);
});
test('BE retains reported debt and EBIT while separating economic financing, deposits and affiliate-profit adjustments',()=>{
 const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json'),c=u.companies.find(c=>c.ticker==='BE');
 for(const raw of guidedBasesFor(c)){
  const ttm=raw.snapshotMode==='ttm',s=currentSnapshot(c,raw),d=draftFor(c,raw,{baseCases:cases});d.cutoff='2026-10-23';
  const def=claimsDefinition(s),v=calculateCurrent(s,d);
  near(raw.facts.debt,ttm?2666.063:2866.865);near(s.debt,ttm?2516.762:2666.354);
  near(raw.facts.operatingIncome,ttm?567.405:72.802);near(d.normalizationDelta,ttm?-37.722:-40.421);
  near(def.operatingCashReserve.amount,ttm?661.354:78.207);
  near(def.fixedClaims,ttm?49.622:51.629);
  near(v.claimsBridge.rows.find(x=>x.label==='Customer-prepayment cash reserve proxy').amount,def.operatingCashReserve.amount);
  if(ttm){assert.equal(v.claimsBridge.conversionChoice,'mixed');assert.deepEqual(v.claimsBridge.conversionDecisions.map(x=>x.converted),[false,true]);}
  const carrying=calculateCurrent(s,{...d,assumptions:{...d.assumptions,otherClaims:d.assumptions.otherClaims+raw.facts.debt-s.debt}});
  assert.ok(carrying.perShare<v.perShare);
 }
});
