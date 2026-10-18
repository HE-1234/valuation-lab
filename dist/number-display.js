// Presentation policy only. Model numbers and exports retain their full precision.
export function displayNumber(value,digits=2,{grouping=true,missing='—'}={}){
 if(typeof value!=='number'||!Number.isFinite(value))return missing;
 const places=Math.max(0,Math.min(2,Number.isFinite(digits)?Math.trunc(digits):2));
 // Never make a nonzero uncertainty or capital input look exactly zero.
 const scientific=value!==0&&Math.abs(value)<10**-places;
 return value.toLocaleString('en-US',{maximumFractionDigits:places,useGrouping:grouping,notation:scientific?'scientific':'standard'}).replace('E','e');
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const raw=value=>Number.isFinite(value)?String(value):'';
const shown=(value,scale)=>Number.isFinite(value)?displayNumber(value*scale,2,{grouping:false,missing:''}):'';
const parsedInput=(input,text)=>{
 if(input.dataset?.precisionGrammar!=='annual')return Number(text);
 // Match the Annual editor's established conventional thousands grouping.
 const normalized=/^[+-]?(?:\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(text)?text.replaceAll(',',''):text;
 return /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(normalized)?Number(normalized):NaN;
};
export function precisionInputAttributes(value,scale=1,inputText){
 return `data-precision-value="${raw(value)}" data-precision-scale="${scale}" ${inputText===undefined?'':`data-precision-raw="${esc(inputText)}" `}value="${esc(Number.isFinite(value)?shown(value,scale):inputText??'')}"`;
}
// Untouched display and exact-edit representations both resolve to the original
// model number. Avoid a scale multiply/divide round trip for passive collection.
export function readPrecisionInput(input,scale=1){
 if(!input)return NaN;
 const text=String(input.value??'').trim(),data=input.dataset||{};
 if(data.precisionValue!==undefined){
  const model=data.precisionValue===''?NaN:Number(data.precisionValue),factor=Number(data.precisionScale)||1;
  if(text===shown(model,factor)||text===(data.precisionRaw??raw(model*factor)))return model;
 }
 return text===''?NaN:parsedInput(input,text)/scale;
}
export function setPrecisionInput(input,value,scale=1){
 if(!input)return;
 input.dataset.precisionValue=raw(value);input.dataset.precisionScale=String(scale);
 delete input.dataset.precisionRaw;input.value=shown(value,scale);
}
export function bindPrecisionInput(input){
 if(!input||input.dataset?.precisionValue===undefined)return;
 const priorInput=input.oninput,priorFocus=input.onfocus,priorBlur=input.onblur;
 // Call again only after replacing a field or its original input handler.
 if(priorInput?.precisionBound)return;
 input.onfocus=event=>{priorFocus?.call(input,event);input.value=input.dataset.precisionRaw??(input.dataset.precisionValue===''?'':raw(Number(input.dataset.precisionValue)*Number(input.dataset.precisionScale)));};
 input.onblur=event=>{priorBlur?.call(input,event);const value=Number(input.dataset.precisionValue);if(input.dataset.precisionValue!==''&&Number.isFinite(value))input.value=shown(value,Number(input.dataset.precisionScale));};
 const handler=function(event){const text=String(input.value??''),value=text.trim()===''?NaN:parsedInput(input,text.trim())/Number(input.dataset.precisionScale);input.dataset.precisionValue=raw(value);input.dataset.precisionRaw=text;return priorInput?.call(input,event);};
 handler.precisionBound=true;input.oninput=handler;
}
export function bindPrecisionInputs(root){root.querySelectorAll('[data-precision-value]').forEach(bindPrecisionInput);}
