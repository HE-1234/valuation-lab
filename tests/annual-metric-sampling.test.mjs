import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualMetricDefaults,prepareAnnualPath,prepareAnnualMetrics,validateAnnualMetrics,annualMetricConstraint,conditionedGrowthContext} from '../dist/annual-path-sampling.js';
import {simulationDefaults,simulateCurrent,currentAnnualPathContext,createSeededRandom,validateSimulationConfig} from '../dist/simulation.js';
import {simulationResearchDefaults,simulateResearch,simulateResearchAsync,researchAnnualPathContext,researchStressDraft} from '../dist/research-simulation.js';
import {draftFor,calculateCurrent} from '../dist/current-model.js';
import {researchDraftFor,calculateResearchOperating} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {applyAnnualMarginPath,defaultAnnualMarginPath} from '../dist/annual-margin-path.js';
const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const company=companies.find(c=>c.ticker==='MU');
const snapshot={ticker:'LESSON',currency:'USD',units:'millions',sourceUrl:'https://example.com/filing',periodEnd:'2024-12-31',filedAt:'2025-02-01',availableFrom:'2025-02-02',revenue:1000,ebit:200,cash:100,debt:200,shares:100,snapshotMode:'annual-reference',shareBasis:'period-end common',backtestEligible:false,raw:{}};
const makeCurrent=()=>({...draftFor({ticker:'LESSON'},{id:'lesson'}),cutoff:'2026-10-17',modelReviewed:true,bridgeReviewed:true});
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const fixedDrivers=d=>Object.fromEntries(['growth','targetMargin','salesCapital','wacc'].map(k=>[k,{type:'fixed',value:d.assumptions[k]}]));

test('new annual primitives default to zero SD; malformed capital combinations fail closed; old configs remain legacy',()=>{
 for(const spec of Object.values(annualMetricDefaults()))assert.equal(spec.innovationSD,0);
 assert.equal(validateSimulationConfig({}).annualMetrics,undefined);
 assert.equal(validateSimulationConfig({}).method,'legacy');
 assert.throws(()=>validateAnnualMetrics({salesCapital:annualMetricDefaults().salesCapital,reinvestment:annualMetricDefaults().salesCapital}));
 assert.equal(annualMetricConstraint({taxRate:[-.01]}),'annual-taxRate-bounds');
 assert.equal(annualMetricConstraint({investmentFactor:[0]}),'annual-investmentFactor-bounds');
 assert.equal(annualMetricConstraint({reinvestment:[-500]}),null);
});

test('zero innovation follows deterministic endpoint conditional mean without consuming RNG; fixed years stay exact',()=>{
 const base=[.1,.3,.5,.2,.1];
 const p=prepareAnnualPath(base,{fixedYears:[2],innovationSD:0,persistence:.7},{terminalGrowth:.1});
 const values=p.sample(()=>{throw Error('zero SD must not draw');},.2);
 assert.equal(values[1],base[1]);assert.equal(values[0],base[0]);assert.ok(values[4]>base[4]);
 assert.deepEqual(p.sample(()=>{throw Error('zero SD must not draw');}),base);
 const all=prepareAnnualPath(base,{fixedYears:[1,2,3,4,5],innovationSD:1,persistence:.7},{terminalGrowth:.1});
 assert.deepEqual(all.sample(()=>.4,.2),base);
});

test('conditional mean and covariance match Gaussian conditioning with a nonzero endpoint',()=>{
 const n=5,rho=-.7,sigma=.03,endpoint=.04;
 const p=prepareAnnualPath(Array(n).fill(0),{fixedYears:[],innovationSD:sigma,persistence:rho},{terminalGrowth:0});
 const cov=(i,j)=>Array.from({length:Math.min(i,j)},(_,k)=>sigma*sigma*rho**(i-1-k)*rho**(j-1-k)).reduce((a,b)=>a+b,0);
 const random=createSeededRandom('metric-conditional-moments'),count=50000,mean=Array(n).fill(0),squares=Array(n).fill(0);
 for(let k=0;k<count;k++){const path=p.sample(random,endpoint);path.forEach((v,i)=>{mean[i]+=v/count;squares[i]+=v*v/count;});}
 for(let i=0;i<n;i++){
  const m=cov(i+1,n+1)/cov(n+1,n+1)*endpoint,v=cov(i+1,i+1)-cov(i+1,n+1)**2/cov(n+1,n+1);
  assert.ok(Math.abs(mean[i]-m)<.0005);assert.ok(Math.abs(squares[i]-mean[i]**2-v)<.000025);
 }
});

test('sampled stable growth conditions maturity and holds plateau; explicit conflicting anchors rejected up front',()=>{
 const context={baseline:[.2,.1,.03,.03,.03],terminalYear:3,terminalGrowth:.03};
 const c=conditionedGrowthContext(context,{growth:{type:'uniform',low:.02,high:.04}});
 const sampler=prepareAnnualPath(c.baseline,{fixedYears:[1],innovationSD:0,persistence:.6},c);
 assert.deepEqual(sampler.sample(()=>{throw Error('zero SD');},.04).slice(2),[.04,.04,.04]);
 assert.throws(()=>prepareAnnualPath(c.baseline,{fixedYears:[3],innovationSD:0,persistence:.6},c),/at or after maturity/);
});

test('Guided zero SD reproduces baseline and metric paths replay exact tax, margin, capital and discount equations',()=>{
 const d=makeCurrent(),c={...simulationDefaults(d.assumptions),trials:100,drivers:fixedDrivers(d)};c.annualPath.innovationSD=0;
 const fixed=simulateCurrent(snapshot,d,c);assert.equal(fixed.accepted,100);for(const s of fixed.scenarios)assert.equal(s.perShare,calculateCurrent(snapshot,d).perShare);
 for(const [k,s]of Object.entries(c.annualMetrics)){s.innovationSD=k==='salesCapital'?.1:.01;s.fixedYears=[2,5];}
 const result=simulateCurrent(snapshot,d,c),context=currentAnnualPathContext(snapshot,d);
 for(const s of result.scenarios){
  let prior=snapshot.revenue,discount=1,pv=0;
  for(let i=0;i<s.growthPath.length;i++){
   const p=s.metricPaths,revenue=prior*(1+s.growthPath[i]),ebit=revenue*p.margin[i],tax=Math.max(0,ebit)*p.taxRate[i],investment=Math.max(0,(revenue-prior)/p.salesCapital[i]);discount*=1+p.wacc[i];pv+=(ebit-tax-investment)/discount;prior=revenue;
   for(const key of Object.keys(p))if([1,4].includes(i))assert.equal(p[key][i],context.metrics[key][i]);
  }
  const t=s.terminal,nopat=prior*(1+t.growth)*t.margin*(1-t.taxRate),ev=pv+nopat*(1-t.growth/t.roic)/(t.wacc-t.growth)/discount;
  near(s.rawPerShare,(ev+snapshot.cash-snapshot.debt)/snapshot.shares);
 }
});

test('derived Year-by-year factor at zero SD preserves capital response; fixed factor is not fixed investment dollars',()=>{
 for(const maturity of [10,15,20]){
  const d=deriveAnnualGrowthHorizon(researchDraftFor(company),company,{growthMaturityYear:maturity});
  const c={...simulationResearchDefaults(d),trials:10};
  const result=simulateResearch(d,c);assert.equal(result.accepted,10);
  for(const s of result.scenarios){
   assert.ok(s.metricPaths.investmentFactor.every(v=>v===1));
   const replay=researchStressDraft(d,{},result.config.capitalPolicy,s.growthPath);
   assert.equal(s.enterprise,calculateResearchOperating(replay).enterprise);
  }
 }
});

test('annual margin sampling retains enabled peak/decay calendar and supports shifted terminal margin',()=>{
 const source=researchDraftFor(company),d=applyAnnualMarginPath(source,company,{...defaultAnnualMarginPath(source),enabled:true,interimYear:3,declineStartYear:5,terminalYear:20});
 const c={...simulationResearchDefaults(d),trials:5};c.drivers.marginShift={type:'fixed',value:.01};c.annualMetrics.margin.innovationSD=.01;
 const r=simulateResearch(d,c);assert.equal(r.accepted,5);for(const s of r.scenarios){assert.equal(s.terminal.margin,d.terminal.margin+.01);for(const y of [1,2,3])assert.equal(s.metricPaths.margin[y-1],d.annual[y-1].margin);}
 assert.deepEqual(researchAnnualPathContext(d).metrics.margin,d.annual.map(r=>r.margin));
});

test('terminal-only upgrades export every scalar draw and invalid terminal combinations are excluded without redraw; async parity',async()=>{
 const d=researchDraftFor(company),c={...simulationResearchDefaults(d),trials:30};delete c.annualMetrics;c.annualTerminal.growth={type:'uniform',low:.02,high:.04};
 const r=simulateResearch(d,c);assert.equal(r.accepted,30);assert.ok(r.scenarios.every(s=>s.terminal.growth>=.02&&s.terminal.growth<=.04));
 assert.deepEqual(await simulateResearchAsync(d,c,{chunkSize:7,yieldControl:async()=>{}}),r);
 c.drivers.waccShift={type:'fixed',value:-d.terminal.wacc+.01};const bad=simulateResearch(d,c);assert.equal(bad.accepted,0);assert.equal(bad.excluded,30);assert.equal(bad.exclusions['terminal-constraints'],30);
});

test('fresh research runtime and reset expose metric knobs without sampling or changing frozen presets',async()=>{
 const {studioResearchDraft}=await import('../dist/studio-research-presets.js');
 const {annualResearchSimulationAdapter}=await import('../dist/research-simulation-view.js');
 const {fixture}=await import('./v7-simulation-harness.mjs');
 const bundle=JSON.parse(fs.readFileSync(new URL('../dist/data/studio-research-presets-2026-10-17-v1.json',import.meta.url))),before=JSON.stringify(bundle),preset=bundle.presets.find(p=>p.ticker==='AMZN'),d=studioResearchDraft(preset,bundle);
 assert.equal(JSON.stringify(bundle),before);assert.deepEqual(d.researchSimulationConfig.drivers,preset.simulationConfig.drivers);
 assert.ok(Object.values(d.researchSimulationConfig.annualMetrics).every(s=>s.innovationSD===0));
 const h=fixture({runOnMount:false,ticker:d.ticker,reduced:true,draftOverride:d,snapshotOverride:{ticker:d.ticker,currency:d.currency,periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});
 try{
  assert.equal(h.get('#mc-annual-metrics-enabled').checked,true);
  for(const metric of ['margin','taxRate','wacc','investmentFactor']){assert.equal(h.get(`#mc-metric-${metric}-sd`).value,'0');assert.equal(h.get(`#mc-metric-panel-${metric}`).hidden,false);}
  assert.equal(h.get('#mc-export').disabled,true);assert.match(h.get('#mc-run-progress').textContent,/Run simulation/);assert.equal(h.get('#mc-run-progress').hidden,false);assert.doesNotMatch(h.get('#mc-output').innerHTML,/Run simulation/);
  h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-export').disabled,true);assert.match(h.get('#mc-run-progress').textContent,/Run simulation/);assert.equal(h.get('#mc-run-progress').hidden,false);assert.doesNotMatch(h.get('#mc-output').innerHTML,/Run simulation/);
 }finally{h.cleanup();}
});
