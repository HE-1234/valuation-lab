// Execute the shipped workspace against a deliberately small DOM and injected
// storage/fetch. This verifies behavior, not browser layout or accessibility.
import fs from 'node:fs';
import {mountResearchWorkspace} from '../dist/research-view.js';
import {RESEARCH_PATH,RESEARCH_STORAGE_PREFIX} from '../dist/research-model.js';

const decode=value=>String(value).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const voidTags=new Set(['input','br','hr','img','meta','link','area','source','wbr']);
const dataKey=name=>name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());

export function minimalDocument(){
 let focused=null;
 function matches(element,selector){
  const chunks=selector.match(/(?:\[[^\]]+\]|[#.][\w-]+|^[\w-]+)/g)||[];
  if(!chunks.length)return false;
  return chunks.every(chunk=>{
   if(chunk[0]==='#')return element.attrs.id===chunk.slice(1);
   if(chunk[0]==='.')return (element.attrs.class||'').split(/\s+/).includes(chunk.slice(1));
   if(chunk[0]==='['){const m=chunk.match(/^\[([^=\]]+)(?:=["']?([^"'\]]*)["']?)?\]$/);return !!m&&m[1] in element.attrs&&(m[2]===undefined||element.attrs[m[1]]===m[2]);}
   return element.tag===chunk.toLowerCase();
  });
 }
 class Element{
  constructor(tag='div',attrs={}){
   this.tag=tag;this.tagName=tag.toUpperCase();this.attrs=attrs;
   this.dataset=Object.fromEntries(Object.entries(attrs).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[dataKey(key),value]));
   this.children=[];this.parent=null;this.value=attrs.value??'';this.checked='checked'in attrs;this.hidden='hidden'in attrs;this.disabled='disabled'in attrs;
   this._html='';this._text='';this.innerHTMLWrites=0;
  }
  get id(){return this.attrs.id||'';}
  get parentElement(){return this.parent;}
  get isConnected(){return this===document.root||!!this.parent?.isConnected;}
  get classList(){return {contains:name=>(this.attrs.class||'').split(/\s+/).includes(name)};}
  contains(element){return element===this||this.descendants().includes(element);}
  set innerHTML(html){
   if(focused&&focused!==this&&this.contains(focused))focused=null;
   for(const child of this.children)child.parent=null;
   this._html=String(html);this.children=[];this._text='';this.innerHTMLWrites++;
   const stack=[this];
   for(const token of this._html.match(/<[^>]+>|[^<]+/g)||[]){
    if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
    if(token.startsWith('<')){
     if(token.startsWith('<!'))continue;
     const m=token.match(/^<([\w-]+)\b([\s\S]*?)\/?\s*>$/);if(!m)continue;
     const attrs=Object.fromEntries([...m[2].matchAll(/([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(x=>[x[1],decode(x[2]??x[3]??x[4]??'')]));
     const element=new Element(m[1].toLowerCase(),attrs);element.parent=stack.at(-1);element.parent.children.push(element);
     if(!voidTags.has(element.tag)&&!token.endsWith('/>'))stack.push(element);
    }else stack.at(-1)._text+=decode(token);
   }
   for(const select of this.querySelectorAll('select'))select.value=(select.children.find(child=>'selected'in child.attrs)||select.children[0])?.value||'';
   for(const textarea of this.querySelectorAll('textarea'))textarea.value=textarea.textContent;
  }
  get innerHTML(){return this._html;}
  set textContent(value){
   if(focused&&focused!==this&&this.contains(focused))focused=null;
   for(const child of this.children)child.parent=null;
   this._text=String(value);this.children=[];this._html='';
  }
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
  descendants(){return this.children.flatMap(child=>[child,...child.descendants()]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){return this.descendants().filter(element=>matches(element,selector));}
  setAttribute(name,value){this.attrs[name]=String(value);if(name.startsWith('data-'))this.dataset[dataKey(name)]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  click(){if(!this.disabled)return this.onclick?.({target:this,preventDefault(){}});}
  focus(){focused=this;}
  scrollIntoView(){}
 }
 const document={root:null,get activeElement(){return focused;},createElement:tag=>new Element(tag),querySelector:selector=>document.root.querySelector(selector),querySelectorAll:selector=>document.root.querySelectorAll(selector)};
 document.root=new Element('div',{id:'minimal-document'});
 return document;
}

export const bundledResearch=()=>JSON.parse(fs.readFileSync(new URL('../dist/data/renewed-research-2026-10-17/cases.json',import.meta.url),'utf8'));

export async function startResearchWorkspace({storage=new Map(),storageBlocked=false,readBlocked=storageBlocked,writeBlocked=storageBlocked,library=bundledResearch(),fetcher,simulationMount}={}){
 const document=minimalDocument(),root=document.root,reads=[],writes=[],requests=[],downloads=[];
 const storageAPI={
  getItem(key){reads.push(key);if(readBlocked)throw Error('Storage read blocked');return storage.has(key)?storage.get(key):null;},
  setItem(key,value){writes.push({key,value});if(writeBlocked)throw Error('Storage write blocked');storage.set(key,value);}
 };
 const workspace=await mountResearchWorkspace(root,{
  fetcher:fetcher|| (async path=>{requests.push(path);if(path!==RESEARCH_PATH)throw Error('Unexpected fetch '+path);return {ok:true,json:async()=>structuredClone(library)};}),
  storage:storageAPI,simulationMount,download:(name,value)=>downloads.push({name,value:structuredClone(value)})
 });
 const get=selector=>root.querySelector(selector);
 const requireElement=selector=>{const element=get(selector);if(!element)throw Error('Missing workspace control '+selector);return element;};
 return {
  ...workspace,document,root,get,storage,reads,writes,requests,downloads,library,
  focus:()=>document.activeElement,
  saved(ticker=workspace.getState().company.ticker){const raw=storage.get(RESEARCH_STORAGE_PREFIX+ticker);return raw===undefined?undefined:JSON.parse(raw);},
  input(selector,value){const element=requireElement(selector);element.value=String(value);return element.oninput?.({target:element});},
  change(selector,value){const element=requireElement(selector);element.value=String(value);return element.onchange?.({target:element});},
  action(name){return requireElement(`[data-research-action="${name}"]`).click();},
  select(ticker){return this.change('#research-company',ticker);},
  field(group,key,index){return `[data-research-input="${group}"][data-field="${key}"]${index===undefined?'':`[data-index="${index}"]`}`;}
 };
}
