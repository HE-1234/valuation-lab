# Optional October conditional allocation: ledger guide

Cutoff: 19 October 2026. All dollars are USD millions; explicit EUR fields are EUR millions. Use the June illustration only after accepting its assumptions. This engine provides editable conditional arithmetic, not a verified October price target. The shipped October policy is unselected. No unknown fact is silently set to zero.

## 1. Operating value

Let t = 111/365.25 years from June 30 to October 19. For each scenario:

    October operating EV = June operating EV × (1 + WACC)^t
                         − interim economic FCFF × (1 + WACC)^(t/2)
                         + Getir food operating EV
                         + Careem consolidated operating EV
                         + Blacklane operating EV

This is a dated runoff/rollforward convention. Interim cash is assumed to arise at the midpoint. New deal EV entries are chosen October values, not purchase prices. If an acquisition is already embedded in the June operating forecasts, adding it again would duplicate value; the policy requires explicit acknowledgment of perimeter and no overlap.

## 2. Actual cash ledger

Economic FCFF in the June DCF treats SBC as a recurring economic cash-replacement cost. It is not automatically actual cash. The model therefore reconciles:

    Actual operating cash after reinvestment, before interest
      = economic FCFF
      + SBC cash-equivalent reversal
      + operating cash-tax difference
      + insurance/collateral/working-capital difference
      + reinvestment/timing difference
      + other operating cash difference

All differences are signed: positive adds actual cash. The cash-tax line includes any actual interest-tax-shield difference. Actual cash interest is deducted in full exactly once later. Explain the scope and tax basis in cash_reconciliation_basis. Do not add CFO and this result together. Cash acquisitions, financial investments and debt are excluded from this operating line.

    Ending unrestricted cash/investments = 5,391 June liquidity
      + reconciled actual operating cash
      − actual cash interest
      + euro-note proceeds at issue FX
      + retained-euro-note cash translation
      + realized euro-proceeds FX adjustment
      + other cash FX translation
      + other debt cash proceeds − actual existing-debt repayments
      − buyback cash
      − 465 Getir consideration − Careem cash − Blacklane cash
      + named acquired cash
      − legacy claim cash settlements
      + signed other nonoperating cash flow

The last line can include investment sales/purchases, distributions, ESPP/option exercise proceeds and other financial flows, excluding everything already listed. Pair a sale with investment removal. Pair equity proceeds/SBC reversal with actual share issuance or an explicitly assumed rights claim. A cash receipt here does not reduce operating EV. Market-value debt retirement need not equal principal cash repayment; both are explicit.

## 3. Euro-note proceeds and FX

Known source arithmetic, before any USD conversion:

- Principal: 4,500
- Public issue discount: 10.6925
- Gross public proceeds: 4,489.3075
- Underwriting discounts: 24.875
- Issuer proceeds before other expenses: 4,464.4325
- Issuer-estimated final net proceeds: approximately 4,453
- Implied estimated other expenses: approximately 11.4325

The two known discounts are fixed. euro_note_other_offering_expenses_eurm is the only remaining cost choice. Selecting 11.4325 reproduces the issuer's rounded estimate; it does not verify actual settlement cash. Do not enter underwriting again in this field.

    Assumed net EUR proceeds = 4,464.4325 − other offering expenses
    Initial USD proceeds = net EUR proceeds × issue-date EUR/USD
    Retained-note-cash FX = EUR proceeds still retained × (current FX − issue FX)
    Current note debt claim = 4,500 × current FX × current total-value fraction

Use EUR/USD as USD for one EUR. The retained-EUR amount is a subset of net proceeds still in unrestricted cash as of October 19. Converted/spent proceeds need a stated disposition and any realized FX adjustment. All-retained EUR cash revalues alongside debt. With debt at par, FX changes affect the residual issue-cost difference, not the whole principal. The total-value fraction must cover the entire note claim, including accrued interest. Other foreign-currency cash belongs in the separate signed translation field. The model rejects a retained-note-cash amount exceeding net proceeds or total ending cash.

## 4. Closed deals and investments

Each named Getir, Careem and Blacklane entry has operating EV, consideration, acquired cash, debt, NCI and other claims. Other deal claims include finance leases and noncommon tax/legal obligations not already captured elsewhere.

- Getir: fixed approximate cash consideration of 465 covers 100% food control and a minority grocery investment. The grocery investment is credited in the investment ledger, not consolidated into food EV. Neither food EV nor grocery value is inferred from consideration.
- Careem: remove the component already included in the selected June investment asset value. The illustration explicitly identifies 117.6 = 147 book × 80% selected category factor. It is part of the existing total, not another asset. Then add consolidated EV and all newly consolidated claims/cash.
- Blacklane: acquisition status is supported by the acquiree notice. The older 550 agreement amount is not assumed to be exact cash paid; an explicit choice is required.

    October investment value = selected June investment value
                             − selected June Careem component
                             + Getir minority grocery investment
                             + other signed investment value changes

Do not put Getir or Careem changes into the generic investment-change field again. Other changes include disposals, additions and marks with stated tax/realization assumptions. Pending Delivery Hero/ezCater offers are not automatically paid for, consolidated or funded.

## 5. Debt, inherited claims and ownership

    Debt = selected June debt value + explicit existing-debt mark change
         − retired existing-debt value + current euro-note claim
         + other debt value added + named acquired debt

Every inherited nondebt claim is selected expressly at October 19: options, finance leases, NCI, redemption claims, legal/tax/mixed/other claims and prospective net commitments. These fields replace the inherited June values; they are not automatically added on top. Named new-deal NCI/other claims are separate and must not overlap. The output shows each change from June. A cash settlement only changes cash until the corresponding current claim amount is separately revised.

    Equity = operating EV + ending unrestricted liquidity
           − chosen current operating cash reserve
           + investment value − debt − all nondebt claims
    Per share = equity × 1,000,000 /
                (current common shares + selected existing-award units)

Both ownership inputs require whole units. July 31 exact common shares are a dated source observation, not October ownership. Future economic SBC remains in the operating model; existing/issued awards require an allocation without charging the same service twice.

## 6. Boundaries

A positive ending cash balance does not prove daily liquidity, local cash fungibility, covenant compliance or later funding. June's 2,000 term loan matures December 2026 and is already in the debt claim. The undrawn June 1,000 commitment expired August 2 unless drawn/extended; no October availability is assumed. Interest, refinancing, acquisitions, investment/vehicle commitments and future claims require separate funding assessment.

All current-target/admission flags remain false. The verifier uses fully specified synthetic fixtures to test arithmetic, including paired FX, cash/investment sales, Careem removal and deal consideration; those fixture values are not a recommended scenario.
