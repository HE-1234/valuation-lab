import {registerCatalog} from './i18n.js';
import {incrementalRecords} from './incremental-registry.js';
const pairs=[
 ['Operating investment before advance runoff','预付款流失前的经营投资'],
 ['Fixed customer-advance runoff','固定客户预付款流失'],
 ['Capital-efficiency ratios exclude fixed customer-advance runoff.','资本效率比率不包含固定客户预付款流失。'],
 ['Complete research report','完整研究报告'],
 ["registered ordinary share", "登记普通股"],
 ["Historical FX illustration only", "仅按历史汇率换算的示例"],
 ["Not a current USD valuation or quote comparison.", "并非当前美元估值，也不能与当前报价比较。"],
 ["50% customer-advance runoff", "50% 客户预付款流失"],
 ["100% customer-advance runoff", "100% 客户预付款流失"],
 ["Load 50% advance runoff", "载入 50% 预付款流失"],
 ["Load 100% advance runoff", "载入 100% 预付款流失"],
 ["Private-equity haircut", "私募股权折价"],
 ["Private-equity haircut · %", "私募股权折价 · %"],
 ["Zeiss ownership value proxy", "蔡司持股价值代理"],
 ["Existing award allocation multiplier", "现有奖励分配乘数"],
 ["Existing option allocation fraction", "现有期权分配比例"],
 ["Existing option allocation fraction · %", "现有期权分配比例 · %"],
 ["Additional contingent claim", "额外或有请求权"],
 ["Opening tax liability proxy", "期初税款负债代理"],
 ["Current tax asset recovery", "流动税款资产回收"],
 ["Private-equity value after haircut", "折价后的私募股权价值"],
 ["Market and carrying debt proxy", "市值与账面债务代理"],
 ["Finance lease claim", "融资租赁请求权"],
 ["Net interest-rate swap claim", "净利率互换请求权"],
 ["Existing conditional award dilution", "现有条件奖励稀释"],
 ["Existing option gross dilution", "现有期权总股数稀释"],
 ["New York registered ordinary share; one ordinary equivalent, not ADR", "纽约登记普通股；对应一股普通股，并非 ADR"],
 ["Total investment cannot be below the selected fixed customer-advance runoff.", "投资总额不得低于选定的固定客户预付款流失。"],
 ["ASML allocation remains in EUR; use the separately labeled historical USD translation.", "ASML 分配保持欧元；请使用单独标示的历史美元换算。"],
 ["No probability calibration is supplied. Reset restores fixed inputs; the named runoff cases are funding stresses with no assigned probabilities.", "未提供概率校准。重置恢复固定输入；命名流失案例是未赋予概率的融资来源压力。"],
 ["Reviewed investment components", "已复核投资分项"],
 ["PPE and intangible capex", "固定资产及无形资产资本开支"],
 ["Operating D&A", "经营折旧摊销"],
 ["Incremental working capital", "增量营运资本"],
 ["Net supplier funding", "净供应商资金"],
 ["Component sum", "分项合计"],
 ["Selected net investment", "选定净投资"],
 ["Final-three-year capital adjustments are analyst transitions toward terminal ROIC; they are not reported capital expenditure.", "最后三年资本调整是向终值 ROIC 过渡的分析假设，并非已报告资本开支。"],
 ["Operating liquidity reserve · EURm", "经营流动性储备 · 百万欧元"],
 ["Zeiss ownership value proxy · EURm", "蔡司持股价值代理 · 百万欧元"],
 ["Additional contingent claim · EURm", "额外或有请求权 · 百万欧元"],
 ["Opening tax liability proxy · EURm", "期初税款负债代理 · 百万欧元"],
 ["Current tax asset recovery · EURm", "流动税款资产回收 · 百万欧元"],
 ["Existing award allocation multiplier · ×", "现有奖励分配乘数 · 倍"],
 ['Operating investment','经营投资'],['Fixed opening settlement','固定期初结算'],['Total cash investment','投资现金总额'],['Capital-efficiency ratios use operating investment only.','资本效率比率仅使用经营投资。'],
 ["Process-intensity upside", "工艺强度上行情景"],
 ["Load reviewed process-intensity upside", "载入已复核工艺强度上行情景"],
 ["Debt including finance leases", "含融资租赁的债务"],
 ["Additional residual-claim stress", "额外残余请求权压力"],
 ["Incremental repurchase-payable stress", "额外回购应付款压力"],
 ["Net deferred-compensation recovery", "净递延薪酬回收"],
 ["Maximum existing awards and options", "最高现有奖励及期权"],
 ["June common shares plus maximum existing awards/options; zero exercise proceeds", "六月普通股加最高现有奖励／期权；行权收入为零"],
 ["Residual, tax-interest and repurchase stresses overlap. Select at most one positive stress; do not add them without a de-duplicated allocation.", "残余、税款利息及回购压力存在重叠。最多选一个正向压力值；未经去重分配不可相加。"],
 ["Retain the reviewed fixed opening-capital funding amount and year.", "请保留已复核的固定期初资本投入金额及年份。"],
 ["Year 1 total investment cannot be below the fixed opening capex-payable settlement.", "第 1 年投资总额不得低于固定期初资本开支应付款结算。"],
 ["Fiscal years end on the last Sunday in June; 52/53 weeks use normalized annual discount intervals.", "财年于六月最后一个星期日结束；52／53 周采用规范年度折现间隔。"],
 ['Downcycle scenario','下行周期情景'],['Upside scenario','上行情景'],['Load reviewed downcycle','载入已复核下行周期情景'],['Load reviewed upside','载入已复核上行情景'],['Named research scenario loaded. Undo restores the previous complete case.','已载入研究情景。撤销可恢复此前完整情景。'],
 ['Listed-investment tax reserve','上市投资税款储备'],['Private-investment recovery','私募投资回收价值'],['Investment tax-credit collection fraction','投资税收抵免回收比例'],['Investment tax-credit collection fraction · %','投资税收抵免回收比例 · %'],['Investment tax-credit collection years','投资税收抵免回收年数'],['Prepaid-tax collection fraction','预付税款回收比例'],['Prepaid-tax collection fraction · %','预付税款回收比例 · %'],['Capital-credit and prepaid-tax overlap','资本抵免与预付税款重叠'],['Estimated existing ESPP claim','现有 ESPP 请求权估计'],['Estimated existing-award dilution','现有奖励稀释股数估计'],
 ['Opening tax claims','期初税款请求权'],['Pension and postretirement claim','养老金及退休后福利请求权'],['Opening restructuring claim','期初重组请求权'],['Declared dividend payable','已宣告应付股息'],['Dated cash','基准日现金'],['Fixed-income investments','固定收益投资'],['Listed investments before tax reserve','税款储备前上市投资'],['Investment tax-credit collection PV','投资税收抵免回收现值'],['Prepaid-tax collection PV','预付税款回收现值'],['Duplicate-tax-asset PV correction','重复税务资产现值调整'],
 ['The duplicate-tax-asset correction exceeds a credited asset. Reconcile both recovery assumptions before combining them.','重复税务资产调整超过已计入资产。合并前请先核对两项回收假设。'],['July common shares plus the selected estimated legacy-award proxy; no weighted EPS shares added','七月普通股加选定旧奖励估计股数，不另加加权 EPS 股数'],['June 30 post-split common shares plus selected existing-RSU dilution','六月三十日拆股后普通股加选定现有 RSU 稀释'],['Rolling annual periods from July 26; 52/53-week fiscal years use annual discount intervals.','从七月二十六日起的滚动年度；52／53 周财年按年度折现间隔处理。'],

 ['Reviewed incremental research','新增已复核研究'],['Conditional fiscal-origin common allocation','财年基准日条件性普通股分配'],['Load reviewed downside','载入已复核下行情景'],['Named downside loaded. Undo restores the previous complete case.','已载入下行情景。撤销可恢复此前完整情景。'],['Cycle and export downside','周期及出口下行情景'],
 ['Operating liquidity reserve','经营流动性储备'],['Selected debt value','选定债务估值'],['Incremental tax-interest claim','额外税款利息请求权'],['Existing RSU vesting fraction','现有 RSU 归属比例'],['Existing RSU vesting fraction · %','现有 RSU 归属比例 · %'],['Prepaid-tax recovery value','预付税款回收价值'],['Dated cash and investments','基准日现金及投资'],['Existing RSU dilution','现有 RSU 稀释'],['Pension claim','养老金请求权'],['Net deferred-compensation claim','净递延薪酬请求权'],['Existing tax payable claim','现有应付税款请求权'],['Interest payable','应付利息'],['Net interest-rate swap claim','净利率互换请求权'],['Legacy RSU accrued-dividend claim','旧 RSU 应计股息请求权'],
 ['Current-date capital and shares are unverified. The dated equity allocation is unavailable after shifting the operating valuation date.','当前资本及股数尚未核实。移动经营估值日期后，不提供原基准日的股权分配。'],['Complete every selected claim assumption; an unknown amount is not zero.','请填写每项请求权假设；未知金额不等于零。'],['Incremental research source, audit, dates and security identity must match the reviewed company package.','新增研究的来源、复核、日期及证券身份必须与已复核公司资料包一致。'],['Incremental claim assumptions must remain an object; missing amounts are not zero.','新增请求权假设格式无效；缺失金额不等于零。'],['Unsupported incremental claim assumption; retain the saved draft for recovery.','不支持的新增请求权假设；已保存草稿保留以供恢复。'],
 ['All research-default inputs are fixed. Run manually to reproduce one conditional case; choose uncertainty explicitly before interpreting a range.','研究默认输入全部固定。手动运行会重现一个条件性情景；解释分布范围前须明确选择不确定性。'],['No probability calibration is supplied. Reset restores fixed inputs; the named downside is a separate scenario with no assigned probability.','未提供概率校准。重置恢复固定输入；已命名下行情景是独立情景，未赋予概率。'],
 ['Reviewed cases · source-specific dates','已复核情景 · 各自来源日期'],['Original fourteen cases remain frozen. Incremental cases have separate source and audit versions. Values use different dates and currencies; do not aggregate them.','原有十四个情景保持冻结。新增情景使用各自的来源及复核版本。数值日期及币种不同，请勿直接加总。'],['Canonical operating history','规范经营历史'],['Fiscal year','财年'],['Canonical EBIT','规范营业利润'],['Operating margin','营业利润率'],['Source and audit identity','来源及复核身份'],['No assigned scenario probability','未赋予情景概率'],['Research source JSON','研究来源 JSON'],['Independent calculation audit','独立计算复核'],['Company-specific evidence report','公司专属证据报告'],['Dated scope and limitations','日期范围及局限'],['SBC and claims treatment','股权薪酬及请求权处理'],['Fiscal years end June 30.','财年于六月三十日结束。'],['reportedGAAP','已报告 GAAP 数据'],
];
pairs.push(...[["Investment before cash-reserve change", "现金储备变化前投资"], ["Investment before cash-reserve change · USDm", "现金储备变化前投资 · 百万美元"], ["Scalable investment before cash reserve", "现金储备前可缩放投资"], ["Required-cash change", "所需现金变化"], ["Capital-efficiency ratios include required-cash growth and exclude the opening payable settlement.", "资本效率比率包含所需现金增长，不包含期初应付款结算。"], ["Equity pool before existing equity claims", "现有股权请求权分配前股权池"], ["Existing award value", "现有奖励价值"], ["Amazon warrant value", "亚马逊权证价值"], ["Ordinary equity after joint allocation", "联立分配后的普通股权益"], ["million ordinary shares", "百万普通股"], ["Unallocated capital shortfall", "未分配资本缺口"], ["Intrinsic share value and warrant value are solved together. Nonpositive pools give zero ordinary value with the shortfall retained separately.", "内在每股价值与权证价值联立求解。分配池非正时普通股价值为零，并单独保留缺口。"], ["Conditional coupled ordinary-share allocation", "条件性普通股联立分配"], ["NYSE ordinary share; not ADR", "纽约证券交易所普通股；并非 ADR"], ["Raytek value proxy", "Raytek 价值代理"], ["Raytek value proxy · USDm", "Raytek 价值代理 · 百万美元"], ["Existing award shares", "现有奖励股数"], ["Existing award shares · million shares", "现有奖励股数 · 百万股"], ["Amazon warrant shares", "亚马逊权证股数"], ["Amazon warrant shares · million shares", "亚马逊权证股数 · 百万股"], ["Warrant volatility proxy", "权证波动率代理"], ["Warrant volatility proxy · %", "权证波动率代理 · %"], ["Other noncurrent liability claim", "其他非流动负债请求权"], ["Other noncurrent liability claim · USDm", "其他非流动负债请求权 · 百万美元"], ["Repatriation tax claim", "汇回税请求权"], ["Repatriation tax claim · USDm", "汇回税请求权 · 百万美元"], ["Required operating cash reserve", "所需经营现金储备"], ["Existing severance claim", "现有离职义务请求权"], ["equity-claim", "股权请求权"], ["Reported FY2026 USD financial anchor.", "2026 财年已报告美元财务基准。"], ["52/53-week June fiscal calendar; annual year-end discount convention.", "六月结束的 52／53 周财年；采用年度期末折现约定。"], ["Retain the reviewed operating-cash funding policy and investment-input basis.", "请保留已复核的经营现金资金政策及投资输入口径。"], ["Fabrinet warrants are jointly repriced from intrinsic share value in each trial; required operating cash follows the same revenue path. Selected claim counts, rate, term and volatility stay fixed.", "每次试验根据内在每股价值联立重估 Fabrinet 权证；所需经营现金遵循相同收入路径。选定请求权股数、利率、期限及波动率保持固定。"]]);
for(const r of incrementalRecords)for(const p of Object.values(r.prose))pairs.push([p.en,p['zh-Hans']]);
pairs.push(['Investment includes the explicit pre-reserve assumption plus the formula-driven required-cash change. Lower next-year sales can release required cash under the fixed 3% policy.','投资包含明确的储备前假设及按公式计算的所需现金变化。固定 3% 政策下，下一年度收入下降可释放所需现金。'],['Investment inputs and draws are before required-cash changes. The fixed 3% reserve policy can fund cash growth or release cash as next-year sales change; the opening payable settlement remains fixed.','投资输入及抽样不含所需现金变化。固定 3% 储备政策随下一年度收入变化提供现金增长资金或释放现金；期初应付款结算保持固定。']);
pairs.push(...[["Selected warrant shares", "选定权证股数"], ["Maximum warrants assume full vesting; default volatility uses a grant-date proxy and edits are analyst sensitivities. Raytek is not verified realizable cash. Casix litigation remains an unpriced tail risk; optional liability and repatriation claims remain conditional.", "最大权证数量假设全部归属；默认波动率使用授予日代理，编辑值属于分析敏感性。Raytek 并非已验证可变现现金。Casix 诉讼仍为未定价尾部风险；可选负债及汇回税请求权仍有条件。"], ["These are separate claim sensitivities without probabilities. Every FN allocation jointly reprices warrants; unpriced litigation remains unresolved.", "这些是未赋予概率的独立请求权敏感性。每次 FN 分配均联立重估权证；未定价诉讼仍未解决。"], ["Edits update only this FN draft. Blank claims stay unknown. Awards and warrants are allocated jointly from intrinsic value; no market-price input or second exercise-proceeds credit is added.", "编辑仅更新本 FN 草稿。留空请求权保留未知。奖励与权证按内在价值联立分配，不代入市场股价，也不再次计入行权收入。"], ["FN FCFF subtracts total funded investment: the pre-reserve input plus required-cash change. Annual WACCs compound; terminal investment already includes cash. Operating EV stays signed; nonpositive allocation pools produce zero ordinary value and a separately retained shortfall.", "FN 的 FCFF 扣除全部出资投资：储备前输入加所需现金变化。逐年 WACC 复合折现；终值投资已包含现金。经营企业价值保留正负号；分配池非正时普通股价值为零，并单独保留缺口。"], ["FN investment factors apply to pre-reserve investment excluding the fixed opening payable. Required-cash changes are derived separately from the same sampled revenue path.", "FN 投资系数适用于不含固定期初应付款的储备前投资。所需现金变化根据同一抽样收入路径另行推导。"]]);
pairs.push(...[["Warrants", "权证"], ["Volatility", "波动率"], ["full vesting assumed", "假设全部归属"], ["vested count only", "仅已归属数量"], ["selected vesting assumption", "选定归属假设"], ["grant-date proxy", "授予日代理"], ["illiquid; realization unverified", "流动性低；变现未验证"], ["excluded, unpriced legal tail risk", "未计值的法律尾部风险"]]);
pairs.push(['Other liabilities / repatriation','其他负债／汇回税'],['conditional','条件性假设']);
pairs.push(['analyst volatility assumption','分析波动率假设']);
const en={},zh={},keys={};pairs.forEach(([a,b],i)=>{const key='copy'+i;en[key]=a;zh[key]=b;keys[a]='incremental.'+key;});
registerCatalog('incremental',{en,'zh-Hans':zh});
export const incrementalMessageKeys=Object.freeze(keys);

export const incrementalTranslatedMessageKeys=Object.freeze(Object.fromEntries(pairs.map(([a,b])=>[b,keys[a]])));
