import {nflxFixture,NFLX_FIXTURE_PATH,NFLX_ADDED_PATHS,reverseNflxIntegration} from './nflx-integration-preservation.mjs';
import {uberFixture,UBER_FIXTURE_PATH,UBER_ADDED_PATHS,reverseUberIntegration} from './uber-integration-preservation.mjs';
import {mcdFixture,MCD_FIXTURE_PATH} from './mcd-integration-preservation.mjs';
import {simulationUiFixture} from './claude-simulation-ui-preservation.mjs';
import {umcFixture} from './umc-integration-preservation.mjs';
import {cevaDeliveryFixture} from './ceva-delivery-preservation.mjs';
import {cevaRmbsFixture} from './ceva-rmbs-integration-preservation.mjs';
import {allocationRepairFixture,reverseCompanyAllocationRepair} from './company-allocation-repair-preservation.mjs';
import {fixture as keysFixture,reverseKeysIntegration} from './keys-integration-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {preservedV87Fs as fs} from './guided-company-preservation.mjs';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixture as armFixture,reverseArmIntegration} from './arm-integration-preservation.mjs';
import {reverseSndkIntegration,captureResearchSnapshot,fixture,sha} from './sndk-integration-preservation.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));

test('SNDK exact reviewed insertion-only hooks reverse every V71 production byte and reject extra mutations',()=>{
 const f=fixture();
 assert.equal(f.baselineCommit,'751b64c1260b05a80253baa89cbc67ee5d532113');
 assert.equal(f.baselineTrackedCount,1079);
 assert.equal(Object.keys(f.baselineProduction).length,550);
 for(const[p,h]of Object.entries(f.baselineProduction))assert.equal(sha(reverseSndkIntegration(p,read(p))),h,p);
 for(const[p,h]of Object.entries(f.files)){
  assert.ok(h.insertions.length,p+' insertion-only review');
  assert.equal(sha(reverseSndkIntegration(p,read(p))),h.beforeSHA256,p);
  assert.throws(()=>reverseSndkIntegration(p,Buffer.concat([read(p),Buffer.from('\n/* unauthorized */')])),/exact reviewed SNDK integration bytes/);
 }
});

test('SNDK additions retain exact reviewed hashes and exclude raw source filings',()=>{
 const f=fixture();assert.ok(Object.keys(f.additions).length>=5);
 const root=fileURLToPath(new URL('..',import.meta.url));
 const actual=fs.readdirSync(new URL('../dist/',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(root,join(e.parentPath,e.name))).sort();
 assert.deepEqual(actual,[...Object.keys(nflxFixture().additions),...Object.keys(uberFixture().additions),...Object.keys(mcdFixture().additions),...Object.keys(simulationUiFixture().additions),...Object.keys(umcFixture().additions),...Object.keys(cevaDeliveryFixture().additions),...Object.keys(cevaRmbsFixture().additions),...Object.keys(allocationRepairFixture().additions),...Object.keys(f.baselineProduction),...Object.keys(f.additions),...Object.keys(armFixture().additions),...Object.keys(keysFixture().additions)].sort(),'No unreviewed production files or raw-source additions');
 for(const[p,h]of Object.entries(f.additions)){assert.equal(sha(reverseArmIntegration(p,read(p))),h,p);assert.doesNotMatch(p,/\/raw\/|\/transcripts\//);}
});

test('SNDK preserves all 27 original defaults, edits, seeded trials, restored outputs, ordering and locale keys',async()=>{
 const old=JSON.parse(read('tests/fixtures/sndk-v71-output-goldens.json'));
 const actual=await captureResearchSnapshot(fileURLToPath(new URL('..',import.meta.url)));
 assert.deepEqual(actual.currentOrder,[...actual.order,'CEVA','RMBS','UMC','MCD','UBER','NFLX'],'The complete current company order admits only the six explicitly reviewed later companies');
 assert.equal(old.order.length,27);assert.equal(actual.order.length,30);
 assert.deepEqual(actual.order,[...old.order,'SNDK','ARM','KEYS']);
 assert.deepEqual(actual.companies,old.companies,'all old 27 default/edited/seeded/restored values and bilingual result rendering');
 for(const kind of ['localeKeys','translatedKeys'])for(const[k,v]of Object.entries(old[kind]))assert.equal(actual[kind][k],v,kind+' '+k);
 for(const locale of ['en','zh-Hans'])for(const[k,v]of Object.entries(old.locales[locale]))assert.deepEqual(actual.locales[locale][k],v,locale+' '+k);
});
