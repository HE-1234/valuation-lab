# ARM independent history and guidance audit

Audit date: 2026-10-19. Scope: the six FY2021–FY2026 financial-history rows, four separately identified FY2017–FY2020 legacy rows, and nine quarterly guidance/actual pairs. All original package files were read-only; only this report was written. The existing independent review and build scripts were not used as verification evidence.

## Conclusion

**No incorrect populated financial-history number or guidance-pair number was found.** The six annual rows agree with original Arm financial statements, allowing for the explicitly described scope and reporting-precision differences below. All nine quarterly revenue, non-GAAP EPS, and non-GAAP operating-expense pairs match the issuer's tables, and their result classifications and midpoint calculations are correct. All four legacy revenue breakdowns match the original SoftBank reports.

This is a qualified pass on values, not a claim of ten comparable complete annual statements. There are missing available FY2022 cells, two unfrozen legacy originals, a missing ledger entry for an actually frozen guidance PDF, and several comparability limitations.

## Findings: errors versus omissions

### Incorrect populated numbers

None found in the audited history and guidance fields. In particular, FY2025 PPE of $354m is **not** an error: the FY2026 comparative balance sheet reports PPE $354m and finance-lease right-of-use assets $40m separately. The FY2025 original balance sheet combines them in PPE of $394m. The current value matches the later presentation cited by field provenance.

### Missing available data

1. FY2022 `receivables` is null, although the frozen IPO original's Consolidated Balance Sheets reports net accounts receivable of **$1,124m** at March 31, 2022.
2. FY2022 `ppe` is null, although that same table reports net property and equipment of **$188m**.
3. FY2022 `shares` is null. IPO earnings-per-share/share-capital disclosures give a 1,025.234m pre-IPO share base; the specific outstanding-shares field should be sourced to the relevant share-capital roll-forward before populating it. Weighted-average shares are already populated correctly, and should not merely be substituted for outstanding shares without that check.
4. FY2021 lacks several balance-sheet fields, rather than providing a complete balance-sheet history. I did not independently establish all those missing values from the frozen originals; do not fill them with guesses. Null inventory/payables in later years likewise must not be silently treated as zero: the primary balance-sheet presentation does not give those as comparable standalone lines in the tables reviewed.

The first two omissions are confirmed from [Arm's original IPO filing](https://investors.arm.com/node/6546/html), Consolidated Balance Sheets, March 31, 2023 and 2022; frozen `ipo-full-2023.html`, zero-based HTML table 575.

### Frozen-source and provenance defects

- **Two legacy originals are absent:** neither SoftBank FY ended March 2018 nor FY ended March 2020 PDF is frozen in this package or its integrity manifest. The legacy JSON retains correct URLs. I verified their tables from the primary PDFs through live web extraction; the numbers therefore have independent primary-source confirmation, but cannot be reproduced entirely offline from the package.
- **Q4 FY2025 original is present, but unledgered:** `letter-06.pdf` is a valid 18-page May 7, 2025 shareholder letter with the required table on PDF page 5. It is in the integrity manifest, but absent from `source-ledger-v1.json`. The ledger's limitation text saying Q4 FY2025 guidance was verified through public web extraction is incomplete/stale as a description of what is frozen. Add the existing PDF and source URL to the ledger; a new download is unnecessary.
  - URL: https://investors.arm.com/static-files/a9baed37-2c28-4ac3-83b0-c11387d02bb2
  - Bytes: 2,416,714
  - SHA-256: 90c8c02cbe5c6fe64d3978719dcb94c9bbdb54929977cae73499eac94aadd45a
- Guidance rows store the **actual-results release date** and actual-results source, rather than separate forecast-issued date/source and actual-issued date/source. All nine forecasts were independently cross-checked against the immediately preceding release, so this is a provenance-schema limitation, not an unsupported hindsight comparison.
- The ledger's nested HTML source entries have no hashes in that ledger, but the integrity manifest does cover those original files. Do not describe these as wholly unhashed sources.

## Six-year financial-history verification

Amounts are USD millions; share counts are millions. All fiscal years end March 31. The following expected values were independently transcribed from primary statement tables and compared with the JSON: 120 common reported observations plus 32 populated balance-sheet/share observations; zero discrepancies. Additional derived-field checks are described below. Shared numeric fields in `history-v1.csv` also agree with the JSON.

| Field | FY2021 | FY2022 | FY2023 | FY2024 | FY2025 | FY2026 |
|---|---:|---:|---:|---:|---:|---:|
| revenue | 2027 | 2703 | 2679 | 3233 | 4007 | 4920 |
| gross_profit | 1882 | 2572 | 2573 | 3079 | 3886 | 4799 |
| operating_income | 239 | 633 | 671 | 111 | 831 | 900 |
| net_income | 388 | 549 | 524 | 306 | 792 | 904 |
| pretax_income | 697 | 786 | 671 | 212 | 720 | 1157 |
| tax | 153 | 110 | 147 | -94 | -72 | 253 |
| rd | 814 | 995 | 1133 | 1979 | 2071 | 2776 |
| cfo | 1233 | 458 | 739 | 1090 | 397 | 1524 |
| capex | 104 | 34 | 64 | 92 | 219 | 545 |
| da | 201 | 185 | 170 | 162 | 183 | 249 |
| sbc | 54 | 26 | 79 | 1037 | 820 | 1052 |
| cash | 1171 | 1004 | 1554 | 1923 | 2085 | 2751 |
| net_income_continuing | 544 | 676 | 524 | 306 | 792 | 904 |
| discontinued_net_loss | -156 | -127 | 0 | 0 | 0 | 0 |
| license_other | 714 | 1141 | 1004 | 1431 | 1839 | 2307 |
| royalty | 1313 | 1562 | 1675 | 1802 | 2168 | 2613 |
| intangible_cash_purchases | 61 | 41 | 29 | 51 | 20 | 30 |
| intangible_obligation_payments | 38 | 37 | 40 | 40 | 59 | 67 |
| weighted_basic_shares | 1025.234 | 1025.234 | 1025 | 1027 | 1050 | 1061 |
| weighted_diluted_shares | 1025.234 | 1025.234 | 1028 | 1044 | 1063 | 1068 |

Additional populated balance-sheet fields verified: short-term investments, total assets, total liabilities, and total equity for FY2022–FY2026; net receivables, PPE, and outstanding shares for FY2023–FY2026. Their existing values all match their cited original/later-comparative statements.

Primary original locators (HTML table numbers are zero-based, counting every `table` in document order):

- [2023 IPO filing](https://investors.arm.com/node/6546/html), frozen `ipo-full-2023.html`: income statements table 573, balance sheets 575, cash flows 577, revenue breakdown 259. Provides FY2021–FY2023 history. The FY2021 $1,171m cash amount is continuing-operations cash from the cash-flow reconciliation.
- [FY2024 20-F](https://www.sec.gov/Archives/edgar/data/1973239/000197323924000012/arm-20240331.htm), frozen `annual-2024.html`: income statements 45, balance sheets 47–48, cash flows 50, revenue breakdown 56. Checks FY2022–FY2024 and FY2023–FY2024 balance sheets.
- [FY2025 20-F](https://www.sec.gov/Archives/edgar/data/1973239/000197323925000016/arm-20250331.htm), frozen `annual-2025.html`: income statements 43, balance sheets 45–46, cash flows 48, revenue breakdown 55. Confirms FY2025 as originally reported and the later rounding of FY2023 share counts.
- [FY2026 20-F](https://investors.arm.com/node/8281/html), frozen `annual-2026.html`: income statements 46, balance sheets 48–49, cash flows 51, revenue breakdown 59. Provides FY2024–FY2026 income/cash-flow fields and FY2025–FY2026 balance sheets.

Derived arithmetic independently recomputed and passed for every applicable row:

- license/other + royalty = revenue;
- pretax income − tax expense = continuing net income;
- continuing net income + discontinued net loss = total net income;
- assets = liabilities + equity where all three are populated;
- gross profit/revenue, operating income/revenue, and SBC/revenue;
- CFO − PPE cash purchases = `fcf_cfo_less_capex`: **1,129; 424; 675; 998; 178; 979**;
- CFO − PPE cash purchases − intangible purchases − intangible-obligation payments = `derived_fcf_including_intangibles`: **1,030; 346; 606; 907; 99; 882**.

The broader FCF measure agrees with the IPO's reported non-GAAP FCF for FY2021–FY2023 and later Arm reconciliations, including FY2026 $882m in [Q4 FY2026 results](https://investors.arm.com/node/8141/html), table 18. The simpler CFO-minus-PPE measure is arithmetically correct but is not interchangeable with Arm's published non-GAAP FCF.

### Comparability and precision limits

- FY2021/FY2022 net income includes discontinued losses of $156m/$127m, whereas revenue, operating income, tax and pretax fields are continuing operations. The package correctly supplies a separate continuing-income bridge. Cash flows, D&A and SBC come from the consolidated cash-flow statements; these are not a clean continuing-operations-only series. FY2021 end cash of $1,171m excludes $43m discontinued-operation cash, while the consolidated cash-flow statement's ending cash is $1,214m. Add an explicit cash-scope note if machine consumers rely on a single generic `cash` definition.
- SBC $54m/$26m/$79m is the cash-flow reconciliation adjustment in FY2021–FY2023, not a uniform measure of all economic employee-equity/cash-settled compensation. The existing pre-IPO/IPO caveat is appropriate. FY2024's $1,037m is a genuine reported figure, not a transcription mistake.
- Share precision is mixed because later filings round counts to millions. FY2023 1,025/1,028 matches FY2025 presentation; the earlier exact counts were 1,025.234/1,027.505008. FY2024 1,027/1,044 similarly reflects later rounding; FY2024 original exact counts were 1,027.443122/1,044.497032. The differences are presentation precision, not evidence of an error. Preserve a rounding/source-vintage note before treating tiny share-count changes as meaningful.
- FY2025 PPE uses the FY2026 comparative presentation excluding separately presented finance-lease assets. This is supportable, but makes the source-vintage choice worth stating.

## Four legacy rows

All reported totals and components match, in USD millions:

| FY ended March 31 | Technology licensing | Technology royalties | Software/services | Total |
|---|---:|---:|---:|---:|
| 2017 | 601 | 974 | 114 | 1,689 |
| 2018 | 618 | 1,087 | 126 | 1,831 |
| 2019 | 547 | 1,098 | 191 | 1,836 |
| 2020 | 582 | 1,081 | 235 | 1,898 |

FY2017–FY2018: [SoftBank report, fiscal year ended March 31, 2018](https://group.softbank/system/files/pdf/ir/financials/financial_reports/financial-report_q4fy2017_01_en.pdf), PDF page 24 / printed page 21, USD reference revenue table. The report specifically marks the FY2017 full year as pro forma, including pre-acquisition periods.

FY2019–FY2020: [SoftBank report, fiscal year ended March 31, 2020](https://group.softbank/system/files/pdf/ir/financials/financial_reports/financial-report_q4fy2019_01_en.pdf), PDF page 29 / printed page 25, USD net-sales table. Software/services includes activities such as Treasure Data; this supports retaining the stated noncomparability warning rather than splicing the figures into IPO continuing-US-GAAP revenue.

The four component sums were also recomputed and match their totals. Live PDF screenshots failed to fetch for these two documents; primary PDF text extraction succeeded. The table alignment and year labels were visible in that extraction. The result is a text-based original-source check, not a visual-PDF audit.

## Nine quarterly guidance pairs

Every row below passed revenue range, actual revenue, non-GAAP EPS range, actual EPS, approximately guided non-GAAP opex, actual non-GAAP opex, and results release-date checks against the original issuer release. Revenue/opex are USD millions, EPS is USD/share.

| Quarter | Revenue guide → actual | EPS guide → actual | Opex approx. guide → actual | Revenue vs midpoint | Range result revenue / EPS |
|---|---|---|---|---:|---|
| Q1 FY2025 | 875–925 → 939 | 0.32–0.36 → 0.40 | 475 → 467 | +4.3333% | above / above |
| Q2 FY2025 | 780–830 → 844 | 0.23–0.27 → 0.30 | 500 → 494 | +4.8447% | above / above |
| Q3 FY2025 | 920–970 → 983 | 0.32–0.36 → 0.39 | 525 → 522 | +4.0212% | above / above |
| Q4 FY2025 | 1,175–1,275 → 1,241 | 0.48–0.56 → 0.55 | 590 → 566 | +1.3061% | within / within |
| Q1 FY2026 | 1,000–1,100 → 1,053 | 0.30–0.38 → 0.35 | 625 → 619 | +0.2857% | within / within |
| Q2 FY2026 | 1,010–1,110 → 1,135 | 0.29–0.37 → 0.39 | 655 → 648 | +7.0755% | above / above |
| Q3 FY2026 | 1,175–1,275 → 1,242 | 0.37–0.45 → 0.43 | 720 → 716 | +1.3878% | within / within |
| Q4 FY2026 | 1,420–1,520 → 1,490 | 0.54–0.62 → 0.60 | 745 → 734 | +1.3605% | within / within |
| Q1 FY2027 | 1,210–1,310 → 1,289 | 0.36–0.44 → 0.45 | 760 → 733 | +2.3016% | within / above |

Forecast-to-outcome source chain, with the forecast-issued date followed by actual-results date:

1. Q1 FY2025: [May 8, 2024](https://investors.arm.com/node/7151/html) → [July 31, 2024](https://investors.arm.com/node/7256/html).
2. Q2 FY2025: [July 31, 2024](https://investors.arm.com/node/7256/html) → [November 6, 2024](https://investors.arm.com/node/7406/html).
3. Q3 FY2025: [November 6, 2024](https://investors.arm.com/node/7406/html) → [February 5, 2025](https://investors.arm.com/node/7481/html).
4. Q4 FY2025: [February 5, 2025](https://investors.arm.com/node/7481/html) → [May 7, 2025](https://investors.arm.com/static-files/a9baed37-2c28-4ac3-83b0-c11387d02bb2).
5. Q1 FY2026: [May 7, 2025](https://investors.arm.com/static-files/a9baed37-2c28-4ac3-83b0-c11387d02bb2) → [July 30, 2025](https://investors.arm.com/node/7626/html).
6. Q2 FY2026: [July 30, 2025](https://investors.arm.com/node/7626/html) → [November 5, 2025](https://investors.arm.com/node/7711/html).
7. Q3 FY2026: [November 5, 2025](https://investors.arm.com/node/7711/html) → [February 4, 2026](https://investors.arm.com/node/7826/html).
8. Q4 FY2026: [February 4, 2026](https://investors.arm.com/node/7826/html) → [May 6, 2026](https://investors.arm.com/node/8141/html).
9. Q1 FY2027: [May 6, 2026](https://investors.arm.com/node/8141/html) → [July 29, 2026](https://investors.arm.com/node/8356/html).

All HTML guidance tables are zero-based table 9 in their respective frozen quarter files. The Q4 FY2025 table was read from both the frozen `letter-06.pdf` page 5 and the live primary PDF; the next-quarter guide in it completes the forecast chain for Q1 FY2026. Release dates agree with the dates stated at the opening of each original shareholder letter.

Recomputed summary: revenue above range in **4/9**, below range **0/9**; EPS above range **5/9**, below range **0/9**. All nine are above revenue midpoint, which must not be relabeled as nine above-range beats. The package's summary is correct. These are consecutive selected post-IPO quarters, not a complete CEO-career forecasting record; no inference about success of long-duration silicon plans follows mechanically from this sample.

## Recommended remediation priority

1. Fill the two confirmed FY2022 missing cells and attach precise original-table provenance.
2. Add the already frozen Q4 FY2025 PDF to the source ledger and correct its download-limitation wording.
3. Freeze both SoftBank originals with hashes if the package is intended to be fully offline-reproducible.
4. Add forecast-issued dates/sources and explicit rounding, cash-scope, and PPE-presentation notes. No populated history/guidance numerical replacement is required by this audit.
