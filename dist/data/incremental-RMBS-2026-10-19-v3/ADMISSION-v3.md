# RMBS v3: admissible June conditional model

This package closes the dated-model admission gap. It does not make an October price target. The company, ten-year history, business scenarios and June capital can be admitted with an explicit award-policy choice before displaying a conditional per-share result. `selected_award_policy` remains null; no policy is silently applied. All `current_price_target` fields remain null.

## What is exact, and what is conditional

The June 30, 2026 balance sheet reports 108,461,603 common shares, cash $87.720m and marketable securities $737.228m, totaling $824.948m. Recognized EDA software liabilities total $28.182m; operating leases $21.803m remain in operating costs. No outstanding preferred shares are reported. These are dated source facts, not current estimates. [Q2 10-Q, balance sheet](https://www.sec.gov/Archives/edgar/data/917273/000119312526321000/rmbs-20260630.htm).

Note 12 reports 2,476,181 nonvested stock/units, $138.3m unrecognized compensation net of estimated forfeitures, and a 2.4-year weighted-average recognition period. Performance payouts may reach 200% of target; approximately 0.1m additional shares were reserved for Q2 grants. The filing does not provide a complete granular June PSU/option/ESPP valuation. Consequently 0.1m is neither a full-company maximum nor an exact residual claim. The EPS diluted weighted average is not an interchangeable point-in-time share count.

The analyst must explicitly choose the overlap, if any, between the nonvested table and already-outstanding common shares. A residual claim-equivalent input then represents additional net equity claims after any exercise/purchase proceeds and overlapping issued shares. It is not a literal count of options or ESPP shares. Any cash portion of that residual claim has a separate explicit settlement fraction; it does not inherit the RSU withholding policy automatically.

## June cash and share reconciliation

Pre-June H1 financing cash flows include employee-plan proceeds $5.234m, equity-award withholding remittances $52.681m and common repurchases $2.956m. These are already in June cash. None is subtracted again at the June valuation date. The stockholders' equity table reports net employee issuance about 0.713m shares and repurchases about 0.033m; these rounded movements reconcile to the exact 0.679740m increase from year-end common shares. The nonvested rollforward's 994,254 vested units is a gross figure, not net issued shares. No settlement price is inferred from differently rounded cash and share data. [Q2 10-Q, cash flow/equity statements and Note 12](https://www.sec.gov/Archives/edgar/data/917273/000119312526321000/rmbs-20260630.htm).

August's $100m ASR happened after this model's June anchor. It is excluded from both sides of the June bridge. Its unresolved final share count continues to prevent a current valuation; it does not invalidate a clearly dated June conditional model.

## Compensation: remove the same expense before allocating the claim

The original scenarios retained SBC within their operating margins. V3 makes a new, explicit analyst decomposition rather than claiming the original model had a measured SBC split:

1. Select a baseline total SBC allowance within the existing margin. Illustrative policies use 8% of projected revenue. This is near FY2025's reported 7.67%, above H1 2026's 7.05%, and is an assumption, not management guidance.
2. Select how much of that allowance represents legacy award expense. Illustrations allocate the disclosed $138.3m over 2.4 years as $57.625m, $57.625m and $23.05m. The weighted-average period does not establish this straight-line schedule; it is an opt-in analyst runout.
3. Add that selected legacy expense back after normalized corporate tax, then allocate existing award claims separately. This avoids retaining the same legacy compensation charge while also diluting for it. Residual new-grant cash-equivalent expense equals 8% revenue less legacy runout, stays in the margin, and is not subtracted again. The engine rejects negative residual compensation.
4. The after-tax adjustment expressly removes the old modeled legacy tax shield and assumes no separate future corporate tax benefit from legacy awards. Employee withholding remittances remain gross cash outflows; they are not multiplied by one minus the corporate tax rate.

Net reinvestment remains the old business forecast, independent of this noncash accounting reclassification. New-grant compensation is treated as cash replacement, so there is no additional future dilution charge for those same new grants. The inherited business assumptions and limitations remain in the original study and input files.

## Claim allocation and settlement cash

A selection supplies known-unit vesting, residual net claim equivalents, nonvested/common overlap, settlement weights, known-award withholding, residual cash-settlement fraction, liquid-security haircut and explicit acceptance of the dated model.

Let E be enterprise value plus the June net resource bridge, after the legacy-expense correction; N be exact June common shares; and A be selected incremental legacy claim-equivalent units. Under the explicitly chosen no-dividend discount-matching convention, P = E / (N + A).

The assumed future settlement price is P × (1 + scenario WACC)^year. This is an algebraic cash-planning convention, not a market-return forecast, price target or observed settlement price. Discounting future gross cash settlements at the same rate makes their PV equal to the selected cash fraction of A × P. The balance is allocated to net equity claims. Ordinary equity plus net legacy equity plus PV cash settlement must equal E. Gross awards and withholding are not deducted twice. The timing and cash fractions change funding requirements, but do not change this conditional allocation price.

The residual net claim equivalent can approximate an option/ESPP claim only after accounting for exercise or purchase proceeds in the selected amount. It must not be described as an actual zero-strike instrument. The model does not independently value unknown option terms; that uncertainty belongs in the explicit selection and sensitivities.

## Funding and liquid securities

Initial resources are $824.948m cash plus securities, less selected security haircut, an $80m operating reserve, the full $31.435m nominal EDA payment commitment and a $5.048m conservative other-claim reserve. Zero haircut yields $708.465m available liquidity. The equity bridge separately uses the $28.182m recognized EDA claim and remains $711.718m; funding reserves the extra $3.253m of nominal payments rather than assuming a book-value early payoff. Cash alone is insufficient after these reserves; the model explicitly assumes marketable securities are available for liquidity at the selected haircut. Zero haircut is an opt-in illustration, not a verified immediate-sale guarantee.

For each forecast year, gross legacy cash settlements are deducted before that year's adjusted FCFF arrives. This conservative ordering catches annual settlement-timing shortfalls. Negative available resources suppress the per-share result and show funding required; no imaginary new financing is inserted. Nominal EDA cash commitments are reserved initially, not paid again in forecast principal or interest. New-grant cash-equivalent costs remain in FCFF. This is not a daily liquidity forecast or proof of actual borrowing access.

## Illustrations, not defaults

All examples use full vesting of the reported units, zero overlapping issued shares, the stated legacy-expense runout, 8% allowance, one-third settlement in each of years 1–3, 50% cash withholding on reported units, equity-only residual settlement, and zero security haircut. Every choice is recorded in `analyst-policy-examples-v3.json` and requires explicit opt-in.

- Reported units, zero residual assumption: bear/base/bull conditional values $21.53 / $43.39 / $83.74. Zero residual is an assumption, not evidence that remaining claims are absent.
- Additional 0.1m net claim equivalents: $21.51 / $43.36 / $83.66. The amount resembles one disclosed reserve but does not claim to be its exact value or a complete residual.
- Additional 2.476181m net claim equivalents: $21.06 / $42.45 / $81.91. This is a deliberately large analyst stress, not a verified maximum.

All nine illustrations are funded under their specified assumptions. The old cash-replacement common-share proxies were $21.21 / $43.53 / $84.77. V3 is not a price-fit correction: the difference comes from removing selected legacy expense once and allocating selected claims once. No market quote was used.

## Integration contract

Admit as `DATED_CONDITIONAL_MODEL_READY`, balance date June 30, 2026, information cutoff October 19, 2026, not a historical investable backtest. Show business EV without confusing it with equity. Keep active per-share output blank until the user explicitly selects or edits an award policy. Label every conditional price with its June date and selected assumptions. Preserve current-target null and the ASR refresh gate. Do not auto-select the zero-residual example.

For an explicit policy selection, set `selected_award_policy` in a separate copy of `dcf-inputs-v3.json` to the complete selected policy object, preserving the original null-selection file and recording the user choice. The replay honors that object; do not silently copy an example into it.

`replay_v3.py` runs standalone with the included structured inputs and `business_replay.py`; no third-party packages or network are needed. Raw sources remain separately frozen and are excluded from the public-safe bundle. Authoritative history remains v2. V3 does not alter the original source files, previous model, canonical application or publishing state.
