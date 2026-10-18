import {annualPathDefaults,annualMetricDefaults,conditionedGrowthContext} from './annual-path-sampling.js';
import {prepareJointAnnualPaths,validateJointAnnualConfig,jointAnnualAudit,JOINT_ANNUAL_PATH_METHOD} from './joint-annual-path.js';
export const JOINT_METHOD=JOINT_ANNUAL_PATH_METHOD;
const fields=['annualPath','annualMetrics','annualTerminal','drivers','dependence'];
const clone=x=>structuredClone(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export const isJoint=config=>config?.method===JOINT_METHOD;
export function createJointState(config,{horizon=30,capital='salesCapital'}={}){
 const annualPath=clone(config.annualPath||annualPathDefaults(horizon));
 const annualMetrics=clone(config.annualMetrics??annualMetricDefaults(horizon,capital));
 return {version:1,terminalMode:'scenario-baseline',...Object.fromEntries(fields.filter(k=>config[k]!==undefined).map(k=>[k,clone(config[k])])),annualPath,annualMetrics,loadings:Object.fromEntries(['growth',...Object.keys(annualMetrics)].map(k=>[k,0])),observations:[]};
}
export function jointDefaults(config,options){return {...config,method:JOINT_METHOD,jointAnnual:createJointState(config,options)};}
export function jointEffectiveConfig(config){
 if(!isJoint(config))return config;
 const next={...config,method:'annual-path'};for(const k of fields){if(config.jointAnnual[k]===undefined)delete next[k];else next[k]=clone(config.jointAnnual[k]);}
 delete next.jointAnnual;return next;
}
export function jointViewConfig(config){return isJoint(config)?{...jointEffectiveConfig(config),method:JOINT_METHOD,jointAnnual:clone(config.jointAnnual)}:config;}
export function collectJointView(original,view){
 if(!isJoint(original))return view;
 const nested={...clone(original.jointAnnual),...clone(view.jointAnnual)};
 for(const k of fields){if(view[k]===undefined)delete nested[k];else nested[k]=clone(view[k]);}
 return {...clone(original),trials:view.trials,seed:view.seed,binCount:view.binCount,...(view.capitalPolicy?{capitalPolicy:view.capitalPolicy}:{}),jointAnnual:nested};
}
export function validateJointState(state,outer,validate){
 const allowed=['version','terminalMode',...fields,'loadings','observations'];
 if(!object(state)||state.version!==1||Object.keys(state).some(k=>!allowed.includes(k)))throw Error('Invalid joint annual settings or version.');
 if(state.terminalMode!=='scenario-baseline')throw Error('The application supports scenario-baseline terminal mixtures only.');
 const effective=jointEffectiveConfig({...outer,method:JOINT_METHOD,jointAnnual:state});
 const checked=validate(effective);
 const core=validateJointAnnualConfig({annualPath:state.annualPath,annualMetrics:state.annualMetrics??{},loadings:state.loadings,observations:state.observations,terminalMode:state.terminalMode});
 return {...clone(state),...Object.fromEntries(fields.filter(k=>checked[k]!==undefined).map(k=>[k,checked[k]])),...core,...(!state.annualMetrics?{annualMetrics:undefined}:{})};
}
export function prepareJointSimulation(context,config){
 const c=jointEffectiveConfig(config),state=config.jointAnnual;
 if(c.annualMetrics?.reinvestment&&c.capitalPolicy!=='fixed-schedule')throw Error('Direct annual investment requires the fixed-schedule policy; use annual investmentFactor with a revenue-response policy.');
 if(context.metrics?.reinvestment)context={...context,terminals:{...context.terminals,reinvestment:context.metrics.reinvestment.at(-1)}};
 const sampler=prepareJointAnnualPaths(conditionedGrowthContext(context,c.annualTerminal),{annualPath:state.annualPath,annualMetrics:state.annualMetrics??{},loadings:state.loadings,observations:state.observations,terminalMode:state.terminalMode});
 // Reject configured endpoint/anchor conflicts before launching trials. Scalar
 // supports are independent. Guided sales/capital is nonlinear and derived from
 // the terminal tuple, never treated as another independent endpoint range.
 const range=(spec,fallback,shift=0)=>spec?spec.type==='fixed'?{low:spec.value+shift,high:spec.value+shift}:{low:spec.low+shift,high:spec.high+shift}:{low:fallback,high:fallback};
 const annual=Object.hasOwn(c.drivers,'marginShift'),base=context.terminals;
 const ranges={growth:range(c.annualTerminal?.growth,context.terminalGrowth),taxRate:range(c.annualTerminal?.taxRate,base.taxRate),margin:range(c.drivers[annual?'marginShift':'targetMargin'],base.margin,annual?base.margin:0),wacc:range(c.drivers[annual?'waccShift':'wacc'],base.wacc,annual?base.wacc:0),investmentFactor:{low:1,high:1},reinvestment:{low:base.reinvestment,high:base.reinvestment}};
 sampler.assertEndpointRanges(Object.fromEntries(sampler.keys.filter(k=>k!=='salesCapital').map(k=>[k,ranges[k]])));
 return sampler;
}
export function jointEndpoints(sampler,terminal){return Object.fromEntries(sampler.keys.filter(k=>terminal[k]!==undefined).map(k=>[k,terminal[k]]));}
export const JOINT_NOTE='Joint annual innovations follow the selected factor loadings. Prescribed terminal draws first choose a deterministic scenario baseline; joint residual paths are conditioned on exact years and noisy targets. Noisy targets do not reweight terminal draws. Zero residual SD can retain endpoint-driven movement. Settings are analyst assumptions, not calibrated probabilities.';
export function jointResultMetadata(sampler,scenarios){return {jointAnnual:jointAnnualAudit(sampler,scenarios),dependence:{id:'joint-annual-innovations',label:'Joint annual innovations',description:JOINT_NOTE,latentCorrelations:sampler.audit().innovationCorrelation}};}
