import {jointDefaults} from './joint-simulation-config.js';
import {incrementalResearchDraft} from './incremental-research.js';
import selectedGOOG,{selectedGrowthPercentages} from './goog-selected-scenario-data.js';
import {annualPathDefaults} from './annual-path-sampling.js';
import review from './terminal-growth-review-data.js';
import {studioResearchDraft,studioPresetFor,researchPresetStatus} from './studio-research-presets.js';
import {annualTerminalDefaults} from './simulation.js';
import {researchDraftIssues} from './research-model.js';
export const TERMINAL_REVIEW_PATH='./data/terminal-growth-review-2026-10-18-v1.json';
export const terminalReviewFor=ticker=>review.recommendations.find(row=>row.ticker===ticker);
export function terminalReviewedResearchDraft(preset,bundle){
 const draft=studioResearchDraft(preset,bundle),row=terminalReviewFor(draft.ticker);
 if(!row||bundle.version!=='2026-10-17-studio-presets-v1'||preset.presetId!==`${bundle.version}:${draft.ticker}`||row.currency!==draft.currency||!row.nominal||draft.terminal.growth!==row.currentTerminalGrowth)throw Error('The terminal review does not match this frozen research source.');
 draft.terminal.growth=row.recommendedTerminalGrowth;
 if(!(draft.terminal.growth<row.resolvedRiskFreeReference.rate))throw Error('The terminal review exceeds its currency-consistent rate reference.');
 draft.terminalGrowthReview={version:review.version,asOf:review.asOf,ticker:row.ticker,currency:row.currency,nominal:true,sourcePreset:review.sourcePreset,sourceSHA256:review.sourceSHA256,sourcePresetId:preset.presetId,originalGrowth:row.currentTerminalGrowth,reviewedGrowth:row.recommendedTerminalGrowth};
 draft.researchPreset.originalTerminalGrowthRationale=draft.researchPreset.parameterRationale.terminalGrowth;
 draft.researchPreset.parameterRationale.terminalGrowth=row.reason;
 draft.researchPreset.parameterRationale.terminalReview=review.classification;
 if(row.recommendedTerminalGrowth!==row.currentTerminalGrowth)draft.researchPreset.parameterRationale.terminalTransition=row.transition;
 // Existing research distributions remain; terminal fields are fixed at this
 // reviewed deterministic baseline until the user explicitly selects uncertainty.
 draft.researchSimulationConfig.annualTerminal=annualTerminalDefaults(draft.terminal);
 draft.researchSimulationConfig=jointDefaults(draft.researchSimulationConfig,{horizon:draft.annual.length,capital:'investmentFactor'});
 draft.researchPreset.defaultSimulationConfig=structuredClone(draft.researchSimulationConfig);
 draft.researchPreset.originalSimulationRationale=structuredClone(draft.researchPreset.simulationRationale);
 for(const key of ['sampling','constraints','terminal','fixedInputs'])draft.researchPreset.simulationRationale[key]=review.classification;
 const issues=researchDraftIssues(draft);if(issues.length)throw Error(issues.join(' '));
 return draft;
}
export function currentResearchDraft(preset,bundle){
 if(preset?.incrementalResearch)return incrementalResearchDraft(preset);
 const reviewed=terminalReviewedResearchDraft(preset,bundle);
 if(preset.ticker!=='GOOG')return reviewed;
 const draft=structuredClone(selectedGOOG.draft);
 draft.terminal.growth=reviewed.terminal.growth;
 draft.terminalGrowthReview=reviewed.terminalGrowthReview;
 draft.selectedResearchScenario={version:selectedGOOG.version,classification:'Selected Google case',source:'dist/data/goog-selected-case-2026-10-18-v1.json',selectedAsOf:'2026-10-18'};
 draft.notes='Selected Google case: 20-year growth duration, 35% mature operating margin, 10% WACC, 3% terminal growth and 16% terminal ROIC. June 30 forecast-origin and capital values; funded annual investment and existing claim limitations are retained. Selected assumptions are scenario judgments; reported source facts remain separately identified.';
 draft.researchPreset=reviewed.researchPreset;
 draft.researchPreset.originalRationale=structuredClone(draft.researchPreset.rationale);
 draft.researchPreset.rationale={headline:'Selected Google case',revenueGrowthHorizonYears:20,growthDuration:`Selected operating scenario: first-three-year revenue growth is ${selectedGrowthPercentages[0]}%, ${selectedGrowthPercentages[1]}% and ${selectedGrowthPercentages[2]}%, then fades to 2.5% by year 20. Mature operating margin reaches 35% by year 5; WACC is 10%. These are user-selected scenario judgments, not company guidance.`,capital:'Exact audited annual investment retains source-calendar floors and funded expansion. Only terminal growth changes from 2.5% to 3%; terminal reinvestment is recomputed using 16% ROIC.',sourceUrls:draft.researchPreset.originalRationale.sourceUrls};
 draft.researchPreset.originalParameterRationale=structuredClone(draft.researchPreset.parameterRationale);
 draft.researchPreset.parameterRationale={growth:draft.researchPreset.rationale.growthDuration,reinvestment:draft.researchPreset.rationale.capital,terminalGrowth:reviewed.researchPreset.parameterRationale.terminalGrowth,terminalTransition:reviewed.researchPreset.parameterRationale.terminalTransition,terminalReview:reviewed.researchPreset.parameterRationale.terminalReview};
 draft.researchSimulationConfig=structuredClone(reviewed.researchSimulationConfig);
 draft.researchSimulationConfig.capitalPolicy=draft.capitalPolicy;
 draft.researchSimulationConfig.annualPath=annualPathDefaults(20);
 draft.researchSimulationConfig=jointDefaults(draft.researchSimulationConfig,{horizon:draft.annual.length,capital:'investmentFactor'});
 draft.researchPreset.defaultSimulationConfig=structuredClone(draft.researchSimulationConfig);
 const issues=researchDraftIssues(draft);if(issues.length)throw Error(issues.join(' '));
 return draft;
}
export function loadCurrentResearchPreset(previous,preset,bundle){
 const draft=currentResearchDraft(preset,bundle);
 if(previous&&typeof previous.notes==='string')draft.notes=previous.notes;
 return {draft,undo:structuredClone(previous)};
}
export function currentResearchPresetStatus(draft,bundle){
 if(draft?.incrementalResearch){const p=studioPresetFor(bundle,draft.ticker);if(!p)return 'Research preset unavailable';const baseline=incrementalResearchDraft(p);return ['annual','terminal','timing','bridgeInputs','researchSimulationConfig','derivedForecast','marginPath','selectedIncrementalScenario'].some(k=>JSON.stringify(draft[k])!==JSON.stringify(baseline[k]))?'Your changes · based on the complete research preset':'Complete research preset · annual model';}
 if(!draft?.terminalGrowthReview){const status=researchPresetStatus(draft,bundle);return status==='Complete research preset · annual model'?'Saved preset version retained · newer research available':status;}
 const preset=studioPresetFor(bundle,draft?.ticker);if(!preset)return 'Research preset unavailable';
 const baseline=currentResearchDraft(preset,bundle);
 const fields=['annual','terminal','timing','bridgeInputs','bridgeReviewVersion','researchSimulationConfig','forecastHorizonYears','capitalPolicy','currentCapitalScenario','currentCapitalProvenance','terminalGrowthReview','derivedForecast','selectedResearchScenario'];
 return fields.some(key=>JSON.stringify(draft[key])!==JSON.stringify(baseline[key]))?'Your changes · based on the complete research preset':'Complete research preset · annual model';
}
