// RMBS June 2026 conditional allocation. USD millions and million shares.
// Pure implementation of frozen v3 replay; no quote, automatic policy or financing.
const finite=x=>typeof x==='number'&&Number.isFinite(x),own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
export const RMBS_ERROR='RMBS requires complete finite June-model assumptions. Invalid inputs are retained; valuation is withheld.';
const fail=()=>{throw Object.assign(Error(RMBS_ERROR),{status:'invalid_assumptions'});};
const check=(ok)=>{if(!ok)fail();};
export function validateRmbsPolicy(x,p){
 if(p===null)return false;
 check(p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===x.conditional_assumption_fields.length&&x.conditional_assumption_fields.every(k=>own(p,k)));
 check(p.acknowledge_conditional_not_current===true&&p.assume_no_separate_legacy_tax_benefit===true&&p.settlement_price_convention==='intrinsic_price_grows_at_scenario_wacc_no_dividend');
 for(const k of ['baseline_total_sbc_pct_revenue','reported_unit_vesting_fraction','withholding_fraction','residual_claim_cash_fraction','marketable_securities_liquidity_haircut'])check(finite(p[k])&&p[k]>=0&&p[k]<=1);
 check(finite(p.reported_units_already_in_common_m)&&p.reported_units_already_in_common_m>=0&&p.reported_units_already_in_common_m<=x.legacy_nonvested_awards);
 check(finite(p.residual_legacy_share_equivalents_m)&&p.residual_legacy_share_equivalents_m>=0);
 for(const k of ['legacy_expense_runout_m','vesting_weights'])check(Array.isArray(p[k])&&p[k].length===10&&Object.keys(p[k]).length===10&&p[k].every(v=>finite(v)&&v>=0));
 check(Math.abs(p.vesting_weights.reduce((a,b)=>a+b,0)-1)<=1e-9&&p.legacy_expense_runout_m.reduce((a,b)=>a+b,0)<=x.source_facts.unrecognized_legacy_sbc+1e-9);return true;
}
export function rmbsSourceSchedule(x,s){
 let seg={...x.initial_segments};return Array.from({length:10},(_,i)=>{const a=i/9;for(const k of Object.keys(seg)){const g=s.growth_start[k]*(1-a)+s.growth_end[k]*a;check(finite(g)&&g> -1);seg[k]*=1+g;}
 return {year:i+1,period:`12M Jun ${2027+i}`,revenue:Object.values(seg).reduce((a,b)=>a+b,0),margin:s.margin_start*(1-a)+s.margin_end*a,taxRate:s.tax_rate,wacc:s.wacc,segments:{...seg}};});
}
export function evaluateRmbs(x,s,p=null,annual=null,terminal=null){
 check(s.years===10&&x.valuation_anchor==='2026-06-30'&&x.information_cutoff==='2026-10-19'&&x.currency==='USD');
 for(const k of ['initial_common_shares','legacy_nonvested_awards','cash_only','marketable_securities','operating_cash_reserve','eda_debt_like_claim','eda_nominal_cash_reserve','other_claim_reserve'])check(finite(x[k])&&x[k]>=0);
 check(x.initial_common_shares>0&&Math.abs(x.cash_only+x.marketable_securities-x.cash_and_securities)<1e-8);
 for(const k of ['net_reinvestment_floor_pct_revenue','growth_working_capital_pct','incremental_roic'])check(finite(s[k])&&s[k]>=0);check(s.incremental_roic>0);
 const selected=validateRmbsPolicy(x,p),t=terminal||{growth:s.terminal_growth,margin:s.margin_end,taxRate:s.tax_rate,wacc:s.wacc,roic:s.incremental_roic};
 check(['growth','margin','taxRate','wacc','roic'].every(k=>finite(t[k]))&&t.growth>=0&&t.wacc>t.growth&&t.roic>0&&t.taxRate>=0&&t.taxRate<1);
 const schedule=annual||rmbsSourceSchedule(x,s);check(Array.isArray(schedule)&&schedule.length===10&&Object.keys(schedule).length===10);
 let prior=Object.values(x.initial_segments).reduce((a,b)=>a+b,0),discount=1,pv=0,pvadd=0,cumulative=0,trough=0;
 const rows=schedule.map((r,i)=>{check(['revenue','margin','taxRate','wacc'].every(k=>finite(r[k]))&&r.revenue>0&&r.taxRate>=0&&r.taxRate<1&&r.wacc>0);
 const delta=r.revenue-prior,nopat=r.revenue*r.margin*(1-r.taxRate),growthNeed=Math.max(0,delta*r.margin*(1-r.taxRate)/t.roic),floor=r.revenue*s.net_reinvestment_floor_pct_revenue+Math.max(0,delta)*s.growth_working_capital_pct,required=Math.max(growthNeed,floor),investment=annual?r.reinvestment:required;
 check(finite(investment)&&investment>=required-1e-8);const fcff=nopat-investment;discount*=1+r.wacc;pv+=fcff/discount;
 const legacy=selected?p.legacy_expense_runout_m[i]:0,allowance=selected?r.revenue*p.baseline_total_sbc_pct_revenue:null,residual=selected?allowance-legacy:null;check(!selected||residual>=-1e-8);
 const add=legacy*(1-r.taxRate);pvadd+=add/discount;cumulative+=fcff+add;trough=Math.min(trough,cumulative);
 const out={year:i+1,period_end:`${2027+i}-06-30`,...(r.segments||{}),revenue:r.revenue,ebit_margin:r.margin,nopat,growth_reinvestment:growthNeed,reinvestment_floor:floor,net_reinvestment:investment,required_reinvestment:required,fcff,discount_factor:discount,present_value:fcff/discount,baseline_total_sbc_allowance:allowance,legacy_expense_removed:legacy,remaining_new_grant_cash_equivalent_cost:residual,legacy_after_tax_addback:add,fcff_after_legacy_adjustment:fcff+add,growth:r.revenue/prior-1,cumulativeFCFF:cumulative};prior=r.revenue;return out;});
 const last=rows.at(-1),tr=last.revenue*(1+t.growth),tn=tr*t.margin*(1-t.taxRate),tri=Math.max(tn*t.growth/t.roic,tr*s.net_reinvestment_floor_pct_revenue+last.revenue*t.growth*s.growth_working_capital_pct),tfcf=tn-tri,tv=tfcf/(t.wacc-t.growth),pvt=tv/discount,businessEV=pv+pvt,ev=businessEV+pvadd;
 const bridge=x.cash_and_securities-x.operating_cash_reserve-x.eda_debt_like_claim-x.other_claim_reserve,haircut=selected?x.marketable_securities*p.marketable_securities_liquidity_haircut:0,pool=ev+bridge-haircut;
 const terminalResult={...t,revenue:tr,ebit:tr*t.margin,nopat:tn,reinvestment:tri,fcff:tfcf,value:tv,pv:pvt,discountFactor:discount};
 const base={balance_date:'2026-06-30',current_price_target:null,rows,terminal:terminalResult,enterprise_value:businessEV,enterprise_value_after_legacy_adjustment:ev,legacy_expense_adjustment_pv:pvadd,equity_pool_before_legacy_claims:pool,net_cash_bridge:bridge,forecastPV:pv+pvadd,terminalPV:pvt,terminal_pv_fraction:pvt/ev,peakEconomicDeficit:Math.max(0,-trough)};
 const verify=x=>{if(typeof x==='number')check(finite(x));else if(x&&typeof x==='object')Object.values(x).forEach(verify);};verify(base);
 if(!selected)return {...base,status:'AWARD_POLICY_SELECTION_REQUIRED',conditional_share_value:null};
 const known=(x.legacy_nonvested_awards-p.reported_units_already_in_common_m)*p.reported_unit_vesting_fraction,residual=p.residual_legacy_share_equivalents_m,A=known+residual,N=x.initial_common_shares,price=Math.max(0,pool)/(N+A),netunits=known*(1-p.withholding_fraction)+residual*(1-p.residual_claim_cash_fraction);
 let cash=x.cash_and_securities-haircut-x.operating_cash_reserve-x.eda_nominal_cash_reserve-x.other_claim_reserve,minimum=cash,pvcash=0;const initial=cash;
 rows.forEach((row,i)=>{const weight=p.vesting_weights[i],settlement=price*row.discount_factor,kcash=known*weight*p.withholding_fraction*settlement,rcash=residual*weight*p.residual_claim_cash_fraction*settlement,total=kcash+rcash,start=cash,pre=cash-total;pvcash+=total/row.discount_factor;minimum=Math.min(minimum,pre);cash=pre+row.fcff_after_legacy_adjustment;minimum=Math.min(minimum,cash);Object.assign(row,{legacy_gross_units_settled:A*weight,legacy_net_share_equivalent_allocation:netunits*weight,reported_award_withholding_cash:kcash,residual_claim_cash_settlement:rcash,conditional_settlement_price:settlement,legacy_withholding_cash:total,opening_cash_after_reserves:start,cash_after_withholding_before_receipts:pre,closing_cash_after_reserves:cash});});
 const allocationResidual=pool>0?pool-N*price-netunits*price-pvcash:null;check(allocationResidual===null||Math.abs(allocationResidual)<=Math.max(1e-8,Math.abs(pool)*1e-10));const funding=Math.max(0,-minimum),eligible=funding===0&&pool>0;
 const result={...base,status:eligible?'FUNDED_CONDITIONAL_JUNE_MODEL':'WITHHELD_UNFUNDED_OR_NO_EQUITY',conditional_share_value:eligible?price:null,ordinary_share_count:N,selected_legacy_claim_equivalent_units:A,reported_awards_selected_units:known,residual_net_claim_equivalent_units:residual,conditional_net_equity_claim_units:netunits,ordinary_equity_allocation:N*price,legacy_net_equity_allocation:netunits*price,legacy_cash_settlement_pv:pvcash,allocation_residual:allocationResidual,initial_liquidity_after_reserves:initial,minimum_liquidity_after_reserves:minimum,external_funding_required:funding};
 verify(result);return result;
}
