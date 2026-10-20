import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {
 NATIVE_GUIDE_BASE_COMMIT,NATIVE_GUIDE_FILES,NATIVE_GUIDE_PATHS,NATIVE_PRECISION_RULES,NATIVE_EDIT_REVEAL_RULE,
 nativeGuideSHA,nativeGuideBlobSHA,nativeGuideBaseEntries,reverseNativeGuideFix,reverseNativeEditReveal,
} from './native-guide-layout-preservation.mjs';
import {LATEST_UI_FILES,LATEST_UI_BASE_COMMIT,latestUiUpstreamBytes,reverseLatestUserUi} from './latest-user-ui-preservation.mjs';
import {reverseNflxIntegration} from './nflx-integration-preservation.mjs';

const root=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL(p,root));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const path='dist/skins/report.css',guidePath='dist/skins/report-mc-guide.js';
const altered=b=>{const out=Buffer.from(b);out[Math.floor(out.length/2)]^=1;return out;};
function files(relative){
 assert.ok(!fs.lstatSync(new URL(relative,root)).isSymbolicLink());
 return fs.readdirSync(new URL(relative,root),{withFileTypes:true}).flatMap(e=>{
  const p=relative+'/'+e.name;assert.ok(!e.isSymbolicLink(),p+' cannot be a symlink');
  if(e.isDirectory())return files(p);assert.ok(e.isFile());return [p];
 }).sort();
}
function verifyTree(current,readBytes=read){
 const baseline=nativeGuideBaseEntries();assert.deepEqual(current,[...baseline.keys()].sort(),'Exact 979-path native-QA production tree');
 for(const [p,{oid}]of baseline)assert.equal(nativeGuideBlobSHA(reverseNativeGuideFix(p,readBytes(p))),oid,p+' exact immutable 508 source blob');
}

test('native layout and focus layer pins exactly two reviewed paths above the immutable 508 integration',()=>{
 assert.equal(NATIVE_GUIDE_BASE_COMMIT,'508a85ad2101ce08fd441d93b7a532d50c8f0e7f');
 assert.equal(git('rev-parse',NATIVE_GUIDE_BASE_COMMIT+'^{commit}').toString().trim(),NATIVE_GUIDE_BASE_COMMIT);
 assert.deepEqual(NATIVE_GUIDE_PATHS,[path,guidePath]);assert.deepEqual(Object.keys(NATIVE_GUIDE_FILES),[path,guidePath]);
 const item=NATIVE_GUIDE_FILES[path],before=git('show',NATIVE_GUIDE_BASE_COMMIT+':'+path),current=read(path);
 assert.deepEqual(Object.keys(item),['mode','beforeBlob','beforeSHA256','afterBlob','afterSHA256','repairs']);
 for(const value of [NATIVE_GUIDE_FILES,NATIVE_GUIDE_PATHS,item,item.repairs,...item.repairs])assert.ok(Object.isFrozen(value));
 assert.equal(item.mode,'100644');assert.equal(item.repairs.length,2);
 assert.equal(item.beforeBlob,'10b93c1c83ef5c6b85e03df11fe6cd35ec033754');assert.equal(item.afterBlob,'877f3a1d1d03a6e1f3191ce819a3777f8ef7a935');
 assert.equal(item.beforeSHA256,'7f4cd97607d59871a3e4b7be59db0f63519634264721102e27efd563cc8511a1');
 assert.equal(item.afterSHA256,'75afbc3a6fb39eca6f2ed0481908e8a1512e0c149072216d7c319416867d8f1d');
 assert.equal(item.beforeSHA256,LATEST_UI_FILES[path].afterSHA256,'The prior reviewed hash stays frozen');
 assert.equal(nativeGuideSHA(before),item.beforeSHA256);assert.equal(nativeGuideSHA(current),item.afterSHA256);
 assert.equal(nativeGuideBlobSHA(before),item.beforeBlob);assert.equal(nativeGuideBlobSHA(current),item.afterBlob);
 assert.deepEqual(reverseNativeGuideFix(path,current),before);
 let rebuilt=before.toString();
 for(const repair of item.repairs){assert.equal(before.toString().split(repair.before).length-1,1);assert.equal(current.toString().split(repair.after).length-1,1);rebuilt=rebuilt.replace(repair.before,repair.after);}
 assert.deepEqual(Buffer.from(rebuilt),current,'Exactly two separate reviewed insertions reconstruct the current CSS');
});

test('native precision correction adds exactly six mobile-only geometry lines with no palette, font or desktop changes',()=>{
 const current=reverseNativeEditReveal(read(path)).toString(),before=git('show',NATIVE_GUIDE_BASE_COMMIT+':'+path).toString();
 assert.equal(NATIVE_PRECISION_RULES.split('\n').filter(Boolean).length,6);
 assert.equal(current.split(NATIVE_PRECISION_RULES).length-1,1);assert.equal(before.includes(NATIVE_PRECISION_RULES),false);
 assert.equal(current.replace(NATIVE_PRECISION_RULES,''),before,'Removing only the six scoped lines restores every original CSS byte');
 const anchor='  @media (max-width: 760px) {\n    & body .rx-mcg [data-part] > details.rx-mcg-fold { padding: 0 12px !important; border-radius: 12px; }';
 const start=current.indexOf(anchor),rules=current.indexOf(NATIVE_PRECISION_RULES),end=current.indexOf('\n  }',start);
 assert.ok(start>=0&&start<rules&&rules+NATIVE_PRECISION_RULES.length<=end,'Entire correction is inside the existing phone-only media block');
 const selector='& body .rx-mcg.is-sampling [data-part="value"] > .rx-mcg-fold > summary';
 const blocks=[...NATIVE_PRECISION_RULES.matchAll(/([^{}\n]+)\{([^{}]+)\}/g)].map(m=>({selector:m[1].trim(),declarations:m[2].trim()}));
 assert.deepEqual(blocks,[
  {selector,declarations:'display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; row-gap: 8px;'},
  {selector:selector+' > .rx-mcg-ic',declarations:'grid-column: 1; grid-row: 1;'},
  {selector:selector+' > h4',declarations:'grid-column: 2; grid-row: 1; overflow-wrap: anywhere;'},
  {selector:selector+' > .rx-mcg-chip',declarations:'grid-column: 2; grid-row: 2; justify-self: start; max-width: 100%; box-sizing: border-box;'},
  {selector:selector+'::after',declarations:'grid-column: 3; grid-row: 1 / span 2;'},
 ]);
 assert.doesNotMatch(NATIVE_PRECISION_RULES,/(?:color|background|border-color|fill|stroke|font|filter|opacity|box-shadow|--[a-z])\s*:/i,'No palette, font, effects or design tokens may change');
});

test('native precision correction retains all 979 paths and modes, all 62 fixtures, and every engine, model, data and other UI byte',()=>{
 const current=files('dist'),baseline=nativeGuideBaseEntries();assert.equal(current.length,979);assert.equal(baseline.size,979);verifyTree(current);
 const changed=[];
 for(const [p,{mode,oid}]of baseline){
  assert.equal(fs.statSync(new URL(p,root)).mode&0o111,mode==='100755'?0o111:0,p+' reviewed mode');
  if(nativeGuideBlobSHA(read(p))!==oid)changed.push(p);
  if(!NATIVE_GUIDE_PATHS.includes(p))assert.equal(nativeGuideBlobSHA(read(p)),oid,p+' exact unchanged engine/model/data/palette/UI source');
 }
 assert.deepEqual(changed,[path,guidePath].sort());
 const fixture=git('ls-tree','-r','-z','--full-tree',NATIVE_GUIDE_BASE_COMMIT,'--','tests/fixtures').toString().split('\0').filter(Boolean).map(row=>{const tab=row.indexOf('\t'),[mode,type,oid]=row.slice(0,tab).split(' ');assert.equal(type,'blob');return {path:row.slice(tab+1),mode,oid};});
 assert.equal(fixture.length,62);assert.deepEqual(files('tests/fixtures'),fixture.map(x=>x.path).sort());
 for(const {path:p,mode,oid}of fixture){assert.equal(nativeGuideBlobSHA(read(p)),oid,p+' frozen fixture bytes');assert.equal(fs.statSync(new URL(p,root)).mode&0o111,mode==='100755'?0o111:0,p+' frozen fixture mode');}
});

test('native correction rejects every mutation, missing or duplicate repair, substituted baseline and double reversal',()=>{
 const good=read(path),before=git('show',NATIVE_GUIDE_BASE_COMMIT+':'+path),item=NATIVE_GUIDE_FILES[path];
 const bad=[altered(good),Buffer.concat([good,Buffer.from('\n')]),good.subarray(0,good.length-1),Buffer.alloc(0),before,
  Buffer.from(good.toString().replace(NATIVE_PRECISION_RULES,'')),Buffer.from(good.toString().replace(NATIVE_PRECISION_RULES,NATIVE_PRECISION_RULES+NATIVE_PRECISION_RULES)),
  Buffer.from(good.toString().replace('grid-template-columns: 28px minmax(0, 1fr) auto','grid-template-columns: 29px minmax(0, 1fr) auto')),
 ];
 for(const repair of item.repairs)bad.push(Buffer.from(good.toString().replace(repair.after,repair.before)));
 for(const bytes of bad){
  assert.throws(()=>reverseNativeGuideFix(path,bytes),/exact reviewed native guide correction bytes/);
  assert.throws(()=>reverseLatestUserUi(path,bytes),/exact reviewed latest user UI bytes/);
  assert.throws(()=>reverseNflxIntegration(path,bytes),/exact reviewed chart\/trial geometry bytes/);
 }
 assert.throws(()=>reverseNativeGuideFix(path,reverseNativeGuideFix(path,good)),/exact reviewed native guide correction bytes/);
 assert.throws(()=>reverseNativeGuideFix(path,altered(good),'; unchanged older gate'),/unchanged older gate/);
 assert.throws(()=>reverseLatestUserUi(path,altered(good)),/dist\/skins\/report\.css exact reviewed Claude simulation UI bytes/);
});

test('native correction rejects malformed paths and inputs and leaves all unrelated paths untouched',()=>{
 const good=read(path);
 for(const p of ['report.css','/dist/skins/report.css','../dist/skins/report.css','dist//skins/report.css','dist/./skins/report.css','dist/../report.css','dist/','dist\\report.css','dist/x\0x','dist/x\nx','dist/x\rx','tests/ignored.js','dist','',null,42])assert.throws(()=>reverseNativeGuideFix(p,good),/exact normalized dist path/);
 for(const p of [path,guidePath,'dist/engine.js'])for(const bytes of [good.toString(),new Uint8Array(good),null,{},42])assert.throws(()=>reverseNativeGuideFix(p,bytes),/exact production bytes/);
 const p='dist/engine.js',bytes=read(p);assert.strictEqual(reverseNativeGuideFix(p,bytes),bytes);
 const snapshot=nativeGuideBaseEntries();snapshot.clear();assert.equal(nativeGuideBaseEntries().size,979);
 const original=reverseNativeGuideFix(path,good);original.fill(0);assert.deepEqual(reverseNativeGuideFix(path,good),git('show',NATIVE_GUIDE_BASE_COMMIT+':'+path));
});

test('native whole-tree proof rejects unknown paths, missing paths and mutations outside the repair',()=>{
 const current=files('dist');
 for(const p of [path,'dist/engine.js','dist/skins/report-mc-guide.js'])assert.throws(()=>verifyTree(current.filter(x=>x!==p)),/Exact 979-path native-QA production tree/);
 assert.throws(()=>verifyTree([...current,'dist/unreviewed.css'].sort()),/Exact 979-path native-QA production tree/);
 const p='dist/engine.js';assert.throws(()=>verifyTree(current,x=>x===p?altered(read(p)):read(x)),/exact immutable 508 source blob/);
 assert.throws(()=>verifyTree(current,x=>x===path?altered(read(path)):read(x)),/exact reviewed native guide correction bytes/);
});

test('native correction reverses once before the unchanged V86/upstream UI gate and restores exact upstream bytes',()=>{
 const source=read('tests/latest-user-ui-preservation.mjs').toString(),call='bytes=reverseNativeGuideFix(path,bytes,earlierContext);';
 assert.equal(source.split(call).length-1,1);assert.ok(source.indexOf(call)>source.indexOf('export function reverseLatestUserUi'));assert.ok(source.indexOf(call)<source.indexOf('if(own(LATEST_UI_COMPATIBILITY_FILES,path))'));
 assert.equal(source.replace("import {reverseNativeGuideFix} from './native-guide-layout-preservation.mjs';\n",'').replace(' '+call+'\n',''),git('show',NATIVE_GUIDE_BASE_COMMIT+':tests/latest-user-ui-preservation.mjs').toString(),'Every prior V86/upstream/reviewed hash and compatibility repair is unchanged');
 const before=reverseNativeGuideFix(path,read(path));assert.equal(nativeGuideSHA(before),LATEST_UI_FILES[path].afterSHA256);
 const upstream=latestUiUpstreamBytes(path,before);assert.equal(nativeGuideSHA(upstream),LATEST_UI_FILES[path].sourceSHA256);assert.equal(nativeGuideBlobSHA(upstream),LATEST_UI_FILES[path].sourceBlob);
 assert.deepEqual(reverseLatestUserUi(path,read(path)),git('show',LATEST_UI_BASE_COMMIT+':'+path));
});

test('native stable-byte adapters preserve every old preservation assertion, digest, fixture and mutation rejection',()=>{
 const published=git('ls-tree','-r','-z','--full-tree',NATIVE_GUIDE_BASE_COMMIT,'--','tests').toString().split('\0').filter(Boolean).map(row=>row.slice(row.indexOf('\t')+1)).filter(p=>/preservation(?:\.test)?\.mjs$/.test(p)||['tests/simulation-range-header.test.mjs','tests/simulation-help-navigation.test.mjs'].includes(p));
 const header="import {reverseNativeGuideFix} from './native-guide-layout-preservation.mjs';\n";
 for(const p of published){
  let current=read(p).toString();
  if(p==='tests/latest-user-ui-preservation.mjs')current=current.replace(header,'').replace(' bytes=reverseNativeGuideFix(path,bytes,earlierContext);\n','');
  if(p==='tests/latest-user-ui-preservation.test.mjs')current=current.replace(header,'')
   .replace("const current=read(p),stable=reverseNativeGuideFix(p,current),before=git('show',LATEST_UI_BASE_COMMIT+':'+p),upstream=latestUiUpstreamBytes(p,stable);","const current=read(p),before=git('show',LATEST_UI_BASE_COMMIT+':'+p),upstream=latestUiUpstreamBytes(p,current);")
   .replace('assert.equal(latestUiSHA(stable),item.afterSHA256)','assert.equal(latestUiSHA(current),item.afterSHA256)')
   .replace("const good=read(p),stable=reverseNativeGuideFix(p,good),before=git('show',LATEST_UI_BASE_COMMIT+':'+p);","const good=read(p),before=git('show',LATEST_UI_BASE_COMMIT+':'+p);")
   .replaceAll('Buffer.from(stable.toString().replace(repair.after,','Buffer.from(good.toString().replace(repair.after,')
   .replace("  const current=reverseNativeGuideFix(p,read(p));\n  let expected=latestUiUpstreamBytes(p,current).toString('utf8');","  let expected=latestUiUpstreamBytes(p,read(p)).toString('utf8');")
   .replace("assert.deepEqual(Buffer.from(expected),current,p+' exact unmodified upstream bytes')","assert.deepEqual(Buffer.from(expected),read(p),p+' exact unmodified upstream bytes')")
   .replace("assert.deepEqual(Buffer.from(expected),current,p+' exact upstream plus reviewed compatibility only')","assert.deepEqual(Buffer.from(expected),read(p),p+' exact upstream plus reviewed compatibility only')");
  assert.equal(current,git('show',NATIVE_GUIDE_BASE_COMMIT+':'+p).toString(),p+' exact prior preservation source after only explicit stable-byte adapters');
 }
 assert.ok(published.length>50);
});


test('native guide focus fixes are exact reviewed hidden-panel and synchronous scoped-reveal focus repairs above unchanged 508 guide bytes',()=>{
 const item=NATIVE_GUIDE_FILES[guidePath],before=git('show',NATIVE_GUIDE_BASE_COMMIT+':'+guidePath),current=read(guidePath);
 assert.deepEqual(Object.keys(item),['mode','beforeBlob','beforeSHA256','afterBlob','afterSHA256','repairs']);
 for(const value of [item,item.repairs,...item.repairs])assert.ok(Object.isFrozen(value));
 assert.equal(item.mode,'100644');assert.equal(item.repairs.length,3);
 assert.equal(item.beforeBlob,'453c96871b38f452659d93bb80f8bdff99b7fc82');assert.equal(item.afterBlob,'3ff6eeb39809d0c14f7b7dd27da6b1bbfc560595');
 assert.equal(item.beforeSHA256,'6e393cb445af4261872f2a96e1a1e0b5e8f12b4ee9992b07e5cbf173cc3f08cd');
 assert.equal(item.afterSHA256,'3da2efa3dce66f0a2c0c97ba3725472149f0155a10e84b915a970824281e12ad');
 assert.equal(item.beforeSHA256,LATEST_UI_FILES[guidePath].afterSHA256,'Prior reviewed guide digest remains unchanged');
 assert.equal(nativeGuideSHA(before),item.beforeSHA256);assert.equal(nativeGuideSHA(current),item.afterSHA256);
 assert.equal(nativeGuideBlobSHA(before),item.beforeBlob);assert.equal(nativeGuideBlobSHA(current),item.afterBlob);
 let rebuilt=before.toString();
 for(const repair of [...item.repairs].reverse()){
  assert.notEqual(repair.before,repair.after);assert.equal(before.toString().split(repair.before).length-1,1);assert.equal(current.toString().split(repair.after).length-1,1);
  rebuilt=rebuilt.replace(repair.before,repair.after);
 }
 assert.deepEqual(Buffer.from(rebuilt),current,'Only exact reviewed guide repairs are present');
 assert.deepEqual(reverseNativeGuideFix(guidePath,current),before);
 const source=current.toString();
 assert.ok(source.includes("return !!el && !el.closest('[hidden]');"));assert.ok(source.includes('const edit = fieldAvailable(f) ?'));
 assert.ok(source.includes('editField(root, t.dataset.edit);'));assert.ok(source.includes("if (!el || el.closest('[hidden]')) return;"));
 const editSource=source.slice(source.indexOf('function editField('),source.indexOf('let repaintQueued = false;'));
 for(const fragment of ['const opened = disclosures.filter(d => !d.open);',"for (const d of opened) d.classList.add('rx-mcg-edit-reveal');",'try {','for (const d of disclosures) d.open = true;','for (const d of opened) void d.offsetHeight;','target.focus({preventScroll: true});','} finally {',"for (const d of opened) d.classList.remove('rx-mcg-edit-reveal');"])assert.equal(editSource.split(fragment).length-1,1,fragment+' remains exact and unique');
 const order=["classList.add('rx-mcg-edit-reveal')",'try {','d.open = true','void d.offsetHeight','target.scrollIntoView','target.focus','} finally {',"classList.remove('rx-mcg-edit-reveal')"].map(fragment=>editSource.indexOf(fragment));
 assert.deepEqual(order,[...order].sort((a,b)=>a-b),'Temporary reveal precedes opening/layout/focus and cleanup always follows');
 assert.doesNotMatch(editSource,/requestAnimationFrame|Promise|getAnimations|setTimeout|setInterval|origin|mountId/,'Focus is synchronous with no deferred callback that can steal later focus');
 for(const fragment of ["target.getAttribute('aria-hidden') === 'true'",'target.tabIndex < 0',"'input, select, textarea, button'",'target.scrollIntoView({block: \'center\', behavior: calm() ? \'auto\' : \'smooth\'});'])assert.ok(editSource.includes(fragment),'Prior selector and focus behavior remains required: '+fragment);
 const stable=reverseNativeGuideFix(guidePath,current),upstream=latestUiUpstreamBytes(guidePath,stable);
 assert.equal(nativeGuideSHA(upstream),LATEST_UI_FILES[guidePath].sourceSHA256);assert.equal(nativeGuideBlobSHA(upstream),LATEST_UI_FILES[guidePath].sourceBlob);
 assert.deepEqual(reverseLatestUserUi(guidePath,current),git('show',LATEST_UI_BASE_COMMIT+':'+guidePath));
});

test('native guide exact gates reject each repaired fragment mutation, wrong path and repeated reversal without weakening older diagnostics',()=>{
 const good=read(guidePath),item=NATIVE_GUIDE_FILES[guidePath],before=git('show',NATIVE_GUIDE_BASE_COMMIT+':'+guidePath);
 const bad=[altered(good),Buffer.concat([good,Buffer.from('\n')]),good.subarray(0,good.length-1),Buffer.alloc(0),before];
 for(const repair of item.repairs)bad.push(Buffer.from(good.toString().replace(repair.after,repair.before)),Buffer.from(good.toString().replace(repair.after,repair.after+repair.after)));
 for(const [from,to]of [
  ['const opened = disclosures.filter(d => !d.open);','const opened = disclosures;'],
  ["d.classList.add('rx-mcg-edit-reveal');",'void d;'],
  ['for (const d of opened) void d.offsetHeight;',''],
  ["d.classList.remove('rx-mcg-edit-reveal');",'void d;'],
  ["if (!el || el.closest('[hidden]')) return;",'if (!el) return;'],
 ]){
  assert.equal(good.toString().split(from).length-1,1,'Unique temporary reveal/cleanup mutation target');
  bad.push(Buffer.from(good.toString().replace(from,to)));
 }
 for(const bytes of bad){
  assert.throws(()=>reverseNativeGuideFix(guidePath,bytes),/exact reviewed native guide correction bytes/);
  assert.throws(()=>reverseLatestUserUi(guidePath,bytes),/exact reviewed latest user UI bytes/);
  assert.throws(()=>reverseNflxIntegration(guidePath,bytes),/exact reviewed Claude simulation UI bytes/);
 }
 assert.throws(()=>reverseNativeGuideFix(guidePath,reverseNativeGuideFix(guidePath,good)),/exact reviewed native guide correction bytes/);
 assert.throws(()=>reverseNativeGuideFix(path,good),/exact reviewed native guide correction bytes/);assert.throws(()=>reverseNativeGuideFix(guidePath,read(path)),/exact reviewed native guide correction bytes/);
 assert.throws(()=>reverseLatestUserUi(guidePath,altered(good)),/dist\/skins\/report-mc-guide\.js exact reviewed Claude simulation UI bytes/);
 const current=files('dist');assert.throws(()=>verifyTree(current,p=>p===guidePath?altered(read(p)):read(p)),/exact reviewed native guide correction bytes/);
});

test('Edit reveal is one exact temporary rule, independently reversible ahead of the unchanged mobile geometry assertions',()=>{
 const good=read(path),stable=reverseNativeEditReveal(good);
 assert.equal(NATIVE_EDIT_REVEAL_RULE,'  & body .mc-setup details.rx-mcg-edit-reveal[open]::details-content { transition: none !important; height: auto !important; content-visibility: visible !important; }\n');
 assert.equal(good.toString().split(NATIVE_EDIT_REVEAL_RULE).length-1,1);
 assert.equal(nativeGuideSHA(stable),'c8df52df271030a4a38ed81627e169e4cc6095f21ca23f4b2bc47527f2186dbe');
 assert.equal(nativeGuideBlobSHA(stable),'f5c9e84ab8a2f6991c800ca3c884a65902e09c44');
 assert.deepEqual(Buffer.from(stable.toString().replace('  /* Year markers on the path chart. */\n',NATIVE_EDIT_REVEAL_RULE+'  /* Year markers on the path chart. */\n')),good);
 assert.doesNotMatch(NATIVE_EDIT_REVEAL_RULE,/(?:color|background|border-color|fill|stroke|font|filter|opacity|box-shadow|--[a-z])\s*:/i);
 for(const bytes of [altered(good),stable,Buffer.from(good.toString().replace(NATIVE_EDIT_REVEAL_RULE,NATIVE_EDIT_REVEAL_RULE+NATIVE_EDIT_REVEAL_RULE)),Buffer.from(good.toString().replace('details.rx-mcg-edit-reveal[open]::details-content','details[open]::details-content'))]){
  assert.throws(()=>reverseNativeEditReveal(bytes),/Exact reviewed native Edit reveal CSS bytes/);
  assert.throws(()=>reverseNativeGuideFix(path,bytes),/exact reviewed native guide correction bytes/);
 }
 for(const bytes of [good.toString(),new Uint8Array(good),null])assert.throws(()=>reverseNativeEditReveal(bytes),/requires exact CSS bytes/);
 const mobile=read('tests/latest-ui-mobile-precision.test.mjs').toString()
  .replace("import {reverseNativeEditReveal} from './native-guide-layout-preservation.mjs';\n",'')
  .replace("css=reverseNativeEditReveal(fs.readFileSync(new URL('dist/skins/report.css',root))).toString('utf8');","css=fs.readFileSync(new URL('dist/skins/report.css',root),'utf8');");
 assert.equal(nativeGuideSHA(Buffer.from(mobile)),'196e20a0a8deaa8fbe510b53be9cdf1ccf27a5b671b26d64752adf79122e2492','Only the explicit exact reveal-rule adapter changes the original mobile test; every old assertion remains unchanged');
});
