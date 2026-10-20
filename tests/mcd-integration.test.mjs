import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {INCREMENTAL_RESEARCH_PATHS,fetchIncrementalResearch,incrementalResearchDraft,incrementalAlternative} from '../dist/incremental-research.js';
import {researchDraftFor,calculateResearchOperating,researchTimingResult,restoreResearchDraft,loadAnnualResearchCase,exportResearchCase,terminalNormalizedDraft} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';import {simulateResearch,simulationResearchDefaults,researchStressDraft,researchAnnualPathContext} from '../dist/research-simulation.js';
import {deriveAnnualGrowthHorizon,extendAnnualForMargin} from '../dist/annual-growth-horizon.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';import {mountResearchWorkspace} from '../dist/research-view.js';import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {annualRevenueGrowthData,annualFCFFGrowthData} from '../dist/annual-revenue-growth-chart.js';import {setLocale,t} from '../dist/i18n.js';import {annualMessageKey} from '../dist/annual-localization.js';import {MCD_MESSAGES} from '../dist/mcd-messages.js';
import {validateCompanyCatalog,isUSRobinhoodCandidate} from '../dist/company-catalog.js';
const r=incrementalRecord('MCD'),c=r.annualCase,root=new URL('../dist/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p.replace(/^\.\//,''),root))),file='./data/incremental-MCD-2026-10-19-v2/cases.json',base='./data/incremental-MCD-2026-10-19-v2/';
const fetcher=async path=>({ok:true,json:async()=>read(path)}),start=(extra={})=>startResearchWorkspace({fetcher,...extra,workspaceMount:(root,options)=>mountResearchWorkspace(root,{...options,catalogBundle:undefined})});
const fresh=()=>incrementalResearchDraft({ticker:'MCD',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:c});
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-8,Math.abs(b)*1e-11),`${a} != ${b}`);
const calc=d=>{const op=calculateResearchOperating(d),timing=researchTimingResult(d,op);return {op,bridge:calculateResearchBridge(d,timing.enterprise,{calculationDate:timing.date})};};

test('MCD exact public source files, review, shipped fetch envelope and verified directory admission',async()=>{
 assert.ok(INCREMENTAL_RESEARCH_PATHS.includes(file));assert.deepEqual(await fetchIncrementalResearch(fetcher,{path:file}),incrementalPackages.find(p=>p.version===r.identity.packageVersion));
 for(const k of ['source','history','audit','fullReport'])assert.equal(createHash('sha256').update(fs.readFileSync(new URL(r.identity[k+'Path'].replace(/^\.\//,''),root))).digest('hex'),r.identity[k+'SHA256']);
 const m=read(base+'packaging-manifest.json');assert.equal(m.sourceBundleSHA256,'18cf7498dd23a41a1357742c25addbf20bd07ed8947a365e4ccd18d41925a929');for(const [p,h]of Object.entries(m.files))assert.equal(createHash('sha256').update(fs.readFileSync(new URL((base+p).replace(/^\.\//,''),root))).digest('hex'),h,p);
 const catalog=validateCompanyCatalog(read('./data/atlas-company-catalog-v1.json')),identity=catalog.companies.find(x=>x.ticker==='MCD');assert.deepEqual(identity,r.publicTradability);assert.ok(isUSRobinhoodCandidate(identity));assert.equal(r.history.length,10);assert.deepEqual(r.history.map(x=>x.fiscal_year),Array.from({length:10},(_,i)=>2016+i));assert.equal(r.identity.currentPriceTargetEligible,false);assert.equal(r.readiness.fundingCertified,false);
});
test('MCD adapter reproduces all source paths and nine explicit conditional allocations without defaulting claims',()=>{
 const d=fresh();assert.equal(d.mcdPolicy,null);assert.equal(calc(d).bridge.rawPerShare,null);assert.equal(calc(d).op.current_target,null);
 const expected=read(base+'allocation-illustrations-v2.json').results;
 for(const name of ['base','bear','bull']){const x=name==='base'?fresh():incrementalAlternative(fresh(),name).draft,{op}=calc(x),source=r.sourceOutput.results[name];near(op.enterprise,source.core_operating_ev);assert.equal(op.rows.length,11);for(let i=0;i<11;i++){near(op.rows[i].fcff,source.rows[i].fcff);near(op.rows[i].pv,source.rows[i].pv_fcff);assert.equal(op.rows[i].yearsFromOrigin,i+.5);}for(const e of r.policyExamples){x.mcdPolicy=structuredClone(e.policy);const {bridge}=calc(x),v=expected.find(y=>y.allocation_policy===e.name&&y.operating_scenario===name);near(bridge.rawPerShare,v.conditional_june_allocation_per_share);near(bridge.equity,v.conditional_june_equity_value);assert.equal(bridge.current_target,null);assert.equal(bridge.current_upside,null);assert.equal(bridge.funding_certified,false);assert.equal(bridge.priceComparisonEligible,false);}}
});
test('MCD year growth and H2 cash flows use correct comparable periods in editing, chart and sampler data',()=>{
 const d=fresh(),{op}=calc(d),growth=annualRevenueGrowthData(op.rows,d.anchor.revenue),fcff=annualFCFFGrowthData(op.rows),path=researchAnnualPathContext(d).baseline;
 near(growth[0].growth,(d.annual[0].revenue+13616)/26885-1);near(growth[1].growth,d.annual[1].revenue/(d.annual[0].revenue+13616)-1);assert.equal(fcff[0].growth,null);assert.equal(fcff[1].growth,null);near(fcff[2].growth,op.rows[2].fcff/op.rows[1].fcff-1);assert.deepEqual(path,growth.map(x=>x.growth));
 const x=researchStressDraft(d,{growthPremium:.01});near(x.annual[0].revenue+13616,26885*(1+path[0]+.01));
});
test('MCD annual edits and JSON round-trip retain exact values, adjustments, policy and null current targets',()=>{
 const d=fresh();d.mcdPolicy=structuredClone(r.policyExamples[0].policy);d.annual[0].revenue+=123.456789123;d.annual[1].margin+=.000321123;d.annual[2].taxRate=.234567891;d.annual[3].reinvestment+=456.789123;d.annual[4].wacc=.083456789;d.terminal.roic=.193456789;const {op,bridge}=calc(d);
 for(const row of op.rows){near(row.fcff,row.nopat-row.reinvestment);near(row.reinvestment,row.cash_capex+row.new_finance_lease_assets_as_economic_capex+row.change_in_nwc-row.consolidated_da+row.analyst_net_investment_adjustment);}assert.ok(op.rows.some(row=>Math.abs(row.analyst_net_investment_adjustment)>1));
 const restored=restoreResearchDraft(JSON.parse(JSON.stringify(d)),c);assert.equal(restored.error,null);assert.deepEqual(calc(restored.draft),{op,bridge});const out=exportResearchCase(d,c);assert.equal(out.current_target,null);assert.equal(out.current_upside,null);assert.equal(out.funding_certified,false);assert.deepEqual(out.draft,d);assert.equal(loadAnnualResearchCase(d,c).draft.mcdPolicy.basis,d.mcdPolicy.basis);
});
test('MCD dates, identity, horizon and malformed inputs fail closed without mutation',()=>{
 for(const mutate of [d=>d.incrementalResearch.sourceSHA256='0'.repeat(64),d=>d.discountOrigin='2026-10-19',d=>d.anchor.revenue++,d=>d.timing.mode='as-of-scenario',d=>delete d.mcdPolicy,d=>d.mcdPolicy={},d=>d.annual[0].revenue=null,d=>d.annual[0].reinvestment=-1e8,d=>d.current_target=10,d=>d.terminal.roic=d.terminal.growth]){const d=fresh();mutate(d);const original=structuredClone(d);assert.throws(()=>calc(d));assert.deepEqual(d,original);}
 const d=fresh();assert.throws(()=>terminalNormalizedDraft(d));assert.throws(()=>deriveAnnualGrowthHorizon(d,c,{growthMaturityYear:15}));assert.throws(()=>extendAnnualForMargin(d,c,12));
});
test('MCD actual file-backed startup, six explicit controls, annual growth edit Undo and exports',async()=>{
 const h=await start();try{h.choose('MCD');assert.equal(h.getState().readiness,'ready');assert.equal(h.getState().draft.mcdPolicy,null);assert.ok(h.get('.research-big-value'));h.get('[data-mcd-example="0"]').click();near(calc(h.getState().draft).bridge.rawPerShare,208.9367055464268);const selected=structuredClone(h.getState().draft);
 h.input('[data-mcd-policy="minimum_operating_cash"]','900.123456789');assert.equal(h.getState().draft.mcdPolicy.minimum_operating_cash,900.123456789);assert.ok(Number.isFinite(calc(h.getState().draft).bridge.rawPerShare));h.action('undo-edit');assert.deepEqual(h.getState().draft,selected);
 h.input('[data-year-field="growth"]','10');near(h.getState().draft.annual[0].revenue,26885*1.1-13616);h.action('undo-edit');assert.deepEqual(h.getState().draft,selected);
 h.action('export');assert.equal(h.downloads.at(-1).value.current_target,null);assert.equal(h.downloads.at(-1).value.funding_certified,false);near(h.downloads.at(-1).value.equityBridge.rawPerShare,208.9367055464268);
 h.choose('AAPL');h.choose('MCD');assert.deepEqual(h.getState().draft,selected);h.get('[data-incremental-scenario="bear"]').click();near(calc(h.getState().draft).bridge.rawPerShare,83.34206232741434);h.action('undo');assert.deepEqual(h.getState().draft,selected);h.get('[data-mcd-clear]').click();assert.equal(h.getState().draft.mcdPolicy,null);h.get('[data-mcd-start]').click();for(const key of ['finance_lease_claim','affiliate_equity_value','other_nonoperating_assets','minimum_operating_cash','existing_award_incremental_claim','other_noncommon_claims'])assert.equal(h.getState().draft.mcdPolicy[key],null);assert.ok(h.get('.research-big-value')===null,'No operating value is rendered');assert.equal(h.root.querySelectorAll('input[type="checkbox"]').length,0);
 }finally{h.destroy();}
});
test('MCD altered/unavailable real fetch remains pending; existing companies stay ready',async()=>{
 for(const response of [{ok:false},{ok:true,json:async()=>({...read(file),version:'tampered'})}]){const h=await start({fetcher:async p=>p===file?response:fetcher(p)});try{h.choose('MCD');assert.equal(h.getState().readiness,'research-pending');assert.equal(h.getState().draft,null);assert.ok(h.get('.research-big-value')===null,'No operating value is rendered');h.choose('UMC');assert.equal(h.getState().readiness,'ready');}finally{h.destroy();}}
});
test('MCD invalid saved policies and raw drafts survive export, recovery and visible Undo',async()=>{
 const key=researchStorageKey(c);for(const value of ['{invalid','42',JSON.stringify({...fresh(),mcdPolicy:{}}),JSON.stringify({...fresh(),mcdPolicy:[]})]){const storage=new Map([[key,value]]),h=await start({storage});try{h.choose('MCD');assert.equal(storage.get(key),value);assert.ok(h.get('.research-big-value')===null,'No operating value is rendered');h.action('export');assert.equal(h.downloads.at(-1).value.current_target,null);assert.equal(storage.get(key),value);if(h.get('[data-mcd-example="0"]')){h.get('[data-mcd-example="0"]').click();assert.ok(h.get('.research-big-value'));h.action('undo-edit');assert.equal(storage.get(key),value);}else{h.action('load');assert.ok(h.get('.research-big-value'));h.action('undo');assert.equal(storage.get(key),value);}h.choose('AAPL');h.choose('MCD');assert.equal(storage.get(key),value);}finally{h.destroy();}}
});
test('MCD EN and Simplified Chinese cover all messages and adjacent ten-year history with no certainty gates',async()=>{
 const h=await start();try{h.choose('MCD');for(const locale of ['en','zh-Hans']){setLocale(locale);h.get('[data-mcd-clear]').click();for(const [key,pair]of Object.entries(MCD_MESSAGES)){const id=annualMessageKey(pair[0]);assert.ok(id,key);assert.equal(t(id),pair[locale==='en'?0:1],key);}for(const group of ['growth','profitability','capital'])assert.equal(h.get(`[data-mcd-history="${group}"]`).querySelector('tbody').querySelectorAll('tr').length,10);assert.ok(h.root.textContent.includes(MCD_MESSAGES.history[locale==='en'?0:1]));assert.equal(h.root.querySelectorAll('input[type="checkbox"]').length,0);assert.ok(!h.get('[aria-labelledby="annual-revenue-growth-title"]').textContent.includes('origin TTM'));assert.ok(h.root.querySelector('[data-research-action="normalize"]')===null,'No capital-normalization button is rendered');}}finally{setLocale('en');h.destroy();}
});

test('MCD rejects spoofed calculated row fields and terminal metadata instead of presenting them as outputs',()=>{
 for(const [key,value]of Object.entries({fcff:0,cash_capex:0,current_target:300,funding_certified:true,pv_fcff:0})){const d=fresh();d.annual[0][key]=value;assert.throws(()=>calculateResearchOperating(d));assert.throws(()=>exportResearchCase(d,c));}
 for(const [key,value]of Object.entries({value:1,current_target:300,funding_certified:true})){const d=fresh();d.terminal[key]=value;assert.throws(()=>calculateResearchOperating(d));}
 const d=fresh(),op=calculateResearchOperating(d);near(op.rows[0].fcff,op.rows[0].nopat-op.rows[0].reinvestment);
});
