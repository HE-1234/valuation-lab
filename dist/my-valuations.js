// "My valuations": named versions saved as files in data/my-valuations/.
// The dev server (.claude/serve-dev.py) writes them; any static server can read them.
const API='./api/my-valuations',INDEX='./data/my-valuations/index.json',FILES='./data/my-valuations/';
let state={writable:false,valuations:[]},loading=null;const listeners=new Set(),drafts=new Map();
const notify=()=>listeners.forEach(fn=>{try{fn(state)}catch{}});
const valid=index=>index&&Array.isArray(index.valuations)?index.valuations.filter(r=>r&&typeof r.id==='string'&&typeof r.file==='string'&&/^[\w.-]+\.json$/.test(r.file)):[];

async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(String(r.status));return r.json();}
/** Load the library once; the dev server says whether saving is possible. */
export function loadMyValuations({refresh=false}={}){
 if(loading&&!refresh)return loading;
 loading=(async()=>{
  try{const index=await getJSON(API);state={writable:index.writable===true,valuations:valid(index)};}
  catch{try{state={writable:false,valuations:valid(await getJSON(INDEX))};}catch{state={writable:false,valuations:[]};}}
  notify();return state;
 })();
 return loading;
}
export const myValuationsState=()=>state;
export function onMyValuationsChange(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export const valuationsFor=(model,ticker)=>state.valuations.filter(r=>r.model===model&&r.ticker===ticker).sort((a,b)=>(b.default-a.default)||String(b.savedAt).localeCompare(String(a.savedAt)));
export const defaultValuation=(model,ticker)=>state.valuations.find(r=>r.model===model&&r.ticker===ticker&&r.default)||null;
/** The saved draft of one version (cached after the first read). */
export async function loadValuationDraft(row){
 if(drafts.has(row.id))return structuredClone(drafts.get(row.id));
 const saved=await getJSON(FILES+row.file);if(!saved||saved.id!==row.id||saved.draft==null)throw Error('The saved file does not match its index entry.');
 drafts.set(row.id,saved.draft);return structuredClone(saved.draft);
}
/** Fetch every default draft for a model so the first render can use them synchronously. */
export async function preloadDefaults(model){
 await loadMyValuations();const out=new Map();
 await Promise.all(state.valuations.filter(r=>r.model===model&&r.default).map(async r=>{try{out.set(r.ticker,{row:r,draft:await loadValuationDraft(r)});}catch{}}));
 return out;
}
async function post(body){
 const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 let data=null;try{data=await r.json();}catch{}
 if(!r.ok)throw Error(data?.error||(r.status===501||r.status===404?'not-writable':'HTTP '+r.status));
 state={writable:true,valuations:valid(data)};notify();return state;
}
const slug=name=>(String(name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40))||'valuation';
const stamp=()=>new Date().toISOString().replace(/\D/g,'').slice(0,14);
export async function saveValuation({model,ticker,name,baseId,baseLabel,perShare,currency,isDefault,draft,id}){
 const vid=id||`${model}-${ticker}-${slug(name)}-${stamp()}`;drafts.set(vid,structuredClone(draft));
 await post({op:'save',valuation:{id:vid,ticker,name,baseId,baseLabel,perShare:Number.isFinite(perShare)?perShare:null,currency,default:!!isDefault},draft});
 return vid;
}
export const deleteValuation=id=>{drafts.delete(id);return post({op:'delete',id});};
export const setDefaultValuation=(id,value)=>post({op:'default',id,value});
export const renameValuation=(id,name)=>post({op:'rename',id,name});
