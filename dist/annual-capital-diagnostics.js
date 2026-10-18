// Read-only diagnostics for the direct-investment annual model. These values
// never generate investment, change the draft or enter the valuation engine.
const finite=value=>typeof value==='number'&&Number.isFinite(value);

export function annualCapitalDiagnostics(d,index=0){
 const row=Number.isInteger(index)&&index>=0?d?.annual?.[index]:null;
 const previous=index===0?d?.anchor?.revenue:d?.annual?.[index-1]?.revenue;
 const validRevenue=finite(row?.revenue)&&row.revenue>0&&finite(previous)&&previous>0;
 const change=validRevenue?row.revenue-previous:null;
 const deltaRevenue=finite(change)?change:null,reinvestment=finite(row?.reinvestment)?row.reinvestment:null;
 let effectiveMarginalSalesCapital=null,marginalAfterTaxReturnProxy=null,ratioReason='',proxyReason='';
 if(deltaRevenue===null)ratioReason='Positive current and prior revenue are required.';
 else if(deltaRevenue<=0)ratioReason='Revenue must increase; flat or falling sales do not imply a useful marginal S:C.';
 else if(reinvestment===null||reinvestment<=0)ratioReason='Positive net investment is required; zero investment or a capital release has no meaningful ratio.';
 else{
  const ratio=deltaRevenue/reinvestment;
  if(finite(ratio)&&ratio>0)effectiveMarginalSalesCapital=ratio;
  else ratioReason='The ratio is outside the finite positive numerical range.';
 }
 if(effectiveMarginalSalesCapital===null)proxyReason=ratioReason;
 else if(!finite(row?.margin)||row.margin<0||row.margin>1||!finite(row?.taxRate)||row.taxRate<0||row.taxRate>.6)proxyReason='The proxy requires a nonnegative margin up to 100% and a valid 0–60% operating tax rate; loss years are N/A.';
 else{
  const proxy=row.margin*(1-row.taxRate)*effectiveMarginalSalesCapital;
  if(finite(proxy)&&(proxy>0||row.margin===0))marginalAfterTaxReturnProxy=proxy;
  else proxyReason='The return proxy is outside the finite numerical range.';
 }
 return {
  year:row?.year??null,deltaRevenue,reinvestment,effectiveMarginalSalesCapital,marginalAfterTaxReturnProxy,ratioReason,proxyReason,
  // The reviewed annual package supplies no verified invested-capital stock.
  // Revenue/S:C, cumulative forecast spending, cash or claims are not substitutes.
  actualROIC:null,
  actualROICReason:'No verified starting invested-capital base is supplied in this annual research case.',
  terminalROIC:finite(d?.terminal?.roic)&&d.terminal.roic>0?d.terminal.roic:null
 };
}
