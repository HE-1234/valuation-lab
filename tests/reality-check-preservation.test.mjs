import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {realityFixture,realitySHA,reverseRealityCheckFix} from './reality-check-preservation.mjs';
const root=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
test('Reality-check fix reverses only two reviewed JS files and preserves all 685 V77 production files',()=>{
 const f=realityFixture();assert.equal(f.baselineCommit,'117651ea52817c366c0855ae01fc1119d2769a85');
 assert.equal(Object.keys(f.baselineProduction).length,685);
 assert.deepEqual(Object.keys(f.files).sort(),['dist/skins/report-journey.js','dist/skins/report-paths.js']);
 for(const [p,h]of Object.entries(f.baselineProduction))assert.equal(realitySHA(reverseRealityCheckFix(p,read(p))),h,p);
 for(const p of Object.keys(f.files))assert.throws(()=>reverseRealityCheckFix(p,Buffer.concat([read(p),Buffer.from('\n/* unrelated */')])),/exact reviewed reality-check fix/);
 const paths=fs.readdirSync(new URL('../dist/',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(fileURLToPath(root),join(e.parentPath,e.name))).sort();
 assert.deepEqual(paths,Object.keys(f.baselineProduction).sort());
 for(const p of paths.filter(p=>p.endsWith('.css')))assert.equal(realitySHA(read(p)),f.baselineProduction[p],p+' exact unchanged CSS');
});
