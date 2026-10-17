// CSS/source contract checks only. Passing does not establish browser rendering.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const rgb=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));
const luminance=rgb=>rgb.map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
for(const theme of ['forest','slate','midnight','sand','plum','ocean'])test(`v6 QA: ${theme} stage text, faint chart labels and signal retain sufficient source-color contrast`,()=>{
 const tokens={};for(const pattern of [/:root\{([^}]+)\}/g,new RegExp(`\\[data-theme="${theme}"\\]\\{([^}]+)\\}`,'g')])for(const m of css.matchAll(pattern))for(const t of m[1].matchAll(/--([a-z-]+):(#[0-9a-f]{6})/g))tokens[t[1]]=t[2];
 for(const k of ['stage','stage-text','signal'])assert.ok(tokens[k],`${theme}: missing ${k}`);
 const bg=rgb(tokens.stage),fg=rgb(tokens['stage-text']),faint=fg.map((v,i)=>v*.65+bg[i]*.35);
 assert.ok(contrast(fg,bg)>=4.5);assert.ok(contrast(faint,bg)>=4.5);assert.ok(contrast(rgb(tokens.signal),bg)>=3);
});
test('v6 QA: chart interaction preserves vertical scrolling and motion has an explicit reduced-motion rule',()=>{
 assert.match(css,/\.mc-chart\{[^}]*touch-action:pan-y/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\*,\*:before,\*:after\{animation:none!important;transition:none!important;scroll-behavior:auto!important/);
});
