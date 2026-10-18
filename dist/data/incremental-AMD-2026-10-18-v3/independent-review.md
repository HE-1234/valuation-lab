# Independent AMD v3 research review

Review date: October 18, 2026. Scope: source verification, management-guidance arithmetic, event/financing treatment, preservation, and unchanged v2 economic inputs. This is not an audit opinion on financial statements, a new valuation, or approval to publish.

## Conclusion

PASS for qualified, June 27, 2026-origin operating research using information through October 18. No blocker identified for that limited purpose. Headline values remain operating EV: deployment delay $85.529B, base $347.857B, platform scale $790.813B. These are conditional analyst scenarios, not current common equity, share-price targets, probabilities, or a June-information-set backtest. Current common equity and per-share values appropriately remain null.

## Independently verified results

- All ten original guidance midpoints/ranges and actual revenues were checked against newly retrieved AMD releases. Q1 2024 through Q2 2026 contains ten midpoint beats, five above the upper bound and five within range. Recalculated mean 3.709245% and median 3.425676% agree.
- FY2022 actual $23.601B versus first post-Xilinx $26.3B guidance gives -10.262357%. The August release reaffirmed $26.3B ± $0.3B. This is a company-cycle counterexample, not solely the current CFO's tenure.
- Q4 2025: the original release excluded MI308 China sales; the subsequent issuer release identifies approximately $390M China sales and a $360M reserve reversal. $10.270B minus $0.390B = $9.880B, 2.916667% above the $9.6B midpoint and within $9.3B–$9.9B. Issuer margin excluding both effects is approximately 55%, versus 54.5% guidance. This isolates one known scope change; it cannot establish a complete constant-mix execution measure.
- August 17 closing 8-K confirms the four tranches totaling $4.750B. Coupons total $240M annually. Prospectus capitalization cash increases from $5.086B to $9.812B, implying estimated rounded net proceeds of $4.726B. The $24M difference is a principal-basis bridge, not a current market-value loss estimate. The prospectus separately shows $4.7360875B proceeds before expenses; that does not contradict estimated net proceeds.
- March 2025 note terms establish $875M at 4.212%, maturing September 24, 2026. They do not establish actual repayment. Conditional financing-only cash $16.962B and principal $7.125B imply net cash $9.837B and annual coupon increase $203.145M. September retirement must remain unverified.
- World Labs 8-K confirms approximately $8.2B consideration in AMD shares, subject to adjustments, and an unfixed share count based on the ten trading days ending on the second trading day before closing. No cash debit should accompany that share issuance. Target value, liabilities, integration costs, replacement awards and ownership allocation remain unresolved.
- Taalas release body states definitive agreement and customary closing conditions/approvals. Its headline does not prove closing; no size or payment mix was verified.
- Anthropic release confirms up to $5B investment and up to 2 GW deployment, starting 1 GW in H1 2027. June 10-Q says subsequent investment commitments up to $5.0B through fiscal 2028 without naming the counterparty. Matching these is a reasonable expressly labeled assumption, not proved legal identity; adding another $5B would contradict the selected single-exposure treatment. Funding timing and recovery values remain analyst assumptions.
- All 359 original files match their pre-v3 recorded hashes. Operating model, forecast rows, funding stress economics, customer paths, history and cost of capital remain unchanged from v2. Four JSON files differ in bytes only by an added top-level v3_presentation_safeguard; recursive comparison after removing that presentation-only key matches exactly. No source files or Site were edited.

## Nonblocking qualifications and current-equity gates

1. The June-origin model uses later guidance/commitments. Keep the date and information cutoff together on every headline.
2. Missing actual October cash, borrowing uses, September repayment confirmation, target consideration/economics, complete legacy award/ESPP valuation and customer contingent claim values block current equity, but not this dated EV-only research.
3. $87.948B / $354.366B / $800.024B residual pools are after selected ESPP reserves and before remaining legacy employee/customer claims. They are appendix conditional arithmetic, not common equity.
4. Recent guidance success cannot validate terminal returns or capital intensity. Pending Q3, 2027 and long-range targets remain unscored.
5. No second subtraction of borrowing principal without proceeds, no debt coupon deduction from unlevered FCFF, no double cash/share acquisition deduction, and no additional duplicated Anthropic $5B were detected in unchanged model economics.
6. Existing funding overlap, recovery, guarantee, loan-interest classification and future employee-service cost judgments remain qualifications; preservation does not validate those assumptions anew.
7. v3 decision.json correctly describes its own checks as internal when written. This separate source/arithmetic review can be cited with its limited scope; it does not imply every v3 economic claim received a comprehensive independent valuation audit.

## Reproduction and primary sources

Run `python check.py` in this directory. checks.json records recomputation and preservation checks; sources.json maps all 24 fresh primary-source downloads to URLs, local files and SHA-256 hashes. Source snapshots and plain text are in sources/. The script writes only this audit folder.

Principal primary sources:
- August debt closing: https://ir.amd.com/financial-information/sec-filings/content/0001193125-26-354029/d142696d8k.htm
- Prospectus capitalization: https://ir.amd.com/financial-information/sec-filings/content/0001193125-26-352628/d173126d424b5.htm
- Original September note terms: https://ir.amd.com/financial-information/sec-filings/content/0001193125-25-061366/d914634d8k.htm
- World Labs consideration: https://ir.amd.com/financial-information/sec-filings/content/0000002488-26-000182/amd-20260926.htm
- Taalas: https://ir.amd.com/news-events/press-releases/detail/1296/amd-acquires-taalas-to-advance-compute-solutions-for-rapidly-growing-ai-inference-market
- Anthropic: https://ir.amd.com/news-events/press-releases/detail/1292/amd-and-anthropic-announce-strategic-partnership-to-deploy-up-to-2-gigawatts-of-amd-instinct-mi450-series-gpus
- June 10-Q: https://ir.amd.com/financial-information/sec-filings/content/0000002488-26-000123/amd-20260627.htm
- Q4 2025 normalization: https://ir.amd.com/news-events/press-releases/detail/1276/amd-reports-fourth-quarter-and-full-year-2025-financial-results

All quarter guidance and actual source URLs are retained in sources.json and in the reviewed management-guidance-credibility.json. The 2022 initial, reaffirmed, revised and actual releases were independently retrieved as well.
