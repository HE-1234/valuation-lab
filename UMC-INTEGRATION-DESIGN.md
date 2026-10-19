# UMC dated operating-assets integration

## Admission and preserved source

Baseline: V81, `cf3641eaa10f6ec89c00f1447b862e717e881623`.
Research: independently reviewed UMC v1, 4,311 original-package checks and 4,059 public-safe checks, with three unavailable raw captures explicitly skipped rather than promoted to verified bytes.
The source public bundle SHA-256 is `b1759e15c3aeb3b8044f95034cb723aae24fb90ad5fe92d1d89ce3c5da3d4523`.
The original research stays frozen. Public files preserve facts, source URLs, original manifests and source-byte hashes. Eight build-machine locator transformations are recorded individually in `packaging-manifest.json`; no raw issuer HTML, PDF or full transcript is republished.

## Scope and default

UMC is the 33rd reviewed company, appended after the existing 32. It remains a June 30, 2026, ex-declared-distribution operating-assets-only model using October 19 research. All nonoperating equity investment value and circular-ownership benefits are excluded, not appraised at zero. It is not total-company fair value, a certified lower bound, a current target or a backtest.

The initial `umcPolicy` is null. A separately labeled pre-allocation business-cost path supplies lease cash and zero supplemental operating cash for operating EV; it does not select reserves, bank timing or common allocation. `current_target` remains null in successful model, bridge, case export and simulation outputs. No policy is chosen because its values are funded.

The ordinary-share count is June issued less treasury stock, 12,546.43387m. Existing issued restricted shares are included once. The example policies separately assume all 67m newly authorized shares are issued for no cash; that is not a reported issued count. Five ordinary shares represent one ADS. Conditional ordinary output is TWD; its separately labeled ADS illustration uses June 30 FX of 31.837 TWD per USD. No later financing or cancellation is rolled into this June anchor.

## Actual engine and editable mapping

`umc-financial-engine.js` independently ports every replay component. It preserves deposit, dividend, tax, contract, refund and legacy provision reserves, actual domestic principal buckets, one bank-principal reserve/payment treatment, the Novatek redemption, delayed time-deposit recovery, cash interest and lease normalization. It rejects portfolio addbacks, circular denominator reductions, unsupported funding fields, malformed arrays and nonfinite inputs.

The generic annual row retains editable revenue, pre-lease operating margin, cash tax rate, net investment and WACC. Nonlease D&A is separately editable as ten explicit values. At each calculation:

- Incremental working capital = 25% × revenue change from the previous period. Year one's anchor is twice H1 revenue, not TTM or a reported fiscal year.
- Implied cash capex = edited net investment + nonlease D&A − working-capital change − selected supplemental operating cash.
- Cash capex and nonlease D&A must be nonnegative; the app does not invent an additional investment floor.
- EBIT = revenue × pre-lease margin − selected total rental-equivalent lease cash.
- Cash tax = max(0, EBIT) × selected rate; FCFF = EBIT − cash tax − net investment.
- Policy supplemental-cash and D&A controls adjust net investment by the same component delta to preserve implied capex when the prior and new inputs are valid. Invalid input remains invalid and never becomes zero.
- Terminal FCFF is the lower of lease-normalized ROIC-based FCFF and final-year FCFF grown by terminal growth. Annual WACCs compound, while terminal WACC is separately editable.

Both upfront-bank policies withhold conditional per-share outputs. The staged policy produces approximately USD 3.336462 / 8.791089 / 15.237720 per ADS for bear/base/bull. Annual liquidity is not proof of daily or jurisdiction-specific solvency. Unfunded mathematical per-share values are not exported as available valuations.

Policy selection, explicit clearing, scalar/array edits, named scenarios and D&A changes use the existing Undo and local-storage machinery. Malformed saved drafts are retained for export; malformed policies remain recoverable through the visible explicit policy controls. Ordinary source/horizon recovery retains an existing selected policy, while the complete prior state remains available through Undo.

## Simulation and presentation

Simulation remains manual. Initial uncertainty settings are fixed and uncalibrated. Each trial calls the same annual engine, retains the terminal cap and rejects negative implied cash capex. It offers operating EV only; equity, ordinary-share and ADS distributions are withheld even when a deterministic selected policy passes funding. No current-target or calibrated-probability claim is made.

All authored controls and scope statements have English and Simplified Chinese labels. New message keys are appended after the prior 32 companies' keys. Ten-year original-as-filed historical references sit beside growth, profitability and capital assumptions; IFRS, acquisition and presentation breaks are explicit, and original/latest-comparative datasets plus field-level provenance remain linked.

The existing Claude interface and all CSS assets remain byte-identical. No confirmation checkboxes were introduced. Static desktop/mobile render files are layout approximations, not browser interaction, native touch or accessibility verification.

## Verification boundaries

Focused verification includes source hash and actual shipped fetch-envelope equality, all 33 companies through real file-backed startup, nine research policy/scenario outcomes, independently computed edited paths, malformed draft/policy/DA handling, actual visible Undo, export and company-switch behavior, manual EV-only simulation, EN/Chinese labels, prior 32 exact results and strict whole-production reversal to immutable V81 Git objects.

Full aggregate testing and publication are owned by the coordinating parent. No aggregate, canonical edit, publish, push, account, key or access change is performed by this integration worker without separate coordination.
