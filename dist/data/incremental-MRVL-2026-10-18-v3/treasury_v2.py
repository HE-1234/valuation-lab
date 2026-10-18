"""Conditional treasury translation, NOT a common-equity valuation.
All forecast settlement schedules are labeled assumptions. Historical cash is
reconciled separately. No claim that public disclosure identifies actual vesting.
"""
from calendar import monthrange
from datetime import date
from copy import deepcopy
import valuation_v2 as v

ORIGIN_CASH=3932.8
OPERATING_RESERVE=1000.0
OPENING_CASH_EARMARKS={'technology_licenses':220.0,'restructuring':238.4,'income_tax_payables':249.4,'maximum_earnout_cash':233.0}
DIVIDEND_RATE=.06
DIVIDEND_STALE_ECONOMIC_SHARES=876.926613+21.778
DIVIDEND_PROXY=DIVIDEND_RATE*DIVIDEND_STALE_ECONOMIC_SHARES
REVOLVER_NOMINAL=1500.0
REVOLVER_DISCLOSED_EXPIRY=date(2030,6,30)
# June30 is Sunday. Contract requires preceding business day; June28 is used
# for the monthly screen, subject to the contractual business-day definition.
REVOLVER_MODEL_EXPIRY=date(2030,6,28)
ANALYST_NEW_DEBT_RATE=.0639
REFINANCING_FEE=.005
COMMITMENT_FEE=.00125
OPENING_COMMITMENT_FEE_ACCRUAL_PROXY=1500*COMMITMENT_FEE*31/360  # assumed undrawn July, not a reported payable
LEGACY_ANNUAL_CASH={2027:365.2,2028:730.4,2029:730.4*2/3,2030:730.4/3}
# Principal dates from annual debt note and April15 2026 issue.
# Coupon schedules use the note's semiannual dates; no price quote is needed.
BONDS=[
 {'id':'MTG-MTI-2028','face':499.9,'coupon':.04875,'due':'2028-06-22','coupon_months':[6,12],'coupon_day':22},
 {'id':'2028','face':750.,'coupon':.0245,'due':'2028-04-15','coupon_months':[4,10],'coupon_day':15},
 {'id':'2029','face':500.,'coupon':.0575,'due':'2029-02-15','coupon_months':[2,8],'coupon_day':15},
 {'id':'2030','face':500.,'coupon':.0475,'due':'2030-07-15','coupon_months':[1,7],'coupon_day':15},
 {'id':'2031','face':750.,'coupon':.0295,'due':'2031-04-15','coupon_months':[4,10],'coupon_day':15},
 {'id':'2033','face':500.,'coupon':.0595,'due':'2033-09-15','coupon_months':[3,9],'coupon_day':15},
 {'id':'2035','face':500.,'coupon':.0545,'due':'2035-07-15','coupon_months':[1,7],'coupon_day':15},
 {'id':'2036','face':1000.,'coupon':.053,'due':'2036-04-15','coupon_months':[4,10],'coupon_day':15},
]

def monthly_rows(model):
    """Calendar-month timing approximation: Aug-Jan stub, then Feb-Jan years."""
    out=[]
    for r in model['rows']:
        fy=r['fiscal_year']; months=[(fy-1,m) for m in range(8 if fy==2027 else 2,13)]+[(fy,1)]
        for j,(y,m) in enumerate(months):
            out.append({'fiscal_year':fy,'calendar_month':f'{y:04}-{m:02}','month_end':date(y,m,monthrange(y,m)[1]),'period_index':j,'months_in_period':len(months),'economic_row':r})
    return out

def project(scenario='base',compensation_policy='cash_replacement',legacy_multiplier=1.,
            forward_cash_outflow=300.,forward_month='2027-03',principal_policy='cash_repay',
            conditional_revolver=False,investment_timing='uniform',new_award_withholding_rate=.35,
            new_award_settlement_value_multiplier=1., additional_h2_capacity_stress=0.):
    """No-observed-data inputs below are explicitly analyst cash sensitivities.
    cash_replacement: new economic grant budget literally paid as cash; no
      second withholding charge on these hypothetical future cash awards.
    equity_settlement: reverse new economic charge, reverse modeled tax
      deduction, and subtract modeled new-award withholding on 4-year cohorts.
      No employer deduction, exercise proceeds or ESPP cash inflows credited.
    Legacy withholding is a distinct cash use under BOTH policies.
    """
    if compensation_policy not in ('cash_replacement','equity_settlement'):raise ValueError('Bad compensation policy')
    if principal_policy not in ('cash_repay','refinance_all'):raise ValueError('Bad principal policy')
    if investment_timing not in ('uniform','frontloaded'):raise ValueError('Bad timing')
    if legacy_multiplier<0 or forward_cash_outflow<0 or not 0<=new_award_withholding_rate<=1:raise ValueError('Bad settlement assumptions')
    model=v.model(scenario,additional_h2_capacity_stress=additional_h2_capacity_stress)
    cash=ORIGIN_CASH-OPERATING_RESERVE-sum(OPENING_CASH_EARMARKS.values())
    bonds=deepcopy(BONDS);rev=0.;peak_rev=0.;min_cash=cash;min_pre=cash;rows=[];grants=[]
    commitment_fee_accrual=OPENING_COMMITMENT_FEE_ACCRUAL_PROXY
    for i,m in enumerate(monthly_rows(model)):
        r=m['economic_row'];n=m['months_in_period'];fy=m['fiscal_year'];dt=m['month_end'];ym=m['calendar_month']
        econ_grant=r['recurring_future_grant_cost']/n;grants.append(econ_grant)
        economic_nopat=r['expensed_rd_nopat']/n
        economic_newgrant_addback=econ_grant if compensation_policy=='equity_settlement' else 0.
        reverse_unproven_grant_tax_deduction=econ_grant*r['tax_rate'] if compensation_policy=='equity_settlement' else 0.
        cash_nopat=economic_nopat+economic_newgrant_addback-reverse_unproven_grant_tax_deduction
        new_gross_vesting=sum(grants[i-lag]*.25 for lag in [12,24,36,48] if i>=lag)*new_award_settlement_value_multiplier if compensation_policy=='equity_settlement' else 0.
        new_withhold=new_gross_vesting*new_award_withholding_rate
        legacy=LEGACY_ANNUAL_CASH.get(fy,0.)*legacy_multiplier/n
        investment=r['nonresearch_reinvestment']/n if investment_timing=='uniform' else (r['nonresearch_reinvestment'] if m['period_index']==0 else 0.)
        dividend=DIVIDEND_PROXY if ym=='2026-10' else 0.
        forward=forward_cash_outflow if ym==forward_month else 0.
        bond_coupon=0.;principal=0.;refinance=0.;fees=0.;newbonds=[];keep=[]
        for b in bonds:
            due=date.fromisoformat(b['due'])
            if dt.month in b['coupon_months'] and dt>=date(dt.year,dt.month,b['coupon_day']) and dt<=date(due.year,due.month,monthrange(due.year,due.month)[1]):
                bond_coupon+=b['face']*b['coupon']/2
            if (due.year,due.month)==(dt.year,dt.month):
                principal+=b['face']
                if principal_policy=='refinance_all':
                    refinance+=b['face'];fees+=b['face']*REFINANCING_FEE
                    nb=deepcopy(b);nb['id']+='-hypothetical-refinance';nb['coupon']=ANALYST_NEW_DEBT_RATE;nb['due']=due.replace(year=due.year+5).isoformat();newbonds.append(nb)
            else:keep.append(b)
        bonds=keep+newbonds
        expired=dt>=REVOLVER_MODEL_EXPIRY
        mandatory_rev_repay=rev if expired else 0.
        days=monthrange(dt.year,dt.month)[1]
        facility_days=(REVOLVER_MODEL_EXPIRY.day if (dt.year,dt.month)==(2030,6) else days) if not (dt.year,dt.month)>(2030,6) else 0
        interest_rev=rev*ANALYST_NEW_DEBT_RATE*facility_days/360
        opening_fee_accrual=commitment_fee_accrual
        new_fee_accrual=max(REVOLVER_NOMINAL-rev,0)*COMMITMENT_FEE*facility_days/360
        commitment_fee_accrual+=new_fee_accrual
        commitment_fee=commitment_fee_accrual if dt.month in (3,6,9,12) or expired else 0.
        commitment_fee_accrual-=commitment_fee
        opening_cash=cash;opening_rev=rev
        rev-=mandatory_rev_repay
        uses=investment+legacy+new_withhold+dividend+forward+bond_coupon+principal+fees+interest_rev+commitment_fee+mandatory_rev_repay
        cash_pre_income=cash-uses+refinance+min(cash_nopat,0.)
        draw=0.
        # Conditional borrowing is an assumption, never verified covenant access.
        if conditional_revolver and not expired:
            draw_rate=ANALYST_NEW_DEBT_RATE*facility_days/360
            draw=min(max(-cash_pre_income/(1-draw_rate),0.),max(REVOLVER_NOMINAL-rev,0.))
            draw_interest=draw*draw_rate
            interest_rev+=draw_interest;rev+=draw;cash_pre_income+=draw-draw_interest
        peak_rev=max(peak_rev,rev)
        min_pre=min(min_pre,cash_pre_income)
        cash=cash_pre_income+max(cash_nopat,0.)
        voluntary_repay=min(rev,max(cash,0.))
        rev-=voluntary_repay;cash-=voluntary_repay
        min_cash=min(min_cash,cash)
        rows.append({'fiscal_year':fy,'month':ym,'opening_surplus_cash':opening_cash,'economic_nopat':economic_nopat,
          'economic_newgrant_addback':economic_newgrant_addback,'reversal_of_unproven_grant_tax_deduction':reverse_unproven_grant_tax_deduction,
          'cash_operating_nopat_proxy':cash_nopat,'nonresearch_investment_cash':investment,
          'legacy_award_withholding_cash_assumption':legacy,'new_award_gross_vesting_assumption':new_gross_vesting,'new_award_withholding_cash_assumption':new_withhold,
          'declared_dividend_cash_proxy':dividend,'forward_cash_outflow_assumption':forward,'bond_coupon_cash':bond_coupon,
          'bond_principal_due':principal,'hypothetical_refinancing_proceeds':refinance,'hypothetical_refinancing_fee':fees,
          'opening_revolver':opening_rev,'revolver_interest_cash':interest_rev,'commitment_fee_cash':commitment_fee,'opening_commitment_fee_accrual':opening_fee_accrual,
          'new_commitment_fee_accrual':new_fee_accrual,'closing_commitment_fee_accrual':commitment_fee_accrual,
          'revolver_mandatory_repayment':mandatory_rev_repay,'conditional_revolver_draw':draw,'revolver_voluntary_repayment':voluntary_repay,
          'surplus_before_positive_month_nopat':cash_pre_income,'closing_surplus_cash':cash,'closing_revolver':rev,
          'original_and_hypothetically_refinanced_bond_face':sum(b['face'] for b in bonds),'facility_available_by_date':not expired})
    gap=max(0.,-min_pre)
    if gap<1e-7:gap=0.  # suppress floating-point roundoff, not real cash gaps
    return {'scenario':scenario,'status':'CONDITIONAL_SETTLEMENT_SCREEN_NOT_COMPLETE_TREASURY_FORECAST','actual_liquidity_adequacy':None,
      'information_cutoff':'2026-10-18','financial_origin':'2026-08-01','units':'USD millions','compensation_policy':compensation_policy,
      'legacy_cash_multiplier':legacy_multiplier,'forward_outflow_assumption':forward_cash_outflow,'forward_month_assumption':forward_month,
      'principal_policy':principal_policy,'refinance_rate_assumption':ANALYST_NEW_DEBT_RATE,'refinance_fee_assumption':REFINANCING_FEE,
      'conditional_revolver_enabled':conditional_revolver,'covenant_compliance_forecast':None,'investment_timing':investment_timing,
      'new_award_withholding_rate_assumption':new_award_withholding_rate,'new_award_settlement_value_multiplier':new_award_settlement_value_multiplier,
      'additional_h2_capacity_stress':additional_h2_capacity_stress,'opening_surplus_after_earmarks':1992.,
      'minimum_month_end_surplus':min_cash,'minimum_pre_positive_month_nopat_surplus':min_pre,'peak_conditional_revolver':peak_rev,
      'additional_financing_needed_under_assumptions':gap,'financing_gap_is_not_demonstrated_insolvency':True,
      'after_first_gap_rows_are_unfunded_budget_arithmetic':gap>0,'rows':rows}

CASES={
 'cash_compensation_cash_repay':{},
 'cash_compensation_refinance':{'principal_policy':'refinance_all'},
 'equity_settlement_cash_repay':{'compensation_policy':'equity_settlement'},
 'equity_settlement_refinance':{'compensation_policy':'equity_settlement','principal_policy':'refinance_all'},
 'cash_compensation_conditional_revolver':{'conditional_revolver':True},
 'equity_settlement_conditional_revolver':{'compensation_policy':'equity_settlement','conditional_revolver':True},
 'combined_settlement_and_timing_stress':{'legacy_multiplier':2.,'forward_cash_outflow':300.,'forward_month':'2026-10','conditional_revolver':True,'investment_timing':'frontloaded','additional_h2_capacity_stress':400.},
}

def run_all():
    return {s:{label:project(s,**args) for label,args in CASES.items()} for s in v.SCENARIOS}

if __name__=='__main__':
    import json
    from pathlib import Path
    out=run_all();Path(__file__).with_name('conditional-funding-v2.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({s:{k:{'min_cash':r['minimum_month_end_surplus'],'pre_nopat_gap':r['additional_financing_needed_under_assumptions'],'revolver':r['peak_conditional_revolver']} for k,r in cases.items()} for s,cases in out.items()},indent=2))
