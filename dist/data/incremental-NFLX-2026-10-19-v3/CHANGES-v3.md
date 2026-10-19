# NFLX v3: bounded existing-award expense adjustments

Cutoff 2026-10-19; capital and discount anchor remain June 30, 2026. Q3 results scheduled October 20 remain pending. V1 and v2 are preserved. V3 requires targeted independent review before editable-model admission.

## Finding corrected

Independent v2 review verified the four original source/model repairs and the named illustration, but found that the new existing-award expense adjustment could exceed available costs or run into 2035. V3 adds joint constraints rather than a generic arbitrary dollar cap:

1. The ten-period expense schedule must exactly reconcile to an explicitly selected aggregate remaining-expense assumption. Example remains $60m, allocated $25m/$25m/$10m in H2 2026/2027/2028.
2. The selected recognition horizon must end no later than June 30, 2029 under the supported unmodified-award convention. The example ends December 2028. Disclosed RSUs vest over three years; PSU performance periods run one to three years. Expense in a final partial year is assumed recognized before the chosen date; year-end discounting remains the annual approximation.
3. The policy restricts aggregate expense to the source-context reference of $47m plus 1.245383m granted units times $82.91, approximately $150.2547m, only under the explicit assumption of no unmodeled positive modifications or other additions. This is a restricted analytical admission envelope, not exact June unrecognized expense or a legal ceiling. H1 recognition, rounded data and prior-period PSU settlement mean an exact reconciliation remains unavailable. Above-reference budgets require a newly supported implementation, not a bypass field.
4. Per-period costs must retain content amortization and noncontent D&A, then explicit forward cash compensation and other cash operating costs. The example retains 1.1% and 20% of revenue respectively, already embedded in EBIT. It never subtracts them twice. This restricted convention uses FY2025 SBC/revenue, 0.815459%, as a minimum future-grant cash-compensation intensity; other retained cash costs must be positive. Those are assumptions, not reported future payroll.
5. Existing-award expense must fit the remaining cost envelope in every period. The engine also rejects core forecast periods whose explicit amortization plus D&A exceed all operating costs. Terminal costs preserve forward compensation and other cash costs, while existing-award expense is zero.

The four reviewer counterexamples are rejected, including when their selected budget is enlarged. Tests separately exercise budget equality, slight over/under reconciliation, exact and just-above the source-context admission envelope, exact and just-over available cost capacity, retained-compensation boundaries, final partial-year recognition, unsupported later years, terminal cost requirements, and deliberate zero remaining expense versus invalid zero compensation.

## Unchanged financial results

Core EVs, USD millions: 107,739.546151447 / 253,951.466305519 / 447,945.815040453.

Named conditional June allocations: 23.5305378037 / 57.8742109885 / 103.1582000462 per share. The guardrails do not force or alter those examples. Default allocation, current target and current upside remain null. Brazil is not deducted twice; financing claims and content commitments retain the v2 treatment.

## Checks and prior freezes

205 author model checks pass in normal and optimized Python. Twelve targeted retained-source checks pass. Public replay requires only the Python standard library; optional raw-source checks additionally require retained captures and lxml. Raw issuer captures are excluded from the public-safe archive.

V1 ZIP: bb69e37e31d8917a584f6d81645d227be2d8f60e0a0599fd517c58d00a6f9b98.
V1 manifest: c37668765462dcd6f2084973ef362ed529caeef9d94c1266bbd45d8fcbd72d7d.
V2 ZIP: 8babb22e91a57450946b7b1e7dcf1c5fb77dbe76036c9923ec7df8cf0ebfa0e1.
V2 manifest: fea5ae05896e6d5249240a0859ab8a61d88a3d03586619fbff3cd3d63b04f9a4.

No current capital/share verification, exact award appraisal, legal maximum PSU determination, financing-FX market appraisal, intrayear cash certification, Q3 update, canonical change or publication is claimed.
