// Synthetic lifecycle coverage: explicit clicks, engine call counts and stale generations.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './v7-simulation-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {researchDraftFor} from '../dist/research-model.js';
import {simulationResearchDefaults} from '../dist/research-simulation.js';
import {setLocale,t} from '../dist/i18n.js';
const companies=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
const ticks=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function harness({async=false}={}){
 const draft=researchDraftFor(companies.find(c=>c.ticker==='AAPL'));
 draft.researchSimulationConfig={...simulationResearchDefaults(),method:'legacy',trials:20};
 const adapter=annualResearchSimulationAdapter(draft),original=adapter.simulate.bind(adapter),calls=[],pending=[];
 adapter.simulate=(config,input)=>{calls.push({config:structuredClone(config),input:structuredClone(input)});return original(config,input);};
 adapter.simulateAsync=(config,options,input)=>{calls.push({config:structuredClone(config),input:structuredClone(input),options});return new Promise((resolve,reject)=>pending.push({resolve:()=>resolve(original(config,input)),reject}));};
 const h=fixture({ticker:'MANUAL-COUNT',runOnMount:false,autoplay:false,synchronous:!async,draftOverride:draft,snapshotOverride:{ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId}},adapter});
 return {...h,calls,pending};
}
test('mount, edits, reset, undo and display changes never sample; Run alone samples once and replay reuses samples',()=>{
 const h=harness();try{
  assert.equal(h.calls.length,0);assert.equal(h.get('#mc-export').disabled,true);
  const input=h.get('#mc-seed');input.focus();input.value='manual-seed';input.oninput();assert.equal(h.doc.activeElement,input);assert.equal(h.get('#mc-seed'),input);assert.equal(h.calls.length,0);
  h.get('#mc-reset-distributions').click();h.get('#mc-undo-reset').click();assert.equal(h.calls.length,0);assert.equal(h.get('#mc-seed').value,'manual-seed');
  h.get('#mc-run').click();assert.equal(h.calls.length,1);assert.equal(h.calls[0].config.seed,'manual-seed');assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');
  h.get('#mc-play').click();h.get('#mc-skip').click();setLocale('zh-Hans');assert.equal(t('simulationManual.run'),'运行模拟');h.windowEvents.dispatch('valuation:locale-change');h.windowEvents.dispatch('valuation:theme-change');h.get('#mc-tab-sampling').click();setLocale('en');assert.equal(h.calls.length,1);
  h.get('#mc-seed').value='changed';h.get('#mc-seed').oninput();assert.equal(h.calls.length,1);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'stale');assert.equal(h.get('#mc-output').getAttribute('aria-busy'),'false');assert.equal(h.get('#mc-output').inert,true);assert.equal(h.get('#mc-export').disabled,true);h.get('#mc-export').click();assert.equal(h.exports.length,0);
  h.get('#mc-run').click();assert.equal(h.calls.length,2);
 }finally{setLocale('en');h.cleanup();}
});
test('busy Run is guarded; edits and Cancel abort and late completions cannot commit; exports capture explicit Run settings',async()=>{
 const h=harness({async:true});try{
  assert.equal(h.calls.length,0);h.get('#mc-run').click();assert.equal(h.calls.length,1);assert.equal(h.get('#mc-run').disabled,true);assert.equal(h.get('#mc-cancel').hidden,false);h.get('#mc-run').click();assert.equal(h.calls.length,1);
  h.get('#mc-seed').value='second';h.get('#mc-seed').oninput();assert.equal(h.calls[0].options.signal.aborted,true);h.pending[0].resolve();await ticks();assert.notEqual(h.get('#mc-output').getAttribute('data-result-state'),'current');
  h.get('#mc-run').click();assert.equal(h.calls.length,2);h.get('#mc-cancel').click();assert.equal(h.calls[1].options.signal.aborted,true);h.pending[1].resolve();await ticks();assert.equal(h.get('#mc-export').disabled,true);assert.equal(h.get('#mc-output').getAttribute('aria-busy'),'false');
  h.get('#mc-run').click();assert.equal(h.calls.length,3);h.pending[2].resolve();await ticks();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');h.get('#mc-export').click();const exported=JSON.parse(await h.exports[0].text());assert.equal(exported.config.seed,'second');
 }finally{h.cleanup();}
});
test('invalid settings gate Run without replacing focused input or launching work',()=>{
 const h=harness();try{const seed=h.get('#mc-seed');seed.value='';seed.focus();seed.oninput();assert.equal(h.doc.activeElement,seed);assert.equal(h.get('#mc-run').disabled,true);h.get('#mc-run').click();assert.equal(h.calls.length,0);seed.value='valid';seed.oninput();assert.equal(h.get('#mc-run').disabled,false);h.get('#mc-run').click();assert.equal(h.calls.length,1);}finally{h.cleanup();}
});
test('same-case parent remount retains only explicitly stale presentation and never starts a run',()=>{
 let h=harness();try{h.get('#mc-run').click();assert.equal(h.calls.length,1);}finally{h.cleanup();}
 h=harness();try{assert.equal(h.calls.length,0);assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'stale');assert.equal(h.get('#mc-play').disabled,true);assert.equal(h.get('#mc-export').disabled,true);}finally{h.cleanup();}
});
test('annual primitives live in matching tabs and can be edited without sampling or replacing focused controls',()=>{
 const h=fixture({ticker:'MANUAL-METRIC-TABS',runOnMount:false,autoplay:false});try{
  for(const [tab,key]of [['targetMargin','margin'],['salesCapital','salesCapital'],['wacc','wacc'],['taxTerminal','taxRate']]){
   h.get('#mc-tab-'+tab).click();assert.equal(h.get('#mc-panel-'+tab).hidden,false);assert.match(h.get('#mc-panel-'+tab).innerHTML,new RegExp('id="mc-metric-'+key+'-sd"'));
   const input=h.get('#mc-metric-'+key+'-sd');input.focus();input.value='0.1';input.oninput();assert.equal(h.doc.activeElement,input);assert.equal(h.get('#mc-metric-'+key+'-sd'),input);assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-export').disabled,true);
  }
  assert.match(h.get('#mc-panel-taxTerminal').innerHTML,/id="mc-terminal-roic-type"/);assert.equal(h.get('#mc-driver-salesCapital').disabled,true);assert.equal(h.get('#mc-output').getAttribute('aria-busy'),'false');
 }finally{h.cleanup();}
});
