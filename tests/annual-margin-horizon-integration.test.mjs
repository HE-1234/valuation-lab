import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchDraftFor,researchDraftIssues,restoreResearchDraft,calculateResearchOperating} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {applyAnnualMarginPath,defaultAnnualMarginPath} from '../dist/annual-margin-path.js';
const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const by=t=>cases.find(c=>c.ticker===t);
const path=(d,terminalYear)=>({...defaultAnnualMarginPath(d),enabled:true,interimYear:3,declineStartYear:5,terminalYear});

test('MU margin-only extension preserves every source revenue including its distinct final growth endpoint',()=>{
 const c=by('MU'),d=researchDraftFor(c),before=structuredClone(d),extended=applyAnnualMarginPath(d,c,path(d,20));
 assert.deepEqual(d,before);assert.equal(extended.schemaVersion,2);assert.equal(extended.derivedForecast.revenuePathPreserved,true);
 for(let i=0;i<10;i++)for(const k of ['revenue','reinvestment','taxRate','wacc','period'])assert.equal(extended.annual[i][k],d.annual[i][k]);
 assert.ok(Math.abs(extended.annual[9].revenue/extended.annual[8].revenue-1-.025)<1e-12);
 assert.deepEqual(researchDraftIssues(extended),[]);assert.equal(restoreResearchDraft(extended,c).error,null);
 assert.ok(Number.isFinite(calculateResearchOperating(extended).enterprise));
 const growth=deriveAnnualGrowthHorizon(extended,c,{growthMaturityYear:10});
 assert.equal(growth.derivedForecast.revenuePathPreserved,false);assert.equal(growth.annual.length,20);
 assert.ok(Math.abs(growth.annual[9].revenue/growth.annual[8].revenue-1-.02)<1e-12);
});

test('disabled extended margin metadata retains current annual values and valid saved identity',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),extended=applyAnnualMarginPath(d,c,path(d,20));
 const disabled=applyAnnualMarginPath(extended,c,{...extended.marginPath,enabled:false});
 assert.deepEqual(disabled.annual,extended.annual);assert.equal(disabled.forecastHorizonYears,20);
 assert.deepEqual(researchDraftIssues(disabled),[]);assert.equal(restoreResearchDraft(disabled,c).error,null);
 const reapplied=applyAnnualMarginPath(extended,c,path(extended,10));
 assert.equal(reapplied.annual.length,20);
 assert.deepEqual(reapplied.annual.map(r=>[r.revenue,r.reinvestment]),extended.annual.map(r=>[r.revenue,r.reinvestment]));
 assert.deepEqual(researchDraftIssues(reapplied),[]);
});

test('margin-only path flags reject incompatible growth metadata rather than normalize it',()=>{
 const c=by('AAPL'),d=researchDraftFor(c),extended=applyAnnualMarginPath(d,c,path(d,20));
 for(const value of ['yes',1,null]){const bad=structuredClone(extended);bad.derivedForecast.revenuePathPreserved=value;assert.ok(researchDraftIssues(bad).length);}
 const bad=structuredClone(extended);bad.derivedForecast.growthMaturityYear=15;assert.ok(researchDraftIssues(bad).length);
});
