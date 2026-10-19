# CRDO onboarding research package
Version1, cutoff2026-10-18. Staging only. No Site/canonical edits.

Read STUDY-v1.md first. It separates filings, management claims and analyst conditional valuations. US listing and public Robinhood eligibility are verified. The study is research-ready but **not independently externally reviewed or publication-approved**.

## Reproduce
Python3, standard library only:
1. python build_history.py
2. python build_guidance.py
3. python make_model.py
4. python replay_dcf.py
5. python extend_sensitivities.py
6. python independent_validate.py
7. python build_evidence.py

No network needed for replay. Download helpers are optional provenance utilities, not replay dependencies. Company filings and SEC companyfacts are frozen locally. Do not rerun download helpers to silently replace the cutoff snapshot. The failed investor-site download attempt is logged in release-sources.json; successful SEC exhibits supersede it.

## Deliverables
- STUDY-v1.md: business, management evidence, risks, valuation, caveats and remaining gaps
- observations-v1.json: financial, mix, guidance, claims and recency facts
- history-v1.json/csv:10 fiscal slots,7 observed annuals; missing private years explicit
- history-field-provenance-v1.json: field-specific SEC provenance and units
- guidance-vs-actual-v1.json/csv:18 consecutive quarter comparisons,5 metrics
- earnings-release-extraction-v1.json: original reported ranges and actuals
- dcf-inputs-v1.json: observed capital structure and explicit analyst assumptions
- forecast-v1.csv and dcf-output-v1.json:10 fiscal forecasts,3 cases,2 date treatments
- sensitivity-v1.json: WACC/g, claims, SBC, capacity and bridge sensitivities
- independent-audit-v1.json:143 arithmetic/continuity/funding checks and source hashes; self-review, not external assurance
- source-ledger-v1.json: source URLs, dates, local filenames and observations
- Raw SEC filings/exhibits: support verification; no complete licensed transcripts retained

## Do not hide these limitations
Current October balances are estimates. FY2017–19 history is unavailable. Current product-line split and earnout milestone probabilities are undisclosed. PSU allocations are conditional, not a grant-level Monte Carlo model. Share counts are rounded in award rollforwards. Public stock-page price timestamps conflict, so no current return claim is made. No backtest or target-price fitting.
