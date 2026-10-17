import {defaults,validateSnapshot,valueCompany,validDate} from './engine.js';
import {genericProvenance,researchCaseFor,loadResearchedBaseCase,restoreDraftProvenance,isUntouchedGenericDraft} from './base-cases.js';
import {currentClaimsEvidence} from './current-claims-gates.js';
import {operatingIssues} from './current-operating.js';
export {operatingProfileDefinition,operatingIssues,operatingAssumptions,independentGrowthProfile,FLEXIBLE_PROFILE_ID} from './current-operating.js';
import {claimsDefaults,restoreClaims,claimsIssues,valueCurrentWithClaims,currentEconomicShareBasis} from './current-claims.js';
export {claimsDefinition,claimsDefaults,claimsIssues,valueCurrentWithClaims,currentEconomicShareBasis,claimsSensitivity} from './current-claims.js';
export {researchCaseFor,loadResearchedBaseCase,markDraftEdited,fetchBaseCases} from './base-cases.js';
export {currentClaimsEvidence} from './current-claims-gates.js';
export const REQUIRED_TICKERS=['AAPL','MSFT','AMZN','GOOG','META','NVDA','TSLA','COHR','LITE','AAOI','NBIS','MU','AVGO','TSM'];
export function currentSnapshot(company,raw){
 const f=raw?.facts||{};const number=(...v)=>v.find(x=>typeof x==='number'&&Number.isFinite(x))??null;
 return {ticker:company.ticker,name:company.name,modelType:raw?.modelType||company.modelType,sector:raw?.sector||company.sector,currency:raw?.currency||company.currency||'',units:'millions',periodEnd:raw?.periodEnd||raw?.fiscalPeriodEnd,filedAt:raw?.filedAt||raw?.filingDate,availableFrom:raw?.availableFrom||raw?.acceptedAt||raw?.filedAt||raw?.filingDate,acceptedAt:raw?.acceptedAt,sourceUrl:raw?.sourceUrl||raw?.sourceURL||'',revenue:number(raw?.revenue,f.revenue),ebit:number(raw?.ebit,raw?.EBIT,f.operatingIncome,f.EBIT),cash:number(raw?.cash,f.cash),debt:number(raw?.debt,f.debt,f.totalDebt),shares:number(raw?.shares,f.shares,f.sharesOutstanding),shareBasis:raw?.shareBasis||'',coverShareDate:raw?.coverShareDate||raw?.sharesAsOf||raw?.sharesDate,snapshotMode:raw?.snapshotMode,backtestEligible:false,researchImported:company.researchImported===true||raw?.researchImported===true,raw};
}
export function draftFor(company,raw,{baseCases}={}){
 const cutoff=new Date().toISOString().slice(0,10);
 const d={schemaVersion:5,ticker:company.ticker,snapshotId:raw?.id,step:2,cutoff,assumptions:{...defaults},notes:{},reviewed:[],bridgeReviewed:false,modelReviewed:false,normalizationDelta:0,adjustmentReason:'',adjustmentSource:'',quote:{price:null,date:'',currency:'',sourceUrl:'',basisConfirmed:false,shareBasis:''},waccWorksheet:{riskFree:null,beta:null,equityPremium:null,countryPremium:null,costOfDebt:null,debtWeight:null,tax:null},updatedAt:null,assumptionProvenance:genericProvenance(company,raw,cutoff)};
 const claims=claimsDefaults(currentSnapshot(company,raw));if(claims)d.claims=claims;
 const c=researchCaseFor(baseCases,company,raw);
 return c&&c.asOf.slice(0,10)<=cutoff?loadResearchedBaseCase(d,company,raw,baseCases,{selection:'fresh'}):d;
}
export function currentIssues(snapshot,draft,{includeReview=true}={}){
 const errors=validateSnapshot(snapshot);
 if(!['annual-reference','ttm','annual','FY'].includes(snapshot.snapshotMode))errors.push('Interim/YTD flows are not a full-year baseline. Select FY or TTM; do not annualize them silently.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.cutoff)||!validDate(draft.cutoff))errors.push('Choose a valid valuation date.');
 else if(Date.parse(snapshot.availableFrom)>Date.parse(draft.cutoff+'T23:59:59.999Z'))errors.push('This filing was not available by the valuation date.');
 if(!snapshot.shareBasis)errors.push('The economic share basis is unverified.');
 const r=snapshot.raw||{};
 if(snapshot.ticker==='JPM'||/bank|insurance|financial/i.test(snapshot.sector||'')||snapshot.modelType&&snapshot.modelType!=='operating-fcff')errors.push('Financial institutions or specialist models require an equity/regulatory-capital workflow; this operating-company FCFF model is unsuitable.');
 const explicit=[...(r.hardBlockers||[]),...(r.fatalBlockers||[])];errors.push(...explicit,...claimsIssues(snapshot,draft),...operatingIssues(snapshot,draft));
 const provenance=draft.assumptionProvenance;if(provenance?.kind==='researched-base-case'&&validDate(provenance.asOf)&&validDate(draft.cutoff)&&provenance.asOf.slice(0,10)>draft.cutoff.slice(0,10))errors.push(`This researched base case includes information through ${provenance.asOf.slice(0,10)}, after the valuation date. Choose that date or later.`);
 // Never infer an ADR conversion or a reporting currency from the US ticker.
 if(snapshot.ticker==='TSM'&&!r.adrConversionVerified)errors.push('TSM: reporting currency and depositary-share conversion require a verified model-specific mapping. Per-ADR valuation is withheld.');
 if(snapshot.ticker==='NBIS'&&!r.currentBusinessPerimeterVerified)errors.push('NBIS: business-perimeter comparability, funding and loss-to-profit mechanics require a specialist model. This simplified result is withheld.');
 if(draft.normalizationDelta!==0&&(!draft.adjustmentReason?.trim()||!/^https?:\/\//.test(draft.adjustmentSource||'')))errors.push('Explain and source the EBIT adjustment, or return it to zero.');
 // Review acknowledgements are legacy draft metadata, never financial evidence.
 // Source, date, currency/security and model compatibility above remain hard constraints.
 return [...new Set(errors)];
}
export function calculateCurrent(snapshot,draft){const errors=currentIssues(snapshot,draft);if(errors.length)throw new Error(errors.join(' '));return valueCurrentWithClaims(snapshot,draft);}
export function quoteComparison(snapshot,draft,value){const q=draft.quote||{};if(!(typeof q.price==='number'&&Number.isFinite(q.price)&&q.price>0))return {status:'missing',message:'No verified current market price. Add a dated, sourced quote to compare.'};if(!validDate(q.date)||q.date>draft.cutoff||q.currency!==snapshot.currency||!/^https?:\/\//.test(q.sourceUrl||'')||!q.shareBasis||q.shareBasis!==currentEconomicShareBasis(snapshot,draft))return {status:'blocked',message:'Quote comparison withheld: verify date, matching currency, source and economic share basis.'};return {status:'ready',price:q.price,date:q.date,gap:value.perShare/q.price-1,message:'Value-to-price gap, not an expected return.'};}
export function safeDraft(value,company,raw,{baseCases}={}){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.schemaVersion!==5||value.ticker!==company.ticker||value.snapshotId!==raw?.id)return draftFor(company,raw,{baseCases});
 // Restore saved numbers over the original generic baseline first. Filling a
 // partial legacy draft with new research would silently change user work.
 const base=draftFor(company,raw),untouched=isUntouchedGenericDraft(value,company,raw);
 const d={...base,...value,assumptions:{...base.assumptions},notes:{},quote:{...base.quote}};
 for(const k of Object.keys(base.assumptions))if(typeof value.assumptions?.[k]==='number'&&Number.isFinite(value.assumptions[k]))d.assumptions[k]=value.assumptions[k];
 for(const [k,v]of Object.entries(value.notes||{}))if(typeof v==='string')d.notes[k]=v;
 // Only the versioned flexible profile can restore a newly selected maturity.
 // Keep malformed flexible inputs invalid rather than silently replacing them.
 if(value.operatingProfile?.id==='flexible-growth-v1'){d.operatingProfile=structuredClone(value.operatingProfile);for(const k of Object.keys(base.assumptions))d.assumptions[k]=Object.prototype.hasOwnProperty.call(value.assumptions||{},k)?value.assumptions[k]:null;if(Object.prototype.hasOwnProperty.call(value.assumptions||{},'yearlyOverrides'))d.assumptions.yearlyOverrides=structuredClone(value.assumptions.yearlyOverrides);}
 else d.assumptions.years=10;d.reviewed=Array.isArray(value.reviewed)?value.reviewed.filter(v=>Number.isInteger(v)&&v>=0&&v<8):[];d.step=Number.isInteger(value.step)?Math.max(0,Math.min(7,value.step)):2;d.bridgeReviewed=value.bridgeReviewed===true;d.modelReviewed=value.modelReviewed===true;d.normalizationDelta=value.operatingProfile?.id==='flexible-growth-v1'?(Object.prototype.hasOwnProperty.call(value,'normalizationDelta')?value.normalizationDelta:null):typeof value.normalizationDelta==='number'&&Number.isFinite(value.normalizationDelta)?value.normalizationDelta:0;
 for(const k of ['cutoff','adjustmentReason','adjustmentSource'])if(typeof d[k]!=='string')d[k]=base[k];
 if(value.quote&&typeof value.quote==='object'){const q=value.quote;d.quote.price=typeof q.price==='number'&&Number.isFinite(q.price)?q.price:null;for(const k of ['date','currency','sourceUrl','shareBasis'])d.quote[k]=typeof q[k]==='string'?q[k]:'';d.quote.basisConfirmed=q.basisConfirmed===true;}
 d.waccWorksheet={...base.waccWorksheet};for(const k of Object.keys(base.waccWorksheet))if(typeof value.waccWorksheet?.[k]==='number'&&Number.isFinite(value.waccWorksheet[k]))d.waccWorksheet[k]=value.waccWorksheet[k];
 const restoredClaims=restoreClaims(value.claims,currentSnapshot(company,raw));if(restoredClaims!==null||Object.prototype.hasOwnProperty.call(value,'claims'))d.claims=restoredClaims;
 d.assumptionProvenance=restoreDraftProvenance(value,d,company,raw);
 const c=untouched?researchCaseFor(baseCases,company,raw):null;
 return c&&validDate(d.cutoff)&&c.asOf.slice(0,10)<=d.cutoff.slice(0,10)?loadResearchedBaseCase(d,company,raw,baseCases,{selection:'untouched-upgrade'}):d;
}
export function freezeCurrent(snapshot,draft){const result=calculateCurrent(snapshot,draft);return JSON.parse(JSON.stringify({schemaVersion:5,id:globalThis.crypto?.randomUUID?.()||String(Date.now()),createdAt:new Date().toISOString(),mode:'current-research',classification:'Conditional educational valuation; sourced dated financials and user assumptions. Not investment advice or a live quote.',snapshot,draft,result,quoteComparison:quoteComparison(snapshot,draft,result)}));}
export function waccWorksheet({riskFree,beta,equityPremium,countryPremium,costOfDebt,debtWeight,tax}){const xs=[riskFree,beta,equityPremium,countryPremium,costOfDebt,debtWeight,tax];if(!xs.every(x=>typeof x==='number'&&Number.isFinite(x)))throw Error('Complete all seven worksheet inputs.');if(beta<0||riskFree<0||equityPremium<0||countryPremium<0||costOfDebt<0||debtWeight<0||debtWeight>1||tax<0||tax>.6)throw Error('Use nonnegative rates/beta, debt weight 0–100%, and tax 0–60%.');const costOfEquity=riskFree+beta*equityPremium+countryPremium;return {costOfEquity,afterTaxCostOfDebt:costOfDebt*(1-tax),wacc:costOfEquity*(1-debtWeight)+costOfDebt*(1-tax)*debtWeight};}
