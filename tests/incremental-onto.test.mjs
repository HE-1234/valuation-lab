import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {incrementalResearchDraft,incrementalAlternative,validateIncrementalResearch,incrementalPresets} from '../dist/incremental-research.js';
import {calculateResearchOperating,researchDraftIssues,restoreResearchDraft} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {fixture} from './v7-simulation-harness.mjs';
import {annualLabel} from '../dist/annual-localization.js';
import {setLocale} from '../dist/i18n.js';
const read=p=>fs.readFileSync(new URL('../dist/'+p,import.meta.url));
const json=p=>JSON.parse(read(p));const r=incrementalRecord('ONTO'),src=json(r.identity.sourcePath.slice(2)),catalog=json('data/atlas-company-catalog-v1.json');
const draft=()=>incrementalResearchDraft({ticker:'ONTO',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const name of ['base','downcycle','upside'])test(`ONTO ${name}: all annual cash funding and terminal rows replay independently audited source`,()=>{
 const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,o=calculateResearchOperating(d),s=src.operating_scenarios[name].calculated;
 assert.deepEqual(researchDraftIssues(d),[]);near(o.enterprise,s.enterprise_value);
 for(const [i,row]of o.rows.entries()){const source=s.annual[i];for(const [k,sk]of [['revenue','revenue'],['ebit','economic_EBIT'],['nopat','NOPAT'],['reinvestment','net_reinvestment'],['fcff','FCFF'],['discountFactor','discount_factor'],['pv','PV_FCFF']])near(row[k],source[sk]);assert.ok(row.reinvestment+1e-9>=source.total_funding_floor);near(source.total_funding_floor,source.physical_capex_cash-source.physical_depreciation+source.incremental_operating_NWC_floor+source.incremental_operating_cash_floor);}
 for(const [k,sk]of [['revenue','revenue'],['nopat','NOPAT'],['reinvestment','reinvestment'],['fcff','FCFF'],['value','value']])near(o.terminal[k],s.terminal[sk]);
 const b=calculateResearchBridge(d,o.enterprise);assert.equal(b.eligible,false);assert.equal(b.perShare,null);assert.equal(b.currentEquity,null);assert.equal(b.currentQuote,null);assert.equal(b.priceComparisonEligible,false);
 const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});for(const x of sim.enterprise.draws)near(x,o.enterprise);assert.equal(sim.bridgeCoverage.eligible,0);assert.equal(sim.bridgeCoverage.blocked,3);assert.equal(sim.perShare.draws.length,0);
});
test('ONTO immutable public package hashes, ten years and corrected share units',()=>{
 for(const k of ['source','history','audit','fullReport','auditReport'])assert.equal(createHash('sha256').update(read(r.identity[k+'Path'].slice(2))).digest('hex'),r.identity[k+'SHA256']);
 assert.equal(json(r.identity.auditPath.slice(2)).check_count,148);assert.equal(r.history.length,10);assert.equal(r.history[0].fiscalEnd,'2016-12-31');assert.equal(r.history.at(-1).fiscalEnd,'2026-01-03');
 assert.equal(r.bridge.shares,49.033);assert.equal(r.bridge.quotedConvertibleFairValue,1982.250);assert.deepEqual(r.bridge.options,[]);
 for(const row of r.history){assert.ok(row.facts.revenue.source_url);assert.ok(row.facts.revenue.unit);}
 assert.equal(incrementalPresets(incrementalPackages.at(-1),catalog)[0].ticker,'ONTO');assert.ok(Object.isFrozen(r.annualCase));const bad=structuredClone(incrementalPackages.at(-1));bad.companies[0].annualCase.annual[0].revenue++;assert.throws(()=>validateIncrementalResearch(bad));
});
test('ONTO source identity and unsupported price assumptions fail closed',()=>{
 for(const mutate of [d=>d.discountOrigin='2026-10-18',d=>d.incrementalResearch.auditSHA256='bad',d=>d.bridgeInputs.cappedCallValue=51.826]){const d=draft();mutate(d);assert.ok(researchDraftIssues(d).length);assert.ok(restoreResearchDraft(d,r.annualCase).error);}
 const d=draft();for(const options of [{cappedCallValue:51.826},{residualClaim:0},{outputCurrency:'EUR'},{securityBasis:'ADR'}])assert.throws(()=>calculateResearchBridge(d,4000,options));assert.equal(calculateResearchBridge(d,4000,{calculationDate:'2026-10-18'}).perShare,null);
});
test('ONTO bilingual evidence retains dated scope and uncalibrated defaults',()=>{
 try{setLocale('zh-Hans');for(const p of Object.values(r.prose))assert.equal(annualLabel(p.en),p['zh-Hans']);}finally{setLocale('en');}
 assert.match(r.prose.scope.en,/30 June 2026.*18 October 2026/);assert.match(r.prose.funding.en,/Every manual edit and simulation trial recomputes/);assert.match(r.prose.uncertainty.en,/zero width.*uncalibrated/);
});
test('ONTO workspace selection, named cases, undo, persisted draft and export keep equity gated',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{
 w.choose('ONTO');assert.equal(w.getState().draft.ticker,'ONTO');assert.match(w.get('#research-results').textContent,/5,867|5867/);assert.match(w.get('#research-results').textContent,/2026|June/);w.get('[data-annual-evidence="result"]').click();assert.match(w.get('#annual-evidence-host').textContent,/5,867.22/);assert.ok(!w.get('#annual-evidence-host').textContent.includes('5867.221927')); 
 w.input('#research-notes','ONTO notes');const previous=w.getState().draft;w.get('[data-incremental-scenario="downcycle"]').click();near(calculateResearchOperating(w.getState().draft).enterprise,2642.6119285273417);w.action('undo');assert.deepEqual(w.getState().draft,previous);w.action('export');assert.equal(w.downloads[0].value.equityBridge.perShare,null);
 }finally{w.destroy();}
 const again=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{again.choose('ONTO');assert.equal(again.getState().identityError,null);assert.equal(again.getState().draft.notes,'ONTO notes');}finally{again.destroy();}
});
test('ONTO Monte Carlo stays manual on mount and reset',()=>{
 const d=draft();d.researchSimulationConfig.trials=3;const h=fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:'ONTO',currency:'USD',periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});try{assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);}finally{h.cleanup();}
});
test('ONTO edited growth, losses and terminal assumptions preserve funding requirements',()=>{
 const d=draft(),base=calculateResearchOperating(d);d.annual[0].revenue*=1.5;d.annual[0].reinvestment=0;const o=calculateResearchOperating(d);assert.ok(o.rows[0].reinvestment>base.rows[0].reinvestment);assert.equal(o.rows[0].enteredReinvestment,0);near(o.rows[0].investmentFloorTopUp,o.rows[0].reinvestment);
 const x=draft();x.annual[1].revenue=500;x.annual[1].margin=-.1;x.annual[1].reinvestment=-100;const loss=calculateResearchOperating(x).rows[1];assert.equal(loss.incrementalNWC,0);assert.equal(loss.incrementalOperatingCash,0);assert.ok(loss.physicalNetCapex>0);assert.ok(loss.reinvestment>0);assert.ok(loss.nopat<0);
 const fade=draft();fade.annual[8].margin=.5;fade.annual[8].reinvestment=0;const a=calculateResearchOperating(fade).rows[8];fade.terminal.roic=.12;const b=calculateResearchOperating(fade).rows[8];assert.ok(b.requiredInvestment>a.requiredInvestment);near(b.enteredReinvestment+b.investmentFloorTopUp,b.reinvestment);
 const bad=draft();bad.terminal.roic=1;assert.throws(()=>calculateResearchOperating(bad),/ONTO terminal g\/ROIC investment is below/);
});
test('ONTO seeded nonzero Monte Carlo funding is independently recomputed per trial',()=>{
 const d=draft(),config=structuredClone(d.researchSimulationConfig);config.trials=12;config.seed='ONTO-floor-audit';config.jointAnnual.annualPath.innovationSD=.05;const sim=simulateResearch(d,config),again=simulateResearch(d,config);assert.deepEqual(sim.enterprise.draws,again.enterprise.draws);assert.ok(sim.enterprise.draws.length>1);assert.ok(new Set(sim.enterprise.draws).size>1,'Active joint uncertainty must vary operating EV');const p=r.annualCase.ontoFundingPolicy;
 for(const trial of sim.scenarios){let prior=d.anchor.revenue;for(const x of trial.annualFunding){const delta=Math.max(0,x.revenue-prior),floor=(p.capex-p.depreciation)*x.revenue+(p.nwc+p.operatingCash)*delta,nopat=x.revenue*x.margin-Math.max(0,x.revenue*x.margin)*x.taxRate,fade=Math.min(1,Math.max(0,(x.year-5)/5)),required=Math.max(floor,(1-fade)*Math.max(delta/p.salesCapital,floor)+fade*nopat*trial.terminal.growth/trial.terminal.roic);near(x.fundingFloor,floor);near(x.requiredInvestment,required);near(x.reinvestment,Math.max(x.enteredReinvestment,required));near(x.investmentFloorTopUp,x.reinvestment-x.enteredReinvestment);prior=x.revenue;}}
 assert.match(src.reported.capital_payables,/Not separately disclosed/);assert.equal(r.annualCase.fixedCapitalFunding,undefined);
});
test('ONTO 10/15/20-year edited horizons retain zero-width baseline equivalence',async()=>{
 const {deriveAnnualGrowthHorizon}=await import('../dist/annual-growth-horizon.js');
 for(const name of ['base','downcycle','upside'])for(const horizon of [10,15,20]){const source=name==='base'?draft():incrementalAlternative(draft(),name).draft,d=horizon===10?source:deriveAnnualGrowthHorizon(source,r.annualCase,{growthMaturityYear:horizon}),sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(sim.accepted,3);for(const ev of sim.enterprise.draws)near(ev,calculateResearchOperating(d).enterprise);}
});
test('ONTO invalid diagnostic row indices retain the existing N/A contract',async()=>{
 const {annualCapitalDiagnostics}=await import('../dist/annual-capital-diagnostics.js');
 for(const index of [-1,10,100,1.5]){const result=annualCapitalDiagnostics(draft(),index);assert.equal(result.reinvestment,null);assert.equal(result.effectiveMarginalSalesCapital,null);}
});

test('ONTO occupancy stress is optional, source-exact and funded without lease debt duplication',()=>{
 const d=incrementalAlternative(draft(),'occupancy').draft,o=calculateResearchOperating(d);near(o.enterprise,5820.833166903974);for(const [i,row]of o.rows.entries()){near(row.reinvestment,src.sensitivities.occupancy_cost_headroom_20bp.annual[i].net_reinvestment);assert.ok(row.reinvestment>=row.fundingFloor-1e-8);}const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});for(const x of sim.enterprise.draws)near(x,o.enterprise);assert.equal(calculateResearchBridge(d,o.enterprise).perShare,null);
});
test('ONTO predecessor, retained freshness and Rigaku caveats survive packaging',()=>{
 assert.match(r.prose.history.en,/Rudolph predecessor, not standalone Nanometrics/);assert.match(r.prose.scope.en,/latest report retained and reviewed/);assert.match(r.prose.rigaku.en,/completion was not independently established/);assert.match(r.prose.claimLimits.en,/30% Rigaku cost haircut/);assert.equal(r.history[0].facts.revenue.value,232.780);
});

test('ONTO terminal-floor failure has a complete Chinese presentation',()=>{
 const d=draft();d.terminal.roic=1;let error;try{calculateResearchOperating(d);}catch(e){error=e;}assert.ok(error);try{setLocale('zh-Hans');assert.equal(annualLabel(error.message),'ONTO 终值 g/ROIC 投资低于实物资本、营运资本和经营现金资金下限。请修改终值假设。');}finally{setLocale('en');}
});
test('ONTO authored display prose uses at most two decimal places while source precision remains intact',()=>{
 for(const p of Object.values(r.prose))for(const text of Object.values(p))assert.doesNotMatch(text,/(?<![\w.])\d+\.\d{3,}/);assert.equal(r.bridge.shares,49.033);near(src.operating_scenarios.base.calculated.enterprise_value,5867.221927683091);
});
test('ONTO source-period labels use locale-neutral dates and the fiscal caution is translated',()=>{
 assert.equal(r.annualCase.anchor.period,'2026-06-30');assert.equal(r.annualCase.anchor.firstModeledPeriod,'2027-06-30');for(const row of r.annualCase.annual)assert.match(row.period,/^\d{4}-06-30$/);try{setLocale('zh-Hans');assert.equal(annualLabel(r.annualCase.anchor.fiscalCalendarCaution),'滚动基期约为 367 天；预测年度于六月三十日结束。');}finally{setLocale('en');}
});

test('ONTO toolbar classifies its approximate rolling anchor correctly in both locales',async()=>{
 for(const [locale,label]of [['en','Rolling reported-period reference'],['zh-Hans','滚动已报告期间参考']]){setLocale(locale);const w=await startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalPackages});try{w.choose('ONTO');assert.ok(w.root.textContent.includes(label));assert.ok(!w.root.textContent.includes('Reported fiscal year'));}finally{w.destroy();setLocale('en');}}assert.equal(r.annualCase.anchor.kind,'reported_period_approximation');near(r.annualCase.anchor.revenue,1120.137);
});
