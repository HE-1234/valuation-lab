// Minimal DOM execution fixture; deliberately not a layout, accessibility or browser oracle.
import fs from 'node:fs';
import * as engine from '../dist/engine.js';
import * as current from '../dist/current-model.js';
import * as history from '../dist/assumption-history.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const decode=v=>String(v).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const voidTags=new Set(['input','br','hr','img','meta','link','area','source','wbr']);
export async function startStudio({storage=new Map(),storageBlocked=false,historyMissing=false,library:customLibrary}={}){
 let focused=null;const mounts=[],downloads=[],timers=new Map();let timerId=0;
 const matches=(el,s)=>s[0]==='#'?el.attrs.id===s.slice(1):s[0]==='.'?(el.attrs.class||'').split(/\s+/).includes(s.slice(1)):s[0]==='['?(()=>{const m=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return !!m&&m[1] in el.attrs&&(m[2]===undefined||el.attrs[m[1]]===m[2]);})():el.tag===s;
 class Element{
  constructor(tag='div',attrs={}){this.tag=tag;this.attrs=attrs;this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));this.children=[];this.parent=null;this.value=attrs.value||'';this.checked='checked'in attrs;this.hidden='hidden'in attrs;this._html='';this._text='';this.open=false;}
  set innerHTML(html){this._html=html;this.children=[];this._text='';const stack=[this];for(const token of html.match(/<[^>]+>|[^<]+/g)||[]){if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}if(token.startsWith('<')){if(token.startsWith('<!'))continue;const m=token.match(/^<([\w-]+)\b([\s\S]*?)\/?\s*>$/);if(!m)continue;const attrs=Object.fromEntries([...m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(x=>[x[1],decode(x[2]??'')]));const el=new Element(m[1].toLowerCase(),attrs);el.parent=stack.at(-1);el.parent.children.push(el);if(!voidTags.has(el.tag)&&!token.endsWith('/>'))stack.push(el);}else stack.at(-1)._text+=decode(token);}
   for(const select of this.querySelectorAll('select'))select.value=(select.children.find(x=>'selected'in x.attrs)||select.children[0])?.value||'';
  }
  get innerHTML(){return this._html;}
  set textContent(s){this._text=String(s);this.children=[];this._html='';}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  descendants(){return this.children.flatMap(c=>[c,...c.descendants()]);}
  querySelector(s){return this.descendants().find(el=>matches(el,s))||null;}
  querySelectorAll(s){return this.descendants().filter(el=>matches(el,s));}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  click(){return this.onclick?.({target:this});}
  focus(){focused=this;}
  scrollIntoView(){}
 }
 const app=new Element('div',{id:'guided-app'});
 const document={querySelector:s=>s==='#guided-app'?app:app.querySelector(s),querySelectorAll:s=>app.querySelectorAll(s),createElement:tag=>new Element(tag)};
 const localStorage={getItem:k=>{if(storageBlocked)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(storageBlocked)throw Error('blocked');storage.set(k,v);}};
 const library=customLibrary||JSON.parse(read('../dist/data/current-universe.json'));
 const files={'current-universe':library,'company-history':JSON.parse(read('../dist/data/company-history.json')),'current-market-references':JSON.parse(read('../dist/data/current-market-references.json'))};
 const fetch=async path=>({ok:!(historyMissing&&path.includes('company-history')),json:async()=>structuredClone(files[Object.keys(files).find(k=>path.includes(k))])});
 const deps={...engine,...current,...history,mountSimulation:(root,snapshot,draft,options)=>{const m={root,ticker:snapshot.ticker,sourceId:snapshot.raw.id,snapshot:structuredClone(snapshot),draft:structuredClone(draft),options,released:false};mounts.push(m);return()=>{m.released=true}},enterPanel:()=>{},reducedMotion:()=>true,document,localStorage,fetch,URL:{createObjectURL:blob=>{downloads.push(blob);return'blob:fixture'},revokeObjectURL(){}},Blob,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
 const source=read('../dist/guided.js').replace(/^import .*;\n/gm,'');
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction(...Object.keys(deps),source)(...Object.values(deps));
 const get=s=>document.querySelector(s),state=(ticker='AAPL')=>{const c=library.companies.find(c=>c.ticker===ticker);const selection=JSON.parse(storage.get('valuation-lab-guided-selection')||'null');const id=selection?.ticker===ticker?selection.id:c.currentSnapshotId;return JSON.parse(storage.get(`valuation-lab-guided-v5:${ticker}:${id}`)||'null');};
 return {app,get,storage,library,mounts,downloads,state,focus:()=>focused,step:n=>get(`[data-step="${n}"]`).click(),input:(s,value)=>{const el=get(s);if(!el)throw Error('Missing input '+s);el.value=String(value);return el.oninput?.({target:el});},change:(s,value)=>{const el=get(s);if(!el)throw Error('Missing change control '+s);el.value=String(value);return el.onchange?.({target:el});},flush(){const batch=[...timers.values()];timers.clear();for(const fn of batch)fn();},timers};
}
