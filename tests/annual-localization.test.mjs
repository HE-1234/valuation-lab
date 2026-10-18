import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../dist/locales/annual.en.js';
import zh from '../dist/locales/annual.zh-Hans.js';
import {setLocale,localizeMarkedNodes,clearTranslationDiagnostics,getMissingTranslations} from '../dist/i18n.js';
import {localizeAnnualPresentation} from '../dist/annual-localization.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
const tokens=s=>[...new Set([...s.matchAll(/\{([A-Za-z][\w]*)\}/g)].map(m=>m[1]))].sort();
function enhanceDOM(root){
 const proto=Object.getPrototypeOf(root),query=proto.querySelectorAll;
 proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part.trim())))];};
 proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};
}
test('annual catalog has exact key and named-parameter parity',()=>{
 assert.deepEqual(Object.keys(en).sort(),Object.keys(zh).sort());
 for(const key of Object.keys(en)){assert.ok(zh[key].trim(),key);assert.deepEqual(tokens(en[key]),tokens(zh[key]),key);}
});
test('Annual locale round trip preserves exact edits, notes, node identity, focus, Undo and mounted simulation',async()=>{
 setLocale('en');let mounts=0,cleanups=0;
 const h=await startResearchWorkspace({simulationMount(){mounts++;return ()=>cleanups++;}});
 enhanceDOM(h.root);localizeAnnualPresentation(h.root);
 h.input('#research-notes','Company <原始笔记>');h.change('#annual-edit-year','2');
 const control=h.get('[data-year-field="revenue"]');control.focus();control.onfocus();h.input('[data-year-field="revenue"]','812345.6789012345');
 h.get('[data-annual-view="simulation"]').click();
 const controls=h.root.querySelectorAll('input'),notes=h.get('#research-notes'),before=structuredClone(h.getState()),saved=JSON.stringify(h.saved()),writes=h.writes.length,renderCount=h.root.innerHTMLWrites,mounted=mounts,cleaned=cleanups;
 clearTranslationDiagnostics();setLocale('zh-Hans');
 assert.equal(h.get('[data-research-action="use-research"]').textContent,'使用研究案例');
 assert.equal(h.get('#annual-growth-horizon').value,'current');
 assert.deepEqual(h.getState(),before);assert.equal(JSON.stringify(h.saved()),saved);assert.equal(h.writes.length,writes);
 assert.equal(h.root.innerHTMLWrites,renderCount);assert.deepEqual(h.root.querySelectorAll('input'),controls);assert.strictEqual(h.get('#research-notes'),notes);assert.equal(notes.value,'Company <原始笔记>');
 assert.strictEqual(h.focus(),control);assert.equal(control.value,'812345.6789012345');assert.equal(mounts,mounted);assert.equal(cleanups,cleaned);
 assert.equal(h.get('[data-research-action="undo-edit"]').disabled,false);
 setLocale('en');assert.equal(h.get('[data-research-action="use-research"]').textContent,'Use research');assert.deepEqual(h.getState(),before);assert.equal(h.get('#research-notes').value,'Company <原始笔记>');
 assert.deepEqual(getMissingTranslations().filter(x=>x.key.startsWith('annual.')),[]);
 h.destroy();
});
test('annual simulation descriptors localize independently without modifying captured model inputs',async()=>{
 setLocale('en');const h=await startResearchWorkspace();const draft=h.getState().draft,adapter=annualResearchSimulationAdapter(draft),before=JSON.stringify(adapter.captureDraft());
 const english=adapter.axisLabel();setLocale('zh-Hans');assert.notEqual(adapter.axisLabel(),english);assert.ok(adapter.presentationMessage('defaultNote').key);assert.equal(JSON.stringify(adapter.captureDraft()),before);setLocale('en');assert.equal(adapter.axisLabel(),english);h.destroy();
});

test('shared margin caption explicitly localizes authored source while retaining annual rows',async()=>{
 const {marginPathChartHTML}=await import('../dist/margin-path-view.js');
 const points=[{year:0,margin:.123456789},{year:30,margin:.2}],before=JSON.stringify(points);
 const source='Annual forecast margins; no missing historical margin is inferred.';
 setLocale('zh-Hans');const html=marginPathChartHTML(points,{source});
 assert.match(html,/data-i18n="annual.copy.142f1d70fc36"/);assert.match(html,/年度|逐年/);assert.equal(JSON.stringify(points),before);
 setLocale('en');assert.match(marginPathChartHTML(points,{source}),/Annual forecast margins/);
});

test('known rolling-period display is exact allowlisted and preserves original source wording',async()=>{
 const {annualTextHTML,annualLabel}=await import('../dist/annual-localization.js');
 const source='Annual model year 7; Rolling year ending July 2027; not fiscal FY2028 plus 6 years';
 setLocale('zh-Hans');assert.match(annualLabel(source),/第 7 年/);assert.match(annualLabel(source),/FY2028/);assert.match(annualTextHTML(source),/data-i18n="annual.period.authored/);
 const unknown='My own Annual model year 7; Rolling year ending July 2027';assert.equal(annualLabel(unknown),unknown);
 setLocale('en');assert.equal(annualLabel(source),source);
});
