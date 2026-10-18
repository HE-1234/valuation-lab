// Annual Report · UX layer. Presentation only: it animates what the
// application already shows and offers clearer controls that drive the
// application's own inputs (a native 'change'/'input' event on the original
// element), so models, drafts, Undo and validation behave exactly as if the
// person had used the original control. Inserted nodes carry .rx-el.
const root = document.documentElement;
const on = () => root.dataset.skin === 'report';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.16, 1, .3, 1)';
import {t, getLocale, onLocaleChange} from '../i18n.js';
const presentationAnimations = new Set();
let activeLocaleTransition;
export function animatePresentation(element, frames, options) {
  if (reduced() || document.hidden || typeof element.animate !== 'function') return null;
  const animation = element.animate(frames, options);
  animation.id = 'rx-presentation';
  presentationAnimations.add(animation);
  animation.finished?.then(() => presentationAnimations.delete(animation), () => presentationAnimations.delete(animation));
  return animation;
}
function cancelPresentationMotion() {
  if (!reduced() && !document.hidden) return;
  for (const animation of presentationAnimations) animation.cancel();
  presentationAnimations.clear();
  activeLocaleTransition?.skipTransition?.();
}
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', cancelPresentationMotion);
document.addEventListener('visibilitychange', cancelPresentationMotion);
let lastEdit = 0;
document.addEventListener('input', () => { lastEdit = performance.now(); }, true);

/* ---------- 1. Tab panels glide in from the side you moved toward ----------
   Watching aria-selected (rather than clicks) covers mouse, keyboard and
   programmatic switches alike. */
const lastIndex = new WeakMap();
function tabIndex(tab) { return [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')].indexOf(tab); }
function panelFor(tab) {
  const id = tab.getAttribute('aria-controls');
  const panel = id && document.getElementById(id);
  return panel && panel.offsetParent ? panel : null;
}
function animatePanel(panel, dir) {
  if (!panel || reduced()) return;
  panel.getAnimations?.().forEach(a => a.id === 'rx-tab' && a.cancel());
  const a = animatePresentation(panel, [
    {opacity: 0, transform: `translateX(${dir * 22}px)`},
    {opacity: 1, transform: 'none'}
  ], {duration: 420, easing: EASE});
  if (a) a.id = 'rx-tab';
}
new MutationObserver(records => {
  if (!on()) return;
  for (const r of records) {
    const tab = r.target;
    if (tab.getAttribute('role') !== 'tab' || tab.getAttribute('aria-selected') !== 'true') continue;
    const list = tab.closest('[role="tablist"]');
    if (!list) continue;
    const now = tabIndex(tab), before = lastIndex.get(list);
    lastIndex.set(list, now);
    if (before === undefined || before === now) continue;
    const dir = now > before ? 1 : -1;
    if (list.scrollWidth > list.clientWidth) {
      const left = tab.offsetLeft - 24, right = tab.offsetLeft + tab.offsetWidth + 24;
      if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) list.scrollTo({left: dir > 0 ? right - list.clientWidth : left, behavior: reduced() ? 'auto' : 'smooth'});
    }
    requestAnimationFrame(() => animatePanel(panelFor(tab) || list.nextElementSibling, dir));
  }
}).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['aria-selected']});
function rememberTabs() {
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    if (lastIndex.has(list)) continue;
    const sel = list.querySelector('[role="tab"][aria-selected="true"]');
    if (sel) lastIndex.set(list, tabIndex(sel));
  }
}

/* ---------- 2. Short choices become one-tap pills ----------
   The original <select> stays in the DOM (the application reads it); the pill
   group is the visible, keyboard-operable control and writes back to it. */
const CHOICES = 'select:is(#growth-maturity, #growth-path-mode, #guided-margin-mode, #guided-capital-mode, #annual-growth-horizon, #annual-margin-mode, #research-timing-mode, #research-mc-capital-policy, [id$="mc-growth-method"], [id$="mc-dependence"], [id$="mc-trials"], [id*="mc-"][id$="-type"])';
const groups = new Map();   // select id -> group
// Writes happen only when something changed: a scan that rewrites identical
// attributes would wake every observer on the page again, every frame.
function placeIndicator(group) {
  const ind = group.querySelector('.rx-choice-ind');
  const chosen = group.querySelector('[aria-checked="true"]');
  if (!ind) return;
  const box = chosen && chosen.offsetParent
    ? `translate(${chosen.offsetLeft}px, ${chosen.offsetTop}px)|${chosen.offsetWidth}|${chosen.offsetHeight}` : '';
  if (ind.dataset.box === box) return;
  ind.dataset.box = box;
  if (!box) { ind.style.opacity = '0'; return; }
  const [transform, w, h] = box.split('|');
  Object.assign(ind.style, {opacity: '1', transform, width: `${w}px`, height: `${h}px`});
}
// A group that cannot sit on one line stacks into a full-width list rather
// than wrapping into ragged rows. Text is measured directly, so the verdict
// does not depend on the current (stacked or inline) layout.
const textRange = document.createRange();
function fit(group) {
  const host = group.parentElement;
  if (!host || !group.offsetParent) return;
  const cs = getComputedStyle(host);
  const room = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  let need = 6, widest = 0;
  const buttons = group.querySelectorAll('button');
  for (const b of buttons) { textRange.selectNodeContents(b); const w = textRange.getBoundingClientRect().width + 30; need += w; widest = Math.max(widest, w); }
  // One row if it fits; else two even columns (four choices); else a list.
  const two = need > room && buttons.length === 4 && widest * 2 + 8 <= room;
  const stacked = need > room && !two;
  if (group.classList.contains('rx-two') !== two) group.classList.toggle('rx-two', two);
  if (group.classList.contains('rx-stacked') !== stacked) group.classList.toggle('rx-stacked', stacked);
}
const sizes = new ResizeObserver(entries => entries.forEach(e => { fit(e.target); placeIndicator(e.target); }));
// The application translates pill labels in place; re-measure once it has.
// (A timer, not a frame callback: frames pause while the language swipe captures.)
onLocaleChange?.(() => setTimeout(() => document.querySelectorAll('.rx-choice').forEach(g => { fit(g); placeIndicator(g); }), 40));
function setAttr(el, name, value) { if (el.getAttribute(name) !== value) el.setAttribute(name, value); }
function syncChoice(select, group) {
  const buttons = [...group.querySelectorAll('button')];
  let focusable = null, relabelled = false;
  buttons.forEach(b => {
    const checked = b.dataset.value === select.value;
    setAttr(b, 'aria-checked', String(checked));
    if (checked) focusable = b;
    const option = [...select.options].find(o => o.value === b.dataset.value);
    const disabled = select.disabled || !!option?.disabled;
    if (b.disabled !== disabled) b.disabled = disabled;
    const text = option?.textContent.trim();
    if (text && b.textContent !== text) { b.textContent = text; relabelled = true; }
  });
  if (relabelled) fit(group);
  focusable ||= buttons[0];
  buttons.forEach(b => { const t = b === focusable ? 0 : -1; if (b.tabIndex !== t) b.tabIndex = t; });
  if (group.classList.contains('is-disabled') !== select.disabled) group.classList.toggle('is-disabled', select.disabled);
  placeIndicator(group);
}
function choose(select, value, origin) {
  if (select.disabled || select.value === value) return;
  const active = document.activeElement, id = select.id;
  select.value = value;
  select.dispatchEvent(new Event('input', {bubbles: true}));
  select.dispatchEvent(new Event('change', {bubbles: true}));
  if (origin) requestAnimationFrame(() => {
    const current = document.getElementById(id);
    if (!current) return;
    // Native mode handlers may rebuild their section and focus the select.
    // Keep the equivalent visible control keyboard-operable after that update,
    // without stealing focus if the person has already moved elsewhere.
    const focus = document.activeElement;
    if (focus && focus !== active && focus !== document.body && focus !== current && focus.isConnected) return;
    scanChoices();
    scanRunBar();
    const group = origin.classList.contains('rx-remote-choice')
      ? document.querySelector(`.rx-remote-choice[data-for="${CSS.escape(id)}"]`) : groups.get(id);
    group?.querySelector('[aria-checked="true"]')?.focus({preventScroll: true});
  });
}
function buildChoice(select, insert = null) {
  if (select.options.length < 2 || select.options.length > 4) return;
  const group = document.createElement('div');
  group.className = 'rx-el rx-choice';
  group.setAttribute('role', 'radiogroup');
  const label = select.labels?.[0];
  if (label) {
    if (!label.id) label.id = `${select.id}-rx-label`;
    group.setAttribute('aria-labelledby', label.id);
  }
  group.dataset.for = select.id;
  group.innerHTML = '<span class="rx-choice-ind" aria-hidden="true"></span>' + [...select.options].map(o => `<button type="button" role="radio" data-value="${o.value.replace(/"/g, '&quot;')}">${o.textContent.trim()}</button>`).join('');
  group.addEventListener('click', e => {
    const b = e.target.closest('button[role="radio"]');
    if (!b || b.disabled) return;
    const target = document.getElementById(group.dataset.for);
    if (target) choose(target, b.dataset.value, group);
  });
  group.addEventListener('keydown', e => {
    const keys = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1};
    if (!(e.key in keys)) return;
    e.preventDefault();
    const buttons = [...group.querySelectorAll('button:not(:disabled)')];
    const at = buttons.indexOf(document.activeElement);
    const next = buttons[(at + keys[e.key] + buttons.length) % buttons.length];
    if (!next) return;
    next.focus();
    const target = document.getElementById(group.dataset.for);
    if (target) choose(target, next.dataset.value, group);
  });
  sizes.observe(group);
  // A second, remote control for the same select (e.g. in the Run bar).
  if (insert) { insert(group); syncChoice(select, group); return group; }
  select.after(group);
  select.classList.add('rx-choice-host');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  groups.set(select.id, group);
  syncChoice(select, group);
  return group;
}
function scanChoices() {
  for (const [id, group] of groups) {
    const select = document.getElementById(id);
    if (!group.isConnected || !select || select.nextElementSibling !== group) { sizes.unobserve(group); group.remove(); groups.delete(id); }
  }
  for (const select of document.querySelectorAll(CHOICES)) {
    if (!select.id) continue;
    const group = groups.get(select.id);
    if (group) syncChoice(select, group); else buildChoice(select);
  }
}
document.addEventListener('change', e => {
  const group = e.target.id && groups.get(e.target.id);
  if (group) syncChoice(e.target, group);
  for (const remote of document.querySelectorAll(`.rx-remote-choice[data-for="${CSS.escape(e.target.id || '')}"]`)) syncChoice(e.target, remote);
}, true);

/* ---------- 3. Growth charts rise into place the first time they are seen ---------- */
const grown = new WeakSet();
const growObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    growObserver.unobserve(entry.target);
    if (reduced() || performance.now() - lastEdit < 700) continue;
    entry.target.querySelectorAll('.approved-growth-bar').forEach((bar, i) => {
      animatePresentation(bar, [{transform: 'scaleY(0)', opacity: .2}, {transform: 'scaleY(1)', opacity: 1}], {duration: 620, delay: i * 38, easing: EASE, fill: 'backwards'});
    });
    entry.target.querySelectorAll('.approved-growth-value').forEach((v, i) => {
      animatePresentation(v, [{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 380, delay: 240 + i * 38, easing: EASE, fill: 'backwards'});
    });
  }
}, {threshold: .35});
function scanCharts() {
  for (const bars of document.querySelectorAll('.approved-growth-bars')) {
    if (grown.has(bars)) continue;
    grown.add(bars);
    bars.style.setProperty('--rx-count', bars.children.length);
    bars.classList.toggle('rx-dense', bars.children.length > 12);
    growObserver.observe(bars);
  }
}


/* ---------- 4. Company search shows what it found ----------
   The application filters #research-company as you type but leaves it blank,
   so matches were invisible. The field becomes a combobox: its list mirrors
   the filtered options, and choosing one selects it in the original <select>
   (a native 'change'), which the application already handles. */
const COPY = {
  en: {hint: 'Type a ticker or name', current: 'Current'},
  'zh-Hans': {hint: '输入代号或名称', current: '当前'}
};
const copy = key => (COPY[getLocale?.()] || COPY.en)[key];
function parseOption(option) {
  const [ticker = '', name = '', ...rest] = option.textContent.split(' · ');
  return {ticker: ticker.trim(), name: name.trim(), status: rest.join(' · ').trim()};
}
function escapeHTML(v) { return String(v).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); }
const catalogFocusRestoring = new WeakSet();
function enhanceCatalog(picker) {
  const input = picker.querySelector('#catalog-search'), select = picker.querySelector('#research-company');
  if (!input || !select) return;
  if (!picker.classList.contains('rx-catalog')) picker.classList.add('rx-catalog');
  setAttr(select, 'tabindex', '-1');
  setAttr(select, 'aria-hidden', 'true');
  const nativeLabel = picker.querySelector('label[for="research-company"]');
  if (nativeLabel) setAttr(nativeLabel, 'aria-hidden', 'true');
  let list = picker.querySelector(':scope > .rx-results');
  if (!list) {
    list = document.createElement('div');
    list.className = 'rx-el rx-results';
    list.id = 'rx-company-results';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    input.after(list);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);
    input.removeAttribute('aria-owns');
    let current = select.value;
    const rows = () => [...list.querySelectorAll('[role="option"]')];
    const activate = row => {
      rows().forEach(r => r.classList.toggle('is-active', r === row));
      if (row) { input.setAttribute('aria-activedescendant', row.id); row.scrollIntoView({block: 'nearest'}); }
      else input.removeAttribute('aria-activedescendant');
    };
    const render = () => {
      const ready = t('directory.ready');
      const options = [...select.options].filter(o => o.value);
      list.innerHTML = options.length ? options.map((o, i) => {
        const {ticker, name, status} = parseOption(o);
        const isReady = status === ready;
        return `<div role="option" id="rx-co-${i}" data-value="${escapeHTML(o.value)}" aria-selected="${o.value === current}" class="${o.value === current ? 'is-current' : ''}">`
          + `<b class="rx-tk">${escapeHTML(ticker)}</b><span class="rx-nm">${escapeHTML(name)}</span>`
          + `<span class="rx-st ${isReady ? 'is-ready' : 'is-pending'}">${escapeHTML(status)}</span></div>`;
      }).join('') : '';
      activate(input.value.trim() ? rows()[0] : list.querySelector('.is-current'));
    };
    const open = () => {
      current = select.value || current;
      render();
      // No matches: the application's own status line already says so.
      if (!list.childElementCount) { close(); return; }
      if (!list.hidden) return;
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      animatePresentation(list, [{opacity: 0, transform: 'translateY(-6px) scale(.985)'}, {opacity: 1, transform: 'none'}], {duration: 240, easing: EASE});
    };
    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
    const pick = row => {
      if (!row) return;
      const priorFocus = document.activeElement;
      close();
      if (select.value !== row.dataset.value || !select.value) {
        if (![...select.options].some(o => o.value === row.dataset.value)) return;
        select.value = row.dataset.value;
        select.dispatchEvent(new Event('change', {bubbles: true}));
      }
      const restoreSearchFocus = () => {
        const currentInput = document.getElementById(input.id);
        const currentSelect = document.getElementById(select.id);
        if (!currentInput) return;
        const focused = document.activeElement;
        if (focused && focused !== priorFocus && focused !== currentInput && focused !== currentSelect && focused !== document.body && focused.isConnected) return;
        const currentPicker = currentInput.closest?.('.catalog-picker') || currentInput.parentElement;
        enhanceCatalog(currentPicker);
        catalogFocusRestoring.add(currentInput);
        try { currentInput.focus({preventScroll: true}); }
        finally { catalogFocusRestoring.delete(currentInput); }
        const currentList = currentPicker.querySelector('.rx-results');
        if (currentList) currentList.hidden = true;
        currentInput.setAttribute('aria-expanded', 'false');
        currentInput.removeAttribute('aria-activedescendant');
      };
      restoreSearchFocus();
      requestAnimationFrame(restoreSearchFocus);
    };
    input.addEventListener('focus', () => { input.placeholder = copy('hint'); if (!catalogFocusRestoring.has(input)) open(); });
    input.addEventListener('blur', () => { input.placeholder = picker.dataset.current || copy('hint'); });
    input.addEventListener('click', open);
    // The application filters on 'input'; render after it has.
    input.addEventListener('input', () => queueMicrotask(open));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (list.hidden) open();
        const all = rows(), at = all.findIndex(r => r.classList.contains('is-active'));
        const step = e.key === 'ArrowDown' ? 1 : -1;
        activate(all[Math.max(0, Math.min(all.length - 1, at + step))]);
      } else if (e.key === 'Enter' && !list.hidden) {
        const all = rows(), at = all.findIndex(r => r.classList.contains('is-active'));
        e.preventDefault(); pick(all[at] || all[0]);
      } else if (e.key === 'Escape' && !list.hidden) {
        e.preventDefault(); close();
      }
    });
    list.addEventListener('pointerdown', e => e.preventDefault());
    list.addEventListener('click', e => pick(e.target.closest('[role="option"]')));
    list.addEventListener('pointermove', e => { const row = e.target.closest('[role="option"]'); if (row && !row.classList.contains('is-active')) activate(row); });
    picker.addEventListener('focusout', e => { if (!picker.contains(e.relatedTarget)) close(); });
  }
  // The field names the company in view; focusing it invites a search.
  const chosen = select.selectedOptions[0];
  if (chosen?.value) { const {ticker, name} = parseOption(chosen), current = `${ticker} · ${name}`; if (picker.dataset.current !== current) picker.dataset.current = current; }
  const text = document.activeElement === input ? copy('hint') : (picker.dataset.current || copy('hint'));
  if (input.placeholder !== text) input.placeholder = text;
}
function scanCatalog() { document.querySelectorAll('.catalog-picker').forEach(enhanceCatalog); }


/* ---------- 5. Simulation: a run button where the result will appear ---------- */
const NOTE_COPY = {en: 'How the simulation works', 'zh-Hans': '模拟方法说明'};
function scanSimulation() {
  for (const lab of document.querySelectorAll('.simulation-lab')) {
    const run = lab.querySelector('.mc-run-button');
    const empty = lab.querySelector('.mc-empty-state:not(.error)');
    if (run && empty && !empty.querySelector('.rx-run-cta')) {
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'rx-el rx-run-cta';
      cta.textContent = run.textContent.trim();
      cta.addEventListener('click', () => {
        const real = lab.querySelector('.mc-run-button');
        if (!real || real.disabled) return;
        // Native Run replaces the placeholder. Move focus before it detaches.
        real.focus({preventScroll: true});
        real.click();
        const cancel = lab.querySelector('[id$="mc-cancel"]');
        if (real.disabled && cancel && !cancel.hidden && !cancel.disabled) cancel.focus({preventScroll: true});
      });
      empty.append(cta);
    }
    const cta = empty?.querySelector('.rx-run-cta');
    if (cta && empty.getAttribute('aria-hidden') === 'true') empty.removeAttribute('aria-hidden');
    if (cta && run) { const label = run.textContent.trim(); if (cta.textContent !== label) cta.textContent = label; if (cta.disabled !== run.disabled) cta.disabled = run.disabled; }
    // The annual intro repeats the scope note word for word.
    const intro = lab.querySelector('.mc-intro'), scope = lab.querySelector('[id$="mc-annual-scope"]');
    const dup = !!scope && !!intro && intro.textContent.trim() === scope.textContent.trim();
    if (intro && intro.classList.contains('rx-dup') !== dup) intro.classList.toggle('rx-dup', dup);
    // Long method notes fold into one disclosure (the nodes move; the
    // application keeps updating them by id).
    const setup = lab.querySelector('.mc-setup');
    const notes = [...(setup?.querySelectorAll(':scope > .mc-assumption-note, :scope > [id$="mc-annual-scope"]') || [])];
    if (setup && notes.length) {
      let fold = setup.querySelector(':scope > .rx-notes');
      if (!fold) {
        fold = document.createElement('details');
        fold.className = 'rx-el rx-notes';
        fold.innerHTML = '<summary></summary>';
        notes[0].before(fold);
      }
      fold.append(...notes);
    }
    const summary = setup?.querySelector(':scope > .rx-notes > summary');
    const label = NOTE_COPY[getLocale?.()] || NOTE_COPY.en;
    if (summary && summary.textContent !== label) summary.textContent = label;
  }
}

// On a phone the result sits below the setup: running brings it into view.
document.addEventListener('click', e => {
  const run = on() && e.target.closest?.('.mc-run-button, .rx-run-cta');
  if (!run || !matchMedia('(max-width: 760px)').matches) return;
  const stage = run.closest('.simulation-lab')?.querySelector('.mc-heading, .mc-output-stage');
  if (stage) requestAnimationFrame(() => stage.scrollIntoView({block: 'start', behavior: reduced() ? 'auto' : 'smooth'}));
});

/* ---------- 6. Tab rows that overflow scroll sideways ---------- */
const tabRows = new WeakSet();
const rowSizes = new ResizeObserver(entries => entries.forEach(e => edgeState(e.target)));
function edgeState(list) {
  const scrolls = list.scrollWidth > list.clientWidth + 1;
  if (list.classList.contains('rx-scrolls') !== scrolls) list.classList.toggle('rx-scrolls', scrolls);
  const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
  if (list.classList.contains('rx-at-end') !== atEnd) list.classList.toggle('rx-at-end', atEnd);
}
function scanTabRows() {
  for (const list of document.querySelectorAll('.mc-setup-tabs, .workspace-view-tabs, .assumption-tabs, .annual-context-tabs')) {
    if (tabRows.has(list)) continue;
    tabRows.add(list);
    rowSizes.observe(list);
    list.addEventListener('scroll', () => edgeState(list), {passive: true});
  }
}


/* ---------- 7. Scenario count sits next to Run ----------
   The count lived on the last setup tab, scrolled out of sight. The Run bar
   gets its own pills for the same select. */
function scanRunBar() {
  for (const lab of document.querySelectorAll('.simulation-lab')) {
    const bar = lab.querySelector('.mc-run-actions'), select = lab.querySelector('select[id$="mc-trials"]');
    if (!bar || !select) continue;
    let wrap = bar.querySelector(':scope > .rx-trials');
    const group = wrap?.querySelector('.rx-remote-choice');
    if (group && group.childElementCount - 1 !== select.options.length) { wrap.remove(); wrap = null; }
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'rx-el rx-trials';
      const caption = document.createElement('span');
      caption.className = 'rx-trials-label';
      caption.id = `${select.id}-rx-bar-label`;
      wrap.append(caption);
      const made = buildChoice(select, g => wrap.append(g));
      if (!made) continue;
      made.classList.add('rx-remote-choice');
      made.setAttribute('aria-labelledby', caption.id);
      bar.append(wrap);
    } else syncChoice(select, wrap.querySelector('.rx-remote-choice'));
    const text = select.labels?.[0]?.querySelector('span')?.textContent.trim() || 'Scenarios';
    const caption = wrap.querySelector('.rx-trials-label');
    if (caption.textContent !== text) caption.textContent = text;
  }
}


/* ---------- 8. Switching language swipes the page across ----------
   The application's own locale button still does the switching; this only
   wraps that click in a view transition. The old page is pushed right and
   wiped away behind an accent edge while the translated page settles in. */
const SWIPE_MS = 680;
document.addEventListener('click', e => {
  const button = e.target.closest?.('#locale-corner');
  if (!button || !on() || reduced() || document.hidden || typeof document.startViewTransition !== 'function' || typeof button.onclick !== 'function') return;
  if (root.hasAttribute('data-locale-swipe')) { e.stopImmediatePropagation(); return; }
  e.stopImmediatePropagation();
  const swap = button.onclick;
  root.setAttribute('data-locale-swipe', '');
  let edge, finished = false;
  const done = () => { if (finished) return; finished = true; root.removeAttribute('data-locale-swipe'); edge?.remove(); activeLocaleTransition = null; };
  try {
    const vt = document.startViewTransition(async () => {
      swap.call(button, e);
      // Let observers that localize asynchronously finish before the capture
      // (a timer: frame callbacks are paused while the old page is captured).
      await new Promise(r => setTimeout(r, 60));
    });
    activeLocaleTransition = vt;
    vt.ready.then(() => {
      if (finished || reduced() || document.hidden) return;
      // The edge lives in the new (live) page, so it shows exactly where the
      // old page has already been wiped away.
      edge = document.createElement('div');
      edge.className = 'rx-el rx-swipe-edge';
      edge.setAttribute('aria-hidden', 'true');
      document.body.append(edge);
      // Same easing and travel as the outgoing page's clip edge (width + its 48px push).
      animatePresentation(edge, [{transform: 'translateX(0)', opacity: 1}, {opacity: 1, offset: .82}, {transform: `translateX(${innerWidth + 48}px)`, opacity: 0}], {duration: SWIPE_MS, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards'});
    }, done);
    vt.finished.then(done, done);
    setTimeout(done, SWIPE_MS + 1500);
  } catch { done(); swap.call(button, e); }
}, true);

/* ---------- scan ---------- */
let queued = false;
function scan() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    if (!on()) return;
    rememberTabs();
    scanChoices();
    scanCharts();
    scanCatalog();
    scanSimulation();
    scanTabRows();
    scanRunBar();
    for (const step of extra) step();
  });
}
const extra = [];
export function onScan(fn) { extra.push(fn); scan(); }
new MutationObserver(scan).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'class']});
scan();
