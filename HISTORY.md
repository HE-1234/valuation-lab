# Assumption history evidence

`dist/data/company-history.json` is an additive current-research dataset. The original historical workbench, snapshots and freezes are not changed. It contains five full fiscal years for the twelve US filers and TSM, three comparable recast years for Nebius, and opening annual references where available.

## Read-only UI contract

`assumptionEvidence(dataset, ticker, key, {snapshot, marketReferences, cutoff})` in `dist/assumption-history.js` returns a rendering model with `title`, `unit`, `status`, `kind`, annual `series`, descriptive `range`, `summary`, `cautions`, `formula`, `sources`, optional separate `ttm`, contextual series and dated market components. It never changes an assumption, applies an estimate, calculates a valuation, or relaxes a model gate.

Rates are fractions, capital productivity is a multiple, financials use reporting-currency millions. Primary and contextual observations retain full fiscal dates and source links. Annual ranges do not include TTM, nulls, nonpositive-denominator ratios or tax observations unsuitable for normalization.

## Comparability

- Growth requires adjacent full fiscal years, including 52/53-week calendars. A missing year never becomes an annual change.
- Operating margin is reported or explicitly derived EBIT divided by revenue. Coherent's FY2024–2026 operating subtotal is derived from the original line items, not mislabeled as a reported subtotal.
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

This is **latest-reported** research, potentially including restatements and recasts, not an as-released time machine. Each metric's `availableFrom` includes numerator and denominator evidence, including prior-year capital/revenue. The UI withholds values whose selected evidence was filed after the user-selected cutoff. It does not backfill older contemporaneous versions.

The history range is descriptive evidence, not a recommended range, default assumption, predictive interval or investment recommendation. See the linked Damodaran teaching references in the dataset methodology.
