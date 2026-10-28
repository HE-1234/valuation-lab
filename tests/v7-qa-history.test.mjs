// Independent arithmetic and period QA for additive current-research history.
// Original-document audit status is preserved and is not upgraded by these tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {REQUIRED_TICKERS} from '../dist/current-model.js';
const load=()=>JSON.parse(fs.readFileSync(new URL('../dist/data/company-history.json',import.meta.url)));
const near=(a,b,label)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${label}: ${a} ≠ ${b}`);
const day=(a,b)=>(Date.parse(a)-Date.parse(b))/864e5;

test('v7 QA: history is additive, dated, unit-explicit and never claims point-in-time eligibility',()=>{
 const data=load();assert.deepEqual(Object.keys(data.companies).sort(),[...REQUIRED_TICKERS,...['AMAT','AMD','ARM','ASML','CAMT','CDNS','CEVA','CRDO','FN','KEYS','KLAC','LRCX','MCD','MRVL','NFLX','NVMI','ONTO','RMBS','SNDK','SNPS','UBER','UMC','MA','SPGI','DUOL','RDDT','HOOD','RKLB','NKE','CMG','CRWD','PANW','BAM','APP','COST','QCOM','ORCL','DELL','ALAB','ADBE','SNOW','BE']].sort());
 assert.match(data.classification,/latest-reported/i);assert.match(data.classification,/not.*backtest/i);
 assert.match(data.methodology.rangeWarning,/not.*recommend|descriptive/i);
 assert.match(data.methodology.capitalProxy,/not.*adjusted|proxy/i);
 for(const [ticker,c]of Object.entries(data.companies)){assert.equal(c.ticker,ticker);assert.equal(c.backtestEligible,false);assert.ok(c.currency);assert.ok(Array.isArray(c.cautions));assert.ok(Array.isArray(c.annual));
  assert.equal(new Set(c.annual.map(r=>r.periodEnd)).size,c.annual.length,ticker);
  for(const row of [c.baseObservation,...c.annual].filter(Boolean)){assert.equal(row.currency,c.currency);assert.equal(row.periodType,'annual');assert.ok(day(row.periodEnd,row.periodStart)>=330&&day(row.periodEnd,row.periodStart)<=380,`${ticker} ${row.period} must be annual, not YTD or quarter`);}
 }
});
test('v7 QA: raw facts convert to millions with exact periods and dated provenance; missing values remain explicit',()=>{
 const data=load();let facts=0;
 for(const [ticker,c]of Object.entries(data.companies))for(const row of [c.baseObservation,...c.annual].filter(Boolean))for(const [key,f]of Object.entries(row.facts)){
  const label=`${ticker} ${row.period} ${key}`;
  if(f.value===null){assert.ok(f.reason,label+' missing reason');continue;}
  assert.equal(typeof f.value,'number',label);assert.ok(Number.isFinite(f.value),label);assert.match(f.unit,/million/i,label);
  if(f.rawValue!==undefined){near(f.value,f.rawValue/1e6,label);assert.equal(f.periodEnd,row.periodEnd,label);if(f.periodStart)assert.equal(f.periodStart,row.periodStart,label);assert.ok(f.tag,label);assert.match(f.sourceUrl,/^https:\/\//,label);}
  else if(f.reportedTableValue!==undefined){const raw=String(f.reportedTableValue),parsed=Number(raw.replace(/[^0-9.+-]/g,''))*(raw.includes('(')?-1:1);near(f.value,parsed*f.multiplierToMillions,label+' original table unit conversion');assert.match(f.rawUnit,/millions|thousands|currency/i,label);assert.equal(f.originalDocumentVerified,true,label);assert.ok(f.tableEvidence,label);assert.match(f.sourceUrl,/^https:\/\//,label);}
  else if(f.tableEvidence?.excerpt){assert.equal(f.value,0,label+' explicit nil narrative only');assert.match(f.tableEvidence.excerpt,/\bnil\b|\bzero\b/i,label);assert.equal(f.originalDocumentVerified,true,label);assert.match(f.sourceUrl,/^https:\/\//,label);}
  else if(Array.isArray(f.tableEvidence?.debtRows)&&f.tableEvidence.debtRows.length===0){assert.equal(f.value,0,label+' reviewed empty debt schedule');assert.equal(f.originalDocumentVerified,true,label);assert.ok(f.tableEvidence.liabilitiesExcerpt?.length>100,label+' complete liability evidence');assert.match(f.formula,/Sum|sum/);assert.match(f.sourceUrl,/^https:\/\//,label);}
  else{assert.ok(f.formula,label+' derived formula');assert.ok(f.components?.length,label+' derived components');assert.ok(f.sourceUrls?.length,label+' derived sources');}
  assert.ok(f.filedAt&&f.filedAt<=data.asOf,label+' source cannot be future');facts++;
 }
 assert.ok(facts>600);
});
test('v7 QA: every available ratio recomputes from numerator and positive denominator',()=>{
 let computed=0;
 for(const [ticker,c]of Object.entries(load().companies))for(const row of c.annual)for(const [key,m]of Object.entries(row.metrics)){
  const label=`${ticker} ${row.period} ${key}`;assert.ok(m.formula,label);assert.ok(['derived','proxy'].includes(m.classification),label);
  if(m.value===null){assert.ok(m.reason,label+' undefined ratio reason');continue;}
  assert.ok(m.denominator>0,label+' invalid denominator');near(m.value,m.numerator/m.denominator,label);assert.ok(m.sourceUrls.length,label+' provenance');computed++;
 }
 assert.ok(computed>300);
});
test('v7 QA: prior-year ratios cannot bridge a missing multiyear period or call it YoY',()=>{
 for(const [ticker,c]of Object.entries(load().companies))for(let i=0;i<c.annual.length;i++){
  const row=c.annual[i],prior=i?c.annual[i-1]:c.baseObservation;
  for(const key of ['growth','incrementalBookSalesCapitalProxy','bookROICProxy']){
   const m=row.metrics[key];if(m?.value===null||m===undefined)continue;
   assert.ok(prior,`${ticker} ${row.period} ${key} needs prior period`);
   assert.equal(m.priorPeriodEnd,prior.periodEnd,`${ticker} ${row.period} ${key}`);
   assert.ok(day(row.periodEnd,prior.periodEnd)>=330&&day(row.periodEnd,prior.periodEnd)<=380,`${ticker} ${row.period} ${key} incorrectly bridges ${prior.periodEnd} → ${row.periodEnd}`);
   assert.ok(day(row.periodStart,prior.periodEnd)>=0&&day(row.periodStart,prior.periodEnd)<=8,`${ticker} ${row.period} ${key} beginning-period mismatch`);
  }
 }
});
test('v7 QA: growth, EBIT margins and tax rates use the stated economic denominators',()=>{
 for(const [ticker,c]of Object.entries(load().companies))for(let i=0;i<c.annual.length;i++){
  const r=c.annual[i],p=i?c.annual[i-1]:c.baseObservation,f=r.facts,m=r.metrics,label=ticker+' '+r.period;
  if(m.growth?.value!==null&&m.growth!==undefined)near(m.growth.value,(f.revenue.value-p.facts.revenue.value)/p.facts.revenue.value,label+' growth');
  if(m.operatingMargin?.value!==null&&m.operatingMargin!==undefined)near(m.operatingMargin.value,f.operatingIncome.value/f.revenue.value,label+' operating margin');
  if(m.effectiveTaxRate?.value!==null&&m.effectiveTaxRate!==undefined){assert.ok(f.pretaxIncome.value>0,label+' tax denominator');near(m.effectiveTaxRate.value,f.incomeTaxExpense.value/f.pretaxIncome.value,label+' tax');if(m.effectiveTaxRate.value<0||m.effectiveTaxRate.value>1){assert.equal(m.effectiveTaxRate.rangeEligible,false,label);assert.equal(m.bookROICProxy.value,null,label+' anomalous tax cannot silently normalize ROIC');}}
  else if(f.pretaxIncome?.value!==null&&f.pretaxIncome?.value<=0)assert.ok(m.effectiveTaxRate.reason,label+' loss tax reason');
 }
});
test('v7 QA: book-capital proxies reconcile and marginal model assumptions remain distinct',()=>{
 for(const [ticker,c]of Object.entries(load().companies))for(let i=0;i<c.annual.length;i++){
  const r=c.annual[i],p=i?c.annual[i-1]:c.baseObservation,f=r.facts,m=r.metrics,label=ticker+' '+r.period;
  if(f.bookCapitalProxy?.value!==null&&f.bookCapitalProxy!==undefined)near(f.bookCapitalProxy.value,f.bookEquity.value+f.mappedDebt.value-f.cashAndEquivalents.value,label+' capital');
  if(m.bookSalesCapitalProxy?.value!==null&&m.bookSalesCapitalProxy!==undefined){near(m.bookSalesCapitalProxy.value,f.revenue.value/f.bookCapitalProxy.value,label+' stock ratio');assert.equal(m.bookSalesCapitalProxy.classification,'proxy');}
  if(m.incrementalBookSalesCapitalProxy?.value!==null&&m.incrementalBookSalesCapitalProxy!==undefined)near(m.incrementalBookSalesCapitalProxy.value,(f.revenue.value-p.facts.revenue.value)/(f.bookCapitalProxy.value-p.facts.bookCapitalProxy.value),label+' incremental proxy');
  if(m.bookROICProxy?.value!==null&&m.bookROICProxy!==undefined){near(m.bookROICProxy.value,f.operatingIncome.value*(1-m.effectiveTaxRate.value)/p.facts.bookCapitalProxy.value,label+' prior-year-capital ROIC');assert.equal(m.bookROICProxy.classification,'proxy');}
 }
});
