// "My valuations" window shared by Guided and Year-by-year.
import {registerCatalog,t,localizedText,getLocale,onLocaleChange,escapeLocalizedText as esc} from './i18n.js';
import {displayNumber} from './number-display.js';
import {loadMyValuations,myValuationsState,onMyValuationsChange,valuationsFor,loadValuationDraft,saveValuation,deleteValuation,setDefaultValuation,renameValuation} from './my-valuations.js';

const copy={
 button:['My valuations','我的估值'],title:['My valuations · {ticker}','我的估值 · {ticker}'],
 intro:['Saved versions are files in this project (dist/data/my-valuations/). The default one opens when you launch the site.','已保存的版本是本项目中的文件（dist/data/my-valuations/）。默认版本会在启动网站时自动打开。'],
 name:['Name','名称'],placeholder:['e.g. Base case, Bull, Bear','例如：基准、乐观、悲观'],makeDefault:['Open this by default','设为默认打开'],
 save:['Save current valuation','保存当前估值'],saving:['Saving…','正在保存…'],saved:['Saved “{name}”.','已保存“{name}”。'],
 readOnly:['Saving writes files to this project, so it needs the dev server. Start the site with: python3 .claude/serve-dev.py 8090','保存会把文件写入本项目，因此需要开发服务器。请用以下命令启动网站：python3 .claude/serve-dev.py 8090'],
 none:['No saved versions for {ticker} yet.','{ticker} 还没有已保存的版本。'],
 open:['Open','打开'],opened:['Opened “{name}”.','已打开“{name}”。'],defaultBadge:['Default','默认'],setDefault:['Make default','设为默认'],unsetDefault:['Remove default','取消默认'],
 rename:['Rename','重命名'],renameSave:['Save name','保存名称'],delete:['Delete','删除'],confirmDelete:['Confirm delete','确认删除'],deleted:['Deleted “{name}”.','已删除“{name}”。'],
 close:['Close','关闭'],perShare:['{value} {currency} / share','{value} {currency}／股'],savedAt:['Saved {date}','保存于 {date}'],
 error:['Could not complete that: {message}','无法完成操作：{message}'],unsaved:['Changes since “{name}” are not saved to the file yet.','自“{name}”以来的修改尚未保存到文件。']
};
registerCatalog('myValuations',{en:Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[0]])),'zh-Hans':Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[1]]))});
const l=(key,p={})=>t('myValuations.'+key,p);
const when=iso=>{const d=new Date(iso);return Number.isFinite(d.getTime())?d.toLocaleString(getLocale()==='zh-Hans'?'zh-CN':'en-US',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';};

export function myValuationsButtonHTML(){return `<button type="button" class="quiet" data-myval-open>${localizedText('myValuations.button')}<span class="myval-count" data-myval-count></span></button>`;}

/**
 * Wire the button(s) inside root to a window for this model.
 * context() returns {ticker, baseId, baseLabel, perShare, currency, draft} for the current valuation;
 * open(row, draft) loads a saved version into the page.
 */
export function mountMyValuations({model,root,context,open}){
 const doc=globalThis.document;if(typeof doc?.getElementById!=='function'||typeof doc.createElement!=='function'||!doc.body)return;
 let dialog=document.getElementById('myval-'+model),status='',confirming=null,renaming=null;
 if(!dialog){dialog=document.createElement('dialog');dialog.id='myval-'+model;dialog.className='myval-dialog';document.body.appendChild(dialog);}
 dialog._myval={model,context,open,root};
 const counts=()=>{const {context,root}=dialog._myval,ctx=safe(context);root.querySelectorAll('[data-myval-count]').forEach(n=>{const k=ctx?valuationsFor(model,ctx.ticker).length:0;n.textContent=k?` · ${k}`:'';});};
 function render(){
  const {context:ctxFn}=dialog._myval,ctx=safe(ctxFn),state=myValuationsState();if(!ctx){dialog.innerHTML='';return;}
  const rows=valuationsFor(model,ctx.ticker),suggest=`${ctx.baseLabel||''}`.trim();
  dialog.innerHTML=`<form method="dialog" class="myval-head"><h2>${esc(l('title',{ticker:ctx.ticker}))}</h2><button class="quiet myval-close" value="close" aria-label="${esc(l('close'))}">×</button></form>
<p class="micro">${esc(l('intro'))}</p>
<div class="myval-save"><label for="myval-name-${model}">${esc(l('name'))}</label><input id="myval-name-${model}" type="text" maxlength="80" placeholder="${esc(l('placeholder'))}" value="${esc(suggest)}" ${state.writable?'':'disabled'}>
<label class="myval-check"><input type="checkbox" data-myval-default ${rows.length?'':'checked'} ${state.writable?'':'disabled'}> ${esc(l('makeDefault'))}</label>
<button type="button" class="primary" data-myval-save ${state.writable?'':'disabled'}>${esc(l('save'))}</button>
${state.writable?'':`<p class="micro myval-readonly">${esc(l('readOnly'))}</p>`}</div>
<p class="micro myval-status" role="status">${esc(status)}</p>
<ul class="myval-list">${rows.length?rows.map(r=>`<li data-id="${esc(r.id)}"><div class="myval-row-main">${renaming===r.id?`<input type="text" maxlength="80" value="${esc(r.name)}" data-myval-rename-input>`:`<b>${esc(r.name)}</b>`}${r.default?`<span class="myval-badge">${esc(l('defaultBadge'))}</span>`:''}<span class="micro">${esc(r.baseLabel||r.baseId||'')}${Number.isFinite(r.perShare)?' · '+esc(l('perShare',{value:displayNumber(r.perShare,2),currency:r.currency||''})):''} · ${esc(l('savedAt',{date:when(r.savedAt)}))}</span></div>
<div class="myval-row-actions"><button type="button" class="quiet" data-myval-act="open">${esc(l('open'))}</button>${state.writable?`<button type="button" class="quiet" data-myval-act="default">${esc(l(r.default?'unsetDefault':'setDefault'))}</button><button type="button" class="quiet" data-myval-act="${renaming===r.id?'rename-save':'rename'}">${esc(l(renaming===r.id?'renameSave':'rename'))}</button><button type="button" class="quiet${confirming===r.id?' myval-danger':''}" data-myval-act="delete">${esc(l(confirming===r.id?'confirmDelete':'delete'))}</button>`:''}</div></li>`).join(''):`<li class="micro">${esc(l('none',{ticker:ctx.ticker}))}</li>`}</ul>`;
  bind(rows);
 }
 async function act(fn){try{await fn();}catch(e){status=l('error',{message:e.message==='not-writable'?l('readOnly'):e.message});}render();counts();}
 function bind(rows){
  dialog.querySelector('[data-myval-save]')?.addEventListener('click',()=>act(async()=>{
   const ctx=safe(dialog._myval.context),name=dialog.querySelector(`#myval-name-${model}`).value.trim()||ctx.baseLabel||'Valuation';
   status=l('saving');render();
   await saveValuation({model,ticker:ctx.ticker,name,baseId:ctx.baseId,baseLabel:ctx.baseLabel,perShare:ctx.perShare,currency:ctx.currency,isDefault:dialog.querySelector('[data-myval-default]')?.checked,draft:ctx.draft});
   status=l('saved',{name});
  }));
  dialog.querySelectorAll('[data-myval-act]').forEach(button=>button.addEventListener('click',()=>{
   const row=rows.find(r=>r.id===button.closest('li').dataset.id),kind=button.dataset.myvalAct;if(!row)return;
   if(kind==='open')return act(async()=>{const draft=await loadValuationDraft(row);dialog._myval.open(row,draft);status=l('opened',{name:row.name});dialog.close();});
   if(kind==='default')return act(()=>setDefaultValuation(row.id,!row.default));
   if(kind==='rename'){renaming=row.id;confirming=null;render();dialog.querySelector('[data-myval-rename-input]')?.focus();return;}
   if(kind==='rename-save'){const name=dialog.querySelector('[data-myval-rename-input]')?.value;renaming=null;return act(()=>renameValuation(row.id,name));}
   if(kind==='delete'){if(confirming!==row.id){confirming=row.id;render();return;}confirming=null;return act(async()=>{await deleteValuation(row.id);status=l('deleted',{name:row.name});});}
  }));
 }
 root.querySelectorAll('[data-myval-open]').forEach(button=>button.onclick=async()=>{status='';confirming=null;renaming=null;await loadMyValuations();render();if(!dialog.open)dialog.showModal();});
 if(!dialog._bound){dialog._bound=true;onMyValuationsChange(()=>{dialog._counts();if(dialog.open)dialog._render();});onLocaleChange(()=>{if(dialog.open)dialog._render();});}
 dialog._render=render;dialog._counts=counts;
 loadMyValuations().then(counts);counts();
}
function safe(fn){try{return fn();}catch{return null;}}
