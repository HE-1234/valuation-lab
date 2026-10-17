// Independent validation of the actual dated company-case ledger and user-state
// preservation. Rationale quality and financial forecasts remain judgments.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults} from '../dist/engine.js';
import {currentSnapshot,draftFor,safeDraft,calculateCurrent,researchCaseFor} from '../dist/current-model.js';
import {startStudio} from './v7-runtime-harness.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+n,import.meta.url)));
const cases=read('company-base-cases.json'),universe=read('current-universe.json'),near=(a,b,label,tolerance=1e-9)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<tolerance*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);
const pairing=t=>{const company=universe.companies.find(c=>c.ticker===t),raw=company.snapshots.find(r=>r.id===company.currentSnapshotId);return {company,raw,snapshot:currentSnapshot(company,raw)};};
test('v8 QA: all fourteen actual cases are exact-baseline, dated, independently editable judgments with complete rationale',()=>{
 assert.deepEqual(Object.keys(cases.companies).sort(),universe.companies.map(c=>c.ticker).sort());assert.match(cases.classification,/judgments.*not.*guidance/i);
 const shapes=new Set();
 for(const [ticker,c] of Object.entries(cases.companies)){
  const {company,raw,snapshot}=pairing(ticker),looked=researchCaseFor(cases,company,raw);assert.ok(looked,ticker+' case rejected');assert.equal(c.snapshotId,raw.id);assert.equal(c.currency,snapshot.currency);assert.ok(c.asOf<=universe.asOf);
  assert.deepEqual(Object.keys(c.assumptions).sort(),Object.keys(defaults).sort());for(const k of Object.keys(defaults)){assert.ok(Number.isFinite(c.assumptions[k]));assert.ok(c.rationale[k]?.length>40,ticker+' '+k+' thin rationale');}
  assert.ok(c.uncertainties.length>=2);assert.equal(c.bridgePolicy.zeroMeansVerifiedAbsent,false);assert.equal(c.bridgePolicy.preserveExistingGates,true);assert.equal(c.assumptions.otherClaims,0);assert.equal(c.assumptions.otherAssets,0);assert.match(c.rationale.otherClaims,['AAOI','GOOG'].includes(ticker)?/additional.*explicit current claims model/:/placeholder|unreviewed/);
  for(const id of c.sourceIds){const source=cases.sources[id];assert.ok(source,ticker+' '+id);assert.match(source.url,/^https:\/\//);assert.ok(source.publishedAt<=c.asOf);}
  const anchor=c.reportedAnchors.find(a=>a.snapshotId===raw.id);assert.ok(anchor);assert.equal(anchor.periodEnd,snapshot.periodEnd);assert.equal(anchor.currency,snapshot.currency);near(anchor.revenue,snapshot.revenue,ticker+' reported revenue');near(anchor.operatingIncome,snapshot.ebit,ticker+' reported EBIT');near(anchor.operatingMargin,snapshot.ebit/snapshot.revenue,ticker+' reported margin');
  const draft=draftFor(company,raw,{baseCases:cases});assert.deepEqual(draft.assumptions,c.assumptions);assert.equal(draft.assumptionProvenance.kind,'researched-base-case');assert.equal(draft.modelReviewed,false);assert.equal(draft.bridgeReviewed,false);shapes.add(JSON.stringify(c.assumptions));
 }
 assert.equal(shapes.size,14,'company-specific research must not collapse to one generic preset');
});
test('v8 QA: every WACC build independently recomputes, with TWD currency conversion explicit rather than a USD rate relabel',()=>{
 for(const [ticker,c] of Object.entries(cases.companies)){
  const w=c.waccBuild,ke=w.riskFreeUSD+w.assumedLeveredBeta*w.equityRiskPremium+w.assumedExtraEquityRisk,kd=w.riskFreeUSD+w.assumedDebtSpreadUSD,usd=ke*(1-w.assumedDebtWeight)+kd*(1-w.normalizedTax)*w.assumedDebtWeight;
  near(w.assumedCostOfEquityUSD,ke,ticker+' Ke');near(w.assumedPretaxCostOfDebtUSD,kd,ticker+' Kd');near(w.unroundedWaccUSD,usd,ticker+' USD WACC');near(w.normalizedTax,c.assumptions.tax,ticker+' tax');
  const model=w.currencyConversion?(1+usd)*(1+w.currencyConversion.assumedTWDInflation)/(1+w.currencyConversion.assumedUSDInflation)-1:usd;
  // The ledger serializes this derived rate to eight decimal places.
  near(w.unroundedWaccInModelCurrency,model,ticker+' model currency WACC',5.1e-9);near(c.assumptions.wacc,Math.round(model/.005)*.005,ticker+' rounded WACC');assert.equal(w.currency,c.currency);assert.match(w.classification,/analyst|estimate/);
 }
 assert.ok(cases.companies.TSM.waccBuild.currencyConversion);assert.match(cases.companies.TSM.modelLimits.join(' '),/TWD.*USD ADR|inflation conversion/);
});
test('v8 QA: operating-only economic checks recompute independently without supplying or validating per-share results',()=>{
 for(const [ticker,c] of Object.entries(cases.companies)){
  const {snapshot:s}=pairing(ticker),a=c.assumptions,e=c.economicChecks,startMargin=(s.ebit+(c.normalization?.normalizationDelta||0))/s.revenue;let revenue=s.revenue,pv=0;const rows=[];
  for(let y=1;y<=10;y++){let growth=a.growth+(a.terminalGrowth-a.growth)*(y-1)/9,margin=startMargin+(a.targetMargin-startMargin)*y/10,capital=a.salesCapital;if(c.operatingProfile?.id==='aaoi-capacity-ramp-v1'){const i=y-1,gw=[1,15/23,11/23,7/23,5/23,3/23,11/115,1/23,1/115,0],ref=-67.406/595.97,m=[-.05,0,.05,.08,.10,.12,.12,.12,.12,.12];growth=a.terminalGrowth+(a.growth-a.terminalGrowth)*gw[i];margin=startMargin+(a.targetMargin-startMargin)*(m[i]-ref)/(.12-ref);capital=i<7?a.salesCapital*[1,1,1.25,1.5,1.75,2,2][i]:1/((1-(i-6)/3)/(2*a.salesCapital)+(i-6)/3*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC);}const next=revenue*(1+growth),ebit=next*margin,nopat=ebit-Math.max(0,ebit)*a.tax,reinvestment=Math.max(0,(next-revenue)/capital),fcff=nopat-reinvestment;rows.push({year:y,revenue:next,reinvestment,fcff});pv+=fcff/(1+a.wacc)**y;revenue=next;}
  const terminalNopat=revenue*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax),terminalPV=terminalNopat*(1-a.terminalGrowth/a.terminalROIC)/(a.wacc-a.terminalGrowth)/(1+a.wacc)**10,operatingEV=pv+terminalPV;
  near(e.startingModelMargin,startMargin,ticker+' start margin');near(e.firstYearRevenue,rows[0].revenue,ticker+' year1');near(e.year10Revenue,revenue,ticker+' year10');near(e.revenueMultiple10Years,revenue/s.revenue,ticker+' revenue multiple');near(e.impliedRevenueCAGR10Years,(revenue/s.revenue)**.1-1,ticker+' CAGR');near(e.firstYearNetReinvestmentToRevenue,rows[0].reinvestment/rows[0].revenue,ticker+' reinvestment');near(e.terminalReinvestmentRate,a.terminalGrowth/a.terminalROIC,ticker+' terminal reinvestment');assert.deepEqual(e.negativeFCFFYears,rows.filter(r=>r.fcff<0).map(r=>r.year));assert.equal(e.firstPositiveFCFFYear,rows.find(r=>r.fcff>0)?.year||null);assert.equal(e.publicPerShareResult,null);
  if(operatingEV>0)near(e.terminalValueShareOfOperatingEV,terminalPV/operatingEV,ticker+' terminal share');else{assert.equal(e.terminalValueShareOfOperatingEV,null);assert.ok(['AAOI','NBIS'].includes(ticker));}
 }
});
test('v8 QA: MU normalization is explicit; AAOI retains its negative stress economics and NBIS remains withheld',async()=>{
 const h=await startStudio();h.change('#current-company','MU');const mu=cases.companies.MU,{snapshot}=pairing('MU'),notice=h.get('.base-normalization');assert.ok(notice);assert.equal(notice.parent.getAttribute('class'),'base-case-control');assert.match(notice.textContent,/35%/);assert.match(notice.textContent,/analyst adjustment|reported EBIT.*unchanged/i);near((snapshot.ebit+mu.normalization.normalizationDelta)/snapshot.revenue,.35,'MU normalized starting margin');
 h.step(1);h.input('#g-normalize','0');assert.equal(h.state('MU').normalizationDelta,0);h.get('#load-base-case').click();assert.equal(h.state('MU').normalizationDelta,mu.normalization.normalizationDelta);
 for(const ticker of ['AAOI','NBIS']){h.change('#current-company',ticker);const warning=h.get('.base-case-warning');assert.ok(warning);assert.match(warning.textContent,ticker==='AAOI'?/5 of 10|5\/10/:/9 of 10|9\/10/);assert.match(warning.textContent,/funding|financing/);const {company,raw,snapshot}=pairing(ticker),draft=draftFor(company,raw,{baseCases:cases});if(ticker==='NBIS'){assert.match(h.get('#guided-results').textContent,/withheld/i);assert.equal(h.get('#simulation-lab').innerHTML,'');assert.throws(()=>calculateCurrent(snapshot,draft));}else{const result=calculateCurrent(snapshot,draft);assert.ok(result.enterprise<0);assert.ok(result.rawPerShare<0);assert.equal(result.perShare,0);assert.match(h.get('#guided-results').textContent,/Raw common equity/);assert.match(h.get('#guided-results').textContent,/not evidence.*worthless/i);assert.equal(h.mounts.at(-1).ticker,'AAOI');}}
});
test('v8 QA: actual-case reload never silently overwrites saved numbers, notes, quotes or distribution choices; explicit load has Undo',async()=>{
 const h=await startStudio();h.input('#g-growth','17');h.step(1);h.input('#note-today','My independent thesis');h.input('#quote-price','200');h.input('#quote-date','2026-10-16');h.input('#quote-currency','USD');h.input('#quote-source','https://example.com/my-quote');h.change('#quote-share-basis',h.mounts[0].snapshot.shareBasis);
 const config={trials:500,seed:'saved-by-user',drivers:{growth:{type:'fixed',value:.17}}};h.mounts.at(-1).options.onConfigChange(config);const saved=structuredClone(h.state());
 const again=await startStudio({storage:h.storage});assert.equal(again.state().assumptions.growth,.17);for(const k of ['notes','quote','simulationConfig'])assert.deepEqual(again.state()[k],saved[k]);
 again.get('#load-base-case').click();assert.deepEqual(again.state().assumptions,cases.companies.AAPL.assumptions);for(const k of ['notes','quote','simulationConfig'])assert.deepEqual(again.state()[k],saved[k]);again.get('#undo-base-case').click();assert.deepEqual(again.state().assumptions,saved.assumptions);for(const k of ['notes','quote','simulationConfig'])assert.deepEqual(again.state()[k],saved[k]);
 const {company,raw}=pairing('AAPL'),legacy=draftFor(company,raw);delete legacy.assumptionProvenance;const preserved=safeDraft(legacy,company,raw,{baseCases:cases});assert.deepEqual(preserved.assumptions,defaults);assert.equal(preserved.assumptionProvenance.kind,'user-draft');
});
