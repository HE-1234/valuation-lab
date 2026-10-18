// Optional annual margin sensitivity. Applying it is an explicit operation on a clone.
import {extendAnnualForMargin} from './annual-growth-horizon.js';
import {MARGIN_PATH_VERSION,marginPathIssues,marginAtYear} from './margin-path.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const startingIdentity=d=>JSON.stringify({caseId:d.caseId,version:d.version,discountOrigin:d.discountOrigin,anchor:d.anchor});
export function annualMarginStartingPoint(d){
 const a=d?.anchor;
 if(finite(a?.EBIT)&&finite(a?.revenue)&&a.revenue>0)return {margin:a.EBIT/a.revenue,kind:'source-anchor',label:`Year 0: ${a.period||'source anchor'} EBIT / revenue`,classification:a.classification||'Source anchor operating margin',period:a.period||null};
 const margin=d?.annual?.[0]?.margin;
 return {margin:finite(margin)?margin:null,kind:'forecast-proxy',label:'Year-1 forecast margin used as an explicit year-0 starting assumption; anchor EBIT unavailable',classification:'Analyst starting-margin assumption, not reported anchor EBIT',period:d?.annual?.[0]?.period||null};
}
export function annualMarginPathIssues(d){
 const p=d?.marginPath;
 if(p===undefined)return [];
 const errors=marginPathIssues(p);
 if(p?.enabled!==true)return errors;
 if(!errors.length){
  if(d.forecastHorizonYears<p.terminalYear)errors.push('The annual schedule must cover the independent terminal-margin year.');
  if(d.terminal?.margin!==p.terminalMargin)errors.push('Terminal operating margin must match the enabled margin-path terminal target.');
 }
 if(p.manualOverrides!==undefined&&(!object(p.manualOverrides)||Object.entries(p.manualOverrides).some(([year,margin])=>!/^([1-9]|[12][0-9]|30)$/.test(year)||!finite(margin)||margin<-.5||margin>1)))errors.push('Retain valid calendar-year margin overrides.');
 if(!object(p.startingMarginSource)||typeof p.startingMarginSource.label!=='string'||!p.startingMarginSource.label.trim())errors.push('Label the source or explicit assumption for the year-0 starting margin.');
 if(!Array.isArray(p.generatedMargins)||p.generatedMargins.length!==d.annual?.length||!p.generatedMargins.every(x=>finite(x)&&x>=-.5&&x<=1))errors.push('Retain the generated margin vector separately from annual manual edits.');
 return errors;
}

// Manual row edits are intentional overrides. Regenerating the margin controls
// replaces them; changing only growth timing must preserve them by calendar year.
export function annualMarginOverrides(d){
 const p=d?.marginPath;if(p?.enabled!==true)return {};
 const overrides=structuredClone(p.manualOverrides||{});
 d.annual.forEach((r,i)=>{
  if(r.margin!==p.generatedMargins?.[i])overrides[r.year]=r.margin;
  else delete overrides[r.year];
 });
 return overrides;
}

export function defaultAnnualMarginPath(d){
 if(object(d?.marginPath))return structuredClone(d.marginPath);
 const source=annualMarginStartingPoint(d),end=Math.min(30,Math.max(1,d?.forecastHorizonYears||10)),interimYear=Math.min(5,end),terminalMargin=d?.terminal?.margin;
 return {enabled:false,version:MARGIN_PATH_VERSION,startMargin:source.margin,interimMargin:Math.max(source.margin??0,terminalMargin??0,...(d?.annual||[]).map(r=>r.margin)),interimYear,declineStartYear:Math.max(interimYear,end-3),terminalMargin,terminalYear:end,startingMarginSource:source};
}

export function applyAnnualMarginPath(d,c,controls){
 if(!object(d)||!Array.isArray(d.annual)||!object(d.terminal))throw Error('A complete annual draft is required before applying margins.');
 if(!object(controls))throw Error('Supply explicit margin-path controls.');
 if(controls.enabled===false){
  const next=structuredClone(d);
  if(next.marginPath?.enabled===true)next.marginPath.enabled=false;
  return next;
 }
 const p={...defaultAnnualMarginPath(d),...structuredClone(controls)};
 const errors=marginPathIssues(p);if(errors.length)throw Error(errors.join(' '));
 const starting=annualMarginStartingPoint(d),prior=d.marginPath;
 const startingMarginIdentity=startingIdentity(d);
 // Source labels describe the pre-curve evidence, never a newly generated row.
 // A disabled path retains that provenance so re-enabling is equally stable.
 const sameIdentity=object(prior)&&(prior.startingMarginIdentity===startingMarginIdentity||
  (prior.startingMarginIdentity===undefined&&JSON.stringify(d.anchor)===JSON.stringify(c?.anchor)));
 const startingMarginReference=structuredClone(sameIdentity?(prior.startingMarginReference||prior.startingMarginSource||starting):starting);
 const startingMarginSource=sameIdentity&&p.startMargin===prior.startMargin&&object(prior.startingMarginSource)
  ?structuredClone(prior.startingMarginSource)
  :p.startMargin===startingMarginReference.margin?structuredClone(startingMarginReference)
  :{margin:p.startMargin,kind:'analyst-assumption',label:'Explicit analyst year-0 starting-margin assumption',classification:'Analyst assumption; does not replace source anchor EBIT',period:startingMarginReference.period};
 let next=structuredClone(d);
 next.terminal.margin=p.terminalMargin;
 // The extension helper owns annual identity and the existing capital policy.
 // Supplying the new target funds only newly added years at its mature intensity.
 delete next.marginPath;
 next=extendAnnualForMargin(next,c,p.terminalYear);
 const generatedMargins=next.annual.map(r=>marginAtYear(p,r.year));
 next.annual.forEach((r,i)=>{r.margin=generatedMargins[i];});
 next.marginPath={enabled:true,version:MARGIN_PATH_VERSION,startMargin:p.startMargin,interimMargin:p.interimMargin,interimYear:p.interimYear,declineStartYear:p.declineStartYear,terminalMargin:p.terminalMargin,terminalYear:p.terminalYear,startingMarginSource,startingMarginReference,startingMarginIdentity,generatedMargins,manualOverrides:{},
  classification:'Explicit analyst margin sensitivity; independent of revenue-growth maturity.',
  timing:'Year 0 starts at the labeled source or assumption. Reach the interim margin, hold it through decline start, reach the terminal margin on its own year, then hold it.',
  regenerationBasis:'Applying margin controls replaces annual margin overrides. Growth-horizon changes retain explicit calendar-year margin edits.'};
 next.userEdited=true;
 const issues=annualMarginPathIssues(next);if(issues.length)throw Error(issues.join(' '));
 return next;
}
