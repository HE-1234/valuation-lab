/** Build identity-only directory from explicitly verified primary-source research.
 * Usage: node scripts/build-atlas-company-catalog.mjs [research directory]
 * No network requests, fabricated identities, financial inputs or source edits.
 */
import fs from 'node:fs';
import path from 'node:path';
import {validateCompanyCatalog,filterUSCompanyCatalog,isUSRobinhoodCandidate} from '../dist/company-catalog.js';
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
const brokerEvidence=JSON.parse(fs.readFileSync('scripts/robinhood-us-public-support-2026-10-18.json','utf8'));
for(const entry of companies){const support=brokerEvidence.securities.find(row=>row.ticker===entry.ticker);if(support)entry.robinhood={status:support.status,url:support.url,checkedAt:support.checkedAt,evidence:support.evidence,scope:support.scope};}
const excludedCompanies=companies.filter(row=>!isUSRobinhoodCandidate(row));
const bundle=filterUSCompanyCatalog({schemaVersion:1,source:'https://ai-value-atlas-eh-261015.major-gem-5629.chatgpt.site/',scope:'US-exchange-listed securities with dated public Robinhood buy/sell support. Account-specific eligibility is unverified. Identity directory only; original 14 reviewed Annual cases are unchanged.',verificationFiles:files,companies,coverage});
validateCompanyCatalog(bundle);
// Exact source-string keys make stale or absent authored translations a build error.
// Raw identity/source fields remain untouched; the overlay is presentation only.
const translations=JSON.parse(fs.readFileSync('scripts/atlas-catalog-zh-Hans.json','utf8'));
const authored=[...bundle.companies.flatMap(row=>[row.evidence,row.note,row.exchange,row.securityType]),...bundle.coverage.map(row=>row.reason)];
for(const source of new Set(authored))if(typeof translations[source]!=='string'||!translations[source].trim())throw Error('Missing Simplified Chinese catalog prose: '+source);
fs.writeFileSync('dist/locales/company-catalog.js','// Exact authored display overlays for the active US-listed directory only.\nexport const catalogProsePairs='+JSON.stringify([...new Set(authored)].map(source=>[source,translations[source]]),null,2)+';\n');
fs.writeFileSync('dist/data/atlas-company-catalog-v1.json',JSON.stringify(bundle,null,2)+'\n');
fs.writeFileSync('scripts/atlas-us-exclusions-2026-10-18.json',JSON.stringify({schemaVersion:1,asOf:'2026-10-18',policy:bundle.selectionPolicy,preservedReviewedTickers:[...legacy],activeAdditionalTickers:bundle.companies.map(row=>row.ticker),counts:{activeAdditional:bundle.companies.length,excludedListed:excludedCompanies.length,excludedCoverage:coverage.length},excludedListed:excludedCompanies.map(row=>({id:row.id,ticker:row.ticker,company:row.company,exchange:row.exchange,mic:row.mic,reason:!['XNAS','XNYS'].includes(row.mic)?'Selected security is not listed on an approved US exchange. No OTC or alternate security is inferred.':'Public Robinhood buy/sell support is not verified.',sourceURLs:row.sourceURLs})),excludedCoverage:coverage.map((row,index)=>({id:'coverage:'+index,originalTicker:inventory.find(original=>original.company===row.company)?.ticker||null,...row})),cleanupPerformed:false},null,2)+'\n');
console.log(`${bundle.companies.length} US-listed additions; ${excludedCompanies.length} listed and ${coverage.length} coverage records excluded; ${legacy.size} unchanged reviewed cases.`);
