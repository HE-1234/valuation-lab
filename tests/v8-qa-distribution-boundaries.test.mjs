// Independent SciPy 1.17 truncnorm.ppf reference values generated for this QA.
// Tests exercise the actual inverse CDF; the references are not sampled data.
import test from 'node:test';
import assert from 'node:assert/strict';
import {distributionQuantile,distributionSummary,validateDriverDistribution,validateSimulationConfig,simulateCurrent} from '../dist/simulation.js';
import {currentSnapshot,draftFor,calculateCurrent} from '../dist/current-model.js';
const near=(a,b,t=2e-10)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const probabilities=[.001,.05,.25,.5,.75,.95,.999];
const normalOracles=[
 {low:-1,high:1,expected:[-.9971825966064022,-.8676618854186884,-.44177054668658144,0,.44177054668658144,.8676618854186879,.9971825966064022]},
 {low:0,high:2,expected:[.0011962882986583526,.05985011235158309,.30367557775062354,.6391119108712731,1.0710983769732083,1.6786244893350792,1.9912376759492032]},
 {low:8,high:9,expected:[8.000123170289084,8.006312250405543,8.035339621905019,8.08488889901817,8.168898708564894,8.360554716618326,8.791963586618893]},
 {low:-12,high:-11,expected:[-11.605664188408358,-11.266938403229286,-11.124316157069066,-11.06233038259886,-11.025911611449896,-11.00462440672916,-11.000090219590046]}
];
test('v8 QA: bounded Normal quantiles match independent central, asymmetric and extreme-tail oracles',()=>{
 for(const {low,high,expected} of normalOracles){const spec={type:'normal',mean:0,sd:1,low,high};for(let i=0;i<probabilities.length;i++)near(distributionQuantile(probabilities[i],spec),expected[i]);assert.equal(distributionQuantile(0,spec),low);assert.equal(distributionQuantile(1,spec),high);}
});
test('v8 QA: bounded Normal is conditional sampling with no artificial point mass at either bound',()=>{
 for(const [low,high] of [[0,2],[8,9],[-12,-11],[1000,1001]]){
  const spec={type:'normal',mean:0,sd:1,low,high},points=Array.from({length:1001},(_,i)=>distributionQuantile((i+.5)/1001,spec));
  assert.ok(points.every(v=>v>low&&v<high));assert.equal(new Set(points).size,points.length);assert.ok(points.every((v,i)=>!i||v>points[i-1]));
 }
 const summary=distributionSummary({type:'normal',mean:0,sd:1,low:0,high:2});near(summary.mean,.7227897522452308,1e-5);near(summary.sd,Math.sqrt(.25131627759920117),1e-5);assert.notEqual(summary.mean,summary.parameters.mean);assert.match(summary.parameterMeaning,/underlying|unbounded/);assert.match(summary.momentMethod,/approximate/);
});
test('v8 QA: invalid, degenerate and out-of-domain distribution parameters are rejected rather than coerced',()=>{
 for(const spec of [{type:'normal',mean:0,sd:0,low:-1,high:1},{type:'normal',mean:0,sd:-1,low:-1,high:1},{type:'normal',mean:0,sd:1,low:1,high:1},{type:'normal',mean:Infinity,sd:1,low:-1,high:1},{type:'uniform',low:1,high:0},{type:'uniform',low:1,high:1},{type:'fixed',value:.1,sd:.1},{type:'uniform',low:0,high:1,mode:.5},{type:'unknown',low:0,high:1},{type:'normal',mean:0,sd:1,low:20000,high:20001}])assert.throws(()=>validateDriverDistribution(spec),JSON.stringify(spec));
 for(const [key,spec] of [['growth',{type:'fixed',value:1.01}],['targetMargin',{type:'uniform',low:-.1,high:.4}],['salesCapital',{type:'normal',mean:1,sd:1,low:0,high:5}],['wacc',{type:'fixed',value:0}]])assert.throws(()=>validateDriverDistribution(spec,key),key);
 for(const u of [-.001,1.001,NaN,Infinity])assert.throws(()=>distributionQuantile(u,{type:'fixed',value:1}));
});
test('v8 QA: changing families keeps rate units, explicit bounds and deterministic fixed-driver economics',()=>{
 const c={ticker:'QA',name:'Distribution QA',currency:'USD'},r={id:'QA-annual',snapshotMode:'annual-reference',periodEnd:'2025-12-31',filingDate:'2026-02-01',sourceUrl:'https://example.com/annual',currency:'USD',revenue:1000,EBIT:150,cash:100,debt:200,shares:10,shareBasis:'common shares'},s=currentSnapshot(c,r),d={...draftFor(c,r),cutoff:'2026-10-17'};
 const drivers=Object.fromEntries(['growth','targetMargin','salesCapital','wacc'].map(k=>[k,{type:'fixed',value:d.assumptions[k]}])),config={trials:50,seed:'fixed-QA',drivers};
 const result=simulateCurrent(s,d,config),deterministic=calculateCurrent(s,d);assert.ok(result.samples.every(v=>v===deterministic.perShare));assert.equal(result.accepted,50);assert.equal(result.excluded,0);
 const rates=validateSimulationConfig({drivers:{growth:{type:'normal',mean:.1,sd:.02,low:0,high:.2}}},d.assumptions);assert.equal(rates.drivers.growth.sd,.02);assert.equal(rates.drivers.growth.mean,.1);
 assert.deepEqual(validateDriverDistribution({low:.05,mode:.1,high:.2},'growth'),{type:'triangular',low:.05,mode:.1,high:.2});
 for(const u of [0,.1,.5,1])near(distributionQuantile(u,{type:'uniform',low:.04,high:.12}),.04+.08*u);
});
