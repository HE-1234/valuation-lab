import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MCD_FORECAST_YEARS,MCD_ALLOCATION_SCOPE_FLAGS,calculateMcdOperating,mcdSourceSchedule,allocateMcdCommon,validateMcdInputs,validateMcdPolicy} from '../dist/mcd-financial-engine.js';

const fixture=new URL('../dist/data/incremental-MCD-2026-10-19-v2/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,fixture),'utf8'));
const a=read('dcf-inputs-v2.json'),expected=read('dcf-output-v2.json'),illustrations=read('allocation-illustrations-v2.json');
const clone=x=>structuredClone(x);
const near=(x,y,p='value')=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-11),`${p}: ${x} != ${y}`);
function compare(x,y,p='result'){if(typeof y==='number')return near(x,y,p);if(y===null||typeof y!=='object')return assert.equal(x,y,p);for(const k of Object.keys(y))compare(x[k],y[k],p+'.'+k);}
const withholding=e=>e.enterprise===null&&e.equity===null&&e.perShare===null&&e.current_target===null&&e.current_upside===null&&e.dated_per_share_allocation===null;
function assertWithheld(x){for(const k of ['current_target','current_upside'])assert.equal(x[k],null,k);for(const k of ['current_valuation_eligible','historical_backtest_eligible','ranking_eligible','funding_certified'])assert.equal(x[k],false,k);}
function* numericLeaves(x,p=[]){if(x&&typeof x==='object')for(const k of Object.keys(x))yield*numericLeaves(x[k],[...p,k]);else if(typeof x==='number')yield p;}

// No DOM, registry, aggregate harness, or Python process is required by these tests.
test('MCD all source scalars and 33 detailed rows faithfully replay the reviewed Python output',()=>{
 assert.deepEqual(MCD_FORECAST_YEARS,[2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036]);
 for(const [name,want]of Object.entries(expected.results)){
  const actual=calculateMcdOperating(a,name);compare(actual,want,name);assertWithheld(actual);
  assert.equal(actual.rows.length,11);assert.equal(actual.rows[0].cashflow_period,'2026-H2');
  const annual=mcdSourceSchedule(a,name);assert.equal(annual.length,11);compare(calculateMcdOperating(a,name,{annual}),want,name+' explicit annual');
  for(const [i,r]of actual.rows.entries()){
   assert.equal(r.cashflow_period,i===0?'2026-H2':String(2026+i));assert.equal(r.year_fraction,i===0?.5:1);assert.equal(r.yearsFromOrigin,i+.5);
   near(r.revenue,r.period_revenue);near(r.margin,r.period_core_ebit/r.period_revenue);near(r.reinvestment,r.cash_capex+r.new_finance_lease_assets_as_economic_capex+r.change_in_nwc-r.consolidated_da+r.analyst_net_investment_adjustment);
   near(r.fcff,r.nopat-r.reinvestment);near(r.pv_fcff,r.fcff*(1+a.scenarios[name].wacc)**(-i-.5));
   near(r.full_year_reported_revenue_proxy,r.franchise_revenue+r.company_revenue+r.other_revenue);near(r.franchisee_sales,r.conventional_franchisee_sales+r.developmental_licensee_sales+r.affiliate_restaurant_sales);
  }
 }
 near(calculateMcdOperating(a,'bear').core_operating_ev,98917.3045820689);near(calculateMcdOperating(a,'base').core_operating_ev,187793.29019496965);near(calculateMcdOperating(a,'bull').core_operating_ev,292139.6283463944);
});

test('MCD source WACC/g sensitivity grid matches without releasing common allocation',()=>{
 for(const want of read('sensitivity-v2.json').rows){const actual=calculateMcdOperating(a,{wacc:want.wacc,terminal_g:want.terminal_g});near(actual.core_operating_ev,want.core_operating_ev);near(actual.terminal_ev_fraction,want.terminal_ev_fraction);assert.equal(actual.dated_per_share_allocation,null);assertWithheld(actual);}
});

test('MCD all nine explicit allocation examples match, with June shares and no current target',()=>{
 for(const want of illustrations.results){
  const policy=illustrations.policies[want.allocation_policy],operating=calculateMcdOperating(a,want.operating_scenario),actual=allocateMcdCommon(a,operating,policy);
  near(actual.core_operating_ev,want.core_operating_ev);near(actual.conditional_june_equity_value,want.conditional_june_equity_value);near(actual.conditional_june_common_shares,want.exact_june_common_shares/1e6);near(actual.dated_per_share_allocation,want.conditional_june_allocation_per_share);assertWithheld(actual);
  near(actual.capital_bridge,actual.conditional_june_equity_value-actual.core_operating_ev);
  const unselected=allocateMcdCommon(a,actual,null);for(const k of ['allocation_policy','conditional_june_equity_value','conditional_june_common_shares','dated_per_share_allocation','capital_bridge'])assert.equal(unselected[k],null,k);
 }
 const base=calculateMcdOperating(a);for(const k of ['allocation_policy','conditional_june_equity_value','conditional_june_common_shares','dated_per_share_allocation'])assert.equal(base[k],null,k);
 compare(allocateMcdCommon(a,base),expected.results.base);
});

test('MCD explicit zero claims and operating-cash shortfalls remain deliberate assumptions, not defaults',()=>{
 const p=clone(illustrations.policies.central);for(const k of Object.keys(p.basis_amounts_USDm)){p[k]=0;p.basis_amounts_USDm[k]=0;}
 const base=calculateMcdOperating(a),zero=allocateMcdCommon(a,base,p);near(zero.conditional_june_equity_value,base.core_operating_ev+822-39863);
 p.minimum_operating_cash=1822;p.basis_amounts_USDm.minimum_operating_cash=1822;const shortfall=allocateMcdCommon(a,base,p);near(shortfall.conditional_june_equity_value,base.core_operating_ev-1000-39863);
 const huge=clone(illustrations.policies.central);huge.other_noncommon_claims=1e6;huge.basis_amounts_USDm.other_noncommon_claims=1e6;const suppressed=allocateMcdCommon(a,base,huge);assert.ok(suppressed.conditional_june_equity_value<0);assert.equal(suppressed.dated_per_share_allocation,null);assert.match(suppressed.allocation_status,/nonpositive/);
 const negative=calculateMcdOperating(a,{sga_to_systemwide_sales:Array(11).fill(1)});assert.ok(negative.terminal_fcff<0);assert.ok(negative.core_operating_ev<0);const blocked=allocateMcdCommon(a,negative,illustrations.policies.central);assert.equal(blocked.dated_per_share_allocation,null);assertWithheld(blocked);
});

test('MCD H2 deducts observed H1, not a half-year shortcut, and finance additions are an explicit H2 input',()=>{
 const c=a.scenarios.base,r=calculateMcdOperating(a).rows[0],h=a.observed_h1_2026;
 near(r.period_revenue,r.full_year_reported_revenue_proxy-h.revenue);near(r.consolidated_da,c.da[0]-h.da);near(r.cash_capex,c.cash_capex_baseline[0]+c.next_capital_support[0]-h.cash_capex);assert.equal(r.new_finance_lease_assets_as_economic_capex,c.h2_2026_finance_lease_asset_additions);
 near(r.period_core_ebit,r.full_year_core_ebit-h.core_contribution_before_other+.5*c.normal_other_expense[0]+h.restructuring_expense);
 near(r.change_in_nwc,.5*c.incremental_nwc_ratio*(r.full_year_reported_revenue_proxy+r.next_rent_relief-a.opening_2025.reported_revenue));
 const c2=clone(c);c2.new_finance_lease_assets[0]+=900;near(calculateMcdOperating(a,c2).rows[0].fcff,r.fcff);
 c2.h2_2026_finance_lease_asset_additions+=100;near(calculateMcdOperating(a,c2).rows[0].fcff,r.fcff-100);
 c2.da[0]+=100;near(calculateMcdOperating(a,c2).rows[0].fcff,r.fcff);
 c2.cash_capex_baseline[0]+=100;near(calculateMcdOperating(a,c2).rows[0].fcff,r.fcff-100);
});

test('MCD rent relief, capital support, finance assets, SBC and terminal reinvestment each enter once',()=>{
 const base=calculateMcdOperating(a),c=clone(a.scenarios.base);c.next_rent_relief[3]+=100;const relief=calculateMcdOperating(a,c);
 near(relief.rows[3].period_revenue,base.rows[3].period_revenue-100);near(relief.rows[3].period_core_ebit,base.rows[3].period_core_ebit-100);near(relief.rows[3].fcff,base.rows[3].fcff-100*(1-c.cash_tax_rate[3]));near(relief.rows[3].change_in_nwc,base.rows[3].change_in_nwc);near(relief.rows[4].change_in_nwc,base.rows[4].change_in_nwc);
 c.next_capital_support[4]+=100;const support=calculateMcdOperating(a,c);near(support.rows[4].fcff,base.rows[4].fcff-100);near(support.rows[4].cash_capex,base.rows[4].cash_capex+100);
 const t=clone(a.scenarios.base);t.next_rent_relief[10]+=100;const terminalRelief=calculateMcdOperating(a,t);near(terminalRelief.terminal_nopat,base.terminal_nopat);near(terminalRelief.terminal_fcff,base.terminal_fcff);
 const last=base.rows[10];near(base.terminal_nopat,(last.full_year_core_ebit+last.next_rent_relief)*(1+t.terminal_g)*(1-t.cash_tax_rate[10]));near(base.terminal_reinvestment,base.terminal_nopat*t.terminal_g/t.terminal_roic);near(base.terminal_fcff,base.terminal_nopat-base.terminal_reinvestment);
 near(base.terminal.margin,last.full_year_core_ebit_without_next_relief/last.full_year_reported_revenue_proxy);
 const sga=clone(a.scenarios.base);sga.sga_to_systemwide_sales[2]+=.001;const charged=calculateMcdOperating(a,sga);near(charged.rows[2].fcff,base.rows[2].fcff-base.rows[2].systemwide_sales*.001*(1-sga.cash_tax_rate[2]));
 assert.equal(base.terminal_year,2037);assert.ok(base.rows[10].next_capital_support_full_year>0);assert.ok(base.rows[10].next_rent_relief>0);
});

test('MCD restaurant-count illustration is not multiplied into franchise sales a second time',()=>{
 const base=calculateMcdOperating(a),c=clone(a.scenarios.base);c.restaurant_count_growth[0]+=.02;const changed=calculateMcdOperating(a,c);
 near(changed.rows[0].franchisee_sales,base.rows[0].franchisee_sales);near(changed.rows[0].royalty_revenue,base.rows[0].royalty_revenue);near(changed.rows[0].gross_rent_revenue,base.rows[0].gross_rent_revenue);assert.ok(changed.rows[0].restaurant_count_illustration>base.rows[0].restaurant_count_illustration);near(changed.rows[0].initial_fees-base.rows[0].initial_fees,a.opening_2025.initial_fees*.02);
});

test('MCD entered annual edits preserve the H2 period, recompute NWC and expose investment adjustments',()=>{
 const base=calculateMcdOperating(a),annual=Array.from({length:11},()=>({}));annual[0].reinvestment=base.rows[0].reinvestment+100;let changed=calculateMcdOperating(a,'base',{annual});near(changed.core_operating_ev,base.core_operating_ev-100/(1+.08)**.5);near(changed.rows[0].analyst_net_investment_adjustment,100);near(changed.rows[0].cash_capex,base.rows[0].cash_capex);
 annual[0]={revenue:base.rows[0].revenue+100};changed=calculateMcdOperating(a,'base',{annual});near(changed.rows[0].full_year_reported_revenue_proxy,base.rows[0].full_year_reported_revenue_proxy+100);near(changed.rows[0].change_in_nwc,base.rows[0].change_in_nwc+100*.03*.5);near(changed.rows[1].change_in_nwc,base.rows[1].change_in_nwc-100*.03);near(changed.rows[0].analyst_revenue_adjustment,100);
 annual[0]={margin:.4,taxRate:.3};changed=calculateMcdOperating(a,'base',{annual});near(changed.rows[0].period_core_ebit,base.rows[0].revenue*.4);near(changed.rows[0].nopat,base.rows[0].revenue*.4*.7);assert.equal(changed.rows[0].cashflow_period,'2026-H2');
 const negative=Array.from({length:11},()=>({}));negative[0].margin=-.1;const loss=calculateMcdOperating(a,'base',{annual:negative});near(loss.rows[0].nopat,loss.rows[0].period_core_ebit*(1-.22));assert.ok(loss.rows[0].nopat<0);
 const floor=base.rows[0].new_finance_lease_assets_as_economic_capex+base.rows[0].change_in_nwc-base.rows[0].consolidated_da;const minimum=Array.from({length:11},()=>({}));minimum[0].reinvestment=floor;const atFloor=calculateMcdOperating(a,'base',{annual:minimum});near(atFloor.rows[0].cash_capex_after_analyst_adjustment,0);near(atFloor.rows[0].full_year_cash_capex_after_analyst_adjustment,a.observed_h1_2026.cash_capex);minimum[0].reinvestment=floor-1;assert.throws(()=>calculateMcdOperating(a,'base',{annual:minimum}),/negative cash capex/);
});

test('MCD varying annual WACC compounds half a year first, then one year, including terminal PV',()=>{
 const annual=mcdSourceSchedule(a);annual.forEach((r,i)=>r.wacc=.07+i*.001);const x=calculateMcdOperating(a,'base',{annual,terminal:{wacc:.09}});let divisor=1;
 for(const [i,r]of x.rows.entries()){divisor*=(1+annual[i].wacc)**(i===0?.5:1);near(r.discount_factor,1/divisor);near(r.pv_fcff,r.fcff/divisor);}
 near(x.terminal_pv,x.terminal_value_at_2036_end/divisor);near(x.terminal_value_at_2036_end,x.terminal_fcff/(.09-.025));
 const base=calculateMcdOperating(a),edited=calculateMcdOperating(a,'base',{terminal:{margin:.5,taxRate:.25,growth:.03,roic:.2,wacc:.09}});near(edited.terminal_nopat,base.rows[10].revenue*1.03*.5*.75);near(edited.terminal_reinvestment_rate,.15);near(edited.explicit_period_pv,base.explicit_period_pv);
});

test('MCD every numeric input rejects null, coercion, Boolean, NaN and infinity',()=>{
 for(const path of numericLeaves(a))for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const copy=clone(a);let cursor=copy;for(const k of path.slice(0,-1))cursor=cursor[k];cursor[path.at(-1)]=bad;assert.throws(()=>validateMcdInputs(copy),withholding,path.join('.'));}
});

test('MCD source schemas, frozen facts, dates, units and dense annual arrays fail closed',()=>{
 for(const path of [[],['opening_2025'],['observed_h1_2026'],['capital_known_june'],['scenarios'],['scenarios','base'],['policies']]){const copy=clone(a);let cursor=copy;for(const k of path)cursor=cursor[k];cursor.newBorrowing=1;assert.throws(()=>validateMcdInputs(copy),/unknown keys/);delete cursor.newBorrowing;delete cursor[Object.keys(cursor)[0]];assert.throws(()=>validateMcdInputs(copy),/missing keys/);}
 for(const mutate of [x=>x.ticker='OTHER',x=>x.version=1,x=>x.valuation_anchor='2026-10-19',x=>x.information_cutoff='2026-10-20',x=>x.units='EUR millions',x=>x.forecast_years[0]=2025,x=>x.capital_known_june.cash++,x=>x.capital_known_june.debt++,x=>x.capital_known_june.common_shares_exact+=.1,x=>x.capital_known_june.common_shares_exact=712300000,x=>x.opening_2025.reported_revenue++,x=>x.observed_h1_2026.cash_capex++,x=>x.capital_known_june.source='https://example.com/']){const copy=clone(a);mutate(copy);assert.throws(()=>validateMcdInputs(copy),withholding);}
 for(const bad of [[],Array(11),Array(10).fill(0),Array(12).fill(0)]){const copy=clone(a);copy.scenarios.base.comp_growth=bad;assert.throws(()=>validateMcdInputs(copy),withholding);}
 const sparse=Array(11).fill(0);delete sparse[5];sparse.extra=0;const copy=clone(a);copy.scenarios.base.comp_growth=sparse;assert.throws(()=>validateMcdInputs(copy),withholding);
 for(const bad of ['missing','constructor','toString',null,[],true,0])assert.throws(()=>calculateMcdOperating(a,bad),withholding);
 assert.throws(()=>calculateMcdOperating(a,'base',{newBorrowing:100}),/unknown keys/);
 assert.throws(()=>calculateMcdOperating(a,{newBorrowing:100}),/unknown keys/);
});

test('MCD all source bounds and observed-H1 guards apply before any entered schedule',()=>{
 const mutations=[c=>c.wacc=.009,c=>c.wacc=.301,c=>c.terminal_g=-.01,c=>c.terminal_g=.061,c=>c.terminal_g=c.wacc,c=>c.terminal_roic=c.terminal_g,c=>c.incremental_nwc_ratio=-.01,c=>c.comp_growth[0]=-.501,c=>c.unit_sales_contribution_affiliate[4]=.501,c=>c.cash_tax_rate[0]=1.01,c=>c.company_restaurant_margin[0]=-.01,c=>c.sga_to_systemwide_sales[0]=1.01,c=>c.cash_capex_baseline[0]=1515,c=>c.da[0]=1130,c=>c.restructuring_expense[0]=97,c=>c.h2_2026_finance_lease_asset_additions=-1,c=>c.other_profit_growth=.501,c=>c.rent_rate_shift=.051,c=>c.royalty_rate_shift=.031,c=>c.next_rent_relief[0]=100000];
 for(const mutate of mutations){const c=clone(a.scenarios.base);mutate(c);assert.throws(()=>calculateMcdOperating(a,c),withholding);assert.throws(()=>calculateMcdOperating(a,c,{annual:mcdSourceSchedule(a)}),withholding);}
 const low=clone(a.scenarios.base);low.comp_growth[0]=-.5;low.unit_sales_contribution_conventional[0]=-.5;low.unit_sales_contribution_developmental[0]=-.5;low.unit_sales_contribution_affiliate[0]=-.5;low.company_sales_growth[0]=-.5;assert.throws(()=>calculateMcdOperating(a,low),/below observed H1/);
});

test('MCD entered annual and terminal controls reject missing rows, unknown fields and invalid numbers',()=>{
 for(const bad of [null,[],Array(11),Array(10).fill({}),Array(12).fill({})])assert.throws(()=>calculateMcdOperating(a,'base',{annual:bad}),withholding);
 for(const field of ['revenue','margin','taxRate','reinvestment','wacc'])for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const annual=Array.from({length:11},()=>({}));annual[2][field]=bad;assert.throws(()=>calculateMcdOperating(a,'base',{annual}),withholding);}
 for(const [field,value]of [['revenue',0],['revenue',-1],['taxRate',-.01],['taxRate',1.01],['wacc',.009],['wacc',.301],['reinvestment',-1e6],['sbc_addback',100],['finance_lease_principal',10],['equity_earnings',10]]){const annual=Array.from({length:11},()=>({}));annual[0][field]=value;assert.throws(()=>calculateMcdOperating(a,'base',{annual}),withholding);}
 for(const field of ['growth','margin','taxRate','roic','wacc'])for(const bad of [null,true,'0',NaN,Infinity,-Infinity])assert.throws(()=>calculateMcdOperating(a,'base',{terminal:{[field]:bad}}),withholding);
 for(const terminal of [null,[],{growth:.08},{growth:-.01},{growth:.061},{roic:.025},{wacc:.025},{taxRate:1.01},{newBorrowing:1}])assert.throws(()=>calculateMcdOperating(a,'base',{terminal}),withholding);
});

test('MCD allocation is blocked for incomplete templates, missing scope flags, stale basis or unknown claims',()=>{
 const base=calculateMcdOperating(a);assert.equal(validateMcdPolicy(null),false);assert.throws(()=>allocateMcdCommon(a,base,read('allocation-policy-template-v2.json')),withholding);
 for(const k of Object.keys(illustrations.policies.central)){const p=clone(illustrations.policies.central);delete p[k];if(k==='basis_amounts_USDm'){assert.equal(validateMcdPolicy(p),true);}else assert.throws(()=>allocateMcdCommon(a,base,p),withholding,k);}
 for(const k of Object.keys(MCD_ALLOCATION_SCOPE_FLAGS))for(const bad of [false,null,1,'true']){const p=clone(illustrations.policies.central);p[k]=bad;assert.throws(()=>allocateMcdCommon(a,base,p),withholding,k);}
 for(const k of Object.keys(illustrations.policies.central.basis_amounts_USDm))for(const bad of [null,true,'0',NaN,Infinity,-Infinity,-1]){const p=clone(illustrations.policies.central);p[k]=bad;assert.throws(()=>allocateMcdCommon(a,base,p),withholding,k);}
 for(const [k,v]of [['operating_lease_claim',12488],['real_estate_value',28479],['future_buyback_reduction',.03],['market_price',300],['current_target',300]]){const p=clone(illustrations.policies.central);p[k]=v;assert.throws(()=>allocateMcdCommon(a,base,p),withholding,k);}
 const stale=clone(illustrations.policies.central);stale.minimum_operating_cash++;assert.throws(()=>allocateMcdCommon(a,base,stale),/basis amount/);
 const noBasis=clone(illustrations.policies.central);noBasis.basis='assumed';assert.throws(()=>allocateMcdCommon(a,base,noBasis),/basis/);
 for(const [k,v]of [['current_target',300],['current_upside',.1],['valuation_anchor','2026-10-19'],['currency','EUR'],['core_operating_ev',0]]){const fake=clone(base);fake[k]=v;assert.throws(()=>allocateMcdCommon(a,fake,illustrations.policies.central),withholding,k);}
});

test('MCD public functions are pure and return fresh results and policy snapshots',()=>{
 const input=clone(a),p=clone(illustrations.policies.central),annual=mcdSourceSchedule(input),options={annual,terminal:{growth:.02}},saved=clone({input,p,options});
 const op=calculateMcdOperating(input,'base',options),allocated=allocateMcdCommon(input,op,p),other=allocateMcdCommon(input,op,null);
 assert.deepEqual({input,p,options},saved);assert.equal(op.dated_per_share_allocation,null);assert.notEqual(allocated,op);assert.notEqual(allocated.rows,op.rows);assert.notEqual(other.rows,op.rows);
 allocated.allocation_policy.minimum_operating_cash=9;allocated.rows[0].revenue=1;assert.equal(p.minimum_operating_cash,800);assert.notEqual(op.rows[0].revenue,1);
 const s=mcdSourceSchedule(input);s[0].revenue=1;assert.notEqual(mcdSourceSchedule(input)[0].revenue,1);
 assert.throws(()=>calculateMcdOperating(input,'base',{annual:Array.from({length:11},()=>({wacc:Infinity}))}),withholding);assert.deepEqual({input,p,options},saved);
});
