# Guided company integration — 2026-10-20

The user requested every newly researched company in Guided valuation. The approved Annual Report design is retained. Guided now uses the existing company-specific annual controller for all 22 reviewed additions, alongside the 14 original Guided companies. The 26 pending directory entries remain discoverable without fabricated results.

## Interaction decisions

- Six editing steps: Story, Growth, Profitability, Investment, Risk and Equity. Existing inputs and handlers are moved, never cloned. Guided and Year-by-year share these reviewed company drafts and Undo.
- Clearly labeled choices for the existing June 30, 2026 conditional per-share illustrations. No assumption is silently certified, and current-target restrictions remain.
- Imported legacy companies remain in the correct directory after navigation. Conditional-calculator shortcuts reveal Equity before focus. The last step reveals the forecast on phone-width layouts.
- The company's existing history, model-specific constraints and source evidence remain available beside its assumptions.

## Dated design study

Read the accessible W3C ARIA Authoring Practices [Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) on 2026-10-20. Applied the concrete lesson that step tabs must expose selected state, label their content panel, and support Left/Right plus Home/End keyboard navigation. Tested native Chrome desktop and 390px layouts; this is not a claim of screen-reader or physical touch-device testing, course completion, or video viewing.

## Verification and preservation

The initial native candidate passed focused checks but independent review found import and navigation edge cases. The repaired candidate adds mounted-presentation regressions and real event semantics to the existing test harness. Native import-file selection was blocked by the Chrome extension's file-URL permission; no permission was changed. The actual import handler is covered by automated tests.

Only five production files are replaced/added: index.html, guided.js, research-view.js, guided-reviewed.js and guided-reviewed.css. Financial engines, data, frozen research, provenance and the six theme assets are unchanged. The exact new delta is checked against immutable V87. Older preservation tests receive an explicit verified V87 projection; their historical assertions and expected hashes remain unchanged. New full-tree tests verify every existing production byte and mode, all 62 frozen fixtures, the two exact additions, and mutation rejection.

Release requires the complete aggregate suite to pass after these final changes. No GitHub push is included in this change.

Historical rendered-output goldens retain an exact V87 copy of their original minimal DOM fixture. New runtime and mounted-presentation tests use the enhanced fixture. This avoids reinterpreting frozen output hashes through new selector semantics; the old model results and expected goldens are not changed.
