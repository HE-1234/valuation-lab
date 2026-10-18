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

## Owner UI polish merge · 2026-10-18

The compatible UI from GitHub commits `48fb4af` and `714e7c360fcade0af9dc9aa48c6ebaec862ff5f6` is layered onto the V59 source (`b020e31060fd54a54b254d924bb672f66ce1fc17`) plus the reviewed help-navigation copy. This preserves the 120-question Learn bank, seven incremental research cases, current controls, source-specific gates and saved drafts.

Imported presentation includes phase timelines, native-control choice pills, company-search results, a Run-bar scenario selector, density previews fitted to authored bounds, layout polish and language swipes. Compatibility corrections restore focus after native Annual/Guided controls rebuild, respect disabled/read-only phase fields, cancel presentation motion on reduced-motion/background changes, and make old locale-swipe cleanup idempotent. Native input/change handlers still own validation and saved-model updates; Run remains the only simulation trigger.

The requested 5,000 attempted-scenario default is an application policy dated 2026-10-18. Fresh settings, explicit reset and Use research use it; existing saved counts remain intact until those actions. The fourteen frozen preset JSON records and their original 4,000-trial validation reports are unchanged. Current runtime provenance retains the source count/rationale and separately records the application policy. No regenerated upstream historical result or changed research-source hash is imported.

Verification at handoff: 96 focused runtime/preset/distribution/skin checks, 247 preservation/reference/company/terminal checks, and 13 new UI-adapter/policy checks passed. These are synthetic/source/engine checks, not browser visual QA. Full aggregate regression and real-browser desktop/mobile, phase interaction, locale-swipe and accessibility review remain separate release steps.
