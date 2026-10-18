import test from 'node:test';
import assert from 'node:assert/strict';
import {startResearchWorkspace,bundledResearch} from './research-workspace-harness.mjs';
import {RESEARCH_STORAGE_PREFIX,researchDraftFor,calculateResearchOperating,researchTimingResult,loadAnnualResearchCase,restoreResearchDraft} from '../dist/research-model.js';
import {calculateResearchBridge,researchBridgeSensitivity} from '../dist/research-claims.js';
import {DATED_CAPITAL_VERSION} from '../dist/dated-capital-scenario.js';
import {simulateResearch,RESEARCH_SIMULATION_DRIVER_KEYS} from '../dist/research-simulation.js';

const company=ticker=>bundledResearch().companies.find(c=>c.ticker===ticker);
const field=path=>`[data-research-input="current-capital"][data-field="${path}"]`;
// Deliberately synthetic: these are integration fixtures, never researched facts.
function draft(ticker='AAOI'){
 const d=researchDraftFor(company(ticker));
 d.timing={mode:'as-of-scenario',asOf:'2026-10-17',stubFCFF:0,stubDiscountRate:.1,reason:'Synthetic zero-stub test assumption, not a researched estimate.'};
 d.currentCapitalScenario={version:DATED_CAPITAL_VERSION,ticker,asOf:'2026-10-17',currency:'USD',rationale:'Synthetic integration test only',baseline:{cashDate:'2026-06-30',shareDate:'2026-06-30',cash:200,commonShares:100,claims:[{id:'note',instrumentId:'note',treatment:'debt-fair-value',valuationDate:'2026-10-17',amount:50,rationale:'Synthetic all-in claim'}]},cashAdjustments:[{id:'elapsed',date:'2026-09-30',kind:'operating-cash-change',amount:-10,rationale:'Synthetic elapsed cash use'}],events:[{id:'issue',kind:'equity-issuance',date:'2026-08-01',completed:true,cashIncludedInBaseline:false,sharesIncludedInBaseline:false,sharesAdded:10,issuePrice:5,fees:2,rationale:'Synthetic completed raise'}],operatingCashReserve:5,nonoperatingAssets:[],existingAwardSensitivity:{method:'none',shares:0,claim:0,rationale:'Synthetic no quantified adjustment'}};
 d.currentCapitalProvenance={title:'Synthetic capital test fixture'};return d;
}
function bridge(d){const t=researchTimingResult(d,calculateResearchOperating(d));return calculateResearchBridge(d,t.enterprise,{calculationDate:t.date});}
const storage=d=>new Map([[RESEARCH_STORAGE_PREFIX+d.ticker,JSON.stringify(d)],[RESEARCH_STORAGE_PREFIX+'selection',d.ticker]]);
const fixed={trials:5,seed:'capital-test',drivers:Object.fromEntries(RESEARCH_SIMULATION_DRIVER_KEYS.map(k=>[k,{type:'fixed',value:k==='investmentMultiplier'?1:0}]))};

test('current capital integration: explicit route preserves legacy gates and independently reconciles completed cash/shares',()=>{
 for(const ticker of ['AAOI','NBIS'])assert.equal(calculateResearchBridge(researchDraftFor(company(ticker)),100).eligible,false);
 const d=draft(),before=structuredClone(d),r=bridge(d),t=researchTimingResult(d,calculateResearchOperating(d));
 assert.equal(r.estimatedCash,238);assert.equal(r.allocationShares,110);assert.equal(r.equity,t.enterprise+238-5-50);assert.equal(r.rawPerShare,r.equity/110);assert.deepEqual(d,before);
 assert.deepEqual(researchBridgeSensitivity(d,t.enterprise,{calculationDate:t.date}),[],'old claim variations cannot masquerade as changes to this scenario');
});
test('current capital integration: invalid capital leaves operating EV computable and is retained on restore',()=>{
 for(const value of [null,0,-1,Infinity]){const d=draft();d.currentCapitalScenario.baseline.commonShares=value;assert.ok(Number.isFinite(calculateResearchOperating(d).enterprise));assert.throws(()=>bridge(d));const restored=restoreResearchDraft(d,company('AAOI'));assert.equal(restored.error,null);assert.deepEqual(restored.draft.currentCapitalScenario,d.currentCapitalScenario);}
 const d=draft();d.currentCapitalScenario.ticker='NBIS';assert.throws(()=>bridge(d),/different company/);d.currentCapitalScenario=null;assert.throws(()=>bridge(d));
});
test('current capital integration: share typing retains focus, operating path, exact data and complete edit Undo',async()=>{
 const d=draft(),h=await startResearchWorkspace({storage:storage(d)}),el=h.get(field('baseline.commonShares')),ev=calculateResearchOperating(h.getState().draft).enterprise,original=h.getState().draft;
 el.focus();el.onfocus();for(const v of ['12','123','123.456789'])h.input(field('baseline.commonShares'),v);
 assert.strictEqual(h.get(field('baseline.commonShares')),el);assert.strictEqual(h.focus(),el);assert.equal(h.saved().currentCapitalScenario.baseline.commonShares,123.456789);assert.equal(calculateResearchOperating(h.getState().draft).enterprise,ev);assert.equal(bridge(h.getState().draft).allocationShares,123.456789+10);
 h.action('undo-edit');assert.deepEqual(h.getState().draft,original);
});
test('current capital integration: clearing shares hides common value, leaves EV and permits correction',async()=>{
 const d=draft(),h=await startResearchWorkspace({storage:storage(d)});h.input(field('baseline.commonShares'),'');assert.ok(h.get('.research-big-value'));assert.ok(h.get('.annual-equity-incomplete'));assert.equal(h.saved().currentCapitalScenario.baseline.commonShares,null);
 h.input(field('baseline.commonShares'),'100');assert.ok(h.get('.research-equity-value'));assert.equal(h.get('.annual-equity-incomplete'),null);
});
test('current capital integration: existing-award treatment is exclusive, reversible and does not remount controls',async()=>{
 const h=await startResearchWorkspace({storage:storage(draft())}),el=h.get(field('baseline.commonShares'));
 h.change('[data-capital-award-method]','gross-shares');h.input(field('existingAwardSensitivity.shares'),'7');assert.equal(bridge(h.getState().draft).allocationShares,117);
 h.change('[data-capital-award-method]','claim');assert.deepEqual(h.getState().draft.currentCapitalScenario.existingAwardSensitivity,{method:'claim',shares:0,claim:0,rationale:'Synthetic no quantified adjustment'});assert.strictEqual(h.get(field('baseline.commonShares')),el);
 h.action('undo-edit');assert.equal(h.getState().draft.currentCapitalScenario.existingAwardSensitivity.shares,7);assert.equal(h.getState().draft.currentCapitalScenario.existingAwardSensitivity.method,'gross-shares');
});
test('current capital integration: operating-only reload retains scenario and full Undo/export retain all data',async()=>{
 const d=draft();d.annual[0].revenue+=12;d.notes='Retain my reasoning';const h=await startResearchWorkspace({storage:storage(d)}),original=h.getState().draft;h.action('load');assert.deepEqual(h.getState().draft.currentCapitalScenario,d.currentCapitalScenario);assert.deepEqual(h.getState().draft.currentCapitalProvenance,d.currentCapitalProvenance);assert.equal(h.getState().draft.timing.mode,'origin');assert.ok(h.get('.annual-equity-incomplete'),'origin reset cannot silently reuse current capital');
 h.action('undo');assert.deepEqual(h.getState().draft,original);h.action('export');assert.deepEqual(h.downloads[0].value.draft.currentCapitalScenario,d.currentCapitalScenario);assert.equal(h.downloads[0].value.equityBridge.rawPerShare,bridge(d).rawPerShare);
 const pure=loadAnnualResearchCase(d,company('AAOI'));assert.deepEqual(pure.undo,d);
});
test('current capital integration: fixed MC reproduces explicit bridge, retains negative NBIS residual and invalid coverage',()=>{
 for(const ticker of ['AAOI','NBIS']){const d=draft(ticker),b=bridge(d),r=simulateResearch(d,fixed);assert.equal(r.bridgeCoverage.complete,true);assert.equal(r.perShare.median,b.rawPerShare);if(ticker==='NBIS'){assert.ok(b.rawPerShare<0);assert.ok(r.perShare.median<0);}}
 const d=draft();d.currentCapitalScenario.baseline.commonShares=null;const r=simulateResearch(d,fixed);assert.equal(r.bridgeCoverage.eligible,0);assert.equal(r.bridgeCoverage.complete,false);assert.ok(r.enterprise);
});
test('current capital integration: changed timing fails common bridge without substituting old claims',async()=>{
 const h=await startResearchWorkspace({storage:storage(draft())});h.change('#research-timing-mode','origin');assert.ok(h.get('.annual-equity-incomplete'));assert.ok(h.get('.research-big-value'));assert.equal(h.getState().draft.currentCapitalScenario.baseline.commonShares,100);
});

test('current capital integration: unresolved NBIS dynamically exposes before-debt diagnostic without fair value',async()=>{
 const d=draft('NBIS'),s=d.currentCapitalScenario;s.claimStatus='unresolved';s.pendingClaims='Synthetic unresolved debt valuation';s.baseline.claims=null;s.baseline.cashDate=s.asOf;s.baseline.shareDate=s.asOf;s.events=[];s.cashAdjustments=[];
 const h=await startResearchWorkspace({storage:storage(d)}),r=bridge(d);assert.equal(r.eligible,false);assert.equal(r.rawPerShare,null);assert.ok(r.preclaimResidual<0);assert.match(h.get('.capital-preclaim-diagnostic').textContent,/even before debt/);assert.ok(h.get('.annual-equity-incomplete'));
 h.input(field('baseline.cash'),'100000000');assert.match(h.get('.capital-preclaim-diagnostic').textContent,/Before-debt residual only/);assert.ok(h.get('.annual-equity-incomplete'));assert.equal(bridge(h.getState().draft).rawPerShare,null);
});

test('current capital integration: named researched load changes capital and timing only, supports duplicate action and persistent full Undo',async()=>{
 const d=researchDraftFor(company('AAOI'));d.annual[0].revenue+=123;d.notes='My annual edits';d.bridgeInputs={additionalClaimAllowance:17};
 const h=await startResearchWorkspace({storage:storage(d)}),before=h.getState().draft;assert.equal(h.get(field('baseline.commonShares')),null);h.action('load-current-capital');
 const selected=h.getState().draft;assert.deepEqual(selected.annual,before.annual);assert.deepEqual(selected.terminal,before.terminal);assert.deepEqual(selected.bridgeInputs,before.bridgeInputs);assert.equal(selected.notes,before.notes);assert.equal(selected.currentCapitalScenario.ticker,'AAOI');assert.equal(selected.timing.mode,'as-of-scenario');assert.ok(bridge(selected).eligible);h.action('load-current-capital');
 const reloaded=await startResearchWorkspace({storage:h.storage});reloaded.action('undo');assert.deepEqual(reloaded.getState().draft,before);
});
test('current capital integration: complete researched load seeds defaults without editing saved original or ignoring edited volatility',async()=>{
 const d=researchDraftFor(company('AAOI')),h=await startResearchWorkspace({storage:storage(d)}),before=h.getState().draft;h.action('use-research');
 assert.ok(h.get(field('optionPricing.volatility')));assert.equal(h.get(field('baseline.claims.2.amount')),null,'computed note claim has no ignored editable amount');const initial=bridge(h.getState().draft).rawPerShare;h.input(field('optionPricing.volatility'),'60');assert.notEqual(bridge(h.getState().draft).rawPerShare,initial);assert.match(h.get('#research-preset-state').textContent,/Your changes/);
 h.action('undo');assert.deepEqual(h.getState().draft,before);assert.equal(h.getState().draft.currentCapitalScenario,undefined);
});
test('current capital integration: real NBIS preset exposes diagnostic, preserves unknown claims, and never invents zero common value',async()=>{
 const h=await startResearchWorkspace();h.select('NBIS');const d=h.getState().draft;assert.equal(d.currentCapitalScenario.claimStatus,'unresolved');assert.equal(d.currentCapitalScenario.baseline.claims,null);assert.equal(bridge(d).rawPerShare,null);assert.ok(h.get('.capital-preclaim-diagnostic'));assert.ok(h.get('.annual-equity-incomplete'));assert.equal(h.get('.research-equity-value'),null);
});

test('current capital integration: MC describes repriced AAOI assumptions and withholds unresolved NBIS share option',async()=>{
 const {annualResearchSimulationAdapter}=await import('../dist/research-simulation-view.js');const h=await startResearchWorkspace();h.select('AAOI');const d=h.getState().draft,adapter=annualResearchSimulationAdapter(d),r=simulateResearch(d,fixed);
 assert.match(adapter.fixedNote,/claim values are repriced/);assert.match(adapter.outputMarkup(r),/Conditional option-inclusive common-share value/);assert.match(r.method.bridge,/repriced per trial/);assert.match(r.warnings.join(' '),/capital assumptions stay fixed/);
 h.select('NBIS');const n=h.getState().draft,nr=simulateResearch(n,fixed),na=annualResearchSimulationAdapter(n);assert.doesNotMatch(na.outputMarkup(nr),/option value="perShare"/);assert.match(na.outputMarkup(nr),/not a zero-dollar stock value/);assert.equal(nr.perShare.accepted,0);
});

test('current capital integration: researched Claims starts open, keeps first controls compact and omits empty cash adjustments',async()=>{
 const {researchClaimsEditorHTML}=await import('../dist/research-view.js');const h=await startResearchWorkspace();
 for(const ticker of ['AAOI','NBIS']){h.select(ticker);const d=h.getState().draft,html=researchClaimsEditorHTML(company(ticker),d);assert.match(html,/^<details class="research-card" open>/);assert.doesNotMatch(html,/Cash roll-forward assumptions/);assert.ok(html.indexOf('baseline.commonShares')<html.indexOf(d.currentCapitalScenario.rationale),'full rationale is below initial editable controls');}
});

test('current capital integration: capital edits update live case labels without misclassifying operating rows and Undo restores research label',async()=>{
 const h=await startResearchWorkspace();h.select('AAOI');const before=h.getState().draft,annual=structuredClone(before.annual);assert.equal(h.get('#annual-scenario-state').textContent,'Reviewed annual case');
 h.input(field('optionPricing.volatility'),'60');assert.equal(h.get('#annual-scenario-state').textContent,'Your capital scenario');assert.match(h.get('#research-results').textContent,/YOUR CAPITAL SCENARIO/);assert.equal(h.getState().draft.userEdited,false);assert.deepEqual(h.getState().draft.annual,annual);
 h.action('undo-edit');assert.equal(h.get('#annual-scenario-state').textContent,'Reviewed annual case');assert.doesNotMatch(h.get('#research-results').textContent,/YOUR CAPITAL SCENARIO/);assert.deepEqual(h.getState().draft,before);
});

test('current capital integration: rounded blur and exact focus never round stored cash, shares or rates',async()=>{
 const h=await startResearchWorkspace();h.select('AAOI');const before=h.getState().draft,writes=h.writes.length;
 for(const path of ['baseline.cash','baseline.commonShares','optionPricing.volatility','optionPricing.creditSpread']){
  const el=h.get(field(path)),raw=el.dataset.raw,digits=Number(el.dataset.displayDigits);assert.equal(el.value,Number(raw).toLocaleString('en-US',{maximumFractionDigits:digits}));el.onfocus();assert.equal(el.value,raw);el.onblur();assert.equal(el.dataset.raw,raw);
 }
 assert.deepEqual(h.getState().draft,before);assert.equal(h.writes.length,writes);
 const el=h.get(field('baseline.cash'));el.onfocus();h.input(field('baseline.cash'),'663.123456789123');el.onblur();assert.equal(el.value,'663.12');assert.equal(h.getState().draft.currentCapitalScenario.baseline.cash,663.123456789123);el.onfocus();assert.equal(el.value,'663.123456789123');
 h.change('[data-capital-award-method]','claim');const shares=h.get(field('existingAwardSensitivity.shares'));shares.onfocus();assert.equal(shares.value,'0','inactive award raw cache also resets');
});

test('current capital integration: exact text controls retain the original field-grid sizing rule',async()=>{
 const {readFileSync}=await import('node:fs');const css=readFileSync(new URL('../dist/research.css',import.meta.url),'utf8');assert.match(css,/\.research-field-grid input\[type=number\],\.research-field-grid input\[type=date\],\.research-field-grid input\[data-research-input="current-capital"\]\{display:block;width:100%;min-height:44px;margin-top:7px\}/);
});

test('current capital integration: vertical Annual editor cannot wrap into a second flex column',async()=>{
 const {readFileSync}=await import('node:fs');const css=readFileSync(new URL('../dist/research.css',import.meta.url),'utf8');assert.match(css,/\.annual-workspace #research-editor\{flex-wrap:nowrap\}/);
});
