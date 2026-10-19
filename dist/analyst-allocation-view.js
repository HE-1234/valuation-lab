// Isolated presentation for explicitly selected analyst capital assumptions.
import {registerCatalog,localizedText,getLocale,t,escapeLocalizedText as esc} from './i18n.js';
import {displayNumber,precisionInputAttributes,readPrecisionInput,bindPrecisionInput} from './number-display.js';
import {calculateResearchOperating,researchTimingResult} from './research-model.js';
import {getAnalystAllocationDefinition,createAnalystAllocationState,calculateAnalystAllocation} from './analyst-conditional-allocation.js';
import {nvmiConditionalResult} from './nvmi-conditional-view.js';
const copy={
 compactScope:['Dated assumptions; not a current price target.','历史时点假设；不是当前目标股价。'],shareUnit:['share','股'],title:['Explicit conditional allocation','显式条件价值分配'],open:['Open conditional calculator','打开条件估值计算器'],edit:['Edit conditional assumptions','编辑条件假设'],nvmi:['Open NVMI conditional allocation','打开 NVMI 条件价值分配'],enable:['Use explicit assumptions','使用显式假设'],off:['Keep operating EV only','仅保留营业企业价值'],illustration:['Load published illustration · unmeasured assumptions','载入已发表示例 · 未经计量的假设'],reset:['Reset allocation inputs','重置分配输入'],unknown:['Required assumption unknown; blank is not zero.','所需假设未知；空白不等于零。'],basis:['Origin {origin} · Capital {capital} · Shares {shares} · Information {information}','估值基准 {origin} · 资本 {capital} · 股数 {shares} · 信息截止 {information}'],
 scope:['Separate analyst scenario. The reviewed common-equity gate remains unchanged. This is not a current intrinsic price or a verified complete claim appraisal.','独立分析师情景。经审阅的普通股估值限制保持不变。这不是当前内在股价，也不是已核实的完整索偿估值。'],assumptions:['All editable values are explicit assumptions or dated proxies. An entered zero is an assumed zero, not verified absence. Amounts are USD millions; shares are millions.','所有可编辑数值均为显式假设或历史时点代理值。输入零表示假设为零，并非已核实不存在。金额单位为百万美元；股数单位为百万股。'],mc:['Monte Carlo remains operating-EV only for this calculator. Claims are not repriced per trial; no conditional common-share distribution is implied.','此计算器的蒙特卡洛仍仅计算营业企业价值。索偿不在每次试验中重新定价；不代表条件普通股价值分布。'],funding:['Future investment and funding deficits already enter operating FCFF. Do not add future financing cash or deduct the deficit again.','未来投资及资金缺口已计入营业自由现金流。不要另加未来融资现金，也不要重复扣除资金缺口。'],
 selected:['SELECTED ANALYST ALLOCATION','所选分析师分配'],value:['Conditional allocation · USD / share','条件分配 · 美元／股'],signed:['Signed residual · USD / share','带正负号剩余值 · 美元／股'],negative:['No positive common residual under these assumptions. The signed diagnostic is not a zero-dollar stock valuation.','在这些假设下不存在正的普通股剩余价值。带正负号的诊断值不代表股价为零。'],missing:['Complete the named assumptions to calculate a conditional allocation.','请填写列出的假设以计算条件价值分配。'],invalid:['These inputs or dates cannot support this allocation. Correct them; the retained draft is unchanged.','这些输入或日期无法支持此分配。请修正；已保留的草稿不变。'],disabled:['A dated conditional calculator is available. Choose explicit assumptions to see a separate allocation.','可使用历史时点条件计算器。选择显式假设后可查看独立分配结果。'],sources:['Dated sources and method','历史时点来源与方法'],source:['Source {number}','来源 {number}'],note:['Optional assumption note','可选假设说明'],pool:['Signed residual pool · USD m','带正负号剩余价值池 · 百万美元'],shares:['Allocation units · million shares','分配单位 · 百万股'],ev:['Selected operating EV · USD m','所选营业企业价值 · 百万美元'],reviewed:['Reviewed common-equity output remains separately gated.','经审阅的普通股结果仍受到独立限制。'],
};
registerCatalog('analystAllocation',{en:Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[0]])),'zh-Hans':Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[1]]))});
const l=(key,p={})=>localizedText('analystAllocation.'+key,p),n=x=>displayNumber(x,2),finite=x=>typeof x==='number'&&Number.isFinite(x);
const pair=x=>Array.isArray(x)?`<span data-analyst-copy-en="${esc(x[0])}" data-analyst-copy-zh="${esc(x[1]??x[0])}">${esc(x[getLocale()==='zh-Hans'?1:0]??x[0])}</span>`:esc(x??'');
export function refreshAnalystAllocationLocale(root){root.querySelectorAll('[data-i18n]').forEach(node=>{if(node.dataset.i18n?.startsWith('analystAllocation.')){let params={};try{params=JSON.parse(node.dataset.i18nParams||'{}');}catch{}node.textContent=t(node.dataset.i18n,params);}});root.querySelectorAll('[data-analyst-copy-en]').forEach(node=>{node.textContent=getLocale()==='zh-Hans'?node.dataset.analystCopyZh:node.dataset.analystCopyEn;});}
export function analystAllocationResult(d){
 if(!getAnalystAllocationDefinition(d?.ticker)||d.analystConditionalAllocation?.enabled!==true)return null;
 try{return calculateAnalystAllocation(d,researchTimingResult(d,calculateResearchOperating(d)),d.analystConditionalAllocation);}catch(error){return {status:'invalid',perShare:null,errors:[error.message],missing:[]};}
}
export function analystAllocationOutputHTML(d,{compact=false}={}){
 const definition=getAnalystAllocationDefinition(d?.ticker);if(!definition)return '';
 const r=analystAllocationResult(d);if(!r)return `<p class="micro">${l('disabled')}</p>`;
 if(r.status==='incomplete'||r.status==='invalid'){
  const missing=(r.missing||[]).map(key=>definition.fields.find(f=>f.key===(typeof key==='string'?key:key.key))).filter(Boolean);
  return `<p class="research-warning">${l(r.status==='invalid'?'invalid':'missing')}</p>${missing.length?`<ul>${missing.map(f=>`<li>${pair(f.label)}</li>`).join('')}</ul>`:''}${r.errors?.length?`<p class="micro">${r.errors.map(pair).join(' ')}</p>`:''}`;
 }
 const positive=finite(r.perShare)&&r.status!=='no-positive-common';
 return `<span class="eyebrow">${l('selected')}</span><p class="research-equity-value">${n(positive?r.perShare:r.signedResidualPerShare)} <small>USD / ${l('shareUnit')}</small></p><p class="micro">${l(positive?'value':'signed')}</p>${!positive?`<p class="research-warning">${l('negative')}</p>`:''}<p class="micro">${esc(r.origin||definition.origin)} · ${l(compact?'compactScope':'scope')}</p>${compact?'':`<dl><dt>${l('ev')}</dt><dd>${n(r.operatingEV)}</dd><dt>${l('pool')}</dt><dd>${n(r.signedResidual)}</dd><dt>${l('shares')}</dt><dd>${n(r.allocationShares)}</dd>${(r.rows||[]).map(row=>`<dt>${pair(row.label||row.key)}</dt><dd>${n(row.amount)}</dd>`).join('')}</dl>`}`;
}
export function analystAllocationSummaryHTML(d){
 if(d?.ticker==='NVMI'){
  let r;try{r=nvmiConditionalResult(d);}catch{}
  return `${finite(r?.perShare)?`<p class="research-equity-value">${n(r.perShare)} <small>USD / ${l('shareUnit')}</small></p><p class="micro">${l('selected')} · 2025-12-31 · ${l('compactScope')}</p>`:''}<button type="button" class="text-button" data-research-action="open-analyst-allocation">${l('nvmi')}</button>`;
 }
 if(!getAnalystAllocationDefinition(d?.ticker))return '';
 return `<div data-analyst-summary>${analystAllocationOutputHTML(d,{compact:true})}<button type="button" class="text-button" data-research-action="open-analyst-allocation">${l(d.analystConditionalAllocation?.enabled?'edit':'open')}</button></div>`;
}
export function analystAllocationEditorHTML(d){
 const definition=getAnalystAllocationDefinition(d?.ticker);if(!definition)return '';
 const state=d.analystConditionalAllocation,active=state?.enabled===true,inputs=state?.inputs||{};
 return `<section class="research-card" id="analyst-allocation-tool"><h3>${l('title')}</h3><p>${pair(definition.description)}</p><p class="micro">${l('basis',{origin:definition.origin,capital:definition.capitalDate||definition.origin,shares:definition.shareDate||definition.origin,information:definition.informationAsOf})}</p><p class="micro">${l('assumptions')}</p><div class="research-actions"><button type="button" class="quiet" data-analyst-action="${active?'off':'enable'}">${l(active?'off':'enable')}</button>${active?`<button type="button" class="quiet" data-analyst-action="reset">${l('reset')}</button>${definition.illustration?`<button type="button" class="quiet" data-analyst-action="illustration">${l('illustration')}</button>`:''}`:''}</div>${active?`<div class="research-field-grid">${definition.fields.map(field=>{const value=Object.hasOwn(inputs,field.key)?inputs[field.key]:null;return `<label>${pair(field.label)}${field.unit?` · ${pair(field.unit)}`:''}<input type="number" step="any" inputmode="decimal" data-precision-grammar="annual" data-analyst-input="${esc(field.key)}" ${precisionInputAttributes(value,1,state.inputText?.[field.key])}><small>${pair(field.provenance)}</small>${value===null||value===undefined?`<small data-analyst-missing="${esc(field.key)}">${l('unknown')}</small>`:''}</label>`;}).join('')}</div><label>${l('note')}<textarea rows="2" data-analyst-note>${esc(state.note||'')}</textarea></label><div id="analyst-allocation-output" aria-live="polite">${analystAllocationOutputHTML(d)}</div>`:''}<p class="micro">${l('scope')}</p><p class="micro">${l('funding')}</p><p class="micro">${l('mc')}</p><details><summary>${l('sources')}</summary>${(definition.sourceUrls||[]).map((url,index)=>`<p><a href="${esc(url)}" target="_blank" rel="noopener">${l('source',{number:index+1})}</a></p>`).join('')}</details></section>`;
}
export function enableAnalystAllocation(d){
 if(!getAnalystAllocationDefinition(d?.ticker))return false;
 if(!d.analystConditionalAllocation)d.analystConditionalAllocation=createAnalystAllocationState(d.ticker);
 d.analystConditionalAllocation.enabled=true;return true;
}
export function bindAnalystAllocation(root,d,{save,rerender,updateResults,remember,endEdit}={}){
 if(!getAnalystAllocationDefinition(d?.ticker))return;
 root.querySelectorAll('[data-analyst-action]').forEach(button=>button.onclick=()=>{
  remember?.('analyst-allocation:'+button.dataset.analystAction);const action=button.dataset.analystAction;
  if(action==='off'){d.analystConditionalAllocation.enabled=false;}
  else if(action==='reset')d.analystConditionalAllocation=createAnalystAllocationState(d.ticker);
  else{enableAnalystAllocation(d);if(action==='illustration'){d.analystConditionalAllocation.inputs={...d.analystConditionalAllocation.inputs,...getAnalystAllocationDefinition(d.ticker).illustration};d.analystConditionalAllocation.inputText={};}}
  save?.();rerender?.();root.querySelector('#analyst-allocation-tool button')?.focus({preventScroll:true});
 });
 root.querySelectorAll('[data-analyst-input]').forEach(input=>{
  input.onfocus=()=>endEdit?.();input.onblur=()=>endEdit?.();input.oninput=()=>{
   remember?.('analyst-allocation:'+input.dataset.analystInput);const value=readPrecisionInput(input),state=d.analystConditionalAllocation;
   state.inputs[input.dataset.analystInput]=finite(value)?value:null;state.inputText||={};state.inputText[input.dataset.analystInput]=input.value;
   const missing=root.querySelector(`[data-analyst-missing="${input.dataset.analystInput}"]`);if(missing)missing.hidden=finite(value);save?.();updateResults?.();
  };bindPrecisionInput(input);
 });
 const note=root.querySelector('[data-analyst-note]');if(note){note.onfocus=()=>endEdit?.();note.onblur=()=>endEdit?.();note.oninput=()=>{remember?.('analyst-allocation:note');d.analystConditionalAllocation.note=note.value;save?.();};}
}

export function analystReviewedGateHTML(d){return d?.analystConditionalAllocation?.enabled||['conditional','market'].includes(d?.nvmiConditional?.mode)?`<p class="micro">${l('reviewed')}</p>`:null;}
