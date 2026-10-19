import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateCeva,cevaSourceRows,evaluateCevaSchedule,validateCevaInputs,cevaFiniteTree,CEVA_ADAPTER_NOTES,CEVA_ERRORS,CEVA_OPTION_KEYS} from '../dist/ceva-valuation.js';
const fixture=new URL('../dist/data/incremental-CEVA-2026-10-19-v3/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,fixture),'utf8'));
const a=read('dcf-inputs-v3.json'),clone=x=>structuredClone(x);
const near=(x,y,label='value')=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=Math.max(1e-8,Math.abs(y)*1e-11),`${label}: ${x} != ${y}`);
const blocked=e=>e.enterprise===null&&e.equity===null&&e.perShare===null&&e.conditional_value_per_share===null;
function schedule(name='base'){const s=a.cases[name];return {s,annual:cevaSourceRows(a,name),terminal:{growth:s.g,margin:s.terminal_margin,taxRate:.2,roic:.25,wacc:s.wacc}};}
function evaluate(x,options={}){return evaluateCevaSchedule(a,x.s,x.annual,x.terminal,options);}
function* leaves(x,p=[],type='number'){if(x&&typeof x==='object')for(const k of Object.keys(x))yield*leaves(x[k],[...p,k],type);else if(typeof x===type)yield p;}

test('CEVA all three repaired v3 outputs and all 30 explicit rows reproduce',()=>{
 const outputs=read('dcf-output-v3.json');
 const [header,...lines]=fs.readFileSync(new URL('forecast-v3.csv',fixture),'utf8').trim().split(/\r?\n/),fields=header.split(',');
 const sourceRows=lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[fields[i],['case','period'].includes(fields[i])?v:Number(v)])));
 for(const name of ['bear','base','bull']){
  const o=calculateCeva(a,name),strict=evaluate(schedule(name));
  for(const [key,value]of Object.entries(outputs[name])){if(key==='terminal_share_of_ev'&&name==='bear'){assert.equal(o[key],null,'negative EV concentration is not meaningful');continue;}if(typeof value==='number'){near(o[key],value,`${name}.${key}`);near(strict[key],value,`${name}.strict.${key}`);}else assert.equal(o[key],value);}
  for(const [i,row]of sourceRows.filter(x=>x.case===name).entries())for(const [k,v]of Object.entries(row)){if(k==='case')continue;if(k==='year')assert.equal(o.rows[i].fiscal_year,v);else if(k==='period')assert.equal(o.rows[i].source_period,v);else near(o.rows[i][k],v,`${name}.${row.year}.${k}`);}
  assert.equal(o.rows.length,10);assert.equal(o.rows[0].discount_years,.5);assert.equal(o.rows[9].discount_years,9.5);assert.equal(o.funding_required,false);
  for(const key of ['publication_eligible','current_valuation_eligible','current_price_target_eligible','upside_eligible','historical_backtest_eligible','ranking_eligible'])assert.equal(o[key],false,key);
  near(o.minimum_available_funding_proxy,o.minimum_funding_capacity_proxy-.217-1.072);assert.equal(o.maximum_psu_payout_verified,false);
 }
 assert.deepEqual(['bear','base','bull'].map(n=>calculateCeva(a,n).conditional_value_per_share.toFixed(6)),['5.742889','12.981785','27.590498']);
 assert.ok(calculateCeva(a,'bear').enterprise_value<0);assert.ok(calculateCeva(a,'bear').equity_value>0);
});
test('CEVA all 80 reviewed WACC/growth, offshore and award sensitivities reproduce',()=>{
 const expected=read('sensitivity-v3.json');assert.equal(expected.length,80);
 for(const row of expected){const options={};for(const key of ['wacc','g'])if(Object.hasOwn(row,key))options[key]=row[key];if(Object.hasOwn(row,'foreign_liquidity_haircut'))options.offshoreTaxHaircut=row.foreign_liquidity_haircut;if(Object.hasOwn(row,'award_claim_multiplier'))options.awardClaimMultiplier=row.award_claim_multiplier;
  const o=calculateCeva(a,row.case||'base',options);for(const key of ['enterprise_value','equity_value_before_option_cash','conditional_value_per_share','terminal_cash_tax','terminal_nopat','terminal_fcf','terminal_reinvestment'])near(o[key],row[key],key);
 }
});
test('CEVA explicit and terminal revenue tax floors remain applied with no loss credits',()=>{
 const bear=calculateCeva(a,'bear'),base=calculateCeva(a,'base');near(bear.terminal_cash_tax,bear.terminal_revenue*.03);near(base.terminal_cash_tax,base.terminal_ebit*.2);
 for(const o of [bear,base,calculateCeva(a,'bull')])for(const r of o.rows){near(r.tax,Math.max(0,r.economic_ebit*r.taxRate,r.revenue*.03));assert.ok(r.tax>=r.revenue*.03-1e-9);}
 const x=schedule();x.annual[0].margin=-.5;const o=evaluate(x);near(o.rows[0].tax,o.rows[0].revenue*.03);assert.ok(o.rows[0].economic_ebit<0);
 x.annual[9].margin=x.terminal.margin=.06;const low=evaluate(x);near(low.terminal_cash_tax,low.terminal_revenue*.03);near(low.terminal_reinvestment,low.terminal_nopat*x.terminal.growth/x.terminal.roic);
 x.annual[9].margin=x.terminal.margin=.02;assert.throws(()=>evaluate(x),e=>blocked(e)&&e.message===CEVA_ERRORS.terminal);
});
test('CEVA award expense, claim reserve and endogenous option branch have no double counting',()=>{
 const base=calculateCeva(a,'base'),bull=calculateCeva(a,'bull'),stress=calculateCeva(a,'base',{awardClaimMultiplier:1.5});
 near(base.rows[0].old_award_addback,9.502);near(base.rows[1].old_award_addback,19.004);assert.ok(base.rows.slice(2).every(r=>r.old_award_addback===0));near(base.rows.reduce((n,r)=>n+r.old_award_addback,0),28.506);
 for(const r of base.rows){near(r.economic_ebit,r.gaap_ebit+r.old_award_addback);near(r.fcff,r.economic_ebit-r.tax-r.reinvestment);}
 near(base.capital_bridge,189.431);near(stress.enterprise_value,base.enterprise_value);near(stress.equity_value,base.equity_value);near(stress.allocation_shares,28.137917+1.845728*1.5);assert.ok(stress.conditional_value_per_share<base.conditional_value_per_share);
 assert.equal(base.option_exercised,false);assert.equal(base.option_exercise_cash,0);near(base.allocation_shares,29.983645);
 assert.equal(bull.option_exercised,true);near(bull.option_exercise_cash,.030025*20.91);near(bull.allocation_shares,29.983645+.030025);near(bull.conditional_value_per_share,(bull.equity_value_before_option_cash+.030025*20.91)/(29.983645+.030025));
 near(bull.equity_value,bull.enterprise_value+bull.capital_bridge+bull.option_exercise_cash);assert.notEqual(bull.allocation_shares,28.154072+1.845728+.030025,'later August shares are excluded');
 let lo=.18,hi=.5;for(let i=0;i<50;i++){const s=clone(a.cases.base);s.terminal_margin=(lo+hi)/2;const o=calculateCeva(a,s);if(o.option_exercised)hi=s.terminal_margin;else lo=s.terminal_margin;}
 const lower=clone(a.cases.base),upper=clone(a.cases.base);lower.terminal_margin=lo;upper.terminal_margin=hi;
 assert.equal(calculateCeva(a,lower).option_exercised,false);assert.equal(calculateCeva(a,upper).option_exercised,true);near(calculateCeva(a,lower).conditional_value_per_share,20.91);near(calculateCeva(a,upper).conditional_value_per_share,20.91);
 assert.match(CEVA_ADAPTER_NOTES.claims,/not a verified maximum/);assert.match(CEVA_ADAPTER_NOTES.options,/not necessarily worthless/);assert.match(CEVA_ADAPTER_NOTES.reserve,/not also deducted/);
});
test('CEVA reserve and offshore controls change the bridge once and keep raw v3 capacity distinct',()=>{
 const base=calculateCeva(a),haircut=calculateCeva(a,'base',{offshoreTaxHaircut:12.27}),reserve=calculateCeva(a,'base',{minimumOperatingCash:40});
 near(haircut.enterprise_value,base.enterprise_value);near(haircut.equity_value,base.equity_value-12.27);near(haircut.minimum_funding_capacity_proxy,base.minimum_funding_capacity_proxy);near(haircut.minimum_available_funding_proxy,base.minimum_available_funding_proxy-12.27);
 near(reserve.enterprise_value,base.enterprise_value);near(reserve.equity_value,base.equity_value-10);near(reserve.minimum_available_funding_proxy,base.minimum_available_funding_proxy);near(reserve.minimum_funding_headroom,base.minimum_funding_headroom-10);
 const blockedResult=calculateCeva(a,'bull',{minimumOperatingCash:220.72});assert.equal(blockedResult.funding_required,true);near(blockedResult.unfunded_gap,.217+1.072);near(blockedResult.minimum_funding_capacity_proxy,220.72);
 for(const k of ['enterprise_value','equity_value_before_option_cash','equity_value','conditional_value_per_share','headline_enterprise','headline_equity','headline_per_share','equity_pool_before_existing_equity_claims'])assert.equal(blockedResult[k],null,k);
 const x=schedule();x.annual[0].reinvestment+=250;const stress=evaluate(x);assert.equal(stress.funding_required,true);assert.ok(stress.peak_funding_gap>0);assert.equal(stress.conditional_value_per_share,null);assert.ok(Number.isFinite(stress.diagnostic_enterprise_value));
});
test('CEVA entered capital is never repaired and tax/WACC edits use the current annual schedule',()=>{
 const x=schedule(),base=evaluate(x),before=clone(x);x.annual[0].reinvestment+=10;const edited=evaluate(x);near(edited.enterprise_value,base.enterprise_value-10/(1+x.annual[0].wacc)**.5);near(edited.rows[0].funding_capacity_proxy,base.rows[0].funding_capacity_proxy-10);near(edited.rows[0].net_reinvestment,x.annual[0].reinvestment);
 const missing=schedule();missing.annual[0].reinvestment-=.01;const saved=clone(missing);assert.throws(()=>evaluate(missing),e=>blocked(e)&&e.message===CEVA_ERRORS.floor);assert.deepEqual(missing,saved);
 const expanded=schedule();expanded.annual[0].revenue*=2;assert.throws(()=>evaluate(expanded),e=>blocked(e)&&e.message===CEVA_ERRORS.floor);
 const release=schedule();release.annual[1].revenue=80;const prevFull=release.annual[0].revenue+56.057;release.annual[1].reinvestment=80*.005+(80-prevFull)*.18;release.annual[2].reinvestment=release.annual[2].revenue*.005+(release.annual[2].revenue-80)*.18;const released=evaluate(release);assert.ok(released.rows[1].required_reinvestment<0);near(released.rows[1].reinvestment,released.rows[1].required_reinvestment);
 const varying=schedule();varying.annual[0].wacc=.15;varying.annual[1].wacc=.12;const varied=evaluate(varying);near(varied.rows[0].discount_factor,1.15**.5);near(varied.rows[1].discount_factor,1.15**.5*1.12);near(varied.rows[9].discount_factor,1.15**.5*1.12*1.11**8);
 for(const k of ['margin','taxRate','wacc']){const v=schedule();v.terminal[k]+=.01;assert.throws(()=>evaluate(v),e=>blocked(e)&&e.message===CEVA_ERRORS.convergence);}
 assert.deepEqual(schedule(),before);
});
test('CEVA every numeric input leaf rejects missing data, coercions and nonfinite values',()=>{
 for(const path of leaves(a))for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const x=clone(a);let target=x;for(const k of path.slice(0,-1))target=target[k];target[path.at(-1)]=bad;assert.throws(()=>validateCevaInputs(x),blocked,path.join('.'));}
 const before=clone(a);for(const name of ['bear','base','bull'])calculateCeva(a,name);assert.deepEqual(a,before);
 for(const bad of [NaN,Infinity,-Infinity])assert.throws(()=>cevaFiniteTree({x:{y:bad}}),blocked);
});
test('CEVA schemas, immutable source facts and dates reject unsupported state',()=>{
 for(const path of [[],['capital'],['capital','later_share_observation'],['observed_H1_2026'],['cases'],['cases','base'],['common_assumptions'],['rationale']]){const x=clone(a);let target=x;for(const k of path)target=target[k];target.borrowing=1;assert.throws(()=>validateCevaInputs(x),blocked);delete target.borrowing;delete target[Object.keys(target)[0]];assert.throws(()=>validateCevaInputs(x),blocked);}
 for(const [key,value]of [['cutoff','2026-10-18'],['valuation_date','2026-10-19'],['version',2],['units','USD thousands']]){const x=clone(a);x[key]=value;assert.throws(()=>validateCevaInputs(x),blocked);}
 for(const key of Object.keys(a.capital).filter(k=>typeof a.capital[k]==='number')){const x=clone(a);x.capital[key]+=.000001;assert.throws(()=>validateCevaInputs(x),blocked,key);}
 for(const bad of [[],Array(9),Array(10).fill(.1),[.1]]){const x=clone(a);x.cases.base.license_growth=bad;assert.throws(()=>validateCevaInputs(x),blocked);}
 for(const name of ['missing','toString','constructor','__proto__'])assert.throws(()=>calculateCeva(a,name),blocked);
 for(const bad of [null,[],{},true])assert.throws(()=>calculateCeva(bad),blocked);
 for(const bad of [{unknown:0},{newBorrowing:100},null,[]])assert.throws(()=>calculateCeva(a,'base',bad),blocked);
 for(const [key,min,max]of [['minimumOperatingCash',0,220.72],['offshoreTaxHaircut',0,122.7],['awardClaimMultiplier',1,2]])for(const bad of [null,true,'0',NaN,Infinity,-Infinity,min-.001,max+.001])assert.throws(()=>calculateCeva(a,'base',{[key]:bad}),blocked,key);
});
test('CEVA annual and terminal edited schemas fail closed without changing saved state',()=>{
 for(const key of ['revenue','margin','taxRate','reinvestment','wacc'])for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const x=schedule();x.annual[0][key]=bad;assert.throws(()=>evaluate(x),blocked);}
 for(const key of ['growth','margin','taxRate','roic','wacc'])for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const x=schedule();x.terminal[key]=bad;assert.throws(()=>evaluate(x),blocked);}
 for(const mutate of [x=>x.annual.pop(),x=>x.annual.push(clone(x.annual[9])),x=>{delete x.annual[0];},x=>{x.annual[0].period='FY2026';},x=>{x.annual[0].year=2026;},x=>{x.annual[0].revenue=0;},x=>{x.annual[0].newBorrowing=1;},x=>{x.terminal.newBorrowing=1;},x=>{delete x.terminal.roic;},x=>{x.terminal.growth=x.terminal.wacc;},x=>{x.terminal.roic=x.terminal.growth;},x=>{x.terminal.growth=.06;}]){const x=schedule();mutate(x);const saved=clone(x);assert.throws(()=>evaluate(x),blocked);assert.deepEqual(x,saved);}
});
async function adapter(){
 const {incrementalRecord}=await import('../dist/incremental-registry.js');
 const {incrementalResearchDraft,incrementalAlternative}=await import('../dist/incremental-research.js');
 const model=await import('../dist/ceva-valuation.js'),r=incrementalRecord('CEVA');assert.ok(r,'CEVA registry is wired');
 const draft=()=>incrementalResearchDraft({ticker:'CEVA',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});return {r,draft,incrementalAlternative,...model};
}
test('CEVA current draft adapter reprices all named cases with source dates and exact claims',async()=>{
 const {r,draft,incrementalAlternative,calculateCevaOperating:operating,calculateCevaBridge:bridge,calculateCevaSensitivity:sensitivity,cevaDraftIssues}=await adapter();
 for(const c of [{name:null,annualCase:r.annualCase},...r.alternatives]){const d=c.name?incrementalAlternative(draft(),c.name).draft:draft(),pure=calculateCeva(a,c.annualCase.sourceScenario),o=operating(d),b=bridge(d,o.enterprise);
  assert.deepEqual(cevaDraftIssues(d),[]);near(o.enterprise,pure.enterprise_value);near(b.perShare,pure.conditional_value_per_share);near(b.equity,pure.equity_value);near(b.allocationShares,pure.allocation_shares);near(b.basicShares,28.137917);near(b.assetTotal-b.claimTotal+b.enterprise,b.equity);near(b.optionExerciseCash,pure.option_exercise_cash);assert.equal(b.maximumPsuPayoutVerified,false);
  for(const key of ['referenceDate','capitalReferenceDate','shareReferenceDate','discountOrigin','calculationDate'])assert.equal(b[key],'2026-06-30');assert.equal(b.informationAsOf,'2026-10-19');assert.equal(o.rows[0].period,'H2 2026');
  for(const key of ['currentCapitalVerified','priceComparisonEligible','asKnownBacktestEligible','currentValuationEligible','currentPriceTargetEligible','historicalBacktestEligible','rankingEligible','upsideEligible'])assert.equal(b[key],false,key);
  assert.equal(sensitivity(d).normalizationDelta,0);near(sensitivity(d).rates.find(x=>x.waccShift===0).enterprise,o.enterprise);assert.equal(o.rows[0].investmentFloorTopUp,0);assert.match(o.segmentMapping,/not a segment forecast/);
 }
});
test('CEVA adapter rejects stale EV and unsupported identity, timing, controls, source or basis',async()=>{
 const {draft,calculateCevaOperating:operating,calculateCevaBridge:bridge,cevaDraftIssues}=await adapter();
 const d=draft(),base=operating(d);d.annual[0].reinvestment+=1;assert.throws(()=>bridge(d,base.enterprise),e=>blocked(e)&&e.message===CEVA_ERRORS.stale);
 for(const mutate of [d=>{d.discountOrigin='2026-10-19';},d=>{d.informationAsOf='2026-06-30';},d=>{d.anchor.revenue+=1;},d=>{d.incrementalResearch.sourceSHA256='bad';},d=>{d.version='old';},d=>{d.currency='EUR';},d=>{d.timing.mode='as-of-scenario';},d=>{d.timing.stubFCFF=0;},d=>{d.timing.stubDiscountRate='0.1';},d=>{d.newBorrowing=1;},d=>{d.bridgeInputs.newBorrowing=1;},d=>{delete d.bridgeInputs.awardClaimMultiplier;},d=>{d.annual[0].reinvestment=0;},d=>{d.forecastHorizonYears=15;},d=>{d.schemaVersion=2;},d=>{d.terminal.margin+=.01;}]){const next=draft();mutate(next);const saved=clone(next);assert.throws(()=>operating(next),blocked);assert.ok(cevaDraftIssues(next).length);assert.deepEqual(next,saved);}
 for(const key of CEVA_OPTION_KEYS)for(const bad of [null,true,'0',NaN,Infinity,-Infinity]){const next=draft();next.bridgeInputs[key]=bad;assert.throws(()=>operating(next),blocked);}
 for(const options of [{outputCurrency:'EUR'},{securityBasis:'ADS'},{calculationDate:'2026-10-19'},{informationAsOf:'2026-06-30'},{newBorrowing:100},null,[]])assert.throws(()=>bridge(draft(),base.enterprise,options),blocked);
 const failed=draft();failed.bridgeInputs.minimumOperatingCash=220.72;assert.throws(()=>operating(failed),e=>blocked(e)&&e.status==='unsupported_funding_gap'&&e.fundingDiagnostics.headline_enterprise===null&&e.fundingDiagnostics.conditional_value_per_share===null);assert.throws(()=>bridge(failed,base.enterprise),blocked);
});

test('CEVA shared dispatch and simulation preserve the current schedule and funding diagnostics',async()=>{
 const {r,draft,incrementalAlternative}=await adapter();
 const {calculateResearchOperating:operating,researchDraftIssues}=await import('../dist/research-model.js');
 const {calculateResearchBridge:bridge}=await import('../dist/research-claims.js');
 const {simulateResearch}=await import('../dist/research-simulation.js');
 for(const name of ['base','bear','bull']){const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,pure=calculateCeva(a,name),o=operating(d),b=bridge(d,o.enterprise),sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});
  assert.deepEqual(researchDraftIssues(d),[]);near(o.enterprise,pure.enterprise_value);near(b.perShare,pure.conditional_value_per_share);assert.equal(sim.accepted,3);for(const v of sim.perShare.draws)near(v,b.perShare);assert.ok(sim.scenarios.every(s=>s.annualFunding.length===10));
 }
 const funded=draft();funded.bridgeInputs.minimumOperatingCash=220.72;const saved=clone(funded);assert.deepEqual(researchDraftIssues(funded),[],'valid funding stress remains restorable');assert.throws(()=>operating(funded),e=>blocked(e)&&e.status==='unsupported_funding_gap'&&e.peakUnfundedGap>0&&e.fundingDiagnostics.headline_enterprise===null);assert.deepEqual(funded,saved);
});
