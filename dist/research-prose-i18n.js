/** Only call at authored research presentation boundaries. Never translate user inputs or source quotes. */
import {registerCatalog,localizedText,escapeLocalizedText,t} from './i18n.js';
import en from './locales/research-prose.en.js';
import zh from './locales/research-prose.zh-Hant.js';
registerCatalog('research-prose',{en,'zh-Hant':zh});
const keys=new Map(Object.entries(en).map(([key,value])=>[value,key]));
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
