// Source and parsed-DOM regression contracts. These are not pixel-layout proof.
// The paired browser collector and source-driven static renders provide geometry evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualRevenueGrowthData,annualRevenueGrowthChartHTML,annualFCFFGrowthData,annualFCFFGrowthChartHTML} from '../dist/annual-revenue-growth-chart.js';
import {growthChartData} from '../dist/approved-charts.js';
import {researchDraftFor,calculateResearchOperating} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {incrementalRecord} from '../dist/incremental-registry.js';
import {incrementalResearchDraft} from '../dist/incremental-research.js';
import {simulationDefaults} from '../dist/simulation.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {setLocale} from '../dist/i18n.js';
import {minimalDocument} from './research-workspace-harness.mjs';
import {fixture as simulationFixture} from './v7-simulation-harness.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('dist/research.css'),report=read('dist/skins/report.css');
const rule=(source,selector)=>{
 const offset=source.indexOf(selector+'{');assert.notEqual(offset,-1,selector);
 return source.slice(offset+selector.length+1,source.indexOf('}',offset));
};
const parsed=html=>{const doc=minimalDocument();doc.root.innerHTML=html;return doc.root;};

test('annotation geometry: only annual columns grow; plot height, wrapping, typography and density remain intact',()=>{
 assert.equal(rule(css,'.annual-revenue-growth .annual-revenue-growth-bars'),'grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:22px 12px;padding-top:20px;align-items:start');
 assert.equal(rule(css,'.annual-revenue-growth .approved-growth-column'),'height:auto;min-height:156px;border-radius:3px');
 assert.equal(rule(css,'.annual-revenue-growth .approved-growth-year'),'overflow-wrap:anywhere');
 assert.equal(rule(css,'.annual-revenue-growth .approved-growth-track'),'height:108px');
 assert.equal(rule(css,'.annual-growth-status'),'display:block;text-align:center;font-size:10px;line-height:12px;color:var(--muted);margin-top:2px;overflow-wrap:anywhere');
 assert.match(read('dist/approved-workspace.css'),/\.approved-growth-column\{height:112px;min-width:0;position:relative\}/);
 assert.match(read('dist/skins/report-ux.js'),/bars\.classList\.toggle\('rx-dense', bars\.children\.length > 12\)/);
 const repaired=css.slice(css.indexOf('/* Keep the common plot aligned'),css.indexOf('.annual-revenue-growth .approved-growth-column:focus-visible'));
 assert.doesNotMatch(repaired,/font|color|overflow:(?:hidden|auto|scroll)|max-height|visibility|display:none/);
});

const models=()=>{
 const mcd=incrementalRecord('MCD'),mcdDraft=incrementalResearchDraft({ticker:'MCD',presetId:mcd.identity.version,incrementalResearch:mcd.identity,annualCase:mcd.annualCase});
 const aapl=JSON.parse(read('dist/data/renewed-research-2026-10-17/cases.json')).companies.find(c=>c.ticker==='AAPL');
 assert.ok(aapl);
 return [['MCD-11',mcdDraft,11],...[10,15,20].map(n=>['AAPL-'+n,deriveAnnualGrowthHorizon(researchDraftFor(aapl),aapl,{growthMaturityYear:n}),n])];
};
for(const locale of ['en','zh-Hans'])test(`annotation geometry: MCD11 and annual10/15/20 retain every ${locale} year/status/value and shared signed scale`,()=>{
 try{
  setLocale(locale);
  for(const [name,draft,count]of models()){
   const before=structuredClone(draft),operating=calculateResearchOperating(draft),rows=operating.rows;
   assert.equal(rows.length,count,name);
   const beforeRows=structuredClone(rows);
   const variants=[
    [annualRevenueGrowthData(rows,draft.anchor.revenue),annualRevenueGrowthChartHTML(rows,{anchor:draft.anchor,terminalGrowth:draft.terminal.growth})],
    [annualFCFFGrowthData(rows),annualFCFFGrowthChartHTML(rows)]
   ];
   for(const [points,html]of variants){
    const root=parsed(html),columns=root.querySelectorAll('.approved-growth-column'),table=root.querySelector('tbody');
    assert.equal(columns.length,count,name);assert.equal(table.querySelectorAll('tr').length,count,name);
    const scale=growthChartData(points.map((p,i)=>({year:i+1,growth:p.growth??0})),{stableYear:count}),range=scale.max-scale.min;
    columns.forEach((column,i)=>{
     const p=points[i],value=p.growth===null?null:p.growth*100,height=value===null?0:Math.abs(value)/range*100,bottom=value!==null&&value<0?scale.zero-height:scale.zero;
     assert.equal(column.dataset.annualGrowthYear,String(i+1));assert.equal(column.getAttribute('tabindex'),'0');
     assert.equal(column.getAttribute('aria-label'),column.getAttribute('title'));
     assert.equal(column.getAttribute('style'),`--growth-zero:${scale.zero}%`);
     assert.equal(column.querySelector('.approved-growth-bar').getAttribute('style'),`height:${height}%;bottom:${bottom}%;transform-origin:${value<0?'top':'bottom'}`);
     assert.ok(column.querySelector('.approved-growth-year').textContent.trim(),name+' year label');
     assert.equal(!!column.querySelector('.annual-growth-status'),!!p.status,name+' transition retained');
     if(p.status){assert.ok(column.querySelector('.annual-growth-status').textContent.trim());assert.equal(column.querySelector('.approved-growth-value').textContent,'—');}
    });
    if(name==='MCD-11'&&points[0].status){
     const expected=locale==='en'?'No comparable period':'无可比期间';
     assert.equal(columns[0].querySelector('.annual-growth-status').textContent,expected);
     assert.equal(columns[1].querySelector('.annual-growth-status').textContent,expected);
     assert.equal(table.querySelectorAll('td')[0].textContent,expected);
    }
   }
   assert.deepEqual(rows,beforeRows,name+' chart rendering cannot mutate calculated rows');
   assert.deepEqual(draft,before,name+' chart rendering cannot mutate financial inputs');
   assert.deepEqual(calculateResearchOperating(draft),operating,name+' financial outputs unchanged');
  }
 }finally{setLocale('en');}
});

test('trial geometry: only fourth-button remote controls receive the <=760px escape from nowrap',()=>{
 const start=report.indexOf('/* A restored custom trial count adds a fourth choice.'),end=report.indexOf('/* Annual tables on phones:',start);
 assert.ok(start>report.indexOf('width: auto !important; flex-wrap: nowrap;'));
 const block=report.slice(start,end);
 assert.match(block,/@media \(max-width: 760px\)/);
 const rules=[...block.matchAll(/(& body [^{]+)\{([^}]+)\}/g)];assert.equal(rules.length,6);
 for(const [,selector,declarations]of rules){
  assert.ok(selector.includes('.simulation-lab .mc-run-actions'));assert.ok(selector.includes('.rx-remote-choice'));
  assert.ok(selector.includes('button:nth-of-type(4)'));
  assert.doesNotMatch(declarations,/font|color|overflow:(?:hidden|auto|scroll)|max-height|visibility|display:\s*none/);
  for(const id of ['mc-trials','research-mc-trials'])assert.ok(!selector.includes('#'+id),'No namespace-specific selector');
 }
 assert.match(block,/\.rx-trials:has[^\n]+flex: 1 1 100% !important; flex-direction: column !important; align-items: stretch !important/);
 assert.match(block,/\.rx-stacked:has[^\n]+flex-direction: column !important/);
 assert.match(block,/\.rx-two:has[^\n]+display: grid !important/);
 assert.match(block,/> button \{ flex: 0 1 auto !important; min-width: 0; max-width: 100%; overflow-wrap: anywhere; \}/);
 // The standard three-option row retains both of the original exact rules.
 assert.ok(report.includes('& body .simulation-lab .mc-run-actions .rx-trials .rx-choice { display: inline-flex !important; flex-direction: row !important; width: auto !important; flex-wrap: nowrap; }'));
 assert.ok(report.includes('& body .simulation-lab .mc-run-actions .rx-trials .rx-choice > button { flex: none !important; width: auto !important; }'));
});

for(const locale of ['en','zh-Hans'])test(`trial geometry: standard and restored custom counts keep native ${locale} options, reset/Undo and idle behavior`,()=>{
 try{
  setLocale(locale);
  for(const prefixed of [false,true])for(const count of [1000,5000,10000,7,37,4000]){
   const r=incrementalRecord('MCD'),draft=prefixed?incrementalResearchDraft({ticker:'MCD',presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase}):null;
   if(draft)draft.researchSimulationConfig.trials=count;
   const config=prefixed?structuredClone(draft.researchSimulationConfig):{...simulationDefaults(),trials:count},changes=[],adapter=prefixed?annualResearchSimulationAdapter(draft):undefined;
   const h=simulationFixture({ticker:'ANNOTATION-'+locale+'-'+count,simulationConfig:config,adapter,runOnMount:false,reduced:true,autoplay:false,onConfigChange:c=>changes.push(c)});
   try{
    const select=h.get('#mc-trials'),options=[...select.innerHTML.matchAll(/<option\b[^>]*value="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(select.getAttribute('id'),prefixed?'research-mc-trials':'mc-trials');
    assert.equal(options.length,[1000,5000,10000].includes(count)?3:4);assert.ok(options.includes(String(count)));assert.equal(select.value,String(count));
    assert.equal(h.get('#mc-chart'),null);
    h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-trials').value,'5000');
    h.get('#mc-undo-reset').click();assert.equal(h.get('#mc-trials').value,String(count));
    assert.deepEqual(changes.at(-1),config);assert.equal(h.get('#mc-chart'),null);
   }finally{h.cleanup();}
  }
 }finally{setLocale('en');}
});
