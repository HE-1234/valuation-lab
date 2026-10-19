// Read-only integration checks against the canonical valuation engines. This
// prototype deliberately does not introduce a second accounting implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareJointAnnualPaths} from '../dist/joint-annual-path.js';
import {ANNUAL_GROWTH_PATH,ANNUAL_METRIC_PATHS} from '../dist/annual-path-sampling.js';
import {currentAnnualPathContext,createSeededRandom} from '../dist/simulation.js';
import {draftFor,calculateCurrent,valueCurrentWithClaims} from '../dist/current-model.js';
import {researchAnnualPathContext,researchStressDraft} from '../dist/research-simulation.js';
import {researchDraftFor,calculateResearchOperating,researchDraftIssues} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon,calculateDerivedReinvestment,DERIVED_CAPITAL_POLICY} from '../dist/annual-growth-horizon.js';
import {fixedCapitalSettlement,operatingInvestment,scaleOperatingInvestment} from '../dist/fixed-capital-funding.js';
import {incrementalRecords} from '../dist/incremental-registry.js';
const original=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const near=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const snapshot={ticker:'LESSON',currency:'USD',units:'millions',sourceUrl:'https://example.com/filing',periodEnd:'2024-12-31',filedAt:'2025-02-01',availableFrom:'2025-02-02',revenue:1000,ebit:200,cash:100,debt:200,shares:100,snapshotMode:'annual-reference',shareBasis:'period-end common',backtestEligible:false,raw:{}};
const current=()=>({...draftFor({ticker:'LESSON'},{id:'lesson'}),cutoff:'2026-10-17',modelReviewed:true,bridgeReviewed:true});
const settings=(n,sd)=>({fixedYears:[1,2,3].filter(y=>y<=n),innovationSD:sd,persistence:.6});
function config(context,sd=0) {
 const n=context.baseline.length;
 return {annualPath:settings(n,sd),annualMetrics:{margin:settings(n,sd/2),[context.capital]:settings(n,sd*2),taxRate:settings(n,sd/5),wacc:settings(n,sd/10)},loadings:{growth:.7,margin:.6,[context.capital]:-.4,taxRate:0,wacc:0},observations:[],terminalMode:'scenario-baseline'};
}
function trialDraft(d,path,capitalPolicy='fixed-schedule') {
 const baseline=researchAnnualPathContext(d).baseline;
 const growth=path.growthPath.every((g,i)=>g===baseline[i])?undefined:path.growthPath;
 const result=researchStressDraft(d,{},capitalPolicy,growth);
 for(const [key,values]of Object.entries(path.metricPaths))result.annual.forEach((row,i)=>{
  if(key==='investmentFactor')row.reinvestment=scaleOperatingInvestment(d,row,values[i]);
  else if(key==='reinvestment')row.reinvestment=values[i]+fixedCapitalSettlement(d,row.year);
  else row[key]=values[i];
 });
 return result;
}

test('zero-uncertainty joint paths reproduce all 34 research operating values and reviewed rows exactly',()=>{
 const cases=[...original,...incrementalRecords.map(r=>r.annualCase)];assert.equal(cases.length,34);
 for(const company of cases) {
  const d=researchDraftFor(company),before=structuredClone(d),context=researchAnnualPathContext(d),sampler=prepareJointAnnualPaths(context,config(context));
  const path=sampler.sample(()=>{throw Error('No randomness at zero uncertainty');}),replay=trialDraft(d,path),value=calculateResearchOperating(replay),base=calculateResearchOperating(d);
  assert.deepEqual(replay.annual,d.annual,company.ticker);assert.equal(value.enterprise,base.enterprise,company.ticker);assert.deepEqual(d,before);assert.deepEqual(researchDraftIssues(replay),[]);
 }
});

test('Guided joint draws reconcile sequential revenue, tax, investment, FCFF and terminal identity',()=>{
 const d=current(),context=currentAnnualPathContext(snapshot,d),c=config(context,.02),p=prepareJointAnnualPaths(context,c),rng=createSeededRandom('guided-joint');
 for(let t=0;t<80;t++) {
  const path=p.sample(rng),a={...d.assumptions,[ANNUAL_GROWTH_PATH]:path.growthPath,[ANNUAL_METRIC_PATHS]:path.metricPaths};
  const value=valueCurrentWithClaims(snapshot,d,a),m=path.metricPaths;let prior=snapshot.revenue,discount=1,pv=0;
  for(let i=0;i<path.growthPath.length;i++) {
   const revenue=prior*(1+path.growthPath[i]),ebit=revenue*m.margin[i],nopat=ebit-Math.max(0,ebit)*m.taxRate[i],investment=Math.max(0,(revenue-prior)/m.salesCapital[i]);
   discount*=1+m.wacc[i];pv+=(nopat-investment)/discount;prior=revenue;
  }
  const terminalNopat=prior*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax),reinvestment=terminalNopat*a.terminalGrowth/a.terminalROIC;
  const enterprise=pv+(terminalNopat-reinvestment)/(a.wacc-a.terminalGrowth)/discount;
  near(value.enterprise,enterprise);near(value.rawPerShare,(enterprise+snapshot.cash-snapshot.debt)/snapshot.shares);
 }
 const deterministic=prepareJointAnnualPaths(context,config(context)).sample(()=>{throw Error('No draws');});
 assert.equal(valueCurrentWithClaims(snapshot,d,{...d.assumptions,[ANNUAL_GROWTH_PATH]:deterministic.growthPath,[ANNUAL_METRIC_PATHS]:deterministic.metricPaths}).perShare,calculateCurrent(snapshot,d).perShare);
});

test('derived-horizon joint paths apply revenue-responsive capital first, then one annual factor',()=>{
 const company=original.find(c=>c.ticker==='MU'),d=deriveAnnualGrowthHorizon(researchDraftFor(company),company,{growthMaturityYear:15}),context=researchAnnualPathContext(d),c=config(context,.01),p=prepareJointAnnualPaths(context,c),rng=createSeededRandom('derived-joint');
 for(let t=0;t<20;t++) {
  const path=p.sample(rng),replay=trialDraft(d,path,DERIVED_CAPITAL_POLICY),responded=calculateDerivedReinvestment(d,replay.annual,{baselineAnnual:d.annual}),value=calculateResearchOperating(replay);
  replay.annual.forEach((r,i)=>near(r.reinvestment,responded[i]*path.metricPaths.investmentFactor[i]));
  value.rows.forEach(r=>near(r.fcff,r.nopat-r.reinvestment));
  near(value.terminal.reinvestment,value.terminal.nopat*replay.terminal.growth/replay.terminal.roic);
 }
 assert.deepEqual(d.terminal,researchDraftFor(company).terminal);
});

test('joint capital factors preserve fixed funding and operating-cash policies in incremental companies',()=>{
 for(const ticker of ['LRCX','ASML','FN','SNPS']) {
  const record=incrementalRecords.find(r=>r.identity.ticker===ticker),d=researchDraftFor(record.annualCase),context=researchAnnualPathContext(d),c=config(context,.005),p=prepareJointAnnualPaths(context,c),rng=createSeededRandom('source-joint-'+ticker);
  for(let t=0;t<12;t++) {
   const path=p.sample(rng),replay=trialDraft(d,path,'revenue-scaled'),value=calculateResearchOperating(replay);
   replay.annual.forEach((r,i)=>{
    const base=d.annual[i],fixed=fixedCapitalSettlement(d,r.year);
    near(r.reinvestment,operatingInvestment(d,base)*(r.revenue/base.revenue)*path.metricPaths.investmentFactor[i]+fixed);
    if(fixed)assert.equal(value.rows[i].fixedOpeningFunding,fixed);
   });
   if(ticker==='FN')value.rows.forEach((r,i)=>{
    const next=replay.annual[i+1]?.revenue??r.revenue*(1+replay.terminal.growth);
    near(r.changeRequiredOperatingCash,.03*(next-r.revenue));near(r.reinvestment,replay.annual[i].reinvestment+r.changeRequiredOperatingCash);
   });
   assert.deepEqual(replay.fixedCapitalFunding,d.fixedCapitalFunding);assert.deepEqual(replay.annualFundingPolicy,d.annualFundingPolicy);assert.deepEqual(replay.openingStub,d.openingStub);assert.deepEqual(replay.bridgeInputs,d.bridgeInputs);assert.deepEqual(researchDraftIssues(replay),[]);
  }
 }
});

test('direct investment terminal context must use operating investment, excluding fixed funding',()=>{
 const record=incrementalRecords.find(r=>r.identity.ticker==='ASML'),d=researchDraftFor(record.annualCase),context=researchAnnualPathContext(d);
 // Adapter correction is explicit here; the canonical file remains untouched.
 context.terminals.reinvestment=operatingInvestment(d,d.annual.at(-1));
 const c=config(context);c.annualMetrics={reinvestment:settings(d.annual.length,0)};c.loadings={growth:0,reinvestment:0};
 const path=prepareJointAnnualPaths(context,c).sample(()=>{throw Error('No draws');}),replay=trialDraft(d,path);
 assert.deepEqual(replay.annual,d.annual);assert.equal(calculateResearchOperating(replay).enterprise,calculateResearchOperating(d).enterprise);
});
