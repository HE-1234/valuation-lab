// Annual Report · the Guided valuation as one journey, in Damodaran's order:
// a story first, then the four value drivers it implies (growth, profitability,
// reinvestment, risk), then the bridge from operating value to equity.
//
// Presentation only. Every control here clicks the app's own tabs, and every
// number is read from the app's own inputs or published data; nothing is
// computed or stored. Nodes are written only when their text changes.
import {onScan} from './report-ux.js';
import {getLocale} from '../i18n.js';

const COPY = {
  en: {
    e1: 'Step 1 of 6 · The story', e2: 'Step 2 of 6 · Value driver · Growth', e3: 'Step 3 of 6 · Value driver · Profitability',
    e4: 'Step 4 of 6 · Value driver · Reinvestment', e5: 'Step 5 of 6 · Value driver · Risk', e6: 'Step 6 of 6 · From operating value to equity',
    e0: 'Reference · Evidence', e7: 'Reference · Cash-flow detail',
    next: 'Next · Step {n} of 6', back: 'Back to {name}',
    done: 'Your valuation is ready', doneLead: 'See how the cash flows add up to value, then test how wide the range of outcomes is.',
    seeForecast: 'See how the value adds up', seeRange: 'Test the range',
    mapTitle: 'Your story in four numbers',
    mapLead: 'A good story is possible, plausible and probable. Every part of it should show up in one of these numbers.',
    growth: 'Revenue growth', growthSub: 'Year 1', margin: 'Operating margin', marginSub: 'At maturity',
    capital: 'Sales / capital', capitalSub: 'Revenue per unit of new capital', risk: 'Cost of capital', riskSub: 'WACC',
    edit: 'Edit {name}',
    bridge: 'How the value adds up', bridgeLead: 'Present value of the forecast, plus the business beyond it, less what belongs to others.',
    pvForecast: 'Cash flows · years 1–{n}', pvTerminal: 'Beyond year {n}', operating: 'Operating value',
    claims: 'Cash, debt & claims', equity: 'Equity value', perShare: 'Per share',
    terminalNote: '{pct} of operating value comes from the years after the forecast.',
    more: 'Read more', less: 'Show less',
    vsStart: '{amount} ({pct}) vs. start',
    check: 'Reality check',
    checkGrowth: 'Revenue reaches {rN} by year {n}, {x}× today’s {r0}. Is the market big enough for that?',
    checkMargin: 'Operating profit reaches {eN} in year {n}, from {e0} today.',
    checkCapital: 'The forecast reinvests {inv} in total to add {dr} of yearly revenue.',
    checkRisk: '{pct} of the value comes after year {n}, so stable growth and the cost of capital carry real weight.',
    tornado: 'What moves the value', tornadoLead: 'Each bar moves one driver both ways and holds the rest. Spend your research where the bars are widest.',
    sGrowth: 'Revenue growth · year 1', sTargetMargin: 'Mature operating margin', sSalesCapital: 'Sales / capital', sWacc: 'Cost of capital · WACC', sTerminalGrowth: 'Stable growth',
    pts: '±{n} pts', pt: '±{n} pt', rel: '±{n}%', most: '{name} matters most: it moves value by up to {pct}.', perShareAxis: 'Value per share', moves: '{d} → value ±{pct}', open: 'Open {name}'
  },
  'zh-Hans': {
    e1: '第 1 步，共 6 步 · 投资论述', e2: '第 2 步，共 6 步 · 价值驱动因素 · 成长', e3: '第 3 步，共 6 步 · 价值驱动因素 · 获利能力',
    e4: '第 4 步，共 6 步 · 价值驱动因素 · 再投资', e5: '第 5 步，共 6 步 · 价值驱动因素 · 风险', e6: '第 6 步，共 6 步 · 从营业价值到股权价值',
    e0: '参考 · 证据', e7: '参考 · 现金流量明细',
    next: '下一步 · 第 {n} 步，共 6 步', back: '返回{name}',
    done: '估值已完成', doneLead: '看看现金流量如何累加成价值，再检验结果的区间有多宽。',
    seeForecast: '查看价值如何累加', seeRange: '检验估值区间',
    mapTitle: '用四个数字说出你的故事',
    mapLead: '好的投资论述必须可能、合理，而且很可能成立。故事的每一部分，都应该反映在其中一个数字上。',
    growth: '营收成长率', growthSub: '第 1 年', margin: '营业利润率', marginSub: '成熟期',
    capital: '营收／资本', capitalSub: '每单位新资本带来的营收', risk: '资金成本', riskSub: 'WACC',
    edit: '编辑{name}',
    bridge: '价值如何累加', bridgeLead: '预测期现金流量的现值，加上预测期之后的价值，再减去属于他人的部分。',
    pvForecast: '第 1–{n} 年现金流量', pvTerminal: '第 {n} 年之后', operating: '营业价值',
    claims: '现金、负债与索偿权', equity: '股权价值', perShare: '每股价值',
    terminalNote: '营业价值中有 {pct} 来自预测期之后的年度。',
    more: '展开全文', less: '收起',
    vsStart: '较起始 {amount}（{pct}）',
    check: '合理性检查',
    checkGrowth: '第 {n} 年营收达到 {rN}，是目前 {r0} 的 {x} 倍。市场规模撑得起吗？',
    checkMargin: '第 {n} 年营业利润达到 {eN}，目前为 {e0}。',
    checkCapital: '预测期合计再投资 {inv}，换来每年新增 {dr} 的营收。',
    checkRisk: '价值中有 {pct} 来自第 {n} 年之后，稳定成长率与资金成本的影响很大。',
    tornado: '什么最影响价值', tornadoLead: '每条长条只朝两个方向调整一项驱动因素，其余维持不变。长条越宽，越值得投入研究。',
    sGrowth: '营收成长率 · 第 1 年', sTargetMargin: '成熟期营业利润率', sSalesCapital: '营收／资本', sWacc: '资金成本 · WACC', sTerminalGrowth: '稳定成长率',
    pts: '±{n} 个百分点', pt: '±{n} 个百分点', rel: '±{n}%', most: '{name}影响最大：最多可让价值变动 {pct}。', perShareAxis: '每股价值', moves: '{d} → 价值 ±{pct}', open: '前往{name}'
  }
};
const lang = () => (COPY[getLocale?.()] ? getLocale() : 'en');
const copy = (key, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), COPY[lang()][key]);
const JOURNEY = [1, 2, 3, 4, 5, 6];
const STORY_SENS = {growth: 'growth', margin: 'targetMargin', capital: 'salesCapital', risk: 'wacc'};
const DRIVERS = [
  {key: 'growth', step: 2, input: '#g-growth', unit: '%'},
  {key: 'margin', step: 3, input: '#g-targetMargin', unit: '%'},
  {key: 'capital', step: 4, input: '#g-salesCapital', unit: '×'},
  {key: 'risk', step: 5, input: '#g-wacc', unit: '%'}
];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const setText = (n, t) => { if (n && n.textContent !== t) n.textContent = t; };
const tabName = id => document.getElementById('group-' + id)?.textContent.trim() || '';
const stepTitle = id => document.querySelector(`#editor-group-${id} .editor-intro h2`)?.textContent.trim() || '';

function goStep(id) {
  const tab = document.getElementById('group-' + id);
  if (!tab) return;
  tab.click();
  const bar = document.querySelector('.guided-screen .assumption-tabs');
  if (bar && bar.getBoundingClientRect().top < 64) bar.scrollIntoView({block: 'start', behavior: reduced() ? 'auto' : 'smooth'});
}
function goView(view) {
  document.getElementById('guided-view-' + view)?.click();
  const tabs = document.querySelector('.guided-screen .workspace-view-tabs');
  if (tabs && tabs.getBoundingClientRect().top < 64) tabs.scrollIntoView({block: 'start', behavior: reduced() ? 'auto' : 'smooth'});
}

// ---------- step eyebrows ----------
function eyebrows() {
  for (const section of document.querySelectorAll('.guided-screen [data-editor-group]')) {
    const intro = section.querySelector(':scope > .editor-intro');
    if (!intro) continue;
    let tag = intro.querySelector(':scope > .rx-journey-eyebrow');
    if (!tag) { tag = el('span', 'eyebrow rx-journey-eyebrow'); intro.prepend(tag); }
    setText(tag, copy('e' + section.dataset.editorGroup));
  }
}

// ---------- the next-step card at the end of each step ----------
function nextCards() {
  for (const id of JOURNEY) {
    const section = document.getElementById('editor-group-' + id);
    if (!section) continue;
    let card = section.querySelector(':scope > .rx-next');
    if (!card) {
      card = el('div', 'rx-next'); card.setAttribute('role', 'navigation'); card.setAttribute('aria-label', copy('next', {n: Math.min(id + 1, 6)}));
      if (id < 6) {
        const next = el('button', 'rx-next-go');
        next.type = 'button';
        next.append(el('span', 'rx-next-kicker'), el('span', 'rx-next-title'), el('span', 'rx-next-arrow', '→'));
        next.querySelector('.rx-next-arrow').setAttribute('aria-hidden', 'true');
        next.addEventListener('click', () => goStep(id + 1));
        card.append(next);
      } else {
        const done = el('div', 'rx-next-done');
        done.append(el('b'), el('p'));
        const actions = el('div', 'rx-next-actions');
        const forecast = el('button', 'rx-next-primary'); forecast.type = 'button'; forecast.addEventListener('click', () => goView('result'));
        const range = el('button', 'rx-next-secondary'); range.type = 'button'; range.addEventListener('click', () => goView('simulation'));
        actions.append(forecast, range);
        done.append(actions);
        card.append(done);
      }
      if (id > 1) {
        const back = el('button', 'rx-next-back'); back.type = 'button';
        back.addEventListener('click', () => goStep(id - 1));
        card.append(back);
      }
      section.append(card);
    }
    if (id < 6) {
      setText(card.querySelector('.rx-next-kicker'), copy('next', {n: id + 1}) + ' · ' + tabName(id + 1));
      setText(card.querySelector('.rx-next-title'), stepTitle(id + 1));
    } else {
      setText(card.querySelector('.rx-next-done > b'), copy('done'));
      setText(card.querySelector('.rx-next-done > p'), copy('doneLead'));
      setText(card.querySelector('.rx-next-primary'), copy('seeForecast') + ' →');
      setText(card.querySelector('.rx-next-secondary'), copy('seeRange'));
    }
    const back = card.querySelector('.rx-next-back');
    if (back) setText(back, '← ' + copy('back', {name: tabName(id - 1)}));
  }
}

// ---------- the Story step: the four numbers the story must become ----------
function readDriver(d) {
  const input = document.querySelector(d.input);
  let raw = input?.value?.trim();
  if (!raw && d.key === 'growth') {
    const start = Number(document.querySelector('#editor-group-2 .growth-path-controls')?.getAttribute('data-start'));
    if (Number.isFinite(start)) raw = String(Number((start * 100).toPrecision(6)));
  }
  if (!raw) return '—';
  return raw + d.unit;
}
function storyMap() {
  const section = document.getElementById('editor-group-1');
  const intro = section?.querySelector(':scope > .editor-intro');
  if (!intro) return;
  let map = section.querySelector(':scope > .rx-story-map');
  if (!map) {
    map = el('section', 'rx-story-map');
    map.append(el('h3', 'rx-story-title'), el('p', 'rx-story-lead'));
    const grid = el('div', 'rx-story-grid');
    DRIVERS.forEach((d, i) => {
      const cell = el('button', 'rx-story-cell'); cell.type = 'button'; cell.dataset.driver = d.key;
      cell.append(el('span', 'rx-story-n', String(i + 2)), el('span', 'rx-story-label'), el('b', 'rx-story-value'), el('small', 'rx-story-sub'), el('span', 'rx-story-impact'));
      cell.addEventListener('click', () => goStep(d.step));
      grid.append(cell);
    });
    map.append(grid);
    intro.after(map);
  }
  setText(map.querySelector('.rx-story-title'), copy('mapTitle'));
  setText(map.querySelector('.rx-story-lead'), copy('mapLead'));
  for (const d of DRIVERS) {
    const cell = map.querySelector(`[data-driver="${d.key}"]`);
    setText(cell.querySelector('.rx-story-label'), copy(d.key));
    setText(cell.querySelector('.rx-story-value'), readDriver(d));
    setText(cell.querySelector('.rx-story-sub'), copy(d.key + 'Sub'));
    const sens = sensitivity(), r = sens?.rows.find(x => x.key === STORY_SENS[d.key]);
    const impact = cell.querySelector('.rx-story-impact');
    setText(impact, r ? copy('moves', {d: nudge(r), pct: pctText(swing(r, sens.base))}) : '');
    impact.style.setProperty('--w', r ? Math.min(1, swing(r, sens.base) / Math.max(...sens.rows.map(x => swing(x, sens.base)))).toFixed(3) : '0');
    const label = copy('edit', {name: copy(d.key)});
    if (cell.getAttribute('aria-label') !== label + ' · ' + readDriver(d)) cell.setAttribute('aria-label', label + ' · ' + readDriver(d));
  }
}

// ---------- Forecast: how the value adds up ----------
const symbol = c => (c === 'USD' ? '$' : c === 'TWD' ? 'NT$' : '');
const formats = new Map();
const numberFormat = (max, min = 0) => {
  const k = lang() + max + '/' + min;
  if (!formats.has(k)) formats.set(k, new Intl.NumberFormat(lang() === 'en' ? 'en-US' : 'zh-CN', {maximumFractionDigits: max, minimumFractionDigits: min}));
  return formats.get(k);
};
function money(m, currency) {
  if (!Number.isFinite(m)) return '—';
  const a = Math.abs(m), [s, u] = a >= 1e6 ? [1e6, 'T'] : a >= 1e3 ? [1e3, 'B'] : [1, 'M'];
  const sym = symbol(currency);
  const digits = a / s >= 100 ? 0 : a / s >= 10 ? 1 : 2;
  const body = numberFormat(digits).format(a / s) + u;
  return (m < 0 ? '−' : '') + (sym ? sym + body : body + ' ' + currency);
}
function bridge() {
  const pane = document.getElementById('guided-pane-result');
  const results = document.getElementById('guided-results');
  // Drawn only while the Forecast view is open; it catches up when opened.
  if (!pane || !results || pane.hidden) return;
  const raw = results.getAttribute('data-bridge');
  let b = null;
  try { b = raw ? JSON.parse(raw) : null; } catch { b = null; }
  let box = pane.querySelector(':scope > .rx-bridge');
  if (!b || ![b.forecastPV, b.terminalPV, b.enterprise, b.equity].every(Number.isFinite)) { if (box) box.hidden = true; return; }
  const key = raw + '|' + lang();
  if (box && box.dataset.key === key) return;
  if (!box) {
    box = el('section', 'rx-bridge');
    box.append(el('div', 'rx-bridge-head'));
    box.querySelector('.rx-bridge-head').append(el('h3'), el('p'));
    const plot = el('div', 'rx-bridge-plot'); plot.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) {
      const col = el('div', 'rx-bridge-col');
      col.append(el('div', 'rx-bridge-track'));
      col.firstChild.append(el('i', 'rx-bridge-bar'));
      plot.append(col);
    }
    const legend = el('dl', 'rx-bridge-legend');
    for (let i = 0; i < 5; i++) { const d = el('div', 'rx-bridge-item'); d.append(el('dt'), el('dd')); legend.append(d); }
    const per = el('div', 'rx-bridge-per'); per.append(el('span'), el('b'));
    box.append(plot, legend, per, el('p', 'rx-bridge-note'));
    pane.prepend(box);
  }
  box.hidden = false;
  box.dataset.key = key;
  const net = b.equity - b.enterprise;
  const steps = [
    {name: copy('pvForecast', {n: b.years}), from: 0, to: b.forecastPV, kind: 'part'},
    {name: copy('pvTerminal', {n: b.years}), from: b.forecastPV, to: b.enterprise, kind: 'part is-terminal'},
    {name: copy('operating'), from: 0, to: b.enterprise, kind: 'total'},
    {name: copy('claims'), from: b.enterprise, to: b.equity, kind: net < 0 ? 'claim is-down' : 'claim is-up', signed: true},
    {name: copy('equity'), from: 0, to: b.equity, kind: 'total is-equity'}
  ];
  const lo = Math.min(0, ...steps.flatMap(s => [s.from, s.to])), hi = Math.max(...steps.flatMap(s => [s.from, s.to]));
  const span = hi - lo || 1;
  const cols = box.querySelectorAll('.rx-bridge-col'), items = box.querySelectorAll('.rx-bridge-item');
  steps.forEach((s, i) => {
    const bar = cols[i].querySelector('.rx-bridge-bar');
    const base = (Math.min(s.from, s.to) - lo) / span, h = Math.abs(s.to - s.from) / span;
    bar.className = 'rx-bridge-bar ' + s.kind;
    bar.style.setProperty('--b', base.toFixed(4));
    bar.style.setProperty('--h', Math.max(h, .004).toFixed(4));
    const delta = s.to - s.from;
    setText(items[i].querySelector('dt'), s.name);
    setText(items[i].querySelector('dd'), s.signed ? (delta >= 0 ? '+' : '') + money(delta, b.currency) : money(s.kind.startsWith('part') ? delta : s.to, b.currency));
    items[i].className = 'rx-bridge-item ' + s.kind;
  });
  setText(box.querySelector('.rx-bridge-head h3'), copy('bridge'));
  setText(box.querySelector('.rx-bridge-head p'), copy('bridgeLead'));
  setText(box.querySelector('.rx-bridge-per span'), copy('perShare'));
  setText(box.querySelector('.rx-bridge-per b'), Number.isFinite(b.perShare) ? numberFormat(2, 2).format(b.perShare) + ' ' + b.currency : '—');
  const pct = b.enterprise > 0 ? Math.round(b.terminalPV / b.enterprise * 100) + '%' : null;
  const note = box.querySelector('.rx-bridge-note');
  note.hidden = !pct;
  if (pct) setText(note, copy('terminalNote', {pct}));
}

// ---------- long fine print folds to two lines, with a toggle ----------
const overflow = new Map();
let resizeTimer = 0;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { overflow.clear(); for (const p of document.querySelectorAll('.rx-clamp, p.micro')) p.__rxText = undefined; finePrint(); }, 200); });
function unclamp(p) {
  p.classList.remove('rx-clamp', 'is-open');
  if (p.nextElementSibling?.classList.contains('rx-more')) p.nextElementSibling.remove();
}
function finePrint() {
  for (const p of document.querySelectorAll('.guided-screen :is(.assumption-editor, .mc-setup) p.micro')) {
    if (p.closest('.rx-next, .rx-story-map') || p.getAttribute('role') === 'status') continue;
    // Measured once per text; a hidden paragraph is measured when it is shown.
    const text = p.textContent;
    if (p.__rxText === text) continue;
    if (text.length < 160) { p.__rxText = text; unclamp(p); continue; }
    // Re-rendered panels repeat the same text: reuse the measurement instead
    // of forcing layout again. Hidden steps and closed disclosures wait.
    let over = overflow.get(text);
    if (over === undefined) {
      if (p.closest('[hidden], details:not([open])')) continue;
      p.classList.add('rx-clamp'); p.classList.remove('is-open');
      over = p.scrollHeight > p.clientHeight + 2;
      overflow.set(text, over);
    }
    p.__rxText = text;
    if (!over) { unclamp(p); continue; }
    p.classList.add('rx-clamp'); p.classList.remove('is-open');
    let b = p.nextElementSibling?.classList.contains('rx-more') ? p.nextElementSibling : null;
    if (!b) {
      b = el('button', 'rx-more'); b.type = 'button';
      b.addEventListener('click', () => { const open = p.classList.toggle('is-open'); b.setAttribute('aria-expanded', String(open)); setText(b, copy(open ? 'less' : 'more')); });
      p.after(b);
    }
    b.setAttribute('aria-expanded', 'false');
    setText(b, copy('more'));
  }
}

// ---------- what moves the value (one driver at a time) ----------
const SENS = {growth: {label: 'sGrowth', step: 2, unit: '%'}, targetMargin: {label: 'sTargetMargin', step: 3, unit: '%'}, salesCapital: {label: 'sSalesCapital', step: 4, unit: '×'}, wacc: {label: 'sWacc', step: 5, unit: '%'}, terminalGrowth: {label: 'sTerminalGrowth', step: 5, unit: '%'}};
let sensRaw = '', sensData = null;
function sensitivity() {
  const raw = document.getElementById('guided-results')?.getAttribute('data-sensitivity') || '';
  if (raw !== sensRaw) {
    sensRaw = raw;
    try { sensData = raw ? JSON.parse(raw) : null; } catch { sensData = null; }
  }
  return sensData && Number.isFinite(sensData.base) && sensData.base > 0 ? sensData : null;
}
const nudge = r => r.relative ? copy('rel', {n: Math.round(r.step * 100)}) : copy(r.step === .01 ? 'pt' : 'pts', {n: Number((r.step * 100).toFixed(1))});
const swing = (r, base) => Math.max(Math.abs((r.low ?? base) - base), Math.abs((r.high ?? base) - base)) / base;
const pctText = x => Math.round(x * 100) + '%';
function tornado() {
  const pane = document.getElementById('guided-pane-result');
  if (!pane || pane.hidden) return;
  const d = sensitivity();
  let box = pane.querySelector(':scope > .rx-tornado');
  if (!d || !d.rows.length) { if (box) box.hidden = true; return; }
  const key = sensRaw + '|' + lang();
  if (box && box.dataset.key === key && !box.hidden) return;
  if (!box) {
    box = el('section', 'rx-tornado');
    box.append(el('h3'), el('p', 'rx-tornado-lead'), el('div', 'rx-tornado-rows'), el('p', 'rx-tornado-most'));
    const after = pane.querySelector(':scope > #guided-cashflow-visual');
    after ? after.after(box) : pane.append(box);
  }
  box.hidden = false;
  box.dataset.key = key;
  setText(box.querySelector('h3'), copy('tornado'));
  setText(box.querySelector('.rx-tornado-lead'), copy('tornadoLead'));
  const base = d.base, rows = d.rows.slice().sort((a, b) => swing(b, base) - swing(a, base));
  const ends = rows.flatMap(r => [r.low, r.high]).filter(Number.isFinite);
  const lo = Math.min(base, ...ends), hi = Math.max(base, ...ends), span = hi - lo || 1, at = v => (v - lo) / span;
  const host = box.querySelector('.rx-tornado-rows');
  // Rows are keyed by driver so a re-sort moves them rather than rebuilding them.
  rows.forEach((r, i) => {
    let row = host.querySelector(`[data-driver="${r.key}"]`);
    if (!row) {
      row = el('button', 'rx-tn-row'); row.type = 'button'; row.dataset.driver = r.key;
      row.append(el('span', 'rx-tn-label'), el('span', 'rx-tn-plot'), el('span', 'rx-tn-lo'), el('span', 'rx-tn-hi'));
      row.querySelector('.rx-tn-label').append(el('b'), el('small'));
      row.querySelector('.rx-tn-plot').append(el('i', 'rx-tn-down'), el('i', 'rx-tn-up'), el('i', 'rx-tn-base'));
      row.addEventListener('click', () => { goStep(SENS[r.key].step); document.getElementById('guided-view-inputs')?.click(); });
    }
    if (host.children[i] !== row) host.insertBefore(row, host.children[i] || null);
    const meta = SENS[r.key] || {label: r.key, unit: ''};
    const shown = meta.unit === '×' ? Number(r.value.toFixed(2)) + '×' : Number((r.value * 100).toFixed(2)) + '%';
    setText(row.querySelector('.rx-tn-label b'), copy(meta.label));
    setText(row.querySelector('.rx-tn-label small'), shown + ' · ' + nudge(r));
    const vals = [r.low, r.high].filter(Number.isFinite), min = Math.min(base, ...vals), max = Math.max(base, ...vals);
    const down = row.querySelector('.rx-tn-down'), up = row.querySelector('.rx-tn-up');
    down.style.setProperty('--a', at(min).toFixed(4)); down.style.setProperty('--w', (at(base) - at(min)).toFixed(4));
    up.style.setProperty('--a', at(base).toFixed(4)); up.style.setProperty('--w', (at(max) - at(base)).toFixed(4));
    row.querySelector('.rx-tn-base').style.setProperty('--a', at(base).toFixed(4));
    setText(row.querySelector('.rx-tn-lo'), numberFormat(2, 2).format(min));
    setText(row.querySelector('.rx-tn-hi'), numberFormat(2, 2).format(max));
    const label = copy('open', {name: copy(meta.label)}) + ' · ' + numberFormat(2, 2).format(min) + '–' + numberFormat(2, 2).format(max) + ' ' + d.currency;
    if (row.getAttribute('aria-label') !== label) row.setAttribute('aria-label', label);
  });
  for (const row of [...host.children]) if (!rows.some(r => r.key === row.dataset.driver)) row.remove();
  const top = rows[0];
  setText(box.querySelector('.rx-tornado-most'), copy('most', {name: copy(SENS[top.key]?.label || top.key), pct: pctText(swing(top, base))}));
}

// ---------- reality checks: what each driver implies, in plain numbers ----------
// Written a moment after edits settle, so dragging never pays for the sentence.
let checkTimer = 0;
function scheduleChecks() { clearTimeout(checkTimer); checkTimer = setTimeout(checks, 300); }
function checks() {
  const raw = document.getElementById('guided-results')?.getAttribute('data-bridge');
  let b = null;
  try { b = raw ? JSON.parse(raw) : null; } catch { b = null; }
  for (const id of [2, 3, 4, 5]) {
    const section = document.getElementById('editor-group-' + id);
    if (!section || section.hidden) continue;
    let text = '';
    if (b && Number.isFinite(b.revenueN) && b.revenue0 > 0) {
      const m = v => money(v, b.currency), n = b.years;
      if (id === 2) text = copy('checkGrowth', {rN: m(b.revenueN), n, x: (b.revenueN / b.revenue0).toFixed(1), r0: m(b.revenue0)});
      if (id === 3 && Number.isFinite(b.ebitN)) text = copy('checkMargin', {eN: m(b.ebitN), n, e0: m(b.ebit0)});
      if (id === 4 && Number.isFinite(b.reinvestment)) text = copy('checkCapital', {inv: m(b.reinvestment), dr: m(b.revenueN - b.revenue0)});
      if (id === 5 && b.enterprise > 0) text = copy('checkRisk', {pct: Math.round(b.terminalPV / b.enterprise * 100) + '%', n});
    }
    let box = section.querySelector(':scope > .rx-check');
    if (!text) { box?.remove(); continue; }
    if (!box) {
      box = el('p', 'rx-check'); box.append(el('b'), el('span'));
      const next = section.querySelector(':scope > .rx-next');
      next ? next.before(box) : section.append(box);
    }
    setText(box.querySelector('b'), copy('check'));
    setText(box.querySelector('span'), text);
  }
}

// ---------- the result card keeps your cumulative change in view ----------
// Drawn by CSS from a custom property on the persistent results host: the card
// is rebuilt on every edit, and writing nothing into it keeps edits cheap.
function versusStart() {
  const host = document.getElementById('guided-results');
  if (!host || !host.closest('.guided-screen')) return;
  const text = host.querySelector('[data-value-change]')?.textContent.trim() || '';
  // The sign may follow a translated prefix (较起始案例 +10.92…).
  const state = /−\s?\d/.test(text) ? 'down' : /\+\s?\d/.test(text) ? 'up' : '';
  if ((host.getAttribute('data-rx-vs') || '') !== state) state ? host.setAttribute('data-rx-vs', state) : host.removeAttribute('data-rx-vs');
  // Short form: the amount and the percentage, read from the app's own sentence.
  const amount = text.match(/[+−]\s?[\d,.]+(?!\d*%)/)?.[0], pct = text.match(/[+−]\s?[\d,.]+%/)?.[0];
  const short = amount && pct ? copy('vsStart', {amount: amount.replace(/\s/g, ''), pct: pct.replace(/\s/g, '')}) : text;
  const value = state ? JSON.stringify(short) : '';
  if (host.style.getPropertyValue('--rx-vs') !== value) value ? host.style.setProperty('--rx-vs', value) : host.style.removeProperty('--rx-vs');
}

function scan() {
  if (!document.querySelector('.guided-screen')) return;
  finePrint();
  eyebrows();
  storyMap();
  nextCards();
  versusStart();
  scheduleChecks();
  bridge();
  tornado();
}
onScan(scan);
// The four story numbers follow the sliders and fields as they move.
document.addEventListener('input', e => { if (e.target?.matches?.('#g-growth, #g-targetMargin, #g-salesCapital, #g-wacc')) storyMap(); }, true);

// ---------- phones: the header steps aside while you read down the page ----------
// Scrolling down hides it (transform only); any upward scroll brings it back.
{
  const phone = matchMedia('(max-width: 600px)');
  let lastY = scrollY, hidden = false, queued = false;
  const header = () => document.querySelector('body > aside');
  const apply = hide => { if (hide === hidden) return; hidden = hide; header()?.classList.toggle('rx-header-away', hide); document.documentElement.toggleAttribute('data-rx-header-away', hide); };
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const y = scrollY, dy = y - lastY;
      if (!phone.matches || y < 140) { apply(false); lastY = y; return; }
      if (Math.abs(dy) < 8) return;
      // Keep it visible while a field inside it, or its menu, has focus.
      if (!header()?.contains(document.activeElement) && !document.querySelector('.appearance-disclosure[open]')) apply(dy > 0);
      lastY = y;
    });
  }, {passive: true});
  phone.addEventListener('change', () => apply(false));
}
