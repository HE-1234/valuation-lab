# Simplified Chinese presentation

The Chinese selection now uses `zh-Hans`. English remains the new-session default; the corner button still shows `中文` or `EN`. A saved `zh-Hant` preference migrates to `zh-Hans` by writing only `valuation-lab-locale`. Storage failures fall back safely without touching financial drafts.

## Build

Install the build-only pinned dependency with `python3 -m pip install -r scripts/requirements-localization.txt`. Run `python3 scripts/build-simplified-chinese.py` to regenerate Simplified catalogs. The standalone research localization pipeline invokes this step after rebuilding its reviewed source catalogs.

The conversion uses OpenCC's `t2s` dictionary through `opencc-python-reimplemented==0.1.7`. Retained `*.zh-Hant.*` assets are translation-source artifacts, never runtime imports. Eleven derived Simplified catalogs cover the existing authored UI and research; mixed shell/index/accessibility/prose-pair catalogs are converted as presentation assets. The browser has no OpenCC or network translation dependency.

Bounded reviewed terminology includes 蒙特卡罗, 概率, 变量, 营业利润/营业利润率. Revenue remains 营收. Finance claim labels receive full-message, exact-key overrides to 索偿权 where their English source explicitly concerns claims; debt, warrants and awards are not mislabeled as ordinary equity. These overrides live in `scripts/research-translations/simplified-ui-overrides.json` and are applied only to specified UI catalogs.

## Preservation and verification

The conversion never rewrites source JSON, source quotations, URLs, financial engines, numerical inputs or user notes. Research source-pointer and immutable-source hash tests remain in force. The new catalog test verifies complete key coverage and unchanged non-Han content for every generated entry, including English, numerical tokens, formulas, symbols and interpolation parameters.

`tests/simplified-chinese.test.mjs` covers representative terminology, migration with available/blocked storage, English fallback, document language, announced button labels and repeated toggles preserving node identity, focus and state. Existing locale suites cover annual, guided, historical, simulation, learning and standalone research boundaries. These are automated DOM fixtures and integrity tests, not a claim of real-device visual testing.
