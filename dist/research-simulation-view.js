// Annual profiles share presentation and sampling controls, never scalar economics.
import {mountSimulation} from './simulation-view.js';
import {simulationResearchDefaults,validateResearchSimulationConfig,simulateResearch,simulateResearchAsync,RESEARCH_SIMULATION_DRIVER_LABELS,RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS} from './research-simulation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d}):'—';
const viewBases=new Map();
export function annualResearchSimulationAdapter(draft){
 const key=draft.caseId;let basis=viewBases.get(key)||'enterprise';
 const shareName=draft.ticker==='TSM'?'ordinary':'common';
 const name=()=>basis==='perShare'?`Conditional ${shareName}-share value`:'Operating enterprise value';
 const unit=()=>basis==='perShare'?`${draft.currency} / ${shareName} share`:`${draft.currency} million EV`;
 const descriptions=RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS;
 const adapter={
  id:'annual-research',idPrefix:'research-',savedConfig:draft.researchSimulationConfig,
  labels:RESEARCH_SIMULATION_DRIVER_LABELS,
  tabNames:{growthPremium:'Growth premium',marginShift:'Margin shift',investmentMultiplier:'Investment',waccShift:'WACC shift'},
  defaults:()=>simulationResearchDefaults(draft),validate:validateResearchSimulationConfig,
  simulate:config=>simulateResearch(draft,config),simulateAsync:(config,options)=>simulateResearchAsync(draft,config,options),
  introduction:'Stress this reviewed annual path. Defaults start Fixed; choose a distribution to explore explicit uncertainty assumptions.',
  defaultNote:'All stresses start Fixed: growth 0 pp, margin 0 pp, investment 1× and WACC 0 pp. No uncertainty range is assumed.',
  uncertaintyNote:'These are analyst stress assumptions, not calibrated probabilities. Switching from Fixed offers editable example bounds. Rate shifts use percentage points: 1 means +1 pp.',
  profileNote:descriptions.growthPremium,
  fixedNote:'Taxes, terminal growth, terminal ROIC, the forecast horizon, timing-stub inputs and selected dated capital claims remain fixed. Terminal investment still follows NOPAT × growth / ROIC. Funding deficits are never deducted again as debt.',
  driverFallbacks:{growthPremium:{low:-.05,mode:0,high:.05},marginShift:{low:-.05,mode:0,high:.05},investmentMultiplier:{low:.75,mode:1,high:1.25},waccShift:{low:-.015,mode:0,high:.015}},
  relationshipsMarkup:config=>`<label for="mc-capital-policy">How investment responds to revenue<select id="mc-capital-policy"><option value="fixed-schedule" ${config.capitalPolicy==='fixed-schedule'?'selected':''}>Keep reviewed absolute investment</option><option value="revenue-scaled" ${config.capitalPolicy==='revenue-scaled'?'selected':''}>Scale investment with scenario revenue</option></select></label><p class="micro">The default holds each reviewed annual amount before applying your investment multiplier. It is a capacity/commitment stress; not all amounts are contractual. Revenue-scaled multiplies each amount by scenario revenue ÷ reviewed revenue, then by your investment multiplier.</p><p class="micro">The four stress draws are independent. This is an explicit modeling assumption. The revenue-scaled policy links investment to the sampled revenue path; it does not estimate correlations. Signed investment, releases and customer advances keep their existing sign. Declining revenue never automatically creates a release.</p>`,
  collectSettings:(config,find)=>{config.capitalPolicy=find('#mc-capital-policy').value;},
  bindSettings:(find,changed)=>{find('#mc-capital-policy').onchange=changed;},
  samplingMarkup:()=>'<p class="micro">Operating EV is available for every company with a valid annual path. A common-share chart is offered only when all accepted scenarios have a valid dated capital and share bridge. Results remain conditional on unresolved claims.</p>',
  normalizeResult:raw=>{
   if(basis==='perShare'&&!raw.bridgeCoverage.complete)basis='enterprise';
   const display=basis==='perShare'?raw.perShare:raw.enterprise;
   return {...raw,...display,units:raw.units,enterprise:raw.enterprise,equity:raw.equity,perShare:raw.perShare,config:raw.config,attempts:raw.attempts,accepted:display.accepted,excluded:raw.excluded,exclusions:raw.exclusions,
    zeroEquityCount:0,zeroEquityShare:0,displayBasis:basis,displayUnits:unit(),
    quote:{status:'blocked',message:`${name()} at ${raw.timing.date}. No market-price probability is implied.`}};
  },
  valueUnit:unit,valuePhrase:()=>basis==='perShare'?`${draft.currency} per ${shareName} share`:`${draft.currency} million operating enterprise value`,
  axisLabel:()=>basis==='perShare'?`${draft.currency} PER ${shareName.toUpperCase()} SHARE`:`${draft.currency} MILLION · OPERATING EV`,
  valueColumn:()=>basis==='perShare'?'Value / share':'Operating EV · millions',
  tableCaption:()=>`${name()} · ${unit()}`,
  outputMarkup:r=>`<div class="mc-output-choice"><label for="mc-value-basis">Chart value<select id="mc-value-basis"><option value="enterprise" ${basis==='enterprise'?'selected':''}>Operating enterprise value · ${esc(draft.currency)} millions</option>${r.bridgeCoverage.complete?`<option value="perShare" ${basis==='perShare'?'selected':''}>Conditional ${shareName}-share value · ${esc(draft.currency)}</option>`:''}</select></label><p class="micro">${r.bridgeCoverage.complete?`The ${shareName}-share option uses the same selected dated claims and share bridge in each scenario.`:'Common-share output is withheld: the dated capital or share bridge is unresolved.'} ${Object.values(r.config.drivers).every(d=>d.type==='fixed')?'All inputs are Fixed. The single bar is this one selected case, not an estimated confidence range.':''}</p></div>`,
  bindOutput:(find,repaint)=>{find('#mc-value-basis').onchange=()=>{basis=find('#mc-value-basis').value;viewBases.set(key,basis);repaint();};},
  summaryMarkup:r=>`<div class="mc-bridge-summary"><p><b>Annual-path policy:</b> ${esc(r.method.capitalDescription)}</p><p><b>Dated equity coverage:</b> ${fmt(r.bridgeCoverage.accepted,0)} / ${fmt(r.bridgeCoverage.total,0)} accepted operating scenarios have a valid bridge. ${Object.keys(r.bridgeCoverage.reasons||{}).map(esc).join(' ')}</p>${r.bridgeCoverage.complete?`<p><b>Conditional ${shareName}-share median:</b> ${fmt(r.perShare.median)} ${esc(draft.currency)}. Central 80%: ${fmt(r.perShare.quantiles.p10)}–${fmt(r.perShare.quantiles.p90)}. Signed negative equity and per-share results are retained.</p>`:''}<p>${esc(descriptions.marginShift)} ${esc(descriptions.investmentMultiplier)} ${esc(descriptions.waccShift)}</p><p>Unresolved source claims and timing caveats still apply. This does not estimate a probability of investment profit, business failure or a future stock price.</p></div>`
 };
 return adapter;
}
export function mountAnnualResearchSimulation(root,{draft,companyCase,onConfigChange,...options}){
 if(!root)return ()=>{};
 const snapshot={ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId},sourceUrl:companyCase?.sourceUrl};
 return mountSimulation(root,snapshot,draft,{...options,onConfigChange,adapter:annualResearchSimulationAdapter(draft)});
}
