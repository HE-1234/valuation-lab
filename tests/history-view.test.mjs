import test from 'node:test';
import assert from 'node:assert/strict';
import {historyTrend,renderHistorySeries,renderHistoryCoverage} from '../dist/history-view.js';
const row=(year,value,extra={})=>({period:`FY${year}`,periodEnd:`${year}-12-31`,value,sourceUrl:`https://www.sec.gov/${year}`,...extra});
test('history view: all ten exact annual rows remain present and source linked',()=>{
 const s=Array.from({length:10},(_,i)=>row(2016+i,.01*(i+1))),before=JSON.stringify(s),html=renderHistorySeries(s,'percent','Revenue growth');
 assert.match(html,/All 10 annual observations/);assert.match(html,/10 available/);assert.match(html,/<details class="history-years">/);assert.match(html,/<caption>Revenue growth/);assert.match(html,/<th scope="col">Fiscal year/);assert.equal((html.match(/scope="row"/g)||[]).length,10);
 for(const p of s){assert.ok(html.includes(p.period));assert.ok(html.includes(p.sourceUrl));}assert.equal(JSON.stringify(s),before);
});
test('history view: latest period is not silently replaced when unavailable',()=>{
 const html=renderHistorySeries([row(2024,.2),row(2025,null,{detail:'Pretax loss.'})]);
 assert.match(html,/Latest · FY2025/);assert.match(html,/class="is-unavailable">.*Unavailable/);assert.match(html,/Pretax loss/);assert.match(html,/1 available/);assert.match(html,/One available observation; no trend/);
});
test('history view: missing values split paths instead of being interpolated',()=>{
 const html=historyTrend([row(2019,.2),row(2020,.4),row(2021,null),row(2022,.3),row(2023,.5)]);
 assert.equal((html.match(/<path /g)||[]).length,2);assert.equal((html.match(/<circle /g)||[]).length,4);assert.match(html,/Gaps \/ basis changes/);
});
test('history view: missing fiscal years preserve actual temporal spacing',()=>{
 const html=historyTrend([row(2016,.1),row(2017,.2),row(2025,.3)]),xs=[...html.matchAll(/cx="([\d.]+)"/g)].map(m=>Number(m[1]));
 assert.equal((html.match(/<path /g)||[]).length,1);assert.ok(xs[1]-xs[0]<31);assert.ok(xs[2]-xs[1]>230);assert.match(html,/Gaps \/ basis changes/);
});
test('history view: structural comparability changes split the series',()=>{
 const html=historyTrend([row(2021,.2,{comparabilityNote:'Legacy II-VI'}),row(2022,.4,{comparabilityNote:'Legacy II-VI'}),row(2023,.3,{comparabilityNote:'Acquisition transition'}),row(2024,.5),row(2025,.6)]);
 assert.equal((html.match(/<path /g)||[]).length,2);assert.match(html,/Gaps \/ basis changes/);
});
test('history view: plotted points retain outliers while table explains range exclusions',()=>{
 const html=renderHistorySeries([row(2024,-.2,{rangeEligible:false,detail:'Tax benefit excluded from range.'}),row(2025,.3)]);
 assert.equal((html.match(/<circle /g)||[]).length,2);assert.match(html,/-20%/);assert.match(html,/Tax benefit excluded from range/);
});
test('history view: unusable data never renders zero, invalid SVG coordinates or invented years',()=>{
 const html=renderHistorySeries([row(2024,null),row(2025,NaN)]);
 assert.match(html,/0 available/);assert.match(html,/Comparable annual values unavailable/);assert.doesNotMatch(html,/NaN|Infinity|0%|FY2023|<svg/);
});
test('history view: comparison coverage and shortfall stay outside disclosures',()=>{
 const html=renderHistoryCoverage({label:'FY2023–FY2025 · 3 of 10 requested annual years',shortfallReason:'Only three recast continuing-operation years.',comparabilityNote:'Old group totals are not comparable.'});
 assert.match(html,/3 of 10/);assert.match(html,/three recast/);assert.match(html,/not comparable/);assert.doesNotMatch(html,/<details/);
});
test('history view: units remain explicit and links reject unsafe schemes',()=>{
 const html=renderHistorySeries([row(2025,1200,{sourceUrl:'javascript:alert(1)'})],'TWD millions','Revenue');
 assert.match(html,/TWD millions/);assert.match(html,/1,200/);assert.doesNotMatch(html,/href="javascript/);
});
test('history view: source-provided text is escaped',()=>{
 const html=renderHistorySeries([row(2025,null,{detail:'<img src=x onerror=1>',comparabilityNote:'<script>bad()</script>'})],'percent','<b>metric</b>');
 assert.doesNotMatch(html,/<img|<script|<b>metric/);assert.match(html,/&lt;img/);
});
test('history view: constant values produce finite, nonfabricated points',()=>{
 const html=historyTrend([row(2023,.3),row(2024,.3),row(2025,.3)]);
 assert.equal((html.match(/<circle /g)||[]).length,3);assert.doesNotMatch(html,/NaN|Infinity/);assert.equal(new Set([...html.matchAll(/cy="([\d.]+)"/g)].map(m=>m[1])).size,1);
});
test('history view: decorative chart does not replace a semantic data alternative',()=>{
 const html=renderHistorySeries([row(2024,.2),row(2025,.3)]);
 assert.match(html,/<svg[^>]+aria-hidden="true"[^>]+focusable="false"/);assert.match(html,/<table>/);assert.match(html,/<summary>/);assert.doesNotMatch(html,/onmouseover|tabindex="-1"/);
});
