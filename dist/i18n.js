/** Explicit presentation-only localization. Never changes model or user state. */
export const supportedLocales = Object.freeze(['en', 'zh-Hans']);
export const localeStorageKey = 'valuation-lab-locale';
const catalogs = new Map(), listeners = new Set(), bindings = new Set(), diagnostics = new Map();
const textBindings=new WeakMap(), attributeBindings=new WeakMap();
let locale = 'en';
try {
 const saved = globalThis.localStorage?.getItem(localeStorageKey);
 // A previous Chinese choice follows the corrected Simplified Chinese edition.
 // Only the independent locale preference is migrated; financial state is untouched.
 if (saved === 'zh-Hant') { locale = 'zh-Hans'; try { globalThis.localStorage?.setItem(localeStorageKey, locale); } catch {} }
 else if (supportedLocales.includes(saved)) locale = saved;
} catch {}
const record = (kind, key, detail = '') => diagnostics.set(`${kind}:${key}:${detail}`, {kind,key,detail});
const tokens = value => [...String(value).matchAll(/\{([A-Za-z][\w]*)\}/g)].map(match=>match[1]).sort();
const equalTokens = (a,b) => JSON.stringify([...new Set(tokens(a))]) === JSON.stringify([...new Set(tokens(b))]);
export function registerCatalog(namespace, entries) {
 if (!/^[a-z][a-z0-9-]*$/i.test(namespace) || !entries?.en || !entries?.['zh-Hans']) throw new TypeError('Invalid localization catalog');
 const previous = catalogs.get(namespace) || {en:{},'zh-Hans':{}};
 const next = {en:{...previous.en,...entries.en},'zh-Hans':{...previous['zh-Hans'],...entries['zh-Hans']}};
 for (const [key, english] of Object.entries(next.en)) {
  if (typeof english !== 'string') throw new TypeError(`Non-string localization entry ${namespace}.${key}`);
  const chinese = next['zh-Hans'][key];
  if (typeof chinese !== 'string') record('missing-translation',`${namespace}.${key}`);
  else if (!equalTokens(english,chinese)) throw new TypeError(`Localization parameter mismatch: ${namespace}.${key}`);
 }
 for(const key of Object.keys(next['zh-Hans'])) if(!Object.hasOwn(next.en,key)) throw new TypeError(`Missing English localization entry: ${namespace}.${key}`);
 catalogs.set(namespace,next);
 refreshBindings();
 return namespace;
}
export function getLocale() { return locale; }
export function escapeLocalizedText(value) {
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
/** Explicit translated leaf markup for authored HTML templates. Params are display-only. */
export function localizedText(key,params={}) {
 return `<span data-i18n="${escapeLocalizedText(key)}" data-i18n-params="${escapeLocalizedText(JSON.stringify(params))}">${escapeLocalizedText(t(key,params))}</span>`;
}
export function t(key, params = {}) {
 const dot = key.indexOf('.'), namespace = key.slice(0,dot), name = key.slice(dot+1), catalog = catalogs.get(namespace);
 let message = catalog?.[locale]?.[name];
 if (typeof message !== 'string') { record('missing-key',key,locale); message = catalog?.en?.[name]; }
 if (typeof message !== 'string') return key;
 return message.replace(/\{([A-Za-z][\w]*)\}/g,(token,name)=>{
  if(!Object.hasOwn(params,name) || params[name] === undefined || params[name] === null){record('missing-parameter',key,name);return token;}
  return String(params[name]);
 });
}
export function getMissingTranslations() { return [...diagnostics.values()]; }
export function clearTranslationDiagnostics() { diagnostics.clear(); }
function refreshBindings() { for(const binding of bindings) { try{binding();}catch(error){record('binding-error','binding',String(error?.message||error));} } }
export function onLocaleChange(callback) {
 if(typeof callback!=='function')throw new TypeError('Locale listener must be a function');
 listeners.add(callback); return ()=>listeners.delete(callback);
}
export function setLocale(next) {
 if(!supportedLocales.includes(next)||next===locale)return false;
 const previousLocale=locale; locale=next;
 try{globalThis.localStorage?.setItem(localeStorageKey,locale);}catch{}
 if(globalThis.document?.documentElement)globalThis.document.documentElement.lang=locale;
 refreshBindings();
 const detail={locale,previousLocale};
 for(const listener of listeners) { try{listener(detail);}catch(error){record('listener-error',listener.name||'anonymous',String(error?.message||error));} }
 if(globalThis.window?.dispatchEvent && typeof globalThis.CustomEvent==='function')globalThis.window.dispatchEvent(new CustomEvent('valuation:locale-change',{detail}));
 return true;
}
function bind(update,node) {
 let wasConnected=node?.isConnected===true,active=true;
 const refresh=()=>{
  if(!active)return;
  if(node?.isConnected===true)wasConnected=true;
  else if(wasConnected && node?.isConnected===false){bindings.delete(refresh);return;}
  update();
 };
 bindings.add(refresh);refresh();
 const dispose=()=>{active=false;bindings.delete(refresh);};
 dispose.refresh=()=>{if(active){bindings.add(refresh);refresh();}};
 return dispose;
}
export function bindText(node,key,params={}) {
 if(!node || (node.nodeType!==3 && node.children?.length))throw new TypeError('Bind a Text node or text-only leaf; never a control container');
 if(node.nodeType!==3 && /^(INPUT|TEXTAREA|SCRIPT|STYLE)$/i.test(node.tagName||''))throw new TypeError('Cannot translate input values or executable content');
 // An option without a value inherits its visible text. Freeze its original identity.
 if(node.tagName==='OPTION' && !node.hasAttribute('value'))node.setAttribute('value',node.value);
 textBindings.get(node)?.();
 const dispose=bind(()=>{const value=t(key,typeof params==='function'?params():params); if(node.nodeType===3)node.data=value;else node.textContent=value;},node);
 textBindings.set(node,dispose);return dispose;
}
const attributes = new Set(['aria-label','aria-description','title','placeholder','alt']);
export function bindAttribute(node,attribute,key,params={}) {
 if(!attributes.has(attribute))throw new TypeError('Only presentation attributes may be localized');
 const existing=attributeBindings.get(node)||new Map();existing.get(attribute)?.();
 const dispose=bind(()=>node.setAttribute(attribute,t(key,typeof params==='function'?params():params)),node);existing.set(attribute,dispose);attributeBindings.set(node,existing);return dispose;
}
const marked = new WeakMap();
export function localizeMarkedNodes(root=globalThis.document) {
 if(!root?.querySelectorAll)return ()=>{};
 const selector=['[data-i18n]',...[...attributes].map(name=>`[data-i18n-${name}]`)].join(',');
 const nodes=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)], disposers=[];
 for(const node of nodes){
  const signature=['data-i18n','data-i18n-params',...[...attributes].map(name=>'data-i18n-'+name)].map(name=>node.getAttribute(name)).join('\u0000');
  const existing=marked.get(node);
  if(existing?.signature===signature){existing.refresh();continue;}
  if(existing)existing.dispose();
  const own=[];
  let params={};
  if(node.hasAttribute('data-i18n-params')){try{params=JSON.parse(node.getAttribute('data-i18n-params'));if(!params||typeof params!=='object'||Array.isArray(params))throw Error('Invalid parameters');}catch{record('invalid-parameters',node.getAttribute('data-i18n')||'attribute');params={};}}
  if(node.hasAttribute('data-i18n')) {
   own.push(bindText(node,node.getAttribute('data-i18n'),params));
  }
  for(const attribute of attributes){const key=node.getAttribute(`data-i18n-${attribute}`);if(key)own.push(bindAttribute(node,attribute,key,params));}
  const dispose=()=>{own.forEach(fn=>fn());marked.delete(node);};marked.set(node,{dispose,signature,refresh:()=>own.forEach(fn=>fn.refresh?.())});disposers.push(dispose);
 }
 return ()=>disposers.forEach(fn=>fn());
}
if(globalThis.document?.documentElement)globalThis.document.documentElement.lang=locale;
