// A nonmodal evidence view. Move, never clone, existing content so form values,
// details state, chart listeners, and source links survive a round trip.
let nextPanelId = 0;

const scrollPosition = node => ({node, top: node.scrollTop || 0, left: node.scrollLeft || 0});

function restoreScroll(positions) {
 for (const {node, top, left} of positions) {
  if (node.isConnected === false) continue;
  node.scrollTop = top;
  node.scrollLeft = left;
 }
}

function treeScroll(nodes) {
 const unique = new Set();
 for (const node of nodes) {
  if (node.nodeType === 1) unique.add(node);
  for (const child of node.querySelectorAll?.('*') || []) unique.add(child);
 }
 return [...unique].map(scrollPosition);
}

function contextScroll(document, nodes) {
 const unique = new Set();
 for (let node of nodes) {
  while (node) {
   if (node.nodeType === 1) unique.add(node);
   node = node.parentElement;
  }
 }
 if (document.scrollingElement) unique.add(document.scrollingElement);
 return [...unique].map(scrollPosition);
}

function restoreAttribute(node, name, value) {
 if (!node?.setAttribute) return;
 if (value === null) node.removeAttribute(name);
 else node.setAttribute(name, value);
}

function hiddenByAncestor(node) {
 for (let current = node; current; current = current.parentElement) {
  const hiddenAttribute = current.getAttribute?.('hidden');
  if (current.hidden || current.hidden === undefined && hiddenAttribute != null ||
   current.classList?.contains('hidden') || (current.getAttribute?.('class') || '').split(/\s+/).includes('hidden')) return true;
 }
 return false;
}

function focusWithoutScrolling(node) {
 if (!node?.focus || node.isConnected === false || hiddenByAncestor(node)) return;
 node.focus({preventScroll: true});
}

/**
 * createContextualEvidencePanel({host, id?, title?, onOpen?, onClose?})
 *
 * open({invoker, title?, nodes?: Node[], html?: string, key?: string}) opens in
 * one action. `html` is for application-owned markup only; prefer existing nodes.
 * A stable key preserves the panel's scroll between opens. Nodes retain their
 * own scroll and state without a key. Existing nodes are not unhidden or opened:
 * callers control disclosure state and should park them in a hidden container.
 *
 * close({restoreFocus?: boolean}) restores nodes synchronously, before returning.
 * Call close({restoreFocus:false}) before replacing an editor's markup.
 * Callbacks receive {element, invoker, key}; onClose also receives reason.
 */
export function createContextualEvidencePanel({host, id, title = 'Evidence', onOpen, onClose} = {}) {
 if (!host?.ownerDocument || !host.appendChild) throw new TypeError('An evidence panel needs a DOM host.');
 const document = host.ownerDocument;
 const panelId = id || `contextual-evidence-${++nextPanelId}`;
 const element = document.createElement('section');
 element.id = panelId;
 element.className = 'contextual-evidence-panel';
 element.setAttribute('role', 'region');
 element.setAttribute('aria-labelledby', `${panelId}-title`);
 element.setAttribute('data-state', 'closed');
 element.hidden = true;
 const header = document.createElement('div');
 header.className = 'contextual-evidence-header';
 const heading = document.createElement('h2');
 heading.id = `${panelId}-title`;
 heading.className = 'contextual-evidence-title';
 heading.textContent = title;
 const closeButton = document.createElement('button');
 closeButton.type = 'button';
 closeButton.className = 'contextual-evidence-close';
 closeButton.textContent = 'Close';
 closeButton.setAttribute('aria-label', 'Close evidence');
 const content = document.createElement('div');
 content.className = 'contextual-evidence-content';
 content.tabIndex = 0;
 content.setAttribute('aria-label', 'Evidence details');
 header.appendChild(heading);
 header.appendChild(closeButton);
 element.appendChild(header);
 element.appendChild(content);
 host.appendChild(element);

 const view = document.defaultView;
 const media = view?.matchMedia?.('(prefers-reduced-motion: reduce)') ||
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
 const keyedPositions = new Map();
 const nodePositions = new WeakMap();
 let session = null;
 let animation = null;
 let animationVersion = 0;
 let destroyed = false;

 function cancelMotion() {
  animationVersion++;
  if (!animation) return;
  animation.onfinish = null;
  animation.cancel();
  animation = null;
 }

 function animateOpen(replacing) {
  cancelMotion();
  const target = replacing ? content : element;
  if (media?.matches || typeof target.animate !== 'function') return;
  const version = animationVersion;
  const frames = [{opacity: .35, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}];
  animation = target.animate(frames, {
   duration: 280,
   easing: 'cubic-bezier(.2,.8,.2,1)',
   fill: 'none'
  });
  animation.onfinish = () => { if (version === animationVersion) animation = null; };
 }

 function revealHeader() {
  // Explicit evidence navigation may reveal its header. Ordinary edits and tabs never scroll.
  const bounds = header.getBoundingClientRect?.();
  if (bounds && Number.isFinite(view?.innerHeight) && (bounds.top < 0 || bounds.bottom > view.innerHeight)) {
   element.scrollIntoView?.({block: 'start', behavior: 'auto'});
  }
 }

 function rememberPosition(current) {
  const position = {top: content.scrollTop || 0, left: content.scrollLeft || 0,
   panelTop: element.scrollTop || 0, panelLeft: element.scrollLeft || 0};
  if (current.key !== undefined && current.key !== null) keyedPositions.set(current.key, position);
  else if (current.identity) nodePositions.set(current.identity, position);
 }

 function rememberedPosition(current) {
  return current.key !== undefined && current.key !== null ? keyedPositions.get(current.key) :
   current.identity ? nodePositions.get(current.identity) : undefined;
 }

 function restoreContent(current) {
  rememberPosition(current);
  const positions = treeScroll(current.records.map(record => record.node));
  for (const {node, placeholder, parent, nextSibling} of current.records) {
   if (placeholder?.parentNode) {
    placeholder.parentNode.insertBefore(node, placeholder);
    placeholder.remove();
   } else if (parent && parent.isConnected === false) {
    // A caller replaced the editor while evidence was open. Restore only the
    // detached old tree; never put stale evidence into a newly rendered editor.
    parent.insertBefore(node, nextSibling?.parentNode === parent ? nextSibling : null);
   } else {
    node.remove();
   }
  }
  content.replaceChildren();
  restoreScroll(positions);
  restoreAttribute(current.invoker, 'aria-controls', current.controls);
  restoreAttribute(current.invoker, 'aria-expanded', current.expanded);
 }

 function close({restoreFocus = true, reason = 'close'} = {}) {
  if (!session) return false;
  cancelMotion();
  const current = session;
  session = null;
  restoreContent(current);
  element.hidden = true;
  element.setAttribute('data-state', 'closed');
  // Layout mode must return before restoring focus (especially on mobile).
  onClose?.({element, invoker: current.invoker, key: current.key, reason});
  if (restoreFocus) focusWithoutScrolling(current.invoker);
  restoreScroll(current.context);
  return true;
 }

 function open(options = {}) {
  if (destroyed) return false;
  const invoker = options.invoker || options.trigger || document.activeElement;
  const candidates = [...new Set(options.nodes || [])].filter(Boolean);
  for (const node of candidates) {
   const belongsToCurrentContent = session?.records.some(record => record.node === node || record.node.contains?.(node));
   if (!node.nodeType || node === element || node.contains?.(host) || element.contains(node) && !belongsToCurrentContent) {
    throw new TypeError('Evidence content must be independent DOM nodes.');
   }
  }
  // Passing a parent and its child should not move the child a second time.
  const nodes = candidates.filter(node => !candidates.some(other => other !== node && other.contains?.(node)));
  const sameContent = session && session.key === options.key && session.invoker === invoker &&
   nodes.length === session.records.length && nodes.every((node, index) => node === session.records[index].node) &&
   session.html === options.html;
  heading.textContent = options.title || title;
  if (sameContent) {
   focusWithoutScrolling(closeButton);
   revealHeader();
   return true;
  }
  const replacing = Boolean(session);
  if (session) {
   cancelMotion();
   restoreContent(session);
   restoreScroll(session.context);
  }
  const current = {
   invoker, key: options.key, identity: nodes[0] || (invoker?.nodeType ? invoker : null), html: options.html,
   controls: invoker?.getAttribute?.('aria-controls') ?? null,
   expanded: invoker?.getAttribute?.('aria-expanded') ?? null,
   context: contextScroll(document, [invoker, ...nodes.map(node => node.parentElement)]),
   records: []
  };
  const nodeScroll = treeScroll(nodes);
  for (const node of nodes) {
   const parent = node.parentNode;
   const nextSibling = node.nextSibling;
   const placeholder = parent ? document.createComment('Evidence returns here') : null;
   if (placeholder) parent.insertBefore(placeholder, node);
   current.records.push({node, parent, nextSibling, placeholder});
   content.appendChild(node);
  }
  if (!nodes.length) {
   if (typeof options.html === 'string') content.innerHTML = options.html;
   else content.textContent = 'No evidence is available for this assumption.';
  }
  session = current;
  element.hidden = false;
  element.setAttribute('data-state', 'open');
  invoker?.setAttribute?.('aria-controls', panelId);
  invoker?.setAttribute?.('aria-expanded', 'true');
  onOpen?.({element, invoker, key: current.key});
  const position = rememberedPosition(current);
  content.scrollTop = position?.top || 0;
  content.scrollLeft = position?.left || 0;
  element.scrollTop = position?.panelTop || 0;
  element.scrollLeft = position?.panelLeft || 0;
  restoreScroll(nodeScroll);
  focusWithoutScrolling(closeButton);
  restoreScroll(current.context);
  revealHeader();
  animateOpen(replacing);
  return true;
 }

 const onKeydown = event => {
  if (!session || element.isConnected === false || hiddenByAncestor(element) ||
   event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
  event.preventDefault();
  close({reason: 'escape'});
 };
 const onCloseClick = () => close();
 const onMotionChange = () => { if (media.matches) cancelMotion(); };
 const onRouteChange = event => {
  const destination = typeof event.detail === 'string' ? event.detail : event.detail?.page;
  if (!session || !destination) return;
  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
   if (!(ancestor.getAttribute?.('class') || '').split(/\s+/).includes('page')) continue;
   if (ancestor.id && ancestor.id !== destination) close({restoreFocus: false, reason: 'navigation'});
   break;
  }
 };
 closeButton.addEventListener('click', onCloseClick);
 document.addEventListener('keydown', onKeydown);
 view?.addEventListener?.('valuation:tab-change', onRouteChange);
 media?.addEventListener?.('change', onMotionChange);
 if (!media?.addEventListener) media?.addListener?.(onMotionChange);

 function destroy() {
  if (destroyed) return;
  close({restoreFocus: false, reason: 'destroy'});
  destroyed = true;
  cancelMotion();
  document.removeEventListener('keydown', onKeydown);
  view?.removeEventListener?.('valuation:tab-change', onRouteChange);
  closeButton.removeEventListener('click', onCloseClick);
  media?.removeEventListener?.('change', onMotionChange);
  if (!media?.removeEventListener) media?.removeListener?.(onMotionChange);
  keyedPositions.clear();
  element.remove();
 }

 return {open, close, destroy, element, content, get isOpen() { return Boolean(session); }};
}

export const mountEvidencePanel = (host, options = {}) => createContextualEvidencePanel({...options, host});
