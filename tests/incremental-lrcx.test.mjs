import {reverseLearnQuestionVisibility} from './reference-policy-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {lrcxRegistry} from '../dist/lrcx-research-registry.js';
import {incrementalResearchDraft,incrementalAlternative,incrementalPresets,validateIncrementalResearch,INCREMENTAL_RESEARCH_PATHS} from '../dist/incremental-research.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {calculateResearchOperating,terminalNormalizedDraft,researchTimingResult,restoreResearchDraft,exportResearchCase,researchDraftIssues} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {simulateResearch,simulateResearchAsync,researchStressDraft,researchAnnualPathContext,simulationResearchDefaults} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {annualMetricDefaults} from '../dist/annual-path-sampling.js';
import {deriveAnnualGrowthHorizon,calculateDerivedReinvestment} from '../dist/annual-growth-horizon.js';
import {applyAnnualMarginPath,defaultAnnualMarginPath} from '../dist/annual-margin-path.js';
import {annualCapitalDiagnostics} from '../dist/annual-capital-diagnostics.js';
import {fixedCapitalSettlement,operatingInvestment} from '../dist/fixed-capital-funding.js';
import {localizeAnnualPresentation} from '../dist/annual-localization.js';
import {setLocale,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
import {fixture} from './v7-simulation-harness.mjs';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
const read=p=>fs.readFileSync(new URL('../dist/'+p,import.meta.url)),json=p=>JSON.parse(read(p));
const record=incrementalRecord('LRCX'),c=record.annualCase,catalog=json('data/atlas-company-catalog-v1.json');
const draft=()=>incrementalResearchDraft({ticker:'LRCX',presetId:record.identity.version,incrementalResearch:record.identity,annualCase:c});
const share=d=>calculateResearchBridge(d,calculateResearchOperating(d).enterprise,{...d.bridgeInputs,calculationDate:d.discountOrigin});
const near=(a,b,t=2e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<t,`${a} != ${b}`);
const start=extra=>startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalPackages,...extra});
const expected=[['base',140028.42930793238,109.17739027381938],['cycle-and-export-downside',70300.70786838119,53.782211111652835],['process-intensity-upside',188418.38110548377,147.62078113949997]];
const manual=d=>{let discount=1,pv=0;for(const r of d.annual){discount*=1+r.wacc;const ebit=r.revenue*r.margin;pv+=(ebit-Math.max(0,ebit)*r.taxRate-r.reinvestment)/discount;}const t=d.terminal,nopat=d.annual.at(-1).revenue*(1+t.growth)*t.margin*(1-t.taxRate);return pv+nopat*(1-t.growth/t.roic)/(t.wacc-t.growth)/discount;};
function localize(w){const proto=Object.getPrototypeOf(w.root),query=proto.querySelectorAll;proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(x=>query.call(this,x.trim())))];};proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};localizeAnnualPresentation(w.root);}

test('LRCX source/audit/history package hashes and official public admission evidence are pinned',()=>{
 const hash=x=>createHash('sha256').update(x).digest('hex'),id=record.identity;assert.equal(id.sourceSHA256,'6cf963c1d04f538024eb5e73a28ce1d737232156941dc16177a831a145d2f9b8');for(const [path,key]of [['sourcePath','packagedSourceSHA256'],['auditPath','auditSHA256'],['historyPath','packagedHistorySHA256']])assert.equal(hash(read(id[path].slice(2))),id[key]);
 const audit=json(id.auditPath.slice(2));assert.equal(audit.independentMathChecks.length,416);assert.ok(audit.independentMathChecks.every(x=>x.passed));assert.deepEqual(validateIncrementalResearch(json('data/incremental-LRCX-2026-10-18-v2/cases.json')),lrcxRegistry);assert.ok(Object.isFrozen(record.annualCase.fixedCapitalFunding.schedule));assert.equal(record.publicTradability.robinhood.status,'public-buy-sell-support');assert.ok(record.publicTradability.robinhood.evidence.length>10);
 const src=json(id.sourcePath.slice(2));assert.equal(src.integrationReview.originalSourceSHA256,id.sourceSHA256);assert.match(src.integrationReview.judgment,/current-date output blocked/);
});
for(const [name,ev,value]of expected)test(`LRCX ${name} reproduces all audited source rows, investment components and dated value`,()=>{
 const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,o=calculateResearchOperating(d),b=share(d),source=name==='base'?c:record.alternatives.find(x=>x.name===name).annualCase;near(o.enterprise,ev);near(manual(d),ev);near(b.rawPerShare,value);near(b.equity-o.enterprise,-2603.282);near(b.allocationShares,1258.732664);assert.deepEqual(researchDraftIssues(d),[]);
 assert.equal(d.discountOrigin,'2026-06-28');assert.equal(d.informationAsOf,'2026-10-18');assert.equal(b.priceComparisonEligible,false);assert.equal(b.currentCapitalVerified,false);
 for(const [i,row]of source.annual.entries()){near(row.reinvestment,row.normalizedOperatingReinvestment+row.openingCapitalPayableSettlement);near(d.annual[i].reinvestment,row.reinvestment);near(row.revenue*row.operatingMargin,row.EBIT);near(row.GAAPLikeForecastEBITIncludingLegacyExpense+row.legacyAwardExpenseAddback,row.EBIT);near(row.revenue-row.nonSBCOperatingCostResidualIncludingDA-row.futureGrantEconomicCompensationExpense,row.EBIT);near(row.futureGrantEconomicCompensationExpense,row.revenue*.03);near(o.rows[i].openingCapitalPayableSettlement,i===0?119.605:0);near(o.rows[i].normalizedOperatingReinvestment,row.normalizedOperatingReinvestment);}
 near(o.rows[0].derivedSalesCapital,source.annual[0].salesToCapital);
});
test('LRCX seven claims controls and fixed claims use each obligation once, preserving explicit estimates',()=>{
 const b=share(draft()),row=id=>b.rows.find(x=>x.id===id);assert.equal(record.bridge.options.length,7);near(row('debt').amount,3750.147+12.502);near(row('openingTaxClaims').amount,944.402);near(row('dividendClaim').amount,325.402);near(row('existingESPPClaim').amount,150);near(row('legacyAwards').amount,7.454664);near(row('deferredCompRecovery').amount,0);assert.equal(new Set(b.rows.map(x=>x.id)).size,b.rows.length);assert.ok(!b.rows.some(x=>/capex|capitalPayable|future|weighted|optionClaim/i.test(x.id)));assert.match(b.warnings.join(' '),/not measured fair value|not option fair value/);assert.match(b.warnings.join(' '),/not a coverage ceiling/);assert.match(record.bridge.debtAlternativePolicy,/3,172.649/);
});
for(const option of record.bridge.options)test(`LRCX ${option.key} retains source defaults, bounded stresses and unknown state`,()=>{
 const d=draft(),v=share(d).rawPerShare;d.bridgeInputs[option.key]=option.min;const lo=share(d);d.bridgeInputs[option.key]=option.max;const hi=share(d);assert.ok(Number.isFinite(lo.rawPerShare));assert.ok(Number.isFinite(hi.rawPerShare));assert.notEqual(lo.rawPerShare,hi.rawPerShare);d.bridgeInputs[option.key]=null;assert.equal(share(d).perShare,null);assert.ok(Number.isFinite(calculateResearchOperating(d).enterprise));d.bridgeInputs[option.key]=option.max+1;assert.throws(()=>share(d),/bounds/);d.bridgeInputs[option.key]=option.default;near(share(d).rawPerShare,v);
});
test('LRCX overlap constraints prohibit compounded residual/tax-interest/repurchase claims',()=>{
 const keys=record.bridge.overlappingStressKeys;for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){const d=draft();d.bridgeInputs[keys[i]]=1;d.bridgeInputs[keys[j]]=1;const b=share(d);assert.equal(b.perShare,null);assert.match(b.reasons.join(' '),/overlap/);d.bridgeInputs[keys[j]]=0;assert.ok(Number.isFinite(share(d).perShare));}
 const d=draft();d.bridgeInputs.deferredCompRecovery=13.3;near(share(d).equity-share(draft()).equity,13.3);
});
for(const mutate of [d=>delete d.fixedCapitalFunding,d=>d.fixedCapitalFunding.schedule[0].amount=0,d=>d.fixedCapitalFunding.schedule[0].year=2,d=>d.fixedCapitalFunding.schedule.push({year:2,amount:119.605}),d=>d.annual[0].openingCapitalPayableSettlement=0,d=>d.annual[1].openingCapitalPayableSettlement=119.605,d=>d.incrementalResearch.auditSHA256='wrong',d=>d.incrementalResearch.packagedHistorySHA256='wrong',d=>d.incrementalResearch.sourceSHA256='wrong',d=>d.currentCapitalScenario={},d=>d.selectedIncrementalScenario='upside',d=>d.bridgeInputs.legacyRSUVestingFraction=1])test('LRCX fixed-funding/source/identity tampering is retained but calculation is withheld',()=>{
 const d=draft();mutate(d);const before=structuredClone(d),r=restoreResearchDraft(d,c);assert.ok(r.error);assert.deepEqual(r.draft,before);assert.throws(()=>calculateResearchOperating(d));
});
test('LRCX annual total funding edits update only the operating residual and cannot remove the fixed obligation',()=>{
 const d=draft();d.annual[0].reinvestment=5000;const o=calculateResearchOperating(d);near(o.rows[0].normalizedOperatingReinvestment,4880.395);near(o.rows[0].openingCapitalPayableSettlement,119.605);d.annual[0].reinvestment=119.605;near(calculateResearchOperating(d).rows[0].normalizedOperatingReinvestment,0);d.annual[0].reinvestment=119;assert.throws(()=>calculateResearchOperating(d),/below the fixed/);assert.throws(()=>deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:15}),/below the fixed/);
});
for(const policy of ['fixed-schedule','revenue-scaled'])test(`LRCX ${policy} growth and capital stresses never scale the opening payable`,()=>{
 const d=draft(),x=researchStressDraft(d,{growthPremium:.02,investmentMultiplier:1.7},policy);for(const [i,row]of x.annual.entries()){const base=d.annual[i],scale=policy==='revenue-scaled'?row.revenue/base.revenue:1;near(row.reinvestment,(base.reinvestment-(i===0?119.605:0))*1.7*scale+(i===0?119.605:0));}near(calculateResearchOperating(x).enterprise,manual(x));
 const zero=researchStressDraft(d,{investmentMultiplier:0},policy);near(zero.annual[0].reinvestment,119.605);assert.ok(zero.annual.slice(1).every(r=>r.reinvestment===0));
});
test('LRCX derived growth horizons preserve original calendar funding and operating-only committed floor',()=>{
 const original=draft();let d=deriveAnnualGrowthHorizon(original,c,{growthMaturityYear:15});d=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20});d=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:10});near(d.annual[0].reinvestment,original.annual[0].reinvestment);assert.equal(d.fixedCapitalFunding.schedule.length,1);
 const revenues=d.annual.map(r=>({...r,revenue:r.revenue*1.2})),inv=calculateDerivedReinvestment(d,revenues);const base=d.derivedForecast.baselineAnnual[0],delta=revenues[0].revenue-d.anchor.revenue,baseDelta=base.revenue-d.anchor.revenue;near(inv[0],operatingInvestment(d,base)*1.2+Math.max(0,delta-baseDelta*1.2)/d.derivedForecast.marginalSalesCapital+119.605);
 const x=researchStressDraft(d,{growthPremium:.02,investmentMultiplier:1.4});const response=calculateDerivedReinvestment(d,x.annual,{baselineAnnual:d.annual});for(const [i,row]of x.annual.entries())near(row.reinvestment,(response[i]-(i===0?119.605:0))*1.4+(i===0?119.605:0));
 d.annual[0].reinvestment=5000;const edited=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:20});near(edited.annual[0].reinvestment,5000);assert.equal(restoreResearchDraft(edited,c).error,null);assert.deepEqual(exportResearchCase(edited,c).draft.fixedCapitalFunding,c.fixedCapitalFunding);
});
test('LRCX terminal normalization across all ten years preserves fixed first-year funding',()=>{
 const d=draft();d.annual.at(-1).reinvestment*=1.1;const x=terminalNormalizedDraft(d,{years:10}),r=d.annual[0],target=r.revenue*r.margin*(1-r.taxRate)*d.terminal.growth/d.terminal.roic;near(x.annual[0].reinvestment,(r.reinvestment-119.605)*.9+target*.1+119.605);near(calculateResearchOperating(x).rows[0].openingCapitalPayableSettlement,119.605);assert.equal(d.annual[0].reinvestment,c.annual[0].reinvestment);
});
test('LRCX margin-only 20-year extension never repeats or stretches the fixed settlement',()=>{
 const d=draft(),x=applyAnnualMarginPath(d,c,{...defaultAnnualMarginPath(d),enabled:true,interimYear:3,declineStartYear:5,terminalYear:20});assert.equal(x.annual.length,20);near(x.annual[0].reinvestment,d.annual[0].reinvestment);const o=calculateResearchOperating(x);near(o.rows.reduce((sum,r)=>sum+r.openingCapitalPayableSettlement,0),119.605);assert.ok(o.rows.slice(1).every(r=>r.openingCapitalPayableSettlement===0));
});
for(const derived of [false,true])for(const capital of ['investmentFactor','reinvestment'])test(`LRCX ${derived?'derived':'source'} ${capital} MC paths preserve fixed funding in independent replay`,()=>{
 const d=derived?deriveAnnualGrowthHorizon(draft(),c,{growthMaturityYear:15}):draft(),cfg={...simulationResearchDefaults(d),method:'annual-path',trials:20,seed:'LRCX-fixed-funding'};cfg.annualMetrics=annualMetricDefaults(d.annual.length,capital);cfg.annualMetrics[capital].innovationSD=capital==='reinvestment'?80:.1;cfg.annualMetrics[capital].fixedYears=[2,4];cfg.annualPath.innovationSD=.01;cfg.annualPath.fixedYears=[2];cfg.capitalPolicy='fixed-schedule';if(derived&&capital==='reinvestment'){assert.throws(()=>simulateResearch(d,cfg),/Direct annual investment requires the fixed-schedule policy/);assert.deepEqual(d.fixedCapitalFunding,c.fixedCapitalFunding);return;}const result=simulateResearch(d,cfg);assert.equal(result.accepted,20);
 for(const trial of result.scenarios){const x=researchStressDraft(d,{},result.config.capitalPolicy,trial.growthPath);x.terminal=trial.terminal;for(const [i,row]of x.annual.entries()){for(const [key,path]of Object.entries(trial.metricPaths)){if(key==='investmentFactor')row.reinvestment=(row.reinvestment-(i===0?119.605:0))*path[i]+(i===0?119.605:0);else if(key==='reinvestment')row.reinvestment=path[i]+(i===0?119.605:0);else row[key]=path[i];}}near(trial.enterprise,manual(x));near(trial.perShare,(manual(x)-2603.282)/1258.732664);}
 assert.deepEqual(result.method.fixedCapitalFunding,c.fixedCapitalFunding);assert.match(result.method.capitalDescription,/only operating investment/);
});
test('LRCX direct dollar uncertainty baseline excludes fixed funding; zero-SD and async runs reproduce source',async()=>{
 const d=draft(),ctx=researchAnnualPathContext(d);near(ctx.metrics.reinvestment[0],c.annual[0].normalizedOperatingReinvestment);const cfg={...simulationResearchDefaults(d),method:'annual-path',trials:4,annualMetrics:annualMetricDefaults(10,'reinvestment')};const r=simulateResearch(d,cfg);near(r.perShare.median,109.17739027381938);assert.deepEqual(await simulateResearchAsync(d,cfg,{chunkSize:2,yieldControl:async()=>{}}),r);
});
test('LRCX three named cases retain fixed manual defaults and deny shifted-date current/security outputs',()=>{
 for(const [name,,value]of expected){const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,a=annualResearchSimulationAdapter(d),cfg=a.defaults();assert.equal(cfg.annualPath.innovationSD,0);assert.ok(Object.values(cfg.annualMetrics).every(x=>x.innovationSD===0));assert.ok(Object.values(cfg.drivers).every(x=>x.type==='fixed'));near(simulateResearch(d,{...cfg,trials:3}).perShare.median,value);assert.equal(calculateResearchBridge(d,calculateResearchOperating(d).enterprise,{calculationDate:'2026-10-18'}).perShare,null);assert.throws(()=>calculateResearchBridge(d,1,{outputCurrency:'EUR'}));d.timing={...d.timing,mode:'as-of-scenario',stubFCFF:0,reason:'Explicit scenario'};const timing=researchTimingResult(d);assert.equal(calculateResearchBridge(d,timing.enterprise,{calculationDate:timing.date}).perShare,null);}
});
test('LRCX canonical historical EBIT and split-normalized shares exactly retain the reviewed source',()=>{
 const src=json(record.identity.sourcePath.slice(2));assert.deepEqual(record.history,src.normalizedInvestment.history);assert.equal(record.history.length,10);for(const r of record.history){near(r.operatingMargin,r.canonicalOperatingEBIT/r.revenue);assert.ok(r.provenance);assert.match(r.splitAdjustment,/No double adjustment/);}for(const fy of ['2023','2024'])assert.ok(record.history.find(r=>r.fiscalEnd.startsWith(fy)).separateOperatingChargeReconciliation!==0);
});
test('LRCX optional package admission fails independently and preserves existing ready companies',async()=>{
 assert.equal(incrementalPresets(lrcxRegistry,catalog).length,1);const badCatalog=structuredClone(catalog);delete badCatalog.companies.find(x=>x.ticker==='LRCX').robinhood;assert.equal(incrementalPresets(lrcxRegistry,badCatalog).length,0);const bad=structuredClone(lrcxRegistry);bad.companies[0].annualCase.fixedCapitalFunding.schedule[0].amount=0;const w=await start({incrementalBundle:[...incrementalPackages.slice(0,2),bad]});w.choose('LRCX');assert.equal(w.getState().readiness,'research-pending');for(const ticker of ['GOOG','KLAC','AMAT']){w.choose(ticker);assert.equal(w.getState().readiness,'ready');}w.destroy();
});
test('LRCX production loader admits its own package if a prior optional package fails',async()=>{
 const requests=[],w=await startResearchWorkspace({catalogBundle:catalog,fetcher:async path=>{requests.push(path);if(path==='./data/incremental-LRCX-2026-10-18-v2/cases.json')return{ok:true,json:async()=>lrcxRegistry};if(INCREMENTAL_RESEARCH_PATHS.includes(path))return{ok:false};if(path.includes('studio-research-presets'))return{ok:true,json:async()=>json('data/studio-research-presets-2026-10-17-v1.json')};return{ok:true,json:async()=>bundledResearch()};}});assert.ok(INCREMENTAL_RESEARCH_PATHS.every(p=>requests.includes(p)));w.choose('LRCX');assert.equal(w.getState().readiness,'ready');w.destroy();
});
test('LRCX workspace scenarios, undo, independent storage, export and evidence preserve funded claim distinctions',async()=>{
 const storage=new Map();const w=await start({storage,simulationMount:()=>{return()=>{};}});w.choose('LRCX');assert.match(w.get('#research-results').textContent,/109.18/);assert.match(w.get('.incremental-fixed-funding').textContent,/119.605/);assert.equal(w.root.querySelectorAll('[data-research-input="bridge"]').length,7);w.input('#research-notes','LRCX 中文 notes');w.input(w.field('bridge','existingESPPClaim'),'200');const before=w.getState().draft;
 for(const [name,,value]of expected.slice(1)){w.get(`[data-incremental-scenario="${name}"]`).click();near(share(w.getState().draft).rawPerShare,value);w.action('undo');assert.deepEqual(w.getState().draft,before);}w.action('export');assert.deepEqual(w.downloads[0].value.draft.fixedCapitalFunding,c.fixedCapitalFunding);assert.equal(w.downloads[0].value.priceComparisonEligible,false);assert.ok(storage.has(researchStorageKey(c)));assert.ok(!storage.has('valuation-lab-annual-research-v1:LRCX'));
 const links=w.root.querySelectorAll('a').map(x=>x.getAttribute('href'));assert.ok(links.some(x=>x?.includes('LRCX-v2.html')));assert.ok(!links.some(x=>x?.includes('evidence-LRCX')));w.choose('AMAT');w.choose('LRCX');assert.equal(w.getState().draft.notes,'LRCX 中文 notes');w.destroy();const again=await start({storage});again.choose('LRCX');assert.equal(again.getState().identityError,null);near(again.getState().draft.bridgeInputs.existingESPPClaim,200);again.destroy();
});
test('LRCX blank and overlapping claim controls retain operating EV and withhold common allocation',async()=>{
 const w=await start();w.choose('LRCX');w.input(w.field('bridge','existingESPPClaim'),'');assert.ok(w.get('.research-big-value'));assert.equal(w.get('.research-equity-value'),null);w.input(w.field('bridge','existingESPPClaim'),'150');w.input(w.field('bridge','residualClaims'),'100');w.input(w.field('bridge','repurchasePayable'),'34.348');assert.ok(w.get('.research-big-value'));assert.equal(w.get('.research-equity-value'),null);assert.match(w.get('#research-results').textContent,/overlap/);w.destroy();
});
test('LRCX live Chinese/English funding, named scenarios and claim labels preserve draft state',async()=>{
 setLocale('en');const w=await start();localize(w);try{w.choose('LRCX');w.get('[data-incremental-scenario="process-intensity-upside"]').click();const before=w.getState();clearTranslationDiagnostics();setLocale('zh-Hans');assert.match(w.get('.annual-path-heading').textContent,/工艺强度上行/);assert.match(w.get('.incremental-fixed-funding').textContent,/期初资本开支应付款/);assert.match(w.get('#annual-editor-panel-claims').textContent,/额外残余请求权压力/);assert.match(w.get('#research-results').textContent,/当前价格比较已禁用/);setLocale('en');assert.match(w.get('.annual-path-heading').textContent,/Process-intensity upside/);assert.deepEqual(w.getState(),before);assert.deepEqual(getMissingTranslations(),[]);}finally{setLocale('en');w.destroy();}
});
test('V46 original fourteen, GOOG, KLAC, AMAT, quiz bank and approved CSS remain byte-identical',()=>{
 const files=execFileSync('git',['ls-tree','-r','--name-only','fce6fa776146730d1d13ec12f5d11488bdae394c','dist'],{cwd:new URL('..',import.meta.url),encoding:'utf8'}).trim().split('\n').filter(p=>/incremental-research-registry|amat-research-registry|incremental-AMAT|incremental-research-2026|renewed-research.*cases.json|studio-research-presets-2026-10-17-v1.json|goog-selected-case|quiz|learn|\.css$/.test(p));assert.ok(files.length>15);for(const p of files)assert.deepEqual(reverseLearnQuestionVisibility(p,fs.readFileSync(new URL('../'+p,import.meta.url))),execFileSync('git',['show','fce6fa776146730d1d13ec12f5d11488bdae394c:'+p],{cwd:new URL('..',import.meta.url),maxBuffer:20e6}),p);
});

test('LRCX visible capital diagnostic excludes opening payable and retains live funding reconciliation',async()=>{
 const d=draft();near(annualCapitalDiagnostics(d).effectiveMarginalSalesCapital,1.8);near(annualCapitalDiagnostics(d).fixedOpeningFunding,119.605);const w=await start();try{w.choose('LRCX');assert.match(w.get('#annual-capital-diagnostics').textContent,/1.8×/);assert.match(w.get('#annual-capital-diagnostics').textContent,/119.605/);w.input('#annual-year-reinvestment','5000');assert.match(w.get('[data-annual-capital-diagnostic="funding"]').textContent,/4,880.395/);assert.match(w.get('[data-annual-capital-diagnostic="funding"]').textContent,/5,000/);}finally{w.destroy();}
});

test('LRCX actual simulation mount stays idle until Run and reset never auto-runs',()=>{
 const d=draft();d.researchSimulationConfig={...simulationResearchDefaults(d),trials:3};const h=fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:d.ticker,currency:d.currency,periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});try{assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);assert.match(h.root.innerHTML,/119.605/);}finally{h.cleanup();}
});
