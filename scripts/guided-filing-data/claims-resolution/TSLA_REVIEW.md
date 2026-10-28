# Tesla award reconciliation — 2026-10-21

The material overlap is resolved. The proposed remaining estimates are explicit valuation proxies, with scenario comparisons; no missing debt or claims entry is silently changed to zero.

## What is counted

| Item | Annual December 2025 | June 2026 |
|---|---:|---:|
| Reported issued common shares, millions | 3,751 | 3,949 |
| Remove interim shares overlapping 2018 options | 96 | 0: already forfeited |
| Remove conditional 2025 performance stock from plain common | 423.743904 | 423.743904 |
| Common before employee award proxy | 3,231.256096 | 3,525.256096 |
| Employee free-share proxy | 57.157370 | 67.943370 |
| 2018 CEO option claim | 303.960630 at $23.34 | None: already exercised |
| 2025 CEO performance claim | 423.743904 at $334.09 offset | Same |
| Noncontrolling and redeemable interests, USD millions | 728 | 661 |

The annual [equity incentive note](https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm) supplies the total option and RSU inventory and performance-award terms. The [10-K amendment](https://www.sec.gov/Archives/edgar/data/1318605/000110465926053166/tm2611837d1_10ka.htm) identifies the 2018 options and explicitly excludes the overlapping interim award in beneficial ownership.

The [June exercise Form 4](https://www.sec.gov/Archives/edgar/data/1494730/000110465926075213/xslF345X06/tm2618092-2_4seq1.xml) shows all 303.960630 million options exercised and 17.531857 million shares withheld for their exercise price. The resulting 286.428773 million restricted shares are already inside June common shares; assume continued service, count them once, and add neither old options nor hypothetical cash proceeds. The [June 10-Q](https://www.sec.gov/Archives/edgar/data/1318605/000162828026049270/tsla-20260630.htm) confirms forfeiture of the interim award. The [October 19 proxy](https://www.sec.gov/Archives/edgar/data/1318605/000110465926116718/tm2626016d2_ars.pdf), page 46, corroborates the settlement and service condition.

## Proposed proxy

Solve total equity as common-share value plus existing award claims. Both CEO award classes use a vanilla-call proxy at the model’s own share value, assuming full vesting. This includes time value and uses the contractual exercise price or offset. It avoids subtracting market-based option intrinsic value from a much lower DCF valuation.

For the 2025 award, this deliberately ignores performance hurdles, service forfeiture and illiquidity restrictions. The long term ends September 3, 2035. The 60% volatility and 4.06% risk-free inputs come from the annual grant assumptions; reusing them is a model assumption, not a current calibration. The 2018 option uses its January 20, 2028 expiry, 60% volatility and the annual employee-option 3.95% risk-free proxy. This is a conservative allocation scenario, not an official fair value or a rigorous bound on the real award.

The annual employee proxy is 17.012 million RSUs plus 40.145370 million remaining employee options. Treating employee options as free shares avoids pretending that their average strike applies to every option. June carries that inventory and adds half of the annual gross grant pace: 0.5 × (13.128 + 8.444) = 10.786 million. No exercises, releases or cancellations reduce it. This is an estimated inventory, not a disclosed June count or guaranteed upper limit. Other performance awards are not added a second time to the combined option/RSU inventory.

## Checks against the existing Guided operating paths

| Allocation scenario | Annual value/share | June value/share |
|---|---:|---:|
| Full-vesting vanilla-call proxy | $25.6007 | $25.7885 |
| Intrinsic-only CEO award claims | $27.0132 | $26.4863 |
| All CEO awards treated as free shares, no proceeds | $22.3965 | $23.6923 |
| June employee inventory doubled from annual residual | — | $25.4740 |

The 2025 award’s modeled claim is $2.71 billion annually and $2.51 billion in June: consequential enough to model. Simply assigning zero because the $334.09 offset exceeds current DCF value would miss time value. The broader free-share stress shows the material dilution potential; it is not a statistical confidence interval.

The unresolved June employee inventory has much less influence: doubling the annual residual inventory lowers the proposed June value by about 1.22%. The base proxy already treats employee options as free shares and adds a grant buffer. Neither result is produced by a zero-equity floor.

Amounts reconcile to USD 89,947.139 million annual and USD 95,170.718 million June equity before award allocation, using the existing researched business paths and period-matched assets, debt and minority interests. GAAP compensation expense remains in operating EBIT. Source dates, formulas, parameters and machine-readable definitions are in `TSLA.json`.
