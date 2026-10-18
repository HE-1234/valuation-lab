# MRVL v2: treasury cash and funding

Information cutoff October 18, 2026; financial origin August 1, 2026. USD millions. All future settlement schedules are conditional analyst assumptions unless explicitly identified as contractual facts. **Actual liquidity adequacy remains unestablished.** No cash-screen result is added to, or subtracted from, enterprise valuation.

## The practical finding

Legacy gross-award treatment is appropriate to avoid duplicate economic compensation cost. It does not provide the cash needed for employee withholding. Funding depends on whether future compensation is cash-paid or equity-settled, when grants vest, and whether debt is repaid or refinanced. V1's blanket statement that all three cases fit opening cash is withdrawn from v2.

The table reports each path's largest deficit before positive monthly operating NOPAT, after any explicitly permitted nominal revolver draw. Zero means no gap under that path's assumptions; it is not a certification of available cash or credit. Unidentified gap financing would have additional costs.

| Cash policy | Downside gap | Base gap | Management-delivery gap |
|---|---:|---:|---:|
| Literal cash compensation; repay bonds | 4,133.0 | 1,136.5 | 21.5 |
| Literal cash compensation; refinance bonds | 1,503.3 | 0.0 | 0.0 |
| Future equity settlement; repay bonds | 0.0 | 0.0 | 0.0 |
| Future equity settlement; refinance bonds | 0.0 | 0.0 | 0.0 |
| Literal cash compensation; conditional revolver; repay bonds | 4,382.8 | 0.0 | 0.0 |
| Future equity settlement; conditional revolver; repay bonds | 0.0 | 0.0 | 0.0 |
| Combined settlement and frontloaded-investment stress | 8,591.2 | 6,934.2 | 9,039.1 |

Under the literal-cash/conditional-revolver base case, peak borrowing is 1,184.9, repaid before June 2030. That uses an unverified assumption of covenant access. The downside reaches the 1,500 nominal ceiling and still has a gap; repayment at expiry and financing costs make its ultimate gap larger than the no-revolver cash budget. The upper literal-cash repayment path has positive month-end cash throughout but a 21.5 within-month ordering gap, illustrating the limitation of annual totals.

The combined stress doubles the assumed legacy withholding, moves the 300 forward outflow to October 2026, pays all annual capital investment at each period's start and adds 400 H2 capacity while preserving H2 other investment. The upper growth path can have the largest timing gap because it requires more frontloaded investment. These severe timing cases are not probability-weighted downside forecasts.

## Reported cash anchor

The H1 filing reconciles 2,638.8 opening cash plus 1,244.3 CFO, minus 1,551.7 investing and plus 1,601.4 financing to 3,932.8 ending cash. It separately reports 365.2 withholding for net-share settlement and 57.5 employee-plan proceeds. The 533.8 noncash SBC adjustment in CFO must not be mistaken for cash income. [Q2 FY2027 filing, cash-flow statement and equity note](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001835632-26-000025/mrvl-20260801.htm).

The historical-cash-reconciliation-v2.json file retains all investing/financing lines. FY2024–FY2026 withholding was 223.7, 274.9 and 240.7, respectively; H1 FY2027 is not evidence of a permanent steady run-rate. [FY2026 filing, restricted-stock withholdings](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001835632-26-000011/mrvl-20260131.htm).

Cash available above the operating reserve and opening cash claims is 1,992. This includes a maximum 233 earnout cash reserve, whereas economic valuation uses the entire reported earnout FV only as a provisional alternative. They answer different questions; neither amount is counted twice in the same valuation.

## Explicit settlement assumptions

- Legacy withholding: H2 FY2027 365.2, then 730.4 / 486.9333 / 243.4667 in FY2028–FY2030. This is a run-rate/attrition sensitivity. Exact remaining vesting and tax cash are unknown.
- New cash compensation: retain the economic grant-value charge as literal cash payment; deduct legacy withholding separately.
- New equity compensation: reverse the economic charge and its assumed tax benefit; vest four equal annual cohorts beginning twelve months after the modeled grant month; withhold 35% of an unchanged grant-value proxy. No employee cash proceeds or employer tax deductions on vesting are credited. Economic net-share value remains charged in DCF. This is a cash translation, not actual award prediction.
- Declared dividend: include a 53.92227678 payment proxy in October 2026, calculated from the stale August 18 common-plus-participating-preferred inventory at 0.06. Declaration was September 25, record date October 9, payment October 29. The exact October payable remains gated. [Dividend filing](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001628280-26-063592/mrvl-20260925.htm).
- Forward: charge an assumed 300 cash outflow in March 2027, or October 2026 in the combined stress. Its August 131 asset mark is not cash protection. Notional is not proven maximum loss. The original confirmation and exact settlement formula have not been located; no precise contract outcome is asserted.
- Reserve all opening licenses, restructuring and taxes immediately, with no later release. Future undeclared dividends, buybacks and acquisitions are zero only as cash-preservation assumptions.

## Contractual debt and facility boundary

| Existing bond | Face | Coupon | Maturity | Semiannual coupon months |
|---|---:|---:|---|---|
| MTG/MTI 2028 | 499.9 | 4.875% | June 22, 2028 | June / December |
| 2028 | 750.0 | 2.450% | April 15, 2028 | April / October |
| 2029 | 500.0 | 5.750% | February 15, 2029 | February / August |
| 2030 | 500.0 | 4.750% | July 15, 2030 | January / July |
| 2031 | 750.0 | 2.950% | April 15, 2031 | April / October |
| 2033 | 500.0 | 5.950% | September 15, 2033 | March / September |
| 2035 | 500.0 | 5.450% | July 15, 2035 | January / July |
| 2036 | 1,000.0 | 5.300% | April 15, 2036 | April / October |

Outstanding face comes from the annual/quarterly notes. Primary indenture links and per-bond mappings are in treasury-settlement-assumptions-v2.json and the source ledger. The 2036 issue and first October 2026 coupon are confirmed by the [April 15, 2026 filing](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-26-157134/d123910d8k.htm).

Repayment cases retire existing face. Refinance cases assume replacement five-year notes at 6.39% with 0.5% fees, and repeat the rollover if those replacements mature inside the forecast. Neither rate nor market access is guaranteed. There is no interest tax benefit in the cash screen.

The 1,500 revolver expires in June 2030; the contract adjusts a non-business-day anniversary to the preceding business day. The screen repays it in June and prohibits any June-or-later draw. It does not assume renewal. The maximum quarter-end leverage ratio is 4.00×, using contractual debt and trailing contractual EBITDA. The economic DCF is not a covenant compliance certificate. Quarterly fee timing and day-count are modeled; rates and opening accrued fees remain assumptions where actual future amounts are unknown. [Revolving credit agreement, definitions and sections 2.06–2.10, 2.18 and 6.06](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-25-152676/d859414dex101.htm).

## What remains gated

The monthly paths use a calendar approximation of fiscal periods and assumed timing within them. Future supplier drawdowns, employee settlement amounts, exact taxes, forward terms, current-date balances, dividend count and borrowing headroom are not all disclosed. After the first deficit, later rows are unfunded budget arithmetic, with no invented gap financing or insolvency conclusion. Positive results under a selected policy are conditional, not evidence those inputs will occur.

The model addresses the audit's missing cash categories and makes their consequences testable. **It does not close the factual gates needed to claim a fully funded actual company forecast.** Current equity/per-share remains null. Further review should focus on the choices and remaining facts, rather than treating 46,134 arithmetic assertions as economic certainty.
