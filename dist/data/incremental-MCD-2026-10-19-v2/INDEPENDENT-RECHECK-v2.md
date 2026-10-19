# Independent targeted recheck: McDonald's v2

Date: 19 October 2026. Disposition: **PASS for the package's limited dated operating and explicitly conditional allocation scope. R1 and R2 are closed. No new blocker was found.**

This is a narrow follow-up to the independent v1 source/model review. Neither frozen author package nor any retained original source was edited. No integration, publication or push was performed or approved.

## Corrections verified

1. **R1, alternative allocation prose:** Both alternatives now state their own six input amounts. Their generated `basis_amounts_USDm` maps agree with the numeric policies. The lower-claims/higher-assets policy uses 2,000 / 6,000 / 0 / 500 / 500 / 500 USDm for finance claims, affiliate equity, other assets, minimum cash, incremental awards and other claims. The opposite policy uses 3,000 / 3,000 / 0 / 1,500 / 1,500 / 2,000. The prior central-policy dollar amounts are no longer copied into those descriptions. Assumption, non-overlap and non-certification qualifications remain intact.
2. **R2, H1 restructuring boundary:** In each scenario, full-year restructuring of 0, 97.99 and the immediately adjacent representable number below 98 is rejected. Exactly 98 is accepted, giving zero remaining H2 expense. Moving from 98 to 99 reduces H2 EBIT by one USDm and FCFF by one minus that scenario's tax rate. Validation reads observed H1 rather than silently clipping the remaining expense.

## Unchanged results

All three scenario result objects and all 33 default period rows are exactly equal to v1. Forecast CSV bytes and sensitivity values are unchanged. All nine conditional allocation result objects are exactly equal to v1. Historical financial values and source/field provenance are unchanged; the history document's version metadata correctly advances to 2.

Operating EVs remain:

- Bear: $98,917.304582m
- Base: $187,793.290195m
- Bull: $292,139.628346m

## Portable execution and preservation

The v2 public ZIP was independently extracted into a fresh directory without retained source originals. Its verifier passed under ordinary Python and Python `-O`. The replay regenerated an identical default output in a separate output directory. The allocation generator regenerated identical examples in the extracted copy, after which all frozen package hashes still verified.

The source-provenance snapshot retains 16 matching original hashes. The original v1 ZIP, its manifest and all 26 manifest-covered payload files remain unchanged. The v2 archive and all manifest entries also remain unchanged after the recheck.

Approved archive identity:

`MCD-public-safe-v2.zip`

SHA-256: `18cf7498dd23a41a1357742c25addbf20bd07ed8947a365e4ccd18d41925a929`

The recheck groups relevant observations into ten test groups; the author's separate 881 checks are not represented as independent tests.

## Readiness and funding limitations retained

The added historical distribution-funding context is arithmetically correct: FY2025 CFO less capex exceeded cash dividends/buybacks by $15m; H1 2026 fell short by $185m, both before other flows. The added annual debt classification amounts, $798m short-term borrowings plus $725m current maturities classified long term under the June 2028 credit line, match the retained annual report. They are already included in reported debt and are not added again. [2025 annual report](https://www.sec.gov/Archives/edgar/data/63908/000006390826000035/mcd-20251231.htm), [June 2026 quarterly report](https://www.sec.gov/Archives/edgar/data/63908/000006390826000073/mcd-20260630.htm)

The frozen author readiness file truthfully records that recheck was pending at freeze. This separate report supplies the completed disposition; the frozen file should not be rewritten retroactively.

**Current-target and funding-certified admission remain closed.** The June finance split, existing-award non-overlap, asset/claim valuations and current-date capital roll-forward remain unresolved or assumption-controlled. There is still no verified current share price, current upside or current price target. The v1 review's scope and limitations otherwise continue to apply.

## Reproduction artifacts

- `recheck_v2.py`: targeted independent tests; writes only its review directory and freshly extracted copies.
- `recheck-results.json`: test-group results and separate limited-scope approval.
- `portable-execution-log.json`: ordinary/optimized verification, replay and example regeneration outputs.

This approval does not authorize canonical integration or publication.
