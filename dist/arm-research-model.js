// Bounded ARM v2 adapter. Aggregate edited revenue keeps each source year's
// royalty/license/silicon mix; the same additive margin change applies to IP and
// silicon. This is an explicit analytical mapping, not a calibrated forecast.
import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
import {validateArmInputs,armSourceComponents,evaluateArmSchedule,armFinite,armFiniteTree,armError} from './arm-financial-engine.js';
export const ARM_ADAPTER_NOTES=Object.freeze({
 scope:'June 30, 2026 capital anchor from the Q1 FY2027 6-K, with information through October 20, 2026. The first cash flow is the nine months after reported Q1. Conditional restated-date research; no historical backtest, current October target or market-price comparison.',
 mapping:'Edited aggregate revenue retains the selected source year’s royalty, license and silicon proportions. A common additive margin shift applies to IP and silicon. This fixed-mix analytical mapping is an assumption, not a calibrated segment forecast.',
 capital:'Annual investment is the entered post-transition amount. Required working capital and operating cash are recalculated from the edited segment revenues. Net productive investment must satisfy the explicit analyst floors; it is never clipped or topped up.',
 convergence:'Final royalty, license and silicon revenues must converge to terminal growth, including zero-base silicon. Final margin and tax must match terminal assumptions, and final investment must equal NOPAT × growth / ROIC. Coupled edits are required; incompatible independent draws are excluded.',
 funding:'Each edit and trial recomputes cash, required operating cash, debt capacity, interest, equity issuance, fees and shares. If external funding is required, enterprise, equity and ADS headlines are withheld. The dilution diagnostic is only a share-count illustration, not financing-adjusted fair value.',
 shares:'One ADS represents one ordinary share. Allocation uses 1,068 million June 30 ordinary shares as filed, rounded to the nearest million. SBC stays in EBIT under the economic cash-replacement policy; no SBC addback or assumed future SBC dilution.',
 reserves:'The nominal $265 million DreamBig acquisition, closed July 1, is reserved once at June 30. All $589 million equity investments are excluded, including $290 million publicly listed. Finance leases use a conservative $70 million bound because the noncurrent portion is not separately filed.'
});
export const ARM_STUB_PERIOD='FY2027 · Jul–Mar after reported Q1';
export const ARM_ERRORS=Object.freeze({
 identity:'ARM source, dates and security identity must match the reviewed package.',
 controls:'ARM funding and claim controls require finite values within their stated bounds.',
 fields:'Unsupported ARM draft or funding field. Retain the saved draft for recovery.',
 horizon:'ARM supports the reviewed ten-year FY2027–36 schedule only.',
 timing:'ARM June 30 timing is fixed. A different date requires a newly reviewed capital bridge.',
 funding:'ARM requires external funding. No enterprise, equity or per-ADS headline is released; any dilution figure is a diagnostic only.',
 stale:'ARM operating value must match the current funded scenario.',
 basis:'ARM allocation requires its dated USD, one-ADS-per-ordinary-share basis.'
});
const fail=message=>{throw armError(message);};
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const keysExact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(x,k));
const near=(x,y)=>Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-10);
const ROOT_KEYS=new Set(['schemaVersion','profileId','version','incrementalResearch','caseId','sourceScenario','forecastHorizonYears','ticker','currency','informationAsOf','discountOrigin','anchor','annual','terminal','timing','bridgeInputs','notes','userEdited','capitalPolicy','updatedAt','researchSimulationConfig','researchPreset','selectedIncrementalScenario','marginPath']);
const OPTION_KEYS=Object.freeze(['minimumOperatingCash','acquisitionReserve','cashFloorRatio','fundingInterestRate','fundingDebtCapacityMultiple','emergencyEquityPricePerAds','equityIssuanceFee','netCapexFloorTotal','netCapexFloorIp','netCapexFloorSilicon']);
export function armContext(d,overrides={}){
 const r=incrementalRecord(d?.ticker);
 if(r?.bridge.type!=='arm-v2'||!incrementalIdentityValid(d))fail(ARM_ERRORS.identity);
 if(!object(overrides)||!object(d.bridgeInputs)||Object.keys(d).some(k=>!ROOT_KEYS.has(k)))fail(ARM_ERRORS.fields);
 const c=d.selectedIncrementalScenario?r.alternatives.find(x=>x.name===d.selectedIncrementalScenario)?.annualCase:r.annualCase;
 const m=structuredClone(r.sourceInputs),s=m.cases[c?.sourceScenario||'base'];if(!s)fail(ARM_ERRORS.identity);
 const values={...d.bridgeInputs,...overrides};
 if(!keysExact(values,OPTION_KEYS))fail(ARM_ERRORS.fields);
 const definitions=new Map(r.bridge.options.map(f=>[f.key,f]));
 for(const key of OPTION_KEYS){const f=definitions.get(key),v=values[key];if(!f||!armFinite(v)||(armFinite(f.min)&&v<f.min)||(armFinite(f.max)&&v>f.max)||(f.exclusiveMinimum&&v===f.min))fail(ARM_ERRORS.controls);}
 const b=m.capital;b.minimum_operating_cash=values.minimumOperatingCash;b.acquisition_reserve=values.acquisitionReserve;
 const mapping={cashFloorRatio:'cash_floor_ratio',fundingInterestRate:'funding_interest_rate',fundingDebtCapacityMultiple:'funding_debt_capacity_multiple',emergencyEquityPricePerAds:'emergency_equity_price_per_ads',equityIssuanceFee:'equity_issuance_fee',netCapexFloorTotal:'net_capex_floor_total',netCapexFloorIp:'net_capex_floor_ip',netCapexFloorSilicon:'net_capex_floor_silicon'};
 for(const [k,target]of Object.entries(mapping))s[target]=values[k];
 validateArmInputs(m,s);
 if(b.ordinary_shares!==r.bridge.ordinaryShares||b.ads_per_ordinary!==1||b.unquoted_equity_included!==0)fail(ARM_ERRORS.basis);
 if(d.schemaVersion!==1||d.forecastHorizonYears!==10||!Array.isArray(d.annual)||d.annual.length!==10)fail(ARM_ERRORS.horizon);
 if(!keysExact(d.timing,['mode','asOf','stubFCFF','stubDiscountRate','reason'])||d.timing.mode!=='origin'||d.discountOrigin!==r.identity.discountOrigin||d.informationAsOf!==r.identity.informationAsOf||d.timing.asOf!==d.informationAsOf||d.timing.stubFCFF!==null||!armFinite(d.timing.stubDiscountRate)||d.timing.stubDiscountRate<=0||d.timing.stubDiscountRate>1||typeof d.timing.reason!=='string')fail(ARM_ERRORS.timing);
 if(typeof d.notes!=='string'||typeof d.userEdited!=='boolean'||typeof d.capitalPolicy!=='string'||!(d.updatedAt===null||typeof d.updatedAt==='string'))fail(ARM_ERRORS.fields);
 const source=armSourceComponents(m,s);
 const annual=d.annual.map((row,i)=>{
  if(!keysExact(row,['year','period','revenue','margin','taxRate','reinvestment','wacc'])||row.year!==i+1||row.period!==c.annual[i].period||!['revenue','margin','taxRate','reinvestment','wacc'].every(k=>armFinite(row[k]))||row.revenue<=0||row.margin<-.5||row.margin>1||row.taxRate<0||row.taxRate>.6||row.wacc<.01||row.wacc>.5)fail('ARM annual inputs require finite values, supported bounds and the reviewed FY2027–36 schedule.');
  const ref=source[i],rev=ref.royalty+ref.license+ref.silicon,factor=row.revenue/rev;
  const sourceMargin=((ref.royalty+ref.license)*ref.ipMargin+ref.silicon*ref.siliconMargin)/rev,shift=row.margin-sourceMargin;
  return {royalty:ref.royalty*factor,license:ref.license*factor,silicon:ref.silicon*factor,ipMargin:ref.ipMargin+shift,siliconMargin:ref.siliconMargin+shift,taxRate:row.taxRate,wacc:row.wacc,reinvestment:row.reinvestment};
 });
 if(!keysExact(d.terminal,['growth','margin','taxRate','roic','wacc']))fail('ARM terminal inputs require the exact supported finite schema.');
 return {r,c,m,s,values,annual};
}
export function calculateArmOperating(d,overrides={}){
 const ctx=armContext(d,overrides),{m,s,r}=ctx,result=evaluateArmSchedule(m,s,ctx.annual,d.terminal);
 if(result.funding_required){const e=armError(ARM_ERRORS.funding,'unsupported_funding_gap');Object.assign(e,{peakUnfundedGap:result.peak_funding_gap,fundingRequired:true,fundingDiagnostics:result});throw e;}
 let prior=d.anchor.revenue,cumulative=0,trough=0;
 const rows=result.rows.map((row,i)=>{const entered=d.annual[i],full=row.full_year_revenue??row.revenue,growth=full/prior-1,delta=full-prior;prior=full;cumulative+=row.fcff;trough=Math.min(trough,cumulative);return {...entered,...row,growth,margin:row.ebit_margin,discountFactor:row.discount_factor,pv:row.pv_fcff,cumulativeFCFF:cumulative,derivedSalesCapital:(row.full_year_reinvestment??row.reinvestment)!==0?delta/(row.full_year_reinvestment??row.reinvestment):null,...(row.period_basis?{period:ARM_STUB_PERIOD}:{}),physicalNetCapex:row.net_capex,physicalNetCapexFloor:row.net_capex_floor,incrementalNWC:row.delta_nwc-row.delta_operating_cash,incrementalOperatingCash:row.delta_operating_cash,requiredInvestment:row.net_capex_floor+row.delta_nwc,fundingFloor:row.net_capex_floor+row.delta_nwc,enteredReinvestment:entered.reinvestment,investmentFloorTopUp:0,liquidityAfterReservedClaims:row.cash_end,liquidityAboveFloor:row.cash_end-row.cash_floor};});
 const t=d.terminal,last=rows[9],revenue=last.revenue*(1+t.growth),ebit=revenue*t.margin;
 const terminal={...t,revenue,ebit,nopat:result.terminal_nopat,reinvestment:result.terminal_reinvestment,fcff:result.terminal_fcff,value:result.terminal_fcff/(t.wacc-t.growth),pv:result.terminal_pv,discountFactor:last.discountFactor,physicalNetCapex:result.terminal_net_capex,physicalNetCapexFloor:result.terminal_net_capex_floor,incrementalNWC:result.terminal_delta_nwc,fundingFloor:result.terminal_net_capex_floor+result.terminal_delta_nwc,fcffGrowth:last.fcff!==0?result.terminal_fcff/last.fcff-1:null,revenueGrowthEndpointDifference:last.growth-t.growth};
 const liquidityTests=[{point:'opening_after_reserved_claims',cash:result.opening_cash_before_financing,minimum:m.capital.minimum_operating_cash},...rows.map(x=>({point:`FY${x.fiscal_year}_end`,cash:x.cash_end,minimum:x.cash_floor}))];
 return armFiniteTree({ticker:'ARM',currency:'USD',informationAsOf:d.informationAsOf,discountOrigin:d.discountOrigin,rows,terminal,forecastPV:result.explicit_pv,terminalPV:result.terminal_pv,enterprise:result.enterprise_value,terminalShare:result.terminal_share,peakEconomicDeficit:Math.max(0,-trough),negativeFCFFYears:rows.filter(x=>x.fcff<0).length,liquidityTests,minimumModeledLiquidity:Math.min(...liquidityTests.map(x=>x.cash-x.minimum)),peakUnfundedGap:result.peak_funding_gap,fundingRequired:false,fundingFeesPV:result.pv_funding_fees,openingReservedCash:m.capital.finance_lease+m.capital.eda_obligations+m.capital.acquisition_reserve+m.capital.minimum_operating_cash,openingSurplus:result.bridge,warnings:[...Object.values(ARM_ADAPTER_NOTES),...(r.bridge.notes||[])],classification:ARM_ADAPTER_NOTES.scope,segmentMapping:ARM_ADAPTER_NOTES.mapping,capitalTransitionPolicy:ARM_ADAPTER_NOTES.convergence,historicalBacktestEligible:false,currentValuationEligible:false,rankingEligible:false});
}
export function calculateArmBridge(d,enterprise,options={}){
 if(!object(options))fail(ARM_ERRORS.fields);
 const extra={...options};for(const k of ['calculationDate','outputCurrency','securityBasis','informationAsOf'])delete extra[k];
 if(options.calculationDate!==undefined&&options.calculationDate!==d.discountOrigin||options.outputCurrency!==undefined&&options.outputCurrency!=='USD'||options.securityBasis!==undefined&&options.securityBasis!=='ordinary-common'||options.informationAsOf!==undefined&&options.informationAsOf!==d.informationAsOf)fail(ARM_ERRORS.basis);
 const {r,m,values}=armContext(d,extra),op=calculateArmOperating(d,extra),b=m.capital;
 if(!armFinite(enterprise)||!near(enterprise,op.enterprise))fail(ARM_ERRORS.stale);
 const claims=b.finance_lease+b.eda_obligations+b.acquisition_reserve+b.minimum_operating_cash,equity=enterprise+b.cash_short_investments-claims-op.fundingFeesPV,allocationShares=b.ordinary_shares*b.ads_per_ordinary,perShare=equity/allocationShares;
 const rows=[['cash',r.bridge.referenceDate==='2026-06-30'?'June 30 cash and short-term investments':'March 31 cash and short-term investments',b.cash_short_investments,'asset'],['financeLease','Existing finance lease obligations',b.finance_lease,'claim'],['edaObligations','Existing EDA obligations',b.eda_obligations,'claim'],['acquisitionReserve','Nominal DreamBig acquisition reserve',b.acquisition_reserve,'claim'],['operatingCash','Opening required operating cash',b.minimum_operating_cash,'claim'],['equityInvestments','All equity investments excluded',0,'asset']].map(([id,label,amount,kind])=>({id,label,amount,kind,currency:'USD',referenceDate:d.discountOrigin,classification:'Conditional restated-date research'}));
 return armFiniteTree({modelId:r.identity.version,ticker:'ARM',currency:'USD',moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:d.discountOrigin,capitalReferenceDate:r.bridge.referenceDate,shareReferenceDate:r.bridge.shareDate,discountOrigin:d.discountOrigin,calculationDate:d.discountOrigin,informationAsOf:d.informationAsOf,currentCapitalVerified:false,priceComparisonEligible:false,asKnownBacktestEligible:false,currentValuationEligible:false,historicalBacktestEligible:false,rankingEligible:false,classification:r.bridge.classification,securityBasis:r.bridge.shareBasis,claimCompleteness:'conditional',sources:r.sources.filter(x=>x.url),inputs:values,optionDefinitions:r.bridge.options,warnings:[...Object.values(ARM_ADAPTER_NOTES),...(r.bridge.notes||[]),...(r.bridge.unresolved||[])],unresolved:r.bridge.unresolved||[],basisMismatch:false,claimRepricedPerTrial:true,claimAllocationModel:'arm-conditional-v2',status:'conditional',eligible:true,rows,assetTotal:b.cash_short_investments,claimTotal:claims+op.fundingFeesPV,equity,perShare,rawPerShare:perShare,economicEquityDiagnostic:equity,diagnosticPerShare:perShare,allocationShares,basicShares:b.ordinary_shares,adsPerOrdinary:b.ads_per_ordinary,shareCountIsProxy:false,equityPoolBeforeExistingEquityClaims:equity,minimumModeledLiquidity:op.minimumModeledLiquidity,peakUnfundedGap:op.peakUnfundedGap,fundingRequired:false,fundingFeesPV:op.fundingFeesPV,allocationLabel:r.bridge.referenceDate==='2026-06-30'?'Conditional USD value per ADS; one ADS per ordinary share; 1,068 million June 30 ordinary shares as filed (rounded)':'Conditional USD value per ADS; one ADS per ordinary share; 1,064.055252 million dated ordinary shares'});
}
export function calculateArmSensitivity(d){
 const op=calculateArmOperating(d);
 const rates=[-.01,0,.01].map(shift=>{const next=structuredClone(d);next.annual.forEach(r=>r.wacc+=shift);next.terminal.wacc+=shift;try{return {waccShift:shift,enterprise:calculateArmOperating(next).enterprise};}catch(e){return {waccShift:shift,enterprise:null,error:e.message};}});
 // A valid ARM draft already has strict final-year reinvestment convergence. A
 // second generic capital normalization would change the reviewed transition.
 return {base:op.enterprise,normalized:op.enterprise,normalizationDelta:0,normalizedTerminalFCFFGrowth:op.terminal.fcffGrowth,normalizationLabel:'ARM retains the entered post-transition schedule and strict endpoint consistency; no automatic capital repair.',rates};
}
