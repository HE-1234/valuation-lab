# NBIS owned-build capital audit

Cutoff: 17 October 2026. USD millions unless stated otherwise. Canonical research read only; no deployment or model edits. This audit is an operating-model diagnostic, not a security appraisal.

## Decision

The selected December-2026 EV of **−7,719.500** reproduces. There is no discovered arithmetic double charge of depreciation, capital spending, advances or peak funding deficit. However, this is not a researched equipment-cohort/capacity plan. It is a large owned-build spending policy superimposed on separately selected revenue and margin paths. Its negative result cannot establish that Nebius's actual operating business destroys value, nor that the existing equity option has zero value.

No source reviewed supports a defensible single replacement positive operating case. Preserve this case as a conditional owned-build scenario; a preferred default remains unresolved at the specific unit-economics inputs listed below. A partner route is supported by the company's strategy, but not a quantified take-rate/cost forecast.

## Primary facts checked

1. [Q2 shareholder letter, August 12](https://assets.nebius.com/assets/a6ecfd85-a6cb-4967-8ef7-9a25bd261f9c/SHLQ226.pdf?cache-buster=2026-08-12T11%3A54%3A46.695Z): company expects more than 1 GW annual deployment from 2027, with 5 GW contracted power at year-end 2026. Recent core deals averaged over $20m annual contract value/MW; higher short-term pricing is not a portfolio-wide rate. Most Q2 deals feed primarily 2027 revenue. The disclosed 22-month payback is an estimate for new Q2 deals, based on future recognized revenue/costs and excluding prepayments, not a whole-company return measure. Q2 AI-cloud adjusted EBITDA margin was 50%. Management expects over $9bn 2026 gross customer prepayments. These statements support stronger economics as a possibility, not an automatic forecast uplift. (Pages 2–5.)

2. [H1 interim statements, August 12](https://www.sec.gov/Archives/edgar/data/1513845/000110465926094844/nbis-20260812xex99d2.htm): server/network useful lives changed from four to five years prospectively in January. June gross server/network equipment was $5,197.7m; assets not in use were $7,836.4m, including installation/prepayments. June net PPE was $13,045.2m. H1 D&A was $471.7m, with $462.6m PPE depreciation. H1 net deferred-revenue cash-flow increase was $4,395.0m; June deferred revenue totaled $5,975.2m. Capital items acquired but unpaid were $973.3m. These balances show why cash spending, placed-in-service depreciation and replacement are different schedules. (Accounting estimates; notes 4 and 7; cash-flow statement.)

3. [July 15 partner-model announcement](https://nebius.com/newsroom/nebius-introduces-business-model-to-scale-ai-cloud-globally-through-infrastructure-partnerships): partners finance and own infrastructure and hardware and operate facilities. Nebius provides architecture/software/services and customer distribution. Economic forms can include revenue shares, licenses, commissions and committed-capacity arrangements. Initial arrangements existed. The announcement does not disclose an aggregate take rate, minimum purchase cost, capacity rollout schedule or principal-versus-agent revenue conclusion. Therefore this is more than a different financing source for otherwise identical wholly owned cash flows.

4. [March 16 Meta announcement](https://nebius.com/newsroom/nebius-signs-new-ai-infrastructure-agreement-with-meta): $12bn dedicated five-year capacity begins delivery early 2027; up to $15bn further capacity is an unsold-capacity purchase commitment. The same capacity cannot earn both third-party revenue and that backstop. Headline TCV cannot be added to annual revenue or RPO as though non-overlapping.

5. [Q1 shareholder letter, May 13](https://assets.nebius.com/assets/6aba98d1-946c-4891-a420-d2f0aa60da95/Nebius%20SHL_Q1%202026.pdf?cache-buster=2026-05-13T12%3A54%3A12.130Z): over 75% of contracted power was then owned capacity. Q1 capex was approximately $2.5bn. Accounting life was extended based on use patterns/utilization commitments. Neither the historic ownership mix nor accounting life determines all future funding or actual chip-refresh cadence.

The frozen dossier's $3.0–3.4bn 2026 revenue, $7–9bn exit ARR and $20–25bn capex guidance are attributed to call-text review. I did not independently listen to the call or upgrade that provenance to a letter containing the complete numerical guidance. The $3.2bn anchor is an analyst-selected midpoint of a management range, not a management-issued point forecast; metadata should say so.

## Model audit: what is and is not consistent

- **Growth:** $9.6bn/$17.28bn/$25.056bn 2027–29 revenue is judgment, not guidance. At $12m/$20m annual recognized revenue per billable MW, the first year needs 800/480 average billable MW. Contracted power, delivered MW, installed GPUs, accepted capacity and revenue are distinct. This simple check does not prove the forecast infeasible; it identifies the utilization/commissioning bridge needed. Partner capacity may bring only fee revenue rather than the entire compute selling price.
- **Margins:** selected EBIT plus selected D&A and illustrative 3% SBC implies adjusted EBITDA margins of 49.67%, 52.62%, 54.92% in 2027–29. From 2030 it implies 51%. Q2's segment margin is not a consolidated forecast or a legal ceiling, and other adjustment items exist. The case already assumes improving cash operating profitability; it is not merely applying today's loss margin indefinitely. No source establishes the selected future whole-group margins.
- **Capital:** $20bn each year 2027–29 is not disclosed annual company guidance. From 2030, gross capex is algebraically derived from 30%-of-revenue D&A plus a net-investment policy converging to terminal 12% ROIC. Smooth FCFF/terminal matching proves arithmetic continuity, not sufficient capacity or replacement funding. Splitting future spend into land/facilities, GPU/network cohorts, work-in-progress, installation and supplier payments is still necessary.
- **D&A:** changing useful life alone does not save economic hardware consumption. At fixed pre-depreciation cash earnings, lower D&A raises EBIT but lowers the addback; the residual impact is the tax shield, not the full D&A change. The selected independent EBIT and D&A paths have no cohort roll-forward proving feasibility, but the available facts do not establish a hard contradiction.
- **Advances:** the early model nets receipts and recognition correctly and does not add advances again as assets. Gross receipts cannot be inferred by subtracting a net cash-flow movement from management's gross full-year statement. After 2029, balances rise from $19.8bn to $27.329bn before falling to $20.286bn in 2034; gross receipts and recognition are no longer separately modeled. The resulting 2033–34 runoff is assumed, not an observed impending refund or management prediction. Keeping revenue-linked balances in perpetuity is also a scenario. Future recognition must remain part of total revenue, not incremental revenue.
- **Cash versus economic capital:** capex payable settlement belongs once in cash spending. Operating rent/power included in EBIT cannot also be subtracted wholesale as debt. Financing proceeds do not reduce economic capex. A slower payment schedule can improve today's cash without delivering extra real capacity; match later payments and committed obligations.
- **Existing partner alternative:** reducing 2027–29 capex to $14bn with the same total revenue and EBIT path is not validated by the July announcement. It already changes D&A and implied cash margins, but still lacks revenue ownership, procurement/lease fees and partner return economics. Do not relabel it as company guidance or a researched preferred case.

## Reproducible sensitivities, not proposed defaults

Run `python sensitivity.py`. The snapshot and executable calculation are included; all numbers below are at December 31, 2026 before debt and equity claims.

A clean capital-efficiency experiment assumes the same physical assets, commissioning, capacity and pre-depreciation cash earnings, but a one-off reduction in 2027–29 purchase prices. All affected spending is treated as five-year hardware with half-year first/last depreciation and zero salvage. EBIT and D&A move together; later replacement quantities/prices and terminal cash flows remain unchanged. This deliberately simple assumption is not an evidenced procurement forecast or partner model.

- 10% spending-price reduction: EV −$3.999bn.
- 20% reduction: EV −$0.278bn.
- 25% reduction: EV +$1.582bn.
- EV-zero threshold: 20.75%.

If gross advances also fall by 35% of saved spending, and advance-balance differences recover linearly to the unchanged 2034 endpoint, the corresponding EVs are −$4.681bn, −$1.643bn and −$0.123bn. Threshold rises to 25.41%. That 35% linkage and recognition recovery are explicit analyst tests, not source facts.

Separately, improving annual operating cash margins by five percentage points, at unchanged revenue/assets/D&A/advance policies, produces EV +$4.828bn. The opposite change produces −$20.267bn. Terminal reinvestment rises with improved NOPAT to preserve 12% terminal ROIC. The EV-zero improvement is 3.08 percentage points. Do not interpret a D&A accounting change as this cash-cost improvement, or apply the quarterly segment EBITDA margin directly as a consolidated EBIT margin.

These results demonstrate sensitivity of the negative operating sign to unresolved unit economics. They neither establish those improvements as likely nor settle common equity after current and future capital claims.

## Exact inputs needed for a defensible alternative

1. Commissioned/accepted owned, colocated and partner billable MW by year and utilization; equipment generation and revenue mix; gross versus net revenue recognition.
2. Owned-build dollars/MW split between five-year hardware, longer-lived facilities, network and construction; commissioning dates and actual remaining opening cohorts.
3. Customer recognized revenue per active MW and contract duration by cohort; no extrapolation of exceptional short-duration pricing to all capacity.
4. Replacement timing, cost, reuse/resale proceeds and performance/price erosion for each hardware cohort; accounting useful life does not answer these.
5. Partner fees/revenue share/minimum capacity commitments, who pays power/service costs, and timing/scale of deployment.
6. Gross advance receipts, recognition and refund obligations by contract, linked to the very same recognized revenue and owned/partner capital plan.

These are bounded model inputs, not a demand for an exact unpublished October balance sheet. Until they are chosen with evidence and openly labeled assumptions, provide the signed owned-build diagnostic and transparent sensitivities rather than assert a preferred operating valuation. No further broad search is necessary to reach this conclusion.
