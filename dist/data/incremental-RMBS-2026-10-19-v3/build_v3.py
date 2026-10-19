import pathlib,json,shutil
P=pathlib.Path(__file__).parent;R=P.parent
old=json.loads((R/'dcf-inputs-v1.json').read_text());old.update(version=3,valuation_type='June 30 2026 conditional intrinsic DCF; not current target or point-in-time backtest',selection_required=True,selected_award_policy=None)
old['method']='Enterprise DCF retains new-grant cash-equivalent compensation; explicit selected legacy expense is removed after tax and corresponding legacy claims allocated separately. No D&A addback, no second SBC subtraction. Operating leases stay in margins; EDA claim reserved once.'
old['legacy_expense_policy']='The original margins had no separately specified SBC rate. V3 requires an explicit analyst decomposition into baseline total SBC allowance and legacy amortization runout. Remove selected legacy amortization after normalized tax, allocate legacy award claims separately, and retain residual new-grant cost as cash compensation. No second SBC subtraction.'
old['conditional_assumption_fields']=['acknowledge_conditional_not_current','baseline_total_sbc_pct_revenue','legacy_expense_runout_m','residual_legacy_share_equivalents_m','reported_unit_vesting_fraction','vesting_weights','withholding_fraction','residual_claim_cash_fraction','reported_units_already_in_common_m','marketable_securities_liquidity_haircut','assume_no_separate_legacy_tax_benefit','settlement_price_convention']
old['eda_nominal_cash_reserve']=31.435
old['cash_and_securities']=824.948;old['cash_only']=87.720;old['marketable_securities']=737.228
old['source_facts']={'reported_nonvested_units':2.476181,'unrecognized_legacy_sbc':138.3,'weighted_average_recognition_years':2.4,'performance_max_pct_target':200,'approx_extra_second_quarter_performance_reserve_m':.1,'pre_anchor_h1_withholding_cash_paid':52.681,'pre_anchor_h1_employee_proceeds':5.234,'common_share_increase_exact_m':.679740,'stock_statement_net_employee_issuance_rounded_m':.713,'stock_statement_repurchases_rounded_m':.033}
old['residual_claim_status']='No exact granular June PSU/option/ESPP valuation established. Residual share-equivalent amount is an opt-in analyst assumption; zero means assume none beyond counted units, not verified absence.'
(P/'dcf-inputs-v3.json').write_text(json.dumps(old,indent=2))
# Deliberately no active selection. Examples are opt-in conditional assumption bundles, not facts.
common={'acknowledge_conditional_not_current':True,'baseline_total_sbc_pct_revenue':.08,'legacy_expense_runout_m':[57.625,57.625,23.05]+[0]*7,'reported_unit_vesting_fraction':1,'vesting_weights':[1/3]*3+[0]*7,'withholding_fraction':.5,'residual_claim_cash_fraction':0,'reported_units_already_in_common_m':0,'marketable_securities_liquidity_haircut':0,'assume_no_separate_legacy_tax_benefit':True,'settlement_price_convention':'intrinsic_price_grows_at_scenario_wacc_no_dividend'}
examples=[]
for name,extra in [('reported_units_no_residual',0),('illustrative_point_one_residual',.1),('large_residual_stress',2.476181)]:examples.append({'policy_id':name,'status':'EXAMPLE_REQUIRES_EXPLICIT_OPT_IN_NOT_DEFAULT','selection':{**common,'residual_legacy_share_equivalents_m':extra}})
(P/'analyst-policy-examples-v3.json').write_text(json.dumps(examples,indent=2))
for name in ['history-v2.json','history-v2.csv','history-field-provenance-v2.json','source-ledger-v1.json','source-ledger-amendments-v1.json','source-ledger-guidance-v1.json','latest-quarter-v1.json','latest-field-provenance-v1.json','eligibility-v1.json']:shutil.copyfile(R/name,P/name)
shutil.copyfile(R/'replay_dcf.py',P/'business_replay.py')
