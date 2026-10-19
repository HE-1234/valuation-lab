# SNDK v3: additional-claim funding consistency

Version2 and original sources are preserved. This correction supersedes only the generic additional-claim reserve treatment; all RESEARCH-V2.md source, date, terminal funding, claim-overlap and proxy-denominator caveats remain binding. No canonical/Site edits.

The generic additional_claim_reserve_assumption now has an explicit **immediate face-value cash-reserve** assumption. It is included among opening reserved cash, reducing the funding cash pool before forecast operations. Equity is calculated using that reduced opening surplus and does NOT deduct the claim a second time.

With the default zero assumption, every prior base EV/equity/value/funding result is bit-for-bit unchanged. At a$1,000M claim, opening surplus is-$410M and the modeled immediate funding gap is$410M. Common-equity and both per-share fields are null pending financing. The positive operating EV, if shown, carries operating_value_status=CONTINGENT_ON_UNMODELED_FUNDING. It is a counterfactual operating diagnostic, not a funded going-concern equity valuation. No securities sale, borrowing or refinancing is silently assumed.

At$590M the opening surplus is exactly zero and no gap arises in the three retained-cash base paths. At$590.001M an immediate$0.001M gap triggers the null-price gate. Treasury forecasts may use different settlement timing only after an explicit timed reserve/payment schedule is modeled; the current generic field cannot silently defer payment.

Run replay_dcf.py, build_extra_sensitivities.py, test_model.py and test_claim_funding.py.84 inherited author tests and33 additional claim tests pass. generic-claim-funding-sensitivity.json preserves zero/below-boundary/boundary/above-boundary/$1B cases for all three scenarios. Author tests are not independent recheck.
