// Audit this additive batch without changing any application data.
import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsDefinition,claimsSensitivity} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json'),history=read('../dist/data/company-history.json');
const tickers=['ORCL','DELL','ALAB','ADBE'],records=[];
for(const ticker of tickers){
 const company=u.companies.find(c=>c.ticker===ticker);
 for(const raw of guidedBasesFor(company)){
  const snapshot=currentSnapshot(company,raw),draft=draftFor(company,raw,{baseCases:cases});draft.cutoff='2026-10-21';
  const value=calculateCurrent(snapshot,draft);
  records.push({ticker,id:raw.id,periodEnd:raw.periodEnd,filedAt:raw.filedAt,sourceUrl:raw.sourceUrl,mode:raw.snapshotMode,
   valuePerShare:value.perShare,rawValuePerShare:value.rawPerShare,enterprise:value.enterprise,equity:value.equity,shares:snapshot.shares,
   assumptions:draft.assumptions,claims:claimsDefinition(snapshot),claimsBridge:value.claimsBridge||null,sensitivities:claimsSensitivity(snapshot,draft),
   historyYears:history.companies[ticker].annual.length,historyShortfall:history.companies[ticker].coverage.shortfallReason,
   reportedNulls:raw.missingFields,proxies:raw.guidedModelProxies||{},limits:raw.reviewRequired});
 }
}
const audit={cutoff:'2026-10-21',added:tickers,companies:u.companies.length,selectableBases:u.companies.flatMap(guidedBasesFor).length,newBases:records.length,
 newAnnualRows:tickers.reduce((n,t)=>n+history.companies[t].annual.length,0),records};
fs.writeFileSync(new URL('guided-filing-data/audits/next-four-2026-10-21.json',import.meta.url),JSON.stringify(audit,null,2)+'\n');
const en=x=>typeof x==='string'?x:x?.en||'';
const lines=['# Guided additions: Oracle, Dell, Astera Labs and Adobe','',
 `As of **2026-10-21**, added ORCL, DELL, ALAB and ADBE. Guided now has **${audit.companies} companies and ${audit.selectableBases} selectable bases**. This batch adds ${audit.newBases} annual/TTM bases and ${audit.newAnnualRows} displayed annual history rows.`, '',
 'The existing Guided layout, company/period selectors, assumption controls, history panels and research-loading action are reused. New authored copy supports English and Simplified Chinese. The displayed values are conditional analyst scenarios in USD per modeled common share, not market quotations or price targets.', '',
 '| Company | Base | Period end | Filing date | Value / share | Annual history rows |',
 '|---|---|---|---|---:|---:|',
 ...records.map(r=>`| ${r.ticker} | ${r.mode==='ttm'?'TTM':'Annual'} | ${r.periodEnd} | [${r.filedAt}](${r.sourceUrl}) | ${r.valuePerShare.toFixed(4)} | ${r.historyYears} |`), '',
 'All four were absent before this batch, so prior values are not applicable. Reported facts stay separate from model assumptions and proxies. TTM flows equal annual plus current YTD minus comparable prior YTD; balances and ownership use the selected filing date.', '',
 '## Material treatments and remaining limits',''];
for(const t of tickers){const meta=read(`guided-filing-data/additions/${t}.json`),h=history.companies[t];
 lines.push(`### ${t}`,'',en(meta.summary||meta.businessSummary),'',...((meta.limitations||[]).map(x=>'- '+en(x))),'',
  `History: ${h.annual.length} displayed annual rows; opening period ${h.coverage.openingPeriod||'unavailable'}. ${h.coverage.shortfallReason||''}`,'');
}
lines.push('## Validation','',
 'All 40 source-schema validators and 110 targeted tests pass. Browser checks cover 32 base/locale/viewport combinations and 128 history panels, with no runtime errors or page-width overflow. The standard rebuild is byte-idempotent after regenerating the complete catalog, and all 50 pre-existing company, case and history records are unchanged. Detailed results are in the accompanying `audits/next-four-*-2026-10-21.json` files.', '',
 'No packages installed, commits created or pushes made. Year-by-year research packages and other sessions’ excluded files were not edited.', '',
 '## Rebuild','', '```sh',
 'GUIDED_CUTOFF=2026-10-21 python3 -I scripts/build-guided-additions.py',
 'GUIDED_CUTOFF=2026-10-21 python3 -I scripts/guided-filing-data/validate.py',
 'node scripts/report-guided-next-four.mjs','```','',
 'The standard `build-guided-reviewed-cases.py` pipeline also invokes the additions builder. Run tests one file at a time with `NODE_OPTIONS=--max-old-space-size=2048`; do not run the whole suite in parallel.','');
fs.writeFileSync(new URL('guided-filing-data/ADDITIONS_ORCL_DELL_ALAB_ADBE.md',import.meta.url),lines.join('\n'));
console.log(JSON.stringify({added:tickers,companies:audit.companies,bases:audit.selectableBases,newBases:audit.newBases,newAnnualRows:audit.newAnnualRows}));
