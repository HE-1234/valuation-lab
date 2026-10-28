// Source-dated claims overlays for current-company research only.
// Historical engine, frozen cases and original filing captures are untouched.
import {requiresResolvedClaims,resolvedClaimsDefinition,resolvedDefaults,resolvedIssues,valueResolvedClaims,resolvedVariants} from './resolved-claims.js';
import {financialDefinition,financialIssues} from './financial-model.js';
import {valueCompany,validDate} from './engine.js';
import {currentClaimsEvidence} from './current-claims-gates.js';
import {operatingAssumptions,operatingProfileDefinition} from './current-operating.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clone=x=>structuredClone(x);
const near=(a,b)=>finite(a)&&Math.abs(a-b)<1e-7;
const AAOI_FY='https://www.sec.gov/Archives/edgar/data/1158114/000143774926005875/aaoi20251231_10k.htm';
const AAOI_Q='https://www.sec.gov/Archives/edgar/data/1158114/000143774926026278/aaoi20260630_10q.htm';
const GOOG_Q='https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm';
const aaoiCommon={ticker:'AAOI',type:'convertible',conversionRate:23.0884,warrantShares:7.945399,warrantInitiallyVested:1.324233,warrantStrike:23.6956,
 description:'Dated convertible fair value, separate vendor financing, and an explicitly approximate customer-warrant claim.',
 sources:[{title:'Convertible notes, financing and Amazon warrant · original filing',url:AAOI_Q}],
 cautions:['The customer-warrant treatment is intrinsic value only and omits option time value. Full future vesting is an assumption; the initially vested count is not a verified current vested count. Future service costs are not credited back.','Existing employee awards, financing needs and future share issuance remain unmodeled. GAAP operating compensation stays in EBIT.','The period-end fair value disclosed in the filing is an observed claim proxy, not a live convertible quote or a value re-estimated for each operating scenario.']};
const definitions=[
 {...aaoiCommon,id:'AAOI-2025-12-31-claims-v1',snapshotIds:['AAOI-CURRENT-2025-12-31'],periodEnd:'2025-12-31',filedAt:'2026-02-26',sourceUrl:AAOI_FY,cash:206.14,mappedDebt:33.975,capturedShares:75.198817,commonShares:74.998,convertiblePrincipal:125,convertibleCarrying:129.829,convertibleFairValue:145.231,vendorFinancing:33.363,sources:[{title:'AAOI FY2025 · Notes J, N and customer warrant',url:AAOI_FY}]},
 {...aaoiCommon,id:'AAOI-2026-06-30-claims-v1',snapshotIds:['AAOI-CURRENT-2026-06-30','AAOI-TTM-2026-06-30'],periodEnd:'2026-06-30',filedAt:'2026-08-06',sourceUrl:AAOI_Q,cash:499.737,mappedDebt:58.915,capturedShares:84.569237,commonShares:84.386,convertiblePrincipal:124.925,convertibleCarrying:129.142,convertibleFairValue:445.1,vendorFinancing:33.940,
  knownTransactions:{asOf:'2026-10-05',netCashProceeds:587.99998589,knownPropertyCashUse:26.783472,sharesIssued:5.694845,preOfferingShares:84.906289,preOfferingShareDate:'2026-08-20',sourceUrl:'https://appliedoptoelectronics.gcs-web.com/news-releases/news-release-details/applied-optoelectronics-announces-completion-previously',shareSourceUrl:'https://www.sec.gov/Archives/edgar/data/1158114/000110465926099685/tm2623389-1_424b5.htm'},
  sources:[...aaoiCommon.sources,{title:'October 5 completed ATM · known transaction only',url:'https://appliedoptoelectronics.gcs-web.com/news-releases/news-release-details/applied-optoelectronics-announces-completion-previously'},{title:'August 20 common-share reference',url:'https://www.sec.gov/Archives/edgar/data/1158114/000110465926099685/tm2623389-1_424b5.htm'},{title:'September property cash purchase',url:'https://www.sec.gov/Archives/edgar/data/1158114/000168316826007057/aaoi_8k.htm'}]},
 {id:'GOOG-2026-06-30-claims-v1',ticker:'GOOG',type:'mandatory-preferred',snapshotIds:['GOOG-CURRENT-2026-06-30','GOOG-TTM-2026-06-30'],periodEnd:'2026-06-30',filedAt:'2026-07-23',sourceUrl:GOOG_Q,cash:242474,mappedDebt:100164,capturedShares:12230,commonShares:12230,
  preferredShares:19.25,preferredPrincipal:19250,preferredCarrying:18023,preferredAccrued:86,conversionShares:{minimum:43.56275,maximum:54.45825},financeLeases:2590,noncontrollingInterest:7100,currentMarketableEquity:87063,restrictedEquity:80000,noncurrentInvestments:145587,noncurrentMarketableEquity:14126,nonmarketableInvestments:131461,
  dividendRate:.0625,firstDividendPerPreferred:12.15,firstDividendDate:'2026-08-15',conversionDate:'2029-05-15',
  description:'Full-dilution ownership proxy with contractual preferred dividends retained; separate finance leases, noncontrolling claims and noncurrent investments.',
  sources:[{title:'Alphabet Q2 2026 · preferred stock, investments, leases and noncontrolling interests',url:GOOG_Q},{title:'Series A preferred certificate · contractual conversion terms',url:'https://www.sec.gov/Archives/edgar/data/1652044/000119312526259830/d36818dex31.htm'},{title:'Series B preferred certificate · contractual conversion terms',url:'https://www.sec.gov/Archives/edgar/data/1652044/000119312526259830/d36818dex32.htm'},{title:'August debt issuance · outside the June capital reference',url:'https://www.sec.gov/Archives/edgar/data/1652044/000119312526342390/d171253d8k.htm'}],
  cautions:['Full future dilution is applied to present common equity. The proxy assumes no separately distributed pre-conversion common cash flows, unchanged common shares, cash preferred dividends and no capped-call recovery. It is not a literal immediate conversion or option-pricing model.','Preferred dividends are assumed paid in cash. Stock-dividend shares, arrears additions and anti-dilution adjustments are excluded. Actual conversion depends on future 20-trading-day common-stock averages. The selected contractual endpoint is fixed, not inferred from the DCF value or a market quote.','Capped-call value is set to zero: its premium is already reflected in cash/equity and is never deducted again. No additional benefit is claimed.','Cash and mapped marketables already include $87,063m of marketable equity, including $80,000m of restricted equity. Noncurrent investments are a separate carrying-value proxy, not a fair-value appraisal.','The $7,100m noncontrolling-interest proxy includes $824m redeemable NCI; it is not added twice. Investment values are gross before realization taxes; no separate exit-tax reserve is deducted. The balance-sheet deferred tax liability mixes items and is not mechanically deducted in full. Employee awards and liquidity discounts remain uncertain.','The August 2026 $25,000m debt issuance is outside this June 30 balance-sheet reference. Neither its proceeds nor debt are silently mixed into this bridge.']}
];
export const CURRENT_CLAIMS_VERSION='1.1.0';
export function claimsDefinition(snapshot){
 const resolved=resolvedClaimsDefinition(snapshot);if(resolved)return resolved;
 const d=definitions.find(d=>d.ticker===snapshot?.ticker&&d.periodEnd===snapshot?.periodEnd&&d.snapshotIds.includes(snapshot?.raw?.id));
 if(!d||snapshot.currency!=='USD'||snapshot.sourceUrl!==d.sourceUrl||snapshot.raw?.researchImported===true||snapshot.researchImported===true||!near(snapshot.cash,d.cash)||!near(snapshot.debt,d.mappedDebt)||!near(snapshot.shares,d.capturedShares))return null;
 const e=snapshot.raw?.employeeAwardSharesEvidence,n=snapshot.raw?.facts?.unvestedNonOptionAwards;
 const awards=e?.originalDocumentVerified===true&&e.periodEnd===d.periodEnd&&e.sourceUrl===d.sourceUrl
  &&typeof e.locator==='string'&&e.locator.length>0&&finite(n)&&n>=0&&near(e.value,n)?n:0;
 const cautions=awards>0?d.cautions.map(x=>x.replace('Existing employee awards, financing needs and future share issuance remain unmodeled.','Disclosed unvested employee awards are counted as shares; future financing and issuance remain unmodeled.').replace('Employee awards and liquidity discounts remain uncertain.','Employee award valuation beyond the disclosed share count and liquidity discounts remain uncertain.')):d.cautions;
 return clone({...d,cautions,employeeAwardShares:awards});
}
export function claimsDefaults(snapshot){
 const d=claimsDefinition(snapshot);if(!d)return null;
 if(d.type==='resolved-awards')return resolvedDefaults(d);
 return d.type==='convertible'
  ? {schemaVersion:1,modelId:d.id,method:'fair-value',capitalBasis:'reported',noteFairValue:d.convertibleFairValue,vendorFinancingFraction:1,warrantCoverage:'all',warrantTimeValueReserve:0,interimCashChange:0}
  : {schemaVersion:1,modelId:d.id,method:'if-converted',conversionCase:'maximum',dividendDiscountRate:.0625,noncontrollingClaim:d.noncontrollingInterest,noncurrentInvestmentValue:d.noncurrentInvestments,currentEquityHaircut:0};
}
// Old drafts receive the explicit source-dated default overlay without replacing
// their operating assumptions. Malformed saved claim inputs fail closed.
export function restoreClaims(value,snapshot){
 if(value===undefined)return claimsDefaults(snapshot);
 if(value===null)return null;
 if(!value||typeof value!=='object'||Array.isArray(value))return {schemaVersion:0,invalid:true};
 return clone(value);
}
export function claimsIssues(snapshot,draft){
 const evidence=currentClaimsEvidence(snapshot),d=claimsDefinition(snapshot),c=draft?.claims;
 if(!d)return requiresResolvedClaims(snapshot)?['A matching source-dated ownership model is required.']:evidence.length?evidence.map(x=>x.message+' A matching source-dated claims model is required.'):[];
 const errors=[];
 if(!c||typeof c!=='object'||Array.isArray(c)||c.schemaVersion!==1||c.modelId!==d.id)return [`${d.ticker}: a valid matching claims model is required; acknowledgements or a generic other-claims amount cannot replace it.`];
 const allowed=Object.keys(claimsDefaults(snapshot));if(Object.keys(c).some(k=>!allowed.includes(k)))errors.push('Claims inputs contain an unsupported field; reset this claims model.');
 if(d.type==='resolved-awards')return [...errors,...resolvedIssues(d,c,draft)];
 if(d.type==='convertible'){
  if(!['fair-value','principal-only','if-converted'].includes(c.method))errors.push('Choose a supported convertible treatment.');
  if(!['reported','known-transactions'].includes(c.capitalBasis)||c.capitalBasis==='known-transactions'&&!d.knownTransactions)errors.push('Choose a supported, dated capital basis.');
  for(const k of ['noteFairValue','warrantTimeValueReserve'])if(!finite(c[k])||c[k]<0)errors.push(`${k} must be a finite nonnegative claim.`);
  if(!finite(c.vendorFinancingFraction)||c.vendorFinancingFraction<0||c.vendorFinancingFraction>1)errors.push('Vendor-financing fraction must be between 0 and 100%.');
  if(!['all','initially-vested'].includes(c.warrantCoverage))errors.push('Choose a sourced warrant-count scenario.');
  if(!finite(c.interimCashChange))errors.push('Interim cash change must be finite, including a negative cash-burn adjustment when applicable.');
  if(c.capitalBasis==='known-transactions'&&d.knownTransactions){
   if(!validDate(draft.cutoff)||draft.cutoff.slice(0,10)<d.knownTransactions.asOf)errors.push('The known-transaction scenario uses the October 5, 2026 ATM completion; choose that valuation date or later.');
   if(d.cash+d.knownTransactions.netCashProceeds-d.knownTransactions.knownPropertyCashUse+c.interimCashChange<0)errors.push('Pro-forma cash cannot be negative; model additional funding separately.');
  }
 }else{
  if(!['if-converted','liquidation-proxy'].includes(c.method))errors.push('Choose a supported preferred-stock treatment.');
  if(!['minimum','maximum'].includes(c.conversionCase))errors.push('Choose the minimum or maximum contractual conversion endpoint.');
  if(!finite(c.dividendDiscountRate)||c.dividendDiscountRate<0||c.dividendDiscountRate>1)errors.push('Preferred dividend discount rate must be between 0 and 100%.');
  for(const k of ['noncontrollingClaim','noncurrentInvestmentValue'])if(!finite(c[k])||c[k]<0)errors.push(`${k} must be a finite nonnegative proxy.`);
  if(!finite(c.currentEquityHaircut)||c.currentEquityHaircut<0||c.currentEquityHaircut>1)errors.push('Current marketable-equity haircut must be between 0 and 100%.');
 }
 return errors;
}
export function currentEconomicShareBasis(snapshot,draft){
 const d=claimsDefinition(snapshot);if(!d)return snapshot.shareBasis;
 if(d.type==='convertible'&&draft?.claims?.capitalBasis==='known-transactions')return 'AAOI common share; known-transaction capital scenario through 2026-10-05, not actual current shares/cash';
 return `${d.ticker} common share; ${d.periodEnd} reported capital basis; explicit claims allocation${d.ticker==='GOOG'?'; equal economic value across A/B/C classes':''}`;
}
export function preferredDividendSchedule(d){
 if(d?.type!=='mandatory-preferred')return [];
 const result=[{date:d.firstDividendDate,amount:d.preferredShares*d.firstDividendPerPreferred,kind:'reported first declaration, rounded per-share amount'}];
 for(let year=2026;year<=2029;year++)for(const month of [2,5,8,11]){
  const date=`${year}-${String(month).padStart(2,'0')}-15`;
  if(date>d.firstDividendDate&&date<=d.conversionDate)result.push({date,amount:d.preferredPrincipal*d.dividendRate/4,kind:'quarterly preferred dividend'});
 }
 return result.sort((a,b)=>a.date.localeCompare(b.date));
}
export function valueCurrentWithClaims(snapshot,draft,assumptions=draft.assumptions){
 const errors=[...claimsIssues(snapshot,draft),...financialIssues(snapshot,draft)];if(errors.length)throw Error(errors.join(' '));
 const engineAssumptions=operatingAssumptions(snapshot,draft,assumptions),profile=operatingProfileDefinition(snapshot,draft,assumptions);
 const computed=valueCompany({...snapshot,ebit:snapshot.ebit+draft.normalizationDelta,provisionalBridge:true},engineAssumptions);
 if((profile?.id==='flexible-growth-v1'||draft.marginPath?.enabled===true||draft.capitalPath?.enabled===true)&&(!['enterprise','equity','perShare','rawPerShare','terminalPV','terminalNopat','terminalReinvestment','forecastPV'].every(k=>finite(computed[k]))||!computed.rows.every(row=>Object.values(row).every(finite))))throw Error('Flexible path valuation is numerically nonfinite; revise the scale or capital assumptions.');
 const financial=financialDefinition(snapshot);if(financial){computed.valuationMethod='equity-cashflow';computed.financialModel=financial;}
 const value=profile?{...computed,assumptions:{...assumptions},operatingProfile:{...profile,annualPath:engineAssumptions.yearlyOverrides}}:computed,d=claimsDefinition(snapshot);
 if(!d)return value;
 if(d.type==='resolved-awards')return valueResolvedClaims(value,snapshot,draft,d);
 const c=draft.claims,rows=[],warnings=[...d.cautions];
 const line=(label,amount,kind='claim')=>{rows.push({label,amount,kind});return amount;};
 let cash=d.cash,shares=d.commonShares,basicShares=d.commonShares,extraClaims=0,extraAssets=0,dividends=[],warrantClaim=0,warrantCount=0,exerciseShares=0,exerciseCash=0;
 if(d.type==='convertible'){
  if(c.capitalBasis==='known-transactions'){
   cash+=d.knownTransactions.netCashProceeds-d.knownTransactions.knownPropertyCashUse+c.interimCashChange;
   shares=d.knownTransactions.preOfferingShares+d.knownTransactions.sharesIssued;basicShares=shares;
   warnings.unshift('Known-transaction pro forma: June cash plus the completed ATM, less the known $26.783472m September property cash purchase, plus your remaining interim cash adjustment; August 20 common shares plus ATM issuance. This is not observed current cash or shares. All other intervening cash flows, awards and note mark changes remain unknown.');
   line('ATM net proceeds',d.knownTransactions.netCashProceeds,'asset');line('Known September property cash use',d.knownTransactions.knownPropertyCashUse,'cash-use');line('Assumed interim cash change',c.interimCashChange,'asset');
  }else if(d.knownTransactions)warnings.unshift('This is the June 30 capital reference. The later ATM added $588.0m net cash and 5.694845m shares. Explore the separately labeled known-transaction scenario; it is not silently included here.');
  extraClaims+=line('Bank-acceptance vendor financing',d.vendorFinancing*c.vendorFinancingFraction);
  if(c.vendorFinancingFraction!==1)warnings.push('Vendor bank acceptances are classified as financing in the cash-flow statement. Reducing their claim is a user stress, not a sourced reclassification; keep reinvestment before vendor financing.');
  if(c.method==='if-converted'){
   const additional=d.convertiblePrincipal*d.conversionRate/1000;shares+=additional;line('Immediate-conversion common shares',additional,'shares');
   warnings.push('Counterfactual immediate full-share conversion: no note principal, fair value or future coupon is deducted. The issuer may instead settle in cash or a combination; this scenario does not value the holder option.');
  }else{
   extraClaims+=line(c.method==='fair-value'?'Convertible fair-value claim':'Convertible principal-only claim',c.method==='fair-value'?c.noteFairValue:d.convertiblePrincipal);
   if(c.method==='principal-only')warnings.push('Principal-only sensitivity omits the convertible option and is not a fair-value estimate. No note dilution is added.');
  }
  extraClaims+=line('Additional warrant time-value reserve',c.warrantTimeValueReserve);
  warrantCount=c.warrantCoverage==='all'?d.warrantShares:d.warrantInitiallyVested;
 }else{
  extraAssets+=line('Noncurrent investment value proxy',c.noncurrentInvestmentValue,'asset');
  extraClaims+=line('Current marketable-equity haircut',d.currentMarketableEquity*c.currentEquityHaircut);
  extraClaims+=line('Finance-lease liabilities',d.financeLeases);
  extraClaims+=line('Noncontrolling-interest value proxy',c.noncontrollingClaim);
  if(c.method==='if-converted'){
   const additional=d.conversionShares[c.conversionCase];shares+=additional;line(`${c.conversionCase==='maximum'?'Maximum':'Minimum'} preferred-conversion shares`,additional,'shares');
   dividends=preferredDividendSchedule(d).map(x=>{const years=(Date.parse(x.date)-Date.parse(d.periodEnd))/(365.25*86400000);return {...x,years,presentValue:x.amount/(1+c.dividendDiscountRate)**years};});
   extraClaims+=line('Preferred contractual dividend PV',dividends.reduce((sum,x)=>sum+x.presentValue,0));
  }else{
   extraClaims+=line('Preferred liquidation priority proxy (face + accrued)',d.preferredPrincipal+d.preferredAccrued);
   warnings.push('Liquidation-principal sensitivity is neither current fair value nor a forecast liquidation: $19,250m face plus the reported $86m accrued-dividend proxy, no conversion dilution and no future dividend PV. Accrued precision follows rounded filing amounts.');
  }
 }
 // Period-end unvested employee awards are distinct from preferred/note conversion
 // and customer warrants. Count them once, before solving the warrant intrinsic value.
 if(d.employeeAwardShares>0){shares+=d.employeeAwardShares;line('Disclosed unvested employee awards',d.employeeAwardShares,'shares');}
 const equityBeforeWarrants=value.enterprise+cash+value.assumptions.otherAssets+extraAssets-d.mappedDebt-value.assumptions.otherClaims-extraClaims;
 if(warrantCount&&equityBeforeWarrants/shares>d.warrantStrike){
  const price=(equityBeforeWarrants+d.warrantStrike*warrantCount)/(shares+warrantCount);
  warrantClaim=Math.max(0,price-d.warrantStrike)*warrantCount;exerciseShares=warrantCount;exerciseCash=d.warrantStrike*warrantCount;
 }
 if(d.type==='convertible')line('Customer-warrant intrinsic claim',warrantClaim);
 const equity=equityBeforeWarrants-warrantClaim,rawPerShare=equity/shares,perShare=Math.max(0,rawPerShare);
 if(![equity,rawPerShare,perShare,cash,shares,extraClaims,extraAssets].every(finite))throw Error('Claims bridge is numerically nonfinite.');
 return {...value,equity,rawPerShare,perShare,claimsBridge:{version:CURRENT_CLAIMS_VERSION,modelId:d.id,referenceDate:d.periodEnd,method:c.method,capitalBasis:c.capitalBasis||'reported',classification:'Source-dated conditional claims approximation, not a complete fair-value appraisal',cash,mappedDebt:d.mappedDebt,commonShares:d.commonShares,basicShares,allocationShares:shares,equityBeforeWarrants,warrantClaim,warrantCount,exerciseShares,exerciseCash,additionalClaims:extraClaims+warrantClaim,additionalAssets:extraAssets,rows,dividends,warnings,sources:d.sources,economicShareBasis:currentEconomicShareBasis(snapshot,draft),inputs:clone(c)}};
}
export function claimsSensitivity(snapshot,draft){
 const d=claimsDefinition(snapshot);if(!d)return [];
 const c=draft.claims,variants=d.type==='resolved-awards'?resolvedVariants(d):d.type==='convertible'
  ? [['Disclosed note fair value',{method:'fair-value',noteFairValue:d.convertibleFairValue}],['Note fair value +25%',{method:'fair-value',noteFairValue:d.convertibleFairValue*1.25}],['Principal only · omits option',{method:'principal-only'}],['Immediate full-share conversion',{method:'if-converted'}],['Initially vested warrant count',{warrantCoverage:'initially-vested'}],...(d.knownTransactions?[['Known ATM pro forma · interim change assumed',{capitalBasis:'known-transactions'}]]:[])]
  : [['Maximum conversion shares',{method:'if-converted',conversionCase:'maximum'}],['Minimum conversion shares',{method:'if-converted',conversionCase:'minimum'}],['Preferred principal proxy',{method:'liquidation-proxy'}],['Preferred dividends · 0% discount',{method:'if-converted',dividendDiscountRate:0}],['Preferred dividends · 12% discount',{method:'if-converted',dividendDiscountRate:.12}],['Noncurrent investments · 25% haircut',{noncurrentInvestmentValue:d.noncurrentInvestments*.75}],['Current equity securities · 25% haircut',{currentEquityHaircut:.25}]];
 return variants.map(([label,changes])=>{try{const v=valueCurrentWithClaims(snapshot,{...draft,claims:{...c,...changes}});return {label,perShare:v.perShare,rawPerShare:v.rawPerShare,changes};}catch(e){return {label,error:e.message,changes};}});
}
