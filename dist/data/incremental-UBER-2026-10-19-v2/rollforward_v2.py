"""Conditional June-to-October allocation, not a verified current target.
All monetary fields USD million except explicitly named EUR million. Economic FCFF,
actual cash, financing, acquisitions and asset/claim marks are separate ledgers.
"""
import json,pathlib,datetime,argparse,math
from replay_dcf_v2 import number,CLAIMS
P=pathlib.Path(__file__).resolve().parent
PRINCIPAL_EURM=4500.0
GROSS_PROCEEDS_EURM=4489.3075
ORIGINAL_ISSUE_DISCOUNT_EURM=10.6925
UNDERWRITING_DISCOUNTS_EURM=24.875
ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM=GROSS_PROCEEDS_EURM-UNDERWRITING_DISCOUNTS_EURM
CASH_RECON=('sbc_cash_equivalent_reversal','operating_cash_tax_difference','insurance_collateral_nwc_difference','reinvestment_timing_difference','other_operating_cash_difference')
DEALS=('getir','careem','blacklane')
DEAL_FIELDS=('operating_ev_added','cash_acquired','debt_value_added','nci_value_added','other_claim_value_added')
CURRENT_CLAIMS=tuple(k for k in CLAIMS if k!='debt_total_value')
NONNEG=('eur_usd_at_issue','eur_usd_at_current_mark','euro_note_other_offering_expenses_eurm','euro_note_current_price_fraction','euro_note_proceeds_retained_eurm','actual_cash_interest_paid','other_debt_cash_proceeds','other_debt_value_added','existing_debt_principal_cash_repaid','existing_debt_value_retired','buyback_cash','careem_cash_paid','blacklane_cash_paid','getir_grocery_minority_investment_value','legacy_claim_cash_settled','assumed_current_common_shares','assumed_current_existing_award_incremental_shares','current_operating_cash_reserve')+tuple(d+'_'+k for d in DEALS for k in DEAL_FIELDS)
SIGNED=('interim_economic_fcff','preexisting_debt_mark_change','investment_value_change_ex_careem_getir','other_nonoperating_cash_flow','other_cash_fx_translation','realized_euro_proceeds_fx_adjustment')+CASH_RECON
BASES=('assumption_basis','cash_reconciliation_basis','euro_proceeds_disposition_basis','nonoperating_cash_and_investment_basis','existing_debt_and_claims_basis','share_and_award_basis')+tuple(d+'_basis' for d in DEALS)

def bridge(june,policy):
 if policy.get('as_of')!='2026-10-19':raise ValueError('Frozen bridge ends October19; use a new version for a later cutoff')
 required=NONNEG+SIGNED+BASES
 missing=[k for k in required if policy.get(k) is None]
 current=policy.get('current_inherited_nondebt_claims')
 if not isinstance(current,dict):missing.append('current_inherited_nondebt_claims')
 else:
  extras=set(current)-set(CURRENT_CLAIMS)
  if extras:raise ValueError('Unrecognized inherited claim keys: '+','.join(sorted(extras)))
  missing.extend('current_inherited_nondebt_claims.'+k for k in CURRENT_CLAIMS if current.get(k) is None)
 if not policy.get('acknowledge_conditional_not_verified'):missing.append('acknowledge_conditional_not_verified')
 if not policy.get('acknowledge_no_deal_cash_or_claim_overlap'):missing.append('acknowledge_no_deal_cash_or_claim_overlap')
 if missing:return {'status':'incomplete_rollforward','as_of':'2026-10-19','missing':missing,'conditional_october_allocation_per_share':None,'verified_current_target':None}
 for k in BASES:
  if not isinstance(policy[k],str) or len(policy[k].strip())<20:raise ValueError(k+': substantive rationale required')
 for k in NONNEG:number(policy[k],k,0)
 for k in SIGNED:number(policy[k],k)
 for k in CURRENT_CLAIMS:number(current[k],'current_inherited_nondebt_claims.'+k,0)
 p=policy;a=june['allocation']
 if a['conditional_june_allocation_per_share'] is None:raise ValueError('Complete June allocation policy first')
 careem_removed=a.get('included_careem_investment_value')
 number(careem_removed,'June policy included Careem value',0,a['investment_asset_value'])
 if p['assumed_current_common_shares']<=0 or p['assumed_current_common_shares']!=int(p['assumed_current_common_shares']):raise ValueError('Current common shares must be a positive integer')
 if p['assumed_current_existing_award_incremental_shares']!=int(p['assumed_current_existing_award_incremental_shares']):raise ValueError('Existing award units must be integer')
 if not 0<p['euro_note_current_price_fraction']<=2:raise ValueError('Debt value fraction of principal must be positive')
 if not .2<p['eur_usd_at_issue']<5 or not .2<p['eur_usd_at_current_mark']<5:raise ValueError('Explicit plausible FX required')
 if p['euro_note_other_offering_expenses_eurm']>=ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM:raise ValueError('Other expenses cannot consume issuer proceeds after known underwriting discounts')
 net_eur=ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM-p['euro_note_other_offering_expenses_eurm']
 if p['euro_note_proceeds_retained_eurm']>net_eur:raise ValueError('Retained euro note cash cannot exceed net proceeds; other EUR cash belongs in other FX reconciliation')
 duration=(datetime.date(2026,10,19)-datetime.date(2026,6,30)).days/365.25
 acquired_ev=sum(p[d+'_operating_ev_added'] for d in DEALS)
 rolled_ev=june['operating_enterprise_value']*(1+june['wacc'])**duration-p['interim_economic_fcff']*(1+june['wacc'])**(duration/2)+acquired_ev
 # Positive reconciliation adds actual cash relative to economic FCFF. Cash-tax
 # difference includes actual interest tax shields; actual cash interest is then
 # deducted in full exactly once below. SBC reversal requires matching awards.
 cash_reconciliation={k:p[k] for k in CASH_RECON}
 actual_operating_cash=p['interim_economic_fcff']+sum(cash_reconciliation.values())
 proceeds_issue_usd=net_eur*p['eur_usd_at_issue']
 note_cash_fx=p['euro_note_proceeds_retained_eurm']*(p['eur_usd_at_current_mark']-p['eur_usd_at_issue'])
 new_debt_value=PRINCIPAL_EURM*p['eur_usd_at_current_mark']*p['euro_note_current_price_fraction']
 deal_cash_paid=465+p['careem_cash_paid']+p['blacklane_cash_paid']
 deal_cash_acquired=sum(p[d+'_cash_acquired'] for d in DEALS)
 cash_components={'june_unrestricted_liquidity':5391,'actual_operating_cash_after_reinvestment_before_interest':actual_operating_cash,'actual_cash_interest_paid':-p['actual_cash_interest_paid'],'new_notes_net_proceeds_at_issue_fx':proceeds_issue_usd,'retained_new_note_cash_fx_translation':note_cash_fx,'realized_euro_proceeds_fx_adjustment':p['realized_euro_proceeds_fx_adjustment'],'other_cash_fx_translation':p['other_cash_fx_translation'],'other_debt_cash_proceeds':p['other_debt_cash_proceeds'],'existing_debt_cash_repayments':-p['existing_debt_principal_cash_repaid'],'buybacks':-p['buyback_cash'],'closed_deal_consideration':-deal_cash_paid,'closed_deal_cash_acquired':deal_cash_acquired,'legacy_claim_cash_settled':-p['legacy_claim_cash_settled'],'other_nonoperating_cash_flow':p['other_nonoperating_cash_flow']}
 cash=sum(cash_components.values())
 legacy_investment=a['investment_asset_value']-careem_removed+p['investment_value_change_ex_careem_getir']
 legacy_debt=a['claim_deductions']['debt_total_value']+p['preexisting_debt_mark_change']-p['existing_debt_value_retired']
 if legacy_investment<0 or legacy_debt<0:raise ValueError('Residual legacy investment/debt cannot be negative before adding new assets/debt')
 invest=legacy_investment+p['getir_grocery_minority_investment_value']
 debt=legacy_debt+new_debt_value+p['other_debt_value_added']+sum(p[d+'_debt_value_added'] for d in DEALS)
 other=sum(current[k] for k in CURRENT_CLAIMS)+sum(p[d+'_nci_value_added']+p[d+'_other_claim_value_added'] for d in DEALS)
 if invest<0 or debt<0:raise ValueError('Negative investment or debt value needs a separate model/classification')
 if cash>=0 and p['euro_note_proceeds_retained_eurm']*p['eur_usd_at_current_mark']>cash+1e-7:raise ValueError('Assumed retained EUR note cash exceeds total ending cash: reconcile currency disposition/outflows')
 equity=rolled_ev+cash-p['current_operating_cash_reserve']+invest-debt-other
 denom=p['assumed_current_common_shares']+p['assumed_current_existing_award_incremental_shares'];funded=cash>=p['current_operating_cash_reserve']
 deals={d:{'cash_consideration':465 if d=='getir' else p[d+'_cash_paid'],**{k:p[d+'_'+k] for k in DEAL_FIELDS},'minority_investment_added':p['getir_grocery_minority_investment_value'] if d=='getir' else 0,'prior_investment_removed':careem_removed if d=='careem' else 0,'assumption_basis':p[d+'_basis']} for d in DEALS}
 return {'status':'conditional_rollforward' if funded and equity>0 else 'suppressed_cash_or_equity_shortfall','as_of':'2026-10-19','information_cutoff':'2026-10-19','duration_years':duration,'assumption_basis':p['assumption_basis'],'resolved_assumptions':p,'rolled_operating_ev':rolled_ev,'interim_economic_fcff':p['interim_economic_fcff'],'economic_to_actual_operating_cash_reconciliation':cash_reconciliation,'actual_operating_cash_after_reinvestment_before_interest':actual_operating_cash,'new_euro_notes_principal_eurm':PRINCIPAL_EURM,'new_euro_notes_gross_proceeds_eurm':GROSS_PROCEEDS_EURM,'new_euro_notes_known_original_issue_discount_eurm':ORIGINAL_ISSUE_DISCOUNT_EURM,'new_euro_notes_known_underwriting_discounts_eurm':UNDERWRITING_DISCOUNTS_EURM,'new_euro_notes_issuer_proceeds_before_other_expenses_eurm':ISSUER_PROCEEDS_BEFORE_OTHER_EXPENSES_EURM,'new_euro_notes_net_proceeds_eurm_assumed':net_eur,'new_euro_notes_cash_proceeds_usdm_at_issue':proceeds_issue_usd,'new_euro_notes_retained_cash_fx_adjustment_usdm':note_cash_fx,'new_euro_notes_debt_value_usdm':new_debt_value,'cash_rollforward_components':cash_components,'ending_unrestricted_liquidity_assumed':cash,'named_closed_deals':deals,'residual_legacy_investment_value':legacy_investment,'investment_value_assumed':invest,'residual_legacy_debt_value':legacy_debt,'debt_value_assumed':debt,'current_inherited_nondebt_claims':current,'inherited_nondebt_claim_change':{k:current[k]-a['claim_deductions'][k] for k in CURRENT_CLAIMS},'nondebt_claim_value_assumed':other,'conditional_common_equity_value':equity,'assumed_common_plus_existing_award_shares':denom,'conditional_october_allocation_per_share':equity*1e6/denom if funded and equity>0 else None,'verified_current_target':None,'current_verified_equity_ready':False,'warnings':['Euro principal 4500; sourced gross proceeds4489.3075 and underwriting discounts24.875; issuer proceeds4464.4325 before other expenses. Neither known discount can be waived.','Retained EUR cash and debt are both translated at current FX; any converted/spent proceeds require explicit disposition and realized FX reconciliation. Debt price fraction must include all current claim value, including any accrued interest.','Economic FCFF rolls EV; actual cash is reconciled separately. Nonoperating cash receipts do not reduce operating EV. Match equity issuance proceeds/SBC reversal with the share and award rollforward.','Getir cash465 covers food control plus minority grocery stake; value these separately, and do not assume consideration equals operating EV.','Careem removal uses the value actually included in June policy, not automatically reported book147.','Current inherited debt marks and every lease/NCI/other claim are chosen or unchanged assumptions, never silently refreshed facts. Per-deal NCI and other acquired claims must exclude amounts already entered in inherited claims.','Existing June2bn term loan matures December2026; repayment/refinancing and future liquidity need separate assessment. It remains within June debt, not another claim.','No Delivery Hero or ezCater consolidation/payment is inferred from pending offers. Commitments are not automatically drawn.','Cash availability test is aggregate, not daily liquidity, local cash fungibility or future funding certification.']}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--policy',default='post-june-rollforward-template-v2.json');ap.add_argument('--output',default='rollforward-output-v2.json');args=ap.parse_args();p=P/args.output
 if p.parent!=P or not p.name.endswith('output-v2.json'):raise ValueError('Output must be local *output-v2.json')
 j=json.loads((P/'illustration-output-v2.json').read_text());policy=json.loads((P/args.policy).read_text());out={'cases':{k:bridge(v,policy) for k,v in j['cases'].items()},'frozen_june_allocation_file':'illustration-output-v2.json'};p.write_text(json.dumps(out,indent=2)+'\n');print({k:v['status'] for k,v in out['cases'].items()})
if __name__=='__main__':main()
