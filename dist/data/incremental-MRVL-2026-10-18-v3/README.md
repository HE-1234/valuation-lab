# MRVL research package v2

Information cutoff: October 18, 2026. Financial origin: August 1, 2026. Research only; no app edits or publication.

## Result and status

The default operating EVs remain $30.4bn downside, $100.4bn base and $211.8bn management-delivery. Current-date equity/per-share outputs remain null. V2 corrects the independent review's scorecard/date findings and replaces the incomplete annual liquidity claim with explicit monthly settlement sensitivities. It does not claim a fully evidenced actual treasury forecast.

V1 received qualified independent approval for its dated operating case. V2 author-side closure is ready for independent re-review. 46,134 internal arithmetic assertions pass; these do not certify unavailable facts. All 24 original public v1 files, the original ZIP and the original 56 source records are preserved unchanged.

## Read in this order

1. AUDIT-CLOSURE-v2.md: resolved corrections, method changes and remaining factual gates.
2. RESEARCH-REPORT.md: full operating case and dated valuation conclusion.
3. TREASURY-FUNDING-v2.md: cash results, policy comparisons and limitations.
4. MODEL-NOTES.md: operating, grant-cost, R&D, tax, capital and contingent-claim conventions.
5. HISTORY-NOTES.md and history-10fy-v2.json / .csv: ten completed fiscal years with per-metric provenance.
6. operating-evidence-v2.json, management-speaking-evidence-v2.json and guidance-vs-actual-expanded-v2.csv: management statements and selected 13-quarter scorecard.
7. capital-claims-v2.json, sbc-policy-v2.json and treasury-settlement-assumptions-v2.json: dated facts versus analyst elections.
8. historical-cash-reconciliation-v2.json, funding-summary-v2.csv and conditional-funding-v2.json: reported cash and 21 conditional monthly cash paths.
9. valuation_v2.py, treasury_v2.py, validate_v2.py, forecast-scenarios-v2.json / .csv and sensitivities-v2.json: reproducible arithmetic.
10. source-ledger-v2.json, source-integrity-check-v2.json and public-file-manifest-v2.json: 63 sources, 90 verified archived hashes and artifact integrity. Eight original sources remain unhashed; the ledger does not claim all were locally archived.

## Reproduce

Python standard library only. Run `PYTHONDONTWRITEBYTECODE=1 python validate_v2.py` in this directory. It regenerates forecasts, sensitivities, cash paths, funding summary and validation-v2.json. No prices are fetched. Company per-share/current-date outputs remain null; the option allocator uses synthetic tests only. Original-file preservation checks run when the sibling v1 archive exists and are explicitly unavailable in a standalone ZIP copy.

Only original paraphrases, factual data, public source metadata and model code are included. Raw issuer documents stay in the separate research evidence archive. Full third-party interview captions remain private and excluded. No current quote, price target or common-equity valuation is supplied.
