import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';
import {currentSnapshot,calculateCurrent,freezeCurrent} from '../dist/current-model.js';
import {capitalEfficiencyDiagnostics} from '../dist/capital-efficiency.js';
import {capitalPhaseControlsHTML,capitalPathModeDescription,capitalEfficiencyPanelHTML} from '../dist/capital-efficiency-view.js';
const snapshot=h=>{const d=h.state(),c=h.library.companies.find(c=>c.ticker===d.ticker);return currentSnapshot(c,c.snapshots.find(s=>s.id===d.snapshotId));};
const value=h=>calculateCurrent(snapshot(h),h.state());
const unstamped=d=>{const copy=structuredClone(d);delete copy.updatedAt;return copy;};

test('capital UI is optional and defaults off without modifying current economics',async()=>{
 const h=await startStudio();h.step(4);const before=h.state(),v=value(h);
 assert.equal(h.get('#guided-capital-mode').value,'existing');assert.equal(before.capitalPath,undefined);assert.equal(h.get('#guided-capital-laterSalesCapital'),null);
 assert.match(h.get('#guided-capital-help').textContent,/constant-ratio path/);
 const panel=h.get('#guided-capital-diagnostics');assert.match(panel.querySelector('caption').textContent,/^AAPL · Annual capital efficiency/);assert.match(panel.textContent,/marginal after-tax return proxy/i);assert.match(panel.textContent,/Whole-business ROIC is unavailable/);assert.match(panel.textContent,/No balance is inferred/);assert.match(panel.textContent,/no separate later assumption/);
 h.change('#guided-capital-mode','phased');assert.equal(h.state().capitalPath.enabled,true);assert.equal(h.focus(),h.get('#guided-capital-mode'));assert.equal(h.get('#timing-capitalMaturityYears'),null);assert.equal(h.state().assumptions.salesCapital,before.assumptions.salesCapital);
 assert.equal(h.app.querySelectorAll('[data-capital-prefix="guided"]').length,4);assert.equal(value(h).rows.length,15);h.get('#undo-input').click();assert.deepEqual(h.state(),before);assert.deepEqual(value(h),v);
});

test('early and later inputs update exact modeled efficiency and live diagnostics without losing focus',async()=>{
 const h=await startStudio();h.step(4);h.change('#guided-capital-mode','phased');h.input('#g-salesCapital','2.123456789');
 const input=h.get('#guided-capital-laterSalesCapital');input.focus();const before=h.state();h.input('#guided-capital-laterSalesCapital','4.987654321');
 assert.equal(h.get('#guided-capital-laterSalesCapital'),input);assert.equal(h.focus(),input);assert.equal(input.value,'4.987654321');assert.equal(h.state().capitalPath.laterSalesCapital,4.987654321);assert.equal(h.state().assumptions.salesCapital,2.123456789);
 const v=value(h);assert.equal(v.operatingProfile.annualPath[0].salesCapital,2.123456789);assert.equal(v.operatingProfile.annualPath[5].salesCapital,4.987654321);
 const panel=h.get('#guided-capital-diagnostics');assert.match(panel.innerHTML,/Early sales \/ capital: <b>2.12×<\/b>/);assert.match(panel.innerHTML,/Later sales \/ capital: <b>4.99×<\/b>/);assert.match(panel.textContent,/later phase’s start in year 6/);assert.match(panel.textContent,/over 15 years/);
 h.get('#guided-capital-annual-detail').open=true;h.input('#guided-capital-laterSalesCapital','3.75');assert.equal(h.get('#guided-capital-annual-detail').open,true);assert.equal(h.get('#guided-capital-laterSalesCapital'),input);
 h.get('#undo-input').click();assert.deepEqual(h.state(),before);
});

test('capital timing stays independent through growth edits and disabled mode retains authored settings',async()=>{
 const h=await startStudio();h.step(4);h.change('#guided-capital-mode','phased');h.input('#guided-capital-earlyEndYear','3');h.input('#guided-capital-fadeStartYear','8');h.input('#guided-capital-terminalYear','18');h.input('#guided-capital-laterSalesCapital','5.4321');const authored=structuredClone(h.state().capitalPath);
 h.step(2);h.change('#growth-path-mode','maintain5');h.change('#growth-maturity','20');assert.deepEqual(h.state().capitalPath,authored);h.step(4);assert.equal(value(h).rows.length,20);assert.match(h.get('#forecast-detail').textContent,/Capital intensity in year 20 \(mature since year 18\)/);assert.ok(h.get('#forecast-detail').querySelectorAll('caption').some(c=>c.textContent==='AAPL · Independent capital annual operating path'));assert.match(h.get('#guided-capital-help').textContent,/later ratio begins in year 4/);assert.match(h.get('#guided-capital-help').textContent,/year 18/);
 const active=h.state();h.change('#guided-capital-mode','existing');assert.equal(h.state().capitalPath.enabled,false);assert.equal(h.state().capitalPath.laterSalesCapital,5.4321);assert.match(h.get('#guided-capital-help').textContent,/Existing capital-intensity fade/);assert.ok(h.get('#timing-capitalMaturityYears'));h.get('#undo-input').click();assert.deepEqual(h.state(),active);
 h.change('#guided-capital-mode','existing');h.change('#guided-capital-mode','phased');assert.deepEqual(h.state().capitalPath,authored);
});

test('invalid capital text and ordering withhold value, diagnostics, export and queued simulation; reload and exact Undo work',async()=>{
 for(const [field,text,repair] of [['laterSalesCapital','oops','4.123456789'],['laterSalesCapital','','3'],['earlyEndYear','10','4'],['terminalYear','8','16'],['fadeStartYear','2.5','9']]){
  const h=await startStudio();h.step(4);h.change('#guided-capital-mode','phased');h.flush();const before=h.state(),lastMount=h.mounts.at(-1),selector='#guided-capital-'+field,el=h.get(selector);el.focus();h.input(selector,text);
  assert.equal(h.get(selector),el);assert.equal(h.focus(),el);assert.equal(el.value,text);assert.match(h.get('#guided-results').textContent,/Value withheld/);assert.match(h.get('#guided-capital-diagnostics').textContent,/unavailable until the model inputs are valid/);assert.doesNotMatch(h.get('#guided-capital-diagnostics').textContent,/Implied forecast net investment:/);assert.equal(el.getAttribute('aria-invalid'),'true');assert.ok(lastMount.released);const count=h.mounts.length;h.flush();assert.equal(h.mounts.length,count);
  assert.throws(()=>freezeCurrent(snapshot(h),h.state()),/capital|Capital/);
  const restored=await startStudio({storage:h.storage});assert.equal(restored.get(selector).value,text);restored.input(selector,repair);assert.match(restored.get('#guided-results').textContent,/PROVISIONAL BASE CASE/);assert.equal(restored.state().capitalPath[field],Number(repair));assert.equal(restored.state().capitalPath.inputText,undefined);assert.equal(restored.get(selector).getAttribute('aria-invalid'),'false');
  h.get('#undo-input').click();assert.deepEqual(h.state(),before);
 }
});

test('capital inputs persist per company and research reset plus undo restores the entire phase draft',async()=>{
 const h=await startStudio();h.step(4);h.change('#guided-capital-mode','phased');h.input('#guided-capital-laterSalesCapital','6.123456789');const initial=h.state();
 const reloaded=await startStudio({storage:h.storage});assert.deepEqual(unstamped(reloaded.state()),unstamped(initial));assert.equal(reloaded.get('#guided-capital-laterSalesCapital').value,'6.12');reloaded.get('#guided-capital-laterSalesCapital').onfocus();assert.equal(reloaded.get('#guided-capital-laterSalesCapital').value,'6.123456789');
 h.change('#current-company','MSFT');assert.equal(h.state('MSFT').capitalPath,undefined);h.change('#current-company','AAPL');assert.equal(h.state().capitalPath.laterSalesCapital,6.123456789);const before=h.state();h.get('#load-base-case').click();assert.equal(h.state().capitalPath,undefined);assert.equal(h.get('#guided-capital-mode').value,'existing');h.get('#undo-base-case').click();assert.deepEqual(unstamped(h.state()),unstamped(before));assert.equal(h.get('#guided-capital-laterSalesCapital').value,'6.12');h.get('#guided-capital-laterSalesCapital').onfocus();assert.equal(h.get('#guided-capital-laterSalesCapital').value,'6.123456789');
});

test('diagnostic values use actual annual margins, taxes, investment and ratios, with no fictitious capital denominator',()=>{
 const rows=[{year:1,revenue:110,nopat:-11,reinvestment:5,wacc:.1},{year:2,revenue:121,nopat:24.2,reinvestment:2.75,wacc:.1}];
 const diagnostic=capitalEfficiencyDiagnostics({rows,annualPath:[{salesCapital:2},{salesCapital:4}],anchorRevenue:100,currency:'USD',anchorDate:'2026-06-30'});
 const html=capitalEfficiencyPanelHTML(diagnostic,{ticker:'A<B',currency:'USD',earlySalesCapital:2,capitalPath:{enabled:true,earlyEndYear:1,laterSalesCapital:4},forecastRows:rows});
 assert.match(html,/<caption><span class="sr-only">A&lt;B · Annual capital efficiency/);assert.doesNotMatch(html,/A<B/);assert.match(html,/-20%/);assert.match(html,/80%/);assert.match(html,/7.8m USD/);assert.match(html,/5m USD/);assert.match(html,/2.8m USD/);assert.match(html,/-30 pp/);assert.match(html,/\+70 pp/);assert.match(html,/Whole-business ROIC is unavailable/);assert.doesNotMatch(html,/invested capital:.*(?:50|55)/);
 assert.ok(diagnostic.rows.every(r=>r.impliedROIC===null&&r.beginningInvestedCapital===null));
 const controls=capitalPhaseControlsHTML('guided',{enabled:true,laterSalesCapital:null,earlyEndYear:5,fadeStartYear:10,terminalYear:15,inputText:{laterSalesCapital:'<broken>'}});assert.match(controls,/value="&lt;broken&gt;"/);assert.doesNotMatch(controls,/checkbox/);assert.equal((controls.match(/data-capital-control=/g)||[]).length,4);
 assert.match(capitalPathModeDescription({assumptions:{years:10},operatingProfile:{id:'aaoi-capacity-ramp-v1'}}),/staged capital path/);
});


test('capital display preserves tiny positive and huge finite values without false zero or overflow',()=>{
 const rows=[{year:1,revenue:100,reinvestment:0},{year:2,revenue:100,reinvestment:0},{year:3,revenue:100,reinvestment:0}];
 const diagnostic={status:'proxy-only',rows:[{year:1,salesCapital:1e-8,marginalReturnProxy:1e-8,proxySpread:1e-8},{year:2,salesCapital:1e308,marginalReturnProxy:1e308,proxySpread:1e308},{year:3,salesCapital:2,marginalReturnProxy:0,proxySpread:0}]};
 const html=capitalEfficiencyPanelHTML(diagnostic,{currency:'USD',earlySalesCapital:1e-8,capitalPath:{enabled:true,earlyEndYear:1,laterSalesCapital:1e308},forecastRows:rows});
 assert.match(html,/1e-8×/);assert.match(html,/1e\+308×/);assert.match(html,/1e-6%/);assert.match(html,/1e\+310%/);assert.match(html,/1e\+310 pp/);assert.match(html,/<td>0%<\/td>/);assert.doesNotMatch(html,/Infinity|NaN|0×|—%/);
});
