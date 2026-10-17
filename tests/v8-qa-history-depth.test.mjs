// Independent full-record QA. Cash amounts are issuer reporting-currency millions.
// Exact source-file audit is optional outside the research executor; no browser claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assumptionEvidence} from '../dist/assumption-history.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data/company-history.json',import.meta.url)));
const day=(a,b)=>(Date.parse(a)-Date.parse(b))/864e5;
const near=(a,b,label)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);
const years=['AAPL','MSFT','AMZN','GOOG','META','NVDA','TSLA','COHR','LITE','AAOI','MU','AVGO','TSM'];

test('v8 QA: thirteen established issuer records contain ten ordered full fiscal years; Nebius has only its real three',()=>{
 for(const ticker of years){const c=data.companies[ticker];assert.equal(c.annual.length,10,ticker);
  for(let i=0;i<c.annual.length;i++){const r=c.annual[i];assert.equal(r.periodType,'annual');assert.ok(day(r.periodEnd,r.periodStart)>=330&&day(r.periodEnd,r.periodStart)<=380,ticker+' '+r.period);assert.equal(r.currency,c.currency);assert.match(r.period,/^FY\d{4}$/);
   if(i){const prior=c.annual[i-1];assert.ok(day(r.periodEnd,prior.periodEnd)>=330&&day(r.periodEnd,prior.periodEnd)<=380,ticker+' annual gap');assert.ok(day(r.periodStart,prior.periodEnd)>0&&day(r.periodStart,prior.periodEnd)<=8,ticker+' overlap/gap');assert.equal(+r.period.slice(2),+prior.period.slice(2)+1,ticker+' fiscal label gap');}
  }
 }
 const n=data.companies.NBIS;assert.deepEqual(n.annual.map(r=>r.period),['FY2023','FY2024','FY2025']);assert.equal(n.baseObservation,null);assert.equal(n.structuralBreak.oldYandexConsolidatedSeriesPermitted,false);assert.equal(n.annual[0].metrics.growth.value,null);assert.match(n.cautions.join(' '),/recast|Yandex|continuing operations/i);
});
test('v8 QA: ten-year display never invents a missing growth or beginning-capital base',()=>{
 for(const [ticker,c] of Object.entries(data.companies))for(let i=0;i<c.annual.length;i++){
  const r=c.annual[i],prior=i?c.annual[i-1]:c.baseObservation;
  for(const key of ['growth','incrementalBookSalesCapitalProxy','bookROICProxy']){const m=r.metrics[key];if(m.value===null){assert.ok(m.reason,ticker+' '+r.period+' '+key);continue;}assert.ok(prior);assert.equal(m.priorPeriodEnd,prior.periodEnd);assert.ok(day(r.periodEnd,prior.periodEnd)>=330&&day(r.periodEnd,prior.periodEnd)<=380);assert.ok(day(r.periodStart,prior.periodEnd)>0&&day(r.periodStart,prior.periodEnd)<=8);}
 }
 assert.equal(data.companies.AVGO.baseObservation,null);assert.equal(data.companies.AVGO.annual[0].metrics.growth.value,null);
});
test('v8 QA: all numeric facts preserve exact unit conversion and source-period metadata; missing inputs stay missing',()=>{
 let raw=0,foreign=0;
 for(const [ticker,c] of Object.entries(data.companies))for(const r of [c.baseObservation,...c.annual].filter(Boolean))for(const [key,f] of Object.entries(r.facts)){
  const label=ticker+' '+r.period+' '+key;
  if(f.value===null){assert.ok(f.reason,label);continue;}
  assert.ok(Number.isFinite(f.value),label);assert.ok(f.filedAt&&f.filedAt<=data.asOf,label+' availability');
  if(f.rawValue!==undefined){near(f.value,f.rawValue/1e6,label);assert.equal(f.periodEnd,r.periodEnd,label);if(f.periodStart)assert.equal(f.periodStart,r.periodStart,label);assert.match(f.accession,/^\d{10}-\d{2}-\d{6}$/);assert.match(f.sourceUrl,new RegExp('/'+f.accession.replaceAll('-','')+'/'));assert.equal(typeof f.originalDocumentVerified,'boolean');raw++;}
  else if(f.reportedTableValue!==undefined){const v=String(f.reportedTableValue);near(f.value,Number(v.replace(/[^0-9.+-]/g,''))*(v.includes('(')?-1:1)*f.multiplierToMillions,label);assert.equal(f.originalDocumentVerified,true,label);assert.ok(f.tableEvidence?.rawRow,label);foreign++;}
  else if(f.formula){assert.ok(f.components.length,label);assert.ok(f.sourceUrls.length,label);const components=f.components.map(k=>r.facts[k]);assert.ok(components.every(x=>Number.isFinite(x?.value)),label+' derived from unavailable component');assert.equal(f.filedAt,components.map(x=>x.filedAt).filter(Boolean).sort().at(-1),label+' derived availability');}
  else{assert.equal(f.value,0,label);assert.match(f.tableEvidence?.excerpt||'',/\bnil\b|\bzero\b/i,label);}
 }
 assert.ok(raw>2000);assert.ok(foreign>100);
});
test('v8 QA: metric availability uses actual latest restatement sources, including prior fiscal-year components',()=>{
 let lateRestatements=0;
 for(const [ticker,c] of Object.entries(data.companies))for(const r of c.annual)for(const [input,key] of [['growth','growth'],['targetMargin','operatingMargin'],['tax','effectiveTaxRate'],['salesCapital','bookSalesCapitalProxy'],['terminalROIC','bookROICProxy']]){
  const m=r.metrics[key];if(m.value===null)continue;
  const e=assumptionEvidence(data,ticker,input,{cutoff:m.availableFrom}),at=e.series.find(p=>p.periodEnd===r.periodEnd);near(at.value,m.value,ticker+' '+r.period+' '+input);
  const cutoff=new Date(Date.parse(m.availableFrom)-864e5).toISOString().slice(0,10),before=assumptionEvidence(data,ticker,input,{cutoff}).series.find(p=>p.periodEnd===r.periodEnd);
  assert.equal(before.value,null,ticker+' '+r.period+' leaked before filing');assert.equal(before.rangeEligible,false);if(day(m.availableFrom,r.periodEnd)>400)lateRestatements++;
 }
 assert.ok(lateRestatements>50,'must exercise latest-reported old-year restatements, not just recent years');
});
test('v8 QA: partial tax / capital histories remain honestly incomplete and descriptive ranges use eligible points only',()=>{
 for(const [ticker,input,metric] of [['AAOI','tax','effectiveTaxRate'],['META','salesCapital','bookSalesCapitalProxy'],['LITE','salesCapital','bookSalesCapitalProxy'],['AVGO','salesCapital','bookSalesCapitalProxy']]){
  const c=data.companies[ticker],e=assumptionEvidence(data,ticker,input),known=c.annual.filter(r=>Number.isFinite(r.metrics[metric].value));assert.ok(known.length<10,ticker+' unexpectedly full');assert.equal(e.series.length,10);assert.ok(e.series.some(p=>p.value===null));
  const eligible=e.series.filter(p=>Number.isFinite(p.value)&&p.rangeEligible!==false);assert.equal(e.range?.count||0,eligible.length);assert.ok((e.range?.count||0)<10);
 }
 const aaoi=data.companies.AAOI.annual;assert.equal(aaoi.find(r=>r.period==='FY2016').metrics.effectiveTaxRate.rangeEligible,false);assert.ok(aaoi.filter(r=>r.period>='FY2018').every(r=>r.metrics.effectiveTaxRate.value===null));
});
test('v8 QA: TSM annual IFRS / TWD record remains separate from current TIFRS and US-dollar context',()=>{
 const c=data.companies.TSM;assert.equal(c.currency,'TWD');assert.equal(c.baseObservation.period,'FY2015');assert.deepEqual([c.annual[0].period,c.annual.at(-1).period],['FY2016','FY2025']);near(c.annual.at(-1).facts.revenue.value,3809054.3,'TSM revenue');
 assert.match(assumptionEvidence(data,'TSM','growth').summary,/IASB IFRS.*TWD.*TIFRS/);assert.equal(c.backtestEligible,false);
 for(const r of [c.baseObservation,...c.annual]){assert.equal(r.currency,'TWD');assert.equal(r.facts.revenue.originalDocumentVerified,true);assert.ok(r.facts.revenue.tableEvidence);}
});
const cache=process.env.VALUATION_SOURCE_CACHE||'/workspace/shared/valuation-data/current-universe-v5';
test('v8 QA: cached SEC raw facts independently match every exported tagged US source fact',{skip:!fs.existsSync(path.join(cache,'AAPL-facts.json'))&&'Research cache is not bundled; provenance/unit tests still run.'},()=>{
 let count=0;
 for(const [ticker,c] of Object.entries(data.companies)){
  if(['NBIS','TSM'].includes(ticker))continue;
  const bytes=fs.readFileSync(path.join(cache,ticker+'-facts.json')),source=JSON.parse(bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),c.sourceCacheSHA256,ticker+' source cache changed');
  for(const r of [c.baseObservation,...c.annual].filter(Boolean))for(const [key,f] of Object.entries(r.facts)){
   if(f.rawValue===undefined)continue;
   const [namespace,tag]=f.tag.split(':'),unit=f.unit==='million shares'?'shares':'USD',candidates=source.facts[namespace][tag].units[unit];
   assert.ok(candidates.some(x=>x.val===f.rawValue&&(x.start??null)===(f.periodStart??null)&&x.end===f.periodEnd&&x.filed===f.filedAt&&x.accn===f.accession&&['10-K','10-K/A'].includes(x.form)),ticker+' '+r.period+' '+key+' source mismatch');count++;
  }
 }
 assert.ok(count>2400);
});
