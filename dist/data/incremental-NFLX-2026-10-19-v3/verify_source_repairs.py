"""Targeted raw-primary checks for v2; requires retained sources and lxml.
Offline public replay does not require this optional source-audit script.
"""
from pathlib import Path
from lxml import html
import json,hashlib,re
R=Path(__file__).resolve().parent
checks=[]
def check(name,condition,source,locator,value):
 checks.append({'name':name,'pass':bool(condition),'source_file':source,'source_sha256':hashlib.sha256((R/source).read_bytes()).hexdigest(),'locator':locator,'observed':value})
qfile='sources/nflx-20260630.htm';q=html.fromstring((R/qfile).read_bytes());text=' '.join(q.text_content().split());tables=q.xpath('//table')
# These short substrings distinguish payments made from future deposits.
i=text.find('$729 million');context=text[i:i+210]
check('Brazil paid H1 rather than future unpaid reserve','$729 million' in context and 'payments made' in context and 'Brazil' in context,qfile,'MD&A Liquidity and Capital Resources, H1 cash flow discussion',{'paid_usdm':729,'payment_status':'made in H1; reflected in June cash'})
t27=' '.join(tables[27].text_content().split());match=re.search(r'Interest rate contracts\s*236\s+1,124\s+—\s+14,934',t27)
check('Financing interest-rate net liability',bool(match),qfile,'Note 8, zero-indexed HTML table 27, interest rate contracts row',{'asset_current_usdm':.236,'asset_noncurrent_usdm':1.124,'liability_noncurrent_usdm':14.934,'net_liability_usdm':round(14.934-.236-1.124,3)})
t26=' '.join(tables[26].text_content().split())
check('Financing notionals separately inventoried','Fair value hedges2,934,991' in t26 and 'Fair value hedges1,400,000' in t26,qfile,'Note 8, zero-indexed HTML table 26',{'fx_fair_value_hedge_notional_usdm':2934.991,'interest_fair_value_hedge_notional_usdm':1400})
check('Carrying debt includes hedge basis adjustment','net of $49 million of issuance costs and discounts and $14 million of fair value hedging adjustments' in text,qfile,'Note 7 opening paragraph',{'basis_adjustment_rounded_usdm':-14,'face_convention_does_not_subtract_again':True})
kfile='sources/nflx-20251231.htm';kt=' '.join(html.fromstring((R/kfile).read_bytes()).text_content().split());ix=kt.find('$47 million of total unrecognized compensation');fragment=kt[ix:ix+230]
check('Prior-year remaining award expense is stale context','$47 million' in fragment and '1.53 years' in fragment,kfile,'Stock-based compensation discussion after compensation table',{'as_of':'2025-12-31','unrecognized_compensation_usdm':47,'weighted_remaining_years':1.53,'june_remaining_amount':None})
afile='sources/issuer-q3-announcement.html';at=' '.join(html.fromstring((R/afile).read_bytes()).text_content().split())
check('Retained issuer release substantiates Q3 date','October 20th, 2026' in at and '1:01 p.m. Pacific Time' in at and 'Sep 14, 2026' in at,afile,'September 14 issuer announcement, release body',{'announcement_date':'2026-09-14','scheduled_results_date':'2026-10-20','scheduled_time':'13:01 Pacific approximately','results_included':False})
shell='sources/issuer-events.html';st=' '.join(html.fromstring((R/shell).read_bytes()).text_content().split())
check('Old event shell not reused as date evidence',not any(x in st for x in ['October 20','2026-10-20','10/20/2026']),shell,'Archived dynamic shell; retained only for provenance history',{'substantiates_q3_date':False})
t38=' '.join(tables[38].text_content().split())
check('H1 grant cost context, not exact June remaining cost','Granted(1)1,245,383 82.91' in t38,qfile,'Note 10, zero-indexed HTML table 38',{'granted_units_m':1.245383,'weighted_grant_date_value_usd':82.91,'derived_grant_value_usdm':1.245383*82.91,'rounded_source_context_envelope_usdm':47+1.245383*82.91,'exact_june_unrecognized_cost':None})
check('RSU existing award vesting horizon','RSU awards vest quarterly over a three-year period' in text,qfile,'Note 10 Restricted Stock Unit Activity',{'rsu_vesting_years':3,'supported_maximum_remaining_date_from_june':'2029-06-30'})
check('PSU performance horizon','PSU awards have performance periods ranging from one to three years' in text,qfile,'Note 10 Restricted Stock Unit Activity',{'psu_performance_years_min':1,'psu_performance_years_max':3,'exact_grant_schedule_known':False})
check('H1 grants include prior-period settlement context','264,300 PSU awards that were granted and 528,600 PSU awards that vested' in text,qfile,'Note 10 table 38 footnote 1',{'prior_period_psu_units_granted':264300,'prior_period_psu_units_vested':528600,'source_context_overstates_remaining_cost_if_all_grants_treated_as_future':True})
kt61=' '.join(html.fromstring((R/kfile).read_bytes()).xpath('//table')[61].text_content().split())
check('Historical compensation floor source context','Total stock-based compensation expense$368,449 $272,588 $339,368' in kt61,kfile,'Zero-indexed HTML table 61, FY2025 stock-based compensation',{'fy2025_sbc_usdm':368.449,'fy2025_revenue_usdm_from_historical_provenance':45183.036,'restricted_policy_compensation_floor_ratio':368.449/45183.036,'future_expense_is_assumed_not_reported':True})
result={'status':'pass' if all(c['pass'] for c in checks) else 'FAIL','checks':checks,'limitation':'Focused source reconciliation, not an exhaustive audit; raw issuer captures excluded from public ZIP.'}
(R/'source-repair-checks-v3.json').write_text(json.dumps(result,indent=2)+'\n')
print(result['status'],len(checks),'source repair checks')
if result['status']!='pass':raise SystemExit(json.dumps([c for c in checks if not c['pass']],indent=2))
