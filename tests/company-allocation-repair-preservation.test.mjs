import test from 'node:test';import assert from 'node:assert/strict';import {preservedV87Fs as fs} from './guided-company-preservation.mjs';import {execFileSync} from 'node:child_process';
import {allocationRepairFixture,allocationRepairSHA,reverseCompanyAllocationRepair} from './company-allocation-repair-preservation.mjs';
const fixture=allocationRepairFixture(),read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
test('exact approved twelve-file allocation delta reverses to V78 and rejects any added mutation',()=>{
 assert.equal(Object.keys(fixture.files).length,6);assert.equal(Object.keys(fixture.additions).length,6);
 for(const [path,item] of Object.entries(fixture.files)){const bytes=read(path),before=reverseCompanyAllocationRepair(path,bytes);assert.equal(allocationRepairSHA(before),item.beforeSHA256);assert.deepEqual(before,execFileSync('git',['show','e427d6b:'+path],{cwd:new URL('..',import.meta.url)}));assert.throws(()=>reverseCompanyAllocationRepair(path,Buffer.concat([bytes,Buffer.from('\n/* unrelated */')])),/exact reviewed company allocation repair bytes/);}
 for(const [path,hash]of Object.entries(fixture.additions))assert.equal(allocationRepairSHA(read(path)),hash,path);
});
