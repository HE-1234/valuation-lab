# MRVL isolated integration handoff

Originally prepared against V64, then serialized onto frozen canonical V67 commit 9fc5cba7a4ad360cdf2f803c796939850b0943b9. This directory is isolated. No canonical edits or publication.

## Operating model

Financial origin August 1, 2026; information October 18, capital inventory August 18. Fixed source H2 FY2027 at t=0.5, then fifteen full fiscal-year periods FY2028–FY2042 at t=1.5–15.5. No actual-day dates are fabricated from the source's half/full-year convention. Future horizon extensions are explicitly edited sensitivities.

Editable annual margin is expensed-R&D economic margin after recurring future grants, not capitalized-R&D or historical GAAP margin. Annual FCFF = expensed-R&D NOPAT minus nonresearch investment. In the terminal, net five-year R&D investment is added to economic NOPAT and included in total g/ROIC investment exactly once. The terminal table explicitly labels capitalized-R&D NOPAT and total investment.

Every edit/trial recomputes source sales/capital, supplier deposits, other NWC, cash reserves and contraction lockup. Entered investment is retained; positive funding top-ups are disclosed. Reinvestment components are allocations of the aggregate, never added twice. Terminal nonresearch investment must fund its cash floor or the trial fails closed. No treasury capacity is inferred. Future research ratios remain the selected source policy; editing EBIT margins changes residual economic profitability, not those research ratios.

Default EVs (USDm): 30440.71279977198 / 100409.35804765804 / 211790.16678180074. Equity and per-share outputs remain null even for negative EV and every Monte Carlo trial. No optional claim controls are offered until a complete joint capital allocation exists.

## Evidence and presentation

Public-safe v2 operating artifacts plus v3 guidance/claim updates and independent review metadata only; no raw transcripts, captions or source snapshots. Sixteen contiguous guidance observations retain original-guidance/actual primary-source pair URLs and hashes. Google formula is described as base vesting/exercise arithmetic, not complete contract or long-dated option fair value. Historical covenant compliance is distinguished from unknown future capacity. NVIDIA proceeds are not double deducted; earnout alternatives are mutually exclusive; forward notional is not cash or a liability cap.

Existing approved UI classes and number formatting are reused; no CSS changes. Source values remain full precision; UI values use the existing maximum-two-decimal formatter. Added MRVL prose and errors have EN/ZH translations. Named-scenario loading restores keyboard focus to the corresponding existing button after rerender.

## Validation

11 focused MRVL tests pass. They cover source rows/terminal/default EVs, zero-width all scenarios, seeded nonzero joint funding floors, fixed stub, fifteen/twenty-year paths, identity/restore, invalid terminal and claims, bilingual errors, manual-only simulation, workspace selection/undo/export/persistence, and scenario-button focus. A combined focused run with independent research-model and simulation regressions passed 66 tests before the final focus-only addition; final MRVL rerun also passed.

Final source-driven static EN desktop and ZH mobile previews were inspected before aggregate testing; these are WeasyPrint approximations, not native browser screenshots. They have no viewport overflow, at most two decimals, correct mixed actual/forecast labels, and translated new share-basis text. Strict reverse hooks recover all 405 V67 production files byte-for-byte. Final aggregate results are supplied in the delivery log. No publication is claimed.

## Final V67 regression replay

All 24 earlier company operating outputs were compared to the frozen V67 baseline. All earlier incremental scenarios, defaults, bridges and seeded simulation outputs remain equal. Independent primitive reconstruction still matches all three MRVL EVs; 900 active joint trials across three scenarios and 10/15/20-year horizons retain funding floors and gated equity. The inherited NVMI test already uses a ticker-based package lookup in V67; no ordering workaround is needed.
