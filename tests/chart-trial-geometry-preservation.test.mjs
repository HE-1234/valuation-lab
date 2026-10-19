import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {GEOMETRY_BASE,GEOMETRY_FILES,geometrySHA,reverseChartTrialGeometry} from './chart-trial-geometry-preservation.mjs';
import {reverseNflxIntegration} from './nflx-integration-preservation.mjs';
const root=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL(p,root));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const blob=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
function files(p){return fs.readdirSync(new URL(p,root),{withFileTypes:true}).flatMap(e=>{assert.ok(!e.isSymbolicLink());const n=p+'/'+e.name;assert.ok(e.isDirectory()||e.isFile());return e.isDirectory()?files(n):[n];}).sort();}
const entries=p=>git('ls-tree','-r','-z',GEOMETRY_BASE,'--',p).toString().split('\0').filter(Boolean).map(row=>{const [meta,path]=row.split('\t');return {path,mode:meta.split(' ')[0],oid:meta.split(' ')[2]};});

test('geometry layer pins exactly two CSS files and unique reversible replacements to the frozen company commit',()=>{
 assert.equal(GEOMETRY_BASE,'86fe7169f84689aba13f2076b4789289f4477ec8');assert.equal(git('rev-parse',GEOMETRY_BASE+'^{commit}').toString().trim(),GEOMETRY_BASE);
 assert.deepEqual(Object.keys(GEOMETRY_FILES),['dist/research.css','dist/skins/report.css']);assert.ok(Object.isFrozen(GEOMETRY_FILES));
 for(const [p,item]of Object.entries(GEOMETRY_FILES)){
  assert.ok(Object.isFrozen(item)&&Object.isFrozen(item.repairs));assert.equal(item.repairs.length,1);
  const current=read(p),before=git('show',GEOMETRY_BASE+':'+p);assert.equal(geometrySHA(before),item.beforeSHA256);assert.equal(geometrySHA(current),item.afterSHA256);assert.notEqual(item.beforeSHA256,item.afterSHA256);
  for(const repair of item.repairs){assert.ok(Object.isFrozen(repair));assert.equal(current.toString().split(repair.after).length-1,1);assert.equal(before.toString().split(repair.before).length-1,1);}
  assert.deepEqual(reverseChartTrialGeometry(p,current),before);
 }
});

test('geometry layer retains all 979 production paths, every non-CSS byte and mode, and all 62 existing fixtures',()=>{
 const production=entries('dist');assert.equal(production.length,979);assert.deepEqual(files('dist'),production.map(x=>x.path).sort());
 for(const {path,mode,oid}of production){assert.equal(blob(reverseChartTrialGeometry(path,read(path))),oid,path);assert.equal(fs.statSync(new URL(path,root)).mode&0o111,mode==='100755'?0o111:0,path+' executable mode');}
 const fixture=entries('tests/fixtures');assert.equal(fixture.length,62);assert.deepEqual(files('tests/fixtures'),fixture.map(x=>x.path).sort());for(const {path,oid}of fixture)assert.equal(blob(read(path)),oid,path+' frozen fixture');
});

test('geometry layer rejects every CSS mutation, omission, non-Buffer input and double reversal',()=>{
 for(const [p,item]of Object.entries(GEOMETRY_FILES)){
  const good=read(p),changed=Buffer.from(good);changed[Math.floor(changed.length/2)]^=1;
  for(const bad of [changed,Buffer.concat([good,Buffer.from('\n')]),good.subarray(0,good.length-1),git('show',GEOMETRY_BASE+':'+p)]){
   assert.throws(()=>reverseChartTrialGeometry(p,bad),/exact reviewed chart\/trial geometry bytes/);assert.throws(()=>reverseNflxIntegration(p,bad),/exact reviewed chart\/trial geometry bytes/);
  }
  for(const bad of [null,good.toString(),new Uint8Array(good)])assert.throws(()=>reverseChartTrialGeometry(p,bad),/exact production bytes/);
  assert.equal(item.repairs.some(x=>x.before===x.after),false);
 }
 const p='dist/engine.js',b=read(p);assert.strictEqual(reverseChartTrialGeometry(p,b),b);
});

test('geometry is reversed once before the exact Netflix company gate and does not replace that gate',()=>{
 const s=read('tests/nflx-integration-preservation.mjs').toString(),call='bytes=reverseChartTrialGeometry(path,bytes,earlierContext);';assert.equal(s.split(call).length-1,1);assert.ok(s.indexOf(call)<s.indexOf('const f=nflxFixture();'));
 for(const p of Object.keys(GEOMETRY_FILES))assert.deepEqual(reverseNflxIntegration(p,read(p)),git('show',GEOMETRY_BASE+':'+p));
});
