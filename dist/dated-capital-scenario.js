// Isolated analyst scenario. No source defaults, operating model changes or future financing.
export const DATED_CAPITAL_VERSION='dated-capital-scenario-v1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const fail=message=>{throw Error(message);};
const number=(x,label,min=-Infinity)=>{if(!finite(x)||x<min)fail(`${label}: explicit finite number required${min===0?' (nonnegative)':''}.`);return x;};
const text=(x,label)=>{if(typeof x!=='string'||!x.trim())fail(`${label}: explicit explanation or identity required.`);return x;};
const list=(x,label)=>{if(!Array.isArray(x))fail(`${label}: explicit array required; unknown is not empty.`);return x;};

/** All money and share counts are in millions. Baseline claims are explicit as-of analyst values of the baseline instruments
 * before the listed conversions; their valuationDate must match asOf. Nonoperating
 * assets and reserve are selected as-of values. Completed new debt uses debt-funding events with matching explicit claims,
 * not cash adjustments. Principal-method funding needs an explicit option claim.
 * cashAdjustments bridge baseline cash to asOf, excluding issuance/conversion cash.
 * Every event must be completed; separate cash/share inclusion flags must match
 * their respective source dates. Already included legs are not added twice. Conversion removes whole
 * listed claim balances; split a partially converted series into distinct instruments.
 */
export function calculateDatedCapitalScenario(input,operating){
 if(!input||input.version!==DATED_CAPITAL_VERSION)fail('Unsupported dated capital scenario version.');
 const {asOf,currency,baseline}=input;
 if(!date(asOf)||!baseline||!date(baseline.cashDate)||!date(baseline.shareDate)||baseline.cashDate>asOf||baseline.shareDate>asOf)fail('Valid ordered baseline and as-of dates required.');
 if(!['USD','TWD'].includes(currency)||operating?.currency!==currency)fail('Operating and capital currency must match.');
 if(operating?.date!==asOf||!['scenario','as-of'].includes(operating?.status))fail('A date-reconciled as-of operating result is required.');
 const operatingEV=number(operating.enterprise,'Operating EV');
 text(input.rationale,'Scenario rationale');
 let cash=number(baseline.cash,'Baseline cash',0),shares=number(baseline.commonShares,'Baseline common shares',0);
 if(shares<=0)fail('Baseline common shares must be positive.');
 const reserve=number(input.operatingCashReserve,'Operating cash reserve',0);
 const ids=new Set(),register=(id)=>{text(id,'Record ID');if(ids.has(id))fail(`Duplicate record ID: ${id}`);ids.add(id);};
 const readClaim=c=>{
  register(c.id);text(c.instrumentId,'Claim instrument');text(c.rationale,'Claim rationale');number(c.amount,'Claim amount',0);
  if(c.valuationDate!==asOf)fail('Every claim requires an explicit matching as-of valuation date.');
  if(!['debt-principal','debt-fair-value','option','other'].includes(c.treatment))fail('Unsupported claim treatment.');
  return {...c};
 };
 const unresolved=input.claimStatus==='unresolved';
 if(input.claimStatus!==undefined&&!['complete','unresolved'].includes(input.claimStatus))fail('Unsupported claim status.');
 if(unresolved){
  if(baseline.claims!==null)fail('Unresolved claims must remain explicitly null.');
  text(input.pendingClaims,'Pending claims explanation');
  if(list(input.events,'Completed events').length)fail('Unresolved-claim diagnostic requires no events; use current estimated baselines with financing already included.');
  if(baseline.cashDate!==asOf||baseline.shareDate!==asOf)fail('Unresolved-claim diagnostic requires current dated estimated cash and share baselines.');
 }
 const claims=unresolved?[]:list(baseline.claims,'Baseline claims').map(readClaim);
 const validateClaimTreatments=()=>{for(const instrument of new Set(claims.map(c=>c.instrumentId))){
  const rows=claims.filter(c=>c.instrumentId===instrument),types=rows.map(c=>c.treatment);
  if(new Set(types).size!==types.length)fail('Duplicate claim treatment for an instrument.');
  if(types.includes('debt-principal')&&!types.includes('option')&&!types.includes('debt-fair-value'))fail('Principal-method debt requires an explicit option claim, including an explained zero when inapplicable.');
  if(types.includes('debt-fair-value')&&(types.includes('debt-principal')||types.includes('option')))fail('Fair-value debt already includes its option; duplicate debt/option claim.');
 }};validateClaimTreatments();
 const ledger=[];
 for(const a of list(input.cashAdjustments,'Cash adjustments')){
  register(a.id);text(a.rationale,'Cash adjustment rationale');number(a.amount,'Cash adjustment');
  if(!date(a.date)||a.date<=baseline.cashDate||a.date>asOf)fail('Cash adjustment must fall after baseline and on/before as-of.');
  if(!['operating-cash-change','investment-cash-change','other-cash-change'].includes(a.kind))fail('Financing belongs in completed events, not cash adjustments.');
  cash+=a.amount;ledger.push({...a});
 }
 const removed=new Set();
 for(const e of list(input.events,'Completed events')){
  register(e.id);text(e.rationale,'Event rationale');
  if(e.completed!==true)fail('Event must be completed.');
  if(!date(e.date)||e.date>asOf)fail('Future events are not current capital.');
  if(typeof e.cashIncludedInBaseline!=='boolean'||typeof e.sharesIncludedInBaseline!=='boolean')fail('Explicit separate cash/share inclusion flags required.');
  if(e.cashIncludedInBaseline!==(e.date<=baseline.cashDate)||e.sharesIncludedInBaseline!==(e.date<=baseline.shareDate))fail('Cash/share inclusion flags must match their respective baseline dates.');
  if(e.cashIncludedInBaseline&&e.sharesIncludedInBaseline)fail('Event already included in both baselines.');
  const added=number(e.sharesAdded,'Added shares',0);
  if(e.kind==='debt-funding'){
   if(added!==0)fail('Debt funding must have zero shares; conversion is separate.');
   text(e.instrumentId,'Funding instrument');
   if(claims.some(c=>c.instrumentId===e.instrumentId))fail('Funding instrument already included in claims.');
   const received=number(e.cashReceived,'Debt cash received',0),newClaims=list(e.claimsAdded,'New funding claims');
   if(!newClaims.length||!newClaims.some(c=>c.treatment==='debt-principal'||c.treatment==='debt-fair-value')||newClaims.some(c=>c.instrumentId!==e.instrumentId))fail('Debt proceeds require matching debt claims.');
   const parsed=newClaims.map(readClaim);
   if(!parsed.some(c=>c.treatment==='debt-fair-value')&&!parsed.some(c=>c.treatment==='option'))fail('Principal funding needs an explicit option claim, including an explained zero for nonconvertible debt.');
   claims.push(...parsed);validateClaimTreatments();
   const netCash=e.cashIncludedInBaseline?0:received;cash+=netCash;ledger.push({...e,netCash});
  }else if(e.kind==='equity-issuance'){
   if(added<=0)fail('Completed issuance requires positive added shares.');
   const price=number(e.issuePrice,'Issue price',0),fees=number(e.fees,'Issuance fees',0);
   if(price<=0||fees>added*price)fail('Issuance price/fees are inconsistent.');
   const netCash=e.cashIncludedInBaseline?0:added*price-fees;cash+=netCash;ledger.push({...e,netCash});
  }else if(e.kind==='debt-conversion'){
   if(added<=0)fail('Completed conversion requires positive added shares.');
   text(e.instrumentId,'Conversion instrument');
   const requested=list(e.removeClaimIds,'Conversion claims');if(!requested.length||new Set(requested).size!==requested.length)fail('Conversion needs unique matching claims.');
   const related=claims.filter(c=>c.instrumentId===e.instrumentId);
   if(!related.some(c=>c.treatment.startsWith('debt-'))||related.length!==requested.length||related.some(c=>!requested.includes(c.id)))fail('Conversion must remove matching debt and associated option claims exactly once.');
   for(const id of requested){if(removed.has(id))fail('Claim already removed by a conversion.');removed.add(id);}
   ledger.push({...e,claimRemoved:related.reduce((s,c)=>s+c.amount,0),netCash:0});
  }else fail('Unsupported completed event. Future financing is not a denominator assumption.');
  if(!e.sharesIncludedInBaseline)shares+=added;
 }
 const award=input.existingAwardSensitivity;
 if(!award||!['none','gross-shares','claim'].includes(award.method))fail('Explicit existing-award policy required.');
 number(award.shares,'Award shares',0);number(award.claim,'Award claim',0);text(award.rationale,'Award rationale');
 if((award.method!=='gross-shares'&&award.shares!==0)||(award.method!=='claim'&&award.claim!==0))fail('Existing awards cannot be counted as both shares and a claim.');
 shares+=award.shares;
 const assets=list(input.nonoperatingAssets,'Nonoperating assets').map(a=>{register(a.id);number(a.amount,'Asset amount',0);text(a.rationale,'Asset rationale');if(a.valuationDate!==asOf)fail('Every asset requires an explicit matching as-of valuation date.');return {...a};});
 if(cash<0||reserve>cash)fail('Estimated cash is negative or operating reserve exceeds it; financing remains unresolved.');
 const activeClaims=claims.filter(c=>!removed.has(c.id)),seniorClaimTotal=activeClaims.reduce((s,c)=>s+c.amount,0),assetTotal=assets.reduce((s,a)=>s+a.amount,0);
 if(unresolved){
  const preclaimResidual=operatingEV+cash-reserve+assetTotal,preclaimPerShare=preclaimResidual/shares;
  if(![cash,shares,assetTotal,preclaimResidual,preclaimPerShare].every(finite))fail('Diagnostic arithmetic exceeded finite range.');
  const message=preclaimResidual<=0?'No positive residual before unresolved claims under these operating and capital assumptions. This is not a zero-dollar stock valuation.':'Positive residual before unresolved claims; common-equity value remains uncomputed until those claims are valued.';
  return {status:'operating-only',eligible:false,modelId:DATED_CAPITAL_VERSION,currency,calculationDate:asOf,capitalReferenceDate:asOf,shareReferenceDate:asOf,operatingEV,estimatedCash:cash,operatingCashReserve:reserve,nonoperatingAssetTotal:assetTotal,allocationShares:shares,basicShares:baseline.commonShares,preclaimResidual,preclaimPerShare,equity:null,perShare:null,rawPerShare:null,flooredPerShare:null,equityFloor:null,seniorClaimTotal:null,claimTotal:null,warrantClaim:null,assetTotal:cash+assetTotal,activeClaims:null,rows:[],ledger,nonoperatingAssets:assets,pendingClaims:input.pendingClaims,message,reasons:[message,input.pendingClaims],requiredInputs:[input.pendingClaims],classification:'Conditional pre-claim diagnostic only; unresolved claims are unknown, not zero.',allocationLabel:'Residual before unresolved claims',currentCapitalVerified:false,priceComparisonEligible:false,claimCompleteness:'unresolved',warnings:[message,input.pendingClaims,'Current cash and shares are analyst estimates with completed financing already reflected. Future funding remains in operating FCFF; no extra future issuance is added.']};
 }
 const equity=operatingEV+cash-reserve+assetTotal-seniorClaimTotal-award.claim,rawPerShare=equity/shares;
 const rows=[{id:'cash',label:'Estimated current cash',amount:cash,kind:'asset'},{id:'reserve',label:'Operating cash reserve',amount:reserve,kind:'claim'},...assets.map(a=>({...a,label:a.label||a.id,kind:'asset'})),...activeClaims.map(c=>({...c,label:c.label||c.id,kind:'claim'})),{id:'awards',label:'Existing award claim sensitivity',amount:award.claim,kind:'claim'}].map(r=>({...r,referenceDate:asOf,currency,unit:'millions'}));
 if(![cash,shares,seniorClaimTotal,assetTotal,equity,rawPerShare].every(finite))fail('Capital arithmetic exceeded finite range.');
 return {status:'conditional',eligible:true,modelId:DATED_CAPITAL_VERSION,currency,calculationDate:asOf,capitalReferenceDate:asOf,shareReferenceDate:asOf,operatingEV,estimatedCash:cash,operatingCashReserve:reserve,nonoperatingAssetTotal:assetTotal,seniorClaimTotal,existingAwardClaim:award.claim,allocationShares:shares,basicShares:baseline.commonShares,assetTotal:cash+assetTotal,claimTotal:reserve+seniorClaimTotal+award.claim,warrantClaim:null,rows,sourceCashDate:baseline.cashDate,sourceShareDate:baseline.shareDate,equity,rawPerShare,perShare:rawPerShare,flooredPerShare:Math.max(0,rawPerShare),equityFloor:Math.max(0,equity),ledger,activeClaims,nonoperatingAssets:assets,classification:'Conditional dated analyst capital scenario; estimated balances and explicit claim assumptions.',allocationLabel:'Conditional current-date common-equity scenario',currentCapitalVerified:false,priceComparisonEligible:false,claimCompleteness:'conditional-assumptions',warnings:['Future financing is represented by operating FCFF; no future financing shares or second funding-deficit deduction are included.','The nonnegative display floor is not an option valuation, stock-price target or probability of default.','Existing-award sensitivity is an explicit allocation assumption; gross dilution is not an award fair-value appraisal.']};
}
