# Annual assumption error location

19 October 2026. Isolated proposal against V73 source `8c2e14264a0568e4b741aeab60b680dc6811fa0b`. No canonical edits, publication or financial-model changes.

## Evidence and narrow design choice

The V73 review found that terminal text inputs retained malformed entries and withheld valuation globally, but did not identify the affected control. The shared input factory and handler are in `dist/research-view.js`; terminal policy is in `dist/research-model.js`, `researchDraftIssues`. A text input does not acquire numeric constraint validation from min/max attributes.

Written guidance reviewed for the 19 October design study:
- [W3C WAI: User Notification](https://www.w3.org/WAI/tutorials/forms/notifications/) supports inline explanatory feedback and programmatic association. Here stable error IDs are added to aria-describedby, preserving existing hint IDs. No live alert or focus movement is added to the per-keystroke feedback.
- [NN/G: Website Forms Usability](https://www.nngroup.com/articles/web-form-design/) supports retaining invalid authored input and providing specific repair instructions. This live analytical editor retains its exact-on-focus and two-decimal passive display; errors never rewrite values.

The inline message and dashed border supplement each other; meaning does not depend on color. Message text uses the existing ink color, wraps normally, and is kept small enough to remain secondary to the approved Annual layout. No decorative interaction or layout redesign is introduced. English and Simplified Chinese messages switch in place.

## Validation scope

Presentation-only checks mirror existing numeric policy. The financial validators and global withheld-results explanations remain authoritative and unchanged.

- Terminal: required finite inputs; growth 0–5%, positive margin through 100%, tax 0–60%, WACC at most 100%. WACC/growth and ROIC/growth relationships identify both participating controls with explicit relational text. Unrelated tax, margin and bridge fields are never marked invalid by a relational error.
- Bridge: use the company's existing option definitions for min/max and scale. Explicitly supported unknown amounts retain their existing unknown explanation; missing capital/funding evidence is not misrepresented as malformed numeric input. No model-level result error is parsed heuristically into a field error.
- Timing: valid date, supported active scenario date floor, required finite stub and explanatory reason in supported active scenarios; positive pre-origin stub rate through 100%. Blank stub is allowed at origin. Fixed AMD/MRVL/SNPS/CDNS/CRDO/SNDK/ARM timing limitations remain model-level. Changing to an unsupported later-period baseline is also a model-level condition, not a false claim that a syntactically valid date is malformed.
- No changes to current-capital, selected-year or schedule input validation, margin-path controls, case identity, model calculations, funding decisions or simulation execution.

Repair clears only this feature's invalid state and description ID, retaining pre-existing hint associations. Inputs and labels are not recreated. Error elements are not focusable and do not steal focus or announce assertively. Undo and editor keyboard navigation use the existing handlers. Simulation remains manual.

Saved-invalid drafts retain the existing recovery gate, raw saved state, export and explicit reload/Undo workflow. This change does not silently bypass identity/recovery validation to make fields editable after reload.

## Verification and limits

Focused synthetic-DOM tests cover repeated malformed/blank/out-of-domain inputs followed by repairs, exact focus/blur precision, stable input identity and focus, relational participants, bridge bounds and optional unknowns, preserved hint IDs, active/inactive timing, both languages, keyboard tab navigation, Undo and saved-invalid recovery. A source-driven static UI check verifies readable wrapping error text, non-color border treatment, no alert/focus-stealing calls, and no replacement of input values or nodes. This is not native browser, screen-reader, touch, accessibility-tree or responsive-paint verification. No browser renderer was launched.

The preservation fixture records every V73 production file hash. Only exact reviewed insertion spans in research-view.js and workspace.css are reversible; all other production bytes remain unchanged. The new reversal runs before older ARM/SNDK/CRDO/UI preservation layers. Existing financial golden fixtures and baseline pins remain unchanged. Full aggregate results and immutable overlay hashes are recorded separately in the delivery manifest.
