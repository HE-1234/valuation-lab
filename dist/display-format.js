// Presentation only. No formatted value is ever written into a valuation draft.
export const isFiniteNumber=value=>typeof value==='number'&&Number.isFinite(value);
export function formatNumber(value,digits=1){return isFiniteNumber(value)?value.toLocaleString('en-US',{maximumFractionDigits:digits}):'Not computed';}
export function formatMoneyMillions(value,currency='USD'){
 if(!isFiniteNumber(value))return 'Not computed';
 const magnitude=Math.abs(value),unit=magnitude>=1e6?['T',1e6]:magnitude>=1e3?['B',1e3]:['M',1];
 const sign=value<0?'−':'',prefix=currency==='USD'?'$':currency==='TWD'?'NT$':currency+' ';
 return `${sign}${prefix}${formatNumber(Math.abs(value)/unit[1],2)}${unit[0]}`;
}
export function formatTimestamp(value){
 if(!value)return '';
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return String(value);
 const day=date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
 return String(value).includes('T')?`${day} · ${date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'})} UTC`:day;
}
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function compactAnnualPeriod(row){
 const text=String(row.period||'');
 if(/^\d{4}-\d{2}-\d{2}$/.test(text)){const date=new Date(text+'T00:00:00Z');if(Number.isFinite(date.getTime()))return date.toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'});}
 const match=text.match(/ending (?:approximately )?([A-Za-z]+) (\d{4})/i);
 if(match&&months.some(m=>m.toLowerCase()===match[1].toLowerCase())){
  const offset=Number(text.match(/plus (\d+) years?/)?.[1]||0);
  return `${match[1].slice(0,3)} ${Number(match[2])+offset}`;
 }
 if(/^(FY)?\d{4}$/.test(text))return text;
 return text||'Period not supplied';
}
export function parseDisplayedNumber(text){
 const value=String(text).trim();if(value==='')return null;
 // Commas are accepted only in conventional thousands groups. Never guess locale.
 const normalized=/^[+-]?(?:\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(value)?value.replaceAll(',',''):value;
 return /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(normalized)?Number(normalized):NaN;
}
export function comparisonText(current,starting,{money=false,currency='USD',unit='',label='from starting case'}={}){
 if(!isFiniteNumber(current)||!isFiniteNumber(starting))return '';
 const delta=current-starting,sign=delta>0?'+':delta<0?'−':'';
 const amount=money?formatMoneyMillions(Math.abs(delta),currency):formatNumber(Math.abs(delta),2)+unit;
 const percent=starting>0?` · ${sign}${formatNumber(Math.abs(delta/starting)*100,1)}%`:'';
 return `${sign}${amount}${percent} ${label}`;
}
