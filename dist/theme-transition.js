// Presentation-only enhancement. Theme state remains owned by setTheme.
// A skipped ViewTransition can still invoke its update callback: guard every
// asynchronous continuation so an older click can never overwrite a newer one.
export function createThemeTransition(apply, doc = document, win = window) {
 const root = doc.documentElement;
 const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
 let current = null;
 function cleanup(record) {
  if (current !== record) return;
  current = null;
  win.clearTimeout(record.timer);
  root.removeAttribute('data-theme-sweep');
 }
 function commit(record) {
  if (current !== record || record.applied) return;
  record.applied = true;
  apply(record.theme, record.persist);
 }
 function stop(commitPending = true) {
  const record = current;
  if (!record) return;
  if (commitPending) commit(record);
  cleanup(record);
  try { record.transition?.skipTransition(); } catch { /* Optional effect only. */ }
 }
 function select(theme, persist = true, animate = true) {
  stop(false);
  if (!animate || media?.matches || doc.hidden ||
      typeof doc.startViewTransition !== 'function' || root.dataset.theme === theme) {
   apply(theme, persist);
   return;
  }
  const record = {theme, persist, applied: false, transition: null, timer: null};
  current = record;
  root.setAttribute('data-theme-sweep', '');
  const settle = () => { if (current === record) stop(true); };
  try {
   record.transition = doc.startViewTransition(() => commit(record));
   // Skip/failure promises must be consumed; animation failure never loses intent.
   Promise.resolve(record.transition.ready).catch(settle);
   Promise.resolve(record.transition.updateCallbackDone).catch(settle);
   Promise.resolve(record.transition.finished).then(settle, settle);
   record.timer = win.setTimeout(settle, 1800);
  } catch { settle(); }
 }
 const onVisibility = () => { if (doc.hidden) stop(); };
 const onMotion = () => { if (media.matches) stop(); };
 const onResize = () => stop();
 doc.addEventListener('visibilitychange', onVisibility);
 win.addEventListener('pagehide', onResize);
 win.addEventListener('resize', onResize, {passive: true});
 media?.addEventListener?.('change', onMotion);
 return {select, finish: () => stop()};
}
