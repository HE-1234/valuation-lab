// Reviewed dated ownership scenarios. Reported inputs and analyst proxies are
// recorded separately in the generated evidence ledger, never in historical data.
import {resolvedClaims as earlierClaims} from './resolved-claims-data.js';
import {addedClaims} from './added-claims-data.js';
const resolvedClaims=[...earlierClaims,...addedClaims];
const finite=Number.isFinite;
const near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<1e-7;
export function requiresResolvedClaims(s){return resolvedClaims.some(d=>d.ticker===s?.ticker&&d.snapshotIds.includes(s?.raw?.id));}
export function resolvedClaimsDefinition(s){
 const d=resolvedClaims.find(d=>d.snapshotIds.includes(s?.raw?.id));
 if(!d||s.researchImported||s.raw?.researchImported||s.ticker!==d.ticker||s.periodEnd!==d.periodEnd||s.sourceUrl!==d.sourceUrl||s.currency!=='USD'||s.raw?.guidedClaimsResolutionId!==d.id||!near(s.cash,d.cash)||!near(s.debt,d.mappedDebt)||!near(s.shares,d.capturedShares))return null;
 return structuredClone(d);
}
export function resolvedDefaults(d){return {schemaVersion:1,modelId:d.id,method:'option-proxy',employeeShareScale:1,subsidiaryReserve:d.subsidiaryReserve||0,convertibleCase:d.convertibleScenarios?'holder-choice':'fair-value',...(d.forwardSettlement?{forwardProceeds:'minimum'}:{}),...(d.cappedCalls?{cappedCallTreatment:'intrinsic'}:{}),...(d.mandatoryConversion?{mandatoryConversionCase:'maximum',preferredDividendTreatment:'discounted'}:{}),...(d.operatingCashReserve?{operatingCashReserveFraction:1}:{})};}
export function resolvedIssues(d,c,draft){
 const errors=[];
 if(draft.cutoff<d.evidenceAsOf)errors.push('The ownership evidence was not available by the selected valuation date.');
 if(!['option-proxy','intrinsic','free-awards'].includes(c.method))errors.push('Choose a supported award treatment.');
 if(!finite(c.employeeShareScale)||c.employeeShareScale<0||c.employeeShareScale>3)errors.push('Employee award scale must be between zero and three.');
 if(!finite(c.subsidiaryReserve)||c.subsidiaryReserve<0)errors.push('Subsidiary award reserve must be finite and nonnegative.');
 if(!(d.convertibleScenarios?['holder-choice','principal-only','if-converted']:['fair-value','principal-only']).includes(c.convertibleCase))errors.push('Choose a supported convertible treatment.');
 if(d.forwardSettlement&&!['minimum','maximum'].includes(c.forwardProceeds))errors.push('Choose a sourced forward-proceeds scenario.');
 if(d.cappedCalls&&!['intrinsic','omit','maximum-payoff'].includes(c.cappedCallTreatment))errors.push('Choose a supported capped-call treatment.');
 if(d.mandatoryConversion&&!['minimum','maximum'].includes(c.mandatoryConversionCase))errors.push('Choose a sourced mandatory-conversion share scenario.');
 if(d.mandatoryConversion&&!['discounted','undiscounted'].includes(c.preferredDividendTreatment))errors.push('Choose a supported preferred-dividend treatment.');
 if(d.operatingCashReserve&&(!finite(c.operatingCashReserveFraction)||c.operatingCashReserveFraction<0||c.operatingCashReserveFraction>1))errors.push('Operating cash reserve fraction must be between zero and one.');
 return errors;
}
// Abramowitz-Stegun normal CDF, adequate for a transparent valuation proxy.
function cdf(x){const a=Math.abs(x),t=1/(1+.2316419*a),p=1-Math.exp(-a*a/2)/Math.sqrt(2*Math.PI)*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?p:1-p;}
export function callProxy(price,{strike,years,volatility,rate}){
 if(price<=0)return 0;
 if(strike===0)return price;
 if(years<=0||volatility<=0)return Math.max(0,price-strike*Math.exp(-rate*Math.max(0,years)));
 const z=volatility*Math.sqrt(years),d1=(Math.log(price/strike)+(rate+volatility*volatility/2)*years)/z;
 return Math.max(0,Math.min(price,price*cdf(d1)-strike*Math.exp(-rate*years)*cdf(d1-z)));
}
export function allocateAwards(equity,shares,tranches,method,cappedCalls=[],cappedMethod='intrinsic'){
 const unit=(p,t)=>method==='free-awards'?p:method==='intrinsic'?Math.max(0,p-t.strike):callProxy(p,t);
 const maximumAsset=cappedCalls.reduce((n,t)=>n+t.shares*(t.cap-t.strike),0);
 const assetAt=p=>cappedMethod==='omit'?0:cappedMethod==='maximum-payoff'?maximumAsset:cappedCalls.reduce((n,t)=>n+t.shares*Math.min(Math.max(p-t.strike,0),t.cap-t.strike),0);
 if(equity+assetAt(0)<=0)return {price:0,rawPrice:(equity+assetAt(0))/shares,claim:0,asset:assetAt(0)};
 let lo=0,hi=(equity+maximumAsset)/shares;
 for(let i=0;i<90;i++){const p=(lo+hi)/2,total=shares*p+tranches.reduce((n,t)=>n+t.shares*unit(p,t),0)-assetAt(p);if(total>equity)hi=p;else lo=p;}
 const price=(lo+hi)/2;return {price,rawPrice:price,claim:tranches.reduce((n,t)=>n+t.shares*unit(price,t),0),asset:assetAt(price)};
}
export function valueResolvedClaims(value,snapshot,draft,d){
 const c=draft.claims,rows=[],employeeShares=d.employeeAwardShares*c.employeeShareScale;
 const preferredShares=d.mandatoryConversion?d.mandatoryConversion[c.mandatoryConversionCase==='minimum'?'minimumShares':'maximumShares']:(d.commonEquivalentShares||0);
 const preferredDividends=d.mandatoryConversion?d.mandatoryConversion[c.preferredDividendTreatment==='undiscounted'?'undiscountedDividends':'dividendPresentValue']:0;
 const operatingCashReserve=(d.operatingCashReserve?.amount||0)*(c.operatingCashReserveFraction??1);
 let shares=d.commonShares+employeeShares+(d.prefundedWarrantShares||0)+preferredShares+(d.forwardSettlement?.shares||0);
 let convertible=d.convertibleFairValue===undefined?0:(c.convertibleCase==='fair-value'?d.convertibleFairValue:d.convertiblePrincipal)-d.convertibleCarrying;
 if(preferredShares)rows.push({label:'Common-equivalent preferred shares',amount:preferredShares,kind:'shares'});
 if(preferredDividends)rows.push({label:'Remaining preferred dividends',amount:preferredDividends,kind:'claim'});
 if(operatingCashReserve)rows.push({label:'Customer-prepayment cash reserve proxy',amount:operatingCashReserve,kind:'claim'});
 if(employeeShares)rows.push({label:'Employee awards counted as free shares',amount:employeeShares,kind:'shares'});
 if(d.prefundedWarrantShares)rows.push({label:'Prefunded warrants counted once',amount:d.prefundedWarrantShares,kind:'shares'});
 if(c.subsidiaryReserve)rows.push({label:'Subsidiary employee-award reserve proxy',amount:c.subsidiaryReserve,kind:'claim'});
 rows.push({label:'Disclosed minority and acquisition claims',amount:d.fixedClaims,kind:'claim'});
 const forwardAsset=d.forwardSettlement?(c.forwardProceeds==='maximum'?d.forwardSettlement.presentValueMax:d.forwardSettlement.presentValueMin):0;
 if(d.forwardSettlement){rows.push({label:'Future forward-settlement shares',amount:d.forwardSettlement.shares,kind:'shares'});rows.push({label:'Discounted future forward proceeds',amount:forwardAsset,kind:'asset'});}
 const pool=forwardAsset+value.enterprise+snapshot.cash+value.assumptions.otherAssets-snapshot.debt-value.assumptions.otherClaims-d.fixedClaims-c.subsidiaryReserve-preferredDividends-operatingCashReserve;
 let conversionChoice=null,conversionDecisions=[];
 if(d.convertibleScenarios){
  const notes=d.convertibleScenarios;
  if(notes.length>8)throw Error('Too many convertible series for the allocation model.');
  // Holders of different series need not make the same election. Enumerate
  // combinations so a low-strike note can convert while a high-strike note
  // retains principal. The minimum common price is the holder-choice proxy.
  const branches=c.convertibleCase==='holder-choice'
   ?Array.from({length:2**notes.length},(_,mask)=>notes.map((_,i)=>Boolean(mask&(2**i))))
   :[notes.map(()=>c.convertibleCase==='if-converted')];
  const alternatives=branches.map(converted=>{
   const choice=converted.every(Boolean)?'if-converted':converted.some(Boolean)?'mixed':'principal-only';
   const adjustment=notes.reduce((n,x,i)=>n+(converted[i]?-x.carrying:x.principal-x.carrying),0),extraShares=notes.reduce((n,x,i)=>n+(converted[i]?x.conversionShares:0),0);
   const allocation=allocateAwards(pool-adjustment,shares+extraShares,d.optionTranches,c.method,d.cappedCalls||[],c.cappedCallTreatment||'intrinsic');
   return {choice,converted,adjustment,extraShares,price:allocation.price};
  }).sort((a,b)=>a.price-b.price);
  const chosen=alternatives[0];convertible=chosen.adjustment;conversionChoice=chosen.choice;shares+=chosen.extraShares;
  conversionDecisions=notes.map((x,i)=>({name:x.name||`Convertible ${i+1}`,converted:chosen.converted[i],conversionShares:chosen.converted[i]?x.conversionShares:0,claimAdjustment:chosen.converted[i]?-x.carrying:x.principal-x.carrying}));
  if(chosen.extraShares)rows.push({label:'Convertible shares in conversion scenario',amount:chosen.extraShares,kind:'shares'});
 }
 if(convertible)rows.push({label:convertible<0?'Convertible carrying debt released on conversion':'Convertible claim adjustment above carrying debt',amount:Math.abs(convertible),kind:convertible<0?'asset':'claim'});
 const before=pool-convertible;
 const allocation=allocateAwards(before,shares,d.optionTranches,c.method,d.cappedCalls||[],c.cappedCallTreatment||'intrinsic');
 rows.push({label:'Parent option and conditional-award claim proxy',amount:allocation.claim,kind:'claim'});
 if(allocation.asset)rows.push({label:'Capped-call asset scenario',amount:allocation.asset,kind:'asset'});
 const equity=before+allocation.asset-allocation.claim,rawPerShare=equity/shares;
 if(![shares,equity,rawPerShare].every(finite)||shares<=0)throw Error('Claims bridge is numerically nonfinite.');
 return {...value,equity,rawPerShare,perShare:Math.max(0,rawPerShare),claimsBridge:{version:'2.0.0',modelId:d.id,referenceDate:d.periodEnd,method:c.method,conversionChoice,conversionDecisions,capitalBasis:'reported',classification:'Dated ownership scenario with explicit analyst proxies',cash:snapshot.cash,mappedDebt:snapshot.debt,commonShares:d.commonShares,basicShares:d.commonShares,allocationShares:shares,equityBeforeWarrants:before,warrantClaim:0,warrantCount:0,exerciseShares:0,exerciseCash:0,additionalClaims:d.fixedClaims+convertible+c.subsidiaryReserve+preferredDividends+operatingCashReserve+allocation.claim,additionalAssets:forwardAsset+allocation.asset,rows,dividends:[],warnings:d.cautions,sources:d.sources,inputs:structuredClone(c)}};
}
export function resolvedVariants(d){return [
 ['Option time-value proxy · all vest',{method:'option-proxy'}],
 ['Intrinsic only · excludes time value',{method:'intrinsic'}],
 ['All parent awards free · no exercise credit',{method:'free-awards'}],
 ['Employee award inventory doubled',{employeeShareScale:2}],
 ...(d.operatingCashReserve?[["Half customer-prepayment reserve",{operatingCashReserveFraction:.5}],["Customer-prepayment reserve omitted",{operatingCashReserveFraction:0}]]:[]),
 ...(d.mandatoryConversion?[["Minimum mandatory-conversion shares",{mandatoryConversionCase:'minimum'}],["Preferred dividends without discounting",{preferredDividendTreatment:'undiscounted'}]]:[]),
 ...(d.forwardSettlement?[['Maximum contracted forward proceeds',{forwardProceeds:'maximum'}]]:[]),
 ...(d.cappedCalls?[['Capped-call asset omitted',{cappedCallTreatment:'omit'}],['Capped-call maximum nominal payoff stress',{cappedCallTreatment:'maximum-payoff'}]]:[]),
 ...(d.convertibleScenarios?[['Convertible holder-choice proxy',{convertibleCase:'holder-choice'}],['Convertible principal retained',{convertibleCase:'principal-only'}],['Convertible full-share conversion',{convertibleCase:'if-converted'}]]:[]),
 ...(d.convertibleFairValue===undefined?[]:[['Convertible contractual principal · excludes option',{convertibleCase:'principal-only'}]]),
 ...(d.subsidiaryReserve>0?[['Subsidiary award reserve omitted',{subsidiaryReserve:0}],['Subsidiary award reserve stressed',{subsidiaryReserve:d.subsidiaryReserveStress}]]:[])
 ];}
