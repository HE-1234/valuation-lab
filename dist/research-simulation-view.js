// Annual profiles share presentation and sampling controls, never scalar economics.
import {DERIVED_CAPITAL_POLICY} from './annual-growth-horizon.js';
import {mountSimulation} from './simulation-view.js';
import {simulationResearchDefaults,validateResearchSimulationConfig,simulateResearch,simulateResearchAsync,RESEARCH_SIMULATION_DRIVER_LABELS,RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS} from './research-simulation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d}):'—';
const viewBases=new Map();
export function annualResearchSimulationAdapter(draft){
 const key=draft.caseId;let basis=viewBases.get(key)||'enterprise';
 const shareName=draft.ticker==='TSM'?'ordinary':'common';
 const optionClaims=draft.currentCapitalScenario?.optionPricing?.model==='aaoi-european-joint-v1';
 const shareLabel=optionClaims?'Conditional option-inclusive common-share value':`Conditional ${shareName}-share value`;
 const name=()=>basis==='perShare'?shareLabel:'Operating enterprise value';
 const unit=()=>basis==='perShare'?`${draft.currency} / ${shareName} share`:`${draft.currency} million EV`;
 const derived=draft.schemaVersion===2;
 const effectiveConfig=config=>derived&&config&&typeof config==='object'&&!Array.isArray(config)?{...config,capitalPolicy:DERIVED_CAPITAL_POLICY}:config;
 const descriptions=draft.marginPath?.enabled===true?{...RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS,marginShift:'Keep the starting margin fixed; shift interim and terminal targets together. Each annual margin receives its calendar-year curve change, preserving manual row offsets and margin dates.'}:RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS;
 const adapter={
  id:'annual-research',idPrefix:'research-',savedConfig:draft.researchSimulationConfig,captureDraft:()=>structuredClone(draft),
  labels:RESEARCH_SIMULATION_DRIVER_LABELS,
  tabNames:{growthPremium:'Growth premium',marginShift:'Margin shift',investmentMultiplier:'Investment',waccShift:'WACC shift'},
  defaults:()=>effectiveConfig(draft.researchPreset?.defaultSimulationConfig?structuredClone(draft.researchPreset.defaultSimulationConfig):simulationResearchDefaults(draft)),validate:config=>effectiveConfig(validateResearchSimulationConfig(config)),
  simulate:(config,runDraft=draft)=>simulateResearch(runDraft,config),simulateAsync:(config,options,runDraft=draft)=>simulateResearchAsync(runDraft,config,options),
  introduction:draft.researchPreset?'Explore the company-specific uncertainty assumptions loaded with this complete annual research case. Every distribution and parameter remains editable.':'Stress this reviewed annual path. Legacy defaults start Fixed; choose a distribution to explore explicit uncertainty assumptions.',
  defaultNote:draft.researchPreset?`Research preset ${draft.researchPreset.version}, as of ${draft.researchPreset.asOf}. Reset restores its company-specific distribution settings. These are conditional analyst judgments, not calibrated probabilities.`:'Legacy stresses start Fixed: growth 0 pp, margin 0 pp, investment 1× and WACC 0 pp. No uncertainty range is assumed.',
  uncertaintyNote:'These are analyst stress assumptions, not calibrated probabilities. Switching from Fixed offers editable example bounds. Rate shifts use percentage points: 1 means +1 pp.',
  profileNote:descriptions.growthPremium,
  fixedNote:`Taxes, terminal growth, terminal ROIC, the forecast horizon, timing-stub inputs and selected capital assumptions remain fixed. ${optionClaims?'AAOI note and customer-warrant claim values are repriced from operating value in every trial.':'Selected claim amounts remain fixed in this bridge.'} Terminal investment still follows NOPAT × growth / ROIC. Funding deficits are never deducted again as debt.`,
  driverFallbacks:{growthPremium:{low:-.05,mode:0,high:.05},marginShift:{low:-.05,mode:0,high:.05},investmentMultiplier:{low:.75,mode:1,high:1.25},waccShift:{low:-.015,mode:0,high:.015}},
  relationshipsMarkup:config=>derived?`<label for="mc-capital-policy">How investment responds to revenue<select id="mc-capital-policy" disabled><option value="${DERIVED_CAPITAL_POLICY}" selected>Committed spending floor plus growth</option></select></label><p class="micro">Derived horizon sensitivity: positive investment in the current edited annual schedule stays as a floor, scales upward with revenue and funds additional expansion at marginal sales / capital ${fmt(draft.derivedForecast.marginalSalesCapital)}×. Explicit releases are retained without amplification. The optional investment multiplier applies separately after this response. Reduced revenue never automatically releases capital.</p><p class="micro">The four stress draws remain independent. This response links investment to the simulated revenue path; it is an analyst sensitivity, not verified capacity economics.</p>`:`<label for="mc-capital-policy">How investment responds to revenue<select id="mc-capital-policy"><option value="fixed-schedule" ${config.capitalPolicy==='fixed-schedule'?'selected':''}>Keep reviewed absolute investment</option><option value="revenue-scaled" ${config.capitalPolicy==='revenue-scaled'?'selected':''}>Scale investment with scenario revenue</option></select></label><p class="micro">Fixed-schedule holds each reviewed annual amount before applying your investment multiplier. It is a capacity/commitment stress; not all amounts are contractual. Revenue-scaled multiplies each amount by scenario revenue ÷ reviewed revenue, then by your investment multiplier.</p><p class="micro">The four stress draws are independent. This is an explicit modeling assumption. The revenue-scaled policy links investment to the sampled revenue path; it does not estimate correlations. Signed investment, releases and customer advances keep their existing sign. Declining revenue never automatically creates a release.</p>`,
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
  outputMarkup:r=>`<div class="mc-output-choice"><label for="mc-value-basis">Chart value<select id="mc-value-basis"><option value="enterprise" ${basis==='enterprise'?'selected':''}>Operating enterprise value · ${esc(draft.currency)} millions</option>${r.bridgeCoverage.complete?`<option value="perShare" ${basis==='perShare'?'selected':''}>${esc(shareLabel)} · ${esc(draft.currency)}</option>`:''}</select></label><p class="micro">${r.bridgeCoverage.complete?optionClaims?'The conditional option-inclusive share output reprices the note and customer-warrant claims in every scenario; volatility, rates and other capital assumptions stay fixed.':`The ${shareName}-share option uses the same selected dated claims and share bridge in each scenario.`:'Common-share output is withheld: the dated capital or share bridge is unresolved.'} ${Object.values(r.config.drivers).every(d=>d.type==='fixed')?'All inputs are Fixed. The single bar is this one selected case, not an estimated confidence range.':''}</p>${draft.currentCapitalScenario?.claimStatus==='unresolved'?'<p class="micro">Operating-only distribution. Unresolved security claims prevent a common-share distribution; the before-debt base-case diagnostic is not a zero-dollar stock value.</p>':''}${optionClaims?'<p class="micro"><b>Conditional AAOI approximation:</b> Simplified European option pricing omits contract and joint default features. This is an option-inclusive scenario range, not an observed market-price distribution.</p>':''}${draft.ticker==='NBIS'?'<p class="research-warning"><b>Conditional NBIS uncertainty:</b> Revenue, customer advances, capacity spending and future financing are not jointly modeled. The research preset holds growth premium and the investment multiplier Fixed; this range excludes those coupled risks.</p>':''}${draft.ticker==='LITE'?'<p class="micro"><b>June-dated hybrid:</b> Selected note and capped-call values stay fixed in every trial, not re-solved as operating value changes. Employee claims remain incomplete. This is not a current October share-price distribution.</p>':''}</div>`,
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
