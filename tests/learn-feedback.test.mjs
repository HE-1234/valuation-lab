// Minimal-DOM behavior tests, not browser layout or screen-reader certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {mountLearning} from '../dist/learn-view.js';
import {minimalDocument} from './research-workspace-harness.mjs';

// Use the original six questions shipped by the application, without duplicating
// or changing their answers in the new presentation module.
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const original=JSON.parse(JSON.stringify(vm.runInNewContext(app.match(/const questions=(\[[\s\S]*?\]);/)[1])));
const start=(questions=original)=>{
 const document=minimalDocument(),root=document.root,controller=mountLearning(root,questions);
 const get=selector=>root.querySelector(selector);
 const click=selector=>{const element=get(selector);assert.ok(element,`Missing ${selector}`);element.click();};
 const action=name=>click(`[data-learn-action="${name}"]`);
 const answer=value=>click(`[data-learn-answer="${value}"]`);
 const input=(key,value)=>{const element=get(`[data-learn-range="${key}"]`);element.value=String(value);element.oninput({target:element});};
 const select=(key,value)=>{const element=get(`[data-learn-select="${key}"]`);element.value=String(value);element.onchange({target:element});};
 const choice=(key,value)=>click(`[data-learn-choice="${key}"][data-value="${value}"]`);
 return {document,root,get,controller,action,answer,input,select,choice};
};

test('Learn opens on one focused original question, with visible unanswered progress',()=>{
 const h=start();
 assert.equal(original.length,6);
 assert.equal(h.root.querySelectorAll('h2').length,1);
 assert.equal(h.get('h2').textContent,original[0].q);
 assert.deepEqual(h.root.querySelectorAll('[data-learn-answer]').map(button=>button.querySelector('.learn-option-text').textContent),original[0].options);
 assert.equal(h.get('[data-learn-position]').textContent,'Question 01 of 06');
 assert.equal(h.get('[data-learn-progress-text]').textContent,'0 of 6 answered');
 assert.equal(h.get('[data-learn-progress]').getAttribute('value'),'0');
 assert.equal(h.get('[data-learn-progress]').getAttribute('max'),'6');
 assert.equal(h.get('[data-learn-action="previous"]').disabled,true);
 assert.equal(h.get('[data-learn-feedback]').textContent,'');
 assert.equal(h.get('[data-learn-exercise]').textContent,'');
 assert.equal(h.get('[data-learn-feedback]').getAttribute('aria-live'),'polite');
 assert.equal(h.get('[data-learn-feedback]').getAttribute('role'),'status');
 assert.equal(h.get('[data-learn-feedback]').getAttribute('aria-atomic'),'true');
});

test('Each original answer and explanation survives; feedback precedes the teaching interaction',()=>{
 const h=start(),feedback=h.get('[data-learn-feedback]');
 for(let index=0;index<original.length;index++){
  assert.equal(h.get('h2').textContent,original[index].q);
  assert.equal(h.root.querySelectorAll('h2').length,1);
  const wrong=(original[index].answer+1)%original[index].options.length;
  const selected=h.get(`[data-learn-answer="${wrong}"]`);selected.focus();h.answer(wrong);
  assert.equal(h.get('[data-learn-feedback]'),feedback,'live region remains mounted');
  assert.equal(h.document.activeElement,selected,'answering does not steal focus');
  assert.match(feedback.textContent,/Not quite/);
  assert.ok(feedback.textContent.includes(original[index].why));
  assert.ok(feedback.textContent.includes(original[index].options[original[index].answer]));
  assert.equal(h.get(`[data-learn-answer="${wrong}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(h.get(`[data-learn-answer="${original[index].answer}"]`).querySelector('[data-learn-answer-status]').textContent,'Correct answer');
  assert.match(h.get('[data-learn-exercise]').textContent,/Teaching example · never changes company inputs/);
  h.answer(original[index].answer);
  assert.equal(feedback.querySelector('strong').textContent,'Correct.');
  assert.ok(feedback.textContent.includes(original[index].why));
  assert.equal(h.get('[data-learn-progress]').getAttribute('value'),String(index+1));
  if(index<original.length-1)h.action('next');
 }
 assert.equal(h.get('[data-learn-action="next"]').disabled,true);
 assert.equal(h.get('[data-learn-progress-text]').textContent,'6 of 6 answered · All explored');
 assert.equal(h.get('[data-learn-navigation-hint]').textContent,'Review any answer.');
 assert.deepEqual(h.controller.getState().answers,original.map(question=>question.answer));
});

test('Previous/Next preserves answers and toy settings, allows skipping, and never scrolls',()=>{
 const h=start(),scrolls=[],focusOptions=[];
 // Any navigation focus must explicitly prevent scrolling.
 const query=h.root.querySelector.bind(h.root);
 h.root.querySelector=selector=>{const element=query(selector);if(element?.tag==='h2'&&!element.observed){const focus=element.focus.bind(element);element.focus=options=>{focusOptions.push(options);focus();};element.scrollIntoView=()=>scrolls.push(true);element.observed=true;}return element;};
 h.action('next');assert.equal(h.controller.getState().index,1);assert.equal(h.controller.getState().answered,0);
 h.answer(2);h.input('salesCapital',4);
 h.action('previous');h.answer(1);h.input('growth',4);h.select('roic',5);
 h.action('next');assert.equal(h.get('[data-learn-range="salesCapital"]').value,'4');assert.equal(h.get('[data-learn-value]').textContent,'70');
 h.action('previous');assert.equal(h.get('[data-learn-range="growth"]').value,'4');assert.equal(h.get('[data-learn-select="roic"]').value,'5');assert.equal(h.get('[data-learn-value]').textContent,'333.33');
 assert.equal(h.controller.getState().answered,2);
 h.action('previous');assert.equal(h.controller.getState().index,0);
 assert.ok(focusOptions.length>0);assert.ok(focusOptions.every(options=>options.preventScroll===true));assert.deepEqual(scrolls,[]);
});

test('Growth toy reproduces neutrality and below/above-hurdle value creation without replacing controls',()=>{
 const h=start();h.answer(1);
 const slider=h.get('[data-learn-range="growth"]'),exercise=h.get('[data-learn-exercise]');slider.focus();const writes=exercise.innerHTMLWrites;
 assert.equal(h.get('[data-learn-value]').textContent,'1,000');
 for(const growth of [0,2,4,5]){h.input('growth',growth);assert.equal(h.get('[data-learn-value]').textContent,'1,000');}
 h.select('roic',5);h.input('growth',2);assert.equal(h.get('[data-learn-value]').textContent,'750');
 h.input('growth',4);assert.equal(h.get('[data-learn-value]').textContent,'333.33');
 h.select('roic',20);assert.equal(h.get('[data-learn-value]').textContent,'1,333.33');
 assert.equal(h.get('[data-learn-range="growth"]'),slider);assert.equal(h.document.activeElement,slider);assert.equal(exercise.innerHTMLWrites,writes);
 assert.equal(slider.getAttribute('aria-valuetext'),'4%');
 h.answer(0);assert.equal(h.get('[data-learn-range="growth"]'),slider,'changing an answer keeps its toy intact');
});

test('Reinvestment toy computes FCFF and makes negative cash flow explicit',()=>{
 const h=start();h.action('next');h.answer(2);
 assert.equal(h.get('[data-learn-value]').textContent,'20');
 h.input('salesCapital',1);assert.equal(h.get('[data-learn-value]').textContent,'-80');assert.match(h.get('[data-learn-result]').textContent,/Negative FCFF/);
 h.input('salesCapital',4);assert.equal(h.get('[data-learn-value]').textContent,'70');
});

test('Model, information-timing, ownership and outcome toys respond to their own controls',()=>{
 const h=start();h.action('next');h.action('next');h.answer(1);
 assert.match(h.get('[data-learn-result]').textContent,/Start with equity cash flows/);
 h.choice('business','industrial');assert.match(h.get('[data-learn-result]').textContent,/Start with operating cash flows/);
 assert.equal(h.get('[data-learn-choice="business"][data-value="industrial"]').getAttribute('aria-pressed'),'true');
 h.action('next');h.answer(1);assert.match(h.get('[data-learn-result]').textContent,/February 1: filing unavailable/);
 h.choice('date','after');assert.match(h.get('[data-learn-result]').textContent,/March 16: filing available/);assert.match(h.get('[data-learn-result]').textContent,/no verified earlier disclosure/);
 h.action('next');h.answer(1);assert.equal(h.get('[data-learn-value]').textContent,'800');
 h.input('ownership',100);assert.equal(h.get('[data-learn-value]').textContent,'1,000');
 h.input('ownership',50);assert.equal(h.get('[data-learn-value]').textContent,'500');assert.match(h.get('[data-learn-result]').textContent,/proportional economic value/);
 h.action('next');h.answer(2);
 for(const price of ['up','down'])for(const forecast of ['close','miss']){h.choice('price',price);h.choice('forecast',forecast);assert.match(h.get('[data-learn-result]').textContent,/Strategy alpha: not established/);assert.match(h.get('[data-learn-result]').textContent,/out-of-sample evidence/);}
 h.choice('price','up');assert.match(h.get('[data-learn-result]').textContent,/strong return can accompany a weak forecast/);
});

test('Question content escapes safely and never mutates supplied questions or their options',()=>{
 const questions=[{q:'<img src=x onerror="bad()"> Which & why?',options:['<script>bad()</script>','"Right" & <safe>'],answer:1,why:'Because <svg onload="bad()"> & reasons.'}];
 const before=JSON.stringify(questions);Object.freeze(questions[0].options);Object.freeze(questions[0]);Object.freeze(questions);
 const h=start(questions);h.answer(0);
 assert.equal(h.get('h2').textContent,questions[0].q);
 assert.ok(h.get('[data-learn-feedback]').textContent.includes(questions[0].why));
 for(const tag of ['img','script','svg','safe'])assert.equal(h.root.querySelectorAll(tag).length,0);
 assert.equal(JSON.stringify(questions),before);
 const state=h.controller.getState();state.answers[0]=1;state.exercises[0].growth=500;
 assert.equal(h.controller.getState().answers[0],0);assert.equal(h.controller.getState().exercises[0].growth,2);
});

test('Repeated mounts and stale handlers cannot edit the current lesson',()=>{
 const h=start(),oldAnswer=h.get('[data-learn-answer="1"]'),oldNext=h.get('[data-learn-action="next"]');
 const newController=mountLearning(h.root,original);oldAnswer.click();oldNext.click();
 assert.equal(newController.getState().index,0);assert.equal(newController.getState().answered,0);
 const currentAnswer=h.get('[data-learn-answer="1"]');currentAnswer.click();assert.equal(newController.getState().answered,1);
 const staleAnswer=currentAnswer;h.action('next');staleAnswer.click();assert.equal(newController.getState().answered,1);
 newController.destroy();h.action('next');h.answer(2);assert.equal(newController.getState().index,1);assert.equal(newController.getState().answered,1);
});

test('Malformed controls remain finite; empty and invalid lesson inputs are handled explicitly',()=>{
 const h=start();h.answer(1);h.input('growth','NaN');h.select('roic',0);
 assert.equal(h.get('[data-learn-value]').textContent,'1,000');assert.doesNotMatch(h.get('[data-learn-result]').textContent,/NaN|Infinity/);
 h.input('growth',50);assert.equal(h.controller.getState().exercises[0].growth,5);
 const empty=start([]);assert.match(empty.root.textContent,/No learning questions/);assert.equal(empty.controller.getState().answered,0);
 assert.throws(()=>mountLearning(h.root,{}),/must be an array/);
 assert.throws(()=>mountLearning(h.root,[{q:'q',options:['A','B'],why:'why',answer:2}]),/valid answer/);
});

test('Learning module has no model, storage, network or forced-scroll dependency',()=>{
 const source=fs.readFileSync(new URL('../dist/learn-view.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../dist/learn.css',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\bimport\b|\blocalStorage\b|\bfetch\s*\(|\bscrollIntoView\b|\bscrollTo\b|\bwindow\b/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.ok([...css.matchAll(/font-size:(\d+)px/g)].every(match=>Number(match[1])>=13),'learning support typography is at least 13px');
 assert.match(css,/\.learn-answer\{[^}]*font-size:16px/);
 assert.match(css,/\.learn-feedback\{font-size:16px/);
 assert.match(css,/\.learn-exercise p\{font-size:15px/);
 assert.doesNotMatch(css,/\.learn-feedback:empty\{[^}]*display:none/,'empty live region must be present before feedback arrives');
});
