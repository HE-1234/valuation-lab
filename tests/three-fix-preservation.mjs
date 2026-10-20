// An exact, hash-checked V88 projection for older preservation gates only.
// Runtime tests continue importing the shipped modules. The independent V89 tree
// gate verifies every actual byte and rejects unlisted files or mutations first.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
export const root=fileURLToPath(new URL('..',import.meta.url));
export const delta=JSON.parse(fs.readFileSync(new URL('./three-fix-delta.json',import.meta.url)));
export const sha=b=>createHash('sha256').update(b).digest('hex');
const files=new Map(delta.files.map(x=>[x.path,x])),cache=new Map();
const relative=p=>typeof p==='number'?null:path.relative(root,p instanceof URL?fileURLToPath(p):path.resolve(String(p))).split(path.sep).join('/');
export function reverseUnified(p,bytes){
 const item=files.get(p);if(!item)return bytes;
 assert.equal(sha(bytes),item.after_sha256,p+' exact approved three-fix release bytes');
 if(!item.before_sha256)return null;
 if(!cache.has(p)){const before=execFileSync('git',['show',delta.baseline+':'+p],{cwd:root,maxBuffer:8e6});assert.equal(sha(before),item.before_sha256,p+' immutable V88 before hash');cache.set(p,before);}
 return Buffer.from(cache.get(p));
}
export const preservedV88Fs=Object.create(fs);
preservedV88Fs.readFileSync=(p,options)=>{
 const key=relative(p);if(!files.has(key))return fs.readFileSync(p,options);
 const bytes=reverseUnified(key,fs.readFileSync(p));if(bytes===null)return fs.readFileSync(p,options);
 const encoding=typeof options==='string'?options:options?.encoding;return encoding?bytes.toString(encoding):bytes;
};
preservedV88Fs.readdirSync=(p,options)=>{
 const parent=relative(p),items=fs.readdirSync(p,options),additions=delta.files.filter(f=>!f.before_sha256&&(options?.recursive?f.path.startsWith(parent+'/'):path.posix.dirname(f.path)===parent));
 for(const item of additions)reverseUnified(item.path,fs.readFileSync(path.join(root,item.path)));
 const names=new Set(additions.map(f=>f.path));
 return items.filter(item=>{const key=typeof item==='string'?parent+'/'+item:Buffer.isBuffer(item)?parent+'/'+item.toString():relative(path.join(item.parentPath||item.path||path.join(root,parent),item.name));return !names.has(key);});
};
