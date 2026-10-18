// Source-level cascade contract; real browser appearance remains part of visual QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../dist/simulation.css',import.meta.url),'utf8');
test('manual Run and Cancel use semantic foreground/background/border tokens',()=>{
 assert.match(css,/\.mc-run-actions \.mc-run-button\{background:var\(--accent\);color:var\(--on-accent\);border:1px solid var\(--accent\)/);
 assert.match(css,/\.mc-run-actions button:not\(\.mc-run-button\)\{background:var\(--surface\);color:var\(--ink\);border:1px solid var\(--control\)/);
});
test('annual uncertainty checkbox has bounded native geometry and a 44px label target',()=>{
 assert.match(css,/label:has\(>input\[type="checkbox"\]\)\{[^}]*min-height:44px/);
 const rule=css.match(/\.simulation-lab \.mc-setup input\[type="checkbox"\]\{([^}]+)\}/)?.[1];assert.ok(rule);
 for(const property of ['width','min-width','max-width','height','min-height','max-height'])assert.match(rule,new RegExp('(?:^|;)'+property+':20px(?:;|$)'));
 assert.match(rule,/appearance:auto/);assert.match(rule,/padding:0/);assert.match(rule,/accent-color:var\(--accent\)/);
});
