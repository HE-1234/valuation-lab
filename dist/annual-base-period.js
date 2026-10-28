// Year-by-year base period: last full fiscal year or TTM through the latest filed report.
// The reviewed research path keeps its own engine at its own origin. The other filed
// base re-applies the same dated growth, margin, tax, reinvestment-intensity and
// discount-rate path from that filing, with that filing's balance sheet.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const DAY=86400000,YEAR=365.25*DAY;
const MONTHS={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
const iso=ms=>new Date(ms).toISOString().slice(0,10);
const ms=x=>Date.parse(x+'T00:00:00Z');
const monthEnd=(y,m)=>Date.UTC(y,m+1,0);

function claimsFor(entry,id){
 const c=entry?.bySnapshot?.[id]||(entry?.snapshotId===id?entry:null);
 const a=c?.assumptions||{};
 return {otherAssets:finite(a.otherAssets)?a.otherAssets:0,otherClaims:finite(a.otherClaims)?a.otherClaims:0,researched:!!c};
}

/** The two filed bases for a company, newest annual report and newest TTM. */
export function filedBasesFor(ticker,{universe,cases}){
 const company=universe?.companies?.find(c=>c.ticker===ticker);if(!company)return [];
 const entry=cases?.companies?.[ticker],usable=s=>finite(s.revenue)&&s.revenue>0&&/^\d{4}-\d{2}-\d{2}$/.test(s.periodEnd||'');
 const pick=mode=>company.snapshots.filter(s=>s.snapshotMode===mode&&usable(s)).sort((a,b)=>(b.periodEnd>a.periodEnd)-(b.periodEnd<a.periodEnd)||(finite(b.cash)-finite(a.cash)))[0];
 const annual=pick('annual-reference'),ttm=pick('ttm');
 return [annual&&{kind:'annual',snapshot:annual},ttm&&ttm.periodEnd!==annual?.periodEnd&&{kind:'ttm',snapshot:ttm}].filter(Boolean).map(({kind,snapshot:s})=>({
  kind,id:s.id,periodEnd:s.periodEnd,label:s.fiscalLabel,fiscalYear:s.fiscalYear,currency:s.currency||s.reportingCurrency,revenue:s.revenue,EBIT:s.EBIT,
  cash:s.cash,debt:s.debt,shares:s.shares,adrRatio:finite(s.adrRatio)?s.adrRatio:1,sourceUrl:s.sourceUrl||s.sourceURL,form:s.sourceForm||s.form,filedAt:s.filedAt||s.filingDate,
  ...claimsFor(entry,s.id)
 }));
}

// Each research row's period end, and whether it is a partial opening period.
function rowDates(d,o,fiscalMonth,fiscalDay){
 const fyEnd=y=>fiscalMonth===null?Date.UTC(y,11,31):Math.min(Date.UTC(y,fiscalMonth,fiscalDay),monthEnd(y,fiscalMonth));
 return o.rows.map((r,i)=>{
  const src=d.annual?.[i]||{},label=String(r.period||src.period||'');
  const explicit=[src.periodEnd,src.end,src.fiscalEnd,r.periodEnd,r.end].find(x=>/^\d{4}-\d{2}-\d{2}$/.test(x||''));
  const partial=/^H2\b|\bH2\b|Jul–Mar|stub/i.test(label)||(finite(src.year_fraction)&&src.year_fraction<.95)||(finite(r.year_fraction)&&r.year_fraction<.95)||(finite(src.durationYears)&&src.durationYears<.95);
  let end=explicit?ms(explicit):null;
  if(end===null){const m=label.match(/(\d{4}-\d{2}-\d{2})/);if(m)end=ms(m[1]);}
  if(end===null){const m=label.match(/(?:12M|ending(?: approximately)?|to)\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/i),plus=+(label.match(/plus\s+(\d+)\s+years?/i)?.[1]||0);if(m&&MONTHS[m[1].toLowerCase()]!==undefined)end=monthEnd(+m[2]+plus,MONTHS[m[1].toLowerCase()]);}
  if(end===null){const m=label.match(/FY\s?(\d{4})/i)||label.match(/\b(\d{4})\b/);if(m)end=fyEnd(+m[1]);}
  return {end,partial};
 });
}

// Log-linear revenue between dated twelve-month points; terminal growth beyond the last point.
function curve(points,tail){
 const p=[...points].sort((a,b)=>a.t-b.t);
 return t=>{
  if(t<=p[0].t)return p[0].v;
  for(let i=1;i<p.length;i++)if(t<=p[i].t){const a=p[i-1],b=p[i],w=(t-a.t)/(b.t-a.t);return tail.log?Math.exp(Math.log(a.v)*(1-w)+Math.log(b.v)*w):a.v*(1-w)+b.v*w;}
  const last=p.at(-1);return tail.log?last.v*(1+tail.growth)**((t-last.t)/YEAR):last.v;
 };
}

/**
 * Re-anchor the current research operating path at a filed base.
 * d: research draft; o: calculateResearchOperating(d); base: one of filedBasesFor().
 */
export function rebaseResearchPath(d,o,base,{otherBase=null}={}){
 if(!o?.rows?.length||!d?.terminal)throw Error('A computed research path is required.');
 if(base.currency&&d.currency&&base.currency!==d.currency)throw Error(`The filing reports in ${base.currency}; the research path is in ${d.currency}.`);
 const fiscal=(otherBase?.kind==='annual'?otherBase:base.kind==='annual'?base:null)?.periodEnd||d.anchor?.fiscalEnd||d.anchor?.periodEnd||null;
 const fm=fiscal?new Date(ms(fiscal)).getUTCMonth():null,fd=fiscal?new Date(ms(fiscal)).getUTCDate():null;
 const dates=rowDates(d,o,fm,fd);
 if(dates.some(x=>x.end===null||Number.isNaN(x.end)))throw Error('Research row dates could not be read.');
 const start=ms(base.periodEnd),t=d.terminal;
 const revenuePoints=[{t:start,v:base.revenue}];
 if(otherBase&&finite(otherBase.revenue)&&otherBase.revenue>0)revenuePoints.push({t:ms(otherBase.periodEnd),v:otherBase.revenue});
 const anchorEnd=d.anchor?.fiscalEnd||d.anchor?.periodEnd;
 if(/actual|reported|ttm/i.test(d.anchor?.kind||'')&&!/forecast|annualized|mixed/i.test(d.anchor?.kind||'')&&finite(d.anchor?.revenue)&&/^\d{4}-\d{2}-\d{2}$/.test(anchorEnd||'')&&!revenuePoints.some(p=>Math.abs(p.t-ms(anchorEnd))<20*DAY))revenuePoints.push({t:ms(anchorEnd),v:d.anchor.revenue});
 o.rows.forEach((r,i)=>{if(!dates[i].partial&&finite(r.revenue)&&r.revenue>0&&!revenuePoints.some(p=>Math.abs(p.t-dates[i].end)<20*DAY))revenuePoints.push({t:dates[i].end,v:r.revenue});});
 const path=o.rows.map((r,i)=>({t:dates[i].end,m:r.margin??r.operatingMargin,tax:r.taxRate,w:r.wacc,k:finite(r.reinvestment)&&finite(r.revenue)&&r.revenue>0?r.reinvestment/r.revenue:null})).filter(p=>finite(p.m)&&finite(p.tax)&&finite(p.w));
 const at=(key,fallback)=>{const pts=path.filter(p=>finite(p[key])).map(p=>({t:p.t,v:p[key]}));return pts.length?curve(pts,{log:false}):()=>fallback;};
 const R=curve(revenuePoints,{log:true,growth:t.growth}),M=at('m',t.margin),TX=at('tax',t.taxRate),W=at('w',t.wacc),K=at('k',0);
 const last=Math.max(...dates.map(x=>x.end)),years=Math.max(1,Math.ceil((last-start)/YEAR-.02));
 let revenue=base.revenue,discount=1,pv=0;const rows=[];
 for(let k=1;k<=years;k++){
  const e=start+k*YEAR,growth=R(e)/R(e-YEAR)-1;revenue*=1+growth;
  const margin=M(e),taxRate=TX(e),wacc=W(e),ebit=revenue*margin,nopat=ebit-Math.max(0,ebit)*taxRate,reinvestment=revenue*K(e),fcff=nopat-reinvestment;
  discount*=1+wacc;const presentValue=fcff/discount;pv+=presentValue;
  rows.push({year:k,periodEnd:iso(Date.UTC(new Date(start).getUTCFullYear()+k,new Date(start).getUTCMonth(),new Date(start).getUTCDate())),revenue,growth,margin,taxRate,ebit,nopat,reinvestment,fcff,wacc,discountFactor:discount,pv:presentValue});
 }
 const tr=revenue*(1+t.growth),tn=tr*t.margin*(1-t.taxRate),tf=tn*(1-t.growth/t.roic),value=tf/(t.wacc-t.growth),terminalPV=value/discount,enterprise=pv+terminalPV;
 if(![pv,terminalPV,enterprise].every(finite))throw Error('Re-based arithmetic exceeded the finite numerical range.');
 const bridgeReady=[base.cash,base.debt,base.shares].every(finite)&&base.shares>0;
 const equity=bridgeReady?enterprise+base.cash+base.otherAssets-base.debt-base.otherClaims:null;
 return {base,rows,forecastPV:pv,terminalPV,enterprise,terminal:{revenue:tr,nopat:tn,fcff:tf,value},equity,perShare:bridgeReady?equity/base.shares:null,
  native:Math.abs(start-ms(d.discountOrigin))<10*DAY,date:base.periodEnd};
}

/** The base whose period end matches the research origin, if any. */
export function nativeBaseKind(d,bases){
 const o=ms(d?.discountOrigin||'');return bases.find(b=>Math.abs(ms(b.periodEnd)-o)<10*DAY)?.kind||null;
}
