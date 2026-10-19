// Exact UMC production delta from the immutable V81 tree. This is the newest
// reversal and runs once, at the beginning of the CEVA delivery chain.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const UMC_BASE_COMMIT='cf3641eaa10f6ec89c00f1447b862e717e881623';
export const UMC_MODIFIED_PATHS=Object.freeze([
  "dist/annual-growth-horizon.js",
  "dist/incremental-messages.js",
  "dist/incremental-registry.js",
  "dist/incremental-research-claims.js",
  "dist/incremental-research-view.js",
  "dist/incremental-research.js",
  "dist/research-model.js",
  "dist/research-simulation-view.js",
  "dist/research-simulation.js",
  "dist/research-view.js"
]);
export const UMC_ADDED_PATHS=Object.freeze([
  "dist/data/incremental-UMC-2026-10-19-v1/ADMISSION-v1.md",
  "dist/data/incremental-UMC-2026-10-19-v1/RESEARCH-v1.md",
  "dist/data/incremental-UMC-2026-10-19-v1/UMC-v1.html",
  "dist/data/incremental-UMC-2026-10-19-v1/VALUATION-METHOD-v1.md",
  "dist/data/incremental-UMC-2026-10-19-v1/admission-readiness-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/analyst-policy-examples-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/assumption-registry-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/build_history.py",
  "dist/data/incremental-UMC-2026-10-19-v1/build_interim.py",
  "dist/data/incremental-UMC-2026-10-19-v1/build_model.py",
  "dist/data/incremental-UMC-2026-10-19-v1/build_registry.py",
  "dist/data/incremental-UMC-2026-10-19-v1/capital-claims/README.md",
  "dist/data/incremental-UMC-2026-10-19-v1/capital-claims/capital-claims-facts-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/capital-claims/capital-claims-narrative-v1.md",
  "dist/data/incremental-UMC-2026-10-19-v1/capital-claims/deliverable-manifest-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/capital-claims/funding-inputs-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/capital-claims/provenance-qa-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/cases.json",
  "dist/data/incremental-UMC-2026-10-19-v1/dcf-inputs-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/dcf-output-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/fetch_sources.py",
  "dist/data/incremental-UMC-2026-10-19-v1/fx-ads-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/README.md",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/add_monthly.py",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/annual_capex_track_record.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/build_anchors.py",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/build_guidance.py",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/collect_expansions.py",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/collect_sources.py",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/dcf_operating_anchors.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/dcf_operating_anchors.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/expansion_source_manifest.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/guidance_qa.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/guidance_vs_actual.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/guidance_vs_actual.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/monthly_sales_cutoff.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/monthly_sales_cutoff.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/pending_guidance.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/quarterly_operating_facts.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/quarterly_operating_facts.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/source_manifest.json",
  "dist/data/incremental-UMC-2026-10-19-v1/guidance/source_manifest_complete.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-artifact-manifest-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-breaks-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-build-summary-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-comparative-differences-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-field-definitions-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-field-provenance-v1.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/history-latest-comparative-v1.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/history-latest-comparative-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-methodology-v1.md",
  "dist/data/incremental-UMC-2026-10-19-v1/history-observations-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-original-v1.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/history-original-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-sources-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/history-summary-v1.csv",
  "dist/data/incremental-UMC-2026-10-19-v1/history-validation-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/independent-review-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/independent-review-v1.md",
  "dist/data/incremental-UMC-2026-10-19-v1/independent_validate_v1.py",
  "dist/data/incremental-UMC-2026-10-19-v1/integrity-manifest-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/interim-facts-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/interim-field-provenance-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/package_v1.py",
  "dist/data/incremental-UMC-2026-10-19-v1/packaging-manifest.json",
  "dist/data/incremental-UMC-2026-10-19-v1/private-source-integrity-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/replay_v1.py",
  "dist/data/incremental-UMC-2026-10-19-v1/source-ledger-v1.json",
  "dist/data/incremental-UMC-2026-10-19-v1/test_v1.py",
  "dist/umc-financial-engine.js",
  "dist/umc-messages.js",
  "dist/umc-research-model.js",
  "dist/umc-research-registry.js",
  "dist/umc-research-view.js"
]);
export const umcSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export const umcBlobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const exact=(x,keys)=>object(x)&&Reflect.ownKeys(x).length===keys.length&&keys.every(k=>own(x,k));
const hash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const productionPath=x=>typeof x==='string'&&x.startsWith('dist/')&&!/[\\\0\r\n]/.test(x)&&x.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
const REVIEWED_ERROR=' exact reviewed UMC integration bytes; exact reviewed CEVA delivery fix bytes; exact reviewed CEVA/RMBS integration bytes; exact reviewed company allocation repair bytes; exact reviewed reality-check fix bytes; exact reviewed Claude UI merge bytes; exact reviewed KEYS integration bytes; exact reviewed annual field errors bytes; exact reviewed ARM integration bytes; exact reviewed SNDK integration bytes; exact reviewed CRDO integration bytes; exact reviewed user UI integration bytes; exact reviewed AMD integration bytes; exact reviewed MRVL integration bytes; exact reviewed CAMT integration bytes; exact reviewed ONTO integration bytes; exact reviewed conditional-tool bytes; exact isolated NVMI integration bytes';
let cachedBaseEntries;
function sourceEntries(){
 if(!cachedBaseEntries){
  const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:32*1024*1024}).toString();
  assert.equal(git('rev-parse','--show-object-format').trim(),'sha1','UMC source validation requires the pinned Git blob format');
  assert.equal(git('rev-parse',UMC_BASE_COMMIT+'^{commit}').trim(),UMC_BASE_COMMIT,'UMC source must be the exact immutable V81 commit');
  cachedBaseEntries=new Map(git('ls-tree','-r','-z','--full-tree',UMC_BASE_COMMIT,'--','dist').split('\0').filter(Boolean).map(row=>{
   const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' '),path=row.slice(tab+1);
   assert.ok(productionPath(path),'V81 source path must be an exact normalized production path');assert.equal(type,'blob','V81 source entry must be a blob');assert.ok(['100644','100755'].includes(mode),'V81 source entry must be a regular file');assert.match(oid,/^[0-9a-f]{40}$/);
   return [path,Object.freeze({mode,oid})];
  }));
  assert.equal(cachedBaseEntries.size,774,'All V81 production paths must be present in the pinned source');
 }
 return cachedBaseEntries;
}
export function umcBaseEntries(){return new Map(sourceEntries());}
export function validateUmcFixture(fixture){
 assert.ok(exact(fixture,['baseCommit','files','additions']),'UMC fixture requires only baseCommit, files and additions');
 assert.equal(fixture.baseCommit,UMC_BASE_COMMIT,'UMC fixture must pin the exact immutable V81 commit');
 assert.ok(exact(fixture.files,UMC_MODIFIED_PATHS),'UMC fixture permits only the exact ten reviewed modified paths');
 assert.ok(exact(fixture.additions,UMC_ADDED_PATHS),'UMC fixture permits only the exact 74 individually reviewed added paths');
 const baseline=sourceEntries();
 for(const [path,item]of Object.entries(fixture.files)){
  assert.ok(productionPath(path),path+' must be an exact normalized dist path');
  assert.ok(baseline.has(path),path+' modification must exist in immutable V81');
  assert.ok(exact(item,['beforeText','beforeSHA256','afterSHA256']),path+' requires only beforeText and exact before/after hashes');
  assert.ok(typeof item.beforeText==='string'&&hash(item.beforeSHA256)&&hash(item.afterSHA256),path+' requires text and SHA256 values');
  const before=Buffer.from(item.beforeText,'utf8');assert.equal(before.toString('utf8'),item.beforeText,path+' beforeText must round-trip as exact UTF8');
  assert.equal(umcSHA(before),item.beforeSHA256,path+' exact V81 before hash');
  assert.equal(umcBlobSHA(before),baseline.get(path).oid,path+' beforeText must equal the pinned immutable V81 source blob');
  assert.notEqual(item.beforeSHA256,item.afterSHA256,path+' must be an actual modification, not an allowlist');
  assert.ok(!own(fixture.additions,path),path+' cannot be both modified and added');
 }
 for(const [path,sha]of Object.entries(fixture.additions)){
  assert.ok(productionPath(path),path+' must be an exact normalized dist path');assert.ok(hash(sha),path+' requires one exact added-file SHA256');assert.ok(!baseline.has(path),path+' addition must not replace immutable V81 source');
 }
 return fixture;
}
let cachedFixture;
export function umcFixture(){
 if(!cachedFixture){const value=validateUmcFixture(JSON.parse(fs.readFileSync(new URL('./fixtures/umc-integration-v81.json',import.meta.url),'utf8')));for(const item of Object.values(value.files))Object.freeze(item);Object.freeze(value.files);Object.freeze(value.additions);cachedFixture=Object.freeze(value);}
 return cachedFixture;
}
export function reverseUmcIntegration(path,bytes){
 const fixture=umcFixture();assert.ok(productionPath(path),path+' must be an exact normalized dist path');
 assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');
 if(own(fixture.files,path)){
  const f=fixture.files[path];assert.equal(umcSHA(bytes),f.afterSHA256,path+REVIEWED_ERROR);
  const before=Buffer.from(f.beforeText,'utf8');assert.equal(umcSHA(before),f.beforeSHA256,path+' exact V81 original bytes');return before;
 }
 if(own(fixture.additions,path))assert.equal(umcSHA(bytes),fixture.additions[path],path+REVIEWED_ERROR+'; exact reviewed UMC addition bytes');
 // Unlisted paths remain unchanged, and the exhaustive whole-tree check compares
 // every such byte to immutable V81 Git blob IDs, including tree membership.
 return bytes;
}
