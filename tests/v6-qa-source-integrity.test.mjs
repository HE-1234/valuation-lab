import {originalResearchBytes} from './research-presentation-original.mjs';
// Independent v6 QA: protect dated sources and frozen historical research.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as current from '../dist/current-model.js';
import {eligibleSnapshots} from '../dist/engine.js';
const baselineHashes={
  "engine.js": "3229a8fcc63a64b34051be19e375484445878c9cd7ada030fa8b3397dac8e8f7",
  "data/companies.json": "6cdf199740c0549e32258211dd31abea59259cf46ecd7526b43bf932abf1e4b9",
  "data/current-market-references.json": "cb1ea4dd76a79c15a9379963e95ab5c52376fd499e6c105e1c75c2ff74c19850",
  "data/current-universe.json": "6f607bb6dd8707e91810bbdf251a8ffb358d1b44fe739ec2418c36fb3b9e8be1",
  "data/frozen-case-evaluation.json": "cd7025bdd351be41a24675b5fb4f20a0620fa17a3ff5c6b267c79608be2267a6",
  "data/guided-content.json": "88463669d52625fdb5272cd617ab26d6d4d27c39ee22fc394d846510bd6fb9c0",
  "data/msft-annual-scenario-paths.csv": "1bcb7f35f04cc0de6eee31a67b8fb823f8ae735258da8d11fad0d4b960e774cd",
  "data/msft-business-outcome-evaluation.json": "dc187b573504fa367acc7db157f0900b3ccdc93c041ea7b8ecc6553a42cf52b2",
  "data/msft-independent-check.json": "4ba080c05091830f112023f7c8c23d209b2b1a05bf42d8f807ec72cc2580a990",
  "data/msft-researched-cases.json": "f17bb13a289ea6ae53a5ca682e53c97ba7bf75445f8e05f54b50d85e8e5f7258",
  "data/nvda-cases.json": "3aaecd25b835ce2cf7857d47be26a63ae5b119bd367d434ebe8e2f410b5621a8",
  "data/nvda-claim-scale-diagnostics.json": "aaaf1221694fbf4d712d13d651f4caab3843b747d27f6c71434fb34176a72ed4",
  "data/nvda-fy2025-outcome.json": "d9b9d3d0d046fc1a7ce9a2153a6cc767e3238b748de819c1606cfa0e11be3ead",
  "data/nvda-outcomes.json": "f68410dca37b185119a7752d693c0268928821fedd3eabb18f68143c32f6511f",
  "data/nvda-price-observations.json": "2b000fbb491635290757926c7aa15eb9d5aa9535a13c3bf18af5fcad7ea91642",
  "data/nvda-researched-cases.json": "f222cd3ce4c31c620672080223c795c81bf8cb0f54e3c1170951a55b4cb0ca39",
  "data/provider-research.html": "b9e49336ad974f7303a4fad2a7af2a9a5a704565e136f3861dec1c2bd15868f8",
  "data/research-addenda.json": "41bb214aaac5f8ccacac8e2e072466aef6cc50b20ebf10f45dbe6b1ccb1c1219",
  "data/research-versions/FY2024-terminal-scale-constraints-v1.json": "dae3080be97a7b4480d9477c481de745441dece3be7a93442697ccb388c8b968",
  "data/research-versions/MSFT-FY2019-frozen-v1.json": "437167e8e7655cd7421972c7b05a1f4d29cbbc694cb4ac63355448c5ab7c37a0",
  "data/research-versions/MSFT-FY2019-frozen-v1.sha256": "a983ad72062aac7bc09fd6dea9a40cd436e3a008769e34777abb6fc203b7dffb",
  "data/research-versions/NVDA-FY2021-Arm-contingent-supplement.json": "c7ab3abed494e8a33e1d5caec2f5cae39846577642c5155eb86c742d3ac0ffec",
  "data/research-versions/NVDA-FY2021-frozen.json": "52e83dbdf658f0ca8b76eae1e26aaecb4d706024e16b2f13ced07b4aa933061a",
  "data/research-versions/NVDA-FY2021-frozen.sha256": "2d421e88f856148c2d656ed4e30fe8280668ff78e3d4163ef116eb3fc286c0c1",
  "data/research-versions/NVDA-FY2021-method-diagnostics-v2.json": "8a03f8d0941592afbdc4602c47a368eeda508bd59fc79d502a1ee67e730c7238",
  "data/research-versions/NVDA-FY2022-frozen.json": "349c2f8b0c153f78d9390d1ea7e13fc8305015e367973ef2918bc59fb9932d1a",
  "data/research-versions/NVDA-FY2022-frozen.sha256": "e388a86da02435da5f820debe37bb6f2642d63c8a9b2ac6b8f19c43e90f97e18",
  "data/research-versions/NVDA-FY2023-frozen.json": "bead6a90cfecf5451bacff55478de4b29b9c4d74952e16b52fde5bab02fd3ff8",
  "data/research-versions/NVDA-FY2023-frozen.sha256": "f425e2544c4b947663dae845496209d6fd92114b393ad0b086dbd949fa82465a",
  "data/research-versions/NVDA-FY2024-frozen.json": "d799745495fc7feca090f5cccc37cca594eaf7b169eed65fc42c57db9a104d16",
  "data/research-versions/NVDA-FY2024-frozen.sha256": "2f2eab2b3d6a66e9015eec70d3efd316c89db8044ad836f51c7157ed2d425966",
  "data/research-versions/NVDA-FY2024-method-diagnostics-v2.json": "62c2fddff7fe6afb83664131dfeafddb52a8ed627ff1cd714cc0426fa800a5c7",
  "data/research-versions/legacy-award-evidence-v1.json": "91b6b4226ba0b6d002261e741db8f5e35c176da9ca1e2d715a2f171ecfd62da7",
  "data/research-versions/market-anchor-stress-v1.json": "34847cb0eec11e81249af9395d1908730c6056fcd0235d2d9e87a6dc703b0c0a",
  "data/research-versions/operating-miss-diagnosis-v1.json": "4d89b7c505e8c3cf58646cdc3f2f566aa2874a2ed23ab772ed31a5c3aea1c57d",
  "data/reverse-dcf-diagnostics.json": "3d6649d8a4eb2f0b898eede646f08e4bf766095b9834f434daadec0c1c09adfe"
};
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url));
for(const [file,expected] of Object.entries(baselineHashes))test(`v6 QA: protected source bytes ${file}`,()=>{
 assert.equal(createHash('sha256').update(originalResearchBytes(file,read(file))).digest('hex'),expected,`Protected engine/data changed unexpectedly (v7 engine permits explicit provisional bridge only): ${file}`);
});
test('v6 QA: every requested company retains current-only dated sources',()=>{
 const library=JSON.parse(read('data/current-universe.json'));
 assert.deepEqual(library.companies.map(x=>x.ticker).sort(),[...current.REQUIRED_TICKERS].sort());
 for(const company of library.companies){
  assert.ok(company.snapshots.length>0,company.ticker);
  for(const raw of company.snapshots){
   const snapshot=current.currentSnapshot(company,raw);
   assert.equal(snapshot.backtestEligible,false,company.ticker);
   assert.deepEqual(eligibleSnapshots([snapshot],'2099-12-31'),[],`${company.ticker} leaked into a historical information set`);
   assert.match(snapshot.sourceUrl,/^https:\/\//,`${company.ticker} source`);
  }
 }
});
test('v6 QA: supplied specialist cases remain gated after every review checkbox',()=>{
 const library=JSON.parse(read('data/current-universe.json'));
 for(const ticker of ['NBIS','TSM']){
  const company=library.companies.find(x=>x.ticker===ticker);
  for(const raw of company.snapshots){
   const snapshot=current.currentSnapshot(company,raw);
   const draft={...current.draftFor(company,raw),cutoff:'2026-10-17',modelReviewed:true,bridgeReviewed:true};
   assert.ok(current.currentIssues(snapshot,draft).some(x=>/withheld|specialist|mapping/i.test(x)),ticker);
   assert.throws(()=>current.calculateCurrent(snapshot,draft),undefined,ticker);
  }
 }
});
