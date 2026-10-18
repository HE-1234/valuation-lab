import {incrementalRecord} from './incremental-research-registry.js';
import {annualTextHTML} from './annual-localization.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener">${annualTextHTML(label)} ↗</a>`;
const n=x=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString('en-US',{maximumFractionDigits:3}):'—';
export function incrementalEvidencePath(c,section=''){return c?.incrementalResearch?c.incrementalResearch.reportPath+(section?'#'+section:''):null;}
export function incrementalScopeHTML(c){const r=incrementalRecord(c?.ticker);return r?`<p class="annual-summary-caveat incremental-dated-scope">${annualTextHTML(r.prose.scope.en)}</p>`:'';}
export function incrementalEvidenceHTML(c,key='sources',{id=key!=='sources'}={}){
 const r=incrementalRecord(c?.ticker);if(!r)return '';
 const keys={growth:['growth'],profitability:['profitability','tax'],capital:['capital','wacc'],terminal:['terminal'],history:['history'],claims:['claims','claimLimits'],sources:['summary','scope','growth','profitability','capital','wacc','tax','terminal','claims','claimLimits','uncertainty','history']}[key]||['scope'];
 const history=key==='history'?`<div class="research-table-scroll"><table class="research-table"><caption>${annualTextHTML('Canonical operating history')} · USDm</caption><thead><tr>${['Fiscal year','Revenue','Canonical EBIT','Operating margin'].map(x=>`<th>${annualTextHTML(x)}</th>`).join('')}</tr></thead><tbody>${r.history.map(x=>`<tr><th>${esc(x.fiscalEnd)}</th><td>${n(x.revenue)}</td><td>${n(x.canonicalOperatingEBIT)}</td><td>${n(x.operatingMargin*100)}%</td></tr>`).join('')}</tbody></table></div>`:'';
 return `<section${id?` id="annual-evidence-${esc(key)}"`:``}><h2>${esc(c.ticker)} · ${annualTextHTML(key==='history'?'Canonical operating history':'Reviewed incremental research')}</h2>${keys.map(k=>`<p>${annualTextHTML(r.prose[k].en)}</p>`).join('')}${history}<p>${link(r.identity.reportPath,'Company-specific evidence report')} · ${link(r.identity.sourcePath,'Research source JSON')} · ${link(r.identity.auditPath,'Independent calculation audit')}</p>${key==='sources'?`<details><summary>${annualTextHTML('Source and audit identity')}</summary><p>${esc(r.identity.version)}<br>SHA-256 ${esc(r.identity.sourceSHA256)}</p><ul>${r.sources.filter(s=>s.url).map(s=>`<li>${link(s.url,s.id)} · ${esc(s.publication_date||'')} · ${esc(s.retrieved||'')}</li>`).join('')}</ul></details>`:''}</section>`;
}
export function incrementalPresetHTML(d){
 const r=incrementalRecord(d?.ticker);if(!r)return '';
 return `<section class="research-preset-context"><h2>${annualTextHTML('Reviewed incremental research')} · ${esc(d.ticker)}</h2><p>${esc(r.identity.version)}</p>${incrementalScopeHTML(d)}<p>${annualTextHTML(r.prose.summary.en)}</p><p>${annualTextHTML(r.prose.uncertainty.en)}</p><button class="quiet" data-research-action="incremental-downside">${annualTextHTML('Load reviewed downside')}</button><p>${annualTextHTML('No assigned scenario probability')}</p>${incrementalEvidenceHTML(d,'sources')}</section>`;
}
