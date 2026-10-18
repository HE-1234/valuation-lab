# NVMI v2 independent audit and integration addendum
Audit date and information cutoff: 18 October 2026. Original v1 and v2 research preserved.

## Verdict
**Ready for dated operating-EV integration, with explicitly conditional/editable common-equity allocation.** No computational correction to v2 is needed. The independent reconstruction passes 337 checks. This is a scoped research/model audit, not external assurance on every historical field, forecast probabilities, or an investment recommendation.

Use the literal label: **“31 December 2025 discount/capital origin; information through 18 October 2026.”** The model uses later operating evidence and October discount inputs. It is neither an October current valuation nor a contemporaneous December backtest. Missing current claims do not prevent integration of this clearly dated EV model.

## Independently reproduced results
USD millions, except share units and percentages.

| Case | Operating EV | Explicit cash-flow PV | Terminal PV | Terminal share |
|---|---:|---:|---:|---:|
| Downcycle | 2,019.565 | 1,090.209 | 929.356 | 46.02% |
| Base | 4,071.163 | 1,762.418 | 2,308.745 | 56.71% |
| Upside | 6,316.266 | 2,296.423 | 4,019.844 | 63.64% |

The independent script rebuilds annual revenue fades, economic margins, taxes, physical and working-capital funding, annual discount factors, continuing values and conditional allocation arithmetic from assumptions. It does not invoke the original builder. Ten explicit calendar years run 2026–2035, with 2036 continuing cash flow. End-year discounting consistently starts at December 2025. H1 2026 cash is not separately added to the opening bridge.

Fresh equity compensation remains inside economic margins. Legacy expense display reverses once; existing awards are separately allocated. Every year's reinvestment meets its cash-funding floor. Final-year and continuing reinvestment use g/ROIC: 19.23%, 16.67%, and 15.91% of NOPAT. No free terminal growth or terminal timing discontinuity was found. These checks validate implementation, not the eventual accuracy of assumed demand or margins.

## Primary evidence and units
The [annual filing](https://www.sec.gov/Archives/edgar/data/1109345/000117891326000504/zk2634307.htm) confirms FY2025 diluted weighted shares of 32.800m, distinct from 31.780111m year-end common shares. The prior 1,000× scale error is corrected. December eligible liquid assets sum to $1,633.241m; $26.41731m is reserved as operating cash. The $936.270m quoted convertible fair value includes its conversion feature, versus $750m face. It is deducted once, with no extra underlying-share charge. Settlement can be cash, shares, or a combination at issuer election. The 0.396262m RSU balance and $51.826m capped-call premium also match the filing. Premium is not fair value. Governmental/tax liability mapping still needs reconciliation before an exact common-equity claim can be accepted.

The [August interim release](https://www.sec.gov/Archives/edgar/data/1109345/000117891326003892/zk2635873.htm) confirms H1 revenue $490.266m and Q3 revenue guidance $277–287m. The base FY2026 build uses actual H1, guide midpoint, and an explicitly analyst-assumed $300m Q4. No FY2027 scenario is represented as issuer guidance. The [October 15 filing](https://www.sec.gov/Archives/edgar/data/1109345/000117891326004775/zk2636227.htm) schedules November 5 results; its saved primary capture was checked, but a fresh web opening returned an internal error. Do not represent that failed recheck as success.

The live [Treasury table](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=2026&field_tdr_date_value_month=202610) verifies October 16 ten-year yield 5.09%. [Damodaran's current page](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/home.htm) verifies October 1 ERP 4.20% and US spread 0.22%; the [January beta table](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/Betas.html) verifies cash-corrected unlevered equipment beta 1.39. Independent WACC reconstruction gives 10.97753678% initially and 9.592269% terminally. The mixed observation dates are explicit model choices. Target debt weight, spread, terminal beta and operating risks remain analyst judgments.

## Safe integration contract
1. Show the dated EV cases as the primary valuation results. Carry the date label alongside all values, not only in a footnote.
2. Common-equity allocation may be exposed as a scenario/sensitivity tool. Keep capped-call fair value, option value, residual claims and performance-award completeness unmeasured unless supplied as clearly labeled assumptions.
3. Do not prefill the illustrative $51.826m premium, $5m option claim or $5m residual claim as verified fair values. The existing $83.31/$147.07/$216.85 conditional calculations are algebraic examples only and should not be the headline fair-value range.
4. A fixed $936.270m December convert claim is observed at that date, but is not consistently repriced across intrinsic scenarios. Label this fixed-claim sensitivity; joint convert/hedge revaluation is needed for a fully endogenous allocation.
5. Keep exact/current per-share value and market quote null; show no upside/downside percentage or price target. Exclude future buyback execution unless documented.
6. Before replacing this dated basis with October, reconcile shares, realized buybacks, convertible and hedge values, awards, tax/government overlap, restricted assets and residual claims on one common date.

No canonical application or published Site was changed. Independent files: independent-audit-v2.py (reproducible checks), independent-audit-v2.json (machine-readable results and input hashes), and this addendum.
