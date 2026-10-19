// KEYS annual adapter: preserve reviewed rolling-July periods and source-year
// CSG/EISG mix. Entered reinvestment is checked, never normalized or repaired.
import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
import {validateKeysInputs,keysSourceComponents,evaluateKeysSchedule,keysFinite,keysFiniteTree,keysError} from './keys-financial-engine.js';
export const KEYS_ADAPTER_NOTES=Object.freeze({
 scope:'Conditional dated operating-value study: July 31, 2026 capital anchor, August 27, 2026 common shares and October 19, 2026 information cutoff. No current price target, upside, expected return, recommendation, historical backtest or ranking.',
 mapping:'Edited aggregate revenue retains each selected source year’s CSG/EISG revenue mix. This fixed-mix analytical mapping is an assumption, not a calibrated segment forecast.',
 periods:'The ten forecast periods end July 31, 2027–2036. They are rolling annual model periods, not Keysight October fiscal years or management-guidance periods.',
 capital:'Gross capex less physical depreciation, acquisition/intangible renewal, marginal NWC and changes in required operating cash are retained. The phased sustainable ROIC floor applies in years 8–10. Entered annual investment must satisfy both floors; it is never silently repaired.',
 convergence:'Final CSG/EISG growth, margin, tax and WACC must converge to terminal assumptions. Final annual and terminal investment equal the greater of operating needs and sustainable ROIC investment; the bear case binds to operating needs. The implied reinvestment ROIC can therefore be below the entered ceiling.',
 funding:'Each edit and simulation trial recomputes interest, dated debt repayments, cash floors, debt headroom, emergency equity, issuance fees and shares. Funding-required cases suppress enterprise, equity and per-share headlines. Funding diagnostics are not financing-adjusted fair values: emergency-debt repayment/refinancing, revolver expiry, intra-year liquidity and detailed covenants are not modeled.',
 shares:'Allocation uses 170.244745 million common shares at August 27, 2026, 27 days after the July 31 balance sheet. These are actual common shares, not weighted-average diluted EPS shares. No grant-by-grant outstanding award valuation is claimed.',
 claims:'The capital bridge deducts $2,550 million face debt once; principal repayments affect liquidity, not FCFF. Restricted cash of $17 million and long-term investments of $188 million are excluded. Retirement and derivative reserves are conservative assumptions.',
 expenses:'SBC, R&D and operating-lease costs remain economic operating expenses. No SBC or acquired-amortization addback, lease-debt double deduction, assumed buybacks or duplicate purchase consideration is added. The renewal allowance is not funding for an unannounced major acquisition.',
 assumptions:'Future growth, economic margins, tax, capital intensity, terminal ROIC, WACC and funding terms are analyst assumptions. Named bear/base/bull cases are not probabilities, a confidence interval or an expected value.'
});
export const KEYS_ERRORS=Object.freeze({
 identity:'KEYS source, dates and common-share identity must match the reviewed package.',
 controls:'KEYS funding and claim controls require finite values within their stated bounds.',
 fields:'Unsupported KEYS draft or funding field. Retain the saved draft for recovery.',
 horizon:'KEYS supports ten rolling annual periods ending July 31, 2027–2036 only.',
 timing:'KEYS July 31 timing is fixed. A different date requires a newly reviewed capital bridge.',
 funding:'KEYS requires external funding. No enterprise, equity or per-share headline is released; any dilution figure is a diagnostic only.',
 stale:'KEYS operating value must match the current scenario and funding assumptions.',
 basis:'KEYS allocation requires dated USD and 170.244745 million August 27 common shares.',
 nonpositive:'KEYS conditional equity is nonpositive. No enterprise, equity or per-share headline is released.'
});
const fail=m=>{throw keysError(m);};
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const keysExact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const near=(x,y)=>Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-11);
const ROOT_KEYS=new Set(['schemaVersion','profileId','version','incrementalResearch','caseId','sourceScenario','forecastHorizonYears','ticker','currency','informationAsOf','discountOrigin','anchor','annual','terminal','timing','bridgeInputs','notes','userEdited','capitalPolicy','updatedAt','researchSimulationConfig','researchPreset','selectedIncrementalScenario','marginPath']);
export const KEYS_OPTION_KEYS=Object.freeze(['minimumOperatingCash','pensionReserve','otherClaimReserve','cashFloorRatio','emergencyDebtCapacity','emergencyInterest','equityIssuePrice','equityFee']);
export function keysContext(d,overrides={}){
 if(!object(d))fail(KEYS_ERRORS.fields);
 const r=incrementalRecord(d.ticker);
 if(r?.bridge.type!=='keys-v1'||!incrementalIdentityValid(d))fail(KEYS_ERRORS.identity);
 if(!object(overrides)||!keysExact(d.bridgeInputs,KEYS_OPTION_KEYS)||Object.keys(overrides).some(k=>!KEYS_OPTION_KEYS.includes(k))||Object.keys(d).some(k=>!ROOT_KEYS.has(k)))fail(KEYS_ERRORS.fields);
 const c=d.selectedIncrementalScenario?r.alternatives.find(x=>x.name===d.selectedIncrementalScenario)?.annualCase:r.annualCase;
 if(!c||!own(r.sourceInputs.cases,c.sourceScenario||'base'))fail(KEYS_ERRORS.identity);
 const m=structuredClone(r.sourceInputs),s=m.cases[c.sourceScenario||'base'],values={...d.bridgeInputs,...overrides};
 const definitions=new Map(r.bridge.options.map(f=>[f.key,f]));
 for(const key of KEYS_OPTION_KEYS){const f=definitions.get(key),v=values[key];if(!f||!keysFinite(v)||(keysFinite(f.min)&&v<f.min)||(keysFinite(f.max)&&v>f.max)||(f.exclusiveMinimum&&v===f.min))fail(KEYS_ERRORS.controls);}
 const b=m.capital;b.minimum_operating_cash=values.minimumOperatingCash;b.pension_reserve=values.pensionReserve;b.other_claim_reserve=values.otherClaimReserve;
 const mapping={cashFloorRatio:'cash_floor_ratio',emergencyDebtCapacity:'emergency_debt_capacity',emergencyInterest:'emergency_interest',equityIssuePrice:'equity_issue_price',equityFee:'equity_fee'};
 for(const [k,target]of Object.entries(mapping))s[target]=values[k];validateKeysInputs(m,s);
 if(b.shares!==170.244745||b.restricted_cash_included!==0||b.long_term_investments_included!==0)fail(KEYS_ERRORS.basis);
 if(d.schemaVersion!==1||d.forecastHorizonYears!==10||!Array.isArray(d.annual)||d.annual.length!==10||Object.keys(d.annual).length!==10)fail(KEYS_ERRORS.horizon);
 if(!keysExact(d.timing,['mode','asOf','stubFCFF','stubDiscountRate','reason'])||d.timing.mode!=='origin'||d.discountOrigin!=='2026-07-31'||d.informationAsOf!=='2026-10-19'||d.timing.asOf!==d.informationAsOf||d.timing.stubFCFF!==null||!keysFinite(d.timing.stubDiscountRate)||d.timing.stubDiscountRate<=0||d.timing.stubDiscountRate>1||typeof d.timing.reason!=='string')fail(KEYS_ERRORS.timing);
 if(typeof d.notes!=='string'||typeof d.userEdited!=='boolean'||typeof d.capitalPolicy!=='string'||!(d.updatedAt===null||typeof d.updatedAt==='string'))fail(KEYS_ERRORS.fields);
 const source=keysSourceComponents(m,s);
 const annual=d.annual.map((row,i)=>{
  if(!keysExact(row,['year','period','revenue','margin','taxRate','reinvestment','wacc'])||row.year!==i+1||row.period!==c.annual[i].period||!['revenue','margin','taxRate','reinvestment','wacc'].every(k=>keysFinite(row[k]))||row.revenue<=0||row.margin<-.5||row.margin>1||row.taxRate<0||row.taxRate>.6||row.reinvestment<0||row.wacc<.001||row.wacc>.5)fail('KEYS annual inputs require finite values, supported bounds and the reviewed rolling-July schedule.');
  const ref=source[i],factor=row.revenue/(ref.csg+ref.eisg);
  return {csg:ref.csg*factor,eisg:ref.eisg*factor,margin:row.margin,taxRate:row.taxRate,wacc:row.wacc,reinvestment:row.reinvestment};
 });
 if(!keysExact(d.terminal,['growth','margin','taxRate','roic','wacc']))fail('KEYS terminal inputs require the exact supported finite schema.');
 return {r,c,m,s,values,annual};
}
export function calculateKeysOperating(d,overrides={}){
 const ctx=keysContext(d,overrides),{m,s,r}=ctx,result=evaluateKeysSchedule(m,s,ctx.annual,d.terminal);
 if(result.funding_required){const e=keysError(KEYS_ERRORS.funding,'unsupported_funding_gap');Object.assign(e,{peakUnfundedGap:result.peak_funding_gap,fundingRequired:true,fundingDiagnostics:result});throw e;}
 if(result.conditional_value_per_share===null){const e=keysError(KEYS_ERRORS.nonpositive,'nonpositive_equity');e.fundingDiagnostics=result;throw e;}
 let prior=d.anchor.revenue,cumulative=0,trough=0;
 const rows=result.rows.map((row,i)=>{const entered=d.annual[i],growth=row.revenue/prior-1,delta=row.revenue-prior;prior=row.revenue;cumulative+=row.fcff;trough=Math.min(trough,cumulative);return {...entered,...row,growth,margin:row.ebit_margin,discountFactor:row.discount_factor,pv:row.pv_fcff,cumulativeFCFF:cumulative,derivedSalesCapital:row.reinvestment!==0?delta/row.reinvestment:null,physicalNetCapex:row.gross_capex-row.depreciation,renewalReinvestment:row.acquisition_reinvestment,incrementalNWC:row.delta_nwc,incrementalOperatingCash:row.delta_operating_cash,requiredInvestment:row.required_reinvestment,fundingFloor:row.required_reinvestment,enteredReinvestment:entered.reinvestment,investmentFloorTopUp:0,liquidityAfterReservedClaims:row.cash_end,liquidityAboveFloor:row.cash_end-row.cash_floor};});
 const t=d.terminal,last=rows[9],revenue=last.revenue*(1+t.growth),ebit=revenue*t.margin;
 const terminal={...t,revenue,ebit,nopat:result.terminal_nopat,reinvestment:result.terminal_reinvestment,fcff:result.terminal_fcff,value:result.terminal_fcff/(t.wacc-t.growth),pv:result.terminal_pv,discountFactor:last.discountFactor,physicalNetCapex:revenue*(s.capex_ratio[9]-s.depreciation_ratio[9]),renewalReinvestment:revenue*s.acquisition_reinvestment_ratio[9],incrementalNWC:(revenue-last.revenue)*s.marginal_nwc,incrementalOperatingCash:(revenue-last.revenue)*s.cash_floor_ratio,fundingFloor:result.terminal_reinvestment,operatingFloor:result.terminal_operating_floor,roicFloor:result.terminal_roic_floor,impliedReinvestmentRoic:result.terminal_implied_reinvestment_roic,fcffGrowth:last.fcff!==0?result.terminal_fcff/last.fcff-1:null,revenueGrowthEndpointDifference:last.growth-t.growth};
 const liquidityTests=[{point:'opening_after_reserved_claims',cash:result.opening_cash_before_financing,minimum:m.capital.minimum_operating_cash},...rows.map(x=>({point:x.period_end,cash:x.cash_end,minimum:x.cash_floor}))];
 return keysFiniteTree({ticker:'KEYS',currency:'USD',informationAsOf:d.informationAsOf,discountOrigin:d.discountOrigin,rows,terminal,forecastPV:result.explicit_pv,terminalPV:result.terminal_pv,enterprise:result.enterprise_value,terminalShare:result.terminal_share,peakEconomicDeficit:Math.max(0,-trough),negativeFCFFYears:rows.filter(x=>x.fcff<0).length,liquidityTests,minimumModeledLiquidity:Math.min(...liquidityTests.map(x=>x.cash-x.minimum)),peakUnfundedGap:result.peak_funding_gap,fundingRequired:false,fundingFeesPV:result.pv_funding_fees,openingReservedCash:m.capital.pension_reserve+m.capital.other_claim_reserve+m.capital.minimum_operating_cash,openingSurplus:result.capital_bridge,warnings:[...Object.values(KEYS_ADAPTER_NOTES),...(r.bridge.notes||[])],classification:KEYS_ADAPTER_NOTES.scope,segmentMapping:KEYS_ADAPTER_NOTES.mapping,capitalTransitionPolicy:KEYS_ADAPTER_NOTES.convergence,historicalBacktestEligible:false,currentValuationEligible:false,rankingEligible:false});
}
export function calculateKeysBridge(d,enterprise,options={}){
 if(!object(options))fail(KEYS_ERRORS.fields);
 const extra={...options};for(const k of ['calculationDate','outputCurrency','securityBasis','informationAsOf'])delete extra[k];
 if(options.calculationDate!==undefined&&options.calculationDate!==d?.discountOrigin||options.outputCurrency!==undefined&&options.outputCurrency!=='USD'||options.securityBasis!==undefined&&options.securityBasis!=='ordinary-common'||options.informationAsOf!==undefined&&options.informationAsOf!==d?.informationAsOf)fail(KEYS_ERRORS.basis);
 const {r,m,values}=keysContext(d,extra),op=calculateKeysOperating(d,extra),b=m.capital;
 if(!keysFinite(enterprise)||!near(enterprise,op.enterprise))fail(KEYS_ERRORS.stale);
 const claims=b.debt_face+b.pension_reserve+b.other_claim_reserve+b.minimum_operating_cash,equity=enterprise+b.unrestricted_cash-claims-op.fundingFeesPV,perShare=equity/b.shares;
 const rows=[['cash','July 31 unrestricted cash',b.unrestricted_cash,'asset'],['debt','Face debt principal; repaid only in liquidity',b.debt_face,'claim'],['pensionReserve','Retirement and postretirement reserve',b.pension_reserve,'claim'],['otherClaimReserve','Derivative and other-claim reserve',b.other_claim_reserve,'claim'],['operatingCash','Opening required operating cash',b.minimum_operating_cash,'claim'],['excludedInvestments','Long-term investments excluded',0,'asset'],['restrictedCash','Restricted cash excluded',0,'asset']].map(([id,label,amount,kind])=>({id,label,amount,kind,currency:'USD',referenceDate:d.discountOrigin,classification:'Conditional dated research'}));
 return keysFiniteTree({modelId:r.identity.version,ticker:'KEYS',currency:'USD',moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:d.discountOrigin,capitalReferenceDate:'2026-07-31',shareReferenceDate:'2026-08-27',discountOrigin:d.discountOrigin,calculationDate:d.discountOrigin,informationAsOf:d.informationAsOf,currentCapitalVerified:false,priceComparisonEligible:false,asKnownBacktestEligible:false,currentValuationEligible:false,historicalBacktestEligible:false,rankingEligible:false,classification:r.bridge.classification,securityBasis:r.bridge.shareBasis,claimCompleteness:'conditional',sources:r.sources.filter(x=>x.url),inputs:values,optionDefinitions:r.bridge.options,warnings:[...Object.values(KEYS_ADAPTER_NOTES),...(r.bridge.notes||[]),...(r.bridge.unresolved||[])],unresolved:r.bridge.unresolved||[],basisMismatch:false,claimRepricedPerTrial:true,claimAllocationModel:'keys-conditional-v1',status:'conditional',eligible:true,rows,assetTotal:b.unrestricted_cash,claimTotal:claims+op.fundingFeesPV,equity,perShare,rawPerShare:perShare,economicEquityDiagnostic:equity,diagnosticPerShare:perShare,allocationShares:b.shares,basicShares:b.shares,shareCountIsProxy:false,equityPoolBeforeExistingEquityClaims:equity,minimumModeledLiquidity:op.minimumModeledLiquidity,peakUnfundedGap:op.peakUnfundedGap,fundingRequired:false,fundingFeesPV:op.fundingFeesPV,allocationLabel:'Conditional USD value per common share; 170.244745 million August 27 shares, 27 days after July 31 capital'});
}
export function calculateKeysSensitivity(d){
 const op=calculateKeysOperating(d);
 const rates=[-.01,0,.01].map(shift=>{const next=structuredClone(d);next.annual.forEach(r=>r.wacc+=shift);next.terminal.wacc+=shift;try{return {waccShift:shift,enterprise:calculateKeysOperating(next).enterprise};}catch(e){return {waccShift:shift,enterprise:null,error:e.message};}});
 return {base:op.enterprise,normalized:op.enterprise,normalizationDelta:0,normalizedTerminalFCFFGrowth:op.terminal.fcffGrowth,normalizationLabel:'KEYS retains the entered investment schedule and the greater of operating needs and sustainable ROIC investment; no automatic capital repair.',rates};
}
