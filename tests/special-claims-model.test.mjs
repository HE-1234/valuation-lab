// Independent source/numerical QA for current-period claim overlays.
// This oracle deliberately does not call the production FCFF or claims functions.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,safeDraft,currentIssues,calculateCurrent,freezeCurrent,quoteComparison,loadResearchedBaseCase} from '../dist/current-model.js';
import {claimsDefinition,claimsDefaults,claimsIssues,preferredDividendSchedule,currentEconomicShareBasis,claimsSensitivity} from '../dist/current-claims.js';
import {simulateCurrent} from '../dist/simulation.js';
const json=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const universe=json('../dist/data/current-universe.json'),cases=json('../dist/data/company-base-cases.json'),facts=json('./fixtures/special-claims-source-facts.json');
const near=(actual,expected,label='value')=>assert.ok(Number.isFinite(actual)&&Number.isFinite(expected)&&Math.abs(actual-expected)<=1e-9*Math.max(1,Math.abs(expected)),`${label}: ${actual} != ${expected}`);
const pairing=(ticker,id)=>{const company=universe.companies.find(c=>c.ticker===ticker),raw=company.snapshots.find(r=>r.id===(id||company.currentSnapshotId)),snapshot=currentSnapshot(company,raw),draft={...draftFor(company,raw),cutoff:universe.asOf};return {company,raw,snapshot,draft};};
const variants=['AAOI-CURRENT-2025-12-31','AAOI-TTM-2026-06-30','GOOG-TTM-2026-06-30'];
function operating(snapshot,draft,a=draft.assumptions){
 let prior=snapshot.revenue,pv=0;const rows=[],start=(snapshot.ebit+draft.normalizationDelta)/snapshot.revenue;
 for(let year=1;year<=a.years;year++){
  let growth=a.growth+(a.terminalGrowth-a.growth)*(year-1)/Math.max(1,a.years-1),margin=start+(a.targetMargin-start)*year/a.years,capital=a.salesCapital;
  if(draft.operatingProfile?.id==='aaoi-capacity-ramp-v1'){
   const i=year-1,weights=[1,15/23,11/23,7/23,5/23,3/23,11/115,1/23,1/115,0],reference=-67.406/595.97,referenceMargins=[-.05,0,.05,.08,.1,.12,.12,.12,.12,.12];
   growth=a.terminalGrowth+(a.growth-a.terminalGrowth)*weights[i];margin=start+(a.targetMargin-start)*(referenceMargins[i]-reference)/(.12-reference);
   capital=i<7?a.salesCapital*[1,1,1.25,1.5,1.75,2,2][i]:1/((1-(i-6)/3)/(2*a.salesCapital)+((i-6)/3)*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC);
  }
  const revenue=prior*(1+growth),ebit=revenue*margin,nopat=ebit-Math.max(ebit,0)*a.tax,reinvestment=Math.max(0,(revenue-prior)/capital),fcff=nopat-reinvestment;
  pv+=fcff/(1+a.wacc)**year;rows.push({revenue,fcff});prior=revenue;
 }
 const terminalNopat=prior*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax),terminalReinvestment=terminalNopat*a.terminalGrowth/a.terminalROIC,terminalPV=(terminalNopat-terminalReinvestment)/(a.wacc-a.terminalGrowth)/(1+a.wacc)**a.years;
 return {enterprise:pv+terminalPV,forecastPV:pv,terminalPV,terminalNopat,terminalReinvestment,rows};
}
const dividendDates=['2026-08-15','2026-11-15','2027-02-15','2027-05-15','2027-08-15','2027-11-15','2028-02-15','2028-05-15','2028-08-15','2028-11-15','2029-02-15','2029-05-15'];
function oracle(snapshot,draft,a=draft.assumptions){
 const op=operating(snapshot,draft,a),c=draft.claims;let cash=snapshot.cash,shares,claim,asset=0,pv=0;
 if(snapshot.ticker==='AAOI'){
  const f=facts.AAOI[snapshot.periodEnd];shares=f.periodEndCommonShares;
  if(c.capitalBasis==='known-transactions'){cash+=587.99998589-26.783472+c.interimCashChange;shares=84.906289+5.694845;}
  claim=f.bankAcceptancePayable*c.vendorFinancingFraction+c.warrantTimeValueReserve;
  if(c.method==='if-converted')shares+=f.notePrincipal*facts.AAOI.noteTerms.sharesPerThousandPrincipal/1000;
  else claim+=c.method==='fair-value'?c.noteFairValue:f.notePrincipal;
  const equityBeforeWarrants=op.enterprise+cash+a.otherAssets-snapshot.debt-a.otherClaims-claim;
  const warrants=c.warrantCoverage==='all'?facts.AAOI.customerWarrant.maximumShares:facts.AAOI.customerWarrant.vestedSharesAtIssuance,strike=facts.AAOI.customerWarrant.exercisePrice;
  const rawPerShare=equityBeforeWarrants/shares>strike?(equityBeforeWarrants+warrants*strike)/(shares+warrants):equityBeforeWarrants/shares;
  return {...op,shares,cash,equityBeforeWarrants,warrantClaim:equityBeforeWarrants-rawPerShare*shares,equity:rawPerShare*shares,rawPerShare,perShare:Math.max(0,rawPerShare)};
 }
 const g=facts.GOOG;shares=g.periodEndCommonShares;asset=c.noncurrentInvestmentValue;
 claim=g.financeLeaseLiability+c.noncontrollingClaim+g.currentMarketableEquityAlreadyInCash*c.currentEquityHaircut;
 if(c.method==='if-converted'){
  shares+=c.conversionCase==='maximum'?g.totalMaximumCommonShares:g.totalMinimumCommonShares;
  pv=dividendDates.reduce((sum,date,i)=>sum+g.preferredShares*(i?15.625:g.firstDividendPerPreferred)/(1+c.dividendDiscountRate)**((Date.parse(date)-Date.parse(g.periodEnd))/(86400000*365.25)),0);claim+=pv;
 }else claim+=g.aggregateLiquidationPreference+g.accruedPreferredDividends;
 const equity=op.enterprise+cash+a.otherAssets+asset-snapshot.debt-a.otherClaims-claim;
 return {...op,shares,cash,equity,rawPerShare:equity/shares,perShare:Math.max(0,equity/shares),dividendPV:pv};
}
function matchesOracle(snapshot,draft,a=draft.assumptions){
 const result=calculateCurrent(snapshot,{...draft,assumptions:a}),expected=oracle(snapshot,draft,a);
 for(const k of ['enterprise','forecastPV','terminalPV','terminalNopat','terminalReinvestment','equity','rawPerShare','perShare'])near(result[k],expected[k],snapshot.ticker+' '+k);
 near(result.claimsBridge.allocationShares,expected.shares,'allocation shares');near(result.claimsBridge.cash,expected.cash,'capital cash');
 return {result,expected};
}

test('special claims: exact original-filing facts distinguish book, principal, market value and conversion units',()=>{
 for(const id of variants){const {snapshot}=pairing(id.split('-')[0],id),d=claimsDefinition(snapshot);assert.ok(d);assert.equal(d.sourceUrl,id.startsWith('AAOI')?facts.AAOI[snapshot.periodEnd].sourceUrl:facts.GOOG.sourceUrl);assert.equal(d.filedAt,id.startsWith('AAOI')?facts.AAOI[snapshot.periodEnd].filedAt:facts.GOOG.filedAt);
  if(snapshot.ticker==='AAOI'){const f=facts.AAOI[snapshot.periodEnd];for(const [key,expected]of Object.entries({commonShares:f.periodEndCommonShares,mappedDebt:f.bankDebt,vendorFinancing:f.bankAcceptancePayable,convertiblePrincipal:f.notePrincipal,convertibleCarrying:f.noteCarryingAmount,convertibleFairValue:f.noteFairValue,conversionRate:facts.AAOI.noteTerms.sharesPerThousandPrincipal}))near(d[key],expected,key);}
  else{const g=facts.GOOG;near(d.preferredShares,g.depositaryShares/g.depositarySharesPerPreferred);near(d.preferredPrincipal,g.aggregateLiquidationPreference);near(d.preferredCarrying,g.netPreferredIssuanceProceeds-g.cappedCallPremiumPaid);near(d.conversionShares.minimum,g.seriesA.preferredShares*g.seriesA.minimumRate+g.seriesB.preferredShares*g.seriesB.minimumRate);near(d.conversionShares.maximum,g.seriesA.preferredShares*g.seriesA.maximumRate+g.seriesB.preferredShares*g.seriesB.maximumRate);near(d.noncurrentInvestments,g.noncurrentMarketableEquity+g.nonmarketableInvestments);near(d.noncontrollingInterest,g.noncontrollingInterestsIncludingRedeemable);near(d.financeLeases,g.financeLeaseLiability);}
 }
});

test('special claims: changed source/capital/currency or imported copies cannot inherit reviewed terms',()=>{
 for(const ticker of ['AAOI','GOOG']){const {company,raw,snapshot,draft}=pairing(ticker);
  for(const patch of [{sourceUrl:'https://example.com/replacement'},{cash:snapshot.cash+1},{debt:snapshot.debt+1},{shares:snapshot.shares+1},{currency:'EUR'},{researchImported:true},{raw:{...raw,researchImported:true}}]){const altered={...snapshot,...patch};assert.equal(claimsDefinition(altered),null);assert.ok(claimsIssues(altered,draft).length);assert.throws(()=>calculateCurrent(altered,draft));}
  const imported=currentSnapshot({...company,researchImported:true},raw);assert.equal(claimsDefinition(imported),null);assert.throws(()=>calculateCurrent(imported,draft));
 }
});

test('special claims: missing, wrong-company, malformed and unsupported inputs fail despite review flags',()=>{
 for(const ticker of ['AAOI','GOOG']){const {snapshot,draft}=pairing(ticker);const wrong=pairing(ticker==='AAOI'?'GOOG':'AAOI').draft.claims;
  for(const claims of [undefined,null,[],42,{},wrong,{...draft.claims,schemaVersion:0},{...draft.claims,method:'ignore-claims'},{...draft.claims,skip:true}]){
   const bad={...draft,claims,bridgeReviewed:true,modelReviewed:true};assert.ok(currentIssues(snapshot,bad).length);assert.throws(()=>calculateCurrent(snapshot,bad));assert.throws(()=>simulateCurrent(snapshot,bad,{trials:3}));
  }
 }
});

test('special claims: legacy-draft migration preserves all operating work and invalid existing claims stay invalid',()=>{
 for(const ticker of ['AAOI','GOOG']){const {company,raw,snapshot,draft}=pairing(ticker),old=structuredClone(draft);delete old.claims;old.assumptions.growth=.171;old.notes.growth='Independent saved thesis';old.quote.price=123;
  const restored=safeDraft(old,company,raw,{baseCases:cases});assert.deepEqual(restored.claims,claimsDefaults(snapshot));assert.deepEqual(restored.assumptions,old.assumptions);assert.deepEqual(restored.notes,old.notes);assert.deepEqual(restored.quote,old.quote);
  for(const invalid of [null,17,[],{...draft.claims,modelId:'wrong-model'},{...draft.claims,method:'ignore'}]){const kept=safeDraft({...old,claims:invalid},company,raw,{baseCases:cases});assert.throws(()=>calculateCurrent(snapshot,kept));}
  const edited=structuredClone(draft);if(ticker==='AAOI')edited.claims.noteFairValue=500;else edited.claims.dividendDiscountRate=.12;
  const loaded=loadResearchedBaseCase(edited,company,raw,cases);assert.deepEqual(loaded.claims,edited.claims);assert.deepEqual(safeDraft(edited,company,raw,{baseCases:cases}).claims,edited.claims);
 }
});

test('special claims: AAOI default fair-value bridge subtracts the whole note once with no note shares or coupon deduction',()=>{
 for(const id of variants.filter(x=>x.startsWith('AAOI'))){const {snapshot,draft}=pairing('AAOI',id),{result,expected}=matchesOracle(snapshot,draft),f=facts.AAOI[snapshot.periodEnd];
  near(result.claimsBridge.allocationShares,f.periodEndCommonShares);near(result.claimsBridge.additionalClaims,f.bankAcceptancePayable+f.noteFairValue+expected.warrantClaim);assert.equal(result.claimsBridge.dividends.length,0);assert.ok(!result.claimsBridge.rows.some(r=>/conversion.*shares/i.test(r.label)));assert.match(result.claimsBridge.warnings.join(' '),/not.*live|observed claim proxy/);
 }
});

test('special claims: AAOI alternative note treatments remain mutually exclusive with warrant exercise proceeds correctly allocated',()=>{
 const {snapshot,draft}=pairing('AAOI');const a={...draft.assumptions,growth:.4,targetMargin:.5,salesCapital:10,wacc:.08};
 for(const method of ['fair-value','principal-only','if-converted'])for(const warrantCoverage of ['all','initially-vested'])for(const vendorFinancingFraction of [0,.5,1]){
  const d={...draft,claims:{...draft.claims,method,warrantCoverage,vendorFinancingFraction,warrantTimeValueReserve:3}}, {result,expected}=matchesOracle(snapshot,d,a);
  assert.ok(expected.warrantClaim>0,'synthetic strong operating case exercises warrants');near(result.claimsBridge.warrantClaim,expected.warrantClaim);near(result.claimsBridge.equityBeforeWarrants,expected.equityBeforeWarrants);
  const additional=method==='if-converted'?facts.AAOI['2026-06-30'].notePrincipal*facts.AAOI.noteTerms.sharesPerThousandPrincipal/1000:0;near(result.claimsBridge.allocationShares,facts.AAOI['2026-06-30'].periodEndCommonShares+additional);
  if(method==='if-converted')assert.ok(!result.claimsBridge.rows.some(r=>/Convertible .*claim/.test(r.label)));else assert.ok(!result.claimsBridge.rows.some(r=>/conversion.*shares/i.test(r.label)));
  // The equivalent claim subtraction must equal explicit exercise cash + dilution.
  near(result.rawPerShare,(expected.equityBeforeWarrants+result.claimsBridge.exerciseCash)/(expected.shares+result.claimsBridge.exerciseShares));
 }
});

test('special claims: AAOI preserved legacy linear stress remains negative before the disclosed common-equity floor',()=>{
 const {company,raw,snapshot}=pairing('AAOI'),fresh=draftFor(company,raw,{baseCases:cases}),draft={...fresh,operatingProfile:{schemaVersion:1,id:'linear-v1'},assumptions:{...fresh.assumptions,salesCapital:.8},cutoff:universe.asOf},{result,expected}=matchesOracle(snapshot,draft);
 assert.ok(expected.enterprise<0);assert.ok(result.enterprise<0);assert.ok(result.rawPerShare<0);assert.equal(result.perShare,0);assert.equal(result.rows.filter(r=>r.fcff<0).length,9);assert.equal(result.claimsBridge.warrantClaim,0);assert.match(result.claimsBridge.warnings.join(' '),/financing|funding/);
});

test('special claims: AAOI known transactions keep cash and shares together and cannot appear before their source date',()=>{
 const {snapshot,draft}=pairing('AAOI'),d={...draft,claims:{...draft.claims,capitalBasis:'known-transactions',interimCashChange:-100}},{result}=matchesOracle(snapshot,d);
 near(result.claimsBridge.cash,499.737+587.99998589-26.783472-100);near(result.claimsBridge.allocationShares,84.906289+5.694845);assert.match(result.claimsBridge.warnings.join(' '),/not observed current|not actual current/);
 assert.throws(()=>calculateCurrent(snapshot,{...d,cutoff:'2026-10-04'}),/October 5/);assert.throws(()=>calculateCurrent(snapshot,{...d,claims:{...d.claims,interimCashChange:-2000}}),/cash cannot be negative/);
 const old=pairing('AAOI','AAOI-CURRENT-2025-12-31');assert.throws(()=>calculateCurrent(old.snapshot,{...old.draft,claims:{...old.draft.claims,capitalBasis:'known-transactions'}}),/capital basis/);
});

test('special claims: Alphabet exact dividend dates/amounts and dated PV are independent of WACC and the quote',()=>{
 const {snapshot,draft}=pairing('GOOG'),definition=claimsDefinition(snapshot),schedule=preferredDividendSchedule(definition);assert.deepEqual(schedule.map(x=>x.date),dividendDates);near(schedule[0].amount,facts.GOOG.preferredShares*facts.GOOG.firstDividendPerPreferred);for(const x of schedule.slice(1))near(x.amount,19250*.0625/4);
 for(const dividendDiscountRate of [0,.0625,.12]){const d={...draft,claims:{...draft.claims,dividendDiscountRate}},{result,expected}=matchesOracle(snapshot,d);near(result.claimsBridge.dividends.reduce((sum,x)=>sum+x.presentValue,0),expected.dividendPV);assert.equal(result.claimsBridge.dividends.length,12);assert.ok(result.claimsBridge.dividends.every(x=>x.date<=facts.GOOG.mandatoryConversionDate));}
 const v=calculateCurrent(snapshot,draft),other=calculateCurrent(snapshot,{...draft,assumptions:{...draft.assumptions,wacc:.15}});assert.deepEqual(v.claimsBridge.dividends,other.claimsBridge.dividends);
});

test('special claims: Alphabet min/max dilution, liquidation and investment/NCI adjustments do not double count',()=>{
 const {snapshot,draft}=pairing('GOOG');
 for(const method of ['if-converted','liquidation-proxy'])for(const conversionCase of ['minimum','maximum'])for(const currentEquityHaircut of [0,.25,1]){
  const d={...draft,claims:{...draft.claims,method,conversionCase,currentEquityHaircut}},{result}=matchesOracle(snapshot,d),b=result.claimsBridge;
  near(b.additionalAssets,145587);near(b.commonShares,12230);assert.ok(!b.rows.some(r=>/capped.call.*premium/i.test(r.label)));assert.ok(!b.rows.some(r=>/redeemable.*interest/i.test(r.label)),'RNCI is already in total NCI');
  if(method==='if-converted'){assert.ok(!b.rows.some(r=>/liquidation|principal proxy/i.test(r.label)));assert.equal(b.dividends.length,12);}else{near(b.allocationShares,12230);assert.equal(b.dividends.length,0);}
 }
});

test('special claims: all active approximations are disclosed, including fixed future-conversion endpoints and stale claim observations',()=>{
 for(const ticker of ['AAOI','GOOG']){const {snapshot,draft}=pairing(ticker),result=calculateCurrent(snapshot,draft),warnings=result.claimsBridge.warnings.join(' ');assert.match(result.claimsBridge.classification,/approximation/);assert.match(warnings,/Employee|employee/);
  if(ticker==='AAOI'){assert.match(warnings,/time value/);assert.match(warnings,/not.*live|observed claim proxy/);}
  else{assert.match(warnings,/pre-conversion (?:common )?cash flows/);assert.match(warnings,/20-trading-day/);assert.match(warnings,/endpoint.*fixed/);assert.match(warnings,/Capped-call value is set to zero/);assert.match(warnings,/carrying-value proxy/);}
 }
});

test('special claims: every simulated draw matches the independent operating-plus-claims oracle in every treatment',()=>{
 let checked=0,exercised=0,unexercised=0;
 for(const ticker of ['AAOI','GOOG']){const {snapshot,draft}=pairing(ticker);for(const method of ticker==='AAOI'?['fair-value','principal-only','if-converted']:['if-converted','liquidation-proxy']){
  const d={...draft,claims:{...draft.claims,method}},config={trials:97,seed:'independent-special-'+ticker+method,drivers:{growth:{type:'uniform',low:-.1,high:.8},targetMargin:{type:'uniform',low:.01,high:.6},salesCapital:{type:'uniform',low:.5,high:8},wacc:{type:'uniform',low:.06,high:.2}}},sim=simulateCurrent(snapshot,d,config);
  assert.equal(sim.accepted,97);assert.equal(sim.excluded,0);
  for(const trial of sim.scenarios){const a={...d.assumptions,...Object.fromEntries(['growth','targetMargin','salesCapital','wacc'].map(k=>[k,trial[k]]))},expected=oracle(snapshot,d,a);near(trial.perShare,expected.perShare,ticker+' scenario per share');near(trial.rawPerShare,expected.rawPerShare,ticker+' scenario raw');assert.equal(trial.claims.method,method);near(trial.claims.allocationShares,expected.shares);if(ticker==='AAOI'){near(trial.claims.warrantClaim,expected.warrantClaim);if(expected.warrantClaim>1e-8)exercised++;else unexercised++;}checked++;}
  assert.deepEqual(sim.draws,sim.scenarios.map(x=>x.perShare));assert.deepEqual(sim.samples,[...sim.draws].sort((a,b)=>a-b));assert.deepEqual(simulateCurrent(snapshot,d,config),sim);
 }}assert.equal(checked,485);assert.ok(exercised>0&&unexercised>0,'per-draw endogenous warrant branch must cross exercise threshold');
});

test('special claims: fixed Monte Carlo reproduces the displayed value and quote changes cannot change claim values',()=>{
 for(const ticker of ['AAOI','GOOG']){const {snapshot,draft}=pairing(ticker),base=calculateCurrent(snapshot,draft),config={trials:5,seed:'fixed-claims'},sim=simulateCurrent(snapshot,draft,config);assert.equal(sim.accepted,5);for(const v of sim.draws)near(v,base.perShare);
  const priced={...draft,quote:{price:100,date:'2026-10-16',currency:'USD',sourceUrl:'https://example.com/synthetic-test-quote',shareBasis:currentEconomicShareBasis(snapshot,draft)}};
  assert.deepEqual(calculateCurrent(snapshot,priced),base);assert.deepEqual(simulateCurrent(snapshot,priced,config).draws,sim.draws);assert.equal(quoteComparison(snapshot,priced,base).status,'ready');
  for(const patch of [{shareBasis:snapshot.shareBasis},{currency:'EUR'},{date:'2026-10-18'},{sourceUrl:''}])assert.equal(quoteComparison(snapshot,{...priced,quote:{...priced.quote,...patch}},base).status,'blocked');
  assert.equal(draft.quote.price,null);assert.equal(sim.quote.status,'missing');
 }
});

test('special claims: evidence, inputs and immutable exports cannot be mutated by calculations or sensitivities',()=>{
 for(const ticker of ['AAOI','GOOG']){const {snapshot,draft}=pairing(ticker),before=JSON.stringify({snapshot,draft}),definition=claimsDefinition(snapshot),saved=structuredClone(definition);definition.sources[0].title='Changed caller copy';assert.deepEqual(claimsDefinition(snapshot),saved);
  calculateCurrent(snapshot,draft);simulateCurrent(snapshot,draft,{trials:3});assert.ok(claimsSensitivity(snapshot,draft).length>=5);assert.equal(JSON.stringify({snapshot,draft}),before);
  const frozen=freezeCurrent(snapshot,draft),old=JSON.stringify(frozen);draft.claims.method='changed-after-freeze';snapshot.raw.facts.cash=-1;assert.equal(JSON.stringify(frozen),old);assert.ok(frozen.result.claimsBridge);assert.deepEqual(frozen.draft.claims,frozen.result.claimsBridge.inputs);
 }
});

test('special operating path: fresh researched AAOI uses the disclosed staged ramp and exact terminal cash-flow transition',()=>{
 const {company,raw,snapshot}=pairing('AAOI'),draft={...draftFor(company,raw,{baseCases:cases}),cutoff:universe.asOf};assert.equal(draft.operatingProfile?.id,'aaoi-capacity-ramp-v1');const {result,expected}=matchesOracle(snapshot,draft);
 near(result.enterprise,-320.9030677269786,'independent staged operating EV');near(result.equity,-359.1210677269786,'staged residual common equity');assert.equal(result.perShare,0);assert.equal(result.rows.filter(r=>r.fcff<0).length,5);assert.equal(result.operatingProfile.annualPath.length,10);
 const annual=result.operatingProfile.annualPath;for(const [i,rate]of [.6,.4,.3,.2,.15,.1,.08,.05,.03,.025].entries())near(annual[i].growth,rate,'staged growth year '+(i+1));for(const [i,margin]of [-.05,0,.05,.08,.1,.12,.12,.12,.12,.12].entries())near(annual[i].margin,margin,'staged margin year '+(i+1));for(const [i,capital]of [.8,.8,1,1.2,1.4,1.6,1.6].entries())near(annual[i].salesCapital,capital,'staged capital year '+(i+1));
 const a=draft.assumptions,terminalCapitalIntensity=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;near(1/annual.at(-1).salesCapital,terminalCapitalIntensity);near(result.rows.at(-1).fcff*(1+a.terminalGrowth),result.terminalNopat-result.terminalReinvestment,'terminal FCFF continuity');near(expected.rows.at(-1).fcff,result.rows.at(-1).fcff);
 assert.ok(!('yearlyOverrides'in result.assumptions),'simulation must receive sampled scalar inputs rather than stale annual arrays');assert.equal(draft.assumptions.salesCapital,.8,'initial productivity meaning is retained');
});

test('special operating path: absence of optional research and restored legacy drafts retain their original linear economics',()=>{
 const {company,raw,snapshot,draft}=pairing('AAOI');assert.equal(draft.operatingProfile,undefined);
 const old={...draft,assumptions:{...cases.companies.AAOI.assumptions,salesCapital:.8},assumptionProvenance:{...draft.assumptionProvenance,kind:'user-draft'}};delete old.operatingProfile;
 const restored=safeDraft(old,company,raw,{baseCases:cases});assert.equal(restored.operatingProfile,undefined);assert.deepEqual(restored.assumptions,old.assumptions);assert.deepEqual(calculateCurrent(snapshot,restored),calculateCurrent(snapshot,old));assert.equal(calculateCurrent(snapshot,restored).rows.filter(r=>r.fcff<0).length,9);
 const explicit=loadResearchedBaseCase(restored,company,raw,cases);assert.equal(explicit.operatingProfile.id,'aaoi-capacity-ramp-v1');assert.equal(calculateCurrent(snapshot,explicit).rows.filter(r=>r.fcff<0).length,5);
 // A claim or operating-profile change cannot be mistaken for proof that the
 // whole saved generic draft was untouched, even without a UI edit marker.
 const changed={...draft,claims:{...draft.claims,noteFairValue:500}},kept=safeDraft(changed,company,raw,{baseCases:cases});assert.deepEqual(kept.assumptions,changed.assumptions);assert.equal(kept.operatingProfile,undefined);assert.equal(kept.claims.noteFairValue,500);
});

test('special operating path: staged selection fails closed for wrong baseline/date, malformed profiles, duplicate overrides and zero mature margin',()=>{
 const {company,raw,snapshot}=pairing('AAOI'),draft={...draftFor(company,raw,{baseCases:cases}),cutoff:universe.asOf};
 for(const operatingProfile of [null,{},[],42,{schemaVersion:0,id:'aaoi-capacity-ramp-v1'},{schemaVersion:1,id:'unknown'},{schemaVersion:1,id:'aaoi-capacity-ramp-v1',skip:true}])assert.throws(()=>calculateCurrent(snapshot,{...draft,operatingProfile}));
 assert.throws(()=>calculateCurrent(snapshot,{...draft,cutoff:'2026-10-16'}),/October 17|after the valuation date/);
 for(const assumptions of [{...draft.assumptions,years:9},{...draft.assumptions,targetMargin:0},{...draft.assumptions,yearlyOverrides:Array(10).fill({growth:.1,margin:.1,taxRate:.25,salesCapital:2,wacc:.1})}])assert.throws(()=>calculateCurrent(snapshot,{...draft,assumptions}));
 const annual=pairing('AAOI','AAOI-CURRENT-2025-12-31'),goog=pairing('GOOG');for(const p of [annual,goog])assert.throws(()=>calculateCurrent(p.snapshot,{...p.draft,operatingProfile:draft.operatingProfile}),/exact source|staged AAOI/);
});

test('special operating path: every staged Monte Carlo draw rebuilds its growth, margin, capital intensity and claims consistently',()=>{
 const {company,raw,snapshot}=pairing('AAOI'),draft={...draftFor(company,raw,{baseCases:cases}),cutoff:universe.asOf};const config={trials:151,seed:'independent-staged-AAOI',drivers:{growth:{type:'uniform',low:-.2,high:.9},targetMargin:{type:'uniform',low:.01,high:.6},salesCapital:{type:'uniform',low:.4,high:4},wacc:{type:'uniform',low:.06,high:.2}}};
 let positive=0,zero=0;
 for(const method of ['fair-value','if-converted']){const d={...draft,claims:{...draft.claims,method}},sim=simulateCurrent(snapshot,d,config);assert.equal(sim.accepted,151);assert.equal(sim.excluded,0);
  for(const trial of sim.scenarios){const a={...d.assumptions,...Object.fromEntries(['growth','targetMargin','salesCapital','wacc'].map(k=>[k,trial[k]]))},expected=oracle(snapshot,d,a),actual=calculateCurrent(snapshot,{...d,assumptions:a});near(trial.rawPerShare,expected.rawPerShare,'staged simulated raw');near(trial.perShare,expected.perShare,'staged simulated per share');near(actual.enterprise,expected.enterprise,'staged draw EV');near(actual.rows.at(-1).fcff*(1+a.terminalGrowth),actual.terminalNopat-actual.terminalReinvestment,'staged draw terminal continuity');if(trial.perShare>0)positive++;else zero++;}
  assert.deepEqual(simulateCurrent(snapshot,d,config),sim);
 }
 assert.ok(positive>0&&zero>0,'staged distribution must retain both upside and zero-residual states rather than force a price target');
});

test('special operating path: invalid zero-margin draws are excluded without replacement and a zero-margin baseline is withheld',()=>{
 const {company,raw,snapshot}=pairing('AAOI'),draft={...draftFor(company,raw,{baseCases:cases}),cutoff:universe.asOf};
 const sim=simulateCurrent(snapshot,draft,{trials:11,seed:'zero-staged-margin',drivers:{targetMargin:{type:'fixed',value:0}}});
 assert.equal(sim.accepted,0);assert.equal(sim.excluded,11);assert.equal(sim.status,'empty');assert.deepEqual(sim.exclusions,{'valuation-rejected':11});assert.deepEqual(sim.scenarios,[]);assert.deepEqual(sim.draws,[]);
 assert.throws(()=>simulateCurrent(snapshot,{...draft,assumptions:{...draft.assumptions,targetMargin:0}},{trials:11}),/positive mature margin/);
});
