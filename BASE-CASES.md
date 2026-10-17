# Company-specific current research assumptions

As of **October 17, 2026**, version `2026-10-17.2`.

These are assistant-authored educational judgments. They are not issuer guidance, sell-side consensus, stock recommendations, price targets, or a claim that these businesses have been valued accurately. Reported facts remain in the existing source data. Each case identifies an exact current snapshot, dated primary sources, driver-by-driver reasoning, uncertainty, WACC components, and computed operating consequences in `dist/data/company-base-cases.json`.

## Chosen parameters

Percentages below are displayed percentages; the JSON uses decimal fractions. Sales/capital means **incremental revenue / net reinvestment**, not revenue / total book capital. All cases use a ten-year forecast. Most use a linear fade toward stable growth. AAOI uses the documented staged capacity path; its sales/capital parameter is initial productivity, followed by utilization improvements and a terminal-consistent capital-intensity fade.

| Company | Initial growth | Mature EBIT margin | Tax | Sales/capital | WACC | Stable growth | Terminal ROIC |
|---|---:|---:|---:|---:|---:|---:|---:|
| AAPL | 8% | 32% | 20% | 3.00x | 9% | 2.5% | 20% |
| MSFT | 18% | 42% | 22% | 0.60x | 9.5% | 2.5% | 16% |
| AMZN | 14% | 15% | 24% | 0.80x | 10% | 2.5% | 10% |
| GOOG | 18% | 30% | 22% | 0.70x | 10% | 2.5% | 15% |
| META | 20% | 35% | 20% | 0.50x | 10% | 2.5% | 12% |
| NVDA | 40% | 45% | 20% | 2.00x | 11% | 2.5% | 25% |
| TSLA | 12% | 12% | 25% | 1.30x | 12% | 2.5% | 12% |
| COHR | 25% | 20% | 24% | 1.25x | 10.5% | 2.5% | 12% |
| LITE | 35% | 25% | 22% | 1.20x | 11.5% | 2.5% | 14% |
| AAOI¹ | 60% | 12% | 25% | 0.80x | 13.5% | 2.5% | 10% |
| NBIS¹ | 85% | 25% | 25% | 0.60x | 15.5% | 2.5% | 12% |
| MU² | 8% | 35% | 20% | 0.80x | 11% | 2% | 12% |
| AVGO | 35% | 45% | 20% | 2.00x | 10% | 2.5% | 20% |
| TSM³ | 22% | 45% | 20% | 0.90x | 10% | 2% | 18% |

1. **AAOI is a conditional staged capacity case; NBIS remains unsupported.** AAOI's fresh research profile has five cash-burning years and negative operating value. Its valid source-dated claims bridge shows a zero common-equity floor and the raw deficit. Existing saved AAOI linear drafts retain their original nine-year cash-burn stress. Neither path is an economically validated fair-value appraisal, and neither models future financing or default/recovery. NBIS still needs a specialist capacity, equipment replacement, funding and perimeter model and remains blocked. No assumption was tuned to make a share value positive.
2. **MU uses a visible starting-EBIT normalization.** Reported FY2026 revenue remains $133,188m and reported EBIT remains $99,340m. The model instead starts from EBIT of $46,615.8m (35% margin), an adjustment of −$52,724.2m. This judgment avoids a decade-long fade from the extraordinary 74.6% reported margin; 35% allows structural HBM benefits above FY2025’s 26.1% margin. It is not a restatement, near-term earnings forecast, or full through-cycle revenue normalization. Both the reason and exact filing URL travel with the draft.
3. **TSM parameters are in nominal TWD.** Its USD ADR and ordinary-share conversion remain blocked until explicitly reconciled. The chosen currency adjustment is an assumption, not a verified FX quote or an observed Taiwanese government yield.

## Why the cases differ

- Apple’s services and outsourced manufacturing support moderate growth, strong margins and lighter incremental capital needs.
- Microsoft, Alphabet and Meta retain valuable software/distribution assets, but the AI infrastructure buildout makes historical asset-light capital assumptions misleading.
- Amazon’s AWS and advertising mix can improve margins, while retail and infrastructure keep consolidated capital requirements high.
- NVIDIA and Broadcom retain strong technology/IP economics, with substantial fade from current AI growth and profitability. No customer capital-spending boom is extended unchanged forever.
- Tesla’s case is based on vehicles and energy with improving utilization. Unproven robotaxi and humanoid-robot businesses receive no separate option valuation.
- Coherent and Lumentum reflect optical capacity expansion and better utilization, while retaining manufacturing, acquisition and product-cycle risks.
- Micron’s memory pricing cycle requires explicit profit normalization rather than mechanically extending peak margins.
- TSMC’s foundry leadership supports continuing excess returns, with substantial capital needs, foreign-production costs and geopolitical uncertainty.

Company-level rationales in the JSON explain each growth, margin, tax, reinvestment, discount-rate and terminal assumption independently. Historical book-capital proxies are context only; buybacks, acquisitions, leases, non-operating assets and uncapitalized R&D can distort them. Coherent’s acquired perimeter, Broadcom’s acquisitions and Nebius’s post-Yandex business require particular care.

## Required-return construction

The only observed WACC component is the **5.09% USD ten-year Treasury reference dated October 16, 2026**. The model explicitly chooses a **4.5% long-run equity-risk premium**, informed by but not equal to or misdated as Damodaran’s January 2026 4.23% estimate. Betas, target market-value debt weights, debt spreads and additional equity risk allowances are analyst assumptions, not live market regressions, bond quotes or issuer facts.

For each company:

- Cost of equity = Treasury reference + assumed beta × chosen ERP + extra equity-risk allowance
- WACC = cost of equity × target equity weight + assumed debt cost × (1 − normalized tax) × target debt weight
- Round WACC to the nearest 0.5 percentage point

TSM’s USD risk build is converted to nominal TWD using assumed long-run inflation of 2.5% in USD and 1.5% in TWD: `(1 + USD WACC) × 1.015 / 1.025 − 1`. This produces roughly 10.2%, rounded to 10%. The currency estimate and geographic-risk allowance remain uncertain; neither resolves the ADR gate.

## Economic checks, not economic proof

The data includes independently reproducible first-year and year-ten revenue, implied ten-year CAGR, initial net reinvestment/revenue, negative-FCFF years, stable reinvestment/earnings, and terminal-value dependence. It also includes two illustrative operating stress cases with explicit changed assumptions, not probability bands or price targets.

Examples of important consequences:

- NVIDIA’s 40% initial growth fading to 2.5% still creates roughly 6.5 times current revenue after ten years. A faster early fade may be more realistic than this simple curve.
- Amazon’s current case has four negative-FCFF forecast years and about 93% of operating value in the terminal period.
- Tesla, Coherent and Lumentum also depend heavily on terminal profitability (roughly 89%, 80% and 78% of modeled operating value).
- AAOI's staged research case remains an operating stress with negative enterprise value, five negative-FCFF years and substantial cumulative cash deficits. Its zero equity floor is a conditional result, not evidence that the traded security is worthless. NBIS remains blocked. Neither is a standalone fair-value conclusion.

These warnings must be visible beside the assumptions, not hidden by the existence of a source link. Source-backed inputs and algebraically correct math do not validate forward economic judgments.

## Claims, assets and saved user work

`otherClaims: 0` and `otherAssets: 0` mean no additional user-entered amount. For AAOI and Alphabet, the separate source-dated model already includes explicitly modeled claims and assets; never enter them again. For other companies these remain **unreviewed placeholders**, not verified zeros. They do not mean preferred stock, convertibles, minority interests, awards, leases, investments, or contingent obligations are absent or worthless. There are no automatic “reviewed” flags.

Research identified material June 2026 bridge issues in Alphabet (mandatory-convertible preferred securities) and Applied Optoelectronics (separately reported convertible notes). Version 9 resolves those gates only with an exact source-matched claims model, explicit alternative treatments and visible limitations. The resulting numbers are conditional approximations; missing or invalid model inputs still withhold results. Existing Nebius funding/perimeter and TSM currency/security gates also remain intact.

Defaults apply only to a fresh current draft or an explicit load/reset matching the current snapshot. Never rewrite a saved user draft, saved normalization, historical case, frozen experiment, or engine-wide defaults. The new artifact has independent provenance/version metadata so the user can distinguish their assumptions from these research starting points.

## Rebuild and validation

- Rebuild only this ledger: `python scripts/build-company-base-cases.py`
- Focused verification: `node --test tests/company-base-cases.test.mjs`
- Full repository suite: `npm test`

The focused suite checks coverage, exact snapshot identity, source dates/URLs, fraction units, driver rationale, WACC arithmetic and rounding, TWD conversion, model-path equivalence, MU normalization, stress consequences, zero-placeholder semantics and specialist/structural-break warnings. It does not establish an investment forecast or authorize publication.

## Evidence links

- AAPL: [issuer release](https://www.apple.com/newsroom/2026/07/apple-reports-third-quarter-results/) (2026-07-30); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/aapl-20260627.htm) (2026-07-31)
- MSFT: [issuer release](https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast) (2026-07-29); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm) (2026-07-29)
- AMZN: [issuer release](https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Second-Quarter-Results/default.aspx?mode=light) (2026-07-30); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026/amzn-20260630.htm) (2026-07-31)
- GOOG: [issuer release](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/googexhibit991q22026.htm) (2026-07-22); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm) (2026-07-23)
- META: [issuer release](https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Second-Quarter-2026-Results/) (2026-07-29); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1326801/000162828026050705/meta-20260630.htm) (2026-07-30)
- NVDA: [issuer release](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2027/) (2026-08-26); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000075/nvda-20260726.htm) (2026-08-26)
- TSLA: [issuer release](https://ir.tesla.com/press-release/tesla-second-quarter-2026-production-deliveries-and-deployments) (2026-07-02); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1318605/000162828026049270/tsla-20260630.htm) (2026-07-23)
- COHR: [issuer release](https://www.sec.gov/Archives/edgar/data/820318/000119312526346860/d128030dex991.htm) (2026-08-12); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/820318/000082031826000020/iivi-20260630.htm) (2026-08-14)
- LITE: [issuer release](https://investor.lumentum.com/financial-news-releases/news-details/2026/Lumentum-Announces-Fourth-Quarter-and-Full-Fiscal-Year-2026-Results/default.aspx) (2026-08-11); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1633978/000162828026057358/lite-20260627.htm) (2026-08-17)
- AAOI: [issuer release](https://investors.ao-inc.com/news-releases/news-release-details/applied-optoelectronics-reports-second-quarter-2026-results?hss_channel=lcp-744608) (2026-08-06); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1158114/000143774926026278/aaoi20260630_10q.htm) (2026-08-06)
- NBIS: [issuer release](https://assets.nebius.com/assets/a6ecfd85-a6cb-4967-8ef7-9a25bd261f9c/SHLQ226.pdf?cache-buster=2026-08-12T11%3A54%3A46.695Z) (2026-08-12); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1513845/000110465926094844/nbis-20260812xex99d2.htm) (2026-08-12)
- MU: [issuer release](https://investors.micron.com/news/press-release/2026/Micron-Technology-Inc--Reports-Record-Fiscal-Fourth-Quarter-and-Full-Year-2026-Results/default.aspx) (2026-09-30); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/723125/000072312526000023/mu-20260903.htm) (2026-10-09)
- AVGO: [issuer release](https://investors.broadcom.com/news-releases/news-release-details/broadcom-inc-announces-third-quarter-fiscal-year-2026-financial) (2026-09-02); [exact baseline filing](https://www.sec.gov/Archives/edgar/data/1730168/000173016826000080/avgo-20260802.htm) (2026-09-10)
- TSM: [issuer release](https://investor.tsmc.com/japanese/encrypt/files/encrypt_file/reports/2026-10/526b65af7305df2dde6b9ece6812b1fdf1e49f9b/3Q26%20EarningsRelease.pdf) (2026-10-15); [exact baseline filing](https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2026-10/3a94d1034b9e6b22446b674f7aaf3d088a12a193/FS.pdf) (2026-10-15)
- [US Treasury 10-year nominal USD yield, October 16, 2026](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value_month=202610&type=daily_treasury_yield_curve)
- [Damodaran January 2026 implied US equity-risk premium](https://aswathdamodaran.blogspot.com/2026/01/data-update-2-for-2026-equities-get.html)

## Version 2026-10-17.2: staged AAOI and explicit claims overlays

The scalar assumptions remain unchanged. AAOI fresh and explicit research loads now select the source-linked staged capacity profile. The profile reaches 12% margin in year 6 at defaults and uses growth of 60%, 40%, 30%, 20%, 15%, 10%, 8%, 5%, 3%, and 2.5%. Initial sales/capital of 0.8 rises through 1.0, 1.2, 1.4, and 1.6, then capital intensity fades to (1 + g) × margin × (1 − tax) / terminal ROIC. This final timing convention makes year 10 FCFF × (1 + g) equal terminal FCFF. The normalized weights apply to each sampled driver vector.

The original linear 60% / 0.8 case remains a preserved legacy stress and is not silently substituted in existing drafts. Fresh staged reported-capital default has negative operating EV and five negative-FCFF years; the zero common-equity floor and raw deficit are both visible. Neither path includes a default/recovery or future financing model. The separately sourced current claims overlay now computes AAOI and Alphabet conditional values, while null/invalid/mismatched-source states remain blocked.
