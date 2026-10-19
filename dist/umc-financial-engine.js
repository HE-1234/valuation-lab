// UMC v1 dated operating-assets-only engine. Amounts are TWD millions except
// million ordinary shares, TWD per ordinary and USD per ADS. No current target,
// investment-portfolio value, circular-ownership benefit or emergency financing.
// Capital/FX dates: 2026-06-30. Forecast years end June 30, 2027 through 2036.
// Source arithmetic: reviewed replay_v1.py; the default never selects a policy.
const INPUT_SCHEMA = {"ticker":"string","balance_date":"string","research_cutoff":"string","unit":"string","study_type":"string","selected_policy":"null","current_target":"null","issued_common_shares_exact":"number","treasury_shares_exact":"number","common_outstanding_million":"number","ordinary_per_ads":"number","twd_per_usd_spot":"number","fx_date":"string","cash":"number","time_deposits_current":"number","financial_debt":"number","bank_debt_total":"number","bank_current_principal":"number","bank_noncurrent_principal":"number","legacy_pension_provision_claims_reserved":"number","legacy_claim_components":{"net_defined_benefit_liability":"number","decommissioning_provision":"number","onerous_contract_provision":"number","carbon_fee_provision":"number"},"authorized_2026_award_shares_million":"number","novatek_redemption_reserved":"number","guarantee_deposits_reserved":"number","dividend_payable_reserved":"number","current_tax_reserved":"number","contract_liabilities_reserved":"number","refund_liabilities_reserved":"number","initial_revenue_anchor":"number","incremental_working_capital_ratio":"number","terminal_incremental_roic":"number","scenarios":{"bear":{"revenue_first":"number","growth":["number","number","number","number","number","number","number","number","number"],"ebit_margin":["number","number","number","number","number","number","number","number","number","number"],"cash_capex":["number","number","number","number","number","number","number","number","number","number"],"da_nonlease":["number","number","number","number","number","number","number","number","number","number"],"wacc":"number","terminal_growth":"number","tax_rate":"number"},"base":{"revenue_first":"number","growth":["number","number","number","number","number","number","number","number","number"],"ebit_margin":["number","number","number","number","number","number","number","number","number","number"],"cash_capex":["number","number","number","number","number","number","number","number","number","number"],"da_nonlease":["number","number","number","number","number","number","number","number","number","number"],"wacc":"number","terminal_growth":"number","tax_rate":"number"},"bull":{"revenue_first":"number","growth":["number","number","number","number","number","number","number","number","number"],"ebit_margin":["number","number","number","number","number","number","number","number","number","number"],"cash_capex":["number","number","number","number","number","number","number","number","number","number"],"da_nonlease":["number","number","number","number","number","number","number","number","number","number"],"wacc":"number","terminal_growth":"number","tax_rate":"number"}},"notes":["string","string","string","string","string","string","string"]};
const FUNDING_SCHEMA = {"company":"string","balance_sheet_date":"string","research_cutoff":"string","units":"string","source":"string","source_sections":["string","string","string"],"cash_and_cash_equivalents":"number","time_deposits_original_maturity_over_3_months":"number","cash_plus_time_deposits":"number","cash_access_caveat":"string","financial_debt_carrying":"number","financial_debt_face_or_contractual_redemption_proxy":"number","financial_debt_components":{"short_term_bank":"number","long_term_bank_including_current":"number","domestic_bonds_face":"number","novatek_exchangeable_redemption_TWD_equivalent":"number","bond_unamortized_discount_total":"number"},"novatek_exchangeable":{"maturity":"string","residual_face_usd_millions_inferred":"number","derivation":"string","fixed_ntd_per_usd":"number","redemption_percent_of_usd_face":"number","computed_redemption_TWD_thousand":"number","umc_ordinary_dilution":"number","note":"string"},"domestic_bond_principal_schedule":[{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"},{"maturity_month":"string","principal":"number","coupon_pct":"number"}],"long_term_bank_currency_schedule":[{"currency":"string","secured":"boolean","balance_TWD_thousand":"number","last_repayment_date":"string"},{"currency":"string","secured":"boolean","balance_TWD_thousand":"number","last_repayment_date":"string"},{"currency":"string","secured":"boolean","balance_TWD_thousand":"number","last_repayment_date":"string"},{"currency":"string","secured":"boolean","revolving":"boolean","balance_TWD_thousand":"number","last_repayment_date":"string"}],"bank_current_portion_of_long_term":"number","contractual_undiscounted_maturity_buckets":{"labels":["string","string","string","string"],"short_term_bank":["number","number","number","number"],"long_term_bank_including_interest":["number","number","number","number"],"bonds_including_interest":["number","number","number","number"],"leases_including_interest":["number","number","number","number"],"customer_guarantee_deposits":["number","number","number","number"],"payables":["number","number","number","number"],"interpretation":"string"},"lease_liability_carrying":"number","H1_lease_principal_paid":"number","lease_treatment":"string","customer_guarantee_deposits_total":"number","customer_guarantee_deposits_noncurrent":"number","customer_guarantee_deposits_current_derived":"number","deposit_terms":"string","deposit_treatment":"string","contract_liabilities_current":"number","contract_liabilities_noncurrent":"number","refund_liabilities":"number","other_current_tax_liability":"number","current_tax_asset":"number","deferred_tax_liability":"number","deferred_tax_asset":"number","tax_treatment":"string","dividend_payable":"number","dividend_exact_TWD":"number","dividend_payment_ordinary":"string","dividend_payment_ADS":"string","dividend_treatment":"string","NCI_book_value":"number","NCI_fair_value":"null","NCI_treatment":"string","unrecognized_construction_commitments":"number","construction_total_contracts":"number","unrecognized_IP_royalty_development_commitments":"number","IP_royalty_development_total_contracts":"number","equipment_payables":"number","capex_commitment_treatment":"string","post_June_capex_2026_USD":"number","post_June_phased_expansion_board_budget_TWD":"number","post_June_domestic_convertible_proceeds_confirmed_TWD":"number","post_June_overseas_convertible_priced_USD":"number","cutoff_warning":"string","H1_lease_interest_expense":"number","H1_lease_interest_cash_paid":"null","source_map":{"h1":"string","q2":"string","dividend":"string","dividend_issuer":"string","domestic_auth":"string","domestic_cash1":"string","domestic_cash2":"string","oct_convert":"string","new_rsa_terms":"string","new_rsa_shareholder_approval":"string"},"new_RSa_authorization_warning":"string","legacy_obligations":{"source_url":"string","units":"string","net_defined_benefit_liability":"number","decommissioning_provision":"number","onerous_contract_provision":"number","carbon_fee_provision":"number","total":"number","locators":["string","string"],"settlement_mapping":[{"claim":"string","treatment":"string"},{"claim":"string","treatment":"string"},{"claim":"string","treatment":"string"},{"claim":"string","treatment":"string"}],"H1_decommissioning_used":"number","H1_decommissioning_new":"number","H1_decommissioning_discount_unwind_and_adjustment":"number","H1_decommissioning_FX":"number","H1_carbon_fees_paid":"number","H1_carbon_fees_new":"number","H1_carbon_fees_unused_reversed":"number","H1_onerous_new":"number","H1_onerous_reversed":"number","H1_onerous_used":"number","conservative_scenario":"string"},"new_RSA_maximum_shares":"number","new_RSA_source_url":"string","new_RSA_issuer_estimated_expense_TWD_thousand":{"2026":"number","2027":"number","2028":"number","2029":"number","2030":"number"},"new_rsa_2026":{"source_url":"string","locator":"string","board_resolution_date":"string","shareholder_approval_date":"string","maximum_new_ordinary_shares":"number","issue_price_TWD":"number","vesting":[{"years_after_grant":"number","percent":"number"},{"years_after_grant":"number","percent":"number"},{"years_after_grant":"number","percent":"number"}],"conditions":"string","maximum_fraction_of_June_outstanding_pct":"number","issuer_estimated_total_compensation_TWD_thousand":"number","issuer_estimated_compensation_TWD_thousand_by_year":{"2026":"number","2027":"number","2028":"number","2029":"number","2030":"number"},"expense_caveat":"string","claim_treatment":"string","source_inconsistency":"string","source_sha256":"string","shareholder_approval_source_url":"string","actual_grant_or_issuance_date":"null","authorization_is_outstanding_share_count":"boolean"}};
const POLICY_SCHEMA = {"policy_id":"string","classification":"string","bank_principal_timing":"string","authorized_2026_award_issuance_fraction":"number","authorized_award_policy":"string","nonoperating_equity_value_assigned":"number","circular_crossholding_share_reduction":"number","required_operating_cash":"number","minority_claim_reserved":"number","minority_reserve_basis":"string","time_deposit_funding_release_year":"number","time_deposit_recovery_fraction":"number","lease_cash_by_year":["number","number","number","number","number","number","number","number","number","number"],"financial_cash_interest_by_year":["number","number","number","number","number","number","number","number","number","number"],"supplemental_operating_cash_by_year":["number","number","number","number","number","number","number","number","number","number"],"supplemental_senior_cash_claim":"number","unissued_award_claim_reserved":"number","award_policy":"string","funding_policy":"string"};
const DATED_FACTS = {"issued_common_shares_exact":12576984870,"treasury_shares_exact":30551000,"common_outstanding_million":12546.43387,"ordinary_per_ads":5,"twd_per_usd_spot":31.837,"cash":124706.465,"time_deposits_current":22135.867,"financial_debt":57557.436,"bank_debt_total":17892.245,"bank_current_principal":6402.321,"bank_noncurrent_principal":11489.924,"legacy_pension_provision_claims_reserved":1907.541,"authorized_2026_award_shares_million":67,"novatek_redemption_reserved":565.191,"guarantee_deposits_reserved":40674.252,"dividend_payable_reserved":32704.164009,"current_tax_reserved":5216.199,"contract_liabilities_reserved":6213.892,"refund_liabilities_reserved":4922.969};
const DOMESTIC_BONDS = [{"maturity_month":"2026-12","principal":5000000,"coupon_pct":0.63},{"maturity_month":"2028-04","principal":2000000,"coupon_pct":0.63},{"maturity_month":"2028-08","principal":5000000,"coupon_pct":1.8},{"maturity_month":"2028-09","principal":10000000,"coupon_pct":1.62},{"maturity_month":"2028-10","principal":5000000,"coupon_pct":1.7},{"maturity_month":"2028-12","principal":2300000,"coupon_pct":1.55},{"maturity_month":"2030-06","principal":2000000,"coupon_pct":1.94},{"maturity_month":"2030-06","principal":3200000,"coupon_pct":1.99},{"maturity_month":"2030-12","principal":2500000,"coupon_pct":1.6},{"maturity_month":"2031-04","principal":2100000,"coupon_pct":0.68}];

// This is an operating-expense assumption, NOT a funding/allocation policy.
// It deliberately has no reserves, share-allocation assumptions or bank timing.
export const UMC_OPERATING_COST_BASELINE = Object.freeze({
 label: 'Explicit pre-allocation business-cost path; no capital policy selected',
 lease_cash_by_year: Object.freeze([1100,1122,1144.44,1167.3288,1190.675376,1214.48888352,1238.77866119,1263.55423441,1288.8253191,1314.60182549]),
 financial_cash_interest_by_year: Object.freeze([2000,2000,2000,2000,2000,0,0,0,0,0]),
 supplemental_operating_cash_by_year: Object.freeze([0,0,0,0,0,0,0,0,0,0])
});
const ANNUAL_SCHEMA = Object.fromEntries(['revenue','margin','taxRate','reinvestment','wacc','cashCapex','daNonlease','leaseCash','deltaNwc','supplementalOperatingCash','financialCashInterest'].map(k=>[k,'number']));
const TERMINAL_SCHEMA = Object.fromEntries(['growth','margin','taxRate','wacc','roic'].map(k=>[k,'number']));
const CLAIMS = ['guarantee_deposits_reserved','dividend_payable_reserved','current_tax_reserved','contract_liabilities_reserved','refund_liabilities_reserved','legacy_pension_provision_claims_reserved'];
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const close=(a,b)=>Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-12);
export function umcError(message,status='invalid_assumptions') {
 return Object.assign(new Error(`UMC ${message}`),{status,enterprise:null,equity:null,perShare:null,current_target:null,conditional_usd_per_ads:null,conditional_twd_per_ordinary:null});
}
const fail=message=>{throw umcError(message);};
function check(ok,message){if(!ok)fail(message);}
function shape(value,schema,path='inputs'){
 if(Array.isArray(schema)){
  check(Array.isArray(value)&&value.length===schema.length&&Object.keys(value).length===schema.length&&Reflect.ownKeys(value).length===schema.length+1,`${path} requires exactly ${schema.length} dense array entries.`);
  schema.forEach((s,i)=>shape(value[i],s,`${path}.${i}`));return;
 }
 if(schema&&typeof schema==='object'){
  check(value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null),`${path} requires a plain object.`);
  check(Reflect.ownKeys(value).every(k=>typeof k==='string'&&own(schema,k)),`${path} has unknown keys.`);
  check(Object.keys(schema).every(k=>own(value,k)),`${path} has missing keys.`);
  Object.keys(schema).forEach(k=>shape(value[k],schema[k],`${path}.${k}`));return;
 }
 check(schema==='null'?value===null:typeof value===schema&&(schema!=='number'||finite(value)),`${path} requires ${schema==='number'?'a finite number':schema}.`);
}
function nonnegative(x,label){check(finite(x)&&x>=0,`${label} must be a finite nonnegative number.`);}
function tax(x,label){check(finite(x)&&x>=0&&x<1,`${label} must be in [0, 1).`);}
function finiteTree(x){if(typeof x==='number')check(finite(x),'arithmetic exceeded the finite supported domain.');else if(x&&typeof x==='object')Object.values(x).forEach(finiteTree);return x;}
function validateScenario(s){
 shape(s,INPUT_SCHEMA.scenarios.base,'scenario');
 check(s.revenue_first>0,'scenario revenue_first must be positive.');
 check(s.growth.every(v=>v>-1),'scenario growth must exceed -100%.');
 s.cash_capex.forEach(v=>nonnegative(v,'cash capex'));s.da_nonlease.forEach(v=>nonnegative(v,'nonlease D&A'));
 tax(s.tax_rate,'scenario tax rate');
 check(s.terminal_growth>=0&&s.wacc>s.terminal_growth,'scenario WACC must exceed nonnegative terminal growth.');
}
function resolveScenario(x,s){
 if(typeof s==='string'){check(own(x.scenarios,s),'unknown scenario.');return x.scenarios[s];}
 validateScenario(s);return s;
}
export function validateUmcInputs(x,scenario=undefined){
 shape(x,INPUT_SCHEMA);
 check(x.ticker==='UMC'&&x.balance_date==='2026-06-30'&&x.fx_date===x.balance_date&&x.research_cutoff==='2026-10-19','requires the reviewed June 30, 2026 capital and FX anchor and October 19 research cutoff.');
 check(x.selected_policy===null&&x.current_target===null,'source policy and current target must remain null.');
 check(x.unit==='NTD millions except million ordinary shares, TWD per ordinary and USD per ADS'&&x.study_type==='Dated ex-declared-distribution operating-assets scenario excluding all nonoperating equity investment value','units and operating-assets exclusion scope must remain explicit.');
 for(const [k,v]of Object.entries(DATED_FACTS))check(x[k]===v,`dated ${k} differs from the reviewed source.`);
 check(x.common_outstanding_million===(x.issued_common_shares_exact-x.treasury_shares_exact)/1e6,'issued less treasury ordinary-share identity failed.');
 check(close(x.bank_current_principal+x.bank_noncurrent_principal,x.bank_debt_total),'bank principal identity failed.');
 check(close(Object.values(x.legacy_claim_components).reduce((a,b)=>a+b,0),x.legacy_pension_provision_claims_reserved),'legacy obligation reserve identity failed.');
 for(const [k,v]of Object.entries(x.legacy_claim_components))check(v===({net_defined_benefit_liability:833.593,decommissioning_provision:926.028,onerous_contract_provision:105.949,carbon_fee_provision:41.971})[k],`dated legacy ${k} differs from source.`);
 check(x.initial_revenue_anchor>0,'initial revenue must be positive.');
 nonnegative(x.incremental_working_capital_ratio,'incremental working capital ratio');
 check(x.terminal_incremental_roic>0,'terminal incremental ROIC must be positive.');
 Object.values(x.scenarios).forEach(s=>{validateScenario(s);check(x.terminal_incremental_roic>s.terminal_growth,'source terminal ROIC must exceed each scenario growth rate.');});
 if(scenario!==undefined)validateScenario(resolveScenario(x,scenario));
 return true;
}
export function validateUmcPolicy(p){
 if(p===null)return false;
 const schema=own(p??{},'stress_basis')?{...POLICY_SCHEMA,stress_basis:'string'}:POLICY_SCHEMA;
 shape(p,schema,'policy');
 check(['explicit_operating_assets_exclusion','explicit_liquidity_and_claim_stress','explicit_staged_bank_principal'].includes(p.policy_id),'policy_id must name one of the three admitted analyst examples; its assumptions remain editable.');
 check(['all_upfront','current_upfront_remaining_year2'].includes(p.bank_principal_timing),'bank principal timing is unsupported.');
 check(p.nonoperating_equity_value_assigned===0&&p.circular_crossholding_share_reduction===0,'entire investment portfolio and circular share benefit must remain excluded.');
 check(p.authorized_2026_award_issuance_fraction>=0&&p.authorized_2026_award_issuance_fraction<=1,'authorized new-award issuance fraction must be in [0, 1].');
 check(p.time_deposit_recovery_fraction>=0&&p.time_deposit_recovery_fraction<=1,'time-deposit recovery must be in [0, 1].');
 check(Number.isInteger(p.time_deposit_funding_release_year)&&p.time_deposit_funding_release_year>=1&&p.time_deposit_funding_release_year<=10,'time deposits must convert in an integer forecast year 1–10, never at inception.');
 for(const k of ['lease_cash_by_year','financial_cash_interest_by_year','supplemental_operating_cash_by_year'])p[k].forEach(v=>nonnegative(v,`policy ${k}`));
 for(const k of ['required_operating_cash','minority_claim_reserved','supplemental_senior_cash_claim','unissued_award_claim_reserved'])nonnegative(p[k],`policy ${k}`);
 return true;
}
export function umcDomesticSchedule(d){
 shape(d,FUNDING_SCHEMA,'funding inputs');
 check(d.balance_sheet_date==='2026-06-30'&&d.research_cutoff==='2026-10-19'&&d.units==='TWD thousands unless expressly stated','funding inputs require reviewed date and thousand-TWD units.');
 const result=Array(10).fill(0);
 d.domestic_bond_principal_schedule.forEach((r,i)=>{
  const source=DOMESTIC_BONDS[i];
  check(r.maturity_month===source.maturity_month&&r.principal===source.principal&&r.coupon_pct===source.coupon_pct,'contractual domestic principal schedule differs from reviewed source.');
  check(/^\d{4}-(0[1-9]|1[0-2])$/.test(r.maturity_month),'invalid domestic maturity month.');
  const [year,month]=r.maturity_month.split('-').map(Number),index=year-2027+(month>6?1:0);
  check(index>=0&&index<10,'domestic bond maturity is outside the forecast.');
  result[index]+=r.principal/1000;
 });
 check(close(result.reduce((a,b)=>a+b,0),39100),'domestic principal must reconcile to TWD 39,100m.');
 return result;
}
function validateFunding(x,d){
 const schedule=umcDomesticSchedule(d);
 const same=(a,b,label)=>check(close(a,b),`funding source ${label} does not reconcile.`);
 same(x.cash,d.cash_and_cash_equivalents/1000,'cash');same(x.time_deposits_current,d.time_deposits_original_maturity_over_3_months/1000,'time deposits');
 same(x.financial_debt,d.financial_debt_face_or_contractual_redemption_proxy/1000,'debt');
 same(x.bank_debt_total,(d.financial_debt_components.short_term_bank+d.financial_debt_components.long_term_bank_including_current)/1000,'bank debt');
 same(x.bank_current_principal,(d.financial_debt_components.short_term_bank+d.bank_current_portion_of_long_term)/1000,'current bank principal');
 same(x.financial_debt,x.bank_debt_total+schedule.reduce((a,b)=>a+b,0)+x.novatek_redemption_reserved,'total principal');
 same(x.novatek_redemption_reserved,d.financial_debt_components.novatek_exchangeable_redemption_TWD_equivalent/1000,'Novatek redemption');
 for(const [a,b]of [['guarantee_deposits_reserved','customer_guarantee_deposits_total'],['current_tax_reserved','other_current_tax_liability'],['refund_liabilities_reserved','refund_liabilities'],['authorized_2026_award_shares_million','new_RSA_maximum_shares']])same(x[a],d[b]/(a==='authorized_2026_award_shares_million'?1e6:1000),a);
 same(x.dividend_payable_reserved,d.dividend_exact_TWD/1e6,'exact ex-declared dividend');
 same(x.contract_liabilities_reserved,(d.contract_liabilities_current+d.contract_liabilities_noncurrent)/1000,'contract liabilities');
 same(x.legacy_pension_provision_claims_reserved,d.legacy_obligations.total/1000,'legacy claim reserves');
 return schedule;
}
/** Complete explicit business rows, without choosing an allocation policy. */
export function umcSourceSchedule(x,scenario,policy=null){
 validateUmcInputs(x,scenario);validateUmcPolicy(policy);
 const s=resolveScenario(x,scenario),costs=policy??UMC_OPERATING_COST_BASELINE;
 let prior=x.initial_revenue_anchor;
 return finiteTree(s.ebit_margin.map((margin,i)=>{
  const revenue=i===0?s.revenue_first:prior*(1+s.growth[i-1]),deltaNwc=(revenue-prior)*x.incremental_working_capital_ratio;
  const cashCapex=s.cash_capex[i],daNonlease=s.da_nonlease[i],supplementalOperatingCash=costs.supplemental_operating_cash_by_year[i];
  prior=revenue;
  return {revenue,margin,taxRate:s.tax_rate,wacc:s.wacc,reinvestment:cashCapex-daNonlease+deltaNwc+supplementalOperatingCash,cashCapex,daNonlease,leaseCash:costs.lease_cash_by_year[i],deltaNwc,supplementalOperatingCash,financialCashInterest:costs.financial_cash_interest_by_year[i]};
 }));
}
function validateAnnual(x,annual,costs){
 shape(annual,Array(10).fill(ANNUAL_SCHEMA),'annual');
 let prior=x.initial_revenue_anchor;
 annual.forEach((r,i)=>{
  check(r.revenue>0&&r.wacc>0,`annual year ${i+1} requires positive revenue and WACC.`);tax(r.taxRate,'annual tax rate');
  for(const k of ['cashCapex','daNonlease','leaseCash','supplementalOperatingCash','financialCashInterest'])nonnegative(r[k],`annual ${k}`);
  check(close(r.deltaNwc,(r.revenue-prior)*x.incremental_working_capital_ratio),`annual year ${i+1} change in working capital must reconcile to revenue changes.`);
  check(close(r.reinvestment,r.cashCapex-r.daNonlease+r.deltaNwc+r.supplementalOperatingCash),`annual year ${i+1} reinvestment must equal explicit capex less nonlease D&A plus working capital and supplemental operating cash.`);
  for(const [k,source]of [['leaseCash','lease_cash_by_year'],['financialCashInterest','financial_cash_interest_by_year'],['supplementalOperatingCash','supplemental_operating_cash_by_year']])check(close(r[k],costs[source][i]),`annual year ${i+1} ${k} must match the explicitly selected cost path.`);
  prior=r.revenue;
 });
}
/** Returns operating EV for null policy, and gated dated equity/ADS values only
 * for an explicitly supplied policy. All funding inputs remain indispensable.
 * Unknown, missing, coerced, nonfinite or internally inconsistent inputs throw
 * an error with every valuation headline null; caller must not retain old values.
 */
export function evaluateUmc(x,scenario,policy=null,annual=null,terminal=null,fundingInputs){
 validateUmcInputs(x,scenario);const selected=validateUmcPolicy(policy),s=resolveScenario(x,scenario),costs=policy??UMC_OPERATING_COST_BASELINE;
 const principal=fundingInputs===undefined&&!selected?null:validateFunding(x,fundingInputs);
 const schedule=annual===null?umcSourceSchedule(x,s,policy):annual;
 validateAnnual(x,schedule,costs);
 const t=terminal===null?{growth:s.terminal_growth,margin:s.ebit_margin[9],taxRate:s.tax_rate,wacc:s.wacc,roic:x.terminal_incremental_roic}:terminal;
 shape(t,TERMINAL_SCHEMA,'terminal');tax(t.taxRate,'terminal tax rate');
 check(t.growth>=0&&t.wacc>t.growth&&t.roic>t.growth,'terminal WACC and ROIC must exceed nonnegative growth.');
 const knownClaims=CLAIMS.reduce((v,k)=>v+x[k],0),analystClaims=selected?policy.minority_claim_reserved+policy.supplemental_senior_cash_claim+policy.unissued_award_claim_reserved:null;
 const recovery=selected?x.time_deposits_current*policy.time_deposit_recovery_fraction:null;
 const bankReserve=selected?(policy.bank_principal_timing==='all_upfront'?x.bank_debt_total:x.bank_current_principal):null;
 const initial=selected?x.cash-knownClaims-analystClaims-policy.required_operating_cash-bankReserve-x.novatek_redemption_reserved:null;
 const bridge=selected?x.cash+recovery-x.financial_debt-knownClaims-analystClaims-policy.required_operating_cash:null;
 let cash=initial,minimum=initial,discount=1,pv=0,prior=x.initial_revenue_anchor;
 const rows=schedule.map((r,i)=>{
  const preLease=r.revenue*r.margin,ebit=preLease-r.leaseCash,cashTax=Math.max(ebit,0)*r.taxRate;
  // Keep source arithmetic ordering, and retain every explicit cash component.
  const fcff=ebit-cashTax+r.daNonlease-r.cashCapex-r.deltaNwc-r.supplementalOperatingCash;
  discount*=1+r.wacc;const present=fcff/discount;pv+=present;
  const release=selected?(i+1===policy.time_deposit_funding_release_year?recovery:0):null;
  const bankPayment=selected?(i===1&&policy.bank_principal_timing==='current_upfront_remaining_year2'?x.bank_noncurrent_principal:0):null;
  if(selected){cash+=fcff+release-principal[i]-bankPayment-r.financialCashInterest;minimum=Math.min(minimum,cash);}
  const row={year:i+1,period_end:`${2027+i}-06-30`,revenue:r.revenue,margin:r.margin,taxRate:r.taxRate,wacc:r.wacc,growth:r.revenue/prior-1,pre_lease_ebit:preLease,ebit_after_cash_lease:ebit,cash_tax:cashTax,nopat:ebit-cashTax,da_excluding_rou:r.daNonlease,all_in_cash_capex:r.cashCapex,total_lease_cash:r.leaseCash,change_working_capital:r.deltaNwc,incremental_operating_cash_obligations:r.supplementalOperatingCash,reinvestment:r.reinvestment,fcff,pv_fcff:present,present_value:present,discount_factor:discount,time_deposit_cash_conversion:release,domestic_bond_principal:selected?principal[i]:null,bank_principal_payment:bankPayment,financial_debt_cash_interest_excluding_leases:r.financialCashInterest,ending_available_liquidity:cash};
  prior=r.revenue;return row;
 });
 const last=rows[9],terminalRevenue=last.revenue*(1+t.growth),terminalLease=last.total_lease_cash*(1+t.growth);
 const terminalNopat=(last.revenue*t.margin-last.total_lease_cash)*(1+t.growth)*(1-t.taxRate),roicCap=terminalNopat*(1-t.growth/t.roic),runrateCap=last.fcff*(1+t.growth),terminalFcff=Math.min(roicCap,runrateCap),tv=terminalFcff/(t.wacc-t.growth),pvtv=tv/discount,ev=pv+pvtv;
 const equity=selected?ev+bridge:null,denominator=selected?x.common_outstanding_million+x.authorized_2026_award_shares_million*policy.authorized_2026_award_issuance_fraction:null;
 const funded=selected&&minimum>=0&&equity>0,ordinary=funded?equity/denominator:null,ads=funded?ordinary*x.ordinary_per_ads/x.twd_per_usd_spot:null;
 const funding=selected?{initial_available_liquidity:initial,minimum_available_liquidity:minimum,gap:Math.max(0,-minimum),known_claims_reserved:knownClaims,analyst_claims_reserved:analystClaims,bank_principal_reserved:bankReserve,novatek_redemption_reserved:x.novatek_redemption_reserved,time_deposits_not_available_at_inception:recovery,new_financing:0,new_subsidies:0,portfolio_sales:0,timing_warning:'Annual buckets; not proof of daily or jurisdiction-specific liquidity. Reservedclaims are paid from segregatedreserve, not doublecharged in FCFF.'}:null;
 return finiteTree({ticker:'UMC',label:x.study_type,balance_date:x.balance_date,research_cutoff:x.research_cutoff,fx_date:x.fx_date,twd_per_usd:x.twd_per_usd_spot,ordinary_per_ads:x.ordinary_per_ads,selected_policy:selected?policy.policy_id:null,selection_required:!selected,current_target:null,current_price_target:null,operating_assets_only:true,nonoperating_investment_portfolio_excluded:true,excluded_nonoperating_equity_value_assigned:0,circular_crossholding_share_reduction:0,distribution_basis:'ex-declared-distribution',operating_cost_basis:selected?`Explicit selected policy: ${policy.policy_id}`:UMC_OPERATING_COST_BASELINE.label,enterprise_value_twd_m:ev,enterprise_value:ev,equity_bridge_twd_m:bridge,equity_value_twd_m:equity,ordinary_share_denominator_m:denominator,issued_less_treasury_m:x.common_outstanding_million,authorized_award_new_shares_m:selected?denominator-x.common_outstanding_million:null,conditional_twd_per_ordinary:ordinary,conditional_usd_per_ads:ads,status:!selected?'POLICY_SELECTION_REQUIRED':funded?'DATED_CONDITIONAL_ANNUAL_FUNDING_PASS':'WITHHELD_UNFUNDED_OR_NONPOSITIVE_EQUITY',forecastPV:pv,terminalPV:pvtv,terminal_pv_fraction:ev===0?null:pvtv/ev,terminal:{...t,revenue:terminalRevenue,total_lease_cash:terminalLease,ebit:terminalRevenue*t.margin-terminalLease,nopat:terminalNopat,roic_limited_fcff:roicCap,runrate_limited_fcff:runrateCap,fcff:terminalFcff,value:tv,pv:pvtv,ev_fraction:ev===0?null:pvtv/ev,reinvestment:terminalNopat-terminalFcff,discountFactor:discount},funding,rows,current_valuation_eligible:false,historical_backtest_eligible:false,ranking_eligible:false});
}
