// Independent v6 integration using a minimal DOM harness: executes actual wizard JavaScript and event handlers.
// This does not test browser layout, accessibility tree, or real keyboard behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as engine from '../dist/engine.js';
import * as current from '../dist/current-model.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const source=read('../dist/guided.js').replace(/^import .*;\n/gm,'');
const content=JSON.parse(read('../dist/data/guided-content.json'));
const snapshot={id:'QA-FY',snapshotMode:'annual-reference',periodEnd:'2025-12-31',filingDate:'2026-02-01',sourceUrl:'https://example.com/filing',currency:'USD',revenue:1000,EBIT:100,cash:50,debt:100,shares:10,shareBasis:'common shares',facts:{revenue:1000,operatingIncome:100,cash:50,debt:100,shares:10}};
const library={asOf:'2026-10-17',companies:['AAPL','MSFT','NBIS'].map(ticker=>({ticker,name:`Fixture ${ticker}`,currency:'USD',currentSnapshotId:snapshot.id,snapshots:[structuredClone(snapshot)]}))};
const decode=v=>String(v).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
async function start(storage=new Map(),blocked=false){
 const nodes=new Map(),elements=[],mounts=[];let focused=null;
 class Element{
  constructor(attrs={}){this.attrs=attrs;this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));this.value=attrs.value||'';this.checked='checked' in attrs;this.textContent='';this._html='';}
  set innerHTML(html){this._html=html;if(this===app){nodes.clear();elements.length=0;}for(const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)){const attrs=Object.fromEntries([...match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],decode(m[2]??'')]));const el=new Element(attrs);if(attrs.id)nodes.set('#'+attrs.id,el);elements.push(el);}}
  get innerHTML(){return this._html;}
  querySelectorAll(s){const key=s.match(/^\[([^\]]+)\]$/)?.[1];return key?elements.filter(el=>key in el.attrs):[];}
  click(){return this.onclick?.({target:this});}
  focus(){focused=this;}
  scrollIntoView(){}
 }
 const app=new Element(),stamp=new Element(),hero=new Element();
 const document={querySelector:s=>s==='#open-simulation'?hero:s==='#guided-app'?app:s==='.edition-stamp b'?stamp:nodes.get(s)||null,createElement:()=>new Element()};
 const localStorage={getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);}};
 const fetch=async path=>({ok:true,json:async()=>structuredClone(path.includes('guided-content')?content:library)});
 const deps={...engine,...current,mountSimulation:(root,snapshot,draft)=>{const entry={root,ticker:snapshot.ticker,sourceId:snapshot.raw.id,released:false};mounts.push(entry);return ()=>{entry.released=true}},enterPanel:()=>{},reducedMotion:()=>true,document,localStorage,fetch,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},Blob:class{},setTimeout:()=>0};
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction(...Object.keys(deps),source)(...Object.values(deps));
 return {storage,app,stamp,hero,mounts,get:s=>nodes.get(s),step:n=>elements.find(el=>el.dataset.step===String(n)).click(),state:ticker=>JSON.parse(storage.get(`valuation-lab-guided-v5:${ticker||'AAPL'}:QA-FY`)),focus:()=>focused};
}
test('v6 QA: hero shortcut and review links discover the simulation while preserving both gates',async()=>{
 const h=await start();h.hero.click();assert.equal(h.state().step,7);assert.equal(h.mounts.length,0);assert.match(h.get('#guided-results').innerHTML,/Valuation not ready/);
 h.get('#mc-review-model').click();assert.equal(h.state().step,0);h.get('#g-model-review').onchange({target:{checked:true}});h.hero.click();assert.equal(h.mounts.length,0);h.get('#mc-review-claims').click();assert.equal(h.state().step,6);h.get('#g-bridge-review').onchange({target:{checked:true}});h.hero.click();assert.equal(h.mounts.length,1);assert.equal(h.mounts[0].ticker,'AAPL');
});
test('v6 QA: navigation, quote edits and company changes dispose the previous mounted simulation',async()=>{
 const h=await start();h.get('#g-model-review').onchange({target:{checked:true}});h.step(6);h.get('#g-bridge-review').onchange({target:{checked:true}});h.step(7);const first=h.mounts.at(-1);assert.ok(first&&!first.released);
 h.get('#quote-price').value='100';h.get('#quote-price').oninput();assert.equal(first.released,true);const second=h.mounts.at(-1);assert.ok(second!==first&&!second.released);
 h.get('#guided-back').click();assert.equal(second.released,true);h.step(7);const third=h.mounts.at(-1);assert.ok(!third.released);h.get('#current-company').onchange({target:{value:'MSFT'}});assert.equal(third.released,true);assert.ok(h.mounts.every(x=>x.released));
});
test('v6 QA: specialist company shortcut cannot mount a generic per-share simulation after review',async()=>{
 const h=await start();h.get('#current-company').onchange({target:{value:'NBIS'}});h.get('#g-model-review').onchange({target:{checked:true}});h.step(6);h.get('#g-bridge-review').onchange({target:{checked:true}});h.hero.click();assert.equal(h.mounts.length,0);assert.match(h.get('#guided-results').innerHTML,/withheld/);
});
