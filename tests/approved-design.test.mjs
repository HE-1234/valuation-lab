// Source and synthetic-DOM checks. These do not establish native browser paint.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {calculateCurrent,currentSnapshot} from '../dist/current-model.js';
import {growthChartData,updateProfitChart,renderApprovedEvidence} from '../dist/approved-charts.js';
import {assumptionEvidence} from '../dist/assumption-history.js';
import {distributionPreviewData} from '../dist/distribution-view.js';
import {fixture} from './v7-simulation-harness.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
function current(h){const d=h.state(),c=h.library.companies.find(c=>c.ticker==='AAPL'),r=c.snapshots.find(r=>r.id===d.snapshotId);return calculateCurrent(currentSnapshot(c,r),d);}
test('approved growth uses every exact model year through the stable endpoint in each supported path',async()=>{
 const h=await startStudio();
 for(const mode of ['legacy','immediate','maintain3','maintain5','annual3','annual5']){
  h.change('#growth-path-mode',mode);
  for(const horizon of mode==='legacy'?[10]:[10,15,20]){
   if(mode!=='legacy')h.change('#growth-maturity',String(horizon));
   const value=current(h),columns=h.get('#approved-growth-path').querySelectorAll('[data-growth-year]');
   assert.equal(columns.length,horizon);assert.deepEqual(columns.map(n=>+n.dataset.growthYear),Array.from({length:horizon},(_,i)=>i+1));
   for(const [i,col]of columns.entries())assert.match(col.getAttribute('aria-label'),new RegExp(`Year ${i+1}:`));
   assert.equal(columns.at(-1).className,'approved-growth-column is-stable');
   if(mode==='immediate'||mode==='legacy')assert.equal(columns[1].className,'approved-growth-column is-fade');
   else if(mode.startsWith('maintain'))assert.equal(columns[1].className,'approved-growth-column is-held');
   else assert.equal(columns[1].className,'approved-growth-column is-input');
   assert.ok(Math.abs(value.rows[horizon-1].growth-h.state().assumptions.terminalGrowth)<1e-12);
   const d=growthChartData(value.rows,{stableYear:horizon,explicitYears:h.state().operatingProfile?.explicitYears});
   assert.deepEqual(d.years.map(r=>r.value),value.rows.slice(0,horizon).map(r=>r.growth));
  }
 }
});
test('approved growth keeps year identity through edits, rapid edits and horizon changes',async()=>{
 const h=await startStudio();h.change('#growth-path-mode','annual5');h.change('#growth-maturity','15');
 const host=h.get('#approved-growth-path'),year5=h.get('[data-growth-year="5"]'),year6=h.get('[data-growth-year="6"]'),end15=h.get('[data-growth-year="15"]'),input=h.get('#growth-year-5');
 input.focus();const old=year6.querySelector('.approved-growth-bar').getAttribute('style');h.input('#growth-year-5','25');h.input('#growth-year-5','15');
 assert.equal(h.get('#growth-year-5'),input);assert.equal(h.focus(),input);assert.equal(h.get('[data-growth-year="5"]'),year5);assert.equal(h.get('[data-growth-year="6"]'),year6);assert.notEqual(year6.querySelector('.approved-growth-bar').getAttribute('style'),old);
 h.change('#growth-maturity','20');assert.equal(h.get('#approved-growth-path'),host);assert.equal(h.get('[data-growth-year="15"]'),end15);assert.equal(end15.className,'approved-growth-column is-fade');
 h.change('#growth-maturity','10');assert.equal(h.get('[data-growth-year="6"]'),year6);assert.equal(h.get('[data-growth-year="15"]'),null);
});
test('approved growth signed common scale, zero and invalid/missing years are honest',()=>{
 const rows=[{year:1,growth:-.3},{year:2,growth:0},{year:3,growth:.025}],data=growthChartData(rows,{stableYear:3});
 assert.equal(data.min,-30);assert.equal(data.max,10);assert.equal(data.zero,75);assert.equal(data.years[0].value,-.3);
 assert.equal(growthChartData([{year:1,growth:0},{year:3,growth:.02}],{stableYear:3}),null);
 assert.equal(growthChartData([{year:1,growth:NaN}],{stableYear:1}),null);assert.equal(growthChartData(rows,{stableYear:5}),null);
 assert.equal(growthChartData(rows).stableYear,3);
 for(const mode of ['immediate','legacy','staged'])assert.equal(growthChartData(rows,{stableYear:3,explicitYears:5,mode}).years[1].kind,'fade');
});
test('approved charts recover from invalid input; signed profit bars retain the zero baseline',async()=>{
 const h=await startStudio();h.input('#g-growth','');assert.equal(h.get('#approved-growth-path').getAttribute('data-state'),'unavailable');assert.equal(h.get('#approved-growth-path').querySelector('.approved-chart-message').hidden,false);
 h.input('#g-growth','-20');assert.equal(h.get('#approved-growth-path').getAttribute('data-state'),'current');
 const chart=h.get('#approved-profit-chart');updateProfitChart(chart,[{year:10,revenue:100,ebit:-15,nopat:-15}]);
 assert.match(chart.querySelector('[data-profit-bar="before"]').getAttribute('style'),/width:20%;left:13\.333/);assert.equal(chart.querySelector('[data-profit-before]').textContent,'-15');assert.equal(chart.querySelector('[data-profit-axis-min]').textContent,'-25');assert.match(chart.querySelector('[data-profit-currency]').textContent,/final forecast year 10/);assert.match(chart.getAttribute('aria-label'),/final forecast year 10/);
});
test('approved history keeps dates, sources, missing values, signed values and annual/TTM distinctions',()=>{
 const html=renderApprovedEvidence({title:'Margin',unit:'percent',series:[{period:'FY2024',periodEnd:'2024-12-31',value:-.12,sourceUrl:'https://example.com/filing'},{period:'FY2025',periodEnd:'2025-12-31',value:null}],ttm:{period:'TTM through 2026-06-30',value:.13}},{key:'targetMargin',assumption:.2});
 assert.match(html,/FY2024/);assert.match(html,/-12%/);assert.match(html,/Unavailable/);assert.match(html,/TTM through 2026-06-30/);assert.match(html,/TTM comparison; annual history is separate/);assert.match(html,/https:\/\/example.com\/filing/);assert.match(html,/--history-zero:/);assert.match(html,/All 2 annual observations/);
});
test('approved condensed history visibly retains actual comparability and range exclusions',()=>{
 const history=JSON.parse(read('../dist/data/company-history.json'));
 for(const ticker of ['COHR','NBIS','TSM'])for(const key of ['growth','targetMargin']){
  const e=assumptionEvidence(history,ticker,key),html=renderApprovedEvidence(e,{key,assumption:.2});
  const encode=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  assert.ok(html.includes(encode(e.summary)));
  if(e.coverage?.comparabilityNote)assert.ok(html.includes(encode(e.coverage.comparabilityNote)));
  if(e.range?.label)assert.ok(html.includes(encode(e.range.label)));
  for(const r of e.series.slice(-5))if(r.rangeEligible===false||r.comparabilityNote){assert.match(html,/Comparability note/);assert.ok(html.includes(encode(r.comparabilityNote||'Excluded from the descriptive range.')));}
 }
});
test('approved distribution shapes preserve bin identity and reflect current normalized driver density',()=>{
 const a=distributionPreviewData({type:'triangular',low:.1,mode:.2,high:.3},100,'growth');
 const b=distributionPreviewData({type:'triangular',low:.1,mode:.12,high:.3},100,'growth');assert.notDeepEqual(a.values,b.values);
 const tiny=distributionPreviewData({type:'normal',low:.0519,mean:.052,high:.0521,sd:.00001},100,'growth');assert.ok(tiny.values.some(p=>p.y>0));
 const h=fixture({ticker:'APPROVED-KEYED',reduced:true});try{const bar=h.get('[data-density-bin="growth-4"]'),before=bar.getAttribute('height');h.get('#mc-growth-mode').value='9';h.get('#mc-growth-mode').oninput();assert.equal(h.get('[data-density-bin="growth-4"]'),bar);assert.notEqual(bar.getAttribute('height'),before);assert.ok(h.get('#mc-chart'));}finally{h.cleanup();}
});
test('approved full navigation, default inputs and reported history remain distinct from output views',async()=>{
 const h=await startStudio();assert.equal(h.get('.screen-workspace').dataset.view,'inputs');assert.equal(h.get('#guided-pane-inputs').hidden,false);assert.equal(h.get('#guided-view-result').textContent,'Forecast');assert.equal(h.get('#guided-view-simulation').textContent,'Valuation range');
 h.get('#guided-view-simulation').click();assert.equal(h.get('#guided-pane-inputs').hidden,true);h.step(3);assert.equal(h.get('#guided-pane-inputs').hidden,false);assert.equal(h.get('#approved-evidence').getAttribute('data-field'),'targetMargin');
 const action=h.get('[data-approved-history="targetMargin"]');action.focus();action.click();assert.equal(h.get('.contextual-evidence-panel').hidden,false);h.document.dispatchEvent({type:'keydown',key:'Escape',preventDefault(){}});assert.equal(h.focus(),action);
});
test('approved supplemental controls stay below charts and retain their original IDs and handlers',async()=>{
 const h=await startStudio(),growth=h.get('#approved-growth-explanations'),hint=h.get('#g-hint-growth'),input=h.get('#g-growth');
 assert.equal(hint.parentNode,growth);assert.equal(input.getAttribute('aria-describedby'),'g-hint-growth');
 assert.equal(h.get('[data-evidence="why-growth"]').parentNode.parentNode,growth);
 assert.ok(h.get('#editor-group-2').children.indexOf(h.get('#approved-growth-path'))<h.get('#editor-group-2').children.indexOf(growth));
 input.focus();h.input('#g-growth','17');assert.equal(h.get('#g-growth'),input);assert.equal(h.focus(),input);assert.equal(h.state().assumptions.growth,.17);
 h.change('#growth-path-mode','annual5');assert.equal(h.get('#g-hint-growth').parentNode,h.get('#approved-growth-explanations'));assert.ok(h.get('#growth-year-5'));
 h.step(3);assert.equal(h.get('[data-slider="tax"]').parentNode,h.get('#approved-profit-explanations'));assert.ok(h.get('#g-tax'));
});
test('margin timing updates retain screen-reader units, descriptions and focused input nodes',async()=>{
 const h=await startStudio();h.change('#growth-path-mode','annual5');h.step(3);
 const hint=h.get('#g-hint-targetMargin'),unit=hint.querySelector('.sr-only'),visible=hint.querySelector('[data-visible-help="targetMargin"]'),input=h.get('#timing-marginMaturityYears'),margin=h.get('#g-targetMargin');
 assert.equal(unit.textContent,'Percent. ');assert.equal(margin.getAttribute('aria-describedby'),'g-hint-targetMargin');input.focus();
 for(const year of ['12','8','20']){h.input('#timing-marginMaturityYears',year);assert.equal(h.get('#timing-marginMaturityYears'),input);assert.equal(h.focus(),input);assert.equal(hint.querySelector('.sr-only'),unit);assert.equal(hint.querySelector('[data-visible-help="targetMargin"]'),visible);assert.match(visible.textContent,new RegExp(`by year ${year},`));assert.doesNotMatch(visible.textContent,/Percent\./);assert.equal(margin.getAttribute('aria-describedby'),'g-hint-targetMargin');}
});
test('approved source retains six themes, self-hosted exact fonts, natural mobile flow and reduced motion',()=>{
 const css=read('../dist/approved-workspace.css'),foundation=read('../dist/approved-foundation.css'),html=read('../dist/index.html');
 for(const key of ['forest','slate','midnight','sand','plum','ocean'])assert.match(html,new RegExp(`data-theme-choice="${key}"`));
 assert.match(foundation,/Instrument-Serif-Regular\.ttf/);assert.match(foundation,/DM-Sans-Variable\.ttf/);assert.match(css,/460ms cubic-bezier\(\.22,\.75,\.2,1\)/);assert.match(css,/@media\(max-width:639px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.doesNotMatch(css,/overflow(?:-x|-y)?\s*:\s*(auto|scroll|hidden)/);assert.match(css,/assumption-tabs button\{[^}]*min-width:0/);assert.match(css,/workspace-editor \.editor-intro\{display:block/);assert.match(css,/workspace-view-tabs button\{width:auto/);assert.match(html,/approved-foundation\.css/);assert.match(html,/approved-workspace\.css/);
});
