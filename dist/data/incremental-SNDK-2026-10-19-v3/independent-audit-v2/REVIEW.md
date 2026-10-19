# SNDK v2 independent recheck

2026-10-19 UTC. Originals preserved. No canonical or Site changes.

## Verdict

**PASS for the supplied, fixed conditional research scenarios; not approval for a current valuation, historical backtest, market ranking or unrestricted interactive model.** V2 resolves the material v1 bridge and terminal discontinuity findings through explicit conservative assumptions and enforced withholding. One narrow generic claim-input funding defect remains; repair it before enabling that input interactively. Tax/claim overlap and point-in-time data gaps are transparently retained rather than falsely declared resolved.

## Independent verification

- Independently recomputed all **114 saved cases**: 3 base, 60 WACC/g sensitivities, 24 claim sensitivities, 3 distribution policies, 24 terminal floors. All saved numerical outputs, nulls and invalid terminal cases matched within floating-point tolerance.
- Separately ran **36 additional finite/type/domain probes** across rate, investment and claim inputs, including null, bool, string, NaN, infinity and negative values. All returned INVALID_MODEL. Tested missing/malformed quotes: market comparisons remained null.
- Ran the author's suite with its output redirected into this audit folder: **84 tests pass**. This is additional to independent replay, not the basis for it.
- Sensitivity model calls leave original scenarios and global inputs unchanged. Full deep copies prevent cross-case mutation.
- SHA-256 comparisons of every v2 regular file before and after the review match. The recheck did not rewrite supplied results or research.

## Accounting overlap and reserves

The bridge arithmetic is correct: $4,762M cash less $1,500M deposits, $1,000M operating cash, $1,286M current tax, $258M noncurrent tax and $128M WDC indemnity leaves **$590M**. The two tax balances are distinct from the WDC indemnity reported in Other liabilities. Future tax applies to future EBIT; the working-capital formula excludes opening taxes. Therefore these specific deductions are not duplicated mechanically in the model. Immediate undiscounted reserve of noncurrent amounts is a conservative timing assumption, not a proven payment schedule.

The $323M uncertain-tax-benefit disclosure plus interest is not automatically additional to the tax payable balances. V2 correctly does not sum it into base reserves. The $259M incremental sensitivity is deliberately a possible non-overlap case and could double count. Likewise the $93M legal-expense sensitivity does not establish unpaid status. Neither unknown is solved by a sensitivity, but the exhibit now states that clearly. Base zero additional legal reserve means unverified incremental exposure, not proof of no outstanding obligation. Tax receivables are not netted, adding conservatism but not resolving claim mapping. Current-value approval must still wait for settlement/overlap reconciliation.

## Terminal economic floor

The max rule uses the larger of ROIC-based total reinvestment and an alternative physical/JV-plus-WC total. It does **not** add both full reinvestment measures, so there is no arithmetic double charge between them. Annual own D&A is subtracted once; JV depreciation is not separately added back. The base physical/JV ratios preserve the last explicit investment burden.

Independent terminal net reinvestment ratios are 7.4369%, 8.5243% and 11.4878%; these are close to the last explicit 7.4312%, 8.5175% and 11.5750%. The v1 stress cash-flow jump is removed. Positive sustainable terminal FCFF is required; assumptions that exhaust terminal NOPAT return null/invalid results.

This is a valid conservative continuity rule, not independent proof of a physical maintenance floor. Revenue-based ratios still confound price and volume, and net JV financing may not equal recurring asset replacement economically. The stated 11.30%/5.49%/2.94% implied reinvestment ROIC figures are algebraic cash-flow-consistency ratios, not measured marginal returns on capital. Keep those qualifications visible. Below-base terminal-floor sensitivities expressly require an efficiency transition and must not silently replace base assumptions.

## Remaining generic input issue: additional claim reserve

`capital_bridge.additional_claim_reserve_assumption` is subtracted in economic equity but is absent from `opening_reserves` and the funding cash pool. Setting that input to $1,000M returns VALID_CONDITIONAL_RESEARCH, opening surplus $590M, and zero gap. Under an immediate reserve interpretation, opening available cash would instead be -$410M before future operating flows, requiring funding or a documented payment schedule. This field is zero in all supplied saved cases, so none of their verified values changes.

Fix: either include it once in opening reserves and remove the separate equity subtraction, or supply an explicit dated claim-payment schedule and feed it into liquidity and PV. Do not both reserve and subtract it again. If this is intentionally a noncash valuation-only claim adjustment, rename it and clearly prohibit interpreting the result as a complete funded-liquidity check. Add a regression test for a reserve larger than opening surplus.

The financial-debt input similarly is a valuation deduction, not a maturity/interest schedule. With zero base debt this causes no supplied-case error. A nonzero interactive debt balance requires payment timing and financing costs before the simplified pool can certify funding; the author's huge-debt limited-liability test proves the equity floor only, not solvency.

## Funding, null policy and operating EV

Retained-FCFF base paths reproduce no simplified cash-pool gap. Full distributions produce **$5,118.215M** unfunded stress requirements, and common equity/per-share fields correctly become null. No expiring revolver is treated as committed rescue financing. Immediate reserve shortfalls and guarantee calls are retained as gaps rather than clamped away.

Keeping a finite `operating_value` and `economic_equity_diagnostic` in an unfunded path is defensible only as **contingent going-concern diagnostics assuming those operating cash flows can be financed**. They are not realizable equity valuations or evidence of finance availability. The funding status, null common fields, and permanently null rankings protect the supplied packet. A UI/export must display that status next to retained EV, or use a field named `contingent_operating_value_diagnostic`; it must never consume generic EV as an approved comparable valuation. If the downstream contract requires all valuation fields to be null for unfunded cases, this schema does not satisfy that stricter contract and needs an adapter.

Limited-liability zero flooring for funded negative diagnostic equity works. It is not a bankruptcy recovery model. Cash timing, securities liquidation, covenant tests, debt service, future SBC cash versus economic expense and payout changes remain outside the simplified funding pool.

## Dates, quote and source gates

Current valuation and historical-backtest eligibility are hard-coded false in outputs, rather than trusting editable input flags. All market quotes, including apparently valid ones, yield null upside and rankings. This is stronger than a stale-price check for this limited exhibit. It is not a reusable production quote validator: date syntax/freshness and source authenticity are not evaluated because every comparison is blocked. Any future relaxation requires independent quote validation and reconstructed cash/securities/claims/share data.

The July 3 balance-sheet anchor and later information are prominently separated. The share denominator remains a proxy. NBM measures stay distinct with verified later RPO null. The JV cash-distribution classification correction and historical comparability qualifications are retained.

## Values independently reproduced

| Scenario | Operating EV $M | Conditional common equity $M | Proxy value/155M |
|---|---:|---:|---:|
| Structural | 250,843.896201 | 252,766.646201 | 1,630.752556 |
| Partial | 53,636.143 | 55,558.893 | 358.444 |
| Contract/cycle stress | 4,350.440 | 6,273.190 | 40.472 |

Numbers above are conditional scenario outputs only. No probability weighting, actionable current price comparison or recommendation is implied.

Audit artifacts: recheck.py, recheck-results.json, author-tests-rerun.json. The supplied model is suitable for fixed conditional research with these qualifications. Repair the generic reserve/funding input before broader interaction, and retain current/backtest/ranking prohibition.
