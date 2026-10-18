// Actual shipped markup and input handler, exercised with a small DOM fixture.
// These tests verify identity/state contracts, not rendered layout or browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {minimalDocument} from './research-workspace-harness.mjs';
import {mountHistoricalWorkspace} from '../dist/historical-workspace.js';
import {defaults, valueCompany} from '../dist/engine.js';

const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
const originalMarkup = html.match(/<section id="workbench"[\s\S]*?<\/section>/)[0];
const setupSource = app.split('\n').find(line => line.startsWith('function setupFields()'));
const fieldsSource = app.split('\n').find(line => line.startsWith('const fields='));

function fixture({emptyForm = false} = {}) {
 const document = minimalDocument(); document.root.innerHTML = originalMarkup;
 const page = document.querySelector('#workbench'); page.className = 'page';
 const observers = [];
 document.defaultView = {matchMedia: () => ({matches: true}), MutationObserver: class {
  constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
  observe(target, options) { this.target = target; this.options = options; }
  disconnect() { this.disconnected = true; }
 }};
 const get = selector => document.querySelector(selector);
 const assumptions = {...defaults}, snapshot = {ticker: 'TEST', name: 'Example', currency: 'USD',
  units: 'millions', sourceUrl: 'https://example.com/filing', periodEnd: '2022-12-31',
  filedAt: '2023-02-01', availableFrom: '2023-02-02',
  revenue: 1000, ebit: 200, cash: 100, debt: 200, shares: 100};
 let renders = 0;
 const render = () => { renders++; get('#valuation-result').textContent = String(valueCompany(snapshot, assumptions).perShare); };
 const setupFields = new Function('a', '$', 'render', 'toast', 'appMark',
  `let activeCase = null, pathEditNotice = ''; ${fieldsSource}\n${setupSource}\nreturn setupFields;`)(assumptions, get, render, () => {}, text => text);
 if (!emptyForm) setupFields(); render();
 const actionCalls = [];
 for (const id of ['load-case', 'reset', 'save', 'export', 'research-addenda', 'claim-scale']) get(`#${id}`).onclick = () => actionCalls.push(id);
 const originalIds = new Map(page.querySelectorAll('[id]').map(node => [node.id, node]));
 const originalChildren = [...page.children];
 const originalParents = new Map([...originalIds.values()].map(node => [node, node.parentNode]));
 const workspace = mountHistoricalWorkspace(page);
 return {document, page, get, workspace, assumptions, snapshot, setupFields, observers, actionCalls,
  originalIds, originalChildren, originalParents, renders: () => renders};
}

test('historical: moves every original ID once and retains original action handlers', () => {
 const h = fixture();
 for (const [id, node] of h.originalIds) {
  assert.equal(h.get(`#${id}`), node, id);
  assert.equal(h.page.querySelectorAll(`#${id}`).length, 1, `${id} remains unique`);
 }
 for (const id of ['load-case', 'reset', 'save', 'export', 'research-addenda', 'claim-scale']) h.get(`#${id}`).click();
 assert.deepEqual(h.actionCalls, ['load-case', 'reset', 'save', 'export', 'research-addenda', 'claim-scale']);
 assert.equal(mountHistoricalWorkspace(h.page), h.workspace);
 assert.equal(h.get('#company').parentNode.parentNode.className.includes('workspace-toolbar'), true);
 assert.equal(h.get('#assumptions').parentNode.className.includes('historical-editor-body'), true);
 h.workspace.destroy();
});

test('historical: persistent result, in-place visualizations, and full-width table state retain input identity', () => {
 const h = fixture(), input = h.get('#a-growth'), valuation = h.get('#valuation-result');
 assert.equal(valuation.parentNode.className.includes('workspace-summary'), true);
 assert.equal(h.get('#critical-notice').parentNode, valuation.parentNode);
 assert.equal(h.get('#model-mode').parentNode, valuation.parentNode);
 assert.equal(h.get('#historical-result-cashflows').hidden, false);
 assert.equal(h.get('#historical-result-scenarios').hidden, true);
 h.workspace.setResultView('scenarios');
 assert.equal(h.get('#historical-result-cashflows').hidden, true);
 assert.equal(h.get('#historical-result-scenarios').hidden, false);
 h.workspace.setView('tables');
 assert.equal(h.workspace.element.getAttribute('data-view'), 'tables');
 assert.equal(h.get('#historical-tables-view').hidden, false);
 assert.equal(h.get('#historical-result-view').hidden, true);
 assert.equal(h.get('#forecast-details').open, true);
 assert.equal(h.get('#forecast-details').parentNode, h.get('#historical-tables-view'));
 assert.equal(h.get('#valuation-result'), valuation);
 h.workspace.setView('result');
 assert.equal(h.workspace.getState().result, 'scenarios');
 assert.equal(h.get('#a-growth'), input);
 h.workspace.destroy();
});

test('historical: original app input handler still calculates identical values, without cloning inputs or replacing notes', () => {
 const h = fixture(), form = h.get('#assumptions'), growth = h.get('#a-growth');
 const handler = form.oninput, originalValue = valueCompany(h.snapshot, h.assumptions).perShare;
 growth.value = '25'; form.dispatch('input', {target: growth});
 assert.equal(h.assumptions.growth, .25);
 assert.equal(Number(h.get('#valuation-result').textContent), valueCompany(h.snapshot, h.assumptions).perShare);
 assert.notEqual(Number(h.get('#valuation-result').textContent), originalValue);
 assert.equal(form.oninput, handler); assert.equal(h.get('#a-growth'), growth);
 const thesis = h.get('#thesis'); thesis.value = 'An unsaved historical thesis';
 h.workspace.setGroup('case');
 assert.equal(h.get('#historical-case-editor').hidden, false); assert.equal(form.hidden, true);
 h.workspace.setView('tables'); h.workspace.setView('result'); h.workspace.setGroup('operating');
 assert.equal(thesis.value, 'An unsaved historical thesis'); assert.equal(growth.value, '25');
 assert.equal(h.renders(), 2, 'view changes do not call the financial renderer');
 h.workspace.destroy();
});

test('historical: grouped controls and one-action evidence are reattached after asynchronous setupFields replacements', () => {
 const h = fixture({emptyForm: true});
 assert.equal(h.observers.length, 2); assert.equal(h.observers[0].target, h.get('#assumptions'));
 assert.deepEqual(h.observers[0].options, {childList: true});
 h.setupFields(); h.observers[0].callback();
 assert.equal(h.page.querySelectorAll('.historical-field-evidence').length, 9);
 assert.deepEqual(h.get('#assumptions').querySelectorAll('fieldset').map(node => node.hidden), [false, true, true]);
 h.workspace.setGroup('risk'); h.setupFields(); h.observers[0].callback();
 assert.deepEqual(h.get('#assumptions').querySelectorAll('fieldset').map(node => node.hidden), [true, false, true]);
 assert.equal(h.page.querySelectorAll('.historical-field-evidence').length, 9);
 h.observers[0].callback(); assert.equal(h.page.querySelectorAll('.historical-field-evidence').length, 9);
 h.workspace.destroy(); assert.equal(h.observers[0].disconnected, true);
});

test('historical: evidence uses original live source targets, preserves source updates, and restores exact invoker', () => {
 const h = fixture(), row = h.get('#a-targetMargin').parentNode.parentNode;
 const invoker = row.querySelector('.historical-field-evidence'), filing = h.get('#evidence-details');
 const originalParent = filing.parentNode;
 invoker.click();
 assert.equal(h.workspace.evidence.isOpen, true);
 assert.equal(Boolean(h.get('.historical-editor').inert), false);
 assert.equal(filing.parentNode, h.workspace.evidence.content);
 assert.equal(filing.open, true);
 assert.match(h.get('.contextual-evidence-title').textContent, /Mature operating margin/);
 assert.match(h.get('.historical-evidence-context').textContent, /Linear transition/);
 assert.ok(h.workspace.evidence.content.contains(h.get('#snapshot-context')));
 assert.match(h.get('.historical-source-about').textContent, /Dated research cases and imported snapshots/);
 assert.equal(h.workspace.element.getAttribute('data-mobile-view'), 'evidence');
 h.get('#selected-evidence').textContent = 'A newer source update from app.js';
 assert.match(h.workspace.evidence.content.textContent, /A newer source update/);
 h.document.dispatch('keydown', {key: 'Escape'});
 assert.equal(h.workspace.evidence.isOpen, false); assert.equal(filing.parentNode, originalParent);
 assert.equal(Boolean(h.get('.historical-editor').inert), false);
 assert.equal(h.document.activeElement, invoker); assert.deepEqual(invoker.focusOptions, {preventScroll: true});
 assert.equal(h.workspace.element.getAttribute('data-mobile-view'), 'result');
 h.workspace.destroy();
});

test('historical: keyboard tabs switch in place with labelled panels and prevent-scroll focus', () => {
 const h = fixture();
 h.get('#historical-tab-result').dispatch('keydown', {key: 'ArrowRight'});
 assert.equal(h.workspace.getState().view, 'tables');
 assert.equal(h.document.activeElement, h.get('#historical-tab-tables'));
 assert.deepEqual(h.document.activeElement.focusOptions, {preventScroll: true});
 h.get('#historical-tab-tables').dispatch('keydown', {key: 'Home'});
 h.get('#historical-tab-cashflows').dispatch('keydown', {key: 'End'});
 assert.equal(h.workspace.getState().result, 'bridge');
 h.get('#historical-tab-operating').dispatch('keydown', {key: 'ArrowRight'});
 assert.equal(h.workspace.getState().group, 'risk');
 assert.equal(h.get('#assumptions').getAttribute('aria-labelledby'), 'historical-tab-risk');
 for (const node of h.page.querySelectorAll('[role="tab"]')) assert.ok(node.getAttribute('aria-controls'));
 h.workspace.destroy();
});

test('historical: mobile views and existing hash links navigate without losing context', () => {
 const h = fixture(), forecastLink = h.page.querySelectorAll('a').find(node => node.getAttribute('href') === '#forecast-details');
 assert.equal(forecastLink.click().defaultPrevented, true);
 assert.equal(h.workspace.getState().view, 'tables');
 h.workspace.setMobileView('inputs');
 assert.equal(h.workspace.getState().view, 'result'); assert.equal(h.workspace.getState().mobile, 'inputs');
 h.workspace.openEvidence(); assert.equal(h.workspace.getState().mobile, 'evidence');
 h.workspace.evidence.close(); assert.equal(h.workspace.getState().mobile, 'inputs');
 h.workspace.openEvidence(); h.workspace.setMobileView('result');
 assert.equal(h.workspace.evidence.isOpen, false); assert.equal(h.workspace.getState().mobile, 'result');
 h.workspace.destroy();
});

test('historical: open evidence never makes the original table content inert', () => {
 const h = fixture(); h.workspace.setView('tables');
 const tablePane = h.get('#historical-tables-view');
 h.workspace.openEvidence(); assert.equal(Boolean(tablePane.inert), false);
 h.workspace.evidence.close(); assert.equal(Boolean(tablePane.inert), false);
 assert.equal(h.workspace.getState().view, 'tables');
 h.workspace.destroy();
});

test('historical: teardown restores original hierarchy, attributes, controls, and event ownership', () => {
 const h = fixture(), form = h.get('#assumptions'), inputHandler = form.oninput;
 h.workspace.setGroup('risk'); h.workspace.openEvidence(); h.workspace.destroy(); h.workspace.destroy();
 assert.deepEqual(h.page.children, h.originalChildren);
 for (const [id, node] of h.originalIds) {
  assert.equal(h.get(`#${id}`), node, id); assert.equal(node.parentNode, h.originalParents.get(node), id);
 }
 assert.equal(form.oninput, inputHandler); assert.equal(form.hidden, false);
 assert.equal(h.page.querySelectorAll('.historical-field-evidence').length, 0);
 assert.equal(h.get('.screen-workspace'), null);
 assert.equal(h.get('#forecast-details').open, false);
 assert.equal(h.get('#evidence-details').open, false);
 assert.deepEqual(form.querySelectorAll('fieldset').map(node => node.hidden), [false, false, false]);
 const second = mountHistoricalWorkspace(h.page); assert.ok(second); second.destroy();
 assert.equal(mountHistoricalWorkspace(null), null);
});


test('historical: evidence stays open while original controls in different groups edit the valuation', () => {
 const h=fixture(),form=h.get('#assumptions'),growth=h.get('#a-growth'),margin=h.get('#a-targetMargin');
 const before=Number(h.get('#valuation-result').textContent),handler=form.oninput;
 h.workspace.openEvidence();growth.focus();growth.value='25';form.dispatch('input',{target:growth});
 assert.equal(h.workspace.evidence.isOpen,true);assert.equal(h.document.activeElement,growth);
 assert.equal(h.assumptions.growth,.25);assert.notEqual(Number(h.get('#valuation-result').textContent),before);
 h.workspace.setGroup('risk');h.workspace.setGroup('operating');margin.focus();margin.value='31';form.dispatch('input',{target:margin});
 assert.equal(h.assumptions.targetMargin,.31);assert.equal(h.workspace.evidence.isOpen,true);
 assert.equal(h.get('#a-growth'),growth);assert.equal(h.get('#a-targetMargin'),margin);assert.equal(form.oninput,handler);
 assert.equal(h.document.activeElement,margin);assert.equal(Boolean(h.get('.historical-editor').inert),false);
 assert.equal(Number(h.get('#valuation-result').textContent),valueCompany(h.snapshot,h.assumptions).perShare);
 h.workspace.destroy();
});

test('historical: locale switch keeps workspace, evidence, inputs, notes and focus intact', async()=>{
 const {setLocale}=await import('../dist/i18n.js');setLocale('en');
 const h=fixture();
 h.workspace.setGroup('case');h.workspace.setResultView('bridge');
 const notes=h.get('#thesis');notes.value='Keep my own English thesis.';notes.focus();
 h.workspace.openEvidence(h.get('#historical-evidence-action'));
 const state=h.workspace.getState(),inputs=h.get('#assumptions'),evidence=h.workspace.evidence.element;
 const openDetails=h.get('#evidence-details').open;
 setLocale('zh-Hant');
 assert.deepEqual(h.workspace.getState(),state);assert.equal(h.get('#assumptions'),inputs);
 assert.equal(h.workspace.evidence.element,evidence);assert.equal(h.workspace.evidence.isOpen,true);
 assert.equal(h.get('#evidence-details').open,openDetails);assert.equal(notes.value,'Keep my own English thesis.');
 assert.equal(h.get('#historical-evidence-action').textContent,'證據');
 assert.match(evidence.querySelector('.contextual-evidence-title').textContent,/證據/);
 setLocale('en');assert.deepEqual(h.workspace.getState(),state);
 assert.equal(h.get('#historical-evidence-action').textContent,'Evidence');
 h.workspace.destroy();
});
