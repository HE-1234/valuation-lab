// Annual Report · a guide beside every simulation settings tab.
//
// The right column explains the tab you are editing: what its settings mean in
// plain words, what they do to the inputs (paths or a distribution), and what
// they do to value on their own. Every chart comes from the app's own engine:
// the simulation view publishes its state (root.mcState) and a simulate()
// function; this layer builds a copy of the settings in which only the
// selected tab varies, runs a few hundred scenarios with the same seed, and
// draws the result. Nothing here edits the user's settings or results.
//
// Damodaran's steps (Probabilistic Approaches, pp. 22–26): focus on the inputs
// that move value most, define a distribution for each, check correlation,
// then run. The "Where the range comes from" list is step one made visible.
import {getLocale, onLocaleChange} from '../i18n.js';
import {onScan} from './report-ux.js';
import {collectJointView} from '../joint-simulation-config.js';
import {distributionQuantile, distributionSummary} from '../simulation.js';

const COPY = {
  en: {
    eyebrow: 'How this tab shapes value',
    toRange: 'Latest range',
    toGuide: 'How {tab} works',
    q_growth: 'How bumpy is the growth path?',
    q_margin: 'Where does profitability settle?',
    q_capital: 'How much capital does growth need?',
    q_wacc: 'How risky are the cash flows?',
    q_taxTerminal: 'What happens after the forecast?',
    q_relationships: 'Do surprises move together?',
    l_growth: 'Revenue growth is drawn year by year. These settings decide how far each year can stray from your base case, and whether a good year tends to be followed by another.',
    l_margin: 'Operating margin decides how much of revenue becomes profit. Its range sets where the margin path can end up.',
    l_capital: 'Sales / capital says how much revenue each dollar of new capital buys. Lower means growth needs more reinvestment, which costs cash today.',
    l_wacc: 'The cost of capital discounts every future cash flow. Small changes reach far, because they compound over every year and the terminal value.',
    l_taxTerminal: 'After the forecast, the business is valued as if it grows at a stable rate forever. Stable growth, tax and the return on new capital set that value.',
    l_relationships: 'Inputs can be linked so that surprises arrive together. Linked surprises add up instead of cancelling out, which usually widens the range.',
    inputs: 'What you are assuming',
    value: 'What it does to value on its own',
    valueRel: 'What the links do to the range',
    valueLead: 'Only this tab varies; every other input stays at your base case. {n} scenarios, same seed as your run.',
    computing: 'Simulating this tab on its own…',
    failed: 'This tab cannot be simulated on its own with the current settings.',
    base: 'Base case',
    spread: 'On its own, this tab spreads value from {lo} to {hi} (8 in 10 scenarios), about ±{pct} around the base case.',
    noSpread: 'With these settings this tab adds no spread: every scenario gets the same value.',
    knobs: 'What each setting does',
    sources: 'Where the range comes from',
    sourcesLead: 'Middle 80% of value when each tab varies alone. Start your research with the longest bars. Tabs do not simply add up.',
    together: 'All tabs together · last run',
    pending: 'waiting',
    zero: 'no spread',
    cite: 'Damodaran: focus on the few inputs that move value most, define each distribution from history, peers or a reasoned choice, then check for links.',
    yr: 'Y{n}',
    paths: '{n} sample paths, coloured by the value each produced',
    pathsFlat: 'Every scenario follows your base-case path',
    hi: 'higher value', lo: 'lower value',
    band: 'middle 80% of paths',
    baseline: 'your base case',
    fixed: 'pinned',
    stable: 'stable from Y{n}',
    // knobs
    sdT: 'Annual surprise size · {v}',
    sdB: 'Each year, a fresh surprise hits {metric}. About 2 in 3 surprises stay within ±{v} and 19 in 20 within ±{v2}.',
    sdZero: 'Zero: no year-to-year surprises. The path moves only if its end point moves.',
    rhoT: 'Persistence · {v}',
    rhoB: '{p1} of a surprise carries into the next year and {p2} into the year after; half of it fades within {half}. Without pinned years the typical gap from your base case would settle near ±{stat}.',
    rhoZero: 'Zero: a surprise does not carry over, so every year is a fresh draw around your base case.',
    rhoNeg: 'Negative: a surprise tends to reverse the next year, so paths zig-zag around your base case.',
    rhoOne: 'One: surprises never fade, so the path wanders like a random walk and errors build up year after year.',
    echo: 'echo of a 1-point surprise',
    fixT: 'Pinned years · {v}',
    fixB: 'Every path passes exactly through your base case in these years. Pin years you know well, such as guided ones, and let the rest vary.',
    fixNone: 'No pinned years: paths can move from year 1.',
    endT: 'End point',
    endGrowth: 'From year {n}, growth equals stable growth of {g}, so every path converges there.',
    endDist: 'Each scenario draws a terminal value from your range ({lo} to {hi}). After the pinned years, the path bends toward that draw and reaches it in the terminal year.',
    terminal: 'terminal',
    evNote: 'Shown as operating value.',
    rhoIdle: 'Persistence only matters once the surprise size is above zero.',
    noSpreadHint: 'Nothing in this tab varies yet. Raise the surprise size above zero, or give a range some width, to see what it does.',
    valueLeadRel: 'Both runs vary every tab; the second switches the links off. {n} scenarios each, same seed as your run.',
    fixedSet: 'Fixed in every scenario: {list}. Give one a range to see how far it reaches.',
    termFixedT: '{name} · fixed at {v}',
    termFixedB: 'The same in every scenario, so it adds no spread. The second bar shows what a modest range of {lo} to {hi} would add.',
    echoCap: 'What is left of a 1-point surprise, year by year',
    short: {growth: 'Growth', margin: 'Margin', salesCapital: 'Sales / capital', investmentFactor: 'Investment', reinvestment: 'Reinvestment', wacc: 'WACC', taxRate: 'Tax rate'},
    endFixed: 'The path ends at your base case of {v}.',
    distT: '{family} · {range}',
    fam_fixed: 'Fixed', fam_triangular: 'Triangular', fam_uniform: 'Uniform', fam_normal: 'Bounded normal',
    d_fixed: 'One value in every scenario, so this input adds no spread.',
    d_triangular: 'Draws cluster near the most likely value {mode} and thin out toward the hard limits. Average {mean}. Damodaran suggests it when values cluster around a central estimate.',
    d_uniform: 'Every value between the limits is equally likely. Average {mean}. Use it when you can bound an input but have no central estimate.',
    d_normal: 'A bell around {mean0} with spread {sd}, cut at the limits. Draws outside are never made: the curve is rescaled, not clipped, so the actual average is {mean}.',
    d_mid: '8 in 10 draws fall between {p10} and {p90}.',
    inactiveT: 'Range not used by this method',
    inactiveB: 'The year-by-year path replaces this single range. Edit the path settings instead, or switch to legacy scalar draws.',
    terminalOnly: 'With annual paths, this range sets where the path ends; the yearly settings add surprises along the way.',
    tvShare: 'Terminal value is {pct} of operating value here, so these settings reach far.',
    termRow: '{name} · {range}',
    tg: 'Stable growth', ttax: 'Terminal tax rate', troic: 'Return on new capital',
    taxPath: 'Annual tax path',
    loadT: 'Common-factor loadings',
    loadB: 'Each loading ties an input to one shared shock. Two inputs’ yearly surprises correlate at the product of their loadings: 0.7 × 0.7 = 0.49. Inputs with zero surprise size cannot be linked.',
    loadNone: 'All loadings are zero, so surprises are independent.',
    targetsT: 'Year targets · {n}',
    targetsB: 'A target with error 0 pins that year exactly. A target with error above 0 pulls paths toward it without forcing them: a soft nudge, not a hard limit.',
    linkedT: 'Operating-linked draws',
    linkedB: 'One shared factor links growth, margin and sales / capital (latent correlations 0.49 and 0.28). WACC stays independent.',
    corr: 'correlation of yearly surprises',
    withLinks: 'With your links', noLinks: 'If independent',
    relSame: 'The links change nothing yet: give linked inputs a surprise size above zero.',
    relWider: 'Your links widen the middle 80% by {pct}.',
    relNarrower: 'Your links narrow the middle 80% by {pct}.',
    tabs: {relationships: 'Relationships', sampling: 'Sampling', growth: 'Growth', targetMargin: 'Margin', salesCapital: 'Sales / capital', wacc: 'WACC', taxTerminal: 'Tax & terminal', growthPremium: 'Growth', marginShift: 'Margin', investmentMultiplier: 'Investment', waccShift: 'WACC'},
    metric: {growth: 'growth', margin: 'the margin', salesCapital: 'sales / capital', investmentFactor: 'the investment factor', reinvestment: 'reinvestment', wacc: 'the cost of capital', taxRate: 'the tax rate'},
    unitPts: ' pts', yearsWord: '{n} years', yearWord: '1 year', underYear: 'under a year',
    // what-if ladders
    wiCap: 'If only this setting changed · middle 80% of value',
    wiLead: 'Each bar is the middle 80% of value if only that setting took the value on its left; the tick is the base case. All bars share one scale. Same scenarios and seed throughout, and nothing is changed for you.',
    wiYours: 'yours',
    wiNoPins: 'no pinned years',
    wiPin3: 'pin Y1–Y3',
    wiFixed: 'fixed at {v}',
    wiAt: '{v}',
    wiRange: '{lo} – {hi}',
    edit: 'Edit this setting',
    fieldIs: 'On the left: {f}',
    nSettings: '{n} settings',
    leads: '{tab} leads',
    precChip: 'rough median ±{v} at your count',
    pairT: '{a} vs {b}',
    pairChip: 'end vs journey',
    pairRange: 'Range',
    endRangeT: 'End-point range',
    pairAH: 'Sets where the path ends',
    pairAB: 'Drawn once per scenario for the terminal year. It lifts or lowers the later years together, like moving one end of a rope.',
    pairANormal: 'It is the SD of the bell before the cut at your bounds, so actual end points are a little tighter: 8 in 10 land in {p10} – {p90}.',
    pairBH: 'Sets how bumpy the way there is',
    pairBB: 'A fresh surprise every year that fades with persistence. Pinned years and the end point pull it back to zero, so it never moves the end point.',
    pairZeroA: 'Fixed: the end point is the same in every scenario.',
    pairZeroB: 'Zero: every path runs smoothly to its end point.',
    pairStatA: 'terminal ±{v}',
    pairStatB: 'largest ±{v} in Y{y}',
    pairValue: 'value alone {v}',
    pairChart: 'How far paths stray from your base case, year by year ({unit}, half the middle 80%)',
    pairBoth: 'both together',
    pairSum: 'The two are independent, so they combine like the sides of a right triangle, not by simple addition. In Y{y}: √({a}² + {b}²) ≈ {c}, close to the {m} the simulation measures.',
    pairTip: 'Rule of thumb: unsure where it settles, widen the range; unsure how bumpy the way is, raise the yearly SD.',
    loadHere: 'Linked to other inputs · {v}',
    loadHereB: 'A loading ties this input’s yearly surprises to a shared shock. Its effect on the range is shown on the {tab} tab, where every input varies together.',
    toRel: 'Open {tab} →',
    // sampling
    q_sampling: 'How many scenarios are enough?',
    l_sampling: 'Each scenario is one random draw of every input. More scenarios give a steadier range, but precision grows only with the square root of the count.',
    precT: 'Approximate sampling precision',
    precLead: 'Rough normal-reference estimates of sampling variation, based on accepted scenarios from {src}. They assume approximately bell-shaped accepted values and are not validated 95% intervals. Skewed, heavy-tailed or repeated values can make them unreliable.',
    precAccepted: '{accepted} accepted of {attempts} attempted. Comparisons project this acceptance rate.',
    precRowAccepted: '≈{n} accepted (projected)',
    precRowActual: '{n} accepted',
    precWithheld: 'Estimate withheld',
    precUnavailable: 'Precision estimate withheld: it needs at least 100 accepted scenarios, valid counts and a measurable central spread. This cutoff is a display safeguard, not proof the approximation is reliable. Run more scenarios and inspect the distribution.',
    precSrcRun: 'your last run',
    precSrcPreview: 'a {n}-scenario preview',
    precMed: 'median ±{v}',
    precEdge: 'P10 / P90 ±{v}',
    precRead: 'Ten times the scenarios cuts this wobble only about 3× (√10). Damodaran: more inputs, more varied distributions and wider ranges need more runs; err toward too many.',
    precCur: 'selected',
    precKeyMed: 'where the median could land', precKeyEdge: 'where P10 / P90 could land',
    precVs: 'At {n} scenarios, luck moves the median by about ±{noise}, against ±{range} of spread that your inputs create: the signal is about {x}× the noise.',
    seedT: 'Seed · {v}',
    seedB: 'The seed fixes the random draws. Keep it, and two runs differ only because your settings differ; change it to see how much the result moves on luck alone.',
    trialsT: 'Scenarios · {v}',
    trialsB: 'Scenarios that break a valuation rule (for example a cost of capital at or below stable growth) are rejected, so the accepted count can be a little lower.'
  },
  'zh-Hans': {
    eyebrow: '这一页如何影响价值',
    toRange: '最近一次区间',
    toGuide: '{tab}如何起作用',
    q_growth: '成长路径有多颠簸？',
    q_margin: '获利能力最终落在哪里？',
    q_capital: '成长需要多少资本？',
    q_wacc: '现金流有多大风险？',
    q_taxTerminal: '预测期之后会怎样？',
    q_relationships: '意外会一起发生吗？',
    l_growth: '营收成长率逐年抽取。这些设置决定每年能偏离基准案例多远，以及好年份之后是否往往还是好年份。',
    l_margin: '营业利润率决定营收有多少变成利润。它的范围决定利润率路径最终落在哪里。',
    l_capital: '营收／资本表示每一元新资本能带来多少营收。数值越低，成长需要的再投资越多，今天要付出的现金也越多。',
    l_wacc: '资金成本用于折现每一笔未来现金流。小小的变动影响深远，因为它会在每一年和终值上层层累积。',
    l_taxTerminal: '预测期结束后，企业按永续稳定成长来估值。稳定成长率、税率和新资本报酬率决定这部分价值。',
    l_relationships: '可以把输入联系起来，让意外同时发生。联动的意外会相互叠加而不是相互抵消，通常会让区间变宽。',
    inputs: '你的假设',
    value: '单独对价值的影响',
    valueRel: '联动对区间的影响',
    valueLead: '只有这一页在变动，其余输入都保持基准案例。{n} 个情景，与你的模拟使用同一个种子。',
    computing: '正在单独模拟这一页…',
    failed: '以当前设置，无法单独模拟这一页。',
    base: '基准案例',
    spread: '单独来看，这一页让价值分布在 {lo} 到 {hi} 之间（10 个情景中有 8 个），约为基准案例的 ±{pct}。',
    noSpread: '以这些设置，这一页不增加任何分散：每个情景得到的价值都一样。',
    knobs: '每项设置的作用',
    sources: '区间来自哪里',
    sourcesLead: '每一页单独变动时，价值中间 80% 的范围。先研究最长的条。各页的影响不能简单相加。',
    together: '所有页一起 · 最近一次模拟',
    pending: '等待中',
    zero: '无分散',
    cite: 'Damodaran：把精力放在最影响价值的少数输入上；用历史、同业或有理据的选择来定义每个分布；再检查它们之间的联系。',
    yr: '第 {n} 年',
    paths: '{n} 条示例路径，颜色代表各自得出的价值',
    pathsFlat: '每个情景都沿着你的基准路径',
    hi: '价值较高', lo: '价值较低',
    band: '中间 80% 的路径',
    baseline: '你的基准案例',
    fixed: '固定',
    stable: '第 {n} 年起稳定',
    sdT: '每年意外幅度 · {v}',
    sdB: '每年都有一次新的意外冲击{metric}。约 3 次中有 2 次落在 ±{v}以内，20 次中有 19 次落在 ±{v2}以内。',
    sdZero: '为零：没有逐年意外。只有终点改变时路径才会移动。',
    rhoT: '持续性 · {v}',
    rhoB: '一次意外有 {p1} 延续到下一年，{p2} 延续到再下一年；一半会在 {half}内消退。若没有固定年份，与基准案例的典型差距会稳定在 ±{stat}左右。',
    rhoZero: '为零：意外不会延续，每一年都是围绕基准案例的全新抽取。',
    rhoNeg: '为负：意外往往在下一年反转，路径围绕基准案例来回摆动。',
    rhoOne: '为一：意外永不消退，路径像随机游走一样漂移，误差逐年累积。',
    echo: '1 个百分点意外的余波',
    fixT: '固定年份 · {v}',
    fixB: '在这些年份，每条路径都精确经过你的基准案例。把你有把握的年份（例如有公司指引的年份）固定下来，其余年份让它变动。',
    fixNone: '没有固定年份：路径从第 1 年就可以变动。',
    endT: '终点',
    endGrowth: '从第 {n} 年起，成长率等于稳定成长率 {g}，所有路径都收敛到这里。',
    endDist: '每个情景都从你的范围（{lo} 至 {hi}）中抽取一个终期值。固定年份之后，路径会朝这个值弯过去，并在终期年份到达。',
    terminal: '终期',
    evNote: '以营运价值显示。',
    rhoIdle: '只有当意外幅度大于零时，持续性才会起作用。',
    noSpreadHint: '这一页目前没有任何变动。把意外幅度调到大于零，或给范围一些宽度，就能看到它的作用。',
    valueLeadRel: '两次模拟都让所有页变动；第二次关闭联动。各 {n} 个情景，与你的模拟使用同一个种子。',
    fixedSet: '每个情景都固定：{list}。给其中一项设定范围，就能看到它的影响有多大。',
    termFixedT: '{name} · 固定为 {v}',
    termFixedB: '每个情景都相同，因此不增加分散。第二条横条显示：若改为 {lo} 至 {hi} 的适度范围，会增加多少分散。',
    echoCap: '1 个百分点的意外，逐年还剩多少',
    short: {growth: '成长', margin: '利润率', salesCapital: '营收／资本', investmentFactor: '投资', reinvestment: '再投资', wacc: 'WACC', taxRate: '税率'},
    endFixed: '路径终点为你的基准案例 {v}。',
    distT: '{family} · {range}',
    fam_fixed: '固定值', fam_triangular: '三角分布', fam_uniform: '均匀分布', fam_normal: '截断常态分布',
    d_fixed: '每个情景都用同一个值，因此这个输入不增加分散。',
    d_triangular: '抽样集中在最可能值 {mode} 附近，越接近上下限越少。平均值 {mean}。Damodaran 建议在数值集中于某个中心估计时使用。',
    d_uniform: '上下限之间每个值的可能性都一样。平均值 {mean}。适合能界定范围、却没有中心估计的输入。',
    d_normal: '以 {mean0} 为中心、分散度 {sd} 的钟形，在上下限处截断。界外的值永远不会被抽到：曲线是按比例重新缩放，而不是被截掉，因此实际平均值为 {mean}。',
    d_mid: '10 次抽样中有 8 次落在 {p10} 至 {p90} 之间。',
    inactiveT: '此方法不使用这个范围',
    inactiveB: '逐年路径取代了这个单一范围。请改为编辑路径设置，或切换为旧版标量抽样。',
    terminalOnly: '在逐年路径下，这个范围决定路径的终点；逐年设置则在途中加入意外。',
    tvShare: '这里终值占营运价值的 {pct}，因此这些设置影响深远。',
    termRow: '{name} · {range}',
    tg: '稳定成长率', ttax: '终期税率', troic: '新资本报酬率',
    taxPath: '逐年税率路径',
    loadT: '共同因子载荷',
    loadB: '每个载荷把一个输入与一个共同冲击联系起来。两个输入的逐年意外相关系数等于两者载荷的乘积：0.7 × 0.7 = 0.49。意外幅度为零的输入无法联动。',
    loadNone: '所有载荷均为零，因此意外彼此独立。',
    targetsT: '年度目标 · {n}',
    targetsB: '误差为 0 的目标会把该年精确固定。误差大于 0 的目标会把路径拉向它，但不强制：是温和的牵引，而不是硬性上下限。',
    linkedT: '营运联动抽样',
    linkedB: '一个共同因子联系成长、利润率与营收／资本（潜在相关系数 0.49 与 0.28）。WACC 保持独立。',
    corr: '逐年意外的相关系数',
    withLinks: '使用你的联动', noLinks: '若彼此独立',
    relSame: '联动目前没有任何作用：请为联动的输入设置大于零的意外幅度。',
    relWider: '你的联动让中间 80% 的范围变宽 {pct}。',
    relNarrower: '你的联动让中间 80% 的范围变窄 {pct}。',
    tabs: {relationships: '变量关系', sampling: '抽样', growth: '成长', targetMargin: '利润率', salesCapital: '营收／资本', wacc: 'WACC', taxTerminal: '税率与终值', growthPremium: '成长', marginShift: '利润率', investmentMultiplier: '投资', waccShift: 'WACC'},
    metric: {growth: '成长率', margin: '利润率', salesCapital: '营收／资本', investmentFactor: '投资系数', reinvestment: '再投资', wacc: '资金成本', taxRate: '税率'},
    unitPts: ' 个百分点', yearsWord: '{n} 年', yearWord: '1 年', underYear: '不到 1 年',
    wiCap: '若只改变这一项设置 · 价值的中间 80%',
    wiLead: '每条横条表示：若只把该设置改为左侧的数值，价值中间 80% 的范围；竖线是基准案例。所有横条使用同一刻度。全程使用相同的情景和种子，也不会改动你的设置。',
    wiYours: '你的设置',
    wiNoPins: '不固定年份',
    wiPin3: '固定第 1–3 年',
    wiFixed: '固定为 {v}',
    wiAt: '{v}',
    wiRange: '{lo} – {hi}',
    edit: '编辑此设置',
    fieldIs: '左侧字段：{f}',
    nSettings: '{n} 项设置',
    leads: '{tab}居首',
    precChip: '当前情景数下中位数约 ±{v}',
    pairT: '{a} vs {b}',
    pairChip: '终点 vs 途中',
    pairRange: '范围',
    endRangeT: '终点范围',
    pairAH: '决定路径的终点',
    pairAB: '每个情景只抽一次，作为终期年的值。它把后段年份整体抬高或压低，就像移动绳子的一端。',
    pairANormal: '它是在你的上下界截断之前钟形曲线的标准差，所以实际终点会更集中一些：10 次中有 8 次落在 {p10} – {p90}。',
    pairBH: '决定途中有多颠簸',
    pairBB: '每年一次新的意外，随持续性逐渐消退。固定年份和终点会把它拉回零，所以它不会移动终点。',
    pairZeroA: '固定：每个情景的终点都相同。',
    pairZeroB: '为零：每条路径都平滑地走向终点。',
    pairStatA: '终期 ±{v}',
    pairStatB: '第 {y} 年最大 ±{v}',
    pairValue: '单独对价值 {v}',
    pairChart: '路径逐年偏离基准案例的幅度（{unit}，中间 80% 的一半）',
    pairBoth: '两者合计',
    pairSum: '两者互相独立，所以像直角三角形的两条边那样合成，而不是直接相加。第 {y} 年：√({a}² + {b}²) ≈ {c}，与模拟测得的 {m} 相近。',
    pairTip: '经验法则：不确定最终落在哪里，就放宽范围；不确定途中有多颠簸，就提高逐年标准差。',
    loadHere: '与其他输入联动 · {v}',
    loadHereB: '载荷把这个输入的逐年意外与一个共同冲击联系起来。它对区间的影响显示在“{tab}”页，那里所有输入会一起变动。',
    toRel: '打开{tab} →',
    q_sampling: '需要多少个情景才够？',
    l_sampling: '每个情景都是对所有输入的一次随机抽取。情景越多，区间越稳定，但精确度只随情景数的平方根提高。',
    precT: '抽样精度的近似估计',
    precLead: '根据{src}中被接受的情景估算抽样波动，仅以正态分布作粗略参照。这些数字假设被接受的估值近似钟形分布，未经验证为 95% 置信区间。偏态、厚尾或大量重复结果都可能使估算不可靠。',
    precAccepted: '尝试 {attempts} 个情景，接受 {accepted} 个。比较结果按此接受率推算。',
    precRowAccepted: '预计接受 {n} 个',
    precRowActual: '已接受 {n} 个',
    precWithheld: '暂不提供精度估计',
    precUnavailable: '暂不提供精度估计：需要至少 100 个被接受的情景、有效计数和可衡量的中间区间。此门槛仅为显示保护，并不证明近似方法可靠。请增加情景数并检查分布。',
    precSrcRun: '你最近一次模拟',
    precSrcPreview: '{n} 个情景的预览',
    precMed: '中位数 ±{v}',
    precEdge: 'P10 / P90 ±{v}',
    precRead: '情景数增加 10 倍，波动只缩小约 3 倍（√10）。Damodaran：输入越多、分布越多样、范围越宽，就需要越多次模拟；宁可多，不要少。',
    precCur: '已选',
    precKeyMed: '中位数可能落在的位置', precKeyEdge: 'P10 / P90 可能落在的位置',
    precVs: '在 {n} 个情景下，运气让中位数变动约 ±{noise}；而你的输入造成的分散约为 ±{range}：信号约为噪声的 {x} 倍。',
    seedT: '种子 · {v}',
    seedB: '种子决定随机抽样。保持不变时，两次模拟的差别只来自你的设置；改变种子，就能看到单凭运气结果会变动多少。',
    trialsT: '情景数 · {v}',
    trialsB: '违反估值规则的情景（例如资金成本不高于稳定成长率）会被剔除，因此被接受的情景数可能略少。'
  }
};
const lang = () => (getLocale() === 'zh-Hans' ? 'zh-Hans' : 'en');
const copy = (key, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), COPY[lang()][key] ?? COPY.en[key] ?? key);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const finite = x => typeof x === 'number' && Number.isFinite(x);
const phone = matchMedia('(max-width: 760px)');

const TRIALS = 400;
// Engine samples flow back as plain data; only the latest few configs are kept.
const cache = new Map();
const remember = (key, value) => { cache.set(key, value); if (cache.size > 40) cache.delete(cache.keys().next().value); };

/* ---------- which settings belong to which tab ---------- */
const PATH_OF = {growth: 'growth', growthPremium: 'growth', targetMargin: 'margin', marginShift: 'margin', wacc: 'wacc', waccShift: 'wacc', taxTerminal: 'taxRate'};
const CAPITAL = ['salesCapital', 'reinvestment', 'investmentFactor'];
const QUESTION = {growth: 'growth', growthPremium: 'growth', targetMargin: 'margin', marginShift: 'margin', salesCapital: 'capital', investmentMultiplier: 'capital', wacc: 'wacc', waccShift: 'wacc', taxTerminal: 'taxTerminal', relationships: 'relationships', sampling: 'sampling'};
function pathMetric(tab, config) {
  if (tab === 'salesCapital' || tab === 'investmentMultiplier') return CAPITAL.find(k => config.annualMetrics?.[k]) || null;
  const m = PATH_OF[tab];
  if (m === 'growth') return config.annualPath && config.method !== 'legacy' ? 'growth' : null;
  return m && config.annualMetrics?.[m] && config.method !== 'legacy' ? m : null;
}
function pathSpec(metric, config) { return metric === 'growth' ? config.annualPath : config.annualMetrics?.[metric]; }
const annualMethod = c => c.method === 'annual-path' || c.method === 'joint-annual-path';
// A scalar range the selected method replaces with a year-by-year path.
function scalarInactive(tab, c) {
  if (!annualMethod(c)) return false;
  if (tab === 'growth' || tab === 'growthPremium') return true;
  if (tab === 'salesCapital' || tab === 'investmentMultiplier') return CAPITAL.some(k => c.annualMetrics?.[k]);
  return false;
}
const center = s => s.type === 'fixed' ? s.value : s.type === 'triangular' ? s.mode : s.type === 'normal' ? Math.min(s.high, Math.max(s.low, s.mean)) : (s.low + s.high) / 2;
function neutralDriver(k, spec, ctx) {
  if (/Shift$|Premium$/.test(k)) return 0;
  if (/Multiplier$/.test(k)) return 1;
  const base = {growth: ctx?.baseline?.[0], targetMargin: ctx?.terminals?.margin, salesCapital: ctx?.metrics?.salesCapital?.[0], wacc: ctx?.terminals?.wacc}[k];
  return finite(base) ? base : center(spec);
}

// A copy of the view settings in which only `tab` varies. Pinned years and
// year targets stay; every other surprise size, range and link is neutral.
function isolate(st, tab, trials = TRIALS) {
  const v = structuredClone(st.config), ctx = st.annualContext, metric = pathMetric(tab, v);
  for (const k of Object.keys(v.drivers || {})) if (k !== tab) v.drivers[k] = {type: 'fixed', value: neutralDriver(k, v.drivers[k], ctx)};
  if (v.annualPath && metric !== 'growth') v.annualPath = {...v.annualPath, innovationSD: 0};
  for (const m of Object.keys(v.annualMetrics || {})) if (m !== metric) v.annualMetrics[m] = {...v.annualMetrics[m], innovationSD: 0};
  if (v.annualTerminal && tab !== 'taxTerminal') for (const k of Object.keys(v.annualTerminal)) {
    const s = v.annualTerminal[k], base = ctx?.terminalScalars?.[k];
    v.annualTerminal[k] = {type: 'fixed', value: finite(base) ? base : center(s)};
  }
  v.dependence = 'independent';
  if (v.jointAnnual?.loadings) v.jointAnnual.loadings = Object.fromEntries(Object.keys(v.jointAnnual.loadings).map(k => [k, 0]));
  v.trials = trials;
  return v;
}
function unlinked(st, trials = TRIALS) {
  const v = structuredClone(st.config);
  v.dependence = 'independent';
  if (v.jointAnnual?.loadings) v.jointAnnual.loadings = Object.fromEntries(Object.keys(v.jointAnnual.loadings).map(k => [k, 0]));
  v.trials = trials;
  return v;
}
function full(st, trials = TRIALS) { const v = structuredClone(st.config); v.trials = trials; return v; }

/* ---------- running the engine quietly ---------- */
let queue = [], busy = null, wanted = null;
function job(st, view) {
  let c;
  try { c = st.validate(collectJointView(st.saved, view)); } catch { return {key: null, error: true}; }
  return {key: st.mountId + JSON.stringify(c), config: c};
}
function summarise(r) {
  if (!r?.accepted) return {error: true};
  const q = r.quantiles, sc = r.scenarios || [];
  // Keep the sample paths a chart can draw, and each path's value rank.
  const sorted = r.samples;
  const rank = v => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; } return lo / Math.max(1, sorted.length - 1); };
  // Guided scenarios carry value per share; Year-by-year ones carry operating value.
  const val = s => r.basis === 'enterprise' ? s.enterprise : finite(s.perShare) ? s.perShare : finite(s.enterprise) ? s.enterprise : s.value;
  const paths = sc.slice(0, 160).map(s => ({growth: s.growthPath, metrics: s.metricPaths, terminal: s.terminal, rank: rank(val(s))}));
  // Per-year middle 80% of every path, and of the terminal draws, across all scenarios.
  const qs = (xs, p) => { if (!xs.length) return NaN; const h = (xs.length - 1) * p, i = Math.floor(h); return xs[i] + (xs[Math.min(xs.length - 1, i + 1)] - xs[i]) * (h - i); };
  const bands = {}, first = sc[0] || {};
  for (const k of [first.growthPath ? 'growth' : null, ...Object.keys(first.metricPaths || {})].filter(Boolean)) {
    const get = x => k === 'growth' ? x.growthPath : x.metricPaths?.[k], n = get(first)?.length || 0, lo = [], hi = [];
    for (let i = 0; i < n; i++) { const xs = sc.map(x => get(x)?.[i]).filter(finite).sort((a, b) => a - b); lo.push(qs(xs, .1)); hi.push(qs(xs, .9)); }
    const ends = sc.map(x => x.terminal?.[k]).filter(finite).sort((a, b) => a - b);
    bands[k] = {lo, hi, endLo: qs(ends, .1), endHi: qs(ends, .9)};
  }
  return {bands, p10: q.p10, p50: q.p50, p90: q.p90, p01: sorted[Math.floor(.01 * (sorted.length - 1))], p99: sorted[Math.ceil(.99 * (sorted.length - 1))], base: r.basis === 'enterprise' ? r.baseline?.enterprise ?? null : r.baseline?.perShare ?? r.baseline?.value ?? null, samples: sorted, paths, accepted: r.accepted};
}
function request(st, key, view, priority = false) {
  const j = job(st, view);
  if (!j.key) return {error: true};
  wanted?.add(j.key);
  if (cache.has(j.key)) return cache.get(j.key);
  if (!queue.some(q => q.key === j.key) && busy?.key !== j.key) (priority ? queue.unshift.bind(queue) : queue.push.bind(queue))({key: j.key, config: j.config, st, label: key});
  pump();
  return null;
}
function pump() {
  if (busy || !queue.length) return;
  const next = queue.shift();
  if (next.st.running) { queue.unshift(next); setTimeout(pump, 600); return; }
  const controller = new AbortController();
  busy = {key: next.key, controller};
  // A preview that has not finished in a few seconds is not worth waiting for.
  const watchdog = setTimeout(() => { controller.abort(); remember(next.key, {error: true}); }, 9000);
  const go = () => next.st.simulate(next.config, {signal: controller.signal, chunkSize: 12})
    .then(r => remember(next.key, summarise(r)), e => { if (e?.name !== 'AbortError') remember(next.key, {error: true}); })
    .finally(() => { clearTimeout(watchdog); busy = null; repaintSoon(); pump(); });
  (window.requestIdleCallback || (f => setTimeout(f, 30)))(go, {timeout: 400});
}
function dropQueue(mountId) {
  queue = queue.filter(q => q.st.mountId === mountId);
  if (busy && !busy.key.startsWith(mountId)) busy.controller.abort();
}

/* ---------- formatting ---------- */
const nf = new Map();
const num = (v, d, min = 0) => { const k = lang() + d + ':' + min; if (!nf.has(k)) nf.set(k, new Intl.NumberFormat(lang() === 'zh-Hans' ? 'zh-CN' : 'en-US', {maximumFractionDigits: d, minimumFractionDigits: min})); return nf.get(k).format(v); };
const sign = v => (v < 0 ? '−' : '');
const isRate = k => !['salesCapital', 'investmentFactor', 'reinvestment', 'investmentMultiplier'].includes(k);
const fmtIn = (k, v, digits = 1) => {
  if (!finite(v)) return '—';
  if (k === 'reinvestment') return sign(v) + num(Math.abs(v), 0);
  if (!isRate(k)) return sign(v) + num(Math.abs(v), 2) + '×';
  return sign(v) + num(Math.abs(v * 100), digits) + '%';
};
// Changes in rate units read as percentage points.
const fmtStep = (k, v) => !finite(v) ? '—' : isRate(k) ? num(v * 100, 1) + copy('unitPts') : k === 'reinvestment' ? num(v, 0) : num(v, 2) + '×';
// Year-by-year values are operating value in currency millions: shown as $2.07T.
let money = null;
const SYM = {USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', TWD: 'NT$', KRW: '₩'};
function fmtVal(v) {
  if (!finite(v)) return '—';
  if (money) {
    const a = Math.abs(v), [d, u] = a >= 1e6 ? [1e6, 'T'] : a >= 1e3 ? [1e3, 'B'] : [1, 'M'], x = a / d;
    const body = num(x, x >= 100 ? 0 : x >= 10 ? 1 : 2, x >= 100 ? 0 : x >= 10 ? 1 : 2) + u, sym = SYM[money];
    return sign(v) + (sym ? sym + body : body + ' ' + money);
  }
  return Math.abs(v) >= 1e4 ? sign(v) + num(Math.abs(v), 0) : sign(v) + num(Math.abs(v), 2, 2);
}
const range = (a, b) => `${a} – ${b}`;
// Round axis ticks: steps of 1, 2 or 5 in the input's own units.
function ticks(lo, hi, count = 3) {
  const raw = (hi - lo) / count, mag = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
  const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-12; v += step) out.push(+v.toFixed(12));
  return out;
}
const fmtPct = v => num(v * 100, v < .1 ? 1 : 0) + '%';
const yearsText = y => y < 1 ? copy('underYear') : Math.abs(y - 1) < .05 ? copy('yearWord') : copy('yearsWord', {n: num(y, 1)});
const yearsList = ys => {
  const out = []; let a = null, b = null;
  for (const y of ys) { if (a === null) { a = b = y; } else if (y === b + 1) b = y; else { out.push(a === b ? `${a}` : `${a}–${b}`); a = b = y; } }
  if (a !== null) out.push(a === b ? `${a}` : `${a}–${b}`);
  return out.length ? (lang() === 'zh-Hans' ? '第 ' + out.join('、') + ' 年' : 'Y' + out.join(', Y')) : '—';
};

/* ---------- charts ---------- */
// Chart width in SVG units; phones get a narrower canvas so labels stay legible.
let W = 560;
function valueChart(sum, label) {
  const H = 132, top = 18, bottom = 96, left = 6, right = W - 6;
  const base = sum.base;
  let lo = Math.min(sum.p01, finite(base) ? base : sum.p01), hi = Math.max(sum.p99, finite(base) ? base : sum.p99);
  if (!(hi > lo)) { const pad = Math.max(Math.abs(lo) * .08, 1); lo -= pad; hi += pad; }
  const pad = (hi - lo) * .06; lo -= pad; hi += pad;
  const x = v => left + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (right - left);
  const bins = 30, counts = new Array(bins).fill(0), s = sum.samples;
  for (const v of s) counts[Math.max(0, Math.min(bins - 1, Math.floor((v - lo) / (hi - lo) * bins)))]++;
  const max = Math.max(...counts) || 1, bw = (right - left) / bins;
  const bars = counts.map((c, i) => {
    if (!c) return '';
    const h = Math.max(2, c / max * (bottom - top)), mid = lo + (i + .5) / bins * (hi - lo);
    return `<rect x="${(left + i * bw + 1).toFixed(1)}" y="${(bottom - h).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="${finite(base) && mid < base ? 'is-lo' : 'is-hi'}"/>`;
  }).join('');
  const p10 = x(sum.p10), p90 = x(sum.p90);
  const b = finite(base) ? `<line x1="${x(base)}" x2="${x(base)}" y1="${top - 8}" y2="${bottom + 4}" class="rx-mcg-base"/><text x="${x(base)}" y="${top - 10}" text-anchor="${x(base) > W * .8 ? 'end' : x(base) < W * .2 ? 'start' : 'middle'}" class="rx-mcg-note">${esc(copy('base'))} ${esc(fmtVal(base))}</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <rect x="${p10}" y="${bottom + 10}" width="${Math.max(1, p90 - p10)}" height="5" rx="2.5" class="rx-mcg-mid"/>
    ${bars}
    <line x1="${left}" x2="${right}" y1="${bottom}" y2="${bottom}" class="rx-mcg-axis"/>
    ${b}
    <text x="${p10}" y="${bottom + 32}" text-anchor="end" class="rx-mcg-tick">${esc(fmtVal(sum.p10))}</text>
    <text x="${p90}" y="${bottom + 32}" text-anchor="start" class="rx-mcg-tick">${esc(fmtVal(sum.p90))}</text>
  </svg>`;
}

function fanChart(st, metric, sum, end = null) {
  const ctx = st.annualContext, baseline = metric === 'growth' ? ctx?.baseline : ctx?.metrics?.[metric];
  if (!baseline?.length) return '';
  const spec = pathSpec(metric, st.config) || {};
  const paths = (sum?.paths || []).map(p => ({v: metric === 'growth' ? p.growth : p.metrics?.[metric], end: p.terminal?.[metric], rank: p.rank})).filter(p => Array.isArray(p.v) && p.v.length === baseline.length);
  // `end` is the terminal range a scalar draw sets: drawn as a strip past the last year.
  const n = baseline.length, H = 176, top = 14, bottom = 140, left = 40, right = W - (end ? 64 : 10);
  const all = [baseline, ...paths.map(p => p.v), end ? [end.low, end.high] : []].flat().filter(finite);
  let lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo, minSpan = isRate(metric) ? .02 : Math.max(.2, Math.abs(hi) * .1);
  if (span < minSpan) { const mid = (hi + lo) / 2; lo = mid - minSpan / 2; hi = mid + minSpan / 2; }
  const pad = (hi - lo) * .08; lo -= pad; hi += pad;
  const X = i => left + (n === 1 ? .5 : i / (n - 1)) * (right - left), Y = v => bottom - (v - lo) / (hi - lo) * (bottom - top);
  const line = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
  const varied = paths.some(p => p.v.some((v, i) => Math.abs(v - baseline[i]) > 1e-9));
  // The middle 80% of paths, year by year.
  let band = '';
  if (varied && paths.length > 20) {
    const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); const h = (s.length - 1) * p, i = Math.floor(h); return s[i] + (s[Math.min(s.length - 1, i + 1)] - s[i]) * (h - i); };
    const upper = baseline.map((_, i) => q(paths.map(p => p.v[i]), .9)), lower = baseline.map((_, i) => q(paths.map(p => p.v[i]), .1));
    band = `<path d="${line(upper)}${lower.map((v, i) => `L${X(n - 1 - i).toFixed(1)} ${Y(lower[n - 1 - i]).toFixed(1)}`).join('')}Z" class="rx-mcg-band"/>`;
  }
  const shown = varied ? paths.filter((_, i) => i % Math.max(1, Math.floor(paths.length / 36)) === 0).slice(0, 36) : [];
  // With a terminal strip, each path continues (dashed) to the terminal value it drew.
  const x0 = right + 24;
  const lines = shown.map(p => `<path d="${line(p.v)}${end && finite(p.end) ? `M${X(n - 1).toFixed(1)} ${Y(p.v[n - 1]).toFixed(1)}L${x0} ${Y(p.end).toFixed(1)}` : ''}" class="rx-mcg-path" style="--r:${p.rank.toFixed(3)}"/>`).join('');
  const pins = (spec.fixedYears || []).filter(y => y <= n).map(y => `<circle cx="${X(y - 1)}" cy="${Y(baseline[y - 1])}" r="4.5" class="rx-mcg-pin"/>`).join('');
  // One quiet marker per year, lit while its year field is focused or hovered.
  const marks = baseline.map((v, i) => `<g class="rx-mcg-yr" data-yr="${i + 1}"><line x1="${X(i)}" x2="${X(i)}" y1="${top}" y2="${bottom}"/><circle cx="${X(i)}" cy="${Y(v)}" r="7"/></g>`).join('');
  const ty = metric === 'growth' ? ctx.terminalYear : null;
  const stable = ty && ty <= n ? `<line x1="${X(ty - 1)}" x2="${X(ty - 1)}" y1="${top}" y2="${bottom}" class="rx-mcg-grid"/><text x="${X(ty - 1) - 4}" y="${top + 10}" text-anchor="end" class="rx-mcg-note">${esc(copy('stable', {n: ty}))}</text>` : '';
  const yt = ticks(lo, hi, 3);
  const yTicks = yt.map(v => `<text x="${left - 6}" y="${Y(v) + 4}" text-anchor="end" class="rx-mcg-tick">${esc(fmtIn(metric, v, Math.abs(yt[1] - yt[0]) < .01 && isRate(metric) ? 1 : 0))}</text><line x1="${left}" x2="${right}" y1="${Y(v)}" y2="${Y(v)}" class="${Math.abs(v) < 1e-12 ? 'rx-mcg-axis' : 'rx-mcg-grid'}"/>`).join('');
  const xTicks = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => `<text x="${X(i)}" y="${bottom + 18}" text-anchor="${i === 0 ? 'start' : i === n - 1 && !end ? 'end' : 'middle'}" class="rx-mcg-tick">${esc(copy('yr', {n: i + 1}))}</text>`).join('');
  let strip = '';
  if (end) {
    const wMax = 22, pts = end.density;
    const shape = `M${x0} ${Y(end.low)}` + pts.map(p => `L${(x0 + p.y * wMax).toFixed(1)} ${Y(p.x).toFixed(1)}`).join('') + `L${x0} ${Y(end.high)}Z`;
    strip = `<line x1="${right}" x2="${x0}" y1="${Y(baseline.at(-1))}" y2="${Y(baseline.at(-1))}" class="rx-mcg-grid"/><path d="${shape}" class="rx-mcg-dens"/><line x1="${x0}" x2="${x0}" y1="${Y(end.low)}" y2="${Y(end.high)}" class="rx-mcg-axis"/><text x="${x0 + 8}" y="${Math.max(top + 4, Y(end.high) - 8)}" text-anchor="middle" class="rx-mcg-tick">${esc(copy('terminal'))}</text>`;
  }
  const caption = varied ? copy('paths', {n: shown.length}) : copy('pathsFlat');
  return `<figure class="rx-mcg-fig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(caption)}">${yTicks}${stable}${marks}${band}${lines}<path d="${line(baseline)}" class="rx-mcg-baseline"/>${pins}${strip}${xTicks}</svg>
    <figcaption><span>${esc(caption)}</span>${varied ? `<span class="rx-mcg-key"><i class="is-lo"></i>${esc(copy('lo'))}<i class="is-hi"></i>${esc(copy('hi'))}</span>` : ''}<span class="rx-mcg-key"><i class="is-base"></i>${esc(copy('baseline'))}${(spec.fixedYears || []).length ? `<i class="is-pin"></i>${esc(copy('fixed'))}` : ''}</span></figcaption></figure>`;
}

function densityChart(key, spec, small = false) {
  let sum;
  try { sum = distributionSummary(spec); } catch { return ''; }
  const Wd = small ? 320 : W, H = small ? 50 : 104, top = 8, bottom = H - (small ? 16 : 24), left = 6, right = Wd - 6;
  if (sum.type === 'fixed' || sum.high === sum.low) {
    return `<svg viewBox="0 0 ${Wd} ${H}" aria-hidden="true"><line x1="${left}" x2="${right}" y1="${bottom}" y2="${bottom}" class="rx-mcg-axis"/><line x1="${Wd / 2}" x2="${Wd / 2}" y1="${top + 6}" y2="${bottom}" class="rx-mcg-base"/><circle cx="${Wd / 2}" cy="${top + 6}" r="4.5" class="rx-mcg-pin"/><text x="${Wd / 2}" y="${bottom + 14}" text-anchor="middle" class="rx-mcg-tick">${esc(fmtIn(key, sum.low))}</text></svg>`;
  }
  const lo = sum.low, hi = sum.high, X = v => left + (v - lo) / (hi - lo) * (right - left), Y = y => bottom - y * (bottom - top);
  const pts = sum.density, area = `M${X(lo)} ${bottom}` + pts.map(p => `L${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('') + `L${X(hi)} ${bottom}Z`;
  const p10 = distributionQuantile(.1, spec), p90 = distributionQuantile(.9, spec);
  const clip = `rx-mcg-clip-${key}-${small ? 's' : 'l'}`;
  return `<svg viewBox="0 0 ${Wd} ${H}" aria-hidden="true"><defs><clipPath id="${clip}"><rect x="${X(p10)}" y="0" width="${Math.max(1, X(p90) - X(p10))}" height="${H}"/></clipPath></defs>
    <path d="${area}" class="rx-mcg-dens"/><path d="${area}" class="rx-mcg-dens is-mid" clip-path="url(#${clip})"/>
    <line x1="${left}" x2="${right}" y1="${bottom}" y2="${bottom}" class="rx-mcg-axis"/>
    <line x1="${X(sum.mean)}" x2="${X(sum.mean)}" y1="${top}" y2="${bottom}" class="rx-mcg-base"/>
    <text x="${left}" y="${bottom + 14}" class="rx-mcg-tick">${esc(fmtIn(key, lo))}</text><text x="${right}" y="${bottom + 14}" text-anchor="end" class="rx-mcg-tick">${esc(fmtIn(key, hi))}</text>
  </svg>`;
}

function echoBars(rho) {
  const k = 7, w = 18, gap = 6, H = 40;
  return `<svg class="rx-mcg-echo" viewBox="0 0 ${k * (w + gap)} ${H + 2}" role="img" aria-label="${esc(copy('echo'))}">${Array.from({length: k}, (_, i) => {
    const v = Math.pow(rho, i), h = Math.max(1.5, Math.abs(v) * H / 2);
    return `<rect x="${i * (w + gap)}" y="${v >= 0 ? H / 2 - h : H / 2}" width="${w}" height="${h}" rx="2" class="${i ? '' : 'is-first'}"/>`;
  }).join('')}<line x1="0" x2="${k * (w + gap)}" y1="${H / 2}" y2="${H / 2}" class="rx-mcg-axis"/></svg>`;
}

function corrGrid(keys, loadings, live) {
  const n = keys.length, cell = 46, lab = 104, size = lab + n * cell;
  const name = k => COPY[lang()].short[k] || k;
  // A pair is linked only when both inputs have yearly surprises.
  const cells = keys.map((a, i) => keys.map((b, j) => {
    const on = i === j || (live[a] && live[b]), r = i === j ? 1 : (loadings[a] || 0) * (loadings[b] || 0);
    return `<rect x="${lab + j * cell + 1}" y="${i * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="5" class="rx-mcg-cell${i === j ? ' is-self' : on ? '' : ' is-off'}" style="--c:${on && i !== j ? Math.abs(r).toFixed(3) : 0}"/><text x="${lab + j * cell + cell / 2}" y="${i * cell + cell / 2 + 4}" text-anchor="middle" class="rx-mcg-tick ${on && i !== j && Math.abs(r) > .55 ? 'is-on' : ''}">${i === j ? '1' : on ? num(r, 2) : '·'}</text>`;
  }).join('')).join('');
  const rows = keys.map((k, i) => `<text x="${lab - 10}" y="${i * cell + cell / 2 + 4}" text-anchor="end" class="rx-mcg-tick${live[k] ? ' is-live' : ''}">${esc(name(k))}</text>`).join('');
  return `<svg viewBox="0 0 ${size} ${n * cell + 4}" class="rx-mcg-grid-svg" role="img" aria-label="${esc(copy('corr'))}">${rows}${cells}</svg>`;
}

/* ---------- the guide for one tab ---------- */
// Sections fold, closed by default, with a short answer in the header so a
// closed section still says something. A reader's choice survives repaints
// and tab changes.
const folds = new Map();
const device = () => (phone.matches ? ':p' : ':d');
// Small line icons, one per kind of section.
const ICON = {
  value: '<path d="M2.5 13.5h11M4 13V9.5M6.5 13V6M9 13V3.5M11.5 13V8"/>',
  pair: '<path d="M2.5 11c1.6 0 2-4 3.6-4s1.7 3 3.3 3 1.5-5.5 3.6-6.5"/><circle cx="13" cy="3.5" r="1.4"/>',
  knobs: '<path d="M2.5 5h11M2.5 11h11"/><circle cx="6" cy="5" r="1.6"/><circle cx="10.5" cy="11" r="1.6"/>',
  sources: '<path d="M2.5 3.5h9M2.5 8h6M2.5 12.5h3.5"/>',
  prec: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.4"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2"/>'
};
const icon = k => ICON[k] ? `<span class="rx-mcg-ic" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg></span>` : '';
function fold(key, title, body, {chip = '', cls = 'rx-mcg-block', open = false, ic = ''} = {}) {
  const k = key + device(), isOpen = folds.has(k) ? folds.get(k) : open;
  return `<details class="${cls} rx-mcg-fold" data-fold="${k}"${isOpen ? ' open' : ''}><summary>${icon(ic)}<h4>${esc(title)}</h4>${chip ? `<span class="rx-mcg-chip">${esc(chip)}</span>` : ''}</summary><div class="rx-mcg-body">${body}</div></details>`;
}
// The label a setting carries on the left, so both sides use the same words.
let curRoot = null;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function fieldLabel(f) {
  const el = f && curRoot?.querySelector(`.mc-setup [id$="mc-${f}"]`); if (!el) return '';
  const l = curRoot.querySelector(`label[for="${el.id}"]`) || el.closest('label'); if (!l) return '';
  // Read the label's own words, skipping any control nested inside it.
  const skip = /^(SELECT|INPUT|TEXTAREA|BUTTON)$/;
  const words = n => n.nodeType === 3 ? n.nodeValue : n.nodeType !== 1 || skip.test(n.tagName) || n.getAttribute?.('role') === 'radiogroup' ? '' : [...(n.childNodes || [])].map(words).join('');
  return words(l).replace(/\s+/g, ' ').trim().slice(0, 64);
}
const bare = label => label.split(/\s*[·・]\s*/)[0];
function fieldAvailable(f) {
  const el = f && curRoot?.querySelector(`.mc-setup [id$="mc-${f}"]`);
  // A closed disclosure can be opened; a hidden mode-specific panel cannot.
  return !!el && !el.closest('[hidden]');
}
// A row explains one setting and folds on its own. `k` names it for the focus
// link with the field on the left; `f` is that field's id after "mc-".
function knob(title, body, extra = '', k = '', f = '') {
  const cut = title.indexOf(' · '), name = cut > 0 ? title.slice(0, cut) : title, val = cut > 0 ? title.slice(cut + 3) : '';
  const attrs = `${k ? ` data-k="${esc(k)}"` : ''}${f ? ` data-f="${esc(f)}"` : ''}`;
  if (!body && !extra) return `<li class="is-plain"${attrs}><b>${esc(title)}</b></li>`;
  const field = fieldLabel(f), key = 'kd:' + (k || name) + device(), open = folds.get(key) ?? false;
  const head = `<summary><span class="rx-mcg-kn"><b>${esc(name)}</b>${val ? `<em>${esc(val)}</em>` : ''}</span>${field ? `<small>${esc(copy('fieldIs', {f: field}))}</small>` : ''}</summary>`;
  const edit = fieldAvailable(f) ? `<button type="button" class="rx-mcg-link" data-edit="${esc(f)}">${esc(copy('edit'))}</button>` : '';
  return `<li${attrs}><details class="rx-mcg-kd" data-fold="${key}"${open ? ' open' : ''}>${head}<div class="rx-mcg-kb">${body ? `<p>${esc(body)}</p>` : ''}${extra}${edit}</div></details></li>`;
}

/* ---------- what-if ladders ---------- */
// Each rung reruns the tab on its own with one setting changed: same scenarios,
// same seed, so the rungs differ only by that setting. Nothing is applied.
let ladderScale = 0;
function ladder(st, rungs) {
  const seenKeys = new Set(), rows = [];
  for (const r of rungs) {
    const j = job(st, r.view);
    if (!j.key || seenKeys.has(j.key)) continue;
    seenKeys.add(j.key);
    rows.push({...r, sum: request(st, 'wi', r.view, r.yours)});
  }
  if (rows.length < 2) return '';
  const ok = rows.filter(r => r.sum && !r.sum.error);
  const base = ok.find(r => finite(r.sum.base))?.sum.base ?? ok[0]?.sum.p50;
  const live = rows.filter(r => !(r.sum && r.sum.error));
  if (live.length < 2) return '';
  // Bars sit on one scale shared by every ladder in the guide (relative to the
  // base case), so a long bar here is long compared with the other settings too.
  const rel = v => (v - base) / Math.abs(base || 1);
  const items = live.map(r => {
    const s = r.sum, ready = s && !s.error && finite(base);
    if (ready) ladderScale = Math.max(ladderScale, Math.abs(rel(s.p10)), Math.abs(rel(s.p90)));
    const pct = ready && base ? '±' + fmtPct((s.p90 - s.p10) / 2 / Math.abs(base)) : ready ? range(fmtVal(s.p10), fmtVal(s.p90)) : '…';
    return `<li class="${r.yours ? 'is-yours' : ''}${ready ? '' : ' is-wait'}"><span>${esc(r.label)}${r.yours ? `<small>${esc(copy('wiYours'))}</small>` : ''}</span><i style="--l:${ready ? rel(s.p10).toFixed(5) : 0};--h:${ready ? rel(s.p90).toFixed(5) : 0}"${ready ? ` title="${esc(range(fmtVal(s.p10), fmtVal(s.p90)))}"` : ''}></i><em>${esc(pct)}</em></li>`;
  }).join('');
  return `<figure class="rx-mcg-wi" aria-label="${esc(copy('wiCap'))}"><ul>${items}</ul></figure>`;
}
function tweak(st, tab, edit) { const v = isolate(st, tab); edit(v); return v; }
function editPath(metric, patch) {
  return v => { if (metric === 'growth') v.annualPath = {...v.annualPath, ...patch}; else v.annualMetrics[metric] = {...v.annualMetrics[metric], ...patch}; };
}
const uniq = (xs, eq = (a, b) => Math.abs(a - b) < 1e-9) => xs.filter((x, i) => xs.findIndex(y => eq(x, y)) === i).sort((a, b) => a - b);
// A range with its width scaled around its centre. Bounds stay positive for
// ratios, so the rung remains a valid input.
function widen(spec, f, key) {
  if (spec.type === 'fixed') return spec;
  const c = center(spec);
  if (!isRate(key) && spec.low > 0) f = Math.min(f, .9 * c / Math.max(c - spec.low, 1e-9));
  const s = {...spec, low: c - (c - spec.low) * f, high: c + (spec.high - c) * f};
  if (spec.type === 'normal') s.sd = spec.sd * f;
  return s;
}
const specRange = (key, s) => { try { const m = distributionSummary(s); return m.type === 'fixed' ? copy('wiFixed', {v: fmtIn(key, m.low)}) : copy('wiRange', {lo: fmtIn(key, m.low), hi: fmtIn(key, m.high)}); } catch { return ''; } };
function distLadder(st, tab, key, spec, place) {
  if (!spec || spec.type === 'fixed') return '';
  const set = s => v => place(v, s);
  const wide = widen(spec, 2, key);
  return ladder(st, [
    {label: copy('wiFixed', {v: fmtIn(key, center(spec))}), view: tweak(st, tab, set({type: 'fixed', value: center(spec)}))},
    {label: specRange(key, spec), view: isolate(st, tab), yours: true},
    {label: specRange(key, wide), view: tweak(st, tab, set(wide))}
  ]);
}

const pathField = (metric, part) => metric === 'growth' ? `annual-${part === 'sd' ? 'innovation-sd' : part}` : `metric-${metric}-${part}`;
function pathKnobs(st, metric, endpoint, tab) {
  const spec = pathSpec(metric, st.config); if (!spec) return '';
  const sd = spec.innovationSD, rho = spec.persistence, rows = [], mName = COPY[lang()].metric[metric] || metric;
  const fixed = spec.fixedYears || [];
  // Rungs: no surprises, yours, twice as large (or a typical size when yours is zero).
  const typical = isRate(metric) ? .02 : .2;
  const sdRungs = uniq([0, sd, sd > 0 ? 2 * sd : typical]).map(v => ({label: fmtStep(metric, v), view: v === sd ? isolate(st, tab) : tweak(st, tab, editPath(metric, {innovationSD: v})), yours: v === sd}));
  rows.push(knob(copy('sdT', {v: fmtStep(metric, sd)}), sd > 0 ? copy('sdB', {metric: mName, v: fmtStep(metric, sd), v2: fmtStep(metric, 2 * sd)}) : copy('sdZero'), ladder(st, sdRungs), 'sd', pathField(metric, 'sd')));
  let rb;
  if (!(sd > 0)) rb = copy('rhoIdle');
  else if (Math.abs(rho) < 1e-9) rb = copy('rhoZero');
  else if (rho >= 1) rb = copy('rhoOne');
  else if (rho < 0) rb = copy('rhoNeg');
  else rb = copy('rhoB', {p1: fmtPct(rho), p2: fmtPct(rho * rho), half: yearsText(Math.log(.5) / Math.log(rho)), stat: fmtStep(metric, sd / Math.sqrt(1 - rho * rho))});
  const rhoRungs = sd > 0 ? uniq([0, rho, rho >= .85 ? .5 : .9]).map(v => ({label: num(v, 2), view: v === rho ? isolate(st, tab) : tweak(st, tab, editPath(metric, {persistence: v})), yours: v === rho})) : [];
  rows.push(knob(copy('rhoT', {v: num(rho, 2)}), rb, sd > 0 ? `<figure class="rx-mcg-echo-fig">${echoBars(rho)}<figcaption>${esc(copy('echoCap'))}</figcaption></figure>${ladder(st, rhoRungs)}` : '', 'rho', pathField(metric, 'persistence')));
  // Pinning removes surprise from those years: compare with no pins, or with pinning the first three.
  const ty = metric === 'growth' ? st.annualContext?.terminalYear : null;
  const pin3 = [1, 2, 3].filter(y => !ty || y < ty);
  const fixRungs = sd > 0 ? (fixed.length ? [{label: copy('wiNoPins'), view: tweak(st, tab, editPath(metric, {fixedYears: []}))}, {label: yearsList(fixed), view: isolate(st, tab), yours: true}]
    : [{label: copy('wiNoPins'), view: isolate(st, tab), yours: true}, {label: copy('wiPin3'), view: tweak(st, tab, editPath(metric, {fixedYears: pin3}))}]) : [];
  rows.push(knob(copy('fixT', {v: fixed.length ? yearsList(fixed) : '—'}), fixed.length ? copy('fixB') : copy('fixNone'), ladder(st, fixRungs), 'fix', pathField(metric, 'fixed-1')));
  if (endpoint) rows.push(knob(copy('endT'), endpoint, '', 'end'));
  // The loading field sits on this tab; what it does is shown with every input varying.
  const load = st.config.method === 'joint-annual-path' ? st.config.jointAnnual?.loadings?.[metric] : undefined;
  if (finite(load) && st.tabs.some(([k]) => k === 'relationships')) {
    const rel = COPY[lang()].tabs.relationships || st.tabs.find(([k]) => k === 'relationships')[1];
    rows.push(knob(copy('loadHere', {v: num(load, 2)}), copy('loadHereB', {tab: rel}), `<button type="button" class="rx-mcg-link" data-tab="relationships">${esc(copy('toRel', {tab: rel}))}</button>`, 'load', `joint-${metric}-loading`));
  }
  return rows.join('');
}

function distKnob(key, spec, note, extra = '', k = 'dist', f = '', prefix = '') {
  let s; try { s = distributionSummary(spec); } catch { return ''; }
  const range = s.type === 'fixed' ? fmtIn(key, s.low) : `${fmtIn(key, s.low)} – ${fmtIn(key, s.high)}`;
  const body = copy('d_' + s.type, {mode: fmtIn(key, spec.mode), mean: fmtIn(key, s.mean), mean0: fmtIn(key, spec.mean), sd: fmtStep(key, spec.sd)}) + (s.type === 'fixed' ? '' : ' ' + copy('d_mid', {p10: fmtIn(key, distributionQuantile(.1, spec)), p90: fmtIn(key, distributionQuantile(.9, spec))})) + (note ? ' ' + note : '');
  return knob((prefix ? prefix + ' · ' : '') + copy('distT', {family: copy('fam_' + s.type), range}), body, `<div class="rx-mcg-dens-wrap">${densityChart(key, spec, true)}</div>${extra}`, k, f);
}

function valueBlock(st, sum, what) {
  if (!sum) return `<div class="rx-mcg-value is-loading"><p class="rx-mcg-status">${esc(copy('computing'))}</p><div class="rx-mcg-skel"></div></div>`;
  if (sum.error) return `<div class="rx-mcg-value"><p class="rx-mcg-status">${esc(copy('failed'))}</p></div>`;
  const width = sum.p90 - sum.p10, base = finite(sum.base) ? sum.base : sum.p50;
  const flat = !(width > Math.abs(base) * 1e-4);
  const text = flat ? copy('noSpread', {what}) + ' ' + copy('noSpreadHint') : copy('spread', {lo: fmtVal(sum.p10), hi: fmtVal(sum.p90), pct: fmtPct(width / 2 / Math.abs(base))});
  return `<div class="rx-mcg-value">${flat ? '' : valueChart(sum, text)}<p class="rx-mcg-read">${esc(text)}</p></div>`;
}

function sourcesBlock(st) {
  const tabs = st.tabs.map(([k]) => k).filter(k => !['relationships', 'sampling'].includes(k));
  // Same settings, trials and seed as each tab's own chart, so the numbers agree.
  const rows = tabs.map(k => ({k, sum: request(st, 'tab:' + k, isolate(st, k))}));
  const ok = rows.filter(r => r.sum && !r.sum.error);
  const base = ok.find(r => finite(r.sum.base))?.sum.base;
  const lows = ok.map(r => r.sum.p10), highs = ok.map(r => r.sum.p90);
  if (st.latest) { lows.push(st.latest.p10); highs.push(st.latest.p90); }
  if (finite(base)) { lows.push(base); highs.push(base); }
  const lo = Math.min(...lows), hi = Math.max(...highs), span = Math.max(hi - lo, 1e-9);
  const at = v => ((v - lo) / span).toFixed(4);
  const line = (label, s, state, k) => `<li class="${k === st.activeTab ? 'is-current' : ''}${k ? '' : ' is-total'}"><button type="button" ${k ? `data-tab="${k}"` : 'disabled'}><span>${esc(label)}</span><i style="--a:${s ? at(s.p10) : 0};--w:${s ? ((s.p90 - s.p10) / span).toFixed(4) : 0}${finite(base) ? `;--b:${at(base)}` : ''}"></i><em>${esc(state)}</em></button></li>`;
  const flat = s => !(s.p90 - s.p10 > Math.abs(base || 1) * 1e-4);
  const items = rows.map(r => line(COPY[lang()].tabs[r.k] || st.tabs.find(([k]) => k === r.k)?.[1] || r.k, r.sum && !r.sum.error && !flat(r.sum) ? r.sum : null, !r.sum ? copy('pending') : r.sum.error ? '—' : flat(r.sum) ? copy('zero') : range(fmtVal(r.sum.p10), fmtVal(r.sum.p90)), r.k)).join('');
  const total = st.latest ? line(copy('together'), st.latest, range(fmtVal(st.latest.p10), fmtVal(st.latest.p90)), null) : '';
  const top = ok.filter(r => !flat(r.sum)).sort((a, b) => (b.sum.p90 - b.sum.p10) - (a.sum.p90 - a.sum.p10))[0];
  const chip = top ? copy('leads', {tab: COPY[lang()].tabs[top.k] || top.k}) : rows.some(r => !r.sum) ? '…' : '';
  return fold('sources', copy('sources'), `<p class="rx-mcg-sub">${esc(copy('sourcesLead'))}</p><ul>${items}${total}</ul><p class="rx-mcg-cite">${esc(copy('cite'))}</p>`, {chip, cls: 'rx-mcg-sources', ic: 'sources'});
}

function endRange(tab, driver, metric, st) {
  // The terminal range a scalar draw gives a path, in the path's own units.
  let spec = null, shift = 0;
  if (metric === 'growth') spec = st.config.annualTerminal?.growth;
  else if (driver && !scalarInactive(tab, st.config)) { spec = driver; if (/Shift$/.test(tab)) shift = st.annualContext?.terminals?.[metric] || 0; }
  if (!spec || spec.type === 'fixed') return null;
  let sm; try { sm = distributionSummary(spec); } catch { return null; }
  if (!(sm.high > sm.low)) return null;
  return {low: sm.low + shift, high: sm.high + shift, density: sm.density.map(p => ({x: p.x + shift, y: p.y}))};
}

/* ---------- end point vs. the way there ---------- */
// With annual paths a tab has two spreads. The range (for a bounded normal,
// its SD before truncation) is drawn once per scenario and fixes the terminal
// end point; the yearly innovation SD adds AR(1) surprises that are exactly
// zero at pinned years and at that end point (joint-annual-path.js conditions
// on both). The two are independent, so their variances add. The chart is
// measured, not drawn from a formula: the tab is rerun with each part alone.
const stepNum = (k, v) => isRate(k) ? num(v * 100, 1) : num(v, 2);
function pairChart(metric, rows, n) {
  const H = 150, top = 12, bottom = 118, left = 40, right = W - 12;
  const cols = n + 1, X = i => left + i / (cols - 1) * (right - left);
  const max = Math.max(...rows.flatMap(r => r.v).filter(finite), isRate(metric) ? .002 : .02) * 1.12;
  const Y = v => bottom - v / max * (bottom - top);
  const line = v => v.map((y, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(y).toFixed(1)}`).join('');
  const yt = ticks(0, max, 2).filter(v => v <= max);
  const grid = yt.map(v => `<line x1="${left}" x2="${right}" y1="${Y(v)}" y2="${Y(v)}" class="${v ? 'rx-mcg-grid' : 'rx-mcg-axis'}"/><text x="${left - 6}" y="${Y(v) + 4}" text-anchor="end" class="rx-mcg-tick">±${esc(stepNum(metric, v))}</text>`).join('');
  const xs = [0, Math.floor((n - 1) / 2)].filter((v, i, a) => a.indexOf(v) === i).map(i => `<text x="${X(i)}" y="${bottom + 18}" text-anchor="${i ? 'middle' : 'start'}" class="rx-mcg-tick">${esc(copy('yr', {n: i + 1}))}</text>`).join('') + `<text x="${X(n)}" y="${bottom + 18}" text-anchor="end" class="rx-mcg-tick">${esc(copy('terminal'))}</text>`;
  const [both, a, b] = rows;
  const area = `${line(both.v)}L${X(n)} ${bottom}L${X(0)} ${bottom}Z`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(copy('pairChart', {unit: isRate(metric) ? copy('unitPts').trim() : '×'}))}">${grid}<line x1="${X(n - 1)}" x2="${X(n - 1)}" y1="${top}" y2="${bottom}" class="rx-mcg-grid"/>
    <path d="${area}" class="rx-mcg-pa-both"/><path d="${line(both.v)}" class="rx-mcg-pa-bl"/><path d="${line(a.v)}" class="rx-mcg-pa-a"/><path d="${line(b.v)}" class="rx-mcg-pa-b"/>
    <circle cx="${X(n)}" cy="${Y(a.v[n])}" r="3.5" class="rx-mcg-pa-dot"/>${xs}</svg>`;
}
function pairBlock(st, tab, metric, spec, place, fieldA) {
  const path = pathSpec(metric, st.config); if (!path || !spec) return '';
  const sd = path.innovationSD;
  const both = request(st, 'pair', isolate(st, tab));
  const endOnly = sd > 0 ? request(st, 'pair', tweak(st, tab, editPath(metric, {innovationSD: 0}))) : both;
  const fixedSpec = spec.type === 'fixed' ? spec : {type: 'fixed', value: center(spec)};
  const bumpsOnly = spec.type !== 'fixed' ? request(st, 'pair', tweak(st, tab, v => place(v, fixedSpec))) : both;
  const labelA = spec.type === 'normal' ? bare(fieldLabel(fieldA) || copy('pairRange')) : copy('pairRange');
  const labelB = bare(fieldLabel(pathField(metric, 'sd')) || copy('sdT', {v: ''}));
  const title = copy('pairT', {a: labelA, b: labelB});
  const all = [both, endOnly, bumpsOnly];
  if (all.some(x => !x)) return fold('pair', title, `<div class="rx-mcg-skel"></div>`, {chip: copy('pairChip'), ic: 'pair'});
  if (all.some(x => x.error || !x.bands?.[metric])) return '';
  const half = sm => { const b = sm.bands[metric]; return [...b.lo.map((l, i) => Math.max(0, (b.hi[i] - l) / 2)), Math.max(0, (b.endHi - b.endLo) / 2)]; };
  const n = both.bands[metric].lo.length;
  const vBoth = half(both), vA = spec.type === 'fixed' ? vBoth.map(() => 0) : half(endOnly), vB = sd > 0 ? half(bumpsOnly) : vBoth.map(() => 0);
  // Where the yearly surprises are largest: the clearest year to see both parts.
  let peak = -1; vB.slice(0, n).forEach((v, i) => { if (v > (vB[peak] ?? 0) + 1e-12) peak = i; });
  // The worked example uses the year where both parts are largest together.
  let y = -1; vB.slice(0, n).forEach((v, i) => { if (Math.min(v, vA[i]) > (y < 0 ? 1e-12 : Math.min(vB[y], vA[y]))) y = i; });
  const spreadOf = sm => sm.base ? '±' + fmtPct((sm.p90 - sm.p10) / 2 / Math.abs(sm.base)) : '—';
  let sNote = '';
  try { if (spec.type === 'normal') sNote = ' ' + copy('pairANormal', {p10: fmtIn(metric, distributionQuantile(.1, spec) + (/Shift$/.test(tab) ? st.annualContext?.terminals?.[metric] || 0 : 0)), p90: fmtIn(metric, distributionQuantile(.9, spec) + (/Shift$/.test(tab) ? st.annualContext?.terminals?.[metric] || 0 : 0))}); } catch {}
  const card = (cls, name, head, body, stat, value) => `<div class="rx-mcg-pc ${cls}"><span class="rx-mcg-pc-k"><i></i>${esc(name)}</span><b>${esc(head)}</b><p>${esc(body)}</p><div class="rx-mcg-pc-s"><strong>${esc(stat)}</strong><span>${esc(copy('pairValue', {v: value}))}</span></div></div>`;
  const cardA = card('is-a', labelA, copy('pairAH'), spec.type === 'fixed' ? copy('pairZeroA') : copy('pairAB') + sNote, copy('pairStatA', {v: fmtStep(metric, vA[n])}), spec.type === 'fixed' ? '±0%' : spreadOf(endOnly));
  const cardB = card('is-b', labelB, copy('pairBH'), sd > 0 ? copy('pairBB') : copy('pairZeroB'), peak >= 0 ? copy('pairStatB', {v: fmtStep(metric, vB[peak]), y: peak + 1}) : '±' + fmtStep(metric, 0), sd > 0 ? spreadOf(bumpsOnly) : '±0%');
  const a = y >= 0 ? vA[y] : 0, b = y >= 0 ? vB[y] : 0;
  const sum = a > 0 && b > 0 ? `<p class="rx-mcg-read">${esc(copy('pairSum', {y: y + 1, a: stepNum(metric, a), b: stepNum(metric, b), c: fmtStep(metric, Math.hypot(a, b)), m: fmtStep(metric, vBoth[y])}))}</p>` : '';
  const legend = `<figcaption><span class="rx-mcg-key"><i class="is-pa"></i>${esc(labelA)}<i class="is-pb"></i>${esc(labelB)}<i class="is-pboth"></i>${esc(copy('pairBoth'))}</span></figcaption>`;
  return fold('pair', title, `<div class="rx-mcg-pair">${cardA}${cardB}</div><figure class="rx-mcg-fig"><p class="rx-mcg-sub">${esc(copy('pairChart', {unit: isRate(metric) ? copy('unitPts').trim() : '×'}))}</p>${pairChart(metric, [{v: vBoth}, {v: vA}, {v: vB}], n)}${legend}</figure>${sum}<p class="rx-mcg-sub rx-mcg-after">${esc(copy('pairTip'))}</p>`, {chip: copy('pairChip'), ic: 'pair'});
}

// Monte Carlo error of the reported numbers, from the normal approximation:
// SE(median) = √(π/2)·σ/√n and SE(P10) = √(0.1·0.9)/φ(1.2816)·σ/√n = 1.709·σ/√n,
// with σ estimated as (P90 − P10) / 2.563. This is an illustrative normal-output
// approximation, not a validated confidence interval. Exclusions reduce n.
function samplingPrecision(sum, attempts, count) {
  if (!sum || !Number.isInteger(sum.accepted) || sum.accepted < 100 || !Number.isInteger(attempts) || sum.accepted > attempts || !Number.isInteger(count) || count <= 0) return null;
  if (![sum.p10, sum.p50, sum.p90].every(finite) || !(sum.p10 <= sum.p50 && sum.p50 <= sum.p90 && sum.p90 > sum.p10)) return null;
  const accepted = count === attempts ? sum.accepted : Math.floor(count * (sum.accepted / attempts)), width = sum.p90 - sum.p10;
  if (!(width > Number.EPSILON * Math.max(Math.abs(sum.p10), Math.abs(sum.p90)))) return null;
  const sigma = width / 2.5631;
  if (!(accepted >= 100) || !finite(sigma)) return null;
  const median = (sigma / Math.sqrt(accepted)) * (1.96 * 1.2533), edge = (sigma / Math.sqrt(accepted)) * (1.96 * 1.7094);
  return finite(median) && finite(edge) && median > 0 && edge > 0 ? {accepted, median, edge} : null;
}
const precisionValue = v => v > 0 && v < .01 ? '<' + fmtVal(.01) : fmtVal(v);
const precisionPercent = v => (v > 0 && v * 100 < .01 ? '<0.01' : num(v * 100, 2)) + '%';
function samplingGuide(st) {
  const c = st.config, n = c.trials;
  let sum, src;
  if (st.latest) { sum = {p10: st.latest.p10, p50: st.latest.p50, p90: st.latest.p90, accepted: st.latest.accepted}; src = copy('precSrcRun'); }
  else { sum = request(st, 'samp', full(st), true); src = copy('precSrcPreview', {n: num(TRIALS, 0)}); }
  const attempts = st.latest ? n : TRIALS, precision = samplingPrecision(sum, attempts, n);
  let value, chip = !sum ? '…' : '', acceptedNote = '';
  if (!sum) value = valueBlock(st, sum);
  else if (sum.error || !precision) { value = `<p class="rx-mcg-read">${esc(copy('precUnavailable'))}</p>`; chip = copy('precWithheld'); }
  else {
    acceptedNote = `<p class="rx-mcg-sub">${esc(copy('precAccepted', {accepted: num(sum.accepted, 0), attempts: num(attempts, 0)}))}</p>`;
    const counts = uniq([1000, 5000, 10000, n].filter(k => finite(k) && k > 0));
    const estimates = counts.map(k => samplingPrecision(sum, attempts, k));
    const med = k => samplingPrecision(sum, attempts, k)?.median, edge = k => samplingPrecision(sum, attempts, k)?.edge;
    const widest = 2 * Math.max(...estimates.filter(Boolean).map(x => x.edge)) || 1;
    const rows = counts.map(k => {
      const estimate = samplingPrecision(sum, attempts, k);
      if (!estimate) return `<li><span>${esc(num(k, 0))}</span><i></i><em>${esc(copy('precWithheld'))}</em></li>`;
      const w = 2 * med(k) / widest, we = 2 * edge(k) / widest;
      const rel = finite(sum.p50) && sum.p50 ? ` (${precisionPercent(med(k) / Math.abs(sum.p50))})` : '';
      return `<li class="${k === n ? 'is-yours' : ''}"><span>${esc(num(k, 0))}${k === n ? `<small>${esc(copy('precCur'))}</small>` : ''}<small>${esc(copy(st.latest && k === n ? 'precRowActual' : 'precRowAccepted', {n: num(estimate.accepted, 0)}))}</small></span><i class="is-err" style="--a:${(.5 - w / 2).toFixed(4)};--w:${w.toFixed(4)};--ea:${(.5 - we / 2).toFixed(4)};--ew:${we.toFixed(4)};--b:.5"></i><em>${esc(copy('precMed', {v: precisionValue(med(k)) + rel}))} · ${esc(copy('precEdge', {v: precisionValue(edge(k))}))}</em></li>`;
    }).join('');
    // Luck against what the inputs themselves do: the noise should be a small fraction of the range.
    if (finite(sum.p50) && sum.p50 && finite(n)) chip = copy('precChip', {v: precisionPercent(med(n) / Math.abs(sum.p50))});
    const half = (sum.p90 - sum.p10) / 2, verdict = half > 0 && finite(n) ? copy('precVs', {n: num(n, 0), noise: precisionValue(med(n)), range: precisionValue(half), x: num(Math.max(1, half / med(n)), 0)}) : '';
    value = `<figure class="rx-mcg-wi rx-mcg-prec" aria-label="${esc(copy('precT'))}"><ul>${rows}</ul><figcaption><span class="rx-mcg-key"><i class="is-hi"></i>${esc(copy('precKeyMed'))}<i class="is-soft"></i>${esc(copy('precKeyEdge'))}</span></figcaption></figure><p class="rx-mcg-read">${esc(verdict)}</p><p class="rx-mcg-sub rx-mcg-after">${esc(copy('precRead'))}</p>`;
  }
  const knobs = knob(copy('trialsT', {v: num(n, 0)}), copy('trialsB'), '', 'trials', 'trials') + knob(copy('seedT', {v: String(c.seed ?? '—')}), copy('seedB'), '', 'seed', 'seed');
  return [
    ['head', `<header class="rx-mcg-head"><span class="rx-mcg-eyebrow">${esc(copy('eyebrow'))}</span></header><h3>${esc(copy('q_sampling'))}</h3><p class="rx-mcg-lead">${esc(copy('l_sampling'))}</p>`],
    // Folded: on Sampling the latest range below should stay in view.
    ['value', fold('prec', copy('precT'), `<p class="rx-mcg-sub">${esc(copy('precLead', {src}))}</p>${acceptedNote}${value}`, {chip, ic: 'prec'})],
    ['knobs', fold('sknobs', copy('knobs'), `<ul class="rx-mcg-knobs">${knobs}</ul>`, {chip: copy('nSettings', {n: 2}), ic: 'knobs'})]
  ];
}

function guideFor(st, root) {
  const tab = st.activeTab, c = st.config, q = QUESTION[tab];
  if (!q) return [];
  if (tab === 'sampling') return samplingGuide(st);
  ladderScale = 0;
  let inputs = '', knobs = '', value = '', pair = '', chip = '', lead = copy('valueLead', {n: num(TRIALS, 0)});
  const metric = pathMetric(tab, c), what = COPY[lang()].metric[metric || PATH_OF[tab]] || (COPY[lang()].tabs[tab] || tab).toLowerCase();
  if (tab === 'relationships') {
    lead = copy('valueLeadRel', {n: num(TRIALS, 0)});
    const withSum = request(st, 'rel:with', full(st), true), withoutSum = request(st, 'rel:without', unlinked(st), true);
    const loadings = c.jointAnnual?.loadings;
    if (c.method === 'joint-annual-path' && loadings) {
      const keys = Object.keys(loadings), live = Object.fromEntries(keys.map(k => [k, (pathSpec(k, c)?.innovationSD || 0) > 0]));
      inputs = `<figure class="rx-mcg-fig">${corrGrid(keys, loadings, live)}<figcaption><span>${esc(copy('corr'))}</span></figcaption></figure>`;
      knobs += knob(copy('loadT'), (keys.some(k => loadings[k]) ? '' : copy('loadNone') + ' ') + copy('loadB'));
      const obs = c.jointAnnual.observations || [];
      knobs += knob(copy('targetsT', {n: obs.length}), copy('targetsB'));
    } else {
      knobs += knob(copy('linkedT'), copy('linkedB'));
    }
    if (!withSum || !withoutSum) value = valueBlock(st, null);
    else if (withSum.error || withoutSum.error) value = valueBlock(st, {error: true});
    else {
      const a = withSum.p90 - withSum.p10, b = withoutSum.p90 - withoutSum.p10;
      const lo = Math.min(withSum.p10, withoutSum.p10), hi = Math.max(withSum.p90, withoutSum.p90), span = Math.max(hi - lo, 1e-9);
      const bar = (label, s) => `<li><span>${esc(label)}</span><i style="--a:${((s.p10 - lo) / span).toFixed(3)};--w:${((s.p90 - s.p10) / span).toFixed(3)}"></i><em>${esc(range(fmtVal(s.p10), fmtVal(s.p90)))}</em></li>`;
      const change = Math.abs(a - b) / Math.max(b, 1e-9);
      chip = change < .01 ? copy('zero') : (a > b ? '+' : '−') + fmtPct(change);
      value = `<div class="rx-mcg-value"><ul class="rx-mcg-compare">${bar(copy('withLinks'), withSum)}${bar(copy('noLinks'), withoutSum)}</ul><p class="rx-mcg-read">${esc(change < .01 ? copy('relSame') : a > b ? copy('relWider', {pct: fmtPct(change)}) : copy('relNarrower', {pct: fmtPct(change)}))}</p></div>`;
    }
  } else {
    const sum = request(st, 'tab:' + tab, isolate(st, tab), true);
    const driver = c.drivers?.[tab], inactive = driver && scalarInactive(tab, c);
    if (tab === 'taxTerminal') {
      const t = c.annualTerminal || {}, names = {growth: copy('tg'), taxRate: copy('ttax'), roic: copy('troic')};
      const unitKey = k => k === 'roic' ? 'wacc' : k;
      const bridge = (() => { try { return JSON.parse(document.getElementById('guided-results')?.getAttribute('data-bridge') || 'null'); } catch { return null; } })();
      if (bridge && finite(bridge.terminalPV) && bridge.enterprise > 0) knobs += `<li class="is-key"><b>${esc(copy('tvShare', {pct: fmtPct(bridge.terminalPV / bridge.enterprise)}))}</b></li>`;
      const varying = Object.entries(t).filter(([, s]) => s.type !== 'fixed'), fixed = Object.entries(t).filter(([, s]) => s.type === 'fixed');
      for (const [k, s] of varying) {
        const lad = distLadder(st, tab, unitKey(k), s, (v, x) => { v.annualTerminal[k] = x; });
        knobs += distKnob(unitKey(k), s, '', lad, 'term-' + k, `terminal-${k}-type`, names[k] || k);
      }
      // A fixed terminal input still deserves a question: how far would a modest range reach?
      const typical = {growth: .005, taxRate: .05, roic: .05};
      for (const [k, s] of fixed) {
        const d = typical[k] ?? Math.abs(s.value) * .2, tri = {type: 'triangular', low: s.value - d, mode: s.value, high: s.value + d};
        const lad = ladder(st, [
          {label: fmtIn(unitKey(k), s.value), view: isolate(st, tab), yours: true},
          {label: specRange(unitKey(k), tri), view: tweak(st, tab, v => { v.annualTerminal[k] = tri; })}
        ]);
        knobs += knob(copy('termFixedT', {name: names[k] || k, v: fmtIn(unitKey(k), s.value)}), copy('termFixedB', {lo: fmtIn(unitKey(k), tri.low), hi: fmtIn(unitKey(k), tri.high)}), lad, 'term-' + k, `terminal-${k}-type`);
      }
      if (metric) {
        const flat = !(pathSpec(metric, c)?.innovationSD > 0);
        if (!flat) inputs += fanChart(st, metric, sum);
        knobs += `<li class="is-group"><b>${esc(copy('taxPath'))}</b></li>` + pathKnobs(st, metric, '', tab);
        if (t.taxRate) pair = pairBlock(st, tab, metric, t.taxRate, (v, x) => { v.annualTerminal.taxRate = x; }, 'terminal-taxRate-sd');
      }
    } else {
      const end = metric ? endRange(tab, driver, metric, st) : null;
      if (metric) inputs = fanChart(st, metric, sum, end);
      else if (driver && !inactive) inputs = `<figure class="rx-mcg-fig">${densityChart(tab, driver)}</figure>`;
      if (metric) {
        let endpoint = '';
        if (metric === 'growth') endpoint = st.annualContext?.terminalYear <= (st.annualContext?.baseline?.length || 0) ? copy('endGrowth', {n: st.annualContext.terminalYear, g: fmtIn('growth', st.annualContext.terminalGrowth)}) : '';
        else if (driver && !inactive) endpoint = end ? copy('endDist', {lo: fmtIn(metric, end.low), hi: fmtIn(metric, end.high)}) : copy('endFixed', {v: fmtIn(metric, (driver.value ?? 0) + (/Shift$/.test(tab) ? st.annualContext?.terminals?.[metric] || 0 : 0))});
        // The range row below already says where the path ends.
        knobs += pathKnobs(st, metric, metric !== 'growth' && driver && !inactive && end ? '' : endpoint, tab);
      }
      const dKey = /Multiplier$/.test(tab) ? 'investmentFactor' : tab;
      if (metric && metric !== 'growth' && driver && !inactive) pair = pairBlock(st, tab, metric, driver, (v, x) => { v.drivers[tab] = x; }, `${tab}-sd`);
      if (driver) knobs += inactive ? knob(copy('inactiveT'), copy('inactiveB'), '', 'dist') : distKnob(dKey, driver, metric ? copy('terminalOnly') : '', distLadder(st, tab, dKey, driver, (v, x) => { v.drivers[tab] = x; }), 'dist', `${tab}-type`, metric ? copy('endRangeT') : '');
    }
    value = valueBlock(st, sum, what);
    chip = !sum ? '…' : sum.error ? '—' : !(sum.p90 - sum.p10 > Math.abs(sum.base || sum.p50 || 1) * 1e-4) ? copy('zero') : '±' + fmtPct((sum.p90 - sum.p10) / 2 / Math.abs(finite(sum.base) ? sum.base : sum.p50));
  }
  if (money && tab !== 'relationships') lead += ' ' + copy('evNote');
  // Sections are painted separately, so a result that lands rewrites one of them.
  return [
    ['head', `<header class="rx-mcg-head"><span class="rx-mcg-eyebrow">${esc(copy('eyebrow'))}</span><button type="button" class="rx-mcg-switch" data-view="range">${esc(copy('toRange'))}</button></header>
    <h3>${esc(copy('q_' + q))}</h3><p class="rx-mcg-lead">${esc(copy('l_' + q))}</p>`],
    ['inputs', inputs ? `<section class="rx-mcg-block"><h4>${esc(copy('inputs'))}</h4>${inputs}</section>` : ''],
    ['value', fold(tab === 'relationships' ? 'valueRel' : 'value', copy(tab === 'relationships' ? 'valueRel' : 'value'), `<p class="rx-mcg-sub">${esc(lead)}</p>${value}`, {chip, ic: 'value'})],
    ['pair', pair],
    ['knobs', knobs ? fold('knobs', copy('knobs'), (knobs.includes('rx-mcg-wi') ? `<p class="rx-mcg-sub">${esc(copy('wiLead'))}</p>` : '') + `<ul class="rx-mcg-knobs" style="--s:${Math.max(ladderScale * 1.04, .005).toFixed(5)}">${knobs}</ul>`, {chip: copy('nSettings', {n: (knobs.match(/<li data-k/g) || []).length || (knobs.match(/<li/g) || []).length}), ic: 'knobs'}) : ''],
    ['sources', sourcesBlock(st)]
  ];
}

/* ---------- placement and view switching ---------- */
const views = new WeakMap(); // root → {view, tab}
// Desktop: the guide and the range share one right-hand column that stays in
// view while the settings scroll, so a run from the bottom bar is seen at once.
const RIGHT = ['.mc-heading', '.mc-output-stage', '.mc-extra'];
function arrange(root) {
  const lab = root.querySelector(':scope > .simulation-lab'); if (!lab) return null;
  let col = lab.querySelector(':scope > .rx-mc-right');
  if (phone.matches) {
    if (col) { for (const sel of RIGHT) { const n = col.querySelector(':scope > ' + sel); if (n) lab.append(n); } col.remove(); }
    return null;
  }
  if (!col) { col = document.createElement('div'); col.className = 'rx-mc-right'; lab.append(col); }
  for (const sel of RIGHT) { const n = lab.querySelector(':scope > ' + sel); if (n) col.append(n); }
  return col;
}
function host(root) {
  const lab = root.querySelector(':scope > .simulation-lab');
  if (!lab) return null;
  let h = lab.querySelector('.rx-mcg');
  const inline = phone.matches, setup = lab.querySelector('.mc-setup'), tabs = setup?.querySelector('.mc-setup-tabs');
  if (!h) {
    h = document.createElement('div'); h.className = 'rx-mcg'; h.setAttribute('role', 'complementary'); h.addEventListener('click', onClick);
    h.addEventListener('toggle', e => { const d = e.target; if (d.dataset?.fold) folds.set(d.dataset.fold, d.open); }, true);
  }
  const col = arrange(root);
  if (inline && tabs) { if (h.previousElementSibling !== tabs) tabs.after(h); }
  else if (col && col.firstElementChild !== h) col.prepend(h);
  return h;
}
function backLink(root, st) {
  const heading = root.querySelector(':scope > .simulation-lab .mc-heading');
  if (!heading) return;
  let b = heading.querySelector('.rx-mcg-back');
  const show = st.activeTab !== 'sampling' && !!QUESTION[st.activeTab];
  if (!show) { b?.remove(); return; }
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'rx-mcg-back'; b.dataset.view = 'guide'; b.addEventListener('click', onClick); heading.prepend(b); }
  const name = COPY[lang()].tabs[st.activeTab] || st.tabs.find(([k]) => k === st.activeTab)?.[1] || '';
  const label = '← ' + copy('toGuide', {tab: name});
  if (b.textContent !== label) b.textContent = label;
}
function setView(root, view) {
  const state = views.get(root) || {};
  state.view = view; views.set(root, state);
  if (root.getAttribute('data-rx-mcv') !== view) root.setAttribute('data-rx-mcv', view);
}
function onClick(e) {
  const root = e.currentTarget.closest('[data-rx-mcv]') || e.currentTarget.closest('.simulation-lab')?.parentElement;
  const t = e.target.closest('button');
  if (!root || !t) return;
  if (t.dataset.view) {
    setView(root, t.dataset.view);
    paint(root);
    if (t.dataset.view === 'range') root.querySelector('.mc-heading')?.scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  } else if (t.dataset.edit) {
    editField(root, t.dataset.edit);
  } else if (t.dataset.tab) {
    root.querySelector(`[id$="mc-tab-${t.dataset.tab}"]`)?.click();
  }
}

/* ---------- painting ---------- */
const painted = new WeakMap(), seen = new WeakMap();
const visible = el => el.checkVisibility ? el.checkVisibility() : !!el.offsetParent;
function paint(root) {
  const st = root.mcState; if (!st) return;
  // Hidden views (another studio mode, another tab) are explained when shown.
  if (!visible(root)) { seen.delete(root); return; }
  seen.set(root, st);
  const h = host(root); if (!h) return;
  const state = views.get(root) || {};
  if (!state.view) setView(root, st.activeTab === 'sampling' ? 'range' : 'guide');
  backLink(root, st);
  const inline = phone.matches;
  const sampling = st.activeTab === 'sampling';
  // Sampling keeps the range in view: its short guide sits above it.
  const show = !!QUESTION[st.activeTab] && st.valid && (inline || sampling || views.get(root).view === 'guide');
  h.hidden = !show;
  h.classList.toggle('is-sampling', sampling);
  if (!show) return;
  wanted = new Set();
  W = inline ? 340 : 560;
  money = st.adapterId ? (String(st.unit || '').match(/[A-Z]{3}/)?.[0] || 'USD') : null;
  curRoot = root;
  const parts = guideFor(st, root);
  curRoot = null;
  // Work for settings that are no longer on screen is dropped, not finished.
  queue = queue.filter(q => wanted.has(q.key));
  if (busy && !wanted.has(busy.key)) busy.controller.abort();
  wanted = null;
  if (h.children.length !== parts.length || [...h.children].some((c, i) => c.dataset.part !== parts[i][0])) {
    h.replaceChildren(...parts.map(([k]) => { const d = document.createElement('div'); d.dataset.part = k; return d; }));
  }
  parts.forEach(([, html], i) => { const c = h.children[i]; if (painted.get(c) !== html) { painted.set(c, html); c.innerHTML = html; } });
  painted.set(h, true);
  relink(root);
}

/* ---------- linking a field on the left to its row on the right ---------- */
// Focus or hover a setting and the row that explains it lights up (and, on
// desktop, scrolls into view in the right column). Hover a row and its field
// is outlined; its title focuses the field.
function fieldRow(id) {
  const s = String(id || '').replace(/^.*?mc-/, '');
  let m;
  if ((m = s.match(/^(?:annual|metric-\w+)-(innovation-sd|sd|persistence|fixed-(\d+))$/))) return {k: m[2] ? 'fix' : m[1] === 'persistence' ? 'rho' : 'sd', year: m[2] ? +m[2] : null};
  if (/^joint-\w+-(loading|add)$/.test(s)) return {k: 'load'};
  if ((m = s.match(/^terminal-(\w+)-/))) return {k: 'term-' + m[1]};
  if (/^(trials|seed)$/.test(s)) return {k: s};
  if (/^\w+-(type|low|mode|high|mean|sd|value)$/.test(s)) return {k: 'dist'};
  return null;
}
const links = new WeakMap(); // root → {focus, hover}
function rowFor(el) {
  if (!el?.closest || el.closest('.mc-setup-tabs')) return null;
  const setup = el.closest('.mc-setup'); if (!setup) return null;
  for (let n = el; n && n !== setup; n = n.parentElement) {
    // Choice buttons sit beside a hidden select that carries the id.
    for (const id of [n.id, n.tagName === 'LABEL' ? n.querySelector(':scope > select[id]')?.id : '']) if (id && /mc-/.test(id)) { const r = fieldRow(id); if (r) return r; }
  }
  return null;
}
function relink(root, scroll = false) {
  const h = root.querySelector('.rx-mcg'); if (!h) return;
  const st = links.get(root) || {}, row = st.hover || st.focus;
  for (const n of h.querySelectorAll('.is-linked, .rx-mcg-yr.is-on')) n.classList.remove('is-linked', 'is-on');
  if (!row || h.hidden) return;
  const li = h.querySelector(`[data-k~="${row.k}"]`);
  if (row.year) h.querySelector(`.rx-mcg-yr[data-yr="${row.year}"]`)?.classList.add('is-on');
  if (!li) return;
  li.classList.add('is-linked');
  if (!scroll || phone.matches) return;
  // Unfold the explanation the reader is working on, then bring it into view
  // inside the sticky column without moving the page.
  for (const d of [li.closest('details'), li.querySelector(':scope > details')]) if (d && !d.open) d.open = true;
  const col = h.closest('.rx-mc-right'); if (!col) return;
  const a = col.getBoundingClientRect(), b = li.getBoundingClientRect();
  if (b.top < a.top + 8 || b.bottom > a.bottom - 8) col.scrollTo({top: col.scrollTop + b.top - a.top - Math.max(16, (a.height - b.height) / 3), behavior: calm() ? 'auto' : 'smooth'});
}
const same = (a, b) => (a?.k || null) === (b?.k || null) && (a?.year || null) === (b?.year || null);
document.addEventListener('focusin', e => {
  const root = e.target.closest?.('[data-rx-mcv]'); if (!root) return;
  const st = links.get(root) || {}, row = rowFor(e.target);
  clearTimeout(hoverTimer);
  if (same(st.focus, row) && !st.hover) return;
  st.hover = null; st.focus = row; links.set(root, st); relink(root, !!row);
});
document.addEventListener('focusout', e => {
  const root = e.target.closest?.('[data-rx-mcv]'); if (!root) return;
  if (e.relatedTarget && root.contains(e.relatedTarget)) return;
  const st = links.get(root); if (st?.focus) { st.focus = null; relink(root); }
});
const fine = matchMedia('(hover: hover) and (pointer: fine)');
let hoverTimer = 0;
document.addEventListener('pointerover', e => {
  if (!fine.matches) return;
  const root = e.target.closest?.('[data-rx-mcv]'); if (!root) return;
  // Right to left: a row outlines its field.
  const li = e.target.closest('.rx-mcg li[data-f]');
  for (const n of root.querySelectorAll('.rx-mcg-target')) if (!li || !n.id.endsWith('mc-' + li.dataset.f)) n.classList.remove('rx-mcg-target');
  if (li) root.querySelector(`.mc-setup [id$="mc-${li.dataset.f}"]`)?.classList.add('rx-mcg-target');
  // Left to right, after a short rest so a pointer passing by does not flicker.
  if (e.target.closest('.rx-mcg')) {
    clearTimeout(hoverTimer); const st = links.get(root);
    if (st?.hover) { st.hover = null; relink(root); }
    return;
  }
  const row = rowFor(e.target), st = links.get(root) || {};
  if (same(st.hover, row)) return;
  clearTimeout(hoverTimer);
  const mountId = root.mcState?.mountId;
  hoverTimer = setTimeout(() => { if (!root.mcState || root.mcState.mountId !== mountId) return; st.hover = row; links.set(root, st); relink(root, false); }, row ? 90 : 160);
});
document.addEventListener('pointerout', e => {
  const root = e.target.closest?.('[data-rx-mcv]');
  if (!root || e.relatedTarget && root.contains(e.relatedTarget)) return;
  clearTimeout(hoverTimer); const st = links.get(root);
  if (st?.hover) { st.hover = null; relink(root); }
  for (const n of root.querySelectorAll('.rx-mcg-target')) n.classList.remove('rx-mcg-target');
});
function editField(root, f) {
  const el = root.querySelector(`.mc-setup [id$="mc-${f}"]`); if (!el || el.closest('[hidden]')) return;
  const disclosures = [];
  for (let n = el.parentElement; n && n !== root; n = n.parentElement) if (n.tagName === 'DETAILS') disclosures.unshift(n);
  const opened = disclosures.filter(d => !d.open);
  // Edit is direct navigation: reveal its target before focusing it. Manual
  // disclosure toggles keep their normal animation after this scoped cleanup.
  for (const d of opened) d.classList.add('rx-mcg-edit-reveal');
  try {
    for (const d of disclosures) d.open = true;
    for (const d of opened) void d.offsetHeight;
    const shown = x => x && (x.checkVisibility ? x.checkVisibility() : !!x.offsetParent);
    let target = el.matches('input, select, textarea, button') ? el : el.querySelector('[aria-checked="true"], input, select, button') || el;
    if (!shown(target) || target.getAttribute('aria-hidden') === 'true' || target.tabIndex < 0) target = el.parentElement?.querySelector('[role="radiogroup"] [aria-checked="true"]') || el.parentElement?.querySelector('[role="radiogroup"] button') || target;
    target.scrollIntoView({block: 'center', behavior: calm() ? 'auto' : 'smooth'});
    target.focus({preventScroll: true});
  } finally {
    for (const d of opened) d.classList.remove('rx-mcg-edit-reveal');
  }
}
let repaintQueued = false;
function repaintSoon() {
  if (repaintQueued) return; repaintQueued = true;
  // A timer, not a frame: results can land while the page is not drawing.
  setTimeout(() => { repaintQueued = false; for (const r of document.querySelectorAll('[data-rx-mcv]')) paint(r); }, 30);
}

const timers = new WeakMap();
function onState(root) {
  const st = root.mcState; if (!st) return;
  if (st.reason === 'destroy') {
    root.querySelector('.rx-mcg')?.setAttribute('hidden', '');
    root.querySelector('.rx-mcg-back')?.remove();
    setView(root, 'range');
    views.delete(root); seen.delete(root); links.delete(root);
    clearTimeout(hoverTimer);
    clearTimeout(timers.get(root));
    queue = queue.filter(q => q.st.mountId !== st.mountId);
    if (busy?.key.startsWith(st.mountId)) busy.controller.abort();
    return;
  }
  // Rearrange before the next frame so a re-rendered view never flashes unwrapped.
  if (visible(root)) arrange(root);
  if (root.getAttribute('data-rx-mcv') === null) root.setAttribute('data-rx-mcv', st.activeTab === 'sampling' ? 'range' : 'guide');
  const state = views.get(root) || {};
  if (st.reason === 'run') { setView(root, 'range'); }
  else if (st.reason === 'tab' || state.tab === undefined) { if (state.tab !== st.activeTab) setView(root, st.activeTab === 'sampling' ? 'range' : 'guide'); }
  (views.get(root) || state).tab = st.activeTab;
  dropQueue(st.mountId);
  if (st.running && busy) busy.controller.abort();
  // Paint labels and cached charts now; ask the engine only after typing pauses.
  clearTimeout(timers.get(root));
  if (st.reason === 'settings') {
    const keep = () => paint(root);
    requestAnimationFrame(() => { if (!painted.get(root.querySelector('.rx-mcg'))) keep(); });
    timers.set(root, setTimeout(keep, 260));
  } else requestAnimationFrame(() => paint(root));
}
document.addEventListener('mc:state', e => onState(e.target));
// This layer can load after a view has already published its first state.
for (const lab of document.querySelectorAll('.simulation-lab')) if (lab.parentElement?.mcState) onState(lab.parentElement);
onScan(() => {
  for (const lab of document.querySelectorAll('.simulation-lab')) {
    const root = lab.parentElement;
    if (root?.mcState && seen.get(root) !== root.mcState && visible(root)) paint(root);
  }
});
onLocaleChange?.(() => repaintSoon());
phone.addEventListener?.('change', () => repaintSoon());
