import {simulationUiFixture} from './claude-simulation-ui-preservation.mjs';
import {umcFixture} from './umc-integration-preservation.mjs';
import {cevaDeliveryFixture,reverseCevaDelivery} from './ceva-delivery-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CEVA_RMBS_BASE_COMMIT,cevaRmbsFixture,cevaRmbsSHA,validateCevaRmbsFixture,reverseCevaRmbsIntegration} from './ceva-rmbs-integration-preservation.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),read=p=>fs.readFileSync(path.join(root,p));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:32*1024*1024});
function fixtureExample(){return {baseCommit:CEVA_RMBS_BASE_COMMIT,files:{'dist/example.js':{beforeText:'before\n',beforeSHA256:cevaRmbsSHA('before\n'),afterSHA256:cevaRmbsSHA('after\n')}},additions:{'dist/added.js':cevaRmbsSHA('new\n')}};}
function altered(bytes){const copy=Buffer.from(bytes);if(copy.length)copy[Math.floor(copy.length/2)]^=1;else return Buffer.from('x');return copy;}
function filesUnder(relative){const output=[];for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){const p=relative+'/'+entry.name;assert.ok(!entry.isSymbolicLink(),p+' cannot replace reviewed bytes with a symlink');if(entry.isDirectory())output.push(...filesUnder(p));else{assert.ok(entry.isFile(),p+' must be a regular production file');output.push(p);}}return output.sort();}
function baseEntries(){return new Map(git('ls-tree','-r','-z','--full-tree',CEVA_RMBS_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' ');assert.equal(type,'blob','V79 dist entry must be a blob');assert.ok(['100644','100755'].includes(mode),'V79 dist entry must be a regular file');return [row.slice(tab+1),{mode,oid}];}));}
const blobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');

test('CEVA/RMBS helper unit: strict manifest schema, exact paths and pinned base reject broad allowances',()=>{
 const valid=fixtureExample();assert.equal(validateCevaRmbsFixture(valid),valid);
 for(const mutate of [f=>{f.baseCommit='5cd59bac';},f=>{f.baseCommit='e427d6b';},f=>{f.allowlist=['dist'];},f=>{f.files={};},f=>{f.additions={};},f=>{f.files['dist/example.js'].beforeText+='mutation';},f=>{f.files['dist/example.js'].afterSHA256=f.files['dist/example.js'].beforeSHA256;},f=>{f.files['dist/example.js'].ignored=true;},f=>{delete f.files['dist/example.js'].beforeText;},f=>{f.additions['dist/example.js']=cevaRmbsSHA('x');},f=>{f.additions['dist/new.js']='*';},f=>{f.additions['dist/../outside']='0'.repeat(64);},f=>{f.additions['dist//prefix']='0'.repeat(64);},f=>{f.additions['dist/./prefix']='0'.repeat(64);},f=>{f.additions['dist\\file']='0'.repeat(64);},f=>{f.additions['tests/ignored.js']='0'.repeat(64);},f=>{f.files=[];},f=>{f.additions=null;}]){const f=fixtureExample();mutate(f);assert.throws(()=>validateCevaRmbsFixture(f));}
});
test('exact combined CEVA/RMBS delta reverses to pinned V79 and rejects every modified or added byte mutation',()=>{
 const fixture=cevaRmbsFixture();assert.equal(git('rev-parse',CEVA_RMBS_BASE_COMMIT).toString().trim(),CEVA_RMBS_BASE_COMMIT);
 for(const required of ['dist/ceva-valuation.js','dist/rmbs-financial-engine.js'])assert.ok(Object.hasOwn(fixture.additions,required),required+' must be pinned individually');
 for(const [p,item]of Object.entries(fixture.files)){
  const bytes=read(p),original=git('show',CEVA_RMBS_BASE_COMMIT+':'+p),before=reverseCevaRmbsIntegration(p,bytes);
  assert.equal(cevaRmbsSHA(reverseCevaDelivery(p,bytes)),item.afterSHA256,p+' exact reviewed after hash');assert.deepEqual(Buffer.from(item.beforeText,'utf8'),original,p+' beforeText must equal git show V79');assert.equal(cevaRmbsSHA(original),item.beforeSHA256,p+' before hash must equal git show V79');assert.deepEqual(before,original,p+' exact reversal');
  for(const changed of [Buffer.concat([bytes,Buffer.from('\n/* unrelated */')]),altered(bytes),bytes.subarray(0,Math.max(0,bytes.length-1))])if(!changed.equals(bytes))assert.throws(()=>reverseCevaRmbsIntegration(p,changed),/exact reviewed CEVA\/RMBS integration bytes/);
 }
 for(const [p,sha]of Object.entries(fixture.additions)){
  const bytes=read(p);assert.equal(cevaRmbsSHA(bytes),sha,p+' exact added-file hash');assert.strictEqual(reverseCevaRmbsIntegration(p,bytes),bytes,p+' additions stay available to the current app');
  for(const changed of [Buffer.concat([bytes,Buffer.from('\nmutation')]),altered(bytes),bytes.subarray(0,Math.max(0,bytes.length-1))])if(!changed.equals(bytes))assert.throws(()=>reverseCevaRmbsIntegration(p,changed),/exact reviewed CEVA\/RMBS addition bytes/);
 }
});
test('combined CEVA/RMBS manifest exhaustively accounts for the production tree with no undeclared changes',()=>{
 const fixture=cevaRmbsFixture(),baseline=baseEntries(),current=filesUnder('dist'),declaredAdditions=[...Object.keys(fixture.additions),...Object.keys(simulationUiFixture().additions),...Object.keys(umcFixture().additions),...Object.keys(cevaDeliveryFixture().additions)].sort();
 assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1','Pinned V79 Git blob verification uses this repository object format');
 assert.deepEqual(current.filter(p=>!baseline.has(p)).sort(),declaredAdditions,'Every production addition must have an exact individual hash, with no prefix allowlist');
 assert.deepEqual([...baseline.keys()].filter(p=>!current.includes(p)),[],'No V79 production file may disappear');
 for(const p of Object.keys(fixture.files))assert.ok(baseline.has(p),p+' modifications must exist in pinned V79');
 for(const p of declaredAdditions)assert.ok(!baseline.has(p),p+' additions must not replace a V79 file');
 for(const [p,entry]of baseline){const bytes=read(p),restored=reverseCevaRmbsIntegration(p,bytes);assert.equal(blobSHA(restored),entry.oid,p+' must reverse byte-for-byte to V79; undeclared changes are forbidden');}
 for(const p of declaredAdditions)assert.equal(cevaRmbsSHA(read(p)),(fixture.additions[p]??cevaDeliveryFixture().additions[p]??umcFixture().additions[p]??simulationUiFixture().additions[p]),p+' added production bytes must match exactly');
 const unchanged=[...baseline.keys()].find(p=>!Object.hasOwn(fixture.files,p));assert.ok(unchanged,'The preservation layer must retain unmodified baseline files');const bytes=read(unchanged),mutated=altered(bytes);assert.throws(()=>assert.equal(blobSHA(reverseCevaRmbsIntegration(unchanged,mutated)),baseline.get(unchanged).oid),'An undeclared mutation cannot pass the pinned whole-tree check');
});
