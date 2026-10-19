# Simulation settings guide integration

## Exact sources

- Published application baseline: `475736665290662d1da7f8386fa1e014147bb3b4` (V83, including the UMC simulation mount repair).
- User-authored UI source: [HE-1234/valuation-lab, a48377690a769e2211cd1f35a3671d740df9d9b4](https://github.com/HE-1234/valuation-lab/commit/a48377690a769e2211cd1f35a3671d740df9d9b4).
- Source parent: `75ab7e5179370360781aa5fd732e0dbb3dd4bea6`. GitHub reports exactly one commit ahead and zero behind.
- The three modified source-parent files matched the published baseline byte-for-byte. The source adds `dist/skins/report-mc-guide.js` and modifies `dist/simulation-view.js`, `dist/skins/report.css`, and `dist/skins/skin-motion.js`.

## Scope and compatibility

The supplied guide, bilingual copy, layouts, colors, charts, desktop right column, phone inline placement, controls, and transitions are retained. CSS and the motion-loader change are exact upstream bytes.

Narrow integration repairs are confined to the new state-publication/guide layer:

- Publish Run after the existing AbortController is created; use a live read-only running getter so queued previews pause and resume correctly.
- Keep invalid or externally pending state withheld across tab changes until settings validate; publish cancellation and withholding.
- Remove destroyed mount state and abort its queued guide work; expose a withheld main message immediately and initialize a fresh same-root guide correctly.
- Repaint completed previews after a hidden view reopens without a settings change.
- Use operating EV consistently for annual-research path colors and latest-range comparisons.
- Respect reduced-motion preferences when switching from guide to range.

No financial engine, company dataset, capital policy, calculation, source archive, or default trial count changes. UMC's absent capital selector and two guarded callbacks are unchanged. Manual Run remains 5,000 by default; the explicitly labeled 400-scenario guide previews use copied settings and the existing engine, and do not create a current main result or enable export.

## Verification contracts

`tests/claude-simulation-ui-preservation.mjs` pins the exact immutable V83 Git tree, exact source hashes, and exact reviewed final hashes. Its reversal precedes the existing UMC mount repair and older release checks. The new addition is individually accounted for. Earlier fixture bytes remain unchanged. Mutation tests reject unsupported edits, aliases, undeclared additions, missing paths, and fixture weakening. Exact compatibility reconstruction must reproduce the independently fetched upstream hashes.

`tests/simulation-guide-dom.test.mjs` executes the shipped simulation and guide against parsed shipped HTML and real simulation engines. It covers generic and research tabs, actual async UMC Run 5,000 and EV-only export, repeated navigation, English/Simplified Chinese, phone/desktop placement, reset/Undo, focus, reduced motion, invalid settings, cancellation, destroy, phone Run priority, and hidden in-flight previews. The harness does not manufacture missing nodes. It is DOM lifecycle evidence, not native browser painting, input, accessibility, or layout proof.

The prior UMC strict-DOM, manual-run, and report-skin compatibility tests remain applicable, including all 33 annual adapters. A full aggregate run against frozen bytes and separate native-browser checks are release gates; focused tests alone do not constitute that release gate.
