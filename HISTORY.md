# Assumption history evidence

`dist/data/company-history.json` is an additive current-research dataset. The original historical workbench, snapshots and freezes are not changed. It targets ten full fiscal years, keeps shorter genuinely comparable records explicit, and includes an eleventh opening annual reference where available. A ten-row record does not mean every metric is available in every year or that the business has stayed economically identical.

## Fiscal coverage

| Company | Reported annual window | Years | Opening reference |
| --- | --- | ---: | --- |
| AAPL | FY2016–FY2025 | 10 | FY2015 |
| MSFT | FY2017–FY2026 | 10 | FY2016 |
| AMZN | FY2016–FY2025 | 10 | FY2015 |
| GOOG | FY2016–FY2025 | 10 | FY2015 |
| META | FY2016–FY2025 | 10 | FY2015 |
| NVDA | FY2017–FY2026 | 10 | FY2016 |
| TSLA | FY2016–FY2025 | 10 | FY2015 |
| COHR | FY2017–FY2026 | 10 | FY2016 |
| LITE | FY2017–FY2026 | 10 | FY2016 |
| AAOI | FY2016–FY2025 | 10 | FY2015 |
| MU | FY2017–FY2026 | 10 | FY2016 |
| AVGO | FY2016–FY2025 | 10 | Unavailable |
| TSM | FY2016–FY2025 | 10 | FY2015 |
| NBIS | FY2023–FY2025 recast | 3 | Unavailable |

Coverage is metric-specific. META's FY2016–FY2021 mapped debt remains unavailable, so its capital proxy is not zero-filled. LITE's FY2019 capital mapping and AVGO's FY2016 capital mapping are unavailable. AVGO's missing FY2015 opening reference leaves FY2016 growth unavailable. AAOI's older profitable FY2017 provides one usable tax observation; its FY2016 tax benefit is visible but excluded, while FY2018–FY2025 pretax losses have no usable effective tax rate.

AAOI's additive FY2019–FY2025 history corrects a prior bank-only debt mapping: separately disclosed convertible senior notes are now included, with FY2023's current convertible portion added separately. FY2025 mapped debt is $163.804m (bank debt $33.975m plus convertible carrying value $129.829m). Book-capital and dependent productivity ratios are recalculated; loss-year ROIC remains unavailable. The reviewed components, original statement rows, URLs and source hashes are recorded in `scripts/aaoi-history-debt-review.json`. The builder withholds affected capital proxies if this reviewed mapping is missing or no longer reconciles. FY2024 follows the tagged Note K bank subtotal of $26.682m, with the $0.001m difference from the face balance sheet stated explicitly. Frozen datasets are not changed by this correction.

COHR's ten reported years include six legacy II-VI years before the July 2022 Coherent acquisition. All exact observations remain visible, while pooled summary ranges use FY2023–FY2026 only. FY2023 growth and capital-change/return comparisons using a pre-acquisition denominator are also excluded from those ranges. These are descriptive post-acquisition ranges, not normalized or predictive ranges.

## Read-only UI contract

`assumptionEvidence(dataset, ticker, key, {snapshot, marketReferences, cutoff})` in `dist/assumption-history.js` returns a rendering model with `title`, `unit`, `status`, `kind`, annual `series`, descriptive `range`, `summary`, `cautions`, `formula`, `sources`, optional separate `ttm`, contextual series and dated market components. Its additive `coverage` object carries the requested and actual year counts, fiscal window, opening reference, shortfall/comparability notes, metric-level available/range counts, and cutoff-aware `observationYears`/`rangeYears` for the selected primary series. Individual points retain `comparabilityNote` and `rangeEligible`. It never changes an assumption, applies an estimate, calculates a valuation, or relaxes a model gate.

Rates are fractions, capital productivity is a multiple, financials use reporting-currency millions. Primary and contextual observations retain full fiscal dates and source links. Annual ranges do not include TTM, nulls, nonpositive-denominator ratios or tax observations unsuitable for normalization.

## Comparability

- Growth requires adjacent full fiscal years, including 52/53-week calendars. A missing year never becomes an annual change.
- Operating margin is reported or explicitly derived EBIT divided by revenue. Coherent's FY2024–2026 operating subtotal is derived from the original line items, not mislabeled as a reported subtotal.
- A full decade of reported statements is not a like-for-like decade of today's business. Lumentum's Oclaro, NeoPhotonics and Cloud Light acquisitions and Broadcom's major acquisitions change the interpretation of historical growth, margins and capital. Their `comparableAnnualYears` is deliberately null rather than asserting ten equivalent current-business years. COHR's explicit predecessor range exclusions are described above.
- Effective tax is tax expense divided by positive pretax income. Tax benefits and rates above 100% remain visible but are excluded from normalized ranges and after-tax capital returns. Loss years are explicitly unavailable. Nebius's FY2025 investment revaluation makes its positive-pretax tax ratio unsuitable as a normalized operating tax anchor.
- Book capital is a **cash-only financing proxy**: book equity + mapped debt − cash equivalents. It is not normalized operating invested capital. Securities, R&D, leases, acquisitions, goodwill, buybacks and incomplete claims mappings matter.
- Sales / ending book capital is a historical stock ratio. The DCF input is incremental revenue / reinvestment. Change in sales / change in book capital is an additional noisy diagnostic, not observed economic reinvestment. Nonpositive changes in capital are withheld.
- Book ROIC uses EBIT after a meaningful reported effective tax rate divided by **prior-year** book capital. It is explicitly an unadjusted accounting proxy, not a measured terminal or future marginal return.
- WACC, terminal growth, a normalization adjustment and additional assets/claims have no single reported historical counterpart. They receive sourced contextual evidence; no historical WACC, beta or recommended input is fabricated.
- TSM history uses IASB IFRS and TWD. It is not concatenated with the current TIFRS TTM series. ADR, FX and specialist model gates are unchanged.
- Nebius history uses FY2025-recast continuing operations. Old Yandex totals are excluded; there are only three comparable years.

## Provenance and rebuilding

`python3 scripts/build-company-history.py [SEC-cache-directory] [output-json]` rebuilds without network access from primary SEC Company Facts, cached original documents, submission metadata and the reviewed `scripts/foreign-history-source.json` table evidence. It defaults to the source cache used for the current-universe release. The foreign supplement preserves exact table cells/rows, filing URLs, accession IDs, source hashes and arithmetic; it is not a scraped secondary-data feed.

`rawValue` on SEC facts is the original base-unit API value; dividing by one million yields the displayed value. Foreign issuer tables report directly in millions: their literal `reportedTableValue`, `rawUnit`, `multiplierToMillions` and nested `tableEvidence` preserve that distinction. Missing fields remain null with reasons.

US history uses the cached primary SEC Company Facts response and preserves its endpoint, retrieval date and SHA-256. `originalDocumentVerified` stays false when the original HTML has not separately been matched; selecting an older SEC fact does not upgrade that audit status. Exact filing accessions are retained even when older submission metadata only permits an accession-index link.

This is **latest-reported** research, potentially including restatements and recasts, not an as-released time machine. Each metric's `availableFrom` includes numerator and denominator evidence, including prior-year capital/revenue. The UI withholds values whose selected evidence was filed after the user-selected cutoff. It does not backfill older contemporaneous versions.

The history range is descriptive evidence, not a recommended range, default assumption, predictive interval or investment recommendation. See the linked Damodaran teaching references in the dataset methodology.
