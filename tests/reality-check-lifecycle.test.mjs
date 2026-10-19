import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const journey=fs.readFileSync(new URL('../dist/skins/report-journey.js',import.meta.url),'utf8');
const paths=fs.readFileSync(new URL('../dist/skins/report-paths.js',import.meta.url),'utf8');
const scheduler=journey.slice(journey.indexOf('let checkTimer ='),journey.indexOf('function checks()'));
const checkSource=journey.slice(journey.indexOf('function checks()'),journey.indexOf('// ---------- the result card'));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fixture(){
 let raw=JSON.stringify({revenueN:200,revenue0:100,years:10,currency:'USD',ebitN:30,ebit0:10,reinvestment:40,enterprise:100,terminalPV:39}),locale='en';
 const sections=new Map([2,3,4,5].map(id=>[id,{hidden:id!==5,box:{removed:false,b:{textContent:'Reality check'},span:{textContent:'stale 39%'}},querySelector(){return this.box?.removed?null:this.box}}]));
 for(const section of sections.values()){section.box.remove=()=>{section.box.removed=true};section.box.querySelector=s=>s==='b'?section.box.b:section.box.span;}
 const document={getElementById:id=>id==='guided-results'?{getAttribute:()=>raw}:sections.get(Number(id.replace('editor-group-','')))};
 let runs=0;
 const actualChecks=new Function('document','money','copy','setText','el',checkSource+'; return checks;')(document,String,(key,values)=>JSON.stringify({key,values,locale}),(node,value)=>{node.textContent=value},()=>{throw Error('Unexpected creation in retained-node fixture')});
 const schedule=new Function('document','lang','setTimeout','clearTimeout','checks',scheduler+'; return scheduleChecks;')(document,()=>locale,setTimeout,clearTimeout,()=>{runs++;actualChecks()});
 return {schedule,sections,setRaw:v=>{raw=v},setLocale:v=>{locale=v},get runs(){return runs}};
}
test('Reality check clears visible and hidden stale sentences immediately on invalid publication',()=>{
 const f=fixture();f.schedule();f.setRaw('null');f.schedule();
 for(const section of f.sections.values())assert.equal(section.box.removed,true);
 assert.equal(f.runs,1);
});
test('Reality check updates despite continuous unrelated scans and localizes on next settled scan',async()=>{
 const f=fixture();let interval;
 try{
  f.schedule();interval=setInterval(()=>f.schedule(),8);
  await pause(450);assert.equal(f.runs,1,'Repeated scans must not indefinitely postpone the pending check.');
  assert.match(f.sections.get(5).box.span.textContent,/39%/);
  f.setLocale('zh-Hans');await pause(450);assert.equal(f.runs,2);assert.match(f.sections.get(5).box.span.textContent,/zh-Hans/);
  f.setRaw('null');f.schedule();assert.equal(f.sections.get(5).box.removed,true);
 }finally{clearInterval(interval);f.setRaw('null');f.schedule()}
});
test('Invalid path and Forecast hiding is idempotent under the observed hidden-attribute contract',()=>{
 const gate=paths.match(/  const valid = values.length > 0[^]*?  if \(!valid\) return;/)?.[0];assert.ok(gate);
 const paint=new Function('values','mature','el','finite',gate);
 let hidden=false,writes=0;const el={classList:{toggle(){}},get hidden(){return hidden},set hidden(value){writes++;hidden=value}};
 for(let i=0;i<500;i++)paint([],0.02,el,Number.isFinite);
 assert.equal(writes,1);assert.equal(hidden,true);
 paint([0.1],0.02,el,Number.isFinite);assert.equal(hidden,false);assert.equal(writes,2);
 assert.equal((journey.match(/if \(box && !box.hidden\) box.hidden = true;/g)||[]).length,2);
 assert.doesNotMatch(journey,/if \(box\) box.hidden = true;/);
});
test('Reality check refreshes when identical model data is rendered into replacement sections',async()=>{
 const f=fixture();f.schedule();await pause(350);assert.equal(f.runs,1);
 const prior=f.sections.get(5);f.sections.set(5,{...prior});f.schedule();await pause(350);assert.equal(f.runs,2);
 f.setRaw('null');f.schedule();
});
test('Forecast bridge cache cannot leave a repaired identical valuation hidden',()=>{
 const gate=journey.slice(journey.indexOf('function bridge()'),journey.indexOf('// ---------- long fine print'));
 assert.match(gate,/if \(box && box.dataset.key === key && !box.hidden\) return;/);
 const skip=new Function('box','key','return box && box.dataset.key === key && !box.hidden;');
 assert.equal(skip({dataset:{key:'original'},hidden:true},'original'),false);
 assert.equal(skip({dataset:{key:'original'},hidden:false},'original'),true);
});
