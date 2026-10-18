# Independent MRVL v3 guidance, claims and covenant audit

Review date and information cutoff: October 18, 2026. Financial origin: August 1, 2026. Capital inventory date: August 18, 2026. USD millions unless stated.

## Verdict

**READY FOR DATED EV-ONLY RESEARCH; CONDITIONAL CLAIM FRAMEWORK ONLY.** No blocking arithmetic or double-counting defect found in v3's reviewed scope. The reproducible audit passes 200 checks. This is a separate independent review, not a rerun of v3's author validation. Prior v2 operating-model review is inherited; this audit independently re-sums forecast FCFF discounting and terminal capitalization rather than underwriting every operating assumption anew.

Dated operating EV: downside **$30.441bn**, base **$100.409bn**, management-delivery **$211.790bn**. These use October information at an August financial origin. They are neither an August information-set backtest nor an October common-equity target. Missing current equity inputs do not block this EV-only presentation.

## Guidance scorecard

The CSV contains 16 contiguous fiscal quarters, Q3 FY2023 through Q2 FY2027. Each original quarter-ahead forecast and result has a primary-source pair; all 32 referenced archive hashes match. CSV and JSON values agree. Direct archived outlook review confirms revenue, EPS and gross-margin guides; results agree with release tables and current-quarter EPS headlines.

Independent recomputation: revenue above original midpoint 15/16; within original stated revenue range 16/16; mean revenue beat 1.0990802339%; median 0.9572463768%; adjusted EPS at/above midpoint 15/16; adjusted gross margin below midpoint 11/16. EPS ties are included in “met/exceeded,” whereas revenue ties would not be counted as beats. Rounded individual beat-percent fields differ only immaterially from exact recomputation.

Comparability is sufficient for a descriptive quarter-ahead scorecard, not a probability estimate. Forecasts precede their respective actuals; original forecasts are scored rather than later reaffirmations or updates. December 2022 guidance is retained despite January 2023 updating; March 2025 guidance is retained despite May reaffirmation. Gross-margin guides mix point estimates and ranges, so midpoint underperformance is not a range-miss statistic. Q3 FY2023 is a documented gross-margin range miss. Mix changes, acquisitions/dispositions, non-GAAP exclusions and FY2027 two-class EPS treatment limit economic comparability across years. The 15/16 result cannot establish probabilities of attaining uncompleted FY2028/FY2031 investor-day targets.

## Warrant and claim allocation

Google's original warrant terms support the 58,970,907 cap, $206.58 strike, and 1,360,867 time/57,610,040 performance split. The August 18 issue date makes the first time tranche November 18: zero time vesting by the October cutoff is correct. Performance vesting realized by cutoff remains unestablished. The exact 240-tranche arithmetic and full hypothetical cash proceeds of $12,182.209968m reconcile. Cashless delivery depends on contractual trailing 30-trading-day VWAP, not simply contemporaneous spot. The zero-floor settlement shorthand is an economic no-exercise convention below strike, not a literal rewriting of the ratio definition. [Primary warrant](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-26-356217/d412696dex41.htm).

Nonblocking presentation refinement: replace “complete conditional settlement function” with “base contractual vesting/exercise arithmetic.” The supplied function is not a complete implementation of exercise conditions, adjustments, fractional-share handling, expiry extensions or fundamental transactions. Time vesting after the first tranche is not executable in that file. None of these limits invalidates the stated cutoff facts or base exercise arithmetic; this is not a long-dated option valuation.

Allocation is correctly mutually exclusive: a joint claim-FV deduction replaces explicit shares/cash for the same claim. Under FV mode, do not add option exercise proceeds, full/net option shares or earnout shares/cash again. Under a settlement mode, do not deduct that same claim's FV. The four missing claim values remain null. The provisional $749.5m earnout illustration is separately labeled, not added to earned shares/cash. NVIDIA proceeds are already in cash and 21.778m participating equivalents in the 898.704613m unit base; no extra preferred debt deduction is made. Recurring future compensation remains an operating economic expense. Legacy-claim valuation must explicitly distinguish already accrued claims from future service costs and remain consistent with the operating forecast.

The bridge of -$2,643.9m reconciles. Capital pools before employee/customer/earnout claims are $27,796.8128m / $97,765.4580m / $209,146.2668m. These are not common-equity values. The forward asset/notional and financing shortfall cautions appropriately prevent obvious duplicate charges or artificial cash funding.

## Debt covenant

The revolver definition is gross contractual indebtedness over four-quarter contractual EBITDA, with a 4.00x limit. EBITDA contains specific nonduplicative adjustments and acquisition/disposition pro formas. It is not economic DCF EBIT, and there is no general cash-netting deduction. Cash restructuring adjustments are capped at 15% of EBITDA before that adjustment. Using only $4,999.9m face debt, the required EBITDA is $1,249.975m at zero draw, $1,546.2m at the illustrative $1,184.9m peak draw, and $1,624.975m at $1,500m draw. Additional counted indebtedness or unmet borrowing conditions can reduce access. [Credit agreement](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-25-152676/d859414dex101.htm).

The Q2 filing explicitly states compliance on August 1. This supports historical compliance only, not actual future headroom or liquidity certification. Current/future headroom correctly remains null. [Q2 filing](https://investor.marvell.com/sec-filings/all-sec-filings/content/0001835632-26-000025/mrvl-20260801.htm).

## Evidence, preservation and outputs

Primary warrant, credit agreement and Q2 filing were freshly reopened in this review. Guidance archive hashes and paired source mappings were independently checked; the full 17-release set was reviewed locally. The supplied v3 sources and prior v2 files were read only. This audit writes only its separate directory and does not edit or deploy any Site.

- `audit.py`: reproducible independent arithmetic/source-integrity checks
- `independent-checks.json`: check results and 32 source references
- `guidance-source-pairs.json` and `guidance-contiguous-16q.csv`: byte-identical reviewed copies
- `readiness.json`: dated EV-only readiness and explicit unresolved gates

The check count describes test coverage, not certainty of future economic outcomes. No current market-price target, new scenario probability or actual-liquidity guarantee is produced.
