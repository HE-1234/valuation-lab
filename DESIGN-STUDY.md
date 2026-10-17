# Design notebook

A dated record of what was studied, what changed, and what still needs checking. The aim is a clearer valuation instrument, with evidence close to the assumptions and the core model preserved.

## 2026-10-17, 08:42 UTC · Keep assumption categories in view

### Question and evidence

Can every assumption category be found without discovering a hidden horizontal gesture?

The previous source used a single nonwrapping row with horizontal scrolling and a hidden scrollbar. The 390px static preview showed the later categories extending beyond the available space; Sources and Details were out of view. Keyboard navigation already existed, but the scrolling container could also clip an outward focus outline. These are code and static-layout observations, not measured user research.

### New lessons read

- [Google web.dev, Interaction](https://web.dev/learn/design/interaction/). Read the complete written lesson: Pointer, Any pointer, Hover, Any hover, Virtual keyboards, Input types, Input modes, Autocomplete, code examples and displayed knowledge checks. Page last updated December 23, 2021. Applied its guidance that sufficiently large interactive targets benefit different input methods, and that screen width alone does not identify the input method.
- [Google web.dev, Keyboard focus](https://web.dev/learn/accessibility/focus/). Read the complete written lesson: Focus order, Tabindex, Skip links, Focus indicator, Browser default styling and Custom styles, including the displayed code examples. Page last updated October 31, 2022. Applied a visible theme-aware outline and preserved the existing logical category order and keyboard handling.

Read on October 17, 2026. Embedded demonstrations were not operated; linked videos and animations were not watched. No interactive quiz or full-course completion is claimed.

### One bounded change

Replace the hidden scrolling assumption strip with a compact, wrapping category group. All eight labels and their order stay the same. A bordered active state distinguishes selection; each control has a minimum 44px height, readable text and a separate visible focus outline. Small-screen wrapping uses a font-relative basis, so enlarged labels can take additional rows. The surrounding surface and every state use the existing six-theme color roles.

This remains direct, nonsequential category navigation. There are no numbers, completion marks, review boxes or new steps. Selection, saved inputs, live updates and keyboard arrows/Home/End keep their existing behavior. Showing every category uses more vertical space on phones; this is an intentional tradeoff for discoverability. The valuation, distribution and source context keep their positions.

### Checks and limitations

All 393 automated checks passed, including five new navigation regressions. They cover all eight categories for all 14 companies, a single selected/tabbable item, panel labeling, keyboard order and wrapping, saved category/input restoration, uninterrupted simulations, and label/selection/focus contrast in all six themes. No financial JavaScript or source JSON changed.

Static before/after layouts were inspected at 320, 390 and 1440px. An initial percentage-based phone layout overflowed in the document renderer; using the font-relative small-screen basis repaired it. Additional navigation-only layouts at 320px checked all six themes at normal and doubled category-text size: all 96 control boxes stayed within the page and at least 44px tall. Focus styling was forced for visual inspection. These are document-renderer approximations, not real browser zoom, keyboard, touch or accessibility-tree tests. Real authenticated browser verification remains unavailable behind the normal owner sign-in gate; no access control was bypassed.

## 2026-10-17, 07:42 UTC · Put the source period beside the result

### Question and evidence

Can the first phone view show which financial period the large valuation uses, without opening a control or reaching the bottom of the distribution?

The v9 390px static preview showed a shortened financial-baseline dropdown (“TTM through 202…”). The complete financial period and original-filing link were below the simulation. Alphabet's nearby capital-reference date is a different context and should remain distinct. Static preview evidence supports a small source-order refinement; it does not establish a measured user-comprehension problem.

### New lessons read

- [Google web.dev, Macro layouts](https://web.dev/learn/design/macro-layouts). Read the complete written lesson: single-column content flow, Grid, Flexbox, content-driven layout without media queries, code examples and displayed knowledge checks. Page last updated November 3, 2021. Applied the principle that a narrow screen needs a meaningful reading order before wider layout rules are added.
- [Google web.dev, Micro layouts](https://web.dev/learn/design/micro-layouts). Read the complete written lesson: component-level adaptation, Grid, Flexbox, Container queries, combined queries, code examples and displayed knowledge check. Page last updated November 3, 2021. Applied flexible component wrapping rather than another fixed-width or truncated label.

Read on October 17, 2026. Embedded CodePen and developer-tools demonstrations were not operated. No video watching, interactive quiz completion, or full-course completion is claimed.

### One bounded change

Move the existing full period label and original-filing link into a compact wrapping line above the headline valuation. Keep it outside the live-results replacement area, with an accessible group name and a source-link name identifying the company and period. Use the six existing theme roles and a 12px label. Keep the separate AAOI/Alphabet capital-reference note and the model-limit reminder below the chart. No new financial input, calculation, source gate, or acknowledgment step is introduced.

### Checks and limitations

All 388 automated checks passed, including five new source-context checks. These cover every company and financial-baseline change, the full visible period, the original filing URL, ordering before the result and simulation, named source context, stability during live edits and invalid-input recovery, and retained source/model gates. CSS contracts cover wrapping at 320/390px and text/link contrast across six themes. These markup/style checks do not establish real browser or screen-reader behavior. Static before/after previews at 320, 390 and 1440px supplement the tests; they remain document-renderer approximations. Authenticated browser and native-touch verification remain blocked by the ordinary owner sign-in gate, which is preserved.

## 2026-10-17 · A longer record, a quieter reference

### Question

How can ten annual observations help someone make a forecast without turning the phone view into ten squeezed columns?

### Sources read for this pass

- [W3C WAI, Tables Tutorial](https://www.w3.org/WAI/tutorials/tables/). Read the overview, including header relationships and captions. The page reports an update date of February 16, 2023. Applied here: a real two-column table, a descriptive caption, column headers and fiscal-year row headers. The compact graphic never replaces the exact values.
- [W3C, Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Read the criterion, intent, basic reflow, responsive layout and two-dimensional-content discussion. Applied here: keep year/value rows within a narrow column and let explanations wrap. The 320 CSS-pixel reference motivates a narrow preview; a static preview does not prove WCAG conformance.

These are original implementation decisions based on those readings. No course-video viewing or paid course completion is claimed.

### Decisions

1. Keep the v7 workspace. Company choice, the conditional valuation, the distribution and live assumptions keep their current order. This is a bounded refinement, not another redesign.
2. Give each history a clear latest fiscal-year value, with its unit and original source. If that latest value is missing, show “Unavailable” rather than silently substituting an older observation.
3. Show a small, nonanimated trend across the entire available record. Horizontal position uses fiscal period-end dates. Missing observations, absent years and material comparability changes break the line. No smoothing, interpolation or projected years are added.
4. Place an “All annual observations” disclosure directly inside the same reference unit. It opens a vertical year/value table with links, period-end dates and missing-data or comparability notes. Ten years remain readable without horizontal page scrolling.
5. Keep coverage and limitations outside the disclosure. Requested history is ten years where supported; shorter records say why. Ten reported years are not necessarily ten comparable years for the business that exists today.
6. Use the existing six-theme color roles and normal text controls. Historical trends remain quiet so that the live distribution stays the visual focus.
7. Keep reported history separate from forecasts. Reported effective tax is not forecast cash tax; historical book-capital proxies are not marginal reinvestment or terminal returns; dated component evidence is not invented company-reported WACC.

### What to verify

- Every available year and source survives rendering; no five-year truncation remains.
- Latest missing values, loss years, structural breaks and shorter company records are explicit.
- The same valid edit still changes the valuation without Apply buttons or confirmation checkboxes.
- Engine goldens, frozen data, live updates, simulations and all six themes retain their existing tests.
- Inspect 320, 390 and 1440 CSS-pixel static previews, including the expanded annual table and a shorter-history company. Keep the exact render method in the release record.
- Real authenticated browser, touch, keyboard-disclosure and accessibility-tree checks remain a separate requirement. Earlier cloud-browser checks reached the ordinary owner sign-in gate. No access control was bypassed.

## 2026-10-17 · Company judgments and editable uncertainty

The request expanded during this pass: replace identical company starting assumptions with reasoned company cases, and let the distribution family and its parameters be changed directly.

### Additional source read

- [W3C WAI, Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/). Read the overview and sections on explicit labels, visual label placement and mobile controls. The page reports an update date of May 13, 2024. Applied visible labels tied to control IDs, above-field labels, normal selects, numeric keyboards and associated explanatory text. No accessibility-conformance claim follows from markup tests alone.

### Company-case decisions

- Keep reported reference points, analyst judgments and computed consequences distinct. Each proposed driver has its own rationale and dated sources. The complete company ledger preserves those distinctions.
- New current drafts use the researched case for the exact company and financial baseline. A different or imported baseline does not inherit an unrelated case merely because the ticker matches.
- Preserve existing saved input values and notes. A numerical match with yesterday’s generic defaults is not proof that the user did not choose them. Put “Use researched base case” above the assumption tabs, with a true Undo and a nearby preview of current versus proposed values.
- Keep the current model’s profit adjustment visible. Micron’s researched case uses an explicitly labeled through-cycle starting EBIT adjustment; its reported figures remain intact.
- Label AAOI and Nebius as provisional operating hypotheses. Their simple linear paths produce nine cash-burning forecast years and do not model financing. Existing claims, share-basis and specialist-model limitations still withhold unsupported share values. A well-explained assumption does not make an unsuitable valuation model valid.
- Surface high terminal-value dependence rather than making a precise-looking result imply a robust estimate.

### Distribution-control decisions

- Offer Fixed, Triangular, Uniform and Truncated normal for each of the four simulated drivers. Show only the parameters relevant to the chosen family.
- Keep bounds explicit. Normal mean and standard deviation describe the underlying, untruncated normal; actual bounded moments can differ. A standard deviation of 2 in a percent input means two percentage points.
- Show a small qualitative density shape beside each driver. Its vertical scale is normalized relative density, not a probability. Fixed values use a single marker. The numerical simulation remains the source of actual output percentiles.
- Validate before plotting. Invalid edits clear the old distribution and prevent stale export; malformed saved configurations produce a recoverable, visible error.
- Preserve custom uncertainty with the saved draft. Changing a main assumption or reloading does not silently replace deliberately chosen distributions. An explicit reset restores illustrative starting ranges around the current assumptions.
- Retain the original triangular sampling path and finance arithmetic while extending the input distributions. The simulation methodology page describes the new sampling and relationship assumptions.

### Checks added

Focused presentation tests cover ten-year tables, missing/structurally different periods, all four distribution families, unit conversion, invalid-edit recovery, persistent custom settings, company-case loading, saved-draft preservation, Undo, visible profit normalization and unsupported-model warnings. Existing model, frozen-data, theme and animation checks remain in the full release suite.

## 2026-10-17 · v7 study that shaped the instrument

The earlier design pass reviewed public lesson transcripts, written documentation and research articles. Embedded videos were not watched. The references below record that verified reading scope; this pass does not claim to have reread every item.

### Motion that explains the model

- [Webflow University, Intro to motion](https://university.webflow.com/videos/intro-to-motion-in-webflow): public transcript. Used the distinction between a lightweight transition and a longer sequence.
- [Webflow University, When to use interactions](https://university.webflow.com/videos/when-to-use-interactions): public transcript. Applied purposeful feedback and avoided repeating a blocking intro.
- [Webflow University, Create a GSAP-powered timeline](https://university.webflow.com/videos/create-a-gsap-powered-timeline-animation): public transcript. Applied deliberate triggers, targets and timing using native animation APIs; this app does not use a Webflow or GSAP runtime.
- [Webflow, Create and manage Interactions with GSAP](https://help.webflow.com/hc/en-us/articles/53580099234579-Create-and-manage-Interactions-with-GSAP): documentation marked July 20, 2026. Checked the current workflow separately from older foundational lessons.
- [Google web.dev, Animations](https://web.dev/learn/css/animations): written module dated May 4, 2021. Applied finite timing, interruption handling and reduced motion.
- [W3C, Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) and [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): written guidance. Used visible replay/pause controls and a complete nonanimated state. The interaction-animation criterion is Level AAA; no blanket conformance claim is made.

Decision carried forward: the distribution is the expressive object. Numeric labels stay stable, the opening sequence is bounded, edits have brief feedback, and the final bars match the full simulation output. The history reference does not need a second competing animation.

### Hierarchy, familiarity and a reusable system

- [Webflow University, Intro to design systems](https://university.webflow.com/videos/intro-to-design-systems-in-webflow): public transcript. Applied shared components and semantic visual roles.
- [Google Design, Material 3 Expressive research](https://design.google/library/expressive-material-design-google-research): 2025 research article. Applied selective emphasis and familiar labeled controls. The app does not claim the study’s measured improvements.
- [Nielsen Norman Group, Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): January 17, 2021 article. Applied scale, proximity and grouping to populated screens.
- [Nielsen Norman Group, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/): December 3, 2006 article. Deferred lengthy explanations while keeping important comparison evidence and limitations close to the input.
- [Google web.dev, Responsive Typography](https://web.dev/learn/design/typography): written module dated December 9, 2021. Applied readable secondary text, flexible measure and responsive layout.

Decision carried forward: the app opens as an analytical instrument rather than a presentation or onboarding wizard. A quiet surround supports one dominant chart. Optional notes and detailed source material remain reachable without gating ordinary numerical exploration.

### Reference inspection and limits

The requested [Lusion v3 Awwwards reference](https://www.awwwards.com/sites/lusion-v3) was used as inspiration, not copied. The main entry timed out during the earlier study. The [Awwwards showcase entry](https://www.awwwards.com/inspiration/mobile_thumbnail-submission-650970892ec97887227982) and its linked 1600 × 1200 promotional image were inspected. The image supported observations about a pale surround, strong blue/black dimensional imagery and a singular visual focus. It did not establish actual phone layout or live interaction behavior. No logos, assets or implementation were copied.

## Next focused questions

- Does expanding the year table preserve a comfortable reading position in actual mobile Safari?
- Are keyboard and screen-reader labels sufficient to move between the latest reading, full history and source documents?
- Can repeated explanatory text be shortened further without obscuring accounting differences or missing evidence?
- Do the longest currency amounts and all six themes remain readable at enlarged text sizes?

Each later entry should identify the reading scope, one concrete design decision, the affected behavior and the checks actually performed. A useful finding can justify keeping the interface unchanged.
