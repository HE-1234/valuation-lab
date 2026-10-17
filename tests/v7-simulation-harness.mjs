// Synthetic DOM and Web Animations fixture. Not a browser-paint or native-input proof.
import {mountSimulation} from '../dist/simulation-view.js';
import {currentSnapshot,draftFor} from '../dist/current-model.js';

export function fixture({reduced=false,mobile=false,ticker='VIEWQA',rawId,autoIntersect=true,debt=100,quote,hidden=false,animateChange=false,hasAnimationAPI=true,assumptions,simulationConfig,onConfigChange,synchronous=true,autoplay=true,yieldControl,adapter,snapshotOverride,draftOverride}={}){
 const company={ticker,name:'Synthetic view QA',currency:'USD'},raw={id:rawId||ticker+'-FY',snapshotMode:'annual-reference',periodEnd:'2025-12-31',filingDate:'2026-02-01',sourceUrl:'https://example.com/view-source',currency:'USD',revenue:1000,EBIT:100,cash:50,debt,shares:10,shareBasis:'same common share basis'};
 const snapshot=snapshotOverride||currentSnapshot(company,raw),draft=draftOverride||{...draftFor(company,raw),cutoff:'2026-10-17',bridgeReviewed:false,modelReviewed:false};if(quote)draft.quote=quote;if(assumptions)Object.assign(draft.assumptions,assumptions);if(simulationConfig!==undefined)draft.simulationConfig=simulationConfig;
 const ids=new Map(),all=[],animations=[],observers=[],exports=[],timers=new Map();let timerId=0;const globals=['document','matchMedia','addEventListener','removeEventListener','IntersectionObserver','URL','setTimeout','clearTimeout'];
 const saved=Object.fromEntries(globals.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const emitter=()=>({listeners:new Map(),addEventListener(t,f){if(!this.listeners.has(t))this.listeners.set(t,new Set());this.listeners.get(t).add(f)},removeEventListener(t,f){this.listeners.get(t)?.delete(f)},dispatch(t,e={}){for(const f of this.listeners.get(t)||[])f(e)}});
 const decode=x=>String(x).replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&');
 class Element{
  constructor(attrs={}){this.attrs={...attrs};this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));this.value=attrs.value||'';this.style={};this.textContent='';this._html='';this.descendants=[];this.children=[];this.disabled='disabled'in attrs;this.hidden='hidden'in attrs;this.captured=new Set();}
  set innerHTML(html){const remove=el=>{for(const child of el.descendants)remove(child);if(ids.get('#'+el.attrs.id)===el)ids.delete('#'+el.attrs.id);const i=all.indexOf(el);if(i>=0)all.splice(i,1)};for(const el of this.descendants)remove(el);this.descendants=[];this._html=html;
   for(const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)){const attrs=Object.fromEntries([...match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],decode(m[2]??'')]));const el=new Element(attrs);this.descendants.push(el);all.push(el);if(attrs.id)ids.set('#'+attrs.id,el);}
   for(const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const options=[...match[2].matchAll(/<option\b([^>]*)>/g)];const option=options.find(m=>/selected/.test(m[1]))||options[0];if(option)ids.get('#'+match[1]).value=option[1].match(/value="([^"]*)"/)[1];}
  }
  get innerHTML(){return this._html}
  querySelector(s){if(s.startsWith('#'))return ids.get(s)||null;const m=s.match(/^\[([^=]+)="([^"]+)"\]$/);return m?all.find(e=>e.attrs[m[1]]===m[2])||null:null}
  querySelectorAll(s){const attr=s.match(/^\[([^\]]+)\]$/)?.[1];return all.filter(el=>attr&&attr in el.attrs)}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]??null}
  getBoundingClientRect(){return {left:10,width:960,top:0,height:390}}
  setPointerCapture(id){this.captured.add(id)}releasePointerCapture(id){this.captured.delete(id)}
  replaceChildren(){this.children=[]}appendChild(el){this.children.push(el);el.parent=this}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this)}click(){return this.onclick?.({target:this})}
  animate(frames,options){const a={frames,options,state:'running',cancel(){this.state='canceled'},pause(){this.state='paused'},play(){this.state='running'}};animations.push(a);return a}
 }
 const doc=Object.assign(emitter(),{hidden,documentElement:{dataset:{theme:'forest'}},createElement:()=>new Element(),createElementNS:()=>new Element()});
 const windowEvents=emitter(),motion=Object.assign(emitter(),{matches:reduced}),size=Object.assign(emitter(),{matches:mobile});
 Object.assign(globalThis,{URL:{createObjectURL(blob){exports.push(blob);return 'blob:qa'},revokeObjectURL(){}},setTimeout(fn){timers.set(++timerId,fn);return timerId},clearTimeout(id){timers.delete(id)},document:doc,matchMedia:q=>q.includes('reduced-motion')?motion:size,addEventListener:windowEvents.addEventListener.bind(windowEvents),removeEventListener:windowEvents.removeEventListener.bind(windowEvents),IntersectionObserver:class{constructor(fn,options){this.fn=fn;this.options=options;this.targets=[];this.disconnected=false;observers.push(this)}observe(target){this.targets.push(target);this.disconnected=false}disconnect(){this.disconnected=true}}});
 if(!hasAnimationAPI)Element.prototype.animate=undefined;const root=new Element(),destroy=mountSimulation(root,snapshot,draft,{animateChange,onConfigChange,synchronous,autoplay,yieldControl,adapter});if(autoIntersect)for(const o of observers)o.fn([{isIntersecting:true,intersectionRatio:1}]);
 return {root,snapshot,draft,animations,observers,exports,motion,doc,windowEvents,timers,runTimers(){const pending=[...timers.values()];timers.clear();for(const fn of pending)fn();},get:s=>root.querySelector(adapter?.idPrefix?s.replace(/^#mc-/,`#${adapter.idPrefix}mc-`):s),bars:()=>root.querySelectorAll('[data-bin]'),destroy,cleanup(){destroy();for(const [k,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,k,descriptor);else delete globalThis[k]}}};
}

