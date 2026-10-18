import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {mountLearning} from '../dist/learn-view.js';
import {setLocale,getMissingTranslations} from '../dist/i18n.js';
import en from '../dist/locales/learn.en.js';
import zh from '../dist/locales/learn.zh-Hant.js';
import {minimalDocument} from './research-workspace-harness.mjs';
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const questions=JSON.parse(JSON.stringify(vm.runInNewContext(source.match(/const questions=(\[[\s\S]*?\]);/)[1])));
test('Learning bilingual catalog includes every shipped question, answer and explanation',()=>{
 assert.deepEqual(Object.keys(en),Object.keys(zh));
 for(const question of questions)for(const text of [question.q,question.why,...question.options])assert.ok(Object.values(en).includes(text),text);
 for(const [key,text] of Object.entries(en))assert.deepEqual([...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),[...zh[key].matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort());
});
test('Learning switch preserves question, toy controls, answers and focused element through all six lessons',()=>{
 setLocale('en');const document=minimalDocument(),root=document.root,controller=mountLearning(root,questions),get=s=>root.querySelector(s);
 for(let index=0;index<questions.length;index++){
  get(`[data-learn-answer="${questions[index].answer}"]`).click();
  const input=get('[data-learn-range]');if(input){input.value=index===0?'4':index===1?'3':'65';input.oninput();}
  const select=get('[data-learn-select]');if(select){select.value='20';select.onchange();}
  const choice=get('[data-learn-choice]');if(choice)choice.click();
  const controls=root.querySelectorAll('input,select,button'),state=controller.getState(),before=root.textContent;
  const focus=get('[data-learn-answer]');focus.focus();
  setLocale('zh-Hant');
  assert.deepEqual(controller.getState(),state);
  assert.equal(document.activeElement,focus);
  assert.equal(get('[data-learn-range]'),input);
  assert.equal(get('[data-learn-select]'),select);
  assert.notEqual(root.textContent,before);assert.match(root.textContent,/教學範例/);
  assert.ok(!root.textContent.includes(questions[index].q));
  assert.equal(get('.learn-course').getAttribute('aria-label'),'估值學習題目');
  setLocale('en');assert.deepEqual(controller.getState(),state);assert.equal(root.textContent,before);
  if(index<5)get('[data-learn-action="next"]').click();
 }
 assert.equal(getMissingTranslations().filter(entry=>entry.key.startsWith('learn.')).length,0);
 controller.destroy();
});
test('Learning empty state translates and unregisters cleanly',()=>{
 setLocale('en');const document=minimalDocument(),controller=mountLearning(document.root,[]);
 setLocale('zh-Hant');assert.equal(document.root.textContent,'目前尚無學習題目。');controller.destroy();setLocale('en');
});
