# NVMI dated operating-value integration
Review date: 18 October 2026.

## Bounded design decisions
- Retain the approved application layout, typography, all six themes, navigation, manual Monte Carlo workflow and existing history placement. No aesthetic redesign is included.
- Keep “Forecast-origin operating value” next to the EV amount and show the December 31, 2025 origin and October 18, 2026 information cutoff beside the result. Display the existing incomplete common-share state rather than transforming enterprise value into a stock-price target. Conditional equity estimation can be added after separately reviewed claim assumptions; this integration does not claim permanent unavailability.
- Put company-specific caveats in the established value-evidence panel and retain its close/focus behavior. Entered investment, required investment and the floor top-up remain separately inspectable in annual calculations and diagnostics.
- Keep reported FY2016–2025 history in the established evidence area, with units, source links and the corrected share-scale explanation. History is descriptive context, not an as-known December backtest. The responsive table retains year and metric relationships and null source values remain null.

These decisions apply W3C guidance that headings and labels should describe their purpose, and that information relationships should remain available beyond their visual arrangement. They are design judgments informed by those documents, not a WCAG conformance certification or a claim to have completed a training course.

Sources reviewed:
- W3C, Understanding SC 2.4.6 Headings and Labels: https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html
- W3C, Understanding SC 1.3.1 Info and Relationships: https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html

## Verification boundary
Runtime tests cover source replay, funding floors, claim gating, persistence, named scenarios, manual simulation, bilingual evidence and preserved existing UI behavior. Static WeasyPrint renders approximate desktop/mobile presentation; they are not browser screenshots and cannot certify native focus, sticky positioning, select behavior or browser layout. A native published-page check remains appropriate.
