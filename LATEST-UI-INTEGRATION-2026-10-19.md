# Latest UI integration, 2026-10-19

## Sources and scope

- Integration baseline: immutable V86 `fda9fcfa566d174e97924305b4ff3f6b7daabd4d`, with complete Git ancestry retained in the candidate.
- User UI source: [HE-1234/valuation-lab c8ec118ae7ff2538a70a95b274632f78b836e4c5](https://github.com/HE-1234/valuation-lab/commit/c8ec118ae7ff2538a70a95b274632f78b836e4c5), “Fold the Valuation range guide, fix language flips and long-name layout.” The seven independently downloaded blobs and their modes were verified. Exact source patch SHA-256: `083d566c2f1b5cbba2055d3eb9f658b10eeacc64ee4019217ed0fb395692ad86`.
- Included separately reviewed company copy repair: patch SHA-256 `d65662d9793474981068383c1af88e59c9ba95f3a80a988bc165bf4170ad3330`. UBER's source-derived TTM label accepts both recorded source-kind spellings. NFLX's exact duplicate scope sentence appears once; distinct warnings remain.

The user's folded reading sections, same-scale what-if ladders, endpoint-versus-yearly-innovation cards, Sampling guide, bilingual text, history and accessibility label updates, and responsive company-name treatment are retained. The V86 chart-annotation and custom mobile-trial-count geometry fixes are retained. No model, financial engine, company data, research evidence, defaults, limits, or stored drafts are changed.

## Narrow compatibility repairs

1. A newer keyboard focus takes priority over a pending or settled older hover. Entering the guide, leaving its root, or destroying its mount clears stale hover/link state. An old queued hover cannot attach to a replacement mount.
2. Guide Edit links open existing ancestor disclosures before resolving and focusing the actual native field or its radio replacement. The target's value is unchanged.
3. Sampling precision uses accepted scenarios, not attempted scenarios. A completed result's selected count uses its actual accepted count; comparison counts use a conservatively rounded projection of the observed acceptance rate. Preview estimates use the preview's own accepted count. Projected counts are labeled separately from actual counts.
4. The retained normal-reference formula is explicitly an illustrative approximation, not a validated 95% interval or market probability. Numeric estimates are withheld for fewer than 100 accepted source/projected scenarios, invalid/missing counts, nonfinite or unordered quantiles, and zero/numerically collapsed central spread. The count threshold is a display safeguard, not proof of statistical validity. Positive uncertainty below two-decimal display resolution is shown as less than 0.01, never falsely as zero.
5. A pre-existing invalid-to-valid rerun bug was exposed by the new lifecycle tests: localization attached to the output container could replace a fresh chart with the previous error text. The invalid message now binds to the existing error child, so replacing the output removes that binding with the old child.

These repairs change presentation and lifecycle handling only. They do not resample, clip, calibrate, replace rejected draws, change endpoints, or modify an engine.

## Statistical reference actually reviewed

The normal-reference constants follow the large-sample quantile relation SE(q_p) = sqrt(p(1-p)) / (sqrt(n) f(q_p)), evaluated under a normal reference. See [Jiahua Chen, University of Waterloo, Theorem 4.7, page 58](https://www.math.uwaterloo.ca/~jhchen/tit.pdf#page=58). The implementation retains sigma* = (P90 − P10) / 2.5631, median scale 1.96 × 1.2533 × sigma* / sqrt(n), and P10/P90 scale 1.96 × 1.7094 × sigma* / sqrt(n), where n is accepted sample size. Skewed, heavy-tailed, truncated, or repeated outputs can invalidate this approximation. No course or video completion is claimed.

## Exact preservation and verification

The newest reversible preservation layer pins the seven source blobs, separate exact compatibility changes, immutable V86 before bytes, and final reviewed hashes. It runs before the company-copy, chart-geometry, NFLX, and older release gates. No earlier source fixture or digest assertion is weakened. The 979 production paths, executable modes, all 36 reviewed company models, and all 62 historical fixtures remain accounted for.

Focused checks execute actual shipped package paths (without registry injection), real valuation engines, and parsed shipped DOM. New tests cover accepted-count correction with real excluded trials; tiny, missing, invalid and collapsed samples; English/Simplified Chinese precision text; invalid/edit/cancel/rerun flows; hidden/reopen flows; stale hover; disclosure Edit links; and locale comparisons. Existing strict DOM, manual Run, company copy, guide, historical, and skin checks remain applicable.

Focused tests are not the release aggregate or native browser layout/accessibility evidence. Aggregate verification must use the frozen final candidate. Native inspection of the upstream UI is separate from native inspection of this integrated candidate. Known narrow-phone trial-pill/action-row findings remain for separately coordinated native layout review; no unverified general mobile redesign is included here.

Focused gate on the final production: 78/78 combined checks, 21/21 separate strict-DOM checks, and 90/90 exact-preservation checks passed, with no skipped or cancelled tests. Full aggregate and native integrated-site checks are recorded separately and are not implied by these focused results.
