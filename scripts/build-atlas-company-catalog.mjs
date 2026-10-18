/** Build identity-only directory from explicitly verified primary-source research.
 * Usage: node scripts/build-atlas-company-catalog.mjs [research directory]
 * No network requests, fabricated identities, financial inputs or source edits.
 */
import fs from 'node:fs';
import path from 'node:path';
import {validateCompanyCatalog} from '../dist/company-catalog.js';
const directory=process.argv[2]||'/workspace/shared/atlas-research';
const inventory=JSON.parse(fs.readFileSync(path.join(directory,'ticker-inventory.json'),'utf8'));
const files=fs.readdirSync(path.join(directory,'verification')).filter(name=>name.endsWith('-verified.json')).sort();
const verified=files.flatMap(file=>JSON.parse(fs.readFileSync(path.join(directory,'verification',file),'utf8')));
const legacy=new Set(JSON.parse(fs.readFileSync('dist/data/renewed-research-2026-10-17/cases.json','utf8')).companies.map(row=>row.ticker));
const companies=[],coverage=[];
for(const original of inventory){
 if(legacy.has(original.ticker))continue;
 const row=verified.find(row=>(row.originalTicker??row.ticker)===original.ticker&&(row.originalCompany||row.company)===original.company);
 const fields=row?.verifiedFields||{};
 const evidence=Array.isArray(row?.evidence)?row.evidence.map(item=>typeof item==='string'?item:`${item.sourceDate||''}: ${item.paraphrase||item.summary||''}`).join('\n'):row?.evidence;
 const blockers=[row?.unresolvedBlocker,...(row?.unresolvedBlockers||[])].filter(Boolean);
 const disclose=reason=>coverage.push({company:original.company,reason,sourceURLs:row?.sourceURLs||[],checkedAt:row?.checkedAt||null,atlasClassification:original.classification,identityStatus:fields.listingStatus||'unresolved'});
 if(!row?.verified){disclose([evidence,...blockers].filter(Boolean).join(' ')||'Primary listing identity verification is incomplete.');continue;}
 if(['unlisted','unlisted_or_unresolved','ambiguous'].includes(fields.listingStatus)){disclose(evidence||'No standalone public listing verified.');continue;}
 const ticker=row.originalTicker||row.ticker||fields.ticker;
 const nativeTicker=row.nativeTicker||fields.localTicker||fields.ticker;
 const entry={id:'atlas:'+ticker,ticker,company:row.issuerName||fields.legalIssuer||row.company,aliases:[original.company],exchange:row.exchange||fields.exchange,nativeTicker,securityType:[...new Set([row.securityType||fields.securityType,fields.shareClass].filter(Boolean))].join(' · '),currency:row.quoteCurrency??fields.quoteCurrency??null,reportingCurrency:fields.reportingCurrency??null,verified:true,readiness:'research-pending',checkedAt:row.checkedAt,sourceURLs:row.sourceURLs,evidence,note:[fields.listingStatus==='public_parent'?'Atlas names a subsidiary; this entry is explicitly the listed parent, not a standalone subsidiary security.':null,...(row.notes||[]),...blockers,'Provider-style ticker notation is an identifier only; no live quote integration is established.'].filter(Boolean).join(' '),atlasSource:original.source_url,atlasSectors:original.sectors,mic:row.mic??fields.mic??null,isin:fields.isin??null,ordinarySharesPerADS:row.ordinarySharesPerADS??null};
 try{
  validateCompanyCatalog({schemaVersion:1,companies:[entry],coverage:[]});
  const same=companies.find(company=>company.ticker===entry.ticker||company.mic&&company.mic===entry.mic&&company.nativeTicker===entry.nativeTicker);
  if(same){same.aliases=[...new Set([...same.aliases,...entry.aliases])];same.sourceURLs=[...new Set([...same.sourceURLs,...entry.sourceURLs])];same.evidence+='\n'+entry.evidence;same.note+=' '+entry.note;}
  else companies.push(entry);
 }catch(error){disclose((evidence?evidence+' ':'')+'Verified research requires additional structured identity fields before selection: '+error.message);}

}
const bundle={schemaVersion:1,source:'https://ai-value-atlas-eh-261015.major-gem-5629.chatgpt.site/',scope:'Identity directory only. Reviewed Annual packages remain the original 14.',verificationFiles:files,companies,coverage};
validateCompanyCatalog(bundle);
// Exact source-string keys make stale or absent authored translations a build error.
// Raw identity/source fields remain untouched; the overlay is presentation only.
const translations=JSON.parse(fs.readFileSync('scripts/atlas-catalog-zh-Hans.json','utf8'));
const authored=[...bundle.companies.flatMap(row=>[row.evidence,row.note,row.exchange,row.securityType]),...bundle.coverage.map(row=>row.reason)];
for(const source of new Set(authored))if(typeof translations[source]!=='string'||!translations[source].trim())throw Error('Missing Simplified Chinese catalog prose: '+source);
fs.writeFileSync('dist/locales/company-catalog.js','// Exact authored display overlays. Source originals remain in the identity artifact.\nexport const catalogProsePairs='+JSON.stringify(Object.entries(translations),null,2)+';\n');
fs.writeFileSync('dist/data/atlas-company-catalog-v1.json',JSON.stringify(bundle,null,2)+'\n');
console.log(`${companies.length} verified additions; ${coverage.length} coverage-only entities; ${legacy.size} unchanged reviewed cases.`);
