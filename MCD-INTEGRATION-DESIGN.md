# McDonald's dated operating research integration

## Frozen source and admission

Final staging base: exact V85 commit `623c06999d68a162202db636dc230dc88dc68866`. The narrow MCD overlay was rebased from `4757366`, through V84, without conflicts. All separately approved UI and header-repair bytes remain identical to V85.

The source is the independently rechecked MCD v2 public archive, SHA-256 `18cf7498dd23a41a1357742c25addbf20bd07ed8947a365e4ccd18d41925a929`. The copied source payload remains byte-identical. The separate `INDEPENDENT-RECHECK-v2.md` supplies completed approval; the frozen author readiness file correctly remains as it was at packaging. The new registry is a strict, actual-fetched envelope in addition to the immutable source files.

Admission is limited to dated operating research and explicitly conditional arithmetic. It does not certify current equity, current upside, funding, a lower bound or an ex-ante June investment view. The information cutoff is October 19, 2026; capital and discount origin are June 30, 2026. September NEXT information is explicitly later than that origin.

MCD common-stock identity is confirmed by the issuer June Form 10-Q cover. Public Robinhood buying/selling support was checked on October 19. The narrow evidence is retained separately; no broker quote was imported into the model. Removing the sole appended MCD catalog entry reconstructs the previous catalog bytes exactly.

## Engine and annual editor

The pure engine independently ports the reviewed Python replay. It reproduces 33 forecast rows across bear/base/bull, 20 rate/growth sensitivities and nine conditional allocations within floating-point tolerance.

There are 11 entered rows: H2 2026 followed by FY2027–2036, spanning 10.5 discount years. H2 is reconciled against observed H1 revenue, contribution, D&A, capex and the $98m restructuring charge. No observed H1 cash flow is valued again. Each annual WACC compounds over its period length, first 0.5 years and then one year per row.

Revenue growth, editing and simulation use reconstructed full FY2026 revenue (H1 actual plus forecast H2) against FY2025, then full years. FCFF growth is unavailable for the H2 row and the immediately following full year; it starts at FY2028. It never compares a half year's FCFF to a full year as an annual growth rate.

Annual controls edit period revenue, core EBIT margin, normalized cash tax, total net investment and WACC. Source business components stay visible. Total net-investment edits reconcile as explicit analyst adjustments to cash capex; sourced D&A, finance-asset additions, NEXT support and working-capital methodology are not silently rewritten. The residual cash capex cannot become negative or reverse observed H1 capex. Forecast-source and derived row values are separately identified.

Terminal margin is normalized before finite NEXT rent relief. The terminal calculation removes finite support after 2036 and uses g/ROIC economic reinvestment exactly once. Generic horizon extension and capital normalization are unavailable for this fixed model. Annual and terminal margin edits remain explicit independent assumptions.

## Lease, affiliate and award policy

Operating leases remain operating expenses, with no second operating-lease claim or ROU asset addition. Finance-asset investment is charged in FCFF. Existing finance claims must be explicit because the June finance split is unknown. Corporate real estate is already supporting modeled operations and is never stacked on top.

Affiliate royalty rights remain in operating EV. Affiliate ownership earnings are excluded, and any optional ownership value must exclude those royalty rights. Full recurring SBC economic cost remains in SGA. Incremental existing-award claims must exclude future compensation cash replacement.

`mcdPolicy` starts null. Six unknown amounts are never zero-filled: finance claims, affiliate equity, other assets, operating cash reserve, incremental existing awards and other claims. Users can select one of three separately labeled illustrations or start with six blanks and enter their own values. There are no confirmation checkboxes or typed-rationale gates. The explicit policy includes the model's published non-overlap convention; this is not a claim-completeness certification.

A reserve greater than available cash remains a deduction. Nonpositive operating, terminal or common equity suppresses per-share output. Exact June common shares are 707,641,531; no automatic future buyback or share-count shrinkage is introduced. Current target and upside remain null, and funding certification remains false, including in exports and simulations.

## UI, localization and lifecycle

The existing interface, tabs and six themes are preserved. MCD additions use existing research-card, table, button and precision-input conventions. Ten-year reported revenue, profitability and capital history is placed beside the corresponding annual input groups. Latest-filed comparisons, accounting/refranchising breaks and GAAP-versus-core distinctions are explicit. Original facts and field provenance remain linked.

MCD English/Simplified Chinese messages are appended after all existing message keys. Policy selection, clearing, inputs, scenario loads, JSON restore, exports and Undo use the existing state machinery. Malformed saved drafts remain exportable and recoverable; invalid input does not become zero.

Monte Carlo is manual and operating-EV only. The actual annual engine is used in every trial. Claim values are not jointly sampled, so a deterministic conditional illustration never enables a common-share distribution. Initial uncertainty is fixed and uncalibrated. Existing seed, trial count, reset, Undo and cancellation behavior remain in the shared simulation.

## Verification boundaries

Engine focused tests passed (15/15). Final V85 integration tests passed all ten groups, including imported-output spoof protection. Integration coverage includes actual file-backed admission, source hashes, all scenarios/policies, edited arithmetic, correct H2/year growth, invalid input, JSON round trips, visible Undo, exports and bilingual history. Strict parsed-DOM tests exercise actual shipped controls, manual Run, EV-only output, state retention and cancellation. All 18 strict DOM groups passed; expanded async reset/destroy groups then passed 2/2. These are DOM lifecycle tests, not browser-paint, native touch or accessibility certification.

Fresh independent JavaScript review passed the limited dated scope after one medium-severity import-integrity correction. Only the exact seven annual input fields and five terminal fields are admitted; computed row outputs cannot be overwritten by saved/imported metadata. Sixteen spoof cases were independently checked. Independent replay covered 120 Python/JavaScript scenarios, 1,320 forecast rows and 52,800 numeric comparisons, with maximum relative error 2.1e-14. Seven additional financial groups and independent English/Simplified Chinese DOM checks passed. Current target and funding certification remain unapproved.

Aggregate testing, final cross-company preservation, visual verification and any canonical integration/publication remain parent-coordinated. This worker does not push, publish or alter the canonical tree.

## Final baseline preservation

The exact V85 baseline contains 849 production files. MCD adds 41 files and changes only 13; the resulting 890-file tree is verified against immutable Git blob IDs, exact reviewed addition hashes and executable modes. Removing the sole MCD catalog entry reconstructs the prior catalog bytes exactly. Every published fixture remains byte-identical.

A new prior-33 fixture was captured from a clean archive of `623c06999d68a162202db636dc230dc88dc68866`, never from the candidate. All 33 companies retain default, edited, restored and seeded financial outputs, English/Simplified Chinese result output and existing locale identities. The 64-check preservation sweep passed after updating three historical snapshot subsets to explicitly exclude the newly added MCD; none of their golden fixtures changed. The final focused rerun passed 19/19 (nine legacy-preservation checks and ten MCD integration checks).

The separate UI/header files remain exact V85 bytes. The only production difference from the independent review's 890-file freeze is the separately approved one-line V85 header CSS repair. The MCD financial/source files reviewed independently are unchanged. Combined-candidate aggregate testing and native visual verification remain parent-owned.
