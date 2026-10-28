# MA, SPGI, NKE, CMG, COST and QCOM — source review, 2026-10-21

The six requested companies have annual and latest-period TTM source files, bilingual starting assumptions, and eleven actual fiscal observations each (ten visible years plus the preceding observation). No existing-company or application files were changed by this research task. MCD and MRVL were already ready and were skipped.

## Period coverage

| Company | Latest filed annual period | Latest filed interim period | Annual revenue / operating income, USDm | TTM revenue / operating income, USDm |
|---|---|---|---|---|
| MA | 2025-12-31 | 2026-06-30 | 32,791 / 18,897 | 35,083 / 20,465 |
| SPGI | 2025-12-31 | 2026-06-30 | 15,336 / 6,478 | 16,122 / 7,163 |
| NKE | 2026-05-31 | 2026-08-31 | 46,398 / 3,797 | 45,891 / 3,758 |
| CMG | 2025-12-31 | 2026-06-30 | 11,925.601 / 1,935.798 | 12,423.759 / 1,820.149 |
| COST | 2026-08-30 | Same annual report | 303,154 / 11,685 | Same annual report |
| QCOM | 2025-09-28 | 2026-06-28 | 44,284 / 12,355 | 44,069 / 10,220 |

Every TTM uses full annual + current year-to-date − comparable prior-year year-to-date; COST has no subsequent filed quarter and should present a single distinct base. The latest SEC submissions indexes and twelve primary filing documents were retrieved. Inline XBRL and the human-readable main statements were used together; SPGI June facts were present in the original filing even though absent from Company Facts.

## Consequential issues handled

- **SPGI:** ordinary noncontrolling equity of $108m/$115m is separate from redeemable noncontrolling interests of $4,917m/$5,024m. Both are claims on consolidated operating value. The $603m/$613m affiliate investments are retained as reported context but not added again because equity-method earnings are in operating profit. SPGI is a fee-based ratings, subscription and index service business, not a bank or deposit-taking lender; FCFF is appropriate for the business despite its broad financial-sector classification.
- **SPGI separation:** Mobility separated effective July 1, 2026, immediately after the selected interim balance-sheet date. Both filed bases include Mobility and are explicitly pre-separation group valuations, not current standalone SPGI valuations. The filed July 6 amendment's Exhibit 99.2 was reviewed. It gives FY2025 continuing revenue $13,589m and operating profit $6,140m; the pro-forma balance sheet is only March 31, 2026. March cash changes from $1,810m to $3,663m after removing $121m of Mobility cash and adding a $1,974m distribution. These March figures must not be silently combined with June flows/balances. Pro-forma evidence and limits are recorded in `SPGI.json` metadata.
- **NKE:** use revenue minus cost of sales minus SG&A, consistently across history and current bases. Management's FY2026 EBIT of $3,850m includes $53m of other nonoperating income; operating profit used here is $3,797m. There are 76.8m options with $96.44 weighted strike and 5.1-year remaining contractual life. Reported intrinsic value is zero, but that does not establish zero economic value. Count/strike/life were delivered to the integration agent for valuation-dependent option treatment. Twelve-and-a-half million restricted awards are added separately. Class A and Class B common shares are included.
- **COST:** current financial debt includes $1,413m finance leases once, separately from $2,606m operating leases. Historic finance/capital lease obligations were sourced alongside borrowing balances, including original FY2021/FY2023 notes where standardized split tags were missing.
- **QCOM:** FY2025 tax allowance charge and FY2026 reversal are not projected as recurring taxes. The analyst forward tax assumption is 18%, visibly distinct from reported history. June fair-value-table “other investments” of $1,293m are deferred-compensation assets paired with plan liabilities, not additional excess assets. Private/equity-method investments use the last separately disclosed $1,379m carrying amount as an explicit proxy.
- **CMG:** current shares and awards are on the post-2024 fifty-for-one split basis. Borrowings are zero, while operating restaurant leases stay in operating economics. Noncurrent marketable investments and separate equity investments are included once; investment income is below operating profit.

## Small gaps and proxies

Annual awards are carried only where the interim filing does not give a full roll-forward. Their dates and rationale are explicit in `carriedFrom` and bilingual limitations. MA and NKE exact cover-page Class A+B counts are near-period proxies with their actual dates; CMG, COST, QCOM and SPGI use actual period-end common shares, not weighted-average EPS shares.

- MA: an omitted $100m finance-lease liability would move value by about $0.11/share. No unquantified liability is called a reported zero. June negative $5m noncontrolling book equity is not treated as an asset; claim is floored at zero (roughly $0.006/share difference).
- SPGI: the June current-investment line is not separately stated. No unquantified asset is added; prior annual $56m equals approximately $0.19/share. Annual options are **less than** 0.1m; the threshold is not used as an exact count. Disclosed $5m intrinsic value is retained as a small claim proxy, approximately $0.017/share, rather than inventing a count.
- NKE: finance leases are expressly immaterial in the annual report. A $100m omitted-debt stress is about $0.07/share. Options are not classified as immaterial.
- QCOM: ±50% of the carried $1,379m private-investment balance changes value by approximately $0.64–$0.65/share. Interim RSUs carry the annual 28m balance; a ±25% award-count sensitivity is roughly ±0.65% of the denominator.

## Historical mapping checks

All 66 fiscal observations have sourced revenue, operating income, book equity, cash, pretax income, tax expense and mapped debt. Exact 52/53-week dates are preserved. Historical ratio inputs are accounting proxies, not adjusted economic invested capital.

Specific corrections made after inspection:

1. Mastercard's `RevenueFromContractWithCustomerExcludingAssessedTax` is gross revenue for some earlier years. Use reported **net** `Revenues` (or older `SalesRevenueNet`) instead: FY2018 $14,950m, FY2019 $16,883m, FY2020 $15,301m and FY2021 $18,884m.
2. Chipotle FY2018's latest standardized tax fact has a reversed sign. Its original filed income statement and tax note report a positive provision of $91.883m: pretax $268.436m − tax $91.883m = net income $176.553m. The historical source explicitly records that reconciliation.
3. The SPGI 2022 merger changes accounting scope; its transition-year ranges are excluded and the basis change prevents false directly comparable annual growth.
4. QCOM unusual-tax years and NKE's tax-reform year are excluded from normalized tax selection without changing reported tax facts.

Validation performed: all six source files pass `validate.py`; all TTM arithmetic reconciles; all 66 history rows have numeric, sourced core inputs; historical pretax-tax-net-income differences were reviewed to identify the CMG sign issue (remaining material differences primarily reflect noncontrolling attribution). Raw SEC caches remain under `/tmp/guided-additions-20261021/`, outside the repository. UI, pipeline integration and application tests are the parent agent's responsibility.
