import {incrementalRecord} from './incremental-registry.js';
import {incrementalBridgeDefinition,calculateIncrementalBridge,incrementalBridgeSensitivity} from './incremental-research-claims.js';
import {calculateCurrentCapitalScenario} from './current-capital-presets.js';
// Standalone dated capital allocations for the October 17 research operating cases.
// This module never computes operating EV, fetches prices, or mutates raw filings.
// A conditional allocation is not a complete claim appraisal or current capital observation.
const finite = value => typeof value === 'number' && Number.isFinite(value);
const clone = value => structuredClone(value);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
export const RESEARCH_BRIDGE_VERSION = '2026-10-17.1';
const SEC = 'https://www.sec.gov/Archives/edgar/data/';
const source = (path) => SEC + path;
const sources = {
 AAPL:source('320193/000032019326000020/aapl-20260627.htm'),
 MSFT:source('789019/000119312526323660/msft-20260630.htm'),
 AMZN:source('1018724/000101872426000026/amzn-20260630.htm'),
 GOOG:source('1652044/000165204426000071/goog-20260630.htm'),
 META:source('1326801/000162828026050705/meta-20260630.htm'),
 NVDA:source('1045810/000104581026000075/nvda-20260726.htm'),
 TSLA:source('1318605/000162828026049270/tsla-20260630.htm'),
 COHR:source('820318/000082031826000020/iivi-20260630.htm'),
 LITE:source('1633978/000162828026057358/lite-20260627.htm'),
 AAOI:source('1158114/000143774926026278/aaoi20260630_10q.htm'),
 NBIS:source('1513845/000110465926094844/nbis-20260812xex99d2.htm'),
 MU:source('723125/000072312526000023/mu-20260903.htm'),
 AVGO:source('1730168/000173016826000080/avgo-20260802.htm'),
 TSM:'https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2026-10/3a94d1034b9e6b22446b674f7aaf3d088a12a193/FS.pdf'
};
const line = (id,label,amount,kind='claim',extra={}) => ({id,label,amount,kind,...extra});
const numberOption=(key,label,value,min=0,max=null,extra={})=>({key,label,type:'number',default:value,min,...(max===null?{}:{max}),...extra});
const enumOption=(key,label,value,values)=>({key,label,type:'select',default:value,values});
const definitions = [
 {ticker:'AAPL',referenceDate:'2026-06-27',shares:14608.963,shareDate:'2026-06-27',cash:62399,debt:84344,
  lines:[line('longSecurities','Noncurrent marketable securities, carrying proxy',84118,'asset')],
  options:[numberOption('legacyLeaseClaim','Finance lease proxy from September 2025',1230,0,null,{sourceReferenceDate:'2025-09-27',sourceUrl:source('320193/000032019325000079/aapl-20250927.htm')})],
  unresolved:['June finance leases are unavailable; the default 1,230 is an explicitly stale September 2025 carry-forward scenario.','Existing employee-award value is unquantified; current common allocation does not assert fully diluted fair value.','Conditional Globalstar redemption proceeds are unquantified and receive no incremental asset credit.'],
  notes:['84,118 of noncurrent securities is added once, outside the snapshot cash of 62,399.','Debt uses exact 11,007 + 71,340 term debt + 1,997 commercial paper, not the rounded debt note.']},
 {ticker:'MSFT',referenceDate:'2026-06-30',shares:7427,shareDate:'2026-06-30',cash:76843,debt:40294,
  lines:[line('longInvestments','Long-term investments, carrying proxy',36348,'asset'),line('financeLeases','Finance lease liabilities',66594)],
  options:[numberOption('taxDisputeClaim','Incremental disputed-tax stress, excluding unquantified penalties/interest',0,0,28900)],
  unresolved:['Long-term investment realizability and overlap with operating economics need review.','The disputed 28,900 tax demand is not a verified additional liability; the default scenario assumes no incremental payment beyond modeled/reserved amounts.','Existing award overhang is unvalued; 24,800 unrecognized compensation and 292 authorized grant shares are not current claim values.'],
  notes:['66,594 finance leases is separate from 40,294 financial debt.','Operating rent remains in operating costs; 21,925 operating leases and 329,100 uncommenced commitments are not deducted again as debt.']},
 {ticker:'AMZN',referenceDate:'2026-06-30',shares:10783,shareDate:'2026-06-30',cash:118301,debt:132224,
  lines:[line('currentEquity','Current marketable equity, already removed from liquid cash',4687,'asset'),line('privateEquity','Nonmarketable equity including Anthropic and OpenAI',122300,'asset'),line('anthropicNotes','Anthropic convertible notes, dated fair-value proxy',97900,'asset'),line('equityMethod','Equity-method and other investments',395,'asset'),line('investmentWarrants','Investment warrants, dated value proxy',4300,'asset'),line('financeLeases','Finance lease liabilities',13451),line('otherFinancing','Other financing obligations, rounded noncurrent component',9315,'claim',{approximate:true})],
  unresolved:['Private investment values are gross carrying/fair-value marks before realization tax and illiquidity; use asset-factor sensitivity.','The 572 energy-derivative net asset is not added: operating/nonoperating overlap is unresolved.','Existing employee-award claims remain unvalued.','Post-June 21,300 OpenAI funding must reduce cash and acquire an investment together; it is outside this June capital scenario.'],
  notes:['Cash is 122,988 cash/current marketables less 4,687 equity. Restricted cash was already excluded.','Other financing of approximately 9,315 is separate from funded debt and finance leases; do not use 11,070 including-interest payments.','Future financing deficits, 15,000 undrawn Anthropic facility and pending Globalstar enterprise consideration are not additional current debt.']},
 {ticker:'GOOG',referenceDate:'2026-06-30',shares:12230,shareDate:'2026-06-30',cash:242474,debt:100164,type:'mandatory-preferred',
  lines:[line('financeLeases','Finance lease liabilities',2590)],
  options:[enumOption('preferredMethod','Preferred allocation method','if-converted',['if-converted','liquidation-proxy']),enumOption('conversionCase','Contractual conversion endpoint','maximum',['minimum','maximum']),numberOption('dividendDiscountRate','Preferred dividend discount rate',.0625,0,1),numberOption('noncontrollingClaim','Noncontrolling-interest carrying proxy',7100),numberOption('noncurrentInvestmentValue','Noncurrent investment value proxy',145587),numberOption('currentEquityHaircut','Haircut on current marketable equity',0,0,1)],
  unresolved:['Full future conversion applied to present equity is an ownership proxy, not option valuation. It assumes cash preferred dividends and no separate pre-conversion common distributions.','Capped-call recovery is assumed zero; the paid 1,011 premium is already in cash/equity and is not deducted again.','Employee awards, investment realization taxes and contingent guarantee losses are not independently valued.','The 25,000 August debt issuance and matched proceeds/uses are outside the June capital reference.'],
  notes:['Cash/current marketables includes 87,063 equity, of which 80,000 restricted; it is not all spendable liquidity.','The 7,100 NCI proxy includes 824 redeemable NCI.','Preferred book value 18,023, liquidation principal and full conversion dilution are mutually exclusive treatments, never cumulative deductions.']},
 {ticker:'META',referenceDate:'2026-06-30',shares:2547.506225,shareDate:'2026-07-24',cash:90260,debt:83664,type:'settlement',
  lines:[line('privateEquity','Nonmarketable investments, carrying proxy',30157,'asset')],
  options:[numberOption('settlementAmount','Legal settlement nominal amount',12700,12700,18000),numberOption('settlementDiscountRate','Settlement discount rate',.10,0,1)],
  unresolved:['Settlement timing is assumed ten equal year-end payments; approval, actual dates and tax deductibility are unresolved.','The upper 18,000 amount includes a conditional 5,300; no probability is assigned.','Restricted cash of 13,809 is excluded, not additional excess cash.','Finance-lease additions/principal need a consistent capex bridge; no unverified extra lease liability is invented.','Existing employee awards and contingent cloud/residual-value guarantees are unvalued.'],
  notes:['The legal claim is deducted here once. Do not also include the same payment in operating cash flow.','The June capital balance is allocated using July 24 shares; this is explicitly a mixed-date share proxy.']},
 {ticker:'NVDA',referenceDate:'2026-07-26',shares:24100,shareDate:'2026-08-21',cash:56586,debt:33366,
  lines:[line('strategicEquity','Marketable and nonmarketable equity, carrying proxy',90681,'asset'),line('equityMethod','Equity-method holdings, carrying proxy',3300,'asset'),line('groqConsideration','Remaining Groq license consideration',986)],
  options:[numberOption('awardDilutionShares','Gross outstanding-award dilution sensitivity',0,0,168)],
  unresolved:['168 million awards are contingent; the default basic allocation does not price existing awards. Full-count dilution can overlap future compensation and is a stress only.','Guarantees and contingent capacity support have no independently estimated expected loss; source maxima are not certain debt.','Investment tax, liquidity and demand correlation are unvalued.'],
  notes:['22,443 cash + 34,143 debt securities excludes the separately added equity investments.','Groq accrued consideration is treated as financing-like once, assuming it is not already settled in modeled working capital.','Operating leases of 5,494 remain within the operating-rent convention.']},
 {ticker:'TSLA',referenceDate:'2026-06-30',shares:3949,shareDate:'2026-06-30',cash:43524,debt:9061,
  lines:[line('financeLeases','Finance lease liabilities',281),line('spaceX','SpaceX investment, carrying proxy',3007,'asset'),line('digitalAssets','Digital assets, June carrying proxy',674,'asset'),line('nci','Redeemable and nonredeemable NCI',661)],
  options:[numberOption('ceoGrossDilutionShares','Gross CEO award-share stress, before contractual offset',0,0,423.743904)],
  unresolved:['The 2025 CEO award is path-dependent and unvalued. Basic-share and maximum gross-share scenarios are allocation stresses, not an option-value range.','Maximum-share stress omits the 334.09 per-share offset and does not claim the milestones are met.','Other employee awards, future financing dilution and after-tax investment realizability are unvalued.'],
  sourceCorrection:{oldMappedDebt:7721,currentFundedDebt:1340,noncurrentFundedDebt:7721,correctedFundedDebt:9061,financeLeases:281,totalDebtAndFinanceLeases:9342,sourceUrl:sources.TSLA},
  notes:['Correct the source mapping immediately: 7,721 was noncurrent only; 1,340 current debt is included here.','2018 exercised options and forfeited 2025 interim shares are not added again to the actual common denominator.','Future economic funding deficits are already outcomes of FCFF and are not deducted as opening debt.']},
 {ticker:'COHR',referenceDate:'2026-06-30',shares:195.832246,shareDate:'2026-08-10',cash:1987.018,debt:3222.224,
  lines:[line('financeLeases','Finance lease liabilities',14.233),line('nci','Noncontrolling-interest carrying proxy',334.705)],
  unresolved:['NCI carrying value is a proxy, not a minority fair-value appraisal.','606.4 restricted cash is excluded; subsidiary restrictions and SiC economics remain to be reconciled.','Existing awards and August special executive PSUs are unvalued. The 100 target award dollars is not debt or a verified share count.'],
  notes:['All Series B preferred converted in FY2026 Q2; no obsolete preferred deduction is retained.','The June capital balance uses August 10 common shares as an explicitly mixed-date allocation proxy.']},
 {ticker:'LITE',referenceDate:'2026-06-27',shares:88.6,shareDate:'2026-06-27',cash:2738.4,debt:1647.1,type:'cash-principal-convertible',
  bridgeVersion:'2026-10-17-lite-v2',reviewPath:'./data/renewed-reviews-2026-10-17/LITE-dated-bridge-v2.html',
  allocationLabel:'June-dated market-claims / intrinsic-operating hybrid',
  preferredCommonEquivalentShares:2.9,lines:[],
  options:[numberOption('convertiblePremiumClaim','June disclosed note fair-value adjustment above principal',6052.9,0,null,{allowUnknown:true,sourceAmount:6052.9}),numberOption('cappedCallAssetValue','June capped-call fair-value asset proxy (approximate)',200,0,null,{sourceAmount:200})],
  requiredInputs:['The saved note fair-value adjustment is explicitly unknown. Enter a value or load the reviewed June bridge values; blank is not zero.'],
  unresolved:['June market-valued notes and capped calls are combined with independently estimated operating EV. This is not a self-consistent intrinsic option valuation or a current October share price.','Employee-award claims remain unvalued; this conditional allocation is incomplete.','The 2.9 million preferred common-equivalents are approximate; they have no separate 2,000 senior claim.','The June-to-October settlement, cash and share roll-forward is incomplete.'],
  notes:['The 6,052.9 adjustment equals 7,607.2 disclosed note fair value less 1,554.3 principal. It is not a separately valued pure option premium.','Funded debt already deducts 1,554.3 convertible principal + 92.8 term principal. No convertible shares or extra coupons are added under the note-fair-value method.','The approximately 200 capped-call value is equity-classified and absent from balance-sheet assets; it is added once, separately from cash. Historical call premiums are not deducted again.','757.8 cumulative conversion requests through August 14 includes 519.4 principal already cash-settled in FY2026. Neither 757.8 nor the 238.4 difference is an extra verified June claim.','All note principal must be cash settled; only excess conversion value may become shares. A zero adjustment is a principal-only stress.']},
 {ticker:'AAOI',referenceDate:'2026-06-30',shares:84.386,shareDate:'2026-06-30',cash:499.737,debt:58.915,type:'convertible-warrant',
  lines:[line('vendorFinancing','Vendor bank acceptance financing',33.940)],
  options:[enumOption('convertibleMethod','Convertible treatment','fair-value',['fair-value','principal-only','if-converted']),numberOption('convertibleFairValue','June disclosed note fair-value proxy',445.1),enumOption('warrantCoverage','Customer warrant-count scenario','all',['all','initially-vested']),numberOption('warrantTimeValueReserve','Additional warrant time-value reserve',0)],
  requiredInputs:['For the selected December 31 forecast origin: a 2026 cash/debt/share roll-forward including completed ATM, intervening cash use and remaining 2026 FCFF.','A date-consistent note value, vendor financing balance and warrant/employee-claim policy.'],
  unresolved:['June note fair value is not an October or December option value.','Customer-warrant intrinsic allocation omits option time value and future vesting uncertainty.','October ATM cash cannot be added to June capital without its 5.694845 million shares and intervening cash spending.','1.909 million expected-to-vest employee awards remain unvalued.'],
  notes:['The June source-date bridge is available only for a June operating origin. It cannot be applied to the selected December forecast origin.']},
 {ticker:'NBIS',referenceDate:'2026-06-30',shares:292.921154,shareDate:'2026-06-30',cash:8042.1,debt:8545.7,type:'specialist-required',lines:[],
  requiredInputs:['Reconcile the December forecast origin with 2026 operating FCFF, capex, cash and customer advances.','Per-series June/August convertible principal, accretion, extinguishment, option value and settlement shares.','Actual secured-facility draws, collateral/restricted cash, August financing proceeds/fees and acquisition consideration.','Common shares including pre-funded warrants once, employee awards, subsidiary SAFE/earnouts and noncore stakes.'],
  unresolved:['June carrying notes of 8,499, nominal 10,041.8 and fair value 20,823.7 are alternative measures, not interchangeable.','June cash, August financing and December operating EV cannot be combined as a current common-equity conclusion.','The 21.065936 million pre-funded warrants are already included in the 292.921154 million economic share reference.'],
  notes:['Operating-only for the selected researched case until a specialist funding and ownership bridge exists.']},
 {ticker:'MU',referenceDate:'2026-09-03',shares:1131,shareDate:'2026-09-03',cash:43434,debt:5179,
  lines:[line('longSecurities','Long-term marketable investments',30019,'asset'),line('privateEquity','Nonmarketable investment carrying proxy',1300,'asset')],
  options:[numberOption('customerDepositClaim','Customer deposit repayment claim, undiscounted proxy',12747,0,12747),numberOption('taxPayableClaim','Existing noncurrent income-tax payable proxy',9820),numberOption('awardDilutionShares','Gross award dilution sensitivity',0,0,22)],
  unresolved:['Deposit repayments are expected in 2029–2031; face value is a deliberately undiscounted claim scenario. Lower values require a repayment/PV assumption, not a claim that cash is free.','The 9,820 tax payable is a carrying proxy; settlement timing and overlap with forecast cash taxes require reconciliation.','Award sensitivity permits 16 service-only plus up to 6 performance shares; this is not a verified economic fair-value claim.','Pricing adjustments/returns of 4,320 remain an operating working-capital obligation; the simple NWC forecast is incomplete.','Grant clawbacks, tax realization and contingencies remain unvalued.'],
  notes:['5,179 debt already includes 2,387 finance leases: do not deduct those leases again.','Restricted cash 27, undrawn revolver and customer letters of credit are not additional liquid assets.','Deposit and tax liabilities are deducted here only if their settlement is not already in supplied operating FCFF.']},
 {ticker:'AVGO',referenceDate:'2026-08-02',shares:4774,shareDate:'2026-08-02',cash:23975,debt:59419,lines:[],
  options:[numberOption('awardDilutionShares','Gross unvested-RSU dilution sensitivity',0,0,165)],
  unresolved:['The complete current finance-lease bridge is unavailable; the result is a funded-debt/common-allocation subtotal before any additional unmodeled finance-lease claim.','Other investment holdings are unreconciled and receive no asset credit.','165 million unvested awards are contingent; default basic allocation leaves their economic value unquantified.','29,000 customer lease-backstop maximum and 42,000 customer note facility are contingent exposure, not Broadcom issued debt. No expected-loss amount is invented.'],
  notes:['Source debt of 59,419 is 2,252 current plus 57,167 noncurrent.','Future procurement remains in operating/capital spending; commitments are not automatically subtracted a second time.']},
 {ticker:'TSM',currency:'TWD',referenceDate:'2026-09-30',shares:25932,shareDate:'2026-09-30',cash:4016979,debt:1031578,
  lines:[line('nci','Noncontrolling-interest carrying proxy',45326)],
  options:[numberOption('legacyLeaseClaim','FY2025 lease carry-forward sensitivity',35428,0,null,{sourceReferenceDate:'2025-12-31',sourceUrl:source('1046179/000162828026025362/tsm-20251231.htm')}),numberOption('customerReceiptClaim','FY2025 customer-receipt carry-forward sensitivity',291101.8,0,null,{sourceReferenceDate:'2025-12-31',sourceUrl:source('1046179/000162828026025362/tsm-20251231.htm')}),numberOption('nonoperatingInvestmentValue','Long-term investments: incremental excluded-asset value assumption',0,0,224633)],
  unresolved:['September lease and customer-receipt balances are missing. Default 35,428 and 291,101.8 are explicit FY2025 carry-forward sensitivities, not verified September liabilities.','Long investments of 224,633 mix operating/equity-method and financial assets; default no incremental credit avoids assuming they are all nonoperating.','25,932 million ordinary shares is issuer-rounded. Current award claims are unquantified.','No valuation-date spot FX has been verified. USD ADS output remains blocked; flow-average FX is not a substitute.'],
  notes:['All outputs remain native TWD per ordinary share. No USD ticker or ADS conversion is inferred.','IFRS lease debt treatment assumes matching lease D&A/reinvestment in supplied FCFF; do not also deduct lease principal from the same FCFF.','Customer receipt claim must not duplicate repayment or receivable-offset costs already in operating working capital.']}
].map(d=>({currency:'USD',...d,sourceUrl:sources[d.ticker],informationAsOf:'2026-10-17',moneyUnit:'millions',shareUnit:'millions',classification:'Source-dated conditional capital allocation; retrospective October 17 research, not information knowable at the capital date',claimCompleteness:'partial',shareBasis:d.ticker==='TSM'?'TWD ordinary share, issuer-rounded common count':'Dated common-share allocation; additional contingent claims remain as listed'}));

const sharedOptions=[numberOption('assetValueFactor','Value factor on separately listed investment assets',1,0,1),numberOption('operatingCashReserve','Cash retained outside the equity allocation',0),numberOption('additionalClaimAllowance','Explicit additional unvalued-claim sensitivity',0),numberOption('additionalDilutionShares','Explicit additional dilution sensitivity, millions',0)];
export function researchBridgeDefinition(ticker){if(incrementalRecord(ticker))return incrementalBridgeDefinition(ticker);const d=definitions.find(x=>x.ticker===ticker);return d?clone({...d,optionDefinitions:[...sharedOptions,...(d.options||[])]}):null;}
export function researchBridgeDefinitions(){return definitions.map(d=>researchBridgeDefinition(d.ticker));}
export function researchBridgeOptionDefinitions(ticker){return researchBridgeDefinition(ticker)?.optionDefinitions||[];}
function readOptions(d,options){
 const values={};for(const field of [...sharedOptions,...(d.options||[])]){
  const v=Object.prototype.hasOwnProperty.call(options,field.key)?options[field.key]:field.default;
  if(v===null&&(field.default===null||field.allowUnknown)){values[field.key]=null;continue;}
  if(field.type==='select'){if(!field.values.includes(v))throw Error(`${field.label}: unsupported selection.`);}
  else if(!finite(v)||(finite(field.min)&&v<field.min)||(finite(field.max)&&v>field.max))throw Error(`${field.label}: use a finite value within its explicit bounds.`);
  values[field.key]=v;
 }
 if(values.operatingCashReserve>d.cash)throw Error('Operating cash reserve exceeds dated source cash.');
 return values;
}
function originOf(c){return c?.discountOrigin||c?.valuationTiming?.discountOrigin||c?.anchor?.periodEnd;}
function blocked(d,operatingEV,origin,calculationDate,reasons){return {status:'operating-only',eligible:false,modelId:`${d.ticker}-${d.bridgeVersion||RESEARCH_BRIDGE_VERSION}`,ticker:d.ticker,currency:d.currency,operatingEV,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,referenceDate:d.referenceDate,capitalReferenceDate:d.referenceDate,shareReferenceDate:d.shareDate,discountOrigin:origin,calculationDate,informationAsOf:d.informationAsOf,basisMismatch:origin!==d.referenceDate||calculationDate!==d.referenceDate,classification:d.classification,reasons,requiredInputs:d.requiredInputs||reasons,warnings:[...d.unresolved,...d.notes],unresolved:[...d.unresolved],sources:[{url:d.sourceUrl,date:d.referenceDate}],optionDefinitions:researchBridgeOptionDefinitions(d.ticker)};}
export function researchPreferredDividendSchedule(discountRate=.0625){
 if(!finite(discountRate)||discountRate<0||discountRate>1)throw Error('Invalid preferred dividend discount rate.');
 const rows=[{date:'2026-08-15',amount:19.25*12.15}];
 for(let year=2026;year<=2029;year++)for(const month of [2,5,8,11]){const date=`${year}-${String(month).padStart(2,'0')}-15`;if(date>'2026-08-15'&&date<='2029-05-15')rows.push({date,amount:19250*.0625/4});}
 return rows.sort((a,b)=>a.date.localeCompare(b.date)).map(row=>({...row,presentValue:row.amount/(1+discountRate)**((Date.parse(row.date)-Date.parse('2026-06-30'))/(365.25*86400000))}));
}
export function calculateResearchBridge(operatingCase,operatingEV,options={}){
 if(operatingCase?.incrementalResearch||incrementalRecord(operatingCase?.ticker))return calculateIncrementalBridge(operatingCase,operatingEV,options);
 // Opt-in current capital stays separate from every frozen source-date gate.
 // Invalid supplied scenarios fail closed; never fall back to old economics.
 if(Object.prototype.hasOwnProperty.call(operatingCase||{},'currentCapitalScenario')){
  const scenario=operatingCase.currentCapitalScenario;
  if(scenario?.ticker!==operatingCase.ticker)throw Error('Capital scenario belongs to a different company.');
  if(options.outputCurrency&&options.outputCurrency!==operatingCase.currency)throw Error('No verified FX mapping: retain native reporting-currency output.');
  if(options.securityBasis&&options.securityBasis!=='ordinary-common')throw Error('No verified alternate-security mapping: retain ordinary/common-share output.');
  const result=calculateCurrentCapitalScenario(scenario,{enterprise:operatingEV,currency:operatingCase.currency,date:options.calculationDate||originOf(operatingCase),status:operatingCase.timing?.mode==='as-of-scenario'?'scenario':'origin'});
  return {...result,ticker:operatingCase.ticker,discountOrigin:originOf(operatingCase),informationAsOf:operatingCase.informationAsOf,referenceDate:scenario.asOf,sources:scenario.sources||[],unresolved:scenario.unresolved||[],provenance:operatingCase.currentCapitalProvenance||null};
 }
 const d=researchBridgeDefinition(operatingCase?.ticker);if(!d)throw Error('No source-dated research bridge for this company.');
 if(!finite(operatingEV))throw Error('Operating EV must be finite; negative values are supported.');
 if(operatingCase.currency!==d.currency)throw Error('Operating EV currency must match the dated capital-reference currency.');
 const origin=originOf(operatingCase),calculationDate=options.calculationDate||origin;
 if(!validDate(origin)||!validDate(calculationDate))throw Error('A valid discount origin and calculation date are required.');
 const explicitSource=operatingCase.sourceUrl||operatingCase.anchor?.provenance?.primarySourceUrl;
 if(explicitSource&&explicitSource!==d.sourceUrl)throw Error('The supplied source does not match this reviewed capital-reference source.');
 if(options.informationAsOf&&(!validDate(options.informationAsOf)||options.informationAsOf<d.informationAsOf))throw Error('These bridge definitions use information through October 17, 2026.');
 if(options.outputCurrency&&options.outputCurrency!==d.currency)throw Error('No verified FX mapping: retain native reporting-currency output.');
 if(options.securityBasis&&options.securityBasis!=='ordinary-common')throw Error('No verified alternate-security mapping: retain ordinary/common-share output.');
 const values=readOptions(d,options),warnings=[...d.notes,...d.unresolved];
 if(d.type==='specialist-required')return blocked(d,operatingEV,origin,calculationDate,d.requiredInputs);
 if(d.ticker==='AAOI'&&origin!==d.referenceDate)return blocked(d,operatingEV,origin,calculationDate,['June capital cannot be allocated against the December 31 forecast-origin EV without the missing 2026 operating/capital bridge.']);
 if(d.ticker==='LITE'&&values.convertiblePremiumClaim===null)return blocked(d,operatingEV,origin,calculationDate,d.requiredInputs);
 const rows=[],sourcesUsed=[{url:d.sourceUrl,date:d.referenceDate}],add=(id,label,amount,kind='claim',extra={})=>{
  if(!finite(amount)||amount<0)throw Error(`Nonfinite or negative bridge amount: ${id}`);
  rows.push({id,label,amount,kind,currency:kind==='shares'?null:d.currency,unit:kind==='shares'?'million shares':'millions',referenceDate:d.referenceDate,sourceUrl:d.sourceUrl,classification:'source-reported amount used as explicit conditional valuation proxy',...extra});return amount;
 };
 add('cash','Dated cash/liquid marketable reference',d.cash,'asset');add('fundedDebt','Funded debt reference',d.debt);
 let shares=d.shares,dividends=[],warrantClaim=0;
 for(const item of d.lines){const amount=item.kind==='asset'?item.amount*values.assetValueFactor:item.amount;add(item.id,item.label,amount,item.kind,{...item,amount,sourceAmount:item.amount,valuationFactor:item.kind==='asset'?values.assetValueFactor:1});}
 const assumed=(key,label,kind='claim',extra={})=>add(key,label,values[key],kind,{classification:'explicit analytical scenario input; not a verified current fair value',...extra});
 assumed('operatingCashReserve','Operating-cash reserve excluded from allocation');
 assumed('additionalClaimAllowance','Additional unvalued-claim sensitivity');
 if(values.additionalClaimAllowance===0)warnings.push('Zero additional-claim allowance is an explicit sensitivity setting; unresolved claims are listed and are not verified absent.');
 if(values.operatingCashReserve===0)warnings.push('No separate cash reserve is deducted in this scenario. Cash needed for the forecast investment program is not necessarily distributable; assess funding separately without charging future FCFF deficits twice.');
 const extraShares=values.additionalDilutionShares+(values.awardDilutionShares||0)+(values.ceoGrossDilutionShares||0);
 if(extraShares){add('additionalShares','Explicit gross additional-share sensitivity',extraShares,'shares',{classification:'analytical dilution stress; vesting/offset and compensation overlap unresolved'});shares+=extraShares;}
 if(values.legacyLeaseClaim!==undefined){const opt=d.options.find(x=>x.key==='legacyLeaseClaim');assumed('legacyLeaseClaim','Dated annual finance-lease carry-forward proxy','claim',{referenceDate:opt.sourceReferenceDate,sourceUrl:opt.sourceUrl});sourcesUsed.push({url:opt.sourceUrl,date:opt.sourceReferenceDate});}
 if(d.ticker==='MSFT')assumed('taxDisputeClaim','Incremental disputed-tax scenario');
 if(d.ticker==='META'){
  const amount=Array.from({length:10},(_,i)=>values.settlementAmount/(10*(1+values.settlementDiscountRate)**(i+1))).reduce((a,b)=>a+b,0);
  add('legalSettlementPV','Ten equal year-end legal payments: illustrative PV',amount,'claim',{classification:'analytical payment schedule; nominal source amount is not a present value',sourceAmount:values.settlementAmount});
 }
 if(d.type==='mandatory-preferred'){
  assumed('noncurrentInvestmentValue','Noncurrent investment value proxy','asset');
  assumed('noncontrollingClaim','Noncontrolling-interest proxy');
  add('currentEquityHaircut','Current marketable-equity haircut',87063*values.currentEquityHaircut,'claim',{classification:'analytical haircut on equity already included in cash reference'});
  if(values.preferredMethod==='if-converted'){
   const additional=values.conversionCase==='minimum'?43.56275:54.45825;shares+=additional;add('preferredConversion',`${values.conversionCase} contractual preferred-conversion shares`,additional,'shares');
   dividends=researchPreferredDividendSchedule(values.dividendDiscountRate);add('preferredDividendPV','Contractual cash preferred dividend PV at June 30',dividends.reduce((s,x)=>s+x.presentValue,0),'claim',{classification:'modeled contractual cash dividends; no liquidation-principal deduction'});
  }else add('preferredLiquidation','Preferred face plus accrued liquidation sensitivity',19336,'claim',{classification:'liquidation sensitivity, not fair value; no preferred conversion shares or future dividend PV'});
 }
 if(d.ticker==='LITE'){
  shares+=d.preferredCommonEquivalentShares;add('commonEquivalentPreferred','Approximate preferred common-equivalent shares',d.preferredCommonEquivalentShares,'shares');
  const dated=(key,label,kind,sourceAmount)=>assumed(key,label,kind,{sourceAmount,approximate:key==='cappedCallAssetValue',classification:values[key]===sourceAmount?'June 27 disclosed market-value proxy; conditional allocation, not an internally solved intrinsic claim':'explicit analytical sensitivity overriding the dated source proxy'});
  dated('convertiblePremiumClaim','Disclosed note fair-value adjustment above principal','claim',6052.9);
  dated('cappedCallAssetValue','Equity-classified capped-call value, added once','asset',200);
  if(values.convertiblePremiumClaim===0)warnings.push('Principal-only convertible stress: a zero premium adjustment is an explicit omission of option value, not an estimated fair common-equity value.');
 }

 if(d.ticker==='MU'){assumed('customerDepositClaim','Customer deposit repayment claim');assumed('taxPayableClaim','Existing noncurrent tax payable');}
 if(d.ticker==='TSM'){const opt=d.options.find(x=>x.key==='customerReceiptClaim');assumed('customerReceiptClaim','FY2025 customer receipts: carry-forward claim sensitivity','claim',{referenceDate:opt.sourceReferenceDate,sourceUrl:opt.sourceUrl});assumed('nonoperatingInvestmentValue','Incremental nonoperating investment value assumption','asset');sourcesUsed.push({url:opt.sourceUrl,date:opt.sourceReferenceDate});}
 if(d.ticker==='AAOI'){
  if(values.convertibleMethod==='if-converted'){const added=124.925*23.0884/1000;shares+=added;add('noteConversionShares','Immediate full-share conversion counterfactual',added,'shares');warnings.push('Immediate note conversion is a counterfactual; no note principal, fair value or future coupon is deducted.');}
  else add('convertibleNote',values.convertibleMethod==='fair-value'?'June disclosed note fair-value proxy':'Convertible principal-only stress',values.convertibleMethod==='fair-value'?values.convertibleFairValue:124.925);
  assumed('warrantTimeValueReserve','Additional customer-warrant time-value reserve');
 }
 const sum=kind=>rows.filter(x=>x.kind===kind).reduce((s,x)=>s+x.amount,0);
 let equity=operatingEV+sum('asset')-sum('claim');
 if(d.ticker==='AAOI'){
  const count=values.warrantCoverage==='all'?7.945399:1.324233,strike=23.6956;
  if(equity/shares>strike){const diluted=(equity+strike*count)/(shares+count);warrantClaim=Math.max(0,diluted-strike)*count;}
  add('customerWarrant','Customer-warrant intrinsic claim',warrantClaim,'claim',{classification:'intrinsic-only approximation, not complete option value'});equity-=warrantClaim;
 }
 const rawPerShare=equity/shares;if(![equity,shares,rawPerShare].every(finite)||shares<=0)throw Error('Nonfinite research capital allocation.');
 const basisMismatch=origin!==d.referenceDate||calculationDate!==d.referenceDate||d.shareDate!==d.referenceDate;
 if(basisMismatch)warnings.unshift(`Dated-capital proxy: operating value at ${calculationDate} (forecast origin ${origin}), capital at ${d.referenceDate}, shares at ${d.shareDate}. No current cash/debt/share roll-forward is asserted.`);
 if(d.ticker==='LITE')warnings.unshift('June-dated market-claims / intrinsic-operating hybrid: note and capped-call values are fixed June proxies in every operating simulation trial; option values are not re-solved as operating value changes. Employee claims remain incomplete.');
 warnings.unshift('Retrospective research through October 17, 2026. This is a conditional common allocation before the named unvalued items, not a complete fair-value appraisal or a market-price target.');
 if(d.ticker==='LITE'&&values.convertiblePremiumClaim===0)warnings.unshift('Principal-only convertible stress: the note fair-value adjustment is zero. This omits option value and is not a complete fair common-equity estimate.');
 if(d.ticker==='AVGO')warnings.unshift('Known-capital subtotal: additional finance-lease liabilities remain unquantified.');
 return {status:'conditional',eligible:true,modelId:`${d.ticker}-${d.bridgeVersion||RESEARCH_BRIDGE_VERSION}`,ticker:d.ticker,currency:d.currency,moneyUnit:'millions',operatingEV,enterprise:operatingEV,equity,rawPerShare,perShare:rawPerShare,flooredPerShare:Math.max(0,rawPerShare),equityFloor:Math.max(0,equity),allocationShares:shares,basicShares:d.shares,referenceDate:d.referenceDate,capitalReferenceDate:d.referenceDate,shareReferenceDate:d.shareDate,discountOrigin:origin,calculationDate,informationAsOf:d.informationAsOf,basisMismatch,classification:d.classification,claimCompleteness:d.claimCompleteness,securityBasis:d.shareBasis,rows,dividends,warrantClaim,assetTotal:sum('asset'),claimTotal:sum('claim'),warnings,unresolved:[...d.unresolved],sources:sourcesUsed,inputs:values,optionDefinitions:d.optionDefinitions,sourceCorrection:d.sourceCorrection||null,...(d.ticker==='LITE'?{allocationLabel:values.convertiblePremiumClaim===0?'June-dated principal-only convertible stress':d.allocationLabel,reviewPath:d.reviewPath,claimValuationMethod:'fixed-june-market-claims',claimRepricedPerTrial:false}:{}),currentCapitalVerified:false,priceComparisonEligible:false};
}
export function researchBridgeSensitivity(operatingCase,operatingEV,options={}){
 if(operatingCase?.incrementalResearch||incrementalRecord(operatingCase?.ticker))return incrementalBridgeSensitivity(operatingCase,operatingEV,options);
 if(Object.prototype.hasOwnProperty.call(operatingCase||{},'currentCapitalScenario'))return []; // Legacy option variants do not describe this separate scenario.
 const d=researchBridgeDefinition(operatingCase?.ticker);if(!d)return [];
 const variants=[['Source-date reference',{}],['No credit for separately listed investment assets',{assetValueFactor:0}]];
 if(d.ticker==='GOOG')variants.push(['Minimum preferred conversion',{conversionCase:'minimum'}],['Preferred liquidation proxy',{preferredMethod:'liquidation-proxy'}],['Noncurrent investment value: 25% haircut',{noncurrentInvestmentValue:145587*.75}],['Current equity: 25% haircut',{currentEquityHaircut:.25}]);
 if(d.ticker==='META')variants.push(['Full conditional legal settlement',{settlementAmount:18000}]);
 if(d.ticker==='MSFT')variants.push(['Full disclosed tax demand, before penalties',{taxDisputeClaim:28900}]);
 if(d.ticker==='TSLA')variants.push(['Maximum gross CEO-share dilution, offset omitted',{ceoGrossDilutionShares:423.743904}]);
 const award=d.options?.find(x=>x.key==='awardDilutionShares');if(award)variants.push(['Maximum gross award-share sensitivity',{awardDilutionShares:award.max}]);
 if(d.ticker==='LITE')variants.push(['No capped-call recovery',{cappedCallAssetValue:0}],['Principal-only stress: note adjustment and call recovery omitted',{convertiblePremiumClaim:0,cappedCallAssetValue:0}]);
 if(d.ticker==='AAOI')variants.push(['Principal-only note stress',{convertibleMethod:'principal-only'}],['Immediate full-share note conversion',{convertibleMethod:'if-converted'}],['Initially vested customer warrants',{warrantCoverage:'initially-vested'}]);
 return variants.map(([label,changes])=>{try{const result=calculateResearchBridge(operatingCase,operatingEV,{...options,...changes});return {label,changes,status:result.status,equity:result.equity,perShare:result.perShare,rawPerShare:result.rawPerShare,flooredPerShare:result.flooredPerShare,allocationShares:result.allocationShares,classification:'Named analytical capital scenario; no probability or fair-value confidence interval assigned',warnings:result.warnings};}catch(error){return {label,changes,status:'invalid',error:error.message};}});
}
