// Release evidence is byte-bound; this suite must pass before publication.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {loadQuestionBank,validateQuestionBank,validateQuizAudit,sha256Text,QUIZ_BANK_PATH,QUIZ_AUDIT_PATH} from '../dist/learn-bank.js';
import {createQuizDeck} from '../dist/learn-deck.js';
import {mountQuizView} from '../dist/learn-quiz-view.js';
import {setLocale,getMissingTranslations} from '../dist/i18n.js';
import en from '../dist/locales/learn-quiz.en.js';
import zh from '../dist/locales/learn-quiz.zh-Hans.js';
import {minimalDocument} from './research-workspace-harness.mjs';
const read=path=>fs.readFileSync(new URL('../dist/'+path.replace(/^\.\//,''),import.meta.url),'utf8');
const raw=read(QUIZ_BANK_PATH),questions=JSON.parse(raw),audit=JSON.parse(read(QUIZ_AUDIT_PATH));
const rng=(seed=17)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

test('shipped bank has at least 100 structurally sound bilingual questions and exact completed independent approval',async()=>{
 assert.equal(validateQuestionBank(questions).length,questions.length);
 validateQuizAudit(audit,questions,await sha256Text(raw,webcrypto));
 const loaded=await loadQuestionBank({crypto:webcrypto,fetcher:async path=>({ok:true,text:async()=>read(path),json:async()=>JSON.parse(read(path))})});assert.deepEqual(loaded.questions,questions);
 for(const question of questions){assert.ok(Object.hasOwn(en,question.topic));assert.ok(Object.hasOwn(zh,question.topic));assert.ok(Object.hasOwn(en,question.difficulty));assert.ok(Object.hasOwn(zh,question.difficulty));}
});

test('every shipped answer, feedback and source renders in both languages with stable identity and no pre-answer reveal',()=>{
 const document=minimalDocument(),root=document.root,deck=createQuizDeck({ids:questions.map(question=>question.id),bankVersion:audit.bankVersion,storage:null,memory:new Map(),failures:new Set(),rng:rng()}),controller=mountQuizView(root,{questions,deck,rng:rng(42)}),seen=new Set();
 for(let batch=0;batch<Math.ceil(questions.length/10);batch++){
  controller.startNewSet({focus:false});
  const items=controller.getState().items;
  for(let index=0;index<10;index++){
   const question=questions.find(question=>question.id===items[index].id);seen.add(question.id);
   assert.equal(root.querySelectorAll('.is-correct').length,0);assert.equal(root.querySelector('[data-quiz-feedback]').textContent,'');assert.equal(root.querySelector('[data-quiz-sources]').textContent,'');
   const correct=root.querySelector(`[data-quiz-answer="${question.answer}"]`);correct.click();correct.focus();const saved=controller.getState();
   for(const [locale,key]of [['en','en'],['zh-Hans','zhHans']]){
    setLocale(locale);assert.deepEqual(controller.getState(),saved);assert.equal(document.activeElement,correct);assert.equal(root.querySelector('[data-quiz-prompt]').textContent,question.prompt[key]);assert.equal(root.querySelector('[data-quiz-explanation]').textContent,question.explanation[key]);assert.equal(root.querySelector('[data-quiz-option-feedback]').textContent,question.options.find(option=>option.id===question.answer).feedback[key]);
    assert.equal(root.querySelector('[data-quiz-sources]').querySelectorAll('a').length,question.sources.length);
   }
   if(index<9)root.querySelector('[data-quiz-action="next"]').click();
  }
  assert.equal(controller.getState().score,10);
 }
 assert.equal(seen.size,questions.length);assert.equal(getMissingTranslations().filter(entry=>entry.key.startsWith('learn-quiz.')).length,0);controller.destroy();setLocale('en');
});
