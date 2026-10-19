import {incrementalRegistry,incrementalRecord,incrementalPackages} from './incremental-registry.js';
import {researchDraftFor,researchDraftIssues} from './research-model.js';
import {simulationResearchDefaults,validateResearchSimulationConfig} from './research-simulation.js';
import {isUSRobinhoodCandidate} from './company-catalog.js';
export const INCREMENTAL_RESEARCH_PATH='./data/incremental-research-2026-10-18/cases.json';
export const INCREMENTAL_RESEARCH_PATHS=Object.freeze([INCREMENTAL_RESEARCH_PATH,'./data/incremental-AMAT-2026-10-18-v3/cases.json','./data/incremental-LRCX-2026-10-18-v2/cases.json','./data/incremental-ASML-2026-10-18-v4/cases.json','./data/incremental-FN-2026-10-18-v1/cases.json','./data/incremental-CDNS-2026-10-18-v3/cases.json','./data/incremental-SNPS-2026-10-18-v3/cases.json','./data/incremental-NVMI-2026-10-18-v2/cases.json','./data/incremental-ONTO-2026-10-18-v2/cases.json','./data/incremental-CAMT-2026-10-18-v1/cases.json','./data/incremental-MRVL-2026-10-18-v3/cases.json','./data/incremental-AMD-2026-10-18-v3/cases.json','./data/incremental-CRDO-2026-10-18-v3/cases.json','./data/incremental-SNDK-2026-10-19-v3/cases.json','./data/incremental-ARM-2026-10-19-v2/cases.json','./data/incremental-KEYS-2026-10-19-v1/cases.json','./data/incremental-CEVA-2026-10-19-v3/reviewed-package.json','./data/incremental-RMBS-2026-10-19-v3/cases.json','./data/incremental-UMC-2026-10-19-v1/cases.json','./data/incremental-MCD-2026-10-19-v2/cases.json']);
export function validateIncrementalResearch(bundle){
 // The separately audited payload must match the shipped immutable registry.
 // Imported edits belong in drafts; they cannot rewrite source or audit identity.
 if(!incrementalPackages.some(expected=>JSON.stringify(bundle)===JSON.stringify(expected)))throw Error('Incremental research package does not match the independently reviewed source and audit registry.');
 return structuredClone(bundle);
}
export async function fetchIncrementalResearch(fetcher=globalThis.fetch,{timeoutMs=3000,path=INCREMENTAL_RESEARCH_PATH}={}){
 const controller=typeof AbortController==='function'?new AbortController():null;let timer;
 const request=(async()=>{const response=await fetcher(path,controller?{signal:controller.signal}:undefined);if(!response?.ok)throw Error('Incremental research unavailable');return validateIncrementalResearch(await response.json());})();
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
 if(c.annualFundingPolicy)draft.annualFundingPolicy=structuredClone(c.annualFundingPolicy);
 if(c.openingStub){draft.openingStub=structuredClone(c.openingStub);draft.anchor=structuredClone(c.anchor);}
 draft.annual=c.annual.map(row=>({year:row.year,period:row.period,revenue:row.revenue,margin:row.operatingMargin,taxRate:row.taxRate,reinvestment:row.reinvestment,wacc:row.wacc}));
 draft.terminal={growth:c.terminal.growth,margin:c.terminal.operatingMargin,taxRate:c.terminal.taxRate,roic:c.terminal.ROIC,wacc:c.terminal.wacc};
 if(c.bridgeOptions)draft.bridgeInputs=structuredClone(c.bridgeOptions);
 if(previous.ticker==='UMC'){draft.umcPolicy=structuredClone(previous.umcPolicy);draft.umcDaNonlease=structuredClone(c.umcDaNonlease);if(draft.umcPolicy!==null&&Array.isArray(draft.umcPolicy?.supplemental_operating_cash_by_year))draft.annual.forEach((row,i)=>{const cost=draft.umcPolicy.supplemental_operating_cash_by_year[i];if(typeof cost==='number'&&Number.isFinite(cost))row.reinvestment+=cost;});}
 if(previous.ticker==='MCD')draft.mcdPolicy=structuredClone(previous.mcdPolicy);
 if(previous.ticker==='RMBS')draft.rmbsAwardPolicy=structuredClone(previous.rmbsAwardPolicy);
 draft.selectedIncrementalScenario=name;if(c.fixedCapitalFunding)draft.fixedCapitalFunding=structuredClone(c.fixedCapitalFunding);draft.notes=typeof previous.notes==='string'?previous.notes:'';
 draft.researchSimulationConfig=simulationResearchDefaults(draft);draft.researchPreset.defaultSimulationConfig=structuredClone(draft.researchSimulationConfig);
 return {draft,undo:structuredClone(previous)};
}
