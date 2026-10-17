# Google valuation audit

**Reviewed October 17, 2026.** Baseline: commit `2fbb15601219afd184a903d86e8119df8ba96840`, using the June 2026 TTM financial reference. This is a model audit and sensitivity analysis, not an investment recommendation. No assumptions were selected to achieve $250.

## Conclusion

The original **$167.71 per share reproduces correctly**. No material arithmetic error, wrong-issuer claim, or incorrectly assembled revenue/EBIT baseline was found in the items checked. Its low result principally reflects a cautious operating hypothesis: 18% is **first-year growth**, followed immediately by a fade to 2.5% in year 10. The resulting revenue CAGR is only 10.14%.

Separating a near-term forecast from the transition to maturity is a useful improvement. It does not establish that Google must be worth more than $250. The existing cash/investment/claims overlay increases the result by $10.10 versus the simple cash-minus-debt bridge, so preferred-stock accounting is not the reason for the low result.

## Source and baseline checks

- TTM revenue reconciles as $402.836bn + $229.692bn − $186.662bn = **$445.866bn**. Operating income reconciles as $129.039bn + $80.466bn − $61.877bn = **$147.628bn**. Starting operating margin is **33.1104%**, with no EBIT normalization applied. These use the [FY2025 financial statements](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm) and [Q2 2026 filing](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm).
- The unusual preferred securities really are Alphabet instruments. The [Series A certificate](https://www.sec.gov/Archives/edgar/data/1652044/000119312526259830/d36818dex31.htm) and [Series B certificate](https://www.sec.gov/Archives/edgar/data/1652044/000119312526259830/d36818dex32.htm) support 9.625m preferred shares per series. The maximum combined conversion is 54.45825m common shares. No $19.25bn principal deduction is also taken in conversion mode.
- Cash/current marketables $242.474bn, mapped debt $100.164bn, finance leases $2.590bn, NCI $7.100bn, and noncurrent investments $145.587bn reconcile to the [June filing, balance sheet and Notes 3–7](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm). The investment addition is $131.461bn nonmarketable securities plus $14.126bn noncurrent marketable equity; neither duplicates the $87.063bn current equity portfolio already included in cash/current marketables.
- The [August $25bn debt issuance](https://www.sec.gov/Archives/edgar/data/1652044/000119312526342390/d171253d8k.htm) is outside the June capital reference. Adding its debt without its proceeds would be wrong. The present bridge is a dated capital reference, not an October balance sheet.

The [issuer's Q2 release](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/googexhibit991q22026.htm) reports 24% consolidated revenue growth, 15% Services growth, 82% Cloud growth and a 34% operating margin. These are useful near-term evidence, not decade-long forecasts. Nonoperating investment gains correctly stay outside EBIT.

## What produces $167.71?

All contribution figures below use the same fully diluted allocation denominator, 12,284.45825m shares, and therefore add directly.

| Contribution | Dollars per share |
|---|---:|
| Present value of years 1–10 FCFF | 47.37 |
| Present value of terminal operations | 97.95 |
| Cash and current marketables | 19.74 |
| Mapped debt | −8.15 |
| Additional noncurrent investments | 11.85 |
| Finance leases | −0.21 |
| Noncontrolling interests | −0.58 |
| Preferred dividend present value | −0.26 |
| **Total, before rounding individual lines** | **167.71** |

Operating enterprise value is $1.785tn; 67.4% comes from the terminal value. Year-one NOPAT is $134.60bn, net reinvestment $114.65bn and FCFF $19.95bn. The model spends $1.43 of net investment per incremental revenue dollar. Do not compare modeled FCFF directly with reported operating cash flow minus capex: SBC, taxes, nonoperating items and financing treatment differ.

## Are the assumptions too conservative?

They are judgments with different evidentiary strength, not verified forecasts.

| Assumption | Audit finding | One-factor legacy sensitivity |
|---|---|---:|
| 18% initial growth | Cautious versus the latest quarter. Reasonable as a scenario, but the immediate fade and exact ten-year duration have little company-specific support. A Services/Cloud forecast would better explain the consolidated path. | Initial growth 24%: $192.50 |
| 30% mature EBIT margin | Assumes erosion from the current baseline despite recent margin expansion. AI economics and competition make erosion possible; the record does not prove precisely 30%. Retain as an explicit judgment, not a reported destination. | Maintain starting 33.1104%: $183.38 |
| 0.70x incremental sales/capital | Capital-heavy, but not obviously an error. FY2025 revenue growth divided by cash capex less PPE depreciation is about 0.75x. This is only a rough diagnostic: working capital, leases, acquisitions and investment lags matter. A decade of constant productivity is less defensible than a staged capital model. | 1.00x: $184.12; 1.40x: $195.06 |
| 10% WACC | The worksheet is internally correct. It combines an observed 5.09% Treasury rate with assumed beta, equity premium, debt weight and spread. Rounding 9.76771% to 10% reduces value by $5.97. Lowering WACC requires a different risk argument. | Unrounded: $173.68; 9%: $196.59; 8%: $236.47 |
| 22% operating tax; 15% terminal ROIC | Independent long-run judgments. A consolidated effective tax rate distorted by investment gains is not automatically the correct operating tax rate. Terminal ROIC exceeds WACC, preserving mature competitive advantage. | Tax 20%: $172.84; ROIC 20%: $172.61 |

The FY2025 capital diagnostic uses $52.818bn revenue growth, $91.447bn cash capex and $21.136bn PPE depreciation from the [annual report](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm). The 5.09% ten-year yield is verified against [Treasury's October 16 observation](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value_month=202610&type=daily_treasury_yield_curve). The other WACC inputs are selected estimates, not measured current market facts.

The scenario is jointly cautious, but simply removing every cautious input would create an optimistic scenario rather than correct an error. Likewise, capital expenditure is not deducted twice: EBIT includes depreciation; the model then deducts **net** reinvestment. Any move to a gross-capex forecast must explicitly add depreciation back.

## Explicit growth followed by maturity

For comparability, these examples hold growth at 18% for the first three or five years, then fade it linearly to 2.5% in the selected maturity year. EBIT margin fades linearly from 33.1104% to 30% over the full horizon. WACC, taxes, terminal ROIC and claims stay unchanged.

“Constant capital” retains 0.70x sales/capital throughout the forecast. “Consistent capital” holds that ratio through the explicit period, then linearly fades **capital intensity**, its reciprocal, toward terminal-consistent intensity. The latter is the new flexible-profile recipe.

| Explicit period | Maturity year | Constant capital | Consistent capital | Maturity revenue |
|---|---:|---:|---:|---:|
| 3 years | 10 | $179.34 | **$177.29** | $1.34tn |
| 5 years | 10 | $191.51 | **$189.86** | $1.54tn |
| 3 years | 15 | $211.50 | **$207.75** | $2.18tn |
| 5 years | 15 | $226.69 | **$223.19** | $2.50tn |
| 3 years | 20 | $247.71 | **$242.04** | $3.54tn |
| 5 years | 20 | $266.34 | **$260.74** | $4.06tn |

The five-year/20-year example requires 9.10 times starting revenue and $5.42tn cumulative net reinvestment with consistent capital. Its $260.74 is a conditional outcome, not evidence that a 20-year transition is correct. Even the three-year/20-year case remains below $250. Longer horizons change the economic forecast, not merely the display length.

For year `y`, explicit years `E` and maturity `N`, use `t=max(0,(y−E)/(N−E))`. Growth is `18%+(2.5%−18%)*t`. Capital intensity is `(1−t)/0.7+t*(1+g)*margin*(1−tax)/terminalROIC`. The ending sales/capital ratio is **0.6253908693x**. The extra `(1+g)` is required by the engine's same-year incremental-revenue convention; the final forecast FCFF times `(1+g)` then equals terminal FCFF. This change slightly lowers the Google results because terminal productivity is below 0.70x.

## Corrections, limits and next steps

1. **Improve the operating-path controls, without changing defaults to hit a price.** Show the explicit forecast, total time to maturity, revenue scale, capital spending and implied return on capital. Preserve legacy drafts and frozen historical experiments.
2. **Reconcile a small documentation mismatch.** `dist/data/current-claims-research.json`, `companies.GOOG.preferredDividendModel.discountYearBasis` and its stored PV use ACT/365. `dist/current-claims.js`, `valueCurrentWithClaims`, uses ACT/365.25, as correctly stated in the JSON's top-level implementation note. The PV difference is $0.199277m, only $0.00001622/share. Align the research description/result with the runtime convention; this is not the valuation gap.
3. **Keep investment and claims uncertainty visible.** Gross carrying values are not an appraisal after realization taxes or liquidity discounts. Employee awards, noncontrolling interests and the preferred payoff require more complete valuation work. Capped-call recovery is deliberately zero. These limitations do not justify a guaranteed upward correction.
4. **Separate operating normalization from existing obligations.** The filing identifies legal charges and accrued obligations. A future normalization should adjust the relevant expense and separately model expected settlement cash, with tax and double-counting checks. Do not add back all charges or subtract every balance-sheet liability mechanically. Similarly, lease and future funding commitments must be consistent with the operating/capital forecast.
5. **Use business evidence to choose the horizon.** A segment-based near-term forecast, investment utilization and competition analysis are stronger grounds for three/five years and ten/fifteen/twenty-year maturity than a desired share value. No unique replacement base case is established by this audit.

## Reproduction and exact code locations

Run `node scripts/audit-goog-valuation.mjs` from the repository. It prints full-precision JSON, annual cash flows, the contribution bridge, one-factor sensitivities and both horizon grids. It performs no network access or file writes and imports no production valuation functions; baseline and terminal-continuity assertions must pass.

- Baseline evidence: `dist/data/current-universe.json`, company `GOOG`, snapshot `GOOG-TTM-2026-06-30`, including `factEvidence`.
- Assumptions: `dist/data/company-base-cases.json`, `companies.GOOG`; generator `scripts/build-company-base-cases.py`, GOOG parameter and rationale entries.
- Legacy path/arithmetic: `dist/engine.js`, `valueCompany` and `terminalValue`.
- Current path adapter: `dist/current-operating.js`, `operatingAssumptions`.
- Claims inputs/allocation: `dist/current-claims.js`, GOOG definition, `preferredDividendSchedule`, and `valueCurrentWithClaims`.
- Source review: `dist/data/current-claims-research.json`, `companies.GOOG`; supporting `scripts/goog-preferred-claims-review.json`.

This audit added four files: this report, its independent calculation script, and the public HTML/JSON audit in `dist/data/`. It did not edit source captures, default assumptions, production valuation logic or historical cases. The original day-count discrepancy remains documented rather than overwritten.
