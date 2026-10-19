import {calculateSndkOperating} from './sndk-research-model.js';
import {calculateCrdoOperating} from './crdo-research-model.js';
import {ontoAnnualFunding,ontoTerminalFunding} from './onto-funding.js';
import {camtAnnualFunding,camtTerminalFunding} from './camt-funding.js';
import {calculateMrvlOperating,mrvlOpeningStubIssues,MRVL_MESSAGES} from './mrvl-operating.js';
import {calculateAmdOperating,amdOperatingIssues} from './amd-operating.js';
import {nvmiAnnualFunding,nvmiTerminalFunding} from './nvmi-funding.js';
import {calculateSnpsOperating,snpsOpeningStubIssues} from './snps-opening-stub.js';
import {calculateCdnsOperating,cdnsOpeningStubIssues} from './cdns-opening-stub.js';
import {operatingCashChange} from './fn-operating-cash.js';
import {fixedCapitalSettlement,operatingInvestment,fixedCapitalFundingIssues} from './fixed-capital-funding.js';
import {incrementalRecord} from './incremental-registry.js';
import {incrementalCaseVersion,incrementalDraftIssues} from './incremental-research-identity.js';
import {terminalReviewIdentityValid} from './terminal-growth-review-identity.js';
// Versioned annual research model. The historical and scalar engines are unchanged.
import {researchBridgeDefinition} from './research-claims.js';
import {annualHorizonIssues} from './annual-growth-horizon.js';
import {annualMarginPathIssues} from './annual-margin-path.js';
import {RESEARCH_PROFILE_ID,RESEARCH_VERSION} from './annual-research-identity.js';
export {RESEARCH_PROFILE_ID,RESEARCH_VERSION} from './annual-research-identity.js';
export const RESEARCH_PATH='./data/renewed-research-2026-10-17/cases.json';
export const RESEARCH_STORAGE_PREFIX='valuation-lab-annual-research-v1:';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const copy=x=>structuredClone(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const days=(a,b)=>(Date.parse(a)-Date.parse(b))/86400000;
const terminalFields=['growth','margin','taxRate','roic','wacc'];
const rowFields=['revenue','margin','taxRate','reinvestment','wacc'];

export function researchCaseId(c){return `${incrementalCaseVersion(c)||RESEARCH_VERSION}:${c.ticker}:${c.scenario}`;}
export function researchDraftFor(c){
 if(!object(c)||!Array.isArray(c.annual)||!c.annual.length)throw Error('A complete dated annual research case is required.');
 const lite=c.ticker==='LITE'?researchBridgeDefinition('LITE'):null,incremental=incrementalRecord(c.ticker),id=c.incrementalResearch;
 if(incremental&&JSON.stringify(c)!==JSON.stringify(incremental.annualCase))throw Error('Load the reviewed incremental source case before editing its draft.');
 return {schemaVersion:1,profileId:RESEARCH_PROFILE_ID,version:incrementalCaseVersion(c)||RESEARCH_VERSION,...(id?{incrementalResearch:copy(id)}:{}),...(c.fixedCapitalFunding?{fixedCapitalFunding:copy(c.fixedCapitalFunding)}:{}),...(c.operatingCashFunding?{operatingCashFunding:copy(c.operatingCashFunding)}:{}),...(c.openingStub?{openingStub:copy(c.openingStub)}:{}),...(c.annualFundingPolicy?{annualFundingPolicy:copy(c.annualFundingPolicy)}:{}),caseId:researchCaseId(c),sourceScenario:c.scenario,forecastHorizonYears:c.forecastHorizonYears,ticker:c.ticker,currency:c.currency,informationAsOf:id?.informationAsOf||'2026-10-17',discountOrigin:c.valuationTiming.discountOrigin,anchor:copy(c.anchor),annual:c.annual.map(r=>({year:r.year,period:r.period,revenue:r.revenue,margin:r.operatingMargin,taxRate:r.taxRate,reinvestment:r.reinvestment,wacc:r.wacc})),terminal:{growth:c.terminal.growth,margin:c.terminal.operatingMargin,taxRate:c.terminal.taxRate,roic:c.terminal.ROIC,wacc:c.terminal.wacc},timing:{mode:'origin',asOf:id?.informationAsOf||'2026-10-17',stubFCFF:null,stubDiscountRate:c.annual[0].wacc,reason:''},bridgeInputs:incremental?Object.fromEntries(incremental.bridge.options.map(x=>[x.key,x.default])):lite?Object.fromEntries(lite.options.map(x=>[x.key,x.default])):{},...(lite?{bridgeReviewVersion:lite.bridgeVersion}:{}),notes:'',userEdited:false,capitalPolicy:'original-research',updatedAt:null};
}
export function researchDraftIssues(d,{includeTiming=true}={}){
 const errors=[];
 if(!object(d)||![1,2].includes(d.schemaVersion)||d.profileId!==RESEARCH_PROFILE_ID)return ['Unsupported annual-research draft.'];
 if(d.schemaVersion===2)errors.push(...annualHorizonIssues(d));
 errors.push(...annualMarginPathIssues(d));
 if(d.schemaVersion===1&&d.derivedForecast!==undefined)errors.push('Derived horizon metadata requires a version-2 annual draft.');
 errors.push(...amdOperatingIssues(d),...incrementalDraftIssues(d),...(d.ticker==='MRVL'?mrvlOpeningStubIssues(d):d.ticker==='SNPS'?snpsOpeningStubIssues(d):cdnsOpeningStubIssues(d)));
 if(!d.incrementalResearch&&(d.version!==RESEARCH_VERSION||typeof d.sourceScenario!=='string'||d.caseId!==`${RESEARCH_VERSION}:${d.ticker}:${d.sourceScenario}`))errors.push('Annual research version and source-case identity must match the reviewed profile.');
 if(!/^[A-Z0-9.-]{1,12}$/.test(d.ticker||'')||!(['USD','TWD'].includes(d.currency)||(d.currency==='EUR'&&incrementalRecord(d.ticker)?.identity.currency==='EUR')))errors.push('A supported ticker and explicit nominal currency are required.');
 if(!date(d.informationAsOf)||!date(d.discountOrigin)||!object(d.anchor)||!finite(d.anchor.revenue)||d.anchor.revenue<=0)errors.push('Valid information date, forecast origin and positive source revenue are required.');
 if(!Array.isArray(d.annual)||d.annual.length<1||d.annual.length>30)errors.push('Supply a complete annual schedule of 1–30 years.');
 else d.annual.forEach((r,i)=>{
  if(!object(r)||r.year!==i+1||!rowFields.every(k=>finite(r[k]))){errors.push(`Year ${i+1}: every operating input must be finite; missing amounts are not zero.`);return;}
  if(r.revenue<=0||r.margin<-.5||r.margin>1||r.taxRate<0||r.taxRate>.6||r.wacc<=0||r.wacc>1)errors.push(`Year ${i+1}: revenue must be positive, margin −50% to 100%, tax 0–60%, WACC above 0% and at most 100%.`);
  // Reinvestment can be negative only when the analyst explicitly models a release.
  // Revenue contraction never creates a release automatically.
 });
 if(!Number.isInteger(d.forecastHorizonYears)||!Array.isArray(d.annual)||d.annual.length!==d.forecastHorizonYears)errors.push('The complete forecast horizon must be preserved; annual rows cannot be truncated or appended silently.');
 if(d.ticker==='LITE'&&d.bridgeInputs!==undefined&&!object(d.bridgeInputs))errors.push('Saved LITE bridge inputs must be an object; malformed claim settings are retained for recovery.');
 if(d.ticker==='LITE'&&d.bridgeReviewVersion!==undefined&&!['legacy-preserved-v1','2026-10-17-lite-v2'].includes(d.bridgeReviewVersion))errors.push('Unsupported saved LITE bridge review version; retain and export before recovery.');
 const t=d.terminal;
 if(!object(t)||!terminalFields.every(k=>finite(t[k])))errors.push('Complete all terminal assumptions.');
 else if(t.growth<0||t.growth>.05||t.margin<=0||t.margin>1||t.taxRate<0||t.taxRate>.6||t.wacc<=t.growth||t.wacc>1||t.roic<=t.growth)errors.push('Terminal policy requires 0–5% growth, positive margin, tax 0–60%, WACC > growth and ROIC > growth.');
 if(d.operatingProfile!==undefined||d.yearlyOverrides!==undefined||d.assumptions!==undefined)errors.push('An annual research schedule cannot be combined with a scalar or second operating profile.');
 if(includeTiming&&(!object(d.timing)||!['origin','as-of-scenario'].includes(d.timing.mode)||!date(d.timing.asOf)||typeof d.timing.reason!=='string'||(d.timing.stubFCFF!==null&&!finite(d.timing.stubFCFF))))errors.push('A valid explicit timing policy is required; an unknown stub must remain null.');
 return errors;
}
export function restoreResearchDraft(value,c){
 if(value==null)return {draft:researchDraftFor(c),restored:false,error:null};
 // A malformed saved draft is never replaced by the new research numbers.
 // Return it intact so the user can export/recover it, with calculation withheld.
 if(!object(value)||!terminalReviewIdentityValid(value)||value.profileId!==RESEARCH_PROFILE_ID||![1,2].includes(value.schemaVersion)||value.version!==(incrementalCaseVersion(c)||RESEARCH_VERSION)||value.ticker!==c.ticker||value.currency!==c.currency||value.caseId!==researchCaseId(c)||(value.schemaVersion===1?value.forecastHorizonYears!==c.forecastHorizonYears:value.derivedForecast?.sourceForecastHorizonYears!==c.forecastHorizonYears)||value.discountOrigin!==c.valuationTiming.discountOrigin||(value.anchor?.revenue!==c.anchor.revenue&&!((value.ticker==='MRVL'&&!mrvlOpeningStubIssues(value).length)||(value.ticker==='CDNS'&&!cdnsOpeningStubIssues(value).length)||(value.ticker==='SNPS'&&!snpsOpeningStubIssues(value).length))))return {draft:copy(value),restored:true,error:'Saved annual draft has an incompatible identity or source horizon. Export it before explicitly loading the reviewed research case.'};
 const errors=researchDraftIssues(value);
 const draft=copy(value);
 if(!errors.length&&c.ticker==='LITE')preserveLegacyLiteBridge(draft);
 return {draft,restored:true,error:errors.length?errors.join(' '):null};
}
// Preserve old economics before any explicit operating-case recovery as well as
// normal restore. Work only on copies; malformed claim containers stay untouched.
function preserveLegacyLiteBridge(d){
 if(d.bridgeReviewVersion!==undefined)return;
 if(d.bridgeInputs===undefined)d.bridgeInputs={};
 if(!object(d.bridgeInputs))return;
 if(!Object.prototype.hasOwnProperty.call(d.bridgeInputs,'convertiblePremiumClaim'))d.bridgeInputs.convertiblePremiumClaim=null;
 if(!Object.prototype.hasOwnProperty.call(d.bridgeInputs,'cappedCallAssetValue'))d.bridgeInputs.cappedCallAssetValue=0;
 d.bridgeReviewVersion='legacy-preserved-v1';
}
export function loadAnnualResearchCase(previous,c){
 const next=researchDraftFor(c);
 if(object(previous)){
  for(const key of ['notes','nvmiConditional','bridgeInputs','bridgeReviewVersion','researchSimulationConfig','currentCapitalScenario','currentCapitalProvenance'])if(Object.prototype.hasOwnProperty.call(previous,key))next[key]=copy(previous[key]);
  if(c.ticker==='LITE'&&previous.ticker==='LITE'&&previous.bridgeReviewVersion===undefined){delete next.bridgeReviewVersion;if(previous.bridgeInputs===undefined)next.bridgeInputs={};preserveLegacyLiteBridge(next);}
 }
 return {draft:next,undo:previous==null?null:copy(previous)};
}
export function calculateResearchOperating(d){
 const errors=researchDraftIssues(d,{includeTiming:false});if(errors.length)throw Error(errors.join(' '));
 if(d.ticker==='SNDK')return calculateSndkOperating(d);
 if(d.ticker==='CRDO')return calculateCrdoOperating(d);
 if(d.ticker==='MRVL')return calculateMrvlOperating(d);
 if(d.ticker==='AMD')return calculateAmdOperating(d);
 if(d.ticker==='SNPS')return calculateSnpsOperating(d);
 if(d.openingStub)return calculateCdnsOperating(d);
 let prior=d.anchor.revenue,discount=1,pv=0,cumulative=0,trough=0;
 const rows=d.annual.map((r,index)=>{
  const funding=camtAnnualFunding(d,index,r)||ontoAnnualFunding(d,index,r)||nvmiAnnualFunding(d,index,r),cashChange=operatingCashChange(d,index),totalInvestment=funding?funding.reinvestment:r.reinvestment+cashChange,operating=funding?funding.reinvestment:operatingInvestment(d,r)+cashChange;
  const ebit=r.revenue*r.margin,tax=Math.max(0,ebit)*r.taxRate,nopat=ebit-tax,fcff=nopat-totalInvestment;
  discount*=1+r.wacc;const presentValue=fcff/discount;pv+=presentValue;cumulative+=fcff;trough=Math.min(trough,cumulative);
  const growth=r.revenue/prior-1,deltaRevenue=r.revenue-prior;prior=r.revenue;
  if(![ebit,tax,nopat,fcff,discount,presentValue,cumulative,growth,pv].every(finite))throw Error(`Year ${r.year}: forecast arithmetic exceeded the finite numerical range. Reduce the edited inputs.`);
  return {...r,...(funding||{}),reinvestment:totalInvestment,...(d.operatingCashFunding?{investmentBeforeOperatingCashReserve:r.reinvestment,changeRequiredOperatingCash:cashChange}:{}),growth,ebit,tax,nopat,fcff,discountFactor:discount,pv:presentValue,cumulativeFCFF:cumulative,...(d.fixedCapitalFunding?{fixedOpeningFunding:fixedCapitalSettlement(d,r.year),...(d.ticker==='LRCX'?{openingCapitalPayableSettlement:fixedCapitalSettlement(d,r.year)}:{}),normalizedOperatingReinvestment:operating}:{}),derivedSalesCapital:operating!==0?deltaRevenue/operating:null};
 });
 const t=d.terminal,last=rows.at(-1),revenue=last.revenue*(1+t.growth),ebit=revenue*t.margin,nopat=ebit*(1-t.taxRate),reinvestment=nopat*t.growth/t.roic,fcff=nopat-reinvestment,value=fcff/(t.wacc-t.growth),terminalPV=value/discount,enterprise=pv+terminalPV;
 if(![revenue,ebit,nopat,reinvestment,fcff,value,terminalPV,enterprise].every(finite))throw Error('Terminal arithmetic exceeded the finite numerical range. Reduce the edited inputs.');
 const terminal={...t,...(camtTerminalFunding(d,revenue,reinvestment)||ontoTerminalFunding(d,revenue,reinvestment)||nvmiTerminalFunding(d,revenue,reinvestment)||{}),revenue,ebit,nopat,reinvestment,fcff,value,pv:terminalPV,discountFactor:discount,fcffGrowth:last.fcff!==0?fcff/last.fcff-1:null,revenueGrowthEndpointDifference:last.growth-t.growth};
 const warnings=[];
 if(terminal.fcffGrowth===null||Math.abs(terminal.fcffGrowth-t.growth)>1e-6)warnings.push('Final explicit FCFF and terminal FCFF do not grow at the stable revenue rate. Inspect the capital-transition sensitivity; the original research path is preserved.');
 if(Math.abs(terminal.revenueGrowthEndpointDifference)>1e-6)warnings.push('Final explicit revenue growth differs from terminal growth. The growth endpoint change is separate from the capital transition.');
 if(d.schemaVersion===2)warnings.push((d.derivedForecast?.revenuePathPreserved?'Margin-only schedule extension with retained existing revenue path:':'Derived revenue-horizon sensitivity:')+' calendar-year net investment floors and explicit additional growth funding are analyst assumptions. Source capital-component reconciliations do not describe changed rows. A longer growth runway does not guarantee higher value.');
 if(d.userEdited)warnings.push('Edited annual inputs are analyst assumptions. Original capital-component reconciliations may no longer match; check the investment evidence before relying on them.');
 if(rows.some(r=>r.reinvestment<0))warnings.push(d.operatingCashFunding?'Investment includes the explicit pre-reserve assumption plus the formula-driven required-cash change. Lower next-year sales can release required cash under the fixed 3% policy.':'A negative investment amount is an explicit asset or working-capital release assumption; it is not created automatically by falling revenue.');
 return {ticker:d.ticker,currency:d.currency,informationAsOf:d.informationAsOf,discountOrigin:d.discountOrigin,rows,terminal,forecastPV:pv,terminalPV,enterprise,terminalShare:enterprise>0?terminalPV/enterprise:null,peakEconomicDeficit:Math.max(0,-trough),negativeFCFFYears:rows.filter(r=>r.fcff<0).length,warnings,classification:'Conditional operating EV at the forecast origin, using research available on the information date. Not a contemporaneously knowable anchor-date valuation.'};
}
export function terminalNormalizedDraft(d,{years=3}={}){
 const errors=researchDraftIssues(d,{includeTiming:false});if(errors.length)throw Error(errors.join(' '));
 const next=copy(d),n=next.annual.length,count=Math.min(years,n),t=next.terminal;
 if(!Number.isInteger(count)||count<1)throw Error('Choose a positive number of transition years.');
 const original=calculateResearchOperating(d);
 if(original.terminal.fcffGrowth!==null&&Math.abs(original.terminal.fcffGrowth-t.growth)<=1e-6){next[next.schemaVersion===2?'capitalSensitivity':'capitalPolicy']='terminal-normalization-not-needed-v1';return next;}
 // Blend the original investment into terminal-consistent net investment.
 // No revision to source revenue, margin, tax, WACC, or earlier years is hidden.
 for(let i=n-count;i<n;i++){
  const r=next.annual[i],weight=(i-(n-count)+1)/count;
  const ebit=r.revenue*r.margin,nopat=ebit-Math.max(0,ebit)*r.taxRate;
  const target=nopat*t.growth/t.roic-operatingCashChange(d,i);
  r.reinvestment=operatingInvestment(d,r)*(1-weight)+target*weight+fixedCapitalSettlement(d,r.year);
 }
 next[next.schemaVersion===2?'capitalSensitivity':'capitalPolicy']=`terminal-normalization-${count}y-v1`;next.userEdited=true;
 return next;
}
export function researchTimingResult(d,operating=calculateResearchOperating(d)){
 const t=d.timing;
 if(!object(t))return {status:'incomplete',enterprise:null,message:'A valid explicit timing policy is required.'};
 if(t.mode==='origin')return {status:'origin',enterprise:operating.enterprise,date:d.discountOrigin,label:'Forecast-origin operating EV',warnings:d.incrementalResearch?[incrementalRecord(d.ticker).prose.scope.en]:['The information date is later than reported anchors and earlier than forecast anchors. No October 17 cash-flow or capital roll-forward is implied.']};
 if(d.ticker==='MRVL')return {status:'incomplete',enterprise:null,message:MRVL_MESSAGES.timing[0]};
 if(d.ticker==='AMD')return {status:'incomplete',enterprise:null,message:'AMD date changes require a newly reviewed partial-period operating and capital bridge.'};
 if(d.ticker==='SNPS')return {status:'incomplete',enterprise:null,message:'SNPS source Q4 timing is fixed. A different valuation date requires a newly reviewed partial-period operating and capital bridge.'};
 if(d.openingStub)return {status:'incomplete',enterprise:null,message:'CDNS source H2 timing is fixed. A different valuation date requires a newly reviewed partial-period operating and capital bridge.'};
 if(t.mode!=='as-of-scenario'||!date(t.asOf)||t.asOf<d.informationAsOf)return {status:'incomplete',enterprise:null,message:'Use an as-of date on or after the research information date.'};
 const elapsed=days(t.asOf,d.discountOrigin)/365.25;
 if(elapsed>=1)return {status:'incomplete',enterprise:null,message:'This timing bridge covers only the first partial annual period; a later date needs a new operating baseline.'};
 if(!finite(t.stubFCFF)||typeof t.reason!=='string'||!t.reason.trim())return {status:'incomplete',enterprise:null,message:elapsed>=0?'Enter and explain the already-elapsed portion of first-year FCFF. It is subtracted from the first future annual payment. Zero must be an explicit assumption.':'Enter and explain the remaining pre-origin FCFF stub. June-to-December cash use is not the remaining October-to-December stub. Zero must be an explicit assumption.'};
 if(elapsed>=0){
  const rate=d.annual[0].wacc,carry=(1+rate)**elapsed,removedPV=t.stubFCFF/(1+rate)*carry,enterprise=operating.enterprise*carry-removedPV;
  if(![carry,removedPV,enterprise].every(finite))return {status:'incomplete',enterprise:null,message:'Timing arithmetic exceeded the finite numerical range. Reduce the edited cash-flow stub.'};
  return {status:'scenario',enterprise,date:t.asOf,label:'As-of operating scenario',elapsedYears:elapsed,stubFCFF:t.stubFCFF,stubTreatment:'Remove elapsed FCFF from year 1; remaining first-year FCFF stays at its original end-of-period date.',rate,removedPV,reason:t.reason,classification:'Explicit timing assumption, not observed interim FCFF',warnings:['Operating value is date-shifted under the stated partial-year assumption. Dated cash, debt, investments, claims and shares require their own roll-forward.']};
 }
 if(!finite(t.stubDiscountRate)||t.stubDiscountRate<=0||t.stubDiscountRate>1)return {status:'incomplete',enterprise:null,message:'A positive, explicit stub discount rate is required.'};
 const discount=(1+t.stubDiscountRate)**(-elapsed),enterprise=(operating.enterprise+t.stubFCFF)/discount;
 if(![discount,enterprise].every(finite))return {status:'incomplete',enterprise:null,message:'Timing arithmetic exceeded the finite numerical range. Reduce the edited cash-flow stub.'};
 return {status:'scenario',enterprise,date:t.asOf,label:'As-of operating scenario',elapsedYears:elapsed,stubFCFF:t.stubFCFF,stubTreatment:'Remaining pre-origin FCFF is paid at the forecast origin; it and the entire annual stream use the same extra stub discount interval.',rate:t.stubDiscountRate,stubPV:t.stubFCFF/discount,reason:t.reason,classification:'Explicit timing assumption, not observed remaining-year FCFF',warnings:['Pre-origin capital expenditure, customer advances and financing must be counted once. Reported June cash plus later raises is not verified October excess cash.']};
}
export function researchSensitivity(d){
 const base=calculateResearchOperating(d),normalized=calculateResearchOperating(terminalNormalizedDraft(d));
 const rates=[-.01,0,.01].map(shift=>{
  const next=copy(d);next.annual.forEach(r=>r.wacc+=shift);next.terminal.wacc+=shift;
  try{return {waccShift:shift,enterprise:calculateResearchOperating(next).enterprise};}catch(e){return {waccShift:shift,enterprise:null,error:e.message};}
 });
 return {base:base.enterprise,normalized:normalized.enterprise,normalizationDelta:normalized.enterprise-base.enterprise,normalizedTerminalFCFFGrowth:normalized.terminal.fcffGrowth,normalizationLabel:'Three-year terminal-capital normalization v1; analytical sensitivity, not a superior forecast',rates};
}
export function exportResearchCase(d,c){
 if(d.incrementalResearch&&JSON.stringify(c)!==JSON.stringify(incrementalRecord(d.ticker)?.annualCase))throw Error('Incremental export source does not match the reviewed company package.');
 const operating=calculateResearchOperating(d);
 return {schemaVersion:1,exportedAt:new Date().toISOString(),classification:'Conditional research scenario; public-source evidence and analyst assumptions, not investment advice or a market quote.',originalResearchCase:copy(c),...(d.incrementalResearch?{incrementalSourceIdentity:copy(d.incrementalResearch),priceComparisonEligible:false,asKnownBacktestEligible:false,scope:incrementalRecord(d.ticker).prose.scope.en}:{}),draft:copy(d),operating,timing:researchTimingResult(d,operating),sensitivity:researchSensitivity(d)};
}
