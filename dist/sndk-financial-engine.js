// SNDK v3 conditional research engine. USD millions; no current-price eligibility.
const SCHEMA={"ticker": "string", "units": "string", "status": "string", "information_cutoff": "string", "valuation_anchor": "string", "base_revenue": "number", "capital_bridge": {"date": "string", "cash": "number", "refundable_customer_deposits_reserve": "number", "minimum_operating_cash_assumption": "number", "marketable_securities": "number", "marketable_securities_haircut_assumption": "number", "financial_debt": "number", "additional_claim_reserve_assumption": "number", "diluted_share_proxy": "number", "actual_common_shares_2026_08_07": "number", "operating_lease_liability_not_subtracted_because_lease_cost_remains_in_operating_margin": "number", "JV_lease_guarantee_contingent_not_base_deduction": "number", "unrecognized_tax_benefits_not_incrementally_deducted_pending_doublecount_review": "number", "opening_current_tax_payable": "number", "opening_noncurrent_tax_payable": "number", "opening_wdc_indemnification": "number", "incremental_uncertain_tax_claim_assumption": "number", "incremental_unpaid_legal_assumption": "number", "third_party_collateral_excluded": "number", "additional_claim_reserve_timing_assumption": "string"}, "scenarios": [{"name": "string", "bit_growth": ["number"], "asp_growth": ["number"], "ebit_margin_after_sbc": ["number"], "tax_rate": "number", "own_capex_ratio": "number", "net_jv_funding_ratio": "number", "own_da_ratio": "number", "incremental_working_capital_ratio": "number", "wacc": "number", "terminal_growth": "number", "terminal_roic": "number", "terminal_ebit_margin": "number", "terminal_net_physical_jv_funding_floor": "number", "distribution_policy": "string", "additional_jv_guarantee_call_assumption": "number"}], "valuation_label": "string", "historical_backtest_eligible": "boolean", "current_valuation_eligible": "boolean", "market_quote": "null", "nbm": {"period_end_rpo_m": "number", "rpo_date": "string", "subsequent_agreements_transaction_price_m": "number", "verified_later_rpo": "null"}};
export const sndkFinite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=m=>{throw Error(m);};
function shape(x,s,p='inputs'){
 if(Array.isArray(s)){if(!Array.isArray(x)||!x.length)fail(`${p} requires an array`);x.forEach((v,i)=>shape(v,s[0],`${p}.${i}`));return;}
 if(s&&typeof s==='object'){if(!x||typeof x!=='object'||Array.isArray(x))fail(`${p} requires an object`);if(Object.keys(x).some(k=>!(k in s)))fail(`${p}: unknown keys`);if(Object.keys(s).some(k=>!(k in x)))fail(`${p}: missing keys`);for(const k in s)shape(x[k],s[k],`${p}.${k}`);return;}
 if(s==='null'){if(x!==null)fail(`${p} must remain null`);return;}
 if(typeof x!==s||(s==='number'&&!sndkFinite(x)))fail(`${p} must be a finite ${s}`);
}
function num(v,k,lo=0,hi=Infinity,strict=false){if(!sndkFinite(v)||v<lo||v>hi||(strict&&v===lo))fail(`${k} outside finite supported bounds`);}
export function validateSndkInputs(a,scenario){
 shape(a,SCHEMA);num(a.base_revenue,'base revenue',0,Infinity,true);
 const b=a.capital_bridge;
 for(const [k,v] of Object.entries(b))if(typeof v==='number')num(v,k);
 num(b.marketable_securities_haircut_assumption,'haircut',0,1);num(b.diluted_share_proxy,'share proxy',0,Infinity,true);
 if(b.financial_debt!==0)fail('SNDK nonzero financial debt requires an unmodeled maturity and interest schedule.');
 const ss=scenario?[...a.scenarios,scenario]:a.scenarios;
 for(const s of ss){shape(s,SCHEMA.scenarios[0],'scenario');for(const k of ['bit_growth','asp_growth','ebit_margin_after_sbc']){if(s[k].length!==10)fail(`${k} requires ten years`);s[k].forEach(v=>num(v,k,-1,k==='ebit_margin_after_sbc'?1:3,k!=='ebit_margin_after_sbc'));}
 for(const k of ['tax_rate','own_capex_ratio','net_jv_funding_ratio','own_da_ratio','incremental_working_capital_ratio','terminal_net_physical_jv_funding_floor'])num(s[k],k,0,1);
 for(const k of ['wacc','terminal_roic','terminal_ebit_margin'])num(s[k],k,0,1,true);
 num(s.terminal_growth,'terminal growth',0,.1);num(s.additional_jv_guarantee_call_assumption,'guarantee call');
 if(s.wacc<=s.terminal_growth||s.terminal_roic<=s.terminal_growth)fail('SNDK terminal growth must be below WACC and ROIC.');
 if(s.own_da_ratio>s.own_capex_ratio)fail('SNDK own depreciation cannot exceed own capex.');
 if(!['retain_all','distribute_positive'].includes(s.distribution_policy))fail('SNDK unknown distribution policy.');
 }return true;
}
export function sndkFiniteTree(x){if(typeof x==='number'&&!sndkFinite(x))fail('SNDK arithmetic outside finite supported domain.');if(x&&typeof x==='object')Object.values(x).forEach(sndkFiniteTree);}
export function evaluateSndkSchedule(a,s,annual,terminal){
 const b=a.capital_bridge,opening_reserved_cash=['refundable_customer_deposits_reserve','minimum_operating_cash_assumption','opening_current_tax_payable','opening_noncurrent_tax_payable','opening_wdc_indemnification','incremental_uncertain_tax_claim_assumption','incremental_unpaid_legal_assumption','additional_claim_reserve_assumption'].reduce((v,k)=>v+b[k],0),opening_surplus=b.cash-opening_reserved_cash;
 let cash=opening_surplus-s.additional_jv_guarantee_call_assumption,gap=Math.max(0,-cash),prior=a.base_revenue,pv=0,discount=1;
 const rows=annual.map((r,i)=>{
 const revenue=r.revenue,ebit=revenue*r.margin,tax=Math.max(0,ebit)*r.taxRate,nopat=ebit-tax,own_capex=revenue*s.own_capex_ratio,jv_net_funding=revenue*s.net_jv_funding_ratio,own_da=revenue*s.own_da_ratio,delta_nwc=Math.max(0,revenue-prior)*s.incremental_working_capital_ratio,fundingFloor=own_capex+jv_net_funding-own_da+delta_nwc,net_reinvestment=Math.max(r.reinvestment??fundingFloor,fundingFloor),fcff=nopat-net_reinvestment;
 discount*=1+r.wacc;const pv_fcff=fcff/discount;pv+=pv_fcff;cash+=s.distribution_policy==='retain_all'?fcff:Math.min(0,fcff);gap=Math.max(gap,-cash);prior=revenue;
 return {fiscal_year:2027+i,revenue,ebit,tax,nopat,own_capex,jv_net_funding,own_da,delta_nwc,net_reinvestment,fcff,pv_fcff,funding_cash_pool_before_financing:cash,peak_funding_gap:Math.max(0,gap),fundingFloor,enteredReinvestment:r.reinvestment??fundingFloor,investmentFloorTopUp:net_reinvestment-(r.reinvestment??fundingFloor),discountFactor:discount};
 });
 const t=terminal,tr=prior*(1+t.growth),tn=tr*t.margin*(1-t.taxRate),roic=tn*t.growth/t.roic,physical=tr*s.terminal_net_physical_jv_funding_floor,wc=(tr-prior)*s.incremental_working_capital_ratio,reinv=Math.max(roic,physical+wc);
 if(tn<=reinv)fail('SNDK terminal funding floor consumes NOPAT; no positive sustainable terminal FCFF.');
 const fcff=tn-reinv,pvt=fcff/(t.wacc-t.growth)/discount,ev=pv+pvt,securities=b.marketable_securities*(1-b.marketable_securities_haircut_assumption),eq=ev+opening_surplus+securities-s.additional_jv_guarantee_call_assumption,common=gap<=1e-8?Math.max(0,eq):null;
 const result={status:gap<=1e-8?'VALID_CONDITIONAL_RESEARCH':'FUNDING_GAP_COMMON_VALUE_WITHHELD',scenario:s.name,diluted_share_proxy_m:b.diluted_share_proxy,label:a.valuation_label,historical_backtest_eligible:false,current_valuation_eligible:false,operating_value:ev,operating_value_status:gap<=1e-8?'CONDITIONAL_OPERATING_DIAGNOSTIC':'CONTINGENT_ON_UNMODELED_FUNDING',pv_explicit:pv,pv_terminal:pvt,terminal_share:ev?pvt/ev:null,opening_reserved_cash,opening_surplus,nonoperating_securities_value:securities,economic_equity_diagnostic:eq,conditional_common_equity:common,conditional_value_per_proxy_share:common===null?null:common/b.diluted_share_proxy,conditional_value_per_158m_share:common===null?null:common/158,peak_unfunded_gap:Math.max(0,gap),financing_solution:null,limited_liability_floor_applied:eq<0,terminal_reinvestment:reinv,terminal_roic_based_reinvestment:roic,terminal_physical_jv_floor:physical,terminal_delta_wc:wc,terminal_fcff:fcff,terminal_net_reinvestment_ratio:reinv/tr,terminal_implied_reinvestment_roic:reinv?tn*t.growth/reinv:null,market_comparison:{status:'BLOCKED',reason:'missing quote',upside:null,ranking_value:null},rows};sndkFiniteTree(result);return result;
}
export function calculateSndk(a,scenarioOrName,overrides={}){
 const s=structuredClone(typeof scenarioOrName==='string'?a.scenarios.find(x=>x.name===scenarioOrName):scenarioOrName);
 if(!s)fail('SNDK unknown scenario.');if(Object.keys(overrides).some(k=>!['wacc','g'].includes(k)))fail('SNDK unknown override.');if(overrides.wacc!==undefined)s.wacc=overrides.wacc;if(overrides.g!==undefined)s.terminal_growth=overrides.g;validateSndkInputs(a,s);
 let revenue=a.base_revenue;const annual=s.bit_growth.map((v,i)=>({revenue:revenue= revenue*(1+v)*(1+s.asp_growth[i]),margin:s.ebit_margin_after_sbc[i],taxRate:s.tax_rate,wacc:s.wacc}));
 const result=evaluateSndkSchedule(a,s,annual,{growth:s.terminal_growth,margin:s.terminal_ebit_margin,taxRate:s.tax_rate,wacc:s.wacc,roic:s.terminal_roic});
 for(const r of result.rows)for(const k of ['fundingFloor','enteredReinvestment','investmentFloorTopUp','discountFactor'])delete r[k];return result;
}
