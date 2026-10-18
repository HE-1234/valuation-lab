import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function calculateAsmlBridge(d,enterprise,options={}){
 const r=incrementalRecord(d?.ticker),b=r?.bridge;
 if(b?.type!=='asml-v4'||!incrementalIdentityValid(d))throw Error('Incremental research source, audit, dates and security identity must match the reviewed company package.');
 if(!finite(enterprise))throw Error('Operating EV must be finite; negative values are supported.');
 // The primary bridge is always EUR. USD is a separate dated illustration, never
 // a relabeling of EUR statements or a currently tradable target price.
 if(options.outputCurrency&&options.outputCurrency!==b.currency)throw Error('ASML allocation remains in EUR; use the separately labeled historical USD translation.');
 if(options.securityBasis&&options.securityBasis!=='ordinary-common')throw Error('No verified alternate-security mapping: retain ordinary/common-share output.');
 if(options.informationAsOf&&options.informationAsOf!==r.identity.informationAsOf)throw Error('Incremental information date must match the audited package.');
 const allowed=new Set([...b.options.map(x=>x.key),'calculationDate','outputCurrency','securityBasis','informationAsOf']);
 if(Object.keys(options).some(k=>!allowed.has(k)))throw Error('Unsupported incremental claim assumption; retain the saved draft for recovery.');
 const inputs={};for(const field of b.options){const value=Object.hasOwn(options,field.key)?options[field.key]:d.bridgeInputs?.[field.key];if(value===null||value===undefined){inputs[field.key]=null;continue;}if(!finite(value)||value<field.min||(field.max!==null&&value>field.max))throw Error(`${field.label}: use a finite value within its explicit bounds.`);inputs[field.key]=value;}
 const date=options.calculationDate||d.discountOrigin;
 const base={modelId:r.identity.version,ticker:d.ticker,currency:'EUR',moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:b.referenceDate,capitalReferenceDate:b.referenceDate,shareReferenceDate:b.shareDate,discountOrigin:d.discountOrigin,calculationDate:date,informationAsOf:d.informationAsOf,currentCapitalVerified:false,currentEquity:null,priceComparisonEligible:false,asKnownBacktestEligible:false,classification:b.classification,securityBasis:b.shareBasis,claimCompleteness:b.claimCompleteness,sources:[{url:b.sourceUrl,date:b.referenceDate},{url:b.historicalQuoteFX.sourceUrl,date:b.historicalQuoteFX.date}],inputs,optionDefinitions:b.options,warnings:[...b.unresolved,...b.notes],unresolved:[...b.unresolved],basisMismatch:date!==b.referenceDate};
 const reasons=[];if(date!==b.referenceDate||d.timing?.mode!=='origin')reasons.push('Current-date capital and shares are unverified. The dated equity allocation is unavailable after shifting the operating valuation date.');
 if(Object.values(inputs).some(x=>x===null))reasons.push('Complete every selected claim assumption; an unknown amount is not zero.');
 if(reasons.length)return {...base,status:'operating-only',eligible:false,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,historicalQuoteTranslation:null,reasons};
 const rows=[],add=(id,label,amount,kind='claim',classification='reported source amount used as a dated claim proxy')=>rows.push({id,label,amount,kind,referenceDate:b.referenceDate,sourceUrl:b.sourceUrl,classification,currency:kind==='shares'?null:'EUR'});
 add('cash','Dated cash and investments',b.cash+b.shortTermInvestments,'asset');add('reserve','Operating liquidity reserve',inputs.operatingCashReserve,'claim','analyst liquidity reserve; distinct from customer-advance runoff');
 add('privateEquity','Private-equity value after haircut',b.privateEquityBook*(1-inputs.privateEquityHaircut),'asset','book value after analyst haircut; realization tax remains unappraised');
 add('zeissEquity','Zeiss ownership value proxy',inputs.zeissEquityValue,'asset','separate equity ownership; associate profit is excluded from operating EBIT');
 add('fundedDebt','Market and carrying debt proxy',b.fundedDebtMarketProxy,'claim','3,590.8 bond fair value + 691.7 commercial paper + 16.4 mortgage; excludes alternative book debt');
 add('financeLease','Finance lease claim',b.financeLeaseClaim);add('interestSwap','Net interest-rate swap claim',b.interestRateSwapNetClaim);
 add('openingTax','Opening tax liability proxy',inputs.openingTaxClaim,'claim','opening current and noncurrent tax balance; excluded from forecast settlements');
 add('currentTaxAsset','Current tax asset recovery',inputs.currentTaxAssetRecovery,'asset','selected book recovery; no noncurrent DTA credit');
 add('contingent','Additional contingent claim',inputs.additionalContingentClaim,'claim','explicit incremental loss assumption; no asserted maximum');
 add('legacyAwards','Existing conditional award dilution',b.legacyAwardShares*inputs.awardShareMultiplier,'shares','disclosed-count allocation proxy, not grant fair value');
 add('oldOptions','Existing option gross dilution',b.oldOptionShares*inputs.optionShareMultiplier,'shares','full shares with no exercise proceeds; not option fair value');
 const sum=kind=>rows.filter(row=>row.kind===kind).reduce((s,row)=>s+row.amount,0),allocationShares=b.shares+sum('shares'),equity=enterprise+sum('asset')-sum('claim'),rawPerShare=equity/allocationShares;
 const fx=b.historicalQuoteFX,translatedPerShare=rawPerShare*fx.rate/fx.ordinaryShareEquivalent;
 if(![equity,allocationShares,rawPerShare,translatedPerShare].every(finite)||allocationShares<=0)throw Error('Nonfinite research capital allocation.');
 return {...base,status:'conditional',eligible:true,rows,assetTotal:sum('asset'),claimTotal:sum('claim'),equity,rawPerShare,perShare:rawPerShare,flooredPerShare:Math.max(0,rawPerShare),equityFloor:Math.max(0,equity),allocationShares,basicShares:b.shares,allocationLabel:'Conditional fiscal-origin common allocation',historicalQuoteTranslation:{...fx,perShare:translatedPerShare,nativePerShare:rawPerShare,securityType:'New York registered ordinary share',classification:'Historical FX illustration only; not a current USD valuation'}};
}
