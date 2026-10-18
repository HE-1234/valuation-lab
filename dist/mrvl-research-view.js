import {displayNumber} from './number-display.js';
import {annualTextHTML as a} from './annual-localization.js';
import {selectedMrvlCase,MRVL_MESSAGES} from './mrvl-operating.js';
export function mrvlStubHTML(d){const c=selectedMrvlCase(d);if(!c)return '';const s=c.openingStub,e=s.revenue*s.operatingMargin,n=e-Math.max(0,e)*s.taxRate,f=n-s.reinvestment,pv=f/(1+s.wacc)**.5;return `<div class="annual-anchor"><b>${a('Fixed opening half-year')} · H2 FY2027</b><p>${a(MRVL_MESSAGES.note[0])}</p><p>${a('Fixed H2 FCFF')}: ${displayNumber(f,2)} USDm · WACC ${displayNumber(s.wacc*100,2)}% · t = 0.5 · PV ${displayNumber(pv,2)} USDm</p></div>`;}
