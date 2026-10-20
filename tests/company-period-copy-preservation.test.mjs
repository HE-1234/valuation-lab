import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {COMPANY_COPY_BASE,COMPANY_COPY_FILES,companyCopySHA,reverseCompanyPeriodCopy} from './company-period-copy-preservation.mjs';
import {reverseNflxIntegration,NFLX_BASE_COMMIT} from './nflx-integration-preservation.mjs';

const root=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL(p,root));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const blob=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const entries=p=>git('ls-tree','-r','-z',COMPANY_COPY_BASE,'--',p).toString().split('\0').filter(Boolean).map(row=>{const [meta,path]=row.split('\t');return {path,mode:meta.split(' ')[0],oid:meta.split(' ')[2]};});
function files(p){assert.ok(!fs.lstatSync(new URL(p,root)).isSymbolicLink());return fs.readdirSync(new URL(p,root),{withFileTypes:true}).flatMap(e=>{assert.ok(!e.isSymbolicLink());const n=p+'/'+e.name;assert.ok(e.isDirectory()||e.isFile());return e.isDirectory()?files(n):[n];}).sort();}

test('company copy layer pins exactly two replacements in one production file above exact V86',()=>{
 assert.equal(COMPANY_COPY_BASE,'fda9fcfa566d174e97924305b4ff3f6b7daabd4d');
 assert.equal(git('rev-parse',COMPANY_COPY_BASE+'^{commit}').toString().trim(),COMPANY_COPY_BASE);
 assert.deepEqual(Object.keys(COMPANY_COPY_FILES),['dist/research-view.js']);assert.ok(Object.isFrozen(COMPANY_COPY_FILES));
 const path='dist/research-view.js',item=COMPANY_COPY_FILES[path],current=read(path),before=git('show',COMPANY_COPY_BASE+':'+path);
 assert.ok(Object.isFrozen(item)&&Object.isFrozen(item.repairs));assert.equal(item.repairs.length,2);
 assert.equal(companyCopySHA(before),item.beforeSHA256);assert.equal(companyCopySHA(current),item.afterSHA256);assert.notEqual(item.beforeSHA256,item.afterSHA256);
 for(const repair of item.repairs){assert.ok(Object.isFrozen(repair));assert.notEqual(repair.before,repair.after);assert.equal(current.toString().split(repair.after).length-1,1);assert.equal(before.toString().split(repair.before).length-1,1);}
 assert.deepEqual(reverseCompanyPeriodCopy(path,current),before);
});

test('company copy layer retains all 979 production paths, source/model/design bytes, modes and 62 frozen fixtures',()=>{
 const production=entries('dist');assert.equal(production.length,979);assert.deepEqual(files('dist'),production.map(x=>x.path).sort());
 for(const {path,mode,oid}of production){assert.equal(blob(reverseCompanyPeriodCopy(path,read(path))),oid,path+' exact V86 bytes');assert.equal(fs.statSync(new URL(path,root)).mode&0o111,mode==='100755'?0o111:0,path+' executable mode');}
 const fixture=entries('tests/fixtures');assert.equal(fixture.length,62);assert.deepEqual(files('tests/fixtures'),fixture.map(x=>x.path).sort());
 for(const {path,mode,oid}of fixture){assert.equal(blob(read(path)),oid,path+' frozen fixture');assert.equal(fs.statSync(new URL(path,root)).mode&0o111,mode==='100755'?0o111:0,path+' fixture mode');}
});

test('company copy layer rejects missing or altered repairs, extra edits, malformed inputs and double reversal',()=>{
 const path='dist/research-view.js',good=read(path),item=COMPANY_COPY_FILES[path],changed=Buffer.from(good);changed[Math.floor(changed.length/2)]^=1;
 const badBytes=[changed,Buffer.concat([good,Buffer.from('\n')]),good.subarray(0,good.length-1),git('show',COMPANY_COPY_BASE+':'+path),...item.repairs.flatMap(r=>[Buffer.from(good.toString().replace(r.after,r.before)),Buffer.from(good.toString().replace(r.after,r.after+r.after))])];
 for(const bytes of badBytes){assert.throws(()=>reverseCompanyPeriodCopy(path,bytes),/exact reviewed company period copy bytes/);assert.throws(()=>reverseNflxIntegration(path,bytes),/exact reviewed company period copy bytes/);}
 assert.throws(()=>reverseCompanyPeriodCopy(path,reverseCompanyPeriodCopy(path,good)),/exact reviewed company period copy bytes/);
 for(const bad of [null,good.toString(),new Uint8Array(good)])assert.throws(()=>reverseCompanyPeriodCopy(path,bad),/exact production bytes/);
 for(const bad of ['dist/../x','dist//x','dist/./x','dist/','/dist/x','dist\\x','dist/x\0x','dist/x\nx','dist/x\rx','dist',null,42])assert.throws(()=>reverseCompanyPeriodCopy(bad,Buffer.from('x')),/exact normalized dist path/);
 const other='dist/engine.js',untouched=read(other);assert.strictEqual(reverseCompanyPeriodCopy(other,untouched),untouched);
});

test('company copy reversal runs exactly once before geometry and the unchanged Netflix byte gate',()=>{
 const source=read('tests/nflx-integration-preservation.mjs').toString(),call='bytes=reverseCompanyPeriodCopy(path,bytes,earlierContext);',geometry='bytes=reverseChartTrialGeometry(path,bytes,earlierContext);';
 assert.equal(source.split(call).length-1,1);assert.ok(source.indexOf(call)<source.indexOf(geometry));assert.ok(source.indexOf(geometry)<source.indexOf('const f=nflxFixture();'));
 const path='dist/research-view.js';assert.deepEqual(reverseNflxIntegration(path,read(path)),git('show',NFLX_BASE_COMMIT+':'+path));
 const baseline=git('show',COMPANY_COPY_BASE+':tests/nflx-integration-preservation.mjs').toString();
 assert.equal(source.replace("import {reverseCompanyPeriodCopy} from './company-period-copy-preservation.mjs';\n",'').replace(' '+call+'\n',''),baseline,'No existing NFLX gate, reviewed hash or fixture changes');
});
