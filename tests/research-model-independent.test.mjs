import {originalResearchBytes} from './research-presentation-original.mjs';
// Independent annual-model oracle. Expected economics come from the frozen source,
// not from the production calculator. Authorized schema-2 growth and simulation UI
// changes have separate migration/golden coverage. Unchanged source/core hashes pin baseline ea930d21888d0c050eec20fd4789d3c4d992156b.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {researchDraftFor,researchDraftIssues,restoreResearchDraft,loadAnnualResearchCase,calculateResearchOperating,terminalNormalizedDraft,researchTimingResult,researchSensitivity,exportResearchCase,RESEARCH_PROFILE_ID,RESEARCH_VERSION,RESEARCH_STORAGE_PREFIX} from '../dist/research-model.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const bundle=JSON.parse(read('dist/data/renewed-research-2026-10-17/cases.json'));
const cases=bundle.companies;
const byTicker=t=>cases.find(c=>c.ticker===t);
const close=(a,b,label='')=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*2e-12,label+': '+a+' != '+b);};
const sha=x=>createHash('sha256').update(x).digest('hex');
const expectedSourceSHA='02c8e133893cff642369ba58d29b7e5ad091c204e08a6b37acbff28f13072bd2';
const expectedNumericSHA='dae4599e41f8bfade208eab2f6038412c4f8d155af52db16e91ac6e28f4a3447';
const protectedHashes={
  // Optional margin-path dirty-state and explicit reset support; source ledger remains frozen.
  "dist/base-cases.js": "5cec621295445ad1df175954743294045cc55138c0e795e76fde1d9df77c06aa",
  "dist/current-claims-gates.js": "dff896af03e56a6de7bafb6b26af9793d862d2d87097468fc999729f7205a82a",
  // Effective margin-path metadata and finite-result gate; claims arithmetic is unchanged.
  "dist/current-claims.js": "c7acf3395f040458e7ca939fd45a10ad8e435c3fa22efbef17dc49e0f2db2583",
  "dist/data/companies.json": "6cdf199740c0549e32258211dd31abea59259cf46ecd7526b43bf932abf1e4b9",
  "dist/data/company-base-cases.json": "883e8ed981bc307b7d477aca82e5978d05215234a57c5df9d3c551bac3d642c6",
  "dist/data/company-history.json": "f611b66c07983fdb2ffb4e8d6805e64775342e2da5182d5aecd86182c6876853",
  "dist/data/current-claims-research.json": "4f7a3f6bef5315ff698dea53db5a76777ef8b9e33fe3f07c45e1066ecda4aef7",
  "dist/data/current-market-references.json": "cb1ea4dd76a79c15a9379963e95ab5c52376fd499e6c105e1c75c2ff74c19850",
  "dist/data/current-universe.json": "6f607bb6dd8707e91810bbdf251a8ffb358d1b44fe739ec2418c36fb3b9e8be1",
  "dist/data/frozen-case-evaluation.json": "cd7025bdd351be41a24675b5fb4f20a0620fa17a3ff5c6b267c79608be2267a6",
  "dist/data/goog-valuation-audit.html": "208546fb8eb944f1ea68ef6c25a6a7288a9936727b66ebe196c9da6dfc1a726e",
  "dist/data/goog-valuation-audit.json": "a2e3060c42a27ea31930869edc79ad43d824b8442d5aa7e5a2be3e05645fb4fa",
  "dist/data/guided-content.json": "88463669d52625fdb5272cd617ab26d6d4d27c39ee22fc394d846510bd6fb9c0",
  "dist/data/msft-annual-scenario-paths.csv": "1bcb7f35f04cc0de6eee31a67b8fb823f8ae735258da8d11fad0d4b960e774cd",
  "dist/data/msft-business-outcome-evaluation.json": "dc187b573504fa367acc7db157f0900b3ccdc93c041ea7b8ecc6553a42cf52b2",
  "dist/data/msft-independent-check.json": "4ba080c05091830f112023f7c8c23d209b2b1a05bf42d8f807ec72cc2580a990",
  "dist/data/msft-researched-cases.json": "f17bb13a289ea6ae53a5ca682e53c97ba7bf75445f8e05f54b50d85e8e5f7258",
  "dist/data/nvda-cases.json": "3aaecd25b835ce2cf7857d47be26a63ae5b119bd367d434ebe8e2f410b5621a8",
  "dist/data/nvda-claim-scale-diagnostics.json": "aaaf1221694fbf4d712d13d651f4caab3843b747d27f6c71434fb34176a72ed4",
  "dist/data/nvda-fy2025-outcome.json": "d9b9d3d0d046fc1a7ce9a2153a6cc767e3238b748de819c1606cfa0e11be3ead",
  "dist/data/nvda-outcomes.json": "f68410dca37b185119a7752d693c0268928821fedd3eabb18f68143c32f6511f",
  "dist/data/nvda-price-observations.json": "2b000fbb491635290757926c7aa15eb9d5aa9535a13c3bf18af5fcad7ea91642",
  "dist/data/nvda-researched-cases.json": "f222cd3ce4c31c620672080223c795c81bf8cb0f54e3c1170951a55b4cb0ca39",
  "dist/data/provider-research.html": "b9e49336ad974f7303a4fad2a7af2a9a5a704565e136f3861dec1c2bd15868f8",
  "dist/data/research-addenda.json": "41bb214aaac5f8ccacac8e2e072466aef6cc50b20ebf10f45dbe6b1ccb1c1219",
  "dist/data/research-versions/FY2024-terminal-scale-constraints-v1.json": "dae3080be97a7b4480d9477c481de745441dece3be7a93442697ccb388c8b968",
  "dist/data/research-versions/MSFT-FY2019-frozen-v1.json": "437167e8e7655cd7421972c7b05a1f4d29cbbc694cb4ac63355448c5ab7c37a0",
  "dist/data/research-versions/MSFT-FY2019-frozen-v1.sha256": "a983ad72062aac7bc09fd6dea9a40cd436e3a008769e34777abb6fc203b7dffb",
  "dist/data/research-versions/NVDA-FY2021-Arm-contingent-supplement.json": "c7ab3abed494e8a33e1d5caec2f5cae39846577642c5155eb86c742d3ac0ffec",
  "dist/data/research-versions/NVDA-FY2021-frozen.json": "52e83dbdf658f0ca8b76eae1e26aaecb4d706024e16b2f13ced07b4aa933061a",
  "dist/data/research-versions/NVDA-FY2021-frozen.sha256": "2d421e88f856148c2d656ed4e30fe8280668ff78e3d4163ef116eb3fc286c0c1",
  "dist/data/research-versions/NVDA-FY2021-method-diagnostics-v2.json": "8a03f8d0941592afbdc4602c47a368eeda508bd59fc79d502a1ee67e730c7238",
  "dist/data/research-versions/NVDA-FY2022-frozen.json": "349c2f8b0c153f78d9390d1ea7e13fc8305015e367973ef2918bc59fb9932d1a",
  "dist/data/research-versions/NVDA-FY2022-frozen.sha256": "e388a86da02435da5f820debe37bb6f2642d63c8a9b2ac6b8f19c43e90f97e18",
  "dist/data/research-versions/NVDA-FY2023-frozen.json": "bead6a90cfecf5451bacff55478de4b29b9c4d74952e16b52fde5bab02fd3ff8",
  "dist/data/research-versions/NVDA-FY2023-frozen.sha256": "f425e2544c4b947663dae845496209d6fd92114b393ad0b086dbd949fa82465a",
  "dist/data/research-versions/NVDA-FY2024-frozen.json": "d799745495fc7feca090f5cccc37cca594eaf7b169eed65fc42c57db9a104d16",
  "dist/data/research-versions/NVDA-FY2024-frozen.sha256": "2f2eab2b3d6a66e9015eec70d3efd316c89db8044ad836f51c7157ed2d425966",
  "dist/data/research-versions/NVDA-FY2024-method-diagnostics-v2.json": "62c2fddff7fe6afb83664131dfeafddb52a8ed627ff1cd714cc0426fa800a5c7",
  "dist/data/research-versions/legacy-award-evidence-v1.json": "91b6b4226ba0b6d002261e741db8f5e35c176da9ca1e2d715a2f171ecfd62da7",
  "dist/data/research-versions/market-anchor-stress-v1.json": "34847cb0eec11e81249af9395d1908730c6056fcd0235d2d9e87a6dc703b0c0a",
  "dist/data/research-versions/operating-miss-diagnosis-v1.json": "4d89b7c505e8c3cf58646cdc3f2f566aa2874a2ed23ab772ed31a5c3aea1c57d",
  "dist/data/reverse-dcf-diagnostics.json": "3d6649d8a4eb2f0b898eede646f08e4bf766095b9834f434daadec0c1c09adfe",
  // Default attempted-scenario count moved from 4,000 to 5,000.
  "dist/data/simulation-methodology.html": "3786be0555b1275ffbb2c9d8eb5b39a592b249ad9c1383963e190634ca40636e",
  "dist/engine.js": "3229a8fcc63a64b34051be19e375484445878c9cd7ada030fa8b3397dac8e8f7",
};
function numericLeaves(x,p='',a=[]){if(typeof x==='number'||x===null||typeof x==='boolean')a.push([p,x]);else if(x&&typeof x==='object')for(const k of Object.keys(x).sort())numericLeaves(x[k],p+'/'+k,a);return a;}

function independent(c){
 let denominator=1,total=0,cumulative=0,trough=0,prior=c.anchor.revenue;
 const rows=c.annual.map((a,i)=>{
  const ebit=a.revenue*a.operatingMargin;
  const tax=ebit>0?ebit*a.taxRate:0;
  const nopat=ebit-tax,fcff=nopat-a.reinvestment;
  denominator*=1+a.wacc;cumulative+=fcff;trough=Math.min(trough,cumulative);
  const pv=fcff/denominator,growth=a.revenue/prior-1,sc=a.reinvestment===0?null:(a.revenue-prior)/a.reinvestment;
  prior=a.revenue;total+=pv;
  return {ebit,tax,nopat,fcff,pv,growth,sc,cumulative,denominator};
 });
 const t=c.terminal,rev=c.annual.at(-1).revenue*(1+t.growth),ebit=rev*t.operatingMargin;
 const nopat=ebit*(1-t.taxRate),investment=nopat*t.growth/t.ROIC,fcff=nopat-investment;
 const tv=fcff/(t.wacc-t.growth),terminalPV=tv/denominator;
 return {rows,forecastPV:total,terminalPV,enterprise:total+terminalPV,trough:-trough,terminal:{revenue:rev,ebit,nopat,reinvestment:investment,fcff,value:tv,pv:terminalPV}};
}

test('renewed source: frozen 14-company, 160-row numeric payload is preserved exactly',()=>{
 assert.equal(cases.length,14);assert.equal(cases.reduce((s,c)=>s+c.annual.length,0),160);
 assert.equal(sha(JSON.stringify(numericLeaves(bundle))),expectedNumericSHA);
 const manifest=JSON.parse(read('dist/data/renewed-research-2026-10-17/manifest.json'));
 assert.equal(manifest.originalExecutableSHA256,expectedSourceSHA);
 const source='/workspace/shared/company-forecast-research/executable-base-cases-2026-10-17.json';
 if(fs.existsSync(source))assert.equal(sha(fs.readFileSync(source)),expectedSourceSHA);
 assert.deepEqual(cases.filter(c=>c.annual.length===15).map(c=>c.ticker).sort(),['AMZN','GOOG','MSFT','TSM']);
});

test('renewed source: frozen data and reviewed core module signatures remain pinned',()=>{
 assert.ok(Object.keys(protectedHashes).filter(p=>p.startsWith('dist/data/')).length>=35);
 for(const [path,hash] of Object.entries(protectedHashes))assert.equal(sha(originalResearchBytes(path,read(path))),hash,path);
});

for(const c of cases)test(`annual independent oracle: ${c.ticker}, all ${c.annual.length} rows and terminal`,()=>{
 const before=JSON.stringify(c),d=researchDraftFor(c),r=calculateResearchOperating(d),o=independent(c);
 assert.deepEqual(researchDraftIssues(d),[]);assert.equal(d.annual.length,c.forecastHorizonYears);
 for(let i=0;i<c.annual.length;i++){
  const a=c.annual[i],v=r.rows[i],e=o.rows[i],label=`${c.ticker} year ${i+1}`;
  for(const [key,expected] of Object.entries({ebit:e.ebit,tax:e.tax,nopat:e.nopat,fcff:e.fcff,pv:e.pv,growth:e.growth,cumulativeFCFF:e.cumulative,discountFactor:e.denominator}))close(v[key],expected,label+' '+key);
  assert.equal(v.reinvestment,a.reinvestment,label+' authoritative investment');
  if(e.sc===null)assert.equal(v.derivedSalesCapital,null);else close(v.derivedSalesCapital,e.sc,label+' descriptive S:C');
  for(const [key,expected] of Object.entries({EBIT:e.ebit,operatingTax:e.tax,NOPAT:e.nopat,FCFF:e.fcff,presentValueFCFF:e.pv,discountFactor:e.denominator,cumulativeUndiscountedFCFF:e.cumulative}))close(a[key],expected,label+' source '+key);
  assert.equal(a.discountExponent,i+1);
 }
 for(const [key,v] of Object.entries(o.terminal))close(r.terminal[key],v,c.ticker+' terminal '+key);
 close(r.forecastPV,o.forecastPV);close(r.terminalPV,o.terminalPV);close(r.enterprise,o.enterprise);
 close(c.valuation.operatingEnterpriseValueAtForecastOrigin,o.enterprise);close(c.valuation.presentValueForecastFCFF,o.forecastPV);close(c.valuation.presentValueTerminal,o.terminalPV);
 close(r.peakEconomicDeficit,o.trough);assert.equal(r.negativeFCFFYears,o.rows.filter(x=>x.fcff<0).length);
 assert.equal(r.currency,c.ticker==='TSM'?'TWD':'USD');
 assert.equal(c.valuationTiming.operatingEVAtResearchAsOf,null);assert.equal(c.valuation.equityValue,null);assert.equal(c.valuation.perShareValue,null);
 assert.equal(JSON.stringify(c),before);
});

test('annual model: signed deficits and loss taxes survive without a valuation floor',()=>{
 const d=researchDraftFor(byTicker('NBIS'));
 for(const r of d.annual){r.margin=-.25;r.reinvestment=r.revenue*3;}
 const result=calculateResearchOperating(d);
 assert.ok(result.enterprise<0);assert.equal(result.terminalShare,null);
 assert.equal(result.negativeFCFFYears,d.annual.length);
 for(const row of result.rows){assert.equal(row.tax,0);assert.ok(row.nopat<0);assert.ok(row.fcff<row.nopat);assert.ok(row.pv<0);}
 close(result.peakEconomicDeficit,-result.rows.at(-1).cumulativeFCFF);
 const release=structuredClone(d);release.annual[0].reinvestment=-100;
 assert.equal(calculateResearchOperating(release).rows[0].reinvestment,-100);
 assert.match(calculateResearchOperating(release).warnings.join(' '),/explicit asset|release assumption/i);
});

test('MU: falling sales retain positive fab investment; endpoint and capital transitions are separately disclosed',()=>{
 const c=byTicker('MU'),r=calculateResearchOperating(researchDraftFor(c));
 const declining=r.rows.filter(x=>x.growth<0);assert.ok(declining.length>=2);
 for(const row of declining){assert.ok(row.reinvestment>0);assert.ok(row.derivedSalesCapital<0);close(row.fcff,row.nopat-row.reinvestment);}
 close(r.rows.at(-1).growth,.025);close(r.terminal.growth,.02);
 close(r.terminal.revenueGrowthEndpointDifference,.005);
 assert.match(r.warnings.join(' '),/revenue growth differs/);assert.match(r.warnings.join(' '),/capital.transition/);
});

test('terminal normalization: separate, reproducible sensitivity never mutates original economics',()=>{
 for(const c of cases){
  const d=researchDraftFor(c),before=JSON.stringify(d),base=calculateResearchOperating(d),n=terminalNormalizedDraft(d),r=calculateResearchOperating(n);
  assert.equal(JSON.stringify(d),before);assert.notEqual(n,d);assert.deepEqual(n.terminal,d.terminal);
  const unchanged=Math.abs(base.terminal.fcffGrowth-d.terminal.growth)<=1e-6;
  if(unchanged){assert.deepEqual(n.annual,d.annual);assert.equal(n.capitalPolicy,'terminal-normalization-not-needed-v1');}
  else{
   assert.equal(n.capitalPolicy,'terminal-normalization-3y-v1');assert.equal(n.userEdited,true);
   for(let i=0;i<d.annual.length;i++){
    for(const k of ['year','period','revenue','margin','taxRate','wacc'])assert.equal(n.annual[i][k],d.annual[i][k]);
    const a=d.annual[i],weight=i<d.annual.length-3?0:(i-(d.annual.length-3)+1)/3;
    const nopat=a.revenue*a.margin-Math.max(0,a.revenue*a.margin)*a.taxRate;
    close(n.annual[i].reinvestment,a.reinvestment*(1-weight)+nopat*d.terminal.growth/d.terminal.roic*weight);
   }
   close(r.terminal.fcffGrowth,d.terminal.growth);
  }
  const s=researchSensitivity(d);close(s.base,base.enterprise);close(s.normalized,r.enterprise);close(s.normalizationDelta,r.enterprise-base.enterprise);
  assert.match(s.normalizationLabel,/sensitivity|not a superior forecast/);
  assert.ok(s.rates[0].enterprise>s.rates[1].enterprise&&s.rates[1].enterprise>s.rates[2].enterprise);
 }
});

test('saved draft: version, profile, identity and full horizon are enforced; incompatible edits remain recoverable',()=>{
 const c=byTicker('MSFT'),base=researchDraftFor(c);
 assert.equal(base.version,RESEARCH_VERSION);assert.equal(base.profileId,RESEARCH_PROFILE_ID);
 assert.match(RESEARCH_STORAGE_PREFIX,/annual-research/);assert.equal(base.annual.length,15);
 const mutations=[d=>d.schemaVersion++,d=>d.profileId='legacy',d=>d.version='old',d=>d.caseId='wrong',d=>d.ticker='AAPL',d=>d.currency='TWD',d=>d.discountOrigin='2026-01-01',d=>d.anchor.revenue++,d=>d.forecastHorizonYears--,d=>d.annual.pop(),d=>d.annual.push({...d.annual.at(-1),year:16}),d=>d.annual[0].revenue=null,d=>d.annual[0].reinvestment=undefined,d=>d.terminal.roic=null,d=>d.assumptions={}];
 for(const mutate of mutations){const bad=structuredClone(base);mutate(bad);const expected=structuredClone(bad),restored=restoreResearchDraft(bad,c);assert.equal(restored.restored,true);assert.ok(restored.error);assert.deepEqual(restored.draft,expected);assert.notEqual(restored.draft,bad);}
 const edited=structuredClone(base);edited.annual[2].reinvestment+=123;edited.notes='Keep my thesis';edited.bridgeInputs={additionalClaimAllowance:321};edited.userEdited=true;
 const recovered=restoreResearchDraft(edited,c);assert.equal(recovered.error,null);assert.deepEqual(recovered.draft,edited);
 const loaded=loadAnnualResearchCase(edited,c);assert.deepEqual(loaded.draft.annual,base.annual);assert.equal(loaded.draft.notes,edited.notes);assert.deepEqual(loaded.draft.bridgeInputs,edited.bridgeInputs);assert.deepEqual(loaded.undo,edited);
 loaded.draft.bridgeInputs.additionalClaimAllowance=777;assert.equal(edited.bridgeInputs.additionalClaimAllowance,321);assert.equal(loaded.undo.bridgeInputs.additionalClaimAllowance,321);
 assert.deepEqual(restoreResearchDraft(null,c).draft,base);
});

test('annual schema: missing amounts and invalid terminal policy never coerce to zero or scalar defaults',()=>{
 const base=researchDraftFor(byTicker('AAPL'));
 for(const field of ['revenue','margin','taxRate','reinvestment','wacc'])for(const bad of [null,undefined,NaN,Infinity,'0']){
  const d=structuredClone(base);d.annual[0][field]=bad;assert.ok(researchDraftIssues(d).length,field);assert.throws(()=>calculateResearchOperating(d));
 }
 for(const [field,value] of [['growth',-.01],['growth',.06],['margin',0],['taxRate',.61],['roic',.01],['wacc',.01]]){
  const d=structuredClone(base);d.terminal[field]=value;assert.throws(()=>calculateResearchOperating(d));
 }
 const d=structuredClone(base);d.annual[0].reinvestment=0;assert.equal(calculateResearchOperating(d).rows[0].derivedSalesCapital,null);
});

test('timing: every researched case starts at its own origin, and October value needs an explicit explained stub',()=>{
 for(const c of cases){
  const d=researchDraftFor(c),o=calculateResearchOperating(d),origin=researchTimingResult(d,o);
  assert.equal(origin.status,'origin');assert.equal(origin.date,c.valuationTiming.discountOrigin);close(origin.enterprise,o.enterprise);
  d.timing.mode='as-of-scenario';assert.equal(researchTimingResult(d,o).status,'incomplete');
  d.timing.stubFCFF=0;assert.equal(researchTimingResult(d,o).status,'incomplete');
  d.timing.reason='Independent explicit zero-stub sensitivity';
  const result=researchTimingResult(d,o);assert.equal(result.status,'scenario');
  const elapsed=(Date.parse('2026-10-17')-Date.parse(d.discountOrigin))/(365.25*86400000);
  close(result.enterprise,o.enterprise*(1+d.annual[0].wacc)**elapsed);
  assert.match(result.classification,/assumption, not observed/);
 }
});

test('timing: elapsed first-year FCFF is removed once; remaining future payments retain their payment dates',()=>{
 const d=researchDraftFor(byTicker('AAPL')),op=calculateResearchOperating(d);
 Object.assign(d.timing,{mode:'as-of-scenario',stubFCFF:12345,reason:'Explicit elapsed FCFF scenario'});
 const elapsed=(Date.parse(d.timing.asOf)-Date.parse(d.discountOrigin))/(365.25*86400000);
 const carry=(1+d.annual[0].wacc)**elapsed;
 const independentPV=(op.rows[0].fcff-12345)/(op.rows[0].discountFactor/carry)+op.rows.slice(1).reduce((s,r)=>s+r.fcff/(r.discountFactor/carry),0)+op.terminal.value/(op.terminal.discountFactor/carry);
 const result=researchTimingResult(d,op);close(result.enterprise,independentPV);close(result.removedPV,12345/(1+d.annual[0].wacc)*carry);
 d.timing.asOf='2027-10-17';assert.equal(researchTimingResult(d,op).status,'incomplete');
 d.timing.asOf='2026-10-16';assert.equal(researchTimingResult(d,op).status,'incomplete');
});

test('timing: AAOI and NBIS require the remaining pre-origin stub and one extra discount interval',()=>{
 for(const ticker of ['AAOI','NBIS']){
  const d=researchDraftFor(byTicker(ticker)),op=calculateResearchOperating(d);assert.equal(d.discountOrigin,'2026-12-31');
  Object.assign(d.timing,{mode:'as-of-scenario',stubFCFF:-350,stubDiscountRate:.17,reason:'Remaining October 17 to December 31 cash-use assumption'});
  const years=(Date.parse(d.discountOrigin)-Date.parse(d.timing.asOf))/(365.25*86400000);
  const result=researchTimingResult(d,op);close(result.enterprise,(op.enterprise-350)/(1.17**years));close(result.stubPV,-350/(1.17**years));
  assert.match(result.stubTreatment,/same extra stub discount interval/);
  for(const rate of [null,0,NaN]){d.timing.stubDiscountRate=rate;assert.equal(researchTimingResult(d,op).status,'incomplete');}
 }
});

test('export: source, draft, original operating result and normalization remain distinct',()=>{
 const c=byTicker('MU'),d=researchDraftFor(c),before=JSON.stringify({c,d}),e=exportResearchCase(d,c);
 assert.deepEqual(e.originalResearchCase,c);assert.deepEqual(e.draft,d);close(e.operating.enterprise,independent(c).enterprise);
 assert.equal(e.timing.status,'origin');assert.notEqual(e.sensitivity.normalized,e.sensitivity.base);
 e.originalResearchCase.annual[0].revenue=1;e.draft.annual[0].revenue=2;
 assert.equal(JSON.stringify({c,d}),before);
});
