// Lifecycle/DOM contract tests only. This small fixture is not a browser-layout
// or assistive-technology oracle; it exercises actual production handlers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createContextualEvidencePanel, mountEvidencePanel} from '../dist/contextual-evidence.js';

function fixture({reduced = false, animationSupport = true, legacyMedia = false, configure} = {}) {
 class Events {
  events = new Map();
  addEventListener(type, listener) {
   if (!this.events.has(type)) this.events.set(type, new Set());
   this.events.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.events.get(type)?.delete(listener); }
  dispatch(type, values = {}) {
   const event = {type, target: this, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }, ...values};
   for (const listener of this.events.get(type) || []) listener(event);
   return event;
  }
 }
 class Node extends Events {
  constructor(document, tag = 'div', nodeType = 1) {
   super(); this.ownerDocument = document; this.tagName = tag.toUpperCase();
   this.nodeType = nodeType; this.parentNode = null; this.childNodes = [];
   this.style = {}; this.attributes = new Map(); this.hidden = false; this.scrollTop = 0;
   this.scrollLeft = 0; this._text = ''; this._html = ''; this.value = '';
   if (animationSupport) this.animate = (frames, options) => {
    const animation = {target: this, frames, options, canceled: false, onfinish: null,
     cancel() { this.canceled = true; }};
    animations.push(animation); return animation;
   };
  }
  get parentElement() { return this.parentNode?.nodeType === 1 ? this.parentNode : null; }
  get nextSibling() { return this.parentNode?.childNodes[this.parentNode.childNodes.indexOf(this) + 1] || null; }
  get children() { return this.childNodes.filter(child => child.nodeType === 1); }
  get isConnected() { return this === this.ownerDocument.documentElement || Boolean(this.parentNode?.isConnected); }
  get id() { return this.getAttribute('id') || ''; }
  set id(value) { this.setAttribute('id', value); }
  get className() { return this.getAttribute('class') || ''; }
  set className(value) { this.setAttribute('class', value); }
  get textContent() { return this._text + this.childNodes.map(child => child.textContent).join(''); }
  set textContent(value) { this.replaceChildren(); this._html = ''; this._text = String(value); }
  get innerHTML() { return this._html; }
  set innerHTML(value) { this.replaceChildren(); this._text = ''; this._html = String(value); }
  appendChild(node) { return this.insertBefore(node, null); }
  insertBefore(node, reference) {
   if (reference && reference.parentNode !== this) throw new Error('Reference is not a child');
   if (node === reference) return node;
   node.remove();
   const index = reference ? this.childNodes.indexOf(reference) : this.childNodes.length;
   this.childNodes.splice(index, 0, node); node.parentNode = this; return node;
  }
  remove() {
   if (this.parentNode) this.parentNode.childNodes.splice(this.parentNode.childNodes.indexOf(this), 1);
   this.parentNode = null;
  }
  replaceChildren(...nodes) {
   for (const child of [...this.childNodes]) child.remove();
   this._text = ''; this._html = '';
   for (const node of nodes) this.appendChild(node);
  }
  contains(node) { return this === node || this.childNodes.some(child => child.contains(node)); }
  querySelectorAll(selector) {
   assert.equal(selector, '*');
   return this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  focus(options) { this.ownerDocument.activeElement = this; this.focusOptions = options; }
 }
 const animations = [];
 const document = new Events();
 document.createElement = tag => new Node(document, tag);
 document.createComment = text => { const comment = new Node(document, '#comment', 8); comment.textContent = text; return comment; };
 document.documentElement = document.createElement('html');
 document.body = document.createElement('body'); document.documentElement.appendChild(document.body);
 document.scrollingElement = document.documentElement;
 const media = new Events(); media.matches = reduced;
 if (legacyMedia) {
  media.addListener = listener => Events.prototype.addEventListener.call(media, 'change', listener);
  media.removeListener = listener => Events.prototype.removeEventListener.call(media, 'change', listener);
  media.addEventListener = undefined; media.removeEventListener = undefined;
 }
 document.defaultView = new Events(); document.defaultView.matchMedia = () => media;
 const make = (tag, parent) => { const node = document.createElement(tag); parent?.appendChild(node); return node; };
 const host = make('main', document.body), editor = make('div', host), invoker = make('button', editor);
 const source = make('div', editor), before = make('p', source), evidence = make('article', source), after = make('p', source);
 const details = make('details', evidence), input = make('input', details);
 details.open = true; input.value = 'unsaved source note';
 document.activeElement = invoker;
 const callbackEvents = [];
 configure?.(document);
 const panel = createContextualEvidencePanel({host, id: 'test-evidence', title: 'Assumption evidence',
  onOpen: value => callbackEvents.push({type: 'open', ...value}),
  onClose: value => callbackEvents.push({type: 'close', ...value})});
 const closeButton = panel.element.children[0].children[1];
 const heading = panel.element.children[0].children[0];
 return {document, media, host, editor, invoker, source, before, evidence, after, details, input,
  panel, closeButton, heading, make, animations, callbackEvents};
}

test('evidence: labelled nonmodal region, visible Close action, and no focus trap', () => {
 const h = fixture();
 assert.equal(h.panel.element.hidden, true);
 assert.equal(h.panel.element.getAttribute('role'), 'region');
 assert.equal(h.panel.element.getAttribute('aria-labelledby'), h.heading.id);
 assert.equal(h.panel.element.getAttribute('aria-modal'), null);
 assert.equal(h.closeButton.type, 'button');
 assert.equal(h.closeButton.textContent, 'Close');
 assert.equal(h.closeButton.getAttribute('aria-label'), 'Close evidence');
 h.panel.open({invoker: h.invoker, title: 'Why this margin?', nodes: [h.evidence]});
 assert.equal(h.heading.textContent, 'Why this margin?');
 assert.equal(h.document.activeElement, h.closeButton);
 assert.deepEqual(h.closeButton.focusOptions, {preventScroll: true});
 assert.equal(h.document.dispatch('keydown', {key: 'Tab'}).defaultPrevented, false);
 h.panel.destroy();
});

test('evidence: nodes return in exact order with listeners, edited values, disclosure state, and invoker intact', () => {
 const h = fixture(); let clicks = 0;
 h.evidence.addEventListener('click', () => clicks++);
 h.invoker.setAttribute('aria-expanded', 'false');
 h.invoker.setAttribute('aria-controls', 'original-controls');
 h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 assert.equal(h.panel.content.children[0], h.evidence);
 assert.equal(h.source.childNodes[1].nodeType, 8);
 assert.equal(h.invoker.getAttribute('aria-expanded'), 'true');
 assert.equal(h.invoker.getAttribute('aria-controls'), h.panel.element.id);
 h.input.value = 'edited in evidence'; h.details.open = false;
 h.evidence.dispatch('click');
 h.closeButton.dispatch('click');
 assert.equal(h.panel.isOpen, false); assert.equal(h.panel.element.hidden, true);
 assert.deepEqual(h.source.childNodes, [h.before, h.evidence, h.after]);
 assert.equal(h.input.value, 'edited in evidence'); assert.equal(h.details.open, false);
 h.evidence.dispatch('click'); assert.equal(clicks, 2);
 assert.equal(h.document.activeElement, h.invoker);
 assert.deepEqual(h.invoker.focusOptions, {preventScroll: true});
 assert.equal(h.invoker.getAttribute('aria-expanded'), 'false');
 assert.equal(h.invoker.getAttribute('aria-controls'), 'original-controls');
 assert.equal(h.callbackEvents.at(-1).type, 'close');
 h.panel.destroy();
});

test('evidence: source and nested scroll survive movement; keyed panel scroll survives reopening', () => {
 const h = fixture();
 h.editor.scrollTop = 180; h.editor.scrollLeft = 12;
 h.document.documentElement.scrollTop = 25;
 h.details.scrollTop = 100; h.details.scrollLeft = 30;
 h.panel.open({invoker: h.invoker, nodes: [h.evidence], key: 'margin'});
 assert.equal(h.editor.scrollTop, 180); assert.equal(h.details.scrollTop, 100);
 h.panel.content.scrollTop = 400; h.panel.content.scrollLeft = 20;
 h.panel.element.scrollTop = 7; h.details.scrollLeft = 45;
 h.editor.scrollTop = 0; h.document.documentElement.scrollTop = 0;
 h.panel.close();
 assert.equal(h.editor.scrollTop, 180); assert.equal(h.editor.scrollLeft, 12);
 assert.equal(h.document.documentElement.scrollTop, 25);
 assert.equal(h.details.scrollTop, 100); assert.equal(h.details.scrollLeft, 45);
 h.panel.open({invoker: h.invoker, nodes: [h.evidence], key: 'margin'});
 assert.equal(h.panel.content.scrollTop, 400); assert.equal(h.panel.content.scrollLeft, 20);
 assert.equal(h.panel.element.scrollTop, 7);
 h.panel.destroy();
});

test('evidence: source switches restore old nodes without a close callback or focus jump; repeated opens do not replay', () => {
 const h = fixture(), second = h.make('article', h.source), secondInvoker = h.make('button', h.editor);
 h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 h.panel.content.scrollTop = 200;
 const entering = h.animations[0], staleFinish = entering.onfinish;
 h.panel.open({invoker: secondInvoker, nodes: [second]});
 assert.equal(entering.canceled, true); assert.equal(h.animations[1].options.duration, 280);
 assert.equal(h.evidence.parentNode, h.source); assert.equal(second.parentNode, h.panel.content);
 assert.equal(h.panel.content.scrollTop, 0);
 assert.equal(h.invoker.getAttribute('aria-expanded'), null);
 assert.equal(h.callbackEvents.filter(event => event.type === 'close').length, 0);
 staleFinish();
 const switched = h.animations[1];
 h.panel.content.scrollTop = 60;
 h.panel.open({invoker: secondInvoker, nodes: [second], title: 'Same evidence'});
 assert.equal(h.animations.length, 2); assert.equal(h.panel.content.scrollTop, 60);
 h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 assert.equal(switched.canceled, true); assert.equal(h.panel.content.scrollTop, 200);
 h.panel.close();
 assert.equal(h.document.activeElement, h.invoker);
 h.panel.destroy();
});

test('evidence: Escape works from outside panel and respects a nested control consuming Escape', () => {
 const h = fixture(); h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 h.invoker.focus({preventScroll: true});
 h.document.dispatch('keydown', {key: 'Escape', defaultPrevented: true});
 assert.equal(h.panel.isOpen, true);
 h.document.dispatch('keydown', {key: 'Escape', isComposing: true});
 assert.equal(h.panel.isOpen, true);
 const event = h.document.dispatch('keydown', {key: 'Escape'});
 assert.equal(event.defaultPrevented, true); assert.equal(h.panel.isOpen, false);
 assert.equal(h.callbackEvents.at(-1).reason, 'escape');
 assert.equal(h.document.activeElement, h.invoker);
 h.panel.destroy();
});

test('evidence: animation is optional, reduced motion is immediate, and preference changes interrupt entry', () => {
 for (const options of [{reduced: true}, {animationSupport: false}]) {
  const h = fixture(options); h.panel.open({nodes: [h.evidence]});
  assert.equal(h.animations.length, 0); assert.equal(h.panel.isOpen, true);
  h.panel.close(); assert.equal(h.evidence.parentNode, h.source); h.panel.destroy();
 }
 const h = fixture({legacyMedia: true}); h.panel.open({nodes: [h.evidence]});
 assert.equal(h.animations[0].options.duration, 280);
 h.media.matches = true; h.media.dispatch('change');
 assert.equal(h.animations[0].canceled, true);
 assert.equal(h.panel.isOpen, true); assert.equal(h.evidence.parentNode, h.panel.content);
 h.panel.destroy(); assert.equal(h.media.events.get('change').size, 0);
});

test('evidence: disconnected invoker is not focused; stale evidence never enters a newly rendered source', () => {
 const h = fixture(); h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 h.invoker.remove(); h.source.replaceChildren();
 const replacement = h.make('p', h.source);
 h.panel.close();
 assert.deepEqual(h.source.childNodes, [replacement]);
 assert.equal(h.evidence.parentNode, null);
 assert.notEqual(h.document.activeElement, h.invoker);
 h.panel.destroy();
});

test('evidence: removed editor retains its old content without touching the new editor', () => {
 const h = fixture(); h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 h.editor.remove();
 const newEditor = h.make('div', h.host);
 h.panel.close({restoreFocus: false});
 assert.deepEqual(h.source.childNodes, [h.before, h.evidence, h.after]);
 assert.equal(newEditor.childNodes.length, 0);
 h.panel.destroy();
});

test('evidence: deduplicates nested content, rejects host ancestry, and safely handles detached nodes', () => {
 const h = fixture();
 assert.throws(() => h.panel.open({nodes: [h.host]}), /independent DOM nodes/);
 h.panel.open({nodes: [h.evidence, h.details, h.evidence]});
 assert.deepEqual(h.panel.content.childNodes, [h.evidence]);
 assert.equal(h.details.parentNode, h.evidence);
 h.panel.close();
 const detached = h.make('article');
 h.panel.open({nodes: [detached]}); assert.equal(detached.parentNode, h.panel.content);
 h.panel.close(); assert.equal(detached.parentNode, null);
 h.panel.destroy();
});

test('evidence: switching to a subsection of the open source restores both source locations correctly', () => {
 const h = fixture();
 h.panel.open({invoker: h.invoker, nodes: [h.evidence], key: 'whole-source'});
 h.panel.open({invoker: h.invoker, nodes: [h.details], key: 'source-details'});
 assert.equal(h.evidence.parentNode, h.source);
 assert.equal(h.details.parentNode, h.panel.content);
 h.panel.close();
 assert.deepEqual(h.source.childNodes, [h.before, h.evidence, h.after]);
 assert.deepEqual(h.evidence.childNodes, [h.details]);
 assert.equal(h.input.value, 'unsaved source note');
 h.panel.destroy();
});

test('evidence: app-owned HTML, empty fallback, mount alias, and idempotent teardown', () => {
 const h = fixture();
 h.panel.open({invoker: h.invoker, html: '<p>Company source</p>', key: 'source'});
 assert.equal(h.panel.content.innerHTML, '<p>Company source</p>');
 h.panel.close(); h.panel.open({invoker: h.invoker});
 assert.match(h.panel.content.textContent, /No evidence is available/);
 h.panel.destroy(); h.panel.destroy();
 assert.equal(h.panel.isOpen, false); assert.equal(h.panel.element.parentNode, null);
 assert.equal(h.document.events.get('keydown').size, 0);
 assert.equal(h.closeButton.events.get('click').size, 0);
 assert.equal(h.panel.open({nodes: [h.evidence]}), false);
 const alias = mountEvidencePanel(h.host, {id: 'alias-panel'});
 assert.equal(alias.element.id, 'alias-panel'); alias.destroy();
 assert.throws(() => createContextualEvidencePanel(), /DOM host/);
});

test('evidence: a hidden workspace never consumes Escape before the visible workspace', () => {
 const h = fixture(); h.host.className = 'page'; h.host.id = 'guided';
 h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 const annualPage = h.make('section', h.document.body); annualPage.className = 'page'; annualPage.id = 'annual';
 const annualInvoker = h.make('button', annualPage), annualSource = h.make('article', annualPage);
 const annual = createContextualEvidencePanel({host: annualPage, id: 'annual-evidence'});
 h.host.className = 'page hidden';
 annual.open({invoker: annualInvoker, nodes: [annualSource]});
 const event = h.document.dispatch('keydown', {key: 'Escape'});
 assert.equal(event.defaultPrevented, true); assert.equal(annual.isOpen, false);
 assert.equal(h.panel.isOpen, true); assert.equal(h.document.activeElement, annualInvoker);
 h.panel.close(); assert.equal(h.document.activeElement, annualInvoker, 'closing a hidden page must not focus its trigger');
 h.host.className = 'page'; h.host.hidden = true;
 h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 assert.equal(h.document.dispatch('keydown', {key: 'Escape'}).defaultPrevented, false);
 annual.destroy(); h.panel.destroy();
});

test('evidence: route changes restore old content without focusing hidden or detached pages', () => {
 const h = fixture(); h.host.className = 'page'; h.host.id = 'guided';
 h.panel.open({invoker: h.invoker, nodes: [h.evidence]});
 h.document.defaultView.dispatch('valuation:tab-change', {detail: 'guided'});
 assert.equal(h.panel.isOpen, true);
 const nextPageButton = h.make('button', h.document.body); nextPageButton.focus({preventScroll: true});
 h.source.remove(); h.host.className = 'page hidden';
 h.document.defaultView.dispatch('valuation:tab-change', {detail: 'annual'});
 assert.equal(h.panel.isOpen, false); assert.equal(h.evidence.parentNode, h.source);
 assert.equal(h.document.activeElement, nextPageButton);
 assert.equal(h.callbackEvents.at(-1).reason, 'navigation');
 h.panel.destroy(); assert.equal(h.document.defaultView.events.get('valuation:tab-change').size, 0);
});

test('evidence: explicit first and repeated opens reveal an offscreen header, then restore document position',()=>{
 const h=fixture(),header=h.panel.element.children[0],view=h.document.defaultView;view.innerHeight=844;
 let reveals=0;header.getBoundingClientRect=()=>({top:1200,bottom:1270});
 h.panel.element.scrollIntoView=options=>{assert.deepEqual(options,{block:'start',behavior:'auto'});reveals++;h.document.scrollingElement.scrollTop=1000;};
 h.document.scrollingElement.scrollTop=180;
 h.panel.open({invoker:h.invoker,key:'repeat',nodes:[h.evidence]});assert.equal(reveals,1);assert.equal(h.document.activeElement,h.closeButton);
 h.panel.open({invoker:h.invoker,key:'repeat',nodes:[h.evidence]});assert.equal(reveals,2);
 h.panel.close();assert.equal(h.document.scrollingElement.scrollTop,180);assert.equal(h.document.activeElement,h.invoker);h.panel.destroy();
});
test('evidence: an already visible header does not force the document to move',()=>{
 const h=fixture();h.document.defaultView.innerHeight=768;h.panel.element.children[0].getBoundingClientRect=()=>({top:150,bottom:210});
 h.panel.element.scrollIntoView=()=>assert.fail('visible evidence should not jump');h.document.scrollingElement.scrollTop=90;
 h.panel.open({invoker:h.invoker,nodes:[h.evidence]});assert.equal(h.document.scrollingElement.scrollTop,90);h.panel.close();h.panel.destroy();
});

test('evidence: passive refresh preserves current keyboard focus and document position without replay/reveal', () => {
 const h=fixture();let reveals=0;h.panel.element.scrollIntoView=()=>reveals++;
 h.document.defaultView.innerHeight=700;h.panel.element.children[0].getBoundingClientRect=()=>({top:900,bottom:940});
 h.panel.open({invoker:h.invoker,nodes:[h.evidence],key:'first',focus:false,reveal:false,restorePosition:false,animate:false});
 assert.equal(h.document.activeElement,h.invoker);assert.equal(reveals,0);assert.equal(h.animations.length,0);
 h.document.documentElement.scrollTop=450;const second=h.make('article',h.source),input=h.make('input',h.editor);input.focus();
 h.panel.open({invoker:h.invoker,nodes:[second],key:'second',focus:false,reveal:false,restorePosition:false,animate:false});
 assert.equal(h.document.activeElement,input);assert.equal(h.document.documentElement.scrollTop,450);assert.equal(reveals,0);assert.equal(h.animations.length,0);
 h.panel.close({restoreFocus:false,restorePosition:false});assert.equal(h.document.activeElement,input);assert.equal(h.document.documentElement.scrollTop,450);h.panel.destroy();
});


test('evidence: passive teardown never restores an obsolete opening page position', () => {
 const h=fixture();h.document.documentElement.scrollTop=120;
 h.panel.open({invoker:h.invoker,nodes:[h.evidence],focus:false,reveal:false});
 h.document.documentElement.scrollTop=650;h.input.focus();h.panel.destroy();
 assert.equal(h.document.documentElement.scrollTop,650);assert.equal(h.document.activeElement,h.input);
});

function stickyRevealFixture({reduced=false,position='sticky',navTop=0,navBottom=64,padding=24,top=1200,bottom=1270}={}) {
 const h=fixture({reduced}),view=h.document.defaultView,scrolls=[];
 let bounds={top,bottom};const nav={getBoundingClientRect:()=>({top:navTop,bottom:navBottom})};
 view.innerHeight=844;
 view.getComputedStyle=node=>node===nav?{position}:{scrollPaddingTop:String(padding),scrollPaddingBottom:'0px'};
 h.document.querySelector=selector=>selector==='body > aside'?nav:null;
 h.panel.element.children[0].getBoundingClientRect=()=>({...bounds});
 view.scrollBy=options=>{scrolls.push(options);bounds={top:bounds.top-options.top,bottom:bounds.bottom-options.top};h.document.scrollingElement.scrollTop+=options.top;};
 h.panel.element.scrollIntoView=()=>assert.fail('native reveal uses the measured unobscured viewport');
 return {...h,scrolls,bounds:()=>bounds};
}
for(const reduced of [false,true])for(const navBottom of [64,144])test(`evidence: offscreen reveal clears actual sticky navigation (${navBottom}px, reduced=${reduced})`,()=>{
 const h=stickyRevealFixture({reduced,navBottom});try{
  h.document.scrollingElement.scrollTop=180;
  h.panel.open({invoker:h.invoker,key:'sticky',nodes:[h.evidence]});
  assert.deepEqual(h.scrolls,[{top:1200-navBottom-8,behavior:'instant'}]);
  assert.equal(h.bounds().top,navBottom+8);assert.equal(h.document.activeElement,h.closeButton);
  h.panel.open({invoker:h.invoker,key:'sticky',nodes:[h.evidence]});assert.equal(h.scrolls.length,1);
  h.panel.close();assert.equal(h.document.scrollingElement.scrollTop,180);assert.equal(h.document.activeElement,h.invoker);
 }finally{h.panel.destroy();}
});
test('evidence: partially occluded positive header position is revealed, not mistaken for visible',()=>{
 const h=stickyRevealFixture({top:24,bottom:94});try{h.panel.open({invoker:h.invoker,nodes:[h.evidence]});assert.deepEqual(h.scrolls,[{top:-48,behavior:'instant'}]);assert.equal(h.bounds().top,72);}finally{h.panel.destroy();}
});
test('evidence: genuinely visible header does not scroll under sticky navigation',()=>{
 const h=stickyRevealFixture({top:150,bottom:220});try{h.panel.open({invoker:h.invoker,nodes:[h.evidence]});assert.deepEqual(h.scrolls,[]);}finally{h.panel.destroy();}
});
for(const position of ['static','relative'])test(`evidence: ${position} navigation does not reserve an overlay boundary`,()=>{
 const h=stickyRevealFixture({position,padding:0,top:20,bottom:90});try{h.panel.open({invoker:h.invoker,nodes:[h.evidence]});assert.deepEqual(h.scrolls,[]);}finally{h.panel.destroy();}
});
test('evidence: offscreen navigation does not reserve an overlay boundary',()=>{
 const h=stickyRevealFixture({navTop:-100,navBottom:-20,padding:0,top:20,bottom:90});try{h.panel.open({invoker:h.invoker,nodes:[h.evidence]});assert.deepEqual(h.scrolls,[]);}finally{h.panel.destroy();}
});
test('evidence: larger document scroll padding is retained',()=>{
 const h=stickyRevealFixture({padding:100,top:24,bottom:94});try{h.panel.open({invoker:h.invoker,nodes:[h.evidence]});assert.deepEqual(h.scrolls,[{top:-76,behavior:'instant'}]);}finally{h.panel.destroy();}
});
test('evidence: passive refresh bypasses sticky-aware reveal and keeps current focus',()=>{
 const h=stickyRevealFixture({top:24,bottom:94});try{h.panel.open({invoker:h.invoker,nodes:[h.evidence],focus:false,reveal:false});assert.deepEqual(h.scrolls,[]);assert.equal(h.document.activeElement,h.invoker);}finally{h.panel.destroy();}
});

function pinnedHeaderFixture({position='sticky',reduced=false}={}) {
 let navBottom=64,cssTop=8,headerPosition=position,observer,disconnects=0;
 const nav={getBoundingClientRect:()=>({top:0,bottom:navBottom})},scrolls=[];
 const h=fixture({reduced,configure(document){
  document.querySelector=selector=>selector==='body > aside'?nav:null;
  const view=document.defaultView;view.innerHeight=757;
  view.getComputedStyle=node=>node===nav?{position:'sticky'}:node===document.documentElement?{scrollPaddingTop:'24px'}:{position:headerPosition,top:node.style?.top||cssTop+'px'};
  view.scrollBy=options=>scrolls.push(options);
  view.ResizeObserver=class {constructor(callback){observer=callback;}observe(node){assert.equal(node,nav);}disconnect(){disconnects++;}};
 }});
 const header=h.panel.element.children[0];
 // A real sticky header's position stays pinned when the document scrolls.
 header.getBoundingClientRect=()=>{const top=headerPosition==='sticky'?Number.parseFloat(header.style.top||cssTop):-202.47;return {top,bottom:top+81.78125};};
 return {...h,header,scrolls,resize(bottom,top=cssTop){navBottom=bottom;cssTop=top;h.document.defaultView.dispatch('resize');},observe(bottom){navBottom=bottom;observer();},setPosition(value){headerPosition=value;},disconnects:()=>disconnects};
}
for(const reduced of [false,true])test(`evidence: pinned sticky header clears navigation without ineffective document scroll (reduced=${reduced})`,()=>{
 const h=pinnedHeaderFixture({reduced});try{
  h.panel.open({invoker:h.invoker,nodes:[h.evidence],key:'pinned'});
  assert.equal(h.header.style.top,'72px');assert.equal(h.header.getBoundingClientRect().top,72);assert.deepEqual(h.scrolls,[]);
  assert.equal(h.document.activeElement,h.closeButton);
  h.panel.open({invoker:h.invoker,nodes:[h.evidence],key:'pinned'});assert.deepEqual(h.scrolls,[]);
 }finally{h.panel.destroy();assert.equal(h.header.style.top,'');assert.equal(h.disconnects(),1);}
});
test('evidence: open pinned header follows wrapped navigation and CSS breakpoint changes without scrolling',()=>{
 const h=pinnedHeaderFixture();try{
  h.panel.open({invoker:h.invoker,nodes:[h.evidence]});
  h.resize(144,52);assert.equal(h.header.style.top,'152px');
  h.resize(64,8);assert.equal(h.header.style.top,'72px');
  h.observe(96);assert.equal(h.header.style.top,'104px');assert.deepEqual(h.scrolls,[]);
  h.setPosition('static');h.resize(64);assert.equal(h.header.style.top,'');
 }finally{h.panel.destroy();}
});
test('evidence: Guided static header retains stylesheet positioning',()=>{
 const h=pinnedHeaderFixture({position:'static'});try{h.panel.open({invoker:h.invoker,nodes:[h.evidence]});assert.equal(h.header.style.top,'');h.resize(144);assert.equal(h.header.style.top,'');}finally{h.panel.destroy();}
});
test('evidence: closed and destroyed panels ignore resize notifications',()=>{
 const h=pinnedHeaderFixture();h.panel.open({invoker:h.invoker,nodes:[h.evidence]});h.panel.close();h.resize(144);assert.equal(h.header.style.top,'72px');h.panel.destroy();h.resize(200);h.observe(200);assert.equal(h.header.style.top,'');assert.equal(h.document.defaultView.events.get('resize').size,0);assert.equal(h.disconnects(),1);
});
