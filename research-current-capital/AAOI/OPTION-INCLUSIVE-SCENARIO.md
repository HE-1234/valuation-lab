# AAOI option-inclusive analyst scenario

As of October17,2026. This supplements the method refinement with the explicitly requested **simplified option-inclusive approximation**, not a contract-complete market fair value. No canonical files changed. Round user-facing output to about **$40/share**, not false penny precision. Reproducible full precision is retained for tests.

## Result

Using the central cash/stub ledger, dated claims carried forward, all August restricted/performance awards and full Amazon warrant cap:
- Operating EV3,571.416m; estimated cash663.980m; bank58.915m; vendor33.940m.
- Available value before note and warrants4,142.541m.
- Straight note including all remaining coupon cash flows101.644m.
- Conversion option63.152m; whole note164.796m.
- Warrant option270.970m.
- Common residual3,706.775m /92.320652m assumed shares =**40.151087**.

The $41.95 figure remains a separate intrinsic-only diagnostic. The difference reflects option time value and discounted debt, not a revision to the operating forecasts.

## Parameter/source/assumption register

| Parameter | Value | Source/date | Treatment |
|---|---:|---|---|
| Cash/stub |663.980136 /−281.317471m|Existing H2 envelope plus dated events, see conditional-proposal.json|Analyst phasing and CFO/FCFF estimates|
| Basic common|90.601134m|Aug20 prospectus plus Oct5 completed ATM|Other post-Aug20 changes assumed zero|
| Existing restricted/performance awards|1.719518m|Aug20 prospectus|Full vesting assumed; no future grants added to shares|
| Bank/vendor|58.915/33.940m|June10-Q|Unchanged assumption|
| Note principal/coupon|124.925m /2.75%|June10-Q and indenture|Unchanged principal|
| Note coupon schedule|Jan15/Jul15 throughJan15,2030|Indenture|Seven remaining1.71771875m cash coupons; dirty PV, no extra accrued-interest deduction|
| Conversion ratio/strike|2.88431837m shares /43.311793|Indenture rate23.0884/$1,000|No make-whole adjustment assumed|
| Note remaining term|3.247091years|MaturityJan15,2030|ACT/365.25|
| Warrant count|7.945399m|Original warrant|Full contractual vesting scenario|
| Warrant strike|23.6954|Original warrantSection1|Notes report23.6956; tiny discrepancy retained explicitly|
| Warrant term|8.402464years|ExpirationMar13,2035|No extension assumed|
| Volatility|80%;60/100% stresses|Historical grant80% in FY2025 10-K|Reused as analyst current equity volatility proxy, not measured current vol|
| Riskfree|5.09%|Treasury10-year Oct16,2026|Flat annual-effective proxy at both terms; BSM uses ln(1.0509); not a bootstrapped zero curve|
| Credit spread|500bp;300/800 stresses|Analyst assumption|Not observed AAOI spread|
| Straight-debt yield|10.09% central|5.09%+500bp|Annual-effective convention|
| Dividend yield|0|Grant model zero, continued by assumption|Not a forecast guarantee|

Primary links:
- [Treasury curve](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value_month=202610&type=daily_treasury_yield_curve), row10/16/2026,10-year column5.09, independently rechecked.
- [Issuer historical warrant option inputs](https://investors.ao-inc.com/node/16686/html).
- [Original warrant](https://www.sec.gov/Archives/edgar/data/1158114/000168316825001580/appliedopto_ex0401.htm).
- [2030 indenture](https://www.sec.gov/Archives/edgar/data/1158114/000110465924131385/tm2431223d10_ex4-1.htm).
- [August share/award prospectus](https://www.sec.gov/Archives/edgar/data/1158114/000110465926099685/tm2623389-1_424b5.htm).

## Reproducible approximation

Let A be EV+cash−bank−vendor; B the discounted straight-note cash flows; E=A−B; N existing common plus assumed restricted shares; C conversion shares; W warrant shares.

Use standard BSM calls with zero dividends and an explicit simple dilution multiplier N/(N+claimShares). Jointly iterate:

Vc = C×N/(N+C)×BS((E−Vw)/N, Kc, Tc)

Vw = W×N/(N+W)×BS((E−Vc)/N, Kw, Tw)

P = (E−Vc−Vw)/N.

The fixed point subtracts the other option claim when valuing each series. This is a transparent cross-dilution approximation, not an exact multi-security lattice across two maturities. It includes positive time value and avoids adding gross exercise shares or exercise proceeds twice. No observed/desired stock price enters the calculation. Iteration damped50%; central convergence44iterations; allocation residual zero within displayed precision.

The Damodaran-consistent principles are separate option valuation, discounted straight debt, existing-share allocation, continued SBC expense and no repeat future-funding dilution. This particular simplified two-series fixed point is an analyst implementation approximation, NOT a formula claimed to appear verbatim in his teaching materials.

## Sensitivities

- Volatility60/80/100%: common40.52/40.15/39.85.
- Credit spread300/500/800bp:40.09/40.15/40.23. Higher spread lowers creditor PV and increases residual under otherwise unchanged enterprise assumptions; it is NOT a claim that deteriorating credit benefits the operating business.
- Initial-minimum warrant count1.324233m instead of full cap:42.51. Neither count is verified current vesting.
- Full-cap scenario materially matters more than the narrow credit stress here.

## Contractual limitations and eligibility

Issuer redemption/early-conversion conditions, make-whole adjustments,40-day averaging, counterparty default/equity dependence, and warrant extension/cancellation/vesting paths are omitted. These features **invalidate a claim that the result is exact note/warrant fair value**. They do not make it unusable as an expressly selected conditional analyst approximation with visible controls. Issuer call rights may reduce option value; holder rights may increase it. No rigorous direction or bound for total error is asserted.

The model should not silently replace the blocked research default. If selected, title it “Conditional option-inclusive estimate” and show the assumptions, full-cap vesting choice and approximation warning next to the price. Keep the stricter contract-complete fair-value status unresolved, and preserve the original dated claim inputs. A future dilution-aware credit/equity lattice can supersede this approximation without rewriting operating forecasts.
