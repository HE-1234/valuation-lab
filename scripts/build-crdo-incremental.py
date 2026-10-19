"""Package the dated, conditional CRDO v3 research without raw source documents.

Read-only with respect to the research source. Writes only this staging checkout's
CRDO registry and versioned data directory. Does not register, publish or certify
an adapter. Run from any working directory with Python's standard library.
"""
import copy
import csv
import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path('/workspace/shared/atlas-research/company-onboarding/CRDO')
OUT = ROOT / 'dist/data/incremental-CRDO-2026-10-18-v3'
OUT.mkdir(parents=True, exist_ok=True)
BASE = './data/' + OUT.name + '/'


def read(relative):
    return json.loads((SRC / relative).read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(relative, value):
    target = OUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n')


inputs = read('v3/dcf-inputs-v3.json')
outputs = read('v3/dcf-output-v3.json')
history = read('history-v1.json')
provenance = read('history-field-provenance-v1.json')
audit = read('independent-audit-v3/recheck-results.json')
readiness = read('independent-audit-v3/readiness.json')
ledger = read('v2/source-ledger-v2.json')
assert audit['status'] == 'pass' and audit['count'] == 761
assert readiness['status'] == 'ready_for_adapter_implementation'
assert all(c['pass'] for c in audit['checks'])
assert len(outputs) == 6 and {x['mode'] for x in outputs} == {'current', 'report_snapshot'}
assert all(x['status'] == 'supported_conditional_at_annual_resolution' for x in outputs)
assert len(history) == 10 and sum(x['coverage'] == 'reported_US_GAAP' for x in history) == 7

# Local source identifiers resolve to source URLs, not missing private filesystem paths.
source_urls = {}
for entry in ledger:
    if entry.get('url'):
        for key in ('id', 'file', 'local'):
            if entry.get(key):
                source_urls[Path(entry[key]).name] = entry['url']
source_urls['crdo-20220430.htm'] = 'https://www.sec.gov/Archives/edgar/data/1807794/000162828022016593/crdo-20220430.htm'
source_urls['0001628280-22-016593-crdo-20220430.htm'] = source_urls['crdo-20220430.htm']


def sanitize_text(value):
    # No absolute execution paths or source-directory traversal in public files.
    value = value.replace(str(SRC) + '/', '').replace(str(SRC), 'CRDO research archive')
    value = re.sub(r'(?:/workspace/|/home/|/tmp/)[^\s\"\'<>`]+', '[private execution path omitted]', value)
    value = re.sub(r'(?:\.\./)+([^\s\"\'<>`]+\.(?:htm|html|txt))',
                   lambda m: source_urls.get(Path(m.group(1)).name, Path(m.group(1)).name), value)
    return value


def sanitize(value):
    if isinstance(value, list):
        return [sanitize(v) for v in value]
    if isinstance(value, dict):
        result = {}
        for k, v in value.items():
            if k in ('local', 'file', 'guide_html', 'actual_html', 'earliest_numeric_guide_local_source'):
                # Preserve source identity but never pretend raw evidence ships here.
                result[k + '_source_identity'] = source_urls.get(Path(v).name, Path(v).name) if isinstance(v, str) and v else None
            elif k == 'source_verified' and v in ('True', 'False'):
                result[k] = v == 'True'
            else:
                result[sanitize_text(k)] = sanitize(v)
        return result
    return sanitize_text(value) if isinstance(value, str) else value


# Explicit allowlist: original author analysis and derived research/audits only.
# No downloaded filings, companyfacts, submissions, full transcripts or raw exhibits.
allowed = [
    'README.md', 'STUDY-v1.md', 'history-v1.json', 'history-v1.csv',
    'history-field-provenance-v1.json', 'observations-v1.json',
    'guidance-vs-actual-v1.json', 'guidance-vs-actual-v1.csv', 'guidance-revisions-v1.json',
    'dcf-inputs-v1.json', 'dcf-output-v1.json', 'forecast-v1.csv', 'sensitivity-v1.json',
    'independent-audit-v1.json', 'source-ledger-v1.json',
    'v2/README.md', 'v2/STUDY-v2.md', 'v2/CORRECTIONS-v2.md',
    'v2/dcf-inputs-v2.json', 'v2/dcf-output-v2.json', 'v2/forecast-v2.csv',
    'v2/sensitivity-v2.json', 'v2/funding-gap-stress-v2.json', 'v2/correction-tests-v2.json',
    'v2/source-ledger-v2.json', 'v2/guidance-comparisons-v2.json', 'v2/guidance-comparisons-v2.csv',
    'v2/annual-and-revisions-v2.json', 'v2/definition-change-v2.json',
    'v3/README.md', 'v3/dcf-inputs-v3.json', 'v3/dcf-output-v3.json', 'v3/forecast-v3.csv',
    'v3/sensitivity-v3.json', 'v3/funding-gap-stress-v3.json', 'v3/correction-tests-v3.json',
    'v3/validation-tests-v3.json', 'v3/input-schema-template.json',
    'v3/replay_dcf.py', 'v3/validation.py',
]
for version in (1, 2, 3):
    for p in sorted((SRC / f'independent-audit-v{version}').rglob('*')):
        if p.is_file() and p.suffix in ('.md', '.json', '.csv'):
            allowed.append(p.relative_to(SRC).as_posix())

packaging_records = []
for relative in allowed:
    source = SRC / relative
    # Keep v1's historical status distinct from the new package overview.
    packaged = 'README-v1.md' if relative == 'README.md' else relative
    target = OUT / packaged
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.suffix == '.json':
        write_json(packaged, sanitize(read(relative)))
    elif source.suffix == '.csv':
        rows = list(csv.DictReader(source.read_text().splitlines()))
        if rows:
            normalized = [sanitize(r) for r in rows]
            with target.open('w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=list(normalized[0]))
                writer.writeheader()
                writer.writerows(normalized)
        else:
            target.write_text(sanitize_text(source.read_text()))
    else:
        target.write_text(sanitize_text(source.read_text()))
    packaging_records.append({'sourceArtifact': relative, 'packagedArtifact': packaged,
                              'sourceSHA256': sha(source), 'packagedSHA256': sha(target),
                              'packagingTransform': 'JSON formatting, local-source pointer sanitization and boolean normalization where applicable; source research unchanged'})

current = {x['scenario']: x for x in outputs if x['mode'] == 'current'}
snapshots = [x for x in outputs if x['mode'] == 'report_snapshot']
write_json('current-outputs-v3.json', list(current.values()))
write_json('report-snapshot-outputs-v3.json', snapshots)
write_json('source-provenance-v3.json', sanitize(ledger))

pairs = {
    'summary': (
        'Credo supplies high-speed AI interconnects, including active electrical cables, optical DSPs and silicon-photonics components. Dated October 18, 2026 conditional intrinsic values are about $39 / $92 / $169 per ordinary share for bear/base/bull. These analyst scenarios have no assigned probabilities and are not trading-price targets or investment recommendations.',
        'Credo 提供高速 AI 互连产品，包括有源电缆、光学 DSP 和硅光子器件。以 2026 年 10 月 18 日为基准的有条件普通股内在价值，悲观／基准／乐观情景约为每股 39／92／169 美元。情景不赋予概率，也不是交易目标价或投资建议。'),
    'scope': (
        'The model is a dated, conditional October 18, 2026 FCFF valuation with information through that date. August 1 cash and shares are reported; October cash, share movements and the $200 RSU settlement price are analyst estimates. FY2027–36 annual inputs feed a remaining-FY2027 stub. The separate August 1 report reconstruction uses information through September 2 and is not an as-known August backtest.',
        '模型为截至 2026 年 10 月 18 日信息的有条件 FCFF 估值。八月一日现金和股数为已报告数据；十月现金、股数变化及 200 美元 RSU 结算价格均为分析假设。2027–2036 财年的全年输入用于计算 2027 财年剩余期间。另列的八月一日报告余额重建使用截至九月二日的信息，并非八月当时可知信息的回测。'),
    'growth': (
        'Base annual revenue is $2,500m in FY2027, $5,400m in FY2031 and $7,997m in FY2036. FY2027 requires $1,490.997m in H2 after reported Q1 $479.003m and Q2 guidance midpoint $530m. Management testimony on September 1 calls for FY2027 growth above 85% and optics above $600m; these annual statements come from the hosted earnings call, not the SEC quarterly outlook table, and are not booked backlog.',
        '基准全年收入为 2027 财年 2,500 百万美元、2031 财年 5,400、2036 财年 7,997。扣除已报告第一季 479.003 及第二季指引中点 530 后，2027 财年下半年须实现 1,490.997 百万美元。管理层九月一日电话会预计全年增长超过 85%、光学收入超过 600 百万美元；这些全年表述来自第三方托管的电话会，不是 SEC 季度展望表，也不是已签订单。'),
    'business': (
        'AECs remain the largest business, while optics, ZeroFlap, retimers and OmniConnect widen the opportunity and execution demands. Credo is fabless but relies on TSMC wafer production and assembly/cable partners. No exact audited latest AEC/optics/retimer split is available. Do not map anonymous customers to named hyperscalers or add contracting-customer and end-customer concentration measures.',
        'AEC 仍是最大业务；光学、ZeroFlap、重定时器及 OmniConnect 扩大机会，也增加执行要求。Credo 无自有晶圆厂，但依赖台积电及封测、电缆合作伙伴。没有最新经审计的 AEC／光学／重定时器收入细分。不得把匿名客户对应为具名云厂商，也不得将合同客户与终端客户集中度相加。'),
    'profitability': (
        'Annual economic margins equal pre-new-grant margins less new-grant compensation. Base starts at 46% minus 10% = 36%, fading to 42% minus 8% = 34%. Existing-award amortization is excluded because those claims are allocated separately; future SBC is not added back. R&D and operating rents remain expensed. These are replacement-cost economics, not forecasts of GAAP presentation.',
        '全年经济营业利润率等于新增授予前利润率减新增股权薪酬。基准从 46%−10%=36% 过渡至 42%−8%=34%。既有奖励摊销已排除，因为相关请求权另行分配；未来股权薪酬不得再次加回。研发与经营租金持续费用化。这是替代薪酬成本口径，不是 GAAP 报表预测。'),
    'capital': (
        'Source full-year reinvestment is incremental annual sales divided by marginal sales/capital; base turns begin at 2.2× and fade to 0.65×. Edited annual investment remains the user’s assumption, with simulation capital response following the selected simulator policy. The company adapter does not impose a reinvestment floor: it applies the remaining FY2027 fraction once to NOPAT less entered annual investment, then tests liquidity. Deposits and recoveries are separate timing flows. Paid acquisition cash, already-issued acquisition shares and ordinary inventory commitments are not charged twice.',
        '来源全年再投资为年度收入增量除以边际销售资本比；基准从 2.2 倍降至 0.65 倍。编辑后的年度投资仍为用户假设，模拟资本响应遵循所选模拟政策。公司适配器不强制再投资下限：仅对 NOPAT 减输入全年投资应用一次 2027 财年剩余比例，再检验流动性。定金与返还另列为时点现金流；已支付收购现金、已发行收购股份和日常库存承诺不重复扣减。'),
    'funding': (
        'A mandatory $19.495m reserve covers existing technology-license and cash-contingent claims. The model tests opening liquidity, remaining deposit prefunding and every annual/stub cash balance against the selected minimum cash floor. A deficit rejects EV and equity with unsupported_funding_gap and a shortfall, never a zero or stale price. This annual/stub cash-equivalent gate is not a quarterly liquidity forecast or financing plan. Borrowing, debt weight, automatic issuance and repurchases are outside scope.',
        '必须预留 19.495 百万美元覆盖既有技术许可及现金或有对价。模型核验期初流动性、剩余定金预付及每个年度／剩余期间余额是否低于所选现金底线。资金不足时返回 unsupported_funding_gap 及缺口，并拒绝企业与股权估值，不能用零值或旧价格替代。这是年度／剩余期间的现金等价资金门槛，不是季度流动性预测或融资计划；借款、债务权重、自动发行及回购均不在范围内。'),
    'tax': (
        'Base cash taxes rise from 6% to 18%; bear reaches 21% and bull 18%. Recent low or negative GAAP tax rates, including acquisition effects, are not perpetuated. No separate NOL asset is added, and interest on surplus cash is outside operating value.',
        '基准现金税率从 6% 升至 18%；悲观最终为 21%，乐观为 18%。不将近期低或负 GAAP 税率及收购影响永久化。没有额外添加亏损结转资产；超额现金利息不计入经营价值。'),
    'wacc': (
        'Current initial WACC is 11.60%, fading to 9.29%. Inputs are the October 16 Treasury 10-year yield of 5.09%, October 1 implied ERP of 4.20%, and analyst beta 1.55 fading to 1.00. The unadjusted Treasury/ERP convention is consistent; dates differ. Beta is a judgment, not an observed regression, and debt weight is zero.',
        '当前初始 WACC 为 11.60%，逐步降至 9.29%。输入为十月十六日十年期国债 5.09%、十月一日隐含股权风险溢价 4.20%，以及从 1.55 降至 1.00 的分析贝塔。国债与风险溢价使用一致的未调整口径，但观察日期不同。贝塔为判断而非实测回归，债务权重为零。'),
    'terminal': (
        'Bear/base/bull terminal growth is 2.5% / 3.0% / 3.5% and terminal ROIC 12% / 15% / 20%; continuing investment is NOPAT × growth / ROIC. Terminal value is 54.4% / 61.7% / 66.1% of current EV. The first modeled fiscal end is May 1, 2027; subsequent periods use model annual anniversaries, not independently verified future 52/53-week fiscal dates.',
        '悲观／基准／乐观终值增长率为 2.5%／3.0%／3.5%，终值 ROIC 为 12%／15%／20%；持续投资为 NOPAT×增长率／ROIC。终值占当前企业价值 54.4%／61.7%／66.1%。首个模型财年末为 2027 年五月一日；后续为模型年度周年期，并非独立核实的未来 52／53 周财年日期。'),
    'claims': (
        'Reported August 1 cash/investments are $764.258m and ordinary shares 187.768m. October estimates add $135m operating cash, less $15m capex, $55m deposits and $25m RSU withholding, giving cash $804.258m. Net issuance of 0.7m shares gives 188.468m common shares. At the explicitly assumed $200 settlement price, 0.125m withheld shares plus 0.7m issued shares extinguish 0.825m RSUs, leaving 7.475m before future vesting.',
        '已报告八月一日现金及投资为 764.258 百万美元、普通股 187.768 百万股。十月估算增加经营现金 135，扣资本开支 15、定金 55 及 RSU 代扣税现金 25，现金成为 804.258 百万美元。净发行 0.7 百万股后，普通股为 188.468 百万股。按明确假设的每股 200 美元结算价，代扣股份 0.125 加净发行 0.7，共注销 0.825 百万 RSU，未来归属前剩余 7.475 百万。'),
    'awards': (
        'Existing RSUs, PSUs, exchangeable subsidiary restricted shares, earnout shares and options share one equity pool. PSU factors are 35% / 65% / 100%; earnout factors are 20% / 42.03% / 100%. The base earnout factor derives from acquisition-date accounting value and is a conditional proxy, not an observed probability or current fair value. Options are jointly repriced with common equity. The 1.437m special CEO PSUs are within the 3.1m PSU pool, not added twice. The $5bn revenue trigger can satisfy the first two full 239,500-share tranches subject to service and terms.',
        '既有 RSU、PSU、可交换子公司限制股、或有对价股份及期权共同分配一个股权池。PSU 因子为 35%／65%／100%；或有股份因子为 20%／42.03%／100%。基准或有股份因子来自收购日会计价值，是有条件代理值，不是观察概率或当前公允价值。期权与普通股价值联立求解。特别 CEO 奖励 1.437 百万 PSU 已含于 3.1 百万总池，不重复添加；50 亿美元收入门槛可使前两个完整的 239,500 股批次达标，仍须满足服务与合约条件。'),
    'capacity': (
        'The post-August capacity commitment is $102.4m. Estimated October payment of $55m leaves a $47.4m first-stub outflow, while $25.6m annual recoveries in FY2028–31 are explicit assumptions. The paid $55m already reduced cash and is not deducted again. Existing $88.4m operating deposits are not surplus cash; recoveries depend on purchasing and collectability.',
        '八月后产能承诺为 102.4 百万美元。估计十月已付 55，首个剩余期间还须支付 47.4；2028–2031 财年每年收回 25.6 均为明确假设。已付 55 已从现金扣除，不再次扣减。既有 88.4 百万美元经营定金不是超额现金；回收取决于采购与可收回性。'),
    'claimLimits': (
        'October balances, post-August grants/exercises and complete grant-level PSU/earnout terms are unobserved. Rounded award pools, the restricted-share allowance, vesting factors and ESPP-derived 78.62% option-volatility proxy are conditional simplifications. No live quote, upside percentage, account-level trading eligibility or automatically refreshed cash balance is asserted. Invalid inputs or nonpositive equity pools must clear all previous valuation results.',
        '十月余额、八月后的授予／行权及完整逐项 PSU／或有对价条款未被观察。四舍五入的奖励池、限制股预留、归属因子及来自员工购股计划的 78.62% 期权波动率代理均是有条件简化。不声称实时股价、上涨空间、个人账户交易资格或自动更新现金余额。无效输入或非正股权池必须清除旧估值。'),
    'guidance': (
        'The corrected panel retains 90 observations across 18 quarters, with both original rounded headlines and original table-precision comparisons. FY2024Q2 revenue $44.035m exceeds $44m while $44.0m is within; opex $34.992m is below $35m while $35.0m is within. FY2025Q4 adjusted opex $52.021m exceeds $52m while $52.0m is within. FY2023Q4 revenue guidance was first issued February 14 and reiterated March 1. Its adjusted-margin comparison crosses a warrant contra-revenue definition change; later comparative revisions remain separate. FY2023 revenue $184.194m missed the $200m annual floor by 7.903%.',
        '修正面板保留 18 季度、90 项观察，同时展示原始四舍五入标题及原始表格精度比较。2024 财年第二季收入 44.035 百万美元高于 44，但标题 44.0 在区间内；费用 34.992 低于 35，而标题 35.0 在区间内。2025 财年第四季调整费用 52.021 高于 52，而标题 52.0 在区间内。2023 财年第四季收入指引首次发表于二月十四日，三月一日重申；该季调整毛利率比较跨越认股权证收入冲减的定义变更，后续比较修订另列。2023 财年实际收入 184.194 低于全年 200 下限 7.903%。'),
    'history': (
        'Ten FY2017–26 slots contain seven observed annual periods, FY2020–26. FY2017–19 were private-history gaps and stay null; FY2020 also lacks several balance fields. Field-level SEC accession, period, tag and units are retained. FY2025 had 53 weeks with the extra week in Q1; FY2023 changed fiscal conventions. Pre-IPO shares, acquisitions and warrant contra-revenue limit comparability. Historical CFO less capex adds back SBC and is not economic shareholder FCFF.',
        '2017–2026 十个财年位置只有 2020–2026 七个已观察年度。2017–2019 为私有时期历史缺口，保持空值；2020 亦缺若干资产负债字段。保留逐字段 SEC 申报号、期间、标签与单位。2025 财年共 53 周，多出的一周在第一季；2023 更改财年规则。IPO 前股数、收购及认股权证收入冲减限制可比性；历史经营现金流减资本开支会加回股权薪酬，不等同经济股东 FCFF。'),
    'uncertainty': (
        'Named scenarios have no assigned probabilities. New simulation defaults have zero width and are uncalibrated; Monte Carlo runs only on manual request. Every valid trial must recompute timing, liquidity and claim allocation, and every invalid or unfunded trial must be excluded with a visible status. A zero-width trial should reproduce its selected dated conditional case.',
        '命名情景没有指定概率。新模拟默认零宽度且未经校准；蒙特卡洛仅手动运行。每个有效试验都须重算时点、流动性及请求权分配；无效或资金不足的试验须排除并显示状态。零宽度试验应复现所选的有日期有条件情景。'),
    'audit': (
        'Independent v3 review passed 761 checks and found the research/model ready for adapter implementation. All six complete outputs and 55 sensitivity rows match corrected v2. This review does not certify an unseen integration or deployment. V1 defects, v2 corrections and v3 validation remain separately archived; author test counts are not independent approval.',
        '独立 v3 复核通过 761 项检查，确认研究及模型可进入适配器实施。全部六组完整输出及 55 行敏感性与修正 v2 一致。该复核不认证尚未检查的集成或部署。v1 缺陷、v2 修正和 v3 验证分别保留；作者自测数量不代表独立批准。'),
}
prose = {k: {'en': v[0], 'zh-Hans': v[1]} for k, v in pairs.items()}

identity = {'packageVersion': OUT.name, 'version': '2026-10-18-crdo-conditional-v3',
            'ticker': 'CRDO', 'currency': 'USD', 'informationAsOf': '2026-10-18',
            'discountOrigin': '2026-10-18', 'reportedBalanceDate': '2026-08-01'}
for key, relative in [('source', 'v3/dcf-inputs-v3.json'), ('history', 'history-v1.json'),
                      ('audit', 'independent-audit-v3/recheck-results.json'),
                      ('fullReport', 'v2/STUDY-v2.md'), ('auditReport', 'independent-audit-v3/REVIEW.md')]:
    identity[key + 'Path'] = BASE + relative
    identity[key + 'SHA256'] = sha(OUT / relative)
identity.update({'packagedSourceSHA256': identity['sourceSHA256'],
                 'originalSourceSHA256': sha(SRC / 'v3/dcf-inputs-v3.json'),
                 'packagedHistorySHA256': identity['historySHA256'],
                 'historyCSVPath': BASE + 'history-v1.csv', 'reportPath': BASE + 'CRDO-v3.html',
                 'guidancePath': BASE + 'v2/guidance-comparisons-v2.json',
                 'provenancePath': BASE + 'source-provenance-v3.json',
                 'reportSnapshotPath': BASE + 'report-snapshot-outputs-v3.json',
                 'currentOutputsPath': BASE + 'current-outputs-v3.json',
                 'readinessPath': BASE + 'independent-audit-v3/readiness.json',
                 'packagingManifestPath': BASE + 'packaging-manifest-v3.json'})


def bridge_defaults(name):
    b, s = inputs['october_bridge'], inputs['scenarios'][name]
    return {'minimumCashFloor': inputs['funding']['minimum_cash_floor'],
            'operatingCashAfterWorkingCapital': b['operating_cash_after_ordinary_working_capital'],
            'capitalExpenditures': b['capital_expenditures'],
            'capacityDepositsPaid': b['capacity_deposits_paid'],
            'rsuWithholdingCash': b['rsu_withholding_cash'],
            'netRsuSharesIssued': b['net_rsu_shares_issued'],
            'rsuSettlementPrice': b['rsu_settlement_price'],
            'rsuVestingProbability': s['rsu_vesting_probability'],
            'psuVestingProbability': s['psu_vesting_probability'],
            'earnoutProbability': s['earnout_probability'],
            'optionVolatility': inputs['option_volatility']}


def case(name):
    s, calculated = inputs['scenarios'][name], current[name]
    rows = []
    previous = inputs['base_fy2026_revenue']
    for i, row in enumerate(calculated['rows']):
        fy = 2027 + i
        # Inputs remain full-year quantities. Only the company adapter may apply
        # the remaining-sales/calendar fraction and additional deposit timing.
        reinvestment = (s['revenue'][i] - previous) / s['sales_to_capital'][i]
        assert abs(reinvestment - row['annual_reinvestment']) < 1e-10
        rows.append({'year': i + 1, 'period': f'FY{fy}', 'fiscalYear': fy,
                     'fiscalEnd': f'{fy}-05-01',
                     'fiscalEndClassification': 'source_first_forecast_end' if i == 0 else 'modeled_annual_anniversary',
                     'revenue': s['revenue'][i],
                     'operatingMargin': s['pre_new_grant_operating_margin'][i] - s['new_grant_sbc_margin'][i],
                     'taxRate': s['tax_rate'][i], 'reinvestment': reinvestment,
                     'wacc': row['wacc'], 'sourceRow': copy.deepcopy(row)})
        previous = s['revenue'][i]
    return {'ticker': 'CRDO', 'company': 'Credo Technology Group Holding Ltd.', 'currency': 'USD',
            'scenario': 'base', 'sourceScenario': name, 'crdoScenario': name, 'crdoMode': 'current',
            'ratioUnit': 'decimal', 'forecastHorizonYears': 10,
            'incrementalResearch': identity, 'valuationTiming': {'discountOrigin': '2026-10-18'},
            'anchor': {'period': 'FY2026', 'fiscalEnd': '2026-05-02', 'kind': 'reported_actual',
                       'classification': 'Reported full fiscal year; first forecast is annual with a remaining-period cash-flow treatment',
                       'revenue': inputs['base_fy2026_revenue'], 'EBIT': 445.005,
                       'latestReportedQuarterEnd': '2026-08-01', 'ttmRevenue': inputs['ttm_revenue'],
                       'firstModeledPeriod': 'FY2027', 'firstModeledPeriodStart': '2026-10-18',
                       'firstModeledFiscalEnd': inputs['dates']['first_forecast_end'],
                       'fiscalCalendarCaution': 'Full FY2027–36 assumptions; remaining FY2027 operating/calendar fraction applied by the CRDO adapter. First end May 1, 2027, then one-year modeled periods, not verified future 52/53-week fiscal ends.'},
            'annual': rows,
            'terminal': {'growth': s['terminal_growth'], 'operatingMargin': rows[-1]['operatingMargin'],
                         'taxRate': s['tax_rate'][-1], 'ROIC': s['terminal_roic'],
                         'wacc': calculated['terminal_wacc']},
            'crdoInputs': copy.deepcopy(inputs), 'bridgeOptions': bridge_defaults(name),
            'boundedModelGaps': [pairs[k][0] for k in ('scope', 'funding', 'claimLimits', 'history', 'uncertainty')]}


option_specs = [
    ('minimumCashFloor', 'Minimum modeled cash floor', '最低模型现金余额', 'USDm', 1, 0, None),
    ('operatingCashAfterWorkingCapital', 'Estimated interim operating cash after working capital', '估计期间营运资本后经营现金', 'USDm', 1, 0, None),
    ('capitalExpenditures', 'Estimated interim capital expenditures', '估计期间资本开支', 'USDm', 1, 0, None),
    ('capacityDepositsPaid', 'Estimated interim capacity deposits paid', '估计期间已付产能定金', 'USDm', 1, 0, 102.4),
    ('rsuWithholdingCash', 'Estimated interim RSU withholding cash', '估计期间 RSU 代扣税现金', 'USDm', 1, 0, None),
    ('netRsuSharesIssued', 'Estimated interim net RSU shares issued', '估计期间 RSU 净发行股数', 'million shares', 1, 0, 8.3),
    ('rsuSettlementPrice', 'Assumed RSU settlement price (not observed)', '假设 RSU 结算价（非观察值）', 'USD/share', 1, 0, None),
    ('rsuVestingProbability', 'Conditional future RSU vesting factor', '未来 RSU 有条件归属因子', '%', 100, 0, 1),
    ('psuVestingProbability', 'Conditional PSU vesting factor', 'PSU 有条件归属因子', '%', 100, 0, 1),
    ('earnoutProbability', 'Conditional earnout share factor', '或有对价股份有条件因子', '%', 100, 0, 1),
    ('optionVolatility', 'Assumed option volatility', '假设期权波动率', '%', 100, 0, None),
]
options = [{'key': k, 'label': label, 'labelZh': zh, 'type': 'number', 'default': bridge_defaults('base')[k],
            'min': low, 'max': high, 'unit': unit, 'scale': scale, 'allowUnknown': True,
            'exclusiveMinimum': k in ('rsuSettlementPrice', 'optionVolatility'),
            'classification': 'Analyst conditional input; invalid or unsupported values reject valuation'}
           for k, label, zh, unit, scale, low, high in option_specs]
q1_url = next(s['url'] for s in ledger if s.get('id') == 'crdo-20260801.htm')
bridge = {'type': 'crdo-v3', 'ticker': 'CRDO', 'currency': 'USD', 'referenceDate': '2026-10-18',
          'shareDate': '2026-10-18', 'reportedBalanceDate': '2026-08-01', 'informationAsOf': '2026-10-18',
          'sourceUrl': q1_url, 'shares': current['base']['common_shares'], 'cash': current['base']['cash'],
          'reportedShares': inputs['ordinary_shares'], 'reportedCash': inputs['cash_and_investments'],
          'balanceClassification': 'October estimate from reported August balances', 'options': options,
          'defaultOptionsByScenario': {name: bridge_defaults(name) for name in inputs['scenarios']},
          'fixedClaims': [{'id': 'technologyLicenseDebt', 'label': 'Reported technology-license obligations', 'amount': 9.495},
                          {'id': 'cashContingentConsideration', 'label': 'Reported cash-contingent consideration', 'amount': 10}],
          'notes': [pairs[k][0] for k in ('claims', 'awards', 'capacity', 'profitability')],
          'unresolved': [pairs[k][0] for k in ('scope', 'funding', 'claimLimits')],
          'shareBasis': 'Estimated October ordinary shares plus separately priced existing claims; not weighted EPS shares',
          'classification': 'Dated conditional October allocation with estimated interim cash, shares and settlement price',
          'claimCompleteness': 'conditional-analyst-award-and-earnout-allocation',
          'allocationMethod': 'joint-common-equity-and-Black-Scholes-option-fixed-point',
          'currentQuote': None, 'currentPriceTargetEligible': False, 'unconditionalEquityValueEligible': False,
          'fundingMode': 'reject_if_funding_required',
          'nullPolicy': 'Invalid, unfunded or nonpositive-equity scenarios release no EV, common equity or price; clear previous results.'}

catalog = json.loads((ROOT / 'dist/data/atlas-company-catalog-v1.json').read_text())
listing = next(x for x in catalog['companies'] if x['ticker'] == 'CRDO')
sources = []
for index, entry in enumerate(ledger):
    if not entry.get('url'):
        continue
    sources.append({'id': entry.get('id') or entry.get('file') or f'CRDO source {index+1}',
                    'url': entry['url'], 'publication_date': entry.get('date'),
                    'retrieved': entry.get('accessed') or '2026-10-18',
                    'evidence': entry.get('evidence'),
                    'reviewStatus': entry.get('retention_status')})
record = {
    'identity': identity,
    'publicTradability': {k: listing[k] for k in ('ticker', 'nativeTicker', 'mic', 'exchange', 'securityType', 'verified', 'checkedAt', 'sourceURLs', 'evidence', 'robinhood')},
    'annualCase': case('base'),
    'alternatives': [{'name': name, 'label': label, 'buttonLabel': button,
                      'labelZh': '悲观情景' if name == 'bear' else '乐观情景',
                      'buttonLabelZh': '载入已复核悲观情景' if name == 'bear' else '载入已复核乐观情景',
                      'classification': 'Dated conditional analyst scenario; no assigned probability',
                      'annualCase': case(name), 'bridgeOptions': bridge_defaults(name)}
                     for name, label, button in [('bear', 'Bear scenario', 'Load reviewed bear'),
                                                 ('bull', 'Bull scenario', 'Load reviewed bull')]],
    'bridge': bridge, 'sourceInputs': copy.deepcopy(inputs),
    'history': [{**r, 'period': f'FY{r["fiscal_year"]}', 'fiscalYear': r['fiscal_year'],
                 'fiscalEnd': r['period_end'], 'revenue': r.get('revenue'),
                 'canonicalOperatingEBIT': r.get('operating_income'), 'operatingMargin': r.get('operating_margin'),
                 'fieldProvenance': [p for p in provenance if p['fiscal_year'] == r['fiscal_year']]}
                for r in history],
    'prose': prose, 'sources': sources,
    'guidanceComparisons': sanitize(read('v2/guidance-comparisons-v2.json')),
    'guidanceRevisions': sanitize(read('v2/annual-and-revisions-v2.json')),
    'evidence': {'currentOutputsPath': identity['currentOutputsPath'],
                 'reportSnapshotPath': identity['reportSnapshotPath'],
                 'reportSnapshot': snapshots,
                 'reportSnapshotClassification': 'Separate August 1 reported-balance reconstruction with September 2 information; not an investable August backtest',
                 'correctedGuidancePath': identity['guidancePath'],
                 'definitionChangePath': BASE + 'v2/definition-change-v2.json',
                 'sourceProvenancePath': identity['provenancePath']},
    'auditResults': {'checksPassed': 761, 'authorCorrectionChecksPassed': 65,
                     'authorValidationChecksPassed': 1509, 'priorOutputsUnchanged': 6,
                     'priorSensitivitiesUnchanged': 55,
                     'status': 'PASS for research/model; integration and deployment are not certified by this source review'},
    'readiness': 'reviewed-dated-conditional-model',
}
bundle = {'schemaVersion': 1, 'version': OUT.name, 'asOf': '2026-10-18', 'companies': [record]}
write_json('cases.json', bundle)
(ROOT / 'dist/crdo-research-registry.js').write_text(
    '// Build-generated CRDO v3 dated conditional research; no raw filings or transcripts.\n'
    + 'const bundle=' + json.dumps(bundle, ensure_ascii=False, indent=2, allow_nan=False)
    + ';\nfunction freeze(x){if(x&&typeof x===\'object\'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}\n'
    + 'export const crdoRegistry=freeze(bundle);\n')

# A stand-alone bilingual evidence report is the public entry point. Archived
# reports retain their historical conclusions and are clearly marked superseded.
e = html.escape
labels = {'summary': ('Summary', '摘要'), 'scope': ('Dates and conditional status', '日期与有条件状态'),
          'growth': ('Revenue assumptions', '收入假设'), 'business': ('Business and concentration', '业务与集中度'),
          'profitability': ('Economic margins and compensation', '经济利润率与薪酬'), 'capital': ('Reinvestment', '再投资'),
          'funding': ('Funding rejection policy', '资金不足拒绝政策'), 'tax': ('Cash taxes', '现金税'),
          'wacc': ('Discount rates', '折现率'), 'terminal': ('Terminal economics and fiscal timing', '终值经济与财年时点'),
          'claims': ('Observed and estimated capital', '观察与估计资本'), 'awards': ('Existing awards and earnout', '既有奖励与或有对价'),
          'capacity': ('Capacity deposits', '产能定金'), 'claimLimits': ('Remaining limitations', '剩余限制'),
          'guidance': ('Corrected guidance evidence', '修正指引证据'), 'history': ('Historical coverage', '历史覆盖'),
          'uncertainty': ('Scenario uncertainty', '情景不确定性'), 'audit': ('Review status', '复核状态')}
parts = ['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
         '<title>CRDO · October 18, 2026 conditional research</title>',
         '<style>body{font:16px/1.65 system-ui;max-width:1100px;margin:auto;padding:24px;color:#18232b}h1,h2{line-height:1.2}section{margin:28px 0}a{color:#065ca9}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:right;border-bottom:1px solid #dce2e7;padding:8px}th:first-child,td:first-child{text-align:left}.scroll{overflow:auto}.caution{padding:16px;background:#fff7db;border:1px solid #e5c980}</style>',
         '<body><nav><a href="../../index.html">Valuation Lab</a> · <a href="#english">English</a> · <a href="#chinese">简体中文</a> · <a href="#sources">Sources / 来源</a></nav>']
for lang_index, (lang, anchor) in enumerate([('en', 'english'), ('zh-Hans', 'chinese')]):
    parts.append(f'<article id="{anchor}" lang="{lang}"><h1>CRDO · 2026-10-18</h1>')
    for key, text in prose.items():
        section_id = key if lang == 'en' else key + '-zh'
        parts.append(f'<section id="{section_id}"><h2>{e(labels[key][lang_index])}</h2><p>{e(text[lang])}</p></section>')
    parts.append('</article>')
parts.append('<section id="current-output-evidence"><h2>Dated current conditional outputs / 有日期当前有条件输出</h2><div class="scroll"><table><thead><tr><th>Scenario / 情景</th><th>EV / 企业价值 ($m)</th><th>Common equity / 普通股权益 ($m)</th><th>Value/share / 每股 ($)</th><th>Status / 状态</th></tr></thead><tbody>')
for name, x in current.items():
    parts.append(f'<tr><td>{name}</td><td>{x["enterprise_value"]:,.1f}</td><td>{x["common_equity_value"]:,.1f}</td><td>{x["value_per_common_share"]:.2f}</td><td>Conditional / 有条件</td></tr>')
parts.append('</tbody></table></div></section><section id="report-snapshot"><h2>Separate reported-balance reconstruction / 单独报告余额重建</h2><p>August 1, 2026 origin; September 2 information. This is not an as-known August backtest. / 基准日为 2026 年八月一日，信息截至九月二日，不是八月当时可知信息的回测。</p><div class="scroll"><table><thead><tr><th>Scenario</th><th>EV ($m)</th><th>Common equity ($m)</th><th>Value/share ($)</th></tr></thead><tbody>')
for x in snapshots:
    parts.append(f'<tr><td>{x["scenario"]}</td><td>{x["enterprise_value"]:,.1f}</td><td>{x["common_equity_value"]:,.1f}</td><td>{x["value_per_common_share"]:.2f}</td></tr>')
parts.append('</tbody></table></div><p><a href="report-snapshot-outputs-v3.json">Full report-snapshot evidence / 完整报告余额证据</a></p></section>')
parts.append('<section id="history-data"><h2>FY2017–26 historical coverage / 财年历史覆盖</h2><div class="scroll"><table><thead><tr><th>FY</th><th>Period end</th><th>Revenue ($m)</th><th>EBIT ($m)</th><th>Coverage</th></tr></thead><tbody>')
for r in history:
    fmt = lambda v: 'Unavailable / 缺失' if v is None else f'{v:,.3f}'
    parts.append(f'<tr><td>{r["fiscal_year"]}</td><td>{e(r["period_end"] or "Unreported / 未报告")}</td><td>{fmt(r.get("revenue"))}</td><td>{fmt(r.get("operating_income"))}</td><td>{e(r["coverage"])}</td></tr>')
parts.append('</tbody></table></div><p><a href="history-v1.json">History / 历史</a> · <a href="history-field-provenance-v1.json">Field provenance / 字段来源</a></p></section>')
parts.append('<section id="guidance-data"><h2>Original guidance and dual precision / 原始指引与双重精度</h2><p>Dollar tables: $0.001m; margins: 0.1 percentage point source precision. / 美元表格精度为 0.001 百万美元；毛利率原始精度为 0.1 个百分点。</p><div class="scroll"><table><thead><tr><th>Quarter</th><th>Metric</th><th>Original range</th><th>Headline actual</th><th>Table actual</th><th>Headline / table position</th><th>First issued / reiterated</th><th>Definition caveat</th></tr></thead><tbody>')
for r in record['guidanceComparisons']:
    parts.append('<tr>' + f'<td>{e(r["quarter"])}</td><td>{e(r["metric"])}</td><td><a href="{e(r["guide_url"])}">{r["guide_low"]}–{r["guide_high"]}</a></td><td><a href="{e(r["actual_url"])}">{r["headline_actual"]}</a></td><td>{r["original_table_actual"]}</td><td>{e(r["headline_position"])} / {e(r["table_position"])}</td><td>{e(r["first_issued_guide_date"])} / {e(r["reiteration_date"] or "—")}</td><td>{e(r["definition_change_note"] or r["like_for_like_definition"])}</td></tr>')
parts.append('</tbody></table></div><p><a href="v2/guidance-comparisons-v2.json">Corrected 90-observation panel / 修正 90 项观察</a> · <a href="v2/annual-and-revisions-v2.json">Annual misses and revisions / 全年未达与修订</a> · <a href="v2/definition-change-v2.json">Definition change / 定义变更</a></p></section>')
parts.append('<section id="archive"><h2>Versioned research and review / 分版本研究与复核</h2><p class="caution">The archived v1 study contains superseded bridge and presentation defects. The v2 study resolves those defects; v3 adds fail-closed validation. Historical “pending review” wording is preserved in author documents. The independent v3 readiness decision is the latest source review, and does not certify this integration or deployment. / 归档 v1 含已被修正的桥接与展示缺陷；v2 修正这些问题，v3 加入失败关闭验证。作者文档保留当时“等待复核”的措辞。独立 v3 就绪结论为最新来源复核，但不认证本次集成或部署。</p><ul>')
for path, label in [('STUDY-v1.md', 'Archived v1 original study / 归档 v1 原始研究'), ('v2/STUDY-v2.md', 'Corrected v2 full study / 修正 v2 完整研究'), ('v2/CORRECTIONS-v2.md', 'v2 correction record / v2 修正记录'), ('v3/README.md', 'v3 validation contract / v3 验证契约'), ('independent-audit-v1/REVIEW.md', 'Independent v1 review / 独立 v1 复核'), ('independent-audit-v2/REVIEW.md', 'Independent v2 review / 独立 v2 复核'), ('independent-audit-v3/REVIEW.md', 'Independent v3 review / 独立 v3 复核'), ('v3/dcf-inputs-v3.json', 'v3 model inputs / v3 模型输入'), ('v3/dcf-output-v3.json', 'All six frozen outputs / 全部六组冻结输出'), ('v3/sensitivity-v3.json', '55 sensitivity rows / 55 行敏感性'), ('packaging-manifest-v3.json', 'Public packaging manifest / 公开打包清单')]:
    parts.append(f'<li><a href="{e(path)}">{e(label)}</a></li>')
parts.append('</ul></section><section id="sources"><h2>Verified source identities / 已核实来源身份</h2><p>External sources are linked; raw filings and licensed transcripts are not redistributed. / 外部来源以链接提供，不再分发原始申报文件或授权电话会全文。</p><ul>')
for s in sources:
    parts.append(f'<li><a href="{e(s["url"])}">{e(s["id"])}</a> · {e(s["publication_date"] or "")} · {e(s["evidence"] or s["reviewStatus"] or "")}</li>')
parts.append('</ul></section></body></html>')
(OUT / 'CRDO-v3.html').write_text('\n'.join(parts))

(OUT / 'README.md').write_text('''# CRDO dated conditional research package

Information cutoff and current valuation origin: October 18, 2026. USD millions and shares millions unless stated. Start with CRDO-v3.html for the bilingual summary, corrected guidance evidence, historical gaps, source links, and version status.

The source research/model passed 761 independent v3 checks and is ready for adapter implementation. This statement does not certify an integration, UI, or deployment. October cash/shares and the $200 RSU settlement price remain explicit analyst estimates. No current market quote or investment recommendation is supplied.

The current annual cases use full FY2027–36 revenues and full annual reinvestment, with economic margins after new-grant compensation. The company adapter must apply the remaining FY2027 sales/calendar fraction once, account separately for deposits/recoveries, validate all inputs, and reject unsupported funding. Current and reported-balance reconstruction outputs are retained separately. The August reconstruction uses information through September 2 and is not an August as-known backtest.

V1 and v2 analysis and reviews retain their historical findings, including superseded defects and then-pending review language. The latest review is independent-audit-v3/REVIEW.md. Raw filings, full transcripts, companyfacts, and submissions are excluded. Local evidence pointers are sanitized to public source identities; guidance source_verified strings are normalized to booleans. Source and packaged hashes are distinct where normalization changes bytes.

The v3 standard-library replay is included for reproducibility: from v3, importing replay_dcf.calc permits read-only calculations; running replay_dcf.py rewrites the local v3 output and forecast files. Earlier model implementations are not bundled as runnable entry points. No source research was modified during packaging.
''')

# These checks protect against accidental public inclusion and financial schema drift.
for path in OUT.rglob('*'):
    if path.is_file():
        assert path.suffix not in ('.htm', '.txt', '.pdf'), f'Raw source disallowed: {path.name}'
        text = path.read_text()
        assert not re.search(r'/workspace/|/home/|/tmp/|file://', text), path.name
for c in [record['annualCase']] + [a['annualCase'] for a in record['alternatives']]:
    name = c['sourceScenario']
    assert c['crdoInputs'] == inputs
    assert c['valuationTiming']['discountOrigin'] == '2026-10-18'
    for i, row in enumerate(c['annual']):
        original = inputs['scenarios'][name]
        assert row['revenue'] == original['revenue'][i]
        assert row['reinvestment'] == current[name]['rows'][i]['annual_reinvestment']
        assert row['operatingMargin'] == original['pre_new_grant_operating_margin'][i] - original['new_grant_sbc_margin'][i]
        assert row['wacc'] == current[name]['rows'][i]['wacc']
assert all(isinstance(r['source_verified'], bool) for r in record['guidanceComparisons'])
assert all(r['revenue'] is None and r['canonicalOperatingEBIT'] is None and r['operatingMargin'] is None for r in record['history'][:3])
assert len(bridge['options']) == 11
assert record['alternatives'][0]['bridgeOptions']['psuVestingProbability'] == .35
assert record['alternatives'][1]['bridgeOptions']['earnoutProbability'] == 1
write_json('packaging-manifest-v3.json', {
    'version': OUT.name, 'asOf': '2026-10-18', 'ticker': 'CRDO',
    'sourceReviewStatus': readiness['status'], 'sourceIndependentChecksPassed': 761,
    'adapterOrDeploymentCertified': False,
    'sourceResearchModified': False, 'rawFilingsIncluded': False, 'fullTranscriptsIncluded': False,
    'preservationPolicy': 'Versioned author analysis, numeric research and independent reviews retained; historical superseded findings are identified at the package entry point.',
    'normalizationPolicy': 'Private/local source pointers become public source identities; source_verified strings become JSON booleans; original and packaged SHA-256 values remain separately recorded.',
    'packagedSources': packaging_records,
    'generatedFiles': [{'path': p.relative_to(OUT).as_posix(), 'sha256': sha(p)} for p in sorted(OUT.rglob('*')) if p.is_file() and p.name != 'packaging-manifest-v3.json'],
    'registrySHA256': sha(ROOT / 'dist/crdo-research-registry.js'),
    'packageChecks': {'annualCases': 3, 'fullAnnualRows': 30, 'guidanceRows': 90,
                      'historySlots': 10, 'observedAnnuals': 7, 'nullPrivateYears': 3,
                      'bridgeControls': 11, 'frozenOutputs': 6,
                      'localPathScan': 'pass', 'rawSourceExclusion': 'pass'},
})
print(f'Built {OUT.name}: 3 annual cases; 11 controls; 90 corrected guidance rows; 10 history slots/7 observed annuals; 6 separate frozen outputs.')
