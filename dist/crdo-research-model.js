// CRDO's bounded FY2027–36, zero-borrowing conditional model.
// Annual investment remains an explicit editable input; cash funding is retested
// after every edit/trial. The first year is a remaining fiscal stub, not a full year.
import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
import {validateCrdoInputs} from './crdo-financial-engine.js';
import {fnCallValue} from './fn-option-allocation.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const day=(a,b)=>(Date.parse(a)-Date.parse(b))/86400000;
const clone=x=>structuredClone(x);
export function crdoContext(d,overrides={}){
 const r=incrementalRecord(d?.ticker);
 if(r?.bridge.type!=='crdo-v3'||!incrementalIdentityValid(d))throw Error('CRDO source, dates and security identity must match the reviewed package.');
 const c=d.selectedIncrementalScenario?r.alternatives.find(x=>x.name===d.selectedIncrementalScenario)?.annualCase:r.annualCase;
 const m=clone(r.sourceInputs),name=c.sourceScenario||'base',s=m.scenarios[name],b=m.october_bridge;
 const values={...d.bridgeInputs,...overrides};
 const allowed=new Set(r.bridge.options.map(x=>x.key));
 if(Object.keys(values).some(k=>!allowed.has(k)))throw Error('Unsupported CRDO funding or claim input. Borrowing and new financing are not modeled.');
 for(const field of r.bridge.options){const v=values[field.key];if(!finite(v)||(finite(field.min)&&v<field.min)||(finite(field.max)&&v>field.max)||(field.exclusiveMinimum&&v===field.min))throw Error(`${field.label}: finite input within its stated bounds is required.`);}
 const mapping={operatingCashAfterWorkingCapital:'operating_cash_after_ordinary_working_capital',capitalExpenditures:'capital_expenditures',capacityDepositsPaid:'capacity_deposits_paid',rsuWithholdingCash:'rsu_withholding_cash',netRsuSharesIssued:'net_rsu_shares_issued',rsuSettlementPrice:'rsu_settlement_price'};
 for(const [key,target]of Object.entries(mapping))b[target]=values[key];
 m.funding.minimum_cash_floor=values.minimumCashFloor;s.rsu_vesting_probability=values.rsuVestingProbability;s.psu_vesting_probability=values.psuVestingProbability;s.earnout_probability=values.earnoutProbability;m.option_volatility=values.optionVolatility;
 validateCrdoInputs(m);
 if(d.schemaVersion!==1||d.annual?.length!==10||d.forecastHorizonYears!==10)throw Error('CRDO supports the reviewed ten-year FY2027–36 schedule only. A different horizon needs a new funding and award model.');
 if(d.timing?.mode!=='origin')throw Error('CRDO October timing is fixed. Changing the date requires a newly reviewed operating and capital bridge.');
 const allowedDraftKeys=new Set(['schemaVersion','profileId','version','incrementalResearch','caseId','sourceScenario','forecastHorizonYears','ticker','currency','informationAsOf','discountOrigin','anchor','annual','terminal','timing','bridgeInputs','notes','userEdited','capitalPolicy','updatedAt','researchSimulationConfig','researchPreset','selectedIncrementalScenario','marginPath']);
 if(Object.keys(d).some(k=>!allowedDraftKeys.has(k)))throw Error('Unsupported CRDO draft field. Borrowing, additional debt and new financing are not modeled.');
 if(!finite(values.optionVolatility*values.optionVolatility*m.option_term))throw Error('CRDO option-volatility arithmetic is outside the finite supported domain. No valuation released.');
 const annualKeys=new Set(['year','period','revenue','margin','taxRate','reinvestment','wacc']);
 for(const [i,row]of d.annual.entries()){
  if(!row||Object.keys(row).some(k=>!annualKeys.has(k))||row.year!==i+1||row.period!==c.annual[i].period||!['revenue','margin','taxRate','reinvestment','wacc'].every(k=>finite(row[k]))||row.revenue<=0||row.margin<-.5||row.margin>1||row.taxRate<0||row.taxRate>.6||row.wacc<=0||row.wacc>1)throw Error('CRDO annual inputs must retain finite values, valid domains and the supported schedule fields.');
 }
 const t=d.terminal;
 if(!t||Object.keys(t).some(k=>!['growth','margin','taxRate','roic','wacc'].includes(k))||!['growth','margin','taxRate','roic','wacc'].every(k=>finite(t[k]))||t.growth<0||t.growth>.05||t.margin<=0||t.margin>1||t.taxRate<0||t.taxRate>.6||t.roic<=t.growth||t.wacc<=t.growth||t.wacc>1)throw Error('CRDO terminal inputs are outside the supported finite domain.');
 if(d.annual[0].revenue<=m.q1fy2027_actual_revenue)throw Error('CRDO FY2027 revenue must exceed reported Q1 revenue.');
 const dates=m.dates,elapsed=day(dates.current_date,dates.balance_date),remaining=day(dates.first_forecast_end,dates.current_date),stub=day(dates.first_forecast_end,dates.balance_date);
 const cash=m.cash_and_investments+b.operating_cash_after_ordinary_working_capital-b.capital_expenditures-b.capacity_deposits_paid-b.rsu_withholding_cash,shares=m.ordinary_shares+b.net_rsu_shares_issued,remainingRSUs=m.rsus-b.net_rsu_shares_issued-b.rsu_withholding_cash/b.rsu_settlement_price;
 return {r,m,s,name,values,cash,shares,remainingRSUs,elapsed,remaining,stub};
}
export function calculateCrdoOperating(d,overrides={}){
 const ctx=crdoContext(d,overrides),{m,s,values,cash,remaining,stub}=ctx;
 let prior=d.anchor.revenue,discount=1,pv=0,cumulative=0,trough=0,liquidity=cash-m.technology_license_debt-m.cash_contingent_consideration;
 const floor=values.minimumCashFloor,tests=[{point:'opening_after_claim_reserve',cash:liquidity,minimum:floor}];
 const rows=d.annual.map((r,index)=>{
  const ebit=r.revenue*r.margin,tax=ebit*r.taxRate,nopat=ebit-tax;
  const fraction=index===0?(r.revenue-m.q1fy2027_actual_revenue)/r.revenue*remaining/stub:1;
  const deposit=index===0?s.capacity_deposit_outflow-values.capacityDepositsPaid:0,recovery=s.capacity_deposit_recovery[index];
  const fcff=(nopat-r.reinvestment)*fraction-deposit+recovery,duration=index===0?remaining/m.dates.day_count_denominator:1;
  discount*=(1+r.wacc)**duration;const presentValue=fcff/discount;pv+=presentValue;cumulative+=fcff;trough=Math.min(trough,cumulative);
  if(index===0)tests.push({point:'first_stub_deposit_before_operating_receipts',cash:liquidity-deposit,minimum:floor});
  liquidity+=fcff;tests.push({point:`FY${2027+index}_end`,cash:liquidity,minimum:floor});
  const growth=r.revenue/prior-1,delta=r.revenue-prior;prior=r.revenue;
  if(![ebit,tax,nopat,fcff,discount,presentValue,pv,liquidity].every(finite))throw Error('CRDO arithmetic is outside the finite supported domain. No valuation released.');
  return {...r,growth,ebit,tax,nopat,fcff,remainingOperatingFraction:fraction,capacityDeposit:deposit,capacityRecovery:recovery,discountFactor:discount,pv:presentValue,cumulativeFCFF:cumulative,liquidityAfterReservedClaims:liquidity,derivedSalesCapital:r.reinvestment!==0?delta/r.reinvestment:null};
 });
 const gaps=tests.filter(x=>x.cash<x.minimum).map(x=>({...x,shortfall:x.minimum-x.cash}));
 if(gaps.length){const e=Error(`CRDO requires funding beyond this zero-borrowing model. Maximum modeled cash shortfall: ${Math.max(...gaps.map(x=>x.shortfall)).toFixed(2)} USDm. No enterprise, common-equity or per-share value is released.`);e.status='unsupported_funding_gap';e.fundingGaps=gaps;e.enterprise=null;e.equity=null;e.perShare=null;throw e;}
 const t=d.terminal,last=rows.at(-1),revenue=last.revenue*(1+t.growth),ebit=revenue*t.margin,nopat=ebit*(1-t.taxRate),reinvestment=nopat*t.growth/t.roic,fcff=nopat-reinvestment,value=fcff/(t.wacc-t.growth),terminalPV=value/discount,enterprise=pv+terminalPV;
 if(![revenue,ebit,nopat,reinvestment,fcff,value,terminalPV,enterprise].every(finite))throw Error('CRDO terminal arithmetic is outside the finite supported domain.');
 if(enterprise+cash-m.technology_license_debt-m.cash_contingent_consideration<=0)throw Error('CRDO nonpositive equity pool needs unsupported distress mechanics. No enterprise, equity or per-share value released.');
 crdoAllocation(ctx,enterprise); // Guard allocation before publishing even operating EV.
 const terminal={...t,revenue,ebit,nopat,reinvestment,fcff,value,pv:terminalPV,discountFactor:discount,fcffGrowth:last.fcff?fcff/last.fcff-1:null,revenueGrowthEndpointDifference:last.growth-t.growth};
 const result={ticker:'CRDO',currency:'USD',informationAsOf:d.informationAsOf,discountOrigin:d.discountOrigin,rows,terminal,forecastPV:pv,terminalPV,enterprise,terminalShare:enterprise>0?terminalPV/enterprise:null,peakEconomicDeficit:Math.max(0,-trough),negativeFCFFYears:rows.filter(x=>x.fcff<0).length,liquidityTests:tests,minimumModeledLiquidity:Math.min(...tests.map(x=>x.cash)),estimatedCash:cash,estimatedShares:ctx.shares,warnings:[ctx.r.prose.scope.en,ctx.r.prose.funding.en,ctx.r.prose.claimLimits.en],classification:'Dated October analyst-conditional operating value; interim cash and shares estimated. Annual/stub funding check, not intra-quarter solvency.'};
 const scan=x=>{if(typeof x==='number'&&!finite(x))throw Error('CRDO derived output is not finite. No valuation released.');if(x&&typeof x==='object')Object.values(x).forEach(scan);};scan(result);return result;
}

function crdoAllocation(ctx,enterprise){
 const {m,s,values,cash,shares,remainingRSUs,elapsed}=ctx;
 const debtLike=m.technology_license_debt+m.cash_contingent_consideration,pool=enterprise+cash-debtLike,rsu=remainingRSUs*s.rsu_vesting_probability,psu=m.psus*s.psu_vesting_probability,earnout=m.earnout_max_shares*s.earnout_probability,restricted=m.exchangeable_subsidiary_restricted_shares*m.october_bridge.restricted_share_vesting_probability,term=m.option_term-elapsed/m.dates.day_count_denominator;
 if(!finite(pool)||pool<=0)throw Error('CRDO equity pool is unsupported. No enterprise, equity or per-share value released.');
 let lo=.000001,hi=Math.max(pool/shares,1);
 const option=p=>m.options*fnCallValue(p,m.option_strike,m.macro.rf_current,values.optionVolatility,term);
 for(let i=0;i<150;i++){const mid=(lo+hi)/2;if((shares+rsu+psu+earnout+restricted)*mid+option(mid)>pool)hi=mid;else lo=mid;}
 const price=(lo+hi)/2,award=(rsu+psu+earnout+restricted)*price,optionClaim=option(price),equity=pool-award-optionClaim;
 if(![price,equity,award,optionClaim].every(finite)||Math.abs(equity/shares-price)>1e-8)throw Error('CRDO claim allocation failed; no value released.');
 return {debtLike,pool,rsu,psu,earnout,restricted,term,price,award,optionClaim,equity};
}
export function calculateCrdoBridge(d,enterprise,options={}){
 const extra={...options};for(const k of ['calculationDate','outputCurrency','securityBasis','informationAsOf'])delete extra[k];
 if(options.calculationDate&&options.calculationDate!==d.discountOrigin||options.outputCurrency&&options.outputCurrency!=='USD'||options.securityBasis&&options.securityBasis!=='ordinary-common'||options.informationAsOf&&options.informationAsOf!==d.informationAsOf)throw Error('CRDO allocation requires its dated USD ordinary-share basis.');
 const ctx=crdoContext(d,extra),{r,m,s,values,cash,shares,remainingRSUs,elapsed}=ctx;
 // Recompute funding with the same effective claim/bridge inputs. Never allocate
 // a stale EV supplied by a caller after the operating scenario became invalid.
 const op=calculateCrdoOperating(d,extra);
 if(!finite(enterprise)||Math.abs(op.enterprise-enterprise)>Math.max(1e-8,Math.abs(op.enterprise)*1e-10))throw Error('CRDO operating value must match the current funded scenario.');
 const {debtLike,pool,rsu,psu,earnout,term,price,award,optionClaim,equity}=crdoAllocation(ctx,enterprise);
 const base={modelId:r.identity.version,ticker:'CRDO',currency:'USD',moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:d.discountOrigin,capitalReferenceDate:'2026-08-01',shareReferenceDate:'2026-08-01',discountOrigin:d.discountOrigin,calculationDate:d.discountOrigin,informationAsOf:d.informationAsOf,currentCapitalVerified:false,priceComparisonEligible:false,asKnownBacktestEligible:false,classification:r.bridge.classification,securityBasis:r.bridge.shareBasis,claimCompleteness:'conditional',sources:r.sources.filter(x=>x.url),inputs:values,optionDefinitions:r.bridge.options,warnings:[...r.bridge.notes,...r.bridge.unresolved],unresolved:r.bridge.unresolved,basisMismatch:false,claimRepricedPerTrial:true,claimAllocationModel:'crdo-conditional-v3'};
 const rows=[['cash','Estimated October cash and investments',cash,'asset'],['debtLike','Technology-license and cash earnout claims',debtLike,'claim'],['awards','Conditional existing awards and earnout shares',award,'equity-claim'],['options','Existing option allocation',optionClaim,'equity-claim']].map(([id,label,amount,kind])=>({id,label,amount,kind,currency:'USD',referenceDate:d.discountOrigin,classification:'Dated conditional allocation; October balances estimated'}));
 return {...base,status:'conditional',eligible:true,rows,assetTotal:cash,claimTotal:debtLike+award+optionClaim,equity,perShare:price,rawPerShare:price,flooredPerShare:price,equityFloor:equity,allocationShares:shares,basicShares:shares,equityPoolBeforeExistingEquityClaims:pool,awardClaim:award,optionClaim,expectedRSUs:rsu,expectedPSUs:psu,expectedEarnout:earnout,remainingOptionTerm:term,minimumModeledLiquidity:op.minimumModeledLiquidity,allocationLabel:'Dated conditional October common allocation; estimated interim balances'};
}
