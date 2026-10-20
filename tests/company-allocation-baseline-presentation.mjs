// Prior UI goldens are tested through the exact reversed V78 presentation layer.
// Current numerical/model captures still run the shipping engine. The new UI has
// separate runtime tests, and all source edits are hash-pinned by reversal tests.
import {allocationRepairFixture,allocationRepairSHA} from './company-allocation-repair-preservation.mjs';
import {startResearchWorkspace} from './research-workspace-v87-golden-harness.mjs';
import assert from 'node:assert/strict';
let baseline;
export async function allocationBaselineView(){
 if(!baseline){const file=allocationRepairFixture().files['dist/research-view.js'];assert.equal(allocationRepairSHA(file.beforeText),file.beforeSHA256);const root=new URL('../dist/',import.meta.url).href;const source=file.beforeText.replace(/from '\.\//g,"from '"+root).replace(/import '\.\//g,"import '"+root);baseline=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
 return baseline;
}
export async function allocationBaselineWorkspace(options){
 const {mountResearchWorkspace}=await allocationBaselineView();return startResearchWorkspace({...options,workspaceMount:mountResearchWorkspace});
}
