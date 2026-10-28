// Guided offers annual flows or TTM flows, never an interim/YTD observation.
// Keep the source library intact for evidence views and other workspaces.
export function guidedBasesFor(company) {
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const completeness=s=>['cash','debt','shares'].filter(k=>finite(s[k]??s.facts?.[k])).length;
 const pick=mode=>(company?.snapshots||[]).filter(s=>s.snapshotMode===mode)
  .sort((a,b)=>String(b.periodEnd).localeCompare(String(a.periodEnd))||completeness(b)-completeness(a))[0];
 const annual=pick('annual-reference'),ttm=pick('ttm');
 return [annual,ttm&&(!annual||ttm.periodEnd>annual.periodEnd)?ttm:null].filter(Boolean);
}
