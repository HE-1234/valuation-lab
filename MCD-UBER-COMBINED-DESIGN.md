# MCD and Uber combined staging

Exact layer order: published V85 UI `623c06999d68a162202db636dc230dc88dc68866`, independently reviewed MCD staging `e9b647c9bf5f5f7b57cae21e1cda10aa5428d3d1`, then Uber's frozen reviewed source from `250d26b9c7eae2df74298fd94021aba24747772f`.

The combination contains 35 ready models, 21 incremental packages, 47 catalog records and 934 production files. Uber adds 44 exact files and modifies 11 existing dispatch/catalog/presentation files. Its engine, adapter, views, translations and complete public source package are byte-identical to the reviewed standalone commit. Every MCD-specific production file and both MCD-only shared hooks remain exact. All four V85 UI files remain byte-identical.

Conflicting shared additions were reconciled additively. MCD remains before Uber in registry/catalog order and message-key append order. The UMC/MCD/Uber simulation guard omits only the unsupported generic capital-policy control. Both new companies retain EV-only Monte Carlo and null current-target fields.

The exact Uber reversal is pinned to the immutable MCD commit and runs once before the MCD/UI/earlier reversal chain. It records every before byte and every after/addition SHA-256; paths and fixture structure are strict. The prior-34 snapshot was captured from the clean MCD repository, not from the combined candidate. Existing golden fixtures were not regenerated. Historical subset tests explicitly exclude only the later admitted tickers, while current tree/order checks explicitly include them.

Validation at assembly: the standalone Uber independent review passed 17 engine, 17 integration, 9 strict-DOM and 4 additional independent-DOM groups, 316 independent arithmetic assertions and 38 stochastic trial replays. A separate source-only combined reconciliation review passed. The combined exact-preservation sweep passed 46 groups, including prior-34 calculations/edits/restores/seeded trials and locale identities. The original MCD prior-33 check also passed in the focused preliminary run. A test-error wording mismatch in the layered rejection message was corrected without changing production bytes or weakening checks.

Combined runtime checks, source-driven visual approximation, final aggregate and any native-browser validation remain separately identified gates. No canonical edit, push or publication is part of this staging work. The original standalone Uber manifest is retained as reviewed; rebased shared-file hashes are in `MCD-UBER-COMBINED-MANIFEST.json` and the exact preservation fixture.

Source-driven visual preparation subsequently captured 11 real fetched parsed-DOM states. Four actual manual seven-trial runs across both companies and both languages produced EV-only output with zero per-share acceptances and null current targets. Captures include default/selected June allocations, partial-history disclosure and a synthetic October shortfall. These are source captures, not screenshots; no renderer ran.
