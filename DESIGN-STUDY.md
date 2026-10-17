# Design notebook

A dated record of what was studied, what changed, and what still needs checking. The aim is a clearer valuation instrument, with evidence close to the assumptions and the core model preserved.

## 2026-10-17 · A decision workspace shaped by the desktop review

### Evidence and scope

The supplied desktop review described a strong central interaction, changing an assumption and understanding its effect, surrounded by competing navigation, small text and an overly narrow annual editor. It reported a distribution disappearing during recalculation. That report is user-provided interaction evidence; our confirmation here comes from shipped code, synthetic lifecycle tests and static rendering, not a new browser observation. The review’s $49.97 example is one observed test result, never an expected value or a constant in the implementation.

This pass addresses the whole supplied direction while retaining the distinct models. No accounting arithmetic, source fact, default research judgment, saved-case identity, annual source row, historical freeze, claim gate, access policy or sharing setting changes.

### Written sources read for this pass

- [W3C WAI, Menu Structure](https://www.w3.org/WAI/tutorials/menus/structure/). Read the overview, menu representation, identification and labeling, current-item state, and responsive structure. Applied separate, named primary and model-mode navigation, stable route identities, visible current state and the same destinations on narrow screens. The page is dated May 13, 2024.
- [W3C WAI, Tables Tutorial](https://www.w3.org/WAI/tutorials/tables/). Read the complete overview covering header relationships, row/column scope, captions and alternative presentation. Retained native two-direction headers, a caption with currency units and year-specific input names. The sticky year column is an added visual aid, not a substitute for those relationships. The page is dated February 16, 2023.
- [Google web.dev, Typography](https://web.dev/learn/design/typography). Read the written sections on text size, scaling, clamp, line length, line height, hierarchy and font loading, plus the displayed knowledge checks. Applied a shared 15–16px reading/body scale, 13–14px supporting scale, relative units and a 70ch measure. System fonts avoid an extra remote-font request. The page is dated December 9, 2021.

Read on October 17, 2026. No linked interactive example, embedded video, course assessment, native browser or assistive technology was operated. This is a bounded implementation study, not an accessibility-conformance claim.

### Product structure and first screen

Studio, Research and Learn are the three primary destinations. Guided, Annual model and Historical are visible Studio modes. The existing route IDs and all three separate saved-data namespaces remain intact. Annual model remains the fresh-session default, matching the earlier research-default instruction. Research begins with the dated company dossiers and evidence links; the historical experiment protocol, freezes, evaluation controls and source/import tools remain reachable.

Company, model mode and financial period share one toolbar. Research actions use a disclosure; the earlier large research announcement becomes a dated update link. Navigation retains the selected mode when returning to a section, supports the original deep links and Back/Forward, and does not force a page-top scroll. A regression specifically covers Back from Guided to the initial empty URL hash.

The existing six theme choices remain. Slate & Blue receives a warm neutral surround with the existing navy and blue roles. One shared typography layer lifts the legacy small supporting text across workspaces. Financial numbers use tabular figures. Result and active-editing surfaces carry most of the fill; source explanations use dividers and spacing. Research and Learn prose uses a 70ch maximum measure.

### Annual editing and exact display

A compact operating/equity summary precedes the full-width annual schedule, followed by simulation and supporting analysis. The 160 source annual rows remain intact across 14 companies. The schedule retains a named horizontal scroll region on phones, with a sticky year column and header. Its units identify USD or TWD millions; rates stay percentages. One adjacent source anchor identifies actual versus management-forecast context.

Annual cells display grouped numbers at a readable precision. Focusing reveals the full stored numeric string; blur only changes presentation. Neither event writes a draft or recalculates. Actual edits parse conventional thousands groups explicitly; malformed grouping, blank required values and invalid numerical domains withhold outputs. Raw typed invalid text survives refocusing. Full precision remains in the draft and JSON export.

Compact period labels use the supplied annual period, without inventing an exact fiscal year end. NVDA’s rolling July and AVGO’s rolling August periods remain different from their fiscal years; MU remains FY-labeled. The complete original labels and fiscal-calendar cautions are available in the same editor. The main headline uses compact money such as trillions, while exact operating value and million-unit sensitivity tables remain available. Signed negative operating EV, conditional equity treatment and TWD ordinary-share units remain explicit. Human-readable UTC timestamps are display-only.

### Assumption → outcome → explanation

Guided and Annual model now compare the current deterministic result against that company’s opening draft in the current session, including an already saved draft. The comparison is calculated from actual model outputs. It follows edits and Undo without becoming a new model input; switching companies does not mix baselines. Reload establishes a new session opening case. Different capital/share bases or valuation dates suppress an inapplicable comparison. Percentage changes are omitted for nonpositive starting values.

The label says that this is a model change, not investment return. Guided names changed core drivers; annual controls retain direct revenue, investment and terminal-method explanations. Full claims limitations and material timing/terminal warnings stay beside results. Detailed claims, original period definitions, capital reconciliations and research reasoning remain disclosures rather than being deleted.

Completed distributions are the default. The optional falling-ball experience is labeled Replay simulation. Recalculation retains a same-sized, visibly previous chart with an Updating status; stale chart inspection and export are disabled. Invalid or failed calculations use an honest same-height placeholder. A 280ms change transition is used when motion is enabled; bar geometry is only interpolated for comparable bounds and value basis. Otherwise exact new marks fade in. Source axes are never frozen in a way that clips new values. Repeated edits, stale completions, cancellation, teardown, visibility changes and reduced motion are covered by lifecycle tests.

Shared page and assumption-category entrances now use an interruptible 180ms opacity-only transition. The former 520ms translation and clipping entrance is removed. Reduced motion keeps the complete final state immediately. SVG simulation labels compensate for viewBox scaling to remain readable; this is tested through the synthetic resize API, not a physical-device observation.

### Learn

The original six questions and their answers/explanations are unchanged. Learn presents one question at a time with visible question/answer progress, Previous/Next review and remembered answers during the session. After answering, each topic offers a small interactive teaching example. These invented teaching numbers are clearly separate from company valuations and never alter a model. Feedback updates preserve control focus and do not force scrolling. The previous worked example remains in a disclosure.

### Verification and limits

The current aggregate passes all 727 automated tests, including new navigation, display/precision, real-output comparison, Learn and simulation lifecycle checks. Every one of the 800 annual input fields was focused and blurred in the actual workspace fixture without changing or saving its value. Model and source golden checks remain intact. The historical app’s operational content is pinned to the pre-feedback source after narrowly excluding the explicitly authorized navigation/Learn lines and display-date wrappers; the engine retains its original byte pin. Shared motion has an explicit new 180ms/no-translation contract rather than silently refreshing a protected hash.

Nineteen before/after static-preview pairs (38 primary images and 18 top crops) cover Annual at 320/390/1440px, the full annual schedule and simulation at phone/desktop widths, Guided and Learn at 390/1440px, TSM native TWD, an engine-computed signed-negative scenario, and result cards in all six themes. The phone/desktop hierarchy, schedule, Guided distribution, focused Learn exercise, TWD units and dark-theme exact-value disclosure were visually inspected. A dark disclosure-label contrast defect was corrected before the final renders. The checked source and model values are produced by each version’s actual runtime fixtures, not hand-entered preview figures. A reproducible renderer script, source fingerprints and an override manifest accompany the previews.

These WeasyPrint document approximations use static native-control substitutes, flattened media rules and renderer-only grid/flex/SVG workarounds. They cannot verify real sticky scrolling, native controls, touch, screen-reader announcements, animation frame rate or layout stability in a browser. The independent preservation audit also passes all 727 tests with no remaining observed implementation blocker. No denied browser-launch route or owner sign-in gate was retried or bypassed.

## 2026-10-17, 19:49 UTC · Retain the renewed Company selector

### Question and evidence

After selecting another company in the renewed annual-research workspace, can keyboard interaction continue from the same control?

The Company selector called a function that replaced the entire workspace, including the focused selector. Its handler did not restore focus. The minimal-DOM fixture reproduces the old element becoming detached and the active control becoming null. This is a source and handler finding, not a native-browser or screen-reader observation. The previous focus repair covered the separate scalar Studio's growth selectors, so it did not cover this new workspace.

The annual editor already supplies a visible horizontal-scroll instruction, a named keyboard-focusable scroll region, native table headers and year-specific input names. This review did not justify adding another navigation control or changing its financial table.

### New lessons read

- [W3C WAI APG, Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/). Read Introduction, Fundamental Keyboard Navigation Conventions, Discernible and Predictable Keyboard Focus, Focus VS Selection, and Keyboard Navigation Between Components. Applied its focus-persistence and predictable-movement guidance when an active element is removed. Initial page focus remains unchanged. The guide marks parts of its focus section as unfinished; no claim of a complete accessibility standard is made.
- [WHATWG HTML Standard, Focus management APIs](https://html.spec.whatwg.org/multipage/interaction.html#focus-management-apis). Read the activeElement and focus API descriptions, FocusOptions and the element focus algorithm. Applied preventScroll to retain the logical control without requesting a viewport move. The browser keeps responsibility for native focus indication; no focus-ring suppression or custom keyboard handling was introduced.

Read on October 17, 2026. This is bounded written-source study. Linked demonstrations, native select menus and assistive technology were not operated; no video, course completion, user-testing result or accessibility-conformance claim is made.

### One bounded change

After the Company's existing change handler finishes selecting and rendering, focus its replacement selector once with automatic scrolling prevented. Keep this restoration inside that explicit event handler. Mounting, programmatic company changes, ordinary result updates, notes, Load, Undo and normalization do not gain a new focus call. Retained invalid-draft screens also contain the replacement selector, so the same control remains available when recovery information is shown.

No visible markup, label, layout, theme, control order, source link, valuation, annual schedule, claims gate, model, simulation, source data or historical freeze changes. Live editing, saved drafts, explicit unknowns, original-case loading, Undo, separate Studio behavior and owner-private access remain unchanged.

### Checks and limitations

All 691 automated tests passed; the clean source baseline passed 686. Five new regressions cover repeated selection across all 14 companies, six malformed or unsupported saved-draft cases, exact recovery bytes, edits and explicit unknown claims across switches/reload, Load/Undo, session-only storage fallback and the absence of focus changes on unrelated renders. Four new tests fail against the previous handler; the unchanged-focus-scope test already passes. Focus assertions require one call to the attached replacement selector with preventScroll enabled.

Before/after snapshots contain identical serialized DOM, displayed results and saved-draft content across 22 reviewed, malformed and edited states, excluding save timestamps. All 14 generated workspace HTML inputs are identical. Before documentation regeneration, the only changed file among 91 dist files is research-view.js; every stylesheet, model, simulation and financial-data file is unchanged.

Nine paired static previews cover full pages at 320, 390 and 1440px plus the toolbar in all six themes at 320px. All 16 corresponding rendered pages are pixel-identical. The phone/desktop first pages and six-theme toolbar views were visually inspected. These document-renderer approximations substitute native controls, flatten responsive CSS and paginate the page; they do not verify native focus routing, select-menu cancellation, browser scrolling, touch, accessibility-tree or screen-reader behavior. The known browser-launch restriction and private sign-in gate were not retried or bypassed.

## 2026-10-17, 17:42 UTC · Keep focus on the path control that changed

### Question and evidence

When a growth-path selector rebuilds the workspace, does focus stay with the same logical control?

The shared handler always restored focus to Early growth pattern inside the Growth category. AAOI's separate Operating path selector is available above all eight categories. Using that selector in Growth moved focus to the other control; in the seven other categories the target was absent, so the initiating node was replaced without focus restoration. The prior Operating path handler also lacked restoration; the shared handler introduced the explicit different target in Growth. This is a source and minimal-DOM finding, not an observed native-browser or screen-reader failure.

### New lessons read

- [W3C WAI, Understanding On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html). Read the complete written guidance: In Brief, criterion, Intent, Benefits, Examples, Techniques and key definitions. Page updated June 28, 2026. Applied the distinction between a predictable local content update and an unexpected change of focus or context. Live valuation updates do not by themselves call for an Apply button.
- [W3C WAI, Understanding Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html). Read the complete written guidance, examples, techniques and definitions. Page updated March 9, 2026. Applied preserving a logical place in the interaction rather than sending the user to a different control. More than one understandable content order can be valid; this reading does not require rearranging the growth fields.
- [W3C WAI, SCR19: Using an onchange event on a select element without causing a change of context](https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR19). Read Description, the displayed code example, Procedure and Expected Results. Page updated January 12, 2026. Applied retaining the trigger's logical identity while updating subsequent controls. The example's distinction between browsing and committing an option remains an important native-browser check.

Read on October 17, 2026. Linked working examples and external resources were not operated. No video, course completion, native assistive-technology test or accessibility-conformance claim is made.

### One bounded change

Pass the initiating selector's ID to the existing path-change handler. After its existing render, restore focus once to that selector's replacement node, with the existing prevention of automatic scrolling. The Growth selector keeps its original target; AAOI's Operating path selector now keeps its own target in every category.

No layout, label, unit, control order, theme, annual rate, default, stored value or Undo behavior changes. Live updates remain immediate. All financial arithmetic, simulation, source data, company research, historical freezes, adjacent history and private access remain unchanged. The review found no evidence justifying a broader visual change while the company forecast research remains the priority.

### Checks and limitations

All 490 automated tests pass; the baseline passed 487. Three new regressions cover all 24 combinations of AAOI's three path options and eight categories, 85 Growth-selector changes across all 14 companies, and annual editing, invalid recovery, maturity Undo and saved restoration. AAOI checks require exactly one focus call to the attached replacement control with automatic scrolling prevented. The new tests fail against the prior handler and pass with the repair.

All 24 AAOI before/after states retain identical serialized DOM, result markup and saved-draft content after excluding the save timestamp. Both stylesheets are unchanged. Twenty-four generated static-input files, including flexible paths in all six themes, are identical before and after. Three paired AAOI full-page static previews at 320, 390 and 1440px produce four paginated images; every corresponding image is pixel-identical. The phone and desktop views were visually inspected.

These document-renderer approximations substitute native controls and do not establish native select-popup behavior, keyboard selection/cancellation, touch, screen-reader output or browser focus fallback. The minimal-DOM fixture verifies handler targets rather than native focus behavior. The known browser restriction and private owner-sign-in gate were not retried or bypassed.



## 2026-10-17, 17:18 UTC · Separate early growth from maturity

### User need and model decision

The user asked to maintain or explicitly enter three or five years of revenue growth before a fade, and to choose ten, fifteen or twenty years to maturity. A single initial-growth slider with an implicit ten-year fade could not express that distinction.

The new current-only panel names two separate choices: early growth pattern and maturity year. Native selects and labeled annual number fields use the existing six-theme control system. Annual entries keep their DOM nodes while editing; invalid values clear stale outputs. Small-screen selects stack, annual fields use two columns, and methodology remains in an optional disclosure. Existing history stays beside the scalar initial-growth assumption. There are no review or confirmation checkboxes.

Existing researched paths are not silently extended. Legacy linear and AAOI staged defaults retain their previous ten-year economics; the user deliberately selects a flexible profile. Switching preserves scalar inputs, and Undo restores only the changed path/maturity fields. Maturity Undo retains later annual-rate edits. Research loading is an explicit reset to its documented original profile.

### Method evidence and limits

The associated financial-method review checked Damodaran's [high-growth duration discussion](https://pages.stern.nyu.edu/adamodar/New_Home_Page/valquestions/highgrowthperiod.htm), [firm valuation chapter, Cisco Illustration 6.3](https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/ch6N.pdf), and [terminal-value chapter](https://pages.stern.nyu.edu/~adamodar/pdfiles/valn2ed/ch12.pdf). The relevant conclusions are that duration is a business judgment, longer transitions can be coherent, stable reinvestment must be tied to growth and marginal return, and a path is not complete merely because the horizon is longer.

This implementation synchronizes margin and capital maturity with growth as a disclosed simplification. WACC remains constant; it does not claim a modeled risk or capital-structure transition. Terminal ROIC is not automatically forced equal to WACC. The current-only adapter reconciles its capital-intensity endpoint with the original engine's next-year terminal NOPAT timing. Explicit annual simulation paths use one parallel growth shift per draw, never independent yearly growth draws.

The panel reports implied maturity revenue, modeled cumulative net reinvestment and terminal marginal returns, plus a same-scalar legacy ten-year comparison. It does not infer market share, funding availability or a target price. The independent Alphabet audit distinguishes changed growth timing from changed capital assumptions.

### Checks actually completed

All 487 tests pass. New coverage includes 38 independently derived numerical/seeded-draw checks, 14 persistence/boundary checks, six actual-handler minimal-DOM checks and 24 full v19 deterministic/seeded-simulation hashes. The original engine and historical freeze integrity checks pass. One structural assertion was adapted narrowly for the new dynamic operating-table caption; no financial expectation or validation was weakened.

Twelve actual-app static previews cover 320, 390 and 1440px, all six themes, a five-year explicit path with twenty-year maturity, annual forecast tables, AAOI and Alphabet. The control panel, history context, six themes, desktop valuation/assumption layout and long forecast table were visually inspected. The previews are generated by a document renderer using native-control substitutes and do not establish real select-menu, keyboard, touch, screen-reader or browser layout behavior. The existing browser/socket and owner-sign-in limits remain in force; no bypass was attempted.


## 2026-10-17, 16:42 UTC · Keep table values connected to their row labels

### Question and evidence

When navigating a financial table cell by cell, can its purpose and the row belonging to each number be identified from the markup?

The current workspace's shared table helper supplied column headers but no table name, and rendered the first-column row labels as ordinary data cells. Source inspection found this pattern in nine table purposes: source facts, captured capital inputs, the equity bridge, share allocation, claims comparisons, dividend dates, operating stresses, the staged path and the annual cash-flow forecast. Across all 35 company-baseline combinations, those views generate 102 table instances and 1,635 body rows. Adjacent history and distribution tables already have captions and row headers. This is a markup finding, not an observed screen-reader failure or measured user error.

### New lessons read

- [W3C WAI, Tables with One Header](https://www.w3.org/WAI/tutorials/tables/one-header/). Read the complete written tutorial: overview, top-row headers, first-column headers, ambiguous data, displayed examples and code snippets. Applied explicit column direction rather than relying on the appearance of a heading. Existing column headers were already correct and remain unchanged.
- [W3C WAI, Tables with Two Headers](https://www.w3.org/WAI/tutorials/tables/two-headers/). Read the complete written tutorial: overview, top-row/first-column example, offset row-header example and displayed code snippets. Applied native row headers alongside the existing column headers, so each numerical cell has both a metric/date/year context and a column context.
- [W3C WAI, Caption & Summary](https://www.w3.org/WAI/tutorials/tables/caption-summary/). Read the complete written tutorial: overview, identifying a table with a caption, complex-table summaries, caption nesting, aria-describedby and figure approaches, including displayed examples and code. Applied a concise caption identifying the company and table purpose. These simple tables do not need a new complex-structure summary; nearby explanations remain available.

Read on October 17, 2026. All three pages report an update date of July 27, 2019. Linked full-code pages and techniques were not separately opened, and no live assistive-technology demonstration was operated. No video, interactive exercise, course completion or accessibility certification is claimed.

### One bounded change

Give each shared current-workspace table a native caption naming the company and table purpose. Keep its text visually hidden using the established text treatment, because visible headings, disclosures and column labels already provide context in the layout. Mark each first-column label as a row header and retain the existing column scopes.

Scope the new row-header styling to these tables so their previous body-cell appearance remains intact, including the smaller ordinary-table type and the claims tables' separate size and minimum width. No new focus stop, live region, button, acknowledgement or editing step is introduced. Existing histories and distribution tables are unchanged.

All displayed figures, units, rows, source links and formulas retain their existing content. No model, simulation, financial data, research case or historical freeze changes. Direct editing, saved drafts, six themes, adjacent histories and AAOI/Alphabet treatments retain their behavior.

### Checks and limitations

All 429 automated checks passed, including five new regressions; the baseline passed 424. The new checks cover native caption and row/column relationships across all 102 generated tables, exact source and forecast values across all 35 baselines, the 19 supported forecasts and 16 withheld cases, claims alternatives, staged/linear paths, live edits, input/focus stability, invalid-state clearing and recovery, category navigation, saved drafts and escaped caption text. These are source and minimal-DOM checks, not actual speech-output verification.

Twenty-six before/after static-preview pairs cover 320, 390 and 1440px pages, source and forecast tables, AAOI/Alphabet equity views, and claims tables in all six themes at phone and desktop widths. All 2,018 measured cell boxes retained their text and geometry. Forty-five of 47 paginated pages were pixel-identical; two differed only in rounded table corners at document page boundaries. Two additional continuous-height before/after pairs were pixel-identical, isolating that document-fragmentation artifact. Ordinary phone/desktop views, source and forecast tables, both claims contexts and all six phone themes were visually inspected. An initial row-font mismatch was corrected and all affected previews rerendered before completion.

The renderer substitutes form-control frames, flattens responsive CSS and paginates a continuous website. Existing wide numerical tables retain their horizontal-scroll containers; these static previews cannot operate them. They are not browser screenshots, keyboard/touch tests, browser-zoom tests or accessibility-tree/speech verification. The known local-browser restriction and private-site owner sign-in gate were not bypassed.

## 2026-10-17, 15:42 UTC · Keep units and help with both assumption controls

### Question and evidence

Do the number field and its paired slider expose the same unit and explanation when navigating by control?

The number fields already referenced their nearby helper text. Their paired sliders had descriptive names but no helper-text association. The visible %, × and m suffixes were separate spans, outside either control's programmatic description; some help text explained the concept without stating the entry unit. This was a source-markup gap, not an observed screen-reader failure or a measured user error.

### New lessons read

- [Google web.dev, Forms](https://web.dev/learn/accessibility/forms). Read the complete written lesson: Fields, Labels, Descriptions, Errors and Additional success criteria, including displayed code examples. Page last updated January 10, 2023. Applied preserving native inputs and visible labels while connecting supplementary instructions through an accessible description. Personal-data autocomplete examples are unrelated to these financial assumptions and were not adopted.
- [W3C WAI, Form Instructions](https://www.w3.org/WAI/tutorials/forms/instructions/). Read the complete written tutorial: overall and inline instructions, instructions inside and outside labels, aria-labelledby, aria-describedby, placeholder text and styling, including displayed examples and code. Page updated May 13, 2024. Applied retaining the existing label and associating nearby explanatory text with each control rather than replacing the label or adding a placeholder.

Read on October 17, 2026. Embedded CodePens and live form examples were not operated, and linked techniques were not separately studied. No video viewing, interactive exercise, full-course completion or accessibility certification is claimed.

### One bounded change

Point each of the nine assumption sliders to the same existing helper text as its paired number field. Prefix that helper with a short, visually hidden unit description: Percent, Times, or the selected source currency followed by millions. The prefix reuses the established screen-reader text treatment. Both USD and TWD source baselines retain their own currency context.

The visible labels, unit suffixes, helper wording, layout, themes and values remain unchanged. Native number and range controls retain their names, bounds, steps, decimal input mode and synchronization. No new focus stop, live region, acknowledgement or editing step is added. Calculation, simulation, data, research cases, saved inputs and historical freezes are unchanged, including AAOI/Alphabet treatments and histories beside assumptions.

### Checks and limitations

All 424 automated checks passed, including four new regressions; the baseline passed 420. The new checks cover 315 number/slider pairs across all 35 company-baseline combinations, unique description targets, explicit units, existing visible help and labels, unchanged native control attributes, typing and slider synchronization, input/focus stability, category navigation, saved edits, invalid recovery and source/model withholding. They verify source and minimal-DOM relationships, not actual speech output.

Seventeen before/after static-preview pairs cover full pages at 320, 390 and 1440px, AAOI/Alphabet equity pages at 390px, and the three unit types together at 320/1440px in all six themes. All 24 rendered pages were pixel-identical before and after. The three ordinary full-page comparisons and all six phone-theme components were visually inspected. These document-renderer approximations substitute form-control frames and flatten responsive CSS; they cannot establish native keyboard, touch, accessibility-tree or screen-reader behavior. The known browser restriction and private-site owner sign-in gate were not bypassed.

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


## 17 October 2026 · Reviewed defaults with recoverable annual editing

The latest user instruction is to make default values reflect the completed company research. Fresh entry therefore opens the annual research cases, while the earlier scalar Studio retains its own saved work. A visible explanation distinguishes direct annual investment and company-specific margin timing from the old four-driver model. Research judgments, actual evidence and management outlook link to separately labeled sections.

Primary design references read for this cycle:
- [W3C WAI Tables Tutorial](https://www.w3.org/WAI/tutorials/tables/): native captions and row/column headers preserve context in wide financial tables. Annual numeric controls have explicit year-and-field accessible names.
- [W3C Understanding Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html): repeated company, Load, Undo and export actions keep stable wording and behavior. New research is identified explicitly rather than silently repurposing legacy controls.
- [W3C Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): surrounding content reflows into one column on phones; genuinely two-dimensional annual tables retain a bounded, keyboard-focusable horizontal scroller with an explicit instruction.

Concrete choices: signed operating value is primary, dated equity allocation is secondary, and source dates sit beside both. Terminal transitions receive visible warnings. Claims controls, annual arithmetic and detailed methods are disclosures, with no mandatory confirmation checkboxes. Editing refreshes results without replacing the input node. Incomplete equity or timing does not hide valid operating EV. Malformed saved work is retained exactly and cannot be overwritten by a notes edit; deliberate recovery Load has byte-preserving Undo.

Verification: independent numerical/source/claims tests and a minimal-DOM interaction fixture cover all 14 cases. Static document-renderer previews cover AAPL at 320/390/1440px plus GOOG, LITE, NBIS and native-TWD TSM on narrow screens. These are layout approximations, not browser screenshots; horizontal scrolling, native selection, touch and screen-reader output still need authenticated browser validation. No denied browser route was retried or bypassed. The served design notebook is regenerated from this study and the release change log; original financial source captures and historical research freezes remain unchanged.

The same release incorporates the user’s direct feedback on growth controls and simulation discoverability: Years 1–5 are visibly grouped, growth duration no longer implicitly delays profitability in new flexible profiles, and Monte Carlo parameters, relationships and run settings have visible tabs. The annual model defaults every distribution to Fixed rather than implying research-calibrated uncertainty. An explicit playback button animates completed sampled outcomes; it is distinct from running the simulation. Existing schema-1 saved calculations retain their exact behavior until a deliberate growth edit.

Final integration review also wrapped the six navigation destinations at narrow widths so none depend on a hidden scrollbar. Annual and scalar Monte Carlo controls have separate ID namespaces; label and ARIA references remain within the intended workspace. Additional 320/390px component approximations cover annual distribution hyperparameters, relationship policy, sampling/seed settings and signed negative EV. Renderer-only substitutes for native selectors, range controls and grid layout are disclosed; they are not an interactive-browser test.
