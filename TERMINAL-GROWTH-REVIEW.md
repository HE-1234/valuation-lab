# Current terminal review and selected Google case

The October 18, 2026 review is an additive runtime overlay. Frozen October 17 source cases, Studio preset JSON, source constructor semantics and original numerical goldens remain unchanged.

- `terminalReviewedResearchDraft` changes only GOOG/MSFT/AMZN terminal growth from 2.5% to 3%; the other eleven economic cases are exact. It supplies dated, company-specific rationale for all fourteen.
- `currentResearchDraft` additionally loads the exact previously audited 20-year Google operating scenario, as explicitly selected by the user. Its current UI label is **Selected Google case**. It uses 35% operating margin by year 5, 10% WACC, 16% terminal ROIC and the audited source-calendar investment floors plus funded expansion. No annual figures are reconstructed from rounded descriptions.
- The selected Google annual path still ends at 2.5%; the terminal continuation is 3%. The retained generated-terminal recipe records the original path-generation assumptions. The terminal-only edit does not regenerate annual capital budgets.
- Terminal revenue, NOPAT, reinvestment (`NOPAT × g / ROIC`), FCFF, denominator and PV all flow through the existing engine. No WACC, claim, date, funding, or share-count adjustment is made to reach a price target.
- June 30, 2026 conditional Google per-share values: original frozen case **210.13252174515782**; terminal-only reviewed comparison **214.86084474340134**; selected case **306.61690714794605**. These are conditional dated allocations with the existing unresolved-claim warnings, not October market values or guaranteed fair values.

## Loading and recovery

Fresh cases and explicit **Use research** load the current selection. Saved drafts are neither upgraded nor reserialized on mere selection/reload. Full Undo preserves earlier inputs and notes. Google offers **Compare terminal-only research baseline** through the existing case-action menu; the existing **Reload original operating path only** retains access to the frozen original. Simulation reset uses the selected case's fixed terminal 3% and 20-year annual path settings; optional terminal uncertainty remains available.

Review metadata is separate from source identity and the original information/valuation dates. Restore rejects forged review/selection identity while retaining malformed input for recovery; legitimate later user edits remain allowed.

## Sources and presentation

Public review assets contain only public URLs and repository-relative provenance. The bilingual readable report is `dist/data/terminal-growth-review-2026-10-18-v1.html`; its structured companion includes dated methodology and rate-reference scope. USD 3% is analyst judgment, not a Damodaran prescription. TSM's synthetic TWD ceiling is explicitly distinguished from an observed Taiwan yield.

Current English/Simplified Chinese copy is isolated in `terminal-review-messages.js`. The new review report follows the existing saved locale and corner language control through `terminal-review-page.js`; its static fallback is English. First-three-year selected Google growth is derived from the exact annual revenue rows (24.5745%, 23.7399%, 20.3321% to four decimals). Original dated research text is retained in provenance rather than presented as a description of the expanded current uncertainty model.

## Verification

`tests/terminal-growth-review.test.mjs` covers frozen source SHA, unchanged eleven-company economics, unchanged annual/capital/claim/date fields for the terminal-only review, exact selected Google source rows, funded terminal formula and invalid guards, strict restore, saved-byte preservation, explicit load/comparison/Undo, export and fixed Monte Carlo parity.

The independent Google integration audit verified exact economics and the three values above. The pre-existing full-suite AAOI history-builder failure is caused by an unavailable external raw-cache file; it is unrelated to this change and is not suppressed.
