// Annual Report · path charts for revenue growth, operating margin and capital efficiency.
// Presentation only. The guided model publishes the modeled per-year path on
// each section (data-path, data-start, data-mature, data-set-years); this draws
// it as one bar per year, with the two ends of the path spelled out the same
// way in all three tabs: where it starts and where it settles, and which of the two
// the headline slider controls.
//
// Bars for the years you set can be dragged (or moved with the arrow keys).
// Each move writes that year's original field and fires its native 'input'
// event, so validation, drafts, Undo and the model behave exactly as if the
// number had been typed. Clicking a later year sets every year up to it.
import {onScan, animatePresentation} from './report-ux.js';
import {getLocale} from '../i18n.js';

const COPY = {
  en: {
    starts: 'Starts at', settles: 'Settles at', slider: 'Slider above',
    today: 'Today · normalized EBIT margin', year1: 'Year 1',
    fromYear: 'From year {n}', beyond: 'After the forecast',
    viaRoic: 'implied by {roic} terminal ROIC', mature: 'Mature', terminal: 'Terminal', stable: 'Stable',
    stableGrowth: 'stable growth', growthStart: 'Year 1 · revenue growth',
    yours: 'Years you set', drag: 'Drag a bar to set that year. Click a later year to set it too.',
    click: 'Click any year to set each year up to it yourself.', set: 'Set', year: 'Year {n}',
    group: 'Yearly path. Bars for years you set are adjustable.', jump: 'Go to the slider above',
    inRisk: 'Set in Risk →', jumpRisk: 'Open the Risk step at this assumption'
  },
  'zh-Hans': {
    starts: '起点', settles: '终点', slider: '上方滑杆',
    today: '目前 · 正常化 EBIT 利益率', year1: '第 1 年',
    fromYear: '自第 {n} 年起', beyond: '预测期之后',
    viaRoic: '由终期 ROIC {roic} 推得', mature: '成熟', terminal: '终期', stable: '稳定',
    stableGrowth: '稳定成长率', growthStart: '第 1 年 · 营收成长率',
    yours: '你设定的年度', drag: '拖动长条即可设定该年度；点按后面的年度也可一并设定。',
    click: '点按任一年度，即可逐年设定至该年度。', set: '设定', year: '第 {n} 年',
    group: '逐年路径。你设定的年度长条可以调整。', jump: '前往上方滑杆',
    inRisk: '于风险页设定 →', jumpRisk: '前往风险步骤中的这项假设'
  }
};
const copy = (key, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), (COPY[getLocale?.()] || COPY.en)[key]);
const finite = Number.isFinite;
const num = el => { const v = Number(el?.value); return el && el.value.trim() !== '' && finite(v) ? v : NaN; };
const round = (v, step) => Math.round(v / step) * step;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Kind = what the bars measure, where its fields live, and how a value is
   shown and typed. Margin and capital set years inside their own section;
   growth's year 1 is the headline input and later years come from "Set each
   year's growth", capped at five by the growth model. */
const yearField = name => (section, year) => section.querySelector(`input[data-${name}-year="${year}"]`);
const percent = {label: v => `${Number((v * 100).toFixed(1))}%`, toInput: v => String(Number((v * 100).toFixed(2))), fromInput: v => v / 100};
const KINDS = {
  growth: {
    ...percent,
    section: '.growth-path-controls',
    scope: '#editor-group-2',
    headline: '#g-growth',
    settleIsSlider: false,
    maxSet: 5,
    minTop: .05,
    endLabel: 'stable',
    settleLink: {tab: '#group-5', input: '#g-terminalGrowth'},
    field: (section, year) => document.querySelector(year === 1 ? '#editor-group-2 #g-growth' : `#editor-group-2 #growth-year-${year}`),
    yearly: () => true,
    place: (section, el) => section.closest('#editor-group-2')?.querySelector('#approved-growth-path')?.before(el),
    step: (fine) => fine ? .001 : .005,
    limits: [-.5, 2]
  },
  margin: {
    ...percent,
    maxSet: 15,
    minTop: .05,
    endLabel: 'mature',
    field: yearField('margin'),
    section: '.margin-phase-controls',
    scope: '#editor-group-3',
    headline: '#g-targetMargin',
    settleIsSlider: true,
    step: (fine) => fine ? .001 : .005,
    limits: [-.5, 1]
  },
  capital: {
    section: '.capital-phase-controls',
    scope: '#editor-group-4',
    headline: '#g-salesCapital',
    settleIsSlider: false,
    maxSet: 15,
    minTop: .5,
    endLabel: 'terminal',
    settleLink: {tab: '#group-5', input: '#g-terminalROIC'},
    field: yearField('capital'),
    label: v => `${Number(v.toFixed(2))}×`,
    toInput: v => String(Number(v.toFixed(2))),
    fromInput: v => v,
    step: (fine) => fine ? .01 : .05,
    limits: [.05, 100]
  }
};

const charts = new WeakMap();   // section -> state
const observed = new WeakSet();
let activeDrag = null;
document.addEventListener('pointermove', e => activeDrag?.move(e));
document.addEventListener('pointerup', e => activeDrag?.end(e));
document.addEventListener('pointercancel', e => activeDrag?.end(e));
// A phase band drag keeps the calendar fixed; when it ends, take the new span.
document.addEventListener('pointerup', () => requestAnimationFrame(paintAll));

const attrsObserver = new MutationObserver(records => {
  const seen = new Set();
  for (const r of records) if (!seen.has(r.target)) { seen.add(r.target); charts.has(r.target) ? paint(r.target) : scan(); }
});

function read(section, kind) {
  let path = [];
  try { path = JSON.parse(section.dataset.path || '[]'); } catch { path = []; }
  // A marker drag on the phase band previews a new count before it commits.
  const setYears = Number(section.dataset.previewSetYears) || Number(section.dataset.setYears) || 0;
  const yearly = (kind.yearly ? kind.yearly(section) : section.dataset.pathMode === 'yearly') && setYears > 0;
  // Set years read their own fields, so a drag paints before the model reruns.
  const values = path.map((v, i) => {
    if (!yearly || i >= setYears) return v;
    const live = num(kind.field(section, i + 1));
    return finite(live) ? kind.fromInput(live) : v;
  });
  const terminalField = section.querySelector(`input[data-${kind.name}-control="terminalYear"]`);
  return {values, yearly, setYears: yearly ? setYears : 0, start: Number(section.dataset.start), mature: Number(section.dataset.mature), roic: Number(section.dataset.roic), terminal: num(terminalField)};
}

// Year a path stays settled from: first year after which it holds the mature value.
function settleYear(values, mature) {
  if (!finite(mature) || !values.length) return NaN;
  const near = v => finite(v) && Math.abs(v - mature) <= Math.max(1e-6, Math.abs(mature) * 1e-4);
  if (!near(values.at(-1))) return NaN;
  let year = values.length;
  while (year > 1 && near(values[year - 2])) year--;
  return year;
}

function build(section, kind) {
  const el = document.createElement('div');
  el.className = 'rx-el rx-path';
  el.dataset.kind = kind.name;
  el.innerHTML = `<div class="rx-path-ends">
    <div class="rx-path-end is-start"><span class="rx-pe-k"></span><b></b><small></small></div>
    <i class="rx-path-arrow" aria-hidden="true"></i>
    <div class="rx-path-end is-settle"><span class="rx-pe-k"></span><b></b><small></small></div>
  </div>
  <div class="rx-path-plot" role="group"><div class="rx-pp-mature" aria-hidden="true"><span></span></div><div class="rx-pp-cols"></div></div>
  <p class="rx-path-hint"></p>`;
  const state = {el, kind, section, span: 10, domain: [0, 1], drag: null, key: ''};
  charts.set(section, state);
  const plot = el.querySelector('.rx-path-plot');

  // An end card tagged "Slider above" takes you to that slider.
  el.querySelector('.rx-path-ends').addEventListener('click', e => {
    const card = e.target.closest('.rx-path-end.is-slider, .rx-path-end.is-link');
    if (!card) return;
    // A settle value owned by another step opens that step at its slider.
    if (card.classList.contains('is-link')) document.querySelector(kind.settleLink.tab)?.click();
    const selector = card.classList.contains('is-link') ? kind.settleLink.input : kind.headline;
    const input = document.querySelector(`${kind.scope} ${selector}`) || document.querySelector(selector);
    const row = input?.closest('.driver-card, .driver-top') || input;
    row?.scrollIntoView({block: 'center', behavior: reduced() ? 'auto' : 'smooth'});
    input?.focus({preventScroll: true});
    if (row) animatePresentation(row, [{backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)'}, {backgroundColor: 'transparent'}], {duration: 1100, easing: 'ease-out'});
  });

  const yearAt = (x, rect) => Math.max(1, Math.min(state.span, Math.ceil(((x - rect.left) / rect.width) * state.span)));
  const valueAt = (y, rect, fine) => {
    const [lo, hi] = state.drag?.domain || state.domain;
    const v = hi - ((y - rect.top) / rect.height) * (hi - lo);
    return Math.max(kind.limits[0], Math.min(kind.limits[1], round(v, kind.step(fine))));
  };
  const field = year => kind.field(state.section, year);
  // While dragging, the bar follows every frame but the model reruns at most
  // every ~90ms (and once more on release), so the page never stalls under you.
  const flush = () => {
    clearTimeout(state.timer);
    state.timer = 0;
    const input = state.pending;
    state.pending = null;
    if (input?.isConnected) input.dispatchEvent(new Event('input', {bubbles: true}));
  };
  state.flush = flush;
  const setValue = (year, value, later = false) => {
    const input = field(year);
    if (!input || input.disabled || input.readOnly) return;
    const text = kind.toInput(value);
    if (input.value === text) return;
    input.value = text;
    paint(state.section);
    if (state.pending && state.pending !== input) flush();
    state.pending = input;
    if (!later) flush();
    else if (!state.timer) state.timer = setTimeout(flush, 90);
  };

  plot.addEventListener('pointerdown', e => {
    if (e.button !== 0 || plot.closest('.rx-path.is-invalid')) return;
    const rect = plot.getBoundingClientRect(), year = yearAt(e.clientX, rect), {setYears} = read(state.section, kind);
    if (e.pointerType !== 'touch') e.preventDefault();
    // On touch the page must still scroll through the chart: only a knob drags.
    if (e.pointerType === 'touch' && year <= setYears && !e.target.closest('.rx-pp-knob')) return;
    if (year <= setYears) {
      activeDrag?.end();
      const capture = typeof document.documentElement?.setPointerCapture === 'function' ? document.documentElement : plot;
      capture.setPointerCapture(e.pointerId);
      // The scale holds still while you drag; pulling past the top keeps going.
      // Grabbing the knob moves the value relative to where you took hold;
      // pressing elsewhere in the column sets it to that height at once.
      const onKnob = !!e.target.closest('.rx-pp-knob'), current = read(state.section, kind).values[year - 1];
      state.drag = {year, rect, pointerId: e.pointerId, capture, domain: state.domain, y: e.clientY, offset: onKnob && finite(current) ? valueAt(e.clientY, rect, true) - current : 0, moved: !onKnob};
      activeDrag = state;
      el.classList.add('is-dragging');
      plot.querySelector(`.rx-pp-col[data-year="${year}"] .rx-pp-knob`)?.focus({preventScroll: true});
      if (!onKnob) setValue(year, valueAt(e.clientY, rect, e.shiftKey), true);
    } else {
      state.press = {year, x: e.clientX, y: e.clientY};
    }
  });
  plot.addEventListener('click', e => {
    const press = state.press;
    state.press = null;
    if (!press || Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) return;
    if (press.year <= kind.maxSet) extendTo(state.section, kind, press.year);
  });
  state.move = e => {
    const d = state.drag;
    if (!d || e.pointerId != null && e.pointerId !== d.pointerId) return;
    if (!state.section.isConnected) { state.end(); return; }
    if (!d.moved && Math.abs(e.clientY - d.y) < 3) return;
    d.moved = true;
    const step = kind.step(e.shiftKey);
    setValue(d.year, Math.max(kind.limits[0], Math.min(kind.limits[1], round(valueAt(e.clientY, d.rect, true) - d.offset, step))), true);
  };
  state.end = e => {
    const d = state.drag;
    if (!d || e?.pointerId != null && e.pointerId !== d.pointerId) return;
    state.drag = null;
    if (activeDrag === state) activeDrag = null;
    if (d.capture.hasPointerCapture?.(d.pointerId)) d.capture.releasePointerCapture(d.pointerId);
    el.classList.remove('is-dragging');
    flush();
    field(d.year)?.dispatchEvent(new Event('change', {bubbles: true}));
    paint(state.section);   // the scale settles once you let go
  };

  el.addEventListener('keydown', e => {
    const knob = e.target.closest('.rx-pp-knob');
    if (!knob) return;
    const year = Number(knob.dataset.year), current = read(state.section, kind).values[year - 1];
    const big = e.key === 'PageUp' || e.key === 'PageDown';
    const dir = {ArrowUp: 1, PageUp: 1, ArrowDown: -1, PageDown: -1}[e.key];
    if (dir && finite(current)) {
      e.preventDefault();
      setValue(year, Math.max(kind.limits[0], Math.min(kind.limits[1], round(current + dir * kind.step(e.shiftKey) * (big ? 10 : 1), kind.step(true)))));
      field(year)?.dispatchEvent(new Event('change', {bubbles: true}));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      el.querySelector(`.rx-pp-knob[data-year="${year + (e.key === 'ArrowRight' ? 1 : -1)}"]`)?.focus({preventScroll: true});
    }
  });

  const help = section.querySelector('fieldset.yearly-path > legend');
  if (kind.place) kind.place(section, el);
  else if (help) help.after(el);
  else section.querySelector('select[id$="-mode"]')?.parentElement?.querySelector('p.micro[id$="-help"]')?.after(el);
  if (!el.isConnected) section.querySelector('p.micro[id$="-help"]')?.after(el);
  animatePresentation(el, [{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 360, easing: 'cubic-bezier(.16,1,.3,1)'});
  return state;
}

// Set every year up to `year` yourself. From another mode this first switches
// to "Set each year", which starts from the path you already had.
function extendTo(section, kind, year) {
  const target = Math.min(kind.maxSet, year);
  if (kind.name === 'growth') return extendGrowth(target);
  if (section.dataset.pathMode !== 'yearly') {
    const select = section.querySelector('select[id$="-mode"]');
    if (!select || select.disabled || ![...select.options].some(o => o.value === 'yearly')) return;
    select.value = 'yearly';
    select.dispatchEvent(new Event('change', {bubbles: true}));
  }
  const next = document.querySelector(`${kind.scope} ${kind.section}[data-path-mode="yearly"]`);
  const count = next?.querySelector(`input[data-yearly-count="${kind.name}"]`);
  if (count && Number(count.value) < target) {
    count.value = String(target);
    count.dispatchEvent(new Event('input', {bubbles: true}));
    count.dispatchEvent(new Event('change', {bubbles: true}));
  }
  requestAnimationFrame(() => {
    const now = document.querySelector(`${kind.scope} ${kind.section}[data-path-mode="yearly"]`);
    if (now) { scan(); now.querySelector(`.rx-pp-knob[data-year="${target}"]`)?.focus({preventScroll: true}); }
  });
}

// Growth: switch to "Set each year's growth" (it starts from your current
// path), using five explicit years when the year you clicked needs them.
function extendGrowth(target) {
  const mode = document.querySelector('#editor-group-2 #growth-path-mode');
  if (!mode || mode.disabled) return;
  if (!mode.value.startsWith('annual')) {
    const option = [...mode.options].find(o => o.value.startsWith('annual'));
    if (!option) return;
    mode.value = option.value;
    mode.dispatchEvent(new Event('change', {bubbles: true}));
  }
  const years = document.querySelector('#editor-group-2 #growth-explicit-years');
  if (years && Number(years.value) < target && [...years.options].some(o => Number(o.value) >= target)) {
    years.value = [...years.options].find(o => Number(o.value) >= target).value;
    years.dispatchEvent(new Event('change', {bubbles: true}));
  }
  requestAnimationFrame(() => { scan(); document.querySelector(`#editor-group-2 .rx-pp-knob[data-year="${target}"]`)?.focus({preventScroll: true}); });
}

function set(el, name, value) { if (el.getAttribute(name) !== value) el.setAttribute(name, value); }
function text(el, value) { if (el && el.textContent !== value) el.textContent = value; }

function paint(section) {
  const state = charts.get(section);
  if (!state || !state.el.isConnected) return;
  const {el, kind} = state;
  const {values, yearly, setYears, start, mature, roic, terminal} = read(section, kind);
  const valid = values.length > 0 && values.every(finite) && finite(mature);
  el.classList.toggle('is-invalid', !valid);
  // Withhold old numeric geometry until the host publishes a valid path again.
  if (el.hidden !== !valid) el.hidden = !valid;
  if (!valid) return;

  // Same calendar as the phase band below: a few years past the settle year.
  const banding = section.querySelector('.rx-phases.is-dragging');
  const settle = settleYear(values, mature);
  if (!state.drag && !banding) {
    const last = finite(terminal) ? terminal : finite(settle) ? settle : values.length;
    state.span = Math.min(30, Math.max(10, section.querySelector('.rx-phases') ? last + 3 : Math.max(last, values.length)));
  }
  const span = state.span;
  // Past the forecast the path is at its settled, terminal-consistent value.
  const series = Array.from({length: span}, (_, i) => values[i] ?? mature);
  if (!state.drag) {
    const all = [...series, mature, ...(kind.name === 'margin' && finite(start) ? [start] : [])];
    const lo = Math.min(0, ...all), hi = Math.max(...all, kind.minTop);
    state.domain = [lo, hi + (hi - lo) * .14];
  }
  const [lo, hi] = state.drag?.domain || state.domain, y = v => (hi - v) / (hi - lo);

  // End cards: identical layout in both tabs.
  const startCard = el.querySelector('.is-start'), settleCard = el.querySelector('.is-settle');
  const startValue = kind.name === 'margin' ? start : values[0];
  const startNote = {margin: 'today', capital: 'year1', growth: 'growthStart'}[kind.name];
  text(startCard.querySelector('.rx-pe-k'), copy('starts'));
  text(startCard.querySelector('b'), finite(startValue) ? kind.label(startValue) : '—');
  text(startCard.querySelector('small'), copy(startNote));
  text(settleCard.querySelector('.rx-pe-k'), copy('settles'));
  text(settleCard.querySelector('b'), kind.label(mature));
  const when = finite(settle) && settle <= values.length ? copy('fromYear', {n: settle}) : copy('beyond');
  text(settleCard.querySelector('small'), kind.name === 'capital' && finite(roic) ? `${when} · ${copy('viaRoic', {roic: `${Number((roic * 100).toFixed(1))}%`})}` : kind.name === 'growth' ? `${when} · ${copy('stableGrowth')}` : when);
  for (const [card, slider, link] of [[startCard, !kind.settleIsSlider, false], [settleCard, kind.settleIsSlider, !!kind.settleLink]]) {
    card.classList.toggle('is-slider', slider);
    card.classList.toggle('is-link', link);
    let tag = card.querySelector('.rx-pe-tag');
    if ((slider || link) && !tag) { tag = document.createElement('em'); tag.className = 'rx-pe-tag'; card.append(tag); }
    if (!slider && !link) tag?.remove();
    if (tag) text(tag, copy(slider ? 'slider' : 'inRisk'));
    if (slider || link) { set(card, 'role', 'button'); set(card, 'tabindex', '0'); set(card, 'title', copy(slider ? 'jump' : 'jumpRisk')); }
    else for (const name of ['role', 'tabindex', 'title']) card.removeAttribute(name);
  }

  // Columns are rebuilt only when the calendar or the set years change.
  const cols = el.querySelector('.rx-pp-cols'), key = `${span}|${setYears}|${getLocale?.()}`;
  // A count preview only re-tints the columns; the knobs follow on release.
  const previewing = section.dataset.previewSetYears !== undefined && state.key?.startsWith(`${span}|`) && state.key.endsWith(`|${getLocale?.()}`);
  if (state.key !== key && previewing) {
    cols.querySelectorAll('.rx-pp-col').forEach((col, i) => col.classList.toggle('is-set', i + 1 <= setYears));
  } else if (state.key !== key) {
    state.key = key;
    const focused = el.contains(document.activeElement) && document.activeElement.dataset.year;
    cols.innerHTML = series.map((_, i) => {
      const n = i + 1, mine = n <= setYears;
      return `<div class="rx-pp-col${mine ? ' is-set' : ''}" data-year="${n}" style="left:${(i / span) * 100}%;width:${100 / span}%"${mine || n > kind.maxSet ? '' : ` data-act="${copy('set')}"`}><i class="rx-pp-bar"></i><div class="rx-pp-head">${mine ? `<button type="button" class="rx-pp-knob" data-year="${n}" role="slider" aria-label="${copy('year', {n})}"></button>` : ''}<span class="rx-pp-val"></span></div><span class="rx-pp-yr">${n === 1 || n % 5 === 0 || n === setYears ? (getLocale?.() === 'zh-Hans' ? n : `Y${n}`) : ''}</span></div>`;
    }).join('');
    if (focused) cols.querySelector(`.rx-pp-knob[data-year="${focused}"]`)?.focus({preventScroll: true});
  }
  // Width comes from a ResizeObserver, so painting never forces a layout.
  if (!state.sized) { state.sized = true; state.width = cols.clientWidth; new ResizeObserver(([e]) => { const w = e.contentRect.width; if (w !== state.width) { state.width = w; requestAnimationFrame(() => paint(section)); } }).observe(cols); }
  const zero = y(Math.max(lo, Math.min(hi, 0))), wide = state.width / span >= 38;
  el.classList.toggle('is-narrow', !wide);
  const fadeEnd = finite(terminal) ? terminal : settle;
  cols.querySelectorAll('.rx-pp-col').forEach((col, i) => {
    const n = i + 1, v = series[i], top = Math.min(y(v), zero), height = Math.abs(zero - y(v));
    const tone = n <= setYears ? 'set' : n > values.length || (finite(fadeEnd) && n > fadeEnd) || (!finite(fadeEnd) && finite(settle) && n >= settle) ? 'end' : 'path';
    set(col, 'data-tone', tone);
    const bar = col.querySelector('.rx-pp-bar');
    const t = `translateY(${(top * 100).toFixed(3)}%) scaleY(${Math.max(height, .004).toFixed(4)})`;
    if (bar.style.transform !== t) bar.style.transform = t;
    const head = col.querySelector('.rx-pp-head'), ht = `translateY(${(y(v) * 100).toFixed(3)}%)`;
    if (head.style.transform !== ht) head.style.transform = ht;
    text(col.querySelector('.rx-pp-val'), kind.label(v));
    set(col, 'title', `${copy('year', {n})}: ${kind.label(v)}`);
    const knob = col.querySelector('.rx-pp-knob');
    if (knob) {
      const label = `${copy('yours')} · ${copy('year', {n})}`;
      set(knob, 'aria-label', label);
      set(knob, 'aria-valuenow', String(Number(v.toFixed(4))));
      set(knob, 'aria-valuetext', kind.label(v));
      set(knob, 'aria-valuemin', String(kind.limits[0]));
      set(knob, 'aria-valuemax', String(kind.limits[1]));
    }
  });
  const line = el.querySelector('.rx-pp-mature'), lt = `translateY(${(y(mature) * 100).toFixed(3)}%)`;
  if (line.style.transform !== lt) line.style.transform = lt;
  text(line.querySelector('span'), `${copy(kind.endLabel)} ${kind.label(mature)}`);
  set(el.querySelector('.rx-path-plot'), 'aria-label', copy('group'));
  el.classList.toggle('is-yearly', yearly);
  text(el.querySelector('.rx-path-hint'), copy(yearly ? 'drag' : 'click'));
}

function paintAll() { for (const kind of Object.values(KINDS)) for (const s of document.querySelectorAll(`${kind.scope} ${kind.section}`)) paint(s); }

function scan() {
  for (const kind of Object.values(KINDS)) {
    for (const section of document.querySelectorAll(`${kind.scope} ${kind.section}`)) {
      const state = charts.get(section);
      if (!observed.has(section)) { observed.add(section); attrsObserver.observe(section, {attributes: true, attributeFilter: ['data-path', 'data-start', 'data-mature', 'data-set-years', 'data-preview-set-years']}); }
      if (!section.hasAttribute('data-path')) { state?.el.remove(); charts.delete(section); continue; }
      if (!state || !state.el.isConnected) build(section, kind);
      paint(section);
    }
  }
}
for (const [name, kind] of Object.entries(KINDS)) kind.name = name;
onScan(scan);
// Typing in a year field, the count or the headline repaints at once.
document.addEventListener('input', e => {
  const section = e.target.closest?.('.capital-phase-controls, .margin-phase-controls');
  if (section && charts.has(section)) requestAnimationFrame(() => paint(section));
  else if (e.target.id === 'g-growth' || e.target.id?.startsWith('growth-year-')) {
    const growth = document.querySelector('#editor-group-2 .growth-path-controls');
    if (growth && charts.has(growth)) requestAnimationFrame(() => paint(growth));
  }
}, true);
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('rx-path-end') && e.target.matches('.is-slider, .is-link')) { e.preventDefault(); e.target.click(); }
});

// Year-by-year: each revenue-growth bar opens that year in the editor, and the
// bar for the year being edited stays marked.
const ANNUAL_BARS = '.annual-revenue-growth-bars .approved-growth-column[data-annual-growth-year]';
function markAnnualYear() {
  const select = document.querySelector('#annual-edit-year');
  const year = select ? Number(select.value) + 1 : NaN;
  for (const col of document.querySelectorAll(ANNUAL_BARS)) {
    const on = Number(col.dataset.annualGrowthYear) === year;
    if (col.classList.contains('is-editing') !== on) col.classList.toggle('is-editing', on);
    if (col.tabIndex !== 0) col.tabIndex = 0;
  }
}
function pickAnnualYear(col) {
  const select = document.querySelector('#annual-edit-year');
  const value = String(Number(col.dataset.annualGrowthYear) - 1);
  if (!select || select.disabled || ![...select.options].some(o => o.value === value)) return;
  if (select.value !== value) { select.value = value; select.dispatchEvent(new Event('change', {bubbles: true})); }
  markAnnualYear();
  // On phones the editor is its own tab; open it before scrolling there.
  if (!select.getClientRects().length) document.querySelector('[data-annual-mobile="inputs"]')?.click();
  const control = select.closest('.annual-year-control') || select;
  const r = control.getBoundingClientRect();
  if (r.top < 64 || r.bottom > innerHeight) control.scrollIntoView({block: 'center', behavior: reduced() ? 'auto' : 'smooth'});
  animatePresentation(control, [{backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)'}, {backgroundColor: 'transparent'}], {duration: 1100, easing: 'ease-out'});
}
document.addEventListener('click', e => { const col = e.target.closest?.(ANNUAL_BARS); if (col) pickAnnualYear(col); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const col = e.target.closest?.(ANNUAL_BARS);
  if (col) { e.preventDefault(); pickAnnualYear(col); }
});
document.addEventListener('change', e => { if (e.target.id === 'annual-edit-year') markAnnualYear(); });
onScan(markAnnualYear);
