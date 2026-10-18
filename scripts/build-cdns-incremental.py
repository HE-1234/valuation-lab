#!/usr/bin/env python3
"""Build the additive, conditional CDNS v3 package from the reviewed public whitelist.

No network reads, new economic policies, raw/private sources, or app edits.  Default
output root is the directory above scripts/. Copy this script into a repository's
scripts/ directory, or pass --output-root, only after separate integration approval.
"""
import argparse
import copy
import hashlib
import html
import json
from pathlib import Path

PACKAGE = 'incremental-CDNS-2026-10-18-v3'
VERSION = '2026-10-18-cdns-dated-v3'
DEFAULT_SOURCE = Path('/workspace/shared/atlas-research/company-onboarding/CDNS/public-safe/v3')
DEFAULT_AUDIT = DEFAULT_SOURCE.parents[1] / 'independent-audit-v3'
PINNED = {
 'file-manifest.json': 'bb0703290ebc6840546bee5759fca7572e376161f4a1b90e58ad178f59764214',
 'release-readiness.json': '44cc056bb08be90e759a132986be466eba65b7a5a5c71e114bb659770c81c373',
 'independent-audit-v3-report.md': '2ee0e9f0a27bf33e5728b89c9d5fa400dd34ffb0f3f5cd7f45fc290130b86643',
}

def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()

def clean(value):
 """Strip local-file locator fields from frontend data; originals remain unchanged."""
 if isinstance(value, list): return [clean(v) for v in value]
 if isinstance(value, dict):
  return {k:clean(v) for k,v in value.items() if k not in ('localPath','localFile','directory','file')}
 return value

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--source',type=Path,default=DEFAULT_SOURCE)
 ap.add_argument('--audit-dir',type=Path,default=DEFAULT_AUDIT)
 ap.add_argument('--output-root',type=Path,default=Path(__file__).resolve().parents[1])
 ap.add_argument('--catalog',type=Path,default=Path('/workspace/shared/valuation-lab/dist/data/atlas-company-catalog-v1.json'))
 args=ap.parse_args(); src=args.source; audit_dir=args.audit_dir
 assert sha(src/'file-manifest.json')==PINNED['file-manifest.json'], 'Source manifest changed'
 manifest=json.loads((src/'file-manifest.json').read_text())
 assert len(manifest)==22 and len({f['file'] for f in manifest})==22
 for f in manifest:
  assert Path(f['file']).name==f['file'], 'Whitelist must contain only public top-level files'
  assert sha(src/f['file'])==f['sha256'], f['file']
  assert (src/f['file']).stat().st_size==f['bytes'], f['file']
 for name in ('release-readiness.json','independent-audit-v3-report.md'):
  assert sha(audit_dir/name)==PINNED[name], 'Independent audit changed: '+name
 load=lambda name:json.loads((src/name).read_text())
 values=load('valuation-results.json'); capital=load('capital-claims.json'); historical=load('history-10fy.json')
 research=load('research.json'); compensation=load('compensation-allocation.json')
 audit=json.loads((audit_dir/'release-readiness.json').read_text())
 assert audit['decision']=='ready_for_explicitly_conditional_June_origin_research'
 assert not audit['blocking_corrections'] and audit['public_manifest_entries_verified']==22
 assert all(audit[k] is False for k in ('verified_June_equity_value_approved','current_price_target_approved','unconditional_per_share_approved','claim_budget_adequacy_verified','inventory_completeness_verified','stress_intervals_are_verified_bounds'))
 out=args.output_root/'dist/data'/PACKAGE; out.mkdir(parents=True,exist_ok=True)
 def write(name,obj):
  (out/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False,allow_nan=False)+'\n')
 # The public-source snapshot is byte-for-byte, including historical pending-review
 # language. It contains only the 22 reviewed public files plus their manifest.
 snapshot=out/'public-source-v3'; snapshot.mkdir(exist_ok=True)
 for name in [f['file'] for f in manifest]+['file-manifest.json']:
  (snapshot/name).write_bytes((src/name).read_bytes())
 for old,new in [('history-10fy.json','CDNS-history-v3.json'),('research-report.md','CDNS-full-research-v3.md'),('valuation_model.py','CDNS-source-model-v3.py')]:
  (out/new).write_bytes((src/old).read_bytes())
 (out/'CDNS-v3-audit.json').write_bytes((audit_dir/'release-readiness.json').read_bytes())
 (out/'CDNS-independent-audit-v3-report.md').write_bytes((audit_dir/'independent-audit-v3-report.md').read_bytes())
 review={
  'status':'independently-cleared-conditional-June-origin-research',
  'reviewDate':'2026-10-18','sourceStatusPreserved':True,
  'laterReviewNote':{
   'en':'The original v3 research files retain their submitted/pending-review wording. The separate October 18 independent review later cleared explicitly conditional June-origin research, with no new blocking correction. This note does not rewrite the original sources or certify the claim budget or award inventory. Current-date, unconditional equity and market-price comparisons remain blocked.',
   'zh-Hans':'原始 v3 研究文件保留提交时的待复核措辞。另附的 10 月 18 日独立复核随后批准了明确标注为六月基准日的条件性研究，未发现新的阻断性修正。本说明不改写原文，也不证明请求权预算或奖励库存完整。当前日期、无条件股权价值及市场价格比较仍被禁用。'},
  'decision':audit['decision'],'auditSHA256':PINNED['release-readiness.json'],
  'auditReportSHA256':PINNED['independent-audit-v3-report.md'],
  'independenceScope':audit['independence_scope'],'remainingFactualGates':audit['remaining_factual_gates']}
 write('CDNS-v3-later-review-note.json',review)
 source={
  'operating':clean(values),'capital':clean(capital),'compensation':clean(compensation),
  'research':clean(research),'sources':clean(load('source-ledger.json')),
  'historyBasis':historical['basis'],'publicExportManifest':manifest,
  'publicExportManifestSHA256':PINNED['file-manifest.json'],
  'laterIndependentReview':review}
 for key,name in {'costOfCapital':'cost-of-capital.json','forecastMethodology':'forecast-methodology.json','productHistory':'product-history.json','acquisitionComparability':'acquisition-comparability.json','managementTrackRecord':'management-track-record.json','terminalReturnReview':'terminal-return-review.json','conditionalAllocationSensitivity':'conditional-allocation-sensitivity.json','futureGrantSensitivity':'future-grant-sensitivity.json','sourceSensitivities':'sensitivity.json','originalValidation':'validation-report.json','originalRevisionLog':'revision-log.json'}.items():
  source[key]=clean(load(name))
 write('CDNS-v3-source.json',source)
 prefix='./data/'+PACKAGE+'/'
 identity={
  'packageVersion':PACKAGE,'version':VERSION,'ticker':'CDNS','currency':'USD',
  'informationAsOf':'2026-10-18','discountOrigin':'2026-06-30',
  'sourceSHA256':sha(src/'valuation-results.json'),
  'bridgeSourceSHA256':sha(src/'capital-claims.json'),
  'compensationSourceSHA256':sha(src/'compensation-allocation.json'),
  'sourceLedgerSHA256':sha(src/'source-ledger.json'),
  'sourceManifestSHA256':PINNED['file-manifest.json'],
  'packagedSourceSHA256':sha(out/'CDNS-v3-source.json'),
  'auditSHA256':sha(out/'CDNS-v3-audit.json'),
  'historySourceSHA256':sha(src/'history-10fy.json'),
  'packagedHistorySHA256':sha(out/'CDNS-history-v3.json'),
  'fullReportSHA256':sha(out/'CDNS-full-research-v3.md'),
  'auditReportSHA256':sha(out/'CDNS-independent-audit-v3-report.md'),
  'allocationSourceSHA256':sha(out/'CDNS-source-model-v3.py'),
  'laterReviewNoteSHA256':sha(out/'CDNS-v3-later-review-note.json'),
  'sourcePath':prefix+'CDNS-v3-source.json','auditPath':prefix+'CDNS-v3-audit.json',
  'historyPath':prefix+'CDNS-history-v3.json','reportPath':prefix+'CDNS-v3.html',
  'fullReportPath':prefix+'CDNS-full-research-v3.md',
  'auditReportPath':prefix+'CDNS-independent-audit-v3-report.md',
  'allocationSourcePath':prefix+'CDNS-source-model-v3.py',
  'laterReviewNotePath':prefix+'CDNS-v3-later-review-note.json',
  'publicSourceManifestPath':prefix+'public-source-v3/file-manifest.json'}
 prose={
 'scope':('Conditional June-origin research: financial and discount origin June 30, 2026; information through October 18, 2026. Later guidance and risk inputs are used retrospectively. This is neither an as-known-at-June backtest nor a current-date valuation. Current-price comparisons and unconditional equity outputs remain blocked. The $500 million residual budget and assumed award inventory are unverified; the 75% marketable recovery is an assumption.',
 '六月基准日条件性研究：财务及折现基准日为 2026 年 6 月 30 日，信息截至 2026 年 10 月 18 日。较后的指引和风险输入被回溯使用，因此不是截至六月已知信息的回测，也不是当前日期估值。当前市场价格比较及无条件股权输出仍被禁用。5 亿美元剩余请求权预算及假设奖励库存未经验证，75% 可交易资产回收率属于假设。'),
 'summary':('Cadence Design Systems reports in USD and has one operating segment. Core EDA, IP and System Design and Analysis are product-revenue categories. Recurring demand, custom silicon, verification complexity and simulation support the operating thesis, while hardware timing, export rules and acquisition integration remain material risks. AI agent monetization is management expectation, not separately audited contracted revenue.',
 'Cadence Design Systems 以美元报告，只有一个经营分部。核心 EDA、IP 及系统设计与分析属于产品收入分类。持续需求、定制芯片、验证复杂性及仿真支持经营逻辑；硬件交付时点、出口规则与收购整合仍是重大风险。AI 代理商业化是管理层预期，并非经独立审计的单独合同收入。'),
 'growth':('FY2026 base full-year revenue is the $6,300 million midpoint of July 27 management guidance ($6,260–6,340 million), with analyst-normalized EBIT. It is a forecast, not an actual. H1 reported revenue is $3,058.671 million and reported EBIT $881.644 million. Named downside/base/upside anchors use $6,260/$6,300/$6,340 million respectively, then ten full years FY2027–2036. Their growth paths are analyst assumptions with no assigned probabilities.',
 '2026 财年基准全年收入为 7 月 27 日管理层指引 62.6–63.4 亿美元的中点 63 亿美元，EBIT 经分析师规范化。这是预测，不是实际值。上半年报告收入为 30.58671 亿美元，报告 EBIT 为 8.81644 亿美元。下行／基准／上行情景全年锚点分别为 62.6／63／63.4 亿美元，随后为 2027–2036 十个完整财年。增长路径属于分析假设，不赋予概率。'),
 'profitability':('Post-origin future grants remain economic labor expense at 12%/10.2%/9% of revenue in downside/base/upside. H2 removes $283.927 million accounting SBC and replaces it with the selected new-grant charge; this is not a free SBC add-back. Later years hold the prior pre-SBC margin fixed and deduct the selected economic grant rate. R&D, recurring rent and integration expenses remain costs. Future grants receive no second denominator dilution.',
 '基准日后未来新授予在下行／基准／上行情景中分别按收入的 12%／10.2%／9% 计入经济劳动费用。下半年移除 2.83927 亿美元会计股份薪酬，并以所选新授予费用替代，并非免费加回股份薪酬。以后年度保持此前扣除股份薪酬前的利润率，再扣除所选经济授予费率。研发、经常性租金及整合费用仍保留为成本。未来授予不会再重复增加分母稀释。'),
 'funding':('The selected 2026-H2 opening stub and its WACC are fixed, source-specific inputs. It is discounted once over 0.5 years. Annual edits, simulations, annual WACC/path stresses and horizon extensions affect future full years only; they neither randomize nor rewrite the stub. Selecting a named case atomically changes its FY2026 forecast anchor and its own H2 stub. FY2027 starts at 1.5 years from origin. H1 actual cash flows are never valued again. Preserved source WACC grids vary the all-period source WACC and are separate evidence; they are not identical to these fixed-stub future-year sensitivities.',
 '所选 2026 年下半年期初短期段及其 WACC 为固定、来源对应的输入，仅按 0.5 年折现一次。年度编辑、模拟、年度 WACC／路径压力测试及预测期延长只影响未来完整年度，不会随机抽取或改写该短期段。切换命名情景时，同时载入其 2026 财年预测锚点及相应下半年短期段。2027 财年距基准日 1.5 年。上半年实际现金流不会被再次估值。保留的来源 WACC 网格改变全期间来源 WACC，属于单独证据，并不等同于此处固定短期段的未来年度敏感性。'),
 'capital':('The source H2 investment funds remaining guided capex, ordinary depreciation, working-capital growth and purchased technology. FY2027 onward reinvestment is positive incremental NOPAT divided by the source declining incremental-return assumption. The FY2027 baseline retains reported H1 SBC and normalizes H2; the independent review disclosed a nonblocking like-for-like baseline alternative rather than changing the source. No borrowed next-year cash policy is introduced.',
 '来源中的下半年投资涵盖指引剩余资本开支、普通折旧、营运资本增长及外购技术。2027 财年起，再投资按正向增量 NOPAT 除以来源中逐步下降的增量回报假设计算。2027 财年的基线保留上半年报告股份薪酬，并规范化下半年；独立复核披露了非阻断性的同口径基线替代方案，没有改写来源。未引入其他公司的下一年经营现金政策。'),
 'wacc':('Nominal USD WACC is 12.0%/10.5%/9.25% in downside/base/upside. These are dated analyst scenario assumptions, not company-observed WACCs or price-implied estimates. The opening stub retains the selected source WACC under future-year sensitivities. No statistical distribution calibration or historical-frequency claim is established.',
 '下行／基准／上行情景名义美元 WACC 分别为 12.0%／10.5%／9.25%。这些是特定日期的分析情景假设，并非可观测公司 WACC 或股价隐含估计。在未来年度敏感性分析中，期初短期段保留所选来源 WACC。未建立统计分布校准或历史频率依据。'),
 'tax':('Scenario operating cash-tax rates are 28%/24%/21% in downside/base/upside. No separate legacy-vesting tax windfall or full deferred-tax-asset credit is added. Residual opening non-operating claims must not also be settled inside forward FCFF under the selected bridge assumption.',
 '下行／基准／上行情景经营现金税率分别为 28%／24%／21%。不另加旧奖励归属税收收益，也不全额加回递延所得税资产。在所选资本桥假设下，期初剩余非经营请求权不得又在未来 FCFF 内重复结算。'),
 'terminal':('Terminal growth is 2.0%/2.5%/3.0% and terminal ROIC 10%/15%/20% in downside/base/upside. Terminal reinvestment equals NOPAT × growth / ROIC. Downside terminal ROIC is below its WACC; growth consumes value relative to capital cost. Historical R&D-capitalized return diagnostics are only reasonableness anchors and differ from the forecast compensation basis. Terminal value is not a free cash-flow perpetuity without funding.',
 '下行／基准／上行情景终值增长率为 2.0%／2.5%／3.0%，终值 ROIC 为 10%／15%／20%。终值再投资等于 NOPAT×增长率／ROIC。下行情景终值 ROIC 低于其 WACC，新增增长相对资本成本消耗价值。历史研发资本化回报诊断仅用于合理性参考，且与预测股份薪酬口径不同。终值不是不需投入资金的永续现金流。'),
 'claims':('The June bridge starts with cash $1,440.443 million, less a selected $189 million operating reserve, plus $91.392 million marketables × assumed 75% recovery, zero private-asset credit, less $2,500 million debt face and one $500 million all-in residual non-operating claim budget. Historical tax, acquisition-tax, coupon and derivative references are rationale inside that one budget, never extra deductions. Budget adequacy, overlaps, asset availability and leakage are unverified.',
 '六月资本桥以现金 14.40443 亿美元起算，减所选 1.89 亿美元经营储备，加 9,139.2 万美元可交易资产×假设 75% 回收率，私人资产信用为零，再减 25 亿美元债务面值及一次性 5 亿美元全包剩余非经营请求权预算。历史税款、收购税、票息及衍生品参考额仅为同一预算内部的依据，不再额外扣除。预算充分性、重叠、资产可用性及税费流失均未经验证。'),
 'awards':('Legal June common shares are 275.393 million. Add assumed unissued RSU/PSU/LTP 4.475463 million, options 0.994747 million and existing ESPP rights 0.300000 million, giving 281.163210 million allocation units. The February 19 proxy inventory is assumed unchanged at June 30; ESPP is an assumption, not a reported June count. Issued restricted shares and vested-unsettled LTP components are not added twice. Options and ESPP use zero-price full-share participation, not option fair value, treasury-stock dilution or an exercise-proceeds credit.',
 '六月法定普通股为 2.75393 亿股，加假设未发行 RSU／PSU／LTP 447.5463 万股、期权 99.4747 万股及现有 ESPP 权利 30 万股，共 2.81163210 亿个分配单位。假设 2 月 19 日委托书库存至 6 月 30 日保持不变；ESPP 为假设，不是六月报告数量。已发行限制性股票及已归属未结算 LTP 组成项不重复增加。期权和 ESPP 采用零价格完整股数参与，并非期权公允价值、库存股稀释或行权收入信用。'),
 'claimLimits':('The listed stresses (including $250/$500/$800 million residual claims) are analyst examples, not verified bounds or confidence intervals. Residual claims and unissued award quantities have no finite verified maximum. Null selected claims block per-share allocation while valid operating EV remains available. The $970.8 million unrecognized accounting compensation is neither another claim nor a PV benefit; illustrative recognition and reversal cancel. Unknown litigation has no verified finite ceiling.',
 '列示压力值（包括 2.5／5／8 亿美元剩余请求权）是分析示例，并非经验证的边界或置信区间。剩余请求权及未发行奖励数量没有经验证的有限上限。所选请求权留空时阻止每股分配，但有效经营企业价值仍可用。9.708 亿美元未确认会计薪酬既不是另一项请求权，也不是现值收益；示例确认及转回相互抵消。未知诉讼没有经验证的有限上限。'),
 'history':('Ten reported fiscal years FY2016–2025 are preserved with field-level SEC provenance. Canonical EBIT is reported operating_income, with no SBC or R&D add-back. Adjacent history retains reported cash flow, SBC, R&D, acquisitions, goodwill, intangibles, debt and share/EPS fields; null means unknown, never zero. ASC606 in 2018, ASC842 and tax effects in 2019, the 53-week 2020 year, the calendar-year change and acquisitions break comparability. No ten-year organic or constant-scope series is manufactured.',
 '保留 2016–2025 十个报告财年及逐字段 SEC 来源。规范 EBIT 使用报告 operating_income，不加回股份薪酬或研发。相邻历史证据保留报告现金流、股份薪酬、研发、收购、商誉、无形资产、债务及股数／每股收益字段；空值代表未知，不是零。2018 年 ASC606、2019 年 ASC842 及税务影响、2020 年 53 周年度、日历年度变化与收购均造成可比性断点。不构造十年有机增长或恒定范围序列。'),
 'management':('The guidance comparison covers only three completed fiscal years plus FY2026 revisions, not a ten-year forecasting-accuracy study. Q2 2026 revenue exceeded the prior midpoint but not the upper bound; GAAP operating margin was below the prior floor. Acquisitions, export settlement, tax and mix prevent a simple managerial-skill inference.',
 '指引比较仅覆盖三个已完成财年及 2026 财年修订，并非十年预测准确度研究。2026 年第二季度收入高于此前中点但未超过上限；GAAP 经营利润率低于此前下限。收购、出口和解、税务及业务组合使简单推断管理层预测能力不可靠。'),
 'uncertainty':('Downside/base/upside are named analyst paths with no probabilities. Monte Carlo inputs must start fixed and Run is manual; no confidence, calibration or actual-bound claim is supported. Each path keeps its selected opening stub fixed, and only future full years may change. Exact June award inventory, residual claims, matched assets and post-June movements remain factual gates before a verified current valuation.',
 '下行／基准／上行是没有概率的命名分析路径。蒙特卡洛输入应以固定值开始，并由用户手动运行；没有置信度、校准或实际边界依据。每条路径保持所选期初短期段固定，只能改变未来完整年度。精确六月奖励库存、剩余请求权、匹配资产及六月以后变动仍是形成经验证当前估值前的事实门槛。'),
 'review':(review['laterReviewNote']['en'],review['laterReviewNote']['zh-Hans'])}
 def case(name):
  x=values[name]; p=x['parameters']; r=x['rows'][0]
  assert len(x['rows'])==11 and r['period']=='2026-H2' and r['years_from_origin']==.5
  stub={
   'period':r['period'],'end':r['end'],'durationYears':.5,'revenue':r['revenue'],
   'operatingMargin':r['economic_margin'],'taxRate':r['cash_tax_rate'],
   'reinvestment':r['net_reinvestment'],'wacc':p['wacc'],'fullYearRevenue':p['fy26_revenue'],
   'sourceScenario':name,'immutable':True,'policy':'selected-source-fixed-stub; annual sensitivities affect future full years only',
   'futureNewGrantRate':r['sbc_pct'],'accountingSBCRemoved':r['accounting_sbc_removed'],
   'futureNewGrantCost':r['future_new_grant_cost'],
   'sbcEconomicExpenseEmbeddedInEBIT':r['sbc_economic_expense_embedded_in_ebit'],
   'preFutureGrantEBIT':r['pre_future_grant_ebit'],
   'illustrativeLegacyAwardAmortization':r['illustrative_legacy_award_amortization'],
   'illustrativeAccountingLikeEBIT':r['illustrative_accounting_like_ebit'],
   'legacyReversalToEconomicEBIT':r['legacy_reversal_to_economic_ebit'],
   'sourceRow':copy.deepcopy(r)}
  annual=[{'year':i+1,'period':'FY'+r['period'],'originalSourceYear':int(r['period']),
   'end':r['end'],'revenue':r['revenue'],'operatingMargin':r['economic_margin'],
   'taxRate':r['cash_tax_rate'],'reinvestment':r['net_reinvestment'],'wacc':p['wacc'],
   'sourceYearsFromOrigin':r['years_from_origin'],'sourceFutureNewGrantRate':r['sbc_pct'],
   'sourceIncrementalROIC':r['incremental_roic']} for i,r in enumerate(x['rows'][1:])]
  assert [r['year'] for r in annual]==list(range(1,11))
  assert [r['period'] for r in annual]==['FY'+str(y) for y in range(2027,2037)]
  return {'ticker':'CDNS','company':'Cadence Design Systems','currency':'USD','scenario':'base',
   'sourceScenario':name,'ratioUnit':'decimal','forecastHorizonYears':10,'incrementalResearch':identity,
   'valuationTiming':{'discountOrigin':'2026-06-30','openingStubYears':.5,'convention':'period-end; fixed half-year stub then annual full years'},
   'anchor':{'period':'FY2026','fiscalEnd':'2026-12-31','kind':'management_full_year_forecast',
    'classification':'July 27 management full-year revenue guidance plus analyst economic EBIT normalization; not actual.',
    'revenue':p['fy26_revenue'],'EBIT':x['FY2026_economic_ebit_usd_m'],
    'managementGuidanceDate':'2026-07-27','sourceScenario':name,
    'fullYearRevenueGuidance':[6260,6340],'H1ActualRevenue':3058.671,'H1ActualEBIT':881.644,
    'H1ActualEnd':'2026-06-30','firstModeledPeriod':'FY2027','firstModeledPeriodStart':'2027-01-01',
    'fiscalCalendarCaution':'FY2026 anchor is a full-year forecast; the fixed H2 stub precedes ten editable full years. Historical 52/53-week and calendar-year comparability differs.'},
   'openingStub':stub,'annual':annual,
   'terminal':{'growth':p['terminal_g'],'operatingMargin':annual[-1]['operatingMargin'],'taxRate':p['cash_tax'],'ROIC':p['terminal_roic'],'wacc':p['wacc']},
   'boundedModelGaps':[prose[k][0] for k in ('scope','funding','claimLimits','history')],
   'sourceOperatingEnterpriseValue':x['operating_enterprise_value_usd_m']}
 base=case('base')
 alternatives=[{'name':n,'label':label,'buttonLabel':button,
  'classification':'Analyst scenario; no assigned probability; conditional June-origin',
  'annualCase':case(n)} for n,label,button in [('down','Downside scenario','Load reviewed downside'),('up','Upside scenario','Load reviewed upside')]]
 def opt(key,label,value,low,high,stresses,unit='USDm',scale=1):
  return {'key':key,'label':label,'type':'number','default':value,'min':low,'max':high,
   'allowUnknown':True,'unit':unit,'scale':scale,'listedStressValues':stresses,
   'stressClassification':'Analyst listed examples; not verified actual bounds or confidence intervals'}
 known=capital['known']
 bridge={
  'type':'cdns-v3','currency':'USD','referenceDate':'2026-06-30','shareDate':'2026-06-30',
  'awardInventorySourceDate':'2026-02-19','assumedAwardInventoryDate':'2026-06-30',
  'sourceUrl':next(s['url'] for s in source['sources'] if s['source_id']=='CDNS-047'),
  'shares':known['legal_common_shares'],'cash':known['cash'],'debt':known['debt_face'],
  'marketables':known['marketable_equity']+known['marketable_debt_securities'],
  'defaultAllocationUnits':281.163210,
  'options':[
   opt('residualClaimBudget','All-in residual claim budget',500,0,None,[250,500,800]),
   opt('unissuedRSUShares','Assumed unissued RSU/PSU/LTP shares',4.475463,0,None,[3.547462,4.475463,6],'million shares'),
   opt('optionFullShares','Assumed option full-share participation',.994747,0,None,[.8,.994747,1.2],'million shares'),
   opt('esppFullShares','Assumed existing ESPP full-share participation',.3,0,None,[0,.3,.6],'million shares'),
   opt('marketableRecovery','Assumed marketable-asset recovery',.75,0,1,[.5,.75,1],'%',100),
   opt('operatingCashReserve','Selected opening operating-cash reserve',189,0,1440.443,[189,378,630]),
   opt('privateAssetCredit','Conditional private-investment credit',0,0,89.6,[0,44.8,89.6])],
  'notes':[prose[k][0] for k in ('claims','awards','profitability','funding')],
  'unresolved':[prose[k][0] for k in ('scope','claimLimits')],
  'shareBasis':'Nasdaq common stock; June legal common plus assumed unissued legacy participation; not weighted-average diluted EPS shares',
  'classification':'Conditional June-origin allocation using unverified residual budget and award inventory',
  'claimCompleteness':'unverified-budget-and-inventory; listed-stresses-not-actual-bounds',
  'currentPriceTargetEligible':False,'unconditionalEquityValueEligible':False,
  'exerciseProceedsCredit':0,'legacyUnrecognizedCompensationDeduction':0,
  'allocationMethod':'one-pool-zero-price-full-share-participation',
  'operatingCashReservePolicy':'fixed selected opening reserve; no dynamic next-year cash policy',
  'nullPolicy':'Missing selected claim input blocks allocation; retain valid signed operating EV.'}
 # Use only the verified CDNS catalog record, never infer account-level eligibility.
 catalog=json.loads(args.catalog.read_text()); listing=next(r for r in catalog['companies'] if r['ticker']=='CDNS')
 admission={k:listing[k] for k in ('ticker','nativeTicker','mic','exchange','securityType','verified','checkedAt','sourceURLs','evidence','robinhood')}
 products={r['year']:r for r in source['productHistory']['rows']}
 acquisitions={r['fy']:r for r in source['acquisitionComparability']['timeline']}
 history=[]
 for row in historical['rows']:
  v=row['values']; year=row['fiscal_year']
  history.append({'fiscalYear':year,'period':'FY'+str(year),'fiscalEnd':row['period_end'],
   'periodStart':row['period_start'],'days':row['days'],'revenue':v['revenue'],
   'canonicalOperatingEBIT':v['operating_income'],'operatingMargin':v['operating_income']/v['revenue'],
   'capex':v.get('capex'),'DA':v.get('depreciation_amortization'),
   'normalizedValues':copy.deepcopy(v),'provenance':clean(row['provenance']),
   'comparabilityFlags':copy.deepcopy(row['comparability_flags']),
   'productRevenueEvidence':products.get(year),'acquisitionComparability':acquisitions.get(year),
   'canonicalEBITPolicy':'reported operating_income; no SBC, R&D or acquired-amortization add-back'})
 assert len(history)==10 and [r['fiscalYear'] for r in history]==list(range(2016,2026))
 sources=source['sources']
 for r in sources:
  r['id']=r.get('source_id',r.get('id',''))
 record={'identity':identity,'publicTradability':admission,'annualCase':base,'alternatives':alternatives,
  'bridge':bridge,'history':history,'prose':{k:{'en':v[0],'zh-Hans':v[1]} for k,v in prose.items()},
  'sources':sources,'auditResults':audit,'laterIndependentReview':review,
  'sourceSensitivities':{'operating':source['sourceSensitivities'],'conditionalAllocation':source['conditionalAllocationSensitivity'],'futureGrants':source['futureGrantSensitivity']},
  'compensationSensitivity':clean(compensation),'readiness':'reviewed-fiscal-origin-only',
  'historyLimitations':historical['basis'],'unconditionalEquityValue':None,'currentPerShareValue':None}
 bundle={'schemaVersion':1,'version':PACKAGE,'asOf':'2026-10-18','companies':[record]}
 write('cases.json',bundle)
 registry=args.output_root/'dist/cdns-research-registry.js'
 registry.write_text('// Build-generated reviewed public-safe CDNS v3; conditional June-origin only.\nconst bundle='+json.dumps(bundle,indent=2,ensure_ascii=False,allow_nan=False)+";\nfunction freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}\nexport const cdnsRegistry=freeze(bundle);\n")
 render_html(out,record,values)
 checks={
  'sourceManifestEntriesVerified':22,'originalPublicFilesCopiedByteForByte':23,
  'auditHashesVerified':{k:PINNED[k] for k in ('release-readiness.json','independent-audit-v3-report.md')},
  'sourceManifestSHA256':PINNED['file-manifest.json'],
  'sourceHashesVerifiedByIndependentAudit':audit['source_hashes_verified'],
  'rawSourceHashScope':'53 raw-source hashes were verified by the independent audit; this public-only builder verifies the audit hashes and all 22 public manifest entries and does not open or export raw/private sources.',
  'historyYears':10,'annualFullYearsPerCase':10,'openingStubYears':.5,
  'annualNumbering':'1-10; FY2027-FY2036','openingStubPolicy':'fixed selected source cash flows and WACC; full-year tail-only stresses',
  'canonicalHistoryEBIT':'reported operating_income; zero SBC add-back',
  'defaultAllocationUnits':281.163210,'sourceStatusUnmodified':True,
  'conditionalAllocationChecks':{}}
 for name,c in [('base',base)]+[(r['name'],r['annualCase']) for r in alternatives]:
  stub=c['openingStub']; discount=(1+stub['wacc'])**stub['durationYears']
  ev=(stub['revenue']*stub['operatingMargin']*(1-stub['taxRate'])-stub['reinvestment'])/discount
  for r in c['annual']:
   discount*=1+r['wacc']; ev+=(r['revenue']*r['operatingMargin']*(1-r['taxRate'])-r['reinvestment'])/discount
  t=c['terminal']; nopat=c['annual'][-1]['revenue']*(1+t['growth'])*t['operatingMargin']*(1-t['taxRate'])
  ev+=nopat*(1-t['growth']/t['ROIC'])/(t['wacc']-t['growth'])/discount
  units=bridge['shares']+4.475463+.994747+.3
  pool=ev+bridge['cash']-189+bridge['marketables']*.75-bridge['debt']-500
  price=pool/units
  assert abs(ev-values[name]['operating_enterprise_value_usd_m'])<1e-8
  assert abs(price-audit['independent_results'][name]['conditional_usd_per_share'])<1e-10
  assert abs(units-281.163210)<1e-10
  checks['conditionalAllocationChecks'][name]={'operatingEV':ev,'conditionalPerShare':price,'allocationUnits':units,'sourceReproduced':True}
 write('CDNS-v3-build-checks.json',checks)
 # Output hashes omit this self-referential manifest and include the registry.
 output_manifest={'packageVersion':PACKAGE,'files':[{'file':str(p.relative_to(out)), 'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(out.rglob('*')) if p.is_file() and p.name!='CDNS-v3-package-manifest.json'], 'registry':{'file':'dist/cdns-research-registry.js','sha256':sha(registry),'bytes':registry.stat().st_size}}
 write('CDNS-v3-package-manifest.json',output_manifest)
 print(json.dumps({'package':str(out),'registry':str(registry),'checks':checks},indent=2))


def render_html(out,record,values):
 e=lambda value:html.escape(str(value),quote=True)
 def num(value,d=3): return 'Unknown / 未知' if value is None else f'{value:,.{d}f}'
 id=record['identity']; parts=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CDNS v3 conditional June-origin research / CDNS v3 六月基准日条件性研究</title><style>body{font:17px/1.65 system-ui,sans-serif;max-width:1120px;margin:auto;padding:28px;color:#17212b;background:#fff}nav{display:flex;gap:16px;flex-wrap:wrap}section{border-top:1px solid #d4dce2;padding-top:18px;margin-top:26px}h1{line-height:1.2}h2{font-size:1.35rem}p{max-width:100ch}.caution{background:#fff4d8;border-left:5px solid #a35c00;padding:16px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:8px;border-bottom:1px solid #d4dce2;text-align:right;vertical-align:top}th:first-child,td:first-child{text-align:left}a{color:#0a5186}small{font-size:.85rem}.nowrap{white-space:nowrap}</style></head><body><nav><a href="../../index.html">Valuation Lab</a><a href="#english">English</a><a href="#chinese">简体中文</a><a href="#evidence">Evidence / 证据</a></nav>']
 for lang,anchor in [('en','english'),('zh-Hans','chinese')]:
  chinese=lang=='zh-Hans'
  parts.append(f'<article lang="{lang}" id="{anchor}"><h1>CDNS · Cadence Design Systems</h1><p>{e(id["version"])}</p>')
  for key,value in record['prose'].items():
   title={'scope':('Conditional scope','条件性范围'),'summary':('Business evidence','业务证据'),'growth':('Forecast anchor','预测锚点'),'profitability':('Compensation and margins','薪酬与利润率'),'funding':('Fixed opening stub and future-year boundary','固定期初短期段及未来年度边界'),'capital':('Reinvestment','再投资'),'wacc':('Cost of capital','资本成本'),'tax':('Tax','税务'),'terminal':('Terminal funding','终值资金需求'),'claims':('One residual budget','单一剩余请求权预算'),'awards':('Conditional award participation','条件性奖励参与'),'claimLimits':('Unverified inventory and stress limits','未经验证的库存及压力边界'),'history':('Ten-year history limitations','十年历史局限'),'management':('Management guidance coverage','管理层指引覆盖范围'),'uncertainty':('Uncertainty','不确定性'),'review':('Separate later review note','单独列示的后续复核说明')}[key][int(chinese)]
   parts.append(f'<section id="{key}{"-zh" if chinese else ""}"><h2>{e(title)}</h2><p class="{"caution" if key in ("scope","funding","claims","awards","review") else ""}">{e(value[lang])}</p></section>')
  heading='条件性六月基准日情景结果 · 百万美元／美元每股' if chinese else 'Conditional June-origin scenario outputs · USD millions / USD per share'
  parts.append(f'<section><h2>{heading}</h2><p class="caution">{e(record["prose"]["scope"][lang])}</p><div class="table-wrap"><table><tr><th>Case / 情景</th><th>Operating EV / 经营企业价值</th><th>Conditional per share / 条件性每股</th><th>Future grant cost / 新授予费用</th></tr>')
  for name,label in [('down','Downside / 下行'),('base','Base / 基准'),('up','Upside / 上行')]:
   x=values[name]
   parts.append(f'<tr><td>{label}</td><td>{num(x["operating_enterprise_value_usd_m"],6)}</td><td>{num(x["conditional_equity_allocation"]["conditional_usd_per_share"],6)}</td><td>{x["parameters"]["future_new_grant_pct"]:.1%}</td></tr>')
  parts.append('</table></div><p>281.163210 million assumed allocation units / 百万个假设分配单位; $500M unverified budget / 未经验证预算; 75% assumed marketable recovery / 假设可交易资产回收率.</p></section></article>')
 parts.append('<section id="evidence"><h2>Opening stub and ten full years / 期初短期段及十个完整年度</h2><p class="caution">'+e(record['prose']['funding']['en'])+'<br>'+e(record['prose']['funding']['zh-Hans'])+'</p>')
 for name in ('down','base','up'):
  parts.append(f'<h3>{e(name)} · USDm / 百万美元</h3><div class="table-wrap"><table><tr><th>Period / 期间</th><th>Time / 年数</th><th>Revenue / 收入</th><th>Economic EBIT / 经济 EBIT</th><th>Investment / 再投资</th><th>FCFF</th><th>WACC</th></tr>')
  for row in values[name]['rows']:
   parts.append('<tr>'+''.join(f'<td>{v}</td>' for v in [e(row['period']),num(row['years_from_origin'],1),num(row['revenue']),num(row['economic_ebit']),num(row['net_reinvestment']),num(row['fcff']),f'{values[name]["parameters"]["wacc"]:.2%}'])+'</tr>')
  parts.append('</table></div>')
 parts.append('</section><section><h2>Selected claims and illustrative stresses / 所选请求权及示例压力值</h2><p>Listed stresses are examples, not actual bounds; null is unknown. / 列示压力值为示例，并非实际边界；空值代表未知。</p><div class="table-wrap"><table><tr><th>Input / 输入</th><th>Default / 默认值</th><th>Allowed input domain / 输入范围</th><th>Listed stresses / 列示压力值</th></tr>')
 for option in record['bridge']['options']:
  high='No verified finite maximum / 无经验证有限上限' if option['max'] is None else str(option['max'])
  parts.append(f'<tr><td>{e(option["label"])}</td><td>{e(option["default"])}</td><td>{e(option["min"])} – {e(high)}</td><td>{e(", ".join(map(str,option["listedStressValues"])))}</td></tr>')
 parts.append('</table></div></section><section><h2>Reported FY2016–2025 evidence / 2016–2025 财年报告证据</h2><p>'+e(record['prose']['history']['en'])+'<br>'+e(record['prose']['history']['zh-Hans'])+'</p><div class="table-wrap"><table><tr><th>FY</th><th>Revenue / 收入</th><th>Reported EBIT / 报告 EBIT</th><th>SBC / 股份薪酬</th><th>R&amp;D / 研发</th><th>CFO / 经营现金流</th><th>Capex / 资本开支</th><th>Cash acquisitions / 现金收购</th></tr>')
 for row in record['history']:
  v=row['normalizedValues']; url=row['provenance']['operating_income']['url']
  parts.append('<tr><td><a href="'+e(url)+'">FY'+str(row['fiscalYear'])+'</a></td>'+''.join('<td>'+num(v[k])+'</td>' for k in ('revenue','operating_income','sbc','research_and_development','cfo','capex','acquisitions_cash_net'))+'</tr>')
 parts.append('</table></div><h3>Comparability breaks / 可比性断点</h3><ul>')
 for row in record['history']:
  parts.append('<li>FY'+str(row['fiscalYear'])+': '+e(' '.join(row['comparabilityFlags']))+'</li>')
 parts.append('</ul></section><section><h2>Public source links and preserved artifacts / 公开来源及保留原始材料</h2><p>Original submitted-review wording remains in source artifacts. The separate later review note above records the conditional approval. / 原始材料保留提交时的待复核措辞；上述单独后续复核说明记录条件性批准。</p><ul>')
 for s in record['sources']:
  if s.get('url'):
   parts.append('<li><a href="'+e(s['url'])+'">'+e(s.get('id','Source'))+'</a> · '+e(s.get('type',''))+' · '+e(s.get('review_scope',''))+'</li>')
 parts.append('</ul><p>'+' · '.join('<a href="'+e(id[k].split('/')[-1])+'">'+e(label)+'</a>' for k,label in [('fullReportPath','Complete original research / 完整原始研究'),('sourcePath','Source JSON / 来源资料'),('historyPath','Reported history / 报告历史'),('auditPath','Independent readiness / 独立复核结论'),('auditReportPath','Complete independent audit / 完整独立复核'),('laterReviewNotePath','Separate later review note / 单独后续复核说明'),('allocationSourcePath','Reproducible source model / 可重现来源模型')])+'</p><p><a href="public-source-v3/file-manifest.json">Original public manifest / 原始公开清单</a> · <a href="CDNS-v3-build-checks.json">Build verification / 构建验证</a></p></section></body></html>')
 (out/'CDNS-v3.html').write_text('\n'.join(parts))

if __name__=='__main__':
 main()
