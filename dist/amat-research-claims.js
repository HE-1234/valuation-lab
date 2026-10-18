import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function calculateAmatBridge(d,enterprise,options={}){
 const r=incrementalRecord(d?.ticker),b=r?.bridge;
 if(b?.type!=='amat-v3'||!incrementalIdentityValid(d))throw Error('Incremental research source, audit, dates and security identity must match the reviewed company package.');
 if(!finite(enterprise))throw Error('Operating EV must be finite; negative values are supported.');
 if(options.outputCurrency&&options.outputCurrency!==b.currency)throw Error('No verified FX mapping: retain native reporting-currency output.');
 if(options.securityBasis&&options.securityBasis!=='ordinary-common')throw Error('No verified alternate-security mapping: retain ordinary/common-share output.');
 if(options.informationAsOf&&options.informationAsOf!==r.identity.informationAsOf)throw Error('Incremental information date must match the audited package.');
 const allowed=new Set([...b.options.map(x=>x.key),'calculationDate','outputCurrency','securityBasis','informationAsOf']);
 if(Object.keys(options).some(k=>!allowed.has(k)))throw Error('Unsupported incremental claim assumption; retain the saved draft for recovery.');
 const inputs={};for(const field of b.options){const value=Object.hasOwn(options,field.key)?options[field.key]:d.bridgeInputs?.[field.key];if(value===null||value===undefined){inputs[field.key]=null;continue;}if(!finite(value)||value<field.min||value>field.max)throw Error(`${field.label}: use a finite value within its explicit bounds.`);inputs[field.key]=value;}
 const date=options.calculationDate||d.discountOrigin;
 const base={modelId:r.identity.version,ticker:d.ticker,currency:d.currency,moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:b.referenceDate,capitalReferenceDate:b.referenceDate,shareReferenceDate:b.shareDate,discountOrigin:d.discountOrigin,calculationDate:date,informationAsOf:d.informationAsOf,currentCapitalVerified:false,priceComparisonEligible:false,classification:b.classification,securityBasis:b.shareBasis,claimCompleteness:b.claimCompleteness,sources:[{url:b.sourceUrl,date:b.referenceDate}],inputs,optionDefinitions:b.options,warnings:[...b.unresolved,...b.notes],unresolved:[...b.unresolved],basisMismatch:date!==b.referenceDate};
 const reasons=[];if(date!==b.referenceDate||d.timing?.mode!=='origin')reasons.push('Current-date capital and shares are unverified. The dated equity allocation is unavailable after shifting the operating valuation date.');
 if(Object.values(inputs).some(x=>x===null))reasons.push('Complete every selected claim assumption; an unknown amount is not zero.');
 const blocked=()=>({...base,status:'operating-only',eligible:false,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,reasons});if(reasons.length)return blocked();
 const taxCreditPV=b.taxCreditFace*inputs.taxCreditCollectionFraction/(1+b.assetDiscountRate)**inputs.taxCreditCollectionYears;
 const prepaidTaxPV=b.prepaidTaxFace*inputs.prepaidTaxCollectionFraction/(1+b.assetDiscountRate),overlapPV=inputs.taxAssetOverlap/(1+b.assetDiscountRate);
 // An explicit overlap correction cannot remove credit that was never granted.
 if(overlapPV>Math.min(taxCreditPV,prepaidTaxPV)){reasons.push('The duplicate-tax-asset correction exceeds a credited asset. Reconcile both recovery assumptions before combining them.');return blocked();}
 const rows=[],add=(id,label,amount,kind='claim',classification='reported source amount used as a dated claim proxy')=>rows.push({id,label,amount,kind,referenceDate:b.referenceDate,sourceUrl:b.sourceUrl,classification,currency:kind==='shares'?null:b.currency});
 add('cash','Dated cash',b.cash,'asset');add('operatingCashReserve','Operating liquidity reserve',inputs.operatingCashReserve,'claim','analyst cash reserve');
 add('fixedIncome','Fixed-income investments',b.fixedIncome,'asset');add('listedEquity','Listed investments before tax reserve',b.listedInvestments,'asset');add('listedInvestmentTaxReserve','Listed-investment tax reserve',inputs.listedInvestmentTaxReserve,'claim','analyst liquidation tax, not a reported tax basis');add('privateInvestmentRecovery','Private-investment recovery',inputs.privateInvestmentRecovery,'asset','analyst realization assumption');
 add('taxCreditPV','Investment tax-credit collection PV',taxCreditPV,'asset','reported approximate receivable × selected recovery, discounted under selected timing');add('prepaidTaxPV','Prepaid-tax collection PV',prepaidTaxPV,'asset','selected recovery discounted one year');add('taxAssetOverlap','Duplicate-tax-asset PV correction',overlapPV,'claim','one explicit overlap correction only');
 add('debt','Selected debt value',inputs.debtValue,'claim','face plus CP baseline; disclosed market proxy alternative');for(const row of b.fixedClaims)add(row.id,row.label,row.amount);
 add('existingESPPClaim','Estimated existing ESPP claim',inputs.existingESPPClaim,'claim','analyst current-rights estimate, not measured fair value');add('legacyAwards','Estimated existing-award dilution',inputs.legacyAwardShares,'shares','rounded maximum-performance proxy; alternative amounts reflect target/rounding/inclusion assumptions');
 const sum=kind=>rows.filter(row=>row.kind===kind).reduce((s,row)=>s+row.amount,0),allocationShares=b.shares+inputs.legacyAwardShares,equity=enterprise+sum('asset')-sum('claim'),rawPerShare=equity/allocationShares;
 if(![equity,allocationShares,rawPerShare].every(finite)||allocationShares<=0)throw Error('Nonfinite research capital allocation.');
 return {...base,status:'conditional',eligible:true,rows,assetTotal:sum('asset'),claimTotal:sum('claim'),equity,rawPerShare,perShare:rawPerShare,flooredPerShare:Math.max(0,rawPerShare),equityFloor:Math.max(0,equity),allocationShares,basicShares:b.shares,allocationLabel:'Conditional fiscal-origin common allocation'};
}
