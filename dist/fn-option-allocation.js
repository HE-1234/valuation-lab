// Source-compatible European-call allocation, USD millions and million shares.
// E = (ordinary + existing zero-strike awards) * P + warrants * call(P).
// No market price, EPS denominator or separate exercise proceeds are used.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function fnNormalCDF(z){
 if(!finite(z))throw Error('Normal argument must be finite.');
 if(z>=8.3)return 1;if(z<=-8.3)return 0;
 // Positive convergent integral series: Phi(z)-1/2 = phi(z) *
 // (z + z^3/3 + z^5/(3*5) + ...). Symmetry avoids alternating cancellation.
 const x=Math.abs(z),q=x*x;let sum=x,term=x;
 for(let denominator=3;denominator<1000;denominator+=2){term*=q/denominator;const next=sum+term;if(next===sum)break;sum=next;}
 const area=sum*Math.exp(-q/2)/Math.sqrt(2*Math.PI);
 return Math.max(0,Math.min(1,z>=0?.5+area:.5-area));
}
export function fnCallValue(price,strike,rate,volatility,years){
 if(![price,strike,rate,volatility,years].every(finite)||strike<0||volatility<0||years<0)throw Error('Invalid finite option input.');
 if(price<=0)return 0;if(strike===0)return price;
 if(years===0)return Math.max(price-strike,0);
 const discountedStrike=strike*Math.exp(-rate*years);if(!finite(discountedStrike))throw Error('Option arithmetic exceeded the finite range.');
 if(volatility===0)return Math.max(price-discountedStrike,0);
 const root=volatility*Math.sqrt(years),d1=(Math.log(price/strike)+(rate+volatility*volatility/2)*years)/root,d2=d1-root;
 const value=price*fnNormalCDF(d1)-discountedStrike*fnNormalCDF(d2);
 if(!finite(value))throw Error('Option arithmetic exceeded the finite range.');
 return Math.max(0,Math.min(price,value));
}
export function allocateFnEquity({equityPool,ordinaryShares,existingAwards,warrantShares,strike,rate,volatility,years}){
 const values=[equityPool,ordinaryShares,existingAwards,warrantShares,strike,rate,volatility,years];
 if(!values.every(finite)||ordinaryShares<=0||Math.min(existingAwards,warrantShares,strike,volatility,years)<0)throw Error('Finite equity pool and valid nonnegative claim inputs are required.');
 if(equityPool<=0)return {ordinaryShareValue:0,ordinaryEquity:0,awardClaim:0,warrantClaim:0,unallocatedShortfall:-equityPool,residual:0,iterations:0};
 let low=0,high=equityPool/(ordinaryShares+existingAwards),iterations=0;
 for(;iterations<200;iterations++){
  const price=(low+high)/2;if(price===low||price===high)break;
  const claims=(ordinaryShares+existingAwards)*price+warrantShares*fnCallValue(price,strike,rate,volatility,years);
  if(!finite(claims))throw Error('Claim allocation exceeded the finite numerical range.');
  if(claims>equityPool)high=price;else low=price;
 }
 const ordinaryShareValue=(low+high)/2,ordinaryEquity=ordinaryShares*ordinaryShareValue,awardClaim=existingAwards*ordinaryShareValue,warrantClaim=warrantShares*fnCallValue(ordinaryShareValue,strike,rate,volatility,years),residual=equityPool-ordinaryEquity-awardClaim-warrantClaim;
 if(![ordinaryShareValue,ordinaryEquity,awardClaim,warrantClaim,residual].every(finite)||Math.abs(residual)>Math.max(1e-8,equityPool*1e-12))throw Error('Coupled claim allocation failed conservation.');
 return {ordinaryShareValue,ordinaryEquity,awardClaim,warrantClaim,unallocatedShortfall:0,residual,iterations};
}
