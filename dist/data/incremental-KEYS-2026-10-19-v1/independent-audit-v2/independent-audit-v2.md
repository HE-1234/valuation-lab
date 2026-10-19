# KEYS independent admission audit v2

Audit performed October 19, 2026 UTC. Scope: financial evidence, reproducibility, model mechanics, and permissible presentation of the isolated KEYS study. This is not a market-fit, portfolio, trading-platform eligibility, current price, or recommendation audit. Originals and canonical/Site content were not changed.

## Admission decision

PASS WITH LIMITATIONS for a dated conditional operating-value study. No blocking numerical or source discrepancy was found in the 113-file v1 package. Admit only with the scope restrictions below. This verdict does not approve a current price target, upside percentage, expected return, security recommendation, or complete valuation of an externally funded stress scenario. No present-market target gate is cleared.

The admissible rounded outputs remain bear $37.33, base $129.14, bull $251.28 per common share, anchored July 31, 2026 using August 27, 2026 shares, with an October 19, 2026 information cutoff. These are three assumptions-based cases, not probabilities or a confidence interval. Base is not an expected value.

## What was independently done

- Verified SHA-256 and byte size of every one of the 113 manifest entries: zero errors. Additions are confined to independent-audit-v2; they are intentionally outside the old manifest.
- Wrote a separate numerical implementation, rather than merely invoking the author's replay. Every scalar and every field of all 30 forecast rows matches the stored model within 1e-7 absolute / 1e-11 relative tolerance.
- Independently reconstructed all 20 WACC/g grid cells, all four economic-margin shocks, the additional 3% share diagnostic, the +200 bp floating-coupon diagnostic, and both complete funding stress outputs. All match.
- Exercised 23 invalid-input tests on the supplied implementation. NaN, infinity, Boolean inputs, invalid vector length, out-of-domain growth, nonconvergence, negative capital, zero shares, debt schedule mismatch, WACC/ROIC at g, negative terminal earnings and excessive terminal investment are rejected.
- Reconciled all 221 non-null historical provenance records to exact observations in frozen SEC companyfacts and to the ten historical JSON rows. This establishes traceability of all selected facts; it does not purport to re-audit every disclosure in ten annual reports.
- Separately parsed the original archived release HTML using Python's HTMLParser and regex extraction. All 11 prior-guide/subsequent-actual pairs match the scorecard for both revenue range endpoints, both EPS endpoints, and reported actual revenue/EPS. Both actuals exceed their original upper bounds in every row.
- Re-opened the official Q3 FY2026 earnings release, audited FY2025 10-K, and July 2026 10-Q through the web tool, and checked the key current evidence against those primary sources. An official-site search did not surface a later earnings outlook. That bounded search is not proof of no interim update or material event.

Reproduction: run audit.py and check_guidance.py inside this directory. checks.json, guidance-checks.json and independent-recomputed-model.json are the machine-readable evidence. No original derivation script was run with permission to overwrite its outputs.

## Numerical results

USD millions except per-share amounts:

| Case | Enterprise value | Equity bridge | Value/share | Terminal share of EV | Minimum annual cash headroom |
|---|---:|---:|---:|---:|---:|
| Bear | 6,923.449799 | -567.56 | 37.333838 | 41.8780% | 1,918.744500 |
| Base | 22,552.529713 | -567.56 | 129.137435 | 55.0366% | 2,220.500100 |
| Bull | 43,346.075496 | -567.56 | 251.276569 | 66.7755% | 2,308.653924 |

None of these three named cases requires modeled external financing. Annual headroom is an annual-period check, not proof of intra-year liquidity or covenant compliance.

The capital bridge independently recomputes as 2,605 - 2,550 - 76 - 20 - 526.56 = -567.56. Physical depreciation is netted against gross capex, R&D remains an operating expense, SBC remains an economic compensation expense, acquired amortization is not separately added back, and the 1% acquisition/intangible-renewal allowance is additional reinvestment. These are explicit modeling conventions, not independently established maintenance-capital requirements.

## Accounting and source findings

### Ten-year comparability

The FY2016–2025 series is a sequence of reported/recast fiscal-year observations, not a homogeneous organic history. The 2019 10-K independently confirms later comparative operating income of $148M in FY2017 and negative $394M in FY2018, and the relocation of pension non-service components out of operating income. Earlier original figures are different. FY2016 is not represented as retroactively recast onto precisely the same basis.

The 2019 accounting-policy note confirms ASC606 adoption on November 1, 2018 under modified retrospective treatment; FY2018 and FY2017 comparatives remain on earlier revenue guidance. Ixia, later acquisitions, and the FY2018 $709M impairment limit economic comparability. The study's warning is necessary and sufficient for this descriptive history. Missing year-end common-share fields must remain missing; weighted-average diluted EPS shares cannot fill them.

### FY2025 preliminary versus audited

The archived Q4/FY2025 release reports $846M annual GAAP net income and $4.89 diluted EPS; the audited annual filing reports $850M and $4.91. Both detailed revenue statements report $5,375M. The $5.37B headline is rounded, not evidence of a $1M revenue revision. Audited annual history and release-vintage quarterly scorecards are properly kept distinct. This audit confirms the numerical reconciliation, not the cause of the $4M income difference.

### Latest capital and claims

The July 2026 10-Q supports $2,605M cash, $2,517M debt carrying value, $2,550M total face principal, $76M retirement/post-retirement liabilities, and exact August 27 shares of 170,244,745. Restricted cash of $17M and long-term investments of $188M are excluded. A $20M swap liability is conservatively reserved in addition to using face debt. The 27-day balance-sheet/share-count difference is real and must remain visible.

Operating lease liabilities are $53M current plus $176M long term. Their exclusion from financing debt is consistent only while rent/lease economics remain in the forecast operating margin. Do not both retain lease expense and deduct the lease liability without a corresponding operating adjustment. Similarly, no new purchase-consideration charge is due for acquisitions already paid for in the anchor balance sheet. Future 1% renewal spending does not fund any unannounced major transaction.

The official documents support Spirent consideration of $1,564M and $399M divestiture proceeds. The model does not claim that historical purchase price equals recurring maintenance investment. Existing equity awards are not valued grant by grant; retention of SBC and a 3% share stress are a convention and a diagnostic, not exact settlement of every outstanding equity claim.

### Tax measures

The nine months ended July 2026 have $66M income-tax provision and $127M net cash income taxes paid. The latter comes from supplemental cash-flow disclosures. These amounts cannot be interchanged. Model taxes are 22% of positive economic EBIT, with no tax benefit invented for operating losses; they are not the historical effective GAAP tax rate or a continuation of refunds.

## Management guidance evidence

The eleven consecutive pairs cover Q1 FY2024 through Q3 FY2026, scored against the original immediately preceding earnings-release guidance. Original upper bounds were exceeded in every pair; the file is not a consensus beat table and does not establish absence of intra-quarter revisions.

Quality adjustments verified in the archived prepared remarks: Q3 FY2024's $1.57 EPS includes $0.16 tax benefit; $1.41 excluding it still exceeds $1.36. Q2 FY2026 management excludes one-time tariff/refund effects to show $1,758M revenue and $2.58 EPS, versus reported $1,717M/$2.87 and original $1,710M/$2.33 upper bounds. The approximate $40M revenue impact is not a reason to override management's explicit $1,758M normalized figure with $1,757M. These are management adjustments, not an independent quality-of-earnings result.

The re-opened August 18, 2026 release states Q4 guidance of $1,930–1,950M revenue and $3.34–3.40 non-GAAP EPS, based on about 172M weighted diluted shares. The Q3 prepared remarks imply about 32% FY2026 revenue growth and 60% EPS growth at midpoint, and 80–90% of $100M synergies at fiscal-year exit run rate. These outcomes remain prospective at the cutoff. The changing FY2026 guide scope, especially initial ex-acquisition growth versus subsequent total growth, must be retained. Do not score the rolling July 2027 model year against an October 2026 fiscal guide.

## Mechanics, stress conclusions, and residual risks

Terminal reinvestment equals the greater of sustainable ROIC investment and physical/acquisition/NWC/operating-cash needs. The supplied cases and sensitivities satisfy both floors; WACC and terminal ROIC exceed terminal growth, and terminal earnings/distributable cash are positive. Growth converges for both modeled segments.

Scheduled principal is removed from liquidity when paid and from enterprise-to-equity value once at inception. It is not deducted from FCFF, avoiding double subtraction. The floating-coupon shock leaves EV unchanged and reduces base cash headroom to $2,211.1401M, as it should under this unlevered discounting model. No claim of interest-rate immunity is justified: WACC risk is separately material.

In both severe funding stresses the headline value is null, shares rise when equity is raised, fees reduce proceeds, and emergency debt stays within $750M. However, emergency debt repayment/refinancing and the revolver's April 21, 2031 expiration are not modeled. Consequently the funding_dilution_diagnostic_only field must never be promoted to an investable equity value. This is a funding-need detector. Annual liquidity omits intra-year timing and detailed covenants.

The tested fixed input package is internally consistent. The script is not a universal schema validator or fully general capital-structure engine. For example, restricted_cash_included is a validated metadata field but is not added to the capital bridge; the admitted input fixes it at zero. An adapter should keep such fields fixed/hidden or explicitly reject unsupported semantic changes. Do not infer that arbitrary new inputs are financially covered merely because calculate accepts them.

Margins remain the dominant judgment: base 25% rising to 27% is above 20.25% TTM GAAP operating margin and around/above the latest quarter's 24.97%; bull 30% is especially demanding with retained compensation and no amortization addback. Terminal value represents 55% of base and 67% of bull EV. No independent estimate of probabilities or long-run customer spending has been established.

## Required presentation and current-target gate

Any future adapter must:

1. Present this as a dated conditional operating-value study with July 31 anchor, August 27 share denominator, and October 19 information cutoff together. Display $37.33/$129.14/$251.28 only in that context.
2. Keep current target, upside, expected return, and recommendation fields unavailable. A current quote alone cannot refresh the capital bridge or make this an October valuation.
3. Preserve the conservative expense/reinvestment conventions, growth/margin estimates, terminal floors, and historical accounting breaks. Do not substitute adjusted management margins into economic EBIT.
4. Suppress headline values whenever funding is required or terminal/domain validation fails. Do not display funded dilution diagnostics as fair values, even when numerically finite.
5. Retain null historical share/lease fields, source vintages, all 11 guidance pairs, and the $66M provision/$127M cash-tax distinction.
6. Require a separately reviewed updated capital/claims/share bridge, award treatment, material events and financing assumptions before opening a current-target gate. This audit has not cleared that work.

## Primary source links

- [Audited FY2025 10-K](https://www.sec.gov/Archives/edgar/data/1601046/000160104625000127/keys-20251031.htm)
- [July 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1601046/000160104626000036/keys-20260731.htm)
- [FY2019 10-K and accounting transitions](https://www.sec.gov/Archives/edgar/data/1601046/000160104619000110/keys-10312019x10k.htm)
- [Original FY2018 10-K](https://www.sec.gov/Archives/edgar/data/1601046/000160104618000030/keys-10312018x10k.htm)
- [Q3 FY2026 release and Q4 guide](https://investor.keysight.com/investor-news-and-events/financial-press-releases/press-release-details/2026/Keysight-Technologies-Reports-Third-Quarter-2026-Results/default.aspx)
- [FY2025 preliminary release](https://investor.keysight.com/investor-news-and-events/financial-press-releases/press-release-details/2025/Keysight-Technologies-Reports-Fourth-Quarter-and-Fiscal-Year-2025-Results/default.aspx)
- Complete remaining guide/actual links: unchanged guidance/guidance_vs_actual.csv. Prepared-remarks URLs: unchanged guidance/remarks_manifest.json.
