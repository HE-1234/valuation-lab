import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const css=readFileSync(new URL('../dist/approved-foundation.css',import.meta.url),'utf8');

test('approved shared stylesheet uses exact light and dark tokens without overriding other themes',()=>{
 const light=css.match(/html:not\(\[data-theme\]\), html\[data-theme="slate"\]\s*\{([^}]+)\}/)?.[1];
 const dark=css.match(/html\[data-theme="midnight"\]\s*\{([^}]+)\}/)?.[1];
 assert.ok(light);assert.ok(dark);
 for(const [key,value]of Object.entries({paper:'#f8f7f2',surface:'#fffefa',ink:'#203c3d',muted:'#647371',accent:'#32786b',soft:'#eaf0e9',line:'#dce2dc','approved-history':'#a8bbb0','approved-history-dark':'#718d7d'})){
  assert.match(light,new RegExp(`--${key}:\\s*${value};`));
 }
 for(const [key,value]of Object.entries({paper:'#142024',surface:'#1b2b2f',ink:'#e9f1ec',muted:'#a5b8b2',accent:'#8dcdbb',soft:'#263d36',line:'#344a48','approved-history':'#637f72','approved-history-dark':'#9db7a8'})){
  assert.match(dark,new RegExp(`--${key}:\\s*${value};`));
 }
 const root=css.match(/:root\s*\{([^}]+)\}/)?.[1];
 assert.doesNotMatch(root,/--(?:paper|surface|ink|accent):/,'generic :root must not erase saved palette selections');
});

test('approved typography is self-hosted with complete licenses and unchanged official font bytes',()=>{
 assert.doesNotMatch(css,/@import|https?:\/\//);
 const files={
  'DM-Sans-Variable.ttf':'8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d',
  'Instrument-Serif-Regular.ttf':'498efd461f6ddfcb7a111bf9a565709d2085d48201d501ead960d93e84ffbb88',
  'Instrument-Serif-Italic.ttf':'08939b8bdf534afec24ae0ef5e03f948940cd9a8fe08e7fecbad040e62327385'
 };
 for(const [name,hash]of Object.entries(files)){
  const bytes=readFileSync(new URL('../dist/fonts/'+name,import.meta.url));
  assert.equal(bytes.readUInt32BE(0),0x00010000,`${name} must be a TrueType font`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  assert.ok(css.includes(`url('./fonts/${name}')`));
 }
 for(const file of ['DM-Sans-OFL.txt','Instrument-Serif-OFL.txt']){
  assert.match(readFileSync(new URL('../dist/fonts/'+file,import.meta.url),'utf8'),/SIL OPEN FONT LICENSE Version 1\.1/i);
 }
 assert.match(css,/font-weight: 100 1000/);
});

test('foundation keeps ordinary document flow, compact chrome, and reduced motion',()=>{
 assert.match(css,/min-height: 52px/);
 assert.match(css,/min-height: 43px/);
 assert.match(css,/grid-template-columns: minmax\(0,1\.38fr\) minmax\(0,1fr\)/);
 assert.match(css,/--motion-tab: 320ms/);
 assert.match(css,/--motion-panel: 240ms/);
 assert.match(css,/--motion-bar: 460ms/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.doesNotMatch(css,/overflow\s*:\s*hidden|height\s*:\s*100(?:d|v)?vh/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});

test('approved text and control contrast covers plain and soft surfaces without legacy inspector opacity',()=>{
 // Source-level color/cascade contract; actual browser paint and focus still need visual QA.
 const workspace=readFileSync(new URL('../dist/approved-workspace.css',import.meta.url),'utf8');
 const original=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
 const tokens=block=>Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map(m=>[m[1],m[2]]));
 const light=tokens(css.match(/html:not\(\[data-theme\]\), html\[data-theme="slate"\]\s*\{([^}]+)\}/)[1]);
 const dark=tokens(css.match(/html\[data-theme="midnight"\]\s*\{([^}]+)\}/)[1]);
 const themes={slate:light,midnight:dark};
 for(const name of ['forest','sand','plum','ocean'])themes[name]=tokens(original.match(new RegExp(`\\[data-theme="${name}"\\]\\s*\\{([^}]+)\\}`))[1]);
 const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const l=[luminance(a),luminance(b)].sort((x,y)=>x-y);return (l[1]+.05)/(l[0]+.05);};
 for(const [name,t]of Object.entries(themes)){
  for(const surface of ['paper','surface'])for(const role of ['ink','muted','accent'])assert.ok(contrast(t[role],t[surface])>=4.5,`${name} ${role} on ${surface}`);
  assert.ok(contrast(t.ink,t.soft)>=4.5,`${name} ink on soft`);
  const control=name==='slate'?'#718d7d':name==='midnight'?'#9db7a8':t.control;
  assert.ok(contrast(control,t.surface)>=3,`${name} field boundary`);
 }
 assert.match(workspace,/html\[data-theme=slate\],html:not\(\[data-theme\]\)\{--control:#718d7d\}/);
 const softRule=[...workspace.matchAll(/([^{}]+)\{([^{}]+)\}/g)].find(m=>m[1].includes('.approved-comparison')&&m[2].includes('color:var(--ink)')&&m[2].includes('opacity:1'));
 assert.ok(softRule,'soft-fill supporting text must use opaque ink');
 for(const selector of ['.approved-comparison','.screen-workspace .mc-inspector :is(small,span)','.screen-workspace .mc-stat :is(small,span)','.screen-workspace .mc-inspector>span:last-child small'])assert.ok(softRule[1].includes(selector),selector);
});
