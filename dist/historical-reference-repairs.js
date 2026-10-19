// Versioned display/model overlays for three shipped annual references only.
// Original source records and historical eligibility are never rewritten.
export const HISTORICAL_REFERENCE_REPAIR_VERSION='2026-10-19-reference-repairs-v1';
const sources={
 AMZN:'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm',
 COHR:'https://www.sec.gov/Archives/edgar/data/820318/000082031826000020/iivi-20260630.htm',
 FN:'https://www.sec.gov/Archives/edgar/data/1408710/000140871026000028/fn-20260626.htm'
};
const note=(s,text,details)=>({...s,backtestEligible:false,referenceRepair:{disclosure:text,version:HISTORICAL_REFERENCE_REPAIR_VERSION,classification:'Dated provisional annual reference; not an as-known historical case',sourceUrl:s.sourceUrl,...details}});
export function repairHistoricalAnnualReferences(company){
 return {...company,snapshots:company.snapshots.map(s=>{
  const raw=s.raw;
  if(!raw||s.snapshotMode!=='annual-reference'||s.backtestEligible!==false||raw.backtestEligible!==false||s.sourceUrl!==sources[company.ticker])return s;
  if(company.ticker==='AMZN'&&raw.id==='AMZN-FY2025'&&raw.accession==='0001018724-26-000004'&&s.periodEnd==='2025-12-31'&&s.filedAt==='2026-02-06'&&s.acceptedAt==='2026-02-05T23:44:31Z'&&s.availableFrom===s.acceptedAt&&raw.availableFrom===null){
   return note({...s,availableFrom:'2026-02-06T00:00:00Z'},'Annual-reference availability uses the later of the recorded filing-date boundary and accepted timestamp. This conservative display convention is not an asserted publication time; historical eligibility remains disabled.',{field:'availableFrom',original:s.availableFrom,value:'2026-02-06T00:00:00Z',method:'Conservative later filing-date boundary; raw timestamp retained.'});
  }
  if(company.ticker==='COHR'&&raw.id==='COHR-FY2026'&&raw.accession==='0000820318-26-000020'&&s.periodEnd==='2026-06-30'&&s.ebit==null&&raw.facts?.operatingIncome===null&&raw.EBIT===null){
   // Exact same-accession original-inline components, USD millions.
   const components={revenue:7118.181,costOfGoodsSold:4449.141,researchAndDevelopment:722.952,sellingGeneralAdministrative:1044.566,restructuringCharges:63.390,impairmentHeldForSale:64.404,gainOnSaleOfBusiness:124.133};
   const ebit=components.revenue-components.costOfGoodsSold-components.researchAndDevelopment-components.sellingGeneralAdministrative-components.restructuringCharges-components.impairmentHeldForSale+components.gainOnSaleOfBusiness;
   return note({...s,ebit},'EBIT is a source-derived operating subtotal of USD 897.861m, not a separately reported operating-income line. It excludes interest and separately disclosed other income; gain-on-sale and restructuring classifications remain analyst judgments. Original missing source fields are retained.',{field:'ebit',original:null,value:ebit,components,method:'Revenue − COGS − R&D − SG&A − restructuring − held-for-sale impairment + business-sale gain; same-accession original inline facts.',evidencePath:'./data/current-universe.json',evidenceId:'COHR-CURRENT-2026-06-30'});
  }
  if(company.ticker==='FN'&&raw.id==='FN-FY2026'&&raw.accession==='0001408710-26-000028'&&s.periodEnd==='2026-06-26'&&s.debt==null&&raw.debt===null&&raw.facts?.debt===null){
   return note({...s,debt:0},'Bank debt is USD 0m from the reviewed June 26 balance sheet and borrowings note, not a missing-tag default. Operating leases remain operating costs; tax, severance, awards, warrants and other claims require the separate reviewed Annual model. This simple reference is provisional.',{field:'debt',original:null,value:0,scope:'Bank debt only; no claim that all non-common obligations are zero.',method:'Manual statement audit of current and noncurrent bank debt; both verified zero.',evidencePath:'./data/incremental-FN-2026-10-18-v1/cases.json',evidenceSection:'companies[0].history fiscal_end 2026-06-26: values/provenance.debt_current and debt_noncurrent'});
  }
  return s;
 })};
}
