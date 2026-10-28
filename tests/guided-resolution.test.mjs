import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsDefinition,claimsSensitivity,valueCurrentWithClaims} from '../dist/current-model.js';
import {callProxy,allocateAwards} from '../dist/resolved-claims.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json');
function fixture(ticker,mode='ttm'){const c=u.companies.find(c=>c.ticker===ticker),r=guidedBasesFor(c).find(s=>s.snapshotMode===mode),s=currentSnapshot(c,r),d=draftFor(c,r,{baseCases:cases});d.cutoff='2026-10-21';return {c,r,s,d};}
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
test('debt proxies preserve reported unknowns and have linear per-share materiality',()=>{
 for(const ticker of ['AAPL','META','ASML']){const {r,s,d}=fixture(ticker),p=r.guidedDebtProxy,v=calculateCurrent(s,d);assert.equal(r.facts.debt,null);assert.ok(r.missingFields.includes('debt'));near(s.debt,p.modelDebt);assert.equal(p.status,'explicit-proxy');
  near(calculateCurrent({...s,debt:p.sensitivity.highDebt},d).rawPerShare-v.rawPerShare,p.sensitivity.highDebtPerShareChange);
 }
});
test('option allocation matches a published textbook Black-Scholes case and conserves ownership value',()=>{
 near(callProxy(100,{strike:100,years:1,volatility:.2,rate:.05}),10.450583572,2e-5);
 const tranches=[{shares:2,strike:23,years:5,volatility:.6,rate:.04}];
 for(const method of ['option-proxy','intrinsic','free-awards']){const x=allocateAwards(1000,20,tranches,method);near(x.price*20+x.claim,1000);assert.ok(x.price>0&&x.price<=50);}
 near(allocateAwards(1000,20,tranches,'free-awards').price,1000/22);
});
test('Tesla annual and June match independent source reconciliation and option-pricing oracle',()=>{
 for(const [mode,expected] of [['annual-reference',25.6007400815],['ttm',25.7885352351]]){const {s,d}=fixture('TSLA',mode),v=calculateCurrent(s,d),def=claimsDefinition(s);near(v.perShare,expected,3e-6);assert.equal(s.raw.facts.shares,null);assert.equal(def.optionTranches.length,mode==='ttm'?1:2);assert.ok(v.claimsBridge.additionalClaims>2000);near(v.claimsBridge.basicShares,mode==='ttm'?3949-423.743904:3751-96-423.743904);}
});
test('dated ownership gate fails closed even if its marker is lost or direct caller bypasses currentIssues',()=>{
 for(const ticker of ['TSLA','NBIS']){const {s,d}=fixture(ticker);for(const mutate of [x=>delete x.raw.guidedClaimsResolutionId,x=>x.cash++,x=>x.sourceUrl+='?changed',x=>x.periodEnd='2026-06-29',x=>x.researchImported=true]){const x=structuredClone(s);mutate(x);assert.equal(claimsDefinition(x),null);assert.throws(()=>valueCurrentWithClaims(x,d),/matching source-dated ownership/);}
  assert.throws(()=>calculateCurrent(s,{...d,cutoff:'2026-10-20'}),/not available|after the valuation date/);
 }
});
test('Nebius convertible fair value replaces carrying debt and prefunded warrants enter only once',()=>{
 for(const [mode,premium,expectedShares,fixed]of [['annual-reference',819.3,258.754227,102.7],['ttm',12324.7,299.155245,222.4]]){const {s,d}=fixture('NBIS',mode),v=calculateCurrent(s,d),b=v.claimsBridge;near(b.allocationShares,expectedShares);near(b.rows.find(x=>x.label==='Convertible claim adjustment above carrying debt').amount,premium);near(b.rows.find(x=>x.label==='Disclosed minority and acquisition claims').amount,fixed);assert.equal(d.assumptions.otherClaims,0);near(b.equityBeforeWarrants,v.enterprise+s.cash+d.assumptions.otherAssets-s.debt-fixed-premium-100);assert.equal(v.perShare,0);assert.ok(v.rawPerShare<0);}
});
test('positive-equity Nebius stresses expose reserve and option effects hidden by a zero floor',()=>{
 const {s,d}=fixture('NBIS');d.assumptions.otherAssets+=60000;const base=calculateCurrent(s,d),stress=calculateCurrent(s,{...d,claims:{...d.claims,subsidiaryReserve:1000}});assert.ok(base.perShare>0);assert.ok(stress.perShare<base.perShare);assert.ok(base.perShare-stress.perShare<=900/base.claimsBridge.allocationShares+1e-7);
 const variants=claimsSensitivity(s,d);assert.ok(variants.every(x=>Number.isFinite(x.perShare)));assert.ok(variants.find(x=>x.changes.convertibleCase==='principal-only').perShare>base.perShare);
});
test('all offered Guided bases calculate while source records retain original missing values',()=>{
 let count=0;for(const c of u.companies)for(const r of guidedBasesFor(c)){const s=currentSnapshot(c,r),d=draftFor(c,r,{baseCases:cases});d.cutoff=u.asOf;assert.ok(Number.isFinite(calculateCurrent(s,d).perShare),r.id);count++;}assert.equal(count,102);
});
