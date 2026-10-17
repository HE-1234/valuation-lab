// Independent schema-2 financial oracles. Expected FCFF and seeded draws are
// derived here, never by the production operating adapter or valuation engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as model from '../dist/current-model.js';
import * as operating from '../dist/current-operating.js';
import {simulateCurrent} from '../dist/simulation.js';

const {calculateCurrent,currentIssues,currentSnapshot,draftFor,safeDraft,freezeCurrent}=model;
const {operatingAssumptions,operatingProfileDefinition}=operating;
const driverKeys=['growth','targetMargin','salesCapital','wacc'];
const paths=[['immediate',0],['maintain',3],['maintain',5],['annual',3],['annual',5]];
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const universe=read('../dist/data/current-universe.json');
const research=read('../dist/data/company-base-cases.json');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const saved=value=>JSON.parse(JSON.stringify(value));
const clamp=value=>Math.min(1,Math.max(0,value));
const near=(actual,expected,label='value',tolerance=2e-11)=>{
 assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),`${label}: nonfinite ${actual}, ${expected}`);
 assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${label}: ${actual} != ${expected}`);
};
function deepFreeze(value){
 Object.freeze(value);
 for(const child of Object.values(value))if(child&&typeof child==='object')deepFreeze(child);
 return value;
}
const snapshot=()=>({ticker:'TIMELINE',currency:'USD',units:'millions',sourceUrl:'https://example.com/timeline-filing',periodEnd:'2025-12-31',filedAt:'2026-02-01',availableFrom:'2026-02-02',revenue:1200,ebit:156,cash:90,debt:170,shares:70,snapshotMode:'annual-reference',shareBasis:'period-end common',backtestEligible:false,raw:{id:'timeline-2025'}});
function draft({mode='annual',explicitYears=5,years=15,schemaVersion=2,marginMaturityYears=10,capitalMaturityYears=10,capitalHoldYears=3}={}){
 const d=draftFor({ticker:'TIMELINE'},{id:'timeline-2025'});
 Object.assign(d,{cutoff:'2026-10-17',normalizationDelta:0});
 Object.assign(d.assumptions,{growth:.24,targetMargin:.27,tax:.23,salesCapital:2.6,wacc:.105,terminalGrowth:.025,terminalROIC:.13,years,otherClaims:11,otherAssets:17});
 d.operatingProfile={schemaVersion,id:'flexible-growth-v1',mode,explicitYears,subsequentGrowth:mode==='annual'?[.31,-.12,.22,.08].slice(0,explicitYears-1):[]};
 if(schemaVersion===2)Object.assign(d.operatingProfile,{marginMaturityYears,capitalMaturityYears,capitalHoldYears});
 return d;
}
function context(ticker='AMZN'){
 const company=universe.companies.find(c=>c.ticker===ticker);
 const raw=company.snapshots.find(r=>r.id===company.currentSnapshotId);
 const s=currentSnapshot(company,raw),d=draftFor(company,raw,{baseCases:research});
 d.cutoff=universe.asOf;
 return {company,raw,s,d};
}
function migrate(d,path){
 assert.equal(typeof operating.independentGrowthProfile,'function','operating adapter exports the migration helper');
 assert.equal(model.independentGrowthProfile,operating.independentGrowthProfile,'current-model re-exports the same helper');
 return operating.independentGrowthProfile(d,path);
}
function annualGrowth(d,a=d.assumptions){
 const p=d.operatingProfile,growthYears=d.assumptions.years;
 const n=p.schemaVersion===2?Math.max(growthYears,p.marginMaturityYears,p.capitalMaturityYears):growthYears;
 const shift=a.growth-d.assumptions.growth;
 const explicit=p.mode==='annual'?[a.growth,...p.subsequentGrowth.map(g=>g+shift)]:Array(p.explicitYears).fill(a.growth);
 return Array.from({length:n},(_,index)=>{
  const year=index+1;
  if(p.mode==='immediate')return a.growth+(a.terminalGrowth-a.growth)*clamp(index/(growthYears-1));
  if(year<=p.explicitYears)return explicit[index];
  const last=explicit.at(-1);
  return last+(a.terminalGrowth-last)*clamp((year-p.explicitYears)/(growthYears-p.explicitYears));
 });
}
function oracle(s,d,a=d.assumptions){
 const p=d.operatingProfile,growth=annualGrowth(d,a),n=growth.length;
 const marginEnd=p.schemaVersion===2?p.marginMaturityYears:d.assumptions.years;
 const capitalEnd=p.schemaVersion===2?p.capitalMaturityYears:d.assumptions.years;
 const capitalHold=p.schemaVersion===2?p.capitalHoldYears:p.explicitYears;
 const start=(s.ebit+d.normalizationDelta)/s.revenue;
 const matureIntensity=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
 let previousRevenue=s.revenue,forecastPV=0;
 const rows=growth.map((rate,index)=>{
  const year=index+1,revenue=previousRevenue*(1+rate);
  const margin=start+(a.targetMargin-start)*Math.min(year/marginEnd,1);
  const fade=clamp((year-capitalHold)/(capitalEnd-capitalHold));
  const capitalIntensity=(1-fade)/a.salesCapital+fade*matureIntensity;
  const ebit=revenue*margin,tax=Math.max(0,ebit)*a.tax,nopat=ebit-tax;
  const reinvestment=Math.max(0,revenue-previousRevenue)*capitalIntensity,fcff=nopat-reinvestment;
  const discountFactor=(1+a.wacc)**year,pv=fcff/discountFactor;
  forecastPV+=pv;previousRevenue=revenue;
  return {year,growth:rate,revenue,margin,wacc:a.wacc,discountFactor,ebit,tax,nopat,reinvestment,fcff,pv,capitalIntensity,salesCapital:1/capitalIntensity};
 });
 const terminalNopat=previousRevenue*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax);
 const terminalReinvestment=terminalNopat*a.terminalGrowth/a.terminalROIC;
 const terminalPV=(terminalNopat-terminalReinvestment)/(a.wacc-a.terminalGrowth)/(1+a.wacc)**n;
 const enterprise=forecastPV+terminalPV,equity=enterprise+s.cash+a.otherAssets-s.debt-a.otherClaims;
 return {rows,forecastPV,terminalNopat,terminalReinvestment,terminalPV,enterprise,equity,rawPerShare:equity/s.shares,perShare:Math.max(0,equity)/s.shares,terminalShare:terminalPV/enterprise};
}
function assertValuation(actual,expected,label){
 assert.equal(actual.rows.length,expected.rows.length,`${label}: forecast length`);
 for(const [i,row]of actual.rows.entries())for(const key of ['year','growth','revenue','margin','wacc','discountFactor','ebit','tax','nopat','reinvestment','fcff','pv'])near(row[key],expected.rows[i][key],`${label}: year ${i+1} ${key}`);
 for(const key of ['forecastPV','terminalNopat','terminalReinvestment','terminalPV','enterprise','equity','rawPerShare','perShare','terminalShare'])near(actual[key],expected[key],`${label}: ${key}`);
}
function independentRandom(seed){
 let state=2166136261;
 for(const c of String(seed))state=Math.imul(state^c.codePointAt(0),16777619);
 return ()=>{
  state=(state+0x6D2B79F5)>>>0;
  let word=Math.imul(state^(state>>>15),1|state);
  word^=word+Math.imul(word^(word>>>7),61|word);
  return ((word^(word>>>14))>>>0)/4294967296;
 };
}
const simulationConfig=()=>({trials:23,seed:'independent-timeline-legacy',drivers:{growth:{type:'uniform',low:.12,high:.32},targetMargin:{type:'uniform',low:.16,high:.34},salesCapital:{type:'uniform',low:1.4,high:4.2},wacc:{type:'uniform',low:.075,high:.14}}});
function expectedTrials(d,config){
 const random=independentRandom(config.seed),accepted=[],excluded=[];
 for(let trial=1;trial<=config.trials;trial++){
  const a={...d.assumptions};
  for(const key of driverKeys){
   const u=random(),spec=config.drivers?.[key]??{type:'fixed',value:a[key]};
   assert.ok(['fixed','uniform'].includes(spec.type),'the independent oracle supports fixed/uniform only');
   a[key]=spec.type==='fixed'?spec.value:spec.low+(spec.high-spec.low)*u;
  }
  const valid=a.wacc>a.terminalGrowth&&a.targetMargin>0&&annualGrowth(d,a).every(g=>g>=-.5&&g<=2);
  (valid?accepted:excluded).push({trial,a});
 }
 return {accepted,excluded};
}
function assertSimulation(s,d,config){
 const expected=expectedTrials(d,config),actual=simulateCurrent(s,d,config);
 assert.equal(actual.attempts,config.trials);
 assert.equal(actual.accepted,expected.accepted.length);
 assert.equal(actual.excluded,expected.excluded.length);
 assert.equal(actual.accepted+actual.excluded,config.trials);
 assert.equal(Object.values(actual.exclusions).reduce((sum,n)=>sum+n,0),actual.excluded);
 assert.deepEqual(actual.scenarios.map(row=>row.trial),expected.accepted.map(row=>row.trial),'no clipping, replacement or extra path-dependent draws');
 for(const [i,draw]of expected.accepted.entries()){
  const scenario=actual.scenarios[i],value=oracle(s,d,draw.a);
  for(const key of driverKeys)assert.equal(scenario[key],draw.a[key],`trial ${draw.trial}: original ${key} draw`);
  near(scenario.perShare,value.perShare,`trial ${draw.trial}: per-share FCFF oracle`);
  near(scenario.rawPerShare,value.rawPerShare,`trial ${draw.trial}: raw FCFF oracle`);
  near(actual.draws[i],value.perShare,`trial ${draw.trial}: original draw order`);
 }
 const samples=expected.accepted.map(draw=>oracle(s,d,draw.a).perShare).sort((a,b)=>a-b);
 actual.samples.forEach((v,i)=>near(v,samples[i],`sorted draw ${i}`));
 return actual;
}

const timelineCases=[
 {years:10,marginMaturityYears:6,capitalMaturityYears:18,capitalHoldYears:4},
 {years:20,marginMaturityYears:10,capitalMaturityYears:10,capitalHoldYears:3},
 {years:15,marginMaturityYears:22,capitalMaturityYears:9,capitalHoldYears:0},
 {years:10,marginMaturityYears:1,capitalMaturityYears:30,capitalHoldYears:29},
 {years:20,marginMaturityYears:30,capitalMaturityYears:1,capitalHoldYears:0}
];
for(const [mode,explicitYears]of paths)for(const anchors of timelineCases)test(`independent timelines: ${mode}/${explicitYears}, growth ${anchors.years}, margin ${anchors.marginMaturityYears}, capital ${anchors.capitalHoldYears}–${anchors.capitalMaturityYears}`,()=>{
 const s=snapshot(),d=draft({mode,explicitYears,...anchors}),before=structuredClone(d);
 const expected=oracle(s,d),value=calculateCurrent(s,d),adapted=operatingAssumptions(s,d,d.assumptions),p=operatingProfileDefinition(s,d);
 assert.deepEqual(currentIssues(s,d),[]);
 assertValuation(value,expected,JSON.stringify({mode,explicitYears,...anchors}));
 assert.equal(value.assumptions.years,anchors.years,'public assumptions retain the authored growth endpoint');
 assert.equal(adapted.years,expected.rows.length);
 assert.equal(p.schemaVersion,2);assert.equal(p.independentTimelines,true);
 assert.equal(p.forecastYears,expected.rows.length);assert.equal(p.growthMaturityYears,anchors.years);
 for(const key of ['marginMaturityYears','capitalMaturityYears','capitalHoldYears'])assert.equal(p[key],anchors[key]);
 assert.equal(value.operatingProfile.forecastYears,expected.rows.length);
 assert.equal(value.operatingProfile.annualPath.length,expected.rows.length);
 for(const [i,row]of expected.rows.entries()){
  const override=adapted.yearlyOverrides[i];
  near(override.growth,row.growth,`override ${i+1} growth`);
  near(override.margin,row.margin,`override ${i+1} margin`);
  near(1/override.salesCapital,row.capitalIntensity,`override ${i+1} capital intensity`);
  assert.equal(override.taxRate,d.assumptions.tax);assert.equal(override.wacc,d.assumptions.wacc);
  assert.deepEqual(value.operatingProfile.annualPath[i],override);
  if(i+1>=anchors.years)near(row.growth,d.assumptions.terminalGrowth,'growth stays stable after its own endpoint');
  if(i+1>=anchors.marginMaturityYears)near(row.margin,d.assumptions.targetMargin,'margin stays mature after its own endpoint');
 }
 near(value.terminalReinvestment,value.rows.at(-1).reinvestment*(1+d.assumptions.terminalGrowth),'mature reinvestment continuity');
 near(value.terminalNopat-value.terminalReinvestment,value.rows.at(-1).fcff*(1+d.assumptions.terminalGrowth),'mature FCFF continuity');
 assert.deepEqual(d,before,'calculating and describing a profile never migrates or mutates the draft');
});

test('independent timelines: capital hold is independent of explicit growth years, including immediate fade',()=>{
 for(const [mode,explicitYears]of paths){
  const d=draft({mode,explicitYears,years:10,marginMaturityYears:7,capitalMaturityYears:12,capitalHoldYears:8});
  const path=operatingAssumptions(snapshot(),d,d.assumptions).yearlyOverrides,a=d.assumptions;
  for(let i=0;i<8;i++)near(path[i].salesCapital,a.salesCapital,`${mode} capital held through year 8`);
  const mature=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
  near(1/path[8].salesCapital,.75/a.salesCapital+.25*mature,`${mode} first capital fade is year 9`);
  near(1/path[11].salesCapital,mature,`${mode} capital matures in year 12`);
 }
});

test('independent timelines: separate normalized margin, declining revenues and zero stable growth retain conservative FCFF',()=>{
 for(const [mode,explicitYears]of paths){
  const s={...snapshot(),ebit:-300},d=draft({mode,explicitYears,years:10,marginMaturityYears:18,capitalMaturityYears:6,capitalHoldYears:0});
  Object.assign(d,{normalizationDelta:42,adjustmentReason:'Synthetic sourced adjustment',adjustmentSource:'https://example.com/normalization'});
  Object.assign(d.assumptions,{growth:-.35,terminalGrowth:0});
  if(mode==='annual')d.operatingProfile.subsequentGrowth=[-.5,-.25,-.15,-.05].slice(0,explicitYears-1);
  const value=calculateCurrent(s,d);assertValuation(value,oracle(s,d),`${mode} decline/normalization`);
  assert.ok(value.rows.some(row=>row.ebit<0));
  assert.ok(value.rows.filter(row=>row.ebit<0).every(row=>row.tax===0));
  assert.ok(value.rows.filter(row=>row.growth<0).every(row=>row.reinvestment===0));
  assert.equal(value.terminalReinvestment,0);
  near(value.rows[0].margin,(-258/1200)+(d.assumptions.targetMargin+258/1200)/18);
 }
});


test('independent timelines: an already-mature business equals the growing perpetuity under every endpoint arrangement',()=>{
 for(const [mode,explicitYears]of paths)for(const anchors of timelineCases){
  const s=snapshot(),d=draft({mode,explicitYears,...anchors}),a=d.assumptions;
  a.growth=a.terminalGrowth;a.targetMargin=s.ebit/s.revenue;
  a.salesCapital=a.terminalROIC/((1+a.terminalGrowth)*a.targetMargin*(1-a.tax));
  d.operatingProfile.subsequentGrowth.fill(a.growth);
  const yearOneNopat=s.revenue*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax);
  const perpetuity=yearOneNopat*(1-a.terminalGrowth/a.terminalROIC)/(a.wacc-a.terminalGrowth);
  near(calculateCurrent(s,d).enterprise,perpetuity,`${mode}/${explicitYears} ${JSON.stringify(anchors)} perpetuity`);
 }
});

test('independent timelines: migration preserves invalid authored inputs for repair rather than inventing valid economics',()=>{
 for(const value of [null,'0.1',NaN,Infinity,-.51,2.01]){
  const d=draft({schemaVersion:1});d.operatingProfile.subsequentGrowth[0]=value;
  const before=structuredClone(d),p=migrate(deepFreeze(d));
  assert.deepEqual(p.subsequentGrowth,before.operatingProfile.subsequentGrowth);
  assert.notEqual(p.subsequentGrowth,d.operatingProfile.subsequentGrowth);
  assert.throws(()=>calculateCurrent(snapshot(),{...d,operatingProfile:p}));
  assert.deepEqual(d,before);
 }
 for(const key of ['growth','targetMargin','salesCapital','wacc','years']){
  const d=draft({schemaVersion:1});d.assumptions[key]=NaN;
  const before=structuredClone(d),p=migrate(deepFreeze(d));
  assert.equal(p.schemaVersion,2);assert.deepEqual(d,before);
  assert.throws(()=>calculateCurrent(snapshot(),{...d,operatingProfile:p}));
 }
 for(const key of ['marginMaturityYears','capitalMaturityYears','capitalHoldYears']){
  const d=draft();delete d.operatingProfile[key];
  const p=migrate(deepFreeze(d));
  assert.equal(Object.hasOwn(p,key),false,'missing anchor remains missing');
  assert.deepEqual(p,d.operatingProfile);assert.throws(()=>calculateCurrent(snapshot(),{...d,operatingProfile:p}));
 }
 const d=draft();d.operatingProfile.unrecognized={nested:[3]};
 const p=migrate(deepFreeze(d),{subsequentGrowth:[.2,.15,.1,.05]});
 assert.deepEqual(p.unrecognized,d.operatingProfile.unrecognized);
 assert.notEqual(p.unrecognized,d.operatingProfile.unrecognized);
 assert.notEqual(p.unrecognized.nested,d.operatingProfile.unrecognized.nested);
 assert.throws(()=>calculateCurrent(snapshot(),{...d,operatingProfile:p}),'unknown fields must not be erased by migration');
});

test('independent timelines: partial path edits preserve omitted fields and reject unsupported helper arguments',()=>{
 const d=deepFreeze(draft()),p=migrate(d,{subsequentGrowth:[.22,.18,.13,.08]});
 assert.equal(p.mode,d.operatingProfile.mode);assert.equal(p.explicitYears,d.operatingProfile.explicitYears);
 for(const key of ['marginMaturityYears','capitalMaturityYears','capitalHoldYears'])assert.equal(p[key],d.operatingProfile[key]);
 for(const path of [null,[],true,'annual',{years:20},{capitalHoldYears:5},{marginMaturityYears:20}])assert.throws(()=>migrate(d,path));
 for(const schemaVersion of [0,3,'2',null]){
  const invalid=draft();invalid.operatingProfile.schemaVersion=schemaVersion;
  assert.throws(()=>migrate(invalid),'unsupported schema must not be silently upgraded');
 }
});

test('independent timelines: migration preserves every v1 timeline before applying path edits',()=>{
 for(const years of [10,15,20])for(const [mode,explicitYears]of paths){
  const d=draft({mode,explicitYears,years,schemaVersion:1}),before=structuredClone(d);
  const p=migrate(deepFreeze(d));
  assert.equal(p.schemaVersion,2);assert.equal(p.id,'flexible-growth-v1');
  assert.equal(p.mode,mode);assert.equal(p.explicitYears,explicitYears);
  assert.deepEqual(p.subsequentGrowth,d.operatingProfile.subsequentGrowth);
  assert.notEqual(p.subsequentGrowth,d.operatingProfile.subsequentGrowth);
  assert.equal(p.marginMaturityYears,years);assert.equal(p.capitalMaturityYears,years);assert.equal(p.capitalHoldYears,explicitYears);
  assertValuation(calculateCurrent(snapshot(),{...d,operatingProfile:p}),oracle(snapshot(),d),'unchanged migration');
  const {operatingProfile:oldDefinition,...oldFinancial}=calculateCurrent(snapshot(),d);
  const {operatingProfile:newDefinition,...newFinancial}=calculateCurrent(snapshot(),{...d,operatingProfile:p});
  assert.deepEqual(newFinancial,oldFinancial,'migration alone preserves financial outputs bit-for-bit');
  assert.deepEqual(newDefinition.annualPath,oldDefinition.annualPath,'migration preserves every annual override exactly');
  const requested={mode:'annual',explicitYears:explicitYears===5?3:5,subsequentGrowth:explicitYears===5?[.18,.11]:[.18,.15,.12,.09]};
  const changed=migrate(d,deepFreeze(requested));
  assert.equal(changed.capitalHoldYears,explicitYears,'capture the old hold before changing 0/3/5 explicit growth years');
  assert.equal(changed.marginMaturityYears,years);assert.equal(changed.capitalMaturityYears,years);
  assert.equal(changed.mode,requested.mode);assert.equal(changed.explicitYears,requested.explicitYears);
  assert.deepEqual(changed.subsequentGrowth,requested.subsequentGrowth);
  assert.notEqual(changed.subsequentGrowth,requested.subsequentGrowth);
  assert.deepEqual(d,before,'migration is pure');
 }
});

test('independent timelines: newly selected legacy paths use ten-year operating anchors and the requested initial hold',()=>{
 for(const oldProfile of [undefined,{schemaVersion:1,id:'linear-v1'},{schemaVersion:1,id:'aaoi-capacity-ramp-v1'}])for(const [mode,explicitYears]of paths){
  const d=draft({years:20});if(oldProfile)d.operatingProfile=oldProfile;else delete d.operatingProfile;
  const requested={mode,explicitYears,subsequentGrowth:mode==='annual'?[.2,.15,.1,.05].slice(0,explicitYears-1):[]};
  const before=structuredClone(d),p=migrate(deepFreeze(d),deepFreeze(requested));
  assert.equal(p.schemaVersion,2);assert.equal(p.marginMaturityYears,10);assert.equal(p.capitalMaturityYears,10);
  assert.equal(p.capitalHoldYears,explicitYears);assert.equal(p.mode,mode);assert.equal(p.explicitYears,explicitYears);
  assert.deepEqual(p.subsequentGrowth,requested.subsequentGrowth);assert.notEqual(p.subsequentGrowth,requested.subsequentGrowth);
  assert.deepEqual(d,before);
 }
});

test('independent timelines: v2 mode and explicit-length edits never rewrite existing operating anchors',()=>{
 const d=deepFreeze(draft({years:15,marginMaturityYears:7,capitalMaturityYears:23,capitalHoldYears:12}));
 const copy=migrate(d);assert.deepEqual(copy,d.operatingProfile);assert.notEqual(copy,d.operatingProfile);
 copy.subsequentGrowth[0]=.99;assert.equal(d.operatingProfile.subsequentGrowth[0],.31);
 for(const [mode,explicitYears]of paths){
  const requested={mode,explicitYears,subsequentGrowth:mode==='annual'?[.2,.15,.1,.05].slice(0,explicitYears-1):[]};
  const p=migrate(d,requested);
  for(const key of ['marginMaturityYears','capitalMaturityYears','capitalHoldYears'])assert.equal(p[key],d.operatingProfile[key]);
  assert.equal(p.mode,mode);assert.equal(p.explicitYears,explicitYears);
  assert.deepEqual(p.subsequentGrowth,requested.subsequentGrowth);
 }
});

test('independent timelines: 15→20→15 changes only growth and restores exact values and draws',()=>{
 const s=snapshot(),d=draft({years:15,schemaVersion:1});d.operatingProfile=migrate(d);
 const p=structuredClone(d.operatingProfile),original=calculateCurrent(s,d),config=simulationConfig(),simulation=simulateCurrent(s,d,config);
 d.assumptions.years=20;d.operatingProfile=migrate(d);
 const longer=calculateCurrent(s,d);
 assert.equal(longer.rows.length,20);assert.deepEqual(d.operatingProfile,p);
 for(let i=0;i<15;i++){
  assert.equal(longer.rows[i].margin,original.rows[i].margin,'growth endpoint never retimes margins');
  assert.equal(longer.operatingProfile.annualPath[i].salesCapital,original.operatingProfile.annualPath[i].salesCapital,'growth endpoint never retimes capital intensity');
 }
 d.assumptions.years=15;d.operatingProfile=migrate(d);
 assert.deepEqual(calculateCurrent(s,d),original);assert.deepEqual(simulateCurrent(s,d,config),simulation);
});

test('independent timelines: every missing, nonfinite, noninteger or out-of-range anchor fails closed before and after restore',()=>{
 const invalid=[undefined,null,'10','',true,NaN,Infinity,-Infinity,0,-1,1.5,31];
 const {company,raw}=context();
 const assertRejected=(d,label)=>{
  assert.ok(currentIssues(snapshot(),d).length,label+' direct issue');
  assert.throws(()=>calculateCurrent(snapshot(),d),undefined,label+' direct');
  const source=saved({...d,ticker:company.ticker,snapshotId:raw.id});
  const restored=safeDraft(source,company,raw,{baseCases:research});
  assert.deepEqual(restored.operatingProfile,source.operatingProfile,label+' restore does not repair or migrate');
  assert.throws(()=>calculateCurrent(currentSnapshot(company,raw),restored),undefined,label+' restored');
  assert.throws(()=>simulateCurrent(currentSnapshot(company,raw),restored,{trials:2}),undefined,label+' simulation');
  assert.throws(()=>freezeCurrent(currentSnapshot(company,raw),restored),undefined,label+' export');
 };
 for(const key of ['marginMaturityYears','capitalMaturityYears'])for(const value of invalid){
  const d=draft();if(value===undefined)delete d.operatingProfile[key];else d.operatingProfile[key]=value;
  assertRejected(d,`${key}=${String(value)}`);
 }
 for(const value of [undefined,null,'3','',true,NaN,Infinity,-Infinity,-1,.5,10,11,30]){
  const d=draft();if(value===undefined)delete d.operatingProfile.capitalHoldYears;else d.operatingProfile.capitalHoldYears=value;
  assertRejected(d,`capitalHoldYears=${String(value)}`);
 }
 for(const patch of [{schemaVersion:3},{schemaVersion:'2'},{surpriseAnchor:1},{explicitYears:4},{mode:'yearly'},{subsequentGrowth:[.1]}]){
  const d=draft();Object.assign(d.operatingProfile,patch);assertRejected(d,JSON.stringify(patch));
 }
 for(const years of [0,5,11,30,'15',NaN]){const d=draft();d.assumptions.years=years;assertRejected(d,`growth endpoint ${years}`);}
});

test('independent timelines: seeded Monte Carlo independently matches every mode when forecast and growth endpoints differ',()=>{
 for(const [mode,explicitYears]of paths)for(const anchors of timelineCases){
  const s=deepFreeze(snapshot()),d=deepFreeze(draft({mode,explicitYears,...anchors})),config=deepFreeze(simulationConfig());
  const before=JSON.stringify({s,d,config}),result=assertSimulation(s,d,config);
  assert.equal(result.accepted,config.trials);
  assert.equal(result.baseline.assumptions.years,anchors.years,'sampling retains the growth endpoint');
  assert.equal(result.baseline.rows.length,Math.max(anchors.years,anchors.marginMaturityYears,anchors.capitalMaturityYears));
  assert.deepEqual(simulateCurrent(s,d,config),result,'same seed and state reproduce all output');
  assert.equal(JSON.stringify({s,d,config}),before,'MC never retimes or mutates a saved profile');
 }
});

test('independent timelines: mixed path and terminal rejections consume exactly four original draws per attempted trial',()=>{
 const s=snapshot(),d=draft({years:10,marginMaturityYears:23,capitalMaturityYears:17,capitalHoldYears:8});
 d.assumptions.growth=.2;d.operatingProfile.subsequentGrowth=[2,.1,.2,.3];
 const config={trials:257,seed:'independent-timelines-mixed-rejections',drivers:{growth:{type:'uniform',low:0,high:.4},wacc:{type:'uniform',low:.01,high:.14}}};
 const result=assertSimulation(s,d,config);
 assert.ok(result.accepted>0&&result.excluded>0);
 assert.ok(result.exclusions['terminal-constraints']>0);assert.ok(result.exclusions['valuation-rejected']>0);
 const shorter=structuredClone(d);shorter.operatingProfile.marginMaturityYears=3;shorter.operatingProfile.capitalMaturityYears=9;
 const changed=assertSimulation(s,shorter,config);
 assert.deepEqual(changed.scenarios.map(({trial,...row})=>({trial,...Object.fromEntries(driverKeys.map(k=>[k,row[k]]))})),result.scenarios.map(({trial,...row})=>({trial,...Object.fromEntries(driverKeys.map(k=>[k,row[k]]))})),'forecast duration never consumes more random draws');
});

test('independent timelines: safeDraft, frozen export and JSON restore preserve selected schema and every fixed anchor',()=>{
 for(const ticker of ['AMZN','AAOI','GOOG'])for(const schemaVersion of [1,2]){
  const {company,raw,s,d}=context(ticker),p=draft({schemaVersion,years:10,marginMaturityYears:21,capitalMaturityYears:17,capitalHoldYears:6}).operatingProfile;
  d.operatingProfile=p;d.assumptions.years=10;
  d.notes.growth='Keep my independent path';d.simulationConfig=simulationConfig();d.waccWorksheet.beta=1.234;
  const source=deepFreeze(saved(d)),before=JSON.stringify(source),restored=safeDraft(source,company,raw,{baseCases:research});
  assert.deepEqual(restored.operatingProfile,source.operatingProfile,'reading schema 1 never upgrades to schema 2');
  for(const key of ['assumptions','notes','simulationConfig','waccWorksheet','claims'])assert.deepEqual(restored[key],source[key],`${ticker} ${key}`);
  const expected=calculateCurrent(s,d);assert.deepEqual(calculateCurrent(s,restored),expected);
  const exported=freezeCurrent(s,restored);
  assert.deepEqual(exported.draft.operatingProfile,source.operatingProfile);assert.deepEqual(exported.draft.assumptions,source.assumptions);
  assert.deepEqual(exported.result,expected);
  const imported=safeDraft(saved(exported.draft),company,raw,{baseCases:research});assert.deepEqual(calculateCurrent(s,imported),expected);
  restored.operatingProfile.subsequentGrowth[0]=.7;exported.draft.operatingProfile.subsequentGrowth[0]=.8;
  assert.equal(JSON.stringify(source),before,'restored/exported arrays are detached from input');
 }
});

test('independent timelines: AMZN reproduction distinguishes synchronized legacy maturity from extending growth alone',()=>{
 const {s,d}=context('AMZN');d.assumptions.growth=.14;d.assumptions.years=15;
 d.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode:'annual',explicitYears:5,subsequentGrowth:[.145,.145,.145,.145]};
 const original=calculateCurrent(s,d);near(original.perShare,72.70133835309879,'untouched legacy AMZN at 15 years');
 assertValuation(original,oracle(s,d),'AMZN v1 15');
 d.assumptions.years=20;const coupled=calculateCurrent(s,d);near(coupled.perShare,68.6098046347794,'untouched legacy AMZN at 20 years');
 assertValuation(coupled,oracle(s,d),'AMZN v1 20');
 assert.ok(coupled.perShare<original.perShare,'the legacy fall remains reproducible');
 d.assumptions.years=15;d.operatingProfile=migrate(d);
 assertValuation(calculateCurrent(s,d),original,'migration alone preserves AMZN');
 d.assumptions.years=20;const independent=calculateCurrent(s,d);
 near(independent.perShare,74.9180427075888,'AMZN extends growth alone to 20 years');
 assertValuation(independent,oracle(s,d),'AMZN v2 growth-only 20');
 assert.ok(independent.perShare>original.perShare);
 assert.equal(d.operatingProfile.marginMaturityYears,15);assert.equal(d.operatingProfile.capitalMaturityYears,15);assert.equal(d.operatingProfile.capitalHoldYears,5);
});

// Captured from the untouched schema-1 adapter before this schema-2 change.
// These hash financial outputs and seeded draw state, not changing source files.
const legacyGoldens=[
 [10,'immediate',0,'b3eb3edffd7fa3f3219e48c4ffbaa28a1a0bd081975410e87c5fafc4611e8de6','0d15d88b0612359453f0798feb1696875c57e607eef7a117b130023277abba72'],
 [10,'maintain',3,'27e369876620fcb6302fdc2c536586203baf549a1d08643a80a50ac004fa0384','ef70578a7826ffe3244d22b1f51548a1b22d4b854b15505b3f1b8a81043c9fc6'],
 [10,'maintain',5,'f8e9afeaeea906825be8b9d29ccfb1cf1a3f676da365e3aa4aba3cf0f05c100e','99c8390cdbe4aaa29dfa18205db26db9588a2b2dd0120b1c00253b26538acfaa'],
 [10,'annual',3,'e96704bea9dc4c34cac6758a9124a4a6fa8ee52ecbc339f0c4297503c6c48660','7f45fa4828798e3b2b37f28ea85f458520239cb8e518552aff0aa4e23fd5281b'],
 [10,'annual',5,'7f61272f56e660a9fbd4facf01728f57860392e4089bceca6c55b4bc0562a152','c35d7064597d2d2045ebdf456d1b5cad32503a81be79b875e0d424442d14617f'],
 [15,'immediate',0,'4715e5c1ae9d14417bba0d673414e912666ecd12d6eddd2053cf688401d1a790','625c06dc16e8fe7322bbf5be57c455b9ffc9d806998ae446d2d7345b019f2e4e'],
 [15,'maintain',3,'de654dc5cee4e10b3d0bfafffed044badcbb6f8a82deed55fa167ffbf61f9001','0e33f0cc17ed7a8a4315cc7b559a3eb4b4571fb5f72cac4a8329616f7faef82a'],
 [15,'maintain',5,'ac48d8f37c35644c40cdc63ae166b4699c7b22def3febcf27cc308016e6f1384','f1b7c8c11be7ddf872644b930ec6012df855cc2a4643f4b387346a1d9a94c953'],
 [15,'annual',3,'7c4be4d43c3d0e6041fd58f068c533509a64cd8ca471157485a3773a6005e229','572dfcd63eda9ad24bfe6fbcaacc7df20117576ab5b1063b09e4e32d25a27ddb'],
 [15,'annual',5,'31c2b166c2e3df8e29028b96c06eb6e625247c78f4338eb03e613e6f33bdea2f','9c07f43cf4b902afd9c1aa1e49cb50721cada092f37f797dd44fb3499d8081da'],
 [20,'immediate',0,'63408e22cc38395b5bd0b831e248bae48dcaf143684ad44a299d99283a7fe6f3','d3bd271ad82d2b1f627a50f2f0cb756903bbf7daaae2184adaa870eb3df61067'],
 [20,'maintain',3,'68f36e982409bed6bda425ba6c2141da176129a8e978cbb3a6e8eb32bdbc8404','4fb97e419cf0aed1543cb954457c90a9a6f505c802039ab672e7ee00e24311d2'],
 [20,'maintain',5,'e93bb6ee6fcc2f9d98dd2a05faaaf58f6a19d4e2fe92215840b83226cc3ff6c8','0c0f2ec8bb7b2af19feb8e1775bff80ca7e462688829cfed8f0a953cb3966b9a'],
 [20,'annual',3,'2afdd364b1a2491493b87af8c66e7957f93b25b99060c2d1549672e5f3f15bc2','057da2221d83510331608cbf42cf5b61b9ea0f0079d459c2b4878f25e8ffe883'],
 [20,'annual',5,'8f3551dc3b4cb57d54a52b55844467294e5b398ddd19e50c5005b6c6518b784b','66f4b10e8c7ca80ef5f2952b9a43ca8f5d1e502e9fbcee6997b77372369b1265']
];
test('independent timelines: all 15 schema-1 numerical results and original seeded draws remain byte-identical',()=>{
 for(const [years,mode,explicitYears,valuationHash,simulationHash]of legacyGoldens){
  const s=snapshot(),d=draft({years,mode,explicitYears,schemaVersion:1});
  const {operatingProfile,...economic}=calculateCurrent(s,d);
  assert.equal(hash(economic),valuationHash,`${years}/${mode}/${explicitYears}: legacy numerical result`);
  const {draws,scenarios,rawSamples}=simulateCurrent(s,d,simulationConfig());
  assert.equal(hash({draws,scenarios,rawSamples}),simulationHash,`${years}/${mode}/${explicitYears}: original draw state`);
  assertValuation(calculateCurrent(s,d),oracle(s,d),'independent legacy FCFF oracle');
 }
});
