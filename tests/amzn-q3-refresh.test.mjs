import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {guidedBasesFor} from '../dist/guided-bases.js';
import {currentSnapshot,draftFor,calculateCurrent,safeDraft,researchCaseFor} from '../dist/current-model.js';
import {simulateCurrent} from '../dist/simulation.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json');
const c=u.companies.find(x=>x.ticker==='AMZN'),r=c.snapshots.find(x=>x.id===c.currentSnapshotId);
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const fixture=()=>{const s=currentSnapshot(c,r),d=draftFor(c,r,{baseCases:cases});d.cutoff='2026-10-29';return {s,d};};

test('Amazon financial-period choices and current selection use the September TTM',()=>{
 assert.equal(c.currentSnapshotId,'AMZN-TTM-2026-09-30');
 assert.deepEqual(guidedBasesFor(c).map(x=>x.id),['AMZN-CURRENT-2025-12-31','AMZN-TTM-2026-09-30']);
 assert.equal(r.periodStart,'2025-10-01');assert.equal(r.periodEnd,'2026-09-30');
 assert.match(r.fiscalLabel,/Provisional TTM through 2026-09-30/);
 assert.equal(r.provisionalEarningsRelease,true);assert.match(r.sourceForm,/8-K.*not yet available/);
 assert.equal(r.filedAt,'2026-10-29');assert.equal(r.backtestEligible,false);
});
test('Amazon September TTM flows independently reconcile a full year plus comparable nine-month periods',()=>{
 const {s}=fixture();near(s.revenue,716924+584069-503538);near(s.ebit,79975+79389-54998);
 near(r.facts.netIncome,77670+113587-56478);near(r.facts.operatingCashFlow,139514+113841-85055);
 near(r.facts.capitalExpenditure,131819+175670-92297);near(r.facts.incomeTaxExpense,19087+33939-14141);
 near(r.facts.pretaxIncome,97311+147560-70706);assert.equal(r.facts.dilutedShares,null);
});
test('Amazon September cash and ownership use the release while absent debt facts remain unknown',()=>{
 const {s,d}=fixture();near(s.cash,55783+58443);near(s.shares,10811+223);
 assert.equal(r.sharesDate,'2026-09-30');assert.notEqual(s.shares,10929);
 for(const k of ['debt','longTermDebtCurrent','shortTermBorrowings','financeLeaseLiabilityTotal','financingObligations','otherLongTermInvestments'])assert.equal(r.facts[k],null,k);
 near(s.debt,173125+3330+325+13451+9315);
 assert.equal(r.guidedDebtProxy.reportedDebt,null);
 assert.ok(r.guidedDebtProxy.proxyComponents.every(x=>x.sourceDate==='2026-06-30'));
 near(d.assumptions.otherAssets,224895);assert.equal(r.guidedModelProxies.otherAssets.sourceDate,'2026-06-30');
 assert.match(c.guidedEarningsUpdate.priorBase,/assumptions, not reported September liabilities/);
});
test('Amazon preserved June and annual cases retain their own inputs and saved edits',()=>{
 const june=c.snapshots.find(x=>x.id==='AMZN-TTM-2026-06-30');
 near(june.revenue,775680);near(june.EBIT,93712);near(june.cash,122988);near(june.debt,155315);
 const d=draftFor(c,june,{baseCases:cases});d.assumptions.growth=.081;d.notes.story='My June case';
 const restored=safeDraft(d,c,june,{baseCases:cases});near(restored.assumptions.growth,.081);assert.equal(restored.notes.story,d.notes.story);
 const annual=c.snapshots.find(x=>x.id==='AMZN-CURRENT-2025-12-31');
 near(researchCaseFor(cases,c,annual).assumptions.otherAssets,65359);
 assert.equal(researchCaseFor(cases,c,r).snapshotId,r.id);
});
test('Amazon deterministic simulation uses the September base and applies the asset proxy once',()=>{
 const {s,d}=fixture(),v=calculateCurrent(s,d),simulation=simulateCurrent(s,d,{trials:5,seed:'amzn-q3-refresh'});
 assert.equal(simulation.accepted,5);for(const draw of simulation.draws)near(draw,v.perShare);
 const zeroAsset=calculateCurrent(s,{...d,assumptions:{...d.assumptions,otherAssets:0}});
 near(v.perShare-zeroAsset.perShare,224895/11034);
});
