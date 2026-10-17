/** Read-only evidence adapter. No default setting, valuation changes, network or storage. */
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const uniq=xs=>[...new Set(xs.filter(Boolean))];
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s));
const percent=new Intl.NumberFormat('en-US',{style:'percent',maximumFractionDigits:1});
export function formatEvidenceValue(value,unit='percent'){
 if(!finite(value))return 'Unavailable';
 if(['percent','rate','%'].includes(unit))return percent.format(value);
 if(['multiple','x'].includes(unit))return value.toLocaleString('en-US',{maximumFractionDigits:2})+'×';
 if(unit==='years')return value.toLocaleString('en-US')+' years';
 return value.toLocaleString('en-US',{maximumFractionDigits:1});
}
export function historyRange(series=[]){
 const values=series.filter(x=>x.rangeEligible!==false&&finite(x.value)).map(x=>x.value).sort((a,b)=>a-b);
 if(!values.length)return null;
 const n=values.length;return {min:values[0],max:values[n-1],median:n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2,count:n,classification:'Observed historical range; not a suggested input range or forecast.'};
}
const SPECS={
 growth:{title:'Annual revenue growth',metric:'growth',unit:'percent',formula:'(Revenue − prior fiscal-year revenue) / prior fiscal-year revenue',summary:'Compare your growth story with the company’s actual annual expansion and contractions.',caution:'Your input starts a ten-year forecast. Business mix, acquisitions and the size of the starting base can make past growth a poor forecast.',related:[['Revenue','revenue','money'],['Operating margin','operatingMargin','percent',true]]},
 targetMargin:{title:'Reported operating margin',metric:'operatingMargin',unit:'percent',formula:'Operating income / revenue',summary:'Your target is a future mature margin. History shows the range the company has actually earned.',caution:'Reported GAAP/IFRS margins include accounting charges. Normalize only specific sourced items; adjusted management margins are not silently substituted.',related:[['Operating income','operatingIncome','money'],['Revenue','revenue','money']]},
 tax:{title:'Reported effective income-tax rate',metric:'effectiveTaxRate',unit:'percent',formula:'Income tax expense / positive pretax income',summary:'Use historical effective rates to understand the tax record, then justify the forward operating cash-tax rate.',caution:'Pretax losses produce no usable rate. Benefits or rates above 100% stay visible but are excluded from the range. Accounting effective tax is not a marginal cash-tax rate, and this model has no NOL ledger.',related:[['Pretax income','pretaxIncome','money'],['Tax expense / benefit','incomeTaxExpense','money']]},
 salesCapital:{title:'Historical sales / book-capital proxy',metric:'bookSalesCapitalProxy',unit:'multiple',kind:'proxy',formula:'Revenue / (year-end book equity + mapped debt − cash equivalents)',summary:'A historical accounting cross-check for capital efficiency. The forecast input is incremental revenue per unit of reinvestment.',caution:'These are different ratios. This cash-only book proxy omits securities deductions and R&D/lease normalization; acquisitions, financing and buybacks distort it. Never copy it mechanically into incremental sales/capital.',related:[['Cash capex / revenue','capexToSales','percent',true],['Change in sales / change in book-capital proxy','incrementalBookSalesCapitalProxy','multiple',true],['Cash-only book-capital proxy','bookCapitalProxy','money']]},
 terminalROIC:{title:'Historical return on book-capital proxy',metric:'bookROICProxy',unit:'percent',kind:'proxy',formula:'EBIT × (1 − meaningful effective tax rate) / prior-year cash-only book-capital proxy',summary:'Historical returns provide context for your mature-business return assumption; they do not establish a perpetual return.',caution:'The denominator is prior fiscal-year capital, not ending or average capital. This unadjusted accounting proxy is withheld for missing/nonpositive capital or unusable taxes. Future marginal returns can differ sharply.',related:[['Reported operating margin','operatingMargin','percent',true],['Sales / book-capital proxy','bookSalesCapitalProxy','multiple',true]]},
 normalizationDelta:{title:'Reported operating income before your adjustment',field:'operatingIncome',unit:'money',kind:'context',formula:'Issuer operating income, or explicitly sourced derived operating subtotal',summary:'This is the operating-profit record before your analyst adjustment. There is no historically observed “correct” normalization amount.',caution:'Explain each adjustment and cite its source. Recurrent stock compensation, R&D and maintenance costs are not automatically added back.',related:[['Operating margin','operatingMargin','percent',true],['Stock-based compensation / sales','sbcToSales','percent',true]]},
 bridge:{title:'Historical cash and mapped debt context',field:'cashAndEquivalents',unit:'money',kind:'context',formula:'Reported cash and equivalents; mapped debt shown separately',summary:'Past balances help inspect the bridge, but additional assets and claims require a current claim-by-claim review.',caution:'Missing is not zero. Cash here excludes securities; mapped debt may omit leases or short-term facilities. Do not add these balances again as “other” assets/claims. Weighted-average diluted shares are not an actual-date ownership claim.',related:[['Mapped debt proxy','mappedDebt','money'],['Book equity','bookEquity','money'],['Period-end common shares','periodEndCommonShares','shares'],['Noncontrolling interests','noncontrollingInterest','money'],['Preferred equity','preferredEquity','money']]}
};
const ALIASES={terminalRoic:'terminalROIC',otherAssets:'bridge',otherClaims:'bridge',cash:'bridge',debt:'bridge',shares:'bridge'};
function evidenceRows(company,spec,cutoff){
 return (company?.annual||[]).map(row=>{
  const fact=spec.field?row.facts?.[spec.field]:row.metrics?.[spec.metric];
  const urls=uniq(fact?.sourceUrls||[fact?.sourceUrl]);
  const fields=spec.field?[spec.field]:(fact?.components||[]);
  const prior=fact?.priorPeriodEnd?([company.baseObservation,...(company.annual||[])].filter(Boolean).find(x=>x.periodEnd===fact.priorPeriodEnd)):null;
  const filedDates=fields.map(k=>row.facts?.[k]?.filedAt).filter(Boolean);
  if(prior)filedDates.push(...['revenue','bookCapitalProxy'].map(k=>prior.facts?.[k]?.filedAt).filter(Boolean));
  const newest=[...filedDates,fact?.availableFrom,fact?.filedAt].filter(Boolean).sort().at(-1)||null;
  const future=validDate(cutoff)&&(row.periodEnd>cutoff||newest&&newest>cutoff);
  return {period:row.period,periodStart:row.periodStart,periodEnd:row.periodEnd,periodType:'annual',currency:row.currency||company.currency,value:future?null:finite(fact?.value)?fact.value:null,unit:spec.unit,classification:spec.kind||fact?.classification||'derived',rangeEligible:!future&&fact?.rangeEligible!==false,sourceUrl:urls[0]||null,sourceUrls:urls,filedAt:newest,formula:fact?.formula||spec.formula,detail:future?'Latest-reported evidence for this period was filed after your selected date; withheld.':fact?.reason||fact?.caution||fact?.note||null,numerator:fact?.numerator??null,denominator:fact?.denominator??null,priorPeriodEnd:fact?.priorPeriodEnd||null};
 });
}
function group(company,title,key,unit,metric,cutoff){return {title,unit:unit==='money'?company.currency+' millions':unit==='shares'?'million shares':unit,series:evidenceRows(company,metric?{metric:key,unit}:{field:key,unit},cutoff)};}
function pointsFromMarket(refs,cutoff){
 const rf=refs?.riskFreeReference,erp=refs?.equityRiskPremiumReference;
 return [rf&&{label:rf.instrument||'Currency-matched risk-free reference',value:rf.decimal,unit:'percent',date:rf.observationDate,currency:rf.currency,sourceUrl:rf.sourceURL,classification:'Observed market reference, not company WACC'},erp&&{label:'Dated implied equity risk premium',value:erp.decimal,unit:'percent',date:erp.referenceDate,availableFrom:(erp.updatedAt||erp.publishedAt||erp.referenceDate)?.slice(0,10),sourceUrl:erp.sourceURL,classification:'Model-dependent market estimate',detail:erp.caution}].filter(x=>x&&finite(x.value)&&(!validDate(cutoff)||(x.availableFrom||x.date)<=cutoff));
}
function baseAnswer(dataset,company,ticker,key){return {ticker,key,currency:company?.currency||null,title:'Company evidence unavailable',unit:'percent',kind:'unavailable',status:'unavailable',series:[],range:null,contextSeries:[],components:[],sources:[],summary:'No sourced evidence is included for this input.',cautions:[...(company?.cautions||[])],formula:null,asOf:dataset?.asOf||null,backtestEligible:false,historyBasis:company?.accountingBasis||dataset?.classification||'Latest-reported research history'};}
function ttmPoint(snapshot,key){
 const r=snapshot?.raw||snapshot;if(r?.snapshotMode!=='ttm')return null;
 const f=r.facts||{},revenue=snapshot?.revenue??f.revenue,ebit=snapshot?.ebit??f.operatingIncome??f.EBIT;
 let value=null,formula='';
 if(key==='targetMargin'&&finite(revenue)&&revenue>0&&finite(ebit)){value=ebit/revenue;formula='TTM EBIT / TTM revenue';}
 if(key==='tax'&&finite(f.pretaxIncome)&&f.pretaxIncome>0&&finite(f.incomeTaxExpense)){value=f.incomeTaxExpense/f.pretaxIncome;formula='TTM income tax expense / TTM pretax income';}
 if(!finite(value))return null;
 return {period:'TTM through '+(r.periodEnd||r.fiscalPeriodEnd||''),periodEnd:r.periodEnd||r.fiscalPeriodEnd,periodType:'ttm',value,formula,sourceUrl:r.sourceUrl||r.sourceURL||snapshot.sourceUrl,detail:'Separate trailing-twelve-month observation; excluded from annual range.'};
}
/**
 * Returns {title,unit,kind,status,series,range,summary,cautions,formula,sources,
 * contextSeries:[{title,unit,series}],components,ttm,asOf,backtestEligible:false}.
 * Rates are decimal fractions; monetary values are reporting-currency millions.
 * Status: available | partial | proxy | contextual | unavailable.
 * No function modifies assumptions, market references, input data or model gates.
 */
export function assumptionEvidence(dataset,ticker,inputKey,{snapshot=null,marketReferences=null,cutoff=null}={}){
 const company=Array.isArray(dataset?.companies)?dataset.companies.find(c=>c.ticker===ticker):dataset?.companies?.[ticker];
 const key=ALIASES[inputKey]||inputKey,result=baseAnswer(dataset,company,ticker,inputKey);
 if(!company)return result;
 const spec=SPECS[key];
 if(spec){
  Object.assign(result,{title:spec.title,unit:spec.unit==='money'?company.currency+' millions':spec.unit,kind:spec.kind||'historical',formula:spec.formula,summary:spec.summary});
  result.series=evidenceRows(company,spec,cutoff);result.range=historyRange(result.series);
  result.contextSeries=(spec.related||[]).map(([title,k,u,metric])=>group(company,title,k,u,metric,cutoff));
  result.cautions.unshift(spec.caution);
  const known=result.series.filter(x=>finite(x.value)).length;
  result.status=known?(spec.kind==='proxy'?'proxy':spec.kind==='context'?'contextual':known===result.series.length?'available':'partial'):'unavailable';
  result.ttm=validDate(cutoff)&&(snapshot?.availableFrom||snapshot?.raw?.filedAt||snapshot?.filedAt||'').slice(0,10)>cutoff?null:ttmPoint(snapshot,key);
  if(key==='tax'&&ticker==='NBIS')result.cautions.unshift('Nebius’s FY2025 pretax profit includes a large investment revaluation gain despite an operating loss. Its tax ratio is not a normalized operating tax-rate anchor.');
  if(inputKey==='otherAssets'){result.title='Other assets: reported balance-sheet context';result.contextSeries.unshift(group(company,'Cash and equivalents','cashAndEquivalents','money',false,cutoff),group(company,'Mapped noncurrent marketable securities','marketableSecuritiesNoncurrent','money',false,cutoff));result.series=[];result.range=null;result.status='contextual';result.summary='The correct additional non-operating asset adjustment is not a reported historical metric. Review the sourced balances below and avoid duplicating cash already in the model.';}
  if(inputKey==='otherClaims'){result.title='Other claims: reported balance-sheet context';result.series=[];result.range=null;result.status='contextual';result.summary='There is no single reported historical “other claims” adjustment. Review debt, preferred/minority interests and outstanding awards; missing fields are unknown, not zero.';}
 }else if(key==='terminalGrowth'){
  Object.assign(result,{title:'Perpetual growth needs an economic anchor',kind:'context',status:'contextual',summary:'A company has no reported historical “terminal growth” rate. Choose a sustainable long-run nominal rate consistent with the cash-flow currency and mature economy.',formula:'Terminal reinvestment rate = terminal growth / terminal ROIC'});
  result.contextSeries=[group(company,'Annual revenue growth, not perpetual growth','growth','percent',true,cutoff)];
  result.components=pointsFromMarket(marketReferences,cutoff).filter(x=>x.label!=='Dated implied equity risk premium');
  result.cautions.unshift('Historical high growth cannot continue forever. The risk-free reference is only context and must match the valuation currency. Growth must stay below WACC.');
 }else if(['wacc','riskFree','equityPremium','beta','countryPremium','costOfDebt','debtWeight'].includes(key)){
  Object.assign(result,{title:key==='wacc'?'Build WACC from dated components':'WACC component evidence',kind:'context',status:'contextual',summary:'WACC is an estimate of the required return, not a reported historical company metric.',formula:'(Risk-free + beta × ERP + country premium) × equity weight + cost of debt × (1 − marginal tax) × debt weight'});
  result.components=pointsFromMarket(marketReferences,cutoff);
  if(key==='riskFree')result.components=result.components.filter(x=>x.currency);
  if(key==='equityPremium')result.components=result.components.filter(x=>!x.currency);
  result.cautions.unshift('No historical company WACC or beta is invented. Company beta, borrowing cost, marginal tax, geography and market-value capital weights require sourced estimates. Dated market references do not silently set your input.');
  if(company.currency!=='USD')result.cautions.unshift('USD Treasury/ERP references are not a currency-matched WACC for '+company.currency+' cash flows.');
  if(!result.components.length)result.status='unavailable';
 }else if(key==='years'){
  Object.assign(result,{title:'Forecast horizon',unit:'years',kind:'context',status:'contextual',summary:'The ten-year forecast horizon is a modeling choice. It has no historical company counterpart.',formula:'Explicit forecast followed by a mature-business terminal period'});
 }
 if(ticker==='NBIS')result.summary+=' This series is FY2025-recast continuing operations; old Yandex group totals are excluded.';
 if(ticker==='NBIS'&&key==='tax')result.summary+=' FY2025’s tax ratio is excluded from the range because investment gains obscure operating losses.';
 if(ticker==='TSM'){
  result.summary+=' Annual history is IASB IFRS in TWD; it is not interchangeable with the current TIFRS TTM series.';
  for(const point of result.components)if(point.currency&&point.currency!==company.currency)point.label+=' (USD-only context; not a TWD risk-free rate)';
 }
 result.sources=uniq([...result.series.flatMap(x=>x.sourceUrls||[]),...result.contextSeries.flatMap(g=>g.series.flatMap(x=>x.sourceUrls||[])),...result.components.map(x=>x.sourceUrl)]).map(url=>({url,title:url.includes('sec.gov')?'SEC annual filing / issuer evidence':'Primary reference'}));
 if(result.range)result.range.label='Historical range · '+result.range.count+' annual observations';
 result.cautions.push('History is latest-reported, not a point-in-time archive. Observed ranges describe the past; they are not recommended assumptions.');
 return result;
}
export const assumptionHistoryKeys=Object.freeze(['growth','targetMargin','tax','salesCapital','wacc','terminalGrowth','terminalROIC','normalizationDelta','otherAssets','otherClaims','years']);
