"""Package the audited ONTO dated operating case; no current equity allocation."""
import json, hashlib, shutil, html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; SRC=Path('/workspace/shared/atlas-research/company-onboarding/ONTO'); OUT=ROOT/'dist/data/incremental-ONTO-2026-10-18-v2';OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
s=json.loads((SRC/'valuation-readiness-v2.json').read_text());h=json.loads((SRC/'history-10fy-v2.json').read_text());a=json.loads((SRC/'independent-audit-v3/audit.json').read_text())
assert a['all_checks_passed'] and a['check_count']==148
for n in ['valuation-readiness-v2.json','valuation-readiness-v2.md','history-10fy-v2.json','history-10fy-v2.csv','forecast-scenarios-v2.csv']:
 shutil.copyfile(SRC/'public-safe-v2'/n,OUT/n)
for v in [2,3]:
 for ext,name in [('json','audit.json'),('md','audit.md')]:shutil.copyfile(SRC/f'independent-audit-v{v}'/name,OUT/f'independent-audit-v{v}.{ext}')
addendum=(SRC/'claims-addendum-v3/addendum.md').read_text()
addendum=addendum.replace('The current primary [quarterly-results page](https://investors.ontoinnovation.com/financials/quarterly-results/default.aspx) still lists Q2 2026 as its latest report.', 'Q2 2026 is the latest report retained and reviewed here. The independent v3 audit did not verify freshness of the live quarterly-results page.')
(OUT/'claims-addendum-v3.md').write_text(addendum)
inventory=json.loads((SRC/'source-inventory-v2.json').read_text())['files']
ledger=json.loads((SRC/'claims-addendum-v3/source-ledger.json').read_text())
provenance=[{'url':x.get('source_url'),'retrieved':x.get('retrieved_on'),'sha256':x['sha256'],'kind':x['kind']} for x in inventory]+[{k:v for k,v in x.items() if k!='file'} for x in ledger]
(OUT/'source-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
for x in ledger:
 if x.get('id') in ['rigaku-transfer','rigaku-close','rigaku-alliance']:s['source_urls'][x['id']]=x['url']
basepath='./data/'+OUT.name+'/'
id={'packageVersion':OUT.name,'version':'2026-10-18-onto-dated-ev-v2','ticker':'ONTO','currency':'USD','informationAsOf':'2026-10-18','discountOrigin':'2026-06-30'}
for k,n in [('source','valuation-readiness-v2.json'),('history','history-10fy-v2.json'),('audit','independent-audit-v3.json'),('fullReport','valuation-readiness-v2.md'),('auditReport','independent-audit-v3.md')]:id[k+'Path']=basepath+n;id[k+'SHA256']=sha(OUT/n)
id['operatingAuditPath']=basepath+'independent-audit-v2.md';id['claimsAddendumPath']=basepath+'claims-addendum-v3.md';id['provenancePath']=basepath+'source-provenance.json'
id['packagedSourceSHA256']=id['sourceSHA256'];id['packagedHistorySHA256']=id['historySHA256'];id['historyCSVPath']=basepath+'history-10fy-v2.csv';id['reportPath']=basepath+'ONTO-v2.html'
pairs=json.loads((ROOT/'scripts/onto-prose.json').read_text())
prose={k:{'en':v[0],'zh-Hans':v[1]}for k,v in pairs.items()}
def case(name):
 x=s['operating_scenarios'][name]['calculated'];t=x['terminal'];assumptions=s['operating_scenarios'][name]['assumptions']
 return {'ticker':'ONTO','company':'Onto Innovation Inc.','currency':'USD','scenario':'base','sourceScenario':name,'ratioUnit':'decimal','forecastHorizonYears':10,'incrementalResearch':id,'valuationTiming':{'discountOrigin':'2026-06-30'},'anchor':{'period':'2026-06-30','fiscalEnd':'2026-06-30','kind':'reported_period_approximation','classification':'Rolling reported-period reference','revenue':s['reported']['ttm']['revenue'],'EBIT':s['reported']['ttm']['ebit'],'firstModeledPeriod':'2027-06-30','firstModeledPeriodStart':'2026-07-01','fiscalCalendarCaution':'Rolling anchor spans approximately 367 days; forecast years end June 30.'},'annual':[{'year':i+1,'period':r['year_ending'],'revenue':r['revenue'],'operatingMargin':r['economic_operating_margin'],'taxRate':r['tax_rate'],'reinvestment':r['net_reinvestment'],'wacc':r['WACC'],'sourceRow':r}for i,r in enumerate(x['annual'])],'terminal':{'growth':t['growth'],'operatingMargin':t['operating_margin'],'taxRate':t['tax'],'ROIC':t['ROIC'],'wacc':t['WACC']},'ontoFundingPolicy':{'capex':assumptions['capex_ratio'],'depreciation':assumptions['depreciation_ratio'],'nwc':assumptions['incremental_nwc'],'operatingCash':.03,'salesCapital':assumptions['early_sales_to_capital']},'boundedModelGaps':[pairs[k][0]for k in ['scope','funding','claimLimits','uncertainty']]}
catalog=json.loads((ROOT/'dist/data/atlas-company-catalog-v1.json').read_text());listing=next(x for x in catalog['companies']if x['ticker']=='ONTO')
bridge={'type':'onto-ev-only-v2','currency':'USD','referenceDate':'2026-06-30','shareDate':'2026-06-30','sourceUrl':s['source_urls']['q2'],'shares':49.033,'options':[],'notes':[pairs['claims'][0]],'unresolved':[pairs['claimLimits'][0]],'shareBasis':'NYSE common share; not ADR','classification':'Dated operating EV only; common allocation gated','claimCompleteness':'unresolved','quotedConvertibleFairValue':1982.250,'currentQuote':None}
record={'identity':id,'publicTradability':{k:listing[k]for k in ['ticker','nativeTicker','mic','exchange','securityType','verified','checkedAt','sourceURLs','evidence','robinhood']},'annualCase':case('base'),'alternatives':[{'name':n,'label':label,'buttonLabel':button,'classification':'Analyst scenario; no assigned probability','annualCase':case(n)}for n,label,button in [('downcycle','Downcycle scenario','Load reviewed downcycle'),('upside','Upside scenario','Load reviewed upside')]],'bridge':bridge,'history':[{**r,'fiscalEnd':r['period_end'],'revenue':r['facts']['revenue']['value'],'canonicalOperatingEBIT':r['facts']['ebit']['value'],'operatingMargin':r['derived']['gaap_operating_margin']}for r in h['years']],'prose':prose,'sources':[{'id':k,'url':v,'retrieved':next((x['retrieved_on'] for x in inventory if x.get('source_url')==v and x.get('retrieved_on')),None)}for k,v in s['source_urls'].items()],'auditResults':{'checksPassed':148,'operatingChecksPassed':110,'status':'Qualified operating v2 and claims v3 passes; dated operating EV only'},'readiness':'reviewed-fiscal-origin-only'}
occupancy=case('base')
occupancy['sourceScenario']='occupancy'
for row,stress in zip(occupancy['annual'],s['sensitivities']['occupancy_cost_headroom_20bp']['annual']):
 row['operatingMargin']-=.002;row['reinvestment']=stress['net_reinvestment'];row['sourceRow']={**row['sourceRow'],'occupancyStress':stress}
occupancy['terminal']['operatingMargin']-=.002
record['alternatives'].append({'name':'occupancy','label':'Occupancy cost-headroom stress','buttonLabel':'Load 20bp occupancy stress','classification':'Analyst cost stress; not measured incremental lease expense','annualCase':occupancy})
bundle={'schemaVersion':1,'version':OUT.name,'asOf':'2026-10-18','companies':[record]};(OUT/'cases.json').write_text(json.dumps(bundle,indent=2,ensure_ascii=False)+'\n')
(ROOT/'dist/onto-research-registry.js').write_text('// Build-generated audited ONTO dated operating-EV package.\nconst bundle='+json.dumps(bundle,indent=2,ensure_ascii=False)+';\nfunction freeze(x){if(x&&typeof x===\'object\'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}\nexport const ontoRegistry=freeze(bundle);\n')
e=html.escape
parts=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ONTO dated operating research</title><style>body{font:17px/1.6 system-ui;max-width:1000px;margin:auto;padding:24px}section{margin:24px 0}</style><body><nav><a href="../../index.html">Valuation Lab</a> · <a href="#chinese">简体中文</a></nav>']
for lang,anchor in [('en','english'),('zh-Hans','chinese')]:
 parts.append(f'<article id="{anchor}" lang="{lang}"><h1>ONTO · 2026-06-30</h1>')
 for k,p in prose.items():parts.append(f'<section id="{k if lang=="en" else k+"-zh"}"><p>{e(p[lang])}</p></section>')
 parts.append('</article>')
parts.append('<section id="sources"><h2>Sources / 来源</h2>'+''.join(f'<p><a href="{e(v)}">{e(k)}</a></p>'for k,v in s['source_urls'].items())+'</section><p>'+ ' · '.join(f'<a href="{e(id[k].split("/")[-1])}">{e(label)}</a>'for k,label in [('fullReportPath','Full research'),('sourcePath','Source JSON'),('historyPath','History'),('auditReportPath','Independent claims audit'),('operatingAuditPath','Independent operating audit'),('claimsAddendumPath','Qualified claims addendum'),('provenancePath','Source provenance')])+'</p></body></html>')
(OUT/'ONTO-v2.html').write_text('\n'.join(parts))
print(OUT)
