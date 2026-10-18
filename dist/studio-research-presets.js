import {getCurrentCapitalPreset} from './current-capital-presets.js';
// Research presets are a versioned overlay. Frozen source cases and both engines
// remain unchanged; a full preset is applied only to a fresh or explicitly loaded draft.
import {researchDraftFor,restoreResearchDraft,researchDraftIssues} from './research-model.js';
import {validateResearchSimulationConfig} from './research-simulation.js';

export const STUDIO_PRESETS_PATH='./data/studio-research-presets-2026-10-17-v1.json';
export const STUDIO_PRESETS_VERSION='2026-10-17-studio-presets-v1';
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
// The public evidence pack rewrites only this local provenance link. Source URL,
// source field, period and every factual anchor value must still match exactly.
const comparableAnchor=anchor=>{const copy=structuredClone(anchor);if(copy.provenance)delete copy.provenance.file;return copy;};

export function validateStudioPresets(bundle,library){
 if(!object(bundle)||bundle.schemaVersion!==1||bundle.version!==STUDIO_PRESETS_VERSION||bundle.asOf!=='2026-10-17'||!Array.isArray(bundle.presets)||bundle.presets.length!==14)throw Error('The complete versioned Studio research presets are unavailable.');
 const seen=new Set();
 for(const preset of bundle.presets){
  const c=library.companies.find(c=>c.ticker===preset.ticker);
  if(!c||seen.has(preset.ticker)||preset.mode!=='annual-backed'||typeof preset.presetId!=='string'||!object(preset.bridgeInputs)||!object(preset.rationale))throw Error('The Studio research preset identity or rationale is incomplete.');
  seen.add(preset.ticker);
  const d=researchDraftFor(preset.annualCase),source=researchDraftFor(c),restored=restoreResearchDraft(d,c);
  if(preset.annualCase.ticker!==preset.ticker||preset.asOf!==bundle.asOf||preset.presetId!==`${bundle.version}:${preset.ticker}`||restored.error||researchDraftIssues(d).length)throw Error(`${preset.ticker}: the research preset does not match its complete dated annual source.`);
  const sourceFields=['schemaVersion','profileId','version','caseId','sourceScenario','forecastHorizonYears','ticker','currency','informationAsOf','discountOrigin','annual','terminal','timing'];
  if(JSON.stringify(comparableAnchor(d.anchor))!==JSON.stringify(comparableAnchor(source.anchor))||sourceFields.some(field=>JSON.stringify(d[field])!==JSON.stringify(source[field])))throw Error(`${preset.ticker}: a preset cannot silently revise source identity, anchor, horizon, timing, or the frozen research path.`);
  validateResearchSimulationConfig(preset.simulationConfig);
  if(preset.timingDefaults){const timed={...d,timing:structuredClone(preset.timingDefaults)};if(JSON.stringify(timed.timing)!==JSON.stringify(source.timing)||researchDraftIssues(timed).length)throw Error(`${preset.ticker}: incomplete preset timing policy.`);}
 }
 return structuredClone(bundle);
}

export async function fetchStudioPresets(fetcher,library){
 const response=await fetcher(STUDIO_PRESETS_PATH);
 if(!response?.ok)throw Error('Studio research presets could not be loaded. Your saved draft is unchanged.');
 return validateStudioPresets(await response.json(),library);
}

export function studioPresetFor(bundle,ticker){return bundle?.presets?.find(p=>p.ticker===ticker)||null;}

export function studioResearchDraft(preset,bundle){
 if(!preset||!bundle)throw Error('A complete Studio research preset is required.');
 const draft=researchDraftFor(preset.annualCase);
 draft.bridgeInputs=structuredClone(preset.bridgeInputs);
 if(preset.timingDefaults)draft.timing=structuredClone(preset.timingDefaults);
 if(preset.bridgeReviewVersion)draft.bridgeReviewVersion=preset.bridgeReviewVersion;
 const capital=getCurrentCapitalPreset(preset.ticker);
 if(capital){draft.currentCapitalScenario=structuredClone(capital.scenario);draft.currentCapitalProvenance=structuredClone(capital.provenance);draft.timing=structuredClone(capital.timing);}
 draft.researchSimulationConfig=validateResearchSimulationConfig(preset.simulationConfig);
 draft.researchPreset={version:bundle.version,presetId:preset.presetId,asOf:bundle.asOf,classification:bundle.classification,
  rationale:structuredClone(preset.rationale),parameterRationale:structuredClone(preset.parameterRationale||{}),simulationRationale:structuredClone(preset.simulationRationale||{}),
  methodologySources:structuredClone(bundle.methodology?.damodaranSources||[]),sourceRecords:structuredClone(preset.sourceRecords||[]),timelineSummary:structuredClone(preset.timelineSummary||{}),
  guidedCompatibility:structuredClone(preset.guidedCompatibility||{}),defaultSimulationConfig:structuredClone(draft.researchSimulationConfig)};
 return draft;
}

export function loadStudioResearchPreset(previous,preset,bundle){
 const draft=studioResearchDraft(preset,bundle);
 // Notes are not valuation inputs. Every economic, timing and simulation setting
 // comes from one preset; the complete previous object is the Undo value.
 if(object(previous)&&typeof previous.notes==='string')draft.notes=previous.notes;
 return {draft,undo:structuredClone(previous)};
}

export function researchPresetStatus(draft,bundle){
 const preset=studioPresetFor(bundle,draft?.ticker);
 if(!preset)return 'Research preset unavailable';
 if(!draft?.researchPreset)return 'Saved annual inputs retained · complete research preset available';
 if(draft.researchPreset.version!==bundle.version||draft.researchPreset.presetId!==preset.presetId)return 'Saved preset version retained · newer research available';
 const baseline=studioResearchDraft(preset,bundle);
 const fields=['annual','terminal','timing','bridgeInputs','bridgeReviewVersion','researchSimulationConfig','forecastHorizonYears','capitalPolicy','currentCapitalScenario','currentCapitalProvenance'];
 const changed=fields.some(field=>JSON.stringify(draft[field])!==JSON.stringify(baseline[field]));
 return changed?'Your changes · based on the complete research preset':'Complete research preset · annual model';
}
