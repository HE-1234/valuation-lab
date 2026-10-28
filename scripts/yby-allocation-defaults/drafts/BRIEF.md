# Year-by-year allocation defaults from filed data

Repo: /Users/erichuang/Documents/Code/valuation-lab (static app in `dist/`). Scratch folder: this directory (`yby/`).

## Problem
In the Year-by-year view each reviewed research model computes operating value (EV) at a dated origin
(the research's `discountOrigin`). Turning EV into a value per common share needs an allocation/policy
state that starts EMPTY by design ("blank means unknown"), so the page shows "Common-share value incomplete".
The user wants every company to show a per-share value by default, with the allocation inputs filled from
the FILED balance sheet / claims data at that origin date.

## Your job, per company
Produce `yby/defaults/<TICKER>.json`:

```jsonc
{
  "ticker": "NFLX",
  "draftPatch": { "<draftKey>": <exact object the view/engine expects> },  // merged into the research draft with Object.assign
  "fields": [ // one entry per input you set
    {"path": "nflxPolicy.debt_value", "value": 14372, "basis": "filed" | "published-illustration" | "derived" | "explicit-zero",
     "sourceUrl": "https://www.sec.gov/...", "locator": "10-Q Jun 30 2026, Note 6 Debt, face value",
     "note_en": "short reason", "note_zh": "简体中文说明"}
  ],
  "summary_en": "one or two sentences shown under the value: what this default allocation uses",
  "summary_zh": "同上，简体中文"
}
```

Where the state lives (find the exact shape by reading the code; do not guess):
- ONTO, CAMT, MRVL, AMD, NBIS: `d.analystConditionalAllocation` = `{enabled:true,ticker,version,inputs:{...}}` — see `dist/analyst-conditional-allocation.js` (fields, defaults, `illustration`) and `dist/analyst-allocation-view.js`.
- NVMI: `d.nvmiConditional` — see `dist/nvmi-conditional-view.js`, `dist/nvmi-conditional-allocation.js`.
- NFLX `nflxPolicy` (maybe also `nflxLedger`), UBER `uberPolicy` (`uberRollforward`), MCD `mcdPolicy`, UMC `umcPolicy`, RMBS `rmbsAwardPolicy`
  — see `dist/<t>-research-view.js`, `dist/<t>-financial-engine.js`, `dist/research-claims.js`, and the registry `dist/<t>-research-registry.js`
  (look for `policyTemplate`, site templates like `nflxSitePolicyTemplate`, illustration buttons, validation functions).

Value priority for each input:
1. A FILED figure dated at the research origin: `scripts/guided-filing-data/<TICKER>.json` (`snapshots.ttm` or `snapshots.annual`,
   whichever periodEnd equals the origin; it has cash, investments, debt, leases, NCI, preferred, shares, RSUs, options, convertibles,
   otherClaims with evidence URLs) or a dated fact already in the research package `dist/data/incremental-<TICKER>-*/` (highest version).
2. The model's own published illustration / site template value, if the input is a judgment with no filed number (say so: basis "published-illustration").
3. A value derived from filed numbers with a stated formula (basis "derived").
4. Explicit zero only when the filing shows none or the item is genuinely immaterial/undisclosed, with the reason.
Never invent a number. Never change the operating forecast. Respect every validation rule in the engine (matching dates, versions, sums).

Verify with the checker (it builds the default research draft, applies your patch, and prints PER_SHARE):
```
Y=/private/tmp/claude-501/-Users-erichuang-Documents-Code-valuation-lab/1d636168-b404-4b50-be59-84a67fe5d784/scratchpad/yby
cd /Users/erichuang/Documents/Code/valuation-lab/dist && NODE_OPTIONS=--max-old-space-size=1024 node $Y/check.mjs NFLX $Y/defaults/NFLX.json
```
Without a patch file it shows the current (empty) default. For NBIS add env `CAPITAL_PRESET=1`. Done = PER_SHARE is a finite number
(for NBIS, whose research EV is negative, a finite signed residual from the analyst allocation is acceptable — report it).
Also report what the published illustration (if any) gives, for comparison.

Rules
- Do NOT edit any file in the repository. Write only inside `yby/`.
- Laptop safety: never run the test suite, never start browsers, only run check.mjs (one process at a time, with the memory flag above).
- SEC access only if a needed figure is missing: User-Agent "ValuationLab research admin@example.com", under 5 requests/second.
- Simplified Chinese only for `_zh` text.
- Final reply: per company, PER_SHARE, the list of inputs with basis, and anything doubtful. Keep it short.
