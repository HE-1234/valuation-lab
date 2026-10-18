import test from 'node:test';
import assert from 'node:assert/strict';
import {incrementalRecord} from '../dist/incremental-registry.js';
import {incrementalResearchDraft} from '../dist/incremental-research.js';
import {calculateResearchOperating} from '../dist/research-model.js';
import {fixedCapitalSettlement,scaleOperatingInvestment} from '../dist/fixed-capital-funding.js';
import {operatingCashChange} from '../dist/fn-operating-cash.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {researchStressDraft,simulationResearchDefaults,simulateResearch} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {annualLabel} from '../dist/annual-localization.js';
import {setLocale,t} from '../dist/i18n.js';
import en from '../dist/locales/annual.en.js';
import zh from '../dist/locales/annual.zh-Hans.js';
const draft=ticker=>{const r=incrementalRecord(ticker);return incrementalResearchDraft({ticker,presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const annualConfig=d=>{const c={...simulationResearchDefaults(d),trials:3,seed:'capital-policy-copy'};c.annualPath.innovationSD=.01;return c;};
const scope=locale=>{setLocale(locale);return t('annualMetrics.scopeResearch');};

for(const ticker of ['KLAC','AMAT','LRCX','ASML'])test(`${ticker} fixed schedule and factor 1 keep edited investment despite changed revenue`,()=>{
 const d=draft(ticker);d.annual[1].reinvestment+=1;
 const r=simulateResearch(d,annualConfig(d));assert.equal(r.accepted,3);
 for(const trial of r.scenarios){
  assert.ok(trial.metricPaths.investmentFactor.every(x=>x===1));
  const replay=researchStressDraft(d,{},'fixed-schedule',trial.growthPath);
  assert.ok(replay.annual.some((row,i)=>row.revenue!==d.annual[i].revenue));
  assert.deepEqual(replay.annual.map(row=>row.reinvestment),d.annual.map(row=>row.reinvestment));
  near(trial.enterprise,calculateResearchOperating(replay).enterprise);
 }
 const text=scope('en');assert.match(text,/With fixed-schedule and factor 1, edited pre-reserve investment stays fixed/);assert.doesNotMatch(text,/does not freeze investment dollars/);
});

for(const ticker of ['KLAC','AMAT','LRCX','ASML','FN'])test(`${ticker} revenue-scaled response preserves selected fixed funding before its active factor`,()=>{
 const d=draft(ticker),c={...annualConfig(d),capitalPolicy:'revenue-scaled'},result=simulateResearch(d,c);
 assert.equal(result.accepted,3);
 for(const trial of result.scenarios){
  const replay=researchStressDraft(d,{},'revenue-scaled',trial.growthPath);
  assert.ok(replay.annual.some((row,i)=>row.reinvestment!==d.annual[i].reinvestment));
  for(const [i,row]of replay.annual.entries()){
   const fixed=fixedCapitalSettlement(d,row.year),operating=d.annual[i].reinvestment-fixed;
   near(row.reinvestment,fixed+operating*row.revenue/d.annual[i].revenue);
   near(scaleOperatingInvestment(d,row,2),fixed+2*(row.reinvestment-fixed));
  }
 }
 assert.match(scope('en'),/revenue-responsive policies may change it/);
 assert.match(scope('en'),/Selected fixed funding stays outside factors/);
});

test('annual factors replace the scalar multiplier; scalar mode keeps its own multiplier active',()=>{
 for(const policy of ['fixed-schedule','revenue-scaled']){
  const d=draft('KLAC'),annual={...annualConfig(d),capitalPolicy:policy};
  const changed=structuredClone(annual);changed.drivers.investmentMultiplier.value=2;
  const a=simulateResearch(d,annual),b=simulateResearch(d,changed);
  assert.deepEqual(a.enterprise.draws,b.enterprise.draws);
  assert.equal(b.inputDistributions.investmentMultiplier.active,false);
  const legacy={...annual,method:'legacy'},legacyChanged={...changed,method:'legacy'};
  const c=simulateResearch(d,legacy),e=simulateResearch(d,legacyChanged);
  assert.notDeepEqual(c.enterprise.draws,e.enterprise.draws);
  assert.notEqual(e.inputDistributions.investmentMultiplier.active,false);
  const adapter=annualResearchSimulationAdapter(d);
  for(const config of [annual,legacy]){
   const html=adapter.relationshipsMarkup(config);
   assert.match(html,/For factor-based inputs: annual factors apply afterward when active; otherwise the scalar multiplier applies/);
   assert.doesNotMatch(html,/your investment multiplier/);
  }
 }
});

test('derived-horizon relationships identify conditional annual/scalar factors without replacing fixed obligations',()=>{
 const source=draft('KLAC'),d=deriveAnnualGrowthHorizon(source,incrementalRecord('KLAC').annualCase,{growthMaturityYear:15}),a=annualResearchSimulationAdapter(d),config=annualConfig(d);
 for(const method of ['annual-path','legacy']){
  setLocale('en');const html=a.relationshipsMarkup({...config,method});
  assert.match(html,/For factor-based inputs: annual factors apply afterward when active; otherwise the scalar multiplier applies/);
  assert.match(html,/Selected fixed funding is protected/);
  assert.match(html,/Explicit releases are retained without amplification/);
  assert.doesNotMatch(html,/optional investment multiplier/);
 }
});

test('FN fixed pre-reserve investment still has revenue-derived operating-cash funding',()=>{
 const d=draft('FN'),baseline=calculateResearchOperating(d),r=simulateResearch(d,annualConfig(d));
 assert.equal(r.accepted,3);
 for(const trial of r.scenarios){
  const replay=researchStressDraft(d,{},'fixed-schedule',trial.growthPath),o=calculateResearchOperating(replay);
  assert.deepEqual(replay.annual.map(row=>row.reinvestment),d.annual.map(row=>row.reinvestment));
  assert.ok(o.rows.some((row,i)=>row.reinvestment!==baseline.rows[i].reinvestment));
  for(const [i,row]of o.rows.entries()){
   near(row.reinvestment,replay.annual[i].reinvestment+operatingCashChange(replay,i));
   near(row.fixedOpeningFunding,fixedCapitalSettlement(d,row.year));
  }
 }
 setLocale('en');const html=annualResearchSimulationAdapter(d).relationshipsMarkup(annualConfig(d));
 assert.match(html,/pre-reserve investment excluding the fixed opening payable/);
 assert.match(html,/Required-cash changes are derived separately from the same sampled revenue path/);
 assert.match(html,/fixed 3% reserve policy can fund cash growth or release cash/);
 assert.match(html,/opening payable settlement remains fixed/);
 assert.match(scope('en'),/required operating-cash changes are derived separately/);
});

test('English and Simplified scope, relationships and result explanation keep the same conditional distinctions',()=>{
 const d=draft('KLAC'),r=simulateResearch(d,annualConfig(d));
 assert.match(r.method.capitalDescription,/At factor 1, fixed-schedule retains edited pre-reserve investment; revenue-responsive policies may change it/);
 assert.match(r.method.capitalDescription,/Selected fixed funding is not multiplied/);
 assert.match(r.method.capitalDescription,/scalar investment multiplier is inactive/);
 try{
  assert.match(scope('zh-Hans'),/固定计划且系数为 1/);
  assert.match(scope('zh-Hans'),/响应收入的政策则可能改变该金额/);
  assert.match(scope('zh-Hans'),/所需经营现金变化另行推导/);
  assert.match(scope('zh-Hans'),/标量投资倍数不启用/);
  for(const key of ['copy.117dfa8850c4','simulation.derived']){
   assert.match(en[key],/For factor-based inputs: annual factors apply afterward when active; otherwise the scalar multiplier applies/);
   assert.match(zh[key],/随后应用启用的年度系数；未启用时则使用标量倍数/);
   assert.match(zh[key],/所选固定资金支出不受缩放影响/);
  }
  const translated=annualLabel(r.method.capitalDescription);
  assert.match(translated,/系数为 1 时，固定计划保留编辑后的储备前投资/);
  assert.match(translated,/所需经营现金变化另行推导/);
  setLocale('en');assert.equal(annualLabel(r.method.capitalDescription),r.method.capitalDescription);
 }finally{setLocale('en');}
});
