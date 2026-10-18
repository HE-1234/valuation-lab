"""Conditional equity-claim allocation, USD millions and shares in millions.
No market share price is used. This is an analytical Black-Scholes approximation,
not an observed warrant quote or a model of performance-vesting probabilities.
"""
from math import erf, exp, log, sqrt, isfinite

def normal_cdf(z):
    return .5 * (1 + erf(z / sqrt(2)))

def call_value(share_value, strike, rate, volatility, years):
    if share_value <= 0:
        return 0.0
    if strike == 0:
        return share_value
    if years <= 0:
        return max(share_value - strike, 0.0)
    if volatility <= 0:
        return max(share_value - strike * exp(-rate * years), 0.0)
    d1 = (log(share_value / strike) + (rate + .5 * volatility**2) * years) / (volatility * sqrt(years))
    d2 = d1 - volatility * sqrt(years)
    return share_value * normal_cdf(d1) - strike * exp(-rate * years) * normal_cdf(d2)

def allocate_equity(equity_pool_m, ordinary_shares_m=35.834864,
                    zero_strike_awards_m=.306261, warrant_shares_m=.381922,
                    strike=208.48, rate=.04922, volatility=.452,
                    years=5.711156741957563):
    """E = (ordinary + zero-strike awards)*P + warrants*C(P).
    E is after cash/non-operating assets and all non-equity claims, but BEFORE
    existing awards and warrants. Do not add strike proceeds separately: the
    call formula and simultaneous allocation already capture the exercise price.
    All three share counts must refer to the same financial-origin date.
    """
    values=[equity_pool_m,ordinary_shares_m,zero_strike_awards_m,warrant_shares_m,strike,rate,volatility,years]
    if not all(isfinite(x) for x in values):
        raise ValueError('Inputs must be finite')
    if ordinary_shares_m <= 0 or min(zero_strike_awards_m,warrant_shares_m,strike,volatility,years) < 0:
        raise ValueError('Invalid share, strike, volatility or maturity input')
    if equity_pool_m <= 0:
        return {'ordinary_share_value':0.0,'ordinary_equity_m':0.0,'award_claim_m':0.0,'warrant_claim_m':0.0,'unallocated_shortfall_m':-equity_pool_m,'residual_m':0.0}
    lo,hi=0.0,equity_pool_m/(ordinary_shares_m+zero_strike_awards_m)
    for _ in range(200):
        p=(lo+hi)/2
        claims=(ordinary_shares_m+zero_strike_awards_m)*p+warrant_shares_m*call_value(p,strike,rate,volatility,years)
        if claims>equity_pool_m:hi=p
        else:lo=p
    p=(lo+hi)/2;aw=zero_strike_awards_m*p;wc=warrant_shares_m*call_value(p,strike,rate,volatility,years);ordinary=ordinary_shares_m*p
    return {'ordinary_share_value':p,'ordinary_equity_m':ordinary,'award_claim_m':aw,'warrant_claim_m':wc,'unallocated_shortfall_m':0.0,'residual_m':equity_pool_m-ordinary-aw-wc}

if __name__=='__main__':
    # Synthetic equity pools are arithmetic fixtures, not FN valuations.
    for e in [0,100,1000,5000,10000,20000]:
        r=allocate_equity(e)
        assert abs(r['residual_m'])<1e-8
        assert r['ordinary_share_value']<=e/35.834864+1e-9
    for e in [5000,10000,20000]:
        a=allocate_equity(e,warrant_shares_m=0,zero_strike_awards_m=0)
        assert abs(a['ordinary_share_value']-e/35.834864)<1e-8
        assert allocate_equity(e,volatility=.60)['ordinary_share_value']<=allocate_equity(e,volatility=.35)['ordinary_share_value']
        assert allocate_equity(e,warrant_shares_m=.381922)['ordinary_share_value']<=allocate_equity(e,warrant_shares_m=.085942)['ordinary_share_value']
        z=allocate_equity(e,years=0)
        expected=e/(35.834864+.306261)
        if expected>208.48:expected=(e+.381922*208.48)/(35.834864+.306261+.381922)
        assert abs(z['ordinary_share_value']-expected)<1e-8
    print('Claim allocation synthetic arithmetic tests passed; no FN valuation or price target generated.')
