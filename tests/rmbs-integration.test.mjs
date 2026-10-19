import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {researchDraftFor,calculateResearchOperating,researchDraftIssues,restoreResearchDraft,exportResearchCase,terminalNormalizedDraft} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {evaluateRmbs} from '../dist/rmbs-financial-engine.js';
import {incrementalAlternative} from '../dist/incremental-research.js';
import {simulateResearch,simulationResearchDefaults} from '../dist/research-simulation.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {setLocale} from '../dist/i18n.js';
import {annualLabel} from '../dist/annual-localization.js';
import {RMBS_MESSAGES} from '../dist/rmbs-messages.js';
const r=incrementalRecord('RMBS'),draft=()=>researchDraftFor(r.annualCase),catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-10),label+': '+a+' / '+b);
const bridge=d=>{const o=calculateResearchOperating(d);return calculateResearchBridge(d,o.enterprise,{calculationDate:d.discountOrigin});};
test('RMBS replays all nine frozen conditional values and 90 source/funding rows',()=>{
 for(const example of r.awardExamples)for(const [name,s] of Object.entries(r.sourceInputs.scenarios)){
  const actual=evaluateRmbs(r.sourceInputs,s,example.selection),expected=r.sourceOutputs.examples[example.policy_id][name];
  assert.equal(actual.status,expected.status);assert.equal(actual.current_price_target,null);
  for(const [k,v]of Object.entries(expected))if(typeof v==='number')near(actual[k],v,k);
  for(let i=0;i<10;i++)for(const[k,v]of Object.entries(expected.rows[i]))if(typeof v==='number')near(actual.rows[i][k],v,name+' '+i+' '+k);
  near(actual.initial_liquidity_after_reserves,708.465,'nominal EDA reserve');
 }
});
test('RMBS source, fresh draft, export, restore and named scenarios never auto-select awards or current targets',()=>{
 const d=draft();assert.equal(d.rmbsAwardPolicy,null);assert.deepEqual(researchDraftIssues(d),[]);assert.equal(bridge(d).rawPerShare,null);assert.equal(exportResearchCase(d,r.annualCase).draft.rmbsAwardPolicy,null);assert.equal(restoreResearchDraft(d,r.annualCase).draft.rmbsAwardPolicy,null);
 for(const name of ['bear','bull'])assert.equal(incrementalAlternative(d,name).draft.rmbsAwardPolicy,null);
 assert.equal(r.sourceInputs.selected_award_policy,null);for(const x of Object.values(r.sourceOutputs.active_outputs)){assert.equal(x.conditional_share_value,null);assert.equal(x.current_price_target,null);}
 assert.throws(()=>terminalNormalizedDraft(d),/no automatic repair/);
});
test('RMBS policy selection, edits, allocation identity and dated source validation',()=>{
 const d=draft();d.rmbsAwardPolicy=structuredClone(r.awardExamples[0].selection);let b=bridge(d);near(b.rawPerShare,43.394735894886296,'conditional');const v=b.rmbsAllocation;near(v.ordinary_equity_allocation+v.legacy_net_equity_allocation+v.legacy_cash_settlement_pv,v.equity_pool_before_legacy_claims,'allocation');assert.equal(b.currentPriceTarget,null);
 d.rmbsAwardPolicy.residual_legacy_share_equivalents_m=.123456789012345;assert.equal(restoreResearchDraft(d,r.annualCase).draft.rmbsAwardPolicy.residual_legacy_share_equivalents_m,.123456789012345);
 for(const mutate of [x=>x.rmbsAwardPolicy.withholding_fraction=null,x=>x.rmbsAwardPolicy.vesting_weights[9]=.1,x=>x.rmbsAwardPolicy.unknown=1,x=>x.annual[0].reinvestment=0,x=>x.discountOrigin='2026-10-19',x=>x.annual.pop(),x=>x.rmbsAwardPolicy.legacy_expense_runout_m[0]=1000]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>calculateResearchOperating(bad));}
 const other=incrementalAlternative(d,'bear').draft;assert.deepEqual(other.rmbsAwardPolicy,d.rmbsAwardPolicy);assert.equal(bridge(other).current_price_target,null);
});
test('RMBS manual seeded simulation is EV-only even with explicit policy; draft is untouched',()=>{
 for(const selected of [false,true]){const d=draft();if(selected)d.rmbsAwardPolicy=structuredClone(r.awardExamples[1].selection);const before=structuredClone(d),c={...simulationResearchDefaults(d),trials:7,seed:'rmbs-port'};const a=simulateResearch(d,c),b=simulateResearch(d,c);assert.equal(a.accepted,7);assert.deepEqual(a.enterprise,b.enterprise);assert.equal(a.bridgeCoverage.eligible,0);assert.equal(a.perShare.accepted,0);assert.match(a.method.output,/operating-EV simulation only/);assert.deepEqual(d,before);}
});
for(const locale of ['en','zh-Hans'])test(`RMBS UI ${locale}: explicit plain buttons, exact edits, invalid recovery, undo, restore, mounting only`,async()=>{
 setLocale(locale);let mounts=0;const storage=new Map(),h=await startResearchWorkspace({storage,catalogBundle:catalog,incrementalBundle:incrementalPackages,simulationMount(){mounts++;return ()=>{};}});
 try{h.choose('RMBS');assert.equal(h.getState().draft.rmbsAwardPolicy,null);const editor=h.root.querySelector('[data-annual-editor="claims"]');assert.ok(editor);editor.click();assert.ok(h.get('[data-rmbs-example="0"]'));assert.equal(h.get('#rmbs-policy-tool').querySelector('input[type="checkbox"]'),null);h.get('[data-rmbs-example="0"]').click();assert.equal(h.getState().draft.rmbsAwardPolicy.residual_legacy_share_equivalents_m,0);const before=structuredClone(h.getState().draft),selector='[data-rmbs-policy="residual_legacy_share_equivalents_m"]';h.input(selector,'.123456789012345');assert.equal(h.getState().draft.rmbsAwardPolicy.residual_legacy_share_equivalents_m,.123456789012345);h.input(selector,'');assert.equal(h.getState().draft.rmbsAwardPolicy.residual_legacy_share_equivalents_m,null);assert.match(h.get('#research-results').textContent,new RegExp(locale==='en'?'withheld|finite|attention':'暂停|有限|需要'));
 h.input(selector,'0');near(bridge(h.getState().draft).rawPerShare,43.394735894886296,'recovery');h.action('export');assert.equal(h.downloads.at(-1).value.draft.rmbsAwardPolicy.residual_legacy_share_equivalents_m,0);h.get('[data-rmbs-clear]').click();assert.equal(h.getState().draft.rmbsAwardPolicy,null);assert.ok(mounts>0);h.action('load');assert.equal(h.getState().draft.rmbsAwardPolicy,null);h.action('undo');assert.equal(h.getState().draft.rmbsAwardPolicy,null);
 for(const pair of Object.values(RMBS_MESSAGES))assert.equal(annualLabel(pair[0]),pair[locale==='en'?0:1]);
 }finally{h.destroy();setLocale('en');}
});
test('RMBS simulation controls never execute on mount or edits; manual run exposes EV only',async()=>{
 const {fixture}=await import('./v7-simulation-harness.mjs');const {annualResearchSimulationAdapter}=await import('../dist/research-simulation-view.js');
 for(const selected of [false,true]){const d=draft();if(selected)d.rmbsAwardPolicy=structuredClone(r.awardExamples[0].selection);d.researchSimulationConfig={...simulationResearchDefaults(d),trials:5};const adapter=annualResearchSimulationAdapter(d);let calls=0;const simulate=adapter.simulate;adapter.simulate=(...args)=>{calls++;return simulate(...args);};
 const h=fixture({ticker:'RMBS',draftOverride:d,snapshotOverride:{ticker:'RMBS',currency:'USD',periodEnd:d.discountOrigin,raw:{id:d.caseId}},adapter,runOnMount:false,autoplay:false});try{assert.equal(calls,0);h.get('#mc-seed').value='edited';h.get('#mc-seed').oninput();assert.equal(calls,0);h.get('#mc-run').click();assert.equal(calls,1);assert.ok(h.get('#mc-chart'));assert.equal(h.get('#mc-error').textContent,'');}finally{h.cleanup();}}
});
