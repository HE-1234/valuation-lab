import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {displayNumber,precisionInputAttributes,readPrecisionInput,bindPrecisionInput,setPrecisionInput} from '../dist/number-display.js';
import {reverseDecimalDisplay} from './decimal-display-preservation.mjs';
import {renderJointMetric,renderJointRelationships} from '../dist/joint-simulation-view.js';
import {renderAnnualPathPreview} from '../dist/annual-path-view.js';
import {renderDistributionEditor,renderDistributionPreview} from '../dist/distribution-view.js';
import {setLocale} from '../dist/i18n.js';
import {minimalDocument,startResearchWorkspace} from './research-workspace-harness.mjs';
import {startStudio} from './v7-runtime-harness.mjs';
const short=text=>assert.doesNotMatch(text,/[+-]?\d+\.\d{3,}/,text);
function control(value,scale=1){const document=minimalDocument();document.root.innerHTML=`<input ${precisionInputAttributes(value,scale)}>`;return document.root.querySelector('input');}
test('decimal display: at most two decimals, no padded zeros, finite extreme and signed values',()=>{
 assert.equal(displayNumber(12),'12');assert.equal(displayNumber(12.5),'12.5');assert.equal(displayNumber(12.345678,8),'12.35');assert.equal(displayNumber(-12345.6789),'-12,345.68');assert.equal(displayNumber(.000123456),'1.23e-4');assert.equal(displayNumber(0),'0');assert.equal(displayNumber(NaN),'—');
 for(const n of [Number.MAX_VALUE,Number.MIN_VALUE,1e20,-1e20,1e-120,-1e-120,.009999,99.999999,-99.999999]){const out=displayNumber(n);short(out);assert.doesNotMatch(out,/Infinity|NaN/);}
});
test('decimal inputs: passive focus, blur and collect preserve exact authored model, including percentage units',()=>{
 for(const [value,scale] of [[.12345678901234567,100],[-.012345678901234567,100],[123456789.98765432,1],[1e-120,100],[0,100],[.600000000000001,1]]){
  const el=control(value,scale),display=el.value;let writes=0;el.oninput=()=>writes++;bindPrecisionInput(el);short(display);assert.equal(readPrecisionInput(el,scale),value);
  for(let i=0;i<3;i++){el.onfocus();assert.equal(el.value,String(value*scale));assert.equal(readPrecisionInput(el,scale),value);el.onblur();assert.equal(el.value,display);assert.equal(readPrecisionInput(el,scale),value);}
  assert.equal(writes,0);
 }
});
test('decimal inputs: real edits including the rounded value commit, invalid text is retained, repair and external sync stay exact',()=>{
 const el=control(.123456789,100),changes=[];el.oninput=()=>changes.push(readPrecisionInput(el,100));bindPrecisionInput(el);
 el.onfocus();el.value='12.35';el.oninput();assert.equal(changes.at(-1),.1235);el.onblur();assert.equal(el.value,'12.35');
 el.onfocus();el.value='12.345678901';el.oninput();el.onblur();assert.equal(el.value,'12.35');el.onfocus();assert.equal(el.value,'12.345678901');assert.equal(readPrecisionInput(el,100),12.345678901/100);
 for(const text of ['', 'bad']){el.value=text;el.oninput();el.onblur();el.onfocus();assert.equal(el.value,text);assert.ok(Number.isNaN(readPrecisionInput(el,100)));}
 setPrecisionInput(el,.0987654321,100);assert.equal(el.value,'9.88');el.onfocus();assert.equal(readPrecisionInput(el,100),.0987654321);assert.equal(el.value,String(.0987654321*100));
 const missing=control(null);bindPrecisionInput(missing);missing.onfocus();assert.equal(missing.value,'');missing.onblur();assert.equal(missing.value,'');
});
test('decimal presentation: joint targets, relationships, uncertainty previews and bounds are capped in both languages',()=>{
 try{for(const locale of ['en','zh-Hans']){setLocale(locale);const config={method:'joint-annual-path',annualPath:{innovationSD:.0312345,persistence:.612345,fixedYears:[]},annualMetrics:{margin:{innovationSD:.012345,persistence:.712345,fixedYears:[]}},jointAnnual:{version:'joint-annual-path-v1',loadings:{growth:.123456,margin:.987654},observations:[{metric:'growth',year:4,value:.1234567890123,errorSD:.0000123456}]}};
 const html=renderJointMetric(config,{baseline:[.1,.2,.3,.1234567890123]},'growth')+renderJointRelationships(config)+renderAnnualPathPreview({baseline:[.1234567,.2345678],preview:[{growth:[.1111111,.2222222]}],fixedYears:[],terminalYear:3,terminalGrowth:.0245678})+renderDistributionEditor('test','Test',100,'%',{type:'normal',low:.0123456,high:.1987654,mean:.111111,sd:.0234567})+renderDistributionPreview({type:'fixed',value:1.2345678},1,'×');
 const document=minimalDocument();document.root.innerHTML=html;for(const input of document.root.querySelectorAll('input'))short(input.value);short(document.root.textContent);
 }}finally{setLocale('en');}
});
test('decimal Annual: passive edits of all numeric groups and derived ratio do not write drafts or change exact values',async()=>{
 const h=await startResearchWorkspace();try{
  h.change('#annual-growth-horizon','15');const before=JSON.stringify(h.getState().draft),writes=h.writes.length;
  for(const el of h.root.querySelectorAll('input').filter(el=>el.dataset.raw!==undefined||el.dataset.precisionValue!==undefined)){short(el.value);el.onfocus?.();el.onblur?.();if(el.id==='annual-marginal-sales-capital')el.onchange?.();short(el.value);}
  assert.equal(JSON.stringify(h.getState().draft),before);assert.equal(h.writes.length,writes);
  const terminal=h.root.querySelector('[data-research-input="terminal"][data-field="growth"]');terminal.onfocus();terminal.value='2.345678901';terminal.oninput();terminal.onblur();assert.equal(terminal.value,'2.35');assert.equal(h.getState().draft.terminal.growth,2.345678901/100);terminal.onfocus();assert.equal(terminal.value,'2.345678901');
 }finally{h.destroy();}
});
test('decimal Guided: idle fields are rounded and passive focus preserves exact state; slider and worksheet mates stay synchronized',async()=>{
 const h=await startStudio();h.input('#g-growth','12.345678901');h.get('#g-growth').onblur();assert.equal(h.get('#g-growth').value,'12.35');const before=JSON.stringify(h.state());
 for(const el of h.app.querySelectorAll('[data-precision-value]')){short(el.value);el.onfocus?.();el.onblur?.();short(el.value);}
 assert.equal(JSON.stringify(h.state()),before);h.get('#g-growth').onfocus();assert.equal(h.get('#g-growth').value,'12.345678901');
 h.input('[data-slider="growth"]','13.456789');assert.equal(h.get('#g-growth').value,'13.46');h.get('#g-growth').onfocus();assert.equal(readPrecisionInput(h.get('#g-growth'),100),13.456789/100);
});
test('decimal preservation: every changed asset reverses to exact V60 bytes and rejects unreviewed additions',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/decimal-display-v61.json',import.meta.url))),sha=x=>createHash('sha256').update(x).digest('hex');
 assert.equal(fixture.baselineCommit,'41594f7f24219f205426a212c54deb3979ecb466');assert.equal(Object.keys(fixture.files).some(path=>path.startsWith('dist/data/')||/engine|model|sampling|registry/.test(path)),false);
 for(const [path,entry]of Object.entries(fixture.files)){const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));assert.equal(sha(reverseDecimalDisplay(path,bytes)),entry.beforeSHA256,path);assert.throws(()=>reverseDecimalDisplay(path,Buffer.concat([bytes,Buffer.from('\n/* unreviewed */')])),/numeric presentation bytes|exact isolated NVMI integration bytes/);}
 for(const [path,digest]of Object.entries(fixture.additions))assert.equal(sha(fs.readFileSync(new URL('../'+path,import.meta.url))),digest,path);
});
test('decimal Annual grammar: grouped text stays exact, malformed and nondecimal inputs are rejected',async()=>{
 const h=await startResearchWorkspace();try{
  h.change('#annual-growth-horizon','15');let el=h.get('#annual-marginal-sales-capital');el.onfocus();el.value='1,234.56789';el.oninput();el.onblur();el.onchange();
  assert.equal(h.getState().draft.derivedForecast.marginalSalesCapital,1234.56789);el=h.get('#annual-marginal-sales-capital');assert.equal(el.value,'1234.57');
  for(const text of ['1,23','0x10','0b10','1.234,56']){const before=JSON.stringify(h.getState().draft);el.onfocus();el.value=text;el.oninput();el.onblur();el.onchange();assert.equal(el.value,text);assert.equal(el.getAttribute('aria-invalid'),'true');assert.equal(JSON.stringify(h.getState().draft),before);}
  el.onfocus();el.value='1.23456789e3';el.oninput();el.onblur();el.onchange();assert.equal(h.getState().draft.derivedForecast.marginalSalesCapital,1234.56789);
 }finally{h.destroy();}
});
test('decimal parser boundaries: Guided invalid grouped text stays invalid-looking, missing quote remains blank',async()=>{
 const h=await startStudio();assert.equal(h.get('#quote-price').value,'');h.get('#quote-price').onfocus();h.get('#quote-price').onblur();assert.equal(h.get('#quote-price').value,'');assert.equal(h.state().quote.price,null);
 h.step(4);h.change('#guided-capital-mode','phased');const el=h.get('#guided-capital-laterSalesCapital');h.input('#guided-capital-laterSalesCapital','1,234.56789');el.onblur();assert.equal(el.value,'1,234.56789');assert.equal(h.state().capitalPath.laterSalesCapital,null);assert.equal(h.state().capitalPath.inputText.laterSalesCapital,'1,234.56789');assert.match(h.get('#guided-results').textContent,/Value withheld/);
 const numeric=control(1.234567);numeric.attrs.type='number';bindPrecisionInput(numeric);numeric.value='1,234.56789';numeric.oninput();numeric.onblur();assert.ok(Number.isNaN(readPrecisionInput(numeric)));assert.equal(numeric.value,'1,234.56789');
});
