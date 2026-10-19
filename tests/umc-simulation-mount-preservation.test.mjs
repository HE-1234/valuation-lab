import {uberFixture,UBER_FIXTURE_PATH,UBER_ADDED_PATHS,reverseUberIntegration} from './uber-integration-preservation.mjs';
import {mcdFixture,MCD_FIXTURE_PATH} from './mcd-integration-preservation.mjs';
import {simulationUiFixture,SIM_UI_FIXTURE_PATH} from './claude-simulation-ui-preservation.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {UMC_MC_BASE_COMMIT,UMC_MC_MODIFIED_PATH,umcMcSHA,umcMcFixture,validateUmcMcFixture,reverseUmcSimulationMount} from './umc-simulation-mount-preservation.mjs';
import {reverseUmcIntegration} from './umc-integration-preservation.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),read=p=>fs.readFileSync(path.join(root,p)),git=(...a)=>execFileSync('git',a,{cwd:root,maxBuffer:64*1024*1024});
const walk=p=>fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(e=>{assert.ok(!e.isSymbolicLink());return e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]}).sort();
const blob=b=>createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
test('UMC simulation mount fixture permits only the exact two guards from immutable V82',()=>{
 const f=umcMcFixture();assert.equal(f.baseCommit,UMC_MC_BASE_COMMIT);assert.equal(f.path,UMC_MC_MODIFIED_PATH);assert.notEqual(f.beforeSHA256,f.afterSHA256);
 for(const change of [x=>x.baseCommit='0'.repeat(40),x=>x.path='dist/research-model.js',x=>x.extra=true,x=>x.beforeText+=' ',x=>x.afterSHA256='0'.repeat(64)]){const bad=structuredClone(f);change(bad);assert.throws(()=>validateUmcMcFixture(bad));}
 assert.equal(read('tests/umc-integration-preservation.mjs').toString().split('bytes=reverseUmcSimulationMount(path,bytes,REVIEWED_ERROR);').length-1,1,'Fix reversal occurs once before UMC integration reversal');
});
test('UMC simulation mount fix reverses every production byte to immutable848-file V82 with no allowances',()=>{
 const entries=git('ls-tree','-r','-z',UMC_MC_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(r=>{const [meta,p]=r.split('\t');return [p,meta.split(' ')[2]]});
 assert.equal(entries.length,848);assert.deepEqual(walk('dist'),[...entries.map(([p])=>p),...Object.keys(uberFixture().additions),...Object.keys(mcdFixture().additions),...Object.keys(simulationUiFixture().additions)].sort());
 for(const [p,sha]of Object.entries({...uberFixture().additions,...mcdFixture().additions,...simulationUiFixture().additions}))assert.equal(umcMcSHA(reverseUmcSimulationMount(p,read(p))),sha,p+' exact later UI addition');
 for(const [p,expected]of entries){const bytes=reverseUmcSimulationMount(p,read(p));assert.equal(blob(bytes),expected,p);}
});
test('UMC simulation guard reversal rejects modified bytes and leaves earlier strict path constraints intact',()=>{
 const bytes=read(UMC_MC_MODIFIED_PATH),changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>reverseUmcSimulationMount(UMC_MC_MODIFIED_PATH,changed));assert.deepEqual(reverseUmcSimulationMount(UMC_MC_MODIFIED_PATH,bytes),git('show',UMC_MC_BASE_COMMIT+':'+UMC_MC_MODIFIED_PATH));
 for(const alias of ['research-simulation-view.js','data/cases.json','dist//research-simulation-view.js'])assert.throws(()=>reverseUmcIntegration(alias,bytes),/exact normalized dist path/);
});


test('UMC simulation repair retains every published V82 fixture byte unchanged',()=>{
 const entries=git('ls-tree','-r','-z',UMC_MC_BASE_COMMIT,'--','tests/fixtures').toString().split('\0').filter(Boolean).map(r=>{const [meta,p]=r.split('\t');return [p,meta.split(' ')[2]]});
 assert.deepEqual(walk('tests/fixtures'),[...entries.map(([p])=>p),'tests/fixtures/umc-simulation-mount-v82.json',SIM_UI_FIXTURE_PATH,MCD_FIXTURE_PATH,'tests/fixtures/mcd-prior33-final-ui.json',UBER_FIXTURE_PATH,'tests/fixtures/uber-prior34-mcd-v85.json'].sort());
 for(const [p,expected]of entries)assert.equal(blob(read(p)),expected,p);
});
