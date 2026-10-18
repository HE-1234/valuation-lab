// Synthetic DOM/source contracts; this file does not certify painted browser UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {distributionPreviewData} from '../dist/distribution-view.js';
import {simulationDefaults,validateSimulationConfig} from '../dist/simulation.js';
import {simulationResearchDefaults,validateResearchSimulationConfig} from '../dist/research-simulation.js';
import {studioResearchDraft} from '../dist/studio-research-presets.js';
import {annualResearchSimulationAdapter} from '../dist/research-simulation-view.js';
import {incrementalRecord} from '../dist/incremental-registry.js';
import {incrementalResearchDraft} from '../dist/incremental-research.js';
import {REFERENCE_DEFAULT_TICKERS} from '../dist/research-reference-defaults.js';
import {SIMULATION_COUNT_POLICY_NOTE} from '../dist/simulation-count-policy.js';
import {matchGuidedMessage} from '../dist/guided-localization.js';
import {setLocale,t} from '../dist/i18n.js';
import {annualLabel} from '../dist/annual-localization.js';
import {fixture} from './v7-simulation-harness.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bundle=()=>JSON.parse(read('dist/data/studio-research-presets-2026-10-17-v1.json'));
const strip=s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const sha=s=>createHash('sha256').update(s).digest('hex');

test('UI merge: all frozen research inputs and historical 4000-trial reports retain exact source hashes',()=>{
 const b=bundle();assert.ok(b.presets.every(p=>p.simulationConfig.trials===4000));
 const before=JSON.parse(read('tests/fixtures/report-ui-merge-v59.json'));
 assert.equal(Object.keys(before.files).some(p=>p.startsWith('dist/data/')||p.includes('research-prose')),false);
 const review=JSON.parse(read('dist/data/terminal-growth-review-2026-10-18-v1.json'));
 assert.equal(sha(read('dist/data/studio-research-presets-2026-10-17-v1.json')),review.sourceSHA256);
 assert.match(read('dist/data/studio-research-presets-2026-10-17-v1.html'),/4,000/);
});

test('UI merge: fresh 5000 counts are an explicit runtime policy; frozen preset objects are not mutated',()=>{
 const b=bundle(),before=structuredClone(b);
 assert.equal(simulationDefaults().trials,5000);assert.equal(simulationResearchDefaults().trials,5000);
 for(const p of b.presets){
  const d=studioResearchDraft(p,b);
  assert.equal(d.researchSimulationConfig.trials,5000);assert.equal(d.researchPreset.defaultSimulationConfig.trials,5000);
  assert.equal(d.researchPreset.samplingCountPolicy.sourceTrials,4000);
  assert.equal(d.researchPreset.samplingCountPolicy.originalTrialRationale,p.simulationRationale.trials);
  assert.equal(d.researchPreset.simulationRationale.trials,SIMULATION_COUNT_POLICY_NOTE);
 }
 for(const ticker of REFERENCE_DEFAULT_TICKERS){const r=incrementalRecord(ticker),d=incrementalResearchDraft({ticker,presetId:r.identity.version,incrementalResearch:r.identity,annualCase:r.annualCase});assert.equal(d.researchSimulationConfig.trials,5000);assert.equal(annualResearchSimulationAdapter(d).defaults().trials,5000);}
 assert.deepEqual(b,before);
});

test('UI merge: old 4000 and arbitrary saved counts remain exact, including reset Undo',()=>{
 for(const count of [37,4000,5000,10000]){
  const c={...simulationDefaults(),trials:count};assert.equal(validateSimulationConfig(c).trials,count);
  const research={...simulationResearchDefaults(),trials:count};assert.equal(validateResearchSimulationConfig(research).trials,count);
  const changes=[],h=fixture({ticker:'MERGE-SAVED-'+count,reduced:true,runOnMount:false,simulationConfig:c,onConfigChange:x=>changes.push(x)});
  try{assert.equal(h.get('#mc-trials').value,String(count));assert.equal(h.get('#mc-chart'),null);h.get('#mc-reset-distributions').click();assert.equal(h.get('#mc-trials').value,'5000');h.get('#mc-undo-reset').click();assert.equal(h.get('#mc-trials').value,String(count));assert.deepEqual(changes.at(-1),c);assert.equal(h.get('#mc-chart'),null);}finally{h.cleanup();}
 }
 const b=bundle(),d=studioResearchDraft(b.presets[0],b);d.researchSimulationConfig.trials=37;d.researchPreset.defaultSimulationConfig.trials=4000;
 const adapter=annualResearchSimulationAdapter(d);assert.equal(adapter.savedConfig.trials,37);assert.equal(adapter.defaults().trials,5000);assert.equal(d.researchPreset.defaultSimulationConfig.trials,4000);
});

test('UI merge: current sampling rationale is localized in simulation and annual provenance',()=>{
 try{for(const locale of ['en','zh-Hans']){setLocale(locale);const text=annualLabel(SIMULATION_COUNT_POLICY_NOTE);assert.equal(text,t('simulation.samplingCountPolicy'));assert.match(text,/5,000/);if(locale==='zh-Hans')assert.match(text,/\p{Script=Han}/u);}}finally{setLocale('en');}
});

test('UI merge: density preview follows authored bounds and fixed values retain a finite window',()=>{
 for(const spec of [{type:'uniform',low:.12,high:.18},{type:'triangular',low:-.2,mode:-.1,high:.3},{type:'normal',low:.03,mean:.09,sd:.02,high:.12}]){
  const p=distributionPreviewData(spec,100,undefined,[-1,1]);assert.equal(p.lo,spec.low);assert.equal(p.hi,spec.high);assert.ok(p.values.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
 for(const value of [0,.1,-.1]){const p=distributionPreviewData({type:'fixed',value},100);assert.ok(p.lo<value&&p.hi>value);assert.ok(p.values.every(p=>Number.isFinite(p.y)));}
});

test('UI merge: bounded localization cache returns isolated match parameters',()=>{
 const first=matchGuidedMessage('Year 17');first.params.year='mutated';const next=matchGuidedMessage('Year 17');assert.equal(Object.values(next.params).includes('mutated'),false);
 assert.equal(matchGuidedMessage('private note: Growth'),null);
});

function uxAPI(){
 const listeners={},frames=[],state={reduced:false,animations:[]};
 const media={get matches(){return state.reduced;},addEventListener:(n,f)=>{listeners.motion=f;}};
 const document={documentElement:{dataset:{skin:'report'},hasAttribute:()=>false,removeAttribute(){},setAttribute(){}},body:{},hidden:false,activeElement:null,addEventListener:(n,f)=>{(listeners[n]||=[]).push(f);},querySelectorAll:()=>[],createRange:()=>({}),getElementById:()=>null};
 const context={document,matchMedia:()=>media,MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}unobserve(){}},IntersectionObserver:class{observe(){}unobserve(){}},requestAnimationFrame:f=>frames.push(f),performance:{now:()=>1},Event,CSS:{escape:x=>x},onLocaleChange(){},getLocale:()=> 'en',t:x=>x,setTimeout,clearTimeout};
 vm.runInNewContext(strip(read('dist/skins/report-ux.js'))+'\nglobalThis.api={choose,animatePresentation,cancelPresentationMotion,scanSimulation};',context);
 return {...context.api,state,document,listeners,frames};
}
test('UI merge: pill changes dispatch the native events only once and do not start simulations',()=>{
 const h=uxAPI(),events=[],select={id:'choice',value:'one',dispatchEvent:e=>events.push(e.type)};
 h.choose(select,'two');assert.equal(select.value,'two');assert.deepEqual(events,['input','change']);h.choose(select,'two');assert.equal(events.length,2);select.disabled=true;h.choose(select,'three');assert.equal(select.value,'two');assert.equal(events.length,2);
});
test('UI merge: presentation animations cancel on reduced motion or backgrounding',()=>{
 const h=uxAPI(),animations=[],element={animate(){const a={cancelled:false,cancel(){this.cancelled=true;},finished:new Promise(()=>{})};animations.push(a);return a;}};
 h.animatePresentation(element,[],{});assert.equal(animations.length,1);h.state.reduced=true;h.listeners.motion();assert.equal(animations[0].cancelled,true);assert.equal(h.animatePresentation(element,[],{}),null);
 h.state.reduced=false;h.animatePresentation(element,[],{});h.document.hidden=true;for(const cb of h.listeners.visibilitychange)cb();assert.equal(animations[1].cancelled,true);
});

function phaseAPI({type='capital',values=[3,6,10],rebuild=false}={}){
 const byId=new Map(),events=[];let current,rebuilt=false;
 const document={activeElement:null,addEventListener(){},querySelectorAll:()=>[],getElementById:id=>byId.get(id),createElement:tag=>new Node(tag)};
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.listeners={};this.parts={};this.isConnected=true;this.clientWidth=300;this.value='';const c=new Set();this.classList={add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x),toggle:(x,force)=>{const on=force??!c.has(x);on?c.add(x):c.delete(x);return on;}};}
  set innerHTML(value){if(value.includes('rx-ph-track'))for(const k of ['track','bands','axis','hint'])this.parts['.rx-ph-'+k]=new Node(k);if(value.includes('rx-ph-tag'))this.parts['.rx-ph-tag']=new Node('tag');}
  querySelector(s){return this.parts[s]||null;}
  append(child){this.children.push(child);child.parent=this;}
  addEventListener(n,fn){this.listeners[n]=fn;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  focus(){document.activeElement=this;}
  closest(s){return this.tag==='button'&&s==='.rx-ph-handle'?this:null;}
  getBoundingClientRect(){return {left:0,width:300};}
  setPointerCapture(){}
  remove(){this.isConnected=false;}
 }
 let api;
 function section(vals){
  const s=new Node('section'),keys=type==='capital'?['earlyEndYear','fadeStartYear','terminalYear']:['interimYear','declineStartYear','terminalYear'];
  s.fields=keys.map((key,i)=>{const f=new Node('input');f.id='phase-'+key;f.value=String(vals[i]);f.closest=()=>current;f.dispatchEvent=e=>{events.push([key,e.type,f.value]);if(e.type==='input'){f.focus();if(rebuild&&!rebuilt){rebuilt=true;s.isConnected=false;current=section(s.fields.map(x=>Number(x.value)));}}};byId.set(f.id,f);return f;});
  return s;
 }
 const context={document,Event,onScan(){},animatePresentation(){},getLocale:()=> 'en',matchMedia:()=>({matches:true}),requestAnimationFrame(){}};
 vm.runInNewContext(strip(read('dist/skins/report-phases.js'))+'\nglobalThis.api={bounds,write,build,paint,timelines};',context);api=context.api;
 current=section(values);
 const kind={strict:type==='capital',section:'.phase',keys:current.fields.map(x=>x.id.replace('phase-','')),field:(s,k)=>s.fields.find(f=>f.id==='phase-'+k),place:(s,el)=>{s.timeline=el;},phases:()=>[]};
 const state=api.build(current,kind);api.paint(current);
 const key=(index,key)=>{state.handles[index].focus();state.el.listeners.keydown({target:state.handles[index],key,preventDefault(){}});};
 return {api,document,state,key,events,get current(){return current;},kind};
}
test('UI merge: phase sliders preserve strict capital ordering and native event count, including boundary no-ops',()=>{
 const h=phaseAPI();h.key(0,'End');assert.equal(h.current.fields[0].value,'5');assert.deepEqual(h.events.map(e=>e[1]),['input','change']);assert.equal(h.document.activeElement,h.state.handles[0]);h.key(0,'ArrowRight');assert.equal(h.events.length,2);h.key(2,'End');assert.equal(h.current.fields[2].value,'30');h.key(2,'ArrowRight');assert.equal(h.events.length,4);
});
test('UI merge: phase slider restores visible keyboard handle after native annual section rebuild',()=>{
 const h=phaseAPI({type:'margin',rebuild:true});h.key(2,'ArrowRight');assert.equal(h.current.fields[2].value,'11');const state=h.api.timelines.get(h.current);assert.notEqual(state,h.state);assert.equal(h.document.activeElement,state.handles[2]);assert.deepEqual(h.events.map(e=>e[1]),['input','change']);
});
test('UI merge: margin boundaries may coincide and rightward drag selects the later coincident boundary',()=>{
 const h=phaseAPI({type:'margin',values:[3,3,10]}),track=h.state.el.querySelector('.rx-ph-track');
 track.listeners.pointerdown({target:h.state.handles[0],button:0,pointerId:1,clientX:60,preventDefault(){}});
 track.listeners.pointermove({clientX:90});assert.equal(h.current.fields[0].value,'3');assert.equal(h.current.fields[1].value,'4');track.listeners.pointercancel();assert.equal(h.state.drag,null);
});
test('UI merge: phase adapter never writes disabled, read-only, unchanged, or noninteger inputs',()=>{
 const h=phaseAPI(),f=h.current.fields[0];f.disabled=true;h.api.write(f,4);f.disabled=false;f.readOnly=true;h.api.write(f,4);f.readOnly=false;h.api.write(f,3);assert.equal(h.events.length,0);f.value='';h.key(0,'ArrowRight');assert.equal(h.events.length,0);
});

test('UI merge: imported controls preserve localized navigation, all six themes, and original manual-run authority',()=>{
 const ux=read('dist/skins/report-ux.js'),phases=read('dist/skins/report-phases.js');
 assert.match(ux,/real\.click\(\)/);assert.doesNotMatch(ux,/simulateCurrent|simulateResearch|localStorage|fetch\(/);
 assert.match(ux,/onLocaleChange/);assert.match(ux,/startViewTransition/);assert.match(ux,/if \(finished\) return/);assert.match(phases,/aria-valuemin/);assert.match(phases,/ArrowRight/);assert.match(phases,/pointercancel/);
 assert.match(read('dist/skins/skin-motion.js'),/import\('\.\/report-ux\.js'\)/);assert.match(read('dist/skins/skin-motion.js'),/import\('\.\/report-phases\.js'\)/);
 const css=read('dist/skins/report.css');assert.match(css,/prefers-reduced-motion: reduce/);assert.match(css,/\.rx-run-cta:focus-visible/);
});
