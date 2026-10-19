import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateKeys,validateKeysInputs,evaluateKeysSchedule,keysSourceComponents} from '../dist/keys-financial-engine.js';
const fixture=new URL('../dist/data/incremental-KEYS-2026-10-19-v1/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,fixture),'utf8'));
const a=read('dcf-inputs-v1.json'),clone=x=>structuredClone(x);
const near=(x,y,p='value')=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-11),`${p}: ${x} != ${y}`);
function compare(x,y,p='result'){if(typeof y==='number')return near(x,y,p);if(y===null||typeof y!=='object')return assert.equal(x,y,p);for(const k of Object.keys(y))compare(x[k],y[k],p+'.'+k);}
function schedule(name='base'){
 const s=a.cases[name],raw=calculateKeys(a,s);
 return {s,annual:keysSourceComponents(a,s).map((r,i)=>({...r,reinvestment:raw.rows[i].reinvestment})),terminal:{growth:s.g,margin:s.margin[9],taxRate:s.tax,roic:s.terminal_roic,wacc:s.wacc}};
}
test('KEYS every scalar and all 30 rows match source and independently recomputed audit',()=>{
 const expected=read('dcf-output-v1.json'),independent=read('independent-audit-v2/independent-recomputed-model.json');
 for(const [name,o]of Object.entries(expected)){const result=calculateKeys(a,name);compare(result,o,name);compare(result,independent[name],name+' independent');const x=schedule(name);compare(evaluateKeysSchedule(a,x.s,x.annual,x.terminal),o,name+' strict schedule');assert.equal(result.current_valuation_eligible,false);assert.equal(result.historical_backtest_eligible,false);assert.equal(result.ranking_eligible,false);near(result.capital_bridge,-567.56);near(result.rows.reduce((sum,r)=>sum+r.debt_repayment,0),2550);}
 assert.deepEqual(['bear','base','bull'].map(n=>calculateKeys(a,n).conditional_value_per_share.toFixed(2)),['37.33','129.14','251.28']);
});
test('KEYS source sensitivity grid, margin shocks, share stress and floating coupon reproduce',()=>{
 const expected=read('sensitivities-v1.json');
 for(const x of expected.wacc_g){const actual=calculateKeys(a,'base',{wacc:x.wacc,g:x.g});near(actual.conditional_value_per_share,x.value);near(actual.terminal_share,x.terminal_share);}
 for(const x of expected.margin){const c=clone(a.cases.base);c.margin=c.margin.map(v=>v+x.margin_delta);near(calculateKeys(a,c).conditional_value_per_share,x.value);}
 const shares=clone(a);shares.capital.shares*=1.03;near(calculateKeys(shares,'base').conditional_value_per_share,expected.three_percent_extra_share_claim_diagnostic);
 const floating=clone(a);floating.debt_schedule[3].coupon+=.02;const stressed=calculateKeys(floating,'base');near(stressed.enterprise_value,calculateKeys(a,'base').enterprise_value,'coupon only affects treasury');near(Math.min(...stressed.rows.map(r=>r.cash_end-r.cash_floor)),expected.floating_rate_plus_200bp.minimum_cash_headroom);
});
function* leaves(x,p=[],type='number'){if(x&&typeof x==='object')for(const k of Object.keys(x))yield*leaves(x[k],[...p,k],type);else if(typeof x===type)yield p;}
test('KEYS every numeric leaf rejects null, strings, Boolean, NaN and infinities without mutation',()=>{
 for(const p of leaves(a))for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const x=clone(a);let t=x;for(const k of p.slice(0,-1))t=t[k];t[p.at(-1)]=bad;assert.throws(()=>validateKeysInputs(x),e=>e.enterprise===null&&e.equity===null&&e.perShare===null,p.join('.'));}
 const before=clone(a);for(const name of Object.keys(a.cases))calculateKeys(a,name);assert.deepEqual(a,before);
});
test('KEYS exact schemas, maturity buckets, fixed exclusions and named identities are strict',()=>{
 for(const path of [[],['capital'],['revenue'],['cases'],['cases','base'],['debt_schedule','0']]){const x=clone(a);let t=x;for(const k of path)t=t[k];t.newBorrowing=1;assert.throws(()=>validateKeysInputs(x),/unknown keys/);delete t.newBorrowing;delete t[Object.keys(t)[0]];assert.throws(()=>validateKeysInputs(x),/missing keys/);}
 for(const bad of [[],[.1],Array(10),Array(11).fill(.1)]){const x=clone(a);x.cases.base.csg_growth=bad;assert.throws(()=>validateKeysInputs(x));}
 for(const [key,value]of [['restricted_cash_included',17],['restricted_cash_included',1e-12],['long_term_investments_included',188],['shares',0],['debt_face',2551],['unrestricted_cash',-1]]){const x=clone(a);x.capital[key]=value;assert.throws(()=>validateKeysInputs(x));}
 for(const [key,value]of [['year',1.1],['year',2],['maturity','2027-04-07'],['coupon',.51],['principal',-1]]){const x=clone(a);x.debt_schedule[0][key]=value;assert.throws(()=>validateKeysInputs(x));}
 for(const [key,value]of [['ticker','ARM'],['valuation_anchor','2026-10-19'],['share_date','2026-07-31'],['information_cutoff','2026-10-18'],['units','EUR millions']]){const x=clone(a);x[key]=value;assert.throws(()=>validateKeysInputs(x));}
 for(const name of ['missing','toString','constructor'])assert.throws(()=>calculateKeys(a,name),/unknown scenario/);
 assert.throws(()=>calculateKeys(a,'base',{unsupported:1}),/unknown override/);assert.throws(()=>calculateKeys(null));assert.throws(()=>calculateKeys(a,[]));
 for(const bad of [null,undefined,[],{}]){assert.throws(()=>keysSourceComponents(a,bad),e=>e.enterprise===null&&e.perShare===null);const x=schedule();assert.throws(()=>evaluateKeysSchedule(a,bad,x.annual,x.terminal),e=>e.enterprise===null&&e.perShare===null);}
});
test('KEYS source scenario domains and terminal economics reject unsupported edits',()=>{
 for(const [key,value]of [['wacc',.03],['terminal_roic',.03],['g',.07],['tax',-.01],['equity_fee',1],['equity_issue_price',0],['emergency_debt_capacity',-1],['emergency_interest',.51],['csg_growth',Array(10).fill(-1)],['eisg_growth',Array(10).fill(3)],['capex_ratio',Array(10).fill(.001)],['margin',Array(10).fill(-.1)]]){const c=clone(a.cases.base);c[key]=value;assert.throws(()=>calculateKeys(a,c),undefined,key);}
 const excessive=clone(a.cases.base);excessive.capex_ratio.fill(1);excessive.acquisition_reinvestment_ratio.fill(1);assert.throws(()=>calculateKeys(a,excessive),/consumes all/);
 const converge=clone(a.cases.base);converge.eisg_growth[9]=.04;assert.throws(()=>calculateKeys(a,converge),/converge/);
});
test('KEYS distinct operating and phased ROIC floors preserve bear and strict final investment',()=>{
 const bear=calculateKeys(a,'bear'),base=calculateKeys(a,'base');assert.equal(bear.rows[0].reinvestment,0);assert.ok(bear.terminal_operating_floor>bear.terminal_roic_floor);near(bear.terminal_reinvestment,bear.terminal_operating_floor);near(base.terminal_reinvestment,base.terminal_roic_floor);assert.ok(bear.terminal_implied_reinvestment_roic<a.cases.bear.terminal_roic);
 let x=schedule();x.annual[0].reinvestment=0;assert.throws(()=>evaluateKeysSchedule(a,x.s,x.annual,x.terminal),/floor/);
 x=schedule();x.annual[9].reinvestment+=1;assert.throws(()=>evaluateKeysSchedule(a,x.s,x.annual,x.terminal),/final-year/);
 x=schedule('bear');x.annual[9].reinvestment=calculateKeys(a,'bear').rows[9].nopat*x.terminal.growth/x.terminal.roic;assert.throws(()=>evaluateKeysSchedule(a,x.s,x.annual,x.terminal),/floor/);
 x=schedule();x.annual[0].reinvestment+=20;const o=evaluateKeysSchedule(a,x.s,x.annual,x.terminal);near(o.enterprise_value,base.enterprise_value-20/(1+x.s.wacc));near(o.rows[0].cash_end,base.rows[0].cash_end-20);assert.equal(o.rows[0].reinvestment,x.annual[0].reinvestment);
 for(const field of ['margin','taxRate','wacc']){x=schedule();x.terminal[field]+=.01;assert.throws(()=>evaluateKeysSchedule(a,x.s,x.annual,x.terminal),/match/);}
 x=schedule();x.annual[9].csg*=1.01;assert.throws(()=>evaluateKeysSchedule(a,x.s,x.annual,x.terminal),/converge/);
 x=schedule();x.annual[0].newBorrowing=100;assert.throws(()=>evaluateKeysSchedule(a,x.s,x.annual,x.terminal),/unknown keys/);
 for(const field of ['csg','eisg','margin','taxRate','wacc','reinvestment'])for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){x=schedule();x.annual[0][field]=bad;assert.throws(()=>evaluateKeysSchedule(a,x.s,x.annual,x.terminal));}
});
test('KEYS debt and equity funding stresses match source while all headlines stay withheld',()=>{
 const expected=read('sensitivities-v1.json');
 for(const capacity of [0,750]){const c=clone(a.cases.base);c.margin.splice(0,3,-.35,-.25,-.15);c.emergency_debt_capacity=capacity;const o=calculateKeys(a,c);compare(o,expected[capacity?'debt_and_equity_funding_stress':'funding_stress']);assert.equal(o.funding_required,true);for(const key of ['conditional_value_per_share','headline_enterprise','headline_equity','headline_per_share'])assert.equal(o[key],null,key);assert.ok(o.rows[9].shares_end>a.capital.shares);assert.ok(o.pv_funding_fees>0);assert.ok(o.rows.reduce((sum,r)=>sum+r.new_debt,0)<=capacity+1e-8);if(capacity)assert.ok(o.rows[1].interest>expected.funding_stress.rows[1].interest);near(o.equity_value,o.enterprise_value+o.capital_bridge-o.pv_funding_fees,'no duplicate future borrowing claim');near(o.funding_dilution_diagnostic_only,Math.max(0,o.equity_value)/o.rows[9].shares_end);for(const r of o.rows){near(r.fcff,r.nopat-r.reinvestment);assert.ok(r.cash_end>=r.cash_floor-1e-8);}}
 const opening=clone(a);opening.capital.pension_reserve=2500;const o=calculateKeys(opening);assert.ok(o.opening_funding_gap>0);assert.equal(o.headline_per_share,null);
});
async function adapter(){
 const {incrementalRecord}=await import('../dist/incremental-registry.js');
 const {incrementalResearchDraft,incrementalAlternative}=await import('../dist/incremental-research.js');
 const model=await import('../dist/keys-research-model.js');const r=incrementalRecord('KEYS');assert.ok(r,'KEYS package is wired');
 const draft=()=>incrementalResearchDraft({ticker:'KEYS',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
 return {r,draft,incrementalAlternative,...model};
}
test('KEYS adapter named cases match replay with exact common shares and rolling periods',async()=>{
 const {r,draft,incrementalAlternative,calculateKeysOperating,calculateKeysBridge,calculateKeysSensitivity}=await adapter();
 for(const c of [{name:null,annualCase:r.annualCase},...r.alternatives]){const d=c.name?incrementalAlternative(draft(),c.name).draft:draft(),source=calculateKeys(a,c.annualCase.sourceScenario),op=calculateKeysOperating(d),b=calculateKeysBridge(d,op.enterprise);near(op.enterprise,source.enterprise_value);near(b.equity,source.equity_value);near(b.perShare,source.conditional_value_per_share);assert.equal(b.allocationShares,170.244745);assert.equal(b.shareReferenceDate,'2026-08-27');assert.equal(b.capitalReferenceDate,'2026-07-31');assert.equal(b.priceComparisonEligible,false);assert.equal(b.asKnownBacktestEligible,false);assert.equal(b.currentValuationEligible,false);assert.equal(b.rankingEligible,false);near(op.terminal.fcffGrowth,d.terminal.growth);assert.equal(op.rows[0].period_end,'2027-07-31');assert.equal(op.rows[0].fiscal_year,undefined);assert.equal(calculateKeysSensitivity(d).normalizationDelta,0);}
});
test('KEYS adapter reprices claims once and edited operating cash is not duplicated in FCFF',async()=>{
 const {draft,calculateKeysOperating:operating,calculateKeysBridge:bridge}=await adapter();const d=draft(),base=operating(d),baseBridge=bridge(d,base.enterprise);
 d.bridgeInputs.pensionReserve+=100;let op=operating(d),b=bridge(d,op.enterprise);near(op.enterprise,base.enterprise);near(b.equity,baseBridge.equity-100);near(op.rows[0].cash_end,base.rows[0].cash_end-100);
 d.bridgeInputs.minimumOperatingCash+=100;op=operating(d);b=bridge(d,op.enterprise);near(op.enterprise,base.enterprise);near(b.equity,baseBridge.equity-200);near(op.rows[0].cash_end,base.rows[0].cash_end-200);
 const edited=draft();edited.annual[0].reinvestment+=20;op=operating(edited);near(op.enterprise,base.enterprise-20/(1+edited.annual[0].wacc));assert.match(op.segmentMapping,/not a calibrated/);assert.throws(()=>bridge(edited,base.enterprise),/must match/);
});
test('KEYS invalid controls, schema, schedule, identity and funded edits suppress every headline',async()=>{
 const {r,draft,calculateKeysOperating:operating,calculateKeysBridge:bridge}=await adapter();
 for(const f of r.bridge.options)for(const bad of [null,true,'0',NaN,Infinity,-Infinity,f.min-1,f.max+1]){const d=draft();d.bridgeInputs[f.key]=bad;assert.throws(()=>operating(d),e=>e.enterprise===null&&e.equity===null&&e.perShare===null,f.key);}
 for(const mutate of [d=>{d.annual[0].reinvestment=0;},d=>{d.annual[9].reinvestment+=1;},d=>{d.annual[9].revenue*=1.01;},d=>{d.terminal.margin+=.01;},d=>{d.discountOrigin='2026-10-19';},d=>{d.anchor.revenue+=1;},d=>{d.timing.mode='as-of-scenario';},d=>{d.newBorrowing=100;},d=>{d.annual[0].newBorrowing=100;},d=>{d.terminal.newBorrowing=100;},d=>{d.bridgeInputs.restricted_cash_included=17;},d=>{delete d.bridgeInputs.equityFee;},d=>{delete d.annual[0].taxRate;},d=>{delete d.terminal.roic;}]){const d=draft();mutate(d);const saved=clone(d);assert.throws(()=>operating(d),e=>e.enterprise===null&&e.equity===null&&e.perShare===null);assert.deepEqual(d,saved);}
 const d=draft(),base=operating(d);d.annual.slice(0,3).forEach((r,i)=>{r.margin=[-.35,-.25,-.15][i];});assert.throws(()=>operating(d),e=>e.status==='unsupported_funding_gap'&&e.enterprise===null&&e.equity===null&&e.perShare===null&&e.fundingDiagnostics.conditional_value_per_share===null&&e.fundingDiagnostics.headline_enterprise===null);assert.throws(()=>bridge(d,base.enterprise));
 for(const options of [{outputCurrency:'EUR'},{securityBasis:'ADS'},{calculationDate:'2026-10-19'},{newBorrowing:100}])assert.throws(()=>bridge(draft(),base.enterprise,options));
});
