# Bloom Energy source and claims review — 2026-10-23

The latest filed periodic report is the September 30, 2026 Form 10-Q, filed October 22 (0001628280-26-066931). Annual is FY2025 Form10-K, filed February9 (0001628280-26-006516). SEC submissions and original HTML were downloaded into `/tmp/be-addition-20261023/`; financial statements, debt/lease/award notes were read directly and core figures cross-checked to companyfacts. This is a filed Q3 base, not a provisional release.

## Core data (USD millions except shares)

| Item | FY2025 | TTM September2026 |
|---|---:|---:|
| Revenue, including electricity leases |2023.994|3829.939|
| GAAP operating income |72.802|567.405|
| Unrestricted cash |2454.108|2486.702|
| Affiliate investments |10.037|28.236|
| Reported debt plus finance leases and all book financing obligations |2866.865|2666.063|
| Modeled economic debt before note allocation |2666.354|2516.762|
| NCI book proxy |24.322|30.233|
| Actual common shares (millions) |280.045459|295.537217|
| Unvested RSUs/PSUs (millions) |12.292948|9.319315|
| Employee options (millions) |5.741283|4.979585|

TTM revenue =2023.994+3052.256−1246.311. TTM EBIT=72.802+479.876−(−14.727). Weighted-average EPS denominators are not used.

## Consequential claims

- Convertible series have different conversion prices and require independent decisions. Annual:2030principal2500/carrying2442.091/rate5.1290;2029principal75.125/carrying73.473/rate47.9795;2028principal99.655/carrying98.162/rate53.0427. September only2030principal2500/carrying2450.891 and2029principal22.771/carrying22.608 remain. Conversion rates are shares per$1000, multiplied by principal millions/1000 for shares millions. Do not use make-whole maximum shares for ordinary continuation. Do not deduct reported market fair values on top of debt and dilution. Parent implements mixed per-series allocation.
- Capped call:33.549508m shares,18.85strike,26.46cap,June1,2028expiry,maximum payoff255.31175588m. Annual expressly says calls survive2025 induced note conversions. September refers to the same contract, with no disclosed termination; carry-forward continuation assumption remains explicit with zero-hedge stress. Note redemption does not automatically extinguish the freestanding hedge.
- Annual Oracle warrant promise:3.531073m underlying shares,113.28strike,.5year life,.962volatility,.036riskfree reported assumptions. Modeled as option at DCF share price, not fixed55.9m reported mark. Fully exercised May1,2026 cashlessly:1.905433m ordinary+0.248798m incentive=2.154231m shares already in September actual common. No second warrant deduction/dilution. September306.5m customer consideration asset is operating prepaid selling consideration, not surplus.
- Financing obligations: annual book243.768m versus contractual-principal PV43.257m (current10.196/noncurrent33.061); September book184.995m versus principalPV35.694m (current8.539/noncurrent27.155). Note9 expects the differences200.511m/149.301m to offset related EnergyServer carrying assets at lease expiry. Model excludes these noncash residuals; raw source facts retain them. Parent should expose reported-book sensitivity. Finance leases5.218/4.619 remain fully counted, separate from these obligations and operating leases.
- EPP derivative liabilities5.607/4.889 and remaining unfunded FundJV commitments21.7/14.5 are fixed claims once. No future investment value is credited to committed capital, a conservative proxy. Total multi-year supplier orders5.8bn are future operating/reinvestment needs, not all additional debt. JV project debt is not consolidated and is nonrecourse; do not add it. KoreanJV borrowing and NCI remain counted.
- Customer deposits78.207/661.354 fund future delivery and should not be treated as unconditionally spare cash; parent to add cash reserve alternative/default if needed. Future capital intensity1.5x sales/capital is deliberately substantial.
- Reported GAAP EBIT includes own-share product profit on sales to FundJVs eliminated below EBIT. Annual40.421m elimination, currentYTD approximately16.9m. Raw EBIT preserved; disclosure cautions against extrapolating this timing gain. Parent may expose normalization sensitivity rather than silently changing reported earnings.

## Less consequential simplifications

Employee options use dedicated option activity table count/strike/life, not inconsistent per-plan narrative totals;95% volatility and4%rate are labelled analyst proxies (reported grant vol around94%). RSU/PSUs assumed fully vest at reported outstanding unit counts; ungranted pool not added. NCI and affiliate assets use book-value proxies. Restricted cash27.472/21.444 excluded. No preferred outstanding, no ClassB outstanding; ClassB eliminated2026.

Defaults30%initialgrowth/18%matureGAAPmargin/23%tax/1.5salescapital/11.5%WACC/3%terminalgrowth/15%marginalterminalROIC/10years are editable analyst scenarios, not tuned to market price. All explanations have Simplified Chinese pairs. History agent supplies ten real annual rows2016–2025.

Schema validation: `GUIDED_CUTOFF=2026-10-23 python3 scripts/guided-filing-data/validate.py BE` -> OK. Only undisclosed fair value of capped-call asset remains null; model-price payoff supplies the allocation separately. Generated files and tests are owned by parent.

## Final modeling decisions

Parent-directed final metadata reserves full customer deposits78.207m annual/661.354m September as operating funding with half/no-reserve sensitivities. It separately normalizes own-share affiliate-sale profit: −40.421m annual and approximately−37.722m TTM (=−40.421−16.9+19.599); current16.9m is rounded disclosure. Prior2025quarter Note7/MD&A verified19.599m solelyaffiliateproductprofit, cachedprior-ttm.html. RawGAAPfigures are unchanged. Mature18%margin is after these effects, and1.5xcapitalturnover assumes grossinvestmentwithoutrepeatadvancefunding. Cashreserve is not added to fixedclaims. Carrying-debt stress: add200.511m/149.301m to otherclaims.
