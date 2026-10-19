# Rambus management guidance: source-linked research sample

As of 19 October 2026. Prepared from issuer releases and issuer-hosted or issuer-linked materials. No third-party analyst estimates or transcripts inform the numerical conclusions. This is a detailed, reasonable sample, not a comprehensive history of every forecast, call remark, mid-quarter revision, interview, or long-term target.

## Deliverables
- `guidance_track_record.csv` and `.json`: 60 contemporaneous, same-metric quarterly comparisons, covering six metrics over Q1 2024 through Q2 2026; one separately flagged, retrospectively restated total-revenue comparison; eight pending Q3 2026 outlook rows.
- `source_registry.csv` and `.json`: dated primary-source provenance and locators.
- `sample_summary.json`: mechanically calculated range counts. These are metric counts, not independent observations or an overall management credibility score.
- `management_narrative.md`: paraphrased management messaging, interpretation, and source gaps.
- `transcript_inventory.json`: exact status of transcript/webcast/deck research.
- `build_guidance.py`: reproducible extraction inputs and calculations. No canonical files were edited or published.

## Metric definitions and comparison policy
1. Product revenue: the issuer's GAAP/ASC 606 product-revenue line, compared only with its own product-revenue outlook.
2. Royalties revenue: the issuer's GAAP/ASC 606 royalties (also called royalty revenue) line, compared only with royalty-revenue guidance. It is a component of GAAP revenue.
3. Contract and other revenue: the issuer's distinct GAAP/ASC 606 contract-and-other line, compared with guidance for that line.
4. Licensing billings: an operational invoicing measure, including the issuer's adjustments for advance payments under variable licensing contracts. It is not GAAP revenue, GAAP royalties, or a substitute for cash flow. The issuer's decks show an explicit reconciliation/bridge between royalties and licensing billings.
5. GAAP total operating costs and expenses: cost of revenue plus operating expenses. Do not compare this outlook to operating expenses alone. Actuals here are summed from the release's rounded narrative, and are approximate to $0.1 million.
6. Non-GAAP total operating costs and expenses: the release narrative's adjusted costs inclusive of non-GAAP cost of revenue. Exclusions vary with period; consult reconciliations. It is not operating expenses alone, EBITDA, or a standard measure across companies.

All monetary values are USD millions except EPS. Actuals generally retain the release's one-decimal precision. The Q4 2025 royalties row uses the detailed income statement's $71.676 million because the release's summary shows $71.6 million while a later issuer deck shows $71.7 million. This does not alter the result.

Guidance is the originally reported next-quarter range in the preceding quarter's release. The file does not assert that no subsequent revision occurred. Issuer expense ranges are printed in reverse numerical order under low/high earnings scenarios; the dataset normalizes endpoints to numeric minimum/maximum. Above/below labels describe a number's position, not whether the outcome is good. Lower costs are ordinarily favorable, but spending increases can accompany stronger activity and are not automatically execution failures.

Midpoint difference = actual minus (low + high)/2. Percentage difference divides this by the midpoint. Boundary values count as within range. Use the raw range and actual, not just the midpoint, when assessing guidance.

No total-revenue range is inferred by adding component range endpoints: management's full-revenue guidance may have a different width or scenario construction. Q2 2026 total revenue is included only because its actual-results release explicitly restates $192–198 million prior guidance; the row labels this evidence as retrospective and does not pretend the contemporaneous audio was reviewed.

## Sample results
Over the ten measured quarters:
- Product revenue: 9 within range, 1 above, 0 below.
- GAAP royalties: 5 within, 5 above, 0 below.
- Licensing billings: 5 within, 5 above, 0 below.
- Contract and other revenue: 5 within, 1 above, 4 below.
- GAAP total costs: 6 within, 3 above, 1 below.
- Non-GAAP total costs: 6 within, 4 above, 0 below.

This supports a narrower conclusion than an unqualified 'management always beats': product guidance was usually met, royalty/billing upside was frequent, and contract/other revenue was less predictable. The three revenue components and billings are related, so their observations should not be combined into a pseudo-statistical hit rate.

## Limitations and presentation discrepancies
- GAAP inclusive cost guidance uses the headline-rounded ranges: Q1 2024 $85–89m versus detailed reconciliation $85.1–89.1m; Q2 2026 $127–131m versus detailed $127.2–131.2m. The classifications are unchanged, but these should not be treated as precision to the nearest $0.1m.
- Q2 2024 non-GAAP inclusive costs: original release narrative $77.1m; same-period deck $77.0m. Original release retained; result unchanged.
- Q4 2024 non-GAAP inclusive costs: original release narrative $89.1m; Q4 2025 deck's comparative $89.2m. Original release retained; result unchanged.
- Q4 2025 royalties: detailed income statement $71.676m; summary $71.6m; Q1 2026 deck $71.7m. Detailed line used.
- Small cost overruns, such as $0.2m above a range endpoint, should be interpreted in light of rounded disclosure.
- No official full text earnings transcript was located/retrieved. Audio was not transcribed. Management discussion is paraphrased from releases and decks; no full copyrighted transcript is reproduced.
- The archive pages are dynamically rendered and yielded limited text; direct issuer releases and indexed official PDFs supplied the evidence. A direct Python request to the quarterly archive returned HTTP 403, while the web tool could open it. No denied access was circumvented.
- Q3 2026 was not yet reported at the cutoff. An October 5 issuer notice schedules results for October 26. The Q3 investor presentation is a presentation label, not evidence of Q3 results.
