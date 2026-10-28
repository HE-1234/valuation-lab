import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsSensitivity} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json'),history=read('../dist/data/company-history.json');
const source=read('./guided-filing-data/originals/META_Q3_UPDATE.json'),records=[];
function result(t,raw){const company=u.companies.find(c=>c.ticker===t),snapshot=currentSnapshot(company,raw),draft=draftFor(company,raw,{baseCases:cases});draft.cutoff='2026-10-21';const value=calculateCurrent(snapshot,draft);return {ticker:t,id:raw.id,periodEnd:raw.periodEnd,filedAt:raw.filedAt,sourceUrl:raw.sourceUrl,sourceForm:raw.sourceForm||raw.form,revenue:snapshot.revenue,reportedEBIT:snapshot.ebit,normalizationDelta:draft.normalizationDelta,modeledStartingEBIT:snapshot.ebit+draft.normalizationDelta,otherClaims:draft.assumptions.otherClaims,otherAssets:draft.assumptions.otherAssets,cash:snapshot.cash,debt:snapshot.debt,shares:snapshot.shares,valuePerShare:value.perShare,rawValuePerShare:value.rawPerShare,assumptions:draft.assumptions,limits:raw.reviewRequired,sensitivities:claimsSensitivity(snapshot,draft)};}
for(const t of ['META','SNOW']){const c=u.companies.find(c=>c.ticker===t);for(const raw of guidedBasesFor(c))records.push(result(t,raw));}
const meta=u.companies.find(c=>c.ticker==='META'),old=result('META',meta.snapshots.find(s=>s.id==='META-TTM-2026-06-30'));
const r=meta.snapshots.find(s=>s.id===meta.currentSnapshotId),snapshot=currentSnapshot(meta,r),draft=draftFor(meta,r,{baseCases:cases});draft.cutoff='2026-10-21';
const legalScenarios=source.legalSettlement.claimScenarios.map(reserve=>({reserve,perShare:calculateCurrent(snapshot,{...draft,assumptions:{...draft.assumptions,otherClaims:reserve}}).perShare}));
const audit={cutoff:'2026-10-21',companies:u.companies.length,selectableBases:u.companies.flatMap(guidedBasesFor).length,metaOldTTM:old,records,legalScenarios,source};
fs.writeFileSync(new URL('./guided-filing-data/audits/meta-snow-2026-10-21.json',import.meta.url),JSON.stringify(audit,null,2)+'\n');
const lines=['# Meta Q3 refresh and Snowflake addition — 2026-10-21','',
 'Meta now defaults to the **provisional TTM through September 30, 2026**, using the October 21 earnings release furnished with its 8-K. The user explicitly selected this provisional basis. The full September 10-Q was still unavailable in the final SEC submissions check. The last full annual base and older June evidence remain intact. Snowflake is added with its latest annual and July TTM bases.','',
 `Guided now has **${audit.companies} companies and ${audit.selectableBases} selectable bases**. The existing layout, controls and history panels are retained in English and Simplified Chinese. Meta’s Guided research action loads the refreshed Guided case; Year-by-year research packages are unchanged.`, '',
 '## Meta: one-time legal expense versus cash obligation','',
 '- The Q3 **$9.89bn charge** is an operating expense. The **up-to-$18.59bn agreement** is a different gross payment figure spread over time. Neither figure proves the September unpaid liability.',
 '- Reported Q3 EBIT stays $12.988bn; excluding only this charge gives $22.878bn. Reported TTM EBIT stays $79.380bn; the researched case adds back $9.890bn once, producing a $89.270bn starting EBIT. Other legal, severance, stock-compensation, AI and Reality Labs costs remain expenses.',
 '- The researched equity bridge separately deducts a **$9.890bn expense-anchored settlement-reserve proxy once**. It is explicitly an estimate, not a reported liability. $0 and $18.590bn reserve scenarios expose the uncertainty in timing, conditional payments, tax effects and amounts already paid. The latter is a gross-agreement stress, not a verified upper bound on the unpaid balance.',
 '- Restricted cash is excluded from surplus cash and is not used to offset the legal claim. June’s infrastructure escrow disclosure cannot be reclassified as settlement funding.', '',
 '| Additional settlement-reserve proxy, USDm | Conditional USD/share |', '|---:|---:|',
 ...legalScenarios.map(x=>`| ${x.reserve.toLocaleString('en-US')} | ${x.perShare.toFixed(4)} |`),'',
 'These scenarios hold all other current assumptions fixed. They are not probabilities, market prices or price targets.','',
 '## Meta: updated figures and explicit carry-forwards','',
 '- TTM revenue: $200.966bn + $181.712bn − $141.073bn = **$241.605bn**.',
 '- TTM reported EBIT: $83.276bn + $54.635bn − $58.531bn = **$79.380bn**.',
 '- September cash plus current marketable securities: **$82.449bn**. Nonmarketable equity investments: **$32.624bn**. Restricted cash: $13.132bn excluded.',
 '- September reported borrowings: **$80.922bn**. The separate lease-liability subtotal is missing; a labelled $1.184bn December 2025 carry produces **$82.106bn modeled debt**. Zero-to-double carried leases changes value by about $0.44/share in each direction; this is a stress, not a factual bound.',
 '- September actual common shares and unvested awards are not in the release. Source facts remain null. The model carries June’s 2,548m common shares plus 146.464m awards, totaling **2,694.464m shares**. Quarterly weighted-average EPS shares are not substituted.',
 '- The planned Class C stock dividend follows the January 19, 2027 charter effective date. September shares are not prematurely doubled and today’s per-share result is on the pre-distribution basis.',
 '- The 20% growth, 35% mature margin, 20% normalized tax, 0.5x incremental sales/capital, 10% WACC, 2.5% terminal growth and 12% terminal ROIC assumptions remain editable. Reasoning now reflects Q3 growth of 26%, Q4 revenue guidance of $73–76bn and the narrowed $135–145bn 2026 capex outlook.', '',
 '## Base values','',
 '| Company / base | Period end | Conditional USD/share |', '|---|---|---:|',
 `| META previous TTM | ${old.periodEnd} | ${old.valuePerShare.toFixed(4)} |`,
 ...records.map(x=>`| ${x.ticker} ${x.id.includes('TTM')?'TTM':'annual'} | [${x.periodEnd}](${x.sourceUrl}) | ${x.valuePerShare.toFixed(4)} |`),'',
 'Meta’s annual value is unchanged. Snowflake was absent before this request, so no prior values apply.','',
 '## Snowflake','',
 '- Annual FY2026 ends January 31, 2026; TTM ends July 31, 2026. Eight genuine annual history rows cover FY2019–FY2026, with a visible short-history explanation.',
 '- Two convertible series, capped-call assets, employee options and acquisition/leadership awards are reconciled. Carrying debt is replaced by principal or conversion consistently; market-value premiums and historical hedge costs are not deducted again.',
 '- Issued restricted acquisition common stock is already in actual shares and is not added twice. July’s extra 0.1m leadership award is explicitly modelled.',
 '- The 25% mature GAAP operating margin requires a substantial transition from reported operating losses. Ongoing stock compensation remains an expense. See [the source review](additions/SNOW_REVIEW.md) for detailed filing evidence and assumptions.', '',
 '## Verification','',
 '- **115 targeted tests passed**, run one file at a time with a 2 GB Node heap cap. They cover the legal-charge normalization, reserve arithmetic, retained source nulls, share basis, convertible allocation and simulation parity.',
 '- **41 source-schema validators passed**; Meta’s original-company refresh has separate source and arithmetic tests.',
 '- Desktop and 375px mobile checks passed in English and Simplified Chinese: **16 base/locale/viewport combinations and 64 history-panel checks**, with no runtime errors or page-width overflow.',
 '- Standard rebuild is byte-idempotent. All pre-existing companies except Meta have unchanged records and researched cases; every pre-existing annual history and all old Meta snapshots remain unchanged.',
 '- No packages installed, commits created or pushes made.','',
 'Audits: `audits/meta-snow-2026-10-21.json`, `audits/meta-snow-tests-2026-10-21.json`, `audits/meta-snow-ui-2026-10-21.json`, `audits/meta-snow-rebuild-2026-10-21.json`.','',
 '## Reproduce','', '```sh',
 'GUIDED_CUTOFF=2026-10-21 .venv/bin/python -I scripts/build-guided-reviewed-cases.py',
 'python3 -I scripts/patch-original-guided-data.py',
 'node scripts/report-meta-snow.mjs','```','',
 'The original-company patch invokes `apply-meta-latest.py` last. The dated release evidence and modelling choices live in `originals/META_Q3_UPDATE.json`.',''];
fs.writeFileSync(new URL('./guided-filing-data/META_SNOW_REFRESH_REPORT.md',import.meta.url),lines.join('\n'));
console.log(JSON.stringify({companies:audit.companies,bases:audit.selectableBases,oldMeta:old.valuePerShare,records:records.map(x=>({ticker:x.ticker,id:x.id,value:x.valuePerShare})),legalScenarios}));
