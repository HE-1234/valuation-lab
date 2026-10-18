import {registerCatalog,t,getLocale,onLocaleChange} from './i18n.js';
import en from './locales/learn-quiz.en.js';
import zh from './locales/learn-quiz.zh-Hans.js';
import {createQuizSession} from './learn-deck.js';
registerCatalog('learn-quiz',{en,'zh-Hans':zh});
export const quizCopy=(key,params={})=>t(`learn-quiz.${key}`,params);
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const local=value=>value[getLocale()==='en'?'en':'zhHans'];
const mounted=new WeakMap();let nextId=0;
export function mountQuizView(root,{questions,deck,rng=Math.random}={}){
 if(!root?.querySelector||!deck?.draw||!Array.isArray(questions))throw new TypeError('The quiz needs a root, a reviewed bank and a deck.');
 mounted.get(root)?.destroy();
 let active=true,session=null,renderToken=0,setNumber=0,announcement=null;const id=`quiz-${++nextId}`,get=selector=>root.querySelector(selector);
 root.innerHTML=`<section class="learn-course learn-random-quiz" aria-labelledby="${id}-title"><div class="learn-quiz-heading"><div><h2 id="${id}-title" data-quiz-copy="title"></h2><p data-quiz-description></p></div><button type="button" class="primary" data-quiz-action="new" data-quiz-copy="newSet"></button></div><div class="learn-progress"><div><span data-quiz-position></span><span data-quiz-progress-text></span><span data-quiz-score></span></div><progress data-quiz-progress max="10" value="0"></progress></div><article class="learn-card" data-quiz-card><div data-quiz-question></div><div class="learn-feedback" data-quiz-feedback role="status" aria-live="polite" aria-atomic="true"></div><div class="learn-quiz-sources" data-quiz-sources></div><div class="learn-footer"><button type="button" class="quiet" data-quiz-action="previous" data-quiz-copy="previous"></button><span data-quiz-hint></span><button type="button" data-quiz-action="next" data-quiz-copy="next"></button></div></article><section class="learn-quiz-complete" data-quiz-complete hidden><h3 data-quiz-copy="complete"></h3><p data-quiz-complete-detail></p><button type="button" class="quiet" data-quiz-action="review" data-quiz-copy="review"></button></section><p class="learn-session-note" data-quiz-storage></p><p class="learn-session-note" data-quiz-reset></p><span class="sr-only" data-quiz-live aria-live="polite" aria-atomic="true"></span></section>`;
 function refreshStatic(){for(const node of root.querySelectorAll('[data-quiz-copy]'))node.textContent=quizCopy(node.dataset.quizCopy);get('[data-quiz-description]').textContent=quizCopy('description',{count:questions.length});}
 // Retain the current announcement's identity; locale changes must not replay a new-set action.
 function refreshAnnouncement(){const node=get('[data-quiz-live]'),text=announcement?quizCopy(announcement.key,announcement.params):'';if(node.textContent!==text)node.textContent=text;}
 function announce(key,params){announcement={key,params:{...params}};refreshAnnouncement();}
 function progress(){
  const state=session?.getState();if(!state)return;
  get('[data-quiz-position]').textContent=quizCopy('question',{current:state.index+1});
  get('[data-quiz-progress-text]').textContent=quizCopy('progress',{answered:state.answered});
  get('[data-quiz-score]').textContent=quizCopy('score',state);
  get('[data-quiz-progress]').setAttribute('value',state.answered);get('[data-quiz-progress]').setAttribute('aria-label',quizCopy('progress',{answered:state.answered}));
  get('[data-quiz-hint]').textContent=quizCopy(session.current().answer===null?'hint':'answeredHint');
  get('[data-quiz-action="previous"]').disabled=state.index===0;get('[data-quiz-action="next"]').disabled=state.index===9;
  get('[data-quiz-complete]').hidden=state.answered!==10;get('[data-quiz-complete-detail]').textContent=quizCopy('completeDetail',state);
  const persistence=deck.getState();get('[data-quiz-storage]').textContent=quizCopy(persistence.storageMode==='saved'?'saved':'memory');get('[data-quiz-reset]').textContent=persistence.warning?quizCopy('reset'):'';
 }
 function refreshQuestion(){
  if(!session)return;const {question,answer}=session.current();
  get('[data-quiz-topic]').textContent=`${quizCopy(question.topic)} · ${quizCopy(question.difficulty)}`;
  get('[data-quiz-prompt]').textContent=local(question.prompt);
  for(const button of root.querySelectorAll('[data-quiz-answer]')){
   const option=question.options.find(item=>item.id===button.dataset.quizAnswer),chosen=option.id===answer,correct=option.id===question.answer,answered=answer!==null;
   button.querySelector('[data-quiz-option-text]').textContent=local(option.text);
   button.setAttribute('aria-pressed',String(chosen));button.setAttribute('aria-disabled',String(answered));
   button.setAttribute('class',`learn-answer${chosen?' is-selected':''}${answered&&correct?' is-correct':''}`);
   button.querySelector('[data-quiz-option-status]').textContent=answered?[...(chosen?[quizCopy('yourAnswer')]:[]),...(correct?[quizCopy('correctOption')]:[])].join(' · '):'';
  }
  if(answer!==null){
   const selected=question.options.find(option=>option.id===answer),correct=question.options.find(option=>option.id===question.answer),state=session.getState();
   get('[data-quiz-verdict]').textContent=quizCopy(answer===question.answer?'correct':'incorrect')+' '+quizCopy('score',state);
   get('[data-quiz-correct-answer]').textContent=answer===question.answer?'':quizCopy('correctAnswer',{answer:local(correct.text)});
   get('[data-quiz-option-feedback]').textContent=local(selected.feedback);get('[data-quiz-explanation-title]').textContent=quizCopy('explanation');get('[data-quiz-explanation]').textContent=local(question.explanation);get('[data-quiz-sources-title]').textContent=quizCopy('sources');
  }
  progress();
 }
 function showFeedback(){
  const {question,answer}=session.current();
  get('[data-quiz-feedback]').innerHTML=answer===null?'':'<p><strong data-quiz-verdict></strong></p><p data-quiz-correct-answer></p><p data-quiz-option-feedback></p><h3 data-quiz-explanation-title></h3><p data-quiz-explanation></p>';
  get('[data-quiz-sources]').innerHTML=answer===null?'':`<h3 data-quiz-sources-title></h3><ul>${question.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><span>${esc(source.section)}</span></li>`).join('')}</ul>`;
 }
 function renderQuestion(focus=false){
  const {options}=session.current(),token=++renderToken;
  get('[data-quiz-question]').innerHTML=`<p class="learn-topic" data-quiz-topic></p><h2 id="${id}-question" data-quiz-prompt tabindex="-1"></h2><div class="learn-options" role="group" aria-labelledby="${id}-question">${options.map((option,index)=>`<button type="button" class="learn-answer" data-quiz-answer="${option}" aria-pressed="false"><span class="learn-option-letter" aria-hidden="true">${String.fromCharCode(65+index)}</span><span class="learn-option-text"><span data-quiz-option-text></span><small data-quiz-option-status></small></span></button>`).join('')}</div>`;
  const buttons=[...root.querySelectorAll('[data-quiz-answer]')];
  for(const [index,button] of buttons.entries()){
   button.onclick=()=>{if(!active||token!==renderToken||!session.answer(button.dataset.quizAnswer))return;showFeedback();refreshQuestion();};
   button.onkeydown=event=>{if(!active||token!==renderToken)return;let target;if(event.key==='ArrowDown'||event.key==='ArrowRight')target=(index+1)%4;else if(event.key==='ArrowUp'||event.key==='ArrowLeft')target=(index+3)%4;else if(event.key==='Home')target=0;else if(event.key==='End')target=3;if(target!==undefined){event.preventDefault();buttons[target].focus({preventScroll:true});}};
  }
  showFeedback();refreshQuestion();if(focus)get('[data-quiz-prompt]').focus({preventScroll:true});
 }
 function startNewSet({focus=true}={}){if(!active)return false;session=createQuizSession(questions,deck.draw(10),{rng});renderQuestion(focus);announce('announced',{set:++setNumber});return true;}
 function navigate(delta){if(!active||!session)return;const next=session.getState().index+delta;if(session.move(next)){renderQuestion(true);announce('positionAnnouncement',{current:next+1});}}
 get('[data-quiz-action="new"]').onclick=()=>startNewSet();get('[data-quiz-action="previous"]').onclick=()=>navigate(-1);get('[data-quiz-action="next"]').onclick=()=>navigate(1);
 get('[data-quiz-action="review"]').onclick=()=>{if(active&&session){session.review();renderQuestion(true);announce('positionAnnouncement',{current:1});}};
 const unlocalize=onLocaleChange(()=>{if(active){refreshStatic();refreshQuestion();refreshAnnouncement();}});
 refreshStatic();
 const controller={startNewSet,getState:()=>session?.getState()||null,destroy(){active=false;renderToken++;unlocalize();}};mounted.set(root,controller);return controller;
}
