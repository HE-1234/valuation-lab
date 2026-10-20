import {reverseNativeGuideFix} from './native-guide-layout-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {
 LATEST_UI_BASE_COMMIT,LATEST_UI_SOURCE_COMMIT,LATEST_UI_SOURCE_BASE,
 LATEST_UI_FILES,LATEST_UI_PATHS,LATEST_UI_COMPATIBILITY,LATEST_UI_COMPATIBILITY_FILES,LATEST_UI_MODIFIED_PATHS,
 latestUiSHA,latestUiBlobSHA,latestUiBaseEntries,latestUiUpstreamBytes,latestUiCompatibilityBaseBytes,reverseLatestUserUi,
} from './latest-user-ui-preservation.mjs';
import {COMPANY_COPY_FILES,reverseCompanyPeriodCopy} from './company-period-copy-preservation.mjs';
import {GEOMETRY_FILES,reverseChartTrialGeometry} from './chart-trial-geometry-preservation.mjs';
import {NFLX_BASE_COMMIT,reverseNflxIntegration} from './nflx-integration-preservation.mjs';

const root=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL(p,root));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const paths=[
 'dist/approved-charts.js','dist/guided-localization.js','dist/historical-workspace.js',
 'dist/skins/report-interactions.js','dist/skins/report-journey.js',
 'dist/skins/report-mc-guide.js','dist/skins/report.css',
];
// These source blob IDs are the exact GitHub commit-tree entries retrieved for
// c8ec118, independent of current production bytes or the published V86 baseline.
const upstreamBlobs={
 'dist/approved-charts.js':'29c533cf5c9ab3abbd1a72cfd31117aa0cfde5c3',
 'dist/guided-localization.js':'ca9c4644118baea443a5d2ba349856ea4d153739',
 'dist/historical-workspace.js':'78cf748cff4cdf9cfee2e4c9dacff18f524552e7',
 'dist/skins/report-interactions.js':'fd702f973fb04947078676b4ea44a3106b46dbf2',
 'dist/skins/report-journey.js':'c1c1e5d0a451d05c5a504d13529baaf7f46a133e',
 'dist/skins/report-mc-guide.js':'00c8924575e42cc52dab0522f0c535e30d5c621c',
 'dist/skins/report.css':'59c3fc679893646e6db0fab33b806148d34f7126',
};
function files(relative){
 assert.ok(!fs.lstatSync(new URL(relative,root)).isSymbolicLink(),relative+' cannot be a symlink');
 return fs.readdirSync(new URL(relative,root),{withFileTypes:true}).flatMap(e=>{
  const p=relative+'/'+e.name;assert.ok(!e.isSymbolicLink(),p+' cannot be a symlink');
  if(e.isDirectory())return files(p);assert.ok(e.isFile(),p+' must be regular');return [p];
 }).sort();
}
const altered=b=>{const out=Buffer.from(b);out[Math.floor(out.length/2)]^=1;return out;};
function verifyTree(current,readBytes=read){
 const baseline=latestUiBaseEntries();
 assert.deepEqual(current,[...baseline.keys()].sort(),'Exact 979-path production tree membership');
 for(const [p,{oid}]of baseline)assert.equal(latestUiBlobSHA(reverseCompanyPeriodCopy(p,readBytes(p))),oid,p+' exact immutable V86 source blob');
}

test('latest user UI pins immutable V86 and seven exact upstream Git blobs, source hashes and reviewed hashes',()=>{
 assert.equal(LATEST_UI_BASE_COMMIT,'fda9fcfa566d174e97924305b4ff3f6b7daabd4d');
 assert.equal(LATEST_UI_SOURCE_COMMIT,'c8ec118ae7ff2538a70a95b274632f78b836e4c5');
 assert.equal(LATEST_UI_SOURCE_BASE,'223174cb067ff23289e4412b5786810b3a18076e');
 assert.equal(git('rev-parse',LATEST_UI_BASE_COMMIT+'^{commit}').toString().trim(),LATEST_UI_BASE_COMMIT);
 assert.deepEqual(LATEST_UI_PATHS,paths);assert.deepEqual(Object.keys(LATEST_UI_FILES),paths);
 for(const value of [LATEST_UI_PATHS,LATEST_UI_FILES,LATEST_UI_COMPATIBILITY,...Object.values(LATEST_UI_FILES)])assert.ok(Object.isFrozen(value));
 for(const [p,item]of Object.entries(LATEST_UI_FILES)){
  assert.deepEqual(Object.keys(item),['mode','baseBlob','beforeSHA256','sourceBlob','sourceSHA256','afterSHA256']);
  assert.equal(item.mode,'100644');assert.equal(item.sourceBlob,upstreamBlobs[p]);
  for(const k of ['beforeSHA256','sourceSHA256','afterSHA256'])assert.match(item[k],/^[0-9a-f]{64}$/);
  for(const k of ['baseBlob','sourceBlob'])assert.match(item[k],/^[0-9a-f]{40}$/);
  assert.notEqual(item.beforeSHA256,item.afterSHA256);
  const current=read(p),stable=reverseNativeGuideFix(p,current),before=git('show',LATEST_UI_BASE_COMMIT+':'+p),upstream=latestUiUpstreamBytes(p,stable);
  assert.equal(latestUiSHA(stable),item.afterSHA256);assert.equal(latestUiSHA(before),item.beforeSHA256);
  assert.equal(latestUiBlobSHA(before),item.baseBlob);assert.equal(latestUiBlobSHA(upstream),upstreamBlobs[p]);
  assert.equal(latestUiSHA(upstream),item.sourceSHA256);assert.deepEqual(reverseLatestUserUi(p,current),before);
 }
});

test('latest user UI retains every upstream byte except exact reviewed compatibility overlays',()=>{
 assert.ok(Object.hasOwn(LATEST_UI_COMPATIBILITY,'dist/skins/report.css'));
 assert.strictEqual(LATEST_UI_COMPATIBILITY['dist/skins/report.css'],GEOMETRY_FILES['dist/skins/report.css'].repairs,'The retained V86 mobile-trial overlay is the original immutable repair');
 for(const p of paths){
  const current=reverseNativeGuideFix(p,read(p));
  let expected=latestUiUpstreamBytes(p,current).toString('utf8');
  const repairs=LATEST_UI_COMPATIBILITY[p]??[];
  if(!repairs.length)assert.deepEqual(Buffer.from(expected),current,p+' exact unmodified upstream bytes');
  for(const repair of [...repairs].reverse()){
   assert.ok(Object.isFrozen(repair));assert.notEqual(repair.before,repair.after);
   assert.equal(expected.split(repair.before).length-1,1,p+' one exact upstream repair target');
   expected=expected.replace(repair.before,repair.after);
  }
  assert.deepEqual(Buffer.from(expected),current,p+' exact upstream plus reviewed compatibility only');
 }
});

test('latest user UI and reviewed company copy retain all 979 production paths, modes and all 62 old fixtures',()=>{
 const current=files('dist'),baseline=latestUiBaseEntries();assert.equal(current.length,979);assert.equal(baseline.size,979);verifyTree(current);
 for(const [p,{mode}]of baseline)assert.equal(fs.statSync(new URL(p,root)).mode&0o111,mode==='100755'?0o111:0,p+' exact V86 executable mode');
 const fixtures=git('ls-tree','-r','-z','--full-tree',LATEST_UI_BASE_COMMIT,'--','tests/fixtures').toString().split('\0').filter(Boolean).map(row=>{
  const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' ');assert.equal(type,'blob');return {path:row.slice(tab+1),mode,oid};
 });
 assert.equal(fixtures.length,62);assert.deepEqual(files('tests/fixtures'),fixtures.map(x=>x.path).sort());
 for(const {path,mode,oid}of fixtures){assert.equal(latestUiBlobSHA(read(path)),oid,path+' untouched old fixture bytes');assert.equal(fs.statSync(new URL(path,root)).mode&0o111,mode==='100755'?0o111:0,path+' frozen fixture mode');}
 const modified=[...LATEST_UI_MODIFIED_PATHS,...Object.keys(COMPANY_COPY_FILES)].sort();
 const actual=[...baseline].filter(([p,{oid}])=>latestUiBlobSHA(read(p))!==oid).map(([p])=>p).sort();assert.deepEqual(actual,modified,'Only seven latest UI files, one compatibility-only file and one independently reviewed company-copy file change');
});

test('latest user UI rejects mutations, omissions, restored-source substitutions and double reversal at every changed path',()=>{
 for(const p of LATEST_UI_MODIFIED_PATHS){
  const good=read(p),stable=reverseNativeGuideFix(p,good),before=git('show',LATEST_UI_BASE_COMMIT+':'+p);
  const bad=[altered(good),Buffer.concat([good,Buffer.from('\n')]),good.subarray(0,good.length-1),Buffer.alloc(0),before];
  for(const repair of LATEST_UI_COMPATIBILITY[p]??[])bad.push(Buffer.from(stable.toString().replace(repair.after,repair.before)),Buffer.from(stable.toString().replace(repair.after,repair.after+repair.after)));
  for(const bytes of bad){assert.throws(()=>reverseLatestUserUi(p,bytes),/exact reviewed latest user UI bytes/);assert.throws(()=>reverseNflxIntegration(p,bytes),/exact reviewed latest user UI bytes/);}
  assert.throws(()=>reverseLatestUserUi(p,reverseLatestUserUi(p,good)),/exact reviewed latest user UI bytes/);
  for(const other of LATEST_UI_MODIFIED_PATHS.filter(x=>x!==p))assert.throws(()=>reverseLatestUserUi(other,good),/exact reviewed latest user UI bytes/,'Valid source bytes cannot be moved to another UI path');
 }
});

test('latest user UI rejects malformed paths and non-Buffer inputs, with no mutable baseline cache escape',()=>{
 const good=read(paths[0]);
 for(const p of ['approved-charts.js','/dist/approved-charts.js','../dist/approved-charts.js','dist//approved-charts.js','dist/./approved-charts.js','dist/../approved-charts.js','dist/','dist\\approved-charts.js','dist/x\0x','dist/x\nx','dist/x\rx','tests/ignored.js','dist','',null,42])assert.throws(()=>reverseLatestUserUi(p,good),/exact normalized dist path/);
 for(const p of [...LATEST_UI_MODIFIED_PATHS,'dist/engine.js'])for(const bytes of [good.toString(),new Uint8Array(good),null,{},42])assert.throws(()=>reverseLatestUserUi(p,bytes),/exact production bytes/);
 assert.throws(()=>latestUiUpstreamBytes('dist/engine.js',read('dist/engine.js')),/seven exact latest UI paths/);
 const snapshot=latestUiBaseEntries();snapshot.clear();assert.equal(latestUiBaseEntries().size,979);
 const restored=reverseLatestUserUi(paths[0],good);restored.fill(0);assert.deepEqual(reverseLatestUserUi(paths[0],good),git('show',LATEST_UI_BASE_COMMIT+':'+paths[0]));
 const p='dist/engine.js',bytes=read(p);assert.strictEqual(reverseLatestUserUi(p,bytes),bytes);
});

test('latest user UI tree proof rejects missing, extra and mutated untouched production bytes',()=>{
 const current=files('dist');
 for(const p of [...LATEST_UI_MODIFIED_PATHS,'dist/engine.js','dist/research-view.js'])assert.throws(()=>verifyTree(current.filter(x=>x!==p)),/Exact 979-path production tree membership/);
 for(const p of ['dist/unreviewed.js','dist/skins/report-mc-guide-copy.js'])assert.throws(()=>verifyTree([...current,p].sort()),/Exact 979-path production tree membership/);
 const p='dist/engine.js',b=read(p);assert.throws(()=>verifyTree(current,x=>x===p?altered(b):read(x)),/exact immutable V86 source blob/);
 for(const p of LATEST_UI_MODIFIED_PATHS)assert.throws(()=>verifyTree(current,x=>x===p?altered(read(p)):read(x)),/exact reviewed latest user UI bytes/);
});

test('latest UI reverses exactly once before company copy, geometry and the unchanged Netflix gate',()=>{
 const copy=read('tests/company-period-copy-preservation.mjs').toString(),uiCall='bytes=reverseLatestUserUi(path,bytes,earlierContext);';
 assert.equal(copy.split(uiCall).length-1,1);assert.ok(copy.indexOf(uiCall)<copy.indexOf('const f=COMPANY_COPY_FILES[path]'));
 const nflx=read('tests/nflx-integration-preservation.mjs').toString(),copyCall='bytes=reverseCompanyPeriodCopy(path,bytes,earlierContext);',geometryCall='bytes=reverseChartTrialGeometry(path,bytes,earlierContext);';
 assert.equal(nflx.split(copyCall).length-1,1);assert.equal(nflx.split(geometryCall).length-1,1);assert.ok(nflx.indexOf(copyCall)<nflx.indexOf(geometryCall));assert.ok(nflx.indexOf(geometryCall)<nflx.indexOf('const f=nflxFixture();'));
 assert.equal(nflx.replace("import {reverseCompanyPeriodCopy} from './company-period-copy-preservation.mjs';\n",'').replace(' '+copyCall+'\n',''),git('show',LATEST_UI_BASE_COMMIT+':tests/nflx-integration-preservation.mjs').toString(),'No old NFLX gate, hash, fixture or assertion was weakened');
 assert.deepEqual(read('tests/chart-trial-geometry-preservation.mjs'),git('show',LATEST_UI_BASE_COMMIT+':tests/chart-trial-geometry-preservation.mjs'),'Original geometry hash/repair helper remains byte-identical');
 for(const p of LATEST_UI_MODIFIED_PATHS)assert.deepEqual(reverseNflxIntegration(p,read(p)),git('show',NFLX_BASE_COMMIT+':'+p),p+' exact earlier UI reaches the original Netflix gate');
 for(const p of Object.keys(GEOMETRY_FILES))assert.deepEqual(reverseChartTrialGeometry(p,reverseCompanyPeriodCopy(p,read(p))),git('show',NFLX_BASE_COMMIT+':'+p),p+' only exact new UI, copy and geometry reverse');
});


test('compatibility-only invalid-state binding repair is exactly one V86 line, separately from the seven upstream files',()=>{
 const p='dist/simulation-view.js',item=LATEST_UI_COMPATIBILITY_FILES[p];
 assert.deepEqual(Object.keys(LATEST_UI_COMPATIBILITY_FILES),[p]);assert.deepEqual(LATEST_UI_MODIFIED_PATHS,[...paths,p]);
 assert.ok(Object.isFrozen(LATEST_UI_COMPATIBILITY_FILES)&&Object.isFrozen(item));
 assert.deepEqual(Object.keys(item),['mode','baseBlob','beforeSHA256','afterSHA256']);assert.equal(item.mode,'100644');
 const repairs=LATEST_UI_COMPATIBILITY[p];assert.ok(Object.isFrozen(repairs));assert.equal(repairs.length,1);assert.ok(Object.isFrozen(repairs[0]));
 assert.equal(repairs[0].before,"simMessage(find('#mc-output'),'simulationManual.invalid');publish('settings',false);");
 assert.equal(repairs[0].after,"simMessage(find('#mc-output').firstElementChild,'simulationManual.invalid');publish('settings',false);");
 const before=git('show',LATEST_UI_BASE_COMMIT+':'+p),current=read(p);
 assert.equal(before.toString().split(repairs[0].before).length-1,1);
 assert.deepEqual(Buffer.from(before.toString().replace(repairs[0].before,repairs[0].after)),current);
 assert.deepEqual(latestUiCompatibilityBaseBytes(p,current),before);assert.deepEqual(reverseLatestUserUi(p,current),before);
 assert.throws(()=>latestUiUpstreamBytes(p,current),/seven exact latest UI paths/);
 assert.throws(()=>latestUiCompatibilityBaseBytes(paths[0],read(paths[0])),/exact compatibility-only path/);
});

test('all published preservation helpers and assertions remain exact apart from explicit latest-layer read adapters',()=>{
 const published=git('ls-tree','-r','-z','--full-tree',LATEST_UI_BASE_COMMIT,'--','tests').toString().split('\0').filter(Boolean).map(row=>row.slice(row.indexOf('\t')+1)).filter(p=>/preservation(?:\.test)?\.mjs$/.test(p)||['tests/simulation-range-header.test.mjs','tests/simulation-help-navigation.test.mjs'].includes(p));
 const uiImport="import {reverseLatestUserUi} from './latest-user-ui-preservation.mjs';\n",copyImport="import {reverseCompanyPeriodCopy} from './company-period-copy-preservation.mjs';\n";
 for(const p of published){
  let current=read(p).toString();
  if(p==='tests/simulation-range-header.test.mjs')current=current.replace(uiImport,'').replace('stable=reverseChartTrialGeometry(RANGE_HEADER_PATH,reverseLatestUserUi(RANGE_HEADER_PATH,bytes))','stable=reverseChartTrialGeometry(RANGE_HEADER_PATH,bytes)');
  if(p==='tests/nflx-integration-preservation.mjs')current=current.replace(copyImport,'').replace(' bytes=reverseCompanyPeriodCopy(path,bytes,earlierContext);\n','');
  if(p==='tests/chart-trial-geometry-preservation.test.mjs')current=current.replace(uiImport,'').replace(copyImport,'').replace('const current=reverseLatestUserUi(p,read(p)),before=','const current=read(p),before=').replace('const good=reverseLatestUserUi(p,read(p)),changed=','const good=read(p),changed=').replace('fixtures after exact later copy reversal','fixtures').replace('reverseChartTrialGeometry(path,reverseCompanyPeriodCopy(path,read(path)))','reverseChartTrialGeometry(path,read(path))');
  if(['tests/mcd-integration-preservation.test.mjs','tests/uber-integration-preservation.test.mjs','tests/nflx-integration-preservation.test.mjs'].includes(p))current=current.replace(uiImport,'').replace('reverseChartTrialGeometry(p,reverseLatestUserUi(p,read(p)))','reverseChartTrialGeometry(p,read(p))');
  if(p==='tests/nflx-integration-preservation.test.mjs')current=current.replace(copyImport,'').replace('nflxSHA(reverseCompanyPeriodCopy(p,bytes))','nflxSHA(bytes)');
  if(p==='tests/ceva-rmbs-integration-preservation.test.mjs')current=current.replace(uiImport,'').replace('for(const p of declaredAdditions)assert.equal(cevaRmbsSHA(reverseLatestUserUi(p,read(p))),','for(const p of declaredAdditions)assert.equal(cevaRmbsSHA(read(p)),');
  if(p==='tests/claude-simulation-ui-preservation.test.mjs')current=current.replace(uiImport,'').replace('for(const p of SIM_UI_ADDED_PATHS){const bytes=read(p),prior=reverseLatestUserUi(p,bytes);assert.equal(simulationUiSHA(prior),f.additions[p]);assert.deepEqual(reverseClaudeSimulationUi(p,bytes),prior);}','for(const p of SIM_UI_ADDED_PATHS){const bytes=read(p);assert.equal(simulationUiSHA(bytes),f.additions[p]);assert.strictEqual(reverseClaudeSimulationUi(p,bytes),bytes);}');
  assert.equal(current,git('show',LATEST_UI_BASE_COMMIT+':'+p).toString(),p+' every old hash and assertion retained behind exact later-layer normalization');
 }
 assert.ok(published.length>50,'All published preservation helpers and test suites are covered');
});
