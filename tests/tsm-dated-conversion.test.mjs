import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reverseCevaRmbsIntegration} from './ceva-rmbs-integration-preservation.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {preservedV88Fs as fs} from './three-fix-preservation.mjs';
import {TSM_DATED_CONVERSION as f,calculateTsmDatedConversion as calc,withTsmDatedConversion as overlay,twdOrdinaryToDatedUSDADS as forward,datedUSDADSToTwdOrdinary as inverse} from '../dist/tsm-dated-conversion.js';
import {tsmDatedConversionHTML} from '../dist/tsm-dated-conversion-view.js';
import {setLocale} from '../dist/i18n.js';
const auditBytes=fs.readFileSync(new URL('./fixtures/tsm-dated-v79-audit.json',import.meta.url));assert.equal(createHash('sha256').update(auditBytes).digest('hex'),'f4a0cb41ee36f9372fde7b2a9a2cc91acfde74eb46d22f033432e9d29d078c3d');const data=JSON.parse(auditBytes);const base=data.annual.find(r=>r.ticker==='TSM');
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1e-10,Math.abs(b)*1e-12),`${a} != ${b}`);
test('dated primary-source conversion preserves ordinary result and uses multiply five / spot not inverse',()=>{
 const before=JSON.stringify(base),r=calc(base.draft,base.bridge);near(r.perADS,base.bridge.rawPerShare*5/31.880);near(r.perADS,298.5383273960684);assert.equal(r.nativePerShare,base.bridge.rawPerShare);assert.equal(JSON.stringify(base),before);
 assert.equal(r.date,'2026-09-30');assert.equal(r.sources[0].pdfPage,1);assert.equal(r.sources[1].pdfPage,2);assert.equal(r.sources[2].slide,7);
 for(const k of ['priceComparisonEligible','currentValuationEligible','asKnownBacktestEligible','currentCapitalVerified'])assert.equal(r[k],false);
 assert.equal(f.currentInterestBearingDebtMillions+f.longTermInterestBearingDebtMillions,f.totalInterestBearingDebtMillions);
});
test('conversion inverse and units preserve exact numeric precision and signed residuals',()=>{
 for(const x of [0,-1903.480375477332,0.0000123456789,1903.480375477332,1e9])near(inverse(forward(x)),x);
 assert.equal(forward(31.880),5);near(inverse(5),31.880);
 for(const x of [null,undefined,NaN,Infinity,'10']){assert.throws(()=>forward(x));assert.throws(()=>inverse(x));}
 const b={...base.bridge,rawPerShare:-2,equity:-2*base.bridge.allocationShares};assert.ok(calc(base.draft,b).perADS<0);
});
test('wrong currency, ratio basis, date, source, shares and incomplete allocations fail closed',()=>{
 const changes=[{currency:'USD'},{ticker:'ASML'},{securityBasis:'ADR'},{status:'operating-only'},{eligible:false},{rawPerShare:null},{equity:NaN},{basicShares:1},{allocationShares:1},{sources:[]},{informationAsOf:'2026-09-30'},{informationAsOf:undefined}];
 for(const key of ['discountOrigin','calculationDate','capitalReferenceDate','shareReferenceDate'])changes.push({[key]:'2026-10-17'});
 for(const change of changes){const b={...base.bridge,...change};assert.throws(()=>calc(base.draft,b));assert.equal(overlay(base.draft,b).datedADSConversion.perADS,null);}
 for(const change of [{ticker:'AAPL'},{currency:'USD'},{timing:{mode:'as-of-scenario'}},{discountOrigin:'2026-10-17'},{informationAsOf:'2026-09-30'},{informationAsOf:undefined}])assert.throws(()=>calc({...base.draft,...change},base.bridge));
});
test('optional overlay preserves all numeric fields, edits stay conditional, other companies unchanged',()=>{
 const before=JSON.stringify(base.bridge),out=overlay(base.draft,base.bridge);assert.equal(JSON.stringify(base.bridge),before);
 for(const [key,value] of Object.entries(base.bridge))if(typeof value==='number')assert.equal(out[key],value);
 assert.ok(!out.warnings.some(x=>x.startsWith('No valuation-date spot FX')));assert.ok(base.bridge.warnings.some(x=>x.startsWith('No valuation-date spot FX')));
 const edited={...base.bridge,rawPerShare:100,allocationShares:26000};assert.equal(calc({...base.draft,userEdited:true},edited).nativePerShare,100);
 const a=data.annual.find(r=>r.ticker==='AAPL');assert.equal(overlay(a.draft,a.bridge),a.bridge);
});
test('bilingual display retains full precision exports and clear date/claim restrictions',()=>{
 const out=overlay(base.draft,base.bridge),before=JSON.stringify(out);
 try{setLocale('en');let html=tsmDatedConversionHTML(out);assert.match(html,/September 30, 2026/);assert.match(html,/not a current USD target/);assert.match(html,/298\.54/);assert.match(html,/31\.880/);assert.match(html,/overlap/);setLocale('zh-Hans');html=tsmDatedConversionHTML(out);assert.match(html,/日期匹配/);assert.match(html,/不是当前美元目标价/);assert.match(html,/尚未解决/);assert.equal(JSON.stringify(out),before);assert.match(tsmDatedConversionHTML({datedADSConversion:{status:'unavailable'}}),/不可用/);}finally{setLocale('en');}
});
test('merged Annual view retains TSM overlay and core source gates unchanged',()=>{
 const source=fs.readFileSync(new URL('../dist/research-view.js',import.meta.url),'utf8');
 assert.match(source,/withTsmDatedConversion\(d,calculateResearchBridge/);assert.match(source,/tsmDatedConversionHTML\(bridge\)/);
 for(const file of ['research-claims.js','incremental-research-claims.js','engine.js'])assert.equal(reverseCevaRmbsIntegration('dist/'+file,fs.readFileSync(new URL('../dist/'+file,import.meta.url))).toString(),execFileSync('git',['show','e427d6b:dist/'+file],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
});
