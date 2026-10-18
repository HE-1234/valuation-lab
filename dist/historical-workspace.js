import {bindText as i18nBindText,bindAttribute as i18nBindAttribute,onLocaleChange,t,registerCatalog} from './i18n.js';
import en from './locales/historical.en.js';
import zh from './locales/historical.zh-Hans.js';
registerCatalog('historical',{en,'zh-Hans':zh});
const historicalLabels={"Evidence": "historical.label0", "Historical workspace views": "historical.label1", "Result": "historical.label2", "Inputs": "historical.label3", "Tables": "historical.label4", "Cash flows": "historical.label5", "Scenarios": "historical.label6", "Sensitivity": "historical.label7", "Equity bridge": "historical.label8", "Operating": "historical.label9", "Risk": "historical.label10", "Bridge": "historical.label11", "Case": "historical.label12", "Historical analysis": "historical.label13", "Result visualization": "historical.label14", "Assumption groups": "historical.label15", "Historical evidence": "historical.label16", "Why this assumption?": "historical.label17", "Assumption": "historical.label18", "About historical and imported snapshots": "historical.label19", "Dated inputs · industrial FCFF model. Stress cases are illustrative, not probabilities.": "historical.label20", "Original filing facts, dated research assumptions, accounting judgments, and source checks. Editing your inputs does not revise the original research case.": "historical.label21", "Filing & research evidence": "historical.label22"};
import {createContextualEvidencePanel} from './contextual-evidence.js';
import {enterPanel,cancelMotion,updateFeedback} from './motion.js';
import {prepareFlowTables} from './document-flow.js';

// Presentation only: app.js retains every original input, handler, result target,
// calculation, source disclosure, and storage identity.
const mounted = new WeakMap();

export function mountHistoricalWorkspace(page) {
 if (!page?.ownerDocument) return null;
 if (mounted.has(page)) return mounted.get(page);
 const find = selector => page.querySelector(selector);
 const form = find('#assumptions'), valuation = find('#valuation-result');
 const toolbar = find('.company-bar'), editor = form?.parentElement;
 if (!form || !valuation || !toolbar || !editor) return null;
 const document = page.ownerDocument;
 const originals = [...page.children], moved = new Map(), attributes = new Map(), properties = new Map();
 const generated = new Set(), listeners = [], localeDisposers = [];
 const bindText=(...args)=>{const dispose=i18nBindText(...args);localeDisposers.push(dispose);return dispose;};
 const bindAttribute=(...args)=>{const dispose=i18nBindAttribute(...args);localeDisposers.push(dispose);return dispose;};
 const localText=(node,text)=>{const key=historicalLabels[text];if(key)bindText(node,key);else node.textContent=text;};
 let evidenceContext=null;
 const localizedEvidenceContext=()=>{
  const context=evidenceContext||{};
  const input=context.key ? document.getElementById?.(context.key) : null;
  const row=input?.closest?.('.field-row'), label=row?.querySelector('label'), hint=row?.querySelector('small');
  return {title:label?.textContent.replace(hint?.textContent||'','').trim()||context.title,
   explanation:hint?.textContent||context.explanation};
 };
 let destroyed = false, view = 'result', result = 'cashflows', group = 'operating', mobile = 'result', previousMobile = 'result';
 const make = (tag, className, parent, text) => {
  const node = document.createElement(tag); if (className) node.className = className;
  if (text !== undefined) localText(node, text);
  generated.add(node); parent?.appendChild(node); return node;
 };
 const attr = (node, name, value) => {
  if (!node) return;
  if (!attributes.has(node)) attributes.set(node, new Map());
  if (!attributes.get(node).has(name)) attributes.get(node).set(name, node.getAttribute(name));
  if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
 };
 const property = (node, name, value) => {
  if (!node) return;
  if (!properties.has(node)) properties.set(node, new Map());
  if (!properties.get(node).has(name)) properties.get(node).set(name, node[name]);
  node[name] = value;
 };
 const addClass = (node, names) => { if (node) attr(node, 'class', `${node.className || ''} ${names}`.trim()); };
 const listen = (node, event, handler) => { node.addEventListener(event, handler); listeners.push([node, event, handler]); };
 const move = (node, target) => {
  if (!node) return;
  if (!moved.has(node)) {
   const placeholder = document.createComment('Historical workspace returns here');
   node.parentNode?.insertBefore(placeholder, node);
   moved.set(node, placeholder);
  }
  target.appendChild(node);
 };
 const button = (parent, text, action, className = 'text-button') => {
  const node = make('button', className, parent, text); node.type = 'button';
  listen(node, 'click', action); return node;
 };

 const shell = make('div', 'screen-workspace historical-workspace', page);
 shell.setAttribute('data-view', view); shell.setAttribute('data-mobile-view', mobile);
 shell.setAttribute('data-evidence-open', 'false');
 const parking = make('div', 'historical-source-store', shell); parking.hidden = true;
 for (const node of originals) move(node, parking);
 addClass(toolbar, 'workspace-toolbar historical-toolbar'); move(toolbar, shell);
 addClass(find('#company')?.parentElement, 'company-control');
 addClass(find('#snapshot')?.parentElement, 'baseline-control');
 const actions = make('div', 'workspace-toolbar-actions', toolbar);
 move(find('#load-case'), actions); move(find('#reset'), actions);
 const evidenceAction = button(actions, 'Evidence', event => openEvidence(event.target), 'quiet');
 evidenceAction.id = 'historical-evidence-action';
 const mobileTabs = make('nav', 'workspace-mobile-tabs', shell);
 bindAttribute(mobileTabs, 'aria-label', historicalLabels['Historical workspace views']);
 const mobileButtons = new Map(['result', 'inputs', 'evidence'].map(name => [name,
  button(mobileTabs, name[0].toUpperCase() + name.slice(1), event => {
   if (name === 'evidence') openEvidence(event.target); else setMobileView(name);
  })]));
 const main = make('div', 'workspace-main', shell);
 const stage = make('div', 'workspace-stage', main);
 const summary = make('div', 'workspace-summary historical-summary', stage);
 move(valuation, summary);
 move(find('#critical-notice'), summary);
 move(find('#model-mode'), summary);
 const limit = make('p', 'historical-model-limit', summary,
  'Dated inputs · industrial FCFF model. Stress cases are illustrative, not probabilities.');
 limit.setAttribute('role', 'note');
 summary.insertBefore(limit, valuation);
 const viewTabsElement = make('nav', 'workspace-view-tabs', stage);
 const resultView = make('section', 'workspace-view historical-result-view', stage);
 resultView.id = 'historical-result-view'; resultView.setAttribute('role', 'tabpanel');
 const tablesView = make('section', 'workspace-view historical-tables-view pane-scroll', stage);
 tablesView.id = 'historical-tables-view'; tablesView.setAttribute('role', 'tabpanel');
 const forecast = find('#forecast-details');
 move(forecast, tablesView); property(forecast, 'open', true);
 const resultTabsElement = make('nav', 'historical-result-tabs', resultView);
 const resultPanels = new Map();
 const visualDefinitions = [
  ['cashflows', 'Cash flows', '#chart'], ['scenarios', 'Scenarios', '#scenarios'],
  ['sensitivity', 'Sensitivity', '#sensitivity'], ['bridge', 'Equity bridge', '#bridge']
 ];
 for (const [name, , selector] of visualDefinitions) {
  const panel = make('section', 'historical-result-panel pane-scroll', resultView);
  panel.id = `historical-result-${name}`; panel.setAttribute('role', 'tabpanel');
  move(find(selector)?.parentElement, panel); resultPanels.set(name, panel);
 }
 addClass(editor, 'workspace-editor historical-editor'); move(editor, main);
 const groupTabsElement = make('nav', 'historical-assumption-tabs', editor);
 const editorBody = make('div', 'assumption-editor pane-scroll historical-editor-body', editor);
 move(form, editorBody);
 const caseEditor = make('section', 'historical-case-editor', editorBody);
 caseEditor.id = 'historical-case-editor'; caseEditor.setAttribute('role', 'tabpanel');
 for (const selector of ['.story-label', '#thesis', '#save']) move(find(selector), caseEditor);
 for (const node of [...editor.children]) {
  if (node.tagName === 'P' && node.className.split(/\s+/).includes('micro')) move(node, caseEditor);
 }
 const evidenceHost = make('div', 'workspace-evidence-host', main); evidenceHost.hidden = true;
 const explanation = make('p', 'historical-evidence-context', parking);
 const sourceContext = find('.context-line');
 const about = make('details', 'historical-source-about', parking);
 make('summary', '', about, 'About historical and imported snapshots');
 move(find('.page-title'), about);
 const filing = find('#evidence-details'), research = find('#case-analysis');
 const evidence = createContextualEvidencePanel({host: evidenceHost, id: 'historical-contextual-evidence',
  getFocusFallback: () => [groupTabs.buttons.get(group), viewTabs.buttons.get(view), find('#company')],
  title: t(historicalLabels['Historical evidence']), onOpen() {
   cancelMotion(shell);
   if (mobile !== 'evidence') previousMobile = mobile;
   evidenceHost.hidden = false; shell.setAttribute('data-evidence-open', 'true');
   updateMobile('evidence');
  }, onClose() {
   evidenceHost.hidden = true; shell.setAttribute('data-evidence-open', 'false');
   updateMobile(previousMobile);
  }});

 function tabs(parent, name, items, select) {
  parent.setAttribute('role', 'tablist'); bindAttribute(parent, 'aria-label', historicalLabels[name]);
  const buttons = new Map();
  for (const [key, label, controls] of items) {
   const node = button(parent, label, () => select(key));
   node.id = `historical-tab-${key}`; node.setAttribute('role', 'tab');
   node.setAttribute('aria-controls', controls); buttons.set(key, node);
   listen(node, 'keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const keys = [...buttons.keys()], index = keys.indexOf(key);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 :
     (index + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
    select(keys[next]); buttons.get(keys[next]).focus({preventScroll: true});
   });
  }
  return {set(key) { for (const [id, node] of buttons) {
   node.setAttribute('aria-selected', String(id === key)); node.setAttribute('tabindex', id === key ? '0' : '-1');
  }}, buttons};
 }
 const viewTabs = tabs(viewTabsElement, 'Historical analysis', [
  ['result', 'Result', resultView.id], ['tables', 'Tables', tablesView.id]
 ], setView);
 const resultTabs = tabs(resultTabsElement, 'Result visualization', visualDefinitions.map(([key, label]) =>
  [key, label, resultPanels.get(key).id]), setResultView);
 const groupDefinitions = [['operating', 'Operating'], ['risk', 'Risk'], ['claims', 'Bridge'], ['case', 'Case']];
 const groupTabs = tabs(groupTabsElement, 'Assumption groups', groupDefinitions.map(([key, label]) =>
  [key, label, key === 'case' ? caseEditor.id : 'assumptions']), setGroup);
 resultView.setAttribute('aria-labelledby', viewTabs.buttons.get('result').id);
 tablesView.setAttribute('aria-labelledby', viewTabs.buttons.get('tables').id);
 for (const [name, panel] of resultPanels) panel.setAttribute('aria-labelledby', resultTabs.buttons.get(name).id);
 caseEditor.setAttribute('aria-labelledby', groupTabs.buttons.get('case').id);

 function updateMobile(name) {
  mobile = name; shell.setAttribute('data-mobile-view', name);
  for (const [id, node] of mobileButtons) node.setAttribute('aria-pressed', String(id === name));
 }
 function setMobileView(name) {
  if (!['result', 'inputs', 'evidence'].includes(name) || destroyed) return false;
  if (name === 'evidence') return openEvidence(mobileButtons.get(name));
  evidence.close({restoreFocus: false});
  if (name === 'inputs' && view === 'tables') setView('result');
  updateMobile(name); return true;
 }
 function setView(name) {
  if (!['result', 'tables'].includes(name) || destroyed) return false;
  const changed = name !== view;if(changed)cancelMotion(shell); view = name;
  evidence.close({restoreFocus: false}); shell.setAttribute('data-view', name);
  resultView.hidden = name !== 'result'; tablesView.hidden = name !== 'tables';
  viewTabs.set(name); updateMobile('result');
  if (changed) enterPanel(name === 'result' ? resultView : tablesView);
  return true;
 }
 function setResultView(name) {
  if (!resultPanels.has(name) || destroyed) return false;
  const changed = name !== result;if(changed)cancelMotion(resultView); result = name;
  for (const [id, panel] of resultPanels) panel.hidden = id !== name;
  resultTabs.set(name);
  if (changed) enterPanel(resultPanels.get(name));
  return true;
 }
 function setGroup(name) {
  if (!groupDefinitions.some(([id]) => id === name) || destroyed) return false;
  const changed = group !== name;group = name; refresh();
  if(changed)enterPanel(group==='case'?caseEditor:form);
  return true;
 }
 function refresh() {
  if (destroyed) return;
  prepareFlowTables(page);
  const fieldsets = [...form.querySelectorAll('fieldset')];
  for (const [index, fieldset] of fieldsets.entries()) property(fieldset, 'hidden', groupDefinitions[index]?.[0] !== group);
  property(form, 'hidden', group === 'case'); caseEditor.hidden = group !== 'case';
  attr(form, 'aria-labelledby', groupTabs.buttons.get(group).id);
  groupTabs.set(group);
  // setupFields() replaces only this form's contents. Enhance each new row once,
  // leaving the original input object and app.js input handler untouched.
  for (const row of form.querySelectorAll('.field-row')) {
   if (row.querySelector('.historical-field-evidence')) continue;
   const input = row.querySelector('input'), label = row.querySelector('label'), hint = row.querySelector('small');
   const action = button(row, 'Why this assumption?', event => {
    const title = label?.textContent.replace(hint?.textContent || '', '').trim() || t(historicalLabels['Assumption']);
    openEvidence(event.target, {title, explanation: hint?.textContent || '', key: input?.id});
   }, 'historical-field-evidence text-button');
   bindAttribute(action, 'aria-label', 'historical.assumptionEvidence',()=>({label:label?.textContent.replace(hint?.textContent || '', '').trim() || ''}));
  }
 }
 function openEvidence(invoker = evidenceAction, context = {}) {
  if (destroyed) return false;
  evidenceContext=context;
  explanation.textContent=context.explanation||t(historicalLabels['Original filing facts, dated research assumptions, accounting judgments, and source checks. Editing your inputs does not revise the original research case.']);
  property(filing, 'open', true); property(research, 'open', true);
  return evidence.open({invoker, title: context.title ? t('historical.contextEvidence',{title:context.title}) : t(historicalLabels['Filing & research evidence']),
   nodes: [explanation, sourceContext, filing, research, about].filter(Boolean), key: context.key || 'historical-sources'});
 }
 for (const link of page.querySelectorAll('a')) {
  const href = link.getAttribute('href');
  if (!['#evidence-details', '#forecast-details', '#valuation-result'].includes(href)) continue;
  listen(link, 'click', event => {
   event.preventDefault();
   if (href === '#evidence-details') openEvidence(link);
   else setView(href === '#forecast-details' ? 'tables' : 'result');
  });
 }
 const Observer = document.defaultView?.MutationObserver || globalThis.MutationObserver;
 const observer = typeof Observer === 'function' ? new Observer(refresh) : null;
 observer?.observe(form, {childList: true});
 const resultObserver = typeof Observer === 'function' ? new Observer(() => {
  cancelMotion(summary);prepareFlowTables(page);
  updateFeedback(valuation.querySelector('.value'),summary);
  const panel=resultPanels.get(result);cancelMotion(panel);updateFeedback(panel?.querySelector('svg'),panel);
 }) : null;
 resultObserver?.observe(valuation,{childList:true,subtree:true});
 setView(view); setResultView(result); refresh(); updateMobile(mobile);
 localeDisposers.push(onLocaleChange(()=>{
  if(destroyed)return;
  const context=localizedEvidenceContext();
  explanation.textContent=context.explanation||t(historicalLabels['Original filing facts, dated research assumptions, accounting judgments, and source checks. Editing your inputs does not revise the original research case.']);
  const heading=evidence.element.querySelector('.contextual-evidence-title');
  if(heading)heading.textContent=context.title?t('historical.contextEvidence',{title:context.title}):t(historicalLabels[evidenceContext?'Filing & research evidence':'Historical evidence']);
 }));

 function destroy() {
  if (destroyed) return;
  cancelMotion(shell);observer?.disconnect();resultObserver?.disconnect(); evidence.destroy(); destroyed = true;
  for(const dispose of localeDisposers)dispose();
  for (const [node, event, handler] of listeners) node.removeEventListener(event, handler);
  for (const [node, placeholder] of [...moved].reverse()) {
   if (placeholder.parentNode) { placeholder.parentNode.insertBefore(node, placeholder); placeholder.remove(); }
  }
  for (const [node, values] of attributes) for (const [name, value] of values) {
   if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
  }
  for (const [node, values] of properties) for (const [name, value] of values) node[name] = value;
  for (const node of generated) node.remove();
  mounted.delete(page);
 }
 const api = {element: shell, evidence, setView, setResultView, setGroup, setMobileView, openEvidence, refresh, destroy,
  getState: () => ({view, result, group, mobile})};
 mounted.set(page, api); return api;
}
