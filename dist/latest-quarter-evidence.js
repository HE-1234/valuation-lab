// Dated evidence from each company's latest filed quarter. Display only: the reviewed
// packages keep their origins, bridges and per-share gates; nothing here enters a valuation.
import {annualTextHTML} from './annual-localization.js';
import {LATEST_QUARTER_EVIDENCE} from './latest-quarter-evidence-data.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const amount=(value,digits)=>value.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});
export function latestQuarterEvidenceHTML(c){
 const e=LATEST_QUARTER_EVIDENCE[c?.ticker];if(!e)return '';
 const text=annualTextHTML,unit=`${esc(e.currency)}m`;
 return `<details class="annual-summary-caveat latest-quarter-evidence" data-latest-quarter="${esc(c.ticker)}"><summary>${text('Latest filed quarter · dated evidence only')} · ${esc(e.periodEnd)}</summary><p>${text('Valuation origin, bridge and per-share output are unchanged. These figures are not used in the calculation.')}</p><p>${text('Latest filing')}: ${esc(e.form)} · ${text('Period end')} ${esc(e.periodEnd)} · ${text('Filed')} ${esc(e.filed)} · <a href="${esc(e.url)}" target="_blank" rel="noopener">${text('SEC filing')} ↗</a></p><div class="research-table-scroll"><table class="research-table"><caption>${text('Balance sheet')} · ${unit}</caption><thead><tr><th></th><th>${text('Valuation origin')} ${esc(e.originDate)}</th><th>${text('Latest filed')} ${esc(e.periodEnd)}</th></tr></thead><tbody>${e.balance.map(([label,origin,latest])=>`<tr><th scope="row">${text(label)}</th><td>${amount(origin,e.digits)}</td><td>${amount(latest,e.digits)}</td></tr>`).join('')}</tbody></table></div><div class="research-table-scroll"><table class="research-table"><caption>${text('Reported results and forecast reference')} · ${unit}</caption><tbody>${e.flows.map(([label,value])=>`<tr><th scope="row">${text(label)}</th><td>${amount(value,e.digits)}</td></tr>`).join('')}</tbody></table></div><p>${text(e.note)}</p></details>`;
}
