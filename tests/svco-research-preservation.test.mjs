import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {relative,join} from 'node:path';import {fileURLToPath} from 'node:url';
import {svcoFixture,svcoSHA,reverseSVCOResearch} from './svco-research-preservation.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
test('SVCO exact overlay preserves every V75 production byte, all ready libraries and six themes',()=>{
 const f=svcoFixture();assert.equal(f.baselineCommit,'107a8d945dcfd7e10ae591b47733bfb86a69b6de');assert.deepEqual(Object.keys(f.files),['dist/company-catalog-view.js']);
 for(const [path,hash] of Object.entries(f.baselineProduction))assert.equal(svcoSHA(reverseSVCOResearch(path,read(path))),hash,path);
 for(const path of Object.keys(f.files))assert.throws(()=>reverseSVCOResearch(path,Buffer.concat([read(path),Buffer.from('\n/* unrelated mutation */')])),/exact reviewed SVCO/);
 const root=fileURLToPath(new URL('..',import.meta.url));const actual=fs.readdirSync(new URL('../dist',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(root,join(e.parentPath,e.name))).sort();
 assert.deepEqual(actual,[...Object.keys(f.baselineProduction),...Object.keys(f.additions)].sort());
 assert.deepEqual(Object.keys(f.additions),['dist/data/svco-research-only-v2.json','dist/svco-research-only.js']);for(const [path,hash]of Object.entries(f.additions))assert.equal(svcoSHA(read(path)),hash,path);
});
