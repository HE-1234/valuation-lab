/** Present sourced observations without changing evidence, inputs or valuation. */
import {formatEvidenceValue} from './assumption-history.js';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=s=>/^https?:\/\//.test(s||'')?s:null;
const period=p=>p.period||p.periodEnd||'Undated';
const stamp=p=>Date.parse(p.periodEnd||'');
const value=(p,unit)=>esc(formatEvidenceValue(p.value,unit));
function sourceValue(p,unit){const href=url(p.sourceUrl||p.sourceURL);return href?`<a href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(period(p))}: ${value(p,unit)}; open original source">${value(p,unit)} <span aria-hidden="true">↗</span></a>`:value(p,unit);}
/** Actual dates position the points; missing periods and comparability changes break the path. */
export function historyTrend(series){
 const dated=series.filter(p=>finite(stamp(p))),known=dated.filter(p=>finite(p.value));
 if(known.length<2)return '<p class="history-no-trend">'+(known.length?'One available observation; no trend.':'Comparable annual values unavailable.')+'</p>';
 const start=Math.min(...dated.map(stamp)),end=Math.max(...dated.map(stamp));
 const low=Math.min(...known.map(p=>p.value)),high=Math.max(...known.map(p=>p.value)),spread=high-low||Math.max(Math.abs(high)*.1,1);
 const x=p=>8+(stamp(p)-start)/(end-start||1)*264,y=p=>48-(p.value-low)/spread*36;
 const paths=[];let run=[];
 const flush=()=>{if(run.length>1)paths.push(`<path fill="none" stroke="currentColor" d="${run.map((p,i)=>`${i?'L':'M'}${x(p).toFixed(2)},${y(p).toFixed(2)}`).join(' ')}"/>`);run=[];};
 let previous=null,hasBreak=false;
 for(const p of dated){
  const days=previous?(stamp(p)-stamp(previous))/864e5:0;
  const broken=previous&&(days<330||days>380||(p.comparabilityNote||'')!==(previous.comparabilityNote||''));
  if(!finite(p.value)||broken){flush();hasBreak=true;}
  if(finite(p.value))run.push(p);
  previous=p;
 }
 flush();
 return `<div class="history-trend"><svg viewBox="0 0 280 60" aria-hidden="true" focusable="false"><g class="history-trend-line">${paths.join('')}</g><g class="history-trend-dots">${known.map(p=>`<circle cx="${x(p).toFixed(2)}" cy="${y(p).toFixed(2)}" r="2.8"/>`).join('')}</g></svg><div class="history-trend-labels"><span>${esc(period(dated[0]))}</span><span>${hasBreak?'Gaps / basis changes':'Annual trend'}</span><span>${esc(period(dated.at(-1)))}</span></div></div>`;
}
export function renderHistorySeries(series=[],unit='percent',title='Annual history'){
 if(!series.length)return '';
 const latest=series.at(-1),available=series.filter(p=>finite(p.value)).length;
 return `<div class="history-series" data-observations="${series.length}"><div class="history-overview"><div class="history-latest"><span>Latest · ${esc(period(latest))}</span><b class="${finite(latest.value)?'':'is-unavailable'}">${sourceValue(latest,unit)}</b>${!['percent','multiple','x','rate','%'].includes(unit)?`<small>${esc(unit)}</small>`:''}</div>${historyTrend(series)}</div><details class="history-years"><summary><span>All ${series.length} annual observations</span><span class="history-count">${available} available</span></summary><table><caption>${esc(title)}${unit&&!['percent','multiple','x','rate','%'].includes(unit)?' · '+esc(unit):''}. Values link to their sources.</caption><thead><tr><th scope="col">Fiscal year</th><th scope="col">Observed value</th></tr></thead><tbody>${series.map(p=>`<tr class="${finite(p.value)?'':'is-unavailable'}"><th scope="row">${esc(period(p))}<small>Ended ${esc(p.periodEnd||'unknown date')}</small></th><td>${sourceValue(p,unit)}</td></tr>${p.comparabilityNote||!finite(p.value)||p.rangeEligible===false?`<tr class="history-row-note"><td colspan="2">${esc([p.comparabilityNote,!finite(p.value)?p.detail||'No verified comparable observation.':p.rangeEligible===false?p.detail||'Excluded from the historical range.':null].filter(Boolean).join(' '))}</td></tr>`:''}`).join('')}</tbody></table></details></div>`;
}
export function renderHistoryCoverage(coverage){
 if(!coverage)return '';
 const label=coverage.label||`${coverage.annualYears||0} annual periods`;
 return `<div class="history-coverage"><p>${esc(label)}</p>${coverage.shortfallReason?`<p class="history-coverage-note">${esc(coverage.shortfallReason)}</p>`:''}${coverage.comparabilityNote?`<p class="history-coverage-note">${esc(coverage.comparabilityNote)}</p>`:''}</div>`;
}
