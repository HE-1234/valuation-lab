import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsDefinition,claimsSensitivity} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
import {simulateCurrent} from '../dist/simulation.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json'),h=read('../dist/data/company-history.json');
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function fixture(t,mode='ttm') {const c=u.companies.find(c=>c.ticker===t),r=guidedBasesFor(c).find(r=>r.snapshotMode===mode),s=currentSnapshot(c,r),d=draftFor(c,r,{baseCases:cases});d.cutoff='2026-10-21';return {c,r,s,d};}
test('Meta latest selected TTM is explicitly provisional and independently reconciles annual plus nine-month flows',()=>{
 const {c,r,s}=fixture('META');assert.equal(r.id,'META-TTM-2026-09-30');assert.equal(c.currentSnapshotId,r.id);
 assert.equal(r.provisionalEarningsRelease,true);assert.match(r.sourceForm,/8-K.*not yet filed/);assert.match(r.fiscalLabel,/Provisional/);
 near(s.revenue,200966+181712-141073);near(s.ebit,83276+54635-58531);
 near(r.facts.netIncome,60458+52481-37690);near(r.facts.capitalExpenditure,69691+83055-48308);
 assert.equal(guidedBasesFor(c).length,2);assert.equal(h.companies.META.annual.at(-1).period,'FY2025');
 assert.ok(c.snapshots.some(x=>x.id==='META-TTM-2026-06-30'),'previous full-quarter evidence retained');
});
test('Meta one-time expense, normalization and cash-claim proxy are distinct and counted once',()=>{
 const {r,s,d}=fixture('META');near(r.facts.operatingIncome,79380);near(d.normalizationDelta,9890);near(d.assumptions.otherClaims,9890);
 near(s.ebit+d.normalizationDelta,89270);assert.equal(r.legalSettlementEvidence.actualUnpaidBalance,null);
 near(r.legalSettlementEvidence.agreementMaximum,18590);near(r.legalSettlementEvidence.quarterEBITExCharge,12988+9890);
 const v=calculateCurrent(s,d),noClaim=calculateCurrent(s,{...d,assumptions:{...d.assumptions,otherClaims:0}});
 near(noClaim.perShare-v.perShare,9890/s.shares);
 const maxClaim=calculateCurrent(s,{...d,assumptions:{...d.assumptions,otherClaims:18590}});
 near(v.perShare-maxClaim.perShare,(18590-9890)/s.shares);
 const gaap=calculateCurrent(s,{...d,normalizationDelta:0,adjustmentReason:'',adjustmentSource:''});assert.ok(gaap.perShare<v.perShare);
 const annual=fixture('META','annual-reference');near(annual.d.normalizationDelta,0);near(annual.d.assumptions.otherClaims,0);
});
test('Meta source gaps remain null, restricted cash is excluded and future Class C shares are not prematurely issued',()=>{
 const {c,r,s}=fixture('META');near(s.cash,11222+71227);near(r.facts.restrictedCashCurrent+r.facts.restrictedCashNoncurrent,13132);
 for(const k of ['periodEndShares','unvestedNonOptionAwards','shares','financeLeaseLiabilityTotal','debt','dilutedShares'])assert.equal(r.facts[k],null,k);
 near(s.shares,2548+146.464);near(s.debt,80922+1184);assert.equal(r.sharesDate,'2026-06-30');
 assert.equal(r.guidedModelProxies.shares.sourceDate,'2026-06-30');assert.match(c.guidedEarningsUpdate.split,/January 19, 2027/);
 assert.match(r.reviewRequired.join(' '),/not.*September liability|not a September liability/);
});
test('Snowflake annual and TTM have eight real history rows and mutually exclusive debt/conversion allocation',()=>{
 assert.equal(h.companies.SNOW.annual.length,8);assert.ok(h.companies.SNOW.coverage.shortfallReason);
 for(const mode of ['annual-reference','ttm']){
  const {s,d}=fixture('SNOW',mode),def=claimsDefinition(s),v=calculateCurrent(s,d);
  assert.ok(s.ebit<0);near(d.normalizationDelta,0);near(d.assumptions.targetMargin,.25);
  const cv=def.convertibleScenarios;assert.equal(cv.length,2);near(s.debt,cv.reduce((n,x)=>n+x.carrying,0));
  assert.equal(v.claimsBridge.conversionChoice,'principal-only');near(v.claimsBridge.allocationShares,def.commonShares+def.employeeAwardShares);
  const converted=calculateCurrent(s,{...d,claims:{...d.claims,convertibleCase:'if-converted'}});
  near(converted.claimsBridge.allocationShares-v.claimsBridge.allocationShares,cv.reduce((n,x)=>n+x.conversionShares,0));
  near(def.cappedCalls.reduce((n,x)=>n+x.shares*(x.cap-x.strike),0),985.77);
  const high={...d,assumptions:{...d.assumptions,otherAssets:d.assumptions.otherAssets+150000}},hv=calculateCurrent(s,high);
  assert.equal(hv.claimsBridge.conversionChoice,'if-converted');assert.ok(hv.claimsBridge.rows.some(x=>x.label==='Capped-call asset scenario'&&x.amount>0));
  assert.ok(claimsSensitivity(s,d).every(x=>Number.isFinite(x.perShare)));
 }
 const {s,d}=fixture('SNOW');near(s.revenue,4683.946+2937.744-2187.043);near(s.shares,352.455+24.964+.1);
 near(d.assumptions.otherAssets,1984.482+370.178);
});
test('Meta normalization and Snowflake claim allocations survive deterministic simulation',()=>{
 for(const t of ['META','SNOW']){const {s,d}=fixture(t),v=calculateCurrent(s,d),sim=simulateCurrent(s,d,{trials:5,seed:'meta-snow'});assert.equal(sim.accepted,5);for(const n of sim.draws)near(n,v.perShare);}
});
