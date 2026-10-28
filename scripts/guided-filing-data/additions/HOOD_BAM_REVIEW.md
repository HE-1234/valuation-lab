# HOOD and BAM — source and model review, 21 October 2026

Both companies need an equity cash-flow model in the existing Guided layout. A normal industrial enterprise-value bridge would misclassify their financial assets and funding.

## Source freshness

- **HOOD:** FY2025 10-K filed 18 February 2026, followed by the 20 February 10-K/A. The amendment explicitly only corrects formatting and preserves financial results. Latest filed interim is the 30 June 2026 10-Q, filed 30 July 2026.
- **BAM:** FY2025 10-K filed 2 March 2026. Latest filed interim is the 30 June 2026 10-Q, filed 10 August 2026.
- SEC submissions were checked through 21 October 2026. All downloaded filings and company-facts caches are outside the repository in `/tmp/guided-additions-20261021/{HOOD,BAM}`.

## Robinhood

The annual/TTM reported net revenues are $4,473m/$4,932m. Net revenues less all operating expenses are $2,094m/$2,270m. Net interest remains an operating revenue and stock compensation remains an expense. Other income is excluded from the modeled earnings stream, including the June-period $106m RVI deconsolidation gain and $23m investment gains. The TTM model further removes $8m of minority earnings, grossed up at the explicitly assumed 21% tax rate.

Customer cash, segregated securities, user securities and operating collateral are not shareholder surplus cash. The net interest expense on the Credit Card Funding Trust is already part of earnings. Its $602m annual/$959m interim combined principal-and-interest obligation must not be deducted again from an equity valuation.

The June corporate convertible is different: $2,200m principal, $2,170m carrying amount, and $2,208m disclosed fair value. Principal must be settled in cash; the conversion premium can be settled with shares. For a practical dated bridge, identify $1,757m of assumed retained financing proceeds ($2,200m less $30m costs, $123m capped-call premium and $290m concurrent buyback) and deduct the $2,208m fair-value claim. This is a fungible-cash allocation assumption, not a traced bank account. No conversion shares are added on top of the fair-value deduction. The capped call is conservatively not separately credited. Its historical $123m premium, about $0.13 per modeled share, is a sensitivity reference rather than an upper bound on its current economic value. Scenarios materially above the $174.42 conversion strike require refreshing this option treatment.

Actual annual common shares are 901.328432m. The interim statement reports 899m in rounded millions; this creates less than approximately 0.12% denominator uncertainty. Add unissued RSUs of 7.646387m/9m. Restricted stock awards have already been issued and are not added again. The simple conservative dilution proxy adds the annual 3.033979m employee options and 8.74m warrants as full shares. The annual option count is carried to June because June does not provide a complete option rollforward. Ignoring exercise proceeds can reduce value by no more than about $0.28 per modeled share; this is an explicit conservative proxy, not a reported fully diluted share count. It also overstates dilution when options or warrants are out of the money.

Seven real full annual observations, 2019–2025, are available. The 2021 IPO, preferred-share conversion and stock-compensation accounting make pre-2022 common-capital ratios unsuitable anchors. Do not manufacture three extra years to claim ten-year coverage.

## Brookfield Asset Management

BAM is the listed asset manager, not Brookfield Corporation (BN). The February 2025 reorganization brings 100% of the manager into BAM, with approximately 1.6 billion total outstanding common shares. BN's approximately 73% ownership is ownership of these same common shares, not another minority-interest deduction.

GAAP total revenues contain unrealized carried interest and consolidated-fund activity. The model instead uses the issuer's reconciled fee-business metrics:

| USD millions | Annual 2025 | TTM June 2026 |
| --- | ---: | ---: |
| Fee revenue | 5,487 | 5,822 |
| Fee-related earnings attributable to BAM | 2,995 | 3,201 |
| Investment and other income, net of interest | 33 | -30 |
| Common pretax fee-business earnings | 3,028 | 3,171 |
| Cash taxes | 377 | 390 |
| Distributable earnings | 2,695 | 2,837 |
| Stock-compensation addback reversed | 44 | 56 |
| Owner earnings after actual cash taxes | 2,651 | 2,781 |

Thus pretax owner earnings less cash taxes equal DE minus the compensation addback. Future tax assumptions remain editable and need not equal the low historical cash-tax rate. The model does not add all reported investments/cash or subtract all consolidated-fund debt and NCI again: attributable earnings already account for ownership and financing. Industrial debt maturity splits are not fabricated from BAM's unclassified balance sheet.

Actual outstanding Class A plus Class B shares are 1,608.513922m annually and 1,597.237018m at June. Treasury shares are excluded. The combined incremental diluted-EPS shares, 16.3m annually and 14.9m in the June quarter, serve as an explicitly labeled approximately 1% dilution proxy. They are not a point-in-time award count. Do not also deduct annual option intrinsic value, add BN's separate options, or add already-issued restricted stock. The escrow plans include cancellation of shares and cannot be treated as a simple additional gross award count.

Three full comparable owner-earnings years, 2023–2025, are restated on the full-manager basis in the 2025 report. The 2024 annual report also includes a genuine full-year 2022 Asset Management Company predecessor statement and fee revenue of $4,048m. That fourth year is retained as context, with owner-profit comparisons excluded because of the 2022 arrangement and a bundled compensation/other-income addback. Real 2021 opening common equity and cash are retained separately. Older 27%-owned shell figures or BN conglomerate revenue must not be spliced into the same history. The addition metadata contains model-compatible fee-business history alongside separately retained GAAP historical facts.

## Interpretation of assumptions

HOOD's revenue per incremental required equity of 0.55 is near its observed annual/TTM revenue-to-common-book-equity of approximately 0.49–0.52. This is a capital-buffer assumption, not a legal-minimum regulatory requirement. BAM's ratio of 3.0 is an explicit asset-light fee-business marginal capital assumption, not a claim that its historical invested-asset balances disappear. Equity discount rates, terminal return on equity, growth and normalized tax rates are analyst starting scenarios, not filing facts.
