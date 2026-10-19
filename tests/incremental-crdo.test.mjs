import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {incrementalResearchDraft,incrementalAlternative} from '../dist/incremental-research.js';
import {calculateResearchOperating,researchDraftIssues,restoreResearchDraft,exportResearchCase} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {simulateResearch} from '../dist/research-simulation.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {fixture} from './v7-simulation-harness.mjs';
import {annualLabel} from '../dist/annual-localization.js';
import {setLocale} from '../dist/i18n.js';
import {incrementalEvidenceHTML} from '../dist/incremental-research-view.js';
const r=incrementalRecord('CRDO'),source=JSON.parse(fs.readFileSync(new URL('./fixtures/crdo-v3/dcf-output-v3.json',import.meta.url)));
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const draft=()=>incrementalResearchDraft({ticker:'CRDO',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-11),`${a} != ${b}`);
for(const name of ['base','bear','bull'])test(`CRDO ${name} annual/stub/claims replay independently audited v3`,()=>{
 const d=name==='base'?draft():incrementalAlternative(draft(),name).draft,o=calculateResearchOperating(d),s=source.find(x=>x.mode==='current'&&x.scenario===name),b=calculateResearchBridge(d,o.enterprise);
 assert.deepEqual(researchDraftIssues(d),[]);near(o.enterprise,s.enterprise_value);near(b.perShare,s.value_per_common_share);near(b.equity,s.common_equity_value);near(o.minimumModeledLiquidity,s.minimum_modeled_liquidity);near(b.basicShares,s.common_shares);near(b.expectedEarnout,s.expected_earnout_shares);
 for(const [i,row]of o.rows.entries())for(const [k,sk]of [['revenue','revenue'],['nopat','nopat'],['reinvestment','annual_reinvestment'],['fcff','fcff'],['discountFactor','discount_factor'],['pv','pv_fcff'],['remainingOperatingFraction','remaining_operating_fraction'],['liquidityAfterReservedClaims','liquidity_after_reserved_claims']])near(row[k],s.rows[i][sk]);
 near(o.terminalPV,s.pv_terminal);assert.equal(b.currentCapitalVerified,false);assert.equal(b.priceComparisonEligible,false);assert.equal(b.asKnownBacktestEligible,false);
 const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(sim.accepted,3);for(const x of sim.enterprise.draws)near(x,o.enterprise);for(const x of sim.perShare.draws)near(x,b.perShare);
});
test('CRDO every exposed control responds or preserves a documented funding constraint',()=>{
 const d=draft(),base=calculateResearchOperating(d),b=calculateResearchBridge(d,base.enterprise);
 for(const f of r.bridge.options){const next=draft(),old=next.bridgeInputs[f.key];next.bridgeInputs[f.key]=f.key==='minimumCashFloor'?10:old===1?.9:old*1.01+.001;const op=calculateResearchOperating(next),bridge=calculateResearchBridge(next,op.enterprise);assert.ok(Number.isFinite(bridge.perShare),f.key);if(f.key!=='minimumCashFloor')assert.notEqual(bridge.perShare,b.perShare,f.key);}
 for(const f of r.bridge.options)for(const bad of [null,NaN,Infinity,-Infinity,'0',true]){const next=draft();next.bridgeInputs[f.key]=bad;assert.throws(()=>calculateResearchOperating(next),undefined,f.key+String(bad));}
 for(const f of ['rsuVestingProbability','psuVestingProbability','earnoutProbability'])for(const bad of [-.1,1.1]){const next=draft();next.bridgeInputs[f]=bad;assert.throws(()=>calculateResearchOperating(next));}
 for(const key of ['interestBearingDebt','debtWeight','newFinancing']){const next=draft();next.bridgeInputs[key]=1;assert.ok(researchDraftIssues(next).length);assert.throws(()=>calculateResearchOperating(next));}
});
test('CRDO first/later cash, reserve and upfront deposits fail closed without stale EV or zero-price fallback',()=>{
 for(const mutate of [d=>d.bridgeInputs.minimumCashFloor=1000,d=>d.annual[0].reinvestment=5000,d=>d.annual[8].reinvestment=100000,d=>{d.bridgeInputs.operatingCashAfterWorkingCapital=0;d.bridgeInputs.capitalExpenditures=700;d.bridgeInputs.capacityDepositsPaid=0;}]){const d=draft(),old=calculateResearchOperating(d);mutate(d);assert.throws(()=>calculateResearchOperating(d),e=>e.status==='unsupported_funding_gap'&&e.enterprise===null&&e.equity===null&&e.perShare===null&&e.fundingGaps.some(x=>x.shortfall>0));assert.throws(()=>calculateResearchBridge(d,old.enterprise));assert.throws(()=>simulateResearch(d,{...d.researchSimulationConfig,trials:3}));assert.throws(()=>exportResearchCase(d,r.annualCase));}
 const d=draft();d.bridgeInputs.capacityDepositsPaid=103;assert.throws(()=>calculateResearchOperating(d));d.bridgeInputs.capacityDepositsPaid=55;d.bridgeInputs.netRsuSharesIssued=8.3;assert.throws(()=>calculateResearchOperating(d));
});
test('CRDO seeded nonzero simulation rechecks all cash checkpoints and preserves deterministic replay',()=>{
 const d=draft(),config=structuredClone(d.researchSimulationConfig);config.trials=24;config.seed='CRDO-funding';config.jointAnnual.annualPath.innovationSD=.15;
 const sim=simulateResearch(d,config),again=simulateResearch(d,config);assert.deepEqual(sim.enterprise.draws,again.enterprise.draws);assert.ok(new Set(sim.enterprise.draws).size>1);for(const x of sim.scenarios){assert.ok(x.liquidityTests.every(t=>t.cash>=t.minimum));assert.ok(x.annualFunding.length===10);assert.ok(Number.isFinite(x.perShare));let cash=x.estimatedCash-r.sourceInputs.technology_license_debt-r.sourceInputs.cash_contingent_consideration;for(const row of x.annualFunding){cash+=row.fcff;near(cash,row.liquidityAfterReservedClaims);}}
});
test('CRDO bilingual disclosures and explicit private-history nulls',()=>{
 try{setLocale('zh-Hans');for(const p of Object.values(r.prose))assert.equal(annualLabel(p.en),p['zh-Hans']);}finally{setLocale('en');}
 assert.equal(r.history.length,10);assert.equal(r.history.filter(x=>x.revenue!==null).length,7);const html=incrementalEvidenceHTML(r.annualCase,'history');assert.match(html,/FY2017/);assert.ok(!/FY2017<\/th><td>0/.test(html));assert.match(r.prose.claims.en+r.prose.claimLimits.en,/200/);
});
test('CRDO workspace retains scope, edits clear stale value, recovery/Undo/export work',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{w.choose('CRDO');assert.equal(w.getState().draft.ticker,'CRDO');assert.match(w.get('#research-results').textContent,/92\.12/);w.input('#research-notes','CRDO conditional');w.get('[data-incremental-scenario="bear"]').click();near(calculateResearchBridge(w.getState().draft,calculateResearchOperating(w.getState().draft).enterprise).perShare,source.find(x=>x.mode==='current'&&x.scenario==='bear').value_per_common_share);w.action('undo');assert.equal(w.getState().draft.notes,'CRDO conditional');w.action('export');assert.ok(w.downloads.length);assert.equal(w.downloads[0].value.equityBridge.currentCapitalVerified,false);}finally{w.destroy();}
 const again=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{again.choose('CRDO');assert.equal(again.getState().identityError,null);assert.equal(again.getState().draft.notes,'CRDO conditional');}finally{again.destroy();}
});
test('CRDO Monte Carlo mount/reset stay manual',()=>{const d=draft();d.researchSimulationConfig.trials=3;const h=fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:'CRDO',currency:'USD',periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});try{assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);}finally{h.cleanup();}});
test('CRDO rendered funding and blank errors remove the old price and restore only after correction',async()=>{
 const w=await startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalPackages});try{w.choose('CRDO');assert.match(w.get('#research-results').textContent,/92\.12/);const field=w.field('bridge','minimumCashFloor');w.input(field,'1000');assert.match(w.get('#research-results').textContent,/cash shortfall/);assert.doesNotMatch(w.get('#research-results').textContent,/92\.12/);assert.throws(()=>calculateResearchOperating(w.getState().draft));w.input(field,'0');assert.match(w.get('#research-results').textContent,/92\.12/);w.input(w.field('bridge','rsuSettlementPrice'),'');assert.doesNotMatch(w.get('#research-results').textContent,/92\.12/);assert.match(w.get('#research-results').textContent,/finite input/);w.input(w.field('bridge','rsuSettlementPrice'),'200');assert.match(w.get('#research-results').textContent,/92\.12/);assert.equal(w.get('#research-timing-mode'),null);assert.equal(w.get('#annual-growth-horizon'),null);}finally{w.destroy();}
});
test('CRDO unknown top-level financial fields and overflowing option domain withhold operating value',()=>{for(const key of ['additional_debt','newBorrowing','arbitraryFinancing','unrecognized']){const d=draft();d[key]=1000;assert.throws(()=>calculateResearchOperating(d),/Unsupported CRDO draft field/);}const d=draft();d.bridgeInputs.optionVolatility=1e308;assert.throws(()=>calculateResearchOperating(d),/No valuation released/);});
test('CRDO claim arithmetic failure cannot leak operating EV',()=>{const d=draft();d.annual[0].reinvestment=-1e308;assert.throws(()=>calculateResearchOperating(d),/claim allocation failed/);});
test('CRDO same-date result evidence describes conditional October estimates without retrospective-anchor wording',async()=>{
 for(const locale of ['en','zh-Hans']){setLocale(locale);const w=await startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalPackages});try{w.choose('CRDO');w.get('[data-annual-evidence="result"]').click();const text=w.root.textContent;assert.doesNotMatch(text,/Uses later research information; this was not a value knowable on the anchor date|使用较晚取得的研究资讯；这并非起点日期当时可知的价值/);assert.match(text,locale==='en'?/CRDO values the remaining fiscal stub from October 18, 2026\. October balances are estimates/:/CRDO 从 2026 年十月十八日计入剩余财年短期现金流。十月余额为估计值/);assert.equal(w.getState().draft.discountOrigin,'2026-10-18');assert.equal(w.getState().draft.informationAsOf,'2026-10-18');}finally{w.destroy();setLocale('en');}}
 assert.equal(draft().anchor.revenue,1335.116);assert.equal(draft().annual[0].revenue,2500);assert.equal(((draft().annual[0].revenue/draft().anchor.revenue-1)*100).toFixed(2),'87.25');
});
