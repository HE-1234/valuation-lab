import review from './terminal-growth-review-data.js';
// Review metadata records provenance, not a restriction on subsequent user edits.
export function terminalReviewIdentityValid(draft){
 if(draft.selectedResearchScenario!==undefined){const r=draft.selectedResearchScenario;if(draft.ticker!=='GOOG'||!r||r.version!=='2026-10-18-user-selected-goog-case-v1'||r.classification!=='Selected Google case'||r.source!=='dist/data/goog-selected-case-2026-10-18-v1.json'||r.selectedAsOf!=='2026-10-18'||Object.keys(r).length!==4)return false;}
 if(draft.terminalGrowthReview===undefined)return draft.selectedResearchScenario===undefined;
 const r=draft.terminalGrowthReview,row=review.recommendations.find(x=>x.ticker===draft.ticker);
 if(!r||!row)return false;
 const expected={version:review.version,asOf:review.asOf,ticker:row.ticker,currency:row.currency,nominal:true,sourcePreset:review.sourcePreset,sourceSHA256:review.sourceSHA256,sourcePresetId:`2026-10-17-studio-presets-v1:${row.ticker}`,originalGrowth:row.currentTerminalGrowth,reviewedGrowth:row.recommendedTerminalGrowth};
 return Object.keys(r).length===Object.keys(expected).length&&Object.entries(expected).every(([key,value])=>r[key]===value)&&draft.currency===row.currency&&draft.researchPreset?.presetId===r.sourcePresetId;
}
