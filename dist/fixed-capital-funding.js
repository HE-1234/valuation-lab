import {incrementalRecord} from './incremental-registry.js';
// The amount and calendar year come from the immutable source registry, never
// from editable row metadata, factor draws or horizon interpolation.
export function fixedCapitalFunding(d){const r=incrementalRecord(d?.ticker);return (d?.selectedIncrementalScenario?r?.alternatives.find(x=>x.name===d.selectedIncrementalScenario)?.annualCase:r?.annualCase)?.fixedCapitalFunding;}
export function fixedCapitalSettlement(d,year){return fixedCapitalFunding(d)?.schedule.find(row=>row.year===year)?.amount||0;}
export function operatingInvestment(d,row){return row.reinvestment-fixedCapitalSettlement(d,row.year);}
export function scaleOperatingInvestment(d,row,multiplier){if(multiplier===1)return row.reinvestment;const fixed=fixedCapitalSettlement(d,row.year);return (row.reinvestment-fixed)*multiplier+fixed;}
export function fixedCapitalFundingIssues(d){
 const funding=fixedCapitalFunding(d),errors=[],minimumError=d?.ticker==='ASML'?'Total investment cannot be below the selected fixed customer-advance runoff.':'Year 1 total investment cannot be below the fixed opening capex-payable settlement.';
 if(JSON.stringify(d?.fixedCapitalFunding)!==JSON.stringify(funding))errors.push('Retain the reviewed fixed opening-capital funding amount and year.');
 if(!funding)return errors;
 for(const rows of [d.annual,d.derivedForecast?.baselineAnnual])if(Array.isArray(rows))for(const row of rows){const fixed=fixedCapitalSettlement(d,row?.year);if(fixed&&typeof row.reinvestment==='number'&&row.reinvestment<fixed)errors.push(minimumError);if((row?.openingCapitalPayableSettlement!==undefined&&row.openingCapitalPayableSettlement!==fixed)||(row?.fixedOpeningFunding!==undefined&&row.fixedOpeningFunding!==fixed))errors.push('Retain the reviewed fixed opening-capital funding amount and year.');}
 for(const [year,amount]of Object.entries(d.derivedForecast?.investmentOverrides||{}))if(amount<fixedCapitalSettlement(d,Number(year)))errors.push(minimumError);
 return [...new Set(errors)];
}
