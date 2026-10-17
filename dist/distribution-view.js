/** Presentation helpers for conditional input distributions; no sampling occurs here. */
import {distributionSummary} from './simulation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=Number.isFinite;
const num=(v,scale=1)=>finite(v)?String(Math.round(v*scale*1e6)/1e6):'';
const types={fixed:'Fixed',triangular:'Triangular',uniform:'Uniform',normal:'Truncated normal'};
export const distributionParts=Object.freeze({fixed:['value'],triangular:['low','mode','high'],uniform:['low','high'],normal:['low','mean','sd','high']});
const names={value:'Fixed value',low:'Lower bound',mode:'Most likely · mode',high:'Upper bound',mean:'Underlying mean',sd:'Underlying standard deviation'};
export function distributionForType(previous,type,fallback){
 const base=previous||fallback,low=finite(base.low)&&finite(base.high)&&base.low<base.high?base.low:fallback.low,high=finite(base.low)&&finite(base.high)&&base.low<base.high?base.high:fallback.high;
 const center=[base.value,base.mode,base.mean,(low+high)/2].find(finite),mode=Math.min(high,Math.max(low,center));
 if(type==='fixed')return {type,value:center};
 if(type==='uniform')return {type,low,high};
 if(type==='normal')return {type,low,mean:center,sd:base.type==='normal'&&finite(base.sd)&&base.sd>0?base.sd:(high-low)/6,high};
 return {type:'triangular',low,mode,high};
}
export function renderDistributionPreview(spec,scale=1,unit='',key){
 try{
  const s=distributionSummary(spec,key),density=s.density||[],lo=s.low,hi=s.high;
  const x=v=>8+(hi>lo?(v-lo)/(hi-lo):.5)*224,y=v=>54-v*43;
  const line=s.type==='fixed'?`<path d="M120,54 L120,11"/>`:`<path d="${density.map((p,i)=>`${i?'L':'M'}${x(p.x).toFixed(2)},${y(p.y).toFixed(2)}`).join(' ')}"/>`;
  const words=s.type==='fixed'?'Every draw uses this value.':s.type==='uniform'?'Equal density between the bounds.':s.type==='normal'?'Underlying normal, cut off at your bounds.':'Peak at the mode; bounded on both sides.';
  return `<svg viewBox="0 0 240 66" aria-hidden="true" focusable="false"><line x1="8" y1="54" x2="232" y2="54" stroke="currentColor" opacity=".25"/><g fill="none" stroke="currentColor" stroke-width="2.5">${line}</g></svg><div class="mc-shape-bounds"><span>${num(lo,scale)}${esc(unit)}</span><span>${num(hi,scale)}${esc(unit)}</span></div><p>${words} ${s.type==='fixed'?'':'Relative density, not a probability scale.'}</p>`;
 }catch(e){return `<p class="mc-shape-invalid">Shape unavailable: ${esc(e.message)}</p>`;}
}
export function renderDistributionEditor(key,label,scale,unit,spec,validationKey=key){
 const type=spec.type||'triangular';
 return `<legend>${esc(label)} · ${esc(unit)}</legend><label for="mc-${key}-type" class="mc-type-label">Distribution<select id="mc-${key}-type" data-mc-type="${key}">${Object.entries(types).map(([value,name])=>`<option value="${value}" ${value===type?'selected':''}>${name}</option>`).join('')}</select></label><div class="mc-driver-parameters">${(distributionParts[type]||distributionParts.triangular).map(part=>`<label for="mc-${key}-${part}">${names[part]}${type==='normal'&&part==='sd'&&scale===100?' · percentage points':''}<input id="mc-${key}-${part}" data-mc-driver="${key}" data-mc-part="${part}" type="number" step="${scale===100?'.1':'.05'}" value="${num(spec[part],scale)}" inputmode="decimal" aria-describedby="mc-shape-note-${key}"></label>`).join('')}</div><div id="mc-shape-${key}" class="mc-shape-preview">${renderDistributionPreview(spec,scale,unit,validationKey)}</div><p id="mc-shape-note-${key}" class="mc-shape-note">${type==='normal'?'Mean and standard deviation describe the normal before truncation. The bounded draws can have different moments.':type==='fixed'?'This driver has no simulated variation.':type==='uniform'?'The endpoints are hard bounds; no central value is preferred.':'The mode is a judgment about the most likely input, not a fitted estimate.'}</p>`;
}
