"""Package reviewed KEYS research; corporate originals are linked, never copied.

This generator writes only KEYS artifacts in the isolated integration checkout.
Source model v1 and independent audit v2 remain immutable. Run from any cwd.
"""
import copy
import hashlib
import html
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path('/workspace/shared/atlas-research/company-onboarding/KEYS')
OUT = ROOT / 'dist/data/incremental-KEYS-2026-10-19-v1'
OUT.mkdir(parents=True, exist_ok=True)
BASE = './data/' + OUT.name + '/'


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cleantext(value):
    value = value.replace(str(SRC) + '/', '').replace(str(SRC), 'KEYS research archive')
    return re.sub(r'(?:/workspace/|/home/|/tmp/|file://)[^\s\"\'<>`]+', '[private execution path omitted]', value)


def clean(value):
    if isinstance(value, dict):
        return {key: clean(item) for key, item in value.items()}
    if isinstance(value, list):
        return [clean(item) for item in value]
    return cleantext(value) if isinstance(value, str) else value


def write(name, value):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n')


inputs = read(SRC / 'dcf-inputs-v1.json')
outputs = read(SRC / 'dcf-output-v1.json')
audit = read(SRC / 'independent-audit-v2/checks.json')
guidance_audit = read(SRC / 'independent-audit-v2/guidance-checks.json')
review = (SRC / 'independent-audit-v2/independent-audit-v2.md').read_text()
source_manifest = read(SRC / 'integrity-manifest-v1.json')
assert 'PASS WITH LIMITATIONS for a dated conditional operating-value study' in review
assert audit['manifest_count'] == 113 and audit['manifest_errors'] == []
assert audit['all_case_fields_independent_match'] and audit['all_sensitivity_fields_independent_match']
assert audit['verified_history_facts'] == 221 and len(audit['invalid_rejections']) == 23
assert inputs['valuation_anchor'] == '2026-07-31' and inputs['share_date'] == '2026-08-27'
assert inputs['information_cutoff'] == '2026-10-19' and inputs['capital']['shares'] == 170.244745
for item in source_manifest['files']:
    path = SRC / item['path']
    assert path.stat().st_size == item['bytes'] and sha(path) == item['sha256'], item['path']
for item in read(SRC / 'independent-audit-v2/audit-manifest.json'):
    path = SRC / 'independent-audit-v2' / item['path']
    assert path.stat().st_size == item['bytes'] and sha(path) == item['sha256'], item['path']
for name, expected in {'bear': 37.33383840640616, 'base': 129.13743512633602, 'bull': 251.27656948264826}.items():
    assert abs(outputs[name]['conditional_value_per_share'] - expected) < 1e-12
    assert len(outputs[name]['rows']) == 10 and outputs[name]['funding_required'] is False

# Strict allowlist: research-derived observations, source metadata and replay only.
allowed = [
    'STUDY-v1.md', 'dcf-inputs-v1.json', 'dcf-output-v1.json', 'forecast-v1.csv',
    'history-v1.json', 'history-v1.csv', 'history-field-provenance-v1.json',
    'latest-quarter-v1.json', 'sensitivities-v1.json', 'validation-v1.json',
    'eligibility-v1.json', 'source-ledger-v1.json', 'filing-sources.json',
    'integrity-manifest-v1.json', 'replay_dcf.py', 'test_and_sensitivities.py',
    'guidance/guidance_vs_actual.json', 'guidance/guidance_vs_actual.csv',
    'guidance/management_guidance_assessment.md', 'guidance/source_manifest.json',
    'guidance/remarks_manifest.json', 'independent-review-v1.md',
    'independent-review-check-v1.json', 'independent-audit-v2/checks.json',
    'independent-audit-v2/guidance-checks.json',
    'independent-audit-v2/independent-audit-v2.md',
    'independent-audit-v2/independent-recomputed-model.json',
    'independent-audit-v2/audit-manifest.json',
]
packaged_sources = []
for name in allowed:
    source, dest = SRC / name, OUT / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(cleantext(source.read_text()))
    packaged_sources.append({'sourceArtifact': name, 'packagedArtifact': name,
                             'sourceSHA256': sha(source), 'packagedSHA256': sha(dest)})
write('conditional-outputs-v1.json', outputs)

raw_history = read(SRC / 'history-v1.json')
provenance = read(SRC / 'history-field-provenance-v1.json')
history = []
for raw in raw_history:
    fy = raw['fiscal_year']
    if fy == 2016:
        basis = ('ASC605; earlier pension presentation', 'ASC605；较早养老金呈报口径')
        note = ('Earlier revenue guidance; FY2016 is not retroactively homogenized to the later pension presentation. Acquisition perimeter differs from later years.',
                '旧收入准则；未将 2016 追溯调整为后期养老金呈报口径。收购业务范围与后期不同。')
    elif fy in (2017, 2018):
        basis = ('ASC605; later pension recast', 'ASC605；后期养老金重列')
        note = ('Later comparable EBIT is $148m in FY2017 and −$394m in FY2018 after pension non-service reclassification; original EBIT was $239m/−$346m. Ixia changed scope; FY2018 includes a $709m impairment.',
                '养老金非服务项目重分类后，后期比较营业利润为 2017 年 148、2018 年负 394 百万美元；原值为 239／负 346。Ixia 改变业务范围；2018 含 709 百万美元减值。')
    else:
        basis = ('ASC606; changing acquisition perimeter', 'ASC606；收购范围持续变化')
        note = ('ASC606 adopted November 1, 2018 under modified retrospective treatment; earlier years are not restated. Later acquisitions change perimeter; this is reported/recast history, not a constant-perimeter organic series.',
                '2018 年十一月一日以修正追溯法采用 ASC606，较早年度未重述。后续收购改变范围；此为报告／重列历史，不是恒定范围有机增长序列。')
    missing = (' Exact year-end common shares remain unavailable; diluted EPS weighted averages are not substitutes. Null old lease/debt fields remain unknown.',
               ' 精确年末普通股数仍缺失，不以稀释 EPS 加权平均股数替代。较早租赁／债务空值继续表示未知。')
    fp = copy.deepcopy(provenance[str(fy)])
    history.append({
        'period': f'FY{fy}', 'fiscalYear': fy, 'fiscalEnd': raw['end'],
        'revenue': raw['revenue'], 'canonicalOperatingEBIT': raw['ebit'],
        'operatingMargin': raw['ebit_margin'], 'grossProfit': raw['gross_profit'],
        'cashFromOperations': raw['cfo'], 'ownCapex': raw['capex'],
        'depreciation': raw['depreciation'], 'amortization': raw['amortization'], 'SBC': raw['sbc'],
        'reportedOrDerivedFCF': raw['fcf_cfo_less_gross_capex'],
        'fcfBasis': 'CFO less gross PPE capex; descriptive levered measure, not owner FCFF or issuer incentive-inclusive FCF',
        'shares': raw['shares'], 'weightedDilutedShares': raw['weighted_diluted_shares'],
        'operatingLeaseCurrent': raw['operating_lease_current'],
        'operatingLeaseNoncurrent': raw['operating_lease_noncurrent'],
        'comparableIssuerAnnual': False, 'reportedIssuerAnnual': True,
        'coverage': 'reported_or_recast_annual_with_accounting_and_acquisition_breaks',
        'revenueAccountingBasis': 'ASC605' if fy < 2019 else 'ASC606',
        'basisLabel': basis[0], 'basisLabelZh': basis[1],
        'classification': note[0] + missing[0], 'classificationZh': note[1] + missing[1],
        'comparability': note[0], 'sourceUrl': fp['ebit']['source_url'],
        'fieldProvenance': fp, 'sourceRow': copy.deepcopy(raw),
    })
write('history-normalized-v1.json', history)

guidance = []
for original in read(SRC / 'guidance/guidance_vs_actual.json'):
    row = copy.deepcopy(original)
    row.update(status='observed', target_period=row['quarter'], guide_url=row['guidance_source'], actual_url=row['actual_source'],
               forecast_issued_date=datetime.strptime(row['guidance_date'], '%B %d, %Y').date().isoformat(),
               actual_issued_date=datetime.strptime(row['actual_date'], '%B %d, %Y').date().isoformat(),
               revenue_low=row['revenue_low_usdm'], revenue_high=row['revenue_high_usdm'], revenue_actual=row['revenue_actual_usdm'],
               non_gaap_eps_low=row['eps_low'], non_gaap_eps_high=row['eps_high'], non_gaap_eps_actual=row['eps_actual'])
    row['fieldProvenance'] = {}
    for key in ['revenue_low_usdm', 'revenue_high_usdm', 'eps_low', 'eps_high', 'revenue_actual_usdm', 'eps_actual']:
        forecast = key.endswith(('_low_usdm', '_high_usdm', '_low', '_high'))
        row['fieldProvenance'][key] = {
            'source': row['guidance_source'] if forecast else row['actual_source'],
            'issuedDate': row['forecast_issued_date'] if forecast else row['actual_issued_date'],
            'locator': 'Outlook: next-quarter revenue / non-GAAP diluted EPS range' if forecast else 'Consolidated results table / non-GAAP diluted EPS',
            'basis': 'USD millions; original release-vintage revenue' if key.startswith('revenue') else 'USD/share; non-GAAP diluted EPS, release vintage',
            'value': row[key],
        }
    row['comparisonScope'] = 'Original immediately preceding release guidance, not consensus; interim revisions not exhaustively searched'
    row['qualityAdjustments'] = []
    if row['quarter'] == '2024Q3':
        row['qualityAdjustments'].append({'kind': 'management_adjusted', 'metric': 'non-GAAP EPS excluding tax-rate benefit',
            'reported': 1.57, 'adjusted': 1.41, 'benefit': .16, 'originalGuideHigh': 1.36,
            'source': 'https://s22.q4cdn.com/444849635/files/doc_earnings/2024/q3/transcript/Q3-FY2024-Prepared-Remarks.pdf',
            'limitation': 'Management adjustment, not an independent quality-of-earnings result'})
    if row['quarter'] == '2026Q2':
        row['qualityAdjustments'].append({'kind': 'management_adjusted', 'metric': 'Revenue / non-GAAP EPS excluding tariff/refund effects',
            'reportedRevenue': 1717, 'adjustedRevenue': 1758, 'reportedEPS': 2.87, 'adjustedEPS': 2.58,
            'originalRevenueGuideHigh': 1710, 'originalEPSGuideHigh': 2.33,
            'source': 'https://s22.q4cdn.com/444849635/files/doc_earnings/2026/q2/transcript/Q2-FY2026-Prepared-Remarks.pdf',
            'limitation': 'Management explicitly reports $1,758m; do not infer $1,757m from approximate $40m. Not independent normalization.'})
    row['sourceRow'] = copy.deepcopy(original)
    guidance.append(row)
write('guidance-comparisons-v1.json', guidance)

A = 'https://www.sec.gov/Archives/edgar/data/1601046/000160104625000127/keys-20251031.htm'
Q = 'https://www.sec.gov/Archives/edgar/data/1601046/000160104626000036/keys-20260731.htm'
OLD = 'https://www.sec.gov/Archives/edgar/data/1601046/000160104619000110/keys-10312019x10k.htm'
L = guidance[-1]['actual_source']
R = 'https://s22.q4cdn.com/444849635/files/content_files/Q3-FY2026-Prepared-Remarks.pdf'
latest_evidence = {
    'balanceDate': '2026-07-31', 'shareDate': '2026-08-27', 'informationCutoff': '2026-10-19',
    'units': 'USD millions and million common shares unless stated',
    'sourceUrl': Q, 'independentAuditPath': 'independent-audit-v2/independent-audit-v2.md',
    'observations': {
        'unrestrictedCash': {'value': 2605, 'locator': 'Condensed consolidated balance sheet, cash and cash equivalents'},
        'restrictedCashExcluded': {'value': 17, 'locator': 'Cash, cash equivalents and restricted cash reconciliation'},
        'debtCarryingValue': {'value': 2517, 'locator': 'Borrowings; current 700 plus long-term 1817'},
        'debtFacePrincipal': {'value': 2550, 'locator': 'Borrowings note; face principal schedule'},
        'retirementPostretirementReserve': {'value': 76, 'locator': 'Retirement and post-retirement liabilities'},
        'swapLiabilityReserve': {'value': 20, 'locator': 'Derivative instruments; fixed-to-floating swaps'},
        'longTermInvestmentsExcluded': {'value': 188, 'locator': 'Long-term investments'},
        'operatingLeaseCurrent': {'value': 53, 'locator': 'Operating lease liabilities, current'},
        'operatingLeaseNoncurrent': {'value': 176, 'locator': 'Operating lease liabilities, long term'},
        'exactCommonShares': {'value': 170.244745, 'unscaledShares': 170244745, 'date': '2026-08-27', 'locator': '10-Q cover, shares outstanding on August 27, 2026'},
        'nineMonthTaxProvision': {'value': 66, 'periodStart': '2025-11-01', 'periodEnd': '2026-07-31', 'locator': 'Nine-month statement of operations, provision for income taxes', 'basis': 'Accrual income-tax provision, not cash paid'},
        'nineMonthCashIncomeTaxPaidNet': {'value': 127, 'periodStart': '2025-11-01', 'periodEnd': '2026-07-31', 'locator': 'Supplemental cash-flow disclosures, cash paid for income taxes net', 'basis': 'Cash income-tax payment, not accrual tax provision'},
    },
    'minimumOperatingCash': {'value': 526.56, 'basis': 'Analyst assumption: 8% of reconstructed TTM revenue 6582; not a reported liability'},
    'capitalBridge': -567.56,
    'capitalBridgeConvention': '2605 − 2550 − 76 − 20 − 526.56. Leases remain operating expense; excluded investments and restricted cash receive no bridge value.',
}
write('latest-capital-evidence-v1.json', latest_evidence)

# Every UI synopsis is bilingual. The complete original research and admission
# audit are retained as distinct source documents with their original vintages.
pairs = {
    'summary': ('Conditional bear/base/bull values are $37.33/$129.14/$251.28 per common share, at the July 31, 2026 capital anchor using August 27 shares and information through October 19. No probabilities, expected value, current quote, upside, expected return or recommendation are supplied.',
                '条件熊／基准／牛情景为每普通股 37.33／129.14／251.28 美元，以 2026 年七月三十一日资本为起点、八月二十七日股数为分母、信息截至十月十九日。未赋予概率、期望值、当前股价、上涨空间、预期收益或投资建议。'),
    'scope': ('July 31, 2026 is the capital and discount origin; exact shares are August 27, a real 27-day mismatch; information cutoff is October 19. Ten rolling annual periods end July 2027–2036, not October fiscal years. This is a dated conditional operating-value study, not a current price target or historical backtest. Entering a quote cannot refresh the capital bridge or clear the current-target gate.',
              '资本及折现起点为 2026 年七月三十一日，精确股数日期为八月二十七日，相差 27 天；信息截止十月十九日。十个滚动年度截至 2027–2036 年七月底，并非十月财年。此为指定日期条件经营价值研究，不是当前目标价或历史回测。输入股价不能刷新资本桥接，也不能开放当前目标价资格。'),
    'business': ('Keysight sells electronic design, emulation, validation, manufacturing-test instruments, software and services. CSG serves communications and aerospace/defense/government; EISG serves semiconductor, general electronics, automotive and energy. AI networks are a demand driver, not a separately audited pure-AI revenue stream. Customer R&D budgets, manufacturing capacity, technology transitions and defense programs all matter.',
                 '是德科技提供电子设计、仿真、验证、制造测试仪器、软件及服务。CSG 面向通信与航空航天／国防／政府；EISG 面向半导体、通用电子、汽车及能源。AI 网络是需求驱动因素，不是单独审计的纯 AI 收入业务。客户研发预算、制造产能、技术迭代和国防项目均重要。'),
    'segmentBridge': ('TTM revenue ending July 2026 is $6,582m: CSG $4,690m = FY2025 $3,726m + 9M2026 $3,700m − 9M2025 $2,736m; EISG $1,892m = $1,649m + $1,463m − $1,220m. Acquisition contributions and favorable mix limit extrapolation. The two segments have separately fading growth paths.',
                      '截至 2026 年七月的滚动十二个月收入为 6,582 百万美元：CSG 4,690＝2025 财年 3,726＋2026 前九个月 3,700−2025 前九个月 2,736；EISG 1,892＝1,649＋1,463−1,220。收购贡献和有利组合限制直接外推；模型分别递减两分部增长率。'),
    'recentQuarter': ('Q3 FY2026 revenue was $1,846m and GAAP EBIT $461m, a 24.97% margin; TTM GAAP EBIT was $1,333m and margin 20.25%. Management reported $2,091m orders, 52% core order growth and 31% core revenue growth. Wireline orders more than doubled and wireline revenue first exceeded wireless. These are issuer explanations, not independent customer-spend or backlog-conversion verification.',
                      '2026 财年第三季收入 1,846 百万美元，GAAP 营业利润 461、利润率 24.97%；滚动十二个月 GAAP 营业利润 1,333、利润率 20.25%。管理层报告订单 2,091、核心订单增长 52%、核心收入增长 31%；有线订单翻倍以上，有线收入首次高于无线。这些是公司解释，并非独立核实客户支出或积压订单转化。'),
    'history': ('All ten FY2016–2025 reported/recast annual slots and 221 non-null field-source observations are retained. They are not a homogeneous organic series: Ixia and later acquisitions change perimeter; ASC606 starts FY2019; pension presentation recasts FY2017–18. FY2016 is not retroactively homogenized. Missing exact year-end common shares and old lease/debt fields remain null; weighted EPS shares do not fill them.',
                '保留 2016–2025 全部十个已报告／重列年度及 221 个非空字段来源。它们不是同质有机增长序列：Ixia 及后续收购改变范围，ASC606 自 2019 财年开始，养老金呈报重列 2017–2018。2016 未追溯统一。缺失的精确年末普通股及较早租赁／债务字段保持空值，不以 EPS 加权平均股数填补。'),
    'accounting': ('ASC606 adoption on November 1, 2018 used modified retrospective treatment; FY2017–18 comparatives remain on prior revenue guidance. Later comparative EBIT is $148m/−$394m versus original $239m/−$346m after moving pension non-service components out of operating income. FY2018 includes $709m goodwill impairment and substantial tax effects; it is not a steady-state margin proxy.',
                   '2018 年十一月一日采用 ASC606 时使用修正追溯法，2017–2018 比较收入仍按旧准则。养老金非服务项目移出营业利润后，后期比较营业利润为 148／负 394 百万美元，原值 239／负 346。2018 含 709 百万美元商誉减值及重大税务影响，不宜作为稳态利润率。'),
    'vintages': ('FY2025 audited annual net income/EPS are $850m/$4.91 versus preliminary release $846m/$4.89. Both detailed revenue statements say $5,375m; the $5.37bn headline is rounded, not a $1m revision. The audit confirms the numerical difference, not its cause. Audited annual history and original release-vintage quarterly scorecards remain separate.',
                 '2025 审计年度净利润／每股收益为 850 百万美元／4.91 美元，初步新闻稿为 846／4.89。两份详细收入表均为 5,375 百万美元，标题 53.7 亿只是舍入，并非修订 1 百万美元。复核确认数值差异，未确认原因。审计年度历史与初始发布口径季度评分分开保存。'),
    'cashConversion': ('CFO less gross PPE capex was $1,211m/$898m/$1,281m in FY2023/24/25. It is a descriptive levered cash-flow measure, not owner FCFF; CFO contains interest, tax, working capital and SBC addback. Issuer-reported FCF also counts government incentives. Depreciation and acquisition amortization are separate; acquisition cash amounts can be recast in later comparisons.',
                       '2023／2024／2025 经营现金流减总 PPE 开支为 1,211／898／1,281 百万美元。这是描述性有杠杆现金流，不是股东无杠杆 FCFF；经营现金流含利息、税、营运资本及股权薪酬加回。公司报告自由现金流还包括政府激励。折旧与收购摊销分列，收购现金额可能在后期比较中重列。'),
    'guidance': ('All eleven Q1 FY2024–Q3 FY2026 pairs preserve original preceding-release revenue and non-GAAP diluted EPS ranges, subsequent release actuals, distinct publication dates, public links and six-field provenance. Both actuals exceed their original upper bounds in every pair. This is not consensus outperformance, proof of no interim revisions or a calibrated management premium. Short-term execution and conservative range-setting cannot establish decade-long forecast precision.',
                 '全部十一组 2024 第一季至 2026 第三季记录保留前一新闻稿原始收入及非 GAAP 稀释 EPS 区间、后续发布实际值、分别发布日期、公开链接及六字段来源。每组两项实际值均超过原始上限。这不是超越共识、证明没有期中修订，或经校准的管理层溢价。短期执行与保守区间不能证明十年预测精度。'),
    'guidanceQuality': ('Q3 FY2024 $1.57 EPS includes a $0.16 tax benefit; management’s $1.41 excluding it still beats $1.36. Q2 FY2026 reported $1,717m/$2.87 becomes management-adjusted $1,758m/$2.58 excluding tariff/refund effects, still above $1,710m/$2.33. Use explicit $1,758m, not $1,757m inferred from an approximate $40m. These are issuer adjustments, not an independent quality-of-earnings conclusion.',
                        '2024 第三季 EPS 1.57 含 0.16 税收利益；管理层剔除后 1.41 仍高于 1.36。2026 第二季报告收入／EPS 1,717 百万美元／2.87，管理层剔除关税及退款后为 1,758／2.58，仍高于 1,710／2.33。采用明确披露的 1,758，不从约 40 百万美元推算 1,757。这些是公司调整，不是独立盈利质量结论。'),
    'outlook': ('At cutoff, August 18 Q4 FY2026 guidance remains prospective: revenue $1,930–1,950m, non-GAAP EPS $3.34–3.40, approximately 172m weighted diluted shares. Management’s midpoint implies about 32% FY2026 sales and 60% EPS growth, with 80–90% of $100m synergies at fiscal-year exit run rate. Initial FY2026 ex-acquisition growth of at least 7% and later total growth above 20%, high-20s and 32% have different scopes. Do not score July 2027 rolling revenue against October 2026 fiscal guidance.',
                '截止时，八月十八日发布的 2026 第四季指引仍待实现：收入 1,930–1,950 百万美元，非 GAAP EPS 3.34–3.40，约 172 百万加权稀释股数。管理层中点意味 2026 全年收入约增 32%、EPS 增 60%，年末协同年化运行率达 100 百万美元目标的 80–90%。最初不含收购增长至少 7%，与后来总增长超过 20%、高于 20% 区间和 32% 的范围不同。不将 2027 七月滚动收入对比 2026 十月财年指引评分。'),
    'acquisitions': ('Spirent closed October 15, 2025 for $1,564m consideration, with $399m divestiture proceeds; Synopsys Optical Solutions Group and PowerArtist also expand scope. Nine-month FY2026 Spirent integration/acquisition cost was $75m. Already-paid consideration is reflected in opening capital and is not charged again. A future 1%-of-sales acquisition/intangible-renewal allowance is an estimate, not historical purchase price or funding for an unannounced major deal.',
                     'Spirent 于 2025 年十月十五日完成收购，对价 1,564 百万美元，剥离收入 399；Synopsys 光学解决方案及 PowerArtist 也扩大范围。2026 前九个月 Spirent 收购／整合成本 75。已支付对价已反映在期初资本，不再扣一次。未来收入 1% 的收购／无形资产更新预留是估计，不是历史购买价，也不为未公布大额交易提供资金。'),
    'profitability': ('Economic margins retain R&D, SBC as cash-equivalent replacement compensation and acquired amortization without a separate addback. Bear margins start 16%, trough 15%, and reach 20%; base starts 25% and reaches 27%; bull starts 27% and reaches 30%. Base exceeds TTM GAAP 20.25% and needs durable gains from the latest quarter’s 24.97%; bull is especially demanding. Management adjusted segment margins are not interchangeable with this economic EBIT.',
                      '经济利润率保留研发、现金等价替代薪酬形式的股权薪酬，以及不单独加回的收购摊销。熊情景从 16% 起、低谷 15%、最终 20%；基准从 25% 至 27%；牛从 27% 至 30%。基准高于滚动 GAAP 20.25%，需在最新季 24.97% 基础上保持改善；牛情景尤其苛刻。管理层调整后分部利润率不能替代此经济营业利润。'),
    'growth': ('CSG and EISG are separately projected. Bear begins −12%/−10%, then −4%/−2%, recovering toward 2%; base begins 18%/8%, then 12%/7%, fading to 3%; bull begins 25%/12%, then 18%/10%, fading to 3.5%. These are analyst scenarios. Acquisition annualization, product mix and customer spending cycles prevent indefinite extension of current growth; no scenario probabilities are estimated.',
               'CSG 与 EISG 分开预测。熊情景首年负 12%／负 10%，次年负 4%／负 2%，后恢复至 2%；基准首年 18%／8%，次年 12%／7%，递减至 3%；牛首年 25%／12%，次年 18%／10%，递减至 3.5%。这些是分析情景。收购并表满周年、产品组合及客户支出周期限制当前增长长期外推；没有估计情景概率。'),
    'capital': ('Each year gross physical capex is 3.5% of sales, depreciation 2%, acquisition/intangible renewal 1%, marginal NWC 18% of revenue change and operating cash 8% of sales. R&D remains expensed. Reinvestment is the greater of these operating needs and the phased sustainable-ROIC requirement; net investment is not gross capex. These are modeling conventions, not independently established maintenance-capital needs.',
                '每年实物总资本开支为收入 3.5%、折旧 2%、收购／无形更新 1%，边际营运资本为收入变化 18%，经营现金为收入 8%。研发仍费用化。再投资取这些经营需求与分阶段可持续 ROIC 要求中的较大者；净投资不等于总资本开支。这些是模型约定，不是独立确定的维持性资本需求。'),
    'claims': ('July cash $2,605m − face debt $2,550m − retirement/post-retirement reserve $76m − swap reserve $20m − minimum operating cash $526.56m gives a −$567.56m bridge. Debt carrying value is $2,517m. Restricted cash $17m and long-term investments $188m receive zero bridge value. Operating leases $53m current/$176m noncurrent are not financing debt while rent remains in operating margins; deducting both would double count.',
               '七月现金 2,605−债务面值 2,550−退休／退休后负债预留 76−掉期预留 20−最低经营现金 526.56＝桥接负 567.56 百万美元。债务账面额为 2,517。受限现金 17 及长期投资 188 不计入桥接。经营租赁流动 53／非流动 176 在租金保留为费用时不再作为融资债务扣除，否则重复计算。'),
    'awards': ('Exact August 27 common shares are 170,244,745, or 170.244745m, 27 days after the balance anchor. No ADR or alternate-class conversion applies. Nine-month diluted EPS average 173m and Q4 guidance diluted 172m are not point-in-time common shares. Existing awards are not valued grant by grant; retained SBC and the separate 3% share stress are a convention and diagnostic, not exact settlement or a maximum dilution bound.',
               '八月二十七日普通股精确为 170,244,745 股，即 170.244745 百万，比资本起点晚 27 天。没有 ADR 或其他类别换算。九个月稀释 EPS 平均 173 百万和第四季指引稀释 172 百万均不是时点普通股。现有奖励未逐笔估值；保留股权薪酬与另行 3% 股数压力是约定和诊断，不是精确结算或最大稀释上界。'),
    'financing': ('Scheduled principal is $700m April 2027, $500m October 2029, $750m July 2030 and $600m October 2034. Principal reduces treasury when paid and equity once at inception, not FCFF. Full coupons in maturity years are conservative timing simplifications. The $600m fixed-to-floating swap makes 4.95% approximate. A +200bp coupon shock leaves operating EV unchanged but reduces base minimum headroom to $2,211.1401m; WACC risk is separate.',
                  '本金到期为 2027 四月 700、2029 十月 500、2030 七月 750、2034 十月 600 百万美元。还本在支付时减少资金，并仅在期初股权桥接扣一次，不扣 FCFF。到期年计整年票息是保守时点简化。600 百万美元固定转浮动掉期使 4.95% 仅近似。票息加 200 基点不变经营 EV，但基准最低现金余量降至 2,211.1401；WACC 风险另行分析。'),
    'funding': ('Annual cash starts after pension/swap reserves, retains cash, pays debt service and tests an 8%-of-sales floor. Shortfalls borrow up to a hypothetical $750m then issue equity at hypothetical $100/share with 5% fees. Neither is guaranteed funding. Emergency-debt repayment/refinancing and the revolver’s April 21, 2031 expiry are unmodeled; intra-year troughs and detailed covenants are absent. Any external funding suppresses headline common value. Funded dilution diagnostics are never fair value; the module is a funding-need detector.',
                '年度资金从扣除养老金／掉期预留后起算，保留现金、偿债并检查收入 8% 的现金底线。缺口先借假设最多 750 百万美元，再按假设每股 100 美元及 5% 费用发股，两者都不是保证融资。未建模紧急债务偿还／再融资及循环信贷 2031 年四月二十一日到期；缺少年内低谷与详细契约。任何外部融资均关闭主要普通股估值。融资稀释诊断绝不等于公允价值，此模块仅检测融资需求。'),
    'tax': ('Nine-month July 2026 income-tax provision is $66m; net cash income taxes paid are $127m from supplemental cash-flow disclosure. They are different measures and neither is the modeled tax rate. The model charges 22% on positive economic EBIT, with no immediate tax benefit for losses and no perpetuation of refunds, investment gains or temporary tariffs.',
            '截至 2026 七月九个月所得税费用为 66 百万美元；现金流补充披露的所得税现金净支付为 127。两者不同，均不等于模型税率。模型对正经济营业利润征 22%，亏损不即时确认税收利益，也不将退款、投资收益或临时关税效果永久化。'),
    'wacc': ('Bear/base/bull WACC is 12%/10%/8.5%, terminal growth 2%/3%/3.5% and terminal incremental ROIC 12%/18%/22%. These are analyst judgments, not fitted live market rates or probabilities. WACC and ROIC must both exceed growth; finite, domain and convergence tests apply. Current stock prices never calibrate the cases.',
             '熊／基准／牛 WACC 为 12%／10%／8.5%，终值增长 2%／3%／3.5%，终值增量 ROIC 12%／18%／22%。它们是分析判断，不是拟合当前市场利率或概率。WACC 和 ROIC 均须高于增长率，并通过有限值、取值域和收敛检验。情景不由当前股价反推。'),
    'terminal': ('Terminal reinvestment is max(NOPAT × growth / ROIC, physical net investment + acquisition renewal + incremental NWC + incremental operating cash). Both floors must hold; growth in both segments converges. Positive terminal earnings and distributable FCFF are required. Bear’s operating floor can exceed its ROIC floor, so never force investment down to a pure ROIC formula. Terminal cash flows are 41.88%/55.04%/66.78% of bear/base/bull EV.',
                 '终值再投资取「NOPAT×增长／ROIC」与「实物净投资＋收购更新＋增量营运资本＋增量经营现金」较大者，两道底线均需满足，两分部增长需收敛。终值利润及可分配 FCFF 须为正。熊情景经营底线可高于 ROIC 底线，不能强行把投资压至单纯 ROIC 公式。终值现金流占熊／基准／牛 EV 的 41.88%／55.04%／66.78%。'),
    'uncertainty': ('The three cases are assumptions, not a probability distribution or confidence interval; base is not expected value. Margin judgments dominate. The source contains 20 WACC/g cells, four margin shocks, a 3% share diagnostic, a floating-coupon shock and two complete funding stresses. Invalid and funded headline outputs remain unavailable. Simulations require manual initiation and cannot turn conditional parameters into estimated returns.',
                    '三个情景是条件假设，不是概率分布或置信区间；基准不等于期望值。利润率判断影响最大。来源含 20 个 WACC／增长格点、四个利润率冲击、3% 股数诊断、浮动票息冲击及两组完整融资压力。无效及需融资主要输出保持不可用。模拟需手动启动，不能把条件参数变成预计收益。'),
    'claimLimits': ('Existing award claims lack grant-level valuation; annual liquidity lacks intra-year detail; operating and acquisition investment requirements are estimates. Restricted cash and long-term investments stay fixed at zero inclusion. The source accepts some metadata that is not economically implemented; arbitrary new semantic inputs are not admitted. A current target needs separately reviewed current capital, exact shares, claims/awards, material events and financing/stub assumptions.',
                    '现有奖励缺少逐笔估值，年度流动性缺少年内细节，经营及收购投资需求为估计。受限现金和长期投资纳入值固定为零。来源会接受某些未在经济计算中实现的元数据，不因此允许任意新增语义输入。当前目标价需要另行复核当期资本、精确股数、请求权／奖励、重大事件及融资／期间现金流假设。'),
    'audit': ('Independent audit v2 admits the original v1 study PASS WITH LIMITATIONS. It verified hashes/bytes for 113 files; independently recomputed all 30 forecast rows, scalars and sensitivities; checked 23 invalid inputs; reconciled 221 non-null facts; and parsed original release HTML to verify all 11 pairs. It re-opened key official filings and the Q3 release. This evidence audit is not financial-statement assurance, current-target approval, physical-capital validation or adapter/deployment certification.',
              '独立复核 v2 对原 v1 研究结论为「有保留限制通过」：核对 113 文件哈希／字节，独立重算全部 30 预测行、标量及敏感性，检查 23 个无效输入，对账 221 个非空事实，并解析原新闻稿 HTML 核验十一组记录；还重开关键官方申报及第三季稿。此证据复核不是财务报表审计保证、当前目标价许可、实物资本验证或适配器／部署认证。'),
    'sourceLimits': ('The bounded official-site search found no later earnings outlook, but does not prove no interim update or material event. There was no exhaustive interim-release, call-Q&A, independent interview, customer or competitor cross-check. Prepared remarks are management-controlled statements. Historical source tracing does not re-audit every annual disclosure. Public Robinhood support is not account/jurisdiction eligibility. Corporate originals remain linked; only curated derived research is packaged.',
                     '有限官方站点搜索未找到更晚业绩展望，但不能证明没有期中更新或重大事件。未穷尽期中稿、电话会问答、独立访谈、客户或竞争者交叉核实；预备发言为管理层控制内容。历史来源追溯不等于重审每项年报披露。Robinhood 公开支持不等于特定账户／地区资格。公司原件仅提供链接，打包只含精选派生研究。'),
    'publicationGates': ('Monitor organic CSG order conversion after acquisitions annualize, AI network/test demand durability, export controls and tariffs, R&D intensity, integration costs, working capital/deferred revenue, acquisitions/buybacks and shares versus SBC. Current target, upside, expected return, recommendation and ranking stay unavailable even if a quote is entered. Only an independently reviewed refreshed bridge, award treatment, events and financing assumptions can reopen consideration.',
                         '观察收购并表满周年后的 CSG 有机订单转化、AI 网络／测试需求持续性、出口管制与关税、研发强度、整合成本、营运资本／递延收入、收购／回购及股数相对薪酬。即使输入股价，当前目标、上涨空间、预期收益、投资建议及排名均不可用。只有经独立复核的最新桥接、奖励处理、事件及融资假设才能重新考虑。'),
}
prose = {key: {'en': values[0], 'zh-Hans': values[1]} for key, values in pairs.items()}

identity = {
    'packageVersion': OUT.name, 'version': '2026-10-19-keys-conditional-v1',
    'ticker': 'KEYS', 'currency': 'USD', 'informationAsOf': '2026-10-19',
    'informationCutoff': '2026-10-19', 'discountOrigin': '2026-07-31',
    'reportedBalanceDate': '2026-07-31', 'shareDate': '2026-08-27',
    'valuationLabel': 'July 31 capital anchor; August 27 exact shares; October 19 information; dated conditional operating-value study',
    'currentValuationEligible': False, 'currentPriceTargetEligible': False,
    'historicalBacktestEligible': False, 'rankingEligible': False,
    'upsideEligible': False, 'expectedReturnEligible': False, 'recommendationEligible': False,
}
for key, name in [('source', 'dcf-inputs-v1.json'), ('history', 'history-normalized-v1.json'),
                  ('audit', 'independent-audit-v2/checks.json'), ('fullReport', 'STUDY-v1.md'),
                  ('auditReport', 'independent-audit-v2/independent-audit-v2.md')]:
    identity[key + 'Path'], identity[key + 'SHA256'] = BASE + name, sha(OUT / name)
identity.update({
    'packagedSourceSHA256': identity['sourceSHA256'], 'originalSourceSHA256': sha(SRC / 'dcf-inputs-v1.json'),
    'packagedHistorySHA256': identity['historySHA256'], 'historyCSVPath': BASE + 'history-v1.csv',
    'reportPath': BASE + 'KEYS-v1.html', 'guidancePath': BASE + 'guidance-comparisons-v1.json',
    'provenancePath': BASE + 'history-field-provenance-v1.json', 'sourceLedgerPath': BASE + 'source-ledger-v1.json',
    'conditionalOutputsPath': BASE + 'conditional-outputs-v1.json',
    'packagingManifestPath': BASE + 'packaging-manifest-v1.json',
})

specs = [
    ('minimumOperatingCash', 'Minimum operating cash reserve', '最低经营现金预留', 526.56, 0, 1e8, 'USDm', 1),
    ('pensionReserve', 'Retirement and post-retirement reserve', '退休及退休后负债预留', 76, 0, 1e8, 'USDm', 1),
    ('otherClaimReserve', 'Swap and other claim reserve', '掉期及其他请求权预留', 20, 0, 1e8, 'USDm', 1),
    ('cashFloorRatio', 'Annual operating cash floor / revenue', 'KEYS 年度经营现金底线／收入', .08, 0, .95, '%', 100),
    ('emergencyDebtCapacity', 'Hypothetical emergency debt capacity', '假设紧急债务容量', 750, 0, 1e7, 'USDm', 1),
    ('emergencyInterest', 'Hypothetical emergency debt interest', '假设紧急债务利率', .08, 0, .5, '%', 100),
    ('equityIssuePrice', 'Hypothetical emergency equity issue price', '假设紧急股权发行价', 100, .001, 1e6, 'USD', 1),
    ('equityFee', 'Hypothetical equity issuance fee', '假设股权发行费用', .05, 0, .95, '%', 100),
]
options = [{'key': key, 'label': en, 'labelZh': zh, 'type': 'number', 'default': value,
            'min': low, 'max': high, 'unit': unit, 'scale': scale, 'allowUnknown': True,
            'classification': 'Analyst scenario assumption; financing capacity and issue terms are not commitments'}
           for key, en, zh, value, low, high, unit, scale in specs]


def defaults(name):
    return {spec[0]: spec[3] for spec in specs}


def case(name):
    scenario, output = inputs['cases'][name], outputs[name]
    annual = [{'year': row['year'], 'period': f'12M Jul {row["period_end"][:4]}',
               'periodEnd': row['period_end'], 'fiscalEnd': row['period_end'],
               'periodBasis': 'Rolling twelve months; not Keysight October fiscal year',
               'revenue': row['revenue'], 'operatingMargin': scenario['margin'][i],
               'taxRate': scenario['tax'], 'reinvestment': row['reinvestment'],
               'wacc': scenario['wacc'], 'sourceRow': copy.deepcopy(row)}
              for i, row in enumerate(output['rows'])]
    return {
        'ticker': 'KEYS', 'company': 'Keysight Technologies, Inc.', 'currency': 'USD',
        'scenario': 'base', 'sourceScenario': name, 'ratioUnit': 'decimal', 'forecastHorizonYears': 10,
        'incrementalResearch': identity, 'valuationTiming': {'discountOrigin': '2026-07-31'},
        'anchor': {'period': 'TTM July 2026', 'periodZh': '截至 2026 年七月的滚动十二个月', 'fiscalEnd': '2026-07-31',
                   'kind': 'reported_TTM_reconstruction', 'classification': identity['valuationLabel'] + '; forecast periods are rolling July 31 years, not October fiscal years',
                   'classificationZh': '七月三十一日资本起点；八月二十七日精确股数；十月十九日信息；指定日期条件经营价值研究；预测为截至七月三十一日的滚动年度，并非十月财年',
                   'fiscalCalendarCaution': 'Rolling July 31 years, not October fiscal-year forecasts; do not compare directly with management fiscal guidance',
                   'fiscalCalendarCautionZh': '截至七月三十一日的滚动年度，不是十月财年预测；不直接与管理层财年指引比较',
                   'revenue': 6582, 'EBIT': 1333, 'firstModeledPeriod': '12M Jul 2027',
                   'firstModeledPeriodStart': '2026-08-01', 'firstModeledFiscalEnd': '2027-07-31'},
        'annual': annual,
        'terminal': {'growth': scenario['g'], 'operatingMargin': scenario['margin'][-1],
                     'taxRate': scenario['tax'], 'ROIC': scenario['terminal_roic'], 'wacc': scenario['wacc']},
        'bridgeOptions': defaults(name),
        'boundedModelGaps': [pairs[key][0] for key in ['scope', 'history', 'profitability', 'capital', 'awards', 'funding', 'terminal', 'claimLimits', 'sourceLimits']],
    }


bridge = {
    'type': 'keys-v1', 'ticker': 'KEYS', 'currency': 'USD', 'referenceDate': '2026-07-31',
    'reportedBalanceDate': '2026-07-31', 'shareDate': '2026-08-27', 'informationAsOf': '2026-10-19',
    'sourceUrl': Q, 'shares': 170.244745, 'ordinaryShares': 170.244745,
    'cash': 2605, 'reportedCash': 2605, 'reportedShares': 170.244745, 'reportedSharesDate': '2026-08-27',
    'debtFace': 2550, 'debtCarrying': 2517, 'restrictedCashExcluded': 17,
    'longTermInvestmentsExcluded': 188, 'operatingLeaseCurrent': 53, 'operatingLeaseNoncurrent': 176,
    'shareBasis': 'Exact 170,244,745 August 27 common shares; 27 days after July 31 capital. Not diluted EPS weighted-average shares; no ADR conversion. SBC remains expensed; awards not grant-level valued.',
    'balanceClassification': identity['valuationLabel'], 'options': options,
    'defaultOptionsByScenario': {name: defaults(name) for name in inputs['cases']},
    'fixedClaims': [{'id': 'debtFace', 'label': 'Debt face principal', 'amount': 2550}],
    'debtSchedule': copy.deepcopy(inputs['debt_schedule']),
    'notes': [pairs[key][0] for key in ['claims', 'awards', 'financing', 'capital']],
    'unresolved': [pairs[key][0] for key in ['scope', 'funding', 'claimLimits', 'sourceLimits']],
    'classification': identity['valuationLabel'],
    'claimCompleteness': 'conditional-economic-compensation-and-reserves-not-grant-level-allocation',
    'allocationMethod': 'conditional-equity-over-exact-August-common-shares',
    'currentQuote': None, 'currentPriceTargetEligible': False, 'unconditionalEquityValueEligible': False,
    'currentValuationEligible': False, 'historicalBacktestEligible': False, 'rankingEligible': False,
    'upsideEligible': False, 'expectedReturnEligible': False, 'recommendationEligible': False,
    'fundingMode': 'withhold_headline_value_if_external_funding_required',
    'nullPolicy': 'Invalid inputs clear values. Any external funding suppresses headline common value; dilution diagnostic is never fully financed fair value.',
}

sources, seen = [], set()
for group in [read(SRC / 'filing-sources.json'), read(SRC / 'source-ledger-v1.json')['bulk_sec'],
              read(SRC / 'guidance/source_manifest.json'), read(SRC / 'guidance/remarks_manifest.json')]:
    for original in group:
        if original['url'] in seen:
            continue
        seen.add(original['url'])
        source = copy.deepcopy(original)
        source['id'] = source.get('file') or source.get('quarter') or source['url']
        source['retrieved'] = '2026-10-19'
        source['publication_date'] = source.get('filed', '')
        source['evidence'] = 'Primary public source in reviewed research; original linked, not redistributed'
        rel = source.get('file') or (source['quarter'] + '-release.html' if source.get('quarter') else None)
        path = SRC / rel if rel and (SRC / rel).is_file() else SRC / 'guidance' / rel if rel else None
        if path and path.is_file():
            source['sha256'] = sha(path)
        sources.append(source)
eligibility = read(SRC / 'eligibility-v1.json')
sources.append({'id': 'Robinhood public KEYS support', 'url': eligibility['sources'][0], 'retrieved': '2026-10-19',
                'evidence': eligibility['robinhood_observed_support']})
write('source-links-v1.json', sources)
catalog = read(ROOT / 'dist/data/atlas-company-catalog-v1.json')
listing = next(item for item in catalog['companies'] if item['ticker'] == 'KEYS')
record = {
    'identity': identity,
    'publicTradability': {key: listing[key] for key in ['ticker', 'nativeTicker', 'mic', 'exchange', 'securityType', 'verified', 'checkedAt', 'sourceURLs', 'evidence', 'robinhood']},
    'annualCase': case('base'),
    'alternatives': [{'name': name, 'label': en, 'labelZh': zh, 'buttonLabel': 'Load ' + en,
                      'buttonLabelZh': '载入' + zh, 'classification': 'Conditional analyst scenario; no assigned probability',
                      'annualCase': case(name), 'bridgeOptions': defaults(name)}
                     for name, en, zh in [('bear', 'Bear', '熊情景'), ('bull', 'Bull', '牛情景')]],
    'bridge': bridge, 'sourceInputs': copy.deepcopy(inputs), 'sourceOutputs': copy.deepcopy(outputs),
    'history': history, 'historyFieldProvenance': copy.deepcopy(provenance),
    'latestQuarter': read(SRC / 'latest-quarter-v1.json'), 'latestCapitalEvidence': latest_evidence,
    'prose': prose, 'sources': sources,
    'guidanceComparisons': guidance,
    'evidence': {'conditionalOutputsPath': identity['conditionalOutputsPath'], 'conditionalOutputs': copy.deepcopy(outputs),
                 'sourceProvenancePath': identity['provenancePath'], 'correctedGuidancePath': identity['guidancePath'],
                 'classification': identity['valuationLabel'], 'currentValuationEligible': False,
                 'currentPriceTargetEligible': False, 'historicalBacktestEligible': False, 'rankingEligible': False,
                 'upsideEligible': False, 'expectedReturnEligible': False, 'recommendationEligible': False},
    'auditResults': {**audit, 'finalDisposition': 'PASS WITH LIMITATIONS for dated conditional operating-value study; adapter and deployment not certified',
                     'guidancePairsIndependentlyVerified': 11, 'sourceManifestFiles': 113, 'sourceAuthorChecks': 17},
    'readiness': 'reviewed-dated-conditional-operating-study',
}
bundle = {'schemaVersion': 1, 'version': OUT.name, 'asOf': '2026-10-19', 'companies': [record]}
write('cases.json', bundle)
(ROOT / 'dist/keys-research-registry.js').write_text(
    '// Generated KEYS dated conditional research. No raw corporate documents.\nconst bundle=' +
    json.dumps(bundle, ensure_ascii=False, indent=2, allow_nan=False) +
    ";\nfunction freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}\nexport const keysRegistry=freeze(bundle);\n")

titles = {
    'summary': ('Conditional results', '条件结果'), 'scope': ('Three dates and eligibility', '三个日期及使用资格'),
    'business': ('Business and durable drivers', '业务与持续驱动'), 'segmentBridge': ('TTM segment reconstruction', '滚动分部重建'),
    'recentQuarter': ('Latest reported quarter', '最新已发布季度'), 'history': ('Ten annual observations', '十个年度观察'),
    'accounting': ('Accounting and perimeter breaks', '会计与业务范围断点'), 'vintages': ('Release versus audited vintages', '初步发布与审计口径'),
    'cashConversion': ('Cash-flow definitions', '现金流定义'), 'guidance': ('All eleven guidance pairs', '全部十一组指引'),
    'guidanceQuality': ('Quality of reported beats', '超指引结果的质量'), 'outlook': ('Prospective FY2026 outlook', '待实现的 2026 展望'),
    'acquisitions': ('Acquisition discipline', '收购纪律'), 'profitability': ('Economic profitability', '经济盈利能力'),
    'growth': ('Two segment growth paths', '两分部增长路径'), 'capital': ('Investment and working capital', '投资及营运资本'),
    'claims': ('Capital and claims bridge', '资本与请求权桥接'), 'awards': ('Exact shares and award limits', '精确股数及奖励限制'),
    'financing': ('Debt and coupon mechanics', '债务及票息机制'), 'funding': ('Funding detector and suppression', '融资检测及估值抑制'),
    'tax': ('Tax provision versus cash tax', '税费与现金税差异'), 'wacc': ('Discount rates and returns', '折现率及回报'),
    'terminal': ('Two terminal investment floors', '两道终值投资底线'), 'uncertainty': ('Scenario uncertainty', '情景不确定性'),
    'claimLimits': ('Unresolved claim and semantic limits', '未解决请求权及语义限制'),
    'audit': ('Independent admission audit v2', '独立准入复核 v2'), 'sourceLimits': ('Evidence limits', '证据限制'),
    'publicationGates': ('What requires fresh review', '需要重新复核的事项'),
}
links = {key: ['STUDY-v1.md', 'dcf-inputs-v1.json'] for key in pairs}
for key in ['business', 'segmentBridge', 'recentQuarter', 'profitability', 'acquisitions', 'cashConversion', 'claims', 'awards', 'financing', 'tax']:
    links[key] = [A, Q]
for key in ['growth', 'capital', 'funding', 'wacc', 'terminal', 'uncertainty', 'claimLimits']:
    links[key] = ['dcf-inputs-v1.json', 'conditional-outputs-v1.json', 'sensitivities-v1.json', 'independent-audit-v2/independent-audit-v2.md']
links['summary'] = ['conditional-outputs-v1.json', 'independent-audit-v2/checks.json']
links['history'] = ['history-normalized-v1.json', 'history-field-provenance-v1.json', OLD]
links['accounting'] = [OLD, 'https://www.sec.gov/Archives/edgar/data/1601046/000160104618000030/keys-10312018x10k.htm']
links['vintages'] = [A, guidance[-4]['actual_source']]
links['guidance'] = ['guidance-comparisons-v1.json', 'guidance/guidance_vs_actual.csv', 'independent-audit-v2/guidance-checks.json']
links['guidanceQuality'] = [adjustment['source'] for row in guidance for adjustment in row['qualityAdjustments']]
links['outlook'] = [L, R, 'guidance/management_guidance_assessment.md']
links['recentQuarter'] += [L, R]
links['claims'].append('latest-capital-evidence-v1.json')
links['tax'].append('latest-capital-evidence-v1.json')
links['audit'] = ['independent-audit-v2/independent-audit-v2.md', 'independent-audit-v2/checks.json', 'independent-audit-v2/independent-recomputed-model.json']
links['sourceLimits'] = ['source-ledger-v1.json', 'guidance/management_guidance_assessment.md', 'independent-audit-v2/independent-audit-v2.md']
links['publicationGates'] = ['independent-audit-v2/independent-audit-v2.md', 'STUDY-v1.md']

esc = html.escape
parts = ['''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KEYS conditional operating study · 2026-10-19</title><style>body{font:16px/1.65 system-ui;max-width:1160px;margin:auto;padding:24px;color:#18232b}h1,h2{line-height:1.25}section{margin:28px 0}a{color:#065ca9}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:right;border-bottom:1px solid #dce2e7;padding:8px;vertical-align:top}th:first-child,td:first-child{text-align:left}.scroll{overflow:auto}.caution{padding:16px;background:#fff7db}.basis{min-width:300px;text-align:left}nav{display:flex;gap:16px;flex-wrap:wrap}details{margin:16px 0}</style><body><nav><a href="../../index.html">Valuation Lab</a><a href="#english">English</a><a href="#chinese">简体中文</a><a href="#history-data">Annual data / 年度数据</a><a href="#guidance-data">Guidance / 指引</a><a href="#sources">Sources / 来源</a></nav>''',
         '<p class="caution">July 31, 2026 capital and discount anchor · August 27 exact 170.244745m common shares · October 19 information cutoff. Dated conditional study only. No current target, upside, expected return, recommendation or ranking. / 2026 七月三十一日资本及折现起点 · 八月二十七日精确普通股 170.244745 百万 · 十月十九日信息截止。仅指定日期条件研究，不提供当前目标、上涨空间、预期收益、建议或排名。</p>']
for language, anchor, index in [('en', 'english', 0), ('zh-Hans', 'chinese', 1)]:
    parts.append(f'<article id="{anchor}" lang="{language}"><h1>KEYS · ' + ('Electronic test and design economics' if index == 0 else '电子测试与设计经济') + '</h1>')
    for key, item in prose.items():
        parts.append(f'<section id="{key if index == 0 else key + "-zh"}"><h2>{esc(titles[key][index])}</h2><p>{esc(item[language])}</p><p>' +
                     ' · '.join(f'<a href="{esc(url)}">{("Source " if index == 0 else "来源 ") + str(i + 1)}</a>' for i, url in enumerate(links[key])) + '</p></section>')
    parts.append('</article>')
parts.append('<section id="conditional-results"><h2>Conditional outputs / 条件输出</h2><p>All three dates above apply to every value. / 每项数值均适用上述三个日期。</p><div class="scroll"><table><tr><th>Case / 情景</th><th>EV $m</th><th>Bridge $m</th><th>Equity $m</th><th>$/common share</th><th>Terminal share</th><th>Min cash headroom $m</th></tr>')
for name, output in outputs.items():
    parts.append(f'<tr><td>{name} / {dict(bear="熊",base="基准",bull="牛")[name]}</td><td>{output["enterprise_value"]:,.4f}</td><td>{output["capital_bridge"]:,.2f}</td><td>{output["equity_value"]:,.4f}</td><td>{output["conditional_value_per_share"]:,.6f}</td><td>{output["terminal_share"]:.2%}</td><td>{audit["cases"][name]["minimum_cash_headroom"]:,.4f}</td></tr>')
parts.append('</table></div><p><a href="dcf-inputs-v1.json">Exact model inputs / 精确输入</a> · <a href="conditional-outputs-v1.json">All outputs / 全部输出</a> · <a href="forecast-v1.csv">30 annual rows / 30 年度行</a> · <a href="sensitivities-v1.json">Sensitivities and suppressed funding stresses / 敏感性及关闭估值的融资压力</a></p></section>')
fmt = lambda value: 'Unavailable / 缺失' if value is None else format(value, ',.0f')
parts.append('<section id="history-data"><h2>All ten reported/recast years / 全部十个报告及重列年度</h2><p>USD millions. Missing shares/lease values remain unavailable. No homogeneous ten-year organic series is claimed. / 单位百万美元。缺失股数及租赁值保留空值，不声称十年同质有机序列。</p><div class="scroll"><table><tr><th>FY</th><th>Revenue</th><th>EBIT</th><th>CFO</th><th>PPE capex</th><th>SBC</th><th>CFO − capex</th><th>Common shares</th><th class="basis">Basis / 口径</th></tr>')
for row in history:
    parts.append('<tr><td>' + row['period'] + '</td>' + ''.join('<td>' + fmt(row[key]) + '</td>' for key in ['revenue', 'canonicalOperatingEBIT', 'cashFromOperations', 'ownCapex', 'SBC', 'reportedOrDerivedFCF', 'shares']) +
                 f'<td class="basis"><a href="{esc(row["sourceUrl"])}">{esc(row["basisLabel"])} / {esc(row["basisLabelZh"])}</a><br>{esc(row["classification"])}<br>{esc(row["classificationZh"])}</td></tr>')
parts.append('</table></div><p><a href="history-normalized-v1.json">Full display rows and original observations / 展示行及原始观察</a> · <a href="history-v1.json">Original annual data / 原始年度数据</a> · <a href="history-field-provenance-v1.json">221 non-null field observations and all missing fields / 221 非空字段观察及全部缺失字段</a></p></section>')
parts.append('<section id="guidance-data"><h2>All eleven guide/actual pairs / 全部十一组指引及实际</h2><p>Revenue USDm, EPS non-GAAP USD/share; original release ranges and outcomes. No consensus or absence-of-interim-revision claim. / 收入百万美元，EPS 为非 GAAP 美元／股；原始发布区间及结果，不是共识比较，也不证明无期中修订。</p><div class="scroll"><table><tr><th>Quarter</th><th>Guide issued</th><th>Actual issued</th><th>Revenue range</th><th>Actual revenue</th><th>EPS range</th><th>Actual EPS</th></tr>')
for row in guidance:
    parts.append(f'<tr><td>{row["quarter"]}</td><td><a href="{esc(row["guide_url"])}">{row["forecast_issued_date"]}</a></td><td><a href="{esc(row["actual_url"])}">{row["actual_issued_date"]}</a></td><td>{row["revenue_low"]}–{row["revenue_high"]}</td><td>{row["revenue_actual"]}</td><td>{row["eps_low"]:.2f}–{row["eps_high"]:.2f}</td><td>{row["eps_actual"]:.2f}</td></tr>')
parts.append('</table></div><p><a href="guidance-comparisons-v1.json">Six-field provenance and quality adjustments / 六字段来源及质量调整</a> · <a href="guidance/guidance_vs_actual.csv">Original derived CSV / 原始派生 CSV</a> · <a href="guidance/management_guidance_assessment.md">Full management evidence and changing outlook scope / 完整管理层证据及展望范围变化</a></p></section>')
parts.append('<section id="archive"><h2>Research and audit archive / 研究及复核归档</h2><p class="caution">The original study/self-tests retain historical “independent review required” wording. Independent audit v2 is the later controlling admission decision: PASS WITH LIMITATIONS for a dated study only. It does not certify the adapter or publication. / 原研究及自测保留当时「需独立复核」文字；后期独立复核 v2 为准入结论，仅指定日期研究「有保留限制通过」，不认证适配器或发布。</p><ul>')
for name in ['STUDY-v1.md', 'independent-audit-v2/independent-audit-v2.md', 'independent-audit-v2/checks.json', 'independent-audit-v2/guidance-checks.json', 'independent-audit-v2/independent-recomputed-model.json', 'replay_dcf.py', 'test_and_sensitivities.py', 'validation-v1.json', 'source-ledger-v1.json', 'source-links-v1.json', 'integrity-manifest-v1.json', 'packaging-manifest-v1.json']:
    parts.append(f'<li><a href="{esc(name)}">{esc(name)}</a></li>')
parts.append('</ul></section><section id="sources"><h2>Primary public source links / 公开原始来源链接</h2><p>Original corporate filings, SEC bulk datasets, source HTML, extracted text, full transcripts and PDFs are excluded from this package. Original source manifests may list files not shipped here; the packaging manifest is authoritative for contents. / 本包不含原始公司申报、SEC 批量数据、原始 HTML、提取文本、完整电话会或 PDF。原来源清单可能列出未打包文件；实际内容以打包清单为准。</p><ul>')
for source in sources:
    parts.append(f'<li><a href="{esc(source["url"])}">{esc(source["id"])}</a> · {esc(source["retrieved"])}</li>')
parts.append('</ul></section></body></html>')
(OUT / 'KEYS-v1.html').write_text('\n'.join(parts))
(OUT / 'README.md').write_text('''# KEYS dated conditional operating-value package

Start with KEYS-v1.html for complete source-linked English and Simplified Chinese research. Capital and discount origin: July 31, 2026. Exact 170.244745 million common shares: August 27, 2026, a 27-day mismatch. Information cutoff: October 19, 2026. Three conditional scenarios are not probabilities, a confidence interval, an expected value, or current targets. Current valuation, upside, expected-return, recommendation and ranking gates remain false.

Independent audit v2 admits the source v1 study PASS WITH LIMITATIONS. The original study, earlier review and author validation retain their historical wording. The later audit checked 113 manifest entries, 221 non-null historical facts, all 11 original-guide/subsequent-actual pairs, 23 invalid inputs, all 30 forecast rows and sensitivities. Source approval does not certify this adapter, user interface or deployment.

All ten FY2016–2025 reported/recast slots retain ASC605/606, pension-reclassification and acquisition-perimeter breaks. Missing exact annual common shares and old lease/debt fields remain null. Audited FY2025 history is distinct from release-vintage quarterly results. Six field sources per guidance row preserve separate publication dates; management-normalized Q3 FY2024 and Q2 FY2026 figures are diagnostics, not independent earnings normalization. The $66m tax provision and $127m cash income tax payment are distinct.

The replay retains cash-equivalent SBC expense, R&D expense, no acquired-amortization addback, gross/physical depreciation, acquisition-renewal spending, NWC and operating cash. Terminal investment respects both ROIC and operating floors. External funding suppresses headline common value. Emergency-debt refinancing/repayment, revolver expiry, intra-year liquidity and grant-level awards are incomplete; funded dilution diagnostics must never be promoted to fair value. Restricted cash and long-term investments stay excluded. A quote cannot update dated capital facts.

Only derived research, metadata and local replay code are shipped. Raw filings, SEC bulk datasets, full transcripts, PDFs and text extractions are linked, not redistributed. Source manifests describe the original archive including unshipped originals; packaging-manifest-v1.json lists actual packaged contents. Independent audit implementation is not packaged because it depends on unshipped originals; its hash-recorded results and report are retained. No original source was modified.

Python replay requires only the standard library. Importing replay_dcf.py has no write side effects; executing it rewrites the local output JSON and forecast CSV. test_and_sensitivities.py executes and rewrites local sensitivity/validation files. For verification without changing packaged hashes, run those programs in an isolated copy with dcf-inputs-v1.json and history-v1.json. Do not run the source derivation helpers against frozen originals.
''')

# Packaging invariants are deliberately stricter than a finite-number check.
assert len(history) == 10 and [row['fiscalYear'] for row in history] == list(range(2016, 2026))
assert sum(value is not None for fields in provenance.values() for value in fields.values()) == 221
assert len(guidance) == 11 and len(guidance_audit) == 11 and all(row['both_above_high'] for row in guidance_audit)
assert all(row['revenue_result'] == 'beat high' and row['eps_result'] == 'beat high' for row in guidance)
assert record['sourceInputs'] == inputs and record['sourceOutputs'] == outputs
for annual_case in [record['annualCase']] + [item['annualCase'] for item in record['alternatives']]:
    for row, original in zip(annual_case['annual'], outputs[annual_case['sourceScenario']]['rows']):
        assert row['sourceRow'] == original and row['reinvestment'] == original['reinvestment']
for path in OUT.rglob('*'):
    if path.is_file():
        assert path.suffix not in ('.pdf', '.htm', '.txt'), path
        assert path.name not in ('sec-companyfacts.json', 'sec-submissions.json'), path
        assert not re.search(r'/workspace/|/home/|/tmp/|file://', path.read_text()), path
write('packaging-manifest-v1.json', {
    'version': OUT.name, 'ticker': 'KEYS', 'asOf': '2026-10-19',
    'sourceResearchModified': False, 'rawFilingsIncluded': False, 'fullTranscriptsIncluded': False,
    'rawSECDatasetsIncluded': False, 'adapterOrDeploymentCertified': False,
    'sourceReviewStatus': 'PASS WITH LIMITATIONS for a dated conditional operating-value study',
    'normalizationPolicy': 'Source input/output and observations preserved; private execution paths sanitized. All ten history slots retain accounting/perimeter breaks and missing cells. Guidance adds per-field provenance and management adjustment metadata without replacing release outcomes.',
    'packagedSources': packaged_sources,
    'generatedFiles': [{'path': path.relative_to(OUT).as_posix(), 'sha256': sha(path)} for path in sorted(OUT.rglob('*')) if path.is_file() and path.name != 'packaging-manifest-v1.json'],
    'registrySHA256': sha(ROOT / 'dist/keys-research-registry.js'),
    'packageChecks': {'sourceManifestFilesVerified': 113, 'auditManifestFilesVerified': 6,
                      'sourceAuthorChecks': 17, 'independentInvalidTests': 23,
                      'annualCases': 3, 'annualRows': 30, 'bridgeControls': 8,
                      'historySlots': 10, 'originalNonNullFieldProvenanceEntries': 221,
                      'guidancePairsObserved': 11, 'guidanceFieldProvenanceEntries': 66,
                      'bilingualReportSections': len(prose), 'rawModelRoundTrip': 'pass',
                      'publicPathScan': 'pass', 'rawSourceExclusion': 'pass'},
})
print('Built KEYS: 3 conditional cases/30 rows, 8 controls, 10 accounting-labelled history slots, 221 facts, 11 guidance pairs, full EN/ZH report. Source originals and shared hooks unchanged.')
