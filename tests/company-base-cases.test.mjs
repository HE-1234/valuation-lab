// Separate authored assumptions are tested without rewriting source facts or engine defaults.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {valueCompany, defaults} from '../dist/engine.js';
import {currentSnapshot, REQUIRED_TICKERS} from '../dist/current-model.js';
import {operatingAssumptions} from '../dist/current-operating.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const ledger=read('../dist/data/company-base-cases.json');
const universe=read('../dist/data/current-universe.json');
const company=t=>universe.companies.find(c=>c.ticker===t);
const raw=t=>company(t).snapshots.find(s=>s.id===company(t).currentSnapshotId);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('base-case ledger covers all fourteen distinct current operating hypotheses',()=>{
 assert.equal(ledger.schemaVersion,1);assert.equal(ledger.asOf,'2026-10-17');assert.equal(ledger.version,'2026-10-17.2');
 assert.deepEqual(Object.keys(ledger.companies).sort(),[...REQUIRED_TICKERS].sort());
 const tuples=new Set();
 for(const [t,c] of Object.entries(ledger.companies)){
  assert.equal(c.ticker,t);assert.equal(c.snapshotId,company(t).currentSnapshotId);assert.equal(c.currency,company(t).currency);
  assert.match(c.classification,t==='AAOI'?/conditional staged.*not a validated/:/judgment|provisional/);assert.ok(c.summary.length>30);assert.ok(c.uncertainties.length>=2);
  assert.deepEqual(Object.keys(c.assumptions).sort(),Object.keys(defaults).sort());
  assert.ok(Object.values(c.assumptions).every(Number.isFinite));
  assert.equal(c.assumptions.years,10);assert.ok(c.assumptions.wacc>c.assumptions.terminalGrowth);assert.ok(c.assumptions.terminalROIC>c.assumptions.terminalGrowth);
  assert.ok(c.assumptions.terminalGrowth<=.03);assert.ok(c.assumptions.salesCapital>0);
  for(const k of Object.keys(defaults))assert.ok(c.rationale[k]?.length>30,`${t}: ${k}`);
  tuples.add(JSON.stringify(c.assumptions));
 }
 assert.equal(tuples.size,14);
});

test('base-case sources, dates and reported anchors are separately attributable',()=>{
 for(const [id,s] of Object.entries(ledger.sources)){
  assert.match(s.url,/^https:\/\//,id);assert.ok(s.title);assert.ok(s.classification);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(s.publishedAt),id);assert.ok(s.publishedAt<=ledger.asOf,id);
 }
 for(const [t,c] of Object.entries(ledger.companies)){
  for(const id of c.sourceIds)assert.ok(ledger.sources[id],`${t}: ${id}`);
  for(const a of c.reportedAnchors){assert.ok(a.publishedAt<=c.asOf);for(const id of a.sourceIds)assert.ok(ledger.sources[id]);}
  const a=c.reportedAnchors[0],f=raw(t).facts;near(a.revenue,f.revenue);near(a.operatingIncome,f.operatingIncome);near(a.operatingMargin,f.operatingIncome/f.revenue);
 }
 assert.match(ledger.methodology.evidence,/structural breaks/i);
 assert.match(ledger.methodology.validation,/No stock price/);
});

test('base-case WACC components recompute as dated assumptions with explicit currency treatment',()=>{
 for(const c of Object.values(ledger.companies)){
  const w=c.waccBuild;assert.equal(w.asOf,ledger.asOf);assert.equal(w.riskFreeObservationDate,'2026-10-16');
  near(w.riskFreeUSD,.0509);near(w.equityRiskPremium,.045);
  assert.match(w.equityRiskPremiumClassification,/not a current estimate/);
  const ke=w.riskFreeUSD+w.assumedLeveredBeta*w.equityRiskPremium+w.assumedExtraEquityRisk;
  const kd=w.riskFreeUSD+w.assumedDebtSpreadUSD;
  const usd=ke*(1-w.assumedDebtWeight)+kd*(1-w.normalizedTax)*w.assumedDebtWeight;
  near(ke,w.assumedCostOfEquityUSD);near(kd,w.assumedPretaxCostOfDebtUSD);near(usd,w.unroundedWaccUSD);
  const nominal=c.ticker==='TSM'?(1+usd)*(1+w.currencyConversion.assumedTWDInflation)/(1+w.currencyConversion.assumedUSDInflation)-1:usd;
  near(nominal,w.unroundedWaccInModelCurrency);near(Math.round(nominal/.005)*.005,w.selectedWacc);near(w.selectedWacc,c.assumptions.wacc);
  assert.match(w.classification,/analyst/);assert.match(w.limits,/Not a live beta/);
 }
 assert.equal(ledger.companies.TSM.waccBuild.currency,'TWD');
 assert.ok(ledger.companies.TSM.waccBuild.currencyConversion);
});

test('operating paths and source-linked MU normalization reproduce exactly in the protected engine',()=>{
 for(const [t,c] of Object.entries(ledger.companies)){
  const s=currentSnapshot(company(t),raw(t));
  // Pure operating mathematics only; this is deliberately not calculateCurrent or an equity-bridge approval.
  const m={...s,cash:0,debt:0,shares:1,ebit:s.ebit+(c.normalization?.normalizationDelta||0),provisionalBridge:true};
  const v=valueCompany(m,operatingAssumptions(s,{cutoff:ledger.asOf,normalizationDelta:c.normalization?.normalizationDelta||0,assumptions:c.assumptions,...(c.operatingProfile?{operatingProfile:c.operatingProfile}:{})},c.assumptions)),e=c.economicChecks;
  near(e.startingModelMargin,m.ebit/m.revenue);near(e.firstYearRevenue,v.rows[0].revenue);near(e.year10Revenue,v.rows.at(-1).revenue);
  near(e.revenueMultiple10Years,v.rows.at(-1).revenue/s.revenue);near(e.impliedRevenueCAGR10Years,e.revenueMultiple10Years**.1-1);
  near(v.rows[0].growth,c.assumptions.growth);near(v.rows.at(-1).growth,c.assumptions.terminalGrowth);near(v.rows.at(-1).margin,c.assumptions.targetMargin);
  near(e.firstYearNetReinvestmentToRevenue,v.rows[0].reinvestment/v.rows[0].revenue);
  near(e.terminalReinvestmentRate,c.assumptions.terminalGrowth/c.assumptions.terminalROIC);
  assert.deepEqual(e.negativeFCFFYears,v.rows.filter(r=>r.fcff<0).map(r=>r.year));
  assert.equal(e.operatingEVPositive,v.enterprise>0);assert.equal(e.publicPerShareResult,null);
  if(v.enterprise>0)near(e.terminalValueShareOfOperatingEV,v.terminalShare);else assert.equal(e.terminalValueShareOfOperatingEV,null);
 }
 const mu=ledger.companies.MU;assert.equal(mu.normalization.normalizationDelta,-52724.2);assert.equal(mu.normalization.normalizedStartingMargin,.35);
 assert.match(mu.normalization.adjustmentSource,/mu-20260903/);assert.match(mu.normalization.adjustmentReason,/not a reported restatement/);
 assert.equal(raw('MU').facts.operatingIncome,99340,'normalization must not replace reported EBIT');
});

test('illustrative stresses are finite and retain actual funding/terminal fragility',()=>{
 for(const [t,c] of Object.entries(ledger.companies)){
  assert.equal(c.stressIllustrations.length,2);
  const s=currentSnapshot(company(t),raw(t)),m={...s,cash:0,debt:0,shares:1,ebit:s.ebit+(c.normalization?.normalizationDelta||0),provisionalBridge:true};
  const profileDraft={cutoff:ledger.asOf,normalizationDelta:c.normalization?.normalizationDelta||0,assumptions:c.assumptions,...(c.operatingProfile?{operatingProfile:c.operatingProfile}:{})};
  const base=valueCompany(m,operatingAssumptions(s,profileDraft,c.assumptions));
  for(const x of c.stressIllustrations){
   const v=valueCompany(m,operatingAssumptions(s,profileDraft,{...c.assumptions,...x.assumptions}));assert.ok(Number.isFinite(v.enterprise),t);near(x.year10RevenueMultiple,v.rows.at(-1).revenue/s.revenue);
   assert.equal(x.perShareValue,null);assert.match(x.classification,/not a confidence interval/);
   if(base.enterprise>0)near(x.operatingValueRelativeToBase,v.enterprise/base.enterprise);else assert.equal(x.operatingValueRelativeToBase,null);
  }
 }
 for(const t of ['AAOI','NBIS']){if(t==='NBIS')assert.equal(ledger.companies[t].modelSuitability.status,'unsupported-linear-ramp');else assert.match(ledger.companies[t].modelSuitability.status,/staged/);assert.equal(ledger.companies[t].modelSuitability.economicallyValidated,false);assert.equal(ledger.companies[t].economicChecks.operatingEVPositive,false);assert.match(ledger.companies[t].modelLimits.join(' '),/negative operating enterprise value/);}
 for(const t of ['AMZN','TSLA','COHR','LITE'])assert.match(ledger.companies[t].modelLimits.join(' '),/after year 10/);
});

test('claims placeholders, specialist gates and structural/cyclical caveats cannot masquerade as reviewed facts',()=>{
 for(const c of Object.values(ledger.companies)){
  assert.equal(c.bridgePolicy.status,['AAOI','GOOG'].includes(c.ticker)?'explicit-conditional-claims-overlay':'unreviewed');assert.equal(c.bridgePolicy.zeroMeansVerifiedAbsent,false);assert.equal(c.bridgePolicy.preserveExistingGates,true);
  assert.equal(c.assumptions.otherClaims,0);assert.equal(c.assumptions.otherAssets,0);
  if(['AAOI','GOOG'].includes(c.ticker)){assert.match(c.rationale.otherClaims,/additional.*explicit current claims model/);assert.match(c.rationale.otherAssets,/additional.*asset|additional-asset/);}else{assert.match(c.rationale.otherClaims,/unreviewed placeholder/);assert.match(c.rationale.otherAssets,/unreviewed placeholder/);}
 }
 for(const t of ['NBIS','TSM'])assert.match(ledger.companies[t].bridgePolicy.numericResultPolicy,/withhold/);for(const t of ['AAOI','GOOG'])assert.equal(ledger.companies[t].bridgePolicy.numericResultPolicy,'available-only-with-valid-source-matched-claims-model');
 assert.match(ledger.companies.COHR.modelLimits.join(' '),/structural break/);
 assert.match(ledger.companies.AVGO.modelLimits.join(' '),/acquisitions/);
 assert.match(ledger.companies.NBIS.modelLimits.join(' '),/Yandex/);
 assert.match(ledger.companies.MU.modelLimits.join(' '),/revenue itself is not normalized/);
 assert.match(ledger.companies.TSM.modelLimits.join(' '),/USD ADR/);
});
