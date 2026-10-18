import {incrementalMessageKeys} from './incremental-messages.js';
import {annualMetricMessageKeys} from './annual-metric-messages.js';
// Only explicitly authored, complete messages are eligible. User content is never scanned.
import {registerCatalog,t,localizedText,bindText,localizeMarkedNodes} from './i18n.js';
import {authoredResearchTextHTML,authoredResearchText} from './research-prose-i18n.js';
import {bindGuidedMessages} from './guided-localization.js';
import en from './locales/annual.en.js';
import zh from './locales/annual.zh-Hans.js';
registerCatalog('annual', {en, 'zh-Hans':zh});
const keys=new Map(Object.entries(en).map(([key,value])=>[value,'annual.'+key]));
for(const [text,key]of Object.entries({...annualMetricMessageKeys,...incrementalMessageKeys}))keys.set(text,key);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.entries(en).filter(([key,message])=>/[A-Za-z]{2}/.test(message.replace(/\{\w+\}/g,''))&&/\{\w+\}/.test(message)).map(([key,message])=>{
 const names=[];let cursor=0,source='';for(const match of message.matchAll(/\{([A-Za-z][\w]*)\}/g)){source+=escapeRegex(message.slice(cursor,match.index))+'(.*?)';names.push(match[1]);cursor=match.index+match[0].length;}source+=escapeRegex(message.slice(cursor));
 return {key:'annual.'+key,names,regex:new RegExp('^'+source+'$','s'),specificity:message.replace(/\{\w+\}/g,'').length};
}).sort((a,b)=>b.specificity-a.specificity);
export function annualMessage(source){const value=String(source??''),key=keys.get(value);if(key)return {key,params:{}};for(const pattern of patterns){const match=pattern.regex.exec(value);if(match){const params=Object.fromEntries(pattern.names.map((name,index)=>[name,match[index+1]]));if(Object.entries(params).some(([name,value])=>/^(year|years|horizon|early|count)$/.test(name)&&!/^\d[\d,.]*$/.test(value)))continue;return {key:pattern.key,params};}}return null;}
export const annualMessageKey=source=>keys.get(String(source??''));
export const annualLabel=(source,depth=0)=>{const message=annualMessage(source);return message?t(message.key,Object.fromEntries(Object.entries(message.params).map(([key,value])=>[key,depth<3?annualLabel(value,depth+1):value]))):authoredResearchText(source);};
export const annualTextHTML=source=>{const message=annualMessage(source);return message?localizedText(message.key,Object.fromEntries(Object.entries(message.params).map(([key,value])=>[key,annualLabel(value)]))):authoredResearchTextHTML(source);};
export const annualAttribute=(name,source)=>{const message=annualMessage(source);return message?` data-i18n-${name}="${message.key}" data-i18n-params="${escape(JSON.stringify(message.params))}"`:'';};
const statusNodes=new WeakMap();
const translatedKeys=new Map(Object.entries(zh).map(([key,value])=>[value,'annual.'+key]));
const localizedParameters=new Set(['label','status','scenario','name','share','claims','unit','basis']);
const sharedBindings=new WeakMap(),parameterSources=new WeakMap();
export function releaseAnnualPresentation(root){const bindings=sharedBindings.get(root);if(bindings){for(const dispose of bindings.values())dispose();bindings.clear();sharedBindings.delete(root);}}
const statusIds=['research-save-state','research-action-status','annual-input-origin','annual-scenario-state'];
export function localizeAnnualPresentation(root){
 for(const node of root.querySelectorAll?.('[data-annual-label]')||[])node.setAttribute('aria-label',annualLabel(node.getAttribute('data-annual-label')));
 let bindings=sharedBindings.get(root);if(!bindings){bindings=new Map();sharedBindings.set(root,bindings);}
 for(const [node,dispose] of bindings)if(!root.contains(node)){dispose();bindings.delete(node);}
 for(const selector of ['.margin-phase-controls','.margin-path-visual'])for(const node of root.querySelectorAll?.(selector)||[])if(!bindings.has(node))bindings.set(node,bindGuidedMessages(node));
 for(const node of root.querySelectorAll?.('[data-i18n-params]')||[]){
  const message=node.getAttribute('data-i18n')||node.getAttribute('data-i18n-aria-label');
  if(!message?.startsWith('annual.'))continue;
  try{const params=JSON.parse(node.getAttribute('data-i18n-params'));let changed=false;
   const source=parameterSources.get(node)||{};for(const name of localizedParameters){if(!Object.hasOwn(params,name))continue;const key=keys.get(params[name])||translatedKeys.get(params[name]);if(key){params[name]=t(key);changed=true;}else{if(!source[name]&&annualMessage(params[name]))source[name]=params[name];if(source[name]){params[name]=annualLabel(source[name]);changed=true;}}}parameterSources.set(node,source);
   if(changed)node.setAttribute('data-i18n-params',JSON.stringify(params));
  }catch{}
 }
 localizeMarkedNodes(root);
 // These are application-authored output leaves, not editable fields or imported prose.
 for(const id of statusIds){const node=root.querySelector?.('#'+id);if(!node||node.children?.length)continue;
  const current=node.textContent,old=statusNodes.get(node);
  if(old&&current===t(old.key,old.params?old.params():{}))continue;
  const key=annualMessageKey(current)||(old&&current===old.last?old.key:null);
  if(!key)continue;
  old?.dispose();const state={key,last:current};state.dispose=bindText(node,key);state.last=node.textContent;statusNodes.set(node,state);
 }
}
/** Bind only the caller-selected application status leaf; never an input. */
export function annualSetText(node,source){
 if(!node)return;
 const message=annualMessage(source);statusNodes.get(node)?.dispose();
 if(!message){node.textContent=String(source??'');statusNodes.delete(node);return;}
 if(node.children?.length)node.textContent='';
 const params=()=>Object.fromEntries(Object.entries(message.params).map(([key,value])=>[key,annualLabel(value)]));
 const state={key:message.key,last:source,params};
 state.dispose=bindText(node,message.key,params);state.last=node.textContent;statusNodes.set(node,state);
}

/** Table builders historically accept escaped text or renderer-owned markup. */
export function annualTableCellHTML(cell){
 if(typeof cell!=='string'||cell.includes('<'))return cell;
 const text=cell.replace(/&(amp|lt|gt|quot|#39);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[name]));
 return annualTextHTML(text);
}
