# Independent implementation review: RMBS v3

Reviewed 19 October 2026. June 30, 2026 balance/valuation anchor; October 19, 2026 information cutoff. USD millions unless stated.

## Conclusion

**PASS — DATED_CONDITIONAL_MODEL_READY.** The final implementation is suitable for admission as an explicitly selected, dated conditional model. No unresolved arithmetic or implementation blocker was found for that scope. An exact fully diluted cap table and a current price target are not established, but those gaps do not block the correctly labeled June model.

The active award selection remains null, and active per-share outputs remain null until an explicit selection is supplied. I separately verified that supplying an explicit complete selection activates all three dated outputs while leaving every current-target field null. The examples are recorded analytical illustrations, not the user's selected assumptions.

## Corrections independently found and verified

1. The inherited method string incorrectly said there was no SBC add-back. Both the builder and regenerated input now describe the selected after-tax legacy adjustment and separate claim allocation.
2. The original v3 runner ignored `selected_award_policy` and always returned an unselected active result. The final runner reads and validates the explicit selection; this was tested in a temporary copy without selecting anything in the retained package.
3. Ten-entry settlement schedules could originally be silently truncated by a shorter business horizon. A five-year mutation with settlement entirely in year 10 returned a funded result despite an approximately $45.510m allocation gap. The final code rejects non-ten-year horizons and independently enforces the allocation identity before returning a result. The formerly failing case is now rejected.
4. Final validation also rejects nonfinite major inputs and inconsistent cash-plus-securities totals.
5. The final funding ledger reserves the full $31.435m nominal EDA payments, while valuation retains the $28.182m recognized claim. This explicitly avoids assuming the obligation can be settled for book value. No canonical application or retained source file was edited by this reviewer.

## Independent tests

- Ran the final 78 packaged checks in an isolated temporary copy. All passed.
- Regenerated output matches the retained output exactly.
- Independently calculated all nine example values using Decimal arithmetic and reconciled all 90 cash-flow/funding rows. Maximum per-share difference was 1.42 × 10^-14.
- Ran 100 additional reproducible randomized trials varying reported-unit vesting, common-share overlap, residual claim equivalents, both cash fractions and settlement timing. Allocation identities passed; the conditional price remained invariant to the cash/equity split and timing whenever funded.
- Independently tested explicit active selection, current-target suppression and the formerly truncated settlement schedule.
- Verified that `business_replay.py` is byte-identical to the original business replay, and that retained revenue, NOPAT, reinvestment and original FCFF rows are unchanged.

The accompanying JSON records the exact reviewed file hashes, outputs, scope and test counts. These tests establish reproducibility and internal coherence, not predictive accuracy.

## Verified economic reconciliation

The selected legacy schedule sums to $138.300m. Its after-tax PV additions are $87.622708m / $92.689228m / $95.334089m in bear/base/bull. Under the illustrations, minimum residual new-compensation allowances remain positive at $5.578786m / $12.136193m / $16.650116m. Those costs remain in the original margins and are not subtracted again.

The zero-haircut equity cash/securities bridge is $711.718m. Initial funding liquidity is separately $708.465m, reserving the full $31.435m nominal EDA payments rather than only the $28.182m recognized claim. The extra $3.253m cash reservation is not deducted from valuation or paid again in future funding rows. Past employee-withholding payments remain inside the June balance, with no second deduction. Separate cash fractions for reported awards and residual claim equivalents prevent an automatic assumption that unknown options or ESPP interests settle like RSUs. A separate overlap input addresses reported awards already included in common shares.

The final identity allocates the equity pool among existing common equity, net legacy equity claims and the PV of legacy cash settlements exactly once. The cash ledger then tests funding without charging that settlement PV to valuation a second time. Reported-award employee withholding is a gross cash payment, distinct from corporate taxes.

For the reported-units/no-residual illustration, bear/base/bull conditional values are $21.527776 / $43.394736 / $83.735709; conservative minimum annual resources are $698.514421m / $688.765243m / $670.797366m. All nine retained illustrations are funded under their selected assumptions. These figures are examples, not a selected default or current target.

## Scope and evidence limits

The [June 2026 10-Q](https://www.sec.gov/Archives/edgar/data/917273/000119312526321000/rmbs-20260630.htm) supports the dated common-share, cash, securities and reported nonvested-unit facts. The disclosure does not establish the analyst's annual expense schedule, settlement schedule, withholding fraction, complete option/ESPP/performance claims or hypothetical security haircut.

The 8% compensation decomposition is new analyst judgment. Residual claim equivalents account conceptually for exercise/purchase proceeds and cannot be described as verified actual instruments. The assumed WACC-matched settlement-price growth is an algebraic planning convention. The explicit tax convention excludes a separate future legacy-award corporate tax benefit. The funding stress pays each year's settlements before that year's FCFF and remains an annual model, not a daily liquidity forecast.

Keep the June date, later information cutoff and conditional assumptions visible. Keep current targets null until post-June capital, including final ASR settlement, is reconciled. This is not a point-in-time backtest, a verified fully diluted capitalization, or a buy/sell recommendation. Those disclosures are adequate for dated conditional admission and should not be converted into an artificial block on that narrower deliverable.
