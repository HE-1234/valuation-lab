import test from 'node:test';
import assert from 'node:assert/strict';
import {localizeMarkedNodes,registerCatalog,t,setLocale,getLocale,bindText,bindAttribute,onLocaleChange,localizedText,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
registerCatalog('foundationtest',{en:{hello:'Hello {name}',count:'{accepted} of {requested} accepted'},'zh-Hant':{hello:'你好，{name}',count:'{requested} 次中接受 {accepted} 次'}});
test('explicit catalog translates full messages and interpolates once',()=>{
 setLocale('zh-Hant');assert.equal(t('foundationtest.hello',{name:'{accepted}'}),'你好，{accepted}');
 assert.equal(t('foundationtest.count',{accepted:2,requested:5}),'5 次中接受 2 次');
 setLocale('en');assert.equal(t('foundationtest.hello',{name:'User'}),'Hello User');
});
test('rejects mismatched placeholders and extra Chinese keys',()=>{
 assert.throws(()=>registerCatalog('bad',{en:{a:'Hello {x}'},'zh-Hant':{a:'你好 {y}'}}),/parameter mismatch/);
 assert.throws(()=>registerCatalog('bad',{en:{},'zh-Hant':{extra:'額外'}}),/Missing English/);
});
test('locale switch updates bound text without replacing the node or model data',()=>{
 setLocale('en');const node={nodeType:3,data:'',selection:4},draft={seed:42,note:'hello',amount:'1.'};const before=JSON.stringify(draft);
 const dispose=bindText(node,'foundationtest.hello',{name:'A'});assert.equal(node.data,'Hello A');setLocale('zh-Hant');assert.equal(node.data,'你好，A');assert.equal(node.selection,4);assert.equal(JSON.stringify(draft),before);
 dispose();setLocale('en');assert.equal(node.data,'你好，A');
});
test('rejects translating live input values, containers or behavior attributes',()=>{
 assert.throws(()=>bindText({tagName:'INPUT'},'foundationtest.hello'),/input values/);
 assert.throws(()=>bindText({children:[{}]},'foundationtest.hello'),/text-only/);
 assert.throws(()=>bindAttribute({},'value','foundationtest.hello'),/presentation/);
 assert.throws(()=>bindAttribute({},'href','foundationtest.hello'),/presentation/);
});
test('protects implicit option identity and changes only the label',()=>{
 setLocale('en');const attrs={};const option={tagName:'OPTION',value:'Original identity',hasAttribute:key=>key in attrs,setAttribute:(key,value)=>attrs[key]=value};
 const dispose=bindText(option,'foundationtest.hello',{name:'Option'});setLocale('zh-Hant');assert.equal(attrs.value,'Original identity');assert.equal(option.textContent,'你好，Option');dispose();
});
test('locale event is explicit, valid only and removable',()=>{
 setLocale('en');let events=[];const off=onLocaleChange(event=>events.push(event));assert.equal(setLocale('unsupported'),false);assert.equal(setLocale('en'),false);assert.equal(setLocale('zh-Hant'),true);assert.equal(getLocale(),'zh-Hant');assert.deepEqual(events,[{locale:'zh-Hant',previousLocale:'en'}]);off();setLocale('en');assert.equal(events.length,1);
});
test('markup helper escapes translated output and parameters',()=>{
 setLocale('en');const html=localizedText('foundationtest.hello',{name:'<img onerror="bad">&'});assert.ok(html.includes('Hello &lt;img onerror=&quot;bad&quot;&gt;&amp;'));assert.ok(html.includes('data-i18n-params="{&quot;name&quot;:'));assert.ok(!html.includes('<img'));
});
test('missing messages and parameters report diagnostics rather than undefined',()=>{
 clearTranslationDiagnostics();assert.equal(t('absent.key'),'absent.key');assert.equal(t('foundationtest.hello'),'Hello {name}');assert.deepEqual(getMissingTranslations().map(d=>d.kind),['missing-key','missing-parameter']);clearTranslationDiagnostics();
});
test('once-connected detached bindings stop refreshing',()=>{
 setLocale('en');const node={nodeType:3,data:'',isConnected:true};bindText(node,'foundationtest.hello',{name:'A'});node.isConnected=false;setLocale('zh-Hant');assert.equal(node.data,'Hello A');
});
test('explicit marked-node repeated mounts refresh changed params and preserve leaf identity',async()=>{
 const {localizeMarkedNodes}=await import('../dist/i18n.js');
 const attrs={'data-i18n':'foundationtest.hello','data-i18n-params':'{"name":"First"}'};
 const node={tagName:'SPAN',children:[],isConnected:true,getAttribute:key=>attrs[key]??null,hasAttribute:key=>key in attrs};
 const root={querySelectorAll:()=>[node]};setLocale('en');localizeMarkedNodes(root);assert.equal(node.textContent,'Hello First');
 attrs['data-i18n-params']='{"name":"Second"}';localizeMarkedNodes(root);assert.equal(node.textContent,'Hello Second');
 node.textContent='Externally repainted';localizeMarkedNodes(root);assert.equal(node.textContent,'Hello Second');
 node.isConnected=false;setLocale('zh-Hant');node.isConnected=true;localizeMarkedNodes(root);assert.equal(node.textContent,'你好，Second');setLocale('en');assert.equal(node.textContent,'Hello Second');
});
test('saved Traditional Chinese initializes document language without persistence/model writes',async()=>{
 const oldDocument=globalThis.document,oldStorage=globalThis.localStorage;let writes=[];
 globalThis.document={documentElement:{lang:'en'}};
 globalThis.localStorage={getItem:key=>key==='valuation-lab-locale'?'zh-Hant':null,setItem:(...args)=>writes.push(args)};
 try{const isolated=await import('../dist/i18n.js?stored-locale-test');assert.equal(isolated.getLocale(),'zh-Hant');assert.equal(globalThis.document.documentElement.lang,'zh-Hant');assert.equal(isolated.setLocale('zh-Hant'),false);assert.deepEqual(writes,[]);}
 finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;}
});
test('one broken binding or locale listener does not block other components',()=>{
 setLocale('en');clearTranslationDiagnostics();let fail=false,received=0;
 const broken={nodeType:3,data:''},healthy={nodeType:3,data:''};
 const disposeBroken=bindText(broken,'foundationtest.hello',()=>{if(fail)throw Error('Detached component');return {name:'broken'};});
 const disposeHealthy=bindText(healthy,'foundationtest.hello',{name:'healthy'});
 const offBroken=onLocaleChange(()=>{throw Error('Component unavailable');});const offHealthy=onLocaleChange(()=>received++);
 fail=true;assert.doesNotThrow(()=>setLocale('zh-Hant'));assert.equal(healthy.data,'你好，healthy');assert.equal(received,1);assert.ok(getMissingTranslations().some(d=>d.kind==='binding-error'));assert.ok(getMissingTranslations().some(d=>d.kind==='listener-error'));
 disposeBroken();disposeHealthy();offBroken();offHealthy();clearTranslationDiagnostics();
});
test('rapid corner toggles preserve button identity and focused control',async()=>{
 const {mountLocaleControl}=await import('../dist/i18n-bootstrap.js');setLocale('en');
 let button;const attrs={};const doc={body:{append:node=>button=node},getElementById:()=>button,createElement:()=>({dataset:{},setAttribute:(key,value)=>attrs[key]=value}),querySelectorAll:()=>[]};
 const original=mountLocaleControl(doc);original.focused=true;assert.equal(original.textContent,'中文');assert.equal(attrs.lang,'zh-Hant');
 for(let i=0;i<20;i++)original.onclick();assert.equal(button,original);assert.equal(original.focused,true);assert.equal(getLocale(),'en');assert.equal(attrs['aria-label'],'Switch to Traditional Chinese');
 original.onclick();assert.equal(attrs['aria-label'],'切換為英文');assert.equal(original.textContent,'EN');assert.equal(attrs.lang,'en');setLocale('en');
});
test('rebinding text or the same attribute supersedes stale dynamic messages',()=>{
 setLocale('en');const attrs={},node={nodeType:3,data:'',setAttribute:(key,value)=>attrs[key]=value};
 const old=bindText(node,'foundationtest.hello',{name:'old'});bindText(node,'foundationtest.hello',{name:'new'});old.refresh();
 bindAttribute(node,'title','foundationtest.hello',{name:'old'});bindAttribute(node,'title','foundationtest.hello',{name:'new'});setLocale('zh-Hant');assert.equal(node.data,'你好，new');assert.equal(attrs.title,'你好，new');
});
test('attribute-only marked nodes receive and refresh named parameters',()=>{
 setLocale('en');clearTranslationDiagnostics();
 const attrs={'data-i18n-aria-label':'foundationtest.hello','data-i18n-params':'{"name":"Year 4"}'};
 const node={nodeType:1,tagName:'BUTTON',children:[],isConnected:true,hasAttribute:k=>Object.hasOwn(attrs,k),getAttribute:k=>attrs[k]??null,setAttribute:(k,v)=>attrs[k]=v};
 const root={querySelectorAll:()=>[node]};
 const dispose=localizeMarkedNodes(root);assert.equal(attrs['aria-label'],'Hello Year 4');
 setLocale('zh-Hant');assert.equal(attrs['aria-label'],'你好，Year 4');
 attrs['data-i18n-params']='{"name":"Year 5"}';localizeMarkedNodes(root);assert.equal(attrs['aria-label'],'你好，Year 5');
 assert.deepEqual(getMissingTranslations(),[]);dispose();setLocale('en');
});
