// Runtime and DOM identity tests. This fixture deliberately makes no claims
// about browser geometry, screenshots, contrast, or assistive technology.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {calculateResearchOperating} from '../dist/research-model.js';

const switchView=(h,key)=>h.get(`[data-annual-view="${key}"]`).click();
const switchEditor=(h,key)=>h.get(`[data-annual-editor="${key}"]`).click();
const value=h=>h.get('.research-big-value')?.textContent;
const proxy=field=>`[data-year-field="${field}"]`;

test('annual screen: view and editor switches keep every input, summary, notes and simulation mounted',async()=>{
 const mounts=[],h=await startResearchWorkspace({simulationMount:(root,options)=>{mounts.push({root,options});return ()=>{};}});
 const fields=[...h.root.querySelectorAll('[data-research-input]')],proxies=[...h.root.querySelectorAll('[data-year-field]')],notes=h.get('#research-notes'),summary=h.get('#research-results'),writes=h.root.innerHTMLWrites;
 h.input('#research-notes','My uncommitted reasoning');
 for(const view of ['simulation','schedule','result','simulation','result']){switchView(h,view);assert.equal(h.get('.screen-workspace').dataset.view,view);assert.equal(h.get('.workspace-main').dataset.view,view);assert.equal(h.get(`[data-annual-pane="${view}"]`).hidden,false);assert.strictEqual(h.get('#research-results'),summary);}
 for(const editor of ['terminal','claims','timing','notes','annual'])switchEditor(h,editor);
 assert.deepEqual(h.root.querySelectorAll('[data-research-input]'),fields);assert.deepEqual(h.root.querySelectorAll('[data-year-field]'),proxies);assert.strictEqual(h.get('#research-notes'),notes);assert.equal(notes.value,'My uncommitted reasoning');assert.equal(h.root.innerHTMLWrites,writes);assert.equal(mounts.length,1);assert.equal(h.saved().notes,'My uncommitted reasoning');
});

test('annual screen: each year groups growth, revenue, margin, tax, investment and WACC without rewriting source cells',async()=>{
 const h=await startResearchWorkspace(),sourceNodes=h.root.querySelectorAll('[data-research-input="annual"]'),before=h.getState().draft,writes=h.writes.length;
 assert.equal(h.root.querySelectorAll('[data-year-field]').length,6);assert.equal(sourceNodes.length,before.annual.length*5);
 for(let index=0;index<before.annual.length;index++){
  h.change('#annual-edit-year',index);
  for(const [field,scale]of [['revenue',1],['margin',100],['taxRate',100],['reinvestment',1],['wacc',100]]){
   const el=h.get(proxy(field));el.onfocus();assert.equal(el.value,String(before.annual[index][field]*scale));el.onblur();
  }
 }
 assert.equal(h.writes.length,writes);assert.deepEqual(h.getState().draft,before);assert.deepEqual(h.root.querySelectorAll('[data-research-input="annual"]'),sourceNodes);
});

test('annual screen: exact proxy revenue edits update one authoritative cell and keep unrelated years untouched',async()=>{
 const h=await startResearchWorkspace(),before=h.getState().draft;h.change('#annual-edit-year',3);
 const el=h.get(proxy('revenue')),source=h.get(h.field('annual','revenue',3));el.focus();el.onfocus();h.input(proxy('revenue'),'812345.6789012345');
 assert.equal(h.getState().draft.annual[3].revenue,812345.6789012345);assert.equal(source.dataset.raw,'812345.6789012345');assert.equal(el.value,'812345.6789012345');assert.strictEqual(h.focus(),el);assert.equal(h.saved().annual[3].revenue,812345.6789012345);
 for(let i=0;i<before.annual.length;i++)if(i!==3)assert.deepEqual(h.getState().draft.annual[i],before.annual[i]);
 assert.match(h.get('#annual-input-origin').textContent,/Your edits/);assert.notEqual(value(h),undefined);
});

test('annual screen: growth edits only selected revenue and preserves the exact typed percentage',async()=>{
 const h=await startResearchWorkspace(),before=h.getState().draft,previous=before.annual[1].revenue;h.change('#annual-edit-year',2);
 const el=h.get(proxy('growth'));el.onfocus();h.input(proxy('growth'),'17.123456789');
 assert.equal(h.getState().draft.annual[2].revenue,previous*(1+17.123456789/100));assert.equal(el.value,'17.123456789');assert.deepEqual(h.getState().draft.annual[3],before.annual[3]);
 assert.equal(Number(h.get(proxy('revenue')).dataset.raw),h.getState().draft.annual[2].revenue);
});

test('annual screen: schedule and contextual editor synchronize exact margin and tax values both ways',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-edit-year',2);
 h.input(proxy('margin'),'28.123456789');h.input(proxy('taxRate'),'19.987654321');
 assert.equal(h.getState().draft.annual[2].margin,28.123456789/100);assert.equal(h.getState().draft.annual[2].taxRate,19.987654321/100);
 switchView(h,'schedule');h.input(h.field('annual','margin',2),'32.123456789');switchView(h,'result');
 const margin=h.get(proxy('margin'));margin.onfocus();assert.equal(margin.value,'32.123456789');assert.equal(h.get('#annual-edit-year').value,'2');
});

test('annual screen: blank and malformed proxy edits withhold stale values and preserve correction text',async()=>{
 const h=await startResearchWorkspace(),revenue=h.get(proxy('revenue')),original=revenue.dataset.raw;
 revenue.onfocus();h.input(proxy('revenue'),'1,2');assert.equal(revenue.value,'1,2');assert.equal(revenue.getAttribute('aria-invalid'),'true');assert.equal(value(h),undefined);
 h.input(proxy('revenue'),'');assert.equal(h.getState().draft.annual[0].revenue,null);assert.equal(value(h),undefined);
 h.input(proxy('revenue'),original);assert.equal(revenue.value,original);assert.equal(revenue.getAttribute('aria-invalid'),'false');assert.ok(value(h));
});

test('annual screen: a growth edit cannot turn an unknown preceding revenue into an invented base',async()=>{
 const h=await startResearchWorkspace();h.input(h.field('annual','revenue',0),'');h.change('#annual-edit-year',1);h.input(proxy('growth'),'10');
 assert.equal(Number.isNaN(h.getState().draft.annual[1].revenue),true);assert.equal(h.get(proxy('growth')).getAttribute('aria-invalid'),'true');assert.equal(value(h),undefined);
});

test('annual screen: Undo edit restores an entire typing interaction while preserving preset Undo',async()=>{
 const h=await startResearchWorkspace(),original=h.getState().draft,revenue=h.get(proxy('revenue'));revenue.onfocus();
 for(const typed of ['600','60000','600000'])h.input(proxy('revenue'),typed);
 h.action('undo-edit');assert.deepEqual(h.getState().draft,original);assert.equal(h.get('[data-research-action="undo-edit"]').disabled,true);
 h.input(proxy('revenue'),'700000');const edited=h.getState().draft;h.action('use-research');h.input(proxy('margin'),'35');h.action('undo-edit');assert.equal(h.getState().draft.annual[0].revenue,original.annual[0].revenue);h.action('undo');assert.deepEqual(h.getState().draft,edited);assert.equal(h.get('[data-research-action="undo-edit"]').disabled,true,'load restoration clears obsolete edit undo');
});

test('annual screen: one-action evidence round trip preserves source identity, inputs, focus and scroll',async()=>{
 const h=await startResearchWorkspace(),button=h.get('[data-annual-evidence="profitability"]'),node=h.get('#annual-evidence-profitability'),parent=node.parentNode,editor=h.get('#research-editor'),input=h.get(proxy('margin'));
 editor.scrollTop=85;button.focus();button.click();assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(Boolean(editor.inert),false);assert.strictEqual(h.get('.contextual-evidence-content').children[0],node);assert.match(h.get('.contextual-evidence-title').textContent,/Margin/);assert.strictEqual(h.get(proxy('margin')),input);
 h.get('.contextual-evidence-content').scrollTop=120;h.get('.contextual-evidence-close').click();assert.equal(h.get('#annual-contextual-evidence').hidden,true);assert.equal(Boolean(editor.inert),false);assert.strictEqual(node.parentNode,parent);assert.strictEqual(h.focus(),button);assert.deepEqual(button.focusOptions,{preventScroll:true});assert.equal(editor.scrollTop,85);
 button.click();assert.equal(h.get('.contextual-evidence-content').scrollTop,120);h.document.dispatch('keydown',{key:'Escape'});assert.equal(h.get('#annual-contextual-evidence').hidden,true);assert.strictEqual(h.focus(),button);
});

test('annual screen: mobile evidence restores its actual preceding Result or Inputs view',async()=>{
 const h=await startResearchWorkspace();
 for(const view of ['result','inputs']){
  h.get(`[data-annual-mobile="${view}"]`).click();h.get('[data-annual-mobile="evidence"]').click();assert.equal(h.get('.screen-workspace').dataset.mobileView,'evidence');h.document.dispatch('keydown',{key:'Escape'});assert.equal(h.get('.screen-workspace').dataset.mobileView,view);assert.strictEqual(h.focus(),h.get('[data-annual-mobile="evidence"]'));
 }
});

test('annual screen: per-company year/view/editor selection survives switches without changing economics',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-edit-year',4);switchEditor(h,'terminal');switchView(h,'schedule');const before=h.getState().draft,valueBefore=calculateResearchOperating(before).enterprise;
 h.select('MU');h.change('#annual-edit-year',2);switchView(h,'simulation');h.select('AAPL');assert.equal(h.get('#annual-edit-year').value,'4');assert.equal(h.get('.screen-workspace').dataset.view,'schedule');assert.equal(h.get('[data-annual-editor="terminal"]').getAttribute('aria-selected'),'true');assert.equal(calculateResearchOperating(h.getState().draft).enterprise,valueBefore);
 h.select('MU');assert.equal(h.get('#annual-edit-year').value,'2');assert.equal(h.get('.screen-workspace').dataset.view,'simulation');
});

test('annual screen: keyboard tabs and schedule row navigation keep names, selection and focus coherent',async()=>{
 const h=await startResearchWorkspace();const result=h.get('[data-annual-view="result"]');result.onkeydown({key:'ArrowRight',preventDefault(){}});assert.equal(h.get('.screen-workspace').dataset.view,'simulation');assert.strictEqual(h.focus(),h.get('[data-annual-view="simulation"]'));
 h.get('[data-annual-view="simulation"]').onkeydown({key:'End',preventDefault(){}});assert.equal(h.get('.screen-workspace').dataset.view,'schedule');
 const first=h.get(h.field('annual','margin',0)),second=h.get(h.field('annual','margin',1));first.onkeydown({key:'Enter',preventDefault(){}});assert.strictEqual(h.focus(),second);assert.notEqual(second.focusOptions?.preventScroll,true,'keyboard row moves must let the browser reveal an offscreen cell');second.onkeydown({key:'ArrowUp',preventDefault(){}});assert.strictEqual(h.focus(),first);
});

test('annual screen: changing companies with evidence open cannot transplant stale content or overwrite new context',async()=>{
 const h=await startResearchWorkspace();h.get('[data-annual-evidence="growth"]').click();const old=h.get('#annual-evidence-growth');h.select('TSM');assert.equal(h.get('#annual-contextual-evidence').hidden,true);assert.equal(old.isConnected,false);assert.match(h.get('#annual-evidence-growth').textContent,/TSM/);assert.equal(h.get('.screen-workspace').dataset.mobileView,'result');
});


test('annual screen: choosing a new central view interrupts evidence without making input panes inert',async()=>{
 const h=await startResearchWorkspace();h.get('[data-annual-evidence="result"]').click();assert.equal(Boolean(h.get('#annual-schedule-view').inert),false);switchView(h,'simulation');assert.equal(h.get('#annual-contextual-evidence').hidden,true);assert.equal(Boolean(h.get('#research-editor').inert),false);assert.equal(Boolean(h.get('#annual-schedule-view').inert),false);assert.equal(h.get('.screen-workspace').dataset.view,'simulation');
});


test('annual screen: chart labels abbreviate quantities with room for readable SVG type',async()=>{
 const h=await startResearchWorkspace(),chart=h.get('.annual-path-chart');assert.equal(chart.querySelector('.annual-chart-grid').getAttribute('x1'),'90');const labels=chart.querySelectorAll('text');assert.equal(labels.length,6);assert.ok(labels.every(label=>label.getAttribute('font-size')==='16'));assert.ok(labels.some(label=>/\d[\d.]*k$/.test(label.textContent)));
});


test('annual screen: static evidence stays mounted while different original assumptions are edited',async()=>{
 const h=await startResearchWorkspace(),margin=h.get(proxy('margin')),terminal=h.get(h.field('terminal','wacc')),schedule=h.root.querySelectorAll('[data-research-input="annual"]');
 h.get('[data-annual-evidence="profitability"]').click();const evidence=h.get('#annual-evidence-profitability'),content=h.get('.contextual-evidence-content');
 margin.focus();h.input(proxy('margin'),'31.123456789');
 assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(h.get('#research-editor').hidden,false);
 assert.equal(Boolean(h.get('#research-editor').inert),false);assert.equal(h.focus(),margin);assert.equal(margin.value,'31.123456789');
 assert.equal(h.saved().annual[0].margin,31.123456789/100);assert.equal(evidence.parentNode,content);
 switchEditor(h,'terminal');terminal.focus();h.input(h.field('terminal','wacc'),'11.123456789');
 assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(h.focus(),terminal);
 assert.equal(h.getState().draft.terminal.wacc,11.123456789/100);assert.deepEqual(h.root.querySelectorAll('[data-research-input="annual"]'),schedule);
 h.get('.contextual-evidence-close').click();assert.equal(evidence.parentNode.className,'annual-evidence-store');h.destroy();
});

test('annual screen: dynamic cash-flow evidence refreshes across edits without stale sources or focus jumps',async()=>{
 const h=await startResearchWorkspace(),input=h.get(proxy('revenue'));
 h.get('[data-annual-evidence="calculations"]').click();const original=h.get('[data-annual-analysis="calculations"]'),before=original.textContent;
 input.focus();h.input(proxy('revenue'),'600000.123456789');
 const updated=h.get('[data-annual-analysis="calculations"]');
 assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(h.focus(),input);
 assert.equal(input.value,'600000.123456789');assert.equal(updated.parentNode,h.get('.contextual-evidence-content'));
 assert.notEqual(updated,original);assert.notEqual(updated.textContent,before);assert.equal(original.isConnected,false);
 assert.equal(h.root.querySelectorAll('[data-annual-analysis="calculations"]').length,1);
 h.get('.contextual-evidence-close').click();assert.equal(updated.parentNode,h.get('#research-analysis'));h.destroy();
});

test('annual screen: open value evidence withholds stale values on invalid edits and recovers without dismissal',async()=>{
 const h=await startResearchWorkspace(),input=h.get(proxy('revenue')),original=input.dataset.raw;
 h.get('[data-annual-evidence="result"]').click();input.focus();h.input(proxy('revenue'),'');
 assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(h.focus(),input);
 assert.match(h.get('.contextual-evidence-content').textContent,/unavailable.*input issues/);
 h.input(proxy('revenue'),original);assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(h.focus(),input);
 assert.equal(h.get('#annual-result-evidence').parentNode,h.get('.contextual-evidence-content'));
 assert.equal(h.root.querySelectorAll('#annual-result-evidence').length,1);h.destroy();
});

test('annual screen: evidence leaves exact schedule and mounted simulation setup editable',async()=>{
 const h=await startResearchWorkspace({simulationMount:root=>{root.innerHTML='<div class="mc-setup"><input id="test-uncertainty" value="10"></div>';return ()=>{};}});
 switchView(h,'schedule');const schedule=h.get('#annual-schedule-view'),input=h.get(h.field('annual','revenue',0));
 h.get('[data-annual-mobile="evidence"]').click();assert.equal(schedule.hidden,false);assert.equal(Boolean(schedule.inert),false);
 input.focus();h.input(h.field('annual','revenue',0),'600000');assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(h.focus(),input);assert.equal(h.saved().annual[0].revenue,600000);
 switchView(h,'simulation');const setup=h.get('.mc-setup'),uncertainty=h.get('#test-uncertainty');
 h.get('[data-annual-mobile="evidence"]').click();assert.equal(Boolean(setup.inert),false);assert.equal(h.get('#annual-simulation-view').hidden,false);
 uncertainty.focus();uncertainty.value='12';assert.equal(h.focus(),uncertainty);assert.equal(h.get('#annual-contextual-evidence').hidden,false);h.destroy();
});


test('annual screen: repeated result, transition and preset refreshes retain focus, sources and disclosure choices',async()=>{
 const h=await startResearchWorkspace(),input=h.get(proxy('revenue'));
 h.document.scrollingElement=h.root;
 for(const key of ['result','transition','preset']){
  h.get(`[data-annual-evidence="${key}"]`).click();
  const before=h.get('.contextual-evidence-content'),details=before.querySelectorAll('details');
  for(const disclosure of details)disclosure.open=false;
  input.focus();h.root.scrollTop=420;
  for(const typed of ['620000.123456789','630000.987654321']){
   h.input(proxy('revenue'),typed);assert.equal(h.get('#annual-contextual-evidence').hidden,false);assert.equal(h.focus(),input);
   assert.equal(h.root.scrollTop,420);assert.equal(input.value,typed);assert.equal(h.saved().annual[0].revenue,Number(typed));
   assert.equal(input.getAttribute('aria-controls'),null);assert.equal(Boolean(h.get('#research-editor').inert),false);
   assert.ok(h.get('.contextual-evidence-content').querySelectorAll('details').every(node=>!node.open));
   for(const node of h.get('.contextual-evidence-content').querySelectorAll('[id]'))assert.equal(h.root.querySelectorAll('#'+node.id).length,1);
  }
  h.get('.contextual-evidence-close').click();assert.equal(h.get('#annual-contextual-evidence').hidden,true);
 }
 h.destroy();
});

test('annual screen: mobile Inputs remains available when evidence opens from a full-width output view',async()=>{
 const h=await startResearchWorkspace();switchView(h,'schedule');h.get('[data-annual-mobile="inputs"]').click();
 assert.equal(h.get('#research-editor').hidden,false);h.get('[data-annual-evidence="profitability"]').click();
 assert.equal(h.get('#research-editor').hidden,false);assert.equal(h.get('#annual-schedule-view').hidden,false);
 h.get('.contextual-evidence-close').click();assert.equal(h.get('.screen-workspace').dataset.mobileView,'inputs');assert.equal(h.get('#research-editor').hidden,false);h.destroy();
});

test('annual screen: passive evidence refresh does not replay panel motion or cancel live result feedback',async()=>{
 const h=await startResearchWorkspace(),animations=[];
 h.document.defaultView={matchMedia:()=>({matches:false}),addEventListener(){}};
 Object.getPrototypeOf(h.root).animate=function(frames,options){const animation={node:this,frames,options,canceled:false,cancel(){this.canceled=true;}};animations.push(animation);return animation;};
 h.get('[data-annual-evidence="calculations"]').click();assert.equal(animations.length,1);
 const input=h.get(proxy('revenue'));input.focus();h.input(proxy('revenue'),'640000.123456');
 assert.equal(animations.length,3);assert.equal(animations[0].canceled,true);
 assert.ok(animations.slice(1).every(animation=>!animation.canceled&&animation.frames[0].transform==='translateY(4px)'));
 assert.equal(h.focus(),input);h.destroy();
});
