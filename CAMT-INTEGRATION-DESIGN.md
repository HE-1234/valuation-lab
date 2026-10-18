# CAMT dated operating EV adapter

Prepared October 18, 2026 in an isolated staging directory. Canonical changes and publication are outside this task.

## Scope and source contract

- Capital and discount origin: June 30, 2026. Information cutoff: October 18, 2026. Annual cash flows cover July 2026–June 2036, distinct from calendar fiscal history.
- Independently audited EV, USD millions: downcycle 1216.4981994163263; base and upside replay directly from the immutable audited source. No probability weights, current quotes or stock-price targets.
- Preserve the source v1 package; separately display the audit correction that Visual Layer was announced April 14 and closed by May 12, with no verified April closing date.
- October 14 preliminary Q3 and initial outlook supersede earlier guidance. YTD orders are intake, not backlog. The three-year organic revenue model is a target, not guidance.
- The full convertible fair value is unmeasured. The USD 650m placeholder is only described as an illustration; the application does not allocate common equity from it. June award, old-note settlement, lease, tax, capital and acquisition claims remain gated.

## Model and display contract

- Three immutable company-specific funding policies provide physical capex/depreciation, incremental working capital, operating cash and marginal sales/capital assumptions.
- Every annual edit and accepted Monte Carlo trial recomputes required funding from the edited revenues, margins, tax and terminal growth/ROIC. Entered reinvestment remains separately visible and receives a nonnegative top-up when insufficient.
- Revenue declines do not release working capital. Terminal reinvestment must cover the same source-specific cash-funding floor or calculation rejects it.
- Zero-width defaults exactly reproduce all three source cases; Monte Carlo remains manually invoked. All ten reported fiscal years retain original source/units and share-scale flags.
- Reuse existing annual workspace, tables, evidence panel, six themes and bilingual localizer. No stylesheet or layout redesign.
- Visible summary values use at most two decimals; unrounded machine-readable research remains intact.

## Verification stages

Initial isolated hooks: 17 focused runtime tests passed, covering annual and terminal source replay, equity/quote gates, source hashes, chronology, units, edited funding, all-case nonzero joint uncertainty, manual simulation and saved state/undo/export.

Rebased on V65 e2ac366de2c396f500c2d2fe5ec303c01dab4ff4 plus the verified ONTO delivery (archive SHA-256 3cc019aa07eaaed07d4ed58193e9bd22b51b03001be7305603ab59380eb19412). Strict CAMT reversal precedes ONTO and NVMI preservation. All 885 tracked canonical V66 files (2422ebd674911202232db0c4eda32b013bc1c392) matched the serialized baseline exactly. Final bounded aggregate: 2,025 tests, 2,024 passed, zero failed, one existing skip, exit 0. Eight final preservation tests pass. Static EN desktop and ZH mobile result/history renderings have zero viewport overflow and at most two visible decimals; these are not native-browser screenshots. Public payload includes only public-safe research and author-created audit reports; no raw filings or third-party transcript copies.
