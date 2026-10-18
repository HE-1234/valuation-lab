/** Standalone research-page presentation only. No model/source data imports. */
import {registerCatalog,localizeMarkedNodes,bindText,bindAttribute,getLocale,onLocaleChange} from './i18n.js';
import {mountLocaleControl} from './i18n-control.js';
import attributePairs from './locales/research-page-attributes.js';
import {markOriginalResearchLanguage} from './research-page-language.js';
import {researchPageCoverageForPath} from './research-page-route.js';
const attributeEntries=Object.entries(attributePairs);
registerCatalog('research-page-attributes',{en:Object.fromEntries(attributeEntries.map(([en],i)=>['label'+i,en])),'zh-Hant':Object.fromEntries(attributeEntries.map(([,zh],i)=>['label'+i,zh]))});
const attributeKeys=new Map(attributeEntries.map(([en],i)=>[en,'research-page-attributes.label'+i]));
const base=new URL('./locales/',import.meta.url);
registerCatalog('research-page-ui',{
 en:{originals:'Original source quotations are retained in English. The interface and authored research analysis are translated.',partial:'Traditional Chinese translation of this page is incomplete. Untranslated authored research remains in English. Switch to English to read the complete original.',unavailable:'The translation could not load. The original English research remains available.'},
 'zh-Hant':{originals:'原始來源引文保留英文；介面與研究分析提供繁體中文譯文。',partial:'本頁的繁體中文翻譯尚未完成，未翻譯的研究內容仍以英文呈現。可切換 English 查看完整英文原文。',unavailable:'翻譯目前無法載入，仍可閱讀原始英文研究內容。'}
});
let partial=false,failed=false,originalQuotations=0;
try {
 const [en,zh,coverage]=await Promise.all(['research-pages.en.json','research-pages.zh-Hant.json','research-pages-coverage.json'].map(async name=>{
  const response=await fetch(new URL(name,base));
  if(!response.ok)throw new Error(`Research translations unavailable: ${response.status}`);
  return response.json();
 }));
 registerCatalog('research-pages',{en,'zh-Hant':zh});
 for(const node of document.querySelectorAll('[aria-label]')) {
 const key=attributeKeys.get(node.getAttribute('aria-label'));
 if(key)bindAttribute(node,'aria-label',key);
}

 // Titles are text-only DOM leaves; never insert invalid spans in the HTML head.
 const title=document.querySelector('title');
 const titleKey=title&&Object.keys(en).find(key=>en[key]===title.textContent);
 if(titleKey)bindText(title,`research-pages.${titleKey}`);
 const rootURL=new URL('./',import.meta.url);
 const pageCoverage=researchPageCoverageForPath(coverage.pages,location.pathname,rootURL.pathname);
 partial=pageCoverage?.complete!==true;
 if(title&&!titleKey&&pageCoverage?.missingEnglishText?.includes(title.textContent))title.setAttribute('lang','en');
 originalQuotations=markOriginalResearchLanguage(document,pageCoverage?.missingEnglishText||[],Object.keys(en).filter(key=>en[key]===zh[key]).map(key=>en[key]));
 localizeMarkedNodes(document);
} catch(error) {
 // Leave the original research readable. Failure must not replace evidence with blank text.
 failed=true;
 document.body?.setAttribute('lang','en');
 console.warn('Research-page translation could not load.',error);
}
if(partial||failed){
 const notice=document.createElement('aside');notice.className='research-translation-notice';notice.setAttribute('role','status');
 notice.style.cssText='padding:12px 16px;margin:12px auto;max-width:1100px;border:1px solid currentColor;border-radius:8px;font:14px/1.65 system-ui,sans-serif;';
 document.body.prepend(notice);
 bindText(notice,`research-page-ui.${failed?'unavailable':'partial'}`);
 const refresh=()=>{notice.hidden=getLocale()!=='zh-Hant';notice.setAttribute('lang',getLocale());};refresh();onLocaleChange(refresh);
}
if(originalQuotations){
 const note=document.createElement('p');note.className='research-original-language-note';
 note.style.cssText='font:12px/1.6 system-ui,sans-serif;opacity:.75;margin:10px auto;max-width:1100px;padding:0 68px 0 16px;box-sizing:border-box;';
 document.body.prepend(note);bindText(note,'research-page-ui.originals');
 const refresh=()=>{note.hidden=getLocale()!=='zh-Hant';note.setAttribute('lang',getLocale());};refresh();onLocaleChange(refresh);
}
// A failed catalog load must not bind unknown research keys and replace original text.
const controlDocument=failed?{body:document.body,getElementById:id=>document.getElementById(id),createElement:tag=>document.createElement(tag),querySelectorAll:()=>[]}:document;
mountLocaleControl(controlDocument);
