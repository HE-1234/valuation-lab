# Correlated annual growth paths

Implemented at the user's request on 2026-10-18. This is an analyst-selected simulation model, not an issuer forecast, fitted Gaussian-process regression, or a Damodaran-prescribed parameterization.

## Economic interpretation

The deterministic valuation supplies each year's baseline revenue growth, including its existing decay. A Gaussian AR(1) deviation is added around that baseline. The user selects fixed forecast years, annual innovation standard deviation (in percentage points in the interface), and persistence. Fixed years retain their baseline rates exactly. The complete Gaussian path is conditioned on future fixed anchors, including the fixed stable-growth endpoint. It is not a random walk centered on last year's raw growth and is not a collection of independent annual guesses.

Innovation standard deviation measures new shocks before conditioning; total year-specific uncertainty also depends on persistence, elapsed years and anchors. Conditioning reduces uncertainty near fixed anchors. Sample paths displayed are a small subset of actual completed simulations, not confidence intervals. The default 3 percentage-point innovation and 0.6 persistence are illustrative assumptions, not empirically calibrated probabilities. Fixed years are model assumptions, not claims that company guidance is certain.

## Compatibility and safety

Fresh simulation configurations use annual-path sampling. Previously saved configurations with no method field retain the legacy single-draw method. The method selector allows either approach. The legacy growth distribution remains available when selected. Other financial drivers retain their established distributions. Existing data sources, frozen cases, capital and margin calendars, and claims allocation remain authoritative.

Impossible or numerically invalid scenarios are excluded without replacement, not clipped or silently redrawn. The displayed output therefore describes accepted scenarios conditional on these model constraints. Revenue is compounded along the simulated path; reinvestment follows the applicable existing valuation engine's policy. More simulation trials improve numerical sampling precision, not the credibility of assumptions.

## Sources and design rationale

- Aswath Damodaran, [Dealing with Distress in Valuation, Steps in Simulation](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/distresspaper.htm), reviewed 2026-10-18: explicitly discusses repeating draws annually with correlations across variables and across time, and warns that unsupported distribution choices can make simulation uninformative. This implementation is an application of that general framework, not a claim that he prescribes Gaussian AR(1) bridges.
- Raluca Budiu, NN/G, [Memory Recognition and Recall in User Interfaces](https://www.nngroup.com/articles/recognition-and-recall/), 2024-01-15, reviewed 2026-10-18: put scope, fixed-year state and interpretation beside the controls. Preserve the user-approved Annual Report skin rather than introducing a new visual system.

The ball replay is a visualization of already-computed outcomes. Chart-wide starting positions do not generate additional valuation samples or alter histogram bins.
