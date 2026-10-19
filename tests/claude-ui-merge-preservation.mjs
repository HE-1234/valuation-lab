import {reverseRealityCheckFix} from './reality-check-preservation.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const mergeFixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/claude-ui-v75-merge.json',import.meta.url)));
export const mergeSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reverseClaudeUiMerge(path,bytes){
 bytes=reverseRealityCheckFix(path,bytes);
 const f=mergeFixture().files[path];if(!f)return bytes;
 assert.equal(mergeSHA(bytes),f.afterSHA256,path+' exact reviewed Claude UI merge bytes; exact reviewed KEYS integration bytes; exact reviewed annual field errors bytes; exact reviewed ARM integration bytes; exact reviewed SNDK integration bytes; exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 const restored=Buffer.from(f.beforeText);assert.equal(mergeSHA(restored),f.beforeSHA256,path+' exact V75 baseline');return restored;
}
