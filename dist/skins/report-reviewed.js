// Annual Report · reviewed company models, presented like the original Guided cases.
//
// A reviewed model is a full company-specific annual case. Guided shows it in six
// steps; this layer gives those steps the same page as an original Guided case:
// the company and its value card side by side, numbered step tabs on the editor,
// the same step headings, and the same "next step" card.
//
// Presentation only. Every number is the reviewed case's own. The step tabs are
// moved as they are, with their handlers; the next-step card clicks the app's
// own Back and Next. Everything else added here is a label or a toggle, removed
// as soon as the case leaves Guided.
import {getLocale} from '../i18n.js';

const COPY = {
  en: {
    e: ['Step 1 of 6 · The story', 'Step 2 of 6 · Value driver · Growth', 'Step 3 of 6 · Value driver · Profitability',
      'Step 4 of 6 · Value driver · Reinvestment', 'Step 5 of 6 · Value driver · Risk', 'Step 6 of 6 · From operating value to equity'],
    h: ['What makes this business work?', 'Build a growth story.', 'Turn revenue into profit.',
      'What will growth cost?', 'What does the long run look like?', 'What belongs to common shareholders?'],
    lead: ['A useful model begins with a testable story.', 'Start with the company’s track record. Make your own forward-looking case.',
      'Operating margin and cash taxes determine earnings before reinvestment.', 'Growth creates value only when it earns enough on the capital it consumes.',
      'Keep risk, currency and the economics of mature growth consistent.', 'Operating value becomes equity only after accounting for assets and other claims.'],
    next: 'Next · Step {n} of 6', back: '← Back to {name}',
    done: 'Your valuation is ready', doneLead: 'See how the cash flows add up to value, then test how wide the range of outcomes is.',
    seeForecast: 'See how the value adds up →', seeRange: 'Test the range',
    base: 'Base period {p}', baseLabel: 'Base period', origin: 'Valued as of {d}', sources: 'Research & sources ↗',
    latest: 'Newer filing {d} · reference only',
    kind: 'Reviewed company model · dated conditional study', limits: 'Value & limitations',
    scope: 'Scope & limitations', shared: 'Edits here and in Year-by-year change the same case.'
  },
  'zh-Hans': {
    e: ['第 1 步，共 6 步 · 投资论述', '第 2 步，共 6 步 · 价值驱动因素 · 成长', '第 3 步，共 6 步 · 价值驱动因素 · 获利能力',
      '第 4 步，共 6 步 · 价值驱动因素 · 再投资', '第 5 步，共 6 步 · 价值驱动因素 · 风险', '第 6 步，共 6 步 · 从营业价值到股权价值'],
    h: ['这家公司如何创造收入？', '建立成长论述。', '让营收转化为获利。', '成长需要多少成本？', '长期情境会如何发展？', '哪些价值属于普通股股东？'],
    lead: ['实用的模型始于可检验的投资论述。', '从公司的过往纪录出发，建立自己的前瞻情境。', '营业利润率与现金税负决定再投资前的获利。',
      '只有当成长对投入资本赚取足够报酬时，才会创造价值。', '让风险、币别及成熟期成长的经济假设保持一致。', '营业价值需计入资产及其他索偿权后，才能转为股权价值。'],
    next: '下一步 · 第 {n} 步，共 6 步', back: '← 返回{name}',
    done: '估值已完成', doneLead: '看看现金流量如何累加成价值，再检验结果的区间有多宽。',
    seeForecast: '查看价值如何累加 →', seeRange: '检验估值区间',
    base: '基期 {p}', baseLabel: '基期', origin: '估值基准日 {d}', sources: '研究与来源 ↗',
    latest: '较新财报 {d} · 仅供参考',
    kind: '已审阅公司模型 · 注明日期的条件式研究', limits: '价值与限制',
    scope: '范围与限制', shared: '在这里或逐年模型中的修改，都会改动同一个案例。'
  }
};
const copy = (key, vars = {}) => {
  const table = COPY[getLocale?.()] || COPY.en;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), table[key]);
};
const STEPS = ['story', 'growth', 'profitability', 'investment', 'risk', 'equity'];
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const setText = (n, t) => { if (n && n.textContent !== t) n.textContent = t; };
const setAttr = (n, k, v) => { if (n && n.getAttribute(k) !== v) n.setAttribute(k, v); };

// The scope notes fold away under the card; the choice holds while the page is open.
let scopeOpen = false;

const day = iso => new Intl.DateTimeFormat(getLocale?.() === 'zh-Hans' ? 'zh-CN' : 'en-US', {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(iso + 'T00:00:00Z'));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function stepIndex(root) { return Math.max(0, STEPS.indexOf(root.getAttribute('data-guided-step') || 'story')); }

// ---------- the company and its dates, beside the value card ----------
function head(root, main) {
  let box = main.querySelector(':scope > .rx-rv-head');
  if (!box) {
    box = el('div', 'rx-rv-head');
    box.innerHTML = '<div class="approved-company-name"><h2></h2><span></span></div>'
      + '<div class="rx-rv-line"><span class="rx-rv-period"></span><span class="rx-rv-origin"></span><button type="button" class="text-button rx-rv-latest" hidden></button><a class="rx-rv-src" target="_blank" rel="noopener"></a></div>'
      + '<div class="rx-rv-line"><span class="rx-rv-kind"></span><button type="button" class="text-button rx-rv-limits"></button></div>';
    box.querySelector('.rx-rv-limits').addEventListener('click', () => {
      [...root.querySelectorAll('#research-results .annual-summary-equity button')].pop()?.click();
    });
    // A newer filing than the valuation date is shown as dated evidence in the card's notes.
    box.querySelector('.rx-rv-latest').addEventListener('click', () => {
      scopeOpen = true; card(root);
      const note = root.querySelector('#research-results .latest-quarter-evidence');
      if (!note) return;
      note.open = true;
      note.scrollIntoView({block: 'start', behavior: reduced() ? 'auto' : 'smooth'});
    });
    main.prepend(box);
  }
  const option = document.querySelector('#guided-company-directory')?.selectedOptions?.[0];
  const ticker = option?.value || '';
  const name = option ? option.textContent.split(' · ').slice(1).join(' · ').trim() : '';
  setText(box.querySelector('h2'), name || ticker);
  setText(box.querySelector('.approved-company-name > span'), ticker);
  const period = root.querySelector('.toolbar-period');
  const parts = [period?.querySelector('b')?.textContent.trim(), period?.querySelector('small')?.textContent.trim()].filter(Boolean);
  // The forecast grows from the base period; cash, debt and shares are taken at the valuation date.
  const zh = getLocale?.() === 'zh-Hans';
  if (zh && parts[0]) parts[0] = parts[0].replace(/^FY(\d{4})$/, '$1 财年');
  setText(box.querySelector('.rx-rv-period'), parts.length ? copy('base', {p: parts.join(' · ')}) : '');
  setText(period?.querySelector(':scope > span'), copy('baseLabel'));
  const time = root.querySelector('#research-results .research-date-line time');
  const valued = (time?.getAttribute('datetime') || '').slice(0, 10);
  setText(box.querySelector('.rx-rv-origin'), time ? copy('origin', {d: /^\d{4}-\d{2}-\d{2}$/.test(valued) ? day(valued) : time.textContent.trim()}) : '');
  const latest = box.querySelector('.rx-rv-latest');
  const filed = root.querySelector('#research-results .latest-quarter-evidence summary')?.textContent.match(/(\d{4}-\d{2}-\d{2})\s*$/)?.[1];
  const newer = filed && filed > valued;
  latest.hidden = !newer;
  if (newer) setText(latest, copy('latest', {d: day(filed)}));
  const link = root.querySelector('.guided-reviewed-context a[href]');
  const src = box.querySelector('.rx-rv-src');
  src.hidden = !link;
  if (link) { setAttr(src, 'href', link.getAttribute('href')); setText(src, copy('sources')); }
  setText(box.querySelector('.rx-rv-kind'), copy('kind'));
  const limits = box.querySelector('.rx-rv-limits');
  limits.hidden = !root.querySelector('#research-results .annual-summary-equity button');
  setText(limits, copy('limits'));
}

// ---------- the value card: figures on top, the dated notes folded beneath ----------
function card(root) {
  const results = root.querySelector('#research-results');
  if (!results) return;
  const notes = [...results.children].filter(n => !n.matches('.annual-summary-values, .rx-rv-fold'));
  results.toggleAttribute('data-rx-rv-open', scopeOpen);
  let fold = results.querySelector(':scope > .rx-rv-fold');
  if (!notes.length) { fold?.remove(); return; }
  if (!fold) {
    fold = el('button', 'rx-rv-fold'); fold.type = 'button';
    fold.addEventListener('click', () => { scopeOpen = !scopeOpen; card(root); });
  }
  // The toggle sits directly under the figures, ahead of the notes it opens.
  const values = results.querySelector(':scope > .annual-summary-values');
  if (values && fold.previousElementSibling !== values) values.after(fold);
  setText(fold, copy('scope'));
  setAttr(fold, 'aria-expanded', String(scopeOpen));
}

// ---------- step tabs on the editor, with the same heading as the original steps ----------
function steps(root) {
  const editor = root.querySelector('#research-editor');
  const nav = root.querySelector('.guided-reviewed-nav');
  if (!editor || !nav) return;
  if (nav.parentElement !== editor || editor.firstElementChild !== nav) editor.prepend(nav);
  for (const [i, button] of nav.querySelectorAll('[data-review-step]').entries()) setAttr(button, 'data-step', String(i + 1));
  const context = editor.querySelector('.guided-reviewed-context');
  if (!context) return;
  const i = stepIndex(root);
  const eyebrow = context.querySelector(':scope > .eyebrow');
  setText(eyebrow, copy('e')[i]);
  const h2 = context.querySelector(':scope > h2');
  setText(h2, copy('h')[i]);
  let lead = context.querySelector(':scope > .rx-rv-lead');
  if (!lead && h2) { lead = el('p', 'rx-rv-lead'); h2.after(lead); }
  setText(lead, copy('lead')[i]);
  let shared = context.querySelector(':scope > .rx-rv-shared');
  if (!shared && i === 0) { shared = el('p', 'rx-rv-shared'); context.append(shared); }
  if (shared) { shared.hidden = i !== 0; setText(shared, copy('shared')); }
}

// ---------- the next-step card, as on the original steps ----------
function next(root) {
  const editor = root.querySelector('#research-editor');
  const footer = editor?.querySelector('.guided-reviewed-footer');
  if (!footer) return;
  const i = stepIndex(root);
  let box = editor.querySelector(':scope > .rx-next.rx-rv-next');
  if (box && (box.previousElementSibling !== footer || box.dataset.step !== String(i))) { box.remove(); box = null; }
  if (!box) {
    box = el('div', 'rx-next rx-rv-next'); box.dataset.step = String(i);
    box.setAttribute('role', 'navigation');
    if (i < 5) {
      const go = el('button', 'rx-next-go'); go.type = 'button';
      go.append(el('span', 'rx-next-kicker'), el('span', 'rx-next-title'), el('span', 'rx-next-arrow', '→'));
      go.querySelector('.rx-next-arrow').setAttribute('aria-hidden', 'true');
      go.addEventListener('click', () => footer.querySelector('[data-review-next]')?.click());
      box.append(go);
    } else {
      const done = el('div', 'rx-next-done');
      done.append(el('b'), el('p'));
      const actions = el('div', 'rx-next-actions');
      const forecast = el('button', 'rx-next-primary'); forecast.type = 'button';
      forecast.addEventListener('click', () => footer.querySelector('[data-review-next]')?.click());
      const range = el('button', 'rx-next-secondary'); range.type = 'button';
      range.addEventListener('click', () => root.querySelector('#annual-view-simulation')?.click());
      actions.append(forecast, range); done.append(actions); box.append(done);
    }
    if (i > 0) {
      const back = el('button', 'rx-next-back'); back.type = 'button';
      back.addEventListener('click', () => footer.querySelector('[data-review-back]')?.click());
      box.append(back);
    }
    footer.after(box);
  }
  const tab = n => root.querySelector(`#guided-reviewed-${STEPS[n]}`)?.textContent.replace(/^\s*\d+\s*/, '').trim() || '';
  setAttr(box, 'aria-label', copy('next', {n: Math.min(i + 2, 6)}));
  if (i < 5) {
    setText(box.querySelector('.rx-next-kicker'), copy('next', {n: i + 2}) + ' · ' + tab(i + 1));
    setText(box.querySelector('.rx-next-title'), copy('h')[i + 1]);
  } else {
    setText(box.querySelector('.rx-next-done > b'), copy('done'));
    setText(box.querySelector('.rx-next-done > p'), copy('doneLead'));
    setText(box.querySelector('.rx-next-primary'), copy('seeForecast'));
    setText(box.querySelector('.rx-next-secondary'), copy('seeRange'));
  }
  setText(box.querySelector('.rx-next-back'), i > 0 ? copy('back', {name: tab(i - 1)}) : '');
}

// Outside Guided the same workspace is the Year-by-year page, so nothing added here stays.
function clear(root) {
  root.querySelector('.workspace-main > .rx-rv-head')?.remove();
  root.querySelector('#research-results > .rx-rv-fold')?.remove();
  root.querySelector('#research-results')?.removeAttribute('data-rx-rv-open');
  root.querySelector('#research-editor > .rx-rv-next')?.remove();
}


// ---------- the company finder: one search field and one list, as on Year-by-year ----------
// Every company is either ready to value or still in research; how its case was
// built is the page's business, not the list's.
const FIND = {
  en: {ready: 'Ready to value', pending: 'In progress', none: 'No matching company.', hint: 'Type a ticker or name'},
  'zh-Hans': {ready: '可估值', pending: '研究中', none: '没有匹配公司。', hint: '输入代号或名称'}
};
const find = key => (FIND[getLocale?.()] || FIND.en)[key];
const PENDING = /^(Research pending|研究待完成)$/;
const esc = v => String(v).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
let refocus = false;

function finder() {
  const box = document.querySelector('.guided-company-directory');
  const input = box?.querySelector('#guided-company-search'), select = box?.querySelector('#guided-company-directory');
  if (!input || !select) return;
  if (!box.classList.contains('rx-gdir')) box.classList.add('rx-gdir');
  // With the search empty the select holds every company, so its choice is the company in view.
  if (!input.value.trim() && select.value) {
    const name = select.selectedOptions[0]?.textContent.trim() || '';
    if (box.dataset.rxCurrent !== name) box.dataset.rxCurrent = name;
    if (box.dataset.rxValue !== select.value) box.dataset.rxValue = select.value;
  }
  setAttr(select, 'tabindex', '-1');
  setAttr(select, 'aria-hidden', 'true');
  setAttr(box.querySelector('label[for="guided-company-directory"]'), 'aria-hidden', 'true');
  if (!input.__rxFinder) {
    input.__rxFinder = true;
    const list = el('div', 'rx-el rx-results'); list.id = 'rx-guided-results'; list.setAttribute('role', 'listbox'); list.hidden = true;
    input.after(list);
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', list.id);
    const rows = () => [...list.querySelectorAll('[role="option"]')];
    const activate = row => {
      rows().forEach(r => r.classList.toggle('is-active', r === row));
      if (row) { input.setAttribute('aria-activedescendant', row.id); row.scrollIntoView({block: 'nearest'}); }
      else input.removeAttribute('aria-activedescendant');
    };
    const render = () => {
      const current = box.dataset.rxValue;
      // Ready companies first, then those in progress; each group A–Z by ticker.
      const isPending = o => PENDING.test(o.parentElement?.label || '');
      const options = [...select.querySelectorAll('option')].filter(o => o.value)
        .sort((a, b) => isPending(a) - isPending(b) || a.textContent.localeCompare(b.textContent, 'en'));
      list.innerHTML = options.length ? options.map((o, i) => {
        const pending = isPending(o);
        const [ticker = '', ...rest] = o.textContent.split(' · ');
        return `<div role="option" id="rx-gco-${i}" data-value="${esc(o.value)}" aria-selected="${o.value === current}" class="${o.value === current ? 'is-current' : ''}">`
          + `<b class="rx-tk">${esc(ticker.trim())}</b><span class="rx-nm">${esc(rest.join(' · ').trim())}</span>`
          + `<span class="rx-st ${pending ? 'is-pending' : 'is-ready'}">${esc(find(pending ? 'pending' : 'ready'))}</span></div>`;
      }).join('') : `<p class="rx-none">${esc(find('none'))}</p>`;
      activate(input.value.trim() ? rows()[0] : list.querySelector('.is-current'));
    };
    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
    const open = () => {
      render();
      if (!list.hidden) return;
      list.hidden = false; input.setAttribute('aria-expanded', 'true');
      if (!reduced()) list.animate([{opacity: 0, transform: 'translateY(-6px) scale(.985)'}, {opacity: 1, transform: 'none'}], {duration: 240, easing: 'cubic-bezier(.2, .8, .2, 1)'});
    };
    const pick = row => {
      if (!row) return;
      close();
      input.value = '';
      // Choosing re-renders the finder; its new field keeps the focus without reopening.
      refocus = document.activeElement === input;
      select.value = row.dataset.value;
      select.dispatchEvent(new Event('change', {bubbles: true}));
    };
    input.addEventListener('focus', () => { input.placeholder = find('hint'); if (refocus) { refocus = false; return; } open(); });
    input.addEventListener('blur', () => { input.placeholder = box.dataset.rxCurrent || find('hint'); });
    input.addEventListener('click', open);
    // The application filters the select on 'input'; the list follows once it has.
    input.addEventListener('input', () => queueMicrotask(open));
    // Captured on the finder, so the field's own Enter handler never runs on a stale choice.
    box.addEventListener('keydown', e => {
      if (e.target !== input) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        if (list.hidden) open();
        const all = rows(), at = all.findIndex(r => r.classList.contains('is-active'));
        activate(all[Math.max(0, Math.min(all.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))]);
      } else if (e.key === 'Enter') {
        e.preventDefault(); e.stopPropagation();
        const all = rows();
        pick(all.find(r => r.classList.contains('is-active')) || all[0]);
      } else if (e.key === 'Escape' && !list.hidden) {
        e.preventDefault(); e.stopPropagation(); close();
      }
    }, true);
    list.addEventListener('pointerdown', e => e.preventDefault());
    list.addEventListener('click', e => pick(e.target.closest('[role="option"]')));
    list.addEventListener('pointermove', e => { const row = e.target.closest('[role="option"]'); if (row && !row.classList.contains('is-active')) activate(row); });
    box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) close(); });
    if (refocus) input.focus({preventScroll: true});
  }
  const text = document.activeElement === input ? find('hint') : (box.dataset.rxCurrent || find('hint'));
  if (input.placeholder !== text) input.placeholder = text;
  place(box);
}

// On wide screens the finder sits at the start of the toolbar row, as on Year-by-year.
// The toolbars re-render with their pages, so the finder is laid over the row
// rather than moved into it.
let placed = null;
const wide = matchMedia('(min-width: 761px)');
const sizes = new ResizeObserver(() => position());
function place(box) {
  const page = box.parentElement;
  const bar = [...page.querySelectorAll('#guided-app .guided-screen > .workspace-toolbar, #guided-reviewed-host .annual-workspace > .research-toolbar')].find(b => !b.closest('[hidden]'));
  const inline = wide.matches && !!bar;
  page.classList.toggle('rx-gdir-inline', inline);
  if (bar && !bar.classList.contains('rx-gdir-bar')) bar.classList.add('rx-gdir-bar');
  if (placed?.bar === bar && placed.inline === inline) return;
  sizes.disconnect();
  placed = {box, bar, page, inline};
  if (bar) { sizes.observe(bar); sizes.observe(page); }
  position();
}
function position() {
  const {box, bar, page, inline} = placed || {};
  if (!box) return;
  if (!inline || !bar?.isConnected) { box.style.removeProperty('top'); box.style.removeProperty('left'); return; }
  const p = page.getBoundingClientRect(), b = bar.getBoundingClientRect();
  // The field's bottom edge meets the row's other controls.
  const top = Math.round(b.bottom - p.top - parseFloat(getComputedStyle(bar).paddingBottom) - box.offsetHeight) + 'px';
  const left = Math.round(b.left - p.left) + 'px';
  if (box.style.top !== top) box.style.top = top;
  if (box.style.left !== left) box.style.left = left;
}
wide.addEventListener('change', () => { placed = null; finder(); });

// ---------- original cases: a base period is a full year ----------
// Year-to-date flows are not a year, and the model withholds a value on them, so the
// period choice offers the last full year or the trailing twelve months. A saved
// draft that still uses year-to-date keeps its choice.
const PART_YEAR = /YTD|年初至今/;
function periods() {
  const select = document.querySelector('#guided-app #current-snapshot');
  if (!select) return;
  for (const o of [...select.options]) if (!o.selected && PART_YEAR.test(o.textContent)) o.remove();
}

let queued = false;
function scan() {
  queued = false;
  finder();
  periods();
  // The review marks the app container; the workspace inside it is the same one Year-by-year shows.
  for (const shell of document.querySelectorAll('.annual-workspace')) {
    const main = shell.querySelector(':scope > .workspace-main');
    if (!main) continue;
    const root = shell.parentElement;
    if (!root?.hasAttribute('data-guided-review')) { clear(shell); continue; }
    head(root, main);
    card(root);
    steps(root);
    next(root);
  }
}
// Mutation callbacks run before the next paint, so a re-rendered step never shows unarranged.
new MutationObserver(() => { if (!queued) { queued = true; queueMicrotask(scan); } })
  .observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-guided-review', 'data-guided-step']});
scan();
