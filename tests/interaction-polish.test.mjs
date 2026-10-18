// CSS/source and synthetic-DOM contracts, not a native-browser paint oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startStudio} from './v7-runtime-harness.mjs';
import {startResearchWorkspace} from './research-workspace-harness.mjs';

const read = name => readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8');
const css = read('interaction-polish.css');
const source = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Keep enclosing conditions: a hover/reduced-motion rule in the wrong media
// block must fail instead of passing a presence-only regular expression test.
function rules(text, conditions = []) {
  const result = [];
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf('{', cursor);
    if (open === -1) break;
    const selector = text.slice(cursor, open).trim();
    let depth = 1, end = open + 1;
    while (end < text.length && depth) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
      end++;
    }
    assert.equal(depth, 0, 'balanced stylesheet');
    const body = text.slice(open + 1, end - 1);
    if (selector.startsWith('@')) result.push(...rules(body, [...conditions, selector]));
    else result.push({selector, conditions, declarations: Object.fromEntries(body.split(';').filter(x => x.includes(':')).map(x => {
      const colon = x.indexOf(':');
      return [x.slice(0, colon).trim(), x.slice(colon + 1).trim()];
    }))});
    cursor = end;
  }
  return result;
}
const parsed = rules(source);
const rule = (needle, predicate = () => true) => {
  const found = parsed.find(r => r.selector.includes(needle) && predicate(r));
  assert.ok(found, `rule exists: ${needle}`);
  return found;
};
const tab = 'body .screen-workspace [role="tablist"] > button[role="tab"]';
const base = rule(tab, r => r.declarations.transition?.includes('background-color'));
const selected = rule(`${tab}[aria-selected="true"]`, r => !r.conditions.length);

test('interaction layer is included exactly once and after every legacy sheet', () => {
  const sheets = [...read('index.html').matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  assert.equal(sheets.filter(x => x === 'interaction-polish.css').length, 1);
  // Explicit presentation enhancements may follow; every legacy sheet remains earlier.
  const enhancements = new Set(['theme-transition.css', 'i18n.css']);
  assert.equal(sheets.filter(sheet => !enhancements.has(sheet)).at(-1), 'interaction-polish.css');
  assert.ok(sheets.includes('approved-foundation.css'));
  assert.ok(sheets.includes('approved-workspace.css'));
});

test('navigation paint has rounded surfaces and finite color-only transitions', () => {
  assert.equal(rule(':root').declarations['--interaction-duration'], '180ms');
  assert.equal(rule(':root').declarations['--interaction-radius'], '7px');
  for (const [property, value] of Object.entries({border:'0', 'box-shadow':'none', 'text-decoration':'none', transform:'none', background:'transparent', color:'var(--muted)', padding:'7px 10px', 'min-height':'35px'})) {
    assert.equal(base.declarations[property], value, property);
  }
  assert.equal(base.declarations['border-radius'], 'var(--interaction-radius)');
  assert.match(base.declarations.transition, /^background-color .*?,\s*color /);
  assert.doesNotMatch(base.declarations.transition, /\ball\b|transform|width|height|padding|font/);
  for (const target of ['body > aside nav > button', 'body .mode-navigation > button', '.workspace-mobile-tabs > button', tab]) assert.ok(base.selector.includes(target));
});

test('persistent selected blocks do not depend on hover, motion, or a new script', () => {
  assert.equal(selected.declarations.background, 'var(--interaction-selected)');
  assert.equal(selected.declarations.color, 'var(--ink)');
  assert.equal(selected.declarations['font-weight'], '650');
  assert.equal(selected.declarations['box-shadow'], 'none');
  assert.equal(selected.declarations.border, '0');
  assert.ok(selected.selector.includes('[aria-current="page"]'));
  assert.ok(selected.selector.includes('[aria-pressed="true"]'));
  assert.equal(selected.conditions.length, 0);
  assert.equal(rule(':root').declarations['--interaction-selected'], 'var(--soft)');
});

test('hover is capability-gated, excludes selection, and never changes hitboxes', () => {
  const hover = rule(':not([aria-selected="true"]):not(:disabled):hover');
  assert.deepEqual(hover.conditions, ['@media (hover: hover) and (pointer: fine)']);
  assert.deepEqual(Object.keys(hover.declarations).sort(), ['background', 'color']);
  assert.equal(hover.declarations.background, 'var(--interaction-hover)');
  assert.equal(hover.declarations.color, 'var(--ink)');
  assert.ok(hover.selector.includes(':not(.active):not([aria-current="page"]):not(:disabled):hover'));
  const mix = rule(':root', r => r.conditions.some(c => c.startsWith('@supports')));
  assert.equal(mix.declarations['--interaction-hover'], 'color-mix(in srgb, var(--soft) 58%, var(--paper))');
  const touch = rule(':hover', r => r.conditions.includes('@media (hover: none), (pointer: coarse)'));
  assert.equal(touch.declarations.background, 'transparent', 'legacy unconditional nav hover is neutralized on touch');
  assert.ok(touch.selector.includes(':not([aria-selected="true"])'));
});

test('underline removal and divider removal are narrow, with no content hiding', () => {
  const underline = rule(`${tab}::after`);
  assert.equal(underline.declarations.content, 'none');
  assert.equal(underline.declarations.display, 'none');
  assert.ok(underline.selector.includes('body .mode-navigation > button::after'));
  const dividers = rule('body .workspace-modebar');
  assert.equal(dividers.declarations['border-bottom'], '0');
  assert.ok(dividers.selector.includes('.screen-workspace .workspace-toolbar'));
  const tabs = rule('body .screen-workspace [role="tablist"],');
  assert.equal(tabs.declarations.border, '0');
  assert.ok(tabs.selector.includes('.guided-screen .workspace-editor .assumption-tabs'));
  for (const r of parsed) {
    if (r.declarations.display === 'none') assert.ok(r.selector.includes('::after'), r.selector);
    assert.doesNotMatch(r.selector, /\b(?:input|select|textarea|table|td|th|svg|canvas)\b/, 'no form/data selector may lose its boundary');
    for (const property of ['overflow', 'overflow-x', 'overflow-y', 'position', 'font-family', 'pointer-events', 'grid-template-columns']) assert.equal(r.declarations[property], undefined, property);
    assert.notEqual(r.declarations.outline, 'none');
  }
});

test('new selectors outrank the exact existing Guided tab and underline cascade', () => {
  // Specificity (IDs, classes/attributes/pseudos, elements). The new final-sheet
  // rule has an extra element selector; it wins without !important. ARIA still
  // controls state. This is a source-cascade assertion, not computed browser CSS.
  const legacy = read('approved-workspace.css');
  assert.ok(legacy.includes('.guided-screen .workspace-editor .assumption-tabs button[aria-selected=true]{background:transparent;color:var(--accent)}'));
  assert.ok(read('screen-workspace.css').includes('.assumption-tabs button[aria-selected=true]::after'));
  assert.ok(selected.selector.includes(`${tab}[aria-selected="true"]`));
  const legacySelected = [0, 4, 1], newSelected = [0, 4, 2];
  assert.ok(newSelected[1] > legacySelected[1] || newSelected[1] === legacySelected[1] && newSelected[2] > legacySelected[2]);
  const legacyBase = [0, 3, 1], newBase = [0, 3, 2];
  assert.ok(newBase[2] > legacyBase[2]);
  assert.ok(rule(`${tab}::after`).selector.includes(`${tab}::after`));
  assert.doesNotMatch(selected.declarations.background, /!important/);
});

test('keyboard, reduced motion, touch, and forced colors retain explicit states', () => {
  const focus = rule(`${tab}:focus-visible`, r => !r.conditions.length);
  assert.equal(focus.declarations.outline, '2px solid var(--focus)');
  assert.equal(focus.declarations['outline-offset'], '2px');
  const touch = rule(tab, r => r.conditions.includes('@media (max-width: 760px), (pointer: coarse)'));
  assert.equal(touch.declarations['min-height'], '44px');
  const reduced = rule(tab, r => r.conditions.includes('@media (prefers-reduced-motion: reduce)'));
  assert.equal(reduced.declarations.transition, 'none !important');
  assert.equal(reduced.declarations.animation, 'none !important');
  const forced = rule(`${tab}[aria-selected="true"]`, r => r.conditions.includes('@media (forced-colors: active)'));
  assert.equal(forced.declarations.outline, '1px solid Highlight');
  const forcedFocus = rule(`${tab}:focus-visible`, r => r.conditions.includes('@media (forced-colors: active)'));
  assert.equal(forcedFocus.declarations.outline, '2px solid CanvasText');
});

test('six themes keep readable selected/hover text and contrasting focus rings', () => {
  const original = read('style.css'), foundation = read('approved-foundation.css');
  const tokens = text => Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));
  const themes = {};
  for (const name of ['forest', 'sand', 'plum', 'ocean']) themes[name] = tokens(original.match(new RegExp(`\\[data-theme="${name}"\\]\\s*\\{([^}]+)\\}`))[1]);
  themes.slate = tokens(foundation.match(/html:not\(\[data-theme\]\), html\[data-theme="slate"\]\s*\{([^}]+)\}/)[1]);
  themes.midnight = tokens(foundation.match(/html\[data-theme="midnight"\]\s*\{([^}]+)\}/)[1]);
  const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16));
  const luminance = color => (Array.isArray(color) ? color : rgb(color)).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i], 0);
  const contrast = (a,b) => { const [lo,hi] = [luminance(a),luminance(b)].sort((x,y)=>x-y); return (hi+.05)/(lo+.05); };
  for (const [name,t] of Object.entries(themes)) {
    const hover = rgb(t.soft).map((v,i) => .58*v + .42*rgb(t.paper)[i]);
    for (const background of [t.soft, hover]) assert.ok(contrast(t.ink,background) >= 4.5, `${name}: ink on interaction surface`);
    for (const background of [t.paper,t.surface,t.soft,hover]) assert.ok(contrast(t.focus,background) >= 3, `${name}: focus on interaction surface`);
    assert.ok(contrast(t.muted,t.paper) >= 4.5, `${name}: idle text`);
  }
  assert.doesNotMatch(source, /--(?:paper|surface|soft|ink|muted|accent|focus|control|font-ui|font-editorial)\s*:/, 'theme and font tokens stay intact');
});

function checkTabGroups(root) {
  const groups = root.querySelectorAll('[role="tablist"]');
  assert.ok(groups.length >= 2);
  for (const group of groups) {
    const buttons = group.children.filter(n => n.tagName === 'BUTTON');
    assert.ok(buttons.length);
    assert.ok(buttons.every(n => n.getAttribute('role') === 'tab'));
    assert.equal(buttons.filter(n => n.getAttribute('aria-selected') === 'true').length, 1);
  }
}
test('real Guided and Annual tab state still supplies persistent semantic selection', async () => {
  const guided = await startStudio();
  checkTabGroups(guided.app);
  const field = guided.get('#g-growth');
  field.focus(); guided.input('#g-growth','12.5');
  const before = guided.get('#group-3');
  guided.step(3); guided.step(3);
  assert.equal(guided.get('#group-3'), before);
  assert.equal(before.getAttribute('aria-selected'), 'true');
  assert.equal(guided.get('#g-growth'), field);
  checkTabGroups(guided.app);
  const annual = await startResearchWorkspace();
  try {
    checkTabGroups(annual.root);
    annual.get('[data-annual-editor="terminal"]').click();
    assert.equal(annual.get('[data-annual-editor="terminal"]').getAttribute('aria-selected'), 'true');
    annual.get('[data-annual-view="simulation"]').click();
    assert.equal(annual.get('[data-annual-view="simulation"]').getAttribute('aria-selected'), 'true');
    checkTabGroups(annual.root);
  } finally { annual.destroy(); }
});
