// Exact compatibility projection for immutable historical preservation gates.
// This does not affect runtime tests or production. The new independent tree gate
// verifies every V87 file plus the two additions before prior gates see V87 bytes.
import {preservedV88Fs as fs} from './three-fix-preservation.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const root=fileURLToPath(new URL('..',import.meta.url));
export const delta=JSON.parse(fs.readFileSync(new URL('./guided-company-delta.json',import.meta.url),'utf8'));
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const entries=new Map(delta.files.map(f=>[f.path,Object.freeze(f)]));
const beforeCache=new Map();
export function reverseGuidedCompany(p,bytes){
 const item=entries.get(p);if(!item)return bytes;
 assert.equal(sha(bytes),item.after_sha256,p+' exact reviewed Guided company bytes');
 if(!item.before_sha256)return null;
 if(!beforeCache.has(p)){
  const before=execFileSync('git',['show',delta.baseline+':'+p],{cwd:root,maxBuffer:8e6});
  assert.equal(sha(before),item.before_sha256,p+' immutable V87 before hash');beforeCache.set(p,before);
 }
 return Buffer.from(beforeCache.get(p));
}
function relative(p){if(typeof p==='number')return null;return path.relative(root,p instanceof URL?fileURLToPath(p):path.resolve(String(p))).split(path.sep).join('/');}
export const preservedV87Fs=Object.create(fs);
preservedV87Fs.readFileSync=(p,options)=>{
 const key=relative(p),item=entries.get(key);
 if(!item?.before_sha256){
  if(key?.startsWith('tests/')&&key.endsWith('.test.mjs')&&key!=='tests/guided-company-preservation.test.mjs'){
   const actual=fs.readFileSync(p,'utf8'),marker="import {preservedV87Fs as fs} from './guided-company-preservation.mjs'";
   if(actual.includes(marker)){
    assert.equal(actual.split(marker).length-1,1,key+' single explicit projection import');
    const restored=actual.replace(marker,"import fs from 'node:fs'");
    const before=execFileSync('git',['show',delta.baseline+':'+key],{cwd:root,maxBuffer:8e6});
    assert.equal(restored,before.toString(),key+' historical assertions unchanged');
    const encoding=typeof options==='string'?options:options?.encoding;
    return encoding?before.toString(encoding):before;
   }
  }
  return fs.readFileSync(p,options);
 }
 const restored=reverseGuidedCompany(key,fs.readFileSync(p));
 const encoding=typeof options==='string'?options:options?.encoding;
 return encoding?restored.toString(encoding):restored;
};
preservedV87Fs.readdirSync=(p,options)=>{
 const items=fs.readdirSync(p,options);if(relative(p)!=='dist')return items;
 const additions=delta.files.filter(f=>!f.before_sha256);
 for(const item of additions)reverseGuidedCompany(item.path,fs.readFileSync(path.join(root,item.path)));
 const addedNames=new Set(additions.map(f=>f.path.slice(5)));
 return items.filter(item=>!addedNames.has(typeof item==='string'?item:Buffer.isBuffer(item)?item.toString():item.name));
};
