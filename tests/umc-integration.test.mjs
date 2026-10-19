import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {INCREMENTAL_RESEARCH_PATHS,fetchIncrementalResearch,incrementalResearchDraft,incrementalAlternative} from '../dist/incremental-research.js';
import {researchDraftFor,calculateResearchOperating,researchTimingResult,restoreResearchDraft,loadAnnualResearchCase,exportResearchCase,terminalNormalizedDraft} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {simulateResearch,simulationResearchDefaults,researchStressDraft} from '../dist/research-simulation.js';
import {deriveAnnualGrowthHorizon,extendAnnualForMargin} from '../dist/annual-growth-horizon.js';
import {umcContext} from '../dist/umc-research-model.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {mountResearchWorkspace} from '../dist/research-view.js';import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {setLocale,t} from '../dist/i18n.js';import {annualMessageKey} from '../dist/annual-localization.js';import {UMC_MESSAGES} from '../dist/umc-messages.js';
const r=incrementalRecord('UMC'),c=r.annualCase,root=new URL('../dist/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p.replace(/^\.\//,''),root))),file='./data/incremental-UMC-2026-10-19-v1/cases.json';
const fetcher=async path=>({ok:true,json:async()=>read(path)}),start=(extra={})=>startResearchWorkspace({fetcher,...extra,workspaceMount:(root,options)=>mountResearchWorkspace(root,{...options,catalogBundle:undefined})});
const fresh=()=>incrementalResearchDraft({ticker:'UMC',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:c});
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-8,Math.abs(b)*1e-11),`${a} != ${b}`);
const applyPolicy=(d,p)=>{d.umcPolicy=structuredClone(p);if(p)d.annual.forEach((row,i)=>row.reinvestment+=p.supplemental_operating_cash_by_year[i]);return d;};
const calc=d=>{const op=calculateResearchOperating(d),timing=researchTimingResult(d,op);return {op,bridge:calculateResearchBridge(d,timing.enterprise,{calculationDate:timing.date})};};

test('UMC shipped envelope, source hashes, exclusions and frozen raw-free transformation manifest are exact',async()=>{
 assert.ok(INCREMENTAL_RESEARCH_PATHS.includes(file));assert.deepEqual(await fetchIncrementalResearch(fetcher,{path:file}),incrementalPackages.at(-1));
 for(const k of ['source','history','audit','fullReport'])assert.equal(createHash('sha256').update(fs.readFileSync(new URL(r.identity[k+'Path'].replace(/^\.\//,''),root))).digest('hex'),r.identity[k+'SHA256']);
 const p='data/incremental-UMC-2026-10-19-v1/',manifest=read(p+'packaging-manifest.json'),original=read(p+'integrity-manifest-v1.json');assert.equal(manifest.sourceBundleSHA256,'b1759e15c3aeb3b8044f95034cb723aae24fb90ad5fe92d1d89ce3c5da3d4523');
 for(const [name,hash]of Object.entries(manifest.files)){assert.doesNotMatch(name,/(^|\/)(sources|private-sources|__pycache__)(\/|$)|\.pdf$|\.pyc$/);assert.equal(createHash('sha256').update(fs.readFileSync(new URL(p+name,root))).digest('hex'),hash,name);}
 for(const source of original.files){const transform=manifest.publicTransforms.find(t=>t.path===source.path);assert.equal(transform?.sourceSHA256??manifest.files[source.path],source.sha256,source.path);if(transform)assert.equal(manifest.files[source.path],transform.publicSHA256);}
 assert.equal(r.history.length,10);assert.equal(r.guidanceComparisons.length,50);assert.equal(new Set(r.guidanceComparisons.map(v=>v.target_period)).size,10);assert.equal(r.identity.currentPriceTargetEligible,false);assert.equal(r.sourceInputs.selected_policy,null);assert.equal(r.sourceInputs.current_target,null);
});

test('UMC adapter reproduces all9 source financial/funding outcomes; policy is never auto-selected',()=>{
 const original=read('data/incremental-UMC-2026-10-19-v1/dcf-output-v1.json');const initial=fresh();assert.equal(initial.umcPolicy,null);assert.equal(calc(initial).bridge.rawPerShare,null);assert.equal(calc(initial).op.umcAllocation.funding,null);
 for(const example of original.examples)for(const name of ['base','bear','bull']){const d=applyPolicy(name==='base'?fresh():incrementalAlternative(fresh(),name).draft,example.policy),{op,bridge}=calc(d),expected=example.scenarios[name];near(op.enterprise,expected.enterprise_value_twd_m);near(op.umcAllocation.funding.minimum_available_liquidity,expected.funding.minimum_available_liquidity);assert.equal(bridge.current_target,null);assert.equal(bridge.priceComparisonEligible,false);assert.equal(bridge.currentCapitalVerified,false);if(expected.conditional_usd_per_ads===null){assert.equal(bridge.conditional_usd_per_ads,null);assert.equal(bridge.rawPerShare,null);}else{near(bridge.conditional_usd_per_ads,expected.conditional_usd_per_ads);near(bridge.rawPerShare,expected.conditional_twd_per_ordinary);near(bridge.conditional_usd_per_ads,bridge.rawPerShare*5/31.837);}assert.ok(!Object.keys(op.umcAllocation).some(k=>k.startsWith('unfunded_mathematical')));}
});

test('UMC source/date/horizon, portfolio exclusion and negative residual capex fail closed',()=>{
 for(const mutate of [d=>d.incrementalResearch.sourceSHA256='0'.repeat(64),d=>d.discountOrigin='2026-10-19',d=>d.anchor.revenue++,d=>d.timing.mode='as-of-scenario',d=>d.umcPolicy=undefined,d=>d.umcDaNonlease[0]=null,d=>d.umcPolicy.nonoperating_equity_value_assigned=1,d=>d.umcPolicy.circular_crossholding_share_reduction=1,d=>d.annual[0].reinvestment=-1e8,d=>d.current_target=10,d=>d.umcPolicy.time_deposit_funding_release_year=1.5]){const d=applyPolicy(fresh(),r.policyExamples[2]);mutate(d);const before=structuredClone(d);assert.throws(()=>calculateResearchOperating(d));assert.throws(()=>calc(d));assert.deepEqual(d,before);}
 const d=fresh();assert.throws(()=>terminalNormalizedDraft(d));assert.throws(()=>deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:15}));assert.throws(()=>extendAnnualForMargin(d,c,11));
 const broken=applyPolicy(fresh(),r.policyExamples[2]);broken.umcPolicy.required_operating_cash=null;assert.throws(()=>umcContext(broken),e=>e.status==='invalid_assumptions'&&e.current_target===null&&e.conditional_usd_per_ads===null);
});

test('UMC explicit annual edits produce reproducible residual capex and exports retain policy/units/null targets',()=>{
 const d=applyPolicy(fresh(),r.policyExamples[2]);d.annual[0].revenue+=100;d.annual[0].margin+=.001;d.annual[0].reinvestment+=321.123456789;d.umcDaNonlease[3]+=12.345678901;d.terminal.roic=.133333333;const {op,bridge}=calc(d);for(let i=0;i<10;i++){const row=op.rows[i];near(row.all_in_cash_capex,d.annual[i].reinvestment+d.umcDaNonlease[i]-row.change_working_capital-row.incremental_operating_cash_obligations);near(row.fcff,row.nopat-row.reinvestment);}
 const saved=restoreResearchDraft(JSON.parse(JSON.stringify(d)),c);assert.equal(saved.error,null);assert.deepEqual(calc(saved.draft),{op,bridge});const ex=exportResearchCase(d,c);assert.equal(ex.current_target,null);assert.equal(ex.nonoperating_investment_portfolio_excluded,true);assert.deepEqual(ex.draft,d);assert.equal(ex.operating.umcAllocation.ordinary_per_ads,5);
});

test('UMC simulation is manual-compatible EV-only with fixed initial uncertainty and per-trial engine replay',()=>{
 for(const p of [null,r.policyExamples[0],r.policyExamples[2]]){const d=applyPolicy(fresh(),p),config={...simulationResearchDefaults(d),trials:7,seed:'umc-fixed'},s=simulateResearch(d,config),op=calculateResearchOperating(d);assert.equal(s.current_target,null);assert.equal(s.selected_policy,p?.policy_id??null);assert.equal(s.perShare.accepted,0);assert.equal(s.equity.accepted,0);assert.equal(s.enterprise.accepted,7);for(const row of s.scenarios){near(row.enterprise,op.enterprise);assert.equal(row.perShare,null);assert.equal(row.equity,null);}assert.deepEqual(simulateResearch(d,config),s);}
 const d=applyPolicy(fresh(),r.policyExamples[2]),next=researchStressDraft(d,{growthPremium:.01,marginShift:-.003,waccShift:.002,investmentMultiplier:1.1});const before=structuredClone(next),op=calculateResearchOperating(next);assert.ok(Number.isFinite(op.enterprise));assert.deepEqual(next,before);assert.deepEqual(next.umcPolicy,d.umcPolicy);
});

test('UMC unavailable or altered actual fetch remains pending while prior companies stay ready',async()=>{
 for(const response of [{ok:false},{ok:true,json:async()=>({schemaVersion:1,companies:[]})},{ok:true,json:async()=>({...read(file),version:'tampered'})}]){const h=await start({fetcher:async p=>p===file?response:fetcher(p)});try{h.choose('UMC');assert.equal(h.getState().readiness,'research-pending');assert.equal(h.getState().draft,null);assert.equal(h.get('.research-big-value'),null);h.choose('RMBS');assert.equal(h.getState().readiness,'ready');h.choose('CEVA');assert.equal(h.getState().readiness,'ready');}finally{h.destroy();}}
});

test('UMC visible selection, edit Undo, scenario Load Undo, export and company switching preserve exact policy state',async()=>{
 const h=await start();try{h.choose('UMC');assert.equal(h.getState().draft.umcPolicy,null);assert.equal(h.get('.umc-conditional-ads'),null);h.get('[data-umc-example="2"]').click();const selected=structuredClone(h.getState().draft);near(calc(selected).bridge.conditional_usd_per_ads,8.791089313709156);h.input('[data-umc-policy="required_operating_cash"]','15001.123456789');assert.equal(h.getState().draft.umcPolicy.required_operating_cash,15001.123456789);h.action('undo-edit');assert.deepEqual(h.getState().draft,selected);h.action('export');assert.equal(h.downloads.at(-1).value.current_target,null);near(h.downloads.at(-1).value.equityBridge.conditional_usd_per_ads,8.791089313709156);h.choose('AAPL');h.choose('UMC');assert.deepEqual(h.getState().draft,selected);h.get('[data-incremental-scenario="bear"]').click();near(calc(h.getState().draft).bridge.conditional_usd_per_ads,3.336462305262846);h.action('undo');assert.deepEqual(h.getState().draft,selected);h.get('[data-umc-example="0"]').click();assert.equal(calc(h.getState().draft).bridge.rawPerShare,null);assert.match(h.get('#research-results').textContent,/withheld|shortfall|incomplete/i);h.get('[data-umc-clear]').click();assert.equal(h.getState().draft.umcPolicy,null);assert.equal(calc(h.getState().draft).bridge.rawPerShare,null);}finally{h.destroy();}
});

for(const raw of ['null','42','[1,2,3]','{invalid',JSON.stringify({ticker:'UMC',notes:'retain incompatible research'})])test('UMC malformed raw saved '+raw+' survives export/research Load/Undo/switch/reload',async()=>{
 const key=researchStorageKey(c),storage=new Map([[key,raw]]);let h=await start({storage});h.choose('UMC');assert.ok(h.getState().identityError);assert.equal(storage.get(key),raw);assert.equal(h.get('.research-big-value'),null);h.action('export');assert.equal(h.downloads.length,1);assert.equal(h.downloads.at(-1).value.current_target,null);assert.equal(storage.get(key),raw);h.action('load');assert.equal(h.getState().identityError,null);h.action('undo');assert.ok(h.getState().identityError);assert.equal(storage.get(key),raw);h.choose('AAPL');h.choose('UMC');assert.equal(storage.get(key),raw);h.destroy();h=await start({storage});h.choose('UMC');assert.ok(h.getState().identityError);assert.equal(storage.get(key),raw);h.destroy();
});

test('UMC malformed saved policy shapes retain bytes, withhold results and recover using visible policy then Undo edit',async()=>{
 const key=researchStorageKey(c);for(const p of [{},[],42,'NaN',{lease_cash_by_year:null},{...r.policyExamples[2],lease_cash_by_year:[1]},{...r.policyExamples[2],lease_cash_by_year:Array(10).fill('NaN')},{...r.policyExamples[2],required_operating_cash:null},{...r.policyExamples[2],nonoperating_equity_value_assigned:1}]){const d=fresh();d.umcPolicy=structuredClone(p);const raw=JSON.stringify(d),storage=new Map([[key,raw]]),h=await start({storage});try{h.choose('UMC');assert.equal(storage.get(key),raw);assert.equal(h.get('.research-big-value'),null);h.action('export');assert.equal(h.downloads.at(-1).value.current_target,null);assert.equal(storage.get(key),raw);h.choose('AAPL');h.choose('UMC');assert.equal(storage.get(key),raw);assert.ok(h.get('[data-umc-example="2"]'));h.get('[data-umc-example="2"]').click();assert.ok(Number.isFinite(calc(h.getState().draft).bridge.rawPerShare));h.action('undo-edit');assert.deepEqual(h.getState().draft.umcPolicy,p);assert.equal(storage.get(key),raw);}finally{h.destroy();}}
});

test('UMC EN and Simplified Chinese contain dated scope, all policy labels, historical references and no confirmation checkboxes',async()=>{
 const h=await start();try{h.choose('UMC');for(const locale of ['en','zh-Hans']){setLocale(locale);for(const [key,pair]of Object.entries(UMC_MESSAGES)){const id=annualMessageKey(pair[0]);assert.ok(id,key);assert.equal(t(id),pair[locale==='en'?0:1],key);}assert.equal(h.root.querySelectorAll('input[type="checkbox"]').length,0);h.get('[data-umc-example="2"]').click();assert.match(h.get('#research-results').textContent,/31\.837/);assert.match(h.get('#research-results').textContent,/8\.79/);assert.equal(calc(h.getState().draft).bridge.current_target,null);assert.match(h.root.textContent,locale==='en'?/original|audited|history/i:/历史|原始/);}}finally{setLocale('en');h.destroy();}
});


test('UMC summary retains the full scope once in both locales and keeps all detailed claims caveats',async()=>{
 const h=await start();try{h.choose('UMC');for(const locale of ['en','zh-Hans']){setLocale(locale);for(const policy of [null,0,2]){if(policy===null)h.get('[data-umc-clear]').click();else h.get(`[data-umc-example="${policy}"]`).click();const summary=h.get('#research-results'),scope=r.prose.scope[locale];const visibleSummaryParagraphs=summary.querySelectorAll('p.annual-summary-caveat');assert.equal(visibleSummaryParagraphs.filter(p=>p.textContent===scope).length,1,`${locale}/${policy}: full dated scope appears once`);assert.ok(summary.textContent.includes(UMC_MESSAGES.scope[locale==='en'?0:1]),`${locale}/${policy}: allocation exclusion caveat retained`);assert.equal(calc(h.getState().draft).bridge.current_target,null);}}}finally{setLocale('en');h.destroy();}
});
