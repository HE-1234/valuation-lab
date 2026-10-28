// Year-by-year base-period control and the re-based value card.
import {registerCatalog,localizedText,getLocale,onLocaleChange,t,escapeLocalizedText as esc} from './i18n.js';
import {formatMoneyMillions} from './display-format.js';
import {displayNumber} from './number-display.js';
import {filedBasesFor,rebaseResearchPath,nativeBaseKind} from './annual-base-period.js';

const copy={
 label:['Base period','基期'],
 annual:['Last full year · {period}','最近完整财年 · {period}'],
 ttm:['TTM through {date}','近十二个月 · 截至 {date}'],
 research:['Research date · {date}','研究日期 · {date}'],
 native:['reviewed research','已审阅研究'],
 eyebrow:['RE-BASED ON THE FILING','按申报文件重设基期'],
 title:['Operating value at {date}','{date} 营业价值'],
 perShare:['Value per common share','每股普通股价值'],
 unit:['{currency} / common share','{currency}／股'],
 method:['Same year-by-year growth, margin, tax, reinvestment and discount-rate path as the reviewed research, applied from the {period} filing. The balance sheet is dated {date}. Your edits to the research path carry over; the tables, charts and Monte Carlo below still show the research model at its own date.','沿用已审阅研究的逐年成长、利润率、税率、再投资与折现率路径，从 {period} 申报数据重新起算。资产负债表日期为 {date}。你对研究路径的修改会一并套用；下方表格、图表与蒙特卡洛模拟仍显示研究模型原日期的结果。'],
 ev:['Operating value','营业价值'],cash:['+ Cash and short-term investments','+ 现金及短期投资'],assets:['+ Other nonoperating assets','+ 其他非营业资产'],
 debt:['− Debt','− 债务'],claims:['− Other claims (options, convertibles, minority interests)','− 其他索偿权（期权、可转债、少数股东权益）'],
 equity:['= Common equity','= 普通股权益'],shares:['÷ Shares incl. unvested awards (millions)','÷ 股数（含未归属奖励，百万股）'],
 noBridge:['This filing lacks a complete cash, debt and share count, so only operating value is shown.','此申报数据缺少完整的现金、债务或股数，因此只显示营业价值。'],
 negative:['Common equity is negative under this path; there is no positive value per share.','在此路径下普通股权益为负，每股没有正价值。'],
 path:['Re-based annual path','重设基期后的逐年路径'],yearEnd:['Year ending','年度截至'],revenue:['Revenue','营收'],growth:['Growth','成长'],margin:['Operating margin','营业利润率'],fcff:['FCFF','自由现金流'],
 terminal:['Terminal value (present value)','终值（现值）'],source:['Filing ↗','申报文件 ↗'],
 error:['The research path could not be re-based on this filing: {message}','研究路径无法以此申报数据重设基期：{message}']
};
registerCatalog('annualBase',{en:Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[0]])),'zh-Hans':Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[1]]))});
const l=(key,p={})=>localizedText('annualBase.'+key,p);
const n=(x,d=2)=>displayNumber(x,d),pct=x=>Number.isFinite(x)?(x*100).toFixed(1)+'%':'—';
const money=(x,c)=>esc(formatMoneyMillions(x,c));
const fiscal=b=>b.kind==='annual'?(Number.isInteger(b.fiscalYear)?(getLocale()==='zh-Hans'?`${b.fiscalYear} 财年`:`FY${b.fiscalYear}`):b.periodEnd):b.periodEnd;

/** The base-period choice for a draft: filed bases, the one matching the research date, and the selection. */
export function basePeriodChoice(ticker,d,filed,selected){
 const bases=filed?filedBasesFor(ticker,filed):[];if(!bases.length||!d?.discountOrigin)return null;
 const native=nativeBaseKind(d,bases),options=[...(native?[]:['research']),...bases.map(b=>b.kind)];
 return {bases,native,options,kind:options.includes(selected)?selected:(native||'research')};
}
// Option text cannot hold markup, so each option keeps both languages and swaps on a locale change.
function optionText(choice,d,kind,locale){
 const zh=locale==='zh-Hans',b=choice.bases.find(x=>x.kind===kind),pick=key=>copy[key][zh?1:0];
 const period=b?.kind==='annual'&&Number.isInteger(b.fiscalYear)?(zh?`${b.fiscalYear} 财年`:`FY${b.fiscalYear}`):b?.periodEnd;
 const text=kind==='research'?pick('research').replace('{date}',d.discountOrigin):pick(kind).replace('{period}',period).replace('{date}',b.periodEnd);
 return text+(kind===choice.native||(kind==='research'&&!choice.native)?' · '+pick('native'):'');
}
export function basePeriodSelectHTML(choice,d){
 return `<label for="annual-base-period">${l('label')}</label><select id="annual-base-period">${choice.options.map(kind=>`<option value="${kind}" data-en="${esc(optionText(choice,d,kind,'en'))}" data-zh="${esc(optionText(choice,d,kind,'zh-Hans'))}"${kind===choice.kind?' selected':''}>${esc(optionText(choice,d,kind,getLocale()))}</option>`).join('')}</select>`;
}
if(globalThis.document)onLocaleChange(()=>document.querySelectorAll('#annual-base-period option').forEach(o=>{o.textContent=getLocale()==='zh-Hans'?o.dataset.zh:o.dataset.en;}));
export function rebasedSelected(choice){return !!choice&&choice.kind!=='research'&&choice.kind!==choice.native;}
export function rebasedSummaryHTML(d,operating,choice){
 const base=choice.bases.find(b=>b.kind===choice.kind),other=choice.bases.find(b=>b!==base)||null;
 let r;try{r=rebaseResearchPath(d,operating,base,{otherBase:other});}catch(error){return `<p class="research-warning">${l('error',{message:error.message})}</p>`;}
 const cur=d.currency,positive=Number.isFinite(r.perShare)&&r.equity>0;
 const bridge=Number.isFinite(r.equity)?`<dl class="annual-base-bridge"><dt>${l('ev')}</dt><dd>${money(r.enterprise,cur)}</dd><dt>${l('cash')}</dt><dd>${money(base.cash,cur)}</dd>${base.otherAssets?`<dt>${l('assets')}</dt><dd>${money(base.otherAssets,cur)}</dd>`:''}<dt>${l('debt')}</dt><dd>${money(base.debt,cur)}</dd>${base.otherClaims?`<dt>${l('claims')}</dt><dd>${money(base.otherClaims,cur)}</dd>`:''}<dt>${l('equity')}</dt><dd>${money(r.equity,cur)}</dd><dt>${l('shares')}</dt><dd>${n(base.shares,1)}</dd></dl>`:`<p class="micro">${l('noBridge')}</p>`;
 const rows=r.rows.map(x=>`<tr><th scope="row">${esc(x.periodEnd)}</th><td>${money(x.revenue,cur)}</td><td>${pct(x.growth)}</td><td>${pct(x.margin)}</td><td>${money(x.fcff,cur)}</td></tr>`).join('');
 return `<p class="annual-summary-caveat">${l('method',{period:fiscal(base),date:base.periodEnd})}</p><div class="annual-summary-values"><section class="research-value annual-summary-value"><span class="eyebrow">${l('eyebrow')}</span><h2>${l('title',{date:base.periodEnd})}</h2><p class="research-big-value">${money(r.enterprise,cur)}</p><p class="research-date-line"><a href="${esc(base.sourceUrl||'#')}" target="_blank" rel="noopener">${l('source')}</a></p></section><section class="annual-summary-equity"><span class="eyebrow">${l('perShare')}</span>${positive?`<p class="research-equity-value">${n(r.perShare)} <small>${l('unit',{currency:cur})}</small></p>`:Number.isFinite(r.equity)?`<p class="research-warning">${l('negative')}</p>`:''}${bridge}</section></div><details class="research-card annual-base-path"><summary>${l('path')}</summary><div class="research-table-scroll"><table><thead><tr><th>${l('yearEnd')}</th><th>${l('revenue')}</th><th>${l('growth')}</th><th>${l('margin')}</th><th>${l('fcff')}</th></tr></thead><tbody>${rows}</tbody></table></div><p class="micro">${l('terminal')}: ${money(r.terminalPV,cur)}</p></details>`;
}
