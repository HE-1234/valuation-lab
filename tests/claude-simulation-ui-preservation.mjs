import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// This is the newest, exact UI-only reversal. It precedes the UMC mount repair
// without changing a single earlier fixture or permitting a path-prefix exception.
export const SIM_UI_BASE_COMMIT='475736665290662d1da7f8386fa1e014147bb3b4';
export const SIM_UI_SOURCE_COMMIT='a48377690a769e2211cd1f35a3671d740df9d9b4';
export const SIM_UI_SOURCE_PARENT='75ab7e5179370360781aa5fd732e0dbb3dd4bea6';
export const SIM_UI_FIXTURE_PATH='tests/fixtures/claude-simulation-ui-v83.json';
export const SIM_UI_MODIFIED_PATHS=Object.freeze([
 'dist/simulation-view.js',
 'dist/skins/report.css',
 'dist/skins/skin-motion.js',
]);
export const SIM_UI_ADDED_PATHS=Object.freeze(['dist/skins/report-mc-guide.js']);
// Independently retrieved, exact source-commit blobs. These are not regenerated
// from the working tree or accepted merely because a fixture names a commit.
export const SIM_UI_SOURCE_HASHES=Object.freeze({
 'dist/simulation-view.js':'595908374a5052af9f5d3bd1348bcd9a6c000471d2a960c03e5b515a6839b602',
 'dist/skins/report-mc-guide.js':'29d2f13b9333a668d140980778fae8d5f676ce41ed036476fa85769e3303bac2',
 'dist/skins/report.css':'f1a4ae88fb43848aebaf2996979bb063d5be353fd32400a14c498a7388ca7fdb',
 'dist/skins/skin-motion.js':'4049ace2268a6f0e980058d836e0ce570fb53b92a8d1a2c41cdf2f202ab14252',
});
// Reviewed final integration hashes are pinned independently of fixture content.
export const SIM_UI_REVIEWED_HASHES=Object.freeze({
 ...SIM_UI_SOURCE_HASHES,
 'dist/simulation-view.js':'3dbe421504e50b0a3fa4839e468a60138c24952be1b6c918a2a86aeb363c023d',
 'dist/skins/report-mc-guide.js':'19b447feedafefcca61cef93c7bbd6e387ac55b689bf5bef6e8015b3efd4cc53',
});
export const simulationUiSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export const simulationUiBlobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const exact=(value,keys)=>object(value)&&Reflect.ownKeys(value).length===keys.length&&keys.every(key=>own(value,key));
const hash=value=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
const productionPath=value=>typeof value==='string'&&value.startsWith('dist/')&&!/[\\\0\r\n]/.test(value)&&value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');
const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:64*1024*1024});
let cachedBaseEntries;
function sourceEntries(){
 if(!cachedBaseEntries){
  assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1','UI preservation requires the pinned Git blob format');
  assert.equal(git('rev-parse',SIM_UI_BASE_COMMIT+'^{commit}').toString().trim(),SIM_UI_BASE_COMMIT,'UI baseline must be the exact immutable published commit');
  cachedBaseEntries=new Map(git('ls-tree','-r','-z','--full-tree',SIM_UI_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{
   const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' '),path=row.slice(tab+1);
   assert.ok(productionPath(path),'Baseline source must use an exact normalized dist path');
   assert.equal(type,'blob');assert.ok(['100644','100755'].includes(mode));assert.match(oid,/^[0-9a-f]{40}$/);
   return [path,Object.freeze({mode,oid})];
  }));
  assert.equal(cachedBaseEntries.size,848,'All 848 published production paths must be present');
 }
 return cachedBaseEntries;
}
export function simulationUiBaseEntries(){return new Map(sourceEntries());}
export function validateSimulationUiFixture(fixture){
 assert.ok(exact(fixture,['baseCommit','sourceCommit','sourceParent','sourceHashes','files','additions']),'Simulation UI fixture requires only immutable source pins, exact files and additions');
 assert.equal(fixture.baseCommit,SIM_UI_BASE_COMMIT);assert.equal(fixture.sourceCommit,SIM_UI_SOURCE_COMMIT);assert.equal(fixture.sourceParent,SIM_UI_SOURCE_PARENT);
 assert.ok(exact(fixture.sourceHashes,Object.keys(SIM_UI_SOURCE_HASHES)),'Only the four exact upstream paths may appear');
 for(const [path,sha]of Object.entries(SIM_UI_SOURCE_HASHES))assert.equal(fixture.sourceHashes[path],sha,path+' exact independently retrieved upstream hash');
 assert.ok(exact(fixture.files,SIM_UI_MODIFIED_PATHS),'Only the three exact reviewed modified paths are permitted');
 assert.ok(exact(fixture.additions,SIM_UI_ADDED_PATHS),'Only the one exact reviewed added path is permitted');
 const baseline=sourceEntries();
 for(const [path,item]of Object.entries(fixture.files)){
  assert.ok(productionPath(path)&&baseline.has(path),path+' must be an existing exact normalized dist path');
  assert.ok(exact(item,['beforeText','beforeSHA256','afterSHA256']),path+' requires only exact before text and before/after hashes');
  assert.ok(typeof item.beforeText==='string'&&hash(item.beforeSHA256)&&hash(item.afterSHA256));
  const before=Buffer.from(item.beforeText,'utf8');assert.equal(before.toString('utf8'),item.beforeText,'Before text must round-trip exactly');
  assert.equal(simulationUiSHA(before),item.beforeSHA256,path+' exact before hash');
  assert.equal(simulationUiBlobSHA(before),baseline.get(path).oid,path+' before text must equal the immutable published Git blob');
  assert.equal(item.afterSHA256,SIM_UI_REVIEWED_HASHES[path],path+' independently pinned exact reviewed after hash');
  assert.notEqual(item.beforeSHA256,item.afterSHA256,path+' must be a modification, not an allowance');
 }
 for(const [path,sha]of Object.entries(fixture.additions)){
  assert.ok(productionPath(path)&&!baseline.has(path),path+' must be an exact new dist path');
  assert.ok(hash(sha));assert.equal(sha,SIM_UI_REVIEWED_HASHES[path],path+' independently pinned exact reviewed added hash');
 }
 return fixture;
}
let cachedFixture;
export function simulationUiFixture(){
 if(!cachedFixture){
  const value=validateSimulationUiFixture(JSON.parse(fs.readFileSync(new URL('../'+SIM_UI_FIXTURE_PATH,import.meta.url),'utf8')));
  for(const item of Object.values(value.files))Object.freeze(item);
  Object.freeze(value.files);Object.freeze(value.additions);Object.freeze(value.sourceHashes);cachedFixture=Object.freeze(value);
 }
 return cachedFixture;
}
export function reverseClaudeSimulationUi(path,bytes,earlierContext=''){
 assert.ok(productionPath(path),String(path)+' must be an exact normalized dist path');
 assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');
 const fixture=simulationUiFixture(),message=path+' exact reviewed Claude simulation UI bytes'+earlierContext;
 if(own(fixture.files,path)){
  const item=fixture.files[path];assert.equal(simulationUiSHA(bytes),item.afterSHA256,message);
  return Buffer.from(item.beforeText,'utf8');
 }
 if(own(fixture.additions,path))assert.equal(simulationUiSHA(bytes),fixture.additions[path],message+'; exact reviewed Claude simulation UI addition bytes');
 // Additions remain available to the app. Exact tree membership and hash tests
 // account for them separately; an unlisted path is never silently removed.
 return bytes;
}
