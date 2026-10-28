import {mcdAllocationHTML,mcdHistoryHTML,MCD_MESSAGES} from './mcd-research-view.js';
import {uberAllocationHTML,uberHistoryHTML} from './uber-research-view.js';
import {nflxAllocationHTML,nflxHistoryHTML} from './nflx-research-view.js';
import {umcAllocationHTML} from './umc-research-view.js';
import {CEVA_MESSAGES,cevaAllocationHTML,cevaHistoryHTML} from './ceva-research-view.js';
import {rmbsAllocationHTML} from './rmbs-research-view.js';
import {keysAllocationHTML} from './keys-research-view.js';
import {sndkAllocationHTML} from './sndk-research-view.js';
import {displayNumber} from './number-display.js';
import {snpsAllocationHTML} from './snps-research-view.js';
import {cdnsAllocationHTML} from './cdns-research-view.js';
import {incrementalRecord} from './incremental-registry.js';
import {annualTextHTML} from './annual-localization.js';
import {latestQuarterEvidenceHTML} from './latest-quarter-evidence.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener">${annualTextHTML(label)} ↗</a>`;
const n=(value,digits=2)=>displayNumber(value,digits);
export function incrementalEvidencePath(c,section=''){return c?.incrementalResearch?c.incrementalResearch.reportPath+(section?'#'+section:''):null;}
export function incrementalScopeHTML(c){const r=incrementalRecord(c?.ticker);return r?`<p class="annual-summary-caveat incremental-dated-scope">${annualTextHTML(r.prose.scope.en)}</p>`:'';}
export function incrementalEvidenceHTML(c,key='sources',{id=key!=='sources'}={}){
 const r=incrementalRecord(c?.ticker);if(!r)return '';
 const keys={growth:['growth'],profitability:['profitability','tax'],capital:['capital','funding','wacc'],terminal:['terminal'],history:['history'],claims:['claims','financing','awards','claimLimits'],sources:['summary','scope','growth','profitability','capital','wacc','tax','terminal','claims','financing','awards','claimLimits','uncertainty','history']}[key]||['scope'];
 const components=key==='capital'&&r.investmentComponents?`<div class="research-table-scroll"><table class="research-table"><caption>${annualTextHTML('Reviewed investment components')} · ${esc(r.identity.currency)}m</caption><thead><tr>${['Fiscal year','PPE and intangible capex','Operating D&A','Incremental working capital','Net supplier funding','Component sum','Selected net investment'].map(x=>`<th>${annualTextHTML(x)}</th>`).join('')}</tr></thead><tbody>${r.investmentComponents.map((row,i)=>`<tr>${[row.fiscalYear,row.capitalExpenditureIncludingIntangibles??row.capitalExpenditurePPE+row.capitalExpenditureIntangibles,row.depreciationAmortization,row.incrementalNoncashWorkingCapital,row.netStrategicSupplierFunding,row.reinvestment,r.annualCase.annual[i].reinvestment].map(v=>`<td>${n(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>${annualTextHTML('Final-three-year capital adjustments are analyst transitions toward terminal ROIC; they are not reported capital expenditure.')}</p>`:'';
 const history=key==='history'&&c.ticker==='NFLX'?nflxHistoryHTML(c,'history'):key==='history'&&c.ticker==='UBER'?uberHistoryHTML(c,'history'):key==='history'&&c.ticker==='MCD'?['growth','profitability','capital'].map(key=>mcdHistoryHTML(c,key)).join(''):key==='history'&&c.ticker==='CEVA'?cevaHistoryHTML(r):key==='history'?`<div class="research-table-scroll"><table class="research-table"><caption>${annualTextHTML('Canonical operating history')} · ${esc(r.identity.currency)}m</caption><thead><tr>${['Fiscal year','Revenue','Canonical EBIT','Operating margin'].map(x=>`<th>${annualTextHTML(x)}</th>`).join('')}</tr></thead><tbody>${r.history.map(x=>`<tr><th>${esc(x.fiscalEnd??x.period??x.fiscalYear)}${c.ticker==='CEVA'?'<br>'+annualTextHTML(x.basisLabel||''):c.ticker==='KEYS'?'<br>'+annualTextHTML(x.basisLabel||''):c.ticker==='ARM'?'<br>'+annualTextHTML(x.basisLabel||''):c.ticker==='SNDK'?'<br>'+annualTextHTML(x.basisLabel||''):''}</th><td>${n(x.revenue)}</td><td>${n(x.canonicalOperatingEBIT)}</td><td>${Number.isFinite(x.operatingMargin)?n(x.operatingMargin*100)+'%':'—'}</td></tr>`).join('')}</tbody></table></div>`:'';
 return `<section${id?` id="annual-evidence-${esc(key)}"`:``}><h2>${esc(c.ticker)} · ${annualTextHTML(key==='history'?(c.ticker==='MCD'?MCD_MESSAGES.reportedHistory[0]:'Canonical operating history'):'Reviewed incremental research')}</h2>${keys.filter(k=>r.prose[k]).map(k=>`<p>${annualTextHTML(r.prose[k].en)}</p>`).join('')}${key==='sources'?latestQuarterEvidenceHTML(c):''}${history}${components}<p>${link(r.identity.reportPath,'Company-specific evidence report')} · ${link(r.identity.sourcePath,'Research source JSON')} · ${link(r.identity.auditPath,'Independent calculation audit')}${r.identity.fullReportPath?' · '+link(r.identity.fullReportPath,'Complete research report'):''}</p>${key==='sources'?`<details><summary>${annualTextHTML('Source and audit identity')}</summary><p>${esc(r.identity.version)}<br>SHA-256 ${esc(r.identity.sourceSHA256)}</p><ul>${r.sources.filter(s=>s.url).map(s=>`<li>${link(s.url,s.id)} · ${esc(s.publication_date||'')} · ${esc(s.retrieved||'')}</li>`).join('')}</ul></details>`:''}</section>`;
}
export function incrementalPresetHTML(d){
 const r=incrementalRecord(d?.ticker);if(!r)return '';
 return `<section class="research-preset-context"><h2>${annualTextHTML('Reviewed incremental research')} · ${esc(d.ticker)}</h2><p>${esc(r.identity.version)}</p>${incrementalScopeHTML(d)}<p>${annualTextHTML(r.prose.summary.en)}</p><p>${annualTextHTML(r.prose.uncertainty.en)}</p>${incrementalAlternativeButtons(d)}<p>${annualTextHTML('No assigned scenario probability')}</p>${incrementalEvidenceHTML(d,'sources')}</section>`;
}

export function incrementalScenarioLabel(d){const r=incrementalRecord(d?.ticker),a=r?.alternatives.find(x=>x.name===d.selectedIncrementalScenario);return a?.label||(a?.name==='cycle-and-export-downside'?'Cycle and export downside':'Reviewed annual case');}
export function incrementalAlternativeButtons(c){const r=incrementalRecord(c?.ticker);if(!r)return '';return r.alternatives.map(a=>`<button class="quiet" data-research-action="${c.ticker==='KLAC'?'incremental-downside':'incremental-alternative'}" data-incremental-scenario="${esc(a.name)}">${annualTextHTML(c.ticker==='KLAC'?'Load reviewed downside':a.buttonLabel||(a.name==='downcycle'?'Load reviewed downcycle':'Load reviewed upside'))}</button>`).join('');}

export function incrementalFundingHTML(c){if(c?.ticker==='CEVA')return `<p class="research-warning incremental-fixed-funding">${annualTextHTML(CEVA_MESSAGES.funding[0])}</p>`;const p=incrementalRecord(c?.ticker)?.prose.funding;return p?`<p class="research-warning incremental-fixed-funding">${annualTextHTML(p.en)}</p>`:'';}

export function incrementalQuoteTranslationHTML(bridge){
 const fx=bridge?.historicalQuoteTranslation;if(!fx||!Number.isFinite(fx.perShare))return '';
 return `<p class="annual-summary-caveat incremental-historical-fx"><b>${fx.perShare.toLocaleString('en-US',{maximumFractionDigits:2})} USD / ${annualTextHTML('registered ordinary share')}</b><br>${annualTextHTML('Historical FX illustration only')} · ${esc(fx.date)} · 1 EUR = ${n(fx.rate)} USD<br>${annualTextHTML('Not a current USD valuation or quote comparison.')}</p>`;
}

export function incrementalAllocationHTML(b,{compact=false}={}){
 if(b?.ticker==='CEVA')return cevaAllocationHTML(b,{compact});
 if(b?.ticker==='MCD')return mcdAllocationHTML(b);
 if(b?.ticker==='UBER')return uberAllocationHTML(b);
 if(b?.ticker==='NFLX')return nflxAllocationHTML(b);
 if(b?.ticker==='UMC')return umcAllocationHTML(b);
 if(b?.ticker==='RMBS')return rmbsAllocationHTML(b);
 if(b?.ticker==='KEYS')return keysAllocationHTML(b,{compact});
 if(b?.claimAllocationModel==='sndk-conditional-v3')return sndkAllocationHTML(b);
 if(b?.claimAllocationModel==='crdo-conditional-v3'&&b.eligible)return `<p class="annual-summary-caveat incremental-coupled-allocation">${annualTextHTML('Dated conditional October common allocation; estimated interim balances')}<br>${annualTextHTML('Estimated October cash and investments')}: ${n(b.assetTotal)} USDm · ${annualTextHTML('Estimated ordinary shares')}: ${n(b.basicShares)}m<br>${annualTextHTML('Assumed RSU settlement price')}: ${n(b.inputs.rsuSettlementPrice)} USD · ${annualTextHTML('Minimum modeled liquidity after claim reserve')}: ${n(b.minimumModeledLiquidity)} USDm<br>${annualTextHTML('August reported balances and October estimates are distinct. Annual/stub liquidity is not intra-quarter solvency; no live quote or backtest is implied.')}</p>`;

 if(b?.claimAllocationModel==='snps-conditional-full-participation-v3')return snpsAllocationHTML(b,{compact});
 if(b?.claimAllocationModel==='cdns-conditional-full-participation-v3')return cdnsAllocationHTML(b,{compact});
 if(b?.claimAllocationModel!=='fn-joint-european-v1'||!b.eligible)return '';
 if(compact){const vesting=b.inputs.warrantShares===.381922?'full vesting assumed':b.inputs.warrantShares===.085942?'vested count only':'selected vesting assumption';return `<p class="annual-summary-caveat incremental-coupled-allocation incremental-fn-claim-limits">${annualTextHTML('Warrants')}: ${b.inputs.warrantShares.toLocaleString('en-US',{maximumFractionDigits:2})}m · ${annualTextHTML(vesting)}<br>${annualTextHTML('Volatility')}: ${n(b.inputs.warrantVolatility*100)}% · ${annualTextHTML(b.inputs.warrantVolatility===.452?'grant-date proxy':'analyst volatility assumption')}<br>Raytek: ${n(b.inputs.raytekValue)} USDm · ${annualTextHTML('illiquid; realization unverified')}<br>Casix: ${annualTextHTML('excluded, unpriced legal tail risk')}<br>${annualTextHTML('Other liabilities / repatriation')}: ${n(b.inputs.otherNoncurrentLiabilityClaim)} / ${n(b.inputs.repatriationTaxClaim)} USDm · ${annualTextHTML('conditional')}${b.unallocatedShortfall>0?`<br><b>${annualTextHTML('Unallocated capital shortfall')}: ${n(b.unallocatedShortfall)} USDm</b>`:''}</p>`;}

 return `<p class="annual-summary-caveat incremental-coupled-allocation">${annualTextHTML('Equity pool before existing equity claims')}: ${n(b.equityPoolBeforeExistingEquityClaims)} USDm · ${annualTextHTML('Existing award value')}: ${n(b.allocation.awardClaim)} · ${annualTextHTML('Amazon warrant value')}: ${n(b.allocation.warrantClaim)}<br>${annualTextHTML('Ordinary equity after joint allocation')}: ${n(b.equity)} USDm / ${b.allocationShares.toLocaleString('en-US',{maximumFractionDigits:2})} ${annualTextHTML('million ordinary shares')}${b.unallocatedShortfall>0?`<br><b>${annualTextHTML('Unallocated capital shortfall')}: ${n(b.unallocatedShortfall)} USDm</b>`:''}<br>${annualTextHTML('Intrinsic share value and warrant value are solved together. Nonpositive pools give zero ordinary value with the shortfall retained separately.')}</p><p class="annual-summary-caveat incremental-fn-claim-limits">${annualTextHTML('Selected warrant shares')}: ${b.inputs.warrantShares.toLocaleString('en-US',{maximumFractionDigits:2})}m · ${annualTextHTML('Warrant volatility proxy')}: ${n(b.inputs.warrantVolatility*100)}% · ${annualTextHTML('Raytek value proxy')}: ${n(b.inputs.raytekValue)} USDm.<br>${annualTextHTML('Maximum warrants assume full vesting; default volatility uses a grant-date proxy and edits are analyst sensitivities. Raytek is not verified realizable cash. Casix litigation remains an unpriced tail risk; optional liability and repatriation claims remain conditional.')}</p>`;
}
