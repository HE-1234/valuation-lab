# Annual operating uncertainty

This app models uncertainty around the edited operating forecast. It is not a stock-price process or a calibrated probability forecast. The Gaussian AR(1) bridge and its settings are explicit app modeling choices, not a method or estimated defaults attributed to Damodaran.

## Inputs and derived quantities

- Guided: annual growth, EBIT margin, operating tax rate, WACC, and incremental sales / capital.
- Year-by-year: annual growth, EBIT margin, operating tax rate, WACC, and a net-investment response factor. The factor multiplies the existing signed investment schedule after the selected fixed-schedule, revenue-scaled, or committed-floor-plus-growth response. At factor 1, fixed-schedule preserves edited pre-reserve investment; revenue-responsive policies may change it. Selected fixed funding is not multiplied. Required operating-cash changes are derived separately from revenue. Direct signed dollar-investment paths are supported only for an exogenous fixed-schedule policy.
- Revenue, EBIT, cash tax, NOPAT, reinvestment in Guided, FCFF, discount factors and implied capital returns are derived once. They do not receive independent duplicate shocks.
- Source financials, opening historical anchors, dated security/claims inputs, horizon and timing remain fixed. Existing scenario-dependent claim repricing and incomplete-share/claim gates remain in force. No missing fact becomes zero. Losses receive no automatic tax credits or loss carryforward.

## Units and defaults

Growth, margin, tax and WACC innovation SDs are entered in percentage points; sales/capital SD uses ratio units; the investment-factor SD uses multiple units. Direct investment uses the model currency in millions. New operating metric SDs start at zero until edited. Existing growth uncertainty and scalar terminal assumptions remain visible. Nonzero SDs are analyst assumptions, not sourced volatility estimates.

## Annual paths and fixed years

For each primitive, deviations follow x[t] = persistence × x[t−1] + innovation[t], starting at zero and conditioned on all selected exact baseline-year anchors and the terminal endpoint. Each metric has its own SD, persistence and fixed years. Its baseline retains edited interim peaks, declines and calendars.

Innovations are independent across metrics. Serial persistence is not a cross-metric correlation estimate. The optional existing operating-linked setting affects remaining scalar terminal draws only.

Selected fixed years remain exact. Zero SD removes residual annual innovation noise; a separately changed terminal endpoint can still move the conditional mean between fixed anchors. Zero SD with the baseline terminal endpoint reproduces the annual baseline exactly. All explicit years fixed preserves the complete explicit baseline even if the terminal continuation differs.

Sampled stable growth becomes the endpoint at the existing maturity year and stays identical across all plateau years. A user-fixed growth year at or after maturity conflicts with variable terminal growth: configuration validation requires removing that user anchor or fixing terminal growth to baseline. The app does not overwrite fixed years or move the maturity date.

## Terminal assumptions

Terminal margin and WACC use the existing scalar distributions (or research scalar shifts); annual metric paths condition toward those endpoints. Optional terminal growth, tax and marginal ROIC distributions are drawn once per scenario and default to baseline Fixed. Guided terminal sales/capital is derived from terminal growth, margin, tax and ROIC, not sampled again.

Terminal growth remains 0–5%, tax 0–60%, WACC above growth, and terminal marginal ROIC above growth. Annual bounds remain the engine's operating constraints. Invalid paths or terminal combinations are excluded without clipping or replacement; attempted, accepted and excluded counts are reported. A nonnegative investment response factor cannot reverse the existing investment/release sign. An explicitly enabled direct additive investment path can imply a signed release and is labeled accordingly.

## Compatibility and reproducibility

Saved configs without a method retain the original scalar method. Saved growth-only annual configs without annualMetrics retain their prior behavior until the user enables the new annual operating inputs. Fresh/reset runtime defaults add the new controls without changing frozen source research JSON. Seeded synchronous and asynchronous runs use the same draw order and equations. Scenario exports retain annual primitive paths, terminal draws, exclusions and input scopes so the calculation can be independently reconstructed.
