// Current-only explicit operating paths. Scalars remain the four sampled
// economic drivers; the same deterministic adapter constructs every annual path.
export const FLEXIBLE_PROFILE_ID='flexible-growth-v1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const flexible=p=>p?.id===FLEXIBLE_PROFILE_ID;
const profileKeys=['schemaVersion','id','mode','explicitYears','subsequentGrowth'];
const timelineKeys=['marginMaturityYears','capitalMaturityYears','capitalHoldYears'];
const owns=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const boundedYear=x=>Number.isInteger(x)&&x>=1&&x<=30;
const progress=(year,start,end)=>Math.max(0,Math.min(1,(year-start)/(end-start)));
// Conversion is explicit and pure: reads, restores and valuation never migrate
// a saved v1 profile. Capture its old operating timings before editing growth.
// Path fields are supplied by the UI; omitted fields retain the current path.
export function independentGrowthProfile(draft,path={}){
 if(!path||typeof path!=='object'||Array.isArray(path)||Object.keys(path).some(k=>!['mode','explicitYears','subsequentGrowth'].includes(k)))throw Error('Choose a valid independent growth path.');
 const prior=draft?.operatingProfile,isPrior=flexible(prior);
 if(isPrior&&![1,2].includes(prior.schemaVersion))throw Error('Unsupported flexible growth profile version.');
 const source=isPrior?structuredClone(prior):{id:FLEXIBLE_PROFILE_ID,mode:'immediate',explicitYears:0,subsequentGrowth:[]};
 const selected={...source,...structuredClone(path)};
 const anchors=isPrior&&prior.schemaVersion===2
  ?{}
  :isPrior
   ?{marginMaturityYears:draft.assumptions?.years,capitalMaturityYears:draft.assumptions?.years,capitalHoldYears:prior.explicitYears}
   :{marginMaturityYears:10,capitalMaturityYears:10,capitalHoldYears:selected.explicitYears};
 // Do not repair a malformed existing v2 profile or drop unexpected fields.
 // Invalid authored values stay invalid until the user explicitly edits them.
 return structuredClone({...selected,schemaVersion:2,...anchors});
}
function flexibleProfileIssue(p){
 const keys=p?.schemaVersion===2?[...profileKeys,...timelineKeys]:profileKeys;
 if(typeof p!=='object'||Array.isArray(p)||![1,2].includes(p.schemaVersion)||Object.keys(p).some(k=>!keys.includes(k))||!['immediate','maintain','annual'].includes(p.mode)||!(p.mode==='immediate'?p.explicitYears===0:[3,5].includes(p.explicitYears))||!Array.isArray(p.subsequentGrowth)||p.subsequentGrowth.length!==(p.mode==='annual'?p.explicitYears-1:0)||!Array.from(p.subsequentGrowth).every(g=>finite(g)&&g>=-.5&&g<=2))return 'Choose a valid growth path: immediate fade, or 3 / 5 explicit years with finite annual growth from −50% to 200%.';
 if(p.schemaVersion===2&&(!timelineKeys.every(k=>owns(p,k))||!boundedYear(p.marginMaturityYears)||!boundedYear(p.capitalMaturityYears)||!Number.isInteger(p.capitalHoldYears)||p.capitalHoldYears<0||p.capitalHoldYears>=p.capitalMaturityYears))return 'Independent operating timelines require margin and capital maturity years from 1 to 30, with a whole-number capital hold from zero to before capital maturity.';
 return null;
}
const sourceStart=-67.406/595.97;
const growthWeights=[1,15/23,11/23,7/23,5/23,3/23,11/115,1/23,1/115,0];
const referenceMargins=[-.05,0,.05,.08,.10,.12,.12,.12,.12,.12];
const marginProgress=referenceMargins.map(m=>(m-sourceStart)/(.12-sourceStart));
const capitalMultipliers=[1,1,1.25,1.5,1.75,2,2];
export function operatingProfileDefinition(snapshot,draft){
 const p=draft?.operatingProfile;
 if(flexible(p)&&p.schemaVersion===2)return {id:FLEXIBLE_PROFILE_ID,label:'Flexible growth and operating timelines',schemaVersion:2,mode:p.mode,explicitYears:p.explicitYears,maturityYears:draft.assumptions?.years,growthMaturityYears:draft.assumptions?.years,marginMaturityYears:p.marginMaturityYears,capitalMaturityYears:p.capitalMaturityYears,capitalHoldYears:p.capitalHoldYears,forecastYears:Math.max(draft.assumptions?.years,p.marginMaturityYears,p.capitalMaturityYears),independentTimelines:true,subsequentGrowth:Array.isArray(p.subsequentGrowth)?[...p.subsequentGrowth]:p.subsequentGrowth,classification:'User-selected analyst path, not issuer guidance or a fitted forecast',growthSampling:'One initial-growth draw shifts every explicit annual growth rate by the same percentage-point difference from the baseline; the fade then reaches fixed stable growth. No annual independent draws or clipping.',risk:'Constant WACC throughout the forecast and terminal period; no risk or capital-structure fade is modeled.',note:'Revenue growth, EBIT margin and capital efficiency have independent timelines. Completed transitions hold their mature settings; the explicit forecast continues until all three have matured. Capital intensity fades from initial sales/capital to (1 + stable growth) × mature margin × (1 − tax) / terminal ROIC. Reinvestment still funds actual incremental revenue, so growth edits can change capital spending without changing capital efficiency. Terminal ROIC remains a separate judgment.'};
 if(flexible(p))return {id:FLEXIBLE_PROFILE_ID,label:'Flexible growth and maturity',schemaVersion:1,mode:p.mode,explicitYears:p.explicitYears,maturityYears:draft.assumptions?.years,subsequentGrowth:Array.isArray(p.subsequentGrowth)?[...p.subsequentGrowth]:p.subsequentGrowth,classification:'User-selected analyst path, not issuer guidance or a fitted forecast',growthSampling:'One initial-growth draw shifts every explicit annual growth rate by the same percentage-point difference from the baseline; the fade then reaches fixed stable growth. No annual independent draws or clipping.',risk:'Constant WACC throughout the forecast and terminal period; no risk or capital-structure fade is modeled.',note:'Growth reaches stable growth in the selected maturity year. Margin converges from normalized starting EBIT to its target over the full horizon. Initial incremental capital intensity is held through the explicit phase, then fades to (1 + stable growth) × mature margin × (1 − tax) / terminal ROIC. Synchronizing margin and capital maturity is a modeling simplification; terminal ROIC remains a separate judgment.'};
 if(p?.id!=='aaoi-capacity-ramp-v1')return null;
 return {id:'aaoi-capacity-ramp-v1',label:'Staged capacity research case',asOf:'2026-10-17',sourceSnapshotId:'AAOI-TTM-2026-06-30',growthWeights:[...growthWeights],marginProgress:[...marginProgress],capitalMultipliers:[...capitalMultipliers],terminalCapitalIntensityFade:[1/3,2/3,1],referenceStartingMargin:sourceStart,referenceMargins:[...referenceMargins],classification:'Explicit analyst path, not issuer guidance or a fitted forecast',note:'Front-loaded growth, profitability reached during the buildout, and capital productivity initially doubling, then capital intensity fading to (1 + terminal growth) × mature margin × (1 − tax) / terminal ROIC, matching the protected engine’s terminal timing. Current-year guidance and capacity plans support the staged structure; each annual point remains an analyst assumption.'};
}
export function operatingIssues(snapshot,draft){
 const p=draft?.operatingProfile;if(p===undefined)return [];
 if(flexible(p)){
  const issue=flexibleProfileIssue(p);if(issue)return [issue];
  if(!finite(draft.normalizationDelta))return ['The flexible path requires a finite starting EBIT normalization.'];
  if(![10,15,20].includes(draft.assumptions?.years))return ['Flexible maturity must be 10, 15 or 20 years.'];
  if(!(draft.assumptions?.targetMargin>0))return ['The flexible path requires a positive mature margin for finite terminal-consistent sales/capital.'];
  if(draft.assumptions?.yearlyOverrides!=null)return ['Do not combine a flexible operating profile with a second annual-override path.'];
  return [];
 }
 if(!p||typeof p!=='object'||Array.isArray(p)||p.schemaVersion!==1||Object.keys(p).some(k=>!['schemaVersion','id'].includes(k))||!['linear-v1','aaoi-capacity-ramp-v1'].includes(p.id))return ['Choose a valid operating-path profile.'];
 if(p.id==='linear-v1')return [];
 if(snapshot.ticker!=='AAOI'||snapshot.raw?.id!=='AAOI-TTM-2026-06-30'||snapshot.sourceUrl!=='https://www.sec.gov/Archives/edgar/data/1158114/000143774926026278/aaoi20260630_10q.htm'||snapshot.researchImported===true||snapshot.raw?.researchImported===true)return ['The staged AAOI operating profile requires its exact source-matched June 2026 TTM baseline.'];
 if(draft.cutoff<'2026-10-17')return ['This staged AAOI research profile was prepared on October 17, 2026; choose that date or later.'];
 if(!(draft.assumptions?.targetMargin>0))return ['The staged AAOI profile requires a positive mature margin to derive finite terminal-consistent sales/capital.'];
 if(draft.assumptions?.years!==10)return ['The staged AAOI profile requires the documented ten-year horizon.'];
 if(draft.assumptions?.yearlyOverrides!=null)return ['Do not combine the staged AAOI profile with a second annual-override path.'];
 return [];
}
export function operatingAssumptions(snapshot,draft,assumptions){
 const errors=operatingIssues(snapshot,draft);if(errors.length)throw Error(errors.join(' '));
 const profile=operatingProfileDefinition(snapshot,draft);if(!profile)return {...assumptions};
 if(profile.id===FLEXIBLE_PROFILE_ID){
  const p=draft.operatingProfile,a=assumptions,n=a.years,e=p.explicitYears;
  if(![10,15,20].includes(n)||!(a.targetMargin>0))throw Error('Flexible paths require a 10 / 15 / 20-year horizon and a positive mature margin.');
  const shift=a.growth-draft.assumptions.growth;
  const early=p.mode==='annual'?[a.growth,...p.subsequentGrowth.map(g=>g+shift)]:Array(e).fill(a.growth);
  const start=(snapshot.ebit+draft.normalizationDelta)/snapshot.revenue,terminalIntensity=(1+a.terminalGrowth)*a.targetMargin*(1-a.tax)/a.terminalROIC;
  if(p.schemaVersion===2){
   // Authored a.years remains revenue-growth maturity. Extend only the engine's
   // explicit forecast until every operating transition is terminal-consistent.
   const forecastYears=Math.max(n,p.marginMaturityYears,p.capitalMaturityYears);
   const yearlyOverrides=Array.from({length:forecastYears},(_,i)=>{
    const year=i+1,growthFade=progress(year,e,n),capitalFade=progress(year,p.capitalHoldYears,p.capitalMaturityYears);
    const growth=p.mode==='immediate'?a.growth+(a.terminalGrowth-a.growth)*Math.min(i,n-1)/(n-1):year<=e?early[i]:early[e-1]+(a.terminalGrowth-early[e-1])*growthFade;
    const intensity=(1-capitalFade)/a.salesCapital+capitalFade*terminalIntensity;
    return {growth,margin:start+(a.targetMargin-start)*Math.min(year,p.marginMaturityYears)/p.marginMaturityYears,salesCapital:1/intensity,taxRate:a.tax,wacc:a.wacc};
   });
   return {...a,years:forecastYears,yearlyOverrides};
  }
  const yearlyOverrides=Array.from({length:n},(_,i)=>{
   const year=i+1,fade=Math.max(0,(year-e)/(n-e));
   const growth=p.mode==='immediate'?a.growth+(a.terminalGrowth-a.growth)*i/(n-1):year<=e?early[i]:early[e-1]+(a.terminalGrowth-early[e-1])*fade;
   const intensity=(1-fade)/a.salesCapital+fade*terminalIntensity;
   return {growth,margin:start+(a.targetMargin-start)*year/n,salesCapital:1/intensity,taxRate:a.tax,wacc:a.wacc};
  });
  return {...a,yearlyOverrides};
 }
 if(!(assumptions.targetMargin>0))throw Error('Staged AAOI mature margin must be positive for finite terminal-consistent capital productivity.');
 const start=(snapshot.ebit+draft.normalizationDelta)/snapshot.revenue;
 return {...assumptions,yearlyOverrides:growthWeights.map((weight,i)=>({growth:assumptions.terminalGrowth+(assumptions.growth-assumptions.terminalGrowth)*weight,margin:start+(assumptions.targetMargin-start)*marginProgress[i],salesCapital:i<7?assumptions.salesCapital*capitalMultipliers[i]:1/((1-(i-6)/3)/(2*assumptions.salesCapital)+(i-6)/3*(1+assumptions.terminalGrowth)*assumptions.targetMargin*(1-assumptions.tax)/assumptions.terminalROIC),taxRate:assumptions.tax,wacc:assumptions.wacc}))};
}
