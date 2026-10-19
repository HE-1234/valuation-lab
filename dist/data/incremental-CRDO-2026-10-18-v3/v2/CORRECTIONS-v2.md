# CRDO v2 corrections and review handoff
2026-10-18. Supersedes v1 implementation and presentation defects; all top-level v1 artifacts and the independent v1 review are preserved. No Site/canonical edits.

## Four implementation blockers
### B1: gross/net award settlement
The October bridge's estimated $25m tax withholding is now explicitly associated with net settlement of the estimated0.7m newly issued RSU shares. An analyst conditional settlement-price assumption of$200/share yields0.125m withheld shares and0.825m gross RSUs extinguished. Outstanding RSUs become7.475m before the95% future vesting factor; ordinary shares become188.468m. Cash delta remains135−15−55−25=$40m. There is no new claim that$200 was an observed October settlement price. Price alternatives and withheld-share mechanics are exposed in sensitivity-v2.json. The original Q1FY2027 equity statement provides the mechanism's primary evidence:105,000 net-withheld shares and$25.938m withholding, alongside the gross award issuance/vesting rollforwards. That historical quarter does not establish the subsequent interim settlement price.

### B2: original/amended filing provenance
source-ledger-v2.json gives the original June8,2022 10-K accession0001628280-22-016593 a separately named retained source under sources/. Its hash matches the frozen original. The April5,2023 10-K/A accession0001628280-23-010881 is explicitly marked not retained or reviewed, with no file/hash. V1's duplicate filename did not retain that amendment. This correction does not pretend that the amendment was independently inspected. Field-provenance records remain in the frozen v1 dataset and retain their own actual source accession identity.

### B3: dynamic financing gate
Every scenario now produces an opening liquidity reconciliation, immediate remaining capacity-deposit pre-funding check, and annual/stub liquidity path after reserving$19.495m existing debt-like/cash-contingent claims. A configurable nonnegative cash floor is enforced. Any deficit returns status unsupported_funding_gap, the precise shortfall and null enterprise value, common equity value and price. It does not release a naive unfunded price or pretend to issue debt/shares.

The auditor's sole first-year sales/capital change2.2→0.5 reproduces−$904.168765m stubFCFF and$119.405765m shortfall. It is now visibly rejected. All six published scenarios pass this limited funding test. This is annual/stub cash-equivalent liquidity, not evidence of intra-quarter liquidity or a complete financing model. Future compensation is treated as cash-equivalent replacement cost, conservatively reducing the funding path. The model does not authorize dividends or repurchases and does not automatically finance any slider-induced deficit.

### B4: parameter consistency
The balance/current/fiscal-end dates are the canonical inputs. Elapsed78days, stub273days and remaining195days are derived, never independently editable duplicates. Cash increase is derived from the four cash-flow components. Net share issuance, withholding cash and settlement price jointly derive gross RSU settlements. Remaining deposit outflow equals total post-balance commitment less interim deposits paid. Option remaining term shortens using the same elapsed dates. No hardcoded78/273/$55/0.7 bridge remains in pricing equations.

Changes to current date alter forecast timing, not the independently estimated interim cash-flow components automatically: those estimates must be explicitly updated by the analyst. This distinction prevents a date edit from being falsely portrayed as newly observed monthly financial data. Invalid dates outside the first stub are rejected rather than extrapolated.

## Guidance/data presentation corrections
The independently reconstructed90-observation panel is promoted to guidance-comparisons-v2.csv/json, with source URLs and file pointers. It retains both original rounded headline and original table-precision actuals/classifications. Dollar-table precision is$0.001m; gross margins remain the source's0.1percentage-point precision.
- FY2024Q2 revenue44.035 exceeds44 ceiling, while44.0 headline is within.
- FY2024Q2 GAAP opex34.992 is below35 floor, while35.0 headline is within.
- FY2025Q4 adjusted opex52.021 exceeds52 ceiling, while52.0 headline is within.
- FY2023Q4 revenue's initial30–32 guide date isFebruary14; March1 is a reiteration. Other metric guide dates are not moved without evidence.
- FY2023Q4 adjusted gross margin is explicitly not strictly like-for-like: March1 excludes warrant contra-revenue while May31 no longer does. Later comparative revisions59.3→59.1 forFY2023Q3 and63.7→63.4 forFY2022Q4 are recorded separately, never overwriting original history.
- FY2023 annual ≥200 floor versus184.194 actual (−7.903%) is structured separately in annual-and-revisions-v2.json.

## Further wording corrections
At the CEO grant's$5bn revenue hurdle, the first two **full**239,500-share tranches (479,000 total) can be deemed achieved without their stock-price hurdles, subject to service and the agreement. This is not an unspecified partial vest. FY2025's extra week was inQ1. Seven observed annual periods are not seven equally complete balance-sheet datasets: someFY2020 balances are missing.

## Revised values
Dated reported-balance reconstruction remains$40.1345/$96.4069/$179.0974 bear/base/bull. Current conditional values become$39.0319/$92.1249/$169.4109 because the withholding bridge now removes the additional extinguished RSUs. Current values remain estimates, and the earlier balance reconstruction remains non-backtest because its information cutoff is after its valuation balance date. Use rounded values in user-facing summaries.

65 author correction tests pass, including field perturbations, funding rejection, ledger identity, guidance precision and a separate EV arithmetic reconstruction. Independent v2 recheck is requested; this document does not claim the previous reviewer has approved these changes.
