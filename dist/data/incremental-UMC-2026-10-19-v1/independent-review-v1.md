# UMC independent review v1

PASS_WITH_ASSUMPTION_WARNINGS as of 2026-10-19T08:12:56.722364+00:00

## Scope

Dated operating-assets conditional scenarios only; no current total-company valuation approval. Separate 50-digit Decimal implementation; no import or execution of replay_v1.py. Numeric values in this report are strings to preserve precision.

Checks: 4311; failures: 0; raw checks skipped: 3.

## Findings

- DATED_SCOPE: June 30, 2026 ex-declared-distribution operating-assets exclusion study. It is not current capitalization, total-company fair value, a certified lower bound, or a current price target. Later financings and cancellations need a complete roll-forward before a current valuation.
- ANNUAL_FUNDING_ONLY: All-bank-upfront exclusion starts TWD 489.988009m short after legacy claim reserves; stress starts TWD 17,389.988009m short. Both correctly withhold all conditional per-share values. Staged bank timing starts TWD 10,999.935991m available, but annual buckets do not prove daily or jurisdiction-specific liquidity or cash availability before deposit maturity. Staging is a separately labeled conservative allocation of noncurrent principal to year 2, not an exact contractual annual schedule.
- EXCLUSION_AND_TAX: All nonoperating equity investments and circular-ownership benefit are deliberately excluded, not fair-valued at zero. No DTA cash value or blanket DTL deduction is taken. Cash taxes and no-disposal assumptions must remain explicit.
- ASSUMPTIONS_NOT_FACTS: Revenue, margins, capex, D&A, NWC, cash tax rates, WACC, terminal ROIC, NCI/award/extra-claim reserves and lease/interest paths are analyst assumptions. NCI book TWD 4.051m does not certify reserve sufficiency. Forecast capacity, commitments and cash cost coverage are not source-certified.
- SHARES_AND_SBC: Issued restricted shares are already counted; the policies additionally assume the full 67m authorized new shares are issued for no cash. Recurring future SBC is retained in margins without an addback. Keeping expense and dilution is conservative and may overlap award cost; it is not an award-level fair-value allocation. Actual grant and issuance timing is not certified by the scenario.
- RESERVE_ACCOUNTING: Known claims are deducted once from equity and restricted liquidity; their eventual settlements must consume the reserve rather than appear again in forecast cash outflows. Equipment payables and construction/IP commitments are assumed inside cash capex. Cash tax expense excludes reserved prior-period tax runoff.
- TERMINAL_NORMALIZATION: Forecast and terminal EBIT now deduct rental-equivalent lease cash before cash tax; forecast D&A excludes ROU. Terminal lease cash grows with terminal revenue. ROIC reinvestment applies to nonleased capital. Pre-lease margins and nonlease D&A remain analyst forecasts rather than reported IFRS margins and total D&A.
- OTHER_OPERATING_CLAIMS: Pension, decommissioning, onerous-contract and carbon legacy balances sum to TWD 1,907.541m and are now reserved once from both equity and cash. Future runoff must use that reserve; forecast operating cash/capex must cover only incremental costs for these claims. Book carrying balances are not independently established settlement values.
- INTEREST_FUNDING: Financial cash interest is a conservative policy funding outflow for years 1–5 and stops after modeled debt retirement. It is not a coupon-by-coupon debt schedule and is not subtracted again from unlevered FCFF.

## Results

- explicit_operating_assets_exclusion / bear: withheld; initial available liquidity TWD -489.988009m; terminal PV 42.91% of EV.
- explicit_operating_assets_exclusion / base: withheld; initial available liquidity TWD -489.988009m; terminal PV 48.29% of EV.
- explicit_operating_assets_exclusion / bull: withheld; initial available liquidity TWD -489.988009m; terminal PV 57.01% of EV.
- explicit_liquidity_and_claim_stress / bear: withheld; initial available liquidity TWD -17,389.988009m; terminal PV 45.14% of EV.
- explicit_liquidity_and_claim_stress / base: withheld; initial available liquidity TWD -17,389.988009m; terminal PV 49.27% of EV.
- explicit_liquidity_and_claim_stress / bull: withheld; initial available liquidity TWD -17,389.988009m; terminal PV 57.71% of EV.
- explicit_staged_bank_principal / bear: $3.336462 per ADS; initial available liquidity TWD 10,999.935991m; terminal PV 42.91% of EV.
- explicit_staged_bank_principal / base: $8.791089 per ADS; initial available liquidity TWD 10,999.935991m; terminal PV 48.29% of EV.
- explicit_staged_bank_principal / bull: $15.237720 per ADS; initial available liquidity TWD 10,999.935991m; terminal PV 57.01% of EV.

## Reproduce

Full archived-source validation: python independent_validate_v1.py

Public replay without raw archives: python independent_validate_v1.py --public-safe

Refresh this review and the machine-readable review: add --write-report.

Full mode verifies frozen bytes against manifests and selected numeric text anchors, not independent external re-downloads. Public-safe mode explicitly skips those raw-source checks; it does not upgrade their status to passed.

These checks do not validate market forecasts, estimate probabilities, prove intrayear solvency, or select a policy. Read the JSON review for all tests, exact output values, skipped checks, and artifact hashes.
