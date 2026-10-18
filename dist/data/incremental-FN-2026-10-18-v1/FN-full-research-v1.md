# Fabrinet (NYSE: FN): source-backed valuation research

Research cutoff: 18 October 2026. USD millions unless stated otherwise.

## Result and boundaries

Fabrinet is a NYSE-listed ordinary share, not an ADR. Its [official Robinhood page](https://robinhood.com/us/en/stocks/FN/) offers Buy/Trade FN. This verifies public product availability, not eligibility in a particular account.

The package contains ten fiscal years, 24 earnings releases, four recent company slide decks, two complete management discussions, a 21-quarter-pair guidance sample, and explicit funded scenarios. The source-dated claim framework passed574 independent accounting checks and is conditionally implementable. Local validation also passes671 checks. A current October share value is gated because interim cash flows and the remaining fiscal-year stub have not been reported. No price target has been produced.

The default analytical origin is 26 June 2026, the audited balance-sheet date. Forecasts incorporate information available by October and October market assumptions, so this is an updated scenario expressed at a historical financial origin. It is neither a June point-in-time backtest nor a claim that June cash is current cash. The July facility purchase remains inside FY2027 cash capex. The August loan cannot be subtracted from June cash without also recognizing its proceeds.

## What changed in the operating evidence

The [FY2026 10-K](https://www.sec.gov/Archives/edgar/data/1408710/000140871026000028/fn-20260626.htm) reports revenue of 4,641.097, operating income of 462.887, CFO of 256.725 and cash PPE purchases of 252.503. Revenue grew 35.7%, but CFO less cash PPE spending fell to 4.222. Inventory, receivables and capacity expansion consumed cash. This is why a revenue extrapolation without reinvestment is unsuitable.

FY2026 revenue categories are data center 2,225.081, communications 1,546.403 and automotive/industrial/other 869.613. These are revenue categories within one operating segment; category profitability is not separately reported. Only FY2024–FY2026 and twelve quarters have been recast. Data-center interconnect and HPC are already included and must not be added again. New ship-to geography does not measure final customer demand. The four disclosed large customers account for 57.4% of annual revenue.

The [August company presentation](https://investor.fabrinet.com/static-files/3946ab0d-d45b-48f2-881e-46a16fb0ae9a) supports the quarter/category reconciliation. Q4 revenue was 1,315.788, with GAAP operating margin about 10.20%, versus approximately 10.9% non-GAAP. Forecasts cannot use the adjusted margin while treating employee equity compensation as free.

## Guidance, interviews and execution

Formal [Q1 FY2027 guidance](https://investor.fabrinet.com/news-releases/news-release-details/fabrinet-announces-fourth-quarter-and-fiscal-year-2026-financial) is revenue 1,375–1,425, GAAP diluted EPS 3.39–3.54 and adjusted EPS 4.10–4.25. The quarter ended 25 September, but results were not available in the sources at this cutoff. No formal annual revenue range was issued.

The complete [August 17 call](https://stockanalysis.com/stocks/fn/transcripts/660294-q4-2026/) supports a continuing DCI/HPC ramp and new transceiver programs. New buildings and qualified floors increase available production capacity, but customer forecasts are not firm orders. CPO/NPO can reduce material pass-through revenue while improving percentage margins; raising both revenue and margin independently would overstate the opportunity. OCS was still small. Management optimism about annual growth is an aspiration, not formal guidance.

The complete [August 18 Rosenblatt interview](https://stockanalysis.com/stocks/fn/transcripts/731742-rosenblatt-s-6th-annual-technology-summit-the-age-of-ai-part-ii/) described roughly 250 of FY2027 cash capex, including the new US facility, and temporary merit-pay pressure. That does not supersede the 10-K's expectation of increased accrued capital expenditure. The bases and payment timing differ. Capacity estimates around 9.8bn near-term and potential 14bn with further buildings are capacity estimates, not sales commitments. The business remains a contract manufacturer rather than a competing product owner.

The scorecard includes FY2018 contraction, FY2020/COVID and FY2023–FY2026 sequential windows. Across 21 comparable revenue pairs, actual revenue exceeded the upper end 20 times and was inside once; mean midpoint error was +3.15%. This suggests conservative quarterly guidance in this selected sample, not a calibrated annual upside probability. Adjusted EPS was below range once and inside five times. FY2025 Q3 missed EPS despite revenue above range. The FY2018 Q4 outlook for FY2019 Q1 used ASC605, so it is not compared with ASC606 actuals without a bridge.

## Explicit forecasts and uncertainty

These are analyst scenarios, not management forecasts or statistical confidence intervals. No probabilities are assigned. All ten annual calculations are in `forecast-defaults-v1.json`.

| Base case | FY2027 | FY2028 | FY2029 | FY2030 | FY2031 |
|---|---:|---:|---:|---:|---:|
| Revenue | 6,227.2 | 7,672.1 | 8,984.5 | 10,113.6 | 11,141.8 |
| Growth | 34.2% | 23.2% | 17.1% | 12.6% | 10.2% |
| Economic EBIT margin | 10.1% | 10.3% | 10.5% | 10.5% | 10.4% |
| Cash capital investment | 325 | 350 | 340 | 325 | 320 |
| Operating NWC/sales | 23.0% | 23.0% | 23.0% | 22.5% | 22.5% |
| FCFF | -146.0 | 47.1 | 232.3 | 445.8 | 513.5 |

Base FY2027 category growth is 50% data center, 25% communications and 10% other. With the formal Q1 midpoint of 1,400, the remaining three quarters must average 1,609.1. The path depends on successful new program ramps and continuing deployment demand. Downside FY2027 growth is approximately 20.9%, followed by a 10.2% contraction. Upside FY2027 growth is approximately 45.6%. Upside also needs more capital and can have worse initial cash flow; growth is not free.

Near-term tax begins at 15% and rises to 20%, rather than perpetuating historically low rates. Base working capital initially exceeds the FY2026 defined proxy of 22.3% of sales. Downside working capital reaches 27% during contraction, capturing inventory lockup. Annual capex of 325 is an analyst choice above the interview cash estimate, reflecting the unresolved cash/accrual timing, ongoing construction, and opening capital payables.

Years six through ten fade margins and capital intensity together. Base terminal growth is 2.5%, operating margin 9.5%, tax 20% and return on beginning capital 20%. Ending FY2036 capital equals FY2037 NOPAT divided by terminal ROIC; terminal investment equals growth times that capital. There is no zero-investment perpetuity or abrupt capital release.

Cost of capital uses the [16 October Treasury curve](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value_month=202610&type=daily_treasury_yield_curve), including 5.09% at ten years, and [Damodaran's October implied ERP](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/home.htm) of 4.20%. Analyst beta 1.25 sits between broad US and global electronics cash-adjusted unlevered benchmarks. Half of July Thailand country risk of 1.978% is added as an explicit exposure judgment. The result is 11.33%, rounded to 11.5%; test 9.5–14%. Neither beta nor country-risk exposure is an observed FN-specific estimate.

## Capital claims and compensation accounting

The [loan agreement](https://www.sec.gov/Archives/edgar/data/1408710/000140871026000026/fn-2026811x8kex102termloan.htm) confirms the later THB2.5bn loan, approximately USD75m, carries 2.45% interest and twenty quarterly installments over five years. The facility's 2044 availability date is not this loan's maturity. A THB coupon is not a USD cost of debt.

The audited origin has unrestricted cash/investments 875.055 and no bank debt. Reserve2–4%of next-year sales for operating cash, with3%as an analyst base; growth in that reserve is funded explicitly through forecast FCFF. Restricted cash is excluded. Raytek's carrying value 89.103 versus original cost 32.360 is a separate non-operating sensitivity; the restricted stake is not immediately realizable cash. Its 56.743 unrealized gain is excluded from operating profit.

The 63.469 tax payable includes a 57.447 Pillar Two charge. Removing that expense from an adjusted earnings metric does not remove its future cash payment. Existing severance liabilities total 34.095. Under the operating-rent convention, lease liabilities are not subtracted again. Capital payables86.018 are subtracted from opening cash-funded operating capital; their settlement remains in cash capex and is not deducted again as debt. Accrued additions equal cash capex plus the change in capital payables. BaseFY2027 closing payables75 imply313.982 of accrued additions, aboveFY2026 accrued capex. Required operating cash is included in capital, and each annual increase reduces FCFF. Other noncurrent liabilities, possible repatriation tax and unresolved Casix litigation remain separate visible uncertainties.

Ordinary shares outstanding were 35,834,864 at June 26 and August 7. Issued shares include treasury shares and are not the denominator. The conservative existing award case includes 306,261 outstanding RSU/PSU shares, with 281,793 expected-to-vest shares as a disclosed alternative.

The Amazon warrant covers up to 381,922 shares, of which 85,942 were vested and unexercised. Strike is USD208.48 and expiry is March 12, 2032; cashless exercise is allowed. Full vesting is a conservative assumption, not an achieved milestone. Grant-date fair value 39.3 is not its current value. The claim module solves ordinary-share value and option value simultaneously; it does not value options using a fixed market quote inside an intrinsic valuation. Volatility 45.2% is a disclosed grant-date proxy, tested at 35–60%. Hypothetical exposure grids are not price targets.

Economic margins explicitly charge new employee grants at 0.75% of sales and new commercial equity incentives at 0.10%, anchored to FY2026 costs. Existing-grant amortization is only a GAAP reconciliation: subtract it from economic EBIT to show an illustrative reported number, then reverse it back to the same economic EBIT. It creates zero FCFF uplift above the chosen margin. Existing awards/warrants are allocated once; future grants already expensed cannot also be added as free extra share claims.

## Historical comparability and reproducibility

FY2017 and FY2023 have 53 weeks. ASC606 began in FY2019 without recasting prior periods. Later comparative statements reclassify FY2020 derivatives and FY2022 receivables/contracts. FY2021 later comparative CFO/capex supersede the original amounts; both originals are retained, and the classification difference is visible. The normalized capital series is a defined proxy, not a claim that every other asset and liability has been individually classified. No separate R&D asset is invented for manufacturing engineering.

Reproduce with `build_fn_research.py`, then `finalize_fn_policies.py`, then `validate_fn.py`. The original extraction is retained separately. Source URLs, reading scope and hashes are in the manifest. Only the public whitelist should be exported; third-party full transcripts are outside the onboarding directory. Audio/webcast playback is not claimed.
