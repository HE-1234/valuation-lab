import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateSndk,validateSndkInputs} from '../dist/sndk-financial-engine.js';
const fixture=new URL('../dist/data/incremental-SNDK-2026-10-19-v3/v3/',import.meta.url);
const read=n=>JSON.parse(fs.readFileSync(new URL(n,fixture),'utf8'));
const clone=x=>structuredClone(x),a=read('model-inputs.json');
const near=(x,y,p)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-11),`${p}: ${x} != ${y}`);
function compare(x,y,p='result'){if(typeof y==='number')return near(x,y,p);if(y===null||typeof y!=='object')return assert.equal(x,y,p);for(const k of Object.keys(y))compare(x[k],y[k],p+'.'+k);}
test('SNDK independently reviewed 114 saved cases replay all output fields',()=>{
 let count=0;
 for(const file of ['model-output.json','sensitivity.json','claim-sensitivities.json','distribution-funding-stress.json','terminal-funding-sensitivity.json'])for(const saved of read(file)){
 const m=clone(a),s=clone(m.scenarios.find(x=>x.name===saved.scenario));
 if(file==='sensitivity.json')Object.assign(s,{wacc:saved.wacc,terminal_growth:saved.terminal_growth});
 if(file==='claim-sensitivities.json'){Object.assign(m.capital_bridge,{incremental_uncertain_tax_claim_assumption:saved.additional_utb,incremental_unpaid_legal_assumption:saved.additional_legal});s.additional_jv_guarantee_call_assumption=saved.additional_jv_guarantee;}
 if(file==='distribution-funding-stress.json')s.distribution_policy='distribute_positive';
 if(file==='terminal-funding-sensitivity.json')s.terminal_net_physical_jv_funding_floor=saved.terminal_physical_jv_floor_assumption;
 if(saved.status==='INVALID_MODEL')assert.throws(()=>calculateSndk(m,s),/terminal funding floor/);else{const o=calculateSndk(m,s);for(const k of Object.keys(o))if(k in saved)compare(o[k],saved[k],file+'.'+k);}count++;
 }assert.equal(count,114);
});
test('SNDK claims reserve once, opening gap boundaries and explicit contingent diagnostics',()=>{
 for(const s of a.scenarios){const base=calculateSndk(a,s);for(const amount of [0,589.999,590,590.001,1000]){const m=clone(a);m.capital_bridge.additional_claim_reserve_assumption=amount;const o=calculateSndk(m,s);near(o.economic_equity_diagnostic,base.economic_equity_diagnostic-amount,'reserve once');near(o.opening_surplus,590-amount,'opening');if(amount>590){assert.equal(o.conditional_common_equity,null);assert.equal(o.conditional_value_per_proxy_share,null);assert.equal(o.operating_value_status,'CONTINGENT_ON_UNMODELED_FUNDING');}else assert.equal(o.status,'VALID_CONDITIONAL_RESEARCH');}}
});
function* leaves(x,p=[]){if(x&&typeof x==='object'){for(const k of Object.keys(x))yield*leaves(x[k],[...p,k]);}else if(typeof x==='number')yield p;}
test('SNDK all numeric leaves reject nonfinite, null, booleans, and strings without mutation',()=>{
 for(const p of leaves(a))for(const value of [NaN,Infinity,-Infinity,null,true,'0']){const m=clone(a);let t=m;for(const k of p.slice(0,-1))t=t[k];t[p.at(-1)]=value;assert.throws(()=>validateSndkInputs(m),undefined,p.join('.'));}
 const before=clone(a);for(const s of a.scenarios)calculateSndk(a,s);assert.deepEqual(a,before);
});
test('SNDK rejects debt, unknown fields, malformed schedules and unsafe terminal inputs',()=>{
 for(const path of [[],['capital_bridge'],['nbm'],['scenarios',0]]){const m=clone(a);let t=m;for(const k of path)t=t[k];t.newBorrowing=100;assert.throws(()=>validateSndkInputs(m),/unknown keys/);delete t.newBorrowing;delete t[Object.keys(t)[0]];assert.throws(()=>validateSndkInputs(m),/missing keys/);}
 for(const [key,value] of [['own_da_ratio',.9],['wacc',.03],['terminal_growth',.11],['terminal_roic',.01],['distribution_policy','rescue']]){const m=clone(a);m.scenarios[0][key]=value;assert.throws(()=>calculateSndk(m,m.scenarios[0]));}
 const m=clone(a);m.capital_bridge.financial_debt=1;assert.throws(()=>calculateSndk(m,m.scenarios[0]),/maturity/);
 assert.throws(()=>calculateSndk(a,a.scenarios[0],{newBorrowing:1}),/unknown override/);
});
test('SNDK adapter matches each case and safely propagates edits, reserves and funding floors',async()=>{
 const {incrementalRecord}=await import('../dist/incremental-registry.js'),{incrementalResearchDraft,incrementalAlternative}=await import('../dist/incremental-research.js'),{calculateSndkOperating,calculateSndkBridge}=await import('../dist/sndk-research-model.js');
 const r=incrementalRecord('SNDK'),draft=()=>incrementalResearchDraft({ticker:'SNDK',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
 for(const name of [null,...r.alternatives.map(x=>x.name)]){const d=name?incrementalAlternative(draft(),name).draft:draft(),c=name?r.alternatives.find(x=>x.name===name).annualCase:r.annualCase,s=a.scenarios.find(x=>x.name===c.sourceScenario),source=calculateSndk(a,s),o=calculateSndkOperating(d),b=calculateSndkBridge(d,o.enterprise);near(o.enterprise,source.operating_value,'adapter EV');near(b.perShare,source.conditional_value_per_proxy_share,'adapter share');assert.equal(b.priceComparisonEligible,false);assert.equal(b.asKnownBacktestEligible,false);assert.equal(b.allocationShares,155);}
 let d=draft(),base=calculateSndkOperating(d),bridge=calculateSndkBridge(d,base.enterprise);
 d.bridgeInputs.additionalClaimReserve=590;let o=calculateSndkOperating(d),b=calculateSndkBridge(d,o.enterprise);near(b.equity,bridge.equity-590,'claim once');near(o.minimumModeledLiquidity,0,'exact reserve boundary');
 d.bridgeInputs.additionalClaimReserve=590.001;assert.throws(()=>calculateSndkOperating(d),e=>e.enterprise===null&&e.perShare===null&&e.status==='unsupported_funding_gap');assert.throws(()=>calculateSndkBridge(d,base.enterprise));
 d=draft();d.bridgeInputs.additionalJvGuaranteeCall=100;o=calculateSndkOperating(d);b=calculateSndkBridge(d,o.enterprise);near(b.equity,bridge.equity-100,'guarantee once');
 d=draft();d.annual[0].reinvestment=0;o=calculateSndkOperating(d);near(o.enterprise,base.enterprise,'physical funding floor');assert.ok(o.rows[0].investmentFloorTopUp>0);near(o.rows[0].reinvestment,o.rows[0].fundingFloor,'floor applied');
 d=draft();d.annual[0].revenue*=1.1;o=calculateSndkOperating(d);assert.ok(o.rows[0].fundingFloor>base.rows[0].fundingFloor);assert.notEqual(o.enterprise,base.enterprise);
 d=draft();d.annual[0].reinvestment=1e7;assert.throws(()=>calculateSndkOperating(d),/unmodeled funding/);
 for(const key of ['additionalDebt','newBorrowing','unknown']){d=draft();d[key]=1;assert.throws(()=>calculateSndkOperating(d),/Unsupported SNDK draft field/);}
 d=draft();d.annual[0].newBorrowing=100;assert.throws(()=>calculateSndkOperating(d));
 d=draft();d.bridgeInputs.distributePositiveFcff=.5;assert.throws(()=>calculateSndkOperating(d));
 d=draft();d.terminal.margin=.001;assert.throws(()=>calculateSndkOperating(d),/terminal funding floor/);
 d=draft();d.timing.newBorrowing=100;assert.throws(()=>calculateSndkOperating(d));
});
