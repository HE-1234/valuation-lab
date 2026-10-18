import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {incrementalRegistry,incrementalRecord} from '../dist/incremental-research-registry.js';
import {incrementalResearchDraft,incrementalAlternative,validateIncrementalResearch,incrementalPresets,fetchIncrementalResearch} from '../dist/incremental-research.js';
import {incrementalIdentityValid,researchStorageKey} from '../dist/incremental-research-identity.js';
import {researchDraftFor,researchDraftIssues,calculateResearchOperating,researchTimingResult,restoreResearchDraft,exportResearchCase} from '../dist/research-model.js';
import {calculateResearchBridge,researchBridgeDefinition,researchBridgeSensitivity} from '../dist/research-claims.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {setLocale,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
import {annualLabel,localizeAnnualPresentation} from '../dist/annual-localization.js';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
const read=path=>fs.readFileSync(new URL('../dist/'+path,import.meta.url));
const json=path=>JSON.parse(read(path));
const record=incrementalRecord('KLAC'),c=record.annualCase;
const catalog=json('data/atlas-company-catalog-v1.json');
const preset={ticker:'KLAC',presetId:record.identity.version,incrementalResearch:record.identity,annualCase:c};
const draft=()=>incrementalResearchDraft(preset);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const share=d=>{const o=calculateResearchOperating(d);return calculateResearchBridge(d,o.enterprise,{...d.bridgeInputs,calculationDate:d.discountOrigin});};
const start=extra=>startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalRegistry,...extra});

test('KLAC package is separately versioned, immutable, fingerprinted and broker-evidenced',()=>{
 assert.deepEqual(validateIncrementalResearch(json('data/incremental-research-2026-10-18/cases.json')),incrementalRegistry);
 assert.ok(Object.isFrozen(record.annualCase.annual[0]));
 const digest=x=>createHash('sha256').update(x).digest('hex');
 assert.equal(record.identity.sourceSHA256,'c1c67c548fd5ca25203d368c5373a1dc9b0a718f65e1519a5f73cf043bb6c1be');
 assert.equal(digest(read(record.identity.sourcePath.replace('./',''))),record.identity.packagedSourceSHA256);
 assert.equal(digest(read(record.identity.auditPath.replace('./',''))),record.identity.auditSHA256);
 const audited=json(record.identity.auditPath.replace('./',''));assert.equal(audited.auditedSha256,record.identity.sourceSHA256);assert.equal(audited.allNumericalChecksPassed,true);
 assert.equal(record.publicTradability.robinhood.status,'public-buy-sell-support');assert.ok(record.publicTradability.robinhood.evidence.length>10);assert.equal(record.publicTradability.robinhood.checkedAt,'2026-10-18');
 assert.ok(!read(record.identity.sourcePath.replace('./','')).toString().includes('rawEBITExtractions'));
});

test('KLAC adapter independently reproduces both cleared DCFs and every fixed claim',()=>{
 for(const [d,ev,value]of [[draft(),104866.68020203678,75.4116719332944],[incrementalAlternative(draft(),'cycle-and-export-downside').draft,61199.28893709977,42.255052981348875]]){
  const o=calculateResearchOperating(d),b=share(d);near(o.enterprise,ev);near(b.rawPerShare,value);near(b.allocationShares,1317.003743);near(b.basicShares,1306.983);near(b.claimTotal,10451.634);near(b.assetTotal,4902.408);
  assert.equal(b.currentCapitalVerified,false);assert.equal(b.priceComparisonEligible,false);assert.equal(b.referenceDate,'2026-06-30');assert.equal(b.informationAsOf,'2026-10-18');assert.deepEqual(researchDraftIssues(d),[]);
  assert.equal(b.rows.filter(x=>x.id==='legacyRSUDividendEquivalentClaim').length,1);near(b.rows.find(x=>x.id==='legacyRSUDividendEquivalentClaim').amount,13.3);
 }
});

test('KLAC canonical ten-year history uses corrected cost-line EBIT and split provenance',()=>{
 assert.equal(record.history.length,10);for(const [year,value]of [['2020',1502.201],['2022',3654.181],['2023',3994.696]])near(record.history.find(x=>x.fiscalEnd.startsWith(year)).canonicalOperatingEBIT,value);
 for(const row of record.history){near(row.canonicalOperatingEBIT/row.revenue,row.operatingMargin);assert.ok(row.splitAdjustment);assert.ok(row.provenance);}
 assert.match(record.prose.history.en,/not reviewed end to end/);assert.match(record.prose.profitability.en,/3%/);
});

for(const option of record.bridge.options)test(`KLAC ${option.key} is editable, bounded and never silently zero`,()=>{
 const d=draft(),base=share(d);d.bridgeInputs[option.key]=option.min;const low=share(d);assert.ok(Number.isFinite(low.rawPerShare));
 d.bridgeInputs[option.key]=option.max;const high=share(d);assert.notEqual(low.rawPerShare,high.rawPerShare);
 d.bridgeInputs[option.key]=null;assert.equal(share(d).rawPerShare,null);assert.equal(share(d).status,'operating-only');assert.ok(Number.isFinite(calculateResearchOperating(d).enterprise));
 d.bridgeInputs[option.key]=option.max+1;assert.throws(()=>share(d),/bounds/);d.bridgeInputs[option.key]=option.default;near(share(d).rawPerShare,base.rawPerShare);
});

test('KLAC date, currency, security and unknown-claim gates cannot reuse the dated allocation',()=>{
 const d=draft(),o=calculateResearchOperating(d);
 assert.equal(calculateResearchBridge(d,o.enterprise,{calculationDate:'2026-10-18'}).perShare,null);
 d.timing={...d.timing,mode:'as-of-scenario',asOf:'2026-10-18',stubFCFF:0,reason:'explicit illustrative elapsed stub'};
 const t=researchTimingResult(d);assert.equal(t.status,'scenario');assert.equal(calculateResearchBridge(d,t.enterprise,{calculationDate:t.date}).perShare,null);
 for(const option of [{outputCurrency:'EUR'},{securityBasis:'ADR'},{additionalDilutionShares:0},{informationAsOf:'2026-06-30'}])assert.throws(()=>calculateResearchBridge(d,o.enterprise,option));
 assert.equal(researchBridgeDefinition('KLAC').optionDefinitions.length,5);assert.ok(researchBridgeSensitivity(draft(),o.enterprise).length>=5);
});

for(const change of [d=>d.incrementalResearch.sourceSHA256='x',d=>d.incrementalResearch.extra=true,d=>d.currency='TWD',d=>d.informationAsOf='2026-06-30',d=>d.anchor.revenue++,d=>d.version='2026-10-17-reviewed-v1',d=>d.currentCapitalScenario={},d=>d.selectedIncrementalScenario='bull',d=>delete d.incrementalResearch])test('KLAC incompatible identity is retained without calculating or overwriting',()=>{
 const d=draft();change(d);const original=structuredClone(d),r=restoreResearchDraft(d,c);assert.ok(r.error);assert.deepEqual(r.draft,original);assert.throws(()=>calculateResearchOperating(d));assert.throws(()=>share(d));
});

test('KLAC valid edits, notes, horizon derivation and named scenario survive restore/export',()=>{
 let d=draft();d.notes='My 中文 notes';d.annual[0].margin=.43;d.bridgeInputs.operatingCashReserve=3500;d.userEdited=true;
 assert.equal(restoreResearchDraft(d,c).error,null);
 d=deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:15});assert.equal(restoreResearchDraft(d,c).error,null);assert.ok(incrementalIdentityValid(d));assert.ok(Number.isFinite(share(d).rawPerShare));
 const out=exportResearchCase(d,c);assert.equal(out.draft.notes,'My 中文 notes');assert.deepEqual(out.incrementalSourceIdentity,record.identity);assert.equal(out.priceComparisonEligible,false);assert.equal(out.asKnownBacktestEligible,false);
 assert.throws(()=>exportResearchCase(d,bundledResearch().companies[0]),/source/);
 d=incrementalAlternative(d,'cycle-and-export-downside').draft;assert.equal(restoreResearchDraft(d,c).error,null);assert.equal(d.notes,'My 中文 notes');near(share(d).rawPerShare,42.255052981348875);
});

test('KLAC simulation starts and resets fully fixed, reproduces base and downside, and blocks quote comparison',()=>{
 for(const d of [draft(),incrementalAlternative(draft(),'cycle-and-export-downside').draft]){
  const a=annualResearchSimulationAdapter(d),defaults=a.defaults();assert.equal(defaults.annualPath.innovationSD,0);assert.equal(defaults.annualPath.persistence,0);assert.ok(Object.values(defaults.annualMetrics).every(x=>x.innovationSD===0));assert.ok(Object.values(defaults.drivers).every(x=>x.type==='fixed'));
  const result=simulateResearch(d,{...defaults,trials:3});assert.equal(result.accepted,3);near(result.enterprise.median,calculateResearchOperating(d).enterprise);near(result.perShare.median,share(d).rawPerShare);assert.equal(result.quote.status,'blocked');assert.ok(result.perShare.samples.every(x=>Math.abs(x-result.perShare.median)<1e-10));
  d.researchPreset.defaultSimulationConfig.annualPath.innovationSD=.99;assert.equal(a.defaults().annualPath.innovationSD,0);
 }
});

test('KLAC package admission fails closed without matching US and Robinhood evidence',async()=>{
 assert.equal(incrementalPresets(incrementalRegistry,catalog).length,1);assert.equal(incrementalPresets(incrementalRegistry,null).length,0);
 const bad=structuredClone(catalog);delete bad.companies.find(x=>x.ticker==='KLAC').robinhood;assert.equal(incrementalPresets(incrementalRegistry,bad).length,0);
 const altered=structuredClone(incrementalRegistry);altered.companies[0].annualCase.annual[0].revenue++;assert.throws(()=>validateIncrementalResearch(altered));
 await assert.rejects(fetchIncrementalResearch(async()=>new Promise(()=>{}),{timeoutMs:1}),/timed out/);
 const w=await start({incrementalBundle:altered});w.choose('KLAC');assert.equal(w.getState().readiness,'research-pending');w.choose('GOOG');assert.equal(w.getState().draft.selectedResearchScenario.version,'2026-10-18-user-selected-goog-case-v1');w.destroy();
});

test('KLAC workspace stores independently, switches and restores, exports, undoes downside, and never runs MC on selection',async()=>{
 const storage=new Map(),mounts=[];let runs=0;
 const w=await start({storage,simulationMount:(root,{draft:d})=>{mounts.push(d.ticker);return ()=>{};}});w.choose('KLAC');assert.equal(w.getState().readiness,'ready');assert.equal(w.getState().identityError,null);assert.equal(runs,0);
 assert.match(w.get('#research-results').textContent,/June 30, 2026/);assert.match(w.get('#research-results').textContent,/October 18, 2026/);assert.match(w.get('#research-results').textContent,/75.41/);
 assert.ok(storage.has(researchStorageKey(c)));assert.ok(!storage.has('valuation-lab-annual-research-v1:KLAC'));
 w.input('#research-notes','Keep notes');w.input(w.field('bridge','operatingCashReserve'),'3500');const before=w.getState().draft;w.action('incremental-downside');near(share(w.getState().draft).rawPerShare,42.255052981348875);w.action('export');assert.match(w.downloads[0].name,/KLAC-2026-10-18-v3/);assert.equal(w.downloads[0].value.priceComparisonEligible,false);
 w.action('undo');assert.deepEqual(w.getState().draft,before);w.choose('GOOG');assert.equal(w.getState().draft.selectedResearchScenario.classification,'Selected Google case');w.choose('KLAC');assert.equal(w.getState().draft.notes,'Keep notes');assert.equal(w.getState().draft.bridgeInputs.operatingCashReserve,3500);w.destroy();
 const r=await start({storage});r.choose('KLAC');assert.equal(r.getState().identityError,null);assert.equal(r.getState().draft.bridgeInputs.operatingCashReserve,3500);r.destroy();assert.ok(mounts.includes('KLAC'));
});

test('KLAC workspace unknown claim preserves EV and blocks share output; sources use dedicated package',async()=>{
 const w=await start();w.choose('KLAC');w.input(w.field('bridge','debtValue'),'');assert.ok(w.get('.research-big-value'));assert.equal(w.get('.research-equity-value'),null);assert.match(w.get('#research-results').textContent,/unknown amount is not zero/);
 const links=w.root.querySelectorAll('a').map(x=>x.getAttribute('href'));assert.ok(links.some(x=>x?.includes('KLAC-v3.html')));assert.ok(!links.some(x=>x?.includes('evidence-KLAC')||x?.includes('dossiers.html#KLAC')));assert.match(w.get('#annual-evidence-history').textContent,/2020-06-30/);assert.match(w.get('#annual-evidence-history').textContent,/1,502.201/);w.destroy();
});

test('KLAC Chinese scope, claim controls, evidence and MC text translate without changing numbers or notes',async()=>{
 setLocale('en');const w=await start();w.choose('KLAC');const proto=Object.getPrototypeOf(w.root),query=proto.querySelectorAll;proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part.trim())))];};proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};localizeAnnualPresentation(w.root);const before=w.getState();clearTranslationDiagnostics();setLocale('zh-Hans');
 assert.match(w.get('#research-results').textContent,/2026 年 6 月 30 日/);assert.match(w.get('#research-results').textContent,/当前价格比较已禁用/);assert.match(w.get('#annual-editor-panel-claims').textContent,/经营流动性储备/);assert.match(w.get('#annual-evidence-history').textContent,/规范经营历史/);
 const adapter=annualResearchSimulationAdapter(before.draft);assert.match(annualLabel(adapter.introduction),/手动运行/);assert.deepEqual(w.getState(),before);assert.deepEqual(getMissingTranslations(),[]);setLocale('en');w.destroy();
});

test('Original fourteen case and preset data remain byte-identical to published V42',()=>{
 for(const path of ['dist/data/renewed-research-2026-10-17/cases.json','dist/data/studio-research-presets-2026-10-17-v1.json','dist/data/goog-selected-case-2026-10-18-v1.json'])assert.deepEqual(fs.readFileSync(new URL('../'+path,import.meta.url)),execFileSync('git',['show','d9c0a3bcef331232dfc2df7af2c545858959f4a7:'+path],{cwd:new URL('..',import.meta.url),maxBuffer:20e6}),path);
});
