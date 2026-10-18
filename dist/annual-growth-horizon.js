import {operatingCashChange,operatingCashPolicy} from './fn-operating-cash.js';
import {fixedCapitalSettlement,operatingInvestment,fixedCapitalFundingIssues} from './fixed-capital-funding.js';
import {incrementalCaseVersion,incrementalIdentityValid} from './incremental-research-identity.js';
// Explicit, editable horizon sensitivities. Frozen research cases are never changed.
import {marginPathIssues,marginAtYear} from './margin-path.js';
import {RESEARCH_PROFILE_ID,RESEARCH_VERSION} from './annual-research-identity.js';
export const ANNUAL_GROWTH_HORIZON_VERSION='annual-growth-horizon-v1';
export const DERIVED_CAPITAL_POLICY='committed-floor-plus-growth-v1';
export const ANNUAL_GROWTH_HORIZONS=Object.freeze([10,15,20]);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const fields=['revenue','margin','taxRate','reinvestment','wacc'];
const validRows=rows=>Array.isArray(rows)&&rows.length>0&&rows.length<=30&&rows.every((r,i)=>object(r)&&r.year===i+1&&fields.every(k=>finite(r[k]))&&r.revenue>0&&r.margin>=-.5&&r.margin<=1&&r.taxRate>=0&&r.taxRate<=.6&&r.wacc>0&&r.wacc<=1);
const validTerminal=t=>object(t)&&['growth','margin','taxRate','roic','wacc'].every(k=>finite(t[k]))&&t.growth>=0&&t.growth<=.05&&t.margin>0&&t.margin<=1&&t.taxRate>=0&&t.taxRate<=.6&&t.roic>t.growth&&t.wacc>t.growth&&t.wacc<=1;
export function annualHorizonIssues(d){
 const p=d?.derivedForecast,errors=[];
 if(!object(p)||p.version!==ANNUAL_GROWTH_HORIZON_VERSION||p.capitalPolicy!==DERIVED_CAPITAL_POLICY||d.capitalPolicy!==DERIVED_CAPITAL_POLICY)return ['A complete supported derived annual-horizon policy is required.'];
 if(p.revenuePathPreserved!==undefined&&typeof p.revenuePathPreserved!=='boolean')errors.push('The preserved-revenue path marker must be explicit.');
 if(p.revenuePathPreserved===true&&p.growthMaturityYear!==p.sourceForecastHorizonYears)errors.push('A margin-only extension must retain its source growth-horizon identity.');
 if(!ANNUAL_GROWTH_HORIZONS.includes(p.growthMaturityYear))errors.push('Choose 10, 15 or 20 years to stable revenue growth.');
 if(!Number.isInteger(p.sourceForecastHorizonYears)||p.sourceForecastHorizonYears<1||p.sourceForecastHorizonYears>30)errors.push('Retain the original research forecast horizon.');
 if(!validRows(p.baselineAnnual)||p.baselineAnnual.length<p.sourceForecastHorizonYears)errors.push('Retain a complete, valid pre-change annual baseline.');
 if(p.generatedTerminal!==undefined&&!validTerminal(p.generatedTerminal))errors.push('Retain valid generated terminal assumptions.');
 if(!validTerminal(p.baselineTerminal))errors.push('Retain valid pre-change terminal assumptions.');
 if(![3,5].includes(p.explicitEarlyYears)||p.explicitEarlyYears>=p.growthMaturityYear||p.explicitEarlyYears>=p.baselineAnnual?.length)errors.push('Retain three or five near-term revenue years before the fade.');
 if(!finite(p.marginalSalesCapital)||p.marginalSalesCapital<=0)errors.push('A positive explicit marginal sales / capital assumption is required.');
 const overrides=p.economicOverrides??{};
 if(!object(overrides)||Object.entries(overrides).some(([year,r])=>!/^([1-9]|[12][0-9]|30)$/.test(year)||!object(r)||!['margin','taxRate','wacc'].every(k=>finite(r[k]))||r.margin<-.5||r.margin>1||r.taxRate<0||r.taxRate>.6||r.wacc<=0||r.wacc>1))errors.push('Retained calendar-year economic overrides must be valid.');
 const investmentOverrides=p.investmentOverrides??{};
 if(!object(investmentOverrides)||Object.entries(investmentOverrides).some(([year,value])=>!/^([1-9]|[12][0-9]|30)$/.test(year)||!finite(value)))errors.push('Retained manual investment overrides must be finite calendar-year amounts.');
 if(!Array.isArray(p.generatedReinvestment)||p.generatedReinvestment.length!==d.forecastHorizonYears||!p.generatedReinvestment.every(finite))errors.push('Retain the complete generated investment vector separately from manual overrides.');
 const investmentEnd=object(investmentOverrides)?Math.max(0,...Object.keys(investmentOverrides).map(Number)):0;
 const economicEnd=object(overrides)?Math.max(0,...Object.keys(overrides).map(Number)):0;
 if(p.marginExtensionYears!==undefined&&(!Number.isInteger(p.marginExtensionYears)||p.marginExtensionYears<1||p.marginExtensionYears>30))errors.push('Retain a valid explicitly extended margin schedule.');
 const marginEnd=Math.max(p.marginExtensionYears||0,d.marginPath?.enabled===true?d.marginPath.terminalYear:0);
 const marginOverrideEnd=d.marginPath?.enabled===true&&object(d.marginPath.manualOverrides)?Math.max(0,...Object.keys(d.marginPath.manualOverrides).map(Number)):0;
 const requiredYears=Math.max(p.baselineAnnual?.length||0,p.growthMaturityYear,economicEnd,investmentEnd,marginEnd,marginOverrideEnd);
 if(d.marginPath?.enabled===true?d.forecastHorizonYears<requiredYears:d.forecastHorizonYears!==requiredYears)errors.push('The complete derived schedule must cover both revenue maturity and the retained operating timeline.');
 return errors;
}

export function terminalCapitalIntensity(t){
 if(!validTerminal(t))throw Error('Complete valid terminal assumptions before deriving a growth horizon.');
 // With end-of-year revenue: ΔR = R*g/(1+g). This intensity makes
 // investment = R*margin*(1-tax)*g/ROIC at stable growth, including g=0.
 const intensity=(1+t.growth)*t.margin*(1-t.taxRate)/t.roic;
 if(!finite(intensity)||intensity<=0)throw Error('Terminal capital intensity is outside the finite numerical range.');
 return intensity;
}

// The generator uses the retained pre-change baseline. Monte Carlo can pass the
// current edited annual schedule as baselineAnnual so zero stress preserves edits.
export function calculateDerivedReinvestment(d,revenueRows,{baselineAnnual=d.derivedForecast?.baselineAnnual}={}){
 const p=d.derivedForecast;
 if(!p||!validRows(baselineAnnual)||!Array.isArray(revenueRows)||revenueRows.length<baselineAnnual.length||!finite(p.marginalSalesCapital)||p.marginalSalesCapital<=0)throw Error('A complete baseline and marginal capital assumption are required.');
 let prior=d.anchor.revenue,basePrior=d.anchor.revenue;
 const intensity=terminalCapitalIntensity(d.terminal);
 return revenueRows.map((row,i)=>{
  const revenue=typeof row==='number'?row:row?.revenue;
  if(!finite(revenue)||revenue<=0)throw Error(`Year ${i+1}: a positive finite revenue is required.`);
  const delta=revenue-prior;prior=revenue;
  let investment;
  if(i<baselineAnnual.length){
   const base=baselineAnnual[i],baseDelta=base.revenue-basePrior;basePrior=base.revenue;
   if(revenue===base.revenue&&delta===baseDelta)return base.reinvestment;
   const scale=Math.max(1,revenue/base.revenue);
   // Retain the signed explicit release once, never amplify it. Positive source
   // investment is a committed floor; reduced sales never release it automatically.
   const operating=operatingInvestment(d,base),fixed=fixedCapitalSettlement(d,base.year);
   const floor=Math.min(operating,0)+Math.max(operating,0)*scale+fixed;
   const extraExpansion=Math.max(0,delta-Math.max(0,baseDelta)*scale);
   investment=floor+extraExpansion/p.marginalSalesCapital;
  }else investment=Math.max(0,delta)*intensity-operatingCashChange(d,i,revenueRows);
  if(!finite(investment))throw Error(`Year ${i+1}: derived investment exceeded the finite numerical range.`);
  return investment;
 });
}

function requireAnnualIdentity(d,c){
 const fundingIssues=fixedCapitalFundingIssues(d);if(fundingIssues.length)throw Error(fundingIssues.join(' '));
 if(!object(d)||![1,2].includes(d.schemaVersion)||!validRows(d.annual)||!validTerminal(d.terminal)||!finite(d.anchor?.revenue)||d.anchor.revenue<=0)throw Error('Complete valid annual and terminal inputs before deriving a growth horizon.');
 if((d.incrementalResearch&&!incrementalIdentityValid(d))||!c||d.profileId!==RESEARCH_PROFILE_ID||d.version!==(incrementalCaseVersion(c)||RESEARCH_VERSION)||d.sourceScenario!==c.scenario||d.caseId!==`${incrementalCaseVersion(c)||RESEARCH_VERSION}:${c.ticker}:${c.scenario}`||(d.schemaVersion===2&&d.derivedForecast?.sourceForecastHorizonYears!==c.forecastHorizonYears)||d.forecastHorizonYears!==d.annual.length||(d.schemaVersion===1&&d.forecastHorizonYears!==c.forecastHorizonYears)||d.ticker!==c.ticker||d.currency!==c.currency||d.discountOrigin!==c.valuationTiming?.discountOrigin||(!d.incrementalResearch&&d.anchor.revenue!==c.anchor?.revenue))throw Error('The derived forecast must retain its original dated research identity.');

}

export function deriveAnnualGrowthHorizon(d,c,{growthMaturityYear,explicitEarlyYears,marginalSalesCapital}={}){
 requireAnnualIdentity(d,c); if(!ANNUAL_GROWTH_HORIZONS.includes(growthMaturityYear))throw Error('Choose 10, 15 or 20 years to stable revenue growth.');
 if(d.schemaVersion===2){const issues=annualHorizonIssues(d);if(issues.length)throw Error(issues.join(' '));}
 const previous=d.schemaVersion===2?d.derivedForecast:null;
 const baselineAnnual=structuredClone(previous?.baselineAnnual||d.annual),baselineTerminal=structuredClone(previous?.baselineTerminal||d.terminal);
 const early=explicitEarlyYears??previous?.explicitEarlyYears??(['MSFT','MU','TSM'].includes(d.ticker)?5:3);
 if(![3,5].includes(early)||early>=baselineAnnual.length||early>=growthMaturityYear)throw Error('Retain three or five near-term years before the growth fade.');
 const intensity=terminalCapitalIntensity(d.terminal),sc=marginalSalesCapital??previous?.marginalSalesCapital??1/intensity;
 if(!finite(sc)||sc<=0)throw Error('Marginal sales / capital must be positive and finite.');
 // Revenue and investment seeds never compound across selector changes. Calendar
 // economics remain independently editable, including edited extension years.
 const economicOverrides=structuredClone(previous?.economicOverrides||{}),investmentOverrides=structuredClone(previous?.investmentOverrides||{});
 const marginOverrides=currentMarginOverrides(d);
 if(d.marginPath?.enabled===true){const errors=marginPathIssues(d.marginPath);if(errors.length)throw Error(errors.join(' '));}
 if(previous)d.annual.forEach((row,i)=>{
  if(row.reinvestment!==previous.generatedReinvestment[i])investmentOverrides[row.year]=row.reinvestment;
  else delete investmentOverrides[row.year];
  if(i<baselineAnnual.length){for(const k of ['margin','taxRate','wacc'])baselineAnnual[i][k]=row[k];}
  else{const reference=previous.generatedTerminal||previous.baselineTerminal;
   if((d.marginPath?.enabled===true?['taxRate','wacc']:['margin','taxRate','wacc']).some(k=>row[k]!==reference[k]))economicOverrides[row.year]={margin:row.margin,taxRate:row.taxRate,wacc:row.wacc};
   else delete economicOverrides[row.year];
  }
 });
 const next=structuredClone(d),n=Math.max(baselineAnnual.length,growthMaturityYear,...Object.keys(economicOverrides).map(Number),...Object.keys(investmentOverrides).map(Number),d.marginPath?.enabled===true?d.marginPath.terminalYear:0,previous?.marginExtensionYears||0,...Object.keys(marginOverrides).map(Number)),last=baselineAnnual.length;
 next.schemaVersion=2;next.forecastHorizonYears=n;next.userEdited=true;next.capitalPolicy=DERIVED_CAPITAL_POLICY;
 next.derivedForecast={version:ANNUAL_GROWTH_HORIZON_VERSION,revenuePathPreserved:false,...(previous?.marginExtensionYears?{marginExtensionYears:previous.marginExtensionYears}:{}),sourceForecastHorizonYears:c.forecastHorizonYears,growthMaturityYear,explicitEarlyYears:early,baselineAnnual,baselineTerminal,economicOverrides,investmentOverrides,generatedTerminal:structuredClone(d.terminal),marginalSalesCapital:sc,capitalPolicy:DERIVED_CAPITAL_POLICY,
  classification:'Editable analyst sensitivity derived from the retained annual case; not an extended research forecast.',
  capitalAssumption:'Retain positive calendar-year net investment as a floor, scale it upward with revenue, and fund additional expansion at the stated marginal sales / capital. Preserve explicit releases without amplification. Added years use terminal-ROIC capital intensity. Explicit manual investment overrides take precedence and retain their calendar year. Gross capex, maintenance, working capital and customer advances are not separately rebuilt.',
  capitalTiming:'Added-year investment = max(0, current minus prior revenue) × (1 + stable growth) × mature margin × (1 − mature tax) / terminal ROIC. At stable growth this equals current-year NOPAT × stable growth / ROIC.',
  regenerationBasis:'The retained pre-change path. Applying another horizon rebuilds generated revenue and investment while preserving explicit manual investment overrides; full Undo retains the preceding edited draft.'};
 let prior=d.anchor.revenue;
 const growth=baselineAnnual.map(r=>{const g=r.revenue/prior-1;prior=r.revenue;return g;});
 prior=d.anchor.revenue;
 next.annual=Array.from({length:n},(_,i)=>{
  const year=i+1;
  let revenue;
  if(year<=early)revenue=baselineAnnual[i].revenue;
  else if(year>=growthMaturityYear)revenue=prior*(1+d.terminal.growth);
  else{
   // Resample the complete post-near-term source shape; never assume it is linear.
   const position=early+(year-early)*(last-early)/(growthMaturityYear-early);
   const lo=Math.floor(position),hi=Math.min(last,lo+1),weight=position-lo;
   const endpoint=y=>y===last?d.terminal.growth:growth[y-1];
   const g=endpoint(lo)*(1-weight)+endpoint(hi)*weight;
   revenue=prior*(1+g);
  }
  if(!finite(revenue)||revenue<=0)throw Error(`Year ${year}: derived revenue exceeded the positive finite numerical range.`);
  prior=revenue;
  const base=baselineAnnual[i];
  return base?{...base,revenue}:{year,period:`Year ${year} · derived extension`,revenue,margin:d.terminal.margin,taxRate:d.terminal.taxRate,reinvestment:0,wacc:d.terminal.wacc,...economicOverrides[year]};
 });
 if(next.marginPath?.enabled===true){
  next.marginPath.generatedMargins=next.annual.map(r=>marginAtYear(next.marginPath,r.year));
  next.marginPath.manualOverrides=marginOverrides;
  next.annual.forEach((r,i)=>{r.margin=Object.prototype.hasOwnProperty.call(marginOverrides,r.year)?marginOverrides[r.year]:next.marginPath.generatedMargins[i];});
 }
 const investments=calculateDerivedReinvestment(next,next.annual);
 next.derivedForecast.generatedReinvestment=investments;
 next.annual.forEach((r,i)=>{r.reinvestment=Object.prototype.hasOwnProperty.call(investmentOverrides,r.year)?investmentOverrides[r.year]:investments[i];});
 if(next.ticker==='MRVL')next.annual.forEach((r,i)=>{r.period=`FY${2028+i}`;});
 if(next.ticker==='SNPS')next.annual.forEach((r,i)=>{r.period=`FY${2027+i}`;});
 const issues=annualHorizonIssues(next);if(issues.length)throw Error(issues.join(' '));
 return next;
}


function currentMarginOverrides(d){
 if(d.marginPath?.enabled!==true)return {};
 const overrides=structuredClone(d.marginPath.manualOverrides||{});
 d.annual.forEach((row,i)=>{if(row.margin!==d.marginPath.generatedMargins?.[i])overrides[row.year]=row.margin;else delete overrides[row.year];});
 return overrides;
}

// Used by the margin adapter before it installs the newly requested margin path.
// Existing rows remain exact. The adapter completes margin metadata and validates
// the complete returned draft after replacing only the annual margin values.
export function extendAnnualForMargin(d,c,terminalYear){
 requireAnnualIdentity(d,c);
 if(!Number.isInteger(terminalYear)||terminalYear<1||terminalYear>30)throw Error('Choose a margin endpoint from year 1 to year 30.');
 if(d.schemaVersion===2){const issues=annualHorizonIssues(d);if(issues.length)throw Error(issues.join(' '));}
 const next=structuredClone(d);
 if(terminalYear<=next.annual.length){
  if(next.schemaVersion===2)next.derivedForecast.marginExtensionYears=Math.max(next.derivedForecast.marginExtensionYears||0,terminalYear);
  return next;
 }
 const oldLength=next.annual.length,intensity=terminalCapitalIntensity(next.terminal);
 if(next.schemaVersion===1){
  next.schemaVersion=2;next.capitalPolicy=DERIVED_CAPITAL_POLICY;
  next.derivedForecast={version:ANNUAL_GROWTH_HORIZON_VERSION,revenuePathPreserved:true,marginExtensionYears:terminalYear,sourceForecastHorizonYears:c.forecastHorizonYears,growthMaturityYear:c.forecastHorizonYears,
   explicitEarlyYears:['MSFT','MU','TSM'].includes(c.ticker)?5:3,baselineAnnual:structuredClone(d.annual),baselineTerminal:structuredClone(d.terminal),economicOverrides:{},investmentOverrides:{},generatedTerminal:structuredClone(d.terminal),generatedReinvestment:d.annual.map(r=>r.reinvestment),marginalSalesCapital:1/intensity,capitalPolicy:DERIVED_CAPITAL_POLICY,
   classification:'Margin-only analyst extension: existing revenue and capital rows retained; no new revenue-growth horizon selected.',
   capitalAssumption:'Existing annual investment is unchanged. Added years use stable-compatible terminal-ROIC net investment; explicit manual overrides remain editable. No gross-capex or customer-advance budget is inferred.',
   capitalTiming:'Added-year investment = max(0, current minus prior revenue) × (1 + stable growth) × mature margin × (1 − mature tax) / terminal ROIC.',
   regenerationBasis:'Existing revenue path retained for margin-only extension. Explicitly selecting a growth horizon rebuilds generated revenue and capital from the retained baseline.'};
 }
 next.derivedForecast.marginExtensionYears=Math.max(next.derivedForecast.marginExtensionYears||0,terminalYear);
 let prior=next.annual.at(-1).revenue;
 for(let year=oldLength+1;year<=terminalYear;year++){
  const revenue=prior*(1+next.terminal.growth),reinvestment=Math.max(0,revenue-prior)*intensity-(operatingCashPolicy(next)?.ratio||0)*revenue*next.terminal.growth;
  if(!finite(revenue)||!finite(reinvestment))throw Error('Margin extension exceeded the finite numerical range.');
  next.annual.push({year,period:`Year ${year} · margin-path extension`,revenue,margin:next.terminal.margin,taxRate:next.terminal.taxRate,reinvestment,wacc:next.terminal.wacc});
  next.derivedForecast.generatedReinvestment.push(reinvestment);prior=revenue;
 }
 next.forecastHorizonYears=next.annual.length;next.userEdited=true;
 if(next.ticker==='MRVL')next.annual.forEach((r,i)=>{r.period=`FY${2028+i}`;});
 if(next.ticker==='SNPS')next.annual.forEach((r,i)=>{r.period=`FY${2027+i}`;});
 return next;
}
