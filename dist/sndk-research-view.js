import {annualTextHTML} from './annual-localization.js';
import {displayNumber} from './number-display.js';
import {SNDK_MESSAGES} from './sndk-messages.js';
export {SNDK_MESSAGES} from './sndk-messages.js';

const n=x=>displayNumber(x,2);
const p=x=>`<p class="annual-summary-caveat">${annualTextHTML(x)}</p>`;
export function sndkAllocationHTML(b){if(b?.claimAllocationModel!=='sndk-conditional-v3')return '';return p(SNDK_MESSAGES.allocation[0])+p(SNDK_MESSAGES.proxy[0])+p(`${SNDK_MESSAGES.scope[0]}`);}
export function sndkFundingHTML(r){return `<p class="micro">${annualTextHTML(SNDK_MESSAGES.equation[0])}</p><p class="micro">${annualTextHTML(SNDK_MESSAGES.terminal[0])}</p><p>${annualTextHTML(SNDK_MESSAGES.opening[0])}: ${n(r.openingSurplus)} USDm · ${annualTextHTML(SNDK_MESSAGES.liquidity[0])}: ${n(r.minimumModeledLiquidity)} USDm</p>`;}
