# ALAB and ADBE Guided evidence review — 2026-10-21

SEC submissions checked through the cutoff. ALAB latest annual FY2025 (filed 2026-02-20), latest quarter 2026-06-30 (filed 2026-08-05). ADBE latest annual FY2025 ended 2025-11-28 (filed 2026-01-15), latest quarter 2026-08-28 (filed 2026-09-22). Core revenue, EBIT, cash, debt, actual shares and awards cross-checked in original HTML statements and notes; documents cached under `/tmp/guided-next-four-20261021`.

## ALAB

- Annual revenue / EBIT: $852.525m / $173.423m. TTM: $1,201.919m / $273.445m, using annual plus first-half 2026 less first-half 2025.
- Debt and finance leases: none; original balance sheets and lease notes reviewed. Operating lease liabilities $30.974m / $44.413m are not financial debt.
- Actual common shares 170.186m / 173.485m. RSU + PSU balances 9.531m / 9.555m. Employee options 2.721m at $0.86 / 1.693m at $0.89 with disclosed remaining life 5.5 / 5 years.
- Amazon warrants: maximum old 2.316175m at $20.34, October 2029 expiry; new 3.262299m at $142.82 through January 2033, first present in June. Separately modeled at the model stock price with all-contractual-shares vesting as conservative proxy. Grants' historical fair values are informational, not deducted again. Only 1.165513m warrants were vested at December and 1.663042m aggregate at June; full vesting is not a probability estimate.
- SVB 0.126185m warrants at $0.30, April 2031 expiry, included annual; June cashless exercise issued 0.125987m shares already in June common shares. IPO S-1 specifies term and count. No second June warrant claim.
- June acquisition indemnity holdback $5m separately deducted once. Acquisition shares issued are already in common stock. Other unquantified noncurrent investments are omitted, with residual-other-asset ceilings <$0.31/share; not zero-filled.
- Four genuine annual income-statement periods FY2022–FY2025, with original S-1 support for FY2022 cash/no-debt schedule. No fictional earlier income history. Pre-IPO preferred equity and IPO change capital comparability. FY2024 IPO compensation and later tax benefits remain reported; mature assumptions separately normalized.

## ADBE

- Annual revenue / EBIT: $23,769m / $8,706m. TTM $25,970m / $9,271m using annual + nine-month 2026 - nine-month 2025.
- Actual common shares 413m / 391m rounded as filed; RSUs and target performance shares 8.5m / 13.4m. This includes acquired Semrush awards. No EPS weighted-average denominator or additional anti-dilutive-EPS shares. Maximum performance payout adds only 0.6m shares above target.
- Debt $6,210m annual; current $1,597m (including commercial paper $248m carrying) + noncurrent $4,766m interim. No finance leases per annual accounting policy. Swap-adjusted carrying value follows debt reconciliation.
- Deferred-compensation designated assets excluded from surplus assets; $12m annual net liability (354 minus342) deducted and explicitly carried as small interim proxy because interim corresponding liability subtotal is unavailable. Approximate effect $0.03/share.
- Private investment carrying subtotal unavailable: source null retained, no extra asset value. Other assets less designated plan assets provide conservative upper ceilings $1,268m / $1,355m (<$3.4/share), not estimates of investment assets.
- Semrush $1.874bn acquisition completed April 28,2026 already reflected in balance sheet/results/awards; no second purchase-price deduction. Topaz $340m was unclosed at August base and is an explicitly dated pending transaction, not an invented current liability.
- Ten annual observations FY2016–FY2025 plus FY2015 opening data. Standardized XBRL annual facts retain original source URLs, units, dates; early current-debt zeros have original balance-sheet/no-current-maturity evidence. FY2024 Figma termination fee $1bn, FY2026 goodwill impairment $70m and stock compensation remain GAAP expenses.

Both `validate.py ALAB ADBE` pass with explicit unknown investment/claim warnings. Independent in-memory history build validates periods, raw unit conversion, original table provenance and derived component contracts. No generated `dist` files edited by this subagent.
