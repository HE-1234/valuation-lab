import {registerCatalog} from './i18n.js';
import {mountLocaleControl} from './i18n-control.js';
import {en as indexEn,zh as indexZh,attributeEn,attributeZh} from './locales/index.js';
registerCatalog('index',{en:indexEn,'zh-Hans':indexZh});
registerCatalog('index-attribute',{en:attributeEn,'zh-Hans':attributeZh});
export {mountLocaleControl};
mountLocaleControl();

// Edition names are presentation labels; stable theme keys/palettes never change.
import {bindText,bindAttribute,t} from './i18n.js';
registerCatalog('theme',{en:{forest:'Glacier',slate:'Cobalt Ledger',midnight:'Night Edition',sand:'Graphite',plum:'Aubergine',ocean:'Pine',current:'{label}'},'zh-Hans':{forest:'冰川',slate:'钴蓝帐册',midnight:'夜色版',sand:'石墨',plum:'茄紫',ocean:'松绿',current:'{label}'}});
export function mountThemeLabels(document=globalThis.document,window=globalThis.window){
 if(!document?.querySelectorAll)return ()=>{};
 const disposers=[];
 for(const button of document.querySelectorAll('[data-theme-choice]')){
  const key=button.dataset?.themeChoice,label=button.querySelectorAll?.('span')?.[1];
  if(label&&['forest','slate','midnight','sand','plum','ocean'].includes(key)){disposers.push(bindText(label,'theme.'+key));disposers.push(bindAttribute(button,'aria-label','theme.'+key));}
 }
 const current=document.querySelector?.('#current-theme-name');
 const binding=current?bindText(current,'theme.current',()=>({label:t('theme.'+(document.documentElement?.dataset?.theme||'slate'))})):null;
 if(binding)disposers.push(binding);
 const refresh=()=>binding?.refresh();window?.addEventListener?.('valuation:theme-change',refresh);
 return ()=>{disposers.forEach(dispose=>dispose());window?.removeEventListener?.('valuation:theme-change',refresh);};
}
mountThemeLabels();
