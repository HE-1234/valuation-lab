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

## Version 7 · evidence-first instrument (2026-10-17)

### What changed

The default current workspace is now an analytical instrument, not an eight-step onboarding flow. Its first useful content is company/baseline selection, provisional base-case value and the interactive conditional distribution. A compact, horizontally scrollable assumption navigation sits beside the result on desktop and directly below it on phone. Phone landing-page slogans and the ornamental globe are removed. Current themes remain selectable and existing choices persist; new sessions start in Slate & Blue.

Each numerical assumption includes dated, source-linked company evidence in the same editing unit. Annual observations remain annual; TTM margin is separate. Missing observations remain visibly unavailable. Reported effective tax and historical book-capital productivity/return proxies are labeled as context, not silently equated with forecast cash taxes, marginal investment efficiency or terminal marginal ROIC. WACC uses dated component context without inventing company-reported WACC. Other-assets/claims edits show balance-sheet context, not fictitious historical adjustments.

Review/acceptance checkboxes and Apply/Continue/Mark reviewed actions are removed from the current workflow. Inputs update immediately; notes and changes save locally. The unchanged arithmetic is invoked in an explicit provisional-bridge calculation context, which does not set either legacy user-review flag. Data, date, security/currency, adjustment-evidence and unsupported-model constraints still fail closed. Manual quote comparison now matches an explicit economic share-basis field; a legacy confirmation boolean cannot establish compatibility.

Motion belongs to the chart. On first meaningful visibility (at least 35% of the actual chart), bounded representative samples assemble into the exact full distribution in about 1.6 seconds. The visibly labeled Replay/Pause/Resume controls work on touch. Editing an assumption gives 360 ms bar-height feedback using the previous and current actual histogram heights, with a 120 ms computational debounce. Navigation between assumption categories does not replace the chart or the active numeric input. Reduced motion uses a complete static result. Hidden/offscreen/cancelled animations restore exact full-run heights. All simulation settings recalculate without an Apply action, and invalid edits clear prior values, quote gaps and percentile tables.

### Study actually used

The design researcher read the accessible lesson transcripts and written guidance below. No claim is made to have watched all course videos, completed a paid course or inspected the reference site's live implementation. Current 2026 Webflow tooling was checked separately; Google Expressive research dates to 2025, and the web.dev/NNG foundations are older.

- [Webflow University: Intro to motion](https://university.webflow.com/videos/intro-to-motion-in-webflow): distinguish feedback from sequences. Applied as short live-edit feedback plus explicit replay.
- [Webflow University: When to use interactions](https://university.webflow.com/videos/when-to-use-interactions): purposeful triggers, no repeated blocking intro. Applied by removing the globe/hero and tying motion to the distribution.
- [Webflow University: GSAP-powered timelines](https://university.webflow.com/videos/create-a-gsap-powered-timeline-animation): deliberate trigger/target/sequencing. Applied through bounded native WAAPI, without adding a library dependency.
- [Webflow University: Design systems](https://university.webflow.com/videos/intro-to-design-systems-in-webflow): shared tokens/components. Applied through reusable assumption/history units and preserved semantic themes.
- [Webflow July 2026 interaction documentation](https://help.webflow.com/hc/en-us/articles/53580099234579-Create-and-manage-Interactions-with-GSAP): confirms the current interaction workflow; no Webflow runtime is used here.
- [Google Material 3 Expressive research](https://design.google/library/expressive-material-design-google-research): selective emphasis with familiar controls. Applied to one dominant chart, ordinary labeled number inputs, native sliders and quiet surrounding structure.
- [NN/G visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) and [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): proximity before more panels; disclose infrequent detail while keeping evidence primary.
- [Google web.dev responsive typography](https://web.dev/learn/design/typography) and [animation](https://web.dev/learn/css/animations): readable responsive text, bounded motion and reduced-motion support.
- [W3C pause/stop/hide guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html): visible playback controls, background/offscreen cancellation and a complete nonanimated alternative.

### Verification and limitations

The final source passes 254 automated engine, data, DOM, event and motion-lifecycle tests, including preserved historical numerical goldens and original frozen-data hashes. The legacy engine diff is one explicit provisional-bridge compatibility condition; Monte Carlo numerical changes are limited to that adapter field. All distribution arithmetic remains unchanged.

Static screen approximations were rendered and visually inspected at 320px, 390px and 1440px. These use WeasyPrint with native controls represented as static elements; they are not browser screenshots and cannot establish real iOS layout, touch, accessibility-tree or animation behavior. The supported cloud browser still reaches the private host's ordinary owner sign-in gate. No access restriction, security token or user-computer restriction was bypassed. Real authenticated browser QA remains unverified.
