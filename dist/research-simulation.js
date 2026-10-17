// Conditional uncertainty around the dated annual research schedule. No stock-price
// process, probability calibration, implicit capital release, or funding-debt plug.
import {calculateResearchOperating,researchDraftIssues,researchTimingResult} from './research-model.js';
import {calculateResearchBridge} from './research-claims.js';
import {createSeededRandom,distributionQuantile,distributionSummary,validateDriverDistribution,histogram,quantile} from './simulation.js';

export const RESEARCH_SIMULATION_VERSION='1.0.0';
export const RESEARCH_SIMULATION_DRIVER_KEYS=Object.freeze(['growthPremium','marginShift','investmentMultiplier','waccShift']);
export const RESEARCH_SIMULATION_DRIVER_LABELS=Object.freeze({
 growthPremium:Object.freeze(['Growth premium',100,'pp']),
 marginShift:Object.freeze(['Operating-margin shift',100,'pp']),
 investmentMultiplier:Object.freeze(['Explicit net-investment multiplier',1,'×']),
 waccShift:Object.freeze(['WACC shift',100,'pp'])
});
export const RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS=Object.freeze({
 growthPremium:'Add a percentage-point offset to reviewed annual revenue growth, fading linearly from the full offset in year 1 to zero in the final explicit year. Reconstruct revenue sequentially from the same anchor.',
 marginShift:'Add the same percentage-point offset to every explicit operating margin and the terminal operating margin.',
 investmentMultiplier:'Multiply signed explicit net investment directly. Terminal reinvestment continues to use terminal NOPAT × growth / ROIC.',
 waccShift:'Add the same percentage-point offset to each explicit WACC and terminal WACC. Tax, terminal growth and terminal ROIC remain fixed.'
});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const fixedStresses=Object.freeze({growthPremium:0,marginShift:0,investmentMultiplier:1,waccShift:0});
const levels=Object.freeze({p5:.05,p10:.1,p25:.25,p50:.5,p75:.75,p90:.9,p95:.95});
const capitalPolicies=Object.freeze(['fixed-schedule','revenue-scaled']);

export function simulationResearchDefaults(){
 return {trials:4000,seed:'annual-research',binCount:36,dependence:'independent',capitalPolicy:'fixed-schedule',
  drivers:Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,{type:'fixed',value:fixedStresses[k]}]))};
}

export function validateResearchSimulationConfig(config=simulationResearchDefaults()){
 if(!object(config))throw Error('Annual simulation settings must be an object.');
 const allowed=['trials','seed','binCount','dependence','capitalPolicy','drivers'];
 const unknown=Object.keys(config).filter(k=>!allowed.includes(k));
 if(unknown.length)throw Error(`Unknown annual simulation setting: ${unknown.join(', ')}.`);
 const c={...simulationResearchDefaults(),...config,drivers:{}};
 if(!Number.isInteger(c.trials)||c.trials<1||c.trials>50000)throw Error('Trials must be an integer from 1 to 50,000.');
 if(!Number.isInteger(c.binCount)||c.binCount<1||c.binCount>200)throw Error('Histogram bin count must be an integer from 1 to 200.');
 if(!(typeof c.seed==='string'&&c.seed.trim()&&c.seed.length<=128)&&!Number.isSafeInteger(c.seed))throw Error('Seed must be a nonempty string of at most 128 characters or a safe integer.');
 c.seed=String(c.seed);
 if(c.dependence!=='independent')throw Error('Annual stress inputs support independent draws only; no correlation estimates are implied.');
 if(!capitalPolicies.includes(c.capitalPolicy))throw Error('Capital policy must be fixed-schedule or revenue-scaled.');
 const given=config.drivers??{};
 if(!object(given))throw Error('Annual stress distributions must be an object.');
 for(const key of Object.keys(given))if(!RESEARCH_SIMULATION_DRIVER_KEYS.includes(key))throw Error(`Unsupported annual stress: ${key}. Tax, terminal growth, terminal ROIC, timing inputs and capital claims stay fixed.`);
 for(const key of RESEARCH_SIMULATION_DRIVER_KEYS){
  // Generic validation is intentional. Scalar-model bounds and driver names do
  // not describe percentage-point offsets or an investment multiplier.
  try{c.drivers[key]=validateDriverDistribution(own(given,key)?given[key]:{type:'fixed',value:fixedStresses[key]});}
  catch(error){throw Error(`${RESEARCH_SIMULATION_DRIVER_LABELS[key][0]}: ${error.message}`);}
  const d=c.drivers[key],low=d.type==='fixed'?d.value:d.low;
  if(key==='investmentMultiplier'&&low<0)throw Error('Explicit net-investment multiplier must be nonnegative; it cannot reverse the sign of an investment or release.');
 }
 return c;
}

function buildTrialDraft(d,stress,capitalPolicy){
 let reviewedPrior=d.anchor.revenue,trialPrior=d.anchor.revenue;
 const n=d.annual.length;
 const annual=d.annual.map((row,index)=>{
  const reviewedGrowth=row.revenue/reviewedPrior-1;
  const weight=n>1?(n-1-index)/(n-1):0;
  // Bypass reconstruction at zero premium to preserve reviewed amounts bit for
  // bit, including a nonconstant annual path and the final explicit-year rate.
  const revenue=stress.growthPremium===0?row.revenue:trialPrior*(1+reviewedGrowth+stress.growthPremium*weight);
  reviewedPrior=row.revenue;trialPrior=revenue;
  const scale=capitalPolicy==='revenue-scaled'?revenue/row.revenue:1;
  return {...row,revenue,margin:row.margin+stress.marginShift,reinvestment:row.reinvestment*stress.investmentMultiplier*scale,wacc:row.wacc+stress.waccShift};
 });
 return {...d,annual,terminal:{...d.terminal,margin:d.terminal.margin+stress.marginShift,wacc:d.terminal.wacc+stress.waccShift}};
}

// A replayable annual path for any exported trial. This helper preserves signed
// investment, source metadata, the complete horizon and the selected timing.
export function researchStressDraft(draft,stresses={},capitalPolicy='fixed-schedule'){
 const issues=researchDraftIssues(draft);if(issues.length)throw Error(issues.join(' '));
 if(!object(stresses)||Object.keys(stresses).some(k=>!RESEARCH_SIMULATION_DRIVER_KEYS.includes(k)))throw Error('Supply only the four supported annual stress inputs.');
 const stress={...fixedStresses,...stresses};
 if(!RESEARCH_SIMULATION_DRIVER_KEYS.every(k=>finite(stress[k]))||stress.investmentMultiplier<0)throw Error('Stress inputs must be finite and the investment multiplier must be nonnegative.');
 if(!capitalPolicies.includes(capitalPolicy))throw Error('Capital policy must be fixed-schedule or revenue-scaled.');
 return buildTrialDraft(structuredClone(draft),stress,capitalPolicy);
}

function bridgeFor(d,enterprise,date){
 try{return calculateResearchBridge(d,enterprise,{...d.bridgeInputs,calculationDate:date});}
 catch(error){
  return {status:'invalid',eligible:false,equity:null,perShare:null,rawPerShare:null,reasons:[error.message],warnings:[],calculationDate:date};
 }
}
function requireTiming(d,operating){
 const timing=researchTimingResult(d,operating);
 if(timing.status==='incomplete')throw Error(timing.message||'Complete the explicit timing scenario before simulating.');
 if(!finite(timing.enterprise))throw Error('Timing valuation exceeded the finite numerical range.');
 return timing;
}
function prepareRun(draft,config){
 // Capture before asynchronous yields: later edits cannot alter an in-flight run.
 const d=structuredClone(draft),c=validateResearchSimulationConfig(config??d?.researchSimulationConfig??simulationResearchDefaults());
 const operating=calculateResearchOperating(d),timing=requireTiming(d,operating),bridge=bridgeFor(d,timing.enterprise,timing.date);
 return {draft:d,config:c,baseline:{...operating,enterprise:timing.enterprise,originEnterprise:operating.enterprise,operating,timing,bridge},
  random:createSeededRandom(c.seed),completed:0,draws:[],equityDraws:[],perShareDraws:[],scenarios:[],exclusions:{},exclusionExamples:{},bridgeReasons:{},nonpositiveEquityCount:0,
  inputDistributions:Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,distributionSummary(c.drivers[k])]))};
}
function reject(state,reason,detail){
 state.exclusions[reason]=(state.exclusions[reason]||0)+1;
 if(detail&&!own(state.exclusionExamples,reason))state.exclusionExamples[reason]=detail;
}
function trialConstraints(d){
 if(d.annual.some(r=>![r.revenue,r.margin,r.reinvestment,r.wacc].every(finite)))return 'nonfinite-valuation';
 const t=d.terminal;
 if(![t.margin,t.wacc].every(finite))return 'nonfinite-valuation';
 if(t.margin<=0||t.margin>1||t.wacc<=t.growth||t.wacc>1)return 'terminal-constraints';
 if(d.annual.some(r=>r.revenue<=0||r.margin<-.5||r.margin>1||r.wacc<=0||r.wacc>1))return 'annual-constraints';
 return null;
}
function step(state,count){
 const {config:c,draft:d}=state;
 const end=Math.min(c.trials,state.completed+count);
 while(state.completed<end){
  const trial=++state.completed;
  // Consume exactly four uniforms for every attempted trial, even when sampling
  // or valuation rejects a draw. Never clip or replace an invalid scenario.
  const uniforms=RESEARCH_SIMULATION_DRIVER_KEYS.map(()=>state.random());
  let stress;
  try{stress=Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map((k,i)=>[k,distributionQuantile(uniforms[i],c.drivers[k])]))}
  catch(error){reject(state,'sampling-rejected',error.message);continue;}
  const next=buildTrialDraft(d,stress,c.capitalPolicy),constraint=trialConstraints(next);
  if(constraint){reject(state,constraint);continue;}
  let operating,timing;
  try{operating=calculateResearchOperating(next);timing=requireTiming(next,operating);}
  catch(error){reject(state,/finite numerical range/.test(error.message)?'nonfinite-valuation':'valuation-rejected',error.message);continue;}
  const enterprise=timing.enterprise,bridge=bridgeFor(next,enterprise,timing.date);
  const bridgeEligible=bridge.eligible===true&&[bridge.equity,bridge.rawPerShare].every(finite);
  state.draws.push(enterprise);
  if(bridgeEligible){
   state.equityDraws.push(bridge.equity);state.perShareDraws.push(bridge.rawPerShare);
   if(bridge.equity<=0)state.nonpositiveEquityCount++;
  }else{
   const reasons=bridge.reasons?.length?bridge.reasons:['A valid source-dated common-equity bridge is unavailable.'];
   for(const reason of reasons)state.bridgeReasons[reason]=(state.bridgeReasons[reason]||0)+1;
  }
  state.scenarios.push({trial,...stress,enterprise,originEnterprise:operating.enterprise,forecastPV:operating.forecastPV,terminalPV:operating.terminalPV,
   peakEconomicDeficit:operating.peakEconomicDeficit,equity:bridgeEligible?bridge.equity:null,perShare:bridgeEligible?bridge.rawPerShare:null,rawPerShare:bridgeEligible?bridge.rawPerShare:null,
   bridgeStatus:bridge.status,...(bridgeEligible?{claims:{allocationShares:bridge.allocationShares,assetTotal:bridge.assetTotal,claimTotal:bridge.claimTotal,warrantClaim:bridge.warrantClaim}}:{})});
 }
}
function summarize(draws,binCount,basis,units){
 const samples=[...draws].sort((a,b)=>a-b),n=samples.length;
 let mean=null;
 if(n){
  mean=samples[0];
  // Ordinary values use the shared method. Scaling avoids overflow when finite
  // positive and negative values span more than Number.MAX_VALUE.
  if(finite(samples.at(-1)-samples[0]))for(let i=1;i<n;i++)mean+=(samples[i]-mean)/(i+1);
  else{const scale=Math.max(Math.abs(samples[0]),Math.abs(samples.at(-1)));let m=0;for(let i=0;i<n;i++)m+=(samples[i]/scale-m)/(i+1);mean=m*scale;}
 }
 const wide=n>0&&!finite(samples.at(-1)-samples[0]);
 const quantiles=Object.fromEntries(Object.entries(levels).map(([key,p])=>{
  if(!wide)return [key,quantile(samples,p)];
  const h=(n-1)*p,lo=Math.floor(h),weight=h-lo;
  return [key,samples[lo]*(1-weight)+samples[Math.min(lo+1,n-1)]*weight];
 }));
 let bins;
 if(wide){
  const scale=Math.max(Math.abs(samples[0]),Math.abs(samples.at(-1)));
  bins=histogram(samples.map(v=>v/scale),binCount).map(b=>({...b,low:b.low*scale,high:b.high*scale}));
  bins[0].low=samples[0];bins.at(-1).high=samples.at(-1);
 }else bins=histogram(samples,binCount);
 return {status:n?'ready':'empty',basis,units,draws:[...draws],samples,rawSamples:[...samples],accepted:n,mean,median:quantiles.p50,quantiles,histogram:bins};
}
function finishRun(state){
 const {config:c,baseline,draft:d}=state,accepted=state.draws.length,excluded=c.trials-accepted;
 const units={currency:d.currency,financials:'millions',shares:'millions',enterprise:`${d.currency} millions`,equity:`${d.currency} millions`,perShare:`${d.currency} per ${d.ticker==='TSM'?'ordinary':'common'} share`};
 const enterprise=summarize(state.draws,c.binCount,'enterprise',units.enterprise);
 const equity=summarize(state.equityDraws,c.binCount,'equity',units.equity);
 const perShare=summarize(state.perShareDraws,c.binCount,'perShare',units.perShare);
 const eligible=state.equityDraws.length,zeroEquityShare=eligible?state.nonpositiveEquityCount/eligible:null;
 Object.assign(perShare,{zeroEquityCount:state.nonpositiveEquityCount,zeroEquityShare,nonpositiveEquityCount:state.nonpositiveEquityCount,nonpositiveEquityShare:zeroEquityShare});
 const capitalDescription=c.capitalPolicy==='fixed-schedule'
  ? 'Fixed reviewed absolute net-investment schedule, multiplied by the sampled investment stress. This is a capacity/commitment stress; not every amount is contractual. Revenue changes alone do not change explicit investment.'
  : 'Each reviewed annual net-investment amount is scaled by trial revenue / reviewed revenue, then by the sampled investment multiplier. This is an analytical proportional-investment sensitivity, not verified capacity economics.';
 const warnings=[
  'Conditional distribution of operating DCF values under selected analyst stresses. Frequencies are not calibrated real-world probabilities, expected returns or stock-price forecasts.',
  Object.values(c.drivers).every(spec=>spec.type==='fixed')?'All four inputs are Fixed. This run repeats the selected stress scenario; it is not an estimated confidence range.':'Distribution families and hyperparameters are explicit analyst judgments. They are not fitted probabilities or a forecast of investment returns.',
  'One driver vector generates the complete annual path. The growth premium fades to zero in the final explicit year; reviewed growth and maturity shape are preserved around it.',
  capitalDescription,
  'Tax, terminal growth, terminal ROIC, anchor revenue, forecast horizon, timing stub inputs and selected capital/claims assumptions stay fixed. Terminal investment remains NOPAT × growth / ROIC.',
  'Signed explicit net investment is preserved, including an explicit release or customer-advance assumption. Falling revenue never creates an investment release automatically.',
  'Future FCFF funding deficits remain inside operating value and are never deducted a second time as opening debt. This is not a financing, distress or recovery model.',
  'Negative operating EV, common equity and per-share values remain signed. No zero floor or clipping is applied.',
  ...baseline.operating.warnings,...baseline.timing.warnings,...(baseline.bridge.warnings||[])
 ];
 if(eligible<accepted)warnings.push(`A valid dated common-equity allocation is available for ${eligible} of ${accepted} accepted operating scenarios. Operating EV remains available; missing capital, share or security information is not filled with zero.`);
 if(Object.values(c.drivers).some(spec=>spec.type==='normal'))warnings.push('Normal mean and SD describe the underlying unbounded normal. Sampling conditions on the stated bounds using the shared inverse CDF; actual bounded moments differ.');
 if(excluded)warnings.push(`${excluded} of ${c.trials} attempted trials were excluded without replacement. Quantiles and frequencies are conditional on the ${accepted} valid operating trials; exclusions change the effective input distribution.`);
 if(!accepted)warnings.push('No valid trials remain. No operating or common-equity distribution is available; revise the assumptions.');
 return {version:RESEARCH_SIMULATION_VERSION,...enterprise,basis:'enterprise',units,enterprise,equity,perShare,
  classification:'Conditional annual-research DCF simulation; analyst stresses, not calibrated probabilities',config:structuredClone(c),baseline,
  scenarios:state.scenarios,inputDistributions:state.inputDistributions,attempts:c.trials,accepted,excluded,exclusions:state.exclusions,exclusionExamples:state.exclusionExamples,
  zeroEquityCount:state.nonpositiveEquityCount,zeroEquityShare,
  bridgeCoverage:{accepted:eligible,eligible,blocked:accepted-eligible,total:accepted,complete:accepted>0&&eligible===accepted,share:accepted?eligible/accepted:null,reasons:state.bridgeReasons,baselineEligible:baseline.bridge.eligible===true},
  timing:{status:baseline.timing.status,date:baseline.timing.date,discountOrigin:d.discountOrigin,label:baseline.timing.label},
  quote:{status:'blocked',message:'No verified current market-price comparison is supplied for this source-dated annual-research simulation.'},
  dependence:{id:'independent',label:'Independent analyst stress draws',description:'The four stress inputs are sampled independently. This is a modeling assumption, not evidence of independence.',latentCorrelations:null},
  warnings,method:{distribution:'Shared fixed, triangular, uniform or conditionally truncated normal inverse CDF',random:'FNV-1a seed hash / Mulberry32',
   sampling:'Exactly the requested attempted-trial count; invalid outcomes excluded without clipping or redraw',quantiles:'linear interpolation at (n−1)p (type 7)',histogram:'equal-width bins; left-closed/right-open except the inclusive final upper edge',
   inputUnits:'growthPremium, marginShift and waccShift are fractions of one (0.01 = one percentage point); investmentMultiplier is a nonnegative multiple',
   growth:'growth[i] = reviewedGrowth[i] + growthPremium × (N−1−i)/(N−1); premium is zero when N=1; revenue is reconstructed sequentially from the anchor',
   capitalPolicy:c.capitalPolicy,capitalDescription,terminal:'Final explicit revenue × (1+g), stressed terminal margin, unchanged tax and g/ROIC reinvestment, stressed terminal WACC',
   bridge:'Existing source-dated bridge applied independently to each accepted operating scenario; capital claims are not inferred from funding deficits',output:'Primary distribution is operating EV in native-currency millions; separate signed equity and native per-share distributions retain bridge coverage',
   timing:'Selected timing policy applied to each trial; timing inputs stay fixed and incomplete timing withholds calculation'}};
}

export function simulateResearch(draft,config){
 const state=prepareRun(draft,config);step(state,state.config.trials);return finishRun(state);
}
function checkAborted(signal){
 if(signal?.aborted){const error=Error('Annual research simulation cancelled.');error.name='AbortError';throw error;}
}
export async function simulateResearchAsync(draft,config,{signal,onProgress,yieldControl=()=>new Promise(resolve=>setTimeout(resolve,0)),chunkSize=100}={}){
 checkAborted(signal);
 if(!Number.isInteger(chunkSize)||chunkSize<1||chunkSize>50000)throw Error('Simulation chunk size must be an integer from 1 to 50,000.');
 if(typeof yieldControl!=='function'||onProgress!==undefined&&typeof onProgress!=='function')throw Error('Simulation progress and yield controls must be functions.');
 const state=prepareRun(draft,config),total=state.config.trials;
 onProgress?.({completed:0,total});checkAborted(signal);
 while(state.completed<total){
  await yieldControl();checkAborted(signal);
  step(state,chunkSize);onProgress?.({completed:state.completed,total});checkAborted(signal);
 }
 return finishRun(state);
}
