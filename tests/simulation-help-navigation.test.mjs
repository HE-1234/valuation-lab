import {reverseJointIntegration} from './joint-integration-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {preservedV87Fs as fs} from './guided-company-preservation.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reverseSimulationHelpNavigation} from './simulation-help-navigation-preservation.mjs';
import {fixture} from './v7-simulation-harness.mjs';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {setLocale,localizeMarkedNodes,t} from '../dist/i18n.js';
import en from '../dist/locales/simulation.en.js';
import hans from '../dist/locales/simulation.zh-Hans.js';
import hant from '../dist/locales/simulation.zh-Hant.js';
const cwd=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const approved=JSON.parse(read('tests/fixtures/simulation-help-navigation-v59.json'));
const page='dist/data/simulation-methodology.html',html=read(page).toString();
const previous=p=>execFileSync('git',['show',approved.baseline+':'+p],{cwd,maxBuffer:20e6});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const note='Opened this help from a simulation? Switch back to the original Valuation Lab tab to continue where you left off.';
const label='Open the valuation workspace';
const key=s=>'text.'+sha(s).slice(0,20);

// Synthetic DOM checks deliberately do not certify browser tab switching,
// browser back/forward cache, native focus, painted layout or screen readers.
function enhance(h){
 const proto=Object.getPrototypeOf(h.root),query=proto.querySelectorAll;
 proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part)))];};
 proto.hasAttribute=function(name){return Object.hasOwn(this.attrs,name);};
 proto.removeAttribute=function(name){delete this.attrs[name];};
 proto.matches=function(selector){return selector.split(',').some(part=>/^\[([^\]]+)\]$/.test(part)&&this.hasAttribute(part.slice(1,-1)));};
 localizeMarkedNodes(h.root);
}

test('help navigation: explicit new-tab wording retains the exact destination and isolation',()=>{
 const source=read('dist/simulation-view.js').toString();
 assert.match(source,/<a href="\.\/data\/simulation-methodology.html" target="_blank" rel="noopener" data-i18n="simulation.t44">How the sampler works \(opens in a new tab\) ↗<\/a>/);
 assert.equal(en.t44,'How the sampler works (opens in a new tab) ↗');
 assert.equal(hans.t44,'抽样方法说明（在新标签页打开）↗');
 assert.equal(hant.t44,'抽樣方法說明（在新分頁開啟）↗');
 assert.deepEqual(reverseSimulationHelpNavigation('dist/simulation-view.js',Buffer.from(source)),previous('dist/simulation-view.js'),'all non-copy handler bytes');
});

test('help navigation: original-tab instruction precedes an honestly named fallback workspace link',()=>{
 assert.ok(html.indexOf(note)<html.indexOf('href="../index.html"'));
 assert.match(html,new RegExp('<p><a href="\\.\\./index.html"><span data-research-i18n="true" data-i18n="research-pages\\.'+key(label)+'">'+label+'</span></a></p>'));
 assert.doesNotMatch(html,/← Return to the valuation workspace|window\.close|window\.opener|history\.back|document\.referrer|onclick=/);
 assert.equal((html.match(/href="\.\.\/index.html"/g)||[]).length,1);
});

test('help navigation: English and both Chinese catalogs carry exact keyed instructions and complete coverage',()=>{
 const catalogs=Object.fromEntries(['en','zh-Hans','zh-Hant'].map(locale=>[locale,JSON.parse(read('dist/locales/research-pages.'+locale+'.json'))]));
 const source=JSON.parse(read('scripts/research-translations/simulation-methodology.en.json'));
 for(const english of [note,label]){
  for(const locale of Object.keys(catalogs))assert.equal(typeof catalogs[locale][key(english)],'string');
  assert.equal(catalogs.en[key(english)],english);assert.equal(source[key(english)],english);
  assert.match(catalogs['zh-Hans'][key(english)],/\p{Script=Han}/u);assert.match(catalogs['zh-Hant'][key(english)],/\p{Script=Han}/u);
 }
 const row=JSON.parse(read('dist/locales/research-pages-coverage.json')).pages.find(row=>row.page==='data/simulation-methodology.html');
 assert.equal(row.complete,true);assert.deepEqual(row.missingKeys,[]);assert.equal(row.coveredSegments,Object.keys(source).length);
 assert.equal(row.coveredSegments,133);
});

test('help navigation: current and historical methodology, stylesheet and scripts are byte-identical to V59',()=>{
 const old=previous(page).toString(),reviewed=reverseJointIntegration(page,Buffer.from(html)).toString();
 assert.equal(reviewed.slice(reviewed.indexOf('<p class="notice">')),old.slice(old.indexOf('<p class="notice">')));
 assert.equal(html.match(/<style>[\s\S]*?<\/style>/)[0],old.match(/<style>[\s\S]*?<\/style>/)[0]);
 assert.deepEqual(html.match(/<(?:script|link)\b[^>]*>/g),old.match(/<(?:script|link)\b[^>]*>/g));
 assert.deepEqual(html.match(/<a\b[^>]*>/g),old.match(/<a\b[^>]*>/g),'all destinations remain unchanged');
});

for(const initial of ['en','zh-Hans'])test(`help navigation: repeated language changes preserve help link, selected settings and exact exports (${initial})`,async()=>{
 setLocale(initial);const h=fixture({ticker:'HELP-NAV-'+initial,reduced:true,autoplay:false});
 try{
  enhance(h);h.get('#mc-tab-sampling').click();
  const link=h.root.querySelector('[data-i18n="simulation.t44"]'),seed=h.get('#mc-seed'),draft=structuredClone(h.draft);
  const attrs=['href','target','rel'].map(name=>[name,link.getAttribute(name)]);
  assert.deepEqual(attrs,[['href','./data/simulation-methodology.html'],['target','_blank'],['rel','noopener']]);
  h.get('#mc-export').click();const before=await h.exports.at(-1).text();
  for(const locale of ['zh-Hans','en','zh-Hans','en']){
   setLocale(locale);assert.equal(link.textContent,t('simulation.t44'));assert.equal(h.root.querySelector('[data-i18n="simulation.t44"]'),link);
   assert.deepEqual(['href','target','rel'].map(name=>[name,link.getAttribute(name)]),attrs);
   assert.equal(h.get('#mc-seed'),seed);assert.equal(h.get('#mc-panel-sampling').hidden,false);
   assert.deepEqual(h.draft,draft);assert.equal(link.onclick,undefined);
  }
  h.get('#mc-export').click();assert.equal(await h.exports.at(-1).text(),before);
 }finally{h.cleanup();setLocale('en');}
});

test('help navigation: existing tab retains its simulation while a separate workspace mount uses default view',async()=>{
 const h=await startResearchWorkspace({simulationMount:()=>()=>{}});let incoming;
 try{
  h.select('MSFT');h.input('#research-notes','Help navigation retained note');h.change('#annual-edit-year',3);h.get('[data-annual-view="simulation"]').click();
  const originalDraft=h.getState().draft,originalInputs=h.root.querySelectorAll('[data-research-input]');
  incoming=await startResearchWorkspace({storage:h.storage,simulationMount:()=>()=>{}});
  assert.equal(incoming.get('.screen-workspace').dataset.view,'result');assert.equal(incoming.get('#annual-edit-year').value,'0');
  assert.equal(incoming.getState().draft.notes,'Help navigation retained note');
  assert.equal(h.get('.screen-workspace').dataset.view,'simulation');assert.equal(h.get('#annual-edit-year').value,'3');
  assert.deepEqual(h.getState().draft,originalDraft);assert.deepEqual(h.root.querySelectorAll('[data-research-input]'),originalInputs);
 }finally{incoming?.destroy();h.destroy();}
});

test('help navigation preservation: all 354 V59 shipped assets survive ten exact copy-only reversals',()=>{
 const paths=execFileSync('git',['ls-tree','-r','--name-only',approved.baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');
 assert.equal(paths.length,354);assert.equal(Object.keys(approved.files).length,10);
 for(const path of paths)assert.deepEqual(reverseSimulationHelpNavigation(path,read(path)),previous(path),path);
});
for(const path of Object.keys(approved.files))test('help navigation preservation rejects unreviewed changes: '+path,()=>{
 assert.throws(()=>reverseSimulationHelpNavigation(path,Buffer.concat([read(path),Buffer.from(' ')])),path==='dist/simulation-view.js'?/dist\/simulation-view\.js exact reviewed Claude simulation UI bytes/:/reviewed documentation bytes/);
 assert.equal(sha(previous(path)),approved.files[path].beforeSHA256);
});
