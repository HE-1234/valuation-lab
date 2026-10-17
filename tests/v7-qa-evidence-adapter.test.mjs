import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assumptionEvidence,assumptionHistoryKeys,historyRange,formatEvidenceValue} from '../dist/assumption-history.js';
import {currentSnapshot,draftFor} from '../dist/current-model.js';
const json=name=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+name,import.meta.url)));
const data=json('company-history.json'),universe=json('current-universe.json'),market=json('current-market-references.json');
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);

test('v7 QA: every company and assumption gets descriptive evidence without modifying data or forecast defaults',()=>{
 const before=JSON.stringify({data,universe,market});
 for(const company of universe.companies){const raw=company.snapshots.find(s=>s.id===company.currentSnapshotId),snapshot=currentSnapshot(company,raw),draft=draftFor(company,raw),saved=JSON.stringify(draft);
  for(const key of assumptionHistoryKeys){const e=assumptionEvidence(data,company.ticker,key,{snapshot,marketReferences:market,cutoff:data.asOf});assert.equal(e.ticker,company.ticker);assert.equal(e.key,key);assert.equal(e.backtestEligible,false);assert.ok(e.title&&e.summary&&e.cautions.length,company.ticker+' '+key);assert.ok(['available','partial','proxy','contextual','unavailable'].includes(e.status));for(const source of e.sources)assert.match(source.url,/^https:\/\//);}
  assert.equal(JSON.stringify(draft),saved);
 }
 assert.equal(JSON.stringify({data,universe,market}),before);
});
test('v7 QA: descriptive annual ranges independently exclude missing and flagged anomalous observations',()=>{
 for(const ticker of Object.keys(data.companies))for(const key of ['growth','targetMargin','tax','salesCapital','terminalROIC']){
  const e=assumptionEvidence(data,ticker,key,{cutoff:data.asOf}),values=e.series.filter(p=>Number.isFinite(p.value)&&p.rangeEligible!==false).map(p=>p.value).sort((a,b)=>a-b);
  if(!values.length){assert.equal(e.range,null);continue;}
  assert.equal(e.range.count,values.length);near(e.range.min,values[0]);near(e.range.max,values.at(-1));near(e.range.median,values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2);assert.match(e.range.classification,/not.*forecast|not.*suggested/i);
 }
 const synthetic=historyRange([{value:.1},{value:null},{value:.2},{value:8,rangeEligible:false},{value:NaN}]);assert.deepEqual([synthetic.min,synthetic.median,synthetic.max,synthetic.count],[.1,.15000000000000002,.2,2]);
});
test('v7 QA: derived ratios are withheld until all current and prior source components were available',()=>{
 let checks=0;
 for(const [ticker,c]of Object.entries(data.companies))for(const row of c.annual)for(const [key,metric]of Object.entries(row.metrics)){
  if(metric.value===null)continue;assert.ok(metric.availableFrom,ticker+' '+row.period+' '+key);
  const fields=metric.components||[],dates=fields.map(k=>row.facts[k]?.filedAt).filter(Boolean),prior=[c.baseObservation,...c.annual].filter(Boolean).find(p=>p.periodEnd===metric.priorPeriodEnd);
  if(prior&&['growth','incrementalBookSalesCapitalProxy','bookROICProxy'].includes(key))for(const k of ['revenue','bookCapitalProxy'])if(prior.facts[k]?.filedAt)dates.push(prior.facts[k].filedAt);
  assert.ok(metric.availableFrom>=dates.sort().at(-1),ticker+' '+row.period+' '+key);checks++;
 }
 assert.ok(checks>300);
 const copy=structuredClone(data);const row=copy.companies.AAPL.annual[0];row.metrics.growth.availableFrom='2026-10-18';const e=assumptionEvidence(copy,'AAPL','growth',{cutoff:'2026-10-17'});assert.equal(e.series[0].value,null);assert.equal(e.series[0].rangeEligible,false);assert.match(e.series[0].detail,/after.*date|withheld/i);
});
test('v7 QA: WACC, perpetual growth and additional claims do not masquerade as observed historical rates',()=>{
 for(const ticker of Object.keys(data.companies))for(const key of ['wacc','terminalGrowth','otherAssets','otherClaims','years']){const e=assumptionEvidence(data,ticker,key,{marketReferences:market,cutoff:data.asOf});assert.deepEqual(e.series,[]);assert.equal(e.range,null);assert.ok(e.summary);}
 const wacc=assumptionEvidence(data,'AAPL','wacc',{marketReferences:market,cutoff:data.asOf});assert.ok(wacc.components.length>0);assert.ok(wacc.components.every(p=>p.date&&p.sourceUrl));
 const tsm=assumptionEvidence(data,'TSM','wacc',{marketReferences:market,cutoff:data.asOf});assert.match(tsm.cautions.join(' '),/not.*currency-matched|TWD/);
 const claims=assumptionEvidence(data,'AAPL','otherClaims');assert.ok(claims.contextSeries.some(g=>/debt/i.test(g.title)&&g.series.some(p=>Number.isFinite(p.value))));
});
test('v7 QA: percentage, multiple and money formatting avoids unsupported precision and blank-as-zero',()=>{
 assert.equal(formatEvidenceValue(.123456,'percent'),'12.3%');assert.equal(formatEvidenceValue(1.234567,'multiple'),'1.23×');assert.equal(formatEvidenceValue(1234.56789,'USD millions'),'1,234.6');for(const v of [null,undefined,NaN,Infinity])assert.equal(formatEvidenceValue(v,'percent'),'Unavailable');
});
test('v7 QA: quarterly TTM context remains separate from annual statistics',()=>{
 const c=universe.companies.find(c=>c.ticker==='AAPL'),r=c.snapshots.find(s=>s.snapshotMode==='ttm'),s=currentSnapshot(c,r),e=assumptionEvidence(data,c.ticker,'targetMargin',{snapshot:s,cutoff:data.asOf});
 assert.ok(e.ttm);assert.equal(e.ttm.periodType,'ttm');assert.ok(e.series.every(p=>p.periodType==='annual'));assert.match(e.ttm.detail,/excluded from annual range/);near(e.ttm.value,s.ebit/s.revenue);assert.equal(assumptionEvidence(data,c.ticker,'targetMargin',{snapshot:s,cutoff:'2000-01-01'}).ttm,null);
});
