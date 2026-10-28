import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsDefinition,claimsSensitivity,claimsIssues} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
import {valueResolvedClaims,resolvedDefaults,resolvedIssues} from '../dist/resolved-claims.js';
import {simulateCurrent} from '../dist/simulation.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const universe=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json');
const tickers=['ORCL','DELL','ALAB','ADBE'];
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function fixture(t,mode='ttm'){
 const company=universe.companies.find(c=>c.ticker===t),raw=guidedBasesFor(company).find(r=>r.snapshotMode===mode);
 const snapshot=currentSnapshot(company,raw),draft=draftFor(company,raw,{baseCases:cases});draft.cutoff='2026-10-21';
 return {company,raw,snapshot,draft};
}
test('the four requested companies supply eight unique source-dated annual/TTM bases',()=>{
 for(const t of tickers){
  assert.equal(universe.companies.filter(c=>c.ticker===t).length,1,t);
  const source=read(`../scripts/guided-filing-data/${t}.json`);
  assert.equal(guidedBasesFor(fixture(t).company).length,2,t);
  for(const [kind,mode]of [['annual','annual-reference'],['ttm','ttm']]){
   const {raw,snapshot,draft}=fixture(t,mode),s=source.snapshots[kind];
   assert.equal(raw.periodEnd,s.periodEnd);assert.equal(raw.sourceUrl,s.sourceUrl);
   assert.ok(s.filedAt<='2026-10-21');assert.equal(draft.assumptionProvenance.kind,'researched-base-case');
   near(snapshot.revenue,s.revenue);near(snapshot.ebit,s.operatingIncome);
   near(snapshot.cash,s.cashAndEquivalents+s.shortTermInvestments);
   near(raw.facts.debt,s.debtCurrent+s.debtNoncurrent);
   assert.ok(Number.isFinite(calculateCurrent(snapshot,draft).perShare));
   if(kind==='ttm'){const c=s.ttmComponents;near(s.revenue,c.annualRevenue+c.ytdRevenue-c.priorYtdRevenue);near(s.operatingIncome,c.annualOperatingIncome+c.ytdOperatingIncome-c.priorYtdOperatingIncome);}
  }
 }
});
test('mandatory preferred conversion reconciles shares and remaining dividends independently across scenarios',()=>{
 const definition={id:'test-preferred',evidenceAsOf:'2026-10-21',commonShares:100,employeeAwardShares:5,commonEquivalentShares:20,
  fixedClaims:7,optionTranches:[],operatingCashReserve:{amount:12},mandatoryConversion:{minimumShares:10,maximumShares:20,dividendPresentValue:30,undiscountedDividends:40},cautions:[],sources:[]};
 for(const enterprise of [-100,100,1000])for(const sharesCase of ['minimum','maximum'])for(const dividendCase of ['discounted','undiscounted'])for(const reserveFraction of [0,.5,1]){
  const claims={...resolvedDefaults(definition),mandatoryConversionCase:sharesCase,preferredDividendTreatment:dividendCase,operatingCashReserveFraction:reserveFraction};
  const value=valueResolvedClaims({enterprise,assumptions:{otherAssets:4,otherClaims:0}},{cash:20,debt:50},{claims},definition);
  const shares=105+(sharesCase==='minimum'?10:20),dividends=dividendCase==='discounted'?30:40,equity=enterprise+20+4-50-7-dividends-12*reserveFraction;
  near(value.rawPerShare,equity/shares);near(value.perShare,Math.max(0,equity/shares));near(value.claimsBridge.allocationShares,shares);
  near(value.claimsBridge.additionalClaims,7+dividends+12*reserveFraction);
  assert.deepEqual(resolvedIssues(definition,claims,{cutoff:'2026-10-21'}),[]);
 }
 const invalid={...resolvedDefaults(definition),mandatoryConversionCase:'invented'};
 assert.ok(resolvedIssues(definition,invalid,{cutoff:'2026-10-21'}).some(x=>x.includes('mandatory-conversion')));
});
test('Oracle preferred shares replace the principal claim and show dividend and share-collar sensitivities',()=>{
 for(const mode of ['annual-reference','ttm']){
  const {snapshot,draft,raw}=fixture('ORCL',mode),d=claimsDefinition(snapshot),v=calculateCurrent(snapshot,draft);
  assert.ok(raw.facts.preferredEquity>0);near(d.mandatoryConversion.minimumShares,24.99063);near(d.mandatoryConversion.maximumShares,31.238285);
  near(d.fixedClaims,mode==='ttm'?4617:5571);near(d.operatingCashReserve.amount,mode==='ttm'?15955:4592);
  const dates=d.mandatoryConversion.paymentDates;assert.equal(dates.length,mode==='ttm'?10:11);
  near(d.mandatoryConversion.dividendPresentValue,dates.reduce((pv,date)=>pv+81.25/1.065**((Date.parse(date)-Date.parse(raw.periodEnd))/86400000/365.25),0));
  near(v.claimsBridge.allocationShares,d.commonShares+d.employeeAwardShares+31.238285);
  near(v.claimsBridge.rows.find(x=>x.label==='Remaining preferred dividends').amount,d.mandatoryConversion.dividendPresentValue);
  const variants=claimsSensitivity(snapshot,draft);assert.ok(variants.every(x=>Number.isFinite(x.perShare)));
  const minimum=variants.find(x=>x.changes.mandatoryConversionCase==='minimum');assert.ok(minimum.perShare>=v.perShare);
  const nominal=variants.find(x=>x.changes.preferredDividendTreatment==='undiscounted');assert.ok(nominal.perShare<=v.perShare);
  assert.ok(claimsIssues(snapshot,{...draft,claims:{...draft.claims,mandatoryConversionCase:'invented'}}).length);
 }
});
test('Astera customer warrants are allocated once and Adobe includes acquired unvested awards',()=>{
 const annual=fixture('ALAB','annual-reference'),interim=fixture('ALAB');
 const a=claimsDefinition(annual.snapshot),q=claimsDefinition(interim.snapshot);
 near(a.fixedClaims,0);near(q.fixedClaims,5);
 near(a.optionTranches.find(x=>x.strike===20.34).shares,2.316175);
 near(q.optionTranches.find(x=>x.strike===142.82).shares,3.262299);
 near(a.optionTranches.find(x=>x.strike===.3).shares,.126185);
 assert.ok(!q.optionTranches.some(x=>x.strike===.3),'exercised bank warrants are already common shares');
 near(interim.snapshot.shares,173.485+9.555);
 for(const [mode,common,awards,debt]of [['annual-reference',413,8.5,6210],['ttm',391,13.4,6363]]){
  const {snapshot,draft,raw}=fixture('ADBE',mode);near(snapshot.shares,common+awards);near(snapshot.debt,debt);
  assert.equal(raw.facts.longTermInvestments,null);near(draft.assumptions.otherAssets,0);near(draft.assumptions.otherClaims,12);
 }
 const h=read('../dist/data/company-history.json');assert.equal(h.companies.ALAB.annual.length,4);assert.ok(h.companies.ALAB.coverage.shortfallReason);
 assert.equal(h.companies.ADBE.annual.length,10);assert.equal(h.companies.ADBE.baseObservation.period,'FY2015');
});
test('simulation retains each new company dated ownership allocation',()=>{
 for(const t of tickers){const {snapshot,draft}=fixture(t),v=calculateCurrent(snapshot,draft),simulation=simulateCurrent(snapshot,draft,{trials:5,seed:'next-four'});assert.equal(simulation.accepted,5);for(const draw of simulation.draws)near(draw,v.perShare);}
});
test('Dell includes all common classes and financing debt, while historical scope changes remain explicit',()=>{
 for(const [mode,shares,debt,investments]of [['annual-reference',652,31503,1730],['ttm',640,34466,2679]]){
  const {snapshot,draft}=fixture('DELL',mode),d=claimsDefinition(snapshot);
  near(d.commonShares,shares);near(snapshot.shares,shares+19);near(snapshot.debt,debt);
  near(draft.assumptions.otherAssets,investments);near(d.fixedClaims,248);
  near(d.optionTranches[0].shares,2.5);near(d.optionTranches[0].strike,141.77);
 }
 const h=read('../dist/data/company-history.json').companies.DELL;
 assert.equal(h.annual.length,10);assert.equal(h.baseObservation.period,'FY2016');
 assert.equal(h.annual.find(r=>r.period==='FY2020').metrics.bookSalesCapitalProxy.rangeEligible,false);
 assert.equal(h.annual.find(r=>r.period==='FY2022').metrics.bookROICProxy.rangeEligible,false);
});
