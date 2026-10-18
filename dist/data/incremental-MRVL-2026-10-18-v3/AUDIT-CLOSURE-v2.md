# MRVL v2: author response to independent audit

October 18, 2026. **Ready for independent re-review.** V1 and its audit remain unchanged. This is an author closure package, not a claim that the new version has already passed independent review.

## Decision for use

Default operating assumptions and EVs are unchanged: 30,440.712800 downside, 100,409.358048 base and 211,790.166782 management-delivery. These remain August-origin operating values informed by October information. Current equity/per-share and actual liquidity adequacy remain null. No current quote, price target, app edit or publication is supplied.

The v1 review qualified the operating research and core DCF, while rejecting a complete funding conclusion. V2 fixes the three stated data/date issues and the missing treasury categories. Where public facts cannot support an actual settlement schedule, v2 supplies explicit sensitivities and preserves the gate. It does not convert assumptions into evidence.

## Findings closed

| Finding | V2 response | Evidence/artifact |
|---|---|---|
| C1: rounded Q1 FY2025 revenue | Use 1,160.9, beat 10.9, beat 0.9478260869565217% | Corrected expanded scorecard; exact issuer statement |
| C2: dividend date label | September 25 declaration; October 9 record; October 29 payment | Claims JSON and model notes |
| C3: Google measuring period | August 1, 2026–January 29, 2033; distinguish August 18, 2033 expiry | Claims JSON and research report |
| Legacy award cash omitted | Schedule withholding under both future-compensation policies; retain gross-claim anti-double-counting only in valuation | Treasury code, assumptions, reported cash bridge |
| New-grant cost versus cash | Separate cash replacement from equity vesting/withholding; reverse unproven tax benefit for equity cash translation | Treasury code and SBC policy |
| Forward cash risk | Include adverse settlement and early timing; no positive-FV cash reserve | Treasury assumptions; full contract still gated |
| Declared dividend omitted | Include stale-count 53.92227678 proxy on payment month | Treasury assumptions; exact October count still gated |
| Principal and expiry | Dated coupon/maturity schedule, repay/refinance alternatives, June 2030 mandatory revolver payoff and no renewal | Seven new primary credit/debt sources |
| Annual timing insufficient | Monthly paths, outflows-before-positive-NOPAT check and annual-investment-frontloading stress | 21 cash paths and summary CSV |
| Capacity sensitivity mislabeled | Identify original allocation/floor test; add full 400 H2 stress with H2 other investment fixed | Sensitivity JSON and model code |
| Rate changes also move ROIC | Label coupled cases; add pure WACC cases holding terminal ROIC at 9% | Sensitivity JSON and invariance tests |
| Performance-dependent claim correlation | Require joint contingent-claim/operating states before company equity | Model notes and claims gates |

Primary correction sources: [Q1 FY2025 release](https://investor.marvell.com/news-events/press-releases/detail/138/marvell-technology-inc-reports-first-quarter-of-fiscal-year-2025-financial-results), [dividend filing](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001628280-26-063592/mrvl-20260925.htm), [Google warrant exhibit](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-26-356217/d412696dex41.htm).

## What materially changes the conclusion

The old all-cases-fit-cash statement is removed. A literal future cash-compensation policy with legacy withholding produces a base pre-financing gap around 1.14bn if bonds are repaid. Refinancing covers that base path, but leaves roughly 1.50bn downside gap. Illustrative future equity settlement has no modeled gap under its distinct assumptions. Severe timing tests fail by larger amounts. A negative cash budget is a funding condition, not a demonstrated company insolvency.

The new 400 H2 capacity stress reduces base EV by 378.9141, compared with 80.9337 for the original reallocation/floor case. Pure WACC +1/−1 percentage point tests produce base EVs 83,731.523 / 123,880.096, distinct from coupled WACC/ROIC values 86,728.711 / 117,859.866. No prices were used to choose these cases.

## Still not closed as facts

- Actual remaining award vesting, stock-price/tax settlement and employer-deduction timing
- Exact post-August cash, debt, share and claim roll-forward
- Actual October dividend payable
- Original forward confirmation and payoff/early-termination mechanics
- Future lender covenant compliance, borrowing capacity, renewal or refinance pricing/access
- Daily supplier-capacity, working-capital, tax and other required cash timing
- Scenario-linked employee/customer options and Celestial earnout values, including correlation

Those limitations are explicit use gates, not arithmetic failures. The package is suitable for review as dated conditional research, not as a complete actual treasury forecast or current common-equity valuation.

## Preservation and reproducibility

46,134 internal assertions pass, including cash/revolver/cohort identities, corrected records, rate/capital sensitivity invariance, and preservation. This count mainly reflects repeated monthly identities and should not be read as investment certainty. V1's 24 original public files and ZIP are byte-identical. All 56 original source records remain unchanged; seven primary debt/credit sources are appended, with raw HTML/text hashes. All 90 recorded source-file hashes match archived content. Eight original sources remain unhashed, as previously disclosed. All ten-year values and default original model-row values are unchanged.

Use `PYTHONDONTWRITEBYTECODE=1 python validate_v2.py`. The script needs no network or application access. With the full research tree it also checks v1 preservation; a standalone ZIP explicitly reports those sibling files unavailable. The public manifest excludes itself and bytecode. Full third-party captions are not included. The machine-readable audit-closure-v2.json carries the same scope and gates.
