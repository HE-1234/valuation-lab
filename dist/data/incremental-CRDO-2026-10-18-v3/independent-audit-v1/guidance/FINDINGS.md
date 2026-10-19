# CRDO guidance: independent source audit

Audit date: 2026-10-18. Scope: original issuer releases for the 18 consecutive quarters FY2022Q4–FY2027Q1, five metrics each, plus the provided annual/revision disclosures. No canonical or Site files were edited.

## Verdict

**The rounded quarterly panel is numerically correct against its cited original releases.** Independently reconstructed 90 metric observations, with 612/612 extraction, date/link, arithmetic and headline-versus-table rounding checks passing. Quarter continuity is complete with no duplicate or missing quarter. This is not a claim that every possible earnings-call revision has been collected.

The independent parser reads original HTML table cells and headline paragraphs. It does not run the canonical build scripts or rely on their extracted values. The missing June 1, 2022 release was independently opened at the panel's issuer-distributed GlobeNewswire URL; its five actuals and five guide ranges were verified. Dollar precision was cross-checked against that original table and the next original release's prior-quarter column.

## Confirmed qualifications and corrections

1. **Three range classifications change at original-table dollar precision.** The canonical panel explicitly uses rounded press-release headlines, so these are rounding-policy limitations rather than mistaken transcription. They matter if the panel is presented as exact beat/miss statistics.

| Quarter | Metric | Panel headline | Original-table actual | Original guide | Panel label | Exact-table label |
|---|---|---:|---:|---:|---|---|
| FY2024Q2 | Revenue | $44.0m | $44.035m | $42–44m | Within | Above |
| FY2024Q2 | GAAP opex | $35.0m | $34.992m | $35–37m | Within | Below |
| FY2025Q4 | Non-GAAP opex | $52.0m | $52.021m | $50–52m | Within | Above |

Sources: [FY2024Q2 original release](https://www.sec.gov/Archives/edgar/data/1807794/000162828023040220/credoq22024ex-991.htm), statements of operations and non-GAAP reconciliation; [FY2025Q4 original release](https://www.sec.gov/Archives/edgar/data/1807794/000162828025028827/credoq42025ex-991.htm), non-GAAP reconciliation.

2. **FY2023Q4 revenue guide date/source needs metric-specific provenance.** The first explicit $30–32m range in the source set is [February 14, 2023, Item 7.01](https://www.sec.gov/Archives/edgar/data/1807794/000162828023003504/crdo-20230214.htm). March 1 reiterates that revenue range and supplies the four margin/opex ranges. The panel's row-level March 1 date is valid for that five-metric release but is not the earliest revenue-guidance date. Numerical scoring is unaffected. The existing revision ledger already notes this distinction; the panel itself should surface it.

3. **Non-GAAP margin definitions change at FY2023Q4.** The [March 1, 2023 release](https://www.sec.gov/Archives/edgar/data/1807794/000162828023005837/credoq32023ex-991.htm) includes warrant contra-revenue as a non-GAAP adjustment, including a 0.1 percentage-point item in the FY2023Q4 outlook reconciliation. The [May 31, 2023 release](https://www.sec.gov/Archives/edgar/data/1807794/000162828023020320/credoq42023ex-991.htm) omits that adjustment and presents prior FY2023Q3 non-GAAP margin as 59.1%, versus its originally reported 59.3%; prior FY2022Q4 becomes 63.4%, versus original 63.7%. Preserving as-original values is correct for the stated panel. Still, add a definition-change flag: FY2023Q4's original non-GAAP guide and reported actual are not fully like-for-like. This does not reverse that quarter's above-range margin conclusion.

4. **Structured annual/revision coverage is incomplete, while the study narrative is accurate.** FY2023's repeated revenue floor of $200m, supported by the August 31 and November 30 releases, missed at $184.194m: $15.806m, or 7.903%, below the floor. The study and observations already disclose this correctly. The structured revision file does not contain a standalone annual-miss record. February 14's FY2024 flat-sales outlook is correctly recorded; actual FY2024 revenue $192.970m versus $184.194m is +4.7645%. “Flat” is qualitative and should not be converted into an invented tolerance band.

5. **FY2026Q3 revision handling is correct.** December 1's original $335–345m revenue guide remains the primary benchmark. February 9's $404–408m preliminary result arrived after the January 31 quarter-end. Final revenue was $407.012m, within the preliminary range and $62.012m above the original high end. That February 9 release also gave qualitative sequential mid-single-digit growth and annual growth above 200%; those clauses are not captured by the three-entry revision file. FY2026 annual revenue of $1,335.116m versus $436.775m was +205.6759%, meeting the annual statement. These omissions are ledger completeness issues, not a hidden annual miss.

## Score interpretation

At original-table precision (margins remain at reported 0.1 percentage-point precision):

| Metric | Above | Within | Below |
|---|---:|---:|---:|
| Revenue | 12 | 6 | 0 |
| GAAP gross margin | 10 | 6 | 2 |
| GAAP opex | 11 | 5 | 2 |
| Non-GAAP gross margin | 10 | 6 | 2 |
| Non-GAAP opex | 5 | 12 | 1 |

“Above” is not automatically favorable: higher opex is an adverse range deviation. Zero quarterly revenue shortfalls does not erase the FY2023 annual revenue miss. All figures compare management guidance, not analyst consensus. Tiny dollar-boundary deviations above should be labeled rounding-sensitive, not presented as economically material beats/misses.

## Deliverables

- `verification.json`: 90 independently reconstructed observations, source/table coordinates, SHA-256 source fingerprints, counts and boundary changes.
- `verified-comparisons.csv`: all 90 comparisons with headline and original-table actuals, outcomes and source links.
- `checks.json`: 612 individual checks; all pass under the canonical headline convention.
- `annual-and-revisions.json`: verified annual miss, first range, flat outlook, preliminary update and the omitted annual-growth clause.
- `verify_guidance.py`: reproducible independent DOM/table audit. Requires Python and lxml; writes only into this audit folder.

Limitations: original June 1, 2022 release is independently web-verified but not archived as HTML in the canonical corpus; its audit transcription is explicitly identified. The source corpus is not a complete transcript archive, so this audit does not certify completeness of earnings-call-only annual guidance or mid-quarter revisions.
