# Current capital review · October 17, 2026 information cutoff

These additive reviews preserve the original frozen cases. Financial amounts are USD millions, share counts millions.

- AAOI: dated cash and ownership estimates plus an explicitly approximate option-inclusive allocation. Run `python research-current-capital/AAOI/option-inclusive-approximation.py` for an independent implementation. It includes time value, but is not contract-complete fair value.
- NBIS: owned-build operating-policy audit and internally matched capital/depreciation/margin sensitivities. Run `python research-current-capital/NBIS/sensitivity.py`. Positive operating EV thresholds are not positive common-equity valuations.

The application explanation is `dist/data/current-capital-scenarios-2026-10-17.html`. Default scenarios are in `dist/current-capital-presets.js`; no stock-price target was used to fit them. Notes distinguish source facts, analyst estimates, and missing inputs.
