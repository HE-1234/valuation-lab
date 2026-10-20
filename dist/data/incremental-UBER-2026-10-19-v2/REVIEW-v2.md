# Independent re-review of Uber v2

19 October 2026. Review applies only to the hashes recorded below.

## Decision

**Pass for a dated primary-research package and conditional model. The material v1 source and optional-bridge findings are resolved. No current-equity target, funding certification, canonical admission or publication is approved.**

Independent recalculation reproduces the June operating EVs and explicitly illustrative allocations without change:

| Scenario | Operating EV, USD bn | Conditional June allocation, USD/share |
|---|---:|---:|
| Bear | 62.948437 | 29.154466 |
| Base | 190.602166 | 90.754044 |
| Bull | 422.727724 | 202.766724 |

The default June and October policies remain unselected and return no per-share allocation. The three June per-share numbers require the package's expressly assumed investment, claim, ownership, tax and lease policy. They are not October trading targets.

## What was verified

- All 33 manifest-listed files and exact ZIP member/byte parity, with no duplicate ZIP members.
- All 11 retained primary-evidence hashes, including the added SEC pricing, underwriting and final-prospectus documents.
- Independent 40-digit Decimal reconstruction of the 30 annual FCFF rows, terminal reinvestment and all three valuations, without importing the author's DCF for the numerical reconstruction.
- Historical nonmissing tagged values matched to retained SEC accession/date/period/unit facts; the material 2017 revenue recast and selected 2016 history remain intact.
- Independent conservation and adversarial tests of the repaired October bridge. These use synthetic fixtures, not selected or observed current economic assumptions.
- Original v1 files remain unchanged. June annual forecast and EV are exactly unchanged in v2. Author checks replay at 696 in normal and optimized Python in an isolated copy.

The independent script records **1,212 passing granular checks and zero failures**. The count includes repeated field/year and invalid-input tests; it is not a count of independently established economic conclusions. The earlier full primary-source assessment and its limitations remain in REVIEW-v1.md.

## Closed findings

### September financing costs

The model now fixes EUR4,500m principal, EUR4,489.3075m public gross proceeds, EUR10.6925m original issue discount and EUR24.875m underwriting discounts. Proceeds before other expenses are EUR4,464.4325m. The final prospectus's approximately EUR4,453m net-proceeds estimate is correctly distinguished from exact realized cash. Only further expenses remain an explicit selection; known discounts cannot be waived by choosing zero for that field.

These figures were independently established from the [pricing FWP](https://www.sec.gov/Archives/edgar/data/1543151/000155278126000479/e26381_uber-fwp.htm), [underwriting agreement Schedule I](https://www.sec.gov/Archives/edgar/data/1543151/000155278126000486/e26383_ex1-1.htm), and [final prospectus front table and S-13](https://www.sec.gov/Archives/edgar/data/1543151/000155278126000481/e26382_uber-euro424b2.htm).

### Cash FX and economic versus actual cash

Retained EUR cash is retranslated separately from proceeds converted or spent. With EUR4,453m net cash retained and EUR4,500m par debt, a synthetic FX move from1.10 to1.20 increases cash USD445.3m and debt USD450m; only the USD4.7m net funding difference remains. The earlier spurious full USD450m loss is eliminated.

Economic FCFF continues to reduce rolled June operating EV. Actual cash can differ through separately signed SBC, tax, collateral/NWC, reinvestment and other operating reconciliations. A synthetic USD100m nonoperating receipt now increases cash and equity by100 without reducing operating EV. Signed nonoperating flows, realized proceeds FX and other currency translation support a transparent cash ledger. Actual economic assumptions and evidence still must be supplied.

### Acquisition and claim perimeter

Getir food EV and grocery minority investment are separate. A synthetic100 reclassification between the two is equity-neutral. Careem's removed investment is tied to what the selected June policy included,117.6 in the illustration, rather than unadjusted book147. Named Getir, Careem and Blacklane entries separately capture consideration, acquired cash, debt, NCI and other claims.

Current inherited claims and operating reserves are explicitly selected; new deal claims are separate. A synthetic debt retirement or legacy-claim settlement with matching cash and claim reduction preserves equity exactly. Changes to claims without matching payments remain explicit choices rather than automatic releases. The December2026 term-loan maturity and expired unused capacity are flagged without another valuation deduction. Pending Delivery Hero/ezCater transactions are not automatically consolidated or funded.

### Input integrity

The engine rejects changing the frozen June cash anchor, fractional current common or award shares, unknown inherited-claim keys, nonfinite/boolean numeric inputs, excessive retained euro cash, and negative residual legacy debt/investment pools masked by new debt/acquired assets. Missing required current inputs suppress allocation. These tests address the newly identified scope-mixing holes before the v2 freeze.

## Limits that remain

This is a review of source treatment, selected reported facts, numerical replay and conditional model behavior. It does not validate the analyst's growth, margin, WACC, terminal ROIC, collateral or tax assumptions. It does not turn the book/haircut investment values or assumed awards, finance leases, NCI, litigation/tax provisions and vehicle commitments into verified fair values.

Actual October operating cash, currency disposition, claims, acquired purchase accounting, investment marks and exact shares remain unknown in the shipped policy. Cash and claim reconciliation still requires evidence and competent classification; a flexible engine cannot prove that user-supplied entries avoid every economic overlap. Daily funding, covenant capacity, local cash fungibility and future acquisitions are not certified. Not every historical tag has received a manual filing-table audit, and the history is not constant perimeter.

The package's readiness file still says independent v2 review pending because the package was frozen before this review. This separate review closes that numerical/source-treatment review gate for the exact version below; the remaining current-capitalization and admission gates stay closed. Do not edit the frozen package merely to change that label.

## Frozen identity and reproduction

- Package manifest SHA-256: 9360a252bb7941ba8b9386971b97e368918d27dc0af270fbd2bf1bceafcc048a
- Package ZIP SHA-256: d58a42336df8bcf034bb905b05116fc3884002c1b70e2ee6b1536ab239ca0acc
- ZIP size:104,847 bytes

Run `python independent_recalculate_v2.py`; it writes only independent-results-v2.json in the review directory. No canonical files, original package artifacts, source data, publication, push, application state or aggregate were modified. Source retrieval used read-only web tools, not a browser session.
