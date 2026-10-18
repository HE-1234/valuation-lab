import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchDraftFor} from '../dist/research-model.js';
import {annualMarginStartingPoint,annualMarginPathIssues,annualMarginOverrides} from '../dist/annual-margin-path.js';
import {MARGIN_PATH_VERSION,marginAtYear} from '../dist/margin-path.js';
const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const by=t=>cases.find(c=>c.ticker===t);
const config={enabled:true,version:MARGIN_PATH_VERSION,startMargin:.1,interimMargin:.3,interimYear:3,declineStartYear:5,terminalMargin:.2,terminalYear:10};
const decorate=d=>({...d,terminal:{...d.terminal,margin:config.terminalMargin},marginPath:{...config,startingMarginSource:annualMarginStartingPoint(d),generatedMargins:d.annual.map(r=>marginAtYear(config,r.year))}});
test('annual starting margin uses actual source EBIT without changing anchor',()=>{
 for(const c of cases.filter(c=>c.anchor.EBIT!==null)){
  const d=researchDraftFor(c),before=structuredClone(d),s=annualMarginStartingPoint(d);
  assert.equal(s.margin,c.anchor.EBIT/c.anchor.revenue);assert.equal(s.kind,'source-anchor');assert.match(s.label,/Year 0/);assert.deepEqual(d,before);
 }
});
test('missing EBIT uses explicitly labeled forecast starting assumption, never fabricated EBIT',()=>{
 for(const ticker of ['AAOI','NBIS']){
  const d=researchDraftFor(by(ticker)),s=annualMarginStartingPoint(d);assert.equal(s.kind,'forecast-proxy');assert.equal(s.margin,d.annual[0].margin);assert.match(s.label,/anchor EBIT unavailable/);assert.equal(d.anchor.EBIT,null);
 }
});
test('absent and disabled annual path metadata preserves original validation',()=>{
 const d=researchDraftFor(by('AAPL'));assert.deepEqual(annualMarginPathIssues(d),[]);d.marginPath={enabled:false};assert.deepEqual(annualMarginPathIssues(d),[]);
});
test('enabled annual metadata validates source, generated vector and terminal consistency',()=>{
 const d=decorate(researchDraftFor(by('AAPL')));assert.deepEqual(annualMarginPathIssues(d),[]);
 for(const field of ['startingMarginSource','generatedMargins']){const bad=structuredClone(d);delete bad.marginPath[field];assert.ok(annualMarginPathIssues(bad).length);}
 const bad=structuredClone(d);bad.terminal.margin=.21;assert.ok(annualMarginPathIssues(bad).length);
});
test('manual row changes are separated from generated margins and reverting clears them',()=>{
 const d=decorate(researchDraftFor(by('AAPL')));d.annual.forEach((r,i)=>r.margin=d.marginPath.generatedMargins[i]);
 d.annual[2].margin=.42;assert.deepEqual(annualMarginOverrides(d),{'3':.42});d.marginPath.manualOverrides=annualMarginOverrides(d);d.annual[2].margin=d.marginPath.generatedMargins[2];assert.deepEqual(annualMarginOverrides(d),{});
});

// Adapter tests load the export at run time so all test cases share the same pure API.
import {applyAnnualMarginPath} from '../dist/annual-margin-path.js';
import {researchDraftIssues,restoreResearchDraft,calculateResearchOperating,exportResearchCase} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
for(const c of cases)test(`${c.ticker}: apply margin path changes only explicit margins and terminal margin`,()=>{
 const d=researchDraftFor(c),before=structuredClone(d),source=structuredClone(c),p={...config,startMargin:annualMarginStartingPoint(d).margin};
 const next=applyAnnualMarginPath(d,c,p);
 assert.deepEqual(d,before);assert.deepEqual(c,source);assert.notEqual(next,d);assert.notEqual(next.annual,d.annual);
 for(let i=0;i<d.annual.length;i++)for(const key of ['year','period','revenue','taxRate','wacc','reinvestment'])assert.equal(next.annual[i][key],d.annual[i][key]);
 next.annual.forEach(r=>assert.equal(r.margin,marginAtYear(p,r.year)));assert.equal(next.terminal.margin,p.terminalMargin);
 for(const key of ['growth','taxRate','wacc','roic'])assert.equal(next.terminal[key],d.terminal[key]);
 assert.deepEqual(researchDraftIssues(next),[]);assert.equal(restoreResearchDraft(next,c).error,null);assert.ok(Number.isFinite(calculateResearchOperating(next).enterprise));assert.deepEqual(exportResearchCase(next,c).originalResearchCase,c);
});
test('disabled path application is a full clone with unchanged numeric and metadata paths',()=>{
 const c=by('AAPL');for(const d of [researchDraftFor(c),deriveAnnualGrowthHorizon(researchDraftFor(c),c,{growthMaturityYear:20})]){const next=applyAnnualMarginPath(d,c,{enabled:false});assert.deepEqual(next,d);assert.notEqual(next,d);assert.notEqual(next.annual,d.annual);}
});
test('invalid enabled paths throw without mutating annual inputs',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),before=structuredClone(d);
 for(const patch of [{terminalMargin:0},{terminalYear:4},{startMargin:undefined}])assert.throws(()=>applyAnnualMarginPath(d,c,{...config,...patch}));assert.deepEqual(d,before);
});
test('margin endpoint later than source adds years while preserving all existing non-margin economics',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),p={...config,terminalYear:24};const next=applyAnnualMarginPath(d,c,p);
 assert.equal(next.annual.length,24);assert.equal(next.forecastHorizonYears,24);assert.deepEqual(researchDraftIssues(next),[]);assert.equal(restoreResearchDraft(next,c).error,null);
 for(let i=0;i<d.annual.length;i++)for(const key of ['revenue','taxRate','wacc','reinvestment'])assert.equal(next.annual[i][key],d.annual[i][key]);
 assert.equal(next.annual[23].margin,p.terminalMargin);assert.equal(next.anchor.EBIT,d.anchor.EBIT);
 for(let i=d.annual.length;i<next.annual.length;i++)assert.equal(next.annual[i].revenue,next.annual[i-1].revenue*(1+d.terminal.growth));
});
test('independent margin maturity remains at year 18 across growth 20 to 10 and manual edits survive',()=>{
 const c=by('AAPL'),d=deriveAnnualGrowthHorizon(researchDraftFor(c),c,{growthMaturityYear:20});
 const next=applyAnnualMarginPath(d,c,{...config,terminalYear:18});next.annual[6].margin=.41;
 const ten=deriveAnnualGrowthHorizon(next,c,{growthMaturityYear:10});assert.equal(ten.forecastHorizonYears,18);assert.equal(ten.marginPath.terminalYear,18);assert.equal(ten.annual[17].margin,.2);assert.equal(ten.annual[6].margin,.41);assert.deepEqual(researchDraftIssues(ten),[]);
});
test('disable extended path retains explicit rows, valid saved schedule and current economics',()=>{
 const c=by('AAPL'),active=applyAnnualMarginPath(researchDraftFor(c),c,{...config,terminalYear:24}),disabled=applyAnnualMarginPath(active,c,{enabled:false});
 assert.equal(disabled.marginPath.enabled,false);assert.deepEqual(disabled.annual,active.annual);assert.deepEqual(disabled.terminal,active.terminal);assert.deepEqual(researchDraftIssues(disabled),[]);assert.equal(restoreResearchDraft(disabled,c).error,null);assert.equal(calculateResearchOperating(disabled).enterprise,calculateResearchOperating(active).enterprise);
 const ten=deriveAnnualGrowthHorizon(disabled,c,{growthMaturityYear:10});assert.equal(ten.annual.length,24);assert.deepEqual(researchDraftIssues(ten),[]);
});
test('reapply shorter margin endpoint retains existing explicit economic commitments and final-margin plateau',()=>{
 const c=by('AAPL'),active=applyAnnualMarginPath(researchDraftFor(c),c,{...config,terminalYear:24});active.annual[21].reinvestment=789;active.annual[4].margin=.77;
 const next=applyAnnualMarginPath(active,c,{...config,terminalYear:10,terminalMargin:.15});assert.equal(next.annual.length,24);assert.equal(next.annual[21].reinvestment,789);assert.equal(next.annual[4].margin,.3);assert.equal(next.annual[23].margin,.15);assert.equal(next.marginPath.terminalYear,10);assert.deepEqual(researchDraftIssues(next),[]);assert.equal(restoreResearchDraft(next,c).error,null);
});
for(const ticker of ['AAOI','NBIS'])test(`${ticker}: repeated phase edits and disable/re-enable preserve original forecast-proxy provenance`,()=>{
 const c=by(ticker),d=researchDraftFor(c),start=annualMarginStartingPoint(d),first=applyAnnualMarginPath(d,c,{...config,startMargin:start.margin});
 const before=structuredClone(first),second=applyAnnualMarginPath(first,c,{...first.marginPath,interimMargin:.4});
 assert.deepEqual(first,before,'full Undo snapshot remains intact');assert.deepEqual(second.marginPath.startingMarginSource,first.marginPath.startingMarginSource);assert.equal(second.marginPath.startingMarginSource.kind,'forecast-proxy');assert.match(second.marginPath.startingMarginSource.label,/anchor EBIT unavailable/);assert.equal(second.marginPath.startMargin,start.margin);assert.equal(second.anchor.EBIT,null);
 const disabled=applyAnnualMarginPath(second,c,{enabled:false}),enabled=applyAnnualMarginPath(disabled,c,{...disabled.marginPath,enabled:true,declineStartYear:6});assert.deepEqual(enabled.marginPath.startingMarginSource,first.marginPath.startingMarginSource);
 const edited=applyAnnualMarginPath(enabled,c,{...enabled.marginPath,startMargin:.12});assert.equal(edited.marginPath.startingMarginSource.kind,'analyst-assumption');assert.equal(edited.marginPath.startingMarginSource.margin,.12);assert.equal(edited.marginPath.startingMarginReference.kind,'forecast-proxy');assert.equal(edited.marginPath.startingMarginReference.margin,start.margin);assert.match(edited.marginPath.startingMarginReference.label,/anchor EBIT unavailable/);assert.equal(edited.anchor.EBIT,null);
 const restoredStart=applyAnnualMarginPath(edited,c,{...edited.marginPath,startMargin:start.margin});assert.deepEqual(restoredStart.marginPath.startingMarginSource,first.marginPath.startingMarginSource);assert.equal(restoreResearchDraft(edited,c).error,null);
});
