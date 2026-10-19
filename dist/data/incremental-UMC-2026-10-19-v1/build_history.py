"""UMC audited financial-statement history. Reads immutable, locally archived SEC 20-F HTML.
No companyfacts contexts are used to select financial values. All source figures are
NT$ thousands except EPS and explicitly labeled thousand-share rows.
"""
from pathlib import Path
from lxml import html
import json, re, hashlib, csv
from decimal import Decimal
from collections import defaultdict
P=Path(__file__).parent; S=P/'sources'
def txt(e): return ' '.join(e.text_content().split())
def norm(s): return re.sub(r'[^a-z0-9]','',s.lower())
def values(r):
    cells=[(c,txt(c)) for c in r.xpath('./td|./th')]
    vals=[]
    for i,(c,s) in enumerate(cells):
        if re.fullmatch(r'\(?-?[\d,]+(?:\.\d+)?\)?|[—–−-]',s):
            z=s in ['—','–','−','-']; raw=s
            if z:v=Decimal(0)
            else:
                v=Decimal(s.replace(',','').replace('(','').replace(')',''))
                ns=next((x for _,x in cells[i+1:] if x),'')
                ps=next((x for _,x in reversed(cells[:i]) if x),'')
                if '(' in s or ns==')' or ps=='(':v=-abs(v)
            vals.append((v,raw,c,z))
    return vals

def rows(t):
    out=[]
    for r in t.xpath('./tr|./tbody/tr'):
        cells=r.xpath('./td|./th'); label=txt(cells[0]) if cells else ''
        out.append((label,values(r),r))
    return out

maps={
 'bs':{
  'cash':['Cash and cash equivalents'], 'financial_assets_fvtpl_current':['Financial assets at fair value through profit or loss, current'],
  'financial_assets_fvoci_current':['Financial assets at fair value through other comprehensive income, current'],
  'financial_assets_amortized_cost_current':['Financial assets measured at amortized cost, current'],
  'financial_assets_afs_current':['Available-for-sale financial assets, current'],
  'contract_assets_current':['Contract assets, current'], 'receivables':['Accounts receivable, net','Notes receivable and accounts receivable, net'],
  'receivables_related':['Accounts receivable-related parties, net','Accounts receivable – related parties, net','Notes receivable and accounts receivable-related parties, net'],
  'notes_receivable':['Notes receivable'],'other_receivables':['Other receivables'],'inventories':['Inventories, net'],'prepayments_current':['Prepayments'],
  'other_current_assets':['Other current assets'],'current_assets':['Total current assets'],
  'financial_assets_fvtpl_noncurrent':['Financial assets at fair value through profit or loss, noncurrent'],
  'financial_assets_fvoci_noncurrent':['Financial assets at fair value through other comprehensive income, noncurrent'],
  'financial_assets_afs_noncurrent':['Available-for-sale financial assets, noncurrent'],
  'financial_assets_cost_noncurrent':['Financial assets measured at cost, noncurrent'],
  'equity_method_investments':['Investments accounted for under the equity method'],
  'ppe_net':['Property, plant and equipment'],'right_of_use_assets':['Right-of-use assets'],'intangibles':['Intangible assets'],
  'prepayment_equipment':['Prepayment for equipment'],'assets':['Total assets'],'short_debt':['Short-term loans'],
  'contract_liabilities_current':['Contract liabilities, current'],'accounts_payable':['Accounts payable','Notes and accounts payable'],
  'other_payables':['Other payables'],'equipment_payables':['Payables on equipment'],
  'leases_current':['Lease liabilities, current'],'current_long_term_liabilities':['Current portion of long-term liabilities'],
  'other_current_liabilities':['Other current liabilities'],'current_liabilities':['Total current liabilities'],
  'bonds_noncurrent':['Bonds payable'],'loans_noncurrent':['Long-term loans'],'leases_noncurrent':['Lease liabilities, noncurrent'],
  'other_financial_liabilities_noncurrent':['Other financial liabilities, noncurrent'],
  'guarantee_deposits':['Guarantee deposits'],'liabilities':['Total liabilities'],
  'common_stock':['Common stock - NT$10 par value','Common stock – NT$10 par value'],
  'equity_parent':['Total equity attributable to the parent company'],'noncontrolling_interest_equity':['Non-controlling interests'],
  'equity_total':['Total equity'],'liabilities_and_equity':['Total liabilities and equity'],
 },
 'income':{
  'revenue':['Operating revenues','Net operating revenues'],'cost_of_revenue_signed':['Operating costs'],
  'gross_profit':['Gross profit'],'selling_expense_signed':['Sales and marketing expenses'],
  'general_admin_expense_signed':['General and administrative expenses'],'rd_expense_signed':['Research and development expenses'],
  'other_operating_income_expense':['Net other operating income and expenses'],'ebit_reported':['Operating income'],
  'interest_income':['Interest income'],'finance_costs_signed':['Finance costs'],
  'pretax_income':['Income from continuing operations before income tax'],'income_tax_expense_signed':['Income tax expense','Income tax benefit (expense)'],
  'net_income_total':['Net income'],'net_income_parent':['Stockholders of the parent','Shareholders of the parent'],
  'net_income_nci':['Non-controlling interests'],'eps_basic_twd':['Earnings per share-basic'],'eps_diluted_twd':['Earnings per share-diluted']
 },
 'cf':{
  'cf_pretax_income':['Net income before tax'],'depreciation':['Depreciation'],'amortization':['Amortization'],
  'sbc_cf_addback':['Share-based payment'],'interest_expense_cf_addback':['Interest expense'],
  'cf_income_expense_adjustments':['Income and expense adjustments'],'cf_change_fvtpl':['Financial assets and liabilities at fair value through profit or loss'],
  'cf_change_contract_assets':['Contract assets'],'cf_change_receivables':['Accounts receivable','Notes receivable and accounts receivable'],
  'cf_change_other_receivables':['Other receivables'],'cf_change_inventories':['Inventories'],'cf_change_prepayments':['Prepayments'],
  'cf_change_other_current_assets':['Other current assets'],'cf_change_contract_fulfillment':['Contract fulfillment costs'],
  'cf_change_contract_liabilities':['Contract liabilities'],'cf_change_accounts_payable':['Accounts payable','Notes and accounts payable'],
  'cf_change_other_payables':['Other payables'],'cf_change_other_current_liabilities':['Other current liabilities'],
  'cf_change_pension':['Net defined benefit liabilities'],'cf_change_other_noncurrent_liabilities':['Other noncurrent liabilities'],
  'cash_generated_operations':['Cash generated from operations'],'interest_received':['Interest received'],
  'dividends_received':['Dividend received'],'interest_paid_signed':['Interest paid'],'tax_paid_signed':['Income tax paid'],
  'cfo':['Net cash provided by operating activities'],'cash_ppe_signed':['Acquisition of property, plant and equipment'],
  'ppe_disposal_proceeds':['Proceeds from disposal of property, plant and equipment'],'cash_intangibles_signed':['Acquisition of intangible assets'],
  'government_grants_assets':['Government grants related to assets acquisition'],
  'subsidiary_acquisition_cash_signed':['Acquisition of subsidiary (net of cash acquired)','Acquisition of subsidiaries (net of cash acquired)'],
  'cfi':['Net cash used in investing activities','Net cash provided by (used in) investing activities'],
 },
 'financing':{
  'lease_principal_paid_signed':['Cash payments for the principal portion of the lease liability'],
  'cash_dividends_signed':['Cash dividends','Cash dividends and cash paid from additional paid-in capital'],
  'cfin':['Net cash used in financing activities','Net cash provided by (used in) financing activities','Net cash provided by financing activities'],
  'fx_effect_on_cash':['Effect of exchange rate changes on cash and cash equivalents'],
  'net_change_cash':['Net increase (decrease) in cash and cash equivalents','Net increase in cash and cash equivalents'],
  'cash_beginning':['Cash and cash equivalents at beginning of year'],'cash_ending':['Cash and cash equivalents at end of year'],
 },
 'eps':{
  'weighted_average_basic_shares_m':['Weighted-average number of ordinary shares for basic earnings per share (thousand shares)'],
  'weighted_average_diluted_shares_m':['Weighted-average number of common stocks after dilution (thousand shares)','Weighted-average number of ordinary shares after dilution (thousand shares)']
 }
}
maps['cash_note']={'cash_note_total':['Total'],'cash_note_on_hand':['Cash on hand and petty cash','Cash on hand'],'cash_note_bank_accounts':['Checking and savings accounts'],'cash_note_time_deposits':['Time deposits'],'cash_note_repo':['Repurchase agreements collateralized by government bonds and corporate notes','Repurchase agreements collateralized by government and corporate bonds']}
maps['liabilities_note']={'short_debt_note':['Short-term loans'],'bonds_including_current_note':['Bonds payable (current portion included)'],'loans_including_current_note':['Long-term loans (current portion included)'],'leases_total_note':['Lease liabilities'],'other_financial_liabilities_note':['Other financial liabilities','Other financial liabilities-noncurrent','Other financial liabilities - noncurrent'],'guarantee_deposits_including_current_note':['Guarantee deposits (current portion included)'],'capacity_deposit_including_current_note':['Capacity deposit (current portion included)']}
allobs=[]; summaries=[]; tableids={}; metadata={}; missing=[]
recent=json.loads((S/'submissions.json').read_text())['filings']['recent']
urls={recent['primaryDocument'][i]:'https://www.sec.gov/Archives/edgar/data/1033767/'+recent['accessionNumber'][i].replace('-','')+'/'+recent['primaryDocument'][i] for i in range(len(recent['form']))}
for p in sorted(S.glob('20-F*.htm')):
    filing_date=p.name.split('_')[1]; fy=int(filing_date[:4])-1; d=html.fromstring(p.read_bytes());ts=d.xpath('//table');tree=d.getroottree()
    source={'file':'sources/'+p.name,'url':urls[p.name.split('_',2)[2]],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'filing_date':filing_date,'original_fiscal_year':fy}
    metadata[fy]={**source,'unit_header_locators':[{'xpath':tree.getpath(e),'text':' '.join((e.text or '').split())} for e in d.iter() if 'Expressed in Thousands' in (e.text or '')]}
    bi=next(i for i,t in enumerate(ts) if 'Total current assets' in txt(t) and 'Total liabilities' in txt(t) and 'Cash and cash equivalents' in txt(t) and len(txt(t))>3000)
    ci=next(i for i,t in enumerate(ts) if i>bi and 'Net cash provided by operating activities' in txt(t) and 'Depreciation' in txt(t) and len(txt(t))>3000)
    epsi=[i for i,t in enumerate(ts) if i>ci and ('number of ordinary shares' in txt(t) or 'number of common stocks' in txt(t)) and 'earnings per share' in txt(t) and len(txt(t))<3000]
    groups=[('bs',bi,[fy-1,fy]),('income',bi+1,[fy-2,fy-1,fy]),('cf',ci,[fy-2,fy-1,fy]),('financing',ci+1,[fy-2,fy-1,fy])]+[('eps',i,[fy-2,fy-1,fy]) for i in epsi]
    cashi=[i for i,t in enumerate(ts) if i>ci and 'Cash on hand' in txt(t) and 'Time deposits' in txt(t) and 'Total' in txt(t) and len(txt(t))<2000]
    li=[i for i,t in enumerate(ts) if i>ci and 'Financial liabilities measured at amortized cost' in txt(t) and 'Bonds payable (current portion included)' in txt(t) and len(txt(t))<3000]
    groups += [('cash_note',i,[fy-1,fy]) for i in cashi] + [('liabilities_note',i,[fy-1,fy]) for i in li]
    tableids[fy]={g:[i,tree.getpath(ts[i])] for g,i,ys in groups if g!='eps'};tableids[fy]['eps']=epsi
    for g,i,years in groups:
        t=ts[i]; seen=set()
        for label,vs,r in rows(t):
            if not vs: continue
            for field,aliases in maps[g].items():
                if field in seen or norm(label) not in [norm(a) for a in aliases]: continue
                needed=len(years)+(0 if g in ['eps','cash_note','liabilities_note'] else 1)
                if len(vs)<needed:
                    missing.append({'fy':fy,'field':field,'row':txt(r),'issue':'too few numeric cells'});continue
                vs=vs[-needed:][:len(years)];seen.add(field)
                for y,(v,raw,cell,is_dash) in zip(years,vs):
                    unit='TWD/share' if field.startswith('eps_') else 'million shares' if field.endswith('shares_m') else 'TWD millions'
                    divisor=Decimal(1) if field.startswith('eps_') else Decimal(1000)
                    obs={'year':y,'field':field,'value':float(v/divisor),'unit':unit,'source_value':str(v),'source_unit':'TWD per share' if field.startswith('eps_') else 'thousand shares' if field.endswith('shares_m') else 'NT$ thousands','reported_token':raw,'reported_dash':is_dash,'statement':g,'row_label':label,'row_xpath':tree.getpath(r),'cell_xpath':tree.getpath(cell),'table_index_zero_based':i,'observation_role':'original' if y==fy else 'comparative',**source}
                    allobs.append(obs)


    # Balance-sheet capital note explicitly labels these as issued, not treasury-adjusted outstanding.
    for label,vs,r in rows(ts[bi]):
        m=re.search(r'Issued:\s*([\d,]+)\s*thousand shares as of December 31,\s*(20\d\d)',txt(r))
        if m:
            q=Decimal(m.group(1).replace(',','')); y=int(m.group(2))
            allobs.append({'year':y,'field':'issued_shares_m_rounded','value':float(q/1000),'unit':'million shares','source_value':str(q),'source_unit':'thousand shares','reported_token':m.group(1),'reported_dash':False,'statement':'bs_capital_annotation','row_label':txt(r),'row_xpath':tree.getpath(r),'cell_xpath':tree.getpath(r),'table_index_zero_based':bi,'observation_role':'original' if y==fy else 'comparative',**source})

# Persist raw, exact lineage separately from tidy model-facing data.
original={y:{o['field']:o for o in allobs if o['year']==y and o['original_fiscal_year']==y} for y in range(2016,2026)}
latest={y:{o['field']:o for o in sorted(allobs,key=lambda o:o['filing_date']) if o['year']==y} for y in range(2016,2026)}

def derived_row(y,d):
    r={'year':y,'sbc_cf_reported_dash':d.get('sbc_cf_addback',{}).get('reported_dash')};r.update({k:o['value'] for k,o in d.items()})
    def calc(k,fs,func):
        if all(f in r and r[f] is not None for f in fs):r[k]=round(func(*[r[f] for f in fs]),9)
    calc('da',['depreciation','amortization'],lambda a,b:a+b)
    for new,old in [('cash_ppe','cash_ppe_signed'),('cash_intangibles','cash_intangibles_signed'),('tax_expense','income_tax_expense_signed'),('tax_paid','tax_paid_signed'),('interest_paid','interest_paid_signed')]:calc(new,[old],lambda v:-v)
    calc('gross_margin',['gross_profit','revenue'],lambda a,b:a/b)
    calc('ebit_margin',['ebit_reported','revenue'],lambda a,b:a/b)
    calc('effective_tax_rate',['tax_expense','pretax_income'],lambda a,b:a/b)
    calc('fcf_cfo_less_cash_ppe',['cfo','cash_ppe'],lambda a,b:a-b)
    calc('fcf_cfo_less_cash_ppe_intangibles',['cfo','cash_ppe','cash_intangibles'],lambda a,b,c:a-b-c)
    calc('borrowings_ex_leases',['short_debt','current_long_term_liabilities','bonds_noncurrent','loans_noncurrent'],lambda *v:sum(v))
    calc('leases_total',['leases_current','leases_noncurrent'],lambda a,b:a+b)
    calc('borrowings_from_notes_ex_leases',['short_debt_note','bonds_including_current_note','loans_including_current_note'],lambda *v:sum(v))
    calc('borrowings_plus_leases',['borrowings_ex_leases','leases_total'],lambda a,b:a+b)
    calc('core_nwc',['receivables','receivables_related','inventories','accounts_payable'],lambda a,b,c,d:a+b+c-d)
    calc('cf_working_capital_core_cash_effect',['cf_change_receivables','cf_change_inventories','cf_change_accounts_payable'],lambda a,b,c:a+b+c)
    calc('current_assets_minus_current_liabilities',['current_assets','current_liabilities'],lambda a,b:a-b)
    calc('net_cash_less_borrowings_ex_leases',['cash','borrowings_ex_leases'],lambda a,b:a-b)
    calc('cash_plus_amortized_cost_current',['cash','financial_assets_amortized_cost_current'],lambda a,b:a+b)
    # CF residual explicitly includes non-current pension/non-current liability changes; not a narrow working-capital claim.
    calc('cf_operating_assets_liabilities_total',['cash_generated_operations','cf_pretax_income','cf_income_expense_adjustments'],lambda a,b,c:a-b-c)
    calc('fcf_after_cash_ppe_intangibles_lease_principal',['cfo','cash_ppe','cash_intangibles','lease_principal_paid_signed'],lambda a,b,c,d:a-b-c+d)
    calc('net_cash_ppe_after_disposals_and_capital_grants',['cash_ppe','ppe_disposal_proceeds','government_grants_assets'],lambda a,b,c:a-b-c)
    if 'cf_change_other_current_assets' in r:
        prepayment_value = r.get('cf_change_prepayments',0) if d.get('cf_change_prepayments',{}).get('file') == d['cf_change_other_current_assets'].get('file') else 0
        r['cf_other_current_assets_including_prepayments']=round(r['cf_change_other_current_assets']+prepayment_value,9)
    return r
origrows=[derived_row(y,d) for y,d in original.items()]; latestrows=[derived_row(y,d) for y,d in latest.items()]
for rs in [origrows,latestrows]:
    for i,r in enumerate(rs):
        if i and 'core_nwc' in r and 'core_nwc' in rs[i-1]:r['change_core_nwc']=round(r['core_nwc']-rs[i-1]['core_nwc'],9)

diffs=[]
for o in allobs:
    a=original.get(o['year'],{}).get(o['field'])
    if a and a['value']!=o['value']:diffs.append({'year':o['year'],'field':o['field'],'original_value':a['value'],'later_value':o['value'],'original_source':a,'later_source':o,'classification':'changed audited comparative; analyze cause before treating as restatement'})
valid=[]
for r in origrows:
    checks={
      'cash_note_matches_statement':(['cash_note_total','cash'],lambda a,b:a-b),
      'short_debt_note_matches_statement':(['short_debt_note','short_debt'],lambda a,b:a-b),
      'borrowings_note_matches_statement':(['borrowings_from_notes_ex_leases','borrowings_ex_leases'],lambda a,b:a-b),
      'gross_profit':(['revenue','cost_of_revenue_signed','gross_profit'],lambda a,b,c:a+b-c),
      'pretax_less_tax_equals_income':(['pretax_income','income_tax_expense_signed','net_income_total'],lambda a,b,c:a+b-c),
      'income_attribution':(['net_income_parent','net_income_nci','net_income_total'],lambda a,b,c:a+b-c),
      'balance_sheet_balances':(['assets','liabilities_and_equity'],lambda a,b:a-b),
      'equity_attribution':(['equity_parent','noncontrolling_interest_equity','equity_total'],lambda a,b,c:a+b-c),
      'cash_flow_bridge':(['cfo','cfi','cfin','fx_effect_on_cash','net_change_cash'],lambda a,b,c,d,e:a+b+c+d-e),
      'cash_balance_bridge':(['cash_beginning','net_change_cash','cash_ending'],lambda a,b,c:a+b-c),
      'cf_end_cash_equals_balance_sheet':(['cash','cash_ending'],lambda a,b:a-b),
      'cfo_reconciliation':(['cash_generated_operations','interest_received','dividends_received','interest_paid_signed','tax_paid_signed','cfo'],lambda a,b,c,d,e,f:a+b+c+d+e-f),
    }
    for name,(fields,f) in checks.items():
        ok=all(k in r for k in fields); residual=round(f(*[r[k] for k in fields]),6) if ok else None
        valid.append({'year':r['year'],'check':name,'residual_TWD_millions':residual,'pass':abs(residual)<0.00001 if ok else None,'missing_fields':[k for k in fields if k not in r]})

for name,data in [('history-original-v1.json',origrows),('history-latest-comparative-v1.json',latestrows),('history-observations-v1.json',allobs),('history-comparative-differences-v1.json',diffs),('history-validation-v1.json',{'checks':valid,'parser_issues':missing,'source_tables':tableids,'missing_expected_by_year':{y:[f for f in ['revenue','ebit_reported','net_income_parent','cfo','cash_ppe','sbc_cf_addback','weighted_average_basic_shares_m','weighted_average_diluted_shares_m','core_nwc'] if f not in origrows[y-2016]] for y in range(2016,2026)}}),('history-sources-v1.json',list(metadata.values()))]:
    (P/name).write_text(json.dumps(data,indent=2))
for name,data in [('history-original-v1.csv',origrows),('history-latest-comparative-v1.csv',latestrows),('history-field-provenance-v1.csv',allobs)]:
    fields=list(dict.fromkeys(k for r in data for k in r));
    with (P/name).open('w') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(data)
print(json.dumps({'rows':len(origrows),'observations':len(allobs),'comparative_changes':len(diffs),'validation_failed':[x for x in valid if x['pass'] is False],'validation_missing':[x for x in valid if x['pass'] is None],'parser_issues':missing,'original_fields':{r['year']:len(r) for r in origrows}},indent=2))
