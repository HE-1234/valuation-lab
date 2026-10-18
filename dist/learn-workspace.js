import {onLocaleChange} from './i18n.js';
import {mountLearning} from './learn-view.js';
import {loadQuestionBank} from './learn-bank.js';
import {createQuizDeck} from './learn-deck.js';
import {mountQuizView,quizCopy} from './learn-quiz-view.js';
const mounted=new WeakMap();
/** Explicit Learn activations draw; initial/history/programmatic navigation only ensures a set exists. */
export function mountLearningWorkspace(root,lessons,{window=globalThis.window,initialPage='renewed',loader=loadQuestionBank,storage,rng=Math.random}={}){
 if(!root?.querySelector)throw new TypeError('A learning workspace root is required.');
 mounted.get(root)?.destroy();
 let active=true,quiz=null,loading=null,pendingDraws=0,status='idle',page=initialPage;
 root.innerHTML='<p class="learn-session-note" data-learning-status role="status" aria-live="polite"></p><button type="button" class="quiet" data-learning-retry hidden></button><div data-learning-quiz></div><details class="panel learn-original-examples"><summary data-learning-examples-title></summary><p class="learn-session-note" data-learning-examples-note></p><div data-learning-examples></div></details>';
 const get=selector=>root.querySelector(selector),examples=mountLearning(get('[data-learning-examples]'),lessons);
 function refresh(){if(!active)return;get('[data-learning-status]').textContent=status?quizCopy(status):'';get('[data-learning-status]').hidden=!status;get('[data-learning-retry]').textContent=quizCopy('retry');get('[data-learning-retry]').hidden=status!=='failure';get('[data-learning-examples-title]').textContent=quizCopy('examples');get('[data-learning-examples-note]').textContent=quizCopy('examplesNote');}
 function drawPending(){if(!active||!quiz)return;while(pendingDraws>0){pendingDraws--;quiz.startNewSet({focus:page==='learn'});}status='';refresh();}
 function activate({explicit=false}={}){
  if(!active)return Promise.resolve(null);
  if(explicit)pendingDraws++;else if(!quiz?.getState()&&pendingDraws===0)pendingDraws=1;
  if(quiz){drawPending();return Promise.resolve(quiz);}
  if(loading)return loading;
  status='loading';refresh();
  loading=Promise.resolve().then(()=>loader()).then(({questions,bankVersion})=>{
   if(!active)return null;
   const deck=createQuizDeck({ids:questions.map(question=>question.id),bankVersion,...(storage===undefined?{}:{storage}),rng});
   quiz=mountQuizView(get('[data-learning-quiz]'),{questions,deck,rng});drawPending();return quiz;
  }).catch(()=>{if(active){status='failure';refresh();}return null;}).finally(()=>{loading=null;});
  return loading;
 }
 const onActivate=event=>{const detail=event.detail||{};page=detail.page;if(page==='learn')activate({explicit:detail.reason==='explicit'});};
 window?.addEventListener('valuation:page-activate',onActivate);
 get('[data-learning-retry]').onclick=()=>activate();
 const unlocalize=onLocaleChange(refresh);refresh();
 const controller={activate,getState:()=>({status,pendingDraws,quiz:quiz?.getState()||null,examples:examples.getState()}),whenIdle:()=>loading||Promise.resolve(quiz),destroy(){active=false;pendingDraws=0;unlocalize();window?.removeEventListener('valuation:page-activate',onActivate);quiz?.destroy();examples.destroy();}};
 mounted.set(root,controller);if(initialPage==='learn')activate();return controller;
}
