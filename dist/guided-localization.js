/** Presentation-only exact message bindings for Guided and its shared views.
 * Source templates define the complete allowlist. Never rewrites substrings,
 * input values, notes, URLs, model data, state, or an entire rendered subtree.
 */
import {registerCatalog,t,getLocale,bindText,bindAttribute} from './i18n.js';
import en from './locales/guided.en.js';
import zh from './locales/guided.zh-Hant.js';
import researchProsePairs from './locales/research-prose-pairs.js';
const english={...en,...Object.fromEntries(researchProsePairs.map(([english],index)=>['prose'+index,english]))};
const chinese={...zh,...Object.fromEntries(researchProsePairs.map(([,chinese],index)=>['prose'+index,chinese]))};
registerCatalog('guided',{en:{...english,boundary:'{prefix}{message}{suffix}',composition:'{first}{separator}{rest}',link:'{message} ↗'},'zh-Hant':{...chinese,boundary:'{prefix}{message}{suffix}',composition:'{first}{separator}{rest}',link:'{message} ↗'}});
const escapeRegExp=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const exact=new Map(),patterns=[];
for(const [key,message] of Object.entries(english)){
 const names=[];let cursor=0,pattern='';
 for(const match of message.matchAll(/\{([A-Za-z][\w]*)\}/g)){pattern+=escapeRegExp(message.slice(cursor,match.index))+'(.*?)';names.push(match[1]);cursor=match.index+match[0].length;}
 if(!names.length){exact.set(message,{key:'guided.'+key,params:{}});continue;}
 pattern+=escapeRegExp(message.slice(cursor));
 // Templates with no authored word must not match ticker, number or user data.
 if(!/[A-Za-z]{2}/.test(message.replace(/\{\w+\}/g,'')))continue;
 patterns.push({key:'guided.'+key,names,regex:new RegExp('^'+pattern+'$','s'),specificity:message.replace(/\{\w+\}/g,'').length});
}
patterns.sort((a,b)=>b.specificity-a.specificity);
const completeMessages=[...exact.keys()].filter(message=>message.length>18).sort((a,b)=>b.length-a.length);
export function matchGuidedMessage(value,depth=0){
 if(typeof value!=='string')return null;
 const text=value.trim();
 const yearDescription=text.match(/^((?:Year \d+: -?[\d,]+(?:\.\d+)?%)(?:; Year \d+: -?[\d,]+(?:\.\d+)?%)*)\. (.+)$/s);
 if(yearDescription)return {key:'guided.marginSequenceDescription',params:{years:yearDescription[1],source:yearDescription[2]}};
 const found=exact.get(text);if(found)return {...found,params:{}};
 for(const entry of patterns){const match=entry.regex.exec(text);if(match)return {key:entry.key,params:Object.fromEntries(entry.names.map((name,i)=>[name,match[i+1]]))};}
 // A generated join is localized only when its ENTIRE content is a sequence
 // of registered complete messages. Never partially substitute unknown prose.
 if(depth<8&&text.endsWith(' ↗')&&matchGuidedMessage(text.slice(0,-2),depth+1))return {key:'guided.link',params:{message:text.slice(0,-2)}};
 if(depth<8)for(const first of completeMessages){if(!text.startsWith(first))continue;const tail=text.slice(first.length),separator=tail.match(/^\s+/)?.[0];if(!separator)continue;const rest=tail.slice(separator.length);if(matchGuidedMessage(rest,depth+1))return {key:'guided.composition',params:{first,separator,rest}};}
 return null;
}
export function translateGuidedMessage(value,depth=0){
 if(typeof value==='string'&&/^Year \d+: -?[\d,]+(?:\.\d+)?%(?:; Year \d+: -?[\d,]+(?:\.\d+)?%)+$/.test(value))return value.split('; ').map(part=>translateGuidedMessage(part,depth+1)).join('; ');
 const match=matchGuidedMessage(value);if(!match)return value;
 const params=Object.fromEntries(Object.entries(match.params).map(([key,text])=>[key,depth<8?translateGuidedMessage(text,depth+1):text]));
 return t(match.key,params);
}
const roots=new WeakMap(),attributes=['aria-label','aria-description','title','placeholder','alt'];
const excluded=node=>node?.closest?.('textarea,input,script,style,[contenteditable="true"],[data-user-content],[data-i18n]');
/** Mount once on an owned app root. Its observer sees only that root and binds
 * only complete catalog messages; a locale switch never invokes a renderer.
 * Call the returned disposer before permanently removing the root.
 */
export function bindGuidedMessages(root,{observe=true}={}){
 if(!root?.ownerDocument?.createTreeWalker||!root.querySelectorAll)return ()=>{};
 for(let parent=root.parentElement;parent;parent=parent.parentElement)if(roots.has(parent))return ()=>{};
 if(roots.has(root)){roots.get(root).scan();return roots.get(root).dispose;}
 const records=new Map();let observer=null,disposed=false;
 function paramsFor(record){return Object.fromEntries(Object.entries(record.params).map(([key,value])=>[key,translateGuidedMessage(value)]));}
 function current(record){return record.attribute?record.node.getAttribute(record.attribute):record.node.data;}
 function output(record){return record.prefix+t(record.key,paramsFor(record))+record.suffix;}
 function apply(node,attribute=null){
  const value=attribute?node.getAttribute(attribute):node.data;if(typeof value!=='string'||!value.trim())return;
  const id=attribute||'text',map=records.get(node),old=map?.get(id);
  if(old&&value===output(old))return;
  if(old){old.dispose();map.delete(id);}
  const match=matchGuidedMessage(value);if(!match)return;
  const record={node,attribute,...match,prefix:value.match(/^\s*/)[0],suffix:value.match(/\s*$/)[0]};
  // Bind directly to the existing text node. The whitespace is part of the
  // original UI boundary and remains stable in both languages.
  if(!attribute&&node.parentElement?.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.setAttribute('value',node.parentElement.value);
  const parameters=()=>({prefix:record.prefix,message:t(record.key,paramsFor(record)),suffix:record.suffix});
  if(attribute)record.dispose=bindAttribute(node,attribute,'guided.boundary',parameters);
  else record.dispose=bindText(node,'guided.boundary',parameters);
  const target=map||new Map();target.set(id,record);records.set(node,target);
 }
 function scan(){
  if(disposed)return;
  for(const [node,map]of records)if(!root.contains(node)){for(const r of map.values())r.dispose();records.delete(node);}
  const walker=root.ownerDocument.createTreeWalker(root,4);let node;
  while((node=walker.nextNode()))if(!excluded(node.parentElement))apply(node);
  for(const element of [root,...root.querySelectorAll('*')]){
   if(element.closest?.('script,style,[contenteditable="true"],[data-user-content]'))continue;
   for(const name of attributes)if(element.hasAttribute(name)&&!element.hasAttribute('data-i18n-'+name))apply(element,name);
  }
 }
 function dispose(){disposed=true;observer?.disconnect();for(const map of records.values())for(const r of map.values())r.dispose();records.clear();roots.delete(root);}
 roots.set(root,{scan,dispose});scan();
 const Mutation=root.ownerDocument.defaultView?.MutationObserver||globalThis.MutationObserver;
 if(observe&&Mutation){observer=new Mutation(scan);observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});}
 return dispose;
}
