/** MCD v2: a pure port of the reviewed, dated Python FCFF replay.
 * USD millions; exact June common shares are a raw count. This is not a
 * current valuation, a market-price comparison, or a funding certification.
 */
export const MCD_FORECAST_YEARS = Object.freeze(Array.from({length:11},(_,i)=>2026+i));
const ARRAY_KEYS = Object.freeze(['comp_growth','unit_sales_contribution_conventional','unit_sales_contribution_developmental','unit_sales_contribution_affiliate','fx_growth','company_sales_growth','restaurant_count_growth','other_revenue_growth','franchise_occupancy_growth','company_restaurant_margin','sga_to_systemwide_sales','cash_tax_rate','cash_capex_baseline','next_capital_support','next_rent_relief','da','new_finance_lease_assets','normal_other_expense','restructuring_expense']);
const SCALAR_KEYS = Object.freeze(['h2_2026_finance_lease_asset_additions','other_profit_growth','incremental_nwc_ratio','wacc','terminal_g','terminal_roic','rent_rate_shift','royalty_rate_shift']);
const POLICY_AMOUNTS = Object.freeze(['finance_lease_claim','affiliate_equity_value','other_nonoperating_assets','minimum_operating_cash','existing_award_incremental_claim','other_noncommon_claims']);
export const MCD_ALLOCATION_SCOPE_FLAGS = Object.freeze({dated_june_only:true,nonoverlap_confirmed:true,incremental_award_claim_excludes_future_sbc_cash_replacement:true,lease_policy_confirmed:true,affiliate_value_excludes_royalty_rights:true,capital_scope_reviewed:true,assumption_not_current_target:true});
const OPENING_FACTS = Object.freeze({conventional_sales:93761,developmental_sales:22451,affiliate_sales:13463,company_sales:9690,other_revenue:647,other_profit:83,initial_fees:88,franchise_occupancy_expense:2618,restaurants:45356,reported_revenue:26885,rent_rate:0.11136826612344151,royalty_rate:0.046408328513591675});
const HALF_FACTS = Object.freeze({revenue:13616,core_contribution_before_other:6186,da:1131,cash_capex:1516,restructuring_expense:98});
const CAPITAL_FACTS = Object.freeze({cash:822,debt:39863,common_shares_exact:707641531,total_lease_liabilities:14729});
const POLICY_KEYS = Object.freeze(['operating_leases','finance_leases','affiliate_interests','sbc','next','terminal','tax','cashflow_timing','capex','units']);
const SOURCE_SCOPE = 'Consolidated royalty/rent/company-restaurant operating EV; excludes separately valued equity-method ownership interests; operating leases treated as operating; finance-lease financing separate';
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
const near=(a,b)=>Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-12);
export function mcdError(message,status='invalid_assumptions'){
 return Object.assign(new Error(`MCD ${message}`),{status,enterprise:null,equity:null,perShare:null,core_operating_ev:null,conditional_june_equity_value:null,dated_per_share_allocation:null,current_target:null,current_upside:null});
}
const check=(ok,message)=>{if(!ok)throw mcdError(message);};
function object(x,label){check(x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null),`${label} requires a plain object.`);}
function keys(x,required,optional=[],label='inputs'){
 object(x,label);const allowed=new Set([...required,...optional]);
 check(Reflect.ownKeys(x).every(k=>typeof k==='string'&&allowed.has(k)),`${label} has unknown keys.`);
 check(required.every(k=>own(x,k)),`${label} has missing keys.`);
}
function finite(x,label,low=-Infinity,high=Infinity){check(numeric(x)&&x>=low&&x<=high,`${label} must be finite numeric within [${low}, ${high}].`);return x;}
function dense(x,length,label){check(Array.isArray(x)&&x.length===length&&Object.keys(x).length===length&&Reflect.ownKeys(x).length===length+1&&Array.from({length},(_,i)=>own(x,i)).every(Boolean),`${label} requires ${length} complete values.`);}
function finiteTree(x){if(typeof x==='number')check(numeric(x),'arithmetic exceeded the finite supported domain.');else if(x&&typeof x==='object')Object.values(x).forEach(finiteTree);return x;}
function exactFacts(x,facts,extra=[],label='facts'){
 keys(x,Object.keys(facts).concat(extra),[],label);
 for(const [k,v]of Object.entries(facts)){finite(x[k],`${label}.${k}`,0);check(x[k]===v,`dated ${label}.${k} differs from the reviewed source.`);}
 for(const k of extra)check(typeof x[k]==='string'&&x[k].trim().length>0,`${label}.${k} requires a source description.`);
}
function validateScenario(d,c){
 keys(c,[...ARRAY_KEYS,...SCALAR_KEYS],[],'scenario');
 finite(c.wacc,'WACC',.01,.3);finite(c.terminal_g,'terminal growth',0,.06);finite(c.terminal_roic,'terminal ROIC',.01,1);
 check(c.terminal_g<Math.min(c.wacc,c.terminal_roic),'terminal growth must be below WACC and terminal ROIC.');
 finite(c.incremental_nwc_ratio,'incremental NWC ratio',0,1);
 for(const k of ARRAY_KEYS){
  dense(c[k],11,k);
  c[k].forEach((v,i)=>{finite(v,`${k}.${i}`);if(k.endsWith('growth')||k.startsWith('unit_sales_'))finite(v,`${k}.${i}`,-.5,.5);else if(['company_restaurant_margin','sga_to_systemwide_sales','cash_tax_rate'].includes(k))finite(v,`${k}.${i}`,0,1);else finite(v,`${k}.${i}`,0);});
 }
 check(c.cash_capex_baseline[0]+c.next_capital_support[0]>=d.observed_h1_2026.cash_capex,'FY capex is below observed H1 capex.');
 check(c.da[0]>=d.observed_h1_2026.da,'FY D&A is below observed H1 D&A.');
 check(c.restructuring_expense[0]>=d.observed_h1_2026.restructuring_expense,'FY restructuring is below observed H1; an implicit H2 reversal is not permitted.');
 finite(c.h2_2026_finance_lease_asset_additions,'H2 finance lease asset additions',0);
 finite(c.other_profit_growth,'other profit growth',-.5,.5);finite(c.rent_rate_shift,'rent rate shift',-.05,.05);finite(c.royalty_rate_shift,'royalty rate shift',-.03,.03);
 check(d.opening_2025.rent_rate+c.rent_rate_shift>0&&d.opening_2025.royalty_rate+c.royalty_rate_shift>0,'rent and royalty rates must be positive.');
 return true;
}
function resolveScenario(d,scenario){
 if(typeof scenario==='string'){check(own(d.scenarios,scenario),'unknown scenario.');return {name:scenario,case:d.scenarios[scenario]};}
 keys(scenario,[],[...ARRAY_KEYS,...SCALAR_KEYS],'scenario overrides');
 const c={...d.scenarios.base,...scenario};validateScenario(d,c);return {name:'custom',case:c};
}
export function validateMcdInputs(d,scenario=undefined){
 keys(d,['ticker','version','information_cutoff','valuation_anchor','units','not_ex_ante','forecast_years','opening_2025','observed_h1_2026','capital_known_june','scenarios','policies']);
 check(d.ticker==='MCD'&&d.version===2&&d.valuation_anchor==='2026-06-30'&&d.information_cutoff==='2026-10-19','requires reviewed June 30, 2026 valuation and October 19 information dates, MCD and version 2.');
 check(d.units==='USD millions; rates decimals; exact common shares raw count','units must remain USD millions, decimal rates and exact raw common shares.');
 check(typeof d.not_ex_ante==='string'&&d.not_ex_ante.trim().length>0,'dated, non-ex-ante scope must remain explicit.');
 dense(d.forecast_years,11,'forecast years');check(d.forecast_years.every((y,i)=>y===MCD_FORECAST_YEARS[i]),'forecast years must be 2026–2036.');
 exactFacts(d.opening_2025,OPENING_FACTS,[],'opening_2025');exactFacts(d.observed_h1_2026,HALF_FACTS,['definition'],'observed_h1_2026');exactFacts(d.capital_known_june,CAPITAL_FACTS,['source'],'capital_known_june');
 check(d.capital_known_june.source==='https://www.sec.gov/Archives/edgar/data/63908/000006390826000073/mcd-20260630.htm','June capital source must remain the reviewed filing.');
 check(Number.isSafeInteger(d.capital_known_june.common_shares_exact)&&d.capital_known_june.common_shares_exact>0,'exact shares must be a positive safe whole count.');
 keys(d.policies,POLICY_KEYS,[],'source policies');for(const k of POLICY_KEYS)check(typeof d.policies[k]==='string'&&d.policies[k].trim().length>0,`source policy ${k} must remain explicit.`);
 keys(d.scenarios,['bear','base','bull'],[],'scenarios');Object.values(d.scenarios).forEach(c=>validateScenario(d,c));
 if(scenario!==undefined)resolveScenario(d,scenario);
 return true;
}
/** The null policy is intentional. Scope flags describe an explicitly chosen
 * analyst policy, and need no user checkbox or typed rationale in the UI. */
export function validateMcdPolicy(p){
 if(p===null)return false;
 keys(p,[...POLICY_AMOUNTS,...Object.keys(MCD_ALLOCATION_SCOPE_FLAGS),'basis'],['basis_amounts_USDm','policy_id'],'allocation policy');
 for(const k of POLICY_AMOUNTS)finite(p[k],`allocation policy ${k}`,0);
 for(const k of Object.keys(MCD_ALLOCATION_SCOPE_FLAGS))check(p[k]===true,`allocation policy scope required: ${k}.`);
 check(typeof p.basis==='string'&&p.basis.trim().length>=20,'allocation policy requires a substantive basis.');
 if(own(p,'policy_id'))check(typeof p.policy_id==='string'&&p.policy_id.trim().length>0,'allocation policy ID must be nonempty.');
 if(own(p,'basis_amounts_USDm')){keys(p.basis_amounts_USDm,POLICY_AMOUNTS,[],'policy basis amounts');for(const k of POLICY_AMOUNTS){finite(p.basis_amounts_USDm[k],`basis amount ${k}`,0);check(p.basis_amounts_USDm[k]===p[k],`policy basis amount ${k} differs from its selected assumption.`);}}
 return true;
}
function sourceRows(d,name,c){
 const b=d.opening_2025,h=d.observed_h1_2026;let conv=b.conventional_sales,dev=b.developmental_sales,aff=b.affiliate_sales,company=b.company_sales,other=b.other_revenue,otherprofit=b.other_profit,fees=b.initial_fees,occ=b.franchise_occupancy_expense,restaurants=b.restaurants,priorGross=b.reported_revenue;
 return MCD_FORECAST_YEARS.map((y,i)=>{
  const previous=[conv,dev,aff],comp=c.comp_growth[i],fx=c.fx_growth[i],unit=[c.unit_sales_contribution_conventional[i],c.unit_sales_contribution_developmental[i],c.unit_sales_contribution_affiliate[i]],sales=previous.map((v,j)=>v*(1+comp)*(1+unit[j])*(1+fx));
  [conv,dev,aff]=sales;const fs=sales.reduce((a,v)=>a+v,0),weightedUnit=previous.reduce((a,v,j)=>a+v*unit[j],0)/previous.reduce((a,v)=>a+v,0);
  company*=1+c.company_sales_growth[i];other*=1+c.other_revenue_growth[i];otherprofit*=1+c.other_profit_growth;fees*=1+c.restaurant_count_growth[i];restaurants*=1+c.restaurant_count_growth[i];occ*=1+c.franchise_occupancy_growth[i];
  const grossRent=conv*(b.rent_rate+c.rent_rate_shift),relief=c.next_rent_relief[i],rent=grossRent-relief;check(rent>0,'rent relief consumes rent revenue.');
  const royalties=fs*(b.royalty_rate+c.royalty_rate_shift),franchiseRevenue=rent+royalties+fees,revenue=franchiseRevenue+company+other,grossRevenue=revenue+relief,systemSales=fs+company,franchiseMargin=franchiseRevenue-occ,companyProfit=company*c.company_restaurant_margin[i],sga=systemSales*c.sga_to_systemwide_sales[i],contribution=franchiseMargin+companyProfit+otherprofit-sga,fyEbit=contribution-c.normal_other_expense[i]-c.restructuring_expense[i];
  let da=c.da[i],capex=c.cash_capex_baseline[i]+c.next_capital_support[i],leaseAssets=c.new_finance_lease_assets[i],nwc=c.incremental_nwc_ratio*(grossRevenue-priorGross),periodEbit=fyEbit,periodRevenue=revenue;
  if(i===0){periodEbit=contribution-h.core_contribution_before_other-.5*c.normal_other_expense[i]-(c.restructuring_expense[i]-h.restructuring_expense);da-=h.da;capex-=h.cash_capex;leaseAssets=c.h2_2026_finance_lease_asset_additions;nwc*=.5;periodRevenue-=h.revenue;}
  check(periodRevenue>0,'FY scenario revenue is below observed H1.');
  const tax=c.cash_tax_rate[i],nopat=periodEbit*(1-tax),fcff=nopat+da-capex-leaseAssets-nwc,t=i+.5,df=(1+c.wacc)**(-t);
  priorGross=grossRevenue;
  return {scenario:name,fiscal_year:y,cashflow_period:i===0?'2026-H2':String(y),year_fraction:i===0?.5:1,discount_years_from_2026_06_30:t,conventional_franchisee_sales:conv,developmental_licensee_sales:dev,affiliate_restaurant_sales:aff,franchisee_sales:fs,systemwide_sales:systemSales,restaurant_count_illustration:restaurants,weighted_unit_sales_contribution:weightedUnit,gross_rent_revenue:grossRent,next_rent_relief:relief,rent_revenue_after_relief:rent,royalty_revenue:royalties,initial_fees:fees,franchise_revenue:franchiseRevenue,company_revenue:company,other_revenue:other,full_year_reported_revenue_proxy:revenue,period_revenue:periodRevenue,franchise_occupancy_expense:occ,company_restaurant_profit:companyProfit,other_profit:otherprofit,sga_including_sbc_cash_replacement:sga,full_year_core_ebit:fyEbit,full_year_core_margin:fyEbit/revenue,full_year_core_ebit_without_next_relief:fyEbit+relief,period_core_ebit:periodEbit,cash_tax_rate:tax,nopat,consolidated_da:da,cash_capex_baseline_full_year:c.cash_capex_baseline[i],next_capital_support_full_year:c.next_capital_support[i],cash_capex:capex,new_finance_lease_assets_as_economic_capex:leaseAssets,change_in_nwc:nwc,fcff,discount_factor:df,pv_fcff:fcff*df};
 });
}
/** Eleven entered schedule rows: H2 2026 first, then FY 2027–2036.
 * Margin is period EBIT / period revenue; reinvestment includes economic
 * finance-lease assets. These rows can be passed back as options.annual.
 */
export function mcdSourceSchedule(d,scenario='base'){
 validateMcdInputs(d,scenario);const s=resolveScenario(d,scenario);
 return finiteTree(sourceRows(d,s.name,s.case).map(r=>({revenue:r.period_revenue,margin:r.period_core_ebit/r.period_revenue,taxRate:r.cash_tax_rate,reinvestment:r.cash_capex+r.new_finance_lease_assets_as_economic_capex+r.change_in_nwc-r.consolidated_da,wacc:s.case.wacc})));
}
function terminalInputs(c,last,overrides){
 keys(overrides,[],['growth','margin','taxRate','roic','wacc'],'terminal overrides');
 const t={growth:c.terminal_g,margin:last.full_year_core_ebit_without_next_relief/last.full_year_reported_revenue_proxy,taxRate:last.cash_tax_rate,roic:c.terminal_roic,wacc:last.wacc,...overrides};
 finite(t.growth,'terminal growth',0,.06);finite(t.margin,'terminal normalized margin');finite(t.taxRate,'terminal cash tax rate',0,1);finite(t.roic,'terminal ROIC',.01,1);finite(t.wacc,'terminal WACC',.01,.3);
 check(t.growth<Math.min(t.wacc,t.roic),'terminal growth must be below WACC and terminal ROIC.');return t;
}
/** Optional annual overrides are partial records, but the array must have all
 * eleven rows. Revenue edits recompute NWC. Entered reinvestment is reconciled
 * through an explicit analyst adjustment rather than silently rewriting capex.
 * Terminal margin is the normalized EBIT margin BEFORE finite NEXT rent relief.
 */
export function calculateMcdOperating(d,scenario='base',options={}){
 validateMcdInputs(d,scenario);keys(options,[],['annual','terminal'],'operating options');
 const selected=resolveScenario(d,scenario),c=selected.case,source=sourceRows(d,selected.name,c),hasAnnual=own(options,'annual');
 if(hasAnnual)dense(options.annual,11,'annual schedule');
 let priorGross=d.opening_2025.reported_revenue,discount=1;
 const rows=source.map((r,i)=>{
  const edit=hasAnnual?options.annual[i]:{};keys(edit,[],['revenue','margin','taxRate','reinvestment','wacc'],`annual.${i}`);
  for(const [k,v]of Object.entries(edit))finite(v,`annual.${i}.${k}`);
  const revenue=own(edit,'revenue')?edit.revenue:r.period_revenue,margin=own(edit,'margin')?edit.margin:r.period_core_ebit/r.period_revenue,tax=own(edit,'taxRate')?edit.taxRate:r.cash_tax_rate,wacc=own(edit,'wacc')?edit.wacc:c.wacc;
  finite(revenue,`annual.${i}.revenue`,Number.MIN_VALUE);finite(margin,`annual.${i}.margin`);finite(tax,`annual.${i}.taxRate`,0,1);finite(wacc,`annual.${i}.wacc`,.01,.3);
  const fullRevenue=revenue+(i===0?d.observed_h1_2026.revenue:0),grossRevenue=fullRevenue+r.next_rent_relief;
  const ebit=(revenue===r.period_revenue&&margin===r.period_core_ebit/r.period_revenue)?r.period_core_ebit:revenue*margin;
  const fullEbit=i===0?ebit+d.observed_h1_2026.core_contribution_before_other-.5*c.normal_other_expense[0]-d.observed_h1_2026.restructuring_expense:ebit;
  const nwc=c.incremental_nwc_ratio*(grossRevenue-priorGross)*r.year_fraction,sourceNet=r.cash_capex+r.new_finance_lease_assets_as_economic_capex+nwc-r.consolidated_da,reinvestment=own(edit,'reinvestment')?edit.reinvestment:sourceNet,adjustment=reinvestment-sourceNet;
  // Negative net investment is legitimate (e.g. working-capital release), but
  // an entered release cannot erase the explicit finance-lease additions or
  // imply negative cash capex (including an H2 reversal of observed H1 capex).
  check(reinvestment>=r.new_finance_lease_assets_as_economic_capex+nwc-r.consolidated_da,`annual.${i} net investment implies negative cash capex or offsets fixed finance-lease additions.`);
  const nopat=ebit*(1-tax),fcff=nopat+r.consolidated_da-r.cash_capex-r.new_finance_lease_assets_as_economic_capex-nwc-adjustment;
  discount*=(1+wacc)**r.year_fraction;const df=1/discount;priorGross=grossRevenue;
  return {...r,period_revenue:revenue,full_year_reported_revenue_proxy:fullRevenue,period_core_ebit:ebit,full_year_core_ebit:fullEbit,full_year_core_margin:fullEbit/fullRevenue,full_year_core_ebit_without_next_relief:fullEbit+r.next_rent_relief,cash_tax_rate:tax,change_in_nwc:nwc,nopat,fcff,discount_factor:df,pv_fcff:fcff*df,revenue,margin,taxRate:tax,wacc,reinvestment,analyst_net_investment_adjustment:adjustment,cash_capex_after_analyst_adjustment:r.cash_capex+adjustment,full_year_cash_capex_after_analyst_adjustment:r.cash_capex+adjustment+(i===0?d.observed_h1_2026.cash_capex:0),analyst_revenue_adjustment:revenue-r.period_revenue,analyst_ebit_adjustment:ebit-r.period_core_ebit,source_period_revenue:r.period_revenue,source_period_core_ebit:r.period_core_ebit,yearsFromOrigin:r.discount_years_from_2026_06_30,present_value:fcff*df};
 });
 const last=rows.at(-1),t=terminalInputs(c,last,own(options,'terminal')?options.terminal:{}),normalizedEbit=own(options.terminal??{},'margin')?last.full_year_reported_revenue_proxy*t.margin:last.full_year_core_ebit_without_next_relief,terminalNopat=normalizedEbit*(1+t.growth)*(1-t.taxRate),reinvestment=terminalNopat*t.growth/t.roic,terminalFcff=terminalNopat-reinvestment,terminalValue=terminalFcff/(t.wacc-t.growth),terminalPV=terminalValue/discount,explicit=rows.reduce((sum,r)=>sum+r.pv_fcff,0),ev=explicit+terminalPV;
 return finiteTree({scenario:selected.name,valuation_anchor:d.valuation_anchor,information_cutoff:d.information_cutoff,scope:SOURCE_SCOPE,currency:'USD',units:'USD millions',core_operating_ev:ev,explicit_period_pv:explicit,terminal_pv:terminalPV,terminal_ev_fraction:ev?terminalPV/ev:null,terminal_year:2037,terminal_nopat:terminalNopat,terminal_reinvestment:reinvestment,terminal_reinvestment_rate:t.growth/t.roic,terminal_fcff:terminalFcff,terminal_value_at_2036_end:terminalValue,terminal_fcff_vs_2036_fcff:last.fcff?terminalFcff/last.fcff-1:null,current_target:null,current_upside:null,dated_per_share_allocation:null,conditional_june_equity_value:null,conditional_june_common_shares:null,allocation_policy:null,allocation_status:'blocked until explicit complete capital/award policy is supplied',rows,terminal:{...t,revenue:last.full_year_reported_revenue_proxy*(1+t.growth),normalized_2036_ebit:normalizedEbit,nopat:terminalNopat,reinvestment,fcff:terminalFcff,value:terminalValue,pv:terminalPV,discount_factor:1/discount},current_valuation_eligible:false,historical_backtest_eligible:false,ranking_eligible:false,funding_certified:false});
}
/** Allocate only after a deliberate, complete analyst policy is supplied.
 * Cash less the operating reserve may be negative; that shortfall is not clipped.
 * No operating lease, real-estate or affiliate royalty right is counted twice.
 */
export function allocateMcdCommon(d,operating,policy=null){
 validateMcdInputs(d);object(operating,'operating result');finiteTree(operating);
 check(operating.valuation_anchor===d.valuation_anchor&&operating.information_cutoff===d.information_cutoff&&operating.scope===SOURCE_SCOPE&&operating.currency==='USD'&&operating.units==='USD millions','allocation requires a matching dated operating result.');
 check(operating.current_target===null&&operating.current_upside===null,'current target and upside must remain null.');
 for(const k of ['core_operating_ev','terminal_fcff','terminal_pv','explicit_period_pv'])finite(operating[k],`operating ${k}`);
 check(near(operating.core_operating_ev,operating.explicit_period_pv+operating.terminal_pv),'operating EV does not reconcile.');
 const selected=validateMcdPolicy(policy),result=structuredClone(operating);
 Object.assign(result,{allocation_policy:null,conditional_june_equity_value:null,conditional_june_common_shares:null,dated_per_share_allocation:null,capital_bridge:null,current_target:null,current_upside:null,allocation_status:'blocked until explicit complete capital/award policy is supplied',funding_certified:false});
 if(!selected)return result;
 const cap=d.capital_known_june,cash=cap.cash-policy.minimum_operating_cash,equity=operating.core_operating_ev+cash+policy.affiliate_equity_value+policy.other_nonoperating_assets-cap.debt-policy.finance_lease_claim-policy.existing_award_incremental_claim-policy.other_noncommon_claims,shares=cap.common_shares_exact/1e6,perShare=equity>0&&operating.core_operating_ev>0&&operating.terminal_fcff>0?equity/shares:null;
 return finiteTree({...result,allocation_policy:structuredClone(policy),conditional_june_equity_value:equity,conditional_june_common_shares:shares,dated_per_share_allocation:perShare,capital_bridge:cash+policy.affiliate_equity_value+policy.other_nonoperating_assets-cap.debt-policy.finance_lease_claim-policy.existing_award_incremental_claim-policy.other_noncommon_claims,allocation_status:perShare===null?'nonpositive value: allocation suppressed':'explicit assumption-controlled June illustration; current target remains withheld'});
}
