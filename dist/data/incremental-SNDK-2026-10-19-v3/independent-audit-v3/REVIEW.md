# SNDK v3 independent correction recheck

2026-10-19 UTC. **PASS for conditional research scope.** The sole generic additional-claim funding inconsistency identified in the independent v2 review is repaired.

Reviewed the full v2-to-v3 code diff. The claim reserve now enters opening reserves, reduces the funding pool before operations, and is removed from the separate equity deduction. Thus the claim affects equity exactly once. The preserved operating EV now has an explicit CONTINGENT_ON_UNMODELED_FUNDING status when financing is unsupported.

Independently replayed all 114 saved standard/sensitivity/claim/distribution/terminal cases, plus 15 reserve boundary cases across all three scenarios. Repeated 36 finite/type/domain probes and mutation checks. All pass. V3 regular files are unchanged by this review.

With an additional $1,000M reserve, opening surplus is -$410M, peak unfunded requirement is $410M, and common/per-share values are null. The $590M exact boundary remains funded; $590.001M triggers withholding. Diagnostic equity drops by the claim once, not twice. Default zero-claim values match the prior independently verified results.

The independent v2 review's limitations remain: current price/return/ranking and historical backtests are blocked; tax/legal overlap is unresolved; shares are a proxy; terminal physical/JV ratios are analyst continuity assumptions, not proven physical budgets; nonzero financial debt requires an actual maturity/interest model to certify liquidity. Unfunded operating EV is a contingent diagnostic and must retain its status in any UI or export. No unconditional valuation or unrestricted production-model approval is given.

Evidence: recheck.py and recheck-results.json in this folder; broader accounting/economic review remains in independent-audit-v2/REVIEW.md. No original or canonical/Site files changed.
