import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './v7-simulation-harness.mjs';
import {simulationDefaults} from '../dist/simulation.js';
import {renderAnnualPathPreview} from '../dist/annual-path-view.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {researchDraftFor} from '../dist/research-model.js';
import {simulationResearchDefaults} from '../dist/research-simulation.js';
const settings=()=>({...simulationDefaults(),trials:25});
test('annual path controls use pp, show all years and preview actual completed scenarios',async()=>{
 const changes=[],h=fixture({ticker:'PATH-UI',reduced:true,autoplay:false,simulationConfig:settings(),onConfigChange:c=>changes.push(c)});
 try{
  assert.equal(h.get('#mc-growth-method').value,'joint-annual-path');assert.equal(h.get('#mc-legacy-growth-controls').hidden,true);
  assert.equal(h.get('#mc-annual-innovation-sd').value,'3');assert.equal(h.get('#mc-annual-persistence').value,'0.6');
  for(let y=1;y<=h.draft.assumptions.years;y++)assert.ok(h.get('#mc-annual-fixed-'+y));
  assert.equal(h.get('#mc-annual-fixed-1').getAttribute('aria-pressed'),'true');assert.equal(h.get('#mc-annual-fixed-4').getAttribute('aria-pressed'),'false');
  assert.equal(h.get('#mc-annual-fixed-'+h.draft.assumptions.years).disabled,true);
  assert.match(h.get('#mc-annual-preview').innerHTML,/12 actual completed scenarios/);assert.match(h.get('#mc-annual-preview').innerHTML,/not a confidence band/);
  h.get('#mc-annual-fixed-4').click();assert.equal(h.get('#mc-annual-fixed-4').getAttribute('aria-pressed'),'true');assert.ok(changes.at(-1).jointAnnual.annualPath.fixedYears.includes(4));
  h.get('#mc-annual-innovation-sd').value='5';h.get('#mc-annual-innovation-sd').oninput();assert.equal(changes.at(-1).jointAnnual.annualPath.innovationSD,.05);
  assert.equal(h.animations.length,0);h.get('#mc-run').click();h.get('#mc-export').click();const exported=JSON.parse(await h.exports[0].text());assert.equal(exported.config.method,'joint-annual-path');assert.deepEqual(exported.config.jointAnnual,changes.at(-1).jointAnnual);assert.deepEqual(exported.config.annualPath,settings().annualPath);assert.ok(exported.annualPaths.preview.some(p=>p.growth.some((g,i)=>g!==exported.annualPaths.baseline[i])));for(const p of exported.annualPaths.preview)for(const y of [1,2,3,4])assert.equal(p.growth[y-1],exported.annualPaths.baseline[y-1]);
 }finally{h.cleanup()}
});
test('saved legacy method remains unchanged until selected; switching preserves driver and path settings',()=>{
 const c=settings();delete c.method;delete c.annualPath;delete c.jointAnnual;const changes=[];
 let h=fixture({ticker:'PATH-LEGACY',reduced:true,simulationConfig:c,onConfigChange:c=>changes.push(c)});let saved;
 try{
  assert.equal(h.get('#mc-growth-method').value,'legacy');assert.equal(h.get('#mc-annual-path-controls').hidden,true);assert.equal(changes.length,0);assert.match(h.get('#mc-dependence-note').textContent,/growth–margin 0.49/);
  const growth=structuredClone(c.drivers.growth);h.get('#mc-growth-method').value='annual-path';h.get('#mc-growth-method').onchange();assert.equal(changes.at(-1).method,'annual-path');assert.match(h.get('#mc-dependence-note').textContent,/Annual (growth|primitive) innovations are independent/);assert.doesNotMatch(h.get('#mc-dependence-note').textContent,/growth–margin 0.49/);assert.deepEqual(changes.at(-1).drivers.growth,growth);
  h.get('#mc-annual-fixed-4').click();h.get('#mc-growth-method').value='legacy';h.get('#mc-growth-method').onchange();assert.equal(h.get('#mc-legacy-growth-controls').hidden,false);assert.deepEqual(changes.at(-1).drivers.growth,growth);saved=changes.at(-1);
 }finally{h.cleanup()}
 h=fixture({ticker:'PATH-LEGACY',reduced:true,simulationConfig:saved});try{assert.equal(h.get('#mc-growth-method').value,'legacy');assert.equal(h.get('#mc-annual-fixed-4').getAttribute('aria-pressed'),'true');h.get('#mc-growth-method').value='annual-path';h.get('#mc-growth-method').onchange();assert.equal(h.get('#mc-error').textContent,'');}finally{h.cleanup()}
});
test('blank and invalid annual inputs withhold stale paths, valuations, and exports then recover',()=>{
 const h=fixture({ticker:'PATH-INVALID',reduced:true,simulationConfig:settings()});try{
  for(const [id,value]of [['#mc-annual-innovation-sd',''],['#mc-annual-innovation-sd','-1'],['#mc-annual-persistence','1.1']]){
   h.get(id).value=value;h.get(id).oninput();assert.match(h.get('#mc-output').innerHTML,/withheld/);assert.match(h.get('#mc-annual-preview').innerHTML,/withheld/);assert.equal(h.get('#mc-export').disabled,true);h.get('#mc-export').click();assert.equal(h.exports.length,0);h.get(id).value=id.includes('sd')?'3':'0.6';h.get(id).oninput();assert.equal(h.get('#mc-error').textContent,'');
  }
 }finally{h.cleanup()}
});
test('research view exposes matching annual controls with namespaced labels and explicit terminal setting',()=>{
 const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url)));const draft=researchDraftFor(cases.companies.find(c=>c.ticker==='AAPL'));
 draft.researchSimulationConfig={...simulationResearchDefaults(),trials:25};const h=fixture({ticker:'AAPL',reduced:true,autoplay:false,draftOverride:draft,snapshotOverride:{ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId}},adapter:annualResearchSimulationAdapter(draft)});
 try{assert.equal(h.get('#mc-growth-method').value,'joint-annual-path');assert.ok(h.get('#mc-annual-fixed-'+draft.annual.length));assert.match(h.root.innerHTML,/Baseline terminal growth/);assert.match(h.root.innerHTML,/Scenario endpoints follow the terminal growth uncertainty setting/);assert.match(h.root.innerHTML,/for="research-mc-annual-innovation-sd"/);assert.match(h.get('#mc-annual-preview').innerHTML,/actual completed scenarios/);assert.doesNotMatch(h.get('#mc-output').innerHTML,/single bar/);}finally{h.cleanup()}
});
test('path preview uses supplied paths and anchors without drawing synthetic uncertainty',()=>{
 const p={baseline:[.1,.08],preview:[{trial:0,growth:[.1,.03]}],fixedYears:[1],terminalYear:3,terminalGrowth:.02};const html=renderAnnualPathPreview(p);assert.match(html,/1 actual completed scenarios/);assert.match(html,/3 years/);assert.match(html,/>Terminal</);assert.equal((html.match(/<path /g)||[]).length,2);assert.equal((html.match(/<circle /g)||[]).length,2);assert.doesNotMatch(html,/animate|overflow|#(?:[a-f0-9]{3})/i);
});

test('annual path edits cancel pending work and export only the latest innovation settings',async()=>{
 const releases=[],h=fixture({ticker:'PATH-ASYNC',reduced:true,autoplay:false,synchronous:false,simulationConfig:settings(),yieldControl:()=>new Promise(resolve=>releases.push(resolve))});
 try{
  assert.match(h.get('#mc-annual-preview').innerHTML,/Run simulation/);h.get('#mc-annual-innovation-sd').value='9';h.get('#mc-annual-innovation-sd').oninput();h.get('#mc-run').click();h.runTimers();h.get('#mc-annual-innovation-sd').value='4';h.get('#mc-annual-innovation-sd').oninput();h.get('#mc-run').click();h.runTimers();assert.equal(h.get('#mc-export').disabled,true);assert.doesNotMatch(h.get('#mc-annual-preview').innerHTML,/<svg/);
  for(let i=0;i<100;i++){releases.shift()?.();await Promise.resolve();await Promise.resolve();if(h.get('#mc-chart'))break;}
  assert.match(h.get('#mc-annual-preview').innerHTML,/actual completed scenarios/);h.get('#mc-export').click();const exported=JSON.parse(await h.exports[0].text());assert.equal(exported.config.method,'joint-annual-path');assert.deepEqual(exported.config.jointAnnual,{...settings().jointAnnual,annualPath:{...settings().jointAnnual.annualPath,innovationSD:.04}});assert.deepEqual(exported.config.annualPath,settings().annualPath);assert.equal(exported.config.jointAnnual.annualPath.innovationSD,.04);assert.equal(exported.annualPaths.innovationSD,.04);
 }finally{h.cleanup()}
});
