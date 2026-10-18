import {jointDefaults} from './joint-simulation-config.js';
// Application sampling policy, dated 2026-10-18. The UI redesign requested
// 5,000 fresh attempts. Frozen research files and saved counts remain intact.
export const DEFAULT_SIMULATION_TRIALS=5000;
export const SIMULATION_COUNT_POLICY_VERSION='2026-10-18-fresh-trials-v1';
export const SIMULATION_COUNT_POLICY_NOTE='Application policy dated 2026-10-18: fresh settings and explicit resets use 5,000 attempted scenarios. Saved counts stay unchanged until reset or Use research. This is a numerical sampling choice, not greater forecast confidence; dated research files retain their original counts.';
export function applyFreshSimulationCountPolicy(draft){
 const preset=draft.researchPreset;
 const sourceTrials=draft.researchSimulationConfig.trials;
 draft.researchSimulationConfig=jointDefaults({...draft.researchSimulationConfig,trials:DEFAULT_SIMULATION_TRIALS},{horizon:draft.annual.length,capital:'investmentFactor'});
 if(preset){
  preset.samplingCountPolicy={version:SIMULATION_COUNT_POLICY_VERSION,upstreamCommit:'714e7c360fcade0af9dc9aa48c6ebaec862ff5f6',sourceTrials,applicationTrials:DEFAULT_SIMULATION_TRIALS,originalTrialRationale:preset.simulationRationale?.trials??null};
  preset.simulationRationale={...preset.simulationRationale,trials:SIMULATION_COUNT_POLICY_NOTE};
  preset.defaultSimulationConfig=structuredClone(draft.researchSimulationConfig);
 }
 return draft;
}
