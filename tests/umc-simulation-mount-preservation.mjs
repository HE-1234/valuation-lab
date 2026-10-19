import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const UMC_MC_BASE_COMMIT='a5745ac6a2c6d0473995e0a64e8518fbe4e1def8';
export const UMC_MC_MODIFIED_PATH='dist/research-simulation-view.js';
export const umcMcSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
const fragments=[
 ["collectSettings:(config,find)=>{config.capitalPolicy=find('#mc-capital-policy').value;},","collectSettings:(config,find)=>{if(draft.ticker==='UMC')return;config.capitalPolicy=find('#mc-capital-policy').value;},"],
 ["bindSettings:(find,changed)=>{find('#mc-capital-policy').onchange=changed;},","bindSettings:(find,changed)=>{if(draft.ticker==='UMC')return;find('#mc-capital-policy').onchange=changed;},"]
];
export function validateUmcMcFixture(f){
 assert.ok(f&&typeof f==='object'&&!Array.isArray(f));assert.deepEqual(Object.keys(f).sort(),['baseCommit','path','beforeText','beforeSHA256','afterSHA256'].sort());
 assert.equal(f.baseCommit,UMC_MC_BASE_COMMIT);assert.equal(f.path,UMC_MC_MODIFIED_PATH);assert.equal(typeof f.beforeText,'string');
 const original=execFileSync('git',['show',UMC_MC_BASE_COMMIT+':'+UMC_MC_MODIFIED_PATH],{cwd:new URL('..',import.meta.url)});
 assert.equal(f.beforeText,original.toString(),'The simulation fix must begin with immutable published V82 bytes');assert.equal(umcMcSHA(original),f.beforeSHA256);
 let after=f.beforeText;for(const [before,replacement]of fragments){assert.equal(after.split(before).length-1,1,'Only each exact UMC callback guard may be added');after=after.replace(before,replacement);}
 assert.equal(umcMcSHA(after),f.afterSHA256,'Only two exact UMC-only early-return guards are approved');return f;
}
let cached;
export function umcMcFixture(){return cached??=Object.freeze(validateUmcMcFixture(JSON.parse(fs.readFileSync(new URL('./fixtures/umc-simulation-mount-v82.json',import.meta.url),'utf8'))));}
export function reverseUmcSimulationMount(path,bytes,earlierContext=''){
 if(path!==UMC_MC_MODIFIED_PATH)return bytes;
 assert.ok(Buffer.isBuffer(bytes),'Exact production bytes are required');const f=umcMcFixture();assert.equal(umcMcSHA(bytes),f.afterSHA256,path+' exact reviewed UMC simulation mount fix bytes'+earlierContext);return Buffer.from(f.beforeText);
}
