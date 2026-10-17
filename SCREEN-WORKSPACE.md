# Continuous-page workspace

## Workflow

The Studio uses a compact navigation rail, one company/model/period toolbar, a persistent valuation summary, an in-place visualization area and a contextual editor. Result, Simulation and Tables/Annual schedule reuse that central area. The simulation’s uncertainty editor is beside its distribution and explicitly separate from the base-case inputs.

Guided keeps all eight assumption groups mounted. Switching a category, visual view or evidence panel does not replace its input nodes or reset unsaved text. Margin, its independent maturity control and cash taxes are together; historical charts and source rationale are available directly beside the input. Annual keeps the exact schedule cells mounted in a dedicated full-width view and offers synchronized per-year controls for revenue/growth, margin/tax, investment/WACC. Editing annual growth changes that year’s revenue level only, as clearly described; it does not silently apply a scalar growth model.

Historical keeps the original controls, handlers and result targets by DOM identity while arranging its charts, sensitivity, claims bridge and full-width table into in-place views. Original fieldsets and saved-case behavior are retained. Research and Learn remain readable, bounded documents in the same visual system.

## Evidence and state

Guided’s history column is visible by default beside the original inputs. Each assumption group selects a meaningful company record; all available annual observations for the selected metric are visible. Secondary measures stay available under Related historical comparisons; when no primary company metric exists, the first relevant context series remains visible. Risk starts with dated WACC components, since there is no observed company-WACC history. Stable growth has economic references and explicitly separate annual growth context. Historical ROIC remains a clearly named book-capital proxy, never an implied forecast. Missing observations, filing dates, fiscal/TTM differences and comparability warnings are retained.

View history selects a metric directly in that permanent column. Focusing or editing an assumption selects its related context without moving keyboard focus or scrolling. Selection is remembered per company, source and group through ordinary result refreshes; the current comparison updates without replacing the evidence rows. Company/source/cutoff changes rebuild the correct dated evidence. Why this assumption and Sources & comparability remain optional contextual views, with original source nodes moved and restored rather than cloned. Same-field edits keep their sources open; selecting a different assumption replaces the context without requiring Close. Close/Escape remain available for supplementary evidence.

Annual and Historical evidence no longer hides or makes inputs inert. The desktop value summary remains visible above the editor/evidence row; mobile inputs precede evidence in whole-page flow. Annual dynamically regenerated result evidence refreshes quietly while editing, preserving focus and disclosure choices. No passive refresh replays evidence entry, restores an old page position, or sends focus to Close. Route changes still release a departing contextual view.

Base-case edits and uncertainty settings remain separate. Complete research loading retains the v26 all-company presets, explicit Annual destination, exact full-load Undo, version/date/source rationale and saved-draft protection. A separate Undo edit restores the preceding input edit session. Starting-case value feedback still names its comparison basis and is a model change, not an investment return.

## Geometry and accessibility

The whole application now uses ordinary document scrolling at every width and height. Guided, Annual, Historical, Simulation, Research, Sources and Learn have no independently scrolling subsection. The old fixed workspace/summary heights, max-height reading traps, nested `overflow:auto`, scrollbar gutters, hidden scrollbars and page clipping have been removed. The desktop navigation rail remains fixed; the result summary can stick within its column on larger screens without setting a fixed height. On phones and short windows, summaries remain in natural flow and only the compact mobile navigation sticks.

Exact tables fit the available width. At narrow widths their existing rows become labeled two-column groups, and evidence tables use that layout in the side column. `document-flow.js` annotates the original cells with their column labels and explicit table/row/header roles; it never clones input nodes or changes exact values. Native captions and row/column scopes remain. Long notes expand into the page, including saved notes revealed in a tab and on viewport resize. There is no separate horizontal table pan.

Phone navigation keeps Result / Inputs / Evidence, with comfortable controls and visible focus. Inputs stay mounted when sections change. Body text is 16px, supporting text is generally 13–14px, and inputs/data use tabular numerals. Existing six themes remain selectable. The browser's ordinary page-scrollbar behavior is unchanged.

## Motion

The old mostly opacity-only 180–200 ms transitions were too subtle. Actual view and assumption-tab handlers now use 280 ms opacity plus 8px vertical travel. Tab underlines draw in over 280 ms. Evidence entry and replacement use the same noticeable motion. Selecting an unchanged tab does not replay an entrance; input nodes and model state update synchronously.

Guided and Annual input edits animate only the newly rendered result number/summary and chart with a bounded 280 ms, 4px feedback transition. Historical result updates also receive local feedback. Typing never re-enters the input panel. New navigation cancels departed animations; identity-guarded completion callbacks cannot delete or alter newer animations. Route departure, hidden-document state and live reduced-motion preference changes cancel motion. Reduced motion also disables CSS underline transitions. The Monte Carlo chart's established 280 ms update and optional six-second representative Replay are unchanged.

## Reference and scope

The user supplied [Belgrade Arbor](https://belgradearbor.rs/en) as a composition/navigation reference. Its public page was read on 17 October 2026: concise named destinations, numbered sections and a clear primary action informed this workspace’s editorial hierarchy. The accessible text is evidence of information structure, not proof of its typography, visual transitions or motion performance. No 3D scene, cinematic simulation or external asset was copied.

No financial engine, original research capture, frozen scenario, source annual row, claim rule, growth/margin/capital calculation, Monte Carlo sampling policy or existing storage namespace is changed by this redesign.

## Verification boundary

The final suite includes the previous 800 checks plus 19 focused natural-flow and motion checks. An independent comparison found no changes in 81 protected app, financial-engine, sampling and original data files against v27. JavaScript syntax checks and `git diff --check` pass.

Automated tests exercise shipped handlers with synthetic DOM/WAAPI fixtures: original input identity and focus, immediate exact values, no duplicate saved edits, complete research loading and Undo, 280 ms translated panel/result motion, interruption races, reduced-motion switching, dynamic table labels and native header relationships, textarea reveal/resize growth, and first/repeated evidence visibility plus document-position restoration. All existing numerical/source tests remain mandatory. These tests establish code and lifecycle contracts, not actual browser painting or computed page geometry.

Before/after images are static document-renderer approximations at the requested content sizes and phone widths. Renderer substitutions for native inputs, unsupported viewport units, SVG variables and print-only layout differences are documented with those files. Earlier Simulation static rendering failed with an internal grid-layout exception; a missing or failed preview is never represented as a successful render. They are not browser screenshots and cannot establish actual page scroll extent, native focus behavior, screen-reader output, touch interaction, animation responsiveness or 200% browser zoom. Browser execution remained blocked by the existing denied route; no denied action was retried or bypassed. A genuine interaction recording has therefore not been produced. That remains an explicit delivery limitation, not a passed acceptance criterion.


## 17 October 2026 · Evidence editing correction

Read on 17 October 2026: [W3C On Focus](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html), [W3C Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), and [WHATWG inert subtrees](https://html.spec.whatwg.org/multipage/interaction.html#inert-subtrees). These informed retaining meaningful keyboard order, updating adjacent content without moving focus, and removing inert from usable nonmodal controls. This is implementation rationale, not a claim of accessibility conformance.

The new handler regressions exercise every company/group’s complete row count, repeated metric/source switches, same-field edits with sources open, other-field editing, sliders, keyboard focus, category/view changes, company/source/cutoff invalidation, missing-history recovery, and original-node identity. Existing numerical/source assertions remain mandatory. Native browser layout, touch, painted transitions, screen-reader output and interaction recording are still unverified under the existing browser restriction.
