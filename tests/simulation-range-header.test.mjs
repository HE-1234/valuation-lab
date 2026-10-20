import {reverseLatestUserUi} from './latest-user-ui-preservation.mjs';
// Source and parsed-DOM regression. Static-render bounds and native browser
// bounds are separate evidence; this harness does not implement CSS layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import {preservedV87Fs as fs} from './guided-company-preservation.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {guideFixture} from './simulation-guide-dom-harness.mjs';
import {setLocale} from '../dist/i18n.js';
import {reverseClaudeSimulationUi} from './claude-simulation-ui-preservation.mjs';
import {reverseChartTrialGeometry} from './chart-trial-geometry-preservation.mjs';
import {MCD_ADDED_PATHS,MCD_FIXTURE_PATH,mcdFixture} from './mcd-integration-preservation.mjs';
import {UBER_ADDED_PATHS,UBER_FIXTURE_PATH,uberFixture} from './uber-integration-preservation.mjs';
import {NFLX_ADDED_PATHS,NFLX_FIXTURE_PATH,nflxFixture} from './nflx-integration-preservation.mjs';
import {RANGE_HEADER_BASE,RANGE_HEADER_PATH,RANGE_HEADER_BEFORE,RANGE_HEADER_AFTER,RANGE_HEADER_RULE,rangeHeaderSHA,reverseSimulationRangeHeader} from './simulation-range-header-preservation.mjs';
const root=new URL('..',import.meta.url),read=p=>fs.readFileSync(new URL(p,root));
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const blob=bytes=>createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
function files(p){return fs.readdirSync(new URL(p,root),{withFileTypes:true}).flatMap(e=>{assert.ok(!e.isSymbolicLink());const n=p+'/'+e.name;return e.isDirectory()?files(n):[n];}).sort();}

test('range header: only the three desktop right-column sections stop shrinking; scroll, colors and phone rules remain exact',()=>{
 const bytes=read(RANGE_HEADER_PATH),stable=reverseChartTrialGeometry(RANGE_HEADER_PATH,reverseLatestUserUi(RANGE_HEADER_PATH,bytes)),css=stable.toString(),before=git('show',RANGE_HEADER_BASE+':'+RANGE_HEADER_PATH);
 assert.equal(git('rev-parse',RANGE_HEADER_BASE+'^{commit}').toString().trim(),RANGE_HEADER_BASE);
 assert.equal(blob(before),'aef31178ad787540aa19df6f43a515fb04ea639f');
 assert.equal(rangeHeaderSHA(before),RANGE_HEADER_BEFORE);assert.equal(rangeHeaderSHA(stable),RANGE_HEADER_AFTER);
 assert.deepEqual(reverseSimulationRangeHeader(RANGE_HEADER_PATH,bytes),before);
 assert.equal(css.split(RANGE_HEADER_RULE).length-1,1);
 const start=css.indexOf('/* ---------- simulation: a guide beside each settings tab ---------- */');
 const desktop=css.indexOf('@media (min-width: 761px)',start),rule=css.indexOf(RANGE_HEADER_RULE),end=css.indexOf('  & body .rx-mcg[hidden]',desktop);
 assert.ok(start<desktop&&desktop<rule&&rule<end,'The repair is inside the existing desktop-only scope');
 assert.match(css.slice(desktop,end),/position: sticky; top: 84px; max-height: calc\(100vh - 100px\)/);
 assert.match(css.slice(desktop,end),/overflow: auto; overscroll-behavior: contain; scrollbar-width: thin/);
 assert.equal(css.replace(RANGE_HEADER_RULE,''),before.toString(),'No other CSS, text, colors or mobile behavior changes');
});

test('range header: every production byte reverses to immutable 849-file V84 and all earlier fixtures remain unchanged',()=>{
 const entries=git('ls-tree','-r','-z',RANGE_HEADER_BASE,'--','dist').toString().split('\0').filter(Boolean).map(row=>{const [meta,p]=row.split('\t');return [p,meta.split(' ')[2]];});
 const added=[...MCD_ADDED_PATHS,...UBER_ADDED_PATHS,...NFLX_ADDED_PATHS];
 assert.equal(entries.length,849);assert.equal(added.length,130);assert.deepEqual(files('dist'),[...entries.map(([p])=>p),...added].sort());
 for(const [p,oid]of entries)assert.equal(blob(reverseSimulationRangeHeader(p,read(p))),oid,p);
 for(const f of [mcdFixture(),uberFixture(),nflxFixture()])for(const [p,h]of Object.entries(f.additions))assert.equal(rangeHeaderSHA(reverseSimulationRangeHeader(p,read(p))),h,p+' exact reviewed later company addition');
 const fixtures=git('ls-tree','-r','-z',RANGE_HEADER_BASE,'--','tests/fixtures').toString().split('\0').filter(Boolean).map(row=>{const [meta,p]=row.split('\t');return [p,meta.split(' ')[2]];});
 const addedFixtures=[MCD_FIXTURE_PATH,'tests/fixtures/mcd-prior33-final-ui.json',UBER_FIXTURE_PATH,'tests/fixtures/uber-prior34-mcd-v85.json',NFLX_FIXTURE_PATH,'tests/fixtures/nflx-prior35-mcd-uber-v85.json'];
 assert.deepEqual(files('tests/fixtures'),[...fixtures.map(([p])=>p),...addedFixtures].sort());for(const [p,oid]of fixtures)assert.equal(blob(read(p)),oid,p);
});

test('range header: malformed, omitted and additional CSS edits fail before older UI reversal',()=>{
 const good=read(RANGE_HEADER_PATH),old=git('show',RANGE_HEADER_BASE+':'+RANGE_HEADER_PATH),mutated=Buffer.from(good);mutated[Math.floor(mutated.length/2)]^=1;
 for(const bad of [old,mutated,Buffer.concat([good,Buffer.from('\n')]),Buffer.from(good.toString().replace(RANGE_HEADER_RULE,RANGE_HEADER_RULE.replace('0;','1;')))]){
  assert.throws(()=>reverseSimulationRangeHeader(RANGE_HEADER_PATH,bad),/exact reviewed range header fix bytes/);
  assert.throws(()=>reverseClaudeSimulationUi(RANGE_HEADER_PATH,bad),/exact reviewed range header fix bytes/);
 }
 for(const bad of [null,good.toString(),new Uint8Array(good)])assert.throws(()=>reverseSimulationRangeHeader(RANGE_HEADER_PATH,bad),/production bytes/);
 const earlier=git('show','475736665290662d1da7f8386fa1e014147bb3b4:'+RANGE_HEADER_PATH);
 assert.deepEqual(reverseClaudeSimulationUi(RANGE_HEADER_PATH,good),earlier,'The exact new reversal precedes, rather than replaces, the previous UI layer');
});

for(const phone of [false,true])test(`range header: ${phone?'phone':'desktop'} completed UMC 5000 retains count, heading and intro in ordered flow across locales and guide switches`,async()=>{
 const h=guideFixture({research:true,ticker:'UMC',phone,reduced:true,asyncRun:true});
 try{
  h.get('#mc-tab-growthPremium').click();const sd=h.get('#mc-annual-innovation-sd');sd.value='0.1';sd.dispatch('input');await h.flush();
  h.get('#mc-run').click();await h.flush();assert.equal(h.get('#mc-output').getAttribute('data-result-state'),'current');assert.equal(h.runs.filter(r=>r.config.trials===5000).at(-1).result.accepted,5000);
  const heading=h.root.querySelector('.mc-heading'),count=h.root.querySelector('.mc-count'),intro=h.root.querySelector('.mc-intro'),stage=h.root.querySelector('.mc-output-stage'),title=h.get('#mc-title');
  for(const locale of ['zh-Hans','en','zh-Hans','en']){
   setLocale(locale);await h.flush();h.root.querySelector('.rx-mcg-back').click();await h.flush();h.root.querySelector('.rx-mcg-switch').click();await h.flush();
   assert.equal(h.root.querySelector('.mc-heading'),heading);assert.equal(count.parentElement,heading);assert.equal(title.parentElement.parentElement,heading);assert.equal(intro.parentElement,stage);
   assert.equal(heading.parentElement,stage.parentElement);assert.ok(heading.parentElement.children.indexOf(heading)<stage.parentElement.children.indexOf(stage));
   assert.equal(heading.parentElement.classList.contains('rx-mc-right'),!phone);assert.match(count.textContent,/5,000/);assert.equal(h.get('#mc-trials').value,'5000');
   for(const node of [heading,count,intro])assert.doesNotMatch(node.getAttribute('style')||'',/position\s*:\s*(absolute|fixed)|transform\s*:/);
  }
 }finally{setLocale('en');h.cleanup();}
});
