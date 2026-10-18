# ONTO v2 independent correction-closure audit

18 October 2026. Valuation origin: 30 June 2026. USD millions unless stated. This is a research/model audit, not financial-statement assurance.

## Decision

Qualified operating-model and v2 correction-closure pass. All nine prior correction requests are addressed at their factual, disclosure or model-interpretation scope. The FX and headquarters disclosures are closed; their economic mapping remains open. Current equity, accepted per-share value and price-target readiness remain blocked. No company additions, app changes or publication were performed or authorized.

All 110 executable mechanical checks pass. Independently reconstructed operating EVs are unchanged:

| Scenario | Operating EV | Explicit PV | Terminal PV | Terminal share |
|---|---:|---:|---:|---:|
| Downcycle | 2,642.611928527 | 1,256.583642 | 1,386.028286 | 52.45% |
| Base | 5,867.221927683 | 2,436.383431 | 3,430.838497 | 58.47% |
| Upside | 10,231.558180085 | 3,617.073320 | 6,614.484860 | 64.65% |

These are conditional analyst operating scenarios. They do not establish realizable fair values. Terminal margins, assumed growth-funding returns and discount rates remain material judgments.

## Nine correction dispositions

### ONTO-A01: closed

Original R&D retained: FY2016 44.964 and FY2015 41.233. Separately sourced comparable figures 35.797 and 32.689 reconcile to FY2019 selected financial data; differences 9.167 and 8.544 are classifications, not EBIT changes. JSON and CSV distinguish the lenses.

No operating EV adjustment. [Primary evidence](https://www.sec.gov/Archives/edgar/data/704532/000156459020006357/onto-10k_20191231.htm).

### ONTO-A02: closed

19.3 capped-call DTA removed from the January annual-reference object and recorded as May 2026 event / June 30 report. No face-value tax asset credit is applied.

Realizability and timing remain part of tax valuation, not resolved by correcting the date. [Primary evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm).

### ONTO-A03: disclosure closed; valuation mapping open

June FX-forward asset 1.284 and notional 79.847 are separately identified outside cash/marketables; equity credit remains zero pending exposure, settlement and tax mapping.

Do not equate disclosure closure with measured net equity value. A simple unoffset asset credit would add 1.284, but that is not an accepted net adjustment. [Primary evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm).

### ONTO-A04: disclosure and sensitivity closed; occupancy schedule open

June 18 headquarters lease is disclosed: about 159,947 square feet, 17 dollars per square foot initial annual rent, 3% escalation, early abatements/phased commencement, approximately 13 years, expected 2027 start and 36.4 undiscounted payments. It is uncommenced at June. Independent 20bp margin-cost replay gives base EV 5820.833166904, down 46.388760779.

The 3.32 first-year stress exceeds 2.719099 full-area initial rent but is not actual incremental cost, a contractual upper bound or an old/new occupancy forecast. It ignores replacement savings/abatements and persists into perpetuity. The economic schedule remains unresolved; do not subtract 36.4 as additional debt. [Primary evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm).

### ONTO-A05: closed

FY2020 January 1–December 26 is explicitly 361 inclusive days; source states prospective calendar change. Approximately 367-day rolling anchor remains unnormalized.

No automatic annualization. [Primary evidence](https://www.sec.gov/Archives/edgar/data/704532/000156459021006843/onto-10k_20201226.htm).

### ONTO-A06: closed within preserved-source scope

All 40 raw files are inventoried exactly once; SHA-256 and sizes match. Source URLs and extraction parents are identified. Twenty-four date fields trace to retrieval records; sixteen remain null. Treasury, sector-beta and indenture snapshots are now retained.

Date fields on extracts refer to the recorded source retrieval, not an asserted extraction timestamp. Original unknown retrieval times remain unknown; hashes establish byte integrity, not independent provenance by themselves.

### ONTO-A07: closed

Narrative and JSON now call these dated guidance-versus-reported comparisons, include all three guide/actual release dates and preserve acquisition/charge caveats. Original numerical guidance and reported results are unchanged.

No inference of same-business forecasting skill. [Primary evidence](https://s24.q4cdn.com/480160064/files/doc_news/Onto-Innovation-Reports-2025-Third-Quarter-Results-2025.pdf).

### ONTO-A08: closed

Fresh grant value 39.22191 divided by sales 1005.263 is 3.9016565814%; prose correctly uses 3.9017%, before ESPP.

New-grant economic cost remains in margins; no new dilution double count. [Primary evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526066937/onto-20260103.htm).

### ONTO-A09: closed as model interpretation

Terminal 12%/18%/22% are assumed incremental growth-funding returns, not measured comprehensive company ROIC. Rigaku paired asset/cash discounting is explicitly an illustrative convention.

Rigaku requires independently valued minority rights, FX, liquidity and risk-consistent valuation before current equity readiness.

## Independent reproduction and preservation

- The new replay does not execute or import either author builder or the v1 replay. It reconstructs ten forecast years per scenario from primitive assumptions, taxes, funded investment, discount factors and terminal growth. All 30 annual schedules, the full forecast CSV, compensation treatment, WACC/margin/new-grant stresses, the conditional bridge and every one-at-a-time claims stress reproduce.
- All annual and terminal-next-year funding floors pass. Terminal funding is approximately 84.684 / 118.281 / 184.102 against floors 57.510 / 78.683 / 122.217. Full convertible fair value is deducted once; the paid capped-call premium is not deducted again; new grants remain in margins; old-award expense cancels before NOPAT.
- All 262 original populated ten-year facts match preserved SEC companyfacts records with exact accession, date, tag, period, unit and value. Eight unavailable fields remain null. All 191 available original annual-document inline facts match including signs and undimensioned contexts. The remaining 71 facts retain SEC-record provenance but are not represented in the four annual HTML documents crosschecked here. FY2015 original R&D is separately verified against predecessor companyfacts; both new comparable R&D values are checked in FY2019 printed selected financial data.
- Both six-file public-safe packets match their root files and manifests byte-for-byte, and contain only the expected deliverables plus manifest. All original v1 source/model/packet bytes match the v1 audit snapshot. The root navigation README was changed by the v2 revision before this audit; it is the only difference among 56 v1-baseline files.
- The v2 inventory covers exactly 40 raw files, including text extractions. Twenty-four date fields are supported by recorded source retrievals; sixteen are correctly unknown. All source hashes, byte counts, source identities and extraction parent links pass. A hash verifies retained bytes, not authenticity or forecast truth.
- This audit hashes all 91 pre-existing inputs at start and verifies them again after replay. Nothing outside this new audit directory was changed. The original pending-review flags were intentionally preserved. This separate audit record is the qualified reviewer disposition.

## Current equity and publication gates

- EQ-01 — Date-consistent valuation origin and current roll-forward: Choose and consistently date cash, investments, common shares, debt, derivatives, awards, taxes and other claims. June balances with October discount assumptions are a retrospective June-origin exercise, not October current cash/equity. July share count or EPS-weighted shares cannot substitute for a complete origin-date denominator. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm)
- EQ-02 — Convertible claim measurement and scenario consistency: The disclosed June 30 Level-2 claim of 1982.250 is a company-estimated dated market value using last trading price, held fixed across intrinsic operating scenarios. Establish a date-consistent security value and treatment consistent with the selected equity framework. Do not also subtract 1500 principal or add all conversion shares. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm)
- EQ-03 — Capped-call asset fair value and contract completeness: Obtain origin-date counterparty/contract terms and fair value, including averaging, settlement, event adjustments, counterparty risk and tax effects. Historical premium 88.950 and nominal 499.994803 payoff-cap stress are not measured fair values or universal bounds. Do not double-credit dilution netting and an asset. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526234610/d17904dex101.htm)
- EQ-04 — Legacy awards and current ESPP claims: Reconcile gross outstanding service/performance units and settlement/payout equivalents, vesting/forfeitures, any deferrals and ESPP rights at the origin date. January units, June 59.4 unrecognized expense and hypothetical 0.75m units cannot establish June gross claims. Future grant cost remains in operating margins. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm)
- EQ-05 — Opening taxes, capital payables and residual claims: Map dated tax liabilities and realization/timing, capital payables, deferred compensation, and other nonoperating claims. January zero deferred-compensation accounts do not establish June zero; first deferral elections apply to 2026 compensation. Do not double-count recorded UTB 9.037 and gross 25.383 or grant book DTA/DTL face-value credits. The 15 allowance and 0–30 stresses are not measured balances or bounds. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526066937/onto-20260103.htm)
- EQ-06 — FX-forward exposure, tax and settlement mapping: Reconcile the 1.284 asset to underlying exposures and operating cash flows before determining net equity adjustment; 79.847 is notional. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm)
- EQ-07 — Rigaku and other nonoperating asset values: Independently measure minority stake value, rights, FX, liquidity and appropriate risk discounting; 720 cost proxy is not fair value. Preserve paired cash/asset timing and avoid a second payment deduction. Assess the 8 carrying-value private investment separately. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526341337/d125405d8k.htm)
- OP-01 — Incremental headquarters occupancy costs: Reconcile old-office costs, new rent escalation, early abatements, phasing, fit-out and overlap/replacement costs against aggregate forecast margins. The 20bp sensitivity is useful headroom testing, not a measured net cost or assurance that margin assumptions absorb the commitment. [Evidence](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm)

The illustrative 47.5733 / 116.6623 / 204.3295 per-share calculations use a hypothetical 49.783m denominator and several unmeasured claims. Reproduction is not acceptance of those targets. All current-equity/current-per-share fields remain null.

## Source scope and caveats

The [June filing](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm) was reopened successfully during this audit; live text confirms the FX asset, capped-call DTA and new lease. Live reopen/find attempts for the 2019, 2020 and 2025 annual pages returned web-tool internal errors, so those observations are explicitly based on the preserved, hash-verified source HTML rather than a claimed fresh fetch. The prior audit live checks are supplemental historical evidence. See live-source-verification.json.

Rate snapshots reproduce the October 16 5.09% Treasury yield, October 1 4.20% ERP with 0.22% default adjustment, and January equipment-sector cash-corrected beta 1.39. The resulting 10.9660951% initial and 9.505705% terminal WACC match. Those observations are differently dated; applying October information to a June valuation origin is retrospective, not a synchronized or point-in-time model. [Treasury](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=2026&field_tdr_date_value_month=202610), [ERP](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/home.htm), [sector beta](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/Betas.html).

## Reproduce

Run `python independent-audit-v2/replay.py` from the ONTO directory, or pass its absolute path from any working directory. Then run `python independent-audit-v2/write_audit.py` to refresh the report and disposition. Python standard library only. The replay fails on changed original inputs or failed checks and writes only this audit folder. Do not run the author builders to reproduce this independent audit.

Files: audit.json, correction-closure.json, remaining-gates.json, replay-results.json, independent-cashflow-replay.csv, independent-sensitivities.json, history-provenance-check.json, original-filing-crosscheck.json, source-inventory-check.json, packet-check.json, input-sha256.json and manifest.json.
