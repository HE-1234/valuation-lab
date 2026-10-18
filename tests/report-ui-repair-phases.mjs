// Narrow synthetic fixture adapted from the shipped UI test, extended by independent regression cases.
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const strip=s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
function phaseAPI({type='capital',values=[3,6,10],rebuild=false}={}){
 const byId=new Map(),events=[],documentEvents=new Map(),captureEvents=[];let current,rebuilt=false;
 const document={activeElement:null,addEventListener(n,fn){documentEvents.set(n,fn);},documentElement:{setPointerCapture(id){captureEvents.push(['capture',id]);this.pointer=id;},hasPointerCapture(id){return this.pointer===id;},releasePointerCapture(id){captureEvents.push(['release',id]);this.pointer=null;}},querySelectorAll:()=>[],getElementById:id=>byId.get(id),createElement:tag=>new Node(tag)};
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.listeners={};this.parts={};this.isConnected=true;this.clientWidth=300;this.value='';const c=new Set();this.classList={add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x),toggle:(x,force)=>{const on=force??!c.has(x);on?c.add(x):c.delete(x);return on;}};}
  set innerHTML(value){if(value.includes('rx-ph-track'))for(const k of ['track','bands','axis','hint'])this.parts['.rx-ph-'+k]=new Node(k);if(value.includes('rx-ph-tag'))this.parts['.rx-ph-tag']=new Node('tag');}
  querySelector(s){return this.parts[s]||null;}
  append(child){this.children.push(child);child.parent=this;}
  addEventListener(n,fn){this.listeners[n]=fn;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  removeAttribute(k){delete this.attrs[k];}
  focus(){document.activeElement=this;}
  closest(s){return this.tag==='button'&&s==='.rx-ph-handle'?this:null;}
  getBoundingClientRect(){return {left:0,width:300};}
  setPointerCapture(){}
  remove(){this.isConnected=false;}
 }
 let api;
 function section(vals){
  const s=new Node('section'),keys=type==='capital'?['earlyEndYear','fadeStartYear','terminalYear']:['interimYear','declineStartYear','terminalYear'];
  s.fields=keys.map((key,i)=>{const f=new Node('input');f.id='phase-'+key;f.value=String(vals[i]);f.closest=()=>current;f.dispatchEvent=e=>{events.push([key,e.type,f.value]);if(e.type==='input'){f.focus();if(rebuild&&(rebuild==='always'||!rebuilt)){rebuilt=true;s.isConnected=false;current=section(s.fields.map(x=>Number(x.value)));}}};byId.set(f.id,f);return f;});
  return s;
 }
 const context={document,Event,onScan(){},animatePresentation(){},getLocale:()=> 'en',matchMedia:()=>({matches:true}),requestAnimationFrame(){}};
 vm.runInNewContext(strip(read('dist/skins/report-phases.js'))+'\nglobalThis.api={bounds,write,build,paint,timelines};',context);api=context.api;
 current=section(values);
 const kind={strict:type==='capital',section:'.phase',keys:current.fields.map(x=>x.id.replace('phase-','')),field:(s,k)=>s.fields.find(f=>f.id==='phase-'+k),place:(s,el)=>{s.timeline=el;},phases:()=>[]};
 const state=api.build(current,kind);api.paint(current);
 const key=(index,key)=>{state.handles[index].focus();state.el.listeners.keydown({target:state.handles[index],key,preventDefault(){}});};
 return {api,document,documentEvents,captureEvents,state,key,events,get current(){return current;},kind};
}

export {phaseAPI};
