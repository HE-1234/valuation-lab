# Independent CEVA review, v1

Reviewed 2026-10-19. Scope: frozen original study and v2 corrections. Independent reviewer-authored calculations; no original model or verification implementation imported/executed. Originals unchanged. This is research-model assurance, not an audit opinion on issuer financial statements.

## Decision
A clearly dated conditional research entry is supportable after repairing the terminal tax inconsistency and carrying the qualifications below into the entry. Missing October capital data is **not** an absolute admission blocker. No current price target, current upside, or ex-ante June forecasting claim is supported. Parent approval and integration review remain necessary. V3 repair is in progress separately; this document does not approve an unseen revision.

## Material finding
The explicit forecast applies cash tax = max(20% positive economic EBIT, 3% revenue), but terminal NOPAT applies only the 20% EBIT tax. At the bear terminal margin of 6%, that silently reduces tax from 3% to 1.2% revenue. Maintaining the stated floor reduces bear terminal PV and EV by $7.335341956m. Bear EV changes from −$9.902903770m to −$17.238245726m, and conditional equity/share from $5.987534078 to $5.742889308. Base $12.981785156 and bull $27.590497542 are unaffected. Fix the formula, or explicitly justify a different terminal regime; the existing unchanged-values conclusion is insufficient.

## Independent replay
364 arithmetic/provenance/preservation checks in replay-results.json passed. A further94 source-hash/history/bridge checks passed in source-check-results.json. Counts represent assertions, not independent observations or probability of accuracy.

The replay starts with scenario assumptions, not exported forecast cash flows, independently builds all30 forecast periods and compares revenue, GAAP/economic EBIT, award addback, taxes, working capital, FCFF and liquidity. It then independently discounts explicit and terminal flows, bridges EV, and applies the endogenous option-exercise branch. All authored outputs reproduce before the policy correction. Base terminal PV is79.38% of EV; bull76.39%. Bear EV is negative, so terminal/EV percentage is not a meaningful valuation concentration measure.

Annual licensing/royalty ramps, linear margins, 25% terminal incremental ROIC, reserve, cash-tax floor, WACC and growth are analyst assumptions, not filed forecasts or calibrated probabilities. H2 is FY minus actual H1; year-end discount periods0.5 through9.5 are consistent. Terminal reinvestment replaces the explicit net-capex/working-capital method and should remain visibly disclosed.

## Capital and claims
Primary source: [June30 2026 Form10-Q](https://www.sec.gov/Archives/edgar/data/1173489/000143774926026774/ceva20260630_10q.htm), balance sheet, EPS and equity-award notes.

- $44.301m cash + $5.148m deposits + $171.271m marketable debt securities = $220.720m. No interest-bearing borrowing is listed in the balance-sheet bridge. These assets are not all bank cash or guaranteed immediately tax-free domestic proceeds.
- Severance liability $7.832m less dedicated fund $7.615m = $0.217m. Deducting the net amount avoids treating the dedicated fund as free surplus. Other noncurrent accrual $1.072m is separately deducted; current operating liabilities belong in operating working capital.
- Operating leases $2.662m current + $14.762m noncurrent = $17.424m. Lease expense remains in EBIT; do not additionally deduct lease debt without consistently restating operating earnings/cash flows.
- June legal common shares28.137917m differ from H1 GAAP weighted shares27.838m and Q2 weighted shares27.996m. Loss-period basic/diluted EPS denominators do not capture the full economic award claim. August4 common28.154072m is a later observation and is correctly excluded from the June bridge.
- Unvested RSU/PSU rollforward1,826,127 +779,202 −528,770 −230,831 =1,845,728. Their full reported reserve is included without forfeiture credit. This does not prove the maximum payout of every performance grant:2026 grants disclose maximum234,617 PSUs and conditional service/performance/TSR vesting. Do not describe the aggregate as a verified maximum dilution cap without grant-level reconciliation.
- Outstanding options30,025 at weighted strike$20.91 have4.4 years remaining; only19,279 currently exercisable. The calculation is an intrinsic/endogenous-exercise approximation, not option fair value. An out-of-money long-lived option is not necessarily worthless. This small residual approximation must remain explicit.
- $28.506m unrecognized expense over weighted-average1.5 years is a source fact; assigning9.502m H2 and19.004m2027 is an analyst timing approximation. It is coherent to add back expense for awards already included in the denominator while charging future grants as cash replacement, but not a grant-level vesting schedule or tax-deduction model.
- $122.7m liquidity is held abroad. The issuer states repatriation taxes cannot practicably be quantified and may use alternative funding. Zero tax is conditional access, not a verified exemption. Preserve offshore-tax sensitivity.

## Financial capacity and dates
Starting from $220.720m and using modeled FCFF, minimum balances reproduce at $169.060743m bear, $215.343842m base and $220.720m bull, all above the chosen$30m reserve. Thus these scenarios do not imply an external funding gap under their assumptions. This is modeled liquidity capacity using cash-replacement SBC, not a forecast of GAAP cash balances, domestic accessibility, future acquisitions, distributions or financing. Historical H1 CFO$0.940m minus property capex$2.949m = −$2.009m; CFO is not FCFF and does not validate a straight-line runway.

Use two dates: capital/discount anchorJune30,2026; information cutoffOctober19,2026. The June10-Q and later management guidance were released afterJune30. These are retrospective June-anchored scenarios using later-known information, not investable forecasts available onJune30.

## Historical source corrections
Independently re-extracted all four cited raw HTML tables, matching the v2 evidence exactly. Source-ledger hashes were checked. The2018 equity rollforward verifies2016/17/18 shares21.273500/22.064007/21.787860m; the v1 FY2017 share error is real and v2 fixes it. The2018 cash-flow table verifies D&A2.635/3.250/4.157m.

Original2023 consolidated and discontinued-operation tables support2021–23 total CFO25.804/6.924/−6.331m and discontinued CFO−3.092/−3.116/−2.235m, yielding continuing28.896/10.040/−4.096m. D&A totals6.985/7.561/4.883m less discontinued1.257/2.205/1.081m give5.728/5.356/3.802m. Property capex totals2.193/3.499/2.884m do not disclose the continuing split. Continuing CFO-minus-property-capex bounds26.703–28.896,6.541–10.040,−6.980 to−4.096m are valid under nonnegative component purchases; no exact split is inferred from acquisition/divestiture investing cash flows.

Additional labeling repair: these are **property-and-equipment purchases**, not all investment. The2018 table separately contains$1.960m purchased intangibles. Label historical cash flow as CFO less property capex, not comprehensive free cash flow or unlevered FCFF. Every annual mix/balance/FCF identity was checked, but that does not imply every historical line received a separate manual audit. Retain ASC606 and discontinued-business comparability breaks; net income and CFO scopes must not be silently equated with restated continuing EBIT.

## Nine-quarter management comparison
Read the original issuer prepared-remarks guidance paragraphs for all nine quarters. All27 guidance points match the scorecard: revenue, GAAP OPEX and approximate GAAP gross margin. Recomputed every actual from its SEC fact tuples and checked tuple membership in retained companyfacts. Q4 annual-minus-nine-month arithmetic is correct. Revenue outcomes are2 above,6 within,1 below; Q1'25 missed$25.5–27.5m at$24.245m. Q2'24 sequential6–16% conversion on exactQ1$22.072m is correct. Approximate gross margin is not a precise beat/miss range, and higher OPEX is not inherently a favorable outcome.

The nine original guidance documents span May9,2024 through May11,2026. Links and exact comparison values are retained in replay-results.json. Source text contains copied quarter labels in some components; the section heading determines the forecast quarter. No EPS scorecard is established by these27 observations. Do not substitute non-GAAP EPS shares or annual non-GAAP growth commentary for legal common shares or GAAP earnings.

FY2025 revenue$109.598m versus2024$106.939m is2.486% growth: below original7–11% and consistent with revised qualitative low-single-digit growth. FY2024 growth versus2023$97.419m is9.772%, above later7–9%. FY2026 remains unfinished, so revisions8–12%→12%→13–15% are not scored outcomes. Prepared remarks do not establish full Q&A/interview coverage. Management AI-licensing estimates and design wins are not audited segments or guaranteed royalties.

## Files and preservation
replay.py and source_checks.py are reviewer-authored and write only here. replay-results.json contains numerical replay and guidance comparisons; source-check-results.json contains source/history assertions; original-hashes.json records the source tree at review. The scripts do not import or execute author scripts. No canonical changes or publication were performed.

## V3 independent re-review, 06:44 UTC
V3 received after the initial review. Independent review_v3.py passes437 additional assertions: all three corrected outputs, all80 sensitivity rows' EV/tax/terminal-FCF/per-share values, original source-tree hashes, and all10 frozen v3 manifest files. No author code was imported or executed. The sensitivity recomputation uses the already-independently-validated explicit cash-flow rows, then independently changes WACC, growth, offshore haircuts and aggregate award assumptions.

**Disposition: pass for bounded retrospective June-anchored conditional research admission, subject to parent integration approval and preserving all disclosures.** V3 fixes the terminal tax floor and carries the requested date, PPE-only FCF, funding-proxy, option and PSU qualifications. Revised conditional cases are$5.742889/$12.981785/$27.590498. None is a current target or exact option/maximum-PSU-adjusted fair value. Additional1.25x/1.5x aggregate award stresses are sensitivities, not proven legal maxima. No remaining issue requires absolute company exclusion; these unresolved claims limitations require visible conditional labeling. Keep current-price/upside eligibility false. A later grant-level audit can tighten claims precision.
