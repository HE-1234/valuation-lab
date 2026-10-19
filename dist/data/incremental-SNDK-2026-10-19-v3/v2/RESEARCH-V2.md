# SNDK v2: response to independent audit

Status: revised conditional research exhibit, pending independent recheck. Version1 files and independent-audit-v1 remain unchanged. This document supersedes version1 model/bridge conclusions; version1 history, source packet and guidance evidence remain applicable, subject to the audit's source-text caveat.

## Scope and date gate

Every v2 output is labelled: **July 3 financial anchor; information through October 18 PDT / October 19 UTC. Not contemporaneous July 3 or current value.** It includes later management guidance and uses a155M weighted-average/forecast diluted-share proxy, with158M sensitivity. Neither is a verified point-in-time diluted share ledger. The August7 actual common count is a different metric. Historical-backtest eligibility and current-valuation eligibility are false. Upside and ranking outputs are always null, including when a valid quote is supplied. This deliberately prevents date-mixing from becoming a historical prediction or a present fair-value claim. Reconstructing post-July cash, securities, tax, repurchases, grants, vested awards, maximum PSUs and ESPP remains necessary for current admission. No current source-backed bridge has been invented.

## 1. Opening tax and claims, now reserved explicitly

Primary reference: FY2026 10-K accession0001628280-26-057406, https://www.sec.gov/Archives/edgar/data/2023554/000162828026057406/sndk-20260703.htm . Original bytes and hash remain in parent source-manifest.json; annual-2026.pdf/text contains visible printed pages58,62,79,100–101.

Opening balances and v2 treatment (USD M):
- Cash4,762.
- Refundable customer deposits1,500: fully reserved immediately. They are company-held cash offset by a repayment obligation, not excess cash. Third-party collateral5,000 is excluded entirely.
- Assumed minimum operating cash1,000: unavailable for equity distribution.
- Current income tax payable1,286 and noncurrent income tax payable258: both reserved at face value immediately, total1,544. Future forecast tax on future EBIT is separate and does not pay these opening balances. No future operating-WC formula includes taxes payable. Thus no duplicate subtraction occurs. Immediate face-value reserve is a deliberately conservative timing assumption, not an assertion of immediate legal payment dates.
- WDC tax indemnification128: separate reserve. Note5 explicitly places it in Other liabilities, separate from current/noncurrent tax-payable lines. It covers pre-spin tax positions under the Tax Matters Agreement and is reassessed with WDC assessments/settlement/statute lapse.
- Total reserved4,172 leaves590 usable opening surplus, down from2,262 in v1.

The cash-flow1,370 figure is the annual CHANGE in tax payable, not the ending balance. Cash income taxes paid146 versus expense1,584 explains why cash conversion needs normalization, but does not reconcile every tax account automatically. V2 does not use1,370 as a balance or add it to liabilities.

Unrecognized tax benefits323 plus16 accrued interest/penalties are disclosures of uncertain positions, not automatically incremental to the1,544 reserved tax-payable balances. MD&A says259 could result in cash payments. The retrieved disclosure does not provide a complete balance-sheet-line overlap map, so v2 does NOT subtract another323. claim-sensitivities.json tests0 versus259 incremental cash exposure beyond the already reserved balances. The259 case is a conservative non-overlap assumption and may double count; it is not called the corrected liability. This unresolved mapping remains a current-valuation gate.

Note15 reports93 legal-settlement expense in nonoperating income/expense. The note does not establish whether all93 remained unpaid at July3, and no exact payment status was verified. Base incremental unpaid liability is0, NOT a claim that payment occurred. claim-sensitivities.json tests an additional93 unpaid, strictly as a contingency. Existing operating accruals remain in working capital. No93 expense is reintroduced into projected recurring EBIT.

Nanya securities remain1,777 before25% haircut; after-haircut1,332.75. This is a disclosed analyst buffer, not current realizable value. Financial debt0. No double subtraction of operating leases already expensed. JV guarantee calls0/923 are optional incremental stress cases, not automatic obligations; source exposure components cannot all be added as new debt.

## 2. Terminal physical/JV funding floor

V1 used only NOPAT×g/ROIC and thereby assumed a sudden investment efficiency improvement at the terminal boundary. V2 uses:

Terminal reinvestment = maximum of (terminal NOPAT×g/assumed ROIC) and (terminal revenue×net physical/JV funding floor + terminal incremental operating WC).

The base physical/JV floor equals final explicit own capex plus net JV funding less own D&A:7% structural,8% partial,11% stress. This retains annual node-migration/maintenance/funding burden indefinitely; incremental WC continues separately. No JV depreciation is added back. Therefore terminal reinvestment/sales becomes7.4369%,8.5243%,11.4878%, close to final explicit7.431%,8.517%,11.575%. The stress case no longer jumps to11.25% FCFF margin: its terminal FCFF margin is approximately2.01%.

These are analyst economic funding floors, not verified physical wafer/node budgets. Holding revenue-linked investment ratios is a conservative continuity test, but price/bit cycles make them an imperfect physical model. A capacity-based forecast still requires equipment, process conversion, lease and utilization detail. The max-rule shows when the ROIC assumption is inconsistent with the physical floor: implied marginal reinvestment ROIC is11.30%/5.49%/2.94%, rather than silently asserting25%/18%/15%. Low implied returns are permitted as stress economics, not competitive advantages. When funding consumes all terminal NOPAT, the model returns invalid/null instead of extrapolating positive value.

terminal-funding-sensitivity.json varies the floor3–14% for each scenario. Below-base floors are explicitly labelled efficiency-transition assumptions requiring separate justification; they are not the main forecast. WACC/g grid now includes all9/11/12/13/14% and2/2.5/3/4%, so the14% stress base is present.

The FY2027 structural74% after-SBC EBIT assumption remains an optimistic scenario choice before the FY2028–30 investor-day target window. Its basis is the high FY2026Q4 GAAP operating margin and Q1FY2027 guidance, not a full-year management commitment. No probability is assigned. All prior growth/margin paths remain fully explicit.

## 3. Funding/null outputs

Opening tax/legacy/deposit reserves reduce spendable starting cash to590. The model reports an economic funding-pool path, not a detailed cash treasury forecast: FCFF includes SBC expense; financing costs, covenant capacity, exact tax timing and payout execution are not established.

With retained FCFF, all three base paths have zero simplified funding gap. With every positive FCFF distributed, the contract/cycle stress has5,118.215M unfunded needs after opening surplus. V2 returns null common-equity and per-share valuation for that policy pending a financing solution. It does not call the residual an equity raise or assume a stock issuance price. The1,500M revolver is not deducted from the gap: it is covenant-conditioned, expires February21 2030 and is not verified available throughFY2029–32 losses. Borrowing/refinancing, cuts or payouts suspension would need a separately modeled solution, financing costs and claims.

If reserves exceed opening cash, the deficit is preserved rather than clamped to zero and hidden. Modelled guarantee calls can therefore trigger a funding flag. Negative economic equity is retained as a diagnostic; funded limited-liability common equity floors at zero, never a negative stock value. Funding-gap common values remain null even if diagnostic EV/equity is positive.

## 4. Source and accounting corrections

Keep these distinct schema fields: July3 RPO59,800; subsequent agreements' aggregate transaction price31,300; verified later RPO=null. The arithmetic sum91,100 is not a reconciled later RPO balance because interim deliveries, price allocations and recognition are not rolled forward. No combinedRPO field is emitted.

Note10's107M FY2026 JV distributions are classified in CFO, whereas176M FY2025 distributions are investing. CFO less own PPE capex less net JV note advances remains11,219 inFY2026, but it contains the107 distribution. Removing that distribution for a conservative alternate operating-cash presentation gives11,112; this is a classification/normalization sensitivity, not an assertion that JV distributions have no economic value. ForFY2025 the corresponding CFO84−capex204−net advances(333−515)=62 before176 investing distributions,238 including them. Therefore classifications differ across years and must be standardized before cash-conversion comparisons. V2 forecasts FCFF from EBIT and explicit net JV funding, without extrapolating either CFO distribution or addingJV equity value. Future JV distributions/repayments are represented only within net funding assumptions; no separate duplicate distribution credit.

WDC2023 PDF's original text extraction is corrupted. Numeric history values are supported by the independent audit's rendered/OCR Note3 printedp67 evidence; the bad extraction is not described as readable independent evidence. The16 retained originals remain unchanged and hashed.

## 5. Runtime tests and new outputs

Run python replay_dcf.py, python build_extra_sensitivities.py and python test_model.py from v2 or by absolute path. Model inputs and results are separate from v1.84 tests pass: annual arithmetic, terminal continuity/floor, cash reserve, dates, WACC direction, finite inputs, invalidWACC/g, zero/negativeROIC/shares, taxes/margins/haircuts outside bounds, negative capex, invalid growth factors, misaligned paths, NaN/Infinity, quote/null gates, funding null and limited-liability treatment. Every numeric model input used in valuation is guarded; output recursion rejects nonfinite results. Invalid cases return descriptive INVALID_MODEL with null values instead of exceptions orNaN JSON. The current-quote gate is intentionally stricter than stale-quote checks: ALL comparisons are prohibited for this mixed-date exhibit.

Author tests are not independent audit. Recheck requested before any conditional research admission. Current-price/ranking admission remains blocked regardless of recheck.

Revised base results under retained cash, USD M:
- Structural EV250,843.896; diagnostic/common equity252,766.646; proxy per-share1,630.753; terminal35.83% ofEV.
- Partial EV53,636.143; equity55,558.893; proxy358.444; terminal22.03%.
- Contract/cycle stress EV4,350.440; equity6,273.190; proxy40.472; terminal23.14%.

These are illustrative conditional outputs with later-information/earlier-financial-anchor labels, not current fair values, historical backtests, recommendations or probability-weighted forecasts. The range still measures the unresolved structural-reset question.
