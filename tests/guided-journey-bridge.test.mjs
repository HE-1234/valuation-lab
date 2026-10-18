import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';

test('Guided bridge withholds stale values on invalid input and restores on correction',async()=>{
 const h=await startStudio(),read=()=>JSON.parse(h.get('#guided-results').getAttribute('data-bridge'));
 const before=read();assert.ok(Number.isFinite(before.enterprise));
 h.input('#g-growth','');h.flush();
 assert.equal(read(),null);assert.match(h.get('#guided-results').textContent,/Value withheld/);
 h.input('#g-growth','10');h.flush();
 const after=read();assert.ok(Number.isFinite(after.enterprise));assert.ok(Number.isFinite(after.terminalPV));
});

test('Guided bridge component labels show contributions; total labels show totals',()=>{
 const source=fs.readFileSync(new URL('../dist/skins/report-journey.js',import.meta.url),'utf8');
 // Execute the exact label-value expression used by the presentation adapter.
 const expression=source.match(/money\((s\.kind\.startsWith\('part'\)[^,]+), b\.currency\)/)?.[1];
 assert.ok(expression,'Component and total amounts must remain distinct.');
 const amount=new Function('s','delta',`return ${expression}`);
 assert.equal(amount({kind:'part',to:30},30),30);
 assert.equal(amount({kind:'part is-terminal',from:30,to:100},70),70);
 assert.equal(amount({kind:'part is-terminal',from:-20,to:50},70),70);
 assert.equal(amount({kind:'total',to:100},100),100);
 assert.equal(amount({kind:'total is-equity',to:90},90),90);
 assert.match(source,/if \(!b \|\| !\[b\.forecastPV/,'Null publication hides the bridge.');
});

test('Guided path adapter hides preceding numeric geometry while invalid, then restores it',()=>{
 const source=fs.readFileSync(new URL('../dist/skins/report-paths.js',import.meta.url),'utf8');
 const validation=source.match(/  const valid = values.length > 0[^]*?  if \(!valid\) return;/)?.[0];
 assert.ok(validation);
 const paintGate=new Function('values','mature','el','finite',validation+'\nreturn true;');
 const el={hidden:false,classList:{toggle(){}}};
 assert.equal(paintGate([.1,.2],.3,el,Number.isFinite),true);assert.equal(el.hidden,false);
 assert.equal(paintGate([],.3,el,Number.isFinite),undefined);assert.equal(el.hidden,true);
 assert.equal(paintGate([.1,null],.3,el,Number.isFinite),undefined);assert.equal(el.hidden,true);
 assert.equal(paintGate([.15,.25],.3,el,Number.isFinite),true);assert.equal(el.hidden,false);
});
