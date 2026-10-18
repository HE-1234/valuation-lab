import {reverseDecimalDisplay} from './decimal-display-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {reverseJointIntegration} from './joint-integration-preservation.mjs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url));
const fixture=JSON.parse(read('tests/fixtures/joint-integration-v60.json'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('joint integration: audited kernel and all new production modules have exact reviewed hashes',()=>{
 assert.equal(fixture.additions['dist/joint-annual-path.js'],'d2b1fc4c31565f4ff463036a74372bd92562ffa49ff566c423e642e9028b1d14');
 assert.equal(Object.keys(fixture.additions).length,3);
 for(const [path,expected]of Object.entries(fixture.additions))assert.equal(sha(reverseDecimalDisplay(path,read(path))),expected,path);
});
test('joint integration: every existing asset reverses exactly and rejects any additional modification',()=>{
 assert.equal(Object.keys(fixture.files).length,18);
 assert.deepEqual(Object.keys(fixture.files).filter(p=>p.startsWith('dist/data/')),['dist/data/simulation-methodology.html']);
 for(const [path,approved]of Object.entries(fixture.files)){
  const bytes=read(path);assert.equal(sha(reverseJointIntegration(path,bytes)),approved.beforeSHA256,path);
  assert.throws(()=>reverseJointIntegration(path,Buffer.concat([bytes,Buffer.from('\n/* unreviewed */')])),/reviewed documentation bytes|exact isolated NVMI integration bytes/,path);
 }
});
test('joint target narrow layout is confined to new Report controls',()=>{
 const css=read('dist/skins/report.css').toString();
 assert.match(css,/@media \(max-width: 380px\) \{\s*html\[data-skin="report"\] \[id\*="mc-joint-target-"\]\.mc-driver-parameters \{\s*grid-template-columns: minmax\(0, 1fr\) !important;/);
});
