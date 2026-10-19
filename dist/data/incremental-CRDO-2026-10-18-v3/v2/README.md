# CRDO corrected version2
Start CORRECTIONS-v2.md, then STUDY-v2.md. This directory supersedes the four v1 implementation blockers and guidance/wording defects. Original v1 and the independent v1 review are preserved unchanged. Independent v2 recheck is pending. No canonical/Site edits.

## Replay (standard-library Python, no network)
- python replay_dcf.py
- python build_sensitivities.py
- python test_corrections.py
- python update_study.py

dcf-inputs-v2.json is the editable canonical configuration. Do not rerun prepare_inputs.py after editing it: that helper resets the default corrected inputs from frozen v1. Dates, interim cash components and net RSU issuance/withholding/conditional price are wired to the equations. Reported-balance and current scenarios remain separate.

## Key deliverables
- CORRECTIONS-v2.md: B1–B4 and guidance corrections; evidence and limitations
- STUDY-v2.md: full corrected company study
- dcf-inputs-v2.json / dcf-output-v2.json / forecast-v2.csv
- sensitivity-v2.json:55 rows, including funding-rejection statuses
- correction-tests-v2.json:65 author correction tests, not external sign-off
- funding-gap-stress-v2.json: auditor's adverse case now rejected with null valuation
- source-ledger-v2.json: distinct accession identities; amendment explicitly unretained
- guidance-comparisons-v2.csv/json:90 metrics, dual precision and comparability warnings
- definition-change-v2.json / annual-and-revisions-v2.json
- ../history-v1.csv and ../history-field-provenance-v1.json: unchanged reported history
- ../independent-audit-v1/: independent review motivating these fixes

Funding status must be shown beside results. If status is unsupported_funding_gap, the application must not substitute a previous price or turn null into zero. Return the shortfall and require changed assumptions or a separately implemented financing model. Even supported results establish annual/stub feasibility only, not intra-quarter liquidity.
