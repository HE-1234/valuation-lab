// ARM v2: USD millions and million ordinary shares, one ADS per ordinary share.
// Source-parity replay plus a strict post-transition schedule evaluator. Physical
// floors are analyst assumptions, never a license to clip incompatible capital.
const CASE_SCHEMA = {
 royalty_growth:['number'], license_growth:['number'], silicon_revenue:['number'],
 ip_ebit_margin:['number'], silicon_ebit_margin:['number'], net_capex_ratio:['number'],
 ip_marginal_nwc:'number', silicon_marginal_nwc:'number', tax_rate:'number',
 wacc:'number', terminal_growth:'number', terminal_roic:'number', cash_floor_ratio:'number',
 funding_interest_rate:'number', funding_debt_capacity_multiple:'number',
 emergency_equity_price_per_ads:'number', equity_issuance_fee:'number',
 net_capex_floor_total:'number', net_capex_floor_ip:'number', net_capex_floor_silicon:'number'
};
const INPUT_SCHEMA = {
 ticker:'string', currency:'string', units:'string', information_cutoff:'string',
 valuation_anchor:'string', lookahead_warning:'string',
 revenue:{royalty:'number',license:'number',silicon:'number'},
 capital:{cash_short_investments:'number',finance_lease:'number',eda_obligations:'number',
  acquisition_reserve:'number',minimum_operating_cash:'number',unquoted_equity_included:'number',
  ordinary_shares:'number',ads_per_ordinary:'number',equity_investment_policy:'string',acquisition_timing_policy:'string'},
 assumption_status:'string',sbc_policy:'string',operating_leases:'string',
 cases:{bear:CASE_SCHEMA,base:CASE_SCHEMA,bull:CASE_SCHEMA},physical_floor_policy:'string'
};
const ANNUAL_SCHEMA={royalty:'number',license:'number',silicon:'number',ipMargin:'number',siliconMargin:'number',taxRate:'number',wacc:'number',reinvestment:'number'};
const TERMINAL_SCHEMA={growth:'number',margin:'number',taxRate:'number',roic:'number',wacc:'number'};
export const armFinite=x=>typeof x==='number'&&Number.isFinite(x);
export function armError(message,status='invalid_assumptions') {
 const e=Error(message);Object.assign(e,{status,enterprise:null,equity:null,perShare:null,value_per_ads:null});return e;
}
const fail=message=>{throw armError(message);};
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
function shape(x,s,p='inputs'){
 if(Array.isArray(s)){if(!Array.isArray(x)||x.length!==10)fail(`ARM ${p} requires ten annual values.`);for(let i=0;i<10;i++)shape(x[i],s[0],`${p}.${i}`);return;}
 if(s&&typeof s==='object'){
  if(!x||typeof x!=='object'||Array.isArray(x))fail(`ARM ${p} requires an object.`);
  if(Object.keys(x).some(k=>!own(s,k)))fail(`ARM ${p}: unknown keys.`);
  if(Object.keys(s).some(k=>!own(x,k)))fail(`ARM ${p}: missing keys.`);
  for(const k of Object.keys(s))shape(x[k],s[k],`${p}.${k}`);return;
 }
 if(typeof x!==s||(s==='number'&&!armFinite(x)))fail(`ARM ${p} requires a finite ${s}.`);
}
function num(x,lo,hi,label,exclusive=false){if(!armFinite(x)||x<lo||x>hi||(exclusive&&x===lo))fail(`ARM ${label} is outside its finite supported bounds.`);}
const near=(x,y)=>Math.abs(x-y)<=Math.max(1e-9,Math.abs(y)*1e-10);
export function armFiniteTree(x){
 if(typeof x==='number'&&!armFinite(x))fail('ARM arithmetic is outside the finite supported domain. No valuation is released.');
 if(x&&typeof x==='object')for(const v of Object.values(x))armFiniteTree(v);
 return x;
}
function validateCase(c){
 shape(c,CASE_SCHEMA,'case');
 for(const k of ['royalty_growth','license_growth'])c[k].forEach(v=>num(v,-.95,2,k));
 for(const k of ['ip_ebit_margin','silicon_ebit_margin'])c[k].forEach(v=>num(v,-1,1,k));
 c.silicon_revenue.forEach(v=>num(v,0,1e7,'silicon revenue'));
 c.net_capex_ratio.forEach(v=>num(v,0,1,'net capital expenditure ratio'));
 for(const k of ['ip_marginal_nwc','silicon_marginal_nwc','tax_rate','cash_floor_ratio','equity_issuance_fee'])num(c[k],0,.95,k);
 for(const k of ['net_capex_floor_total','net_capex_floor_ip','net_capex_floor_silicon'])num(c[k],0,.95,k,true);
 num(c.wacc,.01,.5,'WACC');num(c.terminal_growth,0,.06,'terminal growth');num(c.terminal_roic,.01,.7,'terminal ROIC');
 num(c.funding_interest_rate,0,.5,'funding interest rate');num(c.funding_debt_capacity_multiple,0,10,'funding debt capacity');
 num(c.emergency_equity_price_per_ads,.01,100000,'emergency equity price per ADS');
 if(c.wacc<=c.terminal_growth||c.terminal_roic<=c.terminal_growth)fail('ARM WACC and ROIC must exceed terminal growth.');
 if(!near(c.royalty_growth[9],c.terminal_growth)||!near(c.license_growth[9],c.terminal_growth))fail('ARM final royalty and license growth must converge to terminal growth.');
 if((c.silicon_revenue[8]===0&&c.silicon_revenue[9]!==0)||!near(c.silicon_revenue[9],c.silicon_revenue[8]*(1+c.terminal_growth)))fail('ARM final silicon revenue must equal prior silicon revenue times one plus terminal growth, including zero-base paths.');
}
export function validateArmInputs(a,scenario){
 shape(a,INPUT_SCHEMA);
 if(a.ticker!=='ARM'||a.currency!=='USD'||a.valuation_anchor!=='2026-03-31'||a.information_cutoff!=='2026-10-19')fail('ARM requires the reviewed March 31 capital anchor and October 19 information cutoff in USD.');
 for(const [k,v]of Object.entries(a.capital))if(typeof v==='number')num(v,k==='ordinary_shares'?.001:0,1e7,k);
 if(a.capital.ads_per_ordinary!==1)fail('ARM supports one ADS per ordinary share only.');
 if(a.capital.unquoted_equity_included!==0)fail('ARM excludes all equity investments from the capital bridge.');
 for(const [k,v]of Object.entries(a.revenue))num(v,0,1e7,k);
 if(a.revenue.royalty+a.revenue.license+a.revenue.silicon<=0)fail('ARM source revenue must be positive.');
 for(const c of Object.values(a.cases))validateCase(c);
 if(scenario!==undefined)validateCase(scenario);
 return true;
}
function sourceRows(a,c){
 let royalty=a.revenue.royalty,license=a.revenue.license;
 return c.royalty_growth.map((g,i)=>({royalty:royalty*=1+g,license:license*=1+c.license_growth[i],silicon:c.silicon_revenue[i],ipMargin:c.ip_ebit_margin[i],siliconMargin:c.silicon_ebit_margin[i],taxRate:c.tax_rate,wacc:c.wacc,netCapexRatio:c.net_capex_ratio[i]}));
}
export function armSourceComponents(a,c){validateArmInputs(a,c);return armFiniteTree(sourceRows(a,c));}
function validateSchedule(annual,t){
 if(!Array.isArray(annual)||annual.length!==10)fail('ARM supports ten FY2027–36 annual rows only.');
 shape(t,TERMINAL_SCHEMA,'terminal');
 num(t.growth,0,.06,'terminal growth');num(t.margin,0,1,'terminal margin',true);num(t.taxRate,0,.95,'terminal tax');num(t.roic,.01,.7,'terminal ROIC');num(t.wacc,.01,.5,'terminal WACC');
 if(t.wacc<=t.growth||t.roic<=t.growth)fail('ARM WACC and ROIC must exceed terminal growth.');
 for(const r of annual){shape(r,ANNUAL_SCHEMA,'annual row');for(const k of ['royalty','license','silicon'])num(r[k],0,1e7,k);for(const k of ['ipMargin','siliconMargin'])num(r[k],-1,1,k);num(r.taxRate,0,.95,'annual tax');num(r.wacc,.01,.5,'annual WACC');num(r.reinvestment,-1e7,1e7,'annual reinvestment');if(r.royalty+r.license+r.silicon<=0)fail('ARM annual revenue must be positive.');}
 const last=annual[9],prior=annual[8];
 for(const k of ['royalty','license','silicon'])if((prior[k]===0&&last[k]!==0)||!near(last[k],prior[k]*(1+t.growth)))fail(`ARM final ${k} revenue must converge to terminal growth, including zero-base paths.`);
 const rev=last.royalty+last.license+last.silicon,margin=((last.royalty+last.license)*last.ipMargin+last.silicon*last.siliconMargin)/rev;
 if(!near(margin,t.margin)||!near(last.taxRate,t.taxRate))fail('ARM final margin and tax must match terminal margin and tax.');
 const ebit=rev*margin,nopat=ebit-Math.max(0,ebit)*last.taxRate;
 if(!near(last.reinvestment,nopat*t.growth/t.roic))fail('ARM final-year reinvestment must equal NOPAT times growth divided by ROIC. Capital is never clipped or silently repaired.');
}
function evaluate(a,c,annual,t,sourceMode){
 const b=a.capital;let cash=b.cash_short_investments-b.finance_lease-b.eda_obligations-b.acquisition_reserve,debt=0,shares=b.ordinary_shares,previousCashFloor=b.minimum_operating_cash;
 const openingCash=cash,openingGap=Math.max(0,previousCashFloor-cash);
 let prior={...a.revenue},pv=0,pvFundingFees=0,discount=1,peakFundingGap=openingGap;
 const rows=annual.map((r,i)=>{
  const ip=r.royalty+r.license,prevIp=prior.royalty+prior.license,revenue=ip+r.silicon;
  const ebit=ip*r.ipMargin+r.silicon*r.siliconMargin,tax=Math.max(0,ebit)*r.taxRate,nopat=ebit-tax;
  const cashFloor=revenue*c.cash_floor_ratio,deltaOperatingCash=cashFloor-previousCashFloor;
  const dnwc=(ip-prevIp)*c.ip_marginal_nwc+(r.silicon-prior.silicon)*c.silicon_marginal_nwc+deltaOperatingCash;
  let netCapex=sourceMode?revenue*r.netCapexRatio:r.reinvestment-dnwc;
  if(sourceMode&&i>=7){const target=nopat*t.growth/t.roic-dnwc;if(target<0)fail('ARM terminal reinvestment is incompatible with working capital.');const blend=(i-6)/3;netCapex=netCapex*(1-blend)+target*blend;}
  const physicalFloor=Math.max(revenue*c.net_capex_floor_total,ip*c.net_capex_floor_ip+r.silicon*c.net_capex_floor_silicon);
  if(netCapex+1e-9<physicalFloor)fail(`ARM net-capital physical-floor incompatibility in FY${2027+i}: revise growth, ROIC or explicit floor assumptions. Capital is never clipped.`);
  const reinvestment=netCapex+dnwc,fcff=nopat-reinvestment;
  discount*=1+r.wacc;const presentValue=fcff/discount;pv+=presentValue;
  const interest=debt*c.funding_interest_rate,afterInterest=ebit>interest?interest*(1-r.taxRate):interest;
  const cashPre=cash+fcff+deltaOperatingCash-afterInterest;let newDebt=0,newEquity=0,issueFee=0;
  peakFundingGap=Math.max(peakFundingGap,cashFloor-cashPre);
  if(cashPre<cashFloor){let need=cashFloor-cashPre;const headroom=Math.max(0,c.funding_debt_capacity_multiple*Math.max(ebit,0)-debt);newDebt=Math.min(need,headroom);debt+=newDebt;need-=newDebt;if(need>0){newEquity=need/(1-c.equity_issuance_fee);issueFee=newEquity-need;shares+=newEquity/c.emergency_equity_price_per_ads/b.ads_per_ordinary;}cash=cashPre+newDebt+newEquity-issueFee;}else cash=cashPre;
  pvFundingFees+=issueFee/discount;previousCashFloor=cashFloor;prior={royalty:r.royalty,license:r.license,silicon:r.silicon};
  return {fiscal_year:2027+i,royalty:r.royalty,license:r.license,silicon:r.silicon,revenue,ebit,ebit_margin:ebit/revenue,tax,nopat,net_capex:netCapex,net_capex_floor:physicalFloor,delta_nwc:dnwc,delta_operating_cash:deltaOperatingCash,reinvestment,fcff,discount_factor:discount,pv_fcff:presentValue,cash_floor:cashFloor,cash_end:cash,new_debt:newDebt,debt_end:debt,new_equity_gross:newEquity,issue_fee:issueFee,interest,shares_end:shares};
 });
 const last=rows[9],terminalRevenue=last.revenue*(1+t.growth),terminalNopat=terminalRevenue*t.margin*(1-t.taxRate);
 if(terminalNopat<=0)fail('ARM positive terminal NOPAT is required.');
 const terminalReinvestment=terminalNopat*t.growth/t.roic;
 const terminalNwc=((last.royalty+last.license)*c.ip_marginal_nwc+last.silicon*c.silicon_marginal_nwc+last.revenue*c.cash_floor_ratio)*t.growth;
 const terminalNetCapex=terminalReinvestment-terminalNwc,terminalFloor=Math.max(terminalRevenue*c.net_capex_floor_total,((last.royalty+last.license)*c.net_capex_floor_ip+last.silicon*c.net_capex_floor_silicon)*(1+t.growth));
 if(terminalNetCapex+1e-9<terminalFloor)fail('ARM terminal physical floor is incompatible with growth divided by ROIC. Capital is never clipped.');
 const terminalFcff=terminalNopat-terminalReinvestment,tv=terminalFcff/(t.wacc-t.growth),terminalPV=tv/discount,ev=pv+terminalPV;
 const bridge=b.cash_short_investments-b.finance_lease-b.eda_obligations-b.acquisition_reserve-b.minimum_operating_cash+b.unquoted_equity_included,equity=ev+bridge-pvFundingFees;
 const funded=openingGap>1e-9||rows.some(r=>r.new_debt>0||r.new_equity_gross>0);
 return armFiniteTree({enterprise_value:ev,explicit_pv:pv,terminal_pv:terminalPV,terminal_share:ev===0?null:terminalPV/ev,bridge,equity_value:equity,value_per_ads:funded?null:equity/(b.ordinary_shares*b.ads_per_ordinary),funding_required:funded,funding_dilution_diagnostic:equity/(shares*b.ads_per_ordinary),funding_diagnostic_warning:'Share-count denominator illustration only; not financing-adjusted fair value and not a target when funded',terminal_nopat:terminalNopat,terminal_net_capex:terminalNetCapex,terminal_net_capex_floor:terminalFloor,terminal_reinvestment:terminalReinvestment,terminal_fcff:terminalFcff,terminal_roic:t.roic,terminal_growth:t.growth,terminal_reinvestment_rate:t.growth/t.roic,rows,opening_cash_before_financing:openingCash,opening_required_cash:b.minimum_operating_cash,opening_funding_gap:openingGap,peak_funding_gap:Math.max(0,peakFundingGap),pv_funding_fees:pvFundingFees,terminal_delta_nwc:terminalNwc,status:funded?'FUNDING_REQUIRED_HEADLINE_WITHHELD':'VALID_CONDITIONAL_RESEARCH',headline_enterprise:funded?null:ev,headline_equity:funded?null:equity,headline_per_ads:funded?null:equity/(b.ordinary_shares*b.ads_per_ordinary),current_valuation_eligible:false,historical_backtest_eligible:false,ranking_eligible:false});
}
export function evaluateArmSchedule(a,c,annual,terminal){
 validateArmInputs(a,c);validateSchedule(annual,terminal);return evaluate(a,c,annual,terminal,false);
}
export function calculateArm(a,scenarioOrName='base',overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.keys(overrides).some(k=>!['wacc','g'].includes(k)))fail('ARM unknown override.');
 const original=typeof scenarioOrName==='string'?a?.cases?.[scenarioOrName]:scenarioOrName;if(!original)fail('ARM unknown scenario.');
 const c=structuredClone(original);
 if(own(overrides,'wacc'))c.wacc=overrides.wacc;
 // The explicit g sensitivity changes the endpoint assumptions as in the source
 // sensitivity script. Direct scenario edits must supply their own convergence.
 if(own(overrides,'g')){c.terminal_growth=overrides.g;c.royalty_growth[9]=overrides.g;c.license_growth[9]=overrides.g;c.silicon_revenue[9]=c.silicon_revenue[8]*(1+overrides.g);}
 validateArmInputs(a,c);const annual=sourceRows(a,c),last=annual[9],rev=last.royalty+last.license+last.silicon;
 return evaluate(a,c,annual,{growth:c.terminal_growth,margin:((last.royalty+last.license)*last.ipMargin+last.silicon*last.siliconMargin)/rev,taxRate:c.tax_rate,roic:c.terminal_roic,wacc:c.wacc},true);
}
