/** Standalone research-page presentation only. No model/source data imports. */
import {registerCatalog,localizeMarkedNodes,bindText,getLocale,onLocaleChange} from './i18n.js';
import {mountLocaleControl} from './i18n-control.js';
const base=new URL('./locales/',import.meta.url);
registerCatalog('research-page-ui',{
 en:{partial:'Traditional Chinese translation of this page is incomplete. Untranslated authored research remains in English. Switch to English to read the complete original.',unavailable:'The translation could not load. The original English research remains available.'},
 'zh-Hant':{partial:'本頁的繁體中文翻譯尚未完成，未翻譯的研究內容仍以英文呈現。可切換 English 查看完整英文原文。',unavailable:'翻譯目前無法載入，仍可閱讀原始英文研究內容。'}
});
let partial=false,failed=false;
try {
 const [en,zh,coverage]=await Promise.all(['research-pages.en.json','research-pages.zh-Hant.json','research-pages-coverage.json'].map(async name=>{
  const response=await fetch(new URL(name,base));
  if(!response.ok)throw new Error(`Research translations unavailable: ${response.status}`);
  return response.json();
 }));
 registerCatalog('research-pages',{en,'zh-Hant':zh});
 // Titles are text-only DOM leaves; never insert invalid spans in the HTML head.
 const title=document.querySelector('title');
 const titleKey=title&&Object.keys(en).find(key=>en[key]===title.textContent);
 if(titleKey)bindText(title,`research-pages.${titleKey}`);
 localizeMarkedNodes(document);
 const rootURL=new URL('./',import.meta.url);
 const page=decodeURIComponent(location.pathname).slice(decodeURIComponent(rootURL.pathname).length);
 partial=coverage.pages.find(item=>item.page===page)?.complete!==true;
} catch(error) {
 // Leave the original research readable. Failure must not replace evidence with blank text.
 failed=true;
 console.warn('Research-page translation could not load.',error);
}
if(partial||failed){
 const notice=document.createElement('aside');notice.className='research-translation-notice';notice.setAttribute('role','status');
 notice.style.cssText='padding:12px 16px;margin:12px auto;max-width:1100px;border:1px solid currentColor;border-radius:8px;font:14px/1.65 system-ui,sans-serif;';
 document.body.prepend(notice);
 bindText(notice,`research-page-ui.${failed?'unavailable':'partial'}`);
 const refresh=()=>{notice.hidden=getLocale()!=='zh-Hant';};refresh();onLocaleChange(refresh);
}
mountLocaleControl(document);
