import {annualPathDefaults,validateAnnualPathConfig,prepareAnnualPath,annualPathAudit,annualMetricDefaults,validateAnnualMetrics,prepareAnnualMetrics,sampleAnnualMetrics,annualMetricsAudit,annualMetricConstraint,conditionedGrowthContext} from './annual-path-sampling.js';
// Conditional uncertainty around the dated annual research schedule. No stock-price
// process, probability calibration, implicit capital release, or funding-debt plug.
import {calculateResearchOperating,researchDraftIssues,researchTimingResult} from './research-model.js';
import {marginAtYear} from './margin-path.js';
import {calculateDerivedReinvestment,DERIVED_CAPITAL_POLICY} from './annual-growth-horizon.js';
import {calculateResearchBridge} from './research-claims.js';
import {annualTerminalDefaults,validateAnnualTerminal,createSeededRandom,distributionQuantile,distributionSummary,validateDriverDistribution,histogram,quantile} from './simulation.js';

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
const capitalPolicies=Object.freeze(['fixed-schedule','revenue-scaled',DERIVED_CAPITAL_POLICY]);

export function simulationResearchDefaults(draft){
 return {trials:4000,seed:'annual-research',binCount:36,dependence:'independent',capitalPolicy:'fixed-schedule',method:'annual-path',annualPath:{...annualPathDefaults(draft?.annual?.length??30),...(draft?.incrementalResearch?{innovationSD:0,persistence:0}:{})},annualMetrics:annualMetricDefaults(draft?.annual?.length??30,'investmentFactor'),...(draft?{annualTerminal:annualTerminalDefaults(draft.terminal)}:{}),
  drivers:Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,{type:'fixed',value:fixedStresses[k]}]))};
}

export function validateResearchSimulationConfig(config=simulationResearchDefaults()){
 if(!object(config))throw Error('Annual simulation settings must be an object.');
 const allowed=['trials','seed','binCount','dependence','capitalPolicy','drivers','method','annualPath','annualMetrics','annualTerminal'];
 const unknown=Object.keys(config).filter(k=>!allowed.includes(k));
 if(unknown.length)throw Error(`Unknown annual simulation setting: ${unknown.join(', ')}.`);
 const c={...simulationResearchDefaults(),...config,drivers:{}};
 if(!Number.isInteger(c.trials)||c.trials<1||c.trials>50000)throw Error('Trials must be an integer from 1 to 50,000.');
 if(!Number.isInteger(c.binCount)||c.binCount<1||c.binCount>200)throw Error('Histogram bin count must be an integer from 1 to 200.');
 if(!(typeof c.seed==='string'&&c.seed.trim()&&c.seed.length<=128)&&!Number.isSafeInteger(c.seed))throw Error('Seed must be a nonempty string of at most 128 characters or a safe integer.');
 c.seed=String(c.seed);
 if(c.dependence!=='independent')throw Error('Annual stress inputs support independent draws only; no correlation estimates are implied.');
 if(!capitalPolicies.includes(c.capitalPolicy))throw Error('Capital policy must be fixed-schedule or revenue-scaled.');
 if(own(config,'method')&&!['legacy','annual-path'].includes(config.method))throw Error('Unsupported annual simulation method.');
 c.method=config.method??'legacy';
 if(c.method==='annual-path'||own(config,'annualPath'))c.annualPath=validateAnnualPathConfig(own(config,'annualPath')?config.annualPath:annualPathDefaults());
 else delete c.annualPath;
 if(own(config,'annualMetrics'))c.annualMetrics=validateAnnualMetrics(config.annualMetrics);else delete c.annualMetrics;
 if(own(config,'annualTerminal'))c.annualTerminal=validateAnnualTerminal(config.annualTerminal);else delete c.annualTerminal;
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

function buildTrialDraft(d,stress,capitalPolicy,growthPath){
 let reviewedPrior=d.anchor.revenue,trialPrior=d.anchor.revenue;
 const n=d.annual.length,derived=d.schemaVersion===2;
 const phased=d.marginPath?.enabled===true,basePath=d.marginPath;
 const stressedPath=phased&&stress.marginShift!==0?{...basePath,interimMargin:basePath.interimMargin+stress.marginShift,terminalMargin:basePath.terminalMargin+stress.marginShift}:basePath;
 // The observed/assumed starting margin stays anchored. Stress future targets,
 // then add each curve delta to the edited row so manual offsets survive.
 const marginDelta=year=>phased?(stress.marginShift===0?0:marginAtYear(stressedPath,year)-marginAtYear(basePath,year)):stress.marginShift;
 const annual=d.annual.map((row,index)=>{
  const reviewedGrowth=row.revenue/reviewedPrior-1;
  const weight=n>1?(n-1-index)/(n-1):0;
  // Bypass reconstruction at zero premium to preserve reviewed amounts bit for
  // bit, including a nonconstant annual path and the final explicit-year rate.
  const revenue=growthPath?trialPrior*(1+growthPath[index]):stress.growthPremium===0?row.revenue:trialPrior*(1+reviewedGrowth+stress.growthPremium*weight);
  reviewedPrior=row.revenue;trialPrior=revenue;
  const scale=!derived&&capitalPolicy==='revenue-scaled'?revenue/row.revenue:1;
  return {...row,revenue,margin:row.margin+marginDelta(row.year),reinvestment:row.reinvestment*stress.investmentMultiplier*scale,wacc:row.wacc+stress.waccShift};
 });
 if(derived&&annual.every(r=>finite(r.revenue)&&r.revenue>0)){
  // Rebase the response on the current editable schedule, not the original source,
  // so zero growth stress preserves manual investment edits exactly. Apply the
  // independent signed investment multiplier only after the capital response.
  const investments=calculateDerivedReinvestment(d,annual,{baselineAnnual:d.annual});
  annual.forEach((row,i)=>{row.reinvestment=investments[i]*stress.investmentMultiplier;});
 }
 const next={...d,annual,terminal:{...d.terminal,margin:d.terminal.margin+stress.marginShift,wacc:d.terminal.wacc+stress.waccShift}};
 if(d.marginPath?.enabled===true&&stress.marginShift!==0){
  const p=d.marginPath;
  next.marginPath={...stressedPath,
   generatedMargins:p.generatedMargins.map((m,i)=>m+marginDelta(d.annual[i].year)),
   ...(p.manualOverrides?{manualOverrides:Object.fromEntries(Object.entries(p.manualOverrides).map(([year,m])=>[year,m+marginDelta(Number(year))]))}:{}),
   simulationMarginShift:(p.simulationMarginShift||0)+stress.marginShift};
 }
 return next;
}

// A replayable annual path for any exported trial. This helper preserves signed
// investment, source metadata, the complete horizon and the selected timing.
export function researchStressDraft(draft,stresses={},capitalPolicy='fixed-schedule',growthPath){
 const issues=researchDraftIssues(draft);if(issues.length)throw Error(issues.join(' '));
 if(!object(stresses)||Object.keys(stresses).some(k=>!RESEARCH_SIMULATION_DRIVER_KEYS.includes(k)))throw Error('Supply only the four supported annual stress inputs.');
 const stress={...fixedStresses,...stresses};
 if(!RESEARCH_SIMULATION_DRIVER_KEYS.every(k=>finite(stress[k]))||stress.investmentMultiplier<0)throw Error('Stress inputs must be finite and the investment multiplier must be nonnegative.');
 if(!capitalPolicies.includes(capitalPolicy))throw Error('Capital policy must be fixed-schedule or revenue-scaled.');
 if(draft.schemaVersion!==2&&capitalPolicy===DERIVED_CAPITAL_POLICY)throw Error('Derived capital policy requires a version-2 annual horizon draft.');
 if(growthPath!==undefined){
  if(!Array.isArray(growthPath)||growthPath.length!==draft.annual.length||!Array.from(growthPath).every(g=>finite(g)&&g>-1))throw Error('Replay growth path must contain one finite growth rate above −100% for every explicit year.');
  if(stress.growthPremium!==0)throw Error('An annual growth path cannot also apply a scalar growth premium.');
  const baseline=researchAnnualPathContext(draft).baseline;
  if(growthPath.every((g,i)=>g===baseline[i]))growthPath=undefined;
 }
 return buildTrialDraft(structuredClone(draft),stress,capitalPolicy,growthPath);
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
export function researchAnnualPathContext(draft){
 let prior=draft.anchor.revenue;
 const baseline=draft.annual.map(row=>{const growth=row.revenue/prior-1;prior=row.revenue;return growth;});
 const derived=draft.schemaVersion===2?draft.derivedForecast:null;
 const candidate=derived?(derived.revenuePathPreserved===true?derived.sourceForecastHorizonYears+1:derived.growthMaturityYear):baseline.length+1;
 const plateauMatches=baseline.slice(candidate-1).every(g=>Math.abs(g-draft.terminal.growth)<=1e-12);
 const terminalYear=plateauMatches?candidate:baseline.length+1;
 return {baseline,terminalYear,terminalGrowth:draft.terminal.growth,metrics:{...Object.fromEntries(['margin','taxRate','wacc','reinvestment'].map(k=>[k,draft.annual.map(r=>r[k])])),investmentFactor:draft.annual.map(()=>1)},terminals:{...draft.terminal,investmentFactor:1,reinvestment:draft.annual.at(-1).reinvestment},terminalScalars:{growth:draft.terminal.growth,taxRate:draft.terminal.taxRate,roic:draft.terminal.roic},capital:'investmentFactor',currency:draft.currency,...(!plateauMatches?{terminalAnchorNote:'Edited revenue departs from the prior stable-growth plateau. The edited baseline is retained; the fixed stable-growth anchor is the terminal continuation after the full explicit forecast.'}:{})};
}
function prepareRun(draft,config){
 // Capture before asynchronous yields: later edits cannot alter an in-flight run.
 const d=structuredClone(draft),supplied=config??d?.researchSimulationConfig??simulationResearchDefaults(d),c=validateResearchSimulationConfig(supplied);
 if(d.schemaVersion===2)c.capitalPolicy=DERIVED_CAPITAL_POLICY;
 else if(c.capitalPolicy===DERIVED_CAPITAL_POLICY)throw Error('Derived capital policy requires a version-2 annual horizon draft.');
 const context=c.method==='annual-path'?conditionedGrowthContext(researchAnnualPathContext(d),c.annualTerminal):null;
 const pathSampler=context?prepareAnnualPath(context.baseline,c.annualPath,context):null;
 const operating=calculateResearchOperating(d),timing=requireTiming(d,operating),bridge=bridgeFor(d,timing.enterprise,timing.date);
 if(c.annualMetrics?.reinvestment&&c.capitalPolicy!=='fixed-schedule')throw Error('Direct annual investment requires the fixed-schedule policy; use annual investmentFactor with a revenue-response policy.');
 const metricSamplers=pathSampler&&c.annualMetrics?prepareAnnualMetrics(context,c.annualMetrics):null;
 return {draft:d,config:c,pathSampler,metricSamplers,omitMethod:!own(supplied,'method'),baseline:{...operating,enterprise:timing.enterprise,originEnterprise:operating.enterprise,operating,timing,bridge},
  random:createSeededRandom(c.seed),completed:0,draws:[],equityDraws:[],perShareDraws:[],scenarios:[],exclusions:{},exclusionExamples:{},bridgeReasons:{},nonpositiveEquityCount:0,
  inputDistributions:Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,{...distributionSummary(c.drivers[k]),...(pathSampler&&k==='growthPremium'?{active:false,inactiveReason:'Annual growth path replaces this growth premium distribution.'}:metricSamplers&&(metricSamplers.investmentFactor||metricSamplers.reinvestment)&&k==='investmentMultiplier'?{active:false,inactiveReason:'Annual capital paths replace this scalar investment multiplier.'}:metricSamplers&&(k==='marginShift'||k==='waccShift')?{active:true,scope:'terminal endpoint only'}:{})}]))};
}
function reject(state,reason,detail){
 state.exclusions[reason]=(state.exclusions[reason]||0)+1;
 if(detail&&!own(state.exclusionExamples,reason))state.exclusionExamples[reason]=detail;
}
function trialConstraints(d){
 if(d.annual.some(r=>![r.revenue,r.margin,r.taxRate,r.reinvestment,r.wacc].every(finite)))return 'nonfinite-valuation';
 const t=d.terminal;
 if(![t.margin,t.wacc,t.growth,t.taxRate,t.roic].every(finite))return 'nonfinite-valuation';
 if(t.margin<=0||t.margin>1||t.wacc<=t.growth||t.wacc>1||t.growth<0||t.growth>.05||t.taxRate<0||t.taxRate>.6||t.roic<=t.growth)return 'terminal-constraints';
 if(d.annual.some(r=>r.revenue<=0||r.margin<-.5||r.margin>1||r.taxRate<0||r.taxRate>.6||r.wacc<=0||r.wacc>1))return 'annual-constraints';
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
  try{stress=Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map((k,i)=>[k,state.pathSampler&&k==='growthPremium'?0:distributionQuantile(uniforms[i],c.drivers[k])]))}
  catch(error){reject(state,'sampling-rejected',error.message);continue;}
  const terminal={...d.terminal,margin:d.terminal.margin+stress.marginShift,wacc:d.terminal.wacc+stress.waccShift};
  if(state.pathSampler)for(const [k,spec]of Object.entries(c.annualTerminal||{}))terminal[k]=distributionQuantile(state.random(),spec);
  const growthPath=state.pathSampler?.sample(state.random,terminal.growth);
  const metricPaths=state.metricSamplers?sampleAnnualMetrics(state.metricSamplers,state.random,terminal):null;
  const metricIssue=annualMetricConstraint(metricPaths);if(metricIssue){reject(state,metricIssue);continue;}
  if(growthPath?.some(g=>!finite(g)||g<=-1)){reject(state,'annual-growth-bounds');continue;}
  let next;
  // An exactly baseline path (zero SD or every year fixed) retains reviewed revenue bit for bit.
  try{const annualStress=metricPaths?{...stress,...(metricPaths.margin?{marginShift:0}:{}),...(metricPaths.wacc?{waccShift:0}:{}),...((metricPaths.reinvestment||metricPaths.investmentFactor)?{investmentMultiplier:1}:{})}:stress;next=buildTrialDraft(d,annualStress,c.capitalPolicy,growthPath?.every((g,i)=>g===state.pathSampler.baseline[i])?undefined:growthPath);
   if(metricPaths)for(const [k,path]of Object.entries(metricPaths))next.annual.forEach((row,i)=>{if(k==='investmentFactor')row.reinvestment*=path[i];else row[k]=path[i];});
   next.terminal=terminal;
   if(next.marginPath?.enabled===true&&metricPaths?.margin)next.marginPath={...next.marginPath,terminalMargin:terminal.margin};}
  catch(error){reject(state,/finite numerical range/.test(error.message)?'nonfinite-valuation':'valuation-rejected',error.message);continue;}
  const constraint=trialConstraints(next);
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
  state.scenarios.push({trial,...stress,...(growthPath?{growthPath}:{}),...(metricPaths?{metricPaths}:{}),...(state.pathSampler?{terminal}:{}),enterprise,originEnterprise:operating.enterprise,forecastPV:operating.forecastPV,terminalPV:operating.terminalPV,
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
 const capitalDescription=state.metricSamplers?.investmentFactor?'Annual investment factors multiply the existing signed capital-response schedule after revenue and committed-floor calculations. Fixed years fix the coefficient, not the resulting currency investment. No independent dollar-investment draw is added; the scalar investment multiplier is inactive.':state.metricSamplers?.reinvestment?'Annual net investment is sampled directly in native-currency millions around the edited signed schedule. It replaces the scalar investment multiplier and revenue-response policy; fixed investment years remain exact even when revenue varies. Revenue and investment are distinct primitive assumptions; implied returns are derived.':d.schemaVersion===2
  ? 'Committed-spending-floor-plus-growth capital sensitivity: retain current edited positive annual investment as a floor, scale upward with revenue and fund additional expansion at the stated marginal sales / capital. Preserve explicit signed releases without amplification. Apply the optional investment multiplier separately after this response. This is an analyst sensitivity, not verified capacity economics; gross capex, maintenance, working capital and customer advances are not separately rebuilt.'
  : c.capitalPolicy==='fixed-schedule'
  ? 'Fixed reviewed absolute net-investment schedule, multiplied by the sampled investment stress. This is a capacity/commitment stress; not every amount is contractual. Revenue changes alone do not change explicit investment.'
  : 'Each reviewed annual net-investment amount is scaled by trial revenue / reviewed revenue, then by the sampled investment multiplier. This is an analytical proportional-investment sensitivity, not verified capacity economics.';
 const warnings=[
  'Conditional distribution of operating DCF values under selected analyst stresses. Frequencies are not calibrated real-world probabilities, expected returns or stock-price forecasts.',
  (!state.pathSampler||state.pathSampler.innovationSD===0)&&Object.values(c.annualMetrics||{}).every(s=>s.innovationSD===0)&&Object.values(c.annualTerminal||{}).every(s=>s.type==='fixed')&&Object.values(c.drivers).every(spec=>spec.type==='fixed')?(state.metricSamplers?'All uncertain inputs are Fixed. This run repeats the selected scenario; it is not an estimated confidence range.':'All four inputs are Fixed. This run repeats the selected stress scenario; it is not an estimated confidence range.'):'Distribution families and hyperparameters are explicit analyst judgments. They are not fitted probabilities or a forecast of investment returns.',
  state.metricSamplers?'Annual operating primitives use separate Gaussian AR(1) bridges around the edited baseline, conditioned on user-fixed years and terminal endpoints. Scalar margin and WACC shifts control terminal targets only. Annual growth holds sampled stable growth at the selected maturity and throughout its plateau.':state.pathSampler?'Annual growth uses a Gaussian AR(1) bridge around reviewed baseline growth, conditioned exactly on fixed years and the terminal continuation anchor. The growth-premium distribution is inactive. Innovation SD and persistence are illustrative assumptions.':'One driver vector generates the complete annual path. The growth premium fades to zero in the final explicit year; reviewed growth and maturity shape are preserved around it.',
  ...(state.pathSampler?.terminalAnchorNote?[state.pathSampler.terminalAnchorNote]:[]),
  capitalDescription,
  state.metricSamplers||c.annualTerminal?'Historical anchors, forecast horizon, timing stub inputs and dated claims assumptions stay fixed. Annual and terminal tax can vary; terminal investment remains NOPAT × sampled growth / sampled ROIC.':'Tax, terminal growth, terminal ROIC, anchor revenue, forecast horizon, timing stub inputs and selected capital/claims assumptions stay fixed. Terminal investment remains NOPAT × growth / ROIC.',
  ...(baseline.bridge.claimRepricedPerTrial?['Selected capital assumptions stay fixed; AAOI note and customer-warrant claim values are repriced from each trial operating value using the selected option-inclusive approximation.']:[]),
  state.metricSamplers?.reinvestment?'Direct additive investment uncertainty may produce a signed release; this is an explicit user-selected scenario assumption, not a release inferred from falling revenue.':'Signed explicit net investment is preserved, including an explicit release or customer-advance assumption. Falling revenue never creates an investment release automatically.',
  'Future FCFF funding deficits remain inside operating value and are never deducted a second time as opening debt. This is not a financing, distress or recovery model.',
  'Negative operating EV, common equity and per-share values remain signed. No zero floor or clipping is applied.',
  ...baseline.operating.warnings,...baseline.timing.warnings,...(baseline.bridge.warnings||[])
 ];
 if(eligible<accepted)warnings.push(`A valid dated common-equity allocation is available for ${eligible} of ${accepted} accepted operating scenarios. Operating EV remains available; missing capital, share or security information is not filled with zero.`);
 if(Object.values(c.drivers).some(spec=>spec.type==='normal'))warnings.push('Normal mean and SD describe the underlying unbounded normal. Sampling conditions on the stated bounds using the shared inverse CDF; actual bounded moments differ.');
 if(excluded)warnings.push(`${excluded} of ${c.trials} attempted trials were excluded without replacement. Quantiles and frequencies are conditional on the ${accepted} valid operating trials; exclusions change the effective input distribution.`);
 if(!accepted)warnings.push('No valid trials remain. No operating or common-equity distribution is available; revise the assumptions.');
 if(state.metricSamplers)warnings.push('Annual margin, operating tax, WACC and signed net investment have separate conditioned paths. New metric SD defaults are zero until explicitly edited; they are analyst judgments, not sourced volatility estimates. Terminal margin and WACC use scalar stresses; optional terminal growth, tax and ROIC are sampled once. Fixed years retain baseline values; zero SD removes residual noise but retains deterministic conditional-mean movement toward a changed terminal endpoint. Derived revenue, earnings, FCFF, discount factors and implied returns are not sampled again.');
 const exportedConfig=structuredClone(c);if(state.omitMethod&&c.method==='legacy')delete exportedConfig.method;
 return {version:RESEARCH_SIMULATION_VERSION,...enterprise,basis:'enterprise',units,enterprise,equity,perShare,
  classification:'Conditional annual-research DCF simulation; analyst stresses, not calibrated probabilities',config:exportedConfig,baseline,
  scenarios:state.scenarios,...(state.pathSampler?{annualPaths:{...annualPathAudit(state.pathSampler,state.scenarios),...(state.metricSamplers?{metrics:annualMetricsAudit(state.metricSamplers,state.scenarios)}:{})}}:{}),inputDistributions:state.inputDistributions,attempts:c.trials,accepted,excluded,exclusions:state.exclusions,exclusionExamples:state.exclusionExamples,
  zeroEquityCount:state.nonpositiveEquityCount,zeroEquityShare,
  bridgeCoverage:{accepted:eligible,eligible,blocked:accepted-eligible,total:accepted,complete:accepted>0&&eligible===accepted,share:accepted?eligible/accepted:null,reasons:state.bridgeReasons,baselineEligible:baseline.bridge.eligible===true},
  timing:{status:baseline.timing.status,date:baseline.timing.date,discountOrigin:d.discountOrigin,label:baseline.timing.label},
  quote:{status:'blocked',message:'No verified current market-price comparison is supplied for this source-dated annual-research simulation.'},
  dependence:{id:'independent',label:'Independent analyst stress draws',description:state.metricSamplers?'Annual primitive innovations are independent across metrics, with each metric’s own serial persistence. Scalar terminal draws are independent. These are explicit modeling assumptions, not estimated correlations.':'The four stress inputs are sampled independently. This is a modeling assumption, not evidence of independence.',latentCorrelations:null},
  warnings,method:{distribution:'Shared fixed, triangular, uniform or conditionally truncated normal inverse CDF',random:'FNV-1a seed hash / Mulberry32',
   sampling:'Exactly the requested attempted-trial count; invalid outcomes excluded without clipping or redraw',quantiles:'linear interpolation at (n−1)p (type 7)',histogram:'equal-width bins; left-closed/right-open except the inclusive final upper edge',
   inputUnits:'growthPremium, marginShift and waccShift are fractions of one (0.01 = one percentage point); investmentMultiplier is a nonnegative multiple',
   growth:state.pathSampler?'Exact Gaussian AR(1) bridge around reviewed annual growth; all fixed years and terminal continuation anchor are conditioned exactly':'growth[i] = reviewedGrowth[i] + growthPremium × (N−1−i)/(N−1); premium is zero when N=1; revenue is reconstructed sequentially from the anchor',
   ...(d.marginPath?.enabled===true?{margin:state.metricSamplers?.margin?'Annual margin uses a conditioned Gaussian path around the edited calendar baseline; user-fixed years remain exact. Scalar margin shift controls only the terminal endpoint.':'Anchored-start margin sensitivity: shift interim and terminal targets together; add each calendar-year curve delta to edited annual margins, generated margins and manual overrides. Starting margin, source provenance and margin dates stay fixed; manual row offsets are preserved.'}:{}),
   capitalPolicy:c.capitalPolicy,capitalDescription,...(d.schemaVersion===2?{capitalResponseBaseline:'Current edited annual schedule',marginalSalesCapital:d.derivedForecast.marginalSalesCapital,investmentMultiplierOrder:'After derived capital response'}:{}),terminal:'Final explicit revenue × (1+sampled g), scalar terminal margin and WACC, selected terminal tax and NOPAT × g / ROIC reinvestment; optional terminal distributions are drawn once per trial',
   bridge:baseline.bridge.claimRepricedPerTrial?'Selected dated capital assumptions applied to each accepted operating scenario; AAOI option claim values are repriced per trial, never inferred from funding deficits':'Existing source-dated bridge applied independently to each accepted operating scenario; capital claims are not inferred from funding deficits',output:'Primary distribution is operating EV in native-currency millions; separate signed equity and native per-share distributions retain bridge coverage',
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
