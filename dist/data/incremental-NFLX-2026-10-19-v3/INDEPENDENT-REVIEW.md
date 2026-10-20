# NFLX v3 independent review: limited approval

Reviewed 2026-10-19. Package: `/workspace/shared/atlas-research/company-onboarding/NFLX/v3`.

## Verdict

**Pass for historical research, the dated operating scenarios, and conditional equity allocations within v3's explicit supported policy conventions.** Finding F5 is closed. Original findings F1–F4 remain resolved. No remaining blocker was found in this reviewed research domain.

This approval does not authorize integration or publication. It does not establish current October value or shares, Q3-updated results, exact award/financing-hedge market value, legal maximum PSU entitlement, or intrayear liquidity. Default allocation, current target and current upside remain null. Capital and discount anchor remain June 30, 2026; the information cutoff is October 19. The actual issuer announcement supports the October 20 scheduled release; results remain pending and absent.

## F5 resolution verified

V3 jointly enforces the following, rather than accepting an unrestricted expense addback:

- The ten-period existing-award expense schedule must reconcile to the selected total remaining-expense assumption.
- Expense cannot extend beyond the selected recognition horizon or the supported June 30, 2029 maximum for the existing unmodified awards. Final partial-year expense is explicitly assumed recognized by that date; discounting and funding remain year-end approximations.
- The aggregate budget is restricted to the approximately $150.25470453m source-context envelope only under explicit acceptance of no unmodeled positive modifications or other additions.
- Each period must first retain content amortization and noncontent D&A, explicit future-grant cash compensation, and other cash operating costs. The existing-award adjustment can use only remaining cost capacity.
- Future compensation must satisfy the explicitly selected restricted convention anchored to FY2025 SBC/revenue; other cash costs must be positive. The terminal period also retains these costs and receives no existing-award addback.
- These retained components already sit within EBIT and are not deducted from FCFF a second time.

All four v2 counterexamples are now rejected, both with the original $60m budget and with the edited schedule's total reconciled:

1. $1,000,000m of H2 award expense, exceeding all operating costs.
2. $10,000m, below total costs but above the residual after explicit amortization/D&A.
3. $8,690.226m, removing all of H2's residual operating costs.
4. A $25m expense for existing June awards in 2035.

Realistic independent boundary tests also passed: exact and $0.000001m over/under budget reconciliation; exact and slightly above/below the source-context envelope; a $25m existing-award adjustment exactly filling retained-cost headroom and just exceeding it; the compensation-intensity floor; positive retained other cash costs; deliberately zero remaining award expense; selected and maximum recognition horizons, including June 2029 partial-year recognition; malformed/missing fields and mutated source-context facts; and impossible explicit D&A relative to total operating costs.

## Source context is not an exact economic claim

The [FY2025 filing](https://www.sec.gov/Archives/edgar/data/1065280/000106528026000034/nflx-20251231.htm) reports $47m unrecognized RSU/PSU cost over a 1.53-year weighted period. The [June 2026 filing](https://www.sec.gov/Archives/edgar/data/1065280/000106528026000212/nflx-20260630.htm) reports 1.245383m H1 grants at $82.91 weighted grant-date fair value, three-year RSU vesting and one-to-three-year PSU performance periods. The source-context sum is $47m + 1.245383m × $82.91 = approximately $150.25470453m.

V3 correctly labels that sum an analytical admission restriction under a stated assumption, **not** a verified June remaining expense, legal maximum, or complete grant/modification reconciliation. It acknowledges rounded figures, unknown H1 recognition and grants associated with prior-period PSU settlement. A higher budget requires new evidence and a newly supported convention.

Similarly, FY2025 $368.449m SBC divided by $45,183.036m revenue is a historical reference. Its use as a forward cash-compensation floor is an explicit restricted assumption, not reported future payroll. Lower-compensation theses are outside this implemented convention. The named illustration retains 1.1% of revenue for future compensation and 20% for other cash costs. Neither is silently claimed to be a sourced forecast.

## Previous fixes and arithmetic preserved

- Brazil's $729m H1 payment is not reserved or paid again; additional exposure and any recovery remain separate assumptions.
- The $11,939.734m next-twelve-month content obligation is enforced in input validation and defensively at allocation. The original impossible-content case still fails, even with all FY2027 cash frontloaded. Exact/slightly-below timing boundaries and display-summary spoof tests still behave correctly.
- Face debt, the $13.574m interest-rate derivative net claim and explicit assumed financing-FX reserve remain separately matched under the stated hypothetical closeout convention. Other debt bases cannot silently substitute.
- The actual retained [issuer announcement](https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx) contains the October 20 date. The older dynamic shell is not date evidence.
- June cash, shares, option equation, July financing proceeds/principal pairing, termination-fee treatment, content cash bridge and lease convention retain the reviewed treatment.
- The $25m/$25m/$10m existing-award expense schedule still adds back only its after-tax dated PV before existing awards are separately allocated. No terminal or broad SBC addback appears.

Core operating EVs, USD millions, remain **107,739.546151447 / 253,951.466305519 / 447,945.815040453**.

Named conditional June allocations remain **23.5305378037 / 57.8742109885 / 103.1582000462 per share**. The entire named funding-stress output, option claim and allocation-adjusted EV also match v2 exactly. These are dated conditional illustrations, not current targets or upside estimates.

## Independent evidence

- `audit_v3.py`: **8,428 passing assertions** across three source scenarios and thirty seeded edited operating scenarios, using independent 48-digit Decimal FCFF/terminal calculations and Newton/erfc option allocation. The edited cases use explicit retained-cost policies within the supported domain.
- `joint_boundary_audit.py`: **697 passing focused checks** covering prior repairs, the four counterexamples with/without reconciled budgets, joint expense boundaries, malformed inputs, all period envelope calculations, exact unchanged v2 outputs, fresh public-only CLI execution, and preservation.
- All **35 public manifest entries and 16 original source captures** match declared lengths and hashes. Archive members match exactly, and issuer captures remain outside the public ZIP.
- Fresh public-only CLI output exactly matches the frozen default output.
- Every original file in v1, v2 and v3 remains unchanged. No original-package script was executed as `main()`, and no canonical application or publication action occurred.

The evidence reports are `arithmetic-provenance-results.json`, `joint-boundary-results.json`, `original-fingerprints.json`, and `verdict-v3.json`.

## Admission boundary

The approval covers the dated research artifact and validated edits within its implemented conventions. It is not approval for an arbitrary unvalidated runtime API: direct `run_case()` reuse still requires the caller to perform model validation. A later JS/UI integration needs its own source identity/schema, actual fetch, malformed-input, lifecycle, export and prior-company preservation review.

Remaining explicit limitations include unknown exact current cash/shares and capital movements, stale income-tax uncertainty used as an analyst reserve, assumed financing-FX closeout value, weighted-strike/life option approximation, unknown legal maximum PSU payout, assumed remaining award expense, content payment timing/new commitments, and annual rather than intrayear funding capacity. No market quote or current target is introduced.

ZIP SHA-256: `7684551fe41f296fc1503dfd9de200ed8742da2a29283002a0f5d5b2cd68cb55`.
Manifest SHA-256: `1e43441284f9f58520904ef273dd7fc672a877b5f8228b6f1c9fe95ee258bbf0`.
