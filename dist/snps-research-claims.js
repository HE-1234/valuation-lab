import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function calculateSnpsBridge(d,enterprise,options={}){
 const r=incrementalRecord(d?.ticker),b=r?.bridge;
 if(b?.type!=='snps-v3'||!incrementalIdentityValid(d))throw Error('Incremental research source, audit, dates and security identity must match the reviewed company package.');
 if(!finite(enterprise))throw Error('Operating EV must be finite; negative values are supported.');
 if(options.outputCurrency&&options.outputCurrency!=='USD')throw Error('No verified alternate-currency mapping for SNPS.');
 if(options.securityBasis&&options.securityBasis!=='ordinary-common')throw Error('No verified alternate-security mapping for SNPS.');
 if(options.informationAsOf&&options.informationAsOf!==r.identity.informationAsOf)throw Error('Incremental information date must match the audited package.');
 const allowed=new Set([...b.options.map(x=>x.key),'calculationDate','outputCurrency','securityBasis','informationAsOf']);if(Object.keys(options).some(k=>!allowed.has(k)))throw Error('Unsupported SNPS claim assumption.');
 if(d.bridgeInputs&&Object.keys(d.bridgeInputs).some(k=>!b.options.some(f=>f.key===k)))throw Error('Unsupported SNPS saved claim assumption.');
 const inputs={};for(const field of b.options){const value=Object.hasOwn(options,field.key)?options[field.key]:d.bridgeInputs?.[field.key];if(value===null||value===undefined){inputs[field.key]=null;continue;}if(!finite(value)||value<field.min||(field.max!==null&&value>field.max))throw Error(`${field.label}: use a finite value within its explicit bounds.`);inputs[field.key]=value;}
 const date=options.calculationDate||d.discountOrigin;
 const base={modelId:r.identity.version,ticker:d.ticker,currency:'USD',moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:b.referenceDate,capitalReferenceDate:b.referenceDate,shareReferenceDate:b.referenceDate,assumedAwardReferenceDate:'2025-10-31',discountOrigin:d.discountOrigin,calculationDate:date,informationAsOf:d.informationAsOf,currentCapitalVerified:false,currentEquity:null,unconditionalEquity:null,unconditionalPerShare:null,priceComparisonEligible:false,asKnownBacktestEligible:false,inventoryCompletenessVerified:false,claimBudgetAdequacyVerified:false,classification:b.classification,securityBasis:b.shareBasis,claimCompleteness:b.claimCompleteness,sources:[{url:b.sourceUrl,date:b.referenceDate}],inputs,optionDefinitions:b.options,warnings:[...b.unresolved,...b.notes],unresolved:[...b.unresolved],basisMismatch:date!==b.referenceDate,claimAllocationModel:'snps-conditional-full-participation-v3',claimRepricedPerTrial:false};
 const reasons=[];if(date!==b.referenceDate||d.timing?.mode!=='origin')reasons.push('Current-date capital and shares are unverified. The dated equity allocation is unavailable after shifting the operating valuation date.');if(Object.values(inputs).some(x=>x===null))reasons.push('Complete every selected claim assumption; an unknown amount is not zero.');
 if(reasons.length)return {...base,status:'operating-only',eligible:false,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,reasons};
 const rows=[],add=(id,label,amount,kind,classification,referenceDate=b.referenceDate)=>rows.push({id,label,amount,kind,classification,referenceDate,sourceUrl:b.sourceUrl,currency:kind==='shares'?null:'USD'});
 add('cash','Dated unrestricted cash',b.cash,'asset','Reported July cash; restricted cash excluded and no October ASR roll-forward.');
 add('reserve','Operating liquidity reserve',inputs.operatingCashReserve,'claim','Selected opening analyst liquidity reserve.');
 add('foreignHaircut','Foreign excess-cash haircut',(b.cash-inputs.operatingCashReserve)*b.foreignCashFraction*inputs.foreignHaircut,'claim','Assumed 46% foreign fraction of excess cash, multiplied by selected haircut.');
 add('marketables','Recovered liquid marketable assets',b.marketables*inputs.marketableRecovery,'asset','Selected recovery assumption; private, contingent and matched deferred-compensation assets receive no credit.');
 add('debt','Funded debt and treasury-lock liability',b.debt,'claim','Includes treasury lock once; no second lock or derivative deduction.');
 add('interest','Accrued interest',b.accruedInterest,'claim','Opening accrued financing interest, outside forward operating FCFF.');
 add('currentTax','Current income-tax payable',b.currentTax,'claim','Opening tax excluded from operating NWC; not paid again in forward FCFF.');
 add('residual','Residual non-operating claim budget',inputs.residualClaimBudget,'claim','Single analyst allowance; adequacy unverified. Referenced tax, pension and other balances are not added again.');
 add('extraFX','Additional unfunded non-operating FX claim',inputs.extraFXClaim,'claim','Conditional extra claim only; default derivative economics remain operating, with no duplicate charge.');
 add('rsus','Assumed unissued RSU units',inputs.unissuedRSUShares,'shares','October 2025 all-plan inventory assumed unchanged at July; acquired awards already included.','2025-10-31');
 add('options','Assumed options at full participation',inputs.optionFullShares,'shares','October 2025 inventory assumed unchanged at July; zero-price participation, not option fair value.','2025-10-31');
 add('espp','Assumed existing ESPP participation',inputs.esppFullShares,'shares','Analyst existing-rights assumption, not reported July inventory.');
 const assetTotal=rows.filter(x=>x.kind==='asset').reduce((a,x)=>a+x.amount,0),claimTotal=rows.filter(x=>x.kind==='claim').reduce((a,x)=>a+x.amount,0),awards=inputs.unissuedRSUShares+inputs.optionFullShares+inputs.esppFullShares,allocationUnits=b.shares+awards,pool=enterprise+assetTotal-claimTotal,rawPerShare=pool/allocationUnits,equity=rawPerShare*b.shares,assumedAwardEquity=rawPerShare*awards;
 if(![assetTotal,claimTotal,allocationUnits,pool,rawPerShare,equity,assumedAwardEquity].every(finite)||allocationUnits<=0)throw Error('Nonfinite SNPS conditional allocation.');
 return {...base,status:'conditional',eligible:true,rows,assetTotal,claimTotal,equity,perShare:rawPerShare,rawPerShare,flooredPerShare:Math.max(0,rawPerShare),equityFloor:Math.max(0,equity),allocationShares:b.shares,basicShares:b.shares,allocationUnits,assumedAwardUnits:awards,assumedAwardEquity,equityPoolBeforeExistingEquityClaims:pool,unallocatedShortfall:Math.max(0,-pool),optionExerciseProceeds:0,allocationResidual:equity+assumedAwardEquity-pool,allocationLabel:'Conditional July-origin scenario; claim budget and award inventory unverified'};
}
