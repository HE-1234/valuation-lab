import {uberFixture,UBER_FIXTURE_PATH,UBER_ADDED_PATHS,reverseUberIntegration} from './uber-integration-preservation.mjs';
import {mcdFixture,MCD_FIXTURE_PATH} from './mcd-integration-preservation.mjs';
import {simulationUiFixture,reverseClaudeSimulationUi} from './claude-simulation-ui-preservation.mjs';
import {umcFixture,reverseUmcIntegration} from './umc-integration-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CEVA_DELIVERY_BASE_COMMIT,CEVA_DELIVERY_MODIFIED_PATH,CEVA_DELIVERY_ADDED_PATH,cevaDeliveryFixture,cevaDeliverySHA,validateCevaDeliveryFixture,reverseCevaDelivery} from './ceva-delivery-preservation.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),read=p=>fs.readFileSync(path.join(root,p));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:32*1024*1024});
const blobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const modified=CEVA_DELIVERY_MODIFIED_PATH,added=CEVA_DELIVERY_ADDED_PATH;
function altered(bytes){const copy=Buffer.from(bytes);if(copy.length)copy[Math.floor(copy.length/2)]^=1;else return Buffer.from('x');return copy;}
function filesUnder(relative){const output=[];for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){const p=relative+'/'+entry.name;assert.ok(!entry.isSymbolicLink(),p+' cannot replace reviewed bytes with a symlink');if(entry.isDirectory())output.push(...filesUnder(p));else{assert.ok(entry.isFile(),p+' must be a regular production file');output.push(p);}}return output.sort();}
function baseEntries(){return new Map(git('ls-tree','-r','-z','--full-tree',CEVA_DELIVERY_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' ');assert.equal(type,'blob','V80 dist entry must be a blob');assert.ok(['100644','100755'].includes(mode),'V80 dist entry must be a regular file');return [row.slice(tab+1),{mode,oid}];}));}

test('CEVA delivery fixture permits exactly one reviewed path change and one added envelope',()=>{
 const f=cevaDeliveryFixture();assert.equal(validateCevaDeliveryFixture(f),f);assert.deepEqual(Object.keys(f.files),[modified]);assert.deepEqual(Object.keys(f.additions),[added]);
 for(const mutate of [f=>{f.baseCommit='d3169414';},f=>{f.baseCommit='5cd59bac05fd3692a11e5ab35b956f0a4792dc2d';},f=>{f.allowlist=['dist'];},f=>{f.files={};},f=>{f.additions={};},f=>{f.files[modified].beforeText+='mutation';},f=>{f.files[modified].afterSHA256=f.files[modified].beforeSHA256;},f=>{f.files[modified].ignored=true;},f=>{delete f.files[modified].beforeText;},f=>{f.files['dist/another.js']=structuredClone(f.files[modified]);},f=>{f.additions['dist/another.json']=f.additions[added];},f=>{f.additions[added]='*';},f=>{f.additions['dist/../outside']='0'.repeat(64);},f=>{f.files=[];},f=>{f.additions=null;}]){const changed=structuredClone(f);mutate(changed);assert.throws(()=>validateCevaDeliveryFixture(changed));}
});
test('CEVA delivery reversal verifies original V80 Git bytes and rejects every mutation',()=>{
 const fixture=cevaDeliveryFixture(),item=fixture.files[modified],bytes=read(modified),original=git('show',CEVA_DELIVERY_BASE_COMMIT+':'+modified);
 assert.equal(git('rev-parse',CEVA_DELIVERY_BASE_COMMIT).toString().trim(),CEVA_DELIVERY_BASE_COMMIT);assert.equal(cevaDeliverySHA(reverseUmcIntegration(modified,bytes)),item.afterSHA256);assert.equal(cevaDeliverySHA(original),item.beforeSHA256);assert.deepEqual(Buffer.from(item.beforeText),original);assert.deepEqual(reverseCevaDelivery(modified,bytes),original);
 const oldPath='./data/incremental-CEVA-2026-10-19-v3/cases.json',newPath='./data/incremental-CEVA-2026-10-19-v3/reviewed-package.json';assert.equal(original.toString().split(oldPath).length,2,'Exactly one original CEVA fetch path');assert.equal(original.toString().replace(oldPath,newPath),reverseUmcIntegration(modified,bytes).toString(),'The entire production edit is one exact path replacement');
 for(const p of [modified,added]){const b=read(p);for(const changed of [Buffer.concat([b,Buffer.from('\n/* unrelated */')]),altered(b),b.subarray(0,Math.max(0,b.length-1))])if(!changed.equals(b))assert.throws(()=>reverseCevaDelivery(p,changed),/exact reviewed CEVA delivery fix bytes.*exact reviewed CEVA\/RMBS integration bytes.*exact reviewed company allocation repair bytes/);}
 const addedBytes=read(added);assert.equal(cevaDeliverySHA(addedBytes),fixture.additions[added]);assert.strictEqual(reverseCevaDelivery(added,addedBytes),addedBytes);
 const frozenSource='dist/data/incremental-CEVA-2026-10-19-v3/cases.json';assert.deepEqual(read(frozenSource),git('show',CEVA_DELIVERY_BASE_COMMIT+':'+frozenSource),'Frozen source array remains byte-identical');assert.ok(Array.isArray(JSON.parse(read(frozenSource))),'Source cases stay an array');
});
test('CEVA delivery repair preserves the entire V80 production tree outside its two exact paths',()=>{
 const fixture=cevaDeliveryFixture(),baseline=baseEntries(),current=filesUnder('dist');assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1');
 assert.deepEqual(current.filter(p=>!baseline.has(p)).sort(),[added,...Object.keys(uberFixture().additions),...Object.keys(mcdFixture().additions),...Object.keys(simulationUiFixture().additions),...Object.keys(umcFixture().additions)].sort(),'Only the exact envelope and individually pinned UMC additions are permitted');assert.deepEqual([...baseline.keys()].filter(p=>!current.includes(p)),[],'No V80 production file may disappear');assert.ok(baseline.has(modified));assert.ok(!baseline.has(added));
 for(const [p,entry]of baseline){const bytes=read(p),restored=reverseCevaDelivery(p,bytes);assert.equal(blobSHA(restored),entry.oid,p+' must reverse byte-for-byte to V80; no undeclared mutations');}
 assert.equal(cevaDeliverySHA(read(added)),fixture.additions[added]);for(const [p,sha]of Object.entries(umcFixture().additions))assert.equal(cevaDeliverySHA(read(p)),sha,p+' exact reviewed UMC addition bytes');for(const [p,sha]of Object.entries({...uberFixture().additions,...mcdFixture().additions,...simulationUiFixture().additions}))assert.equal(cevaDeliverySHA(reverseClaudeSimulationUi(p,read(p))),sha,p+' exact reviewed simulation UI addition bytes');
 const unchanged=[...baseline.keys()].find(p=>p!==modified),mutation=altered(read(unchanged));assert.throws(()=>assert.equal(blobSHA(reverseCevaDelivery(unchanged,mutation)),baseline.get(unchanged).oid),'Unlisted mutations must fail pinned whole-tree verification');
});
