import {reverseMethodologyDocumentation} from './simulation-methodology-preservation.mjs';
// Real shipped quiz handlers with synthetic viewport geometry. Not native-browser or AT proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {mountQuizView} from '../dist/learn-quiz-view.js';
import {createQuizDeck} from '../dist/learn-deck.js';
import {QUIZ_BANK_PATH,QUIZ_BANK_VERSION} from '../dist/learn-bank.js';
import {setLocale} from '../dist/i18n.js';
import {minimalDocument} from './research-workspace-harness.mjs';
const questions=JSON.parse(fs.readFileSync(new URL('../dist/'+QUIZ_BANK_PATH.replace(/^\.\//,''),import.meta.url),'utf8'));
const seeded=(seed=42)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function fixture(locale='en',options={}){
 setLocale(locale);const document=minimalDocument(),root=document.root,scrolls=[],writes=[];
 let rect={top:-207.078,bottom:-42.078,height:165},headerRect={top:0,bottom:64,height:64};
 const canvas=document.documentElement=root,header={getBoundingClientRect:()=>headerRect};
 document.defaultView={innerHeight:757,scrollY:755,scrollX:17,getComputedStyle:node=>node===canvas?{scrollPaddingTop:'84px',scrollPaddingBottom:'0px'}:{position:'sticky'},scrollBy:value=>{scrolls.push({...value});document.defaultView.scrollY+=value.top;rect={...rect,top:rect.top-value.top,bottom:rect.bottom-value.top};},...options};
 const originalQuery=document.querySelector.bind(document);document.querySelector=selector=>selector==='body > aside'?header:originalQuery(selector);
 const rootQuery=root.querySelector.bind(root);root.querySelector=selector=>{const node=rootQuery(selector);if(node&&node.getAttribute('data-quiz-prompt')!==null){node.getBoundingClientRect=()=>({...rect});}return node;};
 const deck=createQuizDeck({ids:questions.map(q=>q.id),bankVersion:QUIZ_BANK_VERSION,storage:{getItem:()=>null,setItem:(...args)=>writes.push(args)},rng:seeded(),memory:new Map(),failures:new Set()});
 const controller=mountQuizView(root,{questions,deck,rng:seeded(9)});controller.startNewSet({focus:false});
 const get=selector=>root.querySelector(selector),action=name=>get(`[data-quiz-action="${name}"]`).click();
 return {document,root,controller,deck,scrolls,writes,get,action,rect:()=>({...rect}),geometry:value=>{rect={...value};},header:value=>{headerRect={...value};},close(){controller.destroy();setLocale('en');}};
}
for(const locale of ['en','zh-Hans'])for(const action of ['next','previous','review','new'])test(`question visibility: ${action} reveals a prompt above the viewport (${locale})`,()=>{
 const h=fixture(locale);try{
  if(action==='previous')h.action('next');
  if(action==='review')for(let i=0;i<10;i++){h.get('[data-quiz-answer]').click();if(i<9)h.action('next');}
  h.geometry({top:-207.078,bottom:-42.078,height:165});h.scrolls.length=0;
  const before=h.controller.getState(),cursor=h.deck.getState().cursor,writes=h.writes.length,scrollX=h.document.defaultView.scrollX;
  h.action(action);
  assert.equal(h.document.activeElement,h.get('[data-quiz-prompt]'));assert.deepEqual(h.document.activeElement.focusOptions,{preventScroll:true});
  assert.deepEqual(h.scrolls,[{top:-291.078,behavior:'instant'}]);assert.ok(Math.abs(h.rect().top-84)<1e-9);assert.ok(Math.abs(h.rect().bottom-249)<1e-9);assert.equal(h.document.defaultView.scrollX,scrollX);
  const after=h.controller.getState();if(action==='new'){assert.equal(after.answered,0);assert.equal(h.deck.getState().cursor,cursor+10);assert.equal(h.writes.length,writes+1);}else{assert.deepEqual(after.items,before.items);assert.deepEqual(after.answers,before.answers);assert.equal(after.score,before.score);assert.equal(h.deck.getState().cursor,cursor);assert.equal(h.writes.length,writes);}
 }finally{h.close();}
});
for(const locale of ['en','zh-Hans'])for(const theme of ['forest','slate','midnight','sand','plum','ocean'])test(`question visibility: visible prompts preserve scroll (${locale}, ${theme})`,()=>{
 const h=fixture(locale);try{
  h.root.dataset.theme=theme;h.geometry({top:100,bottom:265,height:165});const before=h.document.defaultView.scrollY;
  for(const action of ['next','previous','new'])h.action(action);
  assert.deepEqual(h.scrolls,[]);assert.equal(h.document.defaultView.scrollY,before);assert.equal(h.document.activeElement,h.get('[data-quiz-prompt]'));assert.equal(h.root.dataset.theme,theme);
 }finally{h.close();}
});
const geometryCases=[
 ['partly behind header',{top:35,bottom:200,height:165},-49],
 ['below viewport',{top:800,bottom:965,height:165},208],
 ['partly below viewport',{top:700,bottom:865,height:165},108],
 ['taller than available viewport',{top:300,bottom:1100,height:800},216],
 ['tall prompt already starts at usable top',{top:84,bottom:884,height:800},0],
 ['exactly within usable viewport',{top:84,bottom:757,height:673},0],
 ['zero-height hidden prompt',{top:0,bottom:0,height:0},0],
 ['invalid geometry',{top:NaN,bottom:165,height:165},0]
];
for(const [label,rect,delta] of geometryCases)test(`question visibility: ${label}`,()=>{
 const h=fixture();try{h.geometry(rect);h.action('next');assert.deepEqual(h.scrolls,delta?[{top:delta,behavior:'instant'}]:[]);}finally{h.close();}
});
test('question visibility: a wrapping sticky header reserves its actual height',()=>{
 const h=fixture();try{h.header({top:0,bottom:144,height:144});h.geometry({top:100,bottom:265,height:165});h.action('next');assert.deepEqual(h.scrolls,[{top:-52,behavior:'instant'}]);assert.equal(h.rect().top,152);}finally{h.close();}
});
test('question visibility: static and offscreen headers do not add an occlusion boundary',()=>{
 for(const position of ['static','relative','sticky']){const h=fixture();try{const view=h.document.defaultView;view.getComputedStyle=node=>node===h.root?{scrollPaddingTop:'0px'}:{position};h.header(position==='sticky'?{top:-100,bottom:-20,height:80}:{top:0,bottom:144,height:144});h.geometry({top:10,bottom:175,height:165});h.action('next');assert.deepEqual(h.scrolls,[]);}finally{h.close();}}
});
test('question visibility: bottom document scroll padding is honored',()=>{
 const h=fixture();try{h.document.defaultView.getComputedStyle=node=>node===h.root?{scrollPaddingTop:'84px',scrollPaddingBottom:'20px'}:{position:'sticky'};h.geometry({top:600,bottom:750,height:150});h.action('next');assert.deepEqual(h.scrolls,[{top:13,behavior:'instant'}]);assert.equal(h.rect().bottom,737);}finally{h.close();}
});
test('question visibility: no geometry, no viewport, and fully occupied viewport fail safely',()=>{
 for(const options of [{innerHeight:undefined},{scrollBy:undefined},{innerHeight:50}]){const h=fixture('en',options);try{h.action('next');assert.deepEqual(h.scrolls,[]);assert.equal(h.controller.getState().index,1);}finally{h.close();}}
 const h=fixture();try{delete h.document.defaultView;h.action('next');assert.deepEqual(h.scrolls,[]);}finally{h.close();}
});
for(const locale of ['en','zh-Hans'])test(`question visibility: feedback, locale, option keys and loader-style draws never reveal (${locale})`,()=>{
 const h=fixture(locale);try{
  const first=h.get('[data-quiz-answer]');first.focus();first.click();const saved=h.controller.getState(),cursor=h.deck.getState().cursor;
  setLocale(locale==='en'?'zh-Hans':'en');assert.deepEqual(h.controller.getState(),saved);assert.equal(h.deck.getState().cursor,cursor);assert.equal(h.document.activeElement,first);assert.deepEqual(h.scrolls,[]);
  first.dispatch('keydown',{key:'End'});assert.equal(h.document.activeElement,h.root.querySelectorAll('[data-quiz-answer]')[3]);assert.deepEqual(h.scrolls,[]);
  h.controller.startNewSet();h.controller.startNewSet({focus:false});assert.deepEqual(h.scrolls,[]);
 }finally{h.close();}
});
test('question visibility: stale buttons and destroyed quiz cannot reveal or alter the set',()=>{
 const h=fixture();try{const next=h.get('[data-quiz-action="next"]'),oldAnswer=h.get('[data-quiz-answer]');h.action('next');h.scrolls.length=0;oldAnswer.click();assert.equal(h.controller.getState().answered,0);h.controller.destroy();const state=h.controller.getState();next.click();h.action('new');h.action('review');assert.deepEqual(h.controller.getState(),state);assert.deepEqual(h.scrolls,[]);}finally{h.close();}
});
test('question visibility preservation: every V57 shipped byte is unchanged after six exact quiz-only substitutions',()=>{
 const cwd=new URL('..',import.meta.url),baseline='f68cd24ef6fcb75a7d367f22e8eb9389f24298ba',hooks=JSON.parse(fs.readFileSync(new URL('./fixtures/reference-defaults-reviewed-hooks.json',import.meta.url))).files;
 const paths=execFileSync('git',['ls-tree','-r','--name-only',baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');let count=0;
 for(const path of paths){let bytes=reverseMethodologyDocumentation(path,fs.readFileSync(new URL('../'+path,import.meta.url)));const changes=(hooks[path]||[]).filter(h=>h.change==='learn-question-visibility');if(changes.length){assert.equal(path,'dist/learn-quiz-view.js');let text=bytes.toString();for(const h of changes){assert.equal(text.split(h.reviewedAdditiveLine).length-1,1,path);text=text.replace(h.reviewedAdditiveLine,h.originalLine);count++;}bytes=Buffer.from(text);}assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+path],{cwd,maxBuffer:20e6}),path);}
 assert.equal(count,6);assert.equal(paths.length,354);
});
