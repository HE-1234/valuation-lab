import test from 'node:test';
import assert from 'node:assert/strict';
import {bindGuidedMessages,matchGuidedMessage,translateGuidedMessage} from '../dist/guided-localization.js';
import {setLocale,getLocale,clearTranslationDiagnostics,getMissingTranslations} from '../dist/i18n.js';
import en from '../dist/locales/guided.en.js';
import zh from '../dist/locales/guided.zh-Hans.js';

function fixture(){
 let changed=()=>{};
 class Element{
  constructor(tag,attrs={}){this.tagName=tag.toUpperCase();this.nodeType=1;this.attrs={...attrs};this.children=[];this.value=attrs.value||'';this.isConnected=true;}
  hasAttribute(k){return Object.hasOwn(this.attrs,k);}getAttribute(k){return this.attrs[k]??null;}setAttribute(k,v){this.attrs[k]=String(v);}
  closest(selector){if(selector.includes('textarea')&&this.tagName==='TEXTAREA'||selector.includes('input')&&this.tagName==='INPUT'||selector.includes('[data-i18n]')&&this.hasAttribute('data-i18n')||selector.includes('[data-user-content]')&&this.hasAttribute('data-user-content'))return this;return null;}
 }
 const nodes=[],elements=[],root=new Element('div');
 const document={activeElement:null,defaultView:{MutationObserver:class{constructor(cb){changed=cb;}observe(){}disconnect(){}}},createTreeWalker(){let i=0;return {nextNode:()=>nodes[i++]||null};}};
 root.ownerDocument=document;root.querySelectorAll=()=>elements;root.contains=node=>node===root||nodes.includes(node)||elements.includes(node);
 const add=(text,tag='p',attrs={})=>{const el=new Element(tag,attrs);elements.push(el);const node={nodeType:3,data:text,parentElement:el,isConnected:true};nodes.push(node);return {el,node};};
 return {root,document,add,mutate:()=>changed(),nodes,elements};
}

test('Guided catalogs have parity and preserve all named parameters',()=>{
 assert.deepEqual(Object.keys(en).sort(),Object.keys(zh).sort());
 const tokens=s=>[...new Set([...s.matchAll(/\{(\w+)\}/g)].map(x=>x[1]))].sort();
 for(const key of Object.keys(en)){assert.deepEqual(tokens(en[key]),tokens(zh[key]),key);assert.ok(zh[key].length,key);}
 assert.ok(Object.keys(en).length>=850);
});
test('Guided matching is whole-message only with explicit named dynamic values',()=>{
 setLocale('zh-Hans');
 assert.equal(translateGuidedMessage('Growth'),'成长');
 assert.equal(translateGuidedMessage('Year 17'),'第 17 年');
 assert.equal(translateGuidedMessage('My private Growth note'),'My private Growth note');
 assert.equal(matchGuidedMessage('https://example.com/Growth'),null);
 assert.equal(translateGuidedMessage('Your WACC: 9%. Dated components below are references, not an observed company WACC.'),'你的 WACC：9%。下方具日期组成项目为参考值，并非观察所得的公司 WACC。');
 setLocale('en');
});
test('Switching preserves control identity, focus, notes, raw values, option keys and surrounding spaces',()=>{
 setLocale('en');const f=fixture(),label=f.add('  Growth  '),note=f.add('Growth','textarea'),input=f.add('','input',{placeholder:'What evidence supports this? What would change your mind?'}),option=f.add('Growth','option'),marked=f.add('Growth','span',{'data-i18n':'annual.growth'});
 input.el.value='17.2500';note.el.value='Growth';option.el.value='Growth';f.document.activeElement=input.el;
 const draft={updatedAt:'2026-10-18T00:00:00Z',notes:{growth:'Growth'},assumptions:{growth:.1725}},before=JSON.stringify(draft),dispose=bindGuidedMessages(f.root);
 setLocale('zh-Hans');f.mutate();
 assert.equal(label.node.data,'  成长  ');assert.equal(note.node.data,'Growth');assert.equal(marked.node.data,'Growth');
 assert.equal(input.el.value,'17.2500');assert.equal(option.el.getAttribute('value'),'Growth');assert.equal(f.document.activeElement,input.el);assert.equal(JSON.stringify(draft),before);
 assert.match(input.el.getAttribute('placeholder'),/证据/);
 setLocale('en');f.mutate();assert.equal(label.node.data,'  Growth  ');assert.equal(option.node.data,'Growth');assert.equal(input.el.value,'17.2500');dispose();
});
test('Fresh calculation messages replace captured numeric params without stale numbers on later switch',()=>{
 setLocale('en');const f=fixture(),year=f.add('Year 10'),dispose=bindGuidedMessages(f.root);
 setLocale('zh-Hans');f.mutate();assert.equal(year.node.data,'第 10 年');
 year.node.data='Year 20';f.mutate();assert.equal(year.node.data,'第 20 年');
 setLocale('en');f.mutate();assert.equal(year.node.data,'Year 20');
 setLocale('zh-Hans');f.mutate();assert.equal(year.node.data,'第 20 年');
 year.node.data='New uncatalogued content';f.mutate();setLocale('en');f.mutate();assert.equal(year.node.data,'New uncatalogued content');dispose();
});
test('Localization never rewrites href, model keys, values, or inserts HTML for dynamic text',()=>{
 setLocale('en');clearTranslationDiagnostics();const f=fixture(),a=f.add('Year <script>','a',{href:'https://example.com/?text=Growth','data-field':'growth',value:'Growth'}),dispose=bindGuidedMessages(f.root);
 setLocale('zh-Hans');f.mutate();assert.equal(a.node.data,'第 <script> 年');assert.equal(a.el.getAttribute('href'),'https://example.com/?text=Growth');assert.equal(a.el.getAttribute('data-field'),'growth');assert.equal(a.el.getAttribute('value'),'Growth');assert.equal(a.el.children.length,0);assert.deepEqual(getMissingTranslations(),[]);dispose();setLocale('en');
});
test('Joined authored validation messages translate only as a complete recognized sequence',()=>{
 setLocale('zh-Hans');
 const message='Revenue must be positive Shares must be positive';
 assert.equal(translateGuidedMessage(message),'营收必须为正 股数必须为正');
 assert.equal(translateGuidedMessage(message+' custom prose'),message+' custom prose');
 assert.equal(translateGuidedMessage('Year 7'),'第 7 年');
 setLocale('en');
});

test('independent forecast tail and margin caption leaves round-trip without swallowing dynamic content',()=>{
 setLocale('en');const f=fixture();
 const sources=['Growth reaches its stable rate in year 10; margin matures in year 20; capital efficiency matures in year 30.','Full cash-flow forecast: 30 years.','Actual modeled EBIT ÷ revenue.','Final margin holds after its selected year unless an annual row is manually overridden.','Example: reach 30% in year 3, hold through year 5, fade to 20% in year 10, then hold 20%.'];
 const leaves=sources.map(source=>f.add(source));const dispose=bindGuidedMessages(f.root);
 setLocale('zh-Hans');f.mutate();for(let i=0;i<sources.length;i++)assert.notEqual(leaves[i].node.data,sources[i],sources[i]);
 assert.match(leaves[1].node.data,/30/);setLocale('en');f.mutate();assert.deepEqual(leaves.map(x=>x.node.data),sources);dispose();
});
test('complete margin chart accessibility descriptions translate every year and preserve numbers',()=>{
 const original='Year 0: 33.17%; Year 1: 31%; Year 2: 31.5%. Annual forecast margins; no missing historical margin is inferred.';
 setLocale('zh-Hans');const translated=translateGuidedMessage(original);
 assert.ok(translated.includes('第 0 年：33.17%'));assert.ok(translated.includes('第 1 年：31%'));assert.ok(translated.includes('第 2 年：31.5%'));
 assert.ok(translated.includes('不推断缺漏的历史利润率'));assert.ok(!translated.includes('Year'));assert.deepEqual(translated.match(/\d+(?:\.\d+)?/g),original.match(/\d+(?:\.\d+)?/g));
 setLocale('en');assert.equal(translateGuidedMessage(original),original);
});
