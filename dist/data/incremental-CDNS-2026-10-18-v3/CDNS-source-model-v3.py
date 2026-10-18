from pathlib import Path
import json,csv,math
B=Path(__file__).parent
CASES={
'down':{'fy26_revenue':6260,'fy26_gaap_margin':.2775,'growth':[.08,.07,.06,.05,.045,.04,.035,.03,.025,.02],'reference_v2_economic_margins':[.32,.31,.30,.30,.30,.30,.30,.30,.30,.30],'cash_tax':.28,'wacc':.12,'terminal_g':.02,'terminal_roic':.10,'incremental_roic':[.30,.28,.25,.22,.20,.18,.16,.14,.12,.10],'rd_pct':[.34]*10,'reference_v2_sbc_pct':[.10]*10},
'base':{'fy26_revenue':6300,'fy26_gaap_margin':.2825,'growth':[.14,.13,.12,.11,.10,.09,.08,.07,.06,.05],'reference_v2_economic_margins':[.335,.34,.345,.35,.35,.35,.35,.35,.35,.35],'cash_tax':.24,'wacc':.105,'terminal_g':.025,'terminal_roic':.15,'incremental_roic':[.40,.37,.34,.31,.28,.25,.22,.20,.175,.15],'rd_pct':[.33,.33,.325,.32,.32,.32,.32,.32,.32,.32],'reference_v2_sbc_pct':[.09]*10},
'up':{'fy26_revenue':6340,'fy26_gaap_margin':.2875,'growth':[.18,.17,.16,.15,.14,.12,.10,.09,.08,.07],'reference_v2_economic_margins':[.34,.35,.36,.37,.38,.38,.38,.38,.38,.38],'cash_tax':.21,'wacc':.0925,'terminal_g':.03,'terminal_roic':.20,'incremental_roic':[.50,.46,.42,.38,.34,.30,.27,.24,.22,.20],'rd_pct':[.33,.325,.32,.315,.31,.31,.31,.31,.31,.31],'reference_v2_sbc_pct':[.09,.09,.09,.09,.09,.0875,.0875,.0875,.085,.085]}}
FUTURE_GRANT_RATES={'down':.12,'base':.102,'up':.09}
for name,p in CASES.items():p['future_new_grant_pct']=FUTURE_GRANT_RATES[name]
H1={'revenue':3058.671,'gaap_ebit':881.644,'acquired_amortization':130.871,'capex':101.448,'nonacquired_da':70.740,'sbc':285.073}
def calc(p):
 stubrev=p['fy26_revenue']-H1['revenue'];accounting_sbc_stub=569-H1['sbc'];future_grant_stub=stubrev*p['future_new_grant_pct']
 fy_econ=p['fy26_revenue']*p['fy26_gaap_margin']+289+accounting_sbc_stub-future_grant_stub
 fullnopat=fy_econ*(1-p['cash_tax']);stubrev=p['fy26_revenue']-H1['revenue'];stubebit=fy_econ-H1['gaap_ebit']-H1['acquired_amortization'];stubnopat=stubebit*(1-p['cash_tax'])
 stubcapex=240-H1['capex'];stubda=H1['nonacquired_da'];stubnwc=.08*max(0,stubrev-H1['revenue']);stubtech=7;stubinv=stubcapex-stubda+stubnwc+stubtech
 rows=[{'period':'2026-H2','end':'2026-12-31','years_from_origin':.5,'revenue':stubrev,'growth':None,'economic_ebit':stubebit,'economic_margin':stubebit/stubrev,'cash_tax_rate':p['cash_tax'],'nopat':stubnopat,'net_reinvestment':stubinv,'fcff':stubnopat-stubinv,'rd_pct':None,'sbc_pct':None,'discount_factor':(1+p['wacc'])**-.5}]
 prevrev=p['fy26_revenue'];prevnopat=fullnopat
 for i,g in enumerate(p['growth']):
  rev=prevrev*(1+g);econ_margin=p['reference_v2_economic_margins'][i]+p['reference_v2_sbc_pct'][i]-p['future_new_grant_pct'];ebit=rev*econ_margin;nopat=ebit*(1-p['cash_tax']);inv=max(0,nopat-prevnopat)/p['incremental_roic'][i];t=1.5+i
  rows.append({'period':str(2027+i),'end':f'{2027+i}-12-31','years_from_origin':t,'revenue':rev,'growth':g,'economic_ebit':ebit,'economic_margin':econ_margin,'cash_tax_rate':p['cash_tax'],'nopat':nopat,'net_reinvestment':inv,'incremental_roic':p['incremental_roic'][i],'fcff':nopat-inv,'rd_pct':p['rd_pct'][i],'rd_expense_embedded_in_ebit':rev*p['rd_pct'][i],'sbc_pct':p['future_new_grant_pct'],'sbc_economic_expense_embedded_in_ebit':rev*p['future_new_grant_pct'],'pre_future_grant_ebit':rev*(p['reference_v2_economic_margins'][i]+p['reference_v2_sbc_pct'][i]),'discount_factor':(1+p['wacc'])**-t});prevrev=rev;prevnopat=nopat
 rows[0].update({'accounting_sbc_removed':accounting_sbc_stub,'future_new_grant_cost':future_grant_stub,'sbc_pct':p['future_new_grant_pct'],'sbc_economic_expense_embedded_in_ebit':future_grant_stub,'pre_future_grant_ebit':stubebit+future_grant_stub})
 for r in rows:
  r['pv_fcff']=r['fcff']*r['discount_factor']
  # Diagnostic accounting reconciliation only. Legacy amortization cancels exactly.
  start=0 if r['period']=='2026-H2' else r['years_from_origin']-1
  end=r['years_from_origin'];legacy=970.8*max(0,min(end,2.2)-min(start,2.2))/2.2
  r['illustrative_legacy_award_amortization']=legacy
  r['illustrative_accounting_like_ebit']=r['economic_ebit']-legacy
  r['legacy_reversal_to_economic_ebit']=legacy
 tn=rows[-1]['nopat']*(1+p['terminal_g']);ti=tn*p['terminal_g']/p['terminal_roic'];tf=tn-ti;tv=tf/(p['wacc']-p['terminal_g']);pvtv=tv*rows[-1]['discount_factor'];ev=sum(r['pv_fcff'] for r in rows)+pvtv
 return {'parameters':p,'origin':'2026-06-30','information_as_of':'2026-10-18','cashflow_timing':'Period-end: six-month stub then ten calendar fiscal years; no first-half actual cashflow included in PV.','FY2026_economic_ebit_usd_m':fy_econ,'rows':rows,'terminal':{'year':2037,'nopat':tn,'reinvestment_rate':p['terminal_g']/p['terminal_roic'],'net_reinvestment':ti,'fcff':tf,'enterprise_value':tv,'pv':pvtv},'operating_enterprise_value_usd_m':ev,'terminal_pct_ev':pvtv/ev,'unconditional_equity_value':None,'unconditional_per_share_value':None,'bridge_diagnostic_before_unresolved_claims_usd_m':ev+1251.443+91.392-2500,'bridge_diagnostic_warning':'Excludes uncertain claims/awards/private-investment credit and is NOT common equity value.'}
def allocate(v,claim_budget=500,rsu_shares=4.475463,option_shares=.994747,espp_shares=.30,cash_reserve=189,marketable_recovery=.75,private_credit=0):
 ev=v['operating_enterprise_value_usd_m'];cash=1440.443-cash_reserve;marketables=(11.165+80.227)*marketable_recovery
 pool=ev+cash+marketables+private_credit-2500-claim_budget;denom=275.393+rsu_shares+option_shares+espp_shares
 return {'financial_origin':'2026-06-30','information_as_of':'2026-10-18','status':'conditional analyst allocation; exact June inventory/claims unverified; not October target','operating_ev':ev,'excess_cash_credit':cash,'marketable_asset_credit':marketables,'private_asset_credit':private_credit,'debt_principal_deduction':2500,'all_in_residual_claim_budget':claim_budget,'pool_for_common_and_assumed_legacy_awards':pool,'legal_common_shares':275.393,'assumed_unissued_rsu_psu_ltp_maximum':rsu_shares,'assumed_options_full_shares':option_shares,'assumed_existing_espp_full_shares':espp_shares,'total_allocation_units':denom,'conditional_usd_per_share':pool/denom,'allocation_to_legal_common_equity':pool/denom*275.393,'allocation_to_assumed_unissued_legacy_awards':pool/denom*(rsu_shares+option_shares+espp_shares),'option_espp_exercise_proceeds_credit':0,'conditions':'Capital-claims.json records assumptions, sensitivity intervals and irreducible gaps. No claim that the residual budget suffices or award count is complete.'}

def main():
 result={k:calc(v) for k,v in CASES.items()};
 for v in result.values():v['conditional_equity_allocation']=allocate(v)
 (B/'valuation-results.json').write_text(json.dumps(result,indent=2))
 rows=[{'scenario':k,**r} for k,v in result.items() for r in v['rows']];fields=list(dict.fromkeys(z for r in rows for z in r))
 with (B/'forecast-dated.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
 sens=[]
 for w in [.085,.095,.105,.115,.125]:
  for g in [.02,.025,.03]:
   for roic in [.10,.15,.20]:
    p={**CASES['base'],'wacc':w,'terminal_g':g,'terminal_roic':roic};v=calc(p);sens.append({'wacc':w,'terminal_g':g,'terminal_roic':roic,'operating_ev_usd_m':v['operating_enterprise_value_usd_m']})
 (B/'sensitivity.json').write_text(json.dumps(sens,indent=2))
 (B/'forecast-methodology.json').write_text(json.dumps({'basis':'USD millions; June30 origin, October18 information. Analyst assumptions; no price fit.','stub':'GAAP revenue/margin midpoint plus289 acquired amortization; remove283.927 H2 accounting SBC and substitute economic post-origin new-grant cost at scenario rate. Keep R&D, integration and recurring rent expensed.','future_grants':'12% downside,10.2% base,9% upside. Gross-grant proxy, not GAAP expense. Full existing legacy awards allocated separately; no future-grant denominator dilution. Hold pre-SBC margins fixed relative to v2.','legacy_awards':'The970.8 unrecognized accounting balance is neither a new cash deduction nor a PV benefit. Illustrative legacy recognition is subtracted and reversed identically. Its timing has zero valuation effect.','reinvestment':'H2 capex240 minus H1capex101.448, less ordinaryDA70.740, plus8% positive sequential revenue growth and7 purchasedtechnology. FY27 onward positive incremental NOPAT divided by declining incremental ROIC. Annual net investment is recomputed after grant normalization.','terminal':'Next-year NOPAT times(1-g/ROIC); unchanged scenario WACC/g/terminal ROIC. Lower margin changes terminal earnings and funded reinvestment together.','tax':'24% base,28% down,21% up. No incremental legacy vesting tax windfall, no DTA credit.','allocation':'EV+excesscash+haircut marketableassets-debtface-all-in non-operating claim budget; allocate among June legalcommon plus assumed unissued legacyawards. Already-issued restricted stock included only once.','gates':'Conditional dated allocation only. Exact June inventory and aggregateclaim adequacy unverified. Current-date target/import remain gated.'},indent=2))
 # Vary one source of uncertainty at a time; no silently offsetting non-SBC cost change.
 claim_grid=[]
 for name,v in result.items():
  for c in [250,500,800]:
   for a in [3.547462,4.475463,6.0]:
    z=allocate(v,claim_budget=c,rsu_shares=a);claim_grid.append({'case':name,'claim_budget':c,'rsu_maximum_assumption':a,'conditional_usd_per_share':z['conditional_usd_per_share']})
 (B/'conditional-allocation-sensitivity.json').write_text(json.dumps(claim_grid,indent=2))
 grant_grid=[]
 for rate in [.09,.10,.102,.11,.12]:
  p={**CASES['base'],'future_new_grant_pct':rate};v=calc(p);z=allocate(v);grant_grid.append({'future_new_grant_cost_pct':rate,'operating_ev':v['operating_enterprise_value_usd_m'],'conditional_usd_per_share':z['conditional_usd_per_share']})
 (B/'future-grant-sensitivity.json').write_text(json.dumps(grant_grid,indent=2))
 print({k:{'ev_billion':round(v['operating_enterprise_value_usd_m']/1000,3),'terminal_pct':round(v['terminal_pct_ev']*100,1)} for k,v in result.items()})
if __name__=='__main__':main()
