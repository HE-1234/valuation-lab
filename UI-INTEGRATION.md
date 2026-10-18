# Annual Report UI integration

## Source and preservation

The user-approved Annual Report design comes from `HE-1234/valuation-lab` commit `7e211252e3adf87fed61fe3caddbe210a3b71127` (merged 2026-10-18 UTC). It is integrated with Site model release `b1b43cb295e03f5f0c1706a5ad44222bd3f55c3f`, rather than replacing newer calculations with the older GitHub snapshot.

The imported `dist/skins/report.css`, `skin-base.css`, licensed Schibsted Grotesk font, loader and motion layer retain the approved design. The six edition names, palette swatches and theme summary are synchronized. Existing research, source provenance, current-capital claims, 10/15/20-year revenue horizons, optional margin phases, original routes and saved-case identities remain.

Narrow interaction corrections make the existing visual design work with extended forecasts: timing strips cover the actual independent calendar, number scrubbing preserves saved precision, and decorative simulation drops follow the native representative outcomes and replay clock. Decorative animation does not constitute additional simulation draws.

## Capital assumptions

Guided may optionally use an early and later incremental sales-to-capital ratio. The early ratio is the existing input. A separately selected later ratio applies after the early period; its inverse, capital intensity, transitions to the terminal-ROIC-compatible endpoint after the selected fade-start year. Capital timing remains independent of revenue and margins. Absent or disabled optional settings preserve previous model economics. The existing sales-to-capital Monte Carlo draw scales both authored ratios together; it does not add an independent uncertainty dimension.

Year-by-year research retains explicit net-investment schedules. Its effective incremental ratio is a read-only diagnostic, not another investment deduction.

The displayed marginal-return proxy combines modeled after-tax operating margin and incremental sales-to-capital. It is not whole-company ROIC or the change in NOPAT divided by reinvestment. A reliable opening invested-capital stock is needed for accumulated-capital ROIC; missing stocks are not invented. Construction timing and changing margins can make the proxy misleading. Under the existing same-year investment convention, the terminal-consistent marginal proxy tends to terminal ROIC divided by (1 + stable growth).

## Method sources

- [Damodaran's April 14, 2025 class guidance](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/eqUGemailSpr25.html): forecast marginal ratios differ from historical aggregate ratios; check the investment uses and implied returns.
- [Growth company value drivers](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/growthvaluedrivers.htm): reinvestment/revenue timing, existing spare capacity and stable-growth reinvestment.

These are implementation choices informed by the framework, not an endorsement or a claim of completing a course.
