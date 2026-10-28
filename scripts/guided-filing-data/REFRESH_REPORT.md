# Guided valuation refresh — 2026-10-21

Cutoff: **2026-10-21**, America/Los_Angeles. All 36 existing ready companies were checked. No annual/interim financial-report periods moved after fresh SEC submissions review; later nonfinancial filings do not create another base.

**Calculation coverage:** 64/64 offered bases produce a numeric conditional result; 0 remain withheld. Following the user’s materiality instruction, small missing debt components use explicitly labelled proxies while the original filing fields remain null. Tesla and Nebius use separate dated ownership models. **Nebius remains a funding-stress calculation, not a validated fair-value estimate:** its operating path and capital requirements are consequential uncertainties. A zero equity floor is not a conclusion that the traded security is worthless.

## Reproduce

```sh
GUIDED_CUTOFF=2026-10-21 .venv/bin/python -I scripts/build-guided-reviewed-cases.py
python3 -I scripts/patch-original-guided-data.py
GUIDED_CUTOFF=2026-10-21 python3 -I scripts/guided-filing-data/validate.py
GUIDED_CUTOFF=2026-10-21 node scripts/report-guided-refresh.mjs
```

The original patch applies its own evidence, `originals/bridge-supplement.json`, then `claims-resolution/*.json` via `apply-guided-resolutions.py`. Rebuild translations after changing any source localization pairs. No old original-company pipeline, package installation, commit or push is needed. Raw downloads remain outside the repository.

## Base values before and after

Values are conditional Guided defaults, in the displayed reporting currency per modeled share; they are not market prices. TSM is TWD per ordinary share, without FX conversion. The prior capture used the model before this refresh. “Withheld” is an evidence/model constraint, never a zero valuation.

| Company | Base, old → new | Currency | Old value / share | New value / share | Filing |
|---|---|---|---:|---:|---|
| AAPL | Annual: 2025-09-27 → 2025-09-27 | USD | 135.9261 | 139.6991 | [2025-10-31](https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm) |
| AAPL | TTM: 2026-06-27 → 2026-06-27 | USD | 145.7301 | 149.7804 | [2026-07-31](https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/aapl-20260627.htm) |
| MSFT | Annual: 2026-06-30 → 2026-06-30 | USD | 297.6346 | 290.4535 | [2026-07-29](https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm) |
| AMZN | Annual: 2025-12-31 → 2025-12-31 | USD | 73.6818 | 76.2704 | [2026-02-06](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm) |
| AMZN | TTM: 2026-06-30 → 2026-06-30 | USD | 75.5568 | 92.2052 | [2026-07-31](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026/amzn-20260630.htm) |
| GOOG | Annual: 2025-12-31 → 2025-12-31 | USD | 143.4068 | 145.3176 | [2026-02-05](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm) |
| GOOG | TTM: 2026-06-30 → 2026-06-30 | USD | 167.7118 | 163.7918 | [2026-07-23](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm) |
| META | Annual: 2025-12-31 → 2025-12-31 | USD | 395.8743 | 388.4732 | [2026-01-29](https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm) |
| META | TTM: 2026-06-30 → 2026-06-30 | USD | 405.2278 | 393.8793 | [2026-07-30](https://www.sec.gov/Archives/edgar/data/1326801/000162828026050705/meta-20260630.htm) |
| NVDA | Annual: 2026-01-25 → 2026-01-25 | USD | 188.1393 | 189.884 | [2026-02-25](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm) |
| NVDA | TTM: 2026-07-26 → 2026-07-26 | USD | 208.4396 | 210.6639 | [2026-08-26](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000075/nvda-20260726.htm) |
| TSLA | Annual: 2025-12-31 → 2025-12-31 | USD | 24.3733 | 25.6007 | [2026-01-29](https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm) |
| TSLA | TTM: 2026-06-30 → 2026-06-30 | USD | 23.7424 | 25.7885 | [2026-07-23](https://www.sec.gov/Archives/edgar/data/1318605/000162828026049270/tsla-20260630.htm) |
| COHR | Annual: 2026-06-30 → 2026-06-30 | USD | 85.0689 | 80.6267 | [2026-08-14](https://www.sec.gov/Archives/edgar/data/820318/000082031826000020/iivi-20260630.htm) |
| LITE | Annual: 2026-06-27 → 2026-06-27 | USD | 153.9998 | 146.1947 | [2026-08-17](https://www.sec.gov/Archives/edgar/data/1633978/000162828026057358/lite-20260627.htm) |
| AAOI | Annual: 2025-12-31 → 2025-12-31 | USD | Withheld | 0.00 | [2026-02-26](https://www.sec.gov/Archives/edgar/data/1158114/000143774926005875/aaoi20251231_10k.htm) |
| AAOI | TTM: 2026-06-30 → 2026-06-30 | USD | 0.00 | 0.00 | [2026-08-06](https://www.sec.gov/Archives/edgar/data/1158114/000143774926026278/aaoi20260630_10q.htm) |
| NBIS | Annual: 2025-12-31 → 2025-12-31 | USD | Withheld | 0.00 | [2026-04-30](https://www.sec.gov/Archives/edgar/data/1513845/000110465926052948/nbis-20251231x20f.htm) |
| NBIS | TTM: 2026-06-30 → 2026-06-30 | USD | Withheld | 0.00 | [2026-08-12](https://www.sec.gov/Archives/edgar/data/1513845/000110465926094844/nbis-20260812xex99d2.htm) |
| MU | Annual: 2026-09-03 → 2026-09-03 | USD | 413.3206 | 433.8779 | [2026-10-09](https://www.sec.gov/Archives/edgar/data/723125/000072312526000023/mu-20260903.htm) |
| AVGO | Annual: 2025-11-02 → 2025-11-02 | USD | Withheld | 219.8411 | [2025-12-18](https://www.sec.gov/Archives/edgar/data/1730168/000173016825000121/avgo-20251102.htm) |
| AVGO | TTM: 2026-08-02 → 2026-08-02 | USD | 268.2269 | 259.246 | [2026-09-10](https://www.sec.gov/Archives/edgar/data/1730168/000173016826000080/avgo-20260802.htm) |
| TSM | Annual: 2025-12-31 → 2025-12-31 | TWD | Withheld | 1,519.6428 | [2026-04-16](https://www.sec.gov/Archives/edgar/data/1046179/000162828026025362/tsm-20251231.htm) |
| TSM | TTM: 2026-09-30 → 2026-09-30 | TWD | Withheld | 1,756.6231 | [2026-10-15](https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2026-10/3a94d1034b9e6b22446b674f7aaf3d088a12a193/FS.pdf) |
| AMAT | Annual: 2025-10-26 → 2025-10-26 | USD | 186.117 | 186.117 | [2025-12-12](https://www.sec.gov/Archives/edgar/data/6951/000162828025056742/amat-20251026.htm) |
| AMAT | TTM: 2026-07-26 → 2026-07-26 | USD | 197.8882 | 197.8882 | [2026-08-20](https://www.sec.gov/Archives/edgar/data/6951/000162828026058235/amat-20260726.htm) |
| AMD | Annual: 2025-12-27 → 2025-12-27 | USD | 210.5902 | 210.5902 | [2026-02-04](https://www.sec.gov/Archives/edgar/data/2488/000000248826000018/amd-20251227.htm) |
| AMD | TTM: 2026-06-27 → 2026-06-27 | USD | 222.9508 | 222.9508 | [2026-08-05](https://www.sec.gov/Archives/edgar/data/2488/000000248826000123/amd-20260627.htm) |
| ARM | Annual: 2026-03-31 → 2026-03-31 | USD | 26.8775 | 26.8775 | [2026-05-26](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000097/arm-20260331.htm) |
| ARM | TTM: 2026-06-30 → 2026-06-30 | USD | 27.6383 | 27.6383 | [2026-07-29](https://www.sec.gov/Archives/edgar/data/1973239/000197323926000114/arm-20260630.htm) |
| ASML | Annual: 2025-12-31 → 2025-12-31 | EUR | 670.7337 | 670.7337 | [2026-02-25](https://www.sec.gov/Archives/edgar/data/937966/000162828026011378/asml-20251231.htm) |
| ASML | TTM: 2026-09-27 → 2026-09-27 | EUR | 681.0461 | 680.9887 | [2026-10-14](https://www.sec.gov/Archives/edgar/data/937966/000162828026065813/form6-kquarterlyfilings.htm) |
| CAMT | Annual: 2025-12-31 → 2025-12-31 | USD | 58.8227 | 58.8227 | [2026-03-19](https://www.sec.gov/Archives/edgar/data/1109138/000117891326001561/zk2634678.htm) |
| CAMT | TTM: 2026-06-30 → 2026-06-30 | USD | 61.7845 | 63.7151 | [2026-08-10](https://www.sec.gov/Archives/edgar/data/1109138/000117891326003975/zk2635905.htm) |
| CDNS | Annual: 2025-12-31 → 2025-12-31 | USD | 85.6089 | 85.6089 | [2026-02-19](https://www.sec.gov/Archives/edgar/data/813672/000081367226000016/cdns-20251231.htm) |
| CDNS | TTM: 2026-06-30 → 2026-06-30 | USD | 80.6746 | 80.6746 | [2026-07-29](https://www.sec.gov/Archives/edgar/data/813672/000081367226000092/cdns-20260630.htm) |
| CEVA | Annual: 2025-12-31 → 2025-12-31 | USD | 14.0564 | 14.0564 | [2026-02-27](https://www.sec.gov/Archives/edgar/data/1173489/000143774926006091/ceva20251231_10k.htm) |
| CEVA | TTM: 2026-06-30 → 2026-06-30 | USD | 13.9333 | 13.9333 | [2026-08-10](https://www.sec.gov/Archives/edgar/data/1173489/000143774926026774/ceva20260630_10q.htm) |
| CRDO | Annual: 2026-05-02 → 2026-05-02 | USD | 82.2207 | 82.2207 | [2026-06-15](https://www.sec.gov/Archives/edgar/data/1807794/000162828026043303/crdo-20260502.htm) |
| CRDO | TTM: 2026-08-01 → 2026-08-01 | USD | 78.4919 | 78.4919 | [2026-09-02](https://www.sec.gov/Archives/edgar/data/1807794/000162828026060111/crdo-20260801.htm) |
| FN | Annual: 2026-06-26 → 2026-06-26 | USD | 197.3543 | 197.3543 | [2026-08-18](https://www.sec.gov/Archives/edgar/data/1408710/000140871026000028/fn-20260626.htm) |
| KEYS | Annual: 2025-10-31 → 2025-10-31 | USD | 124.7365 | 124.7365 | [2025-12-17](https://www.sec.gov/Archives/edgar/data/1601046/000160104625000127/keys-20251031.htm) |
| KEYS | TTM: 2026-07-31 → 2026-07-31 | USD | 132.9325 | 132.9325 | [2026-09-02](https://www.sec.gov/Archives/edgar/data/1601046/000160104626000036/keys-20260731.htm) |
| KLAC | Annual: 2026-06-30 → 2026-06-30 | USD | 67.166 | 67.166 | [2026-08-06](https://www.sec.gov/Archives/edgar/data/319201/000031920126000027/klac-20260630.htm) |
| LRCX | Annual: 2026-06-28 → 2026-06-28 | USD | 100.1254 | 100.1254 | [2026-08-07](https://www.sec.gov/Archives/edgar/data/707549/000070754926000037/lrcx-20260628.htm) |
| MCD | Annual: 2025-12-31 → 2025-12-31 | USD | 193.5258 | 193.5258 | [2026-02-24](https://www.sec.gov/Archives/edgar/data/63908/000006390826000035/mcd-20251231.htm) |
| MCD | TTM: 2026-06-30 → 2026-06-30 | USD | 201.269 | 201.269 | [2026-08-07](https://www.sec.gov/Archives/edgar/data/63908/000006390826000073/mcd-20260630.htm) |
| MRVL | Annual: 2026-01-31 → 2026-01-31 | USD | 105.3764 | 105.3764 | [2026-03-11](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000011/mrvl-20260131.htm) |
| MRVL | TTM: 2026-08-01 → 2026-08-01 | USD | 105.3559 | 105.3559 | [2026-08-28](https://www.sec.gov/Archives/edgar/data/1835632/000183563226000025/mrvl-20260801.htm) |
| NFLX | Annual: 2025-12-31 → 2025-12-31 | USD | 54.9076 | 54.9076 | [2026-01-23](https://www.sec.gov/Archives/edgar/data/1065280/000106528026000034/nflx-20251231.htm) |
| NFLX | TTM: 2026-06-30 → 2026-06-30 | USD | 57.9712 | 57.9712 | [2026-07-17](https://www.sec.gov/Archives/edgar/data/1065280/000106528026000212/nflx-20260630.htm) |
| NVMI | Annual: 2025-12-31 → 2025-12-31 | USD | 136.0536 | 136.0536 | [2026-02-17](https://www.sec.gov/Archives/edgar/data/1109345/000117891326000504/zk2634307.htm) |
| NVMI | TTM: 2026-06-30 → 2026-06-30 | USD | 142.9439 | 149.2379 | [2026-08-06](https://www.sec.gov/Archives/edgar/data/1109345/000117891326003892/zk2635873.htm) |
| ONTO | Annual: 2026-01-03 → 2026-01-03 | USD | 119.3444 | 119.3444 | [2026-02-24](https://www.sec.gov/Archives/edgar/data/704532/000119312526066937/onto-20260103.htm) |
| ONTO | TTM: 2026-06-30 → 2026-06-30 | USD | 109.0434 | 109.0434 | [2026-08-06](https://www.sec.gov/Archives/edgar/data/704532/000119312526338401/onto-20260630.htm) |
| RMBS | Annual: 2025-12-31 → 2025-12-31 | USD | 40.8324 | 40.8324 | [2026-02-18](https://www.sec.gov/Archives/edgar/data/917273/000119312526057101/rmbs-20251231.htm) |
| RMBS | TTM: 2026-06-30 → 2026-06-30 | USD | 42.5866 | 42.5866 | [2026-07-28](https://www.sec.gov/Archives/edgar/data/917273/000119312526321000/rmbs-20260630.htm) |
| SNDK | Annual: 2026-07-03 → 2026-07-03 | USD | 455.0551 | 455.0551 | [2026-08-17](https://www.sec.gov/Archives/edgar/data/2023554/000162828026057406/sndk-20260703.htm) |
| SNPS | Annual: 2025-10-31 → 2025-10-31 | USD | 146.3854 | 146.3854 | [2025-12-22](https://www.sec.gov/Archives/edgar/data/883241/000088324125000028/snps-20251031.htm) |
| SNPS | TTM: 2026-07-31 → 2026-07-31 | USD | 177.9443 | 177.9443 | [2026-08-26](https://www.sec.gov/Archives/edgar/data/883241/000088324126000025/snps-20260731.htm) |
| UBER | Annual: 2025-12-31 → 2025-12-31 | USD | 82.7039 | 82.7039 | [2026-02-13](https://www.sec.gov/Archives/edgar/data/1543151/000154315126000015/uber-20251231.htm) |
| UBER | TTM: 2026-06-30 → 2026-06-30 | USD | 83.9524 | 83.9524 | [2026-08-05](https://www.sec.gov/Archives/edgar/data/1543151/000154315126000032/uber-20260630.htm) |
| UMC | Annual: 2025-12-31 → 2025-12-31 | TWD | 65.7394 | 65.7394 | [2026-04-30](https://www.sec.gov/Archives/edgar/data/1033767/000119312526193757/d91630d20f.htm) |
| UMC | TTM: 2026-06-30 → 2026-06-30 | TWD | 74.1204 | 74.1204 | [2026-07-29](https://www.sec.gov/Archives/edgar/data/1033767/000119312526322030/umc-ex99_1.htm) |

## Per-company fills, coverage and remaining gaps

Coverage counts are available ratios out of the displayed annual years. A loss tax year, nonpositive capital or no increase in capital can correctly make a ratio unavailable even when the underlying facts exist. All available ratios have explicit numerator, denominator, formula, source URLs and dated prior periods.

### AAPL

Bases: annual 2025-09-27 → 2025-09-27; TTM 2026-06-27 → 2026-06-27.

- annual-reference: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, financeLeaseLiabilityTotal, cash, debt; period-matched additional assets/claims where disclosed.
- ttm: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, cash, debt; period-matched additional assets/claims where disclosed.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 4/10 |
| ROIC | 10/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Debt includes a proxy: June borrowings of $84,344 million plus the last reported finance-lease liability of $1,230 million from September 2025. June lease debt is not separately disclosed. A $0–2,460 million lease scenario moves value by only ±$0.0834 per share; this range is a sensitivity, not a verified bound.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; debt — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### MSFT

Bases: annual 2026-06-30 → 2026-06-30.

- annual-reference: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, financeLeaseLiabilityTotal, cash, debt; period-matched additional assets/claims where disclosed.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 10/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference null filing fields: preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### AMZN

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- annual-reference: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, financeLeaseLiabilityTotal, cash, debt; period-matched additional assets/claims where disclosed.
- ttm: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, financeLeaseLiabilityTotal, cash, debt; period-matched additional assets/claims where disclosed.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 9/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 10/10 |
| ROIC | 9/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference: Technology and infrastructure expense is broader than R&D; unreported R&D is null, not zero.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Technology and infrastructure expense is broader than R&D; unreported R&D is null, not zero.
- ttm: The $21.3 billion OpenAI commitment paid after June is not a June cash deduction or a second June investment asset. Undrawn Anthropic capacity is a future funding commitment.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### GOOG

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- annual-reference: Date-matched capital and award facts reviewed against the filed document.
- ttm: Date-matched capital and award facts reviewed against the filed document.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 10/10 |
| ROIC | 10/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: longTermDebtTotal — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### META

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- annual-reference: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, financeLeaseLiabilityTotal, cash, debt; period-matched additional assets/claims where disclosed.
- ttm: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, cash, debt; period-matched additional assets/claims where disclosed.
- Filled missing historical debt/capital mappings and recomputed affected ratios.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 10/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Debt includes a proxy: June borrowings of $83,664 million plus the December 2025 finance-lease liability of $1,184 million. June lease debt is not separately disclosed. A $0–2,368 million lease scenario moves value by ±$0.4394 per share. Even a $9,467 million stress assumption, equal to gross finance-lease assets rather than a liability measurement, lowers value by $3.07 per share versus the proxy.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtCurrent — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtCurrent — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; debt — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### NVDA

Bases: annual 2026-01-25 → 2026-01-25; TTM 2026-07-26 → 2026-07-26.

- annual-reference: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, cash, debt; period-matched additional assets/claims where disclosed.
- ttm: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, cash, debt; period-matched additional assets/claims where disclosed.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 7/10 |
| ROIC | 8/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### TSLA

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- annual-reference: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, financeLeaseLiabilityTotal, cash, debt, optionsOutstanding, optionsWeightedAverageExercisePrice, optionsWeightedAverageRemainingTerm, optionsAggregateIntrinsicValue; period-matched additional assets/claims where disclosed.
- ttm: refreshed periodEndShares, unvestedNonOptionAwards, shares, cashAndEquivalents, cash, debt, optionsOutstanding, optionsAggregateIntrinsicValue; period-matched additional assets/claims where disclosed.
- Filled missing historical debt/capital mappings and recomputed affected ratios.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 6/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 5/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference: Musk’s old options and 96 million interim shares are reconciled once; June exercise is already inside common shares. The 423.7 million performance award has a $334.09 per-share offset and is modeled as a full-vesting vanilla-call proxy instead of free common stock. This conservative proxy includes time value but ignores milestone and service restrictions. Employee awards use a small, explicitly estimated dilution buffer; June is not a reported award inventory.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Musk’s old options and 96 million interim shares are reconciled once; June exercise is already inside common shares. The 423.7 million performance award has a $334.09 per-share offset and is modeled as a full-vesting vanilla-call proxy instead of free common stock. This conservative proxy includes time value but ignores milestone and service restrictions. Employee awards use a small, explicitly estimated dilution buffer; June is not a reported award inventory.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtCurrent — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtNoncurrent — not mapped separately in the supplied filing evidence; not assumed zero; shares — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtCurrent — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtNoncurrent — not mapped separately in the supplied filing evidence; not assumed zero; shares — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; unvestedNonOptionAwards — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; optionsAggregateIntrinsicValue — not mapped separately in the supplied filing evidence; not assumed zero

### COHR

Bases: annual 2026-06-30 → 2026-06-30.

- annual-reference: Date-matched capital and award facts reviewed against the filed document.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 7/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 7/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference: EBIT is a reconstructed subtotal, not reported: excludes other income net and interest; includes business-sale gain. Review classification and normalization.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### LITE

Bases: annual 2026-06-27 → 2026-06-27.

- annual-reference: Date-matched capital and award facts reviewed against the filed document.
- Filled missing historical debt/capital mappings and recomputed affected ratios.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 4/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 8/10 |
| ROIC | 3/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtTotal — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — Economic interest included as 2.9m as-converted shares, not a separate cash preferred claim.; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### AAOI

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- annual-reference: Date-matched capital and award facts reviewed against the filed document.
- ttm: Date-matched capital and award facts reviewed against the filed document.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 2/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 6/10 |
| ROIC | 1/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtTotal — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### NBIS

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- annual-reference: Date-matched parent and subsidiary award evidence supplied. Later financing alone does not invalidate the base; the unresolved Avride subsidiary claim and model validation retain the gate.
- ttm: Date-matched parent and subsidiary award evidence supplied. Later financing alone does not invalidate the base; the unresolved Avride subsidiary claim and model validation retain the gate.

History: **3 displayed annual rows**; opening observation: none. Only three comparable FY2025-recast continuing-operations years are available; older Yandex totals are not substituted.

| Metric | Available years |
|---|---:|
| Growth | 2/3 |
| Margin | 3/3 |
| Tax | 1/3 |
| Sales / capital | 2/3 |
| Incremental sales / capital | 1/3 |
| ROIC | 0/3 |

- FY2023: bookEquity — FY2023 balance sheet is disclosed in FY2024 20-F but includes disposed Yandex net assets and predates FY2025 TripleTen recast; comparable current-business book capital is not verified.; cashAndEquivalents — FY2023 balance sheet is disclosed in FY2024 20-F but includes disposed Yandex net assets and predates FY2025 TripleTen recast; comparable current-business book capital is not verified.; mappedDebt — FY2023 balance sheet is disclosed in FY2024 20-F but includes disposed Yandex net assets and predates FY2025 TripleTen recast; comparable current-business book capital is not verified.
- annual-reference: This is a dated capital reference. Later financing does not itself block this base and is not mixed into its cash, debt or shares.
- annual-reference: Nebius uses dated continuing operations and a separate ownership-claims model. The displayed default is a slow-transition funding stress, not management guidance or an economically validated fair-value estimate.
- annual-reference: Dated parent shares and awards are disclosed, but the period-end value of Avride subsidiary employee options and awards is not reconciled to the parent common-equity bridge. Subsidiary awards cannot be added to Nebius common shares; a separately supported subsidiary claim treatment is required.
- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: This is a dated capital reference. Later financing does not itself block this base and is not mixed into its cash, debt or shares.
- ttm: Nebius uses dated continuing operations and a separate ownership-claims model. The displayed default is a slow-transition funding stress, not management guidance or an economically validated fair-value estimate.
- ttm: Dated parent shares and awards are disclosed, but the period-end value of Avride subsidiary employee options and awards is not reconciled to the parent common-equity bridge. Subsidiary awards cannot be added to Nebius common shares; a separately supported subsidiary claim treatment is required.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference null filing fields: preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; avrideEmployeeAwardClaimValue — Dated parent shares and awards are disclosed, but the period-end value of Avride subsidiary employee options and awards is not reconciled to the parent common-equity bridge. Subsidiary awards cannot be added to Nebius common shares; a separately supported subsidiary claim treatment is required.
- ttm null filing fields: preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; avrideEmployeeAwardClaimValue — Dated parent shares and awards are disclosed, but the period-end value of Avride subsidiary employee options and awards is not reconciled to the parent common-equity bridge. Subsidiary awards cannot be added to Nebius common shares; a separately supported subsidiary claim treatment is required.

### MU

Bases: annual 2026-09-03 → 2026-09-03.

- annual-reference: Date-matched capital and award facts reviewed against the filed document.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 9/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 10/10 |
| ROIC | 9/10 |

- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference: Debt includes finance lease obligations; do not add finance leases a second time.
- annual-reference null filing fields: longTermDebtCurrent — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtNoncurrent — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### AVGO

Bases: annual 2025-11-02 → 2025-11-02; TTM 2026-08-02 → 2026-08-02.

- annual-reference: FY2025 carrying debt repaired from the audited balance sheet; missing RSU count supplied. Remaining options, investments, and claim categories retain unknown status where not verified.
- ttm: Date-matched capital and award facts reviewed against the filed document.
- Filled missing historical debt/capital mappings and recomputed affected ratios.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 9/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 6/10 |
| ROIC | 5/10 |

- annual-reference: No separate annual closing corporate investment subtotal was verified. The conditional model omits this unquantified asset and uses a zero additional-asset adjustment; this is a modeling omission, not a reported zero investment balance. Other long-term assets mix categories, investment purchases/sales are flows, and pension-plan assets are excluded.
- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; longTermDebtTotal — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; longTermInvestments — The annual filing does not separately quantify a closing corporate investment balance within other long-term assets. Investment purchases and sales are cash flows, and pension-plan assets are not available corporate investments. The additional-investment amount remains unknown rather than being assumed zero.
- ttm null filing fields: otherLongTermInvestments — not mapped separately in the supplied filing evidence; not assumed zero; noncontrollingInterest — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero; nonOptionAwardsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### TSM

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-09-30 → 2026-09-30.

- annual-reference: Annual native TWD ordinary-share denominator verified against the audited 20-F cover. This evidence does not resolve all leases, award claims, or USD/ADR quote conversion.
- ttm: Native TWD ordinary-share denominator verified in filed Q3 presentation slide 6 at issuer rounding precision. September lease and award details remain incomplete; this does not verify USD/ADR quote conversion.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 10/10 |
| ROIC | 10/10 |

- annual-reference: Native TWD statements and ordinary shares; USD/ADR quote conversion is not implemented in this extraction. Annual reference is superseded by Q3 2026.
- annual-reference: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- annual-reference: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- annual-reference: Reporting currency differs from USD quote currency; verified FX and ADR conversion must be applied before per-share comparison.
- ttm: Native TWD financials and ordinary shares must not be combined directly with USD/ADR quote. Explicit period-aware FX conversion and ADR denominator required.
- ttm: September 2026 SBC and lease liabilities not separately disclosed in preliminary statements; do not assume zero.
- ttm: Q3 figures are preliminary and stated not yet approved by the Board in Oct 15 SEC earnings release.
- ttm: Reconcile mapped debt, lease liabilities, preferred/noncontrolling interests, outstanding awards and subsequent events before final equity value.
- ttm: No verified current market quote; price-dependent conclusions require a dated same-basis quote.
- ttm: Reporting currency differs from USD quote currency; verified FX and ADR conversion must be applied before per-share comparison.
- annual-reference null filing fields: preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: operatingCashFlow — not mapped separately in the supplied filing evidence; not assumed zero; preferredEquity — not mapped separately in the supplied filing evidence; not assumed zero

### AMAT

Bases: annual 2025-10-26 → 2025-10-26; TTM 2026-07-26 → 2026-07-26.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 8/10 |
| ROIC | 10/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm carried disclosures: options (2025-10-26): 10-Q does not restate option status; the 10-K states no stock options outstanding and the 10-Q equity note describes only RSU/PSU awards

### AMD

Bases: annual 2025-12-27 → 2025-12-27; TTM 2026-06-27 → 2026-06-27.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 9/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 4/10 |

- annual-reference: Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.
- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm: Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.
- annual: OpenAI warrant: up to 160M shares at $0.01, exercisable through 2030-10-05 value undisclosed. fair value NOT disclosed; 10-K states the issuance had no impact on the financial statements and no warrant shares met vesting or exercise conditions at 2025-12-27. Vests in tranches on OpenAI/affiliate AMD Instinct GPU purchase milestones (6 GW deployment, first 1 GW on MI450), specified AMD stock price targets and stock performance; each vested tranche further subject to technical and commercial conditions. To be accounted for as a liability until equity-classification conditions are met. Value is null because no fair value is disclosed; this does not imply zero economic worth (up to 160M shares is about 9.8% of shares outstanding).
- ttm carried disclosures: unvestedRSUs (2025-12-27): 10-Q has no unvested RSU/PRSU table; 33M time-based + 2M PRSU at December 27, 2025 carried; options (2025-12-27): 10-Q has no option table; 2M options, $117.60 weighted exercise price, 4.17 years, $77M intrinsic value at December 27, 2025 carried
- ttm: OpenAI warrant: up to 160M shares at $0.01, exercisable through 2030-10-05 value undisclosed. fair value NOT disclosed; filing states no warrant tranches had vested or become exercisable at 2026-06-27 and the warrants had no impact on the financial statements (liability-classified until equity conditions are met). Tranches tied to OpenAI GPU purchase milestones, AMD stock price targets and stock-performance thresholds, plus technical and commercial conditions. Value is null because no filing-date fair value is disclosed.
- ttm: Meta warrant: up to 160M shares at $0.01, issued February 2026 (2026-02-23), exercisable through 2031-02-23 value undisclosed. fair value NOT disclosed; no tranches vested or exercisable at 2026-06-27; no impact on financial statements. Vests in tranches on Meta GPU purchase milestones (6 GW agreement, first 1 GW on MI450 + 6th Gen EPYC) and specified AMD stock price and/or performance conditions. Together with the OpenAI warrant up to 320M shares (about 19.6% of shares outstanding). Value is null because no filing-date fair value is disclosed.

### ARM

Bases: annual 2026-03-31 → 2026-03-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **6 displayed annual rows**; opening observation: none. Six comparable fiscal years (FY2021–FY2026) are available in the modern USD US-GAAP IPO/20-F financial statements. Earlier Arm plc IFRS/GBP years and SoftBank segment figures are not spliced into this history. FY2021–FY2024 full finance-lease debt was not separately disclosed in the audited statements reviewed; capital ratios remain unavailable for affected years.

| Metric | Available years |
|---|---:|
| Growth | 5/6 |
| Margin | 6/6 |
| Tax | 6/6 |
| Sales / capital | 2/6 |
| Incremental sales / capital | 1/6 |
| ROIC | 1/6 |

- FY2021: mappedDebt — Complete interest-bearing debt, including finance leases, is not separately disclosed for this annual date.
- FY2022: mappedDebt — Complete interest-bearing debt, including finance leases, is not separately disclosed for this annual date.
- FY2023: mappedDebt — Complete interest-bearing debt, including finance leases, is not separately disclosed for this annual date.
- FY2024: mappedDebt — Complete interest-bearing debt, including finance leases, is not separately disclosed for this annual date.
- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- annual-reference null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm carried disclosures: debtNoncurrent (2026-03-31): 6-K does not split the non-current finance lease liability (Other non-current liabilities table shows EDA 92 and 'Other' 49, where 49 includes the undisclosed non-current finance lease portion). 34 is the March 31, 2026 non-current finance lease liability from the 20-F lease note. Q1 FY2027 had no new finance-lease additions (non-cash additions: nil), so the liability can only have fallen; 34 is an upper bound and cannot exceed the 49 shown for all other non-current liabilities.

### ASML

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-09-27 → 2026-09-27.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 7/10 |
| ROIC | 10/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm: Debt uses an explicitly estimated cash-flow bridge: June borrowings of €3,719.7 million plus €16.5 million of carried finance leases, less €1,000.4 million of Q3 repayments, gives €2,735.8 million. Hedge, currency and amortization changes are not reconciled. Testing current debt from zero to the June balance and leases from zero to twice the annual balance changes value by +€2.01/−€2.59 per share. The June share count and annual awards remain carried estimates.
- ttm: A cash or debt component is not disclosed for this base. The equity bridge is withheld rather than treating the missing amount as zero.
- ttm null filing fields: debtCurrent — Current debt not separately disclosed. Prior 734.2 cash-flow bridge removed: repayments cannot establish carrying value because currency, hedge and amortization movements are not supplied.; debt — Only disclosed quantities are included; see carriedFrom and reviewRequired for unresolved amounts.
- ttm: unknown debtCurrent. US GAAP basis. Q3 2026 results are furnished on 6-K (Ex.99.3 summary financial statements, Ex.99.1 press release) filed 2026-10-14; period ends Sep 27 2026 (Q3) and Sep 28 2025 (prior). The 6-K balance sheet has no current debt split, no share count, no awards/options, no lease liabilities - see carriedFrom. Cash 8,030.9 + short-term investments 4,704.2 = 12,735.1 matches press release (12,735). Interim dividend EUR 1.88/share payable 2026-11-04 is not accrued. Customer advances (contract liabilities 9,300.6 non-current plus current) are operating. Current debt is null: the summary statements aggregate current liabilities and the earlier 734.2 estimate was not a filed amount. Q3 slides disclose only approximately 2.8 million repurchased shares; no exact period-end outstanding share count, so the June 28 count remains explicitly carried.
- ttm carried disclosures: debtNoncurrent (2025-12-31): Long-term debt 1,963.0 is from the Q3 6-K; the 16.5 finance lease liability is carried from the 20-F Note 14 (6-K does not report it).; operatingLeaseLiabilities (2025-12-31): 6-K summary balance sheet does not show lease liabilities; carried from 20-F Note 14 (251.4 total less 16.5 finance lease).; sharesOutstanding (2026-06-28): No Sep 27 2026 share count is filed on the SEC. Latest SEC-filed count is 384.1m (rounded to 0.1m) at Jun 28 2026 in the Statutory Interim Report (Ex.99.4 to the 6-K of 2026-07-15), Statement of Changes in Equity. ASML bought ~2.8m shares in Q3 (Q3 slides p.11), so Sep 27 count is roughly 381.3m (derived estimate, NOT used). Cash at Sep 27 already reflects that buyback.; unvestedRSUs (2025-12-31): 6-K does not report conditional share counts; carried from 20-F Note 20 (331,366 EUR + 447,341 USD).; options (2025-12-31): 6-K does not report options; carried from 20-F Note 20.

### CAMT

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 9/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 9/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm: Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.
- ttm carried disclosures: debtCurrent (2025-12-31): 6-K does not split finance lease liabilities; Dec 31 2025 Note 13.B current finance lease 341 carried; debtNoncurrent (2025-12-31): Convertible notes 488,497 is from the 6-K; noncurrent finance lease 4,983 (Note 13.B / Note 11) is carried from the 20-F because the 6-K does not disclose it; operatingLeaseLiabilities (2025-12-31): 6-K does not disclose lease liabilities; Note 13.A total 5,636 carried; unvestedRSUs (2025-12-31): 6-K does not disclose RSU awards; Note 15.C 649,397 carried (stale: some vested in H1 2026; net share count rose 840,056); options.count (2025-12-31): 6-K does not disclose options; Note 15.B 23,909 carried; options.weightedExercisePrice (2025-12-31): carried from 20-F Note 15.B; options.weightedRemainingYears (2025-12-31): carried from 20-F Note 15.B (not rolled forward 6 months); options.aggregateIntrinsicValue (2025-12-31): Dec 31 2025 intrinsic value (1.388) not valid at June 30 2026 price; set null rather than carried; convertibles.principal (2025-09-16): 6-K does not give note detail; 2030 Notes principal 500,000 unchanged per 20-F Note 12; convertibles.conversionPrice (2025-12-31): conversion price $109.34 from 20-F Note 12.B
- ttm: 0.00% Convertible Senior Notes due 2030 (Sep 2025 issue) fair value undisclosed; no current premium inferred.

### CDNS

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 9/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm carried disclosures: unvestedRSUs (2025-12-31): 10-Q does not disclose unvested restricted stock counts (only unrecognized expense 970.8m); stale: 1.749m shares were issued under equity plans in H1 2026; options (2025-12-31): 10-Q does not disclose option counts, exercise price or intrinsic value; stale; operatingLeaseLiabilities (2025-12-31): 10-Q gives only the non-current operating lease liability (169.159); the current portion (49.889 at Dec 31, 2025, inside Accounts payable and accrued liabilities) is carried from the 10-K to approximate the total

### CEVA

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 6/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 5/10 |

No remaining required history-field nulls. Remaining valuation approximations are documented in the source notes.

### CRDO

Bases: annual 2026-05-02 → 2026-05-02; TTM 2026-08-01 → 2026-08-01.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **7 displayed annual rows**; opening observation: none. Fewer than ten annual periods have sourced evidence on this accounting basis; older or different businesses are not substituted.

| Metric | Available years |
|---|---:|
| Growth | 6/7 |
| Margin | 7/7 |
| Tax | 3/7 |
| Sales / capital | 5/7 |
| Incremental sales / capital | 4/7 |
| ROIC | 2/7 |

No remaining required history-field nulls. Remaining valuation approximations are documented in the source notes.

### FN

Bases: annual 2026-06-26 → 2026-06-26.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 10/10 |
| ROIC | 10/10 |

- annual-reference null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### KEYS

Bases: annual 2025-10-31 → 2025-10-31; TTM 2026-07-31 → 2026-07-31.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 7/10 |
| ROIC | 9/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- annual-reference null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm carried disclosures: unvestedRSUs (2025-10-31): The Q3 FY2026 10-Q does not disclose an unvested RSU/performance-share rollforward; carried from the FY2025 10-K non-vested awards table

### KLAC

Bases: annual 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 8/10 |
| ROIC | 10/10 |

- annual-reference: Noncurrent investments exist but their separate carrying amount is unavailable. No value is added for this unquantified asset; this is an omission, not a reported zero.
- annual-reference null filing fields: longTermInvestments — Unknown noncurrent strategic equity investment carrying amount; previous zero was unsupported.; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- annual: unknown longTermInvestments. Fiscal year ends June 30; 10-K filed 2026-08-06. All share data is post 10-for-1 stock split effective 2026-06-11 (earlier 10-Qs and EDGAR dei values before Aug 2026 are pre-split, e.g. 131.08m). Operating income is derived (KLA reports no operating income line; same derivation as reviewed research package: 5,660.78). No stock options outstanding disclosed (RSUs only), no convertibles, no preferred, no NCI. Long-term investments set to 0: privately held equity investments, if any, are not separately disclosed (inside Other non-current assets 175.2 per Note 4); marketable equity securities (~46.8) are inside current marketable securities. Operating lease liabilities excluded from debt. Non-marketable equity securities are included in Other non-current assets under Note 1, but their carrying balance is not separately quantified; longTermInvestments is unknown, not zero.
- ttm: unknown longTermInvestments. Latest filing on or before 2026-10-21 is the FY2026 10-K (fiscal year ended 2026-06-30); the first-quarter FY2027 10-Q (quarter ending 2026-09-30) was not yet filed (KLA filed Q1 10-Q on 2025-10-31 last year). TTM therefore equals the annual snapshot with zero YTD components. Fiscal year ends June 30; 10-K filed 2026-08-06. All share data is post 10-for-1 stock split effective 2026-06-11 (earlier 10-Qs and EDGAR dei values before Aug 2026 are pre-split, e.g. 131.08m). Operating income is derived (KLA reports no operating income line; same derivation as reviewed research package: 5,660.78). No stock options outstanding disclosed (RSUs only), no convertibles, no preferred, no NCI. Long-term investments set to 0: privately held equity investments, if any, are not separately disclosed (inside Other non-current assets 175.2 per Note 4); marketable equity securities (~46.8) are inside current marketable securities. Operating lease liabilities excluded from debt. Non-marketable equity securities are included in Other non-current assets under Note 1, but their carrying balance is not separately quantified; longTermInvestments is unknown, not zero.

### LRCX

Bases: annual 2026-06-28 → 2026-06-28.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 8/10 |
| ROIC | 10/10 |

No remaining required history-field nulls. Remaining valuation approximations are documented in the source notes.

### MCD

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 9/10 |
| ROIC | 10/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm carried disclosures: debtCurrent (2025-12-31): The 10-Q reports only total lease liability (690 current + 14,039 noncurrent = 14,729); the finance/operating split is disclosed only in the 10-K lease footnote. Finance lease current 23 carried from Dec 31 2025.; debtNoncurrent (2025-12-31): Long-term debt 39,863 is from the Jun 30 2026 balance sheet; the added finance lease noncurrent 2,329 is carried from the Dec 31 2025 lease footnote because the 10-Q has no split.; operatingLeaseLiabilities (2025-12-31): Derived as June total lease liability 14,729 minus carried Dec 31 2025 finance lease liability 2,352 = 12,377; the 10-Q does not split operating vs finance. Treat as approximate (finance leases grew in 2025 by new leases of 468 ROU assets).; unvestedRSUs (2025-12-31): 10-Q has no RSU table; latest disclosure is the FY2025 10-K Item 12 (1,164,094).; options (2025-12-31): 10-Q has no option table; latest disclosure is the FY2025 10-K (8,782,269 options; strike 228.19; 5.3 yrs; intrinsic 682 at the Dec 31 2025 price, stale).

### MRVL

Bases: annual 2026-01-31 → 2026-01-31; TTM 2026-08-01 → 2026-08-01.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2016.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 5/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 5/10 |
| ROIC | 3/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm: Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.
- annual-reference null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm carried disclosures: unvestedRSUs (2026-01-31): The Q2 FY2027 10-Q has no equity-compensation award table; 12.2M time-based + 4.8M performance (target) unvested at 2026-01-31 carried. The Aug-18-2026 Google warrant exhibit states 30,581,074 shares subject to outstanding options, RSUs and PRSUs (target) in total, after Celestial/XConn assumed awards and new grants, so the carried 17.0M is stale and understates.
- ttm: Google warrant issued 2026-08-18 (post period end, before 10-Q filing): up to 58,970,907 shares at $206.58, expires 2033-08-18 value undisclosed. no fair value or intrinsic value disclosed in any filing; value is null because no fair value is disclosed. Terms: 1,360,867 time-based shares vest quarterly over 12 months; 57,610,040 vest in 240 equal tranches (240,042 shares each, last 240,002) per $500M Google custom-product revenue from fiscal Q3 2027 through fiscal 2033; cash or cashless exercise. Not on the 2026-08-01 balance sheet (subsequent event).

### NFLX

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 8/10 |
| ROIC | 9/10 |

No remaining required history-field nulls. Remaining valuation approximations are documented in the source notes.

### NVMI

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 10/10 |
| ROIC | 10/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm: Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.
- ttm carried disclosures: sharesOutstanding (2026-05-12): Q2 2026 6-K (earnings press release) has no period-end share count; latest filed count is the 2026 AGM proxy (6-K filed 2026-05-14, Exhibit 99.1): 31,806,161 shares as of May 12, 2026. Weighted basic shares for Q2 2026 are 31,800K.; unvestedRSUs (2025-12-31): 6-K does not report RSU counts; latest disclosure is 20-F Note 14 (396,262 at Dec 31 2025). Awards granted/vested/cancelled in H1 2026 are not reflected.; options (2025-12-31): 6-K does not report option counts; 20-F Note 14 (12,879 options, WAEP $45.44, 0.995 years remaining as of Dec 31 2025). Intrinsic value is as of Dec 31 2025 price.; convertibles[0].principal (2025-12-31): 6-K balance sheet shows only carrying value; principal $750M is from 20-F Note 11 (no conversion or repurchase reported; carrying moved 731.680 to 733.588 = amortization of $1.908M per the 6-K cash flow statement); convertibles[0].conversionPrice (2025-12-31): 6-K does not restate terms; 20-F Note 11: 3.1234 shares per $1,000 = approx. $320.16; convertibles[0].maturity (2025-12-31): 6-K does not restate terms; 20-F Note 11: Sept 15 2030
- ttm: 0% Convertible Senior Notes due 2030 fair value undisclosed; no current premium inferred.

### ONTO

Bases: annual 2026-01-03 → 2026-01-03; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 9/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 8/10 |
| ROIC | 7/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- annual-reference null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm carried disclosures: unvestedRSUs (2026-01-03): 10-Q gives only unrecognized RSU cost ($59.4M), not unit counts; 484K carried from FY2025 10-K, not rolled forward; operatingLeaseLiabilities (2026-01-03): 10-Q does not disclose lease liability balances (no material changes except a new HQ lease not yet commenced; ~$36.4M undiscounted payments, no liability recognized at Jun 30 2026)

### RMBS

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 6/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 6/10 |
| ROIC | 4/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm carried disclosures: options (2025-12-31): The Q2 2026 10-Q has no stock option table (options are not discussed beyond the general plan description); latest disclosure is the FY2025 10-K. Count 88,900, strike $12.43, 2.53 years remaining at Dec 31 2025 (about 2.0 years at Jun 30 2026); intrinsic value 7.064M was at the Dec 31 2025 price and is stale.

### SNDK

Bases: annual 2026-07-03 → 2026-07-03.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **5 displayed annual rows**; opening observation: none. Fewer than ten annual periods have sourced evidence on this accounting basis; older or different businesses are not substituted.

| Metric | Available years |
|---|---:|
| Growth | 4/5 |
| Margin | 5/5 |
| Tax | 2/5 |
| Sales / capital | 4/5 |
| Incremental sales / capital | 1/5 |
| ROIC | 1/5 |

- FY2022: mappedDebt — The registration statement reports FY2022 flows, ending cash and parent equity, but no July 1 2022 balance sheet/notes-due-to-parent carrying balance. Borrowings cannot be reconstructed from cash flows alone because noncash/FX changes may apply.
- annual-reference null filing fields: optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero

### SNPS

Bases: annual 2025-10-31 → 2025-10-31; TTM 2026-07-31 → 2026-07-31.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 8/10 |
| ROIC | 8/10 |

- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm carried disclosures: unvestedRSUs (2025-10-31): 10-Q does not disclose RSU counts; carried from FY2025 10-K Note 15 (4.318M), not rolled forward for FY2026 grants/vesting/forfeitures; options (2025-10-31): 10-Q does not disclose option counts; carried from FY2025 10-K Note 15 (aggregate intrinsic value measured at $453.82 Oct-31-2025 price, stale); longTermInvestments (2025-10-31): 10-Q gives marketable equity ($0.684M) but not the non-marketable equity balance; $45.0M carried from the 10-K

### UBER

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 9/10 |
| Margin | 10/10 |
| Tax | 4/10 |
| Sales / capital | 7/10 |
| Incremental sales / capital | 7/10 |
| ROIC | 1/10 |

- FY2015: mappedDebt — Selected balance-sheet data reports only noncurrent debt; current debt and finance/capital lease balances are not separately provided for this date, so exhaustive mapped debt remains unknown.
- FY2016: mappedDebt — Selected balance-sheet data reports only noncurrent debt; current debt and finance/capital lease balances are not separately provided for this date, so exhaustive mapped debt remains unknown.

### UMC

Bases: annual 2025-12-31 → 2025-12-31; TTM 2026-06-30 → 2026-06-30.

- Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.

History: **10 displayed annual rows**; opening observation: FY2015.

| Metric | Available years |
|---|---:|
| Growth | 10/10 |
| Margin | 10/10 |
| Tax | 10/10 |
| Sales / capital | 10/10 |
| Incremental sales / capital | 4/10 |
| ROIC | 9/10 |

- annual-reference: Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.
- ttm: Some share, award, lease or claim inputs come from earlier disclosures. See the source dates; they are not verified period-end amounts.
- ttm: Some dilution or convertible values are undisclosed. The displayed case includes quantified claims only and is not a complete period-end claims valuation.
- annual-reference null filing fields: unvestedNonOptionAwards — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- ttm null filing fields: unvestedNonOptionAwards — not mapped separately in the supplied filing evidence; not assumed zero; optionsOutstanding — not mapped separately in the supplied filing evidence; not assumed zero
- annual: unknown unvestedRSUs. 20-F is prepared under IFRS Accounting Standards as issued by the IASB; the Q1/Q2 2026 6-Ks and the Feb 25 2026 6-K (accession 0001193125-26-068366) use Taiwan-endorsed IFRS (TIFRS), under which the Dec 31 2025 balance sheet differs: equity-method investments NT$48,642,917 thousand (vs 36,869,092 in 20-F), total equity NT$379,855,440 thousand (vs 365,912,172), no treasury stock (20-F: NT$9,803,778 thousand for UMC shares held by associates, 900.9 million shares per Note 6(19)b). Revenue (237,553,199) and operating income (43,948,688) are identical on both bases. This snapshot uses the 20-F as filed. Debt = short-term loans + bonds (incl. exchangeable bonds at redemption amount, net of aggregate discount) + long-term loans; IFRS 16 lease liabilities are reported in operatingLeaseLiabilities and excluded from debt. Short-term investments include current FVTPL, FVOCI and amortized-cost (time deposit) assets. Long-term investments include noncurrent FVTPL/FVOCI and equity-method investments (carrying value, not fair value). Guarantee deposits (customer capacity deposits, NT$39,805,928 thousand noncurrent) are NOT included in debt. UMC has no stock options or warrants; employee restricted stock awards are issued shares already counted in sharesOutstanding (unvested count not disclosed, so unvestedRSUs is null). Exchangeable bond carrying equals the note-table redemption amount; the aggregate bond discount is not allocated by instrument.
- annual: USD zero-coupon exchangeable bonds due 2026-07-07 (exchangeable into NOVATEK shares held by UMC, NOT into UMC shares; non-dilutive to UMC holders) fair value undisclosed; no current premium inferred.
- ttm: unknown unvestedRSUs. Balance sheet, H1 2026 and H1 2025 flows come from the Q2 2026 6-K (Exhibit 99.1, TIFRS-basis, reviewed not audited); the 6-K main document is a cover page (https://www.sec.gov/Archives/edgar/data/1033767/000119312526322030/2026q2_quarterly_reports.htm), the statements are in Exhibit 99.1. FY2025 annual flows come directly from the TIFRS annual report (6-K 0001193125-26-068366, Feb 25 2026, Exhibit 99.1); all three TTM flow components are TIFRS. The separate annual-reference base and annual history remain IASB IFRS. Basis difference: the 20-F balance sheet uses IASB IFRS (UMC shares held by associates treated as treasury stock, lower equity-method carrying), the 6-K uses TIFRS; this affects equity-method carrying (June 30 2026 NT$96,474,468 thousand includes Hsun Chieh at NT$34,229,937 thousand vs NT$12,792,773 thousand at Dec 31 2025 per Q2 6-K Note 6(7)) and equity, not revenue or operating income. H1 2026 includes non-operating gains of NT$26.4bn from associates and NT$8.2bn FVTPL gains, all below operating income and excluded here. Debt excludes IFRS 16 leases (operatingLeaseLiabilities), excludes guarantee deposits (customer capacity deposits NT$40,045,045 thousand, Note 6(28)) and excludes the declared dividend (shown in otherClaims). Treasury shares (30.551 million) are excluded from sharesOutstanding. UMC has no stock options or warrants; restricted stock awards are issued shares already counted. The exchangeable bonds convert into NOVATEK shares held by UMC and matured 2026-07-07 (after period end). ADS ratio: one ADS = five ordinary shares (Note 6(19)a(ii), 20-F cover); 147 million ADSs outstanding at Jun 30 2026.
- ttm carried disclosures: unvestedRSUs (2025-12-31): 6-K does not disclose remaining unvested restricted shares; they are issued shares anyway; null kept; options (2025-12-31): 6-K silent; 20-F Item 10: no outstanding warrants or options to purchase UMC shares
- ttm: USD zero-coupon exchangeable bonds due 2026-07-07 (exchangeable into NOVATEK shares held by UMC, NOT into UMC shares; non-dilutive to UMC holders; matured after period end) fair value undisclosed; no current premium inferred.

## Materiality and ownership resolution

- AAPL: June borrowing plus the last reported finance-lease liability; zero-to-double lease stress changes value by ±$0.0834/share.
- META: analogous lease carry; ±$0.4394/share. A broader gross-lease-asset-sized stress lowers value by $3.07/share, without claiming that assets equal debt.
- ASML: June borrowing rolled forward by Q3 repayments, explicitly allowing unmodeled FX/hedge/amortization effects. Chosen stresses change value by +€2.01/−€2.59/share.
- TSLA: remove annual overlapping 96m interim shares and separate 423.743904m performance shares with their $334.09 offset. June exercised 2018 options are already in issued shares. A full-vesting vanilla-call proxy values time value; employee awards use conservative share proxies. Intrinsic-only and all-free-share stresses remain visible.
- NBIS: convertible fair value replaces carrying value once (annual premium $819.3m; June $12,324.7m), no converted shares added. Parent RSUs and June prefunded warrants enter once; Eigen participating shares were already issued. The June acquisition bridge includes another $24.3m obligation. Avride awards use a labelled $100m scenario reserve, with $0/$1bn stresses; no source establishes a current fair value or a hard bound.
- NBIS operating limits: annual and TTM defaults imply peak cumulative operating cash deficits of about $61.7bn/$69.2bn. A faster margin transition lowers them to $24.6bn/$38.1bn while keeping the existing growth and capital assumptions. Neither is a financing forecast. The current generic path cannot represent the annual-base growth implied by 2026 revenue guidance; do not interpret its zero floor as a credible standalone fair-value estimate.
- Detailed evidence and remaining uncertainties: `claims-resolution/TSLA_REVIEW.md`, `claims-resolution/NBIS_REVIEW.md`, and `audits/resolution-2026-10-21.json`. Original missing source fields are retained; estimates live in the model overlay.

## Validation and review

- The 22 source validators pass with warnings for documented unknown amounts. This is structural validation, not a certification that every claim is valued.
- Both history test files pass after replacing the old 14-company universe/coverage pins with the reviewed 36-company scope; arithmetic and provenance assertions remain active.
- The 64 original targeted current-data, history, Guided-base, explicit-claims and Python checks, plus 7 new proxy/ownership, 8 Guided localization and 16 i18n foundation checks, pass (95 total). Tests run one file at a time with a 2 GB Node heap cap; the whole suite was not run.
- The picker offers only the newest annual and later TTM. Interim/YTD rows and TSM’s incomplete duplicate TIFRS annual row remain in the evidence library but cannot be selected as Guided valuation bases.
- Browser verification and deterministic rebuild results are recorded in `audits/ui-verification-2026-10-21.json` and `audits/rebuild-verification-2026-10-21.json`; the final five-company update is in `audits/resolution-ui-2026-10-21.json` and `audits/resolution-rebuild-2026-10-21.json`.
- Existing user edits and the excluded Year-by-year research files were preserved. No commits or pushes were made.

Primary evidence ledgers: `audits/domestic-2026-10-21.json`, `audits/foreign-2026-10-21.json`, `originals/refresh-checks.json`, `originals/patches.json`, `originals/bridge-supplement.json`. Detailed original-company review: `originals/REVIEW_NOTES.md`.

<!-- guided-additions-update -->

## Requested company additions — 2026-10-21

The refresh above covers the original 36-company scope. A subsequent request added 14 companies, bringing Guided to **50 companies and 90 selectable bases**. MCD and MRVL were already present and were left unchanged. See [ADDITIONS_REPORT.md](ADDITIONS_REPORT.md) for the new companies, source dates, model treatments, history coverage, values and validation.

<!-- guided-next-four-update -->

## Follow-up additions — ORCL, DELL, ALAB, ADBE

These four companies have now been added to Guided, bringing the current total to 54 companies and 98 selectable bases. The earlier report above retains its original batch scope. See [the four-company completion report](ADDITIONS_ORCL_DELL_ALAB_ADBE.md) for source dates, historical coverage, material assumptions and verification.

<!-- meta-snow-refresh-update -->

## Meta provisional Q3 refresh and Snowflake addition

Meta now offers the user-selected provisional September 2026 TTM with the one-time legal charge separately normalized and a clearly labelled settlement-reserve proxy. Snowflake is added with annual and July TTM bases. Current total: 55 companies, 100 selectable bases. See [the completion report](META_SNOW_REFRESH_REPORT.md).

<!-- be-addition-update -->

## Bloom Energy addition — 2026-10-23

BE now has annual and fully filed September TTM bases, ten years of history, and separate convertible-series decisions. Current total: 56 companies and 102 selectable bases. See [the completion report](BE_ADDITION_REPORT.md).
