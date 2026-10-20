import {reverseLatestUserUi} from './latest-user-ui-preservation.mjs';
import {reverseChartTrialGeometry} from './chart-trial-geometry-preservation.mjs';
import {nflxFixture,NFLX_FIXTURE_PATH,NFLX_ADDED_PATHS,reverseNflxIntegration} from './nflx-integration-preservation.mjs';
import {uberFixture,UBER_FIXTURE_PATH,UBER_ADDED_PATHS,reverseUberIntegration} from './uber-integration-preservation.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {MCD_BASE_COMMIT,MCD_FIXTURE_PATH,MCD_MODIFIED_PATHS,MCD_ADDED_PATHS,MCD_REVIEWED_HASHES,mcdSHA,mcdBlobSHA,mcdBaseEntries,mcdFixture,validateMcdFixture,reverseMcdIntegration} from './mcd-integration-preservation.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),read=p=>fs.readFileSync(path.join(root,p)),git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const addedFixtures=[MCD_FIXTURE_PATH,'tests/fixtures/mcd-prior33-final-ui.json',UBER_FIXTURE_PATH,'tests/fixtures/uber-prior34-mcd-v85.json',NFLX_FIXTURE_PATH,'tests/fixtures/nflx-prior35-mcd-uber-v85.json'];
function walk(relative){assert.ok(!fs.lstatSync(path.join(root,relative)).isSymbolicLink());return fs.readdirSync(path.join(root,relative),{withFileTypes:true}).flatMap(e=>{const p=relative+'/'+e.name;assert.ok(!e.isSymbolicLink(),p+' cannot be a symlink');if(e.isDirectory())return walk(p);assert.ok(e.isFile());return [p];}).sort();}
const altered=b=>{const c=Buffer.from(b);c[Math.floor(c.length/2)]^=1;return c;};
function verifyTree(current,readBytes=read){const baseline=mcdBaseEntries();assert.deepEqual(current,[...baseline.keys(),...MCD_ADDED_PATHS,...UBER_ADDED_PATHS,...NFLX_ADDED_PATHS].sort(),'Exact production tree membership');for(const[p,v]of baseline)assert.equal(mcdBlobSHA(reverseMcdIntegration(p,readBytes(p))),v.oid,p+' immutable baseline blob');for(const p of MCD_ADDED_PATHS)assert.equal(mcdSHA(reverseMcdIntegration(p,readBytes(p))),MCD_REVIEWED_HASHES[p],p+' exact addition');for(const p of UBER_ADDED_PATHS)assert.equal(mcdSHA(reverseMcdIntegration(p,readBytes(p))),uberFixture().additions[p],p+' exact Uber addition');for(const p of NFLX_ADDED_PATHS)assert.equal(mcdSHA(reverseMcdIntegration(p,readBytes(p))),nflxFixture().additions[p],p+' exact Netflix addition');}
test('MCD fixture pins immutable baseline and only thirteen modified plus forty-one added paths',()=>{
 const f=mcdFixture(),p=MCD_MODIFIED_PATHS[0],a=MCD_ADDED_PATHS[0];assert.equal(validateMcdFixture(f),f);assert.equal(MCD_MODIFIED_PATHS.length,13);assert.equal(MCD_ADDED_PATHS.length,41);assert.equal(git('rev-parse',MCD_BASE_COMMIT+'^{commit}').toString().trim(),MCD_BASE_COMMIT);
 for(const x of [f,f.files,f.additions,...Object.values(f.files)])assert.ok(Object.isFrozen(x));
 const mutations=[f=>{f.baseCommit='HEAD';},f=>{f.allowlist=['dist'];},f=>{delete f.files[p];},f=>{delete f.additions[a];},f=>{f.files=[];},f=>{f.additions={};},f=>{f.files[p].beforeText+='x';},f=>{f.files[p].beforeText+='x';f.files[p].beforeSHA256=mcdSHA(f.files[p].beforeText);},f=>{f.files[p].afterSHA256='0'.repeat(64);},f=>{f.files[p].ignored=true;},f=>{f.additions[a]='0'.repeat(64);},f=>{f.additions['dist/unknown.js']=f.additions[a];},f=>{f.files[p][Symbol('hidden')]=true;},f=>{Object.setPrototypeOf(f.files,{extra:1});}];
 for(const mutate of mutations){const bad=structuredClone(f);mutate(bad);assert.throws(()=>validateMcdFixture(bad));}
});
test('MCD exact reversal rejects modified, added, malformed and double-reversed bytes',()=>{
 const f=mcdFixture();for(const p of MCD_MODIFIED_PATHS){const bytes=read(p);assert.equal(mcdSHA(reverseUberIntegration(p,bytes)),f.files[p].afterSHA256);assert.deepEqual(reverseMcdIntegration(p,bytes),git('show',MCD_BASE_COMMIT+':'+p));assert.throws(()=>reverseMcdIntegration(p,Buffer.from(f.files[p].beforeText)),/exact reviewed MCD/);}
 for(const p of MCD_ADDED_PATHS)assert.strictEqual(reverseMcdIntegration(p,read(p)).toString(),read(p).toString());
 for(const p of [...MCD_MODIFIED_PATHS,...MCD_ADDED_PATHS]){const b=read(p);for(const bad of [altered(b),Buffer.concat([b,Buffer.from('\nmutation')]),b.subarray(0,b.length-1)])assert.throws(()=>reverseMcdIntegration(p,bad),/exact reviewed MCD/);}
 for(const p of ['dist/../x','dist//x','dist/./x','dist/','/dist/x','dist\\x','dist/x\0x','dist/x\nx','dist/x\rx','dist',null,42])assert.throws(()=>reverseMcdIntegration(p,Buffer.from('x')),/exact normalized dist path/);
 for(const b of ['x',new Uint8Array([1]),null])assert.throws(()=>reverseMcdIntegration('dist/engine.js',b),/exact production bytes/);
});
test('MCD preserves every prior production byte, mode, UI file and exact tree membership',()=>{
 const current=walk('dist'),baseline=mcdBaseEntries();verifyTree(current);assert.equal(current.length,baseline.size+41+UBER_ADDED_PATHS.length+NFLX_ADDED_PATHS.length);
 for(const [p,v]of baseline)assert.equal(fs.statSync(path.join(root,p)).mode&0o111,v.mode==='100755'?0o111:0,p+' executable mode');
 const p='dist/engine.js',b=read(p);assert.strictEqual(reverseMcdIntegration(p,b),b);assert.throws(()=>verifyTree(current,x=>x===p?altered(b):read(x)),/immutable baseline blob/);
 for(const missing of [p,MCD_MODIFIED_PATHS[0],MCD_ADDED_PATHS[0]])assert.throws(()=>verifyTree(current.filter(x=>x!==missing)),/Exact production tree/);assert.throws(()=>verifyTree([...current,'dist/unreviewed.js'].sort()),/Exact production tree/);
 const copy=mcdBaseEntries();copy.clear();assert.ok(mcdBaseEntries().size>800);
 for(const p of ['dist/index.html','dist/skins/report.css','dist/skins/report-mc-guide.js','dist/skins/skin-motion.js','dist/simulation-view.js'])assert.deepEqual(reverseChartTrialGeometry(p,reverseLatestUserUi(p,read(p))),git('show',MCD_BASE_COMMIT+':'+p),p+' final UI bytes unchanged after exact later geometry reversal');
});
test('MCD catalog append leaves all existing catalog bytes intact and old fixtures unchanged',()=>{
 const p='dist/data/atlas-company-catalog-v1.json',catalog=JSON.parse(reverseUberIntegration(p,read(p)));assert.equal(catalog.companies.filter(c=>c.ticker==='MCD').length,1);assert.equal(catalog.companies.at(-1).ticker,'MCD');catalog.companies.pop();assert.equal(JSON.stringify(catalog,null,2)+'\n',git('show',MCD_BASE_COMMIT+':'+p).toString(),'Removing only MCD reconstructs original bytes');
 const entries=git('ls-tree','-r','-z',MCD_BASE_COMMIT,'--','tests/fixtures').toString().split('\0').filter(Boolean).map(row=>{const [meta,p]=row.split('\t');return [p,meta.split(' ')[2]];});assert.deepEqual(walk('tests/fixtures'),[...entries.map(([p])=>p),...addedFixtures].sort());for(const[p,oid]of entries)assert.equal(mcdBlobSHA(read(p)),oid,p+' published fixture byte-preserved');
});

test('MCD is reversed exactly once before the later UI header repair and all earlier layers',()=>{
 const source=read('tests/simulation-range-header-preservation.mjs').toString(),call='bytes=reverseMcdIntegration(path,bytes,earlierContext);';assert.equal(source.split(call).length-1,1);assert.ok(source.indexOf(call)<source.indexOf('if(path!==RANGE_HEADER_PATH)'));
});
