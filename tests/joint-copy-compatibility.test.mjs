import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './v7-simulation-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {studioResearchDraft} from '../dist/studio-research-presets.js';
import {setLocale,t} from '../dist/i18n.js';
import {simulationErrorDescriptor,translateSimulationError} from '../dist/simulation-error-i18n.js';
import {annualMetricMessageKeys,annualMetricMessagePairs} from '../dist/annual-metric-messages.js';
const bundle=JSON.parse(fs.readFileSync(new URL('../dist/data/studio-research-presets-2026-10-17-v1.json',import.meta.url)));
for(const locale of ['en','zh-Hans'])test(`joint copy: selected method owns the uncertainty explanation and input label (${locale})`,()=>{
 setLocale(locale);const draft=studioResearchDraft(bundle.presets.find(p=>p.ticker==='AAPL'),bundle);draft.researchSimulationConfig.trials=2;
 const h=fixture({ticker:'JOINT-COPY-'+locale,draftOverride:draft,adapter:annualResearchSimulationAdapter(draft),runOnMount:false});
 try{
  assert.match(h.root.innerHTML,/<p class="mc-assumption-note"><span[^>]*data-i18n="jointAnnual.scope"/);
  assert.match(h.root.innerHTML,/mc-annual-metrics-enabled[^>]*>[\s\S]*?data-i18n="jointAnnual.method"/);
  h.get('#mc-joint-growth-loading').value='.7';h.get('#mc-joint-growth-loading').oninput();
  assert.match(h.root.innerHTML,/<p class="mc-assumption-note"><span[^>]*data-i18n="jointAnnual.scope"/);
  assert.equal(h.get('#mc-chart'),null);
  h.get('#mc-growth-method').value='annual-path';h.get('#mc-growth-method').onchange();
  assert.match(h.root.innerHTML,/<p class="mc-assumption-note"><span[^>]*data-i18n="annualMetrics.note"/);
  h.get('#mc-growth-method').value='joint-annual-path';h.get('#mc-growth-method').onchange();
  assert.match(h.root.innerHTML,/<p class="mc-assumption-note"><span[^>]*data-i18n="jointAnnual.scope"/);
  assert.equal(h.get('#mc-joint-growth-loading').value,'0.7');
 }finally{h.cleanup();setLocale('en');}
});
test('joint errors preserve established exact translations before their additive matcher',()=>{
 try{
  for(const [english,chinese]of Object.entries(annualMetricMessagePairs)){
   assert.equal(simulationErrorDescriptor(english).key,annualMetricMessageKeys[english]);
   setLocale('en');assert.equal(translateSimulationError(english),english);
   setLocale('zh-Hans');assert.equal(translateSimulationError(english),chinese);
  }
  assert.match(translateSimulationError('The application supports scenario-baseline terminal mixtures only.'),/情景基准/);
 }finally{setLocale('en');}
});
