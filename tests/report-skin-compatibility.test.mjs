// The skin is a view over the existing model and native replay, never a second
// source of forecast years, sampled outcomes, or replay state.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../dist/skins/'+name,import.meta.url),'utf8');
function interactionAPI(){
 const document={documentElement:{dataset:{skin:'report'}},body:{},addEventListener(){},querySelectorAll:()=>[]};
 const context={document,MutationObserver:class{observe(){}},requestAnimationFrame(){},addEventListener(){},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,Event};
 vm.runInNewContext(read('report-interactions.js')+'\nglobalThis.api={timingHorizon,timingProgress,scrubSpec,decimals,fmt};',context);
 return context.api;
}
test('report skin: timing window follows independent 10, 15, 20 and 30-year calendars',()=>{
 const {timingHorizon,timingProgress}=interactionAPI();
 const tile=values=>({closest:()=>({querySelectorAll:()=>values.map(value=>({value:String(value)}))})});
 for(const n of [10,15,20,30])assert.equal(timingHorizon(tile([n,7,9])),n);
 assert.equal(timingHorizon(tile([10,12,28])),28);
 assert.equal(timingHorizon(tile([20,15,'',99,NaN])),20);
 assert.equal(timingProgress(10,0,20),.5);
 assert.equal(timingProgress(10,5,20),1/3);
 assert.equal(timingProgress(5,5,20),0);
 assert.equal(timingProgress(20,5,20),1);
 assert.equal(timingProgress(30,5,20),1);
 assert.doesNotMatch(read('report-interactions.js'),/const HORIZON\s*=|after the.*year forecast/);
});
test('report skin: optional capital terminal year extends every timing strip',()=>{
 const {timingHorizon}=interactionAPI();
 const fields=new Map([['#growth-maturity',{value:'10'}],['input[data-operating-timing$="MaturityYears"]',{value:'10'}],['input[data-margin-control="terminalYear"]',{value:'10'}],['input[data-capital-control="terminalYear"]',{value:'30'}]]);
 const tile={closest:()=>({querySelectorAll:selectors=>selectors.split(',').map(selector=>fields.get(selector.trim())).filter(Boolean)})};
 assert.equal(timingHorizon(tile),30);
 fields.get('input[data-capital-control="terminalYear"]').value='15';assert.equal(timingHorizon(tile),15);
});
test('report skin: extreme small numbers retain their value without exceeding toFixed precision',()=>{
 const {scrubSpec,decimals,fmt}=interactionAPI(),value=1e-120;
 assert.equal(decimals(value),120);assert.equal(fmt(value,decimals(value)),'1e-120');
 const spec=scrubSpec({matches:()=>true,dataset:{raw:'1e-120',scale:'100',displayDigits:'2'}});
 assert.equal(spec.start,value);assert.equal(fmt(spec.start,spec.dec),'1e-120');
 assert.equal(fmt(-value,spec.dec),'-1e-120');assert.equal(fmt(12.125,3),'12.125');
 assert.match(read('report-interactions.js'),/const text = fmt\(next, dec\)/);
});
test('report skin: scrubbing preserves the existing annual and number-field precision',()=>{
 const {scrubSpec,decimals}=interactionAPI();
 const annual={matches:()=>true,dataset:{raw:'508837.123456',scale:'1',displayDigits:'1'}};
 let spec=scrubSpec(annual);assert.equal(spec.start,508837.123456);assert.equal(spec.dec,6);
 assert.equal(Number((spec.start+spec.step).toFixed(spec.dec)),509837.123456);
 spec=scrubSpec({...annual,dataset:{raw:'12.123456789',scale:'100'}});assert.equal(spec.dec,9);
 const input={matches:()=>false,value:'12.12345',step:'.5',min:'',max:'',closest:()=>null};
 assert.equal(scrubSpec(input).dec,5);assert.equal(decimals(1e-7),7);
 assert.equal(scrubSpec({...annual,dataset:{raw:'',scale:'1'}}),null);
});
function replayHarness({count=3,withContext=true,native=true,phone=false,width=960,targetAt=i=>150+i*200}={}){
 const state={reduced:false,hidden:false,frames:new Map(),next:0,observers:[],canvases:[],draws:[]};
 const classes=()=>{const values=new Set();return {add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v)}};
 const root={dataset:{skin:'report'}};
 const nativeAnimations=Array.from({length:count},(_,i)=>({currentTime:0,effect:{getTiming:()=>({duration:2200,delay:i*1900})}}));
 const nodes=nativeAnimations.map((animation,i)=>({tagName:i%2?'rect':'circle',getAttribute:k=>String(targetAt(i)-(k==='x'?2.8:0)),getAnimations:()=>native?[animation]:[]}));
 const bins=Array.from({length:count},(_,i)=>({getAttribute:key=>String(({x:130+i*200,width:40,y:250})[key])}));
 const svg={querySelectorAll:()=>bins,getBoundingClientRect:()=>({left:0,top:0,width,height:width*420/960})};
 const ctx=new Proxy({}, {get:(_,key)=>key==='createRadialGradient'||key==='createLinearGradient'?(...args)=>{state.draws.push([key,...args]);return {addColorStop(){}}}:(...args)=>state.draws.push([key,...args]),set:()=>true});
 const document={documentElement:root,body:{append(){}},get hidden(){return state.hidden},querySelectorAll:()=>[group],createElement:tag=>{
  const el={tag,style:{},classList:classes(),isConnected:false,setAttribute(){},remove(){this.isConnected=false},getContext:()=>withContext?ctx:null};
  if(tag==='canvas')state.canvases.push(el);return el;
 }};
 const chart={append:el=>{el.isConnected=true},getBoundingClientRect:svg.getBoundingClientRect};
 const group={children:nodes,ownerSVGElement:svg,isConnected:true,classList:classes(),closest:()=>chart,get childElementCount(){return this.children.length}};
 const context={document,matchMedia:query=>({matches:query.includes('reduced-motion')?state.reduced:phone}),Math:Object.assign(Object.create(Math),{random(){throw new Error('Financial/global randomness must not be consumed')}}),getComputedStyle:()=>({color:'rgb(35, 67, 196)',getPropertyValue:()=> '#2343c4'}),devicePixelRatio:1,MutationObserver:class{constructor(callback){this.callback=callback;state.observers.push(this)}observe(target){this.target=target}},requestAnimationFrame:callback=>{const id=++state.next;state.frames.set(id,callback);return id},cancelAnimationFrame:id=>state.frames.delete(id)};
 vm.runInNewContext(read('report-simulation.js')+'\nglobalThis.api={replayParticles,rainPlan,rainPosition,replayElapsed,startRun,runs};',context);
 const step=time=>{for(const a of nativeAnimations)a.currentTime=time;const [id,fn]=[...state.frames][0]||[];if(fn){state.frames.delete(id);fn(time)}};
 const mutate=()=>state.observers.find(observer=>observer.target===group).callback();
 return {state,group,nativeAnimations,api:context.api,step,mutate,live:()=>state.canvases.filter(canvas=>canvas.isConnected).length};
}
test('report skin: rain uses native outcomes with equal decorative multiplicity and native arrival times',()=>{
 const h=replayHarness(),particles=h.api.replayParticles(h.group),plan=h.api.rainPlan(particles,false);
 const counts=new Map();for(const drop of plan){const p=particles.find(p=>p.target===drop.target);assert.ok(p);assert.equal(drop.launch+drop.flight,p.delay+p.duration);counts.set(drop.target,(counts.get(drop.target)||0)+1)}
 assert.equal(new Set(counts.values()).size,1);assert.equal(counts.size,3);
 assert.deepEqual([...counts.keys()].sort((a,b)=>a-b),[150,350,550]);
 h.nativeAnimations[0].currentTime=1900;assert.equal(h.api.replayElapsed(particles),1900);
});
test('report skin: native pause freezes the visual clock; cancel clears the overlay and restores native visibility',()=>{
 const h=replayHarness();assert.equal(h.live(),1);assert.ok(h.group.classList.contains('rx-poured'));
 h.step(1200);h.step(1200);assert.equal(h.live(),1);
 h.group.children=[];h.mutate();assert.equal(h.live(),0);assert.equal(h.group.classList.contains('rx-poured'),false);assert.equal(h.state.frames.size,0);
});
test('report skin: immediate replay replaces the prior overlay, including a batched skip/replay',()=>{
 const h=replayHarness(),first=h.state.canvases[0];
 h.group.children=h.group.children.map(node=>({...node}));h.mutate();
 assert.equal(first.isConnected,false);assert.equal(h.live(),1);assert.equal(h.state.frames.size,1);
});
test('report skin: reduced motion, hidden documents and detached groups remove in-flight overlays',()=>{
 for(const action of [h=>h.state.reduced=true,h=>h.state.hidden=true,h=>h.group.isConnected=false]){
  const h=replayHarness();action(h);h.step(1000);assert.equal(h.live(),0);assert.equal(h.group.classList.contains('rx-poured'),false);
 }
});
test('report skin: unavailable canvas or native animation leaves original particles visible',()=>{
 for(const options of [{withContext:false},{native:false}]){const h=replayHarness(options);assert.equal(h.live(),0);assert.equal(h.group.classList.contains('rx-poured'),false)}
});

for(const [phone,count,width] of [[false,112,960],[true,64,375],[true,200,320]])test(`report rain: ${phone?'mobile':'desktop'} roof coverage, deterministic styling and bounded trajectories (${count})`,()=>{
 const h=replayHarness({phone,count,width,targetAt:i=>48+i*870/(count-1)});
 const particles=h.api.replayParticles(h.group),plan=h.api.rainPlan(particles,phone);
 assert.deepEqual(plan,h.api.rainPlan(particles,phone),'Repeated replay uses identical visual noise without consuming any random generator.');
 assert.ok(plan.length<=Math.max(count,phone?300:680));
 const starts=plan.map(p=>p.x0);
 assert.ok(Math.min(...starts)<80);assert.ok(Math.max(...starts)>890);
 assert.ok(new Set(starts.map(x=>Math.floor((x-48)/87))).size>=10,'Starts cover every roof decile.');
 assert.ok(plan.every(p=>p.y0>=18&&p.y0<=42));
 for(const drop of plan){
  const radius=drop.r/(width/960);
  for(const floor of [76,250,326]){
   let previousY=-Infinity;
   for(let step=0;step<=100;step++){
    const position=h.api.rainPosition(drop,floor,radius,step/100);
    assert.ok(position.x>=Math.min(drop.x0,drop.target)-1e-9&&position.x<=Math.max(drop.x0,drop.target)+1e-9);
    assert.ok(position.y>=previousY-1e-9,'Drops descend without an upward launch.');previousY=position.y;
    assert.ok(position.x-radius>=0&&position.x+radius<=960);
    assert.ok(position.y-radius>=0&&position.y+radius<=326+1e-9);
   }
   const landing=h.api.rainPosition(drop,floor,radius,1);
   assert.equal(landing.x,drop.target);assert.ok(Math.abs(landing.y-(floor-radius))<1e-9);
  }
 }
 h.step(1600);const before=h.state.draws.length;h.step(1600);
 assert.equal(h.state.draws.length,before,'Paused native clock draws nothing new.');
 h.step(1800);assert.ok(h.state.draws.length>before,'Resume follows the same native clock.');
 assert.ok(!h.state.draws.some(([call])=>call==='createRadialGradient'),'There is no central emitter halo.');
});
test('report rain: concentrated outcomes still fall across the roof and land in the actual bin',()=>{
 const h=replayHarness({count:1,targetAt:()=>480}),plan=h.api.rainPlan(h.api.replayParticles(h.group),false);
 assert.ok(Math.min(...plan.map(p=>p.x0))<80);assert.ok(Math.max(...plan.map(p=>p.x0))>890);
 assert.ok(plan.every(p=>p.target===480&&p.launch+p.flight===2200));
 assert.equal(h.api.rainPlan([],false).length,0);
});
test('report rain: repeated batched skip/replay and completion leave exactly one frame and no stale canvas',()=>{
 const h=replayHarness();
 for(let i=0;i<12;i++){
  h.step(1800);h.group.children=h.group.children.map(node=>({...node}));
  for(const a of h.nativeAnimations)a.currentTime=0;
  h.mutate();assert.equal(h.live(),1);assert.equal(h.state.frames.size,1);
  h.step(1900);
 }
 h.group.children=[];h.mutate();assert.equal(h.live(),0);assert.equal(h.state.frames.size,0);
 assert.equal(h.group.classList.contains('rx-poured'),false);
});
