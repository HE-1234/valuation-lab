/** MRVL: fixed half-year opening stub, expensed-R&D annual cash flows, capitalized-R&D terminal. */
import {incrementalRecord} from './incremental-registry.js';
export const MRVL_MESSAGES={
 stub:['Retain the selected MRVL H2 FY2027 stub and full-year reference together; they are fixed source-case inputs.','请一并保留选定的 MRVL 2027 财年下半年及全年参考；它们是固定来源情景输入。'],
 terminal:['MRVL terminal assumptions do not fund positive nonresearch investment and the supplier, working-capital and operating-cash floor. Revise terminal growth, margin or ROIC.','MRVL 终值假设未覆盖正的非研发投资及供应商、营运资本和经营现金下限。请调整终值增长率、利润率或投入资本回报率。'],
 finite:['MRVL operating arithmetic exceeded the finite numerical range. Reduce the edited inputs.','MRVL 经营计算超出有限数值范围，请减小编辑输入。'],
 timing:['MRVL source H2 timing is fixed. A different valuation date requires a newly reviewed partial-period operating and capital bridge.','MRVL 来源下半年时点固定。其他估值日期需要重新审核部分期间经营及资本调整。'],
 note:['MRVL margins expense R&D and future grants. Terminal economic NOPAT adds net capitalized research investment, which is also funded once. Fixed H2 FY2027 is excluded from annual edits and simulations; annual tail FY2028–FY2042 uses source one-year intervals.','MRVL 利润率费用化研发及未来授予。终值经济税后营业利润增加净资本化研发投资，并仅计入一次资金需求。固定的 2027 财年下半年不受年度编辑及模拟影响；2028–2042 财年按来源的一年间隔折现。'],
 funding:['MRVL entered nonresearch investment is retained and topped up to recomputed capital, supplier-deposit, working-capital and operating-cash requirements in every trial. Treasury access and actual liquidity adequacy remain unknown.','每次试验保留 MRVL 输入非研发投资，并补足重算的资本、供应商保证金、营运资本及经营现金需求。融资渠道及实际流动性充足程度仍未知。']
};
export function selectedMrvlCase(d){const r=incrementalRecord(d?.ticker);if(r?.bridge.type!=='mrvl-ev-only-v3')return null;return d.selectedIncrementalScenario?r.alternatives.find(x=>x.name===d.selectedIncrementalScenario)?.annualCase:r.annualCase;}
export function mrvlOpeningStubIssues(d){const c=selectedMrvlCase(d);if(!c)return [];return JSON.stringify(c.openingStub)===JSON.stringify(d.openingStub)&&JSON.stringify(c.anchor)===JSON.stringify(d.anchor)?[]:[MRVL_MESSAGES.stub[0]];}
export function calculateMrvlOperating(d){
 const issues=mrvlOpeningStubIssues(d);if(issues.length)throw Error(issues.join(' '));
 const c=selectedMrvlCase(d),s=c.openingStub,source=s.sourceRow,p=c.mrvlFundingPolicy,t=d.terminal;
 const stubEBIT=s.revenue*s.operatingMargin,stubTax=Math.max(0,stubEBIT)*s.taxRate,stubNOPAT=stubEBIT-stubTax,stubFCFF=stubNOPAT-s.reinvestment,stubDiscount=(1+s.wacc)**s.durationYears;
 const openingStub={...s,ebit:stubEBIT,tax:stubTax,nopat:stubNOPAT,fcff:stubFCFF,discountFactor:stubDiscount,pv:stubFCFF/stubDiscount,yearsFromOrigin:.5,classification:'Fixed selected-source H2 FY2027'};
 let prior=d.anchor.revenue,discount=stubDiscount,pv=openingStub.pv,cumulative=stubFCFF,trough=Math.min(0,stubFCFF),capacity=source.capacity_prepayments_end,nwc=source.other_operating_nwc_end,cash=source.operating_cash_end;
 const stableResearchNetRatio=p.terminalResearchRatio*(1-Array.from({length:5},(_,i)=>(1+t.growth)**(-i-1)).reduce((a,b)=>a+b,0)/5),stableEconomicNopatRatio=t.margin*(1-t.taxRate)+stableResearchNetRatio,stableNonresearchRatio=stableEconomicNopatRatio*t.growth/t.roic-stableResearchNetRatio;
 // With zero growth the continuing capital stock can be maintained at zero net investment.
 if(!Number.isFinite(stableNonresearchRatio)||stableNonresearchRatio< -1e-10)throw Error(MRVL_MESSAGES.terminal[0]);
 const terminalSC=t.growth>0?(t.growth/(1+t.growth))/stableNonresearchRatio:Infinity;
 const rows=d.annual.map((r,i)=>{
  const src=c.annual[Math.min(i,c.annual.length-1)].sourceRow,delta=r.revenue-prior,contraction=delta<0?.03*r.revenue:0,otherChange=delta>=0?Math.max(0,p.otherNWCRatio*r.revenue-nwc):contraction,capacityChange=Math.max(0,.05*r.revenue-capacity),cashChange=Math.max(0,Math.max(1000,.08*r.revenue)-cash),floor=otherChange+capacityChange+cashChange;
  const idx=i+1,fade=Math.max(0,Math.min(1,(idx-4)/6)),nearSC=c.annual[3].sourceRow.sales_to_nonresearch_capital,sc=idx<5?src.sales_to_nonresearch_capital:(t.growth===0?Infinity:nearSC+(terminalSC-nearSC)*fade),required=Math.max(floor,Math.max(0,delta)/sc+contraction),reinvestment=Math.max(r.reinvestment,required);
  const ebit=r.revenue*r.margin,tax=Math.max(0,ebit)*r.taxRate,nopat=ebit-tax,fcff=nopat-reinvestment;discount*=1+r.wacc;const presentValue=fcff/discount;pv+=presentValue;cumulative+=fcff;trough=Math.min(trough,cumulative);
  const growth=r.revenue/prior-1;prior=r.revenue;capacity+=capacityChange;nwc+=otherChange;cash+=cashChange;
  if(![ebit,tax,nopat,fcff,discount,presentValue,pv,reinvestment].every(Number.isFinite))throw Error(MRVL_MESSAGES.finite[0]);
  return {...r,enteredReinvestment:r.reinvestment,reinvestment,requiredInvestment:required,fundingFloor:floor,investmentFloorTopUp:reinvestment-r.reinvestment,incrementalNWC:otherChange,incrementalSupplierDeposits:capacityChange,incrementalOperatingCash:cashChange,capacityPrepaymentsEnd:capacity,otherOperatingNWCEnd:nwc,operatingCashEnd:cash,economicResearchSpend:r.revenue*(src.cash_rd_ratio+.7*src.recurring_future_grant_ratio),growth,ebit,tax,nopat,fcff,discountFactor:discount,pv:presentValue,cumulativeFCFF:cumulative,yearsFromOrigin:.5+r.year,derivedSalesCapital:reinvestment?delta/reinvestment:null};
 });
 const last=rows.at(-1),revenue=last.revenue*(1+t.growth),ebit=revenue*t.margin,expensedNOPAT=ebit*(1-t.taxRate),researchSpend=revenue*p.terminalResearchRatio,researchAmortization=rows.slice(-5).reduce((sum,r)=>sum+r.economicResearchSpend,0)/5,netResearchInvestment=researchSpend-researchAmortization,economicNOPAT=expensedNOPAT+netResearchInvestment,totalReinvestment=economicNOPAT*t.growth/t.roic,nonresearchReinvestment=totalReinvestment-netResearchInvestment,floor=Math.max(0,p.otherNWCRatio*revenue-nwc)+Math.max(0,.05*revenue-capacity)+Math.max(0,Math.max(1000,.08*revenue)-cash);
 if(nonresearchReinvestment< -1e-8||nonresearchReinvestment+1e-8<floor)throw Error(MRVL_MESSAGES.terminal[0]);
 const fcff=economicNOPAT-totalReinvestment,value=fcff/(t.wacc-t.growth),terminalPV=value/discount,enterprise=pv+terminalPV;
 if(![revenue,ebit,economicNOPAT,totalReinvestment,fcff,value,terminalPV,enterprise].every(Number.isFinite))throw Error(MRVL_MESSAGES.finite[0]);
 const terminal={...t,revenue,ebit,nopat:economicNOPAT,expensedNOPAT,economicNOPAT,researchSpend,researchAmortization,netResearchInvestment,reinvestment:totalReinvestment,nonresearchReinvestment,fundingFloor:floor,fcff,value,pv:terminalPV,discountFactor:discount,yearsFromOrigin:.5+rows.length,fcffGrowth:last.fcff?fcff/last.fcff-1:null,revenueGrowthEndpointDifference:last.growth-t.growth};
 return {ticker:d.ticker,currency:d.currency,informationAsOf:d.informationAsOf,discountOrigin:d.discountOrigin,openingStub,rows,terminal,forecastPV:pv,annualTailPV:pv-openingStub.pv,terminalPV,enterprise,terminalShare:enterprise>0?terminalPV/enterprise:null,peakEconomicDeficit:Math.max(0,-trough),negativeFCFFYears:rows.filter(r=>r.fcff<0).length+(stubFCFF<0?1:0),warnings:[MRVL_MESSAGES.note[0],MRVL_MESSAGES.funding[0]],classification:'Dated MRVL operating EV only; no current or unconditional common-equity allocation.'};
}
