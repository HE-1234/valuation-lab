import {incrementalRecord} from './incremental-registry.js';
// FN's inputs exclude required operating-cash changes. The 3% reserve is a
// registry-backed policy applied to the same edited / simulated revenue path.
export function operatingCashPolicy(d){return incrementalRecord(d?.ticker)?.annualCase.operatingCashFunding;}
export function operatingCashReserve(d){const p=operatingCashPolicy(d);return p?p.ratio*d.annual[0].revenue:0;}
export function operatingCashChange(d,index,rows=d.annual){
 const p=operatingCashPolicy(d);if(!p)return 0;
 const revenue=row=>typeof row==='number'?row:row?.revenue,current=revenue(rows[index]);
 const next=index+1<rows.length?revenue(rows[index+1]):current*(1+d.terminal.growth);
 return p.ratio*next-p.ratio*current;
}
export function operatingCashIssues(d){
 const p=operatingCashPolicy(d),errors=[];
 if(JSON.stringify(d?.operatingCashFunding)!==JSON.stringify(p))errors.push('Retain the reviewed operating-cash funding policy and investment-input basis.');
 return errors;
}
