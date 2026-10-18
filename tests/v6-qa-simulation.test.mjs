// Independent numerical QA. These tests exercise the actual simulation/DCF code,
// not rendering or real-world calibration of the analyst's distributions.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,currentIssues,calculateCurrent} from '../dist/current-model.js';
import {simulationDefaults,simulateCurrent,quantile,empiricalCDF,histogram,triangularQuantile,createSeededRandom} from '../dist/simulation.js';
const company={ticker:'QA',name:'Independent synthetic operating company',currency:'USD'};
const raw={id:'QA-2025',snapshotMode:'annual-reference',periodEnd:'2025-12-31',filingDate:'2026-02-01',sourceUrl:'https://example.com/qa-filing',currency:'USD',revenue:1000,EBIT:120,cash:80,debt:140,shares:10,shareBasis:'common shares; same split basis'};
const snapshot=currentSnapshot(company,raw);
const draft=()=>({...draftFor(company,raw),cutoff:'2026-10-17',bridgeReviewed:true,modelReviewed:true});
const config=d=>({...simulationDefaults(d.assumptions),method:'legacy',trials:1000,seed:'independent-v6-QA'});
const fixedConfig=d=>{const c=config(d);for(const k of Object.keys(c.drivers))c.drivers[k]={low:d.assumptions[k],mode:d.assumptions[k],high:d.assumptions[k]};return c;};
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1e-10,Math.abs(b)*1e-10),`${a} != ${b}`);

test('v6 QA: each degenerate simulation value reconciles exactly to the unchanged deterministic model',()=>{
 const d=draft();d.normalizationDelta=40;d.adjustmentReason='Synthetic independent normalization';d.adjustmentSource='https://example.com/qa-adjustment';d.assumptions.otherAssets=31;d.assumptions.otherClaims=23;
 const before=JSON.stringify({snapshot,d});const r=simulateCurrent(snapshot,d,fixedConfig(d));const exact=calculateCurrent(snapshot,d);
 assert.equal(r.status,'ready');assert.equal(r.attempts,1000);assert.equal(r.accepted,1000);assert.equal(r.excluded,0);
 assert.equal(r.samples.length,1000);for(const v of r.samples)near(v,exact.perShare);for(const v of r.rawSamples)near(v,exact.rawPerShare);
 near(r.mean,exact.perShare);near(r.median,exact.perShare);assert.equal(JSON.stringify({snapshot,d}),before,'simulation mutated source or draft');
});
test('v6 QA: identical inputs and seed reproduce every draw, changing seed changes the distribution',()=>{
 const d=draft(),c=config(d),a=simulateCurrent(snapshot,d,c),b=simulateCurrent(snapshot,d,structuredClone(c)),z=simulateCurrent(snapshot,d,{...c,seed:c.seed+'-different'});
 assert.deepEqual(a.samples,b.samples);assert.deepEqual(a.draws,b.draws);assert.deepEqual(a.quantiles,b.quantiles);assert.notDeepEqual(a.samples,z.samples);
 assert.equal(a.attempts,a.accepted+a.excluded);assert.equal(a.histogram.reduce((s,b)=>s+b.count,0),a.accepted);near(a.histogram.reduce((s,b)=>s+b.share,0),1);
 assert.ok(a.samples.every((v,i)=>Number.isFinite(v)&&v>=0&&(!i||v>=a.samples[i-1])));
 near(a.median,a.quantiles.p50);for(const [lower,upper] of [['p5','p10'],['p10','p25'],['p25','p50'],['p50','p75'],['p75','p90'],['p90','p95']])assert.ok(a.quantiles[lower]<=a.quantiles[upper]);
});
test('v6 QA: WACC failures are excluded without replacement, and denominator stays visible',()=>{
 const d=draft(),c=fixedConfig(d);c.drivers.wacc={low:.005,mode:.025,high:.045};const r=simulateCurrent(snapshot,d,c);
 assert.equal(r.attempts,1000);assert.ok(r.accepted>300&&r.accepted<700,`Unexpected accepted fraction ${r.accepted}`);assert.equal(r.excluded,1000-r.accepted);
 assert.equal(Object.values(r.exclusions).reduce((s,n)=>s+n,0),r.excluded);assert.equal(r.samples.length,r.accepted);
 assert.equal(r.histogram.reduce((s,b)=>s+b.count,0),r.accepted);near(r.histogram.reduce((s,b)=>s+b.share,0),1);
});
test('v6 QA: wholly invalid sampled WACC yields an explicit empty result instead of redrawn success',()=>{
 const d=draft(),c=fixedConfig(d);c.drivers.wacc={low:.01,mode:.01,high:.01};const r=simulateCurrent(snapshot,d,c);
 assert.equal(r.status,'empty');assert.equal(r.attempts,1000);assert.equal(r.accepted,0);assert.equal(r.excluded,1000);assert.equal(r.mean,null);assert.equal(r.median,null);assert.deepEqual(r.samples,[]);assert.deepEqual(r.histogram,[]);
});
test('v6 QA: negative equity remains a visible zero-mass floor with preserved raw values',()=>{
 const d=draft(),s={...snapshot,debt:1e9};const r=simulateCurrent(s,d,config(d));
 assert.equal(r.zeroEquityCount,r.accepted);assert.ok(r.rawSamples.every(v=>v<0));assert.ok(r.samples.every(v=>v===0));assert.equal(r.median,0);assert.equal(r.mean,0);
 assert.equal(r.histogram.reduce((s,b)=>s+b.count,0),r.accepted);
});
test('v6 QA: evidence, source-date and model constraints govern simulation without assent gates',()=>{
 const d=draft(),c=config(d);
 for(const acknowledgements of [{modelReviewed:false},{bridgeReviewed:false},{modelReviewed:false,bridgeReviewed:false}])assert.equal(simulateCurrent(snapshot,{...d,...acknowledgements},c).status,'ready');assert.throws(()=>simulateCurrent(snapshot,{...d,cutoff:'2020-01-01'},c));
 for(const bad of [{revenue:null},{cash:null},{shares:0},{snapshotMode:'latest-quarter'},{ticker:'NBIS'},{ticker:'TSM'},{sector:'Insurance'}])assert.throws(()=>simulateCurrent({...snapshot,...bad},d,c));
 const path={...d,assumptions:{...d.assumptions,yearlyOverrides:Array.from({length:10},()=>({growth:.08,margin:.25,taxRate:.25,salesCapital:2,wacc:.09}))}};
 assert.throws(()=>simulateCurrent(snapshot,path,c),/override|path/i);
});
test('v6 QA: malformed distributions are rejected rather than silently clipped or swapped',()=>{
 const d=draft(),c=config(d);
 for(const bad of [{low:.2,mode:.1,high:.3},{low:NaN,mode:.1,high:.3},{low:-.6,mode:.1,high:.3},{low:.1,mode:.2,high:1.1}])assert.throws(()=>simulateCurrent(snapshot,d,{...c,drivers:{...c.drivers,growth:bad}}));
 for(const bad of [{low:0,mode:2,high:3},{low:-1,mode:2,high:3}])assert.throws(()=>simulateCurrent(snapshot,d,{...c,drivers:{...c.drivers,salesCapital:bad}}));
 assert.throws(()=>simulateCurrent(snapshot,d,{...c,dependence:'unrecognized'}));
});
test('v6 QA: all dated supplied sources either simulate through the same gate or explicitly refuse',()=>{
 const library=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));
 for(const company of library.companies)for(const raw of company.snapshots){
  const s=currentSnapshot(company,raw),d={...draftFor(company,raw),cutoff:'2026-10-17',bridgeReviewed:true,modelReviewed:true},c={...fixedConfig(d),trials:1000};
  if(currentIssues(s,d).length)assert.throws(()=>simulateCurrent(s,d,c),undefined,raw.id);
  else{const r=simulateCurrent(s,d,c);assert.equal(r.status,'ready',raw.id);near(r.median,calculateCurrent(s,d).perShare);}
 }
});

test('v6 QA: quantile interpolation and inclusive ECDF ties are distinct exact operations',()=>{
 assert.equal(quantile([],0.5),null);assert.equal(empiricalCDF([],10),null);
 for(const [p,expected] of [[0,0],[.25,7.5],[.5,15],[.75,22.5],[1,30]])near(quantile([0,10,20,30],p),expected);
 assert.equal(quantile([7],.001),7);assert.equal(quantile([7],1),7);
 const ties=[0,0,10,10];for(const [x,p] of [[-1,0],[0,.5],[5,.5],[10,1],[11,1]])near(empiricalCDF(ties,x),p);
 for(const bad of [[2,1],[NaN],[Infinity]]){assert.throws(()=>quantile(bad,.5));assert.throws(()=>empiricalCDF(bad,1));assert.throws(()=>histogram(bad));}
 for(const p of [NaN,-.001,1.001])assert.throws(()=>quantile([1,2],p));
});
test('v6 QA: triangular inverse-CDF endpoints, mode and degenerate cases match independent formulas',()=>{
 const r={low:10,mode:20,high:40};
 near(triangularQuantile(0,r),10);near(triangularQuantile(1/3,r),20);near(triangularQuantile(1,r),40);
 near(triangularQuantile(.1,r),10+Math.sqrt(.1*30*10));near(triangularQuantile(.7,r),40-Math.sqrt(.3*30*20));
 near(triangularQuantile(.25,{low:0,mode:0,high:10}),10-10*Math.sqrt(.75));near(triangularQuantile(.25,{low:0,mode:10,high:10}),5);
 assert.equal(triangularQuantile(.9,{low:7,mode:7,high:7}),7);
 for(const p of [-.01,1.01,NaN])assert.throws(()=>triangularQuantile(p,r));
});
test('v6 QA: equal-width histogram puts boundary ties into the next bin and includes final upper edge',()=>{
 const b=histogram([0,1,2,2,3,4],4);assert.deepEqual(b.map(x=>x.count),[1,1,2,2]);assert.deepEqual(b.map(x=>[x.low,x.high]),[[0,1],[1,2],[2,3],[3,4]]);near(b.reduce((n,x)=>n+x.share,0),1);
 assert.deepEqual(histogram([7,7,7],36),[{low:7,high:7,count:3,share:1}]);assert.deepEqual(histogram([]),[]);
});
test('v6 QA: sourced price percentile reports strict-below, ties, inclusive count and dated identity',()=>{
 const d=draft(),c=fixedConfig(d);const price=calculateCurrent(snapshot,d).perShare;
 d.quote={price,date:'2026-10-16',currency:'USD',sourceUrl:'https://example.com/qa-price',shareBasis:snapshot.shareBasis};
 const r=simulateCurrent(snapshot,d,c);assert.equal(r.quote.status,'ready');assert.equal(r.quote.percentile,100);assert.equal(r.quote.equalCount,1000);assert.equal(r.quote.belowCount,0);assert.equal(r.quote.atOrBelowCount,1000);assert.equal(r.quote.aboveCount,0);assert.equal(r.quote.denominator,r.accepted);assert.equal(r.quote.sourceUrl,d.quote.sourceUrl);assert.equal(r.quote.date,d.quote.date);
 for(const bad of [{currency:'TWD'},{sourceUrl:''},{shareBasis:'different security'},{date:'2026-10-18'},{date:'2026-10-16T12:00:00Z'}])assert.equal(simulateCurrent(snapshot,{...d,quote:{...d.quote,...bad}},c).quote.status,'blocked',JSON.stringify(bad));
 assert.equal(simulateCurrent(snapshot,{...d,quote:{...d.quote,price:null}},c).quote.status,'missing');
});
test('v6 QA: quote and histogram summaries normalize to accepted draws after exclusions',()=>{
 const d=draft(),c=fixedConfig(d);c.drivers.wacc={low:.005,mode:.025,high:.045};d.quote={price:100,date:'2026-10-16',currency:'USD',sourceUrl:'https://example.com/qa-price',shareBasis:snapshot.shareBasis};const r=simulateCurrent(snapshot,d,c);
 const inclusive=r.samples.filter(x=>x<=100).length;near(r.quote.percentile,100*inclusive/r.accepted);assert.equal(r.quote.denominator,r.accepted);assert.match(r.warnings.join(' '),/exclusions change|conditional.*valid/i);
});
test('v6 QA: seeded draws stay bounded, and linked dependence differs from independence without linking WACC',()=>{
 const pearson=(rows,x,y)=>{const n=rows.length,mx=rows.reduce((s,r)=>s+r[x],0)/n,my=rows.reduce((s,r)=>s+r[y],0)/n;let cov=0,vx=0,vy=0;for(const r of rows){cov+=(r[x]-mx)*(r[y]-my);vx+=(r[x]-mx)**2;vy+=(r[y]-my)**2;}return cov/Math.sqrt(vx*vy);};
 const d=draft(),c={...config(d),trials:16000};
 const independent=simulateCurrent(snapshot,d,c),linked=simulateCurrent(snapshot,d,{...c,dependence:'operating-linked'});
 assert.ok(Math.abs(pearson(independent.scenarios,'growth','targetMargin'))<.04);
 const gm=pearson(linked.scenarios,'growth','targetMargin'),gc=pearson(linked.scenarios,'growth','salesCapital');assert.ok(gm>.43&&gm<.54,`growth–margin ${gm}`);assert.ok(gc>.22&&gc<.34,`growth–capital ${gc}`);assert.ok(Math.abs(pearson(linked.scenarios,'growth','wacc'))<.04);
 for(const r of [independent,linked])for(const draw of r.scenarios)for(const [key,range]of Object.entries(c.drivers))assert.ok(draw[key]>=range.low&&draw[key]<=range.high,key);
 assert.deepEqual(linked.dependence.latentCorrelations,[[1,.49,.28,0],[.49,1,.28,0],[.28,.28,1,0],[0,0,0,1]]);assert.match(linked.dependence.description,/not fitted|not.*Pearson/);
});
test('v6 QA: RNG is reproducible, bounded and rejects an unusable seed',()=>{
 const a=createSeededRandom('seed'),b=createSeededRandom('seed');let sum=0;
 for(let i=0;i<10000;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);sum+=x;}assert.ok(sum/10000>.49&&sum/10000<.51);
 for(const s of ['',null,{},Infinity])assert.throws(()=>createSeededRandom(s));
});
test('v6 QA: a nonfinite baseline is rejected rather than rendered as a distribution',()=>{
 const d=draft();assert.throws(()=>simulateCurrent({...snapshot,revenue:1e308,ebit:1e307},d,config(d)),/nonfinite/);
});
test('v6 QA: finite baseline with overflowing sampled forecasts reports complete exclusions',()=>{
 const d=draft();d.assumptions.years=30;const c=fixedConfig(d);c.drivers.growth={low:1,mode:1,high:1};
 const r=simulateCurrent({...snapshot,revenue:1e305,ebit:1e304},d,c);
 assert.equal(r.status,'empty');assert.equal(r.accepted,0);assert.equal(r.excluded,r.attempts);assert.equal(Object.values(r.exclusions).reduce((s,v)=>s+v,0),r.attempts);assert.equal(r.mean,null);assert.equal(r.median,null);assert.deepEqual(r.histogram,[]);
});
