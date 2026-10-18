import {en as reviewEn,zh as reviewZh} from './terminal-review-messages.js';
/** Only call at authored research presentation boundaries. Never translate user inputs or source quotes. */
import {registerCatalog,localizedText,escapeLocalizedText,t} from './i18n.js';
import en from './locales/research-prose.en.js';
import zh from './locales/research-prose.zh-Hans.js';
const authoredEn={...en,...reviewEn};
registerCatalog('research-prose',{en:authoredEn,'zh-Hans':{...zh,...reviewZh}});
const keys=new Map(Object.entries(authoredEn).map(([key,value])=>[value,key]));
export function authoredResearchTextHTML(value) {
 const text=String(value??''),key=keys.get(text);
 return key ? localizedText(`research-prose.${key}`) : escapeLocalizedText(text);
}
export function authoredResearchText(value) {
 const text=String(value??''),key=keys.get(text);
 return key ? t(`research-prose.${key}`) : text;
}
/** For an explicitly authored accessible-name boundary, never arbitrary DOM content. */
export function authoredResearchMessage(value) {
 const key=keys.get(String(value??''));return key?{key:`research-prose.${key}`,params:{}}:null;
}
