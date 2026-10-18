import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {capitalPathDefaults,capitalPathIssues,resolvedCapitalPath,capitalSalesCapitalAtYear,capitalEfficiencyDiagnostics} from '../dist/capital-efficiency.js';
import {currentSnapshot,draftFor,calculateCurrent,currentIssues,safeDraft,freezeCurrent,loadResearchedBaseCase,operatingAssumptions,independentGrowthProfile,valueCurrentWithClaims} from '../dist/current-model.js';
import {isUntouchedGenericDraft} from '../dist/base-cases.js';
import {simulateCurrent,createSeededRandom,SIMULATION_DRIVER_KEYS,distributionQuantile,validateSimulationConfig} from '../dist/simulation.js';
const universe=JSON.parse(fs.readFileSync(new URL('../dist/data/current-universe.json',import.meta.url)));
const research=JSON.parse(fs.readFileSync(new URL('../dist/data/company-base-cases.json',import.meta.url)));
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function context(ticker='AMZN'){
 const company=universe.companies.find(c=>c.ticker===ticker),raw=company.snapshots.find(s=>s.id===company.currentSnapshotId),snapshot=currentSnapshot(company,raw),draft=draftFor(company,raw,{baseCases:research});
 draft.cutoff=universe.asOf;return {company,raw,snapshot,draft};
}
function enable(draft,extra={}){draft.capitalPath={...capitalPathDefaults(draft),laterSalesCapital:4,...extra};return draft;}

test('capital efficiency: absent and disabled paths preserve all current outputs and seeded draws exactly',()=>{
 for(const c of universe.companies){const {snapshot:s,draft:d}=context(c.ticker),disabled={...structuredClone(d),capitalPath:{enabled:false,laterSalesCapital:null,earlyEndYear:'invalid'}};
  if(currentIssues(s,d).length){assert.deepEqual(currentIssues(s,disabled),currentIssues(s,d));continue;}
  assert.deepEqual(calculateCurrent(s,disabled),calculateCurrent(s,d));
  assert.deepEqual(simulateCurrent(s,disabled,{trials:13,seed:'capital-off'}),simulateCurrent(s,d,{trials:13,seed:'capital-off'}));
 }
});
test('capital efficiency: independent full cash-flow oracle matches early/later ratios and inverse-intensity fade',()=>{
 const {snapshot:s,draft:d}=context();enable(d);const before=structuredClone(d),a=d.assumptions,v=calculateCurrent(s,d),start=s.ebit/s.revenue;
 let revenue=s.revenue,pv=0;const intensity=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
 assert.equal(v.rows.length,15);
 for(let year=1;year<=15;year++){
  const growth=a.growth+(a.terminalGrowth-a.growth)*Math.min(year-1,9)/9,margin=start+(a.targetMargin-start)*Math.min(year,10)/10;
  const ratio=year<=5?a.salesCapital:year<=10?4:1/((1-(year-10)/5)/4+(year-10)/5*intensity);
  const next=revenue*(1+growth),ebit=next*margin,tax=Math.max(0,ebit)*a.tax,nopat=ebit-tax,reinvestment=Math.max(0,(next-revenue)/ratio),fcff=nopat-reinvestment;
  const row=v.rows[year-1];for(const [k,x]of Object.entries({growth,margin,revenue:next,ebit,tax,nopat,reinvestment,fcff}))near(row[k],x);
  near(v.operatingProfile.annualPath[year-1].salesCapital,ratio);pv+=fcff/(1+a.wacc)**year;revenue=next;
 }
 const terminalNopat=revenue*(1+a.terminalGrowth)*a.targetMargin*(1-a.tax),terminalReinvestment=terminalNopat*a.terminalGrowth/a.terminalROIC;
 near(v.forecastPV,pv);near(v.enterprise,pv+(terminalNopat-terminalReinvestment)/(a.wacc-a.terminalGrowth)/(1+a.wacc)**15);
 near(v.rows.at(-1).reinvestment,v.rows.at(-1).nopat*a.terminalGrowth/a.terminalROIC);
 near((terminalNopat-terminalReinvestment)/v.rows.at(-1).fcff-1,a.terminalGrowth);assert.deepEqual(d,before);
});
test('capital efficiency: own calendar replaces only capital, and older flexible capital maturity no longer extends forecast',()=>{
 const {snapshot:s,draft:d}=context();d.operatingProfile=independentGrowthProfile(d,{mode:'annual',explicitYears:3,subsequentGrowth:[.25,.15]});d.operatingProfile.marginMaturityYears=8;d.operatingProfile.capitalMaturityYears=30;
 const base=operatingAssumptions(s,d,d.assumptions);enable(d);const next=operatingAssumptions(s,d,d.assumptions);assert.equal(next.years,15);assert.equal(base.years,30);
 for(let i=0;i<next.years;i++)for(const k of ['growth','margin','taxRate','wacc'])assert.equal(next.yearlyOverrides[i][k],base.yearlyOverrides[i][k]);
 assert.equal(calculateCurrent(s,d).operatingProfile.forecastYears,15);assert.equal(d.operatingProfile.capitalMaturityYears,30);
});
test('capital efficiency: every growth mode, independent margin curve, AAOI staged path and longer calendar compose',()=>{
 for(const ticker of ['AMZN','AAOI'])for(const mode of ['legacy','immediate','maintain','annual']){
  const {snapshot:s,draft:d}=context(ticker);if(mode!=='legacy'){d.operatingProfile=independentGrowthProfile(d,{mode,explicitYears:mode==='immediate'?0:3,subsequentGrowth:mode==='annual'?[.25,.15]:[]});d.assumptions.years=20;}
  d.marginPath={enabled:true,interimMargin:.3,interimYear:3,declineStartYear:8,terminalYear:23};const old=operatingAssumptions(s,d,d.assumptions),claims=structuredClone(d.claims);enable(d);
  const next=operatingAssumptions(s,d,d.assumptions);assert.equal(next.years,23);for(let i=0;i<23;i++)for(const k of ['growth','margin','taxRate','wacc'])assert.equal(next.yearlyOverrides[i][k],old.yearlyOverrides[i][k]);
  const v=calculateCurrent(s,d);assert.equal(v.rows.length,23);assert.deepEqual(d.claims,claims);assert.equal(v.operatingProfile.capitalPath.terminalYear,15);
 }
});
test('capital efficiency: declining revenue never releases capital and zero stable growth needs zero mature investment',()=>{
 const {snapshot:s,draft:d}=context();enable(d);d.assumptions.growth=-.2;d.assumptions.terminalGrowth=0;
 const v=calculateCurrent(s,d);assert.ok(v.rows.every(r=>r.reinvestment===0));assert.equal(v.terminalReinvestment,0);assert.ok(v.operatingProfile.annualPath.every(r=>Number.isFinite(r.salesCapital)&&r.salesCapital>0));
});
test('capital efficiency: increasing early/later ratio reduces only applicable investment and raises operating value',()=>{
 const {snapshot:s,draft:d}=context();enable(d);const original=calculateCurrent(s,d);d.capitalPath.laterSalesCapital=8;const next=calculateCurrent(s,d);
 for(let i=0;i<5;i++)assert.deepEqual(next.rows[i],original.rows[i]);assert.ok(next.rows[5].reinvestment<original.rows[5].reinvestment);assert.ok(next.enterprise>original.enterprise);assert.equal(next.rows.at(-1).reinvestment,original.rows.at(-1).reinvestment);
});
test('capital efficiency: existing random draw scales early and later ratios jointly, keeps four draws and fixed terminal endpoint',()=>{
 const {snapshot:s,draft:d}=context();enable(d);const config={trials:31,seed:'joint-capital',drivers:{salesCapital:{type:'uniform',low:1,high:5}}};
 const simulation=simulateCurrent(s,d,config);assert.equal(simulation.accepted,31);assert.deepEqual(simulateCurrent(s,d,config),simulation);
 const c=validateSimulationConfig(config,d.assumptions),random=createSeededRandom(c.seed);
 for(const scenario of simulation.scenarios){const a={...d.assumptions};for(const k of SIMULATION_DRIVER_KEYS){a[k]=distributionQuantile(random(),c.drivers[k]);assert.equal(a[k],scenario[k]);}
  const v=valueCurrentWithClaims(s,d,a);near(scenario.perShare,v.perShare);assert.equal(v.operatingProfile.annualPath[0].salesCapital,a.salesCapital);near(v.operatingProfile.annualPath[5].salesCapital,4*a.salesCapital/d.assumptions.salesCapital);
  near(v.operatingProfile.annualPath.at(-1).salesCapital,a.terminalROIC/((1+a.terminalGrowth)*a.targetMargin*(1-a.tax)));
 }
 assert.ok(simulation.warnings.some(x=>/both early and later ratios proportionally/.test(x)));
});
test('capital efficiency: all malformed inputs remain invalid after restore, no coercion or silent fallback',()=>{
 const {snapshot:s,draft:d,company,raw}=context();enable(d);
 const variants=[null,{},'bad',{...d.capitalPath,enabled:'true'},{...d.capitalPath,version:2},{...d.capitalPath,extra:1},...['earlyEndYear','fadeStartYear','terminalYear','laterSalesCapital'].flatMap(k=>[null,NaN,Infinity,'5',0,-1].map(value=>({...d.capitalPath,[k]:value}))),{...d.capitalPath,earlyEndYear:5.1},{...d.capitalPath,earlyEndYear:10},{...d.capitalPath,terminalYear:10},{...d.capitalPath,terminalYear:31},{...d.capitalPath,inputText:{oops:'bad'}}];
 for(const invalid of variants){const bad={...structuredClone(d),capitalPath:invalid};assert.ok(capitalPathIssues(invalid).length);assert.throws(()=>calculateCurrent(s,bad));const restored=safeDraft(bad,company,raw,{baseCases:research});assert.deepEqual(restored.capitalPath,invalid);assert.throws(()=>calculateCurrent(s,restored));assert.throws(()=>simulateCurrent(s,restored,{trials:1}));}
 for(const k of ['salesCapital','targetMargin','years']){const bad=structuredClone(d);bad.assumptions[k]=null;assert.throws(()=>calculateCurrent(s,safeDraft(bad,company,raw)));}
 const bad=structuredClone(d);bad.assumptions.yearlyOverrides=[];assert.throws(()=>calculateCurrent(s,bad),/second annual/);
});
test('capital efficiency: input text, source identity, claims, restore, export, disabled state and researched reset are preserved',()=>{
 const {snapshot:s,draft:d,company,raw}=context('GOOG');enable(d);const before=structuredClone(d),restored=safeDraft(d,company,raw,{baseCases:research});assert.deepEqual(calculateCurrent(s,restored),calculateCurrent(s,d));assert.deepEqual(restored.claims,d.claims);assert.deepEqual(freezeCurrent(s,d).draft.capitalPath,d.capitalPath);
 restored.capitalPath.laterSalesCapital=9;assert.deepEqual(d,before);assert.equal(restored.assumptionProvenance.userEdited,true);
 const invalid=structuredClone(d);invalid.capitalPath.laterSalesCapital=null;invalid.capitalPath.inputText={laterSalesCapital:'oops'};const back=safeDraft(invalid,company,raw);assert.equal(back.capitalPath.inputText.laterSalesCapital,'oops');assert.throws(()=>calculateCurrent(s,back));
 const loaded=loadResearchedBaseCase(d,company,raw,research);assert.equal(loaded.capitalPath,undefined);assert.deepEqual(calculateCurrent(s,loaded),calculateCurrent(s,context('GOOG').draft));assert.deepEqual(d,before);
 const generic=draftFor(company,raw);generic.capitalPath={enabled:false};assert.equal(isUntouchedGenericDraft(generic,company,raw),false);
});
test('capital efficiency: numerically nonfinite input and valuation arithmetic fails closed',()=>{
 const {snapshot:s,draft:d}=context();enable(d);d.capitalPath.laterSalesCapital=Number.MIN_VALUE;assert.throws(()=>calculateCurrent(s,d),/nonfinite/);
 d.capitalPath.laterSalesCapital=4;d.assumptions.salesCapital=Number.MIN_VALUE;assert.throws(()=>calculateCurrent(s,d),/nonfinite/);
 d.assumptions.salesCapital=2;d.capitalPath.terminalYear=30;const huge={...s,revenue:Number.MAX_VALUE/2,ebit:Number.MAX_VALUE/4};assert.throws(()=>calculateCurrent(huge,d),/nonfinite|Require WACC/);
});
test('capital diagnostics: proxy uses actual after-tax margin, reflects loss tax policy, and never fabricates capital anchor',()=>{
 const rows=[{year:1,revenue:110,nopat:22,reinvestment:5,wacc:.1},{year:2,revenue:120,nopat:-12,reinvestment:5,wacc:.1}];
 const v=capitalEfficiencyDiagnostics({rows,defaultSalesCapital:2,anchorRevenue:100,anchorDate:'2026-06-30',currency:'USD'});
 assert.equal(v.status,'proxy-only');near(v.rows[0].marginalReturnProxy,.4);near(v.rows[1].marginalReturnProxy,-.2);near(v.rows[0].proxySpread,.3);assert.ok(v.rows.every(r=>r.impliedROIC===null&&r.beginningInvestedCapital===null));assert.match(v.anchorIssue,/not supplied/);
});
test('capital diagnostics: annual direct-investment ratios need positive delta and investment; missing and zero values stay unavailable',()=>{
 const rows=[{year:1,revenue:110,nopat:22,reinvestment:5,wacc:.1},{year:2,revenue:100,nopat:20,reinvestment:-2,wacc:.1},{year:3,revenue:120,nopat:24,reinvestment:0,wacc:.1}];
 const v=capitalEfficiencyDiagnostics({rows,anchorRevenue:100});assert.equal(v.rows[0].salesCapital,2);assert.equal(v.rows[1].salesCapital,null);assert.equal(v.rows[2].salesCapital,null);assert.equal(v.rows[2].marginalReturnProxy,null);
});
test('capital diagnostics: source-matched adjusted anchor yields beginning-capital ROIC and accumulates signed investment exactly once',()=>{
 const anchor={value:100,date:'2026-06-30',currency:'USD',verified:true,basis:'adjusted-operating-invested-capital',sourceUrl:'https://example.com/source'};
 const rows=[{year:1,revenue:110,nopat:22,reinvestment:10,wacc:.1},{year:2,revenue:120,nopat:24,reinvestment:-5,wacc:.1}];
 const options={rows,anchorRevenue:100,defaultSalesCapital:2,anchorDate:anchor.date,currency:'USD',investedCapitalAnchor:anchor};const v=capitalEfficiencyDiagnostics(options);
 assert.equal(v.status,'anchored');near(v.rows[0].impliedROIC,.22);near(v.rows[1].impliedROIC,24/110);assert.equal(v.rows[1].endingInvestedCapital,105);assert.notEqual(v.rows[0].impliedROIC,v.rows[0].marginalReturnProxy);
 for(const changes of [{verified:false},{basis:'cash-only-book-proxy'},{date:'2025-06-30'},{currency:'TWD'},{value:0},{sourceUrl:''}]){const bad=capitalEfficiencyDiagnostics({...options,investedCapitalAnchor:{...anchor,...changes}});assert.equal(bad.status,'proxy-only');assert.equal(bad.rows[0].impliedROIC,null);}
 const exhausted=capitalEfficiencyDiagnostics({...options,rows:[{...rows[0],reinvestment:-100},rows[1]]});assert.equal(exhausted.rows[1].impliedROIC,null);assert.equal(exhausted.rows[1].capitalStatus,'unavailable-denominator');
});
test('capital efficiency: minimum phase calendar and maximum terminal year hold their endpoints',()=>{
 const {snapshot:s,draft:d}=context();enable(d,{earlyEndYear:1,fadeStartYear:2,terminalYear:3});const p=resolvedCapitalPath(d);assert.equal(capitalSalesCapitalAtYear(p,1),d.assumptions.salesCapital);assert.equal(capitalSalesCapitalAtYear(p,2),4);assert.equal(capitalSalesCapitalAtYear(p,3),p.terminalSalesCapital);assert.equal(calculateCurrent(s,d).rows.length,10);
 d.capitalPath.terminalYear=30;assert.equal(calculateCurrent(s,d).rows.length,30);assert.throws(()=>capitalSalesCapitalAtYear(p,0));
});

test('capital efficiency: one-year scalar growth retains its first year and extensions use stable growth',()=>{
 for(const withMargin of [false,true])for(const profile of [undefined,{id:'linear-v1',schemaVersion:1}]){
  const {snapshot:s,draft:d}=context();d.assumptions.years=1;d.assumptions.growth=.2;d.assumptions.terminalGrowth=.025;
  if(profile)d.operatingProfile=profile;
  if(withMargin)d.marginPath={enabled:true,interimMargin:.3,interimYear:2,declineStartYear:4,terminalYear:7};
  const before=calculateCurrent(s,d);enable(d,{earlyEndYear:1,fadeStartYear:2,terminalYear:3});const v=calculateCurrent(s,d);
  assert.deepEqual(v.rows[0],before.rows[0]);assert.equal(v.rows.length,withMargin?7:3);
  for(let i=1;i<v.rows.length;i++){assert.equal(v.rows[i].growth,.025);near(v.rows[i].revenue,v.rows[i-1].revenue*1.025);}
  const config={trials:3,seed:'one-year-extension',drivers:{growth:{type:'fixed',value:.2},targetMargin:{type:'fixed',value:d.assumptions.targetMargin},salesCapital:{type:'fixed',value:d.assumptions.salesCapital},wacc:{type:'fixed',value:d.assumptions.wacc}}};
  const sim=simulateCurrent(s,d,config);assert.equal(sim.accepted,3);sim.scenarios.forEach(r=>near(r.perShare,v.perShare));
 }
});
