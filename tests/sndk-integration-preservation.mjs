import {reverseArmIntegration} from './arm-integration-preservation.mjs';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export async function captureResearchSnapshot(root){
const load=p=>import(pathToFileURL(root+'/'+p));
const read=p=>JSON.parse(fs.readFileSync(root+'/'+p));
const {startResearchWorkspace}=await load('tests/research-workspace-harness.mjs');
const {incrementalPackages}=await load('dist/incremental-registry.js');
const {calculateResearchOperating,researchTimingResult,restoreResearchDraft}=await load('dist/research-model.js');
const {calculateResearchBridge}=await load('dist/research-claims.js');
const {simulateResearch}=await load('dist/research-simulation.js');
const {incrementalMessageKeys,incrementalTranslatedMessageKeys}=await load('dist/incremental-messages.js');
const {setLocale,t}=await load('dist/i18n.js');
const hash=(await import('node:crypto')).createHash;
const clean=x=>{if(Array.isArray(x))return x.map(clean);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!['updatedAt','exportedAt','elapsedMs','durationMs'].includes(k)).map(([k,v])=>[k,clean(v)]));return x;};
const digest=x=>hash('sha256').update(JSON.stringify(clean(x))).digest('hex');
const out={order:[],companies:{},locales:{},localeKeys:incrementalMessageKeys,translatedKeys:incrementalTranslatedMessageKeys};
const storage=new Map();const options={storage,catalogBundle:read('dist/data/atlas-company-catalog-v1.json'),incrementalBundle:incrementalPackages};
const w=await startResearchWorkspace(options);
out.order=w.root.querySelectorAll('[data-research-company]').map(x=>x.getAttribute('data-research-company'));
if(!out.order.length)throw Error('Empty company order');
function calculate(d){const operating=calculateResearchOperating(d),timing=researchTimingResult(d,operating);return {operating,timing,bridge:calculateResearchBridge(d,timing.enterprise,{...d.bridgeInputs,calculationDate:timing.date})};}
for(const ticker of out.order.filter(x=>x!=='SNDK'&&x!=='ARM')){
 w.choose(ticker);let d=structuredClone(w.getState().draft);const c=w.getState().company;
 const base=calculate(d), config={...d.researchSimulationConfig,trials:9,seed:'V71-preservation-'+ticker};
 if(config.jointAnnual?.annualPath)config.jointAnnual=structuredClone(config.jointAnnual),config.jointAnnual.annualPath.innovationSD=.005;
 const seeded=simulateResearch(d,config);
 const edited=structuredClone(d);edited.annual[0].margin+=.0001;edited.notes='Preserve V71 user edits '+ticker;edited.userEdited=true;
 const restored=restoreResearchDraft(JSON.parse(JSON.stringify(edited)),c);
 out.companies[ticker]={defaultDraft:digest(d),default:digest(base),edited:digest(calculate(edited)),seeded:digest(seeded),restored:digest(restored),restoredOutput:digest(calculate(restored.draft)),accepted:seeded.accepted};
 for(const locale of ['en','zh-Hans']){setLocale(locale);out.companies[ticker][locale]=digest(w.get('#research-results').textContent);}
 setLocale('en');
}
w.destroy();
for(const locale of ['en','zh-Hans']){setLocale(locale);out.locales[locale]=Object.fromEntries(Object.entries(incrementalMessageKeys).map(([source,key])=>[source,{key,text:t(key)}]));}setLocale('en');
return out;
}

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const sha = value => createHash('sha256').update(value).digest('hex');
export const fixture = () => JSON.parse(fs.readFileSync(new URL('./fixtures/sndk-integration-v72.json', import.meta.url)));
export function reverseSndkIntegration(path, bytes) {
 bytes=reverseArmIntegration(path,bytes);
 const approved = fixture().files[path];
 if (!approved) return bytes;
 assert.equal(sha(bytes), approved.afterSHA256, path + ' exact reviewed SNDK integration bytes; exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes');
 let text = bytes.toString();
 for (const insertion of [...approved.insertions].reverse()) {
  assert.equal(text.slice(insertion.offset, insertion.offset + insertion.text.length), insertion.text, path + ' exact inserted span');
  text = text.slice(0, insertion.offset) + text.slice(insertion.offset + insertion.text.length);
 }
 const before=Buffer.from(text);
 assert.equal(sha(before),approved.beforeSHA256,path+' exact V71 preserved bytes');
 return before;
}
