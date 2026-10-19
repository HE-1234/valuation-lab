import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
// Exact UBER-only reversal, ahead of the separate UI layer. No earlier fixture is rewritten.
export const UBER_BASE_COMMIT="e9b647c9bf5f5f7b57cae21e1cda10aa5428d3d1";
export const UBER_FIXTURE_PATH='tests/fixtures/uber-integration-mcd-v85.json';
export const UBER_MODIFIED_PATHS=Object.freeze([
  "dist/annual-growth-horizon.js",
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
export const UBER_ADDED_PATHS=Object.freeze([
  "dist/data/incremental-UBER-2026-10-19-v2/CHANGELOG-v2.md",
  "dist/data/incremental-UBER-2026-10-19-v2/OCTOBER-BRIDGE-v2.md",
  "dist/data/incremental-UBER-2026-10-19-v2/README.md",
  "dist/data/incremental-UBER-2026-10-19-v2/REVIEW-v2.md",
  "dist/data/incremental-UBER-2026-10-19-v2/STUDY-v2.md",
  "dist/data/incremental-UBER-2026-10-19-v2/UBER-v2.html",
  "dist/data/incremental-UBER-2026-10-19-v2/capital-claims-scope-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/cases.json",
  "dist/data/incremental-UBER-2026-10-19-v2/dcf-inputs-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/dcf-output-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/equity-policy-illustration-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/equity-policy-template-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/forecast-v2.csv",
  "dist/data/incremental-UBER-2026-10-19-v2/guidance-pending-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/history-comparability-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/history-field-provenance-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/history-v2.csv",
  "dist/data/incremental-UBER-2026-10-19-v2/history-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/illustration-output-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/investment-detail-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/latest-financials-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/manifest-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/operating-mix-history-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/packaging-manifest.json",
  "dist/data/incremental-UBER-2026-10-19-v2/post-june-capital-events-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/post-june-rollforward-template-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/profit-quality-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/public-tradability-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/readiness-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/replay_dcf_v2.py",
  "dist/data/incremental-UBER-2026-10-19-v2/rollforward-output-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/rollforward_v2.py",
  "dist/data/incremental-UBER-2026-10-19-v2/sensitivity-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/source-evidence-hashes-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/source-provenance-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/verification-v2.json",
  "dist/data/incremental-UBER-2026-10-19-v2/verify_bundle_v2.py",
  "dist/data/incremental-UBER-2026-10-19-v2/verify_v2.py",
  "dist/data/incremental-UBER-2026-10-19-v2/version-lineage-v2.json",
  "dist/uber-financial-engine.js",
  "dist/uber-messages.js",
  "dist/uber-research-model.js",
  "dist/uber-research-registry.js",
  "dist/uber-research-view.js"
]);
export const UBER_REVIEWED_HASHES=Object.freeze({
  "dist/annual-growth-horizon.js": "c89141961b551444cbbd85cc75f193833bbec0e00bfce0be4e70b8bbcedc657e",
  "dist/data/atlas-company-catalog-v1.json": "56df9d70f70f75eb19a18fa5e1589ee211b34992bdc7c111cfc0fed13f82a1dd",
  "dist/incremental-messages.js": "2635cd7a3a082cf6e86527c90d1ee8c7d7dfa68677c09b3952aa162efef89a2b",
  "dist/incremental-registry.js": "6f1523e4e38b7efe9694aad07a7bde2ee125f7ba177fb1c4386e46ee33e85c93",
  "dist/incremental-research-claims.js": "b1f34f3013474c4220644bfeefb29ad8a69c7fde4eb0a1eb2f17b9a0359dd818",
  "dist/incremental-research-view.js": "aa3fb21c78548814a75a2f43b947b4c0f3a8254e52adab94636778db8836a3f8",
  "dist/incremental-research.js": "3c55e09747b96fb4f1ee9a1eec055ca994813f7ac55575674f07e22a665a681a",
  "dist/research-model.js": "f3320ffa41859d29b422502f366130886ee5f6f01ccc02d88fddeae39aba6564",
  "dist/research-simulation-view.js": "3260bff9cad2a4cc31cb5dd3e7042254481d10bd80d9b3931b039b6c24d07cf3",
  "dist/research-simulation.js": "fdae1a1c6db5ad6f77324a18f47c406ad014c448a440c4f04f77dc43bcefd7e0",
  "dist/research-view.js": "b05b424de9dbfdf5a521df3dd68ca65509208e44b4a7105d72c66f9cea32125b",
  "dist/data/incremental-UBER-2026-10-19-v2/CHANGELOG-v2.md": "6a6253b67ee0a4c8d020d004ae794cb8a8a14b905c4e793d9b35a7329b78c3a8",
  "dist/data/incremental-UBER-2026-10-19-v2/OCTOBER-BRIDGE-v2.md": "e4f0861893da1e7e6e34a54875f6d1453817219ec45673c40e5f8501c59b8283",
  "dist/data/incremental-UBER-2026-10-19-v2/README.md": "da83d087eb0141f0a25428b0a2e37610f49957bd72b43197736ee6e20edaee43",
  "dist/data/incremental-UBER-2026-10-19-v2/REVIEW-v2.md": "64c74d26dba489493a305267620976c95c19c6b7d07e7edb23b1410b6152b519",
  "dist/data/incremental-UBER-2026-10-19-v2/STUDY-v2.md": "1ce248f8c3c5aad540d50403b6db04dd2b7ac0ea9ff41457db45e5bc8405b9eb",
  "dist/data/incremental-UBER-2026-10-19-v2/UBER-v2.html": "28d60c2f0be72f59c0cc50f252e332cfd526f792f75e49f761e369e7d6a382ca",
  "dist/data/incremental-UBER-2026-10-19-v2/capital-claims-scope-v2.json": "373e7219cedfe497209595e855f02bc7ab44b88d31290c7cb47fda15319231bc",
  "dist/data/incremental-UBER-2026-10-19-v2/cases.json": "79d46579f0f36b1e80a5c6c3b091a603889c368ccba89786b171fd131a115a16",
  "dist/data/incremental-UBER-2026-10-19-v2/dcf-inputs-v2.json": "9af3003573a34a509ddb63345ba8f811ea42a0f9c99ee02cf3dd52f7d9f2001d",
  "dist/data/incremental-UBER-2026-10-19-v2/dcf-output-v2.json": "42c69e8e696546dc791b8d2c3c90ee1ed7b5acab46a9c6160059b3aa36709b8e",
  "dist/data/incremental-UBER-2026-10-19-v2/equity-policy-illustration-v2.json": "c05ba12b12b48d0d2d6443892306a3580411a730a8e5bda37790950be3b60635",
  "dist/data/incremental-UBER-2026-10-19-v2/equity-policy-template-v2.json": "cff29da3d9d087c750995c771a9504f6b5e8e37184e54a2758332adabcb7f057",
  "dist/data/incremental-UBER-2026-10-19-v2/forecast-v2.csv": "acf414c3c589463468038f48cfd4e67b263b733cd7b7187a235a369db9309611",
  "dist/data/incremental-UBER-2026-10-19-v2/guidance-pending-v2.json": "ad025a8c040051f63b0ee978183d9d6cae9c8f67dd5a4a6eaf0944bf334d1b54",
  "dist/data/incremental-UBER-2026-10-19-v2/history-comparability-v2.json": "74ef5f1cec0c3ea83dbb40193ab3b9144700bb45fa35c2f1306e0630c7dd220e",
  "dist/data/incremental-UBER-2026-10-19-v2/history-field-provenance-v2.json": "8730d998c2aada62708f8762aa4d44e61f5a3038ad10640c65f3e72aa50c7e9c",
  "dist/data/incremental-UBER-2026-10-19-v2/history-v2.csv": "e02b018cacf740910893faf8052c1b8b690395a11f03b99f2681fa9eeb4a471a",
  "dist/data/incremental-UBER-2026-10-19-v2/history-v2.json": "9d15c0f2a15cb87df3c5208ab69349230730165aa67bbea54f9d6537cea32009",
  "dist/data/incremental-UBER-2026-10-19-v2/illustration-output-v2.json": "17f45b682b196bb5cad10e9cc77329be9644ebe33a2744292635e6f1d0cca045",
  "dist/data/incremental-UBER-2026-10-19-v2/investment-detail-v2.json": "8d51169808bb6f4efaa480d3ebcbc9c497716ab84026d189d6b585419f0329c2",
  "dist/data/incremental-UBER-2026-10-19-v2/latest-financials-v2.json": "07cdb206b3f0cd2d392dc36223e6fad55d0de3963aaefaefd07b08c74fdac425",
  "dist/data/incremental-UBER-2026-10-19-v2/manifest-v2.json": "9360a252bb7941ba8b9386971b97e368918d27dc0af270fbd2bf1bceafcc048a",
  "dist/data/incremental-UBER-2026-10-19-v2/operating-mix-history-v2.json": "1081c72e500f6f6adc1bf078687d697154758020c47c9b4d147681ce5bd534fb",
  "dist/data/incremental-UBER-2026-10-19-v2/packaging-manifest.json": "57a48002d2fbdd331f1bda943b4cfd51f663af38f8bce1160c1ec70050fbbf44",
  "dist/data/incremental-UBER-2026-10-19-v2/post-june-capital-events-v2.json": "16bc92d552e064cc8d2350e4e90150dfe2f6bc43e01dc12394ac13e4da297162",
  "dist/data/incremental-UBER-2026-10-19-v2/post-june-rollforward-template-v2.json": "2d943d1a148abe6c0998370d1639b99a336d9afd03e15c05f0967626405032d7",
  "dist/data/incremental-UBER-2026-10-19-v2/profit-quality-v2.json": "c362cb27493bf099f92ef4fd474ced23614b3bb7a426073ec02b38537374a26e",
  "dist/data/incremental-UBER-2026-10-19-v2/public-tradability-v2.json": "621a201dcd793c23f5deb6a595992de6128403e9704cc73609140ebb2a79d324",
  "dist/data/incremental-UBER-2026-10-19-v2/readiness-v2.json": "25ee278ffce725bcf23cdd06ad268b8b6f8d6b9682f6fb5d3b4e5bc3c616c643",
  "dist/data/incremental-UBER-2026-10-19-v2/replay_dcf_v2.py": "2f3e2437546e60077c7962eefbb6c2d052e77c5a5b69a2d447e48b37cef21b6b",
  "dist/data/incremental-UBER-2026-10-19-v2/rollforward-output-v2.json": "9772dc8d02fd5fd690f904c82002dcb3080d44c10c5487445f665f8576f98941",
  "dist/data/incremental-UBER-2026-10-19-v2/rollforward_v2.py": "99f1f0c2bc0228d5a5a0050781a6f3ccfc5fff238d514f7f68c791569c744e5d",
  "dist/data/incremental-UBER-2026-10-19-v2/sensitivity-v2.json": "e9e7518b451cb3d0b68fbd7a2b6d37b5f5d109f124b043ed8cdb2208f1afd3c2",
  "dist/data/incremental-UBER-2026-10-19-v2/source-evidence-hashes-v2.json": "7d19616d685a9cf5d57d8973775dae9dd0e13b21f887ae2de825608f7f4901dc",
  "dist/data/incremental-UBER-2026-10-19-v2/source-provenance-v2.json": "90b8960e27db52beb4c8ccde4ab3eb783d0436112c4596b6fdb6a3c19592cf6b",
  "dist/data/incremental-UBER-2026-10-19-v2/verification-v2.json": "aadd7b7352b7f2983ec1232827c4a4cc286209c83b2db1a943c23bbb6c221fee",
  "dist/data/incremental-UBER-2026-10-19-v2/verify_bundle_v2.py": "e099d5a16ae1fdde57e056ef3dfe8e41be5b4372e21c624330abf3c35a5553aa",
  "dist/data/incremental-UBER-2026-10-19-v2/verify_v2.py": "c2b2b454231238881326e972393b7886ad7f70284b8208d664d7fadf1af50a9a",
  "dist/data/incremental-UBER-2026-10-19-v2/version-lineage-v2.json": "0e4da7f1ae8477ea62cdd272a1b39e7e66e5c6b2315902b6b88ba86958910558",
  "dist/uber-financial-engine.js": "f0c51031c47c124aad9350b43f900903db8bb412df9ebe15f7fea42d6e90ff2e",
  "dist/uber-messages.js": "0e927fcc01a5860bc48383602a5881c4faa66f1a1cc02b4e3ed05cb4fc5bcd91",
  "dist/uber-research-model.js": "5703996dc8b67acda858df53e4cce9efe978467c4a82eed44084f7bfda58166c",
  "dist/uber-research-registry.js": "bed67aad36c9af5337e07f29ed716bf7a3ada20e1736cf0e6a1556d54ad75369",
  "dist/uber-research-view.js": "d8fe2961d4dfc07234d01df4d31b998d4938ac8633b8dd33b4c246f4c6daa5d8"
});
export const uberSHA=bytes=>createHash('sha256').update(bytes).digest('hex');
export const uberBlobSHA=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k),object=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const exact=(x,keys)=>object(x)&&Reflect.ownKeys(x).length===keys.length&&keys.every(k=>own(x,k));
const hash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const productionPath=x=>typeof x==='string'&&x.startsWith('dist/')&&!/[\\\0\r\n]/.test(x)&&x.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');
const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:64*1024*1024});
let cachedEntries;
function entries(){if(!cachedEntries){
 assert.equal(git('rev-parse','--show-object-format').toString().trim(),'sha1');assert.equal(git('rev-parse',UBER_BASE_COMMIT+'^{commit}').toString().trim(),UBER_BASE_COMMIT);
 cachedEntries=new Map(git('ls-tree','-r','-z','--full-tree',UBER_BASE_COMMIT,'--','dist').toString().split('\0').filter(Boolean).map(row=>{const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' '),path=row.slice(tab+1);assert.ok(productionPath(path));assert.equal(type,'blob');assert.ok(['100644','100755'].includes(mode));assert.match(oid,/^[0-9a-f]{40}$/);return [path,Object.freeze({mode,oid})];}));assert.equal(cachedEntries.size,890);
}return cachedEntries;}
export const uberBaseEntries=()=>new Map(entries());
export function validateUberFixture(f){
 assert.ok(exact(f,['baseCommit','files','additions']));assert.equal(f.baseCommit,UBER_BASE_COMMIT);
 assert.ok(exact(f.files,UBER_MODIFIED_PATHS));assert.ok(exact(f.additions,UBER_ADDED_PATHS));const baseline=entries();
 for(const [p,item]of Object.entries(f.files)){assert.ok(productionPath(p)&&baseline.has(p));assert.ok(exact(item,['beforeText','beforeSHA256','afterSHA256']));assert.equal(typeof item.beforeText,'string');assert.ok(hash(item.beforeSHA256)&&hash(item.afterSHA256));const b=Buffer.from(item.beforeText);assert.equal(b.toString(),item.beforeText);assert.equal(uberSHA(b),item.beforeSHA256);assert.equal(uberBlobSHA(b),baseline.get(p).oid);assert.equal(item.afterSHA256,UBER_REVIEWED_HASHES[p]);assert.notEqual(item.beforeSHA256,item.afterSHA256);}
 for(const [p,h]of Object.entries(f.additions)){assert.ok(productionPath(p)&&!baseline.has(p)&&hash(h));assert.equal(h,UBER_REVIEWED_HASHES[p]);}return f;
}
let cached;
export function uberFixture(){if(!cached){const f=validateUberFixture(JSON.parse(fs.readFileSync(new URL('../'+UBER_FIXTURE_PATH,import.meta.url))));Object.values(f.files).forEach(Object.freeze);Object.freeze(f.files);Object.freeze(f.additions);cached=Object.freeze(f);}return cached;}
export function reverseUberIntegration(path,bytes,earlierContext=''){
 assert.ok(productionPath(path),String(path)+' must be an exact normalized dist path');assert.ok(Buffer.isBuffer(bytes),path+' requires exact production bytes');const f=uberFixture();
 const message=path+' exact reviewed UBER integration bytes; exact reviewed MCD integration bytes; exact reviewed Claude simulation UI bytes'+earlierContext;
 if(own(f.files,path)){assert.equal(uberSHA(bytes),f.files[path].afterSHA256,message);return Buffer.from(f.files[path].beforeText);}
 if(own(f.additions,path))assert.equal(uberSHA(bytes),f.additions[path],message+'; exact reviewed UBER addition bytes');return bytes;
}
