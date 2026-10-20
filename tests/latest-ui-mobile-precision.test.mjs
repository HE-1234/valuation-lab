import {reverseNativeEditReveal} from './native-guide-layout-preservation.mjs';
// Shipped CSS/source and parsed-DOM contracts. Actual 390px geometry is checked
// separately in the native browser; this harness does not implement layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {guideFixture} from './simulation-guide-dom-harness.mjs';
import {setLocale} from '../dist/i18n.js';
const root=new URL('..',import.meta.url),css=reverseNativeEditReveal(fs.readFileSync(new URL('dist/skins/report.css',root))).toString('utf8');
const before=execFileSync('git',['show','508a85ad2101ce08fd441d93b7a532d50c8f0e7f:dist/skins/report.css'],{cwd:root,encoding:'utf8'});
const selector='& body .rx-mcg.is-sampling [data-part="value"] > .rx-mcg-fold > summary';
const repair=`    /* Keep precision's long title and answer chip on separate phone rows. */
    ${selector} { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; row-gap: 8px; }
    ${selector} > .rx-mcg-ic { grid-column: 1; grid-row: 1; }
    ${selector} > h4 { grid-column: 2; grid-row: 1; overflow-wrap: anywhere; }
    ${selector} > .rx-mcg-chip { grid-column: 2; grid-row: 2; justify-self: start; max-width: 100%; box-sizing: border-box; }
    ${selector}::after { grid-column: 3; grid-row: 1 / span 2; }
`;

test('phone precision stacks only title/chip geometry inside the existing mobile scope, with every palette and desktop byte unchanged',()=>{
 assert.equal(css.split(repair).length-1,1);assert.equal(css.replace(repair,''),before);
 const start=css.indexOf(repair),media=css.lastIndexOf('@media (max-width: 760px)',start);
 assert.ok(media>=0);assert.equal(css.slice(media,start).replace(/\{[^{}]*\}/g,'').split('{').length-1,1,'Repair remains inside the existing mobile media block');
 assert.doesNotMatch(repair,/(?:color|background|font|--[\w-]+)\s*:/);
 assert.match(repair,/grid-template-columns: 28px minmax\(0, 1fr\) auto/);
 assert.match(repair,/> h4 \{ grid-column: 2; grid-row: 1;/);
 assert.match(repair,/> \.rx-mcg-chip \{ grid-column: 2; grid-row: 2;/);
});

for(const locale of ['en','zh-Hans'])for(const populated of [true,false])test(`phone precision ${locale} ${populated?'populated':'withheld'} keeps distinct title and chip cells through disclosure and repaint`,async()=>{
 const h=guideFixture({research:true,ticker:'UMC',phone:true,configMutate:c=>{c.trials=400;}});
 try{
  setLocale(locale);h.get('#mc-tab-sampling').click();await h.flush();
  const saved=structuredClone(h.draft.researchSimulationConfig);
  h.root.mcState.latest=populated?{p10:80,p50:100,p90:120,accepted:400}:{p10:100,p50:100,p90:100,accepted:37};
  h.guideAPI.paint(h.root);
  const host=h.root.querySelector('.rx-mcg.is-sampling'),part=host.querySelector('[data-part="value"]'),fold=part.querySelector('details'),summary=fold.querySelector(':scope > summary');
  const title=summary.querySelector(':scope > h4'),chip=summary.querySelector(':scope > .rx-mcg-chip'),icon=summary.querySelector(':scope > .rx-mcg-ic');
  assert.equal(fold.dataset.fold,'prec:p');assert.ok(title&&chip&&icon);assert.notEqual(title,chip);
  assert.match(title.textContent,locale==='en'?/Approximate sampling precision/:/抽样精度/);
  assert.match(chip.textContent,populated?(locale==='en'?/rough median ±/:/当前情景数下中位数约 ±/):(locale==='en'?/Estimate withheld/:/暂不提供精度估计/));
  for(const open of [true,false,true]){fold.open=open;h.guideAPI.paint(h.root);assert.equal(part.querySelector('h4').textContent,title.textContent);assert.equal(part.querySelector('.rx-mcg-chip').textContent,chip.textContent);}
  assert.deepEqual(h.draft.researchSimulationConfig,saved,'Presentation does not edit the active model or trial choices');
 }finally{setLocale('en');h.cleanup();}
});
