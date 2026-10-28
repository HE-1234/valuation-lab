// Usage: node check.mjs TICKER [patch.json]  -> prints Year-by-year per-share status with an optional draft patch.
import fs from 'node:fs';
const D='/Users/erichuang/Documents/Code/valuation-lab/dist/';
const {incrementalRecord}=await import(D+'incremental-registry.js');
const {researchDraftFor,calculateResearchOperating,researchTimingResult}=await import(D+'research-model.js');
const {calculateResearchBridge}=await import(D+'research-claims.js');
const {analystAllocationResult}=await import(D+'analyst-allocation-view.js');
const {nvmiConditionalResult}=await import(D+'nvmi-conditional-view.js');
const [t,file]=process.argv.slice(2);
const rec=incrementalRecord(t);
const renewed=JSON.parse(fs.readFileSync(D+'data/renewed-research-2026-10-17/cases.json','utf8')).companies.find(c=>c.ticker===t);
if(!rec&&!renewed)throw Error('no research case '+t);
const d=researchDraftFor(rec?rec.annualCase:renewed);
if(!rec&&process.env.CAPITAL_PRESET){const {getCurrentCapitalPreset}=await import(D+'current-capital-presets.js');const pr=getCurrentCapitalPreset(t);if(pr){d.currentCapitalScenario=structuredClone(pr.scenario);d.timing=structuredClone(pr.timing);}}
if(file){const p=JSON.parse(fs.readFileSync(file,'utf8'));Object.assign(d,structuredClone(p.draftPatch));}
const op=calculateResearchOperating(d),timing=researchTimingResult(d,op);
let bridge=null;try{bridge=calculateResearchBridge(d,timing.enterprise,{...(d.bridgeInputs||{}),calculationDate:timing.date});}catch(e){bridge={message:e.message};}
const a=analystAllocationResult(d);let n=null;try{n=nvmiConditionalResult(d);}catch(e){n={error:e.message};}
const out={ticker:t,origin:d.discountOrigin,currency:d.currency,EV:op.enterprise,timing:timing.status,
 bridge:{equity:bridge?.equity??null,perShare:bridge?.rawPerShare??null,message:bridge?.message||bridge?.reason||null,status:bridge?.status||null},
 analyst:a&&{status:a.status,perShare:a.perShare,signed:a.signedResidualPerShare,missing:a.missing,errors:(a.errors||[]).map(e=>Array.isArray(e)?e[0]:e)},
 nvmi:n&&{perShare:n.perShare,error:n.error||null,status:n.status||null}};
const per=out.bridge.perShare??out.analyst?.perShare??out.nvmi?.perShare;
console.log(JSON.stringify({...out,PER_SHARE:Number.isFinite(per)?per:null},null,1));
