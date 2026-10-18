import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
import {operatingCashReserve} from './fn-operating-cash.js';
import {allocateFnEquity} from './fn-option-allocation.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function calculateFnBridge(d,enterprise,options={}){
 const r=incrementalRecord(d?.ticker),b=r?.bridge;
 if(b?.type!=='fn-v1'||!incrementalIdentityValid(d))throw Error('Incremental research source, audit, dates and security identity must match the reviewed company package.');
 if(!finite(enterprise))throw Error('Operating EV must be finite; negative values are supported.');
 if(options.outputCurrency&&options.outputCurrency!=='USD')throw Error('No verified FX mapping: retain native reporting-currency output.');
 if(options.securityBasis&&options.securityBasis!=='ordinary-common')throw Error('No verified alternate-security mapping: retain ordinary/common-share output.');
 if(options.informationAsOf&&options.informationAsOf!==r.identity.informationAsOf)throw Error('Incremental information date must match the audited package.');
 const allowed=new Set([...b.options.map(x=>x.key),'calculationDate','outputCurrency','securityBasis','informationAsOf']);
 if(Object.keys(options).some(k=>!allowed.has(k)))throw Error('Unsupported incremental claim assumption; retain the saved draft for recovery.');
 const inputs={};for(const field of b.options){const value=Object.hasOwn(options,field.key)?options[field.key]:d.bridgeInputs?.[field.key];if(value===null||value===undefined){inputs[field.key]=null;continue;}if(!finite(value)||value<field.min||value>field.max)throw Error(`${field.label}: use a finite value within its explicit bounds.`);inputs[field.key]=value;}
 const date=options.calculationDate||d.discountOrigin;
 const base={modelId:r.identity.version,ticker:'FN',currency:'USD',moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:b.referenceDate,capitalReferenceDate:b.referenceDate,shareReferenceDate:b.shareDate,discountOrigin:d.discountOrigin,calculationDate:date,informationAsOf:d.informationAsOf,currentCapitalVerified:false,currentEquity:null,priceComparisonEligible:false,asKnownBacktestEligible:false,classification:b.classification,securityBasis:b.shareBasis,claimCompleteness:b.claimCompleteness,sources:[{url:b.sourceUrl,date:b.referenceDate}],inputs,optionDefinitions:b.options,warnings:[...b.unresolved,...b.notes],unresolved:[...b.unresolved],basisMismatch:date!==b.referenceDate,claimAllocationModel:'fn-joint-european-v1',claimRepricedPerTrial:true,nonpositivePoolPolicy:'zero-ordinary-with-explicit-shortfall'};
 const reasons=[];if(date!==b.referenceDate||d.timing?.mode!=='origin')reasons.push('Current-date capital and shares are unverified. The dated equity allocation is unavailable after shifting the operating valuation date.');
 if(Object.values(inputs).some(x=>x===null))reasons.push('Complete every selected claim assumption; an unknown amount is not zero.');
 if(reasons.length)return {...base,status:'operating-only',eligible:false,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,reasons};
 const rows=[],add=(id,label,amount,kind='claim',classification='reported source amount used as a dated claim proxy')=>rows.push({id,label,amount,kind,referenceDate:b.referenceDate,sourceUrl:b.sourceUrl,classification,currency:'USD'});
 const reserve=operatingCashReserve(d);if(!finite(reserve)||reserve<0)throw Error('A finite nonnegative next-year operating cash reserve is required.');
 add('cash','Dated cash and investments',b.cash,'asset');add('reserve','Required operating cash reserve',reserve,'claim','3% of this path’s first-year sales; annual changes funded in FCFF');
 add('raytek','Raytek value proxy',inputs.raytekValue,'asset','cost-to-carrying conditional proxy; nonoperating gain excluded from EBIT');
 add('openingTax','Opening tax liability proxy',b.openingTax,'claim','includes 57.447 million Pillar Two; excluded from future-income tax settlements');
 add('severance','Existing severance claim',b.severance,'claim','opening obligation only; future employee service costs remain operating');
 add('otherNoncurrent','Other noncurrent liability claim',inputs.otherNoncurrentLiabilityClaim,'claim','explicit selected overlap-sensitive additional claim');
 add('repatriation','Repatriation tax claim',inputs.repatriationTaxClaim,'claim','conditional cash-access assumption');
 const sum=kind=>rows.filter(row=>row.kind===kind).reduce((s,row)=>s+row.amount,0),assetTotal=sum('asset'),nonEquityClaimTotal=sum('claim'),equityPool=enterprise+assetTotal-nonEquityClaimTotal;
 const allocation=allocateFnEquity({equityPool,ordinaryShares:b.shares,existingAwards:inputs.existingAwardShares,warrantShares:inputs.warrantShares,strike:b.warrantStrike,rate:b.warrantRate,volatility:inputs.warrantVolatility,years:b.warrantTerm});
 add('legacyAwards','Existing award value',allocation.awardClaim,'equity-claim','zero-strike awards at the same solved ordinary-share value');
 add('amazonWarrants','Amazon warrant value',allocation.warrantClaim,'equity-claim','joint European option approximation; intrinsic share input, no exercise-proceeds duplication');
 return {...base,status:'conditional',eligible:true,rows,assetTotal,nonEquityClaimTotal,claimTotal:nonEquityClaimTotal+allocation.awardClaim+allocation.warrantClaim,equityPoolBeforeExistingEquityClaims:equityPool,equity:allocation.ordinaryEquity,rawPerShare:allocation.ordinaryShareValue,perShare:allocation.ordinaryShareValue,flooredPerShare:allocation.ordinaryShareValue,equityFloor:allocation.ordinaryEquity,allocationShares:b.shares,basicShares:b.shares,openingOperatingCashReserve:reserve,existingAwardShares:inputs.existingAwardShares,warrantShares:inputs.warrantShares,allocation,warrantClaim:allocation.warrantClaim,awardClaim:allocation.awardClaim,unallocatedShortfall:allocation.unallocatedShortfall,allocationLabel:'Conditional coupled ordinary-share allocation'};
}
