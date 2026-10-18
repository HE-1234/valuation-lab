// Optional current-model marginal capital assumptions and read-only diagnostics.
// An absent/disabled path never changes existing cash-flow economics.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const fields=['earlyEndYear','laterSalesCapital','fadeStartYear','terminalYear'];
export function capitalPathDefaults(draft){
 return {enabled:true,version:1,earlyEndYear:5,laterSalesCapital:draft?.assumptions?.salesCapital,fadeStartYear:10,terminalYear:15};
}
export function capitalPathIssues(path){
 if(path===undefined||object(path)&&path.enabled===false)return [];
 if(!object(path)||path.enabled!==true||path.version!==1)return ['Choose a valid optional early/later capital-efficiency path.'];
 const errors=[];
 if(Object.keys(path).some(k=>!['enabled','version',...fields,'inputText'].includes(k)))errors.push('The capital-efficiency path contains unsupported fields.');
 if(!finite(path.laterSalesCapital)||path.laterSalesCapital<=0)errors.push('Later incremental sales / capital must be a positive finite number.');
 if(!['earlyEndYear','fadeStartYear','terminalYear'].every(k=>Number.isInteger(path[k]))||!(path.earlyEndYear>=1&&path.earlyEndYear<path.fadeStartYear&&path.fadeStartYear<path.terminalYear&&path.terminalYear<=30))errors.push('Capital dates require whole years: 1 ≤ early end < fade start < terminal year ≤ 30.');
 if(path.inputText!==undefined&&(!object(path.inputText)||Object.entries(path.inputText).some(([k,v])=>!fields.includes(k)||typeof v!=='string')))errors.push('Retained capital input text must match the four authored fields.');
 return errors;
}
export function resolvedCapitalPath(draft,assumptions=draft.assumptions){
 const errors=capitalPathIssues(draft?.capitalPath);if(errors.length)throw Error(errors.join(' '));
 if(draft?.capitalPath?.enabled!==true)return null;
 const p=draft.capitalPath,a=assumptions,base=draft.assumptions;
 if(![a?.salesCapital,base?.salesCapital].every(x=>finite(x)&&x>0))throw Error('Initial incremental sales / capital must be positive and finite.');
 if(![a.targetMargin,a.tax,a.terminalGrowth,a.terminalROIC].every(finite)||a.targetMargin<=0||a.targetMargin>1||a.tax<0||a.tax>.6||a.terminalGrowth<0||a.terminalGrowth>.05||a.terminalROIC<=a.terminalGrowth)throw Error('A positive mature margin and valid terminal tax, growth and ROIC are required for the capital-efficiency path.');
 // One existing salesCapital draw shifts both authored ratios proportionally.
 // A fixed draw uses the authored later ratio exactly, avoiding round-trip drift.
 const laterSalesCapital=a.salesCapital===base.salesCapital?p.laterSalesCapital:p.laterSalesCapital*(a.salesCapital/base.salesCapital);
 const terminalIntensity=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
 if(!finite(laterSalesCapital)||laterSalesCapital<=0||!finite(1/a.salesCapital)||!finite(1/laterSalesCapital)||!finite(terminalIntensity)||terminalIntensity<=0||!finite(1/terminalIntensity))throw Error('Capital-efficiency arithmetic is nonfinite; revise the ratio or terminal assumptions.');
 return {...p,earlySalesCapital:a.salesCapital,laterSalesCapital,terminalIntensity,terminalSalesCapital:1/terminalIntensity};
}
export function capitalSalesCapitalAtYear(path,year){
 if(!Number.isInteger(year)||year<1||year>30)throw Error('Choose a forecast year from 1 to 30.');
 if(year<=path.earlyEndYear)return path.earlySalesCapital;
 if(year<=path.fadeStartYear)return path.laterSalesCapital;
 const weight=Math.min(1,(year-path.fadeStartYear)/(path.terminalYear-path.fadeStartYear));
 const value=1/((1-weight)/path.laterSalesCapital+weight*path.terminalIntensity);
 if(!finite(value)||value<=0)throw Error('Capital-efficiency arithmetic is nonfinite; revise the ratio assumptions.');
 return value;
}
export function applyCapitalEfficiency(snapshot,draft,base,assumptions=draft.assumptions){
 const path=resolvedCapitalPath(draft,assumptions);if(!path)return base;
 const years=Math.max(base.years,path.terminalYear),start=(snapshot.ebit+draft.normalizationDelta)/snapshot.revenue;
 const yearlyOverrides=Array.from({length:years},(_,i)=>{
  const prior=base.yearlyOverrides?.[Math.min(i,base.yearlyOverrides.length-1)],year=i+1;
  const row=prior?{...prior}:{growth:assumptions.growth+(assumptions.terminalGrowth-assumptions.growth)*Math.min(i,base.years-1)/Math.max(1,base.years-1),margin:start+(assumptions.targetMargin-start)*Math.min(year,base.years)/base.years,taxRate:assumptions.tax,wacc:assumptions.wacc};
  // A one-year scalar forecast has no within-forecast growth fade. Added
  // years must nevertheless use stable growth, including rows extended first
  // by the independent margin adapter. Preserve the original first year.
  if(assumptions.years===1&&(!draft.operatingProfile||draft.operatingProfile.id==='linear-v1')&&year>1)row.growth=assumptions.terminalGrowth;
  return {...row,salesCapital:capitalSalesCapitalAtYear(path,year)};
 });
 return {...base,years,yearlyOverrides};
}

// A supplied starting balance is accepted only with explicit source, basis and
// matching date/currency. Historical cash-only book proxies are not auto-promoted.
function anchorIssue(anchor,date,currency){
 if(anchor===undefined||anchor===null)return 'Annual ROIC is unavailable: a sourced, adjusted opening invested-capital balance is not supplied. The marginal-return proxy does not measure returns on accumulated capital.';
 if(!object(anchor)||anchor.verified!==true||anchor.basis!=='adjusted-operating-invested-capital'||!finite(anchor.value)||anchor.value<=0||!/^https?:\/\//.test(anchor.sourceUrl||'')||!validDate(date)||anchor.date!==date||!currency||anchor.currency!==currency)return 'Annual ROIC is unavailable: opening invested capital must be positive, source-verified, adjusted consistently with operating earnings and investment, and match the forecast anchor date and currency.';
 return null;
}
export function capitalEfficiencyDiagnostics({rows=[],annualPath,defaultSalesCapital,anchorRevenue,anchorDate,currency,investedCapitalAnchor}={}){
 const issue=anchorIssue(investedCapitalAnchor,anchorDate,currency);
 let capital=issue?null:investedCapitalAnchor.value,previousRevenue=anchorRevenue;
 const diagnostics=rows.map((row,i)=>{
  const delta=finite(row.revenue)&&finite(previousRevenue)?row.revenue-previousRevenue:null;
  previousRevenue=row.revenue;
  const supplied=annualPath?.[i]?.salesCapital??defaultSalesCapital;
  const ratio=finite(supplied)&&supplied>0?supplied:finite(delta)&&delta>0&&finite(row.reinvestment)&&row.reinvestment>0?delta/row.reinvestment:null;
  const salesCapital=finite(ratio)&&ratio>0?ratio:null;
  const afterTaxOperatingMargin=finite(row.nopat)&&finite(row.revenue)&&row.revenue>0?row.nopat/row.revenue:null;
  const candidate=salesCapital!==null&&finite(afterTaxOperatingMargin)?salesCapital*afterTaxOperatingMargin:null;
  const marginalReturnProxy=finite(candidate)?candidate:null,wacc=finite(row.wacc)?row.wacc:null;
  const beginningInvestedCapital=capital;
  const nextCapital=finite(capital)&&finite(row.reinvestment)?capital+row.reinvestment:null;
  capital=finite(nextCapital)?nextCapital:null;
  const returnCandidate=finite(beginningInvestedCapital)&&beginningInvestedCapital>0&&finite(row.nopat)?row.nopat/beginningInvestedCapital:null;
  const impliedROIC=finite(returnCandidate)?returnCandidate:null;
  return {year:row.year,salesCapital,afterTaxOperatingMargin,marginalReturnProxy,wacc,proxySpread:finite(marginalReturnProxy)&&wacc!==null?marginalReturnProxy-wacc:null,beginningInvestedCapital,endingInvestedCapital:capital,impliedROIC,roicSpread:impliedROIC!==null&&wacc!==null?impliedROIC-wacc:null,capitalStatus:issue?'missing-anchor':impliedROIC===null?'unavailable-denominator':'anchored'};
 });
 return {status:issue?'proxy-only':'anchored',anchorIssue:issue,definition:'Marginal-return proxy = modeled after-tax operating margin × incremental sales / capital. It is not whole-business ROIC or the change in NOPAT divided by reinvestment. The terminal-consistent marginal proxy equals terminal ROIC / (1 + stable growth) under the model’s same-year investment convention. Annual ROIC, when a reliable opening balance exists, = NOPAT / beginning invested capital; ending capital adds the modeled net reinvestment once.',rows:diagnostics};
}
