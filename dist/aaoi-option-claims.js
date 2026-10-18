/** AAOI conditional option-inclusive claims approximation; NOT contract-complete fair value.
 * All money and share counts use millions; prices are USD/share; rates are decimals.
 * Caller supplies poolBeforeNoteAndWarrants = operating EV + eligible cash/assets
 * minus bank/vendor/other claims, before the WHOLE convertible and warrants.
 * commonShares includes the caller's selected existing restricted-share policy ONLY.
 * Never add conversion/warrant exercise shares or exercise proceeds again.
 * Each invocation reprices options from its own pool, including every simulation draw.
 * riskFreeRate and riskFreeRate+creditSpread are annual-effective proxies;
 * BSM uses log1p(riskFreeRate). Dates use ACT/365.25. Coupon dates are explicit;
 * equal coupons = notePrincipal * noteCouponRate / noteCouponFrequency (usually 2).
 */
const freezeDeep=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freezeDeep);Object.freeze(o);}return o;};
export const AAOI_OPTION_LIMITATIONS=freezeDeep([
  'Conditional dilution-adjusted European approximation, not a contract-complete fair-value appraisal.',
  'Omits issuer calls, conditional early conversion, make-whole, settlement averaging and default/equity coupling.',
  'Full warrant cap assumes vesting; extension, cancellation and purchase-linked vesting paths are not modeled.',
  'Joint fixed point approximates cross-dilution across different maturities; it is not an exact multi-claim lattice.',
  'Historical grant volatility and analyst credit spread are assumptions, not current observed security prices.',
  'Negative common residual is retained as a signed funding diagnostic, not a tradable negative share price.'
]);
export const AAOI_OPTION_DEFAULTS=freezeDeep({
  asOf:'2026-10-17',notePrincipal:124.925,conversionShares:2.88431837,
  noteCouponRate:0.0275,noteCouponFrequency:2,noteMaturity:'2030-01-15',
  noteCouponDates:['2027-01-15','2027-07-15','2028-01-15','2028-07-15','2029-01-15','2029-07-15','2030-01-15'],
  warrantShares:7.945399,warrantStrike:23.6954,warrantExpiry:'2035-03-13',
  riskFreeRate:0.0509,volatility:0.8,creditSpread:0.05,dividendYield:0,
  provenance:{
    note:'https://www.sec.gov/Archives/edgar/data/1158114/000143774926026278/aaoi20260630_10q.htm',
    indenture:'https://www.sec.gov/Archives/edgar/data/1158114/000110465924131385/tm2431223d10_ex4-1.htm',
    warrant:'https://www.sec.gov/Archives/edgar/data/1158114/000168316825001580/appliedopto_ex0401.htm',
    historicalVolatility:'https://investors.ao-inc.com/node/16686/html',
    riskFree:'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?field_tdr_date_value_month=202610&type=daily_treasury_yield_curve',
    methodology:'https://pages.stern.nyu.edu/adamodar/pdfiles/eqnotes/dcfall2pg.pdf'
  },
  rationale:{
    note:'June principal carried forward unchanged; contractual coupons and conversion rate.',
    warrant:'Full-cap vesting assumption. Contract strike23.6954 differs from notes23.6956; discrepancy retained.',
    volatility:'Historical grant80% reused as analyst current volatility;60/100% stresses are not probabilities.',
    riskFree:'Observed Oct16 Treasury10-year par5.09% used as flat annual-effective proxy, not term-matched zero curve.',
    creditSpread:'500bp analyst assumption;300/800bp stresses, not observed AAOI spread.',
    dividendYield:'Zero forward assumption, consistent with historical grant model.'
  }
});
const DAY=86400000;
const dateMs=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return NaN;const d=Date.parse(s+'T00:00:00Z');return Number.isFinite(d)&&new Date(d).toISOString().slice(0,10)===s?d:NaN;};
// Abramowitz-Stegun normal CDF; absolute error < ~8e-8, tested against Python erf baseline.
const normalCDF=x=>{const a=Math.abs(x),t=1/(1+0.2316419*a);const tail=Math.exp(-a*a/2)/Math.sqrt(2*Math.PI)*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?1-tail:tail;};
function call(s,k,T,r,vol,q){
  if(s<=0)return 0;
  if(vol===0)return Math.max(s*Math.exp(-q*T)-k*Math.exp(-r*T),0);
  const root=vol*Math.sqrt(T),d1=(Math.log(s/k)+(r-q+vol*vol/2)*T)/root;
  return Math.max(0,s*Math.exp(-q*T)*normalCDF(d1)-k*Math.exp(-r*T)*normalCDF(d1-root));
}
const invalid=errors=>({valid:false,status:'invalid-inputs',errors,commonPrice:null,commonEquity:null,noteStraightPV:null,noteConversionOption:null,noteTotal:null,warrantValue:null,claimReconciliationResidual:null,iterations:0,limitations:[...AAOI_OPTION_LIMITATIONS]});
export function priceAaoiOptionClaims(inputs){
  if(!inputs||typeof inputs!=='object'||Array.isArray(inputs))return invalid(['inputs must be an object']);
  const x=inputs,errors=[];
  for(const key of ['poolBeforeNoteAndWarrants','commonShares','notePrincipal','conversionShares','noteCouponRate','noteCouponFrequency','warrantShares','warrantStrike','riskFreeRate','volatility','creditSpread','dividendYield'])if(typeof x[key]!=='number'||!Number.isFinite(x[key]))errors.push(key+' must be a finite number');
  if(errors.length)return invalid(errors);
  if(x.commonShares<=0)errors.push('commonShares must be positive');
  for(const key of ['notePrincipal','conversionShares','warrantStrike'])if(x[key]<=0)errors.push(key+' must be positive');
  for(const key of ['noteCouponRate','warrantShares','volatility','creditSpread','dividendYield'])if(x[key]<0)errors.push(key+' must be nonnegative');
  if(!Number.isInteger(x.noteCouponFrequency)||x.noteCouponFrequency<1)errors.push('noteCouponFrequency must be a positive integer');
  if(x.riskFreeRate<=-1||x.riskFreeRate+x.creditSpread<=-1)errors.push('effective discount rates must exceed -1');
  const asOf=dateMs(x.asOf),nm=dateMs(x.noteMaturity),we=dateMs(x.warrantExpiry);
  if(!Number.isFinite(asOf))errors.push('asOf must be a valid YYYY-MM-DD date');
  if(!Number.isFinite(nm)||nm<=asOf)errors.push('noteMaturity must be a valid date after asOf');
  if(!Number.isFinite(we)||we<=asOf)errors.push('warrantExpiry must be a valid date after asOf');
  if(!Array.isArray(x.noteCouponDates)||!x.noteCouponDates.length)errors.push('noteCouponDates must be a nonempty explicit date array');
  else {let prior=asOf;for(const d of x.noteCouponDates){const m=dateMs(d);if(!Number.isFinite(m)||m<=prior||m>nm)errors.push('coupon dates must be valid, strictly ordered, after asOf and no later than maturity');prior=m;}if(x.noteCouponDates.at(-1)!==x.noteMaturity)errors.push('last coupon date must equal noteMaturity');}
  if(errors.length)return invalid(errors);
  const years=d=>(d-asOf)/DAY/365.25,Tc=years(nm),Tw=years(we),N=x.commonShares,C=x.conversionShares,W=x.warrantShares;
  const yieldDebt=x.riskFreeRate+x.creditSpread,r=Math.log1p(x.riskFreeRate),coupon=x.notePrincipal*x.noteCouponRate/x.noteCouponFrequency;
  const noteStraightPV=x.noteCouponDates.reduce((sum,d)=>sum+coupon/(1+yieldDebt)**years(dateMs(d)),0)+x.notePrincipal/(1+yieldDebt)**Tc;
  if(!Number.isFinite(noteStraightPV))return invalid(['discounted note value is nonfinite']);
  const E=x.poolBeforeNoteAndWarrants-noteStraightPV,Kc=x.notePrincipal/C;
  let vc=0,vw=0,iterations=0,converged=E<=0;
  if(E>0){for(iterations=1;iterations<=1000;iterations++){
    const nc=C*N/(N+C)*call(Math.max(E-vw,0)/N,Kc,Tc,r,x.volatility,x.dividendYield);
    const nw=W*N/(N+W)*call(Math.max(E-vc,0)/N,x.warrantStrike,Tw,r,x.volatility,x.dividendYield);
    if(!Number.isFinite(nc)||!Number.isFinite(nw))return invalid(['option values are nonfinite']);
    const error=Math.max(Math.abs(nc-vc),Math.abs(nw-vw));vc=(vc+nc)/2;vw=(vw+nw)/2;
    if(error<1e-10){converged=true;break;}
  }}
  if(!converged)return invalid(['option fixed point did not converge']);
  const commonEquity=E-vc-vw,commonPrice=commonEquity/N,noteTotal=noteStraightPV+vc;
  const claimReconciliationResidual=x.poolBeforeNoteAndWarrants-(commonEquity+noteTotal+vw);
  if(![commonEquity,commonPrice,noteTotal,claimReconciliationResidual].every(Number.isFinite))return invalid(['final claim outputs are nonfinite']);
  return {valid:true,status:commonEquity<0?'signed-negative-residual':'conditional-option-approximation',errors:[],
    commonPrice,commonEquity,noteStraightPV,noteConversionOption:vc,noteTotal,warrantValue:vw,
    claimReconciliationResidual,iterations,
    commonSharesUsed:N,conversionSharesInDenominator:0,warrantSharesInDenominator:0,
    noteTermYears:Tc,warrantTermYears:Tw,couponPayment:coupon,
    model:'joint-dilution-adjusted-european-approximation',limitations:[...AAOI_OPTION_LIMITATIONS]};
}
