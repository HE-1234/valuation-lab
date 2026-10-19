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
const r=incrementalRecord('SNDK');
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const draft=()=>incrementalResearchDraft({ticker:'SNDK',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-10),`${a} != ${b}`);
test('SNDK source replay, named scenarios, funding and fixed simulation',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../dist/data/incremental-SNDK-2026-10-19-v3/v3/model-output.json',import.meta.url)));
 for(const c of [{name:null,annualCase:r.annualCase},...r.alternatives]){
 const d=c.name?incrementalAlternative(draft(),c.name).draft:draft(),o=calculateResearchOperating(d),b=calculateResearchBridge(d,o.enterprise),s=source.find(x=>x.scenario===c.annualCase.sourceScenario);
 assert.deepEqual(researchDraftIssues(d),[]);near(o.enterprise,s.operating_value);near(b.rawPerShare,s.conditional_value_per_proxy_share);near(b.equity,s.conditional_common_equity);near(o.openingSurplus,590);
 assert.equal(b.priceComparisonEligible,false);assert.equal(b.asKnownBacktestEligible,false);assert.equal(b.shareCountIsProxy,true);
 const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(sim.accepted,3);for(const x of sim.perShare.draws)near(x,b.perShare);
 }
});
test('SNDK opening claims affect cash and equity exactly once with boundary withholding',()=>{
 const d=draft(),o=calculateResearchOperating(d),b=calculateResearchBridge(d,o.enterprise);d.bridgeInputs.additionalClaimReserve=590;let op=calculateResearchOperating(d),eq=calculateResearchBridge(d,op.enterprise);near(op.openingSurplus,0);near(eq.equity,b.equity-590);
 d.bridgeInputs.additionalClaimReserve=590.001;assert.throws(()=>calculateResearchOperating(d),e=>e.status==='unsupported_funding_gap'&&e.enterprise===null&&e.equity===null&&e.perShare===null);assert.throws(()=>calculateResearchBridge(d,o.enterprise));assert.throws(()=>exportResearchCase(d,r.annualCase));
});
test('SNDK every exposed input validates finite type and bounds; unknown financing fails',()=>{
 for(const f of r.bridge.options)for(const bad of [null,NaN,Infinity,-Infinity,'0',true,f.min-1,f.max+1]){const d=draft();d.bridgeInputs[f.key]=bad;assert.throws(()=>calculateResearchOperating(d),undefined,f.key+String(bad));}
 for(const k of ['debt','borrowings','currentQuote','newFinancing']){const d=draft();d[k]=1;assert.throws(()=>calculateResearchOperating(d));}
 const d=draft();d.timing.mode='as-of-scenario';assert.throws(()=>calculateResearchOperating(d));d.timing.mode='origin';d.terminal.margin=.01;assert.throws(()=>calculateResearchOperating(d),/terminal funding floor/);
});
test('SNDK edits and seeded trials propagate physical funding floor and pool',()=>{
 const d=draft();d.annual[0].reinvestment=0;const o=calculateResearchOperating(d);assert.ok(o.rows[0].investmentFloorTopUp>0);near(o.rows[0].reinvestment,o.rows[0].fundingFloor);
 const config=structuredClone(d.researchSimulationConfig);config.trials=30;config.seed='SNDK-floor';config.jointAnnual.annualPath.innovationSD=.1;
 const sim=simulateResearch(d,config);assert.deepEqual(sim.enterprise.draws,simulateResearch(d,config).enterprise.draws);assert.ok(new Set(sim.enterprise.draws).size>1);
 for(const x of sim.scenarios){assert.equal(x.annualFunding.length,10);let cash=x.openingSurplus;for(const row of x.annualFunding){cash+=row.fcff;near(cash,row.fundingCashPool);assert.ok(row.reinvestment+1e-8>=row.fundingFloor);}assert.ok(x.liquidityTests.every(t=>t.cash>=-1e-8));}
});
test('SNDK bilingual scope and ten distinct history slots',()=>{
 assert.equal(r.history.length,10);for(const h of r.history)assert.ok(h.basisLabel);
 try{setLocale('zh-Hans');for(const p of Object.values(r.prose))assert.equal(annualLabel(p.en),p['zh-Hans']);for(const h of r.history)assert.equal(annualLabel(h.basisLabel),h.basisLabelZh);}finally{setLocale('en');}
 const html=incrementalEvidenceHTML(r.annualCase,'history');assert.match(html,/FY2017|2017/);assert.match(html,/predecessor|Predecessor|WDC|Western Digital/);
});
test('SNDK manual simulation and reset do not autorun',()=>{const d=draft();d.researchSimulationConfig.trials=3;const h=fixture({runOnMount:false,reduced:true,autoplay:false,draftOverride:d,snapshotOverride:{ticker:'SNDK',currency:'USD',periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter:annualResearchSimulationAdapter(d)});try{assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-chart'),null);h.runTimers();assert.equal(h.get('#mc-chart'),null);}finally{h.cleanup();}});
test('SNDK workspace stale-value clearing, restore, Undo and export',async()=>{
 const storage=new Map(),w=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{w.choose('SNDK');assert.equal(w.getState().draft.ticker,'SNDK');assert.match(w.get('#research-results').textContent,/358\.44/);w.input('#research-notes','SNDK conditional');w.input(w.field('bridge','additionalClaimReserve'),'1000');assert.match(w.get('#research-results').textContent,/unmodeled funding/);assert.doesNotMatch(w.get('#research-results').textContent,/358\.44/);w.input(w.field('bridge','additionalClaimReserve'),'0');assert.match(w.get('#research-results').textContent,/358\.44/);w.input(w.field('bridge','securitiesHaircut'),'');assert.doesNotMatch(w.get('#research-results').textContent,/358\.44/);w.input(w.field('bridge','securitiesHaircut'),'25');assert.match(w.get('#research-results').textContent,/358\.44/);assert.equal(w.get('#research-timing-mode'),null);assert.equal(w.get('#annual-growth-horizon'),null);w.get(`[data-incremental-scenario="${r.alternatives[0].name}"]`).click();w.action('undo');assert.equal(w.getState().draft.notes,'SNDK conditional');w.action('export');assert.equal(w.downloads[0].value.equityBridge.priceComparisonEligible,false);}finally{w.destroy();}
 const again=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages});try{again.choose('SNDK');assert.equal(again.getState().identityError,null);assert.equal(again.getState().draft.notes,'SNDK conditional');}finally{again.destroy();}
});
test('SNDK named floor sensitivity recomputes EV and never allocates stale baseline',async()=>{
 const {incrementalBridgeSensitivity}=await import('../dist/incremental-research-claims.js');const d=draft(),o=calculateResearchOperating(d),rows=incrementalBridgeSensitivity(d,o.enterprise),low=rows.find(x=>x.parameterLabel==='Terminal net physical/JV funding floor'&&x.parameterValue===0);assert.equal(low.status,'conditional');const changed=structuredClone(d);changed.bridgeInputs.terminalFundingFloor=0;const op=calculateResearchOperating(changed),b=calculateResearchBridge(changed,op.enterprise);near(low.enterprise,op.enterprise);near(low.rawPerShare,b.rawPerShare);assert.throws(()=>calculateResearchBridge(changed,o.enterprise),/must match/);const high=rows.find(x=>x.parameterLabel==='Terminal net physical/JV funding floor'&&x.parameterValue===1);assert.equal(high.status,'invalid');
 const sim=simulateResearch(d,{...d.researchSimulationConfig,trials:3});assert.equal(sim.quote.status,'blocked');assert.ok(sim.warnings.some(x=>x.includes('physical/JV')));assert.ok(sim.scenarios.every(x=>x.terminalFundingFloor>0));
});
