// Current-only source-matched shareholder cash-flow bases. Customer balances,
// operating financing and already-attributed minority earnings are never treated
// as a second enterprise-to-equity bridge.
import {financialModels} from './financial-model-data.js';
const finite=Number.isFinite;
const near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<1e-7;
export function requiresFinancialModel(snapshot){return financialModels.some(d=>d.ticker===snapshot?.ticker&&d.snapshotIds.includes(snapshot?.raw?.id));}
export function financialDefinition(snapshot){
 const r=snapshot?.raw,d=financialModels.find(d=>d.ticker===snapshot?.ticker&&d.snapshotIds.includes(r?.id));
 if(!d||snapshot.researchImported||r?.researchImported||r?.financialModelId!==d.id||snapshot.periodEnd!==d.periodEnd||snapshot.sourceUrl!==d.sourceUrl||snapshot.currency!==d.currency)return null;
 if(!Object.entries(d.reportedTuple).every(([key,value])=>value===null?r[key]===null:near(r[key],value)))return null;
 if(snapshot.financialModelId&&(!near(snapshot.revenue,d.modelRevenue)||!near(snapshot.ebit,d.modelPretaxIncome)||!near(snapshot.cash,d.surplusCash)||!near(snapshot.debt,d.financingClaim)||!near(snapshot.shares,d.allocationShares)))return null;
 return structuredClone(d);
}
export function financialSnapshot(snapshot){
 const d=financialDefinition(snapshot);if(!d)return snapshot;
 return {...snapshot,financialModelId:d.id,reportedRevenue:snapshot.revenue,reportedEbit:snapshot.ebit,
  revenue:d.modelRevenue,ebit:d.modelPretaxIncome,cash:d.surplusCash,debt:d.financingClaim,shares:d.allocationShares,
  shareBasis:d.shareBasis,modelType:'equity-cashflow'};
}
export function financialIssues(snapshot,draft){
 if(!requiresFinancialModel(snapshot))return [];
 const d=financialDefinition(snapshot);
 if(!d||snapshot.financialModelId!==d.id)return ['A matching dated shareholder cash-flow model is required for this financial business.'];
 if(draft.cutoff<d.evidenceAsOf)return ['The financial-business model uses evidence after the selected valuation date.'];
 return [];
}
