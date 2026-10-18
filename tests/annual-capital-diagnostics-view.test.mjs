// Executed DOM/handler checks. These do not assert browser geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {annualCapitalDiagnostics} from '../dist/annual-capital-diagnostics.js';

const proxy=field=>`[data-year-field="${field}"]`;
const diagnostic=(h,field)=>h.get(`[data-annual-capital-diagnostic="${field}"]`);

test('annual capital diagnostics update live on investment, revenue, margin and tax without replacing focused inputs',async()=>{
 const h=await startResearchWorkspace(),input=h.get(proxy('reinvestment')),diagnosticRoot=h.get('#annual-capital-diagnostics'),details=diagnosticRoot.querySelector('details'),rootWrites=h.root.innerHTMLWrites;
 const before=h.getState().draft,originalProxy=diagnostic(h,'proxy').textContent,claim=structuredClone(before.currentCapitalScenario),source=structuredClone(h.getState().company);
 assert.equal(diagnosticRoot.parentNode.getAttribute('aria-labelledby'),'annual-group-capital');
 details.open=true;input.focus();input.onfocus();h.input(proxy('reinvestment'),before.annual[0].reinvestment*2);
 assert.notEqual(diagnostic(h,'proxy').textContent,originalProxy);assert.equal(h.focus(),input);assert.equal(h.get(proxy('reinvestment')),input);assert.equal(h.get('#annual-capital-diagnostics'),diagnosticRoot);assert.equal(details.open,true);assert.equal(h.root.innerHTMLWrites,rootWrites);
 assert.match(diagnostic(h,'basis').textContent,/current annual scenario/);
 h.input(proxy('revenue'),'600000');h.input(proxy('margin'),'25');h.input(proxy('taxRate'),'20');
 const x=annualCapitalDiagnostics(h.getState().draft);assert.equal(diagnostic(h,'ratio').textContent,`${x.effectiveMarginalSalesCapital.toLocaleString('en-US',{maximumFractionDigits:2})}×`);assert.equal(diagnostic(h,'proxy').textContent,`${(x.marginalAfterTaxReturnProxy*100).toLocaleString('en-US',{maximumFractionDigits:2})}%`);
 assert.deepEqual(h.getState().draft.currentCapitalScenario,claim);assert.deepEqual(h.getState().company,source);assert.deepEqual(h.getState().draft.annual.slice(1),before.annual.slice(1));
 assert.equal(diagnosticRoot.querySelectorAll('input').length,0);h.destroy();
});

test('annual capital diagnostics show N/A for unavailable and nonpositive inputs, then recover in place',async()=>{
 const h=await startResearchWorkspace(),before=h.getState().draft,ratio=diagnostic(h,'ratio'),output=diagnostic(h,'proxy');
 for(const value of ['','broken','0','-100']){h.input(proxy('reinvestment'),value);assert.equal(ratio.textContent,'N/A');assert.equal(output.textContent,'N/A');assert.ok(diagnostic(h,'reason').textContent);}
 h.input(proxy('reinvestment'),before.annual[0].reinvestment);h.input(proxy('revenue'),before.anchor.revenue);assert.equal(ratio.textContent,'N/A');assert.match(diagnostic(h,'reason').textContent,/flat or falling/);
 h.input(proxy('revenue'),before.annual[0].revenue);h.input(proxy('margin'),'-5');assert.notEqual(ratio.textContent,'N/A');assert.equal(output.textContent,'N/A');
 h.input(proxy('margin'),'0');assert.equal(output.textContent,'0%');h.input(proxy('margin'),before.annual[0].margin*100);assert.notEqual(output.textContent,'N/A');assert.equal(diagnostic(h,'reason').textContent,'');h.destroy();
});

test('year selection and edits to its preceding year recompute the selected-year diagnostic without writes from navigation',async()=>{
 const h=await startResearchWorkspace(),writes=h.writes.length;
 h.change('#annual-edit-year','1');assert.equal(h.writes.length,writes);assert.match(diagnostic(h,'basis').textContent,/Year 2/);
 const before=diagnostic(h,'ratio').textContent;h.input(h.field('annual','revenue',0),'');assert.equal(diagnostic(h,'ratio').textContent,'N/A');
 h.action('undo-edit');assert.equal(h.get('#annual-edit-year').value,'1');assert.equal(diagnostic(h,'ratio').textContent,before);h.destroy();
});

test('terminal ROIC is separate; diagnostic reading and disclosures do not change investment or undo history',async()=>{
 const h=await startResearchWorkspace(),before=h.getState().draft,ratio=diagnostic(h,'ratio').textContent,returnProxy=diagnostic(h,'proxy').textContent;
 h.get('#annual-capital-diagnostics').querySelector('details').open=true;
 assert.equal(h.get('[data-research-action="undo-edit"]').disabled,true);assert.deepEqual(h.getState().draft,before);
 h.input(h.field('terminal','roic'),'25');assert.equal(diagnostic(h,'ratio').textContent,ratio);assert.equal(diagnostic(h,'proxy').textContent,returnProxy);assert.match(diagnostic(h,'terminal').textContent,/25%.*separate mature-return/);assert.match(diagnostic(h,'actual').textContent,/Actual ROIC: N\/A/);assert.deepEqual(h.getState().draft.annual,before.annual);
 h.action('undo-edit');assert.deepEqual(h.getState().draft,before);assert.equal(diagnostic(h,'proxy').textContent,returnProxy);h.destroy();
});

test('capital evidence stays mounted during live diagnostics and restores the invoker after close',async()=>{
 const h=await startResearchWorkspace(),button=h.get('[data-annual-evidence="capital"]'),source=h.get('#annual-evidence-capital'),input=h.get(proxy('reinvestment'));
 button.click();const content=h.get('.contextual-evidence-content');input.focus();h.input(proxy('reinvestment'),'12345.6789012345');
 assert.equal(source.parentNode,content);assert.equal(h.focus(),input);assert.equal(input.value,'12345.6789012345');assert.match(diagnostic(h,'formula').textContent,/12,345.68/);
 h.get('.contextual-evidence-close').click();assert.equal(h.focus(),button);assert.equal(source.parentNode.className,'annual-evidence-store');h.destroy();
});

test('derived-horizon S:C changes refresh effective diagnostics; company switching and full Undo preserve exact state',async()=>{
 const h=await startResearchWorkspace();h.change('#annual-growth-horizon','20');h.change('#annual-edit-year','6');const before=h.getState().draft;
 h.change('#annual-marginal-sales-capital','2.123456789');const changed=h.getState().draft,x=annualCapitalDiagnostics(changed,6);
 assert.equal(diagnostic(h,'ratio').textContent,`${x.effectiveMarginalSalesCapital.toLocaleString('en-US',{maximumFractionDigits:2})}×`);
 assert.match(diagnostic(h,'basis').textContent,/current annual scenario/);assert.equal(h.focus(),h.get('#annual-marginal-sales-capital'));
 h.select('MU');h.select('AAPL');assert.deepEqual(h.getState().draft.annual,changed.annual);assert.match(diagnostic(h,'basis').textContent,/Year 7/);
 h.action('undo');assert.deepEqual(h.getState().draft,before);h.destroy();
});
