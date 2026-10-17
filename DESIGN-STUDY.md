# Design notebook

A dated record of what was studied, what changed, and what still needs checking. The aim is a clearer valuation instrument, with evidence close to the assumptions and the core model preserved.

## 2026-10-17, 14:42 UTC · Let the valuation headline reflow

### Question and evidence

Does the amount keep its currency and per-share qualification when headline text is enlarged?

The header used two nonwrapping flex rows: one for the amount and unit, and one beside the operating-value summary. With doubled header text, the 320px document preview clipped the currency/per-share label at the panel edge; at 390px, the operating summary overlapped the amount. The amount itself still fit. These are source and static-layout findings, not measured user behavior or a native-browser accessibility result.

### New lessons read

- [W3C WAI, Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Read In Brief, Success Criterion, Intent, Basic text reflow, responsive-layout examples, section-specific exceptions, viewport/zoom distinctions, and the overlaps with Resize Text and Focus Not Obscured. Applied allowing ordinary result text to reflow independently of the adjacent chart; a chart's two-dimensional meaning does not extend to its text qualification.
- [W3C WAI, Understanding Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). Read In Brief, Success Criterion, Intent, Benefits, Examples, and the listed sufficient/advisory techniques and failures. Applied keeping content available when enlarged, including intermediate responsive layouts. The criterion can be satisfied through supported scaling mechanisms; these static checks do not establish conformance.

Read on October 17, 2026. Illustration descriptions were read as text. Linked techniques and demonstrations were not operated; no video, interactive exercise, full-course completion or accessibility certification is claimed.

### One bounded change

Let the header's two existing summaries wrap when they need more space. Keep the currency and per-share label together as an inline group that can move below the amount. Allow the primary summary to use available width, cap its container to the panel, and keep the secondary operating summary right-aligned when it moves to another row.

The amount, precision, wording, font sizes, color roles and existing small-screen visibility rules stay the same. Enlarged headers can become taller so their complete text remains readable. At ordinary text size, the three full-page comparisons changed only the unit label's local arrangement; the amount, chart and remaining page kept their positions. No application JavaScript, calculation, data, research case, saved setting or historical freeze changes. Direct editing, adjacent histories, all distributions and AAOI/Alphabet treatments retain their behavior.

### Checks and limitations

All 420 automated checks passed, including four new regressions. The baseline passed 416 checks. New checks cover the scoped wrapping contract, exact displayed amount/currency/operating summary for all 19 supported company-baseline combinations, 16 withheld combinations, category navigation, input/focus stability, invalid recovery, saved edits, and unchanged six-theme text contrast.

Twenty before/after static-preview pairs cover ordinary full pages at 320, 390 and 1440px, an enlarged 320px full page, enlarged 320/390px headers, MSFT/AAOI/Alphabet cases, and enlarged header components at 320/1440px in all six themes. All 117 after-state header text boxes fit within the panel and had no pairwise text overlap. Ordinary full-page pixel differences were confined to the currency/per-share label. The three ordinary full-page pairs, enlarged phone comparisons and all six phone themes were visually inspected.

The document renderer substitutes form-control frames, flattens responsive CSS and doubles the header's resolved font sizes for the enlarged-text approximations. These are not real browser zoom, touch, keyboard or accessibility-tree tests, nor a claim about every possible user-entered extreme valuation. The known local browser restriction and private-site owner sign-in gate were not bypassed.

## 2026-10-17, 13:42 UTC · Make keyboard focus visible on the valuation panel

### Question and evidence

Can the focused control be located consistently on the dark valuation surface?

The chart and Limits link already use the panel's bright signal color, but other links, buttons, disclosures and inputs inherit the general light-surface focus color. Against the dark panel, that inherited color measures 2.46:1 in Forest, 2.40:1 in Slate, 1.69:1 in Sand, 2.18:1 in Plum and 2.04:1 in Ocean, below the 3:1 non-text threshold. Midnight's existing color passes. Dimmed footer controls reduce the displayed contrast further. These are stylesheet/compositing findings, reproduced in forced-focus document previews, not measured keyboard-user performance or a native-browser audit.

### New lessons read

- [W3C WAI, Understanding Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Read In Brief, Success Criterion, Intent and User Interface Components, including Boundaries, Adjacent colors, Relationship with Use of Color, Relationship with Focus Visible, Hover states and Inactive User Interface Components. Applied the unrounded 3:1 threshold to the actual adjacent surface, including inherited opacity. The requirement is about a perceivable focused state; merely defining an outline is insufficient.
- [W3C WAI, Understanding Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html). Read In Brief, Success Criterion, Intent, Minimum area, solid outlines, other indicator shapes, inline links, Change of contrast, Relationship with Non-text Contrast, Component keyboard focus, Exceptions, Benefits and Examples. Applied preserving the existing solid outline and offset while correcting its surface-specific color. Focus Appearance is Level AAA; this focused repair is not a claim of meeting that criterion or whole-site conformance.

Read on October 17, 2026. Linked interactive examples were not operated and illustration descriptions were read as text; no video, interactive exercise, full-course completion or accessibility certification is claimed.

Supporting reading: the complete written [Google web.dev Images lesson](https://web.dev/learn/accessibility/images), last updated September 30, 2022, and [W3C WAI Complex Images tutorial](https://www.w3.org/WAI/tutorials/images/complex/), updated April 8, 2026. Read their purpose/context, image types, alternative descriptions, long-description approaches and displayed code examples; embedded demonstrations were not operated. The existing adjacent annual and distribution tables remain useful access to exact values, so this reading did not justify a chart or table redesign.

### One bounded change

Override the shared focus-color role only inside the dark valuation panel with its existing signal color. The same surface-aware color now reaches source links, simulation buttons, native summaries, distribution controls and footer actions. Keep the normal 3px outline with 4px offset; retain the chart's existing 2px/3px geometry and the Limits link's existing treatment. Focus color outside the panel remains unchanged. No new interaction, animation, confirmation step or visual treatment appears while controls are unfocused.

Full-strength focus contrast is at least 8.62:1 across all six themes. In the reviewed forced-focus components, including the footer's 0.65 opacity, the minimum composited ratio is 4.59:1. Threshold checks use unrounded values. No financial JavaScript, source data, research cases, historical freezes or saved settings change. The immediate editor, adjacent evidence, all distributions and AAOI/Alphabet treatments retain their behavior.

### Checks and limitations

All 416 automated checks passed, including four new regressions for surface scoping, unchanged outline geometry, six-theme contrast with dimmed ancestors and hovered statistics, existing simulation controls, distribution-type editing, unchanged playback results, stable source/input nodes, invalid-result recovery and saved edits. The pre-change suite passed all 412 checks. These source and minimal-DOM checks do not establish real keyboard operation or assistive-technology output.

Fifteen before/after static-preview pairs were generated. Unfocused full-page views at 320, 390 and 1440px were visually inspected and pixel-identical. Forced-focus component previews cover 320 and 1440px in every theme; all phone themes and the Slate desktop view were visually inspected, and all 180 measured focus-control boxes retained the same geometry before and after. The initial statistic-grid approximation required a renderer-only flex substitution; the app's grid was not changed. These previews also substitute form-control frames and force several outlines simultaneously for comparison. They demonstrate the intended color treatment, not native focus routing, clipping, touch, zoom or accessibility-tree behavior. The known local browser restriction and private-site owner sign-in gate were not bypassed.

## 2026-10-17, 12:42 UTC · Keep nested history controls understandable

### Question and evidence

When Sources & comparability is open, can the annual-observation tables inside it still be found and their state understood?

Two broad CSS selectors leaked into nested disclosures: the parent's decorative-span rule hid the inner table's label and available-count text, and the parent's open-state rule displayed a minus on the inner control even while that table was closed. Source inspection found 196 nested annual disclosures across the 14 current company views. Before-state document previews reproduced the blank, minus-only controls. This is a verified selector and static-presentation defect, not measured user research or a native-browser accessibility result.

### New lessons read

- [Google web.dev, Details and summary](https://web.dev/learn/html/details). Read the complete written lesson: introduction, native details/summary behavior, Toggle visibility with the open attribute, Toggle the summary marker, How errors are handled, the HTMLDetailsElement interface and the displayed knowledge check. Page last updated February 21, 2023. Applied the relationship between each summary and its own parent, preserving a visible label and a state indicator. The example selectors are illustrative; this app's nested controls require direct-child scoping.
- [W3C WAI, Disclosure (Show/Hide) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/). Read About This Pattern, the example list, Keyboard Interaction and WAI-ARIA Roles, States, and Properties. Applied agreement between a control's visual state and its own content visibility. Native details/summary elements remain in place; no redundant role or scripted expanded-state attribute was added.

Read on October 17, 2026. Embedded examples and linked demonstrations were not operated. No interactive quiz, video, course completion, user-testing result or accessibility certification is claimed.

### One bounded change

Restrict the parent disclosure's open-state indicator and special summary styling to its own direct summary. Restrict the hidden decorative span to that summary's own child. The nested All annual observations label, available count and plus/minus now remain independent of the parent's state.

Let annual-observation summary content wrap with a font-relative label basis. An enlarged-text preview exposed crowding between the restored count and marker; allowing a second row keeps them separate when space is tight. Ordinary-size summaries keep their compact arrangement. The same native control opens each table, and no table is automatically opened or closed by another.

No JavaScript, financial model, source data, history values, research cases or simulation code changes. Source references remain beside assumptions, editing stays immediate, and existing saved values, six themes and AAOI/Alphabet treatments retain their established behavior.

### Checks and limitations

All 412 automated checks passed, including five new regressions. They cover label/count visibility and independent marker states across all 196 nested controls; parent closing and reopening with a child still open; repeated open/closed combinations; unchanged input nodes, saved edits and invalid-result recovery; existing six-theme contrast; and the wrapping/44px style contract. Selector and minimal-DOM checks do not establish actual keyboard or screen-reader behavior.

Twenty-two before and twenty-two after static previews cover 320, 390 and 1440px, parent/child open and closed states, mixed sibling states, shorter NBIS history, AAOI/Alphabet equity contexts, and all six themes at normal and doubled summary text sizes. The enlarged-text crowding was repaired and the affected previews rechecked. All 29 visible nested summary boxes kept their label, count and correct marker within the control without text overlap and retained at least 44px height. Closed 390px and 1440px views were pixel-identical before and after. These use a document renderer with substituted form-control frames and manually selected disclosure states; they are layout approximations, not browser zoom, native interaction, touch or accessibility-tree verification. The known browser socket restriction and private-site owner sign-in gate were not bypassed.

## 2026-10-17, 11:42 UTC · Keep model issues near the assumptions

### Question and evidence

Can a phone user read why a valuation is withheld without returning from the assumption editor to the result panel?

The existing live validation correctly clears unsupported results and explains the reason in the valuation panel. On narrow screens, that panel precedes the assumptions, research controls and category group. Source inspection and before previews showed that an invalid input had no nearby explanation at the editor. This is a reading-order observation, not measured evidence that users missed an error.

### New lessons read

- [W3C WAI, User Notification](https://www.w3.org/WAI/tutorials/forms/notifications/). Read the complete written tutorial: overview, overall feedback, headings, page titles, dialogs, error lists, inline feedback, after-submit feedback, during-typing examples and focus-change guidance, including the displayed code. The page reports an update date of June 3, 2022. Applied placing feedback near the controls while preserving the current result feedback. The app has direct live inputs rather than a submit flow, so no dialog, submit button or focus jump was added.
- [W3C WAI, Understanding Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html). Read In Brief, the success criterion, Intent, native HTML validation discussion, Benefits, Examples and the listed sufficient/advisory techniques. Applied a visible text explanation, rather than a color-only cue, without inventing new validation rules. This guidance does not require a particular placement; the phone layout motivated the local copy.

Read on October 17, 2026. Live examples, linked techniques and interactive demonstrations were not operated. No video, course completion, user-testing result or accessibility certification is claimed.

### One bounded change

Add a compact model-issue note between the category group and editor, visible only while the current valuation is withheld. Its heading and message use the existing result wording; the message comes from the same caught validation error. Preserve the original explanation and its existing live region. The nearby copy is a named, noninteractive note with no second live region, no dismissal and no forced focus movement.

Keep the note stable when switching categories. Clear it as soon as the model returns a valid result, and reconstruct it from validation on company/baseline changes and reload. It adds a little vertical space only in an unavailable-result state. Valid-state layout, inputs, saved edits, source/model gates, adjacent histories, claims, simulation and calculations are unchanged. The existing six-theme warning palette supplies a full-strength border and readable text; the wording remains the cue even without color.

### Checks and limitations

All 407 automated checks passed, including six new regressions for hidden/visible state, exact agreement with result feedback, input/focus stability, invalid edits and recovery, category navigation, saved values, every company/baseline, AAOI/Alphabet claims, source/model withholding and six-theme text contrast. No second live region was added; minimal-DOM checks do not establish actual assistive-technology announcements.

Before/after full-page approximations were reviewed at 320, 390 and 1440px, covering empty growth, incompatible WACC/stable growth, invalid Alphabet claims and the longer NBIS model constraint. Valid AAPL views at 390 and 1440px were pixel-identical before and after. Twelve additional editor previews per version covered all six themes at 320px with normal and doubled note text. Every one of the 18 visible after-state note boxes stayed within its page width, including the longest reviewed constraint. Native controls are substituted with text frames in this document renderer; these are layout approximations, not browser zoom, native editing, touch or accessibility-tree verification. The known browser socket restriction and owner sign-in gate remain intact.

## 2026-10-17, 10:42 UTC · Give equity amounts enough room

### Question and evidence

Can a six-digit amount be reviewed comfortably in the same compact input used for a percentage?

The Other nonoperating assets and Other claims on equity controls use source-currency millions, and their displayed slider range reaches 100000. They inherited the percentage input's 75px maximum width at 320px. A decimal amount such as 99999.99 also needs more room. Source inspection and an isolated document-renderer approximation showed the value crowding its unit; the approximation is not evidence of native input scrolling or a measured user error.

### New lessons read

- [GOV.UK Design System, Text input](https://design-system.service.gov.uk/components/text-input/). Read How it works, Avoid placeholder text, Use appropriately-sized text inputs, Fixed width inputs, Fluid width inputs, Hint text, Numbers and the Prefixes and suffixes overview, including the displayed HTML/Nunjucks examples. Applied content-based character sizing, a viewport cap and a visible label. The suffix remains separate from the editable number. The existing native input type and decimal keyboard are preserved; this pass does not adopt a different parsing or stepper design.
- [IBM Carbon Design System, Number input](https://www.carbondesignsystem.com/building-blocks/core/components/number-input/guidelines). Read Overview, When to use/not use, Formatting, Anatomy, Styling, Sizing, Content, States, Mouse/Keyboard interactions and Validation. The page reports an update date of September 30, 2026. Applied sizing to the amount's content and available layout, retaining its label, helper text and established interaction.

Read on October 17, 2026. Live examples, Storybook and embedded demonstrations were not operated; linked videos were not watched. No course completion, user testing or accessibility certification is claimed.

### One bounded change

Give only the two million-unit assumption cards a wider, character-relative number field. Cap it to the container and let its label/number row wrap when space is tight. Preserve the separate unit and the existing font, height, palette, focus styling, hints and adjacent histories. At 320px, the amount can move below its label; at wider widths it stays alongside when there is enough room. The extra narrow-screen height is an intentional tradeoff for checking the complete amount.

No field is reformatted, clamped or replaced while typing. Percentages, multiples, native number/range controls, saved values, direct live updates, simulation settings and financial validation retain their existing behavior. No valuation, source-data or research file changes.

### Checks and limitations

All 401 automated checks passed, including four new regressions covering all-company layout scoping, labels/units/history, six-digit and decimal edits, slider synchronization, saved values, focus retention and invalid-result recovery. The existing AAOI/Alphabet, historical-source, simulation and six-theme checks remain intact.

Before/after full-page approximations were reviewed at 320, 390 and 1440px, with additional AAOI and unchanged growth views. Fourteen before and fourteen after isolated component previews cover these widths, including all six themes at 320px with normal and doubled field text. Each preview contains two amount fields. All 28 input frames in the fourteen after previews remained within the page, contained the two test amounts and were at least 44px tall. The document renderer substitutes styled text frames for native inputs; character sizing and wrapping here are approximations, not real-browser zoom, editing, touch, keyboard or accessibility-tree verification. No browser restriction or private-site sign-in gate was bypassed.

## 2026-10-17, 09:42 UTC · Keep the model-limit reminder readable

### Question and evidence

Does the quiet reminder below the distribution retain enough contrast to be read and followed?

Its enclosing span had 0.6 opacity, so the otherwise high-contrast theme colors were blended into the dark stage. The nested Limits link calculated to 4.30:1 in Slate, 4.15:1 in Sand, 4.17:1 in Plum and 4.43:1 in Ocean, below the 4.5:1 threshold for small text. The inherited general-purpose focus color was also poorly matched to this dark surface in five themes. These are stylesheet/compositing observations, not measured user research or a whole-site accessibility audit.

### New lessons read

- [Google web.dev, Color and contrast](https://web.dev/learn/accessibility/color-contrast/). Read the complete written module: Perceive color, Measure color contrast, Calculate color contrast, Using color, Color-focused media queries, Prefers color scheme, Prefers contrast and Layer media queries. Page last updated September 30, 2022. Applied checking the displayed foreground/background combination across every theme, rather than assuming that a named palette color guarantees readable text.
- [W3C WAI, Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Read In Brief, Success Criterion, Intent, ratio rationale, formula notes, Benefits and the contrast-ratio/relative-luminance definitions. Applied the unrounded 4.5:1 small-text threshold and the distinction between meaningful text and decoration. A model-limit link carries information, so visual de-emphasis does not excuse insufficient contrast.

Read on October 17, 2026. Embedded demonstrations were not operated; linked videos and external tools were not used. No interactive exercise, full-course completion or accessibility certification is claimed.

### One bounded change

Render this reminder at full opacity using its existing stage-text and signal colors. Give only its Limits link the signal-colored focus outline, keeping the existing 3px outline and 4px offset. The wording, size, placement, wrapping and disclosure action stay the same. No other text or control is brightened, and no model code, input, saved setting or calculation changes.

Across all six themes, the resulting text contrast is at least 12.49:1 and the link/focus color at least 8.62:1 against the stage. Threshold checks use unrounded values. The reminder remains subordinate in size and position, but its qualification is easier to see.

### Checks and limitations

All 397 automated checks passed, including four new regressions for composited colors, scoped focus styling, all-company/baseline disclosure behavior and stable live-edit/invalid-result recovery. Repeated opening does not change saved inputs or restart the simulation; unsupported models remain withheld.

Static before/after full-page previews were inspected at 320, 390 and 1440px. Pixel differences were confined to the reminder/link area, with no layout shift. Twenty-four additional 320px component previews cover normal and forced-focus states before/after in all six themes. The link and its outline remain inside the panel in these previews. These are document-renderer approximations; forced focus does not establish actual keyboard or accessibility-tree behavior. Authenticated browser verification remains behind the normal owner sign-in gate, and the known local browser socket restriction was not bypassed.

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
