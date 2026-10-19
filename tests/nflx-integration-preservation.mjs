import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
// Exact NFLX-only reversal, ahead of the separate UI layer. No earlier fixture is rewritten.
export const NFLX_BASE_COMMIT="28b4ee8560425337c92e75e2a053264ced7e2c43";
export const NFLX_FIXTURE_PATH='tests/fixtures/nflx-integration-mcd-uber-v85.json';
export const NFLX_MODIFIED_PATHS=Object.freeze([
  "dist/amd-periods.js",
  "dist/annual-growth-horizon.js",
  "dist/data/atlas-company-catalog-v1.json",
  "dist/incremental-messages.js",
  "dist/incremental-registry.js",
  "dist/incremental-research-claims.js",
  "dist/incremental-research-view.js",
  "dist/incremental-research.js",
  "dist/locales/company-catalog.js",
  "dist/research-model.js",
  "dist/research-simulation-view.js",
  "dist/research-simulation.js",
  "dist/research-view.js",
  "dist/simulation-error-i18n.js"
]);
export const NFLX_ADDED_PATHS=Object.freeze([
  "dist/data/incremental-NFLX-2026-10-19-v3/CHANGES-v3.md",
  "dist/data/incremental-NFLX-2026-10-19-v3/INDEPENDENT-REVIEW.md",
  "dist/data/incremental-NFLX-2026-10-19-v3/NFLX-v3.html",
  "dist/data/incremental-NFLX-2026-10-19-v3/README.md",
  "dist/data/incremental-NFLX-2026-10-19-v3/STUDY-v3.md",
  "dist/data/incremental-NFLX-2026-10-19-v3/build_history.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/build_mix.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/capital-claims-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/capital-rollforward-template-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/cases.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/dcf-inputs-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/dcf-output-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/equity-policy-template-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/fetch_sources.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/forecast-v3.csv",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-field-provenance-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-primary-table-checks-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-v3.csv",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-allocation-output-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-equity-policy-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-financing-rollforward-output-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-financing-rollforward-policy-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/latest-half-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/make_inputs.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/management-guidance-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/manifest-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/model-validation-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/operating-mix-history-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/package_v3.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/packaging-manifest.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/readiness-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/replay_dcf.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/sensitivity-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/source-provenance-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/source-repair-checks-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/stress-output-v3.json",
  "dist/data/incremental-NFLX-2026-10-19-v3/validate_model.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/verify_bundle.py",
  "dist/data/incremental-NFLX-2026-10-19-v3/verify_source_repairs.py",
  "dist/nflx-financial-engine.js",
  "dist/nflx-messages.js",
  "dist/nflx-research-model.js",
  "dist/nflx-research-registry.js",
  "dist/nflx-research-view.js"
]);
export const NFLX_REVIEWED_HASHES=Object.freeze({
  "dist/amd-periods.js": "63cc48b1440eacfa7db08b67854e57c170342dd64f457e2163bdc20b1e29e7c1",
  "dist/annual-growth-horizon.js": "c0aeb4e71c1292b42b9331c538d5d6a3dd0c3ba1a3b2a7a6adf7365457391aee",
  "dist/data/atlas-company-catalog-v1.json": "c02ba4d67084a92f07ade302ca89ecd6b6ec791f1b7f45649f613a1a20310864",
  "dist/incremental-messages.js": "46bc0b463c13288d8bc25b36388808fb3749a49fef6100587cf1ed45cdcfe7ac",
  "dist/incremental-registry.js": "f5ed2f1b312d0c5caef190ab83477ffaa1419de6d18147ee7adeff6065b32d78",
  "dist/incremental-research-claims.js": "135bc8c567f0f78c94a1b5edcc056b08ae13e9e7eafd4e06dd7ff2debcb558f5",
  "dist/incremental-research-view.js": "ae4ba76f4f753563127235c6b8500172444dbf035a01c7ab28034e1b1229ecb9",
  "dist/incremental-research.js": "bcd1bc3a6f4c771d5cc31c876210a167ebe74ce8b1c3bdf80cbb860a9190c2c6",
  "dist/locales/company-catalog.js": "b1ae67e28ccb0ca0a0e5e05b548295be8ecc86733d4442563f371ac3a171cf6e",
  "dist/research-model.js": "47c4654ae012e9e4540d373e7d54f234d9f833972be761585a23edfd5596e596",
  "dist/research-simulation-view.js": "fd23fb1fc042b5492c0f7eff7c3a8c18e77edb75f05f886e4854a4e663ac5089",
  "dist/research-simulation.js": "2fe993a1a60afd69f6602855db986657f67f74773f0c6d847e8d7cc465cc310f",
  "dist/research-view.js": "c1a9080e22ce4928e6123032127299dadc3c123a6f907774ba6993bc6e8fcb15",
  "dist/simulation-error-i18n.js": "bfe16f27c6155017df12fc5c43f3945807114a8bacd2dafdfcb79fd38db7d190",
  "dist/data/incremental-NFLX-2026-10-19-v3/CHANGES-v3.md": "0a295264697ccd169fef73c749283b441460569a7969afd8f81092797d67040f",
  "dist/data/incremental-NFLX-2026-10-19-v3/INDEPENDENT-REVIEW.md": "2410ce24a7496290c4e123203414eee42a2da09b48ce119fca304cba40260f54",
  "dist/data/incremental-NFLX-2026-10-19-v3/NFLX-v3.html": "ca697eead45866e9daf616728735c2f73c6a966f36a74fe5ae8f94ea37757d44",
  "dist/data/incremental-NFLX-2026-10-19-v3/README.md": "166025fb705d4c150ebd6c8ccef2c1f55580e95b5d0fb0cb72b2a0ace19054aa",
  "dist/data/incremental-NFLX-2026-10-19-v3/STUDY-v3.md": "cd008f1492d8559043b3565ff9a57b5ded8e7dbd057f94b47005218549c39ee4",
  "dist/data/incremental-NFLX-2026-10-19-v3/build_history.py": "a1d0e4bef000d64c765736ae3147e626bd5a6b5ae7281fbd05461b32d7a1d4c4",
  "dist/data/incremental-NFLX-2026-10-19-v3/build_mix.py": "2bb7e90a5fcaa03637d61bd51fe23d56b3d2286d190ce71b469605a11e07f8d1",
  "dist/data/incremental-NFLX-2026-10-19-v3/capital-claims-v3.json": "ec483ffecd994acc8f56d5069ce71b8953ed42a4f42f7df0fac74b6d42588422",
  "dist/data/incremental-NFLX-2026-10-19-v3/capital-rollforward-template-v3.json": "edc938b09422acbee6291b23471b088d69dcf3601566495ab4795fe4bb6c2249",
  "dist/data/incremental-NFLX-2026-10-19-v3/cases.json": "248be4e2e97248cab3073d115a57a79491d2f744945c781863b5f91be738079a",
  "dist/data/incremental-NFLX-2026-10-19-v3/dcf-inputs-v3.json": "1e1f878b178d743381afc0e4a459d35eea2aa7603f054825d62f3be128b27bee",
  "dist/data/incremental-NFLX-2026-10-19-v3/dcf-output-v3.json": "fbba6a8cd4dfe5052aad730906ad83ee0a61b31a637178922da485e303dace2c",
  "dist/data/incremental-NFLX-2026-10-19-v3/equity-policy-template-v3.json": "a1e978dc5b0548a51ffb679bc60af2ed6145af61589cac5cb9a955c088ac74ac",
  "dist/data/incremental-NFLX-2026-10-19-v3/fetch_sources.py": "521fad30a1c7bac68b3c5c0e418cf31cbc477f29ac0068337e12cf6cb0a379b4",
  "dist/data/incremental-NFLX-2026-10-19-v3/forecast-v3.csv": "bcbd7b6356c7d59192d9b4a76e2c2dc8c414148cacc7d2de795bca93fe95a27d",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-field-provenance-v3.json": "c033f2e4cacca599fc6c257f0b3bbf62c897cd877c8fabe3736c31f115e75aa6",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-primary-table-checks-v3.json": "37451584355cfbce3362fab69e2e62aab21dfb1e6f2b5dfeda466f5a7f7dc0f1",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-v3.csv": "5f739b30df2d78257394803c820d63a947ae9341c602d068b3b1e10b58731074",
  "dist/data/incremental-NFLX-2026-10-19-v3/history-v3.json": "35ac22acfe35c66300242af4b133a7f1583f913191bdc715a13e3b0099428440",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-allocation-output-v3.json": "ff645a7609631f30fa63c98b34b346345aa43643f594c3561a7db2a2701c2ed8",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-equity-policy-v3.json": "1594a2f0a7b32e9a69f0fcbcb49b7ca1aaad05020979ed9027a82de583c13a37",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-financing-rollforward-output-v3.json": "12a485da2690d1e2bd3bbf61faa12efb3c0101663ea007c80f374be506664a1d",
  "dist/data/incremental-NFLX-2026-10-19-v3/illustrative-financing-rollforward-policy-v3.json": "8a4a26a51053e0e84a040b907b791a7a625e5a6e568b6f3be12eed6b818ce54a",
  "dist/data/incremental-NFLX-2026-10-19-v3/latest-half-v3.json": "94d7da8038149a83db6e77b337fb7efddc331928470a6917dba2d433a71be4a8",
  "dist/data/incremental-NFLX-2026-10-19-v3/make_inputs.py": "c6a8b88f2390960a64ec20ecf5bf3149ef7c048e9b448d23471b785b444262f7",
  "dist/data/incremental-NFLX-2026-10-19-v3/management-guidance-v3.json": "1eaa731254548fc4ff67e13c8eac5e2a44d5dc7b3fe41cb96afe5794a4d6ac41",
  "dist/data/incremental-NFLX-2026-10-19-v3/manifest-v3.json": "1e43441284f9f58520904ef273dd7fc672a877b5f8228b6f1c9fe95ee258bbf0",
  "dist/data/incremental-NFLX-2026-10-19-v3/model-validation-v3.json": "c20545fc12224d7bd652787eece18fdd0f7af71230f5e5d5c922a8828add3454",
  "dist/data/incremental-NFLX-2026-10-19-v3/operating-mix-history-v3.json": "58877db1f44c409c175b0dacf772de400d79d1bd83fd57218464415389f65e4c",
  "dist/data/incremental-NFLX-2026-10-19-v3/package_v3.py": "1b74ced006ee4c87754823a5b8d3fc9101facd62ff645dd030f5c89f6ded958c",
  "dist/data/incremental-NFLX-2026-10-19-v3/packaging-manifest.json": "0d1d8747cf0e0e96e62dcd47e138c7ad1a2e8e339df6ffafce52dc5f0cc72d7d",
  "dist/data/incremental-NFLX-2026-10-19-v3/readiness-v3.json": "7466c7e64e45748708b25dbd6687d401290f09c94f8ba56e8d8b7336eb3b8cba",
  "dist/data/incremental-NFLX-2026-10-19-v3/replay_dcf.py": "b079b61ca62561bda04ae7d8fa196752b1a9fe24371b9240a34f1d0f508afaa0",
  "dist/data/incremental-NFLX-2026-10-19-v3/sensitivity-v3.json": "214d07ac2a2da59c9017b2fbd834890d2094f056f7f24a7841fb5bb812779427",
  "dist/data/incremental-NFLX-2026-10-19-v3/source-provenance-v3.json": "2ae8ee92c9b47d419c3fae89fb59478c8ef131d53c2a3a3bb3c732bb07410e3a",
  "dist/data/incremental-NFLX-2026-10-19-v3/source-repair-checks-v3.json": "b935ee4c44cf5a54da0e098092376e4d7f43e29e32c867427df82d23fcfce44c",
  "dist/data/incremental-NFLX-2026-10-19-v3/stress-output-v3.json": "d7a4b50003d50ce4b8c998b4bea81ff1dd16665cd404c2100f43743311f18a82",
  "dist/data/incremental-NFLX-2026-10-19-v3/validate_model.py": "f43384ee9d7c71b17c2a77ba908c376929af3b2fdd3d225994ed5adcdfe3568b",
  "dist/data/incremental-NFLX-2026-10-19-v3/verify_bundle.py": "b3ccab5ed35987fb8ce18a37bc0a6847c677edb6ad02f588d7e1db532d1cecfa",
  "dist/data/incremental-NFLX-2026-10-19-v3/verify_source_repairs.py": "1a6db82d0ca23514b3c87ed238dedc4908f55ef1098d1aa35f7cb8ec39faf1c1",
  "dist/nflx-financial-engine.js": "ebb36da60416bc87d2a5568e4e29f8278ef0de81295131ef8ed1cd93924146fc",
  "dist/nflx-messages.js": "8be04c4e9751544381e34af222847640816130f7ee96e3a07664e83fd786f97d",
  "dist/nflx-research-model.js": "7a06c5017df4acf4541874dd02f0303495f4cb12d8d4c430f79af9e0e9323114",
  "dist/nflx-research-registry.js": "d10a951202ca9841bd4b2f6543da159e54448b4441847375c7e72ca891d15342",
  "dist/nflx-research-view.js": "b217107f921473890c244f24725809ce16f34af7be8a6996ff2929352b664637"
});
export const nflxSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export const nflxBlobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k),object=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const exact=(x,keys)=>object(x)&&Reflect.ownKeys(x).length===keys.length&&keys.every(k=>own(x,k));
const hash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const productionPath=x=>typeof x==='string'&&x.startsWith('dist/')&&!/[\\\0\r\n]/.test(x)&&x.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:64*1024*1024});
let cachedEntries;
function entries(){if(!cachedEntries){
 assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1');assert.equal(git('rev-parse',NFLX_BASE_COMMIT+'^{commit}').toString().trim(),NFLX_BASE_COMMIT);
 cachedEntries=new Map(git('ls-tree','-r','-z','--full-tree',NFLX_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' '),path=row.slice(tab+1);assert.ok(productionPath(path));assert.equal(type,'blob');assert.ok(['100644','100755'].includes(mode));assert.match(oid,/^[0-9a-f]{40}$/);return [path,Object.freeze({mode,oid})];}));assert.equal(cachedEntries.size,934);
}return cachedEntries;}
export const nflxBaseEntries=()=>new Map(entries());
export function validateNflxFixture(f){
 assert.ok(exact(f,['baseCommit','files','additions']));assert.equal(f.baseCommit,NFLX_BASE_COMMIT);
 assert.ok(exact(f.files,NFLX_MODIFIED_PATHS));assert.ok(exact(f.additions,NFLX_ADDED_PATHS));const baseline=entries();
 for(const [p,item]of Object.entries(f.files)){assert.ok(productionPath(p)&&baseline.has(p));assert.ok(exact(item,['beforeText','beforeSHA256','afterSHA256']));assert.equal(typeof item.beforeText,'string');assert.ok(hash(item.beforeSHA256)&&hash(item.afterSHA256));const b=Buffer.from(item.beforeText);assert.equal(b.toString(),item.beforeText);assert.equal(nflxSHA(b),item.beforeSHA256);assert.equal(nflxBlobSHA(b),baseline.get(p).oid);assert.equal(item.afterSHA256,NFLX_REVIEWED_HASHES[p]);assert.notEqual(item.beforeSHA256,item.afterSHA256);}
 for(const [p,h]of Object.entries(f.additions)){assert.ok(productionPath(p)&&!baseline.has(p)&&hash(h));assert.equal(h,NFLX_REVIEWED_HASHES[p]);}return f;
}
let cached;
export function nflxFixture(){if(!cached){const f=validateNflxFixture(JSON.parse(fs.readFileSync(new URL('../'+NFLX_FIXTURE_PATH,import.meta.url))));Object.values(f.files).forEach(Object.freeze);Object.freeze(f.files);Object.freeze(f.additions);cached=Object.freeze(f);}return cached;}
export function reverseNflxIntegration(path,bytes,earlierContext=''){
 assert.ok(productionPath(path),String(path)+' must be an exact normalized dist path');assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');const f=nflxFixture();
 const message=path+' exact reviewed NFLX integration bytes; exact reviewed UBER integration bytes; exact reviewed MCD integration bytes; exact reviewed Claude simulation UI bytes'+earlierContext;
 if(own(f.files,path)){assert.equal(nflxSHA(bytes),f.files[path].afterSHA256,message);return Buffer.from(f.files[path].beforeText);}
 if(own(f.additions,path))assert.equal(nflxSHA(bytes),f.additions[path],message+'; exact reviewed NFLX addition bytes');return bytes;
}
