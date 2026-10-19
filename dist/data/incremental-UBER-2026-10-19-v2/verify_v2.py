import copy,hashlib,json,math,pathlib
from replay_dcf_v2 import run,compute_case,validate,allocate
from rollforward_v2 import bridge,NONNEG,SIGNED,BASES,CURRENT_CLAIMS,PRINCIPAL_EURM,GROSS_PROCEEDS_EURM,UNDERWRITING_DISCOUNTS_EURM,ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM
P=pathlib.Path(__file__).resolve().parent
checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append({'check':name,'passed':True})
def eq(a,b):return math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-8)
def reject(name,f):
 try:f()
 except (ValueError,KeyError,TypeError):checks.append({'check':name,'passed':True});return
 raise AssertionError(name+' failed to reject')
I=json.loads((P/'dcf-inputs-v2.json').read_text());policy=json.loads((P/'equity-policy-template-v2.json').read_text());example=json.loads((P/'equity-policy-illustration-v2.json').read_text());out=run(I,policy);illustrated=run(I,example)
for file,obj in [('dcf-output-v2.json',out),('illustration-output-v2.json',illustrated)]:check(file+' exact replay',json.loads((P/file).read_text())==obj)
H=json.loads((P/'history-v2.json').read_text());HP=json.loads((P/'history-field-provenance-v2.json').read_text());F=json.loads((P/'latest-financials-v2.json').read_text());M=json.loads((P/'operating-mix-history-v2.json').read_text());PQ=json.loads((P/'profit-quality-v2.json').read_text())
check('ten annual slots',len(H)==10 and [x['fiscal_year'] for x in H]==list(range(2016,2026)))
check('partial2016 not zero-filled',H[0]['cfo'] is None and H[0]['cash_ppe_capex'] is None and H[0]['revenue']==3338)
check('2017 recast revenue repaired',H[1]['revenue']==7402)
check('2018/2019 recast maintained',H[2]['revenue']==10433 and H[3]['revenue']==13000)
check('nine full annual CFO values',sum(x['cfo'] is not None for x in H)==9)
for i,x in enumerate(HP):
 check('history provenance '+str(i),x['value'] is None or (x.get('source_url','').startswith('https://www.sec.gov/') and x.get('filed','2026-02-13')<='2026-10-19'))
check('latest BS identity',37402+180+28219==65801)
check('unrestricted pool identity',4870+521==5391)
check('restricted pool identity',661+1646+9486==11793)
check('reserves identity',3758+9528==13286)
check('TTM revenue6700 EBIT anchor',F['ttm']['revenue']==55227 and F['ttm']['gaap_operating_income']==6700)
check('TTM FCF company definition',F['ttm']['fcf_company_definition']==10116)
check('DA scopes separated',F['annual_2025']['operating_da']==719 and F['annual_2025']['cashflow_da']==747)
check('EBITDA annual reconciliation',8730-719-1826-564-2-43-2-9==5565)
check('H1 segment income reconciliation',4244+2016-54-2180-213==3813)
check('TTM segment sums',sum(x['bookings'] for x in M['ttm_2026_06_30'].values())==215622 and sum(x['revenue'] for x in M['ttm_2026_06_30'].values())==55227)
for name,r in out['cases'].items():
 c=I['cases'][name];check(name+' ten full years',len(r['annual_forecast'])==10 and r['annual_forecast'][0]['period_start']=='2026-07-01' and r['annual_forecast'][-1]['period_end']=='2036-06-30')
 for i,x in enumerate(r['annual_forecast']):
  check(f'{name}{i} FCFF',eq(x['fcff'],x['gaap_ebit_after_sbc']-x['cash_operating_tax']+x['operating_da_addback']-x['gross_operating_asset_reinvestment']-x['delta_noninsurance_nwc']+x['delta_insurance_reserve']-x['delta_restricted_pool']))
  check(f'{name}{i} discount',eq(x['pv_fcff'],x['fcff']/(1+c['wacc'])**(i+1)))
  check(f'{name}{i} sumsegments',eq(x['revenue'],sum(x[s+'_revenue'] for s in ('mobility','delivery','freight'))))
 t=r['terminal'];check(name+' terminal reinvestment floor',t['net_reinvestment']>=t['nopat']*c['terminal_growth']/c['terminal_roic']-1e-8);check(name+' terminal FCFF',eq(t['fcff'],t['nopat']-t['net_reinvestment']));check(name+' EV identity',eq(r['operating_enterprise_value'],sum(x['pv_fcff'] for x in r['annual_forecast'])+t['pv_terminal_value']));check(name+' terminal dependence export',eq(r['terminal_pv_fraction_of_ev'],t['pv_terminal_value']/r['operating_enterprise_value']));check(name+' no default allocation',r['allocation']['conditional_june_allocation_per_share'] is None)
 a=illustrated['cases'][name]['allocation'];check(name+' illustrated bridge',eq(a['conditional_common_equity_value'],r['operating_enterprise_value']+5391-example['cash_operating_reserve']+example['investment_asset_value']-a['total_claim_deductions']));check(name+' illustrated shares',eq(a['conditional_june_allocation_per_share'],a['conditional_common_equity_value']*1e6/a['assumed_share_denominator']));check(name+' current target suppressed',a['current_target_price'] is None)
check('base opening insurance catchup1493',eq(out['cases']['base']['annual_forecast'][0]['delta_restricted_pool']-out['cases']['base']['annual_forecast'][0]['delta_insurance_reserve'],1493))
for field,bad in [('wacc',.025),('wacc',True),('wacc',float('nan')),('terminal_growth',float('inf')),('cash_tax_rate',0),('terminal_roic',.01),('collateral_to_insurance_reserve',0),('incremental_noninsurance_nwc_revenue_ratio',None)]:
 x=copy.deepcopy(I);x['cases']['base'][field]=bad;reject('bad '+field+str(bad),lambda x=x:validate(x))
for bad in [[],[.1]*9,[.1]*11,[None]*10,[True]*10,[float('nan')]*10,[-1]*10]:
 x=copy.deepcopy(I);x['cases']['base']['mobility_growth']=bad;reject('bad annual vector '+str(bad[:1])+str(len(bad)),lambda x=x:validate(x))
x=copy.deepcopy(I);x['valuation_anchor']='2026-10-19';reject('date mismatch',lambda:validate(x))
for field,bad in [('debt_total_value',float('nan')),('cash_operating_reserve',6000),('common_shares',0),('existing_earned_award_incremental_shares',-1),('assumption_basis','')]:
 x=copy.deepcopy(example);x[field]=bad;reject('policy invalid '+field,lambda x=x:allocate(out['cases']['base'],x))
x=copy.deepcopy(example);x['use_reported_june_shares_rounded_to_thousand']=False;reject('share precision acknowledgement',lambda:allocate(out['cases']['base'],x))
x=copy.deepcopy(example);x['finance_lease_claim']=None;check('missing lease suppresses allocation',allocate(out['cases']['base'],x)['conditional_june_allocation_per_share'] is None)
rp=json.loads((P/'post-june-rollforward-template-v2.json').read_text());check('missing current facts suppress currentallocation',bridge(illustrated['cases']['base'],rp)['conditional_october_allocation_per_share'] is None)
# Synthetic arithmetic fixture only: zero choices below are TEST VALUES, never
# estimates or a recommended October scenario. All fields remain null in template.
syn={**rp,**{k:0.0 for k in NONNEG+SIGNED},**{k:'Synthetic arithmetic diagnostic; no economic forecast or reported current fact.' for k in BASES},'acknowledge_conditional_not_verified':True,'acknowledge_no_deal_cash_or_claim_overlap':True,'eur_usd_at_issue':1.1,'eur_usd_at_current_mark':1.1,'euro_note_current_price_fraction':1,'getir_operating_ev_added':400,'getir_grocery_minority_investment_value':65,'careem_operating_ev_added':example['included_careem_investment_value'],'assumed_current_common_shares':example['common_shares'],'assumed_current_existing_award_incremental_shares':example['existing_earned_award_incremental_shares'],'current_operating_cash_reserve':example['cash_operating_reserve'],'current_inherited_nondebt_claims':{k:example[k] for k in CURRENT_CLAIMS}}
base=illustrated['cases']['base'];b=bridge(base,syn)
known_discount=PRINCIPAL_EURM-ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM
check('known public issue discount10.6925',eq(PRINCIPAL_EURM-GROSS_PROCEEDS_EURM,10.6925))
check('known underwriting24.875',eq(UNDERWRITING_DISCOUNTS_EURM,24.875))
check('issuer proceeds before other expenses4464.4325',eq(ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM,4464.4325))
check('new notes cash/debt differ by both known discounts once',eq(b['new_euro_notes_debt_value_usdm']-b['new_euro_notes_cash_proceeds_usdm_at_issue'],known_discount*1.1))
check('Getir food and minority asset plus Careem paired once',eq(b['conditional_common_equity_value']-base['allocation']['conditional_common_equity_value'],base['operating_enterprise_value']*((1+base['wacc'])**b['duration_years']-1)-known_discount*1.1))
check('Careem removed at selected117.6 not book147',eq(b['named_closed_deals']['careem']['prior_investment_removed'],117.6))
check('Getir separate minority value retained',b['named_closed_deals']['getir']['minority_investment_added']==65)
syn2=copy.deepcopy(syn);syn2['euro_note_other_offering_expenses_eurm']=30;b2=bridge(base,syn2);check('other expenses reduce equity once',eq(b['conditional_common_equity_value']-b2['conditional_common_equity_value'],33))
syn2=copy.deepcopy(syn);syn2['euro_note_other_offering_expenses_eurm']=11.4325;b2=bridge(base,syn2);check('issuer estimated net proceeds4453 reproducible',eq(b2['new_euro_notes_net_proceeds_eurm_assumed'],4453))
syn2=copy.deepcopy(syn);syn2['euro_note_proceeds_retained_eurm']=ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM;syn2['eur_usd_at_current_mark']=1.2;b2=bridge(base,syn2)
check('retained EUR cash FX revalues full retained amount',eq(b2['new_euro_notes_retained_cash_fx_adjustment_usdm'],ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM*.1))
check('retained EUR debt and cash FX offset except known discounts',eq(b2['conditional_common_equity_value']-b['conditional_common_equity_value'],-known_discount*.1))
syn2=copy.deepcopy(syn);syn2['other_nonoperating_cash_flow']=100;b2=bridge(base,syn2);check('nonoperating receipt never reduces EV',eq(b2['rolled_operating_ev'],b['rolled_operating_ev']) and eq(b2['conditional_common_equity_value']-b['conditional_common_equity_value'],100))
syn2=copy.deepcopy(syn);syn2['sbc_cash_equivalent_reversal']=100;b2=bridge(base,syn2);check('economic to actual cash reconciliation explicit',eq(b2['actual_operating_cash_after_reinvestment_before_interest']-b['actual_operating_cash_after_reinvestment_before_interest'],100) and eq(b2['rolled_operating_ev'],b['rolled_operating_ev']))
syn2=copy.deepcopy(syn);syn2['interim_economic_fcff']=100;b2=bridge(base,syn2);check('economic FCFF rolls EV and actual cash separately',eq(b2['rolled_operating_ev']-b['rolled_operating_ev'],-100*(1+base['wacc'])**(b['duration_years']/2)) and eq(b2['ending_unrestricted_liquidity_assumed']-b['ending_unrestricted_liquidity_assumed'],100))
syn2=copy.deepcopy(syn);syn2['other_nonoperating_cash_flow']=100;syn2['investment_value_change_ex_careem_getir']=-100;b2=bridge(base,syn2);check('investment sale pairs cash and asset removal',eq(b2['conditional_common_equity_value'],b['conditional_common_equity_value']))
syn2=copy.deepcopy(syn);syn2['careem_cash_paid']=100;syn2['careem_operating_ev_added']+=100;b2=bridge(base,syn2);check('Careem incremental cash and EV pair once',eq(b2['conditional_common_equity_value'],b['conditional_common_equity_value']))
syn2=copy.deepcopy(syn);syn2['blacklane_cash_paid']=100;syn2['blacklane_operating_ev_added']=100;b2=bridge(base,syn2);check('Blacklane cash and EV pair once',eq(b2['conditional_common_equity_value'],b['conditional_common_equity_value']))
syn2=copy.deepcopy(syn);syn2['legacy_claim_cash_settled']=100;syn2['current_inherited_nondebt_claims']['legacy_legal_regulatory_tax_claim']-=100;b2=bridge(base,syn2);check('cash payment and current legacy claim release pair once',eq(b2['conditional_common_equity_value'],b['conditional_common_equity_value']))
syn2=copy.deepcopy(syn);syn2['buyback_cash']=1e6;b2=bridge(base,syn2);check('negative cash suppresses allocation',b2['conditional_october_allocation_per_share'] is None)
for field in NONNEG:
 x=copy.deepcopy(syn);x[field]=-1;reject('October negative '+field,lambda x=x:bridge(base,x))
for field in SIGNED:
 x=copy.deepcopy(syn);x[field]=float('nan');reject('October nonfinite '+field,lambda x=x:bridge(base,x))
for field in BASES:
 x=copy.deepcopy(syn);x[field]='';reject('October blank rationale '+field,lambda x=x:bridge(base,x))
for field in NONNEG+SIGNED:
 x=copy.deepcopy(syn);x[field]=None;check('October missing '+field,bridge(base,x)['conditional_october_allocation_per_share'] is None)
for field,bad in [('assumed_current_common_shares',0),('assumed_current_common_shares',2042560121.5),('euro_note_proceeds_retained_eurm',4500),('euro_note_current_price_fraction',0),('euro_note_other_offering_expenses_eurm',4464.4325)]:
 x=copy.deepcopy(syn);x[field]=bad;reject('October special invalid '+field,lambda x=x:bridge(base,x))
for bad in [-1,float('nan'),100]:
 x=copy.deepcopy(syn);x['current_inherited_nondebt_claims']['unrecognized_claim']=bad;reject('October extra inherited claim '+str(bad),lambda x=x:bridge(base,x))
x=copy.deepcopy(syn);x['existing_debt_value_retired']=example['debt_total_value']+1;reject('new debt cannot mask negative legacy debt',lambda:bridge(base,x))
x=copy.deepcopy(syn);x['investment_value_change_ex_careem_getir']=-example['investment_asset_value']+example['included_careem_investment_value']-1;reject('Getir asset cannot mask negative legacy investment',lambda:bridge(base,x))
x=copy.deepcopy(I);x['anchors']['unrestricted_cash_and_short_investments']=6391;reject('frozen June cash cannot silently change',lambda:validate(x))
events=json.loads((P/'post-june-capital-events-v2.json').read_text());notes=next(e for e in events['events'] if e['event_date']=='2026-09-15')
check('event tranches principal4500',eq(sum(t['principal_eurm'] for t in notes['tranche_pricing']),PRINCIPAL_EURM))
check('event tranches public proceeds sum',eq(sum(t['gross_public_proceeds_eurm'] for t in notes['tranche_pricing']),GROSS_PROCEEDS_EURM))
check('event tranches underwriting sum',eq(sum(t['underwriting_discount_eurm'] for t in notes['tranche_pricing']),UNDERWRITING_DISCOUNTS_EURM))
check('event tranches issuer proceeds sum',eq(sum(t['issuer_proceeds_before_other_expenses_eurm'] for t in notes['tranche_pricing']),ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM))
check('coupons annual200',eq(sum(x[0]*x[1] for x in notes['tranches_eurm_coupon_maturity']),200))
check('default October output replay',json.loads((P/'rollforward-output-v2.json').read_text())['cases']=={k:bridge(v,rp) for k,v in illustrated['cases'].items()})
sens=[]
for w in [.075,.085,.095,.105,.115]:
 for g in [.015,.02,.025,.03,.035]:
  c=copy.deepcopy(I['cases']['base']);c['wacc']=w;c['terminal_growth']=g;r=compute_case(I,c);sens.append({'wacc':w,'terminal_growth':g,'operating_ev_usdm':r['operating_enterprise_value'],'terminal_pv_fraction':r['terminal_pv_fraction_of_ev']})
(P/'sensitivity-v2.json').write_text(json.dumps({'scope':'Base operating assumptions; WACC/g varied; terminal reinvestment recalculated every time; no current share target','grid':sens},indent=2)+'\n')
check('WACC monotonic same g',all(sens[i]['operating_ev_usdm']>sens[i+5]['operating_ev_usdm'] for i in range(20)))
result={'status':'author_validation_passed','independent_review':'pending','checks_passed':len(checks),'checks_failed':0,'checks':checks,'not_certified':['Economic assumptions','Current October fair value','Completeness/fair value of all claims','Daily or future cash funding','All historical data manually tied to every filing']};(P/'verification-v2.json').write_text(json.dumps(result,indent=2)+'\n');print(len(checks),'checks passed')
