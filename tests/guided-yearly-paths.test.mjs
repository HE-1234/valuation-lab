import test from 'node:test';
import assert from 'node:assert/strict';
import {startStudio} from './v7-runtime-harness.mjs';
import {marginAtYear,marginPathIssues,YEARLY_MARGIN_PATH_VERSION} from '../dist/margin-path.js';
import {capitalPathIssues,capitalSalesCapitalAtYear,resolvedCapitalPath} from '../dist/capital-efficiency.js';

const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} ≠ ${b}`);
const yearlyMargin={enabled:true,version:YEARLY_MARGIN_PATH_VERSION,nearTermMargins:[.18,.22,.25],terminalYear:8};

test('Yearly margin path: set years exactly, then a straight line to the mature margin, then hold',()=>{
 const p={...yearlyMargin,startMargin:.1,terminalMargin:.3};
 assert.deepEqual(marginPathIssues(p),[]);
 close(marginAtYear(p,1),.18);close(marginAtYear(p,2),.22);close(marginAtYear(p,3),.25);
 close(marginAtYear(p,4),.25+(.3-.25)/5);close(marginAtYear(p,8),.3);close(marginAtYear(p,20),.3);
});
test('Yearly margin path rejects empty, out-of-range and late-terminal inputs without clipping',()=>{
 const base={...yearlyMargin,startMargin:.1,terminalMargin:.3};
 assert.ok(marginPathIssues({...base,nearTermMargins:[]}).length);
 assert.ok(marginPathIssues({...base,nearTermMargins:Array(16).fill(.2)}).length);
 assert.ok(marginPathIssues({...base,nearTermMargins:[.2,1.4]}).length);
 assert.ok(marginPathIssues({...base,nearTermMargins:[.2,NaN]}).length);
 assert.ok(marginPathIssues({...base,terminalYear:3}).length);
 assert.ok(marginPathIssues({...base,terminalYear:31}).length);
});
test('Yearly capital path: year 1 is the initial ratio, set years follow, intensity fades to terminal',()=>{
 const draft={capitalPath:{enabled:true,version:2,yearlySalesCapital:[1.8,2.2],terminalYear:8},assumptions:{salesCapital:1.5,targetMargin:.3,tax:.2,terminalGrowth:.03,terminalROIC:.25}};
 assert.deepEqual(capitalPathIssues(draft.capitalPath),[]);
 const path=resolvedCapitalPath(draft);
 close(capitalSalesCapitalAtYear(path,1),1.5);close(capitalSalesCapitalAtYear(path,2),1.8);close(capitalSalesCapitalAtYear(path,3),2.2);
 close(capitalSalesCapitalAtYear(path,8),path.terminalSalesCapital);
 const y5=capitalSalesCapitalAtYear(path,5),w=2/5;close(1/y5,(1-w)/2.2+w*path.terminalIntensity);
 // One sampled initial ratio scales every set year proportionally.
 const scaled=resolvedCapitalPath(draft,{...draft.assumptions,salesCapital:3});
 close(capitalSalesCapitalAtYear(scaled,2),3.6);close(capitalSalesCapitalAtYear(scaled,3),4.4);
 assert.ok(capitalPathIssues({...draft.capitalPath,yearlySalesCapital:[1,-1]}).length);
 assert.ok(capitalPathIssues({...draft.capitalPath,terminalYear:3}).length);
 assert.ok(capitalPathIssues({...draft.capitalPath,extra:1}).length);
});

const value=h=>h.get('#guided-results').textContent.match(/([\d,]+\.\d+)\s*USD/)?.[1];
test('Switching to "Set each year" starts from the current path, so the value does not jump',async()=>{
 const h=await startStudio();h.step(3);const before=value(h);
 h.change('#guided-margin-mode','yearly');const p=h.state().marginPath;
 assert.equal(p.version,YEARLY_MARGIN_PATH_VERSION);assert.ok(p.nearTermMargins.length>=1);
 assert.ok(Math.abs(Number(value(h).replace(/,/g,''))-Number(before.replace(/,/g,'')))<.1,`${before} → ${value(h)}`);
 h.step(4);const capitalBefore=value(h);h.change('#guided-capital-mode','yearly');
 assert.equal(h.state().capitalPath.version,2);assert.equal(value(h),capitalBefore);
});
test('Yearly fields edit the draft; shrinking and growing the count restores dropped years',async()=>{
 const h=await startStudio();h.step(3);h.change('#guided-margin-mode','yearly');
 h.input('#guided-margin-year-2','40');h.flush();close(h.state().marginPath.nearTermMargins[1],.4);
 h.change('#guided-margin-nearTermYears','1');assert.equal(h.state().marginPath.nearTermMargins.length,1);
 h.change('#guided-margin-nearTermYears','3');close(h.state().marginPath.nearTermMargins[1],.4);
 h.change('#guided-margin-nearTermYears','14');const p=h.state().marginPath;assert.equal(p.nearTermMargins.length,14);assert.ok(p.terminalYear>14);
 h.step(4);h.change('#guided-capital-mode','yearly');h.input('#guided-capital-year-1','2.5');h.flush();
 assert.equal(h.state().assumptions.salesCapital,2.5);assert.equal(h.get('#g-salesCapital').value,'2.5');
});
