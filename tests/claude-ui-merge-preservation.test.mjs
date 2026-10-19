import {uberFixture,UBER_FIXTURE_PATH,UBER_ADDED_PATHS,reverseUberIntegration} from './uber-integration-preservation.mjs';
import {mcdFixture,MCD_FIXTURE_PATH} from './mcd-integration-preservation.mjs';
import {simulationUiFixture} from './claude-simulation-ui-preservation.mjs';
import {umcFixture} from './umc-integration-preservation.mjs';
import {cevaDeliveryFixture} from './ceva-delivery-preservation.mjs';
import {cevaRmbsFixture} from './ceva-rmbs-integration-preservation.mjs';
import {allocationRepairFixture,reverseCompanyAllocationRepair} from './company-allocation-repair-preservation.mjs';
import {reverseRealityCheckFix} from './reality-check-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mergeFixture,mergeSHA,reverseClaudeUiMerge} from './claude-ui-merge-preservation.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
test('Claude UI merge reverses only four reviewed files and preserves every V75 production byte',()=>{
 const f=mergeFixture();assert.equal(f.baselineCommit,'107a8d945dcfd7e10ae591b47733bfb86a69b6de');
 assert.equal(Object.keys(f.baselineProduction).length,685);
 assert.deepEqual(Object.keys(f.files).sort(),['dist/guided.js','dist/research-view.js','dist/skins/report-journey.js','dist/skins/report.css']);
 for(const [p,h] of Object.entries(f.baselineProduction))assert.equal(mergeSHA(reverseClaudeUiMerge(p,read(p))),h,p);
 for(const p of Object.keys(f.files))assert.throws(()=>reverseClaudeUiMerge(p,Buffer.concat([read(p),Buffer.from('\n/* unrelated */')])),/exact reviewed Claude UI/);
 const corrections={
  'dist/skins/report-journey.js':[["{d} → value changes by up to {pct}","{d} → value ±{pct}"],["{d} → 价值最多变动 {pct}","{d} → 价值 ±{pct}"],["{pct} of operating value comes after year", "{pct} of the value comes after year"],["营业价值中有 {pct} 来自第", "价值中有 {pct} 来自第"]],
  'dist/skins/report.css':[["& body .rx-tn-plot > i, & body .rx-story-impact::before", "& body :is(.rx-tn-plot > i, .rx-story-impact::before)"]]
 };
 for(const [p,changes] of Object.entries(corrections)){
  let restored=reverseRealityCheckFix(p,read(p)).toString();for(const [after,before] of changes){assert.equal(restored.split(after).length-1,1);restored=restored.replace(after,before);}
  assert.equal(mergeSHA(restored),f.files[p].upstreamSHA256,p+' exact Claude bytes apart from explicit functional/copy corrections');
 }
 const guided=reverseCompanyAllocationRepair('dist/guided.js',read('dist/guided.js')).toString();
 assert.equal(mergeSHA(Buffer.from(guided.replace("'data-bridge':'null','data-sensitivity':'null'","'data-bridge':'null'"))),f.files['dist/guided.js'].upstreamSHA256,'Only withholding stale sensitivity differs from Claude guided.js');
});
test('Merged production contains no unapproved SVCO package or production additions',()=>{
 const f=mergeFixture();const paths=fs.readdirSync(new URL('../dist/',import.meta.url),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>relative(fileURLToPath(new URL('..',import.meta.url)),join(e.parentPath,e.name))).sort();
 assert.deepEqual(paths,[...Object.keys(f.baselineProduction),...Object.keys(uberFixture().additions),...Object.keys(mcdFixture().additions),...Object.keys(simulationUiFixture().additions),...Object.keys(umcFixture().additions),...Object.keys(cevaDeliveryFixture().additions),...Object.keys(cevaRmbsFixture().additions),...Object.keys(allocationRepairFixture().additions)].sort());
 assert.equal(paths.some(p=>/svco/i.test(p)),false);
});
