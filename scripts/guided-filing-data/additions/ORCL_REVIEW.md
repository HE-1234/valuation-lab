# Oracle source and model review — 2026-10-21

Files added: `ORCL.json`, `history/ORCL.json`, `additions/ORCL.json`. Source amounts are USD millions; share counts are millions. No application, shared builder, other-company, or test files were edited by this research task.

## Latest filed coverage and original-document cross-check

SEC submissions list the FY2026 10-K, filed June 22, 2026, accession `0001193125-26-277521`, and Q1FY2027 10-Q, filed September 11, 2026, accession `0001193125-26-389274`, as the latest annual and interim filings available by the cutoff. Original financial statements and financing, lease, equity and compensation notes were retrieved and checked.

| Field | FY2026, May 31 | TTM, August 31 |
|---|---:|---:|
| Revenue | 67,357 | 71,776 |
| GAAP operating income | 20,606 | 23,057 |
| Cash, excluding restricted cash | 31,289 | 36,369 |
| Current marketable securities | 605 | 708 |
| Nonmarketable investments | 2,300 | 2,400 |
| Notes payable and borrowings | 129,541 | 125,337 |
| Finance lease liabilities, separately classified | 7,701 | 9,185 |
| Total mapped financial debt | 137,242 | 134,522 |
| Actual period-end common shares | 2,880 | 3,024 |
| Preferred carrying, retained as source only | 4,954 | 4,954 |
| Noncontrolling interests | 548 | 424 |

TTM revenue = 67,357 + 19,345 − 14,926. TTM operating income = 20,606 + 6,728 − 4,277. Quarterly statements report current borrowings 7,625 and noncurrent 117,712; current/noncurrent finance leases 749/8,436. The 141m ATM shares and $19.9bn net cash proceeds are already captured in the August balance sheet. The $2.565bn restricted-cash balance is outside cash and cash equivalents and is not deducted twice.

## Material financing and ownership allocation

- Series D preferred was issued February 5, 2026. Its $5bn liquidation amount mandatorily converts January 15, 2029 into 24.99063–31.238285m common shares, depending on future market prices. The model defaults to maximum shares and offers minimum-share sensitivity. It does **not** deduct the $4.954bn carrying principal as well.
- Remaining preferred cash dividends are $81.25m quarterly. Annual: 11 payments July 15, 2026 through January 15, 2029, total $893.75m, PV $820.626671m. TTM: 10 payments October 15, 2026 through January 15, 2029, total $812.5m, PV $751.836345m. Present values use a separately labelled 6.5% annual discount proxy and exact day fractions/365.25. The coupon rate is disclosed; using it as discount rate is an analyst choice. Nominal-payment sensitivity is retained.
- Unfunded pension liability of $256m is included once; the August balance is explicitly carried from the annual disclosure. Matched deferred-compensation assets/liabilities are excluded.
- Short-term capex financing has a separate cash-flow line outside the reconciled notes-payable schedule, but no disclosed standalone closing balance. The model uses an explicit proxy: assumed zero May 2024 opening + $1,422m FY2025 net proceeds + $3,345m FY2026 net proceeds − $830m Q1FY2027 net repayments for the TTM. This produces $4,767m/$3,937m. Zero opening, no noncash/FX changes and no unidentified offsets are assumptions, not filed facts. An omitted $1bn opening balance changes value by roughly $0.33/share. The source claim stays null. Notes payable declined $4,204m during Q1 against $4,202m of separate notes repayments; the additional $830m supplier repayment is not counted again inside notes debt.
- A separate operating cash reserve uses the $4,592m annual increase in deferred revenue from customer prepayments with significant financing components, plus $11,363m in Q1, yielding $4,592m/$15,955m. It is a conservative cash-flow accumulation, not legally restricted cash or an exact closing obligation. No duplicate debt deduction is made. Full/half/omitted-reserve sensitivities expose material uncertainty. The reinvestment assumption does not assume repeat future prepayment funding.

## Employee dilution

The annual filing reports 81m restricted awards and 21m total options at $217.63 weighted strike. The 20m vested/expected-to-vest subset contains approximately 5m vested at $49.37 with 1.64-year life and 15m expected at $275.90 with 9.35-year life. These rounded quantities do not exactly reproduce the subset weighted strike. The model includes the remaining 1m not-expected-to-vest conservatively at an inferred $184.88 strike so the modeled 21m weighted strike reconciles to $217.63. This is a disclosed approximation, not a separately reported tranche. Volatility 51% and rate 3.8% reuse annual grant-valuation assumptions as explicit outstanding-option proxies; the residual uses five-year life.

The quarterly filing reports 2m new restricted awards, 0.4m new options and 4m cancellations/forfeitures, without a full ending rollforward. Carrying the annual 81m/21m counts is conservative in aggregate before exercises and vesting; it is not labelled an exact August count. Market-price intrinsic value for the 20m subset is evidence only and is never deducted again from the DCF allocation.

## Capital intensity and valuation default

The selected $0.22 sales-to-new-capital assumption is anchored to FY2026 incremental revenue $9,958m divided by cash capex $55,663m less depreciation $7,623m, or 0.207. TTM cash capex is $75,660m. This is a deliberately capital-intensive forecast scenario, not a software-business efficiency assumption. With 18% initial growth fading to 3%, a 32% GAAP margin, 20% normalized tax, 10% discount rate and 15% mature marginal ROIC, the modeled enterprise value is below existing net financing claims. The common residual is negative and the application uses its zero-equity floor. The default was **not** tuned upward to force positive value.

This result is conditional, not an assertion that the company is worthless. Post-buildout efficiency, customer funding, terminal return and capacity utilization are consequential. The mature 15% marginal ROIC implies eventual efficiency improvement from the current buildout. $288bn of uncommenced leases and $34.15bn purchase obligations are future operating/reinvestment commitments; adding them mechanically as present debt would duplicate future operating/capital economics. The $664bn remaining performance obligation is not current revenue or guaranteed profit.

Gross uncertain tax exposures plus interest/penalties are $13.2bn at May 2026; they are flagged as material settlement uncertainty rather than all being assumed immediately payable in addition to normalized operating taxes. Nonmarketable investment carrying values are explicit economic-value proxies; a 50% haircut is roughly $0.4/share.

## History and validation

Eleven real annual observations, FY2016–FY2026, provide ten displayed fiscal years plus an opening observation. Each core amount has a Company Facts tag, exact accounting dates, original filing URL, accession, raw currency amount and unit conversion, or a sourced derived formula with component facts. Pretax income is domestic + foreign pretax income, avoiding confusing preferred/common net income tags. Finance leases are added to notes debt where separately quantified; the supplier-financing proxy is not silently inserted into reported history.

Topic606 restated FY2017 and FY2018. FY2016 opening context is not recast; the accounting-basis break prevents false comparable FY2017 growth and opening-capital ratios. Latest-reported figures are contextual, not a point-in-time backtest. Historical book capital is not used directly as the future cash investment requirement.

`GUIDED_CUTOFF=2026-10-21 python3 scripts/guided-filing-data/validate.py ORCL` passes, retaining two intentional unknown source supplier-financing values. The existing history adapter parses all 11 observations with dated provenance and the intended accounting-basis break. Core annual and TTM arithmetic was independently recomputed. Application integration, claims sensitivity tests and UI checks belong to the parent task.
