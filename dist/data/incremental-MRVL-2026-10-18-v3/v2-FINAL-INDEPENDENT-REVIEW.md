# MRVL v2: final independent closure review

Review date: October 18, 2026. Financial origin: August 1, 2026. Amounts are USD millions unless stated otherwise.

## Final decision

**Ready as dated, conditional operating research and explicitly assumed treasury sensitivities. Not ready as a current common-equity valuation or a determination of actual liquidity adequacy.** Keep current equity, per-share value, actual liquidity adequacy and forecast covenant compliance null.

The v1 findings are closed at the appropriate level: three factual corrections are made, omitted treasury cash categories are now modeled, and unsupported conclusions have been withdrawn. Actual settlement quantities, future credit access and scenario-contingent equity values are still unresolved facts or assumptions. Their absence is honestly preserved rather than counted as a passed fact.

No additional blocking numerical or economic double-counting defect was found in the reviewed implementation. This is qualified readiness for a conditional research dossier; it does not authorize a trade or imply that an application requiring a complete current price/fair-value model can treat the company as valuation-complete. No application writes were made. Original v1 and v2 files remain unchanged.

## Independent verification

The author runner reproduced **46,134 passes** in an isolated full-layout copy. Its forecast, sensitivity, treasury, summary and validation outputs are byte-identical to the frozen v2 files.

Separately, review_v2.py does not import or execute the author's valuation or treasury functions. It uses the earlier independent mathematical DCF implementation, extends its capital stress explicitly, and builds a separate monthly debt-event book. It independently reproduces:

- All original operating row values and all 42 sensitivity cases
- All 21 treasury cases over 186 months each, including award cash translations, coupon/principal events, hypothetical refinancing, commitment fees, revolver interest/draws/payoffs and the pre-positive-NOPAT ordering
- All funding minima, peak draws and reported gaps
- Corrected source observations, contractual bond provisions and all 90 recorded source-file hashes
- All original v1 file hashes, all 31 frozen v2 file hashes, and the unchanged ten-year history rows

The independent comparison contains 125,859 passing checks. Most are repeated monthly fields; this is coverage of calculation consistency, **not 125,859 independent pieces of investment evidence**. The 63-source ledger preserves all 56 original records and adds seven primary debt/credit records. Eight original sources remain unhashed, as disclosed.

Default operating EVs remain **30,440.712800 downside / 100,409.358048 base / 211,790.166782 management-delivery**. They are August-origin scenarios using an October information set. No October current equity value or August backtest is established.

## Closure of earlier findings

### Factual corrections: closed

- C1: Q1 FY2025 revenue is 1,160.9; midpoint beat 10.9 / 0.9478260869565%. The exact [issuer statement table](https://investor.marvell.com/news-events/press-releases/detail/138/marvell-technology-inc-reports-first-quarter-of-fiscal-year-2025-financial-results) now takes precedence over its rounded headline.
- C2: dividend declaration September 25, record October 9, payment October 29, 2026. The [dividend filing](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001628280-26-063592/mrvl-20260925.htm) and v2 descriptions agree.
- C3: Google measuring period August 1, 2026–January 29, 2033, distinct from August 18, 2033 expiry subject to extension. V2 now retains the [contract dates](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-26-356217/d412696dex41.htm).

### Economic compensation versus treasury cash: method closed, actual schedules gated

Legacy withholding is now a separate cash use in both treasury policies. Under literal cash replacement, the new-grant economic charge remains a cash payment and is not charged another new-award withholding amount. Under future equity settlement, that economic charge is reversed solely for cash translation, its assumed current tax deduction is also reversed, and modeled future vesting withholding is deducted. The original full economic grant cost remains in the DCF in both cases.

This resolves the earlier category error without adding a second compensation cost to equity valuation. Gross legacy claims remain a claim-allocation matter; their actual withholding remains a treasury payment. The future four-year vesting pattern, 35% withholding rate, unchanged settlement-value proxy and legacy attrition schedule are clearly labeled assumptions. No employer vesting tax benefit or unverified employee exercise/contribution proceeds are credited. They do not establish the real vesting schedule.

### Other cash categories: method closed, exact facts gated

A negative forward-settlement scenario is included without treating the August positive fair-value mark as cash protection. The assumed 300 outflow is explicitly neither a contractual maximum nor a verified payoff. The declared dividend is included using a stale-share-count proxy, not asserted as the exact payable. Opening license, restructuring, tax and maximum cash earnout are separately earmarked. None of these treasury results is added to or subtracted from operating EV or stacked onto its equity-claim bridge.

The original preferred, earnout, customer-warrant and legacy-award anti-double-counting policies remain intact. The new joint-state/correlation gate appropriately prevents using a simple vesting multiplier on a vanilla option as an approved company contingent-claim valuation.

### Debt, facility and timing: method closed, access remains conditional

Eight existing bond positions' maturity/coupon mappings agree with the archived primary indentures and the [April 2026 8-K](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-26-157134/d123910d8k.htm). Repayment and hypothetical five-year refinancing are distinct cases; repeat replacement maturities are included.

The [revolver contract](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-25-152676/d859414dex101.htm) supports the five-year June 2030 boundary, preceding-business-day convention and 4.00× contractual leverage limit. The model repays any remaining revolver balance in June 2030 and permits no June-or-later draws. Its refusal to use even early-June capacity is a disclosed conservative monthly approximation, not an assertion that the legal facility expires June 1. Rates, opening accrued fees and future covenant access remain assumptions.

Monthly operating amounts are approximations of the fiscal-week calendar. Paying all modeled cash uses before positive monthly NOPAT and frontloading annual investment are stress orderings, not observed transaction schedules. After an unfunded gap, later balances are explicitly budget arithmetic with no invented source or cost of gap financing.

### Sensitivity labeling: closed

The old capacity sensitivity is correctly labeled as a reallocation/floor test. The new extra-400 H2 case preserves H2 other investment and reduces base EV by **378.914149**, rather than **80.933694** in the reallocation case. Later floors may change, as disclosed.

Pure WACC changes now hold terminal incremental ROIC at 9% and preserve operating cash flows. Base pure-rate EVs are **83,731.522987 at +1pp / 123,880.095775 at −1pp**. The original coupled WACC/ROIC cases remain separately labeled. Both treatments reproduce.

## What the funding results establish

The old all-scenarios-fit-opening-cash conclusion is gone. Independently reproduced examples:

| Conditional policy | Downside gap | Base gap | Management-delivery gap |
|---|---:|---:|---:|
| Literal cash compensation; repay bonds | 4,132.999 | 1,136.502 | 21.530 |
| Literal cash compensation; refinance bonds | 1,503.274 | 0 | 0 |
| Future equity settlement; repay bonds | 0 | 0 | 0 |
| Literal cash compensation; conditional revolver | 4,382.759 | 0 | 0 |

These are maximum deficits before positive monthly NOPAT under chosen settlement/timing assumptions. The 1,184.862 base peak revolver balance uses unverified borrowing access and is repaid before expiry. In downside, the nominal limit and eventual payoff do not cure the gap. The upper repayment case's positive month-end cash alongside a 21.530 ordering gap is correctly explained. Equity-settled cases' zero gaps do not make equity compensation costless or verify actual cash adequacy.

A cash gap here is a condition requiring financing or changes to assumptions; it is not demonstrated company insolvency. Conversely, a zero gap is not proof those assumptions or future credit access will occur.

## What remains unresolved and prevents a current equity/funding conclusion

1. A common-date post-August cash, debt, share, award and customer-warrant reconciliation
2. Actual legacy vesting/withholding, future grants, performance outcomes, settlement values and tax timing
3. Exact dividend eligibility/payable on the October record date
4. Original forward confirmation, payoff and early-termination mechanics
5. Actual supplier investment, tax and other required cash timing
6. Future contractual covenant calculations, lender consent and refinancing terms/access
7. Joint operating-state valuation of employee/customer options and Celestial shares/cash, including correlation, plus the exact earnout payout steps

Some are unavailable current disclosures; others are inherently future uncertainties. None can be recovered merely by increasing the assertion count. Public evidence may later resolve particular inputs, or a dated conditional equity case could explicitly adopt suitable assumptions after review. V2 properly does neither silently.

**Final qualified readiness:** use v2 as a transparent conditional research package with this review attached and all gates visible. Do not promote it to a completed current common-equity valuation, verified financing plan or price target.
