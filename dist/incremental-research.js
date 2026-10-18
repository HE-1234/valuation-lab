import {incrementalRegistry,incrementalRecord} from './incremental-research-registry.js';
import {researchDraftFor,researchDraftIssues} from './research-model.js';
import {simulationResearchDefaults,validateResearchSimulationConfig} from './research-simulation.js';
import {isUSRobinhoodCandidate} from './company-catalog.js';
export const INCREMENTAL_RESEARCH_PATH='./data/incremental-research-2026-10-18/cases.json';
export function validateIncrementalResearch(bundle){
 // The separately audited payload must match the shipped immutable registry.
 // Imported edits belong in drafts; they cannot rewrite source or audit identity.
 if(JSON.stringify(bundle)!==JSON.stringify(incrementalRegistry))throw Error('Incremental research package does not match the independently reviewed source and audit registry.');
 return structuredClone(bundle);
}
export async function fetchIncrementalResearch(fetcher=globalThis.fetch,{timeoutMs=3000}={}){
 const controller=typeof AbortController==='function'?new AbortController():null;let timer;
 const request=(async()=>{const response=await fetcher(INCREMENTAL_RESEARCH_PATH,controller?{signal:controller.signal}:undefined);if(!response?.ok)throw Error('Incremental research unavailable');return validateIncrementalResearch(await response.json());})();
 try{return await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{controller?.abort();reject(Error('Incremental research timed out'));},timeoutMs);})]);}finally{clearTimeout(timer);}
}
export function incrementalPresets(bundle,catalog){
 const reviewed=validateIncrementalResearch(bundle);
 return reviewed.companies.filter(r=>catalog?.companies?.some(c=>c.ticker===r.identity.ticker&&c.nativeTicker===r.identity.ticker&&c.mic===r.publicTradability.mic&&c.exchange===r.publicTradability.exchange&&isUSRobinhoodCandidate(c))).map(r=>({ticker:r.identity.ticker,presetId:r.identity.version,incrementalResearch:structuredClone(r.identity),annualCase:structuredClone(r.annualCase)}));
}
export function incrementalResearchDraft(preset){
 const r=incrementalRecord(preset?.ticker);
 if(!r||preset.presetId!==r.identity.version||JSON.stringify(preset.incrementalResearch)!==JSON.stringify(r.identity)||JSON.stringify(preset.annualCase)!==JSON.stringify(r.annualCase))throw Error('Incremental preset does not match its reviewed source.');
 const d=researchDraftFor(r.annualCase);
 d.researchSimulationConfig=simulationResearchDefaults(d);
 d.researchPreset={presetId:r.identity.version,version:r.identity.version,asOf:r.identity.informationAsOf,defaultSimulationConfig:structuredClone(d.researchSimulationConfig),rationale:{headline:r.prose.summary.en},parameterRationale:Object.fromEntries(Object.entries(r.prose).map(([k,v])=>[k,v.en])),simulationRationale:{scope:r.prose.uncertainty.en}};
 const issues=researchDraftIssues(d);if(issues.length)throw Error(issues.join(' '));
 validateResearchSimulationConfig(d.researchSimulationConfig);return d;
}
export function incrementalAlternative(previous,name){
 const r=incrementalRecord(previous?.ticker),alternative=r?.alternatives.find(x=>x.name===name);if(!alternative)throw Error('Reviewed named alternative unavailable.');
 const draft=incrementalResearchDraft({ticker:r.identity.ticker,presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
 const c=alternative.annualCase;
 draft.annual=c.annual.map(row=>({year:row.year,period:row.period,revenue:row.revenue,margin:row.operatingMargin,taxRate:row.taxRate,reinvestment:row.reinvestment,wacc:row.wacc}));
 draft.terminal={growth:c.terminal.growth,margin:c.terminal.operatingMargin,taxRate:c.terminal.taxRate,roic:c.terminal.ROIC,wacc:c.terminal.wacc};
 draft.selectedIncrementalScenario=name;draft.notes=typeof previous.notes==='string'?previous.notes:'';
 draft.researchSimulationConfig=simulationResearchDefaults(draft);draft.researchPreset.defaultSimulationConfig=structuredClone(draft.researchSimulationConfig);
 return {draft,undo:structuredClone(previous)};
}
