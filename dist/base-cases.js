// Current-company assumption presets only. Historical freezes and DCF arithmetic
// are deliberately outside this module. A researched case is a dated judgment,
// never a claim that its inputs are reported facts or have been reviewed by a user.
import {defaults,validDate} from './engine.js';

export const BASE_CASE_PATH='./data/company-base-cases.json';
export const BASE_CASE_PROVENANCE_VERSION=1;
const genericVersion='generic-v1';
const keys=Object.keys(defaults);
const judgmentKeys=keys.filter(k=>k!=='years');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'&&x.trim().length>0;
const http=x=>typeof x==='string'&&/^https?:\/\//.test(x);
const clone=x=>structuredClone(x);
const normalizationOf=x=>({normalizationDelta:x?.normalizationDelta??0,adjustmentReason:x?.adjustmentReason??'',adjustmentSource:x?.adjustmentSource??''});
const equalAssumptions=(a,b)=>object(a)&&object(b)&&keys.every(k=>finite(a[k])&&a[k]===b[k]);
const equalNormalization=(a,b)=>['normalizationDelta','adjustmentReason','adjustmentSource'].every(k=>a[k]===b[k]);
const validAssumptions=a=>object(a)&&keys.every(k=>finite(a[k]))&&a.years===10&&a.growth>=-.5&&a.growth<=1&&a.targetMargin>=0&&a.targetMargin<=1&&a.tax>=0&&a.tax<=.6&&a.salesCapital>0&&a.wacc>a.terminalGrowth&&a.wacc<=1&&a.terminalGrowth>=0&&a.terminalGrowth<=.05&&a.terminalROIC>a.terminalGrowth&&a.otherClaims>=0&&a.otherAssets>=0;
const cleanAssumptions=a=>Object.fromEntries(keys.map(k=>[k,a[k]]));

// A bounded optional read: delayed or missing research must not prevent access
// to the financial library or relabel generic inputs as researched.
export async function fetchBaseCases({fetcher=globalThis.fetch,timeoutMs=3000}={}){
 if(typeof fetcher!=='function')return null;
 const controller=typeof AbortController==='function'?new AbortController():null;
 let timer;
 try{
  const request=(async()=>{const r=await fetcher(BASE_CASE_PATH,controller?{signal:controller.signal}:undefined);if(!r?.ok)return null;const data=await r.json();return data?.schemaVersion===1&&object(data.companies)&&object(data.sources)?data:null;})();
  const timeout=new Promise(resolve=>{timer=setTimeout(()=>{controller?.abort();resolve(null);},Math.max(1,timeoutMs));});
  return await Promise.race([request,timeout]);
 }catch{return null;}finally{clearTimeout(timer);}
}

export function researchCaseFor(library,company,raw){
 if(company?.researchImported===true||raw?.researchImported===true||!text(raw?.id)||library?.schemaVersion!==1||!object(library.companies)||!object(library.sources))return null;
 const c=library.companies[company?.ticker];
 if(!object(c)||c.ticker!==company.ticker||c.snapshotId!==raw.id||!validDate(c.asOf)||!validDate(library.asOf)||c.asOf>library.asOf||!text(c.summary)||!validAssumptions(c.assumptions))return null;
 if(!object(c.rationale)||!judgmentKeys.every(k=>text(c.rationale[k])))return null;
 if(!Array.isArray(c.sourceIds)||!c.sourceIds.length||!c.sourceIds.every(id=>{const s=library.sources[id];return object(s)&&http(s.url)&&text(s.title)&&(!s.publishedAt||(validDate(s.publishedAt)&&s.publishedAt.slice(0,10)<=c.asOf.slice(0,10)));}))return null;
 const available=raw.availableFrom||raw.acceptedAt||raw.filedAt||raw.filingDate;
 if(available&&(!validDate(available)||available.slice(0,10)>c.asOf.slice(0,10)))return null;
 const normalization=normalizationOf(c.normalization);
 if(!finite(normalization.normalizationDelta)||typeof normalization.adjustmentReason!=='string'||typeof normalization.adjustmentSource!=='string')return null;
 if(normalization.normalizationDelta!==0&&(!text(normalization.adjustmentReason)||!http(normalization.adjustmentSource)))return null;
 return clone({...c,classification:text(c.classification)?c.classification:library.classification||'Dated educational research assumptions',assumptions:cleanAssumptions(c.assumptions),normalization,version:text(library.version)?library.version:`schema-${library.schemaVersion}:${library.asOf}`,sourcePath:BASE_CASE_PATH,sources:c.sourceIds.map(id=>({id,...library.sources[id]}))});
}

export function genericProvenance(company,raw,cutoff){
 return {schemaVersion:BASE_CASE_PROVENANCE_VERSION,kind:'generic-default',version:genericVersion,ticker:company.ticker,snapshotId:raw?.id,sourcePath:null,asOf:null,initialCutoff:cutoff,initialAssumptions:{...defaults},initialNormalization:normalizationOf(),userEdited:false,editedKeys:[],selection:'fresh'};
}
function userProvenance(company,raw){
 return {schemaVersion:BASE_CASE_PROVENANCE_VERSION,kind:'user-draft',version:null,ticker:company.ticker,snapshotId:raw?.id,sourcePath:null,asOf:null,userEdited:true,editedKeys:[],selection:'preserved'};
}

// A numeric match alone never proves that a legacy draft was untouched. The
// old app saved on navigation and did not record edits, including same-value
// edits. Only our own explicit generic-origin marker plus an unchanged complete
// authored state permits automatic upgrading after optional research arrives.
export function isUntouchedGenericDraft(draft,company,raw){
 const p=draft?.assumptionProvenance;
 if(Object.prototype.hasOwnProperty.call(draft||{},'claims')||Object.prototype.hasOwnProperty.call(draft||{},'operatingProfile'))return false;
 if(!object(p)||p.schemaVersion!==BASE_CASE_PROVENANCE_VERSION||p.kind!=='generic-default'||p.version!==genericVersion||p.ticker!==company.ticker||p.snapshotId!==raw?.id||p.userEdited!==false||!Array.isArray(p.editedKeys)||p.editedKeys.length)return false;
 if(!equalAssumptions(p.initialAssumptions,defaults)||!equalAssumptions(draft.assumptions,defaults)||Object.keys(draft.assumptions).some(k=>!keys.includes(k)))return false;
 if(!text(p.initialCutoff)||draft.cutoff!==p.initialCutoff||!equalNormalization(normalizationOf(draft),normalizationOf())||!equalNormalization(p.initialNormalization||{},normalizationOf()))return false;
 if(!object(draft.notes)||Object.keys(draft.notes).length||draft.bridgeReviewed!==false||draft.modelReviewed!==false||!Array.isArray(draft.reviewed)||draft.reviewed.length)return false;
 const q=draft.quote;
 if(!object(q)||q.price!==null||q.basisConfirmed!==false||['date','currency','sourceUrl','shareBasis'].some(k=>q[k]!==''))return false;
 if(!object(draft.waccWorksheet)||Object.values(draft.waccWorksheet).some(v=>v!==null))return false;
 const known=new Set(['schemaVersion','ticker','snapshotId','step','cutoff','assumptions','notes','reviewed','bridgeReviewed','modelReviewed','normalizationDelta','adjustmentReason','adjustmentSource','quote','waccWorksheet','updatedAt','assumptionProvenance','claims','operatingProfile']);
 return !Object.keys(draft).some(k=>!known.has(k));
}

export function restoreDraftProvenance(value,draft,company,raw){
 const p=value?.assumptionProvenance;
 if(company?.researchImported===true||raw?.researchImported===true)return userProvenance(company,raw);
 if(!object(p)||p.schemaVersion!==BASE_CASE_PROVENANCE_VERSION||!['generic-default','researched-base-case','user-draft'].includes(p.kind)||p.ticker!==company.ticker||p.snapshotId!==raw?.id)return userProvenance(company,raw);
 if(p.kind==='user-draft')return userProvenance(company,raw);
 if(!equalAssumptions(p.initialAssumptions,p.initialAssumptions)||!object(p.initialNormalization)||!finite(p.initialNormalization.normalizationDelta)||typeof p.initialNormalization.adjustmentReason!=='string'||typeof p.initialNormalization.adjustmentSource!=='string')return userProvenance(company,raw);
 if(p.kind==='researched-base-case'&&(!text(p.version)||!validDate(p.asOf)||p.sourcePath!==BASE_CASE_PATH))return userProvenance(company,raw);
 if(p.kind==='generic-default'&&(p.version!==genericVersion||!equalAssumptions(p.initialAssumptions,defaults)))return userProvenance(company,raw);
 const editedKeys=Array.isArray(p.editedKeys)?p.editedKeys.filter(k=>typeof k==='string').slice(0,80):[];
 const changed=draft.operatingProfile?.id==='flexible-growth-v1'||!equalAssumptions(value.assumptions,p.initialAssumptions)||!equalNormalization(normalizationOf(value),p.initialNormalization);
 return {schemaVersion:BASE_CASE_PROVENANCE_VERSION,kind:p.kind,version:p.version,ticker:company.ticker,snapshotId:raw?.id,sourcePath:p.kind==='researched-base-case'?BASE_CASE_PATH:null,asOf:p.kind==='researched-base-case'?p.asOf:null,initialCutoff:typeof p.initialCutoff==='string'?p.initialCutoff:draft.cutoff,initialAssumptions:cleanAssumptions(p.initialAssumptions),initialNormalization:normalizationOf(p.initialNormalization),userEdited:p.userEdited!==false||changed||editedKeys.length>0,editedKeys,selection:typeof p.selection==='string'?p.selection:'preserved',...(p.kind==='researched-base-case'?{displayLabel:typeof p.displayLabel==='string'?p.displayLabel:'Researched base case',classification:typeof p.classification==='string'?p.classification:'Dated educational research assumptions',caseSummary:typeof p.caseSummary==='string'?p.caseSummary:'',rationale:object(p.rationale)?Object.fromEntries(Object.entries(p.rationale).filter(([k,v])=>[...keys,'normalizationDelta'].includes(k)&&typeof v==='string')):{},sources:Array.isArray(p.sources)?p.sources.filter(s=>object(s)&&text(s.title)&&http(s.url)).map(s=>({id:typeof s.id==='string'?s.id:'',title:s.title,url:s.url,...(validDate(s.publishedAt)?{publishedAt:s.publishedAt}:{})})):[]}: {})};
}

export function markDraftEdited(draft,key='assumptions'){
 const p=draft.assumptionProvenance;
 if(!object(p))draft.assumptionProvenance=userProvenance({ticker:draft.ticker},{id:draft.snapshotId});
 draft.assumptionProvenance.userEdited=true;
 const prior=Array.isArray(draft.assumptionProvenance.editedKeys)?draft.assumptionProvenance.editedKeys:[];
 draft.assumptionProvenance.editedKeys=[...new Set([...prior,String(key)])].slice(0,80);
 return draft;
}

export function loadResearchedBaseCase(draft,company,raw,library,{selection='explicit-load'}={}){
 const c=researchCaseFor(library,company,raw);
 if(!c)throw new Error('A verified researched base case is unavailable for this exact company and financial baseline. Your draft is unchanged.');
 if(!validDate(draft.cutoff)||draft.cutoff.slice(0,10)<c.asOf.slice(0,10))throw new Error(`This researched base case uses information through ${c.asOf.slice(0,10)}. Choose that valuation date or later before loading it.`);
 // Copy all existing fields, including notes, quote, WACC worksheet, import
 // metadata and custom uncertainty. Only the explicitly selected assumptions
 // and their starting-EBIT normalization are replaced. Caller can retain a full
 // copy for Undo without a storage side effect from this pure operation.
 return {...clone(draft),operatingProfile:c.operatingProfile?clone(c.operatingProfile):undefined,assumptions:{...c.assumptions},...c.normalization,assumptionProvenance:{schemaVersion:BASE_CASE_PROVENANCE_VERSION,kind:'researched-base-case',version:c.version,ticker:company.ticker,snapshotId:raw.id,sourcePath:BASE_CASE_PATH,asOf:c.asOf,initialCutoff:draft.cutoff,initialAssumptions:{...c.assumptions},initialNormalization:{...c.normalization},displayLabel:text(c.displayLabel)?c.displayLabel:'Researched base case',classification:c.classification,caseSummary:c.summary,rationale:clone(c.rationale),sources:c.sources.map(s=>({id:s.id,title:s.title,url:s.url,...(validDate(s.publishedAt)?{publishedAt:s.publishedAt}:{})})),userEdited:false,editedKeys:[],selection}};
}
