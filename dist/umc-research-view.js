import {incrementalRecord} from './incremental-registry.js';
import {annualTextHTML} from './annual-localization.js';
import {displayNumber,precisionInputAttributes,readPrecisionInput,bindPrecisionInput} from './number-display.js';
import {UMC_MESSAGES} from './umc-messages.js';
export {UMC_MESSAGES} from './umc-messages.js';
const a=key=>annualTextHTML(UMC_MESSAGES[key][0]);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=value=>displayNumber(value,2),finite=value=>typeof value==='number'&&Number.isFinite(value),cell=value=>value===null||typeof value==='number';
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const policyScalars=['authorized_2026_award_issuance_fraction','required_operating_cash','minority_claim_reserved','time_deposit_funding_release_year','time_deposit_recovery_fraction','supplemental_senior_cash_claim','unissued_award_claim_reserved'];
const policyArrays=['lease_cash_by_year','financial_cash_interest_by_year','supplemental_operating_cash_by_year'];
const bankTimings=['all_upfront','current_upfront_remaining_year2'];
const exampleKeys=['upfront','stress','staged'];
const tenCells=value=>Array.isArray(value)&&value.length===10&&value.every(cell);
const editablePolicy=p=>object(p)&&policyScalars.every(k=>Object.hasOwn(p,k)&&cell(p[k]))&&policyArrays.every(k=>tenCells(p[k]));
const validPolicy=p=>editablePolicy(p)&&policyScalars.every(k=>finite(p[k])&&p[k]>=0)&&policyArrays.every(k=>p[k].every(v=>finite(v)&&v>=0))&&bankTimings.includes(p.bank_principal_timing)&&p.authorized_2026_award_issuance_fraction<=1&&p.time_deposit_recovery_fraction<=1&&Number.isInteger(p.time_deposit_funding_release_year)&&p.time_deposit_funding_release_year>=1&&p.time_deposit_funding_release_year<=10&&p.nonoperating_equity_value_assigned===0&&p.circular_crossholding_share_reduction===0;
const matchesExample=(p,e)=>object(p)&&object(e)&&Object.keys(p).length===Object.keys(e).length&&Object.entries(e).every(([key,value])=>Array.isArray(value)?Array.isArray(p[key])&&value.length===p[key].length&&value.every((v,i)=>Object.is(v,p[key][i])):Object.is(value,p[key]));
const validDA=value=>tenCells(value)&&value.every(v=>finite(v)&&v>=0);
const paragraph=key=>`<p>${a(key)}</p>`;
const dateFor=i=>`${2027+i}-06-30`;
const policyInput=(key,value,index)=>`<label>${a(key)}${index===undefined?'':` · ${a('year')} ${index+1} (${dateFor(index)})`}<input type="text" inputmode="decimal" data-precision-grammar="annual" data-umc-policy="${key}" ${index===undefined?'':`data-umc-index="${index}"`} ${precisionInputAttributes(value)} aria-describedby="umc-policy-help"></label>`;
export function umcPolicyEditorHTML(d){
 if(d?.ticker!=='UMC')return '';
 const record=incrementalRecord('UMC'),p=d.umcPolicy,examples=Array.isArray(record?.policyExamples)?record.policyExamples:[],editable=editablePolicy(p);
 const buttons=examples.slice(0,3).map((_,i)=>`<button type="button" class="quiet" data-umc-example="${i}">${a(exampleKeys[i])}</button>`).join('');
 const policyFields=editable?`<div class="research-field-grid">${policyScalars.map(key=>policyInput(key,p[key])).join('')}<label>${a('bank_principal_timing')}<select data-umc-bank-timing aria-describedby="umc-policy-help">${bankTimings.includes(p.bank_principal_timing)?'':`<option value="" selected>${a('invalidTiming')}</option>`}${bankTimings.map(key=>`<option value="${key}" ${p.bank_principal_timing===key?'selected':''}>${a(key)}</option>`).join('')}</select></label></div><details><summary>${a('annualPolicy')}</summary>${policyArrays.map(key=>`<h4>${a(key)}</h4><div class="research-field-grid">${p[key].map((value,i)=>policyInput(key,value,i)).join('')}</div>`).join('')}</details>`:'';
 const daFields=tenCells(d.umcDaNonlease)?`<div class="research-field-grid">${d.umcDaNonlease.map((value,i)=>`<label>${a('da')} · ${a('year')} ${i+1} (${dateFor(i)})<input type="text" inputmode="decimal" data-precision-grammar="annual" data-umc-da="${i}" ${precisionInputAttributes(value)} aria-describedby="umc-policy-help"></label>`).join('')}</div>`:'';
 return `<section class="research-card" id="umc-policy-tool"><h3>${a('title')}</h3>${paragraph(p==null?'none':'selected')}<p id="umc-policy-edited" ${p!=null&&!examples.some(e=>matchesExample(p,e))?'':'hidden'}>${a('edited')}</p><div class="result-actions">${buttons}<button type="button" class="quiet" data-umc-clear>${a('clear')}</button></div><div id="umc-policy-help">${['scope','dated','awards','fixed','fundingCaveat','bankCaveat','reinvestment','nulls'].map(paragraph).join('')}</div>${(p!==null&&!validPolicy(p))||!validDA(d.umcDaNonlease)?`<p class="research-warning">${a('error')}</p>`:''}${policyFields}<details><summary>${a('daTitle')}</summary>${paragraph('leaseCaveat')}${daFields}</details></section>`;
}
// Keep an edit's last known finite component while its visible value is blank or
// invalid. This never supplies a missing policy value to the financial engine.
const editAnchors=new WeakMap();
function anchors(d){
 let state=editAnchors.get(d);
 if(!state||state.policy!==d.umcPolicy||state.daObject!==d.umcDaNonlease){state={policy:d.umcPolicy,daObject:d.umcDaNonlease,supplemental:Array.from({length:10},(_,i)=>d.umcPolicy===null?0:finite(d.umcPolicy?.supplemental_operating_cash_by_year?.[i])?d.umcPolicy.supplemental_operating_cash_by_year[i]:undefined),da:Array.from({length:10},(_,i)=>finite(d.umcDaNonlease?.[i])?d.umcDaNonlease[i]:undefined)};editAnchors.set(d,state);}
 return state;
}
function adjustReinvestment(d,i,previous,next,sign=1){
 const row=Array.isArray(d.annual)?d.annual[i]:null;
 if(object(row)&&finite(row.reinvestment)&&finite(previous)&&finite(next)){const changed=row.reinvestment+sign*(next-previous);row.reinvestment=finite(changed)?changed:null;}
}
export function bindUmcPolicy(root,d,{save,rerender,updateResults,remember,endEdit}={}){
 if(d?.ticker!=='UMC'||!root?.querySelectorAll)return;
 anchors(d);
 const refreshEdited=()=>{const node=root.querySelector('#umc-policy-edited'),examples=incrementalRecord('UMC')?.policyExamples;if(node)node.hidden=d.umcPolicy==null||Array.isArray(examples)&&examples.some(e=>matchesExample(d.umcPolicy,e));};
 const replacePolicy=next=>{const state=anchors(d);for(let i=0;i<10;i++){const current=d.umcPolicy===null?0:d.umcPolicy?.supplemental_operating_cash_by_year?.[i],previous=finite(current)?current:state.supplemental[i],value=next===null?0:next?.supplemental_operating_cash_by_year?.[i];adjustReinvestment(d,i,previous,value);}d.umcPolicy=next;editAnchors.delete(d);anchors(d);};
 root.querySelectorAll('[data-umc-example]').forEach(el=>el.onclick=()=>{const index=Number(el.dataset.umcExample),example=incrementalRecord('UMC')?.policyExamples?.[index];if(!Number.isInteger(index)||index<0||index>2||!validPolicy(example))return;const focused=el.ownerDocument?.activeElement===el;remember?.('umc-policy-select');replacePolicy(structuredClone(example));save?.();rerender?.();endEdit?.();if(focused)root.querySelector(`[data-umc-example="${index}"]`)?.focus({preventScroll:true});});
 const clear=root.querySelector('[data-umc-clear]');if(clear)clear.onclick=()=>{remember?.('umc-policy-clear');replacePolicy(null);save?.();rerender?.();endEdit?.();root.querySelector('[data-umc-clear]')?.focus({preventScroll:true});};
 if(editablePolicy(d.umcPolicy)){
  root.querySelectorAll('[data-umc-policy]').forEach(el=>{el.onfocus=()=>endEdit?.();el.onblur=()=>endEdit?.();el.oninput=()=>{const key=el.dataset.umcPolicy,index=el.dataset.umcIndex===undefined?undefined:Number(el.dataset.umcIndex);if(index===undefined?!policyScalars.includes(key):!policyArrays.includes(key)||!Number.isInteger(index)||index<0||index>9)return;remember?.('umc:'+key+':'+(index??''));const value=el.value.trim()===''?null:readPrecisionInput(el),state=anchors(d);if(index===undefined)d.umcPolicy[key]=value;else{if(key==='supplemental_operating_cash_by_year'){const old=d.umcPolicy[key][index];adjustReinvestment(d,index,finite(old)?old:state.supplemental[index],value);if(finite(value))state.supplemental[index]=value;}d.umcPolicy[key][index]=value;}refreshEdited();save?.();updateResults?.();};bindPrecisionInput(el);});
  const bank=root.querySelector('[data-umc-bank-timing]');if(bank)bank.onchange=()=>{remember?.('umc:bank-principal-timing');d.umcPolicy.bank_principal_timing=bankTimings.includes(bank.value)?bank.value:null;refreshEdited();save?.();updateResults?.();endEdit?.();};
 }
 if(tenCells(d.umcDaNonlease))root.querySelectorAll('[data-umc-da]').forEach(el=>{el.onfocus=()=>endEdit?.();el.onblur=()=>endEdit?.();el.oninput=()=>{const i=Number(el.dataset.umcDa);if(!Number.isInteger(i)||i<0||i>9)return;remember?.('umc:da:'+i);const value=el.value.trim()===''?null:readPrecisionInput(el),state=anchors(d),old=d.umcDaNonlease[i];adjustReinvestment(d,i,finite(old)?old:state.da[i],value,-1);if(finite(value))state.da[i]=value;d.umcDaNonlease[i]=value;save?.();updateResults?.();};bindPrecisionInput(el);});
}
const allocation=value=>object(value?.umcAllocation)?value.umcAllocation:null;
const selectionRequired=v=>!v||/SELECTION_REQUIRED/.test(String(v.status??''));
const fundingPass=v=>v?.status==='DATED_CONDITIONAL_ANNUAL_FUNDING_PASS'&&v.current_target===null&&finite(v.conditional_usd_per_ads)&&finite(v.conditional_twd_per_ordinary)&&v.conditional_usd_per_ads>0&&v.conditional_twd_per_ordinary>0&&finite(v.funding?.minimum_available_liquidity)&&v.funding.minimum_available_liquidity>=0;
const amountLine=(label,value)=>`<p>${a(label)}: ${n(value)}</p>`;
export function umcAllocationHTML(bridge){
 if(bridge?.ticker!=='UMC'&&!allocation(bridge))return '';
 const v=allocation(bridge);if(selectionRequired(v))return `<div class="research-card">${paragraph('none')}${paragraph('dated')}${paragraph('scope')}</div>`;
 const f=object(v.funding)?v.funding:{},pass=fundingPass(v);
 return `<div class="research-card umc-conditional-allocation" data-umc-allocation><h3>${a('headline')}</h3>${paragraph('selected')}${paragraph('dated')}${paragraph('scope')}${pass?`${paragraph('passed')}${amountLine('conditionalADS',v.conditional_usd_per_ads)}${amountLine('conditionalOrdinary',v.conditional_twd_per_ordinary)}`:`<p class="research-warning">${a('withheld')}</p>`}${paragraph('currentUnavailable')}${[['enterprise',v.enterprise_value_twd_m??v.enterprise_value],['bridge',v.equity_bridge_twd_m],['equity',v.equity_value_twd_m],['denominator',v.ordinary_share_denominator_m],['assumedAwards',v.authorized_award_new_shares_m],['initial',f.initial_available_liquidity],['minimum',f.minimum_available_liquidity]].map(([label,value])=>amountLine(label,value)).join('')}${finite(f.gap)&&f.gap>0?`<p class="error">${a('shortfall')}: ${n(f.gap)}</p>`:''}${paragraph('awards')}${paragraph('fundingCaveat')}</div>`;
}
export function umcFundingHTML(operating){
 const v=allocation(operating);if(!v)return '';
 if(selectionRequired(v))return `${paragraph('none')}${paragraph('fundingCaveat')}`;
 const f=object(v.funding)?v.funding:{},rows=Array.isArray(v.rows)?v.rows.filter(object):[],cols=[['fcff','fcff'],['depositRelease','time_deposit_cash_conversion'],['domesticPrincipal','domestic_bond_principal'],['bankPayment','bank_principal_payment'],['cashInterest','financial_debt_cash_interest_excluding_leases'],['endingLiquidity','ending_available_liquidity']];
 return `<h3>${a('funding')}</h3>${paragraph('dated')}${paragraph('scope')}${paragraph('fundingCaveat')}${paragraph('bankCaveat')}${[['initial',f.initial_available_liquidity],['minimum',f.minimum_available_liquidity],['knownClaims',f.known_claims_reserved],['analystClaims',f.analyst_claims_reserved],['bankReserve',f.bank_principal_reserved],['novatekReserve',f.novatek_redemption_reserved],['deposits',f.time_deposits_not_available_at_inception]].map(([label,value])=>amountLine(label,value)).join('')}${finite(f.gap)&&f.gap>0?`<p class="error">${a('shortfall')}: ${n(f.gap)}</p>`:''}<div class="research-table-scroll" tabindex="0" role="region" aria-label="UMC" data-annual-label="${esc(UMC_MESSAGES.funding[0])}"><table class="research-table"><caption>${a('fundingTable')}</caption><thead><tr><th scope="col">${a('year')}</th>${cols.map(([label])=>`<th scope="col">${a(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${esc(row.period_end??row.period??row.year)}</th>${cols.map(([,key])=>`<td>${n(row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const ratio=(top,bottom)=>finite(top)&&finite(bottom)&&bottom!==0?top/bottom:null;
const percent=value=>finite(value)?`${n(value*100)}%`:n(null);
const safeURL=value=>typeof value==='string'&&(/^(?:https?:\/\/|\.\/data\/)/.test(value))?value:null;
const sourceLink=(url,label)=>safeURL(url)?`<a href="${esc(url)}" target="_blank" rel="noopener">${a(label)} ↗</a>`:'';
export function umcHistoryHTML(d,key){
 if(d?.ticker!=='UMC'||!['growth','profitability','capital'].includes(key))return '';
 const record=incrementalRecord('UMC'),rows=Array.isArray(record?.history)?record.history.filter(object).filter(row=>Number(row.year??row.fiscalYear)>=2016&&Number(row.year??row.fiscalYear)<=2025).sort((l,r)=>Number(l.year??l.fiscalYear)-Number(r.year??r.fiscalYear)):[];
 const title={growth:'historyGrowth',profitability:'historyProfitability',capital:'historyCapital'}[key],note={growth:'historyGrowthNote',profitability:'historyProfitabilityNote',capital:'historyCapitalNote'}[key];
 if(!rows.length)return `<section class="research-card">${paragraph('historyUnavailable')}</section>`;
 const columns={growth:['revenue','revenueGrowth'],profitability:['reportedEBIT','reportedMargin','reportedETR'],capital:['cashCapex','capexRevenue','totalDA','daRevenue']}[key];
 const body=rows.map((row,i)=>{const year=Number(row.year??row.fiscalYear),ebit=row.ebit_reported??row.canonicalOperatingEBIT,margin=finite(row.ebit_margin)?row.ebit_margin:finite(row.operatingMargin)?row.operatingMargin:ratio(ebit,row.revenue),capex=finite(row.cash_ppe)&&finite(row.cash_intangibles)?row.cash_ppe+row.cash_intangibles:null,etr=finite(row.effective_tax_rate)?row.effective_tax_rate:ratio(row.tax_expense,row.pretax_income),previous=rows[i-1],growth=i>0&&year===Number(previous.year??previous.fiscalYear)+1&&finite(row.revenue)&&finite(previous.revenue)&&previous.revenue>0?row.revenue/previous.revenue-1:null,values={growth:[n(row.revenue),percent(growth)],profitability:[n(ebit),percent(margin),percent(etr)],capital:[n(capex),percent(ratio(capex,row.revenue)),n(row.da),percent(ratio(row.da,row.revenue))]}[key],link=sourceLink(row.sourceUrl??row.sourceURL??row.source?.url,'source');return `<tr><th scope="row">${esc(year)}${link?` · ${link}`:''}</th>${values.map(value=>`<td>${value}</td>`).join('')}</tr>`;}).join('');
 const id=record?.identity??{},base=typeof id.historyPath==='string'?id.historyPath.slice(0,id.historyPath.lastIndexOf('/')+1):null,links=[sourceLink(id.provenancePath,'provenance'),sourceLink(base?base+'history-methodology-v1.md':null,'historyMethod'),sourceLink(base?base+'history-sources-v1.json':id.sourceLedgerPath,'historySourceLedger')].filter(Boolean);
 return `<section class="research-card umc-history-reference" data-umc-history="${key}"><h4>${a(title)}</h4>${paragraph('historyBasis')}${paragraph(note)}${paragraph('historyBreaks')}<div class="research-table-scroll" tabindex="0" role="region" aria-label="UMC" data-annual-label="${esc(UMC_MESSAGES[title][0])}"><table class="research-table"><caption>${a(title)} · ${a('moneyUnit')}</caption><thead><tr><th scope="col">${a('fiscalYear')}</th>${columns.map(label=>`<th scope="col">${a(label)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>${links.length?`<p>${a('sources')}: ${links.join(' · ')}</p>`:''}</section>`;
}
