// Minimal DOM harness: executes actual wizard JavaScript and event handlers.
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
const library={asOf:'2026-10-17',companies:['AAPL','MSFT'].map(ticker=>({ticker,name:`Fixture ${ticker}`,currency:'USD',currentSnapshotId:snapshot.id,snapshots:[structuredClone(snapshot)]}))};
const decode=v=>String(v).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
async function start(storage=new Map(),blocked=false){
 const nodes=new Map(),elements=[];let focused=null;
 class Element{
  constructor(attrs={}){this.attrs=attrs;this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));this.value=attrs.value||'';this.checked='checked' in attrs;this.textContent='';this._html='';}
  set innerHTML(html){this._html=html;if(this===app){nodes.clear();elements.length=0;}for(const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)){const attrs=Object.fromEntries([...match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],decode(m[2]??'')]));const el=new Element(attrs);if(attrs.id)nodes.set('#'+attrs.id,el);elements.push(el);}}
  get innerHTML(){return this._html;}
  querySelectorAll(s){const key=s.match(/^\[([^\]]+)\]$/)?.[1];return key?elements.filter(el=>key in el.attrs):[];}
  click(){return this.onclick?.({target:this});}
  focus(){focused=this;}
  scrollIntoView(){}
 }
 const app=new Element(),stamp=new Element();
 const document={querySelector:s=>s==='#guided-app'?app:s==='.edition-stamp b'?stamp:nodes.get(s)||null,createElement:()=>new Element()};
 const localStorage={getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);}};
 const fetch=async path=>({ok:true,json:async()=>structuredClone(path.includes('guided-content')?content:library)});
 const deps={...engine,...current,mountSimulation:()=>()=>{},enterPanel:()=>{},reducedMotion:()=>true,document,localStorage,fetch,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},Blob:class{},setTimeout:()=>0};
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction(...Object.keys(deps),source)(...Object.values(deps));
 return {storage,app,stamp,get:s=>nodes.get(s),step:n=>elements.find(el=>el.dataset.step===String(n)).click(),state:ticker=>JSON.parse(storage.get(`valuation-lab-guided-v5:${ticker||'AAPL'}:QA-FY`)),focus:()=>focused};
}
test('guided runtime QA: all eight panels render and Back preserves source-specific assumptions and notes',async()=>{const h=await start();assert.ok(h.get('#g-cutoff'));h.step(1);h.get('#note-today').value='Original business story';h.get('#note-today').oninput();h.step(2);h.get('#g-growth').value='17';h.get('#g-growth').oninput();h.get('#guided-back').click();assert.equal(h.state().assumptions.growth,.17);assert.equal(h.state().notes.today,'Original business story');for(let i=0;i<8;i++){h.step(i);assert.ok(h.get('#guided-step-title'));assert.equal(h.state().step,i);assert.equal(h.focus(),h.get('#guided-step-title'));}assert.match(h.get('#guided-results').innerHTML,/Valuation not ready/);});
test('guided runtime QA: review gates enable current result and changing companies restores separate drafts',async()=>{const h=await start();h.get('#g-model-review').onchange({target:{checked:true}});h.step(6);h.get('#g-bridge-review').onchange({target:{checked:true}});h.step(7);assert.match(h.get('#guided-results').innerHTML,/DRAFT ESTIMATE/);h.get('#current-company').onchange({target:{value:'MSFT'}});assert.equal(h.state('MSFT').modelReviewed,false);h.get('#current-company').onchange({target:{value:'AAPL'}});assert.equal(h.state().modelReviewed,true);assert.equal(h.state().bridgeReviewed,true);assert.equal(h.state().step,7);assert.match(h.get('#guided-results').innerHTML,/DRAFT ESTIMATE/);});
test('guided runtime QA: malformed selection and draft storage cannot prevent startup',async()=>{for(const value of ['{','null','42','[]','"wrong"']){const h=await start(new Map([['valuation-lab-guided-selection',value],['valuation-lab-guided-v5:AAPL:QA-FY',value]]));assert.ok(h.get('#g-cutoff'),value);assert.equal(h.state().step,0);}});
test('guided runtime QA: disabled storage retains a usable live draft and honest export warning',async()=>{const h=await start(new Map(),true);assert.ok(h.get('#g-cutoff'));assert.match(h.get('#guided-save-state').textContent,/storage unavailable/);h.step(2);h.get('#g-growth').value='15';h.get('#g-growth').oninput();h.step(3);h.get('#guided-back').click();assert.equal(h.get('#g-growth').value,'15');});
test('guided runtime QA: worksheet changes require explicit apply and stay separate from model assumptions',async()=>{const h=await start();h.step(5);const vals={riskFree:'4',beta:'1.2',equityPremium:'5',countryPremium:'1',costOfDebt:'6',debtWeight:'30',tax:'25'};for(const [k,v]of Object.entries(vals)){h.get('#wacc-'+k).value=v;h.get('#wacc-'+k).oninput();}assert.equal(h.state().assumptions.wacc,.09);assert.equal(h.state().waccWorksheet.beta,1.2);assert.equal(h.state().assumptions.beta,undefined);h.get('#apply-wacc').click();assert.ok(Math.abs(h.state().assumptions.wacc-.0905)<1e-12);h.get('#wacc-beta').value='';h.get('#wacc-beta').oninput();h.get('#apply-wacc').click();assert.ok(Math.abs(h.state().assumptions.wacc-.0905)<1e-12);assert.match(h.get('#wacc-output').textContent,/Complete/);});
test('guided runtime QA: progress stamp tracks every actual navigation step',async()=>{const h=await start();for(let step=0;step<8;step++){h.step(step);assert.equal(h.stamp.textContent,`${String(step+1).padStart(2,'0')} / 08`);assert.match(h.app.innerHTML,new RegExp(`STEP ${step+1} OF 8`));}});
test('guided runtime QA: session draft survives company switching with browser storage disabled',async()=>{const h=await start(new Map(),true);h.step(2);h.get('#g-growth').value='17';h.get('#g-growth').oninput();h.get('#current-company').onchange({target:{value:'MSFT'}});h.get('#current-company').onchange({target:{value:'AAPL'}});assert.equal(h.get('#g-growth').value,'17');});
