import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
import {incrementalPackages,incrementalRecords,incrementalRecord} from '../dist/incremental-registry.js';
import {guidedCompanyGroups,REVIEW_STEPS} from '../dist/guided-reviewed.js';
import {calculateResearchOperating} from '../dist/research-model.js';
import {calculateResearchBridge} from '../dist/research-claims.js';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {setLocale} from '../dist/i18n.js';
const catalogBundle=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const start=options=>startResearchWorkspace({catalogBundle,incrementalBundle:incrementalPackages,...options});
const withoutStamp=d=>{const copy=structuredClone(d);delete copy.updatedAt;return copy;};

test('directory includes every validated company, keeps pending separate, and is not a hard-coded ticker whitelist',async()=>{
 const h=await start(),directory=h.getDirectory();
 const groups=guidedCompanyGroups(directory,bundledResearch().companies.map(c=>c.ticker));
 assert.equal(groups.original.length,14);assert.equal(groups.reviewed.length,22);assert.equal(groups.pending.length,26);
 assert.deepEqual(groups.reviewed.map(c=>c.ticker).sort(),incrementalRecords.map(r=>r.identity.ticker).sort());
 const expanded=guidedCompanyGroups([...directory,{ticker:'FUTURE',readiness:'ready'}],groups.original.map(c=>c.ticker));
 assert.ok(expanded.reviewed.some(c=>c.ticker==='FUTURE'));
 directory.length=0;assert.equal(h.getDirectory().length,62,'directory is a defensive copy');
 h.destroy();
});
test('all reviewed models retain their actual annual inputs, history, operating values and draft identity through presentation changes',async()=>{
 const h=await start();
 for(const r of incrementalRecords){
  h.choose(r.identity.ticker);
  const initial=withoutStamp(h.getState().draft),ev=calculateResearchOperating(h.getState().draft).enterprise,writes=h.writes.length;
  let notifications=0;h.setPresentation(()=>notifications++);
  for(const step of REVIEW_STEPS){h.selectEditor(step.panels[0]);h.selectView('result');h.selectMobile('inputs');}
  assert.ok(notifications>0);assert.deepEqual(withoutStamp(h.getState().draft),initial,r.identity.ticker);
  assert.equal(h.writes.length,writes,'presentation must not save a new financial draft');
  assert.equal(calculateResearchOperating(h.getState().draft).enterprise,ev);
  assert.match(h.root.textContent,new RegExp(r.identity.ticker));
  h.setPresentation(null);
 }
 h.destroy();
});
test('pending entries never inherit a previous operating result or editable forecast',async()=>{
 const h=await start();h.choose('NFLX');let called=0;h.setPresentation(()=>called++);h.choose('INTC');
 assert.equal(h.getState().readiness,'research-pending');assert.equal(h.getState().draft,null);
 assert.equal(h.get('#research-results'),null);assert.equal(h.get('[data-year-field]'),null);assert.ok(called>=2);
 h.choose('UBER');assert.equal(h.getState().company.ticker,'UBER');assert.ok(h.get('#research-results'));
 h.destroy();
});
test('editing through the shared controller persists exactly across company switches and Undo',async()=>{
 const h=await start();h.choose('NFLX');
 const before=withoutStamp(h.getState().draft),old=before.annual[0].margin;
 h.setPresentation(()=>{});h.input('#annual-year-margin',(old+.001)*100);
 const edited=withoutStamp(h.getState().draft);
 assert.equal(edited.annual[0].margin,old+.001);assert.notEqual(calculateResearchOperating(edited).enterprise,calculateResearchOperating(before).enterprise);
 h.choose('UBER');h.choose('NFLX');assert.deepEqual(withoutStamp(h.getState().draft),edited);
 h.action('undo-edit');assert.deepEqual(withoutStamp(h.getState().draft),before);
 h.destroy();
});
test('all three dated illustration policies are explicit, undoable, and never enable current targets',async()=>{
 for(const ticker of ['MCD','UBER','NFLX']){
  const h=await start();h.choose(ticker);const initial=h.getState().draft;
  const bridge=d=>calculateResearchBridge(d,calculateResearchOperating(d).enterprise);
  assert.equal(bridge(initial).perShare,null);
  h.get(ticker==='MCD'?'[data-mcd-example="0"]':`[data-${ticker.toLowerCase()}-example]`).click();
  const b=bridge(h.getState().draft);assert.equal(b.status,'conditional');assert.ok(b.perShare>0);
  assert.equal(b.referenceDate,'2026-06-30');assert.equal(b.current_target,null);assert.equal(b.priceComparisonEligible,false);
  h.action('undo-edit');assert.equal(bridge(h.getState().draft).perShare,null);
  h.destroy();
 }
});
test('invalid saved JSON is retained, while presentation changes and locale changes do not repair or replace it',async()=>{
 const r=incrementalRecord('NFLX'),key=researchStorageKey(r.annualCase),raw='{"unfinished":';
 const storage=new Map([[key,raw]]),h=await start({storage});h.choose('NFLX');const error=h.getState().identityError;
 assert.ok(error);h.setPresentation(()=>{});h.selectEditor('claims');setLocale('zh-Hans');setLocale('en');
 assert.equal(storage.get(key),raw);assert.equal(h.getState().identityError,error);h.destroy();
});
