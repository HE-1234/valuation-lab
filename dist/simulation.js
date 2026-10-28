import {isJoint,jointDefaults,jointEffectiveConfig,validateJointState,prepareJointSimulation,jointEndpoints,jointResultMetadata,JOINT_NOTE} from './joint-simulation-config.js';
import {DEFAULT_SIMULATION_TRIALS} from './simulation-count-policy.js';
import {ANNUAL_GROWTH_PATH,ANNUAL_METRIC_PATHS,annualPathDefaults,validateAnnualPathConfig,prepareAnnualPath,annualPathAudit,annualMetricDefaults,validateAnnualMetrics,prepareAnnualMetrics,sampleAnnualMetrics,annualMetricsAudit,annualMetricConstraint,conditionedGrowthContext} from './annual-path-sampling.js';
// Conditional uncertainty in DCF inputs, never a stock-price process.
// Existing deterministic/historical engine and research records remain unchanged.
import {operatingAssumptions} from './current-operating.js';
import {defaults, valueCompany, validDate} from './engine.js';
import {calculateCurrent, currentIssues, quoteComparison, valueCurrentWithClaims} from './current-model.js';

export const SIMULATION_VERSION = '1.1.0';
export const SIMULATION_DRIVER_KEYS = Object.freeze(['growth', 'targetMargin', 'salesCapital', 'wacc']);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const clone = value => JSON.parse(JSON.stringify(value));
// Arithmetic limits only: revenue and discount factors stay positive, EBIT cannot exceed revenue.
const limits = Object.freeze({growth:[-1,Infinity,true],targetMargin:[-Infinity,1,false],salesCapital:[0,Infinity,true],wacc:[-1,Infinity,true]});
const operatingLoadings = Object.freeze({growth:.7,targetMargin:.7,salesCapital:.4,wacc:0});
const quantileLevels = Object.freeze({p5:.05,p10:.1,p25:.25,p50:.5,p75:.75,p90:.9,p95:.95});

function assertObject(value, name) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object.`);
}

// These widths are teaching examples, not estimates derived from company data.
// The mode is the corresponding deterministic assumption; bounds are editable.
export function simulationDefaults(assumptions = defaults) {
 const a = {...defaults,...assumptions};
 // Starting ranges stay inside the arithmetic limits and always contain the current assumption.
 const bounds = (mode, width, low, high) => ({type:'triangular',low:Math.min(mode,Math.max(low,mode-width)),mode,high:Math.max(mode,Math.min(high,mode+width))});
 return jointDefaults({
  trials:DEFAULT_SIMULATION_TRIALS, seed:'valuation-lab', binCount:36, dependence:'independent', method:'annual-path', annualPath:annualPathDefaults(a.years),annualMetrics:annualMetricDefaults(a.years),annualTerminal:annualTerminalDefaults({growth:a.terminalGrowth,taxRate:a.tax,roic:a.terminalROIC}),
  drivers:{
   growth:bounds(a.growth,.05,-.99,Infinity),
   targetMargin:bounds(a.targetMargin,.05,-Infinity,1),
   salesCapital:bounds(a.salesCapital,a.salesCapital*.25,Number.MIN_VALUE,Infinity),
   wacc:bounds(a.wacc,.015,-.99,Infinity)
  }
 },{horizon:a.years});
}

export const SIMULATION_DISTRIBUTIONS = Object.freeze(['fixed','triangular','uniform','normal']);
const distributionFields = Object.freeze({fixed:['value'],triangular:['low','mode','high'],uniform:['low','high'],normal:['mean','sd','low','high']});

// Returns a fresh canonical specification; untyped v1.0 ranges migrate to triangular.
// Parameters for rate drivers are fractions (0.10 = 10%), including normal SD.
export function validateDriverDistribution(spec, key) {
 assertObject(spec, `${key || 'Input'} distribution`);
 if (key != null && !SIMULATION_DRIVER_KEYS.includes(key)) throw new Error(`Unsupported uncertain driver: ${key}.`);
 const type = own(spec,'type') ? spec.type : 'triangular', fields = distributionFields[type];
 if (!SIMULATION_DISTRIBUTIONS.includes(type)) throw new Error(`${key || 'Input'}: unsupported distribution type.`);
 if (Object.keys(spec).some(k => k !== 'type' && !fields.includes(k))) throw new Error(`${key || 'Input'}: ${type} supports only ${fields.join(', ')}.`);
 if (!fields.every(k => finite(spec[k]))) throw new Error(`${key || 'Input'}: ${fields.join(', ')} must be finite numbers.`);
 const d = {type,...Object.fromEntries(fields.map(k => [k,spec[k]]))};
 const low = type === 'fixed' ? d.value : d.low, high = type === 'fixed' ? d.value : d.high;
 if (type === 'triangular' && !(low <= d.mode && d.mode <= high)) throw new Error(`${key || 'Input'}: require low ≤ mode ≤ high.`);
 if (type !== 'fixed' && type !== 'triangular' && !(low < high)) throw new Error(`${key || 'Input'}: require low < high; use Fixed for a constant input.`);
 if (!finite(high-low)) throw new Error(`${key || 'Distribution'}: numerical range is too wide.`);
 if (key) {
  const [min,max,strict] = limits[key];
  if ((strict ? low <= min : low < min) || high > max) throw new Error(`${key}: distribution outside supported bounds (${strict ? '>' : '≥'} ${min}${finite(max) ? `, ≤ ${max}` : ''}).`);
 }
 if (type === 'normal') {
  if (!(d.sd > 0)) throw new Error(`${key || 'Input'}: normal SD must be strictly positive; use Fixed for zero uncertainty.`);
  normalContext(d); // Fail closed before a run if finite precision cannot resolve the mass.
 }
 return d;
}

function assertProbability(u) {
 if (!finite(u) || u < 0 || u > 1) throw new Error('A distribution quantile must be between zero and one.');
}

// Accurate standard-normal tail. The central series is NIST DLMF 7.6.2;
// the Laplace continued fraction is DLMF 7.9.1 after z/sqrt(2) substitution.
// Evaluating log tails avoids subtraction of two CDF values rounded to one.
const LOG_SQRT_2PI = Math.log(2*Math.PI)/2;
function logNormalLowerTail(z) { // z <= 0
 const x = -z;
 if (x < 2) {
  const q = x/Math.SQRT2;
  let term = q, sum = q;
  for (let n=1;n<100;n++) {
   term *= 2*q*q/(2*n+1);sum += term;
   if (term <= sum*Number.EPSILON) break;
  }
  return Math.log(.5-Math.exp(-q*q)*sum/Math.sqrt(Math.PI));
 }
 let fraction = 0;
 for (let n=100;n>=1;n--) fraction = n/(x+fraction);
 return -x*x/2-LOG_SQRT_2PI-Math.log(x+fraction);
}
function logNormalCDF(z) {
 return z <= 0 ? logNormalLowerTail(z) : Math.log1p(-Math.exp(logNormalLowerTail(-z)));
}
function logAdd(a,b) {
 if (a === -Infinity) return b;
 if (b === -Infinity) return a;
 const hi = Math.max(a,b);
 return hi+Math.log1p(Math.exp(Math.min(a,b)-hi));
}
function normalContext(d) {
 const a = (d.low-d.mean)/d.sd, b = (d.high-d.mean)/d.sd;
 const fail = () => {throw new Error('Normal bounds/mean/SD are too extreme or too narrow to resolve numerically. Widen the bounds, revise mean/SD, or use Fixed.');};
 if (!finite(a) || !finite(b) || !(a < b) || !finite(a*a) || !finite(b*b)) fail();
 // Far-out narrow tails can lose the meaningful input variation on conversion
 // back from standardized units. Never replace an unresolved normal with a point mass.
 if (a > 10000 || b < -10000 || !(d.low+(d.high-d.low)/2 > d.low && d.low+(d.high-d.low)/2 < d.high)) fail();
 const leftA = logNormalCDF(a), leftB = logNormalCDF(b), rightA = logNormalCDF(-a), rightB = logNormalCDF(-b);
 const hi = a >= 0 ? rightA : leftB, lo = a >= 0 ? rightB : leftA;
 if (!(hi-lo > 1e-12)) fail();
 const logMass = hi+Math.log(-Math.expm1(lo-hi));
 if (!finite(logMass)) fail();
 return {a,b,leftA,leftB,rightA,rightB,logMass};
}
function inverseLogNormalLowerTail(logp) {
 if (logp === Math.log(.5)) return 0;
 let low = -Math.sqrt(-2*logp)-1, high = 0;
 // Bracketed inversion, not clipping a Gaussian sample. 60 bisections reach
 // floating-point resolution for supported standardized tails.
 for (let i=0;i<60;i++) {
  const middle = low+(high-low)/2;
  if (middle === low || middle === high) break;
  if (logNormalLowerTail(middle) < logp) low = middle; else high = middle;
 }
 return low+(high-low)/2;
}
function normalQuantileUnchecked(u,d,c) {
 if (u === 0) return d.low;
 if (u === 1) return d.high;
 const left = logAdd(c.leftA+Math.log1p(-u),c.leftB+Math.log(u));
 const right = logAdd(c.rightA+Math.log1p(-u),c.rightB+Math.log(u));
 const z = left <= Math.log(.5) ? inverseLogNormalLowerTail(left) : -inverseLogNormalLowerTail(right);
 // Use the closest anchor to reduce cancellation for shifted tail distributions.
 const anchors = [{x:d.mean,z:0},{x:d.low,z:c.a},{x:d.high,z:c.b}];
 const anchor = anchors.reduce((best,next) => Math.abs(z-next.z)<Math.abs(z-best.z) ? next : best);
 const value = anchor.x+d.sd*(z-anchor.z);
 if (!finite(value) || value < d.low || value > d.high) throw new Error('Normal quantile cannot be resolved within the specified bounds; revise mean/SD or bounds.');
 return value;
}
function triangularQuantileUnchecked(u, {low,mode,high}) {
 if (low === high) return low;
 if (u === 0) return low;
 if (u === 1) return high;
 const width = high-low, split = (mode-low)/width;
 return u < split ? low + width*Math.sqrt(u*split) : high - width*Math.sqrt((1-u)*(1-split));
}
function prepareDistribution(d) {
 if (d.type === 'fixed') return () => d.value;
 if (d.type === 'triangular') return u => triangularQuantileUnchecked(u,d);
 if (d.type === 'uniform') return u => u === 1 ? d.high : d.low+(d.high-d.low)*u;
 const context = normalContext(d);
 return u => normalQuantileUnchecked(u,d,context);
}
export function distributionQuantile(u, spec) {
 assertProbability(u);
 return prepareDistribution(validateDriverDistribution(spec))(u);
}

// UI shape previews and audit summaries use the same distribution as the sampler.
// Normal actual moments use deterministic midpoint-quantile quadrature (1024
// points), explicitly approximate; they are not the entered underlying parameters.
export function distributionSummary(spec, key) {
 const d = validateDriverDistribution(spec,key), sample = prepareDistribution(d);
 const low = sample(0), high = sample(1), width = high-low;
 let mean, sd, momentMethod = 'analytic';
 if (d.type === 'fixed' || width === 0) {mean=low;sd=0;}
 else if (d.type === 'uniform') {mean=low+width/2;sd=width/Math.sqrt(12);}
 else if (d.type === 'triangular') {
  const r = (d.mode-low)/width;
  mean=low+width*((r+1)/3);sd=width*Math.sqrt((1+r*r-r)/18);
 } else {
  // Work in support-relative coordinates so large positive input scales do not
  // overflow variance, and tiny standard deviations do not cancel around mean.
  const n=1024, center=sample(.5);
  let m=0, variance=0;
  for(let i=0;i<n;i++) {
   const x=(sample((i+.5)/n)-center)/width, delta=x-m;
   m+=delta/(i+1);variance+=delta*(x-m);
  }
  mean=center+width*m;sd=width*Math.sqrt(variance/n);
  momentMethod='approximate actual bounded moments; 1,024 midpoint-quantile integration points';
 }
 const peak=d.type==='normal' ? Math.max(low,Math.min(high,d.mean)) : d.type==='triangular' ? d.mode : low;
 const density=width===0 ? [{x:low,y:1}] : Array.from({length:33},(_,i)=>{
  const x=i===32 ? high : low+width*i/32;
  let y=1;
  if(d.type==='triangular') y=x===d.mode ? 1 : x<d.mode ? (x-low)/(d.mode-low) : (high-x)/(high-d.mode);
  if(d.type==='normal') y=Math.exp(-.5*((x-peak)/d.sd)*((x-d.mean)/d.sd+(peak-d.mean)/d.sd));
  return {x,y};
 });
 return {type:d.type,parameters:d,low,high,mean,sd,median:sample(.5),p5:sample(.05),p95:sample(.95),density,
  densityMeaning:'Relative density normalized to peak 1; a qualitative input shape, not a probability.',momentMethod,
  parameterMeaning:d.type==='normal' ? 'Entered mean and SD describe the underlying unbounded normal. Actual bounded mean and SD differ after conditioning on low ≤ input ≤ high.' : 'Bounds and parameters describe the selected input distribution; they are analyst assumptions, not calibrated probabilities.'};
}

export function annualTerminalDefaults(terminal){return Object.fromEntries(['growth','taxRate','roic'].map(k=>[k,{type:'fixed',value:terminal[k]}]));}
export function validateAnnualTerminal(spec){
 assertObject(spec,'Terminal uncertainty');
 if(Object.keys(spec).some(k=>!['growth','taxRate','roic'].includes(k)))throw Error('Unsupported terminal uncertainty input.');
 return Object.fromEntries(Object.entries(spec).map(([key,value])=>{
  const d=validateDriverDistribution(value),low=d.type==='fixed'?d.value:d.low,high=d.type==='fixed'?d.value:d.high;
  if((key==='taxRate'&&(low<0||high>1))||(key==='roic'&&low<=0))throw Error('Terminal uncertainty cannot be computed: tax 0–100% and ROIC above zero.');
  return [key,d];
 }));
}

export function validateSimulationConfig(config, assumptions = defaults) {
 assertObject(config,'Simulation settings');
 const unknown = Object.keys(config).filter(k => !['trials','seed','binCount','dependence','drivers','method','annualPath','annualMetrics','annualTerminal','jointAnnual'].includes(k));
 if (unknown.length) throw new Error(`Unknown simulation setting: ${unknown.join(', ')}.`);
 const c = {trials:DEFAULT_SIMULATION_TRIALS,seed:'valuation-lab',binCount:36,dependence:'independent',...config,drivers:{}};
 if (!Number.isInteger(c.trials) || c.trials < 1 || c.trials > 50000) throw new Error('Trials must be an integer from 1 to 50,000.');
 if (!Number.isInteger(c.binCount) || c.binCount < 1 || c.binCount > 200) throw new Error('Histogram bin count must be an integer from 1 to 200.');
 if (!(typeof c.seed === 'string' && c.seed.trim().length > 0 && c.seed.length <= 128) && !Number.isSafeInteger(c.seed)) throw new Error('Seed must be a nonempty string of at most 128 characters or a safe integer.');
 c.seed = String(c.seed);
 if (!['independent','operating-linked'].includes(c.dependence)) throw new Error('Dependence must be independent or operating-linked.');
 if (own(config,'method') && !['legacy','annual-path','joint-annual-path'].includes(config.method)) throw Error('Unsupported simulation method.');
 c.method=config.method??'legacy';
 if(isJoint(c)||own(config,'jointAnnual'))c.jointAnnual=validateJointState(config.jointAnnual,c,value=>validateSimulationConfig(value,assumptions));
 if(c.method==='annual-path'||own(config,'annualPath'))c.annualPath=validateAnnualPathConfig(own(config,'annualPath')?config.annualPath:annualPathDefaults());
 if(own(config,'annualMetrics'))c.annualMetrics=validateAnnualMetrics(config.annualMetrics);
 if(own(config,'annualTerminal'))c.annualTerminal=validateAnnualTerminal(config.annualTerminal);
 const given = config.drivers ?? {};
 assertObject(given,'Driver distributions');
 for (const key of Object.keys(given)) if (!SIMULATION_DRIVER_KEYS.includes(key)) throw new Error(`Unsupported uncertain driver: ${key}. Tax, stable growth, terminal ROIC, claims and shares stay fixed.`);
 const a = {...defaults,...assumptions};
 for (const key of SIMULATION_DRIVER_KEYS) {
  const spec = own(given,key) ? given[key] : {type:'fixed',value:a[key]};
  c.drivers[key] = validateDriverDistribution(spec,key);
 }
 return c;
}

// FNV-1a string hash followed by Mulberry32. Identical inputs produce identical
// JavaScript draws. This generator is for reproducibility, not cryptography.
export function createSeededRandom(seed) {
 if (!(typeof seed === 'string' && seed.trim() && seed.length <= 128) && !Number.isSafeInteger(seed)) throw new Error('Invalid random seed.');
 let state = 2166136261;
 for (const c of String(seed)) {state ^= c.codePointAt(0); state = Math.imul(state,16777619);}
 return () => {
  state = (state + 0x6D2B79F5) >>> 0;
  let t = Math.imul(state ^ (state >>> 15),1 | state);
  t ^= t + Math.imul(t ^ (t >>> 7),61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };
}

export function triangularQuantile(u, range) {
 assertProbability(u);
 const d = validateDriverDistribution(range);
 if (d.type !== 'triangular') throw new Error('triangularQuantile requires a triangular distribution.');
 return triangularQuantileUnchecked(u,d);
}

function standardNormal(random) {
 // 1-u avoids log(0) even if the seeded generator produces exactly zero.
 return Math.sqrt(-2*Math.log(1-random()))*Math.cos(2*Math.PI*random());
}

function normalCDF(z) {
 // Abramowitz–Stegun 7.1.26 erf approximation; absolute error about 1.5e-7.
 const x = Math.abs(z)/Math.SQRT2, t = 1/(1+.3275911*x);
 const erf = 1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);
 return Math.min(1,Math.max(0,.5*(1+(z < 0 ? -erf : erf))));
}

function scenario(assumptions, config, random, samplers) {
 const a = {...assumptions};
 const linked = config.dependence === 'operating-linked';
 const shared = linked ? standardNormal(random) : 0;
 for (const key of SIMULATION_DRIVER_KEYS) {
  if(config.method==='annual-path'&&(key==='growth'||config.annualMetrics?.salesCapital&&key==='salesCapital'))continue;
  const loading = operatingLoadings[key];
  const u = linked && loading !== 0
   ? normalCDF(loading*shared+Math.sqrt(1-loading*loading)*standardNormal(random))
   : random();
  a[key] = samplers[key](u);
 }
 return a;
}

function assertSorted(samples) {
 if (!Array.isArray(samples) || samples.some((x,i) => !finite(x) || i > 0 && x < samples[i-1])) throw new Error('Samples must be a sorted array of finite values.');
}

function quantileUnchecked(samples, p) {
 if (!samples.length) return null;
 const h = (samples.length-1)*p, lo = Math.floor(h), fraction = h-lo;
 return samples[lo]+fraction*((samples[Math.min(lo+1,samples.length-1)])-samples[lo]);
}

// Linear interpolation at index (n-1)*p (Hyndman–Fan type 7).
export function quantile(samples, p) {
 assertSorted(samples);
 if (!finite(p) || p < 0 || p > 1) throw new Error('Quantile must be between zero and one.');
 return quantileUnchecked(samples,p);
}

function bound(samples, value, inclusive) {
 let lo = 0, hi = samples.length;
 while (lo < hi) {const mid = (lo+hi) >>> 1; if (samples[mid] < value || inclusive && samples[mid] === value) lo = mid+1; else hi = mid;}
 return lo;
}

// Right-continuous empirical CDF: all ties are included in F(x) = #{v ≤ x}/n.
export function empiricalCDF(samples, value) {
 assertSorted(samples);
 if (!finite(value)) throw new Error('CDF comparison value must be finite.');
 return samples.length ? bound(samples,value,true)/samples.length : null;
}

export function histogram(samples, binCount = 36) {
 assertSorted(samples);
 if (!Number.isInteger(binCount) || binCount < 1 || binCount > 200) throw new Error('Histogram bin count must be an integer from 1 to 200.');
 if (!samples.length) return [];
 const low = samples[0], high = samples[samples.length-1];
 if (low === high) return [{low,high,count:samples.length,share:1}];
 const span = high-low;
 if (!finite(span)) throw new Error('Histogram numerical range is too wide.');
 const width = span/binCount;
 // A subnormal span may be nonzero while its bin width rounds to zero.
 if (width === 0) return [{low,high,count:samples.length,share:1}];
 const bins = Array.from({length:binCount},(_,i) => ({low:low+i*width,high:i === binCount-1 ? high : low+(i+1)*width,count:0,share:0}));
 for (const value of samples) bins[Math.min(binCount-1,Math.floor((value-low)/span*binCount))].count++;
 for (const bin of bins) bin.share = bin.count/samples.length;
 return bins;
}

function finiteValuation(value) {
 return ['enterprise','equity','perShare','rawPerShare','terminalPV','terminalNopat','terminalReinvestment','forecastPV'].every(k => finite(value[k])) &&
  value.rows.every(row => Object.values(row).every(finite));
}

function comparison(snapshot, draft, baseline, samples) {
 const q = quoteComparison(snapshot,draft,baseline);
 if (q.status !== 'ready') return q;
 // Date-only quotes are explicitly dated observations, not intraday/live quotes.
 if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date) || !validDate(q.date)) return {status:'blocked',message:'Quote comparison withheld: use a valid dated observation (YYYY-MM-DD).'};
 if (!samples.length) return {status:'blocked',message:'Quote percentile is unavailable because no valid simulated draws remain.'};
 const belowCount = bound(samples,q.price,false), atOrBelowCount = bound(samples,q.price,true), aboveCount = samples.length-atOrBelowCount;
 const cdf = atOrBelowCount/samples.length;
 return {...q,sourceUrl:draft.quote.sourceUrl,currency:draft.quote.currency,basisConfirmed:true,cdf,percentile:100*cdf,belowCount,atOrBelowCount,equalCount:atOrBelowCount-belowCount,aboveCount,
  fractionAbove:aboveCount/samples.length,denominator:samples.length,
  message:'Price percentile = share of accepted simulated DCF values at or below the entered price, including ties. Conditional model frequency, not a probability of investment profit or a stock-price forecast.'};
}

export function currentAnnualPathContext(snapshot,draft){
 const baseline=calculateCurrent(snapshot,draft);
 const growth=baseline.rows.map(r=>r.growth),stable=draft.assumptions.terminalGrowth,maturity=draft.assumptions.years;
 const terminalYear=growth.slice(maturity-1).every(g=>Math.abs(g-stable)<=1e-12)?maturity:growth.length+1;
 const a=operatingAssumptions(snapshot,draft,draft.assumptions);
 const metrics={margin:baseline.rows.map(r=>r.margin),taxRate:baseline.rows.map((r,i)=>a.yearlyOverrides?.[i]?.taxRate??a.tax),wacc:baseline.rows.map(r=>r.wacc),salesCapital:baseline.rows.map((r,i)=>a.yearlyOverrides?.[i]?.salesCapital??a.salesCapital)};
 return {baseline:growth,terminalYear,terminalGrowth:stable,metrics,terminals:{margin:a.targetMargin,taxRate:a.tax,wacc:a.wacc,salesCapital:a.targetMargin>0?a.terminalROIC/((1+a.terminalGrowth)*a.targetMargin*(1-a.tax)):a.salesCapital},terminalScalars:{growth:a.terminalGrowth,taxRate:a.tax,roic:a.terminalROIC},capital:'salesCapital'};
}

function* currentSimulationSteps(snapshot, draft, config, chunkSize = 64) {
 assertObject(snapshot,'Snapshot');
 assertObject(draft,'Current valuation draft');
 assertObject(draft.assumptions,'Current valuation assumptions');
 const issues = currentIssues(snapshot,draft);
 if (issues.length) throw new Error(issues.join(' '));
 if (draft.assumptions.yearlyOverrides != null) throw new Error('Monte Carlo requires the coherent scalar growth/margin transition. Explicit yearly overrides are unsupported; remove them rather than silently ignoring them.');
 if (!finite(draft.normalizationDelta)) throw new Error('EBIT normalization must be a finite number.');
 const baseline = calculateCurrent(snapshot,draft);
 if (!finiteValuation(baseline)) throw new Error('Baseline valuation is numerically nonfinite; revise the scale or assumptions before simulating.');
 const authored = validateSimulationConfig(config ?? simulationDefaults(draft.assumptions),baseline.assumptions),c=jointEffectiveConfig(authored);
 const context=c.method==='annual-path'?conditionedGrowthContext(currentAnnualPathContext(snapshot,draft),c.annualTerminal):null;
 const pathSampler=context?prepareAnnualPath(context.baseline,c.annualPath,context):null;
 const jointSampler=isJoint(authored)?prepareJointSimulation(context,authored):null;
 const metricSamplers=pathSampler&&c.annualMetrics?prepareAnnualMetrics(context,c.annualMetrics):null;
 const terminalSamplers=pathSampler?Object.fromEntries(Object.entries(c.annualTerminal||{}).map(([k,v])=>[k,prepareDistribution(v)])):{};
 const random = createSeededRandom(c.seed), draws = [], rawDraws = [], scenarios = [], exclusions = {};
 const samplers = Object.fromEntries(SIMULATION_DRIVER_KEYS.map(key=>[key,prepareDistribution(c.drivers[key])]));
 const exclude = reason => {exclusions[reason] = (exclusions[reason] || 0)+1;};
 let zeroEquityCount = 0;
 for (let trial = 0; trial < c.trials; trial++) {
  if (trial % chunkSize === 0) yield {completed:trial,total:c.trials};
  // One draw per economic driver generates an entire coherent annual path.
  const a = scenario(baseline.assumptions,c,random,samplers);
  const terminal=Object.fromEntries(Object.entries(terminalSamplers).map(([k,s])=>[k,s(random())]));
  if(terminal.growth!==undefined)a.terminalGrowth=terminal.growth;
  if(terminal.taxRate!==undefined)a.tax=terminal.taxRate;
  if(terminal.roic!==undefined)a.terminalROIC=terminal.roic;
  const endpoints={growth:a.terminalGrowth,margin:a.targetMargin,taxRate:a.tax,wacc:a.wacc,salesCapital:a.targetMargin>0?a.terminalROIC/((1+a.terminalGrowth)*a.targetMargin*(1-a.tax)):a.salesCapital};
  let jointDraw;try{jointDraw=jointSampler?.sample(random,jointEndpoints(jointSampler,endpoints));}catch(error){if(!jointSampler)throw error;exclude('joint-'+(error.code||'sampling-rejected'));continue;}
  const growthPath=jointDraw?.growthPath??pathSampler?.sample(random,a.terminalGrowth);
  const metricPaths=jointDraw?jointDraw.metricPaths:metricSamplers?sampleAnnualMetrics(metricSamplers,random,endpoints):null;
  const metricIssue=annualMetricConstraint(metricPaths);if(metricIssue){exclude(metricIssue);continue;}
  if(metricPaths)a[ANNUAL_METRIC_PATHS]=metricPaths;
  if(growthPath){
   if(growthPath.some(g=>!finite(g)||g<=-1)){exclude('annual-growth-bounds');continue;}
   a[ANNUAL_GROWTH_PATH]=growthPath;
  }
  if (!(a.wacc > a.terminalGrowth && a.terminalROIC > a.terminalGrowth && a.terminalROIC > 0)) {exclude('terminal-constraints');continue;}
  try {
   const value = valueCurrentWithClaims(snapshot,draft,a);
   if (!finiteValuation(value)) {exclude('nonfinite-valuation');continue;}
   draws.push(value.perShare); rawDraws.push(value.rawPerShare);
   if (value.equity <= 0) zeroEquityCount++;
   scenarios.push({trial:trial+1,...(growthPath?{growthPath}:{}),...(metricPaths?{metricPaths}:{}),...(pathSampler?{terminal:{growth:a.terminalGrowth,margin:a.targetMargin,taxRate:a.tax,wacc:a.wacc,roic:a.terminalROIC,salesCapital:a.targetMargin>0?a.terminalROIC/((1+a.terminalGrowth)*a.targetMargin*(1-a.tax)):a.salesCapital}}:{}),...Object.fromEntries(SIMULATION_DRIVER_KEYS.map(k=>[k,a[k]])),perShare:value.perShare,rawPerShare:value.rawPerShare,...(value.claimsBridge?{claims:{method:value.claimsBridge.method,allocationShares:value.claimsBridge.allocationShares,additionalClaims:value.claimsBridge.additionalClaims,additionalAssets:value.claimsBridge.additionalAssets,warrantClaim:value.claimsBridge.warrantClaim}}:{})});
  } catch (error) {
   // Bounded driver validation is performed up front; no silent redraws.
   if (!(error instanceof Error)) throw error;
   exclude('valuation-rejected');
  }
 }
 const samples = [...draws].sort((a,b)=>a-b), rawSamples = [...rawDraws].sort((a,b)=>a-b);
 const accepted = samples.length, excluded = c.trials-accepted;
 let mean = null;
 if (accepted) {mean = samples[0];for (let i=1;i<accepted;i++) mean += (samples[i]-mean)/(i+1);}
 const quantiles = Object.fromEntries(Object.entries(quantileLevels).map(([key,p])=>[key,quantileUnchecked(samples,p)]));
 const warnings = [
  'Conditional distribution of DCF values under selected assumptions. Frequencies are not calibrated real-world outcome probabilities, expected returns, or stock-price forecasts.',
  'Initial ranges are illustrative teaching assumptions, not estimates fitted to company or market data. Review every distribution family, parameter and dependence against evidence.',
  metricSamplers||Object.keys(terminalSamplers).length?'Forecast horizon, source financials and dated capital/claims inputs remain fixed. Annual and terminal operating inputs follow the explicitly selected uncertainty settings. Any source-specific allocation rule is applied to each trial.':'Tax, terminal growth, terminal marginal ROIC, forecast horizon, source financials and selected capital/claims assumptions are fixed. Any source-specific allocation rule is applied to each trial. Unmodeled uncertainty remains.',
  metricSamplers?'Annual operating primitives use separate Gaussian AR(1) bridges around the edited baseline. Growth and annual capital replace their scalar distributions; scalar margin and WACC control terminal endpoints only. User-fixed years remain exact.':pathSampler?'Annual growth uses a Gaussian AR(1) bridge around the deterministic baseline, exactly conditioned on fixed-year and terminal anchors. The scalar growth distribution is inactive. Other driver distributions are unchanged.':'Each trial draws a whole-business growth/margin path once; annual growth is not independently resampled. WACC is nominal and currency-consistent; simulation does not remove the need for a risk-adjusted discount rate.',
  'Negative modeled common-equity values are retained at the engine’s zero equity floor, with raw pre-floor values exported. This is not a distress/recovery or financing model.'
 ];
 if (!pathSampler&&baseline.operatingProfile?.id==='aaoi-capacity-ramp-v1'&&draft.marginPath?.enabled!==true&&draft.capitalPath?.enabled!==true) warnings.push('AAOI uses the documented staged capacity profile in every draw: initial growth, mature margin, initial sales/capital and WACC form a coherent annual path; terminal capital intensity follows terminal growth, margin, tax and ROIC.');
 if (!metricSamplers&&baseline.operatingProfile?.id==='flexible-growth-v1') warnings.push(...(pathSampler?[]:[baseline.operatingProfile.growthSampling]),baseline.operatingProfile.risk,baseline.operatingProfile.note);
 if (!metricSamplers&&baseline.operatingProfile?.capitalSampling) warnings.push(baseline.operatingProfile.capitalSampling,...(baseline.operatingProfile.id==='flexible-growth-v1'?[]:[baseline.operatingProfile.note]));
 if (!metricSamplers&&baseline.operatingProfile?.marginSampling) warnings.push(baseline.operatingProfile.marginSampling,...(baseline.operatingProfile.id==='flexible-growth-v1'?[]:[baseline.operatingProfile.note]));
 if (baseline.claimsBridge) warnings.push('Every trial uses the same explicit source-dated claims model as the deterministic value. Selected claims inputs are held fixed, but the AAOI intrinsic warrant allocation, where applicable, is recomputed from each trial’s equity value.',...baseline.claimsBridge.warnings);
 if (Object.values(c.drivers).some(d=>d.type==='normal')) warnings.push('Normal mean and SD are underlying unbounded parameters. The bounded input moments generally differ; exported input summaries label their numerical approximation. Truncation conditions on the bounds without clipping or replacement sampling.');
 if (excluded) warnings.push(`${excluded} of ${c.trials} attempted trials were excluded. Reported quantiles and frequencies are conditional on the ${accepted} valid trials; exclusions change the effective input distribution. Revise overlapping terminal bounds instead of interpreting this as unbiased sampling.`);
 if (!accepted) warnings.push('No valid trials remain. Revise the bounds; no distribution or market-price percentile is available.');
 let dependence = c.dependence === 'independent'
  ? {id:'independent',label:'Independent input draws',description:'The four economic drivers are sampled independently. This is a modeling assumption, not evidence of independence.',latentCorrelations:null}
  : {id:'operating-linked',label:'Illustrative linked operating drivers',description:'One Gaussian operating factor links growth, mature margin and sales/capital. Latent correlations: growth–margin 0.49, growth–sales/capital 0.28, margin–sales/capital 0.28. WACC is independent. These are assumed factor correlations, not fitted data or exact Pearson correlations of the selected input distributions. Fixed inputs have no defined correlation.',factorLoadings:{...operatingLoadings},latentCorrelations:[[1,.49,.28,0],[.49,1,.28,0],[.28,.28,1,0],[0,0,0,1]]};
 if(pathSampler)dependence=c.dependence==='independent'
  ?{id:'independent',label:'Independent annual growth and other drivers',description:'The conditioned annual growth process is independent of margin, sales/capital and WACC draws. Annual deviations are serially correlated according to the entered persistence. These are modeling assumptions, not evidence of independence.',latentCorrelations:null}
  :{id:'operating-linked',label:'Linked margin and capital inputs; separate annual growth',description:'Margin and sales/capital retain their illustrative Gaussian factor correlation of 0.28. Annual growth is a separate conditioned AR(1) process, independent of these inputs and WACC; the scalar growth loading is inactive.',factorLoadings:{targetMargin:.7,salesCapital:.4,wacc:0},latentCorrelations:null};
 if(metricSamplers){warnings.push('Annual margin, operating tax, WACC and capital efficiency follow separate conditioned Gaussian paths around the edited baseline. Revenue, NOPAT, reinvestment, FCFF and implied returns are derived, never sampled twice. Fixed annual years override endpoint effects. Terminal margin and WACC use their scalar distributions; optional terminal growth, tax and ROIC are drawn once. Historical anchors, horizon, timing and dated claims inputs stay fixed.');dependence={id:'independent-annual-primitives',label:'Independent annual primitive paths',description:'Each annual primitive has its own serial persistence; innovations are independent across metrics. Operating-linked applies only to remaining scalar terminal inputs, not the annual innovations.',latentCorrelations:null};}
 if(jointSampler){for(let i=warnings.length-1;i>=0;i--)if(/separate Gaussian|separate conditioned|independent across metrics/.test(warnings[i]))warnings.splice(i,1);warnings.push(JOINT_NOTE);}
 const exportedConfig=clone(authored);
 if(c.method==='legacy'&&config&&!own(config,'method'))delete exportedConfig.method;
 return {
  ...(jointSampler?jointResultMetadata(jointSampler,scenarios):{}),
  version:SIMULATION_VERSION,status:accepted ? 'ready' : 'empty',classification:'Conditional educational DCF simulation',
  config:exportedConfig,baseline,draws,samples,rawSamples,scenarios,...(pathSampler?{annualPaths:{...annualPathAudit(pathSampler,scenarios),...(metricSamplers?{metrics:annualMetricsAudit(metricSamplers,scenarios)}:{})}}:{}),
  inputDistributions:Object.fromEntries(SIMULATION_DRIVER_KEYS.map(key=>[key,{...distributionSummary(c.drivers[key],key),...(pathSampler&&key==='growth'?{active:false,inactiveReason:'Annual growth path replaces this scalar growth distribution.'}:metricSamplers?.salesCapital&&key==='salesCapital'?{active:false,inactiveReason:'Annual capital efficiency replaces this scalar distribution.'}:metricSamplers&&(key==='targetMargin'||key==='wacc')?{active:true,scope:'terminal endpoint only'}:{})}])),
  attempts:c.trials,accepted,excluded,exclusions,zeroEquityCount,zeroEquityShare:accepted ? zeroEquityCount/accepted : null,
  mean,median:quantiles.p50,quantiles,histogram:histogram(samples,c.binCount),
  units:{currency:snapshot.currency,perShare:`${snapshot.currency} per common share`,financials:'millions',shares:'millions'},
  quote:comparison(snapshot,draft,baseline,samples),dependence:jointSampler?jointResultMetadata(jointSampler,[]).dependence:dependence,warnings,
  method:{distribution:'per-driver fixed, triangular, uniform or conditionally truncated normal',normal:'inverse conditional CDF using stable log tails; no clipping or rejection resampling; mean/SD are underlying normal parameters',inputUnits:'growth, targetMargin and wacc are fractions (0.10 = 10%); salesCapital is a ratio',quantiles:'linear interpolation at (n−1)p (type 7)',ecdf:'right-continuous; count(value ≤ price) / accepted trials',histogram:'equal-width bins; left-closed/right-open except final bin includes its upper edge',sampling:'exact attempted-trial count; invalid draws excluded without replacement',random:'FNV-1a seed hash / Mulberry32',path:jointSampler?JOINT_NOTE:pathSampler?'Exact Gaussian annual-growth bridge; existing margins, capital calendars, claims and FCFF engine':'one driver vector per trial, existing deterministic transition and FCFF engine'}
 };
}

// Both runners consume the same generator. Yielding never changes RNG state,
// draw order, exclusions, arithmetic, or the final default result.
export function simulateCurrent(snapshot,draft,config) {
 const run=currentSimulationSteps(snapshot,draft,config);let next;
 do {next=run.next();} while(!next.done);
 return next.value;
}
export async function simulateCurrentAsync(snapshot,draft,config,{signal,onProgress,yieldControl=()=>new Promise(resolve=>setTimeout(resolve,0)),chunkSize=64}={}) {
 if(!Number.isInteger(chunkSize)||chunkSize<1||chunkSize>1000)throw new Error('Chunk size must be an integer from 1 to 1,000.');
 const run=currentSimulationSteps(structuredClone(snapshot),structuredClone(draft),config==null?config:structuredClone(config),chunkSize);
 const aborted=()=>{if(signal?.aborted){const error=new Error('Simulation canceled.');error.name='AbortError';throw error;}};
 try {
  while(true){aborted();const next=run.next();if(next.done){aborted();onProgress?.({completed:next.value.attempts,total:next.value.attempts});return next.value;}
   onProgress?.(next.value);await yieldControl();aborted();
  }
 }finally{run.return();}
}
