import {getLocale,onLocaleChange} from './i18n.js';
import {annualTextHTML} from './annual-localization.js';
import {incrementalRecord} from './incremental-registry.js';

// This is a presentation of the existing annual workspace. There is one set of
// inputs, one controller and one saved draft; no financial adapter or proxy case.
export const REVIEW_STEPS=Object.freeze([
 {id:'story',en:'Story',zh:'业务逻辑',panels:['notes'],prose:['summary','scope']},
 {id:'growth',en:'Growth',zh:'增长',panels:['annual'],group:'growth',prose:['growth']},
 {id:'profitability',en:'Profitability',zh:'盈利能力',panels:['annual'],group:'profitability',prose:['profitability','tax']},
 {id:'investment',en:'Investment',zh:'投资',panels:['annual'],group:'capital',prose:['capital','funding']},
 {id:'risk',en:'Risk',zh:'风险',panels:['annual','terminal','timing'],group:'capital',prose:['wacc','terminal']},
 {id:'equity',en:'Equity',zh:'普通股权益',panels:['claims'],prose:['claims']}
]);
export function guidedCompanyGroups(entries,legacyTickers){
 const legacy=new Set(legacyTickers);
 return {
  original:entries.filter(c=>legacy.has(c.ticker)),
  reviewed:entries.filter(c=>!legacy.has(c.ticker)&&c.readiness==='ready'),
  pending:entries.filter(c=>!legacy.has(c.ticker)&&c.readiness==='research-pending')
 };
}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(en,zh)=>getLocale()==='zh-Hans'?zh:en;
const label=step=>getLocale()==='zh-Hans'?step.zh:step.en;
const selectionKey='valuation-lab-guided-directory-selection-v1';

export function mountReviewedGuided({document=globalThis.document,window=globalThis.window,storage=globalThis.localStorage}={}){
 const page=document.querySelector('#current'),legacy=document.querySelector('#guided-app'),root=document.querySelector('#renewed-research-app'),api=root?.workspace;
 if(!page||!legacy?.chooseCompany||!legacy?.getCompanyDirectory||!api)return null;
 const annualHome=root.parentNode,anchor=document.createComment('Annual workspace home');
 annualHome.insertBefore(anchor,root);
 let groups,legacySet,allowed;
 function refreshDirectory(){
  const originals=legacy.getCompanyDirectory(),originalTickers=originals.map(c=>c.ticker);
  legacySet=new Set(originalTickers);
  const entries=[...originals,...api.getDirectory().filter(c=>!legacySet.has(c.ticker))];
  groups=guidedCompanyGroups(entries,originalTickers);allowed=new Map(entries.map(c=>[c.ticker,c]));
 }
 refreshDirectory();
 const directory=document.createElement('section');directory.className='guided-company-directory';
 const host=document.createElement('div');host.id='guided-reviewed-host';host.hidden=true;
 page.insertBefore(directory,legacy);page.appendChild(host);page.classList.add('guided-directory-mounted');
 let selected=document.querySelector('#current-company')?.value||groups.original[0]?.ticker,active=false,step='story',hiddenState=new Map(),panelSemantics=new Map(),destroyed=false;
 const stepsByCompany=new Map();
 try{const saved=storage?.getItem(selectionKey);if(allowed.has(saved))selected=saved;}catch{}
 const keep=()=>{try{storage?.setItem(selectionKey,selected);}catch{}};
 function options(query=''){
  const q=query.trim().toUpperCase();
  const matched=c=>!q||[c.ticker,c.company,...(c.aliases||[])].some(v=>String(v).toUpperCase().includes(q));
  return [['original',text('Original Guided cases','原有引导式案例')],['reviewed',text('Reviewed company models','已审阅公司模型')],['pending',text('Research pending','研究待完成')]].map(([key,title])=>{
   const rows=groups[key].filter(matched);
   return rows.length?`<optgroup label="${esc(title)}">${rows.map(c=>`<option value="${esc(c.ticker)}" ${c.ticker===selected?'selected':''}>${esc(c.ticker)} · ${esc(c.company)}</option>`).join('')}</optgroup>`:'';
  }).join('');
 }
 function renderDirectory(){
  directory.innerHTML=`<div><label for="guided-company-search">${text('Find a company','查找公司')}</label><input id="guided-company-search" type="search" autocomplete="off" placeholder="${text('Ticker or company name','股票代码或公司名称')}"></div><div><label for="guided-company-directory">${text('Company','公司')}</label><select id="guided-company-directory">${options()}</select></div><p id="guided-directory-status" role="status">${text('Reviewed models keep their own assumptions and dated evidence.','已审阅模型保留各自的假设和注明日期的证据。')}</p>`;
  const search=directory.querySelector('input'),select=directory.querySelector('select'),status=directory.querySelector('[role="status"]');
  select.value=selected;
  search.oninput=()=>{
   const markup=options(search.value);select.innerHTML=markup;select.disabled=!markup;
   // Filtering never selects a different company or writes a draft.
   select.value=selected;
   status.textContent=markup?text('Choose a company from the matching results.','从匹配结果中选择公司。'):text('No matching company.','没有匹配公司。');
  };
  search.onkeydown=e=>{if(e.key==='Enter'&&!select.disabled){e.preventDefault();if(select.value)choose(select.value);else select.focus();}};
  select.onchange=()=>choose(select.value);
 }
 function restoreHidden(){
  for(const [node,wasHidden] of hiddenState)node.hidden=wasHidden;
  hiddenState.clear();
 }
 function hide(node,value=true){if(!node)return;if(!hiddenState.has(node))hiddenState.set(node,node.hidden);node.hidden=value;}
 function resetReview(){
  api.setPresentation(null);restoreHidden();
  for(const [node,attrs] of panelSemantics)for(const [key,value] of Object.entries(attrs))value===null?node.removeAttribute(key):node.setAttribute(key,value);
  panelSemantics.clear();
  root.querySelectorAll('.guided-reviewed-nav,.guided-reviewed-context,.guided-reviewed-footer').forEach(node=>node.remove());
  root.removeAttribute('data-guided-review');root.removeAttribute('data-guided-step');
  root.querySelectorAll('[data-guided-phase]').forEach(node=>node.removeAttribute('data-guided-phase'));
 }
 function present(intent){
  if(!active||destroyed)return;
  if(intent?.editor==='claims'){step='equity';stepsByCompany.set(selected,step);}
  restoreHidden();
  root.setAttribute('data-guided-review','');root.setAttribute('data-guided-step',step);
  const state=api.getState(),shell=root.querySelector('.annual-workspace');
  if(!shell)return;
  root.querySelectorAll('.guided-reviewed-nav,.guided-reviewed-context,.guided-reviewed-footer').forEach(node=>node.remove());
  hide(root.querySelector('.catalog-picker'));
  hide(root.querySelector('.toolbar-model'));
  hide(root.querySelector('.workspace-mobile-tabs'));
  hide(root.querySelector('.annual-context-tabs'));
  hide(root.querySelector('.annual-editor-heading'));
  if(state.readiness==='research-pending')return;
  const definition=REVIEW_STEPS.find(s=>s.id===step),index=REVIEW_STEPS.indexOf(definition),editor=root.querySelector('#research-editor');
  if(!editor)return;
  if(!panelSemantics.has(editor))panelSemantics.set(editor,{role:editor.getAttribute('role'),'aria-labelledby':editor.getAttribute('aria-labelledby')});
  editor.setAttribute('role','tabpanel');editor.setAttribute('aria-labelledby',`guided-reviewed-${step}`);
  const nav=document.createElement('nav');nav.className='guided-reviewed-nav';nav.setAttribute('aria-label',text('Guided review steps','引导式审阅步骤'));
  nav.innerHTML=`${['UBER','MCD','NFLX'].includes(state.company.ticker)?`<div class="guided-allocation-prompt"><p>${text('Business value is available. To calculate value per share, choose how cash, investments, debts and other claims affect common shareholders. Review the June 30, 2026 assumptions below or enter your own. Blank amounts remain unknown; the dated illustrations are not current target prices.','经营价值已可计算。计算每股价值需要明确现金、投资、债务及其他请求权如何影响普通股股东。请审阅下方 2026 年 6 月 30 日假设或输入自己的假设。空白金额仍为未知；注明日期的示例不是当前目标价。')}</p><button type="button" data-review-allocation>${text('Choose assumptions for value per share','选择每股价值假设')}</button></div>`:''}<div class="guided-reviewed-intro"><b>${esc(state.company.ticker)} · ${text('Shape the business','构建业务假设')}</b><p>${text('These steps edit the same company-specific case as Year-by-year. Changes are shared between both views.','这些步骤与逐年模型编辑同一个公司专属案例。两个视图共享修改。')}</p></div><div role="tablist" aria-label="${text('Guided assumptions','引导式假设')}">${REVIEW_STEPS.map((s,i)=>`<button type="button" id="guided-reviewed-${s.id}" role="tab" data-review-step="${s.id}" aria-controls="research-editor" aria-selected="${s.id===step}" tabindex="${s.id===step?'0':'-1'}"><span>${i+1}</span> ${label(s)}</button>`).join('')}</div>`;
  shell.querySelector('.workspace-main').before(nav);
  const allocation=nav.querySelector('[data-review-allocation]');
  if(allocation)allocation.onclick=()=>{
   setStep('equity');
   const panel=root.querySelector('#annual-editor-panel-claims');
   panel?.scrollIntoView({block:'start',behavior:'auto'});
   panel?.querySelector('button')?.focus({preventScroll:true});
  };
  const buttons=[...nav.querySelectorAll('[data-review-step]')];
  buttons.forEach((button,i)=>{
   button.onclick=()=>setStep(button.dataset.reviewStep,true);
   button.onkeydown=e=>{const next=e.key==='ArrowRight'?(i+1)%6:e.key==='ArrowLeft'?(i+5)%6:e.key==='Home'?0:e.key==='End'?5:null;if(next===null)return;e.preventDefault();setStep(REVIEW_STEPS[next].id,true);};
  });
  const record=incrementalRecord(state.company.ticker),context=document.createElement('section');context.className='guided-reviewed-context';
  context.innerHTML=`<p class="eyebrow">${text('STEP','步骤')} ${index+1} / 6</p><h2>${label(definition)}</h2>${definition.prose.filter(k=>record?.prose[k]).map(k=>`<p>${annualTextHTML(record.prose[k].en)}</p>`).join('')}${record?`<a href="${esc(record.identity.reportPath)}" target="_blank" rel="noopener">${text('Company research and sources','公司研究与来源')} ↗</a>`:''}`;
  const required={
   UBER:text('Required inputs: common shares, additional shares from earned awards, option value, cash needed to run the business, investments, debt, finance leases, redeemable and nonredeemable minority interests, legal and tax claims, derivatives, commitments and other claims.','必填项：普通股股数、已赚取奖励新增股数、期权价值、经营所需现金、投资、债务、融资租赁、可赎回及不可赎回少数股东权益、法律及税务请求权、衍生品、承诺和其他请求权。'),
   MCD:text('Required inputs: finance lease claims, affiliate equity value, other nonoperating assets, minimum operating cash, existing award claims and other claims ahead of common shareholders.','必填项：融资租赁请求权、关联企业股权价值、其他非经营资产、最低经营现金、现有奖励请求权及普通股股东之前的其他请求权。'),
   NFLX:text('Required inputs: operating cash, debt value and its valuation basis; option volatility, remaining life and risk-free rate; RSU/PSU units; tax, Brazil, other and financing-derivative claims; existing award expense and its recognition date. The annual schedules also need existing award expense, retained future compensation, other operating costs and claim payments.','必填项：经营现金、债务价值及估值依据；期权波动率、剩余年限及无风险利率；RSU/PSU 单位；税务、巴西、其他及融资衍生品请求权；现有奖励费用及确认日期。年度明细还需现有奖励费用、保留的未来薪酬、其他经营成本及请求权支付。')
  };
  if(step==='equity'&&required[state.company.ticker])context.insertAdjacentHTML('beforeend',`<p>${required[state.company.ticker]}</p>`);
  if(step==='equity'&&state.company.ticker==='UBER')context.insertAdjacentHTML('beforeend',`<p>${text('The June 30 per-share calculation needs values for 14 inputs. The Careem investment amount is needed only for the optional October calculation. The illustration supplies analyst assumptions that you can inspect and edit below.','六月三十日每股计算需要 14 个输入值。Careem 投资金额仅在使用可选十月计算时需要。示例提供分析师假设，可在下方查看和编辑。')}</p>`);
  editor.prepend(context);
  // Existing controls and their handlers remain intact. Only visibility changes.
  root.querySelectorAll('[data-annual-editor-panel]').forEach(panel=>hide(panel,!definition.panels.includes(panel.dataset.annualEditorPanel)));
  root.querySelectorAll('.annual-assumption-group').forEach(group=>hide(group,group.getAttribute('aria-labelledby')!=='annual-group-'+definition.group));
  root.querySelectorAll('.margin-phase-controls,#annual-margin-overrides').forEach(node=>hide(node,step!=='profitability'));
  hide(root.querySelector('.annual-growth-horizon'),step!=='growth');
  const capital=root.querySelector('[aria-labelledby="annual-group-capital"]');
  capital?.querySelectorAll('.annual-proxy-grid > label').forEach(node=>hide(node,step==='risk'?!node.querySelector('[data-year-field="wacc"]'):!!node.querySelector('[data-year-field="wacc"]')));
  if(capital)hide(capital.querySelector('#annual-capital-diagnostics'),step==='risk');
  // Netflix's content-payment timing belongs with investment.
  const timing=root.querySelector('[data-nflx-content-timing]');
  if(timing)hide(timing.closest('.research-field-grid'),step!=='investment');
  hide(editor,false);
  const footer=document.createElement('div');footer.className='guided-reviewed-footer';
  footer.innerHTML=`<button type="button" data-review-back ${index===0?'disabled':''}>${text('Back','上一步')}</button><span>${index+1} / 6</span><button type="button" data-review-next>${index===5?text('Review forecast','查看预测'):text('Next','下一步')}</button>`;
  editor.appendChild(footer);
  footer.querySelector('[data-review-back]').onclick=()=>setStep(REVIEW_STEPS[index-1].id,true);
  footer.querySelector('[data-review-next]').onclick=()=>{if(index<5)setStep(REVIEW_STEPS[index+1].id,true);else{api.selectView('result');api.selectMobile('result');root.querySelector('#annual-view-result')?.focus({preventScroll:true});root.querySelector('#annual-path-result')?.scrollIntoView({block:'start',behavior:'auto'});}};
 }
 function setStep(next,focus=false){
  if(!REVIEW_STEPS.some(s=>s.id===next))return;
  step=next;stepsByCompany.set(selected,next);
  api.selectView('result');api.selectMobile('inputs');present();
  if(focus)root.querySelector(`#guided-reviewed-${step}`)?.focus({preventScroll:true});
 }
 function enter(){
  if(legacySet.has(selected)){leave();legacy.hidden=false;return;}
  active=true;legacy.hidden=true;host.hidden=false;host.appendChild(root);
  root.setAttribute('data-guided-review','');step=stepsByCompany.get(selected)||'story';
  api.setPresentation(present);
  const state=api.getState();
  if((state.company?.ticker||state.catalogCompany?.ticker)!==selected)api.choose(selected);
  else present();
 }
 function leave(){
  if(!active)return;
  active=false;resetReview();anchor.after(root);host.hidden=true;legacy.hidden=false;
  const state=api.getState();
  if(state.readiness==='ready'){api.selectEditor('annual');api.selectMobile('result');}
 }
 function choose(ticker){
  if(!allowed.has(ticker))return;
  selected=ticker;step=stepsByCompany.get(ticker)||'story';keep();
  if(legacySet.has(ticker)){leave();legacy.chooseCompany(ticker);}
  else enter();
  renderDirectory();
 }
 const activate=e=>{if(e.detail.page==='current')enter();else leave();};
 const legacyRendered=()=>{
  refreshDirectory();
  if(!active){const ticker=document.querySelector('#current-company')?.value;if(ticker&&legacySet.has(ticker)){selected=ticker;keep();}}
  renderDirectory();
 };
 const releaseLocale=onLocaleChange(()=>{renderDirectory();present();});
 window.addEventListener('valuation:page-activate',activate);
 window.addEventListener('valuation:guided-render',legacyRendered);
 renderDirectory();
 if(document.body.dataset.workspacePage==='current')enter();
 return {choose,getSelection:()=>selected,destroy(){leave();destroyed=true;releaseLocale();window.removeEventListener('valuation:page-activate',activate);window.removeEventListener('valuation:guided-render',legacyRendered);directory.remove();host.remove();anchor.remove();page.classList.remove('guided-directory-mounted');}};
}

if(typeof document!=='undefined'){
 let mounted=false;
 const start=()=>{if(mounted)return;const controller=mountReviewedGuided();if(controller){mounted=true;document.querySelector('#current').reviewedGuided=controller;}};
 window.addEventListener('valuation:annual-ready',start);
 window.addEventListener('valuation:guided-ready',start);
 start();
}
