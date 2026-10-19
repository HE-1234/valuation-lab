import {KEYS_ADAPTER_NOTES,KEYS_ERRORS} from './keys-research-model.js';
import {KEYS_MESSAGES} from './keys-messages.js';
const notes={
scope:'指定日期条件性经营价值研究：资本基准为 2026 年七月三十一日、普通股数日期为八月二十七日、信息截止日为十月十九日。不提供当前目标价、上涨空间、预期回报、推荐、历史回测或排名。',
mapping:'编辑后的总收入保留选定来源各年的 CSG／EISG 收入比例。这一固定比例分析映射属于假设，并非校准后的分部预测。',
periods:'十个预测期间于 2027–2036 年七月三十一日结束。这些是滚动年度模型期间，并非是德科技十月财年或管理层指引期间。',
capital:'保留总资本支出减实物折旧、收购及无形资产更新、边际营运资本和所需经营现金变化。第 8–10 年应用分阶段可持续 ROIC 底线。输入年度投资须同时满足两类底线，不会静默修补。',
convergence:'末年 CSG／EISG 增长、利润率、税率及 WACC 须收敛至终值假设。末年及终值投资取经营需求与可持续 ROIC 投资两者较大值；熊市情景由经营需求约束。因此隐含再投资 ROIC 可低于输入的上限。',
funding:'每次编辑及模拟均重新计算利息、指定日期债务偿还、现金底线、剩余债务额度、紧急股权融资、发行费及股数。需融资情景不显示企业价值、权益及每股主要估值。融资诊断并非融资调整后的公允价值：未建模紧急债务偿还及再融资、循环信贷到期、年内流动性及详细契约。',
shares:'分配采用 2026 年八月二十七日 170.244745 百万普通股，比七月三十一日资产负债表晚 27 天。这是实际普通股数，并非摊薄每股收益的加权平均股数。不声称逐笔估值未结奖励。',
claims:'资本桥接一次扣除 25.50 亿美元债务面值；本金偿还影响流动性，不影响 FCFF。排除 1,700 万美元受限现金及 1.88 亿美元长期投资。退休及衍生品预留为保守假设。',
expenses:'股份薪酬、研发和经营租赁保留为经济经营费用。不加回股份薪酬或收购摊销，不重复扣除租赁债务，不假设回购，也不重复计入收购对价。更新预算并非未公布重大收购的资金。',
assumptions:'未来增长、经济利润率、税率、资本强度、终值 ROIC、WACC 和融资条款均为分析假设。熊市／基准／牛市命名情景并非概率、置信区间或预期值。'
};
const errors={identity:'KEYS 来源、日期及普通股身份须匹配已复核资料。',controls:'KEYS 融资及请求权输入须为指定范围内的有限数值。',fields:'不支持的 KEYS 草稿或资金字段。请保留已保存草稿以便恢复。',horizon:'KEYS 仅支持截至 2027–2036 年七月三十一日的十个滚动年度期间。',timing:'KEYS 七月三十一日时点固定。不同日期须重新复核资本桥接。',funding:'KEYS 需要外部融资。不显示企业价值、权益或每股主要估值；任何稀释数字仅供诊断。',stale:'KEYS 经营价值须匹配当前情景及融资假设。',basis:'KEYS 分配须采用指定日期美元和八月二十七日 170.244745 百万普通股。',nonpositive:'KEYS 条件性权益不为正。不显示企业价值、权益或每股主要估值。'};
export const KEYS_ERROR_PAIRS=[...Object.values(KEYS_MESSAGES),...Object.entries(KEYS_ADAPTER_NOTES).map(([k,v])=>[v,notes[k]]),...Object.entries(KEYS_ERRORS).map(([k,v])=>[v,errors[k]]),
['KEYS annual inputs require finite values, supported bounds and the reviewed rolling-July schedule.','KEYS 年度输入须为有效范围内的有限数值，并保留已复核的滚动七月计划。'],
['KEYS terminal inputs require the exact supported finite schema.','KEYS 终值输入须符合准确的有限数值结构。'],
['KEYS WACC and terminal ROIC must exceed terminal growth.','KEYS 的 WACC 及终值 ROIC 须高于终值增长。'],
['KEYS final segment growth must converge to terminal growth.','KEYS 最终分部增长须收敛至终值增长。'],
['KEYS final CSG and EISG revenues must converge to terminal growth.','KEYS 最终 CSG 及 EISG 收入须收敛至终值增长。'],
['KEYS final margin, tax and WACC must match terminal assumptions.','KEYS 最终利润率、税率及 WACC 须匹配终值假设。'],
['KEYS final-year reinvestment must equal the greater of operating needs and NOPAT times growth divided by ROIC.','KEYS 末年再投资须等于经营需求与 NOPAT×增长／ROIC 中的较大值。'],
['KEYS gross capex cannot be below depreciation in this maintenance model.','此维护模型中 KEYS 总资本支出不得低于折旧。'],
['KEYS positive terminal earnings are required.','KEYS 终值盈利须为正。'],
['KEYS terminal reinvestment consumes all earnings.','KEYS 终值再投资消耗全部盈利。'],
['KEYS arithmetic is outside the finite supported domain. No valuation is released.','KEYS 运算超出有限数值支持范围。不显示估值。'],
['KEYS requires the reviewed July 31 capital anchor, August 27 common shares and October 19 information cutoff in USD.','KEYS 须保留已复核的七月三十一日资本基准、八月二十七日普通股数、十月十九日信息截止日及美元口径。'],
['KEYS restricted cash must remain excluded; nonzero restricted_cash_included is unsupported.','KEYS 受限现金须保持排除；不支持非零的受限现金计入额。'],
['KEYS long-term investments must remain excluded from this reviewed capital bridge.','KEYS 长期投资须保持排除在已复核资本桥接之外。'],
['KEYS debt maturity dates and rolling-year buckets must match the reviewed schedule.','KEYS 债务到期日及滚动年度分组须匹配已复核计划。'],
['KEYS debt schedule does not match debt face principal.','KEYS 债务计划与债务面值本金不匹配。'],
['KEYS unknown override.','KEYS 存在未知覆盖参数。'],['KEYS unknown scenario.','KEYS 存在未知情景。'],
['Exact 170,244,745 August 27 common shares; 27 days after July 31 capital. Not diluted EPS weighted-average shares; no ADR conversion. SBC remains expensed; awards not grant-level valued.','八月二十七日准确普通股数为 170,244,745，比七月三十一日资本晚 27 天。并非摊薄每股收益加权平均股数；无需 ADR 换算。股份薪酬保留为费用；奖励未逐笔估值。'],
['Conditional USD value per common share; 170.244745 million August 27 shares, 27 days after July 31 capital','条件性每普通股美元价值；八月二十七日 170.244745 百万股，比七月三十一日资本晚 27 天'],
['Debt principal','债务本金'],['Interest','利息'],['July 31 unrestricted cash','七月三十一日非受限现金'],['Face debt principal; repaid only in liquidity','债务面值本金；偿还仅计入流动性'],['Retirement and postretirement reserve','退休及退休后福利预留'],['Derivative and other-claim reserve','衍生品及其他请求权预留'],['Opening required operating cash','期初所需经营现金'],['Long-term investments excluded','长期投资均不计值'],['Restricted cash excluded','受限现金不计值'],
...Array.from({length:10},(_,i)=>[`KEYS entered investment is below the operating/ROIC floor in the rolling year ending ${2027+i}-07-31. Capital is never silently repaired.`,`KEYS 截至 ${2027+i} 年七月三十一日滚动年度的输入投资低于经营／ROIC 底线。资本不会静默修补。`]),
...Object.entries({'terminal growth':'终值增长','terminal margin':'终值利润率','terminal tax':'终值税率','terminal ROIC':'终值 ROIC','terminal WACC':'终值 WACC','annual margin':'年度利润率','annual tax':'年度税率','annual WACC':'年度 WACC','annual reinvestment':'年度再投资','csg':'CSG 收入','eisg':'EISG 收入','csg growth':'CSG 增长','eisg growth':'EISG 增长'}).map(([en,zh])=>[`KEYS ${en} is outside its finite supported bounds.`,`KEYS ${zh}超出有限数值支持范围。`])];
