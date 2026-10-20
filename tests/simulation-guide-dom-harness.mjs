// Executes the shipped simulation and guide over parsed shipped HTML. These
// bounded DOM/browser API shims do not synthesize nodes or prove native paint.
import fs from 'node:fs';
import vm from 'node:vm';
import {minimalDocument} from './research-workspace-harness.mjs';
import {mountSimulation} from '../dist/simulation-view.js';
import {currentSnapshot,draftFor} from '../dist/current-model.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {incrementalRecord} from '../dist/incremental-registry.js';
import {incrementalResearchDraft} from '../dist/incremental-research.js';
import {getLocale,onLocaleChange} from '../dist/i18n.js';
import {collectJointView} from '../dist/joint-simulation-config.js';
import {distributionQuantile,distributionSummary} from '../dist/simulation.js';
const emitter=()=>({listeners:new Map(),addEventListener(k,f){if(!this.listeners.has(k))this.listeners.set(k,new Set());this.listeners.get(k).add(f);},removeEventListener(k,f){this.listeners.get(k)?.delete(f);},dispatchEvent(e){for(const f of this.listeners.get(e.type)||[])f(e);}});
function browserDOM(document){
 const p=Object.getPrototypeOf(document.root),lists=s=>s.split(/,(?![^\[]*\])/).map(x=>x.trim());
 const attr=(n,k)=>n.getAttribute(k);
 const simple=(n,s,scope)=>{if(s===':scope')return n===scope;if(s==='*')return true;const parts=s.match(/\[[^\]]+\]|[#.][\w-]+|^[\w-]+/g)||[];return parts.length>0&&parts.every(x=>{if(x[0]==='#')return n.id===x.slice(1);if(x[0]==='.')return n.className.split(/\s+/).includes(x.slice(1));if(x[0]==='['){const m=x.match(/^\[([^\s=~$*^\]]+)(?:([~$*^]?=)["']?([^"'\]]*)["']?)?\]$/);if(!m)return false;const v=attr(n,m[1]);return v!==null&&(!m[2]||m[2]==='='&&v===m[3]||m[2]==='~='&&v.split(/\s+/).includes(m[3])||m[2]==='$='&&v.endsWith(m[3])||m[2]==='^='&&v.startsWith(m[3])||m[2]==='*='&&v.includes(m[3]));}return n.tag===x.toLowerCase();});};
 const matches=(n,s,scope)=>{const parts=s.match(/\[[^\]]+\]|[^\s>]+|>/g)||[];let i=parts.length-1;if(!simple(n,parts[i--],scope))return false;while(i>=0){let parent=n.parentElement;if(parts[i]==='>'){i--;if(!parent||!simple(parent,parts[i--],scope))return false;}else{while(parent&&!simple(parent,parts[i],scope))parent=parent.parentElement;if(!parent)return false;i--;}n=parent;}return true;};
 p.querySelectorAll=function(s){return this.descendants().filter(n=>lists(s).some(x=>matches(n,x,this)));};
 p.matches=function(s){return lists(s).some(x=>matches(this,x,this));};
 p.closest=function(s){for(let n=this;n;n=n.parentElement)if(n.matches(s))return n;return null;};
 const originalGet=p.getAttribute;p.getAttribute=function(k){const key=k.startsWith('data-')?k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()):null;return key&&key in this.dataset?String(this.dataset[key]):originalGet.call(this,k);};
 p.hasAttribute=function(k){return this.getAttribute(k)!==null;};
 p.append=function(...nodes){nodes.forEach(n=>this.appendChild(n));};p.prepend=function(n){this.insertBefore(n,this.children[0]||null);};p.after=function(n){this.parentElement?.insertBefore(n,this.nextSibling);};
 Object.defineProperties(p,{firstElementChild:{get(){return this.children[0]||null;}},previousElementSibling:{get(){return this.parentElement?.children[this.parentElement.children.indexOf(this)-1]||null;}},style:{get(){return this._style??={setProperty(k,v){this[k]=String(v);}};}},offsetParent:{get(){return this.checkVisibility()?this.parentElement:null;}},classList:{get(){const n=this;return {contains:k=>n.className.split(/\s+/).includes(k),add(...keys){n.className=[...new Set([...n.className.split(/\s+/).filter(Boolean),...keys])].join(' ');},remove(...keys){n.className=n.className.split(/\s+/).filter(k=>!keys.includes(k)).join(' ');},toggle(k,on){if(on===undefined)on=!this.contains(k);on?this.add(k):this.remove(k);return on;}};}}});
 p.checkVisibility=function(){if(!this.isConnected)return false;for(let n=this;n;n=n.parentElement){if(n.hidden)return false;if(n.tagName==='DETAILS'&&!n.open&&n!==this&&!n.querySelector(':scope > summary')?.contains(this))return false;}return true;};
 p.scrollIntoView=function(options){this.lastScroll=options;};p.scrollTo=function(options){this.lastScroll=options;this.scrollTop=options.top||0;};
 const nativeFocus=p.focus;p.focus=function(options){const before=document.activeElement;nativeFocus.call(this,options);if(before!==this){if(before)document.dispatch('focusout',{target:before,relatedTarget:this});document.dispatch('focusin',{target:this,relatedTarget:before});}};
 p.getBoundingClientRect=()=>({left:0,top:0,width:960,height:390,right:960,bottom:390});p.setPointerCapture=function(){};p.releasePointerCapture=function(){};
 p.dispatchEvent=function(e){if(!e.target)e.target=this;for(let n=this;n;n=e.bubbles?n.parentElement:null){e.currentTarget=n;n['on'+e.type]?.(e);for(const f of n.events.get(e.type)||[])f(e);}if(e.bubbles)document.dispatch(e.type,e);return !e.defaultPrevented;};
 p.click=function(){if(!this.disabled)this.dispatchEvent({type:'click',target:this,bubbles:true,preventDefault(){this.defaultPrevented=true;}});};
 document.getElementById=id=>document.root.querySelector('#'+id);document.createElementNS=(_,tag)=>document.createElement(tag);document.documentElement=document.root;document.body=document.root;document.hidden=false;document.documentElement.dataset.skin='report';return document;
}
export function guideFixture({ticker='GUIDE',research=false,phone=false,reduced=true,guide=true,configMutate,asyncRun=false,finePointer=!phone}={}){
 const names=['document','window','CustomEvent','matchMedia','addEventListener','removeEventListener','setTimeout','clearTimeout','requestAnimationFrame','cancelAnimationFrame','URL'];const saved=Object.fromEntries(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const document=browserDOM(minimalDocument()),root=document.createElement('main');document.root.append(root);const timers=new Map(),animations=[],runs=[],events=[],scans=[],subscriptions=[],exports=[];let id=0;
 const motion=Object.assign(emitter(),{matches:reduced}),size=Object.assign(emitter(),{matches:phone}),window=emitter();window.window=window;
 const setTimer=(fn,delay=0)=>{timers.set(++id,{fn,delay});return id;};const clearTimer=i=>timers.delete(i);
 const pointer=Object.assign(emitter(),{matches:finePointer});
 const matchMedia=q=>q.includes('reduced-motion')?motion:q.includes('hover:')?pointer:size;
 const p=Object.getPrototypeOf(root);p.animate=function(frames,options){const a={frames,options,state:'running',cancel(){this.state='cancelled';},pause(){this.state='paused';},play(){this.state='running';}};animations.push(a);return a;};
 Object.assign(globalThis,{document,window,matchMedia,CustomEvent:class{constructor(type,options={}){Object.assign(this,{type,...options});}},addEventListener:window.addEventListener.bind(window),removeEventListener:window.removeEventListener.bind(window),setTimeout:setTimer,clearTimeout:clearTimer,requestAnimationFrame:fn=>setTimer(fn,16),cancelAnimationFrame:clearTimer,URL:class extends globalThis.URL{static createObjectURL(blob){exports.push(blob);return 'blob:guide-test';}static revokeObjectURL(){}}});
 document.addEventListener('mc:state',e=>events.push({reason:e.detail.reason,state:e.target.mcState}));
 let snapshot,draft,adapter;
 if(research){const r=incrementalRecord(ticker);draft=incrementalResearchDraft({ticker,presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});configMutate?.(draft.researchSimulationConfig);adapter=annualResearchSimulationAdapter(draft);snapshot={ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId}};for(const k of ['simulate','simulateAsync']){const original=adapter[k].bind(adapter);adapter[k]=(...args)=>{const run={kind:k,config:structuredClone(args[0]),signal:args[1]?.signal};runs.push(run);const result=original(...args);if(result?.then)return result.then(r=>(run.result=r),e=>{run.error=e;throw e;});run.result=result;return result;};}}
 else{const company={ticker,name:'Parsed guide QA',currency:'USD'},raw={id:ticker+'-FY',snapshotMode:'annual-reference',periodEnd:'2025-12-31',filingDate:'2026-02-01',sourceUrl:'https://example.com/source',currency:'USD',revenue:1000,EBIT:100,cash:50,debt:100,shares:10,shareBasis:'same common share basis'};snapshot=currentSnapshot(company,raw);draft={...draftFor(company,raw),cutoff:'2026-10-17',bridgeReviewed:false,modelReviewed:false};}
 let guideAPI=null;
 if(guide){const source=fs.readFileSync(new URL('../dist/skins/report-mc-guide.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');const context={document,window,matchMedia,structuredClone,AbortController,getLocale,onLocaleChange:fn=>subscriptions.push(onLocaleChange(fn)),onScan:fn=>scans.push(fn),collectJointView,distributionQuantile,distributionSummary,setTimeout:setTimer,clearTimeout:clearTimer,requestAnimationFrame:globalThis.requestAnimationFrame};vm.runInNewContext(source+'\nglobalThis.guideAPI={isolate,job,summarise,samplingPrecision,samplingGuide,paint,onState,cache,get queue(){return queue},get busy(){return busy}};',context);guideAPI=context.guideAPI;}
 const destroy=mountSimulation(root,snapshot,draft,{adapter,synchronous:!asyncRun,autoplay:false,onConfigChange:c=>{if(research)draft.researchSimulationConfig=c;else draft.simulationConfig=c;}});
 const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 const flush=async(limit=5000)=>{for(let i=0;i<limit;i++){await settle();const task=[...timers].find(([,t])=>t.delay<9000);if(!task){await settle();if(![...timers].some(([,t])=>t.delay<9000))return;continue;}timers.delete(task[0]);task[1].fn();}throw Error('Guide timers did not settle');};
 return {root,document,snapshot,draft,adapter,runs,events,guideAPI,timers,animations,motion,size,exports,destroy,settle,flush,async step(){await settle();const task=[...timers].find(([,t])=>t.delay<9000);if(task){timers.delete(task[0]);task[1].fn();}await settle();},scan(){for(const f of scans)f();},get:s=>root.querySelector(research?s.replace(/^#mc-/,'#research-mc-'):s),cleanup(){destroy();root.remove();guideAPI?.busy?.controller.abort();timers.clear();subscriptions.forEach(f=>f?.());for(const [k,d]of Object.entries(saved))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}};
}
