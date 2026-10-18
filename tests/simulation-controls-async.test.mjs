// Synthetic event/WAAPI and deterministic scheduler coverage, not browser-paint QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './v7-simulation-harness.mjs';
import {simulationDefaults,simulateCurrent,simulateCurrentAsync} from '../dist/simulation.js';
import {annualResearchSimulationAdapter,mountAnnualResearchSimulation} from '../dist/research-simulation-view.js';
import {researchDraftFor} from '../dist/research-model.js';
import {simulateResearch,simulationResearchDefaults} from '../dist/research-simulation.js';
const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url)));
const allCases=cases.companies;
const baseCase=ticker=>allCases.find(c=>c.ticker===ticker);
const annualFixture=ticker=>{const draft=researchDraftFor(baseCase(ticker));draft.researchSimulationConfig={...simulationResearchDefaults(),method:'legacy',trials:20};return fixture({ticker,autoplay:false,draftOverride:draft,snapshotOverride:{ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId}},adapter:annualResearchSimulationAdapter(draft)});};
const ticks=async()=>{await Promise.resolve();await Promise.resolve();};
async function drain(h,releases){for(let n=0;n<1000;n++){if(releases.length)releases.shift()();await ticks();if(h.get('#mc-chart')||h.get('#mc-error').textContent)break;}await ticks();}

test('Monte Carlo setup is visible with six keyboard tabs and every driver family',()=>{
 const h=fixture({ticker:'MC-TABS',autoplay:false});try{
  const html=h.root.innerHTML;assert.match(html,/<section class="mc-setup"/);assert.ok(html.indexOf('class="mc-setup"')<html.indexOf('<details class="mc-extra"'));assert.doesNotMatch(html,/<details class="mc-settings"/);
  for(const key of ['growth','targetMargin','salesCapital','wacc','relationships','sampling']){assert.ok(h.get('#mc-tab-'+key));assert.equal(h.get('#mc-tab-'+key).getAttribute('role'),'tab');assert.equal(h.get('#mc-panel-'+key).getAttribute('role'),'tabpanel');}
  h.get('#mc-tab-sampling').click();assert.equal(h.get('#mc-panel-sampling').hidden,false);assert.equal(h.get('#mc-panel-growth').hidden,true);assert.equal(h.get('#mc-tab-sampling').getAttribute('aria-selected'),'true');
  h.get('#mc-tab-sampling').onkeydown({key:'Home',preventDefault(){}});assert.equal(h.get('#mc-panel-growth').hidden,false);assert.equal(h.get('#mc-tab-growth').getAttribute('tabindex'),'0');
  h.get('#mc-tab-growth').onkeydown({key:'ArrowLeft',preventDefault(){}});assert.equal(h.get('#mc-panel-sampling').hidden,false);
  for(const key of ['growth','targetMargin','salesCapital','wacc'])for(const type of ['fixed','triangular','uniform','normal'])assert.match(html,new RegExp(`value="${type}"`));
 }finally{h.cleanup()}
});
test('manual falling balls start clearly, pause/resume, and restore exact bins',()=>{
 const h=fixture({ticker:'MC-MANUAL',autoplay:false});try{
  const full=h.bars().map(b=>b.getAttribute('height'));assert.equal(h.animations.length,0);assert.match(h.get('#mc-output').innerHTML.replace(/<\/?span\b[^>]*>/g,''),/>Replay simulation<\/button>/);
  h.get('#mc-play').click();assert.equal(h.animations.length,112);assert.match(h.get('#mc-play').textContent,/Pause replay/);h.get('#mc-play').click();assert.match(h.get('#mc-play').textContent,/Resume replay/);assert.ok(h.animations.every(a=>a.state==='paused'));h.get('#mc-play').click();
  h.get('#mc-skip').click();assert.match(h.get('#mc-play').textContent,/Replay simulation/);assert.deepEqual(h.bars().map(b=>b.getAttribute('height')),full);
 }finally{h.cleanup()}
});
test('sampling count and seed persist per draft; saved arbitrary supported counts remain unchanged',()=>{
 const changes=[],config={...simulationDefaults(),trials:37,seed:'saved-count'},h=fixture({ticker:'MC-COUNT',reduced:true,autoplay:false,simulationConfig:config,onConfigChange:c=>changes.push(c)});try{
  assert.equal(h.get('#mc-trials').value,'37');assert.match(h.root.innerHTML,/37 · saved count/);h.get('#mc-trials').value='1000';h.get('#mc-trials').onchange();assert.equal(changes.at(-1).trials,1000);assert.equal(h.get('#mc-trial-count').textContent,'1,000');
  h.get('#mc-seed').value='replay-me';h.get('#mc-seed').oninput();assert.equal(changes.at(-1).seed,'replay-me');h.get('#mc-run').click();h.get('#mc-export').click();assert.equal(h.exports.length,1);
  h.get('#mc-reset-distributions').click();assert.equal(changes.at(-1),null);assert.equal(h.get('#mc-trials').value,'5000');assert.equal(h.get('#mc-seed').value,'valuation-lab');
 }finally{h.cleanup()}
});
test('chunked legacy runner preserves every output and snapshots inputs before yields',async()=>{
 const h=fixture({ticker:'MC-ASYNC-EQUIV',reduced:true});const snapshot=structuredClone(h.snapshot),draft=structuredClone(h.draft);h.cleanup();
 for(const dependence of ['independent','operating-linked']){
  const c={...simulationDefaults(draft.assumptions),trials:97,dependence,seed:'chunk-equivalence'};c.drivers.growth={type:'normal',low:.02,mean:.08,sd:.03,high:.2};c.drivers.targetMargin={type:'uniform',low:.1,high:.3};c.drivers.salesCapital={type:'fixed',value:2};
  const expected=simulateCurrent(snapshot,draft,c),progress=[];let yields=0;
  const output=await simulateCurrentAsync(snapshot,draft,c,{chunkSize:7,yieldControl:async()=>{yields++},onProgress:p=>progress.push(p)});assert.deepEqual(output,expected);assert.ok(yields>10);assert.deepEqual(progress.at(-1),{completed:97,total:97});
 }
 const config={...simulationDefaults(draft.assumptions),trials:2},expected=simulateCurrent(snapshot,draft,config);let changed=false;const output=await simulateCurrentAsync(snapshot,draft,config,{yieldControl:async()=>{if(!changed){changed=true;draft.normalizationDelta=500;snapshot.cash=900000;config.seed='mutated';}}});assert.deepEqual(output,expected);
});
test('superseded async runs never repaint or export stale results; controls remain active',async()=>{
 const releases=[],h=fixture({ticker:'MC-STALE',autoplay:false,synchronous:false,yieldControl:()=>new Promise(resolve=>releases.push(resolve))});try{
  assert.equal(h.get('#mc-chart'),null);assert.equal(h.get('#mc-export').disabled,true);assert.ok(h.get('#mc-seed'));h.get('#mc-tab-sampling').click();assert.equal(h.get('#mc-panel-sampling').hidden,false);
  h.get('#mc-growth-low').value='90';h.get('#mc-growth-low').oninput();assert.match(h.get('#mc-error').textContent,/low.*mode.*high/);releases.shift()();await ticks();assert.equal(h.get('#mc-chart'),null);
  h.get('#mc-growth-low').value='1';h.get('#mc-trials').value='1000';h.get('#mc-seed').value='first';h.get('#mc-seed').oninput();h.get('#mc-run').click();h.runTimers();assert.equal(h.get('#mc-chart'),null);
  h.get('#mc-seed').value='latest';h.get('#mc-seed').oninput();h.get('#mc-run').click();h.runTimers();await drain(h,releases);assert.ok(h.get('#mc-chart'));h.get('#mc-export').click();const exported=JSON.parse(await h.exports[0].text());assert.equal(exported.config.seed,'latest');assert.equal(exported.attempts,1000);assert.deepEqual(exported.samples,simulateCurrent(h.snapshot,h.draft,exported.config).samples);
  h.get('#mc-seed').value='destroyed';h.get('#mc-seed').oninput();h.get('#mc-run').click();h.runTimers();const before=h.get('#mc-output').innerHTML;h.destroy();for(const resolve of releases.splice(0))resolve();await ticks();assert.equal(h.get('#mc-output').innerHTML,before);
 }finally{h.cleanup()}
});
test('annual setup names direct investment, displays exact reviewed defaults and conditional share toggle',()=>{
 const h=annualFixture('AAPL');try{
  assert.match(h.root.innerHTML,/Explicit net-investment multiplier/);assert.doesNotMatch(h.root.innerHTML,/Sales \/ capital/);assert.equal(h.get('#mc-growthPremium-type').value,'fixed');assert.equal(h.get('#mc-growthPremium-value').value,'0');assert.equal(h.get('#mc-investmentMultiplier-value').value,'1');assert.equal(h.get('#mc-capital-policy').value,'fixed-schedule');assert.match(h.get('#mc-output').innerHTML,/single bar/);assert.match(h.get('#mc-output').innerHTML,/OPERATING EV/);
  h.get('#mc-value-basis').value='perShare';h.get('#mc-value-basis').onchange();assert.match(h.get('#mc-output').innerHTML,/PER COMMON SHARE/);assert.match(h.get('#mc-summary-content').innerHTML,/Conditional common-share median/);assert.doesNotMatch(h.get('#mc-output').innerHTML,/zero common-equity floor/);
  h.get('#mc-investmentMultiplier-type').value='normal';h.get('#mc-investmentMultiplier-type').onchange();assert.equal(h.get('#mc-error').textContent,'');assert.ok(h.get('#mc-investmentMultiplier-sd'));assert.match(h.get('#mc-shape-investmentMultiplier').innerHTML,/<svg/);
 }finally{h.cleanup()}
});
test('annual signed negative EV remains inspectable while unresolved shares stay withheld',()=>{
 const h=annualFixture('NBIS');try{
  const exact=simulateResearch(h.draft,h.draft.researchSimulationConfig);assert.ok(exact.median<0);assert.ok(Number(h.get('#mc-chart').getAttribute('aria-valuemin'))<exact.median);assert.ok(Number(h.get('#mc-chart').getAttribute('aria-valuemax'))>exact.median);assert.match(h.get('#mc-output').innerHTML,/Common-share output is withheld/);assert.doesNotMatch(h.get('#mc-output').innerHTML,/<option value="perShare"/);assert.doesNotMatch(h.get('#mc-output').innerHTML,/zero common-equity floor/);assert.ok(h.get('#mc-market').hidden);
 }finally{h.cleanup()}
});
test('annual public mount accepts absent root without work',()=>assert.equal(typeof mountAnnualResearchSimulation(null,{}),'function'));
test('simultaneous legacy and annual mounts have distinct IDs with complete label/ARIA targets',()=>{
 const legacy=fixture({ticker:'MC-NAMESPACE',autoplay:false}),annual=annualFixture('AAPL');try{
  const fragments=h=>[h.root.innerHTML,h.get('#mc-output').innerHTML,h.get('#mc-summary-content').innerHTML,...['growthPremium','marginShift','investmentMultiplier','waccShift'].map(k=>h.get('#mc-driver-'+k)?.innerHTML||'')].join('');
  const legacyHTML=fragments(legacy),annualHTML=fragments(annual),ids=html=>new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  const legacyIds=ids(legacyHTML),annualIds=ids(annualHTML);assert.ok(annualIds.has('research-mc-seed'));assert.ok(annualIds.has('research-mc-play'));for(const id of annualIds)assert.equal(legacyIds.has(id),false,id);
  assert.doesNotMatch(annualHTML,/\b(?:id|for|aria-controls|aria-labelledby|aria-describedby)="mc-/);
  for(const match of annualHTML.matchAll(/\b(?:for|aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g))for(const id of match[1].split(' '))if(id.startsWith('research-mc-'))assert.ok(annualIds.has(id),`missing target ${id}`);
  annual.get('#mc-investmentMultiplier-type').value='normal';annual.get('#mc-investmentMultiplier-type').onchange();assert.match(annual.get('#mc-driver-investmentMultiplier').innerHTML,/id="research-mc-investmentMultiplier-sd"/);assert.match(annual.get('#mc-driver-investmentMultiplier').innerHTML,/for="research-mc-investmentMultiplier-sd"/);
 }finally{annual.cleanup();legacy.cleanup()}
});
test('saved high-resolution histogram replay stays bounded and completes exact bins',()=>{
 const h=fixture({ticker:'MC-MANY-BINS',autoplay:false,mobile:true,simulationConfig:{...simulationDefaults(),trials:1000,binCount:200}});try{
  const before=h.bars().map(b=>b.getAttribute('height'));h.get('#mc-play').click();assert.ok(h.animations.length<=200);assert.ok(h.animations.length>=64);assert.ok(h.animations.every(a=>Number.isFinite(a.options.delay)));h.get('#mc-skip').click();assert.deepEqual(h.bars().map(b=>b.getAttribute('height')),before);
 }finally{h.cleanup()}
});
test('uncertainty reset has one-step undo preserving distributions, count, seed and invalid saved data',()=>{
 const changes=[],config={...simulationDefaults(),trials:37,seed:'before-reset'},h=fixture({ticker:'MC-UNDO',reduced:true,simulationConfig:config,onConfigChange:c=>changes.push(c)});try{
  h.get('#mc-reset-distributions').click();assert.equal(changes.at(-1),null);assert.equal(h.get('#mc-undo-reset').hidden,false);h.get('#mc-undo-reset').click();assert.deepEqual(changes.at(-1),config);assert.equal(h.get('#mc-trials').value,'37');assert.equal(h.get('#mc-seed').value,'before-reset');assert.equal(h.get('#mc-undo-reset').hidden,true);h.get('#mc-run').click();assert.ok(h.get('#mc-chart'));
 }finally{h.cleanup()}
 const invalid={trials:99,seed:'corrupt original',drivers:{growth:{type:'normal',sd:0}}},invalidChanges=[],broken=fixture({ticker:'MC-UNDO-INVALID',reduced:true,simulationConfig:invalid,onConfigChange:c=>invalidChanges.push(c)});try{
  assert.equal(broken.get('#mc-chart'),null);broken.get('#mc-reset-distributions').click();broken.get('#mc-run').click();assert.ok(broken.get('#mc-chart'));broken.get('#mc-undo-reset').click();assert.deepEqual(invalidChanges.at(-1),invalid);assert.equal(broken.get('#mc-chart'),null);assert.match(broken.get('#mc-error').textContent,/Restored uncertainty settings are invalid/);assert.equal(broken.get('#mc-export').disabled,true);
 }finally{broken.cleanup()}
});
test('falsy persisted configs are withheld instead of silently replaced, in both models',()=>{
 for(const value of [false,0,'']){
  const legacy=fixture({ticker:'MC-FALSY-'+String(value),reduced:true,simulationConfig:value});try{assert.equal(legacy.get('#mc-chart'),null);assert.match(legacy.get('#mc-error').textContent,/Saved uncertainty settings are invalid/);}finally{legacy.cleanup()}
  const draft=researchDraftFor(baseCase('AAPL'));draft.researchSimulationConfig=value;const changes=[],annual=fixture({ticker:'ANNUAL-FALSY-'+String(value),reduced:true,adapter:annualResearchSimulationAdapter(draft),onConfigChange:c=>changes.push(c)});try{
   assert.equal(annual.get('#mc-chart'),null);assert.match(annual.get('#mc-error').textContent,/Saved uncertainty settings are invalid/);annual.get('#mc-reset-distributions').click();annual.get('#mc-run').click();assert.ok(annual.get('#mc-chart'));annual.get('#mc-undo-reset').click();assert.equal(changes.at(-1),value);assert.equal(annual.get('#mc-chart'),null);
  }finally{annual.cleanup()}
 }
});
