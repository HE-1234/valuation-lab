import {UMC_MESSAGES} from './umc-messages.js';
import {RMBS_MESSAGES} from './rmbs-messages.js';
import {CEVA_MESSAGES,cevaSimulationRelationshipsHTML} from './ceva-research-view.js';
import {KEYS_MESSAGES,keysSimulationRelationshipsHTML} from './keys-research-view.js';
import {nvmiMonteCarloNoteHTML} from './nvmi-conditional-view.js';
import {displayNumber} from './number-display.js';
import {jointDefaults,jointEffectiveConfig,isJoint} from './joint-simulation-config.js';
import {DEFAULT_SIMULATION_TRIALS} from './simulation-count-policy.js';
import {hasResearchReferencePolicy} from './research-reference-defaults.js';
import {referenceStatusMessage} from './research-reference-status.js';
import {SNPS_STUB_NOTE,SNPS_FUNDING_NOTE} from './snps-research-view.js';
import {CDNS_STUB_NOTE} from './cdns-research-view.js';
import {incrementalFundingHTML} from './incremental-research-view.js';
import './annual-metrics-i18n.js';
import {t, localizedText} from './i18n.js';
import {annualMessage,annualMessageKey,annualLabel,annualTextHTML} from './annual-localization.js';
import {annualPathDefaults} from './annual-path-sampling.js';
// Annual profiles share presentation and sampling controls, never scalar economics.
import {DERIVED_CAPITAL_POLICY} from './annual-growth-horizon.js';
import {mountSimulation} from './simulation-view.js';
import {simulationResearchDefaults,validateResearchSimulationConfig,simulateResearch,simulateResearchAsync,researchAnnualPathContext,RESEARCH_SIMULATION_DRIVER_LABELS,RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS} from './research-simulation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(value,digits=2)=>displayNumber(value,digits);
const viewBases=new Map();
export function annualResearchSimulationAdapter(draft){
 const key=draft.caseId;let basis=viewBases.get(key)||'enterprise',lastQuoteDate='';
 const shareName=['TSM','ASML','FN','UMC'].includes(draft.ticker)?'ordinary':'common';
 const fnClaims=draft.ticker==='FN';
 const fnNote='Fabrinet warrants are jointly repriced from intrinsic share value in each trial; required operating cash follows the same revenue path. Selected claim counts, rate, term and volatility stay fixed.';
 const optionClaims=draft.currentCapitalScenario?.optionPricing?.model==='aaoi-european-joint-v1';
 const shareLabel=optionClaims?'Conditional option-inclusive common-share value':`Conditional ${shareName}-share value`;
 const name=()=>basis==='perShare'?shareLabel:'Operating enterprise value';
 const unit=()=>basis==='perShare'?`${draft.currency} / ${shareName} share`:`${draft.currency} million EV`;
 const derived=draft.schemaVersion===2;
 const effectiveConfig=config=>derived&&config&&typeof config==='object'&&!Array.isArray(config)?{...config,capitalPolicy:DERIVED_CAPITAL_POLICY}:config;
 const descriptions=draft.ticker==='UMC'?{...RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS,investmentMultiplier:UMC_MESSAGES.reinvestment[0]}:draft.ticker==='RMBS'?{...RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS,investmentMultiplier:RMBS_MESSAGES.simulation[0]}:draft.ticker==='CEVA'?{...RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS,investmentMultiplier:CEVA_MESSAGES.terminal[0]}:draft.ticker==='KEYS'?{...RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS,investmentMultiplier:KEYS_MESSAGES.terminal[0]}:draft.marginPath?.enabled===true?{...RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS,marginShift:'Keep the starting margin fixed; shift interim and terminal targets together. Each annual margin receives its calendar-year curve change, preserving manual row offsets and margin dates.'}:RESEARCH_SIMULATION_DRIVER_DESCRIPTIONS;
 const adapter={
  ...(hasResearchReferencePolicy(draft)?{referenceStatusMessage:config=>referenceStatusMessage(config,researchAnnualPathContext(draft),value=>{const checked=effectiveConfig(validateResearchSimulationConfig(value));if(!derived&&checked.capitalPolicy===DERIVED_CAPITAL_POLICY)throw Error('Derived capital policy requires a version-2 annual horizon draft.');return checked;})}:{}),
  id:'annual-research',idPrefix:'research-',savedConfig:draft.researchSimulationConfig,captureDraft:()=>structuredClone(draft),
  labels:RESEARCH_SIMULATION_DRIVER_LABELS,annualPathContext:()=>researchAnnualPathContext(draft),
  tabNames:{growthPremium:'Growth',marginShift:'Margin shift',investmentMultiplier:'Investment',waccShift:'WACC shift'},
  defaults:()=>jointDefaults({...effectiveConfig(draft.incrementalResearch?simulationResearchDefaults(draft):draft.researchPreset?.defaultSimulationConfig?{...simulationResearchDefaults(draft),...structuredClone(draft.researchPreset.defaultSimulationConfig),method:'annual-path',annualPath:draft.incrementalResearch?simulationResearchDefaults(draft).annualPath:annualPathDefaults(draft.annual.length)}:simulationResearchDefaults(draft)),trials:DEFAULT_SIMULATION_TRIALS},{horizon:draft.annual.length,capital:'investmentFactor'}),validate:config=>effectiveConfig(validateResearchSimulationConfig(config,draft)),
  simulate:(config,runDraft=draft)=>simulateResearch(runDraft,config),simulateAsync:(config,options,runDraft=draft)=>simulateResearchAsync(runDraft,config,options),
  introduction:draft.incrementalResearch?'All research-default inputs are fixed. Run manually to reproduce one conditional case; choose uncertainty explicitly before interpreting a range.':draft.researchPreset?'Explore the company-specific uncertainty assumptions loaded with this complete annual research case. Every distribution and parameter remains editable.':'Stress this reviewed annual path. Choose correlated annual growth paths or retain the legacy single growth draw. Other operating assumptions remain independently editable.',
  defaultNote:draft.ticker==='UMC'?UMC_MESSAGES.simulation[0]:draft.ticker==='RMBS'?RMBS_MESSAGES.simulation[0]:draft.ticker==='CEVA'?CEVA_MESSAGES.simulation[0]:draft.ticker==='KEYS'?KEYS_MESSAGES.simulation[0]:draft.ticker==='ASML'?'No probability calibration is supplied. Reset restores fixed inputs; the named runoff cases are funding stresses with no assigned probabilities.':draft.incrementalResearch?'No probability calibration is supplied. Reset restores fixed inputs; the named downside is a separate scenario with no assigned probability.':draft.researchPreset?`Research preset ${draft.researchPreset.version}, as of ${draft.researchPreset.asOf}. Reset uses annual growth paths and restores the other company-specific distribution settings. These are conditional analyst judgments, not calibrated probabilities.`:'New settings use annual growth paths. Margin shift and WACC shift start at 0 pp; investment starts at 1×. Saved legacy settings retain their single growth draw.',
  uncertaintyNote:'These are analyst stress assumptions, not calibrated probabilities. Annual innovation SD and rate shifts use percentage points: 1 means 1 pp. Switching other drivers from Fixed offers editable example bounds.',
  profileNote:descriptions.growthPremium,
  fixedNote:draft.ticker==='UMC'?UMC_MESSAGES.simulation[0]:draft.ticker==='RMBS'?RMBS_MESSAGES.simulation[0]:draft.ticker==='CEVA'?CEVA_MESSAGES.terminal[0]:draft.ticker==='KEYS'?KEYS_MESSAGES.terminal[0]:draft.ticker==='SNPS'?SNPS_STUB_NOTE:draft.openingStub?CDNS_STUB_NOTE:`Taxes, terminal growth, terminal ROIC, the forecast horizon, timing-stub inputs and selected capital assumptions remain fixed. ${fnClaims?fnNote:optionClaims?'AAOI note and customer-warrant claim values are repriced from operating value in every trial.':'Selected claim amounts remain fixed in this bridge.'} Terminal investment still follows NOPAT × growth / ROIC. Funding deficits are never deducted again as debt.`,
  driverFallbacks:{growthPremium:{low:-.05,mode:0,high:.05},marginShift:{low:-.05,mode:0,high:.05},investmentMultiplier:{low:.75,mode:1,high:1.25},waccShift:{low:-.015,mode:0,high:.015}},
  relationshipsMarkup:config=>draft.ticker==='UMC'?`<p class="micro">${annualTextHTML(UMC_MESSAGES.reinvestment[0])} ${annualTextHTML(UMC_MESSAGES.simulation[0])}</p>`:draft.ticker==='CEVA'?cevaSimulationRelationshipsHTML(config):draft.ticker==='KEYS'?keysSimulationRelationshipsHTML(config):derived?`<label for="mc-capital-policy"><span data-i18n="annual.copy.57d54aef5302">How investment responds to revenue</span><select id="mc-capital-policy" disabled><option value="${DERIVED_CAPITAL_POLICY}" selected data-i18n="annual.copy.96371ad6db98">Committed spending floor plus growth</option></select></label><p class="micro">${localizedText("annual.simulation.derived",{ratio:fmt(draft.derivedForecast.marginalSalesCapital)})}</p>${isJoint(config)?'':'<p class="micro" data-i18n="annual.copy.ac4f43d74b2e">Growth paths and the other stress draws remain independent. This response links investment to the simulated revenue path; it is an analyst sensitivity, not verified capacity economics.</p>'}`:`<label for="mc-capital-policy"><span data-i18n="annual.copy.57d54aef5302">How investment responds to revenue</span><select id="mc-capital-policy"><option value="fixed-schedule" ${config.capitalPolicy==='fixed-schedule'?'selected':''} data-i18n="annual.copy.37a629ce21bd">Keep reviewed absolute investment</option><option value="revenue-scaled" ${config.capitalPolicy==='revenue-scaled'?'selected':''} data-i18n="annual.copy.1e436d5d1aeb">Scale investment with scenario revenue</option></select></label><p class="micro" data-i18n="annual.copy.117dfa8850c4">Fixed-schedule retains edited pre-reserve investment; revenue-scaled adjusts its operating portion by scenario revenue ÷ edited baseline revenue. For factor-based inputs: annual factors apply afterward when active; otherwise the scalar multiplier applies. Selected fixed funding is protected. These are capacity/commitment sensitivities; not all amounts are contractual.</p>${isJoint(config)?'':'<p class="micro" data-i18n="annual.copy.8a63274d15ce">Growth paths and the other stress draws are independent. This is an explicit modeling assumption. The revenue-scaled policy links investment to the sampled revenue path; it does not estimate correlations. Signed investment, releases and customer advances keep their existing sign. Declining revenue never automatically creates a release.</p>'}`,
  collectSettings:(config,find)=>{if(draft.ticker==='UMC')return;config.capitalPolicy=find('#mc-capital-policy').value;},
  bindSettings:(find,changed)=>{if(draft.ticker==='UMC')return;find('#mc-capital-policy').onchange=changed;},
  samplingMarkup:()=>draft.ticker==='UMC'?`<p class="micro">${annualTextHTML(UMC_MESSAGES.simulation[0])}</p>`:draft.ticker==='RMBS'?`<p class="micro">${annualTextHTML(RMBS_MESSAGES.simulation[0])}</p>`:'<p class="micro" data-i18n="annual.copy.aaa67f350434">Operating EV is available for every company with a valid annual path. A common-share chart is offered only when all accepted scenarios have a valid dated capital and share bridge. Results remain conditional on unresolved claims.</p>',
  normalizeResult:raw=>{
   lastQuoteDate=raw.timing.date;
   if(basis==='perShare'&&!raw.bridgeCoverage.complete)basis='enterprise';
   const display=basis==='perShare'?raw.perShare:raw.enterprise;
   return {...raw,...display,units:raw.units,enterprise:raw.enterprise,equity:raw.equity,perShare:raw.perShare,config:raw.config,attempts:raw.attempts,accepted:display.accepted,excluded:raw.excluded,exclusions:raw.exclusions,
    zeroEquityCount:fnClaims&&basis==='perShare'?raw.zeroEquityCount:0,zeroEquityShare:fnClaims&&basis==='perShare'?raw.zeroEquityShare:0,displayBasis:basis,displayUnits:unit(),
    quote:{status:'blocked',message:`${name()} at ${raw.timing.date}. No market-price probability is implied.`}};
  },
  valueUnit:()=>renderMessage("valueUnit"),valuePhrase:()=>renderMessage("valuePhrase"),
  axisLabel:()=>renderMessage("axisLabel"),
  valueColumn:()=>renderMessage('valueColumn'),
  tableCaption:()=>renderMessage("tableCaption"),
  outputMarkup:r=>`<div class="mc-output-choice">${draft.ticker==='NVMI'?nvmiMonteCarloNoteHTML():''}<label for="mc-value-basis"><span data-i18n="annual.copy.69670a8f9477">Chart value</span><select id="mc-value-basis"><option value="enterprise" ${basis==='enterprise'?'selected':''} data-i18n="annual.simulation.enterpriseOption" data-i18n-params="${esc(JSON.stringify({currency:draft.currency}))}">${esc(t("annual.simulation.enterpriseOption",{currency:draft.currency}))}</option>${r.bridgeCoverage.complete?`<option value="perShare" ${basis==='perShare'?'selected':''} data-i18n="annual.simulation.shareOption" data-i18n-params="${esc(JSON.stringify({name:annualLabel(shareLabel),currency:draft.currency}))}">${esc(t("annual.simulation.shareOption",{name:annualLabel(shareLabel),currency:draft.currency}))}</option>`:''}</select></label><p class="micro">${r.bridgeCoverage.complete?fnClaims?annualTextHTML(fnNote):optionClaims?annualTextHTML('The conditional option-inclusive share output reprices the note and customer-warrant claims in every scenario; volatility, rates and other capital assumptions stay fixed.'):localizedText('annual.simulation.shareBridge',{share:annualLabel(shareName)}):annualTextHTML('Common-share output is withheld: the dated capital or share bridge is unresolved.')} ${!['annual-path','joint-annual-path'].includes(r.config.method)&&Object.values(r.config.drivers).every(d=>d.type==='fixed')?annualTextHTML('All inputs are Fixed. The single bar is this one selected case, not an estimated confidence range.'):''}</p>${draft.currentCapitalScenario?.claimStatus==='unresolved'?'<p class="micro" data-i18n="annual.copy.c33ee5f360e3">Operating-only distribution. Unresolved security claims prevent a common-share distribution; the before-debt base-case diagnostic is not a zero-dollar stock value.</p>':''}${optionClaims?'<p class="micro"><b data-i18n="annual.copy.8cd951473791">Conditional AAOI approximation:</b><span data-i18n="annual.copy.5ce6e8d21f19"> Simplified European option pricing omits contract and joint default features. This is an option-inclusive scenario range, not an observed market-price distribution.</span></p>':''}${draft.ticker==='NBIS'?'<p class="research-warning"><b data-i18n="annual.copy.47f92fa5e524">Conditional NBIS uncertainty:</b><span data-i18n="annual.copy.6279a5d8ac57"> Revenue, customer advances, capacity spending and future financing are not jointly modeled. Growth uncertainty follows the selected sampling method. The investment multiplier starts Fixed in this preset; neither method models those coupled risks.</span></p>':''}${draft.ticker==='LITE'?'<p class="micro"><b data-i18n="annual.copy.3ee3efa00d92">June-dated hybrid:</b><span data-i18n="annual.copy.89376963ad34"> Selected note and capped-call values stay fixed in every trial, not re-solved as operating value changes. Employee claims remain incomplete. This is not a current October share-price distribution.</span></p>':''}</div>`,
  bindOutput:(find,repaint)=>{find('#mc-value-basis').onchange=()=>{const control=find('#mc-value-basis'),restoreFocus=document.activeElement===control;basis=control.value;viewBases.set(key,basis);repaint();if(restoreFocus)find('#mc-value-basis')?.focus?.({preventScroll:true});};},
  summaryMarkup:r=>`${incrementalFundingHTML(draft)}<div class="mc-bridge-summary"><p><b data-i18n="annual.copy.ab25625b2aba">Annual-path policy:</b> ${annualTextHTML(r.method.capitalDescription)}</p><p><b data-i18n="annual.copy.08caf5f8267d">Dated equity coverage:</b> ${localizedText("annual.simulation.coverage",{accepted:fmt(r.bridgeCoverage.accepted,0),total:fmt(r.bridgeCoverage.total,0)})} ${Object.keys(r.bridgeCoverage.reasons||{}).map(esc).join(' ')}</p>${r.bridgeCoverage.complete?`<p>${localizedText("annual.simulation.median",{share:annualLabel(shareName),median:fmt(r.perShare.median),currency:draft.currency,low:fmt(r.perShare.quantiles.p10),high:fmt(r.perShare.quantiles.p90)})}</p>`:''}<p>${isJoint(r.config)?localizedText('jointAnnual.scope'):r.config.method==='annual-path'&&r.config.annualMetrics?localizedText('annualMetrics.scopeResearch'):annualTextHTML(descriptions.marginShift)+' '+annualTextHTML(descriptions.investmentMultiplier)+' '+annualTextHTML(descriptions.waccShift)}</p><p data-i18n="annual.copy.a1b57716180d">Unresolved source claims and timing caveats still apply. This does not estimate a probability of investment profit, business failure or a future stock price.</p></div>`
 };
 const originalRelationships=adapter.relationshipsMarkup;
 adapter.relationshipsMarkup=config=>{
  let html=originalRelationships(config),policyNote='';
  if(fnClaims){
   html=html.replace(/<p class="micro" data-i18n="annual.copy.117dfa8850c4">[\s\S]*?<\/p>/,`<p class="micro">${annualTextHTML('FN investment factors apply to pre-reserve investment excluding the fixed opening payable. Required-cash changes are derived separately from the same sampled revenue path.')}</p>`);
   policyNote='Investment inputs and draws are before required-cash changes. The fixed 3% reserve policy can fund cash growth or release cash as next-year sales change; the opening payable settlement remains fixed.';
  }
  if(draft.ticker==='SNPS')policyNote='SNPS capital responses and draws change entered investment before the separate FY2027 floor top-up. Entered releases retain their sign, but funded FY2027 investment cannot fall below the selected analyst floor. Later years have no such floor; falling revenue does not automatically create a capital release.';
  if(policyNote){const note=`<p class="micro">${annualTextHTML(policyNote)}</p>`;html=isJoint(config)?html+note:html.replace(/<p class="micro" data-i18n="annual.copy.8a63274d15ce">[\s\S]*?<\/p>/,note);}
  return (draft.ticker==='SNPS'?`<p class="research-warning">${annualTextHTML(SNPS_FUNDING_NOTE)}</p>`:'')+incrementalFundingHTML(draft)+html;
 };
 function presentationMessage(field){
  if(['RMBS','CEVA','KEYS','UMC'].includes(draft.ticker)&&['defaultNote','fixedNote'].includes(field))return annualMessage(adapter[field]);
  if(hasResearchReferencePolicy(draft)&&['introduction','defaultNote'].includes(field))return {key:'annualReference.'+field.replace('defaultNote','defaults'),params:{}};
  if(draft.openingStub&&field==='fixedNote')return annualMessage(draft.ticker==='SNPS'?SNPS_STUB_NOTE:CDNS_STUB_NOTE);
  if(fnClaims&&field==='fixedNote')return annualMessage(fnNote);
  if(draft.incrementalResearch&&['introduction','defaultNote'].includes(field))return annualMessage(adapter[field]);
  const currency=draft.currency,share=annualLabel(shareName),isShare=basis==='perShare';
  if(['introduction','defaultNote','uncertaintyNote','fixedNote'].includes(field))return {key:'annualMetrics.'+({introduction:'scopeResearch',defaultNote:'defaults',uncertaintyNote:'note',fixedNote:'fixedFacts'}[field]),params:{}};
  if(field==='defaultNote'&&draft.researchPreset)return {key:'annual.simulation.preset',params:{version:draft.researchPreset.version,date:draft.researchPreset.asOf}};
  if(field==='fixedNote')return {key:'annual.simulation.fixed',params:{claims:annualLabel(optionClaims?'AAOI note and customer-warrant claim values are repriced from operating value in every trial.':'Selected claim amounts remain fixed in this bridge.')}};
  if(field==='valueUnit')return {key:isShare?'annual.simulation.unitShare':'annual.simulation.unitEnterprise',params:{currency,share}};
  if(field==='valuePhrase')return {key:isShare?'annual.simulation.phraseShare':'annual.simulation.phraseEnterprise',params:{currency,share}};
  if(field==='axisLabel')return {key:isShare?'annual.simulation.axisShare':'annual.simulation.axisEnterprise',params:{currency,share:annualLabel(shareName).toUpperCase()}};
  if(field==='valueColumn')return {key:annualMessageKey(isShare?'Value / share':'Operating EV · millions'),params:{}};
  if(field==='tableCaption')return {key:'annual.simulation.caption',params:{name:annualLabel(name()),unit:renderMessage('valueUnit')}};
  if(field==='quoteNote')return {key:'annual.simulation.quote',params:{name:annualLabel(name()),date:lastQuoteDate}};
  const key=annualMessageKey(adapter[field]);return key?{key,params:{}}:null;
 }
 function renderMessage(field){const message=presentationMessage(field);return message?t(message.key,message.params):String(adapter[field]??'');}
 adapter.errorMessage=annualMessage;adapter.presentationKey=annualMessageKey;adapter.presentationMessage=presentationMessage;
 return adapter;
}
export function mountAnnualResearchSimulation(root,{draft,companyCase,onConfigChange,...options}){
 if(!root)return ()=>{};
 const snapshot={ticker:draft.ticker,currency:draft.currency,periodEnd:draft.discountOrigin,raw:{id:draft.caseId},sourceUrl:companyCase?.sourceUrl};
 return mountSimulation(root,snapshot,draft,{...options,onConfigChange,adapter:annualResearchSimulationAdapter(draft)});
}
