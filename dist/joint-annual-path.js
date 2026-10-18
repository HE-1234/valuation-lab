import {validateAnnualPathConfig, validateAnnualMetrics, prepareAnnualPath} from './annual-path-sampling.js';

// New method only: fixed-parameter, linear Gaussian forecast deviations.
// Legacy samplers are deliberately untouched, including their seed draw order.
export const JOINT_ANNUAL_PATH_VERSION = '1.0.0';
export const JOINT_ANNUAL_PATH_METHOD = 'joint-annual-path';
const finite = x => typeof x === 'number' && Number.isFinite(x);
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const dot = (a,b) => {let sum=0;for(let i=0;i<a.length;i++)sum+=a[i]*b[i];return sum;};
const norm = a => Math.hypot(...a);
const copy = x => structuredClone(x);
const units = k => k==='reinvestment'?'currency millions':k==='salesCapital'?'incremental sales / capital ratio':k==='investmentFactor'?'net-investment factor':'fraction';

export class JointPathError extends Error {
 constructor(code,message,details={}) {super(message);this.name='JointPathError';this.code=code;this.details=details;}
}
function fail(code,message,details) {throw new JointPathError(code,message,details);}
function shape(value,allowed,name) {
 if(!object(value)||Object.keys(value).some(k=>!allowed.includes(k)))fail('invalid-settings',`${name} contains unsupported settings.`);
}

// One common innovation factor plus independent residual factors. R is PSD even
// at |loading|=1; zero innovation SD is a genuinely deterministic state.
export function factorInnovationCorrelation(keys,loadings={}) {
 if(!Array.isArray(keys)||!keys.length||new Set(keys).size!==keys.length)fail('invalid-settings','Distinct metric keys are required.');
 if(!object(loadings)||Object.keys(loadings).some(k=>!keys.includes(k)))fail('invalid-settings','Factor loadings must refer to active metrics.');
 const b=keys.map(k=>own(loadings,k)?loadings[k]:0);
 if(b.some(x=>!finite(x)||Math.abs(x)>1))fail('invalid-settings','Innovation factor loadings must be between −1 and 1.');
 return keys.map((_,i)=>keys.map((_,j)=>i===j?1:b[i]*b[j]));
}

export function validateJointAnnualConfig(config,horizon) {
 shape(config,['annualPath','annualMetrics','loadings','observations','terminalMode'],'Joint annual path configuration');
 const terminalMode=config.terminalMode??'conditional-prior';
 if(!['conditional-prior','scenario-baseline'].includes(terminalMode))fail('invalid-settings','Terminal mode must be conditional-prior or scenario-baseline.');
 const annualPath=validateAnnualPathConfig(config.annualPath,horizon);
 const annualMetrics=validateAnnualMetrics(config.annualMetrics??{},horizon);
 const keys=['growth',...Object.keys(annualMetrics).sort()];
 const loadings=Object.fromEntries(keys.map(k=>[k,config.loadings?.[k]??0]));
 factorInnovationCorrelation(keys,config.loadings??{});
 const supplied=config.observations??[];
 if(!Array.isArray(supplied)||supplied.length>200)fail('invalid-settings','Supply at most 200 annual observations.');
 const observations=Array.from(supplied).map((o,i)=>{
  shape(o,['metric','year','value','errorSD','label'],`Observation ${i+1}`);
  if(!keys.includes(o.metric)||!Number.isInteger(o.year)||o.year<1||o.year>horizon||!finite(o.value)||!finite(o.errorSD)||o.errorSD<0||o.label!==undefined&&(typeof o.label!=='string'||o.label.length>200))fail('invalid-settings',`Observation ${i+1} needs an active metric, forecast year, finite value and nonnegative observation-error SD.`);
  return {...o};
 });
 return {annualPath,annualMetrics,loadings,observations,terminalMode};
}

function normal(random) {
 const u=random(),v=random();
 if(!finite(u)||!finite(v)||u<0||u>=1||v<0||v>=1)fail('invalid-random','Random uniforms must be finite and in [0, 1).');
 return Math.sqrt(-2*Math.log1p(-u))*Math.cos(2*Math.PI*v);
}

// An observation row is h*z = target, where z is standard normal. Independent
// observation errors are additional coordinates of z. Twice-reorthogonalized
// row QR produces the joint conditional law without inverse matrices, covariance
// subtraction, positive-definite jitter, or silently changed hard constraints.
function orthogonalizeObservations(observations,rows,dimension,innovationDimension,structures) {
 const basis=[],steps=[],seenStates=new Set(),seenSignatures=new Set(),knownCommonYears=new Set();
 const rankTolerance=64*Number.EPSILON*Math.max(1,Math.sqrt(dimension));
 // Hard equalities can remove finite variance even as two rows approach one
 // another. A small residual is NOT proof of redundancy. Refuse this numerical
 // regime unless the model structure itself proves an exact linear relation.
 const minimumIndependentResidual=1e-7;
 function structurallyRedundant(o) {
  if(o.errorSD>0)return false;
  const s=structures[o.index];
  return seenStates.has(o.index)||seenSignatures.has(s.signature)||basis.length>=innovationDimension||s.commonOnly&&Array.from({length:s.year},(_,i)=>i+1).every(y=>knownCommonYears.has(y));
 }
 function recordHard(o) {
  if(o.errorSD>0)return;
  const s=structures[o.index];seenStates.add(o.index);seenSignatures.add(s.signature);
  if(s.commonOnly&&(s.rho===0||Array.from({length:s.year-1},(_,i)=>i+1).every(y=>knownCommonYears.has(y))))knownCommonYears.add(s.year);
 }
 for(const observation of observations) {
  const raw=Float64Array.from(rows[observation.index]);
  if(observation.errorSD>0)raw[observation.noiseIndex]=observation.errorSD;
  const scale=norm(raw);
  if(!finite(scale))fail('numerical-range','Observation variance exceeded the finite numerical range.');
  if(scale===0){steps.push({observation,scale,coefficients:[],rank:-1,deterministic:true});continue;}
  const residual=Float64Array.from(raw,x=>x/scale),coefficients=new Array(basis.length).fill(0);
  for(let pass=0;pass<2;pass++)for(let j=0;j<basis.length;j++) {
   const coefficient=dot(residual,basis[j]);coefficients[j]+=coefficient;
   for(let k=0;k<dimension;k++)residual[k]-=coefficient*basis[j][k];
  }
  const residualScale=norm(residual);
  if(residualScale<minimumIndependentResidual) {
   const proven=structurallyRedundant(observation);
   if(!proven||residualScale>8*rankTolerance)fail('ill-conditioned-observations',observation.errorSD>0?'Observation-error SD is too small relative to the other constraints to resolve. Increase its error SD or explicitly choose an exact anchor.':'Distinct hard constraints are too nearly dependent to resolve reliably. Revise the innovation dependence or persistence, or remove redundant targets; no approximate constraint was substituted.',{metric:observation.metric,year:observation.year,residualScale,minimumIndependentResidual});
   steps.push({observation,scale,coefficients,rank:-1,residualScale});
  } else {
   const rank=basis.length;
   basis.push(Float64Array.from(residual,x=>x/residualScale));
   steps.push({observation,scale,coefficients,rank,residualScale});
  }
  recordHard(observation);
 }
 return {basis,steps,rankTolerance,minimumIndependentResidual};
}

export function prepareJointAnnualPaths(context,config) {
 if(!object(context)||!Array.isArray(context.baseline)||context.baseline.length<1||context.baseline.length>30||!Array.from(context.baseline).every(finite))fail('invalid-context','A finite baseline growth path of 1–30 years is required.');
 context=copy(context);
 const n=context.baseline.length,T=n+1,c=validateJointAnnualConfig(config,n);
 const keys=['growth',...Object.keys(c.annualMetrics).sort()],specs={growth:c.annualPath,...c.annualMetrics};
 if(!finite(context.terminalGrowth)||!Number.isInteger(context.terminalYear)||context.terminalYear<1||context.terminalYear>T)fail('invalid-context','A valid hard terminal growth anchor is required.');
 if(context.baseline.slice(context.terminalYear-1).some(g=>Math.abs(g-context.terminalGrowth)>1e-12))fail('invalid-context','Growth at and after maturity must equal the baseline terminal growth.');
 if(context.variableTerminal&&c.annualPath.fixedYears.some(y=>y>=context.terminalYear))fail('inconsistent-anchors','A user-fixed growth year at or after maturity conflicts with variable terminal growth.');
 const baseline={},terminalBaseline={growth:context.terminalGrowth};
 for(const key of keys) {
  const base=key==='growth'?context.baseline:context.metrics?.[key];
  if(!Array.isArray(base)||base.length!==n||!Array.from(base).every(finite))fail('invalid-context',`A finite ${key} baseline is required for every explicit year.`);
  if(key!=='growth')terminalBaseline[key]=context.terminals?.[key]??base.at(-1);
  if(!finite(terminalBaseline[key]))fail('invalid-context',`The ${key} terminal baseline must be finite.`);
  baseline[key]=[...base,terminalBaseline[key]];
 }
 const indexOf=(key,year)=>keys.indexOf(key)*T+year-1;
 const stateCount=keys.length*T,means=keys.flatMap(k=>baseline[k]);
 const observations=[];
 for(const key of keys) {
  for(const year of specs[key].fixedYears)observations.push({metric:key,year,index:indexOf(key,year),value:baseline[key][year-1],errorSD:0,kind:'fixed-year'});
  const years=key==='growth'?Array.from({length:T-context.terminalYear+1},(_,i)=>context.terminalYear+i):[T];
  for(const year of years)observations.push({metric:key,year,index:indexOf(key,year),value:baseline[key][year-1],errorSD:0,kind:'terminal',endpoint:key});
 }
 if(context.hardConstraints!==undefined) {
  if(!Array.isArray(context.hardConstraints)||context.hardConstraints.length>200)fail('invalid-context','Hard source constraints must be an array of at most 200 observations.');
  for(const o of context.hardConstraints) {
   shape(o,['metric','year','value','label'],'Hard source constraint');
   if(!keys.includes(o.metric)||!Number.isInteger(o.year)||o.year<1||o.year>T||!finite(o.value))fail('invalid-context','Hard source constraint is invalid.');
   observations.push({...o,index:indexOf(o.metric,o.year),errorSD:0,kind:'source'});
  }
 }
 for(const o of c.observations)observations.push({...o,index:indexOf(o.metric,o.year),kind:o.errorSD===0?'exact-observation':'noisy-observation'});
 observations.sort((a,b)=>(a.errorSD>0)-(b.errorSD>0));
 // An optional, explicitly different model for prescribed terminal scenarios:
 // a terminal vector chooses a deterministic baseline first. The legacy unit
 // bridge mean gives a documented endpoint response; residual Gaussian support
 // then remains centered at zero at those endpoints. No variance is invented.
 const endpointTrend=keys.flatMap(key=>{
  const fixedYears=[...new Set(observations.filter(o=>o.metric===key&&o.errorSD===0&&o.kind!=='terminal'&&o.year<=n).map(o=>o.year))];
  const unit=prepareAnnualPath(Array(n).fill(0),{...specs[key],fixedYears,innovationSD:0},{terminalGrowth:0,terminalYear:key==='growth'?context.terminalYear:T});
  return [...unit.sample(()=>{throw Error('Deterministic bridge must not use random draws.');},1),1];
 });
 const factors=[];
 for(let t=0;t<T;t++) {
  if(keys.some(k=>specs[k].innovationSD>0&&c.loadings[k]!==0))factors.push({year:t,common:true});
  for(const key of keys)if(specs[key].innovationSD>0&&Math.abs(c.loadings[key])<1)factors.push({year:t,key});
 }
 const innovationDimension=factors.length,softCount=observations.filter(o=>o.errorSD>0).length,dimension=innovationDimension+softCount;
 const rows=Array.from({length:stateCount},()=>new Float64Array(dimension));
 for(let i=0;i<keys.length;i++) {
  const key=keys[i],{innovationSD:sd,persistence:rho}=specs[key],loading=c.loadings[key];
  for(let t=0;t<T;t++)for(let j=0;j<factors.length;j++) {
   const f=factors[j];if(f.year>t)continue;
   const weight=f.common?loading:f.key===key?Math.sqrt((1-loading)*(1+loading)):0;
   rows[i*T+t][j]=sd*weight*rho**(t-f.year);
  }
 }
 let noiseIndex=innovationDimension;
 for(const o of observations)if(o.errorSD>0)o.noiseIndex=noiseIndex++;
 const structures=keys.flatMap(key=>Array.from({length:T},(_,i)=>{
  const year=i+1,commonOnly=specs[key].innovationSD>0&&Math.abs(c.loadings[key])===1,rho=specs[key].persistence;
  return {year,rho,commonOnly,signature:commonOnly?`common:${year}:${year===1?0:rho}`:`state:${key}:${year}`};
 }));
 const {basis,steps,rankTolerance,minimumIndependentResidual}=orthogonalizeObservations(observations,rows,dimension,innovationDimension,structures);
 const projections=rows.map(row=>basis.map(q=>dot(row,q)));
 const residualRows=rows.map((row,i)=>{
  const r=Float64Array.from(row);
  for(let j=0;j<basis.length;j++)for(let k=0;k<dimension;k++)r[k]-=projections[i][j]*basis[j][k];
  return r;
 });
 const hardIndices=new Set(observations.filter(o=>o.errorSD===0).map(o=>o.index));
 // Exact equality coordinates have no remaining variance. Assign their exact
 // target after validating all dependent equalities; this is equality enforcement,
 // not clipping any stochastic value or replacing a rejected draw.
 for(const i of hardIndices)residualRows[i].fill(0);
 const pathSD=residualRows.map(norm);
 const activeNoiseColumns=Array.from({length:dimension},(_,i)=>i).filter(j=>residualRows.some(row=>row[j]!==0));
 const compactRows=residualRows.map(row=>Float64Array.from(activeNoiseColumns,j=>row[j]));

 function target(observation,endpoints) {
  if(!observation.endpoint||!own(endpoints,observation.endpoint))return observation.value;
  const value=endpoints[observation.endpoint];
  // Retain reviewed growth arithmetic bit-for-bit at the baseline endpoint.
  if(observation.endpoint==='growth'&&value===terminalBaseline.growth)return observation.value;
  return value;
 }
 function condition(endpoints={}) {
  if(!object(endpoints)||Object.keys(endpoints).some(k=>!keys.includes(k)||!finite(endpoints[k])))fail('invalid-endpoints','Terminal endpoints must contain only finite values for active primitive metrics.');
  const scenarioMean=c.terminalMode==='scenario-baseline'?means.map((m,i)=>{
   const key=keys[Math.floor(i/T)],endpoint=own(endpoints,key)?endpoints[key]:terminalBaseline[key];
   return m+endpointTrend[i]*(endpoint-terminalBaseline[key]);
  }):means;
  if(c.terminalMode==='scenario-baseline')for(const o of observations)if(o.kind==='terminal')scenarioMean[o.index]=target(o,endpoints);
  const alpha=[],exact=new Map();
  for(const o of observations)if(o.errorSD===0) {
   const value=target(o,endpoints);
   if(exact.has(o.index)&&exact.get(o.index)!==value)fail('inconsistent-anchors',`Conflicting exact ${o.metric} anchors in year ${o.year}.`,{metric:o.metric,year:o.year,values:[exact.get(o.index),value]});
   exact.set(o.index,value);
  }
  for(const step of steps) {
   const o=step.observation,value=target(o,endpoints),delta=value-scenarioMean[o.index];
   if(!finite(delta))fail('numerical-range','A conditioning target exceeds the finite numerical range.');
   if(step.deterministic) {
    if(delta!==0)fail('inconsistent-anchors',`The ${o.metric} target in year ${o.year} conflicts with a zero-variance path. Increase its innovation SD or keep the target at baseline.`,{metric:o.metric,year:o.year,value,baseline:scenarioMean[o.index]});
    continue;
   }
   const scaled=delta/step.scale;
   if(!finite(scaled))fail('numerical-range','A target is too far from its baseline relative to uncertainty.');
   let projected=0,absoluteSum=0;
   for(let j=0;j<step.coefficients.length;j++){const part=step.coefficients[j]*alpha[j];projected+=part;absoluteSum+=Math.abs(part);}
   const residual=scaled-projected;
   if(step.rank===-1) {
    const tolerance=4*rankTolerance*Math.max(1,Math.abs(scaled),absoluteSum);
    if(Math.abs(residual)>tolerance)fail('inconsistent-anchors',`The exact ${o.metric} target in year ${o.year} conflicts with the other hard anchors and the specified innovation dependence.`,{metric:o.metric,year:o.year,residual,tolerance});
   }else {
    alpha.push(residual/step.residualScale);
    if(!finite(alpha.at(-1)))fail('numerical-range','Conditional mean exceeded the finite numerical range.');
   }
  }
  const mean=scenarioMean.map((m,i)=>m+dot(projections[i],alpha));
  if(mean.some(x=>!finite(x)))fail('numerical-range','Conditional mean exceeded the finite numerical range.');
  for(const [i,value]of exact)mean[i]=value;
  return {mean,exact};
 }
 const baselineCondition=condition();
 function split(values) {
  return Object.fromEntries(keys.map((key,i)=>[key,Array.from(values.slice(i*T,i*T+n))]));
 }
 function sample(random,endpoints={}) {
  if(typeof random!=='function')fail('invalid-random','Joint sampling requires a random generator.');
  if(!object(endpoints)||Object.keys(endpoints).some(k=>!keys.includes(k)||!finite(endpoints[k])))fail('invalid-endpoints','Terminal endpoints must contain only finite values for active primitive metrics.');
  const {mean}=Object.entries(endpoints).some(([k,v])=>v!==terminalBaseline[k])?condition(endpoints):baselineCondition;
  const z=Float64Array.from(activeNoiseColumns,()=>normal(random));
  const values=mean.map((m,i)=>m+dot(compactRows[i],z));
  if(values.some(x=>!finite(x)))fail('numerical-range','The sampled path exceeded the finite numerical range.');
  const paths=split(values),{growth,...metricPaths}=paths;
  return {growthPath:growth,metricPaths};
 }
 function moments(endpoints={},{includeCovariance=false}={}) {
  const {mean}=condition(endpoints);
  return {scope:'Conditional on the selected terminal endpoints; excludes between-endpoint mixture variance and economic exclusion effects.',keys:[...keys],years:T,indexOrder:'metric-major; forecast years 1 through H+1',mean:split(mean),pathSD:split(pathSD),terminalMean:Object.fromEntries(keys.map((k,i)=>[k,mean[i*T+n]])),terminalSD:Object.fromEntries(keys.map((k,i)=>[k,pathSD[i*T+n]])),...(includeCovariance?{covariance:residualRows.map(a=>residualRows.map(b=>dot(a,b)))}:{})};
 }
 function assertEndpointRanges(ranges) {
  if(!object(ranges)||Object.keys(ranges).some(k=>!keys.includes(k)))fail('invalid-endpoints','Endpoint ranges must refer to active primitive metrics.');
  const low={};
  for(const [k,r]of Object.entries(ranges)) {
   if(!object(r)||Object.keys(r).some(k=>!['low','high'].includes(k))||!finite(r.low)||!finite(r.high)||r.low>r.high)fail('invalid-endpoints','Endpoint ranges require finite low ≤ high.');
   low[k]=r.low;
  }
  condition(low);
  // Feasibility is affine: these vertices span a Cartesian product of independent
  // endpoint ranges. This does not certify a nonlinear endpoint mapping.
  for(const [k,r]of Object.entries(ranges))if(r.high!==r.low)condition({...low,[k]:r.high});
  return true;
 }
 const correlation=factorInnovationCorrelation(keys,c.loadings);
 const innovationCovariance=keys.map((a,i)=>keys.map((b,j)=>specs[a].innovationSD*specs[b].innovationSD*correlation[i][j]));
 if(innovationCovariance.flat().some(x=>!finite(x)))fail('numerical-range','Innovation covariance exceeds the finite numerical range.');
 return {
  version:JOINT_ANNUAL_PATH_VERSION,method:JOINT_ANNUAL_PATH_METHOD,terminalMode:c.terminalMode,baseline:copy(context.baseline),config:copy(c),keys:[...keys],horizon:n,terminalYear:context.terminalYear,terminalGrowth:context.terminalGrowth,
  sample,moments,assertEndpoints:endpoints=>{condition(endpoints);return true;},assertEndpointRanges,
  audit(endpoints={}) {
   return {version:JOINT_ANNUAL_PATH_VERSION,method:JOINT_ANNUAL_PATH_METHOD,terminalMode:c.terminalMode,terminalTreatment:c.terminalMode==='scenario-baseline'?'Prescribed terminal draws first select a deterministic baseline using each metric’s unit Gaussian-bridge mean response, preserving fixed/source anchors. Joint residual paths are then conditioned around that scenario baseline. This is an exogenous endpoint scenario mixture, not conditioning the original fixed prior on those endpoint values. Noisy observations update annual paths within each scenario; they do not reweight the prescribed terminal mixture.':'Terminal endpoints are hard observations of one fixed Gaussian prior. An endpoint outside deterministic or dependent support is a conflict. Repeated externally drawn endpoints form a prescribed mixture of conditional paths, not a posterior updated endpoint law.',horizon:n,keys:[...keys],baseline:split(means),terminalBaseline:{...terminalBaseline},terminalYear:context.terminalYear,
    innovation:Object.fromEntries(keys.map(k=>[k,{innovationSD:specs[k].innovationSD,persistence:specs[k].persistence,factorLoading:c.loadings[k],units:units(k)}])),
    innovationCorrelation:copy(correlation),innovationCovariance:copy(innovationCovariance),innovationCorrelationMeaning:'Correlation of standardized one-year innovations. A metric with zero innovation SD has no defined realized innovation correlation. This is not annual-path correlation after conditioning.',
    observations:observations.map(({index,noiseIndex,...o})=>({...o,value:target(o,endpoints)})),moments:moments(endpoints),rank:{latentDimension:dimension,independentConstraints:basis.length,tolerance:rankTolerance,minimumIndependentResidual},
    description:'Joint Gaussian AR(1) deviations about the edited baseline; diagonal persistence and one-factor correlated innovations; all hard and noisy observations conditioned jointly across metrics and years. Innovation SD, observation-error SD and conditional annual-path SD are different quantities. Positive observation-error SD means noisy Gaussian evidence, not an interval constraint or an imposed target distribution. Parameters are analyst assumptions, not estimated company calibration. No clipping, rejection replacement, distress probability, stock-price process, or independent FCFF draw is introduced.',
    ...(context.terminalAnchorNote?{terminalAnchorNote:context.terminalAnchorNote}:{})};
  }
 };
}

export function jointAnnualAudit(sampler,scenarios=[],endpoints={}) {
 return {...sampler.audit(endpoints),preview:scenarios.slice(0,12).map(s=>({trial:s.trial,growth:[...s.growthPath],metrics:copy(s.metricPaths),...(s.terminal?{terminal:copy(s.terminal)}:{})}))};
}
