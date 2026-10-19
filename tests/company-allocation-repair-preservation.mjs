import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
export const allocationRepairFixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/company-allocation-repair-v78.json',import.meta.url)));
export const allocationRepairSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export function reverseCompanyAllocationRepair(path,bytes){
 const f=allocationRepairFixture().files[path];if(!f)return bytes;
 assert.equal(allocationRepairSHA(bytes),f.afterSHA256,path+' exact reviewed company allocation repair bytes; exact reviewed reality-check fix bytes; exact reviewed Claude UI merge bytes; exact reviewed KEYS integration bytes; exact reviewed annual field errors bytes; exact reviewed ARM integration bytes; exact reviewed SNDK integration bytes; exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 const before=Buffer.from(f.beforeText);assert.equal(allocationRepairSHA(before),f.beforeSHA256,path+' exact V78 original bytes');return before;
}
