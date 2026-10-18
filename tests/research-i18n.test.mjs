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

test('research: every original standalone accessibility label has an exact Chinese overlay',async()=>{
 const {default:pairs}=await import('../dist/locales/research-page-attributes.js');
 const manifest=JSON.parse(fs.readFileSync(new URL('../dist/locales/research-presentation-manifest.json',import.meta.url),'utf8'));
 let count=0;
 for(const page of Object.keys(manifest.pages)){
  const raw=fs.readFileSync(new URL('../dist/'+page,import.meta.url),'utf8');
  for(const match of raw.matchAll(/\b(?:aria-label|alt|placeholder|title)="([^"]+)"/g)){
   assert.ok(pairs[match[1]],`${page}: ${match[1]}`);assert.match(pairs[match[1]],/[\u3400-\u9fff]/);count++;
  }
 }
 assert.ok(count>400);
});

test('research: standalone locale changes restore original accessible labels without replacing nodes',async()=>{
 const previous=getLocale(),saved={document:globalThis.document,location:globalThis.location,fetch:globalThis.fetch};
 const attrs={'aria-label':'Evidence records'},node={isConnected:true,getAttribute:k=>attrs[k]??null,setAttribute:(k,v)=>attrs[k]=v};
 let button;
 globalThis.document={documentElement:{lang:'en'},body:{append:n=>button=n},getElementById:()=>button,createElement:()=>({dataset:{},setAttribute(){}}),querySelector:()=>null,querySelectorAll:s=>s==='[aria-label]'?[node]:[]};
 globalThis.location={pathname:new URL('../dist/data/test.html',import.meta.url).pathname};
 globalThis.fetch=async url=>({ok:true,json:async()=>String(url).endsWith('coverage.json')?{pages:[{page:'data/test.html',complete:true}]}:{}});
 try{
  setLocale('en');await import('../dist/research-page-i18n.js?accessible-label-test');
  assert.equal(attrs['aria-label'],'Evidence records');const original=button;
  for(let i=0;i<20;i++){button.onclick();assert.equal(attrs['aria-label'],i%2?'Evidence records':'證據紀錄');assert.equal(button,original);}
 }finally{
  node.isConnected=false;setLocale(previous);
  for(const [key,value]of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;
 }
});

test('research: original English quotations and exact missing prose keep language metadata across locale changes',async()=>{
 const {markOriginalResearchLanguage}=await import('../dist/research-page-language.js');
 const value=text=>({tagName:'DD',textContent:text,attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const quote=value('Original English evidence.'),raw=value('Revenue     100'),chinese=value('原始中文引文'),analysis=value('Authored analysis'),translatedRaw=value('Translatable source label');
 const terms=[['source Excerpt',quote],['raw Line',raw],['raw Text',chinese],['rationale',analysis],['raw Text',translatedRaw]].map(([textContent,nextElementSibling])=>({textContent,nextElementSibling}));
 const pending={data:'Exact pending English',replaceWith(node){this.wrapper=node;}},other={data:'Unrelated English'};
 let cursor=0;
 const root={body:{},querySelectorAll:s=>s==='dt'?terms:[],createTreeWalker:()=>({nextNode(){this.currentNode=[pending,other][cursor++];return Boolean(this.currentNode);}}),createElement:()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},append(n){this.child=n;}})};
 assert.equal(markOriginalResearchLanguage(root,['Exact pending English'],['Revenue     100']),2);
 const previous=getLocale();
 for(const locale of ['zh-Hant','en','zh-Hant']){setLocale(locale);assert.equal(quote.attrs.lang,'en');assert.equal(raw.attrs.lang,'en');assert.equal(pending.wrapper.attrs.lang,'en');assert.equal(pending.wrapper.child,pending);}
 assert.deepEqual(chinese.attrs,{});assert.deepEqual(analysis.attrs,{});assert.deepEqual(translatedRaw.attrs,{});assert.equal(other.wrapper,undefined);setLocale(previous);
});

test('research: failed translation loading keeps English body language and Chinese warning language',async()=>{
 const previous=getLocale(),saved={document:globalThis.document,location:globalThis.location,fetch:globalThis.fetch},warn=console.warn;
 const bodyAttrs={},notices=[];let button;
 const source={textContent:'Original research remains readable',getAttribute:k=>k==='data-i18n'?'research-pages.text.unavailable':null,hasAttribute:k=>k==='data-i18n'};
 const make=()=>({dataset:{},style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 globalThis.document={documentElement:{lang:'en'},body:{setAttribute:(k,v)=>bodyAttrs[k]=v,prepend:n=>notices.push(n),append:n=>button=n},getElementById:()=>button,createElement:make,querySelector:()=>null,querySelectorAll:s=>s.includes('data-i18n')?[source]:[]};
 globalThis.location={pathname:'/data/test.html'};globalThis.fetch=async()=>{throw Error('Offline');};console.warn=()=>{};
 try{setLocale('zh-Hant');await import('../dist/research-page-i18n.js?failed-load-test');assert.equal(source.textContent,'Original research remains readable');assert.equal(bodyAttrs.lang,'en');assert.equal(notices[0].attrs.lang,'zh-Hant');assert.match(notices[0].textContent,/無法載入/);setLocale('en');assert.equal(notices[0].hidden,true);assert.equal(bodyAttrs.lang,'en');}
 finally{console.warn=warn;setLocale(previous);for(const [key,value]of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
