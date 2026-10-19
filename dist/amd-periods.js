// Only the first AMD period is partial. H1 actuals are a revenue comparison base,
// never an additional forecast cash flow. Shared by editing, sampling and charts.
// CEVA uses its reviewed H1 source only for comparable full-year growth, never as future cash flow.
export const amdH1Revenue=(d,index)=>d?.ticker==='CEVA'&&index===0?56.057:d?.ticker==='AMD'&&index===0?21789:0;
export const fullFiscalRevenue=(d,row,index)=>row?.revenue+amdH1Revenue(d,index);
export const priorFiscalRevenue=(d,index)=>index?fullFiscalRevenue(d,d.annual[index-1],index-1):d.anchor.revenue;
