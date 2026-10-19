# CRDO v2 independent recheck

2026-10-18. Reviewed corrected staging artifacts only. No canonical, Site, v1 or v2 candidate files were edited. Original top-level source hashes still match the first review. Candidate files were hashed before/after this review and remained unchanged (excluding Python bytecode caches).

## Decision

**The four original corrections are accepted for the published, finite, supported-domain scenarios. The fixed corrected outputs pass. An unrestricted interactive adapter still requires an input-validation guard.** The new finding concerns invalid/out-of-scope inputs, not an error in the corrected six published valuations.

Independent input-based implementation, using its own bridge, cash flows, discounting, liquidity path and Newton option-allocation solve, passed 27 scenario/perturbation checks. It did not reuse candidate output rows to derive the expected result.

| Treatment | Bear | Base | Bull |
|---|---:|---:|---:|
| Reported-balance reconstruction | 40.1345394462 | 96.4068669264 | 179.0974455789 |
| Current conditional | 39.0319249647 | 92.1249442570 | 169.4109213711 |

The report reconstruction is unchanged. Current changes are entirely consistent with removing the additional RSUs extinguished through withholding. These are conditional model outputs, not verified October balances or investment recommendations.

## Original blocker disposition

### B1: withholding reconciliation — resolved

At the explicitly assumed $200 settlement price, $25m withholding retires 0.125m shares; 0.7m net issuance therefore extinguishes 0.825m gross RSUs. Remaining RSUs are 7.475m, and ordinary shares are 188.468m. Cash still increases by $40m. Current expected RSUs after 95% vesting are 7.10125m. The assumption is marked as conditional rather than observed. Independent changes to withholding, net issuance and price produce the correct linked cash/share effects.

### B2: original/amended source identity — resolved

The 2022 original 10-K has an accession-specific retained filename whose content hash matches its ledger entry and the frozen original. The 2023 10-K/A has a distinct ID, explicitly unretained/unreviewed status, null local path and no hash. This is an honest repair, not a claim that the amendment was reviewed. Prior field-level history provenance is unchanged.

### B3: funding gate — resolved for valid finite inputs

Independent tests cover opening liquidity, a later-year gap, initial deposit prefunding, a configured minimum cash floor, and the original first-year sales/capital 0.5 stress. All valid funding-gap cases return unsupported_funding_gap and null EV, common equity, and price. The original stress reproduces $119.4057647703m shortfall. A later deficit is also detected; the gate is not restricted to the first year.

This remains a rejection gate, not a debt/equity financing model. Annual/stub resolution and cash-equivalent future labor treatment are prominently disclosed. Keep those limitations in the application and do not replace null with zero or an earlier successful price.

### B4: parameter wiring — resolved within this dated model's scope

Independent perturbations verify all six interim-flow/share/settlement inputs and four date/day-count inputs. Operating cash, capex, withholding, net issuance and settlement price do not improperly alter operating EV; capacity deposit payments correctly reduce both cash and remaining outflow. Report snapshots do not inherit current-bridge estimates. Dates determine elapsed/stub/remaining periods and option term consistently. Changing the date does not claim to update unobserved cash estimates automatically.

The model remains a FY2027–36 forecast: moving the first fiscal end across years is not a supported generic fiscal-calendar extension. An adapter should constrain dates to this model's documented period rather than exposing arbitrary multi-year dates.

## Additional input-validation requirement before an unrestricted adapter

The candidate accepts some invalid or out-of-scope numeric inputs. Reproductions are in recheck-results.json:

1. **Nonfinite floor bypasses funding rejection.** With first-year base sales/capital 0.5 and minimum_cash_floor set to NaN, comparisons against the floor all return false. The engine reports supported_conditional_at_annual_resolution and releases an approximately $87.2416 unfunded price. JSON should not contain NaN, but Python's default parser accepts it and in-memory callers can pass it. Reject nonfinite values at the entry point and again before publishing results.
2. **Negative probability accepted.** An earnout probability of −1 produces a supported $94.2657 base price by treating a claim as negative dilution. Enforce [0,1] for probability fields and nonnegative share pools. Require an explicit alternate interpretation if factors above 1 are ever desired.
3. **Debt metadata is silently ignored.** Setting interest_bearing_debt to $1,000m leaves the published base price unchanged. Zero is the observed default, but nonzero borrowing is outside the no-financing model. Reject it explicitly or implement debt and financing consistently; do not allow an apparently editable input that is ignored.
4. Validate coherent numeric domains: positive day-count denominator, positive revenues, FY2027 annual revenue at least reported Q1, positive strike/volatility/remaining term or explicitly implemented limiting cases, valid tax/margin assumptions, and finite terminal relationships. Invalid input should produce a clear invalid-input result, not fabricated financing or stale prices.

Acceptance test: include the NaN funding-gap case, negative probability and nonzero debt as independent negative tests; each must stop valuation before a supported status is emitted. A constrained adapter may instead validate and lock these fields before calling the model, provided it has automated tests and cannot bypass the guard.

This is a focused safety requirement for editable inputs. It does not require re-researching the company's disclosures or changing the six corrected values.

## Guidance and presentation corrections

All 90 v2 metric rows match the independently reconstructed v1 audit's guide bounds, midpoints, headline actuals, table actuals and dual classifications. No numeric regression was found.

- The three rounding-sensitive classifications are retained on both bases: FY2024Q2 revenue, FY2024Q2 GAAP opex, FY2025Q4 adjusted opex.
- FY2023Q4 revenue has February 14 first-issued date and March 1 reiteration date; other metric dates remain unchanged.
- FY2023Q4 adjusted gross margin carries an explicit not-strictly-comparable definition warning, with historical comparative revisions separate from original observations.
- The FY2023 annual floor miss is structured independently. The annual/revision ledger also retains the preliminary FY2026Q3 update separately from original guidance.
- The CEO grant wording now describes the first two full tranches at the $5bn revenue trigger; FY2025's extra week is explicitly in Q1.

Small schema note: source_verified is the string "True" in the promoted JSON, inherited from CSV. Prefer a JSON boolean for an application data contract; this does not alter the source evidence or numeric conclusions.

## Evidence and reproducibility

- recheck.py: separate expected-value implementation plus calls into the candidate for comparison; it writes only this review's diagnostics.
- recheck-results.json: 27 independent valid-domain checks, four adversarial-domain results, preserved hashes and author test-count verification.
- The candidate contains 65 recorded passing author tests. They were read and inspected; the independent conclusion relies on the separate checks rather than their count. Author scripts that rewrite candidate artifacts were not rerun.
- Original v1 and candidate v2 files remained unchanged. No fresh external-source research was necessary for this correction recheck because the source facts and previously verified financial inputs did not change.
