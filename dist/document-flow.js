// A table remains the same table and keeps every editable input. At narrow
// widths its rows reflow into labeled groups instead of an inner scroll area.
export function prepareFlowTables(root) {
 if (!root?.querySelectorAll) return;
 const tables = [...(root.tagName === 'TABLE' ? [root] : []), ...root.querySelectorAll('table')];
 for (const table of tables) {
  const head = table.querySelector('thead');
  const headers = [...(head?.querySelectorAll('th') || [])].map(cell => cell.textContent.trim());
  if (!headers.length || !table.querySelector('tbody')) continue;
  const classes = new Set((table.className || '').split(/\s+/).filter(Boolean));
  classes.add('flow-table');
  const className = [...classes].join(' ');
  if (table.className !== className) table.className = className;
  // Explicit roles preserve table relationships in engines that flatten the
  // accessibility tree when native table elements use grid/block presentation.
  if (!table.hasAttribute?.('role')) table.setAttribute('role', 'table');
  for (const group of table.querySelectorAll('thead')) group.setAttribute('role', 'rowgroup');
  for (const group of table.querySelectorAll('tbody')) group.setAttribute('role', 'rowgroup');
  for (const row of table.querySelectorAll('tr')) {
   row.setAttribute('role', 'row');
   let column = 0;
   for (const cell of [...row.children]) {
    if (!['TH', 'TD'].includes(cell.tagName)) continue;
    if (cell.tagName === 'TH') cell.setAttribute('role', cell.getAttribute('scope') === 'row' ? 'rowheader' : 'columnheader');
    else {
     cell.setAttribute('role', 'cell');
     cell.setAttribute('data-column-label', headers[column] || 'Value');
    }
    column += Math.max(1, Number(cell.getAttribute('colspan')) || 1);
   }
  }
 }
}
export function growTextarea(element) {
 if (element?.tagName !== 'TEXTAREA' || !element.style) return;
 element.style.height = 'auto';
 if (element.scrollHeight > 0) element.style.height = `${element.scrollHeight + 2}px`;
}
export function mountDocumentFlow(document) {
 const root = document.querySelector?.('main');
 if (!root) return () => {};
 const growWithin = scope => {
  if (!scope?.querySelectorAll) return;
  growTextarea(scope);
  for (const node of scope.querySelectorAll('textarea')) growTextarea(node);
 };
 const refresh = () => {prepareFlowTables(root);growWithin(root);};
 refresh();
 const onInput = event => growTextarea(event.target);
 const onResize = () => growWithin(root);
 root.addEventListener?.('input', onInput);
 root.addEventListener?.('focusin', onInput);
 document.defaultView?.addEventListener?.('resize', onResize);
 const Observer = document.defaultView?.MutationObserver || globalThis.MutationObserver;
 const observer = typeof Observer === 'function' ? new Observer(records => {
  if (!records) {refresh();return;}
  // Only revisit the changed subtree; simulation particles must not reprocess
  // every annual cell or notes field on each animation frame.
  for (const record of records) {
   if (record.type === 'childList') prepareFlowTables(record.target?.closest?.('table') || record.target);
   growWithin(record.target);
  }
 }) : null;
 observer?.observe(root, {childList: true, subtree: true, attributes: true,
  attributeFilter: ['hidden', 'class', 'data-mobile-view', 'data-view']});
 return () => {
  observer?.disconnect();
  root.removeEventListener?.('input', onInput);
  root.removeEventListener?.('focusin', onInput);
  document.defaultView?.removeEventListener?.('resize', onResize);
 };
}
