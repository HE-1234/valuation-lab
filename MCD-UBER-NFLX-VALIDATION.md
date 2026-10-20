# MCD, Uber and Netflix release-candidate validation

2026-10-19. The isolated candidate has completed independent source, economic, persistence, preservation and bounded visual review. The full aggregate is pending at this documentation freeze; its result is recorded externally against the exact final commit. This document supersedes the pending geometry/visual status in the earlier company-only manifest without modifying that historical record. Canonical integration and publication remain parent-owned.

## Source lineage and inventory

- V85 baseline: `623c06999d68a162202db636dc230dc88dc68866`.
- Reviewed MCD/Uber baseline: `28b4ee8560425337c92e75e2a053264ced7e2c43`.
- Company-only MCD/Uber/NFLX source: `86fe7169f84689aba13f2076b4789289f4477ec8`.
- Reviewed geometry layer: `ef4c130c69778d7621a4378c2d3520214fe83b55`.
- Inventory: 36 ready annual models, 22 incremental packages, 48 catalog records and 979 production files.
- Final production manifest SHA-256: `e8db05724fe3bb37ee552c4fb6b8062d54fe3087e6cf384748b66ca29bc3785d`.

The Netflix layer adds exactly 45 production files and changes 14 shared production files relative to the MCD/Uber baseline. All 45 additions remain byte-identical to the approved corrected isolated Netflix version. Its source ZIP SHA-256 is `7684551fe41f296fc1503dfd9de200ed8742da2a29283002a0f5d5b2cd68cb55`; its isolated version-2 manifest SHA-256 is `90db5d23bd24520fc586aece0f787411927cd9da3b54ae5f1fa543f4139c6382`.

The later geometry layer changes exactly `dist/research.css` and `dist/skins/report.css`. Every financial JS/data file and all 62 company-source fixture files remain unchanged. Exact newest-layer reversal restores the company-only source, then NFLX, Uber and MCD reversal restores V85 and the older preservation chain. The prior-35 fixture SHA-256 is `f0f50f1c6eaa430d3abda8b59ef0bd050674c1be438d645536610d101466fa22`.

## Completed gates

- Corrected isolated Netflix: 39 focused tests; independent 7,669 arithmetic checks, 6,076 numeric comparisons, 36 edited operating/claim cases and four correction DOM/schema groups.
- Combined company focused gate: 45/45; exact preservation sweep: 46/46. Three catalog/count failures in an intermediate shared run were corrected and independently reviewed; its corrected focused rerun passed 48/48.
- Geometry-specific regression: 6/6. Final exact-preservation, prior-35, header and geometry sweep: 66/66, 90.872 seconds. Its log SHA-256 is `6561775cf46c2c77e9f793d71b4e626386976b67c0c7b380d02b72cda8ebf7f5`.
- Final actual-file-fetched parsed-DOM capture: 18 states, including six bilingual manual operating-EV simulations. Each synthetic saved-count run accepted seven EV trials, zero per-share trials, and retained a null current target. Seven is a QA configuration, not the default or a recommended trial count.
- Component geometry: 80 chart and 64 custom-control cases, including MCD's 11 periods, 10/15/20-year charts, both languages, constrained desktop panels, and 320/390/601/760px layouts. All plot tracks remain 108px; the annotation-to-explanation gap is at least 12.5px. Ten component crops were independently inspected.
- Final representative static views: MCD English/default and Simplified-Chinese/policy desktop; Netflix English/default desktop, English/policy plus manual EV simulation mobile, and Simplified-Chinese/invalid-input mobile. All five completed as single-page documents and were individually inspected and hash-verified. Unchanged Uber pre-repair views are retained with exact source equality and component proof.

Final capture-checks SHA-256: `d30bd9417b667fa76e5782b519a6a56d89e240533cae0b1fcf6b9aa11c3c6197`. Final five-view matrix manifest SHA-256: `cb14c02e844a13c64c72f22662200a36f2a2f19768d2cecce37fe59b1b98dd30`.

## Independent review records

These external reports are versioned evidence, not source assumptions:

- `REVIEW.md`: `111a26d8c9c064c740713b48efb2255599280d0d429fce89d1380154daa11ed0`.
- `COMBINED-SOURCE-REVIEW.md`: `e46dde6b86fc3c7f9c612da8c686c16039462b72038337cea365f3466c669c0b`.
- `COMBINED-CATALOG-REVIEW.md`: `31d51743fe7b85e60a763bd11e7457a5b0be93667715299fa0dfef85ce583d8d`.
- `COMBINED-TEST-SOURCE-REVIEW.md`: `4089c1acf94aa1e0de55f4cf191f9585c02040315e562b73825891a0de6e75b5`.
- `GEOMETRY-SOURCE-REVIEW-v2.md`: `2b1744d277b718715d90cdb3f971c371d0e30b3d769afe1d18865d99258a16ba`.
- `GEOMETRY-VISUAL-CLOSURE.md`: `6d006d513079b33367fa8a90071a08b8736068ba91bd4ac623eaf8dea2328a7f`.
- `VISUAL-FINAL-REVIEW.md`: `b98b4e8fae56d87ae7aba4fc733c584b12477625c3e226ba4fd56055c03445e6`.

All material review findings are closed. The independent reviewer rehashed all 979 production files at final closure with zero mismatches.

## Economic and evidence boundaries

The dated models do not establish a current share target. June-origin conditional allocation is explicit and separate from post-June capital ledgers. Netflix's October 20 Q3 results remain scheduled and pending at the October 19 cutoff. The reviewed cash-content, half-year stub, already-paid Brazil tax, financing hedge, existing award expense/budget/horizon and future-compensation constraints remain intact. Unsupported claim allocation cannot become a per-share Monte Carlo distribution. Ordinary editing has no added confirmation or rationale workflow.

Invalid numeric text is retained through draft persistence, export, cold reload, Undo and correction with strict numeric admission. The Chinese-invalid mobile PNG has the Result tab active: it proves withholding of the conditional value, not visually displayed raw `0x100`. Its evidence-banner wording is broader than that image alone; parsed-DOM/reload tests separately prove raw-text preservation.

Visual artifacts are labeled WeasyPrint source-driven approximations, not native-browser screenshots. Native numeric/select controls, unsupported CSS/grid/flex features and SVG presentation require adapters. The narrowly reviewed two-predicate ancestor-selector shim verifies real DOM ancestry and fourth-button count, retaining specificity and declarations without changing production. Native paint/font metrics, touch/focus, file pickers, sticky/scroll behavior, real-device interaction and all themes remain unverified.

The standard three-choice component has byte-identical before/after geometry at 320/390/760px in both languages. The constrained static fixture retains baseline overflow at 320px in both languages and 390px in English; 390px Chinese and both 760px cases fit. That existing limitation is neither claimed as repaired nor classified as a new company regression. Fiscal labels remain dense on narrow long-horizon charts, but the tested annotation area is contained. No broader styling or labeling change was made.

## Frozen aggregate protocol

After this documentation commit, create an external manifest of every tracked file and verify the clean tree. Run once, with no concurrent renderer or other heavy runner:

`node --test --test-concurrency=2 tests/*.test.mjs`

Record the exact commit, command, exit status, duration, pass/fail/skip totals and log SHA-256 externally, then reverify every frozen source hash and clean Git status. A pending aggregate is not approval to publish.
