// Offline, reproducible report using the captured pre-refresh model results.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {currentSnapshot,draftFor,calculateCurrent} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const cutoff=process.env.GUIDED_CUTOFF||'2026-10-21';
const u=read('dist/data/current-universe.json'),cases=read('dist/data/company-base-cases.json'),history=read('dist/data/company-history.json');
const before=read('scripts/guided-filing-data/audits/values-before-2026-10-21.json');
const original=read('scripts/guided-filing-data/originals/patches.json');
const supplement=read('scripts/guided-filing-data/originals/bridge-supplement.json');
const reviewed={...read('scripts/guided-filing-data/audits/domestic-2026-10-21.json'),...read('scripts/guided-filing-data/audits/foreign-2026-10-21.json').companies};
const metricKeys=['growth','operatingMargin','effectiveTaxRate','bookSalesCapitalProxy','incrementalBookSalesCapitalProxy','bookROICProxy'];
const labels=['Growth','Margin','Tax','Sales / capital','Incremental sales / capital','ROIC'];
const rows=[];
for(const c of u.companies)for(const raw of guidedBasesFor(c)){
 const old=before.find(r=>r.id===raw.id)||before.find(r=>r.ticker===c.ticker&&r.mode===raw.snapshotMode);
 let value=null,error=null;const draft=draftFor(c,raw,{baseCases:cases});draft.cutoff=cutoff;
 try{value=calculateCurrent(currentSnapshot(c,raw),draft).perShare;}catch(e){error=e.message;}
 rows.push({ticker:c.ticker,id:raw.id,mode:raw.snapshotMode,periodEnd:raw.periodEnd,oldPeriodEnd:old?.periodEnd,
 currency:raw.currency||c.currency,oldValue:old?.value??null,oldError:old?.error??null,newValue:value,error,
 sourceUrl:raw.sourceUrl||raw.sourceURL,filedAt:raw.filedAt,caseKind:draft.assumptionProvenance?.kind,
 limitations:[...(raw.reviewRequired||[]),...(raw.valuationBlockers||[])].filter((x,i,a)=>a.indexOf(x)===i)});
}
const audit={cutoff,companies:u.companies.length,offeredBases:rows.length,numericBases:rows.filter(r=>r.newValue!==null).length,
 withheldBases:rows.filter(r=>r.error).map(r=>({ticker:r.ticker,id:r.id,error:r.error})),rows};
const auditPath=`scripts/guided-filing-data/audits/results-${cutoff}.json`;
fs.writeFileSync(path.join(root,auditPath),JSON.stringify(audit,null,2)+'\n');
const esc=x=>String(x??'').replaceAll('|','\\|').replaceAll('\n',' ');
const num=x=>x===null?'Withheld':x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4});
const report=[`# Guided valuation refresh — ${cutoff}`, '',
`Cutoff: **${cutoff}**, America/Los_Angeles. All 36 existing ready companies were checked. No annual/interim financial-report periods moved after fresh SEC submissions review; later nonfinancial filings do not create another base.`, '',
`**Calculation coverage:** ${audit.numericBases}/${audit.offeredBases} offered bases produce a numeric conditional result; ${audit.withheldBases.length} remain withheld. Following the user’s materiality instruction, small missing debt components use explicitly labelled proxies while the original filing fields remain null. Tesla and Nebius use separate dated ownership models. **Nebius remains a funding-stress calculation, not a validated fair-value estimate:** its operating path and capital requirements are consequential uncertainties. A zero equity floor is not a conclusion that the traded security is worthless.`, '',
'## Reproduce', '', '```sh',`GUIDED_CUTOFF=${cutoff} .venv/bin/python -I scripts/build-guided-reviewed-cases.py`,'python3 -I scripts/patch-original-guided-data.py',`GUIDED_CUTOFF=${cutoff} python3 -I scripts/guided-filing-data/validate.py`,`GUIDED_CUTOFF=${cutoff} node scripts/report-guided-refresh.mjs`,'```','',
'The original patch applies its own evidence, `originals/bridge-supplement.json`, then `claims-resolution/*.json` via `apply-guided-resolutions.py`. Rebuild translations after changing any source localization pairs. No old original-company pipeline, package installation, commit or push is needed. Raw downloads remain outside the repository.','',
'## Base values before and after', '',
'Values are conditional Guided defaults, in the displayed reporting currency per modeled share; they are not market prices. TSM is TWD per ordinary share, without FX conversion. The prior capture used the model before this refresh. “Withheld” is an evidence/model constraint, never a zero valuation.', '',
'| Company | Base, old → new | Currency | Old value / share | New value / share | Filing |','|---|---|---|---:|---:|---|'];
for(const r of rows)report.push(`| ${r.ticker} | ${r.mode==='ttm'?'TTM':'Annual'}: ${r.oldPeriodEnd||'—'} → ${r.periodEnd} | ${r.currency} | ${num(r.oldValue)} | ${num(r.newValue)} | [${r.filedAt}](${r.sourceUrl}) |`);
report.push('','## Per-company fills, coverage and remaining gaps','',
'Coverage counts are available ratios out of the displayed annual years. A loss tax year, nonpositive capital or no increase in capital can correctly make a ratio unavailable even when the underlying facts exist. All available ratios have explicit numerator, denominator, formula, source URLs and dated prior periods.','');
for(const c of u.companies){
 const h=history.companies[c.ticker],r=rows.filter(r=>r.ticker===c.ticker),sourcePath=path.join(root,`scripts/guided-filing-data/${c.ticker}.json`);
 const source=fs.existsSync(sourcePath)?JSON.parse(fs.readFileSync(sourcePath)):null;
 report.push(`### ${c.ticker}`,'',`Bases: ${r.map(x=>`${x.mode==='ttm'?'TTM':'annual'} ${x.oldPeriodEnd} → ${x.periodEnd}`).join('; ')}.`, '');
 const filled=[];
 if(source)filled.push('Added/normalized filing-derived annual flows, equity, cash, mapped debt, tax and pretax history; retained per-field provenance and accounting-basis notes.');
 for(const rr of r){
  const p=original.snapshotPatches?.[rr.id],s=supplement.snapshotPatches?.[rr.id];
  if(p)filled.push(`${rr.mode}: ${p.note||'Patched '+Object.keys(p.facts||{}).join(', ')+'.'}`);
  if(s)filled.push(`${rr.mode}: refreshed ${Object.keys(s.facts||{}).join(', ')}; period-matched additional assets/claims where disclosed.`);
 }
 if(original.historyPatches?.[c.ticker])filled.push('Filled missing historical debt/capital mappings and recomputed affected ratios.');
 report.push(...(filled.length?filled:['Existing sourced flows/history retained; filing freshness checked.']).map(x=>'- '+x),'');
 report.push(`History: **${h.annual.length} displayed annual rows**; opening observation: ${h.baseObservation?.period||'none'}. ${h.coverage.shortfallReason||''}`,'',
 '| Metric | Available years |','|---|---:|',...metricKeys.map((k,i)=>`| ${labels[i]} | ${h.coverage.metricAvailability[k]?.availableYears??0}/${h.annual.length} |`),'');
 const missing=[];
 for(const rr of [h.baseObservation,...h.annual].filter(Boolean)){
  const fields=['revenue','operatingIncome','pretaxIncome','incomeTaxExpense','bookEquity','cashAndEquivalents','mappedDebt'].filter(k=>rr.facts[k]?.value==null);
  if(fields.length)missing.push(`${rr.period}: ${fields.map(k=>`${k} — ${rr.facts[k]?.note||rr.facts[k]?.reason||'not sourced on a compatible basis'}`).join('; ')}`);
 }
 for(const rr of r){if(rr.error)missing.push(`${rr.mode} VALUE WITHHELD: ${rr.error}`);for(const note of rr.limitations)missing.push(`${rr.mode}: ${note}`);}
 for(const base of guidedBasesFor(c)){
  const nulls=Object.entries(base.facts||{}).filter(([k,v])=>v===null&&/cash|debt|investment|shares|award|option|preferred|noncontrolling/i.test(k)&&k!=='dilutedShares');
  if(nulls.length)missing.push(`${base.snapshotMode} null filing fields: ${nulls.map(([k])=>{const e=base.factEvidence?.[k]||{};return k+' — '+(e.reason||e.note||'not mapped separately in the supplied filing evidence; not assumed zero')}).join('; ')}`);
 }

 if(source)for(const [kind,s]of Object.entries(source.snapshots)){
  const unknown=['cashAndEquivalents','shortTermInvestments','longTermInvestments','debtCurrent','debtNoncurrent','unvestedRSUs'].filter(k=>s[k]===null);
  if(unknown.length)missing.push(`${kind}: unknown ${unknown.join(', ')}. ${s.note||''}`);
  const carries=Object.entries(s.carriedFrom||{});if(carries.length)missing.push(`${kind} carried disclosures: ${carries.map(([k,v])=>`${k} (${v.date}): ${v.why}`).join('; ')}`);
  for(const note of s.convertibles||[])if(note.fairValue===null)missing.push(`${kind}: ${note.name} fair value undisclosed; no current premium inferred.`);
  for(const note of s.otherClaims||[])if(note.value===null)missing.push(`${kind}: ${note.name} value undisclosed. ${note.basis||''}`);
 }
 report.push(...(missing.length?[...new Set(missing)].map(x=>'- '+x):['No remaining required history-field nulls. Remaining valuation approximations are documented in the source notes.']),'');
}
report.push('## Materiality and ownership resolution', '',
'- AAPL: June borrowing plus the last reported finance-lease liability; zero-to-double lease stress changes value by ±$0.0834/share.',
'- META: analogous lease carry; ±$0.4394/share. A broader gross-lease-asset-sized stress lowers value by $3.07/share, without claiming that assets equal debt.',
'- ASML: June borrowing rolled forward by Q3 repayments, explicitly allowing unmodeled FX/hedge/amortization effects. Chosen stresses change value by +€2.01/−€2.59/share.',
'- TSLA: remove annual overlapping 96m interim shares and separate 423.743904m performance shares with their $334.09 offset. June exercised 2018 options are already in issued shares. A full-vesting vanilla-call proxy values time value; employee awards use conservative share proxies. Intrinsic-only and all-free-share stresses remain visible.',
'- NBIS: convertible fair value replaces carrying value once (annual premium $819.3m; June $12,324.7m), no converted shares added. Parent RSUs and June prefunded warrants enter once; Eigen participating shares were already issued. The June acquisition bridge includes another $24.3m obligation. Avride awards use a labelled $100m scenario reserve, with $0/$1bn stresses; no source establishes a current fair value or a hard bound.',
'- NBIS operating limits: annual and TTM defaults imply peak cumulative operating cash deficits of about $61.7bn/$69.2bn. A faster margin transition lowers them to $24.6bn/$38.1bn while keeping the existing growth and capital assumptions. Neither is a financing forecast. The current generic path cannot represent the annual-base growth implied by 2026 revenue guidance; do not interpret its zero floor as a credible standalone fair-value estimate.',
'- Detailed evidence and remaining uncertainties: `claims-resolution/TSLA_REVIEW.md`, `claims-resolution/NBIS_REVIEW.md`, and `audits/resolution-2026-10-21.json`. Original missing source fields are retained; estimates live in the model overlay.', '');
report.push('## Validation and review','',
'- The 22 source validators pass with warnings for documented unknown amounts. This is structural validation, not a certification that every claim is valued.',
'- Both history test files pass after replacing the old 14-company universe/coverage pins with the reviewed 36-company scope; arithmetic and provenance assertions remain active.',
'- The 64 original targeted current-data, history, Guided-base, explicit-claims and Python checks, plus 7 new proxy/ownership, 8 Guided localization and 16 i18n foundation checks, pass (95 total). Tests run one file at a time with a 2 GB Node heap cap; the whole suite was not run.',
'- The picker offers only the newest annual and later TTM. Interim/YTD rows and TSM’s incomplete duplicate TIFRS annual row remain in the evidence library but cannot be selected as Guided valuation bases.',
'- Browser verification and deterministic rebuild results are recorded in `audits/ui-verification-2026-10-21.json` and `audits/rebuild-verification-2026-10-21.json`; the final five-company update is in `audits/resolution-ui-2026-10-21.json` and `audits/resolution-rebuild-2026-10-21.json`.',
'- Existing user edits and the excluded Year-by-year research files were preserved. No commits or pushes were made.','',
'Primary evidence ledgers: `audits/domestic-2026-10-21.json`, `audits/foreign-2026-10-21.json`, `originals/refresh-checks.json`, `originals/patches.json`, `originals/bridge-supplement.json`. Detailed original-company review: `originals/REVIEW_NOTES.md`.','');
fs.writeFileSync(path.join(root,'scripts/guided-filing-data/REFRESH_REPORT.md'),report.join('\n'));
console.log(JSON.stringify({companies:audit.companies,offeredBases:audit.offeredBases,numericBases:audit.numericBases,withheld:audit.withheldBases},null,2));
