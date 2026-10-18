// Finite-horizon Gaussian AR(1) deviations, exactly conditioned on baseline anchors.
// Innovation SD is in fractional growth units; defaults are illustrative judgments.
export const ANNUAL_GROWTH_PATH = Symbol('simulation annual growth path');
export const ANNUAL_PATH_METHODS = Object.freeze(['legacy','annual-path']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function annualPathDefaults(horizon=30){
 if(!Number.isInteger(horizon)||horizon<1||horizon>30)throw Error('Annual growth horizon must be a whole year from 1 to 30.');
 return {fixedYears:[1,2,3].filter(y=>y<=horizon),innovationSD:.03,persistence:.6};
}
export function validateAnnualPathConfig(spec,horizon){
 if(!spec||typeof spec!=='object'||Array.isArray(spec)||Object.keys(spec).some(k=>!['fixedYears','innovationSD','persistence'].includes(k)))throw Error('Annual growth path settings require fixedYears, innovationSD and persistence only.');
 if(!Array.isArray(spec.fixedYears)||!Array.from(spec.fixedYears).every(y=>Number.isInteger(y)&&y>=1&&y<=30&&(horizon==null||y<=horizon))||new Set(spec.fixedYears).size!==spec.fixedYears.length)throw Error('Fixed growth years must be distinct forecast years within the explicit horizon.');
 if(!finite(spec.innovationSD)||spec.innovationSD<0||spec.innovationSD>2)throw Error('Annual growth innovation SD must be between 0 and 200 percentage points.');
 if(!finite(spec.persistence)||Math.abs(spec.persistence)>1)throw Error('Annual growth persistence must be between −1 and 1.');
 return {fixedYears:[...spec.fixedYears].sort((a,b)=>a-b),innovationSD:spec.innovationSD,persistence:spec.persistence};
}
export function prepareAnnualPath(baseline,spec,{terminalGrowth,terminalYear=baseline?.length+1,terminalAnchorNote,variableTerminal=false}={}){
 if(!Array.isArray(baseline)||baseline.length<1||baseline.length>30||!Array.from(baseline).every(finite))throw Error('A finite baseline annual growth path of 1–30 years is required.');
 if(!finite(terminalGrowth)||!Number.isInteger(terminalYear)||terminalYear<1||terminalYear>baseline.length+1)throw Error('Annual growth terminal anchor is invalid.');
 const c=validateAnnualPathConfig(spec,baseline.length),n=baseline.length;
 if(variableTerminal&&c.fixedYears.some(y=>y>=terminalYear))throw Error('A user-fixed growth year at or after maturity conflicts with variable terminal growth. Keep terminal growth fixed at baseline or remove those fixed growth years.');
 if(terminalYear<=n&&baseline.slice(terminalYear-1).some(g=>Math.abs(g-terminalGrowth)>1e-12))throw Error('Growth at and after maturity must equal fixed terminal growth.');
 const anchors=new Set([...c.fixedYears,...Array.from({length:n+2-terminalYear},(_,i)=>terminalYear+i)]);
 // Conditional transition uses the next exact anchor, including future anchors.
 // Given x[t-1], x[t]=rho*x[t-1]+epsilon. The endpoint likelihood is
 // x[k]=rho^(k-t)*x[t]+eta, Var(eta)=sigma²*sum(j=0..k-t-1)rho^(2j).
 // Multiplying these Gaussian densities gives the bridge mean and variance.
 const transitions=baseline.map((_,i)=>{
  const t=i+1;if(anchors.has(t))return null;
  let k=t+1;while(!anchors.has(k))k++;
  let q=0,power=1;for(let j=0;j<k-t;j++){q+=power;power*=c.persistence*c.persistence;}
  const ratio=q/(q+power);
  return {coefficient:c.persistence*ratio,endpointCoefficient:Math.pow(c.persistence,k-t)/(q+power),endpoint:k===terminalYear,sd:c.innovationSD*Math.sqrt(ratio)};
 });
 const base=[...baseline];
 return {...c,baseline:base,terminalGrowth,terminalYear,variableTerminal,...(terminalAnchorNote?{terminalAnchorNote}:{}),fixedYears:[...anchors].filter(y=>y<=n&&(!variableTerminal||y<terminalYear)).sort((a,b)=>a-b),sample(random,endpoint=terminalGrowth){
  if(typeof random!=='function')throw Error('Annual path sampling requires a random generator.');
  if(!finite(endpoint))throw Error('Annual terminal endpoint must be finite.');
  if(c.innovationSD===0&&endpoint===terminalGrowth)return [...base];
  let previous=0;
  return base.map((g,i)=>{
   const t=transitions[i];if(!t){previous=0;return i+1>=terminalYear&&endpoint!==terminalGrowth?endpoint:g;}
   const u=t.sd===0?0:random(),v=t.sd===0?0:random();if(!finite(u)||!finite(v)||u<0||u>=1||v<0||v>=1)throw Error('Annual path random uniforms must be in [0, 1).');
   previous=t.coefficient*previous+(t.endpoint?t.endpointCoefficient*(endpoint-terminalGrowth):0)+t.sd*Math.sqrt(-2*Math.log(1-u))*Math.cos(2*Math.PI*v);
   return g+previous;
  });
 }};
}
export function annualPathAudit(sampler,scenarios){
 return {baseline:[...sampler.baseline],fixedYears:[...sampler.fixedYears],terminalYear:sampler.terminalYear,terminalGrowth:sampler.terminalGrowth,variableTerminal:sampler.variableTerminal,innovationSD:sampler.innovationSD,persistence:sampler.persistence,...(sampler.terminalAnchorNote?{terminalAnchorNote:sampler.terminalAnchorNote}:{}),
  preview:scenarios.slice(0,12).map(s=>({trial:s.trial,growth:[...s.growthPath],terminalGrowth:s.terminal?.growth??sampler.terminalGrowth})),
  description:'Gaussian AR(1) deviations around the deterministic annual baseline, conditioned exactly on all fixed-year and terminal anchors. Innovation SD and persistence are illustrative analyst assumptions, not fitted reliability estimates. Invalid paths are excluded without replacement.'};
}

// Annual primitives only. Revenue, NOPAT, FCFF, discount factors and implied
// returns are calculated downstream, never sampled a second time.
export const ANNUAL_METRIC_PATHS=Symbol('simulation annual operating paths');
export const ANNUAL_METRIC_KEYS=Object.freeze(['margin','taxRate','wacc','salesCapital','reinvestment','investmentFactor']);
export function annualMetricDefaults(horizon=30,capital='salesCapital',scale=1){
 const settings=(sd)=>({...annualPathDefaults(horizon),innovationSD:sd});
 return {margin:settings(0),taxRate:settings(0),wacc:settings(0),[capital]:settings(0)};
}
export function validateAnnualMetrics(metrics,horizon){
 if(!metrics||typeof metrics!=='object'||Array.isArray(metrics)||Object.keys(metrics).some(k=>!ANNUAL_METRIC_KEYS.includes(k)))throw Error('Annual metric settings contain an unsupported operating input.');
 if(['salesCapital','reinvestment','investmentFactor'].filter(k=>metrics[k]).length>1)throw Error('Choose annual sales / capital or annual reinvestment, never both.');
 return Object.fromEntries(Object.entries(metrics).map(([key,spec])=>{
  // Absolute capital amounts are in currency millions, not percentage points.
  if(key!=='reinvestment'&&key!=='salesCapital')return [key,validateAnnualPathConfig(spec,horizon)];
  const checked=validateAnnualPathConfig({...spec,innovationSD:0},horizon);
  if(!finite(spec.innovationSD)||spec.innovationSD<0)throw Error('Annual capital innovation SD must be finite and nonnegative.');
  return [key,{...checked,innovationSD:spec.innovationSD}];
 }));
}
export function prepareAnnualMetrics(context,metrics){
 const specs=validateAnnualMetrics(metrics,context.baseline.length);
 return Object.fromEntries(Object.entries(specs).map(([key,spec])=>{
  const baseline=context.metrics?.[key];
  if(!baseline)throw Error(`Annual ${key} is unavailable for this model.`);
  // Reuse the unit-free bridge, rescaling capital SD to avoid rate-only limits.
  const sampler=prepareAnnualPath(baseline,{...spec,innovationSD:Math.min(2,spec.innovationSD)},{terminalGrowth:context.terminals?.[key]??baseline.at(-1),terminalYear:baseline.length+1});
  const unitSD=sampler.innovationSD,scale=unitSD?spec.innovationSD/unitSD:1;
  return [key,{...sampler,innovationSD:spec.innovationSD,sample(random,endpoint=sampler.terminalGrowth){const values=sampler.sample(random,sampler.terminalGrowth+(endpoint-sampler.terminalGrowth)/scale);return scale===1?values:values.map((v,i)=>baseline[i]+(v-baseline[i])*scale);}}];
 }));
}
export function sampleAnnualMetrics(samplers,random,endpoints={}){return Object.fromEntries(Object.entries(samplers||{}).map(([k,s])=>[k,s.sample(random,endpoints[k]??s.terminalGrowth)]));}
export function annualMetricsAudit(samplers,scenarios){return Object.fromEntries(Object.entries(samplers||{}).map(([key,s])=>[key,{...annualPathAudit(s,[]),units:key==='reinvestment'?'currency millions':key==='salesCapital'?'sales / capital ratio':key==='investmentFactor'?'net-investment factor':'fraction',preview:scenarios.slice(0,12).map(row=>({trial:row.trial,values:[...row.metricPaths[key]],terminalGrowth:row.terminal?.[key]??s.terminalGrowth}))}]));}
export function annualMetricConstraint(paths){
 for(const [key,values]of Object.entries(paths||{}))if(values.some(v=>!finite(v)||(key==='margin'&&(v<-.5||v>1))||(key==='taxRate'&&(v<0||v>.6))||(key==='wacc'&&(v<=0||v>1))||(['salesCapital','investmentFactor'].includes(key)&&v<=0)))return `annual-${key}-bounds`;
 return null;
}

export function varyingTerminalGrowth(spec,baseline){
 if(!spec)return false;
 return spec.type==='fixed'?spec.value!==baseline:spec.low!==baseline||spec.high!==baseline;
}
export function conditionedGrowthContext(context,terminal){return varyingTerminalGrowth(terminal?.growth,context.terminalGrowth)?{...context,variableTerminal:true,terminalAnchorNote:'Sampled terminal growth is the conditioned maturity endpoint and is held across the stable plateau. User-fixed years at or after maturity require terminal growth fixed at baseline.'}:context;}
