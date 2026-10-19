import {annualTextHTML} from './annual-localization.js';
import {displayNumber} from './number-display.js';
import {KEYS_MESSAGES} from './keys-messages.js';
export {KEYS_MESSAGES} from './keys-messages.js';
const n=x=>displayNumber(x,2);
const p=x=>`<p class="annual-summary-caveat">${annualTextHTML(x)}</p>`;
export function keysAllocationHTML(b){
 if(b?.ticker!=='KEYS')return '';
 return `<div class="incremental-keys-claim-limits">${p(KEYS_MESSAGES.claims[0])}${p(KEYS_MESSAGES.reserves[0])}${p(KEYS_MESSAGES.proxies[0])}${p(KEYS_MESSAGES.funding[0])}</div>`;
}
export function keysFundingHTML(r){
 const columns=['Year','Entered investment',KEYS_MESSAGES.physical[0],KEYS_MESSAGES.roicFloor[0],KEYS_MESSAGES.required[0],'Interest','Debt principal',KEYS_MESSAGES.liquidityAfter[0]],data=r.rows.map(row=>[row.period,n(row.enteredReinvestment),n(row.raw_operating_reinvestment),n(row.roic_reinvestment_floor),n(row.requiredInvestment),n(row.interest),n(row.debt_repayment),n(row.cash_end)]);
 const table=`<div class="research-table-scroll" tabindex="0" role="region" aria-label="KEYS"><table class="research-table"><caption>${annualTextHTML(KEYS_MESSAGES.fundingTable[0])}</caption><thead><tr>${columns.map(x=>`<th scope="col">${annualTextHTML(x)}</th>`).join('')}</tr></thead><tbody>${data.map(row=>`<tr>${row.map((cell,i)=>i?`<td>${cell}</td>`:`<th scope="row">${annualTextHTML(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 return `<div class="keys-funding-diagnostics">${p(KEYS_MESSAGES.equation[0])}${p(KEYS_MESSAGES.terminal[0])}${p(KEYS_MESSAGES.mapping[0])}${p(KEYS_MESSAGES.funding[0])}<p>${annualTextHTML(KEYS_MESSAGES.liquidity[0])}: ${n(r.minimumModeledLiquidity)} USDm</p>${table}</div>`;
}

export function keysSimulationRelationshipsHTML(config){
 return `<label for="mc-capital-policy">${annualTextHTML('How investment responds to revenue')}<select id="mc-capital-policy"><option value="fixed-schedule" ${config.capitalPolicy==='fixed-schedule'?'selected':''}>${annualTextHTML('Keep reviewed absolute investment')}</option><option value="revenue-scaled" ${config.capitalPolicy==='revenue-scaled'?'selected':''}>${annualTextHTML('Scale investment with scenario revenue')}</option></select></label>${p(KEYS_MESSAGES.terminal[0])}${p(KEYS_MESSAGES.mapping[0])}${p(KEYS_MESSAGES.funding[0])}${p(KEYS_MESSAGES.simulation[0])}`;
}
