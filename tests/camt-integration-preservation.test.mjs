import test from 'node:test';import assert from 'node:assert/strict';import {preservedV87Fs as fs} from './guided-company-preservation.mjs';import {createHash} from 'node:crypto';
import {reverseCamtIntegration} from './camt-integration-preservation.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url)),sha=x=>createHash('sha256').update(x).digest('hex');
const fixture=JSON.parse(read('tests/fixtures/camt-integration-v67.json'));
test('CAMT additions retain exact hashes and exclude raw documents',()=>{for(const [p,h]of Object.entries(fixture.additions)){assert.equal(sha(read(p)),h,p);assert.doesNotMatch(p,/\/raw\//);}assert.equal(Object.keys(fixture.files).length,9);});
test('CAMT shared hooks reverse to the exact serialized baseline and reject extra mutations',()=>{for(const [p,f]of Object.entries(fixture.files)){const bytes=read(p);assert.equal(sha(reverseCamtIntegration(p,bytes)),f.beforeSHA256,p);assert.throws(()=>reverseCamtIntegration(p,Buffer.concat([bytes,Buffer.from('\n/* mutation */')])),/exact reviewed CAMT integration bytes/);}});
