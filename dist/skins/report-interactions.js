// Annual Report interaction layer. Presentation only: every value change goes
// through the application's own input handlers (a native 'input' event on the
// original field), so models, drafts, undo and validation behave exactly as if
// the person had typed. Inserted nodes are decorative (.rx-el).
const root = document.documentElement;
// The few words this layer writes itself, in both languages.
const COPY = {
  en: {full: 'Full history ↗', you: 'You {v}', same: 'same as you', above: 'you are {v} above', below: 'you are {v} below', pts: ' pts', fallback: 'Reported history'},
  'zh-Hans': {full: '完整历史资料 ↗', you: '你 {v}', same: '与你的假设相同', above: '你的假设高出 {v}', below: '你的假设低了 {v}', pts: ' 个百分点', fallback: '申报历史资料'}
};
// This file also runs as a plain script in tests, so it reads the page language rather than importing i18n.
const say = (k, v = '') => (COPY[document.documentElement.lang] || COPY.en)[k].replace('{v}', v);
const on = () => root.dataset.skin === 'report';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Fixed to the field's precision, without trailing zeros: 12, 2.25, 9.5.
const fmt = (v, dec) => { const n = Number(v); return Number.isInteger(dec) && dec >= 0 && dec <= 100 ? String(Number(n.toFixed(dec))) : String(n); };
const decimals = step => { const [mantissa, exponent = '0'] = String(step).toLowerCase().split('e'); return Math.max(0, (mantissa.split('.')[1] || '').length - Number(exponent)); };

/* ---------- floating value bubble (slider drags and number scrubbing) ---------- */
let bubble, bubbleTimer;
function showBubble(x, y, text, delta) {
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.className = 'rx-el rx-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    document.body.append(bubble);
  }
  clearTimeout(bubbleTimer);
  bubble.innerHTML = `<b>${text}</b>${delta ? `<i>${delta}</i>` : ''}`;
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
  bubble.classList.add('is-on');
}
function hideBubble(delay = 500) {
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble?.classList.remove('is-on'), delay);
}
function unitFor(input) {
  const card = input.closest('.driver-card, .driver-top, fieldset, label');
  const u = card?.querySelector('.driver-number > span')?.textContent?.trim();
  if (u) return u;
  const legend = input.closest('fieldset')?.querySelector('legend')?.textContent || input.closest('label')?.textContent || '';
  return /%/.test(legend) ? '%' : /×/.test(legend) ? '×' : '';
}
const display = value => Number(value).toLocaleString('en-US', {maximumFractionDigits: 2, useGrouping: false, notation: value !== 0 && Math.abs(value) < .01 ? 'scientific' : 'standard'}).replace('E', 'e');
const signed = (d, dec) => (d > 0 ? '+' : d < 0 ? '−' : '±') + display(Math.abs(d));

/* ---------- drag-to-adjust numbers ---------- */
const SCRUB = [
  '.guided-screen .driver-number input[type="number"]',
  '.mc-driver-parameters input[type="number"]',
  '.operating-timing-inputs input[type="number"]',
  '.annual-growth-inputs input[type="number"]',
  '.historical-editor-body input[type="number"]',
  '.annual-proxy-grid input[data-year-field]'
].join(',');

// Annual-model fields are formatted text ("508,837.1") that hold the exact
// figure in data-raw; they step relative to their magnitude instead of a
// native step attribute.
function scrubSpec(input) {
  if (input.matches('[data-year-field]')) {
    const start = Number(input.dataset.raw);
    if (input.dataset.raw === '' || !Number.isFinite(start)) return null;
    const pct = Number(input.dataset.scale) === 100;
    const step = pct ? 0.25 : 10 ** Math.max(0, Math.floor(Math.log10(Math.abs(start) || 1)) - 2);
    const digits = Number(input.dataset.displayDigits) || 0;
    return {
      start, step, dec: Math.max(pct ? 2 : 0, decimals(start)), min: -Infinity, max: Infinity, unit: pct ? '%' : '',
      settle: () => { input.value = Number(input.dataset.raw).toLocaleString('en-US', {maximumFractionDigits: Math.min(2, digits)}); }
    };
  }
  return {
    start: input.dataset?.precisionValue !== undefined && input.dataset.precisionValue !== '' ? Number(input.dataset.precisionValue) * Number(input.dataset.precisionScale || 1) : Number(input.value) || 0,
    step: Number(input.step) || 1,
    dec: Math.max(decimals(input.step || 1), decimals(input.dataset?.precisionValue !== undefined && input.dataset.precisionValue !== '' ? Number(input.dataset.precisionValue) * Number(input.dataset.precisionScale || 1) : Number(input.value) || 0)),
    min: input.min === '' ? -Infinity : Number(input.min),
    max: input.max === '' ? Infinity : Number(input.max),
    unit: unitFor(input),
    settle: () => { if (input.dataset?.precisionValue !== undefined) input.onblur?.(); }
  };
}

document.addEventListener('pointerdown', e => {
  if (!on() || e.button !== 0) return;
  const input = e.target.closest?.(SCRUB);
  if (!input || input.disabled || input.readOnly || document.activeElement === input) return;
  const spec = scrubSpec(input);
  if (!spec) return;
  const {step, dec, min, max, start, unit} = spec;
  const x0 = e.clientX;
  let moved = false;
  e.preventDefault();
  input.setPointerCapture?.(e.pointerId);
  const move = ev => {
    const dx = ev.clientX - x0;
    if (!moved && Math.abs(dx) < 4) return;
    if (!moved) { moved = true; root.classList.add('rx-scrubbing'); input.classList.add('rx-active'); }
    const perStep = ev.shiftKey ? 2 : 7;
    const next = Math.min(max, Math.max(min, start + Math.round(dx / perStep) * step));
    const text = fmt(next, dec);
    const r = input.getBoundingClientRect();
    showBubble(r.left + r.width / 2, r.top, `${display(next)}${unit}`, next !== start ? signed(next - start, dec) : '');
    if (input.value !== text) {
      input.value = text;
      input.dispatchEvent(new Event('input', {bubbles: true}));
    }
  };
  const up = () => {
    input.removeEventListener('pointermove', move);
    input.removeEventListener('pointerup', up);
    input.removeEventListener('pointercancel', up);
    root.classList.remove('rx-scrubbing');
    input.classList.remove('rx-active');
    if (moved) { input.dispatchEvent(new Event('change', {bubbles: true})); spec.settle(); hideBubble(700); }
    else { input.focus(); input.select?.(); }
  };
  input.addEventListener('pointermove', move);
  input.addEventListener('pointerup', up);
  input.addEventListener('pointercancel', up);
}, true);

/* ---------- slider bubble ---------- */
const RANGES = '.driver-range, .mc-setup input[type="range"], .annual-editor-panel input[type="range"], .historical-editor-body input[type="range"]';
const rangeStart = new WeakMap();
function bubbleForRange(range, delta = true) {
  const r = range.getBoundingClientRect();
  const min = Number(range.min || 0), max = Number(range.max || 100), v = Number(range.value);
  const t = max > min ? (v - min) / (max - min) : 0;
  const x = r.left + 9 + t * (r.width - 18);
  const dec = decimals(range.step || 1);
  const s = rangeStart.get(range);
  showBubble(x, r.top - 4, `${display(v)}${unitFor(range)}`, delta && s !== undefined && s !== v ? signed(v - s, dec) : '');
}
document.addEventListener('pointerdown', e => {
  const range = on() && e.target.closest?.(RANGES);
  if (!range) return;
  rangeStart.set(range, Number(range.value));
  requestAnimationFrame(() => bubbleForRange(range));
}, true);
document.addEventListener('input', e => {
  if (!on()) return;
  const range = e.target.closest?.(RANGES);
  if (range) { if (!rangeStart.has(range)) rangeStart.set(range, Number(range.value)); bubbleForRange(range); }
  const card = e.target.closest?.('.driver-card');
  if (card) requestAnimationFrame(() => drawHistory(card));
}, true);
for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, () => { if (on()) hideBubble(600); }, true);
document.addEventListener('keyup', e => {
  const range = on() && e.target.closest?.(RANGES);
  if (range && /Arrow|Page|Home|End/.test(e.key)) { bubbleForRange(range, false); hideBubble(900); }
}, true);
document.addEventListener('focusout', e => { if (on() && e.target.closest?.(RANGES)) { rangeStart.delete(e.target); hideBubble(0); } }, true);

/* ---------- inline reported history ---------- */
function readHistory(card) {
  // The card's own measure is the first history table; later ones are related measures.
  const rows = [...(card.querySelector('.assumption-history table')?.querySelectorAll('tbody tr') || [])];
  const points = [];
  for (const row of rows) {
    const label = row.querySelector('th')?.firstChild?.textContent?.trim();
    const text = row.querySelector('td')?.textContent || '';
    const value = Number.parseFloat(text.replace(/[^0-9.\-−]/g, '').replace('−', '-'));
    if (label && Number.isFinite(value)) points.push({label, value, percent: /%/.test(text)});
  }
  return points;
}
function short(fy) { return fy.replace(/^FY(\d\d)(\d\d)$/, "FY$2"); }

function drawHistory(card) {
  if (!on()) return;
  const points = readHistory(card);
  const input = card.querySelector('.driver-number input');
  const range = card.querySelector('.driver-range');
  const historyButton = card.querySelector('[data-evidence^="history-"]');
  let strip = card.querySelector(':scope > .rx-history');
  if (points.length < 2 || !input) { strip?.remove(); return; }
  const unit = card.querySelector('.driver-number > span')?.textContent?.trim() || '';
  // The caption is already in the page's language; keep its first clause.
  const measure = (card.querySelector('.assumption-history table caption')?.textContent || say('fallback')).split(/[.。]/)[0].replace(/^Annual /, '');
  const user = Number(input.value);
  const vals = points.map(p => p.value);
  const latest = points.at(-1);

  // Slider context: historical range as a band, latest year as a mark.
  if (range && points.every(p => p.percent) && unit === '%') {
    const min = Number(range.min), max = Number(range.max);
    const pos = v => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
    range.style.setProperty('--rx-band-l', pos(Math.min(...vals)));
    range.style.setProperty('--rx-band-r', pos(Math.max(...vals)));
    range.style.setProperty('--rx-last', pos(latest.value));
    range.classList.add('rx-has-history');
  }

  if (!strip) {
    strip = document.createElement('button');
    strip.type = 'button';
    strip.className = 'rx-el rx-history';
    strip.tabIndex = -1;
    strip.setAttribute('aria-hidden', 'true');
    strip.addEventListener('click', () => card.querySelector('[data-evidence^="history-"]')?.click());
    const help = card.querySelector(':scope > .driver-help');
    (help || card.lastElementChild)?.after(strip);
  }
  const W = 240, H = 64, pad = 2;
  const lo = Math.min(0, ...vals, user), hi = Math.max(0, ...vals, user);
  const y = v => pad + (H - pad * 2) * (1 - (v - lo) / ((hi - lo) || 1));
  const bw = W / points.length;
  const bars = points.map((p, i) => {
    const top = Math.min(y(p.value), y(0)), h = Math.max(1, Math.abs(y(p.value) - y(0)));
    return `<rect x="${(i * bw + bw * .2).toFixed(1)}" y="${top.toFixed(1)}" width="${(bw * .6).toFixed(1)}" height="${h.toFixed(1)}" class="${i === points.length - 1 ? 'is-latest' : ''}"><title>${p.label}: ${display(p.value)}${unit}</title></rect>`;
  }).join('');
  const uy = y(user).toFixed(1);
  const dec = decimals(input.step || 1);
  const above = user - latest.value;
  strip.innerHTML = `
    <span class="rx-history-head"><span>${measure}</span><span class="rx-history-open">${historyButton ? say('full') : ''}</span></span>
    <span class="rx-history-plot">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2="${W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="rx-zero"/>
        ${bars}
        <line x1="0" x2="${W}" y1="${uy}" y2="${uy}" class="rx-you"/>
      </svg>
      <span class="rx-you-label${uy < 20 ? ' is-below' : ''}" style="top:${(uy / H * 100).toFixed(1)}%">${say('you', display(user) + unit)}</span>
    </span>
    <span class="rx-history-foot"><span>${short(points[0].label)}</span><span>${short(latest.label)} <b>${display(latest.value)}${unit}</b> · ${Math.abs(above) < 1e-9 ? say('same') : say(above > 0 ? 'above' : 'below', fmt(Math.abs(above), 1) + (unit === '%' ? say('pts') : unit))}</span></span>`;
}

/* ---------- result feedback: a change chip on the key-figures panel ---------- */
const FIGURES = '.guided-screen .workspace-summary .valuation-number, .annual-summary-values .research-big-value, .historical-summary .hero-result .value';
const lastBySelector = new Map();
const numberIn = text => { const m = String(text).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : NaN; };
function figureFeedback() {
  if (!on()) return;
  for (const el of document.querySelectorAll(FIGURES)) {
    if (!el.offsetParent) continue;
    const text = el.textContent.trim();
    const key = el.closest('.page')?.id + ':' + (el.className || el.tagName);
    const prev = lastBySelector.get(key);
    lastBySelector.set(key, {text, company: currentCompany()});
    if (!prev || prev.text === text || prev.company !== currentCompany()) continue;
    const a = numberIn(prev.text), b = numberIn(text);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) continue;
    const pct = ((b - a) / Math.abs(a)) * 100;
    if (Math.abs(pct) < 0.005 || Math.abs(pct) > 400) continue;
    const panel = el.closest('.live-value, .annual-summary-values, .hero-result');
    if (!panel) continue;
    panel.querySelector(':scope > .rx-delta')?.remove();
    const chip = document.createElement('span');
    chip.className = `rx-el rx-delta ${pct > 0 ? 'is-up' : 'is-down'}`;
    chip.setAttribute('aria-hidden', 'true');
    chip.textContent = `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`;
    panel.append(chip);
    setTimeout(() => chip.remove(), 2200);
    if (!reduced()) el.animate?.([{transform: `translateY(${pct > 0 ? 6 : -6}px)`, opacity: .4}, {transform: 'none', opacity: 1}], {duration: 360, easing: 'cubic-bezier(.16,1,.3,1)'});
  }
}
function currentCompany() {
  const page = document.querySelector('.page:not(.hidden)');
  return page?.querySelector('#current-company, #research-company, #company')?.value || '';
}

/* ---------- maturity-year steppers and ramp ----------
   Each "in year N" field gets − / + buttons. The tile gets a full-horizon ramp:
   flat through any hold years, converging until the maturity year, then
   holding. Clicking a year on the ramp makes it the maturity year. All
   changes go through the original inputs. */
// Revenue, margin and capital have independent calendars. Read the existing
// controls; this visual layer never sets the calculation horizon itself.
function timingHorizon(tile) {
  const scope = tile.closest('.guided-screen') || document;
  const selectors = '#growth-maturity, input[data-operating-timing$="MaturityYears"], input[data-margin-control="terminalYear"], input[data-capital-control="terminalYear"]';
  const years = [...scope.querySelectorAll(selectors)].map(input => Number(input.value)).filter(year => Number.isInteger(year) && year >= 1 && year <= 30);
  return Math.max(10, ...years);
}
function timingProgress(year, hold, maturity) {
  return year <= hold ? 0 : Math.max(0, Math.min(1, (year - hold) / (maturity - hold)));
}
function setYear(input, year) {
  const min = Number(input.min) || 0, max = Number(input.max) || 30;
  const next = Math.min(max, Math.max(min, Math.round(year)));
  if (Number(input.value) === next) return;
  input.value = String(next);
  input.dispatchEvent(new Event('input', {bubbles: true}));
  input.dispatchEvent(new Event('change', {bubbles: true}));
  if (!reduced()) input.animate?.([{scale: 1.12}, {scale: 1}], {duration: 260, easing: 'cubic-bezier(.16,1,.3,1)'});
}
const timingInputsOf = tile => ({
  hold: tile.querySelector('input[data-operating-timing$="HoldYears"]'),
  maturity: tile.querySelector('input[data-operating-timing$="MaturityYears"]')
});
function paintTiming(tile) {
  const {hold, maturity} = timingInputsOf(tile);
  for (const input of tile.querySelectorAll('input[data-operating-timing]')) {
    const v = Number(input.value);
    const field = input.parentElement;
    const down = field.querySelector('.rx-step-down'), up = field.querySelector('.rx-step-up');
    const atMin = v <= (Number(input.min) || 0), atMax = v >= (Number(input.max) || 30);
    if (down && down.disabled !== atMin) down.disabled = atMin;
    if (up && up.disabled !== atMax) up.disabled = atMax;
  }
  const ramp = tile.querySelector(':scope > .rx-ramp');
  if (!ramp || !maturity) return;
  const h = hold ? Number(hold.value) : 0, n = Number(maturity.value);
  const valid = (!hold || hold.value.trim() !== '') && maturity.value.trim() !== '' && Number.isInteger(h) && Number.isInteger(n) && h >= 0 && n > h && n <= 30;
  const horizon = timingHorizon(tile), bars = ramp.querySelector('.rx-ramp-bars');
  if (ramp.dataset.horizon !== String(horizon)) {
    ramp.dataset.horizon = String(horizon);
    bars.style.gridTemplateColumns = `repeat(${horizon}, minmax(0, 1fr))`;
    bars.innerHTML = Array.from({length: horizon}, (_, k) => `<i data-year="${k + 1}" title="Year ${k + 1}"></i>`).join('');
    ramp.querySelector('.rx-ramp-axis > span:last-child').textContent = `Y${horizon}`;
  }
  if (bars.hidden === valid) bars.hidden = !valid;
  bars.querySelectorAll('i').forEach((bar, k) => {
    const y = k + 1, height = `${Math.round(28 + 72 * (valid ? timingProgress(y, h, n) : 0))}%`;
    if (bar.style.getPropertyValue('--h') !== height) bar.style.setProperty('--h', height);
    for (const [name, selected] of [['is-hold', valid && y <= h], ['is-ramp', valid && y > h && y < n], ['is-target', valid && y === n]]) {
      if (bar.classList.contains(name) !== selected) bar.classList.toggle(name, selected);
    }
  });
  const lead = h ? `Holds ${h} ${h === 1 ? 'year' : 'years'}, ` : '';
  const note = valid ? `${lead}${lead ? 'converges' : 'Converges'} by year ${n}, then holds · ${horizon}-year forecast` : 'Enter valid whole years to preview timing';
  const label = ramp.querySelector('.rx-ramp-note');
  if (label.textContent !== note) label.textContent = note;
}
function enhanceTiming() {
  for (const tile of document.querySelectorAll('.guided-screen .operating-timing-controls')) {
    if (tile.querySelector('.rx-step')) { paintTiming(tile); continue; }
    for (const input of tile.querySelectorAll('input[data-operating-timing]')) {
      const label = input.parentElement.querySelector('label')?.textContent?.trim() || 'year';
      const step = (cls, sign, name) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `rx-el rx-step ${cls}`;
        b.setAttribute('aria-label', `${name} · ${label}`);
        b.addEventListener('click', () => setYear(input, Number(input.value) + sign));
        return b;
      };
      input.before(step('rx-step-down', -1, 'One year earlier'));
      input.after(step('rx-step-up', 1, 'One year later'));
      input.parentElement.classList.add('rx-timing');
    }
    const {hold, maturity} = timingInputsOf(tile);
    if (maturity) {
      const ramp = document.createElement('div');
      ramp.className = 'rx-el rx-ramp';
      ramp.setAttribute('aria-hidden', 'true');
      ramp.innerHTML = '<div class="rx-ramp-bars"></div><div class="rx-ramp-axis"><span>Y1</span><span class="rx-ramp-note"></span><span></span></div>';
      ramp.addEventListener('click', e => {
        const bar = e.target.closest('i[data-year]');
        if (bar) setYear(maturity, Math.max(Number(bar.dataset.year), (Number(hold?.value) || 0) + 1));
      });
      tile.querySelector(':scope > .operating-timing-inputs').after(ramp);
    }
    paintTiming(tile);
  }
}
document.addEventListener('input', e => {
  const tile = on() && e.target.closest?.('.operating-timing-controls');
  if (tile) paintTiming(tile);
}, true);

/* ---------- company change: the key-figures panel prints again ----------
   Switching company replays the panel's opening wipe. The attribute stays on
   briefly so a panel the application re-renders mid-way still plays it. */
const COMPANY = '#current-company, #research-company, #company';
let revealTimer;
document.addEventListener('change', e => {
  if (!on() || reduced() || !e.target.matches?.(COMPANY)) return;
  root.removeAttribute('data-rx-reveal');
  void root.offsetWidth;
  root.setAttribute('data-rx-reveal', '');
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => root.removeAttribute('data-rx-reveal'), 1400);
}, true);

/* ---------- scan ---------- */
let queued = false;
function scan() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    if (!on()) return;
    for (const card of document.querySelectorAll('.guided-screen .driver-card')) {
      if (card.offsetParent && !card.querySelector(':scope > .rx-history')) drawHistory(card);
    }
    enhanceTiming();
    figureFeedback();
  });
}
// A language switch redraws every strip: hidden ones are drawn when they show.
// The history strips are drawn once, so a language switch redraws them.
if (typeof MutationObserver === 'function' && document.documentElement) new MutationObserver(() => setTimeout(() => { for (const s of document.querySelectorAll('.guided-screen .rx-history')) s.remove(); scan(); }, 0)).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
new MutationObserver(scan).observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden']});
scan();
