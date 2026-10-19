# Netflix (NFLX): primary-source onboarding, v3

**Q3 2026 results are scheduled for 20 October 2026 and were still pending at this package's 19 October cutoff.** This package does not contain those results.

- Fiscal history: ten calendar fiscal years, 2016–2025, plus H1 2026.
- Capital/discount anchor: **30 June 2026**. Information cutoff: **19 October 2026**. Later-known information is included, so these are retrospective conditional June scenarios, not ex-ante June forecasts.
- Default: dated operating enterprise-value scenarios. No selected equity policy, current target, current quote or current upside.
- Optional: a separately labeled illustrative June equity allocation. It depends on deliberately selected award, liquidity and unresolved-claim assumptions. It is not an exact option appraisal or a trading recommendation.
- Status: author checks passed; independent review pending. No canonical record, application, site, push or publication changes.

V3 retains the independently verified Brazil, content, financing-hedge and announcement repairs. It adds joint award-expense budget, vesting-window and retained-cost constraints after v2 allowed impossible expense edits. Both prior versions remain preserved; the named v2 illustration passed arithmetic review, while unrestricted edits were withheld.

Read `CHANGES-v3.md`, `STUDY-v3.md`, `readiness-v3.json` and `capital-claims-v3.json` before reusing the numbers.

## Replay

Python 3 standard library only, from this folder:

    python verify_bundle.py
    python replay_dcf.py
    python validate_model.py

`replay_dcf.py` regenerates the default unselected output, the explicitly illustrative allocation, forecast CSV, WACC/g sensitivity and financing-only ledger illustration. It does not select the illustration as a user default.

To use a deliberately chosen policy, save an edited copy of `equity-policy-template-v3.json`, then run:

    python replay_dcf.py --policy my-policy.json --output my-policy-output-v3.json

Only output filenames ending `-output-v3.json` are accepted. Keep the original bundle frozen and put substantive revisions in a new version. The model does not allow redating the June capital/discount anchor or changing pinned H1 facts through forecast overrides.

## Artifact map

- `history-v3.json` / `.csv`: ten-year reported and calculated data, with explicit gaps and comparability notes
- `history-field-provenance-v3.json`: numerical facts, fiscal periods, tags, split transforms and primary URLs
- `history-primary-table-checks-v3.json`: 70 cross-checks against primary income/cash-flow tables
- `operating-mix-history-v3.json`: geographic revenue and membership/ARM history, with gaps
- `latest-half-v3.json`: H1 2026 reported data and provenance
- `dcf-inputs-v3.json`: editable dated annual FCFF assumptions; management guidance is separately recorded
- `dcf-output-v3.json` / `forecast-v3.csv`: default core with unselected equity policy
- `equity-policy-template-v3.json`: missing claims remain null
- `illustrative-equity-policy-v3.json` / `illustrative-allocation-output-v3.json`: clearly selected analyst example
- `capital-rollforward-template-v3.json`: paired financing bridge and unknown post-June inputs
- `illustrative-financing-rollforward-output-v3.json`: July financing-only arithmetic; all other movements deliberately assumed absent, never asserted actual
- `sensitivity-v3.json` / `stress-output-v3.json`: WACC/g and operating sensitivities
- `source-provenance-v3.json`: primary-source URLs, retrieval timestamp, byte lengths and SHA-256 hashes
- `model-validation-v3.json`: 205 author checks, not an independent verdict
- `source-repair-checks-v3.json`: 12 focused checks of retained primary content; `verify_source_repairs.py` reproduces them when sources and `lxml` are present
- `manifest-v3.json`: hashes of public-safe artifacts

## Evidence boundaries

Original downloaded filings/API snapshots are retained separately under `sources/` for source audit. They are **excluded** from the public-safe ZIP. Numerical data, original analysis, source links and replay code are included. `fetch_sources.py`, `build_history.py`, `build_mix.py` and `make_inputs.py` document reconstruction; history/mix building additionally needs `lxml`. They are not needed for offline valuation replay. Fetching a live SEC API later may return a changed snapshot and cannot substitute for the pinned source hash.
