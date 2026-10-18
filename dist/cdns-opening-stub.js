/** CDNS's reviewed half-year opening period is separate from the editable annual tail. */
import {incrementalRecord} from './incremental-registry.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function selectedCdnsCase(d){
 const r=incrementalRecord(d?.ticker);if(r?.bridge.type!=='cdns-v3')return null;
 return d.selectedIncrementalScenario?r.alternatives.find(x=>x.name===d.selectedIncrementalScenario)?.annualCase:r.annualCase;
}
export function cdnsOpeningStubIssues(d){
 const c=selectedCdnsCase(d);
 if(!c)return d?.openingStub===undefined?[]:['Opening-stub metadata requires its reviewed company source.'];
 return JSON.stringify(d.openingStub)===JSON.stringify(c.openingStub)&&JSON.stringify(d.anchor)===JSON.stringify(c.anchor)?[]:['Retain the selected CDNS H2 stub, half-year timing and full-FY2026 reference together; they are fixed source-case inputs.'];
}
export function cdnsStubCalculation(d){
 const issues=cdnsOpeningStubIssues(d);if(issues.length)throw Error(issues.join(' '));
 const s=d.openingStub,ebit=s.revenue*s.operatingMargin,tax=Math.max(0,ebit)*s.taxRate,nopat=ebit-tax,fcff=nopat-s.reinvestment,discountFactor=(1+s.wacc)**s.durationYears;
 return {...s,ebit,tax,nopat,fcff,discountFactor,pv:fcff/discountFactor,yearsFromOrigin:s.durationYears,classification:'Selected-case fixed H2 cash flows and discount rate; annual-tail sensitivities exclude this period.'};
}
export function calculateCdnsOperating(d){
 const openingStub=cdnsStubCalculation(d),s=d.openingStub,fcff=openingStub.fcff,stubDiscount=openingStub.discountFactor;
 let prior=d.anchor.revenue,discount=stubDiscount,pv=openingStub.pv,cumulative=fcff,trough=Math.min(0,fcff);
 const rows=d.annual.map(r=>{const ebit=r.revenue*r.margin,tax=Math.max(0,ebit)*r.taxRate,nopat=ebit-tax,fcff=nopat-r.reinvestment;discount*=1+r.wacc;const presentValue=fcff/discount;pv+=presentValue;cumulative+=fcff;trough=Math.min(trough,cumulative);const growth=r.revenue/prior-1,deltaRevenue=r.revenue-prior;prior=r.revenue;
  if(![ebit,tax,nopat,fcff,discount,presentValue,cumulative,growth,pv].every(finite))throw Error('CDNS annual-tail arithmetic exceeded the finite numerical range.');
  return {...r,growth,ebit,tax,nopat,fcff,discountFactor:discount,pv:presentValue,cumulativeFCFF:cumulative,yearsFromOrigin:s.durationYears+r.year,periodEnd:`${2026+r.year}-12-31`,derivedSalesCapital:r.reinvestment!==0?deltaRevenue/r.reinvestment:null};
 });
 const t=d.terminal,last=rows.at(-1),revenue=last.revenue*(1+t.growth),terminalEBIT=revenue*t.margin,terminalNOPAT=terminalEBIT*(1-t.taxRate),reinvestment=terminalNOPAT*t.growth/t.roic,terminalFCFF=terminalNOPAT-reinvestment,value=terminalFCFF/(t.wacc-t.growth),terminalPV=value/discount,enterprise=pv+terminalPV;
 if(![stubDiscount,openingStub.pv,revenue,terminalEBIT,terminalNOPAT,reinvestment,terminalFCFF,value,terminalPV,enterprise].every(finite))throw Error('CDNS stub or terminal arithmetic exceeded the finite numerical range.');
 const terminal={...t,revenue,ebit:terminalEBIT,nopat:terminalNOPAT,reinvestment,fcff:terminalFCFF,value,pv:terminalPV,discountFactor:discount,yearsFromOrigin:s.durationYears+rows.length,fcffGrowth:last.fcff!==0?terminalFCFF/last.fcff-1:null,revenueGrowthEndpointDifference:last.growth-t.growth};
 const warnings=['The selected H2 2026 cash flows and stub discount rate stay fixed. Annual edits, Monte Carlo and horizon extensions affect FY2027 onward only. Source whole-curve WACC sensitivities are different calculations.','The full-FY2026 reference combines reported H1 with normalized H2; it is a forecast reference, not reported full-year actuals. H1 cash flows are not valued again.'];
 if(terminal.fcffGrowth===null||Math.abs(terminal.fcffGrowth-t.growth)>1e-6)warnings.push('Final explicit FCFF and terminal FCFF do not grow at the stable revenue rate. Inspect the capital-transition sensitivity; the original research path is preserved.');
 if(Math.abs(terminal.revenueGrowthEndpointDifference)>1e-6)warnings.push('Final explicit revenue growth differs from terminal growth. The growth endpoint change is separate from the capital transition.');
 if(d.userEdited||d.schemaVersion===2)warnings.push('Edited annual inputs are analyst assumptions. Original capital-component reconciliations may no longer match; check the investment evidence before relying on them.');
 if(rows.some(r=>r.reinvestment<0))warnings.push('A negative investment amount is an explicit asset or working-capital release assumption; it is not created automatically by falling revenue.');
 return {ticker:d.ticker,currency:d.currency,informationAsOf:d.informationAsOf,discountOrigin:d.discountOrigin,openingStub,rows,terminal,forecastPV:pv,annualTailPV:pv-openingStub.pv,terminalPV,enterprise,terminalShare:enterprise>0?terminalPV/enterprise:null,peakEconomicDeficit:Math.max(0,-trough),negativeFCFFYears:rows.filter(r=>r.fcff<0).length+(fcff<0?1:0),warnings,classification:'Conditional June-origin operating research; fixed H2 stub plus editable annual tail. Later October information; not an as-known backtest or current valuation.'};
}
