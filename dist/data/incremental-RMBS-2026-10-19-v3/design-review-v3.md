# Independent design review: RMBS conditional June award allocation, v3

Review date: 19 October 2026. Balance/valuation anchor: 30 June 2026. USD millions and millions of units unless noted. This reviews the proposed design, including the follow-up refinement matching assumed settlement-price growth to the discount rate. It is not approval of implemented code, a current price target, an exact award reconciliation, or a recommendation to select any assumptions. No canonical files were edited.

## Decision

**Conditional design pass after the refinements below.** The proposed separation of legacy claims from future compensation is capable of avoiding the earlier double count. The discount-matching refinement has a clean allocation identity. Admission should remain an explicitly selected, dated analytical illustration. Missing inputs must produce no per-share result; a current-target field must remain null.

The principal remaining distinction is between a valid conditional model and a verified issuer capitalization. The latter is still unavailable. An unknown option/ESPP/performance claim cannot silently become a known, zero-exercise-price RSU with a known cash-withholding burden.

## Required refinements

### 1. Treat 8% as a new analyst decomposition, not a previously explicit model input

The retained model has SBC-inclusive operating margins, but `make_model.py`, `dcf-inputs-v1.json`, `replay_dcf.py`, and the study do not specify an 8%-of-revenue compensation allowance. Their only relevant numerical 8% is bear-case initial product growth. Therefore use wording such as:

> For this conditional illustration, the analyst decomposes the retained SBC-inclusive margins into a total compensation allowance equal to 8% of revenue, consisting of assumed legacy expense and a residual future-compensation cash equivalent. This decomposition was not separately specified in v1.

For each forecast year, disclose the reconciliation:

- Assumed total compensation allowance B = 0.08 × revenue.
- Assumed legacy expense L = 57.625, 57.625, 23.050, then zero.
- Residual future-compensation cash equivalent C = B − L.
- Retained EBIT contains B. The revised economic EBIT is retained EBIT + L and therefore still contains C.
- Revised FCFF = retained FCFF + L × (1 − normalized tax rate), with the original reinvestment rule intentionally unchanged.

Do not subtract C again. Reject C < 0 rather than silently clipping it, which would break the retained-margin reconciliation. The observed schedule sums to 138.300, but the issuer's weighted-average recognition period does not specify this annual schedule. Require affirmative selection of the straight-line assumption and the new margin decomposition.

Keeping the original reinvestment amounts is a separate simplification: growth reinvestment in v1 uses the original after-tax margin. A mechanical recomputation using the adjusted margin changes the retained business scenarios and should not happen without disclosure.

### 2. Use the actual cash-and-securities bridge consistently

Cash is 87.720; marketable securities are 737.228; their combined 824.948 pool produces the original 711.718 bridge after the 80.000 operating reserve, 28.182 EDA claim and 5.048 other-claim reserve. Cash alone produces **−25.510**, not 711.718.

State that the annual funding illustration assumes the modeled marketable securities can support cash needs at their reported carrying value. If that assumption is not accepted, model liquidity/maturities or a haircut separately. Calling 824.948 simply “cash” hides a meaningful assumption.

This is an annual economic-resource test, not proof of bank-account liquidity on every settlement day. Existing EDA treatment is an up-front economic claim reservation, not a complete nominal payment schedule. Actual payment timing, interest, security liquidation timing and within-year lows remain outside the test.

### 3. Define the total award input as conditional claim equivalents

The filing reports 2.476181 nonvested equity stock/units. It does not establish an exact total of every incremental legacy claim. The roughly 0.1 additional reserved shares relate specifically to certain Q2 2026 performance grants, and shares reserved or available for future grants are not already outstanding claims.

If offered as illustrations, label them precisely:

- Reported nonvested units only: a known subset, assumed to become incremental full-value claims.
- Reported units plus approximately 0.1m: a conditional increment based on the specific reported reserve, not a complete performance reconciliation.
- Twice reported units: an arbitrary all-unit doubling stress, not a verified maximum or upper bound.

Remove “upper bound” from the third label. Some reported awards are service awards rather than performance awards, and the filing does not prove that doubling this total captures all other plans.

A residual adjustment for unknown performance awards, stock options or ESPP interests must be described as an **analyst net full-value claim-equivalent assumption**. Options have exercise proceeds and convex payoffs; ESPP interests have employee purchase proceeds; an already-issued restricted share, if any, must not be added again to the existing common count. They are not generically identical to a gross RSU count. The filing describes unit grants and EPS dilution categories but does not provide enough detail to certify all these adjustments.

For liquidity, a single common withholding rate and schedule across these equivalents is an additional explicit stress assumption. Prefer separate claim-equivalent valuation and cash-settlement assumptions for a residual bucket, or clearly disclose that a uniform settlement treatment is hypothetical. Do not describe modeled settlement payments as a forecast of actual issuer remittances.

The 138.300 unrecognized-expense balance is net of estimated forfeitures, whereas a selected gross/claim-equivalent A may include hypothetical performance or other units. These are independent analyst assumptions, not a matched grant-by-grant ledger. Changing A does not automatically justify changing issuer-reported unrecognized compensation, and holding it fixed does not prove every scenario is an accounting forecast.

### 4. Make the discount-matching allocation exact and narrowly described

Let E be the equity resource pool before these legacy claims, N existing common shares, A selected full-value legacy claim equivalents, h selected withheld fraction, and w_y selected settlement weights summing to one. With settlement price P_y = P × (1+r)^y and settlement cash discounted at the same r:

- P = E / (N + A).
- Net new shares = A × (1 − h).
- Cash withholding remittance in year y = A × h × w_y × P × (1+r)^y.
- PV of those remittances = A × h × P.
- E = P × [N + A × (1 − h)] + PV(remittances).

This proves that the gross claim is allocated once, between employee shares and employee-tax settlement cash. The model may subtract remittances in the liquidity ledger; **it must not subtract their PV from E and also divide by N+A**. That would recreate the double count.

Matching r to each business scenario's WACC is an optional **discount-matching planning convention**. It is not an observed equity return, management forecast, or general proof that the company's equity should appreciate at its operating-asset WACC. The cash-rich firm's equity return and its WACC need not coincide. The convention also assumes no separately modeled pre-settlement distributions, forfeitures beyond the selected effective A, or other changes in the claim rights.

With this convention, h and the settlement weights affect cash timing and funding, not the unconditionally calculated P. Explain this to avoid an apparent interface bug. A negative equity pool or a financing shortfall must still suppress the usable per-share output.

If the original free settlement-price-growth input is retained instead, the more general denominator is algebraically valid only under the separately stated net-share claim valuation convention. It should not be mixed into the discount-matched implementation or presented as equivalent without explaining the different assumptions.

### 5. Distinguish employee withholding from corporate income tax

Adding back L after tax removes the corresponding modeled legacy expense **and its assumed tax shield**. It is coherent as a simplified convention that excludes a separate legacy-award corporate tax benefit. It is not the literal cash-flow-statement reconciliation, which would add back noncash expense and separately model actual corporate cash taxes and award deductions.

State that exclusion clearly. The issuer reports excess SBC deductions affecting its income-tax provision, so assuming no additional legacy tax benefit is analytically material. Do not add another tax benefit without changing the bridge explicitly.

Employee net-share withholding payments are paid on the employee's behalf. They are not the issuer's normalized corporate income-tax rate. Do not multiply those remittances by (1 − corporate tax rate), and do not infer h from the normalized rate.

The already-paid H1 settlement taxes of 52.681, employee-plan proceeds of 5.234, and repurchase cash of 2.956 are already reflected in the June balances. None should be deducted or added again to the June starting bridge.

## Source checks and exact remaining evidence gaps

The [June 2026 10-Q](https://www.sec.gov/Archives/edgar/data/917273/000119312526321000/rmbs-20260630.htm), especially the balance sheet, cash-flow and equity statements and Notes 4 and 12–14, supports the facts above. Frozen local extracts were checked and the official SEC filing was opened during this review.

- Exact common shares increased from 107,781,863 to 108,461,603, or 679,740 shares. The rounded statement bridge of 713,000 net employee-plan shares less 33,000 repurchased shares gives 680,000, a 260-share rounding difference. This is a valid approximate tie, not an exact share-level award ledger.
- Employee-plan cash proceeds 5.234 less net-share settlement taxes 52.681 equal −47.447, matching the equity-statement amount. This is further evidence against deducting past settlement taxes again.
- The 713,000 net employee-plan shares include plan activity beyond simply reporting gross award vesting. The issuer separately reports 57,640 ESPP shares issued during H1. Neither the rounded net share movement nor cash taxes alone establishes a reliable future withholding fraction or future settlement price.
- Reported unvested units reconcile as 2,881,829 + 852,251 granted − 994,254 vested − 263,645 forfeited = 2,476,181.
- The disclosed 2.4 years is a weighted-average expense-recognition period. It is not a vesting or tax-remittance schedule. Service grants generally span four years, director grants one year, and performance awards vest on the third or fourth anniversary under the stated conditions.

Evidence still needed for an exact capitalization/settlement model:

1. Outstanding award ledger by instrument, grant cohort, vest/settlement date, target/max/expected payout and forfeiture expectation.
2. Separation of target performance units from maximum incremental payouts for all outstanding cohorts; confirmation whether any stock-based awards are already counted in common shares.
3. Outstanding option quantities, strikes, expiry/exercise assumptions and proceeds; current ESPP purchase rights, contributions and purchase terms distinct from unused authorized capacity.
4. Actual net settlement policy/rates by cohort or jurisdiction and actual settlement prices, plus issuer corporate deduction timing and realizability if tax benefits are modeled.
5. Post-June cash and share movements, including verified final August ASR settlement, before any current price-target claim. Expected ASR completion is not evidence of actual completion.

These gaps do not prohibit a candid conditional historical illustration. They prohibit representing selected equivalents as the verified fully diluted cap table or the selected vest/withholding path as management guidance.

## Independent arithmetic checks

The original business scenario rows were read without modifying them. With the proposed legacy schedule, the after-tax PV additions to the equity pool are:

- Bear: 87.622708; resulting pre-claim equity pool 2,388.243796.
- Base: 92.689228; resulting pre-claim equity pool 4,814.115837.
- Bull: 95.334089; resulting pre-claim equity pool 9,289.454008.

The minimum 8%-less-legacy residual future-compensation cash allowances are 5.578786 / 12.136193 / 16.650116, each in year 1. Thus no residual clipping is required for the retained scenarios. These are checks of the proposed conditional decomposition, not independently supported forecasts.

One thousand reproducible synthetic tests of the discount-matched allocation passed. They varied E, N, A, h, discount rate and ten-year settlement weights; the largest absolute allocation residual was below 0.000000000006 in the test's currency units. This checks algebra, not future implementation or issuer evidence. No user award assumption was selected and no per-share recommendation is made here.

## Minimum implementation/admission tests

- Missing opt-in, A, h or schedule: all conditional per-share values remain null. Do not preselect a choice, fill a blank with zero, or silently apply a default. If using the refined convention, require its explicit acceptance instead of requesting an independent growth input.
- Require finite N > 0, A >= 0, E > 0, 0 <= h <= 1, weights >= 0 and weights summing to one within a documented numerical tolerance; reject NaN/infinity. Enforce the required WACC/terminal-growth domain.
- A = 0 with a positive legacy expense add-back is an internally aggressive no-claim assumption. Reject it absent a separately explicit, supported forfeiture/cancellation interpretation, rather than treating an empty field as zero.
- Tie every weight to a date or period-end measured from 30 June 2026. Include every settlement in both valuation and funding. Reject or explicitly extend schedules beyond the forecast horizon; never truncate residual claims or taxes.
- Check year zero and every modeled annual liquidity balance. Label this annual-only coverage; do not assert that it proves no intrayear need.
- Boundary tests h = 0 and h = 1, shifting all weight early/late, A increasing, a forced liquidity shortfall, invalid/partial weights, and residual allowance below zero. Under matching growth/discount, P stays invariant to h/weights unless the funding gate suppresses it; annual cash balances need not.
- Reconcile net shares, PV settlement cash and common equity to E; test that future compensation, past withholding, EDA principal and legacy claim value are not each charged twice.
- Keep future grants as the selected cash-equivalent operating cost with no additional future grant dilution. Do not also include ungranted plan capacity in A.
- Keep current target null. Display the June anchor and later information cutoff prominently; this is not a point-in-time backtest. Keep August ASR and unknown current capital separate from the June illustration.
- Update the model method description, version metadata and admission reason: v1 says there is no SBC add-back and cannot describe this v3 conditional treatment unchanged.
- A published implementation needs its own replay, invariant tests and independent review. This report approves a constrained design only; it does not retroactively certify code or a broader admission decision.
