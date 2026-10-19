import {CEVA_ADAPTER_NOTES,CEVA_ERRORS} from './ceva-valuation.js';
import {CEVA_MESSAGES} from './ceva-messages.js';
const notes={
 scope:'资本及折现基准为 2026 年六月三十日，采用截至十月十九日的信息。回顾性条件研究，不提供当前目标价、上涨空间、预期回报、推荐、排名或六月事前回测。',
 mapping:'2026 年下半年收入及 GAAP EBIT 等于全年假设减已报告上半年。编辑总收入保留选定来源期间的授权／版税比例；这是分析映射，并非分部预测。',
 tax:'每个明确期间及终值期间的现金税均取正经济 EBIT 按输入税率计算的税款与收入 3% 两者较大值。复核税率为 20%。亏损不产生税额抵免。',
 awards:'GAAP 利润率包含股权薪酬。仅加回 2026 年下半年 9.502 百万美元及 2027 年 19.004 百万美元，这些现有奖励已计入分母。未来奖励保留为现金替代费用，不另加第二笔假定稀释。该时序为分析近似，并非逐笔奖励计划。',
 claims:'六月普通股为 28.137917 百万股，另加全部已报告未归属 RSU／PSU 1.845728 百万单位，不扣失效。该总数并非已核实的 PSU 最高支付量。1 至 2 倍乘数为分析压力，并非法定最高义务。',
 options:'全部 30,025 份未结期权按 20.91 美元行权价采用内生内在价值行权近似。目前仅 19,279 份可行权；4.4 年剩余期限、时间价值及归属时序未完整估值。价外期权并不一定没有价值。',
 capital:'年度输入再投资须覆盖收入 3.5% 固定资产资本开支减 3% 折旧摊销，加全年收入变化的 18%；下半年营运资本变化取一半。有支持的营运资本释放可降低底线。输入不会静默修补。',
 terminal:'终值再投资为 NOPAT×增长／增量 ROIC，替代明确期间的固定资产资本开支及营运资本公式。末年利润率、税率及 WACC 须匹配终值假设。复核明确收入增长不必已等于终值增长。',
 reserve:'经营储备仅从权益扣除一次。净遣散费 0.217 百万美元及其他非流动应计款 1.072 百万美元另行扣除。租赁费用保留在 EBIT 中；17.424 百万美元经营租赁不再作为债务扣除。专用遣散资产并非自由盈余。',
 offshore:'220.720 百万美元现金、存款及可交易债务证券中，122.7 百万美元位于境外。零折减假设有条件的节税使用，并非已核实的免税境内可用性。折减以美元金额计，上限为已披露境外流动性。',
 funding:'期初流动资产加模型 FCFF 为融资能力压力代理值，并非预测银行现金。融资门槛还预留海外折减、净遣散费及其他非流动应计款，再测试经营储备。未建模利息收入、融资、收购或分配。任何资金缺口均停止显示企业价值、权益及每股主要估值。',
 assumptions:'授权及版税增长、利润率、现金税底线、资本强度、储备、WACC、终值增长及增量 ROIC 均为分析假设。命名情景没有校准概率。'
};
const errors={input:'CEVA 要求完整且有限的已复核 v3 输入结构；不支持未知或缺失字段。',source:'CEVA 来源事实、资本、六月三十日基准及十月十九日信息截止日须匹配已复核 v3 资料。',scenario:'CEVA 要求受支持的有限授权及版税情景，WACC 及终值 ROIC 高于增长。',identity:'CEVA 来源、日期及普通股身份须匹配已复核资料。',controls:'CEVA 储备、海外折减及总奖励控制须为指定范围内有限数值。',fields:'不支持的 CEVA 草稿、年度、终值、请求权或融资字段。请保留已存草稿以便恢复。',horizon:'CEVA 仅支持 2026 年下半年及 2027–2035 年九个完整年度。',timing:'CEVA 六月三十日时点固定。不同日期须重新复核资本桥接。',annual:'CEVA 年度输入要求正收入及有限且受支持的利润率、税款、投资和 WACC。',floor:'CEVA 输入再投资低于重新计算的固定资产资本开支及营运资本底线。不自动补足。',terminal:'CEVA 终值输入须为受支持有限数值、正税后营业利润、WACC 高于增长及 ROIC 高于增长。',convergence:'CEVA 末年利润率、税率及 WACC 必须等于终值假设。',funding:'CEVA 需要尚未建模的外部融资。企业价值、权益及每股主要估值不显示；能力数字仅为压力诊断。',nonpositive:'CEVA 条件权益非正。企业价值、权益及每股主要估值不显示。',stale:'CEVA 经营价值须匹配当前年度计划及请求权假设。',basis:'CEVA 分配要求六月三十日美元及已复核普通股证券口径。',arithmetic:'CEVA 算术超出受支持有限数值范围。不发布估值。'};
export const CEVA_ERROR_PAIRS=[...Object.values(CEVA_MESSAGES),...Object.entries(CEVA_ADAPTER_NOTES).map(([k,v])=>[v,notes[k]]),...Object.entries(CEVA_ERRORS).map(([k,v])=>[v,errors[k]]),
 ['June 30 cash, deposits and marketable debt securities','六月三十日现金、存款及可交易债务证券'],['Required operating-cash reserve','CEVA 所需经营现金储备'],['Conditional offshore-access tax haircut','有条件境外使用税款折减'],['Severance liability less dedicated fund','遣散负债减专用基金'],['Other noncurrent accruals','其他非流动应计款'],['Interest-bearing debt','计息债务'],['Endogenous option-exercise proceeds','内生期权行权收入'],['Operating leases already expensed; no duplicate debt claim','经营租赁已费用化，不重复扣债务请求权'],['Retrospective dated conditional research','回顾性指定日期条件研究'],['Cash tax','现金税'],['Entered investment','输入投资'],['Original source','原始来源'],
 ['Conditional USD per June common share after reported aggregate awards and intrinsic-option approximation; maximum PSU payout unresolved','按已报告总奖励及内在价值期权近似调整后的六月普通股条件美元价值；PSU 最高支付量未解决']];
