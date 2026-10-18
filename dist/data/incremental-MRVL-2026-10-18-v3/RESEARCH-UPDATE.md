# MRVL: dated conditional research ready, common-equity allocation conditional

Information cutoff: October 18, 2026. Financial origin: August 1, 2026. Capital inventory: August 18, 2026. Values are USD millions unless stated. This is retrospective-information research, not an August backtest or an October price target.

## Decision

The unchanged independently reviewed operating model is ready for an EV-only case: downside **$30.441bn**, base **$100.409bn**, management delivery **$211.790bn**. Missing exact October balances do not prevent this dated study. No Site has been edited or published. The added claim framework can be exposed as explicitly editable conditional inputs, with unresolved inputs left blank; it cannot silently output a company target.

The corresponding capital pools before employee, customer-warrant and Celestial earnout claims are $27.797bn / $97.765bn / $209.146bn. They include a $1bn operating-cash reserve and retain v2's consistent opening license, restructuring and tax deductions. These pools are not common-equity values. Using the reported $749.5m earnout carrying value as a provisional alternative gives $27.047bn / $97.016bn / $208.397bn before employee and customer claims. That mark is not a scenario-specific earnout valuation.

## What closed

1. Historical covenant compliance is a fact: the [Q2 filing](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001835632-26-000025/mrvl-20260801.htm) explicitly reports compliance as of August 1. Future borrowing ability remains conditional.
2. The [revolver agreement](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-25-152676/d859414dex101.htm) tests gross contractual debt against trailing contractual EBITDA at 4.00x. The defined EBITDA makes specified adjustments and incorporates pro forma acquisitions/dispositions; it is not the economic DCF's EBIT. With only $4,999.9m face debt as a proxy, the implied EBITDA thresholds are $1,249.975m without borrowing, $1,546.2m at v2's $1,184.9m base peak draw, and $1,624.975m at a full $1,500m draw. Additional counted debt raises these thresholds. Neither cash netting nor automatic access is assumed. Expiry remains June 2030.
3. The guidance sample now covers 16 contiguous quarters, Q3 FY2023–Q2 FY2027. Revenue exceeded original quarter-ahead midpoints in 15/16, remained within the stated ranges in 16/16, and beat by 1.10% on average (0.96% median). Adjusted EPS met/exceeded midpoint in 15/16. Adjusted gross margin was below midpoint in 11/16; that is not necessarily a range miss. New primary sources fill [Q2 FY2024](https://investor.marvell.com/news-events/press-releases/detail/172/marvell-technology-inc-reports-second-quarter-of-fiscal-year-2024-financial-results), [Q3 FY2024](https://investor.marvell.com/news-events/press-releases/detail/163/marvell-technology-inc-reports-third-quarter-of-fiscal-year-2024-financial-results), and the intervening guidance observations. A noncontiguous sample is no longer necessary.

## Guidance credibility

The evidence supports confidence in conservative near-quarter revenue execution. It does not validate the October investor-day $20bn FY2028 or $70–90bn FY2031 outlook. Those are uncompleted targets, with significant product-ramp, customer-concentration, margin-mix and supplier-capital requirements. The primary deck's long-run scenarios remain prospective management evidence, not achieved results. Do not transform the historical 15/16 beat rate into an execution probability for those targets. Non-GAAP EPS excludes economic costs retained by the valuation model. No new valuation probabilities are assigned.

## Claims and capital needs are separate

- The $2bn NVIDIA proceeds are already in August cash. Its 21.778m economic common equivalents join August 18 common shares to produce 898.704613m base units. No additional $2bn preferred deduction.
- Employee awards require a consistent legacy claim value; recurring future compensation remains charged to operations. The 30.581074m target award inventory is not a universal dilution ceiling, particularly for performance awards.
- Celestial earnout treatment must choose joint fair value OR scenario-earned shares plus cash. Do not deduct $749.5m and add 22.378470m shares/$233m cash together. Acquisition consideration already paid or issued is not charged again.
- The [Google warrant](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-26-356217/d412696dex41.htm) has a 58.970907m cap at $206.58. No time-based tranche has vested by October 18; first is November 18. Performance vesting by the cutoff is unestablished. Cash exercise adds matching proceeds; cashless exercise adds only net shares. The complete conditional settlement function is supplied, but is not a long-dated option fair value. Full hypothetical cash proceeds of $12.182bn are not current funding.
- The $131m forward asset is already separated from NWC; the $300m notional is neither excess cash nor a share reduction. Original settlement confirmation remains unavailable from the reviewed sources. Unknown loss exposure is not set to zero or capped at notional.
- V2 funding screens remain sensitivities. Actual withholding, supplier timing, forward cash settlement, future covenant access and refinancing are unresolved. Historical compliance does not turn a cash-screen success into a liquidity guarantee. Cash deficits are not separately subtracted from EV without explicitly modeling financing costs/dilution.

## Deliverable and checks

`dated-conditional-valuation.json`, `google-conditional-settlement.json`, `covenant-gate.json`, `guidance-contiguous-16q.csv`, `guidance-credibility.json`, source ledger, readiness and executable build script accompany this report. Frozen legacy files are hash-checked unchanged. V3 is an additive author review, not a new independent audit; unchanged EV retains its existing v2 independent review.
