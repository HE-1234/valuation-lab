# ARM exactV72 preservation contract

The immutable baseline is commit `508c24877a26987b905fee55ad45ac764b83c184`
(exactV72), containing 1,140 tracked files and 603 production files under `dist/`.
The canonical checkout was read only. ARM integration work is isolated in the
separate integration checkout.

## Old-company output evidence

`arm-v72-output-goldens.json` was captured from the canonical exactV72 checkout
before completing ARM integration. Its SHA-256 is:

`aa75ddae44dcc2c10c37ae73f81fc0637123bdb0b386e86fea9cfac795f01b49`

It records all 28 original companies in their exact displayed order, including
SNDK. For each company it hashes the complete default draft, operating/timing/
claim outputs, outputs after a first-year margin edit, nine seeded simulation
trials, a serialized-and-restored edited draft, restored outputs, and English
and Simplified Chinese results-panel text. It separately records 706 existing
source-text locale keys, 708 translated-text mappings, and the exact English and
Simplified Chinese text resolved from all existing source keys.

The capture excludes only ARM. It removes only transient `updatedAt`,
`exportedAt`, `elapsedMs`, and `durationMs` fields before hashing. Seeds use
`V72-preservation-<TICKER>`; the edit adds 0.0001 to first-year margin and retains
an explicit user note and edited flag. Joint annual growth innovation is 0.005
where that configuration exists. No new-company result is used as an expected
old-company value.

The earlier `sndk-v71-output-goldens.json` remains byte-identical. Its 27-company
capture continues to exclude SNDK and now also excludes ARM, retaining the old
V71 seed and edit conventions exactly. Its ordering assertion explicitly permits
only the appended SNDK and ARM entries.

## Production-source evidence

`arm-integration-v73.json` enumerates SHA-256 for all 603 exactV72 production
files. Every changed baseline file is represented solely by inserted UTF-16
string spans plus before/after hashes. The test checks exact current bytes,
removes only those spans, and verifies the restored baseline hash. An appended
unauthorized mutation is rejected for every reviewed hook file.

`reverseArmIntegration` runs before `reverseSndkIntegration`, which retains the
existing CRDO, user UI, AMD, MRVL, CAMT, ONTO, and earlier preservation chain.
Thus old preservation assertions continue checking their original hashes after
only the explicitly reviewed newer additions have been removed.

The addition manifest admits only ARM-specific module names and the dated ARM
public research directory. The complete on-disk production inventory must equal
baseline production plus reviewed ARM additions. Added files are hash-checked;
raw-source and transcript directory additions are rejected.

The fixture generator reads the baseline through Git, rejects deletion or
replacement of any baseline character, verifies exact independent reversal,
and refuses to regenerate old-company output goldens. Fixture generation is a
separate review step, never a side effect of running tests.

## Existing assertion audit

- Total research operating replay is explicitly extended from 28 to 29 companies.
- SNDK preservation's production inventory includes only reviewed ARM additions;
  its 550-file V71 baseline and old 27-company output expectations are unchanged.
- Original 14-company bundles, the 45-company directory, 26-page research locale
  manifest, historical fixture sizes, and old release hash inventories remain
  unchanged because ARM does not alter those source bundles.
- Annual English/Simplified key parity and the exact historical Simplified prefix
  remain unchanged unless new annual locale keys are explicitly integrated.
- New incremental message keys must preserve every existing key, translated
  mapping, and resolved English/Simplified string through the output goldens.

Focused preservation, replay, and locale checks are run before the parent-owned
aggregate suite. Aggregate execution requires the integration owner's go-ahead.

## Verified integration result

The final source fixture pins 40 insertions across 10 pre-existing production
files and 38 ARM-only added files, giving 641 production files total. Fixture
SHA-256: `3a1c2d2f2ef4dcaa9c36dc9fd22d34b100dcc47d7dcc1a0301c9e63e3898d964`.

The modified baseline files are:

- `dist/annual-growth-horizon.js`
- `dist/incremental-messages.js`
- `dist/incremental-registry.js`
- `dist/incremental-research-claims.js`
- `dist/incremental-research-view.js`
- `dist/incremental-research.js`
- `dist/research-model.js`
- `dist/research-simulation.js`
- `dist/research-view.js`
- `dist/simulation-error-i18n.js`

Focused verification passed:

- 26 preservation checks across ARM, SNDK, CRDO, user UI, AMD, MRVL, CAMT, ONTO,
  NVMI conditional tools, and joint integration. This includes old28 and old27
  numeric/rendering goldens, all603 production reversals, addition inventory,
  original release hashes, and mutation rejection.
- 40 locale/catalog/replay checks across joint valuation, annual localization,
  Simplified Chinese, research i18n, company catalog, and independent i18n state.
  All29 companies replay exactly at zero uncertainty. Original14 companies retain
  model state, storage, control nodes, and focus through twenty locale toggles.
- Canonical exactV72 goldens were captured twice independently with exact equality;
  canonical Git status remains clean and the prior SNDK fixture files are unchanged.

These are 66 distinct focused checks. No aggregate suite was run by the
preservation worker; aggregate ownership remains with the integration owner.

Final ARM-specific invalid-headline wrapper and exact-focus/coupled-edit helper were subsequently pinned in the refreshed fixture. The final focused engine/runtime/ARM/SNDK preservation rerun passes all 23 checks. No compact numeric display precision or economic constraint was weakened.
