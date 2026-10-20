# Model design and replay

## Dates and perimeter

Capital anchor: 30 June 2026. Information cutoff: 19 October 2026. Cash flows begin in July 2026; the remaining 2026 half-year is followed by ten full annual buckets, 2027–2036. This deliberately captures the announced support plan through its end. The terminal year is 2037. Forecasts are nominal USD; FX is modeled explicitly in the first year and assumed stable thereafter.

This is an October-informed, June-discounted conditional study. It must not be described as an investment view that was available in June or a current October price target.

The core includes rent/royalties and consolidated restaurants, including fees paid by equity-method affiliates. It excludes equity-method ownership earnings, dividends and separately valued equity stakes. An explicit bridge may value those ownership interests separately, net of the royalties they pay. This avoids counting both an affiliate stake and its earnings in core EV.

## Revenue construction

For each franchise ownership cohort:

    sales[t] = sales[t-1] × (1 + comparable growth)
               × (1 + new-unit sales contribution) × (1 + FX)

Corporate rent before NEXT relief is conventional franchisee sales multiplied by a blended rent yield. Royalties are all franchisee sales multiplied by a blended royalty yield. The opening yields reproduce 2025 disclosed totals, but are not asserted contractual rates. Initial fees follow an explicitly assumed count-growth path. Company-operated sales have their own growth path. Other revenue has its own path; its profit contribution follows the much smaller 2025 residual profit, not the franchise margin.

The restaurant-count illustration is never multiplied into the sales formula again. Sales contribution and count growth differ because new locations operate for partial years, mature over time and differ in average sales. The package does not forecast each opening cohort or local contract separately.

Systemwide sales equal franchisee sales plus company restaurant sales. Corporate rent, royalties and initial fees are not added to systemwide sales.

## EBIT and annual FCFF

    franchise profit = rent after relief + royalties + initial fees
                       − franchise occupancy expense
    company profit = company sales × company restaurant margin
    core EBIT = franchise profit + company profit + other profit
                − SGA − ordinary other expense − restructuring expense
    NOPAT = core EBIT × (1 − normalized cash tax rate)
    FCFF = NOPAT + consolidated D&A − cash capex
           − new finance-lease assets − increase in operating NWC

The forecast contains no recurring disposal gains, no affiliate equity earnings, and no SBC addback. Ordinary other expense and a residual restructuring-like expense remain, so normalization does not assume a permanently charge-free business.

The first stub is not half of an arbitrary annual FCFF. Full-year revenue, operating contribution, D&A and cash capex are reconciled against observed H1 values. H1 contribution before other operating items is $6,186m: $6,292m GAAP EBIT less $106m of other operating income. H2 separately incurs estimated ordinary other expense and the unspent portion of annual restructuring expense. H2 finance-asset additions and NWC investment remain clearly labeled assumptions because precise H1 additions and seasonality were not verified.

The model's full-year core margin is not directly the reported GAAP margin: it excludes affiliate earnings and disposal gains and retains its specified other costs. The annual forecast table preserves all components so the distinction is visible.

## Rent relief and capital partnering

The base assigns $1.75bn of capital support and $3.25bn of rent relief during 2027–2030, totaling the announced $5bn. A further $3.5bn is assigned over 2031–2036; its 35% capital / 65% rent split is an analyst assumption. The bear increases support costs by 20%; the bull retains the base cost envelope. Neither case treats the program as a debt claim in addition to its cash-flow charge.

Rent relief reduces revenue and EBIT once. Capital support is included in capex once. No second deduction is made in the bridge. The forecast does not claim the undisclosed annual schedule is management guidance.

## Leases and real estate

Operating leases remain operating costs. No operating-lease liability is subtracted from equity and no operating ROU asset is added to EV. This is a lease-expensed enterprise-value convention.

Finance leases are financing. Their amortization remains within the consolidated D&A addback, while new finance ROU assets are charged as economic investment. Existing finance-lease claims must be supplied in an explicit bridge. Finance principal repayments are not also deducted from FCFF. New lease financing does not make the underlying asset investment free.

This convention is important because the interim taxonomy calls combined lease balances “operating” liabilities. The rendered statement and annual split govern scope. Unknown June finance-lease claims stay null. Corporate PP&E and restaurant property are already supporting modeled operations; a standalone real-estate value is not stacked on top.

## Taxes, working capital and SBC

Tax rates are normalized cash-tax proxies, not audited tax-return forecasts. Base tax rises from 22% to 23%; bear eventually reaches 25%; bull stays at 22%. The model adds no deferred-tax assets or speculative refund value. Legal/tax contingencies and the source inconsistencies listed in the capital file still need a non-overlapping capital review.

Working capital uses a stated percentage of incremental corporate revenue before temporary rent relief. This avoids a fictitious receivables release from a modeled rent discount. H2 uses half the annual incremental charge; it is not an assertion that seasonal H1 cash swings reverse. All working-capital assumptions are editable.

Full SBC economic cost stays within SGA as cash replacement. There is no forecast EPS boost from automatic buybacks or a shrinking share count. The optional existing-award reserve must be incremental to compensation already charged in future SGA. June awards were not fully verified, so the default cannot allocate EV to common shares simply by substituting the EPS denominator.

## Terminal logic

    terminal NOPAT = 2036 core EBIT before finite NEXT rent relief
                     × (1 + g) × (1 − terminal tax)
    terminal reinvestment = terminal NOPAT × g / incremental ROIC
    terminal FCFF = terminal NOPAT − terminal reinvestment
    terminal value at end-2036 = terminal FCFF / (WACC − g)

The finite support program ends after 2036, but asset renewal and growth do not. A g/ROIC reinvestment charge replaces the explicit-period capex/D&A/NWC calculation in the terminal year; it is not layered on top of it. Reinvestment includes the economic needs of finance-leased assets. A perpetuity with positive growth and no reinvestment is not allowed.

Bear/base/bull WACC is 9.5% / 8.0% / 7.0%; terminal growth is 2.0% / 2.5% / 3.0%; incremental ROIC is 13% / 18% / 22%. These are editable analyst scenarios, not current market-derived cost-of-capital estimates. The engine rejects g greater than or equal to WACC or ROIC, nonfinite inputs, invalid rate ranges, malformed annual arrays, and FY capex or D&A below observed H1.

Year-end discounting uses 0.5 years for H2 2026, then 1.5–10.5 for 2027–2036. Terminal PV is discounted 10.5 years. The exported terminal fraction is about 60% in the base case; forecast uncertainty remains significant.

## Capital allocation gate

Default EV-to-common allocation is unavailable. `allocation-policy-template-v2.json` contains nulls for the unknown finance lease claim, affiliate equity value, minimum operating cash, incremental existing awards, other assets and other claims. An explicit policy must provide all of them and acknowledge non-overlap and the dated-only perimeter.

    conditional common equity = core EV + cash − minimum operating cash
                                + separately valued affiliates + other assets
                                − debt − finance leases
                                − incremental existing awards − other claims

The denominator is the exact June common-share count, 707,641,531. A cash shortfall against the operating reserve is deducted rather than clipped to zero. Negative operating EV, terminal FCFF or common equity suppresses the per-share result. Current target and current upside stay null even when a complete illustrative policy is supplied.

The supplied illustration is not a default, verified June claim appraisal, or funding certification. It uses $2.5bn for finance leases, $4.4bn for affiliates, $0.8bn for operating cash, and $1bn each for incremental awards and other claims. Those assumptions are visible in its output. This simple allocation does not prove future debt refinancing, mandatory payments, dividends or buybacks can be funded. Integration readiness remains restricted accordingly.

## V2 editable-input guard

Full-year 2026 restructuring expense must be at least the observed H1 charge of $98m. Equality permits zero additional H2 restructuring. Values below $98m are rejected rather than creating an implicit H2 reversal. An actual reversal would require a separately supported model policy and is not silently inferred.
