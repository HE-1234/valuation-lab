// Independent mathematical oracle for the current-only flexible growth profile.
// Do not construct expected cash flows with the production operating adapter,
// engine, terminal-value helper or random-number/distribution helpers.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {calculateCurrent,currentIssues,currentSnapshot,draftFor,safeDraft,freezeCurrent,loadResearchedBaseCase} from '../dist/current-model.js';
import {operatingAssumptions} from '../dist/current-operating.js';
import {simulateCurrent} from '../dist/simulation.js';
import {valueCompany} from '../dist/engine.js';

const driverKeys=['growth','targetMargin','salesCapital','wacc'];
const horizons=[10,15,20];
const cases=horizons.flatMap(years=>[
 {mode:'immediate',explicitYears:0,years},
 ...[3,5].flatMap(explicitYears=>['maintain','annual'].map(mode=>({mode,explicitYears,years})))
]);
const near=(actual,expected,label='value',tolerance=2e-11)=>{
 assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),`${label}: expected finite values; ${actual}, ${expected}`);
 assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${label}: ${actual} != ${expected}`);
};
const snapshot=()=>({ticker:'ORACLE',currency:'USD',units:'millions',sourceUrl:'https://example.com/oracle-filing',periodEnd:'2025-12-31',filedAt:'2026-02-01',availableFrom:'2026-02-02',revenue:1200,ebit:156,cash:90,debt:170,shares:70,snapshotMode:'annual-reference',shareBasis:'period-end common',backtestEligible:false,raw:{id:'oracle-2025'}});
function draft({mode='maintain',explicitYears=3,years=10}={}){
 const d=draftFor({ticker:'ORACLE'},{id:'oracle-2025'});
 Object.assign(d,{cutoff:'2026-10-17',normalizationDelta:0});
 Object.assign(d.assumptions,{growth:.24,targetMargin:.27,tax:.23,salesCapital:2.6,wacc:.105,terminalGrowth:.025,terminalROIC:.13,years,otherClaims:11,otherAssets:17});
 d.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode,explicitYears,subsequentGrowth:mode==='annual'?[.31,-.12,.22,.08].slice(0,explicitYears-1):[]};
 return d;
}
function annualRates(d,a=d.assumptions){
 const p=d.operatingProfile,N=a.years,E=p.explicitYears,g0=a.growth,terminal=a.terminalGrowth;
 if(p.mode==='immediate')return Array.from({length:N},(_,i)=>g0+(terminal-g0)*i/(N-1));
 const shift=g0-d.assumptions.growth;
 const explicit=p.mode==='maintain'?Array(E).fill(g0):[g0,...p.subsequentGrowth.map(g=>g+shift)];
 const last=explicit.at(-1);
 return [...explicit,...Array.from({length:N-E},(_,i)=>last+(terminal-last)*(i+1)/(N-E))];
}
function oracle(s,d,a=d.assumptions){
 const p=d.operatingProfile,N=a.years,E=p.explicitYears,growth=annualRates(d,a);
 const startMargin=(s.ebit+d.normalizationDelta)/s.revenue;
 const initialIntensity=1/a.salesCapital;
 const matureIntensity=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
 let previousRevenue=s.revenue,forecastPV=0;
 const rows=growth.map((rate,index)=>{
  const year=index+1,revenue=previousRevenue*(1+rate),margin=startMargin+(a.targetMargin-startMargin)*year/N;
  const intensityProgress=E===0?year/N:year<=E?0:(year-E)/(N-E);
  const capitalIntensity=initialIntensity+(matureIntensity-initialIntensity)*intensityProgress;
  const ebit=revenue*margin,tax=Math.max(0,ebit)*a.tax,nopat=ebit-tax;
  const reinvestment=Math.max(0,revenue-previousRevenue)*capitalIntensity,fcff=nopat-reinvestment;
  const discountFactor=(1+a.wacc)**year,pv=fcff/discountFactor;
  forecastPV+=pv;previousRevenue=revenue;
  return {year,growth:rate,revenue,margin,wacc:a.wacc,discountFactor,ebit,tax,nopat,reinvestment,fcff,pv,capitalIntensity,salesCapital:1/capitalIntensity};
 });
 const terminalNopat=previousRevenue*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax);
 const terminalReinvestment=terminalNopat*a.terminalGrowth/a.terminalROIC;
 const terminalPV=(terminalNopat-terminalReinvestment)/(a.wacc-a.terminalGrowth)/(1+a.wacc)**N;
 const enterprise=forecastPV+terminalPV,equity=enterprise+s.cash+a.otherAssets-s.debt-a.otherClaims;
 return {rows,forecastPV,terminalNopat,terminalReinvestment,terminalPV,enterprise,equity,rawPerShare:equity/s.shares,perShare:Math.max(0,equity)/s.shares,terminalShare:terminalPV/enterprise};
}
function assertValuation(actual,expected,label){
 assert.equal(actual.rows.length,expected.rows.length,`${label}: forecast length`);
 for(const [index,row]of actual.rows.entries())for(const key of ['year','growth','revenue','margin','wacc','discountFactor','ebit','tax','nopat','reinvestment','fcff','pv'])near(row[key],expected.rows[index][key],`${label}: year ${index+1} ${key}`);
 for(const key of ['forecastPV','terminalNopat','terminalReinvestment','terminalPV','enterprise','equity','rawPerShare','perShare','terminalShare'])near(actual[key],expected[key],`${label}: ${key}`);
}
function independentRandom(seed){
 // Specification copy: FNV-1a followed by Mulberry32, independent of the module.
 let state=2166136261;
 for(const character of String(seed))state=Math.imul(state^character.codePointAt(0),16777619);
 return ()=>{
  state=(state+0x6D2B79F5)>>>0;
  let word=Math.imul(state^(state>>>15),1|state);
  word^=word+Math.imul(word^(word>>>7),61|word);
  return ((word^(word>>>14))>>>0)/4294967296;
 };
}
function expectedTrials(d,config){
 const random=independentRandom(config.seed),accepted=[],excluded=[];
 for(let trial=1;trial<=config.trials;trial++){
  const assumptions={...d.assumptions};
  for(const key of driverKeys){
   const u=random(),distribution=config.drivers?.[key]??{type:'fixed',value:assumptions[key]};
   assert.ok(['fixed','uniform'].includes(distribution.type),'test oracle only supports fixed/uniform drivers');
   assumptions[key]=distribution.type==='fixed'?distribution.value:distribution.low+(distribution.high-distribution.low)*u;
  }
  const rates=annualRates(d,assumptions);
  const valid=assumptions.targetMargin>0&&assumptions.wacc>assumptions.terminalGrowth&&rates.every(g=>g>=-.5&&g<=2);
  (valid?accepted:excluded).push({trial,assumptions,rates});
 }
 return {accepted,excluded};
}
function assertSimulation(s,d,config){
 const expected=expectedTrials(d,config),actual=simulateCurrent(s,d,config);
 assert.equal(actual.attempts,config.trials);
 assert.equal(actual.accepted,expected.accepted.length);
 assert.equal(actual.excluded,expected.excluded.length);
 assert.equal(actual.accepted+actual.excluded,config.trials);
 assert.equal(Object.values(actual.exclusions).reduce((sum,n)=>sum+n,0),expected.excluded.length);
 assert.deepEqual(actual.scenarios.map(s=>s.trial),expected.accepted.map(s=>s.trial),'invalid annual paths must be excluded without replacement');
 expected.accepted.forEach((draw,i)=>{
  const scenario=actual.scenarios[i],value=oracle(s,d,draw.assumptions);
  for(const key of driverKeys)assert.equal(scenario[key],draw.assumptions[key],`trial ${draw.trial}: one original draw for ${key}`);
  near(scenario.perShare,value.perShare,`trial ${draw.trial}: independent per-share oracle`);
  near(scenario.rawPerShare,value.rawPerShare,`trial ${draw.trial}: independent raw-value oracle`);
  near(actual.draws[i],value.perShare,`trial ${draw.trial}: original-order output`);
 });
 const sorted=expected.accepted.map(draw=>oracle(s,d,draw.assumptions).perShare).sort((a,b)=>a-b);
 actual.samples.forEach((v,i)=>near(v,sorted[i],`sorted sample ${i}`));
 return actual;
}
function deepFreeze(value){
 Object.freeze(value);
 for(const child of Object.values(value))if(child&&typeof child==='object')deepFreeze(child);
 return value;
}

for(const c of cases)test(`flexible oracle: ${c.mode}, ${c.explicitYears} explicit years, ${c.years}-year horizon`,()=>{
 const s=snapshot(),d=draft(c),expected=oracle(s,d),actual=calculateCurrent(s,d);
 assert.deepEqual(currentIssues(s,d),[]);
 assertValuation(actual,expected,`${c.mode}/${c.explicitYears}/${c.years}`);
 assert.equal(actual.operatingProfile.id,'flexible-growth-v1');
 assert.equal(actual.operatingProfile.annualPath.length,c.years);
 const adapted=operatingAssumptions(s,d,d.assumptions);
 for(let i=0;i<c.years;i++){
  const row=expected.rows[i],override=adapted.yearlyOverrides[i];
  near(override.growth,row.growth,`override ${i+1}: growth`);
  near(override.margin,row.margin,`override ${i+1}: margin`);
  near(override.salesCapital,row.salesCapital,`override ${i+1}: capital intensity`);
  assert.equal(override.wacc,d.assumptions.wacc,'WACC is a constant scalar in every year');
  assert.equal(override.taxRate,d.assumptions.tax);
  assert.deepEqual(actual.operatingProfile.annualPath[i],override);
 }
 near(actual.rows.at(-1).growth,d.assumptions.terminalGrowth,'maturity reached in year N');
 near(actual.rows.at(-1).margin,d.assumptions.targetMargin,'mature margin reached in year N');
 near(actual.terminalReinvestment,actual.rows.at(-1).reinvestment*(1+d.assumptions.terminalGrowth),'year N to N+1 reinvestment continuity');
 near(actual.terminalNopat-actual.terminalReinvestment,actual.rows.at(-1).fcff*(1+d.assumptions.terminalGrowth),'year N to N+1 FCFF continuity');
});

test('flexible oracle: annual year 1 is scalar, explicit year E is held, and first fade is year E+1',()=>{
 for(const E of [3,5])for(const N of horizons){
  const d=draft({mode:'annual',explicitYears:E,years:N}),a=d.assumptions;
  const value=calculateCurrent(snapshot(),d),last=d.operatingProfile.subsequentGrowth.at(-1);
  assert.equal(value.rows[0].growth,a.growth);
  d.operatingProfile.subsequentGrowth.forEach((g,i)=>assert.equal(value.rows[i+1].growth,g));
  near(value.rows[E].growth,last+(a.terminalGrowth-last)/(N-E),'first fade-year growth');
  const path=value.operatingProfile.annualPath;
  for(let i=0;i<E;i++)near(path[i].salesCapital,a.salesCapital,'explicit years retain initial productivity');
  const finalIntensity=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
  near(1/path[E].salesCapital,1/a.salesCapital+(finalIntensity-1/a.salesCapital)/(N-E),'first fade-year intensity');
 }
});

test('flexible oracle: immediate starts capital fading from year 0 but retains legacy year-1 growth',()=>{
 const d=draft({mode:'immediate',explicitYears:0,years:15}),a=d.assumptions;
 const value=calculateCurrent(snapshot(),d),path=value.operatingProfile.annualPath;
 assert.equal(value.rows[0].growth,a.growth);
 const target=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
 near(1/path[0].salesCapital,1/a.salesCapital+(target-1/a.salesCapital)/a.years);
 assert.notEqual(path[0].salesCapital,a.salesCapital);
 near(value.rows[1].growth,a.growth+(a.terminalGrowth-a.growth)/(a.years-1));
});

test('flexible oracle: already-mature business equals the closed-form growing perpetuity for all horizons',()=>{
 for(const c of cases){
  const s=snapshot(),d=draft(c),a=d.assumptions;
  Object.assign(a,{growth:.025,targetMargin:s.ebit/s.revenue});
  a.salesCapital=a.terminalROIC/((1+a.terminalGrowth)*a.targetMargin*(1-a.tax));
  d.operatingProfile.subsequentGrowth.fill(a.growth);
  const value=calculateCurrent(s,d);
  const yearOneNOPAT=s.revenue*(1+a.growth)*a.targetMargin*(1-a.tax);
  const perpetuity=yearOneNOPAT*(1-a.growth/a.terminalROIC)/(a.wacc-a.growth);
  near(value.enterprise,perpetuity,`${JSON.stringify(c)} growing perpetuity`);
 }
});

test('flexible oracle: sourced normalization drives starting margins once and preserves loss tax floor',()=>{
 for(const mode of ['immediate','maintain','annual']){
  const s={...snapshot(),ebit:-300},d=draft({mode,explicitYears:mode==='immediate'?0:5,years:20});
  Object.assign(d,{normalizationDelta:42,adjustmentReason:'Synthetic sourced adjustment',adjustmentSource:'https://example.com/normalization'});
  const result=calculateCurrent(s,d),expected=oracle(s,d);
  assertValuation(result,expected,mode+' normalized');
  assert.ok(result.rows.some(row=>row.ebit<0));
  assert.ok(result.rows.filter(row=>row.ebit<0).every(row=>row.tax===0));
  near(result.rows[0].margin,(-258/1200)+(d.assumptions.targetMargin-(-258/1200))/20);
  d.adjustmentSource='';assert.throws(()=>calculateCurrent(s,d),/adjustment|source/i);
 }
});

test('flexible oracle: declining sales do not create artificial reinvestment cash inflows',()=>{
 for(const c of cases){
  const s=snapshot(),d=draft(c);d.assumptions.growth=-.35;
  if(c.mode==='annual')d.operatingProfile.subsequentGrowth=[-.5,-.25,-.15,-.05].slice(0,c.explicitYears-1);
  const value=calculateCurrent(s,d);assertValuation(value,oracle(s,d),JSON.stringify(c)+' decline');
  const declining=value.rows.filter(row=>row.growth<0);
  assert.ok(declining.length);
  assert.ok(declining.every(row=>row.reinvestment===0));
 }
});

test('flexible oracle: zero terminal growth has zero mature reinvestment without singular capital productivity',()=>{
 const d=draft({mode:'annual',explicitYears:5,years:20});d.assumptions.terminalGrowth=0;
 const result=calculateCurrent(snapshot(),d);assertValuation(result,oracle(snapshot(),d),'zero terminal growth');
 near(result.terminalReinvestment,0);near(result.rows.at(-1).reinvestment,0);
 assert.ok(result.operatingProfile.annualPath.every(row=>Number.isFinite(row.salesCapital)&&row.salesCapital>0));
});

test('flexible oracle: scalar and annual growth bounds are distinct and exact endpoints are supported',()=>{
 for(const growth of [-.5,1]){
  const d=draft({mode:'annual',explicitYears:3,years:10});d.assumptions.growth=growth;
  d.operatingProfile.subsequentGrowth=[-.5,2];
  const result=calculateCurrent(snapshot(),d);assertValuation(result,oracle(snapshot(),d),'growth bounds');
  assert.equal(result.rows[0].growth,growth);assert.equal(result.rows[1].growth,-.5);assert.equal(result.rows[2].growth,2);
 }
 for(const growth of [-.5000001,1.0000001,NaN,Infinity,'0.1']){
  const d=draft();d.assumptions.growth=growth;assert.throws(()=>calculateCurrent(snapshot(),d),undefined,`scalar ${growth}`);
 }
 for(const growth of [-.5000001,2.0000001,NaN,Infinity,'0.1',null]){
  const d=draft({mode:'annual',explicitYears:3});d.operatingProfile.subsequentGrowth[0]=growth;
  assert.throws(()=>calculateCurrent(snapshot(),d),undefined,`annual ${growth}`);
 }
});

test('flexible oracle: malformed profiles, ambiguous overrides and unsupported horizons fail closed',()=>{
 const mutations=[
  d=>{d.operatingProfile.schemaVersion=2;},d=>{d.operatingProfile.mode='yearly';},
  d=>{d.operatingProfile.extra=true;},d=>{d.operatingProfile.explicitYears=4;},
  d=>{d.operatingProfile.explicitYears='3';},d=>{delete d.operatingProfile.subsequentGrowth;},
  d=>{d.operatingProfile.subsequentGrowth=[.1];},d=>{d.operatingProfile.subsequentGrowth='';},
  d=>{d.operatingProfile.mode='immediate';},d=>{d.operatingProfile=null;},
  d=>{d.operatingProfile=Object.assign([],d.operatingProfile);},
  d=>{d.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode:'annual',explicitYears:3,subsequentGrowth:[.1]};},
  d=>{d.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode:'annual',explicitYears:3,subsequentGrowth:[.1,.2,.3]};},
  d=>{d.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode:'annual',explicitYears:3,subsequentGrowth:Array(2)};},
  d=>{d.assumptions.yearlyOverrides=Array.from({length:10},()=>({growth:.1,margin:.2,taxRate:.23,wacc:.105,salesCapital:2}));}
 ];
 for(const [index,mutate]of mutations.entries()){const d=draft();mutate(d);assert.ok(currentIssues(snapshot(),d).length,`invalid profile mutation ${index}`);assert.throws(()=>calculateCurrent(snapshot(),d));}
 for(const years of [0,3,5,9,11,14,16,19,21,30,10.5,'15',NaN]){const d=draft();d.assumptions.years=years;assert.throws(()=>calculateCurrent(snapshot(),d),undefined,`horizon ${years}`);}
 for(const mode of ['immediate','maintain','annual'])for(const margin of [0,-.1,1.0000001,NaN]){
  const d=draft({mode,explicitYears:mode==='immediate'?0:3});d.assumptions.targetMargin=margin;
  assert.throws(()=>calculateCurrent(snapshot(),d),undefined,`${mode} mature margin ${margin}`);
 }
});

test('flexible oracle: seeded Monte Carlo independently replays all four draws and every coherent path',()=>{
 for(const c of cases){
  const s=snapshot(),d=draft(c),config={trials:43,seed:'independent-flexible-oracle',drivers:{
   growth:{type:'uniform',low:.12,high:.32},targetMargin:{type:'uniform',low:.16,high:.34},
   salesCapital:{type:'uniform',low:1.4,high:4.2},wacc:{type:'uniform',low:.075,high:.14}
  }};
  const result=assertSimulation(s,d,config);assert.equal(result.excluded,0);
  assert.deepEqual(simulateCurrent(s,d,config),result,'seeded audit output must be reproducible');
  assert.notDeepEqual(simulateCurrent(s,d,{...config,seed:'different-flexible-seed'}).samples,result.samples);
 }
});

test('flexible oracle: subsequent annual rates shift by sampled initial growth minus the baseline',()=>{
 const s=snapshot(),d=draft({mode:'annual',explicitYears:5,years:15});
 const a={...d.assumptions,growth:d.assumptions.growth+.07,targetMargin:.31,salesCapital:3.1,wacc:.12};
 const path=operatingAssumptions(s,d,a).yearlyOverrides;
 assert.equal(path[0].growth,a.growth);
 d.operatingProfile.subsequentGrowth.forEach((g,i)=>near(path[i+1].growth,g+.07,`explicit growth year ${i+2}`));
 near(path[4].growth-d.operatingProfile.subsequentGrowth[3],.07);
 near(path.at(-1).growth,a.terminalGrowth);
 const config={trials:13,seed:'fixed-shift',drivers:Object.fromEntries(driverKeys.map(k=>[k,{type:'fixed',value:a[k]}]))};
 const result=assertSimulation(s,d,config);assert.equal(new Set(result.samples).size,1);
});

test('flexible oracle: out-of-bounds annual draws are excluded exactly, with no clipping or replacement',()=>{
 for(const boundary of ['lower','upper']){
  const s=snapshot(),d=draft({mode:'annual',explicitYears:3,years:10});
  d.assumptions.growth=.2;d.operatingProfile.subsequentGrowth=boundary==='lower'?[-.5,.1]:[2,.1];
  const config={trials:251,seed:'annual-boundary-'+boundary,drivers:{growth:{type:'uniform',low:0,high:.4}}};
  const result=assertSimulation(s,d,config);
  assert.ok(result.accepted>0&&result.excluded>0);
  assert.equal(result.exclusions['valuation-rejected'],result.excluded);
  assert.match(result.warnings.join(' '),/conditional on.*valid trials/i);
  const trialIds=new Set(result.scenarios.map(s=>s.trial));
  assert.ok(Array.from({length:config.trials},(_,i)=>i+1).some(id=>!trialIds.has(id)));
 }
});

test('flexible oracle: incompatible annual bounds yield empty MC rather than repaired paths',()=>{
 const s=snapshot(),d=draft({mode:'annual',explicitYears:3,years:20});
 d.assumptions.growth=.2;d.operatingProfile.subsequentGrowth=[-.5,2];
 const result=assertSimulation(s,d,{trials:103,seed:'all-annual-paths-rejected',drivers:{growth:{type:'uniform',low:0,high:.4}}});
 assert.equal(result.status,'empty');assert.equal(result.accepted,0);assert.equal(result.excluded,103);
 assert.deepEqual(result.samples,[]);assert.deepEqual(result.scenarios,[]);assert.equal(result.median,null);
});

test('flexible oracle: a sampled zero mature margin is rejected, never silently made positive',()=>{
 const d=draft(),result=assertSimulation(snapshot(),d,{trials:19,seed:'zero-mature-margin',drivers:{targetMargin:{type:'fixed',value:0}}});
 assert.equal(result.status,'empty');assert.equal(result.exclusions['valuation-rejected'],19);
});

test('flexible oracle: terminal-constraint exclusions and annual-path exclusions consume the original draws',()=>{
 const s=snapshot(),d=draft({mode:'annual',explicitYears:5,years:15});
 d.assumptions.growth=.2;d.operatingProfile.subsequentGrowth=[2,.1,.2,.3];
 const result=assertSimulation(s,d,{trials:257,seed:'mixed-rejections',drivers:{growth:{type:'uniform',low:0,high:.4},wacc:{type:'uniform',low:.01,high:.08}}});
 assert.ok(result.exclusions['terminal-constraints']>0);assert.ok(result.exclusions['valuation-rejected']>0);
 assert.ok(result.accepted>0);
});

test('flexible oracle: normalization, long horizon and the equity zero floor survive Monte Carlo',()=>{
 const s={...snapshot(),ebit:-240,debt:1e9},d=draft({mode:'annual',explicitYears:5,years:20});
 Object.assign(d,{normalizationDelta:60,adjustmentReason:'Synthetic normalization',adjustmentSource:'https://example.com/adjustment'});
 const result=assertSimulation(s,d,{trials:37,seed:'normalized-long-horizon',drivers:{growth:{type:'uniform',low:.1,high:.3}}});
 assert.equal(result.zeroEquityCount,37);assert.ok(result.samples.every(v=>v===0));assert.ok(result.rawSamples.every(v=>v<0));
});

test('flexible oracle: linked sampling remains reproducible and each accepted draw replays the independent FCFF oracle',()=>{
 const s=snapshot(),d=draft({mode:'annual',explicitYears:5,years:20}),config={trials:151,seed:'linked-flexible',dependence:'operating-linked',drivers:{
  growth:{type:'uniform',low:.1,high:.3},targetMargin:{type:'uniform',low:.16,high:.34},
  salesCapital:{type:'uniform',low:1.4,high:4.2},wacc:{type:'uniform',low:.075,high:.14}
 }};
 const result=simulateCurrent(s,d,config);assert.equal(result.accepted,151);assert.deepEqual(simulateCurrent(s,d,config),result);
 for(const row of result.scenarios){const a={...d.assumptions,...Object.fromEntries(driverKeys.map(k=>[k,row[k]]))};near(row.perShare,oracle(s,d,a).perShare,`linked trial ${row.trial}`);}
});

test('flexible oracle: exact profile and 10/15/20-year horizon persist through draft restore and freeze',()=>{
 for(const c of cases){
  const d=draft(c),s=snapshot(),restored=safeDraft(structuredClone(d),{ticker:'ORACLE'},s.raw);
  assert.deepEqual(restored.operatingProfile,d.operatingProfile);assert.equal(restored.assumptions.years,c.years);
  assertValuation(calculateCurrent(s,restored),oracle(s,d),'restored '+JSON.stringify(c));
  const frozen=freezeCurrent(s,restored);
  assert.deepEqual(frozen.draft.operatingProfile,d.operatingProfile);assert.equal(frozen.draft.assumptions.years,c.years);
  assertValuation(frozen.result,oracle(s,d),'frozen '+JSON.stringify(c));
 }
});

test('flexible oracle: malformed saved flexible assumptions remain invalid rather than silently resetting',()=>{
 const s=snapshot();
 for(const [key,value]of [['years',14],['years','15'],['growth',null],['growth',NaN],['growth',Infinity],['growth','0.2'],['targetMargin',0],['salesCapital',-1],['wacc',0]]){
  const d=draft({mode:'annual',explicitYears:5,years:20});d.assumptions[key]=value;
  const restored=safeDraft(d,{ticker:'ORACLE'},s.raw);
  assert.deepEqual(restored.assumptions[key],value,`saved ${key} must not be silently replaced`);
  assert.deepEqual(restored.operatingProfile,d.operatingProfile);
  assert.throws(()=>calculateCurrent(s,restored),undefined,`invalid saved ${key}`);
 }
 const d=draft();d.assumptions.yearlyOverrides=Array.from({length:10},()=>({growth:.1,margin:.2,taxRate:.23,wacc:.105,salesCapital:2}));
 const restored=safeDraft(d,{ticker:'ORACLE'},s.raw);
 assert.deepEqual(restored.assumptions.yearlyOverrides,d.assumptions.yearlyOverrides);
 assert.throws(()=>calculateCurrent(s,restored),/override/i);
});

test('flexible oracle: explicit research reload restores its original path without mutating the undo draft',()=>{
 const s=snapshot(),company={ticker:'ORACLE'},before=draft({mode:'annual',explicitYears:5,years:20});
 const assumptions={...before.assumptions,years:10,growth:.09};
 const library={schemaVersion:1,version:'synthetic-oracle-v1',asOf:'2026-10-17',sources:{filing:{title:'Synthetic original filing',url:s.sourceUrl}},companies:{ORACLE:{ticker:'ORACLE',snapshotId:s.raw.id,asOf:'2026-10-17',summary:'Synthetic dated research case',assumptions,rationale:Object.fromEntries(Object.keys(assumptions).map(k=>[k,'Synthetic assumption for '+k])),sourceIds:['filing']}}};
 before.notes.growth='Preserve my thesis';before.simulationConfig={trials:20,seed:'preserve-me'};
 const undo=structuredClone(before),loaded=loadResearchedBaseCase(before,company,s.raw,library);
 assert.deepEqual(before,undo,'research load is pure');assert.equal(loaded.operatingProfile,undefined);
 assert.deepEqual(loaded.assumptions,assumptions);assert.deepEqual(loaded.notes,before.notes);assert.deepEqual(loaded.simulationConfig,before.simulationConfig);
 assert.deepEqual(calculateCurrent(s,loaded),valueCompany({...s,provisionalBridge:true},assumptions));
 const restored=safeDraft(undo,company,s.raw,{baseCases:library});
 assert.deepEqual(restored.operatingProfile,undo.operatingProfile);assert.deepEqual(restored.assumptions,undo.assumptions);
 assertValuation(calculateCurrent(s,restored),oracle(s,undo),'restored research-load undo');
 library.companies.ORACLE.operatingProfile={schemaVersion:1,id:'linear-v1'};
 assert.deepEqual(loadResearchedBaseCase(before,company,s.raw,library).operatingProfile,library.companies.ORACLE.operatingProfile);
});

test('flexible oracle: choosing a new operating path never bypasses source or specialist-model gates',()=>{
 for(const patch of [{ticker:'NBIS'},{ticker:'TSM'},{sector:'Banking'},{modelType:'specialist'},{snapshotMode:'latest-quarter'},{shareBasis:''},{raw:{id:'oracle-2025',fatalBlockers:['Unresolved source claim']}}]){
  const s={...snapshot(),...patch},d=draft({mode:'annual',explicitYears:5,years:20});
  assert.ok(currentIssues(s,d).length);assert.throws(()=>calculateCurrent(s,d));assert.throws(()=>simulateCurrent(s,d,{trials:3}));
 }
});

test('flexible oracle: AAOI and GOOG keep their independently calculated claims on flexible deterministic and sampled paths',()=>{
 const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
 const universe=read('../dist/data/current-universe.json'),facts=read('./fixtures/special-claims-source-facts.json');
 const dividendDates=['2026-08-15','2026-11-15','2027-02-15','2027-05-15','2027-08-15','2027-11-15','2028-02-15','2028-05-15','2028-08-15','2028-11-15','2029-02-15','2029-05-15'];
 const commonValue=(s,d,a)=>{
  const operating=oracle(s,d,a);let rawPerShare;
  if(s.ticker==='AAOI'){
   const f=facts.AAOI[s.periodEnd],w=facts.AAOI.customerWarrant;
   const equityBeforeWarrants=operating.enterprise+s.cash+a.otherAssets-f.bankDebt-a.otherClaims-f.bankAcceptancePayable-f.noteFairValue;
   rawPerShare=equityBeforeWarrants/f.periodEndCommonShares>w.exercisePrice
    ?(equityBeforeWarrants+w.maximumShares*w.exercisePrice)/(f.periodEndCommonShares+w.maximumShares)
    :equityBeforeWarrants/f.periodEndCommonShares;
  }else{
   const f=facts.GOOG;
   const dividendPV=dividendDates.reduce((sum,date,i)=>sum+f.preferredShares*(i?f.liquidationPreferencePerPreferred*f.couponRate/4:f.firstDividendPerPreferred)/(1+f.couponRate)**((Date.parse(date)-Date.parse(f.periodEnd))/(365.25*86400000)),0);
   const equity=operating.enterprise+s.cash+a.otherAssets+f.noncurrentInvestments-s.debt-a.otherClaims-f.financeLeaseLiability-f.noncontrollingInterestsIncludingRedeemable-dividendPV;
   rawPerShare=equity/(f.periodEndCommonShares+f.totalMaximumCommonShares);
  }
  return {...operating,rawPerShare,perShare:Math.max(0,rawPerShare)};
 };
 for(const ticker of ['AAOI','GOOG'])for(const mode of ['immediate','maintain','annual']){
  const company=universe.companies.find(c=>c.ticker===ticker),raw=company.snapshots.find(r=>r.id===company.currentSnapshotId),s=currentSnapshot(company,raw);
  const flexibleDraft=draft({mode,explicitYears:mode==='immediate'?0:5,years:20});
  const d={...draftFor(company,raw),cutoff:universe.asOf,assumptions:flexibleDraft.assumptions,operatingProfile:flexibleDraft.operatingProfile};
  const value=calculateCurrent(s,d),expected=commonValue(s,d,d.assumptions);
  for(const key of ['enterprise','forecastPV','terminalPV','terminalNopat','terminalReinvestment','perShare','rawPerShare'])near(value[key],expected[key],`${ticker}/${mode} ${key}`);
  assert.equal(value.claimsBridge.method,ticker==='AAOI'?'fair-value':'if-converted');
  const config={trials:29,seed:'flexible-claims-'+ticker+mode,drivers:{growth:{type:'uniform',low:.05,high:.45},targetMargin:{type:'uniform',low:.1,high:.35}}};
  const result=simulateCurrent(s,d,config),expectedDraws=expectedTrials(d,config);assert.equal(result.accepted,29);
  for(const [i,trial]of result.scenarios.entries()){
   const expected=commonValue(s,d,expectedDraws.accepted[i].assumptions);
   near(trial.perShare,expected.perShare,`${ticker}/${mode} draw ${trial.trial}`);
   near(trial.rawPerShare,expected.rawPerShare,`${ticker}/${mode} raw draw ${trial.trial}`);
  }
 }
});

test('flexible oracle: protected engine is unchanged and legacy profiles retain legacy economics',()=>{
 const engine=fs.readFileSync(new URL('../dist/engine.js',import.meta.url));
 assert.equal(createHash('sha256').update(engine).digest('hex'),'3229a8fcc63a64b34051be19e375484445878c9cd7ada030fa8b3397dac8e8f7');
 for(const profile of [undefined,{schemaVersion:1,id:'linear-v1'}]){
  const s=snapshot(),d=draft();if(profile)d.operatingProfile=profile;else delete d.operatingProfile;
  const actual=calculateCurrent(s,d),expected=valueCompany({...s,provisionalBridge:true},d.assumptions);
  assert.deepEqual(actual,expected);
 }
});

test('flexible oracle: path construction, deterministic results and simulations never mutate source inputs',()=>{
 const s=deepFreeze(snapshot()),d=deepFreeze(draft({mode:'annual',explicitYears:5,years:20}));
 const config=deepFreeze({trials:17,seed:'frozen-flexible',drivers:{growth:{type:'uniform',low:.1,high:.3}}});
 const before=JSON.stringify({s,d,config}),value=calculateCurrent(s,d);
 assertSimulation(s,d,config);assert.equal(JSON.stringify({s,d,config}),before);
 value.operatingProfile.annualPath[1].growth=999;
 assert.equal(d.operatingProfile.subsequentGrowth[0],.31);
 assert.notEqual(calculateCurrent(s,d).operatingProfile.annualPath[1].growth,999);
});
