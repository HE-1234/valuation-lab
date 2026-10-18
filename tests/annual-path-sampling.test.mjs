import {assertFreshJointDefaults,preJointAnnualDefaults} from './joint-default-contract.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualPathDefaults,validateAnnualPathConfig,prepareAnnualPath,ANNUAL_GROWTH_PATH} from '../dist/annual-path-sampling.js';
import {createSeededRandom,simulationDefaults,validateSimulationConfig,simulateCurrent,simulateCurrentAsync,currentAnnualPathContext,SIMULATION_DRIVER_KEYS} from '../dist/simulation.js';
import {simulationResearchDefaults,validateResearchSimulationConfig,simulateResearch,simulateResearchAsync,researchAnnualPathContext,RESEARCH_SIMULATION_DRIVER_KEYS} from '../dist/research-simulation.js';
import {draftFor,calculateCurrent,valueCurrentWithClaims} from '../dist/current-model.js';
import {researchDraftFor,calculateResearchOperating} from '../dist/research-model.js';
const snapshot=()=>({ticker:'LESSON',currency:'USD',units:'millions',sourceUrl:'https://example.com/filing',periodEnd:'2024-12-31',filedAt:'2025-02-01',availableFrom:'2025-02-02',revenue:1000,ebit:200,cash:100,debt:200,shares:100,snapshotMode:'annual-reference',shareBasis:'period-end common',backtestEligible:false,raw:{}});
const draft=()=>({...draftFor({ticker:'LESSON'},{id:'lesson'}),cutoff:'2026-10-17',modelReviewed:true,bridgeReviewed:true});
const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const fixedCurrent=d=>Object.fromEntries(SIMULATION_DRIVER_KEYS.map(k=>[k,{type:'fixed',value:d.assumptions[k]}]));
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);

test('annual paths: fresh defaults opt in, absent saved method stays legacy, malformed fails closed',()=>{
 assertFreshJointDefaults(simulationDefaults());assertFreshJointDefaults(simulationResearchDefaults());
 assert.equal(validateSimulationConfig({}).method,'legacy');assert.equal(validateResearchSimulationConfig({}).method,'legacy');
 for(const method of [null,undefined,'annual',4]){assert.throws(()=>validateSimulationConfig({method}));assert.throws(()=>validateResearchSimulationConfig({method}));}
 for(const patch of [{fixedYears:[1,1]},{fixedYears:[0]},{fixedYears:[31]},{fixedYears:[NaN]},{fixedYears:Array(2)},{innovationSD:NaN},{innovationSD:-1},{innovationSD:2.1},{persistence:1.01},{persistence:Infinity},{surprise:1}])assert.throws(()=>validateAnnualPathConfig({...annualPathDefaults(),...patch}));
 assert.throws(()=>prepareAnnualPath([.1,.03],annualPathDefaults(),{terminalGrowth:.03,terminalYear:2}));
});

test('joint default replay normalization rejects unapproved nested changes or shared annual settings',()=>{
 const original=simulationDefaults(),before=structuredClone(original),prior=preJointAnnualDefaults(original);
 assert.deepEqual(original,before);
 assert.deepEqual(prior,{...Object.fromEntries(Object.entries(before).filter(([key])=>key!=='jointAnnual')),method:'annual-path'});
 for(const change of [c=>c.jointAnnual.version=2,c=>c.jointAnnual.terminalMode='different',c=>c.jointAnnual.loadings.growth=.2,c=>c.jointAnnual.observations.push({metric:'growth',year:4,value:.1,sd:.02}),c=>c.jointAnnual.annualPath.innovationSD=.2,c=>c.jointAnnual.extra=true,c=>c.jointAnnual.annualPath.fixedYears=c.annualPath.fixedYears]){
  const config=simulationDefaults();change(config);assert.throws(()=>preJointAnnualDefaults(config));
 }
});

test('annual paths: exact fixed anchors, terminal holds and SD zero across 10/15/20/30 years',()=>{
 for(const n of [10,15,20,30]){
  const base=Array.from({length:n},(_,i)=>.2+(.025-.2)*i/(n-1));
  for(const rho of [-1,-.5,0,.6,1]){
   const p=prepareAnnualPath(base,{fixedYears:[1,3,7],innovationSD:.03,persistence:rho},{terminalGrowth:.025,terminalYear:n});
   const random=createSeededRandom('anchor');
   for(let j=0;j<50;j++){const path=p.sample(random);for(const year of [1,3,7,n])assert.equal(path[year-1],base[year-1]);}
   assert.deepEqual(prepareAnnualPath(base,{fixedYears:[],innovationSD:0,persistence:rho},{terminalGrowth:.025,terminalYear:n}).sample(()=>{throw Error('No draws at zero SD');}),base);
  }
 }
});

test('annual paths: future conditioning matches independent Gaussian covariance formula',()=>{
 // Independent unconditional covariance with x0=0, then condition x[5]=0.
 for(const rho of [0,.7,1,-.7,-1]){
  const sigma=.05,n=5,base=Array(n).fill(.03);
  const cov=(i,j)=>{let sum=0;for(let k=1;k<=Math.min(i,j);k++)sum+=sigma*sigma*rho**(i-k)*rho**(j-k);return sum;};
  const expected=(i,j)=>cov(i,j)-cov(i,n)*cov(j,n)/cov(n,n);
  const p=prepareAnnualPath(base,{fixedYears:[],innovationSD:sigma,persistence:rho},{terminalGrowth:.03,terminalYear:n});
  const random=createSeededRandom(`covariance-${rho}`),count=60000,means=Array(4).fill(0),products=Array.from({length:4},()=>Array(4).fill(0));
  for(let k=0;k<count;k++){const x=p.sample(random).map(g=>g-.03);for(let i=0;i<4;i++){means[i]+=x[i]/count;for(let j=0;j<4;j++)products[i][j]+=x[i]*x[j]/count;}}
  for(let i=0;i<4;i++){near(means[i],0,.001);for(let j=0;j<4;j++)near(products[i][j]-means[i]*means[j],expected(i+1,j+1),.000075);}
 }
});

test('annual paths: current sampled growth replays through full claims adapter; no scalar double sampling',async()=>{
 const s=snapshot(),d=draft(),c={...simulationDefaults(d.assumptions),method:'annual-path',trials:60,drivers:fixedCurrent(d)};
 const r=simulateCurrent(s,d,c);assert.equal(r.accepted,60);assert.equal(r.annualPaths.preview.length,12);
 for(const x of r.scenarios){const a={...d.assumptions,[ANNUAL_GROWTH_PATH]:x.growthPath};const v=valueCurrentWithClaims(s,d,a);assert.equal(x.perShare,v.perShare);for(const year of [1,2,3,10])assert.equal(x.growthPath[year-1],r.baseline.rows[year-1].growth);}
 const alternate=structuredClone(c);alternate.drivers.growth={type:'uniform',low:-.5,high:1};
 assert.deepEqual(simulateCurrent(s,d,alternate).samples,r.samples);
 assert.deepEqual(await simulateCurrentAsync(s,d,c,{chunkSize:7,yieldControl:async()=>{}}),r);
 const zero=simulateCurrent(s,d,{...c,annualPath:{...c.annualPath,innovationSD:0}});assert.ok(zero.samples.every(x=>x===calculateCurrent(s,d).perShare));
 assert.deepEqual(currentAnnualPathContext(s,d).baseline,r.annualPaths.baseline);
});

test('annual paths: research SD zero preserves every reviewed revenue and value exactly; terminal continuation separate',async()=>{
 for(const company of companies){
  const d=researchDraftFor(company),c={...simulationResearchDefaults(),method:'annual-path',trials:2,annualPath:{...annualPathDefaults(),innovationSD:0}};
  const r=simulateResearch(d,c);assert.equal(r.accepted,2);assert.equal(r.mean,calculateResearchOperating(d).enterprise,company.ticker);
  assert.equal(r.annualPaths.terminalYear,d.annual.length+1);assert.equal(r.annualPaths.terminalGrowth,d.terminal.growth);
 }
 const d=researchDraftFor(companies[0]),c={...simulationResearchDefaults(),method:'annual-path',trials:50},r=simulateResearch(d,c);
 assert.equal(r.accepted,50);assert.deepEqual(await simulateResearchAsync(d,c,{chunkSize:7,yieldControl:async()=>{}}),r);
 const alternate=structuredClone(c);alternate.drivers.growthPremium={type:'uniform',low:-2,high:2};assert.deepEqual(simulateResearch(d,alternate).samples,r.samples);
 assert.deepEqual(researchAnnualPathContext(d).baseline,r.annualPaths.baseline);
});

test('annual paths: invalid growth draws excluded without replacement and seed replay exact',()=>{
 const s=snapshot(),d=draft(),c={...simulationDefaults(d.assumptions),method:'annual-path',trials:300,drivers:fixedCurrent(d),annualPath:{fixedYears:[],innovationSD:2,persistence:0}};
 const a=simulateCurrent(s,d,c),b=simulateCurrent(s,d,c);assert.deepEqual(a,b);assert.equal(a.attempts,300);assert.ok(a.excluded>0);assert.equal(a.accepted+a.excluded,300);assert.ok(a.exclusions['annual-growth-bounds']>0);
});

test('annual paths: short current horizons get valid fresh fixed years and a terminal continuation when required',()=>{
 for(const years of [1,2]){
  const d=draft();d.assumptions.years=years;
  const c={...simulationDefaults(d.assumptions),method:'annual-path',trials:2,drivers:fixedCurrent(d)};
  assert.deepEqual(c.annualPath.fixedYears,Array.from({length:years},(_,i)=>i+1));
  const r=simulateCurrent(snapshot(),d,c);assert.equal(r.accepted,2);assert.equal(r.mean,calculateCurrent(snapshot(),d).perShare);
  if(years===1)assert.equal(r.annualPaths.terminalYear,2);
 }
 for(const annualPath of [null,false,0]){assert.throws(()=>validateSimulationConfig({method:'annual-path',annualPath}));assert.throws(()=>validateResearchSimulationConfig({method:'annual-path',annualPath}));}
});

test('annual paths: research derived horizons hold stable growth beyond maturity; manual edits preserved',async()=>{
 const {deriveAnnualGrowthHorizon}=await import('../dist/annual-growth-horizon.js');
 const {applyAnnualMarginPath,defaultAnnualMarginPath}=await import('../dist/annual-margin-path.js');
 const {researchStressDraft}=await import('../dist/research-simulation.js');
 const company=companies.find(c=>c.ticker==='MU'),source=researchDraftFor(company);
 const margin=applyAnnualMarginPath(source,company,{...defaultAnnualMarginPath(source),enabled:true,interimYear:3,declineStartYear:5,terminalYear:30});
 assert.equal(researchAnnualPathContext(margin).terminalYear,source.annual.length+1);
 for(const maturity of [10,15,20]){
  const d=deriveAnnualGrowthHorizon(margin,company,{growthMaturityYear:maturity});
  const config={...simulationResearchDefaults(d),method:'annual-path',trials:3};
  const r=simulateResearch(d,config);assert.equal(r.accepted,3);assert.equal(r.annualPaths.terminalYear,maturity);
  for(const scenario of r.scenarios){
   for(let i=maturity-1;i<d.annual.length;i++)assert.equal(scenario.growthPath[i],r.annualPaths.baseline[i]);
   const stresses=Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,scenario[k]]));
   const replay=researchStressDraft(d,stresses,r.config.capitalPolicy,scenario.growthPath);
   assert.equal(calculateResearchOperating(replay).enterprise,scenario.enterprise);
  }
  d.annual[maturity].revenue*=1.03;
  const changed=simulateResearch(d,config);assert.equal(changed.accepted,3);assert.equal(changed.annualPaths.terminalYear,31);assert.match(changed.annualPaths.terminalAnchorNote,/Edited revenue/);
 }
});

test('annual paths: fixing every research year exactly reproduces deterministic value even with nonzero SD',()=>{
 for(const company of companies){
  const d=researchDraftFor(company),c={...simulationResearchDefaults(d),method:'annual-path',trials:2};
  c.annualPath.fixedYears=d.annual.map((_,i)=>i+1);
  const r=simulateResearch(d,c);assert.equal(r.mean,calculateResearchOperating(d).enterprise,company.ticker);
 }
});
