import {reverseLatestUserUi} from './latest-user-ui-preservation.mjs';
import {reverseCompanyPeriodCopy} from './company-period-copy-preservation.mjs';
import {reverseChartTrialGeometry} from './chart-trial-geometry-preservation.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {preservedV87Fs as fs} from './guided-company-preservation.mjs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {NFLX_BASE_COMMIT,NFLX_FIXTURE_PATH,NFLX_MODIFIED_PATHS,NFLX_ADDED_PATHS,NFLX_REVIEWED_HASHES,nflxSHA,nflxBlobSHA,nflxBaseEntries,nflxFixture,validateNflxFixture,reverseNflxIntegration} from './nflx-integration-preservation.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),read=p=>fs.readFileSync(path.join(root,p)),git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const addedFixtures=[NFLX_FIXTURE_PATH,'tests/fixtures/nflx-prior35-mcd-uber-v85.json'];
function walk(relative){assert.ok(!fs.lstatSync(path.join(root,relative)).isSymbolicLink());return fs.readdirSync(path.join(root,relative),{withFileTypes:true}).flatMap(e=>{const p=relative+'/'+e.name;assert.ok(!e.isSymbolicLink(),p+' cannot be a symlink');if(e.isDirectory())return walk(p);assert.ok(e.isFile());return [p];}).sort();}
const altered=b=>{const c=Buffer.from(b);c[Math.floor(c.length/2)]^=1;return c;};
function verifyTree(current,readBytes=read){const baseline=nflxBaseEntries();assert.deepEqual(current,[...baseline.keys(),...NFLX_ADDED_PATHS].sort(),'Exact production tree membership');for(const[p,v]of baseline)assert.equal(nflxBlobSHA(reverseNflxIntegration(p,readBytes(p))),v.oid,p+' immutable baseline blob');for(const p of NFLX_ADDED_PATHS)assert.equal(nflxSHA(reverseNflxIntegration(p,readBytes(p))),NFLX_REVIEWED_HASHES[p],p+' exact addition');}
test('NFLX fixture pins immutable baseline and only fourteen modified plus forty-five added paths',()=>{
 const f=nflxFixture(),p=NFLX_MODIFIED_PATHS[0],a=NFLX_ADDED_PATHS[0];assert.equal(validateNflxFixture(f),f);assert.equal(NFLX_MODIFIED_PATHS.length,14);assert.equal(NFLX_ADDED_PATHS.length,45);assert.equal(git('rev-parse',NFLX_BASE_COMMIT+'^{commit}').toString().trim(),NFLX_BASE_COMMIT);
 for(const x of [f,f.files,f.additions,...Object.values(f.files)])assert.ok(Object.isFrozen(x));
 const mutations=[f=>{f.baseCommit='HEAD';},f=>{f.allowlist=['dist'];},f=>{delete f.files[p];},f=>{delete f.additions[a];},f=>{f.files=[];},f=>{f.additions={};},f=>{f.files[p].beforeText+='x';},f=>{f.files[p].beforeText+='x';f.files[p].beforeSHA256=nflxSHA(f.files[p].beforeText);},f=>{f.files[p].afterSHA256='0'.repeat(64);},f=>{f.files[p].ignored=true;},f=>{f.additions[a]='0'.repeat(64);},f=>{f.additions['dist/unknown.js']=f.additions[a];},f=>{f.files[p][Symbol('hidden')]=true;},f=>{Object.setPrototypeOf(f.files,{extra:1});}];
 for(const mutate of mutations){const bad=structuredClone(f);mutate(bad);assert.throws(()=>validateNflxFixture(bad));}
});
test('NFLX exact reversal rejects modified, added, malformed and double-reversed bytes',()=>{
 const f=nflxFixture();for(const p of NFLX_MODIFIED_PATHS){const bytes=read(p);assert.equal(nflxSHA(reverseCompanyPeriodCopy(p,bytes)),f.files[p].afterSHA256);assert.deepEqual(reverseNflxIntegration(p,bytes),git('show',NFLX_BASE_COMMIT+':'+p));assert.throws(()=>reverseNflxIntegration(p,Buffer.from(f.files[p].beforeText)),/exact reviewed NFLX/);}
 for(const p of NFLX_ADDED_PATHS)assert.strictEqual(reverseNflxIntegration(p,read(p)).toString(),read(p).toString());
 for(const p of [...NFLX_MODIFIED_PATHS,...NFLX_ADDED_PATHS]){const b=read(p);for(const bad of [altered(b),Buffer.concat([b,Buffer.from('\nmutation')]),b.subarray(0,b.length-1)])assert.throws(()=>reverseNflxIntegration(p,bad),/exact reviewed NFLX/);}
 for(const p of ['dist/../x','dist//x','dist/./x','dist/','/dist/x','dist\\x','dist/x\0x','dist/x\nx','dist/x\rx','dist',null,42])assert.throws(()=>reverseNflxIntegration(p,Buffer.from('x')),/exact normalized dist path/);
 for(const b of ['x',new Uint8Array([1]),null])assert.throws(()=>reverseNflxIntegration('dist/engine.js',b),/exact production bytes/);
});
test('NFLX preserves every prior production byte, mode, UI file and exact tree membership',()=>{
 const current=walk('dist'),baseline=nflxBaseEntries();verifyTree(current);assert.equal(current.length,baseline.size+45);
 for(const [p,v]of baseline)assert.equal(fs.statSync(path.join(root,p)).mode&0o111,v.mode==='100755'?0o111:0,p+' executable mode');
 const p='dist/engine.js',b=read(p);assert.strictEqual(reverseNflxIntegration(p,b),b);assert.throws(()=>verifyTree(current,x=>x===p?altered(b):read(x)),/immutable baseline blob/);
 for(const missing of [p,NFLX_MODIFIED_PATHS[0],NFLX_ADDED_PATHS[0]])assert.throws(()=>verifyTree(current.filter(x=>x!==missing)),/Exact production tree/);assert.throws(()=>verifyTree([...current,'dist/unreviewed.js'].sort()),/Exact production tree/);
 const copy=nflxBaseEntries();copy.clear();assert.ok(nflxBaseEntries().size>800);
 for(const p of ['dist/index.html','dist/skins/report.css','dist/skins/report-mc-guide.js','dist/skins/skin-motion.js','dist/simulation-view.js'])assert.deepEqual(reverseChartTrialGeometry(p,reverseLatestUserUi(p,read(p))),git('show',NFLX_BASE_COMMIT+':'+p),p+' final UI bytes unchanged after exact later geometry reversal');
});
test('NFLX catalog append leaves all existing catalog bytes intact and old fixtures unchanged',()=>{
 const p='dist/data/atlas-company-catalog-v1.json',catalog=JSON.parse(read(p));assert.equal(catalog.companies.filter(c=>c.ticker==='NFLX').length,1);assert.equal(catalog.companies.at(-1).ticker,'NFLX');catalog.companies.pop();assert.equal(JSON.stringify(catalog,null,2)+'\n',git('show',NFLX_BASE_COMMIT+':'+p).toString(),'Removing only NFLX reconstructs original bytes');
 const entries=git('ls-tree','-r','-z',NFLX_BASE_COMMIT,'--','tests/fixtures').toString().split('\0').filter(Boolean).map(row=>{const [meta,p]=row.split('\t');return [p,meta.split(' ')[2]];});assert.deepEqual(walk('tests/fixtures'),[...entries.map(([p])=>p),...addedFixtures].sort());for(const[p,oid]of entries)assert.equal(nflxBlobSHA(read(p)),oid,p+' published fixture byte-preserved');
});

test('NFLX is reversed exactly once before Uber and all earlier layers',()=>{
 const source=read('tests/uber-integration-preservation.mjs').toString(),call='bytes=reverseNflxIntegration(path,bytes,earlierContext);';assert.equal(source.split(call).length-1,1);assert.ok(source.indexOf(call)<source.indexOf('const f=uberFixture();'));
});
