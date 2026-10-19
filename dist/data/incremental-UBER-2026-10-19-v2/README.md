# UBER v2 research package

Read `STUDY-v2.md` first. June 30, 2026 operating/capital anchor; October 19 information cutoff. No canonical edits or publication.

## Offline replay, Python 3 standard library

    python replay_dcf_v2.py
    python replay_dcf_v2.py --policy equity-policy-illustration-v2.json --output illustration-output-v2.json
    python rollforward_v2.py
    python verify_v2.py
    python verify_bundle_v2.py

Default per-share output is null because the claim policy is unselected. The named illustration is explicit analyst assumptions, not an approved default. Save a chosen policy as a different local JSON and pass `--policy`. Output names must end in `output-v2.json`. The October rollforward likewise requires all unknown choices and an assumption rationale; it never claims a verified current target.

- `history-v2.json/csv`, `history-field-provenance-v2.json`, `history-comparability-v2.json`: ten annual slots, with partial unaudited selected 2016 data; nine full CFO years. The 2017 revenue recast trap is explicitly corrected.
- `source-provenance-v2.json`, `source-evidence-hashes-v2.json`: dated public primary sources and evidence hashes.
- `latest-financials-v2.json`, `operating-mix-history-v2.json`, `profit-quality-v2.json`, `investment-detail-v2.json`: reported facts, scoped calculations and accounting caveats.
- `dcf-inputs-v2.json`, `forecast-v2.csv`, `dcf-output-v2.json`, `sensitivity-v2.json`: editable annual FCFF scenarios and replayed results.
- `capital-claims-scope-v2.json`, policy template/illustration and `illustration-output-v2.json`: ownership/claim choices; no EPS-share denominator substitution.
- `post-june-capital-events-v2.json`, `post-june-rollforward-template-v2.json`, `rollforward_v2.py`: known financing/acquisition events with paired cash/debt arithmetic and explicit unknowns.
- `readiness-v2.json`, `verification-v2.json`: readiness and author validation; independent review pending.

The public-safe ZIP contains original analysis, derived facts, citations and replay code. Raw filings and transcript bodies are excluded. v1 and its construction scripts remain preserved separately. v2 reuses the frozen history and June numerical assumptions, with corrected post-June facts and a redesigned optional October ledger. Read `CHANGELOG-v2.md` and `OCTOBER-BRIDGE-v2.md`. Once frozen, run experiments in a separate copy or a new version; do not overwrite this package. Author validation is not independent admission approval.
