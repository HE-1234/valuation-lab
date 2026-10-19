import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pendingCompanyHTML,companyOptionsHTML} from '../dist/company-catalog-view.js';
import {setLocale} from '../dist/i18n.js';
import {incrementalPackages,incrementalRecord} from '../dist/incremental-registry.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {researchStorageKey} from '../dist/incremental-research-identity.js';
import {isSVCOResearchOnly} from '../dist/svco-research-only.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const catalog=read('dist/data/atlas-company-catalog-v1.json'),row=catalog.companies.find(r=>r.ticker==='SVCO'),record=read('dist/data/svco-research-only-v2.json');
test('SVCO audited research is never registered as a ready case or a numeric valuation',()=>{
 assert.ok(row);assert.ok(isSVCOResearchOnly(row));assert.equal(row.readiness,'research-pending');assert.ok(!incrementalRecord('SVCO'));
 assert.equal(record.research_only,true);assert.equal(record.research_complete,true);assert.equal(record.valuation_ready,false);
 for(const field of ['current_price','operating_ev','current_value_per_share','conditional_common_value','common_equity_bridge','upside','ranking','simulation'])assert.equal(record[field],null,field);
 assert.equal(record.historicalObservations.length,5);assert.equal(record.observedOperatingYears,5);assert.equal(record.completedGuidanceComparisons,5);assert.equal(record.pendingGuidanceComparisons,1);
 assert.equal(record.historicalObservations[0].cfo,null);assert.equal(record.audit.datedEventsPerCase,126);assert.equal(record.audit.authorTestsRerun,18);
 for(const url of Object.values(record.sources))assert.match(url,/^https:\/\/(www\.sec\.gov|investors\.silvaco\.com)\//);
});
test('SVCO report and selector are bilingual; counts, timing, conditionality and promotion gates are visible',()=>{
 for(const locale of ['en','zh-Hans']){
  setLocale(locale);const html=pendingCompanyHTML(row),option=companyOptionsHTML([row],row.id);
  assert.match(option,locale==='en'?/Research complete · valuation blocked/:/研究已完成 · 估值未开放/);
  assert.match(html,/data-valuation-ready="false"/);assert.equal((html.match(/data-guidance-status="completed"/g)||[]).length,5);assert.equal((html.match(/data-guidance-status="pending"/g)||[]).length,1);
  for(const number of ['126','732','13.000','0.754','3.600','8.646','3.323'])assert.ok(html.includes(number),number);
  assert.match(html,locale==='en'?/What must change before valuation/:/开放估值前必须解决/);
  assert.match(html,locale==='en'?/August 5, 2026 Nasdaq close/:/2026 年 8 月 5 日纳斯达克收盘价/);
  assert.doesNotMatch(html,/research-big-value|research-results|research-simulation-root|data-research-input|<svg|data-sim-/);
  assert.doesNotMatch(html,/Research required before valuation|估值前尚需完成的研究/);
  if(locale==='zh-Hans')assert.doesNotMatch(html,/Research complete|Funding access|Five observed|Five completed|What must change/);
 }
 setLocale('en');
});
test('all 30 ready cases remain; repeated SVCO selection, locale changes and stale callbacks never change saved valuations',async()=>{
 const callbacks=[];let released=0;
 const h=await startResearchWorkspace({catalogBundle:catalog,incrementalBundle:incrementalPackages,simulationMount:(_el,options)=>{callbacks.push(options.onConfigChange);return ()=>released++;}});
 const proto=Object.getPrototypeOf(h.root),query=proto.querySelectorAll;
 proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part.trim())))];};proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};
 const ready=h.root.querySelectorAll('[data-research-company]');assert.equal(ready.length,30);
 h.choose('KEYS');
 h.input(h.field('annual','margin',0),'12.345678901');
 const draft=structuredClone(h.getState().draft),storageKey=researchStorageKey(h.getState().company),saved=h.storage.get(storageKey),savedAll=[...h.storage],writes=h.writes.length,stale=callbacks.at(-1);assert.equal(typeof saved,'string');assert.equal(JSON.parse(saved).ticker,'KEYS');
 h.choose(row.id);h.choose(row.id);assert.ok(released>0);assert.equal(h.getState().draft,null);assert.equal(h.getState().company,null);assert.equal(h.getState().readiness,'research-pending');
 for(const locale of ['zh-Hans','en']){setLocale(locale);assert.match(h.root.textContent,locale==='en'?/Research complete · valuation blocked/:/研究已完成 · 估值未开放/);assert.match(h.root.textContent,locale==='en'?/What must change before valuation/:/开放估值前必须解决/);assert.equal(h.get('#research-results'),null);assert.equal(h.get('#research-simulation-root'),null);assert.equal(h.get('#research-editor'),null);assert.equal(h.storage.get(storageKey),saved);}
 stale({invalid:'late callback'});assert.deepEqual([...h.storage],savedAll);assert.equal(h.writes.length,writes);assert.equal(h.storage.get(storageKey),saved);
 h.choose('KEYS');assert.deepEqual(h.getState().draft,draft);assert.equal(h.storage.get(storageKey),saved);assert.equal(h.root.querySelectorAll('[data-research-company]').length,30);h.destroy();
});
