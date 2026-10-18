// Annual Report · phase timelines. Presentation only. Capital efficiency and
// margin phases are three "in year N" fields whose meaning only shows when you
// picture them on a calendar. This draws that calendar: one bar split into the
// phases, with a handle on each boundary year. Dragging a handle (or using the
// arrow keys on it) writes the original field and fires its native 'input' and
// 'change' events, so validation, drafts, Undo and the model behave exactly as
// if the number had been typed. The fields stay below for exact entry.
import {onScan} from './report-ux.js';
import {getLocale} from '../i18n.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const COPY = {
  en: {early: 'Early', later: 'Later', fade: 'Fade', terminal: 'Terminal', reach: 'Move to', hold: 'Hold', fadeTo: 'Fade to', year: 'Year', drag: 'Drag a marker or use the arrow keys to move a phase boundary.'},
  'zh-Hans': {early: '早期', later: '后期', fade: '过渡', terminal: '终值', reach: '调整至', hold: '维持', fadeTo: '降至', year: '第 {n} 年', drag: '拖动标记或使用方向键调整阶段分界。'}
};
const copy = key => (COPY[getLocale?.()] || COPY.en)[key];
const yearLabel = n => getLocale?.() === 'zh-Hans' ? copy('year').replace('{n}', n) : `Y${n}`;
const num = el => { const v = Number(el?.value); return el && el.value.trim() !== '' && Number.isFinite(v) ? v : NaN; };
const fmt = (v, unit) => Number.isFinite(v) ? `${Number(v.toFixed(2))}${unit}` : '—';

/* Each kind names its three boundary fields, how they may order, and the phases. */
const KINDS = {
  capital: {
    section: '.capital-phase-controls',
    anchor: s => s.querySelector('.operating-timing-controls'),
    place: (s, el) => s.querySelector('.operating-timing-controls')?.prepend(el),
    field: (s, k) => s.querySelector(`input[data-capital-control="${k}"]`),
    keys: ['earlyEndYear', 'fadeStartYear', 'terminalYear'],
    strict: true,
    phases(s, [e, f, t]) {
      const scope = s.closest('[role="tabpanel"], .guided-screen') || document;
      const early = num(scope.querySelector('#g-salesCapital, input[id$="-salesCapital"]:not([data-capital-control])'));
      const later = num(this.field(s, 'laterSalesCapital'));
      return [
        {from: 1, to: e, tone: 'a', name: copy('early'), value: fmt(early, '×')},
        {from: e + 1, to: f, tone: 'b', name: copy('later'), value: fmt(later, '×')},
        {from: f + 1, to: t, tone: 'fade', name: copy('fade'), value: ''},
        {from: t + 1, to: Infinity, tone: 'end', name: copy('terminal'), value: ''}
      ];
    }
  },
  margin: {
    section: '.margin-phase-controls',
    anchor: s => s.querySelector('.margin-phase-grid'),
    place: (s, el) => s.querySelector('.margin-phase-grid')?.before(el),
    field: (s, k) => s.querySelector(`input[data-margin-control="${k}"]`),
    keys: ['interimYear', 'declineStartYear', 'terminalYear'],
    strict: false,
    phases(s, [i, d, t]) {
      const scope = s.closest('[role="tabpanel"], .guided-screen') || document;
      const interim = num(this.field(s, 'interimMargin'));
      const terminal = num(this.field(s, 'terminalMargin') || scope.querySelector('#g-targetMargin'));
      return [
        {from: 1, to: i, tone: 'a', name: copy('reach'), value: fmt(interim, '%')},
        {from: i + 1, to: d, tone: 'b', name: copy('hold'), value: fmt(interim, '%')},
        {from: d + 1, to: t, tone: 'fade', name: copy('fadeTo'), value: fmt(terminal, '%')},
        {from: t + 1, to: Infinity, tone: 'end', name: copy('hold'), value: fmt(terminal, '%')}
      ];
    }
  }
};

function bounds(kind, years, index) {
  // Capital needs a gap of at least one year between boundaries; margin
  // boundaries may coincide (an empty hold or fade phase).
  const gap = kind.strict ? 1 : 0;
  const lo = index === 0 ? 1 : years[index - 1] + gap;
  const hi = index === years.length - 1 ? 30 : years[index + 1] - gap;
  return [lo, hi];
}

function write(input, year) {
  if (!input || Number(input.value) === year) return;
  input.value = String(year);
  input.dispatchEvent(new Event('input', {bubbles: true}));
  input.dispatchEvent(new Event('change', {bubbles: true}));
}

const timelines = new WeakMap();   // section -> state
function build(section, kind) {
  const el = document.createElement('div');
  el.className = 'rx-el rx-phases';
  el.innerHTML = '<div class="rx-ph-track"><div class="rx-ph-bands"></div></div><div class="rx-ph-axis"></div><p class="rx-ph-hint"></p>';
  const handles = kind.keys.map((key, index) => {
    const h = document.createElement('button');
    h.type = 'button';
    h.className = 'rx-ph-handle';
    h.dataset.index = index;
    h.setAttribute('role', 'slider');
    h.innerHTML = '<span class="rx-ph-tag"></span>';
    el.querySelector('.rx-ph-track').append(h);
    return h;
  });
  const state = {el, kind, handles, span: 15, drag: null};
  timelines.set(section, state);

  const yearsNow = () => kind.keys.map(k => num(kind.field(section, k)));
  const move = (index, year) => {
    const years = yearsNow();
    if (!years.every(Number.isInteger)) return;
    const [lo, hi] = bounds(kind, years, index);
    write(kind.field(section, kind.keys[index]), Math.max(lo, Math.min(hi, Math.round(year))));
    paint(section);
  };

  el.addEventListener('keydown', e => {
    const h = e.target.closest('.rx-ph-handle');
    if (!h) return;
    const index = Number(h.dataset.index), year = yearsNow()[index];
    const step = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[e.key];
    if (step) { e.preventDefault(); move(index, year + step); }
    else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const [lo, hi] = bounds(kind, yearsNow(), index);
      move(index, e.key === 'Home' ? lo : hi);
    }
  });

  const track = el.querySelector('.rx-ph-track');
  const yearAt = x => {
    const r = track.getBoundingClientRect();
    return Math.round(((x - r.left) / r.width) * state.span);
  };
  track.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const years = yearsNow();
    if (!years.every(Number.isInteger)) return;
    let h = e.target.closest('.rx-ph-handle');
    // A press on the bar grabs the nearest boundary.
    if (!h) {
      const y = yearAt(e.clientX);
      let best = 0;
      years.forEach((v, i) => { if (Math.abs(v - y) < Math.abs(years[best] - y)) best = i; });
      h = handles[best];
    }
    e.preventDefault();
    track.setPointerCapture(e.pointerId);
    h.focus({preventScroll: true});
    // Coinciding markers: the first movement decides which one you meant.
    const index = Number(h.dataset.index);
    const twins = years.map((v, i) => i).filter(i => years[i] === years[index]);
    state.drag = {index, twins, x: e.clientX, decided: twins.length < 2};
    el.classList.add('is-dragging');
    if (!e.target.closest('.rx-ph-handle')) move(index, yearAt(e.clientX));
  });
  track.addEventListener('pointermove', e => {
    const d = state.drag;
    if (!d) return;
    if (!d.decided) {
      if (Math.abs(e.clientX - d.x) < 4) return;
      d.index = e.clientX > d.x ? Math.max(...d.twins) : Math.min(...d.twins);
      d.decided = true;
      handles[d.index].focus({preventScroll: true});
    }
    const y = yearAt(e.clientX);
    if (y !== yearsNow()[d.index]) move(d.index, y);
  });
  const end = () => {
    if (!state.drag) return;
    state.drag = null;
    el.classList.remove('is-dragging');
    paint(section);   // the span may grow or shrink once you let go
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  track.addEventListener('lostpointercapture', end);
  kind.place(section, el);
  if (!reduced()) el.animate([{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 360, easing: 'cubic-bezier(.16,1,.3,1)'});
  return state;
}

function paint(section) {
  const state = timelines.get(section);
  if (!state) return;
  const {el, kind, handles} = state;
  const years = kind.keys.map(k => num(kind.field(section, k)));
  const valid = years.every(v => Number.isInteger(v) && v >= 1 && v <= 30) && years.every((v, i) => i === 0 || (kind.strict ? v > years[i - 1] : v >= years[i - 1]));
  el.classList.toggle('is-invalid', !valid);
  if (!valid) return;
  // The calendar shows a few years past the last boundary. It only rescales
  // between drags so the bar never shifts under your pointer.
  if (!state.drag) state.span = Math.min(30, Math.max(10, years.at(-1) + 3));
  const span = state.span, pct = y => `${(Math.max(0, Math.min(span, y)) / span) * 100}%`;
  const phases = kind.phases(section, years).map(p => ({...p, to: Math.min(p.to, span)})).filter(p => p.to >= p.from);
  const bands = el.querySelector('.rx-ph-bands');
  const markup = phases.map(p => {
    const width = ((p.to - p.from + 1) / span) * 100;
    const range = p.from === p.to ? yearLabel(p.from) : `${yearLabel(p.from)}–${p.to >= span && p.tone === 'end' ? '' : yearLabel(p.to)}`;
    return `<div class="rx-ph-band is-${p.tone}${width < 14 ? ' is-narrow' : ''}" style="left:${pct(p.from - 1)};width:${width}%" title="${p.name} ${p.value} · ${range}"><b>${p.name}</b>${p.value ? `<span>${p.value}</span>` : ''}</div>`;
  }).join('');
  if (bands.dataset.markup !== markup) { bands.innerHTML = markup; bands.dataset.markup = markup; }
  handles.forEach((h, i) => {
    const [lo, hi] = bounds(kind, years, i);
    const left = pct(years[i]);
    if (h.style.left !== left) h.style.left = left;
    const label = section.querySelector(`label[for="${kind.field(section, kind.keys[i])?.id}"]`)?.textContent.trim() || kind.keys[i];
    for (const [name, value] of [['aria-valuemin', lo], ['aria-valuemax', hi], ['aria-valuenow', years[i]], ['aria-label', label], ['aria-valuetext', yearLabel(years[i])]]) {
      if (h.getAttribute(name) !== String(value)) h.setAttribute(name, String(value));
    }
    const tag = h.querySelector('.rx-ph-tag');
    if (tag.textContent !== yearLabel(years[i])) tag.textContent = yearLabel(years[i]);
  });
  // Neighbouring year tags that would touch lift one above the other.
  const width = el.querySelector('.rx-ph-track').clientWidth;
  let raisedAny = false;
  handles.forEach((h, i) => {
    const gap = i ? ((years[i] - years[i - 1]) / span) * width : Infinity;
    const raise = gap < 46 && !handles[i - 1].classList.contains('is-raised');
    raisedAny ||= raise;
    if (h.classList.contains('is-raised') !== raise) h.classList.toggle('is-raised', raise);
  });
  if (el.classList.contains('has-raised') !== raisedAny) el.classList.toggle('has-raised', raisedAny);
  const axis = el.querySelector('.rx-ph-axis');
  // Ticks sit on year ends, the same places the boundary markers snap to.
  const axisMarkup = Array.from({length: span}, (_, k) => `<i style="left:${pct(k + 1)}"${(k + 1) % 5 === 0 || k === 0 ? ` data-y="${k + 1}"` : ''}></i>`).join('');
  if (axis.dataset.span !== String(span)) { axis.innerHTML = axisMarkup; axis.dataset.span = String(span); }
  const hint = el.querySelector('.rx-ph-hint');
  if (hint.textContent !== copy('drag')) hint.textContent = copy('drag');
}

function scan() {
  for (const kind of Object.values(KINDS)) {
    for (const section of document.querySelectorAll(kind.section)) {
      const has = kind.anchor(section) && kind.keys.every(k => kind.field(section, k));
      const state = timelines.get(section);
      if (!has) { state?.el.remove(); timelines.delete(section); continue; }
      if (!state || !state.el.isConnected) build(section, kind);
      paint(section);
    }
  }
}
onScan(scan);
// Typing in the original fields (or the ratios) repaints at once.
document.addEventListener('input', e => {
  const section = e.target.closest?.('.capital-phase-controls, .margin-phase-controls');
  if (section && timelines.has(section)) requestAnimationFrame(() => paint(section));
  else if (e.target.id === 'g-salesCapital' || e.target.id === 'g-targetMargin') {
    document.querySelectorAll('.capital-phase-controls, .margin-phase-controls').forEach(s => timelines.has(s) && requestAnimationFrame(() => paint(s)));
  }
}, true);
