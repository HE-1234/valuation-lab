// Presentation only. State and focus commit synchronously; animations never gate input.
const active = new Map();
const watched = new WeakSet();
const easing = 'cubic-bezier(.2,.8,.2,1)';
export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function cancelMotion(scope) {
 for (const [key, entry] of [...active]) {
  if (scope && scope !== key && scope !== entry.node && !scope.contains?.(entry.node)) continue;
  active.delete(key);
  entry.animation.onfinish = null;
  entry.animation.oncancel = null;
  entry.animation.cancel();
 }
}
function watch(node) {
 const view = node.ownerDocument?.defaultView || globalThis;
 if (watched.has(view)) return;
 watched.add(view);
 const media = view.matchMedia?.('(prefers-reduced-motion: reduce)');
 const stop = () => { if (media?.matches) cancelMotion(); };
 media?.addEventListener?.('change', stop);
 if (!media?.addEventListener) media?.addListener?.(stop);
 node.ownerDocument?.addEventListener?.('visibilitychange', () => {
  if (node.ownerDocument.hidden) cancelMotion();
 });
 view.addEventListener?.('valuation:tab-change', () => cancelMotion());
}
function animate(node, scope, frames, duration) {
 if (!node) return null;
 cancelMotion(scope);
 if (typeof node.animate !== 'function' || reducedMotion() || node.ownerDocument?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return null;
 watch(node);
 const animation = node.animate(frames, {duration, easing, fill: 'none'});
 const entry = {node, animation};
 active.set(scope, entry);
 const finish = () => { if (active.get(scope) === entry) active.delete(scope); };
 animation.onfinish = finish;
 animation.oncancel = finish;
 return animation;
}
export function enterPanel(node, direction = 1, scope = node?.parentElement || node) {
 return animate(node, scope, [
  {opacity: .3, transform: `translateY(${direction < 0 ? -6 : 6}px)`},
  {opacity: 1, transform: 'translateY(0)'}
 ], 240);
}
// Feedback is confined to the result, never the editor or its input nodes.
export function updateFeedback(node, scope = node) {
 return animate(node, scope, [
  {opacity: .45, transform: 'translateY(4px)'},
  {opacity: 1, transform: 'translateY(0)'}
 ], 280);
}
