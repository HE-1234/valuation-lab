"""Marvell research-only FCFF model. Standard library only; USD millions.
No market quote or target price is an input. See MODEL-NOTES.md for date/claim gates.
"""
from math import erf, exp, log, sqrt

H1_REVENUE = 5157.1
H1_DATA_CENTER = 4004.2
H1_OTHER = 1152.9
H1_RD = 1393.4
FY2026_REVENUE = 8194.6
TTM_REVENUE = FY2026_REVENUE + H1_REVENUE - 3901.4
HISTORICAL_RD = {2022:1424.2, 2023:1784.3, 2024:1896.2, 2025:1950.4, 2026:2075.2}
RD_LIFE = 5
TREASURY = .0509
SOVEREIGN_SPREAD = .0022
RISK_FREE = TREASURY - SOVEREIGN_SPREAD
ERP = .042 + SOVEREIGN_SPREAD
OPERATING_BETA = 1.50
DEBT_WEIGHT = .05
DEBT_SPREAD = .013
TAX_SHIELD = .21
LEVERED_BETA = OPERATING_BETA * (1 + (1-TAX_SHIELD)*DEBT_WEIGHT/(1-DEBT_WEIGHT))
START_WACC = (RISK_FREE + LEVERED_BETA*ERP)*(1-DEBT_WEIGHT) + (TREASURY+DEBT_SPREAD)*(1-TAX_SHIELD)*DEBT_WEIGHT
TERMINAL_WACC = .09

SCENARIOS = {
 'base': {
  'classification':'Analyst execution-discount scenario; not management guidance or an assigned probability',
  'total_2027_to_2035':[12000,18000,27000,37000,45000,51000,55500,59000,61500],
  'other_2027_to_2035':[2350,2500,2650,2780,2920,3050,3170,3280,3380],
  'growth_2036':.04, 'terminal_growth':.03,
  'gross_margin':[.580,.580,.570,.565,.560],
  'cash_rd_ratio':[.175,.163,.155,.150,.150],
  'cash_sga_ratio':[.048,.044,.040,.037,.035],
  'future_grants_ratio':[.10,.095,.09,.085,.08],
  'commercial_incentive_ratio':.01,
  'terminal_gross_margin':.55,'terminal_cash_rd':.16,'terminal_cash_sga':.035,'terminal_future_grants':.06,
  'near_sales_to_nonresearch_capital':[1.6,1.7,1.8,1.8,1.7],
  'initial_tax':.15,'terminal_tax':.21,
  'thesis':'AI custom and connectivity ramps continue, but FY2031 sales are $45bn, below the $70–90bn management target. Growth and margin expansion slow with customer bargaining power, competition and silicon transitions.',
 },
 'downside': {
  'classification':'Analyst joint demand/competition/capacity downside; not a statistical percentile',
  'total_2027_to_2035':[11400,15000,13500,15525,19000,22000,24400,26350,27900],
  'other_2027_to_2035':[2250,2300,2070,2150,2250,2340,2430,2520,2600],
  'growth_2036':.035,'terminal_growth':.025,
  'gross_margin':[.575,.555,.510,.520,.530],
  'cash_rd_ratio':[.185,.185,.210,.200,.190],
  'cash_sga_ratio':[.050,.050,.055,.050,.045],
  'future_grants_ratio':[.11,.11,.115,.11,.10],
  'commercial_incentive_ratio':.015,
  'terminal_gross_margin':.53,'terminal_cash_rd':.17,'terminal_cash_sga':.04,'terminal_future_grants':.07,
  'near_sales_to_nonresearch_capital':[1.2,1.3,1.0,1.2,1.3],
  'initial_tax':.18,'terminal_tax':.23,
  'thesis':'FY2029 revenue contracts 10% as hyperscalers delay deployments or move programs in-house. Research and grant costs cannot fall proportionately. No working-capital windfall is assumed during contraction.',
 },
 'management_delivery': {
  'classification':'Analyst interpretation of management-target delivery; not a complete management forecast',
  'total_2027_to_2035':[12500,20000,34000,52000,75000,90000,103500,114000,123000],
  'other_2027_to_2035':[2400,2700,3000,3300,3600,3900,4150,4400,4650],
  'growth_2036':.05,'terminal_growth':.035,
  'gross_margin':[.585,.585,.585,.580,.580],
  'cash_rd_ratio':[.170,.150,.135,.125,.120],
  'cash_sga_ratio':[.046,.040,.035,.032,.030],
  'future_grants_ratio':[.10,.09,.08,.07,.06],
  'commercial_incentive_ratio':.01,
  'terminal_gross_margin':.56,'terminal_cash_rd':.15,'terminal_cash_sga':.035,'terminal_future_grants':.06,
  'near_sales_to_nonresearch_capital':[1.8,2.0,2.0,1.9,1.8],
  'initial_tax':.15,'terminal_tax':.21,
  'thesis':'FY2028 sales reach management’s $20bn target and FY2031 sales reach $75bn, inside its $70–90bn range. Economic EBIT still charges future grants and commercial incentives omitted or unresolved in non-GAAP targets.',
 }
}

def interp(a,b,f): return a+(b-a)*max(0,min(1,f))
def full_paths(s):
    # 16 calendar-labelled fiscal totals FY2027–FY2042. FY2037–42 stable
    # growth gives the research vintages time to mature before terminal value.
    rev=dict(zip(range(2027,2036),s['total_2027_to_2035']))
    other=dict(zip(range(2027,2036),s['other_2027_to_2035']))
    rev[2036]=rev[2035]*(1+s['growth_2036'])
    other[2036]=other[2035]*(1+s['terminal_growth'])
    for y in range(2037,2043):
        rev[y]=rev[y-1]*(1+s['terminal_growth'])
        other[y]=other[y-1]*(1+s['terminal_growth'])
    return rev,other

def model(scenario='base', future_grants_delta=0.0, terminal_roic=None,
          start_wacc=START_WACC, terminal_wacc=TERMINAL_WACC,
          sales_to_capital_multiplier=1.0, revenue_multiplier=1.0,
          cash_cost_delta=0.0, h2_capacity_net_investment=600.0, additional_h2_capacity_stress=0.0):
    s=SCENARIOS[scenario]
    g=s['terminal_growth']; roic=terminal_wacc if terminal_roic is None else terminal_roic
    if not (0<=g<terminal_wacc): raise ValueError('Terminal growth must be below terminal WACC')
    if roic<=g: raise ValueError('ROIC must exceed growth for a positive-distribution stable state')
    rev,other=full_paths(s)
    rev={y:v*revenue_multiplier for y,v in rev.items()}
    other={y:v*revenue_multiplier for y,v in other.items()}
    rd=dict(HISTORICAL_RD)
    # Year-end spending convention: current research is not amortized in the
    # same fiscal year. August origin removes half prior-vintage amortization.
    jan_research_asset=sum(rd[2026-i]*(1-i/RD_LIFE) for i in range(RD_LIFE))
    prior_amort=sum(rd[y] for y in range(2022,2027))/RD_LIFE
    research_asset=jan_research_asset+H1_RD-prior_amort*.5
    origin_research_asset=research_asset
    discount=1.0; rows=[]; elapsed=0.0
    operating_nwc=2808.0  # identified August 1 components only; see capital-claims-v2.json
    operating_cash=1000.0  # analyst liquidity reserve, not a management minimum
    capacity_prepayments=487.0
    other_operating_nwc=operating_nwc-capacity_prepayments
    # All-in target is 35% downside / 30% other cases at maturity.
    # Capacity net investment is explicit; management's $1bn FY27 gross
    # cash-payment expectation is not falsely equated to a net balance change.
    other_nwc_ratio=.30 if scenario=='downside' else .25
    nonresearch_capital=operating_nwc+operating_cash+1071.0+256.9+2346.6+13873.9
    stable_m=s['terminal_gross_margin']-s['terminal_cash_rd']-s['terminal_cash_sga']-(s['terminal_future_grants']+future_grants_delta)-s['commercial_incentive_ratio']-cash_cost_delta
    stable_r=s['terminal_cash_rd']+.70*(s['terminal_future_grants']+future_grants_delta)
    stable_amort_coefficient=sum((1+g)**(-k) for k in range(1,RD_LIFE+1))/RD_LIFE
    stable_rd_net_ratio=stable_r*(1-stable_amort_coefficient)
    stable_economic_nopat_ratio=stable_m*(1-s['terminal_tax'])+stable_rd_net_ratio
    stable_total_reinvestment_ratio=g/roic*stable_economic_nopat_ratio
    stable_nonresearch_reinvestment_ratio=stable_total_reinvestment_ratio-stable_rd_net_ratio
    if stable_nonresearch_reinvestment_ratio<=0: raise ValueError('Nonresearch capital requirement must be positive')
    terminal_sales_to_nonresearch_capital=(g/(1+g))/stable_nonresearch_reinvestment_ratio
    # This is a capital-funding assumption, not a physical-capex prediction.
    for y in range(2027,2043):
        idx=y-2027; duration=.5 if y==2027 else 1.0
        sales=rev[y]-H1_REVENUE if y==2027 else rev[y]
        dc_sales=rev[y]-other[y]-(H1_DATA_CENTER if y==2027 else 0)
        other_sales=other[y]-(H1_OTHER if y==2027 else 0)
        def ratio(key,terminal_key):
            if idx<5:return s[key][idx]
            return interp(s[key][-1],s[terminal_key],(y-2031)/6)
        gm=ratio('gross_margin','terminal_gross_margin')
        cashrd=ratio('cash_rd_ratio','terminal_cash_rd')
        cashsga=ratio('cash_sga_ratio','terminal_cash_sga')
        grants=ratio('future_grants_ratio','terminal_future_grants')+future_grants_delta
        commercial=s['commercial_incentive_ratio']
        tax=interp(s['initial_tax'],s['terminal_tax'],(y-2027)/10)
        cash_rd=sales*cashrd
        grant_cost=sales*grants
        economic_rd=cash_rd+.70*grant_cost
        operating_ebit=sales*(gm-cashrd-cashsga-grants-commercial-cash_cost_delta)
        cash_taxes=max(operating_ebit,0)*tax
        expensed_nopat=operating_ebit-cash_taxes
        if y==2027:
            amort=prior_amort*.5
            rd[y]=H1_RD+economic_rd
        else:
            amort=sum(rd[k] for k in range(y-RD_LIFE,y))/RD_LIFE
            rd[y]=economic_rd
        net_research=economic_rd-amort
        economic_ebit=operating_ebit+net_research
        economic_nopat=economic_ebit-cash_taxes
        research_asset+=net_research
        prev_scale=TTM_REVENUE if y==2027 else rev[y-1]
        delta_sales=rev[y]-prev_scale
        if idx<5: sc=s['near_sales_to_nonresearch_capital'][idx]*sales_to_capital_multiplier
        else: sc=interp(s['near_sales_to_nonresearch_capital'][-1]*sales_to_capital_multiplier,terminal_sales_to_nonresearch_capital,(y-2031)/6)
        nonresearch_reinvestment=max(delta_sales,0)/sc
        # Assumes no cash release during contraction. Add a funded working-
        # capital/capacity lockup rather than allowing a negative requirement.
        contraction_lockup=.03*sales if delta_sales<0 else 0.0
        nonresearch_reinvestment+=contraction_lockup
        target_other_nwc=rev[y]*other_nwc_ratio
        delta_other_nwc=max(target_other_nwc-other_operating_nwc,0.0) if delta_sales>=0 else contraction_lockup
        delta_capacity=(max(h2_capacity_net_investment,0.0) if y==2027
                        else max(.05*rev[y]-capacity_prepayments,0.0))
        delta_nwc=delta_other_nwc+delta_capacity
        delta_cash=max(1000.0,.08*rev[y])-operating_cash
        delta_cash=max(delta_cash,0.0)
        # Ensure the aggregate funding allowance also covers the explicit working-
        # capital and liquidity schedules. This capital allowance does not establish treasury financing access.
        nonresearch_reinvestment=max(nonresearch_reinvestment,delta_nwc+delta_cash)
        # Separate stress: extra H2 deposits are added AFTER the baseline
        # funding allocation, so H2 other investment is not crowded out.
        added_h2_capacity=max(additional_h2_capacity_stress,0.0) if y==2027 else 0.0
        delta_capacity+=added_h2_capacity
        delta_nwc+=added_h2_capacity
        nonresearch_reinvestment+=added_h2_capacity
        net_other_operating_investment=nonresearch_reinvestment-delta_nwc-delta_cash
        ordinary_da=.037*sales
        gross_other_operating_investment=ordinary_da+net_other_operating_investment
        other_operating_nwc+=delta_other_nwc
        capacity_prepayments+=delta_capacity
        operating_nwc=other_operating_nwc+capacity_prepayments;operating_cash+=delta_cash
        nonresearch_capital+=nonresearch_reinvestment
        total_reinvestment=nonresearch_reinvestment+net_research
        fcff=expensed_nopat-nonresearch_reinvestment
        wacc=interp(start_wacc,terminal_wacc,(y-2027)/10)
        discount*=(1+wacc)**duration;elapsed+=duration
        rows.append(dict(fiscal_year=y,period='H2 only' if y==2027 else 'full fiscal year',duration_years=duration,years_after_origin=elapsed,
          revenue=sales,annual_revenue_scale=rev[y],data_center_revenue=dc_sales,communications_other_revenue=other_sales,
          growth_from_prior_annual_scale=delta_sales/prev_scale,gross_margin_before_equity_grant_cost=gm,
          cash_rd_ratio=cashrd,cash_rd=cash_rd,cash_sga=sales*cashsga,recurring_future_grant_ratio=grants,
          recurring_future_grant_cost=grant_cost,future_commercial_incentive_cost=sales*commercial,
          other_cash_cost_sensitivity=sales*cash_cost_delta,rd_share_of_future_grants=.70,
          economic_rd_spend=economic_rd,research_amortization=amort,net_research_investment=net_research,
          research_asset_end=research_asset,expensed_rd_economic_ebit=operating_ebit,
          expensed_rd_economic_margin=operating_ebit/sales,tax_rate=tax,cash_operating_taxes=cash_taxes,
          expensed_rd_nopat=expensed_nopat,rd_capitalized_ebit=economic_ebit,rd_capitalized_nopat=economic_nopat,
          sales_to_nonresearch_capital=sc,nonresearch_reinvestment=nonresearch_reinvestment,
          contraction_lockup=contraction_lockup,capacity_prepayments_end=capacity_prepayments,
          net_capacity_prepayment_investment=delta_capacity,additional_capacity_stress=added_h2_capacity,other_operating_nwc_end=other_operating_nwc,
          delta_other_operating_nwc=delta_other_nwc,operating_nwc_end=operating_nwc,delta_operating_nwc=delta_nwc,
          operating_cash_end=operating_cash,delta_operating_cash=delta_cash,ordinary_da=ordinary_da,
          net_other_operating_investment=net_other_operating_investment,gross_other_operating_investment=gross_other_operating_investment,
          nonresearch_operating_capital_end=nonresearch_capital,total_operating_capital_end=nonresearch_capital+research_asset,
          total_reinvestment_including_rd=total_reinvestment,
          fcff=fcff,period_wacc=wacc,cumulative_discount_factor=discount,pv_fcff=fcff/discount))
    last=rows[-1]
    next_rev=last['revenue']*(1+g)
    next_rd=next_rev*stable_r
    next_amort=sum(rd[k] for k in range(2043-RD_LIFE,2043))/RD_LIFE
    next_net_rd=next_rd-next_amort
    next_expensed_nopat=next_rev*stable_m*(1-s['terminal_tax'])
    next_econ_nopat=next_expensed_nopat+next_net_rd
    terminal_reinvestment=next_econ_nopat*g/roic
    terminal_nonresearch=terminal_reinvestment-next_net_rd
    terminal_fcff=next_econ_nopat-terminal_reinvestment
    terminal_value=terminal_fcff/(terminal_wacc-g)
    ev=sum(r['pv_fcff'] for r in rows)+terminal_value/discount
    return dict(scenario=scenario,classification=s['classification'],financial_origin='2026-08-01',information_cutoff='2026-10-18',currency='USD',units='millions',
      valuation_label='Retrospective-information August 1 operating scenario; not October equity value or an August backtest',
      analyst_revenue_basis='Cash-equivalent customer revenue before amortization of existing equity warrants, after ordinary rebates; management target net/gross comparability is unresolved',
      research_life_years=RD_LIFE,origin_research_asset_diagnostic=origin_research_asset,rows=rows,
      terminal=dict(growth=g,wacc=terminal_wacc,incremental_economic_roic=roic,roic_policy='Equal to terminal WACC by default; analyst no-persistent-excess-return funding convention, not observed corporate return',
         revenue=next_rev,expensed_rd_nopat=next_expensed_nopat,economic_nopat=next_econ_nopat,
         research_spend=next_rd,research_amortization=next_amort,net_research_investment=next_net_rd,
         total_reinvestment=terminal_reinvestment,nonresearch_reinvestment=terminal_nonresearch,
         fcff=terminal_fcff,value_at_horizon=terminal_value,present_value=terminal_value/discount,
         sales_to_nonresearch_capital=terminal_sales_to_nonresearch_capital),
      enterprise_operating_value=ev,terminal_pv_share_of_ev=(terminal_value/discount)/ev,
      per_share_value=None,current_date_value=None,claim_allocation_status='Blocked until date, employee award, warrant and earnout elections are supplied')

def black_scholes_call(share_value,strike,years,volatility,risk_free=RISK_FREE,dividend_yield=0.0):
    if min(share_value,strike,years,volatility)<0:raise ValueError('Negative option input')
    if strike==0:return share_value*exp(-dividend_yield*years)
    if years==0 or volatility==0:return max(share_value*exp(-dividend_yield*years)-strike*exp(-risk_free*years),0)
    if share_value==0:return 0.
    n=lambda x:.5*(1+erf(x/sqrt(2)))
    d1=(log(share_value/strike)+(risk_free-dividend_yield+volatility**2/2)*years)/(volatility*sqrt(years))
    d2=d1-volatility*sqrt(years)
    return share_value*exp(-dividend_yield*years)*n(d1)-strike*exp(-risk_free*years)*n(d2)

def allocate_claims(equity_pool,common_shares,full_value_awards,preferred_as_converted,
                    options,earnout_full_value_shares=0.0):
    """Conditional simultaneous option-aware claim allocation. Counts in millions.
    Callers must resolve dating, employee mix and performance assumptions first.
    Option dictionary: count, strike, years, volatility, optional vesting_fraction.
    Exercise value is in the call formula: do not also add exercise proceeds.
    Never deduct a fair-value earnout liability with earnout shares here.
    """
    if min(common_shares,full_value_awards,preferred_as_converted,earnout_full_value_shares)<0:
        raise ValueError('Negative share count')
    for option in options:
        if option['count']<0 or not 0<=option.get('vesting_fraction',1)<=1:
            raise ValueError('Invalid option count or vesting probability')
    denominator=common_shares+full_value_awards+preferred_as_converted+earnout_full_value_shares
    if equity_pool<0 or denominator<=0:raise ValueError('Invalid equity pool or denominator')
    lo,hi=0.,equity_pool/denominator
    for _ in range(200):
        p=(lo+hi)/2
        claim=sum(o['count']*o.get('vesting_fraction',1)*black_scholes_call(p,o['strike'],o['years'],o['volatility'],o.get('risk_free',RISK_FREE),o.get('dividend_yield',0)) for o in options)
        if p*denominator+claim>equity_pool:hi=p
        else:lo=p
    p=(lo+hi)/2
    claims=[dict(o,value=o['count']*o.get('vesting_fraction',1)*black_scholes_call(p,o['strike'],o['years'],o['volatility'],o.get('risk_free',RISK_FREE),o.get('dividend_yield',0))) for o in options]
    return dict(conditional_share_value=p,common_and_fullvalue_claim=p*denominator,option_claims=claims,
                reconciliation_error=p*denominator+sum(o['value'] for o in claims)-equity_pool)

if __name__=='__main__':
    import json
    from pathlib import Path
    root=Path(__file__).resolve().parent
    data={k:model(k) for k in SCENARIOS}
    (root/'forecast-scenarios-v2.json').write_text(json.dumps(data,indent=2)+'\n')
    print(json.dumps({k:{'operating_EV':v['enterprise_operating_value'],'terminal_PV_fraction':v['terminal_pv_share_of_ev'],'per_share':v['per_share_value']} for k,v in data.items()},indent=2))
