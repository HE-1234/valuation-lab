import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults,valueCompany} from '../dist/engine.js';
import {draftFor,calculateCurrent} from '../dist/current-model.js';
import {SIMULATION_DRIVER_KEYS,SIMULATION_DISTRIBUTIONS,simulationDefaults,validateSimulationConfig,validateDriverDistribution,distributionQuantile as q,distributionSummary,createSeededRandom,simulateCurrent} from '../dist/simulation.js';

const near=(actual,expected,tolerance=1e-11)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
const snap=()=>({ticker:'TEST',currency:'USD',units:'millions',sourceUrl:'https://example.com/filing',periodEnd:'2024-12-31',filedAt:'2025-02-01',availableFrom:'2025-02-02',revenue:1000,ebit:200,cash:100,debt:200,shares:100,snapshotMode:'annual-reference',shareBasis:'period-end common',backtestEligible:false,raw:{}});
const draft=()=>({...draftFor({ticker:'TEST'},{id:'test'}),cutoff:'2026-10-17'});
const fixed=d=>Object.fromEntries(SIMULATION_DRIVER_KEYS.map(k=>[k,{type:'fixed',value:d.assumptions[k]}]));
const mixed=()=>({trials:600,seed:'mixed marginals',drivers:{growth:{type:'normal',mean:.1,sd:.03,low:-.02,high:.2},targetMargin:{type:'uniform',low:.15,high:.3},salesCapital:{type:'triangular',low:1,mode:2,high:3},wacc:{type:'fixed',value:.09}}});

test('distributions: every supported family has an explicit minimal parameter schema',()=>{
 assert.deepEqual(SIMULATION_DISTRIBUTIONS,['fixed','triangular','uniform','normal']);
 const specs=[{type:'fixed',value:.1},{type:'triangular',low:0,mode:.1,high:.2},{type:'uniform',low:0,high:.2},{type:'normal',mean:.1,sd:.02,low:0,high:.2}];
 for(const d of specs){assert.deepEqual(validateDriverDistribution(d,'growth'),d);assert.notEqual(validateDriverDistribution(d),d);assert.throws(()=>validateDriverDistribution({...d,irrelevant:3}));}
 assert.throws(()=>validateDriverDistribution({type:'lognormal',mean:1,sd:1,low:0,high:2}),/unsupported/i);
 assert.throws(()=>validateDriverDistribution({type:null,value:.1}),/unsupported/i);
 assert.throws(()=>validateDriverDistribution({type:'fixed',value:.1},'tax'),/Unsupported/);
});

test('distributions: legacy ranges migrate without mutating saved configuration',()=>{
 const legacy={low:.01,mode:.05,high:.12},before=JSON.stringify(legacy);
 assert.deepEqual(validateDriverDistribution(legacy,'growth'),{type:'triangular',...legacy});
 assert.equal(JSON.stringify(legacy),before);
 const normalized=validateSimulationConfig({drivers:{growth:legacy}});
 assert.equal(normalized.drivers.growth.type,'triangular');
 for(const k of SIMULATION_DRIVER_KEYS.filter(k=>k!=='growth'))assert.deepEqual(normalized.drivers[k],{type:'fixed',value:defaults[k]});
 for(const d of Object.values(simulationDefaults().drivers))assert.equal(d.type,'triangular');
});

test('distributions: fixed, uniform and triangular quantiles have exact support and checkpoints',()=>{
 for(const p of [0,.001,.25,.5,.75,.999,1])assert.equal(q(p,{type:'fixed',value:7}),7);
 const u={type:'uniform',low:2,high:6};for(const [p,x]of [[0,2],[.25,3],[.5,4],[.75,5],[1,6]])assert.equal(q(p,u),x);
 for(const p of [0,.01,.5,.99,1])assert.equal(q(p,{type:'triangular',low:4,mode:4,high:4}),4);
 for(const bad of [-1,1.01,NaN,Infinity,'0.5',null])assert.throws(()=>q(bad,u));
});

// Oracle values independently generated with SciPy 1.17.0 truncnorm.ppf.
// Source semantics: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.truncnorm.html
const oracle=[
 [{type:'normal',mean:0,sd:1,low:-1,high:2},[-.9966226715348402,-.8431045589489478,.17116391801782482,1.524596682775978,1.985063085944169]],
 [{type:'normal',mean:0,sd:1,low:8,high:9},[8.000123170289084,8.006312250405543,8.08488889901817,8.360554716618326,8.791963586618893]],
 [{type:'normal',mean:0,sd:1,low:-9,high:-8},[-8.791963586618893,-8.360554716618326,-8.08488889901817,-8.006312250405543,-8.000123170289084]],
 [{type:'normal',mean:0,sd:1,low:40,high:41},[40.00002499689695,40.0012815118972,40.01731412676465,40.07477677847464,40.17221588247909]],
 [{type:'normal',mean:.1,sd:.02,low:.04,high:.15},[.04344095169928291,.06728995846839073,.09987818294572313,.13181521988217945,.14894043655940986]],
 [{type:'normal',mean:.8,sd:.03,low:.2,high:.5},[.4801241479763134,.49122598586635924,.4979476449175571,.4998476528567313,.49999702767012966]]
];
for(const [spec,expected]of oracle)test(`distributions: true truncated-normal inverse matches independent oracle at [${spec.low}, ${spec.high}], mean ${spec.mean}`,()=>{
 const ps=[.001,.05,.5,.95,.999];ps.forEach((p,i)=>near(q(p,spec),expected[i],3e-13));
 assert.equal(q(0,spec),spec.low);assert.equal(q(1,spec),spec.high);
});

test('distributions: normal truncation creates no clipped boundary mass or hidden redraws',()=>{
 const spec={type:'normal',mean:0,sd:1,low:.5,high:1},random=createSeededRandom('no clipping');
 const values=Array.from({length:6000},()=>q(random(),spec));
 assert.ok(values.every(x=>x>spec.low&&x<spec.high));assert.equal(new Set(values).size,values.length);
 near(q(.5,spec),.7270541367354562,1e-12);
 const tail={type:'normal',mean:0,sd:1,low:8,high:9};
 const sequence=Array.from({length:101},(_,i)=>q((i+.5)/101,tail));
 assert.ok(sequence.every((x,i)=>x>8&&x<9&&(!i||x>sequence[i-1])));
});

test('distributions: SD, bounds, parameters and numerical extremes reject rather than silently changing families',()=>{
 const normal={type:'normal',mean:.1,sd:.02,low:0,high:.2};
 for(const sd of [0,-.01,NaN,Infinity,'0.02',null])assert.throws(()=>q(.5,{...normal,sd}));
 for(const field of ['mean','low','high'])for(const value of [NaN,Infinity,'0.1'])assert.throws(()=>q(.5,{...normal,[field]:value}));
 for(const spec of [
  {...normal,low:.2,high:0},{...normal,low:.1,high:.1},
  {...normal,mode:.1},{...normal,sd:1e-320},
  {type:'normal',mean:0,sd:1,low:20000,high:20001},
  {type:'normal',mean:0,sd:1,low:0,high:Number.MIN_VALUE},
  {type:'uniform',low:1,high:1},{type:'uniform',low:1,high:0},
  {type:'uniform',low:0,high:1,mode:.5},{type:'fixed',value:1,sd:0},
 ])assert.throws(()=>validateDriverDistribution(spec));
});

// Only arithmetic limits remain: growth and WACC above −100%, margin at most 100%, sales/capital above zero.
test('distributions: all families enforce economic driver support while normal mean may be outside it',()=>{
 for(const [key,low,high]of [['growth',-1.1,0],['targetMargin',.9,1.1],['wacc',-1,.1],['salesCapital',0,2]]) {
  for(const spec of [{type:'fixed',value:low},{type:'uniform',low,high},{type:'triangular',low,mode:low,high},{type:'normal',mean:(low+high)/2,sd:.1,low,high}]) {
   if(spec.type==='fixed'&&key==='targetMargin'&&low===.9)continue;
   assert.throws(()=>validateDriverDistribution(spec,key),undefined,`${key} ${JSON.stringify(spec)}`);
  }
 }
 assert.doesNotThrow(()=>validateDriverDistribution({type:'normal',mean:-.1,sd:.1,low:.01,high:.2},'wacc'));
 assert.doesNotThrow(()=>validateDriverDistribution({type:'fixed',value:-.5},'growth'));
 assert.doesNotThrow(()=>validateDriverDistribution({type:'fixed',value:-.9},'growth'));
 assert.doesNotThrow(()=>validateDriverDistribution({type:'uniform',low:.9,high:3},'growth'));
 assert.doesNotThrow(()=>validateDriverDistribution({type:'fixed',value:-.4},'targetMargin'));
 assert.doesNotThrow(()=>validateDriverDistribution({type:'fixed',value:1},'targetMargin'));
});

test('distributions: preview and summary expose all parameters with honest underlying-versus-bounded moments',()=>{
 const spec={type:'normal',mean:0,sd:1,low:0,high:2};
 const summary=distributionSummary(spec);
 assert.deepEqual(summary.parameters,spec);assert.equal(summary.type,'normal');
 near(summary.mean,.7227897522452308,2e-6);near(summary.sd,.5013145495586571,2e-6);
 assert.notEqual(summary.mean,spec.mean);assert.notEqual(summary.sd,spec.sd);
 assert.match(summary.parameterMeaning,/underlying.*Actual bounded/i);assert.match(summary.momentMethod,/approximate.*1,024/i);
 assert.equal(summary.median,q(.5,spec));assert.equal(summary.p5,q(.05,spec));assert.equal(summary.p95,q(.95,spec));
 assert.equal(summary.density.length,33);assert.ok(summary.density.every(p=>Number.isFinite(p.x)&&p.y>=0&&p.y<=1));
 assert.match(summary.densityMeaning,/not a probability/);
 const tri=distributionSummary({low:0,mode:.4,high:1});near(tri.mean,1.4/3);near(tri.sd,Math.sqrt(.76/18));
 const uniform=distributionSummary({type:'uniform',low:2,high:6});assert.equal(uniform.mean,4);near(uniform.sd,4/Math.sqrt(12));
 assert.deepEqual(distributionSummary({type:'fixed',value:5}).density,[{x:5,y:1}]);
});

test('distributions: percent rates use fractions and SD scales in the same units',()=>{
 const fraction={type:'normal',mean:.1,sd:.02,low:.04,high:.15},percentage={type:'normal',mean:10,sd:2,low:4,high:15};
 for(const p of [.01,.1,.5,.9,.99])near(q(p,fraction)*100,q(p,percentage));
 assert.throws(()=>validateDriverDistribution(percentage,'targetMargin'),/supported bounds/);
 const s=simulateCurrent(snap(),draft(),mixed());assert.match(s.method.inputUnits,/fractions.*0.10 = 10%/);
});

test('distributions: all-fixed explicit families reproduce deterministic DCF exactly',()=>{
 const d=draft(),s=snap(),r=simulateCurrent(s,d,{trials:30,seed:'fixed',drivers:fixed(d)});
 const baseline=calculateCurrent(s,d);assert.equal(r.accepted,30);assert.equal(r.excluded,0);
 assert.deepEqual(r.baseline,baseline);assert.ok(r.draws.every(x=>x===baseline.perShare));
 for(const key of SIMULATION_DRIVER_KEYS)assert.equal(r.inputDistributions[key].sd,0);
});

test('distributions: mixed choices preserve exact seeded reproducibility, audit parameters and deterministic replay',()=>{
 const d=draft(),s=snap(),c=mixed(),before=JSON.stringify({d,s,c});
 const r=simulateCurrent(s,d,c),again=simulateCurrent(s,d,c);assert.deepEqual(r,again);assert.equal(JSON.stringify({d,s,c}),before);
 assert.deepEqual(r.config.drivers,c.drivers);assert.equal(r.attempts,c.trials);assert.equal(r.accepted+r.excluded,c.trials);
 for(const row of r.scenarios.slice(0,50)) {
  const a={...d.assumptions,...Object.fromEntries(SIMULATION_DRIVER_KEYS.map(k=>[k,row[k]]))},v=valueCompany({...s,provisionalBridge:true},a);
  assert.equal(row.perShare,v.perShare);assert.equal(row.rawPerShare,v.rawPerShare);
 }
 assert.notDeepEqual(r.draws,simulateCurrent(s,d,{...c,seed:'another'}).draws);
});

test('distributions: invalid terminal scenarios remain excluded once and zero-equity mass stays retained',()=>{
 const d=draft(),drivers={...fixed(d),wacc:{type:'uniform',low:.005,high:.055}},trials=1000;
 const c={trials,seed:'count once',drivers},r=simulateCurrent(snap(),d,c);
 const random=createSeededRandom(c.seed);let expected=0;
 for(let i=0;i<trials;i++){random();random();random();const wacc=.005+.05*random();if(wacc>d.assumptions.terminalGrowth)expected++;}
 assert.equal(r.accepted,expected);assert.equal(r.excluded,trials-expected);assert.equal(r.exclusions['terminal-constraints'],r.excluded);
 const z=simulateCurrent({...snap(),debt:1e9},d,mixed());assert.equal(z.zeroEquityCount,z.accepted);assert.equal(z.zeroEquityShare,1);
 assert.ok(z.samples.every(x=>x===0));assert.ok(z.rawSamples.every(x=>x<0));
});

function correlation(rows,a,b){const n=rows.length,ma=rows.reduce((s,r)=>s+r[a],0)/n,mb=rows.reduce((s,r)=>s+r[b],0)/n;let cv=0,va=0,vb=0;for(const r of rows){const x=r[a]-ma,y=r[b]-mb;cv+=x*y;va+=x*x;vb+=y*y;}return cv/Math.sqrt(va*vb);}
test('distributions: Gaussian copula preserves selected marginals and operating dependence',()=>{
 const c={...mixed(),trials:10000,dependence:'operating-linked',seed:'mixed linked'},r=simulateCurrent(snap(),draft(),c);
 assert.equal(r.accepted,c.trials);assert.ok(correlation(r.scenarios,'growth','targetMargin')>.44);assert.ok(correlation(r.scenarios,'growth','salesCapital')>.23);
 for(const key of ['growth','targetMargin','salesCapital']) {
  const xs=r.scenarios.map(x=>x[key]).sort((a,b)=>a-b),s=distributionSummary(c.drivers[key]);
  const mean=xs.reduce((a,b)=>a+b,0)/xs.length;assert.ok(Math.abs(mean-s.mean)<(s.high-s.low)*.015);
  near(xs[Math.floor(xs.length*.5)],s.median,(s.high-s.low)*.02);
 }
 assert.match(r.dependence.description,/selected input distributions/);assert.ok(r.scenarios.every(x=>x.wacc===.09));
});

test('distributions: method page explains conditioning, units, parameters and uncalibrated uncertainty',()=>{
 const text=fs.readFileSync(new URL('../dist/data/simulation-methodology.html',import.meta.url),'utf8');
 for(const pattern of [/Fixed:/,/Uniform:/,/Bounded normal:/,/percentage points/,/not clipping/,/1,024/,/not fitted estimates or calibrated/,/10,000/,/SciPy/])assert.match(text,pattern);
});
