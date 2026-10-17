// Independent minimal-DOM runtime QA of the actual shipped annual workspace.
// No browser, external network, layout, or financial-forecast assurance is implied.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {startResearchWorkspace,bundledResearch,minimalDocument} from './research-workspace-harness.mjs';
import {RESEARCH_STORAGE_PREFIX,researchDraftFor,calculateResearchOperating,researchTimingResult} from '../dist/research-model.js';
import {researchBridgeDefinition,calculateResearchBridge} from '../dist/research-claims.js';

const key=ticker=>RESEARCH_STORAGE_PREFIX+ticker;
const read=file=>fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
const withoutSaveTime=draft=>{const copy=structuredClone(draft);if(copy&&typeof copy==='object')delete copy.updatedAt;return copy;};
const company=ticker=>bundledResearch().companies.find(c=>c.ticker===ticker);
const displayedEV=h=>h.get('.research-big-value')?.textContent;

test('renewed workspace: fresh default and all fourteen companies use complete reviewed annual paths',async()=>{
 const h=await startResearchWorkspace();
 assert.equal(h.getState().company.ticker,'AAPL');assert.equal(h.getState().identityError,null);
 assert.equal(h.get('#research-company').children.length,14);
 assert.equal(h.root.querySelectorAll('[data-research-company]').length,14);
 for(const c of h.library.companies){
  h.get(`[data-research-company="${c.ticker}"]`).click();
  const {draft:d,identityError}=h.getState();
  assert.equal(identityError,null,c.ticker);assert.equal(d.userEdited,false,c.ticker);
  assert.equal(d.forecastHorizonYears,c.forecastHorizonYears,c.ticker);assert.equal(d.annual.length,c.annual.length,c.ticker);
  assert.deepEqual(d.annual,c.annual.map(r=>({year:r.year,period:r.period,revenue:r.revenue,margin:r.operatingMargin,taxRate:r.taxRate,reinvestment:r.reinvestment,wacc:r.wacc})),c.ticker);
  assert.deepEqual(d.terminal,{growth:c.terminal.growth,margin:c.terminal.operatingMargin,taxRate:c.terminal.taxRate,roic:c.terminal.ROIC,wacc:c.terminal.wacc},c.ticker);
  assert.equal(h.root.querySelectorAll('[data-research-input="annual"]').length,c.annual.length*5,c.ticker);
  assert.ok(h.get('.research-value'),c.ticker+' operating value missing');assert.ok(Number.isFinite(calculateResearchOperating(d).enterprise),c.ticker);
  assert.match(h.get('#research-results').textContent,/Forecast-origin operating value/);
  assert.match(h.get('#research-results').textContent,new RegExp(c.valuationTiming.discountOrigin));
  if(c.anchor.fiscalCalendarCaution)assert.ok(h.get('#research-editor').textContent.includes(c.anchor.fiscalCalendarCaution),c.ticker+' fiscal caution missing');
  assert.ok(h.get('#research-editor').textContent.includes(c.anchor.classification),c.ticker+' anchor classification missing');
 }
 assert.deepEqual(h.requests,['./data/renewed-research-2026-10-17/cases.json']);
});

test('renewed workspace: repeated live number and text edits preserve focused controls and editor DOM',async()=>{
 const h=await startResearchWorkspace(),selector=h.field('annual','revenue',0),input=h.get(selector),editor=h.get('#research-editor'),rootWrites=h.root.innerHTMLWrites;
 const originalEV=displayedEV(h),laterRevenue=h.getState().draft.annual[1].revenue;
 input.focus();
 for(const value of ['550000','560000','570000']){
  h.input(selector,value);assert.strictEqual(h.get(selector),input);assert.strictEqual(h.focus(),input);assert.ok(input.isConnected);assert.strictEqual(h.get('#research-editor'),editor);assert.equal(h.root.innerHTMLWrites,rootWrites);
 }
 assert.equal(h.getState().draft.annual[0].revenue,570000);assert.equal(h.getState().draft.annual[1].revenue,laterRevenue,'revenue edit must not move subsequent levels');
 assert.notEqual(displayedEV(h),originalEV);assert.equal(h.saved().annual[0].revenue,570000);
 const notes=h.get('#research-notes');notes.focus();h.input('#research-notes','My evidence <stays> mine & local.');
 assert.strictEqual(h.get('#research-notes'),notes);assert.strictEqual(h.focus(),notes);assert.equal(h.saved().notes,'My evidence <stays> mine & local.');
});

test('renewed workspace: blank and invalid operating inputs withhold stale output without substituting zero',async()=>{
 const h=await startResearchWorkspace(),revenue=h.field('annual','revenue',0),original=h.getState().draft.annual[0].revenue;
 assert.ok(h.get('.research-equity-value'));
 h.input(revenue,'');assert.equal(h.getState().draft.annual[0].revenue,null);assert.equal(h.saved().annual[0].revenue,null);
 assert.equal(h.get('.research-big-value'),null);assert.equal(h.get('.research-equity-value'),null);assert.equal(h.get('[data-research-action="normalize"]'),null);
 assert.match(h.get('#research-results').textContent,/Results are withheld/);assert.match(h.get('#research-results').textContent,/missing amounts are not zero/);
 h.input(revenue,original);assert.ok(h.get('.research-big-value'));
 h.input(h.field('terminal','wacc'),'1');assert.equal(h.get('.research-big-value'),null);assert.match(h.get('#research-results').textContent,/WACC > growth/);
 h.input(h.field('terminal','wacc'),'10');assert.ok(h.get('.research-big-value'));
});

test('renewed workspace: edits, timing, claims and notes survive company switches and reload',async()=>{
 const h=await startResearchWorkspace();h.input(h.field('annual','revenue',0),'599999');h.input(h.field('terminal','margin'),'33');h.input(h.field('bridge','additionalClaimAllowance'),'4321');h.input('#research-notes','Persist my thesis');h.change('#research-timing-mode','as-of-scenario');h.input(h.field('timing','stubFCFF'),'100');h.input('#research-stub-reason','Explicit partial-year estimate');
 const before=withoutSaveTime(h.getState().draft);h.select('GOOG');h.change('[data-research-claim-select="preferredMethod"]','liquidation-proxy');h.input('#research-notes','GOOG-specific');h.select('AAPL');
 assert.deepEqual(withoutSaveTime(h.getState().draft),before);assert.equal(h.get('#research-notes').value,'Persist my thesis');
 const again=await startResearchWorkspace({storage:h.storage});assert.equal(again.getState().company.ticker,'AAPL');assert.deepEqual(withoutSaveTime(again.getState().draft),before);
 again.select('GOOG');assert.equal(again.getState().draft.bridgeInputs.preferredMethod,'liquidation-proxy');assert.equal(again.get('#research-notes').value,'GOOG-specific');
});

test('renewed workspace: malformed and incompatible saved drafts stay byte-for-byte intact on mount, export and switching',async()=>{
 const broken=researchDraftFor(company('AAPL'));broken.annual[0].revenue=null;
 const incompatible={...researchDraftFor(company('AAPL')),caseId:'some-other-case',notes:'Keep this'};
 for(const raw of ['{not valid JSON',JSON.stringify(incompatible),JSON.stringify(broken),'42','[1,2,3]','null']){
  const storage=new Map([[key('AAPL'),raw]]),h=await startResearchWorkspace({storage});
  assert.ok(h.getState().identityError,raw);assert.equal(storage.get(key('AAPL')),raw);assert.equal(h.get('.research-big-value'),null);assert.equal(h.root.querySelectorAll('[data-research-input]').length,0);
  h.action('export');assert.equal(h.downloads.length,1);assert.ok(h.downloads[0].value.retainedDraft!==undefined);assert.equal(storage.get(key('AAPL')),raw);
  h.select('MSFT');h.select('AAPL');assert.equal(storage.get(key('AAPL')),raw);assert.ok(h.getState().identityError);
 }
});

test('renewed workspace: an invalid saved draft cannot be overwritten through its notes control',async()=>{
 const raw='{invalid saved JSON',storage=new Map([[key('AAPL'),raw]]),h=await startResearchWorkspace({storage});
 const notes=h.get('#research-notes');
 if(notes&&!notes.disabled)h.input('#research-notes','A recovery note');
 assert.equal(storage.get(key('AAPL')),raw,'only an explicit load may replace the retained malformed saved data');
});

test('renewed workspace: explicit Load and Undo restore the full prior draft, including unknown metadata',async()=>{
 const initial=researchDraftFor(company('AAPL'));initial.annual[0].revenue=555555;initial.terminal.margin=.345;initial.timing={mode:'as-of-scenario',asOf:'2026-10-17',stubFCFF:123,stubDiscountRate:.11,reason:'My elapsed FCFF assumption'};initial.notes='Reasoning to preserve';initial.bridgeInputs={additionalClaimAllowance:9876};initial.userEdited=true;initial.customEvidence={links:['https://example.com/my-own-note'],nested:{reviewed:false}};
 const h=await startResearchWorkspace({storage:new Map([[key('AAPL'),JSON.stringify(initial)]])}),prior=h.getState().draft;
 h.action('load');const loaded=h.getState().draft;
 assert.deepEqual(loaded.annual,researchDraftFor(company('AAPL')).annual);assert.equal(loaded.notes,initial.notes);assert.deepEqual(loaded.bridgeInputs,initial.bridgeInputs);assert.equal(loaded.timing.mode,'origin');assert.equal(loaded.userEdited,false);assert.equal(h.get('[data-research-action="undo"]').disabled,false);
 h.select('MSFT');h.select('AAPL');h.action('undo');assert.deepEqual(h.getState().draft,prior);assert.deepEqual(h.saved(),prior);assert.equal(h.get('[data-research-action="undo"]').disabled,true);
});

test('renewed workspace: Load then Undo restores malformed saved bytes rather than replacing them with a wrapper',async()=>{
 const raw='{not JSON but valuable recovery material',storage=new Map([[key('AAPL'),raw]]),h=await startResearchWorkspace({storage});
 h.action('load');assert.equal(h.getState().identityError,null);assert.ok(h.get('.research-big-value'));h.action('undo');
 assert.ok(h.getState().identityError);assert.equal(h.get('.research-big-value'),null);assert.equal(storage.get(key('AAPL')),raw);
});

test('renewed workspace: normalized sensitivity is a distinct, reversible annual investment path',async()=>{
 const h=await startResearchWorkspace();h.select('MU');h.input('#research-notes','Review the cycle');
 const original=h.getState().draft,originalEV=calculateResearchOperating(original).enterprise;
 h.action('normalize');const normalized=h.getState().draft,n=normalized.annual.length;
 assert.equal(normalized.capitalPolicy,'terminal-normalization-3y-v1');assert.equal(normalized.userEdited,true);assert.equal(normalized.notes,original.notes);
 for(let i=0;i<n;i++){
  for(const field of ['revenue','margin','taxRate','wacc'])assert.equal(normalized.annual[i][field],original.annual[i][field]);
  if(i<n-3)assert.deepEqual(normalized.annual[i],original.annual[i]);
 }
 assert.notDeepEqual(normalized.annual.slice(-3),original.annual.slice(-3));assert.notEqual(calculateResearchOperating(normalized).enterprise,originalEV);
 assert.deepEqual(normalized.terminal,original.terminal);assert.deepEqual(normalized.anchor,original.anchor);
 h.action('export');assert.equal(h.downloads[0].value.draft.capitalPolicy,'terminal-normalization-3y-v1');assert.deepEqual(h.downloads[0].value.originalResearchCase.annual,company('MU').annual);
 h.action('undo');assert.deepEqual(h.getState().draft,original);
});

test('renewed workspace: blocked local storage retains editable per-company state for this session and warns honestly',async()=>{
 const storage=new Map(),h=await startResearchWorkspace({storage,storageBlocked:true});
 assert.match(h.get('#research-save-state').textContent,/Storage unavailable.*export before leaving/);
 h.input(h.field('annual','revenue',0),'567890');h.input('#research-notes','Session-only');h.select('MU');h.input(h.field('annual','reinvestment',0),'12345');h.select('AAPL');
 assert.equal(h.getState().draft.annual[0].revenue,567890);assert.equal(h.getState().draft.notes,'Session-only');assert.equal(storage.size,0);
 h.action('export');assert.equal(h.downloads[0].value.draft.annual[0].revenue,567890);assert.match(h.get('#research-save-state').textContent,/Storage unavailable/);
});

test('renewed workspace: every company renders its actual equity option controls and required blanks remain unknown',async()=>{
 const h=await startResearchWorkspace();
 for(const c of h.library.companies){
  h.select(c.ticker);const definition=researchBridgeDefinition(c.ticker);
  for(const option of definition.optionDefinitions){
   const selector=option.type==='select'?`[data-research-claim-select="${option.key}"]`:h.field('bridge',option.key),control=h.get(selector);
   const expected=option.default===null?'':option.type==='select'?option.default:String(Number((option.default*(option.max===1?100:1)).toPrecision(12)));
   assert.ok(control,c.ticker+' '+option.key);assert.equal(control.value,expected,c.ticker+' '+option.key);
  }
  assert.ok(h.get('.research-big-value'),c.ticker);
 }
 h.select('LITE');assert.equal(h.get(h.field('bridge','convertiblePremiumClaim')).value,'');assert.equal(h.get('.research-equity-value'),null);assert.match(h.get('#research-results').textContent,/explicit value.*premium/i);
 h.input(h.field('bridge','convertiblePremiumClaim'),'0');assert.equal(h.getState().draft.bridgeInputs.convertiblePremiumClaim,0);assert.ok(h.get('.research-equity-value'));assert.match(h.get('#research-results').textContent,/principal-only/);
 h.input(h.field('bridge','convertiblePremiumClaim'),'');assert.equal(h.getState().draft.bridgeInputs.convertiblePremiumClaim,null);assert.equal(h.get('.research-equity-value'),null);assert.ok(h.get('.research-big-value'));
});

test('renewed workspace: equity-claim errors clear stale equity but never hide valid operating EV',async()=>{
 const h=await startResearchWorkspace(),operating=displayedEV(h),input=h.field('bridge','operatingCashReserve');
 assert.ok(h.get('.research-equity-value'));h.input(input,'999999999');
 assert.equal(displayedEV(h),operating);assert.equal(h.get('.research-equity-value'),null);assert.match(h.get('#research-results').textContent,/Operating cash reserve exceeds dated source cash/);assert.match(h.get('#research-results').textContent,/operating calculation remains valid/);
 h.input(input,'0');assert.ok(h.get('.research-equity-value'));h.select('GOOG');const before=displayedEV(h);h.change('[data-research-claim-select="preferredMethod"]','not-a-method');
 assert.equal(displayedEV(h),before);assert.equal(h.get('.research-equity-value'),null);assert.match(h.get('#research-results').textContent,/unsupported selection/);
});

test('renewed workspace: valid export includes the displayed operating scenario, original case and conditional capital bridge',async()=>{
 const h=await startResearchWorkspace();h.input(h.field('annual','revenue',0),'555555');h.input(h.field('bridge','additionalClaimAllowance'),'1234');h.input('#research-notes','Export this complete scenario');
 const d=h.getState().draft,expected=calculateResearchOperating(d);h.action('export');
 const {name,value:output}=h.downloads[0];assert.match(name,/^AAPL-annual-research-.*\.json$/);assert.equal(output.operating.enterprise,expected.enterprise);assert.deepEqual(output.draft,d);assert.deepEqual(output.originalResearchCase,company('AAPL'));assert.equal(output.timing.status,'origin');assert.equal(output.equityBridge.rawPerShare,calculateResearchBridge(d,expected.enterprise,d.bridgeInputs).rawPerShare);
});

test('renewed workspace: export retains valid operating results when only timing or equity allocation is incomplete',async()=>{
 for(const mode of ['timing','claims']){
  const h=await startResearchWorkspace(),origin=calculateResearchOperating(h.getState().draft).enterprise;
  if(mode==='timing')h.change('#research-timing-mode','as-of-scenario');else h.input(h.field('bridge','operatingCashReserve'),'999999999');
  assert.ok(h.get('.research-big-value'));h.action('export');const output=h.downloads[0].value;
  assert.equal(output.operating?.enterprise,origin,mode+' failure must not discard valid operating valuation');assert.deepEqual(output.draft,h.getState().draft);assert.deepEqual(output.originalResearchCase,company('AAPL'));assert.ok(!Number.isFinite(output.equityBridge?.rawPerShare));
  if(mode==='timing')assert.equal(output.timing.status,'incomplete');
  assert.doesNotMatch(output.error||'',/Invalid edited inputs; no valuation exported/);
 }
});

test('renewed workspace: incomplete as-of timing preserves honest origin value and withholds equity',async()=>{
 const h=await startResearchWorkspace();
 for(const ticker of ['AAPL','AAOI','NBIS']){
  h.select(ticker);const original=displayedEV(h),origin=h.getState().draft.discountOrigin;
  h.change('#research-timing-mode','as-of-scenario');assert.equal(h.getState().draft.timing.stubFCFF,null);assert.equal(displayedEV(h),original);assert.equal(h.get('.research-equity-value'),null);
  assert.match(h.get('#research-results').textContent,/Forecast-origin operating value/);assert.match(h.get('#research-results').textContent,/Origin value remains visible/);assert.match(h.get('#research-results').textContent,/As-of value not computed/);assert.match(h.get('.research-date-line').textContent,new RegExp(origin));
  h.input(h.field('timing','stubFCFF'),'0');assert.match(h.get('#research-results').textContent,/As-of value not computed/);
  h.input('#research-stub-reason','Explicit zero stub for an analytical sensitivity');assert.match(h.get('#research-results').textContent,/As-of operating scenario/);assert.match(h.get('.research-date-line').textContent,/Scenario date 2026-10-17/);
  assert.equal(researchTimingResult(h.getState().draft).status,'scenario');
  if(ticker!=='AAPL')assert.equal(h.get('.research-equity-value'),null,'forecast-origin funding gaps must remain blocked');
 }
});

test('renewed workspace: runtime actions never read or overwrite legacy Studio and workbench storage namespaces',async()=>{
 const legacy=new Map([['valuation-lab-guided-selection','{"ticker":"GOOG","id":"saved-source"}'],['valuation-lab-guided-v5:AAPL:legacy-source','{"notes":"Do not modify","growth":0.99}'],['valuation-lab-cases','[{"thesis":"Historical frozen case"}]'],['valuation-lab-theme','plum']]);
 const storage=new Map(legacy),h=await startResearchWorkspace({storage});
 h.input(h.field('annual','revenue',0),'600000');h.input('#research-notes','Annual only');h.action('load');h.action('undo');h.action('normalize');h.action('export');h.select('GOOG');h.select('AAPL');
 for(const [name,value]of legacy)assert.equal(storage.get(name),value,name);
 assert.ok(h.reads.every(name=>name.startsWith(RESEARCH_STORAGE_PREFIX)));assert.ok(h.writes.every(({key:name})=>name.startsWith(RESEARCH_STORAGE_PREFIX)));
});

test('renewed workspace: index initially shows only Renewed cases with coherent navigation and the legacy Studio retained',()=>{
 const document=minimalDocument();document.root.innerHTML=read('index.html');
 const active=document.querySelectorAll('[data-tab]').filter(el=>el.classList.contains('active'));
 assert.equal(active.length,1);assert.equal(active[0].dataset.tab,'renewed');assert.equal(active[0].getAttribute('aria-current'),'page');
 assert.equal(document.querySelector('#breadcrumb').textContent,'Workspace / Renewed cases');
 const pages=document.querySelectorAll('.page').filter(el=>!el.classList.contains('hidden')&&!el.hidden);assert.equal(pages.length,1);assert.equal(pages[0].id,'renewed');
 assert.ok(document.querySelector('#renewed-research-app'));assert.ok(document.querySelector('#guided-app'));assert.ok(document.querySelector('#current').classList.contains('hidden'));
 assert.equal(document.querySelector('#open-renewed-research').getAttribute('href'),'#renewed');
 const scripts=document.querySelectorAll('script').map(el=>el.getAttribute('src')).filter(Boolean);for(const script of ['app.js','guided.js','research-view.js'])assert.ok(scripts.includes(script));
});

test('renewed workspace: original scalar Studio baseline financial data remain byte-identical',()=>{
 // Captured from committed pre-integration source ea930d2, not from this build's
 // generated research package. Authorized schema-2 growth/UI edits are verified by
 // their own migration/golden tests; these hashes preserve financial evidence.
 const protectedFiles={
  'data/company-base-cases.json':'883e8ed981bc307b7d477aca82e5978d05215234a57c5df9d3c551bac3d642c6',
  'data/current-universe.json':'6f607bb6dd8707e91810bbdf251a8ffb358d1b44fe739ec2418c36fb3b9e8be1',
  'data/current-market-references.json':'cb1ea4dd76a79c15a9379963e95ab5c52376fd499e6c105e1c75c2ff74c19850',
 };
 for(const [file,hash]of Object.entries(protectedFiles))assert.equal(createHash('sha256').update(read(file)).digest('hex'),hash,file);
});

test('renewed workspace: annual simulation receives exact draft, saves per company and cleans up before rerender',async()=>{
 const mounts=[],events=[];
 const simulationMount=(root,options)=>{const entry={root,...options};mounts.push(entry);events.push('mount '+options.companyCase.ticker);return ()=>events.push('cleanup '+options.companyCase.ticker);};
 const h=await startResearchWorkspace({simulationMount});
 assert.equal(mounts.length,1);assert.equal(mounts[0].root.id,'research-simulation-root');assert.equal(mounts[0].draft.caseId,h.getState().draft.caseId);
 const config={version:1,seed:42,samples:1000,policy:'fixed-investment',drivers:{growth:{family:'fixed',value:0}}};
 mounts[0].onConfigChange(config);assert.deepEqual(h.saved().researchSimulationConfig,config);assert.equal(mounts.length,1,'config editing must not recreate the settings panel');
 config.seed=999;assert.equal(h.saved().researchSimulationConfig.seed,42,'stored config is cloned');
 h.input(h.field('annual','revenue',0),'567890');assert.deepEqual(events.slice(-2),['cleanup AAPL','mount AAPL']);assert.equal(mounts.at(-1).draft.annual[0].revenue,567890);
 mounts[0].onConfigChange({seed:666});assert.equal(h.saved().researchSimulationConfig.seed,42,'stale callback cannot overwrite current config');
 h.select('MU');assert.deepEqual(events.slice(-2),['cleanup AAPL','mount MU']);assert.equal(mounts.at(-1).draft.researchSimulationConfig,undefined);
 mounts.at(-1).onConfigChange({version:1,seed:100});h.select('AAPL');assert.equal(mounts.at(-1).draft.researchSimulationConfig.seed,42);
 h.action('load');assert.equal(mounts.at(-1).draft.researchSimulationConfig.seed,42,'research reload retains explicit MC settings');h.action('undo');assert.equal(mounts.at(-1).draft.annual[0].revenue,567890);assert.equal(mounts.at(-1).draft.researchSimulationConfig.seed,42);
 h.destroy();assert.equal(events.at(-1),'cleanup AAPL');assert.equal(h.root.innerHTML,'');
});

test('renewed workspace: simulation failure never hides deterministic value or replaces saved configuration',async()=>{
 const config={version:99,seed:'retain-invalid'},draft=researchDraftFor(company('AAPL'));draft.researchSimulationConfig=config;
 const storage=new Map([[key('AAPL'),JSON.stringify(draft)]]),h=await startResearchWorkspace({storage,simulationMount:()=>{throw Error('Unsupported saved simulation profile');}});
 assert.ok(h.get('.research-big-value'));assert.match(h.get('#research-simulation-root').textContent,/Unsupported saved simulation profile/);assert.deepEqual(h.saved().researchSimulationConfig,config);
 h.input(h.field('annual','revenue',0),'567890');assert.ok(h.get('.research-big-value'));assert.deepEqual(h.saved().researchSimulationConfig,config);
});

test('renewed navigation: all six destinations remain visible on narrow screens through a wrapping layout',()=>{
 const css=read('research.css');assert.match(css,/@media\(max-width:650px\)\{body>aside nav\{[^}]*flex-wrap:wrap;[^}]*overflow:visible/);assert.match(css,/body>aside nav button\{[^}]*min-height:44px;[^}]*white-space:normal/);
 const doc=minimalDocument();doc.root.innerHTML=read('index.html');assert.equal(doc.querySelectorAll('[data-tab]').length,6);
});

test('renewed workspace: temporarily blank as-of date does not erase valid forecast-origin operating EV',async()=>{
 const h=await startResearchWorkspace(),base=displayedEV(h);h.change('#research-timing-mode','as-of-scenario');h.input('#research-asof','');
 assert.equal(displayedEV(h),base);assert.match(h.get('#research-results').textContent,/As-of value not computed/);assert.equal(h.get('.research-equity-value'),null);
 h.action('export');assert.ok(Number.isFinite(h.downloads[0].value.operating.enterprise));assert.equal(h.downloads[0].value.timing.status,'incomplete');
 h.input('#research-asof','2026-10-17');h.input(h.field('timing','stubFCFF'),'0');h.input('#research-stub-reason','Explicit zero stub sensitivity');assert.match(h.get('#research-results').textContent,/As-of operating scenario/);
});
