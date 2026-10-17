#!/usr/bin/env python3
"""Build additive current-research history from cached SEC primary data, never frozen cases.
Run: python3 scripts/build-company-history.py [source cache] [output JSON]
No network, guessed facts, zero-filled financials, or mutations of original datasets.
"""
import datetime as dt, hashlib, json, pathlib, statistics, sys
from lxml import html
P=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/shared/valuation-data/current-universe-v5')
OUT=pathlib.Path(sys.argv[2] if len(sys.argv)>2 else pathlib.Path(__file__).parents[1]/'dist/data/company-history.json')
ASOF='2026-10-17'
TICKERS=['AAPL','MSFT','AMZN','GOOG','META','NVDA','TSLA','COHR','LITE','AAOI','MU','AVGO']
FLOW={
'revenue':['RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax','Revenues','SalesRevenueNet'],
'operatingIncome':['OperatingIncomeLoss'],
'netIncome':['NetIncomeLoss'],
'pretaxIncome':['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest','IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'],
'incomeTaxExpense':['IncomeTaxExpenseBenefit'],
'capitalExpenditure':['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets'],
'depreciationAmortization':['DepreciationDepletionAndAmortization','DepreciationDepletionAndAmortizationPropertyPlantAndEquipment','DepreciationAmortizationAndAccretionNet','Depreciation'],
'researchAndDevelopment':['ResearchAndDevelopmentExpense'],
'stockBasedCompensation':['ShareBasedCompensation'],
'operatingCashFlow':['NetCashProvidedByUsedInOperatingActivities'],
'dilutedShares':['WeightedAverageNumberOfDilutedSharesOutstanding'],
'costOfGoodsSold':['CostOfGoodsAndServicesSold'],
'sellingGeneralAdministrative':['SellingGeneralAndAdministrativeExpense'],
'restructuringCharges':['RestructuringCharges'],
'impairmentHeldForSale':['ImpairmentOfLongLivedAssetsToBeDisposedOf'],
'gainOnSaleOfBusiness':['GainLossOnSaleOfBusiness']}
BAL={
'cashAndEquivalents':['CashAndCashEquivalentsAtCarryingValue'],
'marketableSecuritiesNoncurrent':['MarketableSecuritiesNoncurrent','AvailableForSaleSecuritiesDebtSecuritiesNoncurrent'],
'marketableEquitySecurities':['EquitySecuritiesFvNi'],
'bookEquity':['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest','StockholdersEquity'],
'longTermDebtCurrent':['LongTermDebtCurrent'],
'longTermDebtNoncurrent':['LongTermDebtNoncurrent'],
'longTermDebtTotal':['LongTermDebt'],
'debtAndFinanceLeases':['DebtAndCapitalLeaseObligations'],
'longTermDebtAndFinanceLeasesNoncurrent':['LongTermDebtAndCapitalLeaseObligations'],
'longTermDebtAndFinanceLeasesCurrent':['LongTermDebtAndCapitalLeaseObligationsCurrent'],
'commercialPaper':['CommercialPaper'],
'convertibleDebtCurrent':['ConvertibleDebtCurrent'],
'convertibleDebtNoncurrent':['ConvertibleDebtNoncurrent'],
'shortTermBorrowings':['ShortTermBorrowings'],
'noncontrollingInterest':['MinorityInterest'],
'preferredEquity':['PreferredStockValue','PreferredStockCarryingValue'],
'operatingLeaseLiabilityCurrent':['OperatingLeaseLiabilityCurrent'],
'operatingLeaseLiabilityNoncurrent':['OperatingLeaseLiabilityNoncurrent'],
'periodEndCommonShares':['CommonStockSharesOutstanding']}
COMPANY_NOTES={
'AAPL':['Share repurchases reduce book equity; book-capital returns can look unusually high. The cash-only capital proxy does not deduct Apple’s marketable securities.'],
'MSFT':['Cloud/AI capital spending may precede revenue by years; cash capex omits assets acquired through finance leases. Acquisitions change the capital base.'],
'AMZN':['Retail, AWS and advertising have different margins and capital needs. Leases and the timing of fulfillment/data-center investment matter.'],
'GOOG':['Cloud, advertising and other businesses have different economics. The book-capital proxy does not capitalize expensed R&D or fully strip investments.'],
'META':['Advertising funds large AI and Reality Labs investments. Capital spending and depreciation can lag economic investment; accounting tax charges can be nonrecurring.'],
'NVDA':['Fabless economics, exceptional AI growth and customer concentration make a short historical range a weak steady-state anchor. Expensed R&D is not capitalized.'],
'TSLA':['Automotive pricing, regulatory credits and energy mix can change margins. Tax benefits and new-factory utilization require normalization.'],
'COHR':['The 2022 Coherent acquisition changed scale and capital structure; acquisition amortization and impairments affect comparability. FY2024–2026 EBIT is a derived subtotal using the latest statements, identified in evidence.'],
'LITE':['Acquisitions and optical-market cycles affect revenue, purchased intangibles and margins. A return from losses is not a normal growth base.'],
'AAOI':['Loss years do not provide a meaningful effective tax-rate assumption. Customer concentration, utilization and expansion capex can dominate short-term ratios.'],
'MU':['Memory pricing is cyclical; peak/trough margins and utilization should not be extrapolated indefinitely. Debt mapping includes finance leases when the combined tag is used.'],
'AVGO':['VMware and other acquisitions changed the business mix and book capital; acquired-intangible amortization depresses reported EBIT. Combined debt tags include finance leases.']}
def day(s): return dt.date.fromisoformat(s)
def isannual(r): return bool(r.get('start')) and 330<=(day(r['end'])-day(r['start'])).days<=380

def inline_rows(path):
 root=html.fromstring(path.read_bytes()); contexts={}; rows=[]
 for e in root.iter():
  if str(e.tag).split(':')[-1]=='context':
   vals={str(x.tag).split(':')[-1]:''.join(x.itertext()) for x in e.iter()}
   contexts[e.get('id')]={'start':vals.get('startdate'),'end':vals.get('enddate',vals.get('instant')),'dim':any(str(x.tag).split(':')[-1] in ['explicitmember','typedmember'] for x in e.iter())}
 for e in root.iter():
  if str(e.tag).split(':')[-1]!='nonfraction': continue
  c=contexts.get(e.get('contextref'),{})
  if c.get('dim'): continue
  try:
   s=''.join(e.itertext()).replace(',','').replace('$','').replace('(','').replace(')','').strip()
   v=(0 if s in ['—','–','-'] else float(s))*10**int(e.get('scale','0'))*(-1 if e.get('sign')=='-' else 1)
  except (ValueError,TypeError): continue
  rows.append((e.get('name'),c.get('start'),c.get('end'),v,e.get('contextref')))
 return rows

def sources(*facts):
 out=[]
 for f in facts:
  if not f: continue
  for u in f.get('sourceUrls',[]) or [f.get('sourceUrl')]:
   if u and u not in out:out.append(u)
 return out

def derived(value,formula,components,reason=None,**extra):
 return {'value':value,'formula':formula,'components':components,'reason':reason,**extra}

def build_company(t):
 fp=P/f'{t}-facts.json'; raw=json.load(open(fp)); facts=raw['facts']['us-gaap']; sub=json.load(open(P/f'{t}-submissions.json'))['filings']['recent']; docs={a:sub['primaryDocument'][i] for i,a in enumerate(sub['accessionNumber'])}; retrieval=json.load(open(P/f'{t}-retrieval.json'))[0]
 cached={}
 for i,a in enumerate(sub['accessionNumber']):
  path=P/(t+'-'+sub['primaryDocument'][i])
  if sub['form'][i]=='10-K' and path.exists():cached[a]=inline_rows(path)
 def pick(tags,end,flow=False):
  # Prefer the latest filed annual evidence; concept priority resolves same-filing duplicates.
  candidates=[]
  for rank,tag in enumerate(tags):
   unit='shares' if 'Shares' in tag else 'USD'
   for r in facts.get(tag,{}).get('units',{}).get(unit,[]):
    if r.get('form') not in ['10-K','10-K/A'] or r.get('filed','')>ASOF or r['end']!=end:continue
    if (not isannual(r)) if flow else bool(r.get('start')):continue
    candidates.append((r['filed'],-rank,r,tag,unit))
  if not candidates:return {'value':None,'reason':'No mapped annual SEC fact for this fiscal period.'}
  _,_,r,tag,unit=max(candidates,key=lambda x:(x[0],x[1])); acc=r['accn']; url=f'https://www.sec.gov/Archives/edgar/data/{raw["cik"]}/{acc.replace("-","")}/'+docs.get(acc,acc+'-index.html')
  match=next((x for x in cached.get(acc,[]) if x[0]=='us-gaap:'+tag and x[1]==r.get('start') and x[2]==r['end'] and abs(x[3]-r['val'])<max(1,abs(r['val'])*1e-10)),None)
  return {'value':r['val']/1e6,'rawValue':r['val'],'unit':unit+' millions' if unit=='USD' else 'million shares','tag':'us-gaap:'+tag,'periodStart':r.get('start'),'periodEnd':end,'filedAt':r['filed'],'accession':acc,'sourceUrl':url,'sourceType':'SEC standardized Company Facts / annual filing','originalDocumentVerified':bool(match),'contextRef':match[4] if match else None}
 periods=sorted(set(r['end'] for tag in FLOW['revenue'] for r in facts.get(tag,{}).get('units',{}).get('USD',[]) if r.get('form') in ['10-K','10-K/A'] and r.get('filed','')<=ASOF and isannual(r)))[-6:]
 observations=[]
 for end in periods:
  fs={k:pick(tags,end,True) for k,tags in FLOW.items() if t=='COHR' or k not in ['costOfGoodsSold','sellingGeneralAdministrative','restructuringCharges','impairmentHeldForSale','gainOnSaleOfBusiness']};fs.update({k:pick(tags,end) for k,tags in BAL.items()})
  def val(k):return fs.get(k,{}).get('value')
  def setderived(k,parts,formula,calc,note):
   ok=all(val(x) is not None for x in parts)
   fs[k]={'value':calc() if ok else None,'unit':'USD millions','formula':formula,'components':parts,'sourceUrls':sources(*(fs[x] for x in parts)),'filedAt':max((fs[x].get('filedAt','') for x in parts),default=''),'sourceType':'Derived from mapped SEC facts','reason':None if ok else 'At least one required source component is unavailable.','note':note}
  if t=='COHR' and end>='2024-01-01':
   parts=['revenue','costOfGoodsSold','researchAndDevelopment','sellingGeneralAdministrative','restructuringCharges','impairmentHeldForSale','gainOnSaleOfBusiness']
   setderived('operatingIncome',parts,'Revenue − COGS − R&D − SG&A − restructuring − held-for-sale impairment + gain on business sale',lambda:val('revenue')-sum(val(x) for x in parts[1:-1])+val(parts[-1]),'Derived operating subtotal; excludes interest and separately disclosed other income. Not an issuer-reported operating-income line.')
  if t=='LITE' and val('pretaxIncome') is None:
   setderived('pretaxIncome',['netIncome','incomeTaxExpense'],'Net income + income tax expense',lambda:val('netIncome')+val('incomeTaxExpense'),'Derived for Lumentum consolidated income statement; custom pretax concept not in SEC standardized facts. No assumption of a tax benefit on operating losses.')
  debtparts=[]
  if val('longTermDebtCurrent') is not None and val('longTermDebtNoncurrent') is not None:debtparts=['longTermDebtCurrent','longTermDebtNoncurrent']
  elif t=='LITE' and val('convertibleDebtCurrent') is not None and val('convertibleDebtNoncurrent') is not None:debtparts=['convertibleDebtCurrent','convertibleDebtNoncurrent']
  elif t=='MU' and val('debtAndFinanceLeases') is not None:debtparts=['debtAndFinanceLeases']
  elif t=='AVGO' and val('longTermDebtAndFinanceLeasesNoncurrent') is not None and val('longTermDebtAndFinanceLeasesCurrent') is not None:debtparts=['longTermDebtAndFinanceLeasesNoncurrent','longTermDebtAndFinanceLeasesCurrent']
  elif val('longTermDebtTotal') is not None:debtparts=['longTermDebtTotal']
  # Only add explicitly separate commercial paper to Apple. No zero filling or automatic overlapping short-term tag sums.
  if t=='AAPL' and debtparts and val('commercialPaper') is not None:debtparts+=['commercialPaper']
  if debtparts:setderived('mappedDebt',debtparts,' + '.join(debtparts),lambda:sum(val(x) for x in debtparts),'Mapped funded-debt proxy. This is not a complete debt/claims audit. Leases and short-term borrowings may be excluded; combined tags can include finance leases.')
  else:fs['mappedDebt']={'value':None,'reason':'No unambiguous mapped debt subtotal available; not assumed zero.'}
  setderived('bookCapitalProxy',['bookEquity','mappedDebt','cashAndEquivalents'],'Book equity + mapped debt − cash and cash equivalents',lambda:val('bookEquity')+val('mappedDebt')-val('cashAndEquivalents'),'Unadjusted cash-only book-capital proxy. Securities are not deducted; R&D/leases not restated; preferred/minority and debt completeness require review.')
  row={'period':'FY'+end[:4],'periodStart':fs['revenue'].get('periodStart'),'periodEnd':end,'currency':'USD','periodType':'annual','facts':fs,'metrics':{}}
  observations.append(row)
 derive_metrics(observations)
 return {'ticker':t,'name':raw['entityName'],'currency':'USD','accountingBasis':'US GAAP; latest-reported annual facts as of dataset cutoff, not a point-in-time backtest','backtestEligible':False,'sourceEndpoint':retrieval['url'],'retrievedAt':retrieval['retrievedAt'],'sourceCacheSHA256':hashlib.sha256(fp.read_bytes()).hexdigest(),'annual':observations[-5:],'baseObservation':observations[-6] if len(observations)>5 else None,'cautions':COMPANY_NOTES[t]}

def derive_metrics(rows):
 for i,row in enumerate(rows):
  fs=row['facts']; m=row.setdefault('metrics',{}); candidate=rows[i-1] if i else None
  adjacent=bool(candidate and 330<=(day(row['periodEnd'])-day(candidate['periodEnd'])).days<=380 and row.get('periodStart') and 0<(day(row['periodStart'])-day(candidate['periodEnd'])).days<=8)
  prev=candidate if adjacent else None
  def v(k,r=row):return r.get('facts',{}).get(k,{}).get('value') if r else None
  def ratio(key,num,den,formula,parts,reason=None,classification='derived',rangeEligible=True):
   value=num/den if num is not None and den is not None and den>0 and not reason else None
   m[key]={'value':value,'numerator':num,'denominator':den,'formula':formula,'components':parts,'classification':classification,'rangeEligible':rangeEligible and value is not None,'reason':reason or ('Missing numerator or positive denominator.' if value is None else None),'sourceUrls':sources(*(fs.get(k) for k in parts))}
  prevRevenue=v('revenue',prev)
  growthNum=v('revenue')-prevRevenue if v('revenue') is not None and prevRevenue is not None else None
  ratio('growth',growthNum,prevRevenue,'(Revenue − prior fiscal-year revenue) / prior fiscal-year revenue',['revenue'],reason='No adjacent comparable preceding fiscal year is included; multi-year changes are not annual growth.' if not prev else None)
  m['growth']['priorPeriodEnd']=prev.get('periodEnd') if prev else None
  m['growth']['sourceUrls']=sources(fs.get('revenue'),prev.get('facts',{}).get('revenue') if prev else None)
  ratio('operatingMargin',v('operatingIncome'),v('revenue'),'Operating income / revenue',['operatingIncome','revenue'])
  pretax=v('pretaxIncome');tax=v('incomeTaxExpense')
  taxreason='Pretax income is zero or negative; a useful effective tax-rate comparison is unavailable.' if pretax is not None and pretax<=0 else None
  ratio('effectiveTaxRate',tax,pretax,'Income tax expense / pretax income',['incomeTaxExpense','pretaxIncome'],reason=taxreason)
  etr=m['effectiveTaxRate']['value'];taxMeaningful=etr is not None and 0<=etr<=1 and not row.get('excludeNormalizedTax',False)
  m['effectiveTaxRate']['rawRatio']=tax/pretax if tax is not None and pretax not in [None,0] else None
  m['effectiveTaxRate']['rangeEligible']=taxMeaningful
  if row.get('taxCaution'):m['effectiveTaxRate']['caution']=row['taxCaution']
  if etr is not None and not 0<=etr<=1:m['effectiveTaxRate']['caution']='Tax benefit or rate above 100%; displayed as reported, excluded from range and ROIC proxy.'
  ratio('bookSalesCapitalProxy',v('revenue'),v('bookCapitalProxy'),'Revenue / end-of-year cash-only book-capital proxy',['revenue','bookCapitalProxy'],classification='proxy')
  previousCapital=v('bookCapitalProxy',prev)
  deltaCapital=v('bookCapitalProxy')-previousCapital if v('bookCapitalProxy') is not None and previousCapital is not None else None
  ratio('incrementalBookSalesCapitalProxy',growthNum,deltaCapital,'Change in revenue / change in cash-only book-capital proxy',['revenue','bookCapitalProxy'],classification='proxy',reason='Book capital did not increase; not interpretable as a marginal reinvestment ratio.' if deltaCapital is not None and deltaCapital<=0 else None)
  m['incrementalBookSalesCapitalProxy']['priorPeriodEnd']=prev.get('periodEnd') if prev else None
  m['incrementalBookSalesCapitalProxy']['sourceUrls']=sources(fs.get('revenue'),fs.get('bookCapitalProxy'),prev.get('facts',{}).get('revenue') if prev else None,prev.get('facts',{}).get('bookCapitalProxy') if prev else None)
  nopat=v('operatingIncome')*(1-etr) if v('operatingIncome') is not None and taxMeaningful else None
  ratio('bookROICProxy',nopat,previousCapital,'Operating income × (1 − reported effective tax rate) / prior-year cash-only book-capital proxy',['operatingIncome','incomeTaxExpense','pretaxIncome'],classification='proxy',reason='Effective tax rate is unavailable or unsuitable for operating-tax normalization this year.' if not taxMeaningful else None)
  m['bookROICProxy']['priorPeriodEnd']=prev.get('periodEnd') if prev else None
  m['bookROICProxy']['sourceUrls']=sources(*(fs.get(k) for k in ['operatingIncome','incomeTaxExpense','pretaxIncome']),prev.get('facts',{}).get('bookCapitalProxy') if prev else None)
  for key,field in [('capexToSales','capitalExpenditure'),('researchToSales','researchAndDevelopment'),('sbcToSales','stockBasedCompensation')]:ratio(key,v(field),v('revenue'),field+' / revenue',[field,'revenue'])
  for key,metric in m.items():
   dates=[fs.get(k,{}).get('filedAt','') for k in metric.get('components',[])]
   if prev and key in ['growth','incrementalBookSalesCapitalProxy','bookROICProxy']:
    dates += [prev['facts'].get(k,{}).get('filedAt','') for k in ['revenue','bookCapitalProxy']]
   metric['availableFrom']=max((d for d in dates if d),default='') or None

def normalize_foreign(t,company,source_ledger):
 # Preserve exact table-level evidence while aligning with the read-only UI schema.
 rename={'totalEquity':'bookEquity','bookEquity':'parentBookEquity','debt':'mappedDebt','investedCapitalBookProxy':'bookCapitalProxy'}
 excluded={'EBIT','operatingMargin','reportedEffectiveTaxRate','effectiveTaxRate','revenueGrowth','investedCapital','roic'}
 def normalize_row(row):
  original=row['facts'];evs=row.get('factEvidence',{});facts={}
  def trace(k,seen=None):
   seen=set() if seen is None else seen
   if k in seen:return []
   seen.add(k);e=evs.get(k,{})
   result=[e] if e.get('sourceUrl') else []
   for child in e.get('componentEvidenceFields',[]):result+=trace(child,seen)
   return result
  for k,value in original.items():
   if k in excluded:continue
   ev=evs.get(k,{});traced=trace(k);url_list=list(dict.fromkeys(e['sourceUrl'] for e in traced));dates=[e.get('filingDate','') for e in traced];newkey=rename.get(k,k)
   facts[newkey]={'value':value,'unit':company['currency']+' millions','periodStart':ev.get('periodStart'),'periodEnd':row['periodEnd'],'filedAt':max((d for d in dates if d),default='') or None,'sourceUrl':url_list[0] if url_list else None,'sourceUrls':url_list,'sourceType':'Original annual filing table' if ev.get('sourceUrl') else 'Derived from original annual filing tables','originalDocumentVerified':bool(traced) and all(e.get('originalDocumentVerified',False) for e in traced),'reason':row.get('missingFieldReasons',{}).get(k,'No sourced annual value for this field.') if value is None else None,'tableEvidence':ev}
   if ev.get('sourceUrl'):facts[newkey].update({a:ev[a] for a in ['accession','tableIndex','lineItem','selectedCellIndex','rawRow','rawUnit','multiplierToMillions'] if a in ev})
   if 'rawValue' in ev:facts[newkey]['reportedTableValue']=ev['rawValue']
   if ev.get('excerpt'):facts[newkey].update({'sourceExcerpt':ev['excerpt'],'sourceType':'Original annual filing narrative'})
   if ev.get('calculation'):facts[newkey].update({'formula':ev['calculation'],'components':[rename.get(a,a) for a in ev.get('componentEvidenceFields',[])]})
  for k in list(FLOW)+list(BAL)+['mappedDebt','bookCapitalProxy']:
   if k not in facts:facts[k]={'value':None,'reason':'Not mapped from this issuer’s historical evidence; not assumed zero.'}
  return {'period':'FY'+str(row.get('fiscalYear',row['periodEnd'][:4])),'periodStart':row['periodStart'],'periodEnd':row['periodEnd'],'periodType':'annual','currency':company['currency'],'accountingBasis':row.get('accountingBasis'),'facts':facts,'metrics':{},'excludeNormalizedTax':row.get('excludeNormalizedTax',False),'taxCaution':row.get('taxCaution'),'warnings':row.get('warnings',[])}
 observations=company.get('observations',[])
 base=company.get('baseObservation')
 rows=([normalize_row(base)] if base else [])+[normalize_row(r) for r in observations]
 derive_metrics(rows)
 return {'ticker':t,'name':company['name'],'currency':company['currency'],'annual':rows[1:] if base else rows,'baseObservation':rows[0] if base else None,'accountingBasis':company.get('accountingBasis','Issuer annual reporting basis'),'backtestEligible':False,'cautions':company.get('cautions',[]),'structuralBreak':company.get('structuralBreak'),'coverage':company.get('coverage'),'primarySources':{k:{a:v for a,v in e.items() if a!='originalFile'} for k,e in source_ledger.items()}}

if __name__=='__main__':
 companies={t:build_company(t) for t in TICKERS}
 foreign=pathlib.Path(__file__).with_name('foreign-history-source.json')
 if not foreign.exists():foreign=pathlib.Path('/workspace/shared/valuation-data/foreign-assumption-history.json')
 if foreign.exists():
  # Supplemental foreign issuer records are normalized below by a separate reviewed adapter.
  extra=json.load(open(foreign))
  for t,c in extra.get('companies',{}).items():
   if 'observations' in c:companies[t]=normalize_foreign(t,c,extra.get('sources',{}))
   elif 'annual' in c:
    rows=([c['baseObservation']] if c.get('baseObservation') else [])+c['annual'];derive_metrics(rows);companies[t]=c
 for t in ['NBIS','TSM']:
  if t not in companies:companies[t]={'ticker':t,'currency':'USD' if t=='NBIS' else 'TWD','annual':[],'baseObservation':None,'backtestEligible':False,'cautions':['Historical issuer evidence is still being reviewed. Missing history is not zero.']}
 output={'schemaVersion':1,'asOf':ASOF,'classification':'Current-research historical context; latest-reported evidence, not an as-released backtest or forecasts.','units':{'financials':'reporting-currency millions','shares':'millions','rates':'decimal fractions','capitalProductivity':'multiple'},'methodology':{'selection':'Last five complete fiscal years; a sixth preceding annual observation supports growth and beginning-capital denominators. Latest eligible annual filing per period/concept, through cutoff; can include recasts. Quarter and YTD facts excluded.','capitalProxy':'Book equity + explicitly mapped debt − cash and cash equivalents. Not adjusted invested capital: does not deduct marketable securities or capitalize R&D, normalize leases, remove goodwill, or validate all debt/claims.','reinvestmentWarning':'Historical total sales/book-capital is a stock ratio. The model uses incremental revenue/reinvestment. Neither that stock ratio nor changes in book capital are a direct measurement of economic marginal reinvestment.','taxWarning':'Tax/pretax income only when pretax income > 0. Tax benefits or >100% rates shown but excluded from normal ranges/ROIC. Effective accounting tax is not a forecast marginal cash-tax rate; no NOL schedule.','rangeWarning':'Observed min/median/max of available observations are descriptive, not recommended ranges or prediction intervals.','temporalWarning':'History uses latest-reported data and must not be used to assert what was known at an earlier date.','teachingSources':[{'title':'Damodaran: Fundamental determinants of growth','url':'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/growth.htm'},{'title':'Damodaran: Growth-company value drivers','url':'https://people.stern.nyu.edu/adamodar/New_Home_Page/littlebook/growthvaluedrivers.htm'},{'title':'Damodaran: Valuation lecture notes, sales to invested capital','url':'https://pages.stern.nyu.edu/adamodar/pdfiles/eqnotes/valpacket1spr23.pdf'}]},'companies':companies}
 OUT.write_text(json.dumps(output,indent=2)+'\n')
 for t,c in companies.items():print(t,[(r['period'],r['facts']['revenue']['value'],r['metrics']['operatingMargin']['value'],r['metrics']['effectiveTaxRate']['value'],r['metrics']['bookSalesCapitalProxy']['value']) for r in c['annual']])
 print('Wrote',OUT)
