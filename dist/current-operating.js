// A documented current-only capacity ramp. Scalars remain the four sampled
// economic drivers; the same deterministic adapter constructs every annual path.
const sourceStart=-67.406/595.97;
const growthWeights=[1,15/23,11/23,7/23,5/23,3/23,11/115,1/23,1/115,0];
const referenceMargins=[-.05,0,.05,.08,.10,.12,.12,.12,.12,.12];
const marginProgress=referenceMargins.map(m=>(m-sourceStart)/(.12-sourceStart));
const capitalMultipliers=[1,1,1.25,1.5,1.75,2,2];
export function operatingProfileDefinition(snapshot,draft){
 if(draft?.operatingProfile?.id!=='aaoi-capacity-ramp-v1')return null;
 return {id:'aaoi-capacity-ramp-v1',label:'Staged capacity research case',asOf:'2026-10-17',sourceSnapshotId:'AAOI-TTM-2026-06-30',growthWeights:[...growthWeights],marginProgress:[...marginProgress],capitalMultipliers:[...capitalMultipliers],terminalCapitalIntensityFade:[1/3,2/3,1],referenceStartingMargin:sourceStart,referenceMargins:[...referenceMargins],classification:'Explicit analyst path, not issuer guidance or a fitted forecast',note:'Front-loaded growth, profitability reached during the buildout, and capital productivity initially doubling, then capital intensity fading to (1 + terminal growth) × mature margin × (1 − tax) / terminal ROIC, matching the protected engine’s terminal timing. Current-year guidance and capacity plans support the staged structure; each annual point remains an analyst assumption.'};
}
export function operatingIssues(snapshot,draft){
 const p=draft?.operatingProfile;if(p===undefined)return [];
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
 if(!(assumptions.targetMargin>0))throw Error('Staged AAOI mature margin must be positive for finite terminal-consistent capital productivity.');
 const start=(snapshot.ebit+draft.normalizationDelta)/snapshot.revenue;
 return {...assumptions,yearlyOverrides:growthWeights.map((weight,i)=>({growth:assumptions.terminalGrowth+(assumptions.growth-assumptions.terminalGrowth)*weight,margin:start+(assumptions.targetMargin-start)*marginProgress[i],salesCapital:i<7?assumptions.salesCapital*capitalMultipliers[i]:1/((1-(i-6)/3)/(2*assumptions.salesCapital)+(i-6)/3*(1+assumptions.terminalGrowth)*assumptions.targetMargin*(1-assumptions.tax)/assumptions.terminalROIC),taxRate:assumptions.tax,wacc:assumptions.wacc}))};
}
