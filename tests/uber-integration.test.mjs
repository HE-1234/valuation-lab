import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {INCREMENTAL_RESEARCH_PATHS,fetchIncrementalResearch,incrementalResearchDraft,incrementalAlternative} from '../dist/incremental-research.js';
import {researchDraftFor,calculateResearchOperating,researchTimingResult,restoreResearchDraft,loadAnnualResearchCase,exportResearchCase,terminalNormalizedDraft} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {simulateResearch,simulationResearchDefaults,researchStressDraft} from '../dist/research-simulation.js';
import {deriveAnnualGrowthHorizon,extendAnnualForMargin} from '../dist/annual-growth-horizon.js';
import {uberContext} from '../dist/uber-research-model.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {mountResearchWorkspace} from '../dist/research-view.js';import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {uberAllocationHTML,uberSiteRollforwardTemplate} from '../dist/uber-research-view.js';
import {UBER_ROLLFORWARD_NONNEG,UBER_ROLLFORWARD_SIGNED,UBER_CURRENT_CLAIMS,evaluateUber} from '../dist/uber-financial-engine.js';
import {setLocale,t} from '../dist/i18n.js';import {annualMessageKey} from '../dist/annual-localization.js';import {UBER_MESSAGES} from '../dist/uber-messages.js';
const r=incrementalRecord('UBER'),c=r.annualCase,root=new URL('../dist/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p.replace(/^\.\//,''),root))),file='./data/incremental-UBER-2026-10-19-v2/cases.json';
const fetcher=async path=>({ok:true,json:async()=>read(path)}),start=(extra={})=>startResearchWorkspace({fetcher,...extra,workspaceMount:(root,options)=>mountResearchWorkspace(root,{...options,catalogBundle:undefined})});
const fresh=()=>incrementalResearchDraft({ticker:'UBER',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:c});
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-8,Math.abs(b)*1e-11),`${a} != ${b}`);
const calc=d=>{const op=calculateResearchOperating(d),timing=researchTimingResult(d,op);return {op,bridge:calculateResearchBridge(d,timing.enterprise,{calculationDate:timing.date})};};
const syntheticOctober=()=>({...uberSiteRollforwardTemplate(),...Object.fromEntries([...UBER_ROLLFORWARD_NONNEG,...UBER_ROLLFORWARD_SIGNED].map(k=>[k,0])),eur_usd_at_issue:1.1,eur_usd_at_current_mark:1.1,euro_note_current_price_fraction:1,assumed_current_common_shares:2042560121,current_inherited_nondebt_claims:Object.fromEntries(UBER_CURRENT_CLAIMS.map(k=>[k,r.policyExample[k]]))});

test('UBER actual shipped files, immutable identity, hashes and additive public tradability are coherent',async()=>{
 assert.ok(INCREMENTAL_RESEARCH_PATHS.includes(file));assert.deepEqual(await fetchIncrementalResearch(fetcher,{path:file}),incrementalPackages.find(p=>p.version===r.identity.packageVersion));
 for(const k of ['source','history','audit','fullReport'])assert.equal(createHash('sha256').update(fs.readFileSync(new URL(r.identity[k+'Path'].replace(/^\.\//,''),root))).digest('hex'),r.identity[k+'SHA256']);
 const manifest=read('data/incremental-UBER-2026-10-19-v2/packaging-manifest.json');assert.equal(manifest.sourceBundleSHA256,'d58a42336df8bcf034bb905b05116fc3884002c1b70e2ee6b1536ab239ca0acc');assert.deepEqual(manifest.publicTransforms,[]);
 for(const [path,hash]of Object.entries(manifest.files))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('data/incremental-UBER-2026-10-19-v2/'+path,root))).digest('hex'),hash,path);
 assert.equal(r.history.length,10);assert.equal(r.history[0].cfo,null);assert.equal(r.history[0].cash_ppe_capex,null);assert.equal(r.history[0].revenue,3338);assert.equal(r.history[1].revenue,7402);assert.match(r.history[0].status,/partial.*unaudited/);
 const catalog=read('./data/atlas-company-catalog-v1.json');assert.equal(catalog.companies.filter(x=>x.ticker==='UBER').length,1);assert.deepEqual(catalog.companies.find(x=>x.ticker==='UBER'),r.publicTradability);assert.equal(r.publicTradability.mic,'XNYS');assert.equal(r.publicTradability.robinhood.status,'public-buy-sell-support');
});

test('UBER all three source cases reproduce exact default EV and explicit June allocation, never an October target',()=>{
 const expected=read('data/incremental-UBER-2026-10-19-v2/illustration-output-v2.json');
 for(const name of ['base','bear','bull']){const d=name==='base'?fresh():incrementalAlternative(fresh(),name).draft;assert.equal(d.uberPolicy,null);assert.equal(d.uberRollforward,null);assert.equal(calc(d).bridge.rawPerShare,null);assert.equal(calc(d).op.enterprise,expected.cases[name].operating_enterprise_value);d.uberPolicy=structuredClone(r.policyExample);const {op,bridge}=calc(d);assert.equal(op.enterprise,expected.cases[name].operating_enterprise_value);assert.equal(bridge.rawPerShare,expected.cases[name].allocation.conditional_june_allocation_per_share);assert.equal(bridge.current_target,null);assert.equal(bridge.currentCapitalVerified,false);assert.equal(bridge.priceComparisonEligible,false);assert.equal(bridge.uberRollforward,null);}
});

test('UBER complete numeric policies work without acknowledgement or rationale; unknown economic fields suppress allocation',()=>{
 const d=fresh();d.uberPolicy=structuredClone(r.policyExample);for(const key of ['assumption_basis','acknowledge_no_overlap_and_scope','use_reported_june_shares_rounded_to_thousand'])delete d.uberPolicy[key];assert.ok(calc(d).bridge.eligible);d.uberPolicy.finance_lease_claim=null;assert.equal(calc(d).bridge.rawPerShare,null);d.uberPolicy.finance_lease_claim=140;d.uberRollforward=uberSiteRollforwardTemplate();assert.equal(calc(d).bridge.uberRollforward.status,'incomplete_rollforward');d.uberRollforward=syntheticOctober();const b=calc(d).bridge;assert.ok(b.uberRollforward.conditional_october_allocation_per_share>0);assert.equal(b.uberRollforward.verified_current_target,null);assert.equal(b.current_target,null);assert.equal(b.uberRollforward.new_euro_notes_known_underwriting_discounts_eurm,24.875);assert.equal(b.interimAccrualRate,.095);
});

test('UBER annual edits transparently map bookings, EBIT, residual capex and terminal reinvestment',()=>{
 const d=fresh();d.annual[0].revenue+=100;d.annual[0].margin+=.001;d.annual[0].taxRate=.26;d.annual[0].reinvestment+=300;d.annual[1].wacc=.1;d.terminal.margin+=.001;d.terminal.roic=.27;const {op}=calc(d),v=uberContext(d);near(op.rows[0].revenue,d.annual[0].revenue);near(op.rows[0].ebit,d.annual[0].revenue*d.annual[0].margin);near(op.rows[0].reinvestment,d.annual[0].reinvestment);near(op.rows[0].gross_bookings,r.sourceOutputs.base.annual_forecast[0].gross_bookings*d.annual[0].revenue/c.annual[0].revenue);
 for(const row of op.rows)near(row.fcff,row.nopat-row.reinvestment);assert.ok(op.terminal.net_reinvestment>=op.terminal.roic_growth_reinvestment_floor);assert.deepEqual(v.result,evaluateUber(r.sourceInputs,'base',d.uberPolicy,v.annual,v.terminal));
 const restored=restoreResearchDraft(JSON.parse(JSON.stringify(d)),c);assert.equal(restored.error,null);assert.deepEqual(calc(restored.draft),calc(d));const ex=exportResearchCase(d,c);assert.deepEqual(ex.draft,d);assert.equal(ex.current_target,null);assert.equal(ex.conditional_june_model,true);
});

test('UBER fixed origin, identity, nonnegative residual budget and unsupported bridge outputs fail closed',()=>{
 for(const mutate of [d=>d.incrementalResearch.sourceSHA256='0'.repeat(64),d=>d.anchor.revenue++,d=>d.discountOrigin='2026-10-19',d=>d.timing.mode='as-of-scenario',d=>d.uberPolicy=undefined,d=>d.annual[0].reinvestment=-1e9,d=>d.annual[0].margin=NaN,d=>d.annual[0].taxRate=true,d=>d.current_target=1,d=>d.terminal.wacc=d.terminal.growth,d=>d.annual.pop()]){const d=fresh();mutate(d);const before=structuredClone(d);assert.throws(()=>calculateResearchOperating(d));assert.deepEqual(d,before);}
 const d=fresh();assert.throws(()=>terminalNormalizedDraft(d));assert.throws(()=>deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:15}));assert.throws(()=>extendAnnualForMargin(d,c,11));assert.throws(()=>calculateResearchBridge(d,calculateResearchOperating(d).enterprise,{calculationDate:'2026-10-19'}));assert.throws(()=>calculateResearchBridge(d,calculateResearchOperating(d).enterprise,{securityBasis:'ADS'}));
});

test('UBER actual file fetch failure/tamper remains pending, preserving previous ready companies',async()=>{
 for(const response of [{ok:false},{ok:true,json:async()=>({schemaVersion:1,companies:[]})},{ok:true,json:async()=>({...read(file),version:'tampered'})}]){const h=await start({fetcher:async p=>p===file?response:fetcher(p)});try{h.choose('UBER');assert.equal(h.getState().readiness,'research-pending');assert.equal(h.getState().draft,null);assert.equal(h.get('.research-big-value'),null);h.choose('UMC');assert.equal(h.getState().readiness,'ready');h.choose('AAPL');assert.equal(h.getState().readiness,'ready');}finally{h.destroy();}}
});

test('UBER real editor, policy selection, annual edit Undo, named-case Undo and export preserve state',async()=>{
 const h=await start();try{h.choose('UBER');assert.equal(h.getState().draft.uberPolicy,null);h.get('[data-uber-example]').click();const selected=structuredClone(h.getState().draft);h.input('[data-uber-policy="cash_operating_reserve"]','1001.123456789');assert.equal(h.getState().draft.uberPolicy.cash_operating_reserve,1001.123456789);h.action('undo-edit');assert.deepEqual(h.getState().draft,selected);
 h.input('#annual-year-reinvestment','1200.123456789');assert.equal(h.getState().draft.annual[0].reinvestment,1200.123456789);assert.ok(calc(h.getState().draft).op.enterprise);h.action('undo-edit');assert.deepEqual(h.getState().draft,selected);h.action('export');assert.equal(h.downloads.at(-1).value.current_target,null);near(h.downloads.at(-1).value.equityBridge.rawPerShare,90.75404366407617);
 h.choose('AAPL');h.choose('UBER');assert.deepEqual(h.getState().draft,selected);h.get('[data-incremental-scenario="bear"]').click();near(calc(h.getState().draft).bridge.rawPerShare,29.15446594473901);h.action('undo');assert.deepEqual(h.getState().draft,selected);h.get('[data-uber-clear]').click();assert.equal(calc(h.getState().draft).bridge.rawPerShare,null);
 }finally{h.destroy();}
});

test('UBER optional October JSON edits are retained, undoable, exported, and never current targets',async()=>{
 const h=await start();try{h.choose('UBER');h.get('[data-uber-example]').click();h.get('[data-uber-october-open]').click();assert.equal(h.getState().draft.uberRollforward.eur_usd_at_issue,null);assert.equal(calc(h.getState().draft).bridge.uberRollforward.status,'incomplete_rollforward');h.input('#uber-october-json',JSON.stringify(syntheticOctober()));assert.equal(calc(h.getState().draft).bridge.uberRollforward.status,'conditional_rollforward');h.action('export');assert.equal(h.downloads.at(-1).value.equityBridge.uberRollforward.verified_current_target,null);
 h.get('#uber-october-json').dispatch('blur');h.input('#uber-october-json','{invalid');assert.equal(h.getState().draft.uberRollforward,'{invalid');assert.throws(()=>calc(h.getState().draft));assert.equal(h.get('.research-equity-value'),null);h.action('undo-edit');assert.equal(calc(h.getState().draft).bridge.uberRollforward.status,'conditional_rollforward');h.get('[data-uber-october-clear]').click();assert.equal(h.getState().draft.uberRollforward,null);
 }finally{h.destroy();}
});

for(const raw of ['null','42','[1,2,3]','{invalid',JSON.stringify({ticker:'UBER',notes:'retain incompatible'})])test('UBER malformed raw saved '+raw+' survives export, Load, Undo and company switch',async()=>{
 const key=researchStorageKey(c),storage=new Map([[key,raw]]),h=await start({storage});try{h.choose('UBER');assert.ok(h.getState().identityError);assert.equal(storage.get(key),raw);h.action('export');assert.equal(h.downloads.at(-1).value.rawSavedDraft,raw);h.action('load');assert.equal(h.getState().identityError,null);h.action('undo');assert.ok(h.getState().identityError);assert.equal(storage.get(key),raw);h.choose('AAPL');h.choose('UBER');assert.equal(storage.get(key),raw);}finally{h.destroy();}
});

test('UBER EN/zh-Hans include all authored messages and partial source history, with no confirmation checkboxes',async()=>{
 const h=await start();try{h.choose('UBER');for(const locale of ['en','zh-Hans']){setLocale(locale);h.choose('AAPL');h.choose('UBER');for(const [key,pair]of Object.entries(UBER_MESSAGES)){const id=annualMessageKey(pair[0]);assert.ok(id,key);assert.equal(t(id),pair[locale==='en'?0:1],key);}assert.equal(h.root.querySelectorAll('input[type="checkbox"]').length,0);assert.ok(h.root.textContent.includes(UBER_MESSAGES.history2016[locale==='en'?0:1]));assert.ok(h.root.textContent.includes(r.prose.mapping[locale]));assert.ok(h.root.textContent.includes(r.prose.capital[locale]));}}finally{setLocale('en');h.destroy();}
});

test('UBER fixed/manual stochastic paths remain EV-only even with selected June and October allocations',()=>{
 for(const selected of [false,true]){const d=fresh();if(selected){d.uberPolicy=structuredClone(r.policyExample);d.uberRollforward=syntheticOctober();}const config={...simulationResearchDefaults(d),trials:7,seed:'uber-fixed'},s=simulateResearch(d,config);assert.equal(s.current_target,null);assert.equal(s.enterprise.accepted,7);assert.equal(s.perShare.accepted,0);assert.equal(s.equity.accepted,0);for(const row of s.scenarios){near(row.enterprise,calculateResearchOperating(d).enterprise);assert.equal(row.perShare,null);assert.equal(row.equity,null);}assert.deepEqual(s,simulateResearch(d,config));}
 const d=researchStressDraft(fresh(),{growthPremium:.001,marginShift:.0005,investmentMultiplier:1.01,waccShift:.001});assert.ok(Number.isFinite(calculateResearchOperating(d).enterprise));
});


test('UBER complete October cash/equity shortfall is distinguished from missing inputs in both languages',()=>{
 const d=fresh();d.uberPolicy=structuredClone(r.policyExample);d.uberRollforward={...syntheticOctober(),buyback_cash:100000};const bridge=calc(d).bridge,oct=bridge.uberRollforward;assert.equal(oct.status,'suppressed_cash_or_equity_shortfall');assert.equal(oct.conditional_october_allocation_per_share,null);assert.equal(oct.verified_current_target,null);near(oct.ending_unrestricted_liquidity_assumed,-90163.12425);
 try{for(const locale of ['en','zh-Hans']){setLocale(locale);const markup=uberAllocationHTML(bridge);assert.ok(markup.includes(UBER_MESSAGES.octoberShortfall[locale==='en'?0:1]));assert.ok(markup.includes(UBER_MESSAGES.endingCash[locale==='en'?0:1]));assert.ok(markup.includes(UBER_MESSAGES.endingReserve[locale==='en'?0:1]));assert.ok(!markup.includes(UBER_MESSAGES.octoberMissing[locale==='en'?0:1]));assert.match(markup,/-90,163.12/);}}finally{setLocale('en');}
});


test('UBER complete June nonpositive equity and terminal FCFF retain a distinct suppression reason',()=>{
 for(const mutate of [d=>d.uberPolicy.additional_other_claim=1e9,d=>d.annual[9].reinvestment=d.annual[9].revenue*.5]){const d=fresh();d.uberPolicy=structuredClone(r.policyExample);mutate(d);const {op,bridge}=calc(d);assert.equal(bridge.uberAllocation.status,'suppressed_nonpositive_economics');assert.equal(bridge.reason,UBER_MESSAGES.juneNonpositive[0]);assert.equal(bridge.rawPerShare,null);assert.equal(bridge.current_target,null);assert.ok(bridge.uberAllocation.conditional_common_equity_value<=0||op.terminal.fcff<=0);try{for(const locale of ['en','zh-Hans']){setLocale(locale);assert.ok(uberAllocationHTML(bridge).includes(UBER_MESSAGES.juneNonpositive[locale==='en'?0:1]));}}finally{setLocale('en');}}
});
