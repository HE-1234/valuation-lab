# DELL Guided addition — 2026-10-21

Source validation: `GUIDED_CUTOFF=2026-10-21 python3 scripts/guided-filing-data/validate.py DELL` → **OK**.

SEC submissions index confirms the latest annual is FY2026 ended January 30, 2026, filed March 16 (0001571996-26-000008), and latest interim is July 31, 2026, filed September 8 (0001571996-26-000046). Primary financial statements and notes were read directly, alongside Company Facts. The latest 10-Q, rather than a later press release, anchors TTM.

| USD millions except shares | Annual | TTM / July balance |
|---|---:|---:|
| Revenue | 113,538 | 151,197 |
| Operating income | 8,149 | 14,252 |
| Cash | 11,528 | 11,569 |
| Long-term investments | 1,730 | 2,679 |
| Borrowings, carrying | 31,503 | 34,466 |
| Actual common shares, millions | 652 | 640 |
| RSU/PSU units, millions | 19 | 19 carried |
| COO options, millions | 2.5 | 2.5 carried |
| Pension deficit claim | 248 | 248 carried |

TTM revenue = 113,538 + 90,813 − 53,154. TTM EBIT = 8,149 + 9,041 − 2,938. Debt sums 7,990 + 23,513 and 8,481 + 25,985. Annual common shares sum Class A 277 + B 52 + C 323; July sum A 277 + B 44 + C 319. Do not use only the traded Class C count or weighted-average diluted EPS shares.

## Customer financing and capital

Whole-enterprise FCFF is consistent with Dell's accounting: its market-risk disclosure expressly states DFS interest income is revenue and DFS interest expense is Interest and other, net. Thus reported EBIT includes financing income before the funding cost, and subtracting all consolidated borrowing debt is consistent. Do not remove DFS debt while retaining DFS operating earnings; do not add financing receivables or leased customer equipment as excess assets. The reinvestment assumption explicitly funds them. The model uses five dollars of new revenue per dollar of new capital, not the potentially extreme supplier-funded historical book ratio. Supplier-finance payables remain trade liabilities per Dell's filing, not a duplicate financial debt deduction.

Negative book equity is preserved. The annual and interim lease notes distinguish operating leases; the annual states no material finance leases as lessee. A $100 million excluded-debt stress is about $0.15 per share. Private investment values are approximate realizable values, but their gains are below operating income, so no earnings/bridge duplication arises.

## Ownership claims

FY2026 reports 19 million units (14m RSUs plus 5m PSUs at target). July has no full roll-forward, so the dated carry and award sensitivity are explicit. The COO award is 2.5m options struck at $141.77, granted September 30, 2025 with a ten-year contractual term and demanding performance/service conditions. Claims policy conservatively assumes full vesting, uses remaining contractual time, 50% analyst volatility and 4% analyst rate. The $132m grant-date fair value is not subtracted again. Do not manufacture raw weighted life or market intrinsic facts. Aggregate award count rounded to 22m in the risk section reconciles approximately to 19m + 2.5m; no invented additional free-share claim is added for that rounding difference.

International pension deficit is 498m obligations minus 250m assets = 248m, already in other liabilities rather than borrowing debt. It is separately subtracted once. July carry has about $0.19/share sensitivity for a 50% change. U.S. pension plan obligations settled during FY2026.

## History

Eleven real annual observations FY2016–FY2026 supply an opening year plus the latest ten annual rows. Every numeric fact retains XBRL tag, raw USD amount, scale, exact period, accession, filing date and primary-document URL. FY2017 includes only part-year EMC; through FY2019 includes VMware. FY2020 onward reported operating flows are recast excluding VMware. Incompatible boundaries have distinct accounting-basis labels; older scope is excluded from current-business ranges. FY2020/FY2021 capital ratios and FY2022 opening-capital ratios are excluded because balance sheets/opening capital can still include VMware while earnings do not. Negative equity and tax losses remain visible. Secureworks disposal and VMware-resale run-off are flagged separately.

Only `DELL.json`, `history/DELL.json`, `additions/DELL.json`, and this review were changed by this research agent. No shared generated artifacts, builders or tests were edited.
