# Valuation Lab visual redesign

## Design decisions

The workbench now leads with company and filing selection, then places editable assumptions beside the conditional value. Related inputs use three semantic fieldsets. Detailed source, accounting and forecast material uses native disclosures; dated/non-live framing, missing-data failures and claim-review gates remain visible. Mobile retains named navigation and company actions and supplies a jump to results.

Three persistent, keyboard-operable themes share semantic surface, text, action, warning, chart and focus roles. Palette buttons contain actual color previews and a selected checkmark. Charts use the same theme roles, numeric axes, a patterned second series and a complete table alternative. Narrow layouts keep the chart horizontally scrollable rather than shrinking labels into illegibility.

## Primary guidance consulted

- Nielsen Norman Group, [5 Principles of Visual Design in UX](https://www.nngroup.com/articles/principles-visual-design/): emphasize priority through size and contrast; group related elements with space; preserve legibility.
- Nielsen Norman Group, [Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): give primary tasks a clear entry point, limit competing emphasis, and group inputs by meaning.
- Google, [Material 3 color system](https://m3.material.io/styles/color/the-color-system) and [applying type](https://m3.material.io/styles/typography/applying-type): semantic foreground/background roles and typography roles informed the theme architecture. Direct pages were JavaScript-only in the text reader; official search excerpts provided role descriptions.
- W3C, [Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): normal text target 4.5:1; control boundaries, focus and chart marks target 3:1.

## Verification

50 automated tests pass, including the 42 pre-existing mathematical/data tests, 3-theme contrast, pressed state, persistence and unavailable-storage fallback. Independent review checked the same semantic pairs, startup restore, invalid stored values, cross-tab synchronization, data hashes and retained controls.

No finance engine or research dataset was changed. Browser E2E remains unverified: local Chromium launch failed with `socket() failed: Operation not permitted`; cloud localhost preview did not load, then observation was denied by the browser URL policy. No security setting was changed, access gate bypassed, or sharing widened.

Approximate desktop previews were generated from actual HTML/CSS and actual Microsoft model outputs with WeasyPrint 70 and inspected. These are document-renderer previews, not browser screenshots. Native form controls were represented by static values, closed details explicitly collapsed, and SVG CSS variables resolved to theme colors for that renderer. They validate visual direction, not browser layout or interactions.

## Version 5 guided desk

The default task now begins with company/security and dated evidence, then asks one coherent economic question per stage. An editorial serif headline, more whitespace, an eight-step vertical index, larger grouped input cards, and a check-answers stage separate evidence from judgment. Themes live in a compact disclosure so personalization does not compete with research. Essential missing-evidence/model blockers remain outside disclosures. Detailed field ledger, original documents, annual forecast, provider limitations and optional WACC construction remain one action away.

Additional primary design guidance consulted:
- [GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/): focused questions, clear reasons, retained answers, back/continue navigation.
- [GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/): inspect assumptions and return to edit before freezing.
- [Nielsen Norman Group progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): defer advanced detail without removing important functionality or hiding safety warnings.

Six palettes have the same semantic roles and contrast tests. New current-model and minimal DOM-runtime tests verify source/assumption separation, eight-step persistence, review gates, explicit WACC application, foreign-security blocking and immutable exports. The finance engine and original five research freeze hashes are unchanged. Updated actual-code-generated HTML/CSS was inspected in approximate WeasyPrint previews for desktop and narrow layouts. This is not authenticated browser E2E.

## Version 6 · Possibility studio

Reference requested: https://www.awwwards.com/sites/lusion-v3. The Awwwards entry documents reactive cursor/scroll animation and a sparse two-color identity; the current Lusion site https://lusion.co/ was opened in the cloud browser but remained in its loading state. The design here is original: a dimensional wire globe, type-led forest/chromatic stage, rounded research instrument, a finite four-second intro, and short clipped panel entrances. No Lusion code, logos, imagery, or assets were copied.

The simulation is the functional motion centerpiece. A bounded representative sequence builds histogram mass into bins, then restores exact full-sample counts. Explicit colors resolve from the current one of six themes and repaint on theme changes. Mobile metric cards stack, controls remain touch-sized, and inspection has a native range/table alternative. Quotes retain date/source and explicit missing states. The hero shortcut exposes the simulation section without forcing users to fill every research note; evidence/model/claims gates remain enforced.

Static print-renderer approximations, populated from the app's own AAPL calculations, were inspected at 1440 and 390 CSS px. SVG palette tokens are emitted as explicit colors to remove renderer ambiguity. WeasyPrint has known inline-flex/form/media differences, so these images establish only approximate hierarchy and final-chart contrast. No browser-interaction or pixel-perfect claim is made; Chromium launch was blocked by socket permissions before any app loaded. Browser access controls were respected.
