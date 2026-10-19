import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {incrementalRecord,incrementalPackages} from '../dist/incremental-registry.js';
import {researchDraftFor,calculateResearchOperating} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {umcPolicyEditorHTML,bindUmcPolicy,umcAllocationHTML,umcFundingHTML,umcHistoryHTML} from '../dist/umc-research-view.js';
import {UMC_MESSAGES} from '../dist/umc-messages.js';
import {minimalDocument,startResearchWorkspace} from './research-workspace-harness.mjs';
import {setLocale} from '../dist/i18n.js';
import {annualLabel} from '../dist/annual-localization.js';
const record=incrementalRecord('UMC'),draft=()=>researchDraftFor(record.annualCase);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
const catalogBundle=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
function editor(d){const root=minimalDocument().root;let saves=0,updates=0;const render=()=>{root.innerHTML=umcPolicyEditorHTML(d);bindUmcPolicy(root,d,{save:()=>saves++,updateResults:()=>updates++,rerender:render});};render();return {root,render,get saves(){return saves},get updates(){return updates},input(selector,value){const input=root.querySelector(selector);assert.ok(input,selector);input.value=value;input.oninput();}};}
const capex=d=>calculateResearchOperating(d).rows.map(row=>row.all_in_cash_capex);
test('UMC policy controls require opt-in, preserve capex for all switches and never edit fixed exclusions',()=>{
 const d=draft(),h=editor(d),original=capex(d);
 assert.equal(d.umcPolicy,null);assert.equal(h.root.querySelectorAll('[data-umc-example]').length,3);assert.equal(h.root.querySelector('input[type="checkbox"]'),null);
 for(const key of ['nonoperating_equity_value_assigned','circular_crossholding_share_reduction'])assert.equal(h.root.querySelector(`[data-umc-policy="${key}"]`),null);
 for(const index of [1,2,0,1,2]){h.root.querySelector(`[data-umc-example="${index}"]`).click();assert.deepEqual(d.umcPolicy,record.policyExamples[index]);capex(d).forEach((value,i)=>near(value,original[i]));}
 h.root.querySelector('[data-umc-clear]').click();assert.equal(d.umcPolicy,null);capex(d).forEach((value,i)=>near(value,original[i]));
});
test('UMC policy precision, blank recovery and D&A edits keep residual cash capex unchanged',()=>{
 const d=draft(),h=editor(d);h.root.querySelector('[data-umc-example="2"]').click();const original=capex(d),rein=d.annual[0].reinvestment,da=d.umcDaNonlease[0];
 const supplemental='[data-umc-policy="supplemental_operating_cash_by_year"][data-umc-index="0"]';
 h.input(supplemental,'123.456789012345');assert.equal(d.umcPolicy.supplemental_operating_cash_by_year[0],123.456789012345);near(d.annual[0].reinvestment,rein+123.456789012345);assert.equal(h.root.querySelector('#umc-policy-edited').hidden,false);
 h.input(supplemental,'');assert.equal(d.umcPolicy.supplemental_operating_cash_by_year[0],null);assert.throws(()=>calculateResearchOperating(d));
 h.input(supplemental,'124.456789012345');near(capex(d)[0],original[0]);
 h.input('[data-umc-da="0"]',String(da+1));near(d.annual[0].reinvestment,rein+123.456789012345);near(capex(d)[0],original[0]);
 h.input('[data-umc-da="0"]','');assert.equal(d.umcDaNonlease[0],null);assert.throws(()=>calculateResearchOperating(d));h.input('[data-umc-da="0"]',String(da+2));near(capex(d)[0],original[0]);
 h.input('[data-umc-policy="time_deposit_funding_release_year"]','1.5');assert.equal(d.umcPolicy.time_deposit_funding_release_year,1.5);assert.throws(()=>calculateResearchOperating(d));h.input('[data-umc-policy="time_deposit_funding_release_year"]','1');
 h.root.querySelector('[data-umc-clear]').click();near(capex(d)[0],original[0]);
});
test('UMC malformed policy and D&A renders are nonmutating and fail closed',()=>{
 for(const policy of [undefined,{},[],true,'bad',{...record.policyExamples[0],lease_cash_by_year:'bad'},{...record.policyExamples[0],required_operating_cash:null}]){const d=draft();d.umcPolicy=policy;const before=structuredClone(d);assert.doesNotThrow(()=>editor(d));assert.deepEqual(d,before);assert.throws(()=>calculateResearchOperating(d));}
 for(const da of [undefined,{},[],true,'bad',[1,null]]){const d=draft();d.umcDaNonlease=da;const before=structuredClone(d);assert.doesNotThrow(()=>editor(d));assert.deepEqual(d,before);assert.throws(()=>calculateResearchOperating(d));}
});
test('UMC source allocation and history rendering never expose unfunded mathematical values',()=>{
 for(const p of record.policyExamples){const d=draft();d.umcPolicy=structuredClone(p);d.annual.forEach((row,i)=>row.reinvestment+=p.supplemental_operating_cash_by_year[i]);const operating=calculateResearchOperating(d),bridge=calculateResearchBridge(d,operating.enterprise,{calculationDate:d.discountOrigin}),html=umcAllocationHTML(bridge);assert.doesNotMatch(html,/unfunded_mathematical/);if(p.bank_principal_timing==='all_upfront')assert.doesNotMatch(html,/Conditional USD per ADS/);else assert.match(html,/Conditional USD per ADS/);assert.match(umcFundingHTML(operating),/Ten annual cash buckets/);}
 for(const allocation of [null,{},false,{status:'bad',funding:null,rows:null},{status:'DATED_CONDITIONAL_ANNUAL_FUNDING_PASS',current_target:null,conditional_usd_per_ads:99,conditional_twd_per_ordinary:630}]){assert.doesNotThrow(()=>umcAllocationHTML({ticker:'UMC',umcAllocation:allocation}));assert.doesNotThrow(()=>umcFundingHTML({umcAllocation:allocation}));}
 for(const key of ['growth','profitability','capital']){const html=umcHistoryHTML({ticker:'UMC'},key);assert.equal((html.match(/<th scope="row">/g)||[]).length,10);assert.match(html,/IFRS 16/);assert.match(html,/history-field-provenance-v1.csv/);}
});
for(const locale of ['en','zh-Hans'])test(`UMC wired policy editor and complete ${locale} messages`,async()=>{
 setLocale(locale);const h=await startResearchWorkspace({catalogBundle,incrementalBundle:incrementalPackages});try{h.choose('UMC');assert.equal(h.getState().draft.umcPolicy,null);h.get('[data-annual-editor="claims"]').click();h.get('[data-umc-example="2"]').click();assert.equal(h.getState().draft.umcPolicy.policy_id,'explicit_staged_bank_principal');h.input('[data-umc-policy="required_operating_cash"]','15000.123456789');assert.equal(h.getState().draft.umcPolicy.required_operating_cash,15000.123456789);assert.equal(h.get('#umc-policy-edited').hidden,false);h.input('[data-umc-policy="required_operating_cash"]','15000');assert.equal(h.get('#umc-policy-edited').hidden,true);h.input('[data-umc-policy="required_operating_cash"]','');assert.equal(h.getState().draft.umcPolicy.required_operating_cash,null);h.input('[data-umc-policy="required_operating_cash"]','15000');for(const pair of Object.values(UMC_MESSAGES))assert.equal(annualLabel(pair[0]),pair[locale==='en'?0:1]);}finally{h.destroy();setLocale('en');}
});
