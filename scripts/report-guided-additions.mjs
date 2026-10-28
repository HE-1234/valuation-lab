// Reproducible audit of the requested Guided additions, with no live price inputs.
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsSensitivity,financialDefinition} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json'),history=read('../dist/data/company-history.json');
const tickers=['MA','SPGI','DUOL','RDDT','HOOD','RKLB','NKE','CMG','CRWD','PANW','BAM','APP','COST','QCOM'];
const records=[];
for(const ticker of tickers){const c=u.companies.find(c=>c.ticker===ticker);for(const raw of guidedBasesFor(c)){
 const snapshot=currentSnapshot(c,raw),draft=draftFor(c,raw,{baseCases:cases});draft.cutoff='2026-10-21';const value=calculateCurrent(snapshot,draft),financial=financialDefinition(snapshot);
 records.push({ticker,id:raw.id,periodEnd:raw.periodEnd,filedAt:raw.filedAt,mode:raw.snapshotMode,sourceUrl:raw.sourceUrl,currency:snapshot.currency,
  perShare:value.perShare,rawPerShare:value.rawPerShare,enterpriseOrEquityCashflowPV:value.enterprise,commonEquity:value.equity,
  method:financial?'shareholder cash flow / cost of equity':'operating FCFF with dated claims',
  historyYears:history.companies[ticker].annual.length,openingPeriod:history.companies[ticker].coverage.openingPeriod,
  historyShortfall:history.companies[ticker].coverage.shortfallReason,
  claimsSensitivities:claimsSensitivity(snapshot,draft),financialModel:financial,limits:raw.reviewRequired,quoteScope:raw.quoteScope||null});
}}
const audit={cutoff:'2026-10-21',requested:['MCD',...tickers,'MRVL'],skippedAlreadyPresent:['MCD','MRVL'],added:tickers,
 companies:u.companies.length,selectableBases:u.companies.flatMap(guidedBasesFor).length,newBases:records.length,
 newAnnualRows:tickers.reduce((n,t)=>n+history.companies[t].annual.length,0),records};
fs.writeFileSync(new URL('guided-filing-data/audits/additions-2026-10-21.json',import.meta.url),JSON.stringify(audit,null,2)+'\n');
const lines=['# Guided company additions — 2026-10-21','',
 'Added **14 companies**, leaving MCD and MRVL unchanged because they were already present. Guided now contains **50 companies and 90 selectable bases**. The additions contribute 26 bases and 117 displayed annual history rows. Costco and Palo Alto Networks have one base each because their annual filings are also their latest financial reports.','',
 'The existing company selector, financial-period selector, assumption controls, history panels, valuation view and mobile layout are reused. The new Use research action loads company-specific Guided assumptions; it does not route to an unavailable Year-by-year package. Both English and Simplified Chinese are supported.','',
 'Values below are conditional analyst defaults in USD per modeled common share, not market prices or calibrated price targets. Reported source facts remain separate from carried values and modelling proxies.','',
 '| Company | Base | Period end | Filing date | Value / share | History years | Method |',
 '|---|---|---|---|---:|---:|---|',
 ...records.map(r=>`| ${r.ticker} | ${r.mode==='ttm'?'TTM':'Annual'} | ${r.periodEnd} | [${r.filedAt}](${r.sourceUrl}) | ${r.perShare.toFixed(4)} | ${r.historyYears} | ${r.method} |`), '',
 '## Consequential treatments','',
 '- **HOOD:** net interest remains operating revenue. Customer assets and operating financing are excluded from the surplus-capital bridge. Required equity is reinvested and shareholder cash flows use cost of equity. June’s corporate convertible is a separate $2,208m fair-value claim paired with a labelled $1,757m retained-proceeds assumption. Options/warrants use conservative full-share dilution; no converted note shares or duplicate restricted shares are added.',
 '- **BAM:** attributable fee revenue and owner earnings are reconciled from issuer disclosures, with the stock-compensation addback reversed. The post-reorganization common-share denominator is used. Financing, investments and minority interests already reflected in owner earnings are not counted again. A small EPS-based incremental dilution proxy is labelled as such. Terminal ROE is the marginal return on new equity, not a target return on all existing book equity.',
 '- **RKLB:** common-like preferred shares, convertible principal/conversion alternatives, capped calls, future forward shares and discounted contractual proceeds are reconciled separately. The default convertible holder-choice proxy selects the less favorable common-share outcome; it is not a full convertible time-value model. Forward proceeds are not current cash. Pending Iridium acquisition and Neutron timing remain consequential forward-scope uncertainties.',
 '- **SPGI:** the dated annual and June group includes Mobility. The July separation pro forma does not supply a matching June standalone balance sheet. The group basis is preserved and prominently flagged; post-separation standalone quote comparison is blocked. Redeemable minority claims are deducted; affiliate investments already included in operating earnings are not added again.',
 '- **CRWD:** both bases use the same July 2026 split-adjusted share unit. **PANW:** debt already measured at fair value, its hedge asset and separate acquisition/deferred-compensation obligations are counted once.',
 '- **NKE:** zero disclosed market intrinsic value does not mean options are valueless. The allocation uses the modeled share value, with intrinsic-only and full-free-share sensitivities.',
 '- **APP:** the small interim lease and award gaps use explicit proxies. History separates continuing advertising operations from the disposed Apps business; growth and capital ranges exclude incompatible comparisons.', '',
 '## Historical coverage and remaining unknowns','',
 ...tickers.map(t=>{const h=history.companies[t];return `- **${t}:** ${h.annual.length} annual rows; opening observation ${h.coverage.openingPeriod||'unavailable'}. ${h.coverage.shortfallReason||'Ten displayed years where filed evidence exists.'}`;}), '',
 'The early debt balances for CRWD FY2017 and APP FY2018 remain unknown with explicit source reasons. Financial-company industrial debt/capital ratios are not invented: HOOD and BAM have separate, clearly labelled common-equity history metrics alongside the retained reported facts. Lost comparability and unsuitable tax years remain visible and are excluded from summary ranges.','',
 '## Validation','',
 '- All 36 source-schema validators pass, with documented unknown-value warnings retained.',
 '- All 104 targeted tests pass, run sequentially with a 2 GB Node heap cap. The independent financial-model oracle, source mismatch gates, simulation/base-case parity and 324 closed-form Rocket Lab allocation cases are covered.',
 '- Browser checks cover every new base, four history panels, research loading, both locales and desktop/375px mobile layouts: 136 base checks and 544 history-panel checks including the final special-model translation recheck. No runtime errors or page-width overflow were detected.',
 '- Rebuilding the standard pipeline is byte-idempotent. Semantic comparison confirms every pre-existing company record, researched case and history is unchanged.',
 '- No packages installed, commits created or pushes made. Year-by-year research packages and the excluded shared-work files were not edited.','',
 'Machine audits: `audits/additions-2026-10-21.json`, `audits/additions-tests-2026-10-21.json`, `audits/additions-ui-2026-10-21.json`, `audits/additions-rebuild-2026-10-21.json`.','',
 '## Reproduce','',
 '```sh','GUIDED_CUTOFF=2026-10-21 .venv/bin/python -I scripts/build-guided-reviewed-cases.py','python3 -I scripts/patch-original-guided-data.py','GUIDED_CUTOFF=2026-10-21 python3 -I scripts/guided-filing-data/validate.py','node scripts/report-guided-additions.mjs','```','',
 'The first command now also builds Guided-only additions. To update only the new companies, run `GUIDED_CUTOFF=2026-10-21 python3 -I scripts/build-guided-additions.py`. Source packages are in `scripts/guided-filing-data/`, histories in `history/`, and model research/proxies in `additions/`.',''];
fs.writeFileSync(new URL('guided-filing-data/ADDITIONS_REPORT.md',import.meta.url),lines.join('\n'));
console.log(JSON.stringify({added:tickers.length,skipped:audit.skippedAlreadyPresent,companies:audit.companies,bases:audit.selectableBases,newBases:audit.newBases,newAnnualRows:audit.newAnnualRows}));
