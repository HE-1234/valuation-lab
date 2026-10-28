// Presentation only. Reads layout and writes CSS custom properties / data
// attributes; never changes application state, routes, inputs or focus.
const root = document.documentElement;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const active = () => root.dataset.skin && root.dataset.skin !== 'original';

/* ---------- sliding selection indicator ---------- */
const LISTS = 'body > aside nav, .mode-navigation, [role="tablist"], .workspace-mobile-tabs, .assumption-tabs';
const SELECTED = ':is(.active, [aria-current="page"], [aria-selected="true"], [aria-pressed="true"])';

function place(list) {
  const chosen = [...list.children].find(c => c.matches(SELECTED) && c.offsetParent);
  if (!list.hasAttribute('data-sk-ind')) list.setAttribute('data-sk-ind', 'init');
  if (!chosen) { list.style.setProperty('--sk-ind-o', '0'); return; }
  const s = list.style;
  s.setProperty('--sk-ind-x', `${chosen.offsetLeft}px`);
  s.setProperty('--sk-ind-y', `${chosen.offsetTop}px`);
  s.setProperty('--sk-ind-w', `${chosen.offsetWidth}px`);
  s.setProperty('--sk-ind-h', `${chosen.offsetHeight}px`);
  s.setProperty('--sk-ind-o', '1');
  // The first placement lands without travelling; later changes glide.
  if (list.getAttribute('data-sk-ind') === 'init') requestAnimationFrame(() => list.setAttribute('data-sk-ind', 'live'));
}

/* ---------- range fill (WebKit has no native progress pseudo-element) ---------- */
function fill(input) {
  const min = +input.min || 0, max = input.max === '' ? 100 : +input.max, v = +input.value;
  const pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
  input.style.setProperty('--sk-fill', `${Math.max(0, Math.min(100, pct))}%`);
}

let queued = false;
function refresh() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    if (!active()) return;
    for (const list of document.querySelectorAll(LISTS)) place(list);
    for (const input of document.querySelectorAll('input[type="range"]')) fill(input);
  });
}
new MutationObserver(refresh).observe(document.body, {
  subtree: true, childList: true, attributes: true,
  attributeFilter: ['class', 'aria-selected', 'aria-current', 'aria-pressed', 'hidden', 'value']
});
addEventListener('resize', refresh, {passive: true});
document.addEventListener('input', e => { if (active() && e.target.matches?.('input[type="range"]')) fill(e.target); }, true);
document.fonts?.ready.then(refresh);

/* ---------- header state ---------- */
const onScroll = () => root.toggleAttribute('data-sk-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, {passive: true});
onScroll();

/* ---------- the page-load moment ---------- */
function rendered() {
  return document.querySelector('.page:not(.hidden) :is(.screen-workspace, .panel, .learn-card, .learn-course)');
}
function begin() {
  root.removeAttribute('data-sk-intro');
  if (!active() || reduced()) return;
  root.setAttribute('data-sk-enter', '');
  root.setAttribute('data-sk-play', '');
  setTimeout(() => root.removeAttribute('data-sk-enter'), 900);
  // Version files key their single signature animation to data-sk-play. It is
  // removed afterwards so re-rendered nodes never replay it while editing.
  setTimeout(() => root.removeAttribute('data-sk-play'), 2600);
}
if (root.hasAttribute('data-sk-intro')) {
  const started = performance.now();
  const wait = () => (rendered() || performance.now() - started > 1600) ? requestAnimationFrame(() => { refresh(); begin(); }) : setTimeout(wait, 40);
  wait();
}

/* Route changes answer the click with a brief settle of the new section. */
addEventListener('valuation:tab-change', () => {
  if (!active() || reduced()) return;
  requestAnimationFrame(() => {
    const page = document.querySelector('.page:not(.hidden)');
    if (!page) return;
    page.classList.remove('sk-route-enter');
    void page.offsetWidth;
    page.classList.add('sk-route-enter');
    setTimeout(() => page.classList.remove('sk-route-enter'), 500);
  });
});

refresh();

/* The Annual Report interaction layers: scrubbing, history strips, live deltas, simulation rain. */
import('./report-interactions.js');
import('./report-simulation.js');
import('./report-ux.js');
import('./report-phases.js');
import('./report-paths.js');
import('./report-journey.js');
import('./report-mc-guide.js');
import('./report-reviewed.js');
