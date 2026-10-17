#!/usr/bin/env python3
"""Rebuild separately versioned analyst base cases, never edit reported source records.
All forecasts below are educational judgments made 2026-10-17, not issuer forecasts.
"""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASOF='2026-10-17'
universe=json.loads((ROOT/'dist/data/current-universe.json').read_text())
market=json.loads((ROOT/'dist/data/current-market-references.json').read_text())
companies={c['ticker']:c for c in universe['companies']}
source={}
def src(key,title,url,date,kind='issuer-reported evidence'):
 source[key]={'title':title,'url':url,'publishedAt':date,'retrievedAt':ASOF,'classification':kind};return key
src('treasury','US Treasury 10-year nominal USD yield, October 16, 2026',market['riskFreeReference']['sourceURL'],'2026-10-16','observed market reference')
src('erp-reference','Damodaran January 2026 implied US equity-risk premium',market['equityRiskPremiumReference']['sourceURL'],'2026-01-23','dated third-party model estimate, not October ERP')
releases={
'AAPL':('Apple fiscal Q3 2026 results','https://www.apple.com/newsroom/2026/07/apple-reports-third-quarter-results/','2026-07-30'),
'MSFT':('Microsoft fiscal Q4 and FY2026 results','https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast','2026-07-29'),
'AMZN':('Amazon Q2 2026 results','https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Second-Quarter-Results/default.aspx?mode=light','2026-07-30'),
'GOOG':('Alphabet Q2 2026 issuer earnings release filed with SEC','https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/googexhibit991q22026.htm','2026-07-22'),
'META':('Meta Q2 2026 results','https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Second-Quarter-2026-Results/','2026-07-29'),
'NVDA':('NVIDIA fiscal Q2 2027 results and Q3 outlook','https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2027/','2026-08-26'),
'TSLA':('Tesla Q2 2026 production, deliveries and storage deployments','https://ir.tesla.com/press-release/tesla-second-quarter-2026-production-deliveries-and-deployments','2026-07-02'),
'COHR':('Coherent fiscal Q4 and FY2026 issuer release filed with SEC','https://www.sec.gov/Archives/edgar/data/820318/000119312526346860/d128030dex991.htm','2026-08-12'),
'LITE':('Lumentum fiscal Q4 and FY2026 results','https://investor.lumentum.com/financial-news-releases/news-details/2026/Lumentum-Announces-Fourth-Quarter-and-Full-Fiscal-Year-2026-Results/default.aspx','2026-08-11'),
'AAOI':('Applied Optoelectronics Q2 2026 results and Q3 outlook','https://investors.ao-inc.com/news-releases/news-release-details/applied-optoelectronics-reports-second-quarter-2026-results?hss_channel=lcp-744608','2026-08-06'),
'NBIS':('Nebius Q2 2026 shareholder letter','https://assets.nebius.com/assets/a6ecfd85-a6cb-4967-8ef7-9a25bd261f9c/SHLQ226.pdf?cache-buster=2026-08-12T11%3A54%3A46.695Z','2026-08-12'),
'MU':('Micron fiscal Q4 and FY2026 results','https://investors.micron.com/news/press-release/2026/Micron-Technology-Inc--Reports-Record-Fiscal-Fourth-Quarter-and-Full-Year-2026-Results/default.aspx','2026-09-30'),
'AVGO':('Broadcom fiscal Q3 2026 results and Q4 outlook','https://investors.broadcom.com/news-releases/news-release-details/broadcom-inc-announces-third-quarter-fiscal-year-2026-financial','2026-09-02'),
'TSM':('TSMC Q3 2026 results and Q4 outlook','https://investor.tsmc.com/japanese/encrypt/files/encrypt_file/reports/2026-10/526b65af7305df2dde6b9ece6812b1fdf1e49f9b/3Q26%20EarningsRelease.pdf','2026-10-15')}
for t,(title,url,date) in releases.items():src(t+'-release',title,url,date)
# growth, mature EBIT margin, normalized tax, incremental sales/capital, WACC,
# terminal growth, terminal ROIC. Ratios are fractions; sales/capital is a multiple.
params={
'AAPL':(.08,.32,.20,3,.09,.025,.20),
'MSFT':(.18,.42,.22,.6,.095,.025,.16),
'AMZN':(.14,.15,.24,.8,.10,.025,.10),
'GOOG':(.18,.30,.22,.7,.10,.025,.15),
'META':(.20,.35,.20,.5,.10,.025,.12),
'NVDA':(.40,.45,.20,2,.11,.025,.25),
'TSLA':(.12,.12,.25,1.3,.12,.025,.12),
'COHR':(.25,.20,.24,1.25,.105,.025,.12),
'LITE':(.35,.25,.22,1.2,.115,.025,.14),
'AAOI':(.60,.12,.25,.8,.135,.025,.10),
'NBIS':(.85,.25,.25,.6,.155,.025,.12),
'MU':(.08,.35,.20,.8,.11,.02,.12),
'AVGO':(.35,.45,.20,2,.10,.025,.20),
'TSM':(.22,.45,.20,.9,.10,.02,.18)}
# Beta, target market-value debt weight, assumed debt spread over USD Treasury,
# extra equity risk allowance. These are estimates, not regressions or quotes.
wacc_inputs={
'AAPL':(1,.10,.007,0),'MSFT':(1,.05,.005,0),'AMZN':(1.2,.10,.01,0),
'GOOG':(1.1,.05,.008,0),'META':(1.2,.10,.01,0),'NVDA':(1.4,.03,.01,0),
'TSLA':(1.6,.05,.015,0),'COHR':(1.5,.20,.025,0),'LITE':(1.6,.15,.025,0),
'AAOI':(1.8,.10,.035,.01),'NBIS':(2.1,.10,.04,.02),'MU':(1.4,.10,.015,0),
'AVGO':(1.3,.15,.015,0),'TSM':(1.2,.10,.015,.015)}
# Each block: summary; growth; margin; tax; reinvestment; terminal returns; risk;
# reported release anchor; uncertainties; specialist/model limitations; bridge.
research={
'AAPL':{
'summary':'A mature hardware franchise with recurring services: moderate expansion, durable margins and relatively light incremental capital needs.',
'growth':'8% starts above FY2025 growth of 6.4% but below the latest 16% quarter. Services and replacement demand support growth; the installed base and hardware maturity argue for an immediate fade rather than extrapolating one strong quarter.',
'targetMargin':'32% is close to FY2025 operating margin and below the current 33.2% TTM. Services mix offsets hardware competition; the latest tariff-refund benefit is not assumed permanent.',
'tax':'20% is a normalized blended cash-tax judgment above FY2025 accounting tax of 15.6%; one-off tax charges, geographic mix and minimum-tax changes make any single reported rate a weak long-run anchor.',
'salesCapital':'3.0x requires about $0.33 of net reinvestment for each extra $1 of revenue. Outsourced manufacturing and services justify lighter capital needs; this is not the inflated book return created by buybacks or a claim that working capital is free.',
'terminalROIC':'20% retains a brand/ecosystem advantage but materially reduces returns on new capital from the explicit-period margin/capital combination.',
'risk':'Assumed beta 1.0, modest 10% target debt and a 0.7-point debt spread reflect broad cash generation, balanced against product concentration and supply-chain exposure.',
'anchor':'Fiscal Q3 2026 revenue was $109.4bn, up 16%; reported gross margin included approximately two percentage points of favorable tariff refunds.',
'uncertainties':['iPhone replacement cycles, China demand, tariffs and memory/input costs','Services regulation and the cost of supporting AI features'],
'limits':['Consolidated linear growth does not separately forecast hardware units, prices or services.'],
'bridge':'Long-dated securities, leases and employee awards need a consistent enterprise-to-common-equity reconciliation; zero additional assets does not mean the securities are worthless.'},
'MSFT':{
'summary':'Cloud and enterprise software sustain growth, while AI infrastructure reduces the capital efficiency of the historical software model.',
'growth':'18% begins near FY2026 reported growth. Azure and recurring enterprise subscriptions support the starting rate, which then fades to 2.5% as the revenue base expands.',
 'targetMargin':'42% is below FY2026 operating margin of 46.8%. Recurring software remains profitable, but AI depreciation, inference costs and competition constrain permanent peak-margin extrapolation.',
 'tax':'22% allows a higher normalized burden than FY2026 accounting tax of 19.4%; it does not extend discrete investment-related tax effects indefinitely.',
 'salesCapital':'0.6x means $1.67 of incremental net capital per extra $1 of revenue. FY2026 cash capex was $115.9bn; AI capacity makes an old asset-light software ratio inappropriate. It remains a normalized net-reinvestment assumption, not gross capex guidance.',
 'terminalROIC':'16% assumes a persistent distribution and switching-cost advantage while fading returns as cloud infrastructure becomes a larger part of the business.',
 'risk':'Assumed beta 1.0, 5% target debt and a 0.5-point debt spread reflect diversified recurring revenue and modest financing risk, with AI-demand uncertainty still present.',
 'anchor':'FY2026 revenue was $331.8bn and operating income $155.2bn; Q4 revenue grew 18%.',
 'uncertainties':['AI monetization and customer returns on infrastructure spending','GPU useful lives, finance leases and capacity utilization'],
 'limits':['One sales/capital ratio smooths the front-loaded infrastructure buildout and may overstate early cash flow.'],
 'bridge':'Finance-lease obligations and non-operating investments are material. Lease capitalization must be reconciled with operating profit and reinvestment, not deducted a second time mechanically.'},
'AMZN':{
'summary':'AWS, advertising and fulfillment efficiency raise consolidated profitability, with a heavy infrastructure bill and lower-margin retail still central.',
'growth':'14% sits between FY2025 growth of 12.4% and Q2 2026 growth of 20%. AWS and advertising support expansion, but they cannot justify applying their segment growth to all retail revenue.',
 'targetMargin':'15% improves on 12.1% TTM as AWS/advertising mix and retail efficiency rise. It remains far below AWS segment margins because consolidated sales include substantial low-margin commerce.',
 'tax':'24% is a normalized operating-tax assumption. Recent investment gains distort pretax income and the accounting effective rate, so those gains do not set operating cash tax.',
 'salesCapital':'0.8x requires $1.25 of net reinvestment per incremental $1 of sales. AI data centers, fulfillment and working capital keep reinvestment high even with supplier financing; early modeled FCFF can be negative.',
 'terminalROIC':'10% assumes mature capital earns approximately the cost of capital. Scale advantages are largely competed away after the explicit growth period.',
 'risk':'Assumed beta 1.2, 10% target debt and a 1-point debt spread balance resilient diversified businesses against discretionary spending and the infrastructure funding cycle.',
 'anchor':'Q2 revenue grew 20%, AWS revenue grew 37%, and TTM free cash flow was an outflow of $7.6bn. The release separately identified non-operating investment gains.',
 'uncertainties':['AWS capacity economics and depreciation versus AI demand','Retail wage, shipping and competitive pressures; investment gains are not operating earnings'],
 'limits':['A single margin hides very different AWS, advertising and retail economics; net reinvestment is not the company free-cash-flow reconciliation.'],
 'bridge':'Review operating/finance leases, financing obligations and minority investments. Current cash is not a complete appraisal of all non-operating assets.'},
'GOOG':{
'summary':'Search and Cloud continue growing, but AI delivery costs, capital intensity and regulatory risk temper long-run margins.',
'growth':'18% is below the latest 24% quarter and above FY2025 growth of 15.1%. Cloud expansion supports the uplift, while Search scale and competitive substitution force a deceleration.',
 'targetMargin':'30% is below 33.1% TTM. Search monetization and Cloud scale are offset by AI compute costs, traffic acquisition and investment in new products.',
 'tax':'22% normalizes operating taxes above recent effective rates; very large non-operating equity gains make consolidated pretax-income tax ratios unsuitable as a direct operating forecast.',
 'salesCapital':'0.7x requires $1.43 of net investment per extra $1 of revenue. The current AI buildout warrants much more capital than the historic search-only model.',
 'terminalROIC':'15% retains valuable distribution and software assets but reduces returns as competition and infrastructure intensity rise.',
 'risk':'Assumed beta 1.1, 5% target debt and a 0.8-point debt spread reflect strong core cash flow plus search-transition and regulatory exposure.',
 'anchor':'Q2 2026 revenue was $119.8bn, up 24%, with a 34% operating margin; Google Cloud revenue rose 82%.',
 'uncertainties':['AI query economics, traffic acquisition and regulatory remedies','Mandatory-convertible preferred securities and non-marketable investment valuations'],
 'limits':['Non-operating equity gains are excluded from operating income; no separate option value is assigned to Other Bets.'],
 'bridge':'June 2026 mandatory-convertible preferred stock has $18,023m reported carrying value. The common-equity bridge requires explicit preferred-dividend, conversion and dilution treatment; this is not its fair value. Withhold a clean per-common-share result until resolved.'},
'META':{
'summary':'AI improves ad effectiveness, but a capital-intensive buildout and continuing new-business spending limit margin expansion.',
'growth':'20% is below Q2 revenue growth of 28% and near recent annual growth. Ad effectiveness and monetization support the starting rate; user scale and advertising cyclicality justify fading it.',
 'targetMargin':'35% sits below the 38.1% TTM margin. It allows some normalization of legal/severance costs while retaining AI infrastructure, research and Reality Labs burdens.',
 'tax':'20% is a long-run normalized rate, above management’s 15–17% remaining-2026 outlook; it avoids extending short-term credits or one-off tax adjustments forever.',
 'salesCapital':'0.5x requires $2 of incremental net capital per $1 of added revenue. The high AI buildout and $130–145bn company capex outlook justify a capital-heavy starting case rather than an old asset-light advertising ratio.',
 'terminalROIC':'12% retains a modest network/data advantage after competition and sustained infrastructure needs reduce historical excess returns.',
 'risk':'Assumed beta 1.2, 10% target debt and a 1-point debt spread reflect advertising cyclicality, regulatory exposure and a rapidly expanding investment budget.',
 'anchor':'Q2 revenue grew 28%; operating margin was 31% including legal and severance charges. Management’s 2026 capex outlook was $130–145bn including finance-lease principal.',
 'uncertainties':['Advertising demand, user engagement and monetization of AI features','Legal liabilities, privacy rules and returns on AI/Reality Labs spending'],
 'limits':['A smooth investment ratio cannot reproduce individual data-center projects or legal settlements.'],
 'bridge':'Review lease arrangements, infrastructure venture commitments, employee awards and potential legal claims; no arbitrary litigation liability is invented.'},
'NVDA':{
'summary':'AI infrastructure sustains exceptional expansion, followed by substantial growth and margin normalization as customers, competitors and the supply chain mature.',
'growth':'40% starts below Q2 year-over-year growth of 106% and produces about $424bn in first-year revenue from the $303bn TTM base. The lower rate limits a ten-year straight-line fade; it is not a transcription of near-term guidance.',
 'targetMargin':'45% falls materially from 65.2% TTM. Software/ecosystem and system-level integration support a premium, but customer-designed chips, competition and scarcity normalization erode peak economics.',
 'tax':'20% is above the company’s 16–18% FY2027 outlook, allowing tax benefits to normalize over a much longer horizon.',
 'salesCapital':'2.0x assumes $0.50 of net reinvestment per added $1 of revenue. Fabless production helps, while inventory, receivables, supply commitments and broader infrastructure investments prevent growth from being capital-free.',
 'terminalROIC':'25% deliberately retains a strong platform advantage but is far below the explicit margin/capital combination. This remains an optimistic moat assumption requiring stress tests.',
 'risk':'Assumed beta 1.4, 3% target debt and a 1-point debt spread reflect high operating volatility and customer-capex concentration despite limited conventional leverage.',
 'anchor':'Fiscal Q2 2027 revenue was $96.2bn, up 106%; Q3 revenue guidance was $108bn ±2%, with no China Data Center compute revenue assumed.',
 'uncertainties':['AI customers’ sustainable returns, custom accelerators and export restrictions','Supply availability, product transitions and investment/financing commitments'],
 'limits':['40% fading over ten years still implies roughly 6.5x revenue. A multistage ramp followed by faster early deceleration may be more realistic than this deliberately simplified curve.'],
 'bridge':'Review strategic investments, commitments, convertible instruments and awards; gross capex alone does not measure economic reinvestment.'},
'TSLA':{
'summary':'A vehicle-and-energy growth case with better utilization and product mix; major unproven businesses are not separately capitalized.',
'growth':'12% assumes vehicle stabilization and continued energy expansion from the current base. It exceeds FY2025 contraction but avoids projecting the latest rebound or speculative autonomy revenue indefinitely.',
 'targetMargin':'12% recovers from 4.2% TTM through utilization, manufacturing efficiency and energy mix. This requires a meaningful improvement and does not assume software-platform margins for the whole company.',
 'tax':'25% is a normalized profitable-company rate. Historic tax benefits and losses are not a sustainable marginal rate; the engine has no detailed loss-carryforward schedule.',
 'salesCapital':'1.3x requires about $0.77 of net investment per extra $1 of sales for factories, storage capacity and working capital. Software potential does not eliminate manufacturing capital needs.',
 'terminalROIC':'12% approximately matches WACC, so no perpetual excess return is granted to a mature competitive vehicle/energy business.',
 'risk':'Assumed beta 1.6, 5% target debt and a 1.5-point debt spread reflect cyclical vehicle demand, pricing competition and execution uncertainty.',
 'anchor':'Q2 2026 deliveries were 480,126 vehicles and storage deployment was 13.5GWh; these volume measures do not by themselves determine earnings.',
 'uncertainties':['Vehicle pricing, demand, tariffs and energy storage profitability','Timing and economics of autonomy/robotics; compensation and dilution'],
 'limits':['No distinct robotaxi or humanoid-robot option value is added; a separate probability-weighted business model would be required.'],
 'bridge':'Noncontrolling interests, financing structures and employee awards require review. No future buyback or dilution forecast is hidden in the fixed share count.'},
'COHR':{
'summary':'Optical datacenter demand and integration benefits lift profitability, balanced against manufacturing investment and a mixed industrial portfolio.',
'growth':'25% is near FY2026 growth of 22.5% and below the latest 34% reported quarter. AI optics supports expansion; industrial exposure and eventually normalizing customer investment require a fade.',
 'targetMargin':'20% improves on FY2026 GAAP EBIT margin of 12.6% through utilization, mix and integration. It is an EBIT assumption after ongoing compensation and depreciation, not a non-GAAP gross-margin target.',
 'tax':'24% normalizes the very low FY2026 effective rate and prior loss-related volatility; acquisition and restructuring tax effects are not extended indefinitely.',
 'salesCapital':'1.25x implies $0.80 of net investment for each incremental $1 of sales. Vertical manufacturing, capacity and working capital remain important even if acquired capacity improves utilization.',
 'terminalROIC':'12% assumes moderate enduring photonics know-how benefits but much less than current high-growth incremental economics.',
 'risk':'Assumed beta 1.5, 20% target debt and a 2.5-point spread reflect optical/industrial cyclicality and a more levered acquisition history.',
 'anchor':'Fiscal Q4 2026 revenue was $2.05bn, up 34% reported and 42% pro forma, with 38.5% GAAP gross margin.',
 'uncertainties':['Optical design wins, yields, pricing and capacity ramps','Integration, divestitures, debt and minority/preferred interests'],
 'limits':['The 2022 Coherent acquisition is a structural break; predecessor II-VI decade averages are not a clean forecast for today’s perimeter.'],
 'bridge':'Review preferred securities, minority interests and debt terms; acquisition accounting and claims cannot be inferred from a historical book-capital ratio.'},
'LITE':{
'summary':'An optical connectivity ramp with lasting scale benefits, while current hypergrowth and peak product margins gradually normalize.',
'growth':'35% is well below FY2026 growth of 83% and the latest 109% quarter. It still compounds into a much larger business over ten years; optical adoption supports growth but current capacity shortages are not permanent.',
 'targetMargin':'25% improves on FY2026 annual GAAP EBIT margin of 17.4% but is below the latest quarter’s 27.8%. It preserves operating leverage without using non-GAAP guidance as GAAP EBIT.',
 'tax':'22% is a normalized profitable-company assumption. Recent loss periods and the FY2026 tax benefit do not support a negative long-run cash-tax rate.',
 'salesCapital':'1.2x requires about $0.83 of net reinvestment per added $1 of sales. Capacity additions and working capital make the ramp less capital-light than a pure design/software business.',
 'terminalROIC':'14% retains a limited technology advantage while allowing competition and product replacement to erode peak returns.',
 'risk':'Assumed beta 1.6, 15% target debt and a 2.5-point debt spread reflect a concentrated, volatile optical cycle and financing exposure.',
 'anchor':'Fiscal Q4 2026 revenue was $1.006bn, up 109%; GAAP operating margin was 27.8%, compared with a 36.6% non-GAAP margin.',
 'uncertainties':['800G/1.6T adoption, customer concentration and production yields','Price erosion, acquisitions and conversion/dilution of debt securities'],
 'limits':['The annual baseline lags the latest quarter’s ramp; a smooth ten-year path can understate early acceleration and overstate later growth.'],
 'bridge':'Review convertible-note conversion, capped-call treatment and employee dilution without counting the same instrument as both full debt and converted equity.'},
'AAOI':{
'summary':'A high-risk capacity-led turnaround in datacenter optics, with substantial funding needs before durable GAAP profitability.',
'growth':'60% reflects an early 800G/1.6T volume ramp, while still below recent annual growth. Starting from a small TTM base and fading immediately is essential; the ten-year outcome remains highly uncertain.',
 'targetMargin':'12% assumes a genuine operating turnaround from the current 11.3% loss margin. It requires utilization and cost absorption to improve, without equating non-GAAP net profitability with GAAP operating profit.',
 'tax':'25% applies only to positive modeled EBIT. This is a normalized mature rate; no tax refund or verified NOL benefit is assumed during losses.',
 'salesCapital':'0.8x means $1.25 of net investment per incremental $1 of revenue. Manufacturing expansion, inventory and receivables make growth cash-consuming; early negative FCFF is intentional.',
 'terminalROIC':'10% assumes capital utilization improves in maturity but grants no excess return versus the high constant model discount rate.',
 'risk':'Assumed beta 1.8 plus a 1-point extra equity allowance, 10% target debt and a 3.5-point debt spread reflect concentrated customers, execution and funding risk. These are judgments, not quoted borrowing terms.',
 'anchor':'Q2 2026 revenue was $191.9m; GAAP gross margin was 27.7% and GAAP net loss $22.8m. Q3 revenue guidance was $255–290m.',
 'uncertainties':['Customer concentration, ramp yields, price competition and capital availability','Convertible notes, vendor financing, dilution and warrants'],
 'limits':['The simple model has no financing or default-probability schedule; a large terminal value can conceal years of cash burn.'],
 'bridge':'The June 2026 10-Q separately reports $129.142m convertible notes in addition to $58.915m bank/current debt, plus $33.940m bank-acceptance payables needing classification. Withhold a clean share value until a coherent debt/dilution bridge is implemented.'},
'NBIS':{
'summary':'A directional AI-cloud operating hypothesis only: growth, funding, depreciation and post-financing equity claims need a specialist model.',
'growth':'85% is a deliberately capped smooth-path hypothesis, not near-term guidance. Latest quarterly growth exceeded 400%, so a single initial rate fading for ten years cannot reproduce the actual capacity ramp.',
 'targetMargin':'25% is mature EBIT after depreciation, not the reported AI-cloud adjusted EBITDA margin. Reaching it requires sustained utilization, pricing and discipline after the infrastructure buildout.',
 'tax':'25% is a normalized eventual profitable-state tax assumption. The engine taxes positive EBIT only and does not model jurisdictional loss carryforwards.',
 'salesCapital':'0.6x means $1.67 of incremental net capital per added $1 of revenue. Hardware/data centers are capital-heavy; this normalized ratio is far less demanding than today’s front-loaded spend and cannot finance the actual ramp.',
 'terminalROIC':'12% assumes competitive mature infrastructure returns below the constant 15.5% model WACC. A credible model would separately fade risk and capital intensity as the company matures.',
 'risk':'Assumed beta 2.1 plus a 2-point equity allowance, 10% target debt and a 4-point debt spread reflect severe execution/funding uncertainty; this is not a verified capital structure or a substitute for default scenarios.',
 'anchor':'Q2 group revenue was $582.3m, up 454%; AI-cloud ARR was $3.0bn. Q2 capex was approximately $5.7bn. ARR is last-month revenue annualized, not recognized annual revenue.',
 'uncertainties':['Power/capacity delivery, utilization, GPU pricing and economic useful lives','Convertible financing, warrants, subsidiary claims and future dilution','Owned infrastructure versus partner-funded asset-light mix'],
 'limits':['Valuation remains withheld. Linear margin recovery from TTM losses, a constant discount rate and growth-only reinvestment cannot represent the announced ramp, funding or GPU replacement cycle.','Old Yandex-group history is not comparable with the post-divestment AI-cloud business.'],
 'bridge':'Preserve the existing hard gate: August financing and share exchanges supersede the June balance sheet; post-financing cash, debt, exact shares and equity-linked claims must be reconciled.'},
'MU':{
'summary':'Normalize a memory scarcity boom before forecasting modest through-cycle growth; do not capitalize the peak EBIT margin for a decade.',
'growth':'8% is a through-cycle growth judgment on the already elevated FY2026 revenue base. HBM/content demand supports long-run expansion, but pricing and supply cycles prevent extrapolating 256% annual growth or near-term guidance.',
 'targetMargin':'35% is a normalized mature EBIT margin. The base case also resets starting EBIT to 35% of reported revenue, so the model does not take ten years to fade from FY2026’s extraordinary 74.6% margin.',
 'tax':'20% is a normalized operating tax above FY2026 accounting tax of 14.8%; tax incentives and geographical manufacturing mix remain uncertain.',
 'salesCapital':'0.8x requires $1.25 of net reinvestment per extra $1 of sales. Fabs, advanced packaging and process transitions require capital across the cycle; the ratio is not gross capex divided by current revenue.',
 'terminalROIC':'12% allows a modest technology/industry-structure advantage while avoiding a perpetual scarcity return on memory capacity.',
 'risk':'Assumed beta 1.4, 10% target debt and a 1.5-point debt spread reflect cyclical memory pricing and capital intensity even after unusually strong current cash generation.',
 'anchor':'FY2026 revenue was $133.188bn and GAAP operating income $99.340bn, a 74.6% margin, versus a 26.1% FY2025 operating margin.',
 'uncertainties':['HBM demand versus DRAM/NAND supply additions and pricing reversals','Fab execution, node transitions, customer prepayments and incentive timing'],
 'limits':['The 35% EBIT normalization is an analyst assumption, not a reported restatement; peak revenue itself is not normalized. The simple model cannot simulate a boom/bust sequence or replacement-capex spikes.'],
 'bridge':'Review restricted cash, long-dated investments, customer prepayments, commitments and incentives before treating all cash as surplus or the equity bridge as complete.'},
'AVGO':{
'summary':'Custom AI silicon and infrastructure software support growth and high profitability, with customer concentration and product-mix normalization.',
'growth':'35% is above FY2025 growth of 23.9% but far below the latest 86% quarter. Custom accelerators and networking justify the uplift; a large base and concentrated programs require a steep fade.',
 'targetMargin':'45% is below 48.0% TTM GAAP EBIT margin. High software and semiconductor profitability persists, while lower-margin system mix and competition prevent extrapolating non-GAAP peak margins.',
 'tax':'20% is a normalized operating-tax assumption. FY2025’s tax benefit and discrete restructuring/acquisition effects do not establish a sustainable long-term rate.',
 'salesCapital':'2.0x means $0.50 of net investment per incremental $1 of revenue. Fabless design and software are efficient, but working capital, supply commitments and future investment are not zero because reported capex is low.',
 'terminalROIC':'20% retains defensible IP and installed software advantages while reducing growth-period incremental returns substantially.',
 'risk':'Assumed beta 1.3, 15% target debt and a 1.5-point debt spread reflect strong cash generation alongside concentrated semiconductor customers and acquisition leverage.',
 'anchor':'Fiscal Q3 2026 revenue was $29.6bn, up 86%, with $16.0bn GAAP operating income; Q4 revenue guidance was approximately $34.8bn.',
 'uncertainties':['Timing and profitability of large custom-AI programs','Software retention, integration, amortization and leverage'],
 'limits':['VMware and earlier acquisitions change the business mix; consolidated historical growth is not an organic growth series.'],
 'bridge':'Review acquisition debt, employee awards, contingent obligations and non-operating assets; no future acquisition is assumed to arrive without a capital cost.'},
'TSM':{
'summary':'Leading-edge foundry and packaging scale support growth, with eventual margin normalization and explicit TWD-currency assumptions.',
'growth':'22% is below recent annual growth and Q3’s 50.9% TWD growth. Advanced nodes and AI demand support expansion; scale, cyclicality and currency effects require a decline toward mature growth.',
 'targetMargin':'45% is below the 58.0% TTM operating margin and near earlier-cycle levels. Technology leadership persists, while overseas-fab costs, node transitions and pricing normalize peak profitability.',
 'tax':'20% is a normalized rate above FY2025’s 17.0% accounting tax, allowing tax incentives and geographic production mix to normalize.',
 'salesCapital':'0.9x means $1.11 of net reinvestment per additional TWD1 of sales. Fabs and advanced packaging are capital-intensive; depreciation is already inside EBIT and this ratio represents investment net of that economic consumption.',
 'terminalROIC':'18% assumes lasting process/yield advantages with much lower returns than the explicit margin/capital combination. It does not eliminate geopolitical tail risk.',
 'risk':'A USD risk build uses beta 1.2, 10% target debt, a 1.5-point debt spread and 1.5-point extra equity risk. Assumed USD 2.5% versus TWD 1.5% inflation converts this to about 10.2% nominal TWD, rounded to 10%.',
 'anchor':'Q3 2026 TWD revenue grew 50.9% and operating margin was 58.7%; the issuer’s Q4 operating-margin outlook was 56.5–58.5%.',
 'uncertainties':['Advanced-node demand, overseas-fab economics and capacity utilization','Geopolitical interruption, energy/water supply and exchange rates'],
 'limits':['Valuation remains withheld: native TWD financials and ordinary shares cannot be compared directly with a USD ADR. The inflation conversion is an analyst assumption, not a quoted TWD yield or a verified ADR mapping.'],
 'bridge':'Preserve the existing hard gate for reporting currency, FX and five-ordinary-shares-per-ADR mapping; review minority interests and lease liabilities separately.'}}

result={'schemaVersion':1,'version':ASOF+'.2','asOf':ASOF,'classification':'Assistant-authored educational base-case judgments, not company guidance, analyst consensus, investment recommendations or price targets.',
 'units':{'rates':'decimal fractions','salesCapital':'incremental revenue / net reinvestment multiple','amounts':'snapshot reporting-currency millions'},
 'methodology':{
  'scope':'These defaults apply only to a fresh or explicitly reset current-company draft matching the named snapshot. Existing user edits and historical/frozen experiments must not change.',
  'growth':'Except for the documented AAOI staged profile, year 1 uses growth, then annual growth fades linearly to terminalGrowth in year 10. It is not a constant ten-year CAGR. Economic checks show the resulting size and CAGR.',
  'margin':'Except for the documented AAOI staged profile, reported baseline EBIT margin fades linearly to targetMargin by year 10, except an explicitly disclosed starting-EBIT normalization. Target margin is operating EBIT after ongoing R&D, SBC and depreciation, not gross margin, EBITDA or an adjusted EPS margin.',
  'reinvestment':'Net reinvestment = max(0, change in revenue / salesCapital). Ratios are independent forward judgments, not mechanically copied from total sales/book-capital or capex/sales. Gross maintenance capex, R&D capitalization and replacement cycles are not separately modeled.',
  'tax':'Normalized blended operating cash-tax estimates apply to positive EBIT only. Reported accounting effective rates are evidence, not marginal cash-tax forecasts; tax-loss carryforwards are not modeled.',
  'wacc':'WACC is an assumed nominal required return, never issuer-reported. Use observed USD Treasury 5.09% on 2026-10-16, an explicitly chosen 4.5% equity premium informed by January 2026’s 4.23% estimate, and assumed beta, target market-value debt weight and debt spread. The January premium is not an October observation. Round model WACC to 0.5 percentage points; betas and weights are not measured live. TSM uses a separately disclosed assumed currency conversion.',
  'terminal':'Stable growth is modest nominal growth in the model currency, below WACC and terminal ROIC. Terminal reinvestment/NOPAT = g/ROIC. Mature returns normally fall from explicit-period productivity; a discrete year-11 transition remains a simplification.',
  'bridge':'otherClaims=0 and otherAssets=0 are unreviewed numerical placeholders, not verified absence or fair values. No reviewed flags, financing reconciliation or share conversion is implied. Explicit specialist and claim-related gates take precedence over these defaults.',
  'validation':'Deterministic operating-path checks and lower/higher operating cases are model sanity tests, not calibrated probabilities. No stock price or future return is used to choose assumptions.',
  'evidence':'Primary issuer releases and exact current filing sources available by 2026-10-17 anchor judgments. Historical annual data are latest-reported context and may include recasts; structural breaks are disclosed.'},
 'sources':source,'companies':{}}
for t,p in params.items():
 c=companies[t];s=next(s for s in c['snapshots'] if s['id']==c['currentSnapshotId']);f=s['facts'];r=research[t]
 filing=src(t+'-filing',f"{c['name']} {s['form']} for period ended {s['periodEnd']}",s.get('sourceUrl') or s['sourceURL'],s['filedAt'])
 annual=next((v for v in c['snapshots'] if v.get('form') in ['10-K','20-F'] and v.get('snapshotMode')!='ttm'),None)
 annual_source=src(t+'-annual-filing',f"{c['name']} annual financial context ended {annual['periodEnd']}",annual.get('sourceUrl') or annual['sourceURL'],annual['filedAt']) if annual else None
 a=dict(zip(['growth','targetMargin','tax','salesCapital','wacc','terminalGrowth','terminalROIC'],p));a.update(years=10,otherClaims=0,otherAssets=0)
 b,d,spread,extra=wacc_inputs[t];rf=.0509;erp=.045;ke=rf+b*erp+extra;kd=rf+spread;raw=ke*(1-d)+kd*(1-a['tax'])*d
 nominal=raw if t!='TSM' else (1+raw)*1.015/1.025-1
 wb={'asOf':ASOF,'currency':c['currency'],'classification':'analyst model estimate; only riskFreeUSD is an observed input','riskFreeUSD':rf,'riskFreeObservationDate':'2026-10-16','riskFreeSourceId':'treasury','equityRiskPremium':erp,'equityRiskPremiumClassification':'chosen long-run assumption; January reference is 4.23%, not a current estimate','equityRiskPremiumReferenceSourceId':'erp-reference','assumedLeveredBeta':b,'assumedDebtWeight':d,'assumedDebtSpreadUSD':spread,'assumedExtraEquityRisk':extra,'assumedCostOfEquityUSD':round(ke,8),'assumedPretaxCostOfDebtUSD':round(kd,8),'normalizedTax':a['tax'],'unroundedWaccUSD':round(raw,8),'unroundedWaccInModelCurrency':nominal,'selectedWacc':a['wacc'],'rounding':'nearest 0.5 percentage point','formula':'Ke = Rf + assumed beta × chosen ERP + extra equity risk; WACC = Ke × (1 − debt weight) + assumed Kd × (1 − tax) × debt weight','limits':'Not a live beta regression, bond yield, market-value capital structure or country-default estimate. Extra equity allowances can overlap with operating downside; stress both rather than treating precision as evidence.'}
 if t=='TSM':wb['currencyConversion']={'assumedUSDInflation':.025,'assumedTWDInflation':.015,'formula':'(1 + USD WACC) × (1 + assumed TWD inflation) / (1 + assumed USD inflation) − 1','classification':'analyst inflation/currency judgment, not observed inflation or current FX'}
 ra={k:r[k] for k in ['growth','targetMargin','tax','salesCapital','terminalROIC']}
 ra['wacc']=f"{a['wacc']:.1%} nominal {c['currency']} is a rounded model estimate. "+r['risk']
 ra['terminalGrowth']=('2.0% nominal TWD combines an assumed 1.5% long-run inflation rate with modest real expansion; it is not USD ADR growth.' if t=='TSM' else '2.0% nominal USD avoids granting a mature cyclical memory producer permanent above-economy growth.' if t=='MU' else '2.5% nominal USD is a mature-state assumption with limited real expansion, well below the high-growth starting rate and the discount rate; it is not a company forecast.')
 ra['years']='10 years is the common model horizon so company economics can be compared; rates and margins fade over this period. The number is a modeling convention, not a source fact.'
 ra['otherClaims']='0 is an unreviewed placeholder, not evidence that no additional claims exist. '+r['bridge']
 ra['otherAssets']='0 is an unreviewed placeholder, not a statement that all non-operating assets are absent or worthless. Review assets not already included in snapshot cash and avoid double counting.'
 anchors=[{'classification':'reported or directly derived from reported current financials','periodEnd':s['periodEnd'],'publishedAt':s['filedAt'],'snapshotId':s['id'],'currency':c['currency'],'revenue':f['revenue'],'operatingIncome':f['operatingIncome'],'operatingMargin':f['operatingIncome']/f['revenue'],'sourceIds':[filing]}, {'classification':'reported results and explicitly labeled management outlook; not the base-case forecast','text':r['anchor'],'sourceIds':[t+'-release'],'publishedAt':releases[t][2]}]
 out={'ticker':t,'name':c['name'],'snapshotId':s['id'],'asOf':ASOF,'currency':c['currency'],'classification':'assistant judgment / educational default','summary':r['summary'],'assumptions':a,'rationale':ra,'reportedAnchors':anchors,'sourceIds':[x for x in [filing,annual_source,t+'-release','treasury','erp-reference'] if x],'waccBuild':wb,'bridgePolicy':{'status':'unreviewed','zeroMeansVerifiedAbsent':False,'preserveExistingGates':True,'note':r['bridge']},'modelLimits':r['limits'],'uncertainties':r['uncertainties']}
 if t in ['GOOG','AAOI','NBIS','TSM']:out['bridgePolicy']['numericResultPolicy']='withhold-until-explicit-bridge-or-specialist-resolution'
 out['modelSuitability']={'status':'provisional-simplified-operating-case','economicallyValidated':False,'note':'An internally checked conditional model, not proof that business assumptions will be realized.'}
 if t in ['AAOI','NBIS']:
  out['classification']='provisional unsupported linear-ramp research assumptions; not a validated base-case valuation'
  out['displayLabel']='Provisional operating hypothesis'
  out['modelSuitability']={'status':'unsupported-linear-ramp','economicallyValidated':False,'note':'The simple linear fade cannot represent the capacity, profitability and financing ramp. Use a specialist multistage path before a meaningful valuation.'}
  out['summary']='Provisional research assumptions only. '+out['summary']
 if t=='MU':
  delta=round(f['revenue']*.35-f['operatingIncome'],6)
  reason='Analyst through-cycle assumption: reset starting EBIT to 35% of reported FY2026 revenue instead of carrying the 74.6% scarcity-cycle margin through a slow ten-year fade. FY2025 EBIT margin was 26.1%; 35% assumes structural HBM benefits above that year. This is not a reported restatement and revenue is not normalized.'
  out['normalization']={'asOf':ASOF,'normalizationDelta':delta,'adjustmentReason':reason,'adjustmentSource':s['sourceUrl'],'normalizedStartingMargin':.35,'classification':'analyst judgment; modifies model EBIT only, never reported facts'}
  ra['normalization']=reason
 # Price-independent diagnostic paths; do not compute an unreviewed per-share valuation.
 def path(assumptions,margin0):
  rev=f['revenue'];rows=[];pv=0
  for y in range(1,11):
   g=assumptions['growth']+(assumptions['terminalGrowth']-assumptions['growth'])*(y-1)/9
   m=margin0+(assumptions['targetMargin']-margin0)*y/10;sc=assumptions['salesCapital']
   if t=='AAOI':
    g=assumptions['terminalGrowth']+(assumptions['growth']-assumptions['terminalGrowth'])*[1,15/23,11/23,7/23,5/23,3/23,11/115,1/23,1/115,0][y-1]
    m0ref=-67.406/595.97;progress=([-.05,0,.05,.08,.10,.12,.12,.12,.12,.12][y-1]-m0ref)/(.12-m0ref)
    m=margin0+(assumptions['targetMargin']-margin0)*progress
    sc=sc*[1,1,1.25,1.5,1.75,2,2][y-1] if y<=7 else 1/((1-(y-7)/3)/(2*sc)+(y-7)/3*(1+assumptions['terminalGrowth'])*assumptions['targetMargin']*(1-assumptions['tax'])/assumptions['terminalROIC'])
   nxt=rev*(1+g)
   nopat=nxt*m-max(0,nxt*m)*assumptions['tax'];reinv=max(0,(nxt-rev)/sc);fcff=nopat-reinv
   rows.append({'year':y,'growth':g,'revenue':nxt,'margin':m,'netReinvestment':reinv,'fcff':fcff});pv+=fcff/(1+assumptions['wacc'])**y;rev=nxt
  terminalNopat=rev*(1+assumptions['terminalGrowth'])*assumptions['targetMargin']*(1-assumptions['tax'])
  tv=terminalNopat*(1-assumptions['terminalGrowth']/assumptions['terminalROIC'])/(assumptions['wacc']-assumptions['terminalGrowth'])/(1+assumptions['wacc'])**10
  return rows,pv,tv
 margin0=out.get('normalization',{}).get('normalizedStartingMargin',f['operatingIncome']/f['revenue']);rows,pv,tv=path(a,margin0)
 checks={'classification':'computed consequences of assumptions; not reported outcomes or probabilities','startingRevenue':f['revenue'],'startingModelMargin':margin0,'firstYearRevenue':rows[0]['revenue'],'year10Revenue':rows[-1]['revenue'],'revenueMultiple10Years':rows[-1]['revenue']/f['revenue'],'impliedRevenueCAGR10Years':(rows[-1]['revenue']/f['revenue'])**.1-1,'firstYearNetReinvestmentToRevenue':rows[0]['netReinvestment']/rows[0]['revenue'],'negativeFCFFYears':[x['year'] for x in rows if x['fcff']<0],'firstPositiveFCFFYear':next((x['year'] for x in rows if x['fcff']>0),None),'terminalReinvestmentRate':a['terminalGrowth']/a['terminalROIC'],'matureMarginTimesCapitalAfterTax':a['targetMargin']*(1-a['tax'])*a['salesCapital'],'terminalROIC':a['terminalROIC'],'terminalValueShareOfOperatingEV':tv/(pv+tv) if pv+tv>0 else None,'discountSpread':a['wacc']-a['terminalGrowth'],'publicPerShareResult':None,'note':'Operating math only. No cash/debt/claims/share bridge is asserted; hard gates remain. Terminal share above 100% means negative explicit-period present value, not a probability.'}
 # Scenarios diagnose economics rather than guarantee a price ranking or calibrate confidence.
 ranges={'AAPL':(.04,.12,.28,.35),'MSFT':(.12,.24,.35,.47),'AMZN':(.08,.20,.10,.18),'GOOG':(.10,.25,.24,.35),'META':(.10,.28,.28,.42),'NVDA':(.20,.55,.32,.55),'TSLA':(.03,.22,.07,.18),'COHR':(.12,.35,.13,.25),'LITE':(.18,.50,.17,.32),'AAOI':(.30,.85,.06,.18),'NBIS':(.45,1,.12,.32),'MU':(.00,.15,.22,.45),'AVGO':(.20,.50,.35,.52),'TSM':(.12,.32,.35,.52)}[t]
 scenarios=[]
 for name,g,m,sc,w in [('lower-operating-case',ranges[0],ranges[2],a['salesCapital']*.8,a['wacc']+.02),('higher-operating-case',ranges[1],ranges[3],a['salesCapital']*1.2,a['wacc']-.015)]:
  sa={**a,'growth':g,'targetMargin':m,'salesCapital':sc,'wacc':w};rr,fp,tp=path(sa,margin0)
  scenarios.append({'name':name,'classification':'analyst stress illustration, not a confidence interval','assumptions':{k:sa[k] for k in ['growth','targetMargin','salesCapital','wacc']},'year10RevenueMultiple':rr[-1]['revenue']/f['revenue'],'negativeFCFFYears':[x['year'] for x in rr if x['fcff']<0],'operatingValueRelativeToBase':(fp+tp)/(pv+tv) if pv+tv>0 else None,'perShareValue':None})
 checks['operatingEVPositive']=pv+tv>0
 if pv+tv<=0:
  out['modelLimits'].insert(0,'This staged capacity assumption set produces negative operating enterprise value and five cash-burning forecast years. It is a conditional operating stress case, not a standalone fair-value estimate; financing, default, recovery and detailed maintenance replacement remain unmodeled.' if t=='AAOI' else 'This exact linear-path assumption set produces negative operating enterprise value. It is an operating stress hypothesis, not a credible standalone fair-value estimate.')
 elif tv/(pv+tv)>.75:
  out['modelLimits'].insert(0,f"About {tv/(pv+tv):.0%} of modeled operating value comes after year 10. The result is highly dependent on mature margins, required reinvestment and discount rates.")
 out['economicChecks']=checks;out['stressIllustrations']=scenarios
 if t in ['AAOI','GOOG']:
  claim_note=('The separate source-dated current claims model deducts the disclosed convertible fair-value proxy and vendor financing once, and uses an explicit intrinsic customer-warrant scenario. Counterfactual note conversion and the incomplete known-ATM pro forma are separate sensitivities. Current employee awards and warrant time value remain incomplete.' if t=='AAOI' else 'The separate source-dated current claims model explicitly allocates mandatory preferred dilution/dividends, finance leases and noncontrolling claims, and adds a gross noncurrent-investment carrying proxy. Capped-call recovery, investment realization taxes and employee awards remain incomplete.')
  out['bridgePolicy']={'status':'explicit-conditional-claims-overlay','zeroMeansVerifiedAbsent':False,'preserveExistingGates':True,'note':claim_note,'numericResultPolicy':'available-only-with-valid-source-matched-claims-model','sourcePath':'./data/current-claims-research.json'}
  ra['otherClaims']='0 means no additional user-entered claim beyond the separate explicit current claims model. Do not enter the same modeled claims again. '+claim_note
  ra['otherAssets']='0 means no additional user-entered asset beyond the separate explicit current claims model. Alphabet already includes a gross noncurrent-investment proxy in that bridge; never add it again. No zero is proof of absence.' if t=='GOOG' else '0 is an additional-asset assumption beyond source cash and any explicitly selected financing proceeds. It is not proof that every other nonoperating asset is absent.'
  checks['note']='Operating math only; the separate source-matched current claims model computes conditional per-share values. No result is asserted here. Terminal share is not meaningful when operating value is nonpositive.'
  if t=='AAOI':
   out['classification']='conditional staged capacity research assumptions; not a validated fair-value estimate'
   out['displayLabel']='Staged capacity research case'
   out['operatingProfile']={'schemaVersion':1,'id':'aaoi-capacity-ramp-v1'}
   out['modelSuitability']={'status':'conditional-staged-capacity-case','economicallyValidated':False,'note':'The explicit capacity/margin/capital path still produces negative operating value. The claims bridge shows the conditional equity floor and raw deficit; financing/default/recovery are not modeled.'}
   out['legacyOperatingStress']={'profile':'linear-v1','salesCapital':.8,'negativeFCFFYears':9,'note':'The prior linear 60% growth fade and slow profitability transition remains available for saved drafts. It is a stress hypothesis, not the fresh staged research default.'}
   ra['growth']='60% is year 1 growth. The staged profile then uses 40%, 30%, 20%, 15%, 10%, 8%, 5%, 3%, and 2.5% at these defaults. Quarter 3 guidance and capacity expansion support a front-loaded structure; the annual path is analyst judgment, not management guidance. Each simulated initial-growth input changes the whole same weighted path.'
   ra['targetMargin']='12% mature GAAP EBIT margin is reached in year 6. At the reported starting loss, the staged path is −5%,0%,5%,8%,10%,12% before maturity. This is a conditional utilization and operating-leverage judgment; no non-GAAP net margin is substituted.'
   ra['salesCapital']='0.8x is initial incremental sales/capital, requiring $1.25 investment per $1 extra revenue in years 1–2. It rises to 1.6x by years 6–7 as capacity is used. Years 8–10 fade capital intensity toward (1 + terminal growth) × margin × (1 − tax) / terminal ROIC, ending at 1.084x at defaults to align year 10 and terminal economics. The whole path is an explicit assumption, not a reported ratio.'
 result['companies'][t]=out
result['revision']={'priorVersion':ASOF+'.1','summary':'AAOI staged capacity profile and explicit current claims overlays for AAOI/Alphabet; original operating scalar assumptions retained; saved prior paths not silently replaced.'}
result['methodology']['companySpecificPath']='AAOI fresh research uses the documented staged capacity profile. Growth/margin progression and capital-intensity terminal fade are applied to every deterministic and simulated case. Other companies retain the original linear transition.'
path=ROOT/'dist/data/company-base-cases.json';path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(path)
for t,c in result['companies'].items():
 e=c['economicChecks'];print(t,c['assumptions'],'revenue multiple',round(e['revenueMultiple10Years'],2),'FCFF loss years',e['negativeFCFFYears'],'TV share',round(e['terminalValueShareOfOperatingEV'],3) if e['terminalValueShareOfOperatingEV'] else None)
