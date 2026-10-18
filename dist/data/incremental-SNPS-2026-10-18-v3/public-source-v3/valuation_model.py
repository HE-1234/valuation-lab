"""Reproducible analyst DCF. USD millions. No stock-price input or unconditional equity output."""
from pathlib import Path
from datetime import date
import json,csv
B=Path(__file__).parent
CASES={
'down':{'q4_revenue':2530,'q4_gaap_expense':2300,'q4_acquired_amortization':405,'fy27_revenue':10600,'growth_after_27':[.09,.08,.07,.06,.05,.04,.03,.025,.02],'v2_reference_economic_margins':[.315,.32,.32,.315,.31,.305,.30,.30,.30,.30],'incremental_roic':[.35,.32,.28,.25,.22,.19,.16,.13,.10,.08],'cash_tax':.28,'wacc':.12,'terminal_g':.02,'terminal_roic':.08,'rd_pct':[.30]*10,'v2_reference_sbc_pct':[.095]*10},
'base':{'q4_revenue':2555,'q4_gaap_expense':2262.5,'q4_acquired_amortization':402.5,'fy27_revenue':11150,'growth_after_27':[.15,.15,.15,.13,.11,.09,.07,.05,.04],'v2_reference_economic_margins':[3860/11150,.36,.375,.385,.39,.39,.39,.39,.39,.39],'incremental_roic':[.50,.45,.40,.35,.30,.25,.21,.18,.15,.12],'cash_tax':.24,'wacc':.105,'terminal_g':.025,'terminal_roic':.12,'rd_pct':[.285,.28,.275,.27,.27,.27,.27,.27,.27,.27],'v2_reference_sbc_pct':[970/11150,.085,.0825,.08,.08,.08,.08,.08,.08,.08]},
'up':{'q4_revenue':2580,'q4_gaap_expense':2225,'q4_acquired_amortization':400,'fy27_revenue':11200,'growth_after_27':[.18,.18,.17,.15,.13,.11,.09,.07,.06],'v2_reference_economic_margins':[.35,.38,.40,.42,.43,.43,.43,.43,.43,.43],'incremental_roic':[.60,.55,.50,.45,.40,.35,.30,.25,.20,.15],'cash_tax':.21,'wacc':.095,'terminal_g':.03,'terminal_roic':.15,'rd_pct':[.28,.275,.27,.265,.26,.26,.26,.26,.26,.26],'v2_reference_sbc_pct':[.087,.085,.082,.08,.08,.08,.08,.08,.08,.08]}}
NEW_GRANTS={'down':.15,'base':.12,'up':.10}
Q4_ACCOUNTING_SBC={'down':240,'base':235,'up':230}
for name,p in CASES.items():
 p['future_new_grant_pct']=NEW_GRANTS[name];p['q4_accounting_sbc_removed']=Q4_ACCOUNTING_SBC[name]
YTD={'revenue':7161.605,'gaap_ebit':680.963,'acquired_amortization':1210.292,'capex':156.089,'da':1362.021,'restructuring_charge':236.340,'restructuring_cash_paid':171.4,'restructuring_liability':64.9}
ORIGIN=date(2026,7,31)
OPENING_IC=31151.379+10110.449-3607.669+291.45

def calc(p, funding_mode="revenue_growth"):
 grant_rate=p["future_new_grant_pct"]
 stubebit=p['q4_revenue']-p['q4_gaap_expense']+p['q4_acquired_amortization']+p['q4_accounting_sbc_removed']-p['q4_revenue']*grant_rate;stubnopat=stubebit*(1-p['cash_tax'])
 capex=225-YTD['capex'];da=(YTD['da']-YTD['acquired_amortization'])/3;nwc=.08*max(0,p['q4_revenue']-2476.822);inv=capex-da+nwc;legacy=64.9
 def timing(y):return (date(y,10,31)-ORIGIN).days/365.25
 rows=[{'period':'FY2026-Q4','end':'2026-10-31','years_from_origin':timing(2026),'revenue':p['q4_revenue'],'growth':None,'economic_ebit':stubebit,'economic_margin':stubebit/p['q4_revenue'],'cash_tax_rate':p['cash_tax'],'nopat':stubnopat,'net_reinvestment':inv,'legacy_restructuring_cash':legacy,'fcff':stubnopat-inv-legacy,'capex':capex,'nonacquired_da':da,'incremental_working_capital':nwc,'rd_pct':None,'sbc_pct':None,'discount_factor':(1+p['wacc'])**-timing(2026)}]
 rev=YTD['revenue']+p['q4_revenue'];annual26=rev;capital=OPENING_IC+inv
 # Normalize the full-year earnings reference only for total-NOPAT investment stress. No past cash flow is revalued.
 annual26_normalized_ebit=YTD['gaap_ebit']+YTD['acquired_amortization']+712.631-YTD['revenue']*grant_rate+stubebit
 previous_nopat=annual26_normalized_ebit*(1-p['cash_tax'])
 for i in range(10):
  prev=rev;rev=p['fy27_revenue'] if i==0 else rev*(1+p['growth_after_27'][i-1]);g=rev/prev-1;m=p['v2_reference_economic_margins'][i]+p['v2_reference_sbc_pct'][i]-grant_rate;ebit=rev*m;nopat=ebit*(1-p['cash_tax']);rinv=max(0,rev-prev)*m*(1-p['cash_tax'])/p['incremental_roic'][i]
  if funding_mode=='total_nopat':rinv=max(0,nopat-previous_nopat)/p['incremental_roic'][i]
  previous_nopat=nopat
  # Known FY27 capex floor, ordinary D&A and noncash working capital; no free growth.
  floor=(500-210+.08*max(0,rev-prev)) if i==0 else 0
  rinv=max(rinv,floor);capital+=rinv;t=timing(2027+i)
  rows.append({'period':f'FY{2027+i}','end':f'{2027+i}-10-31','years_from_origin':t,'revenue':rev,'growth':g,'economic_ebit':ebit,'economic_margin':m,'cash_tax_rate':p['cash_tax'],'nopat':nopat,'net_reinvestment':rinv,'legacy_restructuring_cash':0,'incremental_roic':p['incremental_roic'][i],'known_investment_floor':floor,'fcff':nopat-rinv,'rd_pct':p['rd_pct'][i]+.5*(grant_rate-p['v2_reference_sbc_pct'][i]),'rd_expense_embedded_in_ebit':rev*(p['rd_pct'][i]+.5*(grant_rate-p['v2_reference_sbc_pct'][i])),'sbc_pct':grant_rate,'sbc_expense_embedded_in_ebit':rev*grant_rate,'pre_future_grant_ebit':rev*(p['v2_reference_economic_margins'][i]+p['v2_reference_sbc_pct'][i]),'diagnostic_cumulative_invested_capital':capital,'diagnostic_nopat_to_closing_capital':nopat/capital,'discount_factor':(1+p['wacc'])**-t})
 rows[0].update({'sbc_pct':grant_rate,'sbc_expense_embedded_in_ebit':p['q4_revenue']*grant_rate,'pre_future_grant_ebit':stubebit+p['q4_revenue']*grant_rate,'accounting_sbc_removed':p['q4_accounting_sbc_removed']})
 previous_time=0
 for r in rows:
  r['pv_fcff']=r['fcff']*r['discount_factor'];end=r['years_from_origin']
  legacy=1400*max(0,min(end,1.9)-min(previous_time,1.9))/1.9+105.6*max(0,min(end,2)-min(previous_time,2))/2
  r['legacy_accounting_recognition_diagnostic']=legacy;r['accounting_like_ebit_diagnostic']=r['economic_ebit']-legacy;r['matched_legacy_reversal']=legacy;previous_time=end
 tn=rows[-1]['nopat']*(1+p['terminal_g']);ti=tn*p['terminal_g']/p['terminal_roic'];tf=tn-ti;tv=tf/(p['wacc']-p['terminal_g']);pvtv=tv*rows[-1]['discount_factor'];ev=sum(r['pv_fcff'] for r in rows)+pvtv
 return {'parameters':p,'funding_mode':funding_mode,'FY2026_normalized_ebit_reference_only':annual26_normalized_ebit,'financial_origin':'2026-07-31','information_as_of':'2026-10-18','cashflow_timing':'Exact day-count ACT/365.25 to each October31 period-end; Q4 stub plus ten fiscal years. No YTD actual operating cashflow in PV.','FY2026_reconstructed_revenue':annual26,'FY2026_reconstructed_economic_ebit':YTD['gaap_ebit']+YTD['acquired_amortization']+stubebit,'rows':rows,'terminal':{'year':2037,'nopat':tn,'reinvestment_rate':p['terminal_g']/p['terminal_roic'],'net_reinvestment':ti,'fcff':tf,'enterprise_value':tv,'pv':pvtv},'operating_enterprise_value_usd_m':ev,'terminal_pct_ev':pvtv/ev,'unconditional_equity_value':None,'unconditional_per_share_value':None,'unadjusted_reference_bridge_before_v3_allocation_usd_m':ev+3314.836+1.383+.684-10110.449-170.462,'bridge_warning':'Unadjusted reference only, before v3 foreign-cash haircut, current-tax deduction, residual allowance and legacy allocation. Use conditional_allocation for the specified assumptions. Not exact common equity or a current target; ASR excluded.'}

def allocate(v,residual_allowance=350,rsus=4.318,options=1.154,espp=1.0,foreign_haircut=.10,cash_reserve=291.45,marketable_recovery=.75,extra_fx_claim=0):
 cash_before=3606.286-cash_reserve;foreign_adjustment=cash_before*.46*foreign_haircut;cash_credit=cash_before-foreign_adjustment;liquid=(1.383+.684)*marketable_recovery
 pool=v['operating_enterprise_value_usd_m']+cash_credit+liquid-10110.449-170.462-88.454-residual_allowance-extra_fx_claim;units=191.605+rsus+options+espp;unit_value=pool/units
 return {'financial_origin':'2026-07-31','information_as_of':'2026-10-18','status':'Explicitly conditional July-origin analyst allocation, not a verified July equity value or October target.','operating_ev':v['operating_enterprise_value_usd_m'],'cash_before_foreign_haircut':cash_before,'foreign_cash_haircut_amount':foreign_adjustment,'excess_cash_credit':cash_credit,'marketable_asset_credit':liquid,'private_contingent_asset_credit':0,'debt_principal':10110.449,'accrued_interest':170.462,'current_tax_accrual':88.454,'residual_claim_allowance':residual_allowance,'extra_unfunded_nonoperating_fx_claim':extra_fx_claim,'pool_for_common_and_assumed_legacy_awards':pool,'legal_common_m':191.605,'assumed_unissued_legacy_rsus_m':rsus,'assumed_full_option_units_m':options,'assumed_existing_espp_units_m':espp,'total_allocation_units_m':units,'conditional_usd_per_common_share':unit_value,'allocation_to_legal_common_equity':unit_value*191.605,'allocation_to_assumed_unissued_awards':unit_value*(rsus+options+espp),'option_espp_exercise_proceeds_credit':0,'post_origin_asr_applied':False,'conditions':'See capital-claims.json for inventory assumptions, allowance adequacy, overlap exclusions and non-bounded stress intervals.'}

def main():
 r={k:calc(p) for k,p in CASES.items()};
 for v in r.values():v['conditional_allocation']=allocate(v)
 (B/'valuation-results.json').write_text(json.dumps(r,indent=2));rows=[{'scenario':k,**v} for k,x in r.items() for v in x['rows']];fields=list(dict.fromkeys(z for x in rows for z in x))
 with (B/'forecast-dated.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
 s=[]
 for w in [.085,.095,.105,.115,.125]:
  for g in [.02,.025,.03]:
   for ri in [.08,.12,.15]:
    v=calc({**CASES['base'],'wacc':w,'terminal_g':g,'terminal_roic':ri});s.append({'wacc':w,'g':g,'terminal_roic':ri,'ev':v['operating_enterprise_value_usd_m']})
 (B/'sensitivity.json').write_text(json.dumps(s,indent=2))
 extra_outputs(r)
 print({k:{'ev_billion':v['operating_enterprise_value_usd_m']/1000,'terminal_percent':100*v['terminal_pct_ev'],'fy27_fcff':v['rows'][1]['fcff']} for k,v in r.items()})
def extra_outputs(result):
 grid=[]
 for k,v in result.items():
  for claim in [200,350,700]:
   for rsus in [3.0,4.318,6.0]:
    a=allocate(v,residual_allowance=claim,rsus=rsus);grid.append({'case':k,'residual_allowance':claim,'rsu_assumption_m':rsus,'conditional_usd_per_share':a['conditional_usd_per_common_share']})
 (B/'conditional-allocation-sensitivity.json').write_text(json.dumps(grid,indent=2))
 cost=[]
 for rate in [.08,.10,.11,.12,.13,.15]:
  v=calc({**CASES['base'],'future_new_grant_pct':rate});cost.append({'future_grant_pct':rate,'ev':v['operating_enterprise_value_usd_m'],'conditional_usd_per_share':allocate(v)['conditional_usd_per_common_share']})
 (B/'future-grant-sensitivity.json').write_text(json.dumps(cost,indent=2))
 bridge=[]
 for k,choices in [('options',[.7,1.154,1.5]),('espp',[.5,1,1.5]),('foreign_haircut',[0,.10,.25]),('cash_reserve',[291.45,500,1000]),('marketable_recovery',[.5,.75,1]),('extra_fx_claim',[0,20.401])]:
  for x in choices:bridge.append({'parameter':k,'assumption':x,'conditional_usd_per_share':allocate(result['base'],**{k:x})['conditional_usd_per_common_share']})
 (B/'capital-assumption-sensitivity.json').write_text(json.dumps(bridge,indent=2))
 funding={}
 for k,v in result.items():
  z=calc(CASES[k],funding_mode='total_nopat');funding[k]={'revenue_growth_funded_ev':v['operating_enterprise_value_usd_m'],'all_positive_normalized_nopat_growth_funded_ev':z['operating_enterprise_value_usd_m'],'conditional_usd_per_share':allocate(z)['conditional_usd_per_common_share'],'normalized_FY2026_earnings_reference':z['FY2026_normalized_ebit_reference_only'],'rows':z['rows']}
 (B/'funding-method-stress.json').write_text(json.dumps({'basis':'v3 grant-normalized earnings, using a like-for-like FY26 normalized profit reference only for investment calculation. No prior-period cash flow is valued again. Same known FY27 capex floor.','scenarios':funding},indent=2))

if __name__=='__main__':main()
