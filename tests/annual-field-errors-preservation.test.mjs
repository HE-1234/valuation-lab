import {mcdFixture,MCD_FIXTURE_PATH} from './mcd-integration-preservation.mjs';
import {simulationUiFixture} from './claude-simulation-ui-preservation.mjs';
import {umcFixture} from './umc-integration-preservation.mjs';
import {cevaDeliveryFixture} from './ceva-delivery-preservation.mjs';
import {cevaRmbsFixture} from './ceva-rmbs-integration-preservation.mjs';
import {allocationRepairFixture,reverseCompanyAllocationRepair} from './company-allocation-repair-preservation.mjs';
import {fixture as keysFixture} from './keys-integration-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fieldErrorFixture,fieldErrorSHA,reverseAnnualFieldErrors} from './annual-field-errors-preservation.mjs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url));
test('annual field feedback: exact insertion reversal preserves every V73 production byte and rejects unrelated edits',()=>{
 const f=fieldErrorFixture();assert.equal(f.baselineCommit,'8c2e14264a0568e4b741aeab60b680dc6811fa0b');assert.equal(Object.keys(f.files).length,2);
 const actual=fs.readdirSync(new URL('../dist',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).length;assert.equal(actual,Object.keys(f.baselineProduction).length+Object.keys(keysFixture().additions).length+Object.keys(mcdFixture().additions).length+Object.keys(simulationUiFixture().additions).length+Object.keys(umcFixture().additions).length+Object.keys(cevaDeliveryFixture().additions).length+Object.keys(cevaRmbsFixture().additions).length+Object.keys(allocationRepairFixture().additions).length);
 for(const [path,hash]of Object.entries(f.baselineProduction))assert.equal(fieldErrorSHA(reverseAnnualFieldErrors(path,read(path))),hash,path);
 for(const path of Object.keys(f.files))assert.throws(()=>reverseAnnualFieldErrors(path,Buffer.concat([read(path),Buffer.from('\n/* unauthorized */')])),/exact reviewed annual field errors bytes/);
});
