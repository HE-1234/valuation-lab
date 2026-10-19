"""Conditional June business and legacy-award claim allocation. No selected default."""
import pathlib,json,math,copy
from business_replay import run as business
P=pathlib.Path(__file__).parent

def validate(x,p):
 if p is None:return False
 for k in x['conditional_assumption_fields']:
  if k not in p:raise ValueError('Explicit assumption required: '+k)
 if p['acknowledge_conditional_not_current'] is not True or p['assume_no_separate_legacy_tax_benefit'] is not True:raise ValueError('Model scope must be explicitly accepted')
 if p['settlement_price_convention']!='intrinsic_price_grows_at_scenario_wacc_no_dividend':raise ValueError('Unsupported settlement price convention')
 for k in ['baseline_total_sbc_pct_revenue','reported_unit_vesting_fraction','withholding_fraction','residual_claim_cash_fraction','marketable_securities_liquidity_haircut']:
  if not math.isfinite(p[k]) or not 0<=p[k]<=1:raise ValueError('Invalid rate '+k)
 if not math.isfinite(p['reported_units_already_in_common_m']) or not 0<=p['reported_units_already_in_common_m']<=x['legacy_nonvested_awards']:raise ValueError('Invalid overlap with already-outstanding common shares')
 if not math.isfinite(p['residual_legacy_share_equivalents_m']) or p['residual_legacy_share_equivalents_m']<0:raise ValueError('Invalid residual award claim')
 for k in ['legacy_expense_runout_m','vesting_weights']:
  if len(p[k])!=10 or any(not math.isfinite(v) or v<0 for v in p[k]):raise ValueError('Require ten nonnegative finite values for '+k)
 if abs(sum(p['vesting_weights'])-1)>1e-9:raise ValueError('Vesting weights must sum to one')
 if sum(p['legacy_expense_runout_m'])>x['source_facts']['unrecognized_legacy_sbc']+1e-9:raise ValueError('Runout exceeds disclosed unrecognized expense')
 return True

def calculate(x,s,p):
 if s.get('years')!=10:raise ValueError('V3 requires a ten-year business and settlement horizon')
 for field in ['wacc','terminal_growth','tax_rate','incremental_roic','margin_start','margin_end','net_reinvestment_floor_pct_revenue','growth_working_capital_pct']:
  if not math.isfinite(s[field]):raise ValueError('Nonfinite scenario parameter '+field)
 for field in ['initial_common_shares','legacy_nonvested_awards','cash_only','marketable_securities','operating_cash_reserve','eda_debt_like_claim','eda_nominal_cash_reserve','other_claim_reserve']:
  if not math.isfinite(x[field]) or x[field]<0:raise ValueError('Invalid capital parameter '+field)
 if abs(x['cash_only']+x['marketable_securities']-x['cash_and_securities'])>1e-8:raise ValueError('Cash/securities bridge does not reconcile')
 if x['initial_common_shares']<=0:raise ValueError('Common shares must be positive')
 if not validate(x,p):return {'status':'AWARD_POLICY_SELECTION_REQUIRED','conditional_share_value':None,'current_price_target':None}
 r=business(x,s);w=s['wacc'];tax=s['tax_rate'];rows=copy.deepcopy(r['rows']);pvadd=0
 for i,row in enumerate(rows):
  legacy=p['legacy_expense_runout_m'][i];allowance=row['revenue']*p['baseline_total_sbc_pct_revenue'];residual=allowance-legacy
  if residual < -1e-8:raise ValueError('Legacy runout exceeds selected baseline compensation allowance')
  add=legacy*(1-tax);row.update(baseline_total_sbc_allowance=allowance,legacy_expense_removed=legacy,remaining_new_grant_cash_equivalent_cost=residual,legacy_after_tax_addback=add,fcff_after_legacy_adjustment=row['fcff']+add);pvadd+=add/(1+w)**(i+1)
 haircut=x['marketable_securities']*p['marketable_securities_liquidity_haircut'];ev=r['enterprise_value']+pvadd;pool=ev+r['net_cash_bridge']-haircut
 known=(x['legacy_nonvested_awards']-p['reported_units_already_in_common_m'])*p['reported_unit_vesting_fraction'];residual=p['residual_legacy_share_equivalents_m'];A=known+residual;N=x['initial_common_shares'];price=max(0,pool)/(N+A);h=p['withholding_fraction'];rh=p['residual_claim_cash_fraction'];netunits=known*(1-h)+residual*(1-rh);pvtax=0
 cash=x['cash_only']+x['marketable_securities']-haircut-x['operating_cash_reserve']-x['eda_nominal_cash_reserve']-x['other_claim_reserve'];minimum=cash
 for i,row in enumerate(rows):
  weight=p['vesting_weights'][i];gross=A*weight;settlementprice=price*(1+w)**(i+1);knowncash=known*weight*h*settlementprice;residualcash=residual*weight*rh*settlementprice;withcash=knowncash+residualcash;pvtax+=withcash/(1+w)**(i+1)
  # Conservative intra-year timing: legacy withholding paid before that year's FCFF.
  start=cash;pre_receipts=cash-withcash;minimum=min(minimum,pre_receipts);cash=pre_receipts+row['fcff_after_legacy_adjustment'];minimum=min(minimum,cash)
  row.update(legacy_gross_units_settled=gross,legacy_net_share_equivalent_allocation=netunits*weight,reported_award_withholding_cash=knowncash,residual_claim_cash_settlement=residualcash,conditional_settlement_price=settlementprice,legacy_withholding_cash=withcash,opening_cash_after_reserves=start,cash_after_withholding_before_receipts=pre_receipts,closing_cash_after_reserves=cash)
 residual_check=pool-N*price-netunits*price-pvtax if pool>0 else 0
 if abs(residual_check)>max(1e-8,abs(pool)*1e-10):raise ArithmeticError('Claim allocation does not reconcile; suppress valuation')
 funding=max(0,-minimum);status='FUNDED_CONDITIONAL_JUNE_MODEL' if funding==0 and pool>0 else 'WITHHELD_UNFUNDED_OR_NO_EQUITY'
 return {'status':status,'balance_date':'2026-06-30','current_price_target':None,'conditional_share_value':price if status.startswith('FUNDED') else None,'enterprise_value_after_legacy_adjustment':ev,'legacy_expense_adjustment_pv':pvadd,'equity_pool_before_legacy_claims':pool,'ordinary_share_count':N,'selected_legacy_claim_equivalent_units':A,'reported_awards_selected_units':known,'residual_net_claim_equivalent_units':residual,'conditional_net_equity_claim_units':netunits,'ordinary_equity_allocation':N*price,'legacy_net_equity_allocation':netunits*price,'legacy_cash_settlement_pv':pvtax,'allocation_residual':pool-N*price-netunits*price-pvtax if pool>0 else None,'initial_liquidity_after_reserves':x['cash_only']+x['marketable_securities']-haircut-x['operating_cash_reserve']-x['eda_nominal_cash_reserve']-x['other_claim_reserve'],'minimum_liquidity_after_reserves':minimum,'external_funding_required':funding,'terminal_pv_fraction':r['enterprise_value']*r['terminal_pv_fraction']/ev,'settlement_price_status':'Chosen discount-matching cash-planning convention; not a market return forecast; residual units are net economic claim equivalents, not actual instruments','rows':rows}

def main():
 x=json.loads((P/'dcf-inputs-v3.json').read_text());examples=json.loads((P/'analyst-policy-examples-v3.json').read_text());selection=x.get('selected_award_policy');out={'active_selection':selection,'active_outputs':{k:calculate(x,s,selection) for k,s in x['scenarios'].items()},'examples':{}}
 for a in examples:out['examples'][a['policy_id']]={k:calculate(x,s,a['selection']) for k,s in x['scenarios'].items()}
 (P/'dcf-output-v3.json').write_text(json.dumps(out,indent=2));return out
if __name__=='__main__':
 o=main();print(json.dumps({p:{s:{k:v[k] for k in ['status','conditional_share_value','external_funding_required']} for s,v in ss.items()} for p,ss in o['examples'].items()},indent=2))
