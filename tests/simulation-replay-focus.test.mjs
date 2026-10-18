import {reverseMethodologyDocumentation} from './simulation-methodology-preservation.mjs';
// Shipped-handler synthetic DOM/WAAPI checks; not native-browser or AT certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fixture} from './v7-simulation-harness.mjs';
import {simulationDefaults} from '../dist/simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {researchDraftFor} from '../dist/research-model.js';
import {simulationResearchDefaults} from '../dist/research-simulation.js';
import {setLocale,t} from '../dist/i18n.js';

const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
let unique=0;
const heights=h=>h.bars().map(b=>Number(b.getAttribute('height')));
function mount(kind,locale,{reduced=false}={}){
 setLocale(locale);
 if(kind==='Guided')return trackFocus(fixture({ticker:'REPLAY-FOCUS-'+(++unique),autoplay:false,reduced,simulationConfig:{...simulationDefaults(),trials:137,seed:'replay-focus-review'}}));
 const draft=researchDraftFor(companies.find(c=>c.ticker==='AAPL'));
 draft.researchSimulationConfig={...simulationResearchDefaults(draft),method:kind==='Annual-path'?'annual-path':'legacy',trials:20,seed:'replay-focus-review'};
 return trackFocus(fixture({autoplay:false,reduced,draftOverride:draft,snapshotOverride:{ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId+'-replay-focus-'+(++unique)}},adapter:annualResearchSimulationAdapter(draft)}));
}
function trackFocus(h){const proto=Object.getPrototypeOf(h.root),focus=proto.focus;proto.focus=function(options){this.focusCalls=(this.focusCalls||0)+1;this.focusOptions=options;return focus.call(this);};return h;}
function complete(h){for(const a of h.animations)if(a.state==='running'){a.state='finished';a.onfinish?.();}}
for(const kind of ['Guided','Annual-scalar','Annual-path'])for(const locale of ['en','zh-Hans']){
 test(`replay focus: focused Show full chart returns to Replay without scrolling or changing outputs (${kind}, ${locale})`,async()=>{
  const h=mount(kind,locale);
  try{
   const full=heights(h),chart=h.get('#mc-chart'),play=h.get('#mc-play'),seed=h.get('#mc-seed'),draft=structuredClone(h.draft);
   const domain=[chart.getAttribute('aria-valuemin'),chart.getAttribute('aria-valuemax')];
   h.get('#mc-export').click();const before=await h.exports.at(-1).text();
   for(let cycle=0;cycle<3;cycle++){
    play.focus();play.click();assert.equal(h.get('#mc-skip').hidden,false);
    if(cycle%2===0){play.click();assert.equal(play.textContent,t('simulation.t72'));}
    const skip=h.get('#mc-skip');skip.focus();assert.equal(h.doc.activeElement,skip);skip.click();
    assert.equal(skip.hidden,true);
    assert.equal(h.doc.activeElement,play);assert.deepEqual(play.focusOptions,{preventScroll:true});
    assert.equal(play.hidden,false);assert.equal(play.disabled,false);assert.equal(play.textContent,t('simulation.t10'));assert.equal(play.getAttribute('aria-pressed'),'false');
    assert.deepEqual(heights(h),full);assert.equal(h.get('#mc-chart'),chart);assert.deepEqual([chart.getAttribute('aria-valuemin'),chart.getAttribute('aria-valuemax')],domain);
    assert.equal(h.get('#mc-particles').children.length,0);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');
    assert.equal(h.get('#mc-seed'),seed);assert.deepEqual(h.draft,draft);
    h.get('#mc-export').click();assert.equal(await h.exports.at(-1).text(),before,'Exact exported results must stay identical.');
   }
  }finally{h.cleanup();setLocale('en');}
 });
 test(`control: programmatic Show full chart preserves outside focus (${kind}, ${locale})`,()=>{
  const h=mount(kind,locale);
  try{const full=heights(h);h.get('#mc-play').click();const seed=h.get('#mc-seed');seed.focus();h.get('#mc-skip').click();assert.equal(h.doc.activeElement,seed);assert.deepEqual(heights(h),full);assert.equal(h.get('#mc-play').focusCalls,undefined);}
  finally{h.cleanup();setLocale('en');}
 });
 test(`replay focus: natural completed replay recovers current skip focus (${kind}, ${locale})`,()=>{
  const h=mount(kind,locale);
  try{const full=heights(h);h.get('#mc-play').click();const skip=h.get('#mc-skip');skip.focus();complete(h);assert.equal(skip.hidden,true);assert.equal(h.doc.activeElement,h.get('#mc-play'));assert.deepEqual(h.get('#mc-play').focusOptions,{preventScroll:true});assert.deepEqual(heights(h),full);}
  finally{h.cleanup();setLocale('en');}
 });
 test(`control: natural completion leaves outside focus alone (${kind}, ${locale})`,()=>{
  const h=mount(kind,locale);
  try{h.get('#mc-play').click();const seed=h.get('#mc-seed');seed.focus();complete(h);assert.equal(h.doc.activeElement,seed);assert.equal(h.get('#mc-skip').hidden,true);}
  finally{h.cleanup();setLocale('en');}
 });
 test(`control: reduced motion has no replay-only reset action (${kind}, ${locale})`,()=>{
  const h=mount(kind,locale,{reduced:true});
  try{assert.equal(h.get('#mc-skip').hidden,true);assert.equal(h.get('#mc-play').disabled,true);assert.equal(h.animations.length,0);assert.ok(heights(h).some(n=>n>0));}
  finally{h.cleanup();setLocale('en');}
 });
}

for(const locale of ['en','zh-Hans'])for(const interruption of ['edit','destroy','reduced motion','viewport exit','page hidden','route departure'])test(`replay focus: ${interruption} and late callbacks never recover hidden skip (${locale})`,()=>{
 const h=mount('Annual-path',locale);
 try{
  h.get('#mc-play').click();const skip=h.get('#mc-skip'),play=h.get('#mc-play'),callbacks=h.animations.map(a=>a.onfinish).filter(Boolean);skip.focus();
  if(interruption==='edit'){const seed=h.get('#mc-seed');seed.value='later-seed';seed.oninput();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'stale');assert.equal(h.get('#mc-output').inert,true);assert.equal(h.get('#mc-export').disabled,true);}
  else if(interruption==='destroy')h.destroy();
  else if(interruption==='reduced motion'){h.motion.matches=true;h.motion.dispatch('change');assert.equal(play.disabled,true);}
  else if(interruption==='viewport exit'){for(const o of h.observers)o.fn([{isIntersecting:false,intersectionRatio:0}]);}
  else if(interruption==='page hidden'){h.doc.hidden=true;h.doc.dispatch('visibilitychange');}
  else h.windowEvents.dispatch('valuation:tab-change',{detail:'learn'});
  assert.equal(skip.hidden,true);assert.equal(play.focusCalls,undefined);const prior=h.doc.activeElement,full=heights(h);
  skip.click();for(const callback of callbacks)callback();
  assert.equal(h.doc.activeElement,prior);assert.equal(play.focusCalls,undefined);assert.deepEqual(heights(h),full);
 }finally{h.cleanup();setLocale('en');}
});
for(const target of ['#mc-chart','#mc-scrubber','#mc-play'])test(`replay focus: completion and unfocused skip preserve ${target}`,()=>{
 const h=mount('Annual-path','en');try{
  for(const action of ['natural','explicit']){h.get('#mc-play').click();const node=h.get(target);node.focus();const before=node.focusCalls;
   if(action==='natural')complete(h);else h.get('#mc-skip').click();
   assert.equal(h.doc.activeElement,node);assert.equal(node.focusCalls,before);
  }
 }finally{h.cleanup();}
});
test('replay focus: repeated playback rejects the preceding completion callbacks',()=>{
 const h=mount('Annual-path','en');try{
  h.get('#mc-play').click();const prior=h.animations.map(a=>a.onfinish).filter(Boolean);h.get('#mc-skip').focus();h.get('#mc-skip').click();
  const play=h.get('#mc-play'),calls=play.focusCalls;play.click();const skip=h.get('#mc-skip');skip.focus();for(const callback of prior)callback();
  assert.equal(skip.hidden,false);assert.equal(h.doc.activeElement,skip);assert.equal(play.focusCalls,calls);complete(h);assert.equal(h.doc.activeElement,play);assert.equal(play.focusCalls,calls+1);
 }finally{h.cleanup();}
});
test('replay focus preservation: every V56 shipped byte is unchanged after four exact completed-replay focus fragments',()=>{
 const cwd=new URL('..',import.meta.url),baseline='4339d839e3e22614424c31d10b13b8c605c5e92e',hooks=JSON.parse(fs.readFileSync(new URL('./fixtures/reference-defaults-reviewed-hooks.json',import.meta.url))).files;
 const paths=execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');let count=0;
 for(const path of paths){let bytes=reverseMethodologyDocumentation(path,fs.readFileSync(new URL('../'+path,import.meta.url)));const replacements=(hooks[path]||[]).filter(h=>['simulation-replay-focus','learn-question-visibility'].includes(h.change));if(replacements.length){let source=bytes.toString();for(const h of replacements){assert.equal(source.split(h.reviewedAdditiveLine).length-1,1,path);source=source.replace(h.reviewedAdditiveLine,h.originalLine);if(h.change==='simulation-replay-focus')count++;}bytes=Buffer.from(source);}assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+path],{cwd,maxBuffer:20e6}),path);}
 assert.equal(count,4);assert.equal(paths.length,354);
});
