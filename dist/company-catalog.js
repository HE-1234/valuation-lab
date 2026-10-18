/** Additive identity directory. It never supplies financial/model inputs. */
export const COMPANY_CATALOG_PATH='./data/atlas-company-catalog-v1.json';
export const COMPANY_SELECTION_POLICY='us-exchange-robinhood-public-support-v1';
const US_EXCHANGES=Object.freeze({XNAS:['Nasdaq','Nasdaq Global Select Market'],XNYS:['New York Stock Exchange']});
// Listing venue and the broker's public support evidence are independent gates.
// Issuer nationality, reporting currency and ADR status do not exclude a US listing.
export function isUSRobinhoodCandidate(row){
 const broker=row?.robinhood;
 return row?.verified===true&&US_EXCHANGES[row.mic]?.includes(row.exchange)===true&&/^[A-Z][A-Z0-9.-]{0,11}$/.test(row.ticker||'')&&row.nativeTicker===row.ticker&&/common|ordinary|depositary|registry/i.test(row.securityType||'')&&!/\b(warrants?|rights?|preferred|bonds?|notes?|units?|fund|ETF)\b/i.test(row.securityType||'')&&broker?.status==='public-buy-sell-support'&&broker.url===`https://robinhood.com/us/en/stocks/${row.ticker}/`&&/^\d{4}-\d{2}-\d{2}$/.test(broker.checkedAt||'')&&typeof broker.evidence==='string'&&broker.evidence.trim().length>0;
}
export function filterUSCompanyCatalog(bundle){return {...bundle,selectionPolicy:COMPANY_SELECTION_POLICY,companies:bundle.companies.filter(isUSRobinhoodCandidate),coverage:[]};}
export const MISSING_RESEARCH_STAGES=Object.freeze(['financials','history','operating','capital','valuation']);
export const normalizeCompanyQuery=value=>String(value??'').trim().toLocaleUpperCase('en-US');
const text=value=>typeof value==='string'&&value.trim().length>0;
const safeURL=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
export function validateCompanyCatalog(bundle){
 if(bundle?.schemaVersion!==1||!Array.isArray(bundle.companies)||!Array.isArray(bundle.coverage))throw Error('Invalid company directory');
 const ids=new Set(),securities=new Set();
 for(const row of bundle.companies){
  if(!text(row.id)||ids.has(row.id)||!text(row.company)||!text(row.ticker)||!text(row.exchange)||!text(row.nativeTicker)||!text(row.securityType)||(row.currency!==null&&!text(row.currency)))throw Error('Incomplete or duplicate security identity');
  if(row.verified!==true||row.readiness!=='research-pending'||!/^\d{4}-\d{2}-\d{2}/.test(row.checkedAt)||!Array.isArray(row.sourceURLs)||!row.sourceURLs.length||!row.sourceURLs.every(safeURL)||!text(row.evidence))throw Error('Security verification evidence required');
  if(!Array.isArray(row.aliases)||!row.aliases.every(text))throw Error('Aliases must be explicit strings');
  if(/^\d/.test(row.ticker)&&(row.nativeTicker.length<row.ticker.split('.')[0].length||row.nativeTicker.replace(/^0+/, '')!==row.ticker.split('.')[0].replace(/^0+/, '')))throw Error('Native listing identifier required');
  const security=normalizeCompanyQuery(row.exchange)+':'+row.nativeTicker;
  if(securities.has(security))throw Error('Duplicate listed security');
  if(Object.keys(row).some(key=>['annual','terminal','price','quote','assumptions','valuation','simulation','draft'].includes(key)))throw Error('Directory must not contain valuation inputs');
  ids.add(row.id);securities.add(security);
 }
 for(const row of bundle.coverage)if(!text(row.company)||!text(row.reason)||row.verified===true||(row.sourceURLs!==undefined&&(!Array.isArray(row.sourceURLs)||!row.sourceURLs.every(safeURL))))throw Error('Invalid coverage disclosure');
 if(bundle.selectionPolicy===COMPANY_SELECTION_POLICY&&(bundle.coverage.length||bundle.companies.some(row=>!isUSRobinhoodCandidate(row))))throw Error('US listing and public Robinhood support evidence are required for every additional company.');
 return bundle;
}
export async function fetchCompanyCatalog(fetcher=globalThis.fetch,{timeoutMs=3000}={}){
 const controller=typeof AbortController==='function'?new AbortController():null;
 let timer;
 const request=(async()=>{const response=await fetcher(COMPANY_CATALOG_PATH,controller?{signal:controller.signal}:undefined);if(!response?.ok)throw Error('Company directory unavailable');return filterUSCompanyCatalog(validateCompanyCatalog(await response.json()));})();
 try{return await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{controller?.abort();reject(Error('Company directory timed out'));},timeoutMs);})]);}
 finally{clearTimeout(timer);}
}
const legacyNames=Object.freeze({AAPL:'Apple',MSFT:'Microsoft',AMZN:'Amazon',GOOG:'Alphabet / Google',META:'Meta Platforms',NVDA:'NVIDIA',COHR:'Coherent',LITE:'Lumentum',AAOI:'Applied Optoelectronics',NBIS:'Nebius',MU:'Micron Technology',AVGO:'Broadcom',TSM:'Taiwan Semiconductor Manufacturing / TSMC',TSLA:'Tesla'});

export function directoryEntries(library,catalog){
 const ready=library.companies.map(row=>({id:row.ticker,ticker:row.ticker,company:row.company||row.name||legacyNames[row.ticker]||row.ticker,aliases:[],readiness:'ready'}));
 const legacy=new Set(ready.map(row=>row.ticker));
 return [...ready,...(catalog?.companies||[]).filter(row=>!legacy.has(row.ticker)&&isUSRobinhoodCandidate(row))];
}
export function searchCompanies(entries,query){
 const needle=normalizeCompanyQuery(query);return entries.filter(row=>[row.id,row.ticker,row.nativeTicker,row.company,...(row.aliases||[])].some(value=>normalizeCompanyQuery(value).includes(needle)));
}
export function resolveCompany(entries,query){
 const needle=normalizeCompanyQuery(query);
 const exact=entries.filter(row=>[row.id,row.ticker,...(row.aliases||[])].some(value=>normalizeCompanyQuery(value)===needle));
 return exact.length===1?exact[0]:null;
}
