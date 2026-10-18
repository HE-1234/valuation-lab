import test from 'node:test';
import assert from 'node:assert/strict';
import {startResearchWorkspace} from './research-workspace-harness.mjs';
import {setLocale,getMissingTranslations,clearTranslationDiagnostics} from '../dist/i18n.js';
import {localizeAnnualPresentation} from '../dist/annual-localization.js';
test('Independent audit: all fourteen companies survive twenty locale toggles without model, storage, focus or control changes',async()=>{
const h=await startResearchWorkspace();const proto=Object.getPrototypeOf(h.root),query=proto.querySelectorAll;proto.querySelectorAll=function(s){return [...new Set(s.split(',').flatMap(p=>query.call(this,p.trim())))];};proto.hasAttribute=function(n){return this.getAttribute(n)!==null;};
const tickers=['AAOI','AAPL','AMZN','AVGO','COHR','GOOG','LITE','META','MSFT','MU','NBIS','NVDA','TSLA','TSM'];
for(const ticker of tickers){setLocale('en');h.select(ticker);localizeAnnualPresentation(h.root);h.input('#research-notes','Growth <自訂筆記> Year 7');const input=h.get('[data-year-field="revenue"]');input.focus();const before=JSON.stringify(h.getState()),storage=JSON.stringify([...h.storage]),writes=h.writes.length,render=h.root.innerHTMLWrites,values=h.root.querySelectorAll('input,select,textarea').map(n=>[n,n.value]);clearTranslationDiagnostics();for(let i=0;i<20;i++){setLocale(i%2?'en':'zh-Hant');assert.equal(JSON.stringify(h.getState()),before,ticker+' state');assert.equal(JSON.stringify([...h.storage]),storage,ticker+' storage');assert.equal(h.writes.length,writes);assert.equal(h.root.innerHTMLWrites,render);assert.equal(h.focus(),input);for(const [node,value]of values)assert.equal(node.value,value,ticker+' control');}assert.deepEqual(getMissingTranslations(),[],ticker+' diagnostics');}h.destroy();
});
