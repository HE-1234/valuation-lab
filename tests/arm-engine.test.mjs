import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateArm,validateArmInputs,evaluateArmSchedule,armSourceComponents} from '../dist/arm-financial-engine.js';
const fixture=new URL('../dist/data/incremental-ARM-2026-10-19-v2/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,fixture),'utf8'));
const a=read('dcf-inputs-v2.json'),clone=x=>structuredClone(x);
const near=(x,y,p='value')=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-11),`${p}: ${x} != ${y}`);
function compare(x,y,p='result'){if(typeof y==='number')return near(x,y,p);if(y===null||typeof y!=='object')return assert.equal(x,y,p);for(const k of Object.keys(y))compare(x[k],y[k],p+'.'+k);}
function schedule(name='base'){
 const s=a.cases[name],raw=calculateArm(a,s),components=armSourceComponents(a,s);
 return {s,annual:components.map((r,i)=>{const {netCapexRatio,...rest}=r;return {...rest,reinvestment:raw.rows[i].reinvestment};}),terminal:{growth:s.terminal_growth,margin:raw.rows[9].ebit_margin,taxRate:s.tax_rate,roic:s.terminal_roic,wacc:s.wacc}};
}
test('ARM independent Python replay agrees across every saved baseline output field',()=>{
 const expected=read('dcf-output-v2.json');
 for(const [name,o]of Object.entries(expected)){const result=calculateArm(a,name);compare(result,o,name);const x=schedule(name);compare(evaluateArmSchedule(a,x.s,x.annual,x.terminal),o,name+' strict schedule');assert.equal(result.current_valuation_eligible,false);assert.equal(result.historical_backtest_eligible,false);assert.equal(result.ranking_eligible,false);}
 near(calculateArm(a,'bear').value_per_ads,8.4751190542);near(calculateArm(a,'base').value_per_ads,25.4633018266);near(calculateArm(a,'bull').value_per_ads,62.4226973025);
});
test('ARM source sensitivities reject incompatible capital without clipping',()=>{
 const expected=read('sensitivities-v2.json');
 for(const x of expected.wacc_growth){if(x.status==='invalid_assumptions')assert.throws(()=>calculateArm(a,'base',{wacc:x.wacc,g:x.g}),/floor/);else near(calculateArm(a,'base',{wacc:x.wacc,g:x.g}).value_per_ads,x.value_per_ads);}
 for(const [change,name]of [[-.05,'sbc_margin_cost_5pp'],[-.1,'sbc_margin_cost_10pp'],[.05,'sbc_margin_relief_5pp']]){const c=clone(a.cases.base);c.ip_ebit_margin=c.ip_ebit_margin.map(v=>v+change);c.silicon_ebit_margin=c.silicon_ebit_margin.map(v=>v+change);const expectedCell=expected.sbc_economic_margin.find(x=>x.name===name);if(expectedCell.status==='invalid_assumptions')assert.throws(()=>calculateArm(a,c),/floor/);else near(calculateArm(a,c).value_per_ads,expectedCell.value_per_ads);}
 const c=clone(a.cases.base);c.net_capex_ratio[0]=0;assert.throws(()=>calculateArm(a,c),/FY2027/);
 c.net_capex_ratio[0]=.075;c.terminal_roic=.3;assert.throws(()=>calculateArm(a,c),/floor/);
 for(const floor of ['net_capex_floor_total','net_capex_floor_ip','net_capex_floor_silicon']){const x=clone(a.cases.base);x[floor]=0;assert.throws(()=>calculateArm(a,x),/bounds/);}
});
function* numericLeaves(x,p=[]){if(x&&typeof x==='object')for(const k of Object.keys(x))yield*numericLeaves(x[k],[...p,k]);else if(typeof x==='number')yield p;}
test('ARM every numeric leaf rejects null, booleans, strings and nonfinite values without input mutation',()=>{
 for(const p of numericLeaves(a))for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const x=clone(a);let t=x;for(const k of p.slice(0,-1))t=t[k];t[p.at(-1)]=bad;assert.throws(()=>validateArmInputs(x),undefined,p.join('.'));}
 const before=clone(a);for(const name of Object.keys(a.cases))calculateArm(a,name);assert.deepEqual(a,before);
});
test('ARM exact schema rejects missing and unknown keys, malformed schedules and alternate security basis',()=>{
 for(const path of [[],['capital'],['revenue'],['cases'],['cases','base']]){const x=clone(a);let t=x;for(const k of path)t=t[k];t.newBorrowing=1;assert.throws(()=>validateArmInputs(x),/unknown keys/);delete t.newBorrowing;delete t[Object.keys(t)[0]];assert.throws(()=>validateArmInputs(x),/missing keys/);}
 for(const bad of [[],[.1],Array(10)]){const x=clone(a);x.cases.base.royalty_growth=bad;assert.throws(()=>validateArmInputs(x));}
 for(const [key,value]of [['ads_per_ordinary',2],['unquoted_equity_included',96],['ordinary_shares',0]]){const x=clone(a);x.capital[key]=value;assert.throws(()=>validateArmInputs(x));}
 for(const [key,value]of [['wacc',.03],['terminal_roic',.03],['equity_issuance_fee',1],['funding_debt_capacity_multiple',11],['emergency_equity_price_per_ads',0]]){const x=clone(a.cases.base);x[key]=value;assert.throws(()=>calculateArm(a,x));}
 assert.throws(()=>calculateArm(a,'base',{unsupported:true}),/unknown override/);assert.throws(()=>calculateArm(a,'missing'),/unknown scenario/);
});
test('ARM final component convergence explicitly rejects zero-to-positive silicon, including tiny values',()=>{
 for(const positive of [3193,1e-12]){const c=clone(a.cases.base);c.silicon_revenue[8]=0;c.silicon_revenue[9]=positive;c.silicon_marginal_nwc=0;assert.throws(()=>calculateArm(a,c),/zero-base/);}
 const c=clone(a.cases.base);c.silicon_revenue.fill(0);assert.equal(calculateArm(a,c).rows[9].silicon,0);
 const x=schedule();x.annual[8].silicon=0;x.annual[9].silicon=1e-12;assert.throws(()=>evaluateArmSchedule(a,x.s,x.annual,x.terminal),/zero-base/);
 assert.throws(()=>calculateArm(a,'base',{g:0}),/floor|working capital/);
});
test('ARM strict post-transition edits preserve endpoint investment instead of silently normalizing it',()=>{
 let x=schedule();x.annual[0].reinvestment=0;assert.throws(()=>evaluateArmSchedule(a,x.s,x.annual,x.terminal),/floor/);
 x=schedule();x.annual[9].reinvestment+=1;assert.throws(()=>evaluateArmSchedule(a,x.s,x.annual,x.terminal),e=>e.enterprise===null&&e.perShare===null&&/final-year reinvestment/.test(e.message));
 x=schedule();x.terminal.margin+=.01;assert.throws(()=>evaluateArmSchedule(a,x.s,x.annual,x.terminal),/margin and tax/);
 x=schedule();x.annual[0].unsupported=1;assert.throws(()=>evaluateArmSchedule(a,x.s,x.annual,x.terminal),/unknown keys/);
 x=schedule();x.annual[0].reinvestment+=20;const op=evaluateArmSchedule(a,x.s,x.annual,x.terminal);near(op.enterprise_value,calculateArm(a,'base').enterprise_value-20/(1+x.s.wacc),'explicit investment PV');assert.equal(op.rows[0].reinvestment,x.annual[0].reinvestment);
});
test('ARM dynamic funding, fees, debt and dilution remain diagnostic and funded headlines are null',()=>{
 const c=clone(a.cases.bear);c.ip_ebit_margin=c.ip_ebit_margin.map((v,i)=>i<4?-.35:v);c.funding_debt_capacity_multiple=0;
 const out=calculateArm(a,c);compare(out,read('sensitivities-v2.json').funding_stress,'funding stress');assert.ok(out.rows.some(r=>r.new_equity_gross>0));assert.equal(out.value_per_ads,null);assert.equal(out.headline_enterprise,null);assert.equal(out.headline_equity,null);assert.equal(out.headline_per_ads,null);
 const debtCase=clone(a.cases.base);debtCase.net_capex_ratio[0]=.8;debtCase.net_capex_ratio[1]=.8;const debt=calculateArm(a,debtCase);assert.ok(debt.rows.some(r=>r.new_debt>0));assert.ok(debt.rows.some(r=>r.interest>0));assert.ok(debt.rows.some(r=>r.new_equity_gross>0));
 near(debt.equity_value,debt.enterprise_value+debt.bridge-debt.pv_funding_fees,'future debt not double deducted');near(debt.funding_dilution_diagnostic,debt.equity_value/debt.rows[9].shares_end,'illustrative denominator');
 for(const r of debt.rows){near(r.fcff,r.nopat-r.reinvestment,'FCFF');assert.ok(r.cash_end>=r.cash_floor-1e-8);assert.ok(r.net_capex>=r.net_capex_floor-1e-8);}
 const x=clone(a);x.capital.acquisition_reserve=4000;assert.equal(calculateArm(x,'base').funding_required,true);assert.equal(calculateArm(x,'base').headline_per_ads,null);
});
async function adapter(){
 const {incrementalRecord}=await import('../dist/incremental-registry.js');
 const {incrementalResearchDraft,incrementalAlternative}=await import('../dist/incremental-research.js');
 const model=await import('../dist/arm-research-model.js');const r=incrementalRecord('ARM');assert.ok(r,'ARM package is wired');
 const draft=()=>incrementalResearchDraft({ticker:'ARM',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
 return {r,draft,incrementalAlternative,...model};
}
test('ARM adapter independently matches each named source case and dated ADS allocation',async()=>{
 const {r,draft,incrementalAlternative,calculateArmOperating,calculateArmBridge}=await adapter();
 for(const c of [{name:null,annualCase:r.annualCase},...r.alternatives]){const d=c.name?incrementalAlternative(draft(),c.name).draft:draft(),source=calculateArm(a,c.annualCase.sourceScenario),op=calculateArmOperating(d),b=calculateArmBridge(d,op.enterprise);near(op.enterprise,source.enterprise_value);near(b.equity,source.equity_value);near(b.perShare,source.value_per_ads);assert.equal(b.allocationShares,1064.055252);assert.equal(b.adsPerOrdinary,1);assert.equal(b.priceComparisonEligible,false);assert.equal(b.asKnownBacktestEligible,false);near(op.terminal.fcffGrowth,d.terminal.growth);}
});
test('ARM adapter reprices reserves once, exposes fixed segment mapping and rejects stale operating values',async()=>{
 const {draft,calculateArmOperating:operating,calculateArmBridge:bridge}=await adapter();const d=draft(),base=operating(d),baseBridge=bridge(d,base.enterprise);
 d.bridgeInputs.acquisitionReserve+=100;let op=operating(d),b=bridge(d,op.enterprise);near(op.enterprise,base.enterprise);near(b.equity,baseBridge.equity-100);near(op.rows[0].cash_end,base.rows[0].cash_end-100);
 d.bridgeInputs.minimumOperatingCash+=100;op=operating(d);b=bridge(d,op.enterprise);near(b.equity,baseBridge.equity-200);near(op.rows[0].cash_end,base.rows[0].cash_end-200);
 const edited=draft();edited.annual[0].revenue*=1.01;op=operating(edited);assert.notEqual(op.enterprise,base.enterprise);near(op.rows[0].royalty/op.rows[0].revenue,base.rows[0].royalty/base.rows[0].revenue);assert.match(op.segmentMapping,/not a calibrated/);assert.throws(()=>bridge(edited,base.enterprise),/must match/);
});
test('ARM adapter invalid controls, identity, endpoints and funding suppress all valuation headlines',async()=>{
 const {r,draft,calculateArmOperating:operating,calculateArmBridge:bridge}=await adapter();
 for(const f of r.bridge.options)for(const bad of [null,true,'0',NaN,Infinity,-Infinity,f.min-1,f.max+1]){const d=draft();d.bridgeInputs[f.key]=bad;assert.throws(()=>operating(d),undefined,f.key);}
 for(const mutate of [d=>{d.annual[0].reinvestment=0;},d=>{d.annual[9].reinvestment+=1;},d=>{d.annual[9].revenue*=1.01;},d=>{d.terminal.margin+=.01;},d=>{d.discountOrigin='2026-10-19';},d=>{d.anchor.revenue+=1;},d=>{d.timing.mode='as-of-scenario';},d=>{d.newBorrowing=100;},d=>{d.annual[0].newBorrowing=100;},d=>{d.terminal.newBorrowing=100;}]){const d=draft();mutate(d);assert.throws(()=>operating(d),e=>e.enterprise===null&&e.equity===null&&e.perShare===null);}
 const d=draft(),base=operating(d);d.annual.slice(0,4).forEach(row=>{row.margin=-.35;});assert.throws(()=>operating(d),e=>e.status==='unsupported_funding_gap'&&e.enterprise===null&&e.equity===null&&e.perShare===null&&e.fundingDiagnostics.value_per_ads===null);assert.throws(()=>bridge(d,base.enterprise));
});
