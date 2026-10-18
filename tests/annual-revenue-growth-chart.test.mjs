import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualRevenueGrowthData,annualRevenueGrowthChartHTML} from '../dist/annual-revenue-growth-chart.js';
import {researchDraftFor,calculateResearchOperating} from '../dist/research-model.js';
import {deriveAnnualGrowthHorizon} from '../dist/annual-growth-horizon.js';
import {researchPathHTML} from '../dist/research-view.js';
import {setLocale} from '../dist/i18n.js';
const cases=JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url))).companies;
test('growth uses actual revenues, retains contraction and zero growth, never metadata',()=>{
 const rows=[{year:1,revenue:120,growth:9},{year:2,revenue:90,growth:9},{year:3,revenue:90,growth:9},{year:4,revenue:0}];
 const before=JSON.stringify(rows),data=annualRevenueGrowthData(rows,100);
 assert.deepEqual(data.map(p=>p.growth),[120/100-1,-.25,0,-1]);assert.equal(JSON.stringify(rows),before);
});
test('zero, missing and negative previous revenue do not fabricate growth',()=>{
 for(const anchor of [0,-10,undefined,NaN])assert.equal(annualRevenueGrowthData([{year:1,revenue:10}],anchor)[0].growth,null);
 assert.deepEqual(annualRevenueGrowthData([{year:1,revenue:0},{year:2,revenue:20},{year:3,revenue:30}],100).map(p=>p.growth),[-1,null,.5]);
});
for(const c of cases)for(const horizon of [null,10,15,20])test(`${c.ticker} ${horizon||'source'}: every model year without valuation mutation`,()=>{
 const draft=researchDraftFor(c),d=horizon?deriveAnnualGrowthHorizon(draft,c,{growthMaturityYear:horizon}):draft,before=JSON.stringify(d),model=calculateResearchOperating(d),data=annualRevenueGrowthData(model.rows,d.anchor.revenue),html=annualRevenueGrowthChartHTML(model.rows,{anchor:d.anchor,terminalGrowth:d.terminal.growth});
 assert.equal(data.length,model.rows.length);data.forEach((p,i)=>assert.equal(p.growth,model.rows[i].growth));
 assert.equal((html.match(/data-annual-growth-year=/g)||[]).length,model.rows.length);assert.match(html,/role="listitem" tabindex="0"/);assert.match(html,/<table>/);assert.equal(JSON.stringify(d),before);
});
test('plot appears immediately after the existing operating chart',()=>{
 const c=cases[0],html=researchPathHTML(c,researchDraftFor(c));assert.match(html,/<\/svg><section class="annual-revenue-growth/);
});
test('Chinese labels and percent values cover the full path',()=>{
 setLocale('zh-Hans');const html=annualRevenueGrowthChartHTML([{year:1,revenue:75},{year:2,revenue:75}],{anchor:{revenue:100,period:'FY2025'},terminalGrowth:.02});assert.match(html,/逐年收入增长率/);assert.match(html,/第 1 年：-25%/);assert.match(html,/第 2 年：0%/);assert.match(html,/稳定期终值增长假设/);setLocale('en');
});

test('FCFF growth handles loss, recovery, zero and missing source anchor',async()=>{
 const {annualFCFFGrowthData,annualFCFFGrowthChartHTML}=await import('../dist/annual-revenue-growth-chart.js');
 const rows=[-10,-5,5,10,0,20,-20,0].map((fcff,i)=>({year:i+1,fcff})),data=annualFCFFGrowthData(rows);
 assert.deepEqual(data.map(p=>p.growth),[null,null,null,1,null,null,null,null]);
 assert.deepEqual(data.map(p=>p.status),['missingBase','loss','recovery',null,'toZero','fromZero','negative','toZero']);
 const html=annualFCFFGrowthChartHTML(rows);assert.match(html,/unlevered FCF \(FCFF\)/);assert.match(html,/Turns positive/);assert.match(html,/does not forecast OCF separately/);assert.doesNotMatch(html,/Infinity|NaN/);
});

test('live EN → Chinese → EN updates FCFF labels, titles and table without replacing focused nodes',async()=>{
 const {minimalDocument}=await import('./research-workspace-harness.mjs');
 const {localizeMarkedNodes}=await import('../dist/i18n.js');
 const {annualFCFFGrowthChartHTML}=await import('../dist/annual-revenue-growth-chart.js');
 const doc=minimalDocument(),root=doc.root,proto=Object.getPrototypeOf(root),query=proto.querySelectorAll;
 proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part.trim())))];};
 proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};
 setLocale('en');root.innerHTML=annualFCFFGrowthChartHTML([-10,-5,5,-5,0,10,20].map((fcff,i)=>({year:i+1,fcff})));
 const release=localizeMarkedNodes(root),nodes=root.querySelectorAll('[data-annual-growth-year]'),before=root.innerHTMLWrites;
 nodes[3].focus();assert.equal(nodes[3].getAttribute('title'),'Year 4: Turns negative');
 setLocale('zh-Hans');assert.equal(nodes[3].getAttribute('title'),'第 4 年：转为负值');assert.equal(nodes[2].getAttribute('aria-label'),'第 3 年：转为正值');assert.match(root.textContent,/仍为负值/);assert.match(root.textContent,/无上年值/);assert.doesNotMatch(root.textContent,/Turns negative|Turns positive|Still negative|No prior value/);assert.equal(nodes[6].getAttribute('aria-label'),'第 7 年：100%');
 setLocale('en');assert.equal(nodes[3].getAttribute('title'),'Year 4: Turns negative');assert.equal(nodes[2].getAttribute('aria-label'),'Year 3: Turns positive');assert.match(root.textContent,/Still negative/);assert.doesNotMatch(root.textContent,/转为负值|转为正值|仍为负值|无上年值/);
 assert.equal(root.innerHTMLWrites,before);assert.equal(doc.activeElement,nodes[3]);assert.deepEqual(root.querySelectorAll('[data-annual-growth-year]'),nodes);release();
});
