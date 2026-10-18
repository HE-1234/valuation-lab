"""Package only independently cleared incremental research. Original fourteen files are read-only."""
import json,hashlib,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=Path('/workspace/shared/atlas-research/company-onboarding/KLAC')
OUT=ROOT/'dist/data/incremental-research-2026-10-18'
OUT.mkdir(parents=True,exist_ok=True)
source_bytes=(SRC/'valuation-readiness-v3.json').read_bytes();s=json.loads(source_bytes)
a=json.loads((SRC/'independent-audit/v3-calculations.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
assert a['auditedSha256']==sha(source_bytes) and a['allNumericalChecksPassed'] and a['auditedVersion']==s['version']
assert s['version']=='KLAC-2026-10-18-v3'
def clean(x):
 if isinstance(x,list):return [clean(v) for v in x]
 if isinstance(x,dict):return {k:clean(v) for k,v in x.items() if k not in ['file','localPath','rawEBITExtractions']}
 return x
source=clean(s)
source['integrationReview']={'status':'independently-cleared-fiscal-origin-scenario','judgment':a['judgment'],'sourceSHA256':a['auditedSha256'],'excludedHistoricalFields':'Superseded raw EBIT extractions are intentionally omitted; canonicalOperatingEBIT is authoritative.'}
(OUT/'KLAC-v3-source.json').write_text(json.dumps(source,indent=2)+'\n')
(OUT/'KLAC-v3-audit.json').write_text(json.dumps(a,indent=2)+'\n')
identity={'packageVersion':'incremental-research-2026-10-18-v1','version':s['version'],'ticker':'KLAC','currency':'USD','informationAsOf':'2026-10-18','discountOrigin':'2026-06-30','sourceSHA256':a['auditedSha256'],'packagedSourceSHA256':sha((OUT/'KLAC-v3-source.json').read_bytes()),'auditSHA256':sha((SRC/'independent-audit/v3-calculations.json').read_bytes()),'sourcePath':'./data/incremental-research-2026-10-18/KLAC-v3-source.json','auditPath':'./data/incremental-research-2026-10-18/KLAC-v3-audit.json','reportPath':'./data/incremental-research-2026-10-18/KLAC-v3.html'}
prose={
 'scope':('June 30, 2026 forecast and capital origin; research information through October 18, 2026. This retrospective scenario is neither a June-as-known backtest nor a current stock valuation. Current-price comparison is blocked.','预测及资本基准日为 2026 年 6 月 30 日，研究信息截至 2026 年 10 月 18 日。这是回溯情景，不是当时已知信息回测，也不是当前股价估值。当前价格比较已禁用。'),
 'summary':('KLA: process-control equipment and recurring service revenue, modeled separately. The audited ten-year base and cycle/export downside are analyst scenarios without assigned probabilities.','KLA：制程控制设备与经常性服务收入分别建模。已复核的十年基准情景及周期／出口下行情景均为分析假设，未赋予概率。'),
 'growth':('Product and service growth use the September-quarter guidance and second-half outlook as dated evidence. Longer-run assumptions remain below the management CY2030 midpoint; packaging is embedded once. Guidance tracking covers only three recent upcycle quarters.','产品及服务增长以九月季度指引和下半年展望为有日期的参考。长期假设低于管理层 2030 日历年目标中点；先进封装只计入一次。指引追踪仅涵盖近期上行周期的三个季度。'),
 'profitability':('Economic operating margin starts at 42.5%, peaks at 44.5% and matures at 39.5%, after a 3% recurring new-grant compensation cost. Other costs are an analyst residual including D&A, not a bottom-up forecast. The 558.1 million legacy expense is subtracted and reversed equally, creating no value uplift. Existing RSUs are diluted once.','经济营业利润率在扣除收入 3% 的持续新增股权薪酬成本后，从 42.5% 起步，最高 44.5%，成熟期为 39.5%。其他成本是包含折旧摊销的分析残差，并非逐项预测。5.581 亿美元旧奖励费用等额扣除及转回，不提高估值；现有 RSU 仅稀释一次。'),
 'capital':('FY2026 identified operating working-capital investment is 1,235.857 million and net investment is 1,217.824 million. Near-term sales/capital of 1.5–1.6 is an explicit normalization. Earlier AR + inventory − AP history is an incomplete diagnostic. R&D and operating leases stay expensed.','2026 财年已识别经营营运资本投入为 12.35857 亿美元，净投资为 12.17824 亿美元。近期增量销售／资本比 1.5–1.6 是明确的常态化假设。早期应收账款＋库存－应付账款序列是不完整的诊断指标。研发及经营租赁继续费用化。'),
 'wacc':('The initial 10.9423951% WACC uses dated 4.87% adjusted USD risk-free, 4.42% ERP and sector beta evidence. Target leverage, issuer spread and mature beta are assumptions. WACC fades to 8.83421%; no market-price fitting is used.','初期 10.9423951% WACC 使用有日期的 4.87% 调整后美元无风险利率、4.42% ERP 及行业贝塔参考。目标杠杆、发行人利差及成熟期贝塔均属假设。WACC 递减至 8.83421%，未用于拟合市场价格。'),
 'tax':('Operating tax rises from 14.5% to 21%, an analyst normalization informed by planning rates and expiring tax incentives. It is not a claim that every jurisdiction has a 21% statutory rate.','经营税率由 14.5% 升至 21%，这是参考规划税率及税收优惠到期情况的常态化假设，并非声称各司法辖区法定税率均为 21%。'),
 'terminal':('The base terminal growth is 3.5%, ROIC 20%, margin 39.5% and WACC 8.83421%. Growth is below the 4.87% adjusted USD risk-free reference. Reinvestment is NOPAT × growth / ROIC. Timing-adjusted final sales/capital aligns the last explicit year with continuation.','基准终值增长率为 3.5%、ROIC 为 20%、利润率为 39.5%、WACC 为 8.83421%。增长率低于 4.87% 调整后美元无风险参考利率。再投资＝NOPAT×增长率／ROIC。末年销售／资本比经过时间基准调整，与持续经营期衔接。'),
 'claims':('June cash and investments are 4,902.408 million; the selected operating reserve is 4,000 million. Face debt is 5,950 million and other claims are 501.634 million, including 13.3 million legacy dividends. The denominator is 1,306.983 million common shares plus 10.020743 million existing RSUs. September shares are excluded.','六月现金及投资为 49.02408 亿美元，选定经营储备为 40 亿美元。面值债务为 59.5 亿美元，其他请求权为 5.01634 亿美元，其中旧奖励股息为 1,330 万美元。分母为 13.06983 亿普通股加 1,002.0743 万现有 RSU。未混入九月股数。'),
 'claimLimits':('Prepaid tax of 169.09 million has an explicit zero base recovery assumption and a recovery sensitivity. Tax-interest mapping is unresolved over 0–45.8 million. Operating leases, purchase commitments, gross uncertain-tax benefits and EDSP assets/liabilities are not deducted twice. Litigation tails remain unquantified.','1.6909 亿美元预付税款的基准回收估值明确设为零，并提供回收敏感性。税款利息的归属尚有 0–4,580 万美元待厘清。经营租赁、采购承诺、未确认税收利益及 EDSP 资产负债均不重复扣除。诉讼尾部风险尚未量化。'),
 'uncertainty':('No probability calibration was established. All simulation drivers and annual innovations start fixed at the selected case; Run is manual. Named downside and claim sensitivities are scenarios, not confidence intervals. Any nonzero uncertainty you choose is your own analytical assumption.','未建立概率校准。模拟驱动参数及年度创新波动均从固定情景开始，须手动运行。下行情景及请求权敏感性不是置信区间；自行选择的非零不确定性属于个人分析假设。'),
 'history':('Canonical cost-line EBIT is used for all ten fiscal years. FY2020, FY2022 and FY2023 are corrected to 1,502.201, 3,654.181 and 3,994.696 million. Historical shares retain explicit split provenance. Full historical filings and conference audio were not reviewed end to end.','十个财年的营业利润统一采用按成本项目重建的规范序列。2020、2022 及 2023 财年分别更正为 15.02201、36.54181 及 39.94696 亿美元。历史股数保留拆股依据。未逐页审核所有历史申报文件或完整收听会议音频。'),
}
def case(c):
 anchor=clean(c['anchor']);anchor.update(firstModeledPeriod='FY2027',firstModeledPeriodStart='2026-07-01',fiscalCalendarCaution='Fiscal years end June 30.')
 return {'ticker':'KLAC','company':'KLA Corporation','scenario':'base','currency':'USD','moneyUnit':'millions','ratioUnit':'decimal','incrementalResearch':identity,'anchor':anchor,'forecastHorizonYears':c['forecastHorizonYears'],'valuationTiming':clean(c['valuationTiming']),'annual':clean(c['rows']),'terminal':clean(c['terminal']),'provenance':{'sourceUrls':[r['url'] for r in s['sourceLedger'] if r.get('url')],'capitalPolicyStatus':'Audited source-specific annual investment scenario'},'boundedModelGaps':[prose['scope'][0],prose['claimLimits'][0],prose['history'][0]]}
base=case(s['annualCase']);down=case(s['scenarioCases'][0])
options=[
 ('operatingCashReserve','Operating liquidity reserve',4000,3000,4902.408),('debtValue','Selected debt value',5950,5480,5950),('additionalTaxInterest','Incremental tax-interest claim',0,0,45.8),('legacyRSUVestingFraction','Existing RSU vesting fraction',1,.9,1),('prepaidTaxAssetRecovery','Prepaid-tax recovery value',0,0,169.09)]
bridge={'ticker':'KLAC','currency':'USD','referenceDate':'2026-06-30','shareDate':'2026-06-30','informationAsOf':'2026-10-18','sourceUrl':base['anchor']['provenance']['primarySourceUrl'],'cash':4902.408,'shares':1306.983,'legacyRSUs':10.020743,'debt':5950,'otherClaims':501.634,'options':[{'key':k,'label':label,'type':'number','default':value,'min':low,'max':high,'allowUnknown':True} for k,label,value,low,high in options],'fixedClaims':[{'id':k,'label':label,'amount':s['capitalBridge'][k]} for k,label in [('pensionClaim','Pension claim'),('EDSPNetClaim','Net deferred-compensation claim'),('taxClaimsUsed','Existing tax payable claim'),('interestPayableClaim','Interest payable'),('interestRateSwapNetClaim','Net interest-rate swap claim'),('legacyRSUDividendEquivalentClaim','Legacy RSU accrued-dividend claim')]],'unresolved':[prose['scope'][0],prose['claimLimits'][0]],'notes':[prose['claims'][0],prose['profitability'][0]],'shareBasis':'June 30 post-split common shares plus selected existing-RSU dilution','classification':'Retrospective fiscal-origin conditional allocation; no current-price comparison','claimCompleteness':'conditional-assumptions'}
assert abs(sum(x['amount'] for x in bridge['fixedClaims'])-501.634)<1e-8
history=[]
for row in s['normalizedInvestment']['history']:
 history.append({k:clean(row[k]) for k in ['fiscalEnd','revenue','canonicalOperatingEBIT','operatingMargin','capex','DA','capexLessDA','RAndD','SBC','coreTradeNWC','coreTradeNWCDefinition','provenance','derivation','commonSharesSplitAdjustedMillions','weightedDilutedSharesSplitAdjustedMillions','splitAdjustment']})
catalog=json.loads((ROOT/'dist/data/atlas-company-catalog-v1.json').read_text())
listing=next(row for row in catalog['companies'] if row['ticker']=='KLAC')
admission={k:listing[k] for k in ['ticker','nativeTicker','mic','exchange','securityType','verified','checkedAt','sourceURLs','evidence','robinhood']}
record={'publicTradability':admission,'identity':identity,'annualCase':base,'alternatives':[{'name':'cycle-and-export-downside','annualCase':down}],'bridge':bridge,'history':history,'prose':{k:{'en':v[0],'zh-Hans':v[1]} for k,v in prose.items()},'sources':clean(s['sourceLedger']),'auditResults':a['results'],'compensationSensitivity':clean(s['equityCompensationMethod']),'readiness':'reviewed-fiscal-origin-only'}
bundle={'schemaVersion':1,'version':'incremental-research-2026-10-18-v1','asOf':'2026-10-18','companies':[record]}
text=json.dumps(bundle,ensure_ascii=False,indent=2)+'\n'
(OUT/'cases.json').write_text(text)
(ROOT/'dist/incremental-research-registry.js').write_text('// Build-generated, independently reviewed incremental records. Original fourteen are separate.\nconst bundle='+text.rstrip()+';\nfunction freeze(value){if(value&&typeof value===\'object\'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}\nexport const incrementalRegistry=freeze(bundle);\nexport const incrementalRecord=ticker=>incrementalRegistry.companies.find(row=>row.identity.ticker===ticker)||null;\n')
# Static bilingual evidence, with no application state or automatic calculations.
esc=lambda x:html.escape(str(x),quote=True)
parts=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KLA reviewed fiscal-origin research</title><style>body{font:17px/1.6 system-ui;max-width:1100px;margin:auto;padding:24px;color:#17212b}section{border-top:1px solid #ddd;padding-top:18px;margin-top:24px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:7px;border-bottom:1px solid #ddd;text-align:right}th:first-child,td:first-child{text-align:left}.table-wrap{overflow:auto}a{color:#174e9e}.scope{border:1px solid #b88732;padding:14px}nav{display:flex;gap:20px}</style></head><body><nav><a href="../../index.html">Valuation Lab</a><a href="#english">English</a><a href="#chinese">简体中文</a></nav>']
for language,anchor in [('en','english'),('zh-Hans','chinese')]:
 parts.append(f'<article id="{anchor}" lang="{language}"><h1>KLAC · {s["version"]}</h1><p class="scope">{esc(record["prose"]["scope"][language])}</p>')
 titles={'en':{'summary':'Reviewed scenario','growth':'Revenue and growth','profitability':'Margin and equity compensation','capital':'Reinvestment','wacc':'Cost of capital','tax':'Operating tax','terminal':'Terminal economics','claims':'Dated capital claims','claimLimits':'Claims limitations','uncertainty':'Uncertainty','history':'Canonical historical context'},'zh-Hans':{'summary':'已复核情景','growth':'收入与增长','profitability':'利润率与股权薪酬','capital':'再投资','wacc':'资本成本','tax':'经营税率','terminal':'终值经济性','claims':'有日期的资本请求权','claimLimits':'请求权限制','uncertainty':'不确定性','history':'规范历史资料'}}
 for key,value in record['prose'].items():
  if key=='scope':continue
  parts.append(f'<section id="{key if language=="en" else key+"-zh"}"><h2>{titles[language][key]}</h2><p>{esc(value[language])}</p></section>')
 for name,c in [('base',base),('cycle-and-export-downside',down)]:
  result=next(x for x in a['results'] if x['scenario']==name)
  parts.append(f'<section><h2>{esc(name)}</h2><p>USD / share: {result["perShare"]:.10f} · EV: {result["EV"]:.6f} USD million · 2026-06-30</p><div class="table-wrap"><table><thead><tr><th>FY / 财年</th><th>Revenue / 收入</th><th>EBIT margin / 营业利润率</th><th>Tax / 税率</th><th>Net investment / 净投资</th><th>WACC / 资本成本</th></tr></thead><tbody>')
  for row in c['annual']:parts.append('<tr>'+''.join(f'<td>{esc(v)}</td>' for v in [row['period'],f'{row["revenue"]:.3f}',f'{row["operatingMargin"]:.3%}',f'{row["taxRate"]:.2%}',f'{row["reinvestment"]:.3f}',f'{row["wacc"]:.7%}'])+'</tr>')
  parts.append('</tbody></table></div></section>')
 parts.append('<section><h2>'+('Canonical ten-year history' if language=='en' else '十年规范历史')+'</h2><div class="table-wrap"><table><thead><tr><th>FY / 财年</th><th>Revenue / 收入</th><th>Canonical EBIT / 规范营业利润</th><th>Capex / 资本开支</th><th>D&A / 折旧摊销</th><th>Core trade NWC (partial) / 部分贸易营运资本</th></tr></thead><tbody>')
 for row in history:parts.append('<tr>'+''.join(f'<td>{esc(v)}</td>' for v in [row['fiscalEnd'],row['revenue'],row['canonicalOperatingEBIT'],row['capex'],row['DA'],row['coreTradeNWC']])+'</tr>')
 parts.append('</tbody></table></div></section></article>')
parts.append('<section id="sources"><h2>Primary sources / 一手来源</h2><ul>')
for row in record['sources']:
 if row.get('url'):parts.append(f'<li><a href="{esc(row["url"])}">{esc(row["id"])}</a> · {esc(row.get("publication_date",row.get("publicationDate","")))} · {esc(row.get("reading_scope",row.get("readingScope","Specified fields only")))}</li>')
parts.append('</ul><p><a href="KLAC-v3-source.json">Full source research JSON / 完整研究资料</a> · <a href="KLAC-v3-audit.json">Independent arithmetic review / 独立数值复核</a></p></section></body></html>')
(OUT/'KLAC-v3.html').write_text('\n'.join(parts))
print('Packaged KLAC v3; original source SHA256',a['auditedSha256'])
