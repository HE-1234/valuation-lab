// Dated evidence from each company's latest filed quarter, with en/zh-Hans pairs. No imports, so
// incremental-messages.js can register the pairs without an import cycle.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

export const LATEST_QUARTER_EVIDENCE=freeze({
 AMZN:{
  "currency": "USD",
  "digits": 0,
  "form": "8-K Exhibit 99.1 earnings release; September 10-Q not yet available",
  "accession": "0001018724-26-000038",
  "periodEnd": "2026-09-30",
  "filed": "2026-10-29",
  "url": "https://www.sec.gov/Archives/edgar/data/1018724/000101872426000038/amzn-20260930xex991.htm",
  "originDate": "2026-06-30",
  "fullQuarterlyFilingAvailable": false,
  "balance": [
    [
      "Cash and cash equivalents",
      78213,
      55783
    ],
    [
      "Current marketable securities",
      44775,
      58443
    ],
    [
      "Long-term debt",
      128894,
      173125
    ]
  ],
  "flows": [
    [
      "Q3 2026 reported revenue",
      201944
    ],
    [
      "Q3 2026 reported operating income",
      28076
    ],
    [
      "Q3 2026 AWS revenue",
      45984
    ],
    [
      "Q3 2026 AWS operating income",
      17773
    ],
    [
      "TTM revenue through September 2026",
      797455
    ],
    [
      "TTM operating income through September 2026",
      104366
    ],
    [
      "TTM operating cash flow through September 2026",
      168300
    ],
    [
      "TTM gross property and equipment purchases",
      215192
    ],
    [
      "TTM property sales and incentives",
      4535
    ],
    [
      "TTM net property and equipment purchases",
      210657
    ],
    [
      "TTM reported free cash flow",
      -42357
    ],
    [
      "Q4 2026 revenue guidance · low",
      240000
    ],
    [
      "Q4 2026 revenue guidance · high",
      247000
    ],
    [
      "Q4 2026 operating income guidance · low",
      28500
    ],
    [
      "Q4 2026 operating income guidance · high",
      33500
    ],
    [
      "FY2026 cash capital expenditure guidance · approximate",
      220000
    ]
  ],
  "note": "October 29 earnings release furnished on Form 8-K; the September 10-Q was not available at the October 29 check. Long-term debt above excludes current debt. September common shares were 10,811 million and stock-based awards approximately 223 million; EPS weighted-average shares are different. The September current debt, finance-lease total and investment breakdown remain unverified. The existing valuation and forecasts are unchanged. Reported free cash flow is operating cash flow less net property purchases, not model FCFF."
},
 ASML:{
  currency:'EUR',digits:1,form:'6-K · Exhibit 99.3',accession:'0001628280-26-065813',periodEnd:'2026-09-27',filed:'2026-10-14',
  url:'https://www.sec.gov/Archives/edgar/data/937966/000162828026065813/financial_statementsxusx.htm',
  originDate:'2025-12-31',
  balance:[
   ['Cash and cash equivalents',12916.0,8030.9],
   ['Short-term investments',405.9,4704.2],
   ['Long-term debt',2709.0,1963.0],
   ['Equity investments',1320.7,2239.4],
   ['Equity method investments',822.6,1129.2],
   ['Non-current contract liabilities',3366.3,9300.6],
   ['Total shareholders’ equity',19612.2,22063.9]
  ],
  flows:[
   ['Q3 2026 reported revenue',11662.0],
   ['Q3 2026 reported operating income',5172.8],
   ['Nine-month 2026 reported revenue',29755.4],
   ['Package FY2026 revenue forecast',44455.4],
   ['Implied Q4 2026 revenue (company guidance midpoint)',14700.0],
   ['Nine-month 2026 treasury share purchases',6148.4]
  ],
  note:'The package already uses nine-month 2026 revenue in its FY2026 forecast. The September balance sheet is not used: the bridge stays at December 31, 2025, because the quarterly summary does not split current debt or report shares outstanding.'
 },
 NVMI:{
  currency:'USD',digits:3,form:'6-K',accession:'0001178913-26-003892',periodEnd:'2026-06-30',filed:'2026-08-06',
  url:'https://www.sec.gov/Archives/edgar/data/1109345/000117891326003892/zk2635873.htm',
  originDate:'2025-12-31',
  balance:[
   ['Cash and cash equivalents',214.462,124.846],
   ['Short-term bank deposits',512.250,397.082],
   ['Current marketable securities',321.798,499.071],
   ['Non-current marketable securities',584.731,685.471],
   ['Liquid assets (sum of the four rows above)',1633.241,1706.470],
   ['Convertible senior notes, net carrying amount',731.680,733.588],
   ['Shareholders’ equity',1318.248,1465.219]
  ],
  flows:[
   ['Q2 2026 reported revenue',254.958],
   ['Q2 2026 reported operating income',76.185],
   ['H1 2026 reported revenue',490.266],
   ['Package FY2026 revenue forecast',1072.266]
  ],
  note:'H1 2026 revenue is already in the FY2026 forecast. The convertible notes became current liabilities at June 30. Per-share output stays withheld: the gate is the unresolved convertible, capped-call and award valuations, which this 6-K does not disclose. The next report is scheduled for November 5, 2026.'
 },
 NFLX:{
  currency:'USD',digits:3,form:'8-K · Exhibit 99.1',accession:'0001065280-26-000290',periodEnd:'2026-09-30',filed:'2026-10-20',
  url:'https://www.sec.gov/Archives/edgar/data/1065280/000106528026000290/ex991_q326.htm',
  originDate:'2026-06-30',
  balance:[
   ['Cash and cash equivalents',9099.232,8194.275],
   ['Short-term investments',28.678,28.678],
   ['Short-term debt',2483.758,2474.796],
   ['Long-term debt',11825.548,12657.598],
   ['Total streaming content obligations',25106.705,25222.800]
  ],
  flows:[
   ['Q3 2026 reported revenue',12874.176],
   ['Q4 2026 company revenue forecast',13442],
   ['H2 2026 revenue: Q3 reported plus Q4 forecast',26316.176],
   ['Package H2 2026 base revenue',26390.305],
   ['Q3 2026 reported operating income',4458.600],
   ['Q4 2026 company operating-income forecast',3500],
   ['H2 2026 operating income: Q3 reported plus Q4 forecast',7958.600],
   ['Package H2 2026 base operating income',7978.393]
  ],
  note:'The 8-K reports no shares outstanding, option or RSU counts, debt fair value or 12-month content-commitment split, so the June 30 bridge stays. Re-anchoring to September 30 waits for the Q3 10-Q.'
 }
});

export const LATEST_QUARTER_PAIRS=Object.freeze([
 ["8-K Exhibit 99.1 earnings release; September 10-Q not yet available", "8-K 附件 99.1 业绩公告；九月 10-Q 尚未发布"],
 ["Q3 2026 AWS revenue", "2026 年第三季度 AWS 收入"],
 ["Q3 2026 AWS operating income", "2026 年第三季度 AWS 营业利润"],
 ["TTM revenue through September 2026", "截至 2026 年九月的过去十二个月收入"],
 ["TTM operating income through September 2026", "截至 2026 年九月的过去十二个月营业利润"],
 ["TTM operating cash flow through September 2026", "截至 2026 年九月的过去十二个月经营现金流"],
 ["TTM gross property and equipment purchases", "过去十二个月购置物业及设备总额"],
 ["TTM property sales and incentives", "过去十二个月物业出售款及激励款"],
 ["TTM net property and equipment purchases", "过去十二个月物业及设备净支出"],
 ["TTM reported free cash flow", "过去十二个月已报告自由现金流"],
 ["Q4 2026 revenue guidance · low", "2026 年第四季度收入指引下限"],
 ["Q4 2026 revenue guidance · high", "2026 年第四季度收入指引上限"],
 ["Q4 2026 operating income guidance · low", "2026 年第四季度营业利润指引下限"],
 ["Q4 2026 operating income guidance · high", "2026 年第四季度营业利润指引上限"],
 ["FY2026 cash capital expenditure guidance · approximate", "2026 财年现金资本支出指引（约数）"],
 ["October 29 earnings release furnished on Form 8-K; the September 10-Q was not available at the October 29 check. Long-term debt above excludes current debt. September common shares were 10,811 million and stock-based awards approximately 223 million; EPS weighted-average shares are different. The September current debt, finance-lease total and investment breakdown remain unverified. The existing valuation and forecasts are unchanged. Reported free cash flow is operating cash flow less net property purchases, not model FCFF.", "10 月 29 日业绩公告以 8-K 附件提交；截至 10 月 29 日核查时，九月 10-Q 尚未发布。上表长期债务不含流动债务。九月普通股为 108.11 亿股，股份奖励约为 2.23 亿股；每股收益使用的加权平均股数与此不同。九月流动债务、融资租赁总额及投资明细仍待核实。现有估值及预测保持不变。已报告自由现金流是经营现金流减物业净支出，并非模型 FCFF。"],
 ['Latest filed quarter · dated evidence only','最新已提交季度 · 仅作日期证据'],
 ['Valuation origin, bridge and per-share output are unchanged. These figures are not used in the calculation.','估值起点、资本衔接及每股输出保持不变。以下数据不参与计算。'],
 ['Balance sheet','资产负债表'],['Valuation origin','估值起点'],['Latest filed','最新已提交'],['Reported results and forecast reference','已报告业绩及预测参考'],['Amount','金额'],['Filed','提交日期'],['Period end','期末'],['Latest filing','最新文件'],
 ['Cash and cash equivalents','现金及现金等价物'],['Short-term investments','短期投资'],['Long-term debt','长期债务'],['Short-term debt','短期债务'],['Equity investments','股权投资'],['Equity method investments','权益法投资'],['Non-current contract liabilities','非流动合同负债'],['Total shareholders’ equity','股东权益合计'],['Shareholders’ equity','股东权益'],
 ['Short-term bank deposits','短期银行存款'],['Current marketable securities','流动有价证券'],['Non-current marketable securities','非流动有价证券'],['Liquid assets (sum of the four rows above)','流动资产合计（以上四行之和）'],['Convertible senior notes, net carrying amount','可转换优先票据账面净额'],['Total streaming content obligations','流媒体内容义务合计'],
 ['Q3 2026 reported revenue','2026 年第三季度已报告收入'],['Q3 2026 reported operating income','2026 年第三季度已报告营业利润'],['Nine-month 2026 reported revenue','2026 年前九个月已报告收入'],['Package FY2026 revenue forecast','研究包 2026 财年收入预测'],['Implied Q4 2026 revenue (company guidance midpoint)','隐含 2026 年第四季度收入（公司指引中值）'],['Nine-month 2026 treasury share purchases','2026 年前九个月库存股回购'],
 ['Q2 2026 reported revenue','2026 年第二季度已报告收入'],['Q2 2026 reported operating income','2026 年第二季度已报告营业利润'],['H1 2026 reported revenue','2026 年上半年已报告收入'],
 ['Q4 2026 company revenue forecast','公司 2026 年第四季度收入预测'],['H2 2026 revenue: Q3 reported plus Q4 forecast','2026 年下半年收入：第三季度已报告加第四季度预测'],['Package H2 2026 base revenue','研究包 2026 年下半年基准收入'],['Q4 2026 company operating-income forecast','公司 2026 年第四季度营业利润预测'],['H2 2026 operating income: Q3 reported plus Q4 forecast','2026 年下半年营业利润：第三季度已报告加第四季度预测'],['Package H2 2026 base operating income','研究包 2026 年下半年基准营业利润'],
 [LATEST_QUARTER_EVIDENCE.ASML.note,'研究包的 2026 财年预测已使用 2026 年前九个月收入。九月资产负债表未被采用：由于季度摘要未拆分流动债务，也未披露流通股数，资本衔接仍为 2025 年十二月三十一日。'],
 [LATEST_QUARTER_EVIDENCE.NVMI.note,'2026 年上半年收入已计入 2026 财年预测。可转换票据于六月三十日转为流动负债。每股输出仍不显示：限制来自尚未解决的可转换票据、上限看涨期权及奖励估值，而此 6-K 未披露这些数据。下一份报告定于 2026 年十一月五日发布。'],
 [LATEST_QUARTER_EVIDENCE.NFLX.note,'此 8-K 未披露流通股数、期权或 RSU 数量、债务公允价值及十二个月内容承诺拆分，因此六月三十日资本衔接保持不变。须待第三季度 10-Q 提交后再改为九月三十日起点。'],
 ['SEC filing','SEC 文件']
]);
