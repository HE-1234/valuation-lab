import {fixedCapitalFunding,fixedCapitalFundingIssues} from './fixed-capital-funding.js';
import {incrementalRecord} from './incremental-registry.js';
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export const incrementalCaseVersion=c=>c?.incrementalResearch?.version;
export function incrementalIdentityValid(d){
 const r=incrementalRecord(d?.ticker),id=r?.identity,c=r?.annualCase;
 if(!id||!object(d.incrementalResearch)||Object.keys(d.incrementalResearch).length!==Object.keys(id).length||!Object.entries(id).every(([k,v])=>d.incrementalResearch[k]===v))return false;
 if(d.version!==id.version||d.caseId!==`${id.version}:${id.ticker}:base`||d.sourceScenario!=='base'||d.currency!==id.currency||d.informationAsOf!==id.informationAsOf||d.discountOrigin!==id.discountOrigin||JSON.stringify(d.anchor)!==JSON.stringify(c.anchor))return false;
 if(JSON.stringify(d.fixedCapitalFunding)!==JSON.stringify(fixedCapitalFunding(d)))return false;
 if(['currentCapitalScenario','currentCapitalProvenance','terminalGrowthReview','selectedResearchScenario'].some(k=>d[k]!==undefined))return false;
 if(d.selectedIncrementalScenario!==undefined&&!r.alternatives.some(x=>x.name===d.selectedIncrementalScenario))return false;
 return true;
}
export function incrementalDraftIssues(d){
 if(!d?.incrementalResearch&&!incrementalRecord(d?.ticker))return [];
 const errors=fixedCapitalFundingIssues(d);
 if(!incrementalIdentityValid(d))errors.push('Incremental research source, audit, dates and security identity must match the reviewed company package.');
 if(!object(d.bridgeInputs))errors.push('Incremental claim assumptions must remain an object; missing amounts are not zero.');
 else if(Object.keys(d.bridgeInputs).some(k=>!incrementalRecord(d.ticker)?.bridge.options.some(x=>x.key===k)))errors.push('Unsupported incremental claim assumption; retain the saved draft for recovery.');
 return errors;
}
export function researchStorageKey(c,undo=false){return c?.incrementalResearch?`valuation-lab-incremental-research:${c.incrementalResearch.version}:${undo?'preset-undo:':''}${c.ticker}`:`valuation-lab-annual-research-v1:${undo?'preset-undo:':''}${c.ticker}`;}
