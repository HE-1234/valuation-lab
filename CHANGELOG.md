# Change log

## 2026-10-17, 19:49 UTC · Keep focus while switching renewed companies

- Restored focus once to the renewed annual workspace's Company selector after its explicit selection event rebuilds the page, with automatic scrolling prevented.
- Kept that restoration out of initial mounting, live edits, programmatic navigation, Load, Undo and other ordinary renders. Invalid saved-draft recovery keeps a usable selector and preserves the original bytes.
- Preserved all visible markup, six themes, financial calculations, source data, annual paths, simulation, saved drafts, explicit unknowns and private access.
- Recorded newly read W3C keyboard-interface and WHATWG focus-management guidance with exact scope and verification limits.

Validation: all 691 tests pass, including five new regressions. Before/after DOM, displayed results and saved drafts are identical across 22 states, excluding save timestamps. All 14 generated workspace inputs are identical; nine static-preview pairs cover 320/390/1440px and all six themes, with all 16 paired rendered pages pixel-identical. Native browser, select-popup, touch and screen-reader behavior remain unverified. No launch restriction or sign-in gate was bypassed, and no publication or sharing change is included.

## 2026-10-17 · Renewed annual-research defaults

- Fresh entry opens the reviewed annual research workspace for all 14 companies, with adjacent dossier conclusions and source/guidance/management links. The previous scalar Studio remains available and its saved drafts are preserved.
- Added a separately versioned direct-investment FCFF model, retaining all 160 authoritative annual rows, 10/15-year horizons, signed operating values and explicit actual-versus-forecast anchors. MU’s investment continues in declining-revenue years.
- Added source-dated capital allocation scenarios: 11 conditional common-allocation proxies, LITE’s explicit convertible-premium input, and separate operating-only gates for the new AAOI/NBIS year-end cases. The prior AAOI June source-date model remains directly reachable.
- Exposed dated cash/investment/debt/lease/award assumptions and verified Tesla’s current-plus-noncurrent debt correction in the new layer, without changing original filing captures.
- Kept October timing unresolved unless an elapsed or remaining FCFF stub is explicitly entered and explained. Original forecast-origin values remain available. No missing stub or claim is silently set to zero.
- Preserved the ten original terminal-transition warnings and added a separate, reversible three-year capital-normalization sensitivity. No stock price was used to fit any case.
- Added full local draft/export recovery, explicit Load and Undo, live annual/terminal/claims editing, and storage-unavailable fallback. New annual Monte Carlo starts with all distributions Fixed and exposes an explicit fixed-absolute-versus-revenue-scaled investment policy. Parameter distributions, relationships, sample count and seed are visible; falling-ball playback has its own button. The legacy simulator remains available. Uncertainty Reset has one-step Undo, including exact restoration of malformed saved settings.
- Separated flexible Studio revenue-growth duration from margin/capital timing in schema 2. Untouched schema-1 saved valuations remain exact; explicit growth edits upgrade deliberately. Grouped Years 1–5 visibly and replaced implementation-heavy growth labels.
- Packaged all 14 dossiers, 320 source records and 70 management assessments with reading-scope distinctions, 21 sanitized files, verified local links and source fingerprints.

Validation: the combined suite passes 675 tests, including independent annual-simulation and actual-workspace reset/Undo/reload checks. Original financial/history pins, signed values, source-date bridge gates and seeded legacy goldens pass. Static 320/390/1440px document-renderer previews were inspected. Native authenticated browser, touch and screen-reader behavior remain unverified; prior launch/auth restrictions were not bypassed. No push, deployment or sharing change is part of this local implementation.

## 2026-10-17, 17:42 UTC · Retain the initiating growth-path selector

- Restored focus to AAOI's Operating path selector after changing it, across all eight assumption categories. The Growth category's separate pattern selector retains its existing focus behavior.
- Used one focus restoration with automatic scrolling prevented. No new control, step, layout, label or theme change.
- Preserved every financial calculation, source, researched case, frozen history, simulation, saved input and Undo behavior.
- Recorded new W3C input/focus guidance, the precise source finding and verification limits in the design notebook.

Validation: all 490 tests pass, including three new regressions covering 24 AAOI path/category combinations, 85 pattern changes across 14 companies, annual edits, invalid recovery, maturity Undo and persistence. Before/after DOM, result and saved-state comparisons are identical across 24 AAOI states, excluding save timestamps. All 24 static-input files and both stylesheets are unchanged; paired 320/390/1440px previews are pixel-identical across four rendered pages. These are minimal-DOM and document-renderer checks; native browser, select-popup, touch and screen-reader behavior remain unverified.


## 2026-10-17, 17:18 UTC · Explicit early growth and flexible maturity

- Added opt-in current-company paths: immediate fade, maintained growth for 3/5 years, or explicit annual growth for 3/5 years; maturity is separately selectable at year 10/15/20.
- Preserved every existing default, research-case input and AAOI ten-year staged schedule. Deliberate switches expose the new path, keep scalar inputs, and offer narrowly scoped Undo.
- Synchronized flexible growth, margin and capital maturity as an explicit simplifying assumption. Capital intensity converges to the terminal reinvestment identity; WACC is explicitly constant and terminal ROIC remains independent judgment.
- Rebuilt the same annual path inside every seeded Monte Carlo trial. Explicit annual rates shift together with sampled year-one growth; invalid trials are excluded without clipping or replacement.
- Added maturity revenue, cumulative modeled net reinvestment, terminal ROIC/reinvestment and a same-scalar legacy-path comparison. Kept adjacent company history and linked an independent Alphabet audit.
- Saved flexible horizon/rates without silently changing prior work. Malformed saved scalars, normalization and profile shapes fail closed; nonfinite flexible cash flows cannot masquerade as zero equity. Research reload restores the original profile, with Undo load retained.
- Added formula/source documentation and independent oracles. No historic engine, frozen research, source financials or research defaults changed.

Validation: all 487 automated tests pass, including 38 independent mathematical/seeded-draw oracles, 14 boundary/persistence checks, six UI-handler checks and 24 complete v19 valuation/simulation goldens. Twelve static previews cover 320/390/1440px, all six themes, explicit 20-year paths, forecast tables and AAOI/Alphabet. The inspected panels show no clipping. These are document-renderer approximations; authenticated browser rendering, native touch and screen-reader behavior remain unverified. No access restriction was bypassed.


## 2026-10-17, 16:42 UTC · Name financial tables and connect their rows

- Added company-specific native captions to the current workspace's nine financial-table purposes, with caption text using the existing visually hidden treatment.
- Marked first-column labels as row headers alongside the existing column headers, preserving every displayed value, source and unit.
- Retained the previous table appearance through narrowly scoped body-header styling, including the claims tables' size and width rules.
- Recorded three newly read W3C WAI table tutorials, their exact reading scope and the source-markup rationale in the design notebook.
- Preserved all valuation mathematics, financial source data, research freezes, simulations, saved edits, adjacent histories, six themes and AAOI/Alphabet treatments.

Validation: all 429 automated checks passed, including five new regressions covering 102 table instances across all 35 baselines, exact source/forecast values, claims alternatives, invalid recovery, focus and saved drafts. Twenty-eight before/after static-preview pairs covered phone/desktop layouts and all six themes. All 2,018 measured cell boxes in the primary matrix retained their geometry. Two document-page corner differences disappeared in continuous-height comparisons. These are document-renderer approximations; real authenticated browser, native touch and screen-reader behavior remain unverified.

## 2026-10-17, 15:42 UTC · Shared units and help for assumption controls

- Linked each assumption slider to the same helper description as its paired number field.
- Added a visually hidden explicit unit prefix, including the selected USD/TWD currency for million-unit amounts.
- Preserved the visible interface, six themes, native controls, immediate editing, saved values, histories and all financial calculations and simulations.
- Recorded new web.dev and W3C forms reading with exact study and verification limits.

Validation: all 424 automated checks passed, including four new regressions covering 315 control pairs across 35 baselines, units, native attributes, editing/recovery/persistence and unchanged withholding. Seventeen static before/after pairs cover phone/desktop views, all six themes and AAOI/Alphabet; all 24 rendered pages were pixel-identical. These are document-renderer approximations; actual keyboard, touch, accessibility-tree and screen-reader output remain unverified.

## 2026-10-17, 14:42 UTC · Complete enlarged valuation headlines

- Let the valuation headline and operating-value summary wrap when enlarged text needs more space.
- Kept the currency/per-share label together, including when it moves below the amount.
- Preserved numerical precision, typography, six themes, immediate editing, source history, saved values, financial models and simulations.
- Recorded new W3C reflow/resize-text reading and the exact study scope.

Validation: all 420 automated checks passed, including four new regressions covering all 35 company-baseline combinations, editing/recovery/persistence and six-theme contrast. Twenty static before/after pairs cover 320, 390 and 1440px, doubled header text, all six themes and special-company cases. All 117 after-state header text boxes fit the panel without overlap. Normal full-page pixel differences stayed within the currency/per-share label. These document-renderer approximations do not establish native zoom, keyboard, touch or accessibility-tree behavior; those remain unverified.

## 2026-10-17, 13:42 UTC · Visible focus on the dark panel

- Applied the valuation panel's existing bright signal color to its inherited keyboard-focus outlines.
- Kept all outline sizes, offsets, layouts and interactions, with no visible change when controls are unfocused.
- Preserved immediate editing, saved values, financial calculations, simulations, adjacent histories and all six themes.
- Recorded new W3C focus/non-text-contrast reading and the exact study scope.

Validation: all 416 automated checks passed, including four new regressions. Full-strength outline contrast is at least 8.62:1 across six themes; the minimum in reviewed dimmed-control previews is 4.59:1. Fifteen static before/after pairs cover 320, 390 and 1440px, with all-theme forced-focus components at phone and desktop sizes. Unfocused full-page views were pixel-identical and 180 measured focus boxes kept their geometry. These document-renderer approximations do not establish native keyboard, touch or accessibility-tree behavior; those remain unverified.

## 2026-10-17, 12:42 UTC · Clear nested history disclosures

- Restored annual-table labels and available counts inside Sources & comparability by scoping the parent's decorative styling to its own summary.
- Kept each table's plus/minus tied to its own open state, including after closing and reopening its parent.
- Allowed annual-summary content to wrap when enlarged text needs more room, keeping the count and marker separate.
- Preserved native disclosures, immediate editing, saved inputs, adjacent source history, every calculation, simulation and all six themes.
- Recorded two newly read disclosure lessons and their exact reading scope.

Validation: all 412 automated checks passed, including five new regressions across 196 nested controls. Twenty-two before/after static-preview pairs cover phone and desktop widths, nested open/closed combinations, AAOI/Alphabet and shorter-history contexts, and normal/doubled summary text in all six themes. Initial enlarged-text crowding was repaired and rechecked; all 29 visible nested summary boxes retained readable, nonoverlapping content and at least 44px height. Closed 390/1440px views were pixel-identical. These are document-renderer approximations; native browser, touch and accessibility-tree behavior remain unverified.

## 2026-10-17, 11:42 UTC · Model issues beside the editor

- Added a compact copy of the existing model-issue explanation immediately above the assumption editor, so it remains nearby on phones.
- Kept the same validation, result explanation and existing live-announcement path. The note hides automatically when the result is valid and remains stable across category changes.
- Preserved input focus, saved edits, historical references, source gates, claims calculations, simulations and all six themes.
- Recorded newly read W3C feedback/error guidance and its exact reading scope.

Validation: all 407 automated checks passed, including six new regressions. Before/after full-page approximations were reviewed at 320, 390 and 1440px, plus all six themes with normal and doubled note text at 320px. All 18 visible after-state note boxes fit their page widths. Valid 390/1440px previews were pixel-identical. These document-renderer approximations do not establish native-browser, touch or accessibility-tree behavior; those checks remain unverified.

## 2026-10-17, 10:42 UTC · Room for equity amounts

- Widened only the Other nonoperating assets and Other claims on equity number fields using character-relative sizing.
- Let their label/input rows wrap on narrow screens, keeping the amount and its millions unit together.
- Preserved native editing, live calculations, saved values, adjacent histories, source data, simulation controls and all six themes.
- Recorded newly read GOV.UK and IBM Carbon input-design guidance and its exact reading scope.

Validation: all 401 automated checks passed, including four new input-layout and editing regressions. Before/after full-page approximations were reviewed at 320, 390 and 1440px; 14 before and 14 after component previews include all six themes and doubled field text. All 28 fields in the 14 after previews fit, contained the test amounts and retained at least 44px height. These use substituted input text frames in a document renderer; real-browser editing, zoom, touch and accessibility-tree behavior remain unverified.

## 2026-10-17, 09:42 UTC · Readable model-limit reminder

- Removed the inherited fade from the reminder below the distribution, restoring the existing text/link palette's full contrast in all six themes.
- Matched only the Limits link's focus outline to the dark-stage signal color; kept its existing outline size and offset.
- Preserved wording, font sizes, layout, disclosure behavior, saved inputs, financial calculations and all protected source data.
- Recorded two new written contrast lessons and the exact reading scope in the design notebook.

Validation: all 397 automated checks passed, including four new contrast and behavior regressions. Static before/after previews at 320, 390 and 1440px showed pixel changes only in the reminder/link area. All six themes were also reviewed at 320px in normal and forced-focus states. Calculated text contrast is at least 12.49:1; link and focus-color contrast is at least 8.62:1. These are scoped checks and document-renderer approximations, not a whole-site accessibility audit or authenticated browser tests. Real browser, native-touch and accessibility-tree verification remain unavailable.

## 2026-10-17, 08:42 UTC · Visible assumption categories

- Replaced the hidden horizontal category strip with a compact, wrapping group, making Growth through Details visible without a side swipe.
- Added a bordered selected state, 44px minimum control height and unclipped, theme-aware focus outline.
- Preserved direct category selection, existing keyboard navigation, saved category and inputs, live edits and the current simulation.
- Documented two newly read written design lessons, their exact reading scope, and the deliberate phone-height tradeoff.
- Preserved all valuation mathematics, financial source data, historical freezes, claims models, distributions and six themes.

Validation: all 393 automated checks passed, including five new navigation regressions. Static before/after previews were reviewed at 320, 390 and 1440px. Navigation-only previews checked all six themes at 320px with normal and doubled category text; all 96 control boxes remained within the page and at least 44px tall. These are document-renderer approximations with forced focus styling. Real authenticated browser, browser zoom, native-touch and accessibility-tree behavior remain unverified.

## 2026-10-17, 07:42 UTC · Financial period at a glance

- Moved the full financial-period label and original-filing link above the headline valuation, in a compact wrapping source line.
- Preserved the distinct AAOI/Alphabet capital-reference explanation and the model-limit reminder below the distribution.
- Added a descriptive source-group name and a filing-link name identifying the company and period. Numeric edits do not replace the source line.
- Recorded two new written responsive-design lessons and their exact reading scope in the design notebook.
- Preserved all valuation mathematics, source data, saved inputs, historical freezes, simulation families and themes.

Validation: all 388 automated checks passed, including five new source-context checks. Static before/after previews were inspected at 320, 390 and 1440px, with additional AAOI and ordinary-company phone views. The complete date remains above the result and within the page in each reviewed approximation. Real authenticated browser, native-touch and accessibility-tree behavior remain unverified.

## 2026-10-17 · v9 explicit AAOI and Alphabet models

- Enabled current AAOI and Alphabet valuations through source-matched capital-claims models. Missing or invalid treatment still withholds the result.
- AAOI now has a staged capacity operating profile for fresh research cases: front-loaded growth, earlier margin recovery, improving initial capital productivity and a terminal-consistent capital-intensity fade. Every Monte Carlo draw uses the same adapter. Saved linear drafts remain intact and can be compared or replaced explicitly.
- AAOI uses disclosed period-end convertible fair value, separate bank-acceptance financing and an explicit intrinsic customer-warrant approximation. Fair-value, principal-only and immediate-conversion cases are mutually exclusive. A separately labeled known-ATM/property pro forma retains an editable unknown cash-flow adjustment.
- Alphabet uses exact preferred conversion endpoints and a dated dividend PV, separately reconciled finance leases, noncontrolling interests and a gross noncurrent-investment proxy. Capped calls and investment taxes remain disclosed limitations.
- Added editable claims inputs, bridge and share-denominator tables, dividend schedule, source ledger and claim sensitivities. AAOI also shows cash-deficit diagnostics and margin/capital-productivity stresses.
- The default staged AAOI case remains at the common-equity zero floor; its raw deficit is shown. No operating assumption was fitted to a positive share price. Alphabet's conditional model is available with source-dated approximations.
- The original deterministic engine, historical files and research freezes are unchanged. All ordinary-company numerical regressions and the four editable simulation distribution families remain in scope.

Validation: all 383 automated checks passed, including independent operating/claims oracles, every-draw comparisons, invalid-state clearing, persistence, load/undo and protected historical source hashes. Phone and desktop static layouts were reviewed; numeric claim-table wrapping was repaired. Static screen approximations are not authenticated browser screenshots. Real browser, native touch and accessibility-tree behavior remain unverified.

## 2026-10-17 · v8 company cases, longer history and editable distributions

Release 8 retains the existing owner-private site and adds researched company assumptions, ten-year references where comparable data is available, and editable distribution hyperparameters.

- Expanded supported company reference histories toward ten annual periods, preserving source dates, explicit missing values and shorter comparable records.
- Replaced the five-number history strip with a source-linked latest value, a compact full-record trend and an adjacent expandable year/value table.
- Used actual fiscal period-end dates for trend spacing. Missing years and material accounting/business-basis changes interrupt the line.
- Added visible coverage and comparability explanations. A legacy-company period is not silently presented as the same operating business or folded into a misleading comparable range.
- Added distinct, dated company research assumptions for all 14 current baselines, with driver rationale, reference facts, model caveats and source links. Existing saved inputs remain intact until the visible load action is used; the load can be undone.
- Made the Micron starting EBIT normalization visible and labeled AAOI/Nebius as provisional operating hypotheses rather than validated valuations.
- Added Fixed, Triangular, Uniform and Truncated-normal controls and shape previews for each simulated driver. Custom settings persist in the saved draft, with an explicit reset to the current assumptions.
- Corrected AAOI FY2019–FY2025 reference debt to include separately disclosed convertible notes, with primary evidence; related book-capital ratios were recomputed. Frozen historical datasets and unaffected observations are unchanged.
- Added exact-snapshot claims gates where AAOI convertible debt and Alphabet preferred claims are missing from the current common-equity bridge. Unsupported values stay withheld.
- Added this readable design notebook and change log, linked from Sources.
- Preserved DCF arithmetic, current baseline data, the original triangular numerical behavior, live edits, six themes and the confirmation-free assumption workflow.

Validation: all 356 automated checks passed. Focused presentation tests cover history, all four distribution families, source links, semantic tables, saved settings, researched-case loading and Undo. Static layouts were reviewed at 320, 390 and 1440 CSS pixels; the phone rationale layout was repaired and re-reviewed before release. Static previews are document-renderer approximations, not authenticated browser screenshots. Authenticated browser, real touch and accessibility-tree behavior remain unverified because the supported browser reached the private site’s owner sign-in gate.

## 2026-10-17 · v7 evidence-first instrument

- Replaced the current eight-step workflow with a direct assumption editor beside the live conditional valuation and distribution.
- Added dated company reference history beside assumptions and explicit labels for historical proxies and contextual evidence.
- Removed numerical acceptance checkboxes and Apply/Continue actions; valid changes update immediately.
- Preserved the data, security, date, currency and model limitations that genuinely prevent calculation.
- Added visibility-triggered distribution assembly, short edit feedback, visible replay/pause/resume controls and a complete reduced-motion state.
- Kept all six themes and started fresh sessions in Slate & Blue.

Validation recorded for v7: 254 automated checks passed. Static previews were inspected at 320, 390 and 1440 CSS pixels. Authenticated browser, real touch and accessibility-tree behavior remained unverified because the supported browser reached the private site’s owner sign-in gate.

## LITE dated capital bridge review v2 · 2026-10-17

- Added the June disclosed note fair-value adjustment (6,052.9m above 1,554.3m principal) and approximately 200m capped-call asset proxy, with no duplicate note shares, coupons, conversion-request claim or historical call-premium deduction. Unchanged operating EV gives 133.8058697 USD per approximate common-equivalent share before unvalued claims.
- Made the market-claims/intrinsic-operating hybrid, June date, incomplete employee claims and fixed claims across Monte Carlo trials explicit in the primary value card and chart. Both new values have editable sensitivities.
- Preserved saved numerical claim edits and implicit/explicit unknowns. Added deliberate source-value Load and full Undo, including malformed operating-input recovery. Fresh drafts use the sourced defaults.
- Added a versioned public review/correction alongside the frozen originals. The 757.8m cumulative conversion-request total includes 519.4m already settled in FY2026; neither total nor difference is extra June debt.
- Kept AAOI/NBIS operating-only and all other renewed bridge outputs exactly unchanged. Frozen research, legacy data, scalar and historical engines are untouched.
- Validation: 686/686 tests, syntax checks and `git diff --check` pass. Fresh Chromium launch fails before page access in this executor; browser rendering remains unverified. No commit, push or deployment.
