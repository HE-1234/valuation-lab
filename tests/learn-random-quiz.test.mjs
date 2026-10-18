// Pure and synthetic-DOM tests. These do not certify native paint, touch or screen readers.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {validateQuestionBank,trustedQuizSource,sha256Text,validateQuizAudit,loadQuestionBank,QUIZ_BANK_VERSION} from '../dist/learn-bank.js';
import {createQuizDeck,createQuizSession,QUIZ_DECK_PREFIX} from '../dist/learn-deck.js';
import {mountQuizView} from '../dist/learn-quiz-view.js';
import {mountLearningWorkspace} from '../dist/learn-workspace.js';
import {mountWorkspaceNavigation} from '../dist/workspace-navigation.js';
import {setLocale} from '../dist/i18n.js';
import en from '../dist/locales/learn-quiz.en.js';
import zh from '../dist/locales/learn-quiz.zh-Hans.js';
import {minimalDocument} from './research-workspace-harness.mjs';
const seeded=(seed=42)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const bank=(count=120)=>Array.from({length:count},(_,index)=>({id:`q-${index}`,topic:'discounting',difficulty:'beginner',prompt:{en:`Question ${index}: what is the present value?`,zhHans:`第 ${index} 题：现值是多少？`},options:['a','b','c','d'].map((id,n)=>({id,text:{en:`Choice ${n}`,zhHans:`选项 ${n}`},feedback:{en:`Explanation of choice ${n}.`,zhHans:`选项 ${n} 的解释。`}})),answer:['a','b','c','d'][index%4],explanation:{en:'Discount the future cash flow.',zhHans:'对未来现金流进行折现。'},sources:[{url:'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/background/valintro.htm',title:'Introduction to Valuation',section:'Discounted cash flow'}],verification:{type:'conceptual',reasoning:'Match the cash flow and discount rate.'}}));
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const lessons=JSON.parse(JSON.stringify(vm.runInNewContext(source.match(/const questions=(\[[\s\S]*?\]);/)[1])));
const storageFixture=()=>{const values=new Map(),reads=[],writes=[];return {values,reads,writes,getItem(key){reads.push(key);return values.get(key)??null;},setItem(key,value){writes.push({key,value});values.set(key,value);}};};
const deck=(questions,options={})=>createQuizDeck({ids:questions.map(question=>question.id),bankVersion:QUIZ_BANK_VERSION,storage:storageFixture(),rng:seeded(),memory:new Map(),failures:new Set(),...options});
const events=()=>{const map=new Map();return {addEventListener(type,listener){if(!map.has(type))map.set(type,new Set());map.get(type).add(listener);},removeEventListener(type,listener){map.get(type)?.delete(listener);},dispatchEvent(event){for(const listener of map.get(event.type)||[])listener(event);},emit(detail){this.dispatchEvent({type:'valuation:page-activate',detail});},size:type=>map.get(type)?.size||0};};
const auditFor=async questions=>({schemaVersion:1,bankVersion:QUIZ_BANK_VERSION,status:'approved',questionCount:questions.length,approvedIds:questions.map(question=>question.id),bankSha256:await sha256Text(JSON.stringify(questions),webcrypto),reviewedAt:'2026-10-18',reviewSummary:'Test fixture approval.'});

test('bank schema validates bilingual content, stable identity, four distinct options and trusted primary evidence',()=>{
 const questions=bank();assert.equal(validateQuestionBank(questions),questions);
 const mutations=[q=>q.push(structuredClone(q[0])),q=>q[0].options.pop(),q=>q[0].answer='e',q=>q[0].prompt.zhHans='',q=>q[0].options[0].feedback.zhHans='English only',q=>q[0].options[0].text={en:'Same',zhHans:'相同'},q=>q[0].sources[0].url='https://attacker.example/claim',q=>q[0].verification.expectedNumeric=Infinity];
 for(const [index,mutate]of mutations.entries()){const changed=structuredClone(questions);mutate(changed);if(index===5)changed[0].options[1].text={...changed[0].options[0].text};assert.throws(()=>validateQuestionBank(changed));}
 assert.throws(()=>validateQuestionBank(questions.slice(0,99)),/at least 100/);
 for(const url of ['http://www.sec.gov/example','javascript:alert(1)','https://www.sec.gov.attacker.example/filing','https://user:secret@www.sec.gov/filing','https://www.sec.gov:8080/filing','https://www.sec.gov/'])assert.equal(trustedQuizSource(url),false,url);
 assert.equal(trustedQuizSource(questions[0].sources[0].url),true);
 const numeric=bank();numeric[0].options[0].text={en:'$100',zhHans:'$100'};assert.doesNotThrow(()=>validateQuestionBank(numeric));
});

test('completed independent audit binds every ID and the exact bank bytes before loading',async()=>{
 const questions=bank(),audit=await auditFor(questions),raw=JSON.stringify(questions);
 assert.equal(validateQuizAudit(audit,questions,audit.bankSha256),audit);
 for(const change of [{status:'pending'},{bankSha256:'f'.repeat(64)},{approvedIds:audit.approvedIds.slice(1)},{questionCount:119},{bankVersion:'old'},{reviewSummary:''}])assert.throws(()=>validateQuizAudit({...audit,...change},questions,audit.bankSha256));
 const fetcher=async path=>path.includes('audit')?{ok:true,json:async()=>audit}:{ok:true,text:async()=>raw};
 assert.equal((await loadQuestionBank({fetcher,crypto:webcrypto})).questions.length,120);
 await assert.rejects(loadQuestionBank({crypto:webcrypto,fetcher:async path=>path.includes('audit')?{ok:true,json:async()=>audit}:{ok:true,text:async()=>raw+' '}}),/audit/);
 await assert.rejects(loadQuestionBank({fetcher:async()=>({ok:false}),crypto:webcrypto}),/could not be loaded/);
 await assert.rejects(sha256Text(raw,{}),/verification is unavailable/);
});

test('deterministic shuffled deck exhausts 120 IDs before repeating and survives reloads',()=>{
 const questions=bank(),storage=storageFixture(),all=[];let first,last;
 for(let i=0;i<12;i++){const current=deck(questions,{storage,rng:seeded(i+8)}),draw=current.draw();assert.equal(new Set(draw).size,10);all.push(...draw);if(i===0)first=draw;last=draw;}
 assert.equal(new Set(all).size,120);assert.equal(storage.writes.length,12);
 const next=deck(questions,{storage}).draw();assert.equal(next.length,10);assert.equal(next.filter(id=>last.includes(id)).length,0);
 assert.deepEqual(first,deck(questions,{rng:seeded(8)}).draw());
 assert.ok(storage.writes.every(write=>write.key===QUIZ_DECK_PREFIX+QUIZ_BANK_VERSION));
});

test('cycle-boundary draws remain unique without skipping unconsumed questions',()=>{
 for(const count of [100,103,107,119,120,131]){
  const questions=bank(count),current=deck(questions),sets=Array.from({length:35},()=>current.draw());
  for(const set of sets)assert.equal(new Set(set).size,10,`bank ${count}`);
  const flattened=sets.flat();for(let start=0;start+count<=flattened.length;start+=count)assert.equal(new Set(flattened.slice(start,start+count)).size,count,`full cycle ${count}`);
 }
 assert.throws(()=>deck(bank(9)).draw(),/draw size/);
});

test('no cards or storage writes are consumed by creating or inspecting a deck',()=>{
 const storage=storageFixture(),current=deck(bank(),{storage});assert.equal(current.getState().cursor,0);assert.equal(current.getState().cycle,0);assert.equal(storage.writes.length,0);
 const state=current.getState();state.order.push('bad');assert.deepEqual(current.getState().order,[]);
});

test('storage read/write failures use a continuous in-memory deck and never touch model keys',()=>{
 for(const mode of ['read','write']){
  const memory=new Map(),failures=new Set(),calls=[],storage={getItem(key){calls.push(key);if(mode==='read')throw Error('blocked');return null;},setItem(key){calls.push(key);throw Error('quota');}};
  const first=deck(bank(),{storage,memory,failures}).draw(),secondDeck=deck(bank(),{storage,memory,failures}),second=secondDeck.draw();
  assert.equal(secondDeck.getState().storageMode,'memory');assert.equal(first.filter(id=>second.includes(id)).length,0);assert.ok(calls.every(key=>key.startsWith(QUIZ_DECK_PREFIX)));
 }
});

test('corrupt and incompatible persisted permutations reset safely; bank versions remain separate',()=>{
 const questions=bank(),storage=storageFixture(),key=QUIZ_DECK_PREFIX+QUIZ_BANK_VERSION;
 for(const raw of ['{broken',JSON.stringify({schemaVersion:1}),JSON.stringify({...deck(questions).getState(),order:Array(120).fill('q-0')})]){
  storage.values.set(key,raw);const current=deck(questions,{storage});assert.equal(current.getState().warning,'reset');assert.equal(current.getState().storageMode,'saved');assert.equal(new Set(current.draw()).size,10);
 }
 const before=storage.values.get(key),updated=deck(questions,{storage,bankVersion:'a-new-bank-version'});updated.draw();assert.equal(storage.values.get(key),before);assert.ok(storage.values.has(QUIZ_DECK_PREFIX+'a-new-bank-version'));
});

test('option shuffling keeps identity, locks the first answer and returns defensive state copies',()=>{
 const questions=bank(),ids=deck(questions).draw(),session=createQuizSession(questions,ids,{rng:seeded(28)});
 assert.deepEqual(session.getState(),createQuizSession(questions,ids,{rng:seeded(28)}).getState());
 let shuffled=false;
 for(let i=0;i<10;i++){session.move(i);const {question,options}=session.current();assert.deepEqual([...options].sort(),['a','b','c','d']);shuffled||=options.join('')!=='abcd';assert.equal(session.answer(question.answer),true);assert.equal(session.answer(options.find(id=>id!==question.answer)),false);}
 assert.equal(shuffled,true);assert.equal(session.getState().score,10);assert.equal(session.getState().answered,10);
 const previous=session.getState();session.review();assert.equal(session.getState().index,0);assert.deepEqual(session.getState().answers,previous.answers);const copy=session.getState();copy.items[0].options.reverse();copy.answers[ids[0]]='z';assert.notDeepEqual(session.getState(),copy);
});

function startQuiz(){setLocale('en');const questions=bank(),document=minimalDocument(),current=deck(questions),controller=mountQuizView(document.root,{questions,deck:current,rng:seeded(9)});controller.startNewSet({focus:false});return {questions,document,root:document.root,get:selector=>document.root.querySelector(selector),controller,deck:current};}

test('quiz reveals option-specific feedback, explanation and sources only after an answer',()=>{
 const h=startQuiz(),state=h.controller.getState(),question=h.questions.find(question=>question.id===state.items[0].id);
 assert.equal(h.get('[data-quiz-action="new"]').className,'primary','New set uses the approved six-theme button tokens');
 assert.equal(h.get('[data-quiz-feedback]').textContent,'');assert.equal(h.get('[data-quiz-sources]').textContent,'');
 h.get(`[data-quiz-answer="${question.answer}"]`).click();assert.equal(h.controller.getState().score,1);assert.match(h.get('[data-quiz-feedback]').textContent,/Correct\./);assert.ok(h.get('[data-quiz-feedback]').textContent.includes(question.options.find(option=>option.id===question.answer).feedback.en));assert.ok(h.get('[data-quiz-feedback]').textContent.includes(question.explanation.en));
 assert.equal(h.get('[data-quiz-sources]').querySelector('a').getAttribute('href'),question.sources[0].url);assert.equal(h.get('[data-quiz-sources]').querySelector('a').getAttribute('rel'),'noopener noreferrer');
 assert.equal(h.get('[data-quiz-feedback]').getAttribute('aria-live'),'polite');assert.equal(h.get('[data-quiz-progress]').getAttribute('value'),'1');h.controller.destroy();
});

test('locale switches preserve questions, answers, randomized option order, control identity and focus',()=>{
 const h=startQuiz(),button=h.get('[data-quiz-answer]');button.click();button.focus();const state=h.controller.getState(),cursor=h.deck.getState().cursor,feedback=h.get('[data-quiz-feedback]');
 setLocale('zh-Hans');assert.deepEqual(h.controller.getState(),state);assert.equal(h.deck.getState().cursor,cursor);assert.equal(h.document.activeElement,button);assert.equal(h.get('[data-quiz-answer]'),button);assert.equal(h.get('[data-quiz-feedback]'),feedback);assert.match(h.get('[data-quiz-prompt]').textContent,/现值/);assert.match(h.get('[data-quiz-score]').textContent,/得分/);
 setLocale('en');assert.deepEqual(h.controller.getState(),state);h.controller.destroy();assert.deepEqual(Object.keys(en),Object.keys(zh));
});

test('next/previous, option keyboard focus, complete score and review never draw new cards',()=>{
 const h=startQuiz(),first=h.get('[data-quiz-answer]'),second=h.root.querySelectorAll('[data-quiz-answer]')[1];first.dispatch('keydown',{key:'ArrowRight'});assert.equal(h.document.activeElement,second);second.dispatch('keydown',{key:'Home'});assert.equal(h.document.activeElement,first);
 const ids=h.controller.getState().items.map(item=>item.id);
 for(let i=0;i<10;i++){const question=h.questions.find(question=>question.id===ids[i]);h.get(`[data-quiz-answer="${question.answer}"]`).click();if(i<9)h.get('[data-quiz-action="next"]').click();}
 assert.equal(h.controller.getState().score,10);assert.equal(h.get('[data-quiz-complete]').hidden,false);assert.equal(h.deck.getState().cursor,10);
 h.get('[data-quiz-action="review"]').click();assert.equal(h.controller.getState().index,0);assert.equal(h.controller.getState().answered,10);assert.equal(h.document.activeElement,h.get('[data-quiz-prompt]'));assert.equal(h.deck.getState().cursor,10);
 h.get('[data-quiz-action="new"]').click();assert.equal(h.controller.getState().answered,0);assert.equal(h.deck.getState().cursor,20);assert.equal(h.controller.getState().items.filter(item=>ids.includes(item.id)).length,0);h.controller.destroy();
});

test('stale question buttons, repeated mounts and destroyed views cannot change current answers',()=>{
 const h=startQuiz(),old=h.get('[data-quiz-answer]');h.get('[data-quiz-action="next"]').click();old.click();assert.equal(h.controller.getState().answered,0);
 const next=h.get('[data-quiz-action="next"]'),newController=mountQuizView(h.root,{questions:h.questions,deck:h.deck,rng:seeded()});newController.startNewSet();next.click();assert.equal(newController.getState().index,0);const current=h.get('[data-quiz-answer]');newController.destroy();current.click();assert.equal(newController.getState().answered,0);
});

test('workspace opens lazily; only explicit Learn activations and New 10 consume new sets',async()=>{
 const document=minimalDocument(),window=events(),storage=storageFixture();let loads=0;
 const controller=mountLearningWorkspace(document.root,lessons,{window,storage,loader:async()=>{loads++;return {questions:bank(),bankVersion:QUIZ_BANK_VERSION};},rng:seeded()});
 assert.equal(loads,0);assert.equal(storage.writes.length,0);assert.equal(controller.getState().quiz,null);
 window.emit({page:'learn',reason:'explicit'});await controller.whenIdle();assert.equal(loads,1);assert.equal(storage.writes.length,1);const first=controller.getState().quiz;
 window.emit({page:'learn',reason:'history'});window.emit({page:'learn',reason:'history'});setLocale('zh-Hans');setLocale('en');assert.deepEqual(controller.getState().quiz,first);assert.equal(storage.writes.length,1);
 window.emit({page:'learn',reason:'explicit'});assert.equal(storage.writes.length,2);assert.equal(controller.getState().quiz.answered,0);
 window.emit({page:'renewed',reason:'explicit'});window.emit({page:'learn',reason:'explicit'});assert.equal(storage.writes.length,3);
 assert.equal(controller.getState().examples.answers.length,6);controller.destroy();assert.equal(window.size('valuation:page-activate'),0);window.emit({page:'learn',reason:'explicit'});assert.equal(storage.writes.length,3);
});

test('deep-link first entry draws once and overlapping load/activation events each draw exactly once',async()=>{
 const document=minimalDocument(),window=events(),storage=storageFixture();let resolve;
 const controller=mountLearningWorkspace(document.root,lessons,{window,storage,initialPage:'learn',rng:seeded(),loader:()=>new Promise(done=>{resolve=done;})});
 await Promise.resolve();window.emit({page:'learn',reason:'history'});window.emit({page:'learn',reason:'explicit'});window.emit({page:'learn',reason:'explicit'});
 resolve({questions:bank(),bankVersion:QUIZ_BANK_VERSION});await controller.whenIdle();assert.equal(storage.writes.length,3);assert.equal(JSON.parse(storage.writes.at(-1).value).cursor,30);controller.destroy();
});

test('load/audit failure keeps original examples, supports retry and cleanup discards late results',async()=>{
 const document=minimalDocument(),window=events(),storage=storageFixture();let fails=true;
 const controller=mountLearningWorkspace(document.root,lessons,{window,storage,loader:async()=>{if(fails)throw Error('Audit mismatch');return {questions:bank(),bankVersion:QUIZ_BANK_VERSION};}});
 await controller.activate();assert.equal(controller.getState().status,'failure');assert.equal(storage.writes.length,0);assert.equal(document.root.querySelectorAll('[data-learn-answer]').length,3);fails=false;document.root.querySelector('[data-learning-retry]').click();await controller.whenIdle();assert.equal(storage.writes.length,1);controller.destroy();
 let resolve;const late=mountLearningWorkspace(document.root,lessons,{window,storage,loader:()=>new Promise(done=>{resolve=done;})});late.activate();await Promise.resolve();late.destroy();resolve({questions:bank(),bankVersion:QUIZ_BANK_VERSION});await late.whenIdle();assert.equal(storage.writes.length,1);
});

function navigationFixture(){
 const document=minimalDocument();document.root.innerHTML='<main><span id="breadcrumb"></span><button data-primary="learn" data-tab="learn"></button><button data-primary="studio"></button><section id="renewed" class="page"></section><section id="learn" class="page hidden"></section><div id="quizzes"></div></main>';
 const prototype=Object.getPrototypeOf(document.root);Object.defineProperty(prototype,'classList',{get(){const element=this;return {toggle(name,on){const classes=new Set((element.getAttribute('class')||'').split(/\s+/).filter(Boolean));if(on)classes.add(name);else classes.delete(name);element.setAttribute('class',[...classes].join(' '));},contains(name){return (element.getAttribute('class')||'').split(/\s+/).includes(name);}};}});
 document.getElementById=id=>document.root.querySelector('#'+id);document.body=document.root;
 const window=events(),location={hash:''},history={pushState(_state,_title,hash){location.hash=hash;}};
 return {document,window,location,history};
}

test('real navigation handlers dispatch one activation for a Learn button with both navigation attributes',async()=>{
 const old=globalThis.CustomEvent;globalThis.CustomEvent=class{constructor(type,{detail}){this.type=type;this.detail=detail;}};
 try{
  const h=navigationFixture(),navigation=mountWorkspaceNavigation(h),storage=storageFixture();
  const learning=mountLearningWorkspace(h.document.getElementById('quizzes'),lessons,{window:h.window,storage,initialPage:navigation.getPage(),loader:async()=>({questions:bank(),bankVersion:QUIZ_BANK_VERSION})});
  const click=()=>h.document.root.querySelector('[data-primary="learn"]').click();click();await learning.whenIdle();assert.equal(storage.writes.length,1);click();assert.equal(storage.writes.length,2);
  h.window.dispatchEvent({type:'popstate'});h.window.dispatchEvent({type:'hashchange'});assert.equal(storage.writes.length,2);learning.destroy();navigation.destroy();
 }finally{globalThis.CustomEvent=old;}
});

test('new Learn modules never import, write or run valuation engines; layouts keep page scrolling',()=>{
 for(const file of ['learn-bank.js','learn-deck.js','learn-quiz-view.js','learn-workspace.js']){
  const text=fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');assert.doesNotMatch(text,/from ['"][^'"]*(?:engine|current-model|research-model|simulation|guided)[^'"]*['"]|valuation-lab-cases|valuation-lab-annual-research|valuation:run|scrollIntoView|scrollTo\(/);
 }
 const css=fs.readFileSync(new URL('../dist/learn.css',import.meta.url),'utf8');assert.doesNotMatch(css,/overflow(?:-x|-y)?\s*:\s*(?:auto|scroll)/);assert.match(css,/@media\(max-width:600px\)/);assert.match(css,/outline:3px solid var\(--focus/);
});

test('new quiz sets preserve edited original-example controls and asynchronous navigation does not steal focus',async()=>{
 setLocale('en');const document=minimalDocument(),window=events(),storage=storageFixture();let resolve;
 const controller=mountLearningWorkspace(document.root,lessons,{window,storage,loader:()=>new Promise(done=>{resolve=done;})});
 const answer=document.root.querySelector('[data-learn-answer="1"]');answer.click();const range=document.root.querySelector('[data-learn-range="growth"]');range.value='4';range.oninput();const examples=controller.getState().examples;
 window.emit({page:'learn',reason:'explicit'});await Promise.resolve();window.emit({page:'renewed',reason:'explicit'});range.focus();resolve({questions:bank(),bankVersion:QUIZ_BANK_VERSION});await controller.whenIdle();
 assert.equal(document.activeElement,range);assert.deepEqual(controller.getState().examples,examples);window.emit({page:'learn',reason:'explicit'});assert.deepEqual(controller.getState().examples,examples);assert.equal(document.root.querySelector('[data-learn-range="growth"]'),range);assert.equal(storage.writes.length,2);controller.destroy();
});

test('each shuffled option retains its own feedback and an incorrect first answer cannot be rescored',()=>{
 for(const optionId of ['a','b','c','d']){
  const h=startQuiz(),state=h.controller.getState(),question=h.questions.find(question=>question.id===state.items[0].id),option=question.options.find(option=>option.id===optionId);
  h.get(`[data-quiz-answer="${optionId}"]`).click();assert.equal(h.get('[data-quiz-option-feedback]').textContent,option.feedback.en);assert.equal(h.controller.getState().score,Number(optionId===question.answer));
  if(optionId!==question.answer)assert.ok(h.get('[data-quiz-correct-answer]').textContent.includes(question.options.find(option=>option.id===question.answer).text.en));
  h.get(`[data-quiz-answer="${question.answer}"]`).click();assert.equal(h.controller.getState().answers[question.id],optionId);assert.equal(h.controller.getState().score,Number(optionId===question.answer));h.controller.destroy();
 }
});
