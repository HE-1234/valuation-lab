import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function calculateLrcxBridge(d,enterprise,options={}){
 const r=incrementalRecord(d?.ticker),b=r?.bridge;
 if(b?.type!=='lrcx-v2'||!incrementalIdentityValid(d))throw Error('Incremental research source, audit, dates and security identity must match the reviewed company package.');
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
 if(b.overlappingStressKeys.filter(key=>inputs[key]>0).length>1){reasons.push('Residual, tax-interest and repurchase stresses overlap. Select at most one positive stress; do not add them without a de-duplicated allocation.');return blocked();}
 const rows=[],add=(id,label,amount,kind='claim',classification='reported source amount used as a dated claim proxy')=>rows.push({id,label,amount,kind,referenceDate:b.referenceDate,sourceUrl:b.sourceUrl,classification,currency:kind==='shares'?null:b.currency});
 add('cash','Dated cash and investments',b.cash,'asset');add('reserve','Operating liquidity reserve',inputs.operatingCashReserve,'claim','analyst reserve assumption');
 add('debt','Debt including finance leases',inputs.debtValue,'claim','Selected debt proxy: 3,762.649 principal plus finance lease baseline. Alternative: '+b.debtAlternativePolicy);
 for(const row of b.fixedClaims)add(row.id,row.label,row.amount);
 add('existingESPPClaim','Estimated existing ESPP claim',inputs.existingESPPClaim,'claim','analyst estimate and stress values; neither measured fair value nor a proven bound');
 add('residualClaims','Additional residual-claim stress',inputs.residualClaims,'claim','unresolved allocation assumption; stress range is not a coverage ceiling');
 add('taxInterest','Incremental tax-interest claim',inputs.additionalTaxInterest,'claim','one-at-a-time overlap stress');
 add('repurchasePayable','Incremental repurchase-payable stress',inputs.repurchasePayable,'claim','reported payable with unresolved allocation; zero incremental deduction assumes existing coverage');
 add('deferredCompRecovery','Net deferred-compensation recovery',inputs.deferredCompRecovery,'asset','selected recovery of net asset only; no gross asset or liability duplication');
 add('legacyAwards','Maximum existing awards and options',b.legacyAwardShares,'shares','maximum existing units including zero-exercise option approximation, not option fair value');
 const sum=kind=>rows.filter(row=>row.kind===kind).reduce((s,row)=>s+row.amount,0),allocationShares=b.shares+b.legacyAwardShares,equity=enterprise+sum('asset')-sum('claim'),rawPerShare=equity/allocationShares;
 if(![equity,allocationShares,rawPerShare].every(finite)||allocationShares<=0)throw Error('Nonfinite research capital allocation.');
 return {...base,status:'conditional',eligible:true,rows,assetTotal:sum('asset'),claimTotal:sum('claim'),equity,rawPerShare,perShare:rawPerShare,flooredPerShare:Math.max(0,rawPerShare),equityFloor:Math.max(0,equity),allocationShares,basicShares:b.shares,allocationLabel:'Conditional fiscal-origin common allocation'};
}
