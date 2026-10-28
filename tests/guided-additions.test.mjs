import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,financialDefinition,claimsDefinition,claimsSensitivity,valueCurrentWithClaims} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
import {assumptionEvidence} from '../dist/assumption-history.js';
import {simulateCurrent} from '../dist/simulation.js';
import {valueResolvedClaims,resolvedDefaults} from '../dist/resolved-claims.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json'),history=read('../dist/data/company-history.json');
const tickers=['MA','SPGI','DUOL','RDDT','HOOD','RKLB','NKE','CMG','CRWD','PANW','BAM','APP','COST','QCOM'];
const near=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function fixture(ticker,mode='ttm'){const c=u.companies.find(c=>c.ticker===ticker),r=guidedBasesFor(c).find(r=>r.snapshotMode===mode)||guidedBasesFor(c)[0],s=currentSnapshot(c,r),d=draftFor(c,r,{baseCases:cases});d.cutoff='2026-10-21';return {c,r,s,d};}
test('fourteen requested additions offer 26 dated bases without duplicate MCD or MRVL',()=>{
 assert.equal(u.companies.length,56);let bases=0;
 for(const t of [...tickers,'MCD','MRVL'])assert.equal(u.companies.filter(c=>c.ticker===t).length,1,t);
 for(const t of tickers){const {c}=fixture(t);for(const r of guidedBasesFor(c)){const d=draftFor(c,r,{baseCases:cases});d.cutoff='2026-10-21';assert.equal(d.assumptionProvenance.kind,'researched-base-case',r.id);assert.ok(Number.isFinite(calculateCurrent(currentSnapshot(c,r),d).perShare),r.id);bases++;}}
 assert.equal(bases,26);for(const t of ['COST','PANW'])assert.equal(guidedBasesFor(fixture(t).c).length,1);
});
test('all new TTM flows recompute from the dated annual and comparable YTD components',()=>{
 for(const t of tickers){const source=read(`../scripts/guided-filing-data/${t}.json`);for(const [kind,s]of Object.entries(source.snapshots)){assert.ok(s.filedAt<='2026-10-21');if(kind!=='ttm')continue;const x=s.ttmComponents;near(s.revenue,x.annualRevenue+x.ytdRevenue-x.priorYtdRevenue);near(s.operatingIncome,x.annualOperatingIncome+x.ytdOperatingIncome-x.priorYtdOperatingIncome);}}
});
function equityOracle(s,d){const a=d.assumptions;let revenue=s.revenue,disc=1,pv=0;const start=s.ebit/s.revenue;for(let y=1;y<=10;y++){const g=a.growth+(a.terminalGrowth-a.growth)*(y-1)/9,next=revenue*(1+g),earnings=next*(start+(a.targetMargin-start)*y/10);const tax=Math.max(0,earnings)*a.tax,newEquity=Math.max(0,(next-revenue)/a.salesCapital);disc*=1+a.wacc;pv+=(earnings-tax-newEquity)/disc;revenue=next;}const terminalIncome=revenue*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax);return (pv+terminalIncome*(1-a.terminalGrowth/a.terminalROIC)/(a.wacc-a.terminalGrowth)/disc+s.cash+a.otherAssets-s.debt-a.otherClaims)/s.shares;}
test('HOOD and BAM use shareholder earnings, required equity and cost of equity with an independent cash-flow oracle',()=>{
 for(const t of ['HOOD','BAM'])for(const mode of ['annual-reference','ttm']){const {r,s,d}=fixture(t,mode),v=calculateCurrent(s,d),fm=financialDefinition(s);assert.equal(v.valuationMethod,'equity-cashflow');near(v.rawPerShare,equityOracle(s,d));near(s.shares,fm.commonShares+fm.unvestedAwards+fm.dilutionProxyShares);assert.equal(d.assumptions.otherClaims,0);assert.equal(d.assumptions.otherAssets,0);assert.equal(r.revenue,fm.reportedRevenue);assert.equal(r.EBIT,fm.reportedOperatingIncome);if(t==='BAM'){assert.equal(s.cash,0);assert.equal(s.debt,0);assert.notEqual(s.revenue,r.revenue);}else if(mode==='ttm'){assert.equal(s.cash,1757);assert.equal(s.debt,2208);assert.equal(fm.corporateConvertibleBridge.convertibleSharesAdded,0);}}
});
test('financial models fail closed on changed source, model marker, cash or shares',()=>{
 for(const t of ['HOOD','BAM']){const {s,d}=fixture(t);for(const mutate of [x=>delete x.raw.financialModelId,x=>x.raw.revenue++,x=>x.raw.shares++,x=>x.cash++,x=>x.sourceUrl+='?different']){const x=structuredClone(s);mutate(x);assert.equal(financialDefinition(x),null);assert.throws(()=>valueCurrentWithClaims(x,d),/matching dated shareholder/);}assert.throws(()=>calculateCurrent(s,{...d,cutoff:'2026-10-20'}),/after the selected|after the valuation/);}
});
test('simulation uses the same equity and complex-claims allocation as the visible base case',()=>{
 for(const t of ['HOOD','BAM','RKLB','RDDT']){const {s,d}=fixture(t),expected=calculateCurrent(s,d).perShare,result=simulateCurrent(s,d,{trials:7,seed:'new-guided-allocation'});assert.equal(result.accepted,7);for(const value of result.draws)near(value,expected);}
});
test('RKLB keeps preferred, future forward shares, proceeds and convertible alternatives separate',()=>{
 const {s,d}=fixture('RKLB'),def=claimsDefinition(s),v=calculateCurrent(s,d);near(def.commonEquivalentShares,40.95125);near(def.forwardSettlement.shares,7.4512);near(v.claimsBridge.allocationShares,def.commonShares+def.employeeAwardShares+40.95125+7.4512);
 assert.equal(v.claimsBridge.conversionChoice,'principal-only');near(v.claimsBridge.additionalAssets,432.2740257107605);assert.equal(s.cash,s.raw.facts.cash);
 const converted=calculateCurrent(s,{...d,claims:{...d.claims,convertibleCase:'if-converted'}});near(converted.claimsBridge.allocationShares-v.claimsBridge.allocationShares,2.607745);
 const high={...d,assumptions:{...d.assumptions,otherAssets:d.assumptions.otherAssets+20000}};const highValue=calculateCurrent(s,high);assert.equal(highValue.claimsBridge.conversionChoice,'if-converted');assert.ok(highValue.claimsBridge.rows.find(x=>x.label==='Capped-call asset scenario').amount>0);
 const variants=claimsSensitivity(s,high);assert.ok(variants.every(x=>Number.isFinite(x.perShare)));assert.ok(variants.find(x=>x.changes.forwardProceeds==='maximum').perShare>highValue.perShare);
});
test('RKLB capped-call and conversion allocation matches 324 independent closed-form cases',()=>{
 const source=read('../scripts/guided-filing-data/RKLB.json'),meta=read('../scripts/guided-filing-data/additions/RKLB.json');
 function exact(E,N,C,method){if(method==='omit')return Math.max(0,E/N);if(method==='maximum-payoff')return Math.max(0,(E+C.shares*(C.cap-C.strike))/N);if(E<=0)return 0;let p=E/N;if(p<=C.strike)return p;p=(E-C.shares*C.strike)/(N-C.shares);if(p<=C.cap)return p;return (E+C.shares*(C.cap-C.strike))/N;}
 let count=0;
 for(const kind of ['annual','ttm']){const s=source.snapshots[kind],p=meta.claimsPolicy[kind],snap={cash:s.cashAndEquivalents+s.shortTermInvestments,debt:(s.debtCurrent??meta.modelProxies[kind].debtCurrent.value)+s.debtNoncurrent},def={commonShares:s.sharesOutstanding,employeeAwardShares:s.unvestedRSUs,commonEquivalentShares:p.commonEquivalentShares,fixedClaims:p.fixedClaims,optionTranches:[],convertibleScenarios:p.convertibleScenarios,cappedCalls:p.cappedCalls,forwardSettlement:p.forwardSettlement,cautions:[],sources:[]};
  for(const EV of [-4000,-2500,-1500,0,1000,2000,3000,5000,15000])for(const method of ['intrinsic','omit','maximum-payoff'])for(const forward of ['minimum','maximum'])for(const choice of ['holder-choice','principal-only','if-converted']){
   const c={...resolvedDefaults(def),cappedCallTreatment:method,forwardProceeds:forward,convertibleCase:choice},v={enterprise:EV,assumptions:{otherAssets:s.longTermInvestments,otherClaims:0}},got=valueResolvedClaims(v,snap,{claims:c},def);
   const N=def.commonShares+def.employeeAwardShares+def.commonEquivalentShares+(p.forwardSettlement?.shares||0),F=p.forwardSettlement?.[forward==='maximum'?'presentValueMax':'presentValueMin']||0,before=EV+snap.cash+s.longTermInvestments-snap.debt-p.fixedClaims+F,cv=p.convertibleScenarios[0];
   const debt=exact(before+cv.carrying-cv.principal,N,p.cappedCalls[0],method),converted=exact(before+cv.carrying,N+cv.conversionShares,p.cappedCalls[0],method),want=choice==='holder-choice'?Math.min(debt,converted):choice==='principal-only'?debt:converted;
   near(got.perShare,want,1e-9);count++;
  }
 }assert.equal(count,324);
});
test('employee, founder and split adjustments do not reuse diluted EPS averages as actual shares',()=>{
 const duol=fixture('DUOL');near(duol.s.shares,duol.r.facts.periodEndShares+duol.r.facts.unvestedNonOptionAwards+.36);
 for(const mode of ['annual-reference','ttm']){const {r,s}=fixture('CRWD',mode);assert.ok(r.interpretationNotes.join(' ').match(/split/i));assert.ok(claimsDefinition(s).commonShares>1000);}
 const nike=fixture('NKE');assert.equal(nike.r.options.aggregateIntrinsicValue,0);assert.ok(calculateCurrent(nike.s,nike.d).claimsBridge.rows.find(x=>x.label==='Parent option and conditional-award claim proxy').amount>0);
 const panw=fixture('PANW');assert.equal(panw.d.assumptions.otherClaims,611);assert.ok(panw.r.reviewRequired.some(x=>/deferred|compensation/i.test(x)));
});
test('history preserves actual coverage, APP perimeter breaks and separate financial equity ratios',()=>{
 const expected={MA:10,SPGI:10,DUOL:7,RDDT:4,HOOD:7,RKLB:7,NKE:10,CMG:10,CRWD:10,PANW:10,BAM:4,APP:8,COST:10,QCOM:10};
 for(const [t,n]of Object.entries(expected)){assert.equal(history.companies[t].annual.length,n,t);if(n<10)assert.ok(history.companies[t].coverage.shortfallReason,t);}
 const app=history.companies.APP;assert.equal(app.annual.find(x=>x.period==='FY2023').metrics.growth.value,null);assert.equal(app.annual.find(x=>x.period==='FY2025').metrics.bookROICProxy.rangeEligible,false);
 for(const t of ['HOOD','BAM']){const e=assumptionEvidence(history,t,'salesCapital');assert.match(e.title,/common-equity/);assert.ok(e.series.some(x=>Number.isFinite(x.value)));const roe=assumptionEvidence(history,t,'terminalROIC');assert.match(roe.formula,/common book equity/);}
});
