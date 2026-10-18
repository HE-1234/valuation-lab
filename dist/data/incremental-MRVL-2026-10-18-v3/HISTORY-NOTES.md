# MRVL ten-year financial history evidence v1

As of October 18, 2026. Research evidence only; no valuation or app write.

## Delivered
- Ten completed fiscal years, FY2017–FY2026, with all nine required fields populated from SEC annual filings/companyfacts.
- history-10fy-v2.json includes each value's tag, original amount, period, accession, filing date and direct primary-source URL. Original same-year annual values are retained alongside latest-reported values.
- history-10fy-v2.csv is the flat USD-million dataset. Positive capex and technology-license amounts are cash outflows. Net income/CFO retain their economic signs.
- reported-vintage-differences.json records 50 changes between original and latest annual presentation; none were silently overwritten without retaining the original.
- Raw SEC companyfacts for both legal issuers, submissions, all ten 10-K HTML/text files, and extracted cash-flow table rows are preserved.

## Essential comparability limitations
1. FY2017 original annual revenue was $2,317.674m, operating income $99.994m, R&D $831.398m. Later continuing-operations recast values are $2,300.992m, $130.407m and $805.029m. Three businesses (Multimedia, LTE thin-modem and Broadband) were divested in FY2018. The company explicitly did NOT segregate their cash flows. Thus FY2017–FY2018 revenue/EBIT/R&D are continuing-operations figures, while CFO and cashflow addbacks include discontinued operations. Net income is consolidated and includes discontinued operations. Do not infer a consistent continuing cashflow history from these columns.
2. FY2017 CFO includes $750m paid to Carnegie Mellon University under a litigation settlement. It is not recurring working-capital economics.
3. FY2019 adopted ASC 606 using modified retrospective transition. The annual report shows $2,865.791m reported revenue versus $2,813.235m without adoption (difference $52.556m). Earlier years were not retrospectively put on ASC 606.
4. Cavium entered consolidation July 6, 2018; Aquantia September 19, 2019; Avera November 5, 2019; Inphi April 20, 2021; Innovium October 5, 2021. FY2022 new legal parent/CIK does not mean a newly born operating business. No acquired-company predecessor financials or pro forma revenue are spliced into this actual reported history.
5. FY2020 earnings include $1,121.709m Wi-Fi business sale gain and $763m income tax benefit associated with the Singapore IP restructuring ($659m deferred tax asset plus $104m deferred-tax-liability reversal). The gain is outside operating income.
6. FY2026 earnings include $1,830.4m automotive Ethernet sale gain below operating income; net sale cash proceeds $2,478.6m are investing cash flows. Operations include that business only until its August 14, 2025 disposal. FY2026 revenue/EBIT are not an ex-auto comparable organic series.
7. Celestial AI and XConn completed February 2/10, 2026, AFTER FY2026 year end. They are FY2027 scope; do not add their consideration or operating impact into this annual FY2026 history.
8. Ordinary cash-flow D&A is separate from acquired-intangible amortization. FY2026 ordinary D&A $348.6m contains PP&E depreciation $221.7m and technology-license amortization $124.7m, leaving a $2.2m residual; acquired-intangible amortization is a separate $942.0m addback. FY2017/18 original label includes acquired-intangible write-offs; da_plus_acquired_amortization_cf is only an arithmetic sum of cash-flow addbacks, not a clean maintenance depreciation measure.
9. Technology-license cash economics are split across investing purchases and financing obligation payments. FY2026 amounts are $4.5m and $128.3m, respectively. CFO minus PP&E capex ($1,396.4m in FY2026) is a conventional subtotal, not a complete owner-earnings or recurring-equity-cost measure.
10. FY2018 and FY2024 have 53 weeks; the other supplied fiscal years have 52. No per-week normalization applied.
11. Latest comparative reports round to millions and may reclassify prior periods. FY2022 original R&D was $1,424.306m versus latest $1,424.2m; original CFO $819.368m versus latest $819.3m; original capex $169.324m versus latest $169.2m. Differences are preserved, not all automatically called rounding.
12. No split in the ten-year window was identified in the reviewed annual reports. An official 2006 2-for-1 split notice is retained as outside-window context. No new split adjustment was applied.

## R&D / D&A handoff
Latest reported R&D FY2022–FY2026, USD m: 1,424.2; 1,784.3; 1,896.2; 1,950.4; 2,075.2. Use one vintage consistently.
FY2026 PP&E depreciation / technology amortization / acquired-intangible amortization: $221.7m / $124.7m / $942.0m.

## Remaining limits
Core fields are complete; detailed grants are separately reconciled in sbc-policy-v2.json. Unverified supplemental balance-sheet/tax/debt fields have been removed from this public history. See source-ledger-v2.json and each value's accession for primary provenance.
