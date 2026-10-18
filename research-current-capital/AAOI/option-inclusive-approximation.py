import math,json,datetime,pathlib
p=pathlib.Path(__file__).parent
cash=json.loads((p/'conditional-proposal.json').read_text())['cases'][1]
N=90.601134+1.719518;W=7.945399;C=2.88431837;F=124.925;Kc=F/C;Kw=23.6954
asof=datetime.date(2026,10,17)
t=lambda d:(d-asof).days/365.25
Tc=t(datetime.date(2030,1,15));Tw=t(datetime.date(2035,3,13))
A=cash['operatingEV']+cash['estimatedCurrentCash']-58.915-33.94
Phi=lambda x:(1+math.erf(x/math.sqrt(2)))/2
def call(s,k,T,r,vol):
 if s<=0:return 0
 d1=(math.log(s/k)+(r+vol*vol/2)*T)/(vol*math.sqrt(T));d2=d1-vol*math.sqrt(T)
 return s*Phi(d1)-k*math.exp(-r*T)*Phi(d2)
dates=[datetime.date(y,m,15) for y in (2027,2028,2029,2030) for m in (1,7) if datetime.date(y,m,15)<=datetime.date(2030,1,15)]
def value(vol=.8,spread=.05,rf=.0509,w=W):
 # rf treated annual-effective flat proxy; exact conversion to continuous for BSM.
 r=math.log1p(rf);y=rf+spread
 coupons=[dict(date=str(d),amount=F*.0275/2,years=t(d)) for d in dates]
 B=sum(z['amount']/(1+y)**z['years'] for z in coupons)+F/(1+y)**Tc
 E=A-B
 vc=vw=0
 for i in range(10000):
  # Standard simple dilution correction n/(n+m); other option claim deducted from available equity.
  nc=C*N/(N+C)*call(max(E-vw,0)/N,Kc,Tc,r,vol)
  nw=w*N/(N+w)*call(max(E-vc,0)/N,Kw,Tw,r,vol)
  err=max(abs(nc-vc),abs(nw-vw));vc=(vc+nc)/2;vw=(vw+nw)/2
  if err<1e-10:break
 common=(E-vc-vw)/N
 return dict(volatility=vol,creditSpreadAssumption=spread,riskFreeAnnualEffectiveProxy=rf,straightDebtDirtyPV=B,conversionOptionApprox=vc,wholeNoteApprox=B+vc,warrantOptionApprox=vw,commonPrice=common,commonEquity=common*N,iterations=i+1,residual=A-(B+vc+vw+common*N),coupons=coupons)
r=dict(status='Conditional option-inclusive approximation, not contract-complete fair value; NOT a silent primary-default replacement',units='USD millions; shares millions',asOf=str(asof),central=value(),volatilitySensitivities=[value(v) for v in (.6,.8,1.)],creditSensitivities=[value(.8,s) for s in (.03,.05,.08)],initialVestedOnly=value(w=1.324233),parameters=dict(commonIncludingAwards=N,warrants=W,warrantStrike=Kw,conversionShares=C,notePrincipal=F,conversionStrike=Kc,noteTerm=Tc,warrantTerm=Tw,preNoteWarrantPool=A),method='Joint fixed point: E=A-PVstraightDebt; Vc=C*N/(N+C)*BS((E-Vw)/N,Kc,Tc); Vw=W*N/(N+W)*BS((E-Vc)/N,Kw,Tw); common=(E-Vc-Vw)/N. Other claim held fixed at each option horizon; simplified cross-dilution approximation.',limitations=['No issuer calls, conditional early conversion, averaging, make-whole or default/equity coupling in European option approximation.','Warrant full-cap assumes vesting; ignores extension/cancellation economics.','Vol80% is historical grant assumption reused as analyst current volatility;60/100 alternatives not probabilities.','Flat5.09%10-year par yield used as annual-effective riskfree proxy at both terms; not zero curve.','500bp unsecured credit spread is analyst assumption, not measured AAOI debt yield.','Fixed point avoids adding option exercise shares or proceeds twice; simplified cross-dilution is not exact multi-claim contingent valuation.'])
(p/'option-inclusive-approximation.json').write_text(json.dumps(r,indent=2)+'\n')
print(json.dumps({k:r[k] for k in ['central','parameters']},indent=2));print('VOL',[(x['volatility'],x['commonPrice']) for x in r['volatilitySensitivities']]);print('CREDIT',[(x['creditSpreadAssumption'],x['commonPrice']) for x in r['creditSensitivities']]);print('INITIAL',r['initialVestedOnly']['commonPrice'])
