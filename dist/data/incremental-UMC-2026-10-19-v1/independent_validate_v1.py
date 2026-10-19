#!/usr/bin/env python3
"""Independent UMC Decimal replay and semantic checks; never imports the model engine.

Usage: python independent_validate_v1.py [--public-safe] [--write-report]
Public-safe mode needs only public JSON/CSV/MD artifacts. It explicitly skips frozen
raw-source byte checks and raw-source text anchors, never treating those as passed.
"""
from decimal import Decimal, getcontext
from pathlib import Path
from datetime import datetime, timezone
from html.parser import HTMLParser
import argparse, hashlib, json, sys, re
getcontext().prec = 50
D = Decimal
ROOT = Path(__file__).resolve().parent
CLAIMS = ['guarantee_deposits_reserved','dividend_payable_reserved','current_tax_reserved','contract_liabilities_reserved','refund_liabilities_reserved','legacy_pension_provision_claims_reserved']


def load(name):
    return json.loads((ROOT/name).read_text(), parse_float=D, parse_int=D)


def plain(x):
    if isinstance(x, D): return str(x)
    if isinstance(x, dict): return {k: plain(v) for k,v in x.items()}
    if isinstance(x, list): return [plain(v) for v in x]
    return x


class Review:
    def __init__(self):
        self.checks=[]; self.skipped=[]; self.warnings=[]; self.results=[]
    def test(self, label, ok, detail=None):
        self.checks.append({'check':label,'pass':bool(ok),**({'detail':plain(detail)} if detail is not None else {})})
    def equal(self, label, a, b, tolerance=D('0.0000001')):
        ok = abs(a-b) <= tolerance if isinstance(a,(D,int)) and not isinstance(a,bool) and isinstance(b,(D,int)) and not isinstance(b,bool) else a==b
        self.test(label,ok, None if ok else {'actual':a,'expected':b})
    def warn(self, code, text): self.warnings.append({'code':code,'text':text})


def annual_schedule(d):
    # Determine interval membership directly against June boundaries, rather than
    # duplicating the model's year/month index expression.
    schedule=[D(0) for _ in range(10)]
    for row in d['domestic_bond_principal_schedule']:
        year,month=map(int,row['maturity_month'].split('-'))
        for i in range(10):
            if (2026+i,6)<(year,month)<=(2027+i,6):
                schedule[i]+=row['principal']/1000
                break
        else: raise ValueError('Bond maturity outside forecast: '+row['maturity_month'])
    return schedule


def independently_calculate(x,p,d):
    debt=annual_schedule(d)
    bank_payments=[D(0)]*10
    if p['bank_principal_timing']=='all_upfront':bank_upfront=x['bank_debt_total']
    elif p['bank_principal_timing']=='current_upfront_remaining_year2':
        bank_upfront=x['bank_current_principal'];bank_payments[1]=x['bank_noncurrent_principal']
    else:raise ValueError('Unrecognized bank-principal timing')
    denominator=x['common_outstanding_million']+x['authorized_2026_award_shares_million']*p['authorized_2026_award_issuance_fraction']
    common_claims=sum((x[k] for k in CLAIMS),D(0))
    extra_claims=sum((p[k] for k in ['minority_claim_reserved','supplemental_senior_cash_claim','unissued_award_claim_reserved']),D(0))
    deposit_recovery=x['time_deposits_current']*p['time_deposit_recovery_fraction']
    initial=x['cash']-common_claims-extra_claims-p['required_operating_cash']-bank_upfront-x['novatek_redemption_reserved']
    bridge=x['cash']+deposit_recovery-x['financial_debt']-common_claims-extra_claims-p['required_operating_cash']
    all_results={}
    for name,s in x['scenarios'].items():
        revenues=[s['revenue_first']]
        for rate in s['growth']: revenues.append(revenues[-1]*(1+rate))
        rows=[]; balances=[initial]; discounted=[]
        for i,revenue in enumerate(revenues):
            ebit_before_lease=revenue*s['ebit_margin'][i]
            ebit=ebit_before_lease-p['lease_cash_by_year'][i]
            tax=max(D(0),ebit)*s['tax_rate']
            dwc=(revenue-(x['initial_revenue_anchor'] if i==0 else revenues[i-1]))*x['incremental_working_capital_ratio']
            operating_cash=ebit-tax+s['da_nonlease'][i]-s['cash_capex'][i]-dwc-p['supplemental_operating_cash_by_year'][i]
            release=deposit_recovery if i+1==p['time_deposit_funding_release_year'] else D(0)
            balances.append(balances[-1]+operating_cash+release-debt[i]-bank_payments[i]-p['financial_cash_interest_by_year'][i])
            present=operating_cash/(1+s['wacc'])**(i+1)
            discounted.append(present)
            rows.append({'year':i+1,'period_end':str(2027+i)+'-06-30','revenue':revenue,'pre_lease_ebit':ebit_before_lease,'ebit_after_cash_lease':ebit,'cash_tax':tax,'da_excluding_rou':s['da_nonlease'][i],'all_in_cash_capex':s['cash_capex'][i],'total_lease_cash':p['lease_cash_by_year'][i],'change_working_capital':dwc,'incremental_operating_cash_obligations':p['supplemental_operating_cash_by_year'][i],'fcff':operating_cash,'pv_fcff':present,'time_deposit_cash_conversion':release,'domestic_bond_principal':debt[i],'bank_principal_payment':bank_payments[i],'financial_debt_cash_interest_excluding_leases':p['financial_cash_interest_by_year'][i],'ending_available_liquidity':balances[-1]})
        growth=s['terminal_growth']
        terminal_ebit=revenues[-1]*(1+growth)*s['ebit_margin'][-1]-p['lease_cash_by_year'][-1]*(1+growth)
        nopat=terminal_ebit*(1-s['tax_rate'])
        roic_limited=nopat*(1-growth/x['terminal_incremental_roic'])
        runrate_limited=rows[-1]['fcff']*(1+growth)
        terminal_fcff=min(roic_limited,runrate_limited)
        terminal_value=terminal_fcff/(s['wacc']-growth)
        terminal_pv=terminal_value/(1+s['wacc'])**10
        enterprise=sum(discounted,D(0))+terminal_pv
        equity=enterprise+bridge
        ordinary=max(D(0),equity/denominator)
        ads=ordinary*x['ordinary_per_ads']/x['twd_per_usd_spot']
        funded=min(balances)>=0 and equity>0
        all_results[name]={'enterprise_value_twd_m':enterprise,'equity_bridge_twd_m':bridge,'equity_value_twd_m':equity,'ordinary_share_denominator_m':denominator,'issued_less_treasury_m':x['common_outstanding_million'],'authorized_award_new_shares_m':denominator-x['common_outstanding_million'],'unfunded_mathematical_twd_per_ordinary':ordinary,'unfunded_mathematical_usd_per_ads':ads,'conditional_twd_per_ordinary':ordinary if funded else None,'conditional_usd_per_ads':ads if funded else None,'status':'DATED_CONDITIONAL_ANNUAL_FUNDING_PASS' if funded else 'WITHHELD_UNFUNDED_OR_NONPOSITIVE_EQUITY','terminal':{'nopat':nopat,'roic_limited_fcff':roic_limited,'runrate_limited_fcff':runrate_limited,'fcff':terminal_fcff,'value':terminal_value,'pv':terminal_pv,'ev_fraction':terminal_pv/enterprise if enterprise else None,'reinvestment':nopat-terminal_fcff},'funding':{'initial_available_liquidity':initial,'minimum_available_liquidity':min(balances),'gap':max(D(0),-min(balances)),'known_claims_reserved':common_claims,'analyst_claims_reserved':extra_claims,'bank_principal_reserved':bank_upfront,'novatek_redemption_reserved':x['novatek_redemption_reserved'],'time_deposits_not_available_at_inception':deposit_recovery,'new_financing':D(0),'new_subsidies':D(0),'portfolio_sales':D(0)},'rows':rows}
    return all_results


def recursively_compare(review,prefix,expected,actual):
    if isinstance(expected,dict):
        for key,value in expected.items():
            review.test(prefix+'.'+key+'.exists',key in actual)
            if key in actual: recursively_compare(review,prefix+'.'+key,value,actual[key])
    elif isinstance(expected,list):
        review.equal(prefix+'.length',len(actual),len(expected))
        for i,(left,right) in enumerate(zip(expected,actual)): recursively_compare(review,prefix+'.'+str(i),left,right)
    else: review.equal(prefix,actual,expected)


class ExtractText(HTMLParser):
    def __init__(self): super().__init__(); self.parts=[]
    def handle_data(self,data): self.parts.append(data)


def source_checks(r,public_safe,source_ledger):
    # Root source ledger has public URLs, byte counts, and hashes. The private
    # claims archive is separately fingerprinted in its own optional manifest.
    if public_safe:
        for entry in source_ledger:
            r.skipped.append({'check':'raw_source_bytes','file':entry['file'],'expected_sha256':entry['sha256'],'reason':'--public-safe: raw archive not required'})
        r.skipped.append({'check':'capital_claims_raw_archive_manifest_and_bytes','file':'capital-claims/private-sources/combined-manifest.json','reason':'--public-safe: private archive not required'})
        r.skipped.append({'check':'raw_numeric_and_share_anchors','files':['sources/Q2-2026-financials.htm','sources/cbc-fx-page2-june2026.html','capital-claims/private-sources/2026-05-13_000119312526220535_umc-ex99.htm','capital-claims/private-sources/2026-06-29_000119312526286731_umc-ex99_1.htm','capital-claims/private-sources/2026-06-23_000119312526278424_umc-ex99.htm','capital-claims/private-sources/2026-02-25_000119312526068351_umc-ex99.htm'],'reason':'--public-safe: raw archive not required'})
        return
    for entry in source_ledger:
        path=ROOT/entry['file'];r.test('source_exists:'+entry['file'],path.is_file())
        if path.is_file():
            content=path.read_bytes();r.equal('source_hash:'+entry['file'],hashlib.sha256(content).hexdigest(),entry['sha256']);r.equal('source_bytes:'+entry['file'],len(content),entry['bytes'])
    manifest=ROOT/'capital-claims/private-sources/combined-manifest.json'
    r.test('private_claims_source_manifest_exists',manifest.is_file())
    if manifest.is_file():
        for entry in load('capital-claims/private-sources/combined-manifest.json'):
            if 'error' in entry:
                r.skipped.append({'check':'claims_raw_source_unavailable','file':entry['id'],'url':entry['url'],'reason':entry['error']})
                continue
            path=manifest.parent/entry['id'];r.test('claims_source_exists:'+entry['id'],path.is_file())
            if path.is_file():
                content=path.read_bytes();r.equal('claims_source_hash:'+entry['id'],hashlib.sha256(content).hexdigest(),entry['sha256']);r.equal('claims_source_bytes:'+entry['id'],len(content),entry['bytes'])
    anchors={
        'sources/Q2-2026-financials.htm':['124,706,465','22,135,867','40,674,252','32,704,164','5,216,199','4,446,566','1,767,326','4,922,969','30,551','129,770,564'],
        'sources/cbc-fx-page2-june2026.html':['2026/06/30','31.837'],
        'capital-claims/private-sources/2026-05-13_000119312526220535_umc-ex99.htm':['125,769,848,700','12,576,984,870'],
        'capital-claims/private-sources/2026-06-29_000119312526286731_umc-ex99_1.htm':['30,551,000'],
        'capital-claims/private-sources/2026-06-23_000119312526278424_umc-ex99.htm':['32,704,164,009'],
        'capital-claims/private-sources/2026-02-25_000119312526068351_umc-ex99.htm':['67,000,000','2026/02/25','NT$0'],
    }
    for name,values in anchors.items():
        path=ROOT/name;r.test('anchor_source_exists:'+name,path.is_file())
        if path.is_file():
            parser=ExtractText();parser.feed(path.read_text());text=' '.join(parser.parts)
            for value in values:r.test('raw_anchor:'+name+':'+value,value in text)
    fx=(ROOT/'sources/cbc-fx-page2-june2026.html').read_text()
    r.test('FX_date_and_rate_same_html_row',bool(re.search(r'<tr[^>]*>(?:(?!</tr>).)*2026/06/30(?:(?!</tr>).)*31\.837(?:(?!</tr>).)*</tr>',fx,re.S)))


def validate(public_safe=False):
    r=Review()
    x=load('dcf-inputs-v1.json');policies=load('analyst-policy-examples-v1.json');out=load('dcf-output-v1.json');d=load('capital-claims/funding-inputs-v1.json');facts=load('capital-claims/capital-claims-facts-v1.json');fx=load('fx-ads-v1.json');interim=load('interim-facts-v1.json');ledger=load('source-ledger-v1.json')
    fact={v['id']:v for v in facts['facts']}
    for label,obj in [('inputs',x),('policy_set',policies),('output',out)]:r.equal(label+'.selected_policy',obj['selected_policy'],None)
    for label,obj in [('inputs',x),('output',out)]:r.equal(label+'.current_target',obj['current_target'],None)
    r.equal('dated_balance',x['balance_date'],'2026-06-30');r.equal('funding_balance_date',d['balance_sheet_date'],x['balance_date']);r.equal('claims_balance_date',facts['historical_balance_date'],x['balance_date'])
    r.equal('research_cutoff',out['examples'][0]['research_cutoff'],x['research_cutoff'])
    r.equal('exact_issued_shares',x['issued_common_shares_exact'],fact['ordinary_shares_issued']['value'],D(0));r.equal('exact_treasury_shares',x['treasury_shares_exact'],fact['treasury_shares']['value'],D(0))
    shares=x['issued_common_shares_exact']-x['treasury_shares_exact']
    r.equal('exact_shares_subtraction',shares,D('12546433870'),D(0));r.equal('shares_to_millions',x['common_outstanding_million'],shares/1000000,D(0));r.equal('claims_exact_outstanding',shares,fact['ordinary_shares_outstanding']['value'],D(0))
    r.equal('authorized_award_source_quantity',x['authorized_2026_award_shares_million']*1000000,facts['new_rsa_2026']['maximum_new_ordinary_shares'],D(0))
    r.equal('authorized_award_fact_row',fact['new_rsa_maximum_new_ordinary_shares']['value'],facts['new_rsa_2026']['maximum_new_ordinary_shares'],D(0))
    r.equal('authorized_award_complete_terms_agreement',d['new_rsa_2026'],facts['new_rsa_2026'])
    r.equal('authorized_award_source_funding_agreement',d['new_RSA_maximum_shares'],facts['new_rsa_2026']['maximum_new_ordinary_shares'],D(0))
    r.equal('authorized_award_free_issue_source',facts['new_rsa_2026']['issue_price_TWD'],D(0))
    r.equal('authorized_award_source_url',d['new_RSA_source_url'],facts['new_rsa_2026']['source_url'])
    r.equal('ADS_ratio',x['ordinary_per_ads'],D(5));r.equal('ADS_ratio_facts',fx['ordinary_shares_per_ads'],fact['ads_ratio_ordinary_per_ads']['value']);r.equal('economic_ADS_equivalent',shares/5,fact['economic_ads_equivalent_denominator']['value'])
    r.equal('June_FX',x['twd_per_usd_spot'],D('31.837'),D(0));r.equal('FX_metadata',fx['twd_per_usd'],x['twd_per_usd_spot'],D(0));r.equal('FX_date',fx['conversion_date'],x['balance_date']);r.equal('FX_model_date',x['fx_date'],x['balance_date'])
    fxentry=[v for v in ledger if v['file']=='sources/cbc-fx-page2-june2026.html'];r.equal('FX_manifest_single_entry',len(fxentry),1)
    if fxentry:r.equal('FX_frozen_hash_metadata',fx['fx_source_sha256'],fxentry[0]['sha256']);r.equal('FX_source_URL',fx['fx_source_url'],fxentry[0]['url'])
    pairs={'cash':'cash_and_cash_equivalents','time_deposits_current':'time_deposits_original_maturity_over_3_months','financial_debt':'financial_debt_face_or_contractual_redemption_proxy','guarantee_deposits_reserved':'customer_guarantee_deposits_total','current_tax_reserved':'other_current_tax_liability','refund_liabilities_reserved':'refund_liabilities'}
    for model,source in pairs.items():r.equal('claims_units:'+model,x[model],d[source]/1000,D(0))
    r.equal('dividend_exact_units',x['dividend_payable_reserved'],d['dividend_exact_TWD']/1000000,D(0));r.equal('contract_liability_sum',x['contract_liabilities_reserved'],(d['contract_liabilities_current']+d['contract_liabilities_noncurrent'])/1000,D(0))
    c=d['financial_debt_components'];r.equal('bank_reserved',x['bank_debt_total'],(c['short_term_bank']+c['long_term_bank_including_current'])/1000,D(0));r.equal('Novatek_reserved',x['novatek_redemption_reserved'],c['novatek_exchangeable_redemption_TWD_equivalent']/1000,D(0));r.equal('debt_before_discount',d['financial_debt_face_or_contractual_redemption_proxy'],d['financial_debt_carrying']+c['bond_unamortized_discount_total'],D(0))
    r.equal('debt_components',x['financial_debt'],x['bank_debt_total']+x['novatek_redemption_reserved']+c['domestic_bonds_face']/1000,D(0));r.equal('Novatek_zero_UMC_dilution',d['novatek_exchangeable']['umc_ordinary_dilution'],D(0))
    n=d['novatek_exchangeable'];redemption=n['residual_face_usd_millions_inferred']*1000*n['fixed_ntd_per_usd']*n['redemption_percent_of_usd_face']/100
    r.equal('bank_current_principal_source',x['bank_current_principal'],(c['short_term_bank']+d['bank_current_portion_of_long_term'])/1000,D(0))
    r.equal('bank_noncurrent_principal_source',x['bank_noncurrent_principal'],(c['long_term_bank_including_current']-d['bank_current_portion_of_long_term'])/1000,D(0))
    r.equal('bank_current_plus_noncurrent',x['bank_current_principal']+x['bank_noncurrent_principal'],x['bank_debt_total'],D(0))
    r.equal('legacy_claim_components_sum',sum(x['legacy_claim_components'].values()),x['legacy_pension_provision_claims_reserved'],D(0))
    for key,value in x['legacy_claim_components'].items():r.equal('legacy_claim_fact:'+key,value,fact[key]['value']/1000,D(0))
    r.equal('Novatek_contractual_redemption_exact',redemption,n['computed_redemption_TWD_thousand'],D('0.000001'));r.equal('Novatek_rounded_redemption',redemption.quantize(D(1)),c['novatek_exchangeable_redemption_TWD_equivalent'],D(0))
    r.equal('annual_domestic_principal_total',sum(annual_schedule(d)),c['domestic_bonds_face']/1000,D(0));r.equal('annual_domestic_schedule',annual_schedule(d),[D(v) for v in [5000,2000,22300,5200,4600,0,0,0,0,0]])
    r.equal('cash_interim_reconciliation',x['cash'],interim['balance']['cash'],D(0));r.equal('revenue_anchor_is_annualized_H1',x['initial_revenue_anchor'],2*interim['income']['h1']['revenue'],D(0));r.equal('terminal_ROIC_is_12_percent',x['terminal_incremental_roic'],D('.12'),D(0))
    r.equal('policy_example_count',len(policies['policies']),len(out['examples']))
    for p,actual in zip(policies['policies'],out['examples']):
        pid=p['policy_id'];r.equal(pid+'.embedded_policy',actual['policy'],p);r.equal(pid+'.current_target',actual['current_target'],None);r.equal(pid+'.selected_policy',actual['selected_policy'],None);r.equal(pid+'.selection_required',actual['selection_required'],True)
        r.test(pid+'.authorized_award_fraction_valid',0<=p['authorized_2026_award_issuance_fraction']<=1)
        r.equal(pid+'.portfolio_excluded',p['nonoperating_equity_value_assigned'],D(0));r.equal(pid+'.no_circular_share_benefit',p['circular_crossholding_share_reduction'],D(0))
        r.test(pid+'.deposit_recovery_bounded',0<=p['time_deposit_recovery_fraction']<=1);r.test(pid+'.deposit_release_not_at_inception',1<=p['time_deposit_funding_release_year']<=10)
        for k in ['lease_cash_by_year','financial_cash_interest_by_year','supplemental_operating_cash_by_year']:
            r.test(pid+'.'+k+'.valid_length_and_sign',len(p[k])==10 and all(v.is_finite() and v>=0 for v in p[k]))
        calculated=independently_calculate(x,p,d)
        for scenario,expected in calculated.items():
            label=pid+'.'+scenario;s=x['scenarios'][scenario];r.test(label+'.terminal_spread_positive',s['wacc']>s['terminal_growth']>=0);r.test(label+'.terminal_ROIC_exceeds_growth',x['terminal_incremental_roic']>s['terminal_growth']);r.test(label+'.tax_rate_valid',0<=s['tax_rate']<1)
            recursively_compare(r,label,expected,actual['scenarios'][scenario]);r.equal(label+'.scenario_current_target',actual['scenarios'][scenario]['current_target'],None)
            r.test(label+'.terminal_reinvestment_nonnegative',expected['terminal']['reinvestment']>=0);r.test(label+'.terminal_FCFF_below_NOPAT',expected['terminal']['fcff']<=expected['terminal']['nopat'])
            r.equal(label+'.bridge_vs_initial_cash',expected['equity_bridge_twd_m'],expected['funding']['initial_available_liquidity']+expected['funding']['time_deposits_not_available_at_inception']-sum(annual_schedule(d))-sum(row['bank_principal_payment'] for row in expected['rows']),D('0.000000001'))
            r.equal(label+'.bank_principal_paid_once',expected['funding']['bank_principal_reserved']+sum(row['bank_principal_payment'] for row in expected['rows']),x['bank_debt_total'],D(0))
            r.equal(label+'.total_financial_principal_once',expected['funding']['bank_principal_reserved']+sum(row['bank_principal_payment']+row['domestic_bond_principal'] for row in expected['rows'])+expected['funding']['novatek_redemption_reserved'],x['financial_debt'],D(0))
            r.equal(label+'.authorized_award_dilution_only',expected['ordinary_share_denominator_m']-x['common_outstanding_million'],x['authorized_2026_award_shares_million']*p['authorized_2026_award_issuance_fraction'],D(0))
            r.equal(label+'.one_time_deposit_release',sum(v['time_deposit_cash_conversion'] for v in expected['rows']),expected['funding']['time_deposits_not_available_at_inception'],D(0))
            r.results.append({'policy':pid,'scenario':scenario,'conditional_usd_per_ads':expected['conditional_usd_per_ads'],'mathematical_usd_per_ads':expected['unfunded_mathematical_usd_per_ads'],'enterprise_value_twd_m':expected['enterprise_value_twd_m'],'equity_value_twd_m':expected['equity_value_twd_m'],'initial_available_liquidity_twd_m':expected['funding']['initial_available_liquidity'],'minimum_available_liquidity_twd_m':expected['funding']['minimum_available_liquidity'],'terminal_EV_fraction':expected['terminal']['ev_fraction'],'status':expected['status']})
    by_policy={v['policy']['policy_id']:v for v in out['examples']}
    for name in x['scenarios']:
        full=by_policy['explicit_operating_assets_exclusion']['scenarios'][name]
        staged=by_policy['explicit_staged_bank_principal']['scenarios'][name]
        stress=by_policy['explicit_liquidity_and_claim_stress']['scenarios'][name]
        r.equal('timing_does_not_change_EV:'+name,full['enterprise_value_twd_m'],staged['enterprise_value_twd_m'])
        r.equal('timing_does_not_change_equity:'+name,full['equity_value_twd_m'],staged['equity_value_twd_m'])
        r.equal('all_upfront_gate_withheld:'+name,full['conditional_usd_per_ads'],None)
        r.equal('stress_gate_withheld:'+name,stress['conditional_usd_per_ads'],None)
        r.test('staged_gate_positive:'+name,staged['conditional_usd_per_ads'] is not None and staged['conditional_usd_per_ads']>0)
        r.test('recurring_stress_lease_reduces_terminal:'+name,stress['terminal']['value']<full['terminal']['value'])
    source_checks(r,public_safe,ledger)
    # Supplementary history identity checks, not a second full extraction audit.
    if (ROOT/'history-latest-comparative-v1.json').is_file():
        history=load('history-latest-comparative-v1.json');r.equal('history_years',[int(v['year']) for v in history],list(range(2016,2026)))
        for h in history:
            y=str(int(h['year']));r.equal('history_balance:'+y,h['assets'],h['liabilities']+h['equity_total'],D('.002'));r.equal('history_DA:'+y,h['da'],h['depreciation']+h['amortization'],D('.002'));r.equal('history_cash_roll:'+y,h['cash_ending'],h['cash_beginning']+h['net_change_cash'],D('.002'))
    r.warn('DATED_SCOPE','June 30, 2026 ex-declared-distribution operating-assets exclusion study. It is not current capitalization, total-company fair value, a certified lower bound, or a current price target. Later financings and cancellations need a complete roll-forward before a current valuation.')
    r.warn('ANNUAL_FUNDING_ONLY','All-bank-upfront exclusion starts TWD 489.988009m short after legacy claim reserves; stress starts TWD 17,389.988009m short. Both correctly withhold all conditional per-share values. Staged bank timing starts TWD 10,999.935991m available, but annual buckets do not prove daily or jurisdiction-specific liquidity or cash availability before deposit maturity. Staging is a separately labeled conservative allocation of noncurrent principal to year 2, not an exact contractual annual schedule.')
    r.warn('EXCLUSION_AND_TAX','All nonoperating equity investments and circular-ownership benefit are deliberately excluded, not fair-valued at zero. No DTA cash value or blanket DTL deduction is taken. Cash taxes and no-disposal assumptions must remain explicit.')
    r.warn('ASSUMPTIONS_NOT_FACTS','Revenue, margins, capex, D&A, NWC, cash tax rates, WACC, terminal ROIC, NCI/award/extra-claim reserves and lease/interest paths are analyst assumptions. NCI book TWD 4.051m does not certify reserve sufficiency. Forecast capacity, commitments and cash cost coverage are not source-certified.')
    r.warn('SHARES_AND_SBC','Issued restricted shares are already counted; the policies additionally assume the full 67m authorized new shares are issued for no cash. Recurring future SBC is retained in margins without an addback. Keeping expense and dilution is conservative and may overlap award cost; it is not an award-level fair-value allocation. Actual grant and issuance timing is not certified by the scenario.')
    r.warn('RESERVE_ACCOUNTING','Known claims are deducted once from equity and restricted liquidity; their eventual settlements must consume the reserve rather than appear again in forecast cash outflows. Equipment payables and construction/IP commitments are assumed inside cash capex. Cash tax expense excludes reserved prior-period tax runoff.')
    r.warn('TERMINAL_NORMALIZATION','Forecast and terminal EBIT now deduct rental-equivalent lease cash before cash tax; forecast D&A excludes ROU. Terminal lease cash grows with terminal revenue. ROIC reinvestment applies to nonleased capital. Pre-lease margins and nonlease D&A remain analyst forecasts rather than reported IFRS margins and total D&A.')
    r.warn('OTHER_OPERATING_CLAIMS','Pension, decommissioning, onerous-contract and carbon legacy balances sum to TWD 1,907.541m and are now reserved once from both equity and cash. Future runoff must use that reserve; forecast operating cash/capex must cover only incremental costs for these claims. Book carrying balances are not independently established settlement values.')
    r.warn('INTEREST_FUNDING','Financial cash interest is a conservative policy funding outflow for years 1–5 and stops after modeled debt retirement. It is not a coupon-by-coupon debt schedule and is not subtracted again from unlevered FCFF.')
    tracked=['independent_validate_v1.py','RESEARCH-v1.md','VALUATION-METHOD-v1.md','dcf-inputs-v1.json','analyst-policy-examples-v1.json','dcf-output-v1.json','replay_v1.py','capital-claims/funding-inputs-v1.json','capital-claims/capital-claims-facts-v1.json','fx-ads-v1.json','interim-facts-v1.json','source-ledger-v1.json']
    failures=[v for v in r.checks if not v['pass']]
    return {'reviewed_at_utc':datetime.now(timezone.utc).isoformat(),'review_type':'Independent standard-library Decimal arithmetic and semantic review','scope':'Dated operating-assets conditional scenarios only; no current total-company valuation approval','public_safe':public_safe,'status':'PASS_WITH_ASSUMPTION_WARNINGS' if not failures else 'FAIL','precision_digits':getcontext().prec,'default_absolute_tolerance_twd_m':'0.0000001','model_engine_imported':False,'check_count':len(r.checks),'failed_count':len(failures),'failed_checks':failures,'checks':r.checks,'skipped_checks':r.skipped,'warnings':r.warnings,'scenario_results':r.results,'reviewed_artifact_sha256':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in tracked if (ROOT/name).is_file()},'source_scope_note':'Full mode verifies frozen bytes against manifests and selected numeric text anchors, not independent external re-downloads. Public-safe mode explicitly skips those raw-source checks; it does not upgrade their status to passed.'}


def render(report):
    lines=['# UMC independent review v1','',report['status']+' as of '+report['reviewed_at_utc'],'','## Scope','',report['scope']+'. Separate 50-digit Decimal implementation; no import or execution of replay_v1.py. Numeric values in this report are strings to preserve precision.','',f"Checks: {report['check_count']}; failures: {report['failed_count']}; raw checks skipped: {len(report['skipped_checks'])}.",'','## Findings','']
    for v in report['warnings']:lines += ['- '+v['code']+': '+v['text']]
    lines += ['','## Results','']
    for v in report['scenario_results']:
        value='withheld' if v['conditional_usd_per_ads'] is None else '$'+format(D(v['conditional_usd_per_ads']),'.6f')+' per ADS'
        lines += ['- '+v['policy']+' / '+v['scenario']+': '+value+'; initial available liquidity TWD '+format(D(v['initial_available_liquidity_twd_m']),',.6f')+'m; terminal PV '+format(D(v['terminal_EV_fraction'])*100,'.2f')+'% of EV.']
    lines += ['','## Reproduce','', 'Full archived-source validation: python independent_validate_v1.py', '', 'Public replay without raw archives: python independent_validate_v1.py --public-safe', '', 'Refresh this review and the machine-readable review: add --write-report.', '', report['source_scope_note'], '', 'These checks do not validate market forecasts, estimate probabilities, prove intrayear solvency, or select a policy. Read the JSON review for all tests, exact output values, skipped checks, and artifact hashes.']
    if report['failed_checks']:lines += ['','## Failed checks','',json.dumps(report['failed_checks'],indent=2)]
    return '\n'.join(lines)+'\n'


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--public-safe',action='store_true');parser.add_argument('--write-report',action='store_true');args=parser.parse_args()
    try:report=plain(validate(args.public_safe))
    except Exception as exc:
        print(json.dumps({'status':'ERROR','error':str(exc),'type':type(exc).__name__}));return 2
    if args.write_report:
        (ROOT/'independent-review-v1.json').write_text(json.dumps(report,indent=2)+'\n')
        (ROOT/'independent-review-v1.md').write_text(render(report))
    print(json.dumps({k:report[k] for k in ['status','public_safe','check_count','failed_count','failed_checks','scenario_results']},indent=2))
    return 0 if report['failed_count']==0 else 1

if __name__=='__main__':sys.exit(main())
