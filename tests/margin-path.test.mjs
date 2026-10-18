import test from 'node:test';
import assert from 'node:assert/strict';
import {marginAtYear,marginPathIssues,MARGIN_PATH_VERSION} from '../dist/margin-path.js';
const path={enabled:true,version:MARGIN_PATH_VERSION,startMargin:.1,interimMargin:.3,interimYear:4,declineStartYear:7,terminalMargin:.2,terminalYear:12};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
test('linear rise, exact interim endpoint, plateau, decline, terminal hold independent of horizon',()=>{
 for(const [year,margin] of [[0,.1],[2,.2],[4,.3],[5,.3],[7,.3],[8,.28],[12,.2],[20,.2],[30,.2]])close(marginAtYear(path,year),margin);
});
test('equal targets, flat path, zero-length plateau and equal-value zero-length decay',()=>{
 const flat={...path,startMargin:.2,interimMargin:.2,terminalMargin:.2,interimYear:1,declineStartYear:1,terminalYear:1};
 assert.deepEqual(marginPathIssues(flat),[]);for(const y of [0,1,2,30])close(marginAtYear(flat,y),.2);
 const early={...path,declineStartYear:4};close(marginAtYear(early,8),.25);
});
test('negative starting/peak margins are supported but terminal must be positive',()=>{
 const p={...path,startMargin:-.5,interimMargin:-.1};close(marginAtYear(p,2),-.3);close(marginAtYear(p,12),.2);
 assert.ok(marginPathIssues({...p,terminalMargin:0}).length);
});
test('reject missing, out-of-range, noninteger, unordered and discontinuous same-year inputs',()=>{
 for(const patch of [{startMargin:undefined},{interimMargin:NaN},{startMargin:-.50001},{interimMargin:1.01},{interimYear:0},{interimYear:2.5},{terminalYear:31},{declineStartYear:3},{terminalYear:6},{terminalYear:7},{enabled:undefined},{version:'unknown'}])assert.ok(marginPathIssues({...path,...patch}).length,JSON.stringify(patch));
 assert.ok(marginPathIssues(null).length);assert.throws(()=>marginAtYear(path,-1));assert.throws(()=>marginAtYear(path,NaN));
});
test('disabled incomplete configuration validates without evaluating or mutating',()=>{
 const p={enabled:false};assert.deepEqual(marginPathIssues(p),[]);assert.throws(()=>marginAtYear(p,2));const before=structuredClone(path);marginAtYear(path,9);assert.deepEqual(path,before);
});
