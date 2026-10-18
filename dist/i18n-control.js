import {registerCatalog,getLocale,setLocale,onLocaleChange,localizeMarkedNodes,t} from './i18n.js';
import {en,zh} from './locales/shell.js';
registerCatalog('shell',{en,'zh-Hant':zh});
export function mountLocaleControl(document=globalThis.document) {
 if(!document?.body)return;
 let control=document.getElementById('locale-corner');
 if(!control){control=document.createElement('button');control.id='locale-corner';control.type='button';control.className='locale-corner';document.body.append(control);}
 // The independent button shows its target language; its node stays mounted.
 const refresh=()=>{const chinese=getLocale()==='zh-Hant';control.dataset.locale=getLocale();control.textContent=chinese?'EN':'中文';control.setAttribute('lang',chinese?'en':'zh-Hant');control.setAttribute('aria-label',t(chinese?'shell.locale.english':'shell.locale.chinese'));control.setAttribute('title',t(chinese?'shell.locale.english':'shell.locale.chinese'));};
 control.onclick=()=>setLocale(getLocale()==='en'?'zh-Hant':'en');refresh();onLocaleChange(refresh);
 localizeMarkedNodes(document);
 return control;
}
