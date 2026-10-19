# CRDO v3: fail-closed model input validation

As of 2026-10-18. This is a versioned model implementation correction, not a new company forecast. The primary-source research and corrected evidence remain in `../v2/` and the original research in `../`. Neither prior version is edited. No canonical data or Site is edited.

## Result
All six published scenario outputs (every field) and all 55 sensitivity rows are exactly unchanged from v2. Current conditional per-common-share values remain $39.0319249647 / $92.1249442570 / $169.4109213711 for bear/base/bull. These are conditional analyst intrinsic values, not observed market prices, forecasts of trading prices, or backtests.

The three reviewer reproductions now raise clear `ValueError` before a price can be released:
- NaN minimum cash floor, including the first-year sales/capital 0.5 financing-deficit stress.
- Negative earnout probability.
- Nonzero interest-bearing debt, because this model has no borrowing, debt-service or financing mechanics.

## Replay
From this directory, using only Python's standard library:

    python replay_dcf.py
    python build_sensitivities.py
    python test_corrections.py
    python test_validation.py

`dcf-inputs-v3.json` is the editable input configuration. `input-schema-template.json` is a separate fixed schema/type reference; do not edit it as an assumption control. `validation.py` runs after overrides are merged, before calculation. Public function `replay_dcf.calc` raises ValueError for invalid or unsupported configurations. Valid but unfunded scenarios retain the explicit `unsupported_funding_gap` result with null valuation fields. Never catch an error and reuse a prior valuation as if it applied to the rejected configuration.

Author results: 65 inherited correction checks and 1,509 new input-validation/regression checks pass. Independent recheck requested; author tests do not constitute independent approval.

## Validation contract and scope
- Every numeric scalar, including inactive scenario assumptions and metadata numbers, must be finite and an actual int/float. Numeric strings, bools, nulls, NaN and both infinities are rejected. Objects, required keys and ten-year array lengths are checked; unknown fields are rejected, preventing new financing fields from being silently ignored.
- Probabilities and tax/new-grant compensation rates are in [0,1]. Share pools and debt-like claims are nonnegative; ordinary shares, revenue, sales/capital, strike, option volatility and option term are positive. FY2027 revenue must exceed reported Q1 revenue; a zero remaining-sales year is outside this implementation's supported domain.
- Bridge cash-flow inputs remain nonnegative under this model's convention. Net cash change can be negative. Settlement price must be positive; gross settlement cannot exceed the reported pool; deposit payment and recovery cannot exceed the modeled commitment. Restricted-share vesting is in [0,1].
- Dates must be valid ISO dates, current date within the first forecast stub, and information cutoffs no earlier than the corresponding valuation/balance dates. Day count and remaining option term must be positive. Expired options require an explicit settlement model rather than a hidden limiting assumption.
- Debt and debt weight must both equal zero. Only the existing mandatory claim reserve and reject-if-funding-required policy are supported. Nonzero debt raises `unsupported_borrowing` in the exception text. No synthetic financing estimates were added.
- Risk-free rates and ERP are constrained to [0,1], beta is nonnegative, effective WACC positive, terminal WACC above growth, terminal growth nonnegative and no greater than positive terminal ROIC. These are supported model-domain choices, not claims that negative rates or shrinking terminal firms are impossible. Pre-new-grant operating margin is restricted to [-1,1].
- Derived numerical overflow, invalid arithmetic, failed allocation identities and any non-finite output cause ValueError; JSON output uses strict finite serialization. No unfunded or invalid price is published.

The liquidity gate remains annual/stub cash-equivalent, including the up-front deposit check. It does not establish intra-quarter solvency or provide a financing plan. Existing v2 disclosure on interim estimates, conditional award assumptions and missing source facts remains applicable.
