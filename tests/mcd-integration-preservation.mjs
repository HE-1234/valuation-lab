import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
// Exact MCD-only reversal, ahead of the separate UI layer. No earlier fixture is rewritten.
export const MCD_BASE_COMMIT="623c06999d68a162202db636dc230dc88dc68866";
export const MCD_FIXTURE_PATH='tests/fixtures/mcd-integration-final-ui.json';
export const MCD_MODIFIED_PATHS=Object.freeze([
  "dist/amd-periods.js",
  "dist/annual-growth-horizon.js",
  "dist/annual-revenue-growth-chart.js",
  "dist/data/atlas-company-catalog-v1.json",
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
export const MCD_ADDED_PATHS=Object.freeze([
  "dist/data/incremental-MCD-2026-10-19-v2/INDEPENDENT-RECHECK-v2.md",
  "dist/data/incremental-MCD-2026-10-19-v2/MCD-v2.html",
  "dist/data/incremental-MCD-2026-10-19-v2/MODEL-v2.md",
  "dist/data/incremental-MCD-2026-10-19-v2/README.md",
  "dist/data/incremental-MCD-2026-10-19-v2/STUDY-v2.md",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation-illustrations-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation-policy-illustration-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation-policy-template-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation_examples_v2.py",
  "dist/data/incremental-MCD-2026-10-19-v2/assumption-rationale-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/capital-claims-scope-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/cases.json",
  "dist/data/incremental-MCD-2026-10-19-v2/change-impact-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/comparability-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/dcf-inputs-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/dcf-output-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/extraction-corrections-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/forecast-v2.csv",
  "dist/data/incremental-MCD-2026-10-19-v2/history-field-provenance-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/history-v2.csv",
  "dist/data/incremental-MCD-2026-10-19-v2/history-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/independent-recheck-results-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/latest-half-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/management-targets-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/manifest-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/packaging-manifest.json",
  "dist/data/incremental-MCD-2026-10-19-v2/readiness-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/replay_dcf_v2.py",
  "dist/data/incremental-MCD-2026-10-19-v2/review-focus-v2.md",
  "dist/data/incremental-MCD-2026-10-19-v2/review-history-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/revision-notes-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/sensitivity-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/source-provenance-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/tradability-evidence-v1.json",
  "dist/data/incremental-MCD-2026-10-19-v2/verification-v2.json",
  "dist/data/incremental-MCD-2026-10-19-v2/verify_v2.py",
  "dist/mcd-financial-engine.js",
  "dist/mcd-messages.js",
  "dist/mcd-research-model.js",
  "dist/mcd-research-registry.js",
  "dist/mcd-research-view.js"
]);
export const MCD_REVIEWED_HASHES=Object.freeze({
  "dist/amd-periods.js": "5ca99af427f5d68b004f817854e415da2b30ae426cf3a5e3615651033cf7e4b0",
  "dist/annual-growth-horizon.js": "bf00f6c475d8afd970f290e488bcdf4daa0695b843be845d6eed4546f95bed51",
  "dist/annual-revenue-growth-chart.js": "c80a61289059bd23ce774c38dbda6818655280960d606263562ef1d4a0317ab9",
  "dist/data/atlas-company-catalog-v1.json": "c7e791c8021dd34b018c2683f4d9bec80f8323031ce2063971458f9b25f63476",
  "dist/incremental-messages.js": "98b502cc2be82d128d2b3ef22e7e9fe0a80c8d9fb954f1522f432578c600d246",
  "dist/incremental-registry.js": "96d28f0aa9be8a7c1913be95bb54e5b0dff5b0abf737c22f1ccc36bc170c3730",
  "dist/incremental-research-claims.js": "b2788f829caebbddaaa5d30fdeade49df25dff36803d11ffb7c99eda91f085d7",
  "dist/incremental-research-view.js": "ad1779e47a5cbf66e72dfe109dbc8af5098b18e774c7d925c08659f74d61f3f9",
  "dist/incremental-research.js": "e94840b30d221113b139a37d42a821c9e662e578de44900248ced4678c67e060",
  "dist/research-model.js": "966e35d9e9413e6bf66426a4b91521865dd49560ba9dc49c1687a47368e771a4",
  "dist/research-simulation-view.js": "83c937dc1819892505f4fd294537be80427bccd9cf6ddfde3543fe3235617ae0",
  "dist/research-simulation.js": "7dce7cf09400a2f609fa0768624957599ed163396d62e8c93bdb56bba3ae5842",
  "dist/research-view.js": "54caf365138e1712cad1a566a57f5f77d0cb2e42d62ace68c76d6e343fd8eb45",
  "dist/data/incremental-MCD-2026-10-19-v2/INDEPENDENT-RECHECK-v2.md": "987c6e1b6e7483b884ff7a9b0d74abb682e0be98cc898f49379e4ac23ede567e",
  "dist/data/incremental-MCD-2026-10-19-v2/MCD-v2.html": "b0058757105ffb1988d1e7a9d6d4dc6c79bd4c0ddc64e02c2f38973b19378f7c",
  "dist/data/incremental-MCD-2026-10-19-v2/MODEL-v2.md": "0d64e1603c7fc8eb14536671e2ec30766e6f659691c6bc6ca41c89ef7ae7b40e",
  "dist/data/incremental-MCD-2026-10-19-v2/README.md": "d14466a239d76c8010a3a7939d1f683c4f6f5ac8af37f191c03fc3ac60c5c1fc",
  "dist/data/incremental-MCD-2026-10-19-v2/STUDY-v2.md": "e50db75c891467cf4c41ef20ee41cd4af742d1aeb1d514d1f518b622168f82fc",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation-illustrations-v2.json": "c49ccc8e590d47c650efcf6978ce045319a0b25812b05d71cea81c3fd1905245",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation-policy-illustration-v2.json": "4f764d2be4d304b40616ed7f08f2d7f732937465305f500d91ad874d66ac0b3d",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation-policy-template-v2.json": "c5002df1a27c5a2416137e5d1570f9ca3e84bc46d683440015a28deacf4d4eb1",
  "dist/data/incremental-MCD-2026-10-19-v2/allocation_examples_v2.py": "0cb518e987e8117b9125f72fdd2a1c5d9aca7fb499aad13f758ffccd9c7b1ee5",
  "dist/data/incremental-MCD-2026-10-19-v2/assumption-rationale-v2.json": "927d49aca832fe5180f937991db166f989b4d65189cd6fc3f0097a802e01fa68",
  "dist/data/incremental-MCD-2026-10-19-v2/capital-claims-scope-v2.json": "31f28a5f395be4b6a4d4f9ac2b47781a971518bc9fb75b1f86049d6a24cf77b9",
  "dist/data/incremental-MCD-2026-10-19-v2/cases.json": "d58bce3005aa8100108dc1c05b6ddb3af59502e78e83f7f9de5af655c7204669",
  "dist/data/incremental-MCD-2026-10-19-v2/change-impact-v2.json": "f4a552c4a5d244a0a433e22405d323b1fea2c96cc4f4f5a1067be87e4f53fb18",
  "dist/data/incremental-MCD-2026-10-19-v2/comparability-v2.json": "08572039fccf33df08b19d504347a2927500192f7e58dc4694df8dcb6bab96b8",
  "dist/data/incremental-MCD-2026-10-19-v2/dcf-inputs-v2.json": "e67fdacce8641cb89bb025784635f44699fb6458e5238a7c69f89fefacd4713e",
  "dist/data/incremental-MCD-2026-10-19-v2/dcf-output-v2.json": "611003c6c341aadd6e55885cefa896e53ec37c47dc609b14fd59d9c653aa8672",
  "dist/data/incremental-MCD-2026-10-19-v2/extraction-corrections-v2.json": "28ceb95652273e2ef5c322c0b5f4bace6c17f44826e36949f2496d8d9b6c68a8",
  "dist/data/incremental-MCD-2026-10-19-v2/forecast-v2.csv": "8f4e66c06a544856248034dc5548e33c4e1204c2698c93ccfd87a00aac7c9e62",
  "dist/data/incremental-MCD-2026-10-19-v2/history-field-provenance-v2.json": "7134de512a452b551473b5561c1e7ab2c8554f2d3efee0c152eb2121eb599ca8",
  "dist/data/incremental-MCD-2026-10-19-v2/history-v2.csv": "c2266a0f908e751a2f73b9186c09636803dc1243e60a7c5d2413f27ef7c4e7ce",
  "dist/data/incremental-MCD-2026-10-19-v2/history-v2.json": "e27b8cae043526f85e35835a6bf4f278b2a2342392aa34e45c22a8c365f55534",
  "dist/data/incremental-MCD-2026-10-19-v2/independent-recheck-results-v2.json": "4f6efe4998cf1139aefcdfce4a8b185e0f10cbb220d8109213bd72882c2e3520",
  "dist/data/incremental-MCD-2026-10-19-v2/latest-half-v2.json": "d0513c8bc289f91e2964786c96032898ef456b60618fbc0acc234d1fc514423d",
  "dist/data/incremental-MCD-2026-10-19-v2/management-targets-v2.json": "5086051add92257bf62cd93138bda29f1f36a02838b27ce74dac94b614799ea5",
  "dist/data/incremental-MCD-2026-10-19-v2/manifest-v2.json": "0424bf60302dff0cf3e064ef518713aa6787dc0219460e9a94b99a34f96a7045",
  "dist/data/incremental-MCD-2026-10-19-v2/packaging-manifest.json": "236d1a86cec2ba58024efb5c748687e3ac59ba5d15a115c0b32684968fd9a261",
  "dist/data/incremental-MCD-2026-10-19-v2/readiness-v2.json": "a7388d26d7fc007fc578e71545855525fa835af1c9451df3ef0bd6ffca248868",
  "dist/data/incremental-MCD-2026-10-19-v2/replay_dcf_v2.py": "d914cdc92eefac9e6cf31a0236e893b911f1f2598ef6cc6bbcc6520ec333dc69",
  "dist/data/incremental-MCD-2026-10-19-v2/review-focus-v2.md": "8b481417fc8f61c361cd731664493624818a0ea877ac3607ffe3a05fb7e593a7",
  "dist/data/incremental-MCD-2026-10-19-v2/review-history-v2.json": "c5fc50146fc9b77873b9b166ad498a41165037c4d8be81ca9d472a9b25605ca7",
  "dist/data/incremental-MCD-2026-10-19-v2/revision-notes-v2.json": "2753977576ffca5414eae1a3eaf7600a59f955bc60360d23689bb558b7054dae",
  "dist/data/incremental-MCD-2026-10-19-v2/sensitivity-v2.json": "f091f5072c18b21589e2bc7649d2973908f80b116beabc71e8416a137d8a1a1d",
  "dist/data/incremental-MCD-2026-10-19-v2/source-provenance-v2.json": "0e3caaec4bd1eff06b944be5d9e64cee18eceb8a32a5cebd0e61ba0f746f944d",
  "dist/data/incremental-MCD-2026-10-19-v2/tradability-evidence-v1.json": "abdb5f8dcd523f45e1bf26eacc399a72cb1bed749f08841d2d9d4902bcba36ce",
  "dist/data/incremental-MCD-2026-10-19-v2/verification-v2.json": "f7cf6087f7a60e4a3d1becc5fb4cbf437e1dc9c72a6b01adb251e26b0cbfbc2e",
  "dist/data/incremental-MCD-2026-10-19-v2/verify_v2.py": "5ec02afa8fa0e3956668cfa724215f45e92ad191b8159f10078b67b6dade22e3",
  "dist/mcd-financial-engine.js": "176ced070f22d0cf68ad4cbf36b38517dc1c46c2950a597a755e75258ddb2777",
  "dist/mcd-messages.js": "da67d2b4195983235ae52da6bc0d323474a759d39052ed704f8f85be8be47655",
  "dist/mcd-research-model.js": "09a3ccc915b9de82fd78a740f67819196d58d9d1bd866227a1318391b43fda2f",
  "dist/mcd-research-registry.js": "439ded63ac6360bf87ef8c980c6d2ca21d383037a05eccd164d60ff994916738",
  "dist/mcd-research-view.js": "440b31f8c28228c96eb76f8df88fcd1be7149a50deb0e5bd27755fe63e2fd958"
});
export const mcdSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export const mcdBlobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k),object=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const exact=(x,keys)=>object(x)&&Reflect.ownKeys(x).length===keys.length&&keys.every(k=>own(x,k));
const hash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const productionPath=x=>typeof x==='string'&&x.startsWith('dist/')&&!/[\\\0\r\n]/.test(x)&&x.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:64*1024*1024});
let cachedEntries;
function entries(){if(!cachedEntries){
 assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1');assert.equal(git('rev-parse',MCD_BASE_COMMIT+'^{commit}').toString().trim(),MCD_BASE_COMMIT);
 cachedEntries=new Map(git('ls-tree','-r','-z','--full-tree',MCD_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' '),path=row.slice(tab+1);assert.ok(productionPath(path));assert.equal(type,'blob');assert.ok(['100644','100755'].includes(mode));assert.match(oid,/^[0-9a-f]{40}$/);return [path,Object.freeze({mode,oid})];}));assert.equal(cachedEntries.size,849);
}return cachedEntries;}
export const mcdBaseEntries=()=>new Map(entries());
export function validateMcdFixture(f){
 assert.ok(exact(f,['baseCommit','files','additions']));assert.equal(f.baseCommit,MCD_BASE_COMMIT);
 assert.ok(exact(f.files,MCD_MODIFIED_PATHS));assert.ok(exact(f.additions,MCD_ADDED_PATHS));const baseline=entries();
 for(const [p,item]of Object.entries(f.files)){assert.ok(productionPath(p)&&baseline.has(p));assert.ok(exact(item,['beforeText','beforeSHA256','afterSHA256']));assert.equal(typeof item.beforeText,'string');assert.ok(hash(item.beforeSHA256)&&hash(item.afterSHA256));const b=Buffer.from(item.beforeText);assert.equal(b.toString(),item.beforeText);assert.equal(mcdSHA(b),item.beforeSHA256);assert.equal(mcdBlobSHA(b),baseline.get(p).oid);assert.equal(item.afterSHA256,MCD_REVIEWED_HASHES[p]);assert.notEqual(item.beforeSHA256,item.afterSHA256);}
 for(const [p,h]of Object.entries(f.additions)){assert.ok(productionPath(p)&&!baseline.has(p)&&hash(h));assert.equal(h,MCD_REVIEWED_HASHES[p]);}return f;
}
let cached;
export function mcdFixture(){if(!cached){const f=validateMcdFixture(JSON.parse(fs.readFileSync(new URL('../'+MCD_FIXTURE_PATH,import.meta.url))));Object.values(f.files).forEach(Object.freeze);Object.freeze(f.files);Object.freeze(f.additions);cached=Object.freeze(f);}return cached;}
export function reverseMcdIntegration(path,bytes,earlierContext=''){
 assert.ok(productionPath(path),String(path)+' must be an exact normalized dist path');assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');const f=mcdFixture();
 const message=path+' exact reviewed MCD integration bytes; exact reviewed Claude simulation UI bytes'+earlierContext;
 if(own(f.files,path)){assert.equal(mcdSHA(bytes),f.files[path].afterSHA256,message);return Buffer.from(f.files[path].beforeText);}
 if(own(f.additions,path))assert.equal(mcdSHA(bytes),f.additions[path],message+'; exact reviewed MCD addition bytes');return bytes;
}
