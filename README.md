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
