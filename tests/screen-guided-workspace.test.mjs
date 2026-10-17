// Synthetic-DOM interaction contracts, not native browser/layout or AT proof.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('screen Guided: growth, margin, simulation, evidence and Undo preserve all input nodes and model state',async()=>{
 const h=await startStudio(),growth=h.get('#g-growth'),margin=h.get('#g-targetMargin'),tax=h.get('#g-tax'),base=h.state().assumptions;
 growth.focus();h.input('#g-growth','12');h.step(3);margin.focus();h.input('#g-targetMargin','35');
 assert.equal(h.get('#g-growth'),growth);assert.equal(h.get('#g-targetMargin'),margin);assert.equal(h.get('#g-tax'),tax);assert.equal(h.focus(),margin);
 const mounts=h.mounts.length,root=h.get('#simulation-lab');h.get('#guided-view-simulation').click();h.get('#guided-view-result').click();assert.equal(h.get('#simulation-lab'),root);assert.equal(h.mounts.length,mounts);
 const source=h.get('[data-evidence-source="why-targetMargin"]'),button=h.get('[data-evidence="why-targetMargin"]'),editor=h.get('.workspace-editor');button.focus();button.click();
 assert.equal(source.parent,h.get('.contextual-evidence-content'));assert.equal(editor.inert,false);assert.equal(h.get('.contextual-evidence-panel').hidden,false);
 h.document.dispatchEvent({type:'keydown',key:'Escape',preventDefault(){}});assert.equal(h.focus(),button);assert.deepEqual(button.focusOptions,{preventScroll:true});assert.equal(editor.inert,false);assert.equal(h.get('.contextual-evidence-panel').hidden,true);assert.equal(source.parent.hidden,true);
 h.get('#undo-input').click();assert.deepEqual(h.state().assumptions,{...base,growth:.12});assert.equal(h.get('#undo-input').disabled,true);
});
test('screen Guided: every assumption pane stays mounted and selected state is independent from visual view',async()=>{
 const h=await startStudio(),nodes=h.app.querySelectorAll('[data-assumption]'),notes=h.get('#note-today');h.input('#note-today','Unfinished reasoning');
 for(let step=0;step<8;step++){h.step(step);for(const node of nodes)assert.equal(h.get('#'+node.id),node);assert.equal(h.get('#note-today'),notes);assert.equal(notes.value,'Unfinished reasoning');}
 h.get('#guided-view-result').click();h.step(3);h.get('#guided-view-simulation').click();h.get('#guided-view-result').click();assert.equal(h.state().step,3);assert.equal(h.get('#editor-group-3').hidden,false);
});
test('screen Guided: mobile Evidence returns to the originating Result or Inputs view and focus',async()=>{
 const h=await startStudio(),shell=h.get('.screen-workspace');
 for(const view of ['result','inputs']){const tab=h.get('.workspace-mobile-tabs').querySelectorAll('button').find(b=>b.dataset.mobileView===view);tab.click();assert.equal(shell.dataset.mobileView,view);const b=h.get('[data-evidence="why-growth"]');b.click();assert.equal(shell.dataset.mobileView,'evidence');h.get('.contextual-evidence-close').click();assert.equal(shell.dataset.mobileView,view);assert.equal(h.focus(),b);}
});
test('screen Guided: company change while evidence is open releases detached content and preserves drafts',async()=>{
 const h=await startStudio();h.input('#g-growth','13');const prior=h.get('[data-evidence-source="history-growth"]');h.get('[data-evidence="why-growth"]').click();h.change('#current-company','MSFT');assert.equal(h.get('.contextual-evidence-panel').hidden,true);assert.notEqual(h.get('[data-evidence-source="history-growth"]'),prior);h.change('#current-company','AAPL');assert.equal(h.get('#g-growth').value,'13');
});
test('screen Guided: all fourteen companies have unique IDs and a persistent limitation plus full baseline disclosure',async()=>{
 const h=await startStudio();for(const c of h.library.companies){h.change('#current-company',c.ticker);const ids=h.app.descendants().map(n=>n.id).filter(Boolean);assert.equal(ids.length,new Set(ids).size,c.ticker);assert.ok(h.get('#model-limits-link'));assert.ok(h.get('#use-research'));assert.ok(h.get('#current-snapshot'));assert.equal(h.get('#editor-group-3').querySelectorAll('[data-assumption]').length,2);}
});
test('screen layout: natural document flow at every width and visible reduced-motion-aware feedback are declared',()=>{
 const css=read('../dist/screen-workspace.css'),html=read('../dist/index.html');assert.doesNotMatch(css,/height:calc\(100dvh - 64px\)|overflow(?:-x|-y)?:auto|scrollbar-gutter:stable/);assert.match(css,/\.pane-scroll\{overflow:visible/);assert.match(css,/@media\(max-width:1050px\),\(max-height:620px\)/);assert.match(css,/\.screen-workspace\{height:auto/);assert.match(css,/body\{overflow-x:visible\}/);assert.doesNotMatch(css,/overflow(?:-x|-y)?:hidden|font-size:(?:[0-9]|1[01])px/);assert.match(css,/--motion-fast:140ms;--motion-tab:280ms;--motion-panel:280ms/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(html,/screen-workspace\.css/);
 const slate=css.match(/\[data-theme="slate"\]\{([^}]+)\}/)[1],token=name=>slate.match(new RegExp('--'+name+':(#[0-9a-f]{6})'))[1];
 const luminance=hex=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb.reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);};
 const paper=luminance(token('paper')),series=luminance(token('chart-two'));assert.ok((Math.max(paper,series)+.05)/(Math.min(paper,series)+.05)>=3,'secondary series remains distinguishable from its chart surface');
});

test('screen Guided: input Undo retains later notes, visual category and Monte Carlo settings',async()=>{
 const h=await startStudio(),base=h.state().assumptions;h.input('#g-growth','12');h.step(3);h.input('#note-profit','Keep this reasoning');
 const config={sampleCount:1234,seed:'later-uncertainty'};h.mounts.at(-1).options.onConfigChange(config);
 h.get('#undo-input').click();assert.deepEqual(h.state().assumptions,base);assert.equal(h.state().notes.profit,'Keep this reasoning');assert.deepEqual(h.state().simulationConfig,config);assert.equal(h.state().step,3);
});
test('screen Guided: explicit case or growth-path replacement cannot use a stale input Undo',async()=>{
 const h=await startStudio();h.input('#g-growth','12');h.get('#load-base-case').click();assert.equal(h.get('#undo-input').disabled,true);h.get('#undo-base-case').click();assert.equal(h.get('#g-growth').value,'12');assert.equal(h.get('#undo-input').disabled,true);
 h.input('#g-growth','14');h.change('#growth-path-mode','maintain5');assert.equal(h.get('#undo-input').disabled,true);
});
test('screen Guided: clicking the active category or visual tab does not repeat its entrance',async()=>{
 const h=await startStudio();h.step(3);const atGroup=h.entrances.length;h.step(3);assert.equal(h.entrances.length,atGroup);
 h.get('#guided-view-simulation').click();const atView=h.entrances.length;h.get('#guided-view-simulation').click();assert.equal(h.entrances.length,atView);
 h.get('#guided-view-result').click();assert.equal(h.entrances.length,atView+1);
});
