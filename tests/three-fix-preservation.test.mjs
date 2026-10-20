import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root,delta,sha,reverseUnified} from './three-fix-preservation.mjs';
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64e6});
const read=p=>fs.readFileSync(path.join(root,p));
const walk=p=>fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(e=>{assert.ok(!e.isSymbolicLink());return e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name];}).sort();
test('three-fix release pins V88 and rejects mutations of every declared additive delta',()=>{
 assert.equal(delta.baseline,'ab3b2b14ccd1f6ca9356f74041121fcb6dfc99ea');
 assert.equal(new Set(delta.files.map(f=>f.path)).size,delta.files.length);
 for(const f of delta.files){const b=read(f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.after_sha256,f.path);const before=reverseUnified(f.path,b);if(f.before_sha256)assert.deepEqual(before,git('show',delta.baseline+':'+f.path));else assert.equal(before,null);const bad=Buffer.concat([b,Buffer.from(' ')]);assert.throws(()=>reverseUnified(f.path,bad),/exact approved three-fix release/);}
});
test('every V88 production byte and mode is unchanged outside the explicit reviewed delta; no unlisted additions',()=>{
 const rows=git('ls-tree','-r',delta.baseline,'dist').toString().trim().split('\n').map(s=>{const [meta,p]=s.split('\t');return {p,mode:meta.split(' ')[0],oid:meta.split(' ')[2]};});
 const added=delta.files.filter(f=>f.path.startsWith('dist/')&&!f.before_sha256).map(f=>f.path);assert.equal(rows.length,981);
 assert.deepEqual(walk('dist'),[...rows.map(r=>r.p),...added].sort());
 for(const {p,mode,oid} of rows){assert.deepEqual(reverseUnified(p,read(p)),git('cat-file','blob',oid),p);assert.equal(fs.statSync(path.join(root,p)).mode&0o111,mode==='100755'?0o111:0,p);}
 const fixtures=git('ls-tree','-r','--name-only',delta.baseline,'tests/fixtures').toString().trim().split('\n');for(const p of fixtures)assert.deepEqual(read(p),git('show',delta.baseline+':'+p),p);
});
test('older preservation gates keep every assertion and baseline hash; only their explicit V88 read adapter changes',()=>{
 for(const p of ['tests/guided-company-preservation.mjs','tests/guided-company-preservation.test.mjs','tests/incremental-fn.test.mjs','tests/tsm-dated-conversion.test.mjs'])assert.equal(read(p).toString().replace("import {preservedV88Fs as fs} from './three-fix-preservation.mjs';","import fs from 'node:fs';"),git('show',delta.baseline+':'+p).toString(),p);
 assert.deepEqual(read('tests/guided-company-delta.json'),git('show',delta.baseline+':tests/guided-company-delta.json'));
});
