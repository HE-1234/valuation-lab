# CRDO independent review, v1

Review date: 2026-10-18. Scope: staging research and model, before Valuation Lab implementation. Source files, canonical content and Site were not modified. This is an independent analytical review, not an audit opinion, investment recommendation or verification of undisclosed future events.

## Decision

**Arithmetic passes; implementation/publication approval is conditional on the fixes below.** A fresh implementation, without importing the package's replay or validation functions, reproduces all six EVs and equity allocations to numerical precision. Current conditional values remain $39.0086608152 / $92.0704838455 / $169.3122204228; reported-balance reconstruction values remain $40.1345394462 / $96.4068669264 / $179.0974455789. These numbers are reproducible scenario outputs, not independently established market fair values.

The economic framework is broadly coherent: growth consumes capital, mature growth requires reinvestment, existing award claims are allocated once, and new equity compensation is expensed economically. No evidence supports presenting October cash, October shares, PSU factors, or earnout probabilities as observations.

## Required fixes and implementation gates

1. **Medium: October withholding/share bridge is internally incomplete.** The cash estimate subtracts $25m net award withholding, while ordinary shares increase 0.7m and outstanding RSUs decrease only 0.7m. For net settlement, gross vested RSUs equal net shares issued plus shares withheld. If the $25m relates to these settlements, use a settlement-price assumption to calculate additional RSUs extinguished, or explicitly identify a separate settlement/payable explanation. At illustrative prices $100/$169.70/$222.35, extra gross settlements are 0.2500m/0.1473m/0.1124m and the otherwise unchanged base output becomes $92.1795/$92.1347/$92.1195. These are sensitivities, not recommended October estimates. This is small financially but must be logically consistent.

2. **Medium: source ledger has a filename collision.** Both the FY2022 original 10-K (accession 0001628280-22-016593, 2022-06-08) and 10-K/A (0001628280-23-010881, 2023-04-05) resolve to crdo-20220430.htm with the same hash. The local document inspected identifies the original Form 10-K, not a separately frozen amendment. Split accession-specific filenames and hashes or mark the amendment as not retained. Do not imply both independently fetched texts have been reviewed. Field-level history provenance is better and independently matches companyfacts, but does not repair this ledger defect.

3. **Medium: annual funding check is not a dynamic financing model.** All six published scenarios have positive annual/stub FCFF, so there is no annual modeled funding deficit to finance. After reserving the $19.495m technology/cash-contingent claims, minimum projected year-end liquidity is $762.136m in snapshot bear and $822.915m in current bear. Paying the incremental capacity deposit before receiving stub FCFF also leaves a positive opening cash buffer. This supports these scenarios at annual resolution. It does not prove quarterly liquidity or implement debt issuance, interest, equity issuance, dilution, cash-floor enforcement, or repurchases under stressed inputs. For an interactive Valuation Lab, either implement these mechanics or return a visible unsupported/funding-gap status when they become necessary. Do not extrapolate 'funded growth' assurance to arbitrary sliders.

4. **Medium: configuration and replay are insufficiently parameterized for an interactive implementation.** The source replay hardcodes 78 elapsed days, 273 stub days, $55m paid deposits, and 0.7m share/RSU changes despite corresponding bridge metadata. Changing bridge fields can leave the model unchanged. Wire a single source of inputs to all equations; require dates and cash/share reconciliation tests. The fixed cutoff replay is correct, but the metadata currently overstates editability.

5. **Low/medium: distinguish rounded guidance comparisons from full-precision results and original publication dates.** See guidance subreview. Three rounded-to-boundary outcomes change classification at statement precision; FY2023Q4's first $30–32m guide was February 14, not the March 1 reiteration. Preserve an original-date/reiteration distinction and show both precision bases rather than silently changing historical labels.

6. **Disclosure gate: keep current conditional and source-reported treatments distinct.** The August valuation uses information published after August 1 and is not an investable backtest. October balance increments are estimates. Publish assumptions adjacent to results and provide the reported-balance alternative. A rounded 'about $92' is appropriate; unsupported precision in an expected return is not.

## Source review

### Guidance and management claims

The September 1 SEC earnings exhibit supports Q2 FY2027 revenue $525–535m, GAAP gross margin 62.9–64.9%, and adjusted gross margin 67–69%. The FY2027 >85% growth, >$600m optics, each optical component category >$100m, and approximately 55% adjusted-opex-growth statements are management testimony in the September 1 call as hosted by StockAnalysis/Quartr. They are not numerical full-year guidance in the SEC earnings exhibit inspected. The study appropriately labels the third-party host; retain this distinction. The call was reopened during review and the CFO prepared remarks support these claims. No full licensed transcript was saved.

Independent arithmetic: 1,335.116 × 1.85 = $2,469.9646m; the $2,500m scenario exceeds that floor by $30.0354m. After $479.003m Q1 and $530m Q2 midpoint, the implied H2 requirement is $1,490.997m. The scenario's requirement is demanding and is not booked backlog.

Primary release: https://www.sec.gov/Archives/edgar/data/1807794/000162828026059795/credoq12027ex-991.htm
Management testimony: https://stockanalysis.com/stocks/crdo/transcripts/683506-q1-2027/

### DustPhotonics and employee claims

The frozen August 1 10-Q's Note 5 supports the May 28 closing and purchase bridge: $769.587m cash + $169.069m issued shares + $2.455m pre-combination replacement-award consideration + $310m contingent consideration = $1,251.111m. Acquired cash $33.968m reconciles net investing cash $735.619m. The $310m splits into $10m liability and $300m equity. Paid cash and issued shares are already in the balance sheet and must not be charged again. Goodwill and intangibles are purchase allocation, not additional surplus assets.

The April 13 acquisition announcement supports approximately 3.21m maximum contingent shares. The 42.03% factor is only 300/(222.35 × 3.21), an accounting-value-to-share-count proxy. Fair value incorporates timing/risk and payoff structure; it is not a statistical vesting probability. It is acceptable only as an explicitly conditional proxy with the existing 0–100% sensitivity. Do not deduct $300m in addition to allocating earnout shares.

Note 10 supports rounded pools of 8.3m RSUs, 3.1m PSUs, and 1.7m options at $2.34 strike/3.84 years; replacement DustPhotonics RSUs are 254,000 and should not be added again absent proof they are outside the rollforward. The 132,000 exchangeable subsidiary restricted shares are distinct from 132,000 already-issued parent shares. Their remaining unexchanged/unvested count is not independently rolled forward; the full-count allowance is a disclosed conservative proxy, not an exact October count.

The June 1 8-K supports six CEO tranches of 239,500 shares, $2.5–7.5bn trailing-four-quarter revenue hurdles, $244.70–489.40 share-price hurdles, and performance period through June 30, 2031. Clarify the study's loose wording: reaching $5bn revenue can cause the **first two full tranches**, totaling 479,000, to be deemed achieved without the stock hurdles, subject to service. It is not an unspecified partial vest of those tranches. The 35%/65%/100% pool factors are conditional analyst allocations; they are not a grant-level or risk-neutral Monte Carlo valuation.

Sources:
- https://www.sec.gov/Archives/edgar/data/1807794/000162828026060111/crdo-20260801.htm (Notes 5, 9, 10)
- https://www.sec.gov/Archives/edgar/data/1807794/000162828026024892/crdo-20260413.htm
- https://www.sec.gov/Archives/edgar/data/1807794/000162828026039474/crdo-20260528.htm

### Amazon warrant

FY2026 10-K Note 3 explicitly identifies Amazon.com NV Investment Holdings LLC and reports all 4.1m warrant shares exercised by May 2, 2026, with approximately 3.8m net shares after 0.3m exercise-price withholding. August 10-Q confirms the customer warrant was fully vested and exercised. No remaining claim from this warrant should be deducted. FY2025 $13.186m contra-revenue and FY2026 zero are visible in the annual statements; their comparability qualification is justified.

Source: https://www.sec.gov/Archives/edgar/data/1807794/000162828026043303/crdo-20260502.htm

### Period comparability and financial data

Independently matched all 151 available field-provenance entries to their exact companyfacts accession, period, unit and value. Independently recomputed TTM revenue $1,591.045m, EBIT $504.963m, and SBC $235.162m. This verifies the retained source dataset and bridge, not an as-originally-reported time series. FY2017–19 missing history is correctly explicit. FY2020 has reported income/cash-flow items but several unavailable balance fields; do not imply seven equally complete balance-sheet years.

FY2025's 53rd week was in Q1, whereas FY2026 and FY2027 Q1 use 13 weeks; FY2025 Q1 comparisons need this specific warning. The FY2023 switch to a Saturday-nearest-April-30 convention and private/pre-IPO share comparability are material and disclosed. Latest balances are August 1; the August 25 cover-page share count is a different observation. Weighted EPS shares are correctly excluded from the valuation denominator.

### Macro observations

Reopened official Treasury October table: the October 16 10-year rate is 5.09%. Reopened Damodaran home page: October 1 adjusted-payout implied ERP is 4.20%; preceding month ERP 4.14% and Treasury 4.75%. The current combination is intentionally different observation dates and should retain both dates. Beta 1.55 is an assumption. The current initial cost of equity is 11.60%, falling to 9.29%. The unadjusted-Treasury/unadjusted-ERP convention is internally consistent.

Sources:
- https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=202610
- https://pages.stern.nyu.edu/~adamodar/New_Home_Page/home.htm

## Economic qualifications, not numerical errors

- The FY2027 stub scales both NOPAT and incremental capital by remaining-revenue and calendar fractions. This is disclosed, but it is not a rollforward from actual Q1 operating invested capital. Improve to quarterly cash flows before making near-term funding claims.
- New-grant labor cost at 10% fading to 8%, cash margin, taxes, capital turns, beta and terminal ROIC are analyst judgments. The independent review confirms implementation, not those future outcomes.
- Capacity recoveries require purchase volumes. The filing does not promise four equal annual refunds; keep the zero-recovery sensitivity. Existing deposits are operating assets, not extra cash.
- Option allocation correctly solves the common price jointly with option value and other claims. The strike is low, limiting volatility sensitivity. Unmodeled award tax deductions and grant-level exercise/service details remain simplifications.
- Terminal value is a majority of EV in every case. The explicit late-year capital-turn decline and terminal reinvestment avoid a free-growth perpetuity; they do not remove long-duration model risk.

## Reproducibility

Run `python independent-audit-v1/recompute.py` from any working directory. It reads source JSON, does not import source valuation code, uses a Newton allocation solve instead of source bisection, and writes only within this review directory. `recomputed-results.json` records all six independently derived paths, funding balances, 151 provenance checks, source hashes, and the withholding sensitivity. The source 143-check result was inspected for scope but not relied upon for the independent arithmetic conclusion.

### Concrete funding-gap stress

Changing only FY2027 base marginal sales/capital from 2.2 to 0.5 produces current-stub FCFF of −$904.169m and liquidity of −$119.406m after reserving existing debt-like claims. An unfinanced equity calculation still returns approximately $87.19/share. That figure is not a valid financed scenario: it illustrates why a cash-floor/financing gate is necessary. `funding-gap-stress.json` records the example. This deliberately severe capital-intensity case is an implementation test, not an expected company outcome.

## Final guidance subreview integration

A separately reconstructed original-HTML panel verifies 18 consecutive quarters and all 90 metric observations. It records 612 passing extraction, link/date, arithmetic and rounding checks; this is specific mechanical evidence, not an assurance label. No substantive wrong rounded guide/actual value was identified.

Required publication corrections:
- FY2024Q2 exact revenue is $44.035m, above the $44m ceiling, while the rounded $44.0m series labels it within. Exact GAAP opex is $34.992m, below $35m, while the rounded series labels it within.
- FY2025Q4 exact adjusted opex is $52.021m, above the $52m ceiling, while the rounded $52.0m series labels it within. State the classification precision explicitly or provide both results.
- FY2023Q4's first $30–32m guide is February 14, 2023; March 1 reiterates it. Keep first-issued and reiterated dates distinct.
- **Add a non-GAAP definition-change warning:** the March 1, 2023 release excludes warrant contra-revenue from adjusted results; the May 31 release no longer lists this exclusion and revises comparative FY2023Q3 adjusted gross margin from 59.3% to 59.1% (and FY2022Q4 from 63.7% to 63.4%). The retained as-original panel is defensible, but FY2023Q4 guide versus actual crosses definitions. Do not describe every adjusted-margin observation as strictly like-for-like.
- The FY2023 at-least-$200m annual floor and $184.194m actual imply a 7.903% miss. Narrative disclosure is correct; include it as a distinct structured annual-guidance event if the application presents a comprehensive guidance record.

These corrections do not change the independently reproduced DCF. The four implementation blockers remain B1–B4 in `review-status.json`. Revenue, margins, taxes, capital turns, award factors and macro risk choices remain disclosed modeling judgments rather than source errors. The definition-change caveat is a publication/data-presentation correction, not grounds to erase or rewrite as-original history.

Guidance artifacts: `guidance/verification.json`, `guidance/verified-comparisons.csv`, `guidance/checks.json`, and independent `guidance/verify_guidance.py`. The original package's top-level file hashes were rechecked after review; none changed.
