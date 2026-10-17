// Minimal DOM execution fixture; deliberately not a layout, accessibility or browser oracle.
import fs from 'node:fs';
import * as engine from '../dist/engine.js';
import * as current from '../dist/current-model.js';
import * as history from '../dist/assumption-history.js';
import * as historyView from '../dist/history-view.js';
import {enterPanel as actualEnterPanel,cancelMotion,updateFeedback} from '../dist/motion.js';
import {prepareFlowTables} from '../dist/document-flow.js';
import {createContextualEvidencePanel} from '../dist/contextual-evidence.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const decode=v=>String(v).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const voidTags=new Set(['input','br','hr','img','meta','link','area','source','wbr']);
export async function startStudio({storage=new Map(),storageBlocked=false,historyMissing=false,baseCasesMissing=false,baseCases:customBaseCases,library:customLibrary,annualWorkspace,motion=false}={}){
 let focused=null;const mounts=[],downloads=[],entrances=[],timers=new Map();let timerId=0;
 const matches=(el,s)=>s==='*'?el.nodeType===1:s[0]==='#'?el.attrs.id===s.slice(1):s[0]==='.'?(el.attrs.class||'').split(/\s+/).includes(s.slice(1)):s[0]==='['?(()=>{const m=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return !!m&&m[1] in el.attrs&&(m[2]===undefined||el.attrs[m[1]]===m[2]);})():el.tag===s;
 class Element{
  constructor(tag='div',attrs={}){this.tag=tag;this.tagName=tag.toUpperCase();this.nodeType=tag==='#comment'?8:1;this.attrs=attrs;this.events=new Map();this.scrollTop=0;this.scrollLeft=0;this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));this.children=[];this.parent=null;this.value=attrs.value||'';this.checked='checked'in attrs;this.hidden='hidden'in attrs;this.disabled='disabled'in attrs;this._html='';this._text='';this.open=false;}
  get ownerDocument(){return document;}
  get id(){return this.attrs.id||'';} set id(v){this.attrs.id=v;}
  get className(){return this.attrs.class||'';} set className(v){this.attrs.class=v;}
  get parentElement(){return this.parent;} get parentNode(){return this.parent;}
  get nextSibling(){return this.parent?.children[this.parent.children.indexOf(this)+1]||null;}
  get isConnected(){return this===app||!!this.parent?.isConnected;}
  get classList(){return {contains:c=>(this.attrs.class||'').split(/\s+/).includes(c)};}
  contains(el){return el===this||this.descendants().includes(el);}
  appendChild(el){return this.insertBefore(el,null);}
  insertBefore(el,next){el.remove();const index=next?this.children.indexOf(next):-1;if(index<0)this.children.push(el);else this.children.splice(index,0,el);el.parent=this;return el;}
  remove(){if(this.parent){const i=this.parent.children.indexOf(this);if(i>=0)this.parent.children.splice(i,1);this.parent=null;}}
  replaceChildren(...children){for(const c of this.children)c.parent=null;this.children=[];this._html='';this._text='';for(const c of children)this.appendChild(c);}
  addEventListener(name,fn){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);}
  removeEventListener(name,fn){this.events.get(name)?.delete(fn);}
  dispatchEvent(event){for(const fn of this.events.get(event.type)||[])fn(event);}
  removeAttribute(k){delete this.attrs[k];}
  set innerHTML(html){this._html=html;this.children=[];this._text='';const stack=[this];for(const token of html.match(/<[^>]+>|[^<]+/g)||[]){if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}if(token.startsWith('<')){if(token.startsWith('<!'))continue;const m=token.match(/^<([\w-]+)\b([\s\S]*?)\/?\s*>$/);if(!m)continue;const attrs=Object.fromEntries([...m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(x=>[x[1],decode(x[2]??'')]));const el=new Element(m[1].toLowerCase(),attrs);el.parent=stack.at(-1);el.parent.children.push(el);if(!voidTags.has(el.tag)&&!token.endsWith('/>'))stack.push(el);}else stack.at(-1)._text+=decode(token);}
   for(const select of this.querySelectorAll('select'))select.value=(select.children.find(x=>'selected'in x.attrs)||select.children[0])?.value||'';
  }
  get innerHTML(){return this._html;}
  set textContent(s){this._text=String(s);this.children=[];this._html='';}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  descendants(){return this.children.flatMap(c=>[c,...c.descendants()]);}
  querySelector(s){return this.descendants().find(el=>matches(el,s))||null;}
  querySelectorAll(s){return this.descendants().filter(el=>matches(el,s));}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  click(){if(this.disabled)return;const e={type:'click',target:this,preventDefault(){}};this.dispatchEvent(e);return this.onclick?.(e);}
  focus(options){focused=this;this.focusOptions=options;}
  scrollIntoView(){}
 }
 const app=new Element('div',{id:'guided-app'});
 const docEvents=new Map();
 const document={get activeElement(){return focused;},defaultView:{matchMedia:()=>({matches:true})},createComment:()=>new Element('#comment'),addEventListener:(n,f)=>{if(!docEvents.has(n))docEvents.set(n,new Set());docEvents.get(n).add(f);},removeEventListener:(n,f)=>docEvents.get(n)?.delete(f),dispatchEvent:e=>{for(const f of docEvents.get(e.type)||[])f(e);},querySelector:s=>s==='#guided-app'?app:s==='#renewed-research-app'?(annualWorkspace||null):app.querySelector(s),querySelectorAll:s=>app.querySelectorAll(s),createElement:tag=>new Element(tag)};
 const localStorage={getItem:k=>{if(storageBlocked)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(storageBlocked)throw Error('blocked');storage.set(k,v);}};
 const library=customLibrary||JSON.parse(read('../dist/data/current-universe.json'));
 const baseCases=customBaseCases===undefined?JSON.parse(read('../dist/data/company-base-cases.json')):customBaseCases;
 const files={'company-base-cases':baseCases,'current-universe':library,'company-history':JSON.parse(read('../dist/data/company-history.json')),'current-market-references':JSON.parse(read('../dist/data/current-market-references.json'))};
 const fetch=async path=>({ok:!((historyMissing&&path.includes('company-history'))||(baseCasesMissing&&path.includes('company-base-cases'))),json:async()=>structuredClone(files[Object.keys(files).find(k=>path.includes(k))])});
 const deps={createContextualEvidencePanel,cancelMotion,updateFeedback,prepareFlowTables,...engine,...current,...history,...historyView,mountSimulation:(root,snapshot,draft,options)=>{const m={root,ticker:snapshot.ticker,sourceId:snapshot.raw.id,snapshot:structuredClone(snapshot),draft:structuredClone(draft),options,released:false};mounts.push(m);return()=>{m.released=true}},enterPanel:node=>{entrances.push(node);if(motion)return actualEnterPanel(node);},reducedMotion:()=>true,document,localStorage,fetch,URL:{createObjectURL:blob=>{downloads.push(blob);return'blob:fixture'},revokeObjectURL(){}},Blob,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
 const source=read('../dist/guided.js').replace(/^import .*;\n/gm,'');
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction(...Object.keys(deps),source)(...Object.values(deps));
 const get=s=>document.querySelector(s),state=(ticker='AAPL')=>{const c=library.companies.find(c=>c.ticker===ticker);const selection=JSON.parse(storage.get('valuation-lab-guided-selection')||'null');const id=selection?.ticker===ticker?selection.id:c.currentSnapshotId;return JSON.parse(storage.get(`valuation-lab-guided-v5:${ticker}:${id}`)||'null');};
 return {app,entrances,get,document,storage,library,baseCases,mounts,downloads,state,focus:()=>focused,step:n=>get(`[data-step="${n}"]`).click(),input:(s,value)=>{const el=get(s);if(!el)throw Error('Missing input '+s);el.value=String(value);return el.oninput?.({target:el});},change:(s,value)=>{const el=get(s);if(!el)throw Error('Missing change control '+s);el.value=String(value);return el.onchange?.({target:el});},flush(){const batch=[...timers.values()];timers.clear();for(const fn of batch)fn();},timers};
}
