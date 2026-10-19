# Replay and admission mechanics

## Scope and dates
The model values consolidated foundry operating cash flows plus dated cash/time deposits, less explicit financial and other claims. **All nonoperating equity investment value is excluded**, including direct securities and equity-accounted associates. This does not mean those assets are worth zero. The model also grants no circular-ownership share reduction. A total-company portfolio valuation requires a new reviewed model; the replay rejects nonzero portfolio value in this version.

Balance and conversion date are June 30, 2026; information cutoff is October 19. Historical data and forecasts are nominal TWD millions. Year 1 ends June 30, 2027. The starting revenue anchor of NT$259,541.128m is twice H1 revenue, not LTM actuals. Later monthly sales and expansion announcements inform explicit forecasts but do not roll the capital balance forward.

Current targets and selected policy are null. Each policy is an illustration requiring opt-in; it is not a recommended or statistically calibrated default. A conditional USD-per-ADS value is always accompanied by its June date, exclusion scope and complete selected funding/claims policy.

## Cash operating model
- Pre-lease operating profit = revenue × explicit analyst pre-lease margin.
- Normalized EBIT = pre-lease operating profit − total rental-equivalent lease cash.
- Cash tax = positive normalized EBIT × scenario tax rate (20%, 22% or 25%). No loss refunds, DTA monetization or separately credited interest shield.
- FCFF = normalized EBIT − cash tax + **nonlease** D&A − all-in cash capex − 25% × revenue change − supplemental operating cash obligations.
- All-in capex covers PP&E, intangibles, old equipment payables and new contracted construction/IP outlays within the explicit budgets. It does not include lease rent, past decommissioning settlement or a second copy of the phased board budget.
- Future operating margins retain recurring compensation/SBC costs; no blanket SBC addback, investment income, share of associates, nonoperating mark-to-market or deferred-grant amortization is included.

Leases are deliberately recast as operating rental cash. Forecast D&A excludes ROU depreciation; historical total D&A is a reference, not a false source for future nonlease amounts. Lease interest is excluded from financial-debt interest. No lease-liability PV is deducted from equity. This same normalized treatment persists in terminal profit.

Terminal NOPAT = (last-year revenue × last pre-lease margin − last-year lease cash) × (1+g) × (1−tax).

Terminal FCFF = min[terminal NOPAT × (1−g/12% incremental ROIC), last-year FCFF × (1+g)]. ROIC reinvestment covers nonleased operating capital. This avoids both free perpetual investment and a hidden year-11 drop in capex. Every scenario requires WACC > g and ROIC > g. Neither WACC nor the scenario paths is fitted to a market quote.

## Share allocation and currency
June issued 12,576,984,870 minus treasury 30,551,000 = 12,546,433,870 ordinary shares. The example additionally assumes all **67m** newly authorized 2026 restricted shares are issued without cash proceeds. This is the disclosed authorized maximum, not verified actual issuance. Existing already-issued restricted shares are already in the June denominator and are not added twice. The source's performance-condition wording inconsistency is retained in the capital notes.

Retaining SBC expense with a maximum award share allocation can be conservative because expense and outstanding claims may overlap; no exact fair-award appraisal is asserted. The supplemental award cash reserve, if selected, is a separate analyst stress and must not be mislabeled as the issuer's estimated compensation expense.

TWD per ordinary = common equity value / conditional ordinary shares.
USD per ADS = TWD per ordinary × 5 / 31.837.

31.837 is the June 30 central-bank closing rate. No weighted-average earnings FX, current quote, or ADS deposit count is substituted. Values exclude the already-declared dividend distribution, which is separately reserved.

## Equity bridge and claims
Common equity = EV + cash + recoverable current time deposits − financial debt − required operating cash − known cash claims − selected residual claims.

Known claims (TWD millions):
- Customer guarantee/capacity deposits: 40,674.252
- Declared dividend payable: 32,704.164009 (exact TWD source converted to millions)
- Existing current tax liability: 5,216.199
- Contract liabilities: 6,213.892
- Refund liabilities: 4,922.969
- Net past-service pension deficit: 833.593
- Decommissioning/restoration provision: 926.028
- Onerous-contract provision: 105.949
- Accrued carbon fees: 41.971

These are deliberately reserved at their sourced carrying/contractual amounts up front and excluded from future working-capital/settlement runoff. They are not additional annual FCFF charges. The full contract/deposit reservation is a conservative allocation, not a contractual statement that all amounts are immediately refundable. Future recurring carbon/pension service cost remains in operating margins; legacy deficit/shortfall settlement is separate. Historical/prospective deferred-tax balances are not treated as cash or blindly netted; cash operating taxes already cover operating timing, and no nonoperating asset disposal is assumed.

The selected NCI reserve is an analyst amount, not the NT$4.051m book balance relabeled as fair value. Nonzero supplemental senior/award cash claims are deducted from both equity and spendable cash. Nonzero incremental operating obligations reduce FCFF and funding once.

Financial debt is NT$57,557.436m: banks 17,892.245 + domestic bonds 39,100 + Novatek exchangeable redemption proxy 565.191. The Novatek obligation is not UMC share dilution. Its contractual redemption calculation uses its fixed contractual conversion terms, not an incorrect June spot translation of its original dollar face.

## Funding policies
Time deposits with original maturity over three months are included in the equity bridge at the selected recovery fraction, but only enter liquidity in annual bucket 1. They are not FCFF or financing proceeds. Under the staged policy, even initial liquidity before this release is positive; no early withdrawal is assumed.

1. **All-bank-upfront exclusion policy:** reserve all bank principal immediately. After the source-verified legacy claims, initial liquidity is **−NT$489.988009m**. All three per-share outputs remain withheld.
2. **Liquidity/claims stress:** larger cash buffer and claim reserves, partial time-deposit recovery, higher lease/interest costs and incremental operating outlays. All outputs remain withheld. This is uncalibrated stress, not a probability estimate.
3. **Staged-bank policy:** reserve current bank principal NT$6,402.321m immediately and pay every remaining NT$11,489.924m of bank principal in year 2. This is an intentionally early allocation, not a claim to know exact annual installment dates. Domestic bonds follow their disclosed month/maturity schedule; the Novatek redemption is reserved immediately. No principal is counted twice. Initial available liquidity is **NT$10,999.935991m**, and all three annual paths pass.

Financial interest budgets are NT$2bn annually for years 1–5 (NT$3bn stress), above observed run-rate and distinct from lease rent. They end after year 5, when all modeled June financial debt has matured/been paid; no unmodeled refinancing or new borrowing is assumed. Bank and other upfront reserves pay their eventual obligations from reserved cash, not a second withdrawal from available liquidity.

The annual test does not certify daily cash access, intrayear capex timing, currency conversion, cross-border transfer availability or customer-renewal conditions. The tightest initial-cash differences are shown rather than hidden by adding later convertible proceeds.

## Reproduction
Run `python replay_v1.py`, then `python test_v1.py` and `python independent_validate_v1.py`. Public-safe archives exclude raw HTML/PDF/full text; use the independent validator's `--public-safe` mode for the explicit raw-source verification skips. Numerical, unit, claim, FX and policy tests still run. Source URLs and SHA-256s are retained. After freeze, corrections require a new version rather than overwriting this package.
