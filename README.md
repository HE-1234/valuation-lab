# Valuation Lab

Private, buildless browser application. Serve `dist/` with any static HTTP host. No server credentials, broker connections, market trades or paid API calls.

## Run and verify

`npm test` runs pure-engine tests. `npm start` serves port 8080. `tests/browser_qa.py` is the integration test (requires Playwright and a launchable Chromium). Local headless browser QA was attempted but blocked by this executor's socket permissions; an escalation failed before launch due to executor setup. Do not report browser tests as passed. The deployed owner-private origin was opened in the supported cloud browser and displayed its normal owner sign-in gate; authenticated interactive QA remains unverified.

## Architecture

- `dist/engine.js`: deterministic FCFF, claims, data validation, point-in-time eligibility, case lock and price outcomes.
- `dist/app.js`: browser UI, import/export, local persistence, diagnosis versions and exercises.
- `dist/data/companies.json`: source-linked original filing facts. Historical and annual-reference eligibility are distinct.
- `dist/data/nvda-cases.json`: explicitly classified dated assumptions.
- `dist/data/nvda-price-observations.json`: separate sparse outcome observations, never used to set assumptions.

All cash amounts and shares in millions. Default constant nominal WACC and ten-year linear transition, with optional explicit annual growth/margin/tax/sales-capital/WACC paths and cumulative discount factors, marginal sales/capital investment, terminal g/ROIC reinvestment. Negative growth does not imply automatic asset liquidation. No NOL ledger, distress waterfall, financial-company model, independent maintenance replacement, R&D capitalization. Reported financials require analyst adjustment.

Locks are immutable application records but browser storage is not tamper-proof. This is retrospective research, not a blind investment trial. Raw static data can be inspected; UI sequence is an educational discipline, not a security barrier. No strategy alpha claim is supported.

Imported data remain in memory until exported; saved experiments persist locally. No automatic live refresh; sources and filings must be verified before use. Private hosting authentication supplied by Sites.

## Version 3 research additions

Five frozen researched cases are available: Microsoft FY2019 and NVIDIA FY2021–FY2024. Microsoft is the default ordinary-business comparator; its full claims adjustments and future-service compensation credit are applied only when loading that research case. Original freezes and hashes live in `dist/data/research-versions/`; later outcomes and source diagnostics are separate files. Microsoft has a business-only FY2020–FY2021 comparison, not a price/return study. Annual company references remain dated, non-live, historically ineligible and blocked until claims-bridge review. No native personal data or credentials are bundled.

## Version 4 interface

Three selectable, locally persistent appearances: Paper & Forest, Slate & Blue, Midnight. The workbench prioritizes company/date selection, valuation and grouped assumptions. Full source/accounting detail remains in labeled disclosures. Charts have theme colors, units, a second-series pattern and a table alternative; mobile keeps all navigation/actions available. `DESIGN.md` records sources and verification limits. `npm test` now includes theme/contrast checks; real-browser interaction remains unverified in this restricted executor.

## Version 5 current guided workspace

The default is now a separate eight-stage current-company notebook. The historical workbench/research remains isolated: no current snapshot enters `eligibleSnapshots`, and original engine, research files and freeze hashes remain unchanged.

- `dist/current-model.js`: strict FY/TTM adapter, current-only eligibility, evidence and model gates, quote compatibility, safe draft restoration, immutable exports, optional WACC worksheet.
- `dist/guided.js`: progressive evidence/story/growth/profit/reinvestment/risk/claims/review workflow. Per-company and snapshot local drafts, a session fallback when storage is unavailable, immutable export. Imported raw data require export and are not uploaded.
- `dist/data/current-universe.json`: 14 requested companies, original filing/issuer evidence and derived TTM components checked as of 2026-10-17. Quarter/YTD evidence cannot be used as a full-year DCF. Unknown values remain null. TSM FX/ADR and NBIS financing/perimeter cases are researchable but withhold generic per-share results.
- `dist/data/current-market-references.json`: separately dated Treasury/ERP contextual references; neither silently sets WACC. The optional worksheet requires explicit Apply.
- `dist/data/provider-research.html`: free and paid-provider feasibility, costs and rights limits. No account, key, purchase or backend refresh was configured. This release intentionally implements the authorized dated 14-company fallback rather than a misleading live feed.

Six semantic themes now include Sand & Terracotta, Plum & Rose, and Ocean & Teal, available in a compact Appearance disclosure. Themes persist independently from financial inputs.

Additional automated tests use pure-function and minimal DOM fixtures, including eight-stage navigation, source-specific drafts, disabled storage, WACC application, null/quarter/model gates, evidence coverage and TTM arithmetic. They do not establish browser rendering or accessibility behavior. Approximate static WeasyPrint previews are not browser screenshots. Prior browser launch/access failures remain a verification limit; no access restriction was bypassed.

## Version 6 possibility studio

An original responsive visual system now replaces the sidebar with compact navigation, a dimensional SVG hero, a direct Monte Carlo shortcut, and interruptible tab/step entrances. Six existing semantic themes persist. The hero intro finishes in four seconds, and reduced motion skips transitions and particles. No image/animation library or remote font dependency was added.

The review step includes `simulation-view.js`, backed by the separately tested `simulation.js`. Four thousand seeded scenarios vary four explicitly illustrative triangular driver distributions. Pointer hover, captured touch drag, arrow/Home/End keys, a native range, statistic buttons, and exact tables inspect the conditional empirical distribution. Only a sourced, dated, currency/share-basis-compatible user quote gets a market-price percentile; no automatic quote is fabricated. Missing source/model gates still apply, including NBIS and TSM.

The particle replay builds the histogram with a bounded representative subset (112 desktop  / 64 phone); each arrival contributes its proportion of the full bin. The completed chart exactly restores all accepted samples' bin heights. Visible labels distinguish replay from the full-run statistics. Pause retains the partially built frame, and Resume continues it. Show full chart, reduced motion, hiding the document, switching tabs, theme change, leaving the viewport, and component replacement cancel particles and restore the exact final chart. Editing invalid ranges withholds the old graph. Export includes the full normalized snapshot, draft, seed/config, scenarios and result so it can be reproduced.

Verification: automated pure-engine, source-integrity, minimal DOM, and synthetic DOM/WAAPI event/lifecycle tests pass. Static WeasyPrint screen approximations were visually inspected at desktop and 390px; they are not browser screenshots, and form/motion fidelity is limited. Local Chromium still fails its socket permissions before launch. The existing private host requires owner sign-in in the cloud browser; no auth token was minted and no access control was bypassed. Real browser rendering, native touch and screen-reader behavior remain unverified in this executor.
