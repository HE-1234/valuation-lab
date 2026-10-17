// Conditional uncertainty in DCF inputs, never a stock-price process.
// Existing deterministic/historical engine and research records remain unchanged.
import {defaults, valueCompany, validDate} from '../../dist/engine.js';
import {calculateCurrent, currentIssues, quoteComparison} from '../../dist/current-model.js';

export const SIMULATION_VERSION = '1.0.0';
export const SIMULATION_DRIVER_KEYS = Object.freeze(['growth', 'targetMargin', 'salesCapital', 'wacc']);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const clone = value => JSON.parse(JSON.stringify(value));
const limits = Object.freeze({growth:[-.5,1,false],targetMargin:[0,1,false],salesCapital:[0,Infinity,true],wacc:[0,1,true]});
const operatingLoadings = Object.freeze({growth:.7,targetMargin:.7,salesCapital:.4,wacc:0});
const quantileLevels = Object.freeze({p5:.05,p10:.1,p25:.25,p50:.5,p75:.75,p90:.9,p95:.95});

function assertObject(value, name) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object.`);
}

// These widths are teaching examples, not estimates derived from company data.
// The mode is the corresponding deterministic assumption; bounds are editable.
export function simulationDefaults(assumptions = defaults) {
 const a = {...defaults,...assumptions};
 const bounds = (mode, width, low, high) => ({low:Math.max(low,mode-width),mode,high:Math.min(high,mode+width)});
 return {
  trials:4000, seed:'valuation-lab', binCount:36, dependence:'independent',
  drivers:{
   growth:bounds(a.growth,.05,-.5,1),
   targetMargin:bounds(a.targetMargin,.05,0,1),
   salesCapital:bounds(a.salesCapital,a.salesCapital*.25,Number.MIN_VALUE,Infinity),
   wacc:bounds(a.wacc,.015,Number.MIN_VALUE,1)
  }
 };
}

function validateRange(range, key) {
 assertObject(range, `${key} distribution`);
 if (!['low','mode','high'].every(k => finite(range[k]))) throw new Error(`${key}: low, mode and high must be finite numbers.`);
 if (Object.keys(range).some(k => !['low','mode','high'].includes(k))) throw new Error(`${key}: only low, mode and high are supported.`);
 if (!(range.low <= range.mode && range.mode <= range.high)) throw new Error(`${key}: require low ≤ mode ≤ high.`);
 if (!finite(range.high-range.low)) throw new Error(`${key || 'Distribution'}: numerical range is too wide.`);
 if (key) {
  const [min,max,strict] = limits[key];
  if ((strict ? range.low <= min : range.low < min) || range.high > max) throw new Error(`${key}: distribution outside supported bounds (${strict ? '>' : '≥'} ${min}${finite(max) ? `, ≤ ${max}` : ''}).`);
 }
}

export function validateSimulationConfig(config, assumptions = defaults) {
 assertObject(config,'Simulation settings');
 const unknown = Object.keys(config).filter(k => !['trials','seed','binCount','dependence','drivers'].includes(k));
 if (unknown.length) throw new Error(`Unknown simulation setting: ${unknown.join(', ')}.`);
 const c = {trials:4000,seed:'valuation-lab',binCount:36,dependence:'independent',...config,drivers:{}};
 if (!Number.isInteger(c.trials) || c.trials < 1 || c.trials > 50000) throw new Error('Trials must be an integer from 1 to 50,000.');
 if (!Number.isInteger(c.binCount) || c.binCount < 1 || c.binCount > 200) throw new Error('Histogram bin count must be an integer from 1 to 200.');
 if (!(typeof c.seed === 'string' && c.seed.trim().length > 0 && c.seed.length <= 128) && !Number.isSafeInteger(c.seed)) throw new Error('Seed must be a nonempty string of at most 128 characters or a safe integer.');
 c.seed = String(c.seed);
 if (!['independent','operating-linked'].includes(c.dependence)) throw new Error('Dependence must be independent or operating-linked.');
 const given = config.drivers ?? {};
 assertObject(given,'Driver distributions');
 for (const key of Object.keys(given)) if (!SIMULATION_DRIVER_KEYS.includes(key)) throw new Error(`Unsupported uncertain driver: ${key}. Tax, stable growth, terminal ROIC, claims and shares stay fixed.`);
 const a = {...defaults,...assumptions};
 for (const key of SIMULATION_DRIVER_KEYS) {
  const range = own(given,key) ? given[key] : {low:a[key],mode:a[key],high:a[key]};
  validateRange(range,key);
  c.drivers[key] = {low:range.low,mode:range.mode,high:range.high};
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
 if (!finite(u) || u < 0 || u > 1) throw new Error('A distribution quantile must be between zero and one.');
 validateRange(range);
 const {low,mode,high} = range;
 if (low === high) return low;
 if (u === 0) return low;
 if (u === 1) return high;
 const width = high-low, split = (mode-low)/width;
 return u < split ? low + width*Math.sqrt(u*split) : high - width*Math.sqrt((1-u)*(1-split));
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

function scenario(assumptions, config, random) {
 const a = {...assumptions};
 const linked = config.dependence === 'operating-linked';
 const shared = linked ? standardNormal(random) : 0;
 for (const key of SIMULATION_DRIVER_KEYS) {
  const loading = operatingLoadings[key];
  const u = linked && loading !== 0
   ? normalCDF(loading*shared+Math.sqrt(1-loading*loading)*standardNormal(random))
   : random();
  a[key] = triangularQuantile(u,config.drivers[key]);
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

export function simulateCurrent(snapshot, draft, config) {
 assertObject(snapshot,'Snapshot');
 assertObject(draft,'Current valuation draft');
 assertObject(draft.assumptions,'Current valuation assumptions');
 const issues = currentIssues(snapshot,draft);
 if (issues.length) throw new Error(issues.join(' '));
 if (draft.assumptions.yearlyOverrides != null) throw new Error('Monte Carlo requires the coherent scalar growth/margin transition. Explicit yearly overrides are unsupported; remove them rather than silently ignoring them.');
 if (!finite(draft.normalizationDelta)) throw new Error('EBIT normalization must be a finite number.');
 const baseline = calculateCurrent(snapshot,draft);
 if (!finiteValuation(baseline)) throw new Error('Baseline valuation is numerically nonfinite; revise the scale or assumptions before simulating.');
 const c = validateSimulationConfig(config ?? simulationDefaults(draft.assumptions),baseline.assumptions);
 const normalized = {...snapshot,ebit:snapshot.ebit+draft.normalizationDelta,provisionalBridge:true};
 const random = createSeededRandom(c.seed), draws = [], rawDraws = [], scenarios = [], exclusions = {};
 const exclude = reason => {exclusions[reason] = (exclusions[reason] || 0)+1;};
 let zeroEquityCount = 0;
 for (let trial = 0; trial < c.trials; trial++) {
  // One draw per economic driver generates an entire coherent annual path.
  const a = scenario(baseline.assumptions,c,random);
  if (!(a.wacc > a.terminalGrowth && a.terminalGrowth >= 0 && a.terminalROIC > a.terminalGrowth)) {exclude('terminal-constraints');continue;}
  try {
   const value = valueCompany(normalized,a);
   if (!finiteValuation(value)) {exclude('nonfinite-valuation');continue;}
   draws.push(value.perShare); rawDraws.push(value.rawPerShare);
   if (value.equity <= 0) zeroEquityCount++;
   scenarios.push({trial:trial+1,...Object.fromEntries(SIMULATION_DRIVER_KEYS.map(k=>[k,a[k]])),perShare:value.perShare,rawPerShare:value.rawPerShare});
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
  'Initial ranges are illustrative teaching assumptions, not estimates fitted to company or market data. Review the bounds, modes and dependence against evidence.',
  'Tax, terminal growth, terminal marginal ROIC, forecast horizon, source financials, cash, debt, other claims/assets and shares are fixed. Unmodeled uncertainty remains.',
  'Each trial draws a whole-business growth/margin path once; annual growth is not independently resampled. WACC is nominal and currency-consistent; simulation does not remove the need for a risk-adjusted discount rate.',
  'Negative modeled common-equity values are retained at the engine’s zero equity floor, with raw pre-floor values exported. This is not a distress/recovery or financing model.'
 ];
 if (excluded) warnings.push(`${excluded} of ${c.trials} attempted trials were excluded. Reported quantiles and frequencies are conditional on the ${accepted} valid trials; exclusions change the effective input distribution. Revise overlapping terminal bounds instead of interpreting this as unbiased sampling.`);
 if (!accepted) warnings.push('No valid trials remain. Revise the bounds; no distribution or market-price percentile is available.');
 const dependence = c.dependence === 'independent'
  ? {id:'independent',label:'Independent input draws',description:'The four economic drivers are sampled independently. This is a modeling assumption, not evidence of independence.',latentCorrelations:null}
  : {id:'operating-linked',label:'Illustrative linked operating drivers',description:'One Gaussian operating factor links growth, mature margin and sales/capital. Latent correlations: growth–margin 0.49, growth–sales/capital 0.28, margin–sales/capital 0.28. WACC is independent. These are assumed factor correlations, not fitted data or exact Pearson correlations of the triangular inputs.',factorLoadings:{...operatingLoadings},latentCorrelations:[[1,.49,.28,0],[.49,1,.28,0],[.28,.28,1,0],[0,0,0,1]]};
 return {
  version:SIMULATION_VERSION,status:accepted ? 'ready' : 'empty',classification:'Conditional educational DCF simulation',
  config:clone(c),baseline,draws,samples,rawSamples,scenarios,
  attempts:c.trials,accepted,excluded,exclusions,zeroEquityCount,zeroEquityShare:accepted ? zeroEquityCount/accepted : null,
  mean,median:quantiles.p50,quantiles,histogram:histogram(samples,c.binCount),
  units:{currency:snapshot.currency,perShare:`${snapshot.currency} per common share`,financials:'millions',shares:'millions'},
  quote:comparison(snapshot,draft,baseline,samples),dependence,warnings,
  method:{distribution:'bounded triangular (low, mode, high)',quantiles:'linear interpolation at (n−1)p (type 7)',ecdf:'right-continuous; count(value ≤ price) / accepted trials',histogram:'equal-width bins; left-closed/right-open except final bin includes its upper edge',sampling:'exact attempted-trial count; invalid draws excluded without replacement',random:'FNV-1a seed hash / Mulberry32',path:'one driver vector per trial, existing deterministic transition and FCFF engine'}
 };
}
