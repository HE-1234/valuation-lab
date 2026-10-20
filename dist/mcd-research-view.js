import {incrementalRecord} from './incremental-registry.js';
import {MCD_MESSAGES} from './mcd-messages.js';
import {MCD_ALLOCATION_SCOPE_FLAGS,validateMcdPolicy} from './mcd-financial-engine.js';
import {annualTextHTML} from './annual-localization.js';
import {displayNumber,precisionInputAttributes,readPrecisionInput,bindPrecisionInput} from './number-display.js';
import {annualRevenueGrowthChartHTML,annualFCFFGrowthChartHTML} from './annual-revenue-growth-chart.js';
export {MCD_MESSAGES};
const a=k=>annualTextHTML(MCD_MESSAGES[k]?.[0]??k),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=x=>typeof x==='number'&&Number.isFinite(x),object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),n=x=>esc(displayNumber(x,2,{missing:'—'})),pct=x=>finite(x)?n(x*100)+'%':'—',p=k=>`<p>${a(k)}</p>`;
export const MCD_POLICY_FIELDS=Object.freeze(['finance_lease_claim','affiliate_equity_value','other_nonoperating_assets','minimum_operating_cash','existing_award_incremental_claim','other_noncommon_claims']);
const valid=x=>{try{return validateMcdPolicy(x);}catch{return false;}};
const equal=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
export function mcdPolicyEditorHTML(d){
 if(d?.ticker!=='MCD')return '';
 const policy=d.mcdPolicy,examples=incrementalRecord('MCD').policyExamples,editable=object(policy),changed=policy!==null&&!examples.some(e=>equal(e.policy,policy));
 return `<section class="research-card" id="mcd-policy-tool"><h3>${a('title')}</h3>${p(policy===null?'none':'selected')}<p id="mcd-policy-edited" ${changed?'':'hidden'}>${a('edited')}</p><div class="result-actions">${examples.map((e,i)=>`<button type="button" class="quiet" data-mcd-example="${i}">${a(e.name)}</button>`).join('')}<button type="button" class="quiet" data-mcd-start>${a('start')}</button><button type="button" class="quiet" data-mcd-clear>${a('clear')}</button></div><div id="mcd-policy-help">${['scopePolicy','claims','funding','leases'].map(p).join('')}</div>${policy!==null&&!valid(policy)?`<p class="research-warning">${a('invalid')}</p>`:''}${editable?`<div class="research-field-grid">${MCD_POLICY_FIELDS.map(key=>`<label>${a(key)}<input type="text" inputmode="decimal" data-precision-grammar="annual" data-mcd-policy="${key}" ${precisionInputAttributes(policy[key])} aria-describedby="mcd-policy-help"></label>`).join('')}</div>`:''}</section>`;
}
export function bindMcdPolicy(root,d,{save,rerender,updateResults,remember,endEdit}={}){
 if(d?.ticker!=='MCD'||!root?.querySelectorAll)return;
 const set=(policy,key)=>{remember?.(key);d.mcdPolicy=policy;save?.();rerender?.();endEdit?.();};
 root.querySelectorAll('[data-mcd-example]').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.mcdExample),e=incrementalRecord('MCD').policyExamples[i];if(!Number.isInteger(i)||!e||!valid(e.policy))return;set(structuredClone(e.policy),'mcd-policy-select');});
 const start=root.querySelector('[data-mcd-start]');if(start)start.onclick=()=>set({...Object.fromEntries(MCD_POLICY_FIELDS.map(k=>[k,null])),...MCD_ALLOCATION_SCOPE_FLAGS,basis:MCD_MESSAGES.scopePolicy[0]},'mcd-policy-start');
 const clear=root.querySelector('[data-mcd-clear]');if(clear)clear.onclick=()=>set(null,'mcd-policy-clear');
 if(object(d.mcdPolicy))root.querySelectorAll('[data-mcd-policy]').forEach(el=>{el.onfocus=()=>endEdit?.();el.onblur=()=>endEdit?.();el.oninput=()=>{const key=el.dataset.mcdPolicy;if(!MCD_POLICY_FIELDS.includes(key))return;remember?.('mcd:'+key);d.mcdPolicy[key]=el.value.trim()===''?null:readPrecisionInput(el);d.mcdPolicy.basis=MCD_MESSAGES.scopePolicy[0];delete d.mcdPolicy.basis_amounts_USDm;const note=root.querySelector('#mcd-policy-edited');if(note)note.hidden=false;save?.();updateResults?.();};bindPrecisionInput(el);});
}
export function mcdAllocationHTML(b){
 if(b?.ticker!=='MCD')return '';
 const v=b.mcdAllocation;if(!v?.allocation_policy)return `<section class="research-card mcd-conditional-allocation">${p('none')}${p('currentUnavailable')}</section>`;
 return `<section class="research-card mcd-conditional-allocation" data-mcd-allocation><h3>${a('title')}</h3>${p('selected')}${finite(v.dated_per_share_allocation)?`<p>${a('conditional')}: <b>${n(v.dated_per_share_allocation)}</b></p>`:p('withheld')}${p('currentUnavailable')}${p('scopePolicy')}<dl>${MCD_POLICY_FIELDS.map(k=>`<dt>${a(k)}</dt><dd>${n(v.allocation_policy[k])}</dd>`).join('')}</dl>${p('funding')}</section>`;
}
export function mcdComponentsHTML(op){
 if(op?.ticker!=='MCD')return '';
 const cols=[['da','consolidated_da'],['capex','cash_capex'],['financeAssets','new_finance_lease_assets_as_economic_capex'],['nwc','change_in_nwc'],['adjustment','analyst_net_investment_adjustment'],['adjustedCapex','cash_capex_after_analyst_adjustment'],['relief','next_rent_relief'],['support','next_capital_support_full_year']];
 return `<section class="research-card" data-mcd-components><h3>${a('components')}</h3>${p('sourceComponents')}${p('investmentBounds')}${p('waccBounds')}${p('next')}${p('leases')}<div class="research-table-scroll" tabindex="0" role="region" aria-label="MCD"><table class="research-table"><caption>${a('components')} · ${a('moneyUnit')}</caption><thead><tr><th>${a('fiscalYear')}</th>${cols.map(([label])=>`<th>${a(label)}</th>`).join('')}</tr></thead><tbody>${op.rows.map(row=>`<tr><th scope="row">${annualTextHTML(row.period)}</th>${cols.map(([,key])=>`<td>${n(row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
export function mcdHistoryHTML(d,key){
 if(d?.ticker!=='MCD'||!['growth','profitability','capital'].includes(key))return '';
 const record=incrementalRecord('MCD'),rows=record.history,title={growth:'historyGrowth',profitability:'historyProfitability',capital:'historyCapital'}[key],columns={growth:['revenue','growthRate'],profitability:['ebit','margin','etr'],capital:['capex','capexRevenue','da','daRevenue']}[key];
 return `<section class="research-card mcd-history-reference" data-mcd-history="${key}"><h4>${a(title)}</h4>${p('history')}<div class="research-table-scroll" tabindex="0" role="region" aria-label="MCD"><table class="research-table"><caption>${a(title)} · ${a('moneyUnit')}</caption><thead><tr><th>${a('fiscalYear')}</th>${columns.map(label=>`<th>${a(label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row,i)=>{const vals={growth:[n(row.revenue),i?pct(row.revenue/rows[i-1].revenue-1):'—'],profitability:[n(row.ebit_gaap),pct(row.ebit_margin),pct(row.effective_tax_rate)],capital:[n(row.cash_capex),pct(row.cash_capex/row.revenue),n(row.consolidated_da_cash_flow),pct(row.consolidated_da_cash_flow/row.revenue)]}[key];return `<tr><th scope="row">${esc(row.fiscal_year)}</th>${vals.map(value=>`<td>${value}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div><p><a href="${esc(record.identity.provenancePath)}" target="_blank" rel="noopener">${a('source')} ↗</a> · <a href="${esc(record.identity.historyPath.replace('history-v2.json','comparability-v2.json'))}" target="_blank" rel="noopener">${a('comparability')} ↗</a></p></section>`;
}
// Reuse the shared real-year chart without AMD-specific revenue-origin prose.
export function mcdRevenueGrowthHTML(d,rows){return annualRevenueGrowthChartHTML(rows,{anchor:d.anchor,terminalGrowth:d.terminal.growth,revenueMethodHTML:a('growthMethod')});}
export function mcdFCFFGrowthHTML(rows){return annualFCFFGrowthChartHTML(rows);}
