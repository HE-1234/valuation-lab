// A standalone teaching surface. These examples never read or write company models.
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number=value=>Number(value).toLocaleString('en-US',{maximumFractionDigits:2});
const bound=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
const mounted=new WeakMap();
let nextId=0;
const topics=['Growth & value','Reinvestment','Choosing a model','Information timing','Ownership claims','Interpreting outcomes'];
const defaults=[{growth:2,roic:10},{salesCapital:2},{business:'bank'},{date:'before'},{ownership:80},{price:'up',forecast:'close'}];

function resultMarkup(index,state){
 if(index===0){
  const reinvestment=100*state.growth/state.roic,fcff=100-reinvestment,value=fcff/(.1-state.growth/100);
  return `<div class="learn-equation"><div><span>Reinvestment</span><b>${number(reinvestment)}</b></div><span aria-hidden="true">→</span><div><span>Next-year FCFF</span><b>${number(fcff)}</b></div><span aria-hidden="true">→</span><div><span>Operating value</span><b data-learn-value>${number(value)}</b></div></div><p>${state.roic===10?'At ROIC = WACC, changing growth leaves value at 1,000.':state.roic>10?'ROIC exceeds WACC: more growth creates value in this example.':'ROIC is below WACC: more growth destroys value in this example.'} Next-year NOPAT stays fixed at 100.</p><p class="learn-formula">Value = [100 × (1 − ${number(state.growth)}% / ${number(state.roic)}%)] / (10% − ${number(state.growth)}%)</p>`;
 }
 if(index===1){
  const reinvestment=200/state.salesCapital,fcff=120-reinvestment;
  return `<div class="learn-equation"><div><span>Operating income after tax</span><b>120</b></div><span aria-hidden="true">−</span><div><span>Reinvestment: 200 / ${number(state.salesCapital)}</span><b>${number(reinvestment)}</b></div><span aria-hidden="true">=</span><div><span>FCFF</span><b data-learn-value>${number(fcff)}</b></div></div><p>${fcff<0?'Growth uses more cash than this period generates. Negative FCFF here reflects that funding need.':'A higher sales-to-capital ratio means less new capital is needed for the same 200 of revenue growth.'}</p>`;
 }
 if(index===2){
  return state.business==='bank'?'<h4>Start with equity cash flows</h4><div class="learn-mechanism"><span>Credit losses</span><span>Required regulatory capital</span><span>Distributable equity cash flow</span></div><p>Deposits help fund the bank’s operations. Subtracting them in a generic industrial enterprise-to-equity bridge misses how that business works.</p>':'<h4>Start with operating cash flows</h4><div class="learn-mechanism"><span>Operating income after tax</span><span>Reinvestment</span><span>FCFF, then the claims bridge</span></div><p>For a suitable nonfinancial business, value operating cash flows first, then adjust for cash, debt and other claims to reach common equity.</p>';
 }
 if(index===3){
  return `<h4>${state.date==='before'?'February 1: filing unavailable':'March 16: filing available'}</h4><div class="learn-mechanism"><span>Jan 31 · period ends</span>${state.date==='before'?'<span>Feb 1 · too early</span><span>Mar 15 · report filed</span>':'<span>Mar 15 · report filed</span><span>Mar 16 · after publication</span>'}</div><p>${state.date==='before'?'The fiscal period is complete, but these annual-report numbers are not yet public. Exclude them from this information set.':'The filing can enter the information set after public availability. Keep the original filing vintage; do not quietly substitute a later restatement.'} This illustration assumes no verified earlier disclosure.</p>`;
 }
 if(index===4){
  const claim=1000*(100-state.ownership)/100,equity=1000-claim;
  return `<div class="learn-equation"><div><span>Consolidated operating value</span><b>1,000</b></div><span aria-hidden="true">−</span><div><span>Noncontrolling claim (${number(100-state.ownership)}%)</span><b>${number(claim)}</b></div><span aria-hidden="true">=</span><div><span>Parent’s common equity</span><b data-learn-value>${number(equity)}</b></div></div><p>Remove the outside owners’ claim once. Here, the subsidiary is the entire business, ownership has proportional economic value, and there is no cash, debt or other claim. In real cases, value the noncontrolling claim separately.</p>`;
 }
 if(index===5){
  const title=state.price==='up'?(state.forecast==='close'?'Two useful observations, still no proof of alpha':'A strong return can accompany a weak forecast'):(state.forecast==='close'?'A good forecast can accompany a poor return':'Both observations need review, for different reasons');
  return `<h4>${title}</h4><div class="learn-mechanism"><span>Price ${state.price==='up'?'outperforms':'underperforms'}</span><span>Forecast ${state.forecast==='close'?'close to':'misses'} actuals</span><span>Strategy alpha: not established</span></div><p>Forecast accuracy informs calibration. A price path also reflects new information and changing discount rates. Neither one-year outcome establishes model validity or strategy alpha; that needs broader, point-in-time, out-of-sample evidence.</p>`;
 }
 return '';
}

function exerciseMarkup(index,state,id){
 const range=(key,label,min,max,step,value,suffix='')=>`<label class="learn-control" for="${id}-${key}"><span>${label} <b data-learn-readout="${key}">${number(value)}${suffix}</b></span><input id="${id}-${key}" data-learn-range="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-valuetext="${number(value)}${suffix}"></label>`;
 const choices=(key,label,items)=>`<div class="learn-choice-control" role="group" aria-label="${esc(label)}"><span>${esc(label)}</span><div>${items.map(([value,text])=>`<button type="button" class="learn-toggle" data-learn-choice="${key}" data-value="${esc(value)}" aria-pressed="${state[key]===value}">${esc(text)}</button>`).join('')}</div></div>`;
 let title='',controls='';
 if(index===0){title='Make growth earn its keep';controls=`<p>Hold next-year NOPAT at 100 and WACC at 10%. Try a different growth rate, then change the return on new capital.</p>${range('growth','Stable growth',0,5,.5,state.growth,'%')}<label class="learn-control" for="${id}-roic"><span>Marginal ROIC</span><select id="${id}-roic" data-learn-select="roic">${[5,10,20].map(value=>`<option value="${value}"${state.roic===value?' selected':''}>${value}%${value===10?' · equals WACC':''}</option>`).join('')}</select></label>`;}
 if(index===1){title='Watch growth use cash';controls=`<p>Keep revenue growth at 200 and after-tax operating income at 120. Change how efficiently new capital produces sales.</p>${range('salesCapital','Incremental sales / capital',1,4,.5,state.salesCapital,'×')}`;}
 if(index===2){title='Match the model to the business';controls=choices('business','Business type',[['bank','Bank'],['industrial','Industrial business']]);}
 if(index===3){title='Move the information cutoff';controls=choices('date','Historical valuation date',[['before','February 1'],['after','March 16']]);}
 if(index===4){title='Separate the ownership claims';controls=`<p>Start with 1,000 of consolidated value. Change the parent’s ownership to see which value belongs to outside owners.</p>${range('ownership','Parent ownership',50,100,5,state.ownership,'%')}`;}
 if(index===5){title='Keep the evidence separate';controls=choices('price','One-year stock return',[['up','Outperforms'],['down','Underperforms']])+choices('forecast','Operating forecast compared with actuals',[['close','Close to actuals'],['miss','Misses actuals']]);}
 if(!title)return '';
 return `<section class="learn-exercise" aria-labelledby="${id}-exercise-title"><p class="learn-example-label">Teaching example · never changes company inputs</p><h3 id="${id}-exercise-title">${title}</h3><div class="learn-exercise-controls">${controls}</div><div class="learn-exercise-result" data-learn-result aria-live="polite" aria-atomic="true">${resultMarkup(index,state)}</div></section>`;
}

/** Mount a focused lesson. Progress and toy settings last for this mounted session. */
export function mountLearning(root,questions){
 if(!root||typeof root.querySelector!=='function')throw new TypeError('A learning root element is required.');
 if(!Array.isArray(questions))throw new TypeError('Learning questions must be an array.');
 const lessons=questions.map(question=>{
  if(!question||typeof question.q!=='string'||typeof question.why!=='string'||!Array.isArray(question.options)||question.options.length<2||question.options.some(option=>typeof option!=='string')||!Number.isInteger(question.answer)||question.answer<0||question.answer>=question.options.length)throw new TypeError('Every learning question needs text, options, a valid answer and an explanation.');
  return {...question,options:[...question.options]};
 });
 mounted.get(root)?.destroy();
 let active=true,index=0,exerciseIndex=null;
 const answers=lessons.map(()=>null),exercises=lessons.map((_,i)=>({...defaults[i]})),id=`learn-${++nextId}`;
 const get=selector=>root.querySelector(selector);
 const getState=()=>({index,answers:[...answers],exercises:exercises.map(state=>({...state})),answered:answers.filter(answer=>answer!==null).length});
 const controller={getState,destroy(){active=false;}};
 mounted.set(root,controller);
 if(!lessons.length){root.innerHTML='<p class="learn-empty">No learning questions are available yet.</p>';return controller;}
 root.innerHTML=`<section class="learn-course" aria-label="Valuation learning questions"><div class="learn-progress"><div><span data-learn-position></span><span data-learn-progress-text></span></div><progress data-learn-progress max="${lessons.length}" value="0" aria-label="Questions answered"></progress></div><article class="learn-card"><div data-learn-question></div><div class="learn-feedback" data-learn-feedback role="status" aria-live="polite" aria-atomic="true"></div><div data-learn-exercise></div><div class="learn-footer"><button type="button" class="quiet" data-learn-action="previous">← Previous</button><span data-learn-navigation-hint></span><button type="button" data-learn-action="next">Next question →</button></div></article><p class="learn-session-note">Explore at your own pace. Answers stay here while this page is open.</p></section>`;

 function progress(){
  const count=answers.filter(answer=>answer!==null).length;
  get('[data-learn-position]').textContent=`Question ${String(index+1).padStart(2,'0')} of ${String(lessons.length).padStart(2,'0')}`;
  get('[data-learn-progress-text]').textContent=`${count} of ${lessons.length} answered${count===lessons.length?' · All explored':''}`;
  get('[data-learn-progress]').setAttribute('value',count);
  get('[data-learn-navigation-hint]').textContent=count===lessons.length?'Review any answer.':answers[index]===null?'Choose an answer to explore.':'Try the example, then keep going.';
  get('[data-learn-action="previous"]').disabled=index===0;
  get('[data-learn-action="next"]').disabled=index===lessons.length-1;
 }
 function updateAnswer(){
  const question=lessons[index],selected=answers[index],answered=selected!==null;
  for(const button of root.querySelectorAll('[data-learn-answer]')){
   const option=Number(button.dataset.learnAnswer),chosen=option===selected;
   button.setAttribute('aria-pressed',chosen);
   button.setAttribute('class',`learn-answer${chosen?' is-selected':''}${answered&&option===question.answer?' is-correct':''}`);
   button.querySelector('[data-learn-answer-status]').textContent=answered?(option===question.answer?(chosen?'Your answer · Correct':'Correct answer'):chosen?'Your answer':''):'';
  }
  get('[data-learn-feedback]').innerHTML=answered?`<p><strong>${selected===question.answer?'Correct.':'Not quite.'}</strong> ${selected===question.answer?'':`The correct answer is “${esc(question.options[question.answer])}” `}${esc(question.why)}</p>`:'';
  if(answered&&exerciseIndex!==index)showExercise();
  progress();
 }
 function showExercise(){
  exerciseIndex=index;
  const questionIndex=index,host=get('[data-learn-exercise]'),state=exercises[index];
  host.innerHTML=exerciseMarkup(index,state,id);
  const updateResult=()=>{if(active&&index===questionIndex)get('[data-learn-result]').innerHTML=resultMarkup(index,state);};
  for(const input of host.querySelectorAll('[data-learn-range]'))input.oninput=()=>{
   if(!active||index!==questionIndex)return;
   const key=input.dataset.learnRange,limits={growth:[0,5,2],salesCapital:[1,4,2],ownership:[50,100,80]}[key];
   state[key]=bound(input.value,...limits);
   const suffix=key==='salesCapital'?'×':'%';
   host.querySelector(`[data-learn-readout="${key}"]`).textContent=number(state[key])+suffix;
   input.setAttribute('aria-valuetext',number(state[key])+suffix);updateResult();
  };
  const select=host.querySelector('[data-learn-select="roic"]');
  if(select)select.onchange=()=>{if(!active||index!==questionIndex)return;state.roic=[5,10,20].includes(Number(select.value))?Number(select.value):10;updateResult();};
  for(const button of host.querySelectorAll('[data-learn-choice]'))button.onclick=()=>{
   if(!active||index!==questionIndex)return;
   const key=button.dataset.learnChoice;state[key]=button.dataset.value;
   for(const sibling of host.querySelectorAll(`[data-learn-choice="${key}"]`))sibling.setAttribute('aria-pressed',sibling===button);
   updateResult();
  };
 }
 function renderQuestion(focus=false){
  const question=lessons[index],questionIndex=index;
  get('[data-learn-question]').innerHTML=`<p class="learn-topic">${esc(topics[index]||'Valuation practice')}</p><h2 id="${id}-question" tabindex="-1">${esc(question.q)}</h2><div class="learn-options" role="group" aria-labelledby="${id}-question">${question.options.map((option,answer)=>`<button type="button" class="learn-answer" data-learn-answer="${answer}" aria-pressed="false"><span class="learn-option-letter" aria-hidden="true">${String.fromCharCode(65+answer)}</span><span class="learn-option-text">${esc(option)}<small data-learn-answer-status></small></span></button>`).join('')}</div>`;
  get('[data-learn-exercise]').innerHTML='';exerciseIndex=null;
  for(const button of root.querySelectorAll('[data-learn-answer]'))button.onclick=()=>{if(!active||index!==questionIndex)return;answers[index]=Number(button.dataset.learnAnswer);updateAnswer();};
  updateAnswer();
  if(focus)get(`#${id}-question`).focus({preventScroll:true});
 }
 get('[data-learn-action="previous"]').onclick=()=>{if(active&&index>0){index--;renderQuestion(true);}};
 get('[data-learn-action="next"]').onclick=()=>{if(active&&index<lessons.length-1){index++;renderQuestion(true);}};
 renderQuestion();
 return controller;
}
