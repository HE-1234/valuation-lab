# McDonald's: dated valuation research, v2

Research cutoff: **19 October 2026**. Capital and discount anchor: **30 June 2026**. MCD is the intentional non-technology exception. This is a new, isolated onboarding package. It does not edit, approve, publish, or push the Valuation Lab application.

The package contains ten fiscal years of source-linked financial and restaurant data (2016–2025), the June 2026 interim anchor, a dated management-target chronology, an editable annual FCFF model, capital/award limitations, and focused offline checks. Source originals and full-text derivatives are excluded from the public-safe package.

## Main results

| Dated analyst scenario | Core operating EV, $bn | Terminal PV / EV |
|---|---:|---:|
| Bear | 98.9 | 50.7% |
| Base | 187.8 | 59.8% |
| Bull | 292.1 | 69.0% |

These are operating values, not current equity targets. Equity-method ownership interests are outside this operating EV. The model retains the royalties paid by affiliates but removes their equity earnings. Current target, current upside, and the default dated per-share allocation are all null.

October information is discounted to a June capital date, so the scenarios are **not an ex-ante June appraisal**. No current market-price comparison is made. WACC, terminal growth, incremental ROIC and all future operating paths are labeled analyst assumptions.

## Read first

1. `STUDY-v2.md`: business economics, historical comparability, findings and risks.
2. `MODEL-v2.md`: model equations, forecast interpretation and accounting treatment.
3. `capital-claims-scope-v2.json`: matched-date cash/debt/shares and unresolved claims.
4. `readiness-v2.json`: exact admission gates and verification status.
5. `source-provenance-v2.json` and `history-field-provenance-v2.json`: direct primary citations and numerical provenance.

## Offline replay

Python 3, standard library only:

    python replay_dcf_v2.py
    python verify_v2.py

Edit `dcf-inputs-v2.json` for scenarios. Replay writes `dcf-output-v2.json`, `forecast-v2.csv`, and `sensitivity-v2.json`. It does not fetch anything or modify other company packages.

The allocation template deliberately contains nulls. A separately labeled illustration shows the arithmetic only:

    python replay_dcf_v2.py --policy allocation-policy-illustration-v2.json --output-dir example-output

That example assumes missing June finance-lease and award claims. It is neither a verified current bridge nor a funding-certified investment case. The illustration does not change any default. The predecessor source and arithmetic review passed with two bounded corrections now implemented. A targeted independent v2 recheck and explicit decisions on open capital claims remain required before admission.

The frozen manifest covers every public-safe file other than the manifest itself. Editing inputs invalidates the original integrity check; create a new version for a new reviewed package.

## Conditional allocation range

`allocation-illustrations-v2.json` contains three fully specified, editable claim policies, with the dated evidence behind each assumed range. Under the central policy, the bear/base/bull operating paths allocate approximately $83.34 / $208.94 / $356.39 per June common share. Holding the base operating path fixed, the low-to-high claim/asset policies give about $203.14–$213.74.

These are conditional June arithmetic examples, not price targets. The claims sensitivity is much narrower than the operating scenario range; this does not establish that all unknown claims fall inside those chosen ranges. The null-filled template remains unchanged. To regenerate the examples:

    python allocation_examples_v2.py

## V2 review corrections

V2 preserves all v1 source facts and default financial outputs. It fixes two independently identified review issues: alternative claim-policy explanations now match their own numeric assumptions, and the editable 2026 restructuring path cannot fall below the observed H1 charge. See `revision-notes-v2.json` for the exact scope and checks. V1 and the retained source originals remain unchanged.

The independent predecessor review matched 476 inline observations and 41 manual-table observations and independently reconstructed all operating scenarios and nine conditional allocations. Its two revision requests are recorded in `review-history-v2.json`; targeted independent v2 recheck is pending. Observed H1 2026 CFO less capex was $185m below dividends plus buybacks before other flows. This does not establish distress, but reinforces the explicit funding boundary. See `capital-claims-scope-v2.json`.
