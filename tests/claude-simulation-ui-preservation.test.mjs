import {reverseLatestUserUi} from './latest-user-ui-preservation.mjs';
import {nflxFixture,NFLX_FIXTURE_PATH,NFLX_ADDED_PATHS,reverseNflxIntegration} from './nflx-integration-preservation.mjs';
import {uberFixture,UBER_FIXTURE_PATH,UBER_ADDED_PATHS,reverseUberIntegration} from './uber-integration-preservation.mjs';
import {mcdFixture,MCD_FIXTURE_PATH,MCD_ADDED_PATHS,reverseMcdIntegration} from './mcd-integration-preservation.mjs';
import {reverseSimulationRangeHeader} from './simulation-range-header-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
 SIM_UI_BASE_COMMIT,SIM_UI_SOURCE_COMMIT,SIM_UI_SOURCE_PARENT,SIM_UI_FIXTURE_PATH,
 SIM_UI_MODIFIED_PATHS,SIM_UI_ADDED_PATHS,SIM_UI_SOURCE_HASHES,SIM_UI_REVIEWED_HASHES,
 simulationUiSHA,simulationUiBlobSHA,simulationUiBaseEntries,simulationUiFixture,
 validateSimulationUiFixture,reverseClaudeSimulationUi,
} from './claude-simulation-ui-preservation.mjs';
import {UMC_MC_BASE_COMMIT,UMC_MC_MODIFIED_PATH,reverseUmcSimulationMount} from './umc-simulation-mount-preservation.mjs';
import {UMC_BASE_COMMIT,reverseUmcIntegration} from './umc-integration-preservation.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
function filesUnder(relative){
 assert.ok(!fs.lstatSync(path.join(root,relative)).isSymbolicLink(),relative+' cannot be a symlink');
 return fs.readdirSync(path.join(root,relative),{withFileTypes:true}).flatMap(entry=>{
  const p=relative+'/'+entry.name;assert.ok(!entry.isSymbolicLink(),p+' cannot replace exact bytes with a symlink');
  if(entry.isDirectory())return filesUnder(p);
  assert.ok(entry.isFile(),p+' must be a regular file');return [p];
 }).sort();
}
function verifyWholeTree(current,readBytes=read){
 const baseline=simulationUiBaseEntries(),fixture=simulationUiFixture();
 assert.deepEqual(current,[...baseline.keys(),...SIM_UI_ADDED_PATHS,...MCD_ADDED_PATHS,...UBER_ADDED_PATHS,...NFLX_ADDED_PATHS].sort(),'Every production path must be immutable baseline or an exact reviewed UI/MCD/Uber addition');
 for(const [p,entry]of baseline)assert.equal(simulationUiBlobSHA(reverseClaudeSimulationUi(p,readBytes(p))),entry.oid,p+' must reverse byte-for-byte to immutable published baseline');
 for(const [p,sha]of Object.entries(fixture.additions))assert.equal(simulationUiSHA(reverseClaudeSimulationUi(p,readBytes(p))),sha,p+' exact added bytes');
}
function altered(bytes){const out=Buffer.from(bytes);out[Math.floor(out.length/2)]^=1;return out;}

test('Simulation UI fixture strictly pins immutable baseline, exact upstream commit and only three modified plus one added paths',()=>{
 const f=simulationUiFixture(),modified=SIM_UI_MODIFIED_PATHS[0],added=SIM_UI_ADDED_PATHS[0];
 assert.equal(validateSimulationUiFixture(f),f);
 assert.equal(f.baseCommit,'475736665290662d1da7f8386fa1e014147bb3b4');
 assert.equal(f.sourceCommit,'a48377690a769e2211cd1f35a3671d740df9d9b4');
 assert.equal(f.sourceParent,'75ab7e5179370360781aa5fd732e0dbb3dd4bea6');
 assert.equal(f.baseCommit,SIM_UI_BASE_COMMIT);assert.equal(f.sourceCommit,SIM_UI_SOURCE_COMMIT);assert.equal(f.sourceParent,SIM_UI_SOURCE_PARENT);
 assert.deepEqual(Object.keys(f.files),['dist/simulation-view.js','dist/skins/report.css','dist/skins/skin-motion.js']);
 assert.deepEqual(Object.keys(f.additions),['dist/skins/report-mc-guide.js']);
 assert.deepEqual(f.sourceHashes,{...SIM_UI_SOURCE_HASHES});
 for(const value of [f,f.files,f.additions,f.sourceHashes,...Object.values(f.files)])assert.ok(Object.isFrozen(value));
 const mutations=[
  f=>{f.baseCommit='4757366';},f=>{f.baseCommit=UMC_MC_BASE_COMMIT;},f=>{f.sourceCommit='a483776';},f=>{f.sourceParent='0'.repeat(40);},
  f=>{f.allowlist=['dist'];},f=>{f.files={};},f=>{f.additions={};},f=>{f.sourceHashes={};},f=>{f.files=[];},f=>{f.additions=null;},
  f=>{delete f.files[modified];},f=>{delete f.additions[added];},f=>{f.sourceHashes[added]='0'.repeat(64);},
  f=>{f.sourceHashes['dist/extra.js']=f.sourceHashes[added];},f=>{f.files[modified].beforeText+='mutation';},
  f=>{f.files[modified].beforeText+='mutation';f.files[modified].beforeSHA256=simulationUiSHA(f.files[modified].beforeText);},
  f=>{f.files[modified].beforeText=f.files[SIM_UI_MODIFIED_PATHS[1]].beforeText;f.files[modified].beforeSHA256=simulationUiSHA(f.files[modified].beforeText);},
  f=>{f.files[modified].beforeText=42;},f=>{f.files[modified].beforeSHA256='0'.repeat(64);},
  f=>{f.files[modified].afterSHA256=f.files[modified].beforeSHA256;},f=>{f.files[modified].afterSHA256='0'.repeat(64);},
  f=>{f.files[modified].afterSHA256='*';},f=>{f.files[modified].afterSHA256='A'.repeat(64);},f=>{f.files[modified].afterSHA256=42;},
  f=>{f.files[modified].ignored=true;},f=>{delete f.files[modified].beforeText;},f=>{f.files['dist/unreviewed.js']=structuredClone(f.files[modified]);},
  f=>{f.additions[modified]=simulationUiSHA('x');},f=>{f.additions[added]='0'.repeat(64);},f=>{f.additions[added]='*';},
  f=>{f.additions[added]={sha256:simulationUiSHA('x')};},f=>{f.additions[added]=null;},f=>{f.additions[added]='A'.repeat(64);},
  f=>{f.additions['dist/unreviewed.js']=f.additions[added];},f=>{Object.setPrototypeOf(f.files,{inherited:true});},
  f=>{f[Symbol('hiddenAllowance')]=true;},f=>{Object.defineProperty(f.files[modified],'ignored',{value:true});},
 ];
 for(const mutate of mutations){const bad=structuredClone(f);mutate(bad);assert.throws(()=>validateSimulationUiFixture(bad));}
});

test('Simulation UI helper rejects every noncanonical path and requires exact Buffer input',()=>{
 const bytes=read(SIM_UI_MODIFIED_PATHS[0]),f=simulationUiFixture();
 for(const p of ['simulation-view.js','skins/report-mc-guide.js','data/cases.json','/dist/simulation-view.js','../dist/simulation-view.js','dist//simulation-view.js','dist/./simulation-view.js','dist/../simulation-view.js','dist/','dist\\simulation-view.js','dist/file\0x','dist/file\nx','dist/file\rx','tests/ignored.js','',null,42]){
  assert.throws(()=>reverseClaudeSimulationUi(p,bytes),/exact normalized dist path/);
  const bad=structuredClone(f);delete bad.additions[SIM_UI_ADDED_PATHS[0]];bad.additions[p]=f.additions[SIM_UI_ADDED_PATHS[0]];assert.throws(()=>validateSimulationUiFixture(bad));
 }
 for(const p of [...SIM_UI_MODIFIED_PATHS,...SIM_UI_ADDED_PATHS,'dist/engine.js'])for(const bad of [bytes.toString(),new Uint8Array(bytes),null])assert.throws(()=>reverseClaudeSimulationUi(p,bad),/exact production bytes/);
});

test('Simulation UI reverses all reviewed modifications to immutable originals and rejects modified or added byte mutations',()=>{
 const f=simulationUiFixture();
 for(const [p,item]of Object.entries(f.files)){
  const bytes=read(p),original=git('show',SIM_UI_BASE_COMMIT+':'+p);
  assert.equal(simulationUiSHA(reverseSimulationRangeHeader(p,bytes)),SIM_UI_REVIEWED_HASHES[p]);assert.equal(simulationUiSHA(original),item.beforeSHA256);
  assert.deepEqual(Buffer.from(item.beforeText),original);assert.deepEqual(reverseClaudeSimulationUi(p,bytes),original);
  assert.throws(()=>reverseClaudeSimulationUi(p,original),/exact reviewed Claude simulation UI bytes/,'Double reversal is forbidden');
 }
 for(const p of SIM_UI_ADDED_PATHS){const bytes=read(p),prior=reverseLatestUserUi(p,bytes);assert.equal(simulationUiSHA(prior),f.additions[p]);assert.deepEqual(reverseClaudeSimulationUi(p,bytes),prior);}
 for(const p of [...SIM_UI_MODIFIED_PATHS,...SIM_UI_ADDED_PATHS]){
  const bytes=read(p);for(const changed of [altered(bytes),Buffer.concat([bytes,Buffer.from('\n/* unrelated */')]),bytes.subarray(0,bytes.length-1)])assert.throws(()=>reverseClaudeSimulationUi(p,changed),/exact reviewed Claude simulation UI bytes/,p+' every byte mutation must fail');
 }
});

test('Simulation UI accounts for all 849 production files and preserves all 848 baseline blobs without broad allowances',()=>{
 const current=filesUnder('dist'),baseline=simulationUiBaseEntries();assert.equal(baseline.size,848);assert.equal(current.length,849+MCD_ADDED_PATHS.length+UBER_ADDED_PATHS.length+NFLX_ADDED_PATHS.length);verifyWholeTree(current);
 assert.deepEqual(current.filter(p=>!baseline.has(p)),[...SIM_UI_ADDED_PATHS,...MCD_ADDED_PATHS,...UBER_ADDED_PATHS,...NFLX_ADDED_PATHS].sort());
 for(const [p,entry]of baseline)assert.equal(fs.statSync(path.join(root,p)).mode&0o111,entry.mode==='100755'?0o111:0,p+' executable mode stays unchanged');
 for(const p of SIM_UI_ADDED_PATHS)assert.equal(fs.statSync(path.join(root,p)).mode&0o111,0,p+' new UI script is nonexecutable');
 const unchanged='dist/engine.js',bytes=read(unchanged);assert.strictEqual(reverseClaudeSimulationUi(unchanged,bytes),bytes);
 for(const changed of [altered(bytes),Buffer.concat([bytes,Buffer.from('\nmutation')]),bytes.subarray(0,bytes.length-1)])assert.throws(()=>verifyWholeTree(current,p=>p===unchanged?changed:read(p)),/must reverse byte-for-byte to immutable published baseline/);
 for(const missing of [unchanged,...SIM_UI_MODIFIED_PATHS,...SIM_UI_ADDED_PATHS])assert.throws(()=>verifyWholeTree(current.filter(p=>p!==missing)),/Every production path/,'Missing baseline or reviewed addition must fail');
 for(const extra of ['dist/unreviewed.js','dist/skins/report-mc-guide-copy.js'])assert.throws(()=>verifyWholeTree([...current,extra].sort()),/Every production path/,'Extra production file must fail');
 const added=SIM_UI_ADDED_PATHS[0];assert.throws(()=>verifyWholeTree(current,p=>p===added?altered(read(p)):read(p)),/exact reviewed Claude simulation UI bytes/);
 const snapshot=simulationUiBaseEntries();snapshot.clear();assert.equal(simulationUiBaseEntries().size,848,'A caller cannot mutate the cached immutable baseline');
});

test('Simulation UI reversal runs exactly once before UMC mount and existing integration reversals',()=>{
 const helper=read('tests/umc-simulation-mount-preservation.mjs').toString(),call='bytes=reverseClaudeSimulationUi(path,bytes,earlierContext);';
 assert.equal(helper.split(call).length-1,1);assert.ok(helper.indexOf(call)<helper.indexOf('if(path!==UMC_MC_MODIFIED_PATH)'));
 for(const p of SIM_UI_MODIFIED_PATHS)assert.deepEqual(reverseUmcSimulationMount(p,read(p)),git('show',SIM_UI_BASE_COMMIT+':'+p),p+' UI reversal reaches UMC repair first');
 const p=UMC_MC_MODIFIED_PATH,bytes=read(p);
 assert.deepEqual(reverseClaudeSimulationUi(p,bytes),reverseMcdIntegration(p,bytes),'The UI layer cannot absorb the earlier mount repair after the newer MCD reversal');
 assert.deepEqual(reverseUmcSimulationMount(p,bytes),git('show',UMC_MC_BASE_COMMIT+':'+p));
 assert.deepEqual(reverseUmcIntegration(p,bytes),git('show',UMC_BASE_COMMIT+':'+p));
});

test('Simulation UI adds only its own fixture and retains every published earlier fixture byte',()=>{
 const rows=git('ls-tree','-r','-z','--full-tree',SIM_UI_BASE_COMMIT,'--','tests/fixtures').toString().split('\0').filter(Boolean);
 const entries=rows.map(row=>{const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' ');assert.equal(type,'blob');return [row.slice(tab+1),{mode,oid}];});
 assert.ok(entries.length>30);assert.deepEqual(filesUnder('tests/fixtures'),[...entries.map(([p])=>p),SIM_UI_FIXTURE_PATH,MCD_FIXTURE_PATH,'tests/fixtures/mcd-prior33-final-ui.json',UBER_FIXTURE_PATH,'tests/fixtures/uber-prior34-mcd-v85.json',NFLX_FIXTURE_PATH,'tests/fixtures/nflx-prior35-mcd-uber-v85.json'].sort());
 for(const [p,{oid}]of entries)assert.equal(simulationUiBlobSHA(read(p)),oid,p+' earlier immutable fixture stays byte-identical');
});

test('Final UI bytes differ from the exact upstream source only by the reviewed lifecycle, EV-unit and reduced-motion corrections',()=>{
 const corrections={
  'dist/simulation-view.js':[
   ["get running(){return !!runController;}", "running:!!runController"],
   [" let guideValid=true;\n", ""],
   ["const publish=(reason,valid=guideValid)=>{if(destroyed)return;guideValid=valid;", "const publish=(reason,valid=true)=>{if(destroyed)return;"],
   ["publish('settings',true);return true;", "publish('settings');return true;"],
   ["destroy.pending=()=>{pending();publish('pending',false);};", "destroy.pending=pending;"],
   ["const publish=(reason,valid=true)=>{if(destroyed)return;const guideResult=adapter?rawResult?.enterprise:result;", "const publish=(reason,valid=true)=>{if(destroyed)return;"],
   ["latest:guideResult?.accepted?{p10:guideResult.quantiles.p10,p50:guideResult.median,p90:guideResult.quantiles.p90,accepted:guideResult.accepted}:null", "latest:result?.accepted?{p10:result.quantiles.p10,p50:result.median,p90:result.quantiles.p90,accepted:result.accepted}:null"],
   ["const destroy=()=>{if(destroyed)return;publish('destroy',false);delete root.mcState;destroyed=true;", "const destroy=()=>{if(destroyed)return;destroyed=true;"],
   ["localizePresentation();publish('withheld',false);}", "localizePresentation();}"],
   ["pending(true);setRunning(true);\n", "pending(true);setRunning(true);publish('run');\n"],
   ["runController=new AbortController();publish('run');", "runController=new AbortController();"],
   ["simMessage(find('#mc-run-progress'),'simulationManual.cancelled');publish('cancel');", "simMessage(find('#mc-run-progress'),'simulationManual.cancelled');"],
  ],
  'dist/skins/report-mc-guide.js':[
   ["if (!visible(root)) { seen.delete(root); return; }", "if (!visible(root)) return;"],
   ["const val = s => r.basis === 'enterprise' ? s.enterprise : finite(s.perShare)", "const val = s => finite(s.perShare)"],
   ["behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'", "behavior: 'smooth'"],
   ["  if (st.reason === 'destroy') {\n    root.querySelector('.rx-mcg')?.setAttribute('hidden', '');\n    root.querySelector('.rx-mcg-back')?.remove();\n    setView(root, 'range');\n    views.delete(root); seen.delete(root);\n    clearTimeout(timers.get(root));\n    queue = queue.filter(q => q.st.mountId !== st.mountId);\n    if (busy?.key.startsWith(st.mountId)) busy.controller.abort();\n    return;\n  }\n", ""],
  ],
 };
 for(const [p,sourceHash]of Object.entries(SIM_UI_SOURCE_HASHES)){
  let restored=reverseSimulationRangeHeader(p,read(p)).toString('utf8');
  for(const [after,before]of corrections[p]??[]){assert.equal(restored.split(after).length-1,1,p+' each exact compatibility correction occurs once');restored=restored.replace(after,before);}
  assert.equal(simulationUiSHA(restored),sourceHash,p+' exact upstream bytes after reversing only explicit compatibility corrections');
 }
});
