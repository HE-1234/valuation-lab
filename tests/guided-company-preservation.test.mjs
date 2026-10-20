import test from 'node:test';
import assert from 'node:assert/strict';
import {preservedV88Fs as fs} from './three-fix-preservation.mjs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root,delta,sha,reverseGuidedCompany,preservedV87Fs} from './guided-company-preservation.mjs';
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64e6});
const read=p=>fs.readFileSync(path.join(root,p));
const walk=p=>fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(e=>{const q=p+'/'+e.name;assert.ok(!e.isSymbolicLink());return e.isDirectory()?walk(q):[q];}).sort();
test('Guided integration pins exactly three replacements and two additions above immutable V87',()=>{
 assert.equal(delta.baseline,'1e8294327f3db6480f39ff27bc636ba18b30de72');
 assert.deepEqual(delta.files.map(f=>f.path).sort(),['dist/guided-reviewed.css','dist/guided-reviewed.js','dist/guided.js','dist/index.html','dist/research-view.js']);
 assert.equal(delta.files.filter(f=>f.before_sha256).length,3);
 for(const f of delta.files){const b=read(f.path);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.after_sha256);const restored=reverseGuidedCompany(f.path,b);if(f.before_sha256)assert.deepEqual(restored,git('show',delta.baseline+':'+f.path));else assert.equal(restored,null);}
});
test('Guided integration preserves every other V87 production byte, mode and all frozen fixtures',()=>{
 const rows=git('ls-tree','-r',delta.baseline,'dist').toString().trim().split('\n').map(s=>{const [meta,p]=s.split('\t');return {p,mode:meta.split(' ')[0],oid:meta.split(' ')[2]};});
 const added=delta.files.filter(f=>!f.before_sha256).map(f=>f.path);
 assert.equal(rows.length,979);assert.deepEqual(walk('dist'),[...rows.map(r=>r.p),...added].sort());
 for(const {p,mode,oid}of rows){const b=reverseGuidedCompany(p,read(p));assert.deepEqual(b,git('cat-file','blob',oid),p);assert.equal(fs.statSync(path.join(root,p)).mode&0o111,mode==='100755'?0o111:0,p);}
 const fixtures=git('ls-tree','-r','--name-only',delta.baseline,'tests/fixtures').toString().trim().split('\n');assert.equal(fixtures.length,62);
 for(const p of fixtures)assert.deepEqual(read(p),git('show',delta.baseline+':'+p),p);
});
test('Guided projection rejects every changed-file mutation and leaves unrelated inputs untouched',()=>{
 for(const f of delta.files){const b=read(f.path),bad=Buffer.from(b);bad[Math.floor(b.length/2)]^=1;assert.throws(()=>reverseGuidedCompany(f.path,bad),/exact reviewed Guided/);assert.throws(()=>reverseGuidedCompany(f.path,Buffer.concat([b,Buffer.from(' ')])),/exact reviewed Guided/);}
 const b=Buffer.from('unrelated');assert.strictEqual(reverseGuidedCompany('dist/engine.js',b),b);
 assert.equal(preservedV87Fs.readdirSync(path.join(root,'dist')).includes('guided-reviewed.js'),false);
 assert.deepEqual(preservedV87Fs.readFileSync(path.join(root,'dist/guided.js')),git('show',delta.baseline+':dist/guided.js'));
});
test('historical rendered-output goldens keep their exact V87 DOM fixture while new runtime tests use enhanced DOM',()=>{
 assert.deepEqual(read('tests/research-workspace-v87-golden-harness.mjs'),git('show',delta.baseline+':tests/research-workspace-harness.mjs'));
 const p='tests/company-allocation-baseline-presentation.mjs';
 assert.equal(read(p).toString().replace("from './research-workspace-v87-golden-harness.mjs'","from './research-workspace-harness.mjs'"),git('show',delta.baseline+':'+p).toString());
});
test('all historical snapshot scripts retain original assertions and numerical capture with only a frozen DOM import',()=>{
 for(const p of ['tests/ceva-v79-snapshot.mjs','tests/umc-v81-snapshot.mjs'])assert.equal(read(p).toString().replace("load('tests/research-workspace-v87-golden-harness.mjs')","load('tests/research-workspace-harness.mjs')"),git('show',delta.baseline+':'+p).toString(),p);
 const marker="import {preservedV87Fs as fs} from './guided-company-preservation.mjs'";
 for(const name of fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.test.mjs')&&n!=='guided-company-preservation.test.mjs')){
  const p='tests/'+name,source=read(p).toString();if(source.includes(marker))assert.equal(source.replace(marker,"import fs from 'node:fs'"),git('show',delta.baseline+':'+p).toString(),p+' only explicit read adapter allowed');
 }
});
