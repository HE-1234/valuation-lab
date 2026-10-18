import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareJointAnnualPaths,validateJointAnnualConfig,factorInnovationCorrelation,JointPathError} from '../dist/joint-annual-path.js';
import {prepareAnnualPath} from '../dist/annual-path-sampling.js';
import {createSeededRandom} from '../dist/simulation.js';
const near=(actual,expected,eps=1e-12)=>assert.ok(Math.abs(actual-expected)<=eps*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
const spec=(sd=.1,rho=.6,fixedYears=[])=>({innovationSD:sd,persistence:rho,fixedYears});
function fixture(n=3) {
 return {context:{baseline:Array(n).fill(.1),terminalGrowth:.03,terminalYear:n+1,metrics:{margin:Array(n).fill(.2),salesCapital:Array(n).fill(2),taxRate:Array(n).fill(.21),wacc:Array(n).fill(.09)},terminals:{margin:.2,salesCapital:2,taxRate:.21,wacc:.09}},config:{annualPath:spec(),annualMetrics:{margin:spec(.05,.3),salesCapital:spec(.2,.7)},loadings:{growth:.6,margin:.7,salesCapital:-.4},observations:[]}};
}
function covariance(specs,keys,T,loadings) {
 const R=factorInnovationCorrelation(keys,loadings);
 return Array.from({length:keys.length*T},(_,i)=>Array.from({length:keys.length*T},(_,j)=>{
  const a=Math.floor(i/T),b=Math.floor(j/T),t=i%T+1,s=j%T+1,A=specs[keys[a]],B=specs[keys[b]];
  let sum=0;for(let k=1;k<=Math.min(t,s);k++)sum+=A.persistence**(t-k)*B.persistence**(s-k);
  return sum*A.innovationSD*B.innovationSD*R[a][b];
 }));
}
// Independent dense Gaussian elimination oracle for positive-definite cases.
function solve(A,b) {
 const M=A.map((row,i)=>[...row,b[i]]),n=b.length;
 for(let c=0;c<n;c++) {
  let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
  [M[p],M[c]]=[M[c],M[p]];assert.ok(Math.abs(M[c][c])>1e-18);
  const d=M[c][c];for(let j=c;j<=n;j++)M[c][j]/=d;
  for(let r=0;r<n;r++)if(r!==c){const f=M[r][c];for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j];}
 }
 return M.map(r=>r[n]);
}
function oracle(mu,K,observations) {
 const V=observations.map(a=>observations.map(b=>K[a.index][b.index]+(a===b?a.sd*a.sd:0)));
 const gain=K.map(row=>solve(V,observations.map(o=>row[o.index])));
 const deviations=observations.map(o=>o.value-mu[o.index]);
 return {mean:mu.map((x,i)=>x+gain[i].reduce((s,k,j)=>s+k*deviations[j],0)),covariance:K.map((row,i)=>row.map((x,j)=>x-gain[i].reduce((s,k,l)=>s+k*K[observations[l].index][j],0)))};
}
function flattenMoments(m){return m.keys.flatMap(k=>[...m.mean[k],m.terminalMean[k]]);}
function empirical(sampler,count,seed='empirical') {
 const random=createSeededRandom(seed),keys=sampler.keys,n=sampler.horizon,size=keys.length*n,mean=Array(size).fill(0),products=Array.from({length:size},()=>Array(size).fill(0));
 for(let t=0;t<count;t++) {
  const p=sampler.sample(random),paths={growth:p.growthPath,...p.metricPaths},x=keys.flatMap(k=>paths[k]);
  x.forEach((v,i)=>{mean[i]+=v/count;for(let j=0;j<size;j++)products[i][j]+=v*x[j]/count;});
 }
 return {mean,covariance:products.map((r,i)=>r.map((v,j)=>v-mean[i]*mean[j]))};
}

test('one-factor construction is PSD, supports signs and singular endpoints, and validates settings',()=>{
 const keys=['growth','margin','salesCapital','taxRate','wacc'];
 for(const loadings of [{},{growth:1,margin:-1,salesCapital:1},{growth:.8,margin:.4,salesCapital:-.6,taxRate:.9,wacc:-.3}]) {
  const R=factorInnovationCorrelation(keys,loadings),rng=createSeededRandom('PSD');
  for(let trial=0;trial<200;trial++){const x=keys.map(()=>rng()*2-1);let q=0;for(let i=0;i<5;i++)for(let j=0;j<5;j++)q+=x[i]*R[i][j]*x[j];assert.ok(q>=-1e-13);}
 }
 const f=fixture();
 for(const patch of [{loadings:{growth:1.1}},{loadings:{foo:.5}},{observations:[{metric:'revenue',year:1,value:1,errorSD:.1}]},{observations:[{metric:'growth',year:4,value:1,errorSD:.1}]},{observations:[{metric:'growth',year:1,value:1,errorSD:-.1}]},{observations:[{metric:'growth',year:1,value:1,errorSD:0,low:0}]},{surprise:1}])assert.throws(()=>validateJointAnnualConfig({...f.config,...patch},3));
 assert.throws(()=>validateJointAnnualConfig({...f.config,annualMetrics:{salesCapital:spec(),investmentFactor:spec()}},3));
});

test('joint conditional mean and covariance match dense Gaussian oracle across metrics and years',()=>{
 const {context,config}=fixture(4);config.annualPath.fixedYears=[1];config.annualMetrics.margin.fixedYears=[2];
 config.observations=[{metric:'growth',year:3,value:.18,errorSD:.04},{metric:'salesCapital',year:2,value:1.85,errorSD:0},{metric:'margin',year:4,value:.24,errorSD:.025}];
 const sampler=prepareJointAnnualPaths(context,config),m=sampler.moments({}, {includeCovariance:true}),T=5,keys=m.keys;
 const specs={growth:config.annualPath,...config.annualMetrics},mu=keys.flatMap(k=>k==='growth'?[...context.baseline,context.terminalGrowth]:[...context.metrics[k],context.terminals[k]]);
 const obs=sampler.audit().observations.map(o=>({index:keys.indexOf(o.metric)*T+o.year-1,value:o.value,sd:o.errorSD}));
 const expected=oracle(mu,covariance(specs,keys,T,config.loadings),obs);
 flattenMoments(m).forEach((x,i)=>near(x,expected.mean[i]));
 m.covariance.forEach((r,i)=>r.forEach((x,j)=>near(x,expected.covariance[i][j])));
 const prior=covariance(specs,keys,T,config.loadings);
 for(let i=0;i<prior.length;i++)assert.ok(m.covariance[i][i]<=prior[i][i]+1e-14);
});

test('joint samples reproduce conditional moments with hard and noisy cross-metric updates',()=>{
 const {context,config}=fixture(2);config.observations=[{metric:'growth',year:1,value:.15,errorSD:.08},{metric:'margin',year:2,value:.23,errorSD:0}];
 const sampler=prepareJointAnnualPaths(context,config),mom=sampler.moments({}, {includeCovariance:true}),e=empirical(sampler,50000);
 const ix=mom.keys.flatMap((k,i)=>[i*3,i*3+1]);
 e.mean.forEach((v,i)=>near(v,flattenMoments(mom)[ix[i]],.002));
 e.covariance.forEach((r,i)=>r.forEach((v,j)=>near(v,mom.covariance[ix[i]][ix[j]],.00065)));
});

test('soft target is noisy evidence, not an imposed mean, SD or interval',()=>{
 const {context,config}=fixture(1);config.annualPath=spec(.2,0);config.annualMetrics={margin:spec(.1,0)};config.loadings={growth:.5,margin:.8};
 config.observations=[{metric:'growth',year:1,value:.3,errorSD:.2,label:'Analyst estimate'}];
 const p=prepareJointAnnualPaths(context,config),m=p.moments();
 near(m.mean.growth[0],.2);near(m.pathSD.growth[0],Math.sqrt(.02));near(m.mean.margin[0],.22);near(m.pathSD.margin[0],Math.sqrt(.0092));
 const random=createSeededRandom('noisy');assert.ok(Array.from({length:200},()=>p.sample(random).growthPath[0]).some(v=>v>.3));
 const a=p.audit();assert.equal(a.observations.find(o=>o.kind==='noisy-observation').errorSD,.2);assert.match(a.description,/not an interval/);
});

test('future growth anchor updates another metric across years when innovations correlate',()=>{
 const {context,config}=fixture(3);config.annualMetrics={margin:spec(.1,.7)};config.loadings={growth:.8,margin:.8};
 const p=prepareJointAnnualPaths(context,config),base=p.moments(),shift=p.moments({growth:.07});
 assert.ok(shift.mean.growth[2]>base.mean.growth[2]);assert.ok(Math.abs(shift.mean.margin[2]-base.mean.margin[2])>1e-6); // The other terminal anchor can change the response's sign.
 assert.equal(shift.terminalMean.growth,.07);assert.equal(shift.terminalMean.margin,.2);
});

test('all exact years including maturity plateau and source constraints are exact in every draw',()=>{
 const {context,config}=fixture(5);context.baseline=[.2,.1,.03,.03,.03];context.terminalYear=3;config.annualPath.fixedYears=[1];config.annualMetrics.margin.fixedYears=[2,4];
 context.hardConstraints=[{metric:'salesCapital',year:1,value:2,label:'Selected fixed source scenario'}];
 const p=prepareJointAnnualPaths(context,config),random=createSeededRandom('exact');
 for(let i=0;i<100;i++) {
  const x=p.sample(random,{growth:.04});assert.equal(x.growthPath[0],.2);assert.deepEqual(x.growthPath.slice(2),[.04,.04,.04]);assert.equal(x.metricPaths.margin[1],.2);assert.equal(x.metricPaths.margin[3],.2);assert.equal(x.metricPaths.salesCapital[0],2);
 }
 config.annualPath.fixedYears=[3];const fixed=prepareJointAnnualPaths(context,config);assert.throws(()=>fixed.assertEndpoints({growth:.04}),/Conflicting exact/);
 assert.throws(()=>prepareJointAnnualPaths({...context,variableTerminal:true},config),/at or after maturity/);
});

test('zero innovation SD preserves deterministic paths exactly, uses no RNG, and fails incompatible anchors',()=>{
 const {context,config}=fixture(3);config.annualPath=spec(0);config.annualMetrics={margin:spec(0),salesCapital:spec(0)};
 const p=prepareJointAnnualPaths(context,config),x=p.sample(()=>{throw Error('Unexpected RNG');});
 assert.deepEqual(x.growthPath,context.baseline);assert.deepEqual(x.metricPaths, {margin:context.metrics.margin,salesCapital:context.metrics.salesCapital});
 for(const endpoint of [{growth:.04},{margin:.21},{salesCapital:2.01}])assert.throws(()=>p.assertEndpoints(endpoint),e=>e instanceof JointPathError&&e.code==='inconsistent-anchors');
 assert.throws(()=>p.assertEndpointRanges({growth:{low:.03,high:.04}}),/zero-variance/);
 assert.equal(p.assertEndpointRanges({growth:{low:.03,high:.03}}),true);
 const noisy={...config,observations:[{metric:'margin',year:1,value:.9,errorSD:.1}]};
 assert.deepEqual(prepareJointAnnualPaths(context,noisy).sample(()=>{throw Error('Unexpected RNG');}),x);
 assert.throws(()=>prepareJointAnnualPaths(context,{...config,observations:[{metric:'margin',year:1,value:.21,errorSD:0}]}),/zero-variance/);
});

test('singular full-correlation model retains exact cross-metric relation and catches dependent contradictions',()=>{
 const {context,config}=fixture(2);context.baseline=[0,0];context.terminalGrowth=0;context.metrics.margin=[0,0];context.terminals.margin=0;
 config.annualPath=spec(.1,.5);config.annualMetrics={margin:spec(.2,.5)};config.loadings={growth:1,margin:-1};
 config.observations=[{metric:'growth',year:1,value:.1,errorSD:0},{metric:'margin',year:1,value:-.2,errorSD:0}];
 const p=prepareJointAnnualPaths(context,config),rng=createSeededRandom('singular');
 for(let i=0;i<100;i++){const s=p.sample(rng);assert.equal(s.growthPath[0],.1);assert.equal(s.metricPaths.margin[0],-.2);near(s.metricPaths.margin[1],-2*s.growthPath[1]);}
 assert.equal(p.assertEndpoints({growth:.02,margin:-.04}),true);
 assert.throws(()=>p.assertEndpoints({growth:.02,margin:0}),/innovation dependence/);
 config.observations[1].value=-.19;assert.throws(()=>prepareJointAnnualPaths(context,config),/innovation dependence/);
});

test('duplicate equal anchors are safe, contradictory duplicates fail, unresolved tiny soft error fails closed',()=>{
 const {context,config}=fixture(2);config.observations=[{metric:'growth',year:1,value:.15,errorSD:0},{metric:'growth',year:1,value:.15,errorSD:0}];
 const p=prepareJointAnnualPaths(context,config);assert.equal(p.sample(createSeededRandom('dup')).growthPath[0],.15);
 config.observations[1].value=.16;assert.throws(()=>prepareJointAnnualPaths(context,config),/Conflicting exact/);
 config.observations[1]={metric:'growth',year:1,value:.15,errorSD:1e-30};assert.throws(()=>prepareJointAnnualPaths(context,config),e=>e.code==='ill-conditioned-observations');
});

test('diagonal innovations reproduce independent-bridge law without changing legacy seeded values',()=>{
 const {context,config}=fixture(4);config.loadings={};config.annualPath.fixedYears=[2];
 const p=prepareJointAnnualPaths(context,config),m=p.moments({}, {includeCovariance:true});
 for(const [key,s]of Object.entries({growth:config.annualPath,...config.annualMetrics})) {
  const base=key==='growth'?context.baseline:context.metrics[key],terminal=key==='growth'?context.terminalGrowth:context.terminals[key];
  const old=prepareAnnualPath(base,s,{terminalGrowth:terminal,terminalYear:5});
  const rng=createSeededRandom('legacy-shape'),count=40000,mean=Array(4).fill(0),second=Array(4).fill(0);
  for(let j=0;j<count;j++)old.sample(rng).forEach((v,i)=>{mean[i]+=v/count;second[i]+=v*v/count;});
  for(let i=0;i<4;i++){near(mean[i],m.mean[key][i],.002);near(second[i]-mean[i]**2,m.pathSD[key][i]**2,.0007);}
 }
 for(let i=0;i<5;i++)for(let j=5;j<15;j++)near(m.covariance[i][j],0);
 const old=prepareAnnualPath(context.baseline,config.annualPath,{terminalGrowth:.03,terminalYear:5});
 assert.deepEqual(old.sample(createSeededRandom('unchanged')),old.sample(createSeededRandom('unchanged')));
});

test('finite-horizon persistence endpoints -1 and 1 are supported with exact covariance',()=>{
 for(const rho of [-1,0,1]) {
  const {context,config}=fixture(4);config.annualPath=spec(.03,rho);config.annualMetrics={};config.loadings={};
  const p=prepareJointAnnualPaths(context,config),m=p.moments({}, {includeCovariance:true}),K=covariance({growth:config.annualPath},['growth'],5,{});
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)near(m.covariance[i][j],K[i][j]-K[i][4]*K[j][4]/K[4][4]);
 }
});

test('unbounded draws are neither clipped nor resampled; RNG errors are explicit',()=>{
 const {context,config}=fixture(1);config.annualPath=spec(2,0);config.annualMetrics={};config.loadings={};
 const p=prepareJointAnnualPaths(context,config);let count=0;
 const s=p.sample(()=>++count%2?1-1e-8:.5);assert.ok(s.growthPath[0]<-1);assert.equal(count,2);
 for(const bad of [-.1,1,NaN,Infinity])assert.throws(()=>p.sample(()=>bad),e=>e.code==='invalid-random');
});

test('same seed is exact and prepared state is isolated from later edits',()=>{
 const {context,config}=fixture(3),p=prepareJointAnnualPaths(context,config),audit=p.audit();
 const first=p.sample(createSeededRandom('same'));
 context.baseline[0]=.9;context.terminalYear=1;config.loadings.growth=1;config.annualPath.innovationSD=1;
 assert.deepEqual(p.sample(createSeededRandom('same')),first);assert.deepEqual(p.audit(),audit);
 const exported=p.audit();exported.innovation.growth.innovationSD=99;assert.deepEqual(p.audit(),audit);
});

test('all 30 annual years fixed require no random sampling and preserve exact reviewed arithmetic',()=>{
 const {context,config}=fixture(30);context.baseline=Array(30).fill(.03+1e-17);context.terminalYear=10;
 config.annualPath.fixedYears=Array.from({length:30},(_,i)=>i+1);for(const s of Object.values(config.annualMetrics))s.fixedYears=[...config.annualPath.fixedYears];
 const p=prepareJointAnnualPaths(context,config),x=p.sample(()=>{throw Error('Unexpected random draw');});assert.deepEqual(x.growthPath,context.baseline);
});

test('scenario-baseline mode supports changed terminal targets at zero SD without inventing uncertainty',()=>{
 const {context,config}=fixture(4);config.annualPath=spec(0,.6,[2]);config.annualMetrics={margin:spec(0,.7,[1])};config.loadings={growth:.8,margin:.8};config.terminalMode='scenario-baseline';
 const p=prepareJointAnnualPaths(context,config),endpoints={growth:.06,margin:.25};
 assert.equal(p.assertEndpointRanges({growth:{low:.01,high:.07},margin:{low:.1,high:.3}}),true);
 const actual=p.sample(()=>{throw Error('Zero SD cannot consume random draws');},endpoints);
 for(const key of ['growth','margin']) {
  const s=key==='growth'?config.annualPath:config.annualMetrics[key],base=key==='growth'?context.baseline:context.metrics[key],terminal=key==='growth'?context.terminalGrowth:context.terminals[key];
  const expected=prepareAnnualPath(base,s,{terminalGrowth:terminal,terminalYear:5}).sample(()=>{throw Error('No draws');},endpoints[key]);
  (key==='growth'?actual.growthPath:actual.metricPaths[key]).forEach((x,i)=>near(x,expected[i]));
 }
 assert.equal(actual.growthPath[1],context.baseline[1]);assert.equal(actual.metricPaths.margin[0],context.metrics.margin[0]);
 assert.ok(Object.values(p.moments(endpoints).pathSD).flat().every(x=>x===0));
 assert.match(p.audit(endpoints).terminalTreatment,/do not reweight/);
});

test('scenario-baseline mode holds maturity plateau and source anchors and still rejects conflicts',()=>{
 const {context,config}=fixture(5);context.baseline=[.2,.1,.03+1e-17,.03-1e-17,.03];context.terminalYear=3;config.annualPath=spec(0,.6,[1]);config.annualMetrics={margin:spec(0,.6)};config.loadings={};config.terminalMode='scenario-baseline';
 context.hardConstraints=[{metric:'margin',year:3,value:.2}];
 const p=prepareJointAnnualPaths(context,config),x=p.sample(()=>{throw Error('No draws');},{growth:.04,margin:.25});
 assert.deepEqual(x.growthPath.slice(2),[.04,.04,.04]);assert.equal(x.metricPaths.margin[2],.2);assert.ok(x.metricPaths.margin[4]>.2);
 config.annualPath.fixedYears=[3];assert.throws(()=>prepareJointAnnualPaths(context,config).assertEndpoints({growth:.04}),/Conflicting exact/);
});

test('scenario-baseline mode keeps identical residual covariance and jointly updates noisy observations',()=>{
 const {context,config}=fixture(3);config.terminalMode='scenario-baseline';config.observations=[{metric:'margin',year:2,value:.27,errorSD:.04}];
 const p=prepareJointAnnualPaths(context,config),a=p.moments({}, {includeCovariance:true}),b=p.moments({growth:.05,margin:.24},{includeCovariance:true});
 assert.deepEqual(a.covariance,b.covariance);
 const noObs=prepareJointAnnualPaths(context,{...config,observations:[]}).moments({growth:.05,margin:.24});
 assert.notEqual(b.mean.growth[1],noObs.mean.growth[1]);assert.ok(b.mean.margin[1]<.27);assert.ok(b.pathSD.margin[1]>0);
 const rng=createSeededRandom('endpoint-mixture'),drawn=[];
 for(let i=0;i<100;i++){const margin=.1+.2*rng();drawn.push(margin);assert.equal(p.moments({margin}).terminalMean.margin,margin);}
 assert.equal(new Set(drawn).size,100);
});

test('nearly but not exactly equal persistence under perfect correlation fails closed instead of merging constraints',()=>{
 for(const difference of [1e-8,1e-10,1e-13,1e-14]) {
  const {context,config}=fixture(2);context.baseline=[0,0];context.terminalGrowth=0;context.metrics.margin=[0,0];context.terminals.margin=0;
  config.annualPath=spec(.1,.6);config.annualMetrics={margin:spec(.1,.6+difference)};config.loadings={growth:1,margin:1};
  for(const terminalMode of ['conditional-prior','scenario-baseline'])assert.throws(()=>prepareJointAnnualPaths(context,{...config,terminalMode}),e=>e.code==='ill-conditioned-observations');
 }
});

test('exact full-correlation dependencies remain supported when early common innovations are resolved',()=>{
 const {context,config}=fixture(5);config.annualPath=spec(.1,.6,[1,2,3]);config.annualMetrics={margin:spec(.2,.8,[1,2,3])};config.loadings={growth:1,margin:-1};
 const p=prepareJointAnnualPaths(context,config),x=p.sample(createSeededRandom('resolved-common'));
 assert.deepEqual(x.growthPath.slice(0,3),context.baseline.slice(0,3));assert.deepEqual(x.metricPaths.margin.slice(0,3),context.metrics.margin.slice(0,3));
});
