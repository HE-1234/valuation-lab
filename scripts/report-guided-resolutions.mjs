import fs from 'node:fs';
import {currentSnapshot,draftFor,calculateCurrent,claimsSensitivity} from '../dist/current-model.js';
import {guidedBasesFor} from '../dist/guided-bases.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const u=read('../dist/data/current-universe.json'),cases=read('../dist/data/company-base-cases.json');
const rows=[];
for(const c of u.companies.filter(c=>['AAPL','META','ASML','TSLA','NBIS'].includes(c.ticker)))for(const r of guidedBasesFor(c)){
 const s=currentSnapshot(c,r),d=draftFor(c,r,{baseCases:cases});d.cutoff='2026-10-21';
 const v=calculateCurrent(s,d);let running=0,low=0;for(const row of v.rows){running+=row.fcff;low=Math.min(low,running);}
 const p=r.guidedDebtProxy;
 rows.push({ticker:c.ticker,id:r.id,periodEnd:r.periodEnd,currency:s.currency,perShare:v.perShare,rawPerShare:v.rawPerShare,enterprise:v.enterprise,equity:v.equity,
  modelLabel:c.ticker==='NBIS'?'Conditional funding stress; not validated fair value':'Conditional Guided case',
  ...(p?{debtProxy:p.modelDebt,reportedDebt:r.facts.debt,debtStress:p.sensitivity,largestTestedDebtEffectPercent:Math.max(Math.abs(p.sensitivity.lowDebtPerShareChange),Math.abs(p.sensitivity.highDebtPerShareChange))/v.perShare*100}:{}),
  ...(v.claimsBridge?{claimsBridge:v.claimsBridge,claimsSensitivities:claimsSensitivity(s,d)}:{}),
  ...(c.ticker==='NBIS'?{peakCumulativeOperatingCashDeficit:-low,deficitBeyondDatedCash:Math.max(0,-low-s.cash),positiveEquityReserveStresses:[10000,30000,60000].map(e=>({hypotheticalEquity:e,reserve100Percent:100/e*100,reserve1000Percent:1000/e*100})),limitations:'Zero equity does not prove claims immaterial. Full capex, replacement, net customer advance and financing scenarios remain consequential.'}:{})});
}
fs.writeFileSync(new URL('guided-filing-data/audits/resolution-2026-10-21.json',import.meta.url),JSON.stringify({cutoff:'2026-10-21',classification:'Explicit proxy and ownership resolution; original unknown facts retained',rows},null,2)+'\n');
console.log(rows.map(r=>`${r.id}: ${r.perShare.toFixed(4)} ${r.currency}; raw ${r.rawPerShare.toFixed(4)}`).join('\n'));
