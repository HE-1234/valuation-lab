import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {keysRegistry} from '../dist/keys-research-registry.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'dist/data/incremental-KEYS-2026-10-19-v1');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record=keysRegistry.companies[0];
const scenarios=[record.annualCase,...record.alternatives.map(item=>item.annualCase)];
const files=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]);

test('KEYS immutable registry and cases JSON retain source model exactly',()=>{
 assert.ok(Object.isFrozen(keysRegistry)&&Object.isFrozen(record)&&Object.isFrozen(record.sourceInputs.cases.base));
 assert.deepEqual(keysRegistry,read('cases.json'));
 assert.deepEqual(record.sourceInputs,read('dcf-inputs-v1.json'));
 assert.deepEqual(record.sourceOutputs,read('dcf-output-v1.json'));
 assert.deepEqual(record.sourceOutputs,read('conditional-outputs-v1.json'));
 assert.equal(record.bridge.type,'keys-v1');
 assert.deepEqual(record.bridge.options.map(item=>item.key),['minimumOperatingCash','pensionReserve','otherClaimReserve','cashFloorRatio','emergencyDebtCapacity','emergencyInterest','equityIssuePrice','equityFee']);
 assert.equal(scenarios.length,3);
 for(const annualCase of scenarios){
  assert.equal(annualCase.annual.length,10);
  const source=record.sourceOutputs[annualCase.sourceScenario];
  annualCase.annual.forEach((row,index)=>{
   assert.deepEqual(row.sourceRow,source.rows[index]);
   assert.equal(row.reinvestment,source.rows[index].reinvestment);
   assert.equal(row.period,`12M Jul ${2027+index}`);
   assert.equal(row.periodEnd,`${2027+index}-07-31`);
  });
 }
});

test('KEYS all three dates and every present-market gate stay explicit',()=>{
 const {identity,bridge}=record;
 assert.equal(identity.discountOrigin,'2026-07-31');
 assert.equal(identity.shareDate,'2026-08-27');
 assert.equal(identity.informationCutoff,'2026-10-19');
 assert.equal(bridge.shares,170.244745);
 assert.equal(bridge.reportedSharesDate,'2026-08-27');
 assert.equal(bridge.currentQuote,null);
 for(const object of [identity,bridge,record.evidence])for(const key of ['currentValuationEligible','currentPriceTargetEligible','historicalBacktestEligible','rankingEligible','upsideEligible','expectedReturnEligible','recommendationEligible'])assert.equal(object[key],false,`${key} must stay false`);
 for(const annualCase of scenarios){
  assert.match(annualCase.anchor.fiscalCalendarCaution,/Rolling July 31.*not October/);
  assert.match(annualCase.anchor.classification,/rolling July 31 years/);
 }
});

test('KEYS all ten annual slots retain accounting breaks, 221 facts and null observations',()=>{
 const history=read('history-v1.json'),provenance=read('history-field-provenance-v1.json');
 assert.equal(record.history.length,10);
 assert.equal(Object.values(provenance).flatMap(fields=>Object.values(fields)).filter(value=>value!==null).length,221);
 assert.deepEqual(record.historyFieldProvenance,provenance);
 record.history.forEach((row,index)=>{
  assert.equal(row.fiscalYear,2016+index);
  assert.deepEqual(row.sourceRow,history[index]);
  assert.deepEqual(row.fieldProvenance,provenance[String(row.fiscalYear)]);
  assert.equal(row.shares,history[index].shares);
  assert.equal(row.operatingLeaseCurrent,history[index].operating_lease_current);
  assert.equal(row.operatingLeaseNoncurrent,history[index].operating_lease_noncurrent);
  assert.equal(row.comparableIssuerAnnual,false);
  assert.ok(row.basisLabel&&row.basisLabelZh&&row.classificationZh);
  assert.equal(row.revenueAccountingBasis,index<3?'ASC605':'ASC606');
 });
 assert.equal(record.history[1].canonicalOperatingEBIT,148);
 assert.equal(record.history[2].canonicalOperatingEBIT,-394);
 assert.match(record.history[0].classification,/not retroactively homogenized/);
 assert.match(record.history[2].classification,/709m impairment/);
 assert.equal(record.history[9].sourceRow.net_income,850);
});

test('KEYS all eleven original guidance pairs preserve dates and six field sources',()=>{
 const originals=read('guidance/guidance_vs_actual.json'),audit=read('independent-audit-v2/guidance-checks.json');
 assert.equal(record.guidanceComparisons.length,11);
 record.guidanceComparisons.forEach((row,index)=>{
  assert.deepEqual(row.sourceRow,originals[index]);
  assert.equal(Object.keys(row.fieldProvenance).length,6);
  assert.ok(row.forecast_issued_date<row.actual_issued_date);
  assert.equal(row.guide_url,originals[index].guidance_source);
  assert.equal(row.actual_url,originals[index].actual_source);
  assert.equal(row.revenue_actual,audit[index].actual_revenue);
  assert.equal(row.eps_actual,audit[index].actual_eps);
  assert.ok(row.revenue_actual>row.revenue_high&&row.eps_actual>row.eps_high);
  assert.match(row.comparisonScope,/interim revisions not exhaustively searched/);
  for(const [key,field]of Object.entries(row.fieldProvenance))assert.equal(field.value,row[key]);
 });
 const tax=record.guidanceComparisons.find(row=>row.quarter==='2024Q3').qualityAdjustments[0];
 assert.equal(tax.adjusted,1.41);
 const tariff=record.guidanceComparisons.find(row=>row.quarter==='2026Q2').qualityAdjustments[0];
 assert.equal(tariff.adjustedRevenue,1758);
 assert.equal(tariff.adjustedEPS,2.58);
});

test('KEYS provision and cash tax remain distinct with source and period',()=>{
 const evidence=read('latest-capital-evidence-v1.json');
 assert.deepEqual(evidence,record.latestCapitalEvidence);
 assert.equal(record.latestQuarter.values.tax,66);
 assert.equal(evidence.observations.nineMonthTaxProvision.value,66);
 assert.equal(evidence.observations.nineMonthCashIncomeTaxPaidNet.value,127);
 assert.equal(evidence.observations.exactCommonShares.unscaledShares,170244745);
 for(const key of ['nineMonthTaxProvision','nineMonthCashIncomeTaxPaidNet']){
  assert.equal(evidence.observations[key].periodEnd,'2026-07-31');
  assert.ok(evidence.observations[key].locator&&evidence.observations[key].basis);
 }
 assert.equal(evidence.capitalBridge,-567.56);
});

test('KEYS source limitations and controlling independent audit are in both languages',()=>{
 assert.equal(Object.keys(record.prose).length,28);
 for(const value of Object.values(record.prose)){
  assert.ok(value.en.length>60&&value['zh-Hans'].length>30);
  assert.match(value['zh-Hans'],/[\u4e00-\u9fff]/);
 }
 assert.match(record.prose.funding.en,/April 21, 2031/);
 assert.match(record.prose.funding.en,/repayment\/refinancing/);
 assert.match(record.prose.sourceLimits.en,/does not prove no interim update/);
 assert.match(record.prose.sourceLimits.en,/no exhaustive interim-release, call-Q&A, independent interview, customer or competitor/);
 assert.match(record.prose.claimLimits.en,/arbitrary new semantic inputs are not admitted/);
 assert.match(record.prose.audit.en,/PASS WITH LIMITATIONS/);
 assert.match(record.prose.awards.en,/not valued grant by grant/);
 assert.match(record.prose.guidanceQuality.en,/not an independent quality-of-earnings/);
 assert.equal(record.auditResults.manifest_count,113);
 assert.equal(record.auditResults.invalid_rejections.length,23);
});

test('KEYS package hashes, source identities and every local report link verify',()=>{
 const manifest=read('packaging-manifest-v1.json');
 assert.equal(manifest.registrySHA256,hash(path.join(root,'dist/keys-research-registry.js')));
 for(const item of manifest.generatedFiles)assert.equal(hash(path.join(dir,item.path)),item.sha256,item.path);
 for(const item of manifest.packagedSources)assert.equal(hash(path.join(dir,item.packagedArtifact)),item.packagedSHA256,item.packagedArtifact);
 for(const key of ['source','history','audit','fullReport','auditReport'])assert.equal(hash(path.resolve(root,'dist',record.identity[key+'Path'])),record.identity[key+'SHA256']);
 const report=fs.readFileSync(path.join(dir,'KEYS-v1.html'),'utf8');
 const ids=[...report.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const match of report.matchAll(/href="([^"]+)"/g)){
  const href=match[1];
  if(href.startsWith('https://'))continue;
  if(href.startsWith('#'))assert.ok(ids.includes(href.slice(1)),href);
  else assert.ok(fs.existsSync(path.resolve(dir,href)),href);
 }
 assert.match(report,/lang="zh-Hans"/);
 assert.match(report,/221 non-null|221 非空/);
});

test('KEYS curated package excludes corporate originals and private execution paths',()=>{
 const manifest=read('packaging-manifest-v1.json');
 assert.equal(manifest.rawFilingsIncluded,false);
 assert.equal(manifest.fullTranscriptsIncluded,false);
 assert.equal(manifest.rawSECDatasetsIncluded,false);
 assert.equal(manifest.adapterOrDeploymentCertified,false);
 assert.equal(manifest.sourceResearchModified,false);
 for(const filename of files(dir)){
  assert.ok(!/\.(pdf|htm|txt)$/.test(filename),filename);
  if(filename.endsWith('.html'))assert.equal(path.basename(filename),'KEYS-v1.html');
  assert.ok(!/sec-(companyfacts|submissions)\.json$/.test(filename),filename);
  assert.doesNotMatch(fs.readFileSync(filename,'utf8'),/\/workspace\/|\/home\/|\/tmp\/|file:\/\//,filename);
 }
});
