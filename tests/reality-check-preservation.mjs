import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const realityFixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/reality-check-v77-fix.json',import.meta.url)));
export const realitySHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reverseRealityCheckFix(path,bytes){
 const f=realityFixture().files[path];if(!f)return bytes;
 assert.equal(realitySHA(bytes),f.afterSHA256,path+' exact reviewed reality-check fix bytes; exact reviewed Claude UI merge bytes; exact reviewed KEYS integration bytes; exact reviewed annual field errors bytes; exact reviewed ARM integration bytes; exact reviewed SNDK integration bytes; exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 const restored=Buffer.from(f.beforeText);assert.equal(realitySHA(restored),f.beforeSHA256,path+' exact V77 baseline');return restored;
}
