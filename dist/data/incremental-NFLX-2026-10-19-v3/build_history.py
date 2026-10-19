"""Rebuild derived history from archived SEC sources; build requires lxml, model replay does not."""
import json,re,csv,pathlib,hashlib
from lxml import html
R=pathlib.Path(__file__).resolve().parent; S=R/'sources'; CF=json.loads((S/'sec-companyfacts.json').read_text())
sp=json.loads((R/'source-provenance-v3.json').read_text());src={x['file'].split('/')[-1]:x for x in sp['files']}
subs=[]
for f in ['sec-submissions.json','submissions-history.json']:
 a=json.loads((S/f).read_text());a=a['filings']['recent'] if 'filings' in a else a
 for i,accn in enumerate(a['accessionNumber']):subs.append((accn,a['primaryDocument'][i]))
filenames=dict(subs)

def cf(field,tags,year,end=None,duration=True):
 end=end or f'{year}-12-31';start=f'{year}-01-01'
 for tag in tags:
  ns='dei' if tag.startswith('Entity') else 'us-gaap';f=CF['facts'].get(ns,{}).get(tag)
  if not f:continue
  unit='shares' if 'shares' in f['units'] else 'USD'
  if unit not in f['units']:continue
  a=[x for x in f['units'][unit] if x['end']==end and x.get('filed','')<='2026-10-19' and x['form'] in ['10-K','10-Q'] and ((duration and x.get('start')==start) or (not duration and not x.get('start')))]
  if not a:continue
  v=max(a,key=lambda x:(x['filed'],x.get('frame','')));split=10 if unit=='shares' and v['filed']<'2025-11-14' else 1
  fn=filenames.get(v['accn']);url=f"https://www.sec.gov/Archives/edgar/data/1065280/{v['accn'].replace('-','')}/{fn or (v['accn']+'-index.htm')}"
  return v['val']*split/1e6,{'source_url':url,'source_snapshot':'sources/sec-companyfacts.json','source_sha256':src['sec-companyfacts.json']['sha256'],'tag':ns+':'+tag,'unit_original':unit,'raw_fact':v,'split_multiplier':split,'transform':'raw value * split_multiplier / 1000000','status':'reported SEC companyfacts; exact fiscal date/duration selection, not a stock quote'}
 return None,{'status':'missing_not_zero','tags_checked':tags}

def number(t):
 t=t.replace('$','').replace(',','').strip()
 if t in ['—','–']:return 0.0
 if not re.fullmatch(r'\(?-?\d+(?:\.\d+)?\)?',t):return None
 neg=t.startswith('(');return float(t.replace('(','').replace(')',''))*(-1 if neg else 1)

def rows(file):
 d=html.fromstring((S/file).read_bytes());res={}
 for ti,t in enumerate(d.xpath('//table')):
  for ri,r in enumerate(t.xpath('./tr|./tbody/tr')):
   cells=[' '.join(c.text_content().split()) for c in r.xpath('./td|./th')]
   if not cells:continue
   label=cells[0]; vals=[number(t) for t in cells[1:] if number(t) is not None]
   if vals:res.setdefault(label,[]).append((vals,ti,ri))
 return res

fields={
'revenue':['Revenues'],'ebit':['OperatingIncomeLoss'],'net_income':['NetIncomeLoss'],
'pretax_income':['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest','IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'],
'income_tax_expense':['IncomeTaxExpenseBenefit'],'cfo':['NetCashProvidedByUsedInOperatingActivities'],'ppe_purchases':['PaymentsToAcquirePropertyPlantAndEquipment'],'noncontent_da':['DepreciationDepletionAndAmortization'],'sbc':['ShareBasedCompensation'],'interest_expense':['InterestExpenseNonoperating','InterestExpense'],'interest_paid':['InterestPaid','InterestPaidNet'],'cash_income_taxes':['IncomeTaxesPaidNet','IncomeTaxesPaid'],'buybacks_cash':['PaymentsForRepurchaseOfCommonStock'],'eps_weighted_basic_shares_split_adjusted_m':['WeightedAverageNumberOfSharesOutstandingBasic'],'eps_weighted_diluted_shares_split_adjusted_m':['WeightedAverageNumberOfDilutedSharesOutstanding'],
'cash':['CashAndCashEquivalentsAtCarryingValue'],'short_investments':['ShortTermInvestments'],'debt_noncurrent_carrying':['LongTermDebtNoncurrent'],'debt_current_carrying':['ShortTermBorrowings'],'common_shares_actual_split_adjusted_m':['CommonStockSharesOutstanding','EntityCommonStockSharesOutstanding'],'equity':['StockholdersEquity'],'operating_lease_current':['OperatingLeaseLiabilityCurrent'],'operating_lease_noncurrent':['OperatingLeaseLiabilityNoncurrent']}
instants={'cash','short_investments','debt_noncurrent_carrying','debt_current_carrying','common_shares_actual_split_adjusted_m','equity','operating_lease_current','operating_lease_noncurrent'}
manual={
'content_additions_signed':['Additions to content assets','Additions to streaming content assets'],
'content_liabilities_change_signed':['Change in content liabilities','Change in streaming content liabilities'],
'content_amortization':['Amortization of content assets','Amortization of streaming content assets'],
'dvd_content_amortization_separately_reported':['Amortization of DVD content assets'],
'dvd_asset_purchases_separately_reported_signed':['Acquisition of DVD content assets'],
'other_investing_assets_signed':['Change in other assets','Other assets'],
'acquisitions_cash_signed':['Acquisitions']}
fileyears=[('nflx-20181231.htm',[2018,2017,2016]),('nflx-20211231.htm',[2021,2020,2019]),('nflx-20231231.htm',[2023,2022,2021]),('nflx-20251231.htm',[2025,2024,2023])]
hist={};prov={};checks=[]
for y in range(2016,2026):
 row={'fiscal_year':y,'period_start':f'{y}-01-01','period_end':f'{y}-12-31'};pr={}
 for name,tags in fields.items():row[name],pr[name]=cf(name,tags,y,duration=name not in instants)
 file,yrs=next((f,ys) for f,ys in fileyears if y in ys);table=rows(file);idx=yrs.index(y)
 for name,labels in manual.items():
  found=next(((lab,vs,ti,ri) for lab in labels for vs,ti,ri in table.get(lab,[]) if len(vs)==3),None)
  if found:
   lab,vs,ti,ri=found;row[name]=vs[idx]/1000;pr[name]={'source_url':src[file]['url'],'source_file':'sources/'+file,'source_sha256':src[file]['sha256'],'locator':f'HTML table {ti}, row {ri}, label {lab}; zero-based indices','reported_year_order':yrs,'raw_thousands':vs[idx],'transform':'USD thousand / 1000'}
  else:row[name]=None;pr[name]={'status':'not_separately_reported_not_zero','note':('DVD separately shown through 2018; later presentation absorbs immaterial DVD amounts in other items. Not added to streaming cash investment.' if name.startswith('dvd') else 'No separately identified three-year row in selected primary table; absent is not assumed zero.')}
 row['content_cash_payments_derived']=-(row['content_additions_signed']+row['content_liabilities_change_signed'])
 row['cash_content_to_amortization']=row['content_cash_payments_derived']/row['content_amortization']
 row['net_content_investment_derived']=row['content_cash_payments_derived']-row['content_amortization']
 row['operating_margin']=row['ebit']/row['revenue'];row['effective_book_tax_rate']=row['income_tax_expense']/row['pretax_income']
 row['cfo_less_ppe_purchases']=row['cfo']-row['ppe_purchases']
 row['cfo_less_ppe_less_sbc_cash_replacement_proxy']=row['cfo_less_ppe_purchases']-row['sbc']
 for name,labels in {'revenue':['Revenues'],'ebit':['Operating income'],'net_income':['Net income'],'cfo':['Net cash provided by (used in) operating activities','Net cash provided by operating activities','Net cash used in operating activities'],'noncontent_da':['Depreciation and amortization of property, equipment and intangibles'],'sbc':['Stock-based compensation expense'],'ppe_purchases':['Purchases of property and equipment']}.items():
  found=next(((lab,vs,ti,ri) for lab in labels for vs,ti,ri in table.get(lab,[]) if len(vs)==3),None)
  if found:
   lab,vs,ti,ri=found;v=vs[idx]/1000;v=-v if name=='ppe_purchases' else v
   checks.append({'year':y,'metric':name,'companyfacts':row[name],'primary_table_value':v,'match':abs(row[name]-v)<1e-6,'source_url':src[file]['url'],'locator':f'HTML table {ti}, row {ri}; {lab}'})
 for name in list(row):
  if name not in pr and name not in ['fiscal_year','period_start','period_end']:pr[name]={'status':'calculated','formula':{'content_cash_payments_derived':'-(content_additions_signed + content_liabilities_change_signed)','cash_content_to_amortization':'content_cash_payments_derived/content_amortization','net_content_investment_derived':'content_cash_payments_derived-content_amortization','operating_margin':'ebit/revenue','effective_book_tax_rate':'income_tax_expense/pretax_income','cfo_less_ppe_purchases':'cfo-ppe_purchases','cfo_less_ppe_less_sbc_cash_replacement_proxy':'cfo-ppe_purchases-sbc'}[name]}
 hist[y]=row;prov[y]=pr
h={'ticker':'NFLX','unit_policy':'USD millions except ratios; share fields millions, split normalized to post-November-2025 basis','as_of':'2026-10-19','annual_periods':list(hist.values()),'comparability_notes':['Consolidated US GAAP, calendar fiscal years; historical DVD business included through its September 2023 closure.','DVD cash purchases/amortization separately shown through 2018, then no longer separately disclosed; streaming/content rows are consistently the large streaming investment, not total historical investment.','2019 lease accounting adoption creates a lease balance-sheet comparability break; absent earlier lease balance entries remain null.','2020 pandemic and 2023 strikes affect cash content production timing; single-year CFO is not normalized recurring earning power.','November 14, 2025 ten-for-one split: original share data filed before split multiplied by ten. Later already-adjusted data are never multiplied again.','Cash income taxes may move from IncomeTaxesPaid to IncomeTaxesPaidNet under 2025 disclosure changes; tag provenance retained.','CFO less PPE is a calculated cash metric, not issuer-defined historical FCF, not FCFF and not acquisition-inclusive total-investment cash flow. Historical issuer FCF also deducted other investing assets, and older periods DVD content purchases. For example FY2021 CFO less PPE is -131.975m versus issuer FCF -158.894m after 26.919m other investing assets. SBC-cash-replacement subtraction is a policy proxy, not reported cash.']}
for fn,o in [('history-v3.json',h),('history-field-provenance-v3.json',prov),('history-primary-table-checks-v3.json',checks)]: (R/fn).write_text(json.dumps(o,indent=2)+'\n')
with (R/'history-v3.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=list(hist[2016]));w.writeheader();w.writerows(hist.values())
latest={'period_end':'2026-06-30','period_start':'2026-01-01','unit':'USD millions except shares millions','reported':{},'provenance':{}}
for name,tags in fields.items():latest['reported'][name],latest['provenance'][name]=cf(name,tags,2026,end='2026-06-30',duration=name not in instants)
table=rows('nflx-20260630.htm')
for name,labels in manual.items():
 found=next(((lab,vs,ti,ri) for lab in labels for vs,ti,ri in table.get(lab,[]) if len(vs)==4),None)
 if found:
  lab,vs,ti,ri=found;latest['reported'][name]=vs[2]/1000;latest['provenance'][name]={'source_url':src['nflx-20260630.htm']['url'],'source_sha256':src['nflx-20260630.htm']['sha256'],'locator':f'HTML table {ti}, row {ri}, label {lab}; H1 2026 third numeric column','raw_thousands':vs[2]}
r=latest['reported'];latest['derived']={'content_cash_payments':-r['content_additions_signed']-r['content_liabilities_change_signed'],'cfo_less_ppe':r['cfo']-r['ppe_purchases'],'operating_margin':r['ebit']/r['revenue']}
(R/'latest-half-v3.json').write_text(json.dumps(latest,indent=2)+'\n')
print('Annual records',len(hist),'primary table checks',len(checks),'failures',[c for c in checks if not c['match']])
for y,r in hist.items():print(y,*[round(r[k],3) if r[k] is not None else None for k in ['revenue','ebit','cfo','ppe_purchases','content_amortization','content_cash_payments_derived','cash_content_to_amortization','debt_current_carrying']])
print('latest',latest['reported'],latest['derived'])
