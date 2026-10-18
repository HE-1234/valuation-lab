import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terminalReviewPageHTML,mountTerminalReviewPage} from '../dist/terminal-review-page.js';
import {setLocale} from '../dist/i18n.js';
import review from '../dist/terminal-growth-review-data.js';
import selected,{selectedGrowthPercentages} from '../dist/goog-selected-scenario-data.js';
test('new review page shows one locale, preserves every source and value, and uses neutral selected-case provenance',()=>{
 const en=terminalReviewPageHTML('en'),zh=terminalReviewPageHTML('zh-Hans');
 assert.doesNotMatch(en,/\p{Script=Han}/u);assert.match(en,/Selected Google case/);assert.match(zh,/已选 Google 情景/);assert.doesNotMatch(zh,/Retain 2.5% nominal|Terminal-growth review/);
 for(const r of review.recommendations){assert.ok(en.includes(r.reason));assert.ok(zh.includes(r.reasonZhHans));for(const url of r.companySourceURLs){assert.ok(en.includes(url.replaceAll('&','&amp;')));assert.ok(zh.includes(url.replaceAll('&','&amp;')));}}
 for(const value of ['306.616907','210.132522','214.860845',review.sourceSHA256]){assert.ok(en.includes(value));assert.ok(zh.includes(value));}
 let prior=selected.draft.anchor.revenue;assert.deepEqual(selectedGrowthPercentages,selected.draft.annual.slice(0,3).map(r=>{const x=((r.revenue/prior-1)*100).toFixed(4);prior=r.revenue;return x;}));
 for(const value of selectedGrowthPercentages){assert.ok(en.includes(value));assert.ok(zh.includes(value));}
 const html=fs.readFileSync(new URL('../dist/data/terminal-growth-review-2026-10-18-v1.html',import.meta.url),'utf8');assert.match(html,/<html lang="en">/);assert.match(html,/src="..\/terminal-review-page.js"/);assert.doesNotMatch(html,/\p{Script=Han}/u);
 assert.ok(fs.existsSync(new URL('../dist/data/goog-selected-case-2026-10-18-v1.json',import.meta.url)));assert.equal(fs.existsSync(new URL('../dist/data/goog-selected-bull-2026-10-18-v1.json',import.meta.url)),false);
});
test('new review page honors active locale and existing corner control with correct language metadata',()=>{
 let button;const root={innerHTML:'',setAttribute(k,v){this[k]=v;}},document={documentElement:{lang:''},body:{append:n=>button=n},getElementById:id=>id==='terminal-review-page'?root:button,querySelectorAll:()=>[],createElement:()=>({dataset:{},setAttribute(k,v){this[k]=v;}})};
 try{setLocale('zh-Hans');const release=mountTerminalReviewPage(document);assert.equal(document.documentElement.lang,'zh-Hans');assert.equal(root.lang,'zh-Hans');assert.equal(button.textContent,'EN');assert.match(root.innerHTML,/终值增长率复核/);
 button.onclick();assert.equal(document.documentElement.lang,'en');assert.equal(root.lang,'en');assert.doesNotMatch(root.innerHTML,/\p{Script=Han}/u);assert.equal(button.textContent,'中文');release();
 }finally{setLocale('en');}
});
