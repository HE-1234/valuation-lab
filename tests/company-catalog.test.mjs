import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCompanyCatalog,searchCompanies,resolveCompany,fetchCompanyCatalog,filterUSCompanyCatalog,isUSRobinhoodCandidate,COMPANY_SELECTION_POLICY,directoryEntries} from '../dist/company-catalog.js';
import {pendingCompanyHTML} from '../dist/company-catalog-view.js';
import {setLocale} from '../dist/i18n.js';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
// Synthetic test-only issuer. Never written into production data.
const row=()=>({id:'atlas:TEST',ticker:'TEST',company:'Synthetic Test Issuer',nativeTicker:'TEST',exchange:'Nasdaq',mic:'XNAS',securityType:'Ordinary shares',currency:null,aliases:['Test Alias'],verified:true,readiness:'research-pending',checkedAt:'2026-10-18',sourceURLs:['https://example.com/test-only'],evidence:'Synthetic fixture only.',robinhood:{status:'public-buy-sell-support',url:'https://robinhood.com/us/en/stocks/TEST/',checkedAt:'2026-10-18',evidence:'Synthetic test-only public support fixture.'}});
const foreignRow=()=>({...row(),id:'atlas:005930.KS',ticker:'005930.KS',nativeTicker:'005930',exchange:'Korea Exchange',mic:'XKRX',robinhood:undefined});
const bundle=()=>({schemaVersion:1,companies:[row()],coverage:[{company:'Synthetic Unlisted',reason:'No verified listing'}]});
test('catalog preserves leading zeroes and explicit aliases; no ambiguous resolution',()=>{
 const b=validateCompanyCatalog({...bundle(),companies:[foreignRow()]});assert.equal(b.companies[0].nativeTicker,'005930');
 assert.equal(searchCompanies(b.companies,'005930').length,1);assert.equal(resolveCompany(b.companies,' test alias ').id,foreignRow().id);
 assert.equal(resolveCompany([...b.companies,{...row(),id:'other'}],'Test Alias'),null);
});
test('catalog rejects unverified/security-incomplete/financial payloads and numeric ticker coercion',()=>{
 for(const patch of [{verified:false},{sourceURLs:[]},{exchange:''},{nativeTicker:5930},{nativeTicker:'5930'},{ticker:5930},{annual:[]},{readiness:'ready'},{sourceURLs:['javascript:alert(1)']}])assert.throws(()=>validateCompanyCatalog({...bundle(),companies:[{...foreignRow(),...patch}]}));
});
test('pending markup is bilingual and has no financial controls, values or simulation root',()=>{
 for(const locale of ['en','zh-Hans']){setLocale(locale);const html=pendingCompanyHTML(row());assert.match(html,/research-pending/);assert.doesNotMatch(html,/research-big-value|research-simulation-root|data-research-input|<svg/);assert.match(html,locale==='en'?/Research pending/:/研究待完成/);}
 setLocale('en');
});
test('ready → pending → ready clears prior values, releases simulation and preserves original saved case',async()=>{
 let releases=0;const h=await startResearchWorkspace({catalogBundle:bundle(),simulationMount:()=>()=>releases++});
 const before=structuredClone(h.getState().draft);const original=h.saved('AAPL');assert.ok(h.get('#research-results'));
 h.choose(row().id);assert.equal(h.getState().draft,null);assert.equal(h.getState().company,null);assert.equal(h.getState().readiness,'research-pending');assert.ok(releases>0);
 assert.equal(h.get('#research-results'),null);assert.equal(h.get('#research-simulation-root'),null);assert.equal(h.get('#research-editor'),null);assert.deepEqual(h.saved('AAPL'),original);
 setLocale('zh-Hans');assert.match(h.root.textContent,/研究待完成/);setLocale('en');
 h.choose('AAPL');assert.equal(h.getState().readiness,'ready');assert.deepEqual(h.getState().draft.annual,before.annual);assert.ok(h.get('#research-results'));h.destroy();
});
test('invalid directory fails independently; original fourteen remain selectable',async()=>{
 const h=await startResearchWorkspace({catalogBundle:{schemaVersion:99}});assert.equal(h.get('#research-company').children.length,14);h.choose('TSM');assert.equal(h.getState().company.ticker,'TSM');assert.ok(h.get('#research-results'));assert.match(h.root.textContent,/expanded directory could not be loaded/);h.destroy();
});
test('fetch rejects unavailable and malformed catalog independently',async()=>{
 await assert.rejects(fetchCompanyCatalog(async()=>({ok:false})));await assert.rejects(fetchCompanyCatalog(async()=>({ok:true,json:async()=>({})})));
});
test('search uses names and aliases while coverage entities never become selectable securities',async()=>{
 const h=await startResearchWorkspace({catalogBundle:bundle()});h.input('#catalog-search','Test Alias');assert.equal(h.get('#research-company').children.length,1);h.input('#catalog-search','Synthetic Unlisted');assert.equal(h.get('#research-company').children.length,0);assert.match(h.get('#catalog-search-status').textContent,/No matching US-listed/);h.destroy();
});

test('slow optional directory request is bounded and aborts without blocking legacy work',async()=>{
 let signal;await assert.rejects(fetchCompanyCatalog(async(_path,options)=>{signal=options.signal;return new Promise(()=>{});},{timeoutMs:5}),/timed out/);assert.equal(signal.aborted,true);
});

test('late callbacks from a released ready-company simulation cannot contaminate pending or next company',async()=>{
 const callbacks=[];const h=await startResearchWorkspace({catalogBundle:bundle(),simulationMount:(_target,options)=>{callbacks.push(options.onConfigChange);return ()=>{};}});
 const stale=callbacks[0];h.choose(row().id);const count=h.writes.length;stale({sentinel:'stale'});assert.equal(h.writes.length,count);assert.equal(h.getState().draft,null);
 h.choose('MSFT');const next=structuredClone(h.getState().draft);stale({sentinel:'stale'});assert.deepEqual(h.getState().draft,next);h.destroy();
});
test('locale change preserves searchable ready-company selector and selection',async()=>{
 const h=await startResearchWorkspace({catalogBundle:bundle()});h.choose('MSFT');setLocale('zh-Hans');assert.ok(h.get('#research-company'));assert.equal(h.getState().company.ticker,'MSFT');h.input('#catalog-search','Microsoft');assert.equal(h.get('#research-company').children.length,1);setLocale('en');h.destroy();
});

test('production artifact contains sourced identities only, no synthetic fixtures or fabricated research readiness',async()=>{
 const {readFile}=await import('node:fs/promises');
 const artifact=JSON.parse(await readFile(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url),'utf8'));
 validateCompanyCatalog(artifact);assert.ok(artifact.companies.length>=43);assert.equal(artifact.companies.filter(row=>row.ticker==='SPCX').length,1);
 assert.ok(artifact.companies.find(row=>row.ticker==='SPCX').aliases.some(alias=>alias.includes('Cursor')));
 assert.equal(artifact.selectionPolicy,COMPANY_SELECTION_POLICY);assert.deepEqual(artifact.coverage,[]);assert.ok(artifact.companies.every(isUSRobinhoodCandidate));
 assert.doesNotMatch(JSON.stringify(artifact),/Synthetic Test|example\.com\/test-only/);
 assert.ok(artifact.companies.every(row=>row.readiness==='research-pending'));
});

test('every production authored identity note and coverage reason has an exact Simplified Chinese overlay',async()=>{
 const {readFile}=await import('node:fs/promises');
 const artifact=JSON.parse(await readFile(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url),'utf8'));
 const {catalogProsePairs}=await import('../dist/locales/company-catalog.js');
 const overlay=new Map(catalogProsePairs);
 const authored=[...artifact.companies.flatMap(row=>[row.evidence,row.note,row.exchange,row.securityType]),...artifact.coverage.map(row=>row.reason)];
 for(const original of authored){assert.ok(overlay.has(original),original);assert.match(overlay.get(original),/[\u3400-\u9fff]/);assert.notEqual(overlay.get(original),original);}
 assert.equal(artifact.companies.length,47);assert.equal(artifact.coverage.length,0);
 const h=await startResearchWorkspace({catalogBundle:artifact});
 // The shared minimal DOM does not implement comma-separated selectors or
 // hasAttribute; enable the standard DOM operations used by locale binding.
 const proto=Object.getPrototypeOf(h.root),query=proto.querySelectorAll;
 proto.querySelectorAll=function(selector){return [...new Set(selector.split(',').flatMap(part=>query.call(this,part.trim())))];};
 proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};
 h.choose('atlas:SPCX');
 setLocale('zh-Hans');assert.match(h.root.textContent,/合并于当日生效/);assert.doesNotMatch(h.root.textContent,/SpaceX IR confirms|Map only as explicit parent|Provider-style ticker notation|Current issuer stock page/);
 assert.doesNotMatch(h.root.textContent,/Wonik|Sumitomo|catalog-coverage/);
 setLocale('en');assert.match(h.root.textContent,/SpaceX IR confirms/);h.destroy();
});

test('US scope fails closed for foreign venues, OTC and missing broker evidence, independently of nationality or currency',()=>{
 const us=row();assert.ok(isUSRobinhoodCandidate(us));
 for(const patch of [{mic:'XKRX'},{exchange:'OTC Markets'},{mic:null},{nativeTicker:'OTHER'},{securityType:'Bond'},{securityType:'Common stock warrants'},{securityType:'Preferred depositary shares'},{verified:false},{robinhood:undefined},{robinhood:{...us.robinhood,status:'unverified'}},{robinhood:{...us.robinhood,url:'https://example.com'}}])assert.equal(isUSRobinhoodCandidate({...us,...patch}),false);
 assert.ok(isUSRobinhoodCandidate({...us,currency:'EUR',securityType:'American depositary shares',company:'Non-US issuer'}));
 const input={...bundle(),companies:[us,foreignRow()]},before=structuredClone(input),filtered=filterUSCompanyCatalog(input);
 assert.deepEqual(input,before);assert.deepEqual(filtered.companies,[us]);assert.deepEqual(filtered.coverage,[]);validateCompanyCatalog(filtered);
 assert.throws(()=>validateCompanyCatalog({...filtered,companies:[foreignRow()]}));
 assert.deepEqual(directoryEntries({companies:[{ticker:'TSM',currency:'TWD'}]},input).map(row=>row.ticker),['TSM','TEST']);
});

test('excluded symbols and coverage names cannot be selected or searched; old saved selection safely returns to reviewed case',async()=>{
 const h=await startResearchWorkspace({catalogBundle:{...bundle(),companies:[row(),foreignRow()]}});
 const original=structuredClone(h.getState().draft);
 for(const query of ['005930','Synthetic Unlisted']){h.input('#catalog-search',query);assert.equal(h.get('#research-company').children.length,0);}
 h.choose('atlas:005930.KS');assert.equal(h.getState().company.ticker,'AAPL');assert.deepEqual(h.getState().draft.annual,original.annual);assert.equal(h.root.querySelector('.catalog-coverage'),null);h.destroy();
});

test('production US support records cite individually read official pages without asserting account eligibility',async()=>{
 const {readFile}=await import('node:fs/promises');
 const artifact=JSON.parse(await readFile(new URL('../dist/data/atlas-company-catalog-v1.json',import.meta.url),'utf8'));
 const evidence=JSON.parse(await readFile(new URL('../scripts/robinhood-us-public-support-2026-10-18.json',import.meta.url),'utf8'));
 assert.equal(new Set(evidence.securities.map(row=>row.ticker)).size,evidence.securities.length);
 for(const row of artifact.companies){const support=evidence.securities.find(item=>item.ticker===row.ticker);assert.ok(support);assert.equal(row.robinhood.url,support.url);assert.equal(row.robinhood.evidence,support.evidence);assert.match(support.evidence,/Trade|buy or sell/);assert.match(support.scope,/not verified/);}
 for(const ticker of ['ASML','BABA','UMC','ASX','ARM','SAP'])assert.ok(artifact.companies.some(row=>row.ticker===ticker));
 assert.equal(artifact.companies.some(row=>row.ticker==='005930.KS'),false);
});
