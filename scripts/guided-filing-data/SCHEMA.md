# Guided base-period data: one JSON file per company

Write `guided-data/<TICKER>.json` (in this folder). Run `python3 validate.py <TICKER>` until it prints OK.

Purpose: the Guided valuation lets a user value a company from either
(1) the **last full fiscal year** (audited annual report), or
(2) **TTM** (trailing twelve months) through the **latest filed quarterly or half-year report**.
Each base needs its own operating flows AND its own balance sheet and claims, all dated at that base's period end.

All money in **millions of the reporting currency**. All share counts in **millions**. Use numbers exactly as filed (convert units only).
Every number must have evidence: the exact filing URL on sec.gov (or the issuer's IR site when the issuer does not file it with the SEC), and a locator (statement/note name, XBRL tag, or table caption). Never invent, estimate or round a figure without saying so in `note`.

```jsonc
{
  "ticker": "NFLX",
  "name": "Netflix, Inc.",            // legal name as filed
  "cik": "0001065280",                // 10-digit, zero-padded
  "currency": "USD",                  // reporting currency of the statements
  "filerType": "domestic",            // "domestic" (10-K/10-Q) or "foreign" (20-F/40-F/6-K, or 10-K filer reporting in a non-USD currency)
  "shareBasis": "ordinary-common",    // what one valued unit is
  "adrRatio": 1,                      // ordinary shares per listed US unit (ADS); 1 if the US listing is the ordinary share
  "listedUnit": "common share",       // e.g. "ADS (5 ordinary shares)", "NY-registry ordinary share"
  "snapshots": {
    "annual": { ...Snapshot },        // last full fiscal year with an annual report filed on or before the cutoff (default: today; set GUIDED_CUTOFF)
    "ttm":    { ...Snapshot }         // latest quarter/half-year filed on or before the cutoff (default: today; set GUIDED_CUTOFF)
  },
  "notes": ["anything a reviewer must know"]
}
```

Snapshot:

```jsonc
{
  "periodEnd": "2025-12-31",          // fiscal period end of this base
  "label": "FY2025",                  // annual: "FY2025" (issuer's fiscal-year naming); ttm: "TTM through 2026-06-30"
  "form": "10-K",                     // filing that supplies the balance sheet: 10-K, 10-Q, 20-F, 6-K, 40-F
  "accession": "0001065280-26-000034",// SEC accession number of that filing (null only if not filed with the SEC)
  "filedAt": "2026-01-27",            // filing date of that filing
  "acceptedAt": "2026-01-27T21:05:11.000Z", // SEC acceptance timestamp if known (EDGAR index), else null
  "sourceUrl": "https://www.sec.gov/Archives/edgar/data/.../x.htm", // main document of that filing

  "revenue": 45183.036,               // total revenue / net sales for the 12 months
  "operatingIncome": 13326.603,       // reported operating income (EBIT) for the 12 months, GAAP/IFRS as reported
  "ttmComponents": null,              // annual: null. ttm: see below (required)

  "cashAndEquivalents": 9033.681,
  "shortTermInvestments": 28.678,     // current marketable securities / short-term deposits / short-term investments; 0 if none, null if unknown
  "longTermInvestments": 0,           // noncurrent marketable securities + equity investments + equity-method investments (non-operating); 0 if none
  "debtCurrent": 998.865,             // all interest-bearing borrowings due within a year: current portion of LTD, commercial paper, short-term loans, current convertible notes, current finance leases
  "debtNoncurrent": 13463.971,        // all noncurrent interest-bearing borrowings incl. convertible notes (carrying) and finance leases
  "operatingLeaseLiabilities": 2512.0,// total (current + noncurrent); recorded only, NOT added to debt
  "noncontrollingInterest": 0,
  "preferredEquity": 0,

  "sharesOutstanding": 4222.16215,    // actual common shares outstanding (all classes), millions, on sharesDate
  "sharesDate": "2025-12-31",         // prefer the balance-sheet date; the cover-page date is fine if within ~45 days after periodEnd (say which in evidence)
  "unvestedRSUs": 2.0,                // unvested RSUs + PSUs outstanding (millions) at or near periodEnd; null if not disclosed in that filing (then carry from latest annual and set carriedFrom)
  "options": {                        // employee stock options outstanding at or near periodEnd; all null if the company has none (then say so in note)
    "count": 123.9, "weightedExercisePrice": 39.21, "weightedRemainingYears": 4.5,
    "aggregateIntrinsicValue": 9800.0 // as disclosed (millions); null if not disclosed
  },
  "convertibles": [                   // each convertible note/bond outstanding at periodEnd; [] if none
    {"name": "0.25% notes due 2029", "principal": 0, "carrying": 0, "fairValue": 0, "conversionPrice": 0, "maturity": "2029-03-15"}
  ],
  "otherClaims": [                    // anything else that dilutes common holders: warrants, contingent consideration payable in shares, etc.
    {"name": "Customer warrants", "value": 0, "basis": "intrinsic value disclosed", "evidence": "..."}
  ],
  "carriedFrom": {},                  // field -> {"date": "...", "sourceUrl": "...", "why": "6-K omits it"} for anything not in this base's own filing
  "evidence": {                       // one entry per numeric field above (and per ttmComponents value)
    "revenue": {"url": "...", "locator": "Consolidated Statements of Operations, Revenues, year ended Dec 31 2025", "tag": "us-gaap:Revenues"}
  },
  "note": ""
}
```

`ttmComponents` (ttm only): TTM = annual + current YTD − prior-year comparable YTD.

```jsonc
{
  "annualRevenue": 45183.036, "ytdRevenue": 23505.0, "priorYtdRevenue": 21028.0,
  "annualOperatingIncome": 13326.603, "ytdOperatingIncome": 7500.0, "priorYtdOperatingIncome": 6500.0,
  "ytdStart": "2026-01-01", "ytdEnd": "2026-06-30", "priorYtdStart": "2025-01-01", "priorYtdEnd": "2025-06-30"
}
```
revenue must equal annualRevenue + ytdRevenue − priorYtdRevenue (same for operatingIncome) within 0.01.
If the latest filing for the TTM is the annual report itself (fiscal year just ended, no later quarter filed), set ttm = the same data as annual with ttmComponents having ytd* = 0 and prior* = 0, and say so in note.

Rules
- Use SEC EDGAR. XBRL company facts: `curl -s -A "ValuationLab research admin@example.com" https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json`. Filing index: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=...&type=10-Q&dateb=&owner=include&count=40` or `https://data.sec.gov/submissions/CIK##########.json`. Always send that User-Agent header, and keep under 5 requests/second.
- Cross-check XBRL values against the filed document for revenue, operating income, cash, debt and shares.
- Foreign private issuers (6-K quarterly summaries): use the 6-K's statements for flows and balance sheet; carry share counts, awards or debt splits from the latest 20-F (or a later 6-K that reports them) and record them in `carriedFrom`.
- Filings must be filed on or before the cutoff (default: today; set GUIDED_CUTOFF). Do not use earnings press releases for the balance sheet when the 10-Q is not yet filed; use the latest filed 10-Q instead.
- The reviewed research package for the company is in `dist/data/incremental-<TICKER>-*/` (highest version; KLAC is in `dist/data/incremental-research-2026-10-18/`). It holds source URLs and capital details you can reuse after checking them.

## Refresh evidence and unknown values

Set `GUIDED_CUTOFF=2026-10-21` for this refresh (or the actual date for a later refresh).
The validator checks structure, evidence presence and TTM arithmetic. An `OK` result
alone does **not** establish newest-filing coverage or complete claims valuation.
Check the SEC submissions index and the filed documents separately.

Unknown numeric facts and unvalued claims remain `null` with an evidence locator
or explanation. Never use zero to make validation or valuation pass. A missing
cash/debt component propagates to the Guided bridge and withholds the value.
Earlier disclosed award/lease figures require `carriedFrom` with their actual date;
they are not current-period verified facts.

Historical sources live in `history/<TICKER>.json`. Each `years` entry contains
`fiscalYear`, `periodStart`, `periodEnd` and sourced fact objects. Include `revenue`
and `operatingIncome` alongside equity, cash, pretax income and income tax. Prefer
an explicitly sourced `mappedDebt` object when a combined debt subtotal exists;
otherwise provide independently sourced `longTermDebtNoncurrent` and
`shortTermBorrowings`. A derived fact records `formula`, `components`, `sourceUrls`
and the latest component filing date. Every underlying amount retains its own URL,
locator/tag, accession and dates. No absent debt line is automatically a zero.

The builder takes the latest ten real annual observations plus their preceding
annual observation. It never creates full-year dates from quarterly data. Ratios
carry numerator, denominator, formula, source URLs, range eligibility and an explicit
reason when unavailable. Prior-year ratios require adjacent fiscal periods and
compatible accounting bases. Tax losses and nonpositive capital are disclosed,
not forced into a positive ratio. Histories remain latest-reported context, never
point-in-time backtest data.
