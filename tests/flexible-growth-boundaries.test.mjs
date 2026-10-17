// Complementary independent QA: restoration, provenance, source gates and exact
// pre-feature economics. Numerical/path oracles live in the separately owned
// flexible-growth-oracle.test.mjs; these tests never derive goldens from new code.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {defaults} from '../dist/engine.js';
import {currentSnapshot,draftFor,safeDraft,currentIssues,calculateCurrent,freezeCurrent,loadResearchedBaseCase,markDraftEdited} from '../dist/current-model.js';
import {isUntouchedGenericDraft} from '../dist/base-cases.js';
import {simulateCurrent,simulationDefaults} from '../dist/simulation.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const universe=read('../dist/data/current-universe.json');
const research=read('../dist/data/company-base-cases.json');
// Captured by executing untouched commit 2fbb156 (v19) in an isolated /tmp tree,
// before applying the new profile implementation. Hashes cover complete results.
const goldens=read('./fixtures/flexible-v19-exact-goldens.json');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const saved=x=>JSON.parse(JSON.stringify(x));
function context(ticker='AAPL',{researched=true,id}={}){
 const company=universe.companies.find(c=>c.ticker===ticker);
 const raw=company.snapshots.find(r=>r.id===(id||company.currentSnapshotId));
 const snapshot=currentSnapshot(company,raw);
 const draft=draftFor(company,raw,researched?{baseCases:research}:{});
 draft.cutoff=universe.asOf;
 return {company,raw,snapshot,draft};
}
function flexible(ticker='AAPL',years=15,mode='annual',explicitYears=3){
 const c=context(ticker);
 c.draft.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode,explicitYears:mode==='immediate'?0:explicitYears,subsequentGrowth:mode==='annual'?[.16,.11,.09,.06].slice(0,explicitYears-1):[]};
 c.draft.assumptions.years=years;
 return c;
}

test('flexible boundaries: all 24 legacy generic/researched valuations and seeded simulations remain byte-identical to v19',()=>{
 assert.equal(goldens.length,24);
 for(const record of goldens){
  const {snapshot,draft}=context(record.ticker,{researched:record.kind==='research'});
  const config={...simulationDefaults(draft.assumptions),trials:31,seed:'v19-boundary-exact-'+record.ticker+'-'+record.kind};
  assert.equal(hash(calculateCurrent(snapshot,draft)),record.valuation,`${record.ticker} ${record.kind} valuation`);
  assert.equal(hash(simulateCurrent(snapshot,draft,config)),record.simulation,`${record.ticker} ${record.kind} simulation`);
 }
});

test('flexible boundaries: every profile and maturity restores without changing authored inputs or per-company claims',()=>{
 for(const ticker of ['AAPL','GOOG','AAOI'])for(const years of [10,15,20])for(const [mode,explicitYears] of [['immediate',0],['maintain',3],['maintain',5],['annual',3],['annual',5]]){
  const {company,raw,snapshot,draft}=flexible(ticker,years,mode,explicitYears);
  draft.notes={growth:'Keep the explicit annual thesis',profit:'Margin is a separate judgment'};
  draft.quote={price:111,date:universe.asOf,currency:'USD',sourceUrl:'https://example.com/synthetic-quote',basisConfirmed:false,shareBasis:'intentionally unmatched quote'};
  draft.simulationConfig={...simulationDefaults(draft.assumptions),seed:'keep-me',trials:23};
  draft.waccWorksheet.beta=1.234;markDraftEdited(draft,'operatingProfile');
  const source=saved(draft),before=JSON.stringify(source),restored=safeDraft(source,company,raw,{baseCases:research});
  for(const key of ['operatingProfile','assumptions','notes','quote','simulationConfig','waccWorksheet','claims'])assert.deepEqual(restored[key],source[key],`${ticker}/${years}/${mode}/${explicitYears}: ${key}`);
  assert.equal(JSON.stringify(source),before,'restore is non-mutating');
  assert.deepEqual(calculateCurrent(snapshot,restored),calculateCurrent(snapshot,draft));
  const frozen=freezeCurrent(snapshot,restored);
  assert.deepEqual(frozen.draft.operatingProfile,source.operatingProfile);
  assert.equal(frozen.draft.assumptions.years,years);
 }
});

test('flexible boundaries: restored profile objects and annual arrays are detached from the source draft',()=>{
 const {company,raw,draft}=flexible();
 const source=saved(draft),before=JSON.stringify(source),restored=safeDraft(source,company,raw,{baseCases:research});
 restored.operatingProfile.subsequentGrowth[0]=.8;
 restored.operatingProfile.mode='maintain';
 assert.equal(JSON.stringify(source),before);
});

test('flexible boundaries: saved flexible choices cannot silently upgrade to revised researched assumptions',()=>{
 for(const years of [10,15,20]){
  const {company,raw,draft}=flexible('AAPL',years,'maintain');
  const newer=structuredClone(research);newer.version='future-revision-test';newer.companies.AAPL.assumptions.growth=.9;
  assert.equal(isUntouchedGenericDraft(draft,company,raw),false);
  const restored=safeDraft(saved(draft),company,raw,{baseCases:newer});
  assert.deepEqual(restored.assumptions,draft.assumptions);assert.deepEqual(restored.operatingProfile,draft.operatingProfile);
  assert.equal(restored.assumptionProvenance.version,draft.assumptionProvenance.version);
 }
 const {company,raw,draft}=context('AAPL',{researched:false});
 draft.operatingProfile={schemaVersion:1,id:'flexible-growth-v1',mode:'maintain',explicitYears:3,subsequentGrowth:[]};
 assert.equal(isUntouchedGenericDraft(draft,company,raw),false);
 const restored=safeDraft(saved(draft),company,raw,{baseCases:research});
 assert.deepEqual(restored.assumptions,defaults);assert.equal(restored.assumptionProvenance.kind,'generic-default');
});

test('flexible boundaries: a selected flexible path is an authored edit even if scalar values still equal researched defaults',()=>{
 for(const [mode,explicitYears]of [['immediate',0],['maintain',3],['annual',5]]){
  const {company,raw,draft}=flexible('AAPL',10,mode,explicitYears);
  assert.equal(draft.assumptionProvenance.userEdited,false,'deliberately omit the UI edit marker');
  const restored=safeDraft(saved(draft),company,raw,{baseCases:research});
  assert.equal(restored.assumptionProvenance.userEdited,true,mode+' must not masquerade as an untouched sourced preset');
 }
});

test('flexible boundaries: omitted flexible scalar inputs remain invalid rather than becoming generic defaults',()=>{
 for(const key of Object.keys(defaults)){
  const {company,raw,snapshot,draft}=flexible();delete draft.assumptions[key];
  const restored=safeDraft(saved(draft),company,raw,{baseCases:research});
  assert.throws(()=>calculateCurrent(snapshot,restored),undefined,'missing '+key);
  assert.throws(()=>simulateCurrent(snapshot,restored,{trials:2}),undefined,'missing '+key+' MC');
 }
});

test('flexible boundaries: null, nonnumeric and nonfinite flexible scalar inputs remain invalid after JSON persistence',()=>{
 for(const key of Object.keys(defaults))for(const invalid of [null,'',String(defaults[key]),NaN,Infinity]){
  const {company,raw,snapshot,draft}=flexible();draft.assumptions[key]=invalid;
  const restored=safeDraft(saved(draft),company,raw,{baseCases:research});
  assert.throws(()=>calculateCurrent(snapshot,restored),undefined,`${key}=${invalid}`);
  assert.throws(()=>simulateCurrent(snapshot,restored,{trials:2}),undefined,`${key}=${invalid} MC`);
 }
});

test('flexible boundaries: invalid or missing normalization never silently becomes zero on direct use or restore',()=>{
 for(const invalid of [null,NaN,Infinity,'','0',undefined]){
  const {company,raw,snapshot,draft}=flexible();
  draft.normalizationDelta=invalid;
  // A retained explanation must not make an absent numeric adjustment valid.
  draft.adjustmentReason='Previously sourced adjustment';draft.adjustmentSource=raw.sourceUrl;
  if(invalid===undefined)delete draft.normalizationDelta;
  assert.throws(()=>calculateCurrent(snapshot,draft),undefined,'direct normalization '+invalid);
  const restored=safeDraft(saved(draft),company,raw,{baseCases:research});
  assert.throws(()=>calculateCurrent(snapshot,restored),undefined,'restored normalization '+invalid);
  assert.throws(()=>simulateCurrent(snapshot,restored,{trials:2}),undefined,'restored normalization '+invalid+' MC');
 }
});

test('flexible boundaries: finite assumptions that overflow cash flows cannot masquerade as zero equity',()=>{
 for(const [mode,explicitYears]of [['immediate',0],['maintain',3],['annual',5]]){
  const {company,raw,snapshot,draft}=flexible('AAPL',20,mode,explicitYears);
  draft.assumptions.salesCapital=1e-308;
  assert.throws(()=>calculateCurrent(snapshot,draft),/finite|overflow|scale|numeric/i,mode+' direct overflow');
  const restored=safeDraft(saved(draft),company,raw,{baseCases:research});
  assert.throws(()=>calculateCurrent(snapshot,restored),/finite|overflow|scale|numeric/i,mode+' restored overflow');
  assert.throws(()=>freezeCurrent(snapshot,restored),/finite|overflow|scale|numeric/i,mode+' export overflow');
  assert.throws(()=>simulateCurrent(snapshot,restored,{trials:2}),/finite|overflow|scale|numeric/i,mode+' simulation overflow');
 }
});

test('flexible boundaries: malformed saved profile shapes stay rejected without normalization or fallback',()=>{
 const mutations=[p=>{p.schemaVersion=2},p=>{p.mode='linear'},p=>{p.explicitYears=4},p=>{p.explicitYears='3'},p=>{p.subsequentGrowth=[.1]},p=>{p.subsequentGrowth=[.1,.2,.3]},p=>{p.subsequentGrowth=[null,.2]},p=>{p.subsequentGrowth=[.1,2.01]},p=>{p.subsequentGrowth=[-.51,.2]},p=>{p.unrecognized=true}];
 for(const mutate of mutations){
  const {company,raw,snapshot,draft}=flexible();mutate(draft.operatingProfile);
  const source=saved(draft),restored=safeDraft(source,company,raw,{baseCases:research});
  assert.deepEqual(restored.operatingProfile,source.operatingProfile);
  assert.ok(currentIssues(snapshot,restored).length);
  assert.throws(()=>calculateCurrent(snapshot,restored));assert.throws(()=>simulateCurrent(snapshot,restored,{trials:2}));
 }
});

test('flexible boundaries: explicit researched reload clears flexible economics and preserves unrelated authored work',()=>{
 for(const ticker of ['AAPL','GOOG','AAOI']){
  const {company,raw,snapshot,draft}=flexible(ticker,20,'annual',5);
  draft.notes.growth='Keep this thesis';draft.simulationConfig={...simulationDefaults(draft.assumptions),trials:7};
  const before=saved(draft),loaded=loadResearchedBaseCase(draft,company,raw,research),fresh=context(ticker).draft;
  assert.deepEqual(calculateCurrent(snapshot,loaded),calculateCurrent(snapshot,fresh));
  assert.deepEqual(loaded.assumptions,fresh.assumptions);assert.equal(loaded.assumptions.years,10);
  assert.equal(loaded.operatingProfile?.id,ticker==='AAOI'?'aaoi-capacity-ramp-v1':undefined);
  assert.deepEqual(loaded.notes,before.notes);assert.deepEqual(loaded.simulationConfig,before.simulationConfig);
  assert.deepEqual(saved(draft),before,'explicit reload leaves the undo source untouched');
  assert.deepEqual(safeDraft(before,company,raw,{baseCases:research}).operatingProfile,before.operatingProfile);
 }
});

test('flexible boundaries: old partial drafts retain legacy fill and authored ten-year economics',()=>{
 for(const ticker of ['AAPL','AAOI']){
  const {company,raw,snapshot,draft}=context(ticker,{researched:false});
  draft.assumptions={growth:.21};delete draft.assumptionProvenance;draft.notes.growth='Legacy work';
  const restored=safeDraft(saved(draft),company,raw,{baseCases:research});
  assert.deepEqual(restored.assumptions,{...defaults,growth:.21});assert.equal(restored.operatingProfile,undefined);
  assert.equal(restored.assumptionProvenance.kind,'user-draft');assert.deepEqual(restored.notes,draft.notes);
  assert.ok(Number.isFinite(calculateCurrent(snapshot,restored).perShare));
 }
});

test('flexible boundaries: cross-company or cross-baseline saved profiles cannot leak into fresh drafts',()=>{
 const prior=flexible('AAPL',20).draft;
 for(const ticker of ['MSFT','GOOG','AAOI']){
  const {company,raw,draft}=context(ticker),restored=safeDraft(saved(prior),company,raw,{baseCases:research});
  assert.deepEqual(restored.assumptions,draft.assumptions);assert.equal(restored.operatingProfile?.id,draft.operatingProfile?.id);
 }
 const {company}=context('AAPL');const alternate=company.snapshots.find(r=>r.id!==prior.snapshotId);
 if(alternate){const restored=safeDraft(saved(prior),company,alternate,{baseCases:research});assert.equal(restored.operatingProfile,undefined);assert.equal(restored.assumptions.years,10);}
});

test('flexible boundaries: source, date, specialist-model and claims gates survive the new profile',()=>{
 for(const ticker of ['NBIS','TSM']){const {snapshot,draft}=flexible(ticker);assert.throws(()=>calculateCurrent(snapshot,draft));assert.throws(()=>simulateCurrent(snapshot,draft,{trials:2}));}
 for(const ticker of ['AAOI','GOOG']){const {snapshot,draft}=flexible(ticker);delete draft.claims;assert.throws(()=>calculateCurrent(snapshot,draft),/claims|convertible|preferred/i);assert.throws(()=>simulateCurrent(snapshot,draft,{trials:2}),/claims|convertible|preferred/i);}
 const {snapshot,draft}=flexible();
 for(const patch of [{sourceUrl:''},{shareBasis:''},{snapshotMode:'latest-quarter'},{currency:''},{revenue:null},{modelType:'bank'}])assert.throws(()=>calculateCurrent({...snapshot,...patch},draft));
 assert.throws(()=>calculateCurrent(snapshot,{...draft,cutoff:'2000-01-01'}),/available|valuation date/);
});
