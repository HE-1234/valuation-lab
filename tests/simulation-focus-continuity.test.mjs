// Shipped-handler focus checks with the existing synthetic DOM and scheduler.
// Native browser and assistive-technology verification are separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fixture} from './v7-simulation-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {researchDraftFor} from '../dist/research-model.js';
import {simulationResearchDefaults} from '../dist/research-simulation.js';
import {setLocale,t} from '../dist/i18n.js';
const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const ticks=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
let identity=0;
function annual({asynchronous=false,method='legacy',runOnMount=false}={}){
 const draft=researchDraftFor(companies.find(c=>c.ticker==='AAPL'));
 draft.researchSimulationConfig={...simulationResearchDefaults(draft),method,trials:20,seed:'focus-continuity'};
 const adapter=annualResearchSimulationAdapter(draft),original=adapter.simulate.bind(adapter),calls=[],pending=[];
 adapter.simulate=(config,input)=>{calls.push({config:structuredClone(config),input:structuredClone(input)});return original(config,input);};
 adapter.simulateAsync=(config,options,input)=>{calls.push({config:structuredClone(config),input:structuredClone(input),options});return new Promise((resolve,reject)=>pending.push({resolve:()=>resolve(original(config,input)),reject}));};
 const h=fixture({runOnMount,autoplay:false,synchronous:!asynchronous,draftOverride:draft,snapshotOverride:{ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId+'-focus-'+(++identity)}},adapter});
 const proto=Object.getPrototypeOf(h.root),focus=proto.focus;
 proto.focus=function(options){this.focusOptions=options;return focus.call(this);};
 return {...h,calls,pending};
}
for(const locale of ['en','zh-Hans'])for(const previous of [false,true])test(`simulation focus: focused Cancel returns to Run without scrolling (${locale}, previous=${previous})`,async()=>{
 setLocale(locale);const h=annual({asynchronous:true});try{
  if(previous){h.get('#mc-run').click();h.pending.at(-1).resolve();await ticks();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');}
  const priorChart=h.get('#mc-chart'),seed=h.get('#mc-seed').value;
  h.get('#mc-run').click();const call=h.calls.at(-1),pending=h.pending.at(-1),cancel=h.get('#mc-cancel');cancel.focus();cancel.click();
  assert.equal(cancel.hidden,true);assert.equal(h.get('#mc-run').disabled,false);assert.equal(h.doc.activeElement,h.get('#mc-run'));assert.deepEqual(h.get('#mc-run').focusOptions,{preventScroll:true});
  assert.equal(call.options.signal.aborted,true);assert.equal(h.get('#mc-run-progress').textContent,t('simulationManual.cancelled'));assert.equal(h.get('#mc-run-progress').getAttribute('role'),'status');
  assert.equal(h.get('#mc-output').getAttribute('aria-busy'),'false');assert.equal(h.get('#mc-output').getAttribute('data-result-state'),previous?'stale':'idle');assert.equal(h.get('#mc-chart'),priorChart);assert.equal(h.get('#mc-export').disabled,true);
  if(previous){assert.equal(h.get('#mc-output').inert,true);assert.equal(h.get('#mc-play').disabled,true);assert.equal(h.get('#mc-value-basis').disabled,true);}
  const calls=h.calls.length;pending.resolve();await ticks();assert.equal(h.calls.length,calls);assert.notEqual(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.get('#mc-export').disabled,true);assert.equal(h.doc.activeElement,h.get('#mc-run'));
  h.get('#mc-run').click();assert.equal(h.calls.length,calls+1);h.pending.at(-1).resolve();await ticks();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.get('#mc-seed').value,seed);assert.equal(h.get('#mc-export').disabled,false);
 }finally{h.cleanup();setLocale('en');}
});
for(const locale of ['en','zh-Hans'])test(`simulation focus: programmatic Cancel leaves a newer input focused (${locale})`,async()=>{
 setLocale(locale);const h=annual({asynchronous:true});try{
  h.get('#mc-run').click();const input=h.get('#mc-seed');input.focus();h.get('#mc-cancel').click();assert.equal(h.doc.activeElement,input);assert.equal(h.get('#mc-run').focusOptions,undefined);assert.equal(h.calls[0].options.signal.aborted,true);
  h.pending[0].resolve();await ticks();assert.equal(h.doc.activeElement,input);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'idle');assert.equal(h.get('#mc-export').disabled,true);
 }finally{h.cleanup();setLocale('en');}
});
for(const outcome of ['completion','abort','edit','teardown'])test(`simulation focus: passive ${outcome} never redirects a newer input`,async()=>{
 const h=annual({asynchronous:true});try{
  h.get('#mc-run').click();const input=h.get('#mc-seed');input.focus();
  if(outcome==='completion')h.pending[0].resolve();
  if(outcome==='abort'){const e=Error('cancelled');e.name='AbortError';h.pending[0].reject(e);}
  if(outcome==='edit'){input.value='new-seed';input.oninput();h.pending[0].resolve();}
  if(outcome==='teardown'){h.destroy();h.pending[0].resolve();}
  await ticks();assert.equal(h.doc.activeElement,input);assert.equal(h.get('#mc-run').focusOptions,undefined);assert.equal(h.calls.length,1);
 }finally{h.cleanup();}
});
test('simulation focus: shared Guided Cancel also returns to Run and preserves late-completion gating',async()=>{
 const releases=[],h=fixture({ticker:'FOCUS-GUIDED',runOnMount:false,autoplay:false,synchronous:false,yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{h.get('#mc-run').click();h.get('#mc-cancel').focus();h.get('#mc-cancel').click();assert.equal(h.doc.activeElement,h.get('#mc-run'));assert.equal(h.get('#mc-cancel').hidden,true);assert.equal(h.get('#mc-run').disabled,false);for(const resolve of releases)resolve();await ticks();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'idle');assert.equal(h.get('#mc-export').disabled,true);}finally{h.cleanup();}
});
for(const locale of ['en','zh-Hans'])for(const method of ['legacy','annual-path'])test(`simulation focus: Chart value retains focus and exact samples (${locale}, ${method})`,async()=>{
 setLocale(locale);const h=annual({runOnMount:true,method});try{
  h.get('#mc-export').click();const before=JSON.parse(await h.exports.at(-1).text()),seed=h.get('#mc-seed'),draft=structuredClone(h.draft);
  for(const basis of ['perShare','enterprise','perShare','enterprise']){
   const old=h.get('#mc-value-basis');old.focus();old.value=basis;old.onchange();const replacement=h.get('#mc-value-basis');
   assert.notEqual(replacement,old);assert.equal(h.doc.activeElement,replacement);assert.equal(replacement.value,basis);assert.deepEqual(replacement.focusOptions,{preventScroll:true});assert.equal(h.calls.length,1);assert.equal(h.get('#mc-seed'),seed);assert.deepEqual(h.draft,draft);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.get('#mc-export').disabled,false);
  }
  h.get('#mc-export').click();assert.deepEqual(JSON.parse(await h.exports.at(-1).text()),before);
 }finally{h.cleanup();setLocale('en');}
});
for(const locale of ['en','zh-Hans'])test(`simulation focus: a programmatic basis change preserves outside focus (${locale})`,()=>{
 setLocale(locale);const h=annual({runOnMount:true});try{
  const input=h.get('#mc-seed');input.focus();const old=h.get('#mc-value-basis');old.value='perShare';old.onchange();assert.notEqual(h.get('#mc-value-basis'),old);assert.equal(h.doc.activeElement,input);assert.equal(h.get('#mc-value-basis').focusOptions,undefined);assert.equal(h.calls.length,1);
 }finally{h.cleanup();setLocale('en');}
});
test('simulation focus preservation: every V55 shipped byte is unchanged after two exact focus substitutions and exact completed-replay focus hooks',()=>{
 const cwd=new URL('..',import.meta.url),baseline='00f250ea4ed4f0a33fc3254d0edf85125b8d6d51',hooks=JSON.parse(fs.readFileSync(new URL('./fixtures/reference-defaults-reviewed-hooks.json',import.meta.url))).files;
 const paths=execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');let count=0;
 for(const path of paths){let bytes=fs.readFileSync(new URL('../'+path,import.meta.url));const replacements=(hooks[path]||[]).filter(h=>['simulation-focus-continuity','simulation-replay-focus'].includes(h.change));if(replacements.length){let source=bytes.toString();for(const h of replacements){assert.equal(source.split(h.reviewedAdditiveLine).length-1,1,path);source=source.replace(h.reviewedAdditiveLine,h.originalLine);if(h.change==='simulation-focus-continuity')count++;}bytes=Buffer.from(source);}assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+path],{cwd,maxBuffer:20e6}),path);}
 assert.equal(count,2);assert.ok(paths.length>150);
});
