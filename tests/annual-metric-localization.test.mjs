import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualMetricMessagePairs,annualMetricMessageKeys} from '../dist/annual-metric-messages.js';
import {setLocale,t,bindText} from '../dist/i18n.js';
import {translateSimulationError,simulationErrorDescriptor} from '../dist/simulation-error-i18n.js';
import {annualLabel,annualTextHTML} from '../dist/annual-localization.js';
import {renderAnnualMetricPanel,renderAnnualPathControls} from '../dist/annual-path-view.js';
const numeric=s=>s.match(/\d+(?:\.\d+)?/g)||[];
test('all new authored metric messages translate exactly and preserve numbers and English source',()=>{
 for(const [en,zh]of Object.entries(annualMetricMessagePairs)){
  setLocale('zh-Hans');assert.equal(annualLabel(en),zh);assert.equal(translateSimulationError(en),zh);assert.match(annualTextHTML(en),/data-i18n="annualMetricMessages\./);assert.deepEqual(numeric(zh),numeric(en),en);
  setLocale('en');assert.equal(annualLabel(en),en);assert.equal(translateSimulationError(en),en);
 }
 assert.equal(translateSimulationError('User-authored unmapped message'),'User-authored unmapped message');
});
test('new annual and terminal validation errors have exact presentation coverage',()=>{
 for(const name of ['annual-path-sampling.js']){
  const code=fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
  for(const match of code.matchAll(/throw Error\('([^']+)'\)/g))assert.ok(simulationErrorDescriptor(match[1]),match[1]);
 }
 for(const message of ['Unsupported terminal uncertainty input.','Terminal uncertainty is outside supported bounds.','Direct annual investment requires the fixed-schedule policy; use annual investmentFactor with a revenue-response policy.'])assert.ok(simulationErrorDescriptor(message));
});
test('metric labels and SD units round trip with unchanged nodes and values',()=>{
 const keys=['sdPP','sdRatio','sdFactor','sdMoney','preview.margin','preview.investmentFactor'];
 const nodes=keys.map(()=>({nodeType:3,data:'',value:'1.23'}));
 const off=nodes.map((node,i)=>bindText(node,'annualMetrics.'+keys[i],{currency:'USD'}));
 for(let i=0;i<20;i++){setLocale(i%2?'en':'zh-Hans');assert.equal(nodes[0].data,i%2?'Innovation SD · percentage points':'创新标准差 · 百分点');assert.ok(nodes.every(n=>n.value==='1.23'));}
 off.forEach(fn=>fn());setLocale('en');
});
test('metric control markup uses whole-message units and growth guidance follows terminal setting',()=>{
 const context={baseline:[.1,.08],terminalGrowth:.03,terminalYear:3,currency:'USD',metrics:{margin:[.2,.2]},terminalScalars:{growth:.03,taxRate:.2,roic:.15}};
 const config={method:'annual-path',annualMetrics:{margin:{fixedYears:[1],innovationSD:0,persistence:.6}}};
 assert.match(renderAnnualMetricPanel(config,context,'margin'),/data-i18n="annualMetrics.sdPP"/);
 const growth=renderAnnualPathControls(config,context);assert.doesNotMatch(growth,/Stable growth stays fixed/);assert.match(growth,/annualMetrics.growthFixedNote/);
});
test('full metric engine disclosures avoid stale unchanged-scalar description and capital policy is localized',()=>{
 const guided=fs.readFileSync(new URL('../dist/simulation.js',import.meta.url),'utf8');
 assert.match(guided,/metricSamplers\?'Annual operating primitives use separate Gaussian AR\(1\)/);
 const adapter=fs.readFileSync(new URL('../dist/research-simulation-view.js',import.meta.url),'utf8');assert.match(adapter,/annualTextHTML\(r.method.capitalDescription\)/);
 assert.ok(Object.keys(annualMetricMessageKeys).some(s=>s.includes('At factor 1, fixed-schedule retains edited pre-reserve investment; revenue-responsive policies may change it')));
});
