# Bloom Energy (BE) addition — 2026-10-23

Bloom Energy is available in the existing Guided layout, in English and Simplified Chinese. It has FY2025 annual and fully filed September 2026 TTM bases, plus ten actual annual history rows (FY2016–FY2025). Guided now contains 56 companies and 102 selectable bases.

## Filed financial bases

USD millions, except conditional value per share. Values use the editable researched assumptions and are not market prices or price targets.

| Base | Filing date | Revenue | Reported EBIT | Starting EBIT after normalization | USD/share | Reported-debt stress USD/share |
|---|---|---:|---:|---:|---:|---:|
| [2025-12-31](https://www.sec.gov/Archives/edgar/data/1664703/000162828026006516/be-20251231.htm) | 2026-02-09 | 2023.994 | 72.802 | 32.381 | 12.1356 | 11.4607 |
| [2026-09-30](https://www.sec.gov/Archives/edgar/data/1664703/000162828026066931/be-20260930.htm) | 2026-10-22 | 3829.939 | 567.405 | 529.683 | 30.5714 | 30.0906 |

TTM revenue = 2023.994 + 3052.256 − 1246.311 = 3829.939. TTM reported EBIT = 72.802 + 479.876 − (−14.727) = 567.405. The September 10-Q was filed October 22; no release-only provisional treatment is needed. BE was absent before this request.

## Consequential accounting treatments

- Each convertible-note series independently retains principal or converts into shares. The default TTM scenario retains the high-strike 2030 principal and converts the low-strike 2029 notes. The mixed decision appears in the claims table. Annual still includes the 2028 series; September does not, because it was settled.
- The Oracle warrant is modeled in the annual base. It was exercised cashlessly in May 2026; the September common-share count already includes the resulting shares, so September has no second warrant claim.
- Customer deposits reserve $78.207m annual / $661.354m September from surplus cash. This is a conservative operating-funding proxy, not legal restricted cash or debt. Half-reserve and omitted-reserve alternatives are visible.
- Own-share profit on product sales to affiliates is eliminated below reported EBIT. The researched case subtracts $40.421m annual / approximately $37.722m TTM to avoid extrapolating this timing gain. Raw reported EBIT remains intact. The current-year $16.9m component is rounded filing disclosure.
- Modeled debt uses contractual-payment present value for managed-service financing obligations, excluding residuals the issuer expects to offset against related assets rather than repay in cash. Reported book debt remains in source facts. Add $200.511m annual / $149.301m TTM to additional other claims to reproduce the reported-debt stress above.
- Fixed claims include NCI, EPP derivatives and unfunded Fund JV commitments exactly once: $51.629m annual / $49.622m TTM. Restricted cash is excluded; affiliate investments with below-EBIT returns are included as separate assets.
- Capped calls are separate assets and are not automatically extinguished by note redemption. September carries annual contract parameters with explicit provenance and a continuity assumption. The omitted-asset sensitivity exposes this gap; maximum nominal payoff is $255.31175588m, not a guaranteed present value.

## History and assumptions

FY2016–FY2025 history uses revised filing evidence where available. No FY2015 opening row is invented. Unresolved FY2016 pretax income and FY2016–FY2017 complete debt remain missing with explanations. IPO, accounting transitions and portfolio changes are excluded from comparable historical ranges where appropriate.

Defaults are 30% initial growth, 18% mature GAAP operating margin, 23% normalized tax, 1.5x sales/capital, 11.5% WACC, 3% terminal growth and 15% terminal marginal ROIC over ten years. They remain editable. Employee option volatility/rates, NCI and affiliate asset book values are labelled proxies. See [source review](additions/BE_REVIEW.md) and the in-app source ledger for detailed evidence and limitations.

## Verification

- 119 targeted tests passed sequentially with the 2 GB Node heap cap. Independent multi-series conversion arithmetic, no double-counted securities, NCI and reserve treatment are covered.
- 42 source-schema validations passed.
- 8 base/locale/viewport combinations and 32 history-panel checks passed at 1440px and 375px in both languages; no runtime errors or horizontal overflow.
- Two selective rebuilds are byte-idempotent. All pre-existing 55 company records, cases and histories and all previous claims/financial definitions remain unchanged.
- No package installation, commit or push.

Audits: `audits/be-addition-2026-10-23.json`, `audits/be-tests-2026-10-23.json`, `audits/be-ui-2026-10-23.json`, `audits/be-rebuild-2026-10-23.json`.

## Reproduce

```sh
GUIDED_CUTOFF=2026-10-23 python3 -I scripts/build-guided-additions.py --tickers BE
node scripts/report-be-addition.mjs
```
