# ARM independent admission audit

Audit date: 2026-10-19 UTC. Scope: immutable onboarding package, before Site integration. Originals preserved; no canonical or Site edits. This audit is separate from the already-present independent-review-v1.md and does not rely on its pass label.

## Disposition

PASS for a frozen, explicitly conditional dated-anchor research exhibit, subject to history/provenance findings below. HOLD for admission as a freely editable/current-valued Site model until the terminal investment/convergence safeguards are addressed. No current-price comparison is admitted.

## Reproduction evidence

`audit_model.py` is a new independent implementation, not a wrapper around the package calculator. It reconstructs every annual line, treasury/funding flow, discounted fee, terminal cash flow, bridge and denominator. It compares 1,030 numeric fields/results: three full ten-year baselines; all 15 WACC/g cells; all three economic SBC-margin shocks; all ten funding-stress rows and totals; award denominator. All match to specified floating tolerance. Values are bear $8.4751190542, base $25.4633018266, bull $62.4226973025 per ADS. All 70 manifest-covered files match bytes and SHA256. Shipped test suite was copied into an isolated subdirectory and actually rerun: 103 checks pass. Neither those tests nor original model outputs were overwritten.

Finite/domain checks reject null/string/nonfinite WACC, Boolean tax, ROIC or WACC equal to g, short arrays, fee=1 and negative cash-floor ratio. Funding stress independently reproduces cash floors, equity issuance, fees and null headline value. Its denominator diagnostic remains explicitly non-fair-value. An all-zero silicon path is valid and accepted.

## Findings requiring explicit treatment

1. **Physical terminal reinvestment floor is absent.** The final-three-year blend replaces the net-capex-ratio input with residual NOPAT×g/ROIC less NWC. Negative residual is rejected, but a positive residual may fall below the input ratio and no segment-level minimum capital requirement exists. Baseline year-10 net capex/sales = 2.7984%/3.2341%/3.2307%, above nominal 2.5%. However the published 2% terminal-growth sensitivity gives 2.15097%; base with ROIC=24% gives 2.22958%, and ROIC=30% gives 1.62684%. This is not a baseline arithmetic error and 2.5% is not empirically established as the required physical floor. It is a real admission gap if the Site implies feasible production economics or allows editing. Add explicitly justified floors and reject/invalidate inconsistent g/ROIC combinations, or label all such outputs as unconstrained capital assumptions. Do not simply add capital without reconciling implied terminal ROIC.
2. **Terminal silicon convergence has a zero-base hole.** It only checks the final growth ratio if penultimate silicon revenue >0. Reproducer: base silicon_revenue[-2]=0 and silicon_marginal_nwc=0 returns $25.9119743733 despite final silicon=3,193 and a discontinuous terminal ramp. Default NWC rejects this particular jump incidentally, not via a correct convergence guard. Require final silicon = penultimate silicon×(1+g) even when the prior value is zero. Test both-zero as permitted and zero-to-positive as rejected.
3. **DreamBig timing is a conservative reserve convention, not exact transaction PV.** Primary June 6-K confirms July1 completed ~$265m cash acquisition, subject to adjustment. Model deducts nominal $265m at March31 rather than discounting the later cash outflow. It does not deduct it again in forecast investment; initial treasury likewise reserves it at time zero. Explicit reserve language makes frozen appraisal acceptable, but exact dated-value integration should schedule July1 cash, include acquired cash/liabilities once known and avoid treating the output as a precise March31 fair value. No unsupported standalone synergy value is added.
4. **Award claims remain convention-dependent.** Economic replacement compensation stays in EBIT while baseline shares stay fixed. This is a disclosed convention, not a legal grant-by-grant allocation. Nineteen million extra shares is diagnostic only, not a maximum or an additional mandatory charge. June award expansion is appropriately disclosed. Retain warnings and null current-market gates.
5. **Bridge excludes more than unquoted assets.** Input adds zero equity investment value at all. Annual/Q1 equity investment note contains quoted investments as well as unquoted holdings. Study explains unquoted exclusion but should clarify that the March31 $96m publicly listed equity holdings are also excluded rather than silently omitted, or value them consistently with tax/control/claim adjustments. This is conservative (~$0.09/ADS before adjustments), not hidden leverage. Cash/short-term investments do not include that separate equity-investment category.
6. **Litigation wording could be clearer.** October13 issuer statement concerns six Qualcomm claims: Arm says it prevailed on four, with nominal damages on Qualcomm's other two. Say explicitly that Qualcomm received $1 on each of those two; retain attribution and do not describe all litigation as resolved. Current wording is broadly source-consistent but can be misread as damages awarded to Arm.

## Primary-source and conceptual checks

Opened the official annual filing (https://investors.arm.com/node/8281/html), full June-quarter 6-K (https://investors.arm.com/node/8361/html), July results (https://investors.arm.com/node/8356/html) and October litigation statement (https://newsroom.arm.com/news/arm-qualcomm-legal-dispute) anew. Annual cover confirms March31 1,064,055,252 ordinary shares and one ordinary share per ADS. The March31 origin/October19 information distinction is prominently stated; this is neither historical backtest nor current October appraisal. Current shares/cash/stub refresh gate is appropriate.

Local original filings also support the report's China ownership/revenue and related-party contract-asset distinctions, cash-flow-versus-reported-FCF reconciliation, expensed economic SBC, debt/operating lease distinction, and non-guaranteed purchase commitments. Related-party exposure is not added twice. China is not consolidated and geographic revenue is not identical to Arm China. SoftBank's pledged-share borrowing is not Arm debt.

AGI is production silicon, with separate margins and working capital; own-chip royalty is not double counted. July management report separates secured capacity for the $1bn FY27–28 opportunity from demand over $2bn and efforts to expand capacity. Scenarios remain assumptions, not audited orders or revenue guidance. September product announcement is qualitative evidence, not quantified incremental sales. Unit economics and capacity feasibility are still unproven; the generic net capital proxy cannot establish them.

## History and guidance

See separate `history-guidance-review.md` for direct-source audit. All nine guidance pairs have been source matched including the Q4 FY2025 original PDF; four separate legacy breakdowns match SoftBank originals. Six recent annual periods remain distinct from four noncomparable legacy years. Guidance metrics are non-GAAP where labeled and approximate opex is not treated as a hard band. The source-freeze limitations and missing known historical cells require correction or explicit coverage qualification before a fully reproducible history claim.

## Artifacts

- `audit_model.py`: fresh independent replay plus integrity and mutation tests.
- `model-results.json`: machine-readable outcomes.
- `selfcheck-copy/`: isolated shipped-test replay; not a proposed model replacement.
- `history-guidance-review.md`: independent source/history follow-through.

No permission beyond read-only research and isolated audit-file creation was needed. No external assurance is implied.

## V2 model hardening recheck (01:14 UTC)

The research worker created separate `v2/` model files. Independently rechecked with `audit_v2.py`: baseline and funded annual/terminal arithmetic remains correct; the new zero-base convergence guard rejects zero-to-positive and accepts all-zero silicon. Explicit positive 2.5% analyst net-investment floors are evaluated through the transition and in terminal cash flow; no clipping alters g/ROIC arithmetic. Independently derived invalid/valid classifications match all grid and SBC sensitivity outputs. Five 2% growth cells and both negative SBC-margin shock cells are invalid/null. All three headline baselines remain unchanged. The shipped v2 suite was copied and rerun in an isolated directory: 119 checks passed. This resolves findings 1–2 for an analyst-constrained scenario model, with the important caveat that 2.5% is not empirically proven production capital intensity or a replacement-capex estimate.

The independent history audit is now complete: no incorrect populated numbers among 152 annual observations, all nine guidance pairs, and four legacy breakdowns. FY2022 receivables $1,124m/PPE $188m are known but null. Q4FY25 `letter-06.pdf` is frozen and manifest-covered but omitted from the source ledger; the ledger's limitation prose is stale. Two SoftBank legacy PDFs were verified live but are not frozen. FY2025 PPE $354m is a valid later presentation excluding $40m finance-lease assets and needs a comparability note, not replacement with $394m. These findings have been sent to the research worker for versioned source/document corrections. Final v2 narrative/history/manifest were not yet frozen at this model recheck; parent should require those corrections before final package admission.

## Final package disposition (01:15 UTC)

**PASS: admit the v2 package as an explicitly dated, analyst-constrained research scenario exhibit.** Final `v2/STUDY-v2.md`, history, provenance, guidance, source ledger and manifest inspected. All 23 v2 manifest-covered files match bytes/SHA256; all 70 original v1 entries remain unchanged. Confirmed FY2022 missing cells are filled and correctly sourced; cash, PPE and share-precision notes added; forecast and actual guidance source dates separated. Both legacy SoftBank PDFs are now frozen, valid PDF originals with matching ledger hashes and locally extractable historical totals; the original Q4FY25 letter is ledgered. Quoted investment exclusion, acquisition reserve timing and Qualcomm nominal-damages recipient are explicit. V2 study points to v2 model/guidance artifacts after a final filename correction.

This supersedes the earlier editable-model hold for v2 only. Preserve all stated limits in any integration: March31 capital origin with October19 information; no current-price comparison; uniform 2.5% positive NET investment is an analyst constraint, not engineering validation; funded headlines and incompatible sensitivity cells remain null; no claim of complete ten-year comparable accounting or precise grant-level legal dilution. Current valuation/target requires independently refreshed capital, exact shares and stub cash flows.
