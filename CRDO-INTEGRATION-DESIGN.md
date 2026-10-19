# CRDO dated conditional integration

Prepared October 18, 2026 in an isolated staging checkout. Canonical modification and publication are outside this handoff.

## Source and scope

- CRDO ordinary shares are separately admitted through the existing verified US/Robinhood catalog.
- Immutable v3 model inputs and the corrected v2 source/guidance evidence remain versioned. V1 and V2 archival analyses are explicitly superseded, not silently rewritten.
- August 1 reported cash and ordinary shares are distinct from October 18 estimates. The $200 interim RSU settlement price is a conditional assumption, never a transaction observation or quote. Gross extinguished RSUs derive from net issuance plus withholding cash divided by settlement price.
- Six source outputs retain separate current and reported-balance treatments. The August reconstruction uses information available later and is not a backtest. The interactive case is the dated October conditional model.
- FY2017–19 are explicit private-history gaps. Seven annual observations do not imply seven equally complete balance sheets. Corrected guidance retains headline and table precision, original/reiterated dates, annual miss, and adjusted-metric definition changes.

## Calculation contract

- The raw port validates the full finite/type/schema/domain contract and matches all six guarded Python outputs. Inputs are explicit; there are no baked valuation-result numbers.
- The Annual workspace supports ten FY2027–36 rows. Revenue, economic operating margin, operating tax, direct annual investment and WACC are editable. Terminal inputs remain editable. Unsupported date or horizon extensions are withheld rather than extrapolated.
- The first fiscal-year FCFF applies both remaining-sales and remaining-day fractions to NOPAT minus entered annual investment, then accounts for unpaid capacity deposits and recovery. First-stub discounting uses the same source dates. Later years use annual discount factors.
- Edited investment is a direct analyst assumption. Simulator investment responses follow the selected existing capital policy; a new physical capex or working-capital floor is not invented. All resulting annual/stub liquidity checkpoints, including deposit payment before receipts, are rechecked against the selected minimum cash floor.
- Outstanding debt-like cash claims are reserved once for liquidity and deducted once in common allocation. An unfinanced cash gap rejects EV, equity and per-share output. It is not financed automatically or deducted twice. The gap is shown next to withheld results.
- Existing RSUs, PSUs, restricted shares, earnout shares and options allocate the same intrinsic equity pool. Employee option value is solved jointly with the common-share value. Future grant costs are already in economic operating margins; EPS weighted shares are never a second dilution denominator.
- Invalid values, unsupported financing fields, negative/out-of-range probabilities and unknown claims fail closed. A failed edit cannot export or display a stale successful valuation. Monte Carlo remains manually invoked and uses the same operating and claim functions.

## Interface and preservation

The existing Annual Report layout, six themes, navigation, controls, evidence panel, English/Simplified Chinese localization and manual Monte Carlo are reused. No CSS or visual redesign was introduced. CRDO-specific nearby caveats replace incompatible generic descriptions. Unknown history values remain unavailable rather than rendering as zero. Summary display rounds to no more than two decimal places; source JSON retains exact calculation precision.

## Verification boundary

Focused model and runtime checks and an independent input-equation audit cover source replay, each exposed parameter, funding stress, invalid inputs, seeded simulation, restore/Undo/export, and stale-result clearing. Source-driven EN desktop and ZH mobile static images are separately reviewed. Those approximations do not establish real-browser layout, native touch, focus or screen-reader behavior.

Rebased additively on exact V70 0310b5d214bff6796a78872dc64594de328a8862, including AMD, MRVL and the latest Guided journey and annual margin/capital UI. Independent acceptance passed 9,402 assertions, 112 packaging checks and exact default/edited/seeded/restoration comparisons for all 26 existing companies. The strict reversal layer restores all 486 V70 production files byte-for-byte and rejects added mutations. See the delivery record for the final aggregate result and static-render limitations.
