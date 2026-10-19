import pathlib,json,re,hashlib
from lxml import html
P=pathlib.Path(__file__).parent;f=P/'sources/Q2-2026-financials.htm';tree=html.parse(str(f));tabs=tree.xpath('//table');url='https://www.sec.gov/Archives/edgar/data/1033767/000119312526322030/umc-ex99_1.htm';prov={}
def row(i,label,n,key):
 for tr in tabs[i].xpath('./tr'):
  cells=[' '.join(' '.join(td.itertext()).split()) for td in tr.xpath('./td')]
  if cells and cells[0]==label:
   v=[]
   for c in cells[1:]:
    if re.fullmatch(r'\(?\$?\s*[0-9][0-9,]*(?:\.\d+)?\)?',c):v.append(float(c.replace('$','').replace(',','').replace('(','-').replace(')','').strip())/1000)
    elif c=='-':v.append(0)
   v=v[-n:];assert len(v)==n,(label,cells,v)
   prov[key]={'source_url':url,'source_file':str(f.relative_to(P)),'source_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'row_xpath':tree.getpath(tr),'row_label':label,'statement_table':i,'raw_unit':'NTD thousands','output_unit':'NTD millions','values':v}
   return v
 raise ValueError((i,label))
B={};maps=[(0,{'cash':'Cash and cash equivalents','fvtpl_current':'Financial assets at fair value through profit or loss, current','amortized_cost_current':'Financial assets measured at amortized cost, current','ar':'Accounts receivable, net','ar_related':'Accounts receivable-related parties, net','inventory':'Inventories, net','equity_method_investments':'Investments accounted for under the equity method','ppne':'Property, plant and equipment','rou_assets':'Right-of-use assets','intangibles':'Intangible assets','assets':'Total assets'}),(1,{'short_loans':'Short-term loans','ap':'Accounts payable','equipment_payables':'Payables on equipment','dividend_payable':'Dividends payable','current_tax_liabilities':'Current tax liabilities','lease_current':'Lease liabilities, current','current_long_term_liabilities':'Current portion of long-term liabilities','bonds_noncurrent':'Bonds payable','loans_noncurrent':'Long-term loans','lease_noncurrent':'Lease liabilities, noncurrent','guarantee_deposits':'Guarantee deposits','pension':'Net defined benefit liabilities, noncurrent','parent_equity':'Total equity attributable to the parent company','nci':'Non-controlling interests','equity_total':'Total equity','common_capital_par_twd10':'Common stock','treasury_cost':'Treasury stock'})]
for i,mm in maps:
 for k,l in mm.items():B[k]=row(i,l,3,'balance.'+k)[0]
I={'q2':{},'h1':{}}
for k,l in {'revenue':'Operating revenues','cogs':'Operating costs','gross_profit':'Gross profit','rd':'Research and development expenses','sga':'General and administrative expenses','selling':'Sales and marketing expenses','ebit':'Operating income','equity_method_profit':'Share of profit or loss of associates and joint ventures','other_gains':'Other gains and losses','interest_income':'Interest income','finance_cost':'Finance costs','pretax':'Income from continuing operations before income tax','tax_expense':'Income tax expense','net_income':'Net income','net_income_parent':'Shareholders of the parent'}.items():
 v=row(2,l,4,'income.'+k);I['q2'][k]=v[0];I['h1'][k]=v[2]
C={}
for i,mm in [(4,{'cfo':'Net cash provided by operating activities','depreciation':'Depreciation','amortization':'Amortization','sbc':'Share-based payment','cash_interest_received':'Interest received','cash_dividend_received':'Dividend received','cash_interest_paid':'Interest paid','cash_tax_paid':'Income tax paid','deferred_grant_amortization':'Amortization of deferred government grants'}),(5,{'cash_ppe':'Acquisition of property, plant and equipment','cash_intangibles':'Acquisition of intangible assets','capital_grants_received':'Government grants related to assets acquisition','lease_principal':'Cash payments for the principal portion of the lease liability','treasury_purchase':'Treasury stock acquired','deposits_received':'Increase in guarantee deposits','deposits_repaid':'Decrease in guarantee deposits'})]:
 for k,l in mm.items():C[k]=row(i,l,2,'cashflow.'+k)[0]
x={'ticker':'UMC','balance_date':'2026-06-30','research_cutoff':'2026-10-19','unit':'NTD millions; NOT USD','balance':B,'income':I,'h1_cash_flow':C,'source_url':url,'warnings':['Issuer capital-management net debt uses all liabilities; do not treat it as financial debt.','Equity-method gains and investmentmarktomarket are excluded from recurringfoundryFCFF.','Dividend payable is an existingcommoncashclaim; distinguish cum/exdistribution valuation.','Employee restricted shares may already be issued; avoidadding them twice.','Guarantee/customerdeposits are financing-like obligations; assessrefund/capacityterms beforetreatingascashavailable.']}
(P/'interim-facts-v1.json').write_text(json.dumps(x,indent=2));(P/'interim-field-provenance-v1.json').write_text(json.dumps(prov,indent=2));print(json.dumps(x,indent=2))
