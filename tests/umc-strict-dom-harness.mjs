// Parsed shipped HTML, with strict selectors inherited unchanged from the research
// workspace fixture. The isolated selector-list shim only unions real parsed
// nodes; absent IDs still return null. No shim manufactures missing controls.
// This is DOM lifecycle coverage, not browser paint or native-input evidence.
import fs from 'node:fs';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {incrementalPackages} from '../dist/incremental-registry.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {mountSimulation} from '../dist/simulation-view.js';

const catalogBundle=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url)));
const emitter=()=>({listeners:new Map(),addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);},removeEventListener(type,listener){this.listeners.get(type)?.delete(listener);},dispatch(type,event={}){for(const listener of this.listeners.get(type)||[])listener(event);}});
function browserAPIs(document){
 const prototype=Object.getPrototypeOf(document.root);
 if(!prototype.hasAttribute){
  const originalQueryAll=prototype.querySelectorAll;
  // The shared minimal parser handles simple compound selectors. Localization
  // additionally needs CSS selector lists; each branch still uses that parser.
  const branches=selector=>selector.split(/,(?![^\[]*\])/).map(part=>part.trim());
  prototype.querySelectorAll=function(selector){
   const parts=branches(selector);if(parts.length===1)return originalQueryAll.call(this,selector);
   const found=new Set(parts.flatMap(part=>originalQueryAll.call(this,part)));
   return originalQueryAll.call(this,'*').filter(node=>found.has(node));
  };
  prototype.matches=function(selector){return branches(selector).some(part=>originalQueryAll.call({descendants:()=>[this]},part).length>0);};
  prototype.hasAttribute=function(name){return Object.hasOwn(this.attrs,name);};
 }
 if(!Object.getOwnPropertyDescriptor(prototype,'style'))Object.defineProperty(prototype,'style',{get(){return this._style??={setProperty(key,value){this[key]=String(value);}};}});
 prototype.getBoundingClientRect=function(){return {left:0,top:0,width:960,height:390,right:960,bottom:390};};
 prototype.setPointerCapture=function(id){this.pointerId=id;};
 prototype.releasePointerCapture=function(){delete this.pointerId;};
 document.createElementNS=(_,tag)=>document.createElement(tag);
 document.documentElement=document.root;
 document.documentElement.dataset.theme='forest';
 document.hidden=false;
 return document;
}

export async function startStrictSimulationWorkspace({synchronous=true,yieldControl,...options}={}){
 const globals=['document','matchMedia','addEventListener','removeEventListener','URL','setTimeout','clearTimeout'];
 const saved=Object.fromEntries(globals.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const windowEvents=emitter(),motion=Object.assign(emitter(),{matches:true}),timers=new Map(),exports=[],mounts=[],runs=[],mountErrors=[];
 let nextTimer=0,workspace;
 Object.assign(globalThis,{
  matchMedia:()=>motion,
  addEventListener:windowEvents.addEventListener.bind(windowEvents),
  removeEventListener:windowEvents.removeEventListener.bind(windowEvents),
  URL:class extends globalThis.URL {static createObjectURL(blob){exports.push(blob);return 'blob:strict-dom-test';}static revokeObjectURL(){}},
  setTimeout(callback){timers.set(++nextTimer,callback);return nextTimer;},
  clearTimeout(id){timers.delete(id);}
 });
 const restore=()=>{for(const [key,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
 try{
  workspace=await startResearchWorkspace({catalogBundle,incrementalBundle:incrementalPackages,...options,simulationMount(root,{draft,companyCase,onConfigChange,...mountOptions}){
   globalThis.document=browserAPIs(root.ownerDocument);
   const adapter=annualResearchSimulationAdapter(draft),simulate=adapter.simulate.bind(adapter),simulateAsync=adapter.simulateAsync.bind(adapter);
   const mount={ticker:draft.ticker,root,draft,adapter};mounts.push(mount);
   adapter.simulate=(config,input)=>{
    const run={ticker:draft.ticker,config:structuredClone(config),draft:structuredClone(input)};runs.push(run);
    try{return run.result=simulate(config,input);}catch(error){run.error=error;throw error;}
   };
   adapter.simulateAsync=(config,asyncOptions,input)=>{
    const run={ticker:draft.ticker,config:structuredClone(config),draft:structuredClone(input),signal:asyncOptions.signal};runs.push(run);
    return simulateAsync(config,asyncOptions,input).then(result=>run.result=result,error=>{run.error=error;throw error;});
   };
   const snapshot={ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId},sourceUrl:companyCase?.sourceUrl};
   try{return mountSimulation(root,snapshot,draft,{...mountOptions,onConfigChange,adapter,synchronous,autoplay:false,yieldControl});}
   catch(error){mountErrors.push({ticker:draft.ticker,error});throw error;}
  }});
 }catch(error){workspace?.destroy();restore();throw error;}
 return {...workspace,windowEvents,exports,mounts,runs,mountErrors,
  mc(selector){return workspace.root.querySelector(selector.replace(/^#mc-/,'#research-mc-'));},
  visible(node){if(!node)return false;for(let current=node;current;current=current.parentElement)if(current.hidden)return false;return node.isConnected;},
  cleanup(){try{workspace.destroy();}finally{timers.clear();restore();}}
 };
}
