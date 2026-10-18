import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {getLocale,setLocale,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
import {researchSummaries,getResearchSummary,researchTextHTML} from '../dist/research-summaries.js';
import researchEn from '../dist/locales/research.en.js';
import researchZh from '../dist/locales/research.zh-Hant.js';
import proseEn from '../dist/locales/research-prose.en.js';
import proseZh from '../dist/locales/research-prose.zh-Hant.js';
import {authoredResearchText,authoredResearchTextHTML,authoredResearchMessage} from '../dist/research-prose-i18n.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
const numeric=s=>(s.match(/\d+(?:[.,]\d+)*/g)||[]).sort();
test('research: all fourteen summaries translate without changing research records or numeric literals',()=>{
 const frozen=JSON.stringify(researchSummaries);const previous=getLocale();
 assert.equal(Object.keys(researchSummaries).length,14);
 assert.deepEqual(Object.keys(researchEn).sort(),Object.keys(researchZh).sort());
 clearTranslationDiagnostics();
 for(const ticker of Object.keys(researchSummaries)){
  setLocale('en');assert.equal(getResearchSummary(ticker),researchSummaries[ticker].summary);
  setLocale('zh-Hant');assert.match(getResearchSummary(ticker),/[\u3400-\u9fff]/);
  assert.deepEqual(numeric(getResearchSummary(ticker)),numeric(researchSummaries[ticker].summary),ticker);
  assert.match(researchTextHTML(ticker),new RegExp(`data-i18n="research.${ticker}.summary"`));
 }
 assert.equal(JSON.stringify(researchSummaries),frozen);
 assert.deepEqual(getMissingTranslations(),[]);setLocale(previous);
});
test('research: source prose keys are content hashes and explicit presentation escaping is safe',()=>{
 assert.deepEqual(Object.keys(proseEn).sort(),Object.keys(proseZh).sort());
 for(const [key,value]of Object.entries(proseEn))assert.equal(key,'text.'+sha(value).slice(0,20),key);
 const value='No verified current market quote; price-dependent conclusions require a dated same-basis quote.';
 const previous=getLocale();setLocale('zh-Hant');assert.match(authoredResearchText(value),/報價/);
 assert.match(authoredResearchTextHTML(value),/data-i18n="research-prose.text\./);
 assert.ok(authoredResearchMessage(value)?.key.startsWith('research-prose.'));
 assert.equal(authoredResearchTextHTML('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
 assert.equal(authoredResearchMessage('User-supplied unregistered prose'),null);
 setLocale('en');assert.equal(authoredResearchText(value),value);setLocale(previous);
});
test('research: all localized standalone pages reverse exactly to original English hashes',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../dist/locales/research-presentation-manifest.json',import.meta.url),'utf8'));
 const coverage=JSON.parse(fs.readFileSync(new URL('../dist/locales/research-pages-coverage.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(manifest.pages).length,26);
 for(const [page,entry]of Object.entries(manifest.pages)){
  const raw=fs.readFileSync(new URL('../dist/'+page,import.meta.url),'utf8');
  const original=raw.replace(/<span data-research-i18n="true" data-i18n="research-pages\.text\.[a-f0-9]{20}">([\s\S]*?)<\/span>/g,'$1').replace(/<link data-research-locale="true" rel="stylesheet" href="(?:\.\.\/)+i18n.css">\n<script data-research-locale="true" type="module" src="(?:\.\.\/)+research-page-i18n.js"><\/script>/,'');
  assert.equal(sha(raw),entry.presentationSHA256,page);assert.equal(sha(original),entry.originalEnglishSHA256,page);
  assert.equal(Buffer.byteLength(original),entry.originalEnglishBytes,page);
  const row=coverage.pages.find(r=>r.page===page);assert.equal(row.complete,row.missingKeys.length===0,page);
 }
});
test('research: each data-prose overlay has verified immutable source-file and English-pointer provenance',()=>{
 const provenance=JSON.parse(fs.readFileSync(new URL('../dist/locales/research-prose-provenance.json',import.meta.url),'utf8'));
 const sources=new Map();
 for(const [file,hash]of Object.entries(provenance.sourceFilesSHA256)){
  const raw=fs.readFileSync(new URL('../dist/'+file,import.meta.url));assert.equal(sha(raw),hash,file);sources.set(file,JSON.parse(raw));
 }
 assert.ok(Object.keys(provenance.entries).length>100);
 for(const [key,entries]of Object.entries(provenance.entries))for(const entry of entries){
  const parts=entry.pointer.split('/').slice(1).map(x=>x.replace(/~1/g,'/').replace(/~0/g,'~'));
  const value=parts.reduce((item,part)=>item[part],sources.get(entry.file));
  assert.equal(value,proseEn[key],`${entry.file}#${entry.pointer}`);assert.equal(sha(value),entry.englishSHA256,key);
 }
});
