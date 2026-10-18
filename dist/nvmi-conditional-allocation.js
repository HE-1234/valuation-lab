// Analyst-conditional, December-origin allocation. Never an observed fair value.
import {fnNormalCDF} from './fn-option-allocation.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export const NVMI_CLAIM_FACTS=Object.freeze({common:31.780111,rsu:.396262,underlying:2.34255,strike:1000/3.1234,cap:415.03,years:1719/365,liquidAssets:1633.241,operatingCash:26.41731,openingClaims:51.325,face:750,marketConvert:936.27});
export const NVMI_CLAIM_DEFAULTS=Object.freeze({volatility:.5008,rate:2*Math.log1p(.0373/2),spread:.015,dividend:0,haircut:0,rsuMultiplier:1,residual:5,mismatch:0});
const buckets=[[.005824,26.30,.43],[.004164,44.08,1.42],[.000971,53.61,1.59],[.001920,102.35,1.48]];
export const NVMI_INFERRED_MARKET_PRICE=(3.644+buckets.reduce((s,[n,k])=>s+n*k,0))/.012879;
export function nvmiCall(s,k,t,r,v,q=0){
 if(![s,k,t,r,v,q].every(finite)||s<0||k<=0||t<=0||v<0||q<0)throw Error('invalid');
 const spot=s*Math.exp(-q*t),strike=k*Math.exp(-r*t);
 if(!finite(spot)||!finite(strike))throw Error('range');
 if(!s)return 0;if(v===0)return Math.max(spot-strike,0);
 const root=v*Math.sqrt(t),d1=(Math.log(s/k)+(r-q+v*v/2)*t)/root;
 const value=spot*fnNormalCDF(d1)-strike*fnNormalCDF(d1-root);
 if(!finite(value))throw Error('range');return Math.max(0,Math.min(spot,value));
}
export function nvmiStrip(s,k,p){const T=NVMI_CLAIM_FACTS.years;let sum=0;for(let j=0;j<40;j++){const t=T-(41-j)/252;sum+=Math.exp(-p.rate*(T-t))*nvmiCall(s,k,t,p.rate,p.volatility,p.dividend);}if(!finite(sum))throw Error('range');return sum/40;}
export function allocateNvmiCommon(ev,inputs={},mode='conditional',bond='discount'){
 const p={...NVMI_CLAIM_DEFAULTS,...inputs},f=NVMI_CLAIM_FACTS;
 if(!finite(ev)||!Object.values(p).every(finite)||p.volatility<0||p.spread<0||p.dividend<0||p.haircut<0||p.haircut>1||p.rsuMultiplier<0||p.residual<0||p.mismatch<0||!['conditional','market'].includes(mode)||!['discount','face'].includes(bond))throw Error('invalid');
 const assets=ev+f.liquidAssets-f.operatingCash-f.openingClaims-p.residual,bondValue=bond==='face'?f.face:f.face*Math.exp(-(p.rate+p.spread)*f.years);
 const terms=price=>{const s=mode==='market'?NVMI_INFERRED_MARKET_PRICE:price,lower=nvmiStrip(s,f.strike,p),upper=nvmiStrip(s,f.cap,p),option=buckets.reduce((sum,[n,k,t])=>sum+n*nvmiCall(s,k,t,p.rate,p.volatility,p.dividend),0),hedge=(1-p.haircut)*f.underlying*Math.max(0,lower-upper),convert=mode==='market'?f.marketConvert:bondValue+f.underlying*lower+p.mismatch;return {option,hedge,convert};};
 const equation=s=>{const x=terms(s);const value=(f.common+p.rsuMultiplier*f.rsu)*s+x.option+x.convert-x.hedge-assets;if(!finite(value))throw Error('range');return value;};
 if(!finite(assets)||!finite(bondValue))throw Error('range');
 const atZero=equation(0);
 if(atZero>=0)return {status:'no-positive-common',perShare:null,commonEquity:0,shortfall:atZero,assets,mode,inputs:p};
 let lo=0,hi=Math.max(1,Math.abs(assets)/f.common),iterations=0;
 while(equation(hi)<0){hi*=2;if(!finite(hi)||++iterations>1024)throw Error('range');}
 for(let i=0;i<200;i++){const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;if(equation(mid)>0)hi=mid;else lo=mid;}
 const perShare=lo+(hi-lo)/2,x=terms(perShare),error=equation(perShare);
 if(Math.abs(error)>Math.max(1e-8,Math.abs(assets)*1e-12))throw Error('range');
 return {status:'analyst-conditional',mode,origin:'2025-12-31',informationAsOf:'2026-10-18',perShare,commonEquity:f.common*perShare,rsuClaim:p.rsuMultiplier*f.rsu*perShare,optionClaim:x.option,convertClaim:x.convert,hedgeAsset:x.hedge,bondValue,assets,residual:error,inputs:p};
}
