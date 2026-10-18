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
export function prepareAnnualPath(baseline,spec,{terminalGrowth,terminalYear=baseline?.length+1,terminalAnchorNote}={}){
 if(!Array.isArray(baseline)||baseline.length<1||baseline.length>30||!Array.from(baseline).every(finite))throw Error('A finite baseline annual growth path of 1–30 years is required.');
 if(!finite(terminalGrowth)||!Number.isInteger(terminalYear)||terminalYear<1||terminalYear>baseline.length+1)throw Error('Annual growth terminal anchor is invalid.');
 const c=validateAnnualPathConfig(spec,baseline.length),n=baseline.length;
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
  return {coefficient:c.persistence*ratio,sd:c.innovationSD*Math.sqrt(ratio)};
 });
 const base=[...baseline];
 return {...c,baseline:base,terminalGrowth,terminalYear,...(terminalAnchorNote?{terminalAnchorNote}:{}),fixedYears:[...anchors].filter(y=>y<=n).sort((a,b)=>a-b),sample(random){
  if(typeof random!=='function')throw Error('Annual path sampling requires a random generator.');
  if(c.innovationSD===0)return [...base];
  let previous=0;
  return base.map((g,i)=>{
   const t=transitions[i];if(!t){previous=0;return g;}
   const u=random(),v=random();if(!finite(u)||!finite(v)||u<0||u>=1||v<0||v>=1)throw Error('Annual path random uniforms must be in [0, 1).');
   previous=t.coefficient*previous+t.sd*Math.sqrt(-2*Math.log(1-u))*Math.cos(2*Math.PI*v);
   return g+previous;
  });
 }};
}
export function annualPathAudit(sampler,scenarios){
 return {baseline:[...sampler.baseline],fixedYears:[...sampler.fixedYears],terminalYear:sampler.terminalYear,terminalGrowth:sampler.terminalGrowth,innovationSD:sampler.innovationSD,persistence:sampler.persistence,...(sampler.terminalAnchorNote?{terminalAnchorNote:sampler.terminalAnchorNote}:{}),
  preview:scenarios.slice(0,12).map(s=>({trial:s.trial,growth:[...s.growthPath]})),
  description:'Gaussian AR(1) deviations around the deterministic annual baseline, conditioned exactly on all fixed-year and terminal anchors. Innovation SD and persistence are illustrative analyst assumptions, not fitted reliability estimates. Invalid paths are excluded without replacement.'};
}
