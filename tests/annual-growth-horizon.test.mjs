import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deriveAnnualGrowthHorizon,calculateDerivedReinvestment,terminalCapitalIntensity} from '../dist/annual-growth-horizon.js';
import {researchDraftFor,researchDraftIssues,restoreResearchDraft,calculateResearchOperating,exportResearchCase} from '../dist/research-model.js';
const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const by=t=>cases.find(c=>c.ticker===t);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
for(const c of cases)for(const horizon of [10,15,20])test(`${c.ticker}: derived ${horizon}-year revenue maturity retains identity and independent economics`,()=>{
 const d=researchDraftFor(c),before=JSON.stringify(d),source=JSON.stringify(c);
 d.notes='Retain notes';d.researchSimulationConfig={seed:'keep this'};d.currentCapitalScenario={cash:123};
 const next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:horizon}),early=['MSFT','MU','TSM'].includes(c.ticker)?5:3;
 assert.equal(next.schemaVersion,2);assert.equal(next.forecastHorizonYears,Math.max(c.forecastHorizonYears,horizon));
 assert.deepEqual(next.annual.slice(0,early),d.annual.slice(0,early));
 assert.deepEqual(researchDraftIssues(next),[]);assert.equal(restoreResearchDraft(next,c).error,null);
 for(let i=0;i<d.annual.length;i++)for(const field of ['period','margin','taxRate','wacc'])assert.equal(next.annual[i][field],d.annual[i][field]);
 for(const field of ['anchor','ticker','currency','discountOrigin','informationAsOf','timing','bridgeInputs','notes','researchSimulationConfig','currentCapitalScenario'])assert.deepEqual(next[field],d[field]);
 for(let i=horizon-1;i<next.annual.length;i++)close(next.annual[i].revenue/next.annual[i-1].revenue-1,d.terminal.growth);
 for(let i=0;i<d.annual.length;i++)assert.ok(next.annual[i].reinvestment>=d.annual[i].reinvestment-1e-8,'committed investment floor');
 assert.equal(JSON.stringify(c),source);assert.equal(JSON.stringify(researchDraftFor(c)),before);assert.ok(Number.isFinite(calculateResearchOperating(next).enterprise));
 const exported=exportResearchCase(next,c);assert.deepEqual(exported.originalResearchCase,c);assert.deepEqual(exported.draft,next);
});

test('MU retains its cycle; explicitly selected native horizon changes endpoint, original remains intact',()=>{
 const c=by('MU'),d=researchDraftFor(c),next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:10});
 assert.deepEqual(next.annual.slice(0,5),d.annual.slice(0,5));
 close(d.annual[9].revenue/d.annual[8].revenue-1,.025);close(next.annual[9].revenue/next.annual[8].revenue-1,.02);
 assert.notEqual(next.annual[9].revenue,d.annual[9].revenue);
});

test('TSM resamples its bespoke source shape instead of replacing it with a straight fade',()=>{
 const c=by('TSM'),d=researchDraftFor(c),next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20});
 // New year8 maps to source year7: 5 + (8-5)*(15-5)/(20-5) = 7.
 close(next.annual[7].revenue/next.annual[6].revenue-1,d.annual[6].revenue/d.annual[5].revenue-1);
 assert.ok(Math.abs((next.annual[7].revenue/next.annual[6].revenue-1)-(.10+(.02-.10)*3/15))>.01);
});

test('shorter revenue growth retains later source obligations and margins',()=>{
 const c=by('MSFT'),d=researchDraftFor(c),next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:10});
 assert.equal(next.annual.length,15);assert.equal(next.annual[14].margin,d.annual[14].margin);
 for(let i=10;i<15;i++)close(next.annual[i].revenue/next.annual[i-1].revenue-1,d.terminal.growth);
});

test('repeated selector changes do not compound generated revenue or investment; calendar edits survive',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),twenty=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20});
 twenty.annual[3].margin=.25;twenty.annual[3].taxRate=.3;twenty.annual[3].wacc=.13;
 const ten=deriveAnnualGrowthHorizon(twenty,c,{growthMaturityYear:10}),again=deriveAnnualGrowthHorizon(ten,c,{growthMaturityYear:20});
 for(let i=0;i<twenty.annual.length;i++)for(const key of ['revenue','reinvestment'])close(again.annual[i][key],twenty.annual[i][key]);
 assert.equal(ten.annual.length,10);assert.equal(again.annual[3].margin,.25);assert.equal(again.annual[3].taxRate,.3);assert.equal(again.annual[3].wacc,.13);
 twenty.annual[17].margin=.29;
 const editedTail=deriveAnnualGrowthHorizon(twenty,c,{growthMaturityYear:10});
 assert.equal(editedTail.annual.length,18);assert.equal(editedTail.annual[17].margin,.29);assert.deepEqual(researchDraftIssues(editedTail),[]);
});

test('capital response hand calculation, no automatic floor release, no amplified signed release',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20,marginalSalesCapital:2});
 const base=[{...d.annual[0],year:1,revenue:120,reinvestment:15},{...d.annual[1],year:2,revenue:130,reinvestment:-2}];
 next.anchor.revenue=100;
 // First year: 15*(150/120) + [50 - 20*(150/120)]/2 = 31.25.
 const capital=calculateDerivedReinvestment(next,[150,170],{baselineAnnual:base});
 close(capital[0],31.25);close(capital[1],-2+(20-10*(170/130))/2);
 assert.deepEqual(calculateDerivedReinvestment(next,[120,130],{baselineAnnual:base}),[15,-2]);
 assert.equal(calculateDerivedReinvestment(next,[90,80],{baselineAnnual:base})[0],15);
});

test('edited capital cells are exact at zero stress using current draft as baseline',()=>{
 const c=by('NBIS'),next=deriveAnnualGrowthHorizon(researchDraftFor(c),c,{growthMaturityYear:20});
 next.annual[1].reinvestment=12345;next.annual[17].reinvestment=-10;
 assert.deepEqual(calculateDerivedReinvestment(next,next.annual,{baselineAnnual:next.annual}),next.annual.map(r=>r.reinvestment));
});

function stableFixture(roic=.15){
 const c=structuredClone(by('AAPL'));c.anchor.revenue=100;c.terminal={...c.terminal,growth:.02,operatingMargin:.2,taxRate:.25,ROIC:roic,wacc:.1};
 let revenue=100;
 c.annual=c.annual.map(r=>{revenue*=1.02;return {...r,revenue,operatingMargin:.2,taxRate:.25,wacc:.1,reinvestment:revenue*.2*.75*.02/roic};});
 return c;
}
test('stable-year extension leaves EV unchanged; terminal FCFF and investment are continuous',()=>{
 for(const roic of [.05,.1,.2]){
  const c=stableFixture(roic),d=researchDraftFor(c),base=calculateResearchOperating(d);
  for(const horizon of [10,15,20]){
   const next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:horizon}),result=calculateResearchOperating(next);
   close(result.enterprise,base.enterprise);close(result.terminal.fcffGrowth,.02);
   const last=result.rows.at(-1);close(last.reinvestment,last.nopat*.02/roic);
   close(terminalCapitalIntensity(next.terminal),(1.02*.2*.75)/roic);
  }
 }
});

test('longer duration need not raise value when marginal returns are below capital cost',()=>{
 const c=stableFixture(.04);let revenue=100;
 c.annual=c.annual.map((row,i)=>{const g=i<3?.10:.1+(.02-.1)*(i-2)/7;const prior=revenue;revenue*=1+g;return {...row,revenue,reinvestment:(revenue-prior)*1.02*.2*.75/.04};});
 const d=researchDraftFor(c),ten=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:10}),twenty=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20});
 assert.ok(calculateResearchOperating(twenty).enterprise<calculateResearchOperating(ten).enterprise);
});

test('v1 source-horizon guard remains strict; invalid v2 drafts retained for recovery',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),bad=structuredClone(d);bad.forecastHorizonYears=15;
 assert.match(restoreResearchDraft(bad,c).error,/source horizon/);
 const next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20});
 for(const change of [x=>{x.derivedForecast.sourceForecastHorizonYears=15},x=>{x.derivedForecast.marginalSalesCapital=0},x=>{x.derivedForecast.baselineAnnual.pop()},x=>{x.annual.pop()},x=>{x.derivedForecast.growthMaturityYear=12},x=>{x.derivedForecast.economicOverrides={'40':{margin:.2,taxRate:.2,wacc:.1}}}]){
  const broken=structuredClone(next);change(broken);const restored=restoreResearchDraft(broken,c);assert.ok(restored.error);assert.deepEqual(restored.draft,broken);
 }
 const wrongVersion=structuredClone(next);wrongVersion.schemaVersion=1;assert.ok(researchDraftIssues(wrongVersion).length);
});


test('reverting an extension-year economic edit clears its stored override',()=>{
 const c=by('AAPL'),d=deriveAnnualGrowthHorizon(researchDraftFor(c),c,{growthMaturityYear:20});
 d.annual[17].margin=.29;
 const shorter=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:10});assert.equal(shorter.annual.length,18);
 shorter.annual[17].margin=shorter.derivedForecast.generatedTerminal.margin;
 const reverted=deriveAnnualGrowthHorizon(shorter,c,{growthMaturityYear:10});
 assert.equal(reverted.annual.length,10);assert.equal(reverted.derivedForecast.economicOverrides['18'],undefined);
});

test('generator rejects mismatched source horizon, canonical identity and derived policy before regeneration',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20});
 for(const original of [d,next])for(const mutate of [x=>{x.version='bogus';x.caseId=`bogus:${c.ticker}:${c.scenario}`},x=>{x.caseId='wrong'},x=>{x.sourceScenario='wrong'},x=>{x.profileId='wrong'}]){
  const bad=structuredClone(original);mutate(bad);const before=structuredClone(bad);
  assert.throws(()=>deriveAnnualGrowthHorizon(bad,c,{growthMaturityYear:15}),/identity/);assert.deepEqual(bad,before);
 }
 const wrongSource=structuredClone(next);wrongSource.derivedForecast.sourceForecastHorizonYears=15;
 assert.throws(()=>deriveAnnualGrowthHorizon(wrongSource,c,{growthMaturityYear:15}),/identity/);
 const wrongPolicy=structuredClone(next);wrongPolicy.capitalPolicy='original-research';
 assert.ok(researchDraftIssues(wrongPolicy).length);assert.ok(restoreResearchDraft(wrongPolicy,c).error);
 assert.throws(()=>deriveAnnualGrowthHorizon(wrongPolicy,c,{growthMaturityYear:15}),/policy/);
});

test('manual late investment retains year18 through shorter horizons until explicitly reverted',()=>{
 const c=by('AAPL'),d=deriveAnnualGrowthHorizon(researchDraftFor(c),c,{growthMaturityYear:20});
 d.annual[17].reinvestment=123456;
 const shorter=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:10});
 assert.equal(shorter.annual.length,18);assert.equal(shorter.annual[17].reinvestment,123456);
 assert.equal(shorter.derivedForecast.investmentOverrides['18'],123456);
 assert.deepEqual(researchDraftIssues(shorter),[]);assert.equal(restoreResearchDraft(shorter,c).error,null);
 const changedAgain=deriveAnnualGrowthHorizon(shorter,c,{growthMaturityYear:15});
 assert.equal(changedAgain.annual.length,18);assert.equal(changedAgain.annual[17].reinvestment,123456);
 assert.deepEqual(calculateDerivedReinvestment(changedAgain,changedAgain.annual,{baselineAnnual:changedAgain.annual}),changedAgain.annual.map(r=>r.reinvestment));
 changedAgain.annual[17].reinvestment=changedAgain.derivedForecast.generatedReinvestment[17];
 const reverted=deriveAnnualGrowthHorizon(changedAgain,c,{growthMaturityYear:10});
 assert.equal(reverted.annual.length,10);assert.equal(reverted.derivedForecast.investmentOverrides['18'],undefined);
});

test('manual source-year investment survives regeneration independently of generated capital rules',()=>{
 const c=by('NBIS'),d=deriveAnnualGrowthHorizon(researchDraftFor(c),c,{growthMaturityYear:20});
 d.annual[4].reinvestment=-25;
 const next=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:10});
 assert.equal(next.annual[4].reinvestment,-25);assert.equal(next.derivedForecast.investmentOverrides['5'],-25);
 assert.ok(next.derivedForecast.generatedReinvestment[4]>0);
});
