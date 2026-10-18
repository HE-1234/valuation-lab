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
const json=p=>JSON.parse(read(p));const r=incrementalRecord('CAMT'),src=json(r.identity.sourcePath.slice(2)),catalog=json('data/atlas-company-catalog-v1.json');
const draft=()=>incrementalResearchDraft({ticker:'CAMT',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const name of ['base','downcycle','upside'])test(`CAMT ${name}: all annual cash funding and terminal rows replay independently audited source`,()=>{
 const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,o=calculateResearchOperating(d),s=src.operating_scenarios[name].calculated;
 assert.deepEqual(researchDraftIssues(d),[]);near(o.enterprise,s.operating_EV);
 for(const [i,row]of o.rows.entries()){const source=s.annual[i];for(const [k,sk]of [['revenue','revenue'],['ebit','economic_EBIT'],['nopat','NOPAT'],['reinvestment','net_reinvestment'],['fcff','FCFF'],['discountFactor','discount_factor'],['pv','PV_FCFF']])near(row[k],source[sk]);assert.ok(row.reinvestment+1e-9>=source.funding_floor);near(source.funding_floor,source.physical_cash_capex-source.physical_depreciation+source.incremental_NWC_floor+source.incremental_operating_cash);}
 for(const [k,sk]of [['revenue','revenue'],['nopat','NOPAT'],['reinvestment','reinvestment'],['fcff','FCFF'],['value','value']])near(o.terminal[k],s.terminal[sk]);
 const b=calculateResearchBridge(d,o.enterprise);assert.equal(b.eligible,false);assert.equal(b.perShare,null);assert.equal(b.currentEquity,null);assert.equal(b.currentQuote,null);assert.equal(b.priceComparisonEligible,false);
 const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});for(const x of sim.enterprise.draws)near(x,o.enterprise);assert.equal(sim.bridgeCoverage.eligible,0);assert.equal(sim.bridgeCoverage.blocked,3);assert.equal(sim.perShare.draws.length,0);
});
test('CAMT immutable public package hashes, ten years and corrected share units',()=>{
 for(const k of ['source','history','audit','fullReport','auditReport'])assert.equal(createHash('sha256').update(read(r.identity[k+'Path'].slice(2))).digest('hex'),r.identity[k+'SHA256']);
 assert.equal(json(r.identity.auditPath.slice(2)).test_summary.passed,1648);assert.equal(r.history.length,10);assert.equal(r.history[0].fiscalEnd,'2016-12-31');assert.equal(r.history.at(-1).fiscalEnd,'2025-12-31');
 const f=r.history.at(-1).facts;near(f.diluted_weighted_shares.value,49.97);assert.equal(r.bridge.shares,46.668177);assert.equal(r.bridge.convertibleFairValue,null);assert.equal(r.bridge.illustrativeConvertiblePlaceholder,650);assert.deepEqual(r.bridge.options,[]);
 for(const row of r.history){assert.ok(row.facts.revenue.source_url);assert.ok(row.facts.revenue.unit);}
 assert.equal(incrementalPresets(incrementalPackages.find(p=>p.companies.some(c=>c.identity.ticker==='CAMT')),catalog)[0].ticker,'CAMT');assert.ok(Object.isFrozen(r.annualCase));const bad=structuredClone(incrementalPackages.find(p=>p.companies.some(c=>c.identity.ticker==='CAMT')));bad.companies[0].annualCase.annual[0].revenue++;assert.throws(()=>validateIncrementalResearch(bad));
});
test('CAMT source identity and unsupported price assumptions fail closed',()=>{
 for(const mutate of [d=>d.discountOrigin='2026-10-18',d=>d.incrementalResearch.auditSHA256='bad',d=>d.bridgeInputs.cappedCallValue=51.826]){const d=draft();mutate(d);assert.ok(researchDraftIssues(d).length);assert.ok(restoreResearchDraft(d,r.annualCase).error);}
 const d=draft();for(const options of [{cappedCallValue:51.826},{residualClaim:0},{outputCurrency:'EUR'},{securityBasis:'ADR'}])assert.throws(()=>calculateResearchBridge(d,4000,options));assert.equal(calculateResearchBridge(d,4000,{calculationDate:'2026-10-18'}).perShare,null);
});
test('CAMT bilingual evidence retains dated scope and uncalibrated defaults',()=>{
 try{setLocale('zh-Hans');for(const p of Object.values(r.prose))assert.equal(annualLabel(p.en),p['zh-Hans']);}finally{setLocale('en');}
 assert.match(r.prose.scope.en,/30 June 2026.*18 October 2026/);assert.match(r.prose.funding.en,/Every manual edit and simulation trial recomputes/);assert.match(r.prose.uncertainty.en,/zero width.*uncalibrated/);
});
test('CAMT workspace selection, named cases, undo, persisted draft and export keep equity gated',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{
 w.choose('CAMT');assert.equal(w.getState().draft.ticker,'CAMT');assert.match(w.get('#research-results').textContent,/2,918|2918|2,917/);assert.match(w.get('#research-results').textContent,/2026|June/);w.get('[data-annual-evidence="result"]').click();assert.match(w.get('#annual-evidence-host').textContent,/2,917.66/);assert.ok(!w.get('#annual-evidence-host').textContent.includes('2917.658')); 
 w.input('#research-notes','CAMT notes');const previous=w.getState().draft;w.get('[data-incremental-scenario="downcycle"]').click();near(calculateResearchOperating(w.getState().draft).enterprise,1216.4981994163263);w.action('undo');assert.deepEqual(w.getState().draft,previous);w.action('export');assert.equal(w.downloads[0].value.equityBridge.perShare,null);
 }finally{w.destroy();}
 const again=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{again.choose('CAMT');assert.equal(again.getState().identityError,null);assert.equal(again.getState().draft.notes,'CAMT notes');}finally{again.destroy();}
});
test('CAMT Monte Carlo stays manual on mount and reset',()=>{
 const d=draft();d.researchSimulationConfig.trials=3;const h=fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:'CAMT',currency:'USD',periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});try{assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);}finally{h.cleanup();}
});
test('CAMT edited growth, losses and terminal assumptions preserve funding requirements',()=>{
 const d=draft(),base=calculateResearchOperating(d);d.annual[0].revenue*=1.5;d.annual[0].reinvestment=0;const o=calculateResearchOperating(d);assert.ok(o.rows[0].reinvestment>base.rows[0].reinvestment);assert.equal(o.rows[0].enteredReinvestment,0);near(o.rows[0].investmentFloorTopUp,o.rows[0].reinvestment);
 const x=draft();x.annual[1].revenue=500;x.annual[1].margin=-.1;x.annual[1].reinvestment=-100;const loss=calculateResearchOperating(x).rows[1];assert.equal(loss.incrementalNWC,0);assert.equal(loss.incrementalOperatingCash,0);assert.ok(loss.physicalNetCapex>0);assert.ok(loss.reinvestment>0);assert.ok(loss.nopat<0);
 const fade=draft();fade.annual[8].margin=.5;fade.annual[8].reinvestment=0;const a=calculateResearchOperating(fade).rows[8];fade.terminal.roic=.12;const b=calculateResearchOperating(fade).rows[8];assert.ok(b.requiredInvestment>a.requiredInvestment);near(b.enteredReinvestment+b.investmentFloorTopUp,b.reinvestment);
 const bad=draft();bad.terminal.roic=1;assert.throws(()=>calculateResearchOperating(bad),/CAMT terminal g\/ROIC investment is below/);
});
test('CAMT seeded nonzero Monte Carlo funding is independently recomputed per trial',()=>{
 const d=draft(),config=structuredClone(d.researchSimulationConfig);config.trials=12;config.seed='CAMT-floor-audit';config.jointAnnual.annualPath.innovationSD=.05;const sim=simulateResearch(d,config),again=simulateResearch(d,config);assert.deepEqual(sim.enterprise.draws,again.enterprise.draws);assert.ok(sim.enterprise.draws.length>1);assert.ok(new Set(sim.enterprise.draws).size>1,'Active joint uncertainty must vary operating EV');const p=r.annualCase.camtFundingPolicy;
 for(const trial of sim.scenarios){let prior=d.anchor.revenue;for(const x of trial.annualFunding){const delta=Math.max(0,x.revenue-prior),floor=(p.capex-p.depreciation)*x.revenue+(p.nwc+p.operatingCash)*delta,nopat=x.revenue*x.margin-Math.max(0,x.revenue*x.margin)*x.taxRate,fade=Math.min(1,Math.max(0,(x.year-5)/5)),required=Math.max(floor,(1-fade)*Math.max(delta/p.salesCapital,floor)+fade*nopat*trial.terminal.growth/trial.terminal.roic);near(x.fundingFloor,floor);near(x.requiredInvestment,required);near(x.reinvestment,Math.max(x.enteredReinvestment,required));near(x.investmentFloorTopUp,x.reinvestment-x.enteredReinvestment);prior=x.revenue;}}
 assert.equal(r.annualCase.fixedCapitalFunding,undefined);
});
test('CAMT 10/15/20-year edited horizons retain zero-width baseline equivalence',async()=>{
 const {deriveAnnualGrowthHorizon}=await import('../dist/annual-growth-horizon.js');
 for(const name of ['base','downcycle','upside'])for(const horizon of [10,15,20]){const source=name==='base'?draft():incrementalAlternative(draft(),name).draft,d=horizon===10?source:deriveAnnualGrowthHorizon(source,r.annualCase,{growthMaturityYear:horizon}),sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(sim.accepted,3);for(const ev of sim.enterprise.draws)near(ev,calculateResearchOperating(d).enterprise);}
});
test('CAMT invalid diagnostic row indices retain the existing N/A contract',async()=>{
 const {annualCapitalDiagnostics}=await import('../dist/annual-capital-diagnostics.js');
 for(const index of [-1,10,100,1.5]){const result=annualCapitalDiagnostics(draft(),index);assert.equal(result.reinvestment,null);assert.equal(result.effectiveMarginalSalesCapital,null);}
});
test('CAMT dated timing, October update, acquisition chronology and claims remain explicit',()=>{
 assert.equal(r.identity.discountOrigin,'2026-06-30');assert.equal(r.identity.informationAsOf,'2026-10-18');
 assert.equal(r.annualCase.anchor.revenue,509.019);assert.equal(r.annualCase.anchor.firstModeledPeriodStart,'2026-07-01');
 for(const [i,row]of r.annualCase.annual.entries())assert.ok(row.period.endsWith(`${2027+i}-06-30`));
 assert.match(r.prose.growth.en,/preliminary Q3 USD 160–161m/);assert.match(r.prose.growth.en,/order intake, not backlog/);assert.match(r.prose.growth.en,/target, expressly not guidance/);
 assert.match(r.prose.claimLimits.en,/announced April 14 and had closed by May 12/);assert.match(r.prose.claims.en,/650m convertible placeholder is unmeasured/);
 for(const name of ['base','downcycle','upside']){const d=name==='base'?draft():incrementalAlternative(draft(),name).draft;assert.deepEqual(d.bridgeInputs,{});assert.equal(calculateResearchBridge(d,-1).perShare,null);assert.equal(calculateResearchBridge(d,1e6).perShare,null);}
});
test('CAMT nonzero joint growth, margin and investment uncertainty retain every funding floor',()=>{
 for(const name of ['base','downcycle','upside']){
 const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,c=structuredClone(d.researchSimulationConfig);c.trials=16;c.seed=`CAMT-joint-${name}`;c.jointAnnual.annualPath.innovationSD=.04;
 for(const [key,spec]of Object.entries(c.jointAnnual.annualMetrics)){if(key==='margin')spec.innovationSD=.015;if(key==='investmentFactor')spec.innovationSD=.04;}
 const sim=simulateResearch(d,c);assert.ok(sim.accepted>0);assert.ok(new Set(sim.enterprise.draws).size>1);
 for(const trial of sim.scenarios){for(const row of trial.annualFunding){assert.ok(row.reinvestment+1e-9>=row.requiredInvestment);assert.ok(row.reinvestment+1e-9>=row.fundingFloor);}assert.ok(trial.terminalFundingFloor>=0);}
 assert.equal(sim.perShare.draws.length,0);
 }
});
test('CAMT rejected terminal funding is bilingual at the authored error boundary',()=>{
 const d=draft();d.terminal.roic=1;let error;try{calculateResearchOperating(d);}catch(e){error=e;}assert.ok(error);
 try{setLocale('zh-Hans');assert.equal(annualLabel(error.message),'CAMT 终值 g/ROIC 投资低于实物资本、营运资本及经营现金资金下限。请调整终值假设。');setLocale('en');assert.equal(annualLabel(error.message),error.message);}finally{setLocale('en');}
});
test('CAMT common security basis is translated in Chinese evidence',()=>{try{setLocale('zh-Hans');assert.equal(annualLabel(r.bridge.shareBasis),'纳斯达克普通股；并非 ADR');}finally{setLocale('en');}});
test('CAMT anchor is source-derived TTM and annual dates remain compact and bilingual',()=>{
 assert.equal(r.annualCase.anchor.kind,'source_derived_TTM_actual');assert.equal(r.annualCase.anchor.period,'TTM · 2026-06-30');for(const row of r.annualCase.annual)assert.match(row.period,/^\d{4}-06-30$/);
 try{setLocale('zh-Hans');assert.equal(annualLabel(r.annualCase.anchor.fiscalCalendarCaution),'六月基准的十二个月预测期，与日历财年历史区分；采用年末折现。');}finally{setLocale('en');}
});
