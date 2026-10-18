# Interim and sustainable margins

Implemented October 18, 2026. This optional analyst curve does not replace any original researched margin schedule unless selected.

## What the controls mean

- Starting margin: Guided uses the current normalized operating margin. Year-by-year uses the source anchor's EBIT/revenue when present. AAOI and NBIS lack anchor EBIT, so the first forecast margin is explicitly labeled as a year-0 assumption, not reported history. Its original source/proxy label survives subsequent edits.
- Interim margin and year reached: move from the starting margin to this target.
- Final transition begins: hold the interim target until this year.
- Long-run terminal margin and year reached: move to the sustainable final level by its own year, then hold it. This margin timeline does not stretch when the revenue-growth horizon changes.

An illustrative path is 20% at year 0, 30% by year 5, held through year 8, then 22% by year 12 and thereafter. The current and terminal levels can instead both be 20% while retaining a 30% interim peak. These are examples, not company forecasts.

The transitions are linear between specified endpoints. The model also permits a lower interim target or a later recovery; the chart shows actual calculated rows. Distinct interim and terminal margins need a nonzero transition interval. Dates are whole model years and invalid/empty assumptions do not silently become zero.

## Independence and editing

Revenue, profitability and capital have separate calendars. The cash-flow schedule extends far enough to include all required years. Existing revenue, investment, tax and discount-rate rows are retained when adding a margin-only extension; new years are explicitly generated assumptions. Original research remains available through Use research, and full Undo restores the preceding draft.

Guided's Simple transition mode uses current edited scalar inputs; switching out of the phased mode does not restore old input values. Year-by-year's manual mode keeps its explicit margin rows when the phase generator is turned off. Phase settings are retained for reuse. In Year-by-year, applying phase controls regenerates margin rows; subsequent individual-year edits are identified as manual overrides. Growth-only changes preserve those calendar-year overrides.

Monte Carlo keeps the starting margin fixed and shifts the interim and final targets together. The induced calendar-year change is added to each forecast margin, preserving manual row offsets. Invalid targets are excluded, not clipped. No change to the old absent/disabled-path Monte Carlo behavior is made.

## Damodaran principles and our implementation

Damodaran separates the sustainable target margin from the path to it, with mature businesses providing a reference. [Young-growth value drivers](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/younggrowthvaluedrivers.htm).

His discussion also allows unusually high margins to decline as competition or loss of protection changes the business. [Growth-company value drivers](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/growthvaluedrivers.htm).

In a standard steady-state setup, a target described as genuinely sustainable usually serves as the terminal margin. An additional peak-and-decay stage should express a separate business assumption, not an automatic rule. This application's piecewise curve is a modeling convenience, not a required Damodaran template or a claim that every company has the same margin life cycle.
