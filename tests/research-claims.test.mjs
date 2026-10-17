// Independent audit of source-dated allocation arithmetic and missing-data gates.
// Source records and old snapshots are evidence, never asserted current fair values.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchBridgeDefinition,researchBridgeDefinitions,researchBridgeOptionDefinitions,calculateResearchBridge,researchPreferredDividendSchedule,researchBridgeSensitivity} from '../dist/research-claims.js';
const json=p=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+p,import.meta.url)));
const cases=json('renewed-research-2026-10-17/cases.json').companies;
const evidence=json('renewed-research-2026-10-17/evidence.json').companies;
const registers=json('renewed-research-2026-10-17/claims.json').companies;
const corrections=json('renewed-research-2026-10-17/corrections.json').corrections;
const snapshots=json('current-universe.json').companies;
const c=t=>cases.find(x=>x.ticker===t),e=t=>evidence.find(x=>x.ticker===t),f=t=>e(t).facts;
const reg=t=>registers.find(x=>x.ticker===t).registers;
const amount=(t,id)=>reg(t).claim_and_obligation_register.find(x=>x.id===id).amount;
const obligation=(t,id)=>reg(t).obligationAssetRegister.items.find(x=>x.id===id).amount;
const row=(r,id)=>r.rows.find(x=>x.id===id);
const close=(a,b,label='')=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*2e-12,label+': '+a+' != '+b);};
const sourceCase=t=>({...c(t),discountOrigin:researchBridgeDefinition(t).referenceDate});
const amazonEquity=e('AMZN').supplementalEvidence['capital-funding-reconciliation'].companyReconciliation.reported_and_derived_USDm.June_current_marketable_equity_included;
const defaultOptions=t=>t==='LITE'?{convertiblePremiumClaim:0}:{};
const evaluate=(t,ev=100000,options={})=>calculateResearchBridge(sourceCase(t),ev,{...defaultOptions(t),...options});
const expectedFixedLines={
 AAPL:{longSecurities:reg('AAPL').claims.noncurrentMarketableSecurities},
 MSFT:{longInvestments:reg('MSFT').claims.longTermInvestmentsCarrying,financeLeases:reg('MSFT').claims.financeLeaseLiabilities},
 AMZN:{currentEquity:amazonEquity,privateEquity:amount('AMZN','Anthropic_preferred_carrying')+amount('AMZN','OpenAI_preferred_June')+amount('AMZN','other_nonmarketable_equity_residual'),anthropicNotes:amount('AMZN','Anthropic_convertible_notes_fair_value'),equityMethod:amount('AMZN','equity_method_other_investments'),investmentWarrants:amount('AMZN','equity_warrants'),financeLeases:amount('AMZN','finance_leases'),otherFinancing:amount('AMZN','recognized_other_financing_obligations')},
 GOOG:{financeLeases:amount('GOOG','finance_leases')},
 META:{privateEquity:f('META').balanceAndCommitments2026Q2.nonmarketableEquityInvestments},
 NVDA:{strategicEquity:f('NVDA').claimsAndAssets.nonmarketableEquity+f('NVDA').claimsAndAssets.marketableEquitySecurities,equityMethod:f('NVDA').claimsAndAssets.equityMethodInvestments,groqConsideration:f('NVDA').claimsAndAssets.accruedGroqLicensePurchaseConsideration},
 TSLA:{financeLeases:f('TSLA').balanceAndClaims.currentFinanceLeases+f('TSLA').balanceAndClaims.longTermFinanceLeases,spaceX:f('TSLA').balanceAndClaims.SpaceXInvestmentCarrying,digitalAssets:f('TSLA').balanceAndClaims.digitalAssets,nci:f('TSLA').balanceAndClaims.noncontrollingInterest+f('TSLA').balanceAndClaims.redeemableNoncontrollingInterest},
 COHR:{financeLeases:f('COHR').balanceSheet.financeLeaseLiabilities,nci:f('COHR').balanceSheet.noncontrollingInterestBook},
 LITE:{},AAOI:{vendorFinancing:f('AAOI').claims.vendorBankAcceptances},NBIS:{},
 MU:{longSecurities:f('MU').latestAnnual.marketableSecuritiesNoncurrent,privateEquity:f('MU').latestAnnual.nonmarketableEquityInvestments},
 AVGO:{},TSM:{nci:f('TSM').claims.noncontrollingInterestQ3}
};

test('claims definitions: exactly 14 complete source identities; definition reads cannot mutate global state',()=>{
 const definitions=researchBridgeDefinitions();assert.equal(definitions.length,14);assert.deepEqual(definitions.map(x=>x.ticker).sort(),cases.map(x=>x.ticker).sort());
 for(const d of definitions){assert.equal(d.informationAsOf,'2026-10-17');assert.equal(d.moneyUnit,'millions');assert.equal(d.shareUnit,'millions');assert.equal(d.claimCompleteness,'partial');assert.ok(d.unresolved.length);assert.match(d.sourceUrl,/^https:\/\//);}
 definitions[0].cash=0;definitions[0].lines[0].amount=0;
 assert.notEqual(researchBridgeDefinition('AAPL').cash,0);assert.notEqual(researchBridgeDefinition('AAPL').lines[0].amount,0);
 assert.equal(researchBridgeDefinition('INVALID'),null);assert.deepEqual(researchBridgeOptionDefinitions('INVALID'),[]);
});

for(const company of cases)test(`claims source audit: ${company.ticker} cash, debt, shares, dated sources and fixed allocations`,()=>{
 const ticker=company.ticker,d=researchBridgeDefinition(ticker),old=snapshots.find(x=>x.ticker===ticker),snapshot=old.snapshots.find(x=>x.id===old.currentSnapshotId),s=snapshot.facts;
 const cash=ticker==='AMZN'?s.cash-amazonEquity:s.cash;
 const debt=ticker==='TSLA'?f('TSLA').balanceAndClaims.currentDebtCarrying+f('TSLA').balanceAndClaims.longTermDebtCarrying:ticker==='LITE'?obligation('LITE','LITE-converts')+obligation('LITE','LITE-term'):s.debt;
 const shares=ticker==='NBIS'?f('NBIS').balanceSheet.commonTotal+f('NBIS').balanceSheet.preFundedWarrantShares:s.periodEndShares??s.shares;
 close(d.cash,cash,ticker+' cash');close(d.debt,debt,ticker+' debt');close(d.shares,shares,ticker+' shares');
 assert.equal(d.referenceDate,snapshot.periodEnd);assert.equal(d.sourceUrl,snapshot.sourceUrl||snapshot.sourceURL);assert.equal(d.currency,company.currency);
 assert.deepEqual(d.lines.map(x=>x.id).sort(),Object.keys(expectedFixedLines[ticker]).sort());
 for(const [id,value] of Object.entries(expectedFixedLines[ticker]))close(d.lines.find(x=>x.id===id).amount,value,ticker+' '+id);
 const before=JSON.stringify(company),result=calculateResearchBridge(company,123456);
 assert.equal(JSON.stringify(company),before);assert.equal(result.informationAsOf,'2026-10-17');
 assert.equal(result.capitalReferenceDate,d.referenceDate);assert.equal(result.shareReferenceDate,d.shareDate);assert.equal(result.discountOrigin,company.valuationTiming.discountOrigin);
 if(['AAOI','NBIS','LITE'].includes(ticker)){assert.equal(result.status,'operating-only');assert.equal(result.eligible,false);for(const key of ['equity','perShare','rawPerShare','flooredPerShare'])assert.equal(result[key],null);assert.ok(result.requiredInputs.length);}
 else{assert.equal(result.status,'conditional');assert.equal(result.currentCapitalVerified,false);assert.equal(result.priceComparisonEligible,false);assert.equal(result.claimCompleteness,'partial');assert.ok(result.unresolved.length);}
});

test('claims oracle: independently sum signed assets/claims and common allocations, never floor economic equity',()=>{
 for(const company of cases){
  const ticker=company.ticker;if(ticker==='NBIS')continue;
  for(const ev of [100000,-1000000000]){
   const result=evaluate(ticker,ev);
   const assets=result.rows.filter(r=>r.kind==='asset').reduce((s,r)=>s+r.amount,0);
   const claims=result.rows.filter(r=>r.kind==='claim').reduce((s,r)=>s+r.amount,0);
   const shares=result.basicShares+result.rows.filter(r=>r.kind==='shares').reduce((s,r)=>s+r.amount,0);
   close(result.equity,ev+assets-claims,ticker);close(result.allocationShares,shares,ticker);close(result.rawPerShare,(ev+assets-claims)/shares,ticker);close(result.perShare,result.rawPerShare);
   close(result.assetTotal,assets);close(result.claimTotal,claims);close(result.flooredPerShare,Math.max(0,result.rawPerShare));
   assert.equal(new Set(result.rows.map(r=>r.id)).size,result.rows.length,ticker+' no duplicate claim ID');
   if(ev<0){assert.ok(result.equity<0);assert.ok(result.rawPerShare<0);assert.equal(result.flooredPerShare,0);}
   for(const r of result.rows){assert.ok(Number.isFinite(r.amount));assert.ok(r.amount>=0);assert.ok(r.classification);assert.match(r.sourceUrl,/^https:\/\//);assert.match(r.referenceDate,/^\d{4}-\d{2}-\d{2}$/);}
  }
 }
});

test('source-date references: changed operating/share dates disclose mismatch and never assert current capital',()=>{
 for(const ticker of cases.map(c=>c.ticker).filter(t=>t!=='NBIS')){
  const d=researchBridgeDefinition(ticker),r=evaluate(ticker,123456,{calculationDate:'2026-10-17'});
  assert.equal(r.basisMismatch,true);assert.equal(r.calculationDate,'2026-10-17');assert.equal(r.currentCapitalVerified,false);assert.equal(r.priceComparisonEligible,false);assert.match(r.warnings.join(' '),/No current cash\/debt\/share roll-forward/);
  const original=evaluate(ticker);assert.equal(original.basisMismatch,d.shareDate!==d.referenceDate);
 }
 for(const ticker of ['META','NVDA','COHR'])assert.notEqual(researchBridgeDefinition(ticker).shareDate,researchBridgeDefinition(ticker).referenceDate);
});

test('TSLA correction: 1,340 current plus 7,721 noncurrent funded debt, with 281 leases deducted exactly once',()=>{
 const source=corrections.find(x=>x.ticker==='TSLA'&&x.periodEnd==='2026-06-30'),r=evaluate('TSLA'),s=r.sourceCorrection;
 close(row(r,'fundedDebt').amount,source.currentDebtCarryingValue+source.noncurrentDebtCarryingValue);
 close(row(r,'financeLeases').amount,source.currentFinanceLeaseLiability+source.noncurrentFinanceLeaseLiability);
 close(row(r,'fundedDebt').amount+row(r,'financeLeases').amount,9342);
 assert.equal(s.oldMappedDebt,7721);assert.equal(s.correctedFundedDebt,9061);assert.equal(s.totalDebtAndFinanceLeases,9342);
 close(r.equity,100000+43524+3007+674-9061-281-661);
 assert.ok(!r.rows.some(x=>/funding|2018|interim|offset/i.test(x.id)));
 const diluted=evaluate('TSLA',100000,{ceoGrossDilutionShares:423.743904});close(diluted.equity,r.equity);close(diluted.allocationShares,3949+423.743904);assert.match(diluted.warnings.join(' '),/offset/);
});

test('MU: deposits and existing tax are explicit claims; financing leases already inside 5,179 debt',()=>{
 const r=evaluate('MU'),a=f('MU').latestAnnual;
 assert.equal(row(r,'customerDepositClaim').amount,12747);assert.equal(row(r,'taxPayableClaim').amount,9820);
 close(row(r,'fundedDebt').amount,a.longTermDebtTotal+a.financeLeaseLiabilityTotal);assert.equal(row(r,'fundedDebt').amount,5179);
 assert.equal(row(r,'financeLeases'),undefined);assert.equal(row(r,'customerDepositClaim').amount,a.customerDepositsReceivedFinancing);assert.equal(row(r,'taxPayableClaim').amount,a.noncurrentIncomeTaxPayable);
 close(r.equity,100000+43434+30019+1300-5179-12747-9820);
 assert.match(r.warnings.join(' '),/2029.2031/);assert.match(r.warnings.join(' '),/not already in supplied operating FCFF/);
 const zero=evaluate('MU',100000,{customerDepositClaim:0,taxPayableClaim:0});close(zero.equity-r.equity,12747+9820);
 for(const id of ['customerDepositClaim','taxPayableClaim'])assert.match(row(zero,id).classification,/explicit analytical scenario/);
 assert.throws(()=>evaluate('MU',100000,{customerDepositClaim:12748}));
});

test('GOOG preferred schedule: independent exact 12 cash dividends, source endpoints, and mutually exclusive claim methods',()=>{
 const dates=['2026-08-15','2026-11-15','2027-02-15','2027-05-15','2027-08-15','2027-11-15','2028-02-15','2028-05-15','2028-08-15','2028-11-15','2029-02-15','2029-05-15'];
 const independent=dates.map((date,i)=>{const amount=i===0?19.25*12.15:19250*.0625/4;return{date,amount,presentValue:amount/(1.0625**((Date.parse(date)-Date.parse('2026-06-30'))/(365.25*86400000)))}});
 const actual=researchPreferredDividendSchedule();assert.equal(actual.length,12);
 for(let i=0;i<12;i++){assert.equal(actual[i].date,independent[i].date);close(actual[i].amount,independent[i].amount);close(actual[i].presentValue,independent[i].presentValue);}
 const max=evaluate('GOOG'),min=evaluate('GOOG',100000,{conversionCase:'minimum'}),liquidation=evaluate('GOOG',100000,{preferredMethod:'liquidation-proxy'});
 close(max.allocationShares,amount('GOOG','common_dilution')+amount('GOOG','preferred_conversion_share_range')[1]);
 close(min.allocationShares,amount('GOOG','common_dilution')+amount('GOOG','preferred_conversion_share_range')[0]);
 close(row(max,'preferredDividendPV').amount,independent.reduce((s,x)=>s+x.presentValue,0));assert.equal(row(max,'preferredLiquidation'),undefined);
 assert.equal(row(liquidation,'preferredDividendPV'),undefined);assert.equal(row(liquidation,'preferredConversion'),undefined);assert.equal(liquidation.dividends.length,0);assert.equal(liquidation.allocationShares,12230);
 close(row(liquidation,'preferredLiquidation').amount,e('GOOG').supplementalEvidence['existing-current-claims-research'].recommendedBridge.alternativeModes[0].totalPreferredClaimProxy);
 close(max.equity,100000+242474+145587-100164-2590-7100-independent.reduce((s,x)=>s+x.presentValue,0));
 assert.ok(!max.rows.some(x=>x.amount===18023||x.amount===1011));
});

test('AAOI: December forecast gate survives any superficial zero inputs or share assumptions',()=>{
 for(const options of [{},{additionalClaimAllowance:0},{convertibleMethod:'principal-only'},{convertibleMethod:'if-converted',warrantTimeValueReserve:0},{calculationDate:'2026-10-17'}]){
  const r=calculateResearchBridge(c('AAOI'),10000,options);assert.equal(r.status,'operating-only');assert.equal(r.perShare,null);assert.match(r.reasons.join(' '),/December 31|2026 operating\/capital bridge/);
 }
 const native=evaluate('AAOI',10000),principal=evaluate('AAOI',10000,{convertibleMethod:'principal-only'}),converted=evaluate('AAOI',10000,{convertibleMethod:'if-converted'}),a=f('AAOI').claims;
 close(row(native,'convertibleNote').amount,a.convertibleFairValue);close(row(principal,'convertibleNote').amount,a.convertiblePrincipal);
 assert.equal(row(converted,'convertibleNote'),undefined);close(row(converted,'noteConversionShares').amount,a.convertibleUnadjustedConversionShares);
 close(converted.allocationShares,a.commonOutstanding+a.convertibleUnadjustedConversionShares);
 for(const r of [native,principal,converted]){
  const exWarrant=r.equity+r.warrantClaim,fullyDiluted=(exWarrant+a.warrantExercisePrice*a.warrantMaximumShares)/(r.allocationShares+a.warrantMaximumShares);
  close(r.warrantClaim,Math.max(0,fullyDiluted-a.warrantExercisePrice)*a.warrantMaximumShares);close(r.rawPerShare,(exWarrant-r.warrantClaim)/r.allocationShares);
 }
 assert.equal(evaluate('AAOI',-10000).warrantClaim,0);
});

test('NBIS: specialist funding bridge remains blocked at every date; pre-funded warrants count once',()=>{
 const d=researchBridgeDefinition('NBIS'),b=f('NBIS').balanceSheet;close(d.shares,b.commonTotal+b.preFundedWarrantShares);close(d.debt,b.convertibleCarryingValue+b.currentDebtLine);
 for(const company of [c('NBIS'),sourceCase('NBIS'),{...sourceCase('NBIS'),discountOrigin:'2026-10-17'}]){
  const r=calculateResearchBridge(company,10000,{additionalClaimAllowance:0,additionalDilutionShares:0});assert.equal(r.status,'operating-only');assert.equal(r.equity,null);assert.equal(r.perShare,null);assert.ok(r.requiredInputs.length>=4);assert.match(r.warnings.join(' '),/already included/);
 }
});

test('LITE: missing premium is null and blocks; explicitly entered zero is labeled principal-only stress',()=>{
 const field=researchBridgeOptionDefinitions('LITE').find(x=>x.key==='convertiblePremiumClaim');assert.equal(field.default,null);
 for(const options of [{},{convertiblePremiumClaim:null}]){const r=calculateResearchBridge(c('LITE'),10000,options);assert.equal(r.status,'operating-only');assert.equal(r.equity,null);assert.equal(r.perShare,null);}
 const zero=evaluate('LITE',10000),priced=evaluate('LITE',10000,{convertiblePremiumClaim:600});
 close(zero.allocationShares,88.6+f('LITE').balanceSheetAndClaims.preferredSharesApprox);close(row(zero,'fundedDebt').amount,1554.3+92.8);
 assert.match(zero.warnings.join(' '),/zero premium.*omission of option value/);close(priced.equity,zero.equity-600);assert.equal(row(zero,'convertiblePremiumClaim').amount,0);
 assert.ok(!zero.rows.some(x=>x.amount===2000||x.amount===757.8));assert.equal(row(zero,'noteConversionShares'),undefined);
});

test('TSM: output remains native TWD ordinary shares and stale liabilities retain old dates',()=>{
 const r=evaluate('TSM');assert.equal(r.currency,'TWD');assert.match(r.securityBasis,/TWD ordinary share/);assert.equal(r.allocationShares,25932);
 close(row(r,'cash').amount,f('TSM').latestTTM.cashAndEquivalents+f('TSM').latestTTM.marketableSecuritiesCurrent);
 close(row(r,'fundedDebt').amount,f('TSM').latestTTM.longTermDebtCurrent+f('TSM').latestTTM.longTermDebtNoncurrent);
 for(const id of ['legacyLeaseClaim','customerReceiptClaim']){assert.equal(row(r,id).referenceDate,'2025-12-31');assert.match(row(r,id).classification,/explicit analytical scenario/);}
 assert.equal(row(r,'nonoperatingInvestmentValue').amount,0);assert.match(r.warnings.join(' '),/missing|unquantified/);assert.match(r.warnings.join(' '),/carry-forward/);
 close(r.equity,100000+4016979-1031578-45326-35428-291101.8);
 assert.throws(()=>evaluate('TSM',100000,{outputCurrency:'USD'}),/No verified FX/);assert.throws(()=>evaluate('TSM',100000,{securityBasis:'ADS'}),/alternate-security mapping/);
});

test('AMZN: cash/equity split and recognized financing are counted once; no future funding deficits or commitments become debt',()=>{
 const r=evaluate('AMZN');close(row(r,'cash').amount+row(r,'currentEquity').amount,amount('AMZN','cash_and_current_marketables'));
 assert.equal(row(r,'otherFinancing').approximate,true);close(row(r,'otherFinancing').amount,415+8900);
 close(r.equity,100000+122988+122300+97900+395+4300-132224-13451-9315);
 assert.ok(!r.rows.some(x=>[21300,15000,10900,137214,130065,11070,572].includes(x.amount)));
});

test('META: legal settlement is a single independent discounted-payment assumption, not face debt',()=>{
 const r=evaluate('META'),expected=Array.from({length:10},(_,i)=>1270/(1.1**(i+1))).reduce((a,b)=>a+b,0);
 close(row(r,'legalSettlementPV').amount,expected);close(r.equity,100000+90260+30157-83664-expected);assert.ok(!r.rows.some(x=>x.amount===12700||x.amount===18000||x.amount===13809));
 const upper=evaluate('META',100000,{settlementAmount:18000});close(row(upper,'legalSettlementPV').amount,expected*18000/12700);
 assert.match(row(r,'legalSettlementPV').classification,/analytical payment schedule/);
});

test('missing amounts: unquantified AVGO leases remain unresolved, not fabricated zero source observations',()=>{
 const missing=reg('AVGO').unresolvedObligationAssetRegister.find(x=>x.id==='operating-finance-leases');assert.equal(missing.amount,null);
 const r=evaluate('AVGO');assert.equal(row(r,'financeLeases'),undefined);assert.match(r.warnings.join(' '),/additional finance-lease liabilities remain unquantified/);assert.equal(r.claimCompleteness,'partial');
 const tsm=f('TSM').claims;assert.equal(tsm.currentLeaseLiability,null);assert.equal(tsm.noncurrentLeaseLiability,null);
 for(const company of cases.filter(x=>!['NBIS','AAOI','LITE'].includes(x.ticker))){const result=calculateResearchBridge(company,100000);assert.match(result.warnings.join(' '),/Zero additional-claim allowance.*not verified absent/);}
});

test('options: explicit missing, strings, infinities and out-of-bounds values never silently become financial zero',()=>{
 for(const ticker of cases.map(c=>c.ticker))for(const def of researchBridgeOptionDefinitions(ticker).filter(x=>x.type==='number')){
  for(const bad of [undefined,NaN,Infinity,'0',-1])assert.throws(()=>calculateResearchBridge(sourceCase(ticker),100000,{...defaultOptions(ticker),[def.key]:bad}),undefined,ticker+' '+def.key);
  if(def.default!==null)assert.throws(()=>calculateResearchBridge(sourceCase(ticker),100000,{...defaultOptions(ticker),[def.key]:null}));
  if(def.max!==undefined)assert.throws(()=>calculateResearchBridge(sourceCase(ticker),100000,{...defaultOptions(ticker),[def.key]:def.max+1}));
 }
 for(const value of [undefined,null,NaN,Infinity,'100'])assert.throws(()=>calculateResearchBridge(c('AAPL'),value));
 assert.throws(()=>evaluate('AAPL',100000,{operatingCashReserve:62400}));
});

test('boundary identity: wrong currency/source, invalid dates and alternate securities cannot reuse the reviewed bridge',()=>{
 for(const ticker of cases.map(x=>x.ticker)){
  assert.throws(()=>calculateResearchBridge({...c(ticker),currency:c(ticker).currency==='USD'?'TWD':'USD'},1000),/currency/);
  assert.throws(()=>calculateResearchBridge({...c(ticker),sourceUrl:'https://example.com/wrong-source'},1000),/source/);
  assert.throws(()=>calculateResearchBridge({...c(ticker),discountOrigin:'2026-02-30'},1000),/date/);
  assert.throws(()=>calculateResearchBridge(c(ticker),1000,{calculationDate:'2026-02-30'}),/date/);
  assert.throws(()=>calculateResearchBridge(c(ticker),1000,{informationAsOf:'2026-10-16'}),/information through/);
 }
});

test('sensitivities: named conditional variants preserve source inputs, additive claim/reserve math and dilution separation',()=>{
 for(const ticker of cases.map(x=>x.ticker)){
  const company=sourceCase(ticker),before=JSON.stringify(company),variants=researchBridgeSensitivity(company,100000,defaultOptions(ticker));
  assert.ok(variants.length>=2);assert.equal(JSON.stringify(company),before);for(const v of variants)assert.match(v.classification||'',/analytical capital scenario/);
  if(ticker==='NBIS')continue;
  const base=evaluate(ticker),claims=evaluate(ticker,100000,{additionalClaimAllowance:100}),reserve=evaluate(ticker,100000,{operatingCashReserve:100}),dilution=evaluate(ticker,100000,{additionalDilutionShares:1});
  // AAOI's intrinsic warrant value responds endogenously to available equity.
  if(ticker!=='AAOI'){close(claims.equity,base.equity-100);close(reserve.equity,base.equity-100);close(dilution.equity,base.equity);}
  close(dilution.allocationShares,base.allocationShares+1);
 }
});
