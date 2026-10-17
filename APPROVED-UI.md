# Approved Valuation Lab interface

Implemented from the user-approved design handoff dated 17 October 2026: `START-HERE.txt`, `approved-source.html`, `approved-preview.html`, and the Growth, Profitability and Valuation range reference screenshots. Preview financial numbers were fixtures and were not copied into a production model.

## Design system

- Default appearance: ivory page `#f8f7f2`, editable surface `#fffefa`, ink `#203c3d`, secondary text `#647371`, teal `#32786b`, soft fill `#eaf0e9`, divider `#dce2dc`, history/fade `#a8bbb0` and strong history `#718d7d`.
- Dark counterpart: `#142024`, `#1b2b2f`, `#e9f1ec`, `#a5b8b2`, `#8dcdbb`, `#263d36`, `#344a48`, `#637f72`, and `#9db7a8` respectively. The four other saved palettes retain their semantic identities. The stored `slate` identifier now displays as “Ivory & Teal”; no saved financial data is migrated.
- Exact Instrument Serif and DM Sans files are self-hosted in `dist/fonts/`, with their OFL licenses and upstream provenance manifest. UI font fallback remains available while files load.
- Compact horizontal global navigation, separate valuation-mode navigation, editorial headings, thin dividers and restrained rounding. Guided editing uses approximately 58% assumptions / 42% read-only context. Numeric fields stay compact, with 38px desktop entry height.
- Interactive boundaries use the stronger semantic control color rather than pale structural dividers. Small labels keep the approved secondary text color on the page; notices and small text on the soft fill use primary ink for contrast. Pale bars have visible values and an additional darker boundary where needed.

## Capability destinations

| Level | Destinations retained |
| --- | --- |
| Global | Studio; Research; Learn |
| Studio modes | Guided valuation (`#current`); Annual model (`#renewed`); Historical (`#workbench`) |
| Guided assumptions | Growth; Profitability; Investment; Risk; Equity; Story; Sources; Details |
| Guided output views | Assumptions with reported history; Forecast; Valuation range; Annual tables |
| Annual inputs | Annual path/year selector; terminal assumptions; claims; timing; notes |
| Annual outputs | Forecast; Valuation range; Annual tables |
| Research | Research library/experiments (`#history`); Sources & imports (`#data`); original dossiers and filing links |
| Learn | Existing lessons, explainers and exercises (`#learn`) |

Full company research loading, earlier Guided input loading, operating-only reload, all existing Undo workflows, source inspections, claims choices, source/period/company selection, historical locks, imported data, quote comparisons, simulation controls/seed/count/relationships, replay/pause/resume, exact tables and JSON exports remain reachable. Navigation labels do not change their route, saved-draft or data identity. Independent historical experiments stay isolated from current-company sources.

## Charts and model separation

`approved-charts.js` is presentation only. Growth reads actual annual calculation rows from year 1 through the model's stable-growth endpoint. The engine's selected horizon and stable rate determine the endpoint; three-/five-year annual, maintained, immediate, legacy and staged paths stay distinct. Rows after growth maturity can still be present in the complete cash-flow tables when margin or capital matures later.

Each growth year has a stable keyed DOM node, visible value, year label and category. Horizon changes retain shared years, inserting/removing only the necessary endpoints. A common signed scale and zero baseline apply across all sequential responsive rows. Invalid inputs withhold the chart instead of displaying an old path as current. Read-only history shows actual fiscal dates and original source links. Actual row-level comparability notes, range exclusions, predecessor/recast/accounting-basis explanations and coverage shortfalls stay visible beside the condensed history; TTM comparisons are explicitly separate from annual observations.

The profitability illustration divides the actual final forecast row's EBIT and NOPAT by its revenue. It is operating profit and profit after cash tax per 100 revenue, before reinvestment and financing, not free cash flow. Both positive and negative bars use a real zero baseline.

The input uncertainty visualization uses the sampler's normalized distribution-summary density. Its keyed bars update without resetting from zero. Input shape and output histogram remain distinct. Existing run cancellation, stale/previous-result warnings, pending/failed/invalid states, disabled stale exports, accepted/excluded counts, unit basis, exact values and seeded calculations are retained. The optional six-second replay remains a separate action.

## Motion and accessibility

- Data bars: 460ms `cubic-bezier(.22,.75,.2,1)`, starting from currently displayed geometry when interrupted.
- Tab underline: 320ms `cubic-bezier(.2,.8,.2,1)`.
- Panel entry: 240ms, opacity plus 6px translation. Existing short result-only feedback remains bounded and interruptible.
- Surface feedback: approximately 150–160ms.
- Reduced motion immediately shows final values and disables nonessential transitions/replay. No decorative loops, 3D scene, scroll hijacking or oversized animation spacers were introduced.
- Existing tab keyboard navigation, read-only evidence focus/return, Escape close, disclosures and original input nodes remain in use. Source/evidence panels retain their existing nonmodal interaction contract.

Written guidance consulted 17 October 2026: [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). Ordinary content is designed to reflow at 320 CSS pixels without information loss or two-axis reading. A table exception is local to genuinely tabular content, not permission for page-wide overflow. Here existing narrow-table labeled groups are retained. Inputs stack before history; growth years wrap sequentially on a common scale. No course/video completion is claimed.

## Verification and limits

Automated coverage includes actual application handlers under synthetic DOM fixtures, complete model-year mapping, keyed chart identity across edits/horizon changes, signed and invalid inputs, history provenance, normalized distribution updates, six appearances, focus/Undo/source-preservation contracts, and existing simulation stale-state tests. Domain model and research source files are outside this change.

The supplied screenshots were visually inspected before implementation. New local review images are source-driven static approximations produced with WeasyPrint, not browser screenshots. CSS-grid, SVG and native-control support differs in that renderer. Native browser layout, actual painted interpolation, 200% zoom, native touch, screen-reader behavior and a short interaction recording remain unverified because the allowed browser route could not reach the local preview and the existing local-browser restriction was not bypassed. Do not label static images or synthetic tests as native-browser proof.

Final full independent run: 834 tests, 832 passed, one known raw-cache rebuild failure and one existing raw-cache skip. The failure is the AAOI source-rebuilding test, whose external raw capture is absent from this restored workspace. The assertion was not weakened or skipped by this redesign. The other checks passed, including a 140-state Growth mapping review. Exact deterministic and seeded numerical captures remain byte-identical across 14 Annual companies, 14 Guided companies and 10 Historical cases. Of 108 baseline protected files, 107 model/data/research files are unchanged; the sole intentional documentation exception is the regenerated design notebook. Native browser verification remains outstanding as described above.

The final full run includes the helper-node preservation and final-forecast-year caption corrections. All 11 approved-design checks pass, including repeated timing edits, node/focus identity, description linkage and caption wording; the description suite verifies all 315 original input/slider pairs.
