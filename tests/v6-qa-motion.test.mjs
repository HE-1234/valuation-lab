// Synthetic animation API checks; not proof of real browser painting or focus behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import {enterPanel,reducedMotion} from '../dist/motion.js';

test('v6 QA: repeated transition cancels the previous animation and duration is bounded',()=>{
 const prior=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});
 try{
  const animations=[];const node={animate(frames,options){const record={frames,options,canceled:false,cancel(){this.canceled=true}};animations.push(record);return record;}};
  enterPanel(node,1);enterPanel(node,-1);assert.equal(animations.length,2);assert.equal(animations[0].canceled,true);assert.equal(animations[1].canceled,false);assert.equal(animations[1].options.duration,240);assert.deepEqual(animations[1].frames,[{opacity:.3,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}]);assert.ok(animations[1].frames.every(frame=>!('clipPath'in frame)));
  animations[1].onfinish();enterPanel(node);assert.equal(animations[1].canceled,false,'finished animation must leave no active animation to cancel');
 }finally{if(prior===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=prior;}
});
test('v6 QA: reduced motion and absent animation API both retain usable synchronous navigation',()=>{
 const prior=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:true});
 try{assert.equal(reducedMotion(),true);let n=0;enterPanel({animate(){n++}});assert.equal(n,0);assert.doesNotThrow(()=>enterPanel(null));assert.doesNotThrow(()=>enterPanel({}));}finally{if(prior===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=prior;}
});
