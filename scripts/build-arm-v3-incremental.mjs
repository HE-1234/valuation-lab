// Re-anchor the reviewed ARM v2 research to the June 30, 2026 Q1 FY2027 6-K.
// Every forecast assumption, scenario path and analyst control is carried over
// unchanged from v2. Only the dated capital bridge, ordinary-share count and
// the opening FY2027 stub (full-year research less reported Q1 actuals) change.
// v2 files stay byte-identical; v3 is written beside them.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {calculateArm,validateArmInputs} from '../dist/arm-financial-engine.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const V2=path.join(ROOT,'dist/data/incremental-ARM-2026-10-19-v2');
const NAME='incremental-ARM-2026-10-20-v3';
const OUT=path.join(ROOT,'dist/data',NAME);
const BASE=`./data/${NAME}/`;
const read=name=>JSON.parse(fs.readFileSync(path.join(V2,name),'utf8'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(name,data)=>{const p=path.join(OUT,name);fs.writeFileSync(p,typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');return p;};
const clone=x=>structuredClone(x);
fs.mkdirSync(OUT,{recursive:true});

const SIX_K='https://www.sec.gov/Archives/edgar/data/1973239/000197323926000114/arm-20260630.htm';
const SIX_K_XBRL='https://www.sec.gov/Archives/edgar/data/1973239/000197323926000114/arm-20260630_htm.xml';
const ACCESSION='0001973239-26-000114';
const fact=(id,label,value,tag,context,extra={})=>({id,label,value,unit:'USD millions',tag,context,source:SIX_K,...extra});
// Values transcribed from the filed 6-K (XBRL instance, decimals −6) and its balance-sheet notes.
const evidence={
 schemaVersion:1,ticker:'ARM',form:'6-K',accession:ACCESSION,period:'Q1 FY2027 (April 1–June 30, 2026)',periodEnd:'2026-06-30',
 filingDate:'2026-07-29',acceptedAt:'2026-07-29T20:05:46.000Z',documentUrl:SIX_K,xbrlInstanceUrl:SIX_K_XBRL,retrieved:'2026-10-20',
 operating:[
  fact('revenue','Total revenue',1289,'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax','2026-04-01..2026-06-30'),
  fact('royalty','Royalty revenue',715,'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax','2026-04-01..2026-06-30; srt:ProductOrServiceAxis=us-gaap:RoyaltyMember'),
  fact('license','License and other revenue',574,'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax','2026-04-01..2026-06-30; srt:ProductOrServiceAxis=arm:LicenseAndOtherRevenueMember'),
  fact('silicon','Production silicon revenue',0,'derived','Total revenue equals royalty plus license and other; no product revenue line',{classification:'derived zero, not a separately tagged fact'}),
  fact('operatingIncome','Income (loss) from operations',91,'us-gaap:OperatingIncomeLoss','2026-04-01..2026-06-30'),
  fact('ppeCapex','Purchases of property and equipment',197,'us-gaap:PaymentsToAcquirePropertyPlantAndEquipment','2026-04-01..2026-06-30'),
  fact('intangibleCapex','Purchases of intangible assets',11,'us-gaap:PaymentsToAcquireIntangibleAssets','2026-04-01..2026-06-30'),
  fact('depreciationAmortization','Depreciation and amortization',75,'us-gaap:DepreciationDepletionAndAmortization','2026-04-01..2026-06-30'),
  fact('priorYearQ1Revenue','Q1 FY2026 total revenue (comparative)',1053,'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax','2025-04-01..2025-06-30')
 ],
 workingCapital:[
  fact('receivablesJun','Accounts receivable, net',1119,'us-gaap:AccountsReceivableNetCurrent','2026-06-30'),
  fact('receivablesMar','Accounts receivable, net',1300,'us-gaap:AccountsReceivableNetCurrent','2026-03-31'),
  fact('contractAssetsJun','Contract assets, current',881,'us-gaap:ContractWithCustomerAssetNetCurrent','2026-06-30'),
  fact('contractAssetsMar','Contract assets, current',977,'us-gaap:ContractWithCustomerAssetNetCurrent','2026-03-31'),
  fact('contractAssetsNoncurrentJun','Contract assets, non-current',366,'us-gaap:ContractWithCustomerAssetNetNoncurrent','2026-06-30'),
  fact('contractAssetsNoncurrentMar','Contract assets, non-current',320,'us-gaap:ContractWithCustomerAssetNetNoncurrent','2026-03-31'),
  fact('contractLiabilitiesJun','Contract liabilities, current',200,'us-gaap:ContractWithCustomerLiabilityCurrent','2026-06-30'),
  fact('contractLiabilitiesMar','Contract liabilities, current',294,'us-gaap:ContractWithCustomerLiabilityCurrent','2026-03-31'),
  fact('contractLiabilitiesNoncurrentJun','Contract liabilities, non-current',739,'us-gaap:ContractWithCustomerLiabilityNoncurrent','2026-06-30'),
  fact('contractLiabilitiesNoncurrentMar','Contract liabilities, non-current',752,'us-gaap:ContractWithCustomerLiabilityNoncurrent','2026-03-31')
 ],
 capital:[
  fact('cash','Cash and cash equivalents',3058,'us-gaap:CashAndCashEquivalentsAtCarryingValue','2026-06-30'),
  fact('shortTermInvestments','Short-term investments',830,'balance sheet line','2026-06-30',{locator:'Condensed Consolidated Balance Sheets'}),
  fact('financeLeaseCurrent','Finance lease liabilities, current',21,'us-gaap:FinanceLeaseLiabilityCurrent','2026-06-30',{locator:'Other current liabilities note'}),
  fact('otherNoncurrentLiabilitiesExEda','Other non-current liabilities excluding EDA',49,'balance sheet note','2026-06-30',{locator:'Other non-current liabilities note; includes the undisclosed non-current finance lease portion'}),
  fact('edaCurrent','Electronic design automation liabilities, current',56,'arm:ElectronicDesignAutomationLiabilitiesCurrent','2026-06-30'),
  fact('edaNoncurrent','Electronic design automation liabilities, non-current',92,'arm:ElectronicDesignAutomationLiabilitiesNoncurrent','2026-06-30'),
  fact('equityInvestments','Equity investments',589,'balance sheet line','2026-06-30',{locator:'Condensed Consolidated Balance Sheets'}),
  fact('quotedEquityInvestments','Publicly listed equity securities (fair value)',290,'us-gaap:EquitySecuritiesFvNiCurrentAndNoncurrent','2026-06-30'),
  fact('dreamBig','DreamBig acquisition cash consideration (closed July 1, 2026)',265,'Note 16 – Subsequent Events','2026-07-01',{classification:'subsequent event; approximately $265.0m subject to adjustments'}),
  {id:'ordinaryShares',label:'Ordinary shares issued and outstanding',value:1068,unit:'million shares',tag:'us-gaap:CommonStockSharesOutstanding','context':'2026-06-30',source:SIX_K,decimals:-6,classification:'Reported rounded to the nearest million; no exact June 30 count is filed. Precision is about ±0.5 million shares (±0.05%).'}
 ]
};
const v=Object.fromEntries([...evidence.operating,...evidence.workingCapital,...evidence.capital].map(x=>[x.id,x.value]));
const nwc=(r,ca,can,cl,cln)=>r+ca+can-cl-cln;
const nwcJun=nwc(v.receivablesJun,v.contractAssetsJun,v.contractAssetsNoncurrentJun,v.contractLiabilitiesJun,v.contractLiabilitiesNoncurrentJun);
const nwcMar=nwc(v.receivablesMar,v.contractAssetsMar,v.contractAssetsNoncurrentMar,v.contractLiabilitiesMar,v.contractLiabilitiesNoncurrentMar);
const ttmRevenue=4920-v.priorYearQ1Revenue+v.revenue;
const derived={
 netCapex:{value:v.ppeCapex+v.intangibleCapex-v.depreciationAmortization,formula:'PPE purchases + intangible purchases − depreciation and amortization'},
 modelWorkingCapitalChange:{value:nwcJun-nwcMar,formula:'Δ(receivables + current and non-current contract assets − current and non-current contract liabilities), March 31 to June 30',june:nwcJun,march:nwcMar},
 cashAndShortInvestments:{value:v.cash+v.shortTermInvestments,formula:'cash and cash equivalents + short-term investments'},
 financeLeaseConservativeBound:{value:v.financeLeaseCurrent+v.otherNoncurrentLiabilitiesExEda,formula:'reported current finance lease + all other non-current liabilities excluding EDA (the non-current lease portion is not separately disclosed)',classification:'conservative upper bound, not the reported total'},
 edaObligations:{value:v.edaCurrent+v.edaNoncurrent,formula:'current + non-current EDA liabilities'},
 ttmRevenue:{value:ttmRevenue,formula:'FY2026 revenue 4,920 − Q1 FY2026 1,053 + Q1 FY2027 1,289'},
 minimumOperatingCash:{value:Math.round(ttmRevenue*.05*10)/10,formula:'5% × trailing-twelve-month revenue (same 5% analyst ratio as v2)'}
};
evidence.derived=derived;
if(v.royalty+v.license+v.silicon!==v.revenue)throw Error('Q1 revenue components do not reconcile');

const v2Inputs=read('dcf-inputs-v2.json');
const inputs=clone(v2Inputs);
Object.assign(inputs,{information_cutoff:'2026-10-20',valuation_anchor:'2026-06-30',
 lookahead_warning:'Uses information available by October 20 on a June 30 capital anchor; conditional restated-date appraisal, not historical backtest or current October target. No market price comparison.'});
Object.assign(inputs.capital,{cash_short_investments:derived.cashAndShortInvestments.value,finance_lease:derived.financeLeaseConservativeBound.value,
 eda_obligations:derived.edaObligations.value,acquisition_reserve:265,minimum_operating_cash:derived.minimumOperatingCash.value,ordinary_shares:v.ordinaryShares,
 equity_investment_policy:'Exclude all 589m equity investments, including 290m publicly listed; zero assigned bridge value is conservative, not a liquidity classification.',
 acquisition_timing_policy:'Nominal 265m DreamBig cash purchase closed July 1, the day after the June 30 origin; reserved at June 30 without discounting. Excludes unknown acquired cash/liabilities and standalone synergy value.'});
inputs.opening_stub={period:'FY2027 nine months after reported Q1',start:'2026-07-01',end:'2027-03-31',duration_years:.75,source_url:SIX_K,
 elapsed:{royalty:v.royalty,license:v.license,silicon:v.silicon,operating_income:v.operatingIncome,net_capex:derived.netCapex.value,model_nwc_change:derived.modelWorkingCapitalChange.value}};
validateArmInputs(inputs);
const outputs=Object.fromEntries(['bear','base','bull'].map(n=>[n,calculateArm(inputs,n)]));
for(const [n,o]of Object.entries(outputs))if(o.funding_required||o.value_per_ads===null)throw Error(`${n} unexpectedly requires funding`);

// Sensitivities mirror the v2 grid with the v3 inputs.
const sensitivity={wacc_growth:[],sbc_economic_margin:[]};
for(const wacc of [.08,.09,.1,.11,.12])for(const g of [.02,.03,.04]){try{const o=calculateArm(inputs,'base',{wacc,g});sensitivity.wacc_growth.push({wacc,g,value_per_ads:o.value_per_ads,enterprise_value:o.enterprise_value,status:o.status});}catch(e){sensitivity.wacc_growth.push({wacc,g,value_per_ads:null,status:'invalid_assumptions',message:e.message});}}
for(const [change,name]of [[-.05,'sbc_margin_cost_5pp'],[-.1,'sbc_margin_cost_10pp'],[.05,'sbc_margin_relief_5pp']]){const c=clone(inputs.cases.base);c.ip_ebit_margin=c.ip_ebit_margin.map(x=>x+change);c.silicon_ebit_margin=c.silicon_ebit_margin.map(x=>x+change);try{const o=calculateArm(inputs,c);sensitivity.sbc_economic_margin.push({name,change,value_per_ads:o.value_per_ads,status:o.status});}catch(e){sensitivity.sbc_economic_margin.push({name,change,value_per_ads:null,status:'invalid_assumptions',message:e.message});}}

const fmt=(x,d=4)=>x.toFixed(d);
const pct=x=>Math.round(x*100);
const per=n=>outputs[n].value_per_ads,ts=n=>pct(outputs[n].terminal_share);
const c2=read('cases.json'),record=clone(c2.companies[0]);
const bridgeAmount=inputs.capital.cash_short_investments-inputs.capital.finance_lease-inputs.capital.eda_obligations-inputs.capital.acquisition_reserve-inputs.capital.minimum_operating_cash;
const prose={
 summary:[`Arm monetizes processor architecture and IP through licenses and per-chip royalties. Moving into production silicon creates a separate capital, inventory and margin model. Conditional bear/base/bull values are $${fmt(per('bear'))}/$${fmt(per('base'))}/$${fmt(per('bull'))} per ADS at the June 30, 2026 origin, with about ${ts('bear')}%/${ts('base')}%/${ts('bull')}% of enterprise value in terminal cash flows. No probabilities, current stock quote, upside or recommendation is supplied.`,
  `Arm 通过处理器架构及设计授权、逐芯片版税变现。进入量产芯片业务会引入独立的资本、库存与利润模型。以 2026 年六月三十日为起点，有条件熊／基准／牛情景为每 ADS ${fmt(per('bear'))}／${fmt(per('base'))}／${fmt(per('bull'))} 美元，终值约占企业价值 ${ts('bear')}%／${ts('base')}%／${ts('bull')}%。没有赋予概率、引用当前股价、计算上涨空间或提出投资建议。`],
 scope:['June 30, 2026 is the capital and discount origin, taken from the Q1 FY2027 6-K filed July 29, 2026; information extends to October 20, 2026. The first cash flow is the nine months July 2026–March 2027: full-year FY2027 research less reported Q1 revenue, operating income and investment, discounted 0.75 years. Nine further FY2028–36 cash flows use year-end discounting; FY2037 is terminal. This is a restated-date conditional appraisal, neither a historical backtest nor an October 20 current valuation. Current value, target, upside and ranking gates remain false even if a quote is entered.',
  '资本与折现起点为 2026 年六月三十日，取自 2026 年七月二十九日提交的 2027 财年第一季 6-K；信息截至十月二十日。首个现金流为 2026 年七月至 2027 年三月九个月：2027 财年全年研究假设减去已报告第一季收入、营业利润及投资，折现 0.75 年。其后 2028–2036 九个财年按年末折现，2037 为终值年。这是带后续信息的指定日期条件估值，不是历史回测或十月二十日当前估值。即使输入股价，当前估值、目标价、上涨空间及排名资格仍关闭。'],
 bridge:[`June 30 cash $3,058m plus short-term investments $830m ($3,888m) minus finance leases $70m, existing EDA liabilities $148m ($56m current/$92m noncurrent), DreamBig reserve $265m and minimum operating cash $257.8m yields $${bridgeAmount.toLocaleString('en-US',{maximumFractionDigits:1})}m. The 6-K reports only the $21m current finance lease; the noncurrent portion sits inside $49m of other non-current liabilities, so $70m is a conservative upper bound, not the reported total. Minimum operating cash is 5% of trailing revenue $5,156m. All $589m equity investments receive zero bridge value, including $290m publicly listed. Operating leases are not separately deducted because rent remains expensed.`,
  `六月三十日现金 3,058 加短期投资 830（合计 3,888），减融资租赁 70、既有 EDA 义务 148（流动 56／非流动 92）、DreamBig 预留 265 及最低经营现金 257.8，桥接净额 ${bridgeAmount.toLocaleString('en-US',{maximumFractionDigits:1})} 百万美元。6-K 仅单列流动融资租赁 21；非流动部分含在其他非流动负债 49 内，因此 70 为保守上限，并非已报告合计。最低经营现金为过去十二个月收入 5,156 的 5%。全部股权投资 589（含上市持股 290）在桥接中计零。经营租赁不另扣，因为租金仍费用化。`],
 acquisition:['The June-quarter 6-K says DreamBig closed July 1, 2026 for about $265m cash, one day after the June 30 origin. The bridge reserves nominal $265m at June 30 without discounting. This is a conservative analyst reserve, not exact transaction present value. Acquired cash/liabilities and final adjustments are not separately modeled, are not charged again as forecast investment, and receive no independent synergy value.',
  '六月季度 6-K 称 DreamBig 于 2026 年七月一日、即六月三十日起点次日完成，现金价约 265 百万美元。桥接在六月三十日预留名义金额 265，不折现。这是保守分析预留，不是精确交易现值。未分别建模被收购现金／负债及最终调整，不在未来投资重复扣除，也不另加协同价值。'],
 awards:['June 30 ordinary shares are 1,068m as filed, rounded to the nearest million; no exact June count is filed, so precision is about ±0.5m (±0.05%). One ADS represents one ordinary share. This is neither the quarterly diluted average of 1,078m nor a market-cap proxy. The v2 March 31 exact count was 1,064,055,252. June Omnibus awards rose to about 24m; ungranted PSUs are excluded. June unrecognized Omnibus compensation is $3,621.9m over 1.6 years. Plan headroom is not issued dilution.',
  '六月三十日普通股按申报为 1,068 百万股，四舍五入至百万；未申报六月精确股数，精度约 ±0.5 百万（±0.05%）。每份 ADS 代表一股普通股。这不同于季度稀释平均 1,078 百万，也非市值代理。v2 三月三十一日精确股数为 1,064,055,252。六月 Omnibus 奖励约 24 百万，未定授予日 PSU 不含在内。六月未确认 Omnibus 薪酬 3,621.9／1.6 年。计划额度不是已发行稀释。'],
 sbc:['Baseline margins charge cash-equivalent economic SBC and expense R&D, with fixed June 30 shares. This replacement-compensation convention is not exact legal allocation among shares and awards, or a claim of no real future dilution. Economic margin shocks of −5pp/−10pp/+5pp and a separate 19m extra-share denominator expose risk. The share diagnostic may overlap already charged compensation, omits ungranted PSUs and is not a maximum dilution bound. Precise claims require grant-level fair value/vesting. Treasury is economic replacement cash, not a GAAP cash forecast.',
  '基准利润率扣除现金等价经济股权薪酬，研发费用化，股数固定为六月三十日数。这是替代薪酬约定，不是股份与奖励的精确法律分配，也不声称现实中无未来稀释。经济利润率 −5／−10／+5 个百分点及另加 19 百万股分母诊断展示风险。股数诊断可能与已扣薪酬重叠、遗漏未定授予 PSU，不能视为最大稀释界限。精确请求权需逐笔授予估值／归属模型；资金模型是经济替代现金，而非 GAAP 现金预测。'],
 stub:[`Opening stub (July 2026–March 2027): full-year FY2027 research revenue less reported Q1 royalty $715m and license $574m; full-year EBIT less reported Q1 operating income $91m; full-year net productive investment less reported Q1 net capex $${derived.netCapex.value}m (PPE $197m + intangibles $11m − D&A $75m); full-year working-capital investment less the reported Q1 change of $${derived.modelWorkingCapitalChange.value}m in receivables, contract assets and contract liabilities. Q1 cash flows are already in June 30 cash and are not valued again. Tax applies to stub EBIT.`,
  `期初期间（2026 年七月至 2027 年三月）：2027 财年全年研究收入减已报告第一季版税 715 及授权 574；全年营业利润减第一季营业利润 91；全年净生产性投资减第一季净资本开支 ${derived.netCapex.value}（PPE 197＋无形资产 11－折旧摊销 75）；全年营运资本投资减第一季应收、合同资产及合同负债变动 ${derived.modelWorkingCapitalChange.value}。第一季现金流已包含于六月三十日现金，不再重复估值。税款按期间营业利润计算。`]
};
for(const [k,[en,zh]]of Object.entries(prose))record.prose[k]={en,'zh-Hans':zh};
record.prose.recentQuarter.en+=' These Q1 actuals are now pinned in the June 30 origin.';
record.prose.recentQuarter['zh-Hans']+='这些第一季实际值现已固定于六月三十日起点。';

const identity=record.identity;
Object.assign(identity,{packageVersion:NAME,version:'2026-10-20-arm-conditional-v3',informationAsOf:'2026-10-20',informationCutoff:'2026-10-20',discountOrigin:'2026-06-30',reportedBalanceDate:'2026-06-30',
 valuationLabel:'June 30 capital origin with October 20 information; dated analyst-constrained conditional research',priorPackageVersion:'incremental-ARM-2026-10-19-v2'});
record.publicTradability=clone(record.publicTradability);
const scopeEN=prose.scope[0];
const annualCase=(src,outputName)=>{
 const a=clone(src),o=outputs[outputName];
 a.incrementalResearch=identity;a.valuationTiming={discountOrigin:'2026-06-30',openingStubYears:.75,openingStubStart:'2026-07-01',openingStubEnd:'2027-03-31'};
 a.anchor={...a.anchor,classification:'June 30 capital origin with October 20 information; FY2027 inputs are full-year research and only the nine months after reported Q1 are valued',classificationZh:'六月三十日资本起点，信息截至十月二十日；2027 财年输入为全年研究假设，仅估值已报告第一季之后的九个月',latestReportedQuarterEnd:'2026-06-30',firstModeledPeriodStart:'2026-07-01'};
 // Annual inputs stay full-year research. Row 1 investment changes only because the
 // opening operating-cash reserve is now 5% of trailing June revenue.
 a.annual=a.annual.map((r,i)=>{const reinvestment=i===0?o.rows[0].full_year_reinvestment:o.rows[i].reinvestment;if(i>0&&Math.abs(reinvestment-r.reinvestment)>1e-9)throw Error('unexpected later-year investment change');return {...r,reinvestment,sourceRow:clone(o.rows[i])};});
 a.boundedModelGaps=[scopeEN,...a.boundedModelGaps.slice(1)].map(x=>x.replace('with fixed March shares','with fixed June 30 shares'));
 a.bridgeOptions={...a.bridgeOptions,minimumOperatingCash:inputs.capital.minimum_operating_cash};
 return a;
};
record.annualCase=annualCase(record.annualCase,'base');
record.alternatives=record.alternatives.map(x=>({...x,annualCase:annualCase(x.annualCase,x.name)}));
const b=record.bridge;
Object.assign(b,{referenceDate:'2026-06-30',reportedBalanceDate:'2026-06-30',shareDate:'2026-06-30',informationAsOf:'2026-10-20',sourceUrl:SIX_K,
 shares:v.ordinaryShares,ordinaryShares:v.ordinaryShares,cash:inputs.capital.cash_short_investments,reportedCash:inputs.capital.cash_short_investments,reportedShares:v.ordinaryShares,reportedSharesDate:'2026-06-30',
 shareBasis:'1,068 million ordinary shares at June 30 as filed (rounded to the nearest million); 1 ADS represents 1 ordinary share. Economic SBC remains expensed; not a legal grant-level allocation.',
 balanceClassification:'June 30 capital origin with October 20 information; dated analyst-constrained conditional research',
 classification:'Dated conditional research; filed June 30 shares (rounded), October 20 information and economic replacement SBC',
 allocationMethod:'conditional-equity-over-filed-June-ordinary-shares-and-1-to-1-ADS',
 fixedClaims:[{id:'financeLease',label:'Finance lease obligations (conservative bound)',amount:inputs.capital.finance_lease},{id:'edaObligations',label:'Existing EDA obligations',amount:inputs.capital.eda_obligations}],
 excludedEquityInvestments:{total:589,quoted:290,other:299,bridgeValue:0},
 notes:[prose.bridge[0],prose.acquisition[0],prose.awards[0],prose.sbc[0],b.notes[4],prose.stub[0]],
 unresolved:[scopeEN,b.unresolved[1],b.unresolved[2]]});
for(const scenario of Object.values(b.defaultOptionsByScenario))scenario.minimumOperatingCash=inputs.capital.minimum_operating_cash;
b.options=b.options.map(o=>o.key==='minimumOperatingCash'?{...o,default:inputs.capital.minimum_operating_cash}:o);
record.sourceInputs=inputs;
record.sourceOutputs=outputs;
record.sources=[{file:'arm-20260630.htm',url:SIX_K,publication_date:'2026-07-29',retrieved_utc:'2026-10-20',id:'q1-fy2027-6k',retrieved:'2026-10-20',evidence:'Primary public source (Form 6-K, Q1 FY2027 condensed financial statements); linked, not redistributed'},...record.sources];

write('dcf-inputs-v3.json',inputs);
write('dcf-output-v3.json',outputs);
write('q1-fy2027-evidence-v3.json',evidence);
write('sensitivities-v3.json',sensitivity);
const evidencePath=BASE+'q1-fy2027-evidence-v3.json';
Object.assign(identity,{sourcePath:BASE+'dcf-inputs-v3.json',sourceSHA256:sha(path.join(OUT,'dcf-inputs-v3.json')),packagedSourceSHA256:sha(path.join(OUT,'dcf-inputs-v3.json')),
 originalSourceSHA256:identity.originalSourceSHA256,conditionalOutputsPath:BASE+'dcf-output-v3.json',latestQuarterEvidencePath:evidencePath,latestQuarterEvidenceSHA256:sha(path.join(OUT,'q1-fy2027-evidence-v3.json')),reportPath:BASE+'ARM-v3.html'});
record.evidence={...record.evidence,conditionalOutputsPath:BASE+'dcf-output-v3.json',conditionalOutputs:outputs,latestQuarterEvidencePath:evidencePath,classification:identity.valuationLabel};
record.auditResults={status:'Re-anchored v2 research; engine replay checks only',priorAudit:record.auditResults,baseline_values:Object.fromEntries(Object.entries(outputs).map(([k,o])=>[k,o.value_per_ads])),
 checks:['v2 March inputs still reproduce every saved v2 output field','Q1 royalty + license + silicon equals reported total revenue','every scenario solves without external funding','v3 sensitivity grid recomputed'],
 finalDisposition:'Mechanical re-anchor of independently reviewed v2 assumptions to filed June 30 data; the re-anchor itself has not been independently reviewed'};
record.readiness='reviewed-dated-analyst-constrained-research';

const bundle={schemaVersion:1,version:NAME,asOf:'2026-10-20',companies:[record]};
write('cases.json',bundle);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rows=Object.entries(outputs).map(([n,o])=>`<tr><td>${n}</td><td>${fmt(o.enterprise_value,1)}</td><td>${fmt(o.bridge,1)}</td><td>${fmt(o.equity_value,1)}</td><td>${fmt(o.value_per_ads)}</td><td>${pct(o.terminal_share)}%</td></tr>`).join('');
const facts=[...evidence.operating,...evidence.workingCapital,...evidence.capital].map(f=>`<tr><td>${esc(f.label)}</td><td>${f.value}</td><td>${esc(f.tag)}</td><td>${esc(f.context)}</td></tr>`).join('');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARM June 30 re-anchor</title><style>body{font:16px/1.6 system-ui;max-width:1000px;margin:auto;padding:24px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #ccc;padding:4px 6px;text-align:left}section{margin:24px 0}</style><body><nav><a href="../../index.html">Valuation Lab</a> · <a href="#chinese">简体中文</a> · <a href="../incremental-ARM-2026-10-19-v2/ARM-v2.html">Full v2 research (March 31 origin)</a></nav>
<article id="english" lang="en"><h1>ARM · 2026-06-30</h1>${['scope','summary','stub','bridge','awards','acquisition','sbc'].map(k=>`<section><p>${esc(record.prose[k].en)}</p></section>`).join('')}
<section><h2>Scenario outputs (USD millions; per ADS in USD)</h2><table><tr><th>Case</th><th>Operating EV</th><th>Bridge</th><th>Equity</th><th>Per ADS</th><th>Terminal share</th></tr>${rows}</table></section>
<section><h2>Q1 FY2027 filed facts</h2><p><a href="${SIX_K}">Form 6-K, filed July 29, 2026 (${ACCESSION})</a></p><table><tr><th>Field</th><th>Value</th><th>Tag / locator</th><th>Period</th></tr>${facts}</table></section></article>
<article id="chinese" lang="zh-Hans"><h1>ARM · 2026-06-30</h1>${['scope','summary','stub','bridge','awards','acquisition','sbc'].map(k=>`<section><p>${esc(record.prose[k]['zh-Hans'])}</p></section>`).join('')}</article>
<p><a href="dcf-inputs-v3.json">Inputs</a> · <a href="dcf-output-v3.json">Outputs</a> · <a href="q1-fy2027-evidence-v3.json">Q1 evidence</a> · <a href="sensitivities-v3.json">Sensitivities</a></p></body></html>
`;
write('ARM-v3.html',html);
write('README.md',`# ARM v3: June 30, 2026 re-anchor\n\nRe-anchors the independently reviewed ARM v2 research (March 31, 2026 origin) to the Q1 FY2027 Form 6-K (period ended June 30, 2026; filed July 29, 2026; ${SIX_K}).\n\nUnchanged from v2: every scenario growth, margin, investment, tax, WACC, terminal and funding assumption.\n\nChanged: capital and discount origin (June 30), cash and short-term investments, EDA obligations, finance leases (conservative bound), minimum operating cash (5% of trailing revenue), ordinary shares (1,068m as filed, rounded) and the FY2027 opening stub (full year less reported Q1).\n\nThe re-anchor is mechanical and has not been independently reviewed. Values: ${Object.entries(outputs).map(([k,o])=>`${k} $${fmt(o.value_per_ads)}`).join(', ')} per ADS.\n\nRebuild with \`node scripts/build-arm-v3-incremental.mjs\`.\n`);
const registry='// Generated ARM v3 dated analyst-constrained research (June 30, 2026 origin). No raw corporate documents.\nconst bundle='+JSON.stringify(bundle,null,2)+';\nfunction freeze(x){if(x&&typeof x===\'object\'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}\nexport const armRegistry=freeze(bundle);\n';
fs.writeFileSync(path.join(ROOT,'dist/arm-research-registry.js'),registry);
console.log(Object.fromEntries(Object.entries(outputs).map(([k,o])=>[k,{ev:o.enterprise_value,perAds:o.value_per_ads,terminalShare:o.terminal_share}])));
console.log('bridge',bridgeAmount,'derived',JSON.stringify(derived));
