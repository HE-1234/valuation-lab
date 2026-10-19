// KEYS v1: dated conditional research, USD millions and million common shares.
// Exact source replay plus a strict entered-investment schedule. No current target.
const CASE_SCHEMA={csg_growth:['number'],eisg_growth:['number'],margin:['number'],capex_ratio:['number'],depreciation_ratio:['number'],acquisition_reinvestment_ratio:['number'],marginal_nwc:'number',cash_floor_ratio:'number',tax:'number',wacc:'number',g:'number',terminal_roic:'number',emergency_debt_capacity:'number',emergency_interest:'number',equity_issue_price:'number',equity_fee:'number'};
const DEBT_SCHEMA={principal:'number',coupon:'number',year:'number',maturity:'string'};
const INPUT_SCHEMA={ticker:'string',units:'string',information_cutoff:'string',valuation_anchor:'string',share_date:'string',status:'string',revenue:{csg:'number',eisg:'number'},revenue_basis:'string',capital:{unrestricted_cash:'number',debt_face:'number',pension_reserve:'number',other_claim_reserve:'number',shares:'number',minimum_operating_cash:'number',long_term_investments_included:'number',restricted_cash_included:'number'},capital_note:'string',debt_schedule:[DEBT_SCHEMA],assumption_status:'string',cases:{bear:CASE_SCHEMA,base:CASE_SCHEMA,bull:CASE_SCHEMA}};
const ANNUAL_SCHEMA={csg:'number',eisg:'number',margin:'number',taxRate:'number',wacc:'number',reinvestment:'number'};
const TERMINAL_SCHEMA={growth:'number',margin:'number',taxRate:'number',roic:'number',wacc:'number'};
export const keysFinite=x=>typeof x==='number'&&Number.isFinite(x);
export function keysError(message,status='invalid_assumptions'){return Object.assign(Error(message),{status,enterprise:null,equity:null,perShare:null,conditional_value_per_share:null,headline_enterprise:null,headline_equity:null,headline_per_share:null});}
const fail=m=>{throw keysError(m);};
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const near=(x,y)=>Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-11);
function shape(x,s,p='inputs'){
 if(Array.isArray(s)){
  const length=p==='inputs.debt_schedule'?4:10;
  if(!Array.isArray(x)||x.length!==length||Object.keys(x).length!==length)fail(`KEYS ${p} requires ${length} complete values.`);
  for(let i=0;i<length;i++)shape(x[i],s[0],`${p}.${i}`);return;
 }
 if(s&&typeof s==='object'){
  if(!x||typeof x!=='object'||Array.isArray(x))fail(`KEYS ${p} requires an object.`);
  if(Object.keys(x).some(k=>!own(s,k)))fail(`KEYS ${p}: unknown keys.`);
  if(Object.keys(s).some(k=>!own(x,k)))fail(`KEYS ${p}: missing keys.`);
  for(const k of Object.keys(s))shape(x[k],s[k],`${p}.${k}`);return;
 }
 if(typeof x!==s||(s==='number'&&!keysFinite(x)))fail(`KEYS ${p} requires a finite ${s}.`);
}
function num(v,lo,hi,label){if(!keysFinite(v)||v<lo||v>hi)fail(`KEYS ${label} is outside its finite supported bounds.`);}
export function keysFiniteTree(x){if(typeof x==='number'&&!keysFinite(x))fail('KEYS arithmetic is outside the finite supported domain. No valuation is released.');if(x&&typeof x==='object')for(const v of Object.values(x))keysFiniteTree(v);return x;}
function validateCase(c){
 shape(c,CASE_SCHEMA,'case');
 for(const k of ['csg_growth','eisg_growth'])c[k].forEach(v=>num(v,-.95,2,k));
 c.margin.forEach(v=>num(v,-1,1,'margin'));
 for(const k of ['capex_ratio','depreciation_ratio','acquisition_reinvestment_ratio'])c[k].forEach(v=>num(v,0,1,k));
 for(const k of ['marginal_nwc','cash_floor_ratio','tax','equity_fee'])num(c[k],0,.95,k);
 for(const k of ['wacc','terminal_roic'])num(c[k],.001,.5,k);
 num(c.g,0,.06,'terminal growth');num(c.emergency_debt_capacity,0,1e7,'emergency debt capacity');num(c.emergency_interest,0,.5,'emergency interest');num(c.equity_issue_price,.001,1e6,'equity issue price');
 if(c.wacc<=c.g||c.terminal_roic<=c.g)fail('KEYS WACC and terminal ROIC must exceed terminal growth.');
 for(const k of ['csg_growth','eisg_growth'])if(Math.abs(c[k][9]-c.g)>1e-10)fail('KEYS final segment growth must converge to terminal growth.');
 if(c.capex_ratio.some((v,i)=>v<c.depreciation_ratio[i]))fail('KEYS gross capex cannot be below depreciation in this maintenance model.');
}
export function validateKeysInputs(a,scenario){
 shape(a,INPUT_SCHEMA);
 if(a.ticker!=='KEYS'||a.units!=='USD millions and million common shares; per-share USD'||a.valuation_anchor!=='2026-07-31'||a.share_date!=='2026-08-27'||a.information_cutoff!=='2026-10-19')fail('KEYS requires the reviewed July 31 capital anchor, August 27 common shares and October 19 information cutoff in USD.');
 for(const [k,v]of Object.entries(a.capital))num(v,k==='shares'?.000001:0,1e8,k);
 if(a.capital.restricted_cash_included!==0)fail('KEYS restricted cash must remain excluded; nonzero restricted_cash_included is unsupported.');
 if(a.capital.long_term_investments_included!==0)fail('KEYS long-term investments must remain excluded from this reviewed capital bridge.');
 for(const [k,v]of Object.entries(a.revenue))num(v,.000001,1e8,k);
 const maturities=['2027-04-06','2029-10-30','2030-07-30','2034-10-15'];
 a.debt_schedule.forEach((s,i)=>{num(s.principal,0,1e7,'principal');num(s.coupon,0,.5,'coupon');num(s.year,1,10,'maturity year');if(!Number.isInteger(s.year)||s.maturity!==maturities[i]||s.year!==[1,4,4,9][i])fail('KEYS debt maturity dates and rolling-year buckets must match the reviewed schedule.');});
 if(Math.abs(a.debt_schedule.reduce((v,s)=>v+s.principal,0)-a.capital.debt_face)>1e-8)fail('KEYS debt schedule does not match debt face principal.');
 for(const c of Object.values(a.cases))validateCase(c);
 if(scenario!==undefined)validateCase(scenario);
 return true;
}
function sourceRows(a,c){let csg=a.revenue.csg,eisg=a.revenue.eisg;return c.csg_growth.map((g,i)=>({csg:csg*=1+g,eisg:eisg*=1+c.eisg_growth[i],margin:c.margin[i],taxRate:c.tax,wacc:c.wacc}));}
export function keysSourceComponents(a,c){validateKeysInputs(a);validateCase(c);return keysFiniteTree(sourceRows(a,c));}
function validateSchedule(a,annual,t){
 if(!Array.isArray(annual)||annual.length!==10||Object.keys(annual).length!==10)fail('KEYS supports ten rolling annual periods ending July 31, 2027–2036 only.');
 shape(t,TERMINAL_SCHEMA,'terminal');num(t.growth,0,.06,'terminal growth');num(t.margin,.000001,1,'terminal margin');num(t.taxRate,0,.95,'terminal tax');num(t.roic,.001,.5,'terminal ROIC');num(t.wacc,.001,.5,'terminal WACC');
 if(t.wacc<=t.growth||t.roic<=t.growth)fail('KEYS WACC and terminal ROIC must exceed terminal growth.');
 let prior=a.revenue;
 for(let i=0;i<10;i++){
  const r=annual[i];shape(r,ANNUAL_SCHEMA,`annual.${i}`);
  for(const k of ['csg','eisg']){num(r[k],Number.MIN_VALUE,1e14,k);num(r[k]/prior[k]-1,-.95-1e-12,2+1e-12,`${k} growth`);}
  num(r.margin,-1,1,'annual margin');num(r.taxRate,0,.95,'annual tax');num(r.wacc,.001,.5,'annual WACC');num(r.reinvestment,0,1e14,'annual reinvestment');prior=r;
 }
 for(const k of ['csg','eisg'])if(!near(annual[9][k],annual[8][k]*(1+t.growth)))fail('KEYS final CSG and EISG revenues must converge to terminal growth.');
 const last=annual[9];if(!near(last.margin,t.margin)||!near(last.taxRate,t.taxRate)||!near(last.wacc,t.wacc))fail('KEYS final margin, tax and WACC must match terminal assumptions.');
}
function evaluate(a,c,annual,t,sourceMode){
 const b=a.capital;let cash=b.unrestricted_cash-b.pension_reserve-b.other_claim_reserve,floor=b.minimum_operating_cash,shares=b.shares,newdebt=0,pv=0,feesPV=0,discount=1;
 const openingCash=cash,openingGap=Math.max(0,floor-cash);let peakFundingGap=openingGap,oldrev=a.revenue.csg+a.revenue.eisg;
 const rows=annual.map((r,i)=>{
  const rev=r.csg+r.eisg,ebit=rev*r.margin,tax=Math.max(ebit,0)*r.taxRate,nopat=ebit-tax;
  const capex=rev*c.capex_ratio[i],da=rev*c.depreciation_ratio[i],ma=rev*c.acquisition_reinvestment_ratio[i],dnwc=(rev-oldrev)*c.marginal_nwc,newfloor=rev*c.cash_floor_ratio,dcash=newfloor-floor;
  const raw=capex-da+ma+dnwc+dcash,roicFloor=Math.max(0,nopat)*t.growth/t.roic*Math.max(0,(i-6)/3),required=Math.max(raw,roicFloor);
  const reinvest=sourceMode?required:r.reinvestment;
  if(!sourceMode&&reinvest+1e-8<required)fail(`KEYS entered investment is below the operating/ROIC floor in the rolling year ending ${2027+i}-07-31. Capital is never silently repaired.`);
  if(!sourceMode&&i===9&&!near(reinvest,required))fail('KEYS final-year reinvestment must equal the greater of operating needs and NOPAT times growth divided by ROIC.');
  const extra=reinvest-raw,fcff=nopat-reinvest;discount*=1+r.wacc;const pvfcff=fcff/discount;pv+=pvfcff;
  const interest=a.debt_schedule.reduce((v,s)=>v+(s.year>=i+1?s.principal*s.coupon:0),0)+newdebt*c.emergency_interest;
  const repayment=a.debt_schedule.reduce((v,s)=>v+(s.year===i+1?s.principal:0),0);
  const cashPre=cash+fcff+dcash-interest*(ebit>interest?1-r.taxRate:1)-repayment;
  let debtRaise=0,equityRaise=0,fee=0;peakFundingGap=Math.max(peakFundingGap,newfloor-cashPre);
  if(cashPre<newfloor){let need=newfloor-cashPre;debtRaise=Math.min(need,Math.max(0,c.emergency_debt_capacity-newdebt));newdebt+=debtRaise;need-=debtRaise;if(need>0){equityRaise=need/(1-c.equity_fee);fee=equityRaise*c.equity_fee;shares+=equityRaise/c.equity_issue_price;}}
  cash=cashPre+debtRaise+equityRaise-fee;feesPV+=fee/discount;floor=newfloor;oldrev=rev;
  return {year:i+1,period_end:`${2027+i}-07-31`,csg_revenue:r.csg,eisg_revenue:r.eisg,revenue:rev,ebit,nopat,gross_capex:capex,depreciation:da,acquisition_reinvestment:ma,delta_nwc:dnwc,delta_operating_cash:dcash,roic_topup:extra,reinvestment:reinvest,fcff,pv_fcff:pvfcff,interest,debt_repayment:repayment,cash_floor:floor,cash_end:cash,new_debt:debtRaise,new_equity_gross:equityRaise,issuance_fee:fee,shares_end:shares,tax,ebit_margin:r.margin,discount_factor:discount,raw_operating_reinvestment:raw,roic_reinvestment_floor:roicFloor,required_reinvestment:required,emergency_debt_end:newdebt,cash_before_financing:cashPre};
 });
 const last=rows[9],tr=last.revenue*(1+t.growth),tn=tr*t.margin*(1-t.taxRate);
 if(tn<=0)fail('KEYS positive terminal earnings are required.');
 const operatingFloor=tr*(c.capex_ratio[9]-c.depreciation_ratio[9]+c.acquisition_reinvestment_ratio[9])+(tr-last.revenue)*(c.marginal_nwc+c.cash_floor_ratio),roicFloor=tn*t.growth/t.roic,terminalReinvestment=Math.max(roicFloor,operatingFloor);
 if(terminalReinvestment>=tn)fail('KEYS terminal reinvestment consumes all earnings.');
 const tf=tn-terminalReinvestment,tv=tf/(t.wacc-t.growth),pvtv=tv/discount,ev=pv+pvtv;
 const bridge=b.unrestricted_cash-b.debt_face-b.pension_reserve-b.other_claim_reserve-b.minimum_operating_cash+b.long_term_investments_included,equity=ev+bridge-feesPV;
 // Any positive modeled financing or opening shortfall closes the headline gate.
 const funded=openingGap>0||rows.some(z=>z.new_debt>0||z.new_equity_gross>0),eligible=!funded&&equity>0;
 return keysFiniteTree({enterprise_value:ev,equity_value:equity,capital_bridge:bridge,explicit_pv:pv,terminal_pv:pvtv,terminal_share:ev>0?pvtv/ev:null,terminal_nopat:tn,terminal_reinvestment:terminalReinvestment,terminal_operating_floor:operatingFloor,terminal_roic_floor:roicFloor,terminal_fcff:tf,funding_required:funded,conditional_value_per_share:eligible?equity/b.shares:null,funding_dilution_diagnostic_only:Math.max(0,equity)/shares,rows,pv_funding_fees:feesPV,opening_cash_before_financing:openingCash,opening_required_cash:b.minimum_operating_cash,opening_funding_gap:openingGap,peak_funding_gap:Math.max(0,peakFundingGap),terminal_growth:t.growth,terminal_roic:t.roic,terminal_implied_reinvestment_roic:terminalReinvestment?tn*t.growth/terminalReinvestment:null,status:funded?'FUNDING_REQUIRED_HEADLINE_WITHHELD':equity<=0?'NONPOSITIVE_EQUITY_HEADLINE_WITHHELD':'VALID_CONDITIONAL_RESEARCH',headline_enterprise:eligible?ev:null,headline_equity:eligible?equity:null,headline_per_share:eligible?equity/b.shares:null,current_valuation_eligible:false,historical_backtest_eligible:false,ranking_eligible:false,funding_diagnostic_warning:'Funding-need detector only. Emergency debt repayment/refinancing and revolver expiration are not modeled. The diluted denominator is not financing-adjusted fair value.'});
}
export function evaluateKeysSchedule(a,c,annual,terminal){validateKeysInputs(a);validateCase(c);validateSchedule(a,annual,terminal);return evaluate(a,c,annual,terminal,false);}
export function calculateKeys(a,scenarioOrName='base',overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.keys(overrides).some(k=>!['wacc','g'].includes(k)))fail('KEYS unknown override.');
 validateKeysInputs(a);
 const original=typeof scenarioOrName==='string'&&own(a.cases,scenarioOrName)?a.cases[scenarioOrName]:typeof scenarioOrName==='object'?scenarioOrName:null;if(!original)fail('KEYS unknown scenario.');
 validateCase(original);const c=structuredClone(original);
 if(own(overrides,'wacc'))c.wacc=overrides.wacc;
 // Explicit g sensitivity matches source sensitivities; direct edits must converge.
 if(own(overrides,'g')){c.g=overrides.g;c.csg_growth[9]=overrides.g;c.eisg_growth[9]=overrides.g;}
 validateCase(c);return evaluate(a,c,sourceRows(a,c),{growth:c.g,margin:c.margin[9],taxRate:c.tax,roic:c.terminal_roic,wacc:c.wacc},true);
}
