import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reverseMethodologyDocumentation} from './simulation-methodology-preservation.mjs';
const cwd=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const fixture=JSON.parse(read('tests/fixtures/simulation-methodology-v58.json'));
const page='dist/data/simulation-methodology.html',html=read(page),previous=execFileSync('git',['show',fixture.baseline+':'+page],{cwd,encoding:'utf8'});
const active=html.split('<!-- current-methodology-start -->')[1].split('<!-- current-methodology-end -->')[0];
const legacy=html.split('<!-- legacy-methodology-start -->')[1].split('<!-- legacy-methodology-end -->')[0];
const text=s=>s.replace(/<[^>]*>/g,'');
const sha=s=>createHash('sha256').update(s).digest('hex');

test('methodology: current annual behavior precedes and explicitly scopes the dated historical record',()=>{
 assert.ok(html.indexOf('id="current-method"')<html.indexOf('id="legacy-method"'));
 for(const pattern of [/Fresh configurations use annual paths/,/Saved configurations without a method retain legacy scalar sampling/,/saved growth-only annual configurations retain that scope/,/Gaussian AR\(1\)/,/not a description of every current run/])assert.match(text(active),pattern);
 for(const pattern of [/dated historical implementation record/,/not be read as the current annual method/,/today’s legacy-mode behavior/,/company gates/,/17 October 2026/])assert.match(text(legacy),pattern);
 for(const pattern of [/One driver draw defines an entire path/,/Explicit annual overrides are rejected/,/sampled constant nominal WACC/]){assert.doesNotMatch(text(active),pattern);assert.match(text(legacy),pattern);}
});

test('methodology: independent annual primitives, scalar scope and derived outputs are explicit',()=>{
 for(const pattern of [/independent across primitives/,/Persistence connects years within one primitive/,/remaining scalar draws only, never annual innovations/,/Annual model supports independent scalar draws only/,/do not receive duplicate independent shocks/,/scalar margin and WACC draws set terminal endpoints only/,/annual innovations remain Gaussian/,/terminal sales\/capital is derived/,/growth, tax and marginal ROIC are drawn once/])assert.match(text(active),pattern);
});

test('methodology: innovation units, zero-SD endpoint motion and distinct anchor scopes are explicit',()=>{
 for(const pattern of [/not the resulting annual path SD or cumulative-revenue uncertainty/,/SDs use percentage points/,/sales\/capital uses ratio units/,/fixed growth rate does not fix revenue/,/not a claim that future guidance is certain/,/clearing user-selected fixed years does not remove them/,/changed terminal endpoint can still move the conditional mean/,/All explicitly fixed years retain their baseline values/,/conflicting user-fixed year requires/])assert.match(text(active),pattern);
});

test('methodology: seven zero-width references are distinguished from fourteen illustrative research defaults',()=>{
 for(const pattern of [/original 14 companies/,/3 percentage-point growth innovation SD, 0.6 persistence and exact forecast years 1–3/,/New operating-metric SDs are zero/,/KLAC, AMAT, LRCX, ASML, FN, CDNS and SNPS/,/no user-selected exact forecast years/,/Persistence is an inactive zero placeholder only while SDs and baseline endpoints remain unchanged/,/do not estimate a confidence range/,/Saved configurations remain preserved/])assert.match(text(active),pattern);
});

test('methodology: selected capital policy, funding and signed-output coverage remain qualified',()=>{
 for(const pattern of [/fixed-schedule, revenue-scaled or committed-floor-plus-growth/,/factors apply after that response/,/Protected fixed funding is not multiplied/,/operating-cash changes are derived separately/,/funding floor can add a top-up/,/Direct signed dollar-investment paths are supported only with fixed-schedule/,/not a complete capacity/,/signed operating enterprise value/,/equity and per-share results require an eligible source-dated allocation/,/Fabrinet’s zero ordinary value/,/no verified current-price comparison/])assert.match(text(active),pattern);
});

test('methodology: explicit Run, completed-outcome replay, exclusions and epistemic limits are clear',()=>{
 for(const pattern of [/Changing assumptions does not start a simulation/,/Choose Run simulation/,/edits make previous results stale/,/replay uses already-computed outcomes/,/excluded without clipping or replacement/,/conditional on accepted outcomes/,/application limits, not universal economic impossibilities/,/Excluded paths are not a default probability/,/not parameters prescribed or endorsed by Damodaran/,/do not calibrate the business story/])assert.match(text(active),pattern);
});

test('methodology: complete historical explanation, styles, scripts and return route stay byte-exact',()=>{
 const original=previous.slice(previous.indexOf('\n<h2>'),previous.indexOf('</body></html>'));
 const retained=legacy.slice(legacy.indexOf('\n<h2>'),legacy.lastIndexOf('</section>'));
 assert.equal(retained,original);
 assert.equal(html.match(/<style>[\s\S]*?<\/style>/)[0],previous.match(/<style>[\s\S]*?<\/style>/)[0]);
 assert.deepEqual(html.match(/<(?:script|link)\b[^>]*>/g),previous.match(/<(?:script|link)\b[^>]*>/g));
 assert.match(html,/<a href="\.\.\/index.html">/);
 assert.equal((html.match(/<body>/g)||[]).length,1);assert.equal((html.match(/<\/body>/g)||[]).length,1);
 assert.equal((html.match(/<section\b/g)||[]).length,(html.match(/<\/section>/g)||[]).length);
 assert.doesNotMatch(active,/<(?:input|button|select|iframe|script)\b|style=/);
 for(const fragment of ['current-method','legacy-method']){assert.match(html,new RegExp('href="#'+fragment+'"'));assert.match(html,new RegExp('id="'+fragment+'"'));}
});

test('methodology: current and historical notices have complete English and Chinese leaf catalogs',()=>{
 const catalogs=Object.fromEntries(['en','zh-Hant','zh-Hans'].map(l=>[l,JSON.parse(read('dist/locales/research-pages.'+l+'.json'))]));
 const source=JSON.parse(read('scripts/research-translations/simulation-methodology.en.json'));
 const keys=[...html.matchAll(/data-i18n="research-pages\.([^" ]+)"/g)].map(m=>m[1]);assert.ok(keys.length>120);
 for(const key of keys){for(const locale of Object.keys(catalogs))assert.equal(typeof catalogs[locale][key],'string',locale+':'+key);assert.equal(key,'text.'+sha(catalogs.en[key]).slice(0,20));assert.equal(source[key],catalogs.en[key]);}
 const notice=[...active.matchAll(/data-i18n="research-pages\.([^" ]+)"/g)].map(m=>m[1]);assert.ok(notice.length>=27);
 for(const key of notice){assert.notEqual(catalogs['zh-Hans'][key],catalogs.en[key]);assert.match(catalogs['zh-Hans'][key],/\p{Script=Han}/u);}
 const row=JSON.parse(read('dist/locales/research-pages-coverage.json')).pages.find(r=>r.page==='data/simulation-methodology.html');assert.equal(row.complete,true);assert.deepEqual(row.missingKeys,[]);assert.equal(row.coveredSegments,Object.keys(source).length);
});

test('methodology preservation: every V58 shipped byte survives six exact documentation asset reversals',()=>{
 const paths=execFileSync('git',['ls-tree','-r','--name-only',fixture.baseline,'dist'],{cwd,encoding:'utf8'}).trim().split('\n');assert.equal(paths.length,354);
 assert.deepEqual(Object.keys(fixture.files).sort(),[page,'dist/locales/research-pages-coverage.json','dist/locales/research-pages.en.json','dist/locales/research-pages.zh-Hans.json','dist/locales/research-pages.zh-Hant.json','dist/locales/research-presentation-manifest.json'].sort());
 for(const path of paths)assert.deepEqual(reverseMethodologyDocumentation(path,fs.readFileSync(new URL('../'+path,import.meta.url))),execFileSync('git',['show',fixture.baseline+':'+path],{cwd,maxBuffer:20e6}),path);
});

test('methodology preservation rejects an unreviewed change to a documentation asset',()=>{
 assert.throws(()=>reverseMethodologyDocumentation(page,Buffer.from(html+' ')),/reviewed documentation bytes/);
});
