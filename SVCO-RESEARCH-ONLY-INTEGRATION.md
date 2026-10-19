# SVCO research-only integration

Baseline: canonical V75, commit `107a8d945dcfd7e10ae591b47733bfb86a69b6de`.
Worktree: isolated SVCO overlay. No canonical edits, publish, additional ready case, or financial-engine change.

## Boundary

The existing verified `atlas:SVCO` directory row remains `research-pending` at the engine boundary. Its presentation now says **Research complete · valuation blocked**, distinguishing completed scoped research from valuation readiness. There are still 30 ready cases. No ticker, valuation package, preset, numeric EV, common-equity value, price target, upside, ranking or simulation is introduced for SVCO.

Selecting SVCO uses the existing segregated pending workspace: it releases the previous simulation, clears live company/draft references, and ignores late simulation callbacks. It never writes a new draft or changes the prior saved valuation. Returning to the prior ready company restores the exact saved draft. No shared workspace or selection handler was edited.

The existing Annual typography, document flow, six themes and language control remain intact. All authored report prose and option captions have explicit English/Simplified Chinese text. Legal names, dates, numbers, source URLs and provenance hashes retain their original identity.

## Evidence

The expanded source-linked report is embedded in the existing SVCO pending screen. `dist/data/svco-research-only-v2.json` is its curated, public-safe evidence/status record, with primary-source URLs, historical observations, bilingual analysis, audit scope and artifact-integrity hashes. No raw filings, transcripts, retrieved source dumps, stress EVs or incomplete common-equity bridge outputs are copied into production.

- Five observed operating years (2021–2025), with cash-flow and comparability breaks. 2016–2020 are unobserved. Missing 2021 CFO remains missing.
- Five completed guidance comparisons and one pending Q3 2026 forecast. Two completed rows concern the same FY2025 actual period and are not independent realized periods.
- Note conversion price is variable: 90% of conversion-date fair value versus 115% of the August 5, 2026 Nasdaq close, whichever is lower. The dollar ceiling, Nasdaq capacity, approval status and future ownership are unresolved.
- Corrected v2 has 126 dated events per case; all vendor cash is reserved immediately. Note proceeds arrive August 6, 2026; scheduled conversion is August 7, 2028 with 732-day interest. Hypothetical cap-excess cash is reserved at issuance. These are conservative analytical reserve assumptions, not factual restricted-bank balances.
- Evenly distributed month-end operating cash and uncommitted equity financing are stress conventions, not proof of intra-month solvency. Default, change of control, financing refusal and recovery remain open.
- Actionable promotion gates address current capital, legal capacity, financing failure, ownership allocation and independent common-equity review. They do not ask the user to confirm assumptions or imply that a button can bypass the gates.

## Exact preservation

`tests/fixtures/svco-research-only-v75.json` inventories every V75 production hash and the exact reversible presentation change. `reverseSVCOResearch` checks the entire reviewed after-hash before reversing only the approved spans. Any unrelated mutation fails. The existing KEYS/earlier preservation chain calls this reversal first; old fixtures and goldens are unchanged. Prior inventory checks include only the two explicitly hash-checked SVCO additions.

Production modifications: `dist/company-catalog-view.js` only.
Production additions: `dist/svco-research-only.js`, `dist/data/svco-research-only-v2.json`.
All model, source-library, simulation, manual-run, CSS, skin, theme, route and workspace-handler bytes are unchanged.

## Review scope and limits

Focused checks cover both source-rendered languages and live locale switches, selector labels, actual evidence counts, all null valuation fields, 30-case ordering/count, repeated ready → SVCO → ready transitions, storage/draft equality and late callbacks. Prior KEYS/ARM/SNDK golden comparisons preserve reviewed default, edited, seeded and restored results. Manual Monte Carlo and all six theme tests pass.

This is static/synthetic-DOM EN/ZH review. It establishes markup, locale binding and state behavior, not native-browser rendering, painted layout, motion, mobile touch, keyboard/accessibility-tree or screen-reader behavior. No renderer or browser process was launched. No screenshots or authentic browser sign-off are claimed.

Independent screen review precedes the immutable full aggregate. Aggregate command: `node --test --test-concurrency=2 tests/*.test.mjs`. Logs and final aggregate attestation are kept outside the immutable source snapshot. The parent owns final integration/publication and any native-browser acceptance.
