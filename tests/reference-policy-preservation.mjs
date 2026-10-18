import fs from 'node:fs';
import assert from 'node:assert/strict';
import {annualTerminalDefaults} from '../dist/simulation.js';
const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/reference-defaults-v52.json',import.meta.url)));
const hooks=JSON.parse(fs.readFileSync(new URL('./fixtures/reference-defaults-reviewed-hooks.json',import.meta.url)));
export function reverseReferencePolicyHooks(path,bytes){
 if(!hooks.files[path])return bytes;
 let text=bytes.toString();
 for(const hook of hooks.files[path]||[]){assert.equal(text.split(hook.reviewedAdditiveLine).length-1,1,path+' exact reference-policy hook');text=text.replace(hook.reviewedAdditiveLine,hook.originalLine);}
 return Buffer.from(text);
}
// Earlier company releases protected the same quiz bytes. Normalize only the
// six reviewed navigation fragments; retain their original baseline bytes/hashes.
export function reverseLearnQuestionVisibility(path,bytes){
 if(path!=='dist/learn-quiz-view.js')return bytes;
 const approved=(hooks.files[path]||[]).filter(hook=>hook.change==='learn-question-visibility');
 assert.equal(approved.length,6,'exactly six reviewed Learn visibility fragments');
 let text=bytes.toString();
 for(const hook of approved){assert.equal(text.split(hook.reviewedAdditiveLine).length-1,1,path+' exact Learn visibility hook');text=text.replace(hook.reviewedAdditiveLine,hook.originalLine);}
 return Buffer.from(text);
}
// Existing V51 full-result hashes still replay the exact V51/V52 configuration,
// including its selected anchors. New policy is tested separately against it.
export function savedReferenceConfigV52(draft){
 const saved=baseline.incrementalDefaults[draft.ticker];
 return saved?{...structuredClone(saved),annualTerminal:annualTerminalDefaults(draft.terminal)}:null;
}
