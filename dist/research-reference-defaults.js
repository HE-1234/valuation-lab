import {jointEffectiveConfig} from './joint-simulation-config.js';
// Application policy only. Frozen company research and saved configurations are
// never rewritten. Call this solely when constructing fresh/reset defaults.
export const REFERENCE_DEFAULT_TICKERS=Object.freeze(['KLAC','AMAT','LRCX','ASML','FN','CDNS','SNPS','NVMI','ONTO']);
export const hasResearchReferencePolicy=draft=>!!draft?.incrementalResearch&&REFERENCE_DEFAULT_TICKERS.includes(draft.ticker);
export function applyResearchReferenceDefaults(draft,config){
 if(!hasResearchReferencePolicy(draft))return config;
 const reference=spec=>({...spec,fixedYears:[],innovationSD:0,persistence:0});
 return {...config,annualPath:reference(config.annualPath),annualMetrics:Object.fromEntries(Object.entries(config.annualMetrics).map(([key,spec])=>[key,reference(spec)]))};
}

// Presentation classification of active input widths, not a probability model
// or a claim that the next run will accept paths or have a particular range.
const hasWidth=spec=>!!spec&&spec.type!=='fixed'&&spec.high>spec.low;
const hasFreeInnovation=(spec,length,terminalYear=length+1)=>!!spec&&spec.innovationSD>0&&Array.from({length},(_,i)=>i+1).some(year=>year<terminalYear&&!spec.fixedYears.includes(year));
export function researchReferenceState(config,context){
 config=jointEffectiveConfig(config);
 const annual=config.method==='annual-path',metrics=annual?config.annualMetrics:null;
 const activeDrivers=Object.entries(config.drivers).filter(([key])=>!annual||key!=='growthPremium'&&!(key==='investmentMultiplier'&&(metrics?.investmentFactor||metrics?.reinvestment)));
 const stochastic=activeDrivers.some(([,spec])=>hasWidth(spec))||annual&&(Object.values(config.annualTerminal||{}).some(hasWidth)||hasFreeInnovation(config.annualPath,context.baseline.length,context.terminalYear)||Object.values(metrics||{}).some(spec=>hasFreeInnovation(spec,context.baseline.length)));
 const userFixed=annual&&(config.annualPath.fixedYears.length>0||Object.values(metrics||{}).some(spec=>spec.fixedYears.length>0));
 return {annual,stochastic:!!stochastic,userFixed:!!userFixed};
}
export function hasInactiveReferencePersistence(config,context){
 config=jointEffectiveConfig(config);
 if(config.method!=='annual-path')return false;
 const specs=[config.annualPath,...Object.values(config.annualMetrics||{})];
 return specs.every(s=>s.innovationSD===0&&s.persistence===0)&&Object.entries(config.annualTerminal||{}).every(([key,s])=>s.type==='fixed'&&s.value===context.terminalScalars[key])&&['marginShift','waccShift'].every(key=>config.drivers[key].type==='fixed'&&config.drivers[key].value===0);
}
