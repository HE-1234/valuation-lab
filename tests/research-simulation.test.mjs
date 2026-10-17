import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchDraftFor,calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {createSeededRandom,distributionQuantile} from '../dist/simulation.js';
import {simulationResearchDefaults,validateResearchSimulationConfig,researchStressDraft,simulateResearch,simulateResearchAsync,RESEARCH_SIMULATION_DRIVER_KEYS} from '../dist/research-simulation.js';
const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const company=ticker=>companies.find(c=>c.ticker===ticker);
const draft=ticker=>researchDraftFor(company(ticker));
const near=(a,b,label='')=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=Math.max(1,Math.abs(b))*2e-12,`${label}: ${a} != ${b}`);
const fixed=(stress={},rest={})=>({trials:5,seed:'independent-oracle',...rest,drivers:Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,{type:'fixed',value:{growthPremium:0,marginShift:0,investmentMultiplier:1,waccShift:0,...stress}[k]}]))});
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze)}return value;};

// Independent economics from source fields, without calling any production
// transform, DCF, timing, distribution or claims function for expected values.
function oracle(c,stress,policy){
 let revenue=c.anchor.revenue,reviewedPrior=c.anchor.revenue,discount=1,presentValue=0,cumulative=0,trough=0;
 const n=c.annual.length;
 const rows=c.annual.map((r,i)=>{
  const growth=r.revenue/reviewedPrior-1+stress.growthPremium*(n>1?(n-i-1)/(n-1):0);
  revenue*=1+growth;reviewedPrior=r.revenue;
  const margin=r.operatingMargin+stress.marginShift,ebit=revenue*margin,tax=ebit>0?ebit*r.taxRate:0,nopat=ebit-tax;
  const reinvestment=r.reinvestment*stress.investmentMultiplier*(policy==='revenue-scaled'?revenue/r.revenue:1),fcff=nopat-reinvestment;
  discount*=1+r.wacc+stress.waccShift;presentValue+=fcff/discount;cumulative+=fcff;trough=Math.min(trough,cumulative);
  return {revenue,growth,margin,reinvestment,wacc:r.wacc+stress.waccShift,fcff};
 });
 const t=c.terminal,terminalRevenue=revenue*(1+t.growth),terminalNopat=terminalRevenue*(t.operatingMargin+stress.marginShift)*(1-t.taxRate);
 const terminalInvestment=terminalNopat*t.growth/t.ROIC,terminalFCFF=terminalNopat-terminalInvestment;
 const terminalPV=terminalFCFF/(t.wacc+stress.waccShift-t.growth)/discount;
 return {rows,enterprise:presentValue+terminalPV,forecastPV:presentValue,terminalPV,peakEconomicDeficit:-trough,terminalInvestment};
}

test('annual simulation: defaults assign no invented ranges or stress correlations',()=>{
 const c=simulationResearchDefaults();
 assert.deepEqual(c.drivers,{growthPremium:{type:'fixed',value:0},marginShift:{type:'fixed',value:0},investmentMultiplier:{type:'fixed',value:1},waccShift:{type:'fixed',value:0}});
 assert.equal(c.capitalPolicy,'fixed-schedule');assert.equal(c.dependence,'independent');
 assert.deepEqual(validateResearchSimulationConfig({}).drivers,c.drivers);
 c.drivers.growthPremium.value=1;assert.equal(simulationResearchDefaults().drivers.growthPremium.value,0);
});

for(const c of companies)test(`annual simulation: ${c.ticker} Fixed defaults reproduce its exact reviewed annual value`,()=>{
 const d=freeze(researchDraftFor(c)),before=JSON.stringify(d),expected=calculateResearchOperating(d),r=simulateResearch(d,{trials:5});
 assert.equal(JSON.stringify(d),before);assert.deepEqual(r.baseline.operating,expected);
 assert.equal(r.accepted,5);assert.equal(r.excluded,0);assert.equal(r.mean,expected.enterprise);
 assert.ok(r.samples.every(v=>v===expected.enterprise));assert.equal(r.median,expected.enterprise);
 assert.ok(Object.values(r.quantiles).every(v=>v===expected.enterprise));
 assert.deepEqual(r.histogram,[{low:expected.enterprise,high:expected.enterprise,count:5,share:1}]);
 assert.equal(r.basis,'enterprise');assert.equal(r.units.financials,'millions');
 const b=calculateResearchBridge(d,expected.enterprise,{calculationDate:d.discountOrigin});
 assert.equal(r.bridgeCoverage.complete,b.eligible);assert.equal(r.bridgeCoverage.eligible,b.eligible?5:0);
 if(b.eligible){
  assert.ok(r.perShare.samples.every(v=>v===b.rawPerShare));assert.ok(r.equity.samples.every(v=>v===b.equity));
  assert.equal(r.perShare.median,b.rawPerShare);assert.equal(r.perShare.units,c.ticker==='TSM'?'TWD per ordinary share':'USD per common share');
 }else{assert.equal(r.perShare.accepted,0);assert.equal(r.perShare.median,null);assert.equal(r.bridgeCoverage.blocked,5);assert.ok(Object.keys(r.bridgeCoverage.reasons).length);}
 assert.equal(r.timing.status,'origin');assert.equal(r.timing.date,d.discountOrigin);
 assert.equal(r.quote.status,'blocked');
});

test('annual simulation: zero growth stress preserves every reviewed input bit for bit under both capital policies',()=>{
 for(const c of companies)for(const policy of ['fixed-schedule','revenue-scaled']){
  const d=researchDraftFor(c),replayed=researchStressDraft(d,{},policy);
  assert.deepEqual(replayed.annual,d.annual);assert.deepEqual(replayed.terminal,d.terminal);assert.deepEqual(replayed.anchor,d.anchor);
  assert.notEqual(replayed.anchor,d.anchor);assert.notEqual(replayed.annual,d.annual);
 }
});

test('annual simulation: independent nonzero four-stress oracle covers 14 complete paths and both capital policies',()=>{
 const stress={growthPremium:.02,marginShift:-.015,investmentMultiplier:1.13,waccShift:.007};
 for(const c of companies)for(const policy of ['fixed-schedule','revenue-scaled']){
  const d=researchDraftFor(c),expected=oracle(c,stress,policy),path=researchStressDraft(d,stress,policy),r=simulateResearch(d,fixed(stress,{capitalPolicy:policy,trials:2}));
  assert.equal(path.annual.length,c.forecastHorizonYears);assert.equal(r.accepted,2);
  near(r.median,expected.enterprise,c.ticker+' '+policy);
  near(r.scenarios[0].forecastPV,expected.forecastPV);near(r.scenarios[0].terminalPV,expected.terminalPV);
  near(r.scenarios[0].peakEconomicDeficit,expected.peakEconomicDeficit);
  for(let i=0;i<c.annual.length;i++)for(const key of ['revenue','margin','reinvestment','wacc'])near(path.annual[i][key],expected.rows[i][key],`${c.ticker} ${i} ${key}`);
  const n=c.annual.length,finalGrowth=path.annual[n-1].revenue/path.annual[n-2].revenue-1,reviewedFinal=c.annual[n-1].revenue/c.annual[n-2].revenue-1;
  near(finalGrowth,reviewedFinal,'premium is zero in final explicit year');
 }
});

test('annual simulation: explicit investment stress leaves terminal g/ROIC unchanged and preserves down-year investment',()=>{
 const d=draft('MU'),base=calculateResearchOperating(d),stress={investmentMultiplier:1.6};
 const path=researchStressDraft(d,stress),actual=calculateResearchOperating(path);
 let prior=d.anchor.revenue,downYears=0;
 for(let i=0;i<d.annual.length;i++){
  if(d.annual[i].revenue<prior){downYears++;assert.ok(d.annual[i].reinvestment>0);assert.equal(path.annual[i].reinvestment,d.annual[i].reinvestment*1.6);}
  prior=d.annual[i].revenue;
 }
 assert.ok(downYears>0);
 for(const key of ['revenue','ebit','nopat','reinvestment','fcff','value','pv','discountFactor'])assert.equal(actual.terminal[key],base.terminal[key]);
 assert.notEqual(actual.terminal.fcffGrowth,base.terminal.fcffGrowth);
 let discount=1,extraPV=0;
 for(const r of d.annual){discount*=1+r.wacc;extraPV+=r.reinvestment*.6/discount;}
 near(actual.enterprise,base.enterprise-extraPV);
 d.annual[0].reinvestment=-1200;
 for(const policy of ['fixed-schedule','revenue-scaled']){
  const p=researchStressDraft(d,{growthPremium:-.03,investmentMultiplier:1.5},policy);
  assert.ok(p.annual[0].reinvestment<0);
  near(p.annual[0].reinvestment,-1800*(policy==='revenue-scaled'?p.annual[0].revenue/d.annual[0].revenue:1));
  assert.equal(simulateResearch(d,fixed({growthPremium:-.03,investmentMultiplier:1.5},{capitalPolicy:policy})).accepted,5);
 }
});

test('annual simulation: no extra opening debt is invented for funding deficits',()=>{
 for(const ticker of ['AMZN','GOOG','META','TSLA','COHR']){
  const d=draft(ticker),r=simulateResearch(d,fixed({investmentMultiplier:1.3})),s=r.scenarios[0];
  assert.ok(s.peakEconomicDeficit>0);
  const b=calculateResearchBridge(d,s.enterprise,{calculationDate:d.discountOrigin});
  assert.equal(s.equity,b.equity);assert.equal(s.rawPerShare,b.rawPerShare);
  assert.equal(s.claims.claimTotal,b.claimTotal);
 }
});

test('annual simulation: signed negative EV and common allocations remain unclipped',()=>{
 const nbis=simulateResearch(draft('NBIS'),{trials:3});assert.ok(nbis.samples.every(v=>v<0));assert.equal(nbis.histogram[0].count,3);
 const d=draft('TSLA'),r=simulateResearch(d,fixed({investmentMultiplier:20}));
 assert.equal(r.excluded,0);assert.ok(r.samples.every(v=>v<0));assert.ok(r.equity.samples.every(v=>v<0));assert.ok(r.perShare.samples.every(v=>v<0));
 assert.deepEqual(r.perShare.rawSamples,r.perShare.samples);assert.equal(r.zeroEquityCount,5);assert.equal(r.zeroEquityShare,1);
});

test('annual simulation: claim gates and invalid bridge inputs withhold common equity only',()=>{
 const lite=draft('LITE');assert.equal(simulateResearch(lite,{trials:2}).bridgeCoverage.complete,false);
 lite.bridgeInputs={convertiblePremiumClaim:0};assert.equal(simulateResearch(lite,{trials:2}).bridgeCoverage.complete,true);
 const aapl=draft('AAPL');aapl.bridgeInputs={additionalClaimAllowance:-1};
 const r=simulateResearch(aapl,{trials:2});assert.equal(r.accepted,2);assert.equal(r.perShare.accepted,0);assert.equal(r.baseline.bridge.status,'invalid');
 for(const ticker of ['AAOI','NBIS']){
  const d=draft(ticker);d.bridgeInputs={additionalClaimAllowance:0,additionalDilutionShares:0};
  const blocked=simulateResearch(d,{trials:2});assert.equal(blocked.accepted,2);assert.equal(blocked.bridgeCoverage.complete,false);assert.equal(blocked.perShare.median,null);
 }
});

test('annual simulation: explicit timing applies per trial, fixes the stub, and incomplete timing fails closed',()=>{
 const stress={growthPremium:.01,marginShift:.02,waccShift:.005,investmentMultiplier:1.1};
 for(const ticker of ['AAPL','AAOI']){
  const d=draft(ticker);d.timing={...d.timing,mode:'as-of-scenario',asOf:'2026-10-17',stubFCFF:123.4,stubDiscountRate:.12,reason:'Explicit test timing assumption'};
  const path=researchStressDraft(d,stress),o=calculateResearchOperating(path),expected=researchTimingResult(path,o),r=simulateResearch(d,fixed(stress));
  assert.equal(r.median,expected.enterprise);assert.equal(r.timing.status,'scenario');assert.equal(r.timing.date,'2026-10-17');
  assert.equal(r.scenarios[0].originEnterprise,o.enterprise);assert.equal(r.baseline.timing.stubFCFF,123.4);
  assert.equal(r.baseline.bridge.calculationDate,'2026-10-17');
  d.timing.stubFCFF=null;assert.throws(()=>simulateResearch(d,{trials:2}),/Enter and explain/);
 }
});

const variedConfig=()=>({trials:150,seed:'research-repeatability',binCount:12,capitalPolicy:'revenue-scaled',drivers:{
 growthPremium:{type:'triangular',low:-.03,mode:.005,high:.04},marginShift:{type:'normal',mean:0,sd:.03,low:-.05,high:.05},
 investmentMultiplier:{type:'uniform',low:.7,high:1.4},waccShift:{type:'fixed',value:.005}}});

test('annual simulation: seeded vectors reuse every distribution family and preserve reproducibility',()=>{
 const d=freeze(draft('GOOG')),config=freeze(variedConfig()),before=JSON.stringify({d,config}),a=simulateResearch(d,config),b=simulateResearch(d,config);
 assert.deepEqual(a,b);assert.equal(JSON.stringify({d,config}),before);assert.notDeepEqual(a.samples,simulateResearch(d,{...config,seed:'other'}).samples);
 const random=createSeededRandom(config.seed);
 for(const s of a.scenarios){
  for(const key of RESEARCH_SIMULATION_DRIVER_KEYS)assert.equal(s[key],distributionQuantile(random(),config.drivers[key]));
  const replay=calculateResearchOperating(researchStressDraft(d,Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,s[k]])),config.capitalPolicy));
  assert.equal(s.enterprise,replay.enterprise);
 }
 assert.equal(a.histogram.reduce((sum,b)=>sum+b.count,0),a.accepted);near(a.histogram.reduce((sum,b)=>sum+b.share,0),1);
});

test('annual simulation: terminal constraint exclusions consume exactly requested trials without redraw',()=>{
 const d=draft('AAPL'),config=fixed({}, {trials:250,seed:'terminal-exclusions'});
 config.drivers.waccShift={type:'uniform',low:-.1,high:.01};
 const r=simulateResearch(d,config),random=createSeededRandom(config.seed),expected=[];let excluded=0;
 for(let i=0;i<config.trials;i++){
  const s=Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,distributionQuantile(random(),config.drivers[k])]));
  if(d.terminal.wacc+s.waccShift<=d.terminal.growth)excluded++;
  else expected.push({trial:i+1,...s});
 }
 assert.ok(excluded>0&&excluded<config.trials);assert.equal(r.exclusions['terminal-constraints'],excluded);
 assert.equal(r.attempts,config.trials);assert.equal(r.accepted+r.excluded,config.trials);
 assert.deepEqual(r.scenarios.map(s=>Object.fromEntries(['trial',...RESEARCH_SIMULATION_DRIVER_KEYS].map(k=>[k,s[k]]))),expected);
 assert.match(r.warnings.join(' '),/excluded without replacement/);assert.match(r.warnings.join(' '),/conditional on the .* valid operating trials/);
});

test('annual simulation: invalid annual paths and nonfinite outcomes are excluded instead of clipped',()=>{
 const d=draft('AAPL');
 for(const [stress,reason] of [[{growthPremium:-2},'annual-constraints'],[{waccShift:-.5},'terminal-constraints'],[{marginShift:1},'terminal-constraints'],[{investmentMultiplier:1e308},'nonfinite-valuation']]){
  const r=simulateResearch(d,fixed(stress,{trials:7}));assert.equal(r.status,'empty');assert.equal(r.exclusions[reason],7);assert.equal(r.accepted,0);
  assert.equal(r.median,null);assert.equal(r.mean,null);assert.deepEqual(r.histogram,[]);assert.deepEqual(r.samples,[]);assert.equal(r.bridgeCoverage.complete,false);
  assert.ok(Object.values(r.quantiles).every(v=>v===null));
 }
});

test('annual simulation: malformed configurations and incompatible scalar keys fail before sampling',()=>{
 const invalid=[{trials:0},{trials:50001},{trials:1.5},{binCount:0},{binCount:201},{seed:''},{seed:NaN},{seed:1.1},{dependence:'operating-linked'},{capitalPolicy:'automatic-release'},{valueBasis:'perShare'},{typo:true},{drivers:{growth:{type:'fixed',value:0}}},{drivers:{investmentMultiplier:{type:'fixed',value:-1}}},{drivers:{growthPremium:{type:'fixed',value:'0'}}},{drivers:{marginShift:{type:'uniform',low:1,high:0}}},{drivers:{waccShift:{type:'normal',mean:0,sd:0,low:-.01,high:.01}}}];
 for(const c of invalid)assert.throws(()=>validateResearchSimulationConfig(c),undefined,JSON.stringify(c));
 assert.equal(validateResearchSimulationConfig({seed:0,trials:50000}).seed,'0');
 assert.equal(validateResearchSimulationConfig({drivers:{growthPremium:{type:'fixed',value:-2}}}).drivers.growthPremium.value,-2);
 assert.throws(()=>simulateResearch({...draft('AAPL'),annual:[]},{trials:1}),/annual schedule|horizon/);
});

test('annual simulation: saved config is used only when no explicit config is supplied',()=>{
 const d=draft('AAPL');d.researchSimulationConfig=fixed({marginShift:.01},{trials:3});
 assert.deepEqual(simulateResearch(d),simulateResearch(d,d.researchSimulationConfig));
 assert.equal(simulateResearch(d,{trials:2}).median,calculateResearchOperating(d).enterprise);
 d.researchSimulationConfig={trials:0};assert.throws(()=>simulateResearch(d),/Trials/);
});

test('annual simulation: chunked async result exactly matches synchronous output, independent of chunk size',async()=>{
 const d=draft('GOOG'),c=variedConfig(),expected=simulateResearch(d,c);
 for(const chunkSize of [1,17,50000]){
  const progress=[];let yields=0;
  const actual=await simulateResearchAsync(d,c,{chunkSize,yieldControl:async()=>{yields++},onProgress:p=>progress.push(p)});
  assert.deepEqual(actual,expected);assert.deepEqual(progress[0],{completed:0,total:150});assert.deepEqual(progress.at(-1),{completed:150,total:150});
  assert.ok(progress.every((p,i)=>i===0||p.completed>progress[i-1].completed));assert.equal(yields,Math.ceil(c.trials/chunkSize));
 }
 const invalid=fixed({waccShift:-.5},{trials:11});assert.deepEqual(await simulateResearchAsync(d,invalid,{chunkSize:3,yieldControl:async()=>{}}),simulateResearch(d,invalid));
});

test('annual simulation: cancellation rejects before start and between chunks without publishing partial results',async()=>{
 const d=draft('AAPL'),c={trials:20},early=new AbortController();early.abort();let called=false;
 await assert.rejects(simulateResearchAsync(d,c,{signal:early.signal,yieldControl:async()=>{called=true}}),{name:'AbortError'});assert.equal(called,false);
 const controller=new AbortController(),progress=[];let yields=0;
 await assert.rejects(simulateResearchAsync(d,c,{signal:controller.signal,chunkSize:5,yieldControl:async()=>{if(++yields===3)controller.abort()},onProgress:p=>progress.push(p.completed)}),{name:'AbortError'});
 assert.deepEqual(progress,[0,5,10]);
 const last=new AbortController();await assert.rejects(simulateResearchAsync(d,{trials:1},{signal:last.signal,yieldControl:async()=>{},onProgress:p=>{if(p.completed===1)last.abort()}}),{name:'AbortError'});
});

test('annual simulation: an in-flight run snapshots input before yielding; progress does not consume draws',async()=>{
 const d=draft('MU'),c=variedConfig(),expected=simulateResearch(d,c);let calls=0;
 const actual=await simulateResearchAsync(d,c,{chunkSize:30,yieldControl:async()=>{
  if(calls++===0){d.annual[0].revenue*=3;c.drivers.growthPremium.mode=.5;d.bridgeInputs={additionalClaimAllowance:1e6};}
 }});
 assert.deepEqual(actual,expected);
 for(const chunkSize of [0,1.5,50001])await assert.rejects(simulateResearchAsync(d,{trials:1},{chunkSize}),/chunk size/);
});
