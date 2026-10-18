import {translateSimulationError,simulationErrorMarkup,localizeSimulationErrors} from './simulation-error-i18n.js';
import {t,localizedText,bindText,localizeMarkedNodes,registerCatalog} from './i18n.js';
import en from './locales/distribution.en.js';
import zh from './locales/distribution.zh-Hans.js';
registerCatalog('distribution',{en,'zh-Hans':zh});
const distributionKeys={"Fixed": "distribution.t0", "Triangular": "distribution.t1", "Uniform": "distribution.t2", "Truncated normal": "distribution.t3", "Fixed value": "distribution.t4", "Lower bound": "distribution.t5", "Most likely · mode": "distribution.t6", "Upper bound": "distribution.t7", "Underlying mean": "distribution.t8", "Underlying standard deviation": "distribution.t9", "Every draw uses this value.": "distribution.t10", "Equal density between the bounds.": "distribution.t11", "Underlying normal, cut off at your bounds.": "distribution.t12", "Peak at the mode; bounded on both sides.": "distribution.t13", "Relative density, not a probability scale.": "distribution.t14", "Distribution": "distribution.t15", "percentage points": "distribution.t16", "Mean and standard deviation describe the normal before truncation. The bounded draws can have different moments.": "distribution.t17", "This driver has no simulated variation.": "distribution.t18", "The endpoints are hard bounds; no central value is preferred.": "distribution.t19", "The mode is a judgment about the most likely input, not a fitted estimate.": "distribution.t20"};
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
export function distributionPreviewData(spec,scale=1,key,previousDomain){
 const summary=distributionSummary(spec,key),density=summary.density||[];
 // The axis spans exactly your bounds, so every shape fills the preview and its
 // labels are the bounds you typed. A fixed value gets a small window around it.
 const width=summary.high-summary.low,around=Math.max(Math.abs(summary.low)*.1,scale===100?.005:.05);
 const lo=width>0?summary.low:summary.low-around,hi=width>0?summary.high:summary.high+around;
 const step=(hi-lo)/25;
 const values=Array.from({length:25},(_,i)=>{
  const x=lo+(i+.5)*step,binLow=lo+i*step,binHigh=lo+(i+1)*step;
  const contained=density.filter(p=>p.x>=binLow&&(p.x<binHigh||i===24&&p.x<=binHigh)).map(p=>p.y);
  if(summary.type==='fixed')return {x,y:summary.low>=lo+i*step&&(summary.low<lo+(i+1)*step||i===24&&summary.low<=hi)?1:0};
  if(x<summary.low||x>summary.high)return {x,y:Math.max(0,...contained)};
  const right=density.findIndex(p=>p.x>=x);
  if(right<=0)return {x,y:density[0]?.y||0};
  const a=density[right-1],b=density[right];return {x,y:Math.max(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x||1),...contained)};
 });
 return {summary,lo,hi,values,words:summary.type==='fixed'?'Every draw uses this value.':summary.type==='uniform'?'Equal density between the bounds.':summary.type==='normal'?'Underlying normal, cut off at your bounds.':'Peak at the mode; bounded on both sides.'};
}
export function renderDistributionPreview(spec,scale=1,unit='',key,presentationKey=key||'input',previousDomain){
 try{
  const d=distributionPreviewData(spec,scale,key,previousDomain);
  return `<svg class="approved-density-svg" viewBox="0 0 240 66" aria-hidden="true" focusable="false" data-density-domain-low="${d.lo}" data-density-domain-high="${d.hi}"><line x1="8" y1="54" x2="232" y2="54" stroke="currentColor" opacity=".25"/>${d.values.map((p,i)=>`<rect data-density-bin="${esc(presentationKey)}-${i}" x="${8+i*224/25}" width="${224/25-2}" rx="1.2" fill="currentColor" height="${p.y*43}" y="${54-p.y*43}" style="height:${p.y*43}px;y:${54-p.y*43}px"/>`).join('')}</svg><div class="mc-shape-bounds"><span data-density-low="${esc(presentationKey)}">${num(d.lo,scale)}${esc(unit)}</span><span data-density-high="${esc(presentationKey)}">${num(d.hi,scale)}${esc(unit)}</span></div><p data-i18n="distribution.shape.${d.summary.type}" data-density-description="${esc(presentationKey)}">${esc(t(distributionKeys[d.words]))} ${d.summary.type==='fixed'?'':t(distributionKeys['Relative density, not a probability scale.'])}</p>`;
 }catch(e){return `<p class="mc-shape-invalid">${simulationErrorMarkup(e.message,'distribution.invalid')}</p>`;}
}
// Keep each bin's DOM identity across rapid edits; CSS interpolates from the
// currently painted geometry, while the sampler's pending state stays separate.
export function updateDistributionPreview(host,spec,scale=1,unit='',key,presentationKey=key||'input'){
 if(!host)return;
 try{
  let first=host.querySelector(`[data-density-bin="${presentationKey}-0"]`);
  if(!first){host.innerHTML=renderDistributionPreview(spec,scale,unit,key,presentationKey);localizeMarkedNodes(host);localizeSimulationErrors(host);return;}
  const svg=first.ownerSVGElement,domain=svg?[Number(svg.getAttribute('data-density-domain-low')),Number(svg.getAttribute('data-density-domain-high'))]:null;
  const d=distributionPreviewData(spec,scale,key,domain);
  svg?.setAttribute('data-density-domain-low',d.lo);svg?.setAttribute('data-density-domain-high',d.hi);
  d.values.forEach((p,i)=>{const bar=host.querySelector(`[data-density-bin="${presentationKey}-${i}"]`);bar?.setAttribute('height',p.y*43);bar?.setAttribute('y',54-p.y*43);bar?.setAttribute('style',`height:${p.y*43}px;y:${54-p.y*43}px`);});
  host.querySelector(`[data-density-low="${presentationKey}"]`).textContent=num(d.lo,scale)+unit;
  host.querySelector(`[data-density-high="${presentationKey}"]`).textContent=num(d.hi,scale)+unit;
  const description=host.querySelector(`[data-density-description="${presentationKey}"]`);description.setAttribute('data-i18n','distribution.shape.'+d.summary.type);bindText(description,'distribution.shape.'+d.summary.type);
 }catch(e){host.innerHTML=`<p class="mc-shape-invalid">${simulationErrorMarkup(e.message,'distribution.invalid')}</p>`;localizeMarkedNodes(host);localizeSimulationErrors(host);}
}
export function renderDistributionEditor(key,label,scale,unit,spec,validationKey=key,presentationLabelKey){
 const type=spec.type||'triangular';
 return `<legend>${presentationLabelKey?localizedText(presentationLabelKey):esc(label)} · ${esc(unit)}</legend><label for="mc-${key}-type" class="mc-type-label">${localizedText(distributionKeys.Distribution)}<select id="mc-${key}-type" data-mc-type="${key}">${Object.entries(types).map(([value,name])=>`<option data-i18n="${distributionKeys[name]}" value="${value}" ${value===type?'selected':''}>${esc(t(distributionKeys[name]))}</option>`).join('')}</select></label><div class="mc-driver-parameters">${(distributionParts[type]||distributionParts.triangular).map(part=>`<label for="mc-${key}-${part}">${localizedText(distributionKeys[names[part]])}${type==='normal'&&part==='sd'&&scale===100?' · '+localizedText(distributionKeys['percentage points']):''}<input id="mc-${key}-${part}" data-mc-driver="${key}" data-mc-part="${part}" type="number" step="${scale===100?'.1':'.05'}" value="${num(spec[part],scale)}" inputmode="decimal" aria-describedby="mc-shape-note-${key}"></label>`).join('')}</div><div id="mc-shape-${key}" class="mc-shape-preview">${renderDistributionPreview(spec,scale,unit,validationKey,key)}</div><p data-i18n="distribution.note.${type}" id="mc-shape-note-${key}" class="mc-shape-note">${type==='normal'?'Mean and standard deviation describe the normal before truncation. The bounded draws can have different moments.':type==='fixed'?'This driver has no simulated variation.':type==='uniform'?'The endpoints are hard bounds; no central value is preferred.':'The mode is a judgment about the most likely input, not a fitted estimate.'}</p>`;
}
