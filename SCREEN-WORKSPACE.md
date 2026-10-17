# Screen workspace redesign

## Workflow

The desktop Studio now uses a compact navigation rail, one company/model/period toolbar, a persistent valuation summary, an in-place visualization area and a contextual editor. Result, Simulation and Tables/Annual schedule reuse that central area. The simulation’s uncertainty editor is beside its distribution and explicitly separate from the base-case inputs.

Guided keeps all eight assumption groups mounted. Switching a category, visual view or evidence panel does not replace its input nodes or reset unsaved text. Margin, its independent maturity control and cash taxes are together; historical charts and source rationale are available directly beside the input. Annual keeps the exact schedule cells mounted in a dedicated full-width view and offers synchronized per-year controls for revenue/growth, margin/tax, investment/WACC. Editing annual growth changes that year’s revenue level only, as clearly described; it does not silently apply a scalar growth model.

Historical keeps the original controls, handlers and result targets by DOM identity while arranging its charts, sensitivity, claims bridge and full-width table into in-place views. Original fieldsets and saved-case behavior are retained. Research and Learn remain readable, bounded documents in the same visual system.

## Evidence and state

Evidence is nonmodal: the valuation stays available. One click moves the existing evidence nodes into a contextual panel without cloning, dropping event handlers, or resetting disclosure state. Close or Escape restores the source nodes, scroll positions and connected invoking control with `preventScroll`. Covered inputs become inert while the panel is open. Route changes close a departing panel without focusing the hidden workspace.

Base-case edits and uncertainty settings remain separate. Complete research loading retains the v26 all-company presets, explicit Annual destination, exact full-load Undo, version/date/source rationale and saved-draft protection. A separate Undo edit restores the preceding input edit session. Starting-case value feedback still names its comparison basis and is a model change, not an investment return.

## Geometry and accessibility

At desktop sizes above 1050px wide and 620px high, the Studio workspace occupies the viewport below the 64px model strip. Explicitly named editor, evidence, result and table panes use `overflow:auto`; document overflow is not hidden. The summary reserves a stable 210px slot (170px for Annual), including invalid states, and can scroll if exceptional disclosures require more space. This prevents an error or value change from moving adjacent controls. The target acceptance sizes are 1366 × 768 and 1440 × 900 browser content pixels.

Narrow windows, short windows and high zoom use natural document scrolling. Phone navigation offers Result / Inputs / Evidence with a persistent compact valuation. Inputs and evidence retain comfortable controls, native tab/arrow behavior and visible focus. SVG year ticks become sparse on phones while labels retain readable physical size; exact values remain in tables. Body text is 16px, supporting text is generally 13–14px, and inputs/data use tabular numerals. Existing six themes remain selectable.

## Motion

Small feedback uses 140ms transitions; view changes remain within 180–240ms; evidence uses 200/260ms transitions; chart updates retain the established 280ms transition. New actions cancel current panel animations immediately. Existing simulation cancellation, generation checks, previous-chart display, reproducible seeds and exact histogram completion are preserved. Optional representative Replay still takes six seconds, as requested in v26. Reduced-motion settings disable interface transitions and replay motion without blocking actions.

## Reference and scope

The user supplied [Belgrade Arbor](https://belgradearbor.rs/en) as a composition/navigation reference. Its public page was read on 17 October 2026: concise named destinations, numbered sections and a clear primary action informed this workspace’s editorial hierarchy. The accessible text is evidence of information structure, not proof of its typography, visual transitions or motion performance. No 3D scene, cinematic simulation or external asset was copied.

No financial engine, original research capture, frozen scenario, source annual row, claim rule, growth/margin/capital calculation, Monte Carlo sampling policy or existing storage namespace is changed by this redesign.

## Verification boundary

The final full suite passes 800/800 checks, including 46 new checks (15 Annual, 13 evidence, 9 Historical and 9 Guided/layout). An independent byte comparison found no changes in 77 protected app, financial-engine, sampling and original data files against v26; the generated design notebook is intentionally updated. Syntax checks and `git diff --check` pass.

Automated tests exercise the shipped handlers with synthetic DOM fixtures: persistent node identity, edit/reload/company isolation, full research load/Undo, individual edit Undo, exact annual editing, mobile-view restoration, evidence focus/scroll/Escape, cross-route cleanup, keyboard table navigation, stale-run cancellation and all14 company outputs. Existing numerical/source suites remain mandatory.

Before/after images are static document-renderer approximations at the requested content sizes and phone widths. Renderer substitutions for native inputs, unsupported viewport units, SVG variables and print-only layout differences are documented with those files. The static renderer could not render the Simulation workspace because of an internal grid-layout exception; that preview is not represented as a successful render. They are not browser screenshots and cannot establish actual page scroll extent, native focus behavior, screen-reader output, touch interaction, animation responsiveness or 200% browser zoom. Browser execution remained blocked by the existing denied route; no denied action was retried or bypassed. A genuine interaction recording has therefore not been produced. That remains an explicit delivery limitation, not a passed acceptance criterion.
