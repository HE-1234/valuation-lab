// CEVA v3. USD millions and million common shares. June 30 capital/discount
// anchor, with later information through October 19: retrospective scenarios.
// Pure replay and the edited-row adapter share the same tax/claim/funding math.
import {incrementalRecord} from './incremental-registry.js';
import {incrementalIdentityValid} from './incremental-research-identity.js';
export const CEVA_ADAPTER_NOTES=Object.freeze({
 scope:'June 30, 2026 capital and discount anchor, using information through October 19, 2026. Retrospective conditional research; no current target, upside, expected return, recommendation, ranking or ex-ante June backtest.',
 mapping:'H2 2026 revenue and GAAP EBIT equal full-year assumptions less reported H1. Edited aggregate revenue retains the selected source period licensing/royalty mix; this is an analyst mapping, not a segment forecast.',
 tax:'Cash tax is the greater of the entered tax rate on positive economic EBIT and 3% of revenue, in every explicit period and the terminal period. The reviewed rate is 20%. Losses do not generate tax credits.',
 awards:'GAAP margins include SBC. Only $9.502 million in H2 2026 and $19.004 million in 2027 are added back for existing awards already represented in the denominator. Future grants remain a cash-replacement expense, with no second assumed dilution charge. The timing is an analyst approximation, not a grant-level schedule.',
 claims:'June common shares are 28.137917 million, plus all 1.845728 million reported unvested RSU/PSU claims without forfeiture credit. This aggregate is not a verified maximum PSU payout. Multipliers from 1x to 2x are analyst stresses, not legal maximum obligations.',
 options:'All 30,025 outstanding options at $20.91 use an endogenous intrinsic exercise approximation. Only 19,279 are currently exercisable; 4.4 years of remaining life, time value and vesting timing are not fully valued. An out-of-money option is not necessarily worthless.',
 capital:'Entered annual reinvestment must cover 3.5% property capex less 3% D&A plus 18% of the change in full-year revenue; the H2 working-capital change is halved. A supported working-capital release may reduce the floor. Inputs are never silently repaired.',
 terminal:'Terminal reinvestment is NOPAT times growth divided by incremental ROIC, replacing explicit property-capex and working-capital formulas. Final margin, tax rate and WACC must match terminal assumptions. Reviewed explicit revenue growth need not already equal terminal growth.',
 reserve:'The operating reserve is deducted once from equity. Net severance of $0.217 million and other noncurrent accruals of $1.072 million are deducted separately. Lease expense remains in EBIT; $17.424 million of operating leases is not also deducted as debt. Dedicated severance assets are not free surplus.',
 offshore:'Of $220.720 million in cash, deposits and marketable debt securities, $122.7 million is held abroad. Zero haircut assumes conditional tax-efficient access, not verified tax-free domestic availability. The haircut is a dollar amount, capped at disclosed foreign liquidity.',
 funding:'Opening liquid assets plus modeled FCFF is a funding-capacity stress proxy, not forecast bank cash. The funding gate also reserves the offshore haircut, net severance and other noncurrent accruals before testing the operating reserve. No interest income, financing, acquisitions or distributions are modeled. Any funding gap withholds enterprise, equity and per-share headlines.',
 assumptions:'Licensing and royalty ramps, margins, cash-tax floor, capital intensity, reserve, WACC, terminal growth and incremental ROIC are analyst assumptions. Named cases have no calibrated probabilities.'
});
export const CEVA_ERRORS=Object.freeze({
 input:'CEVA requires the complete finite reviewed v3 input schema; unknown or missing fields are unsupported.',
 source:'CEVA source facts, capital, June 30 anchor and October 19 information cutoff must match the reviewed v3 package.',
 scenario:'CEVA requires a supported finite licensing and royalty scenario with WACC and terminal ROIC above growth.',
 identity:'CEVA source, dates and common-share identity must match the reviewed package.',
 controls:'CEVA reserve, offshore haircut and aggregate-award controls require finite values within their stated bounds.',
 fields:'Unsupported CEVA draft, annual, terminal, claim or funding field. Retain the saved draft for recovery.',
 horizon:'CEVA supports H2 2026 and the nine full years 2027–2035 only.',
 timing:'CEVA June 30 timing is fixed. A different date requires a newly reviewed capital bridge.',
 annual:'CEVA annual inputs require positive revenue, finite supported margins, tax, investment and WACC.',
 floor:'CEVA entered reinvestment is below the recalculated property-capex and working-capital floor. No automatic top-up is applied.',
 terminal:'CEVA terminal inputs require supported finite values, positive after-tax operating profit, WACC above growth and ROIC above growth.',
 convergence:'CEVA final annual margin, tax rate and WACC must equal the terminal assumptions.',
 funding:'CEVA requires unmodeled external funding. Enterprise, equity and per-share headlines are withheld; capacity figures are stress diagnostics only.',
 nonpositive:'CEVA conditional equity is nonpositive. Enterprise, equity and per-share headlines are withheld.',
 stale:'CEVA operating value must match the current annual schedule and claim assumptions.',
 basis:'CEVA allocation requires June 30 dated USD and the reviewed ordinary-common security basis.',
 arithmetic:'CEVA arithmetic is outside the finite supported domain. No valuation is released.'
});
export const CEVA_OPTION_KEYS=Object.freeze(['minimumOperatingCash','offshoreTaxHaircut','awardClaimMultiplier']);
export const cevaFinite=x=>typeof x==='number'&&Number.isFinite(x);
export function cevaError(message,status='invalid_assumptions'){
 const e=Error(message);Object.assign(e,{status,enterprise:null,equity:null,perShare:null,conditional_value_per_share:null});return e;
}
export const cevaValidationError=issues=>cevaError(issues.join(' '),'invalid');
const fail=(key,status)=>{throw cevaError(CEVA_ERRORS[key]||key,status);};
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const near=(x,y)=>cevaFinite(x)&&cevaFinite(y)&&Math.abs(x-y)<=Math.max(1e-9,Math.abs(y)*1e-11);
const bounds=(x,lo,hi)=>cevaFinite(x)&&x>=lo&&x<=hi;
export function cevaFiniteTree(x){if(typeof x==='number'&&!cevaFinite(x))fail('arithmetic');if(x&&typeof x==='object')for(const v of Object.values(x))cevaFiniteTree(v);return x;}
const SCENARIO_SCHEMA={license2026:'number',royalty2026:'number',license_growth:['number',9],royalty_growth:['number',9],margin2026:'number',terminal_margin:'number',wacc:'number',g:'number'};
const CAPITAL_SCHEMA={as_of:'string',source:'string',cash:'number',bank_deposits:'number',marketable_debt_securities:'number',liquid_assets:'number',interest_bearing_debt:'number',operating_leases:'number',lease_policy:'string',severance_net:'number',other_noncurrent_accruals:'number',common_shares:'number',rsu_psu_unvested:'number',option_shares:'number',option_exercise_price:'number',existing_award_unrecognized_expense:'number',unrecognized_award_service_years:'number',later_share_observation:{date:'string',shares:'number',use_in_June_model:'boolean'},claim_policy:'string',minimum_operating_cash:'number',foreign_liquidity:'number',repatriation_tax_base:'number',repatriation_tax_warning:'string',option_exercisable_shares:'number',option_remaining_life_years:'number',option_valuation_limitation:'string',psu_limitations:'string',disclosed_2026_psu_maximum:'number'};
const INPUT_SCHEMA={cutoff:'string',valuation_date:'string',status:'string',units:'string',capital:CAPITAL_SCHEMA,observed_H1_2026:{revenue:'number',licensing:'number',royalty:'number',ebit:'number',cfo:'number',capex:'number',sbc:'number'},cases:{bear:SCENARIO_SCHEMA,base:SCENARIO_SCHEMA,bull:SCENARIO_SCHEMA},common_assumptions:{cash_tax_rate_on_positive_ebit:'number',minimum_cash_tax_revenue_rate:'number',da_revenue_rate:'number',capex_revenue_rate:'number',incremental_working_capital_revenue_rate:'number',sbc_policy:'string',terminal_reinvestment:'string',terminal_incremental_roic:'number',discount:'string',probabilities:'string',terminal_tax_policy:'string',funding_capacity_policy:'string'},rationale:{growth:'string',margin:'string',wacc_g:'string',liquidity:'string'},version:'number',revision:'string',valuation_date_label:'string'};
function shape(value,schema){
 if(Array.isArray(schema)){if(!Array.isArray(value)||value.length!==schema[1]||Object.keys(value).length!==schema[1])fail('input');for(let i=0;i<schema[1];i++)shape(value[i],schema[0]);return;}
 if(object(schema)){if(!exact(value,Object.keys(schema)))fail('input');for(const k of Object.keys(schema))shape(value[k],schema[k]);return;}
 if(typeof value!==schema||(schema==='number'&&!cevaFinite(value)))fail('input');
}
const SOURCE_CAPITAL=Object.freeze({cash:44.301,bank_deposits:5.148,marketable_debt_securities:171.271,liquid_assets:220.72,interest_bearing_debt:0,operating_leases:17.424,severance_net:.217,other_noncurrent_accruals:1.072,common_shares:28.137917,rsu_psu_unvested:1.845728,option_shares:.030025,option_exercise_price:20.91,existing_award_unrecognized_expense:28.506,unrecognized_award_service_years:1.5,minimum_operating_cash:30,foreign_liquidity:122.7,repatriation_tax_base:0,option_exercisable_shares:.019279,option_remaining_life_years:4.4,disclosed_2026_psu_maximum:.234617});
const SOURCE_H1=Object.freeze({revenue:56.057,licensing:36.041,royalty:20.016,ebit:-7.161,cfo:.94,capex:2.949,sbc:10.543});
const SOURCE_ASSUMPTIONS=Object.freeze({cash_tax_rate_on_positive_ebit:.2,minimum_cash_tax_revenue_rate:.03,da_revenue_rate:.03,capex_revenue_rate:.035,incremental_working_capital_revenue_rate:.18,terminal_incremental_roic:.25});
function validateScenario(s){
 shape(s,SCENARIO_SCHEMA);
 if(!bounds(s.license2026,36.041,1e7)||!bounds(s.royalty2026,20.016,1e7)||s.license2026+s.royalty2026<=56.057||!bounds(s.margin2026,-.5,1)||!bounds(s.terminal_margin,.001,1)||!bounds(s.wacc,.001,.5)||!bounds(s.g,0,.05)||s.wacc<=s.g||s.g>=.25)fail('scenario');
 for(const k of ['license_growth','royalty_growth'])if(s[k].some(v=>!bounds(v,-.95,2)))fail('scenario');
}
export function validateCevaInputs(a,scenario){
 shape(a,INPUT_SCHEMA);const b=a.capital;
 if(a.version!==3||a.cutoff!=='2026-10-19'||a.valuation_date!=='2026-06-30'||a.units!=='USD millions, shares millions, per-share USD'||b.as_of!=='2026-06-30'||b.source!=='ceva20260630_10q.htm'||b.later_share_observation.date!=='2026-08-04'||b.later_share_observation.shares!==28.154072||b.later_share_observation.use_in_June_model!==false)fail('source');
 for(const [k,v]of Object.entries(SOURCE_CAPITAL))if(b[k]!==v)fail('source');
 for(const [k,v]of Object.entries(SOURCE_H1))if(a.observed_H1_2026[k]!==v)fail('source');
 for(const [k,v]of Object.entries(SOURCE_ASSUMPTIONS))if(a.common_assumptions[k]!==v)fail('source');
 for(const s of Object.values(a.cases))validateScenario(s);if(scenario!==undefined)validateScenario(scenario);return true;
}
function selected(a,name){const s=typeof name==='string'&&own(a?.cases||{},name)?a.cases[name]:object(name)?name:null;if(!s)fail('scenario');validateScenario(s);return s;}
function controls(a,values={}){
 if(!object(values)||Object.keys(values).some(k=>!CEVA_OPTION_KEYS.includes(k)))fail('controls');
 const c={minimumOperatingCash:a.capital.minimum_operating_cash,offshoreTaxHaircut:a.capital.repatriation_tax_base,awardClaimMultiplier:1,...values};
 if(!bounds(c.minimumOperatingCash,0,220.72)||!bounds(c.offshoreTaxHaircut,0,122.7)||!bounds(c.awardClaimMultiplier,1,2))fail('controls');return c;
}
const annualKeys=['year','period','revenue','margin','taxRate','reinvestment','wacc'];
const terminalKeys=['growth','margin','taxRate','roic','wacc'];
const period=i=>i===0?'H2 2026':`FY${2026+i}`;
function sourceRows(a,s){
 let license=s.license2026,royalty=s.royalty2026,previous=109.598;const rows=[];
 for(let i=0;i<10;i++){
  if(i){license*=1+s.license_growth[i-1];royalty*=1+s.royalty_growth[i-1];}
  const full=license+royalty,rev=full-(i?0:a.observed_H1_2026.revenue),gaap=full*(s.margin2026+(s.terminal_margin-s.margin2026)*i/9)-(i?0:a.observed_H1_2026.ebit);
  const reinvestment=rev*(a.common_assumptions.capex_revenue_rate-a.common_assumptions.da_revenue_rate)+(full-previous)*a.common_assumptions.incremental_working_capital_revenue_rate*(i?1:.5);
  rows.push({year:i+1,period:period(i),revenue:rev,margin:gaap/rev,taxRate:a.common_assumptions.cash_tax_rate_on_positive_ebit,reinvestment,wacc:s.wacc});previous=full;
 }
 return rows;
}
export function cevaSourceRows(a,scenarioNameOrObject='base'){validateCevaInputs(a);const s=selected(a,scenarioNameOrObject);return cevaFiniteTree(sourceRows(a,s));}
function validateSchedule(annual,t){
 if(!Array.isArray(annual)||annual.length!==10||Object.keys(annual).length!==10)fail('horizon');
 for(let i=0;i<10;i++){const r=annual[i];if(!exact(r,annualKeys))fail('fields');if(r.year!==i+1||r.period!==period(i))fail('horizon');if(!bounds(r.revenue,Number.MIN_VALUE,1e9)||!bounds(r.margin,-.5,1)||!bounds(r.taxRate,0,.6)||!bounds(r.reinvestment,-1e9,1e9)||!bounds(r.wacc,.001,.5))fail('annual');}
 if(!exact(t,terminalKeys))fail('fields');if(!bounds(t.growth,0,.05)||!bounds(t.margin,.001,1)||!bounds(t.taxRate,0,.6)||!bounds(t.roic,.001,1)||!bounds(t.wacc,.001,.5)||t.roic<=t.growth||t.wacc<=t.growth)fail('terminal');
 if(['margin','taxRate','wacc'].some(k=>!near(annual[9][k],t[k])))fail('convergence');
}
function evaluate(a,s,annual,t,c){
 validateSchedule(annual,t);
 const b=a.capital,A=a.common_assumptions,H=a.observed_H1_2026;
 let previous=109.598,discount=1,explicitPV=0,rawCash=b.liquid_assets,minimumRaw=rawCash,minimumAvailable=rawCash-c.offshoreTaxHaircut-b.severance_net-b.other_noncurrent_accruals,license=s.license2026,royalty=s.royalty2026;
 const reservedClaims=c.offshoreTaxHaircut+b.severance_net+b.other_noncurrent_accruals,openingAvailable=minimumAvailable,rows=[];
 for(let i=0;i<10;i++){
  const entered=annual[i],revenue=entered.revenue,fullRevenue=revenue+(i?0:H.revenue),gaapEbit=revenue*entered.margin;
  const oldAwardAddback=b.existing_award_unrecognized_expense*(i===0?1/3:i===1?2/3:0),economicEbit=gaapEbit+oldAwardAddback;
  const tax=Math.max(0,economicEbit*entered.taxRate,revenue*A.minimum_cash_tax_revenue_rate),da=revenue*A.da_revenue_rate,capex=revenue*A.capex_revenue_rate,deltaWc=(fullRevenue-previous)*A.incremental_working_capital_revenue_rate*(i?1:.5),floor=capex-da+deltaWc;
  if(entered.reinvestment<floor-Math.max(1e-9,Math.abs(floor)*1e-11))fail('floor');
  const nopat=economicEbit-tax,fcff=nopat-entered.reinvestment,years=i+.5;discount*=Math.pow(1+entered.wacc,i?1:.5);const pv=fcff/discount;explicitPV+=pv;rawCash+=fcff;minimumRaw=Math.min(minimumRaw,rawCash);const available=rawCash-reservedClaims;minimumAvailable=Math.min(minimumAvailable,available);
  if(i){license*=1+s.license_growth[i-1];royalty*=1+s.royalty_growth[i-1];}const refLicense=license-(i?0:H.licensing),refRoyalty=royalty-(i?0:H.royalty),factor=revenue/(refLicense+refRoyalty);
  rows.push({...entered,fiscal_year:2026+i,source_period:i?'FY':'H2',period_end:`${2026+i}-12-31`,license:refLicense*factor,royalty:refRoyalty*factor,full_year_revenue:fullRevenue,gaap_ebit:gaapEbit,old_award_addback:oldAwardAddback,economic_ebit:economicEbit,ebit:economicEbit,gaap_margin:entered.margin,economic_margin:economicEbit/revenue,tax,da,capex,delta_wc:deltaWc,nopat,net_reinvestment:entered.reinvestment,required_reinvestment:floor,physical_net_capex:capex-da,fcff,discount_years:years,discount_factor:discount,pv_fcff:pv,funding_capacity_proxy:rawCash,available_funding_capacity_proxy:available,funding_headroom:available-c.minimumOperatingCash});previous=fullRevenue;
 }
 const terminalRevenue=previous*(1+t.growth),terminalEbit=terminalRevenue*t.margin,terminalTax=Math.max(0,terminalEbit*t.taxRate,terminalRevenue*A.minimum_cash_tax_revenue_rate),terminalNopat=terminalEbit-terminalTax;
 if(terminalNopat<=0)fail('terminal');
 const terminalReinvestment=terminalNopat*t.growth/t.roic,terminalFcff=terminalNopat-terminalReinvestment,pvTerminal=terminalFcff/(t.wacc-t.growth)/discount,ev=explicitPV+pvTerminal;
 const bridge=b.liquid_assets-c.minimumOperatingCash-reservedClaims-b.interest_bearing_debt,equityBeforeOptions=ev+bridge,awardShares=b.rsu_psu_unvested*c.awardClaimMultiplier,sharesBeforeOptions=b.common_shares+awardShares;
 const optionsExercised=equityBeforeOptions/sharesBeforeOptions>b.option_exercise_price,optionShares=optionsExercised?b.option_shares:0,optionCash=optionShares*b.option_exercise_price,allocationShares=sharesBeforeOptions+optionShares,equity=equityBeforeOptions+optionCash,value=equity/allocationShares;
 const gap=Math.max(0,c.minimumOperatingCash-minimumAvailable),funding=gap>1e-8,nonpositive=equity<=0,withheld=funding||nonpositive;
 return cevaFiniteTree({enterprise_value:withheld?null:ev,equity_value_before_option_cash:withheld?null:equityBeforeOptions,equity_value:withheld?null:equity,conditional_value_per_share:withheld?null:value,pv_explicit:explicitPV,pv_terminal:pvTerminal,terminal_share_of_ev:ev>0?pvTerminal/ev:null,terminal_revenue:terminalRevenue,terminal_ebit:terminalEbit,terminal_cash_tax:terminalTax,terminal_nopat:terminalNopat,terminal_fcf:terminalFcff,terminal_reinvestment:terminalReinvestment,minimum_funding_capacity_proxy:minimumRaw,minimum_available_funding_proxy:minimumAvailable,minimum_funding_headroom:minimumAvailable-c.minimumOperatingCash,unfunded_gap:gap,peak_funding_gap:gap,funding_required:funding,nonpositive_equity:nonpositive,opening_funding_capacity_proxy:b.liquid_assets,opening_available_funding_proxy:openingAvailable,opening_reserved_claims:reservedClaims,minimum_operating_cash:c.minimumOperatingCash,capital_bridge:bridge,award_shares:awardShares,option_exercised:optionsExercised,option_shares_applied:optionShares,option_exercise_cash:optionCash,allocation_shares:allocationShares,common_shares:b.common_shares,equity_pool_before_existing_equity_claims:withheld?null:equityBeforeOptions,option_valuation_method:'endogenous-intrinsic-exercise-approximation',maximum_psu_payout_verified:false,diagnostic_enterprise_value:ev,diagnostic_equity_value_before_option_cash:equityBeforeOptions,diagnostic_equity_value:equity,diagnostic_per_share:value,headline_enterprise:withheld?null:ev,headline_equity:withheld?null:equity,headline_per_share:withheld?null:value,status:funding?'FUNDING_REQUIRED_HEADLINE_WITHHELD':nonpositive?'NONPOSITIVE_EQUITY_HEADLINE_WITHHELD':'VALID_CONDITIONAL_RESEARCH',publication_eligible:false,current_valuation_eligible:false,current_price_target_eligible:false,upside_eligible:false,expected_return_eligible:false,recommendation_eligible:false,historical_backtest_eligible:false,ranking_eligible:false,rows,controls:c});
}
export function evaluateCevaSchedule(a,scenarioNameOrObject,annual,terminal,controlValues={}){validateCevaInputs(a);const s=selected(a,scenarioNameOrObject),c=controls(a,controlValues);return evaluate(a,s,annual,terminal,c);}
export function calculateCeva(a,scenarioNameOrObject='base',overrides={}){
 validateCevaInputs(a);if(!object(overrides)||Object.keys(overrides).some(k=>!['wacc','g',...CEVA_OPTION_KEYS].includes(k)))fail('fields');
 const s=structuredClone(selected(a,scenarioNameOrObject));if(own(overrides,'wacc'))s.wacc=overrides.wacc;if(own(overrides,'g'))s.g=overrides.g;validateScenario(s);
 const controlValues=Object.fromEntries(Object.entries(overrides).filter(([k])=>CEVA_OPTION_KEYS.includes(k))),annual=sourceRows(a,s),t={growth:s.g,margin:s.terminal_margin,taxRate:a.common_assumptions.cash_tax_rate_on_positive_ebit,roic:a.common_assumptions.terminal_incremental_roic,wacc:s.wacc};return evaluate(a,s,annual,t,controls(a,controlValues));
}
const ROOT_KEYS=new Set(['schemaVersion','profileId','version','incrementalResearch','caseId','sourceScenario','forecastHorizonYears','ticker','currency','informationAsOf','discountOrigin','anchor','annual','terminal','timing','bridgeInputs','notes','userEdited','capitalPolicy','updatedAt','researchSimulationConfig','researchPreset','selectedIncrementalScenario','marginPath']);
export function cevaContext(d,overrides={}){
 if(!object(d))fail('fields');const r=incrementalRecord(d.ticker);
 if(r?.bridge?.type!=='ceva-v3'||!incrementalIdentityValid(d))fail('identity');
 if(Object.keys(d).some(k=>!ROOT_KEYS.has(k))||!exact(d.bridgeInputs,CEVA_OPTION_KEYS)||!object(overrides)||Object.keys(overrides).some(k=>!CEVA_OPTION_KEYS.includes(k)))fail('fields');
 const c=d.selectedIncrementalScenario?r.alternatives.find(x=>x.name===d.selectedIncrementalScenario)?.annualCase:r.annualCase;
 if(!c||!own(r.sourceInputs.cases,c.sourceScenario||'base'))fail('identity');const m=r.sourceInputs,s=m.cases[c.sourceScenario||'base'],values=controls(m,{...d.bridgeInputs,...overrides});validateCevaInputs(m,s);
 if(d.schemaVersion!==1||d.forecastHorizonYears!==10||!Array.isArray(d.annual)||d.annual.length!==10)fail('horizon');
 if(d.currency!=='USD'||d.discountOrigin!=='2026-06-30'||d.informationAsOf!=='2026-10-19')fail('basis');
 if(!exact(d.timing,['mode','asOf','stubFCFF','stubDiscountRate','reason'])||d.timing.mode!=='origin'||d.timing.asOf!==d.informationAsOf||d.timing.stubFCFF!==null||!bounds(d.timing.stubDiscountRate,.001,.5)||typeof d.timing.reason!=='string')fail('timing');
 if(typeof d.notes!=='string'||typeof d.userEdited!=='boolean'||typeof d.capitalPolicy!=='string'||!(d.updatedAt===null||typeof d.updatedAt==='string'))fail('fields');
 validateSchedule(d.annual,d.terminal);return {r,c,m,s,values,annual:d.annual};
}
function requireHeadline(result){
 if(result.funding_required){const e=cevaError(CEVA_ERRORS.funding,'unsupported_funding_gap');Object.assign(e,{peakUnfundedGap:result.peak_funding_gap,fundingRequired:true,fundingDiagnostics:result});throw e;}
 if(result.nonpositive_equity){const e=cevaError(CEVA_ERRORS.nonpositive,'nonpositive_equity');e.fundingDiagnostics=result;throw e;}
}
export function cevaDraftIssues(d){if(d?.ticker!=='CEVA')return [];try{const {m,s,values}=cevaContext(d);evaluateCevaSchedule(m,s,d.annual,d.terminal,values);return [];}catch(e){return [Object.values(CEVA_ERRORS).includes(e.message)?e.message:CEVA_ERRORS.fields];}}
export function calculateCevaOperating(d,overrides={}){
 const {r,m,s,values}=cevaContext(d,overrides),o=evaluateCevaSchedule(m,s,d.annual,d.terminal,values);requireHeadline(o);
 let priorFull=109.598,cumulative=0,trough=0;
 const rows=o.rows.map(x=>{const delta=x.full_year_revenue-priorFull,growth=x.full_year_revenue/priorFull-1;priorFull=x.full_year_revenue;cumulative+=x.fcff;trough=Math.min(trough,cumulative);return {...x,margin:x.gaap_margin,growth,discountFactor:x.discount_factor,pv:x.pv_fcff,cumulativeFCFF:cumulative,derivedSalesCapital:x.reinvestment!==0?delta*(x.year===1?.5:1)/x.reinvestment:null,physicalNetCapex:x.physical_net_capex,incrementalNWC:x.delta_wc,requiredInvestment:x.required_reinvestment,fundingFloor:x.required_reinvestment,enteredReinvestment:x.reinvestment,investmentFloorTopUp:0,liquidityAfterReservedClaims:x.available_funding_capacity_proxy,liquidityAboveFloor:x.funding_headroom};});
 const t=d.terminal,last=rows[9],terminal={...t,revenue:o.terminal_revenue,ebit:o.terminal_ebit,tax:o.terminal_cash_tax,nopat:o.terminal_nopat,reinvestment:o.terminal_reinvestment,fcff:o.terminal_fcf,value:o.terminal_fcf/(t.wacc-t.growth),pv:o.pv_terminal,discountFactor:last.discountFactor,fcffGrowth:last.fcff!==0?o.terminal_fcf/last.fcff-1:null,revenueGrowthEndpointDifference:last.growth-t.growth,roicBasedReinvestment:o.terminal_reinvestment};
 const liquidityTests=[{point:'opening_after_reserved_claims',cash:o.opening_available_funding_proxy,minimum:values.minimumOperatingCash},...rows.map(x=>({point:x.period_end,cash:x.available_funding_capacity_proxy,minimum:values.minimumOperatingCash}))];
 return cevaFiniteTree({ticker:'CEVA',currency:'USD',informationAsOf:d.informationAsOf,discountOrigin:d.discountOrigin,rows,terminal,forecastPV:o.pv_explicit,terminalPV:o.pv_terminal,enterprise:o.enterprise_value,terminalShare:o.terminal_share_of_ev,peakEconomicDeficit:Math.max(0,-trough),negativeFCFFYears:rows.filter(x=>x.fcff<0).length,liquidityTests,minimumModeledLiquidity:o.minimum_funding_headroom,minimumFundingCapacityProxy:o.minimum_funding_capacity_proxy,minimumAvailableFundingProxy:o.minimum_available_funding_proxy,peakUnfundedGap:o.peak_funding_gap,fundingRequired:false,openingReservedCash:o.opening_reserved_claims+values.minimumOperatingCash,openingSurplus:o.capital_bridge,warnings:[...Object.values(CEVA_ADAPTER_NOTES),...(r.bridge.notes||[])],classification:CEVA_ADAPTER_NOTES.scope,segmentMapping:CEVA_ADAPTER_NOTES.mapping,capitalTransitionPolicy:CEVA_ADAPTER_NOTES.terminal,historicalBacktestEligible:false,currentValuationEligible:false,currentPriceTargetEligible:false,priceComparisonEligible:false,upsideEligible:false,expectedReturnEligible:false,recommendationEligible:false,publicationEligible:false,asKnownBacktestEligible:false,rankingEligible:false});
}
export function calculateCevaBridge(d,enterprise,options={}){
 if(!object(options))fail('fields');const extra={...options};for(const k of ['calculationDate','outputCurrency','securityBasis','informationAsOf'])delete extra[k];
 if(options.calculationDate!==undefined&&options.calculationDate!=='2026-06-30'||options.outputCurrency!==undefined&&options.outputCurrency!=='USD'||options.securityBasis!==undefined&&options.securityBasis!=='ordinary-common'||options.informationAsOf!==undefined&&options.informationAsOf!=='2026-10-19')fail('basis');
 const {r,m,s,values}=cevaContext(d,extra),o=evaluateCevaSchedule(m,s,d.annual,d.terminal,values);requireHeadline(o);if(!near(enterprise,o.enterprise_value))fail('stale');
 const b=m.capital,claims=values.minimumOperatingCash+values.offshoreTaxHaircut+b.severance_net+b.other_noncurrent_accruals+b.interest_bearing_debt;
 const rows=[['cash','June 30 cash, deposits and marketable debt securities',b.liquid_assets,'asset'],['operatingCash','Required operating-cash reserve',values.minimumOperatingCash,'claim'],['offshoreHaircut','Conditional offshore-access tax haircut',values.offshoreTaxHaircut,'claim'],['netSeverance','Severance liability less dedicated fund',b.severance_net,'claim'],['otherClaims','Other noncurrent accruals',b.other_noncurrent_accruals,'claim'],['interestBearingDebt','Interest-bearing debt',b.interest_bearing_debt,'claim'],['optionCash','Endogenous option-exercise proceeds',o.option_exercise_cash,'asset'],['operatingLeases','Operating leases already expensed; no duplicate debt claim',0,'claim']].map(([id,label,amount,kind])=>({id,label,amount,kind,currency:'USD',referenceDate:'2026-06-30',classification:'Retrospective dated conditional research'}));
 return cevaFiniteTree({modelId:r.identity.version,ticker:'CEVA',currency:'USD',moneyUnit:'millions',enterprise,operatingEV:enterprise,referenceDate:'2026-06-30',capitalReferenceDate:'2026-06-30',shareReferenceDate:'2026-06-30',discountOrigin:'2026-06-30',calculationDate:'2026-06-30',informationAsOf:'2026-10-19',currentCapitalVerified:false,priceComparisonEligible:false,asKnownBacktestEligible:false,currentValuationEligible:false,currentPriceTargetEligible:false,historicalBacktestEligible:false,rankingEligible:false,upsideEligible:false,expectedReturnEligible:false,recommendationEligible:false,publicationEligible:false,classification:r.bridge.classification,securityBasis:r.bridge.shareBasis,claimCompleteness:'conditional',sources:r.sources.filter(x=>x.url),inputs:values,optionDefinitions:r.bridge.options,warnings:[...Object.values(CEVA_ADAPTER_NOTES),...(r.bridge.notes||[]),...(r.bridge.unresolved||[])],unresolved:r.bridge.unresolved||[],basisMismatch:false,claimRepricedPerTrial:true,claimAllocationModel:'ceva-conditional-v3',status:'conditional',eligible:true,rows,assetTotal:b.liquid_assets+o.option_exercise_cash,claimTotal:claims,equity:o.equity_value,perShare:o.conditional_value_per_share,rawPerShare:o.conditional_value_per_share,economicEquityDiagnostic:o.equity_value,diagnosticPerShare:o.conditional_value_per_share,allocationShares:o.allocation_shares,basicShares:b.common_shares,awardShares:o.award_shares,optionSharesApplied:o.option_shares_applied,optionExerciseCash:o.option_exercise_cash,optionExercised:o.option_exercised,optionValuationMethod:o.option_valuation_method,maximumPsuPayoutVerified:false,shareCountIsProxy:false,equityPoolBeforeExistingEquityClaims:o.equity_pool_before_existing_equity_claims,minimumModeledLiquidity:o.minimum_funding_headroom,minimumFundingCapacityProxy:o.minimum_funding_capacity_proxy,minimumAvailableFundingProxy:o.minimum_available_funding_proxy,peakUnfundedGap:o.peak_funding_gap,fundingRequired:false,allocationLabel:'Conditional USD per June common share after reported aggregate awards and intrinsic-option approximation; maximum PSU payout unresolved'});
}
export function calculateCevaSensitivity(d){
 const op=calculateCevaOperating(d),rates=[-.01,0,.01].map(shift=>{const next=structuredClone(d);next.annual.forEach(r=>r.wacc+=shift);next.terminal.wacc+=shift;try{return {waccShift:shift,enterprise:calculateCevaOperating(next).enterprise};}catch(e){return {waccShift:shift,enterprise:null,error:e.message};}});
 return {base:op.enterprise,normalized:op.enterprise,normalizationDelta:0,normalizedTerminalFCFFGrowth:op.terminal.fcffGrowth,normalizationLabel:CEVA_ADAPTER_NOTES.terminal,rates};
}
