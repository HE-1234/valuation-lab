import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateCurrent,currentSnapshot,draftFor} from '../dist/current-model.js';
import {valueCompany} from '../dist/engine.js';
import {simulateCurrent,simulationDefaults,validateSimulationConfig,createSeededRandom,triangularQuantile,quantile,empiricalCDF,histogram,SIMULATION_DRIVER_KEYS} from '../dist/simulation.js';

const snapshot = () => ({ticker:'LESSON',currency:'USD',units:'millions',sourceUrl:'https://example.com/filing',periodEnd:'2024-12-31',filedAt:'2025-02-01',availableFrom:'2025-02-02',revenue:1000,ebit:200,cash:100,debt:200,shares:100,snapshotMode:'annual-reference',shareBasis:'period-end common',backtestEligible:false,raw:{}});
const draft = () => ({...draftFor({ticker:'LESSON'},{id:'lesson'}),cutoff:'2026-10-17',modelReviewed:true,bridgeReviewed:true});
const fixed = (d = draft(), n = 30) => ({trials:n,seed:'test',drivers:Object.fromEntries(SIMULATION_DRIVER_KEYS.map(k=>[k,{low:d.assumptions[k],mode:d.assumptions[k],high:d.assumptions[k]}]))});
const near = (a,b,tol = 1e-10) => assert.ok(Math.abs(a-b) <= tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const deepFreeze = object => {Object.freeze(object); for (const value of Object.values(object)) if (value && typeof value === 'object') deepFreeze(value);return object;};
const quote = (price,date = '2026-10-17') => ({price,date,currency:'USD',sourceUrl:'https://example.com/quote',basisConfirmed:true});

test('simulation: zero-width distributions reproduce deterministic baseline exactly',()=>{
 const s = snapshot(), d = draft(), expected = calculateCurrent(s,d), result = simulateCurrent(s,d,fixed(d));
 assert.equal(result.status,'ready'); assert.equal(result.accepted,30); assert.equal(result.excluded,0);
 assert.deepEqual(result.baseline,expected); assert.ok(result.samples.every(v=>v===expected.perShare));
 assert.ok(result.rawSamples.every(v=>v===expected.rawPerShare));
 assert.equal(result.mean,expected.perShare); assert.equal(result.median,expected.perShare);
 for (const value of Object.values(result.quantiles)) assert.equal(value,expected.perShare);
 assert.deepEqual(result.histogram,[{low:expected.perShare,high:expected.perShare,count:30,share:1}]);
});

test('simulation: no supplied drivers explicitly means all drivers fixed',()=>{
 const r = simulateCurrent(snapshot(),draft(),{trials:3,seed:0});
 assert.equal(new Set(r.samples).size,1); assert.equal(r.median,r.baseline.perShare);
});

test('simulation: seeded repeatability includes samples, scenarios, bins and complete audit output',()=>{
 const d = draft(), c = {...simulationDefaults(d.assumptions),trials:1000};
 const a = simulateCurrent(snapshot(),d,c), b = simulateCurrent(snapshot(),d,c);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a.samples,simulateCurrent(snapshot(),d,{...c,seed:'another seed'}).samples);
});

test('simulation: deterministic pseudo-random generator remains in [0,1)',()=>{
 const a=createSeededRandom('stable seed'),b=createSeededRandom('stable seed');
 for(let i=0;i<10000;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);}
 for(const bad of ['', ' '.repeat(5), NaN,Infinity,null,{},1.1]) assert.throws(()=>createSeededRandom(bad));
});

test('simulation: triangular inverse distribution matches closed-form checkpoints',()=>{
 const symmetric={low:0,mode:1,high:2};
 for(const [p,v]of [[0,0],[.125,.5],[.5,1],[.875,1.5],[1,2]]) near(triangularQuantile(p,symmetric),v);
 near(triangularQuantile(.25,{low:0,mode:2,high:2}),1);
 near(triangularQuantile(.75,{low:0,mode:0,high:2}),1);
 assert.equal(triangularQuantile(.25,{low:7,mode:7,high:7}),7);
 assert.ok(Number.isFinite(triangularQuantile(.25,{low:1e200,mode:2e200,high:3e200})));
 for(const p of [-.1,1.1,NaN,null]) assert.throws(()=>triangularQuantile(p,symmetric));
 assert.throws(()=>triangularQuantile(.5,{low:2,mode:1,high:3}));
});

test('simulation: quantiles use type 7 interpolation and validate data',()=>{
 assert.equal(quantile([0,10,20,30],.5),15);assert.equal(quantile([0,10,20,30],.25),7.5);
 assert.equal(quantile([8],.95),8);assert.equal(quantile([],0),null);
 assert.equal(quantile([0,10],0),0);assert.equal(quantile([0,10],1),10);
 for(const values of [[2,1],[1,Infinity],[NaN],{}]) assert.throws(()=>quantile(values,.5));
 for(const p of [-1,2,NaN]) assert.throws(()=>quantile([1],p));
});

test('simulation: empirical CDF includes ties and handles outside support',()=>{
 const a=[0,0,1,2,2];
 assert.equal(empiricalCDF(a,-1),0);assert.equal(empiricalCDF(a,0),.4);assert.equal(empiricalCDF(a,1),.6);
 assert.equal(empiricalCDF(a,2),1);assert.equal(empiricalCDF(a,3),1);assert.equal(empiricalCDF([],5),null);
 assert.throws(()=>empiricalCDF(a,Infinity));assert.throws(()=>empiricalCDF([2,1],1));
});

test('simulation: histogram conserves all samples and includes the final upper edge',()=>{
 const bins=histogram([0,0,.25,.5,.75,1],4);
 assert.deepEqual(bins.map(x=>x.count),[2,1,1,2]);
 assert.equal(bins.reduce((s,b)=>s+b.count,0),6);near(bins.reduce((s,b)=>s+b.share,0),1);
 assert.deepEqual(histogram([],10),[]);assert.deepEqual(histogram([0,0],10),[{low:0,high:0,count:2,share:1}]);
 assert.deepEqual(histogram([0,Number.MIN_VALUE],36),[{low:0,high:Number.MIN_VALUE,count:2,share:1}]);
 assert.throws(()=>histogram([-1e308,1e308],4),/range is too wide/);
 for(const n of [0,-1,1.5,201,NaN])assert.throws(()=>histogram([1],n));
});

test('simulation: configuration rejects missing/invalid modes, supports bounds and never coerces strings',()=>{
 const valid=simulationDefaults();
 for(const [key,value]of [['trials',0],['trials',50001],['trials',1.5],['seed',''],['binCount',0],['dependence','anything']]) assert.throws(()=>validateSimulationConfig({...valid,[key]:value}));
 assert.throws(()=>validateSimulationConfig({...valid,typo:2}),/Unknown/);
 assert.throws(()=>validateSimulationConfig({...valid,drivers:{...valid.drivers,tax:{low:.2,mode:.25,high:.3}}}),/Unsupported/);
 for(const [key,range]of [
  ['growth',{low:-.51,mode:0,high:.1}],['growth',{low:0,mode:.5,high:1.01}],
  ['targetMargin',{low:-.01,mode:0,high:.1}],['targetMargin',{low:0,mode:.5,high:1.01}],
  ['salesCapital',{low:0,mode:1,high:2}],['wacc',{low:0,mode:.1,high:.2}],
  ['wacc',{low:.1,mode:.5,high:1.01}],['growth',{low:0,mode:'.1',high:.2}],
  ['growth',{low:0,mode:NaN,high:.2}],['growth',{low:.2,mode:.1,high:.3}],
  ['growth',{low:0,high:.2}],['growth',{low:0,mode:.1,high:.2,sd:1}]
 ]) assert.throws(()=>validateSimulationConfig({...valid,drivers:{...valid.drivers,[key]:range}}));
 assert.equal(validateSimulationConfig({trials:50000}).trials,50000);
});

test('simulation: invalid deterministic WACC, growth, ROIC, tax and margins fail before sampling',()=>{
 for(const [key,value]of [['wacc',0],['wacc',.01],['terminalGrowth',-.01],['terminalGrowth',.06],['terminalROIC',.01],['targetMargin',1.1],['tax',.61],['salesCapital',0],['growth',1.1]]) {
  const d=draft();d.assumptions[key]=value;assert.throws(()=>simulateCurrent(snapshot(),d,{trials:5}),undefined,key);
 }
});

test('simulation: WACC/stable growth overlap counts exclusions without redrawing',()=>{
 const d=draft(),c={...simulationDefaults(d.assumptions),trials:2000};c.drivers.wacc={low:.005,mode:.02,high:.06};
 const r=simulateCurrent(snapshot(),d,c);
 assert.equal(r.attempts,2000);assert.ok(r.accepted>0&&r.accepted<2000);assert.equal(r.accepted+r.excluded,2000);
 assert.equal(r.exclusions['terminal-constraints'],r.excluded);assert.equal(r.samples.length,r.accepted);
 assert.ok(r.scenarios.every(s=>s.wacc>d.assumptions.terminalGrowth));
 assert.ok(r.scenarios.some((s,i)=>s.trial!==i+1));assert.match(r.warnings.join(' '),/conditional on.*valid trials/);
});

test('simulation: no valid samples yields explicit empty status, null quantiles and no quote rank',()=>{
 const d=draft();d.quote=quote(20);const c=fixed(d,40);c.drivers.wacc={low:.01,mode:.015,high:.02};
 const r=simulateCurrent(snapshot(),d,c);
 assert.equal(r.status,'empty');assert.equal(r.accepted,0);assert.equal(r.excluded,40);assert.equal(r.attempts,40);
 assert.equal(r.median,null);assert.equal(r.mean,null);assert.ok(Object.values(r.quantiles).every(x=>x===null));
 assert.deepEqual(r.histogram,[]);assert.deepEqual(r.samples,[]);assert.equal(r.quote.status,'blocked');
});

test('simulation: negative equity is a retained zero mass; raw negative values are not discarded',()=>{
 const s={...snapshot(),debt:1e6},d=draft(),r=simulateCurrent(s,d,{...simulationDefaults(),trials:400});
 assert.equal(r.accepted,400);assert.equal(r.excluded,0);assert.equal(r.zeroEquityCount,400);assert.equal(r.zeroEquityShare,1);
 assert.ok(r.samples.every(x=>x===0));assert.ok(r.rawSamples.every(x=>x<0));assert.equal(r.median,0);
 assert.equal(r.histogram[0].count,400);
});

test('simulation: price rank is a dated, sourced ECDF and ties are explicit',()=>{
 const d=draft(),s=snapshot(),v=calculateCurrent(s,d).perShare;d.quote=quote(v);
 const r=simulateCurrent(s,d,fixed(d,100));
 assert.equal(r.quote.status,'ready');assert.equal(r.quote.percentile,100);assert.equal(r.quote.cdf,1);
 assert.equal(r.quote.belowCount,0);assert.equal(r.quote.equalCount,100);assert.equal(r.quote.atOrBelowCount,100);
 assert.equal(r.quote.aboveCount,0);assert.equal(r.quote.fractionAbove,0);assert.equal(r.quote.denominator,100);
 assert.equal(r.quote.sourceUrl,d.quote.sourceUrl);assert.equal(r.quote.currency,'USD');
 d.quote.price=v/2;assert.equal(simulateCurrent(s,d,fixed(d)).quote.percentile,0);
});

test('simulation: invalid quote date, source, basis or currency withholds rank only',()=>{
 const d=draft();assert.equal(simulateCurrent(snapshot(),d,fixed(d)).quote.status,'missing');
 for(const patch of [{date:'2026-10-18'},{date:'2026-02-30'},{date:'2026-10-17T00:00:00Z'},{currency:'TWD'},{basisConfirmed:false},{sourceUrl:'javascript:alert(1)'}]) {
  d.quote={...quote(20),...patch};const r=simulateCurrent(snapshot(),d,fixed(d));assert.equal(r.quote.status,'blocked');assert.equal(r.accepted,30);assert.equal(r.quote.percentile,undefined);
 }
});

test('simulation: each accepted sample replays one deterministic coherent path',()=>{
 const d=draft(),s=snapshot(),r=simulateCurrent(s,d,{...simulationDefaults(d.assumptions),trials:100});
 for(const x of r.scenarios) {
  const a={...d.assumptions,...Object.fromEntries(SIMULATION_DRIVER_KEYS.map(k=>[k,x[k]]))};
  const v=valueCompany({...s,bridgeReviewed:true},a);assert.equal(x.perShare,v.perShare);assert.equal(x.rawPerShare,v.rawPerShare);
  assert.equal(v.rows[0].growth,x.growth);near(v.rows.at(-1).growth,d.assumptions.terminalGrowth);
  near(v.rows.at(-1).margin,x.targetMargin);
 }
});

test('simulation: explicit annual overrides are rejected instead of silently masking sampled drivers',()=>{
 const d=draft();d.assumptions.yearlyOverrides=Array(10).fill({growth:.1,margin:.2,taxRate:.25,wacc:.09,salesCapital:2});
 assert.throws(()=>simulateCurrent(snapshot(),d,fixed(d)),/yearly overrides/i);
});

test('simulation: a sourced EBIT normalization exactly preserves the deterministic adapter',()=>{
 const d=draft();d.normalizationDelta=80;d.adjustmentReason='Illustrative normalization';d.adjustmentSource='https://example.com/adjustment';
 const r=simulateCurrent(snapshot(),d,fixed(d));assert.equal(r.median,calculateCurrent(snapshot(),d).perShare);
 assert.notEqual(r.median,calculateCurrent(snapshot(),draft()).perShare);
 d.adjustmentSource='';assert.throws(()=>simulateCurrent(snapshot(),d,fixed(d)),/adjustment/);
});

test('simulation: source, model and claims review gates fail closed',()=>{
 for(const patch of [{bridgeReviewed:false},{modelReviewed:false},{cutoff:'2024-01-01'}]) assert.throws(()=>simulateCurrent(snapshot(),{...draft(),...patch},{trials:2}));
 for(const patch of [{snapshotMode:'latest-quarter'},{shares:null},{revenue:null},{shareBasis:''},{ticker:'NBIS'},{ticker:'TSM'},{sector:'Banking'},{modelType:'specialist'},{raw:{fatalBlockers:['Unresolved claims']}}]) assert.throws(()=>simulateCurrent({...snapshot(),...patch},draft(),{trials:2}));
});

test('simulation: the complete current universe preserves NBIS/TSM and quarter gates',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url),'utf8'));
 for(const company of data.companies)for(const raw of company.snapshots) {
  if(!['NBIS','TSM'].includes(company.ticker)&&raw.snapshotMode!=='latest-quarter')continue;
  const d={...draftFor(company,raw),cutoff:'2026-10-17',bridgeReviewed:true,modelReviewed:true};
  assert.throws(()=>simulateCurrent(currentSnapshot(company,raw),d,{trials:1}),undefined,raw.id);
 }
});

test('simulation: source facts, draft, distributions and returned baseline never mutate inputs',()=>{
 const s=deepFreeze(snapshot()),d=deepFreeze(draft()),c=deepFreeze({...simulationDefaults(d.assumptions),trials:100}),before=JSON.stringify({s,d,c});
 const r=simulateCurrent(s,d,c);assert.equal(JSON.stringify({s,d,c}),before);
 r.config.drivers.growth.low=999;assert.notEqual(c.drivers.growth.low,999);
});

test('simulation: million-unit scaling invariance and equity claim bridge hold for all draws',()=>{
 const d=draft(),s=snapshot(),c={...simulationDefaults(),trials:100},r=simulateCurrent(s,d,c);
 const scaled={...s,...Object.fromEntries(['revenue','ebit','cash','debt','shares'].map(k=>[k,s[k]*3]))};
 const r2=simulateCurrent(scaled,d,c);r.samples.forEach((v,i)=>near(v,r2.samples[i]));
 const d2=draft();d2.assumptions.otherClaims=100;const r3=simulateCurrent(s,d2,c);
 r.draws.forEach((v,i)=>near(v-1,r3.draws[i]));
 assert.deepEqual(r.units,{currency:'USD',perShare:'USD per common share',financials:'millions',shares:'millions'});
});

test('simulation: enormous finite inputs that overflow baseline fail before chart statistics',()=>{
 assert.throws(()=>simulateCurrent({...snapshot(),revenue:1e308,ebit:2e307},draft(),{trials:10}),/nonfinite/);
});

function correlation(rows,a,b) {
 const n=rows.length,ma=rows.reduce((s,r)=>s+r[a],0)/n,mb=rows.reduce((s,r)=>s+r[b],0)/n;
 let covariance=0,va=0,vb=0;for(const r of rows){covariance+=(r[a]-ma)*(r[b]-mb);va+=(r[a]-ma)**2;vb+=(r[b]-mb)**2;}
 return covariance/Math.sqrt(va*vb);
}

test('simulation: operating dependence is disclosed and preserves bounded triangular marginals',()=>{
 const d=draft(),c={...simulationDefaults(),trials:16000,seed:'dependence check',dependence:'operating-linked'};
 const r=simulateCurrent(snapshot(),d,c);
 assert.equal(r.accepted,16000);assert.equal(r.dependence.latentCorrelations[0][1],.49);
 assert.match(r.dependence.description,/not fitted data|not.*exact Pearson/);
 assert.ok(correlation(r.scenarios,'growth','targetMargin')>.44);
 assert.ok(correlation(r.scenarios,'growth','salesCapital')>.23);
 assert.ok(Math.abs(correlation(r.scenarios,'growth','wacc'))<.04);
 for(const key of SIMULATION_DRIVER_KEYS) {
  const range=c.drivers[key],xs=r.scenarios.map(x=>x[key]),mean=xs.reduce((a,b)=>a+b,0)/xs.length;
  assert.ok(xs.every(x=>x>=range.low&&x<=range.high));
  assert.ok(Math.abs(mean-(range.low+range.mode+range.high)/3)<(range.high-range.low)*.015);
 }
});

test('simulation: independent driver mode is explicit and unlinked in a seeded diagnostic sample',()=>{
 const r=simulateCurrent(snapshot(),draft(),{...simulationDefaults(),trials:10000,seed:'independence check'});
 assert.equal(r.dependence.id,'independent');assert.match(r.dependence.description,/not evidence/);
 for(const [a,b]of [['growth','targetMargin'],['growth','salesCapital'],['targetMargin','wacc']])assert.ok(Math.abs(correlation(r.scenarios,a,b))<.04);
});
