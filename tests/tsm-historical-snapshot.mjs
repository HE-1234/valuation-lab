// Historical catalog snapshots retain their exact pre-correction TSM input.
// Only this saved input is supplied; all calculations, edits, restores, seeded
// simulations and rendering still execute the shipped production modules.
// Fresh current TSM defaults are checked independently in the companion test.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const sha=x=>createHash('sha256').update(x).digest('hex');
export async function historicalTsmSnapshotStorage(root,existing=new Map()){
 const storage=new Map(existing),key='valuation-lab-annual-research-v1:TSM';
 assert.equal(storage.has(key),false,'Historical snapshot setup must not overwrite a supplied TSM draft');
 const bytes=fs.readFileSync(root+'/dist/data/studio-research-presets-2026-10-17-v1.json');
 assert.equal(sha(bytes),'784775d9a6eb8f5d199b95f4c239b17e648ada8d04bc5cc8ef01976e2d7bec5d','Exact immutable source preset bytes');
 const bundle=JSON.parse(bytes),{currentResearchDraft}=await import(pathToFileURL(root+'/dist/current-research-defaults.js'));
 const draft=currentResearchDraft(bundle.presets.find(p=>p.ticker==='TSM'),bundle);
 const clean=structuredClone(draft);delete clean.updatedAt;
 assert.equal(sha(JSON.stringify(clean)),'51269f83ab2c215eaa31523a3910c30fa2f00098ebb40bbf69faef3288225e31','Exact pre-correction TSM default recorded in the immutable prior-company fixtures');
 assert.equal(draft.bridgeInputs.customerReceiptClaim,291101.8);assert.equal(draft.tsmReceiptReview,undefined);
 storage.set(key,JSON.stringify(draft));return storage;
}
