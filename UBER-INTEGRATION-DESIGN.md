# Uber v2 dated conditional model integration

Isolated staging only, based on commit `475736665290662d1da7f8386fa1e014147bb3b4`. No canonical source, deployment, publication, theme, font, stylesheet, core simulation-view UI, historical package or existing company model file is changed.

## Approval and source identity

The source ZIP SHA-256 is `d58a42336df8bcf034bb905b05116fc3884002c1b70e2ee6b1536ab239ca0acc`. ZIP members are copied byte-for-byte, removing only the outer ZIP directory name from their destination path. The separate `REVIEW-v2.md` is copied unchanged. Its 1,212 granular checks approve dated research and conditional source/numerical treatment, not current equity, funding, canonical admission or publication. The frozen readiness label remains unchanged; the registry explicitly records that the separate review resolves only its numerical/source-treatment gate.

The public pack is additive at `dist/data/incremental-UBER-2026-10-19-v2`. It contains no retained raw filing copies. The model uses no market quote. NYSE UBER common-stock identity was verified from the June 2026 SEC 10-Q cover, and public Robinhood buy/sell support from its UBER product page on October 19. UBER was absent from the baseline catalog; one row was appended. Public support is not individual account, jurisdiction, fractional-share or live execution certification.

## Economics and editing

The financial engine ports `replay_dcf_v2.py` and `rollforward_v2.py`. The unedited engine matches all 906 frozen numerical fields exactly, using compensated sums matching Python 3.12. June operating EVs in USD millions are bear 62,948.43709427182; base 190,602.16599572002; bull 422,727.7236448776.

June allocation starts unselected. The explicit illustration yields approximately $29.154466, $90.754044 and $202.766724 per common share, but only with its selected investment, ownership, tax, lease and claim assumptions. June money is USD millions; policy share counts are actual shares. Values are not October trading targets.

The existing annual editor is mapped transparently:

- Revenue changes proportionally scale that year's three reviewed segment bookings, preserving that year's reviewed segment mix and revenue/bookings ratios.
- A revenue EBIT margin converts to EBIT/bookings margin, retaining GAAP SBC and R&D expense.
- Edited net investment solves the residual gross asset budget after exact D&A, noninsurance working capital, reserve and collateral arithmetic. Negative residual budgets are rejected.
- Annual WACCs compound; terminal margin, tax, growth, WACC and ROIC remain editable. The terminal reinvestment floor remains in force.
- Source formula bounds, ten full July–June years and June origin are preserved. Generic horizon extension and capital normalization are unavailable.

The optional October bridge is separately edited as economic-input JSON. Every required number starts null. Unknown amounts are not inferred zero. It preserves known issue/underwriting discounts, retained-euro FX, the economic-to-actual-cash reconciliation, separate per-deal EV/cash/debt/NCI/claims and removal of the Careem value included in the selected June policy. It uses source-scenario WACC for interim accrual, explicitly separate from edited annual/terminal WACCs. Complete numerical inputs may produce a conditional October allocation, while verified-current-target fields remain null. The main annual valuation remains June-dated.

No acknowledgment checkbox, rationale or written-basis gate blocks normal edits. Optional source annotations are retained as annotations. Missing economic fields still suppress allocation; malformed values remain in saved drafts and withhold affected calculations.

## Presentation and historical comparability

English and Simplified Chinese cover all new authored UI copy. Existing controls and six themes are retained. Source-history references sit beside growth, profitability and capital controls and link to field provenance.

2016 is explicitly partial unaudited selected history with unknown CFO/capex. 2016/2017 recast revenues, principal/agent changes, acquisitions/disposals, lease changes and the 2026 segment-profit change are disclosed. Bookings are not revenue; insurance reserves and restricted collateral are not duplicated in the equity bridge. Full source material and the separate review remain linked.

## Simulation and validation

Manual Monte Carlo starts fixed and exposes operating EV only, even when June or October allocations are selected. The source formulas, residual investment validation and terminal floor apply per trial. Claims and October bridge inputs are not sampled, and no per-share distribution is offered.

Focused checks passing before independent JS review:

- 17 financial-engine groups: exact frozen rows/terminal/allocations, Python-derived synthetic October output, FX/conservation, exhaustive missing fields and adversarial numeric checks.
- 17 integration groups: actual disk-file fetch/equality/tamper failure, three source cases, edits, serialized draft restore, Undo, JSON export, malformed raw saved drafts, bilingual copy and direct EV-only simulation.
- 9 strict parsed-DOM groups: actual fetched catalog/package and explicit UBER selection, real manual Run, English/Chinese, stochastic path replay, focus, invalid values, stale output/export, reset/Undo and company switching.

The strict fixture forces catalog fetching at the workspace-mount boundary. Simply passing `catalogBundle: undefined` to the outer fixture silently reapplies its null default and selects AAPL; tests explicitly assert UBER and use boolean DOM identity checks to avoid circular-object assertion dumps. This fixture issue was corrected without altering production DOM or financial behavior.

These are numerical and parsed-DOM checks, not browser-paint or native file-picker evidence. No full aggregate suite or rendering was run in this worker. Integration with the separately approved simulation UI and McDonald's, independent JS review, full preservation verification, rendering and publication remain parent-coordinated gates.

## Independent-review correction

The first independent source/arithmetic pass found a presentation error: a complete October policy suppressed for cash/equity shortfall was labeled as incomplete input. The correction distinguishes the engine status, displays assumed ending cash, operating reserve and common equity, and retains the null allocation. English/Chinese regression coverage includes a complete synthetic cash-deficit policy. An adjacent note clarifies USD per EUR and debt fraction 1 = 100%. No financial formula changed.

The related June nonpositive-equity/terminal-FCFF suppression also now has an explicit bilingual `bridge.reason` plus preserved conditional-equity disclosure. It is not represented as missing policy inputs. Both negative-equity and negative-terminal-flow cases are regression-tested without changing suppression economics.
