import {ARM_ADAPTER_NOTES,ARM_ERRORS} from './arm-research-model.js';
const notes={scope:'资本基准为 2026 年三月三十一日，信息截至十月十九日。条件性重述日期研究；并非历史回测、当前十月目标价或市场价格比较。',mapping:'编辑后的总收入保留选定来源年度的特许权费、许可及芯片收入比例。知识产权及芯片采用相同加性利润率变化。这种固定比例分析映射是假设，并非校准后的分部预测。',capital:'年度投资为输入的过渡后金额。按编辑后的分部收入重新计算营运资本及经营现金。净生产性投资须满足明确分析底线；不会截断或自动补足。',convergence:'最终特许权费、许可及芯片收入须收敛至终值增长，包括零基数芯片。最终利润率及税率须匹配终值，最终投资须等于 NOPAT×增长／ROIC。必须联动编辑；不相容独立抽样被排除。',funding:'每次编辑及试验重新计算现金、所需经营现金、债务容量、利息、股权发行、费用及股数。如需外部融资，不显示企业价值、股权或存托股主要估值。稀释诊断仅为股数示例，并非融资调整后的公允价值。',shares:'每份存托股代表一股普通股。按三月三十一日 1,064.055252 百万普通股分配。经济现金替代政策将股权薪酬保留于营业利润；不加回薪酬，也不假定未来薪酬稀释。',reserves:'名义 2.65 亿美元 DreamBig 收购预留按保守三月三十一日约定扣除一次。全部 3.87 亿美元股权投资不计值，包括 0.96 亿上市及 2.91 亿其他持股。'};
const errors={identity:'ARM 来源、日期及证券身份须匹配已复核资料。',controls:'ARM 资金及请求权输入须为指定范围内的有限数值。',fields:'不支持的 ARM 草稿或资金字段。请保留已保存草稿以便恢复。',horizon:'ARM 仅支持已复核的 2027–2036 十财年计划。',timing:'ARM 三月三十一日时间基准固定。不同日期须重新复核资本桥接。',funding:'ARM 需要外部融资。不显示企业价值、股权或每存托股主要估值；任何稀释数字仅为诊断。',stale:'ARM 经营价值须与当前资金充足情景匹配。',basis:'ARM 分配须采用指定日期美元及每存托股对应一普通股的口径。'};
export const ARM_ERROR_PAIRS=[...Object.entries(ARM_ADAPTER_NOTES).map(([k,v])=>[v,notes[k]]),...Object.entries(ARM_ERRORS).map(([k,v])=>[v,errors[k]]),
['ARM annual inputs require finite values, supported bounds and the reviewed FY2027–36 schedule.','ARM 年度输入须为有效范围内的有限数值，并保留已复核 2027–2036 财年计划。'],
['ARM terminal inputs require the exact supported finite schema.','ARM 终值输入须符合准确的有限数值结构。'],
['ARM final margin and tax must match terminal margin and tax.','ARM 最终利润率及税率须匹配终值利润率及税率。'],
['ARM final-year reinvestment must equal NOPAT times growth divided by ROIC. Capital is never clipped or silently repaired.','ARM 末年再投资须等于 NOPAT×增长／ROIC。资本不会截断或静默修补。'],
['ARM terminal physical floor is incompatible with growth divided by ROIC. Capital is never clipped.','ARM 终值生产投入底线与增长／ROIC 不相容。资本不会截断。'],
['ARM WACC and ROIC must exceed terminal growth.','ARM 的 WACC 及 ROIC 须高于终值增长。'],
['ARM positive terminal NOPAT is required.','ARM 终值 NOPAT 须为正。'],
['ARM arithmetic is outside the finite supported domain. No valuation is released.','ARM 运算超出有限数值支持范围。不显示估值。'],
['Conditional USD value per ADS; one ADS per ordinary share; 1,064.055252 million dated ordinary shares','条件性每存托股美元价值；每存托股对应一普通股；指定日期普通股数为 1,064.055252 百万'],
['March 31 cash and short-term investments','三月三十一日现金及短期投资'],['Existing finance lease obligations','现有融资租赁义务'],['Existing EDA obligations','现有 EDA 义务'],['Nominal DreamBig acquisition reserve','名义 DreamBig 收购预留'],['Opening required operating cash','期初所需经营现金'],['All equity investments excluded','全部股权投资均不计值'],
...['royalty','license','silicon'].map((k,i)=>[`ARM final ${k} revenue must converge to terminal growth, including zero-base paths.`,`ARM 最终${['特许权费','许可','芯片'][i]}收入须收敛至终值增长，包括零基数路径。`]),
...Array.from({length:10},(_,i)=>[`ARM net-capital physical-floor incompatibility in FY${2027+i}: revise growth, ROIC or explicit floor assumptions. Capital is never clipped.`,`ARM ${2027+i} 财年净资本生产投入底线不相容：请修订增长、ROIC 或明确底线假设。资本不会截断。`])];
