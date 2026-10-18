import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {amatRegistry} from '../dist/amat-research-registry.js';
import {incrementalResearchDraft,incrementalAlternative,incrementalPresets,validateIncrementalResearch,INCREMENTAL_RESEARCH_PATHS} from '../dist/incremental-research.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {calculateResearchOperating,researchTimingResult,restoreResearchDraft,exportResearchCase,researchDraftIssues} from '../dist/research-model.js';
import {calculateResearchBridge,researchBridgeSensitivity} from '../dist/research-claims.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {annualLabel,localizeAnnualPresentation} from '../dist/annual-localization.js';
import {setLocale,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
import {researchPathHTML} from '../dist/research-view.js';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
const read=p=>fs.readFileSync(new URL('../dist/'+p,import.meta.url));
const json=p=>JSON.parse(read(p));
const record=incrementalRecord('AMAT'),c=record.annualCase,catalog=json('data/atlas-company-catalog-v1.json');
const preset={ticker:'AMAT',presetId:record.identity.version,incrementalResearch:record.identity,annualCase:c};
const draft=()=>incrementalResearchDraft(preset);
const share=d=>{const o=calculateResearchOperating(d);return calculateResearchBridge(d,o.enterprise,{...d.bridgeInputs,calculationDate:d.discountOrigin});};
const near=(a,b,t=1e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<t,`${a} != ${b}`);
const start=extra=>startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalPackages,...extra});
const expected=[['base',170970.14491831098,220.98869002158585],['downcycle',81105.6168261097,108.97969775037244],['upside',247297.8087686637,316.12505685948025]];

test('AMAT source, history and audit hashes match the independently approved version',()=>{
 const hash=x=>createHash('sha256').update(x).digest('hex'),id=record.identity;
 assert.equal(id.sourceSHA256,'3e0bdb767efe71734da151f04564b86efa24a0a025d98290446069e624aae0a9');
 assert.equal(hash(read(id.sourcePath.slice(2))),id.packagedSourceSHA256);assert.equal(hash(read(id.auditPath.slice(2))),id.auditSHA256);assert.equal(hash(read(id.historyPath.slice(2))),id.packagedHistorySHA256);
 assert.equal(id.historySourceSHA256,'a052e31843f6befb1c3da5f67a4fe8b4033ddba18b49d4e62f9f09e5a057ac74');
 const audit=json(id.auditPath.slice(2));assert.equal(audit.checksPassed,310);assert.equal(audit.sha256,id.sourceSHA256);
 assert.deepEqual(validateIncrementalResearch(json('data/incremental-AMAT-2026-10-18-v3/cases.json')),amatRegistry);assert.ok(Object.isFrozen(record.bridge.options));
 assert.equal(record.publicTradability.robinhood.status,'public-buy-sell-support');assert.ok(record.publicTradability.robinhood.evidence.length>10);
 assert.equal(json(id.sourcePath.slice(2)).readiness.readyForAppPublication,false,'Author status retained; independent integration review is separate');
});
for(const [name,ev,value]of expected)test(`AMAT ${name} independently reproduces audited operating and equity values`,()=>{
 const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,o=calculateResearchOperating(d),b=share(d);
 near(o.enterprise,ev);near(b.rawPerShare,value);near(b.equity-o.enterprise,6328.516017926959);near(b.allocationShares,802.297443);assert.deepEqual(researchDraftIssues(d),[]);
 assert.equal(d.discountOrigin,'2026-07-26');assert.equal(d.informationAsOf,'2026-10-18');assert.equal(b.shareReferenceDate,'2026-07-26');assert.equal(b.priceComparisonEligible,false);assert.equal(b.currentCapitalVerified,false);
 assert.equal(d.annual.length,10);assert.equal(d.annual[0].year,1);assert.equal(c.annual[0].originalSourceYear,2027);assert.match(d.annual[0].period,/2027-07-25/);
});
test('AMAT claims use a single investment decomposition, estimated awards and ESPP, with no duplicate finance or lease claims',()=>{
 const b=share(draft()),find=id=>b.rows.find(x=>x.id===id);
 near(find('cash').amount,7037);near(find('fixedIncome').amount,5043);near(find('listedEquity').amount,1979);near(find('listedInvestmentTaxReserve').amount,233.22);near(find('privateInvestmentRecovery').amount,221);near(find('taxCreditPV').amount,1241*.9/1.0487);near(find('prepaidTaxPV').amount,335/1.0487);
 near(find('debt').amount,6600);near(find('openingTaxClaims').amount,1197);near(find('pensionClaim').amount,146);near(find('restructuringClaim').amount,12);near(find('dividendClaim').amount,421);near(find('existingESPPClaim').amount,110);near(find('legacyAwards').amount,8.7);near(b.basicShares,793.597443);
 assert.equal(new Set(b.rows.map(x=>x.id)).size,b.rows.length);assert.ok(!b.rows.some(x=>/lease|legacy.*pv|weighted|future.*dilution/i.test(x.id)));
 assert.match(b.warnings.join(' '),/not a reported exact diluted count/);assert.match(b.warnings.join(' '),/not fully mapped.*not asserted zero/);
});
test('AMAT future grants remain an operating cost and legacy cancellation creates no asset or uplift',()=>{
 const source=json(record.identity.sourcePath.slice(2));
 for(const sc of [source.annualCase,...source.alternateAnnualCases])for(const row of sc.annual){near(row.EBIT,row.revenue*row.operatingMargin);near(row.futureGrantExpense,row.revenue*row.futureGrantExpenseRatio);near(row.GAAPLikeForecastEBITIncludingLegacyExpense+row.legacyAwardExpenseAddback,row.EBIT);near(row.legacyAwardScheduledExpense,row.legacyAwardExpenseAddback);near(row.economicEBITNetLegacyUplift,0);near(row.revenue-row.residualOperatingCostIncludingDA-row.futureGrantExpense,row.EBIT);}
 assert.equal(source.annualCase.annual[0].futureGrantExpenseRatio,.04);assert.equal(source.annualCase.annual.at(-1).futureGrantExpenseRatio,.025);
});
for(const option of record.bridge.options)test(`AMAT ${option.key} preserves explicit bounds, missingness and source defaults`,()=>{
 const d=draft(),before=share(d).rawPerShare;d.bridgeInputs[option.key]=option.min;const low=share(d);d.bridgeInputs[option.key]=option.max;const high=share(d);assert.ok(Number.isFinite(low.rawPerShare));assert.ok(Number.isFinite(high.rawPerShare));assert.notEqual(low.rawPerShare,high.rawPerShare);
 d.bridgeInputs[option.key]=null;assert.equal(share(d).perShare,null);assert.ok(Number.isFinite(calculateResearchOperating(d).enterprise));d.bridgeInputs[option.key]=option.max+1;assert.throws(()=>share(d),/bounds/);d.bridgeInputs[option.key]=option.default;near(share(d).rawPerShare,before);
});
test('AMAT overlapping tax assets are corrected once and cannot deduct uncredited recoveries',()=>{
 const d=draft(),before=share(d);d.bridgeInputs.taxAssetOverlap=41;const after=share(d);near(before.equity-after.equity,41/1.0487);
 for(const field of ['taxCreditCollectionFraction','prepaidTaxCollectionFraction']){const x=structuredClone(d);x.bridgeInputs[field]=0;const b=share(x);assert.equal(b.perShare,null);assert.match(b.reasons.join(' '),/exceeds a credited asset/);x.bridgeInputs.taxAssetOverlap=0;assert.ok(Number.isFinite(share(x).perShare));}
 const rows=researchBridgeSensitivity(draft(),calculateResearchOperating(draft()).enterprise);assert.ok(rows.length>=10);assert.ok(rows.every(x=>x.parameterLabel));
});
test('AMAT current dates, foreign currencies, alternate securities and cross-company claims fail closed',()=>{
 const d=draft(),o=calculateResearchOperating(d);assert.equal(calculateResearchBridge(d,o.enterprise,{calculationDate:'2026-10-18'}).perShare,null);
 d.timing={...d.timing,mode:'as-of-scenario',stubFCFF:0,reason:'Explicit illustrative elapsed stub'};const t=researchTimingResult(d);assert.equal(t.status,'scenario');assert.equal(calculateResearchBridge(d,t.enterprise,{calculationDate:t.date}).perShare,null);
 for(const options of [{outputCurrency:'EUR'},{securityBasis:'ADR'},{informationAsOf:'2026-07-26'},{legacyRSUVestingFraction:1},{additionalTaxInterest:0}])assert.throws(()=>calculateResearchBridge(d,o.enterprise,options));
});
for(const mutate of [d=>d.incrementalResearch.sourceSHA256='tampered',d=>d.incrementalResearch.historySourceSHA256='tampered',d=>d.incrementalResearch.version='KLAC-2026-10-18-v3',d=>d.anchor.revenue++,d=>d.informationAsOf='2026-07-26',d=>d.currentCapitalScenario={},d=>d.bridgeInputs.legacyRSUVestingFraction=1,d=>d.selectedIncrementalScenario='cycle-and-export-downside'])test('AMAT malformed identity or borrowed settings preserve saved data for recovery',()=>{
 const d=draft();mutate(d);const before=structuredClone(d),r=restoreResearchDraft(d,c);assert.ok(r.error);assert.deepEqual(r.draft,before);assert.throws(()=>calculateResearchOperating(d));
});
test('AMAT reviewed history is ten full fiscal years with corrected current debt and no invented missing investment',()=>{
 assert.equal(record.history.length,10);assert.equal(record.history[0].fiscalEnd,'2016-10-30');assert.equal(record.history.at(-1).fiscalEnd,'2025-10-26');assert.equal(record.history[0].netReinvestment,null);
 for(const r of record.history){near(r.operatingMargin,r.canonicalOperatingEBIT/r.revenue);assert.ok(r.provenance);}
 const last=record.history.at(-1);near(last.normalizedValues.totalCurrentDebt,100);near(last.canonicalOperatingEBIT,8289);assert.match(last.normalizedValues.debtReconciliation.policy,/Commercial paper100/);
});
test('AMAT deterministic manual-MC defaults and reset reproduce every named scenario without borrowing KLAC distributions',()=>{
 for(const [name,,value]of expected){const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,a=annualResearchSimulationAdapter(d),settings=a.defaults();assert.equal(settings.annualPath.innovationSD,0);assert.equal(settings.annualPath.persistence,0);assert.ok(Object.values(settings.annualMetrics).every(x=>x.innovationSD===0));assert.ok(Object.values(settings.drivers).every(x=>x.type==='fixed'));const result=simulateResearch(d,{...settings,trials:3});assert.equal(result.accepted,3);near(result.perShare.median,value);assert.equal(result.quote.status,'blocked');d.researchPreset.defaultSimulationConfig.annualPath.innovationSD=.9;assert.equal(a.defaults().annualPath.innovationSD,0);}
});
test('AMAT edited and derived horizons retain dated identity, claims, notes and full export provenance',()=>{
 let d=draft();d.notes='AMAT 中文 note';d.bridgeInputs.privateInvestmentRecovery=300;d.annual[0].margin=.34;d.userEdited=true;d=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:15});assert.equal(restoreResearchDraft(d,c).error,null);assert.ok(Number.isFinite(share(d).perShare));const out=exportResearchCase(d,c);assert.equal(out.draft.notes,'AMAT 中文 note');assert.equal(out.incrementalSourceIdentity.version,record.identity.version);assert.equal(out.asKnownBacktestEligible,false);assert.equal(out.priceComparisonEligible,false);assert.equal(out.originalResearchCase.annual[0].originalSourceYear,2027);assert.throws(()=>exportResearchCase(d,incrementalRecord('KLAC').annualCase));
});
test('AMAT admission and package failures remain independent of KLAC and the original fourteen',async()=>{
 assert.equal(incrementalPresets(amatRegistry,catalog).length,1);const noBroker=structuredClone(catalog);delete noBroker.companies.find(x=>x.ticker==='AMAT').robinhood;assert.equal(incrementalPresets(amatRegistry,noBroker).length,0);
 const bad=structuredClone(amatRegistry);bad.companies[0].bridge.cash++;const w=await start({incrementalBundle:[incrementalPackages[0],bad]});w.choose('AMAT');assert.equal(w.getState().readiness,'research-pending');w.choose('KLAC');assert.equal(w.getState().readiness,'ready');near(share(w.getState().draft).rawPerShare,75.4116719332944);w.choose('GOOG');assert.equal(w.getState().draft.selectedResearchScenario.classification,'Selected Google case');w.destroy();
});
test('Production loader requests each package and admits AMAT even when a different new package fails',async()=>{
 const requests=[];const w=await startResearchWorkspace({catalogBundle:catalog,fetcher:async path=>{requests.push(path);if(path===INCREMENTAL_RESEARCH_PATHS[0])return {ok:false};if(path===INCREMENTAL_RESEARCH_PATHS[1])return {ok:true,json:async()=>structuredClone(amatRegistry)};if(path.includes('studio-research-presets'))return {ok:true,json:async()=>json('data/studio-research-presets-2026-10-17-v1.json')};return {ok:true,json:async()=>bundledResearch()};}});assert.ok(INCREMENTAL_RESEARCH_PATHS.every(p=>requests.includes(p)));w.choose('AMAT');assert.equal(w.getState().readiness,'ready');w.choose('KLAC');assert.equal(w.getState().readiness,'research-pending');w.destroy();
});
test('AMAT workspace selects all scenarios with Undo, independent storage, export and reload',async()=>{
 const storage=new Map(),w=await start({storage});w.choose('AMAT');assert.match(w.get('#research-results').textContent,/July 26, 2026/);assert.match(w.get('#research-results').textContent,/October 18, 2026/);assert.match(w.get('#research-results').textContent,/220.99/);assert.equal(w.getState().company.anchor.kind,'source_derived_TTM_actual');
 w.input('#research-notes','Keep AMAT note');w.input(w.field('bridge','existingESPPClaim'),'150');const before=w.getState().draft;
 for(const name of ['downcycle','upside']){w.get(`[data-incremental-scenario="${name}"]`).click();assert.equal(w.getState().draft.selectedIncrementalScenario,name);near(share(w.getState().draft).rawPerShare,expected.find(x=>x[0]===name)[2]);w.action('undo');assert.deepEqual(w.getState().draft,before);}
 w.action('export');assert.equal(w.downloads[0].value.draft.bridgeInputs.existingESPPClaim,150);assert.match(w.downloads[0].name,/AMAT-2026-10-18-v3/);assert.equal(w.downloads[0].value.priceComparisonEligible,false);
 assert.ok(storage.has(researchStorageKey(c)));assert.ok(!storage.has('valuation-lab-annual-research-v1:AMAT'));w.choose('KLAC');assert.equal(w.getState().draft.version,'KLAC-2026-10-18-v3');w.choose('AMAT');assert.equal(w.getState().draft.notes,'Keep AMAT note');w.destroy();const again=await start({storage});again.choose('AMAT');assert.equal(again.getState().identityError,null);assert.equal(again.getState().draft.bridgeInputs.existingESPPClaim,150);again.destroy();
});
test('AMAT blank claim leaves operating EV available and every evidence link resolves to its own package',async()=>{
 const w=await start();w.choose('AMAT');w.input(w.field('bridge','existingESPPClaim'),'');assert.ok(w.get('.research-big-value'));assert.equal(w.get('.research-equity-value'),null);assert.match(w.get('#research-results').textContent,/unknown amount is not zero/);const links=w.root.querySelectorAll('a').map(x=>x.getAttribute('href'));assert.ok(links.some(x=>x?.includes('AMAT-v3.html')));assert.ok(!links.some(x=>x?.includes('evidence-AMAT')||x?.includes('dossiers.html#AMAT')));assert.match(w.get('#annual-evidence-history').textContent,/8,289/);w.destroy();
});
test('AMAT Chinese dated warnings, scenarios, claim estimates and fixed MC text preserve all state',async()=>{
 setLocale('en');const w=await start();w.choose('AMAT');const proto=Object.getPrototypeOf(w.root),query=proto.querySelectorAll;proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(x=>query.call(this,x.trim())))];};proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};localizeAnnualPresentation(w.root);const before=w.getState();clearTranslationDiagnostics();setLocale('zh-Hans');assert.match(w.get('#research-results').textContent,/2026 年 7 月 26 日/);assert.match(w.get('#research-results').textContent,/当前价格比较已禁用/);assert.match(w.get('#annual-editor-panel-claims').textContent,/现有 ESPP 请求权估计/);assert.match(w.get('[data-incremental-scenario="upside"]').textContent,/上行情景/);assert.match(annualLabel(annualResearchSimulationAdapter(before.draft).introduction),/手动运行/);assert.deepEqual(w.getState(),before);assert.deepEqual(getMissingTranslations(),[]);setLocale('en');w.destroy();
});
test('Published KLAC package, source registry, original fourteen and selected GOOG remain byte-identical to V43',()=>{
 const paths=['dist/incremental-research-registry.js','dist/data/renewed-research-2026-10-17/cases.json','dist/data/studio-research-presets-2026-10-17-v1.json','dist/data/goog-selected-case-2026-10-18-v1.json',...fs.readdirSync(new URL('../dist/data/incremental-research-2026-10-18/',import.meta.url)).map(x=>'dist/data/incremental-research-2026-10-18/'+x)];
 for(const path of paths)assert.deepEqual(fs.readFileSync(new URL('../'+path,import.meta.url)),execFileSync('git',['show','3d03f2a57e85d9fa7e8458c7132407b6fa89b330:'+path],{cwd:new URL('..',import.meta.url),maxBuffer:20e6}),path);
});

test('AMAT path chart names the selected scenario in English and Simplified Chinese',()=>{
 try{for(const [locale,down,up]of [['en','Downcycle scenario','Upside scenario'],['zh-Hans','下行周期情景','上行情景']]){setLocale(locale);for(const [name,label]of [['downcycle',down],['upside',up]]){const d=incrementalAlternative(draft(),name).draft,h=researchPathHTML(c,d);assert.ok(h.includes(label));assert.ok(!h.slice(0,h.indexOf('<h2')).includes(locale==='en'?'BASE CASE':'基准案例'));}}}finally{setLocale('en');}
});
test('AMAT named path labels switch Chinese to English live without changing the draft',async()=>{
 setLocale('zh-Hans');const w=await start();const proto=Object.getPrototypeOf(w.root),query=proto.querySelectorAll;proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(x=>query.call(this,x.trim())))];};proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};try{w.choose('AMAT');w.get('[data-incremental-scenario="upside"]').click();const before=w.getState();assert.match(w.get('.annual-path-heading').textContent,/上行情景/);setLocale('en');assert.match(w.get('.annual-path-heading').textContent,/Upside scenario/);setLocale('zh-Hans');assert.match(w.get('.annual-path-heading').textContent,/上行情景/);assert.deepEqual(w.getState(),before);}finally{setLocale('en');w.destroy();}
});
