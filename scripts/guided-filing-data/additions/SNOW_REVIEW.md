# Snowflake source and allocation review — 2026-10-21

The SEC submissions index identifies the latest periodic filing as the [July 31, 2026 Form 10-Q](https://www.sec.gov/Archives/edgar/data/1640147/000164014726000037/snow-20260731.htm), filed September 4, 2026, and latest annual filing as the [January 31, 2026 Form 10-K](https://www.sec.gov/Archives/edgar/data/1640147/000164014726000008/snow-20260131.htm), filed March 20, 2026. Snowflake calls the annual period FY2026 and the July quarter FY2027 Q2. This package does not relabel July as a completed fiscal year.

## Operations and balances

All money and share counts below are millions except per-share amounts. Original balance sheets, operating statements and Notes 5, 10 and 13 were read directly from the filings, alongside SEC Company Facts.

| Item | January 31 annual | July 31 TTM |
|---|---:|---:|
| Revenue | 4,683.946 | 5,434.647 |
| GAAP operating loss | -1,435.165 | -1,236.753 |
| Cash and equivalents | 2,828.163 | 1,707.187 |
| Current investments | 1,201.523 | 637.508 |
| Long-term marketable investments | 755.013 | 1,984.482 |
| Strategic investments in Other assets | 380.619 | 370.178 |
| Convertible debt carrying value | 2,279.827 | 2,283.985 |
| Operating lease liabilities, excluded from debt | 461.287 | 479.830 |
| Legal common outstanding | 343.918 | 352.455 |
| Equity RSUs plus maximum acquisition PRSUs | 21.537 | 24.964 |
| Employee options | 13.766 | 9.277 |
| Option weighted strike | 26.56 | 30.74 |
| Option remaining years | 3.1 | 2.8 |

TTM revenue = 4,683.946 + 2,937.744 − 2,187.043. TTM EBIT = −1,435.165 − 589.121 + 787.533. Restricted cash is excluded. Strategic investment gains and interest are outside operating loss, so adding those investment assets does not duplicate forecast operating earnings. Private investment carrying amounts remain a valuation proxy.

## Claims solved without duplication

Both zero-coupon convertible series have a 157.50 initial conversion price and a contractual rate of 6.3492 shares per $1,000 principal. Annual principal is 1,150 for each series. July principal is 1,149.997 for the 2027 series and 1,150 for 2029; the 0.003 conversion is immaterial. Each note carrying amount is already in reported debt. The modeled allocation reverses carrying debt before choosing principal retention or full-share conversion. The two series have effectively identical moneyness, so the existing all-principal/all-converted branches suffice. No market fair-value premium is also charged.

Capped calls remain separately reported at 7.302 million shares per series, with 157.50 strike and 225.00 cap. Their modeled intrinsic asset is bounded by 492.885 per series (985.770 aggregate). Historical premiums of 195.5 were paid in FY2025 and are already absent from cash; they are not subtracted again. The intrinsic allocation does not fully price time value, discounting or counterparty risk, which is explicit in the bilingual caveat and existing hedge sensitivities.

Actual legal common outstanding equals issued less treasury (344.317 − 0.399 annual; 352.836 − 0.381 July). Issued restricted acquisition common shares (0.516 annual / 0.733 July) are already part of that legal share count even though they are not deemed outstanding for earnings-per-share accounting until vested. They are not added a second time. The stockholders' equity statement separately identifies acquisition shares issued subject to future vesting.

Unissued equity-classified RSUs/Leadership PRSUs are 20.071 annual and 23.529 July. Maximum liability-classified acquisition PRSUs add 1.466 and 1.435; full vesting is a conservative share-count proxy, not a prediction. Their reported liability is immaterial and is not separately deducted. July also has 0.1 million Leadership PRSUs awarded but not yet ASC 718-granted because performance targets were unset; these are explicitly added through `additionalAwardShares`. An immaterial, unquantified vested-but-unissued residual remains flagged rather than invented.

Options are valued once at the model share price using disclosed count, strike and remaining life, with analyst proxies of 55% volatility and 4% risk-free rate. Reported market intrinsic values of 2,294.028 and 2,435.653 are evidence only and are not deducted from a different DCF share-price scenario.

## Historical coverage and minor gaps

Eight real annual operating periods FY2019–FY2026 are available, beginning with [IPO S-1 comparative statements](https://www.sec.gov/Archives/edgar/data/1640147/000162828020013010/snowflakes-1.htm). Every annual numeric fact retains its actual accession, period, source URL, raw amount and unit conversion. Pre-IPO preferred capital and the September 2020 IPO make FY2019–FY2021 unsuitable for mature capital calibration. Those rows remain visible but are excluded from calibration.

Historical debt before the 2024 convertible issuance uses reviewed complete liability schedules and the explicit statement that no material finance leases existed. This is a materiality-based zero for mapped financing debt, not an assertion that undisclosed immaterial financing can never exist. Current and historical operating leases remain excluded from financing debt.

The old Samooha acquisition's 0.231 deferred payment is not assigned an invented current balance. It is immaterial (less than $0.001 per allocation share even if the original amount remained) and omitted with a flag. No material unpriced acquisition earnout was found beyond the separately allocated acquisition PRSUs.

## Model assumptions and validation

The editable analyst scenario uses 25% initial growth, 25% mature GAAP EBIT margin, 21% normalized tax, 2.5x incremental sales/capital, 11% required return, 3% terminal growth, 20% marginal terminal ROIC and ten years. The margin assumption requires a substantial transition from negative GAAP earnings and keeps ongoing stock compensation as a real cost. It is not reported current profitability or non-GAAP guidance.

`GUIDED_CUTOFF=2026-10-21 python3 scripts/guided-filing-data/validate.py SNOW` passes. The two warnings preserve unavailable capped-call fair values; the modeled intrinsic asset is separately identified. No new valuation-engine capability is required: the existing `convertibleScenarios`, `cappedCalls`, `optionTranches` and `additionalAwardShares` interfaces cover this package.
