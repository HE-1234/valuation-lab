// Independent public-package checks. Frozen numeric fingerprints were calculated
// directly from the approved research input, without importing the packager.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(root, 'dist/data/renewed-research-2026-10-17');
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const json = name => JSON.parse(read(name));
const manifest = json('manifest.json'), evidence = json('evidence.json'), cases = json('cases.json');
const tickers = ['AAPL','MSFT','AMZN','GOOG','META','NVDA','TSLA','COHR','LITE','AAOI','NBIS','MU','AVGO','TSM'];
const sha = value => createHash('sha256').update(value).digest('hex');
const presentationManifest=JSON.parse(fs.readFileSync(path.join(root,'dist/locales/research-presentation-manifest.json'),'utf8'));
function originalResearchHTML(text) {
  return text.replace(/<span data-research-i18n="true" data-i18n="research-pages\.text\.[a-f0-9]{20}">([\s\S]*?)<\/span>/g,'$1')
    .replace('<link data-research-locale="true" rel="stylesheet" href="../../i18n.css">\n<script data-research-locale="true" type="module" src="../../research-page-i18n.js"></script>','');
}
const frozenSHA = '02c8e133893cff642369ba58d29b7e5ad091c204e08a6b37acbff28f13072bd2';
const fingerprints = {
  AAPL: 'e902784870f2f06fb96c0e508ae71050d2c2216b6191ba1c4dd184d1c0c77e2b',
  MSFT: 'ffa1f71ba6c05fa86edec6942cf7f5116fd9b4b961268af8ff45728586c109da',
  AMZN: 'ce7f769565657042f470760cf0cb1b801230cdd14b1435e031762a21f0a90fc8',
  GOOG: '8b6e0b1981a2204418ac1db27dbf5144810903d3474ff470d9b143c2b3fbeb09',
  META: '7ad3da133ee3a70d3e2a694a88a2901fc4eea947ec06956d969c55f831ae3dfb',
  NVDA: 'e48f302b3f91722b0d1cb9435335665e37dfa1cb8da9fe04c0aa1b901f20f92f',
  TSLA: 'b3c89ad92bc641f5df72ebc58453c27098190a32acbf1b125c478c307e0f8c23',
  COHR: '894a08b957e1b414d95080c823c422e577425ca84c6614e0123ad5edfd0080d5',
  LITE: '00586e08ed6712c21f0144ebcf9e643988abce400a95c8388a0f108f2e0b69fb',
  AAOI: 'cd500ad7ec98100cbda1f889bfb13e8e585508521f1d1205957ebb31a54be954',
  NBIS: '48b9ac61f0aa10bfb1e21740cf5b4dac99bdefbb93c00f85eb8fb94f074651f1',
  MU: 'f19e701cc7c691a8b35cc3fbba69e321c4e237968384ac521ccafb71b76b5cab',
  AVGO: 'a9ce937542e1bebf3eefdfcf5b147ab6ec04199b2ec1605aa410ede4a284d351',
  TSM: '1a0ded45854113f15954926171bb2f4fed17b1b87f8a8d9a7c5b7d850fbdbe42',
};
function numericTree(value, at = '$', out = []) {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') out.push([at,value]);
  else if (Array.isArray(value)) {
    out.push([at+'.length',value.length]);
    value.forEach((v,i) => numericTree(v,`${at}[${i}]`,out));
  } else if (typeof value === 'object') {
    Object.keys(value).sort().forEach(k => numericTree(value[k],`${at}.${k}`,out));
  }
  return out;
}
const skipKeys = new Set(['localEvidence','localCache','localPath','localSourcePath','source_cache','cache_path','retrieval_metadata','retrievalMetadata','localReference','existingSnapshotPath','repository','repositoryPath','workspacePath']);
// Compare all non-provenance wording, retaining public URLs as exact tokens.
function withoutLocalReferences(value) {
  const protectedURLs = [];
  let result = value.replace(/https?:\/\/[^\s<>\[\]`"']+/g, u => `\u0000URL${protectedURLs.push(u)-1}\u0000`);
  result = result.replace(/(?:file:\/\/)?\/(?:workspace|home|tmp|Users|mnt|private)\/[^\s`"<>),;]+/g,'<reference>');
  result = result.replace(/(?:evidence-[A-Z]+|dossiers|shared-evidence)\.html(?:\?[^\s<>()`]+)?(?:#[\w-]+)?/g,'<reference>');
  result = result.replace(/(?<![\w:/])(?:\.{1,2}\/)*(?:[\w.-]+\/)*[\w.-]+\.(?:json|md|txt|html?|pdf|py|mjs)(?:#[^\s),;`]+)?/g,'<reference>');
  result = result.replace('local source/cache path where available','source provenance where available');
  protectedURLs.forEach((u,i) => {result=result.replace(`\u0000URL${i}\u0000`,u);});
  return result;
}
function normalizedResearch(value) {
  if (Array.isArray(value)) return value.map(normalizedResearch);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().filter(k=>!skipKeys.has(k)).map(k=>[k,normalizedResearch(value[k])]));
  }
  return typeof value === 'string' ? withoutLocalReferences(value) : value;
}
// Substantive fingerprints calculated from the original research checkout.
// These retain all public URLs and all non-provenance text, numbers, and structure.
const researchFingerprints = {
  AAPL: '75ccdc374bc485e692a2f39ad5686ba74f49b38227f9bf21413dc591edf2a64b',
  MSFT: 'f303b27dba3f831a12d06135ded590f5f29a93f8305bec05a0bff4eea3ba3750',
  AMZN: '9bd8abe91d37042ed7fab0b839fb327ebb1e69120269935176d645ce550d1617',
  GOOG: 'dd03c1acae55817cb3ba0fb527d0b63e627cc012061b423b142e2bed44934225',
  META: '9e6ffe0bf9deb77b81f8f93145f8707a0dff1743302704e2584057e0553efc54',
  NVDA: '5387373a566c73372e7de2208a2261b25be157776a0b226a57b0f9f302d4b202',
  TSLA: '0c790dc4671d93aa6f1f94c7516657df98398a49293426106842d5a12ee2b773',
  COHR: '5efa109c8f308144030cb656d246efb80122f969adf1f2a6a97cf0f8e57cc25e',
  LITE: 'c0cb70935c3883b9fd1ac2b04b7eef42102a48cdaa52516770e63d01a00e3823',
  AAOI: '4fcb305f795a8c4a8be0cfcd6372c56e9a82417e32def285401f75f374365953',
  NBIS: '1994a4485aae9d957c862e9ff3594acd13e5a05343bd68dd05ce0a52c4bf77d0',
  MU: '235894295699dd87704701c1f30537a6e36121cadaee1ea9d25ac5ddf41bb7c1',
  AVGO: '8be1f6dd4530acc5b92afc2fe4b257ae241cca259cd27adedc5b6a2f8c4b4676',
  TSM: '302448066dc5ee6aa36875727ba34618d4ea8e7f94a4c7c7f1a397df15b7da2c',
};

test('research package: all 14 cases retain every frozen number, null, boolean, and array shape',()=>{
  assert.deepEqual(cases.companies.map(c=>c.ticker),tickers);
  assert.equal(manifest.originalExecutableSHA256,frozenSHA);
  assert.equal(manifest.frozenResearchVersion,'cd77a567cfaf77e98567cf772b70c6bb858c0cda');
  for (const c of cases.companies) assert.equal(sha(JSON.stringify(numericTree(c))),fingerprints[c.ticker],c.ticker);

});

test('research package: 320 source records and 70 assessments retain distinct scopes and qualifications',()=>{
  assert.deepEqual(evidence.counts,{companies:14,sourceRecords:320,managementCapabilityRecords:70});
  assert.deepEqual(manifest.counts,evidence.counts);
  assert.equal(evidence.sourceLedger.sources.length,320);
  const rows=evidence.managementCapabilityMatrix.rows;
  assert.equal(rows.length,70);
  const dimensions=['capital allocation','capacity execution','cost control','demand forecasting','product delivery'].sort();
  for (const ticker of tickers) {
    const companyRows=rows.filter(r=>r.ticker===ticker);
    assert.deepEqual(companyRows.map(r=>r.dimension).sort(),dimensions,ticker);
    for (const r of companyRows) {
      assert.ok(r.assessment && r.confidence && r.leadershipAttribution,`${ticker}: attribution and uncertainty`);
      assert.ok(r.evidence?.length && r.counterexamples?.length,`${ticker}: evidence and counterexamples`);
    }
  }
  for (const s of evidence.sourceLedger.sources) {
    assert.ok(s.ticker && s.id, 'source identity');
    assert.ok(/^https?:\/\//.test(s.url ?? s.sourceUrl ?? s.source_url ?? ''),s.id);
    assert.ok(s.sourceType || s.type || s.source_type || (/^https:\/\/www\.sec\.gov\/Archives\//.test(s.url) && /Form 10-[KQ]/.test(s.title)),`${s.id}: classification`);
    assert.ok(s.readStatus || s.read_status || s.readingStatus || s.contentStatus || s.status || s.evidence_status || s.evidenceStatus,`${s.id}: scope`);
  }
});

test('research package: full company facts, outlook, judgments, and dossier narratives remain available',()=>{
  assert.deepEqual(evidence.companies.map(c=>c.ticker),tickers);
  const dossiers=read('dossiers.html');
  for (const c of evidence.companies) {
    for (const key of ['facts','guidanceTrackRecord','managementCapabilities','analystJudgment','sourceLedger']) {
      assert.ok(c[key] && JSON.stringify(c[key]).length>1000,`${c.ticker}: ${key}`);
    }
    assert.ok(c.dossierMarkdown.length>5000,`${c.ticker}: complete narrative`);
    assert.ok(dossiers.includes(`id="${c.ticker}"`));
    const html=read(`evidence-${c.ticker}.html`);
    for (const id of ['facts','guidance','management','judgment','selected-case','claims','sources']) assert.ok(html.includes(`id="${id}"`),`${c.ticker}#${id}`);
    for (const heading of ['Reported facts and source-derived calculations','Management outlook and guidance track record','Analyst judgment and conditional scenarios']) assert.ok(html.includes(heading));
    assert.match(html,/not reported facts, consensus estimates or management commitments/);
    assert.match(html,/Unresolved|null|unknown/i);
  }
  assert.match(dossiers,/primary versus secondary status, dates, actual reading scope and coverage gaps/);
});

test('research package: full retained research matches original-source fingerprints without an external checkout',()=>{
  const fields=['facts','guidanceTrackRecord','managementCapabilities','analystJudgment','sourceLedger','dossierMarkdown'];
  for (const c of evidence.companies) {
    const retained=Object.fromEntries(fields.map(k=>[k,c[k]]));
    assert.equal(sha(JSON.stringify(normalizedResearch(retained))),researchFingerprints[c.ticker],c.ticker);
  }
  assert.equal(sha(JSON.stringify(normalizedResearch(evidence.sourceLedger))),'7dd6ca36f01270b5a7bdf6ddce8a64e9e6c2813812e6cb922ca8a394cb5824fd');
  assert.equal(sha(JSON.stringify(normalizedResearch(evidence.managementCapabilityMatrix))),'52d0e7d312c280e47b996a9584d76f5dc97211d2a837b7dbba4115cdb7917bba');
});

const decodeEntities = s => s.replace(/&(?:amp|quot|apos|lt|gt|#39|#x[\da-f]+|#\d+);/gi, x=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&lt;':'<','&gt;':'>'}[x] ?? String.fromCodePoint(x[2].toLowerCase()==='x'?parseInt(x.slice(3,-1),16):Number(x.slice(2,-1)))));
const htmlIDs = new Map();
function checkLocalLink(href, from) {
  href=decodeEntities(href);
  if (/^https?:\/\//i.test(href)) return;
  assert.ok(!/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith('//'),`unsafe scheme ${href}`);
  const url=new URL(href,`file://${from}`), target=fileURLToPath(url);
  assert.ok(target.startsWith(path.join(root,'dist')+path.sep),`${from}: path escapes dist ${href}`);
  assert.ok(fs.existsSync(target),`${from}: missing local target ${href}`);
  if (url.hash) {
    assert.ok(target.endsWith('.html'),`${href}: fragment on non-HTML`);
    if (!htmlIDs.has(target)) htmlIDs.set(target,new Set([...fs.readFileSync(target,'utf8').matchAll(/\bid="([^"]+)"/g)].map(m=>decodeEntities(m[1]))));
    assert.ok(htmlIDs.get(target).has(decodeURIComponent(url.hash.slice(1))),`${from}: missing anchor ${href}`);
  }
}

test('research package: every local HTML link, manifest target, and selector resolves to a file and anchor',()=>{
  for (const name of fs.readdirSync(dir).filter(n=>n.endsWith('.html'))) {
    const html=read(name), ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,`${name}: duplicate IDs`);
    for (const [,href] of html.matchAll(/\bhref="([^"]*)"/g)) checkLocalLink(href,path.join(dir,name));
  }
  for (const a of manifest.artifacts) checkLocalLink(a.bundleTarget,path.join(dir,'dossiers.html'));
  for (const a of Object.values(manifest.recordSelectors)) checkLocalLink(a.bundleTarget,path.join(dir,'dossiers.html'));
});

test('research package: published assets match their manifest and exclude local/private/secret material',()=>{
  const files=fs.readdirSync(dir);
  assert.equal(files.length,21);
  assert.deepEqual(files.sort(),[...Object.keys(manifest.outputs),'manifest.json'].sort());
  for (const name of files) {
    const raw=fs.readFileSync(path.join(dir,name)), text=raw.toString('utf8');
    assert.doesNotMatch(text,/(?:file:\/\/|\/(?:workspace|home|tmp|Users|private|mnt)\/|\.git\/|__pycache__|dream_notes|agent_notes|user_notes|action_items\.md|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/,name);
    const original=name.endsWith('.html')?originalResearchHTML(text):text;
    assert.doesNotMatch(original,/<script\b|\bon(?:click|load|error)\s*=|javascript:/i,name);
    if(name.endsWith('.html')){
      const presentation=presentationManifest.pages[`data/renewed-research-2026-10-17/${name}`];
      assert.equal(sha(raw),presentation.presentationSHA256,`${name}: localized presentation hash`);
      assert.equal(raw.length,presentation.presentationBytes,`${name}: localized presentation length`);
      assert.equal(sha(original),presentation.originalEnglishSHA256,`${name}: reversible English hash`);
    }
    if (name!=='manifest.json') {
      assert.equal(Buffer.byteLength(original),manifest.outputs[name].bytes,name);
      assert.equal(sha(original),manifest.outputs[name].sha256,name);
    }
  }
});
