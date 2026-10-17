// Minimal-DOM and stylesheet contracts; these do not establish real browser or AT behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
const errorText=h=>h.get('.valuation-unavailable')?.querySelector('p')?.textContent;
const checkIssue=h=>{
 const message=errorText(h),issue=h.get('#assumption-issue');
 assert.equal(issue.hidden,!message);
 assert.equal(h.get('#assumption-issue-message').textContent,message||'');
};

test('assumption issue: nearby hidden feedback adds no controls or duplicate live region',async()=>{
 const h=await startStudio(),issue=h.get('#assumption-issue'),siblings=issue.parent.children;
 assert.equal(issue.hidden,true);assert.equal(issue.getAttribute('role'),'note');
 assert.equal(issue.getAttribute('aria-labelledby'),'assumption-issue-title');
 assert.equal(h.get('#assumption-issue-title').textContent,'Value withheld');
 assert.ok(siblings.indexOf(h.get('.assumption-tabs'))<siblings.indexOf(issue));
 assert.ok(siblings.indexOf(issue)<siblings.indexOf(h.get('#assumption-editor')));
 assert.equal(issue.getAttribute('aria-live'),null);assert.equal(issue.getAttribute('tabindex'),null);
 assert.equal(issue.querySelectorAll('button').length,0);
 assert.equal(h.get('#guided-results').getAttribute('aria-live'),'polite');
});

test('assumption issue: invalid editing and recovery mirror the existing result without replacing inputs',async()=>{
 const h=await startStudio(),input=h.get('#g-growth'),issue=h.get('#assumption-issue');
 input.focus();h.input('#g-growth','');checkIssue(h);
 assert.equal(h.get('#g-growth'),input);assert.equal(h.focus(),input);
 assert.equal(h.get('#simulation-lab').innerHTML,'');assert.equal(h.mounts.at(-1).released,true);
 h.input('#g-growth','12');checkIssue(h);h.flush();
 assert.equal(h.get('#assumption-issue'),issue);assert.equal(h.get('#g-growth'),input);assert.equal(h.focus(),input);
 h.step(5);const wacc=h.get('#g-wacc');wacc.focus();h.input('#g-wacc','1');checkIssue(h);
 assert.equal(issue.hidden,false);assert.match(h.get('#assumption-issue-message').textContent,/WACC|growth/i);
 h.input('#g-wacc','10');checkIssue(h);assert.equal(h.get('#g-wacc'),wacc);assert.equal(h.focus(),wacc);
 assert.equal(h.app.querySelectorAll('[type="checkbox"]').length,0);
});

test('assumption issue: category navigation retains the current issue and saved user values',async()=>{
 const h=await startStudio();h.input('#g-growth','12');h.step(5);h.input('#g-wacc','1');
 const issue=h.get('#assumption-issue'),message=h.get('#assumption-issue-message').textContent,mounts=h.mounts.length;
 for(const step of [2,3,4,5,6,1,0,7,5]){h.step(step);assert.equal(h.get('#assumption-issue'),issue);assert.equal(issue.hidden,false);assert.equal(h.get('#assumption-issue-message').textContent,message);}
 assert.equal(h.mounts.length,mounts);
 const restored=await startStudio({storage:h.storage});checkIssue(restored);assert.equal(restored.get('#assumption-issue').hidden,false);
 assert.equal(restored.state().assumptions.growth,.12);assert.equal(restored.state().assumptions.wacc,.01);
 restored.input('#g-wacc','10');checkIssue(restored);restored.flush();assert.equal(restored.state().assumptions.growth,.12);
 for(const step of [2,3,4,5,6,1,0,7]){restored.step(step);checkIssue(restored);assert.equal(restored.get('#assumption-issue').hidden,true);assert.equal(restored.get('#assumption-issue').getAttribute('aria-live'),null);}
 restored.change('#current-company','GOOG');checkIssue(restored);assert.equal(restored.get('#assumption-issue').hidden,true);
});

test('assumption issue: all company baselines mirror existing source/model gates',async()=>{
 const h=await startStudio();
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  for(const snapshot of company.snapshots){h.change('#current-snapshot',snapshot.id);checkIssue(h);}
 }
 for(const ticker of ['TSM','NBIS']){h.change('#current-company',ticker);checkIssue(h);assert.equal(h.get('#assumption-issue').hidden,false);assert.equal(h.get('#simulation-lab').innerHTML,'');}
 h.change('#current-company','AAPL');checkIssue(h);assert.equal(h.get('#assumption-issue').hidden,true);
});

test('assumption issue: AAOI and Alphabet claims keep their existing validation and recovery',async()=>{
 const h=await startStudio();
 for(const [ticker,key]of [['AAOI','noteFairValue'],['GOOG','noncontrollingClaim']]){
  h.change('#current-company',ticker);h.step(6);checkIssue(h);assert.equal(h.get('#assumption-issue').hidden,true);
  const input=h.get('#claim-'+key),prior=input.value;input.focus();h.input('#claim-'+key,'-1');checkIssue(h);
  assert.equal(h.get('#assumption-issue').hidden,false);assert.equal(h.get('#claim-'+key),input);assert.equal(h.focus(),input);assert.equal(h.get('#simulation-lab').innerHTML,'');
  h.input('#claim-'+key,prior);h.flush();checkIssue(h);assert.equal(h.get('#assumption-issue').hidden,true);assert.ok(h.get('.claims-result-note'));
 }
});

test('assumption issue: wrapping, hidden state and existing six-theme warning colors retain contrast',()=>{
 const rules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^}]+)\}/g)];
 const style=selector=>Object.assign({},...rules.filter(m=>m[1].split(',').some(s=>s.trim()===selector)).map(m=>Object.fromEntries(m[2].split(';').filter(s=>s.includes(':')).map(s=>{const i=s.indexOf(':');return[s.slice(0,i).trim(),s.slice(i+1).trim()]}))));
 const box=style('.assumption-issue');assert.equal(box.color,'var(--warning)');assert.equal(box.background,'var(--warning-bg)');assert.equal(box['overflow-wrap'],'anywhere');assert.equal(box['min-width'],'0');assert.equal(style('.assumption-issue[hidden]').display,'none');assert.equal(style('.assumption-issue p')['font-size'],'13px');assert.equal(style('.assumption-issue h3')['font-size'],'14px');
 const lum=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 for(const theme of ['forest','slate','midnight','sand','plum','ocean']){const t={...style(':root'),...style(`[data-theme="${theme}"]`)},a=lum(t['--warning']),b=lum(t['--warning-bg']);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,theme);}
});
