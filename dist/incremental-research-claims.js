import {calculateCevaBridge,calculateCevaOperating} from './ceva-valuation.js';
import {calculateRmbsBridge} from './rmbs-research-model.js';
import {calculateKeysBridge,calculateKeysOperating} from './keys-research-model.js';
import {calculateArmBridge,calculateArmOperating} from './arm-research-model.js';
import {calculateSndkBridge,calculateSndkOperating} from './sndk-research-model.js';
import {calculateCrdoBridge} from './crdo-research-model.js';
import {calculateSnpsBridge} from './snps-research-claims.js';
import {calculateCdnsBridge} from './cdns-research-claims.js';
import {calculateFnBridge} from './fn-research-claims.js';
import {calculateAsmlBridge} from './asml-research-claims.js';
import {calculateLrcxBridge} from './lrcx-research-claims.js';
import {calculateAmatBridge} from './amat-research-claims.js';
import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function incrementalBridgeDefinition(ticker){const r=incrementalRecord(ticker);return r?structuredClone({...r.bridge,optionDefinitions:r.bridge.options,lines:[],bridgeVersion:r.identity.version}):null;}
export function calculateIncrementalBridge(d,enterprise,options={}){
 if(incrementalRecord(d?.ticker)?.bridge.type==='ceva-v3')return calculateCevaBridge(d,enterprise,options);
 if(d?.ticker==='RMBS')return calculateRmbsBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='keys-v1')return calculateKeysBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='arm-v2')return calculateArmBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='sndk-v3')return calculateSndkBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='crdo-v3')return calculateCrdoBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='snps-v3')return calculateSnpsBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='cdns-v3')return calculateCdnsBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='fn-v1')return calculateFnBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='asml-v4')return calculateAsmlBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='lrcx-v2')return calculateLrcxBridge(d,enterprise,options);
 if(incrementalRecord(d?.ticker)?.bridge.type==='amat-v3')return calculateAmatBridge(d,enterprise,options);
 const r=incrementalRecord(d?.ticker),b=r?.bridge;
 if(!r||!incrementalIdentityValid(d))throw Error('Incremental research source, audit, dates and security identity must match the reviewed company package.');
 if(!finite(enterprise))throw Error('Operating EV must be finite; negative values are supported.');
 if(options.outputCurrency&&options.outputCurrency!==b.currency)throw Error('No verified FX mapping: retain native reporting-currency output.');
 if(options.securityBasis&&options.securityBasis!=='ordinary-common')throw Error('No verified alternate-security mapping: retain ordinary/common-share output.');
 if(options.informationAsOf&&options.informationAsOf!==r.identity.informationAsOf)throw Error('Incremental information date must match the audited package.');
 const allowed=new Set([...b.options.map(x=>x.key),'calculationDate','outputCurrency','securityBasis','informationAsOf']);
 if(Object.keys(options).some(k=>!allowed.has(k)))throw Error('Unsupported incremental claim assumption; retain the saved draft for recovery.');
 const inputs={};
 for(const field of b.options){const value=Object.hasOwn(options,field.key)?options[field.key]:d.bridgeInputs?.[field.key];if(value===null||value===undefined){inputs[field.key]=null;continue;}if(!finite(value)||value<field.min||value>field.max)throw Error(`${field.label}: use a finite value within its explicit bounds.`);inputs[field.key]=value;}
 const date=options.calculationDate||d.discountOrigin;
 const base={modelId:r.identity.version,ticker:d.ticker,currency:d.currency,moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:b.referenceDate,capitalReferenceDate:b.referenceDate,shareReferenceDate:b.shareDate,discountOrigin:d.discountOrigin,calculationDate:date,informationAsOf:d.informationAsOf,currentCapitalVerified:false,priceComparisonEligible:false,classification:b.classification,securityBasis:b.shareBasis,claimCompleteness:b.claimCompleteness,sources:[{url:b.sourceUrl,date:b.referenceDate}],inputs,optionDefinitions:b.options,warnings:[...b.unresolved,...b.notes],unresolved:[...b.unresolved],basisMismatch:date!==b.referenceDate};
 if(['nvmi-ev-only-v2','onto-ev-only-v2','camt-ev-only-v1','mrvl-ev-only-v3','amd-ev-only-v3'].includes(b.type))return {...base,status:'operating-only',eligible:false,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,currentEquity:null,unconditionalEquity:null,unconditionalPerShare:null,currentQuote:null,asKnownBacktestEligible:false,claimRepricedPerTrial:false,reasons:[...b.unresolved]};
 const reasons=[];if(date!==b.referenceDate||d.timing?.mode!=='origin')reasons.push('Current-date capital and shares are unverified. The dated equity allocation is unavailable after shifting the operating valuation date.');
 if(Object.values(inputs).some(x=>x===null))reasons.push('Complete every selected claim assumption; an unknown amount is not zero.');
 if(reasons.length)return {...base,status:'operating-only',eligible:false,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,reasons};
 const rows=[],add=(id,label,amount,kind='claim',classification='reported source amount used as a dated claim proxy')=>rows.push({id,label,amount,kind,referenceDate:b.referenceDate,sourceUrl:b.sourceUrl,classification,currency:kind==='shares'?null:b.currency});
 add('cash','Dated cash and investments',b.cash,'asset');add('reserve','Operating liquidity reserve',inputs.operatingCashReserve,'claim','analyst reserve assumption');
 add('debt','Selected debt value',inputs.debtValue,'claim','face debt baseline; disclosed market-value sensitivity');
 for(const row of b.fixedClaims)add(row.id,row.label,row.amount);
 add('taxInterest','Incremental tax-interest claim',inputs.additionalTaxInterest,'claim','explicit overlap sensitivity');
 add('prepaidTax','Prepaid-tax recovery value',inputs.prepaidTaxAssetRecovery,'asset','analyst recoverability assumption');
 const dilution=b.legacyRSUs*inputs.legacyRSUVestingFraction;add('existingRSUs','Existing RSU dilution',dilution,'shares','reported unvested awards × explicit vesting assumption');
 const sum=kind=>rows.filter(r=>r.kind===kind).reduce((s,r)=>s+r.amount,0),allocationShares=b.shares+dilution,equity=enterprise+sum('asset')-sum('claim'),rawPerShare=equity/allocationShares;
 if(![equity,allocationShares,rawPerShare].every(finite)||allocationShares<=0)throw Error('Nonfinite research capital allocation.');
 return {...base,status:'conditional',eligible:true,rows,assetTotal:sum('asset'),claimTotal:sum('claim'),equity,rawPerShare,perShare:rawPerShare,flooredPerShare:Math.max(0,rawPerShare),equityFloor:Math.max(0,equity),allocationShares,basicShares:b.shares,allocationLabel:'Conditional fiscal-origin common allocation'};
}
export function incrementalBridgeSensitivity(d,enterprise,options={}){
 const b=incrementalRecord(d?.ticker)?.bridge;if(!b)return [];
 return b.options.flatMap(field=>(['cdns-v3','snps-v3'].includes(b.type)?field.listedStressValues:[field.min,field.max]).filter(value=>finite(value)&&value!==field.default).map(value=>{const changes={[field.key]:value},label=`${field.label}: ${value}`;try{const r=calculateIncrementalBridge(d,b.type==='ceva-v3'?calculateCevaOperating(d,changes).enterprise:b.type==='keys-v1'?calculateKeysOperating(d,changes).enterprise:b.type==='arm-v2'?calculateArmOperating(d,changes).enterprise:b.type==='sndk-v3'?calculateSndkOperating(d,changes).enterprise:enterprise,{...options,...changes});return {label,parameterLabel:field.label,parameterValue:value,changes,...r};}catch(error){return {label,parameterLabel:field.label,parameterValue:value,changes,status:'invalid',error:error.message};}}));
}
