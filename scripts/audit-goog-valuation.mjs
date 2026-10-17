// Independent arithmetic audit of the 2026-10-17 Google case.
// Run: node scripts/audit-goog-valuation.mjs
// No network calls, writes, price targets, fitting, or production valuation imports.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, root), 'utf8'));
const universe = read('dist/data/current-universe.json');
const company = universe.companies.find(c => c.ticker === 'GOOG');
const snapshot = company.snapshots.find(s => s.id === 'GOOG-TTM-2026-06-30');
const base = read('dist/data/company-base-cases.json').companies.GOOG;
const facts = snapshot.facts;
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b)), `${label}: ${a} != ${b}`);
assert.equal(snapshot.sourceUrl, 'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm');
for (const [key, expected] of Object.entries({revenue:445866, operatingIncome:147628, cash:242474, debt:100164, shares:12230})) {
  assert.equal(facts[key], expected, `Audited source fact changed: ${key}`);
}

// Preserve the audited assumptions even if a future release changes its defaults.
const audited = {growth:.18, targetMargin:.30, tax:.22, salesCapital:.7, wacc:.10, terminalGrowth:.025, terminalROIC:.15};
const claims = {cash:242474, debt:100164, commonShares:12230, conversionShares:54.45825, investments:145587, financeLeases:2590, nci:7100};
function dividendPV(dayBasis = 365.25) {
  const schedule = [{date:'2026-08-15', amount:19.25 * 12.15}];
  for (let year = 2026; year <= 2029; year++) for (const month of [2,5,8,11]) {
    const date = `${year}-${String(month).padStart(2,'0')}-15`;
    if (date > '2026-08-15' && date <= '2029-05-15') schedule.push({date, amount:19250 * .0625 / 4});
  }
  return schedule.reduce((sum, row) => sum + row.amount / 1.0625 ** ((Date.parse(row.date) - Date.parse('2026-06-30')) / (dayBasis * 86400000)), 0);
}
const dividends = dividendPV();
const allocationShares = claims.commonShares + claims.conversionShares;
const netBridge = claims.cash - claims.debt + claims.investments - claims.financeLeases - claims.nci - dividends;

export function auditValue(a = audited, {years = 10, explicitYears = 1, capitalFade = false, growthPath} = {}) {
  assert.ok(years > explicitYears && explicitYears >= 0);
  const startMargin = facts.operatingIncome / facts.revenue;
  const terminalIntensity = (1 + a.terminalGrowth) * a.targetMargin * (1 - a.tax) / a.terminalROIC;
  let revenue = facts.revenue;
  const rows = Array.from({length:years}, (_, i) => {
    const year = i + 1;
    const t = Math.max(0, (year - explicitYears) / (years - explicitYears));
    const growth = growthPath?.[i] ?? a.growth + (a.terminalGrowth - a.growth) * t;
    const margin = startMargin + (a.targetMargin - startMargin) * year / years;
    const intensity = capitalFade ? (1 - t) / a.salesCapital + t * terminalIntensity : 1 / a.salesCapital;
    const nextRevenue = revenue * (1 + growth);
    const nopat = nextRevenue * margin * (1 - a.tax);
    const reinvestment = Math.max(0, (nextRevenue - revenue) * intensity);
    const fcff = nopat - reinvestment;
    revenue = nextRevenue;
    return {year,growth,margin,salesCapital:1/intensity,revenue,nopat,reinvestment,fcff,pv:fcff/(1+a.wacc)**year};
  });
  const terminalNopat = revenue * (1 + a.terminalGrowth) * a.targetMargin * (1 - a.tax);
  const terminalFCFF = terminalNopat * (1 - a.terminalGrowth/a.terminalROIC);
  const terminalPV = terminalFCFF / (a.wacc - a.terminalGrowth) / (1+a.wacc)**years;
  const forecastPV = rows.reduce((sum,r) => sum+r.pv,0);
  const enterprise = forecastPV + terminalPV;
  const perShare = Math.max(0, enterprise + netBridge) / allocationShares;
  if (capitalFade) near(rows.at(-1).fcff * (1+a.terminalGrowth), terminalFCFF, 'Terminal FCFF continuity');
  return {years,explicitYears,capitalFade,perShare,enterprise,forecastPV,terminalPV,terminalShare:terminalPV/enterprise,
    maturityRevenue:revenue,revenueMultiple:revenue/facts.revenue,revenueCAGR:(revenue/facts.revenue)**(1/years)-1,
    cumulativeReinvestment:rows.reduce((sum,r) => sum+r.reinvestment,0),terminalSalesCapital:1/terminalIntensity,terminalFCFF,rows};
}
const legacy = auditValue();
near(legacy.perShare,167.71177213748823,'Legacy Google per-share value');
near(legacy.enterprise,1785274.5923152026,'Legacy operating enterprise value');
near(legacy.forecastPV,581953.9303071608,'Legacy explicit FCFF present value');
near(legacy.terminalPV,1203320.6620080417,'Legacy terminal present value');
const summarize = ({rows,...rest}) => rest;
const comparisons = [10,15,20].flatMap(years => [3,5].flatMap(explicitYears => [false,true].map(capitalFade => summarize(auditValue(audited,{years,explicitYears,capitalFade})))));
const sensitivities = Object.entries({growth:[.10,.18,.24,.25], targetMargin:[.27,.30,facts.operatingIncome/facts.revenue,.35], salesCapital:[.5,.7,1,1.4,2], wacc:[.08,.085,.09,.0976771,.10,.11], terminalGrowth:[.02,.025,.03],terminalROIC:[.10,.15,.20],tax:[.18,.20,.22,.25]}).flatMap(([key,values])=>values.map(value=>({key,value,perShare:auditValue({...audited,[key]:value}).perShare})));
const decomposition = Object.fromEntries(Object.entries({explicitFCFF:legacy.forecastPV,terminal:legacy.terminalPV,cashAndCurrentMarketables:claims.cash,debt:-claims.debt,noncurrentInvestments:claims.investments,financeLeases:-claims.financeLeases,nci:-claims.nci,preferredDividends:-dividends}).map(([key,value])=>[key,value/allocationShares]));
near(Object.values(decomposition).reduce((sum,x)=>sum+x,0),legacy.perShare,'Per-share decomposition');
console.log(JSON.stringify({auditDate:'2026-10-17',auditedCommit:'2fbb15601219afd184a903d86e8119df8ba96840',classification:'Conditional arithmetic sensitivities, not a recommendation or price-target calibration',snapshotId:snapshot.id,auditedAssumptions:audited,currentBaseCaseAssumptions:base.assumptions,legacy:summarize(legacy),legacyRows:legacy.rows,claims:{...claims,dividendPV:dividends,allocationShares,netBridge},decomposition,comparisons,sensitivities,documentationDayCountDifference:{runtime365_25:dividends,research365:dividendPV(365),perShareDifference:(dividends-dividendPV(365))/allocationShares}},null,2));
