# Task: complete and refresh the Guided valuation data for every ready company

You are working in `/Users/erichuang/Documents/Code/valuation-lab`. It is a buildless static site; `dist/` is the site. The dev server runs on port 8081 (`http://localhost:8081/#current` is Guided valuation and `#renewed` is Year-by-year).

## What "makes sense" means for Guided valuation

For every company the Guided picker lists as **Ready to value**, the user must be able to value from exactly two bases:

1. **Last full fiscal year.** Use the newest audited annual report (10-K, 20-F or 40-F) filed on or before the cutoff.
2. **TTM through the most recent report.** Use the newest 10-Q, 6-K quarterly or half-year report filed on or before the cutoff. Compute it as annual + current YTD − prior-year YTD.
   - If the annual report is itself the newest filing, there is only one base. That is correct, not missing data.

For each base, every one of these must be dated at that base's period end and must come from a filing:
- revenue and operating income (EBIT);
- cash plus short-term investments;
- long-term investments;
- debt (current + noncurrent, including convertibles and finance leases);
- operating leases (recorded only);
- noncontrolling interest and preferred equity;
- shares outstanding plus unvested RSUs/PSUs;
- options;
- convertibles;
- other dilutive claims.

Each company also needs **ten fiscal years of history**, plus the year before them so ratios can use beginning-of-year capital. These history rows feed the read-only "Reported history" panels. Each year needs:
- revenue and operating income, from which growth and operating margin are computed;
- pretax income and income tax, from which the effective tax rate is computed;
- book equity, cash and equivalents, and mapped debt, from which the book-capital proxy (equity + debt − cash) is computed;
- the three ratios built on that proxy:
  - sales to book-capital;
  - incremental sales to book-capital;
  - return on book-capital: EBIT × (1 − tax rate) ÷ prior-year capital.

A panel showing "Unavailable" for a year the filings do cover is a bug to fix.

**Cutoff = today's date.** Set `GUIDED_CUTOFF=YYYY-MM-DD` to today when you run the checker. If a company filed a newer 10-Q, 6-K or 10-K since the data was built, move that base forward.

## Current state (audit from 2026-10-21)

The data files are:
- `dist/data/current-universe.json`: companies → `snapshots`. `snapshotMode` is `annual-reference`, `ttm` or `latest-quarter`.
- `dist/data/company-base-cases.json`: researched assumptions per company. `bySnapshot` holds the case for the other base.
- `dist/data/company-history.json`: annual history rows with `facts` and `metrics`.

There are 36 ready companies, in two groups built differently.

**A. 22 reviewed companies, built by `scripts/build-guided-reviewed-cases.py`:**
AMAT, AMD, ARM, ASML, CAMT, CDNS, CEVA, CRDO, FN, KEYS, KLAC, LRCX, MCD, MRVL, NFLX, NVMI, ONTO, RMBS, SNDK, SNPS, UBER, UMC.

- **Base data:** each company has `scripts/guided-filing-data/<TICKER>.json`. The schema is in `scripts/guided-filing-data/SCHEMA.md`, and the checker is `python3 -I scripts/guided-filing-data/validate.py <TICKER>`. All 22 pass today. Refresh any whose newer filing is now out.
- **History is the big gap.**
  - 21 of the 22 have no book-capital history; only NFLX has it.
  - CRDO has 7 rows and SNDK has 2. SNDK was spun off in 2025, so fewer years is acceptable if the filings genuinely do not exist.
  - Their history metrics lack the `numerator`, `denominator`, `formula` and `rangeEligible` fields that the original companies carry and the tests check (`tests/assumption-history.test.mjs`, `tests/v7-qa-history.test.mjs`).
- **How to add history:**
  - Use `scripts/guided-filing-data/history/NFLX.json` as the example. Write one file per company in `scripts/guided-filing-data/history/<TICKER>.json` with these fields per year:
    - `bookEquity`, `cashAndEquivalents`, `longTermDebtNoncurrent`, `shortTermBorrowings`, `pretaxIncome`, `incomeTaxExpense`;
    - each field as `{value, tag, periodEnd, filed, accession, sourceUrl}`, in millions.
  - The builder function `add_capital_history()` turns them into the proxy facts and ratios.
  - Then extend `history_entry()` / `add_capital_history()` so every metric carries `numerator`, `denominator`, `formula`, `rangeEligible`, `reason` and `sourceUrls`. Match the format of the AAPL rows in `company-history.json`.
- **Foreign filers** (ASML, UMC, CAMT, NVMI, ARM): use IFRS / 20-F / 6-K figures and note the basis. A ratio must never mix bases, such as US GAAP history with IFRS figures.
- **Rebuild** with `.venv/bin/python -I scripts/build-guided-reviewed-cases.py`. It is idempotent.

**B. 14 original companies:** AAPL, MSFT, AMZN, GOOG, META, NVDA, TSLA, COHR, LITE, AAOI, NBIS, MU, AVGO, TSM.

- They were built by an older pipeline (`scripts/build-company-history.py`, `scripts/build-company-base-cases.py`) from a source cache that is not on this machine. Do not rerun those scripts.
- Known gaps:
  - AVGO's annual snapshot has `debt: null`, so its last-full-year base cannot reach a value per share.
  - NBIS history has only 3 rows. It IPO'd in its current form recently, so check what exists.
  - The TSM TIFRS annual snapshot has null balance-sheet fields. The IFRS one is used, which is fine if Guided never selects the TIFRS one.
  - MSFT, COHR, LITE and MU have no TTM. Confirm whether a newer 10-Q now exists, and add one if it does.
- **Approach:** write a small, separate, idempotent patch script (for example `scripts/patch-original-guided-data.py`) that edits only the fields it fixes and records evidence the same way the existing snapshot fields do (`factEvidence`, `sourceUrl`, `accession`).

**C. 26 "In progress" companies** (INTC, GFS, CSCO, …) have no reviewed research. They need no snapshots unless the user asks, so leave them as they are.

## Known doubtful items to re-check (from earlier data collection)

- NVMI: the convertible fair value is carried from an older filing.
- SNPS, CDNS, MRVL: RSU and option counts are carried from the 10-K.
- ASML: TTM shares are 384.1m at June 28; re-check against the Q3 report.
- CAMT: the 2026-notes settlement was inferred.
- UMC: the 20-F and 6-K are on different IFRS bases.
- UBER: the TTM excludes finance leases. MCD: finance leases are carried.
- AMD: OpenAI/Meta warrants (up to 320M shares) are excluded.
- MRVL: preferred (2,000) is deducted.
- CRDO: earn-outs (310) are included.
- SNDK: FY2026 is an extreme year.
- NFLX: the $566m tax reserve is from the FY2025 10-K because the June 10-Q has no update.

Fix the ones a newer filing resolves. For the rest, leave a `note`.

## How to work

- Use one subagent per company or per small group. Sonnet-class models are fine for pure data collection.
- **Run at most 4 at once.** The user's laptop crashed earlier from too many parallel jobs.
- **SEC access:**
  - Use the XBRL company facts from `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` and the submissions index from `https://data.sec.gov/submissions/CIK##########.json`.
  - Send the header `User-Agent: ValuationLab research admin@example.com`, and stay under 5 requests per second across all agents combined.
  - Cache downloads in a temporary folder, never in the repo.
- **Cross-check** revenue, operating income, cash, debt and shares against the filed document.
- **Never invent, estimate or zero-fill.** If a figure is unknown, leave it `null` with a `note`. Every number needs a source URL and a locator.
- **Use filings, not press releases**, for balance sheets.

## Laptop safety (hard rules)

- **Never** run the whole test suite in parallel (`node --test tests/*.test.mjs` once used about 200 GB of memory).
- Run single test files only, with `NODE_OPTIONS=--max-old-space-size=2048`. The relevant ones are:
  - `tests/assumption-history.test.mjs`
  - `tests/v7-qa-history.test.mjs`
  - `tests/current-data*.test.mjs`
  - Anything else that names `company-history` or `current-universe`.
- Many other tests are byte-pins of the V89 release and already fail. Do not chase those; report only failures your change caused.
- Use at most one headless browser at a time, and close it when finished.

## Repository rules

- **Languages:** English and Simplified Chinese only. Never edit zh-Hant files. New user-visible text needs a zh-Hans pair; for case prose, the builder writes it to `dist/locales/guided-case-pairs.js`.
- **Off-limits files:** another session's uncommitted work lives in the same folder. Do not modify:
  - `dist/arm-*.js`, `dist/incremental-*.js`, `dist/latest-quarter-evidence*.js`
  - `dist/data/incremental-ARM-2026-10-20-v3/`
  - `scripts/build-arm-v3-incremental.mjs`
- **Year-by-year models:** do not change the reviewed research packages (`dist/data/incremental-*`, `dist/*-research-registry.js`). Guided data only.
- **Git:** do not commit or push. Leave everything uncommitted for the user to review.
- **Do not install packages** without asking.

## Done when

1. `GUIDED_CUTOFF=<today> python3 -I scripts/guided-filing-data/validate.py` prints OK for all 22, with each base at the newest filing.
2. In Guided, every ready company shows a value per share on every base it offers, in English and Simplified Chinese. Check desktop and a 375px-wide phone viewport.
3. Every ready company's Growth, Profitability, Investment (sales / book-capital) and Risk (ROIC) history panels show ten fiscal years where filings exist. Any "Unavailable" year has a stated reason.
4. The two history test files pass, or each remaining failure is explained as a pre-existing byte-pin.
5. Write a final report in `scripts/guided-filing-data/REFRESH_REPORT.md` with, per company:
   - which bases moved, from what to what;
   - what was filled;
   - what stays null and why;
   - the old and new Guided value per share for each base.
