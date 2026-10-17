// Independent v8 regression contract. This is source/numerical QA, not browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {assumptionEvidence,assumptionHistoryKeys} from '../dist/assumption-history.js';
import {currentSnapshot,draftFor,calculateCurrent,currentIssues} from '../dist/current-model.js';
import {simulateCurrent} from '../dist/simulation.js';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url));
const json=path=>JSON.parse(read(path));
const manifest=JSON.parse(fs.readFileSync(new URL('./fixtures/v7-protected-source-manifest.json',import.meta.url)));

test('v8 QA: original 35 protected data files remain byte-identical to v7',()=>{
 assert.equal(Object.keys(manifest.data).length,35);
 for(const [file,sha] of Object.entries(manifest.data))assert.equal(createHash('sha256').update(read(file)).digest('hex'),sha,file);
});
test('v8 QA: deterministic engine remains byte-identical; UI and motion have explicit bounded contracts',()=>{
 assert.equal(Object.keys(manifest.core).length,3);
 for(const [file,sha] of Object.entries(manifest.core).filter(([file])=>!['dist/app.js','dist/motion.js'].includes(file)))assert.equal(createHash('sha256').update(read(file)).digest('hex'),sha,file);
});
// UI feedback explicitly authorizes navigation, Learn, and human-readable dates.
// Strip only those known presentation lines/wrappers, then pin every remaining
// app byte to pre-feedback v24. This is not a broad refresh of protected hashes.
test('feedback preservation: historical app logic outside authorized presentation stays exact',()=>{
 // Approved 2026-10-17 redesign changes only these theme presentation literals.
 // Reverse exactly those substitutions before comparing the SAME protected hash.
 const restoreApprovedThemePresentation=source=>source
  .replace("slate:'Ivory & Teal'","slate:'Slate & Blue'")
  .replace("slate:'#f8f7f2',midnight:'#142024'","slate:'#172b4a',midnight:'#111a29'");
 const normalize=source=>restoreApprovedThemePresentation(source).split('\n').filter(line=>line.trim()&&!line.startsWith('import {mountWorkspaceNavigation}')&&!line.startsWith('import {formatTimestamp}')&&!line.startsWith('import {mountLearning}')&&!line.startsWith('function quizzes()')&&!line.startsWith("document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=")&&!line.startsWith('const workspaceNavigation=')&&!line.startsWith('if(location.hash){document.querySelector')).join('\n').replace(/formatTimestamp\(([^)]+)\)/g,'$1');
 assert.equal(createHash('sha256').update(normalize(read('dist/app.js').toString())).digest('hex'),'3dd3826561e371f46b58af041b8088e69b20add0aae3bebb72cb03737360f6cc');
});
test('v8 QA: prior annual economics remain fixed except the exact source-reviewed AAOI debt corrections',()=>{
 const history=json('dist/data/company-history.json'),corrections=JSON.parse(fs.readFileSync(new URL('./fixtures/v8-aaoi-source-corrections.json',import.meta.url)));let count=0,corrected=0;
 assert.equal(corrections.issuer,'AAOI');assert.equal(corrections.baselineCommit,manifest.baselineCommit);assert.deepEqual(corrections.corrections.map(r=>r.periodEnd),['2021-12-31','2022-12-31','2023-12-31','2024-12-31','2025-12-31']);
 const stable=x=>JSON.stringify(x,(_,v)=>v&&!Array.isArray(v)&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
 for(const [ticker,rows] of Object.entries(manifest.previousHistory))for(const [end,hash] of Object.entries(rows)){
  const r=history.companies[ticker].annual.find(r=>r.periodEnd===end);assert.ok(r,ticker+' '+end);
  const economic={facts:Object.fromEntries(Object.entries(r.facts).map(([k,v])=>[k,v.value])),metrics:Object.fromEntries(Object.entries(r.metrics).map(([k,m])=>[k,Object.fromEntries(['value','numerator','denominator','priorPeriodEnd'].filter(f=>f in m).map(f=>[f,m[f]]))]))};
  // Assert every audited replacement, reverse only those fields, then compare
  // against the unchanged original v7 hash. A broad hash refresh is forbidden.
  const correction=ticker==='AAOI'&&corrections.corrections.find(c=>c.periodEnd===end);
  if(correction){for(const change of correction.changes){
   assert.ok(change.path[0]==='facts'?['mappedDebt','bookCapitalProxy','convertibleSeniorNotesNoncurrent'].includes(change.path[1]):['bookSalesCapitalProxy','incrementalBookSalesCapitalProxy','bookROICProxy'].includes(change.path[1]),'non-capital change in debt correction');
   let target=economic;for(const part of change.path.slice(0,-1))target=target[part];const key=change.path.at(-1);
   assert.deepEqual(target[key],change.after,ticker+' '+end+' '+change.path.join('.'));
   if(change.absentBefore)delete target[key];else target[key]=change.before;
  }corrected++;}
  assert.equal(createHash('sha256').update(stable(economic)).digest('hex'),hash,ticker+' '+end+' changed prior reported values outside documented source corrections');count++;
 }
 assert.equal(count,68);assert.equal(corrected,5);
});
test('v8 QA: richer evidence cannot mutate assumptions or any supported valuation / seeded Monte Carlo result',()=>{
 const history=json('dist/data/company-history.json'),universe=json('dist/data/current-universe.json'),market=json('dist/data/current-market-references.json');
 const saved=JSON.stringify({history,universe,market});let supported=0;
 for(const c of universe.companies){
  const raw=c.snapshots.find(s=>s.id===c.currentSnapshotId),s=currentSnapshot(c,raw),d={...draftFor(c,raw),cutoff:universe.asOf},before=JSON.stringify(d);
  const blocked=currentIssues(s,d).length>0,valuation=blocked?null:calculateCurrent(s,d),simulation=blocked?null:simulateCurrent(s,d,{trials:7,seed:81227});
  for(const key of assumptionHistoryKeys)assumptionEvidence(history,c.ticker,key,{snapshot:s,marketReferences:market,cutoff:universe.asOf});
  assert.equal(JSON.stringify(d),before,c.ticker+' draft changed');
  if(blocked){assert.ok(['NBIS','TSM'].includes(c.ticker));assert.throws(()=>calculateCurrent(s,d));}
  else{assert.deepEqual(calculateCurrent(s,d),valuation,c.ticker);assert.deepEqual(simulateCurrent(s,d,{trials:7,seed:81227}),simulation,c.ticker);supported++;}
 }
 assert.equal(supported,12);assert.equal(JSON.stringify({history,universe,market}),saved);
});
