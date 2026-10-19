import {uberFixture,UBER_FIXTURE_PATH,UBER_ADDED_PATHS,reverseUberIntegration} from './uber-integration-preservation.mjs';
import {mcdFixture,MCD_FIXTURE_PATH} from './mcd-integration-preservation.mjs';
import {simulationUiFixture} from './claude-simulation-ui-preservation.mjs';
import {reverseUmcSimulationMount} from './umc-simulation-mount-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {UMC_BASE_COMMIT,UMC_MODIFIED_PATHS,UMC_ADDED_PATHS,umcSHA,umcBlobSHA,umcBaseEntries,umcFixture,validateUmcFixture,reverseUmcIntegration} from './umc-integration-preservation.mjs';
import {reverseCevaDelivery,CEVA_DELIVERY_BASE_COMMIT,cevaDeliveryFixture} from './ceva-delivery-preservation.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:32*1024*1024});
function altered(bytes){const copy=Buffer.from(bytes);if(copy.length)copy[Math.floor(copy.length/2)]^=1;else return Buffer.from('x');return copy;}
function filesUnder(relative){
 const output=[];assert.ok(!fs.lstatSync(path.join(root,relative)).isSymbolicLink(),relative+' cannot be a symlink');
 for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){
  const p=relative+'/'+entry.name;assert.ok(!entry.isSymbolicLink(),p+' cannot replace reviewed bytes with a symlink');
  if(entry.isDirectory())output.push(...filesUnder(p));else{assert.ok(entry.isFile(),p+' must be a regular production file');output.push(p);}
 }
 return output.sort();
}
function verifyWholeTree(current,readBytes=read){
 const fixture=umcFixture(),baseline=umcBaseEntries();
 assert.deepEqual(current,[...baseline.keys(),...Object.keys(fixture.additions),...Object.keys(uberFixture().additions),...Object.keys(mcdFixture().additions),...Object.keys(simulationUiFixture().additions)].sort(),'Every production path must be in immutable V81 or individually pinned as an addition; no missing or unlisted paths');
 for(const [p,entry]of baseline)assert.equal(umcBlobSHA(reverseUmcIntegration(p,readBytes(p))),entry.oid,p+' must reverse byte-for-byte to immutable V81; no undeclared mutations');
 for(const [p,sha]of Object.entries(fixture.additions))assert.equal(umcSHA(reverseUmcIntegration(p,readBytes(p))),sha,p+' exact individually reviewed addition');
 for(const [p,sha]of Object.entries({...uberFixture().additions,...mcdFixture().additions,...simulationUiFixture().additions}))assert.equal(umcSHA(reverseUmcIntegration(p,readBytes(p))),sha,p+' exact individually reviewed simulation UI addition');
}

test('UMC manifest strictly pins V81 source, exact ten modified paths and all 74 added paths',()=>{
 const f=umcFixture(),modified=UMC_MODIFIED_PATHS[0],added=UMC_ADDED_PATHS[0];
 assert.equal(validateUmcFixture(f),f);assert.equal(UMC_MODIFIED_PATHS.length,10);assert.equal(UMC_ADDED_PATHS.length,74);
 assert.deepEqual(Object.keys(f.files),UMC_MODIFIED_PATHS);assert.deepEqual(Object.keys(f.additions),UMC_ADDED_PATHS);
 assert.ok(Object.isFrozen(f)&&Object.isFrozen(f.files)&&Object.isFrozen(f.additions));for(const item of Object.values(f.files))assert.ok(Object.isFrozen(item));
 const mutations=[
  f=>{f.baseCommit='cf3641e';},f=>{f.baseCommit=CEVA_DELIVERY_BASE_COMMIT;},f=>{f.allowlist=['dist'];},f=>{f.source='current';},
  f=>{f.files={};},f=>{f.additions={};},f=>{f.files=[];},f=>{f.additions=null;},f=>{delete f.files[modified];},f=>{delete f.additions[added];},
  f=>{f.files[modified].beforeText+='mutation';},f=>{f.files[modified].beforeText+='mutation';f.files[modified].beforeSHA256=umcSHA(f.files[modified].beforeText);},
  f=>{f.files[modified].beforeText=f.files[UMC_MODIFIED_PATHS[1]].beforeText;f.files[modified].beforeSHA256=umcSHA(f.files[modified].beforeText);},
  f=>{f.files[modified].beforeText=42;},f=>{f.files[modified].beforeSHA256='0'.repeat(64);},f=>{f.files[modified].afterSHA256=f.files[modified].beforeSHA256;},
  f=>{f.files[modified].afterSHA256='*';},f=>{f.files[modified].afterSHA256='A'.repeat(64);},f=>{f.files[modified].afterSHA256=42;},
  f=>{f.files[modified].ignored=true;},f=>{delete f.files[modified].beforeText;},f=>{f.files['dist/another.js']=structuredClone(f.files[modified]);},
  f=>{f.additions[modified]=umcSHA('x');},f=>{f.additions[added]='*';},f=>{f.additions[added]={sha256:umcSHA('x')};},
  f=>{f.additions[added]=null;},f=>{f.additions[added]='0'.repeat(63);},f=>{f.additions[added]='A'.repeat(64);},
  f=>{f.additions['dist/another.json']=f.additions[added];},f=>{Object.setPrototypeOf(f.files,{inherited:true});},
  f=>{f[Symbol('hiddenAllowance')]=true;},f=>{Object.defineProperty(f.files[modified],'ignored',{value:true});}
 ];
 for(const mutate of mutations){const changed=structuredClone(f);mutate(changed);assert.throws(()=>validateUmcFixture(changed));}
 for(const invalid of ['dist/../outside','dist//prefix','dist/./prefix','dist/','dist\\file','dist/file\0x','dist/file\nx','dist/file\rx','tests/ignored.js','/dist/file']){
  const changed=structuredClone(f);delete changed.additions[added];changed.additions[invalid]=f.additions[added];assert.throws(()=>validateUmcFixture(changed));
  assert.throws(()=>reverseUmcIntegration(invalid,Buffer.from('x')));
 }
 assert.throws(()=>reverseUmcIntegration(modified,'not a Buffer'));
});

test('UMC exact reversal uses immutable V81 originals and rejects every modified or added byte mutation',()=>{
 const fixture=umcFixture();assert.equal(git('rev-parse',UMC_BASE_COMMIT+'^{commit}').toString().trim(),UMC_BASE_COMMIT);
 for(const [p,item]of Object.entries(fixture.files)){
  const bytes=read(p),original=git('show',UMC_BASE_COMMIT+':'+p),before=reverseUmcIntegration(p,bytes);
  assert.equal(umcSHA(reverseUmcSimulationMount(p,bytes)),item.afterSHA256,p+' reviewed after hash');assert.equal(umcSHA(original),item.beforeSHA256,p+' immutable before hash');
  assert.deepEqual(Buffer.from(item.beforeText,'utf8'),original,p+' exact immutable beforeText');assert.deepEqual(before,original,p+' exact reversal');
  assert.throws(()=>reverseUmcIntegration(p,before),/exact reviewed UMC integration bytes/,p+' double reversal is forbidden');
 }
 for(const [p,sha]of Object.entries(fixture.additions)){
  const bytes=read(p);assert.equal(umcSHA(bytes),sha,p+' exact added hash');assert.strictEqual(reverseUmcIntegration(p,bytes),bytes,p+' validated additions remain available to the current app');
 }
 for(const p of [...Object.keys(fixture.files),...Object.keys(fixture.additions)]){
  const bytes=read(p);for(const changed of [Buffer.concat([bytes,Buffer.from('\n/* unrelated */')]),altered(bytes),bytes.subarray(0,Math.max(0,bytes.length-1))]){
   assert.ok(!changed.equals(bytes));assert.throws(()=>reverseUmcIntegration(p,changed),/exact reviewed UMC integration bytes/,p+' every mutation must fail');
  }
 }
});

test('UMC accounts for the entire production tree, including the one later UI addition, with immutable Git blob IDs and no broad allowances',()=>{
 const current=filesUnder('dist'),baseline=umcBaseEntries(),fixture=umcFixture();assert.equal(baseline.size,774);assert.equal(current.length,848+Object.keys(uberFixture().additions).length+Object.keys(mcdFixture().additions).length+Object.keys(simulationUiFixture().additions).length);verifyWholeTree(current);
 assert.deepEqual(current.filter(p=>!baseline.has(p)),[...UMC_ADDED_PATHS,...Object.keys(uberFixture().additions),...Object.keys(mcdFixture().additions),...Object.keys(simulationUiFixture().additions)].sort());
 for(const p of UMC_MODIFIED_PATHS)assert.ok(baseline.has(p));for(const p of UMC_ADDED_PATHS)assert.ok(!baseline.has(p));
 const unchanged=[...baseline.keys()].find(p=>!Object.hasOwn(fixture.files,p));assert.ok(unchanged);const bytes=read(unchanged);
 assert.strictEqual(reverseUmcIntegration(unchanged,bytes),bytes,'Unlisted paths are not normalized or hidden');
 for(const changed of [altered(bytes),Buffer.concat([bytes,Buffer.from('\nmutation')]),bytes.subarray(0,bytes.length-1)])assert.throws(()=>verifyWholeTree(current,p=>p===unchanged?changed:read(p)),/must reverse byte-for-byte to immutable V81/,'Unlisted byte mutations must fail pinned whole-tree verification');
 assert.throws(()=>verifyWholeTree([...current,'dist/unlisted-production.js'].sort()),/Every production path/,'An undeclared addition must fail tree membership');
 assert.throws(()=>verifyWholeTree(current.filter(p=>p!==unchanged)),/Every production path/,'A missing baseline file must fail tree membership');
 assert.throws(()=>verifyWholeTree(current.filter(p=>p!==UMC_ADDED_PATHS[0])),/Every production path/,'A missing reviewed addition must fail tree membership');
});

test('UMC is reversed exactly once before CEVA delivery and preserves every earlier fixture byte',()=>{
 const delivery=read('tests/ceva-delivery-preservation.mjs').toString();assert.equal(delivery.split('bytes=reverseUmcIntegration(path,bytes);').length-1,1);
 const p='dist/incremental-research.js',bytes=read(p),v81=reverseUmcIntegration(p,bytes),v80=reverseCevaDelivery(p,bytes);
 assert.equal(umcSHA(v81),cevaDeliveryFixture().files[p].afterSHA256,'UMC restores the exact reviewed CEVA delivery after hash');
 assert.deepEqual(v80,git('show',CEVA_DELIVERY_BASE_COMMIT+':'+p),'The existing chain still restores exact V80 bytes');
 const entries=git('ls-tree','-r','-z','--full-tree',UMC_BASE_COMMIT,'--','tests/fixtures').toString().split('\0').filter(Boolean);
 assert.ok(entries.length>30,'Earlier fixture verification must cover the original immutable fixtures');
 for(const row of entries){const tab=row.indexOf('\t'),[,type,oid]=row.slice(0,tab).split(' '),fixturePath=row.slice(tab+1);assert.equal(type,'blob');assert.equal(umcBlobSHA(read(fixturePath)),oid,fixturePath+' earlier fixture must stay byte-identical to immutable V81');}
});


test('UMC exact path guards reject legacy relative aliases rather than bypassing source validation',()=>{
 const bytes=read('dist/engine.js');
 for(const alias of ['engine.js','data/companies.json','cases.json','/dist/engine.js','../dist/engine.js','dist//engine.js','dist/../engine.js'])assert.throws(()=>reverseUmcIntegration(alias,bytes),/exact normalized dist path/,alias);
 assert.deepEqual(reverseUmcIntegration('dist/engine.js',bytes),bytes);
});
