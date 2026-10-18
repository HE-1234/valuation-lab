import {mountDocumentFlow} from './document-flow.js';
// View navigation is separate from all model and saved-draft identities.
export const workspacePages={
 current:{section:'studio',label:'Guided valuation'},renewed:{section:'studio',label:'Year-by-year'},workbench:{section:'studio',label:'Historical'},
 history:{section:'research',label:'Research library'},data:{section:'research',label:'Sources'},learn:{section:'learn',label:'Learn'}
};
const sectionLabels={studio:'Studio',research:'Research',learn:'Learn'};
export function mountWorkspaceNavigation({document=globalThis.document,window=globalThis.window,history=globalThis.history,location=globalThis.location,enter=()=>{}}={}){
 const releaseDocumentFlow=mountDocumentFlow(document);
 const last={studio:'renewed',research:'history',learn:'learn'};let current='renewed';
 function show(page,{record=true,animate=true}={}){
  if(!Object.hasOwn(workspacePages,page))return false;
  const info=workspacePages[page],changed=page!==current;current=page;last[info.section]=page;
  if(document.body)document.body.dataset.workspacePage=page;
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('hidden',el.id!==page));
  document.querySelectorAll('[data-tab]').forEach(el=>{const active=el.dataset.tab===page;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'page':'false');});
  document.querySelectorAll('[data-primary]').forEach(el=>{const active=el.dataset.primary===info.section;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'page':'false');});
  document.querySelectorAll('[data-mode-group]').forEach(el=>{el.hidden=el.dataset.modeGroup!==info.section;});
  const breadcrumb=document.querySelector('#breadcrumb');if(breadcrumb)breadcrumb.textContent=info.section==='learn'?'Workspace / Learn':`${sectionLabels[info.section]} / ${info.label}`;
  if(record&&location.hash!=='#'+page)history.pushState(null,'','#'+page);
  if(changed){window.dispatchEvent(new CustomEvent('valuation:tab-change',{detail:page}));if(animate)enter(document.getElementById(page));}
  return true;
 }
 document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>show(el.dataset.tab));
 document.querySelectorAll('[data-primary]').forEach(el=>el.onclick=()=>show(last[el.dataset.primary]));
 document.querySelectorAll('[data-page-link]').forEach(el=>el.onclick=e=>{e.preventDefault();show(el.dataset.pageLink);});
 const onLocation=()=>show(location.hash?location.hash.slice(1):'renewed',{record:false,animate:false});
 window.addEventListener('popstate',onLocation);window.addEventListener('hashchange',onLocation);
 show(Object.hasOwn(workspacePages,location.hash.slice(1))?location.hash.slice(1):'renewed',{record:false,animate:false});
 return {show,getPage:()=>current,destroy(){releaseDocumentFlow();window.removeEventListener('popstate',onLocation);window.removeEventListener('hashchange',onLocation);}};
}
