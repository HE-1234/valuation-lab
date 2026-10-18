import {incrementalRecord} from './incremental-registry.js';
export function camtFundingPolicy(d){
 const r=incrementalRecord(d?.ticker);if(r?.bridge.type!=='camt-ev-only-v1')return null;
 return (d.selectedIncrementalScenario?r.alternatives.find(a=>a.name===d.selectedIncrementalScenario)?.annualCase:r.annualCase)?.camtFundingPolicy;
}
export function camtAnnualFunding(d,index,row=d.annual[index]){
 const p=camtFundingPolicy(d);if(!p)return null;
 const prior=index?d.annual[index-1].revenue:d.anchor.revenue,delta=Math.max(0,row.revenue-prior),physicalNetCapex=(p.capex-p.depreciation)*row.revenue,incrementalNWC=p.nwc*delta,incrementalOperatingCash=p.operatingCash*delta,fundingFloor=physicalNetCapex+incrementalNWC+incrementalOperatingCash;
 const nopat=row.revenue*row.margin-Math.max(0,row.revenue*row.margin)*row.taxRate,fade=Math.min(1,Math.max(0,(row.year-5)/5)),early=Math.max(delta/p.salesCapital,fundingFloor),requiredInvestment=Math.max(fundingFloor,(1-fade)*early+fade*nopat*d.terminal.growth/d.terminal.roic),reinvestment=Math.max(row.reinvestment,requiredInvestment);
 return {enteredReinvestment:row.reinvestment,physicalNetCapex,incrementalNWC,incrementalOperatingCash,fundingFloor,requiredInvestment,investmentFloorTopUp:reinvestment-row.reinvestment,reinvestment};
}
export function camtTerminalFunding(d,revenue,reinvestment){
 const p=camtFundingPolicy(d);if(!p)return null;
 const delta=Math.max(0,revenue-d.annual.at(-1).revenue),floor=(p.capex-p.depreciation)*revenue+(p.nwc+p.operatingCash)*delta;
 if(!Number.isFinite(floor)||reinvestment+1e-8<floor)throw Error('CAMT terminal g/ROIC investment is below the physical, working-capital and operating-cash funding floor. Revise the terminal assumptions.');
 return {fundingFloor:floor};
}
