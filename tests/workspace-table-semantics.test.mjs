// Native semantics and minimal-DOM contracts; not a screen-reader or layout oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {currentSnapshot,calculateCurrent} from '../dist/current-model.js';
const num=(v,d=1)=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('en-US',{maximumFractionDigits:d}):'—';
const tables=h=>h.app.querySelectorAll('.workspace-table');
const named=(h,name)=>tables(h).find(t=>t.querySelector('caption').textContent===`${h.get('#current-company').value} · ${name}`);
const cells=t=>t.querySelector('tbody').querySelectorAll('tr').map(r=>r.children.map(c=>c.textContent));
const snapshot=h=>{const c=h.library.companies.find(c=>c.ticker===h.get('#current-company').value),raw=c.snapshots.find(s=>s.id===h.get('#current-snapshot').value);return currentSnapshot(c,raw);};
function checkSemantics(h){
 const names=[];
 for(const t of tables(h)){
  const caption=t.querySelector('caption');assert.equal(caption.parent,t);assert.equal(caption.querySelector('span').getAttribute('class'),'sr-only');
  assert.ok(caption.textContent.startsWith(h.get('#current-company').value+' · '));names.push(caption.textContent);
  for(const el of [t,caption])for(const attribute of ['role','tabindex','aria-live','aria-hidden'])assert.equal(el.getAttribute(attribute),null);
  const headers=t.querySelector('thead').querySelectorAll('th');assert.ok(headers.length>=2);
  for(const th of headers)assert.equal(th.getAttribute('scope'),'col');
  for(const row of t.querySelector('tbody').querySelectorAll('tr')){
   assert.equal(row.children.length,headers.length);assert.equal(row.children[0].tag,'th');assert.equal(row.children[0].getAttribute('scope'),'row');
   for(const cell of row.children.slice(1))assert.equal(cell.tag,'td');
  }
 }
 assert.equal(new Set(names).size,names.length,'Visible workspace tables have distinct names');
}

test('workspace tables: every company/baseline has a name and native row/column headers, with unchanged source and forecast values',async()=>{
 const h=await startStudio();let baselines=0,supported=0,totalTables=0;
 for(const company of h.library.companies){
  h.change('#current-company',company.ticker);
  for(const raw of company.snapshots){
   baselines++;h.change('#current-snapshot',raw.id);
   h.step(0);checkSemantics(h);totalTables+=tables(h).length;
   const source=named(h,'Field-level evidence ledger');assert.ok(source);
   assert.deepEqual(cells(source).map(r=>r.slice(0,2)),Object.entries(raw.facts||{}).map(([key,value])=>[key,num(value)]));
   h.step(6);checkSemantics(h);
   const captured=named(h,'Captured source bridge');assert.ok(captured);const s=snapshot(h);
   assert.deepEqual(cells(captured).map(r=>r[1]),[num(s.cash),num(s.debt),num(s.shares,2)]);
   h.step(7);checkSemantics(h);
   let v;try{v=calculateCurrent(s,h.state(company.ticker));}catch{}
   if(v){supported++;assert.deepEqual(cells(named(h,'Annual cash-flow forecast')),v.rows.map(r=>[String(r.year),num(r.revenue),num(r.ebit),num(r.reinvestment),num(r.fcff)]));}
   else assert.equal(named(h,'Annual cash-flow forecast'),undefined,'Unsupported models do not expose a stale forecast');
  }
 }
 assert.equal(baselines,35);assert.equal(supported,19);assert.equal(totalTables,102);
});

test('workspace tables: source-specific claims and staged paths keep table identity across the supported alternatives',async()=>{
 const h=await startStudio();
 for(const ticker of ['AAOI','GOOG']){
  h.change('#current-company',ticker);h.step(6);
  const methods=ticker==='AAOI'?['fair-value','principal-only','if-converted']:['if-converted','liquidation-proxy'];
  for(const method of methods){
   h.change('#claim-method',method);h.flush();checkSemantics(h);
   const bridge=named(h,'Enterprise to common equity'),allocation=named(h,'Common-share allocation'),sensitivities=named(h,'Claims-only sensitivities');
   assert.ok(bridge&&allocation&&sensitivities);const v=calculateCurrent(snapshot(h),h.state(ticker));
   assert.equal(cells(bridge).at(-1)[1],num(v.equity,2));assert.equal(cells(allocation).at(-1)[1],num(v.claimsBridge.allocationShares,6));
   assert.equal(!!named(h,'Preferred dividend schedule'),v.claimsBridge.dividends.length>0);
   if(v.claimsBridge.dividends.length)assert.deepEqual(cells(named(h,'Preferred dividend schedule')),v.claimsBridge.dividends.map(x=>[x.date,num(x.amount,4),num(x.presentValue,4)]));
  }
  h.step(7);checkSemantics(h);
  if(ticker==='AAOI'){
   assert.ok(named(h,'Staged annual operating path'));assert.ok(named(h,'Margin and capital-productivity stresses'));
   h.change('#operating-profile','linear-v1');h.flush();assert.equal(named(h,'Staged annual operating path'),undefined);checkSemantics(h);
  }
 }
});

test('workspace tables: live edits preserve focus, clear invalid tables, recover, navigate and reload without extra controls',async()=>{
 const h=await startStudio();h.change('#current-company','GOOG');h.step(6);
 const control=h.get('#claim-noncontrollingClaim');control.focus();h.input('#claim-noncontrollingClaim','9123');h.flush();
 assert.equal(h.get('#claim-noncontrollingClaim'),control);assert.equal(h.focus(),control);checkSemantics(h);
 assert.ok(cells(named(h,'Enterprise to common equity')).some(r=>r[1].includes('9,123')));
 h.input('#claim-noncontrollingClaim','');assert.equal(named(h,'Enterprise to common equity'),undefined);assert.ok(h.get('.valuation-unavailable'));
 h.input('#claim-noncontrollingClaim','9123');h.flush();assert.equal(h.get('.valuation-unavailable'),null);checkSemantics(h);
 const result=h.get('#guided-results').innerHTML,mounts=h.mounts.length;
 h.step(7);h.step(0);h.step(6);assert.equal(h.get('#guided-results').innerHTML,result);assert.equal(h.mounts.length,mounts);checkSemantics(h);
 const restored=await startStudio({storage:h.storage});assert.equal(restored.state('GOOG').claims.noncontrollingClaim,9123);checkSemantics(restored);
 assert.ok(cells(named(restored,'Enterprise to common equity')).some(r=>r[1].includes('9,123')));
 h.change('#current-company','AAOI');h.step(6);checkSemantics(h);assert.ok(tables(h).every(t=>!t.querySelector('caption').textContent.includes('GOOG')));
});

test('workspace tables: captions are escaped and every helper call supplies an explicit purpose',()=>{
 const source=fs.readFileSync(new URL('../dist/guided.js',import.meta.url),'utf8'),definition=source.split('\n').find(line=>line.startsWith('function table('));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const render=new Function('company','esc',definition+';return table;')({ticker:'A<B'},esc),out=render('Value & <risk>',['Name','Value'],[['Example','1']]);
 assert.match(out,/<caption><span class="sr-only">A&lt;B · Value &amp; &lt;risk&gt;<\/span><\/caption>/);assert.doesNotMatch(out,/<risk>|A<B/);
 assert.doesNotMatch(source,/\btable\(\[/);assert.equal((source.match(/\btable\('/g)||[]).length,8);assert.equal((source.match(/\btable\(isFlexible\(\)\?'Flexible annual operating path':'Staged annual operating path'/g)||[]).length,1);
});

test('workspace tables: row-heading visuals are scoped and preserve existing body-cell treatment',()=>{
 const css=fs.readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');
 const rule=css.match(/\.workspace-table tbody th\{([^}]+)\}/)[1];
 for(const declaration of ['font-size:11px','font-weight:400','color:inherit','background:transparent','line-height:1.6','white-space:normal','border-bottom:1px solid var(--line)'])assert.ok(rule.includes(declaration));
 assert.match(css,/\.workspace-table tbody tr:last-child th\{border-bottom:0\}/);
 assert.match(css,/\.claims-panel \.workspace-table tbody th\{font-size:12px\}/);
 assert.match(css,/\.claims-panel td:first-child,\.claims-panel tbody th:first-child\{min-width:130px\}/);
 assert.match(css,/\.claims-panel td:first-child,\.claims-panel tbody th:first-child\{min-width:115px\}/);
 const hidden=css.match(/\.sr-only\{([^}]+)\}/)[1];assert.match(hidden,/position:absolute/);assert.match(hidden,/clip:rect\(0,0,0,0\)/);assert.doesNotMatch(hidden,/display:none|visibility:hidden/);
});
