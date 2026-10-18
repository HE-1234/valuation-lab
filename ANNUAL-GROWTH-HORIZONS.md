# Revenue duration in Year-by-year valuation

Implemented October 18, 2026. Original research cutoff remains October 17, 2026.

## Three different things

- Revenue stabilization year: selected 10, 15 or 20. Near-term revenue assumptions are retained, followed by a resampled fade to terminal revenue growth. This does not hold the opening growth rate constant for the entire period.
- Calendar-year economics: margin, tax, discount rate and retained investment commitments have their own timing.
- Explicit forecast length: enough rows to include the selected growth horizon and retained economic/commitment years. Selecting growth stability in year 10 can still require 15 or 18 cash-flow rows. Terminal value follows the final explicit row, not an arbitrarily truncated operating path.

The original research path is distinct from a derived scenario. Selecting the original number of years need not reproduce every source assumption: Micron, for example, has a source explicit endpoint different from its terminal growth. Use research restores the original preset; Undo restores the entire preceding draft.

## Generated sensitivity, not new research

The first three years are retained for most companies; MSFT, MU and TSM retain five. The rest of the source growth curve is resampled onto the new duration, preserving its shape rather than assuming every company started with a straight-line path. Growth is set to the terminal rate at the selected endpoint and thereafter. Annual and terminal edits can subsequently change that generated path; labels therefore describe the selected horizon rather than claiming it remains an enforced endpoint.

Calendar-year margins, tax and WACC are not stretched to match revenue duration. After the source ends, mature terminal assumptions supply new calendar years. Explicitly edited later economics and investment commitments remain in the calculation schedule. Reverting a manual override to its generated value removes that extra retention. Repeated horizon selections use the retained seed and do not compound previously generated paths.

## Capital policy

The new policy is an analyst net-investment sensitivity, not a reconstructed equipment, property, maintenance, working-capital or customer-advance budget. Original component disclosures remain source-only.

For overlapping years, positive baseline investment is kept as a floor and scales upward when revenue exceeds the retained baseline. Additional positive expansion beyond the scaled baseline increment requires capital at an explicit marginal sales/capital assumption. Sales contraction does not automatically create an asset release. A source's signed release is retained once and never enlarged automatically. Manual investment overrides are explicit exceptions, not unreported source facts.

For added mature years, the capital intensity is (1 + stable growth) × mature margin × (1 − mature tax rate) / terminal ROIC. Multiplying this by positive current-year revenue change gives investment equal to NOPAT × growth / ROIC at steady growth under the model's end-year timing. The default marginal sales/capital is the inverse of that intensity. This is a selected modeling convention, not a newly measured company statistic.

Monte Carlo applies the same response using the edited current annual schedule as its baseline, then any independent investment multiplier. Zero stress reproduces the edited deterministic case. Existing v1 simulation behavior is unchanged.

## Interpretation and evidence

Damodaran treats growth scalability, sustainable margins and investment quality as separate judgments, and asks analysts to inspect absolute revenue scale and the investment needed for growth. [Growth-company value drivers](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/growthvaluedrivers.htm).

Longer growth is not automatically more valuable: returns on investment relative to the required return matter. [High-growth duration](https://pages.stern.nyu.edu/adamodar/New_Home_Page/valquestions/highgrowthperiod.htm).

Stable reinvestment remains tied to growth and sustainable capital returns. [Terminal reinvestment](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/termvalueexreturns.htm).

These sources support the underlying principles. The committed-floor-plus-growth policy is this application's disclosed sensitivity implementation, not a formula claimed to be prescribed by Damodaran. Particularly for NBIS, AAOI, cyclical fabs and unresolved capital transitions, a decision-grade alternative needs a component-aware operating/funding forecast.
