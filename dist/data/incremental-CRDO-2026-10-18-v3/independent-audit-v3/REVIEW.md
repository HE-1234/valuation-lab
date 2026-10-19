# CRDO v3 independent recheck and adapter readiness

Date: 2026-10-18. Scope: versioned input-validation correction, regression of the previously reviewed company research/model, and implementation readiness. No canonical or Site edits. No candidate source files changed during review.

## Conclusion

**PASS: the research/model package is ready for adapter implementation.** The four original implementation blockers and the additional finite/domain-validation issue are resolved within the model's stated scope. This approves proceeding with implementation, not an unseen adapter, deployed site, or investment recommendation.

Independent recheck passed **761 checks**. All six complete valuation output objects and all 55 sensitivity objects exactly match v2. Fresh input-based formulas also reproduce all six EVs and equity allocations; that check does not derive expected values from candidate rows.

Current conditional values remain:
- Bear: $39.0319249647
- Base: $92.1249442570
- Bull: $169.4109213711

Reported-balance reconstruction remains $40.1345394462 / $96.4068669264 / $179.0974455789. October balances and the $200 RSU settlement-price assumption remain explicitly conditional.

## Validation findings

All three prior failure reproductions now raise ValueError without releasing a valuation:
1. NaN cash floor combined with the first-year capital-intensity funding deficit.
2. Negative earnout probability.
3. Nonzero interest-bearing borrowing in this zero-borrowing model.

Independent nonfinite mutation covered all **235 numeric fields**, each with NaN, positive infinity and negative infinity. All fail closed, including fields in unselected scenarios. Additional tests cover probability values just beyond [0,1], valid 0 and 1 endpoints, zero/negative day-count and share inputs, expired option term, invalid option parameters, tax/revenue/capital domains, terminal conditions, disabled cash reserves, unknown keys, invalid overrides and finite-value arithmetic overflow.

The implementation validates complete input shape and domains before calculation and scans derived output for nonfinite numbers. Unknown financing fields and nonzero debt weights are rejected rather than ignored. Numerical allocation/domain errors do not release prices.

Four valid adverse financing configurations remain unsupported_funding_gap with null enterprise value, common equity and price: the original capital-intensity case, cash floor, later-year deficit and deposit-prefunding deficit. The original shortfall remains $119.4057647703m. The gate is a deliberate rejection policy, not automatic financing.

## Source and presentation regression

V1 and v2 hashes from the prior review still match. All files inspected at the start of this review match their post-review hashes, excluding Python bytecode caches and new review artifacts. The source-identity correction, dual-precision guidance comparisons, first-issued/reiteration dates, non-GAAP definition caveat, annual guidance events and clarified CEO grant wording remain governed by the accepted v2 review. No further company-source research was necessary because those facts did not change.

The candidate's 65 inherited and 1,509 validation checks are author tests. The independent acceptance conclusion relies on the separate 761-check run and source preservation rather than those author counts. Candidate scripts that overwrite their artifacts were inspected but not rerun.

## Explicit adapter readiness gates

Before calling an implemented adapter ready or publishing it, verify:

1. **Use the guarded public entry point.** Call calc, not _calc or bridge directly. If porting to another language, reproduce complete schema/domain/output validation and run the same adversarial cases. Validate after applying overrides; do not silently drop unknown financial fields.
2. **No stale, zero or unfunded fallback prices.** For invalid input, exceptions, unsupported_funding_gap, or unsupported_nonpositive_equity_pool, clear the previous result and present a concise explanation. Null is not zero. Do not substitute a cached successful result. Show funding shortfall and scenario status near the output.
3. **Controls stay inside documented scope.** This is a FY2027–36, annual/stub, zero-borrowing conditional DCF. Do not expose arbitrary multi-year valuation dates, financing, repurchases or automatic debt/share issuance without new modeling and review. Calendar changes do not automatically refresh estimated interim balances. Enforce date/period bounds and a positive day count.
4. **Keep observed and assumed fields visible.** Distinguish August reported balances from October estimates; retain the conditional $200 settlement price and linked gross/net award settlement. Mark forecast/vesting/earnout assumptions as analyst inputs. Preserve the report-snapshot alternative and non-backtest information-cutoff disclosure.
5. **Retain evidence and precision.** Link to verified source entries. Keep original and full-table guidance classifications and the FY2023Q4 adjusted-margin definition warning. Show rounded headline valuation values rather than implying unwarranted precision. Normalize the CSV-derived source_verified string to a real boolean if used in application logic.
6. **Independent integration tests.** Compare default adapter outputs to all six frozen outputs; test each exposed input's intended effect, including paired cash/share settlement effects and deposit non-double-counting; exercise original capital stress, later deficit, cash floor, NaN/Infinity/type rejection, probability boundaries and nonzero debt rejection. Confirm date labels, status rendering and null handling in the actual UI.

These are normal implementation acceptance tests, not new research blockers. No adapter or canonical build was edited or certified by this review.

## Artifacts

- recheck.py: independent mutation/regression and input-formula checks; writes only this review directory.
- recheck-results.json: 761 check outcomes, candidate hashes and preservation evidence.
- Prior detailed economic/source reviews: independent-audit-v1/REVIEW.md and independent-audit-v2/REVIEW.md.
