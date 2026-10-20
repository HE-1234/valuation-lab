import {registerCatalog,localizedText} from './i18n.js';
// Additive source correction. The October 17 raw research and saved drafts stay
// immutable; only a fresh active default or explicit research load opts in.
export const TSM_RECEIPT_REVIEW=Object.freeze({
 version:'2026-10-20-tsm-fy2025-receipts-v1',reviewedAt:'2026-10-20',
 referenceDate:'2025-12-31',amount:189858.2,currency:'TWD',unit:'millions',
 sourceUrl:'https://www.sec.gov/Archives/edgar/data/1046179/000162828026025362/tsm-20251231.htm',
 sourceLocation:'Note 22(c), printed F-58; December 31, 2025 column',
 priorAmount:291101.8,priorActualDate:'2024-12-31'
});
export function applyTsmReceiptCorrection(draft){
 if(draft?.ticker!=='TSM')return draft;
 const sourceCase=draft.profileId==='annual-research-v1'&&draft.version==='2026-10-17-reviewed-v1'&&draft.caseId==='2026-10-17-reviewed-v1:TSM:selected_research_base';
 const presetMatches=!draft.researchPreset||draft.researchPreset.presetId==='2026-10-17-studio-presets-v1:TSM';
 if(draft.currency!=='TWD'||!sourceCase||!presetMatches)throw Error('TSM source correction requires the matching frozen research case.');
 const next=structuredClone(draft);next.bridgeInputs.customerReceiptClaim=TSM_RECEIPT_REVIEW.amount;
 next.tsmReceiptReview=structuredClone(TSM_RECEIPT_REVIEW);return next;
}
export function correctedTsmDefinition(definition,draft){
 if(definition?.ticker!=='TSM'||!draft?.tsmReceiptReview)return definition;
 if(JSON.stringify(draft.tsmReceiptReview)!==JSON.stringify(TSM_RECEIPT_REVIEW))throw Error('TSM customer-receipt source review has an incompatible identity.');
 const next=structuredClone(definition);
 for(const list of [next.options,next.optionDefinitions])for(const f of list||[])if(f.key==='customerReceiptClaim')Object.assign(f,{default:TSM_RECEIPT_REVIEW.amount,label:'FY2025 customer-receipt carry-forward sensitivity',sourceReferenceDate:TSM_RECEIPT_REVIEW.referenceDate,sourceUrl:TSM_RECEIPT_REVIEW.sourceUrl,sourceLocation:TSM_RECEIPT_REVIEW.sourceLocation});
 next.unresolved=next.unresolved.map(x=>x.replace('291,101.8','189,858.2'));
 next.notes.push('Source correction reviewed October 20, 2026: FY2025 customer receipts are TWD 189,858.2 million. The former 291,101.8 belongs to FY2024. The FY2025 amount remains a carry-forward assumption, not a September actual.');
 return next;
}

registerCatalog('tsmReceiptCorrection',{en:{notice:'Source correction · October 20, 2026: FY2025 customer receipts are TWD 189,858.2 million; 291,101.8 belongs to FY2024. This remains a carry-forward assumption, not a September actual.',saved:'Your saved amount is retained; explicitly loading the research case applies the corrected default.'},'zh-Hans':{notice:'2026 年 10 月 20 日来源更正：2025 年客户收款为 189,858.2 百万新台币；291,101.8 属于 2024 年。此值仍为结转假设，并非九月实绩。',saved:'保留您已保存的金额；明确载入研究情景才会更新。'}});
export function tsmReceiptCorrectionHTML(draft){return draft?.ticker==='TSM'?`<p class="micro" data-tsm-receipt-review>${localizedText('tsmReceiptCorrection.notice')} ${draft.tsmReceiptReview?'':localizedText('tsmReceiptCorrection.saved')} <a href="${TSM_RECEIPT_REVIEW.sourceUrl}" target="_blank" rel="noopener">${TSM_RECEIPT_REVIEW.sourceLocation}</a></p>`:'';}
